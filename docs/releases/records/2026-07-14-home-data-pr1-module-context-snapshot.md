# 2026-07-14-home-data-pr1-module-context-snapshot — Home Module Context Snapshot

## Release ID

`2026-07-14-home-data-pr1-module-context-snapshot`

## Status

`candidate`

## Plain-English Summary

Home now has a deterministic snapshot builder that can consume the enterprise
data-layer module context serving contract. This lets Home summarize the active
tenant context supplied by `getModuleContext(...)` and
`explainModuleContext(...)` without reading legacy browser files or inactive
candidate data by default.

## Layer Impact

- `global-control-lane`: Adds a shared Home data adapter and proof artifact for
  module-context-backed Home summaries.
- `client-data-lane`: Reads Active Tenant Access metadata and canonical context
  through the serving contract. It does not write tenant data or promote
  candidates.

## Client Applicability

- All clients: The builder and audit are available for every active audited
  tenant.
- Specific clients: SkyHarbor currently resolves active module context in the
  proof artifact. Lakeshore, Meridian, First Capital, and Apex correctly report
  active context unavailable until a reviewed candidate is promoted.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/home-summary-snapshot.ts`: Adds
  `buildHomeSummarySnapshotFromModuleContext(...)` and module-context summary
  fields.
- `src/lib/home/__tests__/home-summary-snapshot.test.ts`: Adds supplier-context
  tests for SkyHarbor active context and Meridian no-candidate-fallback safety.
- `scripts/audit/build-home-summary-snapshot.ts`: Makes the primary Home
  summary report supplier-context-backed and writes legacy browser snapshots as
  comparison only.
- `reports/home-summary-snapshot/latest/*`: Updated deterministic proof bundle.

## QA / Validation

- Pass: `npm run test:home-summary-snapshot`
- Pass: `npm run audit:home-summary-snapshot`
- Pass: `npm run audit:module-context-serving`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:candidate-version`
- Pass: `npm run release:check`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --skipLibCheck --pretty false`
- Pass: `git diff --check`

## Rollout Plan

Merge to main through the standard PR path. No Azure Container Apps deploy is
required for this supplier-data proof because the Home runtime route is not yet
changed to consume this builder by default.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this PR.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because no runtime route behavior changes.

## Rollback Plan

Revert the PR. This removes the supplier-context Home snapshot builder and
restores the previous report generation behavior. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Proof bundle: `reports/home-summary-snapshot/latest/`
- SkyHarbor supplier snapshot:
  `reports/home-summary-snapshot/latest/skyharbor-module-context-snapshot.json`
- Primary report:
  `reports/home-summary-snapshot/latest/home-summary-control.html`

## Known Gaps

Home runtime UI is not yet rewired to use this supplier-context snapshot by
default. This PR prepares the data path and proof artifact only.
