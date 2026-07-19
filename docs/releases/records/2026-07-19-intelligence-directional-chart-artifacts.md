# 2026-07-19-intelligence-directional-chart-artifacts — Intelligence Directional Chart Artifacts

## Release ID

`2026-07-19-intelligence-directional-chart-artifacts`

## Status

`candidate`

## Plain-English Summary

This follow-up fixes a live Intelligence chart-quality gap found after PR #5058 deployed. The renderer was deployed and tables were clean, but a chart-heavy FS Demo question still produced a conservative “Requested Visual Boundary” table instead of a visual chart. The preferred behavior is prompt-first: Claude must emit a compact chart-ready GFM table for value/complexity, readiness/value, 2x2, quadrant, or priority-matrix asks; AbarVa then validates and renders that table as a typed Recharts artifact.

Post-PR #5061 live proof showed the prompt still allowed Claude to substitute a generated executive-summary table for the requested chart payload. This follow-up makes the prompt contract explicit: for chart/matrix asks, the first visible table must be the chart payload table with Item/Use case, Value/Business value, Complexity/Readiness, and Basis columns.

Post-PR #5062 live proof showed the remaining gap was classifier routing: “rank five AI investment use cases by business value and implementation complexity” did not enter the governed decision-table repair lane because the classifier only recognized `vs`/`versus` comparisons. This follow-up classifies top-N counted use-case/bet/investment rankings as governed decision-table requests so the existing score-bearing decision-table artifact can produce Recharts 2x2 and bar charts.

## Layer Impact

- `global-control-lane` — Intelligence prompt contract: strengthens the chart/table instruction so Claude emits chart-ready GFM rows for value/complexity, readiness/value, 2x2, quadrant, or priority matrix asks, and does not substitute a Theme / Executive read / Decision use table for the chart payload.
- `global-control-lane` — Intelligence ranked-decision routing: top-N AI use-case, bet, investment, initiative, opportunity, option, or item rankings by value/complexity/readiness now route through the governed decision-table contract even without `vs` phrasing.
- `global-control-lane` — Intelligence answer assembly: preserves the existing GFM-table-to-typed-chart path and validates it for qualitative high/medium/low value/complexity tables.
- `global-control-lane` — Agent answer rendering: no renderer contract change; this release feeds the existing Recharts path from Claude-emitted tables rather than guessing chart labels from prose.

## Client Applicability

- All clients: yes, for Intelligence/aVa chart-heavy questions.
- Specific clients: the live failure was observed on FS Demo.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts`
- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/ask/response-policy.test.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/intelligence/ask/__tests__/decision-table-gate.test.ts`
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand`
- PASS: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- PASS: `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`
- PASS: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts`
- Pending follow-up: rerun classifier-specific tests after ranked-decision routing update.

## Rollout Plan

Open a PR from this branch, squash-merge to `main`, and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: pending deploy
- ACA runtime invariant: pending deploy
- Worker image invariant: pending deploy
- Feature/env flag update path: none
- Live signed-in proof required: yes, FS Demo Intelligence chart prompt must show Recharts chart artifacts without raw chart JSON or markdown table leaks.

## Rollback Plan

Revert the squash merge and redeploy `main` through the ACA main deploy workflow. No migration rollback is required.

## Audit Evidence

- Local focused test output listed above.
- Live pre-fix evidence: `/tmp/intelligence-live-chart-proof-20260719/result.json` and screenshots show clean tables but no Recharts chart before this follow-up.
- Post-PR #5061 live evidence: `/tmp/intelligence-live-chart-proof-20260719-post5061/result.json` and `/tmp/intelligence-live-chart-proof-20260719-post5061/03-answer.png` show clean tables and exports but still no Recharts chart because Claude did not emit the required value/complexity chart payload table.
- Post-PR #5062 live evidence: `/tmp/intelligence-live-chart-proof-20260719-post5062/result.json` and `/tmp/intelligence-live-chart-proof-20260719-post5062/03-answer.png` show clean tables and exports but still no Recharts chart because the top-N ranked use-case query did not route to the score-bearing decision-table contract.

## Known Gaps

Live production acceptance is pending deploy and signed-in proof.
