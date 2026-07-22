# 2026-07-22 Tower Explicit Chart Dimensions

## Release ID

`2026-07-22-tower-explicit-chart-dimensions`

## Status

`candidate`

## Plain-English Summary

Tower and aVa chart renderers now measure their host panels and pass explicit pixel dimensions into Recharts charts. This removes the remaining browser warning class where dynamic panels briefly mounted charts with `-1` width or height.

## Layer Impact

- Release lane: `global-control-lane`
- Presentation layer: replaces Recharts `ResponsiveContainer` wrappers in Tower and aVa chart rendering paths with measured explicit chart dimensions.
- Data layer: no data model, mart, evidence, candidate, or tenant data changes.
- Agent layer: no prompt, model, or answer-contract changes.

## Client Applicability

- All clients: yes, because the shared Tower and aVa chart renderers are common runtime code.
- Specific clients: no client-specific logic.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- `src/components/tower/charts/TowerCxoCharts.tsx`
- `src/components/agent-answer/AgentAnswerRenderer.tsx`
- `src/lib/agent/markdownRenderer.tsx`

## QA / Validation

- Pass: `npm test -- src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass with pre-existing warnings only: `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/charts/TowerCxoCharts.tsx src/components/agent-answer/AgentAnswerRenderer.tsx src/lib/agent/markdownRenderer.tsx`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Not run yet: post-deploy signed-in Meridian Tower browser proof is required before calling this live-proven.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned web image. After deploy, run the ACA runtime invariant and signed-in Meridian Tower browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: checked by the runtime invariant.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Meridian Tower.

## Rollback Plan

Revert the PR and allow the ACA main deploy workflow to publish the rollback image, or restore traffic to the prior healthy digest through the approved rollback process.

## Audit Evidence

- PR URL: to be added when opened.
- CI checks: GitHub PR checks.
- ACA invariant output: to be captured after deploy.
- Browser proof: to be captured after deploy under `/tmp/tower-cxo-explicit-chart-dimensions-browser-proof-20260722`.

## Known Gaps

This change does not add new Tower analyses, new aVa prompts, telemetry ingestion, or new Recharts chart types. It only hardens chart mounting.
