# Artifact Contracts

**Status:** draft contracts for downstream materialization
**Scope:** Meridian Health synthetic demo inspired by public PHS context
**Primary visible phase:** Moves Phase 3 - Architecture and Business Case Review
**Source role:** optional follow-on only for Databricks SI, managed services, analytics SI, or implementation partner procurement

Every artifact in this package must have a purpose, input evidence, approval owner, acceptance bar, persistence expectation, and generation posture. If the artifact is not persisted, parseable, evidence-linked, and approved or explicitly waived by a named human, the UI should not represent its stage as complete.

## Contract Rules

1. Material claims must cite evidence keys.
2. Public PHS facts, synthetic Meridian evidence, and generated recommendations must be labeled separately.
3. No generated artifact can claim realized outcomes.
4. No artifact can fabricate confidential PHS data.
5. Azure Databricks patterns can be recommended only where the current-state workload inventory supports them.
6. Human approval is required before external use.
7. Missing evidence becomes an evidence request, not filler language.
8. Generation should use OpenAI-only paths when this design package becomes executable.

## Required Loader Objects

| Object | Required fields | Demo requirement |
|---|---|---|
| Client evidence item | `title`, `source_url` or `storage_path`, `source_type`, `owner`, `evidence_date`, `sensitivity`, `confidence`, `summary`, `usable_by_surface`, `citation_key` | Every public or synthetic claim must resolve to evidence. |
| Uploaded artifact | `display_name`, `artifact_type`, `phase`, `owner`, `storage_path`, `parse_status`, `approval_status`, `sensitivity`, `source_evidence_ids` | Artifacts shown in Moves must open or gracefully explain unavailable state. |
| Workload record | `workload_name`, `domain`, `current_platform`, `data_sources`, `PHI_level`, `owner`, `business_criticality`, `modernization_disposition`, `effort_size`, `risk` | Architecture and modernization recommendations must be row-backed. |
| Rate card row | `role`, `internal_or_external`, `location`, `hourly_rate`, `utilization_assumption`, `source`, `effective_date` | Business case estimates must be repeatable and auditable. |
| Gate criterion | `phase`, `criterion`, `blocker_level`, `required_evidence`, `owner`, `status`, `waiver_allowed` | Stage readiness must be explicit. |
| Approval record | `artifact_id`, `approver_name`, `role`, `decision`, `note`, `timestamp`, `conditions` | Approval is the trust moment, not a decorative badge. |

Minimum integrity rule:

If a stage is shown as complete, all prior-stage required artifacts must be persisted, parseable, linked to evidence, and either approved or explicitly waived by a named human.

## Artifact Matrix

| Phase | Artifact | Generation posture | Approval owner | Surface |
|---|---|---|---|---|
| Setup | Evidence Register | Preload | Data steward | Setup/Admin, Moves evidence drawer |
| Setup | Current-State Workload Inventory | Preload | CIO delegate | Setup/Admin, Moves current state |
| Setup | Rate Card and Estimation Model | Preload | Finance reviewer | Setup/Admin, Value |
| Strategy | AI Strategy Memo | Generate live from approved evidence | CIO / CDAO | Moves |
| Strategy | Population Health Opportunity Map | Generate live from approved evidence | Clinical quality and plan quality | Moves |
| Strategy | Decision Principles | Generate live | Compliance / governance | Moves |
| Current State | Data and Analytics Baseline | Preload structured data; generate narrative | Data platform owner | Moves |
| Current State | Lift / Shift / Modernize Baseline | Generate live from inventory | Architecture review board | Moves |
| Current State | Data Quality and Trust Assessment | Generate live | Data governance | Moves |
| Architecture | Azure Databricks Target Architecture | Generate live | Architecture review board | Moves |
| Architecture | Data Product Map | Generate live | Data product council | Moves |
| Architecture | Agent Operating Model | Generate live | Clinical governance and compliance | Moves |
| Business Case | Value Case | Generate live from evidence and rate cards | CFO | Moves, Value |
| Business Case | Mobilization Plan | Generate live | Program sponsor | Moves |
| Business Case | Humans vs Agents Recommendation | Generate live | Sponsor and operations | Moves |
| Approval | Executive Decision Brief | Generate after prior artifacts exist | Executive sponsor | Moves |
| Approval | Approval Record | Human-clicked or pre-seeded synthetic approval | Executive sponsor | Moves, audit trail |

## Contract Details

### Evidence Register

**Purpose:** Create the factual spine for downstream AI answers and documents.

**Core inputs:** Public PHS evidence keys, synthetic workshop notes, workload inventory, rate card, data platform baseline.

**Acceptance bar:**

- Every claim has source, owner, confidence, scope, and sensitivity classification.
- Public PHS evidence is not mislabeled as confidential client evidence.
- No orphan facts appear in generated artifacts.

**Persistence:** Preloaded through Setup/Admin.

**Approval:** Data steward accepts evidence set or marks gaps.

### Current-State Workload Inventory

**Purpose:** Show what workloads, data domains, reports, pipelines, and analytics assets exist today.

**Core inputs:** Synthetic CMDB, claims analytics catalog, EHR extracts, quality reporting inventory, finance/actuarial reports.

**Acceptance bar:**

- Rows are categorized by domain, owner, freshness, PHI level, modernization path, and business criticality.
- Databricks recommendations can point to specific workload rows.
- Missing or weak inventory areas produce evidence requests.

**Persistence:** Preloaded through Setup/Admin loader.

**Approval:** CIO delegate and data platform owner.

### Rate Card And Estimation Model

**Purpose:** Estimate human effort, agent acceleration, SI effort, platform costs, and internal lift.

**Core inputs:** Loaded rate cards, role model, delivery velocity assumptions, source and effective date.

**Acceptance bar:**

- Estimates use role-based ranges and sensitivity, not false precision.
- Assumptions are visible and editable.
- Low/base/high scenarios are available for the value case.

**Persistence:** Preloaded.

**Approval:** Finance reviewer.

### AI Strategy Memo

**Purpose:** Give executives the answer: what to do, why now, and what value is at stake.

**Core inputs:** Public PHS context, synthetic Meridian workshop notes, quality/Stars baseline, claims pressure, analytics pain points.

**Acceptance bar:**

- One-page executive answer with a clear recommendation.
- Three to five strategic bets.
- Evidence-cited risks and assumptions.
- Named human owner and next approval action.

**Persistence:** Generated live from approved evidence, then saved as artifact.

**Approval:** CIO / CDAO.

### Population Health Opportunity Map

**Purpose:** Select the first clinical performance use cases.

**Core inputs:** Care-gap inventory, chronic disease cohorts, utilization hot spots, Stars measures, provider operations constraints.

**Acceptance bar:**

- Use cases are prioritized by value, feasibility, data readiness, risk, and clinical ownership.
- Public context is clearly separated from synthetic Meridian data.
- No autonomous clinical action is implied.

**Persistence:** Generated live, then approved.

**Approval:** Clinical quality owner and plan quality owner.

### Decision Principles

**Purpose:** Define where agents can recommend and where humans decide.

**Core inputs:** Responsible AI policy, governance model, use-case risk levels.

**Acceptance bar:**

- Simple RACI: agent recommends, human approves, system logs.
- Explicit no-autonomous-clinical-action rule.
- External communication requires human send/copy through approved channels.

**Persistence:** Generated live, then saved.

**Approval:** Compliance / clinical governance.

### Data And Analytics Baseline

**Purpose:** Explain the current architecture and blockers that affect AI readiness.

**Core inputs:** Workload inventory, platform assessment, pipeline catalog, BI/reporting list.

**Acceptance bar:**

- Shows data domains, latency, quality gaps, duplicate pipelines, access controls, and modernization blockers.
- Structured facts are row-backed.
- Narrative cites evidence keys and inventory IDs.

**Persistence:** Preload structured data; generate narrative live.

**Approval:** Data platform owner.

### Lift / Shift / Modernize Baseline

**Purpose:** Decide migration path by workload.

**Core inputs:** Workload inventory, cost/performance profile, technical debt, business priority.

**Acceptance bar:**

- Every workload has a disposition: retire, retain, rehost, refactor, rebuild, or modernize on Databricks.
- Recommended dispositions cite row IDs and assumptions.
- High-risk dispositions identify approval owner.

**Persistence:** Generated live from inventory.

**Approval:** Architecture review board.

### Data Quality And Trust Assessment

**Purpose:** Prevent AI strategy from floating above unreliable data.

**Core inputs:** Completeness, timeliness, identity resolution, attribution, coding quality, claims lag.

**Acceptance bar:**

- Measure-by-measure trust score.
- Remediation owner and threshold for AI use.
- Explicit block or waiver for low-trust inputs.

**Persistence:** Generated live from loaded baseline.

**Approval:** Data governance.

### Azure Databricks Target Architecture

**Purpose:** Show the operating platform for governed population health AI.

**Core inputs:** Existing Azure posture, Databricks patterns, domain model, PHI constraints.

**Acceptance bar:**

- Includes lakehouse zones, Unity Catalog, Delta Sharing where relevant, MLflow, feature store, model monitoring, RBAC, PHI controls, and audit.
- Architecture choices cite inventory rows and approved patterns.
- Diagram or structured architecture view is generated and saved.

**Persistence:** Generated live, then saved as artifact.

**Approval:** Architecture review board.

### Data Product Map

**Purpose:** Define reusable data products for population health and clinical performance.

**Core inputs:** Claims, encounters, ADT, HEDIS/Stars, care management, pharmacy, SDOH, provider roster.

**Acceptance bar:**

- Data products have owner, SLA, consumers, lineage, quality gates, and security classification.
- PHI classification is visible.
- Consumers and governance owners are named.

**Persistence:** Generated live.

**Approval:** Data product council.

### Agent Operating Model

**Purpose:** Define how AI recommendations are created, reviewed, acted on, and audited.

**Core inputs:** Use-case map, risk levels, workflow design.

**Acceptance bar:**

- Every agent output has evidence citations, confidence, required human approval, audit trace, and rollback path.
- Clinical recommendations remain recommendations until a named human approves policy and operational use.
- Stage advancement requires reason and gate status.

**Persistence:** Generated live.

**Approval:** Clinical governance and compliance.

### Value Case

**Purpose:** Support an investment decision.

**Core inputs:** Claims trend, public rate filing factors, synthetic use-case impact model, cost estimates, rate cards.

**Acceptance bar:**

- Separates hard savings, quality revenue, avoided cost, productivity, and risk-adjusted confidence.
- Includes low/base/high scenarios.
- Shows assumptions and evidence keys.
- Does not claim realized outcomes.

**Persistence:** Generated live from evidence and rate cards.

**Approval:** CFO / finance reviewer.

### Mobilization Plan

**Purpose:** Turn strategy into the first 90 days of action.

**Core inputs:** Target architecture, priority use cases, resource model, dependencies, gate criteria.

**Acceptance bar:**

- 30/60/90 plan with named workstreams, owners, deliverables, dependencies, gates, and decision dates.
- Current blockers are visible.
- Human approval owner is explicit.

**Persistence:** Generated live.

**Approval:** Program sponsor.

### Humans Vs Agents Recommendation

**Purpose:** Show what humans own and what agents accelerate.

**Core inputs:** RACI, workflow inventory, risk model, role rates.

**Acceptance bar:**

- No replacement theater.
- Shows augmentation, review queues, quality controls, and workload capacity effects.
- Estimates tie to rate cards and approved assumptions.

**Persistence:** Generated live.

**Approval:** Sponsor and operations.

### Executive Decision Brief

**Purpose:** Capture the proceed, pause, or narrow-scope recommendation.

**Core inputs:** Prior artifacts, evidence register, value case, architecture risks, gate status.

**Acceptance bar:**

- One answer first.
- Includes recommendation, economics, risk, required approvals, and next move.
- Shows dissent, assumptions, and open evidence requests.

**Persistence:** Generated only after prior artifacts exist.

**Approval:** Executive sponsor.

### Approval Record

**Purpose:** Make the demo trustworthy and auditable.

**Core inputs:** Decision brief, approval note, named person, timestamp.

**Acceptance bar:**

- Named approver, decision, rationale, conditions, timestamp, and audit trail.
- No anonymous approval.
- Waivers identify blocker, owner, condition, and expiration.

**Persistence:** Human-clicked in demo or pre-seeded with synthetic named approver.

**Approval:** Executive sponsor.

## Prompt Template Contract

Use this frame for any generated artifact:

```text
Draft {artifact_name} for {client_name}.

Visible phase: {phase}
Audience: {audience}
Decision to support: {decision}

Approved evidence:
{evidence_list}

Current-state workload inventory:
{workload_inventory}

Rate cards and estimation assumptions:
{rate_card_context}

Open gates and missing evidence:
{gate_context}

Rules:
- Material claims must cite evidence keys.
- Separate public facts, synthetic demo evidence, and assumptions.
- Do not claim realized outcomes.
- Do not fabricate confidential PHS data.
- Use Azure Databricks patterns only where the current-state workload inventory supports them.
- Recommend human approval owner and next action.
- Write at the level a top-tier consulting partner would sign.
```

## TODOs Requiring Evidence Or Loader Proof

| TODO | Required before artifact is demo-proof |
|---|---|
| Load `PHS-PUBLIC-001` through `PHS-PUBLIC-006` | Evidence rows with citation keys, source URLs, sensitivity, confidence, and owner. |
| Materialize current-state workload inventory | Inspectable rows with workload IDs, domains, owners, PHI level, and modernization disposition. |
| Materialize data quality baseline | Measure rows with scores, thresholds, remediation owners, and waiver rules. |
| Materialize population health opportunity inputs | Synthetic care-gap, chronic disease, utilization, Stars, and provider-operation rows. |
| Materialize rate card and estimation model | Role rates, effective dates, utilization assumptions, source labels, and scenario rules. |
| Materialize Databricks pattern pack | Approved pattern IDs, applicability criteria, and architecture references. |
| Materialize gate criteria | Phase gates with blocker level, required evidence, owner, status, and waiver policy. |
| Materialize approval personas and records | Named synthetic approvers, roles, decisions, conditions, and timestamps. |
| Prove artifact storage and parseability | Storage paths, parse status, source evidence IDs, and artifact open/download behavior. |
