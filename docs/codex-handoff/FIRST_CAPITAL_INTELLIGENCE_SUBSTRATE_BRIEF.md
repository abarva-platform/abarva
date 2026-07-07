# First Capital Financial — Intelligence Substrate Build Brief (P3–P5)

**Continues:** `docs/codex-handoff/FIRST_CAPITAL_CONTEXT_ENGINE_BUILD_BRIEF.md` (P0–P2 — schema, loader, ACA load job — already executed; release records `2026-06-18-first-capital-context-engine-p0/p1-loader/p2-load-job.md`).

**Priority:** ASAP — this is what makes Intelligence and Tower _reliable_ across First Capital, SkyHarbor, Meridian, Lakeshore, Apex.
**Execution authority:** Full. Execute every phase without stopping to ask. Merge each PR after QA passes. Deploy to ACA after final merge. The only hard stops are a failing typecheck, a failing `release:check`, or a failing golden-question smoke test.
**Branch convention:** `feat/first-capital-context-engine-p{3,4,5}-{name}` per phase; squash-merge to main.

> **Numbering note.** These P3–P5 **supersede** the original brief's "Phase 3 (Explorer Visibility) / Phase 4 (Golden Questions) / Phase 5 (QA-Merge-Deploy)". Explorer visibility is folded into **P4** (the admin/setup explorer becomes a _consumer_ of `enterprise_context_coverage_view`, not its own queries). Golden questions move into **P5** (they now assert against the deep, typed fact set). The original P0–P2 stand as executed.

---

## North Star (the architectural decision this brief encodes)

**Intelligence is built on the structured context model — records → typed facts → relationships → deterministic insight rules → governed read models. Corpus retrieval is for citation text, not for discovering truth. The LLM summarizes and explains; it is never the source of truth.**

The live First Capital load (414 records · **192 facts** · 401 chunks · 28/28 blob-staged · Tower T01–T10) proved P0–P2 work. But the probe exposed two failures this brief fixes:

> **⚠ RECONCILE THE BASELINE FACT COUNT BEFORE RUNNING P3.** This line says **192 facts**, but
> §4f (Tower projection) says the same load "committed 414 records / **4,484 facts**," and the P3 QA
> gate says "**≥ 3,500 (was 192)**." These cannot all be true. Confirm the actual current
> `enterprise_context_facts` count for `first-capital` first (a one-line `SELECT count(*) … WHERE
> tenant_key='first-capital' AND lifecycle_state='active'`). If it is already ~4,484, the "thin
> facts / most records → zero facts" premise and the P3 target are wrong and P3 should be re-scoped
> to *typing* existing facts, not *extracting* missing ones. If it is 192, fix §4f's number. Do not
> start P3 against an unverified baseline.

1. **Facts are too thin to answer with precision.** 414 records → only 192 facts means most records decomposed to _zero_ atomic facts. The CSV connector (`loadCsvUploadToTenantContext`) writes **chunks only**, no fact decomposition. You cannot chart a trend, answer "renewals in 90 days", or cite a number off chunks. **Facts are the substrate. P3 makes them deep and typed.**
2. **Intelligence reads the wrong substrate.** The DB has clean `enterprise_context_records` + Tower T01–T10, but the Intelligence surface skews to stale general `it_financials` Azure Search chunks. That's a **read-model wiring bug, not a data bug** — never "fix" it with a reload. **P4 builds governed read models and re-points Intelligence + Tower at them; Search drops to citation-only.**

---

## What exists today (read before writing any code)

| Asset                                               | Location                                                                                               | State                                                                                                                                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Records/facts/chunks/relationships schema           | `supabase/migrations/20260514100000_enterprise_context_layer.sql`                                      | ✓ `enterprise_context_facts` already has `fact_type`, `fact_value` (JSONB), `lifecycle_state`, `supersedes_fact_id`, `value_hash`, `valid_from/through`, `UNIQUE(tenant_key, record_id, fact_key, value_hash)` |
| 6-family dimension columns                          | `supabase/migrations/20260618000000_dimension_family_columns.sql`                                      | ✓ P0 — `dimension_family`, `domain_segment`, `business_function`, `load_order` on records + facts                                                                                                              |
| `commitContextBatch()`                              | `src/lib/context-ingestion/context-commit.ts`                                                          | ✓ P1 — upserts records + facts + chunks + source_files + `data_ingestion_runs`                                                                                                                                 |
| CSV connector                                       | `src/lib/context-ingestion/csv-upload-connector.ts`                                                    | ⚠ Writes **chunks only** — `PreparedCsvContextChunk`, no atomic fact decomposition. **Root of the 192-facts problem.**                                                                                         |
| Template registry (19 universal templates)          | `src/lib/context-ingestion/template-registry.ts`                                                       | ✓ Field/column metadata available to drive typing                                                                                                                                                              |
| Insight engine types                                | `src/lib/context-ingestion/types.ts`                                                                   | ✓ `ContextInsight`, `SignificanceRule` **types exist** — engine does **not**. `ContextInsight.derivedFromFactIds` exists but is never populated → the "0% cited" symptom.                                      |
| Plumbing read model (L0)                            | `src/lib/context-ingestion/tenant-context-read-model.ts`                                               | ✓ `getTenantContextSummary`, `getTenantIngestionStages`, `getTenantSourceFiles` — **ingestion/plumbing only**, no semantic lens/brief views                                                                    |
| Tower lens views (partial)                          | `src/lib/tower/band-metrics-view.ts`, `src/lib/tower/atlas-interpretation-view.ts`                     | ⚠ Exist but read ad-hoc — **reconcile to consume the materialized lens model, don't rebuild**                                                                                                                  |
| Grounded answer pattern (reuse)                     | `src/lib/source/source-answer-engine.ts`, `src/lib/intelligence/synthesis/healthcareAnswerContract.ts` | ✓ Refuse-on-insufficient / cite-provided-ids contract — **P5 reuses this, does not reinvent**                                                                                                                  |
| Architecture rules check                            | `npm run audit:architecture-rules`                                                                     | ✓ Add a read-model-boundary rule here (mirror the broker boundary)                                                                                                                                             |
| Typed value columns on facts                        | Does NOT exist                                                                                         | ⚠ P3 must create                                                                                                                                                                                               |
| Canonical entity identity                           | Does NOT exist                                                                                         | ⚠ P3 must create                                                                                                                                                                                               |
| Semantic read-model views                           | Does NOT exist                                                                                         | ⚠ P4 must create                                                                                                                                                                                               |
| Insight rule engine + lifecycle                     | Does NOT exist                                                                                         | ⚠ P5 must create                                                                                                                                                                                               |
| Context grounded-answer engine (Intelligence/Tower) | Does NOT exist                                                                                         | ⚠ P5 must create                                                                                                                                                                                               |

---

## Phase 3 — Fact Extraction Depth + Typed Values + Canonical Identity

**Branch:** `feat/first-capital-context-engine-p3-facts`
**Goal:** Facts jump from ~192 to ~3,500–6,000, every numeric/date/percent fact is _typed and queryable_, and the same real-world entity (e.g. Snowflake across F05/F11/T04) resolves to one node so the graph unifies.

### 3a. Migration `supabase/migrations/20260619000000_fact_typed_values_and_canonical_identity.sql`

```sql
-- Typed value columns: populated by the extractor per fact_type, NOT generated,
-- because fact_value is JSONB and parsing rules are template-driven.
ALTER TABLE enterprise_context_facts
  ADD COLUMN IF NOT EXISTS value_numeric NUMERIC,
  ADD COLUMN IF NOT EXISTS value_date    DATE,
  ADD COLUMN IF NOT EXISTS value_bool    BOOLEAN,
  ADD COLUMN IF NOT EXISTS unit          TEXT,      -- 'USD','USD_M','pct','count','days'
  ADD COLUMN IF NOT EXISTS as_of_date    DATE;      -- the spine for freshness + "what changed"

-- Deterministic numeric range + date window queries ("spend > committed", "renewals in 90 days")
CREATE INDEX IF NOT EXISTS idx_ecf_numeric
  ON enterprise_context_facts (tenant_key, fact_key, value_numeric)
  WHERE lifecycle_state = 'active' AND value_numeric IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ecf_date
  ON enterprise_context_facts (tenant_key, fact_key, value_date)
  WHERE lifecycle_state = 'active' AND value_date IS NOT NULL;

-- Canonical identity: unify the same entity across templates/loads.
ALTER TABLE enterprise_context_records
  ADD COLUMN IF NOT EXISTS canonical_entity_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ecr_canonical
  ON enterprise_context_records (tenant_key, record_type, canonical_entity_id)
  WHERE lifecycle_state = 'active';

-- Operator-confirmable alias/merge table. NEVER LLM-fuzzy-match identity in v1.
CREATE TABLE IF NOT EXISTS enterprise_context_entity_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key          TEXT NOT NULL,
  record_type         TEXT NOT NULL,
  canonical_entity_id TEXT NOT NULL,
  alias_key           TEXT NOT NULL,             -- normalized raw name/key seen in a source row
  alias_source        TEXT NOT NULL,             -- 'auto_normalized' | 'operator_confirmed'
  confirmed_by        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, record_type, alias_key)
);
```

### 3b. New: `src/lib/context-ingestion/fact-extractor.ts`

Deterministic decomposition of every record field into one atomic typed fact. **No LLM.**

```typescript
export type FactValueType =
  | "currency"
  | "numeric"
  | "percent"
  | "date"
  | "boolean"
  | "enum"
  | "text"
  | "ref";

export interface ParsedTypedFact {
  factKey: string; // normalized field name, e.g. 'committed_value_usd'
  factType: FactValueType;
  valueNumeric: number | null;
  valueDate: string | null; // ISO
  valueBool: boolean | null;
  valueText: string | null;
  unit: string | null; // 'USD_M','pct','days','count'
  asOfDate: string | null;
  factValue: Record<string, unknown>; // raw JSONB payload preserved
  // provenance (already supported by the facts table)
  sourceFile: string;
  sourceRowNumber: number | null;
  confidence: number;
}

// Drive typing off the template's column metadata in template-registry.ts
// (currency columns, date columns, percent columns are declared there).
export function extractTypedFacts(args: {
  record: ParsedContextRecord;
  templateId: string;
  loadAsOfDate: string; // batch date if the row has no own date column
}): ParsedTypedFact[];
```

Rules:

- One fact per non-empty field. `value_hash` (already in schema) = hash of `(factKey, normalized value)` for supersession.
- `currency`/`numeric`/`percent` → set `valueNumeric` + `unit`; `date` → `valueDate`; `boolean` → `valueBool`; everything else → `valueText`.
- `ref` = a column that names another entity (e.g. `vendor_name`, `system_id`) — emit `valueText` AND feed it to canonical resolution (3c) so the graph can link.
- `asOfDate` from a row-level date column if present, else the load batch date.

### 3c. New: `src/lib/context-ingestion/canonical-identity.ts`

```typescript
// Deterministic, per-record_type normalization. Operator-confirmable merges only.
export function resolveCanonicalEntity(args: {
  tenantKey: string;
  recordType: string;
  rawKeyOrName: string;
  db: PostgresCompatClient;
}): Promise<{
  canonicalEntityId: string;
  matchedVia: "exact" | "alias" | "new";
}>;
```

- `vendor` → lowercased, trimmed, punctuation-stripped name (`Snowflake Inc.` → `snowflake`).
- `application`/`system` → `app_id` if present, else normalized name.
- `persona` → `persona_id`. `initiative` → `initiative_id`.
- Look up `enterprise_context_entity_aliases` first; on miss, write an `auto_normalized` alias and mint a new `canonical_entity_id`.
- **Never fuzzy-match in v1.** Near-duplicates get an operator-confirm queue (surface in P4 explorer); do not auto-merge.

### 3d. Wire 3b + 3c into the commit path

In `commitContextBatch()` (`context-commit.ts`) and the CSV connector load path:

- After a record is upserted, call `extractTypedFacts()` and upsert each fact (on the existing `UNIQUE(tenant_key, record_id, fact_key, value_hash)`; older value-hash for the same `fact_key` → set `lifecycle_state='superseded'`, `supersedes_fact_id`).
- Set `record.canonical_entity_id` from `resolveCanonicalEntity()` **before** the graph load step (P0/P2 step 10), so `jsonl-graph-loader.ts` resolves `from/to` against canonical ids.

### 3e. Re-run the ACA load + verify depth

Re-run `scripts/jobs/load-first-capital-v2.ts` (ACA job, VNet — localhost cannot reach the private DB).

### QA for Phase 3

- Facts count for `first-capital` **≥ 3,500** (was 192). Log the delta.
- Every `fact_type IN ('currency','numeric','percent')` row has `value_numeric` populated; every `'date'` row has `value_date`.
- Every active record has a non-null `canonical_entity_id`; Snowflake resolves to **one** canonical id across F05/F11/T04.
- Spot query runs deterministically: `SELECT ... WHERE fact_key='contract_renewal_date' AND value_date BETWEEN now() AND now()+interval '90 days'` returns the expected vendors.
- `npx tsc --noEmit` clean · `release:check` passes (lane: `client-data-lane`) · release record added.

---

## Phase 4 — Read-Model Views + Materialization

**Branch:** `feat/first-capital-context-engine-p4-read-models`
**Goal:** Every Intelligence/Tower screen reads a **named governed read model** over records/typed-facts/relationships. Azure Search is demoted to citation text only. No module issues ad-hoc context queries.

### 4a. Migration `supabase/migrations/20260620000000_context_read_model_views.sql` — cheap SQL views

```sql
-- Coverage + "what's missing": join the expected-schema (required fact keys per
-- dimension, from template-registry) against what's actually loaded.
CREATE OR REPLACE VIEW enterprise_context_coverage_view AS
  SELECT r.tenant_key, r.dimension_family, r.domain_segment,
         COUNT(DISTINCT r.id) AS record_count,
         COUNT(f.id) FILTER (WHERE f.lifecycle_state='active') AS fact_count,
         MAX(f.as_of_date) AS latest_as_of,
         MAX(r.created_at) AS last_loaded_at
  FROM enterprise_context_records r
  LEFT JOIN enterprise_context_facts f ON f.record_id = r.id
  WHERE r.lifecycle_state='active'
  GROUP BY r.tenant_key, r.dimension_family, r.domain_segment;

-- Evidence lineage: fact → record → source_file → blob_url (deterministic, cheap).
CREATE OR REPLACE VIEW evidence_lineage_view AS
  SELECT f.id AS fact_id, f.tenant_key, f.fact_key, f.fact_type,
         f.value_numeric, f.value_date, f.value_text, f.as_of_date, f.confidence,
         r.id AS record_id, r.record_type, r.canonical_entity_id, r.dimension_family,
         sf.file_name, sf.file_url AS blob_url, f.source_row_number
  FROM enterprise_context_facts f
  JOIN enterprise_context_records r ON r.id = f.record_id
  LEFT JOIN enterprise_context_source_files sf ON sf.id = f.source_file_id
  WHERE f.lifecycle_state='active';

-- Initiative detail: initiative record + its facts + linked systems via relationships.
CREATE OR REPLACE VIEW initiative_detail_view AS
  SELECT r.tenant_key, r.canonical_entity_id AS initiative_id, r.payload->>'name' AS name,
         MAX(f.value_numeric) FILTER (WHERE f.fact_key='committed_value_usd') AS committed_usd,
         MAX(f.value_numeric) FILTER (WHERE f.fact_key='realized_value_usd')  AS realized_usd,
         MAX(f.value_text)    FILTER (WHERE f.fact_key='phase')               AS phase,
         MAX(f.value_text)    FILTER (WHERE f.fact_key='posture')             AS posture
  FROM enterprise_context_records r
  LEFT JOIN enterprise_context_facts f ON f.record_id = r.id AND f.lifecycle_state='active'
  WHERE r.record_type='initiative' AND r.lifecycle_state='active'
  GROUP BY r.tenant_key, r.canonical_entity_id, r.payload->>'name';
```

### 4b. Materialized lens tables (job-built) — for the expensive aggregations

Do **not** make a page do a live 6-table join. Materialize:

- `ai_control_tower_lens_mv` — joins T01–T10 facts + initiatives + model risk into the 8 Tower lenses (value · initiatives · productivity · agents · spend · risk · evidence · actions).
- `intelligence_brief_mv` — top insights (from P5) + coverage + freshness + "what changed since last load".

Refresh via new ACA job `scripts/jobs/refresh-read-models.ts` (`REFRESH MATERIALIZED VIEW CONCURRENTLY ...`) run at the end of every load and on demand.

### 4c. New: `src/lib/context-ingestion/semantic-read-models.ts`

Distinct from the L0 plumbing `tenant-context-read-model.ts`. Typed accessors, all reading views/MVs, **none calling Azure Search**:

```typescript
export function getCoverageModel(tenantKey: string): Promise<CoverageFamily[]>;
export function getInitiativeDetail(
  tenantKey: string,
  initiativeId: string,
): Promise<InitiativeDetail>;
export function getTowerLensModel(
  tenantKey: string,
  lens: TowerLens,
): Promise<TowerLensModel>;
export function getIntelligenceBrief(
  tenantKey: string,
): Promise<IntelligenceBrief>;
export function getEvidenceLineage(factId: string): Promise<EvidenceLineage>;
```

### 4d. Re-point modules; demote Search

- **Tower:** `band-metrics-view.ts` + `atlas-interpretation-view.ts` → read `ai_control_tower_lens_mv` via `getTowerLensModel()`. This resolves the live **$0 spend / 0 evidence RED** bugs (the data is in T08/T10 facts; Tower just wasn't reading them).
- **Intelligence Explorer:** Coverage tab → `getCoverageModel()`; Explore/Insights numbers → read models; the **admin/setup explorer** (original brief's Phase 3) becomes a consumer of `enterprise_context_coverage_view` — show per-family record/fact counts, blob URLs (from `evidence_lineage_view`), last-loaded, and the canonical-merge confirm queue from 3c.
- **Azure Search:** retained for **citation text only** inside answers (P5). It must never be the source of a primary number on any surface.

### 4e. Architecture-rule enforcement

Add a rule to `npm run audit:architecture-rules`: any file under `src/app/**` or a module surface that imports Azure Search / data-room / raw context SQL for **numbers** (instead of `semantic-read-models.ts`) is a violation. Mirrors the existing broker-boundary rule. Convention rots; the check doesn't.

### 4f. Tower projection — retire the dual substrate (the durable fix)

**Root cause confirmed live (2026-06-18).** First Capital's Tower shows a "Demo fallback" banner even though the context load committed 414 records / 4,484 facts. Reason: there are **two parallel substrates** and only the context layer was loaded.

| Substrate       | Tables                                     | Feeds                                       | State                                      |
| --------------- | ------------------------------------------ | ------------------------------------------- | ------------------------------------------ |
| Context layer   | `enterprise_context_*`                     | Intelligence + grounded Q&A                 | ✅ loaded (V2)                             |
| Tower substrate | `ai_control_*` + `ai_control_refresh_runs` | `getAiControlTowerReadModel` → Tower lenses | ❌ empty for first-capital → demo fallback |

`getAiControlTowerReadModel` reads `ai_control_refresh_runs` + 12 `ai_control_*` tables scoped by `client_id`/`refreshRunId`; finding none, it falls back to the packaged synthetic substrate (`source: 'first_capital_local_synthetic_fallback'`). The load job `load-first-capital-v2.ts` writes **only** `enterprise_context_*` — it never writes an `ai_control_*` row. So the Tower needs a per-tenant second load that never happened.

**The durable fix: make the Tower a deterministic projection over the committed context layer — one source of truth, zero per-tenant Tower loads.** Build the projection from `enterprise_context_records` + typed facts (P3), so every tenant with committed context gets a live Tower automatically and the dual-substrate drift is retired for good.

**Projection mapping** (V2 dataset → existing `AiControlTowerReadModel` shapes in `src/lib/ai-control-tower/read-model.ts` — do not change the lens shapes, only their source):

| Lens shape                       | Source records / facts (context layer)                                                                                                                | Key field mapping                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `AiControlTowerInitiativeRead`   | F13 initiatives + T01 milestones (`stage`/`phase`) + T02 (`committed_value_usd`, `realized_value_usd`) + T08 (`spend_ytd_usd`) + T10 (gate→`posture`) | `committedUsd`, `realizedUsd`, `spendUsd`, `realizedPct`, `stage`, `posture`, `evidenceState`  |
| `AiControlTowerSpendRead`        | T08 ai-spend-by-initiative                                                                                                                            | `annualizedSpendUsd`, `renewalDate`, `spendType`, `initiativeId`                               |
| `AiControlTowerRiskRead`         | T09 ai-risk-register + T07 model-risk-inventory                                                                                                       | `severity`, `gate`, `requiredAction`, `dimension`                                              |
| `AiControlTowerAgentRead`        | T04 erp-platform-agents                                                                                                                               | `governance`, `autoResolvePct`, `vendor`, `module`                                             |
| `AiControlTowerProductivityRead` | T06 function-ai-productivity-scorecard                                                                                                                | `baseline`, `current`, `target`, `unit`                                                        |
| `AiControlTowerUsageRead`        | T03 copilot-adoption-by-function                                                                                                                      | `seats`, `activeUsers`, `adoptionPct`, `blocker`                                               |
| `AiControlTowerEvidenceRead`     | T10 gate-approval-history + evidence facts                                                                                                            | `recordType`, `citationLabel`, `pointer`, `confidence`                                         |
| `AiControlTowerActionRead`       | derived: blocked gates + kill/restructure postures                                                                                                    | `relatedType`, `posture`, `requiredAction`→`title`, `dueDate`                                  |
| `AiControlTowerFunctionRead`     | aggregation across the above by `business_function`                                                                                                   | rollups: `initiatives`, `adoptionPct`, `spendUsd`, `realizedUsd`, `risks`, `actions`, `status` |

**Implementation:**

1. Define `ai_control_tower_lens_mv` (4b) so it **emits exactly the columns the 12 `safeSelect('ai_control_*')` calls expect** — i.e. the MV is a drop-in for the raw tables, projected from `enterprise_context_records`/`facts` filtered to the Tower record-types (`initiative`, `spend_contract`, `benefit_realization`, `risk_governance`, `agent`, `productivity`, `usage`, `evidence`, `action`) + dimension family `governance_ai_evidence` (the T01–T10 supplement, dimension 18). Scope every row by `tenant_key` + `client_id`.
2. In `getAiControlTowerReadModel`, add a **precedence step before the synthetic fallback**: read the projection; if it has rows, return `source: 'context_projection'` (add this to the `AiControlTowerReadSource` enum and to `sourceDisclosure`). Order: `ai_control_data_plane` (legacy raw tables, if present) → **`context_projection`** → `first_capital_local_synthetic_fallback` → `empty`.
3. `refresh-read-models.ts` (4b) refreshes the MV at the end of every context load and on demand — so the Tower is live the moment context commits.
4. **Retire the per-tenant `ai_control_*` load.** Once projection is the path, no tenant needs a separate Tower-substrate ingest. Keep the legacy `ai_control_*` read only as a transitional first-precedence (so any tenant already on raw tables is unaffected); mark the per-tenant Tower load deprecated in the load-plan.

This is tenant-agnostic: SkyHarbor, Meridian, Lakeshore, Apex all get a live Tower from their committed context with no extra load.

### QA for Phase 4

- **Tower demo-fallback clears:** `/tower` for `first-capital` shows `source: 'context_projection'` (not the "packaged synthetic demo fallback" banner), driven by the committed 4,484 facts. Screenshot the banner gone.
- Spend lens shows T08 totals (not $0); Evidence lens shows T10 gates (not 0); Agents lens shows T04 (SAP Joule flagged); Risk lens shows T07/T09. Screenshot.
- Intelligence Coverage shows 19/19 families with real record/fact counts from the view.
- `audit:architecture-rules` passes with the new rule; grep confirms no module reads Search for numbers.
- A second tenant (e.g. SkyHarbor) with committed context also renders `context_projection` — proves it's not first-capital-specific.
- **Projection column-contract test (hardening).** §4f makes `ai_control_tower_lens_mv` a drop-in
  for the 12 raw `ai_control_*` tables — that coupling is a silent-breakage seam: if a future MV
  edit drops or renames a column the read-model `safeSelect`s, the Tower blanks with no error. Add a
  test that asserts the MV's emitted column set **equals** the columns each `safeSelect('ai_control_*')`
  expects (introspect `information_schema.columns` for the MV vs the read-model's select list), so a
  drift fails CI, not production.
- `tsc` clean · `release:check` passes · release record added.

---

## Phase 5 — Insight Engine + Grounded Q&A

**Branch:** `feat/first-capital-context-engine-p5-insights`
**Goal:** Deterministic insights with full evidence chains (kills "0% cited"), a lifecycle that answers "what changed since last load", and Sentinel/Atlas Q&A that cites real fact IDs and refuses when unsupported.

### 5a. New: `src/lib/context-ingestion/insight-engine.ts`

`ContextInsight` + `SignificanceRule` types already exist in `types.ts`. Implement the engine that populates `context_insights`. Each rule is a **deterministic predicate over typed facts** and emits an insight carrying `derivedFromFactIds` + `derivedFromRecordIds` (the evidence chain), `ruleId`, `materiality`, `confidence`, `asOfDate`, `recommendedAction`.

```typescript
export interface SignificanceRuleImpl {
  ruleKey: string;
  requiredDimensionNumbers: number[];
  requiredFactKeys: string[];
  evaluate(ctx: RuleContext): ContextInsightDraft[]; // pure function over active typed facts
}
```

Seed rules (all over typed facts from P3 — no LLM):
| ruleKey | Predicate (typed facts) | Source |
|---|---|---|
| `model-risk-overdue` | `validation_due_date < now()` AND tier=1 | T07 |
| `blocked-spend-no-value` | `spend_ytd_usd > 0` AND `realized_value_usd = 0` | T08 + F13 |
| `ungoverned-erp-ai` | `status='disabled'` AND `enforcement='none'` | T04 |
| `fair-lending-untested` | credit model AND `disparate_impact_tested=false` | T07 |
| `finra-supervision-gap` | wealth AI AND `supervision_model_status != 'live'` | T09 + F17 |
| `copilot-seats-idle` | `seats_purchased > 0` AND `seats_active = 0` | T03 |
| `vendor-renewal-no-benchmark` | `renewal_date` within window AND `benchmark_status='none'` | F11 |
| `proven-value-scale-ready` | `realized_usd / committed_usd >= 1.2` AND evidence high | T02 + F15 |

### 5b. Insight lifecycle (the "what changed" capability)

On every load/refresh:

1. Recompute insights from **current active** facts.
2. **Supersede** insights whose predicate no longer holds (`lifecycle_state='superseded'`).
3. Keep history (a `context_insight_history` row or `as_of` snapshot) so Intelligence can diff: _"12 SR 11-7 overdue last load → 9 now (3 validated)."_ This is a first-class Intelligence question and requires history, not just current state.

### 5c. New: `src/lib/intelligence/context-answer-engine.ts` — grounded Q&A

**Reuse the `source-answer-engine.ts` / `healthcareAnswerContract.ts` contract — do not reinvent it.** Pipeline:

1. **Structured-first retrieval:** pull the relevant typed facts via `semantic-read-models.ts` (deterministic).
2. **Corpus-second:** Azure Search only for human-readable citation text around those facts.
3. **LLM-third:** hand the model _only_ the retrieved fact set; instruct it to cite the provided `fact_id`s.
4. **Post-check:** every numeric/date claim in the answer must map to a provided `fact_id`; otherwise strip it or return "insufficient evidence." **No fabricated `'high'` confidence** (the same P0 fix already made in the Source archetype engine).

Wire **Sentinel** (Intelligence rail) and **Atlas** (Tower rail) to this engine. Atlas answers are **proposals requiring human approval** — never auto-act.

> **Atlas is the named first consumer.** A Tier-1 fix already landed in `src/components/tower/AiControlTowerPage.tsx`: the Tower chat now POSTs to `/api/v1/atlas/chat` → `runAtlasTurn` instead of the old client-side `buildAtlasAnswer` keyword router (which classified the whole question into ~6 lens buckets via `classifyAiControlTowerIntent` and dumped a templated "Spend read" / "Actions read" — dropping the question's actual predicate, e.g. "spend that _lacks adoption or value proof_"). That consolidation is necessary but **not sufficient**: `runAtlasTurn` and `buildStructuredAnswerFromContextPack` are themselves still intent-bucketed. P5 must replace that intent classification with `context-answer-engine` retrieval over **typed facts** so cross-metric predicates (`spend_ytd > 0 AND adoption_pct < x AND realized_value = 0`) are answerable. Acceptance: ask Atlas "which AI spend lacks adoption or value proof?" on `first-capital` and get a filtered, fact-cited answer — not a top-N-by-size lens dump. The local `buildAtlasAnswer` remains only as an offline-degraded fallback (clearly marked) for when the engine is unreachable.

### 5d. Golden questions (supersedes original Phase 4)

Run the original 7 (`99-verification/golden-questions.json`, GQ-001…GQ-007) **plus** the AI-control additions, asserting citations resolve to real `fact_id`s now that facts are deep + typed:
| # | Question | Must cite (fact, not just record) |
|---|---|---|
| GQ-008 | Which AI models are overdue for SR 11-7 validation? | T07 `validation_due_date` facts (≥12) |
| GQ-009 | Where is AI spend committed with zero realized value? | T08 `spend_ytd_usd` + F13 `realized_value_usd` facts |
| GQ-010 | Is SAP Joule governed, and what is the enforcement gap? | T04 `status`/`enforcement` facts |
| GQ-011 | What changed in model-risk posture since the last load? | insight history diff (5b) |

### QA for Phase 5

- `context_insights` populated; **every insight has ≥1 `derivedFromFactId`** (0% → cited). Screenshot an Intelligence insight card with its expanded evidence chain.
- Re-running the load twice with a changed fact produces a correct "what changed" diff.
- Sentinel and Atlas answers cite real fact IDs; an unsupported question returns "insufficient evidence" (capture both).
- All golden questions (GQ-001…GQ-011) pass · `tsc` clean · `release:check` passes · release record added.

---

## File Reference Summary

### Create

```
supabase/migrations/20260619000000_fact_typed_values_and_canonical_identity.sql  [P3]
supabase/migrations/20260620000000_context_read_model_views.sql                  [P4]
src/lib/context-ingestion/fact-extractor.ts                                      [P3]
src/lib/context-ingestion/canonical-identity.ts                                  [P3]
src/lib/context-ingestion/semantic-read-models.ts                               [P4]
src/lib/context-ingestion/insight-engine.ts                                      [P5]
src/lib/intelligence/context-answer-engine.ts                                    [P5]
scripts/jobs/refresh-read-models.ts                                              [P4]
```

### Modify (extend, don't rebuild)

```
src/lib/context-ingestion/context-commit.ts        [P3 — call extractTypedFacts + resolveCanonicalEntity]
src/lib/context-ingestion/csv-upload-connector.ts  [P3 — emit atomic typed facts, not chunks-only]
scripts/jobs/load-first-capital-v2.ts              [P3 — re-run with deep extraction]
src/lib/tower/band-metrics-view.ts                 [P4 — consume getTowerLensModel()]
src/lib/tower/atlas-interpretation-view.ts         [P4 — consume read model + answer engine]
<intelligence explorer page + setup/admin context explorer>  [P4 — consume coverage/evidence views]
scripts/audit/architecture-rules.*                 [P4 — add read-model-boundary rule]
```

### Reuse (do not reinvent)

```
src/lib/source/source-answer-engine.ts                       [P5 — grounded-answer contract]
src/lib/intelligence/synthesis/healthcareAnswerContract.ts   [P5 — refuse/cite pattern]
src/lib/context-ingestion/template-registry.ts               [P3 — column typing metadata]
```

---

## Key constraints (do not violate)

1. **Structured-first, corpus-second, LLM-third.** No surface shows a primary _number_ sourced from Azure Search. Search supplies citation text only. Enforced by the P4 arch-rule.
2. **Typed facts are deterministic.** Fact typing/extraction is rule-driven off template metadata — never LLM. The LLM only summarizes/explains a fact set it was handed.
3. **Identity resolution is deterministic in v1.** Normalized keys + operator-confirmable alias table. No LLM fuzzy-merge; near-duplicates go to a confirm queue, not an auto-merge.
4. **Facts supersede, never overwrite.** Use the existing `value_hash` + `supersedes_fact_id` + `lifecycle_state`. Insight history is kept for "what changed".
5. **Read models are the contract.** Modules go through `semantic-read-models.ts` or they don't ship. Same discipline as the `AgentContextBroker` boundary.
6. **Empty/stale surface ⇒ suspect the read model first.** Never recommend a reload as the first fix when records exist — it's the wiring, not the data.
7. **Localhost cannot reach the private DB.** Migrations + load + read-model refresh run as ACA jobs inside the VNet. Build via `az acr build`, override the migrate job image, read Log Analytics.
8. **Truncate scope: `first-capital` only.** Every destructive statement carries `WHERE tenant_key='first-capital'`.
9. **Release check required** before every merge: `node scripts/release-check.mjs --base origin/main --head HEAD`. Lane: `client-data-lane`. One release record per phase under `docs/releases/records/`.

---

## Why this order (do not skip P3 to get to the visible parts)

The charts, the cited insights, the "answer anything" Q&A, the trend lines — all of it reads the fact table. **Steps 1 and 2 (deep typed facts, unified identity) are the unglamorous prerequisites everything visible depends on.** A read model over 192 untyped facts is still thin; an insight engine over untyped facts can't evaluate `spend > committed`; a grounded answer can't cite a number that was never extracted. Build the substrate, then the lenses, then the meaning. The temptation will be to jump to P4/P5 — resist it until the P3 QA gates (≥3,500 typed facts, canonical ids non-null) are green.
