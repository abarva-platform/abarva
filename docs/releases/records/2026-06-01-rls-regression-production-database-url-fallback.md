# 2026-06-01-rls-regression-production-database-url-fallback — RLS Production DSN Fallback

## Release ID

`2026-06-01-rls-regression-production-database-url-fallback`

## Status

`candidate`

## Plain-English Summary

The production RLS regression workflow now reads the same `DATABASE_URL` secret used by the existing production database CI workflows when the optional `PRODUCTION_DATABASE_URL` override is not configured.

## Layer Impact

- `internal-admin` lane: Updates only GitHub Actions secret resolution for the SQL-level RLS regression workflow. No product runtime, user interface, data model, or database migration changes are included.

## Client Applicability

- All clients: The scheduled production tenant-isolation SQL check protects every production client.
- Specific clients: None.
- Internal only: GitHub Actions operators and release owners.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/rls-regression.yml` now sets `PROD_DSN` from `${{ secrets.PRODUCTION_DATABASE_URL || secrets.DATABASE_URL }}`.
- Workflow comments now document `PRODUCTION_DATABASE_URL` as an optional override and `DATABASE_URL` as the production fallback.

## QA / Validation

- Failed proof run `26747022859` confirmed the workflow now targets `production` but the `PRODUCTION_DATABASE_URL` secret is empty.
- Pass: verified the workflow shell run blocks with `bash -n`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`. The next scheduled or manual production RLS regression will use `PRODUCTION_DATABASE_URL` if present, otherwise the canonical `DATABASE_URL` repository secret.

## Rollback Plan

Revert the PR to require `PRODUCTION_DATABASE_URL` explicitly for production RLS regression runs.

## Audit Evidence

- Proof run showing empty `PRODUCTION_DATABASE_URL`: `https://github.com/anandsundaram-hash/abarva/actions/runs/26747022859`
- PR: pending.
- CI run: pending.

## Known Gaps

If the canonical `DATABASE_URL` secret is also missing or cannot be reached from GitHub-hosted runners, the RLS regression will still fail fast before SQL execution.
