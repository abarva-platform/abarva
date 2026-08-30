# 2026-08-30-source-workspace-subtab-fidelity — Source Workspace Subtab Fidelity

## Release ID

`2026-08-30-source-workspace-subtab-fidelity`

## Status

`candidate`

## Plain-English Summary

The Source workspace now keeps executive pages focused by matching the design contract's subtab pattern. Vendor, contract, optimize, and graph views expose compact subviews instead of mixing every table and proof lane into one long page.

## Layer Impact

Layer 4 Products only, release lane `global-control-lane`. The change updates the Source workspace rendering layer and regression coverage; it does not change intake files, adapters, canonical tables, projections, tenant data, or retrieval policy.

## Client Applicability

- All clients: Source workspace users who can access the preview workspace route.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing route/provider controls only; no new flag.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the new image. After deploy, run signed-in route proof for the affected Source workspace tabs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy before live-proof claims.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for Source workspace tab/subtab rendering and tenant-isolation smoke.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to redeploy the prior Source workspace rendering code. No data rollback is required.

## Audit Evidence

- PR URL and merge commit once available.
- Focused Jest and ESLint command output.
- Post-deploy signed-in Source workspace proof bundle once available.

## Known Gaps

Live signed-in proof remains pending until this candidate is merged and deployed.
