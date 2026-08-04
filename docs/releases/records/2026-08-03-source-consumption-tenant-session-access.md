# 2026-08-03-source-consumption-tenant-session-access — Source consumption tenant session access

## Release ID

`2026-08-03-source-consumption-tenant-session-access`

## Status

`candidate`

## Plain-English Summary

Adds explicit tenant session-context support to the Source sourcing consumption access helper for trusted internal DB/operator principals. `app.tenant_key` is treated as a tenant selector, not standalone authorization; authenticated product callers still rely on the canonical tenant-access helper.

## Layer Impact

- `client-data-lane`: updates a tenant-access helper used by Source consumption projections. No raw tables are changed and no data is inserted, updated, or deleted. The helper keeps canonical access checks for authenticated product callers.
- `internal-admin`: lets operator readback verification prove consumption projections with an explicit tenant session context.

## Client Applicability

- All clients: applies to Source sourcing consumption projections where the helper is used.
- Specific clients: None.
- Internal only: operator verification and future governed semantic-runtime reads.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260803193500_source_sourcing_context_tenant_session_access.sql`
- `scripts/source/verify-sourcing-context-depth.mjs`

## QA / Validation

- Pass: `node --check scripts/source/verify-sourcing-context-depth.mjs`
- Pass: `npx eslint scripts/source/verify-sourcing-context-depth.mjs`
- Pass: migration safety scan found no destructive statements in `supabase/migrations/20260803193500_source_sourcing_context_tenant_session_access.sql`
- Pass: verifier includes a negative tenant probe before reading the requested tenant.
- Pass: `npm run release:check`
- Blocked pending rollout: operator readback rerun requires the migration and verifier patch to be merged, deployed, and applied through the ACA operator job.

## Rollout Plan

Merge to `main`. Let the repo-owned Azure Container Apps main deploy workflow build and deploy the image. Apply the new migration through the ACA operator job with a digest-pinned image, then rerun the Source sourcing-context readback verifier.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: enforced by the repo-owned deploy workflow.
- Worker image invariant: enforced by the repo-owned deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no, data-plane verification change only.

## Rollback Plan

Revert the migration with a new migration that restores the previous helper body if the session-context behavior is incorrect. No data rollback is required.

## Audit Evidence

- PR and CI checks for this change.
- ACA operator migration logs for applying the helper update.
- ACA operator readback logs for the subsequent Source verification run.

## Known Gaps

This change does not deploy a standalone Cube runtime. It establishes the database-side tenant context contract that a Cube or app runtime must honor when reading these consumption views. A runtime must not expose raw `app.tenant_key` selection to end users as authorization.
