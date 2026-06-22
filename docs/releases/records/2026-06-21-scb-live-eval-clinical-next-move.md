# 2026-06-21-scb-live-eval-clinical-next-move — Ava Live Eval Clinical Next-Move Cue

## Release ID

`2026-06-21-scb-live-eval-clinical-next-move`

## Status

`candidate`

## Plain-English Summary

The deployed SCB live eval on `b38e5592` returned 20/20 live Ava answers, 20/20 answer-quality passes, 0 model-judge pending cases, and 19/20 deterministic passes. The sole remaining miss was a valid clinical answer that directed the user to pull Epic BPA analytics and in-basket activity from the reporting environment, but the deterministic checker did not recognize that as a concrete next move. This release adds that cue and a regression from the live artifact.

## Layer Impact

- `global-control-lane`: updates the internal SCB live-answer eval checker only.
- `experimental`: supports the Shared Context Brain live-answer gate before tenant flag flips.

## Client Applicability

- All clients: no tenant-facing behavior changes.
- Specific clients: none.
- Internal only: live-answer eval behavior checks are internal.
- Public/demo only: no.
- Feature flag: no flags are changed by this release.

## Changes Included

- `src/lib/intelligence/answer/evals/live-answer/check.ts`: recognizes clinical reporting-source next-move language.
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`: adds a regression from live eval run `27920841428`.

## QA / Validation

- Pass: replayed the failing `hc-clinical-3` case from live eval run `27920841428`; it now passes deterministic behavior checks.
- Pass: `npm test -- src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`.
- Pass: `npx eslint src/lib/intelligence/answer/evals/live-answer/check.ts src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy, then rerun the SCB live-answer eval. Do not flip SCB shared-engine tenant flags until the live-answer report passes or any residual failures are explicitly accepted.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: no feature/env flag update in this release.
- Live signed-in proof required: yes, rerun the signed-in live-answer eval.

## Rollback Plan

Revert this PR or restore the prior live-answer checker. Because this is eval-only code, rollback does not require data migration or tenant flag changes.

## Audit Evidence

- PR: pending.
- CI: pending.
- Prior live eval evidence: run `27920841428`, 20/20 live answers, 20/20 answer-quality passes, 19/20 deterministic passes.
- Local replay evidence: `hc-clinical-3` from run `27920841428` passes after the cue update.

## Known Gaps

This does not flip SCB shared-engine tenant flags. It clears the last known deterministic false negative before the next live eval run.
