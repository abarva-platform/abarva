# 2026-06-17-firstcapital-demo-p0-polish — First Capital Demo P0 Polish

## Release ID

`2026-06-17-firstcapital-demo-p0-polish`

## Status

`candidate`

## Plain-English Summary

This release fixes the most visible AI Control Tower demo contradictions found in the First Capital CIO/CFO audit. Atlas answers now render before the source-review warning, Tower risk summaries count visible kill/contested/watch signals, Spend empty states read as an honest uncommitted-feed gap instead of a broken CFO metric, and initiative tables show more specific outcome metric labels instead of the generic First Capital value-realization placeholder.

## Layer Impact

- `global-control-lane`: Updates shared AgentDock/AgentResponse presentation and the AI Control Tower page for all clients using these surfaces.
- `client-data-lane`: No client data is changed. Existing loaded First Capital rows are only presented more honestly.

## Client Applicability

- All clients: Agent source-review warning order/copy and AI Control Tower presentation logic apply globally.
- Specific clients: First Capital benefits immediately for the Republic Bank demo path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/CitationGapNotice.tsx`
- `src/components/agent/AgentDock.tsx`
- `src/components/agent/AgentResponse.tsx`
- `src/components/tower/AiControlTowerPage.tsx`
- Regression tests for Agent citation-warning order and Tower demo-critical summaries.

## QA / Validation

- `npx jest src/components/agent/__tests__/AgentResponse.test.tsx src/components/agent/__tests__/AgentDock.test.tsx --runInBand` — pass.
- `npx jest src/components/tower/__tests__/AiControlTowerPage.test.tsx --runInBand` — pass.
- `npx eslint src/components/tower/AiControlTowerPage.tsx src/components/tower/__tests__/AiControlTowerPage.test.tsx src/components/agent/CitationGapNotice.tsx src/components/agent/AgentDock.tsx src/components/agent/AgentResponse.tsx src/components/agent/__tests__/AgentResponse.test.tsx src/components/agent/__tests__/AgentDock.test.tsx` — pass.
- `git diff --check` — pass.

## Rollout Plan

Merge to `main`; the Azure Container Apps main deploy builds and shifts traffic to the new revision. No migration or loader run is required.

## Rollback Plan

Revert the merge commit or redeploy the prior ACA revision. No data rollback is required.

## Audit Evidence

- First Capital CIO/CFO audit from June 17, 2026 identifying Atlas warning order, Spend empty state, Risk contradiction, and generic metric labels.
- Focused Jest and ESLint validation listed above.

## Known Gaps

- This release does not commit real spend contracts, KPI evidence rows, decision logs, stakeholder notes, or corpus relationships.
- Tower still honestly shows Spend and Evidence as uncommitted where the data feed is missing.
- Atlas still warns when citations are not attached; the answer now appears before that warning so executives can read the response while still seeing the governance caveat.
