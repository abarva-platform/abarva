# 2026-09-11-source-action-tabs-full-impact — Source Action Tabs Full Impact Load

## Release ID

`2026-09-11-source-action-tabs-full-impact`

## Status

`candidate`

## Plain-English Summary

Source action tabs now request the governed impact layer during the initial portfolio load when a user opens the Command, Levers, Evidence, or Coverage tab directly. This prevents those tabs from painting an empty deferred state while waiting for a second request to hydrate the action rows.

## Layer Impact

- `global-control-lane`: Layer 4 product/read path. Updates Source workspace loading behavior only.
- No Layer 1, Layer 2, Layer 3, data-build, migration, or tenant-data write is included.

## Client Applicability

- All clients: yes, for Source workspace action/evidence tabs.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`

## QA / Validation

- PASS: targeted route/loading test (`npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' --runInBand`).
- PASS: ESLint for changed files.
- PASS: TypeScript (`npx tsc --noEmit --pretty false`).
- PASS: release check (`npm run release:check`).
- Pending after deploy: ACA runtime invariant.
- Pending after deploy: signed-in Source Levers page proof.
- Pending after deploy: signed-in Source aVa contract-optimization export proof.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image. No private data reload or data-build job is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required for Product/Lab runtime update.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Source Levers and Source aVa contract-optimization export prompt.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to roll the web and worker images back to the reverted digest. No data rollback is required because this is a Layer 4 read-path change only.

## Audit Evidence

- Pull request and merge commit.
- Targeted test output.
- ESLint output.
- TypeScript output.
- Release check output.
- ACA deploy workflow run.
- Direct ACA runtime invariant readback.
- Signed-in Source/aVa proof after deploy.

## Known Gaps

Out of scope: private reloads, enrichment jobs, and benchmark-evidence creation. This release only changes action-tab loading so governed impact rows are requested during initial paint.
