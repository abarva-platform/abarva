# W32F — Production Readiness Blocker Detail Drawer View Model

**Wave:** Wave 32 — Agent Surface Completion
**Slice ID:** W32F
**Type:** view-model
**Status:** code_complete

## Purpose

Adds `BlockerDetailDrawerView` read-model for the Production Readiness blocker detail drawer.
The WIRE2 audit found the blocker detail drawer is not implemented — blueprint requires that
clicking a blocker opens a detail drawer with resolution guidance.

## Files Added

- `src/lib/admin/blocker-detail-view.ts` — view model functions
- `src/__tests__/integration/admin/blocker-detail.test.ts` — 29 tests

## API Surface

```typescript
export function buildBlockerDetailDrawerView(blockerId: string, tenantSlug: string): BlockerDetailDrawerView
export function getAllBlockerDetails(tenantSlug: string): BlockerDetail[]
export function getCriticalBlockers(tenantSlug: string): BlockerDetail[]
```

## Data Contract (Apex Retail — 4 blockers)

| Blocker | Severity | Owner | Pilot Impact | Prod Impact |
|---------|----------|-------|--------------|-------------|
| Evidence upload connector not wired | critical | engineering | Yes | Yes |
| Model gateway not configured | critical | founder | No | Yes |
| Connector stubs — no live data ingestion | high | steward | Yes | Yes |
| SOC2 certification pending | high | founder | No | Yes |

- No blocker is marked resolved — all are open as of seed state
- `estimatedResolutionPath` is always honest about timeline/effort
- `relatedBlockers` surfaces contextually related blockers in the drawer
- `pilotImpact` and `productionImpact` are independently tracked

## WIRE2 Deviations Addressed

| Page | Deviation | Before | After |
|------|-----------|--------|-------|
| Production Readiness | Blocker detail drawer not implemented | MEDIUM / unresolved | View model provides data contract |

## Tests

29 tests covering getAllBlockerDetails, getCriticalBlockers, buildBlockerDetailDrawerView for
valid blockers, unknown blockers, and specific apex-retail content assertions.
