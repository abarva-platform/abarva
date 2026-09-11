# 2026-09-11-source-coverage-table-fit — Source Coverage Table Fit

## Release ID

`2026-09-11-source-coverage-table-fit`

## Status

`candidate`

## Plain-English Summary

Source Coverage keeps the new vendor-readiness decision table inside its panel at the normal signed-in desktop viewport. The table remains five columns on desktop and stacks only at the existing small-screen breakpoint.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 — Products: CSS-only adjustment to Source workspace Coverage layout. No tenant intake, source adapter, canonical data, migration, or private data-build job is changed.

## Client Applicability

- All clients: Yes, for the Source workspace Coverage surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace routing and provider flags only.

## Changes Included

- Reduces the minimum grid tracks for the Coverage vendor-readiness table so the row grid fits the panel width at desktop sizes.
- Keeps the existing small-screen stacked layout unchanged.

## QA / Validation

- Pass: `git diff --check`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx'`
- Pass: `npm run release:check`

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: Resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before calling the change deployed.
- Worker image invariant: Required before calling the change deployed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Coverage table must fit without horizontal row overflow.

## Rollback Plan

Revert the PR or redeploy the previous known-good ACA digest through the approved main deploy path. No data rollback is required because this is a Layer 4 CSS-only change.

## Audit Evidence

- PR URL after open.
- Local lint, diff hygiene, and release-check output from the release branch.
- ACA deploy workflow run after merge.
- Signed-in browser layout proof after deployment.

## Known Gaps

This release does not change the Coverage data model, archetype mapping coverage, contract-document enrichment, or private data-build process. It only fixes table fit for the existing Coverage renderer.
