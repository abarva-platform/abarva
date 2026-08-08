# 2026-08-07-source-approval-typography-polish — Source Approval Typography Polish

## Release ID

`2026-08-07-source-approval-typography-polish`

## Status

`candidate`

## Plain-English Summary

This release makes the Source approval page feel like a professional workflow screen instead of a presentation page. It reduces oversized headings, tightens spacing, shortens the rationale input, and fixes the collapsed aVa launcher wordmark contrast so approvers can review the approval brief and decision controls more comfortably in the first viewport.

## Layer Impact

Layer 4 — Products; release lane `global-control-lane`: Source approval UI and shared aVa dock launcher presentation only. No source data, canonical model, workflow state, routing, approval API, or tenant data is changed.

## Client Applicability

- All clients: Source approval pages using the shared approval card receive the visual polish.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`
- `src/components/agent/__tests__/AgentDock.test.tsx`
- `src/components/source/approval/EventApprovalCard.tsx`
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx`

## QA / Validation

- `./node_modules/.bin/eslint src/components/source/approval/EventApprovalCard.tsx src/components/source/approval/__tests__/EventApprovalCard.test.tsx src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/agent-answer/AvaAskMark.tsx src/components/agent-answer/__tests__/AvaAskMark.assets.test.ts` — passed.
- `./node_modules/.bin/jest --runTestsByPath src/components/source/approval/__tests__/EventApprovalCard.test.tsx --runInBand` — passed, 9 tests. Jest emitted existing duplicate manual mock warnings unrelated to this change.
- `./node_modules/.bin/jest --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx --runInBand -t "uses the light aVa wordmark"` — passed, 1 focused test with unrelated tests skipped.
- `./node_modules/.bin/jest --runTestsByPath src/components/source/approval/__tests__/EventApprovalCard.test.tsx src/components/agent-answer/__tests__/AvaAskMark.assets.test.ts --runInBand` — passed, 10 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed. The check rewrites generated legacy-purge reports during execution; generated report churn was restored before staging.

## Rollout Plan

Merge to `main`; the approved Azure Container Apps deploy workflow builds and deploys the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify through the standard deployment workflow output before marking live-proven.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Source approval page visual proof after deploy.

## Rollback Plan

Revert this UI-only commit or roll back to the previous approved web image. No data rollback is required.

## Audit Evidence

- PR URL and merge commit.
- Focused lint and Jest output.
- Post-deploy signed-in Source approval page screenshot or browser proof.

## Known Gaps

This release does not redesign the approval workflow, evidence model, optimization intelligence, or aVa answer quality. It is a focused visual polish for the approval page hierarchy, spacing, and collapsed launcher contrast. The full existing AgentDock test file still contains unrelated legacy assertion failures outside the collapsed-launcher regression covered here.
