# 2026-09-24-moves-terminal-p5-execution-guidance — Moves Terminal P5 Execution Guidance

## Release ID

`2026-09-24-moves-terminal-p5-execution-guidance`

## Status

`candidate`

## Plain-English Summary

When a Move has completed P5 and handed off to Tower, aVa now answers next-step prompts as execution handoff guidance instead of stopping at a gate-readiness scorecard. The answer still uses the live Move evidence and gate state, but it also names the sessions to run, the evidence discipline after handoff, and the metric categories to carry into Tower.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: updates Moves aVa deterministic guidance for terminal P5 handoff pages. No canonical data, tenant data, registry, graph, or projection state changes.

## Client Applicability

- All clients: Moves users with aVa chat enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves aVa hardening path controls whether deterministic packet guidance is used.

## Changes Included

- `src/lib/programs/ava-chat/deterministic-answer.ts`
- `src/lib/programs/ava-chat/__tests__/packet.test.ts`
- `reports/moves-e2e-operating-smoke/20260923T222629Z/00-executive-summary.md`
- `reports/moves-e2e-operating-smoke/20260923T222629Z/02-defects-and-fixes.md`
- `reports/moves-e2e-operating-smoke/20260923T222629Z/04-ava-guidance-review.md`
- `reports/moves-e2e-operating-smoke/20260923T222629Z/07-deploy-and-browser-proof.md`

## QA / Validation

- `npm run test -- --runTestsByPath src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts src/lib/programs/__tests__/moves-chat-answer-packet.test.ts --runInBand` — passed.

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps main deploy workflow will build and deploy the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required before live claim.
- Feature/env flag update path: No change.
- Live signed-in proof required: Yes, retest the P5 aVa guidance prompt on the active smoke-test Move.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR URL: To be filled after PR creation.
- Smoke report: `reports/moves-e2e-operating-smoke/20260923T222629Z/`
- Pre-fix live proof: `reports/moves-e2e-operating-smoke/20260923T222629Z/raw/post8390-live-p5-ava-guidance-text.txt`

## Known Gaps

This does not change artifact generation, approval, evidence storage, or Tower handoff state. It only changes deterministic aVa guidance for already completed terminal P5 handoff pages.
