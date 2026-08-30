# 2026-08-30-source-workspace-horizontal-nav — Source Workspace Navigation Alignment

## Release ID

`2026-08-30-source-workspace-horizontal-nav`

## Status

`candidate`

## Plain-English Summary

Aligns the Source workspace shell with the approved Source 360 design contract by removing the rendered left explorer and using a top workspace header with horizontal page tabs. It also adds a deterministic chart treatment for vendor concentration using the existing charting dependency and contract-wide vendor rollup data.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4, Products: Source workspace presentation only. The change affects navigation layout, visual tokens, and chart rendering for already-loaded Source workspace read models.

No Layer 1, Layer 2, or Layer 3 data changes are included.

## Client Applicability

- All clients: Source workspace users receive the shell/layout change where this workspace is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider gating remains unchanged.

## Changes Included

- Source workspace shell removes the left sidebar/explorer and renders a top header plus horizontal page navigation.
- Source workspace vendor concentration panel renders a chart from vendor rollup rows using Recharts.
- Source workspace warm-token guard coverage is extended for stale cool palette values.
- Focused Source workspace tests are updated to assert the sidebar is absent.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/VendorCanvas.cockpit.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace'` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through PR into `main`, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the approved image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Populated by the deploy workflow.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace route with the enabled provider.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned Azure Container Apps workflow. No schema, migration, data-plane, or tenant data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI/check output: pending.
- ACA deploy run: pending.
- Live signed-in screenshot/DOM proof: pending.

## Known Gaps

Additional Source 360 chart panels beyond the vendor concentration visual remain to be aligned incrementally with the design contract.
