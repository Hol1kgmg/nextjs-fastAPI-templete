import type { Metadata } from "next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HealthStatus } from "@/features/health/components/HealthStatus";

export const metadata: Metadata = {
	title: "Health Check - CSR",
	description:
		"Client-side health check dashboard with real-time API monitoring",
};

export default function HealthPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-2xl space-y-6">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="font-bold text-3xl">
							Health Check Dashboard
						</CardTitle>
						<CardDescription className="text-base">
							Monitor API health status with real-time updates
						</CardDescription>
					</CardHeader>

					<Separator />

					<CardContent className="pt-6">
						<HealthStatus />
					</CardContent>

					<Separator />

					<CardContent className="pt-6">
						<div className="space-y-1 text-center text-muted-foreground text-sm">
							<p>
								This page demonstrates Client-Side Rendering (CSR) with React
								Hooks
							</p>
							<p>
								Uses Jotai for state management and @praha/byethrow for error
								handling
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
