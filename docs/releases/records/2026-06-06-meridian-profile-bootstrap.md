# 2026-06-06-meridian-profile-bootstrap — Meridian Dataset Profile Bootstrap

## Release ID

`2026-06-06-meridian-profile-bootstrap`

## Status

`candidate`

## Plain-English Summary

Adds the missing Meridian synthetic healthcare enterprise profile file that the tenant substrate loader reads before inserting context chunks, applications, initiatives, and vendor contracts. Without this profile, the Azure/Postgres load cannot create or update the `clients` row, so every later Meridian insert fails on the `client_id` foreign key. The display name is intentionally neutralized as `Healthcare Composite Demo Tenant` so the live naming-policy guard treats it as synthetic demo data, not a real client or protected organization name.

## Layer Impact

- `client-data-lane`: Adds a client-scoped dataset bootstrap artifact for the Meridian/PHS-inspired synthetic demo tenant. It does not change runtime UI, shared auth behavior, schema, or production route logic.

## Client Applicability

- All clients: No.
- Specific clients: Meridian synthetic healthcare demo tenant only.
- Internal only: No.
- Public/demo only: Supports Meridian/PHS demo proof and documentation.
- Feature flag: Not applicable.

## Changes Included

- `datasets/meridian-health-synthetic-v1/00-profile/enterprise-profile.yaml`
- `docs/releases/records/2026-06-06-meridian-profile-bootstrap.md`

## QA / Validation

- Confirmed `scripts/seed/load-tenant-substrate.ts` reads `00-profile/enterprise-profile.yaml` for the Meridian tenant before Phase 1+ client-scoped inserts.
- Confirmed the profile uses the existing Meridian client id `a20ecef5-f0ea-4890-b9d5-7375fab223ff` and tenant key `meridian-health`.
- `git diff --check`
- `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`, allow the normal deployment/repo sync path to complete, then rerun the private Azure loader for `TENANT_KEY=meridian`. The loader should create or update the `clients` row in Phase 0 before loading the synthetic context layer.

## Rollback Plan

Revert this dataset file and release record. If the loader has already inserted Meridian synthetic rows, remove or reload that tenant data through the existing private data-plane reset/load runbook rather than editing shared runtime code.

## Audit Evidence

- Pull request for this change.
- Azure loader execution logs after rerun showing Phase 0 `clients` profile success and nonzero Meridian inserts.
- Post-load signed-in route proof for `agent-meridian-cdao.json`.

## Known Gaps

The profile enables the loader path but does not itself load Meridian into Azure. A post-merge private loader rerun is required to close the Meridian/PHS context-layer evidence gap.
