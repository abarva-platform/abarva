#!/usr/bin/env bash
# Vercel deploy entry point.
#
# Invoked by the buildCommand declared in vercel.ts. Decides — based on
# $VERCEL_ENV — whether to apply pending Supabase migrations before
# running `next build`. See docs/deployment/migrations.md for the full
# rationale.
#
# Behaviour:
#   - VERCEL_ENV=production  → run db:migrate --ci, then next build.
#                              A migration failure aborts the deploy
#                              (set -e ensures non-zero propagates).
#   - any other value        → log a skip line, then next build.
#
# This file lives at scripts/vercel-build.sh (not in src/) so it stays
# adjacent to other deploy/build helpers and is sourced as a plain shell
# script (no TypeScript transpile required at deploy time).

set -euo pipefail

case "${VERCEL_ENV:-unset}" in
  production)
    echo "[vercel-build] Production deploy detected — applying pending Supabase migrations"
    npm run db:migrate -- --ci
    ;;
  *)
    echo "[vercel-build] Skipping migrations (VERCEL_ENV=${VERCEL_ENV:-unset}, prod-only)"
    ;;
esac

echo "[vercel-build] Running next build"
npm run build
