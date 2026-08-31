# 2026-08-31-source-workspace-chart-rendering — Source Workspace Chart Rendering

## Release ID

`2026-08-31-source-workspace-chart-rendering`

## Status

`candidate`

## Plain-English Summary

This release fixes a presentation defect where Source workspace chart cards could reserve space and show legends while the chart marks themselves did not render. The chart cards now provide explicit measured dimensions to the charting library so the visual marks render consistently inside the existing layout.

## Layer Impact

- Layer 4, Products: Updates the Source workspace presentation layer only. No canonical data, adapters, loaders, tenant routing, or calculations change.
- Lane: `global-control-lane`.

## Client Applicability

- All clients: Source workspace users receive the rendering correction.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`: replaces fragile auto-sized chart wrappers with a measured chart frame that passes explicit width and height to chart components.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`: adds regression checks that chart cards contain a measured stage and chart wrapper.

## QA / Validation

- `node node_modules/jest/bin/jest.js --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the production image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime rollout.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Produced by the repo-owned workflow.
- ACA runtime invariant: Must pass in the deploy workflow before live proof is claimed.
- Worker image invariant: Must pass in the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Source workspace chart marks render and tenant-safe text remains clean.

## Rollback Plan

Revert this release with a follow-up pull request and deploy through the same repo-owned workflow. No data rollback is required because this is presentation-only.

## Audit Evidence

- Pull request: pending.
- Deploy workflow: pending.
- Live proof: pending.

## Known Gaps

This release only fixes chart mark rendering. Broader page design parity and data coverage remain governed by their own release tracks.
