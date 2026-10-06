# 2026-10-03-moves-ava-left-dock — Moves: aVa docked to the left on desktop

## Release ID

`2026-10-03-moves-ava-left-dock`

## Status

`candidate`

## Plain-English Summary

In the Moves phase workspace aVa was a floating "Ask aVa" bubble in the
bottom-right corner that the user had to click to open. The Source new-event
workflow keeps aVa always visible on the left; this brings Moves in line.

On desktop (viewport ≥ 1281px) aVa is now a persistent panel docked to the left
edge, always visible, and the phase workspace shifts right to clear it. Below
1281px nothing changes — aVa stays the floating button + popover, which is the
right behavior on narrow/tablet/phone widths. No change to aVa's content, the
chat, drafting, or any handler — only where the panel sits and that it is always
open on desktop.

## Layer Impact

Release lane: `global-control-lane` — shared app/control-plane behavior for all
clients, not feature-gated.

- `4 PRODUCTS` (Moves): CSS-only presentation change. No change to layer 1–3,
  and none to aVa logic, capture, gates, or artifacts.

## Client Applicability

- All clients: Yes — shared Moves phase UI, no feature flag.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Added a `@media (min-width:1281px)` block: docks `.mxw-ava-pop` to the left
    (fixed, full height), hides the FAB, and shifts `.mxw-surface` right by
    312px. No JSX/logic change; the same panel element is restyled.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Extended the aVa stylesheet guard to assert the desktop dock rule and the
    surface shift are present.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 117/117 pass.
- `npx eslint` on both changed files — 0 errors (2 pre-existing unused-var
  warnings, unrelated).
- Visual: NOT verified locally (no signed-in data-backed render off the private
  data plane). The desktop dock, the surface clearance, and the narrow-screen
  fallback are owed a live signed-in walk at deploy time.

## Rollout Plan

Merge to `main` via squash PR. No migration, no data-plane change, no flag.
Ships with the next ACA web image via the repo-owned `aca-main-deploy` workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: set by the main deploy workflow at build time
- ACA runtime invariant: unchanged by this PR; proven at deploy time
- Worker image invariant: n/a
- Feature/env flag update path: none
- Live signed-in proof required: Yes — a signed-in walk on a desktop-width
  viewport confirming aVa docks left, the workspace clears it, and a narrow
  viewport still shows the floating FAB/popover. Captured at deploy time.

## Rollback Plan

Revert the PR. Pure CSS revert; no data or migration involved.

## Audit Evidence

- PR URL: (added on open)
- CI run: (added on open)
- Local test/lint output recorded under QA / Validation.

## Known Gaps

- Visual confirmation owed at deploy (above). If spacing/width needs tuning once
  seen signed-in, that is a fast follow.
- On desktop the left column now shows the aVa dock and the workspace rail side
  by side; folding the workspace nav fully into the top tabs (so the left is
  aVa alone, as in Source New) is a later slice.
