# 2026-07-17-intelligence-empty-chart-card-suppression — Intelligence Empty Chart Card Suppression

## Release ID

`2026-07-17-intelligence-empty-chart-card-suppression`

## Status

`candidate`

## Plain-English Summary

This release suppresses non-renderable generated chart artifacts from the aVa chat and export surfaces. If Claude emits a chart packet whose rows are not numeric enough to produce a valid SVG, AbarVa now skips that dead chart card instead of showing a confusing placeholder. Valid charts, tables, and relationship views still render normally.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI: prevents empty chart cards from appearing in the shared aVa answer renderer.
- Export surface: prevents empty chart cards from appearing in HTML/PDF session exports.
- Deterministic SVG renderer: returns no SVG for non-numeric generic chart input so renderers can filter it cleanly.

## Client Applicability

- All clients: yes, any tenant receiving generated aVa chart artifacts benefits.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/agent-answer/AgentAnswerRenderer.tsx`
- `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`
- `src/lib/ava-answer/export/render-answer-html.ts`
- `src/lib/ava-answer/export/__tests__/render-answer-html.test.ts`
- `src/lib/programs/expert-kernel/exports/board-grade/svg-charts.ts`

## QA / Validation

- Passed: `npx jest src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/ava-answer/export/__tests__/render-answer-html.test.ts src/lib/programs/expert-kernel/exports/board-grade/__tests__/svg-charts-inline.test.ts --runInBand`
  - Result: passed, 3 suites / 20 tests.
  - Note: pre-existing duplicate Jest mock warnings for markdown/GFM mocks still print.
- Passed: `npx eslint src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/ava-answer/export/render-answer-html.ts src/lib/ava-answer/export/__tests__/render-answer-html.test.ts src/lib/programs/expert-kernel/exports/board-grade/svg-charts.ts`
- Pending: `npm run release:check`.
- Not run yet: live signed-in proof after ACA deployment.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to `ca-abarva-web-lab-eastus`. After deploy, rerun the signed-in Intelligence visual/ranking prompt against `https://app.abarva.ai` and confirm the useful charts/table render while the empty chart placeholder is absent.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. No schema, data, environment, or worker changes are included.

## Audit Evidence

- PR URL: pending.
- CI/run evidence: pending.
- ACA deploy evidence: pending.
- Signed-in browser proof: pending.

## Known Gaps

This release does not change chart selection, model prompt behavior, or response latency. It only removes non-renderable chart cards from chat/export when the answer already has valid content to show.
