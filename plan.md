# Interactive Zip-Code Map + NYC Five Boroughs

## Context

The signup quiz has a city + zip-code selector (`CityZipSelector`) that shows a
city's zip polygons on a MapLibre map, but clicking polygons does nothing — no
pointer cursor either. Users should be able to click a zip polygon to select it
(it highlights blue and a pill appears above the map) and click again — polygon
or pill — to deselect. Separately, picking "New York, NY" only shows Manhattan
zips because the seed script groups zips by the `zipcodes` npm package's own
city labels, and borough zips are labeled "Brooklyn", "Bronx", "Staten Island",
or Queens neighborhood names.

**Key discovery:** the interactivity is already implemented as dead code.
`ZipCodeMapImpl` in `src/routes/signup/(quiz)/-components/city-zip-selector.tsx`
already has `handleClick` (toggles via `feature.properties.ZCTA5`),
pointer-cursor hover handlers, `interactiveLayerIds`, and selected-zip highlight
layers — all disabled because `CityZipSelector` renders the map with `readOnly`
and never passes `onToggleZipCode`. The selected-zip pill row with
click-to-deselect also already exists. Most of Phase 1 is wiring + polish.

**Decisions made with the user:**

1. NYC fix at seed time by explicit zip ranges; boroughs stay searchable as
   their own cities ("Brooklyn, NY" still works).
2. Hover tooltip showing the zip number (DOM overlay — NOT a maplibre symbol
   layer; the raster CARTO style has no `glyphs`, text layers would silently
   fail).
3. Enable pan + zoom (rotation stays off) so dense cities like NYC are
   clickable.

**Verified facts (do not re-derive):**

- `ZipCodeMap` and `readOnly` are used ONLY inside `city-zip-selector.tsx` — the
  prop can be deleted entirely. No tests reference these components.
- Scripts: `pnpm check` (vp check), `pnpm test` (vp test run), `pnpm db:init`
  (tsx scripts/init.ts), `pnpm compose:up` (Postgres), `pnpm dev`.
- Seed inserts use `onConflictDoNothing` on `(city,state)` and
  `(city,state,zip)`, so re-running `pnpm db:init` is additive and idempotent —
  no migration, no destructive step.
- react-map-gl v8 (`react-map-gl/maplibre`): `onMouseMove` on `<Map>` receives
  `MapLayerMouseEvent` with `features` populated only over `interactiveLayerIds`
  layers; `event.point` is `{x, y}` container pixels. `MapLayerMouseEvent` is
  already imported in the file.
- Latent bug that matters once pan/zoom is on: `getBounds()` returns a fresh
  object every render and the fit effect deps are `[bounds, center, mapLoaded]`,
  so every zip toggle re-runs `fitBounds` and would yank the camera. Fixed in
  step 1.4.

**Conventions:** no non-null assertions (destructure and guard); run
`pnpm check` and `pnpm test` before each commit; one commit per phase.

---

## Phase 1 (commit 1): Make the map interactive

All edits in `src/routes/signup/(quiz)/-components/city-zip-selector.tsx`.

### 1.1 Wire up the map in `CityZipSelector` (~lines 269–280)

Add `onToggleZipCode={toggleZipCode}`, remove `readOnly`:

```tsx
<ZipCodeMap
	boundaries={
		boundaries ?? {
			type: 'FeatureCollection',
			features: [],
		}
	}
	selectedZipCodes={selectedZipCodes}
	onToggleZipCode={toggleZipCode}
	center={centerForCity}
	className={mapHeight}
/>
```

### 1.2 Clean up the dead `isSelected` branch in the pill row (~lines 242–264)

The row maps over `selectedZipCodes`, so `isSelected` is always true. Replace
the block with:

```tsx
{
	selectedZipCodes.length > 0 ? (
		<div className="flex flex-wrap gap-1.5">
			{selectedZipCodes.map((zipCode) => (
				<button
					key={zipCode}
					type="button"
					onClick={() => toggleZipCode(zipCode)}
					className="border-primary bg-primary text-primary-foreground rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm transition hover:opacity-80"
					aria-pressed
				>
					{zipCode}
				</button>
			))}
		</div>
	) : null
}
```

### 1.3 Delete the `readOnly` prop

- In `ZipCodeMapProps` (~line 306): delete `readOnly?: boolean | undefined`.
- In the `ZipCodeMapImpl` destructure (~lines 432–439): delete `readOnly,`.
- Keep `onToggleZipCode` optional and keep the `if (!onToggleZipCode) return`
  guard in `handleClick`.

### 1.4 Fix the re-fit bug (replace `const bounds = ...` + the `useEffect`, ~lines 443–463)

```ts
const bounds = getBounds(boundaries.features)
const fitKey = bounds
	? `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`
	: center
		? `${center.longitude},${center.latitude}`
		: ''
const lastFitKey = useRef('')

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
			center: [center.longitude, center.latitude],
			zoom: 10,
			duration: 0,
		})
	}
}, [bounds, center, fitKey, mapLoaded])
```

`useRef` is already imported. The string `fitKey` only changes when geometry or
the fallback center actually changes (new city / boundaries arriving), so zip
toggles and user pans never re-fit, while city changes still do.

### 1.5 Hover state, tooltip data, and hover fill tint

Add state next to `mapLoaded` (~line 441):

```ts
const [hovered, setHovered] = useState<{
	zipCode: string
	x: number
	y: number
} | null>(null)
```

Update `fillLayer` (~lines 465–482) to add a hover branch:

```ts
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
```

If `pnpm check` rejects the bare `['==', ...]` condition under `LayerProps`,
wrap it as `['boolean', ['==', ['get', 'ZCTA5'], hoveredZipCode], false]` to
match the existing pattern.

Add `handleMouseMove` next to `handleClick`, and clear hover in
`handleMouseLeave`:

```ts
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
```

`handleMouseEnter` stays unchanged.

### 1.6 Enable pan/zoom, unconditional handlers, render tooltip (replace the JSX return of `ZipCodeMapImpl`, ~lines 527–556)

```tsx
return (
	<div className={cn('relative h-80 overflow-hidden rounded-2xl', className)}>
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
```

Notes:

- Removing `dragPan={false}`, `scrollZoom={false}`, `doubleClickZoom={false}`,
  `touchZoomRotate={false}` enables them (maplibre defaults).
  `dragRotate={false}` and `keyboard={false}` stay. `event.target` in `onLoad`
  is the maplibre `Map`; `disableRotation()` keeps pinch-zoom but kills touch
  rotation.
- The tooltip MUST be `pointer-events-none` (it sits under the cursor; otherwise
  it flickers mouseleave events).
- MapLibre suppresses `click` after a drag, so panning won't accidentally toggle
  zips.

### 1.7 Check and commit

`pnpm check` && `pnpm test`, then commit only
`src/routes/signup/(quiz)/-components/city-zip-selector.tsx`:
`feat(signup): make zip-code map interactive with hover tooltip and pan/zoom`

---

## Phase 2 (commit 2): "New York, NY" includes all five boroughs

### 2.1 Edit `scripts/init.ts`

After the constants (line 6, `const BATCH_SIZE_ZIPS = 2000`), insert:

```ts
// Official NYC borough ZIP ranges. Records in these ranges are ALSO added to
// the "New York, NY" city group so the whole city shows all five boroughs,
// while boroughs/neighborhoods stay searchable under their own city labels.
// Careful: 110xx (except 11004-11005) and 115xx are Nassau County, not NYC.
const NYC_ZIP_RANGES: Array<[number, number]> = [
	[10001, 10282], // Manhattan
	[10301, 10314], // Staten Island
	[10451, 10475], // Bronx
	[11004, 11005], // Queens (Glen Oaks / Floral Park border)
	[11101, 11109], // Queens (Long Island City / Astoria)
	[11201, 11256], // Brooklyn
	[11351, 11499], // Queens (Flushing, Bayside, Jamaica, JFK)
	[11691, 11697], // Queens (the Rockaways)
]

function isNycZip(zip: string): boolean {
	const value = Number.parseInt(zip, 10)
	if (!Number.isFinite(value)) return false
	return NYC_ZIP_RANGES.some(([min, max]) => value >= min && value <= max)
}
```

(Do NOT use `11351–11697` as one range — it would swallow Nassau County 115xx:
Mineola, Garden City, Hempstead. Nassau uses no 114xx zips, so 11351–11499 is
safe.)

Inside the `for (const record of Object.values(zipcodes.codes))` loop,
immediately after `group.zips.push(record.zip)` (line 45), insert:

```ts
if (
	record.state === 'NY' &&
	record.city !== 'New York' &&
	isNycZip(record.zip)
) {
	const nycKey = 'New York|NY'
	let nycGroup = cityGroups.get(nycKey)
	if (!nycGroup) {
		nycGroup = {
			city: 'New York',
			state: 'NY',
			lats: [],
			lngs: [],
			zips: [],
		}
		cityGroups.set(nycKey, nycGroup)
	}
	if (
		typeof record.latitude === 'number' &&
		typeof record.longitude === 'number'
	) {
		nycGroup.lats.push(record.latitude)
		nycGroup.lngs.push(record.longitude)
	}
	nycGroup.zips.push(record.zip)
}
```

The `record.city !== 'New York'` guard prevents duplicate zips (Manhattan
records already flow in via the normal grouping). On an existing DB, the stored
New York center stays Manhattan-averaged (`onConflictDoNothing` keeps the old
`cities` row) — harmless, the map fits to boundary bounds; center is only the
pre-boundaries fallback.

### 2.2 Raise the boundary cap in `src/lib/geography/zip.ts`

Line 12: `const MAX_ZIPS = 200` → `const MAX_ZIPS = 500`.

All-boroughs NYC has ~300+ `city_zips` rows (~214 real ZCTAs; TIGERweb silently
drops PO-box-only zips). Existing `BATCH_SIZE = 50` batching handles the fan-out
(≤10 parallel TIGERweb requests).

### 2.3 Check, reseed, commit

```
pnpm check
pnpm test
pnpm compose:up   # if Postgres isn't running
pnpm db:init      # additive, idempotent reseed
```

Optional DB sanity check:

```
psql "$DATABASE_URL" -c "select count(*) from city_zips where city='New York' and state='NY';"
```

Expect ~300+ rows (was ~150), including 11201 (Brooklyn), 10451 (Bronx), 10301
(Staten Island), 11101 (Queens); Nassau zips 11501/11530/11550 must NOT be
present.

Commit `scripts/init.ts` + `src/lib/geography/zip.ts`:
`fix(geo): include all five boroughs in New York, NY zip seed; raise boundary zip cap`

---

## End-to-end verification

1. `pnpm compose:up`, `pnpm db:init`, `pnpm dev`.
2. Open the agent signup market step (`/signup/agent/market`, route file
   `src/routes/signup/(quiz)/agent/(step-2).market.tsx`). Buyer/seller flows
   share the same `CityZipSelector` via `client-quiz-fields.tsx`.
3. Pick "New York, NY" → map fits to all five boroughs (not just Manhattan).
   First load may take a few seconds (multiple TIGERweb batches).
4. Hover a polygon → pointer cursor, light-blue tint, dark tooltip with the
   5-digit zip following the cursor; moving off polygons hides it.
5. Click a polygon → fills blue with blue outline, matching pill appears above
   the map. Click the polygon again OR its pill → deselects (gray fill, pill
   gone).
6. Drag pans, scroll/double-click zooms, no rotation.
7. Re-fit regression: pan/zoom away, then click a polygon or add a manual zip
   (e.g. `07030`) → camera must NOT snap back. Switching city MUST re-fit.
8. "Brooklyn, NY" still searchable as its own city.
9. `pnpm check` and `pnpm test` pass at each commit boundary. No migrations
   (schema untouched).
