# Intelligence · Context & Corpus Explorer — Autonomous Build Brief

**Execution brief for S2–S5 of the Context & Corpus Explorer**
**Design authority:** `docs/build/intelligence/INTELLIGENCE_CONTEXT_CORPUS_EXPLORER_DESIGN_2026-06-16.md`
**Prototype (source-of-truth for visual design):** `public/prototypes/intelligence-context-corpus-explorer.html`
**Date:** 2026-06-16
**Codebase branch:** `main` (merge S1 PRs first — see §0)

Read this entire brief before writing a single line of code. The three questions below are the acceptance bar.

---

## The three questions — answered before you build

### Q1. What is the surface and what does it do?

The `/intelligence` page is AbarVa's **context intelligence surface** for signed-in CXO users. It replaces the retired pattern-to-Move funnel with a two-panel surface:

- **Left (Sentinel Explorer rail, 386px fixed):** ask anything in English, get evidence-cited answers, see which dimension/facts grounded the answer.
- **Right (tabbed dashboard, flex:1):** five tabs showing derived significance (L2), entity facts (L1), change log, coverage/trust (L0), and global corpus. **Insights is the default tab** — "what is the context telling you" — not a file inventory.

The mental model is: **left = Sentinel reasons; right = structured views of significance**. An answer on the left can repaint the right (a `viewDirective`). A row on the right can be clicked to send a context chip into Sentinel.

This is **not a chat surface with a sidebar**. It is a governance-grade knowledge surface: every number cites a source, every insight names its rule, the agent says when it can't answer and why.

### Q2. What is already built? What does Codex build?

**Already built and in PRs (merge in order before starting):**

| PR | What it is | Must merge first |
|---|---|---|
| [#3559](https://github.com/abarva-platform/abarva/pull/3559) | Schema: `domain_segment`, `business_function`, `criticality`, `classification_source` columns on `enterprise_context_records`; `context_insights` + `significance_rules` tables; 6 seeded rules; 4 read-views | Yes — first |
| [#3561](https://github.com/abarva-platform/abarva/pull/3561) | Validation engine: enum validators + `inferDomainSegment()` auto-infer | After #3559 |
| [#3560](https://github.com/abarva-platform/abarva/pull/3560) | Template registry: 3 canonical templates with `enumValues` | After #3559 |
| [#3562](https://github.com/abarva-platform/abarva/pull/3562) | CSV connector: writes classification fields, routes NEEDS_CLASSIFICATION | After #3559 + #3561 |
| [#3564](https://github.com/abarva-platform/abarva/pull/3564) | S1 shell: `SentinelExplorerRail`, `ContextInsightsFeed`, `ContextExploreTab`, `ContextChangeLogTab`, `ContextCoverageTrustTab`, `ContextCorpusTab`, `IntelligenceExplorerPage` — all with **stub data**; feature-flagged behind `context_corpus_explorer_enabled` | After everything |
| [#3566](https://github.com/abarva-platform/abarva/pull/3566) | Setup triage queue: `/admin/context-layer/triage` route + `ClassificationTriageQueue` + GET/PATCH API | After #3559 |

**What Codex builds — S2 through S5:**

| Slice | What ships | Key files touched |
|---|---|---|
| **S2** | L1 backfill: real DB queries wired into Explore + Coverage & Trust + Change Log tabs; 14-dimension heatmap live; entity-centric browse; 8-truth-state source detail | New: `src/lib/intelligence/context-read-model.ts`; update: `ContextExploreTab`, `ContextCoverageTrustTab`, `ContextChangeLogTab` |
| **S3** | L2 insight engine: significance-rule evaluator that reads L1 facts from the DB and writes `context_insights` rows; Insights tab bound to real derived insights with `facts→rule→evidence` trace | New: `src/lib/intelligence/insight-engine/`, migration `20260616220000_significance_rule_runner.sql`; update: `ContextInsightsFeed` |
| **S4** | Refresh-event ledger: `context_refresh_events` table; every CSV upload + Source artifact + Move artifact write creates a refresh event; Change Log tab reads it | New: migration + `src/lib/intelligence/refresh-events.ts`; hook into csv-upload route + Source/Moves artifact persist |
| **S5** | Q&A router + answer audit: deterministic 6-intent router replaces canned answers in `SentinelExplorerRail`; `context_explorer_answer_audit` table; answer anatomy (route + citations + freshness + confidence + missing) | New: `src/lib/intelligence/qa-router/`; update: `SentinelExplorerRail` to stream real answers |

### Q3. How do you prove it works?

**State-level verification — not UI text, not `console.log`, not a test file.**

Every slice exits only when you can demonstrate:

1. **Real DB state changed** — e.g., for S3: run the insight evaluator against SkyHarbor Air's live data; confirm `context_insights` rows exist with `rule_id`, `headline`, `derived_from_record_ids` populated. Read the rows with a SQL query in the ACA migration job log.
2. **The UI reflects it** — drive the running app on ACA: go to `/intelligence` with `context_corpus_explorer_enabled` flag ON for `skyharbor-air`, see the Insights tab, see real insight cards (not stubs). Take a screenshot or capture the network response.
3. **The evidence chain closes** — click an insight → expand derivation → see `facts → rule → evidence` trace with source locator. Every number must cite a row in the DB, not a hardcoded string.
4. **Sentinel answers with a citation** — type "What is my context telling me?" → answer names the rule, cites the fact, states freshness. Canned answers are gone.
5. **Gate checks pass** — `npm run audit:architecture-rules` = 0 violations; `npm run release:check` passes with a release record per slice under `docs/releases/records/`; `npx tsc --noEmit` clean.

---

## The data model — what exists, what's new

### Existing tables (on `main`, all with RLS `tenant_key` fence)

```sql
-- L0: sources / files
enterprise_context_sources       -- one row per source system
enterprise_context_source_files  -- one row per uploaded file

-- L1: entity-centric facts
enterprise_context_records       -- canonical entities (system, vendor, initiative, KPI, ...)
enterprise_context_facts         -- fact rows: field→value per entity, temporal, cited
enterprise_context_relationships -- typed edges between records
enterprise_context_evidence      -- citation chain: fact → source_locator

-- L0 support
enterprise_context_quality_issues
enterprise_context_stewardship_tasks
enterprise_context_chunks        -- full-text searchable chunks for retrieval
enterprise_context_chunk_queue   -- pending embed jobs
```

### New tables (from PR #3559, must be merged before S2)

```sql
-- L2: derived significance (the "come alive" layer)
context_insights         -- one row per derived insight; rule-fired, traceable
significance_rules       -- the rule registry; 6 starter rules seeded

-- Classification columns on enterprise_context_records (also from #3559):
domain_segment TEXT CHECK (IN 8 values)
business_function TEXT CHECK (IN 9 values)
criticality TEXT CHECK (IN 3 values)
classification_source TEXT DEFAULT 'OPERATOR_CONFIRMED'

-- Read-views (from #3559):
v_context_vendor_renewals         -- vendor records with renewal fields
v_context_application_inventory   -- system records with classification columns
v_context_dimension_coverage      -- per tenant × record_type × domain_segment counts
v_context_triage_queue            -- NEEDS_CLASSIFICATION records awaiting operator confirm
```

### New tables Codex creates (S4)

```sql
-- S4: refresh-event ledger (CTX-007)
context_refresh_events (
  id UUID PK,
  tenant_key TEXT,
  source_id UUID REFERENCES enterprise_context_sources,
  triggered_by TEXT,  -- 'csv_upload' | 'source_artifact' | 'move_artifact' | 'manual'
  period_label TEXT,  -- 'Q1 2026' or ISO week or explicit label
  rows_seen INT, rows_accepted INT, rows_rejected INT,
  facts_created INT, facts_updated INT, facts_superseded INT,
  approval_required BOOLEAN DEFAULT false,
  affected_surfaces TEXT[],  -- ['Moves','Source','Insights']
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### The `context_insights` row shape (L2 — critical; Codex must write real rows)

```typescript
// src/lib/context-ingestion/types.ts (already has this after #3559)
interface ContextInsight {
  id: string;
  tenantKey: string;
  headline: string;      // "You're about to auto-renew a $4.2M AMS contract with no benchmark"
  soWhat: string;        // "Kyndryl AMS auto-renews Sep 18. You'd negotiate blind."
  domain: string;        // 'Vendor' | 'AI Value' | 'Service' | 'Strategy' | 'Cost' | 'Data quality'
  materiality: 'high' | 'medium' | 'low';
  derivedFromRecordIds: string[];  // the enterprise_context_records rows that fired it
  derivedFromFactIds: string[];    // the enterprise_context_facts rows
  ruleId: string;                  // 'renewal-window-no-benchmark' etc.
  evidence: string | null;         // "Vendor Contracts · row 41"
  confidence: 'high' | 'medium' | 'low' | 'none';
  freshnessStatus: 'fresh' | 'attention' | 'stale' | 'review' | 'unknown';
  lifecycleState: 'active' | 'review_required' | 'blocked_by_gap' | 'superseded';
  action: string | null;           // "Shape into Move" | "Review & approve" | "See the facts"
  entityName: string | null;
  entityType: string | null;
}
```

### The 6 significance rules (seeded in #3559 — evaluator Codex writes in S3)

| rule_id | Fires when (SQL logic) | Required dimensions | Domain |
|---|---|---|---|
| `renewal-window-no-benchmark` | vendor record: `contract_end_date` within 120d AND `benchmark_present != 'YES'` AND `auto_renew = 'YES'` | Dim 11 Vendor | Vendor |
| `adoption-below-value-case` | initiative fact: `active_users_pct < 0.6 × value_case_assumption` | Dim 6 Program × Dim 10 Telemetry | AI Value |
| `sla-breach-worsening` | service fact: `services_breaching_sla > 0` AND `mttr_change_qoq > 0` | Dim 10 Telemetry × Dim 5 KPI | Service |
| `material-claim-unapproved` | records with `record_type = 'strategy_claim'` AND `lifecycle_state = 'review'` | Dim 7 Sourcing × Dim 9 Evidence | Strategy |
| `conflicting-fact` | two facts on same entity+field from different source systems with different values | Any two sources (Dim 3 + Dim 2) | Data quality |
| `value-coverage-gap` | initiative has spend fact but missing: adoption fact OR value-realised fact OR finance source is stale | Dim 4 Financials × Dim 6 Program | Cost |

---

## UI/UX design — the canonical specification

### Design system (locked — never change)

```typescript
const DESIGN = {
  bg: '#F8F7F4',        // page background (never white)
  railBg: '#FCFBF8',   // Sentinel rail background
  panel: '#FFFFFF',     // card / panel background
  ink: '#1B1A17',       // primary text
  muted: '#6F6A61',    // secondary text
  line: '#E6E2DA',      // divider
  // Status colours (always: colour = status)
  fresh: '#3F7A5B',     freshBg: '#3F7A5B14',
  attention: '#B5852A', attentionBg: '#B5852A18',
  stale: '#B4513C',     staleBg: '#B4513C16',
  review: '#7A5BA8',    reviewBg: '#7A5BA814',
  unknown: '#A39C90',   unknownBg: '#A39C9016',
};
// Fonts: Georgia serif (normal weight) for headings/display; DM Sans for body
// Buttons: black fill (#1B1A17) + white text; ghost (outline, transparent); NO other colours
```

### Density contract (founder signed off twice — do not break)

- **One row per item.** No cards where a row will do.
- **Colour = status.** Green = fresh/healthy, amber = attention, red = stale/risk, purple = review, grey = unknown.
- **One gap line between groups.** No heavy section headers between rows.
- **Detail opens one level down.** Expand in place; no modals or separate pages for row detail.
- **Forms/actions reveal on click.** No always-open textareas or triple-repeat panels.
- **"Every click is a decision, not form-fill."**

### Layout (canonical frame — from `IntelligenceExplorerPage.tsx`)

```
┌──────────────── header strip (tenant name · X insights · Y/14 dims · date) ────────────────┐
├────────────────────────┬─────────────────────────────────────────────────────────────────────┤
│  SENTINEL RAIL (386px) │  [ Insights ][ Explore ][ Change Log ][ Coverage & Trust ][ Corpus ]│
│  border-right          │  ─────────────────────────────────────────────────────────────────── │
│                        │                                                                       │
│  scroll area           │  active tab content (density-contract)                               │
│                        │                                                                       │
│  ─────────────         │                                                                       │
│  sticky bottom toolbar │                                                                       │
│  [ Ask anything…  ⏎ ] │                                                                       │
└────────────────────────┴─────────────────────────────────────────────────────────────────────┘
```

### Sentinel Explorer Rail (`src/components/intelligence-v4/SentinelExplorerRail.tsx`)

**Current state (S1 stub):** canned answers, no DB calls, `CANNED_ANSWERS` hardcoded.

**S5 target (what Codex replaces it with):**
- Call `POST /api/intelligence/qa` (new route Codex creates) which runs the deterministic router (§S5 below).
- Render streaming response as the answer arrives (use `useAgentStream` or `fetch` with `ReadableStream` — match the pattern already used in `SentinelChat` / `AgentDock`).
- Every answer shows the **answer anatomy overlay**: route used · citations (fact → record → source) · freshness · confidence · what's missing.
- The `viewDirective` from the response switches the active tab on the right and applies filters (call the parent's `setActiveTab`/`setExploreEntity` already wired in `IntelligenceExplorerPage`).
- Starter question chips remain; they now submit real queries.
- Keep the grounded chip on each answer: `⬡ grounded · {routeLabel} · {citationCount} cites · {freshness}`.

### Insights tab (`src/components/intelligence-v4/ContextInsightsFeed.tsx`)

**Current state (S1 stub):** `STUB_INSIGHTS` array hardcoded.

**S2/S3 target:** replace stub with real data from `GET /api/intelligence/insights?tenantKey=...`:

```
Insights tab layout (top to bottom):
1. Domain filter chips: All / Vendor / AI Value / Service / Strategy / Cost / Data quality
2. Top-of-mind band: 3 highest-materiality insights as hero cards (Georgia serif headline, attention pill)
3. Insight feed: ranked list of all insights
   - Each row: [materiality pill] [headline] [domain tag] [freshness dot] [confidence chip] [rule name]
   - Expand: derivation trace = "fact A (source, row) + fact B → rule X → significance"
   - Actions on expand: "Shape into Move" | "Review & approve" | "See the facts" (→ Explore tab)
4. Empty state (when no insights yet): "Dimensions not yet loaded — context can't derive significance.
   Load via Setup → Context Layer. Which dimensions to load first? Ask Sentinel."
```

**Insight card derivation trace (the key UX — expand on click):**

```
[Kyndryl AMS auto-renews Sep 18 with no benchmark]          [HIGH] [Vendor]  [attention] [high]
  ─── Derivation ────────────────────────────────────────────────────────────────────────────
  Facts used:
    • contract_end_date = 2026-09-18  →  Vendor Contracts · row 41  ·  fresh 2026-06-10
    • auto_renew = YES                →  Vendor Contracts · row 41  ·  fresh
    • benchmark_present = NO          →  Vendor Contracts · row 41  ·  fresh
  Rule fired:  renewal-window-no-benchmark  (120d window, no benchmark)
  Significance:  $4.2M AMS renewal in 94 days. Negotiating without a benchmark costs 15-25%.
  [Shape into Move ›]  [Review & approve]  [See the facts ›]
```

### Explore tab (`src/components/intelligence-v4/ContextExploreTab.tsx`)

**Current state (S1 stub):** 18 hardcoded systems in 6 segments.

**S2 target:** replace stub with real data from `v_context_application_inventory`:

```
Explore tab layout:
1. Entity-type selector: IT Systems / AI Initiatives / Vendors & Contracts / KPIs / Org & People / Evidence
2. Domain segment filter chips (for IT Systems): All / Data & Analytics / ERP / Digital/CX / Operations / Infra / Security
3. Segmented table (IT Systems default):
   ┌── Data & Analytics ──────────────────────────────────────────────────────────────────────┐
   │  Snowflake        Snowflake Inc     DATA_ANALYTICS  14,000 users  2027-03 $1.2M  ● fresh │
   │  Tableau          Salesforce        DATA_ANALYTICS   8,500 users  2026-11 $0.3M  ● fresh │
   ├── ERP ────────────────────────────────────────────────────────────────────────────────────┤
   │  SAP S/4 HANA     SAP SE            ERP             22,000 users  2028-06 $6.1M  ● fresh │
   └──────────────────────────────────────────────────────────────────────────────────────────┘
   Columns: System | Vendor | Segment | Users | Contract end | Cost/yr | Health
   Each row expand → 3-column detail:
     [System facts: all payload fields from enterprise_context_records/facts]
     [Context note: confidence + classification_source + freshness_status]
     [Linked insights: any context_insights rows where entity_name matches]
4. Other entity types: use the same table pattern with type-appropriate columns
5. "NEEDS_CLASSIFICATION" rows shown with amber chip; click → links to /admin/context-layer/triage
```

### Change Log tab (`src/components/intelligence-v4/ContextChangeLogTab.tsx`)

**Current state (S1 stub):** 5 hardcoded rows.

**S4 target:** real data from `context_refresh_events`:

```
Change Log layout:
1. Filter chips: All / Strategy / Vendor / Ops / Data quality · Review state: All / Needs review
2. Timeline table:
   When          | Change                                   | Source               | Review state
   Jun 10, 09:41 | CIO priority memo parsed (review-req)    | CIO AMS Board Memo   | ⚠ Needs review
   Jun 10, 08:12 | Copilot adoption updated: 27%→31%        | Operating telemetry  | ✓ Auto
   Jun 09, 14:00 | Kyndryl renewal date confirmed           | Vendor Contracts.xlsx| ✓ Auto
3. Review-required rows → "Open in Triage Queue" link
4. Empty state: "No changes recorded yet. Changes appear here when context is refreshed."
```

### Coverage & Trust tab (`src/components/intelligence-v4/ContextCoverageTrustTab.tsx`)

**Current state (S1 stub):** hardcoded dimension statuses.

**S2 target:** real data from `v_context_dimension_coverage` + `enterprise_context_sources`:

```
Coverage & Trust layout:
1. KPI strip (4 pills, clickable → sends question to Sentinel):
   Sources: 9 · active facts: 2,847 · Evidence coverage: 73% · Answerability: 64%

2. Dimension coverage matrix (14 × status heatmap):
   Dim 1 Enterprise profile  ████  loaded      Dim 8  Program deliverables  ░░░░  missing
   Dim 2 Org structure       ████  loaded      Dim 9  Evidence ledger       ▒▒▒▒  stale
   ... (7-column grid, colour = loaded/attention/stale/review/missing)

3. Insight-unlock ladder (which insights are lit vs blocked):
   ✅ renewal-window-no-benchmark   Requires Dim 11 + 13 → BOTH LOADED
   ⚠️ adoption-below-value-case    Requires Dim 6 + 10 → DIM 10 STALE
   🔒 value-coverage-gap           Requires Dim 4 + 6 → DIM 4 NOT LOADED
   ...

4. Source health table (one row per source):
   Source                  | Type   | Last refresh | Freshness  | Records | Chunks | Truth state
   Vendor Contracts.xlsx   | CSV    | Jun 10       | ● fresh    | 47      | 380    | committed
   CIO AMS Board Memo.pdf  | Doc    | Jun 09       | ⚠ review   | 1       | 12     | parsed
   Operating telemetry API | API    | Jun 10       | ● fresh    | 183     | 1,440  | embedded

5. Truth-state funnel (per the 8 states):
   source received (9) → classified (9) → parsed (9) → validated (8) → committed (7)
   → evidence-linked (6) → embedded/indexed (5) → answer-proven (4)

6. Gaps band: "What we can't see yet"
   Missing: IT Financials (Dim 4) — blocks: adoption-below-value-case, value-coverage-gap
   Stale: Operating telemetry (Dim 10, 45d) — attention: SLA insight may be incorrect
   [Load via Setup →]
```

### Corpus tab (`src/components/intelligence-v4/ContextCorpusTab.tsx`)

**Current state (S1 stub):** stub patterns.

**S2 target (Relevant-to-you sub-tab):** call `searchCorpus()` with the tenant's active insights as query seeds:

```
Corpus tab — 3 sub-tabs: [Relevant to you] [Browse by taxonomy] [Search]

Relevant to you (default):
  Each live L2 insight → matched corpus patterns (call searchCorpus with insight headline as query)
  Pattern card: title · category · confidence · "Applies because: [your insight]" · claims (collapsed)
  Rule: never render the full 10k pattern list; only relevance-matched cards.

Browse by taxonomy:
  Category tree → drill to sub-topics; show count + confidence per node
  Pattern list appears only after drilling to a leaf; max 25 per page

Search:
  Text input → POST /api/corpus/search → result cards (reuse existing corpus search route)
```

---

## S2 — L1 read model and Explore/Coverage wiring

### New file: `src/lib/intelligence/context-read-model.ts`

This is the single source of truth for all S2 DB reads. Do not scatter SQL across components.

```typescript
// All functions return tenant-scoped data using getAzureReadFluentClient()
// Follow the exact pattern in src/lib/enterprise-context/intelligence-read-model.ts

export interface EntitySummary {
  recordId: string;
  title: string;
  recordType: string;
  recordSubtype: string | null;
  domainSegment: string | null;
  businessFunction: string | null;
  criticality: string | null;
  freshnessStatus: string;
  lifecycleState: string;
  classificationSource: string;
  payload: Record<string, unknown>;
}

export interface DimensionCoverage {
  recordType: string;
  domainSegment: string | null;
  recordCount: number;
  freshCount: number;
  staleCount: number;
  needsClassificationCount: number;
  lastUpdatedAt: string | null;
}

export interface SourceHealthRow {
  sourceId: string;
  sourceSystem: string;
  displayName: string;
  lastSyncedAt: string | null;
  freshnessStatus: string;
  recordCount: number;
  chunkCount: number;
}

export interface ContextReadModelResult {
  tenantKey: string;
  entitySummaries: EntitySummary[];
  dimensionCoverage: DimensionCoverage[];
  sourceHealth: SourceHealthRow[];
  insightCount: number;
  dimensionsLoaded: number;  // count of distinct record_types with active records
  factsActive: number;
  evidenceCoverage: number;  // % of records with at least one evidence row
}

// API route: GET /api/intelligence/context-summary?tenantKey=...
// Returns: ContextReadModelResult
// Queries: v_context_application_inventory, v_context_dimension_coverage,
//          enterprise_context_sources (left join to source_files for chunk counts)
```

### New API routes (all under `src/app/api/intelligence/`)

```
GET  /api/intelligence/context-summary   → ContextReadModelResult (S2)
GET  /api/intelligence/insights          → ContextInsight[] (S3)
GET  /api/intelligence/refresh-events    → context_refresh_events rows (S4)
POST /api/intelligence/qa               → streaming answer with citations (S5)
```

All routes:
- `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`
- Auth via `requireTenancy()` (follow the exact pattern in `/api/admin/context-layer/triage/route.ts`)
- DB reads via `getAzureReadFluentClient()`
- DB writes (S4 refresh events) via `getAzureWriteFluentClient()`

---

## S3 — L2 Insight engine (the "come alive" slice)

This is the most important slice. Without it the Insights tab stays on stubs forever.

### New directory: `src/lib/intelligence/insight-engine/`

```
src/lib/intelligence/insight-engine/
  index.ts          -- main export: runInsightEvaluation(tenantKey)
  rules/
    renewal-window-no-benchmark.ts
    adoption-below-value-case.ts
    sla-breach-worsening.ts
    material-claim-unapproved.ts
    conflicting-fact.ts
    value-coverage-gap.ts
  types.ts          -- RuleResult interface
```

### Rule evaluation contract

```typescript
// src/lib/intelligence/insight-engine/types.ts
export interface RuleEvaluationContext {
  tenantKey: string;
  db: ReturnType<typeof getAzureReadFluentClient>;
}

export interface RuleResult {
  fired: boolean;
  insights: Omit<ContextInsight, 'id' | 'createdAt' | 'updatedAt'>[];
}

// Each rule file exports:
export async function evaluate(ctx: RuleEvaluationContext): Promise<RuleResult>
```

### Rule: `renewal-window-no-benchmark.ts` (the prototype rule — build this first)

```typescript
export async function evaluate(ctx: RuleEvaluationContext): Promise<RuleResult> {
  // Query v_context_vendor_renewals for tenant
  // Filter: contract_end_date within 120 days from today
  //         AND auto_renew = 'YES'
  //         AND (benchmark_present IS NULL OR benchmark_present = 'NO')
  // For each match → generate one ContextInsight row:
  //   headline: "You're about to auto-renew a ${value} ${vendor} contract with no benchmark"
  //   so_what: "${vendor} auto-renews ${days}d from now. Industry-context dimension isn't loaded..."
  //   materiality: 'high'
  //   domain: 'Vendor'
  //   ruleId: 'renewal-window-no-benchmark'
  //   derivedFromRecordIds: [record.id]
  //   evidence: `Vendor Contracts · ${source_file}`
  //   confidence: 'high' if all three fields are present and fresh; 'medium' if attention
  //   action: 'Shape into Move'
  //   entityName: vendor_name
  //   entityType: 'vendor'
}
```

### `runInsightEvaluation(tenantKey: string)` — the evaluator

```typescript
// src/lib/intelligence/insight-engine/index.ts
export async function runInsightEvaluation(tenantKey: string): Promise<{
  evaluated: number;
  fired: number;
  written: number;
  errors: string[];
}> {
  // 1. Load significance_rules from DB (filter: enabled = true)
  // 2. For each rule with a matching evaluator function:
  //    a. Call evaluate(ctx)
  //    b. If fired: upsert into context_insights
  //       ON CONFLICT (tenant_key, rule_id, entity_name) DO UPDATE
  //       (update headline, so_what, materiality, confidence, freshness_status, updated_at)
  //       lifecycle_state = 'active' if facts are fresh; 'review_required' if any fact is stale
  // 3. Supersede stale insights: any insight where derived_from_record_ids records are now
  //    lifecycle_state = 'inactive' or 'superseded' → set insight lifecycle_state = 'superseded'
  // 4. Return receipt
}
```

### When to run the evaluator

- **On-demand:** `POST /api/intelligence/insights/evaluate` (admin only, `internal-admin` lane) — for the operator to trigger manually after a data load
- **After CSV upload:** hook into `src/app/api/admin/context-layer/csv-upload/route.ts` — after successful commit, call `runInsightEvaluation(tenantKey)` in the background (don't await; fire-and-forget with a receipt log)
- **ACA job (S4):** the refresh-event system triggers a re-evaluation

---

## S4 — Refresh-event ledger

### Migration: `supabase/migrations/20260616220000_context_refresh_events.sql`

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS context_refresh_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  tenant_key TEXT NOT NULL,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('csv_upload','source_artifact','move_artifact','manual','api_sync')),
  source_id UUID REFERENCES enterprise_context_sources(id) ON DELETE SET NULL,
  source_label TEXT,
  period_label TEXT,
  rows_seen INT NOT NULL DEFAULT 0,
  rows_accepted INT NOT NULL DEFAULT 0,
  rows_rejected INT NOT NULL DEFAULT 0,
  facts_created INT NOT NULL DEFAULT 0,
  facts_updated INT NOT NULL DEFAULT 0,
  facts_superseded INT NOT NULL DEFAULT 0,
  approval_required BOOLEAN NOT NULL DEFAULT false,
  affected_surfaces TEXT[] NOT NULL DEFAULT '{}',
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cre_tenant ON context_refresh_events(tenant_key, created_at DESC);
-- RLS: same pattern as context_insights (service_role full; authenticated read/write via can_read/write_tenant_by_key)
COMMIT;
```

### Hook points

- **CSV upload** (`src/app/api/admin/context-layer/csv-upload/route.ts`): after `loadCsvUploadToTenantContext()` succeeds, insert one `context_refresh_events` row with `triggered_by = 'csv_upload'`, counts from the connector result.
- **Source artifact persist** (`src/app/api/v1/source/[eventId]/artifacts/upload/route.ts`): after artifact accepted, insert with `triggered_by = 'source_artifact'`.
- **Insight re-evaluation**: call `runInsightEvaluation(tenantKey)` after inserting the refresh event.

---

## S5 — Q&A router and answer audit

### Intent classes and routes (deterministic — no LLM intent classification for SQL questions)

```typescript
// src/lib/intelligence/qa-router/types.ts
export type IntentClass =
  | 'insight-lookup'    // "What is my context telling me?" → query context_insights
  | 'sql-fact'          // counts, trends, spend, entity lookup → SQL against records/facts views
  | 'freshness'         // "Is our data board-ready?" → source_health + answerability
  | 'retrieval'         // "Tell me about Kyndryl" → enterprise_context_chunks full-text
  | 'corpus'            // "What does the playbook say about AMS?" → searchCorpus()
  | 'hybrid';           // cross-context+corpus → both
```

### Router function

```typescript
// src/lib/intelligence/qa-router/index.ts
export async function routeQuestion(args: {
  query: string;
  tenantKey: string;
  clientId: string;
}): Promise<{
  answer: string;            // markdown
  routeUsed: IntentClass;
  citations: Citation[];     // { label, sourceType, locator, freshness }
  confidence: 'high' | 'medium' | 'low' | 'none';
  freshnessStatus: 'fresh' | 'attention' | 'stale' | 'unknown';
  missingContext: string[];  // named missing sources
  viewDirective?: ViewDirective;  // optional: repaint the right panel
}>
```

**Routing priority (check in order):**
1. If query matches insight-trigger keywords ("telling me", "attention", "material risk", "top insights") → `insight-lookup` → query `context_insights` for tenant, return top 5 by materiality
2. If query matches count/metric keywords ("how many", "spend", "cost", "adoption", "what do we have") → `sql-fact` → query `v_context_application_inventory` / `v_context_vendor_renewals` / `enterprise_context_facts`
3. If query matches freshness keywords ("fresh", "board-ready", "stale", "trust", "reliable") → `freshness` → query `enterprise_context_sources` + `v_context_dimension_coverage`
4. If named entity detected (capitalised noun, company name) → `retrieval` → `retrieveEnterpriseContextChunks(query, tenantKey)`
5. If corpus keywords ("playbook", "best practice", "pattern", "industry", "peers") → `corpus` → `searchCorpus(query)`
6. Default → `hybrid` (both retrieval + corpus)

**For intent classes 1–3 (SQL routes):** answer is synthesised by Claude using the SQL results as grounding context. Never invent numbers. Pass the raw SQL results as context; Claude narrates them. Use `callSentinelModel()` (already at `src/lib/agents/sentinel-reasoning/model.ts`) with a grounding prompt that includes the SQL rows and forbids fabrication.

### API route: `POST /api/intelligence/qa`

```typescript
// src/app/api/intelligence/qa/route.ts
// Accepts: { query: string }
// Auth: requireTenancy()
// Returns: ReadableStream (SSE or newline-delimited JSON)
// Writes one row to context_explorer_answer_audit after streaming completes
```

### Answer audit table (`context_explorer_answer_audit`)

```sql
-- Create in the S5 migration
CREATE TABLE context_explorer_answer_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  question TEXT NOT NULL,
  route_used TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  citation_count INT NOT NULL DEFAULT 0,
  facts_used UUID[] NOT NULL DEFAULT '{}',
  chunks_used UUID[] NOT NULL DEFAULT '{}',
  confidence TEXT,
  freshness_status TEXT,
  missing_context TEXT[] NOT NULL DEFAULT '{}',
  view_directive JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### The three acceptance-fixture queries (must pass on SkyHarbor Air before S5 is done)

| Query | Expected route | Expected output |
|---|---|---|
| "What is my context telling me right now?" | `insight-lookup` | ≥1 real insight cards; each with headline, domain, rule_id, evidence citation; viewDirective pins Insights tab |
| "What changed in the vendor portfolio this quarter?" | `sql-fact` or `freshness` | Real change events if S4 done; names stale sources; cites `context_refresh_events`; viewDirective switches Change Log tab |
| "Is our control-tower data fresh enough to brief the board?" | `freshness` | Names specific stale/missing dimensions; states answerability %; viewDirective pins Coverage & Trust tab |

---

## The 8 truth states — surface them everywhere

Per the design spec and AGENTS.md ingestion truth standard, **never collapse states to one word**. The UI must show, per source, which of these 8 states is reached:

```
1. source received       → enterprise_context_sources row exists
2. classified            → source_type + dimension assigned
3. parsed                → source_files rows created; text extracted
4. validated             → validation_engine found no blocking errors
5. committed             → enterprise_context_records rows with lifecycle_state = 'active'
6. evidence-linked       → enterprise_context_evidence rows exist
7. embedded / indexed    → enterprise_context_chunks with embed_status = 'done'
8. answer-proven         → at least one successful QA retrieval used this source
```

In Coverage & Trust tab: the source health table shows the **furthest state reached** (coloured chip) and **the first unmet state** (grey chip). The truth-state funnel shows count per state across all sources.

---

## Reuse — what not to rebuild

| Capability | Existing file | Note |
|---|---|---|
| Sentinel streaming / model call | `src/lib/agents/sentinel-reasoning/model.ts` → `callSentinelModel()` | Use this for Q&A synthesis; never direct API call |
| Corpus search | `src/lib/corpus/retrieval.ts` → `searchCorpus()` | Already scales; use for Corpus tab + Q5 corpus intent |
| Enterprise context retrieval | `src/lib/enterprise-context/retrieval.ts` → `retrieveEnterpriseContextChunks()` | Use for retrieval intent (Q4) |
| DB read adapter | `src/lib/data-plane/postgresCompat.ts` → `getAzureReadFluentClient()` | All reads go here; no direct `pg` |
| DB write adapter | same → `getAzureWriteFluentClient()` | All writes go here |
| Auth / tenancy | `src/lib/auth/tenancy.ts` → `requireTenancy()` | Every API route |
| Feature flags | `src/lib/features/is-feature-enabled.ts` → `isFeatureEnabled(ctx, 'context_corpus_explorer_enabled')` | Already registered; add `'skyharbor-air'` to `includeTenants` in registry.ts to activate |
| Intelligence-v4 shell components | `src/components/intelligence-v4/` | Update in place; do not duplicate |
| Corpus NOT seeded state | `src/components/intelligence-v4/CorpusNotSeededState.tsx` | Use for empty states across all tabs |
| Agent context broker | `src/lib/knowledge/context-broker/` | Never import enterprise_context_* directly from components; go through the broker contract |

---

## Architecture rules (non-negotiable)

- **Broker boundary:** app-tier components must NOT directly import `EnterpriseDataRoom` / broker / vector / graph. Go through `AgentContextBroker` contract.
- **Anthropic only** for answer synthesis (Sentinel, Q&A router). No OpenAI on production answer paths.
- **Azure/Postgres** for all data. No Supabase runtime imports.
- **No Vercel** as runtime or deploy target.
- Run `npm run audit:architecture-rules` before any PR. Must be 0 violations.

---

## Build sequence and slice exits

| Slice | Exit proof (state-level, not UI text) |
|---|---|
| **S2 — L1 wiring** | `GET /api/intelligence/context-summary` returns real record/fact counts for SkyHarbor Air. Explore tab shows real IT systems from DB (not `STUB_SYSTEMS`). Coverage & Trust shows real dimension coverage from `v_context_dimension_coverage`. |
| **S3 — L2 insight engine** | `runInsightEvaluation('skyharbor-air')` writes ≥3 rows to `context_insights`. Insights tab shows these rows with real headlines and populated `derivedFromRecordIds`. At least `renewal-window-no-benchmark` fires (SkyHarbor has Kyndryl vendor data). `facts→rule→evidence` trace is clickable and cites a real source locator. |
| **S4 — Refresh events** | A new CSV upload to `/api/admin/context-layer/csv-upload` creates a row in `context_refresh_events`. Change Log tab shows that row. `runInsightEvaluation` is called and creates/updates an insight. |
| **S5 — Q&A router** | Typing "What is my context telling me right now?" in the Sentinel rail on SkyHarbor Air returns a non-canned answer that cites a real `context_insights.id`. The `CANNED_ANSWERS` object is deleted from `SentinelExplorerRail.tsx`. `context_explorer_answer_audit` has a row after the query. |

---

## Release discipline (per slice)

Each slice is a separable PR. Every PR must have:

1. A release record at `docs/releases/records/` using the template — lane, layer, client applicability, QA, rollout, rollback, audit evidence, context-ingestion evidence
2. `npm run release:check` passes (`node scripts/release-check.mjs --base origin/main --head HEAD`)
3. `npx tsc --noEmit` clean
4. `npm run audit:architecture-rules` = 0 violations

Lanes: S2–S4 = `client-data-lane`; S5 = `global-control-lane`.

**Merge order within a PR set: S2 → S3 → S4 → S5.** S3 depends on S2's read model. S4 hooks into S3's evaluator. S5 queries S3's `context_insights` table.

---

## Prod deploy path (lab first, then ACA main)

After each slice merges to main:

1. **Apply migration** (lab private Postgres, VNet only):
   ```bash
   az acr build --registry <acr> --image abarva-migrate:latest .
   az containerapp job start \
     --name job-abarva-db-migrate-lab-eastus \
     --resource-group rg-abarva-lab-eastus
   # Confirm in Log Analytics: new tables/columns exist
   ```

2. **Deploy app** (ca-abarva-web-lab-eastus):
   ```bash
   az acr build --registry <acr> --image abarva-web:latest .
   az containerapp update \
     --name ca-abarva-web-lab-eastus \
     --resource-group rg-abarva-lab-eastus \
     --image <acr>.azurecr.io/abarva-web:latest
   # Shift traffic to new revision after health check
   ```

3. **Activate flag for SkyHarbor Air**: in `src/lib/features/registry.ts`, set `includeTenants: ['skyharbor-air']` for `context_corpus_explorer_enabled`. This is a one-line code change; deploy it with the S2 PR.

4. **Verify at state level** on the live ACA URL with `cdio@skyharbor-air` credentials.

---

*Full design spec: `docs/build/intelligence/INTELLIGENCE_CONTEXT_CORPUS_EXPLORER_DESIGN_2026-06-16.md`*
*Prototype: `public/prototypes/intelligence-context-corpus-explorer.html`*
*S1 PRs (merge first): #3559 → #3561 → #3560 → #3562 → #3566 → #3564*
