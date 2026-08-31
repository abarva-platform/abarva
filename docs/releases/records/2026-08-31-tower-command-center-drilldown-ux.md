# 2026-08-31-tower-command-center-drilldown-ux — Tower Drilldown UX

## Release ID

`2026-08-31-tower-command-center-drilldown-ux`

## Status

`candidate`

## Plain-English Summary

The Tower Command Center now makes portfolio rows easier to inspect. AI bets open on the value-proof view by default, the value-proof layout toggle changes the layout it names, all-case and tool-rollout rows can open the detail drawer, control and gate terms carry inline explanations, and action-campaign rows wrap long next-step values without clipping.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Tower presentation only. The change reads the existing command-center view model and does not change tenant inputs, source adapters, canonical data, projections, migrations, jobs, or loaders.

## Client Applicability

- All clients: Tower Command Center users receive the UI behavior after the web deployment from main.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower tab defaulting and drawer routing for all-case and tool-rollout rows.
- Value-proof display mode state for stacked and 2 by 2 layouts.
- Shared explanations for control blockers and gating constraints.
- Foundations copy that defines the bucket as shared AI enablers while keeping value claims separate.
- Action-campaign label and wrapping changes for long next-step values.
- Focused Tower regression coverage for defaults, mode switching, drilldowns, metadata tags, blocker explanations, and evidence-queue labeling.

## QA / Validation

- `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/mechanical-panels.test.tsx --runInBand` passed. Jest emitted the existing duplicate manual mock warnings.
- `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/views/InitiativesTablePanel.tsx src/components/tower/command-center/views/ToolsTablePanel.tsx src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/views/FoundationsPanel.tsx src/components/tower/command-center/drawers/AiInitiativeDrawer.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/mechanical-panels.test.tsx src/lib/tower/command-center/format.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` passed.

## Rollout Plan

Merge to main. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image. No data build, migration, feature flag, environment variable, worker job, traffic override, or manual runtime mutation is included in this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for web rollout from main.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Verify after deployment before claiming live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the affected Tower route.

## Rollback Plan

Revert the squash commit and let the repo-owned deploy workflow publish the previous Tower UI behavior. No database rollback is required.

## Audit Evidence

Inspect the PR diff, local validation output, the main deploy workflow run after merge, ACA runtime invariant proof, and signed-in Tower route proof after deployment.

## Known Gaps

No data-layer changes are included. This release does not decide whether the default AI Bets sub-view should become Distribution later; it selects Value proof as the current executive default because it carries the board-claimability story and existing detail path.
