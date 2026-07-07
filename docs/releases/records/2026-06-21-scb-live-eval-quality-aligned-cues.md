# 2026-06-21-scb-live-eval-quality-aligned-cues — Ava Live Eval Quality-Aligned Cues

## Release ID

`2026-06-21-scb-live-eval-quality-aligned-cues`

## Status

`candidate`

## Plain-English Summary

The deployed SCB live eval now returns 20/20 live Ava answers and 20/20 answer-quality passes, but the deterministic behavior checker still missed valid grounded-answer wording. This release aligns the benchmark behavior check with the stricter no-fake-precision answer-quality scorer and recognizes the deployed "loaded context / not your data / won't fabricate precision" evidence wording.

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

- `src/lib/intelligence/answer/evals/live-answer/check.ts`: aligns `cite_benchmark` with the no-fake-precision scorer and recognizes deployed evidence phrasing.
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`: adds regressions for the deployed failure language.

## QA / Validation

- Pass: replayed the exact three failing cases from live eval run `27920111910`; all now pass deterministic behavior checks.
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
- Prior live eval evidence: run `27920111910`, 20/20 live answers, 20/20 answer-quality passes, 17/20 deterministic passes.
- Local replay evidence: the three deterministic false negatives from run `27920111910` pass with this patch.

## Known Gaps

This does not flip SCB shared-engine tenant flags. It clears the remaining known deterministic checker false negatives before the next live eval run.
