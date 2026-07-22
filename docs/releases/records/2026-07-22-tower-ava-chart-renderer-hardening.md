# 2026-07-22-tower-ava-chart-renderer-hardening — Tower aVa Chart Renderer Mount Safety

## Release ID

`2026-07-22-tower-ava-chart-renderer-hardening`

## Status

`candidate`

## Plain-English Summary

Hardens the shared aVa chart renderers so Recharts visuals mount only after their visible container has real width and height. This prevents hidden or collapsed agent panels from producing browser chart-size warnings while preserving the underlying answer content and chart data.

## Layer Impact

- Release lane: `global-control-lane`.
- Presentation layer: Updates shared aVa answer and markdown chart rendering only.
- Tower UX layer: Tower can mount the collapsed/expandable aVa panel without triggering hidden chart warnings.
- Data layer: No data, mart, prompt, model, tenant, or metric changes.

## Client Applicability

- All clients: Shared aVa chart rendering safety applies wherever the common renderer is used.
- Specific clients: Meridian / Healthcare Demo receives the immediate Tower proof path.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/agent-answer/AgentAnswerRenderer.tsx`
- `src/lib/agent/markdownRenderer.tsx`

## QA / Validation

- Pass: `npm test -- src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed 3 suites / 34 tests.
- Pass: `npx eslint src/components/agent-answer/AgentAnswerRenderer.tsx src/lib/agent/markdownRenderer.tsx` passed with 0 errors.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- Pending: `npm run release:check` rerun after release-record wording update.
- Pending: Signed-in Meridian Tower browser proof after ACA deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`, shifts traffic to the healthy revision, and verifies the runtime invariant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Covered by ACA deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Tower signed-in browser proof.

## Rollback Plan

Revert this PR and redeploy through the ACA main workflow. Since this is presentation-only, rollback does not require data migration or tenant data changes.

## Audit Evidence

- PR URL: pending.
- Local validation output: to be captured in PR.
- ACA runtime invariant: to be captured after deploy.
- Browser screenshots/logs: to be captured after deploy.

## Known Gaps

This does not add new chart types or new aVa visual-intent logic. It only makes existing chart rendering safe in hidden/collapsed layout states.
