# NAV1A — Nav and Shell Inventory Audit

**Wave:** NAV1 — Canonical AbarVa Navigation and Active Shell Alignment
**Slice ID:** NAV1A
**Type:** docs (audit)
**Status:** code_complete

## Purpose

Inventory the current AbarVa nav, shell, and wordmark usage across every active
route. Identify safe auto-fixes, items requiring founder decision, and the
implementation plan for NAV1B–NAV1G. No app code changes.

## Files Added

- `docs/platform-design/experience-system/implementation-reviews/NAV1_NAV_SHELL_INVENTORY_AUDIT.md`
  — full audit document (executive summary, route inventory, legacy chrome
  inventory, wordmark coverage, wireframe coverage, safe-fix list, deferral
  list, next slice plan).
- `docs/build/slices/NAV1A_NAV_SHELL_INVENTORY_AUDIT.md` — this file.

## Files Modified

- `docs/build/build-slices.json` — adds `NAV1A` entry.

## Key Findings

- 100 active page files inventoried.
- Every (maestro) route flows through `AppChrome → MaestroChrome → AbarvaNav`
  (legacy global nav). Canonical `AbarVaShellNav`, `AbarVaTopNav`, and
  `AbarVaAppShell` are correctly authored but not yet wired into any active
  route.
- `SourceCanonShell`, `ProgramCanonShell`, `IntelligenceRouteShell`,
  `TowerRouteShell`, and `AdminCanonShell` are page-level orientation strips
  (not global nav replacements) and are correctly applied.
- `AbarVaLogo` (`src/components/brand/AbarVaLogo.tsx`) is the canonical
  wordmark. Every in-app wordmark renders through it (directly or via the
  `AbarvaWordmark` shim).
- Banned tokens (`#14B8A6` teal) appear in `AbarvaNav.tsx` and
  `ClientChrome.tsx`. Removing them is a runtime change deferred to NAV2.
- No `<TopBar>` or `<PrimaryNav>` imports remain in `src/app/`.

## Validation

- `git diff --check` — clean (docs only).
- `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8'))"` — ok.
- `npx tsc --noEmit` — no new errors (no source files touched).
- `npm run build` — passes (no source files touched).

## Risks

- None. Docs-only slice.

## Next

- NAV1B — Canonical brand/nav component alignment (additive tests + docs).
