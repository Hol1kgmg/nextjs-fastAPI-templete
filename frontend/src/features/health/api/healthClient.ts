/**
 * Health機能のAPIクライアント
 *
 * 共通基盤のclientApiCallを使用してHealth APIとの通信を実装します。
 */

import { Result } from "@praha/byethrow";
import type {
	HealthApiError,
	HealthResponse,
} from "@/features/health/types/healthTypes";
import { clientApiCall, normalizeClientApiError } from "@/lib/apiConfig";

export class HealthApiClient {
	/**
	 * Health APIを呼び出してヘルスチェック情報を取得
	 *
	 * @returns Result型でラップされたHealthResponse
	 */
	getHealth(): Result.ResultAsync<HealthResponse, HealthApiError> {
		// 共通基盤のclientApiCallを使用
		const fetchPromise = clientApiCall<HealthResponse>("/health");

		// @praha/byethrowを使用してPromiseをResult型に変換
		return Result.try({
			try: fetchPromise,
			catch: (error): HealthApiError => {
				const normalizedError = normalizeClientApiError(error);
				return {
					...normalizedError,
					code: "HEALTH_API_ERROR",
					// Health機能固有のエラー情報があれば追加
					healthSpecific: "Health check failed",
				};
			},
		});
	}
}

export const healthApiClient = new HealthApiClient();
