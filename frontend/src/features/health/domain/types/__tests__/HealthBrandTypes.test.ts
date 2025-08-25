import { describe, expect, test } from "vitest";
import {
	HealthEntitySchema,
	HealthIdSchema,
	HealthStatusSchema,
	TimestampSchema,
} from "../HealthBrandTypes";

describe("HealthBrandTypes", () => {
	describe("HealthIdSchema", () => {
		test("valid UUIDの場合、パースが成功すること", () => {
			const validId = "123e4567-e89b-12d3-a456-426614174000";
			const result = HealthIdSchema.safeParse(validId);
			expect(result.success).toBe(true);
		});

		test("invalid UUIDの場合、パースが失敗すること", () => {
			const invalidId = "invalid-uuid";
			const result = HealthIdSchema.safeParse(invalidId);
			expect(result.success).toBe(false);
		});
	});

	describe("HealthStatusSchema", () => {
		test("valid statusの場合、パースが成功すること", () => {
			const validStatuses = ["healthy", "unhealthy", "degraded"];
			validStatuses.forEach((status) => {
				const result = HealthStatusSchema.safeParse(status);
				expect(result.success).toBe(true);
			});
		});

		test("invalid statusの場合、パースが失敗すること", () => {
			const invalidStatus = "invalid-status";
			const result = HealthStatusSchema.safeParse(invalidStatus);
			expect(result.success).toBe(false);
		});
	});

	describe("TimestampSchema", () => {
		test("Dateオブジェクトの場合、パースが成功すること", () => {
			const validDate = new Date();
			const result = TimestampSchema.safeParse(validDate);
			expect(result.success).toBe(true);
		});

		test("非Dateオブジェクトの場合、パースが失敗すること", () => {
			const invalidDate = "not-a-date";
			const result = TimestampSchema.safeParse(invalidDate);
			expect(result.success).toBe(false);
		});
	});

	describe("HealthEntitySchema", () => {
		test("完全なhealthエンティティの場合、パースが成功すること", () => {
			const validEntity = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				status: "healthy",
				timestamp: new Date(),
				details: { cpu: 50, memory: 60 },
			};
			const result = HealthEntitySchema.safeParse(validEntity);
			expect(result.success).toBe(true);
		});

		test("detailsなしのエンティティの場合、パースが成功すること", () => {
			const validEntity = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				status: "healthy",
				timestamp: new Date(),
			};
			const result = HealthEntitySchema.safeParse(validEntity);
			expect(result.success).toBe(true);
		});
	});
});
