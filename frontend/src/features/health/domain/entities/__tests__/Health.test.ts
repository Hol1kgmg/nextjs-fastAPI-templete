import { Result } from "@praha/byethrow";
import { describe, expect, test } from "vitest";
import {
	createHealth,
	HealthDomainError,
	HealthEntity,
	isHealthy,
	validateHealth,
} from "../Health";

describe("Health Entity", () => {
	const validId = "123e4567-e89b-12d3-a456-426614174000";
	const validStatus = "healthy";
	const validTimestamp = new Date();
	const validDetails = { cpu: "50", memory: "60" };

	describe("createHealth", () => {
		test("valid healthエンティティを作成できること", () => {
			const result = createHealth(
				validId,
				validStatus,
				validTimestamp,
				validDetails,
			);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.id).toBe(validId);
				expect(result.value.status).toBe(validStatus);
				expect(result.value.timestamp).toBe(validTimestamp);
				expect(result.value.details).toEqual(validDetails);
			}
		});

		test("detailsなしのhealthエンティティを作成できること", () => {
			const result = createHealth(validId, validStatus, validTimestamp);

			expect(Result.isSuccess(result)).toBe(true);
			if (Result.isSuccess(result)) {
				expect(result.value.details).toBeUndefined();
			}
		});

		test("invalid IDの場合、失敗すること", () => {
			const result = createHealth("invalid-id", validStatus, validTimestamp);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(HealthDomainError);
				expect(result.error.message).toBe("Invalid health ID format");
			}
		});

		test("invalid statusの場合、失敗すること", () => {
			const result = createHealth(validId, "invalid-status", validTimestamp);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(HealthDomainError);
				expect(result.error.message).toBe("Invalid health status");
			}
		});

		test("invalid timestampの場合、失敗すること", () => {
			const result = createHealth(
				validId,
				validStatus,
				"invalid-date" as unknown as Date,
			);

			expect(Result.isFailure(result)).toBe(true);
			if (Result.isFailure(result)) {
				expect(result.error).toBeInstanceOf(HealthDomainError);
				expect(result.error.message).toBe("Invalid timestamp");
			}
		});
	});

	describe("validateHealth", () => {
		test("正しいhealthエンティティを検証できること", () => {
			const healthResult = createHealth(validId, validStatus, validTimestamp);
			expect(Result.isSuccess(healthResult)).toBe(true);

			if (Result.isSuccess(healthResult)) {
				const validationResult = validateHealth(healthResult.value);
				expect(Result.isSuccess(validationResult)).toBe(true);
			}
		});
	});

	describe("isHealthy", () => {
		test("healthyステータスの場合、trueを返すこと", () => {
			const healthResult = createHealth(validId, "healthy", validTimestamp);
			expect(Result.isSuccess(healthResult)).toBe(true);

			if (Result.isSuccess(healthResult)) {
				expect(isHealthy(healthResult.value)).toBe(true);
			}
		});

		test("unhealthyステータスの場合、falseを返すこと", () => {
			const healthResult = createHealth(validId, "unhealthy", validTimestamp);
			expect(Result.isSuccess(healthResult)).toBe(true);

			if (Result.isSuccess(healthResult)) {
				expect(isHealthy(healthResult.value)).toBe(false);
			}
		});

		test("degradedステータスの場合、falseを返すこと", () => {
			const healthResult = createHealth(validId, "degraded", validTimestamp);
			expect(Result.isSuccess(healthResult)).toBe(true);

			if (Result.isSuccess(healthResult)) {
				expect(isHealthy(healthResult.value)).toBe(false);
			}
		});
	});

	describe("HealthEntity functions", () => {
		test("すべてのエンティティ関数を提供すること", () => {
			expect(HealthEntity.create).toBe(createHealth);
			expect(HealthEntity.validate).toBe(validateHealth);
			expect(HealthEntity.isHealthy).toBe(isHealthy);
		});
	});
});
