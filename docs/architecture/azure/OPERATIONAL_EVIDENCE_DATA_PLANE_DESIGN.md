# Operational Evidence Azure Data Plane Design

Status: design + implementation contract  
Scope: shared Context Layer and Moves runtime support for operational process
intelligence and AI automation opportunity discovery  
Applies to: Morgan Street-style use cases and future tenants  

Implementation anchors:

- Migration: `supabase/migrations/20260624120000_operational_evidence_data_plane.sql`
- Load/proof contract: `src/lib/enterprise-context/operational-evidence-data-plane.ts`
- Contract tests: `src/lib/enterprise-context/__tests__/operational-evidence-data-plane.test.ts`

## Executive Summary

The Operational Evidence Template Library proves that ServiceNow, Jira, logs,
CMDB/app inventory, process observations, AI opportunities, and value estimates
can create high-quality Moves artifacts. To make that live, Azure/Postgres needs
a structured operational evidence data plane, not a raw document bucket.

The design has four layers:

1. **Raw source control:** private Azure Blob storage, hashes, manifests, source
   refs, and redaction receipts.
2. **Structured operational evidence:** typed Azure Postgres tables for tickets,
   events, process observations, app/service maps, opportunities, controls, and
   value estimates.
3. **Semantic layer:** queryable views/materialized views that expose friction,
   opportunity, value, control, readiness, lineage, source-health, and 90-day
   pilot summaries.
4. **Product projection:** Moves evidence slots, artifact prompt context,
   aVa answer cards, Home/Tower/Intelligence summaries, and Source requirements.

Moves remains the transformation workflow. The Context Layer remains the
evidence system. aVa consumes semantic views and citations.

## Non-Negotiable Rules

- Do not store raw ServiceNow comments or raw log payloads by default.
- Store source references, external IDs, row/file/sheet locators, hashes,
  sanitized summaries, confidence, and relationship edges.
- Every row is tenant-scoped by `tenant_key` and/or `client_id`.
- Synthetic evidence must be labeled `source_type = synthetic_demo` and must not
  override production truth.
- Fallback or benchmark rates must be labeled as planning assumptions and require
  finance/client validation.
- Draft generation can proceed with synthetic/demo/minimum evidence, but
  Executive/Board readiness requires stronger evidence, approvals, visuals,
  validated estimates, and traceability.

## Azure/Postgres Schema

### Source and Load Control

| Table | Purpose | Key Columns |
|---|---|---|
| `operational_evidence_sources` | Registered operational sources and connection/upload metadata. | `id`, `tenant_key`, `client_id`, `source_system`, `source_name`, `connection_mode`, `owner`, `data_classification`, `pii_phi_flag`, `retention_policy`, `status`, `last_ingested_at`, `confidence` |
| `operational_evidence_load_runs` | One run per connector/export/upload parse cycle. | `id`, `tenant_key`, `source_id`, `run_key`, `load_mode`, `state`, `started_at`, `completed_at`, `template_version`, `parser_id`, `records_seen`, `records_loaded`, `records_rejected`, `review_required_count`, `error_summary` |
| `operational_evidence_file_manifests` | File/export lineage and immutable source receipt. | `id`, `tenant_key`, `load_run_id`, `source_file`, `source_path`, `file_hash`, `mime_type`, `row_count`, `sheet_names`, `blob_uri`, `redaction_receipt_uri`, `uploaded_by`, `created_at` |

Load states:

`registered -> uploaded -> staged -> parsed -> reviewed -> committed -> indexed -> retrieval_proven`

Failure/review states:

`parse_failed`, `needs_mapping_review`, `needs_sensitivity_review`,
`needs_owner_attestation`, `index_failed`, `rejected`

### Structured Operational Evidence

| Table | Purpose | Key Columns |
|---|---|---|
| `operational_work_items` | Normalized ServiceNow/Jira/ADO-style incidents, requests, changes, problems, stories, bugs, epics, and tasks. | `id`, `tenant_key`, `source_id`, `load_run_id`, `external_id`, `work_item_type`, `title`, `summary`, `business_service`, `application_id`, `ci_id`, `category`, `subcategory`, `priority`, `severity`, `status`, `assignment_group`, `owner_team`, `opened_at`, `resolved_at`, `cycle_time_hours`, `reopen_count`, `handoff_count`, `sla_breached`, `linked_work_items`, `source_ref`, `confidence`, `payload_hash` |
| `operational_events` | Aggregated/sanitized observability events without raw payloads. | `id`, `tenant_key`, `source_id`, `load_run_id`, `event_time_bucket`, `event_type`, `application_id`, `service_name`, `environment`, `severity`, `event_class`, `message_summary`, `count`, `frequency`, `latency_ms_avg`, `latency_ms_peak`, `linked_work_item_id`, `linked_change_id`, `owner_team`, `source_ref`, `confidence` |
| `operational_process_observations` | Observed process steps, waits, handoffs, approvals, exceptions, and pain points. | `id`, `tenant_key`, `process_name`, `business_domain`, `start_event`, `end_event`, `process_step`, `system_of_record`, `owner_team`, `queue_or_status`, `average_wait_time_hours`, `average_work_time_hours`, `handoff_to`, `approval_required`, `rework_loop_flag`, `exception_flag`, `pain_point`, `automation_candidate`, `evidence_refs`, `confidence` |
| `operational_system_service_maps` | App/CMDB/service ownership, dependency, criticality, and volume anchors. | `id`, `tenant_key`, `application_id`, `application_name`, `business_service`, `business_domain`, `technical_owner`, `business_owner`, `support_group`, `criticality`, `hosting_model`, `environment`, `technology_stack`, `upstream_dependencies`, `downstream_dependencies`, `regulatory_flag`, `lifecycle_status`, `incident_volume_12m`, `change_volume_12m`, `confidence` |

### Derived Intelligence

| Table | Purpose | Key Columns |
|---|---|---|
| `operational_automation_opportunities` | Evidence-backed AI/automation opportunities. | `id`, `tenant_key`, `move_id`, `opportunity_name`, `opportunity_type`, `source_pattern`, `affected_process`, `affected_applications`, `affected_teams`, `current_pain`, `proposed_ai_capability`, `human_role`, `agent_role`, `automation_level`, `value_score`, `feasibility_score`, `risk_score`, `readiness_score`, `priority`, `required_controls`, `evidence_refs`, `pilot_candidate`, `ninety_day_fit`, `confidence` |
| `operational_human_agent_responsibilities` | Human/agent responsibility, approval, exception, and audit model. | `id`, `tenant_key`, `opportunity_id`, `process_step`, `current_owner`, `future_human_role`, `future_agent_role`, `automation_level`, `human_approval_required`, `risk_level`, `evidence_required`, `guardrail`, `audit_requirement`, `estimate_impact`, `run_cost_impact` |
| `operational_value_estimates` | ROM value, cost, rate-card provenance, and finance validation. | `id`, `tenant_key`, `opportunity_id`, `value_driver`, `baseline_volume`, `baseline_effort_minutes`, `baseline_cycle_time`, `baseline_cost`, `target_reduction_percent`, `estimated_savings_low`, `estimated_savings_high`, `implementation_cost_low`, `implementation_cost_high`, `run_cost`, `payback_period`, `confidence`, `assumptions`, `rate_card_source`, `finance_validation_status` |
| `operational_evidence_insights` | Generated insight cards and reusable conclusions. | `id`, `tenant_key`, `insight_type`, `title`, `summary`, `evidence_refs`, `business_impact`, `recommended_action`, `confidence`, `generated_at`, `used_by_moves`, `source_snapshot_id` |
| `operational_evidence_relationships` | Trace graph edges. | `id`, `tenant_key`, `from_entity_type`, `from_entity_id`, `to_entity_type`, `to_entity_id`, `relationship_type`, `evidence_strength`, `source_ref`, `created_at` |

### Semantic Snapshots and Product Projection

| Table / View | Purpose |
|---|---|
| `operational_semantic_snapshots` | Versioned snapshots of semantic views used by artifacts/aVa, with input hashes and freshness. |
| `move_evidence_slot_coverage` | Optional persisted evidence-slot results for faster gate rendering. |
| `move_operational_context_projection` | Move-scoped projection of operational context into prompts/artifacts. |
| `enterprise_context_chunks` | Sanitized chunks for Azure AI Search. No raw comments/log payloads. |
| `program_evidence_items` | Moves readiness projection only. This should not become the operational evidence store. |

## Recommended Indexes

Minimum indexes:

- `(tenant_key, source_system, external_id)` for source records.
- `(tenant_key, application_id)` for work items, events, and service maps.
- `(tenant_key, opened_at)` and `(tenant_key, resolved_at)` for work items.
- `(tenant_key, event_time_bucket)` for operational events.
- `(tenant_key, process_name)` for process observations.
- `(tenant_key, opportunity_id)` for value/control/opportunity joins.
- GIN indexes on `evidence_refs`, `affected_applications`, `affected_teams`,
  `required_controls`, and `linked_work_items` when represented as arrays/JSONB.

Partitioning guidance:

- Partition `operational_work_items` and `operational_events` by month or quarter
  for high-volume tenants.
- Keep opportunities, value estimates, process observations, and semantic
  snapshots unpartitioned unless volumes require it.

## RLS and Tenant Isolation

Every table must include `tenant_key`; most should also include `client_id` when
available. RLS policies must enforce:

- User/session tenant must match row `tenant_key` or `client_id`.
- Agent roster sessions must resolve deterministically to their tenant.
- Synthetic demo evidence is visible only in demo/proof modes.
- Shared benchmark evidence lives in separate shared/benchmark tables or rows
  explicitly marked as non-client-private.

No frontend API should query these tables without tenant-scoped data-plane
adapters.

## Data Load Process

### 1. Register Source

Create `operational_evidence_sources` row:

- tenant/client
- source system
- connection mode: connector, export, upload, manual, synthetic demo
- owner/steward
- classification and sensitivity
- retention policy
- expected template/schema

### 2. Stage Source File or Connector Extract

Store original extract in private Azure Blob:

- immutable path
- SHA-256 hash
- manifest row
- uploader/connector identity
- row count/sheet names
- no direct model access to raw blob

### 3. Validate Template

Validate against the operational template schema:

- required fields
- field types/enums
- source refs
- tenant key/client id
- synthetic labels
- expected relationship columns

Reject or review when required fields are absent.

### 4. Sensitivity and Redaction Scan

Scan for:

- secrets/tokens/credentials
- PHI/PII
- raw ticket comments
- raw log payloads/request bodies
- sensitive business data

Allowed default payload:

- metadata
- sanitized short descriptions/summaries
- categories/codes/statuses
- row/file/source refs
- hashes
- confidence/caveats

### 5. Normalize to Structured Tables

Map template rows into typed entities:

- ServiceNow/Jira rows -> `operational_work_items`
- Log summaries -> `operational_events`
- Process observations -> `operational_process_observations`
- App/CMDB inventory -> `operational_system_service_maps`
- AI backlog -> `operational_automation_opportunities`
- Human-agent model -> `operational_human_agent_responsibilities`
- Value estimates -> `operational_value_estimates`

Also write generic `enterprise_context_records/facts/evidence/relationships`
when a reusable Context Layer record is useful outside operational analytics.

### 6. Build Relationships

Create trace edges:

- ticket/request/change/problem -> app/CI
- Jira issue -> ticket/request/change/problem
- log event -> ticket/change/app
- process observation -> ticket/Jira/log/app
- opportunity -> source pattern/evidence refs
- value estimate -> opportunity
- human-agent responsibility -> opportunity/process step
- roadmap/business case artifact -> opportunity/value/control rows

### 7. Generate Semantic Snapshots

Compute semantic views:

- process friction summary
- app friction leaderboard
- automation opportunity portfolio
- human-agent control matrix
- value estimate portfolio
- evidence readiness and lineage
- source health/load status
- 90-day pilot plan

Persist snapshot metadata:

- input source hashes
- generated at
- freshness
- confidence
- caveats
- tenant/move scope

### 8. Project to Moves

Create `program_evidence_items` or equivalent projection rows:

- evidence type
- source type
- confidence
- evidence refs
- slot ids
- artifact consumers
- structured fields

Moves uses these rows for readiness gates and prompt binding. Moves does not
own the detailed operational evidence.

### 9. Index Sanitized Chunks

Create `enterprise_context_chunks` from sanitized summaries only:

- source-system guidance
- insight summaries
- app friction summaries
- opportunity summaries
- evidence caveats
- citations/source refs

Push to Azure AI Search with tenant filters.

### 10. Review and Approve

Review queues should show:

- low-confidence mappings
- sensitivity flags
- missing owners
- missing source refs
- synthetic evidence
- finance validation required
- human approval boundary missing

Approval does not mean "artifact approved"; it means "evidence can be used for
drafting or executive review at the stated confidence."

### 11. Prove Retrieval and Runtime

Before claiming live readiness:

- Query Azure/Postgres row counts by tenant.
- Query semantic views by tenant.
- Query Azure AI Search with tenant filter.
- Generate evidence-readiness API response.
- Generate P2-P5 artifacts.
- Ask aVa operational questions and verify cited evidence.
- Screenshot frontend visibility.

## Semantic Layer

Runtime code contract:

`src/lib/enterprise-context/operational-evidence-semantic-layer.ts`

Canonical views:

| View | Primary Consumers | Main Job |
|---|---|---|
| `operational_process_friction_summary` | Home, Intelligence, Moves, Tower, aVa | Bottlenecks, rework, handoffs, cycle time. |
| `application_friction_leaderboard` | Home, Intelligence, Moves, Tower, Source, aVa | Which apps/services create friction and ownership risk. |
| `automation_opportunity_portfolio` | Home, Intelligence, Moves, Tower, Source, aVa | What to automate first and why. |
| `human_agent_control_matrix` | Intelligence, Moves, Tower, Source, aVa | What stays human-approved and what agents can do. |
| `value_estimate_portfolio` | Home, Intelligence, Moves, Tower, aVa | ROM value, cost, rate provenance, finance validation. |
| `evidence_readiness_and_lineage` | Admin, Moves, aVa | Whether evidence is ready and traceable. |
| `source_health_and_load_status` | Admin, Moves, aVa | Uploaded vs parsed vs committed vs indexed vs retrievable. |
| `ninety_day_pilot_plan` | Home, Intelligence, Moves, Tower, aVa | 0-30/31-60/61-90 plan and value gates. |

## Frontend Visibility

### Home

Home should show executive-level cards:

- Top friction processes.
- Top app/service friction.
- Top 3 pilot-ready AI opportunities.
- ROM value range with validation caveat.
- Next 90-day pilot gate.

Primary action: open Move or ask aVa.

### Intelligence

Intelligence should show analyst/decision views:

- Evidence graph.
- Pattern map.
- Opportunity portfolio.
- Human-agent controls.
- Value estimate portfolio.
- "Show me the evidence" drawer.

Primary action: send to Moves or open trace.

### Moves

Moves should show phase-specific semantic context:

- Evidence readiness panel.
- What we know so far.
- Operational semantic cards bound into P2-P5 prompts.
- Missing evidence/client-to-complete fields.
- Regenerate with feedback/context upload.

Primary action: generate/regenerate artifact.

### Context Layer Admin

Admin should show ingestion truth states:

- uploaded
- staged
- parsed
- reviewed
- committed
- indexed
- retrieval-proven

Primary action: approve mappings, refresh index, inspect load receipt.

### Tower

Tower should show portfolio monitoring:

- opportunity count by status
- value at stake
- blocked pilots
- evidence/control/owner gaps
- value realization gates

Primary action: escalate blocker or open Move.

### Source

Source should consume operational evidence when a solution or vendor is needed:

- required capabilities from evidence
- controls that belong in RFP/BAFO
- demo/POC scenarios from operational patterns
- vendor accountability for operational outcomes

Primary action: create requirement or demo scenario.

### aVa

aVa should answer operational questions in this structure:

1. Pattern found.
2. Evidence.
3. Business impact.
4. AI opportunity.
5. Human-in-loop design.
6. Value estimate.
7. Risk/feasibility/readiness.
8. Recommended next action.
9. Evidence caveats and client-to-complete fields.

## Insight Consumption UX

Make insights easy to consume by packaging every semantic finding as an
`OperationalInsightCard`:

| Field | Why it matters |
|---|---|
| title | Human-readable insight label. |
| type | Bottleneck, repetitive work, app friction, automation priority, value case, evidence gap, pilot next step. |
| summary | One decision-useful sentence. |
| evidence refs | Clickable/source-traceable evidence. |
| affected apps | Helps route to app owners and architecture. |
| affected teams | Helps route to operating owners. |
| recommended action | Makes insight actionable. |
| confidence | Prevents overclaiming. |
| caveat | Synthetic/demo/finance validation/client-to-complete warnings. |

Recommended UX pattern:

- Show 3-5 highest-priority cards first.
- Provide filters by process, app, team, opportunity type, confidence, value,
  risk, readiness, and evidence state.
- Add "why this?" expandable trace.
- Add "use in artifact" action for Moves.
- Add "ask follow-up" action for aVa.
- Add "create sourcing requirement" action for Source.

## API Shape

Recommended endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/context/operational/sources?tenantKey=` | Source/load status. |
| `POST /api/context/operational/load-runs` | Start upload/connector load. |
| `GET /api/context/operational/load-runs/[runId]` | Load receipt and state. |
| `GET /api/context/operational/semantic?view=&moveId=` | Semantic view payload. |
| `GET /api/context/operational/insights?moveId=` | Insight cards. |
| `GET /api/context/operational/trace/[opportunityId]` | Evidence-to-opportunity trace. |
| `POST /api/programs/workspace/[moveId]/operational-evidence/project` | Project semantic evidence into Moves readiness. |

## MVP Implementation Order

1. Add typed Azure/Postgres tables and RLS.
2. Add template-schema validators for the 8 minimum templates.
3. Add upload/manifest/load-run route.
4. Add parser/normalizer for CSV/JSON/XLSX exports.
5. Add relationship builder.
6. Add semantic view builder.
7. Add Moves projection builder.
8. Add Azure AI Search sanitized chunk indexing.
9. Add frontend semantic cards in Admin, Moves, Intelligence, and Home.
10. Add aVa answer contract using semantic views and source refs.
11. Run Morgan Street-style live proof with signed-in agent session.

## Acceptance Criteria

- Evidence load states are visible and auditable.
- Structured operational evidence exists in Azure/Postgres.
- Semantic views are tenant-filtered and visible to frontend modules.
- Moves readiness and prompts bind operational semantic context.
- aVa can answer operational questions with evidence and caveats.
- Source can convert opportunities into solution/vendor requirements.
- Tower can monitor value gates and blocked opportunities.
- Synthetic/demo evidence never masquerades as client-approved truth.
- Raw payloads remain controlled and are not used as default prompt context.
