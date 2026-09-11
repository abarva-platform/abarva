# 2026-09-10-source-command-lever-story — Source Command Lever Story

## Release ID

`2026-09-10-source-command-lever-story`

## Status

`candidate`

## Plain-English Summary

The Source command-center Levers tab now opens on an ordered, contract-backed action story when governed action rows exist. The page no longer repeats the Command KPI strip or portfolio aggregate widgets above the lever sequence; analytic rollups remain available behind the By type and By contract subtabs.

## Layer Impact

Layer 4 products only, in the `global-control-lane`. The change is limited to the Source workspace UI projection and browser-surface test coverage; it does not change client intake, source adapters, canonical tables, migrations, loaders, or data-build jobs.

## Client Applicability

- All clients: Yes, for the Source workspace route when action candidate rows are present.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `./node_modules/.bin/eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `git diff --check`

## Rollout Plan

Open a pull request, squash merge to `main`, and let the repository-owned Azure Container Apps main deploy workflow build and deploy the approved image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: Populated by the deploy workflow after merge.
- ACA runtime invariant: Must be verified after deploy before live-proof claims.
- Worker image invariant: Must be verified after deploy before live-proof claims.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace Levers must render the ordered action story and keep the Command KPI strip off the Levers tab.

## Rollback Plan

Revert the PR and redeploy through the repository-owned ACA workflow. No data rollback is required because this release changes only the product projection.

## Audit Evidence

Inspect the PR diff, validation output, repository-owned deploy workflow run, ACA runtime invariant output, and live Source workspace browser smoke output.

## Known Gaps

This release does not enrich or reload contract data. Contracts with thin canonical rows still need the governed data-build path to produce richer purpose, scope, evidence, and optimization objects.
