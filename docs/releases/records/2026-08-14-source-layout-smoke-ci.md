# 2026-08-14-source-layout-smoke-ci — Source Layout Smoke CI

## Release ID

`2026-08-14-source-layout-smoke-ci`

## Status

`candidate`

## Plain-English Summary

Adds a standing pull-request workflow that runs the Source Responses layout
harness before merge. The gate catches regressions where the vendor response
matrix loses columns, competes with the Q&A log, or causes page-level horizontal
overflow.

## Layer Impact

- `global-control-lane`: Adds CI governance that protects the shared Source
  product surface before future changes merge.
- Products: Source gains automated layout validation for the Responses stage.
- Release control: Adds a CI workflow only. No runtime image, schema, tenant
  data, parser, or workflow persistence behavior changes.

## Client Applicability

- All clients: Source users benefit indirectly because the Responses layout is
  protected before changes merge.
- Specific clients: None.
- Internal only: CI operators and reviewers see the new check and uploaded
  layout reports.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/source-layout-smoke.yml`
- Existing command used by CI: `npm run qa:source-responses-layout`

## QA / Validation

- Pass: `npm run qa:source-responses-layout`
- Pass: `npx prettier --check .github/workflows/source-layout-smoke.yml`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. GitHub Actions will begin running the Source layout smoke on
future pull requests, merge groups, and manual dispatches. This change does not
require an Azure Container Apps deployment to affect runtime product behavior.

## Deployment Authority

- Repo-owned deploy workflow: Not changed.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. This is CI-only validation infrastructure.

## Rollback Plan

Revert the PR to remove `.github/workflows/source-layout-smoke.yml`. No schema,
data, image, tenant, or runtime rollback is required.

## Audit Evidence

- PR checks for `Source Layout Smoke / Responses layout harness`
- Uploaded `source-layout-smoke-report` artifact from the workflow
- Local harness output under `reports/source-layout/responses-matrix`

## Known Gaps

This first CI guard covers the Responses layout harness only. The same pattern
still needs to be expanded across the remaining Source stages and then across
other dense product surfaces.
