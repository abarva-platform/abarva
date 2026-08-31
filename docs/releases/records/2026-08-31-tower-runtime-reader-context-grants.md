# 2026-08-31-tower-runtime-reader-context-grants — Tower Runtime Reader Context Grants

## Release ID

`2026-08-31-tower-runtime-reader-context-grants`

## Status

`candidate`

## Plain-English Summary

Tower serving views now run as the database role that is supposed to exercise row-level security. One Tower value path also reads a canonical measure table, so this release gives that role the minimal context-table access required for the read path to work while preserving tenant-scoped policies.

## Release Lane

global-control-lane

## Layer Impact

- Layer 3 canonical model: grants read access to the canonical measure table used by Tower value rows.
- Layer 4 products: keeps the Tower serving read path executable under the runtime reader role.
- Release lane: `global-control-lane`.

## Client Applicability

- All clients: Tower product reads using the shared lab product runtime receive the change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260831124000_tower_runtime_reader_context_grants.sql`
- Package scripts: `tower:migrate:runtime-reader-context:dry`, `tower:migrate:runtime-reader-context:apply`
- Test: `src/lib/tower/__tests__/runtime-rls-role.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/tower/__tests__/runtime-rls-role.test.ts --runInBand`
- Pass: `npx eslint src/lib/tower/__tests__/runtime-rls-role.test.ts`
- Pending for candidate: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
- Pending for candidate: `node scripts/release-check.mjs --base origin/main --head HEAD`
- Runtime validation required after deploy: dry-run migration, apply migration, and Tower RLS enforcement probe through the governed ACA operator job.

## Rollout Plan

Merge through PR, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then apply the migration through the governed ACA operator job using that deployed image digest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: no ad-hoc web Container App mutation; migration applies through the governed operator job.
- Approved image digest: resolved by the main deploy workflow after merge.
- ACA runtime invariant: required before migration apply.
- Worker image invariant: required before migration apply.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower route after migration and RLS probe.

## Rollback Plan

If the grant causes a regression, ship a follow-up migration that revokes the context measure grant from the runtime reader role and redeploy the previous application image if the app read path also needs to revert.

## Audit Evidence

Inspect the PR, CI output, release-check output, ACA deploy summary, operator-job migration logs, and Tower RLS enforcement probe output.

## Known Gaps

The shared database connection role still has elevated privileges; the Tower application read path mitigates this by setting a local no-bypass runtime role for Tower reads.
