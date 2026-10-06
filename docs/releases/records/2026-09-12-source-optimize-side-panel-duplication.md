# 2026-09-12-source-optimize-side-panel-duplication — Optimize context column

## Release ID

`2026-09-12-source-optimize-side-panel-duplication`

## Status

`candidate`

## Plain-English Summary

Stops the Contract 360 Optimize context column from restating the sub-tab the
reader already has open, and removes a pipeline metric from a client-facing
surface.

The context column is keyed on the Contract 360 tab, not on the Optimize
sub-tab, so one paragraph stood unchanged on Levers, Sequence and Comparator.
That paragraph is the governed Optimize record's headline and body, which are
the lever list and the ask sequence written as prose — exactly what the three
sub-tabs render as tables a short distance to its left. The column now carries
only what the sub-tabs do not: the value-type ledger, and the evidence gate
naming what a signal-stage row still needs before it can carry a value.

Separately, the column showed a count of deterministic claim cards. That is a
measure of the generation pipeline rather than a fact about the contract, and a
reader has no way to act on it or to tell what a change in it would mean. It is
removed.

Every governed fact still renders. The levers appear in the lever table with
their asks and reasons, their ordering in the sequence view, and their gate
states in the refusal chips. What is dropped is the second telling.

## Layer Impact

- **Layer 4 / Products:** Contract 360 Optimize context column composition.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. The governed tab intelligence record is unchanged and still read.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every contract whose Optimize tab renders.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `WorkspaceExecutiveShell.tsx`: Optimize renders a gate-only statement instead of the full governed statement; the deterministic-card count and its prop threading are removed.
- `WorkspaceClient.ecl-browser.test.tsx`: pins that Optimize drops the statement and the card count while keeping the ledger and the gate, and that every other tab keeps the statement.

## QA / Validation

- Focused Jest: 23 suites, 201 tests passed across the workspace slice.
- The updated test carries a tab-to-tab differential: the statement must be absent on Optimize and present on Story in the same render, so an unconditional removal fails it.
- Repository TypeScript: clean.
- ESLint on both changed files: clean.
- Required follow-up: signed-in browser proof after ACA deployment must show, on all three Optimize sub-tabs, no restated lever paragraph, no deterministic-card count, and the evidence gate still present.

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

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and signed-in browser proof.

## Known Gaps

The context column is still keyed on the Contract 360 tab rather than the
sub-tab, so a future sub-tab-specific context panel would need a different
signal than the one available here. This change removes the duplication it
caused on Optimize without reworking that keying.
