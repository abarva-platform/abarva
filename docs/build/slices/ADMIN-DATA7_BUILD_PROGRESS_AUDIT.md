# ADMIN-DATA7 — `/admin/build-progress` Audit (Manifest-Backed Verified)

## Metadata
- ID: ADMIN-DATA7
- Title: `/admin/build-progress` audit — verify manifest-backed reads stable
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA2
- Estimated complexity: S

## Purpose
Verify that `/admin/build-progress` already reads `docs/build/build-waves.json` and `docs/build/build-slices.json` as its source of truth (per ADMIN15) and add a thin wrapper at `src/lib/admin/data/admin-build-progress-source.ts` for consistency with the rest of the adapter family. No DB-backed adapter is needed — wave + slice manifests describe **platform build state**, not tenant state.

## Context
Per ADMIN-DATA1 audit Section 2.6, this page is the one admin page that does NOT need a DB-backed adapter. ADMIN15 already wired `BuildProgressDashboard` to read from `docs/build/build-waves.json` server-side. CI snapshot stays deterministic until live CI integration in Wave 27. This slice is the smallest lane of DATA3-9.

## Target state
- `src/lib/admin/data/admin-build-progress-source.ts` (new) wraps existing manifest reads with the same return-type interface conventions used by other adapters (typed read-model + `getX(tenantSlug)` signature returning `Promise<T>`, even though tenantSlug is ignored — for symmetry with other admin data calls).
- `build-progress-page-view.ts` updated to import from `@/lib/admin/data` rather than directly reading manifests.
- No data shape changes; ADMIN15 regression tests (73) green.

## Allowed files
- `src/lib/admin/build-progress-page-view.ts`
- `src/lib/admin/data/admin-build-progress-source.ts` (new)
- `src/lib/admin/data/index.ts` (append export)
- `src/lib/admin/__tests__/build-progress-page-view.test.ts`
- `docs/build/slices/ADMIN-DATA7_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `docs/build/*.json` source manifests (read-only here)
- `supabase/migrations/**`
- Other admin page-views

## Implementation scope
1. Create thin wrapper `admin-build-progress-source.ts`.
2. Update page-view import.
3. No behavior change.

## Tests
- ADMIN15 tests still green.
- New thin wrapper unit test.

## Validation
Standard.

## Acceptance criteria
1. New wrapper module exists.
2. Page-view imports from `@/lib/admin/data` consistently.
3. ADMIN15 regression tests (73) green.
4. No DB tables added.

## Risks
- Risk of scope creep to "live CI" — explicitly out of scope for this slice (Wave 27).

## Founder review
Visit `/admin/build-progress`. Content identical (manifests unchanged).
