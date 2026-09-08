# 2026-09-08-source-graph-row-count-consistency — Source Graph Row Count Consistency

## Release ID

`2026-09-08-source-graph-row-count-consistency`

## Status

`candidate`

## Plain-English Summary

Source workspace graph mapping rows now use the same loaded impact coverage rows as the graph volume view. This keeps spend, performance, document, and change-order row counts consistent across adjacent Source 360 views.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 product surface only. The change updates Source workspace presentation logic and does not modify schemas, loaders, tenant data, or canonical facts.

## Client Applicability

- All clients: Source workspace users on the shared product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace executive shell now totals impact coverage rows through one typed helper before falling back to older snapshot counters.
- Source workspace shell tests cover the row-count derivation used by graph volume and mapping views.

## QA / Validation

- PASS: `npm test -- WorkspaceExecutiveShell.performance.test.ts --runInBand`
- PASS: `npm test -- WorkspaceClient.ecl-browser.test.tsx --runInBand`
- PASS: `npm test -- portfolioAdapter.ecl.test.ts --runInBand`
- PASS: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`
- PASS: `npx tsc --noEmit --pretty false`

## Rollout Plan

Open a pull request, squash-merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the approved image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Set by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Source workspace graph Mapping spine must show row counts consistent with the graph Volume tab.

## Rollback Plan

Revert the pull request and redeploy through the same repo-owned workflow. No data rollback is required.

## Audit Evidence

- Pull request and CI checks for this release.
- Repo-owned deploy workflow run for the merge SHA.
- Signed-in Source workspace proof after deployment.

## Known Gaps

This release does not change data completeness, taxonomy mapping, or upstream impact-view query latency.
