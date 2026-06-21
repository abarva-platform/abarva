# 2026-06-21-scb-live-answer-quality-normalizer — Ava Live Answer Quality Normalizer

## Release ID

`2026-06-21-scb-live-answer-quality-normalizer`

## Status

`candidate`

## Plain-English Summary

The post-prompt live-answer eval still returned 20/20 live Ava answers but failed the answer-quality gate. The richer report showed the remaining blockers were deterministic: long paragraphs, healthcare CXO acronyms counted as unexplained, missing explicit next-move language, and no table event when the user requested a table but connected evidence lacked the requested rows. This release adds deterministic server-side cleanup and a truthful evidence-required table fallback.

## Layer Impact

- `global-control-lane`: improves Intelligence answer post-processing and answer-quality scoring.
- `experimental`: strengthens the Shared Context Brain live-answer gate before tenant flag flips.

## Client Applicability

- All clients: Intelligence answers may receive paragraph cleanup and a non-fabricating next-move sentence when missing.
- Specific clients: none.
- Internal only: answer-quality acronym scoring is used by eval gates.
- Public/demo only: none.
- Feature flag: no new flag; this supports existing SCB readiness gates.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`: adds deterministic decision-grade answer cleanup.
- `src/lib/intelligence/ask/synthesizer.ts`: applies the cleanup before streaming chunks.
- `src/lib/eval/answer-quality/rubric.ts`: recognizes healthcare CXO acronyms used in the live eval bank.
- `src/lib/intelligence/answer/structured-exhibits.ts`: emits an evidence-required table for table-shaped asks when data is insufficient.
- Focused tests for response-policy and structured exhibits.

## QA / Validation

- Pass: `npm test -- src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`.
- Pass: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/synthesizer.ts src/lib/eval/answer-quality/rubric.ts src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pending after deploy: rerun `SCB live answer eval` for `agent-meridian` against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy, then rerun the live-answer eval. Do not flip SCB shared-engine tenant flags until the live-answer report passes or remaining failures are explicitly accepted.

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

- PR URL: pending.
- CI run: pending.
- Prior failing live eval evidence: run `27916563601` returned 20/20 live answers but 0/20 answer-quality passes, with concrete violations.
- Post-fix eval report: pending.

## Known Gaps

This does not flip SCB shared-engine flags. It removes deterministic answer-quality blockers first.
