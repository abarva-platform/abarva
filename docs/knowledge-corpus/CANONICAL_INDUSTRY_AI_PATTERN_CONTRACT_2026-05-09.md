# Canonical Industry AI Pattern Contract

Date: 2026-05-09

Status: Wave 1 foundation contract. No runtime behavior change.

Purpose: define the canonical AbarVa pattern shape that Nexus, Sentinel, and Atlas will use to reason over Retail, Financial Services, Healthcare, and cross-industry AI / agentic AI transformation patterns without duplicating existing pattern stores.

The TypeScript contract lives in:

- `src/lib/intelligence/canonical/industry-ai-pattern.ts`

## Design Principles

1. Reuse before authoring: existing `PatternSeed`, generated manifest, `pattern_packs`, `genome_patterns`, phase packs, deliverables, and knowledge-corpus docs map into this contract before new bulk content is created.
2. Pattern-first advice: agents should retrieve structured patterns before synthesizing recommendations.
3. No unsupported precision: KPI values, value ranges, and quantitative claims must be sourced or explicitly flagged.
4. Phase aware: every pattern should explain where it helps in AbarVa Strategic Moves.
5. Human and agent work design: every AI pattern should describe human-in-the-loop controls, autonomous agent boundaries, escalation, and responsible AI guardrails.
6. Provenance visible: source basis and confidence must travel with the pattern and eventually with agent answers.

## Strategic Moves Phase Model

Wave 1 locks the simplified Strategic Moves phase model:

| Canonical value | Display label |
| --- | --- |
| `originate` | Originate |
| `charter` | Charter |
| `diagnose_discover` | Diagnose / Discover |
| `design` | Design |
| `roadmap_business_case_change_value_plan` | Roadmap / Estimates / Business Case / Change / Value Realization Plan |
| `mobilize_handoff` | Mobilize & Handoff |

Do not use `Execute` as a Strategic Moves phase label. AbarVa designs, plans, mobilizes, and hands off. Execution may be done by client teams, SI partners, Source-selected vendors, or delivery teams.

## Controlled Enums

### industry

- `retail`
- `healthcare`
- `financial_services`
- `cross_industry`
- `energy`
- `public_sector`
- `other`

### enterprise_area

- `front_office`
- `middle_office`
- `back_office`
- `enterprise_platform`

### strategic_move_phase

- `originate`
- `charter`
- `diagnose_discover`
- `design`
- `roadmap_business_case_change_value_plan`
- `mobilize_handoff`

### confidence_level

- `low`
- `medium`
- `high`
- `validated`

### maturity_level

- `emerging`
- `proven`
- `scaled`
- `experimental`

### value_lever

- `revenue_growth`
- `cost_takeout`
- `productivity`
- `risk_reduction`
- `experience`
- `speed_to_market`
- `working_capital`
- `quality`
- `compliance`

## Contract Sections

### Identity

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `canonical_id` | string | Yes | Stable canonical id, not a source id. Recommended future format: `AIP-{INDUSTRY}-{AREA}-{NNN}`. |
| `title` | string | Yes | Executive-readable title. |
| `summary` | string | Yes | Crisp description of the reusable pattern. |
| `source_crosswalk` | `CanonicalSourceCrosswalkEntry[]` | Yes | Links this canonical pattern to existing source objects. |
| `source_systems` | `CanonicalPatternSourceSystem[]` | Yes | Store(s) represented by the pattern. |
| `source_ids` | string[] | Yes | Native ids from source systems. |
| `version` | string | Yes | Canonical pattern version. |
| `lifecycle_status` | enum | Yes | `draft`, `reviewed`, `validated`, or `deprecated`. |
| `owner` | string | Yes | Responsible owner/team. |
| `last_reviewed_at` | string or null | Yes | ISO date when reviewed, or null until reviewed. |

### Classification

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `industry` | enum[] | Yes | Supports cross-industry and multi-industry patterns. |
| `enterprise_area` | enum | Yes | Front/middle/back/platform classification. |
| `function` | string | Yes | Business function, normalized later by alias rules. |
| `process_area` | string | Yes | Process/workflow area. |
| `use_case_category` | string | Yes | Use-case family. |
| `strategic_move_phases` | enum[] | Yes | Applicable AbarVa phases. |
| `maturity_level` | enum | Yes | Maturity of the market/pattern. |
| `confidence_level` | enum | Yes | Confidence in the pattern, not in a specific client outcome. |

### Business Context

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `executive_question_answered` | string | Yes | Example: "How should we reduce prior-auth cycle time without increasing denial risk?" |
| `target_personas` | string[] | Yes | Personas who sponsor, operate, or are affected by the pattern. |
| `business_problem` | string | Yes | Specific problem this pattern addresses. |
| `why_now` | string | Yes | Trigger for urgency. |
| `value_hypothesis` | string | Yes | Value logic without unsupported precision. |
| `primary_kpis` | string[] | Yes | At least three once validation is enabled. |
| `secondary_kpis` | string[] | Yes | Supporting KPIs. |
| `baseline_needed` | string[] | Yes | Baseline facts required before value claims. |
| `measurement_method` | string | Yes | How value is measured. |
| `value_levers` | enum[] | Yes | Controlled value lever set. |
| `time_to_value_band` | string | Yes | Qualitative or sourced range. |
| `implementation_complexity` | enum | Yes | `low`, `medium`, `high`, or `unknown`. |

### Data And Architecture

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `required_data_domains` | string[] | Yes | Data domains needed to operate or evaluate the pattern. |
| `data_quality_dependencies` | string[] | Yes | Quality/completeness constraints. |
| `source_system_dependencies` | string[] | Yes | Systems of record or engagement. |
| `integration_dependencies` | string[] | Yes | Interfaces, APIs, event streams, batch feeds. |
| `vector_graph_semantic_dependencies` | string[] | Yes | Search, semantic, graph, ontology, retrieval requirements. |
| `agentic_architecture_pattern` | string | Yes | Agent/collaboration/control pattern. |
| `human_agent_workflow_design` | string | Yes | Before/after workflow and human role. |
| `autonomous_agent_action_boundaries` | string[] | Yes | What agents may do without approval. |
| `escalation_points` | string[] | Yes | Where work returns to humans or governance. |
| `responsible_ai_guardrails` | string[] | Yes | Privacy, safety, audit, bias, compliance, security controls. |

### Operating Model

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `operating_model_changes` | string[] | Yes | Roles, decision rights, handoffs, governance. |
| `change_management_needs` | string[] | Yes | Adoption and enablement requirements. |
| `recommended_workshops` | string[] | Yes | Workshops Nexus can facilitate. |
| `recommended_artifacts` | string[] | Yes | Phase deliverables or supporting artifacts. |
| `entry_criteria` | string[] | Yes | Conditions before using the pattern. |
| `exit_criteria` | string[] | Yes | Conditions for moving forward. |
| `gate_evidence_required` | string[] | Yes | Evidence needed at phase gates. |

### Risk And Failure

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `common_failure_modes` | string[] | Yes | Pattern-specific failure modes. |
| `anti_patterns` | string[] | Yes | What not to do. |
| `intervention_options` | string[] | Yes | Practical interventions. |
| `failure_mode_mitigations` | string[] | Yes | Preventive or corrective actions. |

### Provenance

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `source_basis` | enum | Yes | `internal_pattern`, `public_research`, `inferred_from_patterns`, `user_seeded`, `tenant_evidence`, `synthetic_seed`, or `unknown`. |
| `source_references` | object[] | Yes | Structured references; do not fabricate. |
| `confidence_rationale` | string | Yes | Why this confidence level is appropriate. |
| `quantitative_claims` | object[] | Yes | Any numeric claims with confidence and source linkage. |
| `unsupported_claim_flags` | object[] | Yes | Claims that need sourcing, qualification, or removal. |

## Draft Objects

Wave 1 introduces `IndustryAIPatternDraft` for lossy mappings from existing sources. Drafts intentionally expose:

- `missing_required_fields`
- `missing_provenance`
- source ids and source systems

Draft builders in later PRs must surface missing fields rather than inventing values.

## Non-Goals In Wave 1

- No new large-scale pattern content.
- No duplicate runtime store.
- No database mutation.
- No runtime retrieval change.
- No automatic DB synchronization.
- No replacement of existing phase packs, deliverable registry, manifest, or seed corpus.

## QA Expectations

- TypeScript compiles.
- Contract is additive.
- Agent runtime behavior is unchanged.
- Future validation can check every required field using `CANONICAL_INDUSTRY_AI_PATTERN_REQUIRED_FIELDS`.
