# Matching Algorithm v1 — Final Plan

Consumer-fit-first matching for Peace of Real Estate. This is the merged final
plan (structured scoring + theory grounding, plus distance-aware location,
geometric mismatch penalty, capacity guardrails, and the intro flow).

Goal: a first _real_ matching baseline that (a) uses the user-tested questions
we already collect, (b) forces agents to specialize so their answers carry
signal, (c) stays explainable, and (d) is architected so that learned weights
can replace hand-authored ones the moment we have outcome data — without a
rewrite.

The product promise stays fixed: **we optimize for the consumer's fit, not for
selling their information as a lead.** Ranking is consumer-centered; capacity is
an availability guardrail, never the ranking objective.

---

## 1. Where we are today

The current scorer (`src/lib/matching/scoring.ts`) is a weighted linear model
over **three** dimensions:

| Dimension       | Weight | Source data                                  |
| --------------- | ------ | -------------------------------------------- |
| Location        | 40     | zip overlap → city → state ladder            |
| Price fit       | 35     | overlap ratio of client range vs agent range |
| Client-type fit | 25     | derived expected types vs `bestClientTypes`  |

Plus: hard disqualifiers (representation side, state), client `matchPriorities`
boosts (×1.5, renormalized), and a first-class explainability trace.

**The single biggest gap:** the psychology and communication questions that came
out of user testing — buyer `decisionMakingNeed`, `biddingWarResponse`,
`idealAgentRelationship`, `experienceLevel`; seller `homeConnection`,
`agentSilencePreference`, `successfulSaleLooksLike`, `representationPreference`;
everyone's channel/response-time/commission answers — are **collected and stored
but never scored**. The agent side answers questions specifically designed to
pair with them (`difficultDealInstinct`, `clientDescription`,
`communicationFrequency`, `commissionApproach`, `unrepresentedBuyerApproach`)
and those are unused too. v1 is mostly "wire up what user testing already
validated."

---

## 2. Theory: why this shape

### 2.1 Compensatory scoring — what we have

**Weighted linear (SAW / MAUT).** `score = Σ wᵢ·sᵢ`. Two known flaws:

- _Compensatory_: a great score on one dimension fully offsets a terrible one.
  An agent 200 miles away with perfect style fit can beat a local agent.
- _Weight sensitivity_: rankings hinge on weights nobody has validated. Decision
  theory remedies: swing weighting, AHP, or **rank-order centroid (ROC)**
  weights, which need only a _ranking_ of dimensions: wᵢ =
  (1/k)·Σ\_{j=i..k}(1/j). ROC fits our `matchPriorities` feature — the client's
  stated priority order becomes principled weights instead of an arbitrary ×1.5
  boost.

### 2.2 Non-compensatory models

Human choice research (Tversky's **elimination-by-aspects**, two-stage
**consideration-set** models) shows people screen on must-haves, then compare
survivors on nice-to-haves. Tools:

- **Conjunctive screening** (hard gates) — for true dealbreakers only.
- **Multiplicative / geometric aggregation** `Π sᵢ^wᵢ` — any near-zero drags the
  product down; lopsided profiles are penalized vs the arithmetic mean. Good for
  _soft_ severe mismatches that shouldn't gate but shouldn't hide either.

The sound, standard shape is **screen-then-score**: conjunctive gates for
viability, compensatory scoring among survivors, with a geometric term so one
severe soft mismatch (e.g. communication 0.2 amid all-1.0s) can't hide in the
average.

### 2.3 Similarity models

- **Gower similarity** is the canonical mixed-data similarity. Our design is a
  Gower similarity where each attribute's similarity function is a hand-authored
  **affinity matrix** instead of exact-match — the right generalization for
  psychology questions where "trusted advisor" and "calm & steady" are _near_.
- **Response time** is one-sided ordinal: faster than expected never hurts →
  score asymmetrically, not as distance-to-ideal.

### 2.4 Two-sided matching theory (Gale–Shapley et al.)

**Stable matching / deferred acceptance** and the **assignment problem**
(Hungarian, optimal transport) solve _allocation_: batch-assigning everyone
given preference lists and capacities. Not v1's problem — our product is
on-demand consumer ranking in a thin market where a client may have 3–10
eligible agents; stability is vacuous and allocation can conflict with the
consumer-fit promise (routing a consumer away from their best agent for market
efficiency).

Keep the separation:

```txt
Pairwise compatibility scoring = how good is this match for the consumer?
Capacity/stable allocation     = which requested intros happen when supply is scarce?
```

Revisit stable matching only if: intros are batched, agents hit capacity, too
many consumers chase the same few agents. Then our scores become its preference
inputs.

### 2.5 Reciprocal recommender systems

The dating/jobs literature
([RECON](https://www.researchgate.net/publication/221140972_RECON_A_reciprocal_recommender_for_online_dating),
[survey](https://www.sciencedirect.com/science/article/abs/pii/S1566253520304267),
[re-formulation](https://arxiv.org/html/2408.09748v1)): model each direction
separately, aggregate with the **harmonic mean** — it collapses when either side
is near zero (one-sided attraction ≠ match). Also: naively ranking by score
funnels everyone to the same few providers, degrading the whole market
([congestion-aware ranking](https://arxiv.org/pdf/2106.01941)).

Our agent-side preference is exactly the specialization we force (bucket, client
types, side) — so reciprocal scoring is nearly free.

### 2.6 Learning-to-rank, bandits, ML

All require **outcome data** (~100 completed outcomes before models beat priors
—
[cold-start playbook](https://forkoff.xyz/blog/founder-growth/two-sided-marketplace-cold-start-2026)).
We have zero. So:

1. **v1 is a prior, not a model** — the affinity matrices encode the
   user-testing insight directly.
2. **v1's second job is generating training data.** A linear-in-features scorer
   is a logistic regression waiting for labels: log every match event and v2
   swaps hand weights for learned ones — same architecture, new numbers.

### 2.7 Mechanism design: why forced specialization is correct

- An agent question where every answer helps with every client is **cheap talk**
  — everyone picks everything and the answer carries zero bits.
- Forcing single-choice makes the declaration **costly** (picking "sellers"
  forfeits buyer leads) → a **credible signal**.
- Forced-choice also kills social-desirability bias (ipsative formats,
  best-worst scaling).

**The asymmetry matters:** this applies to the _agent_ side only. The consumer's
price slider stays continuous — a stated budget is a fact with aligned
incentives, not a specialization claim, and the graded price score only works
because one side stays continuous.

---

## 3. Architecture

```
                ┌─────────────────────────────────────────────┐
 all agents ──► │ Stage 0: HARD GATES (conjunctive)           │──► disqualified (traced)
                │  side (forced single), state,               │
                │  location signal, price-bucket contact      │
                └───────────────────┬─────────────────────────┘
                                    ▼
                ┌─────────────────────────────────────────────┐
                │ Stage 1: CONSUMER-SIDE SCORE                │
                │  6 dimensions, affinity matrices,           │
                │  ROC weights, weight modulators,            │
                │  0.7·linear + 0.3·geometric blend           │
                └───────────────────┬─────────────────────────┘
                                    ▼
                ┌─────────────────────────────────────────────┐
                │ Stage 2: RECIPROCAL BLEND                   │
                │  harmonicMean(consumerScore, agentFit)      │
                └───────────────────┬─────────────────────────┘
                                    ▼
                ┌─────────────────────────────────────────────┐
                │ Stage 3: PRESENTATION & INTRO FLOW          │
                │  ranked list, tie-band rotation,            │
                │  capacity guardrails, top-3 intros,         │
                │  full trace, outcome logging                │
                └─────────────────────────────────────────────┘
```

### 3.1 Stage 0 — hard gates

1. **Side** — agent `representationSide` must equal client side (`'both'`
   removed, §6.1).
2. **State** — as today.
3. **Location floor** — location score (§4.1) must be > 0.
4. **Price contact** — client range must touch the agent's bucket or an adjacent
   bucket.

Gates are for true dealbreakers only; softer mismatches are scoring's job. Each
gate is traced individually (keep the `DisqualifierTrace` shape).

### 3.2 Stage 1 — six scored dimensions

| #   | Dimension                   | Weight | Inputs                                                       |
| --- | --------------------------- | ------ | ------------------------------------------------------------ |
| D1  | Location                    | 22     | distance-aware ZIP scoring (§4.1)                            |
| D2  | Price fit                   | 16     | client range × agent bucket + adjacency (§4.2)               |
| D3  | Specialization              | 14     | derived expected client types × ranked `bestClientTypes`     |
| D4  | Working style & temperament | 28     | psych affinity matrices (§4.4) — **new**                     |
| D5  | Communication               | 13     | channel, delivery, frequency, response time (§4.3) — **new** |
| D6  | Business terms              | 7      | commission, representation model (§4.5) — **new**            |

Weights sum to 100. D1+D2 shrink from today's 75 because the gates now carry the
viability burden and distance-aware scoring makes D1 smarter — scoring's job is
differentiating _fit_ among viable agents, which is the product promise. All
weights are priors that logged outcomes will overwrite.

**Weight elicitation:** replace the ×1.5 boost with ROC-flavored reweighting of
the client's `matchPriorities` order, blended 50/50 with base weights,
renormalized. Deterministic and explainable ("you said price mattered most, so
it counts 25 instead of 16"). Fallback if too much for v1: keep the boost, note
it in the trace.

**Aggregation (linear + geometric blend):** with weights normalized to sum 1 and
floors preventing collapse from a single non-gated dimension:

```txt
linear    = Σ wᵢ·sᵢ
geometric = Π max(sᵢ, 0.05)^wᵢ
consumerScore = 0.70·linear + 0.30·geometric
```

The geometric term stops one severe soft mismatch (communication 0.2 amid
all-1.0s) from hiding in the average. True dealbreakers remain gates, not
geometric penalties.

### 3.3 Stage 2 — reciprocal blend

```txt
agentFit = mean(
  bucketCentrality,   # how central the client's range is in the agent's own bucket
  clientTypeFit,      # client's derived type is agent's primary pick (1.0) or secondary (0.6)
)
final = 100 × harmonicMean(consumerScore, 0.5 + 0.5·agentFit)
```

The `0.5 +` floor keeps agent-side influence gentle in v1 (dampens at most ~⅓,
never nukes) while agent preference is only coarsely observed. When an explicit
agent "ideal client" quiz or learned acceptance model arrives, it slots into
`agentFit` untouched.

_(Cut-line: if v1 must shrink, fold bucketCentrality/primary-secondary into
D2/D3 and drop this stage. It's the first cut and the first v2 restore.)_

### 3.4 Stage 3 — presentation, intros, capacity

- **Ranked list, consumer chooses**: consumer sees the ranked list with match
  explanations and requests introductions to **up to three** agents. The UX
  promise: "These are the best agents for you. You choose who you want to meet"
  — never "the marketplace assigned you somewhere."
- **Anti-congestion tie-breaking**: scores within ±3 points form a tie band;
  rotate order within a band deterministically per client (hash of clientId +
  agentId) so the same agent isn't always on top for everyone.
- **Capacity guardrails** (availability, not ranking):

  ```txt
  availableCapacity = weeklyIntroLimit − activeIntroCount
  > 0  → appears normally, can receive intro requests
  == 0 → browse-only / waitlisted / intro disabled
  ```

  Optional tiny ranking adjustment (open 1.00 / limited 0.97 / full → intro
  disabled). Capacity protects consumers from ignored intros; it must not
  reshape fit ranking.

- **Explainability**: every explanation comes from the same dimension traces
  used for scoring — extend `ScoreTrace`; each affinity lookup becomes a
  `SubCheck` row ("You: needs the numbers · Agent: strategic & data-driven →
  strong fit 1.0"). Strongest-fit reasons _and_ tradeoffs on the card.
- **Outcome logging (non-negotiable for v2)**: `match_events` table:
  `(client_id, agent_id, fit_score, dimension_scores jsonb, rank, event, created_at)`
  with events:

  ```txt
  match_shown | agent_card_opened | intro_requested | intro_sent |
  intro_waitlisted | intro_accepted | intro_declined |
  conversation_started | agent_selected | client_feedback_score |
  agent_feedback_score | closed_transaction
  ```

---

## 4. Scoring specifications

### 4.1 Location (D1): distance-aware ZIP scoring

Raw ZIP overlap is brittle — adjacent ZIPs are excellent matches that score zero
today. Use ZIP centroid lat/lng (zipcodes lib is already a dependency; `cities`
table has `centerLat`/`centerLng`). Never compare ZIP code numbers directly.

For each consumer ZIP, take the best (closest) agent-served ZIP, then average
across consumer ZIPs:

```txt
zipFit = avg over consumerZips of max over agentZips of distanceScore(cz, az)

distanceScore:  0 mi → 1.00 · ≤2 mi → 0.95 · ≤5 mi → 0.80
                ≤10 mi → 0.60 · ≤20 mi → 0.30 · >20 mi → 0.00

locationScore = max(zipFit, sameCity ? 0.65 : 0, sameState ? 0.20 : 0)
```

State mismatch remains a hard gate.

### 4.2 Price (D2): buckets + adjacency

Agent picks **exactly one** bucket (§6.2). Buckets are ordinal:
`under400k < 400kTo750k < 750kTo1_5M < 1_5MPlus`. The client's range stays
continuous — do not snap it to buckets.

```txt
score = overlapRatio(clientRange, bucket)
      + 0.40 × overlapRatio(clientRange, adjacentBuckets)
capped at 1.0
```

Adjacency credit is what makes single-bucket forcing tolerable for straddlers: a
$700–900k client still sees the $400–750k specialist at partial credit.
Specialization stays forced; scoring absorbs the edge cases.

`bucketCentrality` (for §3.3): fraction of the client's range inside the agent's
own bucket — a client square in your declared bucket is _your_ ideal client too.

### 4.3 Communication (D5)

Four sub-scores, averaged:

- **Quick channel**: exact 1.0; either↔anything 0.85; text↔phone 0.2.
- **Update delivery**: identity matrix, 0.4 off-diagonal (mismatch is friction,
  not failure).
- **Frequency**: buyer `involvementLevel` / seller `agentSilencePreference` ×
  agent `communicationFrequency`:

  | client ↓ · agent →       | scheduled | milestones | clientLed |
  | ------------------------ | --------- | ---------- | --------- |
  | veryInvolved / scheduled | 1.0       | 0.4        | 0.7       |
  | keyDetails / milestones  | 0.6       | 1.0        | 0.6       |
  | handsOff / clientLed     | 0.3       | 0.8        | 1.0       |

- **Response time** (asymmetric ordinal): agent ≤ expectation → 1.0; one step
  slower → 0.5; two+ steps → 0.15.

### 4.4 Working style & temperament (D4) — the user-testing payoff

Affinity matrix mechanics: each cross-question pair gets
`M[clientAnswer][agentAnswer] ∈ [0,1]`, authored with 1–2 entries per row at 1.0
(the designed pairing), a graded middle, mismatches ≤ 0.3. Rules:

- Every row contains at least one 1.0 (no unmatchable client answers).
- All matrices live in one file (`affinities.ts`) — the tunable heart.
- Every number is a prior to be replaced by data. Comment intent, not numbers.

**Buyers** (3 sub-scores):

`decisionMakingNeed × clientDescription`

| client ↓ · agent → | strategicDataDriven | calmSteady | warmRelational | efficientDecisive |
| ------------------ | ------------------- | ---------- | -------------- | ----------------- |
| numbersData        | 1.0                 | 0.4        | 0.2            | 0.7               |
| timeAndSpace       | 0.4                 | 1.0        | 0.7            | 0.2               |
| trustedPerspective | 0.5                 | 0.8        | 1.0            | 0.4               |
| gutFeeling         | 0.3                 | 0.8        | 1.0            | 0.5               |

`biddingWarResponse × difficultDealInstinct`

| client ↓ · agent → | factsFast | slowItDown | takeControl | deEscalateFirst |
| ------------------ | --------- | ---------- | ----------- | --------------- |
| factsOptions       | 1.0       | 0.3        | 0.6         | 0.4             |
| space              | 0.3       | 1.0        | 0.2         | 0.7             |
| reassurance        | 0.4       | 0.7        | 0.4         | 1.0             |
| calmPresence       | 0.4       | 0.8        | 0.5         | 1.0             |

`idealAgentRelationship × clientDescription`

| client ↓ · agent → | strategicDataDriven | calmSteady | warmRelational | efficientDecisive |
| ------------------ | ------------------- | ---------- | -------------- | ----------------- |
| trustedAdvisor     | 0.5                 | 0.9        | 1.0            | 0.4               |
| thinkingPartner    | 1.0                 | 0.7        | 0.8            | 0.4               |
| skilledExecutor    | 0.8                 | 0.4        | 0.3            | 1.0               |

`experienceLevel` flows into D3 via the `firstTime` client-type derivation and
_modulates_ weights: firstTime raises D4 a step (novices need fit); very
experienced raises D5/D2 (operators want logistics).

**Sellers** (3 sub-scores):

- `agentDeliveryExpectations` (≤2) × agent traits: `pricedRight` /
  `greatNegotiatedOutcome` → strategicDataDriven/efficientDecisive +
  takeControl/factsFast; `keptItCalm` → calmSteady + deEscalateFirst;
  `reachableResponsive` → scored via response time (bridges D5);
  `honestStraightforward` → neutral 0.6 (no agent-side observable — see §7).
- `homeConnection × clientDescription`: `partOfIdentity`/`complicated` →
  warmRelational 1.0 / calmSteady 0.9 / efficientDecisive 0.2; `asset` →
  strategicDataDriven 1.0 / efficientDecisive 0.9 / warmRelational 0.4;
  `goodMemories` → flat 0.7 row with warmRelational/calmSteady 0.9.
- `representationPreference × unrepresentedBuyerApproach`:

  | client ↓ · agent →          | referSeparateBrokerage | representSellerOnly | anotherAgentInBrokerage |
  | --------------------------- | ---------------------- | ------------------- | ----------------------- |
  | exclusiveRepresentationOnly | 1.0                    | 0.8                 | 0.15                    |
  | broadConnections            | 0.6                    | 0.8                 | 1.0                     |

**Weight modulators, not matches** — stakes answers shift weights instead of
scoring: `saleMotivation = financialPressure` or
`successfulSaleLooksLike ∈ {speedCertainty, mustCloseByDate}` → bump D5 and
efficientDecisive/takeControl affinities a notch; `maximumPrice` → bump
strategic/negotiation affinities. Modulation = one weight step, always traced.
Same mechanism as `matchPriorities`, driven by quiz answers.

### 4.5 Business terms (D6)

`commissionComfort × commissionApproach`

| client ↓ · agent → | proactiveFixed | proactiveOpen | reactiveFixed | reactiveOpen |
| ------------------ | -------------- | ------------- | ------------- | ------------ |
| negotiate          | 0.3            | 1.0           | 0.1           | 0.8          |
| openOptions        | 0.7            | 1.0           | 0.3           | 0.6          |
| payFairRate        | 1.0            | 0.8           | 0.7           | 0.6          |
| dontUnderstand     | 0.9            | 1.0           | 0.2           | 0.2          |

(`dontUnderstand` rewards _proactive_ agents — that client needs education; a
reactive agent is a bad experience waiting to happen.)

---

## 5. Semantic / free-form layer (Phase 3, post-MVP)

Embeddings capture nuance from free text but must not replace structured
matching. Bounded adjustment only:

```txt
semanticScore = similarity(clientNarrative, agentFitNarrative)
notFitPenalty = similarity(clientNarrative, agentNotFitForNarrative)
finalScore    = structuredScore × clamp(0.85 + 0.25·semanticScore − 0.10·notFitPenalty, 0.75, 1.10)
```

Prompts: consumer "Anything important your agent should know about how you want
to work?"; agent "Describe the clients you do your best work with" / "Who are
you not the right fit for?". Free text is easy to game with marketing copy —
keep the questionnaire as the backbone.

---

## 6. Forced-specialization changes to agent questions

The algorithm and question design are one system (§2.7):

1. **`representationSide`: drop `'both'`.** Exact-match gate. Hand-written
   migration updates the check constraint; seed data re-seeded. UI copy: "Which
   side do you _specialize_ in?" — specialization, not restriction.
2. **`typicalPriceRange`: exactly one bucket**, stored as the slug
   (`AGENT_PRICE_RANGES` already maps slugs to ranges). Adjacency credit absorbs
   straddlers.
3. **`bestClientTypes`: ranked pick of exactly 2** (primary 1.0 / secondary 0.6
   in D3), drop `other`. Ranked-2 gives ~2× the signal of unordered
   multi-select.
4. **`notFitFor`: structured negative-fit options** plus optional free text.
   Structured picks can score now (a matched notFitFor is a strong negative);
   free text waits for the semantic layer.
5. **Style questions stay single-select** — forced-choice is the
   psychometrically correct format. No "check all that apply" on the agent side.
6. **Response time accountability**: display the claim on the agent's match card
   ("Commits to responding within 10 minutes") — public commitment turns cheap
   talk into reputational stake. Later: measured in-app response times decay the
   score toward observed truth.
7. **(v1.5 candidates)** "least like me" on `clientDescription` (MaxDiff —
   doubles information per question); agent property-type specialization (capped
   at 2) if scoring needs it.

## 7. Critique of current questions (valued, but examined)

- **Strong**: buyer/seller psych questions pair almost one-to-one with agent
  work-style questions — user testing did its job; the algorithm just never
  honored the pairing.
- `honestStraightforward` (seller expectation) has no agent-side observable —
  neutral row now; candidate future agent question.
- `either`-heavy channel answers make that sub-score weakly discriminating —
  fine, it's a friction check.
- `commissionComfort = dontUnderstand` is segmentation more than preference —
  also route to educational content in the UI.
- `saleMotivation = other` is unscoreable — for human eyes, excluded from
  scoring.
- Future (only if user testing supports): agent capacity question ("active
  clients right now") — feeds capacity guardrails honestly and any future
  allocation layer.

## 8. Evolution roadmap

| Version            | Trigger                                           | Change                                                                                                                                                                       |
| ------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1** (this plan) | now                                               | Gates + 6 dims + matrices + linear/geometric blend + reciprocal blend + intro flow + capacity guardrails + logging                                                           |
| v1.5               | ~50 matches + qualitative feedback                | Tune matrices; match-quality thumbs feeding `match_events`; MaxDiff question                                                                                                 |
| v2                 | ~100+ outcome-labeled matches                     | Logistic regression / Bradley–Terry on `match_events` learns weights (same architecture — swap numbers, keep trace); measured response times replace claimed; semantic layer |
| v2.5               | congestion visible                                | Exposure-aware ranking beyond tie-band rotation                                                                                                                              |
| v3                 | capacity-constrained dense market, batched intros | Deferred-acceptance / assignment over weekly cohort, scores as preference inputs                                                                                             |

## 9. Implementation phases

### Phase 1: structured baseline (the algorithm)

1. `src/lib/matching/affinities.ts` — all matrices + modulator rules, typed
   exhaustively over option slugs (compile-time safety when options change).
2. `scoring.ts` — 6 dims; gates 3–4; distance-aware location; ROC weights;
   linear+geometric blend; reciprocal blend; extended trace.
3. Schema (hand-written migrations): `typicalPriceRange` → bucket slug;
   `representationSide` constraint without `'both'`; `bestClientTypes` →
   `[primary, secondary]`; structured `notFitFor`; `match_events` table.
4. Signup UI: single-select side + bucket; ranked-2 client types; structured
   notFitFor.
5. Tests: golden-case table tests per matrix (designed 1.0 pairings outrank
   designed mismatches); property test that no disqualified agent outranks a
   qualified one; seed-data ranking snapshot for regression.

### Phase 2: introduction UX

Larger ranked list; top-3 intro requests; explanation cards (strongest reasons +
tradeoffs from traces); capacity/availability guardrails.

### Phase 3: semantic nuance (§5)

### Phase 4: learning layer (§8 v2+)

---

## Open decisions

1. **Reciprocal blend in v1 or fold into D2/D3?** (Lean: include — ~20 lines,
   and it's the headline differentiator.)
2. **ROC weights vs keep the ×1.5 boost** for `matchPriorities`.
3. **Price gate strictness**: adjacent-bucket contact passes Stage 0, or
   direct-bucket only (adjacency score-only)?
4. **`bestClientTypes` ranked-2 vs single primary.**
5. **`'both'` removal grandfathering** for any real (non-seed) agents.
6. **Geometric blend ratio** (0.70/0.30) and floor (0.05) — priors, revisit at
   v1.5 tuning.

## Sources

- [RECON: A reciprocal recommender for online dating](https://www.researchgate.net/publication/221140972_RECON_A_reciprocal_recommender_for_online_dating)
  — harmonic-mean aggregation
- [Reciprocal Recommender Systems: state-of-art survey](https://www.sciencedirect.com/science/article/abs/pii/S1566253520304267)
- [Revisiting Reciprocal Recommender Systems](https://arxiv.org/html/2408.09748v1)
  — aggregation comparison
- [Optimizing Rankings for Recommendation in Matching Markets](https://arxiv.org/pdf/2106.01941)
  — congestion-aware ranking
- [Dynamic Matching Bandit for Two-Sided Online Markets](https://arxiv.org/pdf/2205.03699)
- [Two-sided marketplace cold-start playbook](https://forkoff.xyz/blog/founder-growth/two-sided-marketplace-cold-start-2026)
  — ~100 outcomes before ML
- [Optimal Matchmaking Strategy in Two-Sided Marketplaces (Mgmt Science)](https://pubsonline.informs.org/doi/10.1287/mnsc.2022.4444)
- [Stable matching chapter (Vazirani)](https://ics.uci.edu/~vazirani/Chapter1.pdf)
  — Gale–Shapley background
