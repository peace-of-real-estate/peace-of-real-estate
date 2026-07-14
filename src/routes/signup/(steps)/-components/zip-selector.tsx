import 'maplibre-gl/dist/maplibre-gl.css'

import { MapPinIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import type { Feature, FeatureCollection } from 'geojson'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Map, { Layer, Source } from 'react-map-gl/maplibre'
import type {
	LayerProps,
	MapLayerMouseEvent,
	MapRef,
} from 'react-map-gl/maplibre'
import type { StyleSpecification } from 'maplibre-gl'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { StepLabel } from './signup-shell'
import { cn } from '@/lib/utils/ui'
import {
	isValidZipCode,
	loadCityCenter,
	loadCitySuggestions,
	loadZipCodeBoundaries,
	parseCityState,
} from '@/lib/geography/zip'

export type CityZipSelectorProps = {
	id?: string
	value: string
	onChange: (value: string, zipCodes: string[]) => void
	zipCodes: string[]
	label?: React.ReactNode
	placeholder?: string
	emptyMessage?: string
	height?: 'sm' | 'md'
	children?: React.ReactNode
}

export function CityZipSelector({
	id,
	value,
	onChange,
	zipCodes,
	label = 'City',
	placeholder = 'Search for your city',
	emptyMessage = 'No matching cities. Try a nearby market.',
	height = 'md',
	children,
}: CityZipSelectorProps) {
	const normalizedInitialLocation = (() => {
		const parsed = parseCityState(value)
		return parsed ? `${parsed.city}, ${parsed.state}` : value
	})()

	const [committedLocation, setCommittedLocation] = useState(
		normalizedInitialLocation,
	)
	const [locationQuery, setLocationQuery] = useState(normalizedInitialLocation)
	const [locationOpen, setLocationOpen] = useState(false)
	const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>(zipCodes)
	const [manualZipCode, setManualZipCode] = useState('')
	const marketComplete = committedLocation.trim().length >= 2
	const cityState = parseCityState(committedLocation)

	const { data: locationSuggestions = [] } = useQuery({
		queryKey: ['city-suggestions', locationQuery],
		queryFn: () => loadCitySuggestions({ data: locationQuery }),
		enabled: locationQuery.trim().length >= 0,
		staleTime: 1000 * 60 * 60,
	})

	const { data: boundaries } = useQuery({
		queryKey: ['zip-code-boundaries', committedLocation],
		queryFn: async () => {
			if (!cityState) {
				return {
					type: 'FeatureCollection',
					features: [],
				} satisfies FeatureCollection
			}
			return loadZipCodeBoundaries({ data: cityState })
		},
		enabled: marketComplete && Boolean(cityState),
		staleTime: 1000 * 60 * 60,
	})

	const { data: centerForCity } = useQuery({
		queryKey: ['city-center', committedLocation],
		queryFn: async () => {
			if (!cityState) return undefined
			return loadCityCenter({ data: cityState })
		},
		enabled: marketComplete && Boolean(cityState),
		staleTime: 1000 * 60 * 60,
	})

	const selectCity = (city: string) => {
		const nextZipCodes = city === committedLocation ? selectedZipCodes : []
		setCommittedLocation(city)
		setLocationQuery(city)
		setSelectedZipCodes(nextZipCodes)
		setLocationOpen(false)
		onChange(city, nextZipCodes)
	}

	const toggleZipCode = (zipCode: string) => {
		setSelectedZipCodes((current) => {
			const next = current.includes(zipCode)
				? current.filter((item) => item !== zipCode)
				: [...current, zipCode]
			onChange(committedLocation, next)
			return next
		})
	}

	const addManualZipCode = () => {
		const zipCode = manualZipCode.trim()
		if (!marketComplete || !isValidZipCode(zipCode)) return
		setSelectedZipCodes((current) => {
			const next = current.includes(zipCode) ? current : [...current, zipCode]
			onChange(committedLocation, next)
			return next
		})
		setManualZipCode('')
	}

	const mapHeight = height === 'sm' ? 'h-64' : 'h-80'

	return (
		<div className="space-y-3">
			{label ? <StepLabel complete={marketComplete}>{label}</StepLabel> : null}
			<Popover
				open={locationOpen}
				onOpenChange={(open) => {
					setLocationQuery(open ? '' : committedLocation)
					setLocationOpen(open)
				}}
			>
				<PopoverTrigger asChild>
					<Button
						id={id}
						variant="outline"
						aria-expanded={locationOpen}
						className={cn(
							'h-12 w-full justify-between rounded-2xl px-4 text-left text-base font-semibold transition sm:h-14 sm:text-lg',
							marketComplete
								? 'border-primary/60 bg-background text-foreground shadow-sm hover:bg-primary/[0.04]'
								: 'border-primary/25 bg-background text-foreground shadow-sm hover:border-primary/50 hover:bg-background',
						)}
					>
						<span
							className={cn(
								!committedLocation && 'text-muted-foreground',
								'truncate',
							)}
						>
							{committedLocation || placeholder}
						</span>
						<ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="w-(--radix-popover-trigger-width) min-w-[260px] p-0"
				>
					<Command shouldFilter={false}>
						<CommandInput
							value={locationQuery}
							onValueChange={setLocationQuery}
							placeholder="Search city..."
						/>
						<CommandList>
							<CommandEmpty>{emptyMessage}</CommandEmpty>
							<CommandGroup
								heading={
									locationQuery.trim().length < 2
										? 'Top US cities'
										: 'City matches'
								}
							>
								{locationSuggestions.map((suggestion) => (
									<CommandItem
										key={suggestion}
										value={suggestion}
										onSelect={selectCity}
									>
										<Check
											className={cn(
												committedLocation === suggestion
													? 'opacity-100'
													: 'opacity-0',
											)}
										/>
										{suggestion}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{marketComplete ? (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<div className="bg-muted/50 relative flex flex-1 items-center rounded-2xl border px-3">
							<input
								value={manualZipCode}
								onChange={(event) => setManualZipCode(event.target.value)}
								placeholder="Add ZIP code"
								inputMode="numeric"
								maxLength={5}
								className="h-11 w-full bg-transparent text-sm font-semibold outline-none"
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={addManualZipCode}
								disabled={!isValidZipCode(manualZipCode.trim())}
								className="h-8 rounded-xl px-3 text-xs"
							>
								Add
							</Button>
						</div>
					</div>
					{selectedZipCodes.length > 0 ? (
						<div className="flex flex-wrap gap-1.5">
							{selectedZipCodes.map((zipCode) => {
								const isSelected = selectedZipCodes.includes(zipCode)
								return (
									<button
										key={zipCode}
										type="button"
										onClick={() => toggleZipCode(zipCode)}
										className={cn(
											'resize-none rounded-full border px-2 py-0.5 text-[10px] font-semibold transition',
											isSelected
												? 'border-primary bg-primary text-primary-foreground shadow-sm'
												: 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
										)}
										aria-pressed={isSelected}
									>
										{zipCode}
									</button>
								)
							})}
						</div>
					) : null}
					<div className="bg-muted/30 border-border overflow-hidden rounded-2xl border p-3">
						{!centerForCity ? (
							<Skeleton className={cn('rounded-2xl', mapHeight)} />
						) : (
							<ZipCodeMap
								boundaries={
									boundaries ?? {
										type: 'FeatureCollection',
										features: [],
									}
								}
								selectedZipCodes={selectedZipCodes}
								center={centerForCity}
								readOnly
								className={mapHeight}
							/>
						)}
					</div>
					{children}
				</div>
			) : (
				<div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
					<MapPinIcon className="text-muted-foreground/60 h-8 w-8" />
					<div>
						<p className="font-semibold">Pick a city to unlock the map</p>
						<p className="text-muted-foreground mt-1 max-w-sm text-sm">
							The ZIP code map and manual ZIP entry will appear here after you
							choose a city.
						</p>
					</div>
				</div>
			)}
		</div>
	)
}

export type ZipCodeMapProps = {
	boundaries: FeatureCollection
	selectedZipCodes: string[]
	onToggleZipCode?: ((zipCode: string) => void) | undefined
	center?: { latitude: number; longitude: number } | undefined
	readOnly?: boolean | undefined
	className?: string | undefined
}

type BBox = {
	minLng: number
	minLat: number
	maxLng: number
	maxLat: number
}

const CARTO_STYLE = {
	version: 8,
	sources: {
		'carto-light': {
			type: 'raster',
			tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'],
			tileSize: 256,
			attribution:
				'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
			maxzoom: 19,
		},
	},
	layers: [
		{
			id: 'carto-light-layer',
			type: 'raster',
			source: 'carto-light',
		},
	],
} satisfies StyleSpecification

const LINE_LAYER = {
	id: 'zip-line',
	type: 'line',
	source: 'zip-codes',
	paint: {
		'line-color': '#9ca3af',
		'line-width': 1,
	},
} satisfies LayerProps

function expandBoundsFromRing(bounds: BBox, ring: unknown) {
	if (!Array.isArray(ring)) return

	for (const point of ring) {
		if (
			!Array.isArray(point) ||
			typeof point[0] !== 'number' ||
			typeof point[1] !== 'number'
		) {
			continue
		}

		const [lng, lat] = point
		bounds.minLng = Math.min(bounds.minLng, lng)
		bounds.minLat = Math.min(bounds.minLat, lat)
		bounds.maxLng = Math.max(bounds.maxLng, lng)
		bounds.maxLat = Math.max(bounds.maxLat, lat)
	}
}

const pointSchema = z.tuple([z.number(), z.number()])
const ringSchema = z.array(pointSchema)
const polygonSchema = z.array(ringSchema)
const multiPolygonSchema = z.array(polygonSchema)

function expandBoundsFromPolygon(
	bounds: BBox,
	coordinates: number[][][] | number[][][][],
) {
	const polygon = polygonSchema.safeParse(coordinates)
	if (polygon.success) {
		for (const ring of polygon.data) {
			expandBoundsFromRing(bounds, ring)
		}
		return
	}

	const multiPolygon = multiPolygonSchema.safeParse(coordinates)
	if (multiPolygon.success) {
		for (const polygon of multiPolygon.data) {
			for (const ring of polygon) {
				expandBoundsFromRing(bounds, ring)
			}
		}
	}
}

function expandBoundsFromFeature(bounds: BBox, feature: Feature) {
	if (feature.geometry.type === 'Polygon') {
		expandBoundsFromPolygon(bounds, feature.geometry.coordinates)
	} else if (feature.geometry.type === 'MultiPolygon') {
		expandBoundsFromPolygon(bounds, feature.geometry.coordinates)
	}
}

function getBounds(features: FeatureCollection['features']): BBox | undefined {
	const bounds: BBox = {
		minLng: Infinity,
		minLat: Infinity,
		maxLng: -Infinity,
		maxLat: -Infinity,
	}

	for (const feature of features) {
		expandBoundsFromFeature(bounds, feature)
	}

	if (!Number.isFinite(bounds.minLng)) return undefined
	return bounds
}

function ZipCodeMapSkeleton({ className }: { className?: string | undefined }) {
	return (
		<div
			className={cn(
				'relative min-h-64 overflow-hidden rounded-2xl border',
				className,
			)}
		>
			<Skeleton className="absolute inset-0" />
		</div>
	)
}

function ZipCodeMapImpl({
	boundaries,
	selectedZipCodes,
	onToggleZipCode,
	center,
	readOnly,
	className,
}: ZipCodeMapProps) {
	const mapRef = useRef<MapRef>(null)
	const [mapLoaded, setMapLoaded] = useState(false)

	const bounds = getBounds(boundaries.features)

	useEffect(() => {
		if (!mapRef.current || !mapLoaded) return

		if (bounds) {
			mapRef.current.fitBounds(
				[
					[bounds.minLng, bounds.minLat],
					[bounds.maxLng, bounds.maxLat],
				],
				{ padding: 24, duration: 0 },
			)
		} else if (center) {
			mapRef.current.flyTo({
				center: [center.longitude, center.latitude],
				zoom: 10,
				duration: 0,
			})
		}
	}, [bounds, center, mapLoaded])

	const fillLayer = {
		id: 'zip-fill',
		type: 'fill',
		source: 'zip-codes',
		paint: {
			'fill-color': [
				'case',
				[
					'boolean',
					['in', ['get', 'ZCTA5'], ['literal', selectedZipCodes]],
					false,
				],
				'#2563eb',
				'#e5e7eb',
			],
			'fill-opacity': 0.5,
		},
	} satisfies LayerProps

	const selectedLineLayer = {
		id: 'zip-line-selected',
		type: 'line',
		source: 'zip-codes',
		filter: ['in', ['get', 'ZCTA5'], ['literal', selectedZipCodes]],
		paint: {
			'line-color': '#2563eb',
			'line-width': 2,
		},
	} satisfies LayerProps

	function handleClick(event: MapLayerMouseEvent) {
		if (!onToggleZipCode) return
		const feature = event.features?.[0]
		const zipCode = feature?.properties?.ZCTA5
		if (typeof zipCode !== 'string') return
		onToggleZipCode(zipCode)
	}

	function handleMouseEnter() {
		if (!mapRef.current) return
		mapRef.current.getCanvas().style.cursor = 'pointer'
	}

	function handleMouseLeave() {
		if (!mapRef.current) return
		mapRef.current.getCanvas().style.cursor = ''
	}

	const interactiveLayerIds = ['zip-fill']

	const initialViewState = center
		? {
				longitude: center.longitude,
				latitude: center.latitude,
				zoom: 10,
			}
		: {
				longitude: -98.5795,
				latitude: 39.8283,
				zoom: 3,
			}

	return (
		<div className={cn('relative h-80 overflow-hidden rounded-2xl', className)}>
			<Map
				ref={mapRef}
				mapStyle={CARTO_STYLE}
				initialViewState={initialViewState}
				dragPan={false}
				dragRotate={false}
				scrollZoom={false}
				doubleClickZoom={false}
				touchZoomRotate={false}
				keyboard={false}
				{...(readOnly ? { interactiveLayerIds: [] } : { interactiveLayerIds })}
				{...(readOnly
					? {}
					: {
							onClick: handleClick,
							onMouseEnter: handleMouseEnter,
							onMouseLeave: handleMouseLeave,
						})}
				onLoad={() => setMapLoaded(true)}
				style={{ width: '100%', height: '100%' }}
			>
				<Source id="zip-codes" type="geojson" data={boundaries} />
				<Layer {...fillLayer} />
				<Layer {...LINE_LAYER} />
				<Layer {...selectedLineLayer} />
			</Map>
		</div>
	)
}

export function ZipCodeMap(props: ZipCodeMapProps) {
	const [Inner, setInner] =
		useState<React.ComponentType<ZipCodeMapProps> | null>(null)

	useEffect(() => {
		let cancelled = false

		void import('react-map-gl/maplibre').then(() => {
			if (cancelled) return
			setInner(() => ZipCodeMapImpl)
		})

		return () => {
			cancelled = true
		}
	}, [])

	if (!Inner) {
		return <ZipCodeMapSkeleton className={props.className} />
	}

	return <Inner {...props} />
}
