# 18 FAILURE MODE CATALOG

## Purpose

AbarVa Source exists because enterprise technology sourcing fails in repeated, diagnosable ways. The product must detect those failure modes early, guide users toward stronger evidence, enforce gates, and preserve defensible decisions.

This catalog maps sourcing failure modes to Source capabilities, Nexus behavior, required evidence, and acceptance tests.

## Failure Mode Index

| ID | Category | Failure Mode | Description |
|---|---|---|---|
| FM-SC-01 | Scoping | Unclear scope | Services, outcomes, systems, or responsibilities are not sufficiently bounded |
| FM-SC-02 | Scoping | Hidden retained responsibilities | Client obligations are omitted, making vendor scope and pricing unreliable |
| FM-SC-03 | Scoping | Missing volume baseline | Ticket, workload, application, user, data, or transaction volumes are missing |
| FM-SC-04 | Scoping | Ambiguous service boundaries | Build, run, advisory, transition, and governance responsibilities overlap |
| FM-SC-05 | Scoping | Business-critical systems omitted | Scope excludes systems or processes that materially affect delivery risk |
| FM-RFP-01 | RFP | RFP issued with incomplete inputs | Vendor package is released before minimum viable data is complete |
| FM-RFP-02 | RFP | Vendors price different assumptions | Vendors respond to inconsistent scope, volumes, service levels, or pricing units |
| FM-RFP-03 | RFP | Requirements too generic | Requirements do not distinguish real capability differences |
| FM-RFP-04 | RFP | Security/compliance omitted | Required legal, regulatory, data, or security controls are missing |
| FM-RFP-05 | RFP | Pricing template not comparable | Commercial responses cannot be compared cleanly |
| FM-EV-01 | Evaluation | Scorecard created after preferences are known | Evaluation criteria are shaped by vendor preference instead of sourcing need |
| FM-EV-02 | Evaluation | Weights not approved | Evaluation weighting lacks governance approval before scoring |
| FM-EV-03 | Evaluation | Commercial score overpowers capability risk | Low price masks transition, technical, or operational risk |
| FM-EV-04 | Evaluation | Qualitative scoring lacks rationale | Scores cannot be defended under executive, procurement, or legal review |
| FM-EV-05 | Evaluation | Vendor exceptions not normalized | Exceptions distort comparability and hide delivery risk |
| FM-DC-01 | Decision | Decision memo lacks defensible evidence | Recommendation is persuasive but not auditable |
| FM-DC-02 | Decision | Executive approvals unclear | Decision owner, approval status, or required signoff is ambiguous |
| FM-DC-03 | Decision | Procurement/legal concerns surface too late | Late-stage objections force rework, delay, or compromised decision quality |
| FM-TR-01 | Transition | Day 1 readiness not tested | Transition plan is accepted without operational readiness evidence |
| FM-TR-02 | Transition | Knowledge transfer incomplete | Vendor cannot operate or build effectively because knowledge handoff is weak |
| FM-TR-03 | Transition | Retained org impact ignored | Client roles, governance, and retained work are not planned |
| FM-TR-04 | Transition | SLAs not operationalized | Service levels are contracted but not measurable or executable |
| FM-OUT-01 | Outcome | Projected savings not tracked | Business case is approved but not monitored |
| FM-OUT-02 | Outcome | Value owner missing | No accountable owner validates realization |
| FM-OUT-03 | Outcome | Benefits realization delayed | Sourcing decision completes, but value capture stalls |
| FM-OUT-04 | Outcome | Realized value cannot be attributed | Savings or outcomes cannot be tied back to the sourcing event |

## Detailed Failure Modes

| ID | Detection Signals | Downstream Impact | Source Capability | Nexus Behavior | Artifact/Gate | Evidence Required | Acceptance Test |
|---|---|---|---|---|---|---|---|
| FM-SC-01 | vague service descriptions, undefined outcomes, inconsistent stakeholder language | vendor proposals diverge and evaluation becomes subjective | scope readiness, stage gates, Nexus panel | ask diagnostic scope questions and block artifact confidence | scope gate, event brief | scope statement, stakeholder alignment, included/excluded services | UI shows scope as incomplete and names missing boundaries |
| FM-SC-02 | retained roles absent, governance model blank, client tasks hidden | vendor underprices or transition fails | scope workspace, Steward gate enforcement | surface retained responsibility gap and owner | scope document, retained org gate | retained role matrix, governance model | RFP readiness cannot pass without retained responsibility evidence |
| FM-SC-03 | no ticket/workload/application/user baseline | pricing not comparable and value case unreliable | pattern-pack required inputs, value ledger | mark value and pricing confidence low | data request, value gate | baseline extracts, source system, owner | Nexus says value cannot be trusted yet |
| FM-SC-04 | overlapping build/run/transition language | change orders, disputes, missed work | journey tracker, scope readiness | identify boundary conflict and recommend service map | scope gate | service boundary map | Stage guidance flags ambiguous boundaries |
| FM-SC-05 | critical apps missing, business owner exceptions | delivery disruption or hidden cost | Sentinel validation, scope workspace | ask Sentinel to challenge completeness | scope review gate | app inventory, criticality, owner signoff | Omitted critical system creates blocker |
| FM-RFP-01 | missing required inputs, no approval, no artifact readiness | weak vendor responses and rework | artifact drawer, Steward gate | block RFP release recommendation | RFP release gate | minimum data request, approvals | RFP artifact cannot show ready state |
| FM-RFP-02 | different assumptions in Q&A, pricing exclusions, inconsistent volume units | no apples-to-apples comparison | vendor flow later, pricing template | warn that comparison is invalid until normalized | pricing template gate | common assumptions, pricing units, Q&A log | Nexus flags non-comparable responses |
| FM-RFP-03 | generic requirements, no outcome metrics, no scenario tests | vendors sound identical | pattern-pack templates, scorecard governance | recommend specific scenario questions | RFP package | domain requirements, use cases | RFP template includes differentiating criteria |
| FM-RFP-04 | security/compliance inputs empty, legal not assigned | delayed release or unacceptable risk | artifact drawer, Sentinel validation | require compliance evidence before release | compliance gate | security requirements, data classification | Legal persona crawler returns ACCEPT only with evidence |
| FM-RFP-05 | no standard unit, pricing tabs inconsistent | commercial score unreliable | scorecard governance, pricing template | mark commercial comparison at risk | pricing artifact | standard pricing template | Procurement crawler sees comparability status |
| FM-EV-01 | scorecard created after vendor demos or response review | biased evaluation | scorecard governance, Steward lock | warn scorecard is late and requires rationale | scorecard lock gate | timestamp, approval record | Evaluation blocked until scorecard is approved |
| FM-EV-02 | weights edited without approval | audit weakness and stakeholder dispute | scorecard governance | request approval and rationale | weight approval gate | change log, approver | Material weight changes require rationale |
| FM-EV-03 | commercial weight too high for risk profile | low-cost vendor wins despite delivery risk | scorecard rationale, Nexus guidance | explain tradeoff and suggest weight review | scorecard review | risk profile, transition complexity | Nexus highlights capability risk before scoring |
| FM-EV-04 | no score rationale, comments empty, evaluator inconsistency | decision memo cannot defend recommendation | scorecard governance, Sentinel validation | request rationale before synthesis | scoring gate | evaluator notes, evidence citations | Scores without rationale are incomplete |
| FM-EV-05 | exceptions not tracked, assumptions vary by vendor | hidden contractual or delivery risk | vendor flow later, artifact drawer | flag exception normalization requirement | evaluation readiness gate | exception log, normalized response | Evaluation readiness fails if exceptions unresolved |
| FM-DC-01 | recommendation lacks citations, risks, alternatives | sponsor cannot defend decision | Atlas memo, Sentinel validation | call Atlas and Sentinel before final summary | decision memo gate | evidence set, risk register, alternatives | Executive summary labels evidence confidence |
| FM-DC-02 | approver unknown, approval state missing | decision stalls or bypasses governance | Steward gate enforcement | identify decision owner and approval gap | approval gate | RACI, approval record | Dashboard names decision owner |
| FM-DC-03 | legal/procurement review absent until end | rework and delay | journey tracker, lifecycle alerts | surface late-review risk early | release readiness gate | review owners, signoff checklist | Alert appears before release deadline |
| FM-TR-01 | no readiness checklist, transition milestones absent | service disruption at go-live | transition gate later, Steward | block transition-ready claim | Day 1 readiness gate | readiness checklist, test results | Nexus cannot call transition ready without evidence |
| FM-TR-02 | knowledge owners unknown, handoff tasks missing | vendor ramp delays | journey tracker, artifact drawer | identify KT gaps and owners | knowledge transfer artifact | KT plan, owner signoff | Transition stage shows KT blocker |
| FM-TR-03 | retained org not funded or assigned | operating model breaks after contract | value ledger, scope readiness | connect retained org gap to value risk | operating model gate | retained org model, budget owner | Value confidence drops when retained org missing |
| FM-TR-04 | SLAs lack measurement method or data source | contract cannot be managed | scorecard, artifact drawer | ask for SLA operationalization evidence | SLA gate | measurement method, baseline | SLA criterion requires evidence source |
| FM-OUT-01 | no milestone or tracking method | business case fades after award | Value Ledger | mark projected value as untracked | value tracking gate | value line item, method, baseline | Value ledger shows owner and milestone |
| FM-OUT-02 | owner field empty, accountability unclear | benefits realization orphaned | Value Ledger, lifecycle alerts | request value owner assignment | value ownership gate | named owner, approval | CFO crawler rejects missing owner |
| FM-OUT-03 | value milestone late, transition delayed | value capture slips | lifecycle alerts, Value Ledger | surface delay impact and escalation | value milestone | milestone dates, delay reason | Alert shows delayed value realization |
| FM-OUT-04 | realized value not linked to event | ROI cannot be defended | Value Ledger, Sentinel | prevent attribution claim without evidence | realization gate | measurement result, baseline, attribution logic | Realized value cannot render as confirmed without evidence |

## Capability Mapping

| Source Capability | Failure Modes Mitigated |
|---|---|
| Journey tracker | FM-SC-04, FM-DC-03, FM-TR-02, FM-OUT-03 |
| Stage gates | FM-SC-01, FM-SC-02, FM-RFP-01, FM-EV-01, FM-TR-01 |
| Scope readiness | FM-SC-01, FM-SC-02, FM-SC-03, FM-SC-04, FM-SC-05 |
| Scorecard governance | FM-EV-01, FM-EV-02, FM-EV-03, FM-EV-04, FM-TR-04 |
| Artifact drawer | FM-RFP-01, FM-RFP-04, FM-DC-01, FM-TR-02 |
| Nexus panel | All failure modes through guidance, missing input explanation, and next action |
| Sentinel validation | FM-SC-05, FM-RFP-04, FM-DC-01, FM-OUT-04 |
| Atlas decision memo | FM-DC-01, FM-DC-02 |
| Steward gate enforcement | FM-SC-02, FM-RFP-01, FM-EV-01, FM-EV-02, FM-TR-01 |
| Value Ledger | FM-SC-03, FM-TR-03, FM-OUT-01, FM-OUT-02, FM-OUT-03, FM-OUT-04 |
| Lifecycle alerts | FM-DC-03, FM-TR-02, FM-OUT-03 |

## Acceptance Standard

The failure mode catalog is acceptable only when:

- every major sourcing surface maps to at least one failure mode
- every high-value claim is tied to a failure mode or evidence requirement
- Nexus guidance explains which failure mode is being mitigated when relevant
- Steward gates block actions that would create avoidable failure
- persona crawlers can detect failure-mode coverage
