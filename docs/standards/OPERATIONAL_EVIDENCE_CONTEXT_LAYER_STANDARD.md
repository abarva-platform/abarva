# Operational Evidence Context Layer Standard

## Status

Canonical design standard for ServiceNow/Jira/log/CMDB/process evidence used by
Home, Moves, Source, Control Tower, and aVa.

## Purpose

AbarVa must support operational process intelligence without becoming a raw
operational data lake. Operational evidence belongs in the enterprise Context
Layer as normalized, tenant-scoped evidence objects with provenance,
confidence, relationships, and source references. Moves consumes those objects
to create current-state process flows, AI automation opportunity backlogs,
roadmaps, business cases, and executive readouts.

## Current Schema Assessment

| Question | Answer |
|---|---|
| Existing entities that can represent operational evidence | `enterprise_context_sources`, `enterprise_context_source_files`, `enterprise_context_records`, `enterprise_context_facts`, `enterprise_context_relationships`, `enterprise_context_evidence`, `enterprise_context_chunks`, `applications`, `tower_itsm_records`, `tower_jira_issues`, and `program_evidence_items`. |
| Reuse rather than duplicate | Reuse Context Layer source/record/fact/evidence/relationship tables for normalized operational evidence; reuse `applications` for app/CMDB anchors; reuse Tower operational tables as module-specific read models; reuse `program_evidence_items` only for Move readiness coverage. |
| Missing | A typed operational evidence vocabulary for work items, operational events, observed process flows, system-service maps, automation opportunities, human-agent responsibility, value estimates, and generated insights. |
| Structured vs searchable text | IDs, source refs, timestamps, app/service/team, priority/severity/status, cycle time, reopen/handoff/SLA flags, volume/frequency/value/risk scores, owners, evidence refs, confidence, and validation state must be structured. Sanitized descriptions, summaries, impact notes, and generated insights can be searchable text/chunks. Raw payloads stay in source systems or governed object storage by explicit approval. |
| Context Layer vs Moves | Context Layer stores reusable operational evidence, observations, insights, opportunities, and source relationships. Moves stores phase deliverables, gates, decisions, reviews, selected opportunity scope, and artifact versions. |
| Tenant isolation | Every persisted context object remains scoped by `tenant_key` and/or `client_id`; uniqueness includes tenant key; RLS and data-plane adapters must filter by resolved tenant. Cross-tenant benchmark/corpus evidence must be separate from private operational evidence. |
| Raw references vs summaries vs insights | `enterprise_context_sources/source_files` store source pointers; `enterprise_context_records/facts/evidence` store normalized evidence and citations; `enterprise_context_chunks` stores sanitized searchable summaries; `operational_evidence_insight` records generated conclusions with evidence refs; Moves consumes evidence refs and writes deliverable outputs. |
| Confidence/provenance | Use source owner, source system, source record id, source file/sheet/row, evidence pointer, citation label, confidence, freshness, lifecycle state, validation owner/status, and evidence usable flags. |

## Raw Data Boundary

- Do not store full raw ServiceNow/Jira/log payloads by default.
- Store raw source references, external IDs, source links, row/page/cell
  locators, hashes, and sanitized excerpts.
- Store structured metadata and normalized summaries.
- Store aggregated log/event signals rather than full raw logs.
- Store sensitive text only when explicitly approved.
- Redact secrets, tokens, credentials, PHI/PII, and unnecessary free-text
  comments before context commitment.
- Keep ServiceNow, Jira, observability tools, CMDB, and log platforms as the
  source of truth.
- Store enough evidence to reason and trace decisions, not every operational
  record forever.

## Operational Evidence Entities

The following entities are Context Layer concepts. They may initially be stored
as `enterprise_context_records` with `record_type` equal to the entity key,
plus facts, evidence, relationships, and chunks. A later physical schema may
materialize them into dedicated tenant-scoped tables without changing the
contract.

| Entity | Context record type | Purpose |
|---|---|---|
| OperationalEvidenceSource | `operational_evidence_source` | Connected/uploaded source such as ServiceNow, Jira, CMDB, app logs, Splunk, Datadog, Azure Monitor, Excel export. |
| WorkItem | `work_item` | Normalized ServiceNow/Jira-style incident/request/change/problem/story/bug/epic/task. |
| OperationalEvent | `operational_event` | Normalized event/log/alert signal, aggregated and sanitized. |
| ProcessFlowObservation | `process_flow_observation` | Observed movement of work across systems, queues, teams, approvals, and exceptions. |
| SystemServiceMap | `system_service_map` | Relationship between work items/events and applications, CIs, services, processes, owners, and dependencies. |
| AutomationOpportunity | `automation_opportunity` | Candidate AI/automation opportunity grounded in operational evidence. |
| HumanAgentResponsibility | `human_agent_responsibility` | Future-state human vs agent operating model for an opportunity/process step. |
| OpportunityValueEstimate | `opportunity_value_estimate` | Value, cost, effort, cycle-time, rate-card, and finance-validation estimate for an opportunity. |
| OperationalEvidenceInsight | `operational_evidence_insight` | Generated insight such as bottleneck, duplicate work, knowledge gap, release risk, or automation candidate. |

## Evidence Subtypes

Operational evidence maps into these reusable Context/Move evidence subtypes:

- `ticket_evidence`
- `delivery_evidence`
- `observability_evidence`
- `process_evidence`
- `automation_opportunity_evidence`
- `control_evidence`
- `value_evidence`
- `ownership_evidence`

## Moves Archetype

Add/recognize the Move archetype:

`ai_opportunity_discovery_process_intelligence`

Purpose: analyze operational evidence from ServiceNow, Jira, logs, CMDB, and
application inventory to identify AI automation opportunities, process
bottlenecks, and a 90-day pilot roadmap.

## Moves Consumption Contract

| Phase | Required behavior |
|---|---|
| Intake | Capture target process/domain, sources available, data access mode, time period, business owner, IT owner, risk/compliance constraints, desired opportunity types, and expected value outcomes. |
| Evidence readiness | Score ServiceNow/work item evidence, Jira/delivery evidence, app/log/observability evidence, CMDB/app inventory evidence, process context, ownership/team context, KPI/value baseline, adoption/change context, security/privacy constraints, and rate-card/effort assumptions. |
| P2 Discovery | Generate current-state process flow, work volume analysis, bottleneck map, handoff/rework analysis, recurring incident/delivery pattern analysis, works/breaks/implications, and data-quality/evidence-confidence view. |
| P3 Options | Generate automation option categories, human-agent alternatives, assist/recommend/approval/automation levels, risk/feasibility/value comparison, and recommended pilot candidates. |
| P3 Architecture | Generate operational evidence architecture, human-agent process architecture, ServiceNow/Jira/log integration pattern, security/privacy/control pattern, and agent orchestration/human-in-loop model. |
| P4 Roadmap | Generate 90-day pilot roadmap, opportunity backlog, data/connectivity foundation, governance/control setup, pilot waves, adoption/change plan, and value realization gates. |
| P4 Business Case | Generate opportunity-level value estimates, effort savings, cycle-time reduction, incident/rework reduction, human vs agent cost impact, implementation/run-cost estimate, rate-card assumptions, and finance validation status. |
| P5 Handoff | Generate AI automation backlog, opportunity owners, human-agent control model, pilot execution plan, measurement contract, risk/control register, and next 30/60/90 days. |

## aVa Response Contract

When answering operational process intelligence questions, aVa must show:

- Pattern found.
- Evidence.
- Business impact.
- AI opportunity.
- Human-in-loop design.
- Value estimate.
- Risk/feasibility score.
- Recommended next action.

Examples include: where work is stuck, which tickets repeat, which apps create
avoidable work, which Jira patterns show duplication, which logs correlate with
recurring incidents, which opportunities are highest value, what should be
automated first, and what requires human approval.

## Acceptance Criteria

- Operational evidence fits Context Layer rather than a Moves-only blob.
- Raw source boundaries are explicit and enforced.
- ServiceNow/Jira/log/app inventory data can be normalized into reusable
  evidence.
- Moves can generate process flows and AI opportunity backlogs from Context
  Layer evidence.
- aVa can explain opportunities with evidence and value.
- Sensitive data, PII/PHI, and secrets handling are addressed.
- Tenant isolation is preserved.
- Traceability runs from source record to insight to opportunity to roadmap to
  business case.
- The design supports a Morgan Street pilot and future tenants.
