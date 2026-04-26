# SHELL2 · Main Route Ownership Map and Legacy Shell Retirement Plan

**Wave:** wave-20
**Lane:** B
**Status:** code_complete
**Date:** 2026-04-26

---

## What This Slice Does

SHELL2 lands a deterministic, file-pure TypeScript data model that maps every
primary `(maestro)` route to its shell compliance status, tenant data richness,
legacy shell findings, and remediation action. It also documents the legacy
shell retirement plan for `TopBar.tsx` and `PrimaryNav.tsx`.

---

## Artifacts

| Artifact | Path |
|---|---|
| Data model | `src/lib/qa/main-route-ownership.ts` |
| Integration tests | `src/__tests__/integration/qa/main-route-ownership.test.ts` |
| Route ownership doc | `docs/build/MAIN_ROUTE_OWNERSHIP_AND_LEGACY_SHELL_RETIREMENT.md` |
| Slice contract | `docs/build/slices/SHELL2_ROUTE_OWNERSHIP_LEGACY_RETIREMENT.md` |

---

## Key Findings

- **TopBar and PrimaryNav are defined but unused.** Both legacy chrome
  components exist in `src/components/chrome/` but are not imported by any
  current route page. They are safe to delete in a follow-up slice.
- **10 of 13 routes are canonical.** All routes using named canon shell
  components (`ProgramCanonShell`, `SourceCanonShell`, `AdminCanonShell`)
  or the shared `AppChrome → MaestroChrome → AbarvaNav` layout are compliant.
- **2 routes are deferred.** `/tenant/[tenantSlug]/intelligence` and
  `/tenant/[tenantSlug]/tower` render bare `<main>` / `<div>` elements
  without a named page-level canon shell. The layout provides the nav but
  the pages lack a canonical framing wrapper.
- **1 route is unknown.** No dedicated `/source/events` list page was found.

---

## Exported API

```typescript
buildMainRouteOwnershipMap(): RouteOwnershipRecord[]
getRoutesNeedingRemediation(): RouteOwnershipRecord[]
summarizeRouteOwnership(): { total, canonical, legacy, mixed, unknown, deferred, highRisk }
```

---

## What This Slice Does NOT Do

- Does not modify any route page or component.
- Does not delete `TopBar.tsx` or `PrimaryNav.tsx` (deferred to SHELL3).
- Does not add missing canon shell components.
- Does not deploy, provision, or make live calls.
- Does not promote production_deployment status.

---

## Remediation Roadmap

| Priority | Action | Route |
|---|---|---|
| 1 | Delete `TopBar.tsx` + `PrimaryNav.tsx` | (global) |
| 2 | Create `IntelligenceCanonShell`, wrap page | `/tenant/[tenantSlug]/intelligence` |
| 3 | Create `TowerCanonShell`, wrap page | `/tenant/[tenantSlug]/tower` |
| 4 | Decide on `/source/events` list page | `/source/events` |

---

## Cross-References

- `docs/build/LEGACY_SHELL_NAV_AUDIT.md` — prior legacy nav audit
- `docs/build/ACTIVE_ROUTE_OWNERSHIP_MAP.md` — broader route ownership context
- `src/components/chrome/AppChrome.tsx` — canonical shell entry point
- `src/components/chrome/MaestroChrome.tsx` — canonical maestro chrome
