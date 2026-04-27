# ADMIN-DATA8 — `/admin/production-readiness` Wired to Adapter

## Metadata
- ID: ADMIN-DATA8
- Title: `/admin/production-readiness` consumes admin-production-readiness-adapter
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA2
- Estimated complexity: M

## Purpose
Replace the hardcoded `HISTORY_STRIP`, per-tile expansion content, and per-blocker drawer content in `src/lib/admin/production-readiness-page-view.ts` with adapter calls to `getAdminProductionReadiness(tenantSlug)` and `getAdminBlockerDetail(tenantSlug, id)`. Tabs + gate criteria stay deterministic.

## Context
Per ADMIN-DATA1 audit Section 2.7, the three readiness tiles (Demo / Pilot / Production) are computed at the adapter layer from cross-page state (datasets, connectors, blockers, agents). Per-blocker detail uses `admin_blockers` table (DATA10). History strip folds into `admin_audit_log` filtered by `category='readiness_state'`.

## Target state
- `production-readiness-page-view.ts` removes `HISTORY_STRIP`; calls adapter for tiles + blockers + history.
- W32F `BlockerDetail` drawer reads from adapter.
- ADMIN16 regression tests (74) green.
- `production_ready` flag never flipped — slice is read-only.

## Allowed files
- `src/lib/admin/production-readiness-page-view.ts`
- `src/app/(maestro)/admin/production-readiness/page.tsx`
- `src/lib/admin/__tests__/production-readiness-page-view.test.ts`
- `docs/build/slices/ADMIN-DATA8_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `src/lib/admin/data/**`
- `supabase/migrations/**`
- `docs/build/production-readiness.json` (cannot promote)
- Other admin page-views

## Implementation scope
1. Async view builder.
2. Call `getAdminProductionReadiness`, `getAdminBlockers`, `getAdminBlockerDetail`.
3. Tiles, gate criteria matrix, history strip, blocker drawer all data-driven.
4. Mark Resolved button stays HARD-GATED.

## Tests
- Adapter-mock tests; per-tab + per-tile assertions.

## Validation
Standard, plus assert that `production-readiness.json.production_ready` is unchanged (use git diff in CI).

## Acceptance criteria
1. No `HISTORY_STRIP` literal; tiles + blockers from adapter.
2. ADMIN16 regression tests (74) green.
3. URL searchParams preserved.
4. `production_ready: true` never set.
5. HARD-GATED actions still rendered disabled with reason.

## Risks
- Tile-status computation logic complexity — adapter encapsulates; page-view stays thin.

## Founder review
Visit `/admin/production-readiness`. Content identical in fixture mode. Live mode reflects real DB after DATA10 + `ADMIN_DATA_MODE=live`.
