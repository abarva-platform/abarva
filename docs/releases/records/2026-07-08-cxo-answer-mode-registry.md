# 2026-07-08-cxo-answer-mode-registry — CXO Answer Mode Registry

## Release ID

2026-07-08-cxo-answer-mode-registry

## Status

candidate

## Plain-English Summary

This release centralizes CXO-grade Intelligence answer contracts in a small answer-mode registry. The product lesson from the Moves phase-table proof is now encoded directly: Claude can reason and write, but AbarVa owns required executive structure through runtime contracts, validators, typed artifacts, and deterministic fallbacks.

## Layer Impact

- `global-control-lane`: Changes the internal assembly path for Intelligence strategy answers across all tenants.
- `user-facing answer behavior`: Preserves the deterministic P0-P5 Moves phase-table fallback for `strategy_to_moves_execution` asks.
- `quality/eval`: Adds registry-level tests proving critical answer modes and mandatory artifacts are owned in one contract surface.

## Client Applicability

- All clients: Yes, for Intelligence answers classified into CXO solution/execution modes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/answer-mode-registry.ts`: Adds the CXO answer mode registry, required sections, required artifacts, banned phrases, export requirement flags, proof prompts, and deterministic fallback ownership.
- `src/lib/intelligence/ask/synthesizer.ts`: Uses the registry for mode system addenda, prompt directives, and deterministic fallback application.
- `src/lib/intelligence/ask/synthesizer.ts`: Re-applies registry deterministic fallback at the final no-tabs emission boundary after evidence/decision-grade transforms.
- `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts`: Verifies registry ownership and the deterministic Moves phase-table fallback behavior.
- `src/lib/intelligence/ask/response-policy.test.ts`: Adds the exact live proof prompt as a `strategy_to_moves_execution` classifier regression.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Fail: live ACA proof on deployed `main-1358261c` returned HTTP 200 and all five surfaces, but omitted literal P0-P5/Tower labels because a later final-answer transform bypassed the first registry fallback application.
- Not run: live ACA proof for the final-boundary fallback fix. This branch is not deployed yet.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the image. After deploy, rerun the live signed-in Lakeshore prompt used for PR #4597 and confirm the final answer still contains the P0-P5 Moves phase table and Tower Track Outcomes.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared lab runtime.
- Shared runtime mutators: No branch-local Azure mutation.
- Approved image digest: To be produced by ACA main deploy workflow after merge.
- ACA runtime invariant: Required before live acceptance.
- Worker image invariant: Required if worker images are updated by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the merge commit and redeploy through the ACA main deploy workflow. The runtime returns to the previous synthesizer-local fallback implementation.

## Audit Evidence

- PR URL: Pending.
- Local validation: Pending.
- Live proof dependency: PR #4597 already proved the deterministic phase-table fallback on deployed `main-0a1f4252`.

## Known Gaps

- The registry seeds future answer modes such as `industry_trend_to_ai_bets`, `board_ai_governance_plan`, and `strategy_to_tower_value_case` as inactive contracts. Those modes still need classifiers, typed artifact validators, export proof, and live proof prompts before being activated.
- Live acceptance for the final-boundary fallback fix requires merge, ACA deploy, runtime invariant proof, and rerun of the exact Lakeshore Moves phase prompt.
