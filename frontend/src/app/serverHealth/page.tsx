import type { Metadata } from "next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ServerHealthStatus } from "@/features/health/components/ServerHealthStatus";
import { getHealthAction } from "@/features/health/server/healthServer";

export const metadata: Metadata = {
	title: "Health Check - SSR",
	description: "Server-side health check dashboard with pre-rendered data",
};

export default async function ServerHealthPage() {
	const healthResult = await getHealthAction();

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-2xl space-y-6">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="font-bold text-3xl">
							Server Health Check Dashboard
						</CardTitle>
						<CardDescription className="text-base">
							Server-side rendered health status with pre-fetched data
						</CardDescription>
					</CardHeader>

					<Separator />

					<CardContent className="pt-6">
						<ServerHealthStatus healthResult={healthResult} />
					</CardContent>

					<Separator />

					<CardContent className="pt-6">
						<div className="space-y-1 text-center text-muted-foreground text-sm">
							<p>
								This page demonstrates Server-Side Rendering (SSR) with Server
								Components
							</p>
							<p>
								Uses Server Actions and @praha/byethrow Result type for error
								handling
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
