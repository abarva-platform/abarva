# 2026-09-11-source-coverage-readiness-table — Source Coverage Readiness Table

## Release ID

`2026-09-11-source-coverage-readiness-table`

## Status

`candidate`

## Plain-English Summary

Source Coverage no longer presents vendor readiness as a free-form scatter plot. It renders the same governed vendor-position fields as a ranked decision table so the page clearly separates recorded value, readiness, evidence depth, action count, and candidate action value.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 — Products: changes only the Source workspace Coverage rendering and browser-surface assertions. No canonical data, source adapter, tenant intake, migration, or private data-build job is changed.

## Client Applicability

- All clients: Yes, for the Source workspace Coverage surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace routing and provider flags only.

## Changes Included

- Replaces the vendor-readiness scatter renderer with a ranked vendor-readiness table.
- Exposes a pure decision-row helper for behavioral coverage.
- Updates browser-surface tests to assert the decision table instead of the removed scatter label.
- Keeps archetype coverage and declared-play right-rail rendering unchanged.

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand`
- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx tsc --noEmit --pretty false`

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: Resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before calling the change deployed.
- Worker image invariant: Required before calling the change deployed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Coverage must show the vendor-readiness table and must not render the removed scatter plot.

## Rollback Plan

Revert the PR or redeploy the previous known-good ACA digest through the approved main deploy path. No data rollback is required because this is a Layer 4 rendering-only change.

## Audit Evidence

- PR URL after open.
- Local test, lint, TypeScript, and release-check output from the release branch.
- ACA deploy workflow run after merge.
- Signed-in browser proof after deployment.

## Known Gaps

This release does not backfill archetype mappings, reload contract documents, create performance evidence, enrich document-page text, or run a private data-build job. It only makes the existing Coverage data legible and prevents the scatter plot from implying precision the current rows do not support.
