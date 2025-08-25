import type { Result } from "@praha/byethrow";
import type { Health } from "../entities/Health";

// Health Repository インターフェース
export interface HealthRepository {
	getHealth(): Result.ResultAsync<Health, HealthRepositoryError>;
	monitorHealth(): Result.ResultAsync<Health[], HealthRepositoryError>;
}

// Health Repository エラークラス
export class HealthRepositoryError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = "HealthRepositoryError";
	}

	// エラーコード定数
	static readonly CODES = {
		API_ERROR: "API_ERROR",
		NETWORK_ERROR: "NETWORK_ERROR",
		INVALID_RESPONSE: "INVALID_RESPONSE",
		MAPPING_ERROR: "MAPPING_ERROR",
		TIMEOUT_ERROR: "TIMEOUT_ERROR",
		UNKNOWN_ERROR: "UNKNOWN_ERROR",
	} as const;

	// エラーファクトリーメソッド
	static apiError(message: string, cause?: Error): HealthRepositoryError {
		return new HealthRepositoryError(
			message,
			HealthRepositoryError.CODES.API_ERROR,
			cause,
		);
	}

	static networkError(message: string, cause?: Error): HealthRepositoryError {
		return new HealthRepositoryError(
			message,
			HealthRepositoryError.CODES.NETWORK_ERROR,
			cause,
		);
	}

	static invalidResponse(
		message: string,
		cause?: Error,
	): HealthRepositoryError {
		return new HealthRepositoryError(
			message,
			HealthRepositoryError.CODES.INVALID_RESPONSE,
			cause,
		);
	}

	static mappingError(message: string, cause?: Error): HealthRepositoryError {
		return new HealthRepositoryError(
			message,
			HealthRepositoryError.CODES.MAPPING_ERROR,
			cause,
		);
	}

	static timeoutError(message: string, cause?: Error): HealthRepositoryError {
		return new HealthRepositoryError(
			message,
			HealthRepositoryError.CODES.TIMEOUT_ERROR,
			cause,
		);
	}

	static unknownError(message: string, cause?: Error): HealthRepositoryError {
		return new HealthRepositoryError(
			message,
			HealthRepositoryError.CODES.UNKNOWN_ERROR,
			cause,
		);
	}
}

// Repository エラーコード型定義
export type HealthRepositoryErrorCode =
	(typeof HealthRepositoryError.CODES)[keyof typeof HealthRepositoryError.CODES];
