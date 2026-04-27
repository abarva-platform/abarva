# ADMIN-DATA2 — Adapter Contracts + Types + Fixture Mode

## Metadata
- ID: ADMIN-DATA2
- Title: Adapter Contracts + Types + Fixture Mode (Foundation)
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA1
- Estimated complexity: L

## Purpose
Ship the foundation of the admin data layer: 9 adapter modules under `src/lib/admin/data/` containing TypeScript types + async function signatures + dual-mode (real DB / fixture) implementations. No admin page-view consumes these yet — DATA3-9 do that. This slice exists to unblock 7 parallel page-wiring lanes against typed contracts.

## Context
Per ADMIN-DATA1 audit Section 4, the adapter pattern from `src/lib/source/commercial-mission-adapter.ts` is canonical: server-only async functions, typed read-models, fixture coexistence. ADMIN-DATA2 implements that shape for 9 admin domains. Migrations have not landed yet (DATA10), so every adapter starts in fixture mode by default; the call shape is identical for fixture vs real-DB so DATA3-9 do not need to change when DATA10 lands.

## Target state
- `src/lib/admin/data/` directory contains:
  - `admin-overview-adapter-types.ts` + `admin-overview-adapter.ts`
  - `admin-users-adapter-types.ts` + `admin-users-adapter.ts`
  - `admin-connectors-adapter-types.ts` + `admin-connectors-adapter.ts`
  - `admin-datasets-adapter-types.ts` + `admin-datasets-adapter.ts`
  - `admin-blockers-adapter-types.ts` + `admin-blockers-adapter.ts`
  - `admin-audit-log-adapter-types.ts` + `admin-audit-log-adapter.ts`
  - `admin-setup-progress-adapter-types.ts` + `admin-setup-progress-adapter.ts`
  - `admin-agent-readiness-adapter-types.ts` + `admin-agent-readiness-adapter.ts`
  - `admin-production-readiness-adapter-types.ts` + `admin-production-readiness-adapter.ts`
  - `index.ts` (barrel export)
- Each adapter exports both `getX(tenantSlug)` (async, real DB; throws if tables missing) and `getXFixture()` (sync, deterministic).
- A shared mode helper `src/lib/admin/data/admin-data-mode.ts` reads `ADMIN_DATA_MODE` env (`fixture` | `live`; default `fixture`) and chooses path.
- Zod schemas at adapter boundary for runtime validation of DB rows.
- Fixture data ports `APEX_DETAIL_SEEDS`, `MERIDIAN_DETAIL_SEEDS`, `SEED_USER_DETAILS`, etc. to deterministic builders so existing tests pass.

## Allowed files
- `src/lib/admin/data/**` (new)
- `src/lib/admin/__tests__/data/**` (new — adapter unit tests + fixture parity tests)
- `docs/build/slices/ADMIN-DATA2_*.md` (this file)
- `docs/build/build-slices.json` (status: backlog → in_progress → code_complete)

## Forbidden files
- `src/lib/admin/*-page-view.ts` — page-views remain unchanged in this slice
- `src/app/(maestro)/admin/**` — no UI changes
- `supabase/migrations/**` — DATA10 ships migrations
- `package.json` — no new deps; reuse `@supabase/supabase-js` + existing `zod`

## Implementation scope
1. Create `src/lib/admin/data/` directory + index barrel.
2. For each of 9 adapters, ship `<domain>-adapter-types.ts` (types only) + `<domain>-adapter.ts` (impl).
3. Implement fixture builders that match today's hardcoded constants (parity with `APEX_DETAIL_SEEDS`, etc.) so DATA3–9 swap-in is byte-equivalent in fixture mode.
4. Implement real-DB readers for the 4 domains that touch existing tables today: users (persons + memberships), audit-log (existing `audit_log`), agent-readiness (derived), build-progress (manifest — verify already file-backed).
5. For the 5 domains that need DATA10 migrations, real-DB readers throw a typed `AdminDataMigrationPendingError` until DATA10 lands; mode helper short-circuits to fixture in this case.
6. Zod schemas at adapter boundary.
7. Unit tests: each adapter has fixture parity test + (where applicable) real-DB happy-path test against test fixtures.

## Tests
- `src/lib/admin/__tests__/data/admin-*-adapter.test.ts` — one file per adapter; fixture parity vs current `*-page-view.ts` constants.
- `src/lib/admin/__tests__/data/admin-data-mode.test.ts` — mode helper.
- Target: ~120 new tests; all green.

## Validation
```bash
npx tsc --noEmit
npm test -- src/lib/admin/__tests__/data
npm run build 2>&1 | tail -6
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. 9 adapter modules + types + index ship under `src/lib/admin/data/`.
2. Every adapter exports both async real-DB function + sync fixture function.
3. Fixture parity tests prove fixture builders return shape-equivalent data to today's hardcoded constants.
4. `ADMIN_DATA_MODE=fixture` (default) makes all reads deterministic.
5. Zod schemas validate DB rows at boundary.
6. No admin page-view imports the new adapters yet.
7. TSC clean, build clean, hygiene gate 11/11.
8. Test count grows by ~120; existing 1737 admin regression tests still pass.

## Risks
- Fixture builders may diverge from page-view constants over time → DATA13 regression test catches drift.
- Type union for `AdminDataMigrationPendingError` may bleed into pages → adapter signature returns typed errors via Result type, not throws, where possible.

## Founder review
No visible UI change. Verify by `npm test -- src/lib/admin/__tests__/data` (all green) and `git log --stat` showing only `src/lib/admin/data/**` + tests. Next: run DATA3–9 in parallel.
