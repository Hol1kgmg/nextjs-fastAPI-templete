import { describe, expect, test } from "vitest";
import { HealthRepositoryError } from "../HealthRepository";

describe("HealthRepository", () => {
	describe("HealthRepositoryError", () => {
		test("メッセージとコードでエラーを作成できること", () => {
			const error = new HealthRepositoryError("Test error", "TEST_CODE");

			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_CODE");
			expect(error.name).toBe("HealthRepositoryError");
			expect(error.cause).toBeUndefined();
		});

		test("原因エラーを含むエラーを作成できること", () => {
			const cause = new Error("Original error");
			const error = new HealthRepositoryError("Test error", "TEST_CODE", cause);

			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_CODE");
			expect(error.cause).toBe(cause);
		});

		describe("エラーファクトリーメソッド", () => {
			test("API エラーを作成できること", () => {
				const error = HealthRepositoryError.apiError("API failed");

				expect(error.message).toBe("API failed");
				expect(error.code).toBe(HealthRepositoryError.CODES.API_ERROR);
				expect(error).toBeInstanceOf(HealthRepositoryError);
			});

			test("ネットワークエラーを作成できること", () => {
				const error = HealthRepositoryError.networkError("Network failed");

				expect(error.message).toBe("Network failed");
				expect(error.code).toBe(HealthRepositoryError.CODES.NETWORK_ERROR);
			});

			test("無効なレスポンスエラーを作成できること", () => {
				const error = HealthRepositoryError.invalidResponse("Invalid response");

				expect(error.message).toBe("Invalid response");
				expect(error.code).toBe(HealthRepositoryError.CODES.INVALID_RESPONSE);
			});

			test("マッピングエラーを作成できること", () => {
				const error = HealthRepositoryError.mappingError("Mapping failed");

				expect(error.message).toBe("Mapping failed");
				expect(error.code).toBe(HealthRepositoryError.CODES.MAPPING_ERROR);
			});

			test("タイムアウトエラーを作成できること", () => {
				const error = HealthRepositoryError.timeoutError("Request timeout");

				expect(error.message).toBe("Request timeout");
				expect(error.code).toBe(HealthRepositoryError.CODES.TIMEOUT_ERROR);
			});

			test("未知のエラーを作成できること", () => {
				const error = HealthRepositoryError.unknownError("Unknown error");

				expect(error.message).toBe("Unknown error");
				expect(error.code).toBe(HealthRepositoryError.CODES.UNKNOWN_ERROR);
			});
		});

		describe("エラーコード", () => {
			test("すべての必要なエラーコードを持つこと", () => {
				const codes = HealthRepositoryError.CODES;

				expect(codes.API_ERROR).toBe("API_ERROR");
				expect(codes.NETWORK_ERROR).toBe("NETWORK_ERROR");
				expect(codes.INVALID_RESPONSE).toBe("INVALID_RESPONSE");
				expect(codes.MAPPING_ERROR).toBe("MAPPING_ERROR");
				expect(codes.TIMEOUT_ERROR).toBe("TIMEOUT_ERROR");
				expect(codes.UNKNOWN_ERROR).toBe("UNKNOWN_ERROR");
			});
		});
	});
});
