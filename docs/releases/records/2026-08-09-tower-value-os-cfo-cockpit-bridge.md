# 2026-08-09 — Tower Value OS CFO Cockpit Bridge

## Release ID

`2026-08-09-tower-value-os-cfo-cockpit-bridge`

## Status

`candidate`

## Plain-English Summary

Tower's opening Command Center now tells the full CFO value-realization story instead of leading with only a proof waterfall. The cockpit adds a governed investment-to-value conversion bridge, an eight-quarter value trajectory, a capital decision matrix that keeps no-benefit programs visible as capital exposure, and a compact proof-operations rail with evidence owners and source trust. Missing benefit and conversion values remain blank/null; approved funding is shown only as investment or capital exposure.

## Layer Impact

- `global-control-lane`: Tower Command Center presentation, Recharts visuals, and view-model aggregation change for all tenants using the Tower Value OS reader.
- `client-data-lane`: no schema or data mutation in this slice; the reader consumes the existing governed consumption views.

## Client Applicability

- All clients: applies wherever the Tower Command Center reads the Tower Value OS consumption views.
- Specific clients: none named in this public record.
- Internal only: private proof Container App validation before shared rollout consideration.
- Public/demo only: none.
- Feature flag: none introduced.

## Changes Included

- Runtime reader: adds first-class readback of `consumption.tower_value_trajectory_v1`.
- View-model: aggregates nullable eight-quarter trajectory rows and builds the conversion bridge without filling missing conversion dollars.
- UI: adds Recharts conversion bridge, eight-quarter trajectory chart, proof-owner queue, source-trust rail, and capital-exposure matrix copy.
- Tests: command-center component, reader, and view-model coverage now require the new CFO cockpit sections.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/command-center/__tests__/view-model.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/charts/__tests__/AiBubbleMatrixChart.test.ts --runInBand`
- Pass: `npx eslint src/lib/cio-tower/tower-mart-view-model.ts src/lib/tower/readTowerCommandCenter.ts src/lib/tower/command-center/types.ts src/lib/tower/command-center/view-model.ts src/lib/tower/command-center/derive.ts src/lib/tower/command-center/__fixtures__/design-fixture.ts src/lib/tower/command-center/__tests__/view-model.test.ts src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/charts/ValueConversionBridgeChart.tsx src/components/tower/command-center/charts/EightQuarterTrajectoryChart.tsx src/components/tower/command-center/charts/OutcomeDecisionMatrixChart.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`

## Rollout Plan

1. Merge through PR after candidate validation.
2. Build a digest-pinned branch image for the dedicated private Tower proof Container App.
3. Run signed-in CFO proof on the private proof app only.
4. Stop before shared Product/Lab web traffic deployment.

## Deployment Authority

- Repo-owned deploy workflow: required for any later shared traffic rollout; not used by this private proof candidate.
- Shared runtime mutators: none authorized by this record.
- Approved image digest: private proof image digest to be recorded after ACR build.
- ACA runtime invariant: shared web runtime must remain unchanged.
- Worker image invariant: not changed by this UI/read-model slice.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, against the dedicated private proof Container App before shared deployment consideration.

## Rollback Plan

Revert this UI/read-model commit and redeploy the prior private proof image. No data rollback is required because this slice does not mutate schemas, data, Cube models, feature flags, or shared traffic.

## Audit Evidence

- Focused unit/component test output from this candidate branch.
- Focused ESLint output from this candidate branch.
- Private proof deployment digest and browser screenshots to be attached after canary deployment.

## Known Gaps

- Private proof deployment and signed-in CFO browser proof are still pending.
