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
#   - NEXT_PUBLIC_SUPABASE_URL         (public Supabase project URL)
#   - NEXT_PUBLIC_SUPABASE_ANON_KEY    (public anon key)
#   - SUPABASE_SERVICE_ROLE_KEY        (server-only; never inline)
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
FROM node:24-bookworm-slim AS deps
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
FROM node:24-bookworm-slim AS build
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js app. No secrets are required for `next build` other than
# build-time NEXT_PUBLIC_* vars, which the orchestrator may inject via
# --build-arg if a downstream image needs them embedded. By default we do
# NOT embed any NEXT_PUBLIC_* value here — the runtime orchestrator passes
# them at startup.
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3 · runtime: minimal image, non-root user, only build artifacts.
# -----------------------------------------------------------------------------
FROM node:24-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Use the built-in `node` user (uid 1000) for least-privilege runtime.
# If a stricter uid:gid is required by the orchestrator, override via
# `--user 1001:1001` at `docker run` time.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
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

USER node

EXPOSE 3000

# Default to `npm run start`, which invokes `next start`. If the build
# emits .next/standalone/server.js (Next standalone output), the operator
# can override the entrypoint via `docker run abarva:local node .next/standalone/server.js`.
CMD ["npm", "run", "start"]
