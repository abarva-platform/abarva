# Part 5 · Operationalization

This part specifies how the intelligence layer operates in production — the ingestion pipeline that moves pattern content through the stack, the prompt library organization, the runtime contract each agent honors, and the quality monitoring and governance loops that keep the system accurate as patterns and tenants grow.

## 5.1 · Ingestion Pipeline

### 5.1.1 · Source of truth

Pattern content lives as markdown files in `content/patterns/` with one file per pattern (or child-pattern set). The pattern pack files produced in Parts 2-3 of this document are the reference shape. Content authoring is markdown-first, human-reviewed, and version-controlled. No authoritative content is created directly in the database.

### 5.1.2 · Pipeline stages

```
content/patterns/*.md
      │
      ▼
┌──────────────────┐
│ 1. Parse         │  deterministic markdown → structured JSON
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 2. Validate      │  schema check, broken-ref check, YAML front-matter check
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 3. Upsert        │  Postgres: intel_patterns, intel_signals, ... (idempotent)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 4. Chunk         │  content → intel_retrieval_chunks rows with content_hash
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 5. Embed         │  Voyage-3-large → vectors for changed chunks only
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 6. Upsert-Vector │  Pinecone upsert to target namespace with metadata
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 7. Graph Seed    │  Cypher MERGE statements to AGE / Neo4j (idempotent)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 8. Verify        │  Reconcile: Postgres ↔ Pinecone ↔ Graph
└──────────────────┘
```

### 5.1.3 · Stage-by-stage behavior

**1. Parse.** The parser reads each markdown file in `content/patterns/`. It extracts:
- YAML front-matter → `intel_patterns` fields
- Part A (identity), B (classification), C (signals), D (diagnostic), E (causal), F (interventions), G (anti-patterns), H (vendors), I (regulatory), J (observations), K (success measures), L (timeline), M (governance), N (sector variants), O (graph schema Cypher), P (retrieval chunking notes), Q (prompting contract fragments), R (rendering contract)

Output per file: one JSON document with fully hydrated structure. Broken references (missing pattern IDs, vendor IDs, framework IDs) are surfaced as errors.

**2. Validate.** Schema validation against strict JSON Schema. Key checks:
- Required YAML fields present
- `confidence_floor` in [0,1]
- `pattern_id` matches file path convention
- All cross-references resolve (vendors, frameworks, related patterns)
- Signals, interventions, anti-patterns each have ≥ configured minimum count (typically 8)
- Part O Cypher is syntactically valid
- Part Q prompt fragments parse

Validation blocks promotion on any error.

**3. Upsert.** For each pattern, Postgres rows are upserted transactionally:
- `intel_patterns` (one row)
- `intel_pattern_sectors` (one row per sector in applicability)
- `intel_topics` (new topics created if not present)
- `intel_pattern_topics` (mappings)
- `intel_signals`, `intel_diagnostic_questions`, `intel_interventions`, `intel_antipatterns` (positioned rows, delete-then-insert for idempotent resequencing)
- `intel_pattern_relationships` (upserts, with `delete` for any relationships previously recorded but now absent)
- `intel_vendors` + `intel_pattern_vendors`
- `intel_regulatory_frameworks` + `intel_pattern_frameworks`

**4. Chunk.** The chunker emits `intel_retrieval_chunks` rows per the chunking contract in each pattern's Part P. Canonical chunking rules:

| Chunk Type | Source | Count |
|---|---|---|
| overview | Parts A + B combined, short form | 1 |
| signal | one per Part C entry | ~8 |
| diagnostic_question | one per Part D entry | ~8 |
| intervention | one per Part F entry | ~8 |
| antipattern | one per Part G entry | ~8 |
| vendor_note | one per distinct Part H vendor | varies |
| regulatory_note | one per Part I framework | varies |
| observation | one per Part J composite observation | ~6-8 |
| success_measure | Part K clustered | ~3-5 |
| governance_note | Part M | 1-2 |
| sector_variant | one per Part N variant | ~4-8 |
| prompt_fragment | Part Q detection + injection + diagnostic | 3 |

Each chunk gets a deterministic ID pattern: `chunk_{pattern_id}_{chunk_type}_{position}_{version}`.

Content hash (sha256) computed per chunk. If content hash matches stored hash, chunk is not re-embedded.

**5. Embed.** Voyage-3-large primary. Voyage AI is preferred for its retrieval-tuned embeddings. OpenAI text-embedding-3-large fallback if Voyage unavailable. Embedding is batched (up to 128 chunks per call) for efficiency. Cost tracked per run.

Embedding fall-forward: if a chunk's hash matches stored hash in `intel_retrieval_chunks.content_hash` and `last_embedded_at` is recent, embedding is skipped.

**6. Upsert-Vector.** Pinecone upsert to the namespace computed from pattern metadata:
- Universal patterns → `global:patterns`
- Healthcare vertical → `global:patterns:healthcare`
- Retail → `global:patterns:retail`
- FinServ → `global:patterns:financial_services`
- Energy → `global:patterns:energy`

Full metadata (per 4.3.3) attached. Vector ID equals chunk ID.

**7. Graph Seed.** Part O Cypher executed against AGE (v1) or Neo4j (v2). All statements use `MERGE` idempotently. Transaction per pattern.

**8. Verify.** Post-ingestion reconciliation:
- Every Postgres chunk row has matching Pinecone vector.
- Every Pinecone vector has matching Postgres chunk (no orphans).
- Graph has Pattern node + all Signal/Intervention/AntiPattern nodes + expected relationships.

Verify writes a run summary to `intel_ingestion_runs` (audit).

### 5.1.4 · Ingestion triggers

| Trigger | Description | Scope |
|---|---|---|
| Commit to `content/patterns/*.md` on `main` | CI/CD pipeline runs full ingestion for affected patterns | Changed patterns only |
| Manual admin invocation | Run full ingestion for specified patterns | Selected |
| Nightly full reconcile | Run reconcile across all patterns | All |
| Weekly vendor-catalog refresh | Refresh vendor metadata if changed externally | Vendors only |

### 5.1.5 · Pipeline runbook

```
# Full ingestion run (single pattern)
pnpm intel:ingest --pattern pattern_analytics_modernization

# Full ingestion run (all changed patterns since last main commit)
pnpm intel:ingest --changed-only

# Reconcile (no content changes, verify coherence)
pnpm intel:reconcile --all

# Re-embed everything (after model change)
pnpm intel:reembed --all --model voyage-3-large

# Tear down and rebuild namespace (for fresh tenant seed, etc.)
pnpm intel:rebuild-namespace --namespace client:tnt_morrison_reference:observations
```

### 5.1.6 · Failure handling

- Pipeline is atomic per-pattern. A single pattern's failure does not block other patterns.
- Each stage writes progress to `intel_ingestion_runs` and emits structured logs.
- Pinecone upsert failures retried with exponential backoff; embedding cost is not double-charged because hash-based skip still applies to retries.
- Graph seed failures roll back that pattern's graph changes (per-transaction) without affecting Postgres state; reconcile will re-drive graph seed on next cycle.

## 5.2 · Prompt Library Structure

Prompts are first-class, versioned artifacts. Three runtime libraries plus one rendering library.

### 5.2.1 · Directory layout

```
content/prompts/
  detection/
    _base.md                                # shared detection framing
    pattern_analytics_modernization.md
    pattern_ai_led_pdlc.md
    pattern_ai_led_pdlc_specification_debt.md   # child pattern
    ...
    pattern_commodity_trading_ai.md
  injection/
    _base.md
    pattern_analytics_modernization.md
    pattern_ai_led_pdlc.md
    ...
  diagnostic/
    _base.md
    pattern_analytics_modernization.md
    ...
  rendering/
    _base.md                                # shared rendering scaffold
    intelligence_list.md
    intelligence_detail.md
```

Each prompt file has YAML front-matter:

```yaml
prompt_id: prompt_detection_pattern_analytics_modernization_v1
pattern_id: pattern_analytics_modernization
library: detection
version: 1
active: true
tokens_estimate: 280
model_compatibility: [claude-sonnet, claude-opus, gpt-4o, gemini-2-5-pro]
created_by: anand + claude
```

### 5.2.2 · Detection library

**Purpose:** determine which patterns are active for a given tenant / program / situation.

**Structure:** each detection prompt is a concise summary of the pattern's activation criteria (Part Q detection fragment). Consumed by Nexus and Sentinel to screen multiple patterns quickly.

**Contract output:**

```json
{
  "pattern_detections": [
    {
      "pattern_id": "pattern_analytics_modernization",
      "confidence": 0.86,
      "signals_triggered": ["signal_infrastructure_gap", "signal_planner_override_culture"],
      "rationale": "…"
    },
    ...
  ]
}
```

**Budget:** p99 < 800ms for batched detection across ≤20 patterns. Token budget: ~5K input for detection batch.

**Caching:** detection results cached per (tenant_id, input_hash) for 24h; re-run on explicit trigger or tenant context change.

### 5.2.3 · Injection library

**Purpose:** once a pattern is active, inject the pattern's operational knowledge into an ongoing agent conversation — interventions, composite observations, anti-patterns.

**Structure:** each injection prompt summarizes Part F (interventions), Part J (observations), and Part G (anti-patterns) for the pattern. Denser than detection; consumed by Nexus during program planning and execution.

**Budget:** p99 < 300ms for retrieval; token budget ~3K per injected pattern. Nexus injects up to 3 patterns per turn.

**Retrieval integration:** the injection prompt itself is terse; the detailed content is pulled from Pinecone on demand based on the specific conversational context.

### 5.2.4 · Diagnostic library

**Purpose:** when a pattern is suspected but not yet confirmed, guide a structured diagnostic conversation with the human user.

**Structure:** each diagnostic prompt contains Part D questions in structured sequence with follow-up probes. Consumed by Nexus's Maestro Intake Interface.

**Budget:** p99 < 200ms; token budget ~1.5K per diagnostic series.

### 5.2.5 · Rendering library

**Purpose:** shape how pattern content appears in the Sentinel UI (`/intelligence/patterns/*`).

**Structure:** rendering prompts define section ordering, callout treatment, unique rendering elements, and tenant-data binding. Not strictly runtime prompts — some are compile-time templates consumed by the frontend.

### 5.2.6 · Prompt versioning

- Every prompt has a version (v1, v2, …).
- Active version governed by `intel_prompt_fragments.active`.
- Version transitions go through champion-challenger: new version deployed as challenger for N days; performance compared; promoted or retired.
- All runtime invocations record the prompt version used in `intel_detection_runs.prompt_version`.

### 5.2.7 · Prompt evaluation harness

```
ops/eval/
  fixtures/
    detection/
      cases.jsonl                        # [{tenant_context, expected_patterns, expected_signals}]
    diagnostic/
      cases.jsonl
  runners/
    run_detection_eval.py
    run_diagnostic_eval.py
  reports/
    2026-04-22-detection-eval.md
```

Evaluation metrics:
- Detection precision, recall, F1 per pattern
- False-positive rate per pattern
- Latency p50/p95/p99
- Cost per invocation
- Prompt token usage

Runs before every prompt version promotion.

## 5.3 · Runtime Behavior Contract

### 5.3.1 · Agent responsibilities

| Agent | Intelligence-Layer Interaction |
|---|---|
| **Nexus** (Programs) | Detection on program intake; injection during program planning and execution; diagnostic during Maestro Intake; observation capture on program milestones |
| **Sentinel** (Intelligence) | Serves `/intelligence/patterns/*` surfaces; runs portfolio-level pattern scans; publishes intelligence artifacts |
| **Atlas** (Tower) | Consumes cross-tenant analogous-programs traversals (composite-only, redacted); publishes portfolio roll-ups |
| **Steward** (Platform) | Operates the ingestion pipeline, sync worker, namespace provisioning, tenant RLS, reconciliation |

### 5.3.2 · Nexus runtime flow — program intake

```
User message → Maestro Intake (Nexus)
   │
   ▼
1. Detection: batch detection across all global patterns + tenant-applicable vertical patterns.
   → returns top N candidate patterns with confidence.
   │
   ▼
2. If confidence > threshold on any pattern:
   a. Inject pattern's operational knowledge into context.
   b. Proceed with program shaping.
   Else:
   a. Select highest-confidence sub-threshold pattern.
   b. Load diagnostic prompt; ask structured clarifying questions.
   c. Re-run detection with enriched context.
   │
   ▼
3. Once ≥1 pattern confirmed:
   a. Pattern(s) associated with Program record.
   b. Injection prompt remains available for Nexus through program execution.
   c. Detection re-run on major program state changes.
```

### 5.3.3 · Sentinel runtime flow — intelligence page

```
User navigates to /intelligence/patterns/owned-brand-margin-recovery
   │
   ▼
1. Load pattern from Postgres (intel_patterns + related tables).
2. Load composite observations (is_composite = true) + any tenant observations (RLS-scoped).
3. Load vendor landscape.
4. Load regulatory frameworks.
5. Run rendering prompt to assemble page content (or use pre-rendered static content for performance).
6. For tenant-bound right-sidebar, run tenant-specific queries for current metrics.
7. Render page with Sentinel's branded shell.
```

### 5.3.4 · Atlas runtime flow — portfolio view

```
Atlas portfolio view across all tenants (Anthropic-controlled access)
   │
   ▼
1. For each pattern: count active programs, aggregate composite outcomes.
2. For cross-tenant analogous-program queries, redact to composite level.
3. Emit portfolio roll-ups (pattern_adoption_rate, outcome_distributions, trend_direction).
```

### 5.3.5 · Steward runtime flow — tenant provisioning

```
New tenant onboarded
   │
   ▼
1. Create tenant row in `tenants` (operational schema).
2. Initialize Pinecone namespaces: client:{tenant_id}:documents, :programs, :observations.
3. Create tenant-scoped RLS context for Postgres.
4. Optional: seed tenant with composite observations relevant to the tenant's sector.
```

### 5.3.6 · Latency budgets

| Operation | p50 | p95 | p99 |
|---|---|---|---|
| Detection (single pattern) | 120ms | 280ms | 500ms |
| Detection (batch ≤ 20 patterns) | 300ms | 650ms | 900ms |
| Injection retrieval (per pattern) | 80ms | 180ms | 300ms |
| Diagnostic prompt load | 50ms | 120ms | 200ms |
| Analogous-programs graph traversal (AGE v1) | 80ms | 220ms | 450ms |
| Intelligence page initial render | 300ms | 600ms | 1000ms |

### 5.3.7 · Cost budgets

| Activity | Target |
|---|---|
| Embedding (per 1K chunks updated) | < $0.30 |
| Detection run (per invocation) | < $0.015 |
| Injection retrieval (per invocation) | < $0.008 |
| Diagnostic prompt cycle (per conversation turn) | < $0.02 |
| Sentinel page render (cached content) | < $0.002 |
| Monthly budget at seed scale (~50 tenants) | < $1,800 |

## 5.4 · Quality Monitoring

### 5.4.1 · Detection quality

Metrics tracked continuously:

- **Precision:** of patterns marked active by detection, fraction confirmed by human or downstream evidence.
- **Recall:** of patterns known active (from ground-truth programs), fraction detected correctly.
- **False-activation rate:** patterns detected that don't activate on inspection.
- **Missed-activation rate:** patterns that should have activated but didn't.

Ground truth built from curated evaluation fixtures plus sampled human review of production runs.

Thresholds:
- Precision floor: 0.80
- Recall floor: 0.75
- False-activation rate ceiling: 0.12

Below floor for any pattern triggers investigation and potential prompt or signal rewrite.

### 5.4.2 · Confidence calibration

For each pattern, measure calibration of stated confidence vs. actual accuracy over time.

- Bucket confidence scores (0.7-0.75, 0.75-0.8, …, 0.95-1.0).
- For each bucket, measure actual positive rate.
- Ideal: positive rate tracks bucket midpoint closely.
- Miscalibration (actual much lower than stated) is a governance signal.

### 5.4.3 · Observation freshness

Each pattern has `n_observations_floor`. If composite + tenant observations for a pattern fall below the floor, the pattern's effective confidence is capped until observations are added. This disciplines the intelligence layer against under-evidenced patterns.

### 5.4.4 · Retrieval quality

Spot-check random retrieval calls weekly:

- Do top-k retrieved chunks match the query intent?
- Is any chunk off-topic at rank ≤ 5? If yes — embedding or chunking issue.
- Are tenant-scoped chunks correctly isolated from cross-tenant leakage?

### 5.4.5 · Drift monitoring

- Detection confidence distribution over time (shift = possible model drift or tenant mix change).
- Pattern activation rate over time.
- New pattern candidates emerging from observations (signal for new pattern authoring).

### 5.4.6 · Audit completeness

- 100% of detection runs recorded in `intel_detection_runs`.
- 100% of retrieval calls recorded in `intel_retrieval_calls`.
- 100% of observation writes recorded with `captured_by` and timestamp.
- Weekly sample of 50 audit entries reviewed by Steward ops.

### 5.4.7 · Tenant isolation

- Automated test suite validates RLS policies continuously.
- Canary query tests from tenant-A context against tenant-B data — must return zero rows.
- Pinecone metadata filters verified to prevent cross-tenant chunk leakage.
- Graph queries scope-check tenant_id on any Observation or Program node.

### 5.4.8 · Reporting cadence

| Report | Cadence | Owner |
|---|---|---|
| Detection quality report | Weekly | Steward ops |
| Retrieval quality audit | Weekly | Steward ops |
| Prompt version performance | On each new version + biweekly | Product |
| Observation freshness by pattern | Monthly | Content ops |
| Drift analysis | Monthly | Product + ML |
| Audit completeness | Monthly | Compliance |
| Tenant isolation canary results | Daily | Steward ops |

## 5.5 · Content Governance

### 5.5.1 · Authoring workflow

```
Draft pattern → Peer review (content ops + domain expert) → Anand sign-off
  → Merge to main → CI ingestion → Staging validation
  → Production promotion (explicit step) → Published
```

### 5.5.2 · Change classes

| Change class | Examples | Review level |
|---|---|---|
| Editorial | Wording, formatting | Peer review |
| Signal / Intervention edit | Change criteria, add/remove from list | Peer + domain review |
| New pattern | Net-new pattern file | Anand + domain + product sign-off |
| Prompt version change | New detection/injection/diagnostic version | Eval harness pass + product sign-off |
| Schema change | New table column, new chunk type | Steward design review |
| Cross-store-impacting change | Changes touching Postgres + Pinecone + Graph | Full review + staged rollout |

### 5.5.3 · Deprecation path

- Pattern marked `status = 'deprecated'` in Postgres.
- Pinecone vectors retained but flagged with metadata `deprecated = true`.
- Graph Pattern node retains `status` property.
- Sentinel page shows deprecation banner and points to successor pattern.
- After 90 days: status → `retired`; vectors removed; graph node archived.

### 5.5.4 · Versioning

Patterns follow semver:
- Major (2.0.0): structural changes (section reorg, chunk-type changes, observation re-anchoring).
- Minor (1.3.0): new signals/interventions/observations, new vendors.
- Patch (1.0.1): editorial, reference updates, non-semantic fixes.

Prompt versions are integer-only (v1, v2, …) tracked independently.

## 5.6 · Incident Response

### 5.6.1 · Severity classification

| Level | Example | Response time |
|---|---|---|
| SEV-1 | Tenant isolation leak; cross-tenant content exposed | Immediate (< 30 min) |
| SEV-2 | Detection confidence badly miscalibrated; hallucinated content in production | < 2 hours |
| SEV-3 | Retrieval quality degradation; page render slow | < 8 hours |
| SEV-4 | Content typo; minor classification error | Next business day |

### 5.6.2 · Runbooks (shape)

Each severity has a runbook. Shape for SEV-1 tenant-isolation leak:
1. Immediately disable affected tenant's intelligence surface.
2. Invalidate affected caches / retrieval results.
3. Identify the cause: RLS misconfiguration, Pinecone metadata filter bug, graph scope error, or authorization bypass.
4. Remediate at source.
5. Run full canary suite.
6. Post-mortem with root cause analysis and prevention actions.

## 5.7 · Summary

- Ingestion pipeline is deterministic, markdown-sourced, and idempotent across Postgres / Pinecone / Graph.
- Four prompt libraries (detection, injection, diagnostic, rendering) are versioned and evaluated.
- Four agents (Nexus, Sentinel, Atlas, Steward) have clearly defined intelligence-layer interactions with explicit latency and cost budgets.
- Quality monitoring covers precision, recall, calibration, freshness, drift, and tenant isolation.
- Content governance distinguishes change classes and enforces review discipline.
- Incident response is graded by tenant-impact severity.

---

*End of Part 5 · Operationalization*

*Next in file sequence: `16-delivery-order.md` — Part 6 Delivery Order*

---
