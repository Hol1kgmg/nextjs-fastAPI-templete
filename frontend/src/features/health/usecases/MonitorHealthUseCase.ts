import { Result } from "@praha/byethrow";
import type { Health } from "../domain/entities/Health";
import type { HealthRepository } from "../domain/repositories/HealthRepository";
import { HealthDomainService } from "../domain/services/HealthDomainService";
import type { HealthStatus } from "../domain/types/HealthBrandTypes";

// Monitor Health 結果型
export type HealthMonitorResult = {
	readonly overallStatus: HealthStatus;
	readonly individualHealths: Health[];
	readonly timestamp: Date;
	readonly stats: {
		readonly total: number;
		readonly healthy: number;
		readonly unhealthy: number;
		readonly degraded: number;
		readonly healthyPercentage: number;
		readonly unhealthyPercentage: number;
		readonly degradedPercentage: number;
	};
	readonly criticalIssues: string[];
	readonly recommendations: string[];
};

// Monitor Health ユースケース関数（関数型アプローチ）
export const monitorHealthUseCase =
	(healthRepository: HealthRepository) =>
	async (): Result.ResultAsync<
		HealthMonitorResult,
		MonitorHealthUseCaseError
	> => {
		const healthsResult = await healthRepository.monitorHealth();

		if (Result.isFailure(healthsResult)) {
			return Result.fail(
				MonitorHealthUseCaseError.repositoryError(
					"Failed to monitor health",
					healthsResult.error,
				),
			);
		}

		const individualHealths = healthsResult.value;
		const detailedEvaluation =
			HealthDomainService.evaluateSystemHealthDetailed(individualHealths);

		const result: HealthMonitorResult = {
			overallStatus: detailedEvaluation.overallStatus,
			individualHealths,
			timestamp: new Date(),
			stats: detailedEvaluation.stats,
			criticalIssues: detailedEvaluation.criticalIssues,
			recommendations: detailedEvaluation.recommendations,
		};

		return Result.succeed(result);
	};

// ユースケースファクトリー関数
export const createMonitorHealthUseCase = (
	healthRepository: HealthRepository,
) => ({
	execute: monitorHealthUseCase(healthRepository),
});

// Monitor Health ユースケースエラークラス
export class MonitorHealthUseCaseError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = "MonitorHealthUseCaseError";
	}

	// エラーコード定数
	static readonly CODES = {
		REPOSITORY_ERROR: "REPOSITORY_ERROR",
		DOMAIN_SERVICE_ERROR: "DOMAIN_SERVICE_ERROR",
		VALIDATION_ERROR: "VALIDATION_ERROR",
		UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
	} as const;

	// エラーファクトリーメソッド
	static repositoryError(
		message: string,
		cause?: Error,
	): MonitorHealthUseCaseError {
		return new MonitorHealthUseCaseError(
			message,
			MonitorHealthUseCaseError.CODES.REPOSITORY_ERROR,
			cause,
		);
	}

	static domainServiceError(
		message: string,
		cause?: Error,
	): MonitorHealthUseCaseError {
		return new MonitorHealthUseCaseError(
			message,
			MonitorHealthUseCaseError.CODES.DOMAIN_SERVICE_ERROR,
			cause,
		);
	}

	static validationError(
		message: string,
		cause?: Error,
	): MonitorHealthUseCaseError {
		return new MonitorHealthUseCaseError(
			message,
			MonitorHealthUseCaseError.CODES.VALIDATION_ERROR,
			cause,
		);
	}

	static unexpectedError(
		message: string,
		cause?: Error,
	): MonitorHealthUseCaseError {
		return new MonitorHealthUseCaseError(
			message,
			MonitorHealthUseCaseError.CODES.UNEXPECTED_ERROR,
			cause,
		);
	}
}

// ユースケースエラーコード型定義
export type MonitorHealthUseCaseErrorCode =
	(typeof MonitorHealthUseCaseError.CODES)[keyof typeof MonitorHealthUseCaseError.CODES];
