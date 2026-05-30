# 2026-05-30-retail-overlay-live-load-embedded — Retail Overlay v1 Live Load

## Release ID

`2026-05-30-retail-overlay-live-load-embedded`

## Status

`complete`

## Plain-English Summary

This release records the live data operation that loaded the Retail Overlay v1 corpus into Apex Retail and embedded it. Apex now has tenant-scoped retail corpus chunks in the live retrieval substrate.

## Layer Impact

- `data-plane-lane`: Loaded 5,691 `retail-v1` chunks into `enterprise_context_chunks` for `apex-retail`.
- `industry-corpus-lane`: Made the consolidated retail corpus available as live tenant-scoped retrieval material.
- `qa-validation-lane`: Added live embedding and DB integrity evidence.
- `runtime-app-lane`: No application code changed in this report PR.

## Client Applicability

- All clients: No runtime impact for non-retail tenants.
- Specific clients: Apex Retail has `retail-v1` chunks loaded and embedded.
- Internal only: Operational evidence and release record.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_LOAD_REPORT.md`
- `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_EMBEDDING_REPORT.md`

## QA / Validation

- PASS: Live DB has 5,691 Apex `retail-v1` chunks.
- PASS: Live DB has 5,691 embedded chunks, 0 pending, 0 failed.
- PASS: All 5,691 rows have `embedding_dim = 1536` and valid embedding arrays.
- PASS: Source coverage is 301 packs and 60 super-categories.
- PASS: Duplicate chunk ID count is 0.
- PASS: Bad embedding shape count is 0.

## Rollout Plan

Already applied as a live data operation after PR #2489 merged. No production application deploy is required for this evidence-only PR.

## Rollback Plan

Delete rows from `enterprise_context_chunks` where `tenant_key = 'apex-retail'` and `chunk_metadata->>'overlay_namespace' = 'retail-v1'`.

## Audit Evidence

- Load report: `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_LOAD_REPORT.md`
- Embedding report: `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_EMBEDDING_REPORT.md`

## Known Gaps

Section 6.2 coverage contract integration is next. Section 6.3 API retrieval smoke follows after coverage categories are wired.
