# AbarVa Source / IT Sourcing Product Requirements and Experience Design Dossier

_Version 1.0 | Execution-grade product, design, data binding, agent context, artifact, upload, review, approval, and implementation gap specification_

> **Scope is limited to technology and IT sourcing only. This document does not define a general procurement platform.**

This dossier consolidates the product requirements, step-by-step experience design, data binding needs, agent context requirements, training and grounding needs, artifact generation requirements, upload and evidence handling requirements, review and approval requirements, and implementation gaps for AbarVa Source. It is intended for product leadership, design, engineering, QA, and Codex/Claude build orchestration. It is written as an implementation-oriented design document rather than a backlog index.

AbarVa Source should feel like a governed technology sourcing operating workspace. The user should not feel that they are using a chatbot, a generic dashboard, or a static RFP checklist. The experience should make the sourcing pursuit legible, evidence-aware, commercially intelligent, and action-oriented at each stage.


|Document area|Purpose|

|---|---|

|Product requirements|Defines what Source must do and what it must not do.|

|Experience design|Defines the pages, zones, agent behavior, context-used surfaces, actions, and stage flows.|

|Data binding|Defines what each UI element needs today as seed data and tomorrow as real data.|

|Agent intelligence|Defines what Nexus, Sentinel, Steward, and Atlas must know and how they should respond.|

|Artifacts and approvals|Defines deliverables, review states, upload expectations, evidence states, and gate behavior.|

|Implementation gaps|Defines what is built, partial, planned, and intentionally deferred.|




---


# Table of Contents

- 1. Executive Summary and Product Thesis

- 2. Product Goals and Non-Goals

- 3. Personas and Decision Needs

- 4. Canonical 11-Step IT Sourcing Process

- 5. Detailed Step Design Sheets

- 6. Page and Route Requirements

- 7. Agent Behavior Requirements

- 8. Agent Context and Training Requirements

- 9. Data Binding Catalog

- 10. Artifact, Upload, Review, and Approval Requirements

- 11. Cross-Surface Requirements

- 12. Implementation Status and Gaps

- 13. QA and Acceptance Criteria

- 14. Codex Implementation Guidance

- 15. Appendices


---


# 1. Executive Summary and Product Thesis

AbarVa Source is a technology and IT sourcing operating workspace for complex enterprise sourcing events. It helps teams frame the sourcing strategy, define scope, prepare RFP/RFI materials, manage vendor responses, normalize pricing, detect commercial traps, prepare BAFO negotiations, brief executives, determine selection readiness, plan transition, and track value realization. The product is built around the idea that sourcing decisions are not merely procurement events; they are transformation decisions with evidence, operational, commercial, risk, and executive consequences.

The product is intentionally limited to technology and IT sourcing. It is designed for sourcing pursuits such as Application Managed Services, Infrastructure Managed Services, Data Platform Managed Services, Cloud Operations, Cybersecurity Services, ERP and enterprise platform services, digital engineering partner selection, and AI or data modernization SI selection. It should not attempt to cover facilities, HR services, legal services, marketing agencies, commodity purchasing, travel, manufacturing, or general indirect spend unless a future explicit product decision expands scope.

The strategic wedge is technology sourcing excellence. Technology sourcing requires application inventories, service levels, ticket volumes, operational baselines, transition plans, security requirements, retained roles, knowledge transfer expectations, commercial assumptions, and evidence-backed executive tradeoffs. Generic procurement tooling rarely understands these operating details. AbarVa Source should make these details first-class, visible, and agent-interpretable.

Source is not a chatbot. Agents appear because they have work to do. Nexus guides the stage and next action. Sentinel validates evidence and detects unsupported claims. Steward controls gates, approval posture, data readiness, and auditability. Atlas turns the sourcing event into an executive value/risk brief. The user should feel that the agents are reading the current work object, understanding the stage, and surfacing the next best move rather than answering isolated prompts.

Source is not an RFP generator alone. RFP readiness is only one stage in a wider workflow. A defensible RFP depends on scope clarity, data readiness, pricing template completeness, evidence confidence, scorecard governance, and approval posture. The product should prevent the common enterprise failure mode where teams issue an RFP before the scope and data are priceable, then spend months untangling incomparable responses.

Source is not a spreadsheet scorecard. Scoring is necessary, but not sufficient. AbarVa must show why vendors are comparable or not comparable, which assumptions create commercial risk, whether automation claims are evidence-backed, whether transition obligations are priced, whether excluded services hide required scope, and whether leadership is reviewing the right decision posture. This is why pricing normalization, commercial risk detection, BAFO planning, and executive decision support are core design pillars.

Source is not a static dashboard. Dashboards report state. AbarVa Source must move work forward. Every stage should answer where the event is, what matters now, what is blocked or at risk, what the lead agent recommends, and what the user should do next. The design must include journey state, context used, confidence and evidence status, suggested actions, and clear gate behavior.

Source is not a production automation engine yet. The current product uses deterministic read models, seed data, route shells, panels, tests, and strong design patterns. Upload parsing, model-assisted responses, artifact export/import, persistent approvals, workflow engines, and production evidence ledger behavior are deliberately deferred. The product must be honest about this boundary until those capabilities are actually implemented.


## 1.1 Product North Star

The north star is to help enterprise teams make better technology sourcing decisions faster, with less ambiguity and stronger evidence. AbarVa Source should compress the distance between sourcing intent and executive decision by making the work object, stage state, evidence, artifacts, gates, vendor comparability, commercial risk, and next actions visible in one coherent operating workspace.


## 1.2 Design North Star

The Source experience should be calm, premium, table-forward, and operational. It should not look like a noisy procurement dashboard. It should use a warm off-white canvas, dark navy and charcoal text, restrained dark-sky-blue accents, minimal icons, visible stage progress, compact contextual agent guidance, and strong data tables. The name-only AbarVa wordmark should be used until a final logo asset is provided. No symbol should be shown unless the final brand asset is approved.


## 1.3 Product Scope


|Included technology sourcing category|Example use cases|

|---|---|

|Application Managed Services|L2/L3 application support, minor enhancements, release support, AMS consolidation, app portfolio support outsourcing.|

|Infrastructure Managed Services|Cloud operations, network, end-user compute, monitoring, patching, backup/DR, data center or hybrid operations.|

|Data Platform Managed Services|Data pipeline operations, BI/reporting support, data quality operations, lakehouse/platform support, analytics operations.|

|Digital / Product Engineering|Engineering pods, QA/testing, DevOps, platform modernization squads, product build/run sourcing.|

|ERP / Enterprise Platforms|SAP, Oracle, Workday, Salesforce, ServiceNow implementation/support sourcing.|

|Cloud / FinOps Services|Cloud managed services, migration factory, cost optimization, tagging/governance operations.|

|Cybersecurity Services|SOC, MDR, IAM, vulnerability management, GRC tooling, security operations sourcing.|

|AI / Data Modernization Partners|SI selection for data/AI modernization, model operations support, data engineering partners.|




|Excluded category|Reason excluded for now|

|---|---|

|Facilities, travel, commodity purchasing|These categories do not require the same IT operating model, evidence, service-level, and transition structures.|

|HR/legal/marketing services|Different sourcing artifacts, risk models, and stakeholder workflows are required.|

|Manufacturing sourcing|Physical supply chain workflows and pricing structures are out of scope.|

|General indirect procurement|AbarVa Source is designed as a technology sourcing product, not a category-agnostic procurement suite.|




---


# 2. Product Goals and Non-Goals


## 2.1 Goals

- Structure technology sourcing events into a clearly visible lifecycle with entry and exit criteria.

- Make the current stage and next gate obvious within three seconds of landing on a Source page.

- Bind every meaningful UI element to deterministic seed data today and a future real data source tomorrow.

- Show data readiness distinctly from evidence readiness; loaded data must never be treated as usable evidence by default.

- Guide RFP readiness through Rich, Outline, Stub, Blocked, and Waiver Required postures.

- Make vendor response completeness visible before evaluation begins.

- Normalize vendor pricing across run cost, transition cost, assumptions, exclusions, volumes, SLAs, and commercial traps.

- Generate vendor-specific BAFO and negotiation questions from deterministic commercial signals.

- Prepare executive decision summaries that compare cost, risk, transition, evidence, and value without automating final selection.

- Determine vendor selection readiness without executing the selection or approval workflow.

- Represent artifacts as workflow objects with status, evidence, review, and approval posture, not just downloadable files.

- Provide agent guidance that is context-aware, stage-aware, evidence-aware, commercially intelligent, and honest about missing context.

- Support future upload, parsing, evidence ledger, approval engine, workflow automation, model gateway, and persistent audit capabilities without pretending they exist today.


## 2.2 Non-Goals

- Do not build a general procurement platform.

- Do not build chat-first sourcing.

- Do not make model calls until the model gateway, context builder, evidence ledger, and safety posture are ready.

- Do not implement real upload/parsing as a UI placeholder that implies evidence is usable before conversion and validation.

- Do not implement a final vendor selection button or automated award recommendation.

- Do not implement approval engine behavior until approvals, audit, permissions, and persistence are designed and validated.

- Do not claim market benchmark intelligence unless licensed or cited benchmark sources exist.

- Do not claim realized savings without measurement owner and evidence.

- Do not show old logo symbols or unapproved brand marks.

- Do not bury the agent in a rail without agent editorial and context-used behavior in the main workspace.


## 2.3 Product Truths That Must Remain Visible


|Truth|Design implication|

|---|---|

|Source consumes Admin/Setup data readiness; it does not own connector setup.|Data readiness panels must show handoffs to Steward/Admin rather than duplicating setup flows.|

|Loaded data is not usable evidence.|Panels must distinguish Loaded, Parsed, Available, Usable Evidence, Low Confidence, Stale, and Restricted.|

|RFP readiness is conditional.|The UI must not show Rich-tier readiness when critical pricing baseline data is missing.|

|Vendor pricing is not comparable until normalized.|Pricing comparison must show assumptions, exclusions, transition cost, and risk-adjusted notes.|

|BAFO questions are guidance, not automatic messaging.|The BAFO panel must not send vendor messages or create workflow actions unless future automation is approved.|

|Executive decision is not final selection.|The executive decision summary must offer decision posture and tradeoffs, not an automated award.|

|Stage gates are governance signals today, not full workflow automation.|Gate panels must show blockers and required approvals without pretending a full approval engine exists.|




---


# 3. Personas and Decision Needs


|Persona|Decision need|

|---|---|

|CIO|Needs to know whether the sourcing event is reducing risk, improving capability, and protecting service continuity. Cares about vendor fit, transition readiness, operating model, retained roles, and whether the recommendation is defensible.|

|CTO|Needs to understand technical scope, service boundaries, platform dependencies, automation commitments, and implementation risk. Cares about engineering quality, DevOps maturity, cloud/data/platform implications, and transition feasibility.|

|CDO|Needs clarity on data platform scope, data quality operations, data governance, analytics support, and value realization. Cares about data pipeline inventory, refresh SLAs, governance/access requirements, and platform roadmap alignment.|

|CISO|Needs assurance that security, compliance, access, monitoring, vulnerability management, IAM, and incident handling responsibilities are defined. Cares about evidence, exceptions, and vendor security posture.|

|CFO|Needs normalized cost, transition-inclusive view, savings confidence, value at risk, contract commitments, and risk-adjusted financial implications. Cares about assumptions, excluded services, rate escalation, and evidence behind value claims.|

|Sourcing Lead|Needs to run the event day-to-day. Cares about stage readiness, missing inputs, RFP package, vendor responses, pricing template completeness, BAFO questions, and next actions.|

|Procurement Lead|Needs governed process, comparable responses, commercial terms, pricing templates, exceptions, approvals, and auditability.|

|Vendor Management Lead|Needs transition obligations, retained/vendor RACI, SLA commitments, governance model, service credits, and future operating rhythm.|

|IT Operations Lead|Needs support model clarity, ticket volumes, service windows, knowledge transfer, escalation paths, runbooks, and continuity risk.|

|Transformation Lead|Needs linkage between sourcing, program milestones, workshops, deliverables, risks, dependencies, and value realization.|

|Legal / Risk Reviewer|Needs contract risk, exceptions, liability boundaries, compliance, security, data protection, approval evidence, and documented rationale.|

|Finance Partner|Needs baseline cost, normalized cost, variance, savings confidence, transition cost, one-time cost, and measurement owner.|

|Program Sponsor|Needs an executive-level explanation of why the sourcing decision matters, what is blocked, and what decision is needed now.|




## 3.1 First Three Seconds by Persona


|Persona|What they must see within three seconds|

|---|---|

|CIO|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|CTO|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|CDO|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|CISO|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|CFO|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|Sourcing Lead|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|Procurement Lead|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|Vendor Management Lead|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|IT Operations Lead|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|Transformation Lead|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|Legal / Risk Reviewer|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|Finance Partner|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|

|Program Sponsor|Where the event is, what is blocked, what the lead agent recommends, and what decision or action this persona owns.|




---


# 4. Canonical 11-Step IT Sourcing Process

AbarVa Source uses exactly 11 canonical process steps for technology and IT sourcing. The event journey may visually group steps for simplicity, but the product design and data model must preserve these 11 steps so entry criteria, exit criteria, artifacts, agents, and tests remain precise.


|Step|Name|Primary question|

|---|---|---|

|1|Strategy|What technology service, platform, or vendor capability are we sourcing, and why?|

|2|Scope|Is the IT service scope clear enough for vendor pricing and delivery accountability?|

|3|RFP / RFI Readiness|Can we release a defensible technology services RFP/RFI package?|

|4|Vendor Responses|Are vendor responses complete enough to compare?|

|5|Evaluation|Which vendors are credible after scorecard, evidence, risk, and solution review?|

|6|Pricing Normalization|Are prices comparable after scope, assumptions, volumes, transition, and exclusions are normalized?|

|7|BAFO / Negotiation|What must we ask, lock, clarify, or negotiate before final evaluation?|

|8|Executive Decision|What should CIO/CFO/Steering Committee understand before selection review?|

|9|Vendor Selection Readiness|Are we ready to recommend a technology partner for selection review?|

|10|Transition Readiness|Are we ready to mobilize the selected vendor safely?|

|11|Value Realization|Are technology outcomes, cost savings, service improvements, and operational KPIs being measured?|




## 4.1 Visual Journey vs Process Detail

The event journey bar may show fewer macro-stages if needed for visual clarity: Strategy, Scope, RFP, Responses, Evaluation, BAFO, Selection, Transition, Value. Internally, Pricing Normalization and Executive Decision are detailed steps that sit inside Evaluation/Selection readiness. The design document must preserve all 11 steps even if the UI groups them into a shorter visible rail.


## 4.2 Universal Stage Pattern

Every stage follows the same operating pattern: stage context, data readiness, artifact readiness, agent mission, gate check, recommendation, three choices plus custom, and either advancement, deferral, blocker, or waiver path. This pattern prevents a static template page and gives agents meaningful work grounded in event state.


|Universal stage element|Purpose|

|---|---|

|Stage context|Names the event, tenant, linked program, current step, owner, and value/risk context.|

|Data readiness|Shows what data is missing, requested, loaded, parsed, available, usable, stale, restricted, or waived.|

|Artifact readiness|Shows deliverables required for the current stage and their status.|

|Agent mission|Shows the most relevant Nexus/Sentinel/Steward/Atlas work item.|

|Gate check|Shows whether the next stage is ready, blocked, deferred, or waiver-required.|

|Recommendation|A concise agent explanation of the next best action.|

|Three choices plus custom|Prevents blank prompt dead-ends and keeps the user moving.|




---


# 5. Detailed Step Design Sheets

Each design sheet below is written for implementation. The same pattern should be used in future stage-specific Codex work orders. The sheets describe what the user sees, what data drives the page, what agents do, and what must happen before the stage can advance.


## Step 01 - Strategy

Primary user question: What technology service, platform, or vendor capability are we sourcing, and why?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Nexus|

|Supporting agents|Steward, Atlas|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 1 / Strategy, the event name, gate state Strategy to Scope, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Business objective, sourcing category, current vendor posture, target outcomes, owner, stakeholder map, initial value hypothesis.|

|Required artifacts|Sourcing Strategy Memo, Stakeholder Map, Initial Value Hypothesis.|

|Entry criteria|Business sponsor or sourcing lead has initiated a technology sourcing event.|

|Exit criteria|Sourcing objective, category archetype, owner, high-level scope hypothesis, and decision path are documented.|

|Stage gate|Strategy to Scope|

|Blockers|No owner, unclear category, no business objective, no value hypothesis, no stakeholder alignment.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Strategy, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Nexus leads. Nexus should name the current stage, explain the operational blocker, and recommend the next best action without pretending missing data exists. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Nexus: This stage should be evaluated using the current event, current stage, required data, required artifacts, evidence confidence, and gate posture. If context is incomplete, the agent must disclose the missing context and recommend a specific next action rather than giving a generic answer.


### Suggested actions: three choices plus custom

- Show stage blockers

- Show required artifacts

- Explain next gate

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 1: Strategy and the current gate within three seconds.

- The primary question "What technology service, platform, or vendor capability are we sourcing, and why?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 02 - Scope

Primary user question: Is the IT service scope clear enough for vendor pricing and delivery accountability?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Nexus|

|Supporting agents|Sentinel, Steward, Atlas|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 2 / Scope, the event name, gate state Scope to RFP, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Application/workload inventory, ticket history, SLA baseline, current support cost, retained roles, vendor contracts, security requirements.|

|Required artifacts|Scope Document, Minimum Data Request, Retained/Vendor Responsibility Matrix, RFP Outline.|

|Entry criteria|Strategy is established and owner assigned.|

|Exit criteria|In-scope/out-of-scope is clear enough for vendor pricing or missing data is explicitly disclosed.|

|Stage gate|Scope to RFP|

|Blockers|Ticket history missing, SLA baseline missing, retained roles unclear, vendor contracts not usable evidence.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Scope, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Nexus leads. Nexus should name the current stage, explain the operational blocker, and recommend the next best action without pretending missing data exists. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Nexus: Scope is not pricing-ready yet for the Apex Retail AMS event. Ticket history, SLA baseline, and retained-role ownership are missing. Because those inputs drive volume assumptions and vendor responsibility boundaries, the RFP should remain Outline-tier. Recommended next action: send the minimum data request to the IT Operations Lead and Procurement Lead.


### Suggested actions: three choices plus custom

- Show missing inputs

- Generate minimum data request

- Explain RFP tier

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 2: Scope and the current gate within three seconds.

- The primary question "Is the IT service scope clear enough for vendor pricing and delivery accountability?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 03 - RFP / RFI Readiness

Primary user question: Can we release a defensible technology services RFP/RFI package?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Nexus|

|Supporting agents|Steward, Sentinel|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 3 / RFP / RFI Readiness, the event name, gate state RFP to Vendor Responses, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Scope baseline, pricing template fields, artifact readiness, evidence status, scorecard governance, release approvals.|

|Required artifacts|RFP Package, Pricing Template, Scorecard Draft, Vendor Instructions.|

|Entry criteria|Scope workspace has determined pricing readiness or a waiver/defer path.|

|Exit criteria|RFP tier is established and release gate is ready, deferred, blocked, or waiver-required.|

|Stage gate|RFP to Vendor Responses|

|Blockers|RFP package incomplete, pricing template missing, scorecard not approved, missing evidence.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering RFP / RFI Readiness, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Nexus leads. Nexus should name the current stage, explain the operational blocker, and recommend the next best action without pretending missing data exists. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Nexus: The RFP package can be drafted as an Outline-tier artifact, but it should not be released as Rich-tier. Application inventory and vendor spend are usable; ticket history and SLA baseline remain missing. Steward should keep the Scope to RFP gate in defer status until the missing baseline is received or waived.


### Suggested actions: three choices plus custom

- Show missing inputs

- Generate minimum data request

- Explain RFP tier

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 3: RFP / RFI Readiness and the current gate within three seconds.

- The primary question "Can we release a defensible technology services RFP/RFI package?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 04 - Vendor Responses

Primary user question: Are vendor responses complete enough to compare?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Nexus|

|Supporting agents|Sentinel, Steward|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 4 / Vendor Responses, the event name, gate state Vendor Responses to Evaluation, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Vendor responses, pricing template status, transition plan, assumptions, exclusions, security response, automation roadmap, evidence links.|

|Required artifacts|Vendor Response Completeness Checklist, Q&A Tracker.|

|Entry criteria|RFP/RFI released or response set has been received as seeded/demo data.|

|Exit criteria|Responses are complete enough to compare or gaps are identified for reminder/clarification.|

|Stage gate|Vendor Responses to Evaluation|

|Blockers|Missing pricing template, missing transition plan, assumptions not stated, weak evidence, non-comparable response.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Vendor Responses, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Nexus leads. Nexus should name the current stage, explain the operational blocker, and recommend the next best action without pretending missing data exists. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Nexus: This stage should be evaluated using the current event, current stage, required data, required artifacts, evidence confidence, and gate posture. If context is incomplete, the agent must disclose the missing context and recommend a specific next action rather than giving a generic answer.


### Suggested actions: three choices plus custom

- Show incomplete vendors

- Explain comparability blockers

- Show evidence gaps

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 4: Vendor Responses and the current gate within three seconds.

- The primary question "Are vendor responses complete enough to compare?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 05 - Evaluation

Primary user question: Which vendors are credible after scorecard, evidence, risk, and solution review?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Steward|

|Supporting agents|Nexus, Sentinel, Atlas|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 5 / Evaluation, the event name, gate state Evaluation to BAFO, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Scorecard criteria, evidence status, rationale, risk exceptions, vendor completeness, pricing normalization status.|

|Required artifacts|Scorecard Workbook, Evaluation Summary, Risk Register.|

|Entry criteria|Vendor responses are complete enough or explicitly qualified.|

|Exit criteria|Evaluation posture is clear and BAFO readiness can be determined.|

|Stage gate|Evaluation to BAFO|

|Blockers|Scorecard not governed, rationale missing, evidence weak, pricing not comparable.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Evaluation, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Steward leads. Steward should state whether a gate can advance, must defer, is blocked, or requires waiver. It should never silently advance a stage. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Steward: This stage should be evaluated using the current event, current stage, required data, required artifacts, evidence confidence, and gate posture. If context is incomplete, the agent must disclose the missing context and recommend a specific next action rather than giving a generic answer.


### Suggested actions: three choices plus custom

- Show incomplete vendors

- Explain comparability blockers

- Show evidence gaps

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 5: Evaluation and the current gate within three seconds.

- The primary question "Which vendors are credible after scorecard, evidence, risk, and solution review?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 06 - Pricing Normalization

Primary user question: Are prices comparable after scope, assumptions, volumes, transition, and exclusions are normalized?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Nexus|

|Supporting agents|Sentinel, Atlas|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 6 / Pricing Normalization, the event name, gate state Evaluation to BAFO, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Vendor pricing, volumes, apps, tickets, transition cost, optional/excluded services, SLAs, escalation, on/offshore mix, automation assumptions.|

|Required artifacts|Pricing Normalization Workbook, Commercial Risk Summary.|

|Entry criteria|Vendor responses include enough pricing detail to normalize or gaps are disclosed.|

|Exit criteria|Vendors are comparable, non-comparable, or blocked with commercial reasons visible.|

|Stage gate|Evaluation to BAFO|

|Blockers|Missing template, excluded transition cost, low volume assumption, unsupported automation savings.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Pricing Normalization, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Nexus leads. Nexus should name the current stage, explain the operational blocker, and recommend the next best action without pretending missing data exists. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Nexus: This stage should be evaluated using the current event, current stage, required data, required artifacts, evidence confidence, and gate posture. If context is incomplete, the agent must disclose the missing context and recommend a specific next action rather than giving a generic answer.


### Suggested actions: three choices plus custom

- Show commercial traps

- Draft BAFO questions

- Explain normalized pricing

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 6: Pricing Normalization and the current gate within three seconds.

- The primary question "Are prices comparable after scope, assumptions, volumes, transition, and exclusions are normalized?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 07 - BAFO / Negotiation

Primary user question: What must we ask, lock, clarify, or negotiate before final evaluation?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Nexus|

|Supporting agents|Sentinel, Atlas, Steward|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 7 / BAFO / Negotiation, the event name, gate state BAFO to Selection, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Commercial traps, assumptions, exclusions, normalized pricing, evidence status, gate posture, vendor-specific gaps.|

|Required artifacts|BAFO Question Pack, Assumption Lock List, Excluded Scope List.|

|Entry criteria|Evaluation and pricing normalization identify issues to negotiate.|

|Exit criteria|BAFO priorities and vendor-specific questions are ready or blockers remain.|

|Stage gate|BAFO to Selection|

|Blockers|Missing pricing template, unresolved exclusions, weak evidence, gate not ready.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering BAFO / Negotiation, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Nexus leads. Nexus should name the current stage, explain the operational blocker, and recommend the next best action without pretending missing data exists. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Nexus: Proceed to BAFO only with targeted vendor questions. Vendor A is commercially attractive but excludes release support and transition scope. Vendor B is not comparable because pricing template detail is missing. Vendor C claims automation savings but lacks evidence and contract-backed price-down language.


### Suggested actions: three choices plus custom

- Show commercial traps

- Draft BAFO questions

- Explain normalized pricing

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 7: BAFO / Negotiation and the current gate within three seconds.

- The primary question "What must we ask, lock, clarify, or negotiate before final evaluation?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 08 - Executive Decision

Primary user question: What should CIO/CFO/Steering Committee understand before selection review?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Atlas|

|Supporting agents|Nexus, Sentinel, Steward|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 8 / Executive Decision, the event name, gate state BAFO to Selection, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Commercial signals, unified agent missions, vendor tradeoffs, value at stake, evidence confidence, blockers.|

|Required artifacts|Executive Decision Brief.|

|Entry criteria|BAFO or negotiation posture is available.|

|Exit criteria|Executive decision posture is clear: proceed, defer, block, or waiver required.|

|Stage gate|BAFO to Selection|

|Blockers|Missing pricing, low evidence, unresolved commercial traps, gate not ready.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Executive Decision, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Atlas leads. Atlas should translate commercial and operational signals into an executive value/risk decision frame. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Atlas: This is not ready for final selection review. The executive posture is proceed to BAFO. Vendor A has the strongest normalized cost but unresolved exclusions. Vendor C has upside from automation but weak evidence. Vendor B is blocked until pricing is comparable.


### Suggested actions: three choices plus custom

- Show vendor tradeoffs

- Show blockers

- Prepare executive brief

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 8: Executive Decision and the current gate within three seconds.

- The primary question "What should CIO/CFO/Steering Committee understand before selection review?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 09 - Vendor Selection Readiness

Primary user question: Are we ready to recommend a technology partner for selection review?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Steward|

|Supporting agents|Atlas, Nexus, Sentinel|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 9 / Vendor Selection Readiness, the event name, gate state Selection to Transition, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Executive summary, stage gates, artifacts, approvals, commercial issues, evidence issues, vendor viability.|

|Required artifacts|Vendor Selection Memo, Approval Readiness Checklist.|

|Entry criteria|Executive decision summary exists.|

|Exit criteria|Selection review is ready, deferred, blocked, or waiver-required.|

|Stage gate|Selection to Transition|

|Blockers|Approval missing, evidence weak, blocked vendor, unresolved BAFO clarification.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Vendor Selection Readiness, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Steward leads. Steward should state whether a gate can advance, must defer, is blocked, or requires waiver. It should never silently advance a stage. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Steward: This stage should be evaluated using the current event, current stage, required data, required artifacts, evidence confidence, and gate posture. If context is incomplete, the agent must disclose the missing context and recommend a specific next action rather than giving a generic answer.


### Suggested actions: three choices plus custom

- Show vendor tradeoffs

- Show blockers

- Prepare executive brief

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 9: Vendor Selection Readiness and the current gate within three seconds.

- The primary question "Are we ready to recommend a technology partner for selection review?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 10 - Transition Readiness

Primary user question: Are we ready to mobilize the selected vendor safely?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Steward|

|Supporting agents|Nexus, Sentinel, Atlas|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 10 / Transition Readiness, the event name, gate state Transition to Value Realization, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Transition plan, knowledge transfer, access, runbooks, retained/vendor RACI, security onboarding, service continuity risks.|

|Required artifacts|Transition Readiness Checklist, KT Plan, Runbook, Day 1 Support Plan.|

|Entry criteria|Selection posture is ready or selection path is clear.|

|Exit criteria|Mobilization readiness is visible and Day 1 blockers are closed or deferred.|

|Stage gate|Transition to Value Realization|

|Blockers|KT not planned, access not ready, RACI unclear, runbook missing, security onboarding incomplete.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Transition Readiness, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Steward leads. Steward should state whether a gate can advance, must defer, is blocked, or requires waiver. It should never silently advance a stage. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Steward: This stage should be evaluated using the current event, current stage, required data, required artifacts, evidence confidence, and gate posture. If context is incomplete, the agent must disclose the missing context and recommend a specific next action rather than giving a generic answer.


### Suggested actions: three choices plus custom

- Show stage blockers

- Show required artifacts

- Explain next gate

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 10: Transition Readiness and the current gate within three seconds.

- The primary question "Are we ready to mobilize the selected vendor safely?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


## Step 11 - Value Realization

Primary user question: Are technology outcomes, cost savings, service improvements, and operational KPIs being measured?

Technology / IT sourcing framing: This step is framed around technology services, IT operating models, service levels, security, transition, vendor delivery accountability, and evidence-backed executive decisions. It should not use generic procurement examples or non-technology category language.


|Design field|Specification|

|---|---|

|Primary agent|Atlas|

|Supporting agents|Nexus, Sentinel, Steward|

|Route / workspace|/source/events/[eventId] active stage workspace, unless the user is on a supporting subroute such as scorecard, artifact, or value.|

|First-three-seconds view|The user sees Step 11 / Value Realization, the event name, gate state Value Realization to Closed, top blocker, lead agent recommendation, and next action.|

|Main workspace layout|Stage editorial at top, data/artifact/gate summary beneath, table-forward details in the center, compact action layer at bottom.|

|Right rail behavior|Agent guidance remains compact. It should show the lead agent, supporting agent cautions, context used, and next actions.|

|Context-used behavior|Show event, stage, linked program, data readiness, artifact status, evidence confidence, and relevant pattern or commercial signal.|

|Required data|Baseline value, committed value, measured outcomes, measurement owner, evidence, variance, service KPIs.|

|Required artifacts|Value Ledger Assumptions, Realization Report, KPI Evidence Pack.|

|Entry criteria|Transition has enough operating baseline to measure outcomes.|

|Exit criteria|Value is projected, committed, measuring, realized, reconciled, or flagged as not evidenced.|

|Stage gate|Value Realization to Closed|

|Blockers|No measurement owner, no baseline, no evidence, no actuals, stale data.|

|Waiver/defer behavior|If required data or approvals are missing, Steward may show defer or waiver-required. The UI must not pretend the stage is ready.|




### User experience details

On entering Value Realization, the user should immediately understand whether the stage is ready to proceed. The layout should not make the user hunt through tabs to find the blocker. The lead editorial block should explain the current posture in plain business language and then point to the relevant table, artifact, gate, or drawer. The page should remain calm and table-forward, with the agent functioning as an editor of the workspace rather than a chatbot.

For this stage, Atlas leads. Atlas should translate commercial and operational signals into an executive value/risk decision frame. Supporting agents should appear only when they add decision value. Their role is to qualify evidence, governance, or executive implications, not to create visual noise.


### Example agent response

Atlas: This stage should be evaluated using the current event, current stage, required data, required artifacts, evidence confidence, and gate posture. If context is incomplete, the agent must disclose the missing context and recommend a specific next action rather than giving a generic answer.


### Suggested actions: three choices plus custom

- Show stage blockers

- Show required artifacts

- Explain next gate

- Ask something else


### Empty, loading, and error states


|State|Required rendering|

|---|---|

|Empty|Show a dignified empty state naming the missing work object or dataset and the agent that owns the next action.|

|Loading|Use skeleton rows and preserve page orientation; do not hide the current stage label.|

|Error|Show a concise error message, deterministic caveat, retry option where applicable, and no fabricated fallback data.|




### Acceptance criteria

- The user can identify Step 11: Value Realization and the current gate within three seconds.

- The primary question "Are technology outcomes, cost savings, service improvements, and operational KPIs being measured?" is answered directly by the page or panel.

- The lead agent response names the event, stage, blocker or readiness state, and next action.

- Context-used information is visible or available through a drawer/strip.

- Required data and artifact dependencies are visible.

- Stage advancement is not implied unless exit criteria and gate posture support it.

- No model call, upload runtime, workflow engine, or approval automation is implied unless actually implemented.


---


# 6. Page and Route Requirements


|Route|Page|Agent|Primary question|Required composition|

|---|---|---|---|---|

|/source|Source Dashboard|Nexus|What Source events need attention right now?|Dashboard command read, pressure signals, event table, mission preview, context-used, action layer.|

|/source/events|Source Events Portfolio|Nexus|Which sourcing events are active, blocked, waiting, or ready for action?|Portfolio context tiles, server-rendered filters, table-forward event queue, Nexus briefing, workflow rail.|

|/source/events/[eventId]|Source Event Canvas|Nexus|What is happening in this event and what should happen next?|Event header, linked program badge, journey map, stage workspace, stage gate, artifact strip, data readiness, commercial workbench, persistent guidance.|

|/source/events/[eventId]/scorecard|Scorecard Governance|Steward|Is the scorecard governed enough to support evaluation?|Steward editorial, readiness meter, criteria table, rationale/evidence state, audit placeholder, gate impact.|

|/source/events/[eventId]/artifacts/[artifactId]|Artifact Detail / Review|Nexus|What is this artifact, what evidence supports it, and what review state is it in?|Metadata strip, artifact status, version, evidence/review rail, missing inputs, review/approval placeholders.|

|/source/value|Source Value Ledger|Atlas|What value is projected, committed, measuring, or realized, and how confident are we?|Atlas editorial, value lifecycle, line-item table, assumptions, evidence confidence, variance/risk notes.|




## Source Dashboard - /source

Purpose: Dashboard command read, pressure signals, event table, mission preview, context-used, action layer.

Primary agent owner: Nexus. The page must lead with context-aware editorial, not a generic instruction block. The page must answer: What Source events need attention right now?


|Requirement|Specification|

|---|---|

|Layout zones|Top shell, context strip where relevant, primary workspace, agent rail or equivalent guidance region, and drawers where specified.|

|Data source today|Deterministic seeded/read-model data from Source demo scenario and source lib helpers.|

|Real data tomorrow|Tenant-scoped sourcing event, Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, pricing templates, evidence ledger, workflow state, approvals, audit.|

|Context-used behavior|Show the event, stage, linked program, data/artifact/gate state, evidence confidence, and commercial signals used.|

|Suggested actions|Three context-generated choices plus custom where the user needs to move work forward.|

|Missing-data behavior|Disclose missing data and explain workflow impact. Do not fabricate readiness.|

|File attachment behavior|Only show upload/re-upload as future or placeholder where runtime upload/parsing is not implemented.|

|Acceptance criteria|Five-question test passes, no dead clicks, agent editorial is context-specific, and no forbidden automation is implied.|




## Source Events Portfolio - /source/events

Purpose: Portfolio context tiles, server-rendered filters, table-forward event queue, Nexus briefing, workflow rail.

Primary agent owner: Nexus. The page must lead with context-aware editorial, not a generic instruction block. The page must answer: Which sourcing events are active, blocked, waiting, or ready for action?


|Requirement|Specification|

|---|---|

|Layout zones|Top shell, context strip where relevant, primary workspace, agent rail or equivalent guidance region, and drawers where specified.|

|Data source today|Deterministic seeded/read-model data from Source demo scenario and source lib helpers.|

|Real data tomorrow|Tenant-scoped sourcing event, Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, pricing templates, evidence ledger, workflow state, approvals, audit.|

|Context-used behavior|Show the event, stage, linked program, data/artifact/gate state, evidence confidence, and commercial signals used.|

|Suggested actions|Three context-generated choices plus custom where the user needs to move work forward.|

|Missing-data behavior|Disclose missing data and explain workflow impact. Do not fabricate readiness.|

|File attachment behavior|Only show upload/re-upload as future or placeholder where runtime upload/parsing is not implemented.|

|Acceptance criteria|Five-question test passes, no dead clicks, agent editorial is context-specific, and no forbidden automation is implied.|




## Source Event Canvas - /source/events/[eventId]

Purpose: Event header, linked program badge, journey map, stage workspace, stage gate, artifact strip, data readiness, commercial workbench, persistent guidance.

Primary agent owner: Nexus. The page must lead with context-aware editorial, not a generic instruction block. The page must answer: What is happening in this event and what should happen next?


|Requirement|Specification|

|---|---|

|Layout zones|Top shell, context strip where relevant, primary workspace, agent rail or equivalent guidance region, and drawers where specified.|

|Data source today|Deterministic seeded/read-model data from Source demo scenario and source lib helpers.|

|Real data tomorrow|Tenant-scoped sourcing event, Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, pricing templates, evidence ledger, workflow state, approvals, audit.|

|Context-used behavior|Show the event, stage, linked program, data/artifact/gate state, evidence confidence, and commercial signals used.|

|Suggested actions|Three context-generated choices plus custom where the user needs to move work forward.|

|Missing-data behavior|Disclose missing data and explain workflow impact. Do not fabricate readiness.|

|File attachment behavior|Only show upload/re-upload as future or placeholder where runtime upload/parsing is not implemented.|

|Acceptance criteria|Five-question test passes, no dead clicks, agent editorial is context-specific, and no forbidden automation is implied.|




## Scorecard Governance - /source/events/[eventId]/scorecard

Purpose: Steward editorial, readiness meter, criteria table, rationale/evidence state, audit placeholder, gate impact.

Primary agent owner: Steward. The page must lead with context-aware editorial, not a generic instruction block. The page must answer: Is the scorecard governed enough to support evaluation?


|Requirement|Specification|

|---|---|

|Layout zones|Top shell, context strip where relevant, primary workspace, agent rail or equivalent guidance region, and drawers where specified.|

|Data source today|Deterministic seeded/read-model data from Source demo scenario and source lib helpers.|

|Real data tomorrow|Tenant-scoped sourcing event, Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, pricing templates, evidence ledger, workflow state, approvals, audit.|

|Context-used behavior|Show the event, stage, linked program, data/artifact/gate state, evidence confidence, and commercial signals used.|

|Suggested actions|Three context-generated choices plus custom where the user needs to move work forward.|

|Missing-data behavior|Disclose missing data and explain workflow impact. Do not fabricate readiness.|

|File attachment behavior|Only show upload/re-upload as future or placeholder where runtime upload/parsing is not implemented.|

|Acceptance criteria|Five-question test passes, no dead clicks, agent editorial is context-specific, and no forbidden automation is implied.|




## Artifact Detail / Review - /source/events/[eventId]/artifacts/[artifactId]

Purpose: Metadata strip, artifact status, version, evidence/review rail, missing inputs, review/approval placeholders.

Primary agent owner: Nexus. The page must lead with context-aware editorial, not a generic instruction block. The page must answer: What is this artifact, what evidence supports it, and what review state is it in?


|Requirement|Specification|

|---|---|

|Layout zones|Top shell, context strip where relevant, primary workspace, agent rail or equivalent guidance region, and drawers where specified.|

|Data source today|Deterministic seeded/read-model data from Source demo scenario and source lib helpers.|

|Real data tomorrow|Tenant-scoped sourcing event, Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, pricing templates, evidence ledger, workflow state, approvals, audit.|

|Context-used behavior|Show the event, stage, linked program, data/artifact/gate state, evidence confidence, and commercial signals used.|

|Suggested actions|Three context-generated choices plus custom where the user needs to move work forward.|

|Missing-data behavior|Disclose missing data and explain workflow impact. Do not fabricate readiness.|

|File attachment behavior|Only show upload/re-upload as future or placeholder where runtime upload/parsing is not implemented.|

|Acceptance criteria|Five-question test passes, no dead clicks, agent editorial is context-specific, and no forbidden automation is implied.|




## Source Value Ledger - /source/value

Purpose: Atlas editorial, value lifecycle, line-item table, assumptions, evidence confidence, variance/risk notes.

Primary agent owner: Atlas. The page must lead with context-aware editorial, not a generic instruction block. The page must answer: What value is projected, committed, measuring, or realized, and how confident are we?


|Requirement|Specification|

|---|---|

|Layout zones|Top shell, context strip where relevant, primary workspace, agent rail or equivalent guidance region, and drawers where specified.|

|Data source today|Deterministic seeded/read-model data from Source demo scenario and source lib helpers.|

|Real data tomorrow|Tenant-scoped sourcing event, Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, pricing templates, evidence ledger, workflow state, approvals, audit.|

|Context-used behavior|Show the event, stage, linked program, data/artifact/gate state, evidence confidence, and commercial signals used.|

|Suggested actions|Three context-generated choices plus custom where the user needs to move work forward.|

|Missing-data behavior|Disclose missing data and explain workflow impact. Do not fabricate readiness.|

|File attachment behavior|Only show upload/re-upload as future or placeholder where runtime upload/parsing is not implemented.|

|Acceptance criteria|Five-question test passes, no dead clicks, agent editorial is context-specific, and no forbidden automation is implied.|




---


# 7. Agent Behavior Requirements


|Agent|Role|What it does|What it must not do|

|---|---|---|---|

|Nexus|Lead orchestration agent|Stage readiness, next action, artifact guidance, vendor clarification, BAFO questions, RFP tier explanation.|Nexus must not claim missing data exists, must not issue final selection, and must not behave as a generic chatbot.|

|Sentinel|Evidence and pattern integrity agent|Evidence confidence, unsupported vendor claims, loaded vs usable evidence, citation readiness, stale/restricted data.|Sentinel must not approve claims without evidence and must not hide low-confidence conditions.|

|Steward|Governance and readiness agent|Stage gates, approvals, data readiness handoffs, audit posture, waiver/defer logic.|Steward must not silently advance stages or imply approval engine behavior that is not implemented.|

|Atlas|Executive synthesis agent|Value/risk tradeoff, decision posture, steering committee implications, CFO/CIO briefing.|Atlas must not make final vendor selection or claim realized savings without evidence.|




## 7.1 Response Quality Rules

- Every substantive response names the current event or program.

- Every stage response names the current stage and gate state.

- Every recommendation names the context used or states that context is thin.

- Every blocker explanation names the missing data, artifact, evidence, approval, or gate condition.

- Every response includes a recommended next action unless the correct behavior is refusal or caveat.

- Every response avoids unsupported claims and avoids saying data is usable evidence when it is only loaded or available.

- Every response intended to move work forward closes with three contextual suggestions plus a custom option.


## 7.2 Example Agent Responses


|Response type|Example|

|---|---|

|Nexus full context|Apex Retail AMS is in Scope. The scope is partially pricing-ready: application inventory and vendor spend are usable, but ticket history, SLA baseline, and retained-role ownership are missing. Keep RFP readiness at Outline-tier. Next action: send the minimum data request.|

|Nexus thin context|I do not have enough usable data to determine pricing readiness. I can see the event and stage, but ticket history and SLA baseline are missing from the context bundle. Next action: route a data readiness request to Steward.|

|Sentinel evidence warning|The vendor contract is loaded but not parsed as usable evidence. I can show it as an uploaded artifact, but I cannot cite it as evidence for RFP scope or pricing until parsing and validation succeed.|

|Sentinel vendor claim caution|Vendor C claims 18 percent automation productivity, but the response does not include evidence or contractable price-down language. Treat the claim as low confidence until clarified in BAFO.|

|Steward gate blocked|The Scope to RFP gate is blocked. Required items missing: ticket history, SLA baseline, and retained/vendor responsibility matrix. A waiver can be requested, but Rich-tier RFP readiness cannot be claimed.|

|Steward approval caveat|I can show approval posture, blockers, and required reviewers. I cannot mark the RFP package approved because approval engine and persistent audit workflow are not implemented.|

|Atlas executive summary|The current executive posture is proceed to BAFO, not selection review. Vendor A is commercially attractive but has transition exclusions. Vendor C has automation upside but weak evidence. Vendor B is not comparable until pricing detail is submitted.|

|Atlas value caution|Projected savings are visible, but realized value is not evidenced. The value ledger should remain projected or measuring until a measurement owner and actual baseline evidence exist.|

|Nexus BAFO guidance|Ask Vendor A to include transition and release support, ask Vendor B to provide the pricing template, and ask Vendor C to back automation savings with contractual price-down or gainshare commitments.|

|Sentinel citation refusal|I cannot cite the pricing workbook as authoritative because it is marked draft and missing source evidence for transition cost. I can summarize it as an internal working assumption.|

|Steward waiver path|A waiver is possible if the sponsor accepts incomplete SLA baseline risk. The UI must capture rationale before showing waiver-required posture as a valid next step.|

|Atlas selection readiness|Selection review is not ready. Two commercial blockers and one evidence blocker remain. The next executive decision is whether to proceed with BAFO clarification or defer selection review.|

|Nexus transition readiness|Transition readiness is low. KT owner, access plan, runbook, and Day 1 support plan are not complete. Selection should not imply mobilization readiness.|

|Sentinel stale data|Ticket history is available but stale. It was last updated outside the acceptable freshness window. Use it as directional context, not as pricing evidence.|

|Steward Admin handoff|Source does not own connector setup. This gap belongs to Admin/Setup readiness: ServiceNow ticket history must be connected, loaded, parsed, and marked usable before Source can treat it as evidence.|

|Atlas steering committee note|The steering committee should decide whether to accept a lower cost with higher transition ambiguity or delay selection until BAFO clarifies exclusions and automation commitments.|

|Nexus RFP tier|This package is Outline-tier. It can guide vendor structure, but it should not be released as Rich-tier because pricing baseline inputs are incomplete.|

|Sentinel risk exception|Security compliance response is available but low confidence. Vendor response references controls but does not provide evidence or ownership for remediation.|

|Steward scorecard governance|The scorecard is in review, not locked. Evaluation can continue as working analysis, but it should not be used for final recommendation until rationale and approval posture are complete.|

|Atlas CFO view|The lowest apparent price is not the lowest risk-adjusted commercial position because transition cost and change-order exposure are excluded. Normalized cost should be reviewed before BAFO. |




---


# 8. Agent Context and Training Requirements

Agents need structured, trustworthy context. They should not rely on generic prompts. The product must assemble a Source context bundle that includes the event, tenant, stage, data readiness, artifacts, gates, vendor responses, pricing, commercial signals, missions, evidence confidence, user role, and prior actions. The context bundle must support both deterministic no-model behavior today and model-assisted behavior later through a governed model gateway.


|Context category|Key fields|Agent usage|

|---|---|---|

|tenant/client|tenantSlug, clientName, industry, sponsor, permissions|All agents use this to avoid generic responses and tenant confusion.|

|sourcing event|eventId, eventName, category, valueAtStake, owner, linkedProgramCode|Nexus and Atlas use this for orientation and recommendations.|

|current stage|stageId, stageName, stageStatus, gateState|Nexus and Steward use this for stage-specific guidance.|

|data readiness|category, state, owner, source, confidence, workflow impact|Nexus, Sentinel, Steward all use this to prevent false readiness.|

|artifacts|artifactId, title, status, evidenceState, version, owner, approvalState|Nexus and Steward use this for artifact guidance and gate checks.|

|vendor responses|vendor, completeness, missing sections, assumptions, exclusions, evidence status|Nexus and Sentinel use this for completeness and comparability.|

|pricing normalization|run cost, transition cost, exclusions, assumptions, risk notes|Nexus, Atlas, Sentinel use this for commercial comparison.|

|BAFO plan|vendor questions, assumption locks, exclusions, asks, blockers|Nexus leads, Atlas summarizes, Sentinel qualifies evidence.|

|executive decision|posture, tradeoffs, blockers, options, executive brief|Atlas leads and Nexus supports next actions.|

|permissions|role, allowed actions, restricted evidence|Steward ensures gate and evidence behavior respects permissions.|




## 8.1 Context Completeness States


|State|Meaning|Agent behavior|

|---|---|---|

|Full context|All required event, stage, data, artifact, vendor, and gate categories are populated.|Agent may provide direct recommendation with confidence.|

|Usable context|Most required categories are populated; missing items do not block the answer.|Agent provides recommendation and names minor gaps.|

|Partial context|Important categories are missing but enough exists to guide next action.|Agent gives conditional guidance and recommends data/action.|

|Low context|Only event/stage or partial data is available.|Agent must disclose limitation and avoid specific claims.|

|Insufficient context|Required work object or stage is unavailable.|Agent refuses/caveats and offers recovery actions.|




## 8.2 Training and Grounding Needs

- AMS Managed Services Sourcing Pattern Pack, including scope, pricing, traps, negotiation, transition, and value levers.

- Future Infrastructure Managed Services Pattern Pack.

- Future Data Platform Managed Services Pattern Pack.

- Pricing and Negotiation Intelligence Standard.

- Source Sourcing Operating Model.

- Source Experience Design Blueprint.

- Stage gate rules.

- Artifact catalog.

- Data readiness states.

- Commercial trap catalog.

- BAFO question catalog.

- Executive decision posture taxonomy.

- Vendor selection readiness criteria.

- Context-used and three choices plus custom behavior rules.


---


# 9. Data Binding Catalog

Every visible Source element must bind to a known data source. The product can use seed data today, but each seed field must map to a real future source. AbarVa must not show magic UI that cannot later be backed by tenant data, uploaded documents, parsed evidence, workflow state, approvals, or commercial models.


## 9.1 Data Readiness State Definitions


|State|Definition|UI/agent behavior|

|---|---|---|

|Missing|Data required by the workflow is not present.|Show as blocker or required action.|

|Requested|Data has been requested but not received.|Show owner and due date if known.|

|Uploaded|A file exists but is not yet parsed or validated.|Do not treat as evidence.|

|Connected|A source system is connected but data may not be loaded.|Show connector/source state.|

|Loaded|Data has been loaded but not parsed/validated.|Do not cite as evidence.|

|Parsed|Data has been structurally processed.|Still needs evidence validation.|

|Available|Data can be viewed or used directionally.|May inform guidance but not cite if not validated.|

|Usable Evidence|Data is validated enough to support claims.|Can be used in evidence/citation contexts.|

|Low Confidence|Data exists but confidence is weak.|Show Sentinel caution.|

|Stale|Data is outside freshness window.|Use directionally; do not overclaim.|

|Access Restricted|User/agent lacks access.|Show restriction and Steward handoff.|

|Not Applicable|Data category is not relevant to event.|Do not count as missing.|

|Waived|Requirement was waived with rationale.|Show waiver state and gate impact.|




## 9.2 Stage-by-Stage Data Requirements


|Stage|Required data|Seed today / real tomorrow|Primary consumer|

|---|---|---|---|

|Strategy|Business objective, sourcing category, current vendor posture, target outcomes, owner, stakeholder map, initial value hypothesis.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Nexus|

|Scope|Application/workload inventory, ticket history, SLA baseline, current support cost, retained roles, vendor contracts, security requirements.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Nexus|

|RFP / RFI Readiness|Scope baseline, pricing template fields, artifact readiness, evidence status, scorecard governance, release approvals.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Nexus|

|Vendor Responses|Vendor responses, pricing template status, transition plan, assumptions, exclusions, security response, automation roadmap, evidence links.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Nexus|

|Evaluation|Scorecard criteria, evidence status, rationale, risk exceptions, vendor completeness, pricing normalization status.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Steward|

|Pricing Normalization|Vendor pricing, volumes, apps, tickets, transition cost, optional/excluded services, SLAs, escalation, on/offshore mix, automation assumptions.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Nexus|

|BAFO / Negotiation|Commercial traps, assumptions, exclusions, normalized pricing, evidence status, gate posture, vendor-specific gaps.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Nexus|

|Executive Decision|Commercial signals, unified agent missions, vendor tradeoffs, value at stake, evidence confidence, blockers.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Atlas|

|Vendor Selection Readiness|Executive summary, stage gates, artifacts, approvals, commercial issues, evidence issues, vendor viability.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Steward|

|Transition Readiness|Transition plan, knowledge transfer, access, runbooks, retained/vendor RACI, security onboarding, service continuity risks.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Steward|

|Value Realization|Baseline value, committed value, measured outcomes, measurement owner, evidence, variance, service KPIs.|Seeded Source demo scenario today; tomorrow from Admin/Setup readiness, uploaded/parsed artifacts, vendor submissions, workflow state, and evidence ledger.|Atlas|




## 9.3 UI Element to Data Source Matrix


|UI element|Data fields|Seed source today|Real source tomorrow|

|---|---|---|---|

|Event header|sourcingEvent.eventName, tenant, linkedProgramCode|getSourcingEvent / demo scenario|tenant event table and program linkage|

|Journey tracker|stage state and gate state|source-stage-gates / mock seed|workflow state engine|

|Data readiness panel|readiness category rows|contract-shaped seed readiness|Admin/Setup data readiness service|

|RFP readiness panel|RFP tier and blockers|rfp-readiness model|artifact/workflow/evidence state|

|Vendor completeness panel|vendor response completeness|vendor-response-completeness model|parsed vendor submissions|

|Pricing normalization|vendor pricing data|pricing-normalization model|pricing template parser and commercial data store|

|BAFO panel|commercial traps and vendor questions|bafo-negotiation model|commercial signals + vendor response data|

|Executive decision panel|commercial signals and missions|executive-decision-summary model|commercial signal adapter + workflow state|

|Stage gate panel|gate readiness|source-stage-gates model|workflow/approval state|

|Artifact strip|artifact status metadata|mock seed artifact list|artifact store + version/review state|

|Value ledger|value entries|SourceValueLedger seed|value ledger and measurement evidence|




---


# 10. Artifact, Upload, Review, and Approval Requirements

Artifacts in AbarVa Source are workflow objects. They should not be treated as static attachments. Each artifact has a stage, purpose, owner, evidence requirement, status, version, review posture, approval posture, and future export/upload behavior. The current product may render artifact status strips and shells, but it should not imply upload, parsing, approval routing, or version engine behavior until those runtimes exist.


|Artifact|Stage|Generated by|Reviewed by|Status examples|Evidence/data required|

|---|---|---|---|---|---|

|Sourcing Strategy Memo|Strategy|Nexus|Steward / Sponsor|Approved or In Review|strategy data, sourcing objective|

|Minimum Data Request|Scope|Nexus|Steward / IT Owner|Issued or Draft|required baseline data categories|

|Scope Document|Scope|Nexus|Steward / Sourcing Lead|In Review|scope, out-of-scope, assumptions|

|RFP Package|RFP Readiness|Nexus|Steward / Procurement|Outline / Draft / Approved|scope, data readiness, scorecard|

|Pricing Template|RFP Readiness|Nexus|Procurement / Finance|Locked / Draft|pricing fields and assumptions|

|Vendor Q&A Tracker|Vendor Responses|Nexus|Sourcing Lead|Active|vendor questions and responses|

|Vendor Response Completeness Checklist|Vendor Responses|Sentinel|Nexus / Steward|Generated|required response elements|

|Pricing Normalization Workbook|Pricing Normalization|Nexus|Finance / Atlas|Draft|vendor pricing and assumptions|

|BAFO Question Pack|BAFO / Negotiation|Nexus|Procurement / Legal|Ready|commercial traps and assumptions|

|Executive Decision Brief|Executive Decision|Atlas|Sponsor / CIO / CFO|Draft|tradeoffs, value, risk, evidence|

|Vendor Selection Memo|Vendor Selection Readiness|Atlas / Nexus|Steward / Sponsor|Not Started / Draft|selection readiness and approvals|

|Transition Readiness Checklist|Transition|Steward|IT Ops / Security|Stub / Draft|KT, access, runbook, RACI|

|Value Ledger Assumptions|Value Realization|Atlas|Finance / Sponsor|Partial|baseline, owner, evidence|




## 10.1 Artifact States

- Not Started: renders as a distinct state with gate and evidence implications.

- Draft: renders as a distinct state with gate and evidence implications.

- Needs Inputs: renders as a distinct state with gate and evidence implications.

- In Review: renders as a distinct state with gate and evidence implications.

- Changes Requested: renders as a distinct state with gate and evidence implications.

- Approved: renders as a distinct state with gate and evidence implications.

- Locked: renders as a distinct state with gate and evidence implications.

- Issued: renders as a distinct state with gate and evidence implications.

- Superseded: renders as a distinct state with gate and evidence implications.

- Archived: renders as a distinct state with gate and evidence implications.


## 10.2 Upload Requirements

- Upload affordances appear only in surfaces explicitly designed to accept files, such as artifact detail, evidence drawer, or future data readiness handoff. They must not appear as working runtime if upload/parsing is not implemented.

- Accepted future file types should include PDF, DOCX, XLSX, CSV, PPTX, TXT, and structured pricing templates where appropriate. Each file type receives a default classification, such as vendor response, pricing template, contract, scope document, workshop notes, or evidence artifact.

- The default work-object association is the current sourcing event, stage, artifact, vendor, or data readiness category from which the upload was initiated.

- Parse status must be visible: uploaded, queued, parsed, failed conversion, available, usable evidence, low confidence, stale, restricted.

- Failed conversion must render as stored but not yet usable as evidence. The UI must not cite failed or unparsed uploads as evidence.

- Every upload, classification change, parse success/failure, evidence promotion, and review action should later emit an audit event.


## 10.3 Review and Approval Requirements

- Review is a first-class artifact state, not just a comment area. It should show reviewer, due date, comments, changes requested, and evidence gaps.

- Steward owns the gate implication of review and approval states. Nexus can guide next actions, but Steward determines whether a gate is blocked or ready.

- Approval placeholders can show required reviewers and approval status, but they must not imply a persistent approval engine until implemented.

- Waivers require rationale and should be visually distinct from approval. Waiver does not equal evidence; it is a governance decision to proceed despite a gap.

- Artifact versioning should be designed around superseded, current, locked, and issued states, but version engine behavior is deferred.


---


# 11. Cross-Surface Requirements


|Cross-surface link|Requirement|

|---|---|

|Source to Programs|Source events should show linked program code where known. Program pages should show a Source event chip when a sourcing event supports the transformation.|

|Source to Admin/Setup|Data readiness gaps should route conceptually to Admin/Setup. Source consumes readiness; it does not duplicate connector setup.|

|Source to Intelligence|Commercial risks, evidence gaps, and sourcing patterns should become Sentinel signals where appropriate.|

|Source to Control Tower|Value at stake, decision posture, blocked gates, and commercial risks should roll into Atlas executive views.|

|Source to Production Readiness|Production readiness tracker should reflect route smoke, UI readiness, evidence/upload absence, and live validation blockers.|

|Source to Experience Gallery|Visual and agent-centric rules should remain aligned with the Experience System and design gallery.|




## 11.1 Consistency Rules

- Stage names must not drift between dashboard, event canvas, scorecard, artifact, value ledger, and trackers.

- Vendor names must remain consistent across response completeness, pricing, BAFO, executive decision, and selection readiness.

- Linked program identifiers such as APX-CDP-2026 must render consistently across Programs and Source.

- Data readiness state labels must use the canonical list and must not introduce unapproved synonyms.

- Agent names must remain Nexus, Sentinel, Steward, and Atlas. Do not create agent nicknames in product UI.

- Value states must distinguish projected, committed, measuring, and realized. Do not show realized where only projected evidence exists.


---


# 12. Implementation Status and Gaps


|Capability|Status|What exists|Remaining gap|

|---|---|---|---|

|Source dashboard|Implemented|Dashboard, mission preview, event queue, pressure signals.|Context-used and action enforcement should remain consistent.|

|Source events portfolio|Implemented|Portfolio command surface landed in PR #412.|Further drawer/filter polish can follow.|

|Event canvas|Implemented / strong partial|Journey, stage gates, artifacts, data readiness, commercial/executive surfaces.|Needs drawer/action/context consistency.|

|Scope workspace|Implemented|Pricing readiness, scope details, missing inputs.|May need visual QA polish.|

|Data readiness panel|Implemented|Contract-shaped readiness rows and workflow impact.|Real Admin/Setup live backing deferred.|

|RFP readiness|Implemented|Tiering and panel surface.|No document generation yet.|

|Vendor response completeness|Implemented|Vendor completeness and comparability.|No real upload/parsing.|

|Pricing normalization|Implemented|Deterministic pricing comparison and traps.|No market benchmarks or live vendor data.|

|BAFO / negotiation|Implemented|Questions, assumptions, risks.|No actual vendor messaging.|

|Executive decision|Implemented|Model and panel.|No final selection automation.|

|Vendor selection readiness|Verify current state|Planned and prompted; code status should be checked.|No final selection automation.|

|Stage gates|Implemented|Stage gate model and panel.|No workflow/approval engine.|

|Artifact strip|Implemented|Status strip in event canvas.|Artifact detail shell still needs compliance if not built.|

|Scorecard governance|Partial / gap|Route exists, thin governance shell.|Needs Steward-led shell.|

|Artifact detail|Partial / gap|Read-only artifact detail exists.|Needs review shell and evidence/version placeholders.|

|Source value ledger|Partial / gap|Value table exists.|Needs Atlas-led shell.|

|Context-used enforcement|Partial|Present in some surfaces.|Needs route-family consistency.|

|Upload/parsing|Not started|Future requirement only.|Must not be implied.|

|Approval/workflow engine|Not started|Gate placeholders exist.|Full engine deferred.|

|Model runtime|Not started|No-model deterministic behavior.|Model gateway prep required before calls.|




## 12.1 Known Highest-Value Gaps

- Scorecard Governance shell should become Steward-led and wireframe-compliant, with rationale, evidence confidence, readiness meter, audit placeholder, and action layer.

- Artifact Detail should become an artifact review shell with metadata strip, evidence state, review posture, version placeholder, and upload caveat.

- Source Value Ledger should become an Atlas-led value posture surface with projected/committed/measuring/realized states.

- Context-used and three choices plus custom behavior must be consistent across Source subroutes.

- Real upload/parsing and evidence ledger should be planned carefully before runtime build.

- Production-domain visual QA should capture desktop/tablet screenshots for active Source pages.

- Vendor selection readiness implementation status should be verified against main before further work.


---


# 13. QA and Acceptance Criteria


## 13.1 Universal Page Acceptance Criteria

- All five questions are answerable within three seconds: where am I, what matters, what is blocked, what does the agent recommend, what should I do next.

- The primary agent editorial is context-specific and cannot apply to any generic event.

- Context-used information is visible or accessible.

- Three choices plus custom appears where the user needs to move workflow forward.

- Data-bound elements map to deterministic seed data today and a real future data source tomorrow.

- Missing data and low confidence states are disclosed honestly.

- No model calls, upload/parsing, approval engine, workflow engine, or final selection automation is implied unless implemented.

- Page-specific smoke tests verify the key wireframe contract.

- No generic chatbot panel is used as the primary interaction model.


## 13.2 Suggested Test Families


|Test family|Purpose|

|---|---|

|Route shell tests|Confirm routes mount canonical Source shell, active surface, context strip, and deterministic caveats.|

|Wireframe compliance tests|Assert required zones, agent editorial, context-used, action layer, and absence of forbidden behavior.|

|Data binding tests|Assert seeded categories, vendor records, pricing assumptions, artifacts, gates, and value rows render deterministically.|

|No-fabrication tests|Assert missing data is disclosed and not silently treated as usable evidence.|

|No model/upload tests|Assert Source UI and models do not import model providers, upload/parsing runtime, workflow or approval engines.|

|Commercial consistency tests|Assert executive summary consumes canonical commercial signals and mission adapters.|

|Visual QA checklist|Manual screenshot review for desktop/tablet on production-domain routes.|




## 13.3 Persona Crawler Expectations

A persona crawler for Source should be able to act as a Sourcing Lead, CIO, CFO, Steward/Admin user, and Vendor Management Lead. The crawler should land on /source, enter the Apex Retail AMS event, identify the current stage, inspect data readiness, inspect RFP readiness, inspect vendor/pricing/BAFO/executive decision, and leave with a clear next action. The route should receive ACCEPT only if the crawler can identify the stage, blockers, agent recommendation, and next action without asking a blank prompt.


---


# 14. Codex Implementation Guidance

Future Codex work should use this dossier as the product requirements and design source of truth for AbarVa Source. Codex should not treat Source as a generic procurement product or invent new sourcing stages. When implementing a slice, Codex should reference the relevant step design sheet, page route requirement, data binding section, and agent behavior requirements.


## 14.1 Standard Work Order Rules

- Use Codex Spark Medium by default.

- One branch per slice and one PR per slice.

- Run local validation before PR.

- Monitor checks and merge when green and scoped.

- Stop for auth/security/model/upload/persistence/migration ambiguity.

- Do not run git add .

- State/tracker update slices run last.

- Preserve JSON formatting and avoid noisy diffs.

- Include design compliance gate for UI slices.

- Update production readiness only when readiness truly changes.


## 14.2 Design Compliance Gate

Before UI work, Codex must read the Experience System master anchor, design decisions lock, brand language, tokens, visual acceptance criteria, Source event wireframe, agent panel, data table, artifact strip, review/approval panel, context-used strip, and agent response card specifications. The PR review packet must cite the design files used and explain deviations.


## 14.3 Recommended Next Build Sequence


|Priority|Slice|Reason|

|---|---|---|

|P0|Scorecard Governance shell|P0 wireframe gap; brings Steward governance into Source subroute.|

|P0|Artifact Detail review shell|P0 wireframe gap; makes artifacts feel like workflow objects.|

|P0|Source Value Ledger Atlas shell|P0 wireframe gap; clarifies value posture and prevents fake savings.|

|P1|Context-used / 3 choices enforcement|Agent-centric consistency across Source pages.|

|P1|Production-domain visual QA|Validate actual visual quality and brand/nav consistency.|

|P1|Upload/evidence planning|Prepare runtime boundaries for evidence without implementing prematurely.|

|P2|Model Gateway prep|Only after deterministic context/evidence contracts are stable.|




---


# 15. Appendices


## 15.1 Glossary


|Term|Definition|

|---|---|

|Usable Evidence|Data validated enough to support claims or citations.|

|Loaded Data|Data present in the system but not yet parsed/validated.|

|Context Bundle|Structured data package used by agents to produce context-aware responses.|

|Stage Gate|Governed readiness decision between stages.|

|BAFO|Best and final offer; negotiation phase before selection review.|

|Selection Readiness|Determination of whether selection review can happen; not automated vendor selection.|

|Artifact|Workflow object with status, evidence, review, and approval posture.|

|Wireframe Compliance|Alignment of route/page with canonical zones, agent editorial, context used, interactions, and failure-mode prevention.|




## 15.2 Forbidden Claims

- Do not claim production readiness unless required gates pass.

- Do not claim live telemetry for seeded data.

- Do not claim real market benchmark comparisons without licensed/cited sources.

- Do not claim a document is usable evidence merely because it is uploaded or loaded.

- Do not claim final vendor selection readiness if blockers remain.

- Do not claim approval if only placeholder status exists.

- Do not claim realized savings without measurement owner and evidence.


## 15.3 Final Product Requirement Statement

AbarVa Source must help enterprise technology teams move from sourcing ambiguity to evidence-backed decisions. It should expose the operating details that usually remain buried in spreadsheets, workshops, email threads, and vendor decks: scope, data readiness, artifacts, evidence, scorecards, pricing assumptions, commercial traps, negotiation asks, executive tradeoffs, gates, and value. The product is successful when a sourcing lead, CIO, CFO, and Steward can all land on the same event and understand what is ready, what is blocked, what is risky, what is evidenced, what the agents recommend, and what action should happen next.

---

# 16. Detailed Step Interaction and Data Binding Appendices
This appendix expands the 11-step process into implementation-ready interaction maps. Each step describes what the user sees, what data is required, which agent leads, how context is set, what actions are offered, which drawers can open, and which tests should prove that the experience is not generic. These sheets are intentionally repetitive where repetition protects implementation consistency.

---

## 16.1 Step 01 Detailed Interaction Map - Strategy
This step answers: What technology service, platform, or vendor capability are we sourcing, and why? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Nexus. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Nexus gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Strategy|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Nexus should say: "For this Strategy step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 01 / Strategy with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.2 Step 02 Detailed Interaction Map - Scope
This step answers: Is the IT service scope clear enough for vendor pricing and delivery accountability? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Nexus. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Nexus gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Scope|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Nexus should say: "For this Scope step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 02 / Scope with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.3 Step 03 Detailed Interaction Map - RFP / RFI Readiness
This step answers: Can we release a defensible technology services RFP/RFI package? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Nexus. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Nexus gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|RFP / RFI Readiness|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Nexus should say: "For this RFP / RFI Readiness step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 03 / RFP / RFI Readiness with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.4 Step 04 Detailed Interaction Map - Vendor Responses
This step answers: Are vendor responses complete enough to compare? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Nexus. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Nexus gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Vendor Responses|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Nexus should say: "For this Vendor Responses step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 04 / Vendor Responses with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.5 Step 05 Detailed Interaction Map - Evaluation
This step answers: Which vendors are credible after scorecard, evidence, risk, and solution review? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Steward. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Steward gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Evaluation|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Steward should say: "For this Evaluation step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 05 / Evaluation with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.6 Step 06 Detailed Interaction Map - Pricing Normalization
This step answers: Are prices comparable after scope, assumptions, volumes, transition, and exclusions are normalized? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Nexus. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Nexus gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Pricing Normalization|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Nexus should say: "For this Pricing Normalization step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 06 / Pricing Normalization with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.7 Step 07 Detailed Interaction Map - BAFO / Negotiation
This step answers: What must we ask, lock, clarify, or negotiate before final evaluation? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Nexus. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Nexus gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|BAFO / Negotiation|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Nexus should say: "For this BAFO / Negotiation step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 07 / BAFO / Negotiation with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.8 Step 08 Detailed Interaction Map - Executive Decision
This step answers: What should CIO/CFO/Steering Committee understand before selection review? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Atlas. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Atlas gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Executive Decision|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Atlas should say: "For this Executive Decision step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 08 / Executive Decision with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.9 Step 09 Detailed Interaction Map - Vendor Selection Readiness
This step answers: Are we ready to recommend a technology partner for selection review? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Steward. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Steward gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Vendor Selection Readiness|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Steward should say: "For this Vendor Selection Readiness step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 09 / Vendor Selection Readiness with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.10 Step 10 Detailed Interaction Map - Transition Readiness
This step answers: Are we ready to mobilize the selected vendor safely? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Steward. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Steward gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Transition Readiness|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Steward should say: "For this Transition Readiness step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 10 / Transition Readiness with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

## 16.11 Step 11 Detailed Interaction Map - Value Realization
This step answers: Are technology outcomes, cost savings, service improvements, and operational KPIs being measured? The page must present the answer through a combination of stage orientation, context-used disclosure, data/artifact readiness, agent editorial, and an action layer. The primary agent is Atlas. The product should never ask the user to start from a blank prompt.

|Zone|Desktop behavior|Mobile behavior|Data binding|
|---|---|---|---|
|Top shell|AbarVa wordmark, active Source nav, tenant context, user menu.|Condensed shell with menu drawer and active Source label.|tenantSlug, user role, active surface.|
|Context strip|Event name, linked program, stage, gate state, value at stake, deterministic caveat.|Stacked chips with key stage and blocker first.|sourcingEvent, linkedProgramCode, stageGate, valueAtStake.|
|Lead editorial|Atlas gives a 60-120 word stage-specific brief.|Same content shortened to 45-75 words.|Context bundle, stage state, blockers, agent missions.|
|Primary workspace|Table/list hybrid showing data, artifacts, vendors, pricing, gates, or value depending on step.|Cards stack in priority order; tables become compact rows.|stage-specific read model.|
|Agent rail|Supporting agent cautions, context-used, confidence, and next actions.|Collapsible rail below lead editorial.|agent mission model, evidence confidence.|
|Drawer layer|Context, evidence, gate, artifact, vendor, pricing, value drawers as applicable.|Full-screen drawer panels.|drawer-specific data source.|

|Interactive element|Click target|Permission|Success state|Failure state|Audit / history impact|
|---|---|---|---|---|---|
|Show missing inputs|Data readiness drawer or section anchor|Source viewer|Drawer opens with missing categories and owners.|Show unavailable state and Steward handoff.|Record read-only inspection event when audit logging exists.|
|Explain gate impact|Gate detail drawer|Source viewer|Gate explanation shows blockers, evidence, approvals, waiver path.|Show gate context unavailable.|Adds explanation to conversation/history only when agent session exists.|
|Show evidence gaps|Evidence drawer|Source viewer with evidence permission|Evidence state list opens with Sentinel cautions.|Show access restricted or no evidence available.|Future audit event: evidence_viewed.|
|Ask custom|Custom prompt field or disabled placeholder if chat not enabled|Source contributor if enabled|If no model runtime, show deterministic caveat and route to available actions.|Show model runtime unavailable.|No model call until gateway exists.|

|Context bundle category|Required?|Example seeded value|Thin-context behavior|
|---|---|---|---|
|Event|Required|Apex Retail AMS Outsourcing 2026|If missing, page cannot render stage-specific guidance.|
|Stage|Required|Value Realization|If missing, show recovery state and no stage recommendation.|
|Data readiness|Required for stages 2-4|Ticket History = Missing, Vendor Spend = Usable Evidence|Agent names missing categories and refuses unsupported readiness.|
|Artifacts|Required for gates|RFP Package = Outline, Pricing Template = Locked|If missing, Steward shows gate cannot be verified.|
|Vendor/pricing/commercial|Required for stages 4-9|Vendor A transition excluded, Vendor B pricing incomplete|If missing, Atlas/Nexus withhold vendor comparison.|
|Evidence confidence|Required when claims appear|Vendor contract loaded but not usable evidence|Sentinel marks low confidence and prevents citation.|

### Step-specific agent copy
Atlas should say: "For this Value Realization step, I am using the current event, stage, gate state, artifact status, and evidence confidence. I will not treat missing or loaded-only data as usable evidence. The next action is tied to the current blocker, not a generic prompt."

### Step-specific tests
- Route or component test renders Step 11 / Value Realization with deterministic data.
- Agent editorial includes event, stage, blocker, and next action.
- Context-used fields are visible or drawer-accessible.
- No model provider, upload runtime, workflow engine, or approval engine imports appear.
- Three choices plus custom are context-specific and do not use filler language.

---

# 17. Page-Level Click Maps and Drawer Contracts
The following click maps specify the target behavior for core Source pages. A visible button without a specified target is forbidden. Where runtime behavior is deferred, the action must render as a safe placeholder or disabled state with explanation.

## /source

|Click source|Click target / behavior|Runtime status|
|---|---|---|
|Open event row|/source/events/[eventId]|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Filter status|query parameter update|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Mission preview|mission detail drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Show pressure signal|signal detail drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Explain value at stake|value context drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|

## /source/events

|Click source|Click target / behavior|Runtime status|
|---|---|---|
|Event row|/source/events/[eventId]|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Stage filter|query parameter update|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Status filter|query parameter update|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Linked program chip|program route if safe or linked program drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Nexus action|context-specific drawer/action|Implemented if route/component exists; otherwise safe placeholder with caveat.|

## /source/events/[eventId]

|Click source|Click target / behavior|Runtime status|
|---|---|---|
|Journey step|switch stage workspace or show locked/future state|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Gate panel|gate detail drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Artifact strip item|artifact detail route/drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Vendor/pricing row|vendor/pricing detail drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Context-used chips|context drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|

## /source/events/[eventId]/scorecard

|Click source|Click target / behavior|Runtime status|
|---|---|---|
|Criterion row|rationale/evidence drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Show blockers|gate drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Show evidence gaps|evidence drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Explain gate impact|gate detail drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Ask custom|disabled/model-gateway caveat unless enabled|Implemented if route/component exists; otherwise safe placeholder with caveat.|

## /source/events/[eventId]/artifacts/[artifactId]

|Click source|Click target / behavior|Runtime status|
|---|---|---|
|Show evidence|evidence drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Show version history|version placeholder drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Explain missing inputs|missing input drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Request changes|disabled/review-engine caveat unless enabled|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Approve|disabled/approval-engine caveat unless enabled|Implemented if route/component exists; otherwise safe placeholder with caveat.|

## /source/value

|Click source|Click target / behavior|Runtime status|
|---|---|---|
|Show assumptions|assumptions drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Show evidence gaps|evidence drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Explain value confidence|Atlas explanation drawer|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Open event|linked Source event|Implemented if route/component exists; otherwise safe placeholder with caveat.|
|Prepare CFO brief|future artifact placeholder|Implemented if route/component exists; otherwise safe placeholder with caveat.|

---

# 18. Field-Level Data Binding Reference
This reference lists fields that should be present in the Source context bundle and future real data layer. Seed data can provide these fields today; real data should replace them through Admin/Setup readiness, uploaded files, parsed documents, vendor submissions, artifact store, approvals, audit, and workflow state.

|Field|Description|Seed today|Real source tomorrow|
|---|---|---|---|
|sourcingEvent.eventId|Unique event identifier|evt-source-data-ai-si-selection|sourcing_events.id|
|sourcingEvent.tenantSlug|Tenant/client slug|apex-retail|tenant table / auth context|
|sourcingEvent.linkedProgramCode|Linked program|APX-CDP-2026|program association table|
|stage.currentStep|Current canonical step|Scope|workflow state table|
|stage.gateState|Current gate state|blocked / deferred|workflow/gate state table|
|dataReadiness.category|Required data category|Ticket History|Admin/Setup data domain readiness|
|dataReadiness.state|Readiness state|Missing|data readiness service|
|artifact.status|Artifact status|In Review|artifact store|
|vendor.responseStatus|Vendor response state|partially_complete|vendor submission system|
|pricing.normalizedAnnualRunCost|Normalized run cost|demo numeric value|pricing normalization service|
|commercialRisk.type|Risk pattern|transition_excluded|commercial risk detector|
|bafo.vendorQuestions|Vendor-specific questions|ask transition inclusion|BAFO model / future artifact|
|executive.decisionPosture|Executive posture|proceed_to_bafo|executive decision summary service|
|selection.selectionReviewReady|Selection readiness boolean|false|vendor selection readiness service|
|value.realizationState|Value state|projected|value ledger|
|evidence.confidence|Evidence confidence|low / partial / usable|evidence ledger|

---

# 19. Training and Grounding Example Library
This library supplies training-style examples for agent response quality. It should be used by future model gateway prompt assembly, deterministic test harnesses, and human review. These examples show the expected specificity and the difference between context-aware intelligence and generic AI responses.

|Agent|Scenario|Expected response pattern|
|---|---|---|
|Nexus|full context|I am using the Apex Retail AMS event, current Scope/RFP posture, data readiness, artifact status, and commercial signals to recommend the next sourcing action. I will not claim RFP release readiness when ticket history, SLA baseline, or pricing template detail is missing.|
|Nexus|thin context|I am using the Apex Retail AMS event, current Scope/RFP posture, data readiness, artifact status, and commercial signals to recommend the next sourcing action. I will not claim RFP release readiness when ticket history, SLA baseline, or pricing template detail is missing.|
|Nexus|blocked state|I am using the Apex Retail AMS event, current Scope/RFP posture, data readiness, artifact status, and commercial signals to recommend the next sourcing action. I will not claim RFP release readiness when ticket history, SLA baseline, or pricing template detail is missing.|
|Nexus|executive pressure|I am using the Apex Retail AMS event, current Scope/RFP posture, data readiness, artifact status, and commercial signals to recommend the next sourcing action. I will not claim RFP release readiness when ticket history, SLA baseline, or pricing template detail is missing.|
|Nexus|evidence caveat|I am using the Apex Retail AMS event, current Scope/RFP posture, data readiness, artifact status, and commercial signals to recommend the next sourcing action. I will not claim RFP release readiness when ticket history, SLA baseline, or pricing template detail is missing.|
|Sentinel|full context|I am checking whether claims are supported by usable evidence. Loaded or uploaded files are not automatically evidence. Vendor automation and savings claims require citation, contract language, or validated source data.|
|Sentinel|thin context|I am checking whether claims are supported by usable evidence. Loaded or uploaded files are not automatically evidence. Vendor automation and savings claims require citation, contract language, or validated source data.|
|Sentinel|blocked state|I am checking whether claims are supported by usable evidence. Loaded or uploaded files are not automatically evidence. Vendor automation and savings claims require citation, contract language, or validated source data.|
|Sentinel|executive pressure|I am checking whether claims are supported by usable evidence. Loaded or uploaded files are not automatically evidence. Vendor automation and savings claims require citation, contract language, or validated source data.|
|Sentinel|evidence caveat|I am checking whether claims are supported by usable evidence. Loaded or uploaded files are not automatically evidence. Vendor automation and savings claims require citation, contract language, or validated source data.|
|Steward|full context|I am checking whether the next gate can advance. If required artifacts, approvals, data readiness, or rationale are missing, I will show blocked, deferred, or waiver-required rather than silently advancing the workflow.|
|Steward|thin context|I am checking whether the next gate can advance. If required artifacts, approvals, data readiness, or rationale are missing, I will show blocked, deferred, or waiver-required rather than silently advancing the workflow.|
|Steward|blocked state|I am checking whether the next gate can advance. If required artifacts, approvals, data readiness, or rationale are missing, I will show blocked, deferred, or waiver-required rather than silently advancing the workflow.|
|Steward|executive pressure|I am checking whether the next gate can advance. If required artifacts, approvals, data readiness, or rationale are missing, I will show blocked, deferred, or waiver-required rather than silently advancing the workflow.|
|Steward|evidence caveat|I am checking whether the next gate can advance. If required artifacts, approvals, data readiness, or rationale are missing, I will show blocked, deferred, or waiver-required rather than silently advancing the workflow.|
|Atlas|full context|I am summarizing the decision for leadership. I will state value at stake, commercial risk, transition risk, evidence confidence, unresolved assumptions, and the decision posture without selecting a vendor automatically.|
|Atlas|thin context|I am summarizing the decision for leadership. I will state value at stake, commercial risk, transition risk, evidence confidence, unresolved assumptions, and the decision posture without selecting a vendor automatically.|
|Atlas|blocked state|I am summarizing the decision for leadership. I will state value at stake, commercial risk, transition risk, evidence confidence, unresolved assumptions, and the decision posture without selecting a vendor automatically.|
|Atlas|executive pressure|I am summarizing the decision for leadership. I will state value at stake, commercial risk, transition risk, evidence confidence, unresolved assumptions, and the decision posture without selecting a vendor automatically.|
|Atlas|evidence caveat|I am summarizing the decision for leadership. I will state value at stake, commercial risk, transition risk, evidence confidence, unresolved assumptions, and the decision posture without selecting a vendor automatically.|

---

# 20. Future Runtime Boundary Map
The product is intentionally staged. Deterministic read models and UI shells exist now. Runtime capabilities must be added only when their data, evidence, audit, and governance boundaries are clear.

|Runtime capability|Purpose|Current status|Boundary rule|
|---|---|---|---|
|Model Gateway|Routes all model calls, prompt assembly, audit, cost, policy, and model choice.|Not started / planned|Do not call models directly from UI or agents.|
|Upload and Parsing|Accepts files, classifies, parses, validates, promotes to evidence.|Not started|Do not treat uploaded files as usable evidence.|
|Evidence Ledger|Maps claims to sources and confidence.|Planned|Do not cite unsupported claims.|
|Artifact Store|Stores artifact versions, review state, export files.|Partial shells only|Do not implement export/import until store exists.|
|Approval Engine|Routes reviewers, captures approvals, waiver rationale, audit.|Not started|Do not show real approval actions.|
|Workflow Engine|Persists stage states, transitions, gates, tasks.|Deterministic state only|Do not automate gate advancement.|
|Audit Trail|Records user/agent/system actions.|Planned|Design audit events but do not claim live audit yet.|
|Tenant Security|Controls access to tenant evidence, programs, events.|Needs hardening|Stop for security ambiguity.|

---

# 21. Detailed Acceptance Checklist
- A sourcing lead can open the event and know the current stage, top blocker, and next action within three seconds.
- A CIO can understand executive decision posture without reading every vendor response.
- A CFO can see that pricing is normalized and understand which costs or exclusions make vendors non-comparable.
- A CISO can see security/compliance response posture and evidence confidence.
- A Steward can see gate state and required approval placeholders without a fake approval engine.
- A Sentinel response never cites loaded or uploaded files as usable evidence unless evidence state permits it.
- A Nexus recommendation always names missing inputs when readiness is blocked.
- An Atlas brief differentiates projected value from realized value.
- RFP readiness never claims Rich tier when critical baseline data is missing.
- Vendor selection readiness never claims final selection automation.
- Artifact detail screens disclose when upload/review/version behaviors are placeholders.
- All context-used chips and action choices are stage-specific.
- All disabled future actions explain what runtime is missing.
- All tests assert no model/upload/workflow/approval imports where those runtimes are not in scope.

---

# 22. Page-Specific Implementation Blueprints
This appendix expands the six Source routes into build-ready implementation blueprints. These notes are more tactical than the earlier design catalog. They translate the product requirements into component placement, required fields, test assertions, and failure prevention rules for each route. They should be used by Codex when converting this dossier into implementation waves.

---

## Source Dashboard (/source)
This route is a dashboard command surface. The primary agent is Nexus. The page must not ask the user to start with a blank prompt. It must show the current work object, the current risk or blocker, the agent recommendation, context used, and a clear next action.

|Region|Required elements|Data needed|Test assertion|
|---|---|---|---|
|Header / shell|Name-only AbarVa wordmark, active Source nav, tenant/client context, route title.|tenantSlug, route metadata, active surface.|Route renders canonical shell and active Source state.|
|Context strip|Event/program/stage/value/gate or portfolio context chips.|sourcing event, linked program, stage gate, value at stake.|Context chips are visible or intentionally absent with explanation.|
|Lead editorial|Nexus editorial with current state, blocker, and next action.|Context bundle and agent mission summary.|Editorial includes event/stage/blocker/action.|
|Primary data surface|Table-first content appropriate to route.|Route-specific read model.|Core table/list rows render seeded data.|
|Agent/decision support|Context-used, confidence, supporting agent notes, action suggestions.|agent missions, evidence confidence, readiness state.|No generic chatbot panel; action suggestions are specific.|
|Drawers / drilldowns|Evidence, context, gate, artifact, vendor, pricing, value drawers as relevant.|drawer-specific data source.|If drawer not implemented, trigger is disabled or described as future.|
|Caveats|Deterministic/demo, missing data, no live runtime claims.|readiness/provenance metadata.|No fake live telemetry, evidence, approvals, or model output.|

|Failure mode|Prevention requirement|
|---|---|
|Generic AI response|Agent text must mention event/stage or portfolio context.|
|Blank prompt dead-end|Show three choices plus custom or explicit route actions.|
|Static dashboard|Include agent recommendation and next workflow action.|
|False evidence|Distinguish loaded/available/usable evidence.|
|Fake automation|Disable or caveat future upload, approval, workflow, and model behaviors.|

---

## Source Events Portfolio (/source/events)
This route is a portfolio command surface. The primary agent is Nexus. The page must not ask the user to start with a blank prompt. It must show the current work object, the current risk or blocker, the agent recommendation, context used, and a clear next action.

|Region|Required elements|Data needed|Test assertion|
|---|---|---|---|
|Header / shell|Name-only AbarVa wordmark, active Source nav, tenant/client context, route title.|tenantSlug, route metadata, active surface.|Route renders canonical shell and active Source state.|
|Context strip|Event/program/stage/value/gate or portfolio context chips.|sourcing event, linked program, stage gate, value at stake.|Context chips are visible or intentionally absent with explanation.|
|Lead editorial|Nexus editorial with current state, blocker, and next action.|Context bundle and agent mission summary.|Editorial includes event/stage/blocker/action.|
|Primary data surface|Table-first content appropriate to route.|Route-specific read model.|Core table/list rows render seeded data.|
|Agent/decision support|Context-used, confidence, supporting agent notes, action suggestions.|agent missions, evidence confidence, readiness state.|No generic chatbot panel; action suggestions are specific.|
|Drawers / drilldowns|Evidence, context, gate, artifact, vendor, pricing, value drawers as relevant.|drawer-specific data source.|If drawer not implemented, trigger is disabled or described as future.|
|Caveats|Deterministic/demo, missing data, no live runtime claims.|readiness/provenance metadata.|No fake live telemetry, evidence, approvals, or model output.|

|Failure mode|Prevention requirement|
|---|---|
|Generic AI response|Agent text must mention event/stage or portfolio context.|
|Blank prompt dead-end|Show three choices plus custom or explicit route actions.|
|Static dashboard|Include agent recommendation and next workflow action.|
|False evidence|Distinguish loaded/available/usable evidence.|
|Fake automation|Disable or caveat future upload, approval, workflow, and model behaviors.|

---

## Source Event Canvas (/source/events/[eventId])
This route is a event workbench. The primary agent is Nexus. The page must not ask the user to start with a blank prompt. It must show the current work object, the current risk or blocker, the agent recommendation, context used, and a clear next action.

|Region|Required elements|Data needed|Test assertion|
|---|---|---|---|
|Header / shell|Name-only AbarVa wordmark, active Source nav, tenant/client context, route title.|tenantSlug, route metadata, active surface.|Route renders canonical shell and active Source state.|
|Context strip|Event/program/stage/value/gate or portfolio context chips.|sourcing event, linked program, stage gate, value at stake.|Context chips are visible or intentionally absent with explanation.|
|Lead editorial|Nexus editorial with current state, blocker, and next action.|Context bundle and agent mission summary.|Editorial includes event/stage/blocker/action.|
|Primary data surface|Table-first content appropriate to route.|Route-specific read model.|Core table/list rows render seeded data.|
|Agent/decision support|Context-used, confidence, supporting agent notes, action suggestions.|agent missions, evidence confidence, readiness state.|No generic chatbot panel; action suggestions are specific.|
|Drawers / drilldowns|Evidence, context, gate, artifact, vendor, pricing, value drawers as relevant.|drawer-specific data source.|If drawer not implemented, trigger is disabled or described as future.|
|Caveats|Deterministic/demo, missing data, no live runtime claims.|readiness/provenance metadata.|No fake live telemetry, evidence, approvals, or model output.|

|Failure mode|Prevention requirement|
|---|---|
|Generic AI response|Agent text must mention event/stage or portfolio context.|
|Blank prompt dead-end|Show three choices plus custom or explicit route actions.|
|Static dashboard|Include agent recommendation and next workflow action.|
|False evidence|Distinguish loaded/available/usable evidence.|
|Fake automation|Disable or caveat future upload, approval, workflow, and model behaviors.|

---

## Scorecard Governance (/source/events/[eventId]/scorecard)
This route is a governance workspace. The primary agent is Steward. The page must not ask the user to start with a blank prompt. It must show the current work object, the current risk or blocker, the agent recommendation, context used, and a clear next action.

|Region|Required elements|Data needed|Test assertion|
|---|---|---|---|
|Header / shell|Name-only AbarVa wordmark, active Source nav, tenant/client context, route title.|tenantSlug, route metadata, active surface.|Route renders canonical shell and active Source state.|
|Context strip|Event/program/stage/value/gate or portfolio context chips.|sourcing event, linked program, stage gate, value at stake.|Context chips are visible or intentionally absent with explanation.|
|Lead editorial|Steward editorial with current state, blocker, and next action.|Context bundle and agent mission summary.|Editorial includes event/stage/blocker/action.|
|Primary data surface|Table-first content appropriate to route.|Route-specific read model.|Core table/list rows render seeded data.|
|Agent/decision support|Context-used, confidence, supporting agent notes, action suggestions.|agent missions, evidence confidence, readiness state.|No generic chatbot panel; action suggestions are specific.|
|Drawers / drilldowns|Evidence, context, gate, artifact, vendor, pricing, value drawers as relevant.|drawer-specific data source.|If drawer not implemented, trigger is disabled or described as future.|
|Caveats|Deterministic/demo, missing data, no live runtime claims.|readiness/provenance metadata.|No fake live telemetry, evidence, approvals, or model output.|

|Failure mode|Prevention requirement|
|---|---|
|Generic AI response|Agent text must mention event/stage or portfolio context.|
|Blank prompt dead-end|Show three choices plus custom or explicit route actions.|
|Static dashboard|Include agent recommendation and next workflow action.|
|False evidence|Distinguish loaded/available/usable evidence.|
|Fake automation|Disable or caveat future upload, approval, workflow, and model behaviors.|

---

## Artifact Detail Review (/source/events/[eventId]/artifacts/[artifactId])
This route is a artifact review workspace. The primary agent is Nexus. The page must not ask the user to start with a blank prompt. It must show the current work object, the current risk or blocker, the agent recommendation, context used, and a clear next action.

|Region|Required elements|Data needed|Test assertion|
|---|---|---|---|
|Header / shell|Name-only AbarVa wordmark, active Source nav, tenant/client context, route title.|tenantSlug, route metadata, active surface.|Route renders canonical shell and active Source state.|
|Context strip|Event/program/stage/value/gate or portfolio context chips.|sourcing event, linked program, stage gate, value at stake.|Context chips are visible or intentionally absent with explanation.|
|Lead editorial|Nexus editorial with current state, blocker, and next action.|Context bundle and agent mission summary.|Editorial includes event/stage/blocker/action.|
|Primary data surface|Table-first content appropriate to route.|Route-specific read model.|Core table/list rows render seeded data.|
|Agent/decision support|Context-used, confidence, supporting agent notes, action suggestions.|agent missions, evidence confidence, readiness state.|No generic chatbot panel; action suggestions are specific.|
|Drawers / drilldowns|Evidence, context, gate, artifact, vendor, pricing, value drawers as relevant.|drawer-specific data source.|If drawer not implemented, trigger is disabled or described as future.|
|Caveats|Deterministic/demo, missing data, no live runtime claims.|readiness/provenance metadata.|No fake live telemetry, evidence, approvals, or model output.|

|Failure mode|Prevention requirement|
|---|---|
|Generic AI response|Agent text must mention event/stage or portfolio context.|
|Blank prompt dead-end|Show three choices plus custom or explicit route actions.|
|Static dashboard|Include agent recommendation and next workflow action.|
|False evidence|Distinguish loaded/available/usable evidence.|
|Fake automation|Disable or caveat future upload, approval, workflow, and model behaviors.|

---

## Source Value Ledger (/source/value)
This route is a value posture workspace. The primary agent is Atlas. The page must not ask the user to start with a blank prompt. It must show the current work object, the current risk or blocker, the agent recommendation, context used, and a clear next action.

|Region|Required elements|Data needed|Test assertion|
|---|---|---|---|
|Header / shell|Name-only AbarVa wordmark, active Source nav, tenant/client context, route title.|tenantSlug, route metadata, active surface.|Route renders canonical shell and active Source state.|
|Context strip|Event/program/stage/value/gate or portfolio context chips.|sourcing event, linked program, stage gate, value at stake.|Context chips are visible or intentionally absent with explanation.|
|Lead editorial|Atlas editorial with current state, blocker, and next action.|Context bundle and agent mission summary.|Editorial includes event/stage/blocker/action.|
|Primary data surface|Table-first content appropriate to route.|Route-specific read model.|Core table/list rows render seeded data.|
|Agent/decision support|Context-used, confidence, supporting agent notes, action suggestions.|agent missions, evidence confidence, readiness state.|No generic chatbot panel; action suggestions are specific.|
|Drawers / drilldowns|Evidence, context, gate, artifact, vendor, pricing, value drawers as relevant.|drawer-specific data source.|If drawer not implemented, trigger is disabled or described as future.|
|Caveats|Deterministic/demo, missing data, no live runtime claims.|readiness/provenance metadata.|No fake live telemetry, evidence, approvals, or model output.|

|Failure mode|Prevention requirement|
|---|---|
|Generic AI response|Agent text must mention event/stage or portfolio context.|
|Blank prompt dead-end|Show three choices plus custom or explicit route actions.|
|Static dashboard|Include agent recommendation and next workflow action.|
|False evidence|Distinguish loaded/available/usable evidence.|
|Fake automation|Disable or caveat future upload, approval, workflow, and model behaviors.|

---

# 23. Seed Data Expansion Requirements
The demo data must support a coherent Apex Retail storyline rather than disconnected screens. The data should be rich enough for a 30-minute demo while remaining honest that it is deterministic seed data.

|Seed object|Required fields|Why it matters|
|---|---|---|
|Apex Retail AMS event|eventId, tenantSlug, clientName, linkedProgramCode, category, stage, valueAtStake, owner, gateState|Binds Source to the Apex program narrative.|
|Vendor records|vendorId, vendorName, responseStatus, pricingStatus, evidenceStatus, assumptions, exclusions, transitionPlanStatus|Powers response completeness, pricing, BAFO, executive decision.|
|Stage gates|gateId, fromStage, toStage, state, blockers, requiredArtifacts, requiredData, ownerAgent|Powers Steward governance and transition between stages.|
|Artifacts|artifactId, title, stage, status, version, owner, evidenceState, approvalState|Makes deliverables visible and reviewable.|
|Data readiness rows|category, requirementLevel, state, owner, source, lastUpdated, confidence, workflowImpact|Powers data readiness and missing-input guidance.|
|Commercial risks|riskId, vendorId, type, severity, evidenceStatus, recommendedAsk|Powers commercial risk and BAFO intelligence.|
|Executive tradeoffs|vendor, value, risk, evidenceConfidence, blocker, decisionOption|Powers Atlas executive decision summary.|
|Value entries|valueId, sourceEventId, state, projectedValue, measurementOwner, evidenceState|Powers value ledger without fake realized savings.|

---

# 24. Example End-to-End Demo Walkthrough
The following walkthrough shows how the product should feel when the data, stages, agents, and artifacts are aligned. It is not a script for a marketing demo only; it is an acceptance walkthrough for the product experience.

## 1. Start at Source Dashboard
The sourcing lead sees Apex Retail AMS as the highest-pressure technology sourcing event. Nexus says the next priority is scope and RFP readiness. The dashboard shows value at stake, stage, blockers, and linked program.

## 2. Open Source Events Portfolio
The portfolio page shows multiple events but makes Apex Retail AMS the focus. Filters make it clear which events are blocked or waiting. The event row links to the event canvas.

## 3. Open Event Canvas
The user sees the event header, linked program APX-CDP-2026, journey map, stage gate, artifact strip, and Nexus guidance. Context used explains event, stage, data readiness, and commercial signals.

## 4. Review Scope
The Scope workspace says pricing readiness is blocked/partial because ticket history and SLA baseline are missing. Nexus recommends sending the minimum data request. Steward shows Scope to RFP gate status.

## 5. Review RFP Readiness
The RFP panel shows Outline-tier readiness, missing inputs, required sections, and release gate posture. The product does not pretend Rich-tier readiness exists.

## 6. Review Vendors
Vendor completeness shows which vendor responses are complete, partial, not comparable, or blocked. Missing pricing templates and weak evidence are visible.

## 7. Review Pricing and Commercial Risk
Pricing normalization shows comparable and non-comparable positions. Commercial traps reveal transition exclusions, weak automation commitments, and volume assumptions.

## 8. Prepare BAFO
Nexus shows vendor-specific BAFO questions. The user sees assumption locks, excluded scope, negotiation priorities, and expected value impact.

## 9. Read Executive Decision Summary
Atlas frames the decision as proceed to BAFO rather than final selection. The summary names viable vendors, blocked vendors, value at stake, and risks.

## 10. Check Selection Readiness
Steward shows whether selection review is ready, deferred, blocked, or waiver-required. The product does not automate final selection.

## 11. Discuss Transition and Value
Transition readiness and value realization remain future/partial. The product shows what will be needed: KT, access, runbook, measurement owner, evidence.

---

# 25. Final Delivery and Handoff Requirements
This dossier should be stored in the repo under docs/abarva-source/product-requirements/ as the canonical Source product requirements and design reference. It should be paired with the Source sourcing operating model, the Source wireframe specification pack, and the Source implementation gap audit. Future Codex work orders should cite this dossier before implementing any Source workflow behavior.
- If a new Source UI slice changes workflow behavior, update this dossier or add an implementation review that references it.
- If model calls are introduced, add a Model Gateway section and prove context assembly, evidence handling, refusal/caveat behavior, and audit requirements.
- If upload/parsing is introduced, update artifact and evidence sections with exact file handling, parse states, permissions, and audit events.
- If approval workflow is introduced, update gate and artifact approval sections with persistent state, reviewer roles, waiver rationale, and audit trail requirements.
- If new sourcing categories are added, confirm they are technology or IT sourcing categories or explicitly expand product scope with founder approval.