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
- `src/components/tower/TowerIndexPage.tsx`
- `src/lib/atlas/llm.ts`
- `package.json` (`tower:materialize:all`, `tower:materialize:all:dry-run`)
- `docs/audits/TOWER-DATA-LAYER-RECONCILIATION-2026-06-27.md`

## QA / Validation

- Targeted Jest passed: `8/8`.
- Follow-up dashboard truth Jest passed: `11/11`
  (`TowerCioDashboardSurface`, `tower-factual-spine`).
- Targeted ESLint passed on touched Tower files.
- Targeted ESLint passed on `src/scripts/tower/materialize-all-tenants.ts`.
- Materialization CLI smoke passed:
  `npm run tower:materialize:all:dry-run -- --help`.
- Deployed ACA run `28301266013` passed on main SHA
  `48648ac3bf06534b40b08f63071bafa450da4f57`; active revision
  `ca-abarva-web-lab-eastus--m48648ac3`; image digest
  `sha256:3828f676e4c5bc700aa40700dd3205bc260a5feee26b23036208d3393c7dc6d1`;
  100% traffic; health green.
- Private ACA operator materialization retry succeeded on execution
  `job-abarva-private-operator-eus-0gzg84i`: `6/6` tenants ok,
  `0` failed. Output stored locally at
  `/tmp/tower-materialize-28301266013-r2`.
- Signed-in live Tower scorer for Lakeshore ran after materialization and
  produced `/Users/anand/Downloads/tower-live-scorer-2026-06-27T21-05-55-218Z.zip`;
  result was `0/20` on the adversarial safety sample, so answer quality remains
  blocked even though data refresh succeeded.
- Repo-wide TypeScript was attempted with `NODE_OPTIONS=--max-old-space-size=8192`;
  it is blocked by existing missing dependency declarations unrelated to this
  release (`js-yaml`, `@azure-rest/ai-document-intelligence`,
  `@axe-core/playwright`).

## Rollout Plan

Merge to `main`, deploy through the Azure Container Apps release path, then run
`npm run tower:materialize:all` through the digest-pinned private ACA operator
job, then run signed-in browser crawl for all canonical tenants.

Follow-up dashboard truth patch must be merged and redeployed before the Tower
dashboard is called CXO-ready: it prevents rollup-vs-initiative budget
contradiction, collapses repeated wave/expansion rows for display, and formats
stored IT intensity ratios such as `0.02` as `2.0% of revenue`.

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
- Live Azure/Postgres materialization refresh has been run and proven for the
  currently deployed digest, but the dashboard truth patch in this record still
  needs its own merge/deploy/materialization/browser-proof cycle.
- Browser-visible Tower crawl proved the deployed dashboard is no longer empty,
  but also exposed remaining answer-quality and latency failures; this is not
  done until a scorer pass is materially green.
- Lakeshore materialization surfaced `2` forbidden-identifier audit rows and `1`
  gap. That is a data-cleanliness issue to resolve before demo-grade sign-off.
