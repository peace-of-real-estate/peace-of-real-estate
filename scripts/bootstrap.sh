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
			cp "$main_root/$file" "$file"
			echo "copied $file from $main_root"
		fi
	done
fi

vp i
vp run setup
vp run compose:up
vp run db:migrate
vp run db:init
