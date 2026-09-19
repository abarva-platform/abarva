# 2026-09-05-source-vocabulary-consistency - Source Vocabulary Consistency Gate

## Release ID

`2026-09-05-source-vocabulary-consistency`

## Status

`candidate`

## Plain-English Summary

Adds a release gate that checks Source's executable vocabulary inputs against each other before a
release can pass. The check verifies that the 11-stage Source lifecycle, stage labels, stage-gate
transition labels, artifact specifications, gate criteria, evidence requirements, stage canvas
configs, and sourcing-journey labels all agree on the same canonical stage model.

## Layer Impact

Layer 4 - Products, `global-control-lane`: Source product behavior is guarded by an audit script
only. No user-facing workflow, tenant data, adapter, canonical model, or projection data changes are
included.

Release control, `global-control-lane`: `release:check` now runs the Source vocabulary consistency
check so a future stage-label or transition-label drift fails before release.

## Client Applicability

All clients: Indirectly, through safer shared Source release governance.
Specific clients: None.
Internal only: Release/audit guard execution.
Public/demo only: None.
Feature flag: None.

## Changes Included

- `scripts/audit/source-vocabulary-consistency.ts`
- `scripts/release-control/check-source-vocabulary-consistency.mjs`
- `package.json` script `audit:source-vocabulary-consistency`
- `scripts/release-check.mjs` release-gate wiring

## QA / Validation

- `npm run audit:source-vocabulary-consistency` - passed.
- `node scripts/release-control/check-source-vocabulary-consistency.mjs` - passed.
- Mutation check: changed `gate-scope-rfp` label from `Scope -> RFP` to `Scope -> Requirements`;
  `npm run audit:source-vocabulary-consistency` failed and reported the expected canonical label.
  The mutation was restored before final validation.

## Rollout Plan

Merge through PR. No Azure Container Apps deployment, migration, feature flag, worker job, or data
load is required for the guard itself. The check becomes active wherever `release:check` is run.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; this is a release-control guard with no runtime surface change.

## Rollback Plan

Revert the guard script, release-control wrapper, package script, and `release:check` import. This
restores the previous release gate set with no data rollback required.

## Audit Evidence

- Local audit output from `npm run audit:source-vocabulary-consistency`.
- Local audit output from `node scripts/release-control/check-source-vocabulary-consistency.mjs`.
- Mutation failure output naming the mismatched `gate-scope-rfp` transition label.

## Known Gaps

This guard covers structured Source registries and sourcing journeys. It does not yet scan every
free-form UI sentence, historical document, or test fixture for stage-name prose.
