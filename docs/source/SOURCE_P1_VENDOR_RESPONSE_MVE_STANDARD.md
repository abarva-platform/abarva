# Source P1 Vendor Response Minimum Viable Extraction Standard

**Status:** P1 product doctrine  
**Date:** 2026-07-01  
**Applies to:** Source vendor response simulation, proposal intelligence,
pricing comparison, scorecard, BAFO, and executive decision support

## Product Principle

Source is not a generic document browsing or document Q&A system.

Vendor responses may be 50-150 pages with narrative, appendices, pricing
workbooks, SLA exhibits, staffing models, transition plans, assumptions logs,
exceptions, and legal markups. Source should not try to understand every word.
It should reliably extract the minimum sourcing-critical information required
to compare vendors, challenge unsupported claims, normalize pricing, identify
risk, and create negotiation leverage.

The intended flow is:

```text
long vendor response package
  -> section map
  -> minimum viable sourcing record
  -> cross-checks against exhibits
  -> challenge log
  -> BAFO asks
  -> executive decision support
```

## Response Control Pack

The RFP response instructions must allow detailed narrative, but they must make
structured exhibits mandatory.

### Required Narrative Sections

Each vendor must answer the RFP in order:

| RFP section | Vendor narrative response required |
|---:|---|
| 1 | Executive summary |
| 2 | Scope understanding |
| 3 | Service delivery model |
| 4 | Application support model |
| 5 | Airline operations support |
| 6 | Corporate shared services support |
| 7 | Transition plan |
| 8 | Staffing model |
| 9 | SLA commitments |
| 10 | Automation / productivity |
| 11 | Governance |
| 12 | Security / compliance |
| 13 | Pricing |
| 14 | Assumptions / exclusions |
| 15 | Exceptions |

### Required Structured Exhibits

Narrative may supplement the response, but these exhibits control the
evaluation record:

| Exhibit | Purpose |
|---|---|
| Vendor Claim Register | Records major vendor claims, evidence, owner, and evaluation status |
| Automation/Productivity Commitment Table | Captures baseline, impact, timeline, measurement method, and commercial credit |
| Pricing Workbook | Normalizes run cost, transition cost, one-time cost, optional cost, and 5-year TCO |
| Staffing and Location Model | Captures role mix, location mix, FTEs, coverage model, and retained dependencies |
| SLA Commitment Table | Captures targets, credits, caps, exclusions, and reporting obligations |
| Assumptions and Exclusions Log | Captures buyer dependencies, excluded scope, and change-order exposure |
| Transition Milestone Plan | Captures mobilization, knowledge transfer, cutover, stabilization, and exit criteria |
| Commercial Exceptions Table | Captures pricing, legal, RFP, SLA, and contracting deviations |
| Evidence Attachment Index | Maps claims and exhibits to supporting files, pages, sections, or workbook tabs |

## Required RFP Language

Vendor responses may include detailed narrative by section, but the required
structured exhibits are mandatory and control the evaluation record. Narrative
responses may supplement, but may not replace, the required pricing workbook,
claim register, SLA table, staffing model, transition plan, assumptions and
exclusions log, and exceptions table.

If a claim appears in the narrative but is not included in the Vendor Claim
Register or supported by the required exhibit, the buyer may treat it as
unsupported for evaluation and BAFO purposes.

## Minimum Viable Extraction Areas

For each vendor response package, Source must extract only the sourcing-critical
fields needed for evaluation, pricing, BAFO, and decision support.

| Area | Minimum extraction target |
|---:|---|
| 1 | Response completeness by required RFP section |
| 2 | Major vendor claims |
| 3 | Evidence supporting each claim |
| 4 | Pricing summary: run cost, transition cost, one-time cost, optional cost, 5-year TCO |
| 5 | Productivity and automation commitments, including whether they are priced back |
| 6 | Staffing and location model |
| 7 | SLA targets, credits, caps, exclusions, and reporting |
| 8 | Assumptions and exclusions that create buyer risk |
| 9 | Commercial, legal, and RFP exceptions |
| 10 | Transition plan, KT obligations, dependencies, exit criteria, and milestone linkage |

## Vendor Response Profile

Every vendor package should reduce to one normalized profile:

| Field | Requirement |
|---|---|
| Vendor name | Synthetic/vendor display name, version, and package date |
| Response completeness | Complete / partial / missing by RFP section |
| Total 5-year TCO | Submitted and normalized when enough pricing exists |
| Year 1 run cost | Normalized run-rate view |
| Transition cost | One-time and milestone-linked transition cost |
| Productivity commitment | Claimed percentage, baseline, year, and measurement method |
| SLA commitment | Key service levels, credits, caps, exclusions |
| Staffing model summary | FTEs, location mix, coverage, retained dependency |
| Major assumptions | Assumptions shifting effort, risk, or cost to buyer |
| Major exclusions | Excluded services, apps, tools, or operating conditions |
| Commercial exceptions | Pricing, legal, SLA, RFP, and contract deviations |
| Unsupported claims | Claims not backed by exhibits or evidence |
| Clarification questions | Questions required before scoring or BAFO |
| Negotiation levers | Commercial asks, proof requests, and walk-away triggers |
| Ready for evaluation | Yes / no / conditional, with reason |

## Extraction Card Standard

Each extraction must preserve source evidence, confidence, and missing fields.

| Field | Example |
|---|---|
| Card type | Productivity claim |
| Vendor | Vendor A |
| Claim | 22% automation productivity by Year 2 |
| Evidence found | Narrative section 10.2 |
| Structured exhibit present | Partial |
| Pricing impact found | No |
| Measurement method | Missing |
| Confidence | Medium |
| Finding | Productivity claim is not commercially backed |
| Action | Clarify before scoring and require BAFO pricing credit |

## Cross-Checks

Source P1 must cross-check narrative claims against structured exhibits.

| Check | Finding to produce |
|---|---|
| Narrative productivity claim but no pricing credit | Unsupported commercial commitment |
| Narrative SLA strength but weak credit economics | SLA is operationally strong but financially weak |
| Transition plan describes milestones but no payment linkage | Transition fee should be milestone-based |
| Staffing says 24x7 coverage but no location/FTE support | Coverage claim needs staffing proof |
| Assumptions shift retained work to buyer | Buyer effort and hidden cost exposure |
| Exceptions contradict RFP must-have | Gate issue or BAFO condition |
| Pricing workbook omits optional or pass-through cost | Non-comparable pricing |
| Claim register omits a narrative claim | Claim excluded from evaluation until registered |

## Source P1 Outputs

Minimum viable extraction feeds the next Source artifacts:

1. Response completeness review.
2. Vendor claim register review.
3. Vendor challenge and clarification log.
4. Pricing comparison and normalization workbook.
5. Commercial trap log.
6. BAFO ask sheet.
7. Evaluation scorecard.
8. Executive decision brief.

## aVa Source Advisor Behavior

aVa should answer vendor-response questions with sourcing judgment, not generic
document summaries.

Representative questions:

1. Which vendor response is least complete?
2. Which vendor made unsupported automation claims?
3. Which vendor has the strongest SLA commitment?
4. Which vendor has pricing that is not comparable?
5. What should we ask in BAFO?
6. What should the CIO be worried about?
7. What should the CFO be worried about?
8. Which vendor should not advance without clarification?
9. What evidence is still missing?
10. What is the executive decision tradeoff?

Expected response pattern:

1. Direct sourcing answer.
2. Evidence-backed comparison.
3. Unsupported claims or missing fields.
4. Negotiation or BAFO action.
5. Decision boundary: ready / conditional / not ready.

## Do Not Build

Do not build generic proposal Q&A. Do not parse arbitrary contracts as the main
Source path. Do not ask Claude to summarize 100 pages. Do not treat narrative
as a substitute for structured exhibits. Do not let Source invent vendor facts.

## Definition of Done for P1 Slice 1

P1 Slice 1 is complete when:

1. P0 baseline remains green.
2. Three realistic synthetic vendor response packages exist or are loaded.
3. Each package includes sectioned narrative plus mandatory structured exhibits.
4. The seeded packages include realistic inconsistencies and negotiation issues.
5. Source produces response completeness results.
6. Source identifies at least five meaningful vendor or commercial issues.
7. Source produces BAFO-ready asks or a leverage log.
8. aVa answers the vendor-response question bank without inventing facts.
9. Findings become backlog items with type, severity, stage, and recommended fix.

