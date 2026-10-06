# 2026-09-10-source-contract-detail-shell-story — Source Contract Detail Shell And Tab Story

## Release ID

`2026-09-10-source-contract-detail-shell-story`

## Status

`candidate`

## Plain-English Summary

Source contract detail pages now retain the global Nexus application toolbar and render each contract tab as a distinct decision surface. Story, Scope, Relationship, Evidence, and Optimize no longer reuse the same generic value block as filler; each tab states what the presenter can say and what remains blocked by missing evidence.

## Layer Impact

- Layer 4 PRODUCTS: updates Source workspace presentation logic and shell behavior only. No canonical data, loader, migration, or tenant input shape changes are included.
- `global-control-lane`: the shared product shell route handling changes for Source workspace paths so the persisted Nexus toolbar renders once.

## Client Applicability

- All clients: yes, for Source workspace contract-detail routes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source workspace contract detail renders tab-specific side panels and tab-specific narratives.
- Evidence tab now distinguishes absent raw document pages from structured spend, scope, performance, and opportunity rows.
- Source workspace routes are no longer excluded from `MaestroChrome`'s persisted Nexus toolbar.
- Regression tests cover the Source toolbar invariant and tab narrative separation.

## QA / Validation

- `npx jest --runInBand --testPathPatterns='src/components/chrome/__tests__/MaestroChrome\\.test\\.tsx$|src/app/\\(maestro\\)/source/preview/workspace/__tests__/WorkspaceExecutiveShell\\.performance\\.test\\.ts$'` passed locally.
- `npx eslint src/components/chrome/MaestroChrome.tsx src/components/chrome/__tests__/MaestroChrome.test.tsx 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` passed locally.
- `npx tsc --noEmit --pretty false` passed locally.
- `git diff --check` passed locally.
- `npm run release:check` passed locally.
- Deploy evidence and live signed-in proof to be added before status moves from `candidate`.

## Rollout Plan

Merge by pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved `main` image. No data job or migration is required.

## Deployment Authority

- Repo-owned deploy workflow: required before shared runtime claim.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source workspace contract detail and aVa optimization prompt.

## Rollback Plan

Revert the PR or roll the web Container App back to the previous approved digest through the repo-owned deployment lane. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI/checks: pending.
- ACA deploy run: pending.
- Runtime invariant proof: pending.
- Live Source/aVa smoke: pending.

## Known Gaps

None known for this UI and shell release. This release does not add raw document page text, new evidence rows, or new optimization data.
