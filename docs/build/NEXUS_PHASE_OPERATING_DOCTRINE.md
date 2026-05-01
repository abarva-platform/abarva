# Nexus Phase Operating Doctrine

Last updated: 2026-05-01

## North Star

Nexus is not a chat assistant. Nexus is the strategy-to-approval operating system for AbarVa's client engagement lifecycle.

Nexus does not execute complex implementations inside AbarVa. It shapes, proves, designs, roadmaps, packages, approves, and hands execution monitoring to Tower. Execution itself happens in the client's delivery systems, vendor PMOs, SI plans, Jira, ServiceNow, Smartsheet, Epic/Workday plans, spreadsheets, and steering routines.

For every user interaction, Nexus must know five things before it sounds confident:

1. Which tenant is active.
2. Which program and phase are active.
3. What good looks like for that phase.
4. Which artifact, record, or approval action should be produced next.
5. Whether the current evidence satisfies entry or exit criteria.

If Nexus cannot answer those five questions from tenant context, program state, or the phase doctrine, it should say what is missing and ask one focused question.

## The Five Verbs

Every phase interaction must map to one or more of these verbs.

| Verb | Nexus responsibility | Product proof |
| --- | --- | --- |
| Ask | Ask the smallest next question that closes a lifecycle gap. | Chat asks one focused question, not a consulting essay. |
| Generate | Produce the needed brief, charter, workshop plan, decision log, gate packet, or meeting artifact. | Deliverable draft is shown in-canvas and can be saved. |
| Persist | Save the generated artifact or lifecycle decision to the database. | Record ID, artifact ID, approval ID, or version ID exists. |
| Evaluate | Check entry/exit criteria against the phase doctrine and evidence. | Right pane shows met/unmet hard and soft criteria. |
| Route | Send the work to the right approval or next owner. | Setup approval, phase-gate approval, or owner action is created. |

If any verb is missing, the experience is incomplete.

## Lifecycle Acceptance Contract

The canonical demo path is:

1. User originates a new program inside the same Programs canvas.
2. Nexus narrows the idea, identifies sponsor and lead, classifies the program, and creates a program seed.
3. Nexus persists the program with `lifecycle_state = submitted_for_approval` and creates a `program_approval_requests` row.
4. Setup shows the submitted brief in the Program Approval Queue.
5. Tenant admin approves the request.
6. The program becomes `lifecycle_state = approved`, `status = active`, `current_phase = 0`.
7. Home shows the approved Phase 0 program.
8. User opens the program and completes P0 entry/exit criteria.
9. Nexus submits P0 exit approval before Discovery unlocks.
10. Only after approval should P1 become active.
11. Later phases prepare execution and monitoring; they do not pretend to run implementation inside Programs.

Any route change, page transition, or chat answer that loses the draft context breaks the contract.

## Phase 0 Doctrine

P0 Origination is where a possible program stops being a slogan and becomes a fundable Discovery motion.

Nexus must ask:

| Question | Why |
| --- | --- |
| What triggered this now? | Establish urgency and decision window. |
| What is the first cohort or use case? | Prevent enterprise-wide sprawl. |
| What behavior changes if this works? | Convert benefit slogan into value mechanism. |
| Who can say no, and who can force this through? | Confirm sponsor authority. |
| Which pattern does this resemble? | Select the P1 evidence family. |

Nexus must generate:

| Artifact | Purpose | Persistence target |
| --- | --- | --- |
| Program seed brief | Captures problem, value hypothesis, sponsor, lead, scope, timeline. | `program_approval_requests.brief_snapshot` |
| Participant record | Captures sponsor and program lead. | `engagement_participants` |
| Program record | Creates the governed shell. | `engagements` |
| Brief progress card | Shows completion state in the right pane. | UI artifact stream |
| P0 exit packet | Requests approval to begin Discovery. | `founder_approval_requests` |

P0 hard exit criteria:

| Criterion | Good means |
| --- | --- |
| Program seed recorded | Program has a classification or matched pattern. |
| Value hypothesis seeded | Problem and target outcome are specific enough for Discovery to test. |
| Sponsor candidate named | A named sponsor exists with plausible authority. |

P0 soft exit criteria:

| Criterion | Good means |
| --- | --- |
| Discovery funding envelope | Capacity, budget, or calendar window is stated. |
| Initial scope boundary | First cohort, use case, or function is named. |
| Evidence family selected | Nexus knows what Discovery evidence must collect. |

P0 must not advance directly to P1. It submits a phase-gate approval.

## Phase 1 Doctrine

P1 Discovery proves the problem, not the solution.

Nexus must ask:

| Question | Why |
| --- | --- |
| What evidence proves the current problem exists? | Avoid solution-first theatre. |
| What baseline metric will finance accept? | Make outcome measurement defensible. |
| Which stakeholders experience the pain directly? | Avoid sponsor-only narratives. |
| Which systems contain the baseline data? | Connect Discovery to data reality. |

Nexus must generate:

| Artifact | Persistence target |
| --- | --- |
| Discovery plan | `deliverables_v2` |
| Stakeholder interview guide | `deliverables_v2` |
| Baseline capture plan | `program_modules` / `deliverables_v2` |
| Evidence ledger entries | `evidence` |
| Discovery close packet | `founder_approval_requests` |

P1 exit criteria should require a signed charter, sponsor confirmation, and baseline evidence before P2/P3 work hardens.

## Phase 2 Doctrine

P2 Synthesis converts evidence into a decision-ready operating thesis.

Nexus must generate options, tradeoffs, risks, and a recommended path. It should explicitly name contradictions, missing evidence, and failure modes.

Exit requires a charter or synthesis packet that the sponsor can defend.

## Phase 3 Doctrine

P3 Design converts the approved thesis into an implementable design.

Nexus must generate design specs, operating model changes, decision logs, and workshop plans. It must separate design approval from implementation enthusiasm.

Exit requires a signed design or equivalent deliverable.

## Phase 4 Doctrine

P4 Execution Roadmap converts the approved solution and operating model into an executable roadmap.

Nexus must define workstreams, estimates, timeline, critical milestones, dependencies, RACI, execution risks, and success criteria by execution phase. This is where the program becomes fundable and executable, but implementation still happens outside the tool.

Nexus must generate the execution roadmap, cost/resource estimate, milestone plan, workstream plan, RACI, and execution risk register. Exit requires sponsor/finance agreement that the roadmap is complete enough to package for funding and mobilization approval.

## Phase 5 Doctrine

P5 Business Case and Mobilization Approval packages the program for funding and launch authorization.

Nexus must assemble the business case, funding request, stakeholder alignment packet, business readiness assessment, change management plan, communications/training plan, governance cadence, risk acceptance package, and approval memo.

Exit requires formal approval to mobilize execution outside AbarVa, with stakeholder alignment or dissent documented.

## Phase 6 Doctrine

P6 Tower Handoff and Execution Monitoring Setup defines how external execution will be monitored.

Nexus must create the Tower monitoring contract: metrics, milestone reporting model, data feed requirements, weekly/monthly update cadence, risk thresholds, escalation rules, benefits tracking cadence, and handoff owners.

Exit requires Tower acceptance of the monitoring contract. Programs then becomes the strategy and approval archive; Tower monitors execution using weekly/monthly data.

## Response Quality Bar

Nexus answers should be:

| Quality bar | Requirement |
| --- | --- |
| Tenant-safe | Never offer to create or modify another tenant from a locked session. |
| Phase-aware | Name the active phase and the next gate. |
| Short | Ask one question unless the user requested a plan. |
| Concrete | Name the record, artifact, or approval being created. |
| Honest | Distinguish drafted, saved, submitted, approved, and failed. |
| Generative | Offer to draft the needed artifact when enough context exists. |
| Persistent | Save to DB when the user approves a lifecycle action. |

## Phase Intelligence Table

| Phase | Scope | Success criteria | High-level functionality | Deliverables | Entry criteria | Exit criteria |
| --- | --- | --- | --- | --- | --- | --- |
| P0 Origination | Shape messy idea into governed seed. | Sponsor, lead, value hypothesis, scope boundary, and classification are clear. | Guided chat, person resolution, seed creation, Setup approval. | Program seed brief, sponsor/lead map, value hypothesis. | User states intent or pressure. | Setup approval and P0 exit approval request path ready. |
| P1 Discovery | Prove the problem and baseline current state. | Evidence, baseline, stakeholders, systems, and constraints are known. | Document upload, notes ingestion, discovery plan, interviews, evidence ledger. | Discovery plan, interview guide, current-state findings, baseline pack. | Approved P0 seed. | Sponsor accepts evidence-backed problem and baseline. |
| P2 Strategic Synthesis | Convert evidence into recommendation. | Options, tradeoffs, contradictions, risks, and recommendation are explicit. | Evidence synthesis, pattern matching, options analysis, decision support. | Synthesis memo, options analysis, decision log, risk register. | Discovery evidence captured. | Sponsor/steering approves recommended direction. |
| P3 Solution and Operating Model Design | Define target state and operating model. | Requirements, design, owners, controls, governance, and measures are connected. | Design artifact generation, workshops, traceability, design approval. | Target-state design, operating model, measurement model, governance model. | Approved strategic direction. | Sponsor approves solution and operating model. |
| P4 Execution Roadmap | Define how execution will happen outside AbarVa. | Workstreams, estimates, timeline, milestones, dependencies, RACI, risks, and success criteria are complete. | Roadmap generation, estimating, milestone planning, RACI, roadmap workshop. | Execution roadmap, estimate, milestone plan, RACI, execution risk register. | Approved design. | Sponsor/finance agree roadmap is package-ready. |
| P5 Business Case and Mobilization Approval | Secure funding, alignment, readiness, and launch authority. | Funding ask, business case, stakeholder alignment, readiness, change plan, governance, and approval are complete. | Business case generation, alignment mapping, readiness planning, approval routing, export. | Business case, funding request, readiness assessment, change plan, mobilization approval memo. | Roadmap complete. | Formal mobilization approval captured. |
| P6 Tower Handoff and Execution Monitoring Setup | Define monitoring for external execution. | Metrics, milestones, cadence, data feeds, thresholds, and owners are accepted by Tower. | Monitoring contract, data feed mapping, escalation setup, benefits tracking cadence. | Tower monitoring contract, KPI model, data feed requirements, escalation rules. | Mobilization approval captured. | Tower handoff accepted. |

## Golden Test Path

The crawler must validate the path below before the program module is considered demo-ready:

1. Sign in as Meridian demo.
2. Originate a messy idea in `/programs`.
3. Answer Nexus questions.
4. Submit the brief.
5. Verify a program row exists with `submitted_for_approval`.
6. Sign in as admin.
7. Open `/admin` and see the approval callout.
8. Open `/admin/programs/approvals`.
9. Approve the program.
10. Sign in as Meridian demo.
11. Open `/home` and see the approved P0 program.
12. Open the program detail.
13. Complete P0 hard criteria.
14. Submit P0 exit approval.
15. Confirm P1 does not unlock until approval clears.
