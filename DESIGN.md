---
name: Peace of Real Estate
description: Fit-ranked, two-sided agent matching — calm navy trust system
colors:
  primary: '#024a70'
  primary-foreground: '#ffffff'
  primary-deep: '#013655'
  brand: '#024a70'
  brand-foreground: '#ffffff'
  signal-amber: '#ffb86a'
  signal-amber-foreground: '#45300e'
  background: '#ffffff'
  foreground: '#0f172a'
  card: '#ffffff'
  card-foreground: '#0f172a'
  wash: '#f8fafc'
  secondary: '#f1f5f9'
  secondary-foreground: '#0f172a'
  muted: '#f1f5f9'
  muted-foreground: '#475569'
  border: rgb(15 23 42 / 0.1)
  input: rgb(15 23 42 / 0.14)
  ring: '#024a70'
  destructive: oklch(0.55 0.2 27)
  destructive-foreground: '#ffffff'
  success: oklch(0.55 0.12 155)
  success-tint: oklch(0.94 0.04 155)
  sky: '#bae6fd'
  sky-tint: '#e0f2fe'
typography:
  display:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: clamp(2.75rem, 5vw, 3.5rem)
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: '-0.03em'
  headline:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: '-0.025em'
  title:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: '-0.025em'
  lead:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.75
  body:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  feature:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.625
  action:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 0.5rem
  md: 0.625rem
  lg: 0.75rem
  xl: 1rem
  2xl: 1.25rem
  pill: 9999px
spacing:
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
    padding: 0 12px
    height: 36px
  button-primary-hover:
    backgroundColor: '{colors.primary-deep}'
    textColor: '{colors.primary-foreground}'
  button-outline:
    backgroundColor: rgb(15 23 42 / 0.05)
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: 0 12px
    height: 36px
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: 0 12px
    height: 36px
  card:
    backgroundColor: '{colors.card}'
    textColor: '{colors.card-foreground}'
    rounded: '{rounded.xl}'
    padding: 24px
  input:
    backgroundColor: rgb(15 23 42 / 0.04)
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: 4px 12px
    height: 36px
  badge:
    backgroundColor: '{colors.sky-tint}'
    textColor: '{colors.primary}'
    rounded: '{rounded.pill}'
    padding: 2px 10px
---

# Design System: Peace of Real Estate

## Overview

**Creative North Star: "The Steady Hand"**

PRE's interface is the visual counterpart of the Peace Pact: calm, plain, and
trustworthy. One navy voice, one amber highlighter, sky-tint chips, generous
whitespace, and nothing that shouts. The system is light-only by doctrine — navy
acts through text and buttons, never as a room-filling fill (the landing's final
CTA band is the single sanctioned exception, where the voice inverts) — so the
product reads as open and honest rather than corporate.

Density is moderate and form-forward: this is an Operate product (quizzes,
dashboards, match lists), so scanability outranks expression. DM Sans carries
every role alone; depth is nearly flat with one soft ink shadow under cards.

> **Status:** this is the global system for every surface — landing, signup,
> auth, and dashboard alike. It was promoted 2026-08-07 from the landing's
> category-standard canon (official brand palette: navy #024A70 / sky tint
> #E0F2FE / slate neutrals on white + slate-50 wash), replacing the old global
> navy ramp. The landing's display type sizes (2.75–3.5rem display, 2.5rem
> section headings, 0.9375rem feature body) are now documented steps of this
> system, but they belong to Persuade surfaces: dashboards and forms keep the
> Operate ramp (headline 1.5–1.875rem, body 0.875rem) at full token fidelity.

**Key Characteristics:**

- Single navy action voice (#024A70, hover #013655); Signal Amber marks
  information, never actions
- Sky-tint pills (#E0F2FE, navy label) are the chip language product-wide
- Light-only surfaces; navy never a large fill outside the landing's final band
- One typeface (DM Sans Variable) for headings and body
- Nearly flat: one soft ink shadow under cards, hairlines and tone elsewhere
- 10px controls, 16–20px cards, pills reserved for chips and avatars
- Nothing smaller than 13px

## Colors

The official brand palette: a single brand navy on white and slate grounds, sky
tint for chips, one warm amber reserved as a highlighter.

### Primary

- **Brand Navy** (#024A70): the single action voice — primary buttons, focus
  rings, links, numerals, emphasis.
- **Deep Navy** (#013655): the one hover state for navy fills. Nothing else uses
  it.

### Tertiary

- **Signal Amber** (#FFB86A): match tiers, informational badges, emphasized
  words — the highlighter that marks what matters. Never a CTA, never a hover
  state. Amber text on amber tints renders in Dark Amber Brown (#45300E).
- **Sky Tint** (#E0F2FE, with #BAE6FD as the deeper step): chip and pill fills,
  selected-state washes, illustration tint source. Never large section fills,
  never body text.

### Neutral

- **White** (#FFFFFF): app background and card surface.
- **Slate Wash** (#F8FAFC): alternating section grounds, sidebar ground.
- **Slate Mist** (#F1F5F9): muted fills, hover washes, selected tracks.
- **Ink** (#0F172A, slate-900): headings and body text.
- **Slate Soft** (#475569, slate-600): muted/secondary text.
- **Hairline** (rgb(15 23 42 / 0.1)): all borders and dividers — ink at 10%,
  never a solid grey.

### Named Rules

**The One Navy Voice Rule.** Brand navy is the only action color on any screen —
buttons, links, numerals, check icons. Signal Amber never appears on buttons,
links, or hover states; its rarity is what makes a highlighted match tier mean
something. On the landing's navy final band the voice inverts (white fill, navy
text) rather than introducing a new color.

**The Light Room Rule.** The UI is light-only. Navy and amber act through text,
small fills, and focus rings; no dark surfaces, no large brand fills (the final
CTA band excepted).

## Typography

**Display Font:** DM Sans Variable (with ui-sans-serif, system-ui fallback)
**Body Font:** DM Sans Variable (same family) **Mono Font:** JetBrains Mono
Variable (code and inline code only)

**Character:** one family does everything — headings earn their rank through
weight (600–700) and tight tracking (-0.025em and tighter), not through a second
typeface. The effect is plain-spoken and modern, a form you'd trust.

### Hierarchy

Two registers share one family. Persuade surfaces (the landing) run the large
register; Operate surfaces (signup, auth, dashboard) run the compact one.

- **Display** (700, clamp(2.75rem, 5vw, 3.5rem), line-height 1.02, tracking
  -0.03em): hero statements, Persuade surfaces only.
- **Headline** (700, 2.25–2.5rem, tracking -0.025em): Persuade section headings.
  Operate page headings run 600–700 at 1.5–1.875rem instead.
- **Title** (600, 1.125–1.25rem, 1.15): card titles, subsections (card titles
  may drop to 500 at 1rem).
- **Lead** (400, 1.125rem, 1.75): hero sublines and band copy on Persuade
  surfaces.
- **Body** (400, 0.875rem, 1.5): UI text, form copy, lists.
- **Feature** (400/700 mixed, 0.9375rem, relaxed): Persuade feature lists, where
  the lead phrase is bolded and em-dashed to its gloss.
- **Action** (600, 1rem): marketing CTA labels (in-app buttons run 500 at
  0.875rem).
- **Label** (500, 0.8125rem, 1.4): badges, chips, microcopy, trust rows — the
  absolute floor.

### Named Rules

**The 13px Floor Rule.** No text anywhere renders below 13px (0.8125rem). Trust
rows, legal lines, and badges included — if it matters enough to show, it
matters enough to read.

**The One Family Rule.** DM Sans carries headings, body, and labels alone.
JetBrains Mono appears only for literal code. No serif, no display face.

## Layout

Centered single-column containers (max-w-6xl to max-w-7xl) with 24–40px
horizontal padding; marketing sections split into two columns at the `md`
breakpoint. Vertical rhythm runs on 64–80px section padding, 24–48px block gaps.
Forms and dashboards keep dense 12–16px internal spacing. Cards and grids
collapse to one column on mobile; the header compresses but never hides its
primary action.

## Elevation & Depth

Nearly flat by default. Depth comes from tonal layering (white cards on white or
slate-wash grounds) and hairline borders, with exactly one soft shadow carrying
elevated surfaces. All shadows are cast from slate ink (rgb(15 23 42)), never
neutral grey or black, so elevation feels like it belongs to the same room.

### Shadow Vocabulary

- **Card**
  (`0 30px 70px -28px rgb(15 23 42 / 0.28), 0 10px 28px -14px rgb(15 23 42 / 0.14)`):
  the one shadow — cards, dialogs, floating sheets, sticky action bars.
- **Raised** (`0 10px 36px -14px rgb(15 23 42 / 0.18)`): popovers, dropdowns.
- **Overlay** (`0 18px 52px -20px rgb(15 23 42 / 0.22)` and above): sheets and
  modal layers.
- **Resting wash** (`0 1px 3px rgb(15 23 42 / 0.06)` and below): the faintest
  separation cue for selected controls; nearly invisible by design.

### Named Rules

**The One Shadow Rule.** Exactly one real shadow exists — the card shadow — and
nearly everything else is separated by tone or hairline. New surfaces do not
invent elevation; they alternate ground tone (white ↔ slate wash) instead.

## Shapes

Soft, rounded-leaning geometry. The base radius is 10px, stepping 8px (small
chips, checkboxes) → 10px (buttons, inputs, controls) → 12px (interior boxes) →
16px (cards, dialogs, media frames) → 20px maximum (the one floating hero card).
Fully-rounded pills (9999px) are sanctioned for chips, badges, and avatars.
Borders are 1px hairlines in ink at 10%.

### Named Rules

**The Pill Belongs to Chips Rule.** Fully-rounded shapes are reserved for chips,
badges, avatars, and progress tracks. Controls stay at 10px, cards at 16–20px —
a pill never appears on a button.

## Components

### Buttons

Tactile and confident: a single navy fill, a physical 1px press on click, no
decoration.

- **Shape:** gently rounded (10px), 36px default height (24/32/40px for
  xs/sm/lg); marketing CTAs on the landing run 52px with 28px padding
- **Primary:** Brand Navy fill, white label, 500–600-weight 14px text
- **Hover / Focus:** fill darkens to Deep Navy on hover; focus shows a 3px navy
  ring at 50% opacity; active presses down 1px
- **Outline / Ghost:** hairline-bordered or borderless quiet actions using Slate
  Mist hover fills — never a second accent color
- **Destructive:** 10% red-orange tint fill with red-orange text, not a solid
  red button

### Chips / Badges

- **Style:** fully-rounded pill, Sky Tint fill, navy 500–600-weight 13px label,
  2–4px × 10–12px padding — the default informational chip
- **Variants:** navy fill (emphasis), Slate Mist fill (muted), hairline outline,
  or amber tint when the badge carries a match tier or signature trait
- **Selected states** on quiz and filter controls use the same language: navy
  hairline plus Sky Tint wash

### Cards / Containers

- **Corner Style:** generously rounded (16px; 20px for the landing's floating
  match card)
- **Background:** pure white over the white or Slate Wash ground
- **Border:** 1px Hairline
- **Shadow Strategy:** the one card shadow (see The One Shadow Rule)
- **Internal Padding:** 24px (16px in compact size)

### Inputs / Fields

- **Style:** 10px radius, 1px hairline border at 14% ink, 4% ink wash fill, 36px
  height
- **Focus:** navy border + 3px navy ring at 50% opacity
- **Error / Disabled:** destructive-tinted border and ring on error; 50% opacity
  when disabled

### Navigation

- Text wordmark with logomark, 14px links in Slate Soft darkening to Ink on
  hover; primary CTA is a standard navy button. The header never hides its
  primary action on mobile. Dashboard sidebars sit on the Slate Wash ground with
  Slate Mist hover/active washes.

## Do's and Don'ts

### Do:

- **Do** reserve Signal Amber for information — match tiers, badges, emphasized
  words — so its appearance always means "pay attention here."
- **Do** render chips and badges as Sky Tint pills with navy labels.
- **Do** let navy act through text, buttons, and focus rings on light surfaces.
- **Do** cast every shadow from slate ink (rgb(15 23 42)), never grey.
- **Do** keep corners within the 8–20px radius scale: 10px controls, 16–20px
  cards.
- **Do** hold the 13px type floor, even for legal and trust microcopy.

### Don't:

- **Don't** introduce dark mode or dark surfaces — the UI is light-only by
  doctrine.
- **Don't** put amber on a CTA, link, or hover state.
- **Don't** use Sky tints for body text or large section fills; they belong to
  chips, selected washes, and illustration.
- **Don't** put pill radii on buttons or cards; pills belong to chips, badges,
  and avatars.
- **Don't** add a second typeface for headings; weight and tracking do that
  work.
- **Don't** run the Persuade type register (display 2.75rem+, 2.5rem headlines)
  inside dashboards or forms; Operate surfaces keep the compact ramp.
