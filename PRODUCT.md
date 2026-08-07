# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two-sided audience:

- **Clients** — home buyers and sellers, initially in the Baltimore metro, who
  want an agent whose working style, communication expectations, and
  transparency match how they want to transact.
- **Agents** — real estate agents who want introductions to clients who align
  with how they actually work, rather than buying leads.

## Product Purpose

Peace of Real Estate (PRE) is a bilateral matching platform connecting real
estate clients with agents based on working style, communication expectations,
transparency, and overall fit. Matching is computed from responses from both
sides — not a one-sided lead form, and never ranked by ad spend.

Success: a client meets an agent who fits how they want to buy or sell, and an
agent meets clients who fit how they work.

## Positioning

Fit-ranked, two-sided matching. Neighboring products (Zillow, Realtor, referral
networks) sell placement or route one-sided leads; PRE ranks matches only by
mutual fit and shows the client the rationale for each match before they commit.
Agents commit to the "Peace Pact" — transparency and putting the client's
interests first.

## Operating Context

- Initial beta geography: Baltimore metro. Copy should name Baltimore for social
  proof during beta.
- Client flow: free fit quiz (~2 min, no signup) → matched agents ranked by fit
  with visible rationale → paid introduction unlock (Stripe) → connect on their
  own terms. Backup matches exist if the first pick is unavailable.
- Agent flow: profile + working-style quiz → matched client introductions.
- Commission coaching (tips/scripts) helps clients ask the right questions
  upfront.

## Capabilities and Constraints

- TanStack Start + React, Tailwind + shadcn, Drizzle, Railway hosting.
- Stripe payments for introduction unlocks; PostHog analytics; Cloudflare.
- Fit-quiz profiles for both roles; matching algorithm ranks by fit, never
  payment.
- Screenshot/e2e tests cover non-landing surfaces: visual changes during the
  landing-first redesign must not leak into signup, auth, or dashboard styles.

## Brand Commitments

- Name: **Peace of Real Estate** (peaceofrealestate.com).
- Brand identity: navy palette anchored on #024A70 (oklch(0.38 0.08 235)) with
  the existing logomark/wordmark.
- Imagery style: the original flat editorial illustrations (deep navy, golden
  mustard, warm peach skin, soft cornflower blue, cream grounds) — not
  photography. One recurring cast: the woman client (long navy hair, mustard
  sweater, hoop earrings) carries steps 1–3; the male agent (navy blazer) first
  appears as her highlighted match and hands her the key in step 3.
- "Peace Pact" agent commitment is product terminology.
- **Standing visual preference (2026-08): the category standard, played
  straight.** When offered a roll-dealt direction versus the conventional
  category arrangement, the user chose convention as the commitment — executed
  at full fidelity, without irony. The craft bar for the landing page is
  Opendoor / Compass-register polished real-estate marketing.
- The new landing theme is scoped under the `.pre-canon` class in
  `src/styles.css` (landing-only); promotion to global tokens is a future step
  after the redesign is validated.

## Evidence on Hand

- New illustration set in `public/landing/` (hero-backdrop, avatar-1..3,
  step-1..3 webp, prompts embedded in sidecar .json files) — step illustrations
  match the original flat editorial style with the recurring client/agent cast.
- Features section reuses the original `/match.png` illustration; other legacy
  placeholders (hero.png, step1–3.png in `public/`) are no longer referenced by
  the landing.
- No testimonials, customer quotes, or press yet (pre-launch beta). Future work
  must not fabricate them; Baltimore beta naming is the approved social-proof
  device.

## Product Principles

1. Fit over fees — rankings are never influenced by payment.
2. Both sides answer — matching is bilateral; no one-sided lead forms.
3. Show the why — clients see fit rationale before committing.
4. Transparency is the brand — Peace Pact commitments, commission coaching,
   plain copy.
