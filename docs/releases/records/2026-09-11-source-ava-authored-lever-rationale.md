# 2026-09-11-source-ava-authored-lever-rationale — Source aVa Lever Rationale Fallback

## Release ID

`2026-09-11-source-ava-authored-lever-rationale`

## Status

`deployed-live-proven`

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
- `npm run release:check` passed before merge.
- Pull request #7599 was squash-merged as `7a88c093a3e9fcbeb5400d4fac40a9b5a6c2431e`.
- ACA main deploy workflow run `34566100712` completed successfully.
- Deployed image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:dbde0b9ded0ed3c36be196b74c55856e1bdd472e4307cc4c620c3ef3eb9c8564`.
- Active revision: `ca-abarva-web-lab-eastus--m7a88c093`, healthy at 100% traffic.
- Runtime invariant verified: web template image, 100%-traffic revision image, and both required worker job images all matched the approved digest.
- Signed-in Source proof verified the contract-scoped Levers page for the governed demo tenant: main nav present, six contract levers visible, current refresh date shown, and no stale date, missing due-date, or raw-token leaks.
- Signed-in Source aVa proof verified the contract optimization export answer included the contract ID, executive takeaway, lever table, all six levers, authored vendor-agreement rationale, unsized signal-stage rows, and no missing-packet or fallback-rationale text.

## Rollout Plan

Merged through pull request #7599 to `main`. The repo-owned Azure Container Apps main deploy workflow built and deployed the digest-pinned web image. No migration, data reload, or data-build job is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required for Product/Lab runtime update.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:dbde0b9ded0ed3c36be196b74c55856e1bdd472e4307cc4c620c3ef3eb9c8564`.
- ACA runtime invariant: verified after deploy.
- Worker image invariant: verified after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: completed for the Source Command Center contract-scoped aVa optimization export prompt.

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
