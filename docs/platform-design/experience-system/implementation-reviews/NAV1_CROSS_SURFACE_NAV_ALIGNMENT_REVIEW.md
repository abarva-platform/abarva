# NAV1 — Programs / Intelligence / Tower Nav Alignment Review

**Wave:** NAV1 — Canonical AbarVa Navigation and Active Shell Alignment
**Slice ID:** NAV1E
**Type:** docs
**Status:** code_complete

## Purpose

Audit the Programs, Intelligence, and Control Tower route trees and confirm
canonical shell adoption. No app code changes.

## Inventory — `(maestro)/tenant/[tenantSlug]/**` (canonical tenant tree)

| Route | Page shell | Logo treatment | Legacy chrome | Banned token |
|---|---|---|---|---|
| `/(maestro)/tenant/[t]` | `SeedTenantDashboard` (canonical seeded shell) | inherited | none | none |
| `/(maestro)/tenant/[t]/programs` | `ProgramCanonShell` | inherited | none | none |
| `/(maestro)/tenant/[t]/programs/[p]` | `ProgramCanonShell` | inherited | none | none |
| `/(maestro)/tenant/[t]/programs/[p]/phase/[n]` | `SeedPhaseOverview` (canonical seeded shell) | inherited | none | none |
| `/(maestro)/tenant/[t]/programs/[p]/deliverables/[d]` | `SeedDeliverableDetail` (canonical seeded shell) | inherited | none | none |
| `/(maestro)/tenant/[t]/intelligence` | `IntelligenceRouteShell` | inherited | none | none |
| `/(maestro)/tenant/[t]/intelligence/patterns/[k]` | `SeedTenantPattern` (canonical seeded shell) | inherited | none | none |
| `/(maestro)/tenant/[t]/tower` | `TowerRouteShell` | inherited | none | none |
| `/(maestro)/tenant/[t]/tower/[surface]` | `SeedTenantTowerSubsurface` + `VendorPortfolioSurface` | inherited | none | none |

## Inventory — `(maestro)/tower/**` (non-tenant tower routes)

| Route | Page shell | Logo treatment | Legacy chrome | Banned token |
|---|---|---|---|---|
| `/(maestro)/tower` | `EnterpriseContextRow` (page-level, not a chrome shell) | inherited | none | yes — page-body styling |
| `/(maestro)/tower/onboard` | (none) | inherited | none | none |
| `/(maestro)/tower/onboard/[d]` | (none) | inherited | none | none |
| `/(maestro)/tower/preview` | (none) | inherited | none | none |
| `/(maestro)/tower/projects` | (none) | inherited | none | yes — page-body styling |
| `/(maestro)/tower/staff-aug` | (none) | inherited | none | yes — page-body styling |
| `/(maestro)/tower/tech-stack` | (none) | inherited | none | yes — page-body styling |
| `/(maestro)/tower/volumetrics` | (none) | inherited | none | yes — page-body styling |

## Inventory — `(maestro)/intelligence/**` (non-tenant intelligence routes)

These routes predate the canonical tenant tree. They render via the
`(maestro)` layout's global nav and have page-body styling that includes
banned tokens (`#14B8A6` / `#0E9F8C`) for KPI accents and chart colors.
NAV1 records them as deferred — banned-token sweep is a NAV2 concern.

Routes inventoried (10): `/intelligence/ask`, `/intelligence/briefing`,
`/intelligence/kpis`, `/intelligence/kpis/[id]`, `/intelligence/library`,
`/intelligence/patterns`, `/intelligence/patterns/[k]`, `/intelligence/people`,
`/intelligence/topics/[t]`, `/intelligence/topics/[t]/[v]`.

All have `legacy chrome = none`. All inherit the global nav. Several
contain banned tokens in page bodies (chart accents, KPI cards).

## Inventory — `(maestro)/engagements/**` (legacy programs surface)

These routes are the older Programs surface that lives outside the tenant
tree. They will eventually retire in favor of `(maestro)/tenant/[t]/programs/**`.
NAV1 records the current state and defers banned-token cleanup to a
programs-consolidation wave.

## Findings

### Canonical shell adoption

- **Programs (tenant tree):** All four canonical tenant program routes use
  either `ProgramCanonShell` or `SeedRouteShell`'s `SeedPhaseOverview` /
  `SeedDeliverableDetail`. Both are canonical (navy single-accent, no
  banned tokens, no hand-coded wordmark).
- **Intelligence (tenant tree):** Both canonical tenant intelligence routes
  use `IntelligenceRouteShell` or `SeedTenantPattern`. Both are canonical.
- **Tower (tenant tree):** Both canonical tenant tower routes use
  `TowerRouteShell` or `SeedTenantTowerSubsurface` (which composes with
  `VendorPortfolioSurface`). Both are canonical.

### Legacy chrome

- No `<TopBar>` / `<PrimaryNav>` imports in any Programs / Intelligence /
  Tower route file (verified by string scan).

### Logo / wordmark

- No Programs / Intelligence / Tower page hand-codes the wordmark — all
  wordmark renders flow through the global nav, which uses the canonical
  `AbarVaLogo`.

### Banned tokens

- The canonical tenant tree (`(maestro)/tenant/[t]/**`) has **zero** banned
  tokens. This is the surface NAV1 explicitly asks to verify.
- The non-tenant routes (`(maestro)/tower/**`, `(maestro)/intelligence/**`,
  `(maestro)/engagements/**`) contain `#14B8A6` and `#0E9F8C` in page-body
  styling. These are page-content concerns (KPI accents, chart colors)
  outside NAV1's "WITHOUT changing page content" boundary. Recorded as
  deferred to a banned-token-sweep wave.

## Files Modified

None.

## Files Added

- `docs/platform-design/experience-system/implementation-reviews/NAV1_CROSS_SURFACE_NAV_ALIGNMENT_REVIEW.md` — this file.
- `docs/build/slices/NAV1E_CROSS_SURFACE_NAV_ALIGNMENT.md` — slice doc.

## Files Updated

- `docs/build/build-slices.json` — adds NAV1E entry.

## Validation

- `git diff --check` — clean (docs only).
- `npx tsc --noEmit` — no new errors.
- `npm run build` — passes.

## Risks

- None. No source files modified.

## Next

NAV1F — Nav regression guard.
