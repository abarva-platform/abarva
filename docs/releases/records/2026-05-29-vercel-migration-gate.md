# 2026-05-29-vercel-migration-gate — Vercel Migration Gate

## Release ID

`2026-05-29-vercel-migration-gate`

## Status

`deployed`

## Plain-English Summary

Production Vercel builds now run Postgres migrations only when the deploy commit changes `supabase/migrations`. Docs-only and control-plane-only deploys still build normally, but they no longer open database migration sessions during build.

## Layer Impact

Deployment lane: `scripts/vercel-build.sh` now checks the deploy commit before invoking `npm run db:migrate`.

Data layer: no schema or data changes. The change reduces unnecessary Supabase session-pool pressure during production deploys.

Control lane: release discipline is unchanged. Migration commits still run the guarded migration runner and fail the deploy on migration failure.

## Client Applicability

- All clients: production deployments are less likely to fail because unrelated commits no longer consume migration DB sessions.
- Specific clients: none.
- Internal only: build pipeline behavior.
- Public/demo only: none.
- Feature flag: `FORCE_DB_MIGRATE_ON_DEPLOY=1` forces the old migration attempt behavior for emergency/manual deploys.

## Changes Included

- `scripts/vercel-build.sh`

## QA / Validation

- PASS: `bash -n scripts/vercel-build.sh`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: production deploy from hotfix commit `a142ffd`.
- PASS: Vercel build logs show `No migration files changed in this deploy commit; skipping Postgres migrations`.
- PASS: main `Reasoning Layer Guard`.
- PASS: main `Post-deploy crawl`.
- PASS: `https://app.abarva.ai` returned HTTP 200.
- PASS: `https://www.abarva.ai` returned HTTP 200.

## Rollout Plan

Merge to `main`; Vercel production deploy should skip migrations for this non-migration commit and proceed to `next build`.

## Rollback Plan

Revert this PR to restore migration attempts on every production deploy. If rollback is needed because migrations must run on a non-migration commit, prefer setting `FORCE_DB_MIGRATE_ON_DEPLOY=1` for that deploy instead.

## Audit Evidence

- Vercel deployment failure on commit `8bf680f`: both Vercel projects attempted `db:migrate` concurrently and Supabase returned `EMAXCONNSESSION`.
- Vercel deployments on commit `a142ffd`: both projects skipped migration execution and completed successfully.

## Known Gaps

This does not serialize migration commits across the two Vercel projects. If a future commit changes `supabase/migrations`, both projects may still attempt migration unless deployment environment policy is further narrowed to one primary migration runner.
