# 2026-08-30-source-ava-readable-evidence-basis - Source aVa Evidence Basis Labels

## Release ID

`2026-08-30-source-ava-readable-evidence-basis`

## Status

`candidate`

## Plain-English Summary

Source aVa contract answer tables now show readable evidence-basis labels instead of internal table names or serialized citation JSON. Operators still see the contract record, opportunity record, finance-confirmation state, and supporting row counts, but the answer no longer exposes implementation-shaped references in the executive table.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: changes Source workspace context shaping and deterministic aVa answer rendering only. No loader, adapter, schema, canonical data, cube refresh, or tenant data mutation is included.

## Client Applicability

- All clients: Source deterministic contract aVa answers and Source workspace aVa context.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`: maps structured action-candidate citation basis into client-facing evidence labels and row-count summaries before placing it on the aVa surface context.
- `src/lib/source/ava/source-workspace-visual-answer.ts`: sanitizes source reference inputs at the answer boundary and renames the table column from `Source refs` to `Evidence basis`.
- Focused Jest regressions cover nested citation-basis objects and legacy raw JSON strings.

## QA / Validation

- `npx jest --runTestsByPath 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand` passed.
- `npx eslint 'src/lib/source/ava/source-workspace-visual-answer.ts' 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'` passed.

## Rollout Plan

Merge through a protected PR. The repo-owned Azure Container Apps main deployment workflow will build and deploy the resulting main SHA.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment if the workflow updates workers.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, ask a deterministic Source contract opportunity question and confirm the evidence-basis cell does not contain raw JSON or internal table names.

## Rollback Plan

Revert the PR or redeploy the previous healthy ACA revision. No data rollback is required because this is product response-shaping code only.

## Audit Evidence

- PR URL and merge SHA after merge.
- Focused Jest and lint output for the evidence-basis regressions.
- ACA main deploy run and runtime invariant evidence after rollout.
- Signed-in Source aVa proof after deploy.

## Known Gaps

This release does not change underlying Source data coverage, opportunity calculations, deterministic substrate rules, or data-quality assertions.
