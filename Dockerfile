# syntax=docker/dockerfile:1.7
#
# AbarVa container image · CLOUD3 Docker Runtime Packaging
# --------------------------------------------------------
# Multi-stage Dockerfile that proves AbarVa can be packaged for a non-Vercel
# runtime (Azure Container Apps, Cloud Run, ECS Fargate, Kubernetes, etc.).
# This image is build-only validation; it does NOT deploy, does NOT push,
# and does NOT bake any secret. Required runtime envs are documented below
# and must be supplied by the orchestrator (e.g. via --env-file, Key Vault
# / Secret Manager mount, or platform-managed env). No .env file is copied.
#
# Required runtime env vars (NOT baked, supplied at `docker run`):
#   - DATABASE_URL                     (Postgres connection string)
#   - DIRECT_URL                       (optional; migration / pooler bypass)
#   - Do not project NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#     or SUPABASE_SERVICE_ROLE_KEY into Azure production runtime. Azure Postgres
#     cutover uses DATABASE_URL from Key Vault instead.
#   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
#   - CLERK_SECRET_KEY                 (server-only)
#   - ANTHROPIC_API_KEY                (server-only; or routed via Model Gateway)
#   - OPENAI_API_KEY                   (server-only; optional)
#   - PINECONE_API_KEY                 (server-only; optional)
#   - PINECONE_INDEX                   (optional; default nexus-knowledge)
#   - NODE_ENV=production
#   - PORT=3000                        (Next.js listens here)
#   - HOSTNAME=0.0.0.0                 (bind all interfaces inside the container)
#
# Build:  docker build -t abarva:local .
# Run:    docker run --rm -p 3000:3000 --env-file .env.example abarva:local
#

# -----------------------------------------------------------------------------
# Stage 1 · deps: install production + build dependencies on a stable base.
# -----------------------------------------------------------------------------
ARG BASE_NODE_IMAGE=acrabarvalab001.azurecr.io/base/node:24-bookworm-slim

FROM ${BASE_NODE_IMAGE} AS deps
WORKDIR /app

# OS deps for native module builds (sharp, bcrypt, etc.). Kept minimal.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      python3 \
      build-essential \
 && rm -rf /var/lib/apt/lists/*

# Copy lockfile + manifest first to maximize layer caching.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --prefer-offline

# -----------------------------------------------------------------------------
# Stage 2 · build: copy source and produce the Next.js production build.
# Uses Next.js standalone output if next.config sets output: 'standalone';
# otherwise falls back to a full .next + node_modules copy in stage 3.
# -----------------------------------------------------------------------------
FROM ${BASE_NODE_IMAGE} AS build
WORKDIR /app

ARG NEXT_PUBLIC_POSTHOG_KEY=""
ARG NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=6144
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Package only approved tenant boundary snapshots for Container Apps Jobs.
# Do not copy full client workspaces into the runtime image.
RUN node -e "const fs=require('fs');const path=require('path');const out='runtime-tenant-boundaries';fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});if(fs.existsSync('clients')){for(const tenant of fs.readdirSync('clients')){const src=path.join('clients',tenant,'18-phase2b3c-azure-lab-implementation','00-implementation-charter','APPROVED_BOUNDARY_SNAPSHOT.json');if(fs.existsSync(src)){const dest=path.join(out,tenant,'APPROVED_BOUNDARY_SNAPSHOT.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);}}}"

# Build the Next.js app. No secrets are required for `next build` other than
# build-time NEXT_PUBLIC_* vars, which the orchestrator may inject via
# --build-arg if a downstream image needs them embedded. By default we do
# NOT embed any NEXT_PUBLIC_* value here — the runtime orchestrator passes
# them at startup.
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3 · runtime: minimal image, non-root user, only build artifacts.
# -----------------------------------------------------------------------------
FROM ${BASE_NODE_IMAGE} AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright

# Use the built-in `node` user (uid 1000) for least-privilege runtime.
# If a stricter uid:gid is required by the orchestrator, override via
# `--user 1001:1001` at `docker run` time.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates python3 postgresql-client \
 && rm -rf /var/lib/apt/lists/*

# Copy public assets and the standalone server bundle. If `output: 'standalone'`
# is enabled in next.config, .next/standalone contains a self-contained
# server.js plus a minimal node_modules tree. Otherwise we fall back to the
# full .next directory and the production node_modules.
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/next.config.ts ./next.config.ts

# Operational scripts used by Container Apps Jobs. The web runtime does not
# need these on the request path, but the Azure migration job reuses this image
# so schema/bootstrap scripts and SQL migrations must be present.
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=node:node /app/src/config ./src/config
COPY --from=build --chown=node:node /app/src/content ./src/content
COPY --from=build --chown=node:node /app/src/data ./src/data
COPY --from=build --chown=node:node /app/src/lib ./src/lib
COPY --from=build --chown=node:node /app/src/scripts ./src/scripts
COPY --from=build --chown=node:node /app/intelligence ./intelligence
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/cube ./cube
COPY --from=build --chown=node:node /app/docs/architecture/meridian-demo-findings-20260824.json ./docs/architecture/meridian-demo-findings-20260824.json
COPY --from=build --chown=node:node /app/docs/architecture/sql-drafts ./docs/architecture/sql-drafts
COPY --from=build --chown=node:node /app/docs/source/skyharbor-v4 ./docs/source/skyharbor-v4
COPY --from=build --chown=node:node /app/runtime-tenant-boundaries ./runtime-tenant-boundaries
COPY --from=build --chown=node:node /app/datasets ./datasets
COPY --from=build --chown=node:node /app/clients/airline-demo-new/execution ./clients/airline-demo-new/execution
COPY --from=build --chown=node:node /app/clients/airline-demo-new/19-template-instantiation-source-corpus ./clients/airline-demo-new/19-template-instantiation-source-corpus
COPY --from=build --chown=node:node /app/fixtures/foundation-v2/golden-slice ./fixtures/foundation-v2/golden-slice
COPY --from=build --chown=node:node /app/fixtures/foundation-v2/healthcare-golden-slice ./fixtures/foundation-v2/healthcare-golden-slice
COPY --from=build --chown=node:node /app/reports/active-tenant-access ./reports/active-tenant-access
COPY --from=build --chown=node:node /app/reports/candidate-invisibility-guard ./reports/candidate-invisibility-guard
COPY --from=build --chown=node:node /app/tower-standardized-v1 ./tower-standardized-v1
COPY --from=build --chown=node:node /app/supabase/migrations ./supabase/migrations

RUN npx playwright install-deps chromium \
 && mkdir -p /app/outputs /app/reports /app/job-output \
 && chown -R node:node /app/outputs /app/reports /app/job-output \
 && mkdir -p /home/node/.cache/ms-playwright \
 && chown -R node:node /home/node/.cache

USER node

RUN npx playwright install chromium

EXPOSE 3000

# Default to `npm run start`, which invokes `next start`. If the build
# emits .next/standalone/server.js (Next standalone output), the operator
# can override the entrypoint via `docker run abarva:local node .next/standalone/server.js`.
CMD ["npm", "run", "start"]
