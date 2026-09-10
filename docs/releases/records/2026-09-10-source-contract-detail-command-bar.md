# 2026-09-10-source-contract-detail-command-bar — Source Contract Detail Navigation

## Release ID

`2026-09-10-source-contract-detail-command-bar`

## Status

`candidate`

## Plain-English Summary

Improves the Source workspace contract-detail page so contract tabs behave like a focused command surface instead of repeating the portfolio navigation and instructional banner. Contract detail now has a sticky contract toolbar, removes the portfolio claim banner from the detail view, and gives each tab a clearer story block before its evidence rows.

## Layer Impact

Affected lane: `global-control-lane`.

Layer 4 product presentation only. Source workspace reads the same governed Contract 360, consumption, evidence, and optimization data; this release changes how contract-detail navigation and tab narratives are rendered.

## Client Applicability

- All clients: Source workspace contract-detail UI.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- `npx prettier --write 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/workspace.css' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` — PASS.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — PASS.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` — PASS. Jest emitted pre-existing duplicate manual mock warnings.
- `git diff --check` — PASS.

## Rollout Plan

Open a PR, merge through the protected repository workflow, and let the repo-owned Azure Container Apps main deploy workflow publish the approved main image. No schema migration, data-build job, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: populated after deploy.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: unchanged by this presentation-only release.
- Feature/env flag update path: none.
- Live signed-in proof required: Source workspace contract-detail page.

## Rollback Plan

Revert the PR or deploy the prior digest-pinned web image. No data rollback is required because this release does not mutate source, canonical, or projection rows.

## Audit Evidence

Inspect the PR diff, local validation output, CI checks, ACA deploy workflow, runtime-invariant proof, and live signed-in Source workspace smoke result.

## Known Gaps

This release does not add new evidence fields, benchmark comparators, target-term fields, or data-layer reconciliation. It only changes the contract-detail page structure and navigation.
