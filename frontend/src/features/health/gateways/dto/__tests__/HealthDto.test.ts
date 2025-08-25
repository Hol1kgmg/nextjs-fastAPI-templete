import { Result } from "@praha/byethrow";
import { describe, expect, test } from "vitest";
import {
	HealthApiDtoSchema,
	HealthDtoError,
	HealthDtoValidator,
	HealthListResponseDtoSchema,
	HealthResponseDtoSchema,
} from "../HealthDto";

describe("HealthDto", () => {
	describe("HealthApiDtoSchema", () => {
		test("有効なHealthApiDtoをバリデートすること", () => {
			const validDto = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				status: "healthy",
				timestamp: "2023-01-01T00:00:00Z",
				details: { cpu: 50, memory: 60 },
			};

			const result = HealthApiDtoSchema.safeParse(validDto);
			expect(result.success).toBe(true);
		});

		test("無効なUUIDを拒否すること", () => {
			const invalidDto = {
				id: "invalid-uuid",
				status: "healthy",
			};

			const result = HealthApiDtoSchema.safeParse(invalidDto);
			expect(result.success).toBe(false);
		});

		test("無効なステータスを拒否すること", () => {
			const invalidDto = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				status: "invalid-status",
			};

			const result = HealthApiDtoSchema.safeParse(invalidDto);
			expect(result.success).toBe(false);
		});

		test("オプショナルフィールドを許可すること", () => {
			const minimalDto = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				status: "healthy",
			};

			const result = HealthApiDtoSchema.safeParse(minimalDto);
			expect(result.success).toBe(true);
		});
	});

	describe("HealthResponseDtoSchema", () => {
		test("有効なHealthResponseDtoをバリデートすること", () => {
			const validResponse = {
				status: "success",
				message: "Health check completed",
				data: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					status: "healthy",
				},
			};

			const result = HealthResponseDtoSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		test("dataなしのレスポンスを許可すること", () => {
			const responseWithoutData = {
				status: "error",
				message: "Health check failed",
			};

			const result = HealthResponseDtoSchema.safeParse(responseWithoutData);
			expect(result.success).toBe(true);
		});
	});

	describe("HealthListResponseDtoSchema", () => {
		test("有効なHealthListResponseDtoをバリデートすること", () => {
			const validListResponse = {
				status: "success",
				data: [
					{
						id: "123e4567-e89b-12d3-a456-426614174000",
						status: "healthy",
					},
					{
						id: "123e4567-e89b-12d3-a456-426614174001",
						status: "degraded",
					},
				],
			};

			const result = HealthListResponseDtoSchema.safeParse(validListResponse);
			expect(result.success).toBe(true);
		});
	});

	describe("HealthDtoValidator", () => {
		describe("validateApiDto", () => {
			test("有効なDTOで成功を返すこと", () => {
				const validDto = {
					id: "123e4567-e89b-12d3-a456-426614174000",
					status: "healthy",
				};

				const result = HealthDtoValidator.validateApiDto(validDto);
				expect(Result.isSuccess(result)).toBe(true);
				if (Result.isSuccess(result)) {
					expect(result.value).toEqual(validDto);
				}
			});

			test("無効なDTOで失敗を返すこと", () => {
				const invalidDto = {
					id: "invalid-uuid",
					status: "healthy",
				};

				const result = HealthDtoValidator.validateApiDto(invalidDto);
				expect(Result.isFailure(result)).toBe(true);
				if (Result.isFailure(result)) {
					expect(result.error).toBeInstanceOf(HealthDtoError);
					expect(result.error.code).toBe("VALIDATION_ERROR");
				}
			});
		});

		describe("validateResponseDto", () => {
			test("有効なレスポンスDTOで成功を返すこと", () => {
				const validResponse = {
					status: "success",
					data: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						status: "healthy",
					},
				};

				const result = HealthDtoValidator.validateResponseDto(validResponse);
				expect(Result.isSuccess(result)).toBe(true);
			});

			test("無効なレスポンスDTOで失敗を返すこと", () => {
				const invalidResponse = {
					// missing required status field
					data: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						status: "healthy",
					},
				};

				const result = HealthDtoValidator.validateResponseDto(invalidResponse);
				expect(Result.isFailure(result)).toBe(true);
			});
		});

		describe("validateApiDtoArray", () => {
			test("有効なDTO配列で成功を返すこと", () => {
				const validArray = [
					{
						id: "123e4567-e89b-12d3-a456-426614174000",
						status: "healthy",
					},
					{
						id: "123e4567-e89b-12d3-a456-426614174001",
						status: "degraded",
					},
				];

				const result = HealthDtoValidator.validateApiDtoArray(validArray);
				expect(Result.isSuccess(result)).toBe(true);
				if (Result.isSuccess(result)) {
					expect(result.value).toEqual(validArray);
				}
			});

			test("非配列入力で失敗を返すこと", () => {
				const nonArray = {
					id: "123e4567-e89b-12d3-a456-426614174000",
					status: "healthy",
				};

				const result = HealthDtoValidator.validateApiDtoArray(nonArray);
				expect(Result.isFailure(result)).toBe(true);
				if (Result.isFailure(result)) {
					expect(result.error.message).toContain("Expected array");
				}
			});

			test("無効な項目を含む配列で失敗を返すこと", () => {
				const invalidArray = [
					{
						id: "123e4567-e89b-12d3-a456-426614174000",
						status: "healthy",
					},
					{
						id: "invalid-uuid",
						status: "healthy",
					},
				];

				const result = HealthDtoValidator.validateApiDtoArray(invalidArray);
				expect(Result.isFailure(result)).toBe(true);
				if (Result.isFailure(result)) {
					expect(result.error.message).toContain("at index 1");
				}
			});
		});
	});

	describe("HealthDtoError", () => {
		test("メッセージとコードでエラーを作成できること", () => {
			const error = new HealthDtoError("Test error", "TEST_CODE");

			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_CODE");
			expect(error.name).toBe("HealthDtoError");
			expect(error.cause).toBeUndefined();
		});

		describe("エラーファクトリーメソッド", () => {
			test("バリデーションエラーを作成できること", () => {
				const error = HealthDtoError.validationError("Validation failed");

				expect(error.message).toBe("Validation failed");
				expect(error.code).toBe(HealthDtoError.CODES.VALIDATION_ERROR);
				expect(error).toBeInstanceOf(HealthDtoError);
			});

			test("パースエラーを作成できること", () => {
				const error = HealthDtoError.parsingError("Parsing failed");

				expect(error.message).toBe("Parsing failed");
				expect(error.code).toBe(HealthDtoError.CODES.PARSING_ERROR);
			});

			test("スキーマエラーを作成できること", () => {
				const error = HealthDtoError.schemaError("Schema error");

				expect(error.message).toBe("Schema error");
				expect(error.code).toBe(HealthDtoError.CODES.SCHEMA_ERROR);
			});

			test("型エラーを作成できること", () => {
				const error = HealthDtoError.typeError("Type error");

				expect(error.message).toBe("Type error");
				expect(error.code).toBe(HealthDtoError.CODES.TYPE_ERROR);
			});
		});
	});
});
