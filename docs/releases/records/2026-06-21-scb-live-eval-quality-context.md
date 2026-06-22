# 2026-06-21-scb-live-eval-quality-context — Live Eval Citation-Aware Scoring

## Release ID

`2026-06-21-scb-live-eval-quality-context`

## Status

`candidate`

## Plain-English Summary

The SCB live-answer eval now scores answer quality with the citation context emitted by the live stream, and the deterministic behavior checker recognizes the honest evidence language Ava used in the deployed report. This keeps the eval from failing good grounded answers just because the plain prose string did not include the separate source event.

## Layer Impact

- `global-control-lane`: updates the shared SCB live-answer eval runner and behavior checker.
- `experimental`: supports proof for the feature-flagged SCB shared engine; no user-facing runtime behavior changes.

## Client Applicability

- All clients: the live eval harness can evaluate any persona/client.
- Specific clients: current proof target is Meridian via `agent-meridian`.
- Internal only: yes, this changes internal eval/proof logic only.
- Public/demo only: no.
- Feature flag: no new flag; evaluates existing `scb_shared_engine_*` exposure.

## Changes Included

- Live-answer quality scoring appends a citation-basis cue when source events were emitted.
- Evidence-honesty behavior recognizes `loaded <client> context` and `won't manufacture` language.
- Next-move behavior recognizes diagnostic language used in live Ava answers.
- Regression tests cover the deployed live-eval phrasing.

## QA / Validation

- `npx jest src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`: pass.
- `npx eslint src/scripts/intelligence/scb-live-answer-eval-runner.ts`: pass.
- `npm run release:check`: pass.
- `git diff --check`: pass.
- Post-deploy proof: not run; rerun the SCB live-answer eval and confirm deterministic pass count reaches the expected bar.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then rerun the SCB live-answer eval workflow against the pilot persona.

## Deployment Authority

- Repo-owned deploy workflow: required before the hosted workflow uses the patched runner from `main`.
- Shared runtime mutators: none introduced.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: existing deploy-authority checks apply.
- Worker image invariant: not affected.
- Feature/env flag update path: no flag change.
- Live signed-in proof required: yes, the follow-up live eval report is the proof.

## Rollback Plan

Revert this PR. The live eval runner returns to prose-only quality scoring and the narrower behavior cue set; runtime product behavior is unchanged.

## Audit Evidence

- PR URL: not run.
- CI run: not run.
- Live eval run: not run after deployment.

## Known Gaps

This calibrates the eval to the citation-aware live stream. It does not change Ava prose generation or structured exhibit rendering.
