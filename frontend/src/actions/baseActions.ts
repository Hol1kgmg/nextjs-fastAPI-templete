/**
 * 共通のServer Actions基盤
 *
 * このファイルはServer Action用のヘルパー関数を提供します。
 * @praha/byethrowのResult型を使用した統一されたエラーハンドリングを実装します。
 */

import "server-only";
import { Result } from "@praha/byethrow";
import { createApiCall, getApiConfig } from "@/lib/server/apiConfig";
import type { ApiError } from "@/types";

/**
 * 汎用的なAPI呼び出しServer Actionを作成するヘルパー関数
 *
 * @template TResponse - APIレスポンスの型
 * @param endpoint - APIエンドポイント（例: "/health"）
 * @param options - fetch オプション
 * @returns Result型でラップされたAPIレスポンス
 *
 * @example
 * ```typescript
 * // Health機能での使用例
 * export async function getHealthAction() {
 *   return createApiAction<HealthResponse>('/health');
 * }
 * ```
 */
export function createApiAction<TResponse>(
	endpoint: string,
	options?: RequestInit,
): Result.ResultAsync<TResponse, ApiError> {
	// API設定を取得
	const config = getApiConfig();
	const apiCall = createApiCall(config);

	// @praha/byethrowを使用してPromiseをResult型に変換
	const fetchPromise = apiCall(endpoint, options).then(async (response) => {
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		return response.json() as Promise<TResponse>;
	});

	return Result.try({
		try: fetchPromise,
		catch: (error): ApiError => ({
			message: error instanceof Error ? error.message : "Server action error",
			code: "SERVER_ACTION_ERROR",
			details: error,
		}),
	});
}

/**
 * JSONデータを送信するPOST API呼び出しServer Actionを作成するヘルパー関数
 *
 * @template TRequest - リクエストボディの型
 * @template TResponse - APIレスポンスの型
 * @param endpoint - APIエンドポイント
 * @param data - 送信するJSONデータ
 * @param options - 追加のfetchオプション
 * @returns Result型でラップされたAPIレスポンス
 */
export function createPostApiAction<TRequest, TResponse>(
	endpoint: string,
	data: TRequest,
	options?: Omit<RequestInit, "method" | "body">,
): Result.ResultAsync<TResponse, ApiError> {
	return createApiAction<TResponse>(endpoint, {
		method: "POST",
		body: JSON.stringify(data),
		...options,
	});
}

/**
 * PUT API呼び出しServer Actionを作成するヘルパー関数
 *
 * @template TRequest - リクエストボディの型
 * @template TResponse - APIレスポンスの型
 * @param endpoint - APIエンドポイント
 * @param data - 送信するJSONデータ
 * @param options - 追加のfetchオプション
 * @returns Result型でラップされたAPIレスポンス
 */
export function createPutApiAction<TRequest, TResponse>(
	endpoint: string,
	data: TRequest,
	options?: Omit<RequestInit, "method" | "body">,
): Result.ResultAsync<TResponse, ApiError> {
	return createApiAction<TResponse>(endpoint, {
		method: "PUT",
		body: JSON.stringify(data),
		...options,
	});
}

/**
 * DELETE API呼び出しServer Actionを作成するヘルパー関数
 *
 * @template TResponse - APIレスポンスの型
 * @param endpoint - APIエンドポイント
 * @param options - 追加のfetchオプション
 * @returns Result型でラップされたAPIレスポンス
 */
export function createDeleteApiAction<TResponse = void>(
	endpoint: string,
	options?: Omit<RequestInit, "method">,
): Result.ResultAsync<TResponse, ApiError> {
	return createApiAction<TResponse>(endpoint, {
		method: "DELETE",
		...options,
	});
}
