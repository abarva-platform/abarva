# Client Context Load Verification (Phase 5)

_2026-06-10. Governed records+facts load via ACA/VNet operator job. Counts are from INDEPENDENT DB
re-query inside the job, not loader self-report._

## Apex Retail — governed records+facts load (the CHUNKS_ONLY remediation)

**Why a custom applier:** the repo's governed loader (`src/scripts/enterprise-context/load-enterprise-context.ts`)
writes via the **Supabase client** (`NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`). This Azure-native
lab has **no Supabase endpoint** (verified: web app + operator job carry only `DATABASE_URL`/pg; no Supabase
secrets anywhere). So we authored a **pg-port of `applyPlan`** that reuses the in-image generic plan builder
(`parseMeridianEnterpriseContextDataset` → `buildMeridianEnterpriseContextIngestionPlan` →
`retargetEnterpriseContextIngestionPlan`) and commits via `DATABASE_URL` with the documented upsert keys.
Script: `scripts/context/pg-apply-enterprise-context.ts`. This honors the Azure-native rule (no new Supabase
runtime dep) and produces byte-identical row shapes to the proven loader.

**Delivery mechanics:** `docs/` is excluded from the web image, so the Apex dataset was baked into a thin
image layer `acrabarvalab001.azurecr.io/abarva/clf-apex-data:v1` (`FROM <operator image> + COPY apexretail
/app/data/apexretail`, built in 50s). The small applier shipped via the operator-job args; dataset read from
`/app/data/apexretail`. (First attempt embedded the dataset in the script → `exec: argument list too long`;
the image-layer approach is the durable pattern.)

| Metric | Job report | Independent DB re-query |
|---|--:|--:|
| client_id | c7578e7a-545a-4b75-860e-465358f5e00b | — |
| sources | 11 | — |
| source_files | 15 | — |
| **records** | **1,029** | **1,029** |
| **facts** | **11,410** | **11,410** (all `active`) |
| relationships | 220 | — |
| evidence | 1,029 | 1,029 |
| orphan facts | — | **0** |
| duplicate active fact identity (tenant,record,fact_key,value_hash) | — | **0** |

**Records by dimension (all `lifecycle_state='active'`):** cmdb_applications_services 82 ·
ci_relationships_dependencies 220 · incidents 180 · spend_baseline 144 · changes 90 · org_decision_rights 40 ·
problems 36 · data_domains_stewardship 32 · facilities_business_units 32 · initiative_portfolio 32 ·
policies_procedures 32 · risk_compliance_register 30 · slas 28 · vendors_contract_inventory 27 ·
renewal_calendar 24 = **1,029**.

**Idempotency / safety:** all writes are `INSERT … ON CONFLICT (keys) DO UPDATE` (PK `id` never updated on
conflict). No destructive deletes. The first apply committed sources→facts then errored at relationships
(`id` has no DEFAULT on that table); the fix (generate `id` for rows lacking it) made the re-run fully
idempotent — records/facts matched on conflict (no duplication), relationships+evidence completed.

**State transition:** Apex Retail `CHUNKS_ONLY` → **`FACTS_COMMITTED`** (citation-ready facts across 15
dimensions). Remaining for Apex: chunk+index the new facts for vector retrieval (current Azure Search docs
are the older chunk seed), then promotion + bundle proof.

## Meridian Health / Lakeshore Holdings
No records/facts load required — they already hold citation-ready facts (38,640 / 2,949). Their remaining work
is indexing (done, Phase 6), retrieval proof (done, Phase 7), promotion, and bundle proof. Lakeshore still has
~373 `pending` chunk embeddings to finish (separate embed job) and an app tenant-registration gap.

## Operator hygiene
Operator job patched + restored on every run (executions: dry 92fpya6/gkh91m5, apply qgu6yyf→6y3pxr0).
Image `clf-apex-data:v1` is a throwaway data-layer image (not a deploy artifact).

---

## UPDATE — vector-parity polish (2026-06-10, jobs zzecc6m + 6j8ewfk)
Closed the two data-polish gaps (`scripts/context/clf-polish.ts`). Embeddings use **real OpenAI
`text-embedding-3-small` (1536-d)** called directly — the in-repo Azure-OpenAI path falls back to
deterministic vectors when `AZURE_OPENAI_EMBEDDING_*` is unset (this lab has only `OPENAI_API_KEY`),
which would be index-incompatible with the existing real embeddings.

- **Pending embeddings finished:** Lakeshore 213 + Meridian 3 = **216** chunks `pending → embedded`.
  Both tenants now **0 pending** (lakeshore 1,542 / meridian 3,506 fully embedded).
- **Apex fact-chunking:** built **1,029 chunks** from the loaded records via the in-image
  `buildEnterpriseContextChunksFromPlan`, inserted under `tenant_key='apex-retail'` (client_id c7578e7a),
  embedded. apex-retail chunks 6,497 → **7,526** (all embedded).
- **Re-indexed** `tenant-context-v1` (job 6j8ewfk): verified apex-retail **7,526** docs. Smoke retrieval now
  returns Apex **fact-derived** chunks (top hit `risk_compliance_register` / `15-risk-compliance-register.csv`),
  not just the legacy seed → **vector parity achieved**.

All idempotent (`ON CONFLICT`/`UPDATE`); no destructive deletes; operator job restored after each run.
