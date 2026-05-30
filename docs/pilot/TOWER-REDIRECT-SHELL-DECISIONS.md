# Tower redirect-shell decisions — 2026-05-30

**Context:** Per the Tower module audit
(`docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md` §1.1 + §5.4), Tower carried 13
redirect-shell routes that signalled "we have not built this yet" when a
visitor wandered into the URL space. This slice — the Apple-grade Tower
polish PR — resolved every one.

Decision rule: **build it if the substrate exists, delete it otherwise**.
A redirect-shell that has nothing real to drill into is dead surface — it
inflates the route catalog and produces broken-looking dead URLs.

---

## Decisions

| Route | Decision | Rationale |
|---|---|---|
| `tower/lens/value/page.tsx` | **REMOVED** | Lens content lives on the index under `?lens=value`. No standalone substrate. |
| `tower/lens/cost/page.tsx` | **REMOVED** | Same. Surfaced via index. |
| `tower/lens/risk/page.tsx` | **REMOVED** | Same. `?lens=risk` on index. |
| `tower/lens/adoption/page.tsx` | **REMOVED** | Same. |
| `tower/lens/inventory/page.tsx` | **REMOVED** | Same. |
| `tower/activity/page.tsx` | **REMOVED** | The "activity log" link in the home tenant fixture now points to the Tower index, which already shows recent decisions through Atlas reasoning trace + program audit log surfaces. |
| `tower/outcomes/page.tsx` | **REMOVED** | The outcome ledger lives on `tower/portfolio` (per-Move value layers with projected / tracked / verified cells). Cross-module trace href updated to point there. |
| `tower/projects/page.tsx` | **REMOVED** | No projects substrate beyond the existing portfolio. The EnterpriseContextRow "Projects" card now links back to the index. |
| `tower/staff-aug/page.tsx` | **REMOVED** | No staff-aug substrate. Card links to index. |
| `tower/tech-stack/page.tsx` | **REMOVED** | No standalone tech-stack substrate beyond the AI Initiatives Registry. Card links to index. |
| `tower/volumetrics/page.tsx` | **REMOVED** | No volumetrics substrate. Card links to index. |
| `tower/preview/page.tsx` | **REMOVED** | Sandbox redirect to `/tower` — unnecessary indirection. |
| `preview/tower/page.tsx` | **REMOVED** | Public-preview sandbox indirection. Marketing flow now sends users straight to `/tower` after sign-in. |
| `tower/programs/[programId]/page.tsx` | **BUILT** | Replaced the `redirect('/tower?detail=…')` shell with a real Next.js route. Renders program detail via tenant-scoped `getProgramById`, surfaces the Tower decide-and-route action row (Fund / Pause / Kill), and breadcrumbs back into Tower → Portfolio. |
| `tower/pressures/[pressureId]/page.tsx` | **KEPT (redirect)** | Pressure detail is genuinely a same-page state in the Tower index — the index has an in-canvas pressure detail panel. The redirect remains as a deep-link affordance so `tower/pressures/PRESS-123` URLs that show up in audit logs or external systems still resolve. Not dead. |
| `tenant/[tenantSlug]/tower/page.tsx` | **KEPT (redirect)** | Performs real tenant access checks (`assertTenantAccess`) before redirecting to `/tower?client=…`. Not a dead redirect — it's a tenant-slug-resolution shim. |
| `tenant/[tenantSlug]/tower/[surface]/page.tsx` | **KEPT (redirect)** | Same pattern: tenant resolution + access assertion + redirect. |

---

## Counts

- **Before:** 13 redirect-shells + 11 substantive surfaces = 24 routes.
- **After:** 2 useful redirects (pressure deep-link + tenant resolution) +
  12 substantive surfaces (added the real `tower/programs/[programId]`) = 14
  routes.
- **Net:** −10 dead routes, +1 real drilldown, +1 audit-logged decide-and-route endpoint.

---

## Apex fixture

The Apex `Contact Center AI Routing` portfolio card was built directly off a
hardcoded fixture (`src/lib/tower/apex-contact-center-portfolio-fixture.ts`).
Per the broker-boundary rule
(`feedback_broker_boundary` memory: app-tier MUST NOT directly import
data-room / vector / graph), the app render-path should not import that
fixture unconditionally.

This slice does not delete the fixture (it underpins
`docs/strategy/scenarios/APEX-LOOP-WIRING-GAPS.md` GAP-4) but gates it behind
`TOWER_APEX_FIXTURE_ENABLED=1`. The pilot default leaves the flag off, so
Tower renders the honest empty state from `MovePortfolioCardPanel` until a
broker-backed portfolio read is wired through `AgentContextBroker`. The flag
is a temporary affordance for demo walkthroughs.

Follow-up: replace the fixture with a broker-backed query through the
`AgentContextBroker` contract and remove the env flag entirely.
