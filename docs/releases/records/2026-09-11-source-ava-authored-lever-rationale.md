# 2026-09-11-source-ava-authored-lever-rationale — Source aVa Lever Rationale Fallback

## Release ID

`2026-09-11-source-ava-authored-lever-rationale`

## Status

`candidate`

## Plain-English Summary

Source aVa optimization export answers now use an authored, deterministic lever-rationale fallback when a governed action row has a clear lever pattern but no explicit vendor-concession sentence in the export packet. This prevents client-ready lever tables from showing placeholder rationale while preserving the rule that value, approvals, dates, and evidence gates must come from loaded rows.

## Layer Impact

- `global-control-lane`: Layer 4 product/read path. Updates deterministic Source aVa answer rendering only. It does not change canonical data, migrations, tenant data, ingestion, or finance state.

## Client Applicability

- All clients: yes, for Source aVa contract-optimization export answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' --runInBand` passed.
- `npx eslint 'src/lib/source/ava/source-workspace-visual-answer.ts' 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts'` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run release:check` must pass before merge.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image. No migration, data reload, or data-build job is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required for Product/Lab runtime update.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Source Command Center contract-scoped aVa optimization export prompt.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to roll the web and worker images back to the reverted digest. No data rollback is required because this is a Layer 4 answer-rendering change only.

## Audit Evidence

- Pull request and merge commit.
- Targeted Jest output.
- ESLint output.
- TypeScript output.
- Release check output.
- ACA deploy workflow run.
- Direct ACA runtime invariant readback.
- Signed-in Source/aVa proof after deploy.

## Known Gaps

This does not run a fresh VNet-attached data reload or enrich contract records. It also does not create external benchmark evidence; signal-stage price levers must remain unsized until accepted evidence is loaded.
