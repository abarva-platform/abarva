# Meridian / PHS AI Strategy Demo Plan

Date: 2026-06-05
Status: Draft for review and approval
Primary use: Human approval packet and downstream prompting source

## 1. Decision

Build the Meridian Healthcare demo around a Presbyterian Healthcare Services-inspired AI strategy and Azure Databricks modernization program focused on clinical performance and population health.

The demo should not pretend that a late-stage opportunity is real unless the prior-stage artifacts, evidence, gates, and approvals are also real. For this storyline, the cleanest path is:

1. Start in Moves as an AI strategy / modernization program.
2. Show Source only when a procurement motion is needed, such as selecting an implementation partner, analytics SI, managed services partner, or data platform modernization partner.
3. Keep the first approved demo at Strategy / Architecture / Business Case stage, not BAFO or Value, until the full artifact chain has been materialized.

## 2. Public Context To Ground The Demo

These are public facts to ground the synthetic Meridian / PHS demo. They should be loaded as public evidence, not presented as confidential client data.

| Source fact | Why it matters for the demo | Public source |
|---|---|---|
| Presbyterian Healthcare Services is an integrated New Mexico payer-provider with nine hospitals, 900+ providers, and a statewide health plan, serving about one in three New Mexicans. | Makes the plan-plus-provider storyline credible. The value case should bridge member outcomes, care delivery, and operating margin. | https://www.phs.org/about-us |
| Presbyterian's own community health materials emphasize health equity, access, food as medicine, vaccine outreach, community health workers, and chronic disease management. | Supports a population health use case rather than a generic IT modernization pitch. | https://www.abq.org/wp-content/uploads/2023/12/presbyterian-central-new-mexico-community-health-implementation-plan-2023-2025.pdf |
| Presbyterian Health Plan's 2026 rate transparency filing projected a 27.1% overall rate increase and cited 2024 paid claims experience, care-management savings, payment integrity, morbidity, rebates, and trend assumptions. | Gives the business case real economic texture: claims trend, utilization, care management effectiveness, payment integrity, and member mix. | https://www.osi.state.nm.us/wp-content/uploads/2025/08/Presbyterian-Health-Plan-Rate-Transparency-Report.pdf |
| The same filing reports estimated commercial medical loss ratios of 120.0% for 2024, 100.2% for 2023, and 93.9% for 2022. | Supports the plan-side urgency: a stronger analytics and intervention operating model should target avoidable utilization, quality gaps, and payment accuracy. | https://www.osi.state.nm.us/wp-content/uploads/2025/08/Presbyterian-Health-Plan-Rate-Transparency-Report.pdf |
| Presbyterian publishes 2026 Medicare Star Ratings documents for Presbyterian Health Plan and its D-SNP plan, with CMS star ratings positioned as a comparison of quality and performance. | Supports a quality / Stars improvement narrative without overclaiming specific private performance drivers. | https://onbaseext.phs.org/PEL/DisplayDocument?ContentID=OB_000000042705 and https://onbaseext.phs.org/PEL/DisplayDocument?ContentID=OB_000000042706 |
| Recent ratings/news coverage describes operating pressure, rating downgrades, weak cash flow, labor and medical cost pressure, and strong Albuquerque market position. | Makes the value proposition balanced: margin pressure plus market strength equals a credible transformation window. | https://www.spglobal.com/ratings/en/regulatory/article/-/view/sourceId/101677751 and https://www.beckershospitalreview.com/finance/fitch-downgrades-presbyterian-healthcare-services-credit-rating/ |

## 3. Recommended Demo Storyline

Recommended name:
Meridian Health - AI-Enabled Population Health and Clinical Performance Command Center

Northstar question:
How should an integrated New Mexico payer-provider use Azure Databricks, governed AI, and human-led operating routines to improve Stars, chronic disease outcomes, care-gap closure, avoidable utilization, and margin performance?

Why this is the right use case:

- It uses both sides of an integrated system: health plan data and provider delivery data.
- It avoids a generic "AI strategy" story by anchoring in care gaps, utilization, Stars, chronic disease, payment integrity, and operational worklists.
- It naturally requires a Databricks architecture: lakehouse, Unity Catalog, ML feature store, model monitoring, governed PHI access, cross-domain data products, and audit trails.
- It gives AbarVa something differentiated to show: not only documents, but an operating model with evidence, decisions, approvals, and value realization.

## 4. Stage Alignment

For the first credible demo, stage the program at Architecture / Business Case Readiness, not late execution.

| Surface | Recommended visible stage | Why |
|---|---|---|
| Moves | Phase 3 - Architecture and Business Case Review | Lets us show strategy, evidence, architecture options, workload inventory, value model, and human approvals without pretending implementation is complete. |
| Source | Strategy or Scope only, unless procurement is explicitly part of the story | Source should be used only if Meridian is selecting a Databricks implementation partner, managed services provider, or analytics SI. |
| Value | Baseline and forecast only | We can show modeled value and approved assumptions, but not realized outcomes unless synthetic post-go-live measurement artifacts are created and labeled. |
| Setup/Admin | Evidence loader and artifact materialization cockpit | This is where current-state inventory, workload baselines, rate cards, rate filings, public evidence, and synthetic internal artifacts get loaded. |

Do not show BAFO, Selection, Transition, or Value Realization until prior phases are materialized and auditable.

## 5. Deliverable Contract

Every artifact must have a purpose, input evidence, approval owner, "what good looks like", and persistence expectation.

| Phase | Artifact | Purpose / outcome | Core inputs | What good looks like | Preload vs live generation | Human approval |
|---|---|---|---|---|---|---|
| 0. Setup | Evidence Register | Creates the factual spine for all downstream AI answers and documents. | Public sources, workshop notes, workload inventory, rate card, data platform baseline. | Every claim has source, owner, confidence, scope, and sensitivity classification. No orphan facts. | Preload. | Data steward accepts evidence set. |
| 0. Setup | Current-State Workload Inventory | Shows what workloads, data domains, reports, pipelines, and analytics assets exist today. | Synthetic CMDB, claims analytics catalog, Epic/Cerner extracts, quality reporting inventory, finance/actuarial reports. | Categorized by domain, owner, freshness, PHI level, modernization path, and business criticality. | Preload through Setup/Admin loader. | CIO delegate and data platform owner. |
| 0. Setup | Rate Card and Estimation Model | Lets AbarVa estimate humans vs agents, SI effort, platform cost, and internal lift. | Loaded rate cards, role model, delivery velocity assumptions. | Role-based estimates with assumptions, ranges, and sensitivity. No single false-precision number. | Preload. | Finance reviewer. |
| 1. Strategy | AI Strategy Memo | States the executive answer: what to do, why now, and what value is at stake. | Public PHS context, Meridian workshop notes, quality/Stars baseline, claims pressure, current analytics pain points. | One-page executive answer, clear recommendation, 3-5 strategic bets, evidence-cited risks, named human owner. | Generate live from loaded evidence. | CIO / Chief Data and Analytics leader. |
| 1. Strategy | Population Health Opportunity Map | Selects the first clinical performance use cases. | Care-gap inventory, chronic disease cohorts, utilization hot spots, Stars measures, provider operations constraints. | Prioritized use cases by value, feasibility, data readiness, risk, and clinical ownership. | Generate live, then approve. | Clinical quality owner and plan quality owner. |
| 1. Strategy | Decision Principles | Defines where agents can recommend vs where humans decide. | Responsible AI policy, governance model, use-case risk levels. | Simple RACI: agent recommends, human approves, system logs. Explicit no-autonomous-clinical-action rule. | Generate live. | Compliance / clinical governance. |
| 2. Current State | Data and Analytics Baseline | Explains current data architecture and pain points. | Workload inventory, platform assessment, pipeline catalog, BI/reporting list. | Shows data domains, latency, quality gaps, duplicate pipelines, access controls, and modernization blockers. | Preload structured data; generate narrative live. | Data platform owner. |
| 2. Current State | Lift / Shift / Modernize Baseline | Decides migration path by workload. | Workload inventory, cost/performance profile, technical debt, business priority. | Each workload has disposition: retire, retain, rehost, refactor, rebuild, or modernize on Databricks. | Generate live from inventory. | Architecture review board. |
| 2. Current State | Data Quality and Trust Assessment | Prevents AI strategy from floating above bad data. | Completeness, timeliness, identity resolution, attribution, coding quality, claims lag. | Measure-by-measure trust score with remediation owner and threshold for AI use. | Generate live. | Data governance. |
| 3. Architecture | Azure Databricks Target Architecture | Shows the operating platform. | Existing Azure posture, Databricks patterns, domain model, PHI constraints. | Includes lakehouse zones, Unity Catalog, Delta Sharing, MLflow, feature store, model monitoring, RBAC, PHI controls, audit. | Generate live, with diagram. | Architecture review board. |
| 3. Architecture | Data Product Map | Defines reusable data products. | Claims, encounters, ADT, HEDIS/Stars, care management, pharmacy, SDOH, provider roster. | Data products have owner, SLA, consumers, lineage, quality gates, and security classification. | Generate live. | Data product council. |
| 3. Architecture | Agent Operating Model | Defines how AI recommendations are created, reviewed, and acted on. | Use-case map, risk levels, workflow design. | Every agent output has evidence citations, confidence, required human approval, audit trace, and rollback path. | Generate live. | Clinical governance and compliance. |
| 4. Business Case | Value Case | Makes the investment decision. | Claims trend, rate filing factors, use-case impact model, cost estimates, rate cards. | Separates hard savings, quality revenue, avoided cost, productivity, and risk-adjusted confidence. Includes low/base/high. | Generate live from evidence and rate cards. | CFO / finance reviewer. |
| 4. Business Case | Mobilization Plan | Turns strategy into first 90 days. | Architecture, use cases, resource model, dependencies. | 30/60/90 plan with named workstreams, owners, deliverables, dependencies, gates, and decision dates. | Generate live. | Program sponsor. |
| 4. Business Case | Humans vs Agents Recommendation | Shows what humans own and what agents accelerate. | RACI, workflow inventory, risk model, role rates. | No replacement theater. Shows augmentation, review queues, quality controls, and workload capacity effects. | Generate live. | Sponsor and HR/operations if needed. |
| 5. Approval | Executive Decision Brief | Captures the decision to proceed, pause, or narrow scope. | All prior artifacts, evidence register, value case, architecture risks. | One answer first, not a document dump. Recommendation, economics, risk, required approvals, next move. | Generate live after artifacts exist. | Named executive sponsor. |
| 5. Approval | Approval Record | Makes the demo trustworthy. | Decision brief, approval note, named person, timestamp. | Named approver, decision, rationale, conditions, and audit trail. No anonymous approval. | Human-clicked in demo or pre-seeded with synthetic named approver. | Executive sponsor. |

## 6. What Gets Loaded vs Generated Live

| Type | Load before demo | Generate during demo | Reason |
|---|---:|---:|---|
| Public PHS evidence | Yes | No | Public facts should already be cited and trusted. |
| Synthetic current-state workload inventory | Yes | No | The demo needs real rows, not generated hallucination. |
| Synthetic data quality baseline | Yes | Optional narrative only | Scores and gaps should be inspectable. |
| Synthetic rate card | Yes | No | Estimates need repeatability. |
| Databricks pattern pack | Yes | Optional selection / tailoring | The system should tailor proven patterns, not invent architecture. |
| Strategy memo | Optional preload | Yes | Good live moment if evidence is loaded first. |
| Architecture options | Optional preload | Yes | Good live moment if pattern pack and inventory exist. |
| Business case | Optional preload | Yes | Best live moment because it proves rate cards and evidence binding. |
| Approval record | Optional synthetic preload | Yes, if demo operator available | Human approval is the trust moment. |
| Realized value | No unless clearly synthetic future-state | No | Do not fake achieved outcomes. Use forecast only. |

## 7. Data And Evidence Model For Setup/Admin Loader

The Setup/Admin loader should create these governed objects before the demo:

| Object | Required fields |
|---|---|
| Client evidence item | title, source_url or storage_path, source_type, owner, evidence_date, sensitivity, confidence, summary, usable_by_surface, citation_key |
| Uploaded artifact | display_name, artifact_type, phase, owner, storage_path, parse_status, approval_status, sensitivity, source_evidence_ids |
| Workload record | workload_name, domain, current_platform, data_sources, PHI_level, owner, business_criticality, modernization_disposition, effort_size, risk |
| Rate card row | role, internal_or_external, location, hourly_rate, utilization_assumption, source, effective_date |
| Gate criterion | phase, criterion, blocker_level, required_evidence, owner, status, waiver_allowed |
| Approval record | artifact_id, approver_name, role, decision, note, timestamp, conditions |

Minimum integrity rule:
If a stage is shown as complete, all prior-stage required artifacts must be persisted, parseable, linked to evidence, and either approved or explicitly waived by a named human.

## 8. Responsible AI Approval Pattern

AbarVa should make AI useful without making governance painful.

| Moment | Agent can do | Human must do | UX rule |
|---|---|---|---|
| Evidence synthesis | Summarize, cite, flag gaps. | Accept evidence set or mark gaps. | One accept button plus gap notes. |
| Artifact draft | Draft from approved evidence only. | Review, edit, approve, or reject. | Draft is visibly not externally usable. |
| Business case | Compute ranges from approved assumptions. | Approve assumptions and chosen scenario. | Assumptions are editable, not hidden. |
| Clinical / population health recommendation | Recommend worklist logic and intervention opportunity. | Approve clinical policy and operational use. | No autonomous clinical action. |
| External communication | Draft email or memo. | Copy/send through existing channel. | No direct send unless channel is configured and approved. |
| Stage advancement | Recommend readiness. | Promote stage with reason. | Promotion requires named reason when blockers exist. |

## 9. Prompting Contract

Use this section as the master prompt frame for agents generating Meridian / PHS demo artifacts.

### System posture

You are AbarVa Sentinel supporting a Meridian Health demo inspired by public Presbyterian Healthcare Services context. You are not claiming access to Presbyterian confidential data. You must distinguish public evidence, synthetic internal demo evidence, and generated recommendations. Every material claim must cite evidence. If the evidence is missing, say what is missing and draft the request for it.

### Grounding inputs

Always load these before drafting:

- Client name and demo tenant.
- Visible phase and stage.
- Artifact type and target audience.
- Approved evidence items with citation keys.
- Workload inventory rows relevant to the artifact.
- Rate card rows if estimates are requested.
- Current gate blockers.
- Human approval owner.

### Output rules

1. Lead with the decision or next action.
2. Separate facts from assumptions.
3. Cite exact evidence keys for material claims.
4. Do not invent realized outcomes.
5. Do not fabricate confidential PHS data.
6. Use Azure Databricks patterns only where the current-state workload inventory supports them.
7. Flag missing evidence as a request, not as filler.
8. End with the approval action required.

### Artifact prompt template

```
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
- Recommend human approval owner and next action.
- Write at the level a top-tier consulting partner would sign.
```

## 10. First Build Backlog

| Priority | Backlog item | Done when |
|---|---|---|
| P0 | Meridian demo audit | We have a table of all Meridian Moves/Source rows, their visible stage, persisted artifacts, usable evidence, gates, approvals, and show/do-not-show recommendation. |
| P0 | Evidence loader pack | Public PHS sources, synthetic workload inventory, rate card, and pattern pack are loaded with citation keys. |
| P0 | Artifact gold-standard library | Every required artifact has an outline, acceptance rubric, evidence requirements, approval owner, and sample best-in-class draft. |
| P0 | Materializer script | It creates persisted artifact files in the correct storage path and DB records, not inline placeholders. |
| P0 | Browser QA crawl | Clicking every visible artifact opens content, downloads work or gracefully disable, and no blank pages appear. |
| P1 | Live generation harness | OpenAI-only generation can produce Strategy Memo, Target Architecture, Value Case, and Mobilization Plan from loaded evidence. |
| P1 | Approval workflow | Drafts cannot become externally usable without named human approval. |
| P1 | Value ledger | Baseline and forecast are linked to approved assumptions and rate cards. |

## 11. Review Questions For Approval

1. Should the first Meridian demo be framed as Moves-only, or Moves plus a Source procurement motion for selecting a Databricks implementation partner?
2. Should the visible stage be Architecture / Business Case Review, or should we build the complete chain needed to show a later stage?
3. Which use case should be the hero: Stars improvement, chronic disease / diabetes performance, avoidable ED utilization, payment integrity, or care-management productivity?
4. Which approval persona should be used in the demo: CIO, CDAO, CFO, Chief Medical Officer, or plan quality leader?
5. Should realized value be omitted entirely, or shown as clearly labeled synthetic future-state evidence?

## 12. Initial Recommendation

Approve this plan with these defaults:

- Hero use case: Population Health and Clinical Performance Command Center.
- Architecture: Azure Databricks lakehouse with Unity Catalog, MLflow, feature store, model monitoring, and governed PHI access.
- Visible stage: Moves Phase 3 - Architecture and Business Case Review.
- Source role: Optional follow-on for Databricks SI / managed services partner selection, starting at Strategy or Scope.
- Live generation moments: Strategy Memo, Target Architecture, Value Case, Mobilization Plan.
- Preloaded evidence: Public PHS evidence, synthetic current-state workload inventory, rate card, data quality baseline, Databricks pattern pack.
- Approval owner: CDAO for strategy and architecture; CFO for value case; clinical quality leader for population health logic.

