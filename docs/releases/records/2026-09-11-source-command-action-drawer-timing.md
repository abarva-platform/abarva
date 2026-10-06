# 2026-09-11-source-command-action-drawer-timing — Source Action Drawer Timing

## Release ID

`2026-09-11-source-command-action-drawer-timing`

## Status

`candidate`

## Plain-English Summary

Source action details now use the same governed timing label as the action row. When an action has no formal due date but does have reviewed timing language, the drawer shows that timing language instead of a generic missing-date value.

## Layer Impact

Layer 4 — Products: Source presentation logic changes how action-detail timing is rendered. No source adapter, canonical model, migration, seed, or data-plane write is included.

## Client Applicability

- All clients: Yes, for Source command-center action details.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route/provider gates only.

## Changes Included

- Source action drawer now receives the portfolio as-of date and calls the same timing formatter used by action rows.
- Browser regression coverage confirms governed timing language appears in the opened action drawer.

## QA / Validation

- Pass — `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- Pass — `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pending — TypeScript, release check, ACA deployment, runtime invariant, and signed-in Source proof after merge.

## Rollout Plan

Merge through pull request, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the approved main image. No migration or private data refresh is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source command-center action drawer.

## Rollback Plan

Revert the product-surface commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

Pull request, CI output, release-check output, ACA deployment summary, runtime invariant output, and signed-in Source command-center action-drawer smoke evidence.

## Known Gaps

This release does not reload, parse, or enrich contract data. It only keeps the action-row timing story and action-drawer timing story consistent.
