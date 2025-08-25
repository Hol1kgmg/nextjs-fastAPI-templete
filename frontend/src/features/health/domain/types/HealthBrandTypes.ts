import { z } from "zod";

// Zod v4のブランド型定義
export const HealthIdSchema = z.string().uuid().brand<"HealthId">();
export type HealthId = z.infer<typeof HealthIdSchema>;

export const HealthStatusSchema = z
	.enum(["healthy", "unhealthy", "degraded"])
	.brand<"HealthStatus">();
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const TimestampSchema = z.date().brand<"Timestamp">();
export type Timestamp = z.infer<typeof TimestampSchema>;

export const HealthDetailsSchema = z
	.record(z.string(), z.unknown())
	.brand<"HealthDetails">();
export type HealthDetails = z.infer<typeof HealthDetailsSchema>;

// ヘルスエンティティスキーマ
export const HealthEntitySchema = z
	.object({
		id: HealthIdSchema,
		status: HealthStatusSchema,
		timestamp: TimestampSchema,
		details: HealthDetailsSchema.optional(),
	})
	.brand<"HealthEntity">();
export type HealthEntity = z.infer<typeof HealthEntitySchema>;
