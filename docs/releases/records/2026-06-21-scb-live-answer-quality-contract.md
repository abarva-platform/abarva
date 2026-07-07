# 2026-06-21-scb-live-answer-quality-contract — Ava Live Answer Quality Contract

## Release ID

`2026-06-21-scb-live-answer-quality-contract`

## Status

`candidate`

## Plain-English Summary

The first live Ava answer eval ran successfully but failed the stricter answer-quality gate: live answers were returned and cited, but the prose did not consistently attach source cues to numbers, ask for missing tenant evidence, or shape comparison answers for renderer tables. This release tightens the Intelligence synthesizer prompt so live answers satisfy the audit contract and expands the eval report with the exact answer-quality violations.

## Layer Impact

- `global-control-lane`: changes the shared Intelligence answer prompt and the live-answer eval runner report shape.
- `experimental`: supports the Shared Context Brain pilot gates before tenant flag rollout.

## Client Applicability

- All clients: Intelligence answers receive the stricter answer-quality instruction after deploy.
- Specific clients: none.
- Internal only: the eval diagnostics are internal.
- Public/demo only: none.
- Feature flag: no new flag; this improves the existing Intelligence answer path before SCB flag flips.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`: adds the live answer quality contract to Ava's system prompt.
- `src/scripts/intelligence/scb-live-answer-eval-runner.ts`: includes answer-quality overall score and violations per case.
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`: proves table-shaped answers can render an evidence table from cited sources even without extractable figures.

## QA / Validation

- Pass: `npm test -- src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`.
- Pass: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/scripts/intelligence/scb-live-answer-eval-runner.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pending after deploy: rerun `SCB live answer eval` for `agent-meridian` against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy publish the image, then rerun the live-answer eval workflow for the Meridian agent persona. Do not flip SCB shared-engine tenant flags until the live-answer report passes or the remaining failures are explicitly accepted as non-blocking.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none outside repo-owned deploy.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: template image, traffic revision image, and active revision image must match.
- Worker image invariant: delivery worker jobs must remain on the deployed digest.
- Feature/env flag update path: not changed by this release.
- Live signed-in proof required: yes, rerun the signed-in live-answer eval and the signed-in Intelligence ask proof.

## Rollback Plan

Revert the PR and redeploy the previous approved `main` digest. No migration or data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Prior failing live eval evidence: `SCB live answer eval` run `27915779333` returned 20/20 live answers but 0/20 answer-quality passes.
- Post-fix eval report: pending.

## Known Gaps

This does not flip SCB shared-engine flags. It addresses the live-answer quality blocker that must be cleared before the flip.
