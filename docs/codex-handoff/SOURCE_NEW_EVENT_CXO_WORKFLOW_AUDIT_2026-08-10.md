# Source New Event CXO Workflow Audit

Date: 2026-08-10  
Scope: Source New Event 11-stage journey, using completed AMS event evidence captured under `/Users/anand/Downloads/source-e2e-qa-20260810/` and the prior artifact/analytics audit as input.  
Stance: client CXO, sourcing leader, and product QA. This is not a click-path smoke test.

## Verdict

The New Event workflow has the right backbone, but it is not yet best-in-class. The journey can explain where the user is and what gate comes next, but the product still needs stronger artifact quality, evidence-to-fact transparency, proposal intelligence, pricing intelligence, and guidebook specificity before it should be considered client-ready for a CIO/CPO-led sourcing event.

The UX fix implemented in this lane addresses one major workflow gap: the active stage now presents one step list and one task canvas instead of stacked panels. That improves orientation. It does not, by itself, certify the quality of the sourcing artifacts or analytics.

## CXO Standard

Every stage must answer five questions without the user hunting:

1. What decision am I making now?
2. What evidence is required versus optional?
3. What changed because I uploaded or approved something?
4. What artifact or output is produced?
5. Why is the recommendation defensible versus generic sourcing advice?

## Stage-by-Stage Audit

| Stage              | CXO decision                                   | Workflow audit                                                                                     | Output quality gap                                                                                                                                  | Insight/guidebook gap                                                                                           | Required improvement                                                                                                                     |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Strategy           | Should this event run, and why now?            | Stronger than later stages; sponsor and event rationale are understandable.                        | Strategy memo must show decision ask, value range, decision owner, assumptions, and next-stage evidence request.                                    | Guidebook should tell the sponsor what workshop to run and what evidence Scope needs next.                      | Add a prompt manifest: trigger, archetype, value hypothesis, owner, unknowns, and evidence request.                                      |
| Scope              | What exactly is in and out?                    | Prior UI was busy; improved UI now makes active task clearer.                                      | Scope memo must be a source-cited boundary record, not prose.                                                                                       | Guidebook must name owners, systems, templates, and unresolved boundaries.                                      | Use structured inclusions, exclusions, retained/vendor split, volumetrics, SLA baseline, and unresolved decisions.                       |
| RFP                | Can this RFP protect the value levers?         | RFP has useful clause-coverage intelligence, but action path should feed directly into RFP repair. | RFP package is not supplier-ready until clause coverage, pricing template, legal terms, response rules, and review acceptance are complete.         | Guidebook must tell procurement exactly how to issue the RFP and control vendor responses.                      | Add RFP quality gate: no placeholder sections, clause-to-lever map, mandatory exhibits, pricing template, and legal/procurement review.  |
| Responses          | Did vendors respond completely and comparably? | Current workflow can upload a coverage checklist, but long proposal handling is too thin.          | Response control pack is weak without durable proposal dossiers.                                                                                    | Guidebook should teach vendors how to structure proposals and teach the buyer how to reject unsupported claims. | Parse full proposals into claims, exceptions, staffing, solution, AI accelerators, SLAs, transition, pricing assumptions, and citations. |
| Evaluation         | Which vendor is best, and why?                 | Stage can collect bid/score evidence, but scoring maturity depends on proposal parsing.            | Scorecard needs AI suggestion, human final score, override reason, lock state, and citation per criterion.                                          | Guidebook must run calibration and consensus, including how to handle unsupported claims.                       | Implement evidence-backed scorecard objects and consensus log.                                                                           |
| Pricing            | Are bids comparable, and where are the traps?  | Upload path exists; insight quality is not yet best-in-class.                                      | Pricing workbook must normalize TCO, assumptions, escalators, transition cost, pass-throughs, retained work, and optional scope.                    | Guidebook must explain how finance should normalize bids and what traps to inspect.                             | Build deterministic TCO normalization, assumptions log, scenario sensitivity, and pricing trap log.                                      |
| BAFO               | What final asks close the gaps?                | Workflow can represent BAFO as a stage, but final asks must be vendor-specific.                    | BAFO question pack must be generated from evaluation gaps, unsupported claims, exceptions, and pricing traps.                                       | Guidebook must explain negotiation posture, who attends, and what concessions count.                            | Generate vendor-specific BAFO asks and concession tracker from parsed evidence.                                                          |
| Executive Decision | What should leadership approve?                | Approval step exists, but executive decision quality is not certified.                             | Decision brief must show recommendation, alternatives, tradeoffs, value basis, risk acceptance, unresolved conditions, and approval ask.            | Guidebook must frame the executive meeting and decision options.                                                | Decision prompt must use accepted artifacts only and explicitly list missing/weak evidence.                                              |
| Selection          | What award record is final?                    | Selection must not be a generic award click; it must preserve the negotiated basis.                | Award record and contracting handoff must include selected vendor, conditions, pricing basis, obligations, open legal items, and notification plan. | Guidebook must tell procurement/legal what must be locked before handoff.                                       | Persist award baseline and handoff packet; distinguish selection approval from contract execution.                                       |
| Transition         | Can mobilization start safely?                 | Prior evidence showed upload/readiness mismatch risk.                                              | Transition plan must include workstreams, milestones, owners, dependencies, risks, obligations, and exit criteria.                                  | Guidebook must run mobilization workshop and readiness review.                                                  | Parser must map transition files into readiness rows and prove reload readback.                                                          |
| Value              | Was value actually realized?                   | Value surface exists, but proof standard is not certified.                                         | Value pack must separate target, negotiated, avoided, recoverable, and realized value.                                                              | Guidebook must tell finance/vendor management what actuals prove value.                                         | Require periodized finance actuals, SLA actuals, retained-cost actuals, and reviewer confirmation.                                       |

## Artifact Quality Benchmarks

| Artifact family          | Minimum client-ready bar                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Strategy memo            | Clear decision ask, why now, value at stake, owner, archetype/rigor, assumptions, unknowns, next evidence request.                |
| Scope memo               | In-scope, out-of-scope, retained/vendor split, source system, owner, volumetrics, SLA baseline, open decisions, citations.        |
| RFP package              | Requirements, response instructions, pricing workbook, terms appendix, clause-to-value map, evaluation rules, mandatory exhibits. |
| Vendor response dossier  | Proposal claims, exceptions, staffing, solution, AI/automation claims, SLAs, transition, pricing assumptions, citations.          |
| Scorecard                | Criteria, weights, AI suggestion, human score, rationale, override reason, evidence strength, lock state.                         |
| Pricing pack             | Normalized TCO, assumptions, pass-throughs, transition fees, escalators, retained costs, optional scope, scenario sensitivity.    |
| BAFO pack                | Vendor-specific asks, rationale, target concession, fallback, risk if unresolved, final concession tracker.                       |
| Executive decision brief | Recommendation, alternatives, tradeoffs, value basis, risks, conditions, final decision ask, citations.                           |
| Selection handoff        | Award record, conditions, negotiated baseline, legal items, obligations, vendor notices.                                          |
| Transition plan          | Mobilization workstreams, dates, owners, risks, dependencies, obligations, acceptance evidence.                                   |
| Value proof              | Baseline, actuals, realized value, variance, confidence, reviewer, evidence, period.                                              |

## Prompt/Generation Gaps

Every generated artifact prompt should include a context manifest with:

- Evidence used: uploaded files, parsed objects, rows/pages/sections, confidence, review state.
- Evidence excluded: failed parse, superseded, out-of-scope, low confidence, or not reviewed.
- Evidence missing: required evidence still blocking confidence.
- Human decisions: accepted scope, overrides, approvals, meeting notes, decisions, and conditions.
- Prior-stage commitments: approved scope, RFP clauses, evaluation criteria, pricing assumptions, BAFO concessions, award conditions.
- Quality blockers: placeholders, contradictions, unsupported values, weak citations, unreviewed drafts.

## Claude/aVa Hard QA Prompt

Use this prompt for the next aVa/source-generation quality sweep:

```text
You are acting as a CIO/CPO reviewing a completed AMS sourcing event. Audit the current Source event stage by stage. For each stage, inspect the workflow state, uploaded evidence, parsed facts, generated artifacts, guidebook, intelligence findings, approvals, and next-step instructions.

For each stage, answer:
1. What decision is the user making?
2. What required evidence is complete, missing, or weak?
3. What optional evidence would improve confidence?
4. What artifact is generated and is it client-ready?
5. Which facts or citations support the artifact?
6. What did the guidebook tell the user to do next, and is it specific enough?
7. What would a best-in-class sourcing advisor add?
8. What prompt/context/read-model gap caused any weakness?

Do not invent values. If evidence is missing, say unknown. Separate target, estimate, negotiated value, and realized value. Separate AI draft from client-final output. Return a ranked backlog with P0/P1/P2 severity and acceptance proof needed.
```

## Ranked Backlog

| Rank | ID       | Severity | Change                                                                                                       | Demo impact                                                   |
| ---: | -------- | -------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
|    1 | UX-01    | P0       | Clean primary workflow: journey rail, one stage step list, one active canvas, one Continue/Open gate button. | High: fixes orientation and clutter immediately.              |
|    2 | DATA-01  | P0       | Make every required upload row show uploaded, parsed, fact objects created, and artifact impact.             | High: user knows whether a file counted.                      |
|    3 | AQ-01    | P0       | Upgrade RFP package quality gate and prompt context manifest.                                                | High: RFP is the vendor-facing proof point.                   |
|    4 | INS-01   | P0       | Durable vendor proposal dossier parsing.                                                                     | High: unlocks Responses, Evaluation, Pricing, BAFO, Decision. |
|    5 | INS-02   | P0       | Deterministic pricing normalization and trap log.                                                            | High: best-in-class commercial value.                         |
|    6 | AQ-02    | P0       | Structured Scope memo with source-cited boundaries and unresolved items.                                     | Medium-high: prevents bad RFPs.                               |
|    7 | AVA-01   | P0       | 25-question hard aVa QA suite with citations/tables/unknown handling.                                        | High: proves intelligence, not workflow only.                 |
|    8 | GUIDE-01 | P1       | Stage-specific guidebooks for all 11 stages with meeting, invite, collect, templates, output.                | Medium-high: improves next-step clarity.                      |
|    9 | WF-02    | P1       | Approval screens distinguish current blocker from artifact hygiene.                                          | Medium: avoids user confusion at gates.                       |
|   10 | VALUE-01 | P1       | Periodized finance-confirmed value proof.                                                                    | Medium-high: closes the Source promise.                       |

## Acceptance Proof Needed

No stage should be called QA-passed until these five proofs exist:

1. Signed-in browser proof on the real route.
2. Console and network evidence.
3. Persistence/read-model readback.
4. Artifact quality review against the benchmark above.
5. Evidence/citation review proving claims trace to governed inputs.
