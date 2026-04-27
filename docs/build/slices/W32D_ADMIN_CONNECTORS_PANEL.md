# W32D — Admin Connectors Panel View Model

**Wave:** Wave 32 — Agent Surface Completion
**Slice ID:** W32D
**Type:** view-model
**Status:** code_complete

## Purpose

Adds `ConnectorsReadinessView` read-model for the Admin Connectors panel.
The WIRE2 audit found the Connectors tab is completely absent from the Admin sidebar.
This view model provides honest connector status — never claims live connectivity.

## Files Added

- `src/lib/admin/connectors-readiness-view.ts` — view model functions
- `src/__tests__/integration/admin/connectors-readiness.test.ts` — 23 tests

## API Surface

```typescript
export function buildConnectorsReadinessView(tenantSlug: string): ConnectorsReadinessView
export function getPilotBlockerConnectors(tenantSlug: string): ConnectorReadiness[]
```

## Data Contract (Apex Retail — 6 connectors)

| Connector | Status | Pilot Required | Prod Required |
|-----------|--------|----------------|---------------|
| ERP / Finance System | not_configured | No | Yes |
| Spend Analytics | deferred | No | No |
| Contract Management | configured_stub | Yes | Yes |
| Market Intelligence | not_configured | No | No |
| Vendor Portal | deferred | No | Yes |
| Identity (Clerk) | configured_stub | Yes | Yes |

- `overallStatus` is never `production_ready` from seed data
- Each connector has `stewardGuidance` explaining what is needed
- `not_configured` connectors always have a `blockerReason`
- `deferred` connectors always have a `deferredReason`

## WIRE2 Deviations Addressed

| Page | Deviation | Before | After |
|------|-----------|--------|-------|
| Admin | Connectors tab absent from sidebar | MEDIUM / unresolved | View model provides data contract |

## Tests

23 tests covering structure, apex-retail data contract, pilot blockers, meridian, unknown tenant.
