# Knowledge Layer Inventory · 2026-05-05

| Field    | Value |
|----------|-------|
| Date     | 2026-05-05 |
| Status   | Design pack · read-only |
| Predecessor | `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md` (2026-04-29) — 198 primitives, pre-doctrine |
| Doctrine delta | 6-phase Strategic Moves locked 2026-05-05; this doc reflects post-doctrine state |

## What changed since the 2026-04-29 audit

| Area | Then (2026-04-29) | Now (2026-05-05) | Impact |
|------|-------------------|------------------|--------|
| Phase model | 8 phases P0-P7 | 6 phases P0-P5 per doctrine | Phase packs, failure modes, gate rules all need rewrite (see gap backlog) |
| Gate rules | P0→P1, P2→P3, P3→P4, P4→P5, P5→P6 (missing P1→P2) | P0→P1, P1→P2, P2→P3, P3→P4, P4→P5 (in PR #1517, not yet on main) | P5→P6 retired; P1→P2 added |
| Strategic Moves substrate | Not present | `move_artifact_index` VIEW, substrate v2, wave-3 artifact spine (PRs #1505–#1514) | New SQL views and data layer for Move surface |
| Knowledge layer audit doc | Not present | `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md` | Baseline for this inventory |
| Corpus count | ~109 (old) → 198 (confirmed 2026-04-29) | 198 primitives (149p + 30s + 9sol + 10c); count unchanged | Corpus stable |
| AI program failure modes | 10-id catalog only | 10-id catalog + 12-key catalog (both exist, unreconciled — GAP-3) | Two catalogs now in flight |

## Layer 1 · SQL substrate

### Core data model
| Table | Migration file | Purpose |
|-------|---------------|---------|
| `genome_patterns` | `001_three_layer_data_model.sql` | Layer-3 Genome store. `pattern_type`, `vertical`, `data jsonb`, `confidence`, `source_count`. |
| `engagement_topics` | `040_topics.sql` | Programs pattern/topic catalog. `topic_key`, `key_patterns[]`, `industries`, `playbooks`, `failure_modes`. |
| `engagement_topics_map` | `040_topics.sql` | M2M engagement ↔ topic. |
| `pattern_match_logs` | `041_programs_foundation.sql` | Classifier telemetry. `pattern_key`, `match_confidence`, `match_context_jsonb`. |
| `engagement_topics` extensions | `041_programs_foundation.sql` | Adds `promotion_state`, `deployment_count`, `successful_deployment_count`, `canonical_shape_json` to `engagement_topics`. |

### Intelligence / pattern surface
| Table | Migration file | Purpose |
|-------|---------------|---------|
| `pattern_packs` | `20260421152501_intelligence_layer_core.sql` | Tenant-scoped. `sector_applicability[]`, `trigger_symptoms[]`, `detection_signals jsonb`, `diagnostic_questions[]`, `evidence_requirements jsonb`, `likely_root_causes jsonb`, `intervention_options jsonb`, `anti_patterns jsonb`, `common_failure_modes jsonb`, `confidence_level`, `version`, `last_updated`. **Jsonb fields have no published TypeScript schema — see GAP-4.** |
| `foundational_pattern_packs` | `20260421152901_foundational_patterns_and_legal_contexts.sql` | Cross-tenant foundational patterns. |
| `foundational_pattern_variants` | `20260421152901_foundational_patterns_and_legal_contexts.sql` | Variants per foundational pattern. |
| `emergent_patterns` | `20260420170400_emergent_patterns.sql` | Cohort aggregates. `pattern_key`, `industry`, `tier`, `aggregate_outcomes_jsonb`. |
| `signal_catalog` | `20260421151100_signal_catalog.sql` | `recommended_pattern_keys[]` — signal-to-pattern recommendations. |

### Retrieval + source artifact cross-references
| Column | Migration file | Purpose |
|--------|---------------|---------|
| `intelligence_*.retrieved_pattern_ids[]`, `cited_pattern_ids[]` | `20260430103000_intelligence_surface_data_layer.sql` | Pattern provenance on Intelligence artifacts. |
| `source_artifacts.used_pattern_ids[]` | `20260430220000_source_artifact_registry.sql` | Pattern IDs used by Source surface artifacts. |
| `reasoning_telemetry_events.pattern_id` | `20260428180000_reasoning_telemetry_events.sql` | Pattern telemetry per reasoning event. |

### Strategic Moves substrate (new since 2026-04-29 audit)
| Table / View | Migration file | Purpose |
|-------------|---------------|---------|
| `engagements.current_phase` | `041_programs_foundation.sql` + `20260505000000_strategic_moves_six_phase_remap.sql` (PR #1517) | Current phase (0..5 post-impl). |
| `move_artifact_index` VIEW | Wave-3 migrations (PR #1511) | Consolidated artifact index for a Move. |
| Various `program_*` tables | Multiple migrations | `program_milestones`, `program_modules`, `program_work_items`, `program_risks`, `phase_snapshots`, `program_evidence_items`, `program_audit_log`. |
| `deliverable_types.applicable_phases` | Existing + clamp in PR #1517 | INT[] of applicable phases; clamped to [0..5] by the remap migration. |

## Layer 2 · TypeScript pattern corpus

All consumed by `src/lib/intelligence/loader.ts` via `DEFAULT_PATTERNS`.

| Domain | File(s) | Count | Loaded via |
|--------|---------|------:|------------|
| `ai_programs` | `seed-patterns-ai-programs.ts` | 14 | Direct |
| `architecture` | `seed-patterns-architecture.ts` | 10 | Direct |
| `cdp` | `seed-patterns-cdp.ts` | 10 | Direct |
| `industry_specific` | `seed-patterns-industry.ts` | 8 | Direct |
| `meta` | `seed-patterns-meta.ts` | 6 | Direct |
| `sourcing` (base) | `seed-patterns-sourcing.ts` | — | Via sourcing.ts |
| `sourcing` (categories) | `seed-patterns-sourcing-categories.ts` | — | Via sourcing.ts. `SOURCING_CATEGORY_PATTERNS`, `SOURCING_CATEGORY_PATTERN_COUNT`, `_IDS` at ~7688-7689 |
| `sourcing` (contracts) | `seed-patterns-sourcing-contracts.ts` + `-commercial.ts` + `-audit.ts` | — | Via sourcing.ts |
| `sourcing` (pricing) | `seed-patterns-sourcing-pricing.ts` + `-cloud.ts` | — | Via sourcing.ts |
| `sourcing` (process) | `seed-patterns-sourcing-process.ts` + `-renewals.ts` + `-advanced.ts` | — | Via sourcing.ts |
| `sourcing` (regulatory) | `seed-patterns-sourcing-regulatory.ts` + `-ai.ts` | — | Via sourcing.ts |
| All sourcing combined | — | **101** | `seed-patterns-sourcing.ts` aggregate |
| Vendor | `seed-patterns-sourcing-vendors-{22 vendors}.ts` | 22 files | Via sourcing.ts |
| Program lifecycle | `program-lifecycle-patterns.ts` | 6 (`PAT-PRG-*`) | Separate from `DEFAULT_PATTERNS`; used in agent route |
| Source lifecycle | `source-lifecycle-patterns.ts` | 7 (`PAT-SRC-*`) | Separate |
| Source category | `source-lifecycle-patterns-cat.ts` | 12 (`PAT-SRC-CAT-*`) | Separate |

**Total primitives (from loader)**: 198 (149 patterns, 30 signals, 9 solutions, 10 contradictions). Confirmed 2026-04-29; re-verify before pilot.

## Layer 3 · Pattern type shapes

### `PatternSeed` (canonical TS shape)
`src/lib/intelligence/seed-types.ts` ~264-288:
```
PatternSeed {
  id, slug, title, domain, tier, vertical, thesis,
  applicability, status, version, confidence,
  createdFrom, createdBy, createdAt,
  instanceCount, sourceDocuments[], regulatoryChips[],
  relatedPatternIds[], derivedFromPatternIds[],
  taggedContradictionIds[], body, kind?
}
PatternDomain ∈ { industry_specific, sourcing, ai_programs,
  architecture, compliance, future_of_work, meta, cdp }
```

### Archetype keys (`src/lib/programs/types.ui.ts:6-11`)
```
ArchetypeKey ∈ {
  strategic_transformation, workflow_automation,
  platform_modernization, ai_product_enablement,
  operational_optimization
}
```
Heuristic mapping: `src/lib/programs/archetype-normalization.ts`.
Cross-ref: `intelligence/seeds/archetype-phase-deliverable-matrix.json` (same 5 keys).

## Layer 4 · Classifier

`src/lib/programs/classifier.ts` — 3-stage pipeline:

1. **Anthropic claude-haiku** intent extraction
2. **OpenAI `text-embedding-3-large` 1024d** → Pinecone namespace `public-patterns` vector match
3. **Score** with `engagement_topics` enrichment

Weights: `W_VECTOR 0.4 · W_ARCHETYPE 0.2 · W_INDUSTRY 0.15 · W_ENTITY 0.15 · W_SUCCESS 0.1`. Threshold `0.4`. Returns top 3.

Output type `PatternClassifierMatch` (`src/lib/programs/types.db.ts:145-180`):
```
{ patternKey, confidence, archetype, industry,
  canonicalShape, band: high|medium|low|no_match,
  suggestedAction: pattern|template|custom, rationale }
```

Consumers: `src/app/api/v1/programs/originate/route.ts`, `from-thread/route.ts`, `route.ts` → `logClassifierDecision` → `pattern_match_logs`.

**Note**: Classifier is reactive. No per-phase pre-load exists today (GAP-8). `STAGE_PATTERN_MAP` in `src/lib/intelligence/agent-retrieval.ts:45-56` provides stage-to-pattern mapping for the Source surface but has no Strategic Moves equivalent.

## Layer 5 · Phase packs (current state — doctrine incoherent, see GAP-2)

`src/lib/programs/phase-packs/` — consumed by agent route every turn:

| File | Label today | Doctrine label | Status |
|------|------------|---------------|--------|
| `P0_originate.ts` | P0 Originate | P0 Originate | Content needs doctrine rewrite |
| `P1_discovery.ts` | P1 Discovery | P1 Charter | Wrong vocabulary |
| `P2_synthesis.ts` | P2 Synthesis | P2 Discover & Diagnose | Wrong vocabulary |
| `P3_design.ts` | P3 Design | P3 Design Future State | Partially correct |
| `P4_build.ts` | P4 Build | P4 Roadmap & Business Case | Wrong vocabulary |
| `P5_activate.ts` | P5 Activate | P5 Mobilize & Handoff | Wrong vocabulary |
| `P6_operate.ts` | P6 Operate | **Retired** (Tower) | Must be removed |

`PhasePack` schema (`src/lib/programs/phase-packs/types.ts`):
```
PhasePack { phase, label, outcome, definitionOfDone[],
  rightQuestions: { open, converge, close },
  antiPatterns[], coachingArc { entry, midPhase, exit },
  dependencies { requiresFromPrior[], producesForNext[] },
  steps?: PhaseStep[] }

PhaseStep { id, label, complexity: simple|complex,
  agentRole: extract|validate|coach_workshop|coach_interview|
             coach_baseline|evaluate_evidence|request_approval|
             flag_anti_pattern|compose_artifact,
  inputs[], outputs[], templateRefs[],
  preventsFailureModes[], intentCaptureRequired,
  postMeetingUploadExpected }

PhaseEvidenceItem { id, label, severity: hard|soft,
  evaluationHint, preventsFailureModes? }
```

## Layer 6 · Source stage packs (S0..S7)

`src/lib/source/stage-packs/` — same `PhaseEvidenceItem` reuse + `crossReferences.patternIds`, `sourceStageKeys`. Composed via `buildSourceStagePackBlock` + `buildSourceLifecycleContract`. Map at `SOURCE_STAGE_KEY_TO_PACK_STAGE` (~1619-1637).

**No P→S mapping exists today** (GAP-5). S stages are not aligned to the 6-phase Strategic Moves model.

## Layer 7 · Failure mode catalogs (unreconciled — GAP-3)

### 10-id catalog (`src/lib/programs/failure-modes.ts`)

| ID | Name | `primaryPhases` | Issue |
|----|------|-----------------|-------|
| 1 | Lack of executive sponsorship | [0] | OK |
| 2 | Unclear problem def | [0, 2] | OK |
| 3 | Lack of data foundation | [1, 2] | OK |
| 4 | Lack of right talent | [0, 1] | OK |
| 5 | Lack of OM/workflow change commitment | [3, 5, **6**] | P6 ref must be retired (GAP-1) |
| 6 | Late governance/privacy/risk | [2, 3] | OK |
| 7 | Vendor / build-buy strategy errors | [3] | OK |
| 8 | Pilot-to-production scaling gap | [4, 5] | OK |
| 9 | Inability to measure outcomes | [1, 5, **6**] | P6 ref must be retired (GAP-1) |
| 10 | Unrealistic expectations / sprawl | [0, **6**] | P6 ref must be retired (GAP-1) |

Used by: `governance.ts` gate evaluation, `failure-mode-prompt.ts` coaching.

### 12-key catalog (`src/lib/intelligence/ai-program-failure-modes.ts`)

`weak_data_foundation`, `poor_use_case_framing`, `no_business_owner`, `no_measurable_baseline`, `no_value_ledger`, `weak_workflow_integration`, `tool_first_thinking`, `missing_governance_risk`, `no_adoption_change_plan`, `no_operating_model_for_scale`, `pilot_purgatory`, `ai_tool_sprawl_without_value`.

Used by: Intelligence Ask, `failure-mode-prompt.ts` AI-program coaching. Exported: `AI_PROGRAM_FAILURE_KEYS_IN_ORDER`, `AI_PROGRAM_FAILURE_PHASES`, `AI_PROGRAM_FAILURE_GATES`.

### Intelligence J0 failure-mode cards
`src/lib/intelligence/j0-failure-mode-cards.ts` — UI cards for the Intelligence Surface (J0 spine). Separate rendering from the two above catalogs.

## Layer 8 · Ancillary knowledge components

| Component | File | Purpose |
|-----------|------|---------|
| Pattern augmentations | `src/lib/intelligence/pattern-augmentations.ts` | Vendor-depth overlays on top of base patterns |
| Pattern graph validation | `src/lib/intelligence/pattern-graph-validation.ts` | Validates 17-entry design-pack manifest only (not full 198-primitive corpus — **see GAP-6**) |
| Pattern deliverable query | `src/lib/intelligence/pattern-deliverable-query.ts` | Neo4j feature-flagged; not in primary path |
| Agent retrieval | `src/lib/intelligence/agent-retrieval.ts` | `STAGE_PATTERN_MAP` (~45-56), `CATEGORY_KEYWORD_MAP` — Source surface pattern routing |
| Generated manifest | `src/lib/intelligence/generated/pattern-manifest.json` | 17-pattern design-pack manifest (generatedAt 2026-04-23). **Not the full corpus.** |
| Pattern manifest shape | `src/lib/intelligence/pattern-manifest.ts` | `PatternManifestEntry` type |
| Indexer | `src/lib/intelligence/indexer.ts` | Converts corpus to `KnowledgePrimitive[]`; dry-run mode: `indexCorpus({ dryRun: true })` |

## Layer 9 · Governance gates

Current state on `main` (pre-PR #1517): P0→P1 (hard), P2→P3 (hard), P3→P4 (hard), P4→P5 (hard), P5→P6 (hard). **Missing P1→P2.**

Target state in PR #1517: P0→P1 (hard), P1→P2 (hard), P2→P3 (hard), P3→P4 (hard), P4→P5 (hard). P5→P6 retired. `findGateRule(5, 6) === null`.

`GateRule.approverRole` → `founder_approval_requests` table. Hard gates block; soft gates produce an unresolved marker. `src/lib/programs/governance.ts`.

## Known gaps (summary)

| Gap | Item |
|-----|------|
| GAP-1 | `failure-modes.ts` items 5, 9, 10 carry P6 refs |
| GAP-2 | Phase packs still P0..P6 with old vocabulary |
| GAP-3 | Two failure-mode catalogs unreconciled |
| GAP-4 | `pattern_packs` jsonb fields untyped |
| GAP-5 | No P→S source stage mapping |
| GAP-6 | 17-pattern manifest conflated with 198-primitive corpus |
| GAP-7 | Naming doctrine drift |
| GAP-8 | No per-phase pattern pre-load |
| GAP-9 | Self-approval model ad-hoc |
| GAP-10 | `PhaseEvidenceItem` + `antiPatterns` untyped |

See `docs/design/knowledge-layer/KNOWLEDGE_GAP_BACKLOG_2026-05-05.md` for full detail.
