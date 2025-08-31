/**
 * Health機能のServer Actions
 *
 * 共通基盤のcreateApiActionを使用してHealth APIのServer Actionを実装します。
 */

"use server";

import { Result } from "@praha/byethrow";
import { createApiAction } from "@/actions";
import type {
	HealthApiError,
	HealthResponse,
} from "@/features/health/types/healthTypes";

/**
 * Health APIを呼び出すServer Action
 *
 * @returns Result型でラップされたHealthResponse
 */
export const getHealthAction = async (): Result.ResultAsync<
	HealthResponse,
	HealthApiError
> => {
	// 共通基盤のcreateApiActionを使用
	const result = await createApiAction<HealthResponse>("/health");

	// エラーの場合はHealth機能固有のエラー型に変換
	if (!Result.isSuccess(result)) {
		const healthError: HealthApiError = {
			...result.error,
			code: "HEALTH_SERVER_ACTION_ERROR",
			healthSpecific: "Health server action failed",
		};
		return Result.fail(healthError);
	}

	return result;
};
