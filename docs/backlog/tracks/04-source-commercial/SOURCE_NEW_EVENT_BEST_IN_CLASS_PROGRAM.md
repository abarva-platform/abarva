# Source New Event Best-In-Class Sourcing Program

## Status

`planned`

## Purpose

Turn Source New Event from a clearer 11-stage workflow into a best-in-class sourcing operating system: simple enough for a client executive team to use, rigorous enough to defend every decision, and sharp enough to create real vendor leverage.

The product must answer three questions at every stage:

- What needs to be done now?
- Where are we in the sourcing journey?
- What evidence, insight, or negotiation leverage did AbarVa create that the client would not have had alone?

## Operating Thesis

The workflow is not the product. The product is the governed conversion of messy sourcing work into defensible leverage:

1. Client evidence arrives as files, meetings, Q&A, vendor responses, pricing workbooks, approvals, and exceptions.
2. Source converts that material into vendor-isolated, cited, stage-scoped facts.
3. The workflow shows only the active job, the blockers, and the next unlock condition.
4. Intelligence explains what was produced, what evidence was used, what is missing, and what cannot be scored yet.
5. The system turns gaps into vendor clarification asks, BAFO asks, executive decision conditions, and value-proof obligations.
6. Post-award value is tracked against accepted commitments, not booked from modeled opportunity.

## Integrated Target Experience

### Global Journey

- Left rail remains the stable 11-stage journey: Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO, Executive Decision, Selection, Transition, Value.
- Each stage may have its own local workflow tabs or substeps, but the user should never see multiple competing main panels.
- The top/primary forward action is consistent: Continue, Review stage approval, Open approval gate, or Move to next stage.
- Forward action stays disabled until required conditions are met.
- Completed steps are check-marked and visually quiet; pending/current work is highlighted.
- Files, Intelligence, Approvals, and Guidebook are shared workspace surfaces, not duplicate journey trees.

### Files And Evidence

- Every stage task declares required and optional evidence.
- File rows show evidence item, required/optional, source system, owner role, accepted formats, template/download, upload, parse status, done/check status, and next action.
- Uploaded files are tracked by vendor, stage, role, version, parse/readiness state, and whether they are accepted as client-final evidence.
- File presence is not enough. The system must separately show uploaded, parsed, indexed/retrievable, cited, accepted, and stage-ready.

### Intelligence

- Intelligence must explain:
  - insights produced,
  - evidence used,
  - missing evidence,
  - contradictions,
  - claims excluded from scoring,
  - score/readiness impact,
  - next action.
- It must never present unsupported values, savings, or vendor conclusions as facts.

### Guidebook

- Guidebook is the operating system for running the stage, not static help text.
- Each stage guidebook must include:
  - meeting or workshop to run,
  - who to invite,
  - what to collect,
  - templates to use,
  - what output unlocks the next step,
  - what evidence quality is required,
  - common vendor/client failure modes.

### Approval And Governance

- Approval gates must be evidence-bound.
- Each gate records who approved, what was accepted, what exceptions were granted, what blockers remained, and what artifacts became client-final.
- Exceptions require rationale and must remain visible downstream.
- Stage advancement must not silently happen from UI completion alone.

### Vendor Leverage

- The commercial heart of Source is leverage creation:
  - inconsistent assumptions,
  - missing sections,
  - stale scope baselines,
  - pricing traps,
  - transition risk,
  - compliance adders,
  - unpriced obligations,
  - weak SLA/accountability language,
  - BAFO pressure points.
- The system should convert these into vendor-specific asks and track whether the vendor conceded, clarified, refused, or moved value into a committed obligation.

## Program Backlog

### SRC48 — Holistic New Event Operating Design

**Priority:** P0
**Status:** candidate-design
**Type:** design / architecture / workflow contract
**Primary surface:** Source New Event 11-stage journey
**Primary agent:** Nexus
**Dependencies:** Current Source event canvas, guidebooks, files, approvals, Source shell read-model
**Design artifact:** [`SOURCE_NEW_EVENT_SRC48_OPERATING_DESIGN.md`](./SOURCE_NEW_EVENT_SRC48_OPERATING_DESIGN.md)

#### Purpose

Create the holistic design contract for how all New Event blocks work together before deeper implementation begins.

#### Scope

- Map all 11 stages end to end.
- For each stage, define:
  - stage purpose,
  - stage substeps,
  - required evidence,
  - optional evidence,
  - outputs/artifacts,
  - intelligence produced,
  - approval condition,
  - next-stage unlock,
  - guidebook session,
  - downstream dependencies.
- Define how Files, Intelligence, Guidebook, and Approvals interact with the active task canvas.
- Define what must be deterministic, what can be AI-assisted, and what requires human approval.
- Define where persisted workflow state is required versus where current UI-only state is acceptable.
- Produce a visual IA/wireframe set for all 11 stages.

#### Acceptance Criteria

- A client CXO can understand the journey, current stage, current task, blockers, and next approval action without training.
- Engineering can implement each slice without re-litigating the information architecture.
- The design distinguishes uploaded, parsed, cited, accepted, and stage-ready.
- The design identifies integration points with Source facts, artifacts, approvals, guidebooks, aVa, and Atlas.

#### Validation

- Design review against current signed-in Source event route.
- Stage-by-stage smoke checklist.
- No product code change unless explicitly approved.

---

### SRC49 — Live Evidence Intake And Parser Substrate

**Priority:** P0
**Status:** pending
**Type:** product / data-plane / governance
**Primary surface:** Files and evidence intake
**Primary agent:** Steward
**Dependencies:** SRC48, governed context/corpus policy, Source upload/read-model access

#### Purpose

Convert uploaded sourcing files into governed, stage-scoped, vendor-isolated evidence facts.

#### Scope

- Support long vendor proposal documents, pricing workbooks, attachments, Q&A logs, meeting notes, templates, and approval evidence.
- Preserve tenant/event/vendor/version isolation.
- Extract section maps, citations, missing-answer ledgers, assumptions, exclusions, obligations, pricing fields, and contradiction flags.
- Separate file states: uploaded, parse attempted, parsed, failed, indexed/retrievable, cited, accepted, rejected, stale.
- Block model/scoring use for evidence that fails governance.

#### Acceptance Criteria

- A 75-100 page vendor proposal can be uploaded and parsed into cited, vendor-isolated section evidence.
- Rival-vendor file contamination is detected and blocks scoring use.
- Missing evidence is shown as a stage blocker, not hidden in logs.
- No raw, unvalidated context reaches reasoning prompts.

#### Validation

- Parser contract tests.
- Tenant/event/vendor isolation tests.
- Governed-object policy tests.
- Signed-in browser proof on Files and Responses/Pricing.
- ACA deploy and runtime invariant for any merged runtime change.

---

### SRC50 — Evidence-Bound First-Pass Scoring

**Priority:** P0
**Status:** pending
**Type:** product / scoring / governance
**Primary surface:** Evaluation and Responses
**Primary agent:** Atlas
**Dependencies:** SRC49

#### Purpose

Create first-pass scoring that improves evaluator speed and transparency without pretending to replace evaluator judgment.

#### Scope

- Score only answerable requirements with cited evidence.
- Show score, rationale, citation, confidence, holdback, and evaluator action.
- Flag missing answer, weak answer, contradicted answer, non-comparable answer, and non-scoreable answer.
- Preserve evaluator-owned final scores and overrides.
- Feed BAFO and executive decision with unresolved scoring conditions.

#### Acceptance Criteria

- Every first-pass score is traceable to evidence.
- Missing or contradicted evidence blocks/downgrades scoring.
- Evaluator override is explicit and auditable.
- Executive pack can show score confidence and unresolved conditions.

#### Validation

- Rubric/scoring unit tests.
- Evidence citation tests.
- Evaluation UI tests.
- Signed-in Evaluation proof.

---

### SRC51 — Pricing Normalization And Commercial Trap Engine

**Priority:** P0
**Status:** pending
**Type:** product / commercial intelligence
**Primary surface:** Pricing
**Primary agent:** Nexus
**Dependencies:** SRC49

#### Purpose

Turn vendor pricing submissions into comparable TCO, commercial traps, and clarification actions.

#### Scope

- Normalize pricing workbooks across scope baseline, application count, service tower, transition costs, YR1 vs steady-state, rate cards, volume bands, assumptions, exclusions, inflation, credits, compliance adders, and SLA exposure.
- Detect non-comparable proposals and explain why.
- Generate vendor-specific clarification asks.
- Separate directional opportunity from booked value.

#### Acceptance Criteria

- Pricing comparison only marks a vendor comparable when core assumptions align.
- Commercial traps produce plain-English next actions.
- Pricing facts are cited to workbook cells/sheets where possible.
- Unsupported savings claims are blocked.

#### Validation

- Workbook parser tests.
- TCO normalization tests.
- Pricing route signed-in proof.
- Artifact evidence and caveat review.

---

### SRC52 — Vendor Clarification And BAFO Squeeze Workflow

**Priority:** P0
**Status:** pending
**Type:** product / workflow / commercial leverage
**Primary surface:** Responses, Pricing, BAFO
**Primary agent:** aVa
**Dependencies:** SRC49, SRC50, SRC51

#### Purpose

Convert evidence gaps and commercial traps into managed vendor asks that increase leverage and protect value.

#### Scope

- Generate vendor-specific clarification requests.
- Generate BAFO ask packs with conservative/base/stretch asks.
- Track asks, vendor responses, concessions, refusals, unresolved items, and value impact.
- Produce negotiation scripts and executive talking points.
- Keep dispatch human-approved until messaging workflow is explicitly implemented.

#### Acceptance Criteria

- Each ask has evidence basis, commercial rationale, target outcome, owner, due date, and status.
- Concessions are tracked separately from requested value.
- The product can show how AbarVa helped preserve or improve value without fabricating booked savings.

#### Validation

- BAFO ask generation tests.
- Concession ledger tests.
- Signed-in BAFO proof.
- Human gate proof for any dispatch workflow.

---

### SRC53 — Durable Stage Gate And Evidence Acceptance

**Priority:** P0
**Status:** pending
**Type:** product / workflow persistence / governance
**Primary surface:** Approvals and stage advancement
**Primary agent:** Steward
**Dependencies:** SRC48, SRC49

#### Purpose

Persist stage readiness, evidence acceptance, approval decisions, exceptions, and advancement state.

#### Scope

- Persist gate checklist state, accepted artifacts, exception rationale, approver identity, timestamps, and downstream unlock state.
- Show delta when evidence changes after approval.
- Prevent silent advancement when required evidence or artifact review is incomplete.
- Preserve audit history.

#### Acceptance Criteria

- Stage advancement is auditable.
- Accepted evidence is explicit and immutable or versioned.
- Exceptions remain visible downstream.
- A user can explain why the event advanced at each gate.

#### Validation

- Migration review and RLS/tenant tests.
- Approval API tests.
- Signed-in approval workflow proof.
- Runtime invariant and rollback plan.

---

### SRC54 — Guidebook Operating System

**Priority:** P1
**Status:** pending
**Type:** product / workflow UX
**Primary surface:** Guidebook
**Primary agent:** Atlas
**Dependencies:** SRC48

#### Purpose

Make Guidebook the stage operating manual that tells a sourcing lead what meeting to run, who to invite, what to collect, and what output unlocks the next step.

#### Scope

- Stage-by-stage guidebooks for all 11 stages.
- Meeting/workshop agenda.
- Participants and owner roles.
- Collection checklist.
- Templates and examples.
- Outputs and unlock criteria.
- Common failure modes and how aVa should intervene.

#### Acceptance Criteria

- Every stage has a useful guidebook.
- Guidebook content matches active stage requirements.
- Guidebook can launch or reference required templates.
- Intelligence and Files can link back to the relevant guidebook step.

#### Validation

- Guidebook coverage tests.
- Signed-in stage guidebook proof.
- Content review for CXO clarity and no scaffold/internal labels.

---

### SRC55 — Client-Ready Artifact Generation

**Priority:** P1
**Status:** pending
**Type:** product / artifact generation
**Primary surface:** Artifacts and exports
**Primary agent:** aVa
**Dependencies:** SRC49, SRC50, SRC51, SRC53, SRC54

#### Purpose

Generate client-ready sourcing artifacts from accepted evidence, not from loose narrative.

#### Scope

- Scope memo.
- RFP package.
- Evaluation pack.
- Pricing normalization workbook/brief.
- BAFO brief.
- Executive decision pack.
- Selection memo.
- Transition readiness pack.
- Value realization pack.

#### Acceptance Criteria

- Artifacts cite accepted evidence.
- Missing evidence and caveats are visible.
- Executive artifacts are readable and decision-oriented.
- Generated DOCX/PDF exports pass visual QA.

#### Validation

- Artifact contract tests.
- DOCX/PDF render and visual inspection.
- Signed-in artifact proof.
- Release evidence ZIP under `/Users/anand/Downloads` when requested.

---

### SRC56 — Post-Award Value Realization Proof

**Priority:** P1
**Status:** pending
**Type:** product / value tracking
**Primary surface:** Value stage, Atlas handoff
**Primary agent:** Atlas
**Dependencies:** SRC52, SRC53, SRC55

#### Purpose

Track committed value versus realized value after award and prevent modeled opportunity from being booked as achieved savings.

#### Scope

- Capture awarded commitments, baseline, measurement period, owner, source evidence, and realization method.
- Track realized value, leakage, missed commitments, disputes, and corrective actions.
- Connect Value stage to Transition and vendor obligations.
- Show value confidence and evidence state.

#### Acceptance Criteria

- Booked value requires accepted evidence.
- Unrealized value remains open and visible.
- Vendor obligations and measurement basis are traceable.
- Executive view separates committed, realized, at-risk, and unproven value.

#### Validation

- Value model tests.
- Signed-in Value proof.
- Artifact export proof.

---

### SRC57 — End-To-End Source New Event Smoke Harness

**Priority:** P0
**Status:** foundation-merged
**Type:** QA / release proof
**Primary surface:** Full Source New Event journey
**Primary agent:** Steward
**Dependencies:** SRC48-SRC56 as slices land

#### Purpose

Create repeatable before/after smoke proof for the 11-stage journey.

#### Scope

- Signed-in browser smoke for all 11 stages.
- Verify left rail position, active task, required evidence, files state, intelligence state, guidebook, approval action, and stage-specific value output.
- Capture screenshots and DOM text proof.
- Produce a proof pack for each deployed slice.

#### Acceptance Criteria

- A release cannot be called live-proven unless the affected stage passes signed-in proof.
- Smoke output distinguishes local, CI, deploy, runtime invariant, and product proof.
- Screenshots and evidence paths are recorded.

#### Validation

- Playwright or in-app browser proof.
- ACA runtime invariant for every deploy.
- Proof pack saved under `/Users/anand/Downloads/source-e2e-qa-20260810/`.

---

### SRC58 — Simple Front Required-Row Clarity

**Priority:** P0
**Status:** implementation-in-progress
**Type:** product / UX
**Primary surface:** Source New Event simple front
**Primary agent:** Nexus
**Dependencies:** SRC48, SRC57

#### Purpose

Make the active stage evidence surface easier to scan by separating completed
required rows from the next required work.

#### Scope

- Keep the simple front as the first-screen workflow surface.
- Show ready required evidence rows with a green check marker and quiet styling.
- Replace ready-row upload/answer controls with a clear done state.
- Keep pending required rows highlighted with template, upload, and answer
  actions.
- Preserve the single approval gate action: it stays disabled until all required
  inputs are ready.

#### Acceptance Criteria

- A user can tell which required evidence is done without reading every status
  word.
- A user can tell which row still needs action.
- Ready rows do not compete visually with pending rows.
- No workflow persistence, parser, approval automation, or data-plane behavior is
  changed.

#### Validation

- Focused component test for ready versus pending required rows.
- Scoped ESLint.
- `git diff --check`.
- Release control check.

## Execution Plan

### Phase 0 — Holistic Design First

Implement `SRC48` before deeper product/data-plane changes. This phase produces the integrated design contract, stage matrix, and slice dependencies.

### Phase 1 — Evidence Foundation

Implement `SRC49` and `SRC57` together enough to prove upload-to-evidence conversion and repeatable smoke coverage.

### Phase 2 — Decision Intelligence

Implement `SRC50` and `SRC51`: scoring and pricing normalization.

### Phase 3 — Leverage Workflow

Implement `SRC52`: clarification, BAFO asks, concession tracking, and negotiation-ready output.

### Phase 4 — Governance And Artifacts

Implement `SRC53`, `SRC54`, and `SRC55`: durable gates, guidebook OS, and client-ready artifact generation.

### Phase 5 — Value Realization

Implement `SRC56`: post-award committed versus realized value.

## Multi-Agent Execution Model

Parallel agents are allowed only after `SRC48` defines stable interfaces. Suggested lanes:

- **Lane A — UX/Workflow:** journey IA, active task canvas, guidebook UX, CXO artifact readability.
- **Lane B — Evidence/Data:** upload parsing, evidence governance, citation model, indexed/retrievable proof.
- **Lane C — Scoring/Pricing:** rubric scoring, pricing normalization, commercial trap detection.
- **Lane D — Governance/Approvals:** durable gates, evidence acceptance, exceptions, audit history.
- **Lane E — QA/Deploy:** smoke harness, screenshots, release records, ACA deploy proof, runtime invariant.

One writer must own each artifact or module. Shared contracts require an explicit design review before parallel implementation.

## Test And Deploy Privileges

Execution is approved to use the normal repo workflow:

- local focused Jest,
- scoped ESLint,
- TypeScript with sufficient heap when needed,
- `npm run release:check`,
- `git diff --check`,
- PR checks,
- squash merge after green checks and user approval,
- repo-owned ACA main deploy workflow,
- independent ACA runtime invariant readback,
- signed-in browser proof on affected Source stages.

The following still require explicit human gate per slice:

- schema migrations,
- workflow persistence changes,
- live data-plane mutation,
- new upload/parser production ingestion,
- vendor communication dispatch,
- approval automation,
- Active Tenant Access or client-specific promotion,
- deletion or non-reversible cleanup.

## Current Shipped Foundation

- `SRC39` Vendor selection readiness model: done.
- `SRC40` Vendor selection readiness panel: done.
- `SRC41` Vendor selection readiness smoke coverage: done.
- `SRC42` Commercial active canvas: done and live-proven.
- `SRC43` Pricing completeness drilldown: done and live-proven.
- `SRC44` BAFO scenario compare: done and live-proven.

## Current Pending Work

- `SRC45` Transition readiness placeholder surface.
- `SRC46` Contract optimization advisory story pack.
- `SRC47` Source event archive and stale fact cleanup.
- `SRC48` Holistic New Event operating design: candidate design authored; awaiting signed-in route review before implementation slices use it as accepted.
- `SRC49` Live evidence intake and parser substrate.
- `SRC50` Evidence-bound first-pass scoring.
- `SRC51` Pricing normalization and commercial trap engine.
- `SRC52` Vendor clarification and BAFO squeeze workflow.
- `SRC53` Durable stage gate and evidence acceptance.
- `SRC54` Guidebook operating system.
- `SRC55` Client-ready artifact generation.
- `SRC56` Post-award value realization proof.
- `SRC57` End-to-end Source New Event smoke harness: foundation merged.
- `SRC58` Simple front required-row clarity.

## Non-Negotiable Boundaries

- Do not confuse deterministic demo guidance with live client truth.
- Do not use raw uploaded context in model prompts until it passes governance.
- Do not book savings without accepted evidence.
- Do not let a stage advance silently from UI-only completion.
- Do not touch PR #6140 or unrelated workflow persistence without explicit slice approval.
- Do not deploy through Vercel or ad-hoc ACA mutation; use the repo-owned ACA main deploy workflow.
