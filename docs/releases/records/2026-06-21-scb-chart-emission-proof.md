# 2026-06-21-scb-chart-emission-proof — SCB Chart Intent and Eval Coverage

## Release ID

`2026-06-21-scb-chart-emission-proof`

## Status

`candidate`

## Plain-English Summary

This release closes the remaining renderer-activation gap for chart output. Ava already had a chart renderer and structured exhibit builder, but explicit user language like "show me a chart" was still routed as a table-shaped ask, and the live-answer bank did not require any chart-shaped case. This change teaches the deterministic router to recognize explicit chart language and adds a live eval case that requires chart output.

## Layer Impact

- `global-control-lane`: updates shared answer routing and eval coverage used by all clients once the shared SCB engine is enabled.
- `experimental`: SCB answer rendering remains feature-flagged by tenant and surface through the existing `scb_shared_engine_*` flags.

## Client Applicability

- All clients: routing/eval behavior is shared code.
- Specific clients: live rollout remains limited by existing tenant flag values.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing `scb_shared_engine_{home,intelligence,tower,source,moves}` flags control exposure.

## Changes Included

- `src/lib/intelligence/answer/router.ts`: explicit chart/visualize/plot language now infers `outputShape: "chart"`.
- `evals/intelligence/live-answer/cases/healthcare-airline.ts`: one early live-answer case now requires `output_shape_chart`.
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts`: proves the bank includes a chart-shaped case and the router classifies it as chart intent.

## QA / Validation

- `git diff --check`: pass.
- Focused Jest tests for the live-answer bank and structured exhibits: pass (`18/18`).
- `npm run release:check`: pass.
- Post-deploy proof: not run; rerun the W5.1 live-answer eval after deployment and confirm `charts > 0`.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy workflow publish the new image, then rerun the live-answer eval against the flagged pilot tenant. No migration or manual data load is required.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime activation.
- Shared runtime mutators: none introduced.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: existing deploy-authority checks apply.
- Worker image invariant: not affected.
- Feature/env flag update path: no new flag; existing SCB flags remain the exposure boundary.
- Live signed-in proof required: yes, W5.1 eval should show at least one chart-emitting case.

## Rollback Plan

Revert this PR. The renderer remains available, but explicit chart requests return to prior routing behavior and the chart-required eval case is removed.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Live eval report: pending after deployment.

## Known Gaps

This PR proves the routing/eval obligation for chart output. The post-deploy live eval is still required before claiming browser/runtime chart proof.
