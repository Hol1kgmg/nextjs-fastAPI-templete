import { Result } from "@praha/byethrow";
import { describe, expect, test, vi } from "vitest";
import { HealthEntity } from "../../domain/entities/Health";
import { HealthRepositoryError } from "../../domain/repositories/HealthRepository";
import {
	createGetHealthUseCase,
	GetHealthUseCaseError,
	getHealthUseCase,
} from "../GetHealthUseCase";

describe("GetHealthUseCase", () => {
	// モックリポジトリの作成
	const createMockRepository = (): {
		getHealth: ReturnType<typeof vi.fn>;
		monitorHealth: ReturnType<typeof vi.fn>;
	} => ({
		getHealth: vi.fn(),
		monitorHealth: vi.fn(),
	});

	// テスト用ヘルスデータの作成
	const createTestHealth = () => {
		const healthResult = HealthEntity.create(
			"123e4567-e89b-12d3-a456-426614174000",
			"healthy",
			new Date(),
			{ service: "test" },
		);
		if (Result.isFailure(healthResult)) {
			throw new Error("Failed to create test health");
		}
		return healthResult.value;
	};

	describe("getHealthUseCase", () => {
		test("リポジトリが成功した場合、ヘルス情報を返すこと", async () => {
			const mockRepository = createMockRepository();
			const testHealth = createTestHealth();

			mockRepository.getHealth.mockResolvedValue(Result.succeed(testHealth));

			const useCase = getHealthUseCase(mockRepository);
			const result = await useCase();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value).toEqual(testHealth);
			}
			expect(mockRepository.getHealth).toHaveBeenCalledOnce();
		});

		test("リポジトリが失敗した場合、エラーを返すこと", async () => {
			const mockRepository = createMockRepository();
			const repositoryError = HealthRepositoryError.apiError("API failed");

			mockRepository.getHealth.mockResolvedValue(Result.fail(repositoryError));

			const useCase = getHealthUseCase(mockRepository);
			const result = await useCase();

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(GetHealthUseCaseError);
				expect(result.error.code).toBe("REPOSITORY_ERROR");
				expect(result.error.cause).toBe(repositoryError);
			}
		});
	});

	describe("createGetHealthUseCase", () => {
		test("executeメソッドを持つユースケースを作成すること", () => {
			const mockRepository = createMockRepository();
			const useCase = createGetHealthUseCase(mockRepository);

			expect(useCase).toHaveProperty("execute");
			expect(typeof useCase.execute).toBe("function");
		});

		test("ファクトリーを通じてユースケースを実行すること", async () => {
			const mockRepository = createMockRepository();
			const testHealth = createTestHealth();

			mockRepository.getHealth.mockResolvedValue(Result.succeed(testHealth));

			const useCase = createGetHealthUseCase(mockRepository);
			const result = await useCase.execute();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value).toEqual(testHealth);
			}
		});
	});

	describe("GetHealthUseCaseError", () => {
		test("メッセージとコードでエラーを作成できること", () => {
			const error = new GetHealthUseCaseError("Test error", "TEST_CODE");

			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_CODE");
			expect(error.name).toBe("GetHealthUseCaseError");
			expect(error.cause).toBeUndefined();
		});

		test("原因エラーを含むエラーを作成できること", () => {
			const cause = new Error("Original error");
			const error = new GetHealthUseCaseError("Test error", "TEST_CODE", cause);

			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_CODE");
			expect(error.cause).toBe(cause);
		});

		describe("エラーファクトリーメソッド", () => {
			test("リポジトリエラーを作成できること", () => {
				const error =
					GetHealthUseCaseError.repositoryError("Repository failed");

				expect(error.message).toBe("Repository failed");
				expect(error.code).toBe(GetHealthUseCaseError.CODES.REPOSITORY_ERROR);
				expect(error).toBeInstanceOf(GetHealthUseCaseError);
			});

			test("バリデーションエラーを作成できること", () => {
				const error =
					GetHealthUseCaseError.validationError("Validation failed");

				expect(error.message).toBe("Validation failed");
				expect(error.code).toBe(GetHealthUseCaseError.CODES.VALIDATION_ERROR);
			});

			test("予期しないエラーを作成できること", () => {
				const error = GetHealthUseCaseError.unexpectedError("Unexpected error");

				expect(error.message).toBe("Unexpected error");
				expect(error.code).toBe(GetHealthUseCaseError.CODES.UNEXPECTED_ERROR);
			});
		});

		describe("エラーコード", () => {
			test("すべての必要なエラーコードを持つこと", () => {
				const codes = GetHealthUseCaseError.CODES;

				expect(codes.REPOSITORY_ERROR).toBe("REPOSITORY_ERROR");
				expect(codes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
				expect(codes.UNEXPECTED_ERROR).toBe("UNEXPECTED_ERROR");
			});
		});
	});
});
