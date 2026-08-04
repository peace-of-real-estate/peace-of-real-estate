# peaceofrealestate.com

## Overview

Peace of Real Estate (PRE) is a bilateral matching platform built to connect
real estate clients with agents based on working style, communication
expectations, transparency, and overall fit.

Core idea:

- Clients get matched with agents who fit how they want to buy or sell.
- Agents get introduced to clients who align with how they work.
- Matching is based on responses from both sides, not a one-sided lead form.

## Tech

- Tanstack Start
- React, Tailwindcss, Shadcn
- Drizzle
- Vite+ (vite-plus/vp): vite, vitest, oxfmt, oxlint
- Railway hosting

## Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown,
Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management,
package management, and frontend tooling in a single global CLI called `vp`.
Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and
`vp build`. Run `vp help` to print a list of commands and `vp <command> --help`
for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at
<https://viteplus.dev/guide/>.

## React

This project uses the React Compiler (`reactCompilerPreset()` in
`vite.config.ts`). Memoization is automatic:

- Never write `useMemo` or `useCallback` — compute values inline; the compiler
  memoizes for you.
- Never write `useEffect` without explicit permission from the user, and only in
  extreme circumstances. Fetch data with TanStack Query, derive state during
  render, and respond to events in event handlers. If you think an effect is
  unavoidable, stop and ask first.

## Env vars & secrets

Varlock (`.env.schema`) is the source of truth for env var _definitions_;
Bitwarden Secrets Manager (BWS) is the source of truth for secret _values_.

- Secret values live only in BWS (projects: `pre-dev`, `pre-prod`; shared
  secrets in `pre-dev`). Committed files reference them via `bitwarden("uuid")`
  — UUIDs are not secrets and are safe to commit.
- Cross-env secrets → refs in `.env.schema`. Dev-only → `.env.development`.
  Prod-only → `.env.production`. `.env.test` uses dummies (CI never touches
  BWS); every schema-level `bitwarden()` ref must have a dummy override there.
- Local machine account token: set `BITWARDEN_ACCESS_TOKEN=varlock(prompt)` in
  `.env.local` (gitignored), then run `vp exec varlock load` once to encrypt it.
  This is the only secret that should remain in local env files.
- To add a new secret: create it in BWS, add the item to `.env.schema`, wire a
  `bitwarden("uuid")` ref in the right env file, add a dummy to `.env.test` if
  the ref is in the schema, then `vp exec varlock load` to validate.
- To rotate: update the value in BWS; redeploy/restart. The GitHub Actions
  `BETA_PASSWORD` secret (used by e2e against PR deploys) is manually synced —
  update it when the BWS value rotates.
- Never paste raw secret values into committed files. Validate with
  `vp exec varlock load` and `vp exec varlock scan --staged` before committing.

## Comments

Never write comments that restate what the code already says — if a comment
explains _what_ the code does, delete it and rename or restructure the code
instead. Comments must add information the code cannot express. Allowed:

- **Critical context** — why a non-obvious decision was made, constraints
  imposed by external systems, or links to reference material.
- **Section markers** — short labels (often one word) like `// Shared`, or the
  banner style `// ===== Section =====`, to annotate blocks of code.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts
      necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run
      `vp env doctor` and include its output when asking for help.
