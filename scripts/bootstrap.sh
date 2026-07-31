#!/usr/bin/env bash
# Bootstrap a fresh jj workspace: env files, deps, docker, database.
set -euo pipefail

cd "$(dirname "$0")/.."

# .env.local and .env.development.local are gitignored, so new workspaces
# don't have them. Copy secrets from the default (main) workspace.
main_root="$(jj workspace root --name default 2>/dev/null || true)"
if [[ -n "$main_root" && "$main_root" != "$PWD" ]]; then
	for file in .env.local .env.development.local; do
		if [[ ! -f "$file" && -f "$main_root/$file" ]]; then
			# DATABASE_URL is per-workspace (generated into .env.compose by
			# scripts/setup.ts); copying it would point at the wrong port.
			sed '/^DATABASE_URL=/d' "$main_root/$file" >"$file"
			echo "copied $file from $main_root"
		fi
	done
fi

vp i
vp exec tsx scripts/setup.ts
vp run compose:up
vp run db:migrate
vp run db:init
