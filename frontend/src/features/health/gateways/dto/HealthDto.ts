import { Result } from "@praha/byethrow";
import { z } from "zod";

// API通信用DTOスキーマ
export const HealthApiDtoSchema = z.object({
	id: z
		.string()
		.regex(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			"Invalid UUID format",
		),
	status: z.enum(["healthy", "unhealthy", "degraded"]),
	timestamp: z.string().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
});

export type HealthApiDto = z.infer<typeof HealthApiDtoSchema>;

// レスポンス用DTOスキーマ
export const HealthResponseDtoSchema = z.object({
	status: z.string(),
	message: z.string().optional(),
	data: HealthApiDtoSchema.optional(),
});

export type HealthResponseDto = z.infer<typeof HealthResponseDtoSchema>;

// 複数ヘルス用DTOスキーマ
export const HealthListResponseDtoSchema = z.object({
	status: z.string(),
	message: z.string().optional(),
	data: z.array(HealthApiDtoSchema).optional(),
});

export type HealthListResponseDto = z.infer<typeof HealthListResponseDtoSchema>;

// バリデーション関数（関数型アプローチ）
export const validateApiDto = (
	data: unknown,
): Result.Result<HealthApiDto, HealthDtoError> => {
	const result = HealthApiDtoSchema.safeParse(data);
	if (!result.success) {
		return Result.fail(
			HealthDtoError.validationError(
				`Invalid HealthApiDto: ${result.error.message}`,
				result.error,
			),
		);
	}
	return Result.succeed(result.data);
};

export const validateResponseDto = (
	data: unknown,
): Result.Result<HealthResponseDto, HealthDtoError> => {
	const result = HealthResponseDtoSchema.safeParse(data);
	if (!result.success) {
		return Result.fail(
			HealthDtoError.validationError(
				`Invalid HealthResponseDto: ${result.error.message}`,
				result.error,
			),
		);
	}
	return Result.succeed(result.data);
};

export const validateListResponseDto = (
	data: unknown,
): Result.Result<HealthListResponseDto, HealthDtoError> => {
	const result = HealthListResponseDtoSchema.safeParse(data);
	if (!result.success) {
		return Result.fail(
			HealthDtoError.validationError(
				`Invalid HealthListResponseDto: ${result.error.message}`,
				result.error,
			),
		);
	}
	return Result.succeed(result.data);
};

// 配列バリデーション関数
export const validateApiDtoArray = (
	data: unknown,
): Result.Result<HealthApiDto[], HealthDtoError> => {
	if (!Array.isArray(data)) {
		return Result.fail(
			HealthDtoError.validationError("Expected array of HealthApiDto"),
		);
	}

	const results: HealthApiDto[] = [];
	for (let i = 0; i < data.length; i++) {
		const itemResult = validateApiDto(data[i]);
		if (Result.isFailure(itemResult)) {
			return Result.fail(
				HealthDtoError.validationError(
					`Invalid HealthApiDto at index ${i}: ${itemResult.error.message}`,
					itemResult.error.cause,
				),
			);
		}
		results.push(itemResult.value);
	}

	return Result.succeed(results);
};

// DTO バリデーター関数群
export const HealthDtoValidator = {
	validateApiDto,
	validateResponseDto,
	validateListResponseDto,
	validateApiDtoArray,
} as const;

// DTO エラークラス
export class HealthDtoError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = "HealthDtoError";
	}

	// エラーコード定数
	static readonly CODES = {
		VALIDATION_ERROR: "VALIDATION_ERROR",
		PARSING_ERROR: "PARSING_ERROR",
		SCHEMA_ERROR: "SCHEMA_ERROR",
		TYPE_ERROR: "TYPE_ERROR",
	} as const;

	// エラーファクトリーメソッド
	static validationError(message: string, cause?: Error): HealthDtoError {
		return new HealthDtoError(
			message,
			HealthDtoError.CODES.VALIDATION_ERROR,
			cause,
		);
	}

	static parsingError(message: string, cause?: Error): HealthDtoError {
		return new HealthDtoError(
			message,
			HealthDtoError.CODES.PARSING_ERROR,
			cause,
		);
	}

	static schemaError(message: string, cause?: Error): HealthDtoError {
		return new HealthDtoError(
			message,
			HealthDtoError.CODES.SCHEMA_ERROR,
			cause,
		);
	}

	static typeError(message: string, cause?: Error): HealthDtoError {
		return new HealthDtoError(message, HealthDtoError.CODES.TYPE_ERROR, cause);
	}
}

// DTO エラーコード型定義
export type HealthDtoErrorCode =
	(typeof HealthDtoError.CODES)[keyof typeof HealthDtoError.CODES];
