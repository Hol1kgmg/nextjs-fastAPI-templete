/**
 * Health機能に関連する型定義
 *
 * 共通基盤型（@/types）を拡張してHealth機能固有の型を定義します。
 */

import type { ApiError, ApiState } from "@/types";

// バックエンドのhealth APIレスポンス型
export type HealthResponse = {
	status: string; // "healthy" | その他のステータス
};

// Health API固有のエラー型（共通ApiErrorを拡張）
export type HealthApiError = ApiError & {
	// Health機能固有のエラープロパティがあれば追加
	healthSpecific?: string;
};

// Health APIの状態管理型（共通ApiStateを使用）
export type HealthApiState = ApiState<HealthResponse, HealthApiError>;
