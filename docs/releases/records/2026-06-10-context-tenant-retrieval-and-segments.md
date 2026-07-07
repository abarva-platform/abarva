# 2026-06-10-context-tenant-retrieval-and-segments — Tenant-safe retrieval + Meridian/Lakeshore segment routing

## Release ID
`2026-06-10-context-tenant-retrieval-and-segments`

## Status
`candidate`

## Plain-English Summary
Two correctness/security fixes to enterprise-context retrieval:
1. **Cross-tenant leak fix (security).** `retrieveContext` in `src/lib/retrieval.ts` queried
   `enterprise_context_chunks` with **no tenant filter** and a dead `source_segment_id IN
   ('industry_context','cross_program_signals','compliance')` allow-list that matched no real tenant
   data (so it could return another tenant's chunks and/or zero rows). Added a `tenantKey` parameter,
   pinned `tenant_key = $tenantKey` (NULL-safe: unfiltered only when no key is supplied), added a
   `lifecycle_state='active'` filter, and removed the dead allow-list. Threaded the resolved tenant key
   through the call sites (`strategy-step-context.ts` → `/api/chat/step`).
2. **Meridian/Lakeshore segment routing.** Their enterprise-context chunks land with
   `source_segment_id = record_type` (e.g. `cmdb_applications_services`, `vendors_contract_inventory`,
   `business_capability`). The retriever's `selectTenantEnterpriseSegments` only emitted the 5 canonical
   segment ids, so these tenants' facts were never selected → "not loaded". Extended the `SegmentId`
   union (15 Meridian + 12 Lakeshore segments) and added intent→segment routing + a broadened fallback so
   these facts surface. `coverage.ts` SEGMENT_ALIASES extended to keep the exhaustive map type-complete.

## Layer Impact
- **global-control-lane**: shared retrieval + segment routing in the app tier. Tenant-scoped; no schema
  change. Behavior is strictly safer (adds isolation) and strictly more complete (adds segments).

## Client Applicability
- All clients benefit from the isolation fix. Meridian Health + Lakeshore Holdings specifically gain
  retrievability of their enterprise-context facts.

## Changes Included
- `src/lib/retrieval.ts` — tenantKey param + tenant/lifecycle filter; drop dead segment allow-list.
- `src/lib/agent/strategy-step-context.ts`, `src/app/api/chat/step/route.ts` — thread tenant key.
- `src/lib/knowledge/tenant-data/types.ts` — extend `SegmentId` union (27 segments).
- `src/lib/knowledge/tenant-enterprise-context.ts` — emit Meridian/Lakeshore segments.
- `src/lib/knowledge/coverage.ts` — SEGMENT_ALIASES entries for new segments.

## QA / Validation
- `npx tsc --noEmit`: clean of these changes (3 pre-existing errors = uninstalled optional deps).
- Jest: tenant-isolation-probes, tenant-enterprise-context, segment-routing, retrieval-tenant-leak —
  4 suites / 100 tests pass. 5 pre-existing unrelated suite failures reproduce identically on clean base
  (no new failures).
- Live retrieval already proven tenant-isolated on the Azure Search path (`tenant-context-retriever`,
  job boshah8); this fix aligns the secondary `src/lib/retrieval.ts` SQL path.

## Rollout Plan
Merge to `main`; ships with the Azure control-lane deploy (new web image → ACA revision → 100% traffic).
No migration.

## Rollback Plan
Single-commit revert (restores prior `retrieveContext` signature + SQL). No data implications.

## Audit Evidence
PR + squash SHA on `main`; ACA image tag/digest + revision recorded at deploy.
