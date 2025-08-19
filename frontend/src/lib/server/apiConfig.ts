import "server-only";

import { Result } from "@praha/byethrow";

/**
 * サーバー専用API設定ファイル
 *
 * このファイルはNext.jsのサーバーサイドでのみ使用されます。
 * クライアントサイドからの使用は禁止されています。
 *
 * 必要な環境変数:
 * - API_BASE_URL: バックエンドAPIのベースURL（本番環境では必須）
 *
 * 設計方針:
 * - getApiConfig(): 軽量な設定取得（バリデーションなし、高速）
 * - validateApiConfig(): 専用バリデーション（Result.try使用）
 * - createSafeApiConfig(): バリデーション付き設定取得（Result.try使用）
 *
 * エラーハンドリングポリシー:
 * - 高速系（createApiCall）: 例外throw
 * - 安全系（createSafeApiCall）: Result型返却
 *
 * 使用例:
 * ```ts
 * // 高速な設定取得（信頼できる環境）
 * const config = getApiConfig();
 * const apiCall = createApiCall(config);
 * const response = await apiCall('/health');
 *
 * // 安全な設定取得（バリデーション付き）
 * const safeConfigResult = await createSafeApiConfig();
 * if (Result.isSuccess(safeConfigResult)) {
 *   const config = safeConfigResult.value;
 * }
 *
 * // JSON送信時の注意: options.bodyは文字列化が必要
 * const response = await apiCall('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ key: 'value' }) // 自動でContent-Type: application/json付与
 * });
 * ```
 */

// 将来的にheadersに共通ヘッダーを含める(Accept: application/json、Authorization: 認証情報)
export type ApiConfig = Readonly<{
	baseUrl: string;
	timeout: number;
	headers: Readonly<Record<string, string>>;
}>;

export type ApiConfigError =
	| "MISSING_API_BASE_URL"
	| "INVALID_URL_FORMAT"
	| "HTTPS_REQUIRED_IN_PRODUCTION";

// 軽量な設定取得（バリデーションなし、高速）
// 用途: 信頼できる環境での高速な設定取得
export const getApiConfig = (): ApiConfig => {
	const baseUrl = process.env.API_BASE_URL;

	// 本番環境では環境変数が必須（即座に例外）
	if (process.env.NODE_ENV === "production" && !baseUrl) {
		throw new Error("API_BASE_URL is required in production environment");
	}

	// 開発環境でのフォールバック
	const finalBaseUrl = baseUrl || "http://localhost:8000";

	const config: ApiConfig = {
		baseUrl: finalBaseUrl,
		timeout: 10000, // 10秒
		headers: {}, // 必要な場面で個別に設定
	};

	// 開発環境でのログ出力
	if (process.env.NODE_ENV !== "production") {
		console.log("✅ API configuration loaded:", config.baseUrl);
	}

	return Object.freeze(config);
};

// HTTPS必須チェック（改善: 肯定条件で可読性向上）
const isHttpsAllowed = (url: string): boolean => {
	// 開発環境ではHTTPを許可、本番環境ではHTTPS必須
	return process.env.NODE_ENV !== "production" || url.startsWith("https://");
};

// URL妥当性チェック（統一: new URLのみ使用）
const validateUrl = (url: string): boolean => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};

// 専用バリデーション（Result.try使用）
// 用途: 設定の妥当性を詳細にチェック
export const validateApiConfig = async (
	config: ApiConfig,
): Promise<Result.Result<true, ApiConfigError>> => {
	// URLバリデーション（統一: new URLのみ）
	if (!validateUrl(config.baseUrl)) {
		if (process.env.NODE_ENV !== "production") {
			console.error("❌ Invalid API base URL:", config.baseUrl);
		}
		return Result.fail("INVALID_URL_FORMAT");
	}

	// 本番環境ではHTTPS必須（改善: 肯定条件で可読性向上）
	if (!isHttpsAllowed(config.baseUrl)) {
		if (process.env.NODE_ENV !== "production") {
			console.error("❌ HTTPS is required in production:", config.baseUrl);
		}
		return Result.fail("HTTPS_REQUIRED_IN_PRODUCTION");
	}

	if (process.env.NODE_ENV !== "production") {
		console.log("✅ API configuration validated:", config.baseUrl);
	}

	return Result.succeed(true);
};

// バリデーション付き設定取得（Result.try使用）
// 用途: 安全性を重視する場面での設定取得
export const createSafeApiConfig = async (): Promise<
	Result.Result<ApiConfig, ApiConfigError>
> => {
	const baseUrl = process.env.API_BASE_URL;

	// 本番環境では環境変数が必須
	if (process.env.NODE_ENV === "production" && !baseUrl) {
		return Result.fail("MISSING_API_BASE_URL");
	}

	// 開発環境でのフォールバック
	const finalBaseUrl = baseUrl || "http://localhost:8000";

	// URL妥当性チェック（統一: new URLのみ）
	if (!validateUrl(finalBaseUrl)) {
		return Result.fail("INVALID_URL_FORMAT");
	}

	// 本番環境ではHTTPS必須（改善: 肯定条件で可読性向上）
	if (!isHttpsAllowed(finalBaseUrl)) {
		return Result.fail("HTTPS_REQUIRED_IN_PRODUCTION");
	}

	const config: ApiConfig = {
		baseUrl: finalBaseUrl,
		timeout: 10000,
		headers: {},
	};

	// 開発環境でのログ出力
	if (process.env.NODE_ENV !== "production") {
		console.log("✅ Safe API configuration created:", config.baseUrl);
	}

	return Result.succeed(Object.freeze(config));
};

// タイムアウト付きfetch（改善: 外部signalとの結合対応）
export const fetchWithTimeout = async (
	input: RequestInfo | URL,
	init: RequestInit = {},
	timeoutMs: number,
): Promise<Result.Result<Response, Error>> => {
	const timeoutController = new AbortController();
	const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

	// 外部signalとタイムアウトsignalの結合
	let combinedSignal: AbortSignal;
	if (init.signal) {
		// 外部signalが既に中断されている場合は即座に中断
		if (init.signal.aborted) {
			clearTimeout(timeoutId);
			return Result.fail(new Error("Request was aborted"));
		}

		// 外部signalまたはタイムアウトのいずれかで中断
		combinedSignal = timeoutController.signal;
		const externalAbortHandler = () => {
			timeoutController.abort();
		};
		init.signal.addEventListener("abort", externalAbortHandler, { once: true });

		// クリーンアップ用のリスナー削除
		timeoutController.signal.addEventListener(
			"abort",
			() => {
				init.signal?.removeEventListener("abort", externalAbortHandler);
			},
			{ once: true },
		);
	} else {
		combinedSignal = timeoutController.signal;
	}

	const fetchPromise = fetch(input, {
		...init,
		signal: combinedSignal,
	}).finally(() => {
		clearTimeout(timeoutId);
	});

	return Result.try({
		try: fetchPromise,
		catch: (error): Error => {
			if (error instanceof Error) {
				return error;
			}
			return new Error("Fetch error");
		},
	});
};

// URL結合の正規化
export const joinUrl = (base: string, path: string): string => {
	const cleanBase = base.replace(/\/+$/, "");
	const cleanPath = path.replace(/^\/+/, "");
	return `${cleanBase}/${cleanPath}`;
};

// 共通のAPI呼び出しヘルパー（高速版）
// 注意: options.bodyが文字列以外（FormData/Blob等）の場合はContent-Typeを自動設定しません
export const createApiCall = (config: ApiConfig) => {
	return async (
		endpoint: string,
		options: RequestInit = {},
	): Promise<Response> => {
		const url = joinUrl(config.baseUrl, endpoint);

		// ヘッダーのマージ（修正: config.headersを起点に統合）
		const headers = new Headers(config.headers);
		if (options.headers) {
			const optionHeaders = new Headers(options.headers);
			optionHeaders.forEach((value, key) => {
				headers.set(key, value);
			});
		}

		// JSON送信時のヘッダー自動付与
		if (options.body && typeof options.body === "string") {
			headers.set("Content-Type", "application/json");
		}

		const result = await fetchWithTimeout(
			url,
			{
				...options,
				headers,
			},
			config.timeout,
		);

		if (Result.isSuccess(result)) {
			return result.value;
		}

		throw result.error;
	};
};

// 安全なAPI呼び出しヘルパー（Result.try使用）
// 注意: options.bodyが文字列以外（FormData/Blob等）の場合はContent-Typeを自動設定しません
export const createSafeApiCall = async (
	endpoint: string,
	options: RequestInit = {},
): Promise<Result.Result<Response, ApiConfigError | Error>> => {
	const configResult = await createSafeApiConfig();

	if (!Result.isSuccess(configResult)) {
		return Result.fail(configResult.error);
	}

	const config = configResult.value;
	const url = joinUrl(config.baseUrl, endpoint);

	// ヘッダーのマージ（修正: config.headersを起点に統合）
	const headers = new Headers(config.headers);
	if (options.headers) {
		const optionHeaders = new Headers(options.headers);
		optionHeaders.forEach((value, key) => {
			headers.set(key, value);
		});
	}

	// JSON送信時のヘッダー自動付与
	if (options.body && typeof options.body === "string") {
		headers.set("Content-Type", "application/json");
	}

	return fetchWithTimeout(
		url,
		{
			...options,
			headers,
		},
		config.timeout,
	);
};
