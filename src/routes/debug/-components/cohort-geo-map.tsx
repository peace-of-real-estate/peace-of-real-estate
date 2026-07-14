import 'maplibre-gl/dist/maplibre-gl.css'

import type { FeatureCollection } from 'geojson'
import * as React from 'react'
import Map, { Layer, Marker, Source } from 'react-map-gl/maplibre'
import type {
	LayerProps,
	MapLayerMouseEvent,
	MapRef,
} from 'react-map-gl/maplibre'

import { Card } from '@/components/ui/card'
import type { GeoPoint } from '@/lib/matching/scoring'
import { cn } from '@/lib/utils/ui'
import {
	MapSkeleton,
	useBasemapStyle,
	useMapLibReady,
} from '@/routes/debug/-components/map-support'
import { SectionLabel } from '@/routes/debug/-components/section-label'

export interface CohortAgentPoint {
	agentId: string
	name: string | null
	lat: number
	lng: number
	fitScore: number
	computedScore: number
	disqualified: boolean
}

export interface CohortGeoMapProps {
	client: GeoPoint
	clientLabel: string
	agents: CohortAgentPoint[]
	onSelectAgent: (agentId: string) => void
}

/** Keep one cross-country outlier from zooming the map out to the whole US. */
const BOUNDS_CAP_MILES = 200

function milesBetween(
	a: { lat: number; lng: number },
	b: { lat: number; lng: number },
): number {
	const R = 3958.8
	const dLat = ((b.lat - a.lat) * Math.PI) / 180
	const dLng = ((b.lng - a.lng) * Math.PI) / 180
	const h =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((a.lat * Math.PI) / 180) *
			Math.cos((b.lat * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2)
	return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function CohortGeoMap(props: CohortGeoMapProps) {
	const ready = useMapLibReady()
	const nearby = props.agents.filter(
		(agent) => milesBetween(props.client, agent) <= BOUNDS_CAP_MILES,
	)

	return (
		<Card className="p-3 xl:col-span-2">
			<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
				<SectionLabel>Agent geography</SectionLabel>
				<p className="text-muted-foreground text-[10px]">
					{nearby.length} of {props.agents.length} agents within{' '}
					{BOUNDS_CAP_MILES} mi — click a dot to inspect
				</p>
			</div>
			{ready ? (
				<CohortGeoMapImpl {...props} nearby={nearby} />
			) : (
				<MapSkeleton />
			)}
			<div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-[10px]">
				<LegendDot className="bg-primary" label={props.clientLabel} />
				<LegendDot className="bg-emerald-500" label="fit ≥ 75" />
				<LegendDot className="bg-amber-500" label="fit 40–74" />
				<LegendDot className="bg-red-500" label="fit < 40" />
				<LegendDot
					className="border border-red-500 bg-transparent"
					label="disqualified"
				/>
			</div>
		</Card>
	)
}

function LegendDot({ className, label }: { className: string; label: string }) {
	return (
		<span className="flex items-center gap-1">
			<span className={cn('size-2 rounded-full', className)} />
			{label}
		</span>
	)
}

const AGENT_LAYER = {
	id: 'cohort-agents',
	type: 'circle',
	source: 'cohort-agents',
	paint: {
		'circle-radius': ['case', ['get', 'disqualified'], 4, 5],
		'circle-color': [
			'match',
			['get', 'tone'],
			'high',
			'#10b981',
			'mid',
			'#f59e0b',
			'#ef4444',
		],
		'circle-opacity': ['case', ['get', 'disqualified'], 0, 0.85],
		'circle-stroke-width': ['case', ['get', 'disqualified'], 1.5, 1],
		'circle-stroke-color': [
			'case',
			['get', 'disqualified'],
			'#ef4444',
			'#ffffff',
		],
	},
} satisfies LayerProps

function CohortGeoMapImpl({
	client,
	agents,
	nearby,
	onSelectAgent,
}: CohortGeoMapProps & { nearby: CohortAgentPoint[] }) {
	const mapRef = React.useRef<MapRef>(null)
	const [mapLoaded, setMapLoaded] = React.useState(false)
	const [hovered, setHovered] = React.useState<{
		label: string
		x: number
		y: number
	} | null>(null)
	const mapStyle = useBasemapStyle()

	const points: FeatureCollection = {
		type: 'FeatureCollection',
		features: agents.map((agent) => ({
			type: 'Feature',
			properties: {
				agentId: agent.agentId,
				name: agent.name ?? 'Unknown',
				fitScore: agent.fitScore,
				computedScore: agent.computedScore,
				disqualified: agent.disqualified,
				tone:
					agent.computedScore >= 75
						? 'high'
						: agent.computedScore >= 40
							? 'mid'
							: 'low',
			},
			geometry: { type: 'Point', coordinates: [agent.lng, agent.lat] },
		})),
	}

	const fitKey = `${client.lng},${client.lat},${nearby.length}`
	const lastFitKey = React.useRef('')

	React.useEffect(() => {
		const map = mapRef.current
		if (!map || !mapLoaded) return
		if (lastFitKey.current === fitKey) return
		lastFitKey.current = fitKey

		let minLng = client.lng
		let minLat = client.lat
		let maxLng = client.lng
		let maxLat = client.lat
		for (const agent of nearby) {
			minLng = Math.min(minLng, agent.lng)
			minLat = Math.min(minLat, agent.lat)
			maxLng = Math.max(maxLng, agent.lng)
			maxLat = Math.max(maxLat, agent.lat)
		}
		map.fitBounds(
			[
				[minLng, minLat],
				[maxLng, maxLat],
			],
			{ padding: 40, maxZoom: 10, duration: 0 },
		)
	}, [client, nearby, fitKey, mapLoaded])

	function handleClick(event: MapLayerMouseEvent) {
		const agentId = event.features?.[0]?.properties?.agentId
		if (typeof agentId === 'string') onSelectAgent(agentId)
	}

	function handleMouseMove(event: MapLayerMouseEvent) {
		const properties = event.features?.[0]?.properties
		if (!properties) {
			setHovered(null)
			if (mapRef.current) mapRef.current.getCanvas().style.cursor = ''
			return
		}
		const score = properties.disqualified
			? `DQ (would be ${properties.computedScore}%)`
			: `${properties.fitScore}%`
		setHovered({
			label: `${properties.name} — ${score}`,
			x: event.point.x,
			y: event.point.y,
		})
		if (mapRef.current) mapRef.current.getCanvas().style.cursor = 'pointer'
	}

	return (
		<div className="relative h-72 overflow-hidden rounded-md border">
			<Map
				ref={mapRef}
				mapStyle={mapStyle}
				initialViewState={{
					longitude: client.lng,
					latitude: client.lat,
					zoom: 8,
				}}
				dragRotate={false}
				keyboard={false}
				interactiveLayerIds={['cohort-agents']}
				onClick={handleClick}
				onMouseMove={handleMouseMove}
				onMouseLeave={() => setHovered(null)}
				onLoad={(event) => {
					event.target.touchZoomRotate.disableRotation()
					setMapLoaded(true)
				}}
				style={{ width: '100%', height: '100%' }}
			>
				<Source id="cohort-agents" type="geojson" data={points}>
					<Layer {...AGENT_LAYER} />
				</Source>
				<Marker longitude={client.lng} latitude={client.lat}>
					<span className="bg-primary border-background block size-4 rounded-full border-2 shadow-md" />
				</Marker>
			</Map>
			{hovered && (
				<div
					className="bg-foreground text-background pointer-events-none absolute z-10 rounded-md px-2 py-1 text-xs font-semibold shadow-md"
					style={{ left: hovered.x + 12, top: hovered.y + 12 }}
				>
					{hovered.label}
				</div>
			)}
		</div>
	)
}
