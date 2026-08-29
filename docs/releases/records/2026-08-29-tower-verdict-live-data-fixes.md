# 2026-08-29-tower-verdict-live-data-fixes — Three defects the design fixture could not surface

## Release ID

`2026-08-29-tower-verdict-live-data-fixes`

## Status

`candidate`

## Plain-English Summary

The six-tab shell went live and the Verdict panel met real Meridian data for the first time. Three
defects appeared immediately, none of which the design fixture can produce — it carries 8 programs,
no tool rollouts, and a finance status on every case.

**It counted 55 cases where the portfolio has 42.** The heading used the whole
`allInitiatives` collection, which is 42 business cases *plus* 13 tool rollouts. Two populations
added together — the same conflation this surface exists to prevent. It now counts business cases
only, identified by carrying a finance status, which is the thing a tool rollout does not have.

**The gate chart repeated the same figure twice.** "On a validated case" was bound to
`financeValidatedUsd` and "Board claimable" to `claimableUsd`; on live data those are identical, so
the chart drew a step that does not exist. The design's middle bar is a different measure: the
*asserted* value sitting on cases that reached validation. That is now what it computes.

**The status pipeline rendered five empty rows.** Every live row has a null `financeStatus`,
because the attribute widening has not been through a Layer 4 re-run. Five labelled rows with no
bars reads as "no cases in any stage" rather than "this field is not loaded". The panel now says so
in words.

Also fixed: the six tabs wrapped onto two lines, because the grid still declared four columns.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 4 (products — Tower):** one panel's arithmetic and one grid declaration. No metric,
  value, projection or serving change.
- **Layer 3 and below:** untouched.

## Client Applicability

- All clients: yes — every tenant rendering the Tower Verdict panel.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/components/tower/command-center/views/VerdictPanel.tsx`
- `src/components/tower/command-center/TowerCommandCenter.module.css` — six-column tab grid
- `src/components/tower/command-center/__tests__/verdict-panel.test.tsx` — three regression tests

## QA / Validation

- Verdict suite → 9/9, including three tests written from the live shape: cases counted without
  tools, no repeated claimable figure when no status is carried, and asserted-on-validated summed
  rather than the validated amount.
- `jest src/lib/tower/__tests__ src/components/tower/command-center/__tests__` → 145 pass / 21 fail
  across 6 suites. Baseline: 21 fail across 6 suites. Identical failure set; the +9 are this
  change's own.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean.
- `eslint` → clean, after removing a variable orphaned by the corrected gate mapping.

## Rollout Plan

Merge to `main` by squash; the ACA main deploy workflow builds and deploys. No migration, no data
build, no flag change.

## Rollback Plan

Revert the squash commit. Code-only. Reverting restores the 55-case heading, the duplicated gate
bar and the wrapped tab strip.

## Deployment Authority

- Repo-owned deploy workflow, unchanged. No `az` command in this release.
- Live signed-in proof required: yes — a capture showing the case count matching the portfolio, a
  gate chart without a repeated figure, and the tabs on one row.

## Audit Evidence

- The three-file diff.
- Verdict suite output and the baseline comparison.
- The live capture that surfaced all three: revision `ca-abarva-web-lab-eastus--m0683fd57`.

## Known Gaps

- Not live-proven; `candidate`.
- **The status pipeline stays empty until Layer 4 re-runs.** This change makes the emptiness
  legible; it does not populate it. The widened attributes reach the projection only after the
  documented purge → Layer 3 → Layer 4 sequence.
- The absent middle gate bar is explained by the note, not by a chart label: Recharts omits labels
  on zero-width bars, so a label there would not render. Worth revisiting if the bar ever needs to
  state its own absence.
