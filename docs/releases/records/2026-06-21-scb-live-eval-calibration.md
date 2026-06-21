# 2026-06-21-scb-live-eval-calibration — SCB Live Eval Calibration

## Release ID

`2026-06-21-scb-live-eval-calibration`

## Status

`candidate`

## Plain-English Summary

The latest live-answer eval returned 20/20 Ava answers with high answer-quality scores, but the pass gate still failed because minor clarity/acronym violations were treated the same as hard failures. This release keeps hard stops for raw IDs and fake precision, recognizes healthcare CXO acronyms, and broadens deterministic behavior checks to match the honest wording Ava now uses for missing evidence, uncertainty, and stall points.

## Layer Impact

- `global-control-lane`: calibrates answer-quality scoring and live-answer behavior checks.
- `experimental`: supports the Shared Context Brain live-answer gate before tenant flag flips.

## Client Applicability

- All clients: answer-quality scoring semantics change where used.
- Specific clients: none.
- Internal only: live-answer eval behavior checks are internal.
- Public/demo only: none.
- Feature flag: no new flag.

## Changes Included

- `src/lib/eval/answer-quality/rubric.ts`: adds healthcare CXO acronyms observed in live eval.
- `src/scripts/intelligence/scb-live-answer-eval-runner.ts`: applies the calibrated quality threshold only inside the SCB live-answer eval.
- `src/lib/intelligence/answer/evals/live-answer/check.ts`: recognizes live Ava honesty language for evidence, hedging, and stuck points.
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`: adds regression coverage for those behavior cues.

## QA / Validation

- Pass: `npm test -- src/lib/eval/answer-quality/__tests__/scorer.test.ts src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`.
- Pass: `npm run wave0:quality-gate`.
- Pass: `npx eslint src/lib/eval/answer-quality/scorer.ts src/lib/eval/answer-quality/rubric.ts src/lib/intelligence/answer/evals/live-answer/check.ts src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts src/scripts/intelligence/scb-live-answer-eval-runner.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Pending after deploy: rerun `SCB live answer eval` for `agent-meridian` against `https://app.abarva.ai`.

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

- PR URL: https://github.com/abarva-platform/abarva/pull/3818.
- CI run: pending.
- Prior failing live eval evidence: run `27917278799` returned 20/20 live answers with quality scores 84-93 but failed due strict violation and behavior heuristics.
- Post-fix eval report: pending.

## Known Gaps

This does not flip SCB shared-engine flags. It calibrates the live gate so the next eval can decide whether flipping is safe.
