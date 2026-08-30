# 2026-08-30-source-workspace-accent-sweep — Source Workspace Accent Sweep

## Release ID

`2026-08-30-source-workspace-accent-sweep`

## Status

`candidate`

## Plain-English Summary

Tightens the Source workspace visual contract by removing remaining legacy cool-blue accents from the workspace route and aligning vendor-canvas fallback styling with the current Source 360 palette.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Source workspace presentation only. No data model, loader, retrieval, tenancy, or calculation behavior changes.

## Client Applicability

- All clients: Source workspace route styling is shared.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR: TBD.
- Routes: `src/app/(maestro)/source/preview/workspace`.
- Tests: Source workspace design-token scan and Vendor Canvas cockpit coverage.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/VendorCanvas.cockpit.test.tsx'` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace'` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through a protected GitHub pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: produced by the repo-owned workflow after merge.
- ACA runtime invariant: verified by the repo-owned workflow after deploy.
- Worker image invariant: verified by the repo-owned workflow when applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source workspace visual and tenant-clean proof after deploy.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned Azure Container Apps workflow.

## Audit Evidence

- PR: TBD.
- CI and deployment evidence: to be attached by GitHub Actions after merge.
- Live proof: to be captured after deploy.

## Known Gaps

None known for this styling sweep. Broader Source page information architecture and data-depth work remains tracked separately.
