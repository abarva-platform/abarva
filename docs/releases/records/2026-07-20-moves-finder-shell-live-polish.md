# 2026-07-20-moves-finder-shell-live-polish — Finder-shell visual polish on the live Moves phase component

## Release ID

`2026-07-20-moves-finder-shell-live-polish`

## Status

`candidate`

## Plain-English Summary

Applies the approved Finder-style visual polish (navy phase labels instead of grey, a flat
pale-blue selection tint on the active phase, a small underline tab indicator) to the ACTUAL
live Moves phase workspace component, `MovesPhaseStandaloneClient.tsx`. This corrects a
same-day misdirection: an earlier pass (PR #5183) built equivalent visual work into a
component (`MovePhaseExplorer.tsx`) that is not mounted on the live route — see the
"Correction" note under MOVES-UI-001 in `docs/backlog/moves-product-backlog.md`. Gated behind
the same `moves_finder_shell_v1` flag, currently off for all tenants — no visible change to
any user until explicitly enabled.

## Layer Impact

- **Presentation only.** Additive CSS scoped under a new `.mxw-finder-on` ancestor selector
  (no existing bare `.mxw-*` rule modified), plus a small flag-gated wrapper
  (`FinderShellGate`/`FinderShellFlagReader`/`FinderShellErrorBoundary`) around the component's
  existing return statement that adds a conditional className/data-attribute. No state,
  data-fetching, tab logic, or approval/gate logic touched.

## Client Applicability

- All clients: no (flag off by default)
- Specific clients: none yet — `includeTenants: []`
- Internal only: no
- Public/demo only: no
- Feature flag: `moves_finder_shell_v1` (already registered; this PR does not change the flag
  definition, only consumes it)

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — flag-gated wrapper +
  scoped CSS additions (see diff; most of the line count is an unrelated local-prettier
  re-wrap of existing lines, confirmed via targeted grep that the functional change is ~15
  lines)
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 3 new
  tests (flag-off byte-parity, error-boundary fallback, flag-on class/attribute presence)

## QA / Validation

- `npx eslint`: clean on both touched files
- `npx tsc --noEmit -p tsconfig.json`: 0 errors project-wide
- `npx jest .../MovesPhaseStandaloneClient.test.tsx`: 24/24 passing (21 pre-existing + 3 new)
- Manually confirmed (via `git diff` + grep) that the large line-count diff is prettier
  re-wrapping, not unintended scope creep — isolated the real functional additions before
  merging

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. Flag ships OFF (`includeTenants: []`) — zero behavioral change at deploy time.
3. Next: enable for 1-2 proof tenants, live-verify signed-in on the real `/strategic-moves/[id]/phase/[n]` route, then consider default-on.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly — standard main-deploy workflow picks this up
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a
- Feature/env flag update path: flag already exists, default OFF, unchanged by this PR
- Live signed-in proof required: not required for this release (flag off for 100% of
  traffic); required before any tenant enablement

## Rollback Plan

Revert the merge commit, or leave the flag at `includeTenants: []` (no runtime action needed
even without reverting, since the flag is off by default).

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `docs/backlog/moves-product-backlog.md` § MOVES-UI-001 (see "Correction" note)
- Prior (now-superseded) release record: `docs/releases/records/2026-07-20-moves-finder-shell-rail.md`
