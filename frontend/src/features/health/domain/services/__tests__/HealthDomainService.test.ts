import { Result } from "@praha/byethrow";
import { describe, expect, test } from "vitest";
import { HealthEntity } from "../../entities/Health";
import {
	analyzeHealthTrend,
	calculateHealthStats,
	evaluateSystemHealth,
	evaluateSystemHealthDetailed,
	HealthDomainService,
} from "../HealthDomainService";

describe("HealthDomainService", () => {
	// テスト用のヘルスデータ作成ヘルパー
	const createTestHealth = (status: string, id?: string) => {
		const healthResult = HealthEntity.create(
			id || "123e4567-e89b-12d3-a456-426614174000",
			status,
			new Date(),
			{ service: "test" },
		);
		if (Result.isFailure(healthResult)) {
			throw new Error("Failed to create test health");
		}
		return healthResult.value;
	};

	describe("evaluateSystemHealth", () => {
		test("空の配列の場合、unhealthyを返すこと", () => {
			const result = evaluateSystemHealth([]);
			expect(result).toBe("unhealthy");
		});

		test("すべてのサービスが健全な場合、healthyを返すこと", () => {
			const healths = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174002"),
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174003"),
			];

			const result = evaluateSystemHealth(healths);
			expect(result).toBe("healthy");
		});

		test("一部のサービスが劣化していて閾値未満の場合、degradedを返すこと", () => {
			const healths = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174002"),
				createTestHealth("degraded", "123e4567-e89b-12d3-a456-426614174003"),
			];

			const result = evaluateSystemHealth(healths);
			expect(result).toBe("degraded");
		});

		test("30%以上のサービスが不健全な場合、unhealthyを返すこと", () => {
			const healths = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("unhealthy", "123e4567-e89b-12d3-a456-426614174002"),
				createTestHealth("unhealthy", "123e4567-e89b-12d3-a456-426614174003"),
			];

			const result = evaluateSystemHealth(healths);
			expect(result).toBe("unhealthy");
		});
	});

	describe("calculateHealthStats", () => {
		test("空の配列の場合、ゼロ統計を返すこと", () => {
			const stats = calculateHealthStats([]);

			expect(stats.total).toBe(0);
			expect(stats.healthy).toBe(0);
			expect(stats.unhealthy).toBe(0);
			expect(stats.degraded).toBe(0);
			expect(stats.healthyPercentage).toBe(0);
		});

		test("混合したヘルス状態の正しい統計を計算すること", () => {
			const healths = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174002"),
				createTestHealth("degraded", "123e4567-e89b-12d3-a456-426614174003"),
				createTestHealth("unhealthy", "123e4567-e89b-12d3-a456-426614174004"),
			];

			const stats = calculateHealthStats(healths);

			expect(stats.total).toBe(4);
			expect(stats.healthy).toBe(2);
			expect(stats.degraded).toBe(1);
			expect(stats.unhealthy).toBe(1);
			expect(stats.healthyPercentage).toBe(50);
			expect(stats.degradedPercentage).toBe(25);
			expect(stats.unhealthyPercentage).toBe(25);
		});
	});

	describe("evaluateSystemHealthDetailed", () => {
		test("推奨事項を含む詳細な評価を提供すること", () => {
			const healths = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("degraded", "123e4567-e89b-12d3-a456-426614174002"),
				createTestHealth("unhealthy", "123e4567-e89b-12d3-a456-426614174003"),
			];

			const evaluation = evaluateSystemHealthDetailed(healths);

			expect(evaluation.overallStatus).toBe("unhealthy");
			expect(evaluation.stats.total).toBe(3);
			expect(evaluation.recommendations).toContain(
				"Investigate 1 unhealthy service(s)",
			);
			expect(evaluation.recommendations).toContain(
				"Monitor 1 degraded service(s)",
			);
		});

		test("重要な問題を特定すること", () => {
			const healths = [
				createTestHealth("unhealthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("unhealthy", "123e4567-e89b-12d3-a456-426614174002"),
			];

			const evaluation = evaluateSystemHealthDetailed(healths);

			expect(evaluation.criticalIssues).toContain(
				"Over 50% of services are unhealthy",
			);
		});
	});

	describe("analyzeHealthTrend", () => {
		test("改善トレンドを検出すること", () => {
			const previous = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("unhealthy", "123e4567-e89b-12d3-a456-426614174002"),
			];

			const current = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174002"),
			];

			const trend = analyzeHealthTrend(current, previous);

			expect(trend.trend).toBe("improving");
			expect(trend.changePercentage).toBe(50);
			expect(trend.summary).toContain("improved by 50.0%");
		});

		test("安定トレンドを検出すること", () => {
			const healths = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174002"),
			];

			const trend = analyzeHealthTrend(healths, healths);

			expect(trend.trend).toBe("stable");
			expect(trend.changePercentage).toBe(0);
			expect(trend.summary).toBe("System health remains stable");
		});

		test("悪化トレンドを検出すること", () => {
			const previous = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174002"),
			];

			const current = [
				createTestHealth("healthy", "123e4567-e89b-12d3-a456-426614174001"),
				createTestHealth("unhealthy", "123e4567-e89b-12d3-a456-426614174002"),
			];

			const trend = analyzeHealthTrend(current, previous);

			expect(trend.trend).toBe("degrading");
			expect(trend.changePercentage).toBe(-50);
			expect(trend.summary).toContain("degraded by 50.0%");
		});
	});

	describe("HealthDomainService functions", () => {
		test("すべてのドメインサービス関数を提供すること", () => {
			expect(HealthDomainService.evaluateSystemHealth).toBe(
				evaluateSystemHealth,
			);
			expect(HealthDomainService.calculateHealthStats).toBe(
				calculateHealthStats,
			);
			expect(HealthDomainService.evaluateSystemHealthDetailed).toBe(
				evaluateSystemHealthDetailed,
			);
			expect(HealthDomainService.analyzeHealthTrend).toBe(analyzeHealthTrend);
		});
	});
});
