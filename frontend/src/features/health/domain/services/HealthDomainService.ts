import type { Health } from "../entities/Health";
import { HealthEntity } from "../entities/Health";
import type { HealthStatus } from "../types/HealthBrandTypes";

// システムヘルス統計型定義
export type HealthStats = {
	readonly total: number;
	readonly healthy: number;
	readonly unhealthy: number;
	readonly degraded: number;
	readonly healthyPercentage: number;
	readonly unhealthyPercentage: number;
	readonly degradedPercentage: number;
};

// システムヘルス評価結果型定義
export type SystemHealthEvaluation = {
	readonly overallStatus: HealthStatus;
	readonly stats: HealthStats;
	readonly criticalIssues: string[];
	readonly recommendations: string[];
};

// システムヘルス評価関数
export const evaluateSystemHealth = (healths: Health[]): HealthStatus => {
	if (healths.length === 0) {
		return "unhealthy" as HealthStatus;
	}

	const stats = calculateHealthStats(healths);

	// 全て健全な場合
	if (stats.unhealthy === 0 && stats.degraded === 0) {
		return "healthy" as HealthStatus;
	}

	// 30%以上が不健全な場合はunhealthy
	const unhealthyThreshold = 0.3;
	if (stats.unhealthyPercentage >= unhealthyThreshold * 100) {
		return "unhealthy" as HealthStatus;
	}

	// それ以外はdegraded
	return "degraded" as HealthStatus;
};

// ヘルス統計計算関数
export const calculateHealthStats = (healths: Health[]): HealthStats => {
	const total = healths.length;

	if (total === 0) {
		return {
			total: 0,
			healthy: 0,
			unhealthy: 0,
			degraded: 0,
			healthyPercentage: 0,
			unhealthyPercentage: 0,
			degradedPercentage: 0,
		};
	}

	const healthy = healths.filter((health) =>
		HealthEntity.isHealthy(health),
	).length;
	const degraded = healths.filter(
		(health) => health.status === "degraded",
	).length;
	const unhealthy = healths.filter(
		(health) => health.status === "unhealthy",
	).length;

	return {
		total,
		healthy,
		unhealthy,
		degraded,
		healthyPercentage: (healthy / total) * 100,
		unhealthyPercentage: (unhealthy / total) * 100,
		degradedPercentage: (degraded / total) * 100,
	};
};

// 詳細なシステムヘルス評価関数
export const evaluateSystemHealthDetailed = (
	healths: Health[],
): SystemHealthEvaluation => {
	const overallStatus = evaluateSystemHealth(healths);
	const stats = calculateHealthStats(healths);

	const criticalIssues: string[] = [];
	const recommendations: string[] = [];

	// 重要な問題の特定
	if (stats.unhealthyPercentage > 50) {
		criticalIssues.push("Over 50% of services are unhealthy");
	}

	if (stats.total === 0) {
		criticalIssues.push("No health data available");
	}

	// 推奨事項の生成
	if (stats.unhealthy > 0) {
		recommendations.push(`Investigate ${stats.unhealthy} unhealthy service(s)`);
	}

	if (stats.degraded > 0) {
		recommendations.push(`Monitor ${stats.degraded} degraded service(s)`);
	}

	if (overallStatus === "healthy") {
		recommendations.push("System is operating normally");
	}

	return {
		overallStatus,
		stats,
		criticalIssues,
		recommendations,
	};
};

// ヘルス履歴分析関数
export const analyzeHealthTrend = (
	currentHealths: Health[],
	previousHealths: Health[],
): {
	readonly trend: "improving" | "stable" | "degrading";
	readonly changePercentage: number;
	readonly summary: string;
} => {
	const currentStats = calculateHealthStats(currentHealths);
	const previousStats = calculateHealthStats(previousHealths);

	const currentHealthyPercentage = currentStats.healthyPercentage;
	const previousHealthyPercentage = previousStats.healthyPercentage;

	const changePercentage = currentHealthyPercentage - previousHealthyPercentage;

	let trend: "improving" | "stable" | "degrading";
	let summary: string;

	if (Math.abs(changePercentage) < 5) {
		trend = "stable";
		summary = "System health remains stable";
	} else if (changePercentage > 0) {
		trend = "improving";
		summary = `System health improved by ${changePercentage.toFixed(1)}%`;
	} else {
		trend = "degrading";
		summary = `System health degraded by ${Math.abs(changePercentage).toFixed(1)}%`;
	}

	return {
		trend,
		changePercentage,
		summary,
	};
};

// ドメインサービス関数群
export const HealthDomainService = {
	evaluateSystemHealth,
	calculateHealthStats,
	evaluateSystemHealthDetailed,
	analyzeHealthTrend,
} as const;
