# syntax=docker/dockerfile:1

FROM node:24.17.0-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# git: the pnpm "prepare" script (vp config --hooks-only) shells out to git
# ca-certificates: vite-plus/varlock HTTP client needs system CAs (BWS API)
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --frozen-lockfile

# Secrets are resolved from Bitwarden during the build and baked into
# .output as an AES-256-GCM blob (@encryptInjectedEnv). Secret mounts never
# persist in layers; only the encrypted blob ships in the image.
FROM deps AS build
COPY . .
# DATABASE_URL is Railway-managed and only exists at runtime; the build-time
# dummy satisfies schema validation. The baked blob must NOT shadow Railway's
# runtime value - this is verified by the deploy spike.
RUN --mount=type=secret,id=BITWARDEN_ACCESS_TOKEN,env=BITWARDEN_ACCESS_TOKEN \
	--mount=type=secret,id=_VARLOCK_ENV_KEY,env=_VARLOCK_ENV_KEY \
	APP_ENV=production \
	DATABASE_URL=postgresql://build:build@localhost:5432/build \
	pnpm build

FROM build AS runtime
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
