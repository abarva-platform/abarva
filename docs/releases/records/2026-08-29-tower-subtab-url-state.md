# 2026-08-29-tower-subtab-url-state — A Tower sub-view is linkable and survives reload

## Release ID

`2026-08-29-tower-subtab-url-state`

## Status

`candidate`

## Plain-English Summary

The six-tab shell shipped with sub-tab selection held in component state only. So
`/tower?tab=decisions` always opened on that tab's first sub-view regardless of which one a person
was actually looking at, and a link to a specific view could not be sent at all. In a review that
turns "look at this" into "click through to the thing I meant".

The sub-view is now carried in the URL as `view`. Choosing one updates the URL, opening a URL that
names one selects it, and changing tab resets to the new tab's first sub-view — or drops `view`
entirely for a tab that has none.

A `view` is only honoured when it belongs to the tab the URL names. A stale one carried over from a
different tab would select nothing and silently fall back to the default while still sitting in the
address bar, which reads as a bug to whoever sent the link.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 4 (products — Tower):** URL state only. No metric, value, projection or serving change.
- **Layer 3 and below:** untouched.

## Client Applicability

- All clients: yes — every tenant rendering `/tower`.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/components/tower/command-center/TowerCommandCenter.tsx`
- `src/components/tower/command-center/__tests__/subtab-url-state.test.tsx` (new)
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx` — two URL assertions
  updated, because tabs with sub-views now carry their default `view`.

## QA / Validation

- New suite → 5/5, covering all four behaviours plus the stale-`view` rejection.
- `jest src/lib/tower/__tests__ src/components/tower/command-center/__tests__` → 147 pass / 21 fail
  across 6 suites. Baseline: 21 fail across 6 suites. Identical failure set; the +6 are this
  change's own.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean.
- `eslint` on both changed files → clean.

## Rollout Plan

Merge to `main` by squash; the ACA main deploy workflow builds and deploys. No migration, no data
build, no flag change.

## Rollback Plan

Revert the squash commit. Code-only. Reverting returns sub-views to component state, so links to a
specific view stop working.

## Deployment Authority

- Repo-owned deploy workflow, unchanged. No `az` command in this release.
- Live signed-in proof required: yes — open a `?tab=…&view=…` URL and confirm it lands on that view.

## Audit Evidence

- The three-file diff.
- New-suite output and the baseline comparison above.

## Known Gaps

- Not live-proven; `candidate`.
- Sub-view state is replaced rather than pushed, so it does not create browser history entries. Back
  still moves between tabs, not between sub-views within one tab.
- Depends on #7029; merge that first.
