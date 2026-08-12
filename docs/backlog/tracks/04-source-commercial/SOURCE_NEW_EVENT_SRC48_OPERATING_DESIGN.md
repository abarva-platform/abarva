# SRC48 - Source New Event Operating Design

## Status

`candidate-design`

## Purpose

Define the holistic 11-stage Source New Event operating model before additional
implementation. This is the design contract for workflow UX, evidence readiness,
intelligence, guidebooks, approvals, artifacts, and execution sequencing.

This slice is design-only. It does not change workflow persistence, upload
parsing, schema, live data-plane behavior, approval automation, vendor messaging,
or deployment runtime.

## Product Bar

At every moment, a client executive or sourcing lead must understand:

- Where am I in the sourcing process?
- What needs to be done now?
- What evidence is required, optional, missing, uploaded, parsed, cited,
  accepted, or stage-ready?
- What intelligence did AbarVa produce, what evidence was used, and what cannot
  be trusted yet?
- What approval or unlock moves the event forward?
- What leverage did this stage create that would help improve commercial,
  risk, or governance outcomes?

## Current Source Spine To Preserve

The existing Source shell already has the right primitives:

- 11-stage order: Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO,
  Executive Decision, Selection, Transition, Value.
- Stable journey rail with stage progress.
- Stage-local grouped tasks and one active step.
- Shared workspaces: Steps, Files, Intelligence, Approvals, Guidebook.
- Stage artifact readiness and approval CTA logic.
- Canonical artifact catalog with required and gate-defining artifacts.

The simplification is not a new workflow vocabulary. It is a cleaner expression
of this spine:

- one left journey rail,
- one active canvas,
- one local substep path per stage,
- one forward action,
- supporting tabs that do not duplicate the journey tree.

## Information Architecture

### Left Rail

The left rail is the permanent journey map. It should show only stage-level
position, stage state, and completion count.

Recommended rail row:

`02 Scope` - `1/4` - state label or icon.

States:

- Complete: check mark, visually quiet, stage can be opened for review.
- Current: highlighted row, shows the active local step.
- Blocked: highlighted blocker count and blocked reason.
- Future: locked or muted until prior approval gate opens it.
- Reopened: warning state when approved evidence changed downstream.

The rail must not duplicate local substep menus when the active canvas already
shows them.

### Main Canvas

The main canvas answers one question: what work should happen now?

Recommended canvas structure:

- Compact stage header: stage name, purpose, progress, source basis.
- Local step strip or segmented control: 2-6 stage-specific substeps when useful.
- Active task body: form, evidence table, review matrix, decision packet, or
  artifact preview.
- Required before continue: compact readiness checklist in the canvas right side
  only when it explains the active stage gate.
- Primary forward action: Continue, Review stage approval, Open approval gate,
  or Move to next stage.

The forward action is disabled until required evidence and gate artifacts are
ready. The label changes when the stage is ready for approval.

### Supporting Workspaces

Shared tabs should be available without competing with the active task:

- Files: uploaded files, parse status, readiness, accepted status, version, owner.
- Intelligence: insights produced, evidence used, missing evidence, caveats,
  score or commercial impact, next action.
- Guidebook: meeting/workshop to run, invitees, collection checklist, templates,
  output, unlock criteria.
- Approvals: approval ask, accepted evidence, exceptions, stage decision, ledger.

The active task should deep-link to the relevant Files, Intelligence, Guidebook,
or Approval record instead of restating those surfaces.

## Evidence Readiness State Model

File presence alone never satisfies a stage. The UI and gates must separate these
states:

| State           | Meaning                                                                            | Can it feed intelligence?         | Can it satisfy a gate? |
| --------------- | ---------------------------------------------------------------------------------- | --------------------------------- | ---------------------- |
| Needed          | Required by the stage but not requested or uploaded.                               | No.                               | No.                    |
| Requested       | Owner/source/format are known; file is still missing.                              | No.                               | No.                    |
| Uploaded        | Blob or artifact exists.                                                           | No, except file inventory counts. | No.                    |
| Parse attempted | Parser ran or queued.                                                              | No if failed or incomplete.       | No.                    |
| Parsed          | Structured fields or section map extracted.                                        | Limited, if governed.             | No.                    |
| Indexed         | Search/FTS/vector retrieval path exists where applicable.                          | Limited, if scoped.               | No.                    |
| Cited           | Facts can point to file/page/sheet/row/section.                                    | Yes.                              | Not by itself.         |
| Accepted        | Human accepted this version as evidence or client-final artifact.                  | Yes.                              | Maybe.                 |
| Stage-ready     | Required evidence, citations, artifact quality, and acceptance conditions are met. | Yes.                              | Yes.                   |
| Stale           | Evidence was superseded or changed after acceptance.                               | No for final claims.              | No.                    |
| Rejected        | Reviewer rejected the evidence or parse.                                           | No.                               | No.                    |

Evidence rows should therefore show:

- evidence item,
- required or optional,
- expected file count: one, one per vendor, one or more, or optional many,
- source system,
- owner role,
- accepted formats,
- template/download,
- upload button,
- parse status,
- accepted/check status,
- next action.

When a row is uploaded and accepted, show a green check and quiet the row. When a
required row is missing, make it the next action. When optional rows are missing,
keep them visible but muted.

For vendor-heavy stages, one evidence row may expand by vendor. Example:
`Vendor proposal` is required once per active vendor; each vendor row can then
show the 75-100 page proposal, pricing workbook, security attachment, and addenda
as separate files under the same required evidence item.

## Deterministic, AI-Assisted, Human-Approved

### Deterministic

- Stage order and next-stage calculation.
- Required evidence lists and formats.
- Missing evidence and blocker counts.
- Artifact required/gate-defining classification.
- Parse status and file version state.
- Scoring eligibility: answerable, missing, contradicted, non-comparable.
- Pricing normalization formulas and TCO comparison math.
- Value state: projected, requested, committed, realized, at-risk, unproven.
- Smoke proof pass/fail.

### AI-Assisted

- Plain-English summaries.
- Suggested first-pass scores with citations.
- Missing-answer and contradiction explanations.
- Vendor clarification draft language.
- BAFO ask language and negotiation script suggestions.
- Guidebook facilitation prompts.
- Artifact drafts from accepted evidence.

### Human-Approved

- Evidence acceptance.
- Stage gate approval.
- Exception rationale.
- Final evaluator score or override.
- Vendor clarification dispatch.
- BAFO ask approval.
- Executive award decision.
- Contract value commitment.
- Realized value booking.

## Persistence Contract

### UI-Only State

- Current expanded rail section.
- Current local tab within a stage.
- Temporary filter/sort state.
- Draft unsaved notes.
- Which supporting workspace is open.

### Persisted State Required

- File upload, version, owner, source, parse/readiness status.
- Extracted fact records, citations, and governance evaluation.
- Evidence acceptance and rejection.
- Stage gate checklist decision, approver, timestamp, rationale, exceptions.
- Artifact lifecycle state and client-final acceptance.
- Evaluator scores, overrides, confidence, and citation basis.
- Vendor clarification asks, responses, concessions, refusals, and status.
- Pricing assumptions, normalized line items, and trap resolution.
- Award commitments, value owners, measurement basis, realized actuals.

No stage advancement should depend only on local UI completion.

## Step-By-Step UX Walkthrough

1. User lands on a Source event. The left rail shows the 11-stage journey, the
   current stage, completed prior stages, and locked future stages.
2. User opens the current stage. The main canvas shows the active local substep
   and one primary action. Supporting tabs are available but do not compete with
   the active work.
3. User checks the active task. If the task needs evidence, the canvas shows the
   required row, expected file count, owner, source system, accepted formats, and
   upload/template action.
4. User uploads or confirms evidence. The row moves from Uploaded to Parsed,
   Cited, Accepted, and Stage-ready only as those states are actually earned.
5. Completed local substeps become checked and quiet. The next incomplete
   required substep is highlighted.
6. Files shows all uploaded files, parse/readiness state, accepted version, and
   repair actions for failed or stale files.
7. Intelligence explains what changed: evidence used, insights produced, missing
   evidence, scoring or pricing impact, and the next action.
8. Guidebook tells the sourcing lead what meeting or workshop to run, who to
   invite, what to collect, and what output unlocks the gate.
9. When required substeps, evidence, and gate artifacts are ready, the primary
   action changes to Review stage approval or Open approval gate.
10. Approval records accepted evidence, exceptions, approver, timestamp, and the
    next-stage unlock. The next stage then becomes current in the rail.

## 11-Stage Operating Matrix

### 01 Strategy

Purpose: confirm mandate, sponsor, sourcing archetype, value thesis, and rigor
before scope work begins.

Local substeps:

- Mandate
- Sponsor
- Value thesis
- Archetype
- Approval

Required evidence:

- Sponsor/decision owner confirmation.
- Event mandate and why-now rationale.
- Value target brief with confidence and assumptions.
- Sourcing archetype decision or rigor rationale.

Optional evidence:

- Prior sourcing history.
- Incumbent performance issue summary.
- Benchmark range used for value thesis.

Outputs/artifacts:

- Sourcing Strategy Memo.
- Value Target Brief.
- Archetype Decision Record.

Intelligence produced:

- Is this a real sourcing event or a vague initiative?
- Which archetype should shape the RFP and evidence pack?
- What value levers are plausible, directional, or unsupported?
- What sponsor or mandate gap would cause later churn?

Approval condition:

- Accountable sponsor confirms mandate, value target, and archetype.

Next unlock:

- Scope opens with selected archetype and evidence requirements pre-wired.

Guidebook session:

- Strategy kickoff: sponsor, procurement lead, finance, domain owner, EA/risk as
  needed. Output is the approved mandate and value thesis.

Downstream dependency:

- Scope, RFP clause library, evaluation rubric, pricing assumptions, and value
  ledger inherit this archetype and value thesis.

### 02 Scope

Purpose: define what is being sourced and what is excluded so vendors price the
same work instead of padding uncertainty.

Local substeps:

- Work in scope
- Work out of scope
- Owners
- Baseline evidence
- Approval

Required evidence:

- Application/service inventory and tiering.
- Scope memo with boundaries.
- Exclusion log.
- Ticket, volume, service tower, or demand history.
- Sponsor acceptance of the boundary.

Optional evidence:

- Current SLA baseline.
- Responsibility matrix.
- Pre-mortem on scope risk.
- Region, language, compliance, or transition assumptions.

Outputs/artifacts:

- Application Inventory and Tiering.
- Scope Memo with Boundaries.
- Exclusion Log.
- Ticket History Synthesis.
- Pre-mortem on Scope Risk.

Intelligence produced:

- What work is in scope, out of scope, ambiguous, or ownerless?
- Which missing volumetrics will make vendor pricing non-comparable?
- Where will vendors exploit unclear responsibility boundaries?

Approval condition:

- Required scope evidence and gate artifacts are accepted; owner confirms the
  boundary is final enough for RFP.

Next unlock:

- RFP opens with protected scope language, response requirements, and templates.

Guidebook session:

- Scope workshop: sponsor, procurement, service owner, EA, operations, finance,
  security/risk if applicable. Output is an approved scope boundary.

Downstream dependency:

- RFP, response templates, pricing normalization, BAFO asks, contract obligations,
  and value measurement all depend on the locked scope.

### 03 RFP

Purpose: turn strategy and scope into vendor instructions, response templates,
pricing templates, evaluation rubric, and value-protecting clauses.

Local substeps:

- Requirements
- Response template
- Pricing template
- Rubric
- Vendor list
- Approval

Required evidence:

- Final RFP package.
- Vendor response control pack.
- Vendor shortlist.
- RFP clause coverage against value levers.
- Evaluation criteria and weights.

Optional evidence:

- RFI summary.
- Market scan.
- Security or legal addendum.
- Incumbent contract excerpts.

Outputs/artifacts:

- RFP Package.
- Vendor Response Control Pack.
- Vendor Shortlist.
- RFI Summary if run.

Intelligence produced:

- Which value levers are protected by required clauses?
- Which requirements lack a response field or pricing field?
- Which vendor response sections must be mandatory vs optional?
- Which RFP gaps will become BAFO leakage if not fixed now?

Approval condition:

- RFP, response template, pricing template, shortlist, and rubric are accepted.

Next unlock:

- Responses opens after RFP issue, vendor due dates, and Q&A protocol are set.

Guidebook session:

- RFP release review: sourcing lead, procurement, legal, risk, finance, technical
  evaluator leads. Output is the issue-ready RFP pack.

Downstream dependency:

- Responses parsing, scoring, pricing comparability, and BAFO leverage only work
  if the RFP required the right answer structure.

### 04 Responses

Purpose: receive vendor responses, isolate each vendor's evidence, and expose
missing answers, deviations, assumptions, and clarification needs.

Local substeps:

- Receive files
- Completeness
- Exceptions
- Clarifications
- Approval

Required evidence:

- Vendor response documents and attachments for each invited vendor.
- Pricing workbooks.
- Compliance/security questionnaires when applicable.
- Q&A log.
- Response completeness report.

Optional evidence:

- Oral presentation materials.
- Vendor demo notes.
- Reference call notes.
- Late addenda and correction notices.

Outputs/artifacts:

- Vendor Response Pack.
- Q&A Log.
- Response Completeness Report.
- Clarification backlog.

Intelligence produced:

- Which mandatory sections were answered, dodged, partially answered, or
  contradicted?
- Which vendor files are parse-ready, citation-ready, or blocked?
- Which answers are not scoreable yet?
- Which missing items should become clarification asks?

Approval condition:

- Each active vendor has a known response state and required response evidence
  is parsed, cited, or explicitly excepted.

Next unlock:

- Evaluation opens with scoreable evidence, missing-answer holds, and
  clarification actions.

Guidebook session:

- Response intake triage: sourcing lead, procurement, evaluator lead, pricing
  analyst, risk/security as needed. Output is the response completeness and
  clarification plan.

Downstream dependency:

- Evaluation, pricing normalization, and BAFO depend on clean vendor isolation
  and citation-level response mapping.

### 05 Evaluation

Purpose: score vendor proposals against the rubric using evidence-bound
first-pass scoring, evaluator judgment, and transparent holds.

Local substeps:

- Rubric lock
- First-pass scoring
- Evaluator review
- Gaps and overrides
- Approval

Required evidence:

- Locked scorecard and weights.
- Vendor proposal citations for each scored criterion.
- Evaluator scores or approvals.
- Weight governance log.

Optional evidence:

- Oral/demo scoring.
- Reference feedback.
- Disqualification rationale.
- Sensitivity analysis.

Outputs/artifacts:

- Evaluation Scorecard.
- Weight Set Governance Log.
- Disqualification Rationale where applicable.

Intelligence produced:

- Which criteria are answerable and cited?
- Which criteria are missing, contradicted, weak, or non-scoreable?
- Where did human evaluators override first-pass scoring?
- Which vendors are viable, blocked, or unclear before pricing/BAFO?

Approval condition:

- Final evaluator-owned scorecard is accepted; unresolved gaps are routed to
  Pricing or BAFO.

Next unlock:

- Pricing opens with viable vendors, scored risks, and clarification context.

Guidebook session:

- Evaluation calibration: evaluator leads, procurement, sponsor, risk/legal as
  applicable. Output is the accepted scorecard and unresolved conditions.

Downstream dependency:

- Pricing, BAFO, Executive Decision, and Selection must show score confidence
  and unresolved conditions.

### 06 Pricing

Purpose: normalize supplier commercials to comparable TCO, expose hidden costs,
and convert pricing gaps into commercial leverage.

Local substeps:

- Normalize
- Compare
- Trap review
- Clarify
- Approval

Required evidence:

- Pricing normalization workbook.
- Locked assumption set.
- Pricing trap log.
- Vendor pricing submissions and rate cards.
- Scope baseline used for comparable TCO.

Optional evidence:

- Market benchmark.
- Incumbent run-rate.
- FX, inflation, tax, or transition sensitivity.
- Retained-team cost model.

Outputs/artifacts:

- Pricing Normalization Workbook.
- Pricing Trap Log.
- Locked Assumption Set.
- Vendor-specific clarification asks.

Intelligence produced:

- Which vendors are comparable and why?
- Which pricing cells, assumptions, exclusions, or missing volumes block
  comparability?
- What is headline price versus normalized TCO?
- What commercial traps should be pressed before BAFO?

Approval condition:

- Commercial owner accepts the normalized basis and unresolved traps are assigned
  to clarification or BAFO.

Next unlock:

- BAFO opens with vendor-specific asks, concession targets, and walk-away logic.

Guidebook session:

- Pricing challenge session: sourcing lead, finance, procurement, service owner,
  legal/risk if needed. Output is approved normalized TCO and trap actions.

Downstream dependency:

- BAFO, Executive Decision, Selection, and Value rely on the accepted assumption
  set and trap resolution state.

### 07 BAFO

Purpose: turn evidence gaps, pricing traps, and score weaknesses into
vendor-specific asks that improve value or reduce risk before the final decision.

Local substeps:

- Ask strategy
- Vendor packs
- Round tracking
- Concession ledger
- Approval

Required evidence:

- BAFO question pack.
- BAFO round log.
- Vendor responses to asks.
- Concession or refusal status by ask.

Optional evidence:

- Negotiation script.
- Walk-away model.
- Executive talking points.
- Legal fallback language.

Outputs/artifacts:

- BAFO Question Pack.
- BAFO Round Log.
- Concession ledger.
- Negotiation brief.

Intelligence produced:

- Which asks are conservative, base, or stretch?
- What evidence justifies each ask?
- What vendor concessions were captured, refused, or deferred?
- How much value is requested, committed, or still unproven?

Approval condition:

- Human owner approves BAFO close and confirms concessions/refusals are captured
  without unsupported booked-value claims.

Next unlock:

- Executive Decision opens with final offers, risk, economics, and unresolved
  conditions.

Guidebook session:

- BAFO war room: sponsor, procurement, finance, legal, evaluator leads, service
  owner. Output is approved ask pack and final round log.

Downstream dependency:

- Executive Decision and Selection depend on BAFO concession status and open
  conditions.

### 08 Executive Decision

Purpose: present the recommendation, value case, tradeoffs, residual risk, and
approval conditions so executives can decide the award path.

Local substeps:

- Recommendation
- Value case
- Risks
- Conditions
- Approval

Required evidence:

- Decision brief.
- Risk attestation.
- Governance sign-off record.
- Final scorecard and pricing basis.
- Stakeholder endorsement or documented dissent.

Optional evidence:

- Sensitivity analysis.
- Legal memo.
- Board or committee pack.
- Scenario comparison.

Outputs/artifacts:

- Decision Brief.
- Risk Attestation.
- Governance Sign-off Record.

Intelligence produced:

- Why is this the recommended path?
- What risks remain and who accepts them?
- What value is committed versus modeled?
- What decision conditions must carry into Selection and Transition?

Approval condition:

- Decision owner approves award path, accepted risks, and conditions.

Next unlock:

- Selection opens with the approved vendor path and contract conditions.

Guidebook session:

- Executive decision meeting: sponsor, decision owner, finance, procurement,
  legal/risk, evaluator leads. Output is the signed decision record.

Downstream dependency:

- Selection, Transition, and Value must preserve approved conditions and
  residual risks.

### 09 Selection

Purpose: convert the executive decision into an award record, contract evidence,
selection rationale, and committed-value baseline.

Local substeps:

- Award record
- Contract evidence
- Conditions
- Commitments
- Approval

Required evidence:

- Selection memo.
- Contract record or executed award reference.
- Award conditions.
- Committed value lines by lever.

Optional evidence:

- Negotiation closeout notes.
- Vendor onboarding packet.
- Regulatory or procurement filing.

Outputs/artifacts:

- Selection Memo.
- Contract Record.
- Award commitment summary.

Intelligence produced:

- Did every negotiated concession survive into contract language?
- Which approved conditions remain open?
- What value is now committed versus still merely modeled?

Approval condition:

- Commercial owner confirms the award record, contract evidence, and committed
  value baseline.

Next unlock:

- Transition opens with contractual obligations and go-live commitments.

Guidebook session:

- Award closeout: sponsor, procurement, legal, finance, transition owner,
  vendor manager. Output is award record and committed baseline.

Downstream dependency:

- Transition and Value cannot measure delivery without this committed baseline.

### 10 Transition

Purpose: manage the selected vendor into service with milestones, knowledge
transfer, blockers, go-live readiness, and obligation tracking.

Local substeps:

- Plan
- Knowledge transfer
- Cutover
- Blockers
- Go-live
- Approval

Required evidence:

- Transition plan.
- Checkpoint log.
- Knowledge-transfer evidence.
- Go-live readiness and owner confirmation.

Optional evidence:

- Rollback plan.
- Hypercare plan.
- Service readiness review.
- Contract obligation checklist.

Outputs/artifacts:

- Transition Plan.
- Checkpoint Log.
- Knowledge-Transfer Evidence.
- Go-live readiness record.

Intelligence produced:

- Which milestones are complete, missed, deferred, or blocked?
- Which obligations are at risk before go-live?
- Which knowledge-transfer gaps threaten value realization?

Approval condition:

- Transition owner accepts go-live readiness or records approved exceptions.

Next unlock:

- Value opens with go-live baseline, obligations, and measurement owners.

Guidebook session:

- Transition checkpoint: transition owner, vendor manager, service owner,
  procurement, risk/security if relevant. Output is go-live readiness and
  measurement handoff.

Downstream dependency:

- Value realization depends on service start, owner, measurement basis, and
  obligation evidence.

### 11 Value

Purpose: prove committed value is realized, at risk, missed, or disputed using
accepted evidence.

Local substeps:

- Baseline
- Actuals
- Leakage
- Actions
- Review

Required evidence:

- Value ledger.
- Measurement owner and period.
- Realized actuals by value lever.
- Evidence for credits, avoided costs, productivity, SLA remedies, or cost
  reduction.

Optional evidence:

- Governance review note.
- Vendor performance review.
- Finance validation.
- Rebaseline rationale.

Outputs/artifacts:

- Value Ledger.
- Governance Review Note.
- Corrective action or rebaseline record.

Intelligence produced:

- What value is projected, committed, realized, at risk, or unproven?
- Where is value leaking and what action can recover it?
- What vendor obligation or measurement evidence is missing?

Approval condition:

- Value owner accepts realized value evidence or records why value remains open,
  disputed, or at risk.

Next unlock:

- Event remains in value tracking or closes with realization proof.

Guidebook session:

- Value review: value owner, finance, vendor manager, service owner, sponsor.
  Output is realized value proof and corrective actions.

Downstream dependency:

- Tower, account governance, renewal planning, and future sourcing patterns use
  only accepted value evidence, not modeled opportunity.

## Stage Wireframe Contract

### Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO, Executive Decision

These stages should use the same skeleton with stage-specific local substeps:

```text
Left journey rail       Main canvas
-----------------       -----------------------------------------------
01 Strategy  3/3        Stage 02 - Scope                    [Continue]
02 Scope     1/4        Define what is being sourced
03 RFP       0/5
...                    [Work in scope] [Out of scope] [Owners] [Evidence]

                        Active task: Work in scope
                        One focused form, table, review matrix, or packet.

                        Required before continue
                        [x] Work in scope accepted
                        [ ] Required volumetrics uploaded and cited
                        [ ] Scope owner accepted boundary

                        Supporting tabs: Files | Intelligence | Guidebook | Approvals
```

Rules:

- Local substeps appear in the canvas, not duplicated in the rail.
- The active substep controls the canvas body.
- Completed substeps are checked and quiet.
- The next required incomplete substep is highlighted.
- The primary forward action lights up only when the gate condition is true.

### Selection, Transition, Value

Later stages need more operational evidence and may have 5-6 local substeps. Use
a horizontal step strip only if it fits; otherwise use a compact vertical local
step list inside the main canvas. Do not push all local substeps into the global
left rail.

## Files Workspace Contract

Files is not a generic document room. It is the evidence control surface.

Minimum row fields:

- Evidence item.
- Required/optional.
- Stage and local substep.
- Vendor if applicable.
- Source system.
- Owner role.
- Accepted formats.
- Template/download.
- Upload action.
- Parse status.
- Citation/readiness status.
- Accepted/check status.
- Next action.

Required rows should be grouped above optional rows. Uploaded-and-accepted rows
get a green check. Failed parse rows get a clear repair action. Optional rows
stay visible but muted.

## Intelligence Workspace Contract

Intelligence must always explain:

- What insight was produced.
- What evidence was used.
- Which citations support it.
- What evidence is missing.
- What was excluded from scoring or pricing.
- Confidence and score/commercial impact.
- The next action to improve leverage.

Unsupported or model-only intelligence should be labeled as directional and
blocked from final claims.

## Guidebook Workspace Contract

Each stage guidebook should include:

- Stage purpose.
- Meeting or workshop to run.
- Who to invite.
- Pre-work.
- Evidence to collect.
- Templates to use.
- Agenda.
- Decision capture worksheet.
- Output that unlocks the next step.
- Common failure modes.
- aVa prompts tied to the active stage.

Guidebook should feel like a facilitator surface, not help text.

## Approvals Workspace Contract

Approvals must answer:

- What is being approved?
- Which evidence and artifacts are accepted?
- Which exceptions exist?
- Who approved it?
- What stage unlock happens next?
- What downstream stages inherit from this approval?

Approval is a durable audit record. Stage advancement cannot be a silent UI
side-effect.

## Integration Model

Source owns the event workflow, event-scoped evidence, event-scoped facts,
artifacts, gate decisions, and sourcing-specific projections.

Source does not own canonical vendor, contract, application, spend, KPI, or
enterprise context truth. Those come through governed intake/adapters/canonical
models and are projected into Source. Uploaded event evidence can become a
governed context object only after policy, provenance, readiness, and human
approval conditions are satisfied.

Required integration points:

- Source facts and fact templates.
- Source artifact lifecycle and canonical artifact specs.
- Source file cabinet and parse/readiness status.
- Source guidebooks.
- Source approvals and approval ledger.
- aVa for cited suggestions, drafts, and negotiation language.
- Atlas/Tower for value and operational context only when evidence-ready.

## Multi-Agent Execution Plan

Parallelization is allowed only after this contract is accepted. One writer owns
each module or artifact family.

Lane A - UX/workflow:

- Active task canvas simplification.
- Local substep controls.
- Files/Intelligence/Guidebook/Approval cross-links.
- Visual QA for all 11 stages.

Lane B - Evidence/data:

- Evidence requirement registry.
- Upload-to-parse-to-citation substrate.
- Vendor/event/file isolation.
- Governed object readiness checks.

Lane C - Scoring/pricing:

- First-pass scoring eligibility.
- Citation-bound scoring.
- Pricing normalization.
- Commercial trap and clarification engines.

Lane D - Governance/approvals:

- Durable gate checklist.
- Evidence acceptance.
- Exceptions, reopening, downstream inherited conditions.

Lane E - QA/deploy:

- Stage smoke harness.
- Browser screenshots and DOM proof.
- Release records.
- ACA deploy proof only for runtime slices.

## Execution Slices

Recommended order:

1. `SRC49` evidence intake and parser substrate.
2. `SRC57` smoke harness foundation, started alongside `SRC49`.
3. `SRC50` evidence-bound first-pass scoring.
4. `SRC51` pricing normalization and commercial trap engine.
5. `SRC52` vendor clarification and BAFO squeeze workflow.
6. `SRC53` durable stage gate and evidence acceptance.
7. `SRC54` guidebook operating system.
8. `SRC55` client-ready artifact generation.
9. `SRC56` post-award value realization proof.

`SRC45`, `SRC46`, and `SRC47` can continue as bounded backlog items, but they
must not redefine the 11-stage New Event IA.

## Stage Smoke Checklist

For every affected stage in any implementation slice, smoke proof must verify:

- Left rail shows the correct current stage and completed prior stages.
- Main canvas shows only one active task area.
- Local substeps show current, complete, pending, and blocked states.
- Required evidence rows are distinguishable from optional rows.
- Uploaded accepted files show a green check or equivalent accepted state.
- Missing or failed evidence shows a next action.
- Intelligence shows evidence used, missing evidence, caveats, and next action.
- Guidebook exists or gracefully states no guidebook is authored.
- Approval action is disabled before readiness and enabled after readiness.
- Stage unlock text names the next stage.
- No unsupported savings, scoring, vendor, or value claim appears as final.

## Human Gates

These remain explicit human gates per implementation slice:

- schema migrations,
- workflow persistence changes,
- live data-plane mutation,
- new production upload/parser ingestion,
- vendor communication dispatch,
- approval automation,
- Active Tenant Access or client-specific promotion,
- deletion or non-reversible cleanup,
- ACA runtime deployment.

## Acceptance Mapping

This design satisfies the `SRC48` backlog acceptance criteria as follows:

- CXO clarity: the rail/canvas/tab model makes current stage, current task,
  blockers, and approval action explicit.
- Engineering clarity: each stage has purpose, substeps, evidence, artifacts,
  intelligence, approval, unlock, guidebook, and downstream dependencies.
- Evidence distinction: the readiness state model separates uploaded, parsed,
  indexed, cited, accepted, and stage-ready.
- Integration clarity: Source facts, artifacts, approvals, guidebooks, aVa,
  Atlas/Tower, and governed context are named as integration points.

Remaining validation before implementation:

- Signed-in browser review against the current event route.
- Visual mockup refresh for all 11 stages using this IA.
- Slice-specific technical design for any persistence, parser, or data-plane
  change.
