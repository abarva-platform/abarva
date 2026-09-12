# 2026-09-12-source-why-listed-vocabulary — Why-listed column vocabulary

## Release ID

`2026-09-12-source-why-listed-vocabulary`

## Status

`candidate`

## Plain-English Summary

The portfolio Contracts list has a "Why listed" column that answers a reader's
question about each row. Three of its answers named internal objects instead.

- "6 executive claim cards" — a claim card is an internal object. What the reader gets from it is an evidenced claim, so the column now says "6 evidenced claims".
- "6 action rows" — likewise a row is our storage, not their answer. Now "6 governed actions".
- "Header-only portfolio signal" — now "Register entry only — no evidence loaded", which says the same thing in words a reader can act on.

Same class as the Command view's lane label and the tab-level identifiers fixed
earlier today. The counted sets and the ordering are unchanged; only the words
are.

## Layer Impact

- **Release lane:** `global-control-lane` — shared portfolio presentation for all clients, not feature-gated.
- **Layer 4 / Products:** One reason-string builder for the Contracts list.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every tenant's Contracts list.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `WorkspaceExecutiveShell.tsx`: three reason strings in the why-listed builder.
- `WorkspaceExecutiveShell.performance.test.ts`: two assertions updated to the reader-facing wording.

## QA / Validation

- Focused Jest: 27 suites, 237 tests passed across the workspace slice.
- Two existing assertions pinned the old wording and failed immediately, which is why they are updated here rather than left broken.
- Repository TypeScript: clean. ESLint on both changed files: clean.
- Required follow-up: read the deployed Contracts list and confirm no internal object name appears in the why-listed column.

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
- **Live signed-in proof required:** Yes, on the portfolio Contracts list.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and the deployed-page read.

## Known Gaps

A more serious finding on the same surface is deliberately not addressed here.
The list and the contract's own page render different annual values for the same
contract — both read a field named `annual_value`, from two read paths that
disagree. Repointing a column or relabelling a header would make the screens
agree while the product still held two numbers for one fact, so the convergence
question is written up separately for whoever owns the projections rather than
patched in the presentation layer.

Two further portfolio views, Levers and Evidence, have not been read for this
class of vocabulary. Coverage has not been read at all.
