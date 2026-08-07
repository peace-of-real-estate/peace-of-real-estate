import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPinIcon } from '@phosphor-icons/react'
import { CaretUpDownIcon, CheckIcon } from '@phosphor-icons/react'
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Feature, FeatureCollection } from 'geojson'
import { useEffect, useRef, useState } from 'react'
import Map, { Layer, Source } from 'react-map-gl/maplibre'
import type {
	LayerProps,
	MapLayerMouseEvent,
	MapRef,
} from 'react-map-gl/maplibre'
import { z } from 'zod/mini'

import { Badge } from '@/components/ui/badge'
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
import { cartoRasterStyle } from '@/lib/geography/basemap'
import {
	formatCityName,
	isValidZipCode,
	loadCityById,
	loadCityCenter,
	loadCitySuggestions,
	loadZipCodeBoundaries,
	type CityCenter,
	type City,
} from '@/lib/geography/zip'
import { cn } from '@/lib/utils/ui'

import { StepLabel } from './signup-shell'

export type LocationSelection = {
	cityId: string | undefined
	zipCodes: string[]
}

export type CityZipSelectorProps = {
	id?: string
	value: LocationSelection
	onChange: (next: LocationSelection) => void
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
	label = 'City',
	placeholder = 'Search for your city',
	emptyMessage = 'No matching cities. Try a nearby market.',
	height = 'md',
	children,
}: CityZipSelectorProps) {
	const selectedCityId = value.cityId
	const selectedZipCodes = value.zipCodes
	const [locationQuery, setLocationQuery] = useState('')
	const [locationOpen, setLocationOpen] = useState(false)
	const [manualZipCode, setManualZipCode] = useState('')
	const marketComplete = Boolean(selectedCityId)
	const queryClient = useQueryClient()

	const { data: locationSuggestions = [] } = useQuery({
		queryKey: ['city-suggestions', locationQuery],
		queryFn: () => loadCitySuggestions({ data: locationQuery }),
		staleTime: 1000 * 60 * 60,
	})

	const { data: displayedCity } = useQuery({
		queryKey: ['city', selectedCityId],
		queryFn: selectedCityId
			? () => loadCityById({ data: selectedCityId })
			: skipToken,
		staleTime: 1000 * 60 * 60,
	})

	// A persisted draft can reference a city that no longer exists (e.g. the
	// DB was wiped and reseeded). `null` is a definitive not-found — clear the
	// stale selection so the step doesn't sit complete-but-broken.
	useEffect(() => {
		if (displayedCity !== null || !selectedCityId) return
		onChange({ cityId: undefined, zipCodes: [] })
	}, [displayedCity, selectedCityId, onChange])

	const { data: boundaries } = useQuery({
		queryKey: ['zip-code-boundaries', selectedCityId],
		queryFn: selectedCityId
			? () => loadZipCodeBoundaries({ data: selectedCityId })
			: skipToken,
		staleTime: 1000 * 60 * 60,
	})

	const cityZipCodes = boundaries
		? new Set(
				boundaries.features
					.map((f) => f.properties?.ZCTA5)
					.filter((z) => typeof z === 'string'),
			)
		: undefined

	const { data: centerForCity, isPending: centerPending } = useQuery({
		queryKey: ['city-center', selectedCityId],
		queryFn: selectedCityId
			? () => loadCityCenter({ data: selectedCityId })
			: skipToken,
		staleTime: 1000 * 60 * 60,
	})

	const selectCity = (city: City) => {
		const nextZipCodes = city.id === selectedCityId ? selectedZipCodes : []
		setLocationQuery(formatCityName(city))
		setLocationOpen(false)
		onChange({ cityId: city.id, zipCodes: nextZipCodes })
		// We already have the full label here — warm the cache so any later
		// `city` lookup for this id (e.g. the signup preview page) is
		// served from memory instead of round-tripping to the server.
		queryClient.setQueryData(['city', city.id], city)
	}

	const toggleZipCode = (zipCode: string) => {
		if (!selectedCityId) return
		const next = selectedZipCodes.includes(zipCode)
			? selectedZipCodes.filter((item) => item !== zipCode)
			: [...selectedZipCodes, zipCode]
		onChange({ cityId: selectedCityId, zipCodes: next })
	}

	const isAddableZipCode = (zipCode: string) =>
		isValidZipCode(zipCode) &&
		(cityZipCodes === undefined || cityZipCodes.has(zipCode))

	const addManualZipCode = () => {
		const zipCode = manualZipCode.trim()
		if (!selectedCityId || !isAddableZipCode(zipCode)) return
		const next = selectedZipCodes.includes(zipCode)
			? selectedZipCodes
			: [...selectedZipCodes, zipCode]
		onChange({ cityId: selectedCityId, zipCodes: next })
		setManualZipCode('')
	}

	const mapHeight = height === 'sm' ? 'h-64' : 'h-80'

	return (
		<div className="space-y-3">
			{label ? <StepLabel complete={marketComplete}>{label}</StepLabel> : null}
			<Popover
				open={locationOpen}
				onOpenChange={(open) => {
					setLocationQuery(
						open ? '' : displayedCity ? formatCityName(displayedCity) : '',
					)
					setLocationOpen(open)
				}}
			>
				<PopoverTrigger asChild>
					<Button
						id={id}
						variant="outline"
						aria-expanded={locationOpen}
						className={cn(
							'h-12 w-full justify-between rounded-lg px-4 text-left text-base font-semibold transition sm:h-14 sm:text-lg',
							marketComplete
								? 'border-primary/60 bg-background text-foreground shadow-sm hover:bg-primary/[0.04]'
								: 'border-primary/25 bg-background text-foreground shadow-sm hover:border-primary/50 hover:bg-background',
						)}
					>
						<span className="flex min-w-0 flex-1 items-center gap-2.5">
							{displayedCity?.state ? (
								<Badge
									variant="muted"
									className="shrink-0 px-1.5 text-[10px] font-semibold tracking-wider"
								>
									{displayedCity.state}
								</Badge>
							) : null}
							<span
								className={cn(
									'truncate',
									!displayedCity && 'text-muted-foreground',
								)}
							>
								{displayedCity?.name ?? placeholder}
							</span>
						</span>
						<CaretUpDownIcon className="text-muted-foreground h-4 w-4 shrink-0" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) min-w-[260px] p-0"
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
								{locationSuggestions.map((suggestion) => {
									const isSelected = suggestion.id === selectedCityId
									return (
										<CommandItem
											key={suggestion.id}
											value={suggestion.id}
											onSelect={() => selectCity(suggestion)}
											className="gap-2 rounded-md px-2.5 py-2"
										>
											<Badge
												variant="muted"
												className="shrink-0 px-1.5 text-[10px] font-semibold tracking-wider"
											>
												{suggestion.state}
											</Badge>
											<span className="min-w-0 truncate font-medium">
												{suggestion.name}
											</span>
											<span className="ml-auto flex shrink-0 items-center gap-1.5">
												<CheckIcon
													className={cn(
														'h-4 w-4',
														isSelected
															? 'text-primary opacity-100'
															: 'opacity-0',
													)}
												/>
											</span>
										</CommandItem>
									)
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{marketComplete ? (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<div className="bg-muted/50 relative flex flex-1 items-center rounded-lg border px-3">
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
								disabled={!isAddableZipCode(manualZipCode.trim())}
								className="h-8 rounded-md px-3 text-xs"
							>
								Add
							</Button>
						</div>
					</div>
					<div className="flex h-13 flex-wrap content-start items-start gap-1.5 overflow-y-auto">
						{selectedZipCodes.length > 0 ? (
							selectedZipCodes.map((zipCode) => (
								<button
									key={zipCode}
									type="button"
									onClick={() => toggleZipCode(zipCode)}
									className="border-primary bg-primary text-primary-foreground shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold transition hover:opacity-80"
									aria-pressed
								>
									{zipCode}
								</button>
							))
						) : (
							<p className="text-muted-foreground flex h-full items-center text-xs">
								Click ZIPs on the map or add one above.
							</p>
						)}
					</div>
					<div className="bg-muted/30 border-border overflow-hidden rounded-lg border p-3">
						{centerPending ? (
							<Skeleton
								data-testid="zip-map"
								data-idle="false"
								className={cn('rounded-lg', mapHeight)}
							/>
						) : (
							<ZipCodeMap
								boundaries={
									boundaries ?? {
										type: 'FeatureCollection',
										features: [],
									}
								}
								selectedZipCodes={selectedZipCodes}
								onToggleZipCode={toggleZipCode}
								center={centerForCity ?? undefined}
								className={mapHeight}
							/>
						)}
					</div>
					{children}
				</div>
			) : (
				<div className="space-y-3">
					<div className="bg-muted/50 relative flex items-center rounded-lg border px-3 opacity-60">
						<input
							placeholder="Add ZIP code"
							disabled
							className="h-11 w-full bg-transparent text-sm font-semibold outline-none"
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled
							className="h-8 rounded-md px-3 text-xs"
						>
							Add
						</Button>
					</div>
					<div className="border-border/70 bg-muted/20 overflow-hidden rounded-lg border p-3">
						<div
							className={cn(
								'flex flex-col items-center justify-center gap-2 text-center',
								mapHeight,
							)}
						>
							<MapPinIcon className="text-muted-foreground/60 h-6 w-6" />
							<p className="text-muted-foreground text-sm">
								Pick a city to unlock the ZIP map.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

type ZipCodeMapProps = {
	boundaries: FeatureCollection
	selectedZipCodes: string[]
	onToggleZipCode?: ((zipCode: string) => void) | undefined
	center?: CityCenter | undefined
	className?: string | undefined
}

type BBox = {
	minLng: number
	minLat: number
	maxLng: number
	maxLat: number
}

const CARTO_STYLE = cartoRasterStyle('light_all')

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
	const polygon = z.safeParse(polygonSchema, coordinates)
	if (polygon.success) {
		for (const ring of polygon.data) {
			expandBoundsFromRing(bounds, ring)
		}
		return
	}

	const multiPolygon = z.safeParse(multiPolygonSchema, coordinates)
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

function ZipCodeMap({
	boundaries,
	selectedZipCodes,
	onToggleZipCode,
	center,
	className,
}: ZipCodeMapProps) {
	const mapRef = useRef<MapRef>(null)
	const [mapLoaded, setMapLoaded] = useState(false)
	const [mapIdle, setMapIdle] = useState(false)
	const [hovered, setHovered] = useState<{
		zipCode: string
		x: number
		y: number
	} | null>(null)

	const bounds = getBounds(boundaries.features)
	const fitKey = bounds
		? `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`
		: center
			? `${center.lng},${center.lat}`
			: ''
	const lastFitKey = useRef('')

	const [renderedFitKey, setRenderedFitKey] = useState(fitKey)
	if (renderedFitKey !== fitKey) {
		setRenderedFitKey(fitKey)
		setMapIdle(false)
	}

	useEffect(() => {
		const map = mapRef.current
		if (!map || !mapLoaded) return
		if (fitKey === '' || lastFitKey.current === fitKey) return
		lastFitKey.current = fitKey

		if (bounds) {
			map.fitBounds(
				[
					[bounds.minLng, bounds.minLat],
					[bounds.maxLng, bounds.maxLat],
				],
				{ padding: 24, duration: 0 },
			)
		} else if (center) {
			map.flyTo({
				center: [center.lng, center.lat],
				zoom: 10,
				duration: 0,
			})
		}
	}, [bounds, center, fitKey, mapLoaded])

	const hoveredZipCode = hovered ? hovered.zipCode : ''
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
				['==', ['get', 'ZCTA5'], hoveredZipCode],
				'#93c5fd',
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

	function handleMouseMove(event: MapLayerMouseEvent) {
		const feature = event.features?.[0]
		const zipCode = feature?.properties?.ZCTA5
		if (typeof zipCode !== 'string') {
			setHovered(null)
			return
		}
		setHovered({ zipCode, x: event.point.x, y: event.point.y })
	}

	function handleMouseLeave() {
		setHovered(null)
		if (!mapRef.current) return
		mapRef.current.getCanvas().style.cursor = ''
	}

	const interactiveLayerIds = ['zip-fill']

	const initialViewState = center
		? {
				longitude: center.lng,
				latitude: center.lat,
				zoom: 10,
			}
		: {
				longitude: -98.5795,
				latitude: 39.8283,
				zoom: 3,
			}

	return (
		<div
			data-testid="zip-map"
			data-idle={mapIdle ? 'true' : 'false'}
			className={cn('relative h-80 overflow-hidden rounded-lg', className)}
		>
			<Map
				ref={mapRef}
				mapStyle={CARTO_STYLE}
				initialViewState={initialViewState}
				dragRotate={false}
				keyboard={false}
				interactiveLayerIds={interactiveLayerIds}
				onClick={handleClick}
				onMouseEnter={handleMouseEnter}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				onIdle={() => setMapIdle(true)}
				onLoad={(event) => {
					event.target.touchZoomRotate.disableRotation()
					setMapLoaded(true)
				}}
				style={{ width: '100%', height: '100%' }}
			>
				<Source id="zip-codes" type="geojson" data={boundaries} />
				<Layer {...fillLayer} />
				<Layer {...LINE_LAYER} />
				<Layer {...selectedLineLayer} />
			</Map>
			{hovered ? (
				<div
					className="bg-foreground text-background pointer-events-none absolute z-10 rounded-md px-2 py-1 text-xs font-semibold shadow-md"
					style={{ left: hovered.x + 12, top: hovered.y + 12 }}
				>
					{hovered.zipCode}
				</div>
			) : null}
		</div>
	)
}
