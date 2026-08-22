# 2026-08-21-moves-ava-panel-declutter — Moves aVa Panel Declutter

## Release ID

`2026-08-21-moves-ava-panel-declutter`

## Status

`candidate`

## Plain-English Summary

The Moves aVa panel is quieter on phase pages. The P1 first-open panel now shows only the two most useful quick prompts, and cited draft summaries explicitly remind users that inserting a draft does not save governed phase state.

## Layer Impact

Layer 4 Products only. The change affects Moves page UI copy and panel rendering. It does not change intake files, adapters, canonical data, projections, approvals, persistence semantics, or data-plane state.

## Client Applicability

- All clients: Moves phase pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Reuses one aVa draft-summary component in both empty and threaded aVa panel states.
- Shows the non-persistence reminder `Review a field; inserting does not save.` before users open a cited draft.
- Limits P1 quick prompt chips to two visible questions so the panel is less cluttered.
- Adds component coverage for the P1 prompt cap and draft-summary non-persistence reminder.

## QA / Validation

- `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` passed.
- `npx tsc --noEmit` passed.
- Focused ESLint and diff whitespace checks passed.
- Release control and staged secret scan must pass before merge.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Yes, approved for this session.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the P1 aVa panel after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main workflow. No data rollback is required.

## Audit Evidence

- PR URL, merge SHA, CI checks, deploy run, runtime invariant proof, and signed-in browser proof to be attached after release.

## Known Gaps

This does not create or mutate a live incomplete Move. The incomplete-input draft path remains covered by component tests; live production currently exposes the tracked Move with P1 inputs already complete.
