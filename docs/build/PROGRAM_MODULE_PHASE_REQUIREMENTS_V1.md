# AbarVa Programs Application Control Plane Requirements V1

Last updated: 2026-05-01

## 1. Product Position

Programs is a strategy-to-approval and governance module.

Programs is not where complex implementation is executed. Execution happens in client systems and delivery tools such as Jira, Smartsheet, ServiceNow, Workday project plans, Epic implementation plans, SI PMO trackers, vendor workplans, spreadsheets, and steering-committee packs.

Programs is where AbarVa helps the client:

1. Shape an idea into a governed program.
2. Prove the problem with evidence.
3. Synthesize the strategic recommendation.
4. Design the target state and operating model.
5. Build the execution roadmap.
6. Package the business case and mobilization approval.
7. Hand execution monitoring to Tower with a clear data contract.

The module should feel like a senior strategy partner plus a governance office, not a generic project-management tool.

## 2. Non-Negotiable Design Principles

| Principle | Requirement |
| --- | --- |
| One phase at a time | Nexus must know the current phase and avoid jumping ahead without gate clearance. |
| Same canvas | Origination, chat, artifacts, review, and approvals should render in the same Programs canvas unless a true admin approval surface is required. |
| Strategy before execution | P4/P5/P6 prepare, approve, and monitor execution. They do not run implementation tasks inside Nexus. |
| Document-native | Upload, parse, edit, version, cite, approve, and export documents are first-class capabilities. |
| Tenant-private | Every read/write must be scoped to active `client_id` and tenant key. Cross-tenant writes are refused. |
| Evidence-bound | Every material recommendation should cite uploaded artifacts, tenant records, meeting notes, or clearly mark missing evidence. |
| Approval-aware | Nexus must distinguish drafted, saved, submitted, approved, rejected, and blocked states. |
| Testable by phase | Every requirement has a visible UI proof, DB proof, and crawler test. |

## 3. Cross-Phase Capability Stack

These capabilities are required across all phases, with different emphasis by phase.

| Capability | Product requirement | Persistence target |
| --- | --- | --- |
| Chat-guided strategy | Nexus asks the right next question for the active phase. | agent session + artifact stream |
| Artifact generation | Nexus drafts briefs, memos, guides, roadmaps, cases, and approval packets. | `deliverables_v2` or successor artifact table |
| Document upload | User uploads PDFs, DOCX, PPTX, XLSX, CSV, images, meeting transcripts, notes. | object storage + attachment metadata |
| Document extraction | Platform extracts text, structure, tables, dates, people, decisions, risks, metrics. | attachment extraction records + evidence candidates |
| Document editing | User can edit generated artifacts in-canvas before approval/export. | artifact version history |
| Document approval | Sponsor/admin can approve, reject, request changes, or waive criteria. | approval tables + audit trail |
| Meeting notes ingestion | User uploads or pastes meeting notes; Nexus extracts decisions, actions, risks, owners. | meeting notes + decision/action/risk records |
| Workshop support | Nexus creates agenda, facilitator guide, attendee list, pre-read, output template. | deliverables + workshop records |
| Evidence ledger | Nexus records which claims are supported and what is missing. | `evidence` and provenance links |
| Requirements traceability | Requirements connect to design choices, roadmap items, success criteria, and outcomes. | requirements/design/outcome link table |
| Gate evaluation | Nexus checks entry/exit criteria with hard/soft status. | gate evaluation snapshot |
| Approval routing | Nexus creates the right approval request for Setup, sponsor, finance, or steering group. | approval request table |
| Tower handoff | Nexus defines monitoring metrics and data feeds for execution tracking outside Programs. | tower monitoring contract |

## 4. Role And Permission Model

Each demo client should have a small but realistic user set.

| Role | Scope | Can do |
| --- | --- | --- |
| Client Admin | One tenant | Manage users, approve new program seeds, configure tenant setup, view all tenant programs. |
| Executive Sponsor | One tenant, assigned programs | Approve phase gates, business case, funding package, waivers, and scope decisions. |
| Program Lead | Assigned programs | Drive phase work, upload artifacts, edit deliverables, submit gate packets. |
| Contributor | Assigned programs | Upload documents, add notes, comment, complete assigned inputs. |
| Viewer | Assigned programs | Read artifacts, context, gate status, and Tower handoff. |
| AbarVa Maestro | Platform/admin | Configure demo tenants, inspect queues, resolve setup issues, but must not bypass tenant isolation silently. |

Permission rules:

| Rule | Requirement |
| --- | --- |
| Tenant lock | Demo users are locked to one client. |
| Admin login | Anand/admin may access admin functions but must still choose an active tenant before tenant writes. |
| Cross-tenant prompt | If a locked Meridian user asks to create Apex work, Nexus refuses and offers tenant switch/sign-in path. |
| Approval authority | Only Client Admin or configured approver can approve program seed. Only sponsor/admin can approve phase gates unless delegated. |
| Artifact edit rights | Program Lead and assigned contributors can edit drafts; sponsor approves. |
| Audit trail | Every approval, rejection, waiver, document version, and phase transition has actor/time/rationale. |

## 5. Private Application Control Plane Requirements

Programs must mimic a private client control plane even in demo. This document does not prescribe Pinecone, graph, corpus, or tenant knowledge-plane loading; those are separate data-plane workstreams. The requirement here is that every application workflow read/write is tenant-bound, auditable, and safe.

| Area | Requirement |
| --- | --- |
| Relational data | All program records include `client_id`; all queries filter by active client UUID. |
| Tenant key | Human-readable tenant key is used for display and setup queues, never as sole security boundary. |
| Object storage | Uploaded files include tenant, program, phase, artifact type, and uploader metadata. |
| App records | Programs, approvals, participants, deliverables, uploads, milestones, risks, and work items are tenant-scoped. |
| Audit | Every write records user, tenant, surface, source artifact, and created/updated timestamps. |
| Refusal | Missing tenant binding blocks tenant and full context modes. |

## 6. Phase Contract Summary

| Phase | Name | Purpose | Primary approval |
| --- | --- | --- | --- |
| P0 | Origination | Decide whether the idea is worth discovery. | Setup/admin seed approval, then P0 exit approval |
| P1 | Discovery | Prove the problem and baseline current state. | Sponsor accepts discovery findings |
| P2 | Strategic Synthesis | Convert evidence into a recommended strategic direction. | Sponsor/steering approves recommendation |
| P3 | Solution And Operating Model Design | Define target state, capabilities, governance, and operating model. | Sponsor approves design direction |
| P4 | Execution Roadmap | Define workstreams, estimates, timeline, milestones, dependencies, and execution success criteria. | Sponsor/finance reviews roadmap readiness |
| P5 | Business Case And Mobilization Approval | Package funding, stakeholder alignment, readiness, change plan, and launch authority. | Formal funding/mobilization approval |
| P6 | Tower Handoff And Execution Monitoring Setup | Define how external execution will be monitored, escalated, and value-tracked. | Tower monitoring contract accepted |

## 7. Phase Details

### P0 Origination

Purpose:

Turn a messy idea into a governed, fundable program seed.

What good looks like:

| Dimension | Good means |
| --- | --- |
| Problem | Specific pressure, trigger, or opportunity is named. |
| Sponsor | Named sponsor candidate has plausible authority. |
| Lead | Program lead or placeholder is captured. |
| Value | Value hypothesis includes cohort, behavior change, metric direction, and mechanism. |
| Scope | First cohort/use case is named; enterprise-wide ambition is bounded. |
| Pattern | Program archetype or pattern is selected. |

Functionality:

| Capability | Requirement |
| --- | --- |
| Guided chat | Ask only the questions needed to complete the seed. |
| Typo tolerance | Resolve obvious name/title typos, then confirm ambiguous people. |
| Person handling | Register placeholder only with user confirmation. |
| Brief progress | Right pane shows missing seed fields. |
| Save/submit | Program seed is persisted and submitted to Setup approval. |

Deliverables:

| Deliverable | Persistence |
| --- | --- |
| Program seed brief | `program_approval_requests.brief_snapshot` |
| Value hypothesis | brief snapshot + future deliverable |
| Sponsor/lead map | `engagement_participants` |
| Scope boundary | brief snapshot |
| Setup approval request | `program_approval_requests` |

Entry criteria:

User states an intent, pain, pressure, or opportunity.

Exit criteria:

| Criterion | Type |
| --- | --- |
| Program seed recorded | hard |
| Sponsor candidate named | hard |
| Value hypothesis seeded | hard |
| Scope boundary named | soft |
| Evidence family selected | soft |
| Setup/admin approval complete | hard |

### P1 Discovery

Purpose:

Prove the problem before designing the answer.

What good looks like:

| Dimension | Good means |
| --- | --- |
| Evidence | Problem has evidence beyond sponsor assertion. |
| Baseline | Metrics are defined, sourced, and caveated. |
| Stakeholders | People who feel the pain are named. |
| Systems | Source systems and data owners are identified. |
| Constraints | Regulatory, data, vendor, and operating constraints are visible. |

Functionality:

| Capability | Requirement |
| --- | --- |
| Discovery plan | Generate plan, workstreams, interviews, and evidence asks. |
| Meeting/workshop support | Generate agendas, guides, pre-reads, and output templates. |
| Notes ingestion | Extract decisions, risks, action items, owners, and evidence candidates. |
| Document upload | Accept current-state docs, architecture inventory, KPI extracts, RAID logs. |
| Evidence ledger | Convert uploaded facts into cited evidence records. |

Deliverables:

| Deliverable | Persistence |
| --- | --- |
| Discovery plan | `deliverables_v2` |
| Stakeholder interview guide | `deliverables_v2` |
| Current-state findings | `deliverables_v2` |
| Baseline metric pack | `deliverables_v2` + evidence |
| Evidence ledger | `evidence` |
| Discovery close packet | phase approval request |

Entry criteria:

Approved P0 seed with sponsor, lead, value hypothesis, and first scope.

Exit criteria:

| Criterion | Type |
| --- | --- |
| Current-state evidence captured | hard |
| Baseline metric/source/caveat defined | hard |
| Stakeholder map complete enough for decision | hard |
| Major constraints and contradictions surfaced | hard |
| Sponsor accepts problem statement | hard |

### P2 Strategic Synthesis

Purpose:

Turn discovery evidence into options, tradeoffs, and recommendation.

What good looks like:

| Dimension | Good means |
| --- | --- |
| Options | 2-4 credible strategic paths are compared. |
| Recommendation | Preferred path is explicit and evidence-backed. |
| Contradictions | Conflicting evidence and political tensions are named. |
| Risks | Failure modes are mapped to mitigations. |
| Decision | Sponsor can make a real go/no-go/reshape decision. |

Functionality:

| Capability | Requirement |
| --- | --- |
| Evidence synthesis | Summarize evidence with citations and confidence. |
| Pattern matching | Map to AbarVa failure modes and patterns. |
| Option modeling | Compare paths by value, risk, cost, speed, feasibility. |
| Decision support | Draft decision memo and steering discussion guide. |
| Traceability | Link recommendation back to discovery evidence and baseline. |

Deliverables:

| Deliverable | Persistence |
| --- | --- |
| Synthesis memo | `deliverables_v2` |
| Options analysis | `deliverables_v2` |
| Recommendation brief | `deliverables_v2` |
| Risk/failure-mode register | risk records + deliverable |
| Decision log | decision records |

Entry criteria:

Discovery evidence and baseline are captured.

Exit criteria:

| Criterion | Type |
| --- | --- |
| Recommended path selected | hard |
| Evidence supports recommendation | hard |
| Key contradictions dispositioned | hard |
| Sponsor/steering approval to design | hard |

### P3 Solution And Operating Model Design

Purpose:

Define the target-state solution, operating model, governance, and measurement model.

What good looks like:

| Dimension | Good means |
| --- | --- |
| Target state | Capability and operating model are concrete. |
| Design | Solution boundaries, data needs, integrations, controls, and ownership are defined. |
| Governance | Decision rights, forums, controls, and escalation paths are named. |
| Measurement | Success criteria and baseline-to-outcome logic are explicit. |
| Readiness | Major design gaps are known before roadmap planning. |

Functionality:

| Capability | Requirement |
| --- | --- |
| Design artifact generation | Draft target-state design, operating model, architecture implications. |
| Workshop support | Generate design workshop agenda, facilitator guide, and outputs. |
| Upload/edit | Upload architecture/docs, edit design artifacts, version changes. |
| Requirements traceability | Map requirements to design elements and measures. |
| Approval | Submit design for sponsor/steering sign-off. |

Deliverables:

| Deliverable | Persistence |
| --- | --- |
| Target-state design | `deliverables_v2` |
| Operating model | `deliverables_v2` |
| Architecture/data implications | `deliverables_v2` + evidence |
| Governance model | `deliverables_v2` |
| Measurement model | `deliverables_v2` |
| Design sign-off packet | phase approval request |

Entry criteria:

Approved strategic direction and recommendation.

Exit criteria:

| Criterion | Type |
| --- | --- |
| Target state and scope approved | hard |
| Operating model owners named | hard |
| Requirements mapped to design | hard |
| Success criteria defined | hard |
| Sponsor approves design direction | hard |

### P4 Execution Roadmap

Purpose:

Translate the strategy and design into an executable roadmap, estimates, milestones, dependencies, and success criteria by execution phase.

This phase does not execute implementation. It defines how execution will happen outside AbarVa.

What good looks like:

| Dimension | Good means |
| --- | --- |
| Workstreams | Execution workstreams are named with owners. |
| Timeline | Phases, durations, sequencing, dependencies, and critical path are visible. |
| Estimates | Cost, resource, vendor, and internal capacity estimates are captured. |
| Milestones | Critical milestones and decision gates are explicit. |
| Success criteria | Each execution phase has measurable success criteria. |
| Risks | Key execution risks have mitigations and owners. |

Functionality:

| Capability | Requirement |
| --- | --- |
| Roadmap generation | Generate execution roadmap from design and requirements. |
| Estimate support | Capture cost/resource assumptions, ranges, and confidence. |
| Milestone planning | Define critical milestones, gates, dependencies, and decision dates. |
| RACI | Map internal, vendor, sponsor, finance, and change roles. |
| Workshop support | Generate roadmap workshop agenda and output template. |
| Traceability | Link roadmap items to requirements, design elements, and outcomes. |

Deliverables:

| Deliverable | Persistence |
| --- | --- |
| Execution roadmap | `deliverables_v2` |
| Workstream plan | `deliverables_v2` |
| Timeline and milestone plan | `program_milestones` + deliverable |
| Cost/resource estimate | `deliverables_v2` |
| Execution risk register | `program_risks` |
| RACI / responsibility matrix | `deliverables_v2` |
| Success criteria by execution phase | requirement/outcome links |

Entry criteria:

Approved P3 target-state design, operating model, and measurement model.

Exit criteria:

| Criterion | Type |
| --- | --- |
| Roadmap covers all approved scope | hard |
| Cost/resource assumptions documented | hard |
| Critical milestones and dependencies named | hard |
| Execution success criteria defined by phase | hard |
| Sponsor/finance agree roadmap is fundable enough to package | hard |

### P5 Business Case And Mobilization Approval

Purpose:

Package everything required to secure funding, align stakeholders, confirm readiness, and authorize execution/activation outside the tool.

What good looks like:

| Dimension | Good means |
| --- | --- |
| Business case | Value, cost, timing, risks, and confidence are clear. |
| Funding ask | Requested funding and capacity are explicit. |
| Stakeholder alignment | Sponsor, finance, legal/compliance, operations, IT, and impacted leaders are aligned or dissent is documented. |
| Business readiness | Change, training, communications, and operating readiness are planned. |
| Governance | Execution governance cadence and decision rights are set. |
| Approval | Formal go/no-go/fund decision is captured. |

Functionality:

| Capability | Requirement |
| --- | --- |
| Business case generation | Draft funding memo and financial case. |
| Stakeholder alignment | Generate alignment map, dissent log, and sponsor briefing. |
| Readiness planning | Generate change, comms, training, and business readiness plans. |
| Approval workflow | Route funding/mobilization package to approvers. |
| Export | Export board/steering-ready packet to PDF/DOCX/PPTX when supported. |

Deliverables:

| Deliverable | Persistence |
| --- | --- |
| Business case | `deliverables_v2` |
| Funding request | `deliverables_v2` + approval |
| Stakeholder alignment packet | `deliverables_v2` |
| Change management plan | `deliverables_v2` |
| Business readiness assessment | `deliverables_v2` |
| Communications/training plan | `deliverables_v2` |
| Mobilization approval memo | phase approval request |

Entry criteria:

Execution roadmap, estimates, milestones, risks, and success criteria are complete enough for approval.

Exit criteria:

| Criterion | Type |
| --- | --- |
| Business case complete and evidence-backed | hard |
| Funding/capacity ask explicit | hard |
| Stakeholder alignment/dissent captured | hard |
| Business readiness and change plan complete | hard |
| Formal approval to mobilize execution captured | hard |

### P6 Tower Handoff And Execution Monitoring Setup

Purpose:

Define how execution will be monitored outside Programs and handed to Tower for ongoing governance.

This phase sets up tracking. It does not execute the work.

What good looks like:

| Dimension | Good means |
| --- | --- |
| Monitoring contract | Metrics, milestones, cadence, data sources, and owners are defined. |
| Data feeds | Weekly/monthly inputs are identified and feasible. |
| Escalation | Risk thresholds and escalation rules are explicit. |
| Benefits | Benefits realization cadence is tied to approved business case. |
| Handoff | Delivery owners understand what Tower will monitor. |

Functionality:

| Capability | Requirement |
| --- | --- |
| Monitoring setup | Generate Tower monitoring contract and scorecard. |
| Data feed mapping | Capture source systems/files, owners, cadence, and quality caveats. |
| Execution log ingestion | Accept weekly/monthly status, RAID, milestone, and benefits updates. |
| Tower integration | Create signals/thresholds for portfolio monitoring. |
| Closeout | Mark strategy package complete and hand execution monitoring to Tower. |

Deliverables:

| Deliverable | Persistence |
| --- | --- |
| Tower monitoring contract | `deliverables_v2` |
| KPI/milestone reporting model | metrics + milestone records |
| Data feed requirements | data contract record |
| Escalation rules | risk/signal rules |
| Benefits tracking cadence | outcome tracking record |
| Handoff memo | `deliverables_v2` |

Entry criteria:

Mobilization approval captured.

Exit criteria:

| Criterion | Type |
| --- | --- |
| Monitoring metrics and milestones defined | hard |
| Data sources and owners named | hard |
| Reporting cadence agreed | hard |
| Escalation thresholds set | hard |
| Tower handoff accepted | hard |

## 8. Agent Playbook Contract

The data/knowledge plane is handled separately. The application control plane still needs a deterministic phase contract so the agent knows which workflow state, buttons, required artifacts, and approval routes are valid in the current phase.

| App-control object | Required content |
| --- | --- |
| Phase workflow contract | Purpose, required artifacts, valid actions, exit gate, and approval route. |
| Artifact shell | Required fields, document status, version status, approval metadata. |
| Workshop shell | Agenda, attendees, prep, facilitation guide, output capture state. |
| Gate rubric | Hard/soft criteria, evidence requirements, waiver rules. |
| UI state map | Empty, draft, uploaded, parsed, generated, edited, submitted, approved, rejected. |
| Permission map | Which role can upload, edit, submit, approve, reject, waive, advance. |

Minimum first wave:

1. P0 seed brief template.
2. P1 discovery plan and interview guide.
3. P2 synthesis memo.
4. P3 target-state design.
5. P4 execution roadmap.
6. P5 business case and mobilization packet.
7. P6 Tower monitoring contract.

## 9. Application Data Model Updates Required

Existing tables cover part of this, but the application control plane needs explicit records for traceability and phase governance.

| Need | Current / likely target |
| --- | --- |
| Program shell | `engagements` |
| Participants | `engagement_participants` |
| Setup approval | `program_approval_requests` |
| Phase gate approval | `founder_approval_requests` or dedicated phase approval table |
| Deliverables | `deliverables_v2` |
| Artifact versions | deliverable version table or object metadata |
| Uploaded docs | attachment/object metadata table |
| Extracted evidence | `evidence` |
| Meetings/workshops | meeting/workshop records |
| Actions/decisions/risks | work items, decision log, risks |
| Requirements traceability | new requirements/design/outcomes link table |
| Roadmap/milestones | `program_milestones` plus roadmap deliverable |
| Tower handoff | monitoring contract + signal/rule records |

DB readiness rules:

| Rule | Requirement |
| --- | --- |
| No orphan artifacts | Every deliverable belongs to client, program, phase, and artifact type. |
| No unscoped uploads | Every upload includes client, program, uploader, and source surface. |
| No hidden approvals | Every approval/rejection/waiver has actor, timestamp, rationale, and target object. |
| No cross-tenant joins | Tenant-scoped reads do not mix client IDs. |
| No phase jump | Phase transition requires current phase, gate evaluation, and approval status. |

## 10. End-To-End Test Matrix

Each phase needs browser/API/DB verification.

| Test | Expected proof |
| --- | --- |
| P0 originate | Program seed saved, approval request created, Setup callout visible. |
| P0 approve | Admin approves; Home shows approved P0 program. |
| P0 exit | Nexus evaluates P0 criteria and submits P0 exit approval. |
| P1 discovery | Upload notes/docs, generate discovery plan, evidence records created. |
| P2 synthesis | Generate synthesis memo with citations and decision log. |
| P3 design | Generate target-state design, map requirements to design, submit design approval. |
| P4 roadmap | Generate execution roadmap with estimates, milestones, success criteria. |
| P5 package | Generate business case, readiness/change plan, funding approval packet. |
| P6 handoff | Generate Tower monitoring contract and tracking data requirements. |
| Tenant isolation | Locked tenant cannot create/read/write another tenant's program. |
| Document lifecycle | Upload -> extract -> draft -> edit -> version -> approve -> export. |

## 11. Immediate Build Order

Do not build all phases at once.

| Slice | Outcome |
| --- | --- |
| Slice 1 | Correct phase labels, doctrine, and phase contracts. |
| Slice 2 | P0 end-to-end: originate -> Setup approval -> Home approved P0 -> P0 exit approval. |
| Slice 3 | Document handling foundation: upload/extract/edit/version/approve/export contract. |
| Slice 4 | P1 Discovery artifact generation and meeting/workshop ingestion. |
| Slice 5 | P2/P3 synthesis and design traceability. |
| Slice 6 | P4 execution roadmap generator with estimates/milestones/success criteria. |
| Slice 7 | P5 business case and mobilization approval package. |
| Slice 8 | P6 Tower handoff and execution monitoring data contract. |

The crawler should not be called "green" until Slice 2 passes end to end.
