# 2026-06-21-scb-live-eval-final-cues — SCB Live Eval Final Cues

## Release ID

`2026-06-21-scb-live-eval-final-cues`

## Status

`candidate`

## Plain-English Summary

The deployed SCB live eval on `5be9d135` returned 20/20 live answers, 20/20 answer-quality passes, and 18/20 deterministic passes. The remaining failures were deterministic cue false negatives: one hedge answer used "front-loaded," "predictable," and "most health systems," and one next-move answer used "in order" and "triage." This release adds those final live phrases to the checker.

## Layer Impact

- `global-control-lane`: updates internal SCB live-answer eval behavior checks.
- `experimental`: supports the Shared Context Brain live-answer gate before tenant flag flips.

## Client Applicability

- All clients: no direct runtime behavior change.
- Specific clients: none.
- Internal only: live-answer eval behavior checks are internal.
- Public/demo only: none.
- Feature flag: no new flag.

## Changes Included

- `src/lib/intelligence/answer/evals/live-answer/check.ts`: recognizes final live hedge and next-move phrases.
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`: adds regression coverage for those phrases.

## QA / Validation

- Pass: `npm test -- src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`.
- Pass: `npx eslint src/lib/intelligence/answer/evals/live-answer/check.ts src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`.
- Pass: replayed downloaded live-eval report `27919455116` for the two failed case samples; both now deterministic-pass locally.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pending: release gate, PR CI, deploy, and rerun live eval.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy, then rerun the SCB live-answer eval. Do not flip SCB shared-engine tenant flags until the live-answer report passes or any residual failures are explicitly accepted.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none outside repo-owned deploy.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: template image, traffic revision image, and active revision image must match.
- Worker image invariant: delivery worker jobs must remain on the deployed digest.
- Feature/env flag update path: not changed by this release.
- Live signed-in proof required: yes, rerun the signed-in live-answer eval.

## Rollback Plan

Revert the PR and redeploy the prior approved `main` digest. No migration or data rollback is required.

## Audit Evidence

- Prior failing live eval: run `27919455116` on `5be9d135` returned `okCount=20`, `answerQualityPassCount=20`, `deterministicPassCount=18`, `modelJudgedPendingCount=0`.
- PR URL: pending.
- CI run: pending.
- Post-fix eval report: pending.

## Known Gaps

This does not flip SCB shared-engine flags. It only closes the remaining checker false negatives blocking the live eval gate.
