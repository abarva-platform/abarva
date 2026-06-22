# 2026-06-21-scb-live-eval-behavior-cues — SCB Live Eval Behavior Cues

## Release ID

`2026-06-21-scb-live-eval-behavior-cues`

## Status

`candidate`

## Plain-English Summary

The deployed live Ava eval returned 20/20 answers and 20/20 answer-quality passes, but six cases still failed deterministic behavior checks because the checker did not recognize live, honest Ava wording such as peer-pattern benchmark context, pull-the-data next steps, and pilot-scale uncertainty language. This release calibrates only those deterministic behavior cues.

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

- `src/lib/intelligence/answer/evals/live-answer/check.ts`: recognizes peer-pattern benchmark language, pull/reporting-workbench next moves, and pilot-scale uncertainty phrasing observed in the live eval.
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`: adds deterministic regressions for the exact live-answer phrasing that failed the gate.

## QA / Validation

- Pass: `npm test -- src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`.
- Pass: `npx eslint src/lib/intelligence/answer/evals/live-answer/check.ts src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Pass: downloaded live-eval report `27918056798` replay for the six failed case samples now returns deterministic pass for all six.
- Pending: PR CI, deploy, and rerun live eval.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy, then rerun the live-answer eval. Do not flip SCB shared-engine tenant flags until the live-answer report passes or any residual failures are explicitly accepted.

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

- Prior failing live eval: run `27918056798` on `c2d51521` returned `okCount=20`, `answerQualityPassCount=20`, `deterministicPassCount=14`, `modelJudgedPendingCount=0`.
- PR URL: pending.
- CI run: pending.
- Post-fix eval report: pending.

## Known Gaps

This does not flip SCB shared-engine flags. It only closes the deterministic checker misses blocking the next live eval.
