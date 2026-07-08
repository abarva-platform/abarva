# 2026-07-08-strategy-moves-phase-table-enforcement — Moves Phase Table Enforcement

## Release ID

2026-07-08-strategy-moves-phase-table-enforcement

## Plain-English Summary

This release tightens the Intelligence execution-mode prompt after live deployed proof showed the broader AbarVa solution framing worked, but an explicit "through Moves for 8 weeks" question only named P0 and P5 instead of spelling out every phase. aVa must now include a compact Moves phase table with one literal row for P0 through P5 plus Tower Track Outcomes whenever the user asks for a phase plan.

## Layer Impact

- `global-control-lane`: Changes Intelligence answer behavior for execution/phase-plan questions across all tenants.
- `user-facing answer behavior`: Forces the explicit phase-table shape for `strategy_to_moves_execution`.
- `quality/eval`: Adds a regression assertion that the live synthesizer path carries the phase-table instruction.

## Client Applicability

- All clients: Yes, for Intelligence answers that explicitly ask for Moves phase planning.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`: Adds the literal phase-table requirement to the strategy-to-Moves execution contract.
- `src/lib/intelligence/ask/synthesizer.ts`: Injects the compact phase-table directive into the active synthesis prompt.
- `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts`: Verifies the active synthesis path includes the phase-table instruction.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Status

Pass for local focused validation. Live deployed acceptance is pending merge and ACA deployment of this follow-up.

## Known Gaps

- The prior deployed revision `main-1a202e4c` proved the broad AbarVa solution mode but did not consistently emit every Moves phase label for explicit phase-plan asks.
- This PR fixes the prompt contract. Final acceptance still requires a deployed live prompt showing P0, P1, P2, P3, P4, P5, and Tower Track Outcomes in the final answer.

## Rollout Plan

Merge to `main` through PR review. The repo-owned ACA main deploy workflow builds and deploys the new image to the shared lab runtime. After deploy, rerun the live Lakeshore prompt: "If I run the supply-chain AI top bets through Moves for 8 weeks, what would the plan look like by phases?" Confirm the final answer includes literal rows for P0 Originate, P1 Charter, P2 Understand Current State, P3 Choose the Approach, P4 Build the Plan, P5 Prepare to Execute, and Tower Track Outcomes.

## Deployment Authority

Deployment must use the repo-owned ACA main deploy workflow. Do not deploy this branch ad hoc.

## Rollback Plan

Revert the merge commit and redeploy through the ACA main deploy workflow. The fallback behavior is the broader AbarVa solution answer mode without hard phase-table enforcement.

## Audit Evidence

- Live deployed proof from `main-1a202e4c` showed the broad AbarVa solution prompt returned 200 and named Intelligence, Home, Moves, Source, and Tower.
- The explicit Moves phase-plan prompt returned 200 but only included P0/P5 labels, so this follow-up is required before claiming the execution phase-plan branch is fully live-proven.
