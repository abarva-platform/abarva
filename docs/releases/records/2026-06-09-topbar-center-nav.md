# 2026-06-09-topbar-center-nav — Center the product nav in the top bar

## Release ID
`2026-06-09-topbar-center-nav`

## Status
`candidate`

## Plain-English Summary
The authenticated top-bar product nav (Home · Intelligence · Moves · Source · Tower)
was sitting ~175px left of the bar's true center, so it read as unbalanced. This
makes it **true-centered** (Snowflake-style) by switching the header to a 3-column
grid (`1fr auto 1fr`) with the nav as the centered middle column, and moving the
active-client label (e.g. "SkyHarbor Air") beside the brand on the left so it no
longer pushes the menu off-center. Vertical alignment, fonts, colors, and the
active-pill treatment are unchanged (design system preserved).

## Layer Impact
- **global-control-lane**: presentational layout of the shared `AppTopBar`. No data,
  no behavior, no routing change.

## Client Applicability
- All clients (shared shell). Cosmetic only.

## Changes Included
- `src/components/shell/AppTopBar.tsx` — header → 3-col grid; nav `justifySelf:center`;
  tenant label moved into the brand group (left); right rail `justifySelf:end`.

## QA / Validation
**Result: pass.**
- Verified live by DOM-preview on the deployed app: menu center offset 0px (was -175px).
- eslint clean; tsc 0 errors in the changed file.
- Pre-existing shell-hygiene test failures (5) reproduce identically on clean
  origin/main and are unrelated (stale inline-label assertions); this change adds
  no new failures.

## Rollout Plan
Merge to `main`; ships with the normal Azure control-lane deploy. No migration.

## Rollback Plan
Revert the PR — single-file presentational change.

## Audit Evidence
- Before/after DOM centering measurement; PR + CI.

## Known Gaps
- The shell-hygiene tests that assert inline nav labels in AppTopBar are stale (labels
  live in `topbar-nav-items.ts`); pre-existing, out of scope here.
