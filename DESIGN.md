---
name: Peace of Real Estate
description: Fit-ranked, two-sided agent matching — calm navy trust system
colors:
  primary: oklch(0.3 0.07 235)
  primary-foreground: oklch(0.98 0.005 240)
  brand: oklch(0.38 0.08 235)
  brand-foreground: oklch(0.98 0.005 240)
  signal-amber: oklch(0.72 0.13 75)
  signal-amber-foreground: oklch(0.25 0.06 70)
  background: oklch(0.985 0.003 240)
  foreground: oklch(0.21 0.04 240)
  card: oklch(1 0 0)
  card-foreground: oklch(0.21 0.04 240)
  secondary: oklch(0.945 0.01 240)
  secondary-foreground: oklch(0.3 0.05 238)
  muted: oklch(0.955 0.008 240)
  muted-foreground: oklch(0.5 0.025 240)
  border: oklch(0.88 0.012 240)
  input: oklch(0.9 0.01 240)
  ring: oklch(0.3 0.07 235)
  destructive: oklch(0.55 0.2 27)
  destructive-foreground: oklch(1 0 0)
  success: oklch(0.55 0.12 155)
  success-tint: oklch(0.94 0.04 155)
  sky: oklch(0.82 0.08 230)
  sky-tint: oklch(0.95 0.02 230)
typography:
  display:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: clamp(2.25rem, 5vw, 3.25rem)
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: '-0.025em'
  headline:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: '-0.025em'
  title:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: '-0.025em'
  body:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
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
    backgroundColor: oklch(0.3 0.07 235 / 0.8)
    textColor: '{colors.primary-foreground}'
  button-outline:
    backgroundColor: oklch(0.9 0.01 240 / 0.3)
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
    rounded: '{rounded.lg}'
    padding: 24px
  input:
    backgroundColor: oklch(0.9 0.01 240 / 0.3)
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: 4px 12px
    height: 36px
  badge:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
    padding: 2px 6px
---

# Design System: Peace of Real Estate

## Overview

**Creative North Star: "The Steady Hand"**

PRE's interface is the visual counterpart of the Peace Pact: calm, plain, and
trustworthy. One navy voice, one amber highlighter, generous whitespace, and
nothing that shouts. The system is light-only by doctrine — navy acts through
text and buttons, never as a room-filling fill — so the product reads as open
and honest rather than corporate.

Density is moderate and form-forward: this is an Operate product (quizzes,
dashboards, match lists), so scanability outranks expression. DM Sans carries
every role alone; depth is nearly flat with a gentle lift under cards.

> **Status:** this documents the incumbent global system, and it remains the
> authority for signup, auth, and dashboard surfaces. The landing surface (`/`)
> now has its own canon — the category-standard world in the official brand
> palette (navy #024A70 / sky tint / slate neutrals on white), shipped
> 2026-08-07 and scoped under the `.pre-canon` block in `src/styles.css` —
> documented in the surface brief
> `.impeccable/surfaces/src-routes-index-tsx.md`. The landing's larger type
> sizes (2.75–3.5rem display, 2.5rem section headings, 0.9375rem feature body)
> and radii (10px buttons, 18–20px cards, fully-rounded pills) deliberately
> differ from the global ramp inside that scope; they are the landing world's
> own tokens, not drift from this system. If the landing world is later promoted
> to global, this file's token tables change then — not before.

**Key Characteristics:**

- Single navy action voice; Signal Amber marks information, never actions
- Light-only surfaces; navy never a large fill
- One typeface (DM Sans Variable) for headings and body
- Flat by default; soft navy-cast lift under cards only
- Compact radii capped at 12px — no pills, no bubbles
- Nothing smaller than 13px

## Colors

A cool navy family on a near-white ground, with one warm amber reserved as a
highlighter.

### Primary

- **Ink-Depth Navy** (oklch(0.3 0.07 235)): the single action voice — primary
  buttons, focus rings, links. Deep enough to read as printed ink.
- **Brand Navy** (oklch(0.38 0.08 235), derived from #024A70): headings on
  white, links, emphasis. Slightly lighter than the primary so text stays
  legible at heading sizes.

### Tertiary

- **Signal Amber** (oklch(0.72 0.13 75)): match tiers, badges, emphasized words
  — the highlighter that marks what matters. Never a CTA, never a hover state.
- **Sky Tint** (oklch(0.82 0.08 230) / tint oklch(0.95 0.02 230)): illustration
  and tint source only. Never text, never large fills.

### Neutral

- **Paper White** (oklch(0.985 0.003 240)): app background.
- **Ink** (oklch(0.21 0.04 240)): body text.
- **Slate Whisper** (oklch(0.5 0.025 240)): muted/secondary text.
- **Hairline Grey** (oklch(0.88 0.012 240)): borders and dividers.
- **Wash Grey** (oklch(0.955 0.008 240)): muted fills, hover washes.

### Named Rules

**The One Voice Rule.** Navy is the only action color on any screen. Signal
Amber never appears on buttons, links, or hover states — its rarity is what
makes a highlighted match score mean something.

**The Light Room Rule.** The UI is light-only. Navy and amber act through text,
small fills, and focus rings; no dark surfaces, no large brand fills.

## Typography

**Display Font:** DM Sans Variable (with ui-sans-serif, system-ui fallback)
**Body Font:** DM Sans Variable (same family) **Mono Font:** JetBrains Mono
Variable (code and inline code only)

**Character:** one family does everything — headings earn their rank through
weight (600–700) and tight tracking (-0.025em), not through a second typeface.
The effect is plain-spoken and modern, a form you'd trust.

### Hierarchy

- **Display** (700, clamp(2.25rem, 5vw, 3.25rem), line-height 1.05): hero and
  page-level statements.
- **Headline** (600, 1.875rem, 1.15): section headings.
- **Title** (600, 1.25rem, 1.15): card titles, subsections (card titles may drop
  to 500 at 1rem).
- **Body** (400, 0.875rem, 1.5): UI text, form copy, lists.
- **Label** (500, 0.8125rem, 1.4): badges, microcopy, trust rows — the absolute
  floor.

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

Flat by default. Depth comes from tonal layering (paper white background → white
cards) and hairline borders, with a single soft shadow under elevated surfaces.
All shadows are cast from deep navy (oklch hue 255), never neutral grey or
black, so elevation feels like it belongs to the same room.

### Shadow Vocabulary

- **Resting card**
  (`0 1px 3px 0 oklch(0.2 0.04 255 / 0.07), 0 1px 2px -1px oklch(0.2 0.04 255 / 0.06)`):
  default card separation.
- **Raised** (`0 10px 36px -14px oklch(0.2 0.04 255 / 0.18)`): dialogs,
  popovers, dropdowns.
- **Overlay** (`0 18px 52px -20px oklch(0.2 0.04 255 / 0.22)` and above): sheets
  and modal layers.

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest; shadow appears only to
separate a white card from the near-white ground or to float an interactive
layer (dialog, popover). Never decorate with elevation.

## Shapes

Compact, squared-leaning geometry. The base radius is 6px, stepping 4px (inputs,
small chips) → 6px (buttons, badges) → 8px (cards) → 12px maximum (large
panels). Avatars may be circular; everything else stays within the scale.
Borders are 1px hairlines in Hairline Grey.

### Named Rules

**The 12px Ceiling Rule.** Corner radius never exceeds 12px. Pill shapes and
chat-bubble radii do not exist in this theme — the `--radius-2xl` and larger
utilities are disabled at the theme level.

## Components

### Buttons

Tactile and confident: a single navy fill, a physical 1px press on click, no
decoration.

- **Shape:** gently rounded (6px), 36px default height (24/32/40px for xs/sm/lg)
- **Primary:** Ink-Depth Navy fill, near-white label, 500-weight 14px text
- **Hover / Focus:** fill softens to 80% opacity on hover; focus shows a 3px
  navy ring at 50% opacity; active presses down 1px
- **Outline / Ghost:** hairline-bordered or borderless quiet actions using Wash
  Grey hover fills — never a second accent color
- **Destructive:** 10% red-orange tint fill with red-orange text, not a solid
  red button

### Cards / Containers

- **Corner Style:** gently rounded (8px)
- **Background:** pure white over the Paper White ground
- **Border:** 1px Hairline Grey
- **Shadow Strategy:** resting-card shadow only (see The Flat-by-Default Rule)
- **Internal Padding:** 24px (16px in compact size)

### Inputs / Fields

- **Style:** 6px radius, 1px Input Grey border, 30%-tinted grey fill, 36px
  height
- **Focus:** navy border + 3px navy ring at 50% opacity
- **Error / Disabled:** destructive-tinted border and ring on error; 50% opacity
  when disabled

### Badges / Chips

- **Style:** 6px radius, 2×6px padding, 13px 500-weight label
- **Variants:** navy fill (default), Wash Grey fill (secondary/muted), or
  hairline outline — Signal Amber only when the badge carries a match score or
  tier

### Navigation

- Text wordmark, 14px links in Slate Whisper darkening to Ink on hover; primary
  CTA is a standard navy button. The header never hides its primary action on
  mobile.

## Do's and Don'ts

### Do:

- **Do** reserve Signal Amber for information — match tiers, badges, emphasized
  words — so its appearance always means "pay attention here."
- **Do** let navy act through text, buttons, and focus rings on light surfaces.
- **Do** cast every shadow from deep navy (oklch hue 255), never grey.
- **Do** keep corners within the 4–12px radius scale.
- **Do** hold the 13px type floor, even for legal and trust microcopy.

### Don't:

- **Don't** introduce dark mode or dark surfaces — the UI is light-only by
  doctrine.
- **Don't** put amber on a CTA, link, or hover state.
- **Don't** use Sky tints for text or large fills; they exist for illustration.
- **Don't** add pill or bubble radii; the theme disables them above 12px.
- **Don't** add a second typeface for headings; weight and tracking do that
  work.
