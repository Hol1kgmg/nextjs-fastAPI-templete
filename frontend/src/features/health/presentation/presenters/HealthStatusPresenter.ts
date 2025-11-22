import type { HealthApiError, HealthResponse } from "../../types/healthTypes";

/**
 * Health Status プレゼンテーション関数
 *
 * 現在のHealthResponseデータ構造を使用して表示用データを生成します。
 * 将来のClean Architectureへの移行時にドメインエンティティ対応に更新予定。
 */
export const presentHealthStatus = (health: HealthResponse) => {
	const isHealthy = health.status === "healthy";

	return {
		title: "System Health Status",
		statusText: `Status: ${health.status}`,
		timestampText: `Last checked: ${new Date().toLocaleString()}`,
		containerClass: isHealthy
			? "border-green-200 bg-green-50"
			: "border-red-200 bg-red-50",
		statusIcon: isHealthy ? "✅" : "❌",
		statusColor: isHealthy ? "text-green-600" : "text-red-600",
		titleColor: isHealthy ? "text-green-800" : "text-red-800",
		detailColor: isHealthy ? "text-green-500" : "text-red-500",
		successMessage: isHealthy
			? "API connection successful"
			: "API connection failed",
	};
};

/**
 * Health Error プレゼンテーション関数
 *
 * エラー状態の表示用データを生成します。
 */
export const presentHealthError = (error: HealthApiError) => {
	return {
		title: "Health Status (Client-Side)",
		errorMessage: `Error: ${error.message}`,
		errorCode: error.code ? `Code: ${error.code}` : null,
		containerClass: "border-red-200 bg-red-50",
		titleColor: "text-red-800",
		errorColor: "text-red-600",
		errorCodeColor: "text-red-500",
	};
};

/**
 * Health Loading プレゼンテーション関数
 *
 * ローディング状態の表示用データを生成します。
 */
export const presentHealthLoading = () => {
	return {
		title: "Health Status (Client-Side)",
		loadingMessage: "Loading...",
		containerClass: "border",
		titleColor: "text-lg font-semibold",
	};
};

// プレゼンター関数群
export const HealthStatusPresenter = {
	presentHealthStatus,
	presentHealthError,
	presentHealthLoading,
} as const;
