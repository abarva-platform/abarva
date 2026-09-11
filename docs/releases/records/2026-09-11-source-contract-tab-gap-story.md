# 2026-09-11-source-contract-tab-gap-story — Source Contract Tab Gap Story

## Release ID

`2026-09-11-source-contract-tab-gap-story`

## Status

`candidate`

## Plain-English Summary

Selected-contract tabs now avoid repeating a generic evidence-count stack on pages where those
counts are not the story. Performance and Economics side panels use the governed tab narrative
instead, so a page with no performance periods explains the decision boundary and the missing
inputs rather than looking like an empty report.

## Layer Impact

- `global-control-lane`: Layer 4 Source presentation/read-path behavior. No source facts or
  canonical data are changed.
- No Layer 1, Layer 2, Layer 3, data-build, migration, tenant-data write, or document enrichment is
  included.

## Client Applicability

- All clients: yes, for Source selected-contract tabs.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`

## QA / Validation

- PASS: focused Source workspace behavior test (`npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand`).
- PASS: ESLint for changed files.
- PASS: TypeScript (`npx tsc --noEmit --pretty false`).
- Pending: release check after this record is added.
- Pending after deploy: signed-in Source selected-contract smoke for a Performance tab with no
  performance periods and an Optimize tab with governed action rows.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow
builds and deploys the digest-pinned web image. No private data reload or data-build job is part of
this release.

## Deployment Authority

- Repo-owned deploy workflow: required for Product/Lab runtime update.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Source selected-contract tab proof.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to roll the web and worker images
back to the reverted digest. No data rollback is required because this is a Layer 4 presentation
change only.

## Audit Evidence

- Pull request and merge commit.
- Focused test output.
- ESLint output.
- TypeScript output.
- Release check output.
- ACA deploy workflow run.
- Direct ACA runtime invariant readback.
- Signed-in Source proof after deploy.

## Known Gaps

Out of scope: private contract-document reload, archetype backfill, source-document page text
enrichment, performance-row creation, and benchmark-evidence creation. Those require a governed
data-build/enrichment job rather than a render-path change.
