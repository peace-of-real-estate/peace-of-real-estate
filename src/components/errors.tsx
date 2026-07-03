import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import {
	AlertTriangle,
	ArrowLeft,
	Compass,
	MapPin,
	RefreshCw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// ========================================================================
// * Not Found
// ========================================================================

export function NotFoundComponent() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
			<Card className="mx-auto max-w-xl text-center">
				<CardContent>
					<div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center">
						<Compass className="h-8 w-8" />
					</div>
					<div className="text-muted-foreground mb-4 text-sm">Error 404</div>
					<h1 className="mb-6 text-4xl md:text-5xl">Page Not Found</h1>
					<p className="text-muted-foreground mx-auto mb-10 max-w-md text-lg leading-relaxed">
						The page you're looking for doesn't exist or has been moved. Let's
						get you back on track.
					</p>
					<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Button asChild>
							<Link to="/">
								<ArrowLeft className="h-4 w-4" />
								Back to Home
							</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link to="/agent/signup" search={{ step: 'intro' }}>
								<MapPin className="h-4 w-4" />
								Find an Agent
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

// ========================================================================
// * Server Error
// ========================================================================

export function ServerErrorComponent({ reset }: ErrorComponentProps) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
			<Card className="mx-auto max-w-xl text-center">
				<CardContent>
					<div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center">
						<AlertTriangle className="h-8 w-8" />
					</div>
					<div className="text-muted-foreground mb-4 text-sm">Error 500</div>
					<h1 className="mb-6 text-4xl md:text-5xl">Something Went Wrong</h1>
					<p className="text-muted-foreground mx-auto mb-10 max-w-md text-lg leading-relaxed">
						We hit an unexpected issue while loading this page. Please try
						again, or head back home while we sort it out.
					</p>
					<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Button type="button" onClick={reset}>
							<RefreshCw className="h-4 w-4" />
							Try Again
						</Button>
						<Button asChild variant="secondary">
							<Link to="/">
								<ArrowLeft className="h-4 w-4" />
								Back to Home
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
