/**
 * Health API Route Handler
 *
 * 共通基盤のcreateApiActionを使用してHealth APIのプロキシエンドポイントを実装します。
 */

import { Result } from "@praha/byethrow";
import { createApiAction } from "@/actions";
import type {
	HealthApiError,
	HealthResponse,
} from "@/features/health/types/healthTypes";

export const GET = async () => {
	// 共通基盤のcreateApiActionを使用
	const result = await createApiAction<HealthResponse>("/health");

	if (Result.isSuccess(result)) {
		return Response.json(result.value);
	}

	// エラーの場合はHealth機能固有のエラー情報を追加
	const healthError: HealthApiError = {
		...result.error,
		code: "HEALTH_ROUTE_HANDLER_ERROR",
		healthSpecific: "Health route handler failed",
	};

	return Response.json(healthError, { status: 500 });
};
