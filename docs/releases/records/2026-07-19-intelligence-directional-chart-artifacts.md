# 2026-07-19-intelligence-directional-chart-artifacts — Intelligence Directional Chart Artifacts

## Release ID

`2026-07-19-intelligence-directional-chart-artifacts`

## Status

`candidate`

## Plain-English Summary

This follow-up fixes a live Intelligence chart-quality gap found after PR #5058 deployed. The renderer was deployed and tables were clean, but a chart-heavy FS Demo question still produced a conservative “Requested Visual Boundary” table instead of a visual chart. The change lets explicit AI-use-case value/complexity asks render qualified, planning-grade Recharts exhibits when aVa has a cited answer and a ranked use-case read, while preserving the hard guard against turning exact unsupported dollar claims into charts.

## Layer Impact

- `global-control-lane` — Intelligence answer assembly: adds a narrow directional visual fallback for explicit AI-use-case value/complexity chart requests.
- `global-control-lane` — Intelligence prompt contract: strengthens the chart/table instruction so Claude emits chart-ready GFM rows for value/complexity, readiness/value, 2x2, quadrant, or priority matrix asks.
- `global-control-lane` — Agent answer rendering: no renderer contract change; this release feeds the existing Recharts path with typed `quadrant-matrix` and `horizontal-bar` artifacts.

## Client Applicability

- All clients: yes, for Intelligence/aVa chart-heavy questions.
- Specific clients: the live failure was observed on FS Demo.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts`
- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- PASS: `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`

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

## Known Gaps

Live production acceptance is pending deploy and signed-in proof.
