# 2026-07-17-intelligence-svg-negative-bar-hotfix — Intelligence SVG Negative Bar Hotfix

## Release ID

`2026-07-17-intelligence-svg-negative-bar-hotfix`

## Status

`candidate`

## Plain-English Summary

This release fixes a production rendering defect found during live Intelligence proof: generated bar charts with negative values could emit invalid SVG rectangle dimensions. The chart now uses a real zero baseline for mixed positive/negative data so negative values render below or left of zero instead of producing browser console errors.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI: fixes the shared deterministic SVG chart renderer used by aVa answer artifacts.
- Export surface: improves HTML/PDF safety because the same SVG artifacts are used for chat display and export.

## Client Applicability

- All clients: yes, any tenant receiving generated aVa chart artifacts benefits.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/expert-kernel/exports/board-grade/svg-charts.ts`
- `src/lib/programs/expert-kernel/exports/board-grade/__tests__/svg-charts-inline.test.ts`

## QA / Validation

- Passed: `npx jest src/lib/programs/expert-kernel/exports/board-grade/__tests__/svg-charts-inline.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand`
  - Result: passed, 2 suites / 10 tests.
  - Note: pre-existing duplicate Jest mock warnings for markdown/GFM mocks still print.
- Passed: `npx eslint src/lib/programs/expert-kernel/exports/board-grade/svg-charts.ts src/lib/programs/expert-kernel/exports/board-grade/__tests__/svg-charts-inline.test.ts`
- Pending: `npm run release:check`.
- Not run yet: live signed-in proof after ACA deployment. This is required to confirm the prior invalid SVG console errors no longer occur in production.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to `ca-abarva-web-lab-eastus`. After deploy, rerun the same signed-in Intelligence visual/ranking prompt against `https://app.abarva.ai` and confirm no invalid SVG console errors.

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

This hotfix only corrects invalid SVG dimensions for mixed positive/negative generic bar charts. It does not redesign chart aesthetics, change model answer content, change chart selection, or address chat response latency.
