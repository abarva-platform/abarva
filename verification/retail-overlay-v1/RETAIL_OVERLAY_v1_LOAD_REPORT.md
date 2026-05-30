# Retail Overlay v1 Load Report

Generated: 2026-05-30T09:54:10.892Z

| Field | Value |
| --- | --- |
| Mode | dry-run |
| Tenant | apex-retail |
| Overlay namespace | retail-v1 |
| Total chunks extracted | 5691 |
| Pattern chunks | 5390 |
| Pack synthesis chunks | 301 |
| Distinct packs | 301 |
| Distinct super-categories | 60 |
| DB rows deleted before load | not applied |
| DB rows inserted/upserted | not applied |
| DB retail-v1 total after load | not applied |
| DB retail-v1 pending embeddings after load | not applied |
| DB retail-v1 embedded after load | not applied |

## Validation

- PASS: At least 5,500 retail-overlay chunks extracted.
- PASS: At least 300 source packs represented.
- PASS: At least 60 super-categories represented.
- PASS: Every chunk includes `chunk_metadata.overlay_namespace = retail-v1`.
- PASS: Every chunk is scoped to `tenant_key = apex-retail`.
- PASS: Source rows remain reversible through `chunk_metadata.source_pack` and `chunk_metadata.source_super_category`.

## Notes

This load report covers extraction and Azure Postgres load state. Embedding completion is verified separately after `src/scripts/embed-pending-chunks.ts --tenant apex-retail --postgres-only` drains the pending queue.
