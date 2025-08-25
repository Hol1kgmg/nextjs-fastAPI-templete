import { Result } from "@praha/byethrow";
import type { Health } from "../domain/entities/Health";
import type { HealthRepository } from "../domain/repositories/HealthRepository";

// Get Health ユースケース関数（関数型アプローチ）
export const getHealthUseCase =
	(healthRepository: HealthRepository) =>
	async (): Result.ResultAsync<Health, GetHealthUseCaseError> => {
		const healthResult = await healthRepository.getHealth();

		if (Result.isFailure(healthResult)) {
			return Result.fail(
				GetHealthUseCaseError.repositoryError(
					"Failed to get health status",
					healthResult.error,
				),
			);
		}

		return Result.succeed(healthResult.value);
	};

// ユースケースファクトリー関数
export const createGetHealthUseCase = (healthRepository: HealthRepository) => ({
	execute: getHealthUseCase(healthRepository),
});

// Get Health ユースケースエラークラス
export class GetHealthUseCaseError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = "GetHealthUseCaseError";
	}

	// エラーコード定数
	static readonly CODES = {
		REPOSITORY_ERROR: "REPOSITORY_ERROR",
		VALIDATION_ERROR: "VALIDATION_ERROR",
		UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
	} as const;

	// エラーファクトリーメソッド
	static repositoryError(
		message: string,
		cause?: Error,
	): GetHealthUseCaseError {
		return new GetHealthUseCaseError(
			message,
			GetHealthUseCaseError.CODES.REPOSITORY_ERROR,
			cause,
		);
	}

	static validationError(
		message: string,
		cause?: Error,
	): GetHealthUseCaseError {
		return new GetHealthUseCaseError(
			message,
			GetHealthUseCaseError.CODES.VALIDATION_ERROR,
			cause,
		);
	}

	static unexpectedError(
		message: string,
		cause?: Error,
	): GetHealthUseCaseError {
		return new GetHealthUseCaseError(
			message,
			GetHealthUseCaseError.CODES.UNEXPECTED_ERROR,
			cause,
		);
	}
}

// ユースケースエラーコード型定義
export type GetHealthUseCaseErrorCode =
	(typeof GetHealthUseCaseError.CODES)[keyof typeof GetHealthUseCaseError.CODES];
