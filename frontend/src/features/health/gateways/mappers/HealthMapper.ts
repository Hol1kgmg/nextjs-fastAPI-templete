import { Result } from "@praha/byethrow";
import { type Health, HealthEntity } from "../../domain/entities/Health";
import { type HealthApiDto, HealthDtoValidator } from "../dto/HealthDto";

// DTO → ドメインエンティティ変換関数
export const toDomain = (
	dto: unknown,
): Result.Result<Health, HealthMapperError> => {
	// DTOの検証
	const dtoResult = HealthDtoValidator.validateApiDto(dto);
	if (Result.isFailure(dtoResult)) {
		return Result.fail(
			HealthMapperError.validationError(
				`DTO validation failed: ${dtoResult.error.message}`,
				dtoResult.error,
			),
		);
	}

	const validatedDto = dtoResult.value;

	// タイムスタンプの変換
	const timestamp = validatedDto.timestamp
		? new Date(validatedDto.timestamp)
		: new Date();

	// ドメインエンティティの作成
	const healthResult = HealthEntity.create(
		validatedDto.id,
		validatedDto.status,
		timestamp,
		validatedDto.details,
	);

	if (Result.isFailure(healthResult)) {
		return Result.fail(
			HealthMapperError.domainError(
				`Domain entity creation failed: ${healthResult.error.message}`,
				healthResult.error,
			),
		);
	}

	return Result.succeed(healthResult.value);
};

// ドメインエンティティ → DTO変換関数
export const toDto = (
	entity: Health,
): Result.Result<HealthApiDto, HealthMapperError> => {
	// エンティティの検証
	const validationResult = HealthEntity.validate(entity);
	if (Result.isFailure(validationResult)) {
		return Result.fail(
			HealthMapperError.domainError(
				`Entity validation failed: ${validationResult.error.message}`,
				validationResult.error,
			),
		);
	}

	const dto: HealthApiDto = {
		id: entity.id,
		status: entity.status,
		timestamp: entity.timestamp.toISOString(),
		details: entity.details,
	};

	// 生成されたDTOの検証
	const dtoValidationResult = HealthDtoValidator.validateApiDto(dto);
	if (Result.isFailure(dtoValidationResult)) {
		return Result.fail(
			HealthMapperError.validationError(
				`Generated DTO validation failed: ${dtoValidationResult.error.message}`,
				dtoValidationResult.error,
			),
		);
	}

	return Result.succeed(dtoValidationResult.value);
};

// APIレスポンス → ドメインエンティティ変換関数
export const fromApiResponse = (
	response: unknown,
): Result.Result<Health, HealthMapperError> => {
	const responseResult = HealthDtoValidator.validateResponseDto(response);
	if (Result.isFailure(responseResult)) {
		return Result.fail(
			HealthMapperError.validationError(
				`Response validation failed: ${responseResult.error.message}`,
				responseResult.error,
			),
		);
	}

	const validatedResponse = responseResult.value;
	if (!validatedResponse.data) {
		return Result.fail(
			HealthMapperError.validationError("No data in API response"),
		);
	}

	return toDomain(validatedResponse.data);
};

// APIリストレスポンス → ドメインエンティティ配列変換関数
export const fromApiListResponse = (
	response: unknown,
): Result.Result<Health[], HealthMapperError> => {
	const responseResult = HealthDtoValidator.validateListResponseDto(response);
	if (Result.isFailure(responseResult)) {
		return Result.fail(
			HealthMapperError.validationError(
				`List response validation failed: ${responseResult.error.message}`,
				responseResult.error,
			),
		);
	}

	const validatedResponse = responseResult.value;
	if (!validatedResponse.data) {
		return Result.fail(
			HealthMapperError.validationError("No data in API list response"),
		);
	}

	const healthResults: Health[] = [];
	for (let i = 0; i < validatedResponse.data.length; i++) {
		const healthResult = toDomain(validatedResponse.data[i]);
		if (Result.isFailure(healthResult)) {
			return Result.fail(
				HealthMapperError.validationError(
					`Failed to convert item at index ${i}: ${healthResult.error.message}`,
					healthResult.error,
				),
			);
		}
		healthResults.push(healthResult.value);
	}

	return Result.succeed(healthResults);
};

// ドメインエンティティ配列 → DTO配列変換関数
export const toDtoArray = (
	entities: Health[],
): Result.Result<HealthApiDto[], HealthMapperError> => {
	const dtoResults: HealthApiDto[] = [];

	for (let i = 0; i < entities.length; i++) {
		const dtoResult = toDto(entities[i]);
		if (Result.isFailure(dtoResult)) {
			return Result.fail(
				HealthMapperError.validationError(
					`Failed to convert entity at index ${i}: ${dtoResult.error.message}`,
					dtoResult.error,
				),
			);
		}
		dtoResults.push(dtoResult.value);
	}

	return Result.succeed(dtoResults);
};

// 簡易UUID生成関数（開発用）
const generateSimpleUUID = (): string => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// デフォルトヘルスエンティティ作成関数
export const createDefaultHealth = (
	status: "healthy" | "unhealthy" | "degraded" = "healthy",
	details?: Record<string, unknown>,
): Result.Result<Health, HealthMapperError> => {
	const healthResult = HealthEntity.create(
		generateSimpleUUID(),
		status,
		new Date(),
		details,
	);

	if (Result.isFailure(healthResult)) {
		return Result.fail(
			HealthMapperError.domainError(
				`Failed to create default health: ${healthResult.error.message}`,
				healthResult.error,
			),
		);
	}

	return Result.succeed(healthResult.value);
};

// マッパー関数群
export const HealthMapper = {
	toDomain,
	toDto,
	fromApiResponse,
	fromApiListResponse,
	toDtoArray,
	createDefaultHealth,
} as const;

// Health Mapper エラークラス
export class HealthMapperError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = "HealthMapperError";
	}

	// エラーコード定数
	static readonly CODES = {
		VALIDATION_ERROR: "VALIDATION_ERROR",
		DOMAIN_ERROR: "DOMAIN_ERROR",
		CONVERSION_ERROR: "CONVERSION_ERROR",
		MISSING_DATA_ERROR: "MISSING_DATA_ERROR",
	} as const;

	// エラーファクトリーメソッド
	static validationError(message: string, cause?: Error): HealthMapperError {
		return new HealthMapperError(
			message,
			HealthMapperError.CODES.VALIDATION_ERROR,
			cause,
		);
	}

	static domainError(message: string, cause?: Error): HealthMapperError {
		return new HealthMapperError(
			message,
			HealthMapperError.CODES.DOMAIN_ERROR,
			cause,
		);
	}

	static conversionError(message: string, cause?: Error): HealthMapperError {
		return new HealthMapperError(
			message,
			HealthMapperError.CODES.CONVERSION_ERROR,
			cause,
		);
	}

	static missingDataError(message: string, cause?: Error): HealthMapperError {
		return new HealthMapperError(
			message,
			HealthMapperError.CODES.MISSING_DATA_ERROR,
			cause,
		);
	}
}

// Mapper エラーコード型定義
export type HealthMapperErrorCode =
	(typeof HealthMapperError.CODES)[keyof typeof HealthMapperError.CODES];
