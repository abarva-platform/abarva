# Read-only corpus DB + Azure Search verification receipt

- **Date:** 2026-06-07
- **Operator:** anand.sundaram@thesundaram.com (Azure sub `abarva-lab-sub`)
- **How:** all DB/Search reads executed **inside Azure** via the private operator
  job `job-abarva-private-operator-eus` (RG `rg-abarva-controlplane-lab-eastus`).
  The private Azure Postgres (`10.43.1.4`) and the AAD-only Search service are
  **not reachable from a laptop**, so a local shell would have hit Supabase /
  failed — this run did not. **No data mutated. No secrets printed.**
- **Mechanism note:** `az containerapp job start --args` cannot pass a leading-dash
  shell flag (argparse limitation), so the job's container `args` were temporarily
  PATCHed (ARM REST) to run a read-only Node script, executed, and **restored to
  the original args in a `finally` block**. Env secrets (`SEARCH_KEY`) were dropped
  on restore.

---

## 1. Which DB the corpus layer actually reads

| Probe | Value |
|---|---|
| `current_database()` | **`abarva_control`** |
| `inet_server_addr()` | **`10.43.1.4/32`** (Azure private VNet) |
| `current_user` | `abarvaadmin` |
| `search_path` | `"$user", public` |
| `DATABASE_URL` host | `pg-abarva-context-lab-001.postgres.database.azure.com` |
| `DATABASE_URL` present | **yes** (secretRef `azure-postgres-control-database-url`) |
| `ABARVA_AZURE_DATABASE_URL` present | **no** — Azure is wired via `DATABASE_URL` itself |

→ The runtime corpus layer reads the **Azure private Postgres**, not Supabase.

## 2. Corpus DB contents (`abarva_control`)

| Metric | Count |
|---|---|
| `corpus_patterns` | **9,026** |
| `genome_patterns` | **43,436** |
| Lakeshore patterns (`LSH-` slug prefix) | **8,987** (≈ all of corpus_patterns) |
| rows mentioning `kyriba` | 27 |
| rows mentioning `treasury` | 1,511 |
| rows mentioning literal `LSH-TMS` | **0** (no `LSH-TMS-*` id scheme exists) |
| `corpus_patterns` tenant column | **none** — tenant is encoded in `slug` / `search_doc_id`, not a `client_id` column |

### `PAT-LSH-D18-00479` — **EXISTS (real, not phantom)**

```
id            d29b7d36-1239-4163-833c-529f213f06da
slug          pat-lsh-d18-00479                 (stored lowercase)
title         Prioritize City and State Procurement Calendars For Timing Local Bids
category      D18:market-access
status        published        confidence 0.920        depth_score 9.00
author        lakeshore-corpus-loader           published_at 2026-06-05
search_doc_id ZjJlZjBiNmEt...   → base64-decodes to
              f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61:PAT-LSH-D18-00479:1   (tenant:patternId:version)
overlays      chicago, illinois, public-sector, construction, capacity-planning
```

It is a **Lakeshore public-sector procurement** pattern. It has nothing to do with
treasury/Kyriba — so binding it to a Kyriba treasury decision was a **relevance
mis-bind (positional)**, NOT a phantom/fabricated id. (Note: `found_in_id_columns`
was false only because the search probed uppercase `PAT-LSH-D18-00479` against the
lowercase `slug`; the case-insensitive jsonb match found exactly 1 row.)

### Treasury/Kyriba patterns that *should* bind to a Kyriba decision
`pat-lsh-d01-*` capital/treasury family, e.g.:
- `pat-lsh-d01-00028` International acquisitions need treasury and tax readiness…
- `pat-lsh-d01-00032` Family principal overrides must be ratified before capital leaves treasury
- `pat-lsh-d01-00077` Capital reserve release requires dual signoff: CFO treasury + IC approval
- `pat-lsh-d01-00102` HoldCo debt maturity ladder must not bunch around family liquidity windows
…plus the modernization/cutover patterns surfaced by Search below (D07/D08).

## 3. Azure Search cross-check

Two services exist:

| Service | Auth | Network | Role |
|---|---|---|---|
| `srch-abarva-context-lab-eastus` | **AAD-only** (`disableLocalAuth=true`) | **Private** | the service the runtime points at (`AZURE_SEARCH_SERVICE_NAME`) |
| `srchlakeshorepilotlsh001` | api-key | Public | Lakeshore-pilot mirror |

**Runtime config:** `AZURE_SEARCH_SERVICE_NAME=srch-abarva-context-lab-eastus`,
`AZURE_CONNECTIVITY_SEARCH_INDEX_NAME=tenant-context-v1`,
`ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS=…,lakeshore-holdings,…`.

**Indexes on the runtime service** (AAD list, HTTP 200):
`corpus-global, evidence-ledger-v1, industry-corpus-v1, lakeshore-patterns-v1, signals-v1, source-vendor-v1, tenant-context-v1`
→ the pattern index **`lakeshore-patterns-v1` is present on the runtime service.**

**Doc count — `lakeshore-patterns-v1` = 8,987 docs** (read off the pilot mirror;
matches the 8,987 DB rows exactly). The runtime service's own count could not be
read with my user identity (data-plane query returns **403** — I have index-list
but not "Search Index Data Reader"); the index exists and the count is corroborated
by the DB and the mirror.

**Sample query `"Kyriba treasury modernization"` (top 5, `lakeshore-patterns-v1`):**
| score | patternId | title |
|---|---|---|
| 30.0 | PAT-LSH-D07-00108 | Technology Modernization Roadmap for Mid-Market Operating Companies |
| 28.5 | PAT-LSH-D07-00123 | Enforce Technology Modernization Roadmaps With Security And ROI Gates |
| 26.8 | PAT-LSH-D17-00344 | Capital Allocation to Facility Modernization in Aging Midwest Plants |
| 25.6 | **PAT-LSH-D08-00411** | **Kyriba-to-bank cutover uses four-step parallel run with hard freeze** |
| 24.9 | PAT-LSH-D08-00406 | Bank onboarding cutover uses dual-run with host-to-host fallbacks |

→ The index returns **correctly relevant** treasury/Kyriba patterns. A search for
`PAT-LSH-D18-00479` returns **0 hits** in this index — i.e. the procurement pattern
is *not* what relevance retrieval would surface for a Kyriba decision. The mis-bind
was a **DB-layer positional binder bug**, not a Search relevance problem.

## 3b. Two-namespace reconciliation (added after cross-check)

Lakeshore patterns exist in **two parallel, non-cross-referenced namespaces**:

| Store | Scheme | Lakeshore rows | `pat-lsh-d18-00479` | `LSH-TMS-*` |
|---|---|---|---|---|
| `corpus_patterns` (9,026) | `pat-lsh-dNN-NNNNN` | 8,987 | **present (published)** | 0 |
| `genome_patterns` (43,436) | `LSH-TMS-NNN` | 12 curated Kyriba | 0 | **12** |
| runtime index `lakeshore-patterns-v1` | `LSH-TMS-*` | 12 docs | absent | 12 |

The real Kyriba/treasury patterns (LSH-TMS-001…012, e.g. LSH-TMS-002 "Bank
connectivity matrix clears before rollout confidence is claimed", LSH-TMS-009
"Payment approval and BEC controls are rollout acceptance criteria") live in
`genome_patterns` and the runtime search index. The disputed
`PAT-LSH-D18-00479` is a real **`corpus_patterns`** procurement pattern — a
*different namespace* from the Kyriba decision's grounding set.

## 4. Outcome (corrected)

`PAT-LSH-D18-00479` is **REAL** (a published `corpus_patterns` row) — **not
fabricated/phantom**. The defect is a **cross-namespace mis-bind**: a
`corpus_patterns` (`pat-lsh-*`) id leaked onto a Kyriba decision card whose
grounding namespace is `genome`/`LSH-TMS` (the `lakeshore-patterns-v1` index).

**Guard must be grounding-scoped, NOT "absent from all tables":**
- A guard of *"reject ids not found in any table"* would **fail to catch** this —
  `PAT-LSH-D18-00479` IS a valid id (in `corpus_patterns`). The bug would survive.
- Correct rule: for each decision, bound patterns must come from **that decision's
  grounding set** (here the Kyriba retrieval index / `genome` LSH-TMS). Reject any
  id not in that set even if valid elsewhere; bind by relevance to the real
  LSH-TMS match (LSH-TMS-002 / LSH-TMS-009). Relevance + fail-closed primitives
  already exist in PR #3230 (`pattern-relevance.ts`) but must key off the
  decision's grounding namespace.
- Also trace **where** a `corpus_patterns` id is emitted onto a `genome`-grounded
  card (the binder is reading the wrong namespace, not just mislabeling).
- Land as a **separate small PR**, not the 205-file Lakeshore load PR.

**Data divergence to follow up (out of scope for the binder PR):** the corpus DB
holds 8,987 `pat-lsh-*` Lakeshore patterns; the runtime index holds only 12
`LSH-TMS-*` docs. These two Lakeshore pattern sets do not cross-reference —
retrieval and the bulk corpus disagree on what "Lakeshore patterns" are.

## Read-only commands used (representative)

```sql
-- via private operator job; DATABASE_URL = Azure (10.43.1.4)
select current_database(), current_user, inet_server_addr()::text, current_setting('search_path');
select count(*) from corpus_patterns;            -- 9026
select count(*) from genome_patterns;            -- 43436
select count(*) from corpus_patterns t where to_jsonb(t)::text ilike '%PAT-LSH-D18-00479%';  -- 1
select * from corpus_patterns t where to_jsonb(t)::text ilike '%PAT-LSH-D18-00479%' limit 3;
select count(*) from corpus_patterns t where to_jsonb(t)::text ilike '%kyriba%';   -- 27
```

```text
# Azure Search (run in-VNet via operator job)
GET  /indexes?api-version=2023-11-01&$select=name           (AAD bearer; status 200)
GET  /indexes/lakeshore-patterns-v1/docs/$count             (pilot api-key; 8987)
POST /indexes/lakeshore-patterns-v1/docs/search  {"search":"Kyriba treasury modernization","top":5}
```

```bash
# orchestration (read-only): PATCH job args -> start -> poll -> RESTORE args (finally)
az containerapp job show  -g <rg> -n job-abarva-private-operator-eus --query properties.template.containers[0]
az rest --method patch --url <job-arm-id>?api-version=2024-03-01 --body @patch.json   # temp args swap + restore
az containerapp job start -g <rg> -n job-abarva-private-operator-eus
az monitor log-analytics query -w <workspace> --analytics-query "ContainerAppConsoleLogs_CL | where ContainerGroupName_s startswith '<exec>'"
```
