# 2026-06-21-scb-live-eval-navigation-hardening — Live Eval Browser Stability

## Release ID

`2026-06-21-scb-live-eval-navigation-hardening`

## Status

`candidate`

## Plain-English Summary

The SCB live-answer eval could fail before producing a report when the authenticated Playwright page navigated during an ask. That hid the real state of the live answer layer because no artifact was uploaded. This release hardens the runner so it starts from the Intelligence ask page and records navigation failures as case-level failures instead of crashing the whole run.

## Layer Impact

- `global-control-lane`: updates the shared live-answer eval harness only.
- `experimental`: supports proof for the feature-flagged SCB shared engine; no user-facing runtime behavior changes.

## Client Applicability

- All clients: the harness can evaluate any persona/client.
- Specific clients: current proof target is Meridian via `agent-meridian`.
- Internal only: yes, this is an internal eval/proof runner.
- Public/demo only: no.
- Feature flag: no new flag; evaluates existing `scb_shared_engine_*` exposure.

## Changes Included

- `src/scripts/intelligence/scb-live-answer-eval-runner.ts`: navigate to `/intelligence/ask` before cases and convert Playwright navigation/context-loss errors into structured failed observations.

## QA / Validation

- `npx eslint src/scripts/intelligence/scb-live-answer-eval-runner.ts`: pass.
- `git diff --check`: pass.
- `npm run release:check`: pending after this release-record wording update.
- Post-deploy proof: not run; rerun the SCB live-answer eval and confirm it uploads a report. Chart proof still requires `charts > 0`.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then rerun the SCB live-answer eval workflow.

## Deployment Authority

- Repo-owned deploy workflow: required before the hosted workflow uses the patched script from `main`.
- Shared runtime mutators: none introduced.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: existing deploy-authority checks apply.
- Worker image invariant: not affected.
- Feature/env flag update path: no flag change.
- Live signed-in proof required: yes, the follow-up live eval run is the proof.

## Rollback Plan

Revert this PR. The live eval runner returns to previous crash-on-navigation behavior; runtime product behavior is unchanged.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Live eval run: pending after deployment.

## Known Gaps

This hardens the eval harness only. It does not by itself prove chart output; that still requires the post-deploy live eval report.
