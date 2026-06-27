# 2026-06-27-tower-data-layer-readiness — Tower Source Field Reconciliation

## Release ID

`2026-06-27-tower-data-layer-readiness`

## Status

`candidate`

## Plain-English Summary

Tower was showing empty or misleading values, especially `$0` budget for
SkyHarbor, even though source files contained budget, spend, value, and risk
fields. This change makes Tower recognize the field names used across all
canonical tenant source datasets and recover budget rollups from source-backed
F12 rows when the materialized rollup table is missing. It also adds a
repo-owned all-tenant Tower materialization command so the deployed image can
refresh every canonical tenant through the approved private ACA operator path.

## Layer Impact

- `global-control-lane`: shared Tower read-model projection and budget rollup
  behavior for all tenants.
- `client-data-lane`: data semantics only; no data migration is included in this
  code change.

## Client Applicability

- All clients: yes, the Tower field contract is tenant-agnostic.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings,
  Meridian Health, and SkyHarbor Air are covered by the source audit.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/tower/tower-semantic-projection.ts`
- `src/lib/tower/tower-budget-rollups.ts`
- `src/lib/tower/__tests__/tower-semantic-projection.test.ts`
- `src/lib/tower/__tests__/tower-materialized-read-model.test.ts`
- `src/scripts/tower/materialize-all-tenants.ts`
- `package.json` (`tower:materialize:all`, `tower:materialize:all:dry-run`)
- `docs/audits/TOWER-DATA-LAYER-RECONCILIATION-2026-06-27.md`

## QA / Validation

- Targeted Jest passed: `8/8`.
- Targeted ESLint passed on touched Tower files.
- Targeted ESLint passed on `src/scripts/tower/materialize-all-tenants.ts`.
- Materialization CLI smoke passed:
  `npm run tower:materialize:all:dry-run -- --help`.
- Repo-wide TypeScript was attempted with `NODE_OPTIONS=--max-old-space-size=8192`;
  it is blocked by existing missing dependency declarations unrelated to this
  release (`js-yaml`, `@azure-rest/ai-document-intelligence`,
  `@axe-core/playwright`).

## Rollout Plan

Merge to `main`, deploy through the Azure Container Apps release path, then run
`npm run tower:materialize:all` through the digest-pinned private ACA operator
job, then run signed-in browser crawl for all canonical tenants.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: no manual non-main mutation.
- Approved image digest: produced by ACA deploy.
- ACA runtime invariant: approved main image receives 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower dashboard plus chat crawl.

## Rollback Plan

Revert this PR and redeploy the previous approved ACA image digest. No schema or
data migration rollback is required.

## Audit Evidence

- `docs/audits/TOWER-DATA-LAYER-RECONCILIATION-2026-06-27.md`
- Targeted Jest output.
- Targeted ESLint output.

## Known Gaps

- Live Azure/Postgres materialization refresh still has to be run and proven.
- Browser-visible Tower crawl still has to prove the deployed dashboard and chat
  use the corrected source-field contract.
