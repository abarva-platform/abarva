# 2026-07-22-source-ava-structured-panel-cleanup — Source aVa Structured Panel Cleanup

## Release ID

`2026-07-22-source-ava-structured-panel-cleanup`

## Status

`candidate`

## Plain-English Summary

Live proof of the governed Source aVa path showed that structured tables/charts rendered, but the panel also displayed raw chart JSON from the prose summary. When structured `agentResponseParts` are present, the Source aVa panel and shared agent column now render those parts as the answer body and suppress the duplicate raw summary text.

## Layer Impact

- `global-control-lane`: Presentation-only cleanup in shared aVa response rendering.
- `client-data-lane`: No data model, persistence, retrieval, or tenant data changes.

## Client Applicability

- All clients: Any Source or shared-shell answer that carries structured response parts avoids duplicate raw summary output.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AskAnythingBar.tsx`: Renders `AgentResponseParts` directly when structured parts exist.
- `src/components/shell/AgentColumn.tsx`: Uses the same structured-parts-only branch for completed/streaming shared-shell agent answers.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.thread.test.tsx`: Verifies Source aVa renders structured text/table/chart parts while suppressing raw summary JSON.

## QA / Validation

- PASS: Live pre-fix proof on `https://app.abarva.ai/source/events/apex-retail-ams-outsourcing-2026?stage=responses` showed Source aVa called `/api/v1/source/apex-retail-ams-outsourcing-2026/nexus/ask`, rendered 4 tables, 1 bar chart, citations, and next action, but panel text still included raw chart JSON.
- PASS: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.thread.test.tsx --runInBand`.
- PASS: `npx eslint src/components/agent/AskAnythingBar.tsx src/components/shell/AgentColumn.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.thread.test.tsx`.
- NOT RUN yet: `npm run release:check` after this record wording correction.
- NOT RUN yet: Live post-deploy proof; pending merge and ACA deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow deploy the exact merged commit, then verify the ACA runtime invariant and rerun signed-in Source aVa proof to confirm structured parts render without raw JSON summary leakage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge to `main`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback or migration rollback is required.

## Audit Evidence

- PR: pending.
- CI/release check: pending.
- ACA runtime proof: pending.
- Live signed-in browser proof: pending.

## Known Gaps

- This release does not complete the Source-to-enterprise-context learning loop. That still requires a governed ACA writeback job from accepted Source evidence into `enterprise_context_*`, readiness, and search-index proof.
