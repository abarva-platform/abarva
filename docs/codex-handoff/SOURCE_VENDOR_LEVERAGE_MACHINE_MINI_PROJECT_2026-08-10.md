# Source Vendor Leverage Machine Mini Project

**Date:** 2026-08-10  
**Status:** Execution tracker  
**Lane:** Source workflow and intelligence product design  
**Scope boundary:** Plan and feature backlog only. Do not mutate workflow persistence, live data-plane state, or production runtime from this tracker.

## Product Thesis

Source is not an artifact cabinet. Source must be a vendor leverage machine.

Every stage should answer one executive question:

> What leverage does this step create, preserve, prove, or convert into commercial lift?

The target outcome is not just a cleaner workflow. The target outcome is that a client can say:

> Without AbarVa, we would have missed the leverage that improved our vendor outcome.

That leverage can appear as lower run cost, stronger SLA remedies, milestone-based transition fees, reduced hidden retained work, better productivity credits, improved pricing comparability, stronger contract protections, or a defensible no-go decision before the buyer loses negotiating position.

## Success Criteria

This mini project is successful when Source can show, for each stage:

1. **Simple process:** the user knows exactly what to do next.
2. **Governed flow:** the stage cannot quietly advance with unresolved decision risk.
3. **Automated first pass:** AbarVa produces a useful first read, score, gap list, or leverage recommendation.
4. **Human control:** the buyer can accept, edit, override, or reject the recommendation with rationale.
5. **Vendor pressure:** the output creates a concrete vendor ask, clarification, score impact, approval condition, or negotiation lever.
6. **Evidence transparency:** every claim is cited, missing, or explicitly not usable.
7. **Commercial lift path:** the stage preserves or converts leverage into measurable value.

## Operating Rule

Do not ship stage UX that only says "upload a file" or "generate an artifact." Each stage needs:

- current step;
- required inputs;
- optional inputs;
- what AbarVa learned;
- what is missing;
- what decision is unlocked;
- what vendor leverage is created;
- what cannot be claimed yet.

## Stage Feature Gap Map

|                 Stage | Strategic job                                             | Current product risk                                                                           | Feature gap to fill                                                                                                                          | Leverage output                                                                                      |
| --------------------: | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
|           01 Strategy | Define why the market event creates leverage.             | Strategy can read like a memo rather than a leverage thesis.                                   | Leverage thesis builder: incumbent weakness, market tension, switching credibility, value levers, walk-away posture.                         | "Where is the 20 percent hiding?" map with evidence and confidence.                                  |
|              02 Scope | Prevent ambiguity vendors can price against the buyer.    | Scope completion can look done even if vendors will find ambiguity.                            | Scope ambiguity detector: vague service boundaries, retained-vs-vendor gaps, change-order traps, missing volume drivers.                     | Scope risk list and vendor-proof boundary language.                                                  |
|                03 RFP | Force comparable and commercially useful responses.       | RFP package can be issued without response controls strong enough to squeeze vendors later.    | Response-control engine: mandatory exhibits, clause-to-lever map, no narrative-only claims, pricing workbook lock.                           | Vendor response rules that preserve pricing, SLA, productivity, and exception leverage.              |
|          04 Responses | Convert long proposals into comparable decision evidence. | Uploaded proposal files can remain "files" instead of scoring-ready intelligence.              | Proposal intelligence: vendor-isolated parsing, response profile, claim/evidence matching, exceptions, unsupported promises, clarifications. | Proposal health score, clarification asks, non-comparable answer list, hidden risk and leverage map. |
|         05 Evaluation | Score proposals quickly but defensibly.                   | Human scoring can stay manual and subjective; AI may not be integrated as governed first pass. | AI first-pass scoring: criteria-weighted score, cited rationale, confidence, evaluator override and lock.                                    | Faster scorecard with transparent disagreements and score-impact evidence.                           |
|            06 Pricing | Normalize money and expose hidden cost.                   | Pricing can be present but not fully comparable or connected to response claims.               | Commercial normalization cockpit: TCO, run cost, one-time cost, pass-throughs, transition fees, retained buyer effort, risk-adjusted view.   | Should-cost variance, hidden-cost traps, vendor-specific pricing clarification list.                 |
|               07 BAFO | Turn gaps into vendor pressure.                           | BAFO can become generic "sharpen your pencil" language.                                        | BAFO leverage engine: top asks by vendor, value range when evidenced, fallback, walk-away, concession tracker.                               | Vendor-specific ask sheet tied to scoring, pricing, exceptions, and evidence gaps.                   |
| 08 Executive Decision | Make tradeoffs explicit before approval.                  | Decision may summarize rather than pressure-test the choice.                                   | Decision cockpit: cheapest vs safest vs highest-leverage option, residual risks, unresolved concessions, conditions.                         | Executive-ready recommendation with tradeoffs and approval conditions.                               |
|          09 Selection | Protect the award and preserve concessions.               | Award may lose conditions between decision and contract.                                       | Award-condition tracker: accepted BAFO terms, unresolved exceptions, contract insertion checklist, sign-off route.                           | Negotiated concessions preserved into selection and contracting.                                     |
|         10 Transition | Prevent value leakage after award.                        | Transition plan can be task-oriented but not tied to vendor obligations and payment leverage.  | Transition obligation tracker: milestone payments, KT proof, retained dependency, exit criteria, issue escalation.                           | Payment and governance leverage during mobilization.                                                 |
|              11 Value | Prove the lift and hold vendor accountable.               | Value stage can become a retrospective without enforceable lineage.                            | Value realization ledger: promised vs contracted vs delivered, leakage, vendor accountability, renewal implications.                         | Proof of realized lift, leakage actions, and next negotiation posture.                               |

## Work Packages

### WP1 · Leverage Thesis and Stage Contract

**Goal:** make every stage ask and answer "what leverage are we preserving or creating?"

Deliverables:

- Stage contract schema for strategic job, inputs, automated first pass, human decision, leverage output, evidence boundary.
- UX copy standard for current step, missing inputs, next unlock, and vendor pressure.
- Stage-gate language that distinguishes input-complete, analysis-ready, approval-ready, and commercially-ready.

Acceptance criteria:

- All 11 stages have a stage contract.
- Each contract names the concrete vendor leverage output.
- No stage contract uses artifact completion as the only exit criterion.

### WP2 · Vendor Response Package Intake

**Goal:** represent each supplier response as a package, not loose files.

Deliverables:

- Vendor response package model: event, vendor, version, receipt timestamp, file roles, submitted-by channel, parser status, completeness status.
- Upload UX: one row per vendor, file roles for narrative response, pricing workbook, SLA table, staffing model, transition plan, assumptions/exclusions, exceptions, evidence index.
- Status UX: received, missing required file, parser-ready, parsed, failed, needs human classification, ready for proposal intelligence.

Acceptance criteria:

- A sourcing lead can see how many vendors responded and which required components are missing.
- One 75-150 page response package can be registered without implying it is analysis-ready.
- Parser state and scoring-readiness state are visibly separate.

### WP3 · Proposal Intelligence Extraction

**Goal:** turn long vendor proposals into a normalized response profile.

Deliverables:

- Vendor-isolated parse bundle per event/vendor/version.
- Section map by RFP section.
- Minimum viable sourcing record:
  - response completeness;
  - major claims;
  - evidence support;
  - pricing summary;
  - productivity and automation commitments;
  - staffing and location;
  - SLA targets, credits, caps, exclusions;
  - assumptions and exclusions;
  - commercial/legal/RFP exceptions;
  - transition plan and milestone linkage.
- Extraction cards with source reference, confidence, finding, and recommended action.

Acceptance criteria:

- Source can answer "which vendor dodged the most important questions?"
- Source can answer "which claims are unsupported?"
- Source can answer "which proposals are not comparable yet?"
- Source never converts narrative claims into commitments unless structured evidence supports them.

### WP4 · Evaluation First-Pass Scoring

**Goal:** produce a governed scoring first draft while keeping humans accountable.

Deliverables:

- Criteria-weighted AI suggested score by vendor and criterion.
- Evidence citation and confidence for each suggested score.
- Evaluator score, evaluator comment, override reason, lock state.
- Consensus view and disagreement list.

Acceptance criteria:

- AI score is never final.
- Every evaluator override records a reason.
- Scorecard can exclude incomplete/non-comparable response areas.
- Executive view shows where scoring depends on unresolved clarification.

### WP5 · Pricing, Trap, and BAFO Leverage Chain

**Goal:** convert proposal gaps into vendor-specific negotiation pressure.

Deliverables:

- Pricing normalization cockpit.
- Commercial trap log linked to vendor response profile.
- BAFO ask generator:
  - vendor;
  - current proposal issue;
  - ask;
  - rationale;
  - estimated value when evidenced;
  - opportunity-to-test when not evidenced;
  - fallback;
  - walk-away trigger;
  - owner;
  - status.
- Concession tracker comparing initial response, BAFO response, and final accepted term.

Acceptance criteria:

- BAFO output is vendor-specific, not generic.
- Each ask ties to a response gap, price trap, score weakness, exception, or unsupported claim.
- Value ranges are shown only when evidence supports them.
- The product can show how negotiation converted into commercial lift.

### WP6 · Executive Decision and Value Lineage

**Goal:** prove why the recommended vendor is the right tradeoff and whether value was realized.

Deliverables:

- Executive decision cockpit: cheapest, safest, highest-leverage, recommended, conditional/no-go.
- Approval conditions and unresolved risks.
- Selection concession preservation checklist.
- Value ledger: baseline, negotiated promise, contract term, measured actual, leakage, accountable owner.

Acceptance criteria:

- Decision explicitly states what is known, unknown, and conditional.
- Selection cannot hide unresolved BAFO concessions.
- Value stage traces realized lift back to the original leverage ask.

## First Sprint Recommendation

Build **WP2 + WP3 thin vertical slice** first.

Reason: vendor response package intake and proposal intelligence unlock Responses, Evaluation, Pricing, BAFO, Executive Decision, and Value. Without this, the workflow can be clean but not strategically powerful.

### Sprint Slice A · Response Package Cockpit

User story:

> As a sourcing lead, I need to see each vendor response package, required components, parse/readiness status, and missing items so I know whether evaluation can begin.

Scope:

- Add a Responses-stage cockpit view.
- Use existing artifact registry where possible.
- Do not create data-plane migrations unless explicitly approved.
- If durable persistence is not available in this slice, implement read-only/demo-state projection with honest caveats.

Acceptance:

- Shows vendors as rows.
- Shows required package components as columns.
- Shows missing/received/parsed/failed/needs review.
- Shows "Ready for proposal intelligence" only when all required components are present or an approved exception exists.
- Links missing items to next action.

### Sprint Slice B · Proposal Health First Pass

User story:

> As a sourcing lead, I need AbarVa to identify which proposals are incomplete, non-comparable, risky, or commercially weak before evaluators spend time scoring them.

Scope:

- Build proposal health profile from available parsed evidence and seeded/fixture response coverage facts.
- Include hard caveat when long-form proposal parsing is not yet available.
- Produce vendor-level health score and gap list.

Acceptance:

- Shows per-vendor completeness.
- Shows unsupported claims.
- Shows non-comparable answers.
- Shows clarification questions.
- Shows "do not score yet" when required evidence is missing.

### Sprint Slice C · BAFO Lever Preview

User story:

> As a procurement leader, I need the top vendor-specific asks that could improve commercial outcome before BAFO.

Scope:

- Generate Top 5 asks from response gaps, pricing traps, and unsupported claims.
- Mark value as evidenced range, directional opportunity, or no value claim.

Acceptance:

- No generic "reduce price" ask.
- Every ask has vendor, issue, ask, rationale, evidence basis, confidence, and fallback.
- At least one ask can be traced to scoring or pricing impact.

## Execution Tracker

| Item                                      | Status      | Owner lane                     | Demo impact | Notes                                                 |
| ----------------------------------------- | ----------- | ------------------------------ | ----------: | ----------------------------------------------------- |
| Stage leverage contract for all 11 stages | Not started | Product/UX                     |        High | Turns workflow from checklist to leverage path.       |
| Response package cockpit                  | Not started | Source UI                      |   Very high | First visible fix for "what did vendors submit?"      |
| Vendor response package model             | Not started | Source substrate               |   Very high | Needs persistence design gate before data-plane work. |
| Proposal health profile                   | Not started | Source intelligence            |   Very high | First pass scoring prep.                              |
| Vendor-isolated extraction bundle         | Not started | Source intelligence/governance |   Very high | Required for defensible proposal parsing.             |
| Evaluation first-pass scoring             | Not started | Source evaluation              |        High | AI suggests; human decides.                           |
| Pricing trap to BAFO ask chain            | Not started | Source commercial              |   Very high | The money feature.                                    |
| Concession/value lineage                  | Not started | Source value                   |        High | Proves the lift was captured.                         |

## QA and Smoke Requirements

Before any deployable slice:

- Unit tests for readiness states and no-fabrication rules.
- Fixture tests for missing package components.
- Fixture tests for unsupported narrative claims.
- Browser smoke of Responses stage, Files tab, Intelligence tab, and Approvals.
- Regression proof that existing 11-stage journey still renders.

After deployment:

- Signed-in production Source event proof.
- Screenshot of response package cockpit.
- Screenshot of proposal health profile.
- Screenshot of BAFO lever preview.
- Console/network check for page errors.
- Explicit pass/fail: can a CXO understand what leverage AbarVa found?

## Agent Prompt for First Implementation Lane

Use this prompt for the next build lane:

> Build Source Responses Stage Slice A/B: response package cockpit and proposal health first pass. Do not mutate live data-plane or workflow persistence without explicit approval. Reuse existing artifact registry and response coverage facts where possible. The UI must show one row per vendor, required response package components, parser/readiness status, missing items, proposal health, unsupported claims, clarification questions, and whether evaluation can begin. Keep AbarVa design system. Run focused tests, local/browser smoke, and document any missing durable persistence as a blocker rather than faking readiness.

## Decision Gates

Human approval required before:

- adding or changing production persistence tables;
- backfilling live client data;
- using model extraction on real client proposals;
- promoting parsed proposal content into enterprise context;
- claiming quantified savings or 20 percent lift without evidence;
- exposing vendor-isolated intelligence across vendors before isolation proof exists.
