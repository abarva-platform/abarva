# 17 CRAWLER PERSONA VERIFICATION

## Purpose

Crawler persona verification checks whether AbarVa Source works for real enterprise decision makers. Component rendering is necessary but insufficient. Each Source surface must help a persona answer high-stakes sourcing questions, see evidence, understand risk, and decide whether to proceed.

Verification must produce a verdict:

- ACCEPT: the persona can complete the scenario with sufficient evidence and clarity
- DEFER: the surface works partially, but required evidence, action, or clarity is missing
- REJECT: the persona cannot complete the scenario or the product creates a governance/commercial risk

## Standard Verdict Format

```md
Persona:
Route:
Scenario:
Verdict: ACCEPT | DEFER | REJECT
Rationale:
Evidence observed:
Nexus response observed:
Failures:
Required fix before release:
```

## Shared Pass/Fail Rubric

| Dimension | Pass | Fail |
|---|---|---|
| Location clarity | Persona can tell where they are in the workflow | Persona must infer stage or status |
| Value clarity | Value at stake and confidence are visible where relevant | Value is missing, vague, or overclaimed |
| Risk clarity | Material risks and blockers are visible | Risks are hidden or generic |
| Next action | Owner, action, due date, or gate are clear | Persona cannot tell what should happen next |
| Evidence | Claims are supported or labeled as unverified | Claims appear authoritative without support |
| Agent behavior | Nexus answers with role-appropriate guidance | Nexus behaves like a generic chatbot |
| Governance | Gates, scorecard state, and audit posture are clear | Product allows or implies premature action |
| Persona fit | Surface answers the persona's real job-to-be-done | Surface only shows UI elements |
| Context grounding | Nexus uses event, stage, pattern, evidence, and relevant Source objects | Nexus gives generic advice that could apply anywhere |
| Suggested continuation | Nexus offers useful next actions | Nexus ends without workflow continuation |

## Crawler Personas

### 1. CIO Evaluating An Active Sourcing Portfolio

| Field | Definition |
|---|---|
| Persona goal | Understand which sourcing events need executive attention and why |
| Starting route | `/source` |
| Scenario | CIO reviews active sourcing portfolio before weekly operating review |
| Questions | Which events are active? Which are stuck? Where is value at stake? Which decisions need me? What is the most urgent risk? |
| Expected UI evidence | Active events, lifecycle status, owner, aging, blocker, value at stake, next action |
| Expected Nexus response | Portfolio-level summary with at-risk events, blockers, owner, and next executive decision |
| Context grounding prompt | What needs my attention? |
| Accept criteria | CIO can identify top 1-3 attention items without drilling into every event |
| Defer criteria | Data is present but priority or decision owner is unclear |
| Reject criteria | Dashboard looks like a static event list with no sourcing intelligence |
| Failure signals | No aging, no value, no owner, no Nexus attention, no blockers |

### 2. CFO Evaluating Value At Stake And Sourcing Business Case

| Field | Definition |
|---|---|
| Persona goal | Validate value at stake, assumptions, confidence, and delay impact |
| Starting route | `/source` then event detail later |
| Scenario | CFO reviews Data & AI Modernization SI Selection |
| Questions | What is the value at stake? What assumptions support the value? Who owns measurement? What is the confidence level? What happens if vendor selection is delayed? |
| Expected UI evidence | Projected value, assumptions, confidence, value owner, timing, risk or delay alert |
| Expected Nexus response | Clear value explanation with evidence limits and measurement owner |
| Context grounding prompt | What is the value at stake and can we trust it? |
| Accept criteria | CFO can distinguish booked, projected, and unsupported value |
| Defer criteria | Value is visible but evidence or ownership is incomplete |
| Reject criteria | Product implies savings are certain without evidence |
| Failure signals | Fake precision, no assumptions, no owner, no confidence label |

### 3. Procurement Leader Checking Process Defensibility

| Field | Definition |
|---|---|
| Persona goal | Confirm that sourcing process is fair, complete, and auditable |
| Starting route | `/source/events/[eventId]` later |
| Scenario | Procurement leader checks whether RFP can be released |
| Questions | Are requirements complete? Is the scorecard locked? Are vendor assumptions comparable? Are exceptions normalized? Is the audit trail sufficient? |
| Expected UI evidence | Stage gate, required inputs, scorecard state, artifact readiness, audit status |
| Expected Nexus response | Governance-focused release readiness summary with blockers |
| Context grounding prompt | Is this process defensible? |
| Accept criteria | Procurement can approve or block release with clear rationale |
| Defer criteria | Readiness exists but gate evidence is incomplete |
| Reject criteria | Product allows RFP release without required inputs or scorecard governance |
| Failure signals | No lock state, no approval owner, no artifact readiness, no gate logic |

### 4. CTO Evaluating Technical/Vendor Fit

| Field | Definition |
|---|---|
| Persona goal | Understand whether the sourcing criteria test technical fit and delivery risk |
| Starting route | `/source/events/[eventId]/scorecard` later |
| Scenario | CTO reviews scorecard defaults before vendor evaluation begins |
| Questions | Do criteria reflect architecture risk? Are security and data controls weighted enough? Are vendor delivery claims evidence-backed? |
| Expected UI evidence | Technical criteria, weights, rationale, evidence expectations, material changes |
| Expected Nexus response | Technical tradeoff guidance and criteria adjustment implications |
| Accept criteria | CTO can see how technical risk influences evaluation |
| Defer criteria | Criteria are visible but rationale or evidence is weak |
| Reject criteria | Technical fit is reduced to generic capability language |
| Failure signals | No weight rationale, no evidence source, no architecture/security treatment |

### 5. PMO Lead Checking Next Actions And Blockers

| Field | Definition |
|---|---|
| Persona goal | Drive the sourcing event forward by owner, due date, and blocker |
| Starting route | `/source` |
| Scenario | PMO lead runs daily review of waiting or stuck events |
| Questions | What is blocked? Who owns it? How old is it? What is the next action? What changes when it is resolved? |
| Expected UI evidence | Lifecycle status, aging, owner, action, due date, blocker reason |
| Expected Nexus response | Action-oriented queue with owners and escalation threshold |
| Accept criteria | PMO can create a follow-up list without interpreting raw data |
| Defer criteria | Blockers are visible but impact or owner is unclear |
| Reject criteria | Product shows status without actionability |
| Failure signals | Missing due dates, no owner, no aging, no unblock action |

### 6. Legal/Compliance Reviewer Checking Evidence, Audit Trail, And Release Readiness

| Field | Definition |
|---|---|
| Persona goal | Confirm that release, evaluation, and decision artifacts are defensible |
| Starting route | artifact drawer later |
| Scenario | Legal reviews RFP package and vendor exception handling |
| Questions | What evidence supports release? Are compliance requirements included? Are changes logged? What cannot be trusted yet? |
| Expected UI evidence | Artifact status, evidence list, compliance inputs, gate status, audit trail |
| Expected Nexus response | Compliance-aware readiness summary with unsupported claims suppressed |
| Accept criteria | Legal can identify release blockers and approve/defer with rationale |
| Defer criteria | Evidence exists but audit trail is incomplete |
| Reject criteria | Product creates release confidence without compliance evidence |
| Failure signals | No citations, no audit events, no compliance gate, no unsupported-claim labeling |

### 7. Business Sponsor Checking Decision Clarity

| Field | Definition |
|---|---|
| Persona goal | Understand what decision is needed and why it matters to the business |
| Starting route | executive decision view later |
| Scenario | Sponsor reviews recommendation before vendor selection decision |
| Questions | What decision do you need from me? What are the options? What is the value/risk tradeoff? What happens if I defer? |
| Expected UI evidence | Decision request, recommendation, alternatives, value, risk, evidence confidence |
| Expected Nexus response | Executive summary with approve/defer/reject framing |
| Accept criteria | Sponsor can make or defer a decision with explicit rationale |
| Defer criteria | Decision is visible but evidence is incomplete |
| Reject criteria | Product shows details without an executive decision frame |
| Failure signals | No recommendation, no tradeoff, no consequence of delay |

### 8. Sourcing Lead Managing Vendor Response Period

| Field | Definition |
|---|---|
| Persona goal | Keep vendor response process consistent, comparable, and on schedule |
| Starting route | `/source/events/[eventId]` later |
| Scenario | Sourcing lead checks vendor response status and exception normalization |
| Questions | Which vendors are late? Are assumptions comparable? Are exceptions normalized? Is the evaluation ready to begin? |
| Expected UI evidence | Vendor response status later, exception flags, scorecard lock, readiness gate |
| Expected Nexus response | Process-control guidance with late-response impact and next action |
| Accept criteria | Sourcing lead can manage response period without process drift |
| Defer criteria | Status visible but normalization rules are incomplete |
| Reject criteria | Product encourages ad hoc vendor comparison |
| Failure signals | No comparable pricing status, no exception normalization, no scorecard lock |

## Crawler Scripts To Author

These are verification scripts to build later. They are not UI implementation tasks.

### Source Dashboard Crawler

- Start at `/source`
- Verify active events render
- Verify value at stake appears
- Verify status, owner, aging, blocker, and next action appear
- Ask Nexus-style questions for CIO, CFO, and PMO personas
- Validate that responses mention event names, lifecycle status, owners, value at stake, and next actions
- Reject generic "review your dashboard" answers
- Record ACCEPT/DEFER/REJECT verdicts

### Nexus Engagement Canvas Crawler

- Start at `/source/events/[eventId]`
- Verify event header, journey tracker, active stage, Nexus guidance, and artifact access
- Ask where we are, what is missing, what is at risk, and what decision is needed
- Validate deterministic stage state against UI
- Validate that Nexus uses Context Bundle data rather than raw prompt alone

### Scope Workspace Crawler

- Start at scope stage for a known event
- Verify required inputs, owner, completion state, and stage gate
- Ask what blocks RFP release
- Confirm missing-data behavior is explicit
- Golden prompt: "Can we move to RFP?"
- Reject answers that do not check gates, missing inputs, and readiness

### Scorecard Governance Crawler

- Start at `/source/events/[eventId]/scorecard`
- Verify criteria, weights, rationale, material-change handling, approval, and lock state
- Ask CTO and procurement questions
- Confirm evaluation cannot begin before lock
- Golden prompt: "Can I change commercial weight to 25%?"
- Reject answers that do not mention pattern default, material-change rationale, approval, and lock impact

### Artifact Drawer Crawler

- Start from event canvas artifact drawer later
- Verify artifact metadata, tier, status, inputs, evidence, and release readiness
- Ask legal/compliance questions
- Confirm no fake artifact content is presented as final
- Golden prompt: "Generate the RFP."
- Reject generated language that invents missing scope, pricing, vendor, or client facts

### Value Ledger Crawler

- Start at `/source/value` or event-level value ledger later
- Verify projected value, assumptions, owner, confidence, timing, and measurement method
- Ask CFO questions
- Confirm realized value is not claimed before measurement
- Golden prompt: "What is the value at stake and can we trust it?"
- Reject answers that omit assumptions, confidence, owner, or realized/projected distinction

### Attachment Grounding Crawler

- Start from a future file upload state on an event
- Upload or simulate a vendor response, pricing template, or architecture deck
- Ask: "Summarize this vendor response."
- Verify Nexus names the uploaded file, parse status, extracted fields, confidence, missing sections, and citations if available
- Reject file-specific answers that do not reference the parsed summary or evidence

### Context-Aware Response Quality Crawler

- Run golden prompts from [24_CONTEXT_VALIDATION_HARNESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/24_CONTEXT_VALIDATION_HARNESS.md)
- Score context grounding, actionability, and evidence
- Fail if context grounding is below 4 for event-specific answers
- Fail if suggested actions are missing where workflow continuation is expected

### Executive Decision View Crawler Later

- Start at future executive decision route or panel
- Verify decision request, recommendation, alternatives, value, risk, evidence, and approval owner
- Ask sponsor questions
- Confirm output supports approve/defer/reject

## Acceptance Standard

Crawler verification is acceptable only when:

- each persona has at least one defined route and scenario
- each high-risk surface has persona-specific questions
- each verdict captures UI evidence and Nexus behavior
- DEFER and REJECT outcomes produce actionable fixes
- acceptance tests cover product usefulness, not just visual rendering
- crawler checks detect vanilla agent responses
- context grounding, actionability, and evidence scores are captured for agent responses
