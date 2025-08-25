import { Result } from "@praha/byethrow";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as baseActions from "@/actions/baseActions";
import { HealthRepositoryError } from "../../../domain/repositories/HealthRepository";
import {
	createHealthApiGateway,
	getHealth,
	HealthApiGateway,
	monitorHealth,
} from "../HealthApiGateway";

// baseActionsモジュールをモック化
vi.mock("@/actions/baseActions", () => ({
	createApiAction: vi.fn(),
}));

describe("HealthApiGateway", () => {
	const mockCreateApiAction = vi.mocked(baseActions.createApiAction);

	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("getHealth", () => {
		test("開発環境でモックデータを返すこと", async () => {
			vi.stubEnv("NODE_ENV", "development");

			const result = await getHealth();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.status).toBe("healthy");
				expect(result.value.details).toEqual({
					service: "mock-api",
					timestamp: expect.any(String),
				});
			}
			expect(mockCreateApiAction).not.toHaveBeenCalled();
		});

		test("本番環境でAPIを呼び出し成功すること", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const mockApiResponse = {
				status: "success",
				data: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					status: "healthy",
					timestamp: "2023-01-01T00:00:00.000Z",
					details: { cpu: 50 },
				},
			};

			mockCreateApiAction.mockResolvedValue(Result.succeed(mockApiResponse));

			const result = await getHealth();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.status).toBe("healthy");
				expect(result.value.details).toEqual({ cpu: 50 });
			}
			expect(mockCreateApiAction).toHaveBeenCalledWith("/api/health");
		});

		test("本番環境でAPI呼び出し失敗時にエラーを返すこと", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const mockApiError = {
				message: "Network error",
				code: "NETWORK_ERROR",
			};

			mockCreateApiAction.mockResolvedValue(Result.fail(mockApiError));

			const result = await getHealth();

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(HealthRepositoryError);
				expect(result.error.code).toBe("API_ERROR");
				expect(result.error.message).toContain("Health API call failed");
			}
		});

		test("本番環境でマッピング失敗時にエラーを返すこと", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const invalidApiResponse = {
				// invalid response format
				invalidField: "invalid",
			};

			mockCreateApiAction.mockResolvedValue(Result.succeed(invalidApiResponse));

			const result = await getHealth();

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(HealthRepositoryError);
				expect(result.error.code).toBe("MAPPING_ERROR");
				expect(result.error.message).toContain(
					"Health response mapping failed",
				);
			}
		});
	});

	describe("monitorHealth", () => {
		test("開発環境でモック配列データを返すこと", async () => {
			vi.stubEnv("NODE_ENV", "development");

			const result = await monitorHealth();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value).toHaveLength(3);
				expect(result.value[0].status).toBe("healthy");
				expect(result.value[1].status).toBe("degraded");
				expect(result.value[2].status).toBe("unhealthy");
				expect(result.value[0].details).toEqual({ service: "api-gateway" });
				expect(result.value[1].details).toEqual({ service: "database" });
				expect(result.value[2].details).toEqual({ service: "cache" });
			}
			expect(mockCreateApiAction).not.toHaveBeenCalled();
		});

		test("本番環境でAPIを呼び出し成功すること", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const mockApiListResponse = {
				status: "success",
				data: [
					{
						id: "123e4567-e89b-12d3-a456-426614174000",
						status: "healthy",
						timestamp: "2023-01-01T00:00:00.000Z",
					},
					{
						id: "123e4567-e89b-12d3-a456-426614174001",
						status: "degraded",
						timestamp: "2023-01-01T00:00:00.000Z",
					},
				],
			};

			mockCreateApiAction.mockResolvedValue(
				Result.succeed(mockApiListResponse),
			);

			const result = await monitorHealth();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].status).toBe("healthy");
				expect(result.value[1].status).toBe("degraded");
			}
			expect(mockCreateApiAction).toHaveBeenCalledWith("/api/health/monitor");
		});

		test("本番環境でAPI呼び出し失敗時にエラーを返すこと", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const mockApiError = {
				message: "Service unavailable",
				code: "SERVICE_UNAVAILABLE",
			};

			mockCreateApiAction.mockResolvedValue(Result.fail(mockApiError));

			const result = await monitorHealth();

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(HealthRepositoryError);
				expect(result.error.code).toBe("API_ERROR");
				expect(result.error.message).toContain(
					"Monitor health API call failed",
				);
			}
		});

		test("本番環境でマッピング失敗時にエラーを返すこと", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const invalidApiListResponse = {
				// invalid response format
				data: [{ invalidField: "invalid" }],
			};

			mockCreateApiAction.mockResolvedValue(
				Result.succeed(invalidApiListResponse),
			);

			const result = await monitorHealth();

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(HealthRepositoryError);
				expect(result.error.code).toBe("MAPPING_ERROR");
				expect(result.error.message).toContain(
					"Health list response mapping failed",
				);
			}
		});
	});

	describe("HealthApiGateway functions", () => {
		test("すべてのゲートウェイ関数を提供すること", () => {
			expect(HealthApiGateway.getHealth).toBe(getHealth);
			expect(HealthApiGateway.monitorHealth).toBe(monitorHealth);
		});
	});

	describe("createHealthApiGateway", () => {
		test("HealthRepositoryインターフェースの実装を返すこと", () => {
			const repository = createHealthApiGateway();

			expect(typeof repository.getHealth).toBe("function");
			expect(typeof repository.monitorHealth).toBe("function");
		});

		test("HealthRepositoryメソッドが正しく動作すること", async () => {
			vi.stubEnv("NODE_ENV", "development");
			const repository = createHealthApiGateway();

			// getHealthのテスト
			const healthResult = await repository.getHealth();
			expect(Result.isSuccess(healthResult)).toBe(true);

			// monitorHealthのテスト
			const monitorResult = await repository.monitorHealth();
			expect(Result.isSuccess(monitorResult)).toBe(true);
			if (Result.isSuccess(monitorResult)) {
				expect(Array.isArray(monitorResult.value)).toBe(true);
			}
		});
	});
});
