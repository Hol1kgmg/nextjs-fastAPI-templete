import { Result } from "@praha/byethrow";
import { describe, expect, test } from "vitest";
import { HealthEntity } from "../../../domain/entities/Health";
import {
	createDefaultHealth,
	fromApiListResponse,
	fromApiResponse,
	HealthMapper,
	HealthMapperError,
	toDomain,
	toDto,
	toDtoArray,
} from "../HealthMapper";

describe("HealthMapper", () => {
	// テスト用データ
	const validDto = {
		id: "123e4567-e89b-12d3-a456-426614174000",
		status: "healthy",
		timestamp: "2023-01-01T00:00:00.000Z",
		details: { cpu: 50, memory: 60 },
	};

	const createTestHealth = () => {
		const healthResult = HealthEntity.create(
			"123e4567-e89b-12d3-a456-426614174000",
			"healthy",
			new Date("2023-01-01T00:00:00.000Z"),
			{ cpu: 50, memory: 60 },
		);
		if (Result.isFailure(healthResult)) {
			throw new Error("Failed to create test health");
		}
		return healthResult.value;
	};

	describe("toDomain", () => {
		test("有効なDTOをドメインエンティティに変換すること", () => {
			const result = toDomain(validDto);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.id).toBe(validDto.id);
				expect(result.value.status).toBe(validDto.status);
				expect(result.value.timestamp).toEqual(new Date(validDto.timestamp));
				expect(result.value.details).toEqual(validDto.details);
			}
		});

		test("タイムスタンプなしのDTOを処理すること", () => {
			const dtoWithoutTimestamp = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				status: "healthy",
			};

			const result = toDomain(dtoWithoutTimestamp);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.timestamp).toBeInstanceOf(Date);
			}
		});

		test("無効なDTOでエラーを返すこと", () => {
			const invalidDto = {
				id: "invalid-uuid",
				status: "healthy",
			};

			const result = toDomain(invalidDto);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(HealthMapperError);
				expect(result.error.code).toBe("VALIDATION_ERROR");
			}
		});

		test("無効なドメインエンティティ作成でエラーを返すこと", () => {
			const dtoWithInvalidStatus = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				status: "invalid-status",
			};

			const result = toDomain(dtoWithInvalidStatus);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error.code).toBe("VALIDATION_ERROR");
			}
		});
	});

	describe("toDto", () => {
		test("ドメインエンティティをDTOに変換すること", () => {
			const health = createTestHealth();
			const result = toDto(health);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.id).toBe(health.id);
				expect(result.value.status).toBe(health.status);
				expect(result.value.timestamp).toBe(health.timestamp.toISOString());
				expect(result.value.details).toEqual(health.details);
			}
		});
	});

	describe("fromApiResponse", () => {
		test("有効なAPIレスポンスをドメインエンティティに変換すること", () => {
			const apiResponse = {
				status: "success",
				data: validDto,
			};

			const result = fromApiResponse(apiResponse);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.id).toBe(validDto.id);
				expect(result.value.status).toBe(validDto.status);
			}
		});

		test("データのないレスポンスでエラーを返すこと", () => {
			const responseWithoutData = {
				status: "error",
				message: "No data available",
			};

			const result = fromApiResponse(responseWithoutData);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error.code).toBe("VALIDATION_ERROR");
				expect(result.error.message).toContain("No data in API response");
			}
		});

		test("無効なレスポンス形式でエラーを返すこと", () => {
			const invalidResponse = {
				// missing required status field
				data: validDto,
			};

			const result = fromApiResponse(invalidResponse);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error.code).toBe("VALIDATION_ERROR");
			}
		});
	});

	describe("fromApiListResponse", () => {
		test("有効なAPIリストレスポンスをドメインエンティティ配列に変換すること", () => {
			const apiListResponse = {
				status: "success",
				data: [
					validDto,
					{
						...validDto,
						id: "123e4567-e89b-12d3-a456-426614174001",
						status: "degraded",
					},
				],
			};

			const result = fromApiListResponse(apiListResponse);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].id).toBe(validDto.id);
				expect(result.value[1].status).toBe("degraded");
			}
		});

		test("データのないリストレスポンスでエラーを返すこと", () => {
			const responseWithoutData = {
				status: "error",
			};

			const result = fromApiListResponse(responseWithoutData);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error.message).toContain("No data in API list response");
			}
		});

		test("リスト内の無効な項目でエラーを返すこと", () => {
			const responseWithInvalidItem = {
				status: "success",
				data: [validDto, { id: "invalid-uuid", status: "healthy" }],
			};

			const result = fromApiListResponse(responseWithInvalidItem);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error.code).toBe("VALIDATION_ERROR");
				expect(result.error.message).toContain("validation failed");
			}
		});
	});

	describe("toDtoArray", () => {
		test("ドメインエンティティ配列をDTO配列に変換すること", () => {
			const health1 = createTestHealth();
			const health2Result = HealthEntity.create(
				"123e4567-e89b-12d3-a456-426614174001",
				"degraded",
				new Date(),
				{ service: "db" },
			);

			if (Result.isFailure(health2Result)) {
				throw new Error("Failed to create test health 2");
			}

			const healths = [health1, health2Result.value];
			const result = toDtoArray(healths);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].id).toBe(health1.id);
				expect(result.value[1].status).toBe("degraded");
			}
		});
	});

	describe("createDefaultHealth", () => {
		test("デフォルトの健全なエンティティを作成すること", () => {
			const result = createDefaultHealth();

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.status).toBe("healthy");
				expect(result.value.timestamp).toBeInstanceOf(Date);
			}
		});

		test("指定されたステータスと詳細でエンティティを作成すること", () => {
			const details = { service: "test" };
			const result = createDefaultHealth("degraded", details);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.status).toBe("degraded");
				expect(result.value.details).toEqual(details);
			}
		});
	});

	describe("HealthMapper functions", () => {
		test("すべてのマッパー関数を提供すること", () => {
			expect(HealthMapper.toDomain).toBe(toDomain);
			expect(HealthMapper.toDto).toBe(toDto);
			expect(HealthMapper.fromApiResponse).toBe(fromApiResponse);
			expect(HealthMapper.fromApiListResponse).toBe(fromApiListResponse);
			expect(HealthMapper.toDtoArray).toBe(toDtoArray);
			expect(HealthMapper.createDefaultHealth).toBe(createDefaultHealth);
		});
	});

	describe("HealthMapperError", () => {
		test("メッセージとコードでエラーを作成できること", () => {
			const error = new HealthMapperError("Test error", "TEST_CODE");

			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_CODE");
			expect(error.name).toBe("HealthMapperError");
			expect(error.cause).toBeUndefined();
		});

		describe("エラーファクトリーメソッド", () => {
			test("バリデーションエラーを作成できること", () => {
				const error = HealthMapperError.validationError("Validation failed");

				expect(error.message).toBe("Validation failed");
				expect(error.code).toBe(HealthMapperError.CODES.VALIDATION_ERROR);
				expect(error).toBeInstanceOf(HealthMapperError);
			});

			test("ドメインエラーを作成できること", () => {
				const error = HealthMapperError.domainError("Domain error");

				expect(error.message).toBe("Domain error");
				expect(error.code).toBe(HealthMapperError.CODES.DOMAIN_ERROR);
			});

			test("変換エラーを作成できること", () => {
				const error = HealthMapperError.conversionError("Conversion error");

				expect(error.message).toBe("Conversion error");
				expect(error.code).toBe(HealthMapperError.CODES.CONVERSION_ERROR);
			});

			test("データなしエラーを作成できること", () => {
				const error = HealthMapperError.missingDataError("Missing data");

				expect(error.message).toBe("Missing data");
				expect(error.code).toBe(HealthMapperError.CODES.MISSING_DATA_ERROR);
			});
		});
	});
});
