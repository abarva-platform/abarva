# 2026-09-10-source-workspace-dock-state — Source Workspace Dock State

## Release ID

`2026-09-10-source-workspace-dock-state`

## Status

`candidate`

## Plain-English Summary

Source workspace navigation now starts from the page-declared aVa launcher state instead of restoring a stale browser preference. This prevents an old expanded advisor state from covering command-center tabs while the page appears to be in normal workspace mode.

## Layer Impact

Layer 4 products only, in the `global-control-lane`. The change is limited to the Source workspace UI shell and a shared dock regression test; no client intake, source-adapter, canonical-model, migration, or data-build behavior changes.

## Client Applicability

- All clients: Yes, for the Source workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`
- `src/components/agent/__tests__/AgentDock.test.tsx`

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath 'src/components/agent/__tests__/AgentDock.test.tsx' --runInBand -t 'honors disableStoredMode when a stale expanded preference exists'`
- Pass: `./node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `./node_modules/.bin/eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' src/components/agent/__tests__/AgentDock.test.tsx`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Open a pull request, squash merge to `main`, and let the repository-owned Azure Container Apps main deploy workflow build and deploy the approved image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: Populated by the deploy workflow after merge.
- ACA runtime invariant: Must be verified after deploy before live-proof claims.
- Worker image invariant: Must be verified after deploy before live-proof claims.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace command tabs must be clickable with the aVa launcher present.

## Rollback Plan

Revert the PR and redeploy through the repository-owned ACA workflow. No data rollback is required.

## Audit Evidence

Inspect the PR diff, validation output, repository-owned deploy workflow run, ACA runtime invariant output, and live Source workspace browser smoke output.

## Known Gaps

This release fixes a stale dock-state hit-target defect. It does not redesign Source dashboard content, alter contract data richness, or modify data loading pipelines.
