# 2026-08-03-tower-command-proof-rail-polish — Tower Command Proof Rail Polish

## Release ID

`2026-08-03-tower-command-proof-rail-polish`

## Status

`candidate`

## Plain-English Summary

This release fixes a presentation-quality defect in Tower's Command Center first-read card. The small value chart could render with cramped labels and a chart measurement warning in the live shell. The chart is replaced with a compact proof rail that keeps each value stage in a fixed row with a stable label, rail, and value column.

## Layer Impact

Layer 4 Products: updates Tower presentation only. It does not change source data, canonical data, tenant routing, schema, migrations, data ingestion, data-plane jobs, or value calculations.

## Client Applicability

- All clients: Tower Command Center presentation behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/charts/WeekReadChart.tsx`: replaces the Recharts mini bar with a CSS-native proof rail.
- `src/components/tower/command-center/TowerCommandCenter.module.css`: adds stable proof-rail layout classes and mobile wrapping.

## QA / Validation

- Pass: `npx eslint src/components/tower/command-center/charts/WeekReadChart.tsx src/components/tower/command-center/views/CommandCenterView.tsx`
- Pass: `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pass: `TCC_HARNESS_OUT=/tmp/tower-proof-polish-harness npm test -- --runTestsByPath src/components/tower/command-center/__tests__/render-harness.test.tsx --runInBand`
- Pass: local browser geometry proof found `scrollX=0` and no proof-rail label/value overlap at 1440px desktop and 390px mobile widths.
- Pending: PR CI, ACA deploy proof, and signed-in Tower browser proof after merge.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deployment workflow builds and deploys the new web image. No manual Azure mutation, database migration, data load, feature flag, or environment-variable change is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Must be checked after deploy by the standard ACA proof process.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Tower route after deployment.

## Rollback Plan

Revert the Tower proof-rail polish commit or roll back the ACA web revision to the previous approved image. No database rollback is required.

## Audit Evidence

- Local focused ESLint output.
- Local focused Command Center test output.
- Local harness screenshots:
  - `/tmp/tower-proof-rail-desktop-playwright-20260803.png`
  - `/tmp/tower-proof-rail-mobile-polished2-20260803.png`
- Future PR and ACA deployment proof once merged.

## Known Gaps

This is a presentation polish fix only. It does not change the synthetic Tower maturity distribution, value-claim proof gates, or claimability logic.
