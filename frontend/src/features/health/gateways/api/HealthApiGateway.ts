import { Result } from "@praha/byethrow";
import { createApiAction } from "@/actions/baseActions";
import type { Health } from "../../domain/entities/Health";
import {
	type HealthRepository,
	HealthRepositoryError,
} from "../../domain/repositories/HealthRepository";
import { HealthMapper } from "../mappers/HealthMapper";

// APIエンドポイントの型定義
type HealthApiEndpoints = {
	readonly GET_HEALTH: "/api/health";
	readonly MONITOR_HEALTH: "/api/health/monitor";
};

// APIエンドポイント定数
const API_ENDPOINTS: HealthApiEndpoints = {
	GET_HEALTH: "/api/health",
	MONITOR_HEALTH: "/api/health/monitor",
} as const;

// Health API Gateway関数 - getHealth
export const getHealth = async (): Result.ResultAsync<
	Health,
	HealthRepositoryError
> => {
	// 開発環境の場合はモックデータを返す
	if (process.env.NODE_ENV !== "production") {
		const mockHealthResult = HealthMapper.createDefaultHealth("healthy", {
			service: "mock-api",
			timestamp: new Date().toISOString(),
		});

		if (Result.isFailure(mockHealthResult)) {
			return Result.fail(
				HealthRepositoryError.unknownError(
					`Mock health creation failed: ${mockHealthResult.error.message}`,
					mockHealthResult.error,
				),
			);
		}

		// 少し遅延してリアルなAPI感を演出
		await new Promise((resolve) => setTimeout(resolve, 100));
		return Result.succeed(mockHealthResult.value);
	}

	// 本番環境ではAPIを呼び出し
	const apiResult = await createApiAction<unknown>(API_ENDPOINTS.GET_HEALTH);

	if (Result.isFailure(apiResult)) {
		const apiError = apiResult.error;
		return Result.fail(
			HealthRepositoryError.apiError(
				`Health API call failed: ${apiError.message}`,
				apiError.details instanceof Error ? apiError.details : undefined,
			),
		);
	}

	// APIレスポンスをドメインエンティティに変換
	const healthResult = HealthMapper.fromApiResponse(apiResult.value);
	if (Result.isFailure(healthResult)) {
		return Result.fail(
			HealthRepositoryError.mappingError(
				`Health response mapping failed: ${healthResult.error.message}`,
				healthResult.error,
			),
		);
	}

	return Result.succeed(healthResult.value);
};

// Health API Gateway関数 - monitorHealth
export const monitorHealth = async (): Result.ResultAsync<
	Health[],
	HealthRepositoryError
> => {
	// 開発環境の場合はモックデータを返す
	if (process.env.NODE_ENV !== "production") {
		const mockHealth1Result = HealthMapper.createDefaultHealth("healthy", {
			service: "api-gateway",
		});
		const mockHealth2Result = HealthMapper.createDefaultHealth("degraded", {
			service: "database",
		});
		const mockHealth3Result = HealthMapper.createDefaultHealth("unhealthy", {
			service: "cache",
		});

		if (
			Result.isFailure(mockHealth1Result) ||
			Result.isFailure(mockHealth2Result) ||
			Result.isFailure(mockHealth3Result)
		) {
			return Result.fail(
				HealthRepositoryError.unknownError("Mock health array creation failed"),
			);
		}

		// 少し遅延してリアルなAPI感を演出
		await new Promise((resolve) => setTimeout(resolve, 150));
		return Result.succeed([
			mockHealth1Result.value,
			mockHealth2Result.value,
			mockHealth3Result.value,
		]);
	}

	// 本番環境ではAPIを呼び出し
	const apiResult = await createApiAction<unknown>(
		API_ENDPOINTS.MONITOR_HEALTH,
	);

	if (Result.isFailure(apiResult)) {
		const apiError = apiResult.error;
		return Result.fail(
			HealthRepositoryError.apiError(
				`Monitor health API call failed: ${apiError.message}`,
				apiError.details instanceof Error ? apiError.details : undefined,
			),
		);
	}

	// APIレスポンスをドメインエンティティ配列に変換
	const healthArrayResult = HealthMapper.fromApiListResponse(apiResult.value);
	if (Result.isFailure(healthArrayResult)) {
		return Result.fail(
			HealthRepositoryError.mappingError(
				`Health list response mapping failed: ${healthArrayResult.error.message}`,
				healthArrayResult.error,
			),
		);
	}

	return Result.succeed(healthArrayResult.value);
};

// Health API Gateway 関数群
export const HealthApiGateway = {
	getHealth,
	monitorHealth,
} as const;

// createHealthApiGateway関数 - HealthRepositoryの実装を生成
export const createHealthApiGateway = (): HealthRepository => {
	return {
		getHealth: () => getHealth(),
		monitorHealth: () => monitorHealth(),
	};
};
