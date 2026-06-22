# 2026-06-21-scb-chart-from-cited-sources — Chart From Cited Evidence

## Release ID

`2026-06-21-scb-chart-from-cited-sources`

## Status

`candidate`

## Plain-English Summary

Chart-shaped Ava answers can now build chart data from cited source detail as well as from prose. This closes the live proof gap where the model correctly used the supplied denial metrics but the renderer emitted only a table because the chart extractor did not read the cited surface evidence.

## Layer Impact

- `global-control-lane`: updates shared AgentAnswer exhibit construction.
- `experimental`: supports the feature-flagged SCB shared engine and renderer proof; no new default exposure.

## Client Applicability

- All clients: chart-shaped answers across surfaces can use cited source details.
- Specific clients: current proof target is Meridian via `agent-meridian`.
- Internal only: no, this affects shared renderer behavior when SCB structured exhibits are emitted.
- Public/demo only: no.
- Feature flag: no new flag; applies where `AgentAnswer` structured exhibits are already emitted.

## Changes Included

- `buildStructuredExhibits` extracts chart figures from cited source detail for chart-shaped asks.
- Tables remain based on answer prose behavior; the chart path is the only source-detail expansion.
- Regression test covers chart data generated from cited source detail.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand`: pass.
- `npm run release:check`: pass.
- `git diff --check`: pass.
- Post-deploy proof: not run; rerun the SCB live-answer eval and confirm `charts > 0` in the uploaded report.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then rerun the SCB live-answer eval workflow against the pilot persona.

## Deployment Authority

- Repo-owned deploy workflow: required before production uses the renderer change.
- Shared runtime mutators: none introduced.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: existing deploy-authority checks apply.
- Worker image invariant: not affected.
- Feature/env flag update path: no flag change.
- Live signed-in proof required: yes, the follow-up live eval report is the proof.

## Rollback Plan

Revert this PR. Chart extraction returns to answer-prose-only behavior; no schema or data migration is involved.

## Audit Evidence

- PR URL: not run yet.
- CI run: not run yet.
- Live eval run: not run after deployment.

## Known Gaps

This should close the chart-renderer extraction gap, but chart activation remains unproven until the deployed live eval artifact reports `charts > 0`.
