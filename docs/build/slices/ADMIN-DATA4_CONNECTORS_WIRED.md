# ADMIN-DATA4 — `/admin/connectors` Wired to Adapter

## Metadata
- ID: ADMIN-DATA4
- Title: `/admin/connectors` consumes admin-connectors-adapter
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA2
- Estimated complexity: M

## Purpose
Replace the hardcoded `APEX_DETAIL_SEEDS` and `MERIDIAN_DETAIL_SEEDS` per-tenant connector dictionaries in `src/lib/admin/connectors-page-view.ts` with calls to `admin-connectors-adapter`. Per-connector vendor / status / config schema / blocker reason / sync attempts / health trend all flow through the adapter.

## Context
Per ADMIN-DATA1 audit Section 2.4, admin connectors need a new `admin_connectors` table (DATA10). Existing `data_integrations` is Tower-shaped and lacks `required_for_pilot`, `required_for_production`, `blocker_reason`, `steward_guidance`, admin connector kind taxonomy. `admin_connectors.data_integration_id` foreign-keys to existing Tower row so `integration_health` can supply the health trend.

## Target state
- `connectors-page-view.ts` removes `APEX_DETAIL_SEEDS` + `MERIDIAN_DETAIL_SEEDS` from inline data; calls `getAdminConnectors(tenantSlug)` + `getAdminConnectorDetail(tenantSlug, connectorId)`.
- `CATEGORY_LABELS`, `CATEGORY_ORDER`, `HARD_GATE_REASON` stay deterministic.
- Page route at `src/app/(maestro)/admin/connectors/page.tsx` awaits async builder.
- ADMIN13 regression tests (70) still pass.

## Allowed files
- `src/lib/admin/connectors-page-view.ts`
- `src/app/(maestro)/admin/connectors/page.tsx`
- `src/lib/admin/__tests__/connectors-page-view.test.ts`
- `docs/build/slices/ADMIN-DATA4_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `src/lib/admin/data/**`
- `supabase/migrations/**`
- Other admin page-views

## Implementation scope
1. Make `buildConnectorsPageView(tenantSlug)` async.
2. Replace `APEX_DETAIL_SEEDS[tenantSlug]` lookup with `await getAdminConnectors(tenantSlug)`.
3. Replace per-connector detail with `await getAdminConnectorDetail(tenantSlug, id)`.
4. Update page route.
5. Update tests to use adapter mocks.

## Tests
- Adapter-mock tests; fixture parity test asserts pages render identical content to current.
- Test detail drawer drill-down uses adapter.

## Validation
Standard: tsc, test suite, build, hygiene gate.

## Acceptance criteria
1. No `APEX_DETAIL_SEEDS` or `MERIDIAN_DETAIL_SEEDS` in `connectors-page-view.ts`.
2. View builder async + adapter-driven.
3. ADMIN13 regression tests (70) green.
4. URL searchParams contract preserved.
5. Banned-token sweep clean.

## Risks
- `data_integrations` ↔ `admin_connectors` foreign key only resolved post-DATA10 → adapter falls back to fixture for health trend until then.

## Founder review
Visit `/admin/connectors?tenant=apex-retail` — content identical in fixture mode. Same for `/admin/connectors?tenant=meridian-bank`.
