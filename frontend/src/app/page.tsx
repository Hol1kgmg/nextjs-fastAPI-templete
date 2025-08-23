import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="space-y-16">
			<h1 className="font-bold text-4xl">Hello World</h1>
			<p className="text-lg">This is a test</p>

			<div className="flex items-center gap-5">
				<Link href="/health">
					<Button>Check Health</Button>
				</Link>
				<Link href="/serverHealth">
					<Button>Check SeverHealth</Button>
				</Link>
			</div>
		</div>
	);
}
