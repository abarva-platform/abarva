# Main Route Ownership Map and Legacy Shell Retirement Plan

**SHELL2 · Wave 20 · Lane B**
**Date:** 2026-04-26

---

## Summary

This document maps every primary product route to its shell compliance status,
data richness, and remediation action. It also documents the legacy shell
retirement findings for `TopBar.tsx` and `PrimaryNav.tsx`.

---

## Legacy Shell Findings

| Component | File | Status |
|---|---|---|
| `TopBar` | `src/components/chrome/TopBar.tsx` | Defined but **not imported** by any current route page |
| `PrimaryNav` | `src/components/chrome/PrimaryNav.tsx` | Defined but **not imported** by any current route page |

**Finding:** `TopBar` and `PrimaryNav` are legacy components that exist in
`src/components/chrome/` but are no longer referenced by any route page in the
`(maestro)` group or the marketing root. The current canonical nav is
`AbarvaNav` (used via `MaestroChrome` in the shared layout).

**Retirement action:** Both files are safe to delete. A dedicated cleanup slice
(SHELL3 or similar) should remove them and confirm no remaining imports.

---

## Route Ownership Table

| Route Pattern | Route File | Page Component | Shell Compliance | Data Richness | Risk | Remediation |
|---|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` | `MarketingRootPage` | canonical | not_seeded | low | No action needed |
| `/home` | `src/app/(maestro)/home/page.tsx` | `HomePage` | canonical | partial | low | No action needed |
| `/tenant/[tenantSlug]/programs` | `src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx` | `TenantProgramsCanonicalPage` | canonical | rich | low | No action needed |
| `/tenant/[tenantSlug]/programs/[programSlug]` | `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx` | `TenantProgramCanonicalPage` | canonical | rich | low | No action needed |
| `/source` | `src/app/(maestro)/source/page.tsx` | `SourceDashboardPage` | canonical | partial | low | No action needed |
| `/source/events` | _(no dedicated page found)_ | _(none)_ | unknown | partial | medium | Verify if a standalone list page is needed; create using `SourceCanonShell` |
| `/source/events/[eventId]` | `src/app/(maestro)/source/events/[eventId]/page.tsx` | `SourceEventDetailPage` | canonical | partial | low | No action needed |
| `/tenant/[tenantSlug]/intelligence` | `src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx` | `TenantIntelligencePage` | deferred | thin | medium | Wrap in `IntelligenceCanonShell` for consistent page-level framing |
| `/tenant/[tenantSlug]/tower` | `src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx` | `TenantTowerSeedPage` | deferred | thin | medium | Wrap in `TowerCanonShell` for consistent page-level framing |
| `/platform/admin` | `src/app/(maestro)/platform/admin/page.tsx` | `AdminPortal` | canonical | shell_only | low | No action needed |
| `/platform/admin/architecture` | `src/app/(maestro)/platform/admin/architecture/page.tsx` | `ArchitecturePage` | canonical | shell_only | low | No action needed |
| `/platform/admin/production-readiness` | `src/app/(maestro)/platform/admin/production-readiness/page.tsx` | `ProductionReadinessPage` | canonical | shell_only | low | No action needed |
| `/platform/admin/build-progress` | `src/app/(maestro)/platform/admin/build-progress/page.tsx` | `BuildProgressPage` | canonical | shell_only | low | No action needed |

---

## Compliance Distribution

| Status | Count |
|---|---|
| canonical | 10 |
| deferred | 2 |
| unknown | 1 |
| legacy | 0 |
| mixed | 0 |

---

## Shell Architecture

All `(maestro)` group routes inherit the canonical AbarVa shell via:

```
src/app/(maestro)/layout.tsx
  └── AppChrome
        └── MaestroChrome (or ClientChrome for client viewers)
              └── AbarvaNav  ← canonical nav
```

No route page in the `(maestro)` group imports `TopBar` or `PrimaryNav` directly.

---

## Canon Shell Components in Use

| Shell Component | Used By |
|---|---|
| `ProgramCanonShell` | Programs routes |
| `SourceCanonShell` | Source routes |
| `AdminCanonShell` | All `/platform/admin/*` routes |
| `AbarvaNav` (via layout) | All `(maestro)` routes |

---

## Retirement Priority

1. **Delete `TopBar.tsx` and `PrimaryNav.tsx`** — safe, no current imports.
2. **Add `IntelligenceCanonShell`** — wrap `/tenant/[tenantSlug]/intelligence` page content.
3. **Add `TowerCanonShell`** — wrap `/tenant/[tenantSlug]/tower` page content.
4. **Resolve `/source/events` list page** — confirm if a dedicated route is needed.

---

## Notes

- `deterministicSeed: true` is set on all records in the data model.
- Data richness for apex-retail programs routes is `rich` (4 seeded programs).
- Meridian and Arcturus routes are `thin` / `shell_only` per the demo seed plan.
- This document is generated from `src/lib/qa/main-route-ownership.ts`.
