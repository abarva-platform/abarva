# 2026-07-22-source-live-ava-governed-ask — Source Live aVa Governed Ask Path

## Release ID

`2026-07-22-source-live-ava-governed-ask`

## Status

`candidate`

## Plain-English Summary

The live Source shell invokes aVa through the shared `AskAnythingBar`, not the older `AvaBottomBar`. Source-detail asks now route through the governed Source ask endpoint so the response has event/stage context and can render the structured answer parts the Source engine already returns: metrics, tables, bar charts, citations, and next actions.

## Layer Impact

- `global-control-lane`: Updates shared shell chat state/rendering and the Source-detail ask path.
- `client-data-lane`: No schema or data mutation in this release. It reads existing Source context through the existing governed Source endpoint.

## Client Applicability

- All clients: Any signed-in Source user using the current Source shell aVa launcher receives the fix.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/shell/AtlasPageStateProvider.tsx`: Routes Source-detail asks with a `sourceEventId` to `/api/v1/source/:eventId/nexus/ask`, passing the active stage and preserving `agentResponseParts`.
- `src/lib/shell/atlas-page-state.ts`: Adds structured response parts to shared page state and completed agent turns.
- `src/components/agent/AskAnythingBar.tsx`: Renders structured response parts in the invoked bottom aVa panel.
- `src/components/shell/AgentColumn.tsx`: Carries the same structured renderer for shared shell conversations that mount an agent column.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.thread.test.tsx`: Adds regression coverage for the hidden Source aVa launcher, governed Source endpoint routing, and rendered table/bar-chart parts.

## QA / Validation

- Live pre-fix observation against `https://app.abarva.ai/source/events/apex-retail-ams-outsourcing-2026?stage=responses`: the visible Source shell posted to `/api/chat/agent`; the Source-specific `/nexus/ask` endpoint returned structured parts, but the live bottom aVa path did not use them.
- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.thread.test.tsx --runInBand`: passed, with existing duplicate manual mock warnings unrelated to this change.
- `npx eslint src/components/shell/AtlasPageStateProvider.tsx src/lib/shell/atlas-page-state.ts src/components/agent/AskAnythingBar.tsx src/components/shell/AgentColumn.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.thread.test.tsx`: pending.
- `npm run release:check`: pending.
- Live post-deploy proof: pending merge and ACA deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merged commit, then verify the ACA runtime invariant and run signed-in browser proof on `app.abarva.ai` that the Source aVa launcher opens, submits a Source-detail question, calls the governed Source endpoint, and renders structured answer parts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge to `main`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, because this affects the signed-in Source/aVa experience.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback or migration rollback is required.

## Audit Evidence

- PR: pending.
- CI/release check: pending.
- ACA runtime proof: pending.
- Live signed-in browser proof: pending.

## Known Gaps

- This release does not complete the Source-to-enterprise-context learning loop. Source facts and artifacts persist in Azure/Postgres, and the enterprise context layer exists, but a governed ACA job still needs to promote accepted Source evidence into `enterprise_context_*`, readiness, and search-index proof before calling it reusable enterprise context.
- This release does not fabricate a Recharts response when Source evidence is missing. If an event lacks vendor response coverage, accepted artifacts, or workshop notes, aVa should continue to disclose that gap honestly.
