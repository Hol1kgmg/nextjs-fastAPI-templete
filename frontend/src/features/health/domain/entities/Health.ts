import { Result } from "@praha/byethrow";
import {
	type HealthDetails,
	HealthDetailsSchema,
	HealthEntitySchema,
	type HealthId,
	HealthIdSchema,
	type HealthStatus,
	HealthStatusSchema,
	type Timestamp,
	TimestampSchema,
} from "../types/HealthBrandTypes";

// Health エンティティ型定義（readonly）
export type Health = {
	readonly id: HealthId;
	readonly status: HealthStatus;
	readonly timestamp: Timestamp;
	readonly details?: HealthDetails;
};

// Health エンティティ作成関数（Zod検証付きファクトリー）
export const createHealth = (
	id: string,
	status: string,
	timestamp: Date,
	details?: unknown,
): Result.Result<Health, HealthDomainError> => {
	// Zod Brand型による厳密な検証
	const idResult = HealthIdSchema.safeParse(id);
	if (!idResult.success) {
		return Result.fail(new HealthDomainError("Invalid health ID format"));
	}

	const statusResult = HealthStatusSchema.safeParse(status);
	if (!statusResult.success) {
		return Result.fail(new HealthDomainError("Invalid health status"));
	}

	const timestampResult = TimestampSchema.safeParse(timestamp);
	if (!timestampResult.success) {
		return Result.fail(new HealthDomainError("Invalid timestamp"));
	}

	let validatedDetails: HealthDetails | undefined;
	if (details !== undefined) {
		const detailsResult = HealthDetailsSchema.safeParse(details);
		if (!detailsResult.success) {
			return Result.fail(new HealthDomainError("Invalid health details"));
		}
		validatedDetails = detailsResult.data;
	}

	return Result.succeed({
		id: idResult.data,
		status: statusResult.data,
		timestamp: timestampResult.data,
		details: validatedDetails,
	});
};

// Health エンティティ検証関数
export const validateHealth = (
	health: Health,
): Result.Result<true, HealthDomainError> => {
	const result = HealthEntitySchema.safeParse(health);
	if (!result.success) {
		return Result.fail(
			new HealthDomainError(
				`Entity validation failed: ${result.error.message}`,
			),
		);
	}
	return Result.succeed(true);
};

// Health ドメインロジック関数
export const isHealthy = (health: Health): boolean => {
	return health.status === "healthy";
};

// Health エンティティ操作関数群
export const HealthEntity = {
	create: createHealth,
	validate: validateHealth,
	isHealthy,
} as const;

// ドメインエラー定義
export class HealthDomainError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "HealthDomainError";
	}
}
