# Tower — one metric, declared

## Release ID

`2026-08-29-tower-one-metric-declared`

## Status

`candidate`

## Plain-English Summary

Nine places across the command centre read one metric and silently displayed a different one when
the first was falsy:

- `aiAttributedInitiativeSpendUsd || aiTaggedUsd` — **attributed** AI investment falling back to
  **AI-tagged** spend. Different measures: one is what a classification attributes to AI, the other
  is what carries an AI tag.
- `aiInitiativeCount || view.allInitiatives.length` — the **tracked asset count** falling back to
  **however many rows happen to be loaded**.
- `blockedUsd || valueAtStakeUsd` — **blocked** value falling back to **value at stake**, in a
  column headed for the first.

`||` also swaps on a legitimate zero, so a portfolio that genuinely attributes $0 to AI would show
its AI-tagged total in a slot labelled attributed — and nothing on the page would say which number
the reader got.

Every site now reads the metric its label names. Where the value is absent, the surrounding panels
already have honest-absence handling.

This is the same defect corrected in the Verdict panel when it was ported; the original sites it
was copied from remained, which is why the sweep exists. Four of the nine were found by the guard
after the first pass missed them.

## Layer Impact

Lane: `global-control-lane`. Tower product surface only. No reader, loader, type or data change,
and no arithmetic changed — only which already-computed field each display reads.

## Client Applicability

**All clients.** Every tenant reading Tower. Not flagged, not tenant-scoped. On any tenant where
the primary metric is non-zero — Meridian today, where attributed AI investment is $211.8M — the
rendered numbers are unchanged; the change removes the silent swap, it does not move a figure.

## Changes Included

- `views/CommandCenterView.tsx` — four sites.
- `views/ContractTabs.tsx` — four sites.
- `TowerCommandCenter.tsx` — the Tools tab badge.
- `__tests__/case-attribute-widening.test.ts` — three guards, distinguishing `?? null` (honest
  absence) from `?? anotherMetric` (substitution).

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 30/30, three new guards |
| Tower suites | PASS against baseline — 518 pass / 21 fail across 6 suites; failing set diffed against `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Guard mutation test | PASS — reintroducing one `\|\|` substitution fails a guard; restored, 30/30 |
| Live signed-in proof | NOT RUN — pending deploy. See Known Gaps. |

The guard's own first draft used `\s*` before a negative lookahead, which backtracks to zero width
and so tested the space rather than the word — it flagged an honest `?? null`. Corrected to a
literal space before the lookahead.

## Rollout Plan

Ships with the next `main` deploy through the repo-owned ACA main deploy workflow. No flag, no env
change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-traffic mutation from this branch.

## Rollback Plan

Revert the commit. Display-only; no stored or computed value changed.

## Known Gaps

- **Not yet live-proven.** No figure is expected to move on Meridian, which is the point — the
  guard, not the render, is the deliverable here.
- `sort()` comparator chains of the form `a - b || c - d` were left alone: that is the standard
  tiebreak idiom, not a substitution.
- `InitiativesTablePanel` line 79 uses `financeValidatedUsd || -1` as a sort sentinel. It reads
  like the same shape but is a sort key, not a display, and was left unchanged.
- The trust ribbon's `187 absent` is a real derivation — `unknownSlots.length + pipelineGaps.length`
  — but carries no unit, so a reader cannot tell absent *what*. Legibility, not correctness; not
  addressed here.

## Audit Evidence

Found by tracing the live header line "including $211.8M tied to AI initiatives and tool rollouts"
back to `executiveSummary` in `CommandCenterView`, which read
`s.aiAttributedInitiativeSpendUsd || s.aiTaggedUsd`. A repository-wide sweep for the pattern found
the other eight.
