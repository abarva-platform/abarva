# 2026-08-29-tower-six-tab-shell — Mount the designed panels behind the design's six tabs

## Release ID

`2026-08-29-tower-six-tab-shell`

## Status

`candidate`

## Plain-English Summary

The Tower shell now carries the six tabs of the approved design, and the ten ported panels are
mounted behind them. Until now those panels were deployed but referenced by nothing, so none of the
redesign was visible.

The tab **chrome** is untouched — same grid, 6px gap and radius, `#f1efe8` resting and `#0f6e56`
filled, 14.5px 500 to 700, 120ms transition. Only the set and the labels change, from surface names
to the questions a CXO is actually asking: *Today's verdict · Where the money goes · AI bets ·
Tools · What must happen next · Foundations.*

Nothing was dropped. `CommandCenterView` — the decision rail and the value-loss waterfall — moves
to **What must happen next → Decisions for this review**, which is where the design places
decisions. Every old tab id still resolves through `TAB_ALIASES`, so existing links and the sunset
URLs keep working.

## Two defects found and fixed while doing it

**A metric substitution in `VerdictPanel`.** It read
`aiAttributedInitiativeSpendUsd || aiTaggedUsd` — two different measures joined by `||`, carried
over from the panel it replaces. The `||` fires on a legitimate `0`, hiding "no AI spend
attributed" behind a tagged total. It now reads one declared metric.

**The six-tab change made the page unclickable from any stale link.** With `tab=executive` now an
*alias* for `verdict`, `urlTab !== normalized` is permanently true, so the URL-sync effect's
early-return never fired. Because `useRouter()` returns a new object on every render, the effect
re-ran and reset the tab on every render: from any bookmark or sunset URL, clicking a tab did
nothing. The guard now tracks the raw URL value rather than the normalized one, and the ref starts
`null` so the first normalisation still runs.

The second was caught by `does not let a stale URL tab value undo a local tab click`, which is the
reason the 17 shell tests were reworked one at a time rather than updated in bulk.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 4 (products — Tower):** the shell's tab set and the panels mounted behind it. No metric,
  value, projection or serving view changes.
- **Layer 3 and below:** untouched.

## Client Applicability

- All clients: yes — every tenant rendering `/tower` sees the six-tab shell and the designed panels.
- Specific clients: none singled out.
- Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/components/tower/command-center/TowerCommandCenter.tsx` — six-tab set, sub-tab model and
  strip, panel routing, URL-sync fix.
- `src/components/tower/command-center/views/VerdictPanel.tsx` — remove the metric substitution.
- `__tests__/TowerCommandCenter.test.tsx` — 17 tests relocated to the panels' new homes.
- `__tests__/render-harness.test.tsx` — navigation updated for the new tabs.

## QA / Validation

- `TowerCommandCenter.test.tsx` → 18/18. Every behavioural guarantee preserved, each asserted where
  its content now renders: no metric substitution, distinct claim populations, drawer routing, the
  honest empty state, keyboard navigation, stale-URL normalisation.
- `jest src/lib/tower/__tests__ src/components/tower/command-center/__tests__` → 142 pass / 21 fail
  across 6 suites. Baseline measured on clean `main` in the same run: 141 pass / 21 fail, 6 suites.
  **Identical failure count and suite set**, +1 net passing.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean.
- `eslint` on all changed files → clean.
- Rendered through the repo's harness and read back from the emitted HTML: all six tabs present in
  order, the Verdict panel's four cards and three rules rendering, and an absent gate value showing
  as absent rather than a zero-width bar.

## Rollout Plan

Merge to `main` by squash; the ACA main deploy workflow builds and deploys. No migration, no data
build, no flag change, no env change.

## Rollback Plan

Revert the squash commit. Code-only, immediate, no schema or data change. Reverting restores the
four-tab shell and unmounts the designed panels — including reinstating the URL-sync guard that
makes the page unclickable from a stale link, so revert only for an unrelated regression.

## Deployment Authority

- Repo-owned deploy workflow, unchanged. No `az` command in this release.
- Live signed-in proof required: yes — a signed-in `/tower` capture showing the six tabs and the
  Verdict panel against Meridian data.

## Audit Evidence

- The four-file diff.
- `TowerCommandCenter.test.tsx` output (18/18) and the same-run baseline comparison above.
- Harness-rendered HTML showing the six tabs and the Verdict panel.
- Post-deploy: ACA runtime invariant proof and a signed-in `/tower` capture.

## Known Gaps

- **Not live-proven yet.**
- Sub-tab selection is component state, not in the URL, so a sub-tab cannot be linked to or
  restored on reload. Worth adding once the tab set settles.
- 22 of the design's 32 panels remain unported; several sub-tabs are therefore partially filled.
- Two pre-existing failures remain in `css-contract.test.ts` (four undeclared classes and a missing
  `min-width: 0`), untouched and unrelated.
