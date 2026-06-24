# AbarVa Semantic Question Layer Standard

## Purpose

AbarVa users must be able to ask normal English questions over enterprise context and receive accurate, cited, human answers. The semantic question layer is the shared contract between the Context Layer and Home, Intelligence, Moves, Source, Tower, and aVa.

This is a platform-level service, not a Home feature. Its product name is:

**Enterprise Semantic Question Layer**

Every module must consume the same semantic interpretation, metric, query, evidence, answer, and verification contract:

- Home: "what do we know?"
- Moves: "what should we do?"
- Source: "which vendor and why?"
- Control Tower: "are we delivering value?"
- aVa: "explain it like an advisor."
- Context Layer Admin: "what evidence is loaded, missing, stale, or unsafe?"

The core rule is:

1. Understand the question.
2. Map it to governed dimensions, metrics, filters, joins, and evidence.
3. Use structured data or semantic views first when numbers, rankings, comparisons, trends, or root-cause answers are requested.
4. Retrieve cited evidence after the semantic plan is defined.
5. Let aVa compose the human answer from computed facts, evidence, caveats, and confidence.
6. Verify that every number, ranking, and metric claim is supported.

LLM narrative must never be the source of truth for computed numbers.

## Scope

The semantic layer covers the universal 6-family / 19-dimension enterprise context model:

- enterprise_profile
- business_org_functions
- it_org_ownership
- personas_workforce
- capabilities_value_streams
- applications_systems
- system_function_mapping
- infrastructure_cloud
- platform_volumetrics
- data_analytics_estate
- integrations_interfaces
- vendors_contracts_licenses
- it_budget_financials
- initiatives_portfolio
- operations_service_management
- kpis_outcome_evidence
- security_risk_compliance
- ai_automation_footprint
- context_relationships

Vertical or module-specific extensions may add dimensions, but they must not bypass the universal semantic contract.

## Semantic Extensions

The 19 dimensions are the universal backbone, not the full universe of AbarVa data. New dataset families must register as semantic extensions instead of becoming loose documents or one-off module logic.

Initial extension families:

- Operational Evidence and Process Intelligence
- Moves Evidence Readiness
- Source Proposal Intelligence
- Rate Card Provenance
- AI Control Tower
- Healthcare Clinical and Claims Overlay

Every extension must define:

- extension_id
- label
- purpose
- consuming modules
- dataset families
- extension dimensions
- universal dimension anchors
- canonical metrics
- required evidence types
- join strategy
- caveats
- unsupported question behavior

Extension examples:

- Operational evidence anchors to operations_service_management, applications_systems, ai_automation_footprint, kpis_outcome_evidence, and context_relationships.
- Rate-card provenance anchors to it_budget_financials, vendors_contracts_licenses, and kpis_outcome_evidence.
- Healthcare clinical/claims overlays anchor to data_analytics_estate, integrations_interfaces, kpis_outcome_evidence, security_risk_compliance, applications_systems, and personas_workforce.

This lets AbarVa add new industry packs, client packs, operational logs, sourcing artifacts, and Moves artifacts without weakening the governed semantic model.

## Required Dimension Contract

Every semantic dimension must define:

- dimension_id
- family
- business_name
- description
- business_questions_supported
- synonyms
- canonical_entities
- source_tables_or_views
- searchable_indices
- primary_grain
- key_fields
- allowed_filters
- default_filters
- canonical_metrics
- metric_definitions
- join_paths
- freshness_fields
- owner_fields
- data_quality_fields
- confidence_rules
- caveats
- citation_rules
- answer_examples
- unsupported_question_behavior

Missing context is a disclosed limitation, not a license to invent an answer.

## Required Metric Contract

Every semantic metric must define:

- metric_id
- business_name
- description
- formula
- required_fields
- grain
- allowed_dimensions
- filters
- units
- freshness
- confidence_rules
- caveats
- citation_requirements

Business cases, roadmaps, operational prioritization, and friction rankings must disclose the metric basis and caveats.

## Runtime Answer Flow

For metric, ranking, comparison, trend, root-cause, gap, and recommendation questions:

1. Route the question to intent, dimensions, metrics, entities, filters, joins, confidence, and plan.
2. Choose a structured metric or semantic view when available.
3. Compute facts from structured rows or views.
4. Retrieve cited evidence rows or source chunks.
5. Compose the answer with direct answer, why it matters, evidence, caveats, confidence, next action, and suggested follow-up questions.
6. Verify the answer.

For document-only dimensions:

- retrieve supporting evidence,
- avoid false precision,
- label the answer as an evidence summary,
- disclose missing structured data.

## Answer UI Contract

aVa/Home/Moves/Source/Intelligence should render:

- human answer first
- basis/definition used
- metric definition expandable
- evidence citations
- confidence
- freshness
- caveats
- source records
- ask-next suggestions
- correction/feedback action

## Verification Rules

The verifier must block or flag:

- unsupported numbers,
- rankings without structured metric results,
- unregistered metric claims,
- low-confidence answers without limitation language,
- synthetic/demo evidence without explicit labeling,
- answers that hide missing required evidence.

## Golden Questions

The platform must maintain at least five canonical questions per universal dimension and cross-dimensional questions for:

- applications causing friction,
- vendors driving operational risk,
- low-trust data products,
- handoff delays,
- automation opportunities by value,
- weak-evidence initiatives,
- pricing risk,
- architecture gaps by business process.

These questions are regression assets, not demo copy.

## Implementation Anchor

The current shared implementation lives in:

- `src/lib/enterprise-context/semantic-question-layer.ts`
- `src/lib/enterprise-context/__tests__/semantic-question-layer.test.ts`
- `supabase/migrations/20260624143000_enterprise_semantic_question_layer.sql`
- `docs/architecture/azure/ENTERPRISE_SEMANTIC_QUESTION_LAYER_DATA_PLANE_DESIGN.md`

Primary platform entry points:

- `getEnterpriseSemanticQuestionLayerContract()`
- `answerEnterpriseSemanticQuestion({ requestedByModule, question, records, tenantKey, userId })`
- `routeSemanticQuestion(question, { requestedByModule })`
- `planSemanticQuestion(question, records, { requestedByModule })`

Consumer modules must pass `requestedByModule` so vague but valid business questions can be biased to the correct semantic extension without creating module-specific forks.
