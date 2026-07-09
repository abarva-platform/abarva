# 2026-07-09-lakeshore-budget-migration-prod-guard — Lakeshore Budget Migration Production Guard

## Release ID

`2026-07-09-lakeshore-budget-migration-prod-guard`

## Status

`candidate`

## Plain-English Summary

Hardens an older Lakeshore CIO Tower budget migration so it can run safely in environments where the legacy `enterprise_context_records` table exists but no longer has the old column shape. The migration still loads the governed CIO Tower budget facts; it only skips the optional cleanup of stale legacy rows when the legacy columns are missing.

## Layer Impact

- Data plane: Adds a defensive compatibility guard around a legacy cleanup update in a pending migration.
- Client evidence/runtime facts: Preserves the Lakeshore CIO Tower budget fact seed and prevents schema drift in the old context table from blocking newer platform migrations.
- Operator/release lane: Unblocks applying the pending migration chain through the approved ACA private operator job.

## Client Applicability

- All clients: Indirectly, because pending migration replay must remain healthy before platform-wide migrations can apply.
- Specific clients: Lakeshore Industries / Lakeshore Holdings budget seed.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260705180000_lakeshore_cio_tower_budget_seed.sql`

## QA / Validation

- Pass: `git diff --check`
- Pass: `npm run release:check`
- Not run: Fresh Postgres migration replay in GitHub CI.
- Blocked: Local `npm run db:migrate:dry` cannot reach lab Postgres because the database is private-networked from the laptop.
- Not run: ACA private operator `db:migrate` run against lab Postgres after merge and deploy.

## Rollout Plan

1. Merge this compatibility guard through PR to `main`.
2. Deploy through the repo-owned ACA main deploy workflow.
3. Rerun the approved ACA private operator database migration job using the deployed digest-pinned image.
4. Confirm the pending Lakeshore budget seed migration and the Intelligence V7 moat foundation migration apply successfully.

## Deployment Authority

- Repo-owned deploy workflow: Required before using the new image for the private operator job.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required before claiming deployed.
- Worker image invariant: Required for the private operator job image.
- Feature/env flag update path: None.
- Live signed-in proof required: No UI behavior changes in this patch; DB migration apply proof is required.

## Rollback Plan

Revert this PR and redeploy if the guard causes an unexpected migration replay issue. The change is defensive and does not remove any data. If the migration has already applied, no rollback is expected for the skipped legacy cleanup clause; the governed CIO Tower facts remain the runtime source of truth.

## Audit Evidence

- PR URL: pending
- CI run: pending
- ACA deploy run: pending
- Migration job proof: pending

## Known Gaps

- Migration application proof is pending until after merge and deploy.
