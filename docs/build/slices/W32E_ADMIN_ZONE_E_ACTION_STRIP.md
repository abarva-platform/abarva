# W32E — Admin Zone E Action Strip View Model

**Wave:** Wave 32 — Agent Surface Completion
**Slice ID:** W32E
**Type:** view-model
**Status:** code_complete

## Purpose

Adds the `AdminActionStripView` read-model for the Admin Zone E (action strip).
The WIRE2 audit found Zone E is absent from the Admin page — no single top-priority
CTA is surfaced above fold.

## Files Added

- `src/lib/admin/admin-action-strip-view.ts` — view model functions
- `src/__tests__/integration/admin/admin-action-strip.test.ts` — 26 tests

## API Surface

```typescript
export function buildAdminActionStripView(tenantSlug: string): AdminActionStripView
export function getAvailableAdminActions(tenantSlug: string): AdminAction[]
export function getBlockedAdminActions(tenantSlug: string): AdminAction[]
```

## Data Contract (Apex Retail — 5 actions)

| Action | Category | Status | Owner |
|--------|----------|--------|-------|
| Review pending dataset approvals | dataset_approval | available | steward |
| Configure contract management connector | connector_setup | available | steward |
| Grant programme team access | user_access | available | steward |
| Complete production readiness review | production_readiness | blocked | steward |
| Architecture sign-off | architecture_review | deferred | atlas |

- `topPriorityAction` = first high-priority available action
- Blocked actions never have `deferredReason` (honest status)
- Deferred actions always have `deferredReason` explaining why
- `clickTarget` is null for actions not yet wired to routes

## WIRE2 Deviations Addressed

| Page | Deviation | Before | After |
|------|-----------|--------|-------|
| Admin | Zone E action strip absent | MEDIUM / unresolved | View model provides data contract |

## Tests

26 tests covering structure, all 5 action categories, available/blocked helpers, unknown tenant.
