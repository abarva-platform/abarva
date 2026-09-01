# 2026-09-01-source-workspace-single-navigation — Source Workspace Single Navigation

## Release ID

`2026-09-01-source-workspace-single-navigation`

## Status

`candidate`

## Plain-English Summary

The Source workspace now uses the global product navigation plus one page-level tab row. The extra branded workspace masthead and duplicate sticky action strip were removed so the workspace keeps one clear navigation and action pattern as operators move between Source 360 pages.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4, Products: updates the Source workspace presentation shell only. No adapters, canonical data, tenant rows, read models, or retrieval behavior changed.

## Client Applicability

- All clients: Source workspace users receive the simplified shell.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace executive shell removes the redundant branded masthead and duplicate sticky toolbar.
- Source workspace CSS removes unused masthead, sticky-toolbar, and compact-action styles.
- Focused workspace tests now assert a single Source navigation pattern and preserve the existing action toolbar, graph, chart, and aVa contracts.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` — PASS, 29 tests.

## Rollout Plan

Merge through the protected repository PR path. The repo-owned Azure Container Apps main deploy workflow builds and promotes the resulting main image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Assigned by the main deploy workflow.
- ACA runtime invariant: Verify after deployment before calling the change live.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Yes, Source workspace screenshot or DOM proof showing the single page navigation under the global product header.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7277
- Validation: focused Jest suite listed above.
- Live proof: to be added after deployment.

## Known Gaps

Live signed-in visual proof is pending until the ACA deployment completes.
