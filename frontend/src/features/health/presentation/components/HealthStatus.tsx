"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useHealth } from "../hooks/useHealth";
import { HealthStatusPresenter } from "../presenters/HealthStatusPresenter";

/**
 * Health Status コンポーネント（Clean Architecture対応版）
 *
 * プレゼンテーション層に配置され、新しいuseHealthフックと
 * HealthStatusPresenterを使用して表示ロジックを分離しています。
 * 既存のUI/UXを維持しながら、Clean Architectureの原則に従った実装です。
 */
export const HealthStatus = () => {
	const { data, loading, error, fetchHealth, retry } = useHealth();

	useEffect(() => {
		fetchHealth();
	}, [fetchHealth]);

	if (loading) {
		const presentation = HealthStatusPresenter.presentHealthLoading();

		return (
			<div className={`rounded-lg p-4 ${presentation.containerClass}`}>
				<h2 className={`mb-2 ${presentation.titleColor}`}>
					{presentation.title}
				</h2>
				<div className="flex items-center space-x-2">
					<div className="h-4 w-4 animate-spin rounded-full border-blue-600 border-b-2"></div>
					<span>{presentation.loadingMessage}</span>
				</div>
			</div>
		);
	}

	if (error) {
		const presentation = HealthStatusPresenter.presentHealthError(error);

		return (
			<div className={`rounded-lg p-4 ${presentation.containerClass}`}>
				<h2 className={`mb-2 font-semibold text-lg ${presentation.titleColor}`}>
					{presentation.title}
				</h2>
				<div className="mb-3">
					<p className={`font-medium ${presentation.errorColor}`}>
						{presentation.errorMessage}
					</p>
					{presentation.errorCode && (
						<p className={`text-sm ${presentation.errorCodeColor}`}>
							{presentation.errorCode}
						</p>
					)}
				</div>
				<Button onClick={retry} variant="outline" size="sm">
					Retry
				</Button>
			</div>
		);
	}

	if (data) {
		const presentation = HealthStatusPresenter.presentHealthStatus(data);

		return (
			<div className={`rounded-lg p-4 ${presentation.containerClass}`}>
				<h2 className={`mb-2 font-semibold text-lg ${presentation.titleColor}`}>
					{presentation.title}
				</h2>
				<div className="mb-3">
					<p className={`font-medium ${presentation.statusColor}`}>
						{presentation.statusText}
					</p>
					<p className={`text-sm ${presentation.detailColor}`}>
						{presentation.statusIcon} {presentation.successMessage}
					</p>
				</div>
				<Button onClick={fetchHealth} variant="outline" size="sm">
					Refresh
				</Button>
			</div>
		);
	}

	return (
		<div className="rounded-lg border p-4">
			<h2 className="mb-2 font-semibold text-lg">
				Health Status (Client-Side)
			</h2>
			<Button onClick={fetchHealth} variant="outline" size="sm">
				Check Health
			</Button>
		</div>
	);
};
