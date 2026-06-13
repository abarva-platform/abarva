# 2026-06-11-moves-home-simplification — simplify the Strategic Moves landing (the front-half of the Manage Moves spec)

## Release ID

`2026-06-11-moves-home-simplification`

## Status

`candidate`

## Plain-English Summary

The Manage Moves simplification spec had two halves. The **back half** (a
separate `/strategic-moves/manage` surface + archive/restore) shipped earlier in
#3409. The **front half — simplifying the landing page itself — was never
built**; the landing kept its dense layout (a "needs attention" block, an inline
Portfolio map, a Cards default, no filter chips, no List view) with only a
"Manage Moves" button added.

This change builds that missing front half to the provided wireframe:

- One mental model: **Moves = portfolio list**.
- Header gains the subtitle "Track active work, decisions, value, and approvals".
- Four summary cards: **Active · Need Attention · On Track · At Stake**.
- **Filter chips** — All / Needs attention / Awaiting decision / On track /
  **Archived** — with counts.
- A **search** box (name + code).
- **View menu defaulting to List** (a real table: Move · Phase · Status ·
  Sponsor · Value · Last activity · Open). Cards / Kanban / **Map** remain
  available behind the View menu, and an **"Open portfolio map"** link opens the
  Map view — the map is no longer shown inline by default.
- The standalone "needs attention" block and the always-on inline Portfolio map
  are removed; that information now lives in the Need-Attention card + the
  "Needs attention" chip + the Map view.

The Manage Moves page is re-pointed at the **same** list table (the spec's "no
duplicate row formats"), keeping its checkboxes, chips, selection bar, and
archive drawer.

## Layer Impact

- `global-control-lane`: Strategic Moves landing + Manage Moves UI; a shared
  presentational list table and pure filter/search/count helpers; the landing
  server fetch now includes archived rows so the Archived chip is real; the view
  preference adds a `list` option (now the default). No schema, no API change.

## Client Applicability

- All clients: yes — this is the Moves landing for every tenant. UI-only; no data
  or permission change. Existing Cards/Kanban/Map views are preserved.
- Feature flag: none (it is the intended default layout).

## Changes Included

- `move-list-format.ts` (NEW) — pure helpers: `isArchived`, `formatValueAtStake`,
  `relativeTime`, `filterByChip`, `searchMoves`, `chipCounts`, `summaryStats`,
  `MOVE_CHIPS`.
- `MoveListTable.tsx` (NEW) — shared list table; `selectable` mode adds leading
  checkboxes + select-all (Manage Moves), default mode adds an Open action.
- `StrategicMovesHomeClient.tsx` — rebuilt to the wireframe (subtitle, 4 cards,
  chips, search, View menu w/ List default, Open-portfolio-map link); chip+search
  filtering feeds every view; inline attention block + inline map removed.
- `ManageMovesClient.tsx` — uses the shared helpers + `MoveListTable`
  (selectable); chips/selection/drawer/restore/export unchanged.
- `strategic-moves/page.tsx` — fetch `includeArchived: true`, limit raised to 100
  for the list.
- `strategic-moves-preferences.ts` — `StrategicMovesListView` adds `'list'`;
  default view is now `'list'`.
- Tests: `__tests__/move-list-format.test.ts` (7 tests — chip filter, counts,
  summary cards, search, value/relative-time formatting).

## QA / Validation

- `npx tsc --noEmit`: clean (pre-existing `.next/dev` validator only).
- `npx eslint` on all changed files: clean.
- Jest: the 7 helper tests pass; the Strategic Moves suites pass except the
  pre-existing `BoardArtifactsPanel.test.tsx` failure (reproduces on `main`,
  unrelated).
- Hydration: `now` is seeded 0 on SSR/first render and set after mount, so the
  relative "last activity" labels can't cause a hydration mismatch.
- Live smoke after deploy: the landing renders 200 with the chips, the List
  table, and the four cards (to be confirmed on ACA post-deploy).

## Rollout Plan

Merge and deploy. UI-only; no migration. The `list` view becomes the default;
users with a saved Cards/Kanban/Map preference keep it.

## Rollback Plan

Shift ACA ingress to the prior revision — instant. No data change.

## Audit Evidence

- Branch: `feat/moves-home-simplification`.
- Spec source: the Manage Moves simplification design + the
  `moves-manage-wireframe` provided by the founder.

## Known Gaps

- The landing fetches up to 100 moves; a tenant with more would under-count the
  cards/chips (raise the limit or paginate when a portfolio approaches that).
- The wireframe's per-row kebab menu is not implemented (no real per-row menu
  actions beyond Open today); Open is the row action. Archive/restore remain on
  the Manage Moves surface.
- Sort UI was dropped from the landing (chips + search replace it); the list is
  value-desc by the persisted default.
