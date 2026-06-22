# 2026-06-21-scb-live-eval-final-hardening — Chart and Next-Move Eval Hardening

## Release ID

`2026-06-21-scb-live-eval-final-hardening`

## Status

`candidate`

## Plain-English Summary

The live eval still had three deterministic misses after chart rendering and quality scoring were mostly fixed. This release adds a percent-based chart fallback for chart-shaped answers and recognizes concrete reporting pulls / diagnostic wording as next-move language when the answer names work an operating team can run now.

## Layer Impact

- `global-control-lane`: updates shared AgentAnswer exhibit construction and SCB eval behavior checking.
- `experimental`: supports proof for the feature-flagged SCB shared engine; no new default exposure.

## Client Applicability

- All clients: chart-shaped answers can render rate/percentage charts when cited evidence has no usable currency series.
- Specific clients: current proof target is Meridian via `agent-meridian`.
- Internal only: partially; behavior checker changes are eval-only, chart fallback affects structured exhibit emission.
- Public/demo only: no.
- Feature flag: no new flag; applies where `AgentAnswer` structured exhibits are emitted.

## Changes Included

- `buildStructuredExhibits` now emits a `bar` chart from percentage figures when a currency cost-stack is not possible.
- Live-answer behavior checker recognizes `can run right now`, `next move`, and `what's actually useful` next-move wording.
- Regression tests cover percent-chart fallback and deployed live-eval next-move language.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`: pass.
- `npm run release:check`: pass.
- `git diff --check`: pass.
- Post-deploy proof: not run; rerun the SCB live-answer eval and confirm chart and deterministic counts.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then rerun the SCB live-answer eval workflow against the pilot persona.

## Deployment Authority

- Repo-owned deploy workflow: required before production uses the renderer/eval change.
- Shared runtime mutators: none introduced.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: existing deploy-authority checks apply.
- Worker image invariant: not affected.
- Feature/env flag update path: no flag change.
- Live signed-in proof required: yes, the follow-up live eval report is the proof.

## Rollback Plan

Revert this PR. Chart extraction returns to currency-only chart generation and the behavior checker returns to the narrower cue set; no schema or data migration is involved.

## Audit Evidence

- PR URL: not run.
- CI run: not run.
- Live eval run: not run after deployment.

## Known Gaps

This should close the last observed deterministic misses, but proof remains the deployed live eval artifact.
