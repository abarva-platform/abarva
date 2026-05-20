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

## Appendix A — Deliverable Tables Of Contents

This appendix is the builder checklist. It turns the outline above into a
required table of contents for every deliverable. Renderers may change layout,
but they may not remove required content without changing the standard.

### A.1 Discover Brief — Required Table Of Contents

Purpose: decide whether the idea is worth shaping.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Decision Snapshot | One-sentence shape/stop/gather-evidence verdict, confidence, owner, next gate. | Decision card with verdict, confidence, and blocker count. | Missing verdict. |
| 2 | Problem And Trigger | Business problem, why now, who is affected, triggering event. | Small trigger timeline or problem-pressure strip. | Generic problem statement with no tenant trigger. |
| 3 | Current-State Baseline | Metrics, values, unit, source, as-of date, confidence, owner. | Baseline coverage meter plus metric source table. | Metrics without source/confidence. |
| 4 | Evidence Quality | Recorded facts vs seed gaps, source quality, stale data. | Evidence/gap matrix grouped by source type. | Missing data left blank. |
| 5 | Opportunity Sizing | Low/base/high value-at-stake, calculation logic, caveats. | Opportunity range bar; show "directional only" if monetization is blocked. | Point estimate only. |
| 6 | First Kill Tests | Conditions that would stop or reshape the idea. | Kill checklist with pass/shape/stop states. | No explicit stop logic. |
| 7 | Evidence Requests | Missing inputs, owner, due date, gate impact. | Gap closure queue sorted by decision impact. | No owner for missing evidence. |
| 8 | Source Appendix | Source ledger and assumption notes. | Compact table only; appendix detail is allowed here. | Financial number has no trace. |

Minimum standard: can be read in 5 minutes; must make clear whether the
initiative is ready for Charter or blocked by evidence gaps.

### A.2 Charter Business-Case Skeleton — Required Table Of Contents

Purpose: decide whether to approve deeper shaping spend.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Charter Answer | Shape/fund-shaping/stop verdict, sponsor, confidence, next gate. | Decision card with funding ask for shaping only. | Verdict is buried after analysis. |
| 2 | Value Hypothesis | Falsifiable value claim, target metric, baseline, value mechanism. | Value hypothesis card: baseline -> target -> mechanism. | Value claim cannot be falsified. |
| 3 | Initial Scope | Included scope, excluded scope, not-yet-funded scope. | Scope boundary table with included/excluded/deferred lanes. | Full build implied before evidence is closed. |
| 4 | Initial Cost And Effort | Early range, role families, build/run/change split, rate-card basis. | Value vs effort summary; stacked effort split. | Single-point cost. |
| 5 | Top Assumptions | Top five assumptions, owner, confidence, sensitivity impact. | Assumption sensitivity stack ranked by impact. | Assumptions lack owners. |
| 6 | Stop / Kill Criteria | Kill triggers, reshape triggers, evidence thresholds. | Kill criteria checklist with threshold and owner. | Recommendation says fund while blockers remain. |
| 7 | Sponsor Accountability | Accountable sponsor, finance owner, delivery owner, risk owner. | Owner matrix. | No named accountable sponsor. |
| 8 | Evidence Ask Before Design | Missing evidence required before Design & Plan. | Evidence request queue. | Evidence gaps not tied to next gate. |

Minimum standard: the CFO can see what is being approved now, what is not being
approved yet, and what evidence is required before full funding.

### A.3 Solution Architecture Pack — Required Table Of Contents

Purpose: select a feasible architecture option and delivery boundary.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Architecture Decision | Selected architecture, rejected alternatives, rationale. | Option scorecard with selected option highlighted. | No selected option. |
| 2 | Enterprise Context | Business users, systems of record, agent surfaces, context layer, Tower. | Architecture context diagram. | Diagram lacks systems of record. |
| 3 | Logical Architecture | Components, responsibilities, ownership, critical dependencies. | Logical architecture diagram with component ownership. | Components are generic boxes only. |
| 4 | Data Flow | Data sources, ingestion, retrieval, prompts, outputs, logs, feedback. | Data-flow diagram with control points. | Data/control path is invisible. |
| 5 | Integration Map | APIs/events/files, readiness, owner, gap status. | Integration readiness map. | Integration gaps omitted. |
| 6 | Build / Buy / Partner Boundary | What to build, buy, partner for, retain internally. | Boundary lane map by capability. | Boundary unclear. |
| 7 | Human Accountability | Human-in-loop points, decision rights, exceptions, approvals. | Human/agent accountability map. | Full autonomy implied without accountability. |
| 8 | Security / Privacy / Risk Controls | Privacy review, model risk, evals, monitoring, data handling. | Control overlay and risk heatmap. | Sensitive workflow lacks controls. |
| 9 | Open Architecture Decisions | Unresolved decisions, owner, due date, gate impact. | Open-decision queue. | Open decisions hidden in prose. |

Minimum standard: an enterprise architect can understand what is being built,
what is being bought, where data flows, where controls sit, and where humans
remain accountable.

### A.4 Estimate And Financial Model — Required Table Of Contents

Purpose: decide whether the estimate is credible enough for planning.

| Order | Section / Workbook Tab | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Executive Summary | Investment range, value range, payback status, confidence, rate-card basis. | Executive economics card. | No statement that rates are benchmark vs client-specific. |
| 2 | Baseline Inputs | Metrics, values, source, as-of, confidence, seed gaps. | Baseline table; gaps flagged in-line. | Missing metric blank instead of seed gap. |
| 3 | Workstream Estimate | AI build, integration, data, foundational, governance, process, change, run. | Workstream cost stack. | Business change omitted. |
| 4 | Role Mix By Phase | Role, domain, specialization, tier, location, headcount, months. | Role mix by phase table and stacked chart. | Generic six-role model for complex enterprise work. |
| 5 | Rate Card And Overrides | Domain, specialization, seniority, provider tier, location, rate, source, confidence, override flag. | Rate-card coverage matrix. | Rate source hidden. |
| 6 | Value Forecast | Gross value, haircut factors, retained value, adoption curve. | Gross-to-net bridge and adoption curve. | Gross value shown as net value. |
| 7 | Sensitivity | Base/conservative/upside, top drivers, breakpoints. | Sensitivity tornado and scenario range chart. | Downside case missing. |
| 8 | Roadmap Cash Flow | Phase cost, cumulative cost, value unlock, cash-flow shape. | Payback/cash-flow curve. | Payback shown when monetization blocked. |
| 9 | Assumption Ledger | Assumption, owner, source, confidence, sensitivity impact. | Ranked assumption table. | Assumptions unowned. |
| 10 | Evidence Notes | Source ledger, refresh date, gaps, audit notes. | Evidence/source table. | Financial number cannot be traced. |

Minimum standard: a sourcing VP or CFO can challenge role mix, rate basis,
delivery location, domain specialization, and sensitivity without asking where
the numbers came from.

### A.5 Costed Business-Case Pack — Required Table Of Contents

Purpose: decide whether to fund, reshape, kill, or approve only the next gate.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Board Answer | Fund/shape/kill, investment, value, payback status, blocker, next ask. | Board decision card plus headline economics strip. | First page does not answer the decision. |
| 2 | Why Now | Trigger, pain, baseline, urgency, sponsor. | Baseline impact chart. | Generic "AI opportunity" framing. |
| 3 | What We Are Funding | Scope, solution, architecture summary, operating change, excluded scope. | Solution context diagram. | Scope boundary missing. |
| 4 | Investment Case | Investment range, workstreams, run cost, build/run/change split. | Investment waterfall and cost stack. | Single investment number only. |
| 5 | Value Case | Gross value, haircut model, net value, adoption curve. | Gross-to-net bridge; adoption curve. | Haircut hidden. |
| 6 | Payback And Sensitivity | Base/conservative/upside, payback, top assumptions, what breaks the case. | Tornado and payback range curve. | Downside case missing. |
| 7 | Roadmap And Gates | Phases, dependencies, value milestones, kill gates. | Phased roadmap swimlane. | No gate where case can be killed. |
| 8 | Risk And Control View | Top risks, controls, mitigations, owners. | Risk/control heatmap. | Risk view disconnected from funding decision. |
| 9 | Assumption Ledger | Top assumptions, owners, confidence, source, sensitivity. | Assumption table. | Assumptions buried in appendix only. |
| 10 | Evidence Appendix | Sources, dates, confidence, seed gaps, reviewer notes. | Evidence/gap matrix. | Missing source for any material claim. |
| 11 | Recommendation And Asks | Decision request, conditions, owner, next gate, requested spend. | Decision checklist. | No explicit "what not to fund yet." |

Minimum standard: a board member can read pages 1-2 and know the decision, then
use pages 3-11 to challenge the case.

### A.6 CFO Pack — Required Table Of Contents

Purpose: approve shaping spend, approve capital, reject, or request evidence.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | The Answer | Finance decision, amount, confidence, blocker, gate. | Executive economics card. | Funding ask unclear. |
| 2 | The Case | Investment, net value, payback status, value source. | Value vs investment chart. | Product advocacy language. |
| 3 | The Five Assumptions | Assumption, owner, confidence, sensitivity, evidence. | Sensitivity stack. | Assumptions unowned. |
| 4 | What Would Make It Wrong | Downside case, breakpoints, monetization gaps. | Tornado chart. | No "what breaks the case." |
| 5 | What Not To Fund Yet | Blocked scope, unfunded autonomy, missing evidence, stop conditions. | Do-not-fund checklist. | No holdback logic. |
| 6 | What Tower Will Measure | Metric, baseline, target, cadence, owner. | Tower measurement table. | Metrics not tied to baseline. |
| 7 | Evidence Used And Missing | Source ledger, seed gaps, confidence, reviewer notes. | Evidence/gap matrix. | CFO cannot audit numbers. |

Minimum standard: finance can identify the funding ask, the downside, the
holdbacks, and the next gate in under one minute.

### A.7 Mobilize And Go-Decision Packet — Required Table Of Contents

Purpose: decide whether to proceed to execution, reshape, or no-go.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Go / No-Go Answer | Proceed/reshape/no-go, conditions, launch owner, next gate. | Go-decision card. | Says go while kill triggers remain. |
| 2 | 30/60/90 Mobilization Plan | Milestones, workstreams, dependencies, decision gates. | 30/60/90 swimlane. | Milestones are generic. |
| 3 | Owners And Decision Rights | RACI, escalation path, retained accountabilities. | RACI matrix. | No accountable owner. |
| 4 | Adoption And Change | Impacted roles, training, comms, incentives, hypercare. | Adoption readiness table. | Change plan is a paragraph. |
| 5 | Controls And Readiness | Security, privacy, evals, data readiness, operations. | Readiness heatmap. | Control gates omitted. |
| 6 | Tower Measurement Handoff | Metric, baseline, target, cadence, owner, forecast link. | Measurement handoff table. | Tower metric not tied to baseline. |
| 7 | Open Action Queue | Action, owner, due date, gate impact. | Action queue. | Gate blockers have no owner. |
| 8 | Signoff | Sponsor, finance, risk, delivery, Tower, open objections. | Signoff matrix. | Signoff confused with final approval. |

Minimum standard: execution teams can see what is ready, what is blocked, and
what Tower will measure without rereading prior documents.

### A.8 Master Move Dossier — Required Table Of Contents

Purpose: serve as the single navigable record of the Move.

| Order | Section | Must contain | Graph / table guidance | Hard omission |
|---:|---|---|---|---|
| 1 | Executive Answer | Recommendation, confidence, investment, value, blocker, next gate. | Decision card; value/investment strip. | Decision below the fold. |
| 2 | Board Memo | 90-second narrative: why now, what to do, what not to fund yet. | Callout metrics only; no dense table. | Memo reads like a system summary. |
| 3 | Decision Timeline | Phase states, revisions, signoffs, changed assumptions. | Timeline with revision markers. | No history of changes. |
| 4 | Discover Chapter | Problem, baseline, gaps, opportunity, go/no-go. | Baseline meter and gap queue. | Missing facts hidden. |
| 5 | Charter Chapter | Value hypothesis, assumptions, sponsor, kill criteria. | Assumption stack and kill checklist. | No sponsor or stop logic. |
| 6 | Architecture Chapter | Selected option, diagrams, integration, control posture. | Context/logical/data-flow/control diagrams. | No diagrammatic architecture. |
| 7 | Economics Chapter | Investment, value, sensitivity, payback, rate basis. | Waterfall, tornado, payback curve. | Table-only financials. |
| 8 | Roadmap Chapter | Phases, dependencies, RACI, adoption, actions. | Swimlane, RACI, action queue. | Roadmap lacks owners. |
| 9 | Tower Chapter | Metrics, baselines, targets, cadence, owners. | Measurement handoff table. | No forecast-to-actual bridge. |
| 10 | Evidence And Gaps | Source ledger, seed gaps, evidence quality. | Evidence/gap matrix. | Claims not traceable. |
| 11 | Downloads | Artifact list, formats, quality scores, hard fails. | Artifact health grid. | Downloads lack quality state. |
| 12 | Review And Signoff | Reviewer verdicts, required actions, open objections. | Signoff matrix. | Signoff implies approval when actions remain. |

Minimum standard: the dossier can replace a live walkthrough. A reviewer can
navigate from the answer to evidence, architecture, economics, roadmap and
Tower handoff without asking where to look.

