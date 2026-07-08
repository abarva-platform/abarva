# 2026-07-08-strategy-moves-phase-table-fallback — Deterministic Moves Phase Table Fallback

## Release ID

2026-07-08-strategy-moves-phase-table-fallback

## Plain-English Summary

This release adds a deterministic post-model guard for Intelligence execution-mode answers. Live deployed proof showed that prompt-only enforcement was not enough: the model correctly framed Intelligence, Home, Moves, Source, and Tower, but still omitted the literal P0-P5 phase table for an explicit "through Moves for 8 weeks" question. The runtime now appends a compact Moves phase table if the model does not emit one.

## Layer Impact

- `global-control-lane`: Changes final Intelligence answer assembly for `strategy_to_moves_execution` questions.
- `user-facing answer behavior`: Ensures explicit phase-plan asks always include P0 Originate through P5 Prepare to Execute plus Tower Track Outcomes.
- `quality/eval`: Adds regression coverage proving the active synthesis path includes the deterministic phase-table guard.

## Client Applicability

- All clients: Yes, for Intelligence answers that explicitly ask for Moves phase planning.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`: Adds `ensureMovesExecutionPhaseTable` and applies it before model output auditing and final stream reconciliation.
- `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts`: Verifies the fallback is present in the active synthesizer path.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Status

Pass for local focused validation. Live deployed acceptance is pending merge and ACA deployment of this deterministic fallback.

## Known Gaps

- Prompt-only enforcement in `main-5cb8563b` did not satisfy the hard live acceptance gate; the final answer still omitted P0-P5/Tower labels.
- This PR adds deterministic final-output enforcement. Acceptance requires a deployed live prompt showing all required labels in the final answer.

## Rollout Plan

Merge to `main` through PR review. The repo-owned ACA main deploy workflow builds and deploys the new image to the shared lab runtime. After deploy, rerun the live Lakeshore prompt: "If I run the supply-chain AI top bets through Moves for 8 weeks, what would the plan look like by phases?" Confirm the final answer includes a Markdown phase table with P0 Originate, P1 Charter, P2 Understand Current State, P3 Choose the Approach, P4 Build the Plan, P5 Prepare to Execute, and Tower Track Outcomes.

## Deployment Authority

Deployment must use the repo-owned ACA main deploy workflow. Do not deploy this branch ad hoc.

## Rollback Plan

Revert the merge commit and redeploy through the ACA main deploy workflow. The fallback behavior returns to prompt-only phase-table enforcement.

## Audit Evidence

- Live deployed proof from `main-5cb8563b` returned HTTP 200, named all five AbarVa surfaces, and avoided Claude deflection/internal terms/artifact overclaiming.
- The same live proof failed phase-table acceptance because none of the required literal phase labels appeared in the final answer.
