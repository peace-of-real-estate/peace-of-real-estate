# Debug Panel Rewrite — Scenario Workbench

## Context

The matching debug panel (`/debug/matches`) grew feature-by-feature into 38
components / ~4.4k lines under `src/routes/debug/`. The architecture is sound
(ranking rail → inspector master–detail, keyboard nav, faithful `ScoreTrace`
rendering, geo maps), but the same facts are rendered redundantly in many
places, the cohort overview is five equal-weight cards with no hierarchy, and —
the biggest gap — there is **no way to edit the buyer/seller profile you are
testing with**. Every experiment today requires editing DB rows.

This plan rewrites the panel into a **Scenario Workbench**: three zones — Client
Sandbox (left, always-editable profile form) | Ranking (center, with rank-delta
chips) | Inspector (right, slimmed trace view). Editing any client attribute
rescores the cohort ephemerally (nothing persisted) and diffs against a pinned
baseline.

**Decisions already made with the user (do not relitigate):**

1. Direction: Scenario Workbench (three-zone). The redundancy cleanup runs FIRST
   as its own phase; a pipeline "funnel strip" replaces the cohort overview card
   grid as the inspector's empty-selection state.
2. Tweakable knobs: **client attributes only**. Algorithm-side knobs
   (`ScoringVariant`, dimension weights) stay out of the UI — they remain in
   `scripts/compare-scoring.ts` only.
3. The price-bucket data bug is fixed **properly and first** (signup
   serialization fix + hand-written data migration), before the what-if engine
   ships. No in-memory workaround in the debug path.
4. Diffing is a core requirement, at two grains: an always-on cumulative diff vs
   a pinned baseline (Δ-rank chips, gate flips, a two-column before/after mode)
   and an on-demand per-attribute attribution pass.
5. Editing **agent** profiles is explicitly out of scope. The client is the
   experiment variable; agents are the population.

## Verified facts (do not re-derive)

- **Scripts** (`package.json`): `pnpm check` (vp check = format+lint+types),
  `pnpm test` (vp test run), `pnpm test:unit` / `test:server` / `test:browser`
  per project, and `pnpm test:update` (=
  `vp test run --project browser --update`) to regenerate screenshot baselines.
  Run `vp install` once before starting.
- **Screenshot harness**: `tests/support/render/screenshot.ts` →
  `expectScreenshot` with zero-pixel tolerance at 1440×900 (some tests use
  1152×720). The debug page's screenshot tests live in
  `src/routes/debug/-components/debug-matches-page.test.tsx` (312 lines) and
  render `DebugMatchesPage` with injected fake `loadDebugClientOptions` /
  `loadDebugMatches` and `mapsEnabled={false}` (maps render a placeholder). Any
  intentional UI change requires `pnpm test:update` and a visual sanity check of
  the regenerated PNGs.
- **Data flow**: `src/lib/matching/debug.ts` defines server fns
  `loadDebugClientOptions` and `loadDebugMatches({ clientId, side })` →
  `DebugMatchesPayload { side, clientProfile, totalAgents, qualifiedCount, scoreDistribution, tieBandThreshold, qualified: DebugMatch[], disqualified: DebugMatch[] }`.
  Each `DebugMatch` carries
  `fitScore, disqualified, displayRank, preShuffleRank, bandIndex, bandSize, bandOffset, trace: ScoreTrace, agentProfile`.
- **Scoring is pure**: `calculateFitScore(agent, profile, side)` in
  `src/lib/matching/scoring/algorithm.ts`. `ScoreTrace` (see `scoring/types.ts`)
  has `disqualifiers[]` (4 hard gates), `dimensions[]` (6: location, priceFit,
  specialization, workingStyle, communication, businessTerms), `computedScore`,
  `fitScore`, `stage2`, `geo`.
- **Client profile shape** (`src/lib/profile/db.ts`): buyer/seller profiles are
  composed of column groups — `clientMatchingColumns` (state, city, zipCodes,
  timeline, priceRange, propertyTypes, city-center lat/lng),
  `clientWorkStyleColumns` (5 enum questions), `buyerQuizColumns` /
  `sellerQuizColumns` (4 / 6 enum questions), `clientMatchTuningColumns`
  (matchPriorities, matchDetails). Enum options (db slugs + display labels) come
  from question definitions in `src/lib/profile/profile-fields.ts`, and
  `profileFieldsByFacet` already maps facet → field-name lists. **Generate the
  sandbox form from these definitions — never hand-maintain a field list.**
- **Price bucket bug**: agent signup serializes `typicalPriceRange` as raw
  `"min-max"` (e.g. `"400000-600000"`) while `scorePriceFit` expects an
  `AGENT_PRICE_RANGES` bucket slug, so affected agents always fail the price
  gate. `src/lib/price-range.ts` exports `AGENT_PRICE_RANGES`, `BUCKET_ORDER`,
  `parseSerializedPriceRange`. `scripts/compare-scoring.ts` contains
  `normalizeAgentBucket` — best-overlap mapping from a raw range to a bucket
  slug — to reuse for the migration. Client `priceRange` stays raw min-max; only
  the AGENT field uses bucket slugs. Verify against `scorePriceFit` before
  changing anything.
- **Migrations are hand-written** (`src/db/migrations/`, next number `0008_`).
  Do NOT run `drizzle-kit generate` — the meta snapshots have been stale
  since 0003. Write plain SQL.
- **Component inventory** to be reduced (all under
  `src/routes/debug/-components/`): debug-matches-page, inspector, ranking-rail,
  ranking-row, ranking-toolbar, ranking-model, use-ranking-keyboard, top-bar,
  client-picker, query-states, tie-band-group, fit-score-badge, dimension-table,
  dimension-row, subcheck-table, meter-bar, gates-section, fallback-card,
  score-internals, pipeline-strip, blend-equation, raw-json-section,
  copy-json-button, compare-view, compare-dimension-table, delta-value,
  section-label, score-tone, cohort-overview, score-histogram, weights-panel,
  gate-kill-counts, dimension-cohort-stats, cohort-geo-map, match-geo-map,
  map-support.
- Route wrapper `src/routes/debug/matches.tsx` (60 lines) owns URL search params
  (clientId, side, agent, compare) and injects the server fns.

## Guardrails (apply to every commit)

- Before each commit: `pnpm check` and `pnpm test` must pass; run
  `pnpm test:update` when a UI change is intentional and eyeball the new PNGs.
- Commit message style follows history: `refactor: …`, `feature: …`, `fix: …`.
- No non-null assertions (`!`) — destructure and guard instead.
- Never write client-profile overrides to the database. Overrides are
  request-scoped; scenarios (phase 4) live in localStorage.
- Do not modify scoring behavior (`src/lib/matching/scoring/*`) or the
  production match flow (`match.view.ts`, `server.ts`) in any UI commit. Only
  `debug.ts` grows a new input; production callers are untouched.
- The panel must make hypothetical state unmistakable: whenever overrides are
  active, the top bar shows a persistent amber `what-if` chip and every modified
  field group shows an amber dot.
- If reality contradicts this plan (a file is missing, a type differs, a test
  fails for an unrelated reason), STOP and ask — do not improvise around it.

---

## Phase 0 — Consolidate primitives (pure reduction, no new features)

Goal: execute the redundancy hit list on the existing layout. Same panel, ~⅓
less UI surface. Every commit here deletes more than it adds.

### Commit 1 — `refactor: single rank chip, unified sort control`

Read first: `inspector.tsx` (PairHeader), `ranking-row.tsx`,
`ranking-toolbar.tsx`, `ranking-model.ts`, `top-bar.tsx`.

- New `rank-chip.tsx`: renders `#<displayRank>`; a popover (shadcn) explains the
  rest — pre-shuffle sorted rank, tie band index/size/rotation offset. Use it in
  both PairHeader and the rail rows. Delete the separate `display #N` /
  `sorted #N` / `band …` badge cluster in PairHeader (keep the `fallback` mode
  badge — it is not rank information).
- Merge the standalone "Display rank" control into the sort options: `rank`
  stays the default `SortKey`, labeled "Display order". One sort popover, no
  second toggle.
- Acceptance: rank appears exactly once per row/header; tie-band info only in
  the popover; `pnpm test:update`.

### Commit 2 — `refactor: one verdict banner for gates`

Read first: `inspector.tsx:100-120`, `gates-section.tsx`, `fallback-card.tsx`.

- Replace the two conditional `GatesSection` renders and the disqualified banner
  with a single `verdict-banner.tsx` always rendered at the top of the
  inspector: disqualified → loud destructive banner listing failed gates inline
  with detail + would-be score; qualified → one quiet line ("Passed 4 hard
  gates"), expandable to per-gate detail. Keep the click-gate-to-filter behavior
  (`onFilterByGate`).
- Delete `gates-section.tsx`.
- Acceptance: gates rendered in exactly one place for both states.

### Commit 3 — `refactor: merge score internals into one score story`

Read first: `score-internals.tsx`, `pipeline-strip.tsx`, `blend-equation.tsx`,
`dimension-table.tsx` (stacked total bar), `fit-score-badge.tsx`.

- New `score-story.tsx`, collapsed by default, titled with the actual numbers
  (e.g. "How 65.28 pts became 88%"): one linear narrative — weighted dimension
  total → stage-2 blend (linear/geometric/consumer/agentFit/reciprocal) → gate
  multiplier → final fitScore. Reuse `trace.stage2`, `trace.formula`.
- Delete `score-internals.tsx`, `pipeline-strip.tsx`, `blend-equation.tsx`, and
  the stacked total bar row in `dimension-table.tsx` (the table keeps a
  plain-text total line).
- Acceptance: `computedScore` visible in exactly two places — the fit-score
  badge and the collapsed story.

### Commit 4 — `refactor: single raw-data drawer, one copy path`

Read first: `raw-json-section.tsx`, `copy-json-button.tsx`, `top-bar.tsx`
(payload button), `inspector.tsx` (PairHeader Copy button).

- Replace the inline raw-JSON accordion with a right-side sheet/drawer opened
  from one "Raw" button in the inspector header. Tabs: score trace / agent
  profile / client profile / full payload. One copy button per tab (reuse
  `copy-json-button.tsx`).
- Delete the top-bar `payload` copy button and PairHeader `Copy` button.
- Acceptance: exactly one entry point to raw data; `raw-json-section.tsx`
  deleted.

### Commit 5 — `refactor: slim dimension rows`

Read first: `dimension-row.tsx`, `dimension-table.tsx`, `subcheck-table.tsx`,
`meter-bar.tsx`.

- Collapsed row = label, meter bar, points. Everything else (weight chip, boost
  arrow, `weight × score` math, points-lost framing) moves into the row's
  expanded content above the existing subcheck table.
- Acceptance: one encoding per fact in the collapsed state; expanded state loses
  nothing.

### Commit 6 — `refactor: auto-clear stale selections`

Read first: `debug-matches-page.tsx`, `inspector.tsx` (StaleNotice).

- When matches data changes and `selectedAgentId` / `compareAgentId` are not in
  the new result set, clear them (effect in `debug-matches-page.tsx`). Delete
  `StaleNotice` and both amber notice paths.

---

## Phase 1 — Price-bucket bug fix (blocks trustworthy price experiments)

### Commit 7 — `fix: agent signup stores price bucket slug`

Read first: `src/lib/price-range.ts`, the agent signup step that writes
`typicalPriceRange` (grep `typicalPriceRange` under `src/routes/signup/`), and
`scorePriceFit` in `src/lib/matching/scoring/algorithm.ts` to confirm the
expected format is an `AGENT_PRICE_RANGES` slug.

- Change the signup serialization so the stored value is a bucket slug from
  `BUCKET_ORDER`, not `"min-max"`. Add/extend a unit test asserting the
  submitted profile's `typicalPriceRange` is a valid `AGENT_PRICE_RANGES` key.

### Commit 8 — `fix: migrate raw agent price ranges to bucket slugs`

Read first: `src/db/migrations/` (naming), `normalizeAgentBucket` in
`scripts/compare-scoring.ts` (the best-overlap rule to replicate).

- Hand-written `0008_normalize_agent_price_buckets.sql`: for rows where
  `typical_price_range` is not a known slug, parse `min`/`max` with
  `split_part(...,'-',n)::bigint` and map to the bucket with the largest
  overlap. Enumerate the bucket boundaries literally in the SQL (copy them from
  `AGENT_PRICE_RANGES`); a CASE over the buckets in `BUCKET_ORDER` is fine.
  Leave unparseable values untouched.
- Delete `normalizeAgentBucket` and its call sites from
  `scripts/compare-scoring.ts` (the workaround is now dead; remove the KNOWN
  DATA BUG comment).
- Acceptance: after `pnpm db:init`-style local setup + migration, the debug
  panel shows previously price-gated agents scoring normally.

---

## Phase 2 — What-if engine

### Commit 9 — `feature: loadDebugMatches accepts ephemeral client overrides`

Read first: `src/lib/matching/debug.ts`, `src/lib/profile/db.ts`,
`src/lib/matching/debug.test.ts`.

- Add `overrides?: Partial<client fields>` to the `loadDebugMatches` input.
  Build the zod schema from the same enum slugs the DB columns use (source the
  option lists from `profile-fields.ts` definitions — do not hand-copy slug
  strings). Editable fields: everything in `clientMatchingColumns` except the
  derived `cityCenterLatitude/Longitude`, plus `clientWorkStyleColumns`, the
  side's quiz columns, and `matchPriorities`.
- Merge validated overrides onto the loaded profile **before** scoring. Caution:
  if `city`/`state` are overridden, the stored `cityCenterLatitude/Longitude`
  are stale — look at how geo resolution gets the client center (see
  `LocationGeoTrace` usage) and re-resolve from the `cities` table when
  city/state are overridden; null them out if no match.
- Nothing persisted; production callers unchanged.
- Server-project unit tests: overrides change scores; invalid enum slug rejects;
  city override re-resolves the centroid.

### Commit 10 — `feature: client sandbox zone (schema-generated form)`

Read first: `profile-fields.ts` (SingleQuestion/MultiQuestion shape),
`profileFieldsByFacet` in `profile/db.ts`, `debug-matches-page.tsx` layout grid,
existing shadcn inputs in `src/components/ui/`.

- New `-components/sandbox/` directory: a form generated from the question
  definitions, grouped: Location (city, state, zipCodes), Price & timeline
  (priceRange, timeline, propertyTypes), Work style (5 questions), Quiz
  (side-specific), Priorities (matchPriorities multi-select). Single-question
  enums → select/radio; multi → checkbox group; free text where the column is
  plain text.
- Sandbox state = an `overrides` object holding only fields that differ from the
  saved profile. Wire into the matches query: key
  `['debug-matches', clientId, side, overrides]`, debounce override changes ~300
  ms, `placeholderData: keepPreviousData` so the rail never flashes.
- Layout: three-zone grid on `xl:` (sandbox ~300px | rail 380px | inspector);
  below `xl`, sandbox collapses behind a toggle button in the top bar.
- Dirty-state UX: amber dot on each modified group header; removable chip per
  active edit (e.g. `priceRange: 400–600k → 600–800k ✕`) in a strip above the
  rail; persistent amber `what-if` chip + "Reset all" in the top bar whenever
  overrides ≠ ∅.
- New screenshot tests: sandbox closed / open / with active edits.

---

## Phase 3 — Baseline diffing + attribution

### Commit 11 — `feature: payload diff engine + delta chips`

- New pure module `-components/diff-model.ts`:
  `diffPayloads(baseline: DebugMatchesPayload, current: DebugMatchesPayload)` →
  per agentId
  `{ rankBefore, rankAfter, fitBefore, fitAfter, gateFlip: 'killed' | 'revived' | null }` +
  summary counts. Unit tests (unit project, pure fixtures).
- Baseline behavior: selecting a client auto-pins the overrides-free payload as
  baseline; a "Pin baseline" button re-pins the current (overridden) state.
- Rail rows get a Δ chip (▲n / ▼n) and gate-flip badges (`killed · <gate>`,
  `revived · <gate>`). No chips when baseline === current.

### Commit 12 — `feature: two-column before/after diff mode`

- Toggle in the rail toolbar (enabled only when a diff exists): the rail becomes
  two columns — baseline order left, current order right — killed agents struck
  through with their gate named, revived agents highlighted. Selecting an agent
  in either column drives the inspector as usual.

### Commit 13 — `feature: per-attribute attribution`

- Button in the edit-chip strip ("Which edit did this?"), enabled when ≥2 edits
  are active: for each changed attribute, call `loadDebugMatches` with only that
  override (parallel `Promise.all`), diff each against baseline, and annotate
  each edit chip with its marginal effect (`3 moves · 1 kill`). For the selected
  agent, the inspector shows a per-edit Δ-fitScore list.
- This is k+1 requests for k edits — on demand only, never automatic.

---

## Phase 4 — Funnel + scenarios

### Commit 14 — `feature: funnel strip replaces cohort overview`

Read first: `cohort-overview.tsx`, `gate-kill-counts.tsx`, `weights-panel.tsx`,
`score-histogram.tsx`, `dimension-cohort-stats.tsx`, `cohort-geo-map.tsx`.

- New `funnel-strip.tsx` as the inspector's empty-selection state: stages
  `fetched → passed gates → scored → blended → tie bands` with counts. Clicking
  a stage expands its detail beneath the strip: gates stage absorbs
  gate-kill-counts (click a gate → rail `dqGate` filter, existing behavior);
  dimensions stage absorbs weights-panel + dimension-cohort-stats; blend stage
  absorbs score-histogram; a map tab hosts the cohort geo map.
- Delete `cohort-overview.tsx` and fold the absorbed components in (they stop
  being standalone cards; delete any that end up trivial).

### Commit 15 — `feature: named what-if scenarios (localStorage)`

- Save/load named override sets keyed by `clientId+side` (e.g.
  `pre-debug-scenarios-v1`). Dropdown + save button in the sandbox header.
  Loading a scenario sets the overrides object; deleting removes it. No server
  involvement.

---

## Definition of done

- Component count in `src/routes/debug/-components/` drops from ~38 to ~24 after
  phase 0; net LOC down while phases 2–4 add features.
- An engineer can: pick a client (⌘K) → edit any profile attribute → watch the
  ranking rescore live with Δ chips and gate flips vs baseline → flip to
  before/after mode → attribute changes to specific edits → inspect any agent's
  slimmed trace — without touching the database.
- `pnpm check` and `pnpm test` green on every commit; screenshot baselines
  updated deliberately, never blindly.
