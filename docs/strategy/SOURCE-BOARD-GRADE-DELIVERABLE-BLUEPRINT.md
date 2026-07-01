<!-- markdownlint-disable MD013 MD060 -->

# Source Board-Grade Deliverable Blueprint

> Parent standard: `CXO-ARTIFACT-EXCELLENCE-FRAMEWORK.md`. This Source blueprint
> specializes the cross-module CXO artifact bar for IT sourcing deliverables.

**Date:** 2026-05-20  
**Status:** v1 alignment blueprint - deliverable content standard before renderer
uplift.  
**Pairs with:** `SOURCE-SOURCING-METHODOLOGY.md`,
`SOURCE-CATEGORY-TAXONOMY.md`,
`docs/abarva-source/SOURCE_SOURCING_EXPERIENCE_DESIGN_BLUEPRINT.md`,
`src/lib/source/exports/types.ts`, and `src/lib/source/exports/deal-pack/`.

## 1. Purpose

Source now has a broad artifact engine: sourcing strategy, demand challenge,
market scan, scope, RFP, response checklist, scorecard, pricing, BAFO, risk,
AI clauses, renewal decision, and a deal pack. That breadth is not enough.

The next maturity layer is to define **what good looks like** for each Source
deliverable, from the viewpoint of a senior IT sourcing partner, a CIO, a CFO,
legal/risk, and the business sponsor. A deliverable is not good because it is
filled out. It is good when it helps the buyer make a better sourcing decision,
challenge a vendor, protect leverage, reduce risk, or avoid unnecessary spend.

This document defines the required table of contents, mandatory evidence,
recommended exhibits, hard-fail omissions, and quality bar for every current
Source deliverable.

## 2. The Board-Grade Standard

Every Source deliverable must answer five questions.

1. **What sourcing decision does this support?**
2. **What evidence, benchmark or tenant fact supports the recommendation?**
3. **What trap, risk or leverage point would an expert sourcing advisor catch?**
4. **What should the team do next, and who owns it?**
5. **What must not be released, approved or negotiated until fixed?**

If a deliverable only summarizes content, it is not Source-grade. Source should
behave like an expert IT sourcing advisor: it challenges demand, sizes hidden
cost, exposes vendor traps, protects negotiation leverage, and keeps the event
gate-governed.

## 3. Consulting Exhibit Anatomy

Every board-facing Source page or section should use this structure.

| Element | Requirement |
|---|---|
| Takeaway title | A point-of-view sentence, not a label. Example: "Do not release the RFP until ticket history and transition-cost evidence are loaded." |
| Decision role | Demand challenge, release gate, vendor shortlist, pricing normalization, BAFO posture, selection, renewal, or risk approval. |
| Exhibit body | One dominant table, matrix, chart or memo block. Dense sourcing work should be table-forward. |
| Evidence strip | Contract, spend, usage, telemetry, vendor response, benchmark, owner, date, confidence. |
| Expert challenge | The trap, leverage point, or "do not proceed" condition the artifact exposes. |
| Action and owner | Next action, owner, due date, stage gate impact. |

Hard rules:

- No vendor-facing artifact can be release-ready if the scope, pricing template
  or scorecard is still "needs inputs" without a named waiver.
- No sourcing recommendation can ignore existing contracts, spend, usage or
  overlapping tools when those are available.
- No price comparison can compare vendor totals without normalizing scope,
  assumptions, transition, run and risk reserve.
- No AI/vendor risk artifact can omit model-training rights, data use,
  sub-processors, output ownership, audit rights and exit/portability when AI
  is in scope.
- No renewal recommendation can ignore auto-renewal notice, utilization,
  overlap, uplift, termination rights or leverage window.

## 4. Source Deliverable System

The current export pipeline exposes 18 formal Source deliverable kinds and one
master Deal Pack. They map to the sourcing lifecycle this way:

| Lifecycle stage | Deliverables |
|---|---|
| Stage 0 - Demand Challenge | Demand Challenge |
| Stage 1 - Sourcing Strategy | Sourcing Approach, Scope Memo precursor content |
| Stage 2 - Market Intelligence | Market Scan |
| Stage 3 - Scope / RFP | Application Inventory, Scope Memo, RFP Package, Response Checklist |
| Stage 4 - Pricing / TCO | Pricing Template, Pricing Comparison, TCO Iceberg |
| Stage 5 - Evaluation / BAFO | Scorecard, Trap Log, BAFO Question Pack, Decision Brief, Selection Memo |
| Stage 6 - Risk / Clauses | AI Clause Gap, Vendor Risk Pack |
| Stage 7 - SRM / Renewal | Renewal Decision |
| Master artifact | Source Deal Pack |

The Deal Pack should be the board-grade, navigable source of truth. Individual
artifacts are chapters, not disconnected downloads.

## 5. Master Source Deal Pack

Audience: CIO, CFO, VP Sourcing, business sponsor, legal/risk, procurement
lead.  
Decision job: understand the entire sourcing event and decide what can move
forward, what must be fixed, and what should be approved.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Executive sourcing answer | Current recommendation, release/selection/renewal state, value at stake, top blocker, next gate. | Decision card plus stage-gate status rail. | No above-the-fold recommendation. |
| 2 | Event context | Trigger, category, business outcome, linked Move/Tower signal, owner model. | Compact event fact table. | Generic event description with no business trigger. |
| 3 | Demand challenge | Source / do not source / renegotiate / rationalize verdict. | Demand-challenge decision tree and overlap table. | No challenge of whether sourcing is needed. |
| 4 | Scope and evidence | In-scope, out-of-scope, baselines, gaps, evidence quality. | Scope boundary table and evidence/gap matrix. | Missing baselines hidden or treated as usable. |
| 5 | Market and vendor field | Market map, vendor shortlist, disqualified vendors, vendor reality read. | Vendor landscape matrix. | Vendor list lacks rationale. |
| 6 | Vendor-facing package readiness | RFP/RFI package state, response checklist, release blockers. | Release-readiness checklist. | RFP package marked ready without locked scorecard/pricing template. |
| 7 | Evaluation and commercial comparison | Scorecard, response completeness, pricing comparison, TCO iceberg. | Vendor tradeoff matrix, normalized TCO waterfall. | Scorecard presented without evidence citations. |
| 8 | Negotiation and leverage | Trap log, BAFO questions, walk-away points, concessions, leverage window. | BAFO leverage matrix and negotiation issue tree. | No walk-away or leverage logic. |
| 9 | Risk and contracting | Vendor risk, AI clauses, legal/security issues, open redlines. | Risk/control heatmap and clause-gap table. | AI/data risk clauses omitted when AI is in scope. |
| 10 | Decision and approval | Decision brief, selection memo, approval conditions, waived gates. | Decision checklist and signoff matrix. | Signoff implies final approval while waivers remain. |
| 11 | Renewal / SRM handoff | Renewal decision, SRM watch items, Tower impact, value tracking. | Renewal calendar and SRM action queue. | Renewal notice/utilization not visible. |
| 12 | Downloads and audit | Artifact health, formats, versions, authors, generated date, evidence lineage. | Artifact health grid. | Downloads lack quality or version state. |

Minimum standard: the Deal Pack can replace a live walkthrough. A VP Sourcing
can open it and know the event state, the commercial posture, the blockers, the
approval ask, and the next action in under five minutes.

## 6. Stage 0 - Demand Challenge

### 6.1 Demand Challenge

Purpose: decide whether to source, renegotiate, rationalize, defer, or route to
Moves before any vendor-facing work begins.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Demand verdict | Source / do not source / renegotiate / rationalize / route-to-Move. | Decision card with verdict and confidence. | No explicit verdict. |
| 2 | Business problem | Outcome sought, trigger, sponsor, time pressure. | Trigger and urgency strip. | Vague "need a tool" framing. |
| 3 | Existing coverage | Incumbent contracts, overlapping tools, shelfware, usage. | Coverage/overlap matrix. | Existing contracts ignored. |
| 4 | Spend and value-at-stake | Current spend, avoidable spend, risk cost, upside. | Value-at-stake range bar. | Single-point savings claim. |
| 5 | Build / buy / partner first pass | What should be bought, built, partnered, retained, or stopped. | Delivery-model decision tree. | RFP assumed before model decision. |
| 6 | Expert traps | Tool-vs-process problem, duplicate spend, wrong sourcing motion. | Trap checklist. | No challenge logic. |
| 7 | Evidence gaps | Missing facts, owner, due date, gate impact. | Gap closure queue. | Missing data hidden. |
| 8 | Next action | Create event, renegotiate, gather evidence, or route to Moves/Tower. | Action table. | No owner or next gate. |

Minimum quality: a senior sourcing partner would recognize the artifact as a
pre-RFP challenge, not a request-intake summary.

## 7. Stage 1 - Sourcing Strategy

### 7.1 Sourcing Approach

Purpose: define the commercial strategy before solicitation.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Sourcing thesis | Why this event exists and what outcome it must create. | One-page strategy card. | No outcome metric. |
| 2 | Category and buying motion | Category, lifecycle stage, RFI/RFP/RFQ/direct/renewal decision. | Buying-motion decision tree. | Full RFP defaulted without rationale. |
| 3 | Commercial model | Fixed fee, T&M, outcome-based, consumption, hybrid; rationale. | Commercial model tradeoff table. | Consumption pricing lacks cap logic. |
| 4 | Vendor field strategy | Incumbent, challengers, specialists, SI, product vendors. | Vendor-field map. | Incumbent posture unclear. |
| 5 | Scope and gate dependencies | What must be true before vendor-facing release. | Stage-gate dependency table. | Release gate not named. |
| 6 | Negotiation posture preview | Leverage sources, timing, competitive tension, walk-away risks. | Leverage source table. | No leverage thesis. |
| 7 | Evidence and assumptions | Facts, benchmarks, assumptions, owner. | Assumption/evidence ledger. | Assumptions unowned. |
| 8 | Recommended path | Approach, artifacts to produce, reviewer sequence, next gate. | Action plan table. | No path to next artifact. |

Minimum quality: makes the sourcing motion explicit and prevents "generate an
RFP" from becoming the strategy.

## 8. Stage 2 - Market Intelligence

### 8.1 Market Scan

Purpose: understand the market, vendors, benchmarks and category traps before
shortlisting or shaping the package.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Market answer | Is the vendor market mature, fragmented, risky, or dominated? | Market maturity card. | No market point of view. |
| 2 | Vendor landscape | Incumbents, challengers, specialists, hyperscalers/SIs/platforms. | 2x2 landscape or capability matrix. | Vendor list with no segmentation. |
| 3 | Capability comparison | Required capabilities, differentiators, proof required. | Capability heatmap. | Marketing claims accepted as capability. |
| 4 | Commercial benchmarks | Rate bands, pricing models, discount norms, usage economics. | Benchmark range table. | Benchmarks lack source/confidence. |
| 5 | Vendor reality read | Platform vs wrapper, delivery depth, financial viability, concentration. | Vendor reality scorecard. | AI wrapper risk omitted for AI scope. |
| 6 | Shortlist logic | Include/exclude rationale, category fit, risk notes. | Shortlist funnel. | Disqualified vendors lack reason. |
| 7 | Market traps | Lock-in, consumption risk, switching cost, SI over-scope. | Trap map. | No trap analysis. |
| 8 | Implication for package | How the RFP/RFI/BAFO should change. | Package implication table. | Market scan not tied to next artifact. |

Minimum quality: equips the sourcing lead to challenge vendor narratives and
shape discriminating questions.

## 9. Stage 3 - Scope / RFP

### 9.1 Application Inventory

Purpose: establish what estate, workloads or services are in scope and what
pricing/tier assumptions depend on them.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Inventory summary | Count, criticality mix, owner, baseline confidence. | Estate summary card. | No inventory confidence. |
| 2 | Application/service table | Name, tier, business owner, tech owner, criticality, volume, region. | Structured table; XLSX canonical. | App/service rows lack owner or tier. |
| 3 | Scope flags | Retire/modernize/keep, excluded, dependency, regulatory. | Scope flag matrix. | Retirement candidates hidden. |
| 4 | Operational baseline | Tickets, incidents, support hours, SLA, utilization where available. | Baseline table and volume chart. | Pricing drivers missing. |
| 5 | Data gaps | Missing fields, owner, pricing impact. | Gap queue. | Blank cells without gap state. |
| 6 | Pricing implications | Which inventory fields affect vendor pricing. | Pricing-driver map. | No link to pricing template. |
| 7 | Evidence notes | Source file/system, as-of, confidence. | Evidence/source table. | No source lineage. |

Minimum quality: a vendor could price from it and a retained team could see
where missing inventory weakens comparability.

### 9.2 Scope Memo

Purpose: lock the scope boundary before vendor-facing materials.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Scope answer | Pricing-ready / outline-only / blocked verdict. | Scope readiness card. | No readiness verdict. |
| 2 | In-scope | Services, towers, geographies, apps, roles, support windows. | In-scope table. | "Enterprise all" without detail. |
| 3 | Out-of-scope | Explicit exclusions and rationale. | Out-of-scope table. | Exclusions omitted. |
| 4 | Retained vs vendor responsibilities | Accountabilities, handoffs, exceptions. | Responsibility split matrix. | Retained responsibilities unclear. |
| 5 | Baselines and assumptions | Current volumes, cost, SLA, tickets, owners. | Baseline/assumption table. | Baselines lack confidence. |
| 6 | Pricing implications | What vendors must price and what is optional. | Pricing driver table. | Pricing template disconnected. |
| 7 | Risk and ambiguities | Scope ambiguity, transition risk, evidence gaps. | Risk/gap table. | Ambiguities hidden. |
| 8 | Approval and gate | Reviewer, waiver, release condition, next artifact. | Gate checklist. | No gate owner. |

Minimum quality: the memo prevents non-comparable vendor pricing.

### 9.3 RFP Package

Purpose: create a vendor-facing solicitation package that produces comparable,
decision-grade responses.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Release readiness | Release-ready / conditional / blocked, with reason. | Release gate card. | Release status absent. |
| 2 | Executive context for vendors | Business objective, sourcing goal, decision timeline. | Timeline table. | Vendors cannot infer desired outcome. |
| 3 | Scope and services | In-scope/out-of-scope, volumes, service levels, assumptions. | Scope table; volume table. | Scope memo not reflected. |
| 4 | Response instructions | Required formats, deadlines, Q&A rules, mandatory templates. | Compliance checklist. | Ambiguous response format. |
| 5 | Technical and service requirements | Capabilities, integration, security, operations, transition. | Requirement table with must/should/could. | Requirements not testable. |
| 6 | Pricing instructions | Pricing template, units, assumptions, transition/run split. | Pricing instruction table. | Pricing template missing. |
| 7 | Evaluation criteria | Weighting, pass/fail gates, evidence requirements. | Criteria/weight table. | Criteria defined after responses. |
| 8 | Contract and risk requirements | Legal, privacy, AI clauses, insurance, audit rights. | Clause requirement checklist. | AI clauses absent when AI in scope. |
| 9 | Submission checklist | All required attachments and certifications. | Vendor submission checklist. | No completeness basis. |

Minimum quality: vendors respond in a structure that can be compared without
manual reconstruction.

### 9.4 Response Checklist

Purpose: enforce comparable, complete vendor responses.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Completeness standard | What counts as complete, partial, exception, or non-response. | Status legend. | No definition of complete. |
| 2 | Mandatory response items | Item, format, owner, vendor instruction, scoring impact. | Checklist table. | Mandatory items missing. |
| 3 | Pricing requirements | Pricing cells, assumptions, units, term, transition, run. | Pricing checklist. | Pricing cells not normalized. |
| 4 | Evidence requirements | Proof, reference, certificate, demo, benchmark. | Evidence requirement matrix. | Vendor claims need no proof. |
| 5 | Exceptions and deviations | How vendors disclose gaps and assumptions. | Exceptions table. | Deviations hidden in narrative. |
| 6 | Submission QA | Vendor-by-item completeness read. | Completeness heatmap. | No vendor completeness status. |
| 7 | Gate impact | What blocks evaluation or BAFO. | Gate impact table. | Incomplete responses still evaluated equally. |

Minimum quality: a vendor cannot submit vague prose and still look complete.

### 9.5 Vendor Response Control Pack

Purpose: allow realistic long-form vendor responses while preserving a
structured evaluation record.

Vendor responses may include detailed narrative by RFP section, but the required
structured exhibits are mandatory and control the evaluation record. Narrative
responses may supplement, but may not replace, the required pricing workbook,
claim register, SLA table, staffing model, transition plan, assumptions and
exclusions log, and exceptions table.

If a claim appears in narrative but is not included in the Vendor Claim Register
or supported by the required exhibit, the buyer may treat it as unsupported for
evaluation and BAFO purposes.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Section map | Vendor response section, page/file reference, matching RFP requirement, complete/partial/missing status. | Section map table. | Narrative accepted without mapping to the RFP. |
| 2 | Required narrative | Executive summary, scope, delivery model, support model, transition, staffing, SLA, automation, governance, security, pricing, assumptions, exceptions. | Section completeness heatmap. | Vendor response skips required sections without explicit gap. |
| 3 | Claim register | Claim, section, evidence, owner, structured exhibit reference, evaluation status. | Claim register table. | Claims hidden only in prose. |
| 4 | Pricing workbook | Run cost, transition cost, one-time cost, optional cost, pass-throughs, 5-year TCO. | Pricing workbook / TCO bridge. | Narrative pricing replaces workbook pricing. |
| 5 | Productivity commitments | Baseline, use case, impact, year, measurement method, pricing credit, dependencies. | Productivity commitment table. | Automation savings not tied to pricing or measurement. |
| 6 | Staffing and SLA exhibits | FTE, role, location, coverage, SLA target, credit, cap, exclusion, reporting. | Staffing and SLA tables. | 24x7 or SLA claims lack staffed/exhibit proof. |
| 7 | Assumptions and exceptions | Buyer dependencies, exclusions, legal/commercial deviations, change-order exposure. | Exception and assumption log. | Assumptions buried in appendix prose. |
| 8 | Transition plan | KT, mobilization, cutover, stabilization, milestones, exit criteria, payment linkage. | Milestone plan. | Transition fee not linked to milestones. |
| 9 | Evidence attachment index | File/page/sheet references for claims and exhibits. | Evidence index. | Unsupported claims treated as scored evidence. |

Minimum quality: the response can be long and nuanced, but AbarVa can reduce it
to a minimum viable sourcing record for comparison, challenge, BAFO, and
executive decision.

### 9.6 Minimum Viable Vendor Extraction

Purpose: convert long vendor responses into sourcing-critical evidence, not
generic summaries.

| Order | Extraction area | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Completeness | Required RFP sections answered, partial, missing, or exceptioned. | Completeness heatmap. | No section-level readiness. |
| 2 | Claims | Major vendor claims, section reference, evidence, confidence. | Claim register. | Marketing claims treated as proof. |
| 3 | Evidence | Supporting file/page/sheet references and missing proof. | Evidence index. | Claims without evidence status. |
| 4 | Pricing | Run, transition, one-time, optional, pass-through, 5-year TCO. | TCO bridge. | Submitted totals treated as normalized. |
| 5 | Productivity | Automation commitment, baseline, timing, priced-back credit, measurement. | Productivity table. | Productivity claim not reconciled to pricing. |
| 6 | Staffing | Role mix, location mix, FTEs, coverage, retained dependencies. | Staffing model. | Coverage claim not staffed. |
| 7 | SLA | Targets, credits, caps, exclusions, reporting cadence. | SLA commitment matrix. | SLA target shown without credit/cap economics. |
| 8 | Assumptions | Buyer obligations, exclusions, dependencies, change-order risk. | Assumption/exclusion log. | Risk-shifting assumptions ignored. |
| 9 | Exceptions | Commercial, legal, RFP, SLA, and pricing deviations. | Exception table. | Exceptions mixed into narrative. |
| 10 | Transition | KT, dependencies, milestones, exit criteria, payment linkage. | Transition milestone plan. | Transition plan not tied to gates. |

Minimum quality: the product can say where the vendor story does not match its
commercial commitment.

## 10. Stage 4 - Pricing / TCO

### 10.1 Pricing Template

Purpose: force vendors into a comparable commercial structure.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Pricing instructions | Units, term, assumptions, currency, escalation, inclusions. | Instruction block plus required tabs list. | Vendors can choose their own structure. |
| 2 | Baseline units | Volumes, apps, tickets, users, environments, transactions. | Unit driver table. | No unit drivers. |
| 3 | One-time costs | Transition, implementation, migration, setup, tooling. | Cost category table. | Transition cost omitted. |
| 4 | Recurring run costs | License/subscription, managed service, support, consumption. | Recurring cost table. | Run cost hidden in notes. |
| 5 | Variable/consumption costs | Unit, trigger, cap, overage, alert, forecast. | Consumption scenario table. | AI consumption lacks cap. |
| 6 | Assumptions and exclusions | Vendor assumptions, customer dependencies, exclusions. | Assumption table. | Assumptions not isolated. |
| 7 | Optional modules | Optional scope, price, decision condition. | Optional module table. | Options mixed into base. |
| 8 | Commercial terms | Discount, price protection, renewal, termination, benchmarking. | Commercial term table. | Renewal/uplift hidden. |

Minimum quality: the template makes pricing normalization possible before
responses arrive.

### 10.2 Pricing Comparison

Purpose: compare vendors on normalized total cost, not submitted totals.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Commercial answer | Lowest normalized TCO, best value, biggest uncertainty. | Executive pricing card. | No normalized answer. |
| 2 | Submitted vs normalized | Vendor submitted total, normalized total, adjustments. | Submitted-to-normalized bridge. | Raw totals treated as comparable. |
| 3 | Cost by tower | One-time, recurring, run, transition, consumption, risk reserve. | Vendor cost stack by tower. | Transition/run hidden. |
| 4 | Assumption differences | Vendor assumptions that change comparability. | Assumption variance table. | Assumptions ignored. |
| 5 | Scenario sensitivity | Base/conservative/upside and volume/consumption cases. | Scenario range chart. | Downside missing. |
| 6 | Commercial traps | Lowball, exclusions, change-order exposure, uplift, lock-in. | Trap flags next to vendor rows. | No trap overlay. |
| 7 | BAFO implications | Questions, asks, walk-away points by vendor. | BAFO issue table. | No negotiation next step. |
| 8 | Evidence and gaps | Missing price items and owner. | Gap table. | Missing vendor data averaged or guessed. |

Minimum quality: a CFO can see why the cheapest bid may not be the best bid.

### 10.3 TCO Iceberg

Purpose: expose hidden costs beyond license or quoted services.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | TCO answer | Visible cost vs true cost range and biggest hidden driver. | Iceberg / visible-vs-hidden chart. | Only vendor quote shown. |
| 2 | Visible costs | License/subscription/base services. | Visible cost table. | No baseline quote. |
| 3 | Hidden implementation costs | Transition, migration, configuration, integration. | Hidden cost stack. | Implementation omitted. |
| 4 | Hidden operating costs | Run FTE, governance, reporting, support, hypercare. | Run cost table. | Internal effort omitted. |
| 5 | AI/consumption costs | Tokens/usage, alerts, caps, overage, scaling scenarios. | Consumption curve. | No scaling scenario for AI. |
| 6 | Exit and lock-in costs | Data export, dual-run, termination, retraining, portability. | Exit cost table. | Exit cost omitted. |
| 7 | Risk reserve | Risk categories and reserve logic. | Risk reserve bridge. | Reserve unexplained. |
| 8 | Decision implication | How TCO changes vendor ranking or negotiation ask. | Vendor TCO comparison. | No action tied to TCO. |

Minimum quality: prevents a VP Sourcing from accepting a vendor quote as the
cost of ownership.

## 11. Stage 5 - Evaluation / BAFO

### 11.1 Evaluation Scorecard

Purpose: evaluate vendors with locked, evidence-backed criteria.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Evaluation answer | Current leading option, confidence, disqualifiers, caveat. | Leaderboard card. | Scores shown without conclusion. |
| 2 | Criteria and weights | Locked criteria, weight, rationale, owner, version. | Weight table. | Weights changed after responses without log. |
| 3 | Vendor scores | Vendor, criterion, score, evidence, comment, exception. | Weighted score matrix. | Scores lack evidence. |
| 4 | Pass/fail gates | Security, legal, financial, technical, reference gates. | Gate checklist. | Gate failures buried in score. |
| 5 | Sensitivity | What changes if weights or pass/fail assumptions move. | Score sensitivity chart. | No sensitivity on close calls. |
| 6 | Disqualification logic | Thresholds and rationale for excluded vendors. | Disqualification table. | Excluded vendors lack reason. |
| 7 | BAFO implications | Clarifications, proof requests, commercial asks. | BAFO issue table. | Scorecard does not drive BAFO. |

Minimum quality: evaluation can withstand protest, audit, sponsor challenge and
vendor debrief.

### 11.2 Pricing Trap Log

Purpose: identify commercial traps before contract signature.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Trap summary | Count by severity, top P0/P1 traps, commercial impact. | Severity dashboard. | No severity. |
| 2 | Trap detail | Vendor, clause/pricing area, issue, evidence, impact. | Trap log table. | Trap lacks evidence. |
| 3 | Financial exposure | Cost range, change-order exposure, uplift, lock-in. | Exposure range bar. | No quantified impact when estimable. |
| 4 | Negotiation response | Ask, concession, walk-away, owner. | Negotiation response table. | Trap not tied to action. |
| 5 | Status and resolution | Open/resolved/waived, rationale, approver. | Resolution status table. | Waivers have no approver. |
| 6 | Contract carry-forward | Clauses or schedules needing redline. | Contract issue list. | Traps disappear after BAFO. |

Minimum quality: no known commercial trap is allowed to become a "surprise" in
contracting.

### 11.3 BAFO Question Pack

Purpose: preserve leverage and force final vendor clarity.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | BAFO posture | Negotiate / clarify / challenge / hold / walk-away by vendor. | Vendor posture card. | Same questions for every vendor. |
| 2 | Commercial asks | Price, term, cap, benchmark, transition, uplift asks. | Commercial ask table. | No ask tied to value. |
| 3 | Scope and assumption asks | Ambiguous scope, exclusions, retained dependencies. | Assumption challenge table. | Vendor assumptions unchallenged. |
| 4 | Technical/service proof | Proof, demo, reference, SLA, transition evidence. | Proof request matrix. | Capability claims accepted. |
| 5 | Legal/risk asks | AI clauses, privacy, sub-processors, audit, exit. | Clause ask table. | Risk asks omitted. |
| 6 | Walk-away conditions | Conditions that end negotiation or disqualify. | Walk-away checklist. | No walk-away line. |
| 7 | Owner and due date | Owner, response deadline, evaluation impact. | Action queue. | No owner. |

Minimum quality: vendors feel the buyer knows the market, the economics, and
the traps.

### 11.4 Decision Brief

Purpose: prepare executives for selection or negotiation decision.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Executive answer | Recommended path, confidence, decision requested. | Decision card. | No decision ask. |
| 2 | Vendor tradeoff | Best fit, best economics, best risk posture, gaps. | Tradeoff matrix. | Winner named without tradeoff. |
| 3 | Commercial comparison | Normalized TCO, savings, exposure, BAFO status. | TCO comparison chart. | Raw pricing only. |
| 4 | Risk and controls | Security, legal, transition, operational, concentration risk. | Risk heatmap. | Risk separated from decision. |
| 5 | Open conditions | Required clarifications, approvals, waivers. | Condition table. | Open conditions omitted. |
| 6 | Recommendation | Select, BAFO, defer, re-run, no-award. | Recommendation checklist. | Recommendation has no rationale. |
| 7 | Signoff path | Sponsor, finance, legal, sourcing, risk owners. | Signoff matrix. | Approval path missing. |

Minimum quality: a CXO can decide the next sourcing action without reading
every workbook.

### 11.5 Selection Memo

Purpose: record the final selection rationale and approval basis.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Selection decision | Selected vendor, decision, conditions, approval status. | Selection card. | Winner named without conditions. |
| 2 | Rationale | Why selected, why others not selected, evidence basis. | Rationale table. | Runner-up rationale absent. |
| 3 | Evaluation record | Scorecard summary, pass/fail gates, BAFO outcomes. | Evaluation summary chart. | Scores lack version reference. |
| 4 | Commercial record | Final price, normalized TCO, concessions, protections. | Final economics table. | Concessions not recorded. |
| 5 | Contract conditions | Clauses, redlines, open legal/security items. | Condition checklist. | Open legal items hidden. |
| 6 | Transition and SRM handoff | Mobilization, owners, metrics, renewal reminders. | Handoff table. | No post-award owner. |
| 7 | Audit trail | Reviewers, waivers, approvals, source artifacts. | Evidence and approval ledger. | Waivers omitted. |

Minimum quality: survives procurement audit and gives delivery/SRM the full
handoff context.

## 12. Stage 6 - Risk / Clauses

### 12.1 AI Clause Gap

Purpose: assess contract gaps specific to AI, data, model behavior and
provider dependencies.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Clause readiness answer | Ready / redline / block / counsel review, with severity. | Clause readiness card. | No readiness verdict. |
| 2 | Data and model use | Training rights, prompt/data use, output ownership, retention. | Clause gap table. | Model-training rights omitted. |
| 3 | Liability and remedy | Hallucination/error remedy, IP indemnity, audit rights. | Risk/remedy matrix. | No remedy for model error. |
| 4 | Provider dependency | Sub-processors, model providers, concentration, data residency. | Dependency map. | Sub-processors undisclosed. |
| 5 | Consumption and caps | Usage caps, alerts, predictability, overage, benchmarking. | Consumption-control checklist. | No consumption cap. |
| 6 | Exit and portability | Fine-tune/model/data export, deletion, transition support. | Exit-rights table. | Exit rights absent. |
| 7 | Redline asks | Required clauses, fallback positions, owner/counsel. | Redline issue queue. | No counsel owner for high-risk gaps. |

Minimum quality: procurement counsel would recognize that the AI risks are not
generic SaaS clauses.

### 12.2 Vendor Risk Pack

Purpose: assess vendor viability, operational, security, concentration and
transition risks.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Risk answer | Low/medium/high risk, gating issues, owner. | Risk card. | No overall risk posture. |
| 2 | Security and privacy | Certifications, data handling, incident history, controls. | Security control matrix. | Security review absent. |
| 3 | Financial and viability | Financial health, M&A, funding, customer concentration. | Viability table. | Viability not assessed. |
| 4 | Delivery and transition | Delivery model, staffing, transition, knowledge transfer. | Transition risk table. | Transition risk omitted. |
| 5 | Fourth-party risk | Subcontractors, cloud, model providers, offshore delivery. | Dependency map. | Fourth-party risk absent. |
| 6 | Concentration and lock-in | Strategic dependence, exit cost, replacement risk. | Concentration heatmap. | Lock-in ignored. |
| 7 | Mitigations and conditions | Required controls, clauses, reserves, monitoring. | Mitigation table. | Risks not tied to conditions. |

Minimum quality: risk is decision-relevant, not a separate compliance appendix.

## 13. Stage 7 - SRM / Renewal

### 13.1 Renewal Decision

Purpose: decide whether to renew, renegotiate, rebid, rationalize, or terminate.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Renewal answer | Renew / renegotiate / rebid / terminate / rationalize verdict. | Renewal decision card. | No verdict. |
| 2 | Timing and leverage | Expiry, notice deadline, auto-renewal, negotiation window. | Renewal timeline. | Notice window omitted. |
| 3 | Usage and value | License utilization, adoption, performance, value delivered. | Usage vs license chart. | Utilization absent. |
| 4 | Spend and uplift | Current spend, proposed uplift, price protection, benchmark. | Spend/uplift bridge. | Uplift not isolated. |
| 5 | Overlap and rationalization | Tool overlap, shelfware, alternate coverage. | Overlap matrix. | Overlap ignored. |
| 6 | Risk and dependency | Operational risk, switching cost, contract exposure. | Renewal risk table. | Termination/switching risk absent. |
| 7 | Negotiation posture | Ask list, concessions, walk-away, owner, due date. | Negotiation posture table. | No leverage strategy. |
| 8 | SRM / Tower handoff | Watch items, metrics, next review date, owner. | SRM action queue. | No post-renewal tracking. |

Minimum quality: prevents the auto-renewal trap and makes renewal an active
commercial decision, not a calendar event.

## 14. Cross-Artifact Quality Scoring

Each Source artifact should be scored out of 10 against this rubric.

| Dimension | Weight | What 10/10 means |
|---|---:|---|
| Decision clarity | 15% | The artifact states the sourcing decision and next gate immediately. |
| Evidence grounding | 15% | Claims tie to contracts, spend, usage, telemetry, vendor response, benchmark or explicit gap. |
| Expert sourcing judgment | 15% | The artifact catches traps a senior IT sourcing advisor would catch. |
| Commercial defensibility | 15% | Pricing, TCO, leverage, assumptions and ranges are challenge-ready. |
| Risk and control integration | 10% | Legal, security, privacy, vendor and operational risk affect the recommendation. |
| Visual/table usefulness | 10% | Tables and graphs clarify the decision; no decorative exhibits. |
| Actionability | 10% | Owners, due dates, gate impact and next actions are explicit. |
| Auditability | 10% | Version, waiver, reviewer, evidence and source lineage are visible. |

Thresholds:

- **0-4:** generated content, not a professional sourcing artifact.
- **5-6:** useful internal draft.
- **7-8:** credible working artifact for sourcing team review.
- **8.5-8.9:** executive-review ready.
- **9+:** board/advisor quality.

Hard fails override score:

- fabricated metric or benchmark;
- uncited financial number;
- missing sourcing decision;
- RFP package without scope/pricing/scorecard readiness;
- pricing comparison without normalization;
- scorecard without locked criteria and evidence;
- AI clause artifact without model-training/data-use/sub-processor coverage;
- renewal artifact without notice window and utilization.

## 15. Path Forward

Recommended implementation sequence:

1. **Adopt this blueprint as the Source artifact gate.** No renderer should be
   called board-grade until its table of contents and hard-fail checks are
   represented in code.
2. **Build a typed Source artifact standards catalog.** One standard per
   `SourceDeliverableKind`, including required sections, required exhibits,
   evidence requirements, hard fails and minimum score.
3. **Add a Source quality rubric.** Deterministic scoring should identify
   missing sections, missing visuals, missing evidence and hard-fails.
4. **Create a master Source Deal Pack quality model.** The current deal pack
   should expose artifact health, stage readiness, evidence gaps and approval
   state.
5. **Pick one reference artifact for premium redesign.** Recommended first
   reference: **Renewal Decision** for Apex/ServiceNow or **Pricing Comparison**
   for an AMS event. These are closest to a real VP Sourcing decision moment.
6. **Only then uplift renderers.** Start with HTML reference quality, then
   DOCX/PDF/XLSX parity after the content standard is accepted.
7. **Run a practitioner review.** Put the reference artifact in front of a VP
   Sourcing/CPO and ask whether it changes the decision, exposes a trap, or
   saves time.

The path forward is not more artifact count. It is fewer, sharper artifacts
that are decision-grade, commercially literate, and brutally clear about what
should not proceed.
