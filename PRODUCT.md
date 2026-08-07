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

- Initial beta geography: Baltimore metro. Copy names Baltimore for social proof
  during beta.
- Client flow: free fit quiz (~2 min, no signup) → matched agents ranked by fit
  with visible rationale → paid introduction unlock (Stripe) → connect on their
  own terms. The quiz is free; clients pay only if they choose an introduction.
  Backup matches exist if the first pick is unavailable.
- Agent flow: profile + working-style quiz → matched client introductions.
- Commission coaching (tips/scripts) helps clients ask the right questions
  upfront.

## Capabilities and Constraints

- TanStack Start + React, Tailwind + shadcn, Drizzle, Railway hosting.
- Stripe payments for introduction unlocks; PostHog analytics; Cloudflare.
- Fit-quiz profiles for both roles; matching algorithm ranks by fit, never
  payment.
- Fit expression: word tiers ("Best fit", "Strong fit", "Good fit")
  product-wide. Numeric match percentages are being removed from the product,
  not just the landing.
- Screenshot/e2e tests cover every surface. The landing canon was promoted to
  the global theme 2026-08-07; baselines for signup, auth, and dashboard were
  regenerated against it.

## Brand Commitments

- Name: **Peace of Real Estate** (peaceofrealestate.com).
- "Peace Pact" agent commitment is product terminology.
- Visual identity: the landing's category-standard canon (brand navy #024A70,
  sky tint, slate neutrals on white) is the global visual system as of
  2026-08-07, owned by DESIGN.md. The landing brief keeps only landing-specific
  strategy.
- Standing preference (2026-08-07): the landing plays the **category standard
  straight** — no experimental visual worlds — at the craft level of Compass and
  Opendoor. Future landing work treats convention as the commitment, at full
  fidelity, without irony or smuggled quirk.

## Evidence on Hand

- Generated illustration/photo assets in `public/landing/` with prompt sidecar
  `.json` files (hybrid register per the landing brief: photo backdrops, flat
  illustrated avatars).
- No testimonials, customer quotes, or press yet (pre-launch beta). Future work
  must not fabricate them; Baltimore beta naming is the approved social-proof
  device.

## Product Principles

1. Fit over fees — rankings are never influenced by payment.
2. Both sides answer — matching is bilateral; no one-sided lead forms.
3. Show the why — clients see fit rationale before committing.
4. Transparency is the brand — Peace Pact commitments, commission coaching,
   plain copy.
