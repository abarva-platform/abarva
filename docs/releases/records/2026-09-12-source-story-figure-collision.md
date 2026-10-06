# 2026-09-12-source-story-figure-collision — Two quantities, one figure

## Release ID

`2026-09-12-source-story-figure-collision`

## Status

`candidate`

## Plain-English Summary

Two unrelated quantities were rendering as the same figure on the Contract 360
Story tab, two cards apart, with nothing to tell a reader they were different.

The sized ask is the sum of the traced negotiation levers. The undrawn
commitment is the committed annual baseline minus observed spend. On the
reference contract those are $1.511M and $1.484M — $27K apart, and unrelated as
measures. The money formatter renders millions to one decimal, so both printed
`$1.5M`. A third card, the value-type ledger, prints the sized ask again. Three
cards, one figure, and the coherent inference is that the ask was derived from
the gap.

It was not. That inference is the kind of defect this product exists to prevent:
two individually correct figures combining into a false statement.

Three changes:

- A `moneyPrecise` formatter renders two decimals inside the millions and defers to `money` everywhere else, so a figure sharing a surface with a similar quantity is distinguishable. Nothing outside the millions changes shape.
- The commitment-posture line now names its measure — capacity that was not drawn on — and states plainly that it is not the size of the ask.
- The "Next action" card is gone where a lever is loaded. Its value read "Work the lever", which says nothing, and its detail was the lever's own next action, the same string the "Top lever" card two positions above already carries.

Found by reading the deployed page. The two existing tests that contain the old
sentence assert it as fixture input rather than deriving it, so the derivation
had no coverage at all; a focused test now pins the collision and the
separation.

## Layer Impact

- **Release lane:** `global-control-lane` — shared Contract 360 derivation and presentation for all clients, not feature-gated.
- **Layer 4 / Products:** Story decision-strip derivation and the money formatter.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. Both quantities are derived from rows that are unchanged.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every contract whose Story tab renders a commitment posture.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `viewModel.tsx`: `moneyPrecise`, documented with the collision it exists to prevent.
- `buildViewModel.ts`: commitment-posture lines name their measure and disclaim the ask; the redundant "Next action" card is dropped where a lever is loaded.
- `moneyPrecision.test.ts`: five tests — the collision `money` produces, the separation, the deferral outside the millions, refusal on an absent figure, and sign handling.

## QA / Validation

- Focused Jest: 25 suites, 213 tests passed across the workspace slice.
- The new test asserts both directions: that `money` renders the two quantities identically, and that `moneyPrecise` does not. If the formatter were reverted, the second assertion fails.
- Repository TypeScript: clean.
- ESLint on all three changed files: clean.
- Required follow-up: read the deployed Story tab and confirm the ask and the undrawn commitment render as different figures, and that no card restates the top lever's next action.

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
- **Live signed-in proof required:** Yes, on the Contract 360 Story tab.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and the deployed-page figure comparison.

## Known Gaps

`moneyPrecise` is applied where a collision was observed, not everywhere two
figures share a surface. A general rule — any two derived quantities on one
surface must be rendered at a precision that distinguishes them — would need a
layout-level check rather than a formatter, and does not exist. Other surfaces
may hold the same class of collision and have not been audited for it.

The committed figure on the Story tiles reads the contract's own committed
annual field while the posture gap derives from the spend rows, so the two
disagree slightly at one decimal. That is a separate reconciliation and is not
addressed here.
