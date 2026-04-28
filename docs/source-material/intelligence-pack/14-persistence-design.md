# Part 4 · Persistence Design

> **Anchor principle:** Postgres holds the facts. Pinecone holds the meaning. The graph holds the wisdom.

This part specifies the concrete data persistence design for the AbarVa Intelligence Layer — the schemas, the migration scripts, the initialization runbook — for Postgres (Supabase), Pinecone, and Apache AGE (with eventual migration path to dedicated Neo4j). Every pattern defined in Parts 2-3 maps cleanly onto this persistence design.

## 4.1 · Persistence Stack Overview

Three datastores, three responsibilities:

| Store | Role | Technology (v1) | Migration Trigger | Technology (v2) |
|---|---|---|---|---|
| **Relational** | Patterns-of-record, observations-of-record, tenant data, audit log, provenance | Postgres 16 on Supabase | N/A | Same; horizontal shard if needed at Series A scale |
| **Vector** | Semantic retrieval; chunked pattern content + tenant documents | Pinecone serverless; Voyage-3-large embeddings | If p99 retrieval latency >400ms or cost >$4K/mo | Consider Turbopuffer, Qdrant, or pgvector+HNSW |
| **Graph** | Pattern relationships, sector/vendor/framework linkages, analogous program traversal | Apache AGE on Postgres | p99 traversal latency >500ms or CPU >60% | Neo4j dedicated cluster |

Rationale: v1 uses Apache AGE (Cypher on Postgres) because it minimizes infrastructure footprint for demo-stage operation and because many queries can be answered without graph depth. Full Neo4j is the target architecture when traversal volume justifies dedicated infrastructure.

## 4.2 · Postgres Schema

### 4.2.1 · Core pattern tables

```sql
-- Top-level pattern record
CREATE TABLE intel_patterns (
  id TEXT PRIMARY KEY,                      -- e.g., 'pattern_analytics_modernization'
  slug TEXT NOT NULL UNIQUE,                -- URL-safe, e.g., 'analytics-modernization'
  name TEXT NOT NULL,
  version TEXT NOT NULL,                    -- semver, e.g., '1.0.0'
  status TEXT NOT NULL CHECK (status IN ('active','draft','deprecated','retired')),
  category TEXT NOT NULL,
  cross_industry BOOLEAN NOT NULL DEFAULT TRUE,
  primary_sector TEXT,
  short_description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  confidence_floor NUMERIC(3,2) NOT NULL CHECK (confidence_floor BETWEEN 0 AND 1),
  n_observations_floor INT NOT NULL DEFAULT 4,
  authored_by TEXT,
  last_curated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ
);

CREATE INDEX idx_intel_patterns_sector ON intel_patterns(primary_sector) WHERE primary_sector IS NOT NULL;
CREATE INDEX idx_intel_patterns_status ON intel_patterns(status);
CREATE INDEX idx_intel_patterns_category ON intel_patterns(category);

-- Pattern → sector applicability
CREATE TABLE intel_pattern_sectors (
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  sector TEXT NOT NULL,                     -- 'retail', 'healthcare', 'financial_services', 'energy', 'cross_sector', etc.
  PRIMARY KEY (pattern_id, sector)
);

-- Pattern → topic mapping (topics drive retrieval)
CREATE TABLE intel_topics (
  id TEXT PRIMARY KEY,                      -- e.g., 'topic_promotional_lift_modeling'
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE intel_pattern_topics (
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES intel_topics(id),
  PRIMARY KEY (pattern_id, topic_id)
);

-- Pattern ↔ pattern relationships
CREATE TABLE intel_pattern_relationships (
  id BIGSERIAL PRIMARY KEY,
  from_pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  to_pattern_id TEXT NOT NULL REFERENCES intel_patterns(id),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN
    ('parent','child','composite_of','variant_of','associative','analogous','conflicts_with','prerequisite_for')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_pattern_id, to_pattern_id, relationship_type)
);

CREATE INDEX idx_pattern_rel_from ON intel_pattern_relationships(from_pattern_id);
CREATE INDEX idx_pattern_rel_to ON intel_pattern_relationships(to_pattern_id);
```

### 4.2.2 · Signals, diagnostic questions, interventions, anti-patterns

```sql
-- Detection signals (Part C of every pattern)
CREATE TABLE intel_signals (
  id TEXT PRIMARY KEY,                      -- e.g., 'signal_forecast_accuracy_plateau'
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  position INT NOT NULL,                    -- 1..N ordering
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  detection_criteria JSONB                  -- structured detection rules where applicable
);

CREATE INDEX idx_signals_pattern ON intel_signals(pattern_id);

-- Diagnostic questions (Part D)
CREATE TABLE intel_diagnostic_questions (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  position INT NOT NULL,
  question TEXT NOT NULL,
  probes TEXT[] DEFAULT ARRAY[]::TEXT[]     -- follow-up prompts
);

CREATE INDEX idx_diag_pattern ON intel_diagnostic_questions(pattern_id);

-- Interventions (Part F)
CREATE TABLE intel_interventions (
  id TEXT PRIMARY KEY,                      -- e.g., 'intervention_unified_forecasting_platform'
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  position INT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  typical_success_rate NUMERIC(3,2),
  prerequisites TEXT[]
);

CREATE INDEX idx_interventions_pattern ON intel_interventions(pattern_id);

-- Anti-patterns (Part G)
CREATE TABLE intel_antipatterns (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  position INT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE INDEX idx_antipatterns_pattern ON intel_antipatterns(pattern_id);
```

### 4.2.3 · Vendors and regulatory frameworks

```sql
-- Vendors (Part H of patterns)
CREATE TABLE intel_vendors (
  id TEXT PRIMARY KEY,                      -- e.g., 'vendor_relex'
  name TEXT NOT NULL,
  category TEXT NOT NULL,                   -- vendor taxonomy
  sub_category TEXT,
  description TEXT,
  website TEXT,
  hq_country TEXT,
  ownership_status TEXT,                    -- 'independent', 'acquired', 'public', 'private', 'pe_owned'
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_vendors_category ON intel_vendors(category);

-- Pattern ↔ vendor (vendors that appear in the pattern's landscape)
CREATE TABLE intel_pattern_vendors (
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL REFERENCES intel_vendors(id),
  role TEXT,                                -- 'incumbent', 'challenger', 'specialist', 'hyperscaler', etc.
  position_note TEXT,
  PRIMARY KEY (pattern_id, vendor_id)
);

-- Regulatory frameworks (Part I)
CREATE TABLE intel_regulatory_frameworks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jurisdiction TEXT,
  regulator TEXT,
  url TEXT,
  summary TEXT,
  effective_date DATE,
  status TEXT
);

CREATE TABLE intel_pattern_frameworks (
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  framework_id TEXT NOT NULL REFERENCES intel_regulatory_frameworks(id),
  applicability TEXT,                       -- 'always', 'banks_with_material_models', etc.
  PRIMARY KEY (pattern_id, framework_id)
);
```

### 4.2.4 · Observations and evidence

```sql
-- Observations (Part J) — tenant-specific or composite
CREATE TABLE intel_observations (
  id TEXT PRIMARY KEY,                      -- e.g., 'obs_apex_retail_multichannel_forecasting_2026'
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  tenant_id TEXT,                           -- NULL for composite / global observations
  is_composite BOOLEAN NOT NULL DEFAULT TRUE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  signals_triggered TEXT[],
  interventions_applied TEXT[],
  outcomes JSONB NOT NULL DEFAULT '{}'::JSONB,  -- structured outcome metrics
  time_period TEXT,
  sector TEXT,
  program_id TEXT,                          -- link to operational Program when in-tenant
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redaction_level TEXT NOT NULL DEFAULT 'none'   -- 'none','light','heavy'
);

CREATE INDEX idx_obs_pattern ON intel_observations(pattern_id);
CREATE INDEX idx_obs_tenant ON intel_observations(tenant_id) WHERE tenant_id IS NOT NULL;

-- Evidence supporting observations
CREATE TABLE intel_evidence (
  id BIGSERIAL PRIMARY KEY,
  observation_id TEXT NOT NULL REFERENCES intel_observations(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,              -- 'metric','document','interview_quote','analysis_output'
  label TEXT NOT NULL,
  value_numeric NUMERIC,
  value_text TEXT,
  source_uri TEXT,
  collected_at TIMESTAMPTZ,
  captured_by TEXT
);

CREATE INDEX idx_evidence_obs ON intel_evidence(observation_id);
```

### 4.2.5 · Retrieval chunking table (source of truth for Pinecone)

```sql
-- Every Pinecone vector has a row here for traceability, reindex, and audit.
CREATE TABLE intel_retrieval_chunks (
  id TEXT PRIMARY KEY,                      -- chunk_id, deterministic
  pattern_id TEXT NOT NULL REFERENCES intel_patterns(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES intel_topics(id),
  chunk_type TEXT NOT NULL CHECK (chunk_type IN
    ('overview','signal','diagnostic_question','intervention','antipattern',
     'vendor_note','regulatory_note','observation','success_measure','governance_note','sector_variant','prompt_fragment')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  embedding_model TEXT NOT NULL,            -- 'voyage-3-large', 'openai-text-embedding-3-large', etc.
  embedding_dim INT NOT NULL,
  pinecone_namespace TEXT NOT NULL,
  pinecone_vector_id TEXT,                  -- matches Pinecone ID (often = chunk id)
  content_hash TEXT NOT NULL,               -- sha256 of content for change detection
  last_embedded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chunks_pattern ON intel_retrieval_chunks(pattern_id);
CREATE INDEX idx_chunks_namespace ON intel_retrieval_chunks(pinecone_namespace);
CREATE INDEX idx_chunks_type ON intel_retrieval_chunks(chunk_type);
```

### 4.2.6 · Prompt library tables

```sql
-- Prompt fragment library (detection / injection / diagnostic)
CREATE TABLE intel_prompt_fragments (
  id TEXT PRIMARY KEY,                      -- e.g., 'prompt_detection_pattern_analytics_modernization_v1'
  pattern_id TEXT REFERENCES intel_patterns(id) ON DELETE CASCADE,
  library TEXT NOT NULL CHECK (library IN ('detection','injection','diagnostic','rendering')),
  version TEXT NOT NULL,
  body TEXT NOT NULL,
  tokens_estimate INT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompts_pattern ON intel_prompt_fragments(pattern_id);
CREATE INDEX idx_prompts_library ON intel_prompt_fragments(library);
```

### 4.2.7 · Runtime detection + invocation audit

```sql
-- Every detection run captured for evaluation and drift monitoring
CREATE TABLE intel_detection_runs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT,
  program_id TEXT,
  agent TEXT NOT NULL,                      -- 'nexus','sentinel','atlas','steward'
  invoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  input_summary TEXT,
  latency_ms INT,
  patterns_detected JSONB NOT NULL,         -- [{pattern_id, confidence, signals_triggered[]}]
  prompt_version TEXT,
  model TEXT,
  cost_usd NUMERIC(10,4)
);

CREATE INDEX idx_detruns_tenant ON intel_detection_runs(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_detruns_program ON intel_detection_runs(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX idx_detruns_invoked ON intel_detection_runs(invoked_at);

-- Individual retrieval calls
CREATE TABLE intel_retrieval_calls (
  id BIGSERIAL PRIMARY KEY,
  detection_run_id BIGINT REFERENCES intel_detection_runs(id) ON DELETE CASCADE,
  tenant_id TEXT,
  agent TEXT NOT NULL,
  pinecone_namespace TEXT NOT NULL,
  query_text TEXT NOT NULL,
  k INT NOT NULL,
  top_chunk_ids TEXT[] NOT NULL,
  latency_ms INT,
  invoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retcalls_tenant ON intel_retrieval_calls(tenant_id) WHERE tenant_id IS NOT NULL;
```

### 4.2.8 · Row-level security (RLS)

Tenant-scoped tables use Supabase RLS to enforce tenant boundary. Minimum policy set:

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE intel_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel_detection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel_retrieval_calls ENABLE ROW LEVEL SECURITY;

-- Composite/global rows visible to all; tenant rows only to matching tenant
CREATE POLICY intel_obs_select ON intel_observations FOR SELECT
  USING (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.current_tenant', true)
  );

CREATE POLICY intel_obs_insert ON intel_observations FOR INSERT
  WITH CHECK (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.current_tenant', true)
  );

-- similar policies for intel_evidence, intel_detection_runs, intel_retrieval_calls
```

Admin / content-ops roles bypass RLS via service role; application paths run under tenant-scoped JWT with `app.current_tenant` set.

## 4.3 · Pinecone Namespace and Index Design

### 4.3.1 · Index configuration

Single serverless Pinecone index (v1): `abarva-intelligence`.

- **Dimension:** 1024 (Voyage-3-large primary). Fallback index `abarva-intelligence-oai` at 3072 (OpenAI text-embedding-3-large) for resilience.
- **Metric:** cosine.
- **Cloud / region:** AWS us-east-1 (primary); replicate to us-west-2 at Series A.
- **Serverless.**

### 4.3.2 · Namespace plan

```
# Global pattern content
global:patterns                         (all universal patterns)
global:patterns:healthcare              (healthcare-scoped chunks)
global:patterns:retail
global:patterns:financial_services
global:patterns:energy

# Tenant-scoped
client:{tenant_id}:documents            (tenant-uploaded docs; chunked during ingestion)
client:{tenant_id}:programs             (tenant program summaries + outcomes)
client:{tenant_id}:observations         (tenant-specific observations, not shared)

# Operational
ops:prompt_fragments                    (prompt library retrievable by agents)
ops:skill_packs                         (agent skill pack content)
```

### 4.3.3 · Metadata schema (per vector)

Every Pinecone vector carries the same metadata shape. Example for a pattern chunk:

```json
{
  "chunk_id": "chunk_pattern_owned_brand_margin_recovery_intervention_3_v1",
  "pattern_id": "pattern_owned_brand_margin_recovery",
  "topic_id": "topic_sku_rationalization",
  "chunk_type": "intervention",
  "position": 3,
  "sector": "retail",
  "sub_sector": "grocery",
  "capability_area": "margin_recovery",
  "tenant_id": null,
  "namespace": "global:patterns:retail",
  "version": "1.0.0",
  "content_hash": "sha256:8b4a...",
  "embedding_model": "voyage-3-large",
  "embedded_at": "2026-04-22T14:00:00Z"
}
```

For tenant-scoped observations:

```json
{
  "chunk_id": "obs_apex_retail_multichannel_forecasting_2026_narrative_v1",
  "observation_id": "obs_apex_retail_multichannel_forecasting_2026",
  "pattern_id": "pattern_demand_forecasting_inventory_ai",
  "chunk_type": "observation",
  "tenant_id": "tnt_apex_retail",
  "namespace": "client:tnt_apex_retail:observations",
  "is_composite": true,
  "redaction_level": "none",
  "sector": "retail",
  "embedding_model": "voyage-3-large"
}
```

### 4.3.4 · Namespace initialization script

```python
# scripts/init_pinecone_namespaces.py
from pinecone import Pinecone

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("abarva-intelligence")

# Pinecone namespaces are created on first upsert — no explicit create needed.
# This script seeds a "namespace_registered" marker vector per namespace for observability.

NAMESPACES = [
    "global:patterns",
    "global:patterns:healthcare",
    "global:patterns:retail",
    "global:patterns:financial_services",
    "global:patterns:energy",
    "ops:prompt_fragments",
    "ops:skill_packs",
]

for ns in NAMESPACES:
    index.upsert(
        vectors=[{
            "id": f"__namespace_seed__{ns}",
            "values": [0.0] * 1024,
            "metadata": {"namespace_seed": True, "namespace": ns}
        }],
        namespace=ns,
    )

print(f"Seeded {len(NAMESPACES)} namespaces.")
```

Tenant namespaces created on tenant provisioning by the Steward agent via the tenant onboarding workflow.

## 4.4 · Apache AGE Graph Initialization

### 4.4.1 · AGE extension setup

```sql
-- Requires PostgreSQL with Apache AGE extension compiled and loaded
CREATE EXTENSION IF NOT EXISTS age;
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Create the intelligence graph
SELECT create_graph('abarva_intelligence');

-- Confirm creation
SELECT * FROM ag_graph WHERE name = 'abarva_intelligence';
```

### 4.4.2 · Node and relationship types

| Node label | Key property | Description |
|---|---|---|
| Pattern | id | Pattern identity |
| Topic | id | Cross-pattern topic |
| Signal | id | Detection signal |
| DiagnosticQuestion | id | Diagnostic question |
| Intervention | id | Intervention |
| AntiPattern | id | Anti-pattern |
| Vendor | id | Vendor |
| RegulatoryFramework | id | Framework |
| Sector | id | Sector |
| Program | id | Operational program (Nexus) |
| Observation | id | Composite or tenant observation |
| Evidence | id | Evidence artifact |

| Relationship type | From → To | Notes |
|---|---|---|
| COVERS_TOPIC | Pattern → Topic | Which topics the pattern covers |
| HAS_SIGNAL | Pattern → Signal | (1..N) |
| HAS_DIAGNOSTIC | Pattern → DiagnosticQuestion | |
| HAS_INTERVENTION | Pattern → Intervention | |
| HAS_ANTIPATTERN | Pattern → AntiPattern | |
| APPEARS_IN | Vendor → Pattern | Vendor in pattern landscape |
| APPLIES_TO | RegulatoryFramework → Pattern / Sector | |
| APPLIES_TO | Pattern → Sector | |
| RELATED_TO | Pattern → Pattern | typed via property `relationship_type` |
| PARENT_OF / CHILD_OF | Pattern → Pattern | umbrella / child |
| COMPOSITE_OF | Pattern → Pattern | composition |
| VARIANT_OF | Pattern → Pattern | variant |
| OBSERVED_IN | Observation → Pattern | |
| EXECUTES | Program → Pattern | Active pattern in a program |
| EVIDENCES | Evidence → Observation | |

### 4.4.3 · Canonical seeding query

All pattern-pack Cypher in Parts 2-3 uses the `MERGE` pattern against the `abarva_intelligence` graph. Each pattern file is idempotent — running twice produces the same graph state.

Invocation shape under AGE:

```sql
SELECT * FROM cypher('abarva_intelligence', $$
  MERGE (p:Pattern {id: 'pattern_analytics_modernization'})
  ON CREATE SET p.name = 'Analytics Modernization',
                p.category = 'Data & Analytics',
                p.confidence_floor = 0.70
  RETURN p
$$) as (p agtype);
```

### 4.4.4 · Analogous-programs traversal (canonical maestro query)

The single most-used runtime query. Given a starting program and its detected pattern(s), find analogous programs with evidence and outcomes.

```sql
SELECT * FROM cypher('abarva_intelligence', $$
  MATCH (p:Program {id: $program_id})-[:EXECUTES]->(pat:Pattern)
  MATCH (analog:Observation)-[:OBSERVED_IN]->(pat)
  WHERE analog.is_composite = true OR analog.tenant_id = $tenant_id
  WITH pat, analog
  MATCH (analog)-[:EVIDENCES|HAS_EVIDENCE*0..1]->(ev:Evidence)
  RETURN pat.id AS pattern_id,
         analog.id AS observation_id,
         analog.title AS observation_title,
         analog.outcomes AS outcomes,
         collect(DISTINCT ev.label) AS evidence_labels
  ORDER BY analog.created_at DESC
  LIMIT 8
$$, #{program_id: 'prg_morrison_obmr', tenant_id: 'tnt_apex_retail'}) as (
  pattern_id agtype,
  observation_id agtype,
  observation_title agtype,
  outcomes agtype,
  evidence_labels agtype
);
```

### 4.4.5 · Migration to dedicated Neo4j

Trigger conditions (any one):
- p99 traversal latency exceeds 500ms for the analogous-programs query under production load.
- AGE CPU utilization exceeds 60% sustained over 7-day rolling window on production Postgres.
- Graph node count exceeds 10M or relationship count exceeds 100M.
- Cross-tenant traversal requirements emerge that AGE performance can't support.

Migration path:
1. Stand up Neo4j AuraDB or self-hosted cluster in parallel.
2. Stream graph mutations from Postgres triggers → Neo4j (CDC style) for 2-week burn-in.
3. Validate parity between AGE and Neo4j query results.
4. Cut traffic over in staged rollout.
5. Retain AGE as write-through until Neo4j primary is fully validated.
6. Retire AGE (optionally preserve Cypher-on-Postgres for smaller analytic queries).

Abstract graph access behind a `GraphClient` interface in the codebase so the migration is a driver swap, not an application rewrite.

## 4.5 · Sync Worker Architecture

Ensures Postgres, Pinecone, and AGE stay coherent.

### 4.5.1 · Write path invariants

1. All intelligence content authored in Postgres (source of truth).
2. Changes to `intel_retrieval_chunks.content` trigger re-embedding.
3. Graph node/relationship changes are derived from Postgres changes and idempotently applied to AGE / Neo4j.

### 4.5.2 · Change-capture strategy

Postgres logical replication slot feeds a sync worker (`intel-sync-worker`) running as a separate process. The worker:

1. Subscribes to changes on `intel_patterns`, `intel_retrieval_chunks`, `intel_pattern_relationships`, `intel_pattern_vendors`, `intel_pattern_frameworks`, `intel_pattern_sectors`, `intel_observations`.
2. For chunk changes, computes new embeddings (with hash comparison to skip no-ops), upserts to Pinecone with metadata, updates `intel_retrieval_chunks.last_embedded_at` and `pinecone_vector_id`.
3. For relational graph-impacting changes, generates Cypher MERGE statements and applies to AGE / Neo4j.
4. Emits sync metrics to observability: sync lag, embedding batch size, embedding cost, graph mutation count.

### 4.5.3 · Reconciliation

Weekly reconciliation job compares Postgres state of truth against Pinecone and AGE state. Discrepancies trigger targeted reindex / re-sync for affected rows.

```python
# scripts/reconcile_intelligence.py (pseudocode)
for chunk in pg.query("SELECT id, content_hash, pinecone_vector_id FROM intel_retrieval_chunks"):
    vec = pinecone_fetch(chunk.id, namespace=chunk.pinecone_namespace)
    if vec is None or vec.metadata.get("content_hash") != chunk.content_hash:
        enqueue_reembed(chunk.id)
```

## 4.6 · Migration From Existing AbarVa State

Current AbarVa production (`nexus-vert-kappa.vercel.app`) already has operational data: programs, engagements, tenants, vendor facts, observations captured earlier. Migration from current state to the intelligence-layer schema is incremental.

### 4.6.1 · Phase 1 — Additive schemas

Create all `intel_*` tables additively. No changes to existing operational tables. Intelligence tables reference existing `programs`, `tenants`, etc. through optional FK columns.

### 4.6.2 · Phase 2 — Content seeding

Seed `intel_patterns`, `intel_topics`, `intel_signals`, `intel_interventions`, `intel_antipatterns`, `intel_vendors`, `intel_regulatory_frameworks`, `intel_pattern_relationships` from the 13 patterns defined in Parts 2-3. Seed scripts derive content from the pattern-pack markdown files via a deterministic parser that:

1. Reads pattern YAML front-matter.
2. Parses Part C (signals), Part D (diagnostic), Part F (interventions), Part G (anti-patterns).
3. Parses Part H (vendors) into `intel_vendors` + `intel_pattern_vendors`.
4. Parses Part I (regulatory) into `intel_regulatory_frameworks` + `intel_pattern_frameworks`.
5. Emits content chunks into `intel_retrieval_chunks` per Part P chunking schema.
6. Emits graph seed Cypher from Part O into AGE via transaction.

### 4.6.3 · Phase 3 — Observation migration

Lift existing observations captured in prior program notes, benchmark cards, and curated memo content into `intel_observations` with appropriate composite labeling. Tag with `pattern_id`, `is_composite = true`, and `redaction_level` as appropriate.

### 4.6.4 · Phase 4 — Operational integration

Wire the four agents (Nexus / Sentinel / Atlas / Steward) to query the intelligence layer:

- Nexus uses detection + injection libraries on program intake / execution.
- Sentinel drives the intelligence surfaces (`/intelligence/patterns/*`).
- Atlas consumes analogous-programs traversals for portfolio roll-ups.
- Steward operates the sync worker, reconciliation, and tenant namespace provisioning.

### 4.6.5 · Migration scripts (directory layout)

```
infra/
  postgres/
    migrations/
      0001_intel_core_tables.sql
      0002_intel_signals_interventions.sql
      0003_intel_vendors_frameworks.sql
      0004_intel_observations_evidence.sql
      0005_intel_retrieval_chunks.sql
      0006_intel_prompt_fragments.sql
      0007_intel_runtime_audit.sql
      0008_intel_rls_policies.sql
      0009_age_extension_bootstrap.sql
  pinecone/
    scripts/
      init_pinecone_namespaces.py
      reembed_pattern.py
      reconcile_pinecone.py
  graph/
    scripts/
      seed_graph_from_patterns.py
      migrate_age_to_neo4j.py
content/
  patterns/           # one file per pattern, matches Part 2/3 layout
  vendors/
  frameworks/
  observations/
  prompts/
    detection/
    injection/
    diagnostic/
    rendering/
sync/
  intel-sync-worker/  # long-running Node/Python process
  reconcile/
```

## 4.7 · Observability

| Signal | Where | Threshold |
|---|---|---|
| Pattern detection p50 / p95 / p99 latency | `intel_detection_runs.latency_ms` | p99 < 1200ms |
| Retrieval p99 latency | `intel_retrieval_calls.latency_ms` | p99 < 400ms |
| Sync worker lag | worker metric | < 30s |
| Embedding backlog size | worker metric | < 500 items |
| Reconciliation drift | weekly job | zero unexplained drift |
| Graph traversal p99 (AGE) | AGE metrics | <500ms → migrate to Neo4j |
| Pinecone index storage | Pinecone | budget: 2GB at seed, 20GB at Series A |

## 4.8 · Summary

- Postgres is the source of truth for patterns, observations, and chunk inventory.
- Pinecone stores semantic chunks in disciplined namespaces with consistent metadata.
- Apache AGE provides graph traversal on the same Postgres instance for v1, with a clear migration trigger and path to Neo4j.
- A dedicated sync worker keeps the three stores coherent.
- RLS enforces tenant boundaries on tenant-scoped tables.
- All pattern content authored in markdown maps through a deterministic parser into the three stores.

---

*End of Part 4 · Persistence Design*

*Next in file sequence: `15-operationalization.md` — Part 5 Operationalization*

---
