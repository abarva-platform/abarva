# Knowledge Layer Inventory
**Audit date:** 2026-05-05  
**Branch:** `claude/laughing-kare-a04314`  
**Method:** Static file inspection. Line numbers are approximate (may drift with edits).  
**Scope:** Pattern fabric, phase packs, failure modes, context broker, archetype primers, corpus, classifiers, manifests, migrations, SQL tables.

---

## Layer 1 · Phase Intelligence (Programs Module)

### 1.1 Phase Labels & Constants
| File | Key exports | Notes |
|------|------------|-------|
| `src/lib/programs/phase-labels.ts:1` | `PHASE_LABELS`, `PHASE_LABELS_SHORT`, `PHASE_CODES`, `TOTAL_PHASES=6`, `getPhaseLabel()`, `getPhaseLabelShort()` | Canonical doctrine source; all 6-phase surface code must import from here |

### 1.2 Phase Packs
| File | Phase | Label | Has `steps[]` | Line count (approx) |
|------|-------|-------|--------------|---------------------|
| `src/lib/programs/phase-packs/P0_originate.ts` | 0 | P0 Originate | Yes | ~280 |
| `src/lib/programs/phase-packs/P1_discovery.ts` | 1 | P1 Charter | Yes | ~300 |
| `src/lib/programs/phase-packs/P2_synthesis.ts` | 2 | P2 Discover & Diagnose | Yes | ~310 |
| `src/lib/programs/phase-packs/P3_design.ts` | 3 | P3 Design Future State | **No** (GAP-P1-1) | ~260 |
| `src/lib/programs/phase-packs/P4_build.ts` | 4 | P4 Roadmap & Business Case | **No** (GAP-P1-1) | ~270 |
| `src/lib/programs/phase-packs/P5_activate.ts` | 5 | P5 Mobilize & Handoff | Yes | ~290 |

**Registry:** `src/lib/programs/phase-packs/index.ts` — exports `getPhasePack(phase)`, `getAllPhasePacks()`, `formatPhasePackForPrompt()`. PACKS map covers 0–5; `phase > 5` returns null.

**Types:** `src/lib/programs/phase-packs/types.ts` — `PhaseNumber = 0|1|2|3|4|5`, `PhasePack`, `PhaseStep`, `PhaseEvidenceItem`, `PhaseQuestion`, `PhaseAntiPattern`, `PhaseCoachingArc`, `PhaseDependencies`.

### 1.3 Phase Pack Tests
| Test file | What it covers |
|-----------|---------------|
| `__tests__/P0_originate.test.ts` | P0 label, steps, gate criteria |
| `__tests__/P1_discovery.test.ts` | P1 Charter label, evidence items |
| `__tests__/P2_synthesis.test.ts` | P2 Discover & Diagnose label |
| `__tests__/P3_design.test.ts` | P3 design coverage |
| `__tests__/P4_build.test.ts` | P4 Roadmap & Business Case label |
| `__tests__/P5_activate.test.ts` | P5 Mobilize & Handoff label, outcome |
| `__tests__/phase-packs.test.ts` | Registry: all packs present, labels, `getPhasePack(6) === null` |
| `__tests__/evidence-binding.test.ts` | Phase advance loop covers 0–5 |
| `__tests__/failure-mode-tags.test.ts` | FM tag coverage per pack (P6 removed) |
| `__tests__/types.test.ts` | `PhaseNumber` type, `PHASES_WITH_STEPS` set |

### 1.4 Governance Gates
| File | Key exports | Gate count |
|------|------------|-----------|
| `src/lib/programs/governance.ts:1` | `GATE_RULES` (5 transitions P0→P5), `findGateRule()`, `evaluateGate()` | 5 hard transitions; `findGateRule(5,6) === null` |

Gate check keys (hard/soft) per transition — full detail in `governance.ts:63–165`.

---

## Layer 2 · Failure Mode Catalogs

### 2.1 Programs Module Catalog
| File | IDs | Type | Used by |
|------|-----|------|---------|
| `src/lib/programs/failure-modes.ts:1` | 1–10 (integer) | `FailureMode` with `primaryPhases[]`, `researchAnchors`, `preventionMechanism` | `failure-mode-prompt.ts`, phase pack anti-patterns, gate evaluators |

Exports: `FAILURE_MODES`, `getFailureModesForPhase(phase: 0..5)`.

**10 failure modes:**
1. Lack of exec sponsorship — phases [0]
2. Unclear problem — phases [0, 2]
3. Data foundation — phases [1, 2]
4. Talent gap — phases [0, 1]
5. Operating model — phases [3, 5]
6. Workflow integration — phases [3, 5]
7. Tool-first thinking — phases [3] *(not explicit in programs catalog; in intelligence catalog)*
8. Governance/risk — phases [2, 3]
9. Value measurement — phases [1, 5]
10. Post-handoff accountability — phases [0, 5]

### 2.2 Intelligence Module Catalog
| File | Keys | Type | Used by |
|------|------|------|---------|
| `src/lib/intelligence/ai-program-failure-modes.ts:1` | 12 string keys | `AiProgramFailureMode` with `phaseWhereDetected[]`, `gateImplication`, `primaryAgent`, `deliverableImplication` | Sentinel, intelligence surfaces, `detection-rules.ts` |

12 failure modes (string keys): `weak_data_foundation`, `poor_use_case_framing`, `no_business_owner`, `no_measurable_baseline`, `no_value_ledger`, `weak_workflow_integration`, `tool_first_thinking`, `missing_governance_risk`, `no_adoption_change_plan`, `no_operating_model_for_scale`, `pilot_purgatory`, `ai_tool_sprawl_without_value`.

**Reconciliation status:** NOT reconciled with programs catalog. See GAP-P0-1.

### 2.3 Failure Mode Prompt Assembly
| File | What it does |
|------|-------------|
| `src/lib/programs/failure-mode-prompt.ts` | Assembles programs catalog FMs into a doctrine block for Nexus system prompt. Phase-filtered. Char ceiling: 3000 (currently ~2940 chars after trim in PR #1523). |

### 2.4 Failure Mode Telemetry
| File | What it does |
|------|-------------|
| `src/lib/programs/failure-mode-telemetry.ts` | Defines telemetry schema for FM detection events. Not yet wired to anti-pattern detection in chat (GAP-P2-3). |

---

## Layer 3 · Archetype Primers (Pattern Bundle)

### 3.1 Registered Primers
| Pattern ID | Display name | File | Approx lines |
|-----------|-------------|------|-------------|
| PAT-PRG-CDP-001 | CDP Activation | `archetype-primers/PAT-PRG-CDP-001.ts` | 269 |
| PAT-PRG-CC-AI-001 | Contact Center AI | `archetype-primers/PAT-PRG-CC-AI-001.ts` | ~240 |
| PAT-PRG-DATA-FAB-001 | Demand Forecasting | `archetype-primers/PAT-PRG-DATA-FAB-001.ts` | ~230 |
| PAT-PRG-COPILOT-001 | M365 Copilot | `archetype-primers/PAT-PRG-COPILOT-001.ts` | ~220 |
| PAT-PRG-AI-CODING-001 | AI Coding | `archetype-primers/PAT-PRG-AI-CODING-001.ts` | ~210 |
| PAT-PRG-LOYALTY-001 | Loyalty AI | `archetype-primers/PAT-PRG-LOYALTY-001.ts` | ~230 |

**Registry:** `src/lib/programs/archetype-primers/index.ts:1` — `PRIMERS` array (6 entries), `getArchetypePrimer(patternId)`, `listArchetypePrimers()`.

**Types:** `src/lib/programs/archetype-primers/types.ts` — `ArchetypePrimer`, `PrimerSME`, `PrimerTemplate`, `PrimerWorkshop`, `PrimerDataAsset`, `PrimerEngagementWindow`, `PrimerPrepItem`.

**Missing primers (GAP-P0-3):** PLATFORM MODERNIZATION, SUPPLY CHAIN AI, PRICING AI, STORE OPERATIONS AI.

### 3.2 Primer Tests
| Test file | Primer |
|-----------|--------|
| `__tests__/cdp-primer.test.ts` | CDP Activation |
| `__tests__/cc-ai-primer.test.ts` | Contact Center AI |
| `__tests__/forecast-primer.test.ts` | Demand Forecasting |
| `__tests__/copilot-primer.test.ts` | M365 Copilot |
| `__tests__/ai-coding-primer.test.ts` | AI Coding |
| `__tests__/loyalty-primer.test.ts` | Loyalty AI |
| `__tests__/render-html.test.ts` | HTML rendering for primer sections |

---

## Layer 4 · Pattern Fabric (Intelligence Module)

### 4.1 Seed Pattern Files
| File | Domain | Approx patterns |
|------|--------|----------------|
| `src/lib/intelligence/seed-patterns-ai-programs.ts` | AI Programs lifecycle | ~8 |
| `src/lib/intelligence/seed-patterns-sourcing.ts` | Sourcing lifecycle | ~10 |
| `src/lib/intelligence/seed-patterns-sourcing-process.ts` | Source process detail | ~6 |
| `src/lib/intelligence/seed-patterns-sourcing-categories.ts` | Category-specific sourcing | ~8 |
| `src/lib/intelligence/seed-patterns-sourcing-vendors-acquia.ts` | Acquia vendor pattern | ~2 |
| `src/lib/intelligence/program-lifecycle-patterns.ts` | Program lifecycle | ~5 |
| `src/lib/intelligence/source-lifecycle-patterns.ts` | Source stage lifecycle (AMS, etc.) | ~3 patterns × 10 stages |

**Types:** `src/lib/intelligence/seed-types.ts` — `PatternDomain`, `PatternTier`, `PatternStatus`, `SourcingCategory`, `VendorClass`, `LifecyclePatternSeed`, `LifecycleStage`, `GateCriterion`, `ExpectedArtifact`, `ContradictionTemplate`, `FailureMode`, `IndustryVariant`.

### 4.2 Pattern Manifest
| File | Generated at | Pattern count |
|------|-------------|--------------|
| `src/lib/intelligence/generated/pattern-manifest.json` | 2026-04-23T16:43:24Z | 17 |

Manifest is generated; no CI validator confirms it matches registered primers. See GAP-P1-4.

### 4.3 Intelligence Ask Retrievers
| File | Retriever type |
|------|---------------|
| `src/lib/intelligence/ask/retrievers/knowledge.ts` | Genome/worldview corpus retrieval |
| `src/lib/intelligence/ask/retrievers/pattern.ts` | Pattern pack retrieval |
| `src/lib/intelligence/ask/retrievers/vendor.ts` | Vendor landscape retrieval |
| `src/lib/intelligence/ask/retrievers/worldview.ts` | Cross-industry worldview retrieval |

---

## Layer 5 · Context Broker

### 5.1 Broker Core
| File | Role |
|------|------|
| `src/lib/knowledge/agent-context-broker.ts` | Main broker: `buildEnterpriseAgentContextBundle()`, `buildEnterpriseAgentContextBundleAsync()`. Domains: `people`, `programs`, `worldview`, `industry`. |
| `src/lib/knowledge/context-broker/broker.ts` | Lower-level broker: Pinecone + graph + worldview retrieval |
| `src/lib/knowledge/context-broker/types.ts` | `BrokerRequest`, `BrokerBundle`, domain types |
| `src/lib/knowledge/context-broker/mode-inference.ts` | Infers broker mode from surface and agent |
| `src/lib/knowledge/context-broker/worldview-retrieval.ts` | Worldview corpus retrieval |

### 5.2 Data Room
| File | Role |
|------|------|
| `src/lib/knowledge/enterprise-data-room.ts` | Fixture-based data room (all tenants in-memory) |
| `src/lib/knowledge/enterprise-data-room-persistence.ts` | Supabase-backed persistence layer |
| `src/lib/knowledge/private-data-plane/registry.ts` | Registry of tenant-specific adapters |

**Tenant adapter status:**
- Apex Retail adapter: **not authored** (GAP-P1-5). Data loaded 2026-04-30 into Supabase.
- Meridian adapter: loaded 2026-05-01 (per MEMORY). Adapter status unverified.
- Fixture fallback: active for all tenants without adapters.

### 5.3 Programs Broker Adapter
| File | Exports |
|------|---------|
| `src/lib/programs/programs-broker-adapter.ts` | `buildProgramsContextBundle()`, `buildProgramsContextBundleAsync()`, `formatProgramsContextBlock()` |

Default broker request includes: `tenantKey`, `programId`, `agentName`, `surface='programs'`. Phase pack is **not** included. See GAP-P1-3.

### 5.4 Tenant Data Layer
| File | Role |
|------|------|
| `src/lib/knowledge/tenant-data/adapter.ts` | Adapter interface |
| `src/lib/knowledge/tenant-data/supabase-adapter.ts` | Reads from Supabase: segments, nodes, edges |
| `src/lib/knowledge/tenant-data/stub-adapter.ts` | In-memory stub for tests |
| `src/lib/knowledge/tenant-data/graph-traversal.ts` | Graph neighbor traversal |
| `src/lib/knowledge/tenant-data/mapper.ts` | Maps Supabase rows to broker bundle fields |
| `src/lib/knowledge/tenant-data/types.ts` | `TenantDataBundle`, `TenantSegment`, `TenantNode`, `TenantEdge` |

---

## Layer 6 · Worldview Corpus

### 6.1 Knowledge Data Files (scripts/knowledge-data/)
| Directory | Files | Domain |
|-----------|-------|--------|
| `genome/` | 20 `.txt` files | Cross-industry: AI failure patterns, ROI benchmarks, data readiness, governance, cloud, leadership |
| `retail/` | 20 `.txt` files | Retail: cloud infra, AI use cases, SAP migration, CDP, demand forecasting, supply chain, pricing |
| `healthcare/` | 20 `.txt` files | Healthcare: RCM, EHR, AI ROI, data platform, vendor landscape, workforce |
| `finserv/` | 20 `.txt` files | Financial services: asset management, AI portfolio, regulatory, ESG, banking modernisation |

**Total:** 80 `.txt` knowledge files. Ingestion script: `scripts/ingest-knowledge.ts`.

### 6.2 Worldview Files
| Directory | Purpose |
|-----------|---------|
| `worldview/` | Processed worldview exports (README present) |
| `scripts/worldview/build-worldview-exports.mjs` | Builds worldview export files |
| `scripts/worldview/validate-worldview.mjs` | Validates worldview integrity |

---

## Layer 7 · Classifier

| File | Role |
|------|------|
| `src/lib/programs/classifier.ts` | Pattern match classifier — matches a program description to an archetype primer key |
| `src/lib/intelligence/ask/classifier.ts` | Intelligence ask classifier — routes ask to retriever type |

---

## Layer 8 · Database Tables (Supabase Migrations)

### Programs surface tables
| Table | Migration file | Key columns |
|-------|---------------|-------------|
| `engagements` | `20260503113000_strategic_moves_schema_v02.sql` | `current_phase` (0–5 after remap), `status`, `client_id`, `archetype` |
| `engagement_participants` | base schema | `role`, `person_id`, `engagement_id` |
| `engagement_topics` | base schema | `topic_key`, `key_patterns[]`, `industries[]`, `deployment_count` |
| `engagement_topics_map` | base schema | topic↔engagement join |
| `deliverable_types` | `20260502043000_program_lifecycle_deliverable_types.sql` | `applicable_phases[]`, `name` |
| `engagement_deliverables` / `engagement_deliverable_items` | delivery schema | deliverable tracking |
| `program_evidence_items` | `20260501120000_program_evidence_items.sql` | append-only evidence ledger |
| `program_threads` | programs schema | Nexus thread lifecycle: `phase_number`, `mode`, `state` |
| `program_audit_log` | `audit-log.ts` migration | immutable audit events |
| `founder_approval_requests` | governance schema | gate approvals |
| `move_artifact_index` | `20260504232000_move_artifact_index_view.sql` | materialized view of artifacts per move |

### 6-phase remap migration
| Migration | What it does |
|-----------|-------------|
| `20260505000000_strategic_moves_six_phase_remap.sql` | Remaps any `current_phase > 5` to `5`; updates `deliverable_types.applicable_phases` to remove values > 5 |

### Pattern / intelligence tables
| Table | Purpose |
|-------|---------|
| `pattern_packs` | Tenant-specific pattern packs |
| `foundational_pattern_packs` | Cross-industry foundational patterns |
| `foundational_pattern_variants` | Variants by industry/vertical |
| `genome_patterns` | Genome-layer patterns with confidence scores |
| `signal_catalog` | Signal keys with recommended pattern keys |
| `emergent_patterns` | Dynamically derived patterns by industry/tier |
| `pattern_match_logs` | Classifier usage telemetry |

### Source tables
| Table | Migration |
|-------|-----------|
| `source_events` | base source schema |
| `source_artifacts` | `20260502122500_source_value_ledger_artifact_family.sql` |
| Source access control | `20260501170000_source_access_control.sql` |

---

## Layer 9 · Archetype Normalization

| File | Role |
|------|------|
| `src/lib/programs/archetype-normalization.ts` | Normalizes freetext archetype strings to canonical primer keys. Used during program creation. |

---

## Layer 10 · Source Lifecycle Patterns (unaligned)

| File | Patterns | Stages |
|------|----------|--------|
| `src/lib/intelligence/source-lifecycle-patterns.ts` | AMS (10 stages), additional patterns | Plan, RFI, Shortlist, RFP, Q&A, Initial-Bid, BAFO, Selection, Award, Onboard |

**Alignment status:** NOT mapped to P0–P5 phase model. See GAP-P0-2.
