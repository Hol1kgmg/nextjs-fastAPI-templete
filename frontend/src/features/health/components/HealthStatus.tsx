"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useHealthHook } from "@/features/health/hooks/useHealthHook";

export function HealthStatus() {
	const { data, loading, error, fetchHealth, retry } = useHealthHook();

	useEffect(() => {
		fetchHealth();
	}, [fetchHealth]);

	if (loading) {
		return (
			<div className="rounded-lg border p-4">
				<h2 className="mb-2 font-semibold text-lg">
					Health Status (Client-Side)
				</h2>
				<div className="flex items-center space-x-2">
					<div className="h-4 w-4 animate-spin rounded-full border-blue-600 border-b-2"></div>
					<span>Loading...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4">
				<h2 className="mb-2 font-semibold text-lg text-red-800">
					Health Status (Client-Side)
				</h2>
				<div className="mb-3">
					<p className="font-medium text-red-600">Error: {error.message}</p>
					{error.code && (
						<p className="text-red-500 text-sm">Code: {error.code}</p>
					)}
				</div>
				<Button onClick={retry} variant="outline" size="sm">
					Retry
				</Button>
			</div>
		);
	}

	if (data) {
		return (
			<div className="rounded-lg border border-green-200 bg-green-50 p-4">
				<h2 className="mb-2 font-semibold text-green-800 text-lg">
					Health Status (Client-Side)
				</h2>
				<div className="mb-3">
					<p className="font-medium text-green-600">Status: {data.status}</p>
					<p className="text-green-500 text-sm">✅ API connection successful</p>
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
}
