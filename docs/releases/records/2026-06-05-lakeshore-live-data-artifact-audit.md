# 2026-06-05-lakeshore-live-data-artifact-audit — Lakeshore Live Data And Artifact Audit

## Release ID

`2026-06-05-lakeshore-live-data-artifact-audit`

## Status

`candidate`

## Plain-English Summary

This release records the Lakeshore live data audit and the Lakeshore-only artifact activation performed for demo readiness. It documents which Lakeshore data is actually loaded, which loader path produced the evidence, which Source/Moves records have real synthetic artifacts, and which records remain scaffold-only.

## Layer Impact

- `client-data-lane`: Lakeshore-only live data and artifact evidence were inspected and documented. The Kyriba Source event has Azure Blob-backed Source artifacts, the AMS Source event has Azure Blob-backed artifacts through Evaluation, and the linked Kyriba and Shared Data Platform Moves now have deliverables, versions, program attachments, and evidence rows.
- `internal-admin`: The audit distinguishes CSV/context-loader evidence from the setup/admin approval-ledger path so operators do not overclaim the loader provenance.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore Holdings only.
- Internal only: Yes. The audit packet is internal build evidence.
- Public/demo only: Lakeshore demo-readiness support.
- Feature flag: None.

## Changes Included

- Added `docs/build/lakeshore/LAKESHORE_LIVE_DATA_AUDIT_2026-06-05.md`.
- Live operational evidence captured for:
  - `data_ingestion_runs`, `data_inventory_records`, `data_inventory_segments`, and `enterprise_context_chunks`.
  - Source event `LSH-KYRIBA-TREASURY-2026`.
  - Source event `LSH-AMS-MODERNIZATION-2026`.
  - Move `Kyriba global treasury rollout`.
  - Move `Shared data platform and evidence spine`.
- Live Azure data-plane operation performed outside the repo diff:
  - Created `program-attachments` container in storage account `stlakeshorepilotlsh001`.
  - Verified existing `source-artifacts` container usage for Kyriba and AMS Source files.
  - Loaded six synthetic Markdown deliverables for the Shared Data Platform Move into `program-attachments` and linked them to `deliverables_v2`, `deliverable_versions`, `program_attachments`, and `program_evidence_items`.
  - Normalized 44 Lakeshore Source artifact/chunk `embedding_status` values from `pending` to `not_applicable` after verifying those generated artifacts are parsed/cited through Blob/Postgres evidence rather than a Source-specific vector index.

## QA / Validation

- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` initially failed because the release record was missing; this record is the corrective release-control artifact.
- Live Postgres verification confirmed:
  - 18 completed Lakeshore CSV/context ingestion runs.
  - 1,329 `data_inventory_records`.
  - 9 complete `data_inventory_segments`.
  - 1,329 `enterprise_context_chunks`, all marked `embedded`, across all 18 source files.
  - Chunk `source_segment_id` values are normalized into five broader retrieval buckets rather than mirroring all nine inventory segment IDs.
  - Product data rows across Intelligence, Moves, Tower, and persona memberships.
  - 26 Source artifacts/chunks/facts/edges for `LSH-KYRIBA-TREASURY-2026`.
  - 18 Source artifacts/chunks/facts/edges for `LSH-AMS-MODERNIZATION-2026`.
  - 44 Lakeshore Source artifact rows and 44 matching chunk rows now carry `embedding_status=not_applicable`; Azure AI Search vectorization remains the separate Lakeshore corpus lane in `lakeshore-patterns-v1`.
  - Source gate and evidence states match the intended demo posture: Kyriba is real through BAFO with Executive Decision in review; AMS is real through Evaluation.
  - 6 Move deliverables, 6 deliverable versions, 6 program attachments, and 6 evidence rows for the Kyriba Move.
  - 6 Move deliverables, 6 deliverable versions, 6 program attachments, and 6 evidence rows for the Shared Data Platform Move.
- Live Azure Blob verification confirmed:
  - 26 Source markdown files in `source-artifacts/lakeshore/LSH-KYRIBA-TREASURY-2026/`.
  - 18 Source markdown files in `source-artifacts/lakeshore/LSH-AMS-MODERNIZATION-2026/`.
  - 6 Move markdown files in `program-attachments/lakeshore-holdings/1196dac0-715c-45ce-8eeb-5e70792d9aa4/`.
  - 6 Move markdown files in `program-attachments/lakeshore-holdings/6a4c7fc4-0a2d-4479-b807-7350fb727527/`.
- Live product route verification with a fresh Clerk sign-in ticket for `cfo@lakeshore-holdings.example.com` and `abarva_active_client=lakeshore` confirmed:
  - `/strategic-moves` returns 200 with Lakeshore, Kyriba, and Data Spine markers.
  - `/strategic-moves/1196dac0-715c-45ce-8eeb-5e70792d9aa4` returns 200 for the Kyriba Move detail.
  - `/moves/1196dac0-715c-45ce-8eeb-5e70792d9aa4` returns 200 and aliases to the modern Kyriba Move detail.
  - `/strategic-moves/6a4c7fc4-0a2d-4479-b807-7350fb727527` returns 200 for the Data Spine Move detail.

## Rollout Plan

Merge the audit packet and release record to main. The live Lakeshore data-plane activation is already present in Postgres and Azure Blob storage; the repo merge publishes the audit trail, not new runtime code.

## Rollback Plan

Repo rollback: revert the audit packet and this release record.

Live data rollback, if required: delete the six Kyriba Move `deliverables_v2` rows and cascading `deliverable_versions`, soft-delete or delete the six `program_attachments` rows, delete the six `program_evidence_items` rows, and remove the six matching blobs under the Kyriba Move prefix in `program-attachments`. Repeat the same rollback for the six Shared Data Platform Move deliverables/attachments/evidence rows under prefix `lakeshore-holdings/6a4c7fc4-0a2d-4479-b807-7350fb727527/`. Source artifact rollback would require deleting the 26 Kyriba Source artifact rows/chunks/facts/edges, the 18 AMS Source artifact rows/chunks/facts/edges, and removing the matching blobs from `source-artifacts`.

## Audit Evidence

- Audit packet: `docs/build/lakeshore/LAKESHORE_LIVE_DATA_AUDIT_2026-06-05.md`.
- Storage account: `stlakeshorepilotlsh001`.
- Source event: `LSH-KYRIBA-TREASURY-2026`.
- Source event row id: `bd8d173f-6600-48a3-b155-9fa74d024ce8`.
- Source event: `LSH-AMS-MODERNIZATION-2026`.
- Source event row id: `5602d576-2031-4ef9-a028-bb313286cc8d`.
- Move id: `1196dac0-715c-45ce-8eeb-5e70792d9aa4`.
- Move id: `6a4c7fc4-0a2d-4479-b807-7350fb727527`.
- Client id: `f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61`.

## Known Gaps

- The full setup/admin upload-session and load-commit ledgers are not populated for Lakeshore (`pilot_ingestion_upload_runs=0`, `pilot_ingestion_load_commits=0`).
- Chunk segment labels do not mirror every inventory segment. Exact dimension attribution should use source-document provenance where needed.
- `LSH-AMS-MODERNIZATION-2026` is document-real only through Evaluation; Pricing, BAFO, Executive Decision, Selection, Transition, and Value remain scaffold-only.
- Four of six Lakeshore Moves still have no deliverables.
- Kyriba Source Selection, Transition, and Value stages remain scaffold-only.
- Kyriba should now be framed as `Move 0: Platform Rollout De-Risk`; the next artifact pass should make bank connectivity, ERP feed quality, entity hierarchy, historical cash reconstruction, adoption, and intercompany reconciliation explicit gate artifacts before overclaiming AI-on-Kyriba value.
- Lakeshore corpus is about 8,987 patterns in Azure AI Search, short of the 10,000 target.
