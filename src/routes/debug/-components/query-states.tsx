import { CircleAlert, Inbox } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function ErrorState({
	title = 'Something went wrong',
	message,
	onRetry,
}: {
	title?: string | undefined
	message: string | undefined
	onRetry?: (() => void) | undefined
}) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
			<CircleAlert className="text-destructive size-8" />
			<p className="text-sm font-semibold">{title}</p>
			{message && (
				<code className="bg-muted/60 max-w-md rounded-md px-2.5 py-1.5 font-mono text-xs break-words">
					{message}
				</code>
			)}
			{onRetry && (
				<Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
					Retry
				</Button>
			)}
		</div>
	)
}

export function EmptyState({
	title,
	hint,
	children,
}: {
	title: string
	hint?: string | undefined
	children?: React.ReactNode
}) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
			<Inbox className="text-muted-foreground size-8" />
			<p className="text-sm font-semibold">{title}</p>
			{hint && <p className="text-muted-foreground text-xs">{hint}</p>}
			{children}
		</div>
	)
}

export function RailSkeleton() {
	return (
		<div className="space-y-3 p-3">
			{Array.from({ length: 8 }).map((_, index) => (
				<Skeleton key={index} className="h-12 w-full" />
			))}
		</div>
	)
}

export function InspectorSkeleton() {
	return (
		<div className="space-y-3 p-4">
			<Skeleton className="h-10 w-1/2" />
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-64 w-full" />
		</div>
	)
}
