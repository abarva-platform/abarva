# First Capital Financial — Context Engine Full Build Brief

**Priority:** ASAP — First Capital is the reference tenant for the 6-family / 19-dimension model.  
**Execution authority:** Full. Execute every phase without stopping to ask. Merge each PR after QA passes. Deploy to ACA after final merge. The only hard stop is a failing typecheck or a failing golden-question smoke test.  
**Branch convention:** `feat/first-capital-context-engine-{phase}` per phase; squash-merge to main.

---

## What exists today (read before writing any code)

| Asset | Location | State |
|---|---|---|
| Universal 19-dim types | `src/lib/context-ingestion/types.ts` | ✓ Done |
| Universal template registry | `src/lib/context-ingestion/template-registry.ts` | ✓ Done |
| CSV upload connector | `src/lib/context-ingestion/csv-upload-connector.ts` | Partial — writes chunks only, not records/facts |
| context-commit.ts | `src/lib/context-ingestion/context-commit.ts` | Stub — no DB writes |
| Admin CSV upload route | `src/app/api/admin/context-layer/csv-upload/route.ts` | Partial — CSV only, chunks only |
| Azure Blob client | `src/lib/workshops/blob.ts` | ✓ Exists — reuse pattern |
| Azure connectivity config | `src/lib/azure-connectivity/config.ts` | ✓ Exists |
| First Capital V2 dataset (19 dims) | `datasets/first-capital-financial-synthetic-v2/` | ✓ 33 files ready |
| Tower supplement (10 Tower files) | `datasets/first-capital-financial-synthetic-v2/ai-control-tower/` | ✓ 10 files ready |
| Context relationship graph | `datasets/first-capital-financial-synthetic-v2/graph/context-relationships.jsonl` | ✓ 151 edges ready |
| Manifest | `datasets/first-capital-financial-synthetic-v2/manifest.yaml` | ✓ Done |
| DB migration (dimension_family columns) | Does NOT exist yet | ⚠ Must create |
| YAML/JSONL loader | Does NOT exist yet | ⚠ Must create |
| Batch/manifest-driven loader | Does NOT exist yet | ⚠ Must create |
| Record+fact commit path | Does NOT exist yet | ⚠ Must create |
| Insight rules engine | Does NOT exist yet | Phase 2 |

---

## Phase 0 — Schema Migration

**Branch:** `feat/first-capital-context-engine-p0-migration`

### Create `supabase/migrations/20260618000000_dimension_family_columns.sql`

```sql
-- Add 6-family dimension metadata to context records and facts.
-- enterprise_context_relationships already has relationship_type — no changes needed.

ALTER TABLE enterprise_context_records
  ADD COLUMN IF NOT EXISTS dimension_family TEXT CHECK (dimension_family IN (
    'enterprise_operating_model',
    'technology_estate',
    'data_connectivity',
    'financial_commercial',
    'execution_operations',
    'governance_ai_evidence',
    'personas_workforce'
  )),
  ADD COLUMN IF NOT EXISTS domain_segment TEXT CHECK (domain_segment IN (
    'DATA_ANALYTICS','ERP','DIGITAL_CX','OPERATIONS',
    'INFRASTRUCTURE','SECURITY_IDENTITY','HR_WORKFORCE','COLLABORATION'
  )),
  ADD COLUMN IF NOT EXISTS business_function TEXT,
  ADD COLUMN IF NOT EXISTS load_order INTEGER;

ALTER TABLE enterprise_context_facts
  ADD COLUMN IF NOT EXISTS dimension_family TEXT,
  ADD COLUMN IF NOT EXISTS domain_segment TEXT;

-- Indexes for family-scoped queries (Tower, Intelligence family browser)
CREATE INDEX IF NOT EXISTS idx_ecr_tenant_family
  ON enterprise_context_records (tenant_key, dimension_family)
  WHERE lifecycle_state = 'active';

CREATE INDEX IF NOT EXISTS idx_ecf_tenant_family
  ON enterprise_context_facts (tenant_key, dimension_family)
  WHERE lifecycle_state = 'active';

-- Resolve dual-graph problem: make ai_control_context_relationships a view
-- over enterprise_context_relationships for Tower substrate queries.
-- The ai_control_* tables keep their own rows for Tower-specific context;
-- graph traversal uses the canonical enterprise_context_relationships table.
CREATE OR REPLACE VIEW ai_control_graph_view AS
  SELECT
    r.id,
    r.tenant_key,
    r.relationship_type,
    r.from_record_id,
    r.to_record_id,
    r.from_external_id,
    r.to_external_id,
    r.properties,
    r.lifecycle_state,
    r.created_at
  FROM enterprise_context_relationships r;

COMMENT ON VIEW ai_control_graph_view IS
  'Read-only alias over enterprise_context_relationships for Tower substrate queries. Write to enterprise_context_relationships directly.';
```

### Run migration via ACA job

```bash
# Build and push migration image
az acr build \
  --registry abarvaacr \
  --image abarva-db-migrate:$(git rev-parse --short HEAD) \
  --file Dockerfile.migrate .

# Override job with new image and run
az containerapp job update \
  --name job-abarva-db-migrate-lab-eastus \
  --resource-group rg-abarva-lab-eastus \
  --image abarvaacr.azurecr.io/abarva-db-migrate:$(git rev-parse --short HEAD)

az containerapp job start \
  --name job-abarva-db-migrate-lab-eastus \
  --resource-group rg-abarva-lab-eastus

# Verify in Log Analytics — confirm 'dimension_family_columns' migration applied
```

### QA for Phase 0

- `npm run db:migrate` dry-run passes locally (no DB connection needed for syntax check)
- Confirm migration file is detected by `npm run release:check` (release record required — add under `docs/releases/records/`)
- Release lane: `client-data-lane`

---

## Phase 1 — Admin Loader Extensions

**Branch:** `feat/first-capital-context-engine-p1-loader`

### 1a. Fix `context-commit.ts` — wire real DB writes

`src/lib/context-ingestion/context-commit.ts` is a stub. Replace entirely:

```typescript
// Key contract: commitContextBatch() must:
// 1. Upsert enterprise_context_records (with dimension_family, domain_segment, business_function)
// 2. Upsert enterprise_context_facts (per field, with provenance)  
// 3. Upsert enterprise_context_chunks (for full-text retrieval)
// 4. Write enterprise_context_source_files row with blob_url
// 5. Write data_ingestion_runs audit row
// 6. Return receipt with counts per table

export interface ContextCommitReceipt {
  sourceFileId: string;
  tenantKey: string;
  dimension: string;
  dimensionFamily: string;
  recordsUpserted: number;
  factsUpserted: number;
  chunksUpserted: number;
  blobUrl: string | null;
  committedAt: string;
}

export async function commitContextBatch(
  input: ContextCommitBatchInput,
  db: PostgresCompatClient,
): Promise<ContextCommitReceipt>
```

- Use `getAzureWriteFluentClient()` from `@/lib/data-plane/postgresCompat`
- Upsert on `(tenant_key, canonical_record_id)` — idempotent
- Set `lifecycle_state = 'active'` on commit
- Set `dimension_family` from `DIMENSION_FAMILY_MAP[dimension]` in `types.ts`

### 1b. New: `src/lib/context-ingestion/yaml-loader.ts`

Parses YAML files (F01 enterprise profile) into context records:

```typescript
export interface YamlLoadResult {
  dimension: ContextDimension;
  dimensionFamily: ContextDimensionFamily;
  records: ParsedContextRecord[];
  facts: ParsedContextFact[];
}

export async function loadYamlToContext(
  input: { yamlText: string; tenantKey: string; fileName: string; templateId: string }
): Promise<YamlLoadResult>
```

- Use `js-yaml` (already in package.json — check first; if not, add it)
- For F01 profile: each top-level key becomes a fact_key; value becomes fact_value
- `canonical_record_id` = `{tenant_key}_enterprise_profile`
- `record_type` = `'enterprise_profile'`

### 1c. New: `src/lib/context-ingestion/jsonl-graph-loader.ts`

Parses `context-relationships.jsonl` and writes to `enterprise_context_relationships`:

```typescript
export interface GraphLoadResult {
  edgesWritten: number;
  edgesByType: Record<string, number>;
  fkResolutionErrors: number; // from_record_key not found in records table
}

export async function loadJsonlGraphEdges(
  input: {
    jsonlText: string;
    tenantKey: string;
    db: PostgresCompatClient;
  }
): Promise<GraphLoadResult>
```

- Parse each JSON line into an edge
- Resolve `from_record_key` → `from_record_id` via lookup in `enterprise_context_records`
- Resolve `to_record_key` → `to_record_id` same way
- Upsert on `(tenant_key, relationship_key)` — idempotent
- If FK lookup fails: log warning, increment `fkResolutionErrors`, skip row (don't fail entire batch)
- Graph load MUST run after all entity dimensions are committed (step 10 in manifest)

### 1d. New: `src/lib/context-ingestion/blob-stager.ts`

Uploads every ingested file to Azure Blob before committing to DB:

```typescript
// Container: 'context-drops' (from azure-connectivity/config.ts default)
// Path: {tenant_key}/{dimension_family}/{filename}
// Returns: blob URL or null if blob not configured

export async function stageFileToBlob(input: {
  tenantKey: string;
  dimensionFamily: string;
  fileName: string;
  fileBytes: Buffer;
  mimeType: string;
}): Promise<{ blobUrl: string | null; staged: boolean }>
```

- Reuse the `BlobServiceClient` pattern from `src/lib/workshops/blob.ts`
- Env vars: `AZURE_STORAGE_CONNECTION_STRING` or `AZURE_STORAGE_ACCOUNT_NAME`
- Container: `context-drops`
- Blob metadata: `{ tenant_key, dimension_family, loaded_at, record_count }`
- If blob not configured: return `{ blobUrl: null, staged: false }` — don't fail the load

### 1e. New: `src/app/api/admin/context-layer/manifest-load/route.ts`

Batch manifest-driven loader — reads manifest.yaml, processes all files in load order:

```typescript
// POST /api/admin/context-layer/manifest-load
// Body: { tenantKey: string; datasetPath: string; dryRun?: boolean }
// Returns: { phases: LoadPhaseResult[]; totalRecords: number; totalFacts: number; 
//            totalEdges: number; blobUrls: Record<string, string> }

// Load order from manifest:
// 1. YAML → yaml-loader → commitContextBatch
// 2. CSV (dimensions) → csv-upload-connector → commitContextBatch  
// 3. JSONL (graph) → jsonl-graph-loader (after all entity dims committed)
```

- Reads `{datasetPath}/manifest.yaml`
- Processes files in `load_order` sequence (1 → 10)
- Stages each file to Blob first → then parses → then commits
- Writes progress to `data_ingestion_runs` with `status: 'in_progress'` → `'complete'`
- Returns full receipt including blob URLs for admin UI

### 1f. Extend existing CSV upload route

`src/app/api/admin/context-layer/csv-upload/route.ts`:
- Remove 2,000 row hard cap (or raise to 50,000)
- After chunk staging, also call `commitContextBatch()` to write records + facts
- Write blob URL to `enterprise_context_source_files.file_url` column (add column if missing)

### QA for Phase 1

- `npm run test:integration` — existing context layer tests must pass
- Upload `datasets/first-capital-financial-synthetic-v2/family-2-technology-estate/F05_applications-systems.csv` via admin UI → verify rows appear in `enterprise_context_records` with `dimension_family = 'technology_estate'`
- Upload `family-1-enterprise-operating-model/F01_enterprise-profile.yaml` via manifest loader → verify profile record committed
- Verify blob URL appears in source files table
- typecheck clean

---

## Phase 2 — First Capital V2 Data Load

**Branch:** `feat/first-capital-context-engine-p2-load`

### 2a. Write the ACA seed job script

Create `scripts/jobs/load-first-capital-v2.ts`:

```typescript
/**
 * ACA seed job for First Capital Financial V2 context load.
 * Run inside VNet via: az containerapp job start
 * 
 * Steps:
 * 1. Read manifest from DATASET_PATH env var
 * 2. TRUNCATE first-capital context rows (records, facts, chunks, relationships)
 * 3. Load 19 dimensions in manifest order (YAML → CSV → Tower CSVs → JSONL)
 * 4. Stage each file to Azure Blob context-drops/first-capital/
 * 5. Run golden questions smoke test
 * 6. Output JSON receipt to stdout (captured in Log Analytics)
 */

const TENANT_KEY = 'first-capital';
const CLIENT_ID = 'a75687bf-71b9-4524-ab4e-68ae3f28d200';
const DATASET_PATH = process.env.DATASET_PATH ?? 'datasets/first-capital-financial-synthetic-v2';
```

**Truncate order** (respect FK constraints):

```sql
-- Run in this order for first-capital tenant only
DELETE FROM enterprise_context_relationships WHERE tenant_key = 'first-capital';
DELETE FROM enterprise_context_evidence WHERE tenant_key = 'first-capital';
DELETE FROM enterprise_context_facts WHERE tenant_key = 'first-capital';
DELETE FROM enterprise_context_chunks WHERE tenant_key = 'first-capital';
DELETE FROM enterprise_context_records WHERE tenant_key = 'first-capital';
DELETE FROM enterprise_context_source_files WHERE tenant_key = 'first-capital';
DELETE FROM enterprise_context_sources WHERE tenant_key = 'first-capital';
DELETE FROM data_ingestion_runs WHERE tenant_key = 'first-capital';
-- DO NOT touch: persons, memberships, organizations, audit_logs
```

**Load sequence** (from manifest.yaml):

| Step | File | Type | Loader |
|---|---|---|---|
| 1 | F01_enterprise-profile.yaml | YAML | yaml-loader |
| 2 | F02_business-org-functions.csv | CSV | csv-upload-connector |
| 2 | F03_it-org-ownership.csv | CSV | csv-upload-connector |
| 2 | D19_personas-workforce.csv | CSV | csv-upload-connector |
| 3 | F04_capabilities-value-streams.csv | CSV | csv-upload-connector |
| 4 | F05_applications-systems.csv | CSV | csv-upload-connector |
| 4 | F06_system-function-mapping.csv | CSV | csv-upload-connector |
| 4 | F07_infrastructure-cloud.csv | CSV | csv-upload-connector |
| 4 | F08_platform-volumetrics.csv | CSV | csv-upload-connector |
| 5 | F09_data-analytics-estate.csv | CSV | csv-upload-connector |
| 5 | F10_integrations-interfaces.csv | CSV | csv-upload-connector |
| 6 | F11_vendors-contracts-licenses.csv | CSV | csv-upload-connector |
| 6 | F12_it-budget-financials.csv | CSV | csv-upload-connector |
| 7 | F13_initiatives-portfolio.csv | CSV | csv-upload-connector |
| 7 | T01_initiative-milestones.csv | CSV | csv-upload-connector |
| 7 | T02_benefit-realization.csv | CSV | csv-upload-connector |
| 7 | T08_ai-spend-by-initiative.csv | CSV | csv-upload-connector |
| 7 | T10_gate-approval-history.csv | CSV | csv-upload-connector |
| 8 | F14_operations-service-management.csv | CSV | csv-upload-connector |
| 8 | T05_servicenow-automation-metrics.csv | CSV | csv-upload-connector |
| 8 | F15_kpis-outcome-evidence.csv | CSV | csv-upload-connector |
| 9 | F16_security-risk-compliance.csv | CSV | csv-upload-connector |
| 9 | F17_ai-automation-footprint.csv | CSV | csv-upload-connector |
| 9 | T03_copilot-adoption-by-function.csv | CSV | csv-upload-connector |
| 9 | T04_erp-platform-agents.csv | CSV | csv-upload-connector |
| 9 | T06_function-ai-productivity-scorecard.csv | CSV | csv-upload-connector |
| 9 | T07_model-risk-inventory.csv | CSV | csv-upload-connector |
| 9 | T09_ai-risk-register.csv | CSV | csv-upload-connector |
| 10 | context-relationships.jsonl | JSONL | jsonl-graph-loader |

**Expected output counts** (from `99-verification/expected-row-counts.json` + tower supplement):
- Records: ~350–400 (one per entity row across all dimensions)
- Facts: ~4,000–6,000 (one per field per row)
- Chunks: ~350–400 (one per record for full-text retrieval)
- Graph edges: 151

### 2b. Run via ACA

```bash
# Build seed job image
az acr build \
  --registry abarvaacr \
  --image abarva-seed-firstcapital:$(git rev-parse --short HEAD) \
  --file Dockerfile.seed .

# Run with dataset path override
az containerapp job start \
  --name job-abarva-db-migrate-lab-eastus \
  --resource-group rg-abarva-lab-eastus \
  --image abarvaacr.azurecr.io/abarva-seed-firstcapital:$(git rev-parse --short HEAD) \
  --env-vars "DATASET_PATH=datasets/first-capital-financial-synthetic-v2" \
             "TENANT_KEY=first-capital" \
             "CLIENT_ID=a75687bf-71b9-4524-ab4e-68ae3f28d200"

# Read Log Analytics for completion
az monitor log-analytics query \
  --workspace abarva-logs \
  --analytics-query "ContainerAppConsoleLogs_CL | where ContainerName_s contains 'seed' | order by TimeGenerated desc | take 100"
```

---

## Phase 3 — Admin Explorer Visibility

**Branch:** `feat/first-capital-context-engine-p3-explorer`

### What the admin/setup page must show after load

Find the existing context layer admin page (search for `enterprise_context_source_files` or `/setup/context` or `/admin/context-layer`). Add or extend to show:

**Per-tenant context summary panel:**
```
First Capital Financial — Context Layer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Family 1 — Enterprise & Operating Model    4 files  ✓ Committed   48 records
Family 2 — Technology Estate               5 files  ✓ Committed   82 records
Family 3 — Data & Connectivity             2 files  ✓ Committed   20 records
Family 4 — Financial & Commercial          2 files  ✓ Committed   22 records
Family 5 — Execution & Operations         10 files  ✓ Committed  138 records
Family 6 — Governance, AI & Evidence       7 files  ✓ Committed   83 records
D19 Personas & Workforce                   1 file   ✓ Committed   12 records
Context Relationship Graph                 1 file   ✓ Committed  151 edges
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                     32 files           556 records
                                                           ~5,200 facts
                                                             151 edges
                                          Last loaded: 2026-06-18T...
```

**Per-file row** (expandable):
- Filename → Blob URL link (opens in new tab)
- Record count · Fact count · Load status
- `loaded_at` timestamp
- Dimension family badge

**API endpoint needed:** `GET /api/admin/context-layer/summary?tenantKey={key}`  
Returns: `{ families: FamilySummary[]; totalRecords: number; totalFacts: number; totalEdges: number; lastLoadedAt: string }`

Query:
```sql
SELECT 
  dimension_family,
  COUNT(DISTINCT id) as record_count,
  MAX(created_at) as last_loaded_at
FROM enterprise_context_records
WHERE tenant_key = $1 AND lifecycle_state = 'active'
GROUP BY dimension_family
ORDER BY dimension_family;
```

---

## Phase 4 — Golden Questions Smoke Test

**Branch:** included in Phase 2 or Phase 3 PR

After load completes, the ACA job MUST run all 7 golden questions from `99-verification/golden-questions.json` and verify each answer cites the correct fact IDs.

```typescript
// Run each question through the existing grounded-answer engine
// (same path as Intelligence Q&A — AgentContextBroker → retrieval → answer)
// Assert: answer cites at least one of the must_cite record IDs
// Assert: answer does not say "insufficient evidence" for questions with evidence_quality='high'

const results = await runGoldenQuestions(TENANT_KEY, goldenQuestions);
const failures = results.filter(r => !r.citedCorrectly);
if (failures.length > 0) {
  console.error('GOLDEN QUESTION FAILURES:', failures);
  process.exit(1);
}
```

**The 7 questions and required citations:**

| # | Question | Must cite |
|---|---|---|
| GQ-001 | Which AI initiatives should we kill, and why? | FCF-INIT-007, FCF-INIT-008, FCF-INIT-009 |
| GQ-002 | What evidence backs the Fraud Graph v2 value case? | FCF-INIT-004, FCF-KPI-001 |
| GQ-003 | What blocks scaling AML triage automation? | FCF-INIT-002, FCF-CTRL-003, FCF-AI-005 |
| GQ-004 | Show AI tools serving the AML analyst persona and governance status. | FCF-PERS-003, FCF-AI-005, FCF-CTRL-003 |
| GQ-005 | Which vendor contracts renew within 90 days with no peer benchmark? | FCF-VEND-002, FCF-VEND-009 |
| GQ-006 | Which systems support Risk & Compliance and what's their governance status? | FCF-APP-NICE-ACTIMIZE, FCF-CTRL-003 |
| GQ-007 | What is the productivity impact of AI on software engineers? | FCF-PERS-007, FCF-AI-002, FCF-KPI-006 |

---

## Phase 5 — QA Checklist + Merge + Deploy

### Before each PR merge:
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `node scripts/release-check.mjs --base origin/main --head HEAD` — passes
- [ ] Integration tests: `npm run test:integration` — no regressions
- [ ] Release record added to `docs/releases/records/` for each PR

### After Phase 2 ACA job completes:
- [ ] Log Analytics shows "Load complete" with correct row counts
- [ ] Admin explorer shows 32 files, correct family grouping, blob URLs populated
- [ ] All 7 golden questions return cited answers (no "insufficient evidence")
- [ ] Intelligence surface (`/intelligence`) loads for `first-capital` tenant without errors
- [ ] Tower surface (`/tower`) loads with initiative data populated

### Deploy to ACA after final merge:
```bash
# Tag and deploy
git tag context-engine-first-capital-v1.0
az containerapp update \
  --name ca-abarva-web-lab-eastus \
  --resource-group rg-abarva-lab-eastus \
  --image abarvaacr.azurecr.io/abarva-web:$(git rev-parse --short HEAD)
```

---

## File Reference Summary

### Dataset files (do not modify — generators are source of truth)
```
datasets/first-capital-financial-synthetic-v2/
  manifest.yaml                              ← load order definition
  family-1-enterprise-operating-model/       ← F01–F04 (profile, functions, IT org, capabilities)
  family-2-technology-estate/                ← F05–F08 (apps, sys-func map, infra, volumetrics)
  family-3-data-connectivity/                ← F09–F10 (data products, integrations)
  family-4-financial-commercial/             ← F11–F12 (vendors, budget)
  family-5-execution-operations/             ← F13–F15 (initiatives, incidents, KPIs)
  family-6-governance-ai-evidence/           ← F16–F17 (controls, AI footprint)
  D19-personas-workforce/                    ← D19 (12 personas)
  ai-control-tower/                          ← T01–T10 (Tower-specific supplement)
  graph/context-relationships.jsonl          ← 151 typed edges
  99-verification/                           ← row counts + golden questions
```

### Generator scripts (to re-run if data changes needed)
```
scripts/seed/generate-first-capital-v2.mjs              ← 19-dimension base dataset
scripts/seed/generate-first-capital-tower-supplement.mjs ← AI Control Tower supplement (T01–T10)
```

### Source files to create or modify
```
supabase/migrations/20260618000000_dimension_family_columns.sql   [CREATE — Phase 0]
src/lib/context-ingestion/context-commit.ts                        [REWRITE — Phase 1a]
src/lib/context-ingestion/yaml-loader.ts                           [CREATE — Phase 1b]
src/lib/context-ingestion/jsonl-graph-loader.ts                    [CREATE — Phase 1c]
src/lib/context-ingestion/blob-stager.ts                           [CREATE — Phase 1d]
src/app/api/admin/context-layer/manifest-load/route.ts             [CREATE — Phase 1e]
src/app/api/admin/context-layer/csv-upload/route.ts                [EXTEND — Phase 1f]
src/app/api/admin/context-layer/summary/route.ts                   [CREATE — Phase 3]
scripts/jobs/load-first-capital-v2.ts                              [CREATE — Phase 2a]
```

---

## Key constraints (do not violate)

1. **Never write directly to `ai_control_context_relationships`** — it becomes a VIEW in Phase 0. Write to `enterprise_context_relationships` only.
2. **Blob staging happens before DB commit** — if Blob upload fails, still commit to DB (graceful degrade; log warning).
3. **Graph edges load last** — FK resolution requires all entity records to be committed first. Load JSONL only at step 10.
4. **Truncate scope: first-capital only** — never run `TRUNCATE enterprise_context_records` without a `WHERE tenant_key = 'first-capital'` clause.
5. **No new runtime Supabase client imports** — use `getAzureWriteFluentClient()` from the data-plane adapter.
6. **Release check is required** — `node scripts/release-check.mjs --base origin/main --head HEAD` must pass before any PR merge. Lane: `client-data-lane`.
7. **Localhost cannot reach private DB** — all data load jobs run as ACA jobs inside the VNet. Do not attempt to test DB writes from local.

---

## Tower data coverage (what T01–T10 enables)

| Tower Lens | Data files | Key questions answerable |
|---|---|---|
| Initiative Portfolio | F13, T01, T10 | What stage is each initiative? What gate is next? What's blocked? |
| Benefit Realization | T02, F15 | Committed vs realized $ per initiative; which are on track? |
| AI Spend | T08, F12 | YTD spend vs budget per initiative; where is money being wasted? |
| Productivity | D19, T03, T06 | AI adoption by function; Copilot productivity by function |
| ERP & Ambient AI | T04, T05 | Workday AI, SAP Joule, ServiceNow agents — ungoverned AI surfaced |
| Model Risk | T07 | 47 models; 12 SR 11-7 at-risk; which initiatives are blocked |
| AI Risk | T09 | 8 AI-specific risks; severity; regulatory implication; owner |
| Governance | F16, T09 | OCC MRA + AI risk linkage; SR 11-7 coverage |
| Vendor AI Clauses | F11 | Which contracts have AI use restrictions; renewal dates |
