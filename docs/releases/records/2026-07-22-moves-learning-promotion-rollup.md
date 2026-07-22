# 2026-07-22-moves-learning-promotion-rollup — Moves Learning Promotion Rollup

## Release ID

`2026-07-22-moves-learning-promotion-rollup`

## Status

`deployed and live-proven`

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
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Pass: GitHub PR checks for PR #5374.
- Pass: ACA deploy run `29956191951`.
- Pass: ACA runtime invariant proof in `proof/108-moves-learning-promotion-rollup-runtime`.
- Pass: Signed-in browser proof in `proof/109-moves-learning-promotion-rollup-browser`.

## Rollout Plan

Completed. Merged through PR #5374 to `main`, deployed through the repo-owned ACA main workflow, verified ACA runtime invariant, then opened `/admin/context-layer/approval-queue` in a signed-in FS Demo session. The page shows the existing Moves learning queue with a new Promotion dry-run rollup above the individual steward review packets.

## Deployment Authority

- Repo-owned deploy workflow: Required because this changes an Admin runtime page.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: `sha256:e7dcfd30c0df02534aaecaac5258bf0f7fc981feb499ae02f205cda511555923`.
- ACA runtime invariant: Passed.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Passed.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No data rollback is required because this release is read-only.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5374
- Merge SHA: `b31efc137ca12db35dedd2e51fea21711f578a8c`
- ACA deploy run: `29956191951`
- ACA revision: `ca-abarva-web-lab-eastus--mb31efc13`
- ACA digest: `sha256:e7dcfd30c0df02534aaecaac5258bf0f7fc981feb499ae02f205cda511555923`
- Runtime invariant proof: `proof/108-moves-learning-promotion-rollup-runtime`
- Signed-in browser proof: `proof/109-moves-learning-promotion-rollup-browser`

## Known Gaps

- No stewardship approval/write action is added.
- No Azure AI Search indexing is added.
- No `agent_ready` promotion is added.
- No default module or agent consumption path is added.
- No retrieval or cite-render proof execution is added; the rollup only summarizes readiness blockers.
