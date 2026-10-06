# 2026-09-08-source360-vendor-tab-label-fidelity — Source 360 Vendor Tab Labels

## Release ID

`2026-09-08-source360-vendor-tab-label-fidelity`

## Status

`candidate`

## Plain-English Summary

Source 360 now uses the same Vendor 360 subtab names as the approved design contract. The change is label-only and keeps the existing chart, table, and drilldown behavior intact.

## Layer Impact

Release lane: `global-control-lane`

Layer 4/product surface only. No tenant data, schema, adapters, canonical objects, read models, assistant grounding, or data-build jobs are changed.

## Client Applicability

- All clients: Yes, for Source 360 workspace routes.
- Specific clients: No.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` passed.

## Rollout Plan

Merge through PR, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for `/source/workspace` Vendor 360 subtabs.

## Rollback Plan

Rollback the web runtime to the prior ACA image digest if the workspace route loses expected Vendor 360 tab controls or subtab navigation.

## Audit Evidence

- PR URL and CI checks.
- Focused Source 360 browser-surface test output.
- Post-deploy ACA runtime invariant.
- Signed-in Source 360 DOM or screenshot proof confirming the Vendor 360 labels.

## Known Gaps

Signed-in product proof still requires a browser session for the intended tenant.
