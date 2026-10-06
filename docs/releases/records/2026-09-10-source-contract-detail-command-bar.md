# 2026-09-10-source-contract-detail-command-bar — Source Contract Detail Navigation

## Release ID

`2026-09-10-source-contract-detail-command-bar`

## Status

`released`

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
- PR checks for #7521 — PASS.
- ACA main deploy carried this change forward to active SHA `f2bd2fddad32b26f0016618ef292b8af303e2f24` — PASS.
- `node scripts/deploy/check-aca-runtime-invariant.mjs --expected-image acrabarvalab001.azurecr.io/abarva/web@sha256:48e7df951294db34501ce1b2a8cf028e7ddb94e1ba03c9a9e751aae514c9c653 --out-dir /tmp/source-final-runtime-invariant-f2bd2fdd` — PASS.
- Live signed-in selected-contract Source workspace smoke on `https://app.abarva.ai` — PASS. Contract commandbar rendered, portfolio workspace navigation and action toolbar were absent, old instructional banner was absent, exactly one Optimize tab was present, and the lever-table story rendered.

## Rollout Plan

Open a PR, merge through the protected repository workflow, and let the repo-owned Azure Container Apps main deploy workflow publish the approved main image. No schema migration, data-build job, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: `sha256:48e7df951294db34501ce1b2a8cf028e7ddb94e1ba03c9a9e751aae514c9c653`.
- ACA runtime invariant: PASS on active revision `ca-abarva-web-lab-eastus--mf2bd2fdd`.
- Worker image invariant: PASS for required worker jobs on the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: completed for selected-contract Source workspace contract-detail page.

## Rollback Plan

Revert the PR or deploy the prior digest-pinned web image. No data rollback is required because this release does not mutate source, canonical, or projection rows.

## Audit Evidence

Inspect the PR diff, local validation output, CI checks, ACA deploy workflow, runtime-invariant proof, and live signed-in Source workspace smoke result.

## Known Gaps

This release does not add new evidence fields, benchmark comparators, target-term fields, or data-layer reconciliation. It only changes the contract-detail page structure and navigation.
