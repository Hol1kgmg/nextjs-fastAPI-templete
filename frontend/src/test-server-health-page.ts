import type { Metadata } from "next";
import { ServerHealthStatus } from "./features/health/components/ServerHealthStatus";
import { getHealthAction } from "./features/health/server/healthServer";

// Server Pageの基本動作テスト（型チェック）
const _testServerHealthPage = async () => {
	// Metadataの型チェック
	const _testMetadata: Metadata = {
		title: "Health Check - SSR",
		description: "Server-side health check dashboard",
	};

	// getHealthActionの型チェック
	const _healthResult = await getHealthAction();

	// ServerHealthStatusコンポーネントの型チェック
	const _component = ServerHealthStatus;

	console.log("Server health page types verified");
};

console.log("Server health page test ready");
