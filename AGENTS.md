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
