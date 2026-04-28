# NAV1E — Programs / Intelligence / Tower Nav Alignment

**Wave:** NAV1
**Slice ID:** NAV1E
**Type:** docs
**Status:** code_complete

## Purpose

Document canonical-shell adoption for the Programs, Intelligence, and Control
Tower routes. No app code changes.

## Findings

- Canonical tenant tree (`(maestro)/tenant/[t]/**`) — **all routes canonical**.
  Programs use `ProgramCanonShell`, Intelligence uses `IntelligenceRouteShell`,
  Tower uses `TowerRouteShell`. Deeper detail/phase routes use the
  `SeedRouteShell` family (also canonical). Zero banned tokens, zero legacy
  chrome, zero hand-coded wordmarks.
- Non-tenant routes (`(maestro)/tower/**`, `(maestro)/intelligence/**`,
  `(maestro)/engagements/**`) — inherit the global nav. No legacy chrome
  imports. No hand-coded wordmarks. Banned tokens (`#14B8A6` / `#0E9F8C`)
  remain in page-body styling — recorded as deferred (page-content concern,
  outside NAV1 scope).

## Files Added

- `docs/platform-design/experience-system/implementation-reviews/NAV1_CROSS_SURFACE_NAV_ALIGNMENT_REVIEW.md`
- `docs/build/slices/NAV1E_CROSS_SURFACE_NAV_ALIGNMENT.md` — this file.

## Files Updated

- `docs/build/build-slices.json` — NAV1E entry.

## Validation

- `git diff --check` — clean.
- `npx tsc --noEmit` — clean.
- `npm run build` — pass.
