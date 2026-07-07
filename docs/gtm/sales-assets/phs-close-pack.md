# PHS Close Pack

Status: draft for founder review

Owner: AbarVa founder/operator

Backlog rows: T252, T255, T256, T257, T262, T264, T285, T288, T290

Source assets:

- `docs/gtm/account-research/phs-evidence-caveat.md`
- `docs/gtm/sales-assets/pilot-candidate-command-center.md`

## Use Rule

This pack is internal preparation only until Anand confirms whether PHS is a real public entity, confidential client, or synthetic placeholder. Do not send numeric claims, payer-mix claims, AMS/partner claims, or "no AI strategy" claims without public or client-supplied evidence.

## Evidence Caveat

The workbook gives a useful hypothesis: a healthcare CDAO buyer, board pressure for AI strategy, Azure + Databricks modernization, AMS/sourcing context, and healthcare value levers. The current public evidence does not validate those PHS-specific facts. Therefore:

- use placeholders for actuals,
- mark all value math as scenario math,
- keep the deck and memo in founder-review mode,
- and require discovery before any client-facing version.

## CXO Justification Memo Draft

Audience: PHS CDAO, written in their voice.

### Memo

I need a credible way to move from AI pressure to an executable AI strategy without spending the next six months in workshops.

The board is asking what our AI strategy is. The honest answer is that the strategy cannot be a list of tools or experiments. It needs to connect our data-platform investments, our operational priorities, our sourcing/AMS decisions, and our clinical/financial value levers into a governed execution path.

AbarVa gives us a way to do that in 90 days. The pilot would not ask us to hand over broad data or accept autonomous AI decisions. It would start with a tightly scoped, human-approved decision-support layer:

- identify 3 healthcare Moves with quantified value hypotheses,
- create evidence packets for each consequential decision,
- document assumptions and missing data,
- attach named human owners,
- and produce a board-ready 12-month roadmap.

The initial value areas to validate are revenue-cycle leakage, length-of-stay, supply chain / purchased services, workforce pressure, prior authorization friction, and care coordination. We should not treat any value number as proven until our actuals are loaded or supplied; the pilot should be measured on whether AbarVa helps us turn those hypotheses into a governed value pipeline.

The strongest reason to move now is that our modernization work becomes more valuable when we know what programs it should serve. AbarVa is not trying to replace Azure, Databricks, our AMS partner, our BI tools, or our internal teams. It is the execution and decision layer above them.

Recommended path: approve a bounded 90-day pilot with human decision gates, Source as an optional sourcing/AMS add-on, and clear day-30/day-60/day-90 success criteria.

## 8-12 Slide Pitch Deck Outline

| Slide | Title | Core message | Evidence needed before client use |
| --- | --- | --- | --- |
| 1 | From AI pressure to governed execution | PHS needs proof, not generic AI theater. | Buyer confirms AI strategy pressure. |
| 2 | Why the data platform is necessary but not sufficient | Platforms do not decide which programs to run or how value is governed. | Confirm Azure/Databricks/modernization context. |
| 3 | AbarVa's role | AbarVa is the decision-support and execution layer above platform, BI, and sourcing work. | Confirm buyer accepts layer-above framing. |
| 4 | Candidate value levers | Denials, LOS, supply chain, workforce, prior auth, care coordination. | Client actuals or approved synthetic assumptions. |
| 5 | What the pilot does in 90 days | 3 Moves, evidence ledger, human approvals, board-ready roadmap. | Confirm scope and named users. |
| 6 | Source add-on for AMS/sourcing | One sourcing/AMS decision receives evidence-backed decision support. | Identify sourcing colleague and wave details. |
| 7 | Governance and responsible AI | No autonomous decisions; missing-data banners; human owner; cited evidence. | Confirm governance language. |
| 8 | Success criteria | Day-30 strategy path, day-60 Moves, day-90 board packet and value pipeline. | Founder/client approval. |
| 9 | Commercial frame | 90-day fixed pilot plus optional Source add-on. | Legal/founder review. |
| 10 | Decision ask | Approve discovery-to-pilot sprint or identify blocker. | Decision-maker chain. |

## Business Case Worksheet

Use this only after actuals are supplied or Anand confirms synthetic assumptions.

| Lever | Required actuals | Scenario formula | Notes |
| --- | --- | --- | --- |
| Denials / revenue-cycle leakage | Net patient revenue, denial rate, appeal recovery, avoidable denial estimate. | Revenue x avoidable-denial-rate x recoverable-share. | Do not use workbook `$4B` scenario externally until sourced. |
| Length of stay | Discharges, average LOS, variable cost per day, avoidable-day estimate. | Discharges x avoidable-day-reduction x variable-cost-per-day. | Validate by service line. |
| Supply chain / purchased services | Addressable spend, category concentration, contract leakage, savings range. | Addressable-spend x savings-rate. | Connect to Source add-on. |
| Workforce / agency labor | Agency spend, overtime spend, vacancy rate, scheduling leakage. | Addressable-labor-spend x efficiency-rate. | Keep clinical safety out of scope unless approved. |
| Prior authorization | Volume, turnaround time, denial/appeal rate, labor cost. | Volume x minutes-saved x loaded-rate plus leakage avoided. | Needs workflow evidence. |
| Care coordination / readmission | Readmissions, penalty exposure, preventable share, intervention capacity. | Preventable-readmission-count x cost/penalty avoided. | Requires clinical governance. |

## Joint CDAO + IT Sourcing Pitch

Frame:

> This pilot lets the CDAO answer the AI strategy question while giving the sourcing/IT colleague a concrete decision-support win on AMS or vendor work. One pilot, two executive wins, one CFO conversation.

Division of value:

| Buyer | What they get | Proof artifact |
| --- | --- | --- |
| CDAO | AI strategy, 3 Moves, roadmap, value pipeline. | Board-ready strategy packet. |
| IT sourcing leader | Vendor/sourcing decision support for one AMS or modernization wave. | Source decision packet with assumptions, evidence, and approval record. |
| CFO | Bounded pilot, value hypotheses, human accountability. | Executive value and risk summary. |

## PHS-Style Synthetic Data And Move Catalog Plan

This does not load data. It defines what to load after the approved data-load path exists.

Minimum data dimensions:

- revenue-cycle summary,
- service-line volumes,
- supply chain spend,
- workforce/agency labor,
- prior authorization workflow,
- sourcing/AMS contract metadata,
- governance/approval roles.

Candidate Moves:

| Move | Purpose | Data needed |
| --- | --- | --- |
| Denials Recovery Move | Identify denial drivers and approval workflow improvements. | Claims/denials summary, appeal outcomes, payer groups. |
| Discharge Flow Move | Surface LOS drivers and handoff bottlenecks. | Service-line discharges, LOS, discharge disposition. |
| Source AMS Decision Move | Evaluate sourcing/AMS decision quality and risk. | Vendor contracts, scope, renewal timing, performance signals. |

## Pilot SOW Draft

Working title: PHS AI Strategy And Governed Execution Pilot

Duration: 90 days.

Scope:

- configure a PHS-specific workspace using approved data or approved synthetic data,
- select 3 candidate Moves,
- create evidence packets and human decision gates,
- generate a 12-month AI strategy roadmap,
- deliver weekly executive packets,
- include optional Source add-on for one sourcing/AMS decision.

Success criteria:

- 3 Moves selected with evidence packets and named human owners,
- at least 2 Moves advanced to execution readiness by day 60,
- healthcare value pipeline documented with sourced actuals or clearly labeled synthetic assumptions,
- one board-ready AI strategy artifact by day 90,
- 100% consequential actions have human approval language and decision evidence,
- Source add-on produces one sourcing/AMS decision packet if included.

Out of scope until separately approved:

- live PHI/PII data loads,
- autonomous decisions,
- clinical recommendations,
- direct changes to client systems,
- legal, procurement, or contracting commitments.

## Legal / Procurement Pre-Handle Checklist

- Security one-pager ready.
- Architecture diagram ready.
- Data-processing disclaimer and attestation ready.
- Human decision accountability language included.
- No-PHI/PII or approved sensitive-data path confirmed.
- Insurance and SOC 2 status stated truthfully.
- SOW reviewed by founder and counsel before send.
- Procurement owner and legal owner named.
- Source add-on priced and scoped separately.

## Done Criteria

These rows can move to Done only when:

- T252: founder-approved PHS business case exists with assumptions labeled.
- T255: actuals or approved synthetic assumptions are attached to the ROI worksheet.
- T256: founder-approved CXO memo is ready for use.
- T257: founder-approved deck exists in final form.
- T262: sourcing colleague and wave details are identified from a real source or discovery.
- T264: joint CDAO + sourcing pitch is reviewed and ready.
- T285: data-load path and Move catalog are approved; no data load is implied by this doc.
- T288: SOW is reviewed by founder/counsel.
- T290: legal/procurement pre-handle packet is ready and owners are identified.
