# 2026-09-10-source-command-tab-navigation — Source Command Tab Navigation

## Release ID

`2026-09-10-source-command-tab-navigation`

## Status

`candidate`

## Plain-English Summary

Source command-center tabs now behave as real product navigation. Command, Contracts, Levers, Evidence, and Coverage each carry a canonical `/source` URL state while preserving the immediate selected-tab interaction, so a click cannot silently leave the page on the wrong Source section.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source command-center navigation, route parsing, and browser fallback behavior change.
- Layer 3 Canonical Model: No schema, migration, tenant-data, read-model, or canonical-model mutation.

## Client Applicability

- All clients: Applies to the Source command center route and compatibility workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds command-center tab deep-link support through the `workspaceTab` query parameter.
- Threads the selected command-center tab from the server route into the Source workspace client initial state.
- Renders the five command-center tabs as link-backed controls with button semantics, preserving selected-state styling while giving the browser a hard `/source` navigation fallback.
- Extends regression coverage for tab URL state, tab hrefs, and route-to-client threading.

## QA / Validation

- PASS: `jest --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 tsc --noEmit --pretty false`
- PASS: `eslint src/app/(maestro)/source/workspace/page.tsx src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx src/app/(maestro)/source/preview/workspace/viewModel.tsx src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`
- PASS: `git diff --check`
- PASS: `prettier --check` on changed Source workspace files and this release record.
- PASS: `npm run release:check`
- Pending: live signed-in `/source` tab-click smoke after deployment.

## Rollout Plan

Merge through a pull request, then deploy through the repo-owned Azure Container Apps main deploy workflow. No data-build job, migration apply, or tenant-data refresh is required for this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured after deploy.
- ACA runtime invariant: Verify web template image, 100%-traffic revision image, and worker job images match the approved digest before live proof.
- Worker image invariant: Required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/source` command tabs must visibly switch to Contracts, Levers, Evidence, and Coverage and expose canonical `/source?workspaceTab=...` state.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned workflow. There is no database rollback because this release does not add migrations or mutate tenant data.

## Audit Evidence

- Pull request URL after creation.
- Local validation output listed above.
- ACA main deploy workflow URL after merge.
- Runtime invariant output after deployment.
- Signed-in Source command-center browser proof for each top-level tab.

## Known Gaps

This release fixes command-center tab navigation fidelity. It does not add new contract-intelligence rows, enrich contract archetype coverage, or change Source data-loading behavior.
