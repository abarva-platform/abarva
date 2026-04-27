# ADMIN-DATA5 — `/admin/data-trust` Wired to Adapter

## Metadata
- ID: ADMIN-DATA5
- Title: `/admin/data-trust` consumes admin-datasets-adapter
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA2
- Estimated complexity: L

## Purpose
Replace the hardcoded `DATASETS_BY_RUNG`, `DATASET_DETAIL_MAP`, `LOADED_FILES`, `PROMOTION_REQUESTS`, `QUALITY_SCORECARD`, `AUDIT_TRAIL` constants in `src/lib/admin/data-trust-page-view.ts` with adapter calls. The Trust Ladder concept (5 rungs) stays deterministic.

## Context
Per ADMIN-DATA1 audit Section 2.5, four new tables back this page: `admin_datasets`, `admin_dataset_approvals`, `admin_dataset_quality`, plus existing `data_uploads` for Loaded Files and `audit_log` (filtered) for Audit Trail. The largest of the seven page-wiring lanes due to the number of tabs and entities.

## Target state
- `data-trust-page-view.ts` removes the six dataset-state constants.
- View builder calls `getAdminDatasets`, `getAdminDatasetDetail`, `getAdminDatasetApprovals`, `getAdminDatasetQuality`, `getAdminLoadedFiles` plus `getAdminAuditEvents({ category: 'dataset' })`.
- Trust Ladder concept rungs + tabs stay deterministic.
- ADMIN14 regression tests (similar count) still pass in fixture mode.

## Allowed files
- `src/lib/admin/data-trust-page-view.ts`
- `src/app/(maestro)/admin/data-trust/page.tsx`
- `src/lib/admin/__tests__/data-trust-page-view.test.ts`
- `docs/build/slices/ADMIN-DATA5_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `src/lib/admin/data/**`
- `supabase/migrations/**`
- Other admin page-views

## Implementation scope
1. Async view builder.
2. Parallel `Promise.all` over 5 adapter calls for performance.
3. Per-dataset detail loaded lazily on drawer open (URL-driven).
4. Trust Progression chart points derived from `getAdminDatasets` rung counts.

## Tests
- Adapter-mock tests; tab-by-tab assertions.
- Drawer drill-down test.

## Validation
Standard: tsc, tests, build, hygiene.

## Acceptance criteria
1. No `DATASETS_BY_RUNG`, `DATASET_DETAIL_MAP`, `LOADED_FILES`, `PROMOTION_REQUESTS`, `QUALITY_SCORECARD`, `AUDIT_TRAIL` literals in page-view.
2. 5 sub-tabs (Trust Ladder, Loaded Files, Promotion Queue, Quality Scorecard, Audit Trail) all data-driven.
3. ADMIN14 regression tests green.
4. URL searchParams preserved.
5. Approve / Reject buttons remain HARD-GATED.

## Risks
- 5-call fan-out impact on TTFB → use `Promise.all` and tune indexes (DATA10).
- Trust Progression chart data shape sensitive to dataset count changes → fixture parity test asserts shape stability.

## Founder review
Visit `/admin/data-trust`, click each sub-tab, open dataset drawer. Content identical in fixture mode.
