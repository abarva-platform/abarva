# 2026-09-12-source-optimize-signal-state-followup — Optimize candidate display guard

## Release ID

`2026-09-12-source-optimize-signal-state-followup`

## Status

`candidate`

## Plain-English Summary

Prevents provisional signal-stage opportunity amounts from appearing as priced
client-facing asks in Contract 360 Optimize. Signal asks now show `Not sized`
or the evidence gate that must close, and are excluded from the sized count and
candidate total. The change keeps the Optimize table aligned with the governed
candidate-versus-realized value contract.

## Layer Impact

- **Layer 4 / Products:** Contract 360 Optimize rendering and its candidate total.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** The display invariant applies to every contract with a signal-stage opportunity.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `ContractLeverTable.tsx`: signal-stage rows render without amounts and are excluded from sized totals.
- `ContractLeverTable.test.tsx`: regression coverage for one table, signal amount suppression, and total exclusion.
- `.claude/handoffs/source-data-layer-reconciliation-20260912.md`: current data-layer and browser acceptance handoff.

## QA / Validation

- Focused Jest: 3 suites, 23 tests passed.
- `git diff --check`: passed.
- Required follow-up: signed-in browser smoke after ACA deployment must verify one Optimize table, no signal-stage dollar amounts, and a total containing only sized rows.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deploy workflow
builds a digest-pinned image and updates the shared lab runtime. No migration or
operator data-build job is required for this presentation-only change.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None outside the workflow.
- **Approved image digest:** Recorded after deployment.
- **ACA runtime invariant:** Required before calling the change live-proven.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** Yes, for Contract 360 Optimize.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for the follow-up branch.
- Focused Jest output and release-control output.
- ACA deployment run, digest invariant, and signed-in browser smoke.

## Known Gaps

This change does not add the requested Optimize report/email action, does not
classify the remaining register-only contracts, and does not reload any data.
Those remain separate acceptance items in the data-layer handoff.
