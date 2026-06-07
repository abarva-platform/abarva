# Cursor Prompt — Context/Corpus → Agent Visibility Audit & Governed Fix

You are auditing AbarVa Nexus production readiness for client-context intelligence.

## Goal
Prove that every loaded client dataset, corpus pattern, context fact, chunk, graph edge, embedding/search index, and product retrieval path is **complete, in the store the app actually reads, tenant-scoped, citation-backed, and visible to Sentinel and Nexus.** Treat "loaded" as an unproven claim until each ingestion state is separately evidenced. Do not take shortcuts in diagnosis OR fixes.

## Repo
`/Users/anand/Projects/nexus`

Follow `AGENTS.md` exactly — especially the **Context ingestion truth standard** and the **Bulk loader current contract**.

---

## VERIFIED GROUND TRUTH (start here — do not rediscover; confirm/extend)

A prior read-only audit (2026-06-06, against the live `DATABASE_URL` Supabase store) established the following. **Re-verify each against BOTH stores, then extend.**

**Two data stores exist, and they are split — this is the central issue:**
- `DATABASE_URL` → **Supabase** pooler (`…pooler.supabase.com`). Reachable from a dev laptop.
- `ABARVA_AZURE_DATABASE_URL` → **Azure Postgres** (`pg-abarva-context-lab-001…`, `publicNetworkAccess: Disabled`, VNet-private `10.x`). **NOT reachable from a laptop** — query it only via the in-Azure operator jobs (`job-abarva-db-copy-lab-eastus`, `job-abarva-db-migrate-lab-eastus`, etc., in `rg-abarva-controlplane-lab-eastus`).
- **Vercel Production env has `DATABASE_URL` (Supabase) set and `ABARVA_AZURE_DATABASE_URL` NOT set** → **production currently reads Supabase.** (Verify; do not print secret values.)
- Read paths: corpus reads use `src/lib/corpus/db.ts` (Azure-preferred, **fails closed** on Supabase unless `ALLOW_LEGACY_SUPABASE_CORPUS=1`); general reads use `src/lib/data-plane/postgresCompat.ts` (Azure-preferred, **silent fallback** to Supabase). A Supabase→Azure migration is **in flight in a parallel thread** — coordinate, do not collide; run reconciles against both stores.

**Per-client state observed in Supabase (the store prod reads today):**
- **Meridian** (`a20ecef5-f0ea-4890-b9d5-7375fab223ff`): `enterprise_context_facts` = **38,640** (incl. **Epic Clarity, Epic Caboodle, Databricks Lakehouse**, full CMDB with named CIs/owners/contracts/spend); `enterprise_context_records` = 3,503; `enterprise_context_chunks` = 3,503. **Data is present and good.**
- **Lakeshore** (`f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61`): facts = **0**, records = **0**, chunks = 1,329 but **0 tech-bearing chunks** (no kyriba/sap/oracle/tableau/databricks terms). Its enterprise context was loaded via the **Azure-first bundle** (`LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1`, `AZURE_DB_RECEIPT`) → into **Azure**, which prod can't read. **Two-store split.**
- **Morgan Street** (`830de810-0011-4c9e-8f59-000000000101`): chunks = **0**, facts = **0**. **Empty in the read-store.**
- **Apex** (`bb8ed961-a049-4d0c-a38f-f8912138fceb`), **SkyHarbor** (`6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301`), **Northstar** (`2702b525-…`), **First Capital** (`7dbf2cc9-…`): chunks present (Apex 6,497, SkyHarbor 3,240, Northstar 878, First Capital 400) but **facts = 0, records = 0** → **chunks were never promoted to facts** (extraction stage never ran).
- `applications` table is **synthetic** (`is_demo_data = true`, e.g. Meridian has 140 demo rows: Cogito/Power BI/Epic suite) — it must **never override** loaded `enterprise_context_facts`.
- `corpus_patterns` ≈ 8,987 (Lakeshore `pat-lsh-*`), `genome_patterns` ≈ 43,436 (Supabase counts).

**Retrieval-scope defects observed:**
- Sentinel answers cite **aggregate overview counts** ("240 systems, 110 domains, 320 incidents") + **generic inference** ("almost certainly Epic reporting"), but never the **named fact rows** that exist (e.g. `CI-APP-EPIC-CLARITY`). The retriever ingests the enterprise-context **overview**, not the named rows; the fact retriever uses `slice(0,34)` of 38k facts with **no relevance ranking** (`src/lib/intelligence/ask/retrievers/surface-context.ts`).
- The brief builder `src/lib/intelligence-v3/lakeshore-live.ts` pulled `corpus_patterns … ORDER BY depth_score LIMIT 24` and bound patterns **positionally** (since fixed to relevance + fail-closed in PR #3230). Retrieval generally is **keyword + small `LIMIT`**, not vector/semantic over the full corpus.
- Sentinel outputs show a literal **"Citation gap: no source citations attached"** — provenance exists on facts (`source_system`, `source_file`, `confidence`) but is **not propagated** to the answer.

Confirm all of the above against both stores and treat any drift as a finding.

---

## HARD CONSTRAINTS (non-negotiable — the operator's rules)

1. **No shortcuts in fixes.** Do not mask a data gap by hardcoding answers, widening a `LIMIT`, inserting rows directly, or seeding the DB. Every fix addresses the real cause and ships with a test + proof.
2. **Any NEW or MISSING data load MUST go through the governed Admin bulk/zip data loader** — manifest-driven, multi-file/zip upload → **Azure Blob staging → parse/extract → review/approval where required → commit to context rows → embeddings/index refresh → signed-in retrieval proof.** **No direct SQL inserts, no seed scripts, no ad-hoc loaders.** Before relying on the loader, **prove the Admin bulk route is actually wired end-to-end** (per AGENTS.md, state whether rich PDF/DOCX/XLSX parsers are wired into the bulk route or only structured CSV/JSON commits today).
3. **One read-store truth.** Every "loaded" claim must name **which store** holds the data and **whether prod reads that store.** Data in Azure while prod reads Supabase = **NOT loaded for the product** (P0).
4. **Production reasoning = Claude/Anthropic, never OpenAI.** Sentinel, Nexus, Source, Tower, Atlas, and chat/agent synthesis must use Claude. OpenAI only for explicitly approved non-reasoning utilities (embeddings, demo audio). Any answer-generation path on OpenAI = **P0**.
5. **Never print secret values.** Verify env var *names* and presence via Vercel/Azure CLI only.
6. **Tenant isolation is absolute.** No cross-tenant leakage; verify by adversarial test (ask as client X, confirm zero client-Y rows).

---

## Clients to audit
Lakeshore Holdings, Meridian, Apex, SkyHarbor, Morgan Street, Northstar, First Capital, and any other client with corpus/context rows in either store.

## Audit dimensions (per client, per store)
Tenant identity & client-id mapping · source files/manifests uploaded · blob/object staging receipts · parser/extraction completion · `enterprise_context_records` · `enterprise_context_facts` · `enterprise_context_chunks` · applications/systems/CMDB/data-platform inventory · org/people/roles/owners · vendors/contracts/renewals/obligations · finance/treasury/Kyriba/controls/failure-modes · KPIs/metrics/value claims · Moves/initiatives/stage-gates/artifacts · Source events/evidence/attachments · `corpus_patterns` · graph edges/relationships · embeddings/Azure AI Search/vector indexes · live signed-in Sentinel & Nexus retrieval.

---

## Tasks

### 1. Per-client × per-store ingestion-completeness matrix
Columns: `client, store(supabase|azure), prod_reads_this_store(y/n), source_files, blob_receipts, records, facts, chunks, chunks_promoted_to_facts(y/n), applications, applications_demo_flag, vendors, contracts, org_rows, initiatives, corpus_patterns, graph_edges, search_index_docs, index_matches_db_rows(y/n), facts_with_provenance_pct, retrieval_proof(pass/fail), demo_vs_loaded`.
For Azure rows, run the count queries **via the in-Azure operator job**, not from the laptop.

### 2. Ingestion-truth ledger (per client)
Map each AGENTS.md ingestion state to PASS/FAIL **with evidence**: local artifact generated · local parse/preflight · loader/API accepted upload · blob staged · queue/worker handoff · parser extracted (with source citations) · review queue received low-confidence/doc-derived · context rows/facts/chunks committed · embeddings/index refreshed · live signed-in retrieval proven. **No state may be inferred from another.**

### 3. Retrieval-path audit
Enumerate every place Sentinel and Nexus retrieve context (brief builders, `ask` retrievers, broker, surface-context, lakeshore/apex `-live` builders). For each, classify: shallow keyword/`LIMIT` window · `slice(0,N)` non-ranked · application-table-only · **reads overview/aggregate counts instead of named fact rows** · missing `enterprise_context_facts` usage · missing chunks usage · missing graph/search/vector usage · missing citation propagation · wrong-store read.

### 4. Index ↔ DB reconciliation
For each client + index, compare Azure AI Search / vector doc counts to DB row counts (the "12 docs vs 9k rows" class of gap). Report deltas; flag indexes that don't match their source-of-truth rows.

### 5. Provider audit (Anthropic, not OpenAI)
Inspect code + production env (names only) for Sentinel/Nexus/Source/Tower/Atlas/chat synthesis. Verify runtime audit rows include `provider, route, model, workflow, tenant_id, user_id`. **Expected verdict:** `provider=anthropic`, `model` starts with `claude`, route is `anthropic-direct` or `azure-foundry-private`. Any reasoning path on OpenAI = P0.

### 6. Golden-question suite — retrieval visibility (recall, not just presence)
For each question: call the **signed-in product route/API** Sentinel/Nexus actually uses; capture response text, citation/source payload, and audit row (provider/model). Grade **PASS / PARTIAL / FAIL**. **PASS requires:** correct tenant · concrete **named** facts (not aggregate counts, not "almost certainly") · source citations attached · no cross-tenant leakage · no generic filler · correct provider. Also compute **recall@k**: did the expected named fact appear in the retrieved candidate set, separate from whether the model used it.

Required golden questions:
- **Lakeshore:** "Talk to me about current state of data analytics and technologies we have today." → expect named platforms; today it returns generic lenses + "citation gap" because its data is in Azure (two-store).
- **Lakeshore:** "What do we know about Kyriba, treasury modernization, readiness gates, and failure modes?"
- **Lakeshore:** "What business units, operating companies, systems, vendors, contracts, KPIs, and owners are in the context layer?"
- **Meridian:** "What is our current analytics stack, and where do Epic Clarity, Caboodle, SQL Server, Tableau, SAS, Cogito, and Power BI appear or not appear?" → expected anchors: **Clarity, Caboodle, Databricks Lakehouse present in facts; SQL Server/Tableau absent** — answer must distinguish loaded-fact vs synthetic-`applications` (Cogito/Power BI are demo rows).
- **Each client:** "What evidence is live-loader-backed versus synthetic/demo?"
- **Each client:** "What answer would change if we had better source evidence?"

### 7. Gap report
Missing file processing · chunks not promoted to facts · facts not indexed · index docs not matching DB rows · **data in wrong store vs what prod reads** · retrieval not using governed context · retrieval reading overview not named rows · answer synthesis ignoring sources / citation gap · synthetic data overriding loaded data · cross-tenant contamination · OpenAI used for reasoning · missing provider/model audit · loader bulk route not actually wired for rich docs.

### 8. Depth & answerability assessment (per client × dimension; per source file)
Presence is not enough — grade **how deep** each dimension is and **what it can actually answer**.

**Depth tiers (apply per client × dimension):**
- **T0 Absent** — no rows.
- **T1 Stub/synthetic** — demo placeholder (`is_demo_data`) or counts-only with no named detail.
- **T2 Partial-real** — some real named rows, but sparse / missing key fields / no provenance / stale.
- **T3 Pilot-grade** — named, attributed, fresh; covers the dimension's core entities + relationships.
- **T4 Best-in-class** — pilot-grade + full field depth, cross-linked (CMDB ↔ contracts ↔ spend ↔ owners ↔ KPIs ↔ initiatives), evidence-cited, refreshable.

For each client × dimension, produce:
- **Depth tier (T0–T4)** with evidence: row counts, sample **named** rows, field-completeness %, provenance %, freshness.
- **Answerable today** — 2–3 concrete question classes this depth supports well.
- **Not yet answerable** — question classes blocked, and the missing depth that blocks them.
- **Best-in-class target — benchmarked to existing IP, not invented.** Define "best-in-class context for this dimension" as the data needed to populate the matching **domain function pack** (Layer 1 operating metrics, Layer 6 vocabulary/entities, Layer 8 evidence anchors — `src/lib/programs/expert-kernel/domain/**`), the **pattern packs** (`docs/build/pattern-packs/**`), and the **Move Artifact Contract** evidence bar (`docs/build/pattern-packs/MOVE_ARTIFACT_CONTRACT.md`). i.e. *best-in-class = the dataset that lets this client's bound function pack answer its full metric/entity/evidence surface.*
- **Gap-closing load** — the specific files/records that would raise the tier, **and the dimensions/fields each must carry** — to be ingested **only through the governed bulk/zip loader** (blob → parse → commit → index → retrieval-proof).

Also produce a **per-source-file coverage map**: each uploaded file/manifest → dimensions it feeds → records contributed → tier impact → residual gaps. Answer "what did this file actually buy us, and what's still missing?"

---

## Fixes (smallest correct changes only — no shortcuts)

If safe and in scope:
- **Wire Sentinel/Nexus current-state retrieval to `enterprise_context_facts` + `enterprise_context_chunks`** with **relevance ranking** (filter to CMDB/application/vendor/KPI rows; return **named rows**, not overview counts), and **propagate provenance** to the answer (kill the citation gap).
- **Prefer live-loader-backed facts over the synthetic `applications` table** (respect `is_demo_data`).
- Do **not** fix missing data by inserting rows — **route any missing/new load through the governed Admin bulk/zip loader** (blob → parse → commit → index → retrieval-proof) and prove each state.
- Add **retrieval tests** for current-state technology/org/KPI questions (recall@k against expected named anchors).
- Add **provider regression tests** proving Sentinel/Nexus synthesis uses Anthropic/Claude.
- Add a **release record** under `docs/releases/records/` (lane + QA status PASS/FAIL/blocked + rollback). Run `npm run release:check`. tsc + jest green. No `--no-verify`.
- Coordinate with the in-flight Azure migration thread; gate any store-dependent fix behind the cutover where needed.

---

## Deliverables
- `docs/build/context-corpus-agent-visibility-audit-YYYY-MM-DD.md`
- `docs/build/context-corpus-agent-visibility-matrix-YYYY-MM-DD.csv` (per client × per store)
- `docs/build/sentinel-nexus-golden-qa-results-YYYY-MM-DD.md` (with response text, citation payloads, provider/model, PASS/PARTIAL/FAIL, recall@k)
- `docs/build/context-depth-answerability-matrix-YYYY-MM-DD.csv` (client × dimension × depth-tier T0–T4 × answerable/blocked × best-in-class-gap × per-file coverage)
- `docs/build/context-best-in-class-gap-spec-YYYY-MM-DD.md` (per dimension: the best-in-class dataset spec benchmarked to the function/pattern packs + the governed-loader plan to close each gap)
- Evidence captures (screenshots / JSON) for live signed-in QA
- PR with tests + release record if code changes are made

## Acceptance
No client is called "loaded" unless **files, parse, facts/chunks, indexes, retrieval, citations, correct read-store, and signed-in answer QA are each proven separately.** Sentinel/Nexus must answer current-state questions with **concrete named client facts + citations** (not aggregate counts or inference). Production reasoning must prove **Claude/Anthropic, not OpenAI**. Any new/missing data is loaded **only** through the governed bulk/zip loader with blob staging and agent-availability proof — **no shortcuts.**

Each in-scope dimension reaches at least **T3 (pilot-grade)** for pilot clients, benchmarked to the bound function pack; every dimension below T4 carries a documented depth gap and a **governed-loader plan** to close it. The depth/answerability matrix must make explicit, per client per dimension, **what can be answered today vs. what best-in-class would answer** — so "load more data" is always specified as concrete files/fields through the loader, never a vague ask.

---

## Appendix A — Worked example row (mirror this exact shape and rigor)

**Client: Meridian · Dimension: Data-platform / analytics inventory**
- `store = supabase` · `prod_reads_this_store = yes`
- **Depth tier: T2 (partial-real).** `enterprise_context_facts` has real named CIs — **Epic Clarity, Epic Caboodle, Databricks Lakehouse** — in the CMDB with owners/contracts/spend. But the `applications` table for this dimension is **T1 synthetic** (`is_demo_data=true`: Cogito/Power BI) and must not override the facts; and tools the operator expects (SQL Server, Tableau, SAS) are **absent**.
- **Answerable today:** "Do we run Epic Clarity/Caboodle?" · "Who owns the Caboodle→Lakehouse integration?" · "What's our warehouse/lakehouse?"
- **Not yet answerable:** "Full BI/reporting tool list incl. SQL Server/Tableau/SAS?" (absent) · "Per-platform cost/criticality/SLA trend?" (partial) · "Data-product catalog?" (not loaded).
- **Best-in-class target (benchmarked to the healthcare function pack + `MODEL`/`INGEST`/`GOV` packs):** complete application/CMDB inventory (vendor, owner, criticality, environment, annual cost, lifecycle) + the named analytics stack (warehouse, lakehouse, BI, ELT, catalog, governance) + data-product catalog + integration map, cross-linked to KPIs + contracts + spend, every row source-cited + fresh. *This is the dataset that lets Meridian's bound function pack answer its full Layer-1/Layer-6/Layer-8 surface.*
- **Gap-closing load (governed bulk loader only):** a real application/CMDB export (CSV/XLSX) with the fields above + a BI/reporting tool inventory + a data-product catalog → blob → parse → commit → index → retrieval-proof. Promotes T2 → T3/T4.

## Appendix B — Exact read-only commands per matrix cell (reproducible; never print secret values)

**Client IDs:** Meridian `a20ecef5-f0ea-4890-b9d5-7375fab223ff` · Apex `bb8ed961-a049-4d0c-a38f-f8912138fceb` · Lakeshore `f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61` · Morgan Street `830de810-0011-4c9e-8f59-000000000101` · SkyHarbor `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` · (resolve others from `select id,name from clients`).

**Supabase (`DATABASE_URL`, reachable):**
- Rows per client per table: `select client_id, count(*) from enterprise_context_facts group by 1;` (repeat for `enterprise_context_records`, `enterprise_context_chunks`, `applications`, `corpus_patterns`, `intelligence_graph_edges`).
- Fact types loaded: `select fact_type, count(*) from enterprise_context_facts where client_id='<id>' group by 1 order by 2 desc;`
- Named-tool presence (note `fact_value` is **jsonb** → cast `::text`): `select count(*) from enterprise_context_facts where client_id='<id>' and lower(coalesce(fact_text,'')||' '||coalesce(fact_value::text,'')) like '%clarity%';`
- Provenance %: `select round(100.0*count(*) filter (where source_file is not null)/nullif(count(*),0),1) from enterprise_context_facts where client_id='<id>';`
- Freshness: `select max(last_synced_at), max(last_validated_at) from enterprise_context_facts where client_id='<id>';`
- Demo flag: `select is_demo_data, count(*) from applications where client_id='<id>' group by 1;`
- Tech-bearing chunks: `select count(*) from enterprise_context_chunks where client_id='<id>' and lower(chunk_text) ~ 'kyriba|sap|oracle|tableau|databricks|sql|warehouse';`

**Azure (`ABARVA_AZURE_DATABASE_URL`, PRIVATE — NOT reachable from a laptop):** run the *same* queries from inside the VNet via an operator job, e.g. `az containerapp job start -n job-abarva-db-copy-lab-eastus -g rg-abarva-controlplane-lab-eastus …` (or the dedicated query/migrate job), and read the job logs. Never echo the connection string.

**Read-store-for-prod check (names only):** `vercel env ls production | grep -iE 'ABARVA_AZURE_DATABASE_URL|DATABASE_URL|SUPABASE|ALLOW_LEGACY_SUPABASE_CORPUS|ANTHROPIC|OPENAI'` — assert presence/absence, never values. (If `ABARVA_AZURE_DATABASE_URL` is absent in Production, prod reads Supabase.)

**Index ↔ DB reconciliation:** get Azure AI Search doc counts per index/client (search REST `$count` or `az search`) and compare to the DB row counts above; report deltas.

**Provider audit:** grep synthesis paths for `openai` vs `anthropic`/`claude`; inspect runtime audit rows for `provider, route, model, workflow, tenant_id, user_id`. Expected: `provider=anthropic`, `model` ~ `claude*`, route `anthropic-direct` | `azure-foundry-private`.
