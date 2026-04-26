# Legacy Shell / Nav Audit (DESROUTE2)

## Purpose
- Identify shell, nav, toolbar, and style artifacts that can keep legacy route chrome active.
- Provide safe remediation guidance without deleting files or changing route behavior in this lane.

## Banned Design Pattern List
- `dark-toolbar-dominant`
- `teal-heavy-accent`
- `purple-heavy-accent`
- `neon-cyber-gradient`
- `emoji-first-nav-icons`

## Legacy Findings
| ID | Category | File | Active Route | Risk | Canonical Replacement | Safe Change |
| --- | --- | --- | --- | --- | --- | --- |
| `legacy-admin-rail-shell` | legacy shell component | `src/app/(maestro)/platform/admin/page.tsx` | `/platform/admin` | high | `@/components/admin/AdminCanonShell` | Wrap existing admin content in canon shell, preserve auth/guards. |
| `legacy-admin-rail-component` | legacy nav pattern | `src/components/admin/StewardAdminRail.tsx` | `/platform/admin` | high | `@/components/admin/AdminRouteChrome` | De-import legacy rail from active admin routes. |
| `legacy-program-toolbar-css` | legacy toolbar pattern | `src/app/programs/programs.css` | n/a (legacy route support) | medium | `@/components/programs/ProgramCanonShell` | Keep file for compatibility, avoid importing toolbar in canonical routes. |
| `legacy-program-detail-route` | legacy route binding | `src/app/programs/[programId]/page.tsx` | `/programs/[programId]` | medium | `@/components/programs/ProgramCanonicalDetail` | Keep legacy route documented; tenant-scoped program routes remain canonical. |
| `legacy-home-wordmark-import` | legacy nav pattern | `src/components/home/AgenticHomeEntry.tsx` | `/` | low | `@/components/abarva/AbarVaWordmark` | Prefer direct wordmark import to avoid implicit top-nav coupling. |
| `legacy-intelligence-toolbar-css` | legacy toolbar pattern | `src/app/intelligence/intelligence.css` | `/intelligence` | low | `@/components/abarva/AbarVaShellNav` | Keep legacy style dormant; do not reuse toolbar classes in canon surfaces. |

## Recommended Sequence
1. Enforce canon shell imports on active admin/source/program routes.
2. De-import legacy nav wrappers from active route files (deprecate without deleting).
3. Keep legacy files for compatibility until all active routes are verified via QA26.

## Scope Guard
- No route edits in DESROUTE2.
- No deletions in DESROUTE2.
- Audit only.

