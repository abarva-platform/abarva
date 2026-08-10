# Source New Event Artifact and Analytics Quality Audit

Date: 2026-08-10
Scope: New Event 11-stage journey only. Optimize Contract is a separate module and should have its own audit.
Audit stance: sourcing CXO plus product QA. This is not a click-path smoke test.

## Correction to Prior Status

The earlier short list was a blocker list for end-to-end execution. It was not the full artifact-quality and analytics-quality audit requested.

That distinction matters. A workflow can technically advance and still fail the product promise if the artifacts are thin, the insight surfaces do not teach the user anything new, uploads do not become governed facts, or aVa cannot explain the decision with citations.

Current verdict:

**New Event is not QA-passed as a client-ready sourcing operating system.** It has a credible journey shell and some genuinely useful stage intelligence, especially around RFP readiness, but the artifact and analytics layer is uneven. The product should not be represented as fully certified until the gaps below are closed and live-verified.

## What This Audit Tests

For every stage and major artifact, the product must answer:

1. What decision is this stage supposed to improve?
2. What data did AbarVa use that a generic workflow would not have?
3. What changed because a file, note, guidebook, prior stage, or approval was added?
4. Is the generated artifact structurally strong enough to put in front of a vendor or executive?
5. Does the insight cite governed evidence and keep unknowns explicit?
6. Does aVa understand the same context and produce useful tables, charts, and sourced narrative?

## Executive Quality Scorecard

| Dimension                     | Score | Status          | Why it matters                                                                                                                           |
| ----------------------------- | ----: | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Journey structure             |  7/10 | Promising       | The 11 stages are directionally right for a full sourcing event, and the rail gives a usable operating model.                            |
| Artifact governance           |  4/10 | Not ready       | The ledger distinguishes drafts from finals, but many required artifacts are missing or weak, and `client-final` proof is absent.        |
| Artifact content quality      |  3/10 | Not ready       | Several core documents are prompt-backed drafts with low content QA; a sourcing leader would not issue them without review and revision. |
| Analytics and insight quality |  5/10 | Uneven          | RFP intelligence is useful; later stages do not yet show the same insight depth, lineage, or next-best action clarity.                   |
| Upload-to-fact conversion     |  5/10 | Partial         | Some uploads affect readiness, but not all uploads visibly parse into governed, reusable objects.                                        |
| Rich proposal intelligence    |  2/10 | Major gap       | Long vendor responses are central to sourcing, but durable proposal dossier parsing is not yet implemented.                              |
| aVa sourcing intelligence     |  3/10 | Not demo-safe   | Hard stage-aware QA with citations, tables, chart-ready outputs, and artifact awareness is not passed.                                   |
| CXO narrative value           |  5/10 | Prototype-grade | The product shows direction, but it does not yet consistently answer "what should I do and why is this defensible?"                      |

## Artifact Quality Audit

The artifact ledger is valuable because it does not pretend an AI draft is a final deliverable. The issue is that too many artifacts remain draft, missing, or low-quality.

| Artifact                     | Expected executive outcome                                                                                                                                 | Current observed quality                                                                                                            | Audit verdict                                      | Required improvement                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sourcing Strategy Memo       | Establish why this event exists, what value is at stake, who owns it, and what evidence must be collected next.                                            | Stronger than most. Prior report showed a high content QA score, but no client-final acceptance or decision closure.                | Useful draft, not final.                           | Add explicit decision record, next-stage evidence guide, workshop plan, source-system checklist, and client-final state.                                                             |
| Scope Memo with Boundaries   | Define what is in, out, unresolved, retained by client, vendor-owned, and evidence-backed.                                                                 | Low content quality in prior ledger. Scope readiness can complete, but artifact clarity is not at the level of a sourcing playbook. | Not acceptable as an authoritative scope artifact. | Replace generic scope prose with a structured scope inventory, exclusions, source systems, owner roles, volumetrics, unresolved decisions, and evidence citations.                   |
| RFP Package                  | Produce a supplier-ready request package with enforceable requirements, response controls, pricing template, evaluation rules, and value-lever protection. | RFP stage intelligence is promising, but the document itself remained an AI draft with weak content QA and no final review gate.    | Not supplier-ready.                                | The RFP must show required sections, value-lever-to-clause coverage, pricing response controls, mandatory exhibits, risk terms, review receipt, and export proof.                    |
| Vendor Response Control Pack | Tell vendors exactly how to respond, what evidence is required, and how claims will be scored.                                                             | Exists conceptually, but quality is not enough for rich vendor proposals.                                                           | Weak.                                              | Add proposal-section checklist, file naming/version rules, claim evidence requirements, exception format, pricing assumptions, AI/automation claim proof, and citation expectations. |
| Vendor Shortlist             | Show which vendors should advance and why, with evidence and unresolved risks.                                                                             | Better than the RFP artifacts, but still not enough without durable parsed vendor responses.                                        | Partial.                                           | Tie shortlist to parsed proposal objects, scorecard criteria, pricing normalization, risk exceptions, and human score locks.                                                         |
| Evaluation Scorecard         | Convert proposals into evidence-backed criteria scores with human approvals and override audit.                                                            | Not fully registered/accepted as a strong artifact in the observed ledger.                                                          | Missing as a mature artifact.                      | Add durable scorecard object: criteria, weights, AI suggestion, human final score, override reason, reviewer, citations, and lock state.                                             |
| Pricing Workbook             | Normalize vendor bids into comparable TCO and identify assumptions, retained work, transition cost, escalators, and optional scope.                        | Readiness behavior was unreliable in the live run; workbook artifact quality not proven.                                            | Not certified.                                     | Add deterministic pricing normalization, scenario sensitivity, assumption log, parser readback, and export QA.                                                                       |
| Pricing Trap Log             | Identify commercial traps: pass-throughs, transition fees, indexation, minimums, credits, rate-card deltas, and excluded scope.                            | Not proven as a mature artifact.                                                                                                    | Missing.                                           | Generate from parsed pricing workbook, proposal exceptions, contract terms, and sourcing assumptions.                                                                                |
| BAFO Question Pack           | Turn gaps and traps into vendor-specific final asks.                                                                                                       | BAFO stage can become ready, but the actual artifact was not proven complete.                                                       | Not ready.                                         | Generate vendor-specific questions from unsupported claims, weak commitments, exceptions, pricing traps, and missing evidence.                                                       |
| Executive Decision Brief     | Give leadership a defensible recommendation, alternatives, tradeoffs, value basis, conditions, and approval ask.                                           | Prior run showed persistence/approval blockers and unresolved artifact readiness.                                                   | Not demo-safe.                                     | Separate stage blocker from artifact hygiene, cite evaluation/pricing/BAFO evidence, show alternatives, and persist approval record.                                                 |
| Selection/Award Record       | Capture award decision, committed baseline, legal handoff, obligations, and transition starting conditions.                                                | Approval entitlement blocked full completion.                                                                                       | Not certified.                                     | Use correct approver persona or explicit co-approval workflow; write award baseline and legal/transition handoff.                                                                    |
| Transition Plan              | Translate award into implementation workstreams, owners, milestones, obligations, risks, and exit criteria.                                                | Upload stored a file but did not satisfy readiness in the run.                                                                      | Parser/readiness gap.                              | Parse transition rows into governed readiness objects and prove reload readback.                                                                                                     |
| Value Proof Pack             | Prove realized value with finance-confirmed actuals, not estimates or targets.                                                                             | Surface exists, but periodized realization proof was not certified.                                                                 | Not ready.                                         | Separate target, negotiated, avoided, recoverable, and realized value; require finance confirmation and periodized actuals.                                                          |

## Analytics and Insight Quality Audit

| Surface                         | What it should communicate                                                                                                         | Current quality                                                          | CXO question it should answer                                                | Required change                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage guidebook                 | How to run the workshop, who to invite, what to collect, which templates to use, and what output is required before the next gate. | Strongest where inspected, especially RFP. Not proven across all stages. | "What do I do in the meeting tomorrow?"                                      | Generate stage-specific guidebooks for all 11 stages, dynamically reflecting event type, missing evidence, source systems, and prior-stage decisions. |
| RFP intelligence                | Whether the RFP protects the value levers and where clauses are missing.                                                           | Genuinely valuable; it surfaced clause protection and exposure.          | "Can this RFP actually preserve the value we care about?"                    | Make the insight feed directly into RFP revision, artifact quality blockers, and aVa citations.                                                       |
| Files & deliverables            | What has been uploaded, parsed, generated, reviewed, accepted, exported, and still blocked.                                        | Valuable concept, too disconnected from workflow state.                  | "What is real, what is draft, and what can I rely on?"                       | Make every file row show requirement, source, parser result, evidence objects created, artifact impact, review state, and next action.                |
| Evidence readiness              | Which evidence rows are required, optional, uploaded, parsed, usable, or failed.                                                   | Partial. Uploads sometimes require reload or do not satisfy readiness.   | "Did my file count?"                                                         | Use row-level statuses: requested, uploaded, parsing, parsed, needs review, failed, usable, accepted.                                                 |
| Stage approval panel            | Whether the current stage can advance and what exactly blocks it.                                                                  | Mixed. Some screens blur artifact hygiene with current-stage blockers.   | "What is the one thing preventing progress?"                                 | Primary blocker only; artifact hygiene as secondary drawer.                                                                                           |
| Proposal/response intelligence  | Parse vendor proposals into claims, exceptions, staffing, solution design, AI accelerators, SLAs, risks, and citations.            | Not ready.                                                               | "Which vendor proposal is actually strong, and where are they overclaiming?" | Implement durable proposal dossier parsing before claiming best-in-class Evaluation/Pricing/BAFO.                                                     |
| Pricing insight                 | Normalize bids and expose assumptions, retained work, pass-throughs, transition fees, and escalation.                              | Not certified.                                                           | "Are these bids comparable, and where is the trap?"                          | Build deterministic TCO, assumptions, scenario, and trap log read models.                                                                             |
| Evaluation insight              | Separate AI suggestions from human final scores and explain evidence strength.                                                     | Partial. Cannot be strong without parsed proposal dossiers.              | "Why did this vendor score higher, and is the evidence defensible?"          | Tie every score to validated proposal/evidence objects and human score locks.                                                                         |
| Executive decision intelligence | Provide recommendation, alternatives, unresolved conditions, tradeoffs, and value basis.                                           | Not certified.                                                           | "What should I approve, what are the risks, and what must be true?"          | Generate a decision packet from accepted artifacts only, with unknowns explicit.                                                                      |
| Value intelligence              | Prove realized value through finance/operational actuals.                                                                          | Not certified.                                                           | "Did we actually get the money or outcome?"                                  | Periodized finance proof, operational baselines, claim state, and reviewer confirmation.                                                              |
| aVa                             | Answer stage-aware questions with cited facts, tables, charts, and explicit unknowns.                                              | Not passed.                                                              | "Can I interrogate the event like an expert analyst?"                        | Run the 25-question hard QA suite and fix failures before demo-safe claims.                                                                           |

## Why the Initial List Looked Too Small

The initial execution list focused on defects blocking the mechanical journey:

- confirm actions not persisting;
- approval entitlement blockers;
- upload/readiness mismatches;
- proposal parsing not implemented;
- RFP artifact not client-ready.

Those are necessary, but not sufficient. The quality audit adds the product-depth backlog:

- generated artifacts must be scored against consulting-grade expectations;
- insights must teach the user something new, not repeat input fields;
- uploaded files must become typed, cited, reusable facts;
- aVa must reason over event context and produce charts/tables;
- each stage must include a guidebook for the next workshop and evidence collection;
- artifact prompt packets must include uploaded files, prior-stage decisions, human overrides, and unresolved gaps.

## What a Best-in-Class New Event Journey Must Add

### 1. Stage guidebooks before each collection step

Every stage should produce a guidebook for the next stage:

| Before stage       | Guidebook must tell the client                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope              | Which applications, service towers, volumes, owners, SLAs, contracts, exclusions, and retained-work facts to collect.                       |
| RFP                | Which requirements, value levers, pricing tables, clause protections, evaluation criteria, and vendor response rules to include.            |
| Responses          | How vendors should structure long proposals and what evidence is mandatory for solution, AI, staffing, transition, SLA, and pricing claims. |
| Evaluation         | How to score claims, when to reject unsupported narrative, and when human evaluator override is required.                                   |
| Pricing            | Which bid components to normalize and how to expose non-comparable assumptions.                                                             |
| BAFO               | Which vendor-specific gaps become final asks.                                                                                               |
| Executive Decision | What evidence leadership must see before approving finalist path.                                                                           |
| Selection          | What must be locked before award handoff.                                                                                                   |
| Transition         | Which obligations, workstreams, risks, owners, and acceptance evidence must be tracked.                                                     |
| Value              | Which baseline and actuals prove value without turning target into realized value.                                                          |

### 2. Evidence row contract

Each evidence request must be row-based, not buried in prose:

| Column          | Purpose                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Evidence item   | The exact thing requested.                                                                                                    |
| Required?       | Whether it blocks approval.                                                                                                   |
| Source system   | Where to get it: CLM, ERP/AP, procurement/S2P, ITSM, CMDB, usage platform, pricing workbook, vendor proposal, finance ledger. |
| Owner role      | Who can provide it.                                                                                                           |
| Time grain      | Monthly, line-item, vendor/version, milestone, clause, periodized actual, etc.                                                |
| History needed  | 12 months, 24 months, current term, proposal version, award baseline, transition plan.                                        |
| Template        | Downloadable CSV/XLSX with how-to instructions.                                                                               |
| Upload          | File action.                                                                                                                  |
| Parser status   | Uploaded, parsing, parsed, failed, needs review, accepted.                                                                    |
| Generated facts | Count and type of governed facts created.                                                                                     |
| Artifact impact | Which artifacts or insights changed because of the upload.                                                                    |
| Next action     | Review, approve, fix mapping, upload missing evidence, or open gate.                                                          |

### 3. Prompt context manifest

Every generated artifact must carry a manifest:

| Manifest section      | Required content                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Evidence used         | File IDs, parsed objects, rows/pages/sections, confidence, review state.                                     |
| Evidence excluded     | Uploaded material ignored because it failed parsing, failed validation, was superseded, or was out of scope. |
| Evidence pending      | Required data still missing.                                                                                 |
| Human updates         | Sponsor edits, meeting notes, scoring overrides, rationale, accepted changes.                                |
| Prior-stage decisions | Approved scope, RFP clauses, evaluation criteria, pricing assumptions, BAFO concessions, award conditions.   |
| Artifact blockers     | Placeholders, contradictions, missing citations, unsupported values, review gates not run.                   |

Without this, the user cannot trust that a generated RFP, scorecard, BAFO pack, or decision brief reflected what was actually uploaded.

## Expanded Backlog From the Quality Audit

### AQ - Artifact Quality

| ID    | Severity | Finding                                                   | Required outcome                                                                                                   |
| ----- | -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| AQ-01 | P0       | RFP package is not supplier-ready.                        | RFP quality and content QA >= 90, no placeholders, Gate B run, human review accepted, export verified.             |
| AQ-02 | P0       | Scope memo quality is too weak to be authoritative.       | Structured scope artifact with source-cited inclusions, exclusions, owners, volumetrics, and unresolved decisions. |
| AQ-03 | P0       | Required artifacts are missing or only drafts.            | All gate-defining artifacts registered, generated, scored, reviewed, and accepted or explicitly blocked.           |
| AQ-04 | P1       | Artifact ledger is not prominent enough in approval flow. | Approval screen surfaces artifact blockers before a user can approve.                                              |
| AQ-05 | P1       | Export quality not fully audited.                         | Open and inspect DOCX/PDF/HTML/XLSX outputs for each required artifact.                                            |

### INS - Analytics and Insights

| ID     | Severity | Finding                                                            | Required outcome                                                                                                                             |
| ------ | -------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| INS-01 | P0       | Rich vendor proposals are not parsed into durable dossiers.        | Vendor/version proposal dossiers with claims, exceptions, solutions, AI accelerators, staffing, SLAs, pricing assumptions, risks, citations. |
| INS-02 | P0       | Pricing insight is not yet best-in-class.                          | TCO normalization, assumptions log, pricing trap log, scenario/sensitivity tables, and deterministic citations.                              |
| INS-03 | P0       | Evaluation insight cannot be strong without proposal dossiers.     | Evidence-backed scorecard with AI suggestions, human final scores, override reasons, and citations.                                          |
| INS-04 | P1       | RFP intelligence does not yet close the loop into artifact repair. | Exposed value levers automatically become RFP revision tasks.                                                                                |
| INS-05 | P1       | Value proof is not certified.                                      | Finance-confirmed, periodized value proof with target/estimate/actual separation.                                                            |

### WF - Workflow and UX

| ID    | Severity | Finding                                                        | Required outcome                                                                                                |
| ----- | -------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| WF-01 | P0       | Some uploads do not visibly become readiness.                  | Same-session parse/readiness update and reload readback for every upload row.                                   |
| WF-02 | P0       | Executive Decision and Selection completion were not proven.   | Persisted action/readback/approval proof with authorized persona.                                               |
| WF-03 | P1       | Stage screens still feel like task trackers.                   | Compact stage shell, one active step, row-based evidence table, clear primary action, and no oversized headers. |
| WF-04 | P1       | Current blocker is not always obvious.                         | One primary current-stage blocker, with artifact hygiene in secondary drawer.                                   |
| WF-05 | P1       | Files, Intelligence, Guidebook, and Approval are disconnected. | Shared stage state and clear "what changed" after every upload or approval.                                     |

### DATA - Parsing and Persistence

| ID      | Severity | Finding                                                         | Required outcome                                                                                        |
| ------- | -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| DATA-01 | P0       | Proposal parsing is first-mile only.                            | Persist typed proposal objects with citations and validation state.                                     |
| DATA-02 | P0       | Transition readiness upload did not satisfy stage requirement.  | Transition parser maps workstreams, owners, dates, risks, and exit criteria to governed readiness rows. |
| DATA-03 | P1       | Later-stage templates lack complete evidence mappings.          | Every uploadable task has a template, parser, requirement ID, and readback state.                       |
| DATA-04 | P1       | Human updates may not feed generated artifact context reliably. | Persist meeting notes, overrides, accepted edits, and include them in prompt context manifests.         |

### AVA - aVa and AI Interaction

| ID     | Severity | Finding                                                               | Required outcome                                                                                              |
| ------ | -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| AVA-01 | P0       | New Event aVa has not passed hard sourcing QA.                        | 25-question test with stage context, citations, tables, chart-ready outputs, latency, and no invented values. |
| AVA-02 | P0       | aVa must explain artifacts and evidence, not generic sourcing advice. | Answers cite current event objects, uploaded files, artifact ledger rows, and accepted decisions.             |
| AVA-03 | P1       | Chart/visual output must be deterministic.                            | Structured chart payloads grounded in read models, not freeform hallucinated charts.                          |
| AVA-04 | P1       | aVa must handle unknowns correctly.                                   | Missing evidence returns unknown/not computed/workflow required, never zero unless finance-confirmed.         |

## Acceptance Standard Going Forward

No stage, artifact, insight surface, or aVa answer should be marked QA-passed unless all five proof types exist:

1. Signed-in browser proof on the real route.
2. Console and network evidence.
3. Database/read-model readback showing persistence.
4. Artifact/content review against the ideal output.
5. Evidence/citation review proving numbers and claims trace to governed inputs.

Anything short of that is either `prototype`, `partial`, `blocked`, or `needs review`.

## Immediate Priority Change

The next execution plan should not treat the small P0 blocker list as the whole backlog. It should run in this order:

1. Fix mechanical P0 blockers so the journey can complete.
2. Fix artifact-quality gating for RFP, Scope, Executive Decision, Pricing, BAFO, Transition, and Value.
3. Implement rich vendor response dossier parsing because it unlocks Evaluation, Pricing, BAFO, Executive Decision, and aVa.
4. Replace card/task clutter with the compact row-based evidence workflow.
5. Run the 25-question New Event aVa test.
6. Re-run the full 11-stage journey and score every artifact again.

The product is promising. But the artifact and analytics audit is not small; it is a full quality program.
