# 2026-06-21-scb-live-eval-clinical-retirement-cue — SCB Live Eval Clinical Next-Move Cue

## Release ID

`2026-06-21-scb-live-eval-clinical-retirement-cue`

## Status

`candidate`

## Plain-English Summary

This release tightens the live Ava evaluation harness so it recognizes a concrete clinical next move phrased as "first retirement or restructure candidates." The live answer was already grounded and quality-passing; the deterministic checker was too narrow for this valid wording.

## Layer Impact

- **experimental lane:** Updates the SCB live-answer eval checker and its regression tests. It does not change customer data, schema, retrieval, model prompts, or surface rendering.

## Client Applicability

- All clients: No direct user-facing behavior change.
- Specific clients: Meridian live eval proof is the immediate validation target.
- Internal only: Affects AbarVa eval/quality gates.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/answer/evals/live-answer/check.ts`
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts` passed: 14/14.
- `npm run release:check` is required before PR.
- Post-merge validation target: rerun `SCB live answer eval` against `https://app.abarva.ai` with `persona=agent-meridian`, `limit=20`, `require_model_judge=false`.

## Rollout Plan

Merge to `main`, allow the repo-owned ACA deploy workflow to publish the updated image, then rerun the live answer eval. No manual data, DNS, or migration step is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA image rollout after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Template image and 100% traffic revision image must match after deploy.
- Worker image invariant: Not materially affected by this eval-harness-only change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun W5.1 live-answer eval for Meridian.

## Rollback Plan

Revert this release's commit or roll back to the prior ACA revision. Because this only changes eval cue recognition, rollback has no data constraints.

## Audit Evidence

- Focused Jest output for the live-answer bank regression suite.
- Release gate output.
- PR URL and deploy run after merge.
- Live eval artifact after post-deploy rerun.

## Known Gaps

Chart emission remains at zero in current live eval artifacts; that is separate from this deterministic cue fix.
