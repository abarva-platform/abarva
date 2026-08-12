# 2026-08-12-source-step-evidence-request-rows — Source Step Evidence Request Rows

## Release ID

`2026-08-12-source-step-evidence-request-rows`

## Status

`candidate`

## Plain-English Summary

Source event steps now show a clearer evidence-request row before the user acts. The row names what must be loaded or confirmed, where it should come from, who owns it, which format is accepted, where the data will parse/write back, current status, and the next action. This reduces ambiguity in the working canvas without changing the underlying evidence semantics.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: updates Source working-canvas presentation only. It makes existing stage-step metadata more visible and actionable.
- Layer 3 Canonical Enterprise Model: no change. The UI continues to read the existing Source shell view and does not create new facts, metrics, or ownership semantics.

## Client Applicability

- All clients: yes, any tenant using the Source event working canvas receives the clearer step row.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx`

## QA / Validation

- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.

## Rollout Plan

Merge through the protected GitHub PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required before live-proof claim.
- Worker image invariant: required before live-proof claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for any claim beyond deployment health.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No schema, migration, data-plane, or feature-flag rollback is required.

## Audit Evidence

- Pull request URL after creation.
- CI checks on the pull request.
- Main ACA deploy run after merge.
- Live ACA digest/traffic/worker invariant and health endpoint readback after deploy.

## Known Gaps

This does not change file parsing, artifact persistence, guidebook quality, or the broader Source workflow structure. It only makes the existing active-step evidence request clearer in the working canvas.
