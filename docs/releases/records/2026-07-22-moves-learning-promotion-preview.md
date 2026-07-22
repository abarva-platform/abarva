# 2026-07-22-moves-learning-promotion-preview — Moves Learning Promotion Preview

## Release ID

`2026-07-22-moves-learning-promotion-preview`

## Status

`candidate`

## Plain-English Summary

Adds a read-only promotion readiness preview to each Moves learning candidate in the Admin Context Approval Queue. The preview explains, in plain English, which governance checks are complete and which checks still block active enterprise-context use. It makes the learning loop easier for stewards to inspect without adding any promotion, indexing, or `agent_ready` write path.

## Layer Impact

- `internal-admin`: Improves the Context Approval Queue with a deterministic review matrix for Move-derived learning candidates.
- `client-data-lane`: Reads tenant-scoped Moves learning readiness states. No data write, promotion, indexing, or runtime agent consumption path is added.

## Client Applicability

- All clients: Yes, when they have persisted Moves learning candidates.
- Specific clients: Browser proof target is First Capital / FS Demo.
- Internal only: Yes, this is an Admin stewardship surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/learning-writeback/review-queue.ts`: Adds `buildMovesLearningPromotionPreview`, a pure, non-mutating readiness preview for source lineage, context policy, Azure retrieval indexing, citation proof, and steward decision state.
- `src/app/(maestro)/admin/context-layer/approval-queue/page.tsx`: Renders the promotion readiness preview under each Moves learning review packet.
- `src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts`: Adds regression coverage for blocked reviewable candidates and active-looking candidates that require investigation.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand`.
- Pass: `npx eslint src/lib/programs/learning-writeback src/app/'(maestro)'/admin/context-layer/approval-queue/page.tsx`.
- Blocked: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` is blocked by pre-existing Home graph optional dependency resolution errors for `@xyflow/react` and `@dagrejs/dagre`, outside the Moves learning-review files.
- Pending: `npm run release:check`.
- Pass: `git diff --check`.
- Pending: GitHub PR checks.
- Pending: ACA deploy and signed-in browser proof.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned ACA main workflow, verify ACA runtime invariant, then open `/admin/context-layer/approval-queue` in a signed-in First Capital / FS Demo session. The Moves learning candidates should show the existing steward review packet plus the new read-only promotion readiness preview.

## Deployment Authority

- Repo-owned deploy workflow: Required because this changes an Admin runtime page.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by ACA deploy after merge.
- ACA runtime invariant: Required before claiming deployed.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No data rollback is required because this release is read-only.

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
- No retrieval or cite-render proof execution is added; the preview only shows that those checks are still required.
