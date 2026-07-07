#!/usr/bin/env bash
# LEGACY ONLY. Do not use this script for app.abarva.ai.
#
# app.abarva.ai deploys through Azure Container Apps. The active Vercel
# sentinel is scripts/vercel-disabled.sh, which fails accidental Vercel
# deploys loudly. This file is preserved only for historical reference.
#
# Historical Vercel deploy entry point.
#
# Invoked by the buildCommand declared in vercel.ts. Decides — based on
# $VERCEL_ENV — whether to apply pending Postgres migrations before
# running `next build`. See docs/deployment/migrations.md for the full
# rationale.
#
# Behaviour:
#   - VERCEL_ENV=production  → run db:migrate --ci only when the deploy
#                              commit changed supabase/migrations, then
#                              next build. The migration runner connects via
#                              ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL /
#                              DATABASE_URL and must use the Azure/Postgres
#                              direct migration path, not Supabase session mode.
#                              A migration failure aborts the deploy.
#   - any other value        → log a skip line, then next build.
#
# This file lives at scripts/vercel-build.sh (not in src/) so it stays
# adjacent to other deploy/build helpers and is sourced as a plain shell
# script (no TypeScript transpile required at deploy time).

set -euo pipefail

commit_changed_migrations() {
  if [ "${FORCE_DB_MIGRATE_ON_DEPLOY:-}" = "1" ]; then
    echo "[vercel-build] FORCE_DB_MIGRATE_ON_DEPLOY=1 — migration gate override enabled"
    return 0
  fi

  local head_sha
  head_sha="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

  local changed_files
  changed_files="$(git diff --name-only "${head_sha}^" "${head_sha}" -- supabase/migrations 2>/dev/null || true)"

  if [ -z "${changed_files}" ]; then
    echo "[vercel-build] No migration files changed in this deploy commit; skipping Postgres migrations"
    return 1
  fi

  echo "[vercel-build] Migration files changed:"
  echo "${changed_files}" | sed 's/^/[vercel-build]   - /'
  return 0
}

case "${VERCEL_ENV:-unset}" in
  production)
    echo "[vercel-build] Production deploy detected"
    if commit_changed_migrations; then
      echo "[vercel-build] Applying pending Postgres migrations"
      migrate_attempt=1
      migrate_max_attempts="${DB_MIGRATE_MAX_ATTEMPTS:-5}"
      until npm run db:migrate -- --ci; do
        if [ "${migrate_attempt}" -ge "${migrate_max_attempts}" ]; then
          echo "[vercel-build] Postgres migration failed after ${migrate_attempt} attempt(s)"
          exit 1
        fi
        sleep_seconds=$((migrate_attempt * 10))
        echo "[vercel-build] Postgres migration attempt ${migrate_attempt} failed; retrying in ${sleep_seconds}s"
        sleep "${sleep_seconds}"
        migrate_attempt=$((migrate_attempt + 1))
      done
    fi
    ;;
  *)
    echo "[vercel-build] Skipping migrations (VERCEL_ENV=${VERCEL_ENV:-unset}, prod-only)"
    ;;
esac

echo "[vercel-build] Running next build"
npm run build
