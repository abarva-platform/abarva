# Active Route Ownership Map

Slice: DESROUTE1  
Wave: Wave 17A

Purpose: identify which files actually own high-impact routes and what shell/nav they render today so route-level enforcement work lands on mounted surfaces instead of unused components.

| Route | Active Route File | Active Component | Current Shell/Nav | Expected Canon Shell | Compliance | Required Remediation |
|---|---|---|---|---|---|---|
| `/platform/admin` | `src/app/(maestro)/platform/admin/page.tsx` | `AdminPortal` | `StewardAdminRail` + legacy dark sidebar | `AdminCanonShell` | legacy | Replace legacy sidebar shell with canonical admin shell wrapper. |
| `/platform/admin/architecture` | `src/app/(maestro)/platform/admin/architecture/page.tsx` | `ArchitecturePage` | `ArchitectureCanvas` + `ArchitectureOverviewPage` | `AdminCanonShell` | partial | Wrap in canonical admin shell with workflow orientation. |
| `/platform/admin/production-readiness` | `src/app/(maestro)/platform/admin/production-readiness/page.tsx` | `ProductionReadinessPage` | Decision flow + live panel | `AdminCanonShell` | partial | Wrap in canonical shell and preserve live refresh behavior. |
| `/platform/admin/build-progress` | `src/app/(maestro)/platform/admin/build-progress/page.tsx` | `FounderBuildProgressPage` | `BuildProgressDashboard` | `AdminCanonShell` | partial | Wrap in canonical shell and preserve admin guard/content. |
| `/source` | `src/app/(maestro)/source/page.tsx` | `SourceDashboardPage` | `SourceFoundationShell` | `SourceCanonShell` / canon-compliant source shell | partial | Validate canon markers and route workflow orientation. |
| `/source/events` | `src/app/(maestro)/source/events/page.tsx` | `SourceEventsPage` | `SourceFoundationShell` | `SourceCanonShell` / canon-compliant source shell | partial | Keep event index tied to commercial workflow progression. |
| `/source/events/[eventId]` | `src/app/(maestro)/source/events/[eventId]/page.tsx` | `SourceEventDetailPage` | `SourceFoundationShell` + commercial section | `SourceCanonShell` / canon-compliant source shell | partial | Keep commercial workflow clearly mounted in active event route. |
| `/tenant/[tenantSlug]/programs` | `src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx` | `TenantProgramsCanonicalPage` | `ProgramsCanonicalIndex` | `ProgramCanonShell` | partial | Wrap in canonical program shell without changing route behavior. |
| `/tenant/[tenantSlug]/programs/[programSlug]` | `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx` | `TenantProgramCanonicalPage` | `ProgramCanonicalDetail` | `ProgramCanonShell` | partial | Wrap in canonical program shell and keep journey/gate/evidence orientation. |

## Notes

- This map is deterministic and source-based (no browser automation).
- Compliance means route-shell compliance, not full functional completeness.
