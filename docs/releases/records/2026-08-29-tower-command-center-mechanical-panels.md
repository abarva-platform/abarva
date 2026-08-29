# 2026-08-29-tower-command-center-mechanical-panels — Tower Command Center Mechanical Panels

## Release ID

`2026-08-29-tower-command-center-mechanical-panels`

## Status

`candidate`

## Plain-English Summary

Adds standalone Tower Command Center panel components for budget, initiative, tool, owner, and
foundation views. The panels are not wired into the route in this release; they are prepared for a
separate shell integration after review.

## Layer Impact

Layer 4 Products: adds presentation-only React components and tests that consume the existing Tower
Command Center view model. No intake, adapter, canonical model, data-plane, migration, or cube logic
is changed.

## Client Applicability

- All clients: Eligible after the panels are wired into the Tower Command Center shell.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this release.

## Changes Included

- New Tower Command Center view components for budget domain, budget shape, initiative table,
  initiative distribution, tools table, tools vendor, queue owner, and foundations panels.
- New Jest coverage for design-literal exclusion, absence rendering, derived findings, sorting,
  filtering, and uncapped initiative table reads.

## QA / Validation

- `npx jest src/components/tower/command-center/__tests__/mechanical-panels.test.tsx --runInBand`
  passed.
- `npx eslint src/components/tower/command-center/views/BudgetDomainPanel.tsx src/components/tower/command-center/views/BudgetShapePanel.tsx src/components/tower/command-center/views/InitiativesTablePanel.tsx src/components/tower/command-center/views/InitiativesDistributionPanel.tsx src/components/tower/command-center/views/ToolsTablePanel.tsx src/components/tower/command-center/views/ToolsVendorPanel.tsx src/components/tower/command-center/views/QueueOwnerPanel.tsx src/components/tower/command-center/views/FoundationsPanel.tsx src/components/tower/command-center/__tests__/mechanical-panels.test.tsx`
  passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` passed.
- `npm test -- --runInBand` was compared before and after by stashing this change. Both runs logged
  89 failing Jest suite headers before an existing script-style test interrupted normal summary
  output; no new failing suite header was introduced.

## Rollout Plan

Merge through the protected repository PR path. No Azure Container Apps deployment is required for
this candidate because the panels are standalone and not wired into the active Tower route.

## Deployment Authority

- Repo-owned deploy workflow: Not invoked for this presentation-only candidate.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a later route-wiring release.

## Rollback Plan

Revert the commit that adds the standalone panel files and their tests. Because there are no schema,
data-plane, runtime flag, or route-wiring changes, rollback is source-only.

## Audit Evidence

- Pull request diff for the Tower Command Center panel components and Jest coverage.
- Local command output for the focused panel test, touched-file ESLint, TypeScript, full-suite
  before/after comparison, and release check.

## Known Gaps

The panels are not wired into the Tower Command Center shell. Capex/opex, licensed-user counts, and
adoption targets render as gaps where the current view model does not carry those fields.
