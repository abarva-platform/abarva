# 2026-07-21-moves-ui-004-origination-visual — Origination visual consistency (MOVES-UI-004)

## Release ID

`2026-07-21-moves-ui-004-origination-visual`

## Status

`candidate`

## Plain-English Summary

Extends the Finder-shell visual tokens (Fraunces headings, navy/blue/teal/amber palette) to
the P0 Origination wizard's main content (`StrategicMoveOriginateClient.tsx`) — the header,
tab strip, and question cards — so it reads as the same product as the phase-workspace pages.
This is typography/color only; the wizard's 7-step structure, validation, and submission logic
are unchanged. The rail on this same page already had the Finder-shell treatment (built
earlier in this program) — this closes the gap on the rest of the page. Gated behind the
existing `moves_finder_shell_v1` flag (currently on for Lakeshore, SkyHarbor, Meridian, First
Capital) — no visible change to any other tenant.

## Layer Impact

- **Presentation only.** New flag-gated wrapper (`OriginateFinderShellGate` — same
  error-boundary + `useFeature` pattern already used elsewhere in this program) adds a
  conditional `finderShellOn` class to the page root. All new CSS is nested under
  `.finderShellOn` in the shared `StrategicMoves.module.css` — no existing bare/global
  selector was touched, so other consumers of that stylesheet
  (`MoveListTable.tsx`, `MoveToSourceHandoffCta.tsx`, `StrategicMovesHomeClient.tsx`,
  `ManageMovesClient.tsx`) are unaffected (confirmed — their tests are in the full passing
  suite below). No data-flow, validation, or submission logic changed.

## Client Applicability

- All clients: no
- Specific clients: Lakeshore, SkyHarbor, Meridian, First Capital (existing
  `moves_finder_shell_v1` tenants — unchanged by this PR)
- Internal only: no
- Public/demo only: no
- Feature flag: `moves_finder_shell_v1` (no change to the flag definition)

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` — flag-gated wrapper,
  conditional `finderShellOn` class
- `src/components/strategic-moves/StrategicMoves.module.css` — new CSS scoped entirely under
  `.finderShellOn` (header, tab strip, question cards)
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx` — 3 new
  tests: flag-off byte-parity, flag-on renders the new class/restyled elements, flag-on doesn't
  change wizard promotion logic

## QA / Validation

- `npx eslint`: clean
- `npx jest StrategicMoveOriginateClient.test.tsx`: 8/8 passing (5 pre-existing + 3 new)
- Full `strategic-moves` suite: 124/124 passing (1 pre-existing unrelated Clerk/Jest-transform
  failure, confirmed via `git stash` to predate this change)
- `tsc --noEmit`: no errors attributable to touched files
- Flag-off byte-parity verified explicitly by test assertion on the root `className`

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change needed — ships to the same tenants already seeing
   `moves_finder_shell_v1`.
3. Live signed-in click-through of the Origination screen recommended on First Capital before
   considering this fully proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a
- Feature/env flag update path: no flag/env change in this PR
- Live signed-in proof required: yes, recommended before default-on; not yet completed

## Rollback Plan

Revert the merge commit, or set `moves_finder_shell_v1`'s `includeTenants` back to `[]`.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `docs/backlog/moves-product-backlog.md` § MOVES-UI-004
