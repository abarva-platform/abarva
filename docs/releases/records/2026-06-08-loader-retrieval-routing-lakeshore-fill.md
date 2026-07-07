# 2026-06-08-loader-retrieval-routing-lakeshore-fill — Dedicated data/infra segments + Lakeshore fill

## Release ID

`2026-06-08-loader-retrieval-routing-lakeshore-fill`

## Status

`candidate`

## Plain-English Summary

The Lakeshore comprehensiveness review found that data/analytics and
infrastructure questions returned nothing even after the data was loaded. Root
cause: the `it_landscape` retrieval segment is overloaded (apps + data + infra),
and the retriever fetches only a capped, unordered set of chunks then ranks the
top few — so newly-loaded data/infra chunks were **starved** and never surfaced.

This change gives those two landscape layers **dedicated retrieval segments**
(`data_estate`, `infrastructure`) so their questions retrieve from clean
segments, and lands the canonical Lakeshore L4 (data/analytics) and L5
(infrastructure) data that the review found missing.

## Layer Impact

- **global-control-lane**: retrieval routing — new `SegmentKey`/`SegmentId`
  values, `selectTenantEnterpriseSegments` routes data/analytics + infrastructure
  questions to the new segments, `SEGMENT_LIMITS` + `scoreChunk` boosts, and the
  loader connector maps `data_platform_lineage → data_estate`,
  `infrastructure_estate → infrastructure`. Additive; existing segments
  unchanged.
- **client-data-lane**: canonical Lakeshore L4/L5 data (CSVs) committed to the
  `lakeshore-holdings` tenant via the loader.

## Client Applicability

- All clients: the dedicated-segment routing benefits every tenant that loads
  data/analytics or infrastructure content. The data load is Lakeshore-only.
- Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `src/lib/ingestion/azure-landing-zone-types.ts` — `SegmentKey` += `data_estate`, `infrastructure`.
- `src/lib/knowledge/tenant-data/types.ts` — `SegmentId` += `infrastructure`.
- `src/lib/knowledge/tenant-enterprise-context.ts` — labels, limits, routing, scoring.
- `src/lib/knowledge/coverage.ts` — segment aliases for the new segments.
- `src/lib/context-ingestion/csv-upload-connector.ts` — dimension→segment mapping.
- `src/lib/knowledge/__tests__/segment-routing-landscape.test.ts` — routing tests.
- `docs/build/lakeshore/loaded/landscape-fill/` — canonical L4/L5 CSVs + README + review findings.
- `docs/.../apex-L/README.md` — $80B archetype decision note.
- `docs/build/moves-design/lakeshore-federated-ai-strategy/README.md` — canonical-cast divergence note.

## QA / Validation

**Result: pass.**

- `jest` knowledge + ingestion + loader: **184 + 5 (new routing) tests pass**.
- `tsc --noEmit`: 0 errors in changed files (the new `SegmentKey`/`SegmentId`
  values were propagated to all exhaustive maps; only the pre-existing
  `@azure-rest` / `@axe-core` install artifacts remain).
- **Live**: the L4 (16 rows) + L5 (18 rows) data was committed to
  `lakeshore-holdings` via the loader (verified present + full-text matchable in
  the Azure DB). Live re-probe of retrieval surfacing is performed against the
  freshly-built image carrying this routing change (the migration of the loaded
  chunks into the new segments only helps once this code is deployed).

## Rollout Plan

Merge to `main`; the routing change ships with the normal control-lane deploy.
The loaded Lakeshore chunks are migrated from `it_landscape` into the new
segments in the same operation. No DB migration.

## Rollback Plan

Revert the PR (additive routing; reverting restores prior segment behavior). The
loaded Lakeshore data remains as chunks; revert leaves them tagged with the new
segment ids harmlessly (no retriever queries them, same as before the layers
existed).

## Audit Evidence

- Coverage review payloads (before/after), fill commit result, chunk diagnostic
  (client_id + full-text match confirmed).
- PR URL + CI; operator-job exec ids for the live load.

## Known Gaps

- Structured fact layer + provenance for Lakeshore (records/facts/source_files=0)
  remains a chunk-only gap (out of scope).
- The infra file maps at low confidence (`infrastructure_estate` proposed as
  `applications_systems` @ ~0.55); the loader passes `targetDimension` so the
  commit segment is correct, but mapper infra-recognition could be stronger.
- The moves-design Lakeshore narrative still uses the divergent cast (flagged,
  not rewritten).
