import 'maplibre-gl/dist/maplibre-gl.css'
import { useQuery } from '@tanstack/react-query'
import type { FeatureCollection } from 'geojson'
import * as React from 'react'
import Map, { Layer, Marker, Source } from 'react-map-gl/maplibre'
import type { LayerProps, MapRef } from 'react-map-gl/maplibre'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { loadZipCodeBoundaries } from '@/lib/geography/zip'
import type { CityCenter } from '@/lib/geography/zip'
import { cn } from '@/lib/utils/ui'
import {
	LegendDot,
	MapSkeleton,
	useBasemapStyle,
	useFitBoundsOnce,
	useMapLibReady,
} from '@/routes/admin/-components/map-support'
import { SectionLabel } from '@/routes/admin/-components/section-label'

export interface MatchGeoMapProps {
	client: CityCenter
	agent: CityCenter
	miles?: number | undefined
	zipFit: number
	cityFit: number
	clientLabel: string
	agentLabel: string
	/** Client market, for the optional ZIP boundary overlay. */
	clientCityId?: string | undefined
	clientZipCodes: string[]
	agentZipCodes: string[]
}

export function MatchGeoMap(props: MatchGeoMapProps) {
	const ready = useMapLibReady()
	const [showZips, setShowZips] = React.useState(false)
	const zipsAvailable = Boolean(props.clientCityId)

	return (
		<Card className="p-3">
			<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-1.5">
					<SectionLabel>Geography</SectionLabel>
					{props.miles !== undefined && (
						<Badge variant="muted" className="font-mono text-[10px]">
							{props.miles.toFixed(1)} mi apart
						</Badge>
					)}
					<Badge variant="muted" className="font-mono text-[10px]">
						zipFit {props.zipFit.toFixed(2)}
					</Badge>
					<Badge variant="muted" className="font-mono text-[10px]">
						cityFit {props.cityFit.toFixed(2)}
					</Badge>
				</div>
				{zipsAvailable && (
					<button
						type="button"
						onClick={() => setShowZips((current) => !current)}
						className={cn(
							'rounded px-1.5 py-0.5 font-mono text-[10px] transition',
							showZips
								? 'bg-muted text-foreground font-semibold'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{showZips ? 'hide ZIPs' : 'show ZIPs'}
					</button>
				)}
			</div>

			{ready ? (
				<MatchGeoMapImpl {...props} showZips={showZips} />
			) : (
				<MapSkeleton />
			)}

			<div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-[10px]">
				<LegendDot className="bg-primary" label={props.clientLabel} />
				<LegendDot className="bg-amber-500" label={props.agentLabel} />
			</div>
		</Card>
	)
}

const EMPTY_BOUNDARIES: FeatureCollection = {
	type: 'FeatureCollection',
	features: [],
}

function MatchGeoMapImpl({
	client,
	agent,
	miles,
	clientCityId,
	clientZipCodes,
	agentZipCodes,
	showZips,
}: MatchGeoMapProps & { showZips: boolean }) {
	const mapRef = React.useRef<MapRef>(null)
	const [mapLoaded, setMapLoaded] = React.useState(false)
	const mapStyle = useBasemapStyle()

	const { data: boundaries } = useQuery({
		queryKey: ['debug-zip-boundaries', clientCityId],
		queryFn: async () => {
			if (!clientCityId) return EMPTY_BOUNDARIES
			return loadZipCodeBoundaries({ data: clientCityId })
		},
		enabled: showZips && Boolean(clientCityId),
		staleTime: 1000 * 60 * 60,
	})

	const fitKey = `${client.lng},${client.lat},${agent.lng},${agent.lat}`
	const bounds = React.useMemo<[[number, number], [number, number]]>(
		() => [
			[Math.min(client.lng, agent.lng), Math.min(client.lat, agent.lat)],
			[Math.max(client.lng, agent.lng), Math.max(client.lat, agent.lat)],
		],
		[client, agent],
	)
	useFitBoundsOnce(mapRef, mapLoaded, fitKey, bounds, {
		padding: 48,
		maxZoom: 11,
	})

	const connector: FeatureCollection = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'LineString',
					coordinates: [
						[client.lng, client.lat],
						[agent.lng, agent.lat],
					],
				},
			},
		],
	}

	const connectorLayer = {
		id: 'match-connector',
		type: 'line',
		source: 'match-connector',
		paint: {
			'line-color': '#6b7280',
			'line-width': 1.5,
			'line-dasharray': [2, 2],
		},
	} satisfies LayerProps

	const zipFillLayer = {
		id: 'match-zip-fill',
		type: 'fill',
		source: 'match-zips',
		paint: {
			'fill-color': [
				'case',
				[
					'all',
					['in', ['get', 'ZCTA5'], ['literal', clientZipCodes]],
					['in', ['get', 'ZCTA5'], ['literal', agentZipCodes]],
				],
				'#10b981',
				['in', ['get', 'ZCTA5'], ['literal', clientZipCodes]],
				'#2563eb',
				['in', ['get', 'ZCTA5'], ['literal', agentZipCodes]],
				'#f59e0b',
				'#e5e7eb',
			],
			'fill-opacity': 0.35,
		},
	} satisfies LayerProps

	const zipLineLayer = {
		id: 'match-zip-line',
		type: 'line',
		source: 'match-zips',
		paint: {
			'line-color': '#9ca3af',
			'line-width': 0.5,
		},
	} satisfies LayerProps

	const midpoint = {
		lng: (client.lng + agent.lng) / 2,
		lat: (client.lat + agent.lat) / 2,
	}

	return (
		<div className="relative h-56 overflow-hidden rounded-md border">
			<Map
				ref={mapRef}
				mapStyle={mapStyle}
				initialViewState={{
					longitude: midpoint.lng,
					latitude: midpoint.lat,
					zoom: 8,
				}}
				dragRotate={false}
				keyboard={false}
				onLoad={(event) => {
					event.target.touchZoomRotate.disableRotation()
					setMapLoaded(true)
				}}
				style={{ width: '100%', height: '100%' }}
			>
				{showZips && (
					<Source
						id="match-zips"
						type="geojson"
						data={boundaries ?? EMPTY_BOUNDARIES}
					>
						<Layer {...zipFillLayer} />
						<Layer {...zipLineLayer} />
					</Source>
				)}
				<Source id="match-connector" type="geojson" data={connector}>
					<Layer {...connectorLayer} />
				</Source>
				<Marker longitude={client.lng} latitude={client.lat}>
					<span className="bg-primary border-background block size-3.5 rounded-full border-2 shadow-md" />
				</Marker>
				<Marker longitude={agent.lng} latitude={agent.lat}>
					<span className="border-background block size-3.5 rounded-full border-2 bg-amber-500 shadow-md" />
				</Marker>
				{miles !== undefined && (
					<Marker longitude={midpoint.lng} latitude={midpoint.lat}>
						<span className="bg-foreground text-background rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold shadow-md">
							{miles.toFixed(1)} mi
						</span>
					</Marker>
				)}
			</Map>
		</div>
	)
}
