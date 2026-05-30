# Retail Overlay v1 Load Report

Generated: 2026-05-30T09:59:11.546Z

| Field | Value |
| --- | --- |
| Mode | apply |
| Tenant | apex-retail |
| Overlay namespace | retail-v1 |
| Total chunks extracted | 5691 |
| Pattern chunks | 5390 |
| Pack synthesis chunks | 301 |
| Distinct packs | 301 |
| Distinct super-categories | 60 |
| DB rows deleted before load | 0 |
| DB rows inserted/upserted | 5691 |
| DB retail-v1 total after load | 5691 |
| DB retail-v1 pending embeddings after initial load | 5691 |
| DB retail-v1 embedded after initial load | 0 |

## Validation

- PASS: At least 5,500 retail-overlay chunks extracted.
- PASS: At least 300 source packs represented.
- PASS: At least 60 super-categories represented.
- PASS: Every chunk includes `chunk_metadata.overlay_namespace = retail-v1`.
- PASS: Every chunk is scoped to `tenant_key = apex-retail`.
- PASS: Source rows remain reversible through `chunk_metadata.source_pack` and `chunk_metadata.source_super_category`.

## Notes

This load report covers extraction and Azure Postgres load state. Embedding completion is verified in `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_EMBEDDING_REPORT.md`.
