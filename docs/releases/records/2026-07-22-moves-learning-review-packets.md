# 2026-07-22-moves-learning-review-packets — Moves Learning Review Packets

## Release ID

`2026-07-22-moves-learning-review-packets`

## Status

`candidate`

## Plain-English Summary

Adds a steward-facing review packet for each persisted Moves learning candidate in the Admin Context Approval Queue. The packet explains why the candidate exists, what lineage a steward should inspect, what blocks active use, and what the safe next step is. This improves the learning loop without promoting any Move-derived row into agent-ready enterprise context.

## Layer Impact

- `internal-admin`: Improves the Context Approval Queue with deterministic review guidance.
- `client-data-lane`: Reads tenant-scoped Moves learning candidates and readiness sidecars. No write, promotion, indexing, or active-context consumption is added.

## Client Applicability

- All clients with persisted Moves learning rows.
- Browser proof target: First Capital / FS Demo, because it currently has 11 persisted Moves learning candidates from the synthetic end-to-end Move proof.
- Feature flag: None.

## Changes Included

- `src/lib/programs/learning-writeback/review-queue.ts`: Adds `buildMovesLearningReviewPacket`, a deterministic packet builder that classifies safe review actions and blockers without mutating readiness.
- `src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts`: Adds regression coverage for reviewable rows staying held for stewardship and active-looking rows being flagged for investigation.
- `src/app/(maestro)/admin/context-layer/approval-queue/page.tsx`: Renders steward review packets inline for each Moves learning candidate.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand`.
- Pass: `npx eslint src/lib/programs/learning-writeback src/app/'(maestro)'/admin/context-layer/approval-queue/page.tsx`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Blocked: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` is blocked by pre-existing Home graph optional dependency resolution errors for `@xyflow/react` and `@dagrejs/dagre`, outside the Moves learning-review files.
- Pending: GitHub PR checks.
- Pending: ACA deploy and signed-in browser proof.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned ACA main workflow, verify ACA runtime invariant, then open `/admin/context-layer/approval-queue` in a signed-in First Capital / FS Demo session. The page should still show 11 Moves learning candidates and now show the steward review packet for at least one row with inspect items, blockers, and safe next-step copy.

## Deployment Authority

- Repo-owned deploy workflow: Required, because this changes a runtime Admin page.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by ACA deploy after merge.
- ACA runtime invariant: Required before claiming deployed.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No data rollback is needed because this release is read-only.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- ACA digest: Pending.
- Runtime invariant proof: Pending.
- Signed-in browser proof: Pending.

## Known Gaps

- No stewardship approval/write action is added.
- No Azure AI Search indexing is added.
- No `agent_ready` promotion is added.
- No default Home/Intelligence/Moves/Tower agent consumption path is added.
- No automatic phase-gate writeback trigger is added.
