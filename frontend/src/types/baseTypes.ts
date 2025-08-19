/**
 * 共通の基盤型定義
 *
 * このファイルは全ての機能で再利用可能な基本的な型定義を提供します。
 * 各機能固有の型は、この基盤型を拡張して定義してください。
 */

// 汎用的なAPIエラー型
export type ApiError = {
	message: string;
	code?: string;
	details?: unknown;
};

// 汎用的なAPIレスポンス状態型
export type ApiState<TData, TError = ApiError> = {
	data: TData | null;
	loading: boolean;
	error: TError | null;
};

// API設定型（サーバーサイド用）
export type ApiConfig = Readonly<{
	baseUrl: string;
	timeout: number;
	headers: Readonly<Record<string, string>>;
}>;

// API設定エラー型
export type ApiConfigError =
	| "MISSING_API_BASE_URL"
	| "INVALID_URL_FORMAT"
	| "HTTPS_REQUIRED_IN_PRODUCTION";

// Result型のヘルパー型（@praha/byethrowとの統合用）
export type ResultType<T, E = ApiError> = {
	isSuccess(): boolean;
	isFailure(): boolean;
	value: T;
	error: E;
};
