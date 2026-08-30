# Tower — enforce the rules across every panel, not one field at a time

## Release ID

`2026-08-30-tower-rules-enforced-sweep`

## Status

`candidate`

## Plain-English Summary

Four rules came out of this week's defect sweep. Each was fixed where it was found and guarded by
naming the specific fields involved. Named-field guards only catch the fields you thought of.

This replaces them with guards that match the **shape** of each defect across every panel, and
fixes the five violations that surfaced when they ran:

| Panel | What it did |
| --- | --- |
| Budget → domain | `fundedAmountUsd \|\| fundedUsd` — a fallback that could never change the value, reading as a choice between two funding measures |
| Command centre | `totalProgramSubjectCount \|\| programCount \|\| programs.length` — the count of subjects silently becoming the board-scope count |
| Evidence & actions | `economicReviewQueueCount \|\| gaps.length + pipelineGaps.length` — a queue count replaced by the combined size of two unrelated collections |
| Foundations | `costToBuildLowUsd ?? costToBuildHighUsd` — the **low** bound of a cost range falling back to the **high** one |
| Budget → shape | "Capex/opex is not present in this view model" — build vocabulary where a CXO reads |

The Foundations one is the sharpest. When only one bound is recorded it rendered bare, so an upper
bound was indistinguishable from a point estimate: `$20.2M` read as what the build costs, when it
meant at most that. It now says `up to $20.2M` or `from $14.8M`, which keeps the one thing the
source recorded.

## Layer Impact

Lane: `global-control-lane` — shared behaviour for all clients, not feature-gated. Tower product
surface only. No reader, loader, schema or data change; no value recalculated.

## Client Applicability

**All clients** reading Tower. Not flagged, not tenant-scoped. On a tenant where the primary metric
in each pair is non-zero, the rendered figures are unchanged — the substitutions were dormant, not
active. The Foundations range and the capex/opex wording change wherever those states occur.

## Changes Included

- `views/BudgetDomainPanel.tsx`, `views/CommandCenterView.tsx`, `views/ContractTabs.tsx`,
  `views/FoundationsPanel.tsx`, `views/BudgetShapePanel.tsx` — the five fixes.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — four shape-based guards that read
  every panel in the views directory rather than a named list.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 49/49 |
| Tower suites | PASS against baseline — 537 pass / 21 fail across 6 suites; failing set identical to `origin/main` |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Guard mutation tests | PASS — reintroducing a metric substitution fails a guard; reintroducing a `const x = 0` gate fails two |

Two defects in the guards themselves were caught while writing them, and both are the failure this
work exists to prevent:

- A negative lookahead after `\s*` backtracked to zero width and tested the space rather than the
  token, so `|| 1` — a denominator guard — read as a substitution. Replaced with positive matching.
  This is the second time today that construct has misfired.
- The dead-gate guard used a backreference with no capturing group. `tsc` caught it. It had been
  passing 49/49 the whole time, because a `\1` with no group never matches anything: **a guard that
  could not fail**, which is precisely the defect class it was written to catch.

## Rollout Plan

Ships with the next `main` deploy. No flag, no env change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-runtime mutation from this branch.

## Rollback Plan

Revert the commit. Display-only; nothing computed or stored changes.

## Known Gaps

- **The metric-substitution guard covers the views directory only.** Drawers, the shell, and
  `src/lib/tower` are not scanned by it.
- `economicReviewQueueCount` still resolves `?? 0` in the view model, so an absent count renders as
  zero rather than as absent. Removing the substitution was the change here; making the count
  nullable end to end is a separate one.
- The guards read source text. They catch these shapes, not every possible way to express them.

## Audit Evidence

The five violations were found by running the new shape guards against the existing panels, after
an earlier named-field sweep had reported the same rules clean. Three of the five use field names
that sweep never mentioned.
