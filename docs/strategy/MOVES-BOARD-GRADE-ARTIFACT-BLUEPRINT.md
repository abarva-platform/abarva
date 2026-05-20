<!-- markdownlint-disable MD013 MD060 -->

# Moves Board-Grade Artifact Blueprint

**Date:** 2026-05-20  
**Status:** v1 alignment blueprint — must be reviewed before additional renderer work.  
**Purpose:** define the mandatory content, storyline, visuals and quality bar for
every Moves artifact before building more UI or exports.

## 1. The Bar

The current Moves artifacts are valid evidence packets. They are not yet
board-grade consulting artifacts. This blueprint sets the standard AbarVa should
build toward.

The artifact system must answer five executive questions:

1. **What decision are you asking me to make?**
2. **Why now, and what is the evidence?**
3. **What are we funding, what does it cost, and what value should we expect?**
4. **What could make this wrong, unsafe, uneconomic or unexecutable?**
5. **What happens next, who owns it, and what will Tower measure?**

If an artifact does not advance one of those questions, it is noise.

## 2. Consulting Exhibit Anatomy

Every board-facing page or section must use the same structure.

| Element | Requirement |
|---|---|
| Takeaway title | A sentence with a point of view, not a label. Example: "Do not fund full autonomy until the contact-volume and cost-per-contact gaps are closed." |
| Decision role | What decision this page supports: shape / fund / kill / approve gate / assign owner / request evidence. |
| Exhibit body | One dominant visual or table. No page should be mostly prose unless it is an executive memo page. |
| Evidence strip | Sources, dates, confidence and gaps. Must be visible, not buried. |
| Implication | The action created by the exhibit. |
| Owner / next gate | Who resolves the issue and where it gates the process. |

Hard rules:

- No exhibit may have a neutral title like "Financial Summary" if the data has
  a clear implication.
- No page may contain a financial number without source, confidence, and
  assumption linkage.
- No artifact may show a single ROI, single cost or single payback when the
  underlying model has ranges.
- No missing data may be hidden. Use "Not recorded — seed gap" and state the
  decision impact.

## 3. The Evolving Moves Book

Moves artifacts are not separate reports. They are chapters in one evolving
book:

```text
Discover Brief
  -> Charter Case
    -> Solution Architecture Pack
      -> Estimate and Financial Model
        -> Costed Business Case
          -> Mobilize and Go-Decision Packet
            -> Master Move Dossier
```

Each later artifact must inherit and update earlier content:

- baseline facts from Discover;
- value hypothesis and assumptions from Charter;
- architecture and delivery boundary from Solution Architecture;
- cost, roadmap and sensitivity from Estimate;
- decision recommendation from Business Case;
- owners, actions and Tower metrics from Mobilize.

The master dossier is the assembled live book, not another standalone report.

## 4. Master Move Dossier

Audience: CEO, CFO, CIO, business sponsor, board advisor.  
Decision job: understand the full Move and decide whether to fund, reshape, kill
or request missing evidence.

Mandatory structure:

| Section | Takeaway requirement | Required content | Required visuals |
|---|---|---|---|
| 1. Executive answer | One sentence: fund / shape / kill and why. | Recommendation, confidence, investment range, value range, payback, blocker count, next gate. | Decision card; investment vs return bar; blocker strip. |
| 2. Board memo | The case in 90 seconds. | Problem, why now, recommendation, what not to fund yet, immediate asks. | None required; must be scannable prose with callout metrics. |
| 3. Decision timeline | Shows how the case evolved and where content changed. | Discover, Charter, Design, Mobilize states; review dates; changed assumptions. | Phase timeline with revision markers. |
| 4. Evidence and gaps | Makes trust explicit. | Recorded metrics, seed gaps, evidence owners, source quality. | Evidence/gap matrix. |
| 5. Solution and delivery model | Shows what is actually being funded. | Selected architecture, build/buy/partner boundary, human/accountability points, integration and control posture. | Context diagram; logical architecture; data-flow; control overlay. |
| 6. Economics | Shows whether the bet pays back under challenge. | Investment, run cost, value forecast, sensitivity, what breaks the case. | Waterfall; tornado; payback curve; base/conservative/upside. |
| 7. Roadmap and mobilization | Shows execution path and decision gates. | 30/60/90, workstreams, dependencies, owners, adoption/change, hypercare. | Swimlane; RACI; open action queue. |
| 8. Tower measurement | Shows how value will be proven later. | Baseline, target, cadence, owner, forecast-to-actual handoff. | Measurement table; forecast-to-actual placeholder. |
| 9. Downloads and signoff | Shows artifact health and approval readiness. | Artifact list, quality scores, reviewer verdicts, open actions. | Artifact health grid; signoff matrix. |

Acceptance bar:

- Above the fold must answer the decision in under 30 seconds.
- A reviewer must be able to reach any source/gap from a top-level claim in two
  clicks or fewer.
- The dossier must separate board-facing narrative from appendix detail.
- If the case is not fundable, the first screen must say so plainly.

## 5. Discover Brief

Audience: sponsor, domain owner, transformation lead.  
Decision job: decide whether the idea is real enough to shape.

Recommended length: 5-7 pages or HTML sections.

| Page | Takeaway title must answer | Required content | Required visuals |
|---|---|---|---|
| 1. Decision snapshot | Is this a real problem worth shaping? | Problem statement, initial verdict, confidence, next evidence request. | Decision card. |
| 2. Current-state baseline | What do we actually know today? | Metrics, value, source, as-of date, confidence, owner. | Baseline coverage meter; metric source table. |
| 3. Pain and opportunity | Where is value likely hiding? | Pain themes, opportunity range, known constraints. | Opportunity range bar. |
| 4. Evidence gaps | What prevents sizing the case honestly? | Missing metrics, owner, due date, impact on value. | Gap closure queue. |
| 5. Go/no-go gate | What would make us stop now? | Kill triggers, reshape triggers, evidence asks. | Kill checklist. |
| 6. Appendix | What data was used? | Source ledger and assumptions. | Evidence table. |

Hard fails:

- Baseline metrics lack source/confidence.
- Missing metrics are blank instead of seed gaps.
- Opportunity range is shown without caveat when monetization input is missing.

## 6. Charter Business-Case Skeleton

Audience: CIO, CFO sponsor, business sponsor.  
Decision job: approve deeper shaping spend or stop.

Recommended length: 6-8 pages.

| Page | Takeaway title must answer | Required content | Required visuals |
|---|---|---|---|
| 1. Charter answer | Shape, fund shaping only, or stop? | Recommendation, sponsor, gate, confidence. | Decision card. |
| 2. Value hypothesis | What value could this create, and how would we know? | Falsifiable claim, target metric, baseline, assumptions. | Value hypothesis card. |
| 3. Initial cost/effort | What is the early investment envelope? | Effort range, build/run/change split, rate-card basis. | Value vs effort summary. |
| 4. Assumption ledger | Which assumptions drive the case? | Top assumptions, owners, confidence, sensitivity impact. | Assumption sensitivity stack. |
| 5. Kill criteria | What would make us stop? | Stop conditions and evidence thresholds. | Kill criteria checklist. |
| 6. Evidence asks | What must be collected before funding? | Missing evidence, owner, target date. | Gap closure table. |

Hard fails:

- Single-point ROI or single-point cost.
- Assumptions have no owner or sensitivity.
- Recommendation says "fund" while critic blockers remain.

## 7. Solution Architecture Pack

Audience: CIO, CTO, enterprise architect, security/risk, delivery lead.  
Decision job: select a feasible architecture and delivery boundary.

Recommended length: 8-10 pages.

| Page | Takeaway title must answer | Required content | Required visuals |
|---|---|---|---|
| 1. Architecture decision | What architecture should we shape around? | Selected option, alternatives rejected, decision rationale. | Option scorecard. |
| 2. Context view | Where does the solution sit in the enterprise? | Users, systems of record, context layer, Tower, agent boundary. | Architecture context diagram. |
| 3. Logical architecture | What components are being funded? | Components, responsibilities, control points, ownership. | Logical architecture diagram. |
| 4. Data flow | What data moves, where, and under what controls? | Sources, transformations, retrieval, prompts, outputs, logging. | Data-flow diagram. |
| 5. Integration map | What must integrate and what is a gap? | Systems, API/file/event paths, owners, readiness. | Integration map. |
| 6. Build/buy/partner boundary | What do we build, buy, partner for, or retain? | Boundary lanes, vendor/SI scope, retained accountabilities. | Build/buy/partner lane map. |
| 7. Human accountability | Where does the human stay in the loop? | Decision rights, approvals, exception handling. | Human/agent accountability map. |
| 8. Controls and risks | What must be true before production? | Privacy, security, model risk, evals, monitoring. | Control overlay; risk heatmap. |
| 9. Architecture open decisions | What remains unresolved? | Open decisions, owners, gate impact. | Open-decision queue. |

Hard fails:

- No architecture diagram.
- Data sources and control points are invisible.
- Build/buy/partner boundary is unclear.
- Sensitive workflow lacks privacy/security/control review.
- Full autonomy is recommended when evidence requires human accountability.

## 8. Estimate and Financial Model

Audience: CFO, sourcing VP, delivery lead, transformation finance.  
Decision job: decide whether the estimate is planning-grade credible.

Recommended structure: XLSX workbook plus HTML/PDF summary.

Mandatory workbook tabs:

1. Executive summary
2. Baseline metrics and seed gaps
3. Workstream estimate
4. Role mix by phase
5. Rate card and overrides
6. Value forecast
7. Sensitivity
8. Roadmap cash flow
9. Assumption ledger
10. Evidence/source notes

Mandatory role and rate-card structure:

- domain: AI/ML, data, integration, full-stack, cloud/platform, ERP/legacy,
  healthcare/Epic, banking/core/payment, security, change/adoption, program
  management, architecture, QA/eval, run/AMS;
- specialization;
- seniority tier;
- delivery location;
- provider archetype;
- rate basis and confidence;
- client override flag.

Required visuals:

- Workstream cost stack.
- Role mix by phase.
- Rate-card coverage matrix.
- Base/conservative/upside range chart.
- Sensitivity tornado.
- Payback/cash-flow curve.

Hard fails:

- Rate-card source not shown.
- Complex enterprise solution estimated with generic six-role model only.
- Domain/specialization/seniority/location collapsed into one blended row.
- Business-change effort missing.
- Client-specific rate card not visible as an override path.

## 9. Costed Business-Case Pack

Audience: CXO, CFO, ELT, board advisor.  
Decision job: fund, reshape, kill, or approve only the next shaping gate.

Recommended length: 10-12 pages.

| Page | Takeaway title must answer | Required content | Required visuals |
|---|---|---|---|
| 1. Board answer | What should the executive team do? | Fund/shape/kill, reason, investment, value, blocker, next ask. | Board decision card; headline economics strip. |
| 2. Why now | Why this problem matters now. | Business pain, current-state baseline, trigger, sponsor. | Baseline impact chart. |
| 3. What we are funding | What solution and operating change are included. | Architecture summary, scope, excluded work, retained accountabilities. | Solution context diagram. |
| 4. Investment case | What it costs and where the money goes. | Total investment, workstreams, run cost, build/run/change split. | Investment waterfall; cost stack. |
| 5. Value case | What value is expected and how it is discounted. | Gross value, haircut factors, net value, adoption curve. | Gross-to-net value bridge; adoption curve. |
| 6. Payback and sensitivity | What breaks the case. | Base/conservative/upside, payback, top drivers. | Tornado; payback range curve. |
| 7. Roadmap | How value and risk move over time. | Phases, dependencies, value milestones, gates. | Phased roadmap swimlane. |
| 8. Risks and controls | What could fail or block approval. | Top risks, controls, mitigations, owners. | Risk/control heatmap. |
| 9. Assumption ledger | Which assumptions need ownership. | Top assumptions, owner, confidence, sensitivity. | Assumption table. |
| 10. Evidence appendix | What was used and what is missing. | Sources, dates, confidence, seed gaps. | Evidence/gap matrix. |
| 11. Recommendation and asks | What decision is requested now. | Decision, conditions, owner, next gate, requested spend if any. | Decision checklist. |

Hard fails:

- First page does not answer fund/shape/kill.
- Payback shown while monetization is blocked.
- Downside case missing.
- Board summary buries blockers.
- Financial exhibits are tables only when chartable data exists.
- No explicit "what not to fund yet."

## 10. CFO Pack

Audience: CFO, finance committee, capital committee.  
Decision job: approve shaping spend, approve capital, reject, or request evidence.

Recommended length: 7 pages.

| Page | Takeaway title must answer | Required content | Required visuals |
|---|---|---|---|
| 1. The answer | What is finance being asked to approve? | Decision, amount, confidence, gate, blocker. | Executive economics card. |
| 2. The case | Why does this create value? | Investment, net value, payback, value source. | Value vs investment chart. |
| 3. Assumptions | Which assumptions move the case? | Top five assumptions, owner, confidence. | Sensitivity stack. |
| 4. What would make it wrong | What breaks the case? | Downside scenario, breakpoints, monetization gaps. | Tornado chart. |
| 5. What not to fund yet | What should be withheld? | Blocked scope, unfunded autonomy, missing evidence. | Do-not-fund checklist. |
| 6. What Tower will measure | How will value be proven? | Metrics, baseline, target, cadence, owner. | Tower measurement table. |
| 7. Evidence and gaps | Can finance audit the case? | Source ledger, seed gaps, assumption provenance. | Evidence/gap matrix. |

Hard fails:

- Reads like product advocacy instead of financial challenge.
- No do-not-fund section.
- No sensitivity or downside case.
- CFO cannot identify next gate within one minute.

## 11. Mobilize and Go-Decision Packet

Audience: executive sponsor, delivery lead, PMO, Tower owner, change lead.  
Decision job: proceed to execution, reshape, or no-go.

Recommended length: 7-9 pages.

| Page | Takeaway title must answer | Required content | Required visuals |
|---|---|---|---|
| 1. Go/no-go answer | Are we ready to mobilize? | Decision, conditions, owner, launch gate. | Go-decision card. |
| 2. 30/60/90 plan | What happens first? | Workstreams, milestones, dependencies. | 30/60/90 swimlane. |
| 3. Owners and decision rights | Who owns execution and exceptions? | RACI, escalation path, retained accountabilities. | RACI matrix. |
| 4. Adoption and change | What must change in the business? | Impacted roles, training, comms, hypercare, incentives. | Adoption readiness table. |
| 5. Controls and readiness | What must be true before launch? | Security, privacy, model evals, data readiness, operational controls. | Readiness heatmap. |
| 6. Tower handoff | What will be measured after launch? | Metrics, baseline, target, cadence, owner. | Measurement handoff table. |
| 7. Open action queue | What blocks go-live? | Actions, owner, due date, gate impact. | Action queue. |
| 8. Signoff | Who has approved what? | Sponsor, finance, risk, delivery, Tower. | Signoff matrix. |

Hard fails:

- Says go while kill triggers remain.
- Tower metrics are not tied to Discover baseline.
- Adoption/change is generic prose.
- No owner for execution gate actions.

## 12. Quality Measurement Against Top-Tier Consulting Output

AbarVa should score artifacts against a top-tier consulting benchmark using this
rubric.

| Dimension | 10/10 bar | Current renderer risk to watch |
|---|---|---|
| Storyline | The artifact has a clear "so what" arc and every page earns its place. | Pages become module dumps. |
| Exhibit craft | Each page has one dominant visual with a takeaway headline. | Tables masquerade as visuals. |
| Financial challenge | CFO can see downside, assumptions, sensitivity and funding ask immediately. | Optimistic value narrative overwhelms risk. |
| Domain expertise | The artifact reflects the actual domain, tech stack and delivery reality. | Generic AI-transformation language. |
| Decision usability | A CXO can decide the next gate in under 3 minutes. | Too much evidence before the answer. |
| Auditability | Every claim traces to source, assumption or gap without clutter. | Evidence appears only in appendix. |
| Visual polish | Layout, spacing, hierarchy and charts look board-circulation ready. | Valid files look auto-generated. |

Quality thresholds:

- **0-4:** evidence packet, not executive artifact.
- **5-6:** useful internal working draft.
- **7-8:** credible executive review draft.
- **9+:** board/advisor quality.

No artifact should be called board-grade below 9.

## 13. Implementation Gate

Before more renderer work, the team must align on:

1. This page-by-page outline.
2. Which artifact becomes the first reference implementation.
3. Whether the first reference is HTML-only or HTML plus PDF.
4. Which tenant and Move are the canonical sample.

Recommended first reference:

- **Artifact:** Costed Business-Case Pack.
- **Tenant:** Apex Retail.
- **Format:** HTML first, then PDF after the HTML quality is accepted.
- **Acceptance:** the first page visibly answers shape/fund/kill, the next nine
  pages follow the outline above, and every chart is grounded in the kernel
  data or explicitly marked as a seed gap.

