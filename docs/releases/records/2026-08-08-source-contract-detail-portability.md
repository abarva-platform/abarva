# 2026-08-08-source-contract-detail-portability — Source Contract Detail Portability

## Release ID

`2026-08-08-source-contract-detail-portability`

## Status

`candidate`

## Plain-English Summary

The Source workspace contract detail reader now uses the same tenant-aware contract projection as the portfolio list for non-default source adapters. A contract that appears in the workspace portfolio can open its Contract 360 detail tabs through the shared detail API instead of returning a missing-record response.

## Layer Impact

- `global-control-lane`: Source workspace Contract 360 drill-downs become portable across source adapters that normalize into the shared contract row shape.
- `client-data-lane`: The single-contract reader reuses the same tenant-aware list adapter for the second canary source projection; no schema or data mutation is included.

## Client Applicability

- All clients: Shared Source workspace and Contract 360 detail API behavior.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand`
- Targeted lint and typecheck must pass before release.
- Live signed-in Source workspace proof must verify that a second tenant can open a contract detail without defaulting to the primary canary dataset.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the image, verifies the ACA runtime invariant, and shifts traffic after health checks pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Required by the main deploy workflow.
- Worker image invariant: Required by the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace contract detail for the primary and second canary tenants.

## Rollback Plan

Revert this release commit and merge the revert to `main`; the main deploy workflow will publish the prior detail-reader behavior. No migration rollback is required.

## Audit Evidence

- PR URL and CI run after PR creation.
- Main deploy workflow run after merge.
- Signed-in browser proof artifacts under `reports/agent-client-auth/`.

## Known Gaps

This fix proves the Contract 360 detail API can read the second tenant projection. It does not imply equal evidence depth across tenants; source evidence availability remains determined by each tenant's loaded extracts.
