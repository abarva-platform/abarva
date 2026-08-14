# Source New Event Execution Tracker

## Status

`active-execution`

## Purpose

Track the remaining work required to make Source New Event a best-in-class
sourcing operating product, not just an 11-stage workflow. This document is the
current execution control point for Codex/Claude-style incremental slices.

It complements:

- [`SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md`](./SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md)
- [`SOURCE_NEW_EVENT_SRC48_OPERATING_DESIGN.md`](./SOURCE_NEW_EVENT_SRC48_OPERATING_DESIGN.md)
- [`SOURCE_VENDOR_VALUE_EXCELLENCE_PROGRAM.md`](./SOURCE_VENDOR_VALUE_EXCELLENCE_PROGRAM.md)

## Non-Negotiable Product Bar

Every stage must make two things obvious without training:

1. Where am I in the process?
2. What must be done before I can move forward?

That means:

- The left journey rail shows the 11-stage position and stage state.
- The active canvas shows one task, not multiple competing panels.
- Local substeps are stage-specific and mark complete, current, blocked, and
  pending.
- The primary forward action is consistent and disabled until required
  conditions are satisfied.
- Files, Intelligence, Guidebook, and Approvals support the current task. They
  do not duplicate the journey tree.
- Uploaded is never treated as ready. Required evidence must become parsed,
  cited, accepted, and stage-ready before it can unlock a gate.

## Hard Gates

These are not delegated standing approvals. They require explicit human
confirmation in the slice where they appear:

- schema migrations,
- workflow persistence changes,
- live data-plane mutation,
- production upload/parser ingestion,
- vendor message dispatch,
- approval automation,
- Active Tenant Access or client-specific promotion,
- deletion or irreversible cleanup,
- security weakening.

Normal docs, test, UI-only, PR merge, and ACA deploy follow the standing
incremental execution path when validation passes.

## What Is Pending By Phase

### Phase 1 - Stage UX Operating Model

**Status:** partially designed, implementation pending.

**Goal:** Make every stage feel like the clean Scope concept: left journey rail,
stage-specific local substeps, one active canvas, and one forward action.

**Pending work:**

- Build the stage-local substep contract for all 11 stages.
- Normalize substep labels into plain business language.
- Make completed substeps checked and quiet.
- Highlight the next required incomplete substep.
- Keep local substeps out of the global journey rail unless a stage needs an
  overflow local list inside the active canvas.
- Expand the stage smoke harness beyond Responses so visual regressions are
  caught before deploy.

**Demo impact:** very high. This directly fixes the "what do I do now?" and
"where am I?" problem.

### Phase 2 - Evidence And File Readiness

**Status:** designed, implementation pending.

**Goal:** Replace ambiguous "files available/not loaded" UX with explicit
evidence requirements, file counts, parse state, acceptance, and next action.

**Pending work:**

- Create a stage evidence requirement registry.
- Show required vs optional evidence per local substep.
- Show expected count: one, one per vendor, one or more, many optional, or not
  applicable.
- Show owner role, source system, accepted formats, template/download, upload,
  parse/readiness, acceptance check, and next action.
- Give uploaded-and-accepted rows a green check and visually quiet state.
- Keep missing required evidence visually active until resolved.
- Keep optional evidence visible but muted.
- Separate `uploaded`, `parsed`, `indexed`, `cited`, `accepted`, `stage-ready`,
  `stale`, and `rejected`.

**Demo impact:** very high. This prevents users from guessing which files matter.

### Phase 3 - Vendor Response Intelligence

**Status:** major product gap.

**Goal:** Turn 75-100 page vendor proposals, workbooks, attachments, and Q&A
logs into scoreable, cited, vendor-isolated evidence and leverage.

**Pending work:**

- Model response packages by event, vendor, round, file type, and version.
- Parse long proposal documents into section maps aligned to the RFP structure.
- Parse pricing workbooks separately from narrative proposal PDFs/DOCX.
- Extract compliance answers, assumptions, exclusions, deviations, transition
  plan commitments, SLA commitments, staffing commitments, security/risk
  answers, and commercial exceptions.
- Map each extracted answer to the RFP requirement, rubric criterion, source
  citation, and score eligibility state.
- Flag missing, partial, contradicted, non-comparable, and non-scoreable
  answers.
- Prevent rival-vendor contamination by event/vendor isolation tests.
- Produce a response completeness report before Evaluation opens.
- Produce clarification asks with evidence basis, owner, due date, and expected
  resolution.

**First-pass scoring rule:** AI can suggest a score only when evidence is cited
and score eligibility is deterministic. Human evaluators own final scores and
overrides.

**Demo impact:** highest. This is where Source becomes more than a document
room.

### Phase 4 - Pricing And Commercial Trap Engine

**Status:** partially built, needs evidence-bound hardening.

**Goal:** Convert vendor pricing into comparable TCO, identify traps, and
generate negotiation leverage without fabricating savings.

**Pending work:**

- Normalize pricing by scope baseline, service tower, term, transition cost,
  retained cost, rate card, usage band, SLA exposure, FX/inflation/tax, and
  compliance adders.
- Explain why a vendor is or is not comparable.
- Cite workbook sheet/cell/row where possible.
- Detect embedded transition cost, missing volume assumption, excluded work,
  non-standard credits, service-level carveouts, and price-to-scope mismatch.
- Convert each trap into a vendor clarification or BAFO ask.
- Separate target, requested, conceded, committed, and realized value.

**Demo impact:** highest. This is the commercial leverage engine.

### Phase 5 - BAFO Squeeze Workflow

**Status:** designed, implementation pending.

**Goal:** Convert response gaps, pricing traps, and weak commitments into a
managed vendor squeeze process.

**Pending work:**

- Generate vendor-specific ask packs: conservative, base, and stretch.
- Track ask status: drafted, approved, issued, answered, conceded, refused,
  unresolved, carried to contract, or dropped with rationale.
- Show value impact as evidence-bound requested/conceded/committed states.
- Produce negotiation scripts and executive talking points.
- Keep vendor dispatch human-approved until explicit messaging workflow exists.

**Demo impact:** very high. This is how AbarVa shows leverage a client would not
have had from a normal workflow.

### Phase 6 - Durable Gates And Approvals

**Status:** hard-gated implementation.

**Goal:** Make stage advancement auditable, evidence-bound, and durable.

**Pending work:**

- Persist evidence acceptance, gate checklist, approver, timestamp, rationale,
  exceptions, and downstream unlock.
- Reopen downstream stages when accepted evidence changes or becomes stale.
- Show accepted exceptions downstream in Evaluation, Pricing, BAFO, Executive
  Decision, Selection, Transition, and Value.
- Prove RLS/tenant isolation and approval audit history before deploy.

**Demo impact:** high. This turns the workflow into governance.

### Phase 7 - Guidebook Operating System

**Status:** designed, content/productization pending.

**Goal:** Make Guidebook a stage facilitator, not generic help text.

**Pending work:**

- For every stage, define the meeting/workshop, invitees, pre-work, collection
  checklist, templates, agenda, decision capture worksheet, output, unlock
  criteria, and failure modes.
- Link guidebook actions to stage evidence rows and templates.
- Add aVa prompts tied to the active stage and missing evidence.
- Keep guidebook copy client-ready and free of internal scaffolding labels.

**Demo impact:** medium-high. This makes the product usable by a sourcing lead
without heavy training.

### Phase 8 - Client-Ready Artifacts

**Status:** partially built, quality gate pending.

**Goal:** Generate executive-grade artifacts from accepted evidence.

**Pending work:**

- Scope memo.
- RFP package.
- Response completeness report.
- Evaluation pack.
- Pricing normalization brief.
- BAFO brief.
- Executive decision pack.
- Selection memo.
- Transition readiness pack.
- Value realization pack.
- DOCX/PDF render QA where exports are produced.

**Rule:** artifacts must cite accepted evidence and show missing evidence or
caveats. Missing data cannot be hidden behind confident prose.

**Demo impact:** high. This is what clients carry into meetings.

### Phase 9 - Post-Award Value Proof

**Status:** designed, implementation pending.

**Goal:** Preserve the chain from negotiated improvement to committed obligation
to realized value.

**Pending work:**

- Capture awarded commitments, baseline, measurement owner, period, method, and
  source evidence.
- Track realized, at-risk, missed, disputed, and rebaselined value.
- Connect Value stage to Transition obligations and Finance/Tower evidence only
  when readiness is proven.
- Prevent modeled opportunity from becoming booked realized value.

**Demo impact:** high for CXO trust and renewal storytelling.

## 11-Stage Gap Sweep

| Stage              | CXO question                                          | Required next product lift                                                                            | Primary gap                                                           |
| ------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Strategy           | Is this a real event with mandate and value thesis?   | Plain trigger/owner/value evidence rows and sponsor gate.                                             | Strategy can still read as narrative instead of mandate proof.        |
| Scope              | What exactly are we sourcing?                         | Simplified local substeps with required volumetric evidence and green-check completion.               | File/count requirements are not obvious enough.                       |
| RFP                | Did we ask vendors for scoreable, comparable answers? | Response-control checklist tied to RFP sections, pricing template, rubric, and vendor instructions.   | Weak RFP controls create downstream non-comparable responses.         |
| Responses          | Can we trust and score the proposals?                 | Long-document response parser, completeness report, missing-answer ledger, and clarification backlog. | Biggest intelligence gap today.                                       |
| Evaluation         | Which vendor is strongest and why?                    | Evidence-bound first-pass scoring with citations, holds, and human override.                          | Generic scoring is not defensible without answer-level citations.     |
| Pricing            | What is the real comparable cost?                     | Workbook normalization, assumptions ledger, trap log, and vendor clarification asks.                  | Price comparison can mislead if scope and assumptions differ.         |
| BAFO               | Where can we squeeze value or reduce risk?            | Ask-pack workflow with evidence basis, concession ledger, and human dispatch gate.                    | Leverage needs a managed workflow, not just a summary.                |
| Executive Decision | What should we approve and what remains risky?        | Decision pack with value states, unresolved conditions, risk acceptance, and dissent log.             | Executives need conditions and caveats preserved, not hidden.         |
| Selection          | Did the award preserve negotiated commitments?        | Award record, contract evidence, committed-value baseline, and condition carry-forward.               | Concessions can be lost between BAFO and contract.                    |
| Transition         | Will the selected vendor go live safely?              | Milestone/checkpoint evidence, blocker log, KT proof, go-live readiness gate.                         | Transition evidence is operational and cannot be treated like a memo. |
| Value              | Did the value actually happen?                        | Value ledger with finance/evidence status, leakage, disputes, and corrective action.                  | Projected opportunity must not become realized value.                 |

## Ranked Execution Backlog

1. **SRC57 - Stage smoke harness expansion.** Expand the current layout smoke
   protection across the 11-stage shell and active-canvas states.
2. **SRC58 - Stage operating model implementation.** Implement the local substep
   contract, one active canvas, disabled/enabled forward action, and clean stage
   states.
3. **SRC49 - Evidence intake and parser substrate.** Create the governed
   uploaded-to-cited-to-accepted evidence lifecycle.
4. **SRC59 - Evidence requirement registry.** Define required/optional evidence,
   expected counts, owners, formats, templates, and next actions per stage.
5. **SRC60 - Vendor response package parser contract.** Add the response package
   model, section mapping, missing-answer ledger, and vendor isolation tests.
6. **SRC50 - Evidence-bound first-pass scoring.** Add citation-backed score
   suggestions, holds, and evaluator override audit.
7. **SRC51 - Pricing normalization and commercial trap engine.** Harden pricing
   comparability and trap-to-ask conversion.
8. **SRC52 - Vendor clarification and BAFO squeeze workflow.** Manage asks,
   concessions, refusals, and carry-forward conditions.
9. **SRC53 - Durable stage gate and evidence acceptance.** Persist approvals,
   exceptions, and reopen logic behind explicit human gate.
10. **SRC54 - Guidebook operating system.** Author and wire stage facilitator
    surfaces.
11. **SRC55 - Client-ready artifact generation.** Generate artifact packs from
    accepted evidence with render QA.
12. **SRC56 - Post-award value realization proof.** Track committed to realized
    value without overclaiming.

## Multi-Agent Execution Lane

Use one writer per module family:

| Lane | Owner role            | Scope                                                                 |
| ---- | --------------------- | --------------------------------------------------------------------- |
| A    | UX workflow           | Stage shell, substeps, forward action, visual QA.                     |
| B    | Evidence              | Evidence registry, file lifecycle, readiness, accepted state.         |
| C    | Response intelligence | Vendor proposal parsing, completeness, citations, first-pass scoring. |
| D    | Commercial leverage   | Pricing traps, clarification asks, BAFO concessions.                  |
| E    | Governance            | Gate persistence, approval ledger, exception carry-forward.           |
| F    | Guidebook/artifacts   | Stage guidebooks, templates, executive artifacts, export QA.          |
| G    | QA/deploy             | Tests, screenshots, CI, PR, merge, ACA deploy, runtime invariant.     |

## Incremental Execution Policy

Each runtime slice must include:

- release lane classification,
- affected layer and client applicability,
- tests or smoke proof,
- PR review artifacts,
- merge record,
- ACA deploy proof when runtime changes merge to `main`,
- runtime invariant proof,
- signed-in/browser proof for affected Source routes.

Docs-only slices do not claim runtime behavior.

## Current Next Slice

Next recommended implementation slice: **SRC57 - stage smoke harness expansion**.

Reason: the UI will keep moving quickly. Before deeper UX and parser work lands,
the product needs broad stage-level visual proof that the journey rail, active
canvas, required evidence states, supporting tabs, and forward action remain
clear across the 11-stage event.
