import 'maplibre-gl/dist/maplibre-gl.css'
import { CaretUpDownIcon, CheckIcon, MapPinIcon } from '@phosphor-icons/react'
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
	betaCityFor,
	deriveLooseZips,
	deriveSelectedCommunityKeys,
	findCommunity,
	type BetaCityDef,
	type CommunityDef,
} from '@/lib/geography/communities'
import type {
	CitySuggestion,
	CommunitySuggestion,
} from '@/lib/geography/location-search'
import {
	loadCityById,
	loadCityCenter,
	loadCommunityBoundaries,
	searchLocationSuggestions,
} from '@/lib/geography/server'
import { formatCityName, type CityCenter, type City } from '@/lib/geography/zip'
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

function agentCountLabel(agentCount: number) {
	return agentCount === 0
		? 'No agents yet'
		: `${agentCount} agent${agentCount === 1 ? '' : 's'}`
}

export function CityZipSelector({
	id,
	value,
	onChange,
	label = 'City',
	placeholder = 'Search for your city or neighborhood',
	emptyMessage = 'No matching cities or neighborhoods.',
	height = 'md',
	children,
}: CityZipSelectorProps) {
	const selectedCityId = value.cityId
	const selectedZipCodes = value.zipCodes
	const [locationQuery, setLocationQuery] = useState('')
	const [locationOpen, setLocationOpen] = useState(false)
	const queryClient = useQueryClient()

	const { data: suggestions = [] } = useQuery({
		queryKey: ['location-suggestions', locationQuery],
		queryFn: () => searchLocationSuggestions({ data: locationQuery }),
		staleTime: 1000 * 60 * 60,
	})
	const communitySuggestions: CommunitySuggestion[] = []
	const citySuggestions: CitySuggestion[] = []
	for (const suggestion of suggestions) {
		if (suggestion.kind === 'community') {
			communitySuggestions.push(suggestion)
		} else {
			citySuggestions.push(suggestion)
		}
	}

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
		queryKey: ['community-boundaries', selectedCityId],
		queryFn: selectedCityId
			? () => loadCommunityBoundaries({ data: selectedCityId })
			: skipToken,
		staleTime: 1000 * 60 * 60,
	})

	const { data: centerForCity, isPending: centerPending } = useQuery({
		queryKey: ['city-center', selectedCityId],
		queryFn: selectedCityId
			? () => loadCityCenter({ data: selectedCityId })
			: skipToken,
		staleTime: 1000 * 60 * 60,
	})

	const betaCity: BetaCityDef | undefined = displayedCity
		? betaCityFor(displayedCity)
		: undefined
	const selectedCityMeta = citySuggestions.find(
		(suggestion) => suggestion.city.id === selectedCityId,
	)
	const selectionComplete = Boolean(
		selectedCityId && selectedZipCodes.length > 0,
	)

	const warmCityCache = (city: City) => {
		// We already have the full label here — warm the cache so any later
		// `city` lookup for this id (e.g. the signup preview page) is
		// served from memory instead of round-tripping to the server.
		queryClient.setQueryData(['city', city.id], city)
	}

	const selectCity = (suggestion: CitySuggestion) => {
		const city = suggestion.city
		const nextZipCodes = city.id === selectedCityId ? selectedZipCodes : []
		setLocationOpen(false)
		setLocationQuery('')
		onChange({ cityId: city.id, zipCodes: nextZipCodes })
		warmCityCache(city)
	}

	const selectCommunity = (suggestion: CommunitySuggestion) => {
		const found = findCommunity(suggestion.key)
		if (!found) return
		const city = suggestion.city
		const baseZips = city.id === selectedCityId ? selectedZipCodes : []
		const zipCodes = [...new Set([...baseZips, ...found.community.zips])]
		setLocationOpen(false)
		setLocationQuery('')
		onChange({ cityId: city.id, zipCodes })
		warmCityCache(city)
	}

	const toggleCommunity = (community: CommunityDef) => {
		if (!selectedCityId) return
		const selected = new Set(selectedZipCodes)
		const fullySelected = community.zips.every((zip) => selected.has(zip))
		const next = fullySelected
			? selectedZipCodes.filter((zip) => !community.zips.includes(zip))
			: [...new Set([...selectedZipCodes, ...community.zips])]
		onChange({ cityId: selectedCityId, zipCodes: next })
	}

	const removeZip = (zipCode: string) => {
		if (!selectedCityId) return
		onChange({
			cityId: selectedCityId,
			zipCodes: selectedZipCodes.filter((zip) => zip !== zipCode),
		})
	}

	const mapHeight = height === 'sm' ? 'h-64' : 'h-80'

	return (
		<div className="space-y-3">
			{label ? (
				<StepLabel complete={selectionComplete}>{label}</StepLabel>
			) : null}
			<Popover
				open={locationOpen}
				onOpenChange={(open) => {
					if (!open) setLocationQuery('')
					setLocationOpen(open)
				}}
			>
				<PopoverTrigger asChild>
					<Button
						id={id}
						variant="outline"
						aria-expanded={locationOpen}
						className={cn(
							'h-12 w-full justify-between rounded-md px-4 text-left text-base font-semibold shadow-sm transition sm:h-14 sm:text-lg',
							displayedCity
								? 'border-primary/60 bg-background text-foreground hover:bg-primary/[0.04]'
								: 'border-primary/25 bg-background text-foreground hover:border-primary/50 hover:bg-background',
						)}
					>
						<span className="flex min-w-0 flex-1 items-center gap-2.5">
							{displayedCity ? (
								<>
									<Badge
										variant="muted"
										className="shrink-0 px-1.5 text-xs font-semibold tracking-wider"
									>
										{displayedCity.state}
									</Badge>
									<span className="truncate">{displayedCity.name}</span>
									{selectedCityMeta ? (
										<span className="text-muted-foreground shrink-0 text-xs">
											{agentCountLabel(selectedCityMeta.agentCount)}
										</span>
									) : null}
								</>
							) : (
								<span className="text-muted-foreground truncate">
									{placeholder}
								</span>
							)}
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
							placeholder="City or neighborhood..."
						/>
						<CommandList>
							<CommandEmpty>{emptyMessage}</CommandEmpty>
							{communitySuggestions.length > 0 ? (
								<CommandGroup heading="Communities">
									{communitySuggestions.map((suggestion) => (
										<CommandItem
											key={`community-${suggestion.key}`}
											value={`community-${suggestion.key}`}
											onSelect={() => selectCommunity(suggestion)}
											className="gap-2 rounded-md px-2.5 py-2"
										>
											<span className="min-w-0 truncate font-medium">
												{suggestion.name}
											</span>
											<span className="text-muted-foreground ml-auto shrink-0 text-xs">
												{formatCityName(suggestion.city)}
											</span>
										</CommandItem>
									))}
								</CommandGroup>
							) : null}
							<CommandGroup
								heading={
									locationQuery.trim().length < 2 ? 'Top US cities' : 'Cities'
								}
							>
								{citySuggestions.map((suggestion) => {
									const isSelected = suggestion.city.id === selectedCityId
									return (
										<CommandItem
											key={`city-${suggestion.city.id}`}
											value={`city-${suggestion.city.id}`}
											disabled={!suggestion.enabled}
											onSelect={() => selectCity(suggestion)}
											className="gap-2 rounded-md px-2.5 py-2"
										>
											<Badge
												variant="muted"
												className="shrink-0 px-1.5 text-xs font-semibold tracking-wider"
											>
												{suggestion.city.state}
											</Badge>
											<span className="min-w-0 truncate font-medium">
												{suggestion.city.name}
											</span>
											<span className="ml-auto flex shrink-0 items-center gap-1.5">
												{suggestion.enabled ? (
													<>
														<span className="text-muted-foreground text-xs">
															{agentCountLabel(suggestion.agentCount)}
														</span>
														<CheckIcon
															className={cn(
																'h-4 w-4',
																isSelected
																	? 'text-primary opacity-100'
																	: 'opacity-0',
															)}
														/>
													</>
												) : (
													<span className="text-muted-foreground text-xs italic">
														Coming soon
													</span>
												)}
											</span>
										</CommandItem>
									)
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{selectedCityId ? (
				<div className="space-y-3">
					{betaCity ? (
						<CommunityPicker
							city={betaCity}
							selectedZipCodes={selectedZipCodes}
							onToggleCommunity={toggleCommunity}
							onRemoveZip={removeZip}
						/>
					) : displayedCity ? (
						<div className="space-y-2">
							<p className="text-muted-foreground text-xs">
								This market is not open yet — pick a beta city.
							</p>
							{selectedZipCodes.length > 0 ? (
								<div className="flex flex-wrap items-start gap-1.5">
									{selectedZipCodes.map((zipCode) => (
										<button
											key={zipCode}
											type="button"
											onClick={() => removeZip(zipCode)}
											className="border-primary bg-primary text-primary-foreground shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold transition hover:opacity-80"
										>
											{zipCode}
										</button>
									))}
								</div>
							) : null}
						</div>
					) : null}

					<div className="bg-muted/30 border-border overflow-hidden rounded-md border p-3">
						{centerPending ? (
							<Skeleton
								data-testid="zip-map"
								data-idle="false"
								className={cn('rounded-md', mapHeight)}
							/>
						) : (
							<ZipCodeMap
								communities={
									boundaries ?? {
										type: 'FeatureCollection',
										features: [],
									}
								}
								selectedCommunityKeys={
									betaCity
										? deriveSelectedCommunityKeys(betaCity, selectedZipCodes)
										: []
								}
								onToggleCommunity={(key) => {
									const community = betaCity?.communities.find(
										(candidate) => candidate.key === key,
									)
									if (community) toggleCommunity(community)
								}}
								center={centerForCity ?? undefined}
								className={mapHeight}
							/>
						)}
					</div>
					{children}
				</div>
			) : null}
			{!selectedCityId ? (
				<div className="border-border/70 bg-muted/20 overflow-hidden rounded-md border p-3">
					<div
						className={cn(
							'flex flex-col items-center justify-center gap-2 text-center',
							mapHeight,
						)}
					>
						<MapPinIcon className="text-muted-foreground/60 h-6 w-6" />
						<p className="text-muted-foreground text-sm">
							Pick a city to preview it on the map.
						</p>
					</div>
				</div>
			) : null}
		</div>
	)
}

type CommunityPickerProps = {
	city: BetaCityDef
	selectedZipCodes: string[]
	onToggleCommunity: (community: CommunityDef) => void
	onRemoveZip: (zipCode: string) => void
}

function CommunityPicker({
	city,
	selectedZipCodes,
	onToggleCommunity,
	onRemoveZip,
}: CommunityPickerProps) {
	const [open, setOpen] = useState(false)
	const selected = new Set(selectedZipCodes)
	const selectedCommunityKeys = new Set(
		deriveSelectedCommunityKeys(city, selectedZipCodes),
	)
	const looseZips = deriveLooseZips(city, selectedZipCodes)

	return (
		<div className="space-y-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						aria-expanded={open}
						className="border-primary/25 bg-background text-foreground hover:border-primary/50 hover:bg-background h-12 w-full justify-between rounded-md px-4 text-left text-base font-semibold shadow-sm transition"
					>
						<span className="text-muted-foreground min-w-0 flex-1 truncate">
							Search {city.name} communities…
						</span>
						<CaretUpDownIcon className="text-muted-foreground h-4 w-4 shrink-0" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) min-w-[260px] p-0"
				>
					<Command>
						<CommandInput placeholder="Search communities..." />
						<CommandList>
							<CommandEmpty>No matching communities.</CommandEmpty>
							<CommandGroup>
								{city.communities.map((community) => {
									const isSelected = community.zips.every((zip) =>
										selected.has(zip),
									)
									return (
										<CommandItem
											key={community.key}
											value={community.name}
											onSelect={() => onToggleCommunity(community)}
											className="gap-2 rounded-md px-2.5 py-2"
										>
											<span className="min-w-0 truncate font-medium">
												{community.name}
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
			{selectedZipCodes.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					Pick at least one community.
				</p>
			) : (
				<div className="flex flex-wrap items-start gap-1.5">
					{city.communities
						.filter((community) => selectedCommunityKeys.has(community.key))
						.map((community) => (
							<button
								key={`selected-${community.key}`}
								type="button"
								onClick={() => onToggleCommunity(community)}
								className="border-primary bg-primary text-primary-foreground shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold transition hover:opacity-80"
							>
								{community.name} ×
							</button>
						))}
					{looseZips.map((zipCode) => (
						<button
							key={`zip-${zipCode}`}
							type="button"
							onClick={() => onRemoveZip(zipCode)}
							className="border-primary/60 bg-primary/10 text-primary shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold transition hover:opacity-80"
						>
							{zipCode} ×
						</button>
					))}
				</div>
			)}
		</div>
	)
}

type ZipCodeMapProps = {
	/** Dissolved community polygons — the coarse, clickable regions. */
	communities: FeatureCollection
	selectedCommunityKeys: string[]
	onToggleCommunity: (communityKey: string) => void
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

const COMMUNITY_LINE_LAYER = {
	id: 'community-line',
	type: 'line',
	source: 'communities',
	paint: {
		'line-color': '#94a3b8',
		'line-width': 0.5,
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
	communities,
	selectedCommunityKeys,
	onToggleCommunity,
	center,
	className,
}: ZipCodeMapProps) {
	const mapRef = useRef<MapRef>(null)
	const [mapLoaded, setMapLoaded] = useState(false)
	const [mapIdle, setMapIdle] = useState(false)
	const [hovered, setHovered] = useState<{
		name: string
		x: number
		y: number
	} | null>(null)

	// Zoom to the selection when there is one, else the whole metro.
	const focusFeatures = selectedCommunityKeys.length
		? communities.features.filter((feature) =>
				selectedCommunityKeys.includes(feature.properties?.communityKey ?? ''),
			)
		: communities.features
	const bounds = getBounds(focusFeatures)
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

	const hoveredCommunity = hovered?.name ?? ''
	const communityFillLayer = {
		id: 'community-fill',
		type: 'fill',
		source: 'communities',
		paint: {
			'fill-color': [
				'case',
				[
					'boolean',
					['in', ['get', 'communityKey'], ['literal', selectedCommunityKeys]],
					false,
				],
				'#2563eb',
				['==', ['get', 'name'], hoveredCommunity],
				'#93c5fd',
				'#e5e7eb',
			],
			'fill-opacity': 0.5,
		},
	} satisfies LayerProps

	// Self-colored 1px stroke heals sub-pixel slivers between regions; the
	// 0.5px gray line on top is just a boundary hint.
	const communitySelfLineLayer = {
		id: 'community-line-self',
		type: 'line',
		source: 'communities',
		paint: {
			'line-color': [
				'case',
				[
					'boolean',
					['in', ['get', 'communityKey'], ['literal', selectedCommunityKeys]],
					false,
				],
				'#2563eb',
				'#e5e7eb',
			],
			'line-width': 1,
		},
	} satisfies LayerProps

	const communitySelectedLineLayer = {
		id: 'community-line-selected',
		type: 'line',
		source: 'communities',
		filter: ['in', ['get', 'communityKey'], ['literal', selectedCommunityKeys]],
		paint: {
			'line-color': '#024a70',
			'line-width': 2,
		},
	} satisfies LayerProps

	function handleClick(event: MapLayerMouseEvent) {
		const communityKey = event.features?.[0]?.properties?.communityKey
		if (typeof communityKey === 'string') onToggleCommunity(communityKey)
	}

	function handleMouseEnter() {
		if (!mapRef.current) return
		mapRef.current.getCanvas().style.cursor = 'pointer'
	}

	function handleMouseMove(event: MapLayerMouseEvent) {
		const name = event.features?.[0]?.properties?.name
		if (typeof name !== 'string') {
			setHovered(null)
			return
		}
		setHovered({ name, x: event.point.x, y: event.point.y })
	}

	function handleMouseLeave() {
		setHovered(null)
		if (!mapRef.current) return
		mapRef.current.getCanvas().style.cursor = ''
	}

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
			className={cn('relative h-80 overflow-hidden rounded-xl', className)}
		>
			<Map
				ref={mapRef}
				mapStyle={CARTO_STYLE}
				initialViewState={initialViewState}
				dragRotate={false}
				keyboard={false}
				interactiveLayerIds={['community-fill']}
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
				<Source id="communities" type="geojson" data={communities} />
				<Layer {...communityFillLayer} />
				<Layer {...communitySelfLineLayer} />
				<Layer {...COMMUNITY_LINE_LAYER} />
				<Layer {...communitySelectedLineLayer} />
			</Map>
			{hovered ? (
				<div
					className="bg-foreground text-background pointer-events-none absolute z-10 rounded-md px-2 py-1 text-xs font-semibold shadow-md"
					style={{ left: hovered.x + 12, top: hovered.y + 12 }}
				>
					{hovered.name}
				</div>
			) : null}
		</div>
	)
}
