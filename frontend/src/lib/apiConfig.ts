/**
 * クライアントサイド用API設定
 *
 * このファイルはクライアントサイドでのAPI通信設定を提供します。
 * セキュリティ上の理由から、クライアントサイドは内部API（/api/*）のみを使用します。
 */

import type { ApiError } from "@/types";

/**
 * クライアントサイド用API設定
 * セキュリティ上、バックエンドAPIのURLは直接公開しません
 */
export const clientApiConfig = {
	baseUrl: "", // 同一オリジンの /api/* を使用
	timeout: 10000, // 10秒
	headers: {
		"Content-Type": "application/json",
	},
} as const;

/**
 * 汎用的なクライアントサイドAPI呼び出しヘルパー
 *
 * @template TResponse - APIレスポンスの型
 * @param endpoint - APIエンドポイント（例: "/health"）
 * @param options - fetchオプション
 * @returns APIレスポンスのPromise
 *
 * @example
 * ```typescript
 * const response = await clientApiCall<HealthResponse>('/health');
 * ```
 */
export const clientApiCall = async <TResponse>(
	endpoint: string,
	options?: RequestInit,
): Promise<TResponse> => {
	const url = `/api${endpoint}`;

	const response = await fetch(url, {
		headers: {
			...clientApiConfig.headers,
			...options?.headers,
		},
		...options,
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	return response.json();
};

/**
 * クライアントサイドAPIエラーを標準化する関数
 *
 * @param error - キャッチされたエラー
 * @returns 標準化されたApiError
 */
export const normalizeClientApiError = (error: unknown): ApiError => {
	if (error instanceof Error) {
		return {
			message: error.message,
			code: "CLIENT_API_ERROR",
			details: error,
		};
	}

	return {
		message: "Unknown client API error",
		code: "UNKNOWN_CLIENT_ERROR",
		details: error,
	};
};
