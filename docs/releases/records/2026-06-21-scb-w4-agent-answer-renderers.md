# 2026-06-21-scb-w4-agent-answer-renderers — AgentAnswer chart and table renderers

## Release ID

`2026-06-21-scb-w4-agent-answer-renderers`

## Status

`candidate`

## Plain-English Summary

Adds the reusable rendering layer for Ava's structured `AgentAnswer` output. An answer can now render typed tables with value formatting and citations, and chart payloads can render as inline SVG through the existing board-grade chart builders. This is display plumbing only: it does not change the answer engine, retrieval, feature flags, tenant data, or model prompts.

## Layer Impact

- **global-control-lane:** Adds shared React renderers under `src/components/agent-answer/` for all future surfaces that consume the universal `AgentAnswer` contract.

## Client Applicability

- All clients: Yes, once a surface passes an `AgentAnswer` with tables/charts into this renderer.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Surface-level exposure remains governed by the existing Shared Context Brain flags.

## Changes Included

- `src/components/agent-answer/AgentAnswerRenderer.tsx` — reusable Ava answer shell, `AnswerChartRenderer`, `DataTable`, citation chips, and chart SVG dispatch via `CHART_KIND_TO_BUILDER`.
- `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx` — focused rendering proof for a `cost-stack` chart and typed table formatting/citations.
- `docs/build/SCB_EXECUTION_TRACKER.md` — W4.1/W4.2 in-progress marker and handshake entry.

## QA / Validation

- `npx jest src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand` — PASS, 2/2.
- `npx eslint src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — repo-wide TypeScript still fails on unrelated local missing declarations/dependencies: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`. No renderer errors appeared.

## Rollout Plan

Merge to `main`; `aca-main-deploy` will build and deploy the updated app bundle. This slice is dormant until a surface passes structured `AgentAnswer.tables` or `AgentAnswer.charts` into the renderer.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from the merge commit.
- ACA runtime invariant: shared web app serves the updated bundle.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Not for activation; this is reusable render plumbing. Browser proof required when a surface starts emitting structured `AgentAnswer` payloads into it.

## Rollback Plan

Revert the PR. No data, schema, migration, worker, or feature-flag rollback required.

## Audit Evidence

- PR URL: to be filled when opened.
- Focused Jest and ESLint commands above.
- Release gate: `npm run release:check` before PR.

## Known Gaps

- W1.4 still needs to wire Home, Tower, Source, and Moves onto the shared server-side engine.
- This PR does not make `/api/intelligence/ask` emit structured `AgentAnswer` tables/charts; it renders them once a surface supplies them.
- Graph rendering remains outside W4.1/W4.2.
