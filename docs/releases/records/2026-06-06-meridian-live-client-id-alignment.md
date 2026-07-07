# 2026-06-06-meridian-live-client-id-alignment — Meridian Loader Live Client ID Alignment

## Release ID

`2026-06-06-meridian-live-client-id-alignment`

## Status

`candidate`

## Plain-English Summary

Aligns the Meridian tenant substrate loader and audit expectation to the Meridian client row that already exists in the live Azure/Postgres database. The prior loader id did not match the existing `clients.tenant_key = meridian-health` row, so Phase 0 failed on the unique tenant-key constraint and all child inserts failed on `client_id` foreign keys.

This is a loader-backed target-id alignment, not a new seed side-load. New pilot data should enter through the Admin Data Loader or an approved loader-backed ingestion path; this change preserves the no side-load policy and expects the post-merge Meridian loader run to retain audit evidence through `data_ingestion_runs` where supported by the tenant ingestion path, plus Azure execution logs for this legacy substrate wrapper.

## Layer Impact

- `client-data-lane`: Changes the Meridian synthetic dataset loader target id to match the existing live Azure/Postgres client row. It does not change runtime UI, auth, shared schema, or other client data.

## Client Applicability

- All clients: No.
- Specific clients: Meridian synthetic healthcare demo tenant only.
- Internal only: No.
- Public/demo only: Supports Meridian/PHS demo proof and documentation.
- Feature flag: Not applicable.

## Changes Included

- `scripts/seed/load-tenant-substrate.ts`
- `scripts/audit/db-substrate-audit.mjs`
- `datasets/meridian-health-synthetic-v1/00-profile/enterprise-profile.yaml`
- `docs/releases/records/2026-06-06-meridian-live-client-id-alignment.md`

## QA / Validation

- PASS — Live Azure/Postgres read-only check found existing Meridian row: `tenant_key = meridian-health`, client id `a20ecef5-f0ea-4890-b9d5-7375fab223ff`.
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`
- PASS — `NODE_PATH=/Users/anand/Projects/nexus/node_modules TENANT_KEY=meridian DATABASE_URL=postgresql://placeholder /Users/anand/Projects/nexus/node_modules/.bin/tsx scripts/seed/load-tenant-substrate.ts --dry-run --concurrency=2`

## Rollout Plan

Merge to `main`, then rerun the private Azure loader for `TENANT_KEY=meridian`. The loader should update the existing Meridian client row and insert the synthetic context chunks, applications, initiatives, and vendor contracts under the live client id.

## Rollback Plan

Revert this PR. If the loader has already inserted Meridian synthetic rows under the live id, remove or reload that tenant through the private data-plane reset/load runbook rather than editing shared runtime code.

## Audit Evidence

- Pull request for this change.
- Azure execution logs from the failed run showing the duplicate `idx_clients_tenant_key` failure.
- Post-merge Azure execution logs showing Phase 0 success and nonzero child inserts.
- Post-load signed-in route proof for the Meridian CDAO auth state.

## Known Gaps

This change aligns the loader target id but does not itself load Azure/Postgres rows. A post-merge private loader rerun is required to close the Meridian/PHS context-layer evidence gap.
