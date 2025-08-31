import { Result } from "@praha/byethrow";
import type {
	HealthApiError,
	HealthResponse,
} from "@/features/health/types/healthTypes";

type ServerHealthStatusProps = {
	healthResult: Result.Result<HealthResponse, HealthApiError>;
};

export const ServerHealthStatus = ({
	healthResult,
}: ServerHealthStatusProps) => {
	if (Result.isSuccess(healthResult)) {
		const data = healthResult.value;
		return (
			<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
				<h2 className="mb-2 font-semibold text-blue-800 text-lg">
					Health Status (Server-Side)
				</h2>
				<div className="mb-3">
					<p className="font-medium text-blue-600">Status: {data.status}</p>
					<p className="text-blue-500 text-sm">🚀 Server-side rendered</p>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-red-200 bg-red-50 p-4">
			<h2 className="mb-2 font-semibold text-lg text-red-800">
				Health Status (Server-Side) - Error
			</h2>
			<div className="mb-3">
				<p className="font-medium text-red-600">
					Error: {healthResult.error.message}
				</p>
				<p className="text-red-500 text-sm">🚀 Server-side rendered</p>
			</div>
		</div>
	);
};
