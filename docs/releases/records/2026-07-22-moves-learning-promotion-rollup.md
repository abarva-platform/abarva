# 2026-07-22-moves-learning-promotion-rollup — Moves Learning Promotion Rollup

## Release ID

`2026-07-22-moves-learning-promotion-rollup`

## Status

`candidate`

## Plain-English Summary

Adds a read-only promotion dry-run rollup above the Moves learning candidates in the Admin Context Approval Queue. The rollup explains, at a steward/executive level, whether Move-derived learning is ready to become active enterprise context and which checks block promotion across the candidate set.

This does not promote any candidate, index anything in Azure AI Search, mark anything `agent_ready`, or make Moves learning available to Home, Intelligence, Moves, Source, Tower, or aVa by default.

## Layer Impact

- `internal-admin`: Adds a deterministic rollup to the Context Approval Queue for steward review.
- `client-data-lane`: Reads tenant-scoped Moves learning candidates and readiness metadata. No tenant data writes, no candidate promotion, no indexing, and no active-context consumption path.

## Client Applicability

- All clients: Yes, when they have persisted Moves learning candidates.
- Specific clients: Browser proof target should be First Capital / FS Demo because it currently has visible Moves learning candidates.
- Internal only: Yes, Admin stewardship surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/learning-writeback/review-queue.ts`: Adds `buildMovesLearningPromotionRollup`, a pure, non-mutating rollup across source lineage, context policy, Azure retrieval indexing, citation proof, and steward decision checks.
- `src/app/(maestro)/admin/context-layer/approval-queue/page.tsx`: Renders a Promotion dry-run rollup above individual Moves learning candidate cards.
- `src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts`: Adds regression coverage for blocked rollups and active-looking candidates that must be investigated.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand`.
- Pass: `npx eslint src/lib/programs/learning-writeback src/app/'(maestro)'/admin/context-layer/approval-queue/page.tsx`.
- Pending: `npm run release:check`.
- Pending: `git diff --check`.
- Pending: GitHub PR checks.
- Pending: ACA deploy and signed-in browser proof.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned ACA main workflow, verify ACA runtime invariant, then open `/admin/context-layer/approval-queue` in a signed-in First Capital / FS Demo session. The page should show the existing Moves learning queue with a new Promotion dry-run rollup above the individual steward review packets.

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
- No default module or agent consumption path is added.
- No retrieval or cite-render proof execution is added; the rollup only summarizes readiness blockers.
