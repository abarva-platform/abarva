# 2026-07-20-moves-finder-shell-rail — Moves Finder-style phase rail (Phase 1-2 of MOVES-UI-001)

## Release ID

`2026-07-20-moves-finder-shell-rail`

## Status

`candidate`

## Plain-English Summary

Adds a macOS Finder-style visual rebuild of the Moves phase-navigation rail (grouped
Phases/Workspace sections, collapse/expand, a soft-blue selection tint, an amber dot for
phases with an unfinished authoritative draft, and a blocked-reason subtitle) behind a new,
off-by-default feature flag. When the flag is off, the rail renders identically to today —
no visible change for any user until explicitly enabled. This is Phase 1-2 of the
owner-approved MOVES-UI-001 shell rebuild (see `docs/backlog/moves-product-backlog.md`).

## Layer Impact

- **Presentation only.** `MovePhaseExplorer.tsx` gains a second render path
  (`MovePhaseExplorerFinderShell`) selected by a feature flag; the legacy render path
  (`MovePhaseExplorerLegacy`) is unchanged. No API routes, database schema, or gate/approval
  logic touched.

## Client Applicability

- All clients: no (flag off by default)
- Specific clients: none yet — `includeTenants: []`
- Internal only: no
- Public/demo only: no
- Feature flag: `moves_finder_shell_v1` (tenant policy, `src/lib/features/registry.ts`)

## Changes Included

- `src/lib/features/registry.ts` — new `moves_finder_shell_v1` flag definition
- `src/components/strategic-moves/MovePhaseExplorer.tsx` — new Finder-shell render path,
  legacy path preserved as `MovePhaseExplorerLegacy`; local error boundary falls back to
  legacy if flag resolution throws (e.g. no `ClerkProvider` in a test harness)
- `src/components/strategic-moves/MovePhaseExplorer.module.css` — new tokens scoped under
  `.finderShell` only
- `src/components/strategic-moves/__tests__/MovePhaseExplorer.finder-shell.test.tsx` — new
  test file (5 tests: flag-off parity, flag-on rail, collapse/expand, conditional
  draft-dot/blocked-subtitle)

## QA / Validation

- `npx eslint` on all touched files: clean
- New test file: 5/5 passing
- Full `strategic-moves` test directory: 105/105 passing (one pre-existing unrelated suite
  fails to parse — confirmed via `git stash` to predate this change, a known Clerk/ESM
  Jest-config issue)
- Scoped `tsc --noEmit`: no errors referencing changed files (repo-wide `tsc` is known to
  crash on this machine independent of this change; CI is authoritative)
- `git diff --stat` confirms only the 4 intended files changed

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow (squash merge, per repository
   ruleset).
2. Flag ships OFF (`includeTenants: []`) — zero behavioral change at deploy time.
3. Next step (not this release): enable for 1-2 proof tenants, live-verify signed-in, then
   consider default-on. Tracked as the "QA + rollout" step of MOVES-UI-001.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (only mutator of shared
  web traffic)
- Shared runtime mutators: none — this PR does not touch ACA revisions, images, or traffic
  directly; the standard main-deploy workflow picks it up
- Approved image digest: whatever the standard `aca-main-deploy` run produces for this
  merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
  (standard post-merge check)
- Worker image invariant: n/a (no worker changes)
- Feature/env flag update path: flag definition ships in code, default OFF; no env var
  change needed for this release
- Live signed-in proof required: not required for this release (flag is off for 100% of
  traffic); required before any tenant enablement in a future release

## Rollback Plan

Revert the merge commit, or simply leave the flag at `includeTenants: []` — since the flag
is off by default, no runtime rollback action is needed even without reverting the code.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `docs/backlog/moves-product-backlog.md` § MOVES-UI-001
- Reconciliation reference: `docs/specs/programs/moves-phase-shell-ui-backend-reconciliation.md`
