# Source Vendor Value Excellence Program

## Status

`planned`

## Purpose

Create the repo-tracked design and execution contract for making Source a best-in-class vendor value operating system, not a collection of tabs or workflows.

This program ties together:

- Source New Event 11-stage sourcing journey.
- Optimize Contract as a separate first-class module.
- Vendor 360 and Contract 360.
- Contract and source evidence data model.
- aVa sourcing and contract intelligence.
- Artifact quality, guidebooks, templates, and human governance.
- Market differentiation against ERP, procurement, CLM, and sourcing platforms.

The intent is to do the holistic design once, get review/signoff, then execute in small PRs with proof after each slice.

## Product Thesis

Source must help a CXO answer:

1. Which vendor or contract needs attention first?
2. What evidence proves the opportunity or risk?
3. What is missing, and exactly where should the client get it?
4. What should the sourcing/procurement team do next?
5. What did AI add that a normal workflow, spreadsheet, or ERP screen would not have added?
6. What value is only modeled, what value is negotiated, and what value is finance-confirmed?

The product is not the workflow. The product is the conversion of fragmented enterprise evidence into defensible vendor leverage and realized value.

## Critical Workflow Distinction

Optimize Contract must not inherit the 11-stage New Event journey.

The 11-stage journey is for a net-new sourcing/RFP event where the team must move through strategy, scope, RFP creation, vendor responses, evaluation, pricing, BAFO, executive decision, selection, transition, and value.

Optimize Contract is a focused incumbent-contract value motion. It should be shorter, evidence-first, and contract-specific:

1. Select or confirm the contract.
2. Establish commercial and evidence baseline.
3. Diagnose leakage, avoided cost, and negotiation levers.
4. Build the commercial strategy and approval packet.
5. Run negotiation/outreach with human approval.
6. Record agreement changes and obligations.
7. Prove value through finance/Tower handoff.

If the optimization motion reveals that the right answer is a full market event, then it should escalate into New Event. It should not force every incumbent optimization through an 11-stage RFP path by default.

## Design Principles

### 1. Intelligence At Every Step

Every page and stage must answer:

- What changed because of the evidence we loaded?
- What insight is now visible?
- What is the recommended next action?
- What value or risk is still not provable?

Generic summaries, decorative charts, and unsupported recommendation copy do not pass.

### 2. Efficient Workflows

Users should never have to infer how to proceed.

Each task must show:

- required evidence rows,
- optional evidence rows,
- source system,
- owner role,
- template or upload action,
- parse/readback status,
- blocker status,
- next unlock condition.

The UI should optimize for a one-screen operating canvas whenever possible.

### 3. Evidence-Bound Value

No page may turn a gap, variance, modeled opportunity, or vendor promise into realized value.

Value states are separate:

- `identified_opportunity`
- `recoverable_leakage`
- `avoided_cost`
- `negotiated_improvement`
- `committed_value`
- `finance_confirmed_realized_value`

Missing evidence must render as `evidence_missing`, `workflow_required`, or `not_established`; never as zero and never as a hidden assumption.

### 4. Cross-System Advantage

Source must be useful before, during, and after a client standardizes on ERP/procurement/CLM platforms.

It must support evidence from:

- Finance/ERP/AP,
- procurement/S2P,
- CLM/contract repository,
- ITSM/service management,
- SaaS entitlement and usage,
- cloud consumption,
- vendor response packages,
- security/risk systems,
- meeting notes and interviews.

ERP-native workflows may own a subset of records. Source must explain the broader cross-system contract story.

### 5. Human Governance

AI can draft, inspect, compare, score, and recommend. It cannot silently approve.

Human gates must preserve:

- approver identity,
- evidence accepted,
- artifacts accepted,
- exceptions granted,
- rationale,
- stage unlock,
- downstream obligations.

### 6. Market Differentiation

The market comparison is not "AbarVa versus procurement workflow." It is "AbarVa as the cross-system vendor value intelligence layer."

The product must make clear where it complements or exceeds:

- ERP finance/procurement platforms,
- sourcing suites,
- CLM/contract intelligence tools,
- ITSM and operational telemetry systems,
- generic AI assistants.

## Program Backlog

### SVV01 — Holistic Source Vendor Value Design

**Priority:** P0  
**Status:** pending  
**Type:** design / architecture / product contract  
**Primary surfaces:** New Event, Optimize Contract, Vendor 360, Contract 360, aVa  
**Dependencies:** `SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md`, current signed-in Source routes, Source read models

#### Purpose

Create the full design contract before deeper implementation so the team does not keep reacting page by page.

#### Scope

- Define the combined IA for Source:
  - Portfolio/Home,
  - Vendor 360,
  - Contract 360,
  - Optimize Contract,
  - New Event 11-stage journey,
  - Files,
  - Intelligence,
  - Guidebook,
  - Approvals.
- Define the narrative each surface must tell.
- Define the one-screen operating canvas standards.
- Define what belongs in tabs, rails, subtabs, drawers, and detail tables.
- Define when to use charts, tables, relationship graphs, and text.
- Define which details are hidden until drilldown.
- Define GPT/design-review signoff checklist before implementation.

#### Acceptance Criteria

- One integrated design doc exists.
- Every surface has a business question, source data, decision output, and failure state.
- GPT review/signoff is required before implementation begins.
- Engineering slices can be implemented incrementally without re-litigating the IA.

#### Validation

- Review against current live Source pages.
- Attach screenshots of current pain points.
- Produce a before/after wireframe for major surfaces.
- No runtime claim; design-only PR.

---

### SVV02 — Source Data And Evidence Contract

**Priority:** P0  
**Status:** pending  
**Type:** data model / ingestion / governance  
**Primary surfaces:** Files, Vendor 360, Contract 360, Optimize Contract, aVa  
**Dependencies:** current canonical Source model, context/corpus policy, file upload path

#### Purpose

Define the contract for what data Source needs, at what grain, from which real systems, and how it flows into governed facts.

#### Scope

- Source system map:
  - Finance/ERP/AP,
  - procurement/S2P,
  - CLM,
  - ITSM,
  - SaaS admin,
  - cloud consumption,
  - security/risk,
  - vendor response packages,
  - meeting notes/interviews.
- Critical contract-optimization evidence by grain:
  - contract document section/page/span,
  - clause/right/obligation,
  - invoice line,
  - PO line,
  - payment,
  - rate card line,
  - service credit month,
  - SLA/incident month,
  - usage/entitlement month,
  - benchmark point,
  - vendor offer item,
  - approved agreement commitment,
  - finance confirmation period.
- Required history/frequency:
  - baseline lookback,
  - update frequency,
  - freshness SLA,
  - expected owner.
- Parser/readback states:
  - uploaded,
  - parsed,
  - failed,
  - governed,
  - indexed,
  - cited,
  - accepted,
  - stale.
- Conflict-resolution and source-of-truth rules.

#### Acceptance Criteria

- Every field needed for contract optimization has a business reason.
- Every field has source-system guidance and owner role.
- Every field declares grain, history, update frequency, and downstream usage.
- Physical contract PDFs are included in the flow: original in object storage, extracted facts in Postgres, citations available to UI and aVa.

#### Validation

- Data contract review against current golden evidence packages.
- Identify gaps between loaded data and required UI/story.
- No synthetic value claim can pass unless derived from detail rows or explicitly marked as planning-grade.

---

### SVV03 — Vendor 360 / Contract 360 Executive Story Redesign

**Priority:** P0  
**Status:** pending  
**Type:** product / UI / analytics  
**Primary surfaces:** Vendor 360, Contract 360  
**Dependencies:** SVV01, SVV02

#### Purpose

Make Vendor 360 and Contract 360 executive-useful in the first minute, then explorable for sourcing experts.

#### Scope

- Contract overview from contract documents.
- Scope summary with line items, services, apps, functions, and exclusions.
- Relationship graph: contract journey from documents to scope, systems, evidence, opportunity, action, and value proof.
- Performance view with explanatory signals, trends, and source lineage.
- Evidence view showing source files, extracted fields, review state, conflicts, and business use.
- Optimization view showing defensible ranking reasons and next action.
- Clear explanation of value states without confusing "ledger" language.

#### Acceptance Criteria

- A CXO can tell a fact-based story for the selected contract.
- Ranking reasons are evidence-based and not generic.
- Charts and graphs help explain a decision; they are not decorative.
- Missing scope/performance/evidence is explicit and actionable.
- Source facts are visible in context, not isolated on the side of the diagram.

#### Validation

- Signed-in browser QA for two selected contracts.
- Data readback to prove displayed values come from governed rows.
- Visual QA for clutter, density, and one-screen usability.
- aVa contract-context hard-question test.

---

### SVV04 — Optimize Contract First-Class Module

**Priority:** P0  
**Status:** pending  
**Type:** product / workflow / analytics  
**Primary surface:** Optimize Contract  
**Dependencies:** SVV01, SVV02, SVV03

#### Purpose

Create Optimize Contract as its own module, separate from the 11-stage New Event journey.

#### Scope

- Landing and prioritization.
- Forced contract selection when launched without a contract.
- Auto-prefill when launched from Vendor 360 or Contract 360.
- Evidence readiness and commercial baseline.
- Opportunity diagnosis.
- Commercial strategy.
- Approval and outreach.
- Negotiation/execution.
- Value proof and Tower handoff.
- aVa contract coach with table/chart output.

#### Acceptance Criteria

- It does not reuse the New Event sourcing intake when the user is optimizing an existing contract.
- Selected contract context persists through the workflow.
- Missing evidence asks are generated as workflow tasks.
- Uploads parse back into governed evidence and update the contract story.
- Human approval gates precede external/supplier-facing action.

#### Validation

- End-to-end browser test for two evidence-rich contracts.
- Data readback after uploads.
- Artifact quality audit.
- aVa hard-question run.
- ACA deploy proof only after runtime changes.

---

### SVV05 — New Event 11-Stage Excellence Execution

**Priority:** P0  
**Status:** pending  
**Type:** product / workflow / QA  
**Primary surface:** New Event 11-stage journey  
**Dependencies:** `SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md`, SVV01, SVV02

#### Purpose

Execute the already-tracked New Event best-in-class program with holistic QA and artifact scoring.

#### Scope

- Run a fresh New Event from Strategy through Value.
- Test evidence upload, parser readback, guidebook quality, Files progress, Intelligence quality, approval gates, and artifact generation.
- Score every generated artifact against expected client-ready quality.
- Track what the tool learns from evidence, meetings, and human updates.
- Confirm prompts include accepted evidence and exclude unaccepted or failed evidence.

#### Acceptance Criteria

- Each stage has a useful guidebook, evidence plan, intelligence output, and approval condition.
- Every generated artifact has a quality score and evidence trace.
- Workflow completion is not confused with evidence/artifact readiness.
- The test report is detailed enough for GPT review before further implementation.

#### Validation

- Full signed-in browser crawl.
- Screenshots and DOM evidence.
- Upload-to-parse-to-read-model proof.
- Artifact quality report.
- Backlog updates for defects found.

---

### SVV06 — aVa Source And Contract Intelligence Bar

**Priority:** P0  
**Status:** pending  
**Type:** AI / prompt / answer quality  
**Primary surfaces:** Source aVa, Contract 360 aVa, Optimize Contract aVa  
**Dependencies:** SVV02, SVV03, SVV04, SVV05

#### Purpose

Make aVa the high-value intelligence layer for Source rather than a chat widget.

#### Scope

- 25+ tough questions for New Event.
- 25+ tough questions for Optimize Contract.
- Contract-context questions with source citations.
- Tables/charts/visual output where useful.
- Outside-in industry insight clearly separated from governed internal facts.
- Prompt contract that passes restrictions/rules in context, not by scrubbing model output afterward.
- Failure mode tests for unsupported savings, missing evidence, tenant leakage, and stale context.

#### Acceptance Criteria

- aVa answers are concise, specific, and action-oriented.
- Charts/tables render cleanly and are sourced.
- Unsupported values are refused or caveated.
- The answer can explain what evidence supports it and what evidence is missing.

#### Validation

- Prompt/eval artifact.
- Browser transcript export.
- PDF or markdown evidence bundle when requested.
- Data citation/readback proof.

---

### SVV07 — Market And Differentiation Narrative

**Priority:** P1  
**Status:** pending  
**Type:** strategy / product narrative  
**Primary surfaces:** sales narrative, demo guide, Source guidebook  
**Dependencies:** SVV01-SVV06

#### Purpose

Define why Source is different from ERP, procurement suites, CLM tools, and generic AI assistants.

#### Scope

- Pre-ERP, during-ERP, post-ERP positioning.
- Workday/ERP finance-only versus full procurement/supply-chain distinction.
- Where AbarVa complements Workday, Coupa, SAP, ServiceNow, CLM, and AP systems.
- "Why not build this workflow ourselves?" answer.
- Market impact thesis:
  - value leakage,
  - avoided cost,
  - negotiated improvement,
  - realized value,
  - governance and evidence confidence.

#### Acceptance Criteria

- The story is honest and not anti-platform.
- It explains why cross-system evidence matters.
- It explains where ERP initiatives are foundational and where AbarVa creates value before ERP standardization.
- It maps product features to executive outcomes.

#### Validation

- Review against current product capability and known gaps.
- GPT signoff before use in external-facing sales/demo material.

## GPT Signoff Gates

No major build slice should start until the relevant design packet has been reviewed externally or by the designated reviewer.

Each signoff packet must include:

- current-state screenshots,
- proposed IA/wireframe,
- data source and grain,
- business rules,
- examples of generated intelligence or artifacts,
- unsupported/missing evidence behavior,
- test plan,
- rollback/scope boundaries.

Signoff states:

- `drafted`
- `reviewed`
- `approved_to_build`
- `implemented`
- `locally_validated`
- `merged`
- `deployed`
- `live_proven`

Do not skip from `drafted` to `implemented`.

## Incremental Execution Rules

1. Use one PR per independently reversible improvement where practical.
2. Do not mix design contract, data-plane mutation, runtime UI, and deployment proof in the same PR unless necessary.
3. Every runtime PR needs focused tests, release record, PR checks, merge, ACA workflow deploy, runtime invariant, and signed-in browser proof.
4. Every data-plane change needs manifest/gate, load job proof, reconciliation, readback, and no-product-use until review passes.
5. Every artifact-generation change needs artifact quality audit.
6. Every aVa change needs hard-question eval and citation/readback proof.
7. Every UI change needs visual QA for clutter, density, text overflow, forward path, and empty/failure states.

## Execution Order

### Phase 0 — Holistic Design And Signoff

- SVV01
- SVV02
- GPT/design review
- freeze incremental slice map

### Phase 1 — Contract Story And Evidence Foundation

- SVV03
- two evidence-rich contracts
- contract PDF extraction/readback
- evidence-source graph

### Phase 2 — Optimize Contract Module

- SVV04
- selected-contract prefill
- evidence readiness
- opportunity diagnosis
- approval and value-proof skeleton

### Phase 3 — New Event Deep QA And Artifact Quality

- SVV05
- full 11-stage test
- artifact scoring
- guidebook/workshop improvements

### Phase 4 — aVa Excellence

- SVV06
- source/contract hard-question eval
- chart/table output proof

### Phase 5 — Market Narrative

- SVV07
- sales/demo guide update
- Source guide for non-technical users

## Definition Of Done

The program is not done when docs exist. It is done when:

- the design is reviewed and signed off,
- the data contract has grain/frequency/source-system clarity,
- the UI tells a clean CXO story,
- uploads parse and persist into governed facts,
- aVa can answer hard questions with citations,
- artifacts are client-ready,
- human approval gates are auditable,
- realized value is finance-confirmed,
- a second tenant can use the same process without product-code forks.
