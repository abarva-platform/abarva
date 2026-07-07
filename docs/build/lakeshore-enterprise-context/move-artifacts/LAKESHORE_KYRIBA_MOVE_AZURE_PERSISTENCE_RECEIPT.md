# Lakeshore Kyriba Move — Azure Persistence Receipt (Option B)

**State: REAL IN THE MODULE — VERIFIED.** The Kyriba Move and its board-grade artifacts are now
persisted in the AbarVa product data plane (Azure), tenant-scoped to Lakeshore, queryable by the
Moves module — not just local files.

## Where it is stored in Azure
| What | Azure store | Value |
|---|---|---|
| The Move | Azure Postgres `abarva_control.engagements` | `id=49c77bca-471d-4398-8b13-fa8ed1487597`, phase **5**, status `active`, pack `finance_treasury_alm` (via charter) |
| Board-grade artifacts | Azure Postgres `abarva_control.generated_artifacts` | **23 rows** (`artifact_type=move_board_pack`, `client_id=lakeshore-holdings`, RLS-scoped), each `blob_url` + `blob_sha256` |
| Artifact bytes | Azure Blob `stabarvaprivatedplab001 / context-drops / moves/lakeshore-kyriba/` | **25 files**, 1,124,791 bytes |

## generated_artifacts by format (verified, independent read-only query)
| output_format | rows |
|---|---|
| html | 8 |
| pdf | 8 |
| pptx | 4 |
| docx | 3 |
| **total** | **23** |

`source_artifact_ref` pattern: `move:49c77bca-…:lakeshore-kyriba-<nn>-<artifact>`.
Example `blob_url`: `https://stabarvaprivatedplab001.blob.core.windows.net/context-drops/moves/lakeshore-kyriba/lakeshore-kyriba-01-charter-skeleton.html`.

## Format-by-type (matches the kernel's artifact catalog)
| Phase | Artifact | Stored formats |
|---|---|---|
| P1 Charter | Charter Skeleton | html, docx, pdf |
| P2 Discover & Diagnose | Discover Brief | html, docx, pdf |
| P3 Design Future State | Solution Architecture Pack | html, pptx, pdf |
| P4 Roadmap & Business Case | Costed Business Case | html, pptx, pdf, xlsx* |
| P4 Roadmap & Business Case | Estimate & Financial Model | html, xlsx*, pdf |
| P4 Roadmap & Business Case | CFO Pack | html, pptx, pdf |
| P5 Mobilize & Handoff | Mobilize & Go-Decision Packet | html, docx, pdf |
| All phases | Master Move Dossier | html, pdf, pptx |

\* **XLSX** bytes are in Azure Blob but **not** in `generated_artifacts` because that table's
`output_format` CHECK allows only `pptx|pdf|html|docx`. Financial models surface through the
deliverable/financial-model route in-product; the xlsx is retained in Blob as evidence.

## How it was executed (truthful method)
Run from inside the Azure VNet via the managed-identity container app
`ca-abarva-scale-smoke-lab-eastus` (the same private-worker pattern as the context load), which:
1. created the `engagements` row (cloning an existing engagement's column shape to satisfy
   NOT-NULL/FK constraints; phase 5; charter binds `finance_treasury_alm`),
2. uploaded all 25 artifact files to Azure Blob,
3. created the `generated_artifacts` table (migration `20260524162000` was **not previously applied**
   in this lab DB) and inserted 23 rows,
4. independently re-queried to confirm counts.
The repurposed container app was **restored** to its original state afterward.

## Engine provenance
- Board-grade decks are real **expert-kernel** deterministic output (`renderMove*Html`), bound to the
  `(financial-services, finance_treasury_alm)` Domain Function Pack; downstream formats
  (docx/pptx/xlsx/pdf) derived from the same kernel content (no new numbers).
- The kernel honestly returns a **SHAPE/KILL** posture for this Move at current inputs (4 recorded
  baseline metrics vs 8 declared seed gaps) — value shown as a range on benchmark proxies, payback
  not asserted. This is the deterministic critic/rubric honesty, not a defect.

## What still needs hardening
1. **LLM phase deliverables** (`deliverables_v2`) — generate per-phase narrative docs in real time via
   Claude (`anthropic-api-key` in KV) grounded in the loaded Lakeshore context; not yet run.
2. **Relevance** — bind a dedicated **corporate-treasury / Kyriba** Domain Function Pack (vs the bank
   ALM pack) so seed gaps are treasury-relevant and the verdict can reach FUND with recorded baselines.
3. **XLSX in product** — wire the financial-model deliverable route so the xlsx is first-class.
4. **Browser signed-in QA** — confirm the Move + artifacts render in the authenticated Moves UI
   (needs Clerk creds).

## Rollback
`DELETE FROM generated_artifacts WHERE rendered_by='lakeshore-kyriba-move-persist'`;
`DELETE FROM engagements WHERE id='49c77bca-471d-4398-8b13-fa8ed1487597'`;
delete the `context-drops/moves/lakeshore-kyriba/` blob prefix.
