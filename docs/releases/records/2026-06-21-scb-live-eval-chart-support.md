# 2026-06-21-scb-live-eval-chart-support — Live Chart Proof Support

## Release ID

`2026-06-21-scb-live-eval-chart-support`

## Status

`candidate`

## Plain-English Summary

The SCB live-answer eval now carries explicit case-level surface evidence for chart-shaped asks, and the runner retries transient fetch/page failures before recording a case failure. This keeps the product honest: Ava should emit a chart only when supporting facts are present, and the eval should not confuse a brief browser fetch hiccup with a reasoning failure.

## Layer Impact

- `global-control-lane`: updates the shared live-answer eval bank and runner.
- `experimental`: supports proof for the feature-flagged SCB shared engine; no default user-facing behavior changes.

## Client Applicability

- All clients: the harness pattern applies to any persona/client.
- Specific clients: current proof target is Meridian via `agent-meridian`.
- Internal only: yes, this is an internal eval/proof change.
- Public/demo only: no.
- Feature flag: no new flag; evaluates existing `scb_shared_engine_*` exposure.

## Changes Included

- `LiveAnswerCase` now supports optional `surfaceFacts`.
- Chart-shaped live eval cases must carry quantitative surface evidence.
- The healthcare revenue-cycle chart case includes denial-category metrics and leakage exposure as surface evidence.
- The live eval runner passes case surface facts into `/api/intelligence/ask` and retries transient zero-event fetch failures.

## QA / Validation

- `npx jest src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand`: pass.
- `npx eslint src/scripts/intelligence/scb-live-answer-eval-runner.ts`: pass.
- `git diff --check`: pass.
- `npm run release:check`: pass.
- Post-deploy proof: not-run; rerun the SCB live-answer eval and confirm `charts > 0` in the uploaded report.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then rerun the SCB live-answer eval workflow against the pilot persona.

## Deployment Authority

- Repo-owned deploy workflow: required before the hosted workflow uses the patched script from `main`.
- Shared runtime mutators: none introduced.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: existing deploy-authority checks apply.
- Worker image invariant: not affected.
- Feature/env flag update path: no flag change.
- Live signed-in proof required: yes, the follow-up live eval report is the proof.

## Rollback Plan

Revert this PR. The eval bank loses case-level surface facts and the runner returns to single-attempt behavior; runtime product behavior is unchanged.

## Audit Evidence

- PR URL: not-run yet.
- CI run: not-run yet.
- Live eval run: not-run after deployment.

## Known Gaps

This supplies evidence for the chart-shaped live case and reduces runner flake. It does not mark chart activation done until a post-deploy live eval report shows `charts > 0`.
