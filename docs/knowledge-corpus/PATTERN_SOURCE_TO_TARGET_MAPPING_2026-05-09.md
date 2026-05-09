# Pattern Source To Target Mapping

Date: 2026-05-09

Status: Wave 1 foundation mapping. No runtime behavior change.

Purpose: map existing AbarVa pattern-like sources to the canonical `IndustryAIPattern` contract without creating a duplicate pattern store.

Canonical contract:

- `src/lib/intelligence/canonical/industry-ai-pattern.ts`
- `docs/knowledge-corpus/CANONICAL_INDUSTRY_AI_PATTERN_CONTRACT_2026-05-09.md`

## Source Systems

| Source system | Current location | Role today | Canonical relationship |
| --- | --- | --- | --- |
| `pattern_seed` | `src/lib/intelligence/seed-*.ts`, `src/lib/intelligence/loader.ts`, `src/lib/intelligence/seed-types.ts` | Source-controlled static intelligence corpus | Primary source for many internal/cross-industry patterns |
| `generated_pattern_manifest` | `src/lib/intelligence/generated/pattern-manifest.json`, `src/lib/intelligence/pattern-manifest.ts` | Smaller generated manifest used by Nexus free text and Sentinel tools | Diagnostic/evidence-rich projection of selected source patterns |
| `pattern_packs` | Supabase `pattern_packs`; migration `20260421152501_intelligence_layer_core.sql` | Rich database pattern packs with symptoms, questions, evidence, interventions, failure modes | Strong source for diagnostic and phase guidance fields |
| `genome_patterns` | Supabase `genome_patterns`; migrations `20260509100000_genome_patterns_normalize.sql`, `20260509120000_retail_genome_supabase_graph.sql` | Normalized live pattern surface, currently strongest for Retail | Strong source for industry and enterprise-area classification |
| `phase_packs` | `src/lib/programs/phase-packs/v2/*.ts` | Nexus phase training packs for P0-P5 | Source for phase applicability, questions, evidence, gate and anti-hallucination guidance |
| `deliverable_registry` | `src/lib/programs/deliverable-registry.ts` | Phase-keyed deliverable catalog | Source for recommended artifacts and gate artifacts |
| `knowledge_corpus_schema` | `docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md`, `SCHEMA_EXTENSIONS_V1_1.md`, `PROVENANCE_AND_VERSIONING.md` | Locked/draft corpus design docs | Design source for future use-case, pattern, provenance, persona, anti-pattern, vendor, SI, and regulatory entities |

## Field Mapping Summary

| Canonical section | Strongest current sources | Weak/missing current sources |
| --- | --- | --- |
| Identity | `PatternSeed.id/title/version/status`, manifest `id/name/version/status`, DB ids | Canonical id crosswalk does not exist |
| Classification | `PatternSeed.domain/vertical`, manifest `category/sectorApplicability`, `genome_patterns.office_category/tags`, docs schema `industry/office/domain_tags` | Function, process area, and use-case category are not consistently first-class |
| Business context | `PatternSeed.thesis/applicability/body`, docs schema use-case fields, manifest descriptions | Executive question, KPI split, baseline, measurement method, and value levers are incomplete |
| Data and architecture | Phase packs, deliverable sections, selected pattern body text | Required data domains, source systems, semantic/vector/graph dependencies, agentic architecture, and action boundaries are not canonical |
| Operating model | Phase packs, deliverable registry, docs schema success/failure guidance | Pattern-level workshops, artifacts, entry/exit criteria, and gate evidence are incomplete |
| Risk and failure | Phase pack anti-patterns, manifest interventions, `pattern_packs` failure fields, contradiction corpus | Failure-mode mitigations are not required on every use case |
| Provenance | `sourceDocuments`, manifest source fields, `pattern_packs` source/freshness fields, tenant records, docs provenance standard | `source_basis`, structured source references, confidence rationale, and unsupported quantitative claim flags are not enforced |

## PatternSeed Mapping

Current source type: `PatternSeed` in `src/lib/intelligence/seed-types.ts`.

| PatternSeed field | Canonical target | Notes |
| --- | --- | --- |
| `id` | `source_ids[]`, `source_crosswalk[].source_id` | Source id, not canonical id. |
| `slug` | `source_crosswalk[].source_label` | Useful for stable display/routing where present. |
| `title` | `title` | Direct mapping. |
| `domain` | `function` or `use_case_category` candidate | Needs normalization; domain is too coarse for canonical function. |
| `vertical` | `industry[]` | Needs alias normalization and support for multi-industry values. |
| `thesis` | `summary`, `value_hypothesis` candidate | Must not be treated as validated value claim. |
| `applicability` | `business_problem`, `entry_criteria` candidate | Requires parsing/enrichment. |
| `status` | `lifecycle_status` candidate | Requires mapping from authoring statuses to canonical lifecycle. |
| `version` | `version` | Direct mapping if present. |
| `confidence` | `confidence_level` candidate | Numeric-to-enum rule needed. |
| `sourceDocuments` | `source_references` candidate | Currently strings; must not fabricate URLs. |
| `relatedPatternIds`, `derivedFromPatternIds` | `source_crosswalk` related/derived links | Also useful for duplicate detection. |
| `taggedContradictionIds` | `common_failure_modes`, `anti_patterns` candidate | Needs contradiction lookup. |
| `body` | Multiple narrative fields | Requires structured extraction or manual enrichment. |
| sourcing extensions | artifacts, risks, build/buy/partner, lifecycle candidates | Strong for sourcing patterns, not general AI patterns. |

Missing from PatternSeed:

- `enterprise_area`
- `process_area`
- `strategic_move_phases`
- `maturity_level`
- `executive_question_answered`
- structured target personas
- primary/secondary KPI split
- baseline and measurement method
- required data domains and quality dependencies
- agentic workflow/action boundaries
- recommended workshops
- gate evidence required
- `source_basis`
- `confidence_rationale`
- structured quantitative claim flags

## Generated Pattern Manifest Mapping

Current source type: `PatternManifestEntry` in `src/lib/intelligence/pattern-manifest.ts`.

| Manifest field | Canonical target | Notes |
| --- | --- | --- |
| `id`, `slug` | `source_ids[]`, `source_crosswalk` | Source ids. |
| `name` | `title` | Direct mapping. |
| `shortDescription`, `longDescription` | `summary`, `business_problem` candidate | Stronger than many seed bodies. |
| `category` | `function` / `use_case_category` candidate | Needs taxonomy normalization. |
| `crossIndustry`, `sectorApplicability`, `primarySector` | `industry[]` | Needs alias normalization. |
| `status`, `version` | `lifecycle_status`, `version` | Requires status mapping. |
| `confidenceFloor` | `confidence_level` candidate | Numeric-to-enum rule needed. |
| `sourceFile`, `sourceSection`, `lastUpdatedAt`, `contentHash` | `source_references`, `last_reviewed_at` candidate | Strong provenance pointer. |
| `triggerSymptoms`, `detectionSignals` | `entry_criteria`, `common_failure_modes` candidate | Useful for Sentinel. |
| `diagnosticQuestions` | phase question guidance | Does not map cleanly to one canonical field. |
| `evidenceRequirements` | `gate_evidence_required` candidate | Strong mapping. |
| `interventions` | `intervention_options` | Direct candidate. |
| `relatedPatternIds` | crosswalk related links | Useful for graph/analogs. |

Missing from manifest:

- `enterprise_area`
- structured function/process/use-case taxonomy
- target personas
- primary/secondary KPI split
- data domains and integration dependencies
- agentic architecture and human-agent workflow fields
- recommended workshops/artifacts
- source basis enum
- confidence rationale
- unsupported quantitative claim flags

## pattern_packs Mapping

Current source: Supabase `pattern_packs`.

| pattern_packs field | Canonical target | Notes |
| --- | --- | --- |
| id/code/name fields | `source_ids[]`, `title` | Exact column names vary by migration generation; map source id verbatim. |
| `category` | `function` / `use_case_category` candidate | Often strong but not normalized. |
| `sector_applicability` | `industry[]` | Needs alias normalization. |
| `trigger_symptoms`, `detection_signals` | `entry_criteria`, `common_failure_modes` candidate | Strong diagnostic mapping. |
| `diagnostic_questions` | phase questions/workshop prompts | Useful in Wave 2 retrieval context. |
| `evidence_requirements` | `gate_evidence_required` | Strong mapping. |
| `likely_root_causes` | `business_problem`, `common_failure_modes` candidate | Needs synthesis. |
| `benchmark_signatures` | `baseline_needed`, `measurement_method` candidate | Do not turn into quantitative claim without source. |
| `intervention_options` | `intervention_options` | Direct candidate. |
| `anti_patterns`, `common_failure_modes` | `anti_patterns`, `common_failure_modes` | Direct candidate. |
| phase deliverable fields | `recommended_artifacts`, `strategic_move_phases` candidate | Current phase labels are not the simplified six-phase model. |
| `expected_time_to_value` | `time_to_value_band` | Preserve as text unless sourced. |
| `success_metrics`, `leading_indicators`, `linked_kpi_ids` | `primary_kpis`, `secondary_kpis` candidates | Requires primary/secondary split. |
| `confidence_level` | `confidence_level` | Direct candidate if values align. |
| `source_id`, `as_of_date`, `last_verified_at`, `raw_markdown`, `metadata` | provenance fields | Stronger than TypeScript seeds. |

Missing or inconsistent in pattern_packs:

- canonical `enterprise_area`
- controlled function/process/use-case taxonomy
- target personas as a normalized field
- agentic workflow and autonomous boundaries
- recommended workshops
- quantitative claim flags
- owner and review workflow

## genome_patterns Mapping

Current source: Supabase `genome_patterns`.

| genome_patterns field | Canonical target | Notes |
| --- | --- | --- |
| `code`, id | `source_ids[]` | Strong source id. |
| `name` | `title` | Direct mapping. |
| `description`, `summary` | `summary`, `business_problem` candidate | Direct candidate. |
| `office_category` | `enterprise_area` | Strong mapping for retail genome data. |
| `tags`, `keywords` | `function`, `process_area`, `use_case_category` candidates | Needs taxonomy rules. |
| `failure_rate_pct` | `quantitative_claims` or `unsupported_claim_flags` | Must be sourced or flagged. |
| graph/source view links | `source_references`, crosswalk links | Use `intelligence_pattern_source_graph` when available. |

Missing from genome_patterns:

- explicit industry when inferred from current live data context
- Strategic Move phase applicability
- KPIs and measurement method
- data and architecture dependencies
- human-agent workflow design
- artifacts/workshops/gate evidence
- confidence rationale and source basis as required canonical fields

## Phase Packs Mapping

Current source: `src/lib/programs/phase-packs/v2/*.ts`.

| Phase pack field | Canonical target | Notes |
| --- | --- | --- |
| phase identity | `strategic_move_phases` | Map P0-P5 to simplified six-phase model. |
| `phase_intent`, `phase_scope_boundary` | `entry_criteria`, `exit_criteria` candidate | Phase-level, not pattern-specific. |
| `workflow_steps[].patterns_to_load` | crosswalk candidate | Needs validation against canonical pattern ids. |
| `workflow_steps[].questions_to_ask` | workshop/question guidance | Useful for Nexus training. |
| `evidence_requirements`, `gate_criteria` | `gate_evidence_required`, `exit_criteria` candidate | Strong phase evidence source. |
| `anti_patterns`, `anti_hallucination_rules` | `anti_patterns`, responsible AI/refusal guidance | Strong for agent behavior. |
| `fixtures`, `coaching_rules` | agent training metadata | Not direct canonical fields but important retrieval context. |

Missing from phase packs:

- industry/function-specific pattern taxonomy
- canonical pattern ids for all `patterns_to_load`
- Handoff as a standalone V2 pack
- KPI/data/architecture detail by use case

## Deliverable Registry Mapping

Current source: `src/lib/programs/deliverable-registry.ts`.

| Deliverable field | Canonical target | Notes |
| --- | --- | --- |
| `deliverableTypeKey` | `recommended_artifacts` | Direct candidate. |
| `documentTitle` | artifact label | Direct candidate. |
| `phase` / `phaseLabel` | `strategic_move_phases` candidate | Map P1-P5 to simplified phase model. |
| `documentPurpose` | artifact purpose | Useful in retrieval output templates. |
| `gateArtifact` | `gate_evidence_required` candidate | Gate artifact indicator. |
| `sections` | artifact template requirements | Useful in Wave 2 output template retrieval. |

Missing from deliverable registry:

- industry/function/use-case applicability
- pattern ids that require each artifact
- recommended workshops
- KPI/data prerequisites by artifact

## docs/knowledge-corpus Schema Mapping

Current source: `docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md`, `SCHEMA_EXTENSIONS_V1_1.md`, `PROVENANCE_AND_VERSIONING.md`, and curation prompts.

| Docs schema concept | Canonical target | Notes |
| --- | --- | --- |
| Use Case `id/name/industry/office/domain_tags` | identity/classification fields | Closest conceptual match to canonical industry AI patterns. |
| `problem_statement` | `business_problem` | Direct candidate. |
| target outcomes/value ranges | `value_hypothesis`, KPIs, `quantitative_claims` | Must preserve confidence and source basis. |
| success patterns / failure modes | risk/failure fields | Strong source for pattern relationships. |
| benchmark metrics | KPI/measurement/quantitative claims | Requires provenance. |
| vendor/SI/regulatory context | source dependencies, build/buy/partner notes, guardrails | Canonical contract does not replace vendor/SI/regulatory entities. |
| provenance/versioning docs | provenance fields | Stronger than runtime enforcement today. |
| v1.1 Proof Point, Persona, Move Cascade, Anti-Pattern | future relationships | Useful for Wave 2/3, not all included in Wave 1 base contract. |

Missing in current docs implementation:

- Populated runtime entities for all schema concepts.
- Agent retrieval integration.
- Crosswalk to current TypeScript/DB pattern stores.

## Required Wave 2/3 Decisions

1. Canonical id format and ownership model.
2. Whether canonical patterns live as a generated view, source-code projection, DB view, or all three.
3. How to reconcile `PatternSeed` with docs schema Use Case entities.
4. Whether `genome_patterns` remains Retail-first or becomes the normalized industry-wide pattern table.
5. How to display source basis and confidence in Nexus/Sentinel/Atlas responses.
6. How to validate pattern-to-phase and pattern-to-artifact mappings before content expansion.
