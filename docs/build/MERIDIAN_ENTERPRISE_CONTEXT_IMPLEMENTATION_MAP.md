# Meridian Enterprise Context Layer - Phase 0 Implementation Map

Status: Phase 0 audit complete. This is an implementation map only; no runtime code has been changed in this slice.

## Scope

Build a client-internal enterprise context layer for Meridian Health. The layer covers org, decision rights, systems, CMDB, vendors, contracts, spend, policies, incidents, problems, changes, initiatives, data domains, risks, evidence, freshness, and stewardship. It intentionally excludes industry research and external market insight.

## Existing Substrate To Reuse

### Canonical Meridian facts

- `src/data/meridian/index.ts`
- `src/data/meridian/*.ts`

These files are the current deterministic Meridian fact base. New synthetic enterprise data should align with the existing facts: Meridian Health System, healthcare IDN, Epic core, revenue-cycle, contact center, cloud, research operations, payer/plan, AI governance, and internal decision structures.

### Persisted setup/data layer

- `supabase/migrations/20260430121500_apex_setup_data_layer.sql`
- `supabase/migrations/20260430130000_enterprise_context_chunks_embedding.sql`
- `src/lib/knowledge/tenant-data/*`
- `src/lib/knowledge/context-broker/*`
- `src/lib/knowledge/agent-context-broker.ts`
- `src/lib/admin/setup-data-broker.ts`
- `src/lib/intelligence/persistence.ts`

The existing layer already provides tenant-scoped segment rollups, raw records, graph nodes, graph edges, context chunks, audit log, ingestion runs, and embedding status. Do not replace it. Extend it with explicit source/fact/evidence/quality/stewardship/snapshot tables.

### Existing Meridian setup scripts

- `src/scripts/setup-data/load-meridian-setup-data.ts`
- `src/scripts/setup-data/verify-meridian-setup-data.ts`
- `src/scripts/setup-data/seed-meridian-research-data.ts`
- `src/scripts/setup-data/refresh-meridian-npsr.ts`

The current Meridian loader parses markdown, CSV, and JSON from a `meridian-data` source root, builds records, graph nodes/edges, and chunks, and upserts into the setup/data tables. It should be upgraded or wrapped by the new Excel/template pipeline rather than discarded.

### Existing tests to extend

- `src/lib/knowledge/tenant-data/__tests__/supabase-adapter.test.ts`
- `src/lib/knowledge/tenant-data/__tests__/mapper.test.ts`
- `src/lib/knowledge/tenant-data/__tests__/graph-traversal.test.ts`
- `src/lib/knowledge/__tests__/agent-context-broker-tenant-data-integration.test.ts`
- `src/lib/admin/__tests__/setup-data-broker.test.ts`
- `src/__tests__/integration/tenants/demo-tenant-data-tiers.test.ts`

## Key Findings

1. The current data layer is record-centric. The requested operating model needs a fact-centric layer around it: durable facts, evidence pointers, freshness, validation, quality issues, stewardship tasks, and snapshots.
2. The current `enterprise_context_chunks` table already supports chunk text, provenance JSON, embedding status, and optional inline embedding fields. Phase 5 should extend metadata and queue semantics, not create a second chunk table unless unavoidable.
3. Tenant identity needs careful normalization. Product client key is `meridian`; older setup data scripts use `meridian-health`. The new layer should store canonical `tenant_key = 'meridian'` and preserve source aliases in metadata. Loaders should read both when verifying existing data.
4. Existing setup/admin read models already expose segment coverage and chunk counts. Phase 8 stewardship should extend those models with quality and validation queues.
5. `exceljs` and `papaparse` are already available. Use `exceljs` for Day One template generation and parsing.
6. No PHI is needed. Incident/problem/change examples should use system, service, facility, support group, and operational metadata only.

## Phase 1 Schema Additions

Add a migration such as `supabase/migrations/20260514100000_meridian_enterprise_context_layer.sql`.

Create additive tables:

- `enterprise_context_sources`
- `enterprise_context_source_files`
- `enterprise_context_records`
- `enterprise_context_facts`
- `enterprise_context_relationships`
- `enterprise_context_evidence`
- `enterprise_context_quality_issues`
- `enterprise_context_stewardship_tasks`
- `enterprise_context_snapshots`
- `enterprise_context_template_runs`
- `enterprise_context_chunk_queue` if current `enterprise_context_chunks.embedding_status` is not enough for refresh orchestration

Required common fields:

- `client_id`
- `tenant_key`
- `source_system`
- `source_record_id`
- `source_file`
- `source_sheet`
- `source_row_number`
- `owner`
- `last_synced_at`
- `last_validated_at`
- `confidence`
- `freshness_status`
- `evidence_pointer`
- `state` or `lifecycle_state` with active/superseded/inactive semantics
- `created_at`
- `updated_at`

RLS should use existing helpers from `20260507100000_rls_role_helpers.sql`: `can_read_tenant_by_key`, `can_write_tenant_by_key`, and service-role full access.

## Phase 2 Template Artifacts

Create:

- `src/scripts/enterprise-context/generate-meridian-enterprise-context-templates.ts`
- `src/lib/enterprise-context/template-schema.ts`
- `docs/enterprise-context/templates/meridian/day-one/*.xlsx`
- `docs/enterprise-context/templates/meridian/manifest.json`

Generate 15 workbooks:

1. Org + Decision Rights
2. Facilities + Business Units
3. CMDB Applications + Services
4. CI Relationships / Dependencies
5. Vendors + Contract Inventory
6. Renewal Calendar
7. Spend Baseline
8. Policies + Procedures
9. Incidents
10. Problems
11. Changes
12. SLAs
13. Initiative Portfolio
14. Data Domains + Stewardship
15. Risk + Compliance Register

Each workbook must include instructions, dictionary, required fields, example row format, source system, source owner, last validated date, confidence, evidence usable flag, and notes/gaps.

## Phase 2.5 Synthetic Data

Create deterministic synthetic data with stable IDs:

- `src/scripts/enterprise-context/generate-meridian-synthetic-enterprise-context.ts`
- `docs/enterprise-context/synthetic/meridian/*.xlsx`
- `docs/enterprise-context/synthetic/meridian/*.csv`
- `docs/enterprise-context/synthetic/meridian/manifest.json`

Use seeded generation. Cross-template references must resolve across systems, services, facilities, vendors, contracts, incidents, problems, changes, policies, initiatives, data domains, and risks.

## Phase 3 Ingestion

Create:

- `src/scripts/enterprise-context/load-meridian-enterprise-context.ts`
- `src/scripts/enterprise-context/verify-meridian-enterprise-context.ts`
- `src/lib/enterprise-context/ingestion/*`
- parser, validator, resolver, quality-rule, and upsert modules

Behavior:

- dry run by default
- `--apply` writes to DB
- idempotent upserts
- tenant scoped
- workbook/sheet/row-level validation errors
- duplicate detection
- relationship resolution
- provenance preserved
- quality issues emitted for missing, stale, and conflicting data

## Phase 4 Refresh Simulation

Create:

- `src/scripts/enterprise-context/generate-meridian-enterprise-context-refresh.ts`
- `docs/enterprise-context/synthetic/meridian-refresh/week-0`
- `docs/enterprise-context/synthetic/meridian-refresh/week-1`
- `docs/enterprise-context/synthetic/meridian-refresh/month-1`

The refresh loader should detect new, changed, superseded, and inactive facts while preserving history and creating stewardship tasks.

## Phase 5 Retrieval And Chunking

Extend:

- `src/lib/knowledge/tenant-data/types.ts`
- `src/lib/knowledge/tenant-data/supabase-adapter.ts`
- `src/lib/knowledge/context-broker/broker.ts`
- `src/lib/intelligence/persistence.ts`
- `src/scripts/embed-pending-chunks.ts` only if queue semantics require it

Requirements:

- structured records remain queryable
- long policy/procedure/contract text chunks preserve tenant, source, record type, owner, freshness, confidence, citation
- superseded chunks marked inactive
- retrieval filters by domain, source, freshness, confidence
- vector pending state remains honest when embeddings are absent

## Phase 6 UI Surface

Before UI edits, read the relevant Next.js 16 docs in `node_modules/next/dist/docs/`.

Likely files:

- `src/app/(maestro)/intelligence/...`
- `src/components/intelligence-v3/...`
- `src/lib/admin/setup-data-broker.ts` or a new `src/lib/enterprise-context/read-model.ts`

Add Enterprise Context under Intelligence. Lead with executive insight cards, not raw tables.

## Phase 7 Product Integration

Source:

- `src/lib/source/context-builder.ts`
- `src/lib/source/adapters/*`
- `src/lib/source/source-answer-engine.ts`

Moves:

- `src/lib/programs/programs-broker-adapter.ts`
- `src/lib/programs/nexus-current-state-briefing.ts`
- phase/gate validation modules

Tower:

- Tower read models and risk/dependency surfaces

The integration should consume the broker/read-model layer, not query the new tables directly from page components.

## Phase 8 Stewardship

Add read models, tests, and documentation for:

- coverage by domain
- stale records
- missing owners
- last sync status
- confidence distribution
- validation queue
- system-of-record mapping
- Day One template onboarding
- Day Two sync model
- stewardship responsibilities
- limitations and confidence model

## PR Slice Plan

1. `codex/meridian-context-phase0`: this implementation map.
2. `codex/meridian-context-schema`: migration, TypeScript contracts, schema tests.
3. `codex/meridian-context-templates`: blank Day One workbook generator and schema tests.
4. `codex/meridian-context-synthetic`: deterministic synthetic dataset generator, populated workbooks, manifest, integrity tests.
5. `codex/meridian-context-ingestion`: loader, verifier, dry-run/apply path, parser and idempotency tests.
6. `codex/meridian-context-refresh`: weekly/monthly refresh generator, diff reports, stewardship task generation tests.
7. `codex/meridian-context-retrieval`: chunk/evidence/retrieval filters and broker tests.
8. `codex/meridian-context-intelligence-ui`: Intelligence Enterprise Context surface and UI tests.
9. `codex/meridian-context-product-wiring`: Source/Moves/Tower integration and behavior tests.
10. `codex/meridian-context-stewardship`: stewardship dashboards/docs/final verification.

## Validation Baseline

For non-UI slices:

- `npx eslint src/`
- focused Jest tests for touched modules
- focused TypeScript check for new scripts when useful

For migration slices:

- static SQL checks
- type/contract tests
- dry-run migration command where environment permits

For UI slices:

- read relevant Next.js 16 docs first
- `npx eslint src/`
- `npx tsc --noEmit`
- focused route/UI tests
- `npm run integrity:dom`
- browser/production verification after merge if deployed
