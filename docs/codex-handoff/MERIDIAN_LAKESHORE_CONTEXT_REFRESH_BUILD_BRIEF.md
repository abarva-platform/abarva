# Meridian + Lakeshore V2 Context Refresh Build Brief

**Priority:** ASAP. These two tenants are the next backend refresh lane after First Capital.

**Execution authority:** Proceed through implementation, QA, merge, and deploy after checks pass. Hard stops: failing typecheck, failing release check, destructive SQL that is not client-scoped, or signed-in QA that shows old tenant data leaking through.

**Release lane:** `client-data-lane`

---

## What Exists Now

| Asset | Location | State |
|---|---|---|
| Meridian V2 context/Tower/corpus pack | `datasets/meridian-health-synthetic-v2/` | Ready, local only |
| Lakeshore V2 context/Tower/corpus pack | `datasets/lakeshore-industries-synthetic-v2/` | Ready, local only |
| Shared generator | `scripts/context-packs/generate-meridian-lakeshore-v2-context-tower.mjs` | Ready |
| Dry-run refresh scaffold | `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs` | Ready |
| ACA/private DB refresh worker | `scripts/jobs/load-meridian-lakeshore-v2.cjs` | Ready, dry-run validated |
| Latest preflight output | `outputs/context-refresh/` | Generated per run |
| Release record | `docs/releases/records/2026-06-18-meridian-lakeshore-v2-context-tower-datasets.md` | Candidate |

Current truth: local data packs are generated and preflighted. They are not Blob-staged, parsed by the product loader, committed to Azure/Postgres, embedded, or live-QA proven.

---

## Tenant Scope

### Meridian

- Canonical tenant key: `meridian-health`
- Expected client id: `d2e9b6f4-8c25-43a9-b8e0-7d2f41f0a612`
- Alias keys to archive/delete during replacement:
  - `meridian-health`
  - `meridian`
  - `meridian-health-system`
  - `phs-meridian`

### Lakeshore

- Canonical tenant key: `lakeshore`
- Expected client id: `3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667`
- Alias keys to archive/delete during replacement:
  - `lakeshore`
  - `lakeshore-holdings`
  - `lakeshore-industries`

Do not delete `clients`, users, memberships, auth rows, global `corpus_patterns`, audit logs, or egress logs.

---

## Phase 0 — Preflight

Run:

```bash
node --check scripts/context-packs/refresh-meridian-lakeshore-v2.mjs
node scripts/context-packs/refresh-meridian-lakeshore-v2.mjs
```

Expected current result:

| Client | Context CSV rows | Tower CSV rows | Graph edges | Corpus patterns |
|---|---:|---:|---:|---:|
| Meridian | 496 | 259 | 260 | 7 |
| Lakeshore | 435 | 201 | 226 | 4 |

The script writes:

- `outputs/context-refresh/<run-id>/receipt.json`
- `outputs/context-refresh/<run-id>/runbook.md`
- `outputs/context-refresh/<run-id>/sql/meridian-health-replace.sql`
- `outputs/context-refresh/<run-id>/sql/lakeshore-replace.sql`

Also run the worker dry-run:

```bash
node --check scripts/jobs/load-meridian-lakeshore-v2.cjs
node scripts/jobs/load-meridian-lakeshore-v2.cjs
```

Current dry-run load shape:

| Client | Source files | Records | Facts | Chunks | Edges | Private patterns | Tower sources |
|---|---:|---:|---:|---:|---:|---:|---:|
| Meridian | 24 | 497 | 5,428 | 502 | 260 | 7 | 14 |
| Lakeshore | 22 | 436 | 4,809 | 439 | 226 | 4 | 14 |

---

## Phase 1 — Archive Current Client Rows

Inside the ACA/private data-plane job, before delete:

1. Resolve `clients.id` for each canonical key and alias.
2. Export current rows for every replacement table into a timestamped archive bundle.
3. Write archive manifest with:
   - client id
   - tenant aliases
   - table name
   - row count
   - hash of exported file
   - run id
   - exported at

Tables to archive are listed in `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs` as `REPLACE_TABLES`.

The worker `scripts/jobs/load-meridian-lakeshore-v2.cjs --apply` performs this archive step automatically before scoped deletes. It writes archives under `REFRESH_ARCHIVE_DIR` or `/tmp/abarva-context-refresh-archive/<run-id>`.

---

## Phase 2 — Client-Scoped Delete

Use the generated SQL as the delete baseline. It is intentionally client-scoped by `client_id` or tenant aliases.

Required guardrails:

- Every delete must include `client_id = ...` or `tenant_key = any(alias array)`.
- No `TRUNCATE`.
- No delete from `clients`.
- No delete from global corpus tables.
- Count rows before and after.
- Abort if a delete SQL string lacks a scoped predicate.

---

## Phase 3 — Load V2 Packs

Load order:

1. `manifest.yaml`
2. `F01` YAML enterprise profile
3. CSV context dimensions in manifest order
4. source docs into source-file/chunk path
5. corpus pattern JSONL into `client_private_patterns`
6. AI Control Tower CSV files
7. graph JSONL last, after record IDs exist
8. derived insight evaluator
9. embeddings/search refresh
10. signed-in Intelligence/Tower QA

Target state after load:

| Layer | Meridian | Lakeshore |
|---|---:|---:|
| Context dimension files | 18 + graph | 18 + graph |
| Context CSV rows | 496 | 435 |
| AI Control Tower CSV rows | 259 | 201 |
| Relationship edges | 260 | 226 |
| Corpus patterns | 7 | 4 |

Apply command inside ACA/private data plane:

```bash
node scripts/jobs/load-meridian-lakeshore-v2.cjs --apply --client all
```

Environment:

- `DATABASE_URL` or `ABARVA_AZURE_DATABASE_URL`
- Optional `CONTEXT_REFRESH_RUN_ID`
- Optional `REFRESH_ARCHIVE_DIR`
- Optional `AI_CONTROL_PERIOD_START`
- Optional `AI_CONTROL_PERIOD_END`

The worker resolves existing client rows. It intentionally fails if a client cannot be resolved; it does not create guessed duplicate clients.

---

## Phase 4 — Client-Specific QA

### Meridian Golden Questions

Use `datasets/meridian-health-synthetic-v2/99-verification/golden-questions.json`.

Must prove:

- Databricks on AWS is named as the data foundation.
- Current state says Meridian lacks mature cloud data capability.
- Prior auth automation is blocked by clinical evidence, policy evidence, and PHI/model governance.
- Call center agent assist requires claims, CRM, transcripts, benefits, and real-time member context.
- HEDIS/STAR provider performance requires attribution and certified measure logic.
- Cost-of-care requires claims, capitation, provider contracts, and GL.
- Payment integrity requires anomaly features plus recovery feedback loop.

### Lakeshore Golden Questions

Use `datasets/lakeshore-industries-synthetic-v2/99-verification/golden-questions.json`.

Must prove:

- Kyriba rollout risk is visible.
- Bank connectivity and payment controls are named.
- Cash visibility is tied to bank portal/manual spreadsheet risk.
- Automated close requires source-cited GL/reconciliation evidence.
- Finance AI cannot scale without governed metrics and SOX evidence.

---

## Phase 5 — UI/Surface Verification

For both tenants:

- Admin context summary shows family grouping and file counts.
- Intelligence Explore tab shows rows for all loaded dimensions.
- Intelligence Corpus tab shows client corpus patterns.
- Insights tab shows derived live insights, not fixture cards.
- `See the facts` opens cited fact/source evidence.
- Sentinel answers cite client records.
- Tower lenses show AI initiatives, spend, benefit, risk, evidence, and actions.
- No stale `lakeshore-holdings` alias rows leak into the `lakeshore` view after canonicalization.

---

## Rollback

Rollback is archive restore by client scope:

1. Pause tenant access if needed.
2. Delete newly loaded rows using the same scoped delete SQL.
3. Restore archived rows table-by-table in FK-safe order.
4. Refresh embeddings/search from restored chunks.
5. Run signed-in QA to verify old state is restored.

---

## Ingestion Truth Standard

Report each stage separately:

- Local artifact generated
- Local parse/preflight passed
- Product loader/API accepted upload
- Azure Blob/object storage staged originals
- Queue/private worker handoff happened
- Parser extracted text/tables/facts with source citations
- Review/approval queue received low-confidence/document-derived evidence
- Context rows/facts/chunks committed
- Embeddings/search refreshed
- Live signed-in retrieval or answer QA proved context usable

Do not summarize all stages as “loaded.”
