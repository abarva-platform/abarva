# SkyHarbor Comprehensive Dataset + Governed Ingestion — Plan to Review

**Status:** DRAFT for Anand's review. No data generated or loaded yet.
**Date:** 2026-06-10. **Author:** Master Source agent.
**Scope:** A fuller, realistic synthetic SkyHarbor dataset across ALL dimensions and ALL
modules (Source, Moves, Intelligence, Tower), loaded through the governed Admin
bulk loader (ZIP path), with originals staged to Azure Blob, and a definitive
answer to *why prior loads didn't fully succeed* and *how changes persist*.

This plan is grounded in a live read of the private data plane (six ACA VNet
jobs, 2026-06-10) and a full read of the loader code. Every claim below is
evidence-cited or measured, not assumed.

---

## 0 · What the live DB actually contains today (measured)

| Object | SkyHarbor (`skyharbor-air`) | Note |
|---|---|---|
| `enterprise_context_chunks` | **3,240** (`committed_not_indexed`, `not_reviewed`) | 2,760 generic *airline industry patterns* + **480 client** + 2 smoke |
| `applications` | **92** (`is_demo_data=true`, $864M) | light CMDB: name/vendor/deploy/criticality/cost only |
| `ai_initiatives` | **38** | |
| `enterprise_context_records` | **2** (both `contract`) | ⟵ the 2-row smoke CSV only |
| `enterprise_context_facts` | **10 active** | ⟵ smoke CSV only |
| `enterprise_context_sources` | **1** | |
| `governed_object_readiness` (agent_ready) | **0** | nothing promoted |
| `cxo_intel_*`, `data_segment_*` | **0** | legacy/parallel schema — loader does NOT write here |

**Client-data chunk segments (480 client chunks):** `it_landscape` 114, `program_inventory`
158, `enterprise_profile` 102, `it_financials` 66, `org_structure` 40.

**Confirmed gaps vs an $80B / $2B-IT-budget airline AMS decision:** SLA schedule
(0), line-by-line IT budget (1 chunk), org headcount by level — CIO/CTO/CFO/SVP/VP/
Director (0 role-title hits), legacy systems Teradata/Netezza (0), multi-cloud
breadth (AWS only; Azure/GCP 0), server/hardware estate (0), CMDB dependencies (0),
and — critically — **structured queryable facts** (10 total).

---

## 1 · ROOT CAUSE — why prior load attempts didn't fully succeed

Five distinct, evidence-backed causes. (1) and (2) are the dominant ones.

1. **Chunks loaded; structured promotion did NOT.** The 480 client chunks
   (`client-data-corpus.jsonl`) committed via the chunk path, but the generator's
   **537 structured records never became facts** — `enterprise_context_records`
   has only **2** rows and `enterprise_context_facts` only **10** (the 2-row
   `ws-c-bulk-smoke-vendors.csv` smoke test). Structured records/facts commit
   **only in `stage_and_process` mode and only for CSV/JSON/YAML**
   (`bulk-context-upload.ts:558-562` rejects binaries). The per-dimension CSVs
   (`vendor-contracts.csv`, `org-roles`, `financials`) were evidently never run
   through `stage_and_process`, or were run as binaries/JSONL that bypass the
   `promoteAdminStructuredRowsToEnterpriseContext` path. **Net: text exists, facts
   don't.**

2. **localhost cannot reach the private DB.** Per
   `docs/runbooks/skyharbor-private-runtime-reset-load.md`, the private Postgres
   resolves only inside the VNet. Loads run from a developer desktop stage to Blob
   and/or fail silently at the DB write. Any "load" not executed via an ACA job in
   the VNet (the proven recipe) will not persist facts.

3. **Binary source files are rejected by the immediate path.** The dataset's
   `source_uploads/` PDFs/DOCX/XLSX cannot be promoted by `stage_and_process`
   (`bulk_upload_process_requires_structured_file`). They must go via
   `stage_and_enqueue` → Azure Service Bus → the landing-zone worker. If that
   **worker isn't running/deployed**, those files stage to Blob and queue but never
   commit — "staged" is mistaken for "loaded."

4. **No SQL load-run audit.** `data_ingestion_runs` **does not exist** in this DB;
   bulk job status is written to **Blob only** (`<tenant>/_jobs/<jobId>.json`,
   `bulk-context-upload-status.ts:113`). A failed/partial load is invisible from SQL —
   which is exactly why partial loads went unnoticed.

5. **Hard caps that a full dataset will hit:** ≤5 MB/file, ≤25 MB/zip, ≤40 files/zip
   (`bulk-upload/route.ts`), ≤2,000 rows/CSV (`csv-upload-connector.ts:282`). The
   comprehensive dataset must be sharded to fit.

---

## 2 · HOW CHANGES PERSIST — overwrite? append? does it know where things go?

Answering the exact questions, with the code semantics:

### Does it know where financials vs org structure vs systems are written? **YES.**
The loader routes by **template → dimension → segment → record_type → facts**:
- `SEGMENT_BY_DIMENSION` (`csv-upload-connector.ts:129-171`): `financial_kpis →
  it_financials`, `vendor_contracts → it_financials`, `org_roles_teams →
  org_structure`, `application_portfolio → it_landscape`, `infrastructure_estate →
  infrastructure`, `data_platform_lineage → data_estate`, …
- record-type map (`admin-structured-context-promotion.ts:275-304`):
  `org_roles_teams → org_role`, `vendor_contracts → contract`, `financial_kpis →
  kpi_metric`, `infrastructure_estate → facility|configuration_item`, …

So uploading an **org** dataset writes org records/facts; it does **not** touch
financials. Routing is deterministic and dimension-scoped.

### Does a re-upload overwrite the old data? **NO blind overwrite — it versions.**
- **Chunks:** upsert on stable `(tenant_key, chunk_id)` where `chunk_id =
  ctx:tenant:segment:record:cN` (content-stable). Re-upload of the same row is a
  no-op; changed text replaces in place. No duplicates.
- **Records:** upsert on `(tenant_key, canonical_record_id =
  sourceFileId:record_slug)`. Same record updates in place.
- **Facts:** **supersede model** (`admin-structured-context-promotion.ts:662-681`):
  before insert, existing `active` facts with the same `fact_key` are set
  `lifecycle_state='superseded'`; the new value is inserted `active`. Exactly **one
  active fact per `fact_key` per record**, with full superseded history retained
  (auditable). Unchanged values are no-ops.
- **Full vs partial replacement:** a dimension load can declare `replace_dimension`
  (full replace of that dimension) vs `partial_update` (supersede only the
  fact_keys present). So you control whether a new org file *replaces* the org
  picture or *patches* it.

**Implication:** loading a new, fuller dataset over the existing thin one is **safe
and correct** — it supersedes stale facts per key, routes each dimension to its own
records/facts, and never clobbers unrelated dimensions. The thin existing facts (10)
will simply be superseded/extended.

### Azure Blob persistence of originals: **wired.**
Non-`validate_only` modes upload every original to the `context-uploads` bucket at
`<tenantSlug>/<loadSlug>/<hash12>/<file>` with rich metadata (tenant, client_id,
segment, template, sha256, uploader) — `bulk-context-upload.ts:599-626`. Future
reference/lineage is satisfied automatically.

### ZIP path: **real and wired** (correcting the conservative prior assumption).
`JSZip` server-side unzip, manifest inside (`manifest.json`/`bulk-manifest.json`),
≤25 MB zip / ≤5 MB file (`bulk-upload/route.ts:82-130`).

---

## 3 · THE COMPREHENSIVE DATASET (design)

**Foundation:** extend the existing deterministic generator
`scripts/skyharbor/generate-skyharbor-substrate.mjs` (today: 15 segments, 537
records, 480 chunks at `datasets/skyharbor-air-synthetic-v1/`). It already covers
mainframe (S03), AWS estate (S04), integration topology (S05), **IBM AMS engagement
(S06)**, initiatives (S07), **vendor portfolio incl. IBM $280M/yr (S08)**, DORA
(S09), GCC (S10), AI-SDLC (S11), **executive decision map (S12)**, value ledger
(S13), operational KPIs (S14), sourcing pipeline (S15). It is the right spine — the
problem was **loading**, not generation.

**Add the missing dimensions** (new segments / enriched records), each mapped to a
template → segment → record_type so it lands as **facts**, not just chunks:

| Dimension (gap) | New/enriched segment | Template → record_type | Module(s) |
|---|---|---|---|
| Line-by-line IT budget / GL (to $2B) | S16_IT_FINANCIAL_LEDGER | `financial-kpi-workbook` → `kpi_metric` + a cost-line template | Source, Tower, Intelligence |
| SLA schedule + performance | S17_SLA_REGISTER | new `sla-register` template → `sla` record_type (needs template add) | Source (AMS-critical) |
| Org headcount by level (CXO/SVP/VP/Dir, spans, ownership) | S12 enriched | `org-roles` → `org_role` | all |
| Infra / server / hardware estate (DC, hosts, capacity) | S18_INFRA_ESTATE | `infrastructure-estate` → `facility|configuration_item` | Source, Tower |
| Legacy + multi-cloud (Teradata/Netezza, Azure/GCP) | S04 enriched + S19_DATA_PLATFORM | `data-platform-lineage`, `erp-landscape-workbook` | Source, Moves |
| CRM/ERP stack | S20_ENTERPRISE_APPS | `application-portfolio` + `erp-landscape-workbook` | Source, Moves |
| CMDB w/ dependencies | enrich S03/S18 | `application-portfolio` + integration edges | Source, Tower |
| Moves substrate (programs, value pools, roadmap) | S07/S13 enriched | `initiative-portfolio` | Moves |

**Template gap to close first:** `sla-register` (and possibly a dedicated
`it-cost-line` template) do **not** exist in `template-registry.ts`. Add them (with
`requiredFields`, `dimension`, `acceptedFormats`) before generating those CSVs, or
they fall back to `application-portfolio` and mis-route.

**Output contract (so the load actually commits facts):**
- Per dimension: a **CSV/JSON** file (NOT binary) so `stage_and_process` promotes it
  to records+facts. Keep ≤2,000 rows/file → shard large dimensions (e.g. budget
  lines) into `financials-part01.csv`, `…02.csv`.
- Keep the JSONL chunk corpus for narrative/retrieval, but **facts come from the
  CSVs**, not the chunks.
- All synthetic, `is_demo_data`/`source_basis=synthetic_comparable`, cover-name only
  (no real carrier identities) — per existing generator guardrails.
- Manifest under `docs/governance/dataset-manifests/skyharbor-air-synthetic-v2.json`
  (bump from v1), `validate:context-corpus:manifests` green before load.

---

## 4 · THE GOVERNED LOAD PROCEDURE (that succeeds)

Executed as **ACA VNet jobs** (never localhost), per dimension, audited each step:

1. **Pre-flight:** `validate_only` for the full manifest → confirm every file maps
   to a template, no cap violations, attestation present. (No writes.)
2. **Stage + process (CSV/JSON dimensions):** `stage_and_process` per dimension →
   Blob original + `enterprise_context_chunks` + `enterprise_context_records` +
   `enterprise_context_facts` (routed by dimension). Verify counts after EACH
   dimension (truth-standard): file → chunks → records → facts, separately.
3. **Binaries (if any):** `stage_and_enqueue` → **confirm the landing-zone worker is
   running** (else convert to CSV/JSON and use step 2). Do not call a staged binary
   "loaded."
4. **Index:** run the (currently missing) FTS/search indexing step so
   `retrievability ∈ {fts_indexed, search_indexed}` — required for promotion.
   *(This is the same machinery gap identified in the promotion plan; build once.)*
5. **Promote:** governed promotion to `agent_ready` for rows that pass all criteria
   (source_basis + confidence + provenance + retrievable + cite-render verified).
6. **Cite-render verify:** real retrieval + citation round-trip sets
   `cited_render_verified_at`.
7. **Re-run Source readiness** for the AMS archetype → families move
   missing→committed→agent_ready as their facts land + promote.

**Idempotency:** safe to re-run — facts supersede by key, chunks/records upsert by
stable id. Use `replace_dimension` for a clean re-load of a dimension.

---

## 5 · REVIEW CHECKLIST (decide before we build/load)

- [ ] Approve the dimension list in §3 (add/remove modules or dimensions).
- [ ] Approve adding `sla-register` (+ cost-line) templates to the registry.
- [ ] Approve dataset version bump → `skyharbor-air-synthetic-v2` + manifest.
- [ ] Confirm load executes via ACA VNet jobs (not localhost).
- [ ] Confirm we build the **indexing + promotion machinery** (step 4/5) as part of
      this — it's the shared blocker for `agent_ready` (see promotion plan).
- [ ] Confirm binary handling: CSV/JSON-only (simplest, commits facts immediately)
      vs enabling the Service Bus worker for PDFs/DOCX.
- [ ] Confirm scale targets (e.g. budget to ~$2B across N cost lines; org to N roles
      across CXO/SVP/VP/Director; SLA schedule of N services; app/CMDB to N CIs).

---

## 6 · Open risks

- The indexing step (FTS/search → `retrievable`) and the promotion executor are
  **not yet built** (confirmed in the promotion investigation). Without them, even a
  perfectly loaded dataset stays `committed_not_indexed` and the governed agent
  keeps refusing. **This plan and the promotion plan share that dependency — build
  it once.**
- The landing-zone worker's running state is unverified; binaries depend on it.
- Generic *industry-pattern* chunks (2,760) outnumber client facts; ensure
  retrieval/grounding prefers client facts so answers are SkyHarbor-specific.
