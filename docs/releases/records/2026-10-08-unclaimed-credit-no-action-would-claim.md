# Source — unclaimed credit that no loaded action would claim

## Release ID

2026-10-08-unclaimed-credit-no-action-would-claim

## Status

Open with auto-merge armed — not deployed and not live-proven by this record.

## Plain-English Summary

The question behind this change was "why do some large contracts show few actions?" Loaded action
depth is not a measure of contract value or completeness. This change makes one evidence-backed
coverage gap visible without creating a new opportunity amount.

**The obvious fix was wrong.** Authoring more opportunity rows would have repeated a defect this
repo has already diagnosed: the "calculation" behind an authored opportunity is a pass-through of an
authored number, so the spine makes a hand-picked figure look computed. And the figure could not be
derived honestly, because the lever's own definition in the archetype registry says:

- `method: recurring_avoidable_pct × annual_change_order_spend × term_years`
- `rangeMethod: Low/high from a conservative vs. observed band; **no point estimate**`
- `citationRequired: true` on the percentage
- `onMissingEvidence: insufficient_evidence`
- and a `commercialRisk` note that claiming it without classified data "overstates a number the
  vendor will refute"

Existing authored examples use inconsistent avoidable shares without the required citations.
Selecting either share for other contracts would manufacture refutable numbers.

**What this change does instead** is report an amount that needs no assumption at all.

`source360RecoverableCreditCoverageRows` already classifies contracts whose loaded actions include
a credit claim. Its fallback path narrows the portfolio figure to that set when such actions exist;
a selected load run instead includes its loaded credit rows. In either case, a contract can carry
unclaimed SLA credit without a corresponding claim action.

The Coverage view now names contracts holding unclaimed credit without a loaded claim action, at
the amount on each loaded performance coverage row. The panel directs the operator to review the
SLA and claim window; it does not assert that a claim is valid or that the amount is excluded from
every portfolio figure.

Nothing here estimates anything, and no money figure is created.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product) only — one derivation over rows the read model already returns, and one panel. No
schema change, no migration, no query change, no change to any stored value, and no change to the
portfolio credit figure itself.

## Client Applicability

**All clients**, no gating and no feature flag. The panel renders only when the condition holds, so
a tenant with a credit action on every contract carrying credit sees nothing new.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` —
  `creditActionContractIdSet` extracted so the fallback figure and no-action report share the
  existing candidate classifier; `unexploitedRecoverableCreditRows`; the Coverage panel.
- `src/app/(maestro)/source/preview/workspace/__tests__/unexploitedRecoverableCredit.test.ts` — new,
  11 cases.
- `src/app/(maestro)/source/preview/workspace/__tests__/unexploitedCreditPanel.test.tsx` — new
  render suite, 4 cases.
- `.github/workflows/ai-surface-control-catalog.yml` — both suites named in the required job's
  exact-path list.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check                                   | Status                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Workspace suite directory               | PASS — 40 suites, 380 tests                                                                                    |
| New suites                              | PASS — 15 cases                                                                                                |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors                                                                                        |
| ESLint on changed files                 | PASS — 0 errors, 1 pre-existing warning                                                                        |
| CI census                               | PASS — `coveredTestFiles` +2, `uncoveredTestFiles` **unchanged** at 164, directory `untriagedUnrunTestFiles` 0 |
| Release check                           | PASS                                                                                                           |
| Signed-in acceptance                    | NOT RUN                                                                                                        |

### Mutation results

| Mutation                                                     | Result           |
| ------------------------------------------------------------ | ---------------- |
| gap report stops excluding contracts that have an action     | killed — 7 cases |
| gap report includes zero-credit contracts                    | killed — 2 cases |
| the panel never renders                                      | killed — 2 cases |
| the credit predicate reads the action type but not its title | killed           |
| the equal-amount ordering tie-break removed                  | killed           |

One case pins the fallback partition when no load run is selected. Another pins the distinction
when a selected run causes the portfolio figure to include a row without an action. The UI makes no
claim that the two figures are always disjoint. Both paths use the existing candidate classifier.

The render mutation was run deliberately. The same mistake — a correct value reaching dead JSX while
a full round of arithmetic tests passed — happened on a sibling panel in this directory earlier
today, so the render assertion was written before the mutation rather than after it.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The no-action panel disappears; the existing portfolio figure is unchanged.

## Audit Evidence

- A control asserts the panel does not render when every contract carrying credit already has a
  credit action, so the disclosure is conditional rather than decorative.
- A control asserts an unrelated action on the same contract — a seat right-sizing — does not count
  as a credit claim, and that a credit claim named only in an action's title does.
- A guard over rendered text nodes asserts the panel says nothing of "estimate", "potential saving"
  or "confirmed", so a derived sum cannot read as a projection or as finance-confirmed value.

## Known Gaps

- **The change-order half is not closed and is not closable by authoring.** Some contracts carry
  recurring change-order spend with no reclassification action. The avoidable share is not
  established: the registry requires a cited range, while authored precedents disagree. Closing
  it needs classified evidence and a citation, not another authored point estimate.
- **Action depth still tracks package authoring, not contract value.** This change adds no action to
  any contract. It reports evidence that no action is using.
- The gap is reported at portfolio level, on the Coverage view. The individual contract page is not
  changed by this, and the Optimize surface is owned in another lane.
- The underlying structural issue — authored amounts presented through a calculation spine that
  performs no arithmetic — is unchanged and larger than this slice.
- Not deployed and not live-proven. No signed-in walk of the Coverage view has been run for this
  change.
