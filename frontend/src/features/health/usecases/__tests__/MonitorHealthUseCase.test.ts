import { Result } from "@praha/byethrow";
import { describe, expect, test, vi } from "vitest";
import { HealthEntity } from "../../domain/entities/Health";
import { HealthRepositoryError } from "../../domain/repositories/HealthRepository";
import {
	createMonitorHealthUseCase,
	MonitorHealthUseCaseError,
	monitorHealthUseCase,
} from "../MonitorHealthUseCase";

describe("MonitorHealthUseCase", () => {
	// モックリポジトリの作成
	const createMockRepository = (): {
		getHealth: ReturnType<typeof vi.fn>;
		monitorHealth: ReturnType<typeof vi.fn>;
	} => ({
		getHealth: vi.fn(),
		monitorHealth: vi.fn(),
	});

	// テスト用ヘルスデータの作成
	const createTestHealths = () => {
		const healthResults = [
			HealthEntity.create(
				"123e4567-e89b-12d3-a456-426614174001",
				"healthy",
				new Date(),
				{ service: "api" },
			),
			HealthEntity.create(
				"123e4567-e89b-12d3-a456-426614174002",
				"degraded",
				new Date(),
				{ service: "db" },
			),
			HealthEntity.create(
				"123e4567-e89b-12d3-a456-426614174003",
				"unhealthy",
				new Date(),
				{ service: "cache" },
			),
		];

		return healthResults.map((result) => {
			if (Result.isFailure(result)) {
				throw new Error("Failed to create test health");
			}
			return result.value;
		});
	};

	describe("monitorHealthUseCase", () => {
		test("リポジトリが成功した場合、監視結果を返すこと", async () => {
			const mockRepository = createMockRepository();
			const testHealths = createTestHealths();

			mockRepository.monitorHealth.mockResolvedValue(
				Result.succeed(testHealths),
			);

			const useCase = monitorHealthUseCase(mockRepository);
			const result = await useCase();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				const monitorResult = result.value;
				expect(monitorResult.individualHealths).toEqual(testHealths);
				expect(monitorResult.stats.total).toBe(3);
				expect(monitorResult.stats.healthy).toBe(1);
				expect(monitorResult.stats.degraded).toBe(1);
				expect(monitorResult.stats.unhealthy).toBe(1);
				expect(monitorResult.overallStatus).toBe("unhealthy");
				expect(monitorResult.timestamp).toBeInstanceOf(Date);
				expect(Array.isArray(monitorResult.criticalIssues)).toBe(true);
				expect(Array.isArray(monitorResult.recommendations)).toBe(true);
			}
			expect(mockRepository.monitorHealth).toHaveBeenCalledOnce();
		});

		test("リポジトリが失敗した場合、エラーを返すこと", async () => {
			const mockRepository = createMockRepository();
			const repositoryError = HealthRepositoryError.apiError("API failed");

			mockRepository.monitorHealth.mockResolvedValue(
				Result.fail(repositoryError),
			);

			const useCase = monitorHealthUseCase(mockRepository);
			const result = await useCase();

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(MonitorHealthUseCaseError);
				expect(result.error.code).toBe("REPOSITORY_ERROR");
				expect(result.error.cause).toBe(repositoryError);
			}
		});

		test("空のヘルス配列を処理すること", async () => {
			const mockRepository = createMockRepository();

			mockRepository.monitorHealth.mockResolvedValue(Result.succeed([]));

			const useCase = monitorHealthUseCase(mockRepository);
			const result = await useCase();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				const monitorResult = result.value;
				expect(monitorResult.individualHealths).toEqual([]);
				expect(monitorResult.stats.total).toBe(0);
				expect(monitorResult.overallStatus).toBe("unhealthy");
				expect(monitorResult.criticalIssues).toContain(
					"No health data available",
				);
			}
		});
	});

	describe("createMonitorHealthUseCase", () => {
		test("executeメソッドを持つユースケースを作成すること", () => {
			const mockRepository = createMockRepository();
			const useCase = createMonitorHealthUseCase(mockRepository);

			expect(useCase).toHaveProperty("execute");
			expect(typeof useCase.execute).toBe("function");
		});

		test("ファクトリーを通じてユースケースを実行すること", async () => {
			const mockRepository = createMockRepository();
			const testHealths = createTestHealths();

			mockRepository.monitorHealth.mockResolvedValue(
				Result.succeed(testHealths),
			);

			const useCase = createMonitorHealthUseCase(mockRepository);
			const result = await useCase.execute();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.individualHealths).toEqual(testHealths);
			}
		});
	});

	describe("MonitorHealthUseCaseError", () => {
		test("メッセージとコードでエラーを作成できること", () => {
			const error = new MonitorHealthUseCaseError("Test error", "TEST_CODE");

			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_CODE");
			expect(error.name).toBe("MonitorHealthUseCaseError");
			expect(error.cause).toBeUndefined();
		});

		describe("エラーファクトリーメソッド", () => {
			test("リポジトリエラーを作成できること", () => {
				const error =
					MonitorHealthUseCaseError.repositoryError("Repository failed");

				expect(error.message).toBe("Repository failed");
				expect(error.code).toBe(
					MonitorHealthUseCaseError.CODES.REPOSITORY_ERROR,
				);
				expect(error).toBeInstanceOf(MonitorHealthUseCaseError);
			});

			test("ドメインサービスエラーを作成できること", () => {
				const error = MonitorHealthUseCaseError.domainServiceError(
					"Domain service failed",
				);

				expect(error.message).toBe("Domain service failed");
				expect(error.code).toBe(
					MonitorHealthUseCaseError.CODES.DOMAIN_SERVICE_ERROR,
				);
			});
		});
	});
});
