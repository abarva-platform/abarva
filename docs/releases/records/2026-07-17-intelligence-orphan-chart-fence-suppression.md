# 2026-07-17-intelligence-orphan-chart-fence-suppression — Intelligence Orphan Chart Fence Suppression

## Release ID

`2026-07-17-intelligence-orphan-chart-fence-suppression`

## Status

`candidate`

## Plain-English Summary

This release fixes a live proof defect where a malformed generated chart payload could appear in the visible aVa answer as prose, for example `chart{"type":"bar"...}`. The text sanitizer now strips orphan governed artifact payloads even when markdown rendering or malformed fence syntax removes the opening backticks.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI: prevents raw chart/table/graph/follow-up artifact JSON from appearing in the visible chat answer.
- Export surface: benefits from the same sanitized answer text before HTML/PDF generation.
- Intelligence safety: hardens the final display scrubber beyond prompt obedience and well-formed fences.

## Client Applicability

- All clients: yes, any tenant using aVa answer rendering benefits.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/answer/structured-fence-stream-filter.ts`
- `src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts`

## QA / Validation

- Passed: `npx jest src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/ava-answer/export/__tests__/render-answer-html.test.ts --runInBand`
  - Result: passed, 3 suites / 23 tests.
  - Note: pre-existing duplicate Jest mock warnings for markdown/GFM mocks still print.
- Passed: `npx eslint src/lib/intelligence/answer/structured-fence-stream-filter.ts src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/lib/ava-answer/export/render-answer-html.ts`
- Pending: `npm run release:check`.
- Not run yet: live signed-in proof after ACA deployment.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to `ca-abarva-web-lab-eastus`. After deploy, rerun the signed-in Intelligence visual/ranking prompt against `https://app.abarva.ai` and confirm raw chart payload text is absent.

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

This hotfix suppresses raw orphan artifact JSON in rendered prose. It does not change model prompt behavior, chart selection, typed artifact extraction, or response latency.
