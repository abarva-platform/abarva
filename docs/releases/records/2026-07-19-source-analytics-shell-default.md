# 2026-07-19-source-analytics-shell-default — Source Analytics Shell Default

## Release ID

`2026-07-19-source-analytics-shell-default`

## Status

`candidate`

## Plain-English Summary

Source was still routing non-Lakeshore tenants into the retired UniversalCanvasShell because `source_analytics` was configured as a tenant-only Lakeshore flag. This release makes the Source analytics shell the platform default so every tenant, including First Financials / FS Demo and Lakeshore, reaches the redesigned SourceAnalyticsCanvas family. `/source` now lands on the analytics portfolio book instead of the old decision-queue home.

## Layer Impact

`global-control-lane`: Changes Source routing and feature-flag policy for all signed-in clients. No schema, migration, ingestion, or tenant data mutation is included.

## Client Applicability

- All clients: yes, every tenant receives the Source analytics shell by default.
- Specific clients: not limited to Lakeshore.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` is now `platform` policy; `excludeTenants` would be the only emergency rollback mechanism.

## Changes Included

- `src/lib/features/registry.ts`: promotes `source_analytics` from Lakeshore-only tenant flag to platform-default flag.
- `src/app/(maestro)/source/page.tsx`: redirects Source home to `/source/portfolio`.
- Source analytics shell comments and route tests updated to enforce the analytics shell/home contract.

## QA / Validation

- Pass: `npx jest src/lib/source/door1/__tests__/door1-flag-gate.test.ts src/__tests__/integration/source/source-route-shell-enforcement.test.ts src/__tests__/integration/source/source-route-shell-control.test.ts src/__tests__/integration/source/source-context-action-enforcement.test.ts src/__tests__/integration/source/source-commercial-event-section.test.ts src/__tests__/integration/source/source-authenticated-route-smoke.test.ts src/__tests__/integration/source/source-dashboard-route-smoke.test.ts --runInBand` (42/42 passing; pre-existing duplicate manual mock warnings remain).
- Pass: focused ESLint on touched Source route, flag, analytics shell, and test files.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- Pass: `npm run release:check`.
- Not run until after merge/deploy: ACA runtime invariant and signed-in browser proof on `app.abarva.ai` showing SourceAnalyticsCanvas, not UniversalCanvasShell, for the FS Demo event route and analytics portfolio home.

## Rollout Plan

Merge through a PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. No manual Azure mutation or Vercel deployment is allowed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA workflow.
- ACA runtime invariant: pending ACA workflow.
- Worker image invariant: not applicable.
- Feature/env flag update path: static registry change only; no runtime env edit.
- Live signed-in proof required: yes.

## Rollback Plan

Fastest rollback is reverting the PR and redeploying through the ACA main workflow. Emergency rollback could add `excludeTenants` to the platform flag, but that would intentionally restore old Source routing for excluded tenants and should be treated as break-glass only.

## Audit Evidence

- PR: pending.
- Local validation: pending.
- ACA deployment: pending.
- Signed-in browser proof: pending.

## Known Gaps

The retired UniversalCanvasShell component and decision queue route still exist for non-home workflow links and historical tests. This release fixes live tenant routing to the analytics shell; full archival of old Source pages remains a separate cleanup slice.
