import * as React from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cartoRasterStyle } from '@/lib/geography/basemap'
import { cn } from '@/lib/utils/ui'
import { SectionLabel } from '@/routes/debug/-components/section-label'

/** Gates map rendering on the lazy-loaded maplibre bundle. */
export function useMapLibReady(): boolean {
	const [ready, setReady] = React.useState(false)

	React.useEffect(() => {
		let cancelled = false
		void import('react-map-gl/maplibre').then(() => {
			if (!cancelled) setReady(true)
		})
		return () => {
			cancelled = true
		}
	}, [])

	return ready
}

/** CARTO basemap matching the page theme (reads the `.dark` root class once). */
export function useBasemapStyle() {
	return React.useMemo(() => {
		const dark =
			typeof document !== 'undefined' &&
			document.documentElement.classList.contains('dark')
		return cartoRasterStyle(dark ? 'dark_all' : 'light_all')
	}, [])
}

export function MapSkeleton({ className }: { className?: string | undefined }) {
	return <Skeleton className={cn('h-56 w-full rounded-md', className)} />
}

/** Fixed-height stand-in so screenshot tests stay deterministic without live tiles. */
export function MapPlaceholder({
	label,
	className,
}: {
	label: string
	className?: string
}) {
	return (
		<Card className={cn('p-3', className)}>
			<SectionLabel className="mb-2">{label}</SectionLabel>
			<div className="bg-muted/40 text-muted-foreground flex h-56 items-center justify-center rounded-md border border-dashed text-xs">
				map disabled
			</div>
		</Card>
	)
}
