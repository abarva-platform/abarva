# LIVE2 · Demo Tenant Route Verification

**Status:** code_complete
**Category:** qa
**Wave:** wave-13
**Branch:** live/live2-demo-tenant-route-verification
**Created:** 2026-04-26
**Completed:** 2026-04-26

## What was built

`src/lib/qa/demo-tenant-route-verification.ts` — deterministic route inventory read model for demo tenants. Exports `TenantRouteValidationStatus`, `TenantRouteRecord`, `DemoTenantRouteManifest` types, and `buildDemoTenantRouteManifest()` builder function.

The manifest covers 10 routes across two demo tenants:

- **apex-retail** (7 routes): programs list, contact-center-ai program detail, cdp program detail, tower, tower/signals, intelligence, intelligence/patterns/contact-center-ai
- **meridian** (3 routes): programs, intelligence, tower

Each route record captures:
- Surface classification (`programs` | `tower` | `intelligence` | etc.)
- Expected React component and TypeScript read model contract
- Expected primary agent (Nexus / Atlas / Sentinel)
- Validation status (`verified` | `needs_review` | `deferred` | `not_run`)
- Known caveat describing demo data constraints
- Fallback route for graceful degradation

## Test coverage

`src/__tests__/integration/qa/demo-tenant-route-verification.test.ts` — 18 deterministic, file-pure Jest assertions covering:

- Manifest shape and schema version
- `generatedAt` literal value
- Tenant array membership
- Derived count correctness (`totalRoutes`, `verifiedRoutes`, `deferredRoutes`)
- Per-route field presence (tenantSlug, route, expectedComponent, expectedReadModel, knownCaveat, fallbackRoute)
- Valid `TenantRouteValidationStatus` on every record
- All route strings start with `/`
- Minimum tenant coverage (apex-retail ≥ 5, meridian ≥ 2)
- No duplicate `(tenantSlug, route)` pairs
- Determinism across two builder calls

## Honest constraints

- No real HTTP calls, no browser automation, no server startup.
- `generatedAt` is a literal string `'2026-04-26'` — not a runtime timestamp.
- Route existence is asserted by manifest contract; actual HTTP 200 verification requires a running server and is explicitly deferred.
- Apex seed data covers all 7 apex-retail routes; live DB required for real program state.
- Meridian is Intelligence-demo-primary; tower and programs routes carry `needs_review` status pending seed confirmation.
