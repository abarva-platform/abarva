# AbarVa AI Control Tower · Best-in-Class Plan & Design

**Version:** 1.0 · April 28 2026
**Status:** Prescriptive design specification
**Purpose:** Define what the AI Control Tower must be, how it tracks value across all AI programs and initiatives (Copilot, Claude Code, ServiceNow Now Assist, ERP agents, future-of-work programs), and what the build looks like.

This document is opinionated. It prescribes one direction, not a survey of options. The conviction is that **enterprise AI value tracking today is the same maturity as IT spend tracking was in 2008** — fragmented, license-centric, lagging, and unable to support reallocation decisions. The Tower closes that gap.

> **Note on prior tower work:** A prior session produced `abarva-tower-design-spec-PRIOR.md` and `abarva-tower-build-sequencing-plan.md`. This v1.0 is the consolidated, prescriptive design — it supersedes those for the current build cycle but does not invalidate the prior thinking.

---

## §1 · Position · What the AI Control Tower IS

The Tower is **the portfolio CFO surface for enterprise AI investments**. Single pane of glass over every AI program, every vendor, every dollar spent, every outcome promised, every value captured.

It is the surface where leadership answers four questions in real time:

1. **What are we spending?** Across all AI vendors, all programs, all departments, all use cases.
2. **What are we getting?** Causal value attribution — not adoption, not seats, not vanity metrics. *Actual* cycle time, revenue impact, cost reduction, quality lift.
3. **Where is the pressure?** Active threats to value: shelfware, vendor lock-in, duplicative tools, compliance risk, change fatigue, talent pressure, cost overrun.
4. **What should we do next?** Reallocation, consolidation, scale-up, kill, renegotiate. Each recommendation backed by full provenance and a path to action.

### What the Tower IS NOT

It is not a SaaS spend management tool (Productiv, Zylo, Vendr). Those track licenses; the Tower tracks **value**.

It is not a TBM/ITFM tool (Apptio, Nicus). Those allocate cost to towers; the Tower **attributes outcomes**.

It is not a usage analytics dashboard (Mixpanel for AI). Those track events; the Tower tracks **lift over baseline**.

It is not the Programs surface. Programs is where you *do* the work; the Tower is where you *see the portfolio*.

### Why this matters now

Enterprises in 2026 typically run 10–30 concurrent AI initiatives. The CFO sees:
- M365 Copilot: $5M/year, "good adoption"
- GitHub Copilot: $1.2M/year, engineering says they love it
- Claude Code: $400K/year, pilot phase
- ServiceNow Now Assist: $2.8M/year, mid-rollout
- SAP Joule: $1.5M/year, exec sponsor pushed it
- A dozen point solutions: $3M aggregate, untracked individually
- Shadow AI (ChatGPT Teams, Anthropic Console personal accounts): unknown spend

What they **don't** see:
- Whether Copilot and Now Assist have 60% feature overlap
- Whether Claude Code's $400K is producing $4M of value while M365 Copilot's $5M is producing $1M
- Whether the SAP Joule deal locked them into a 3-year vendor commitment that constrains their CDP architecture
- Whether engineering's Cursor adoption (shadow) is more productive than the sanctioned Copilot
- Whether the talent market is shifting under their feet because AI-fluent candidates are joining only AI-mature shops

The Tower makes all of this visible, attributable, and decidable.

---

## §2 · Outcomes the Tower must produce

The Tower exists to drive five concrete outcomes. Every page, every metric, every Nexus voice line traces back to one of these:

| Outcome | Test |
|---|---|
| **O-1 · Reallocation decisions made faster** | Time from "this isn't working" insight → reallocation decision drops from quarterly to weekly |
| **O-2 · Duplicative spend caught** | Tower flags ≥ 80% of overlapping AI tools within 30 days of overlap emerging |
| **O-3 · Causal value visible per program** | Every AI program has a defensible value number tied to a baseline, not a vendor-promised number |
| **O-4 · Vendor leverage preserved** | No vendor renewal happens without Tower-generated leverage analysis (utilization, alternatives, switching cost) 60 days before |
| **O-5 · Boardroom-ready in one click** | CFO can produce a board-quality AI portfolio review without analyst help |

Every wave delivered to the Tower must move at least one of these outcomes. Waves that don't are deprioritized.

---

## §3 · Conceptual model

### The five primary entities

```
┌─────────────────────────────────────────────────────────┐
│  PORTFOLIO  (the whole tenant's AI estate)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PROGRAM  (e.g., "M365 Copilot Rollout")         │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  INITIATIVE  (e.g., "Finance dept pilot")  │  │   │
│  │  │  ┌──────────────────────────────────────┐  │  │   │
│  │  │  │  OUTCOME  (e.g., "20% faster close") │  │  │   │
│  │  │  └──────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                       ▲
                       │ tracked by
                       │
              ┌────────┴─────────┐
              │   PRESSURES      │ (active threats: cost overrun, shelfware,
              │                  │  duplication, risk, vendor lock, etc.)
              └──────────────────┘
                       ▲
                       │ resolved by
                       │
              ┌────────┴─────────┐
              │   DECISIONS      │ (reallocation, consolidation, kill, scale,
              │                  │  renegotiate — each tied to a program/pressure)
              └──────────────────┘
```

**Portfolio** has one per tenant. **Program** is a major AI initiative, often vendor-anchored (Copilot rollout, Claude Code rollout, ERP-agent rollout, custom internal AI). **Initiative** is a sub-effort within a program (department-specific pilot, use-case-specific pilot). **Outcome** is the promised result, with a value model and baseline.

**Pressure** is a typed concern requiring leadership attention. **Decision** is a logged choice that resolves (or partially resolves) one or more pressures.

### The four lenses

The same portfolio, viewed through four different lenses. Switching lens does not navigate to a new page; it re-projects the same data.

| Lens | What it surfaces |
|---|---|
| **Value lens** | What's producing value, what's not, ranked by ROI |
| **Pressure lens** | Where leadership attention is needed, ranked by severity |
| **Cost lens** | Where money goes, by program/vendor/department |
| **Adoption lens** | Where behavior is changing (or not), by org and use case |

A good Tower experience feels like flipping a Bloomberg terminal between views — same data, different cut, no page reload.

### The time dimension

Every Tower number has a time signature:
- **Now** (real-time or near-real-time, ≤ 24h staleness)
- **Trailing** (T-30, T-90, T-365)
- **Projected** (next 30, 90, 365 days, with confidence interval)
- **Vs baseline** (vs the value model's promised number)
- **Vs last review** (vs what we said at the last quarterly review)

A Tower KPI without all five signatures is incomplete and the Tower flags it.

### The comparison dimension

Numbers that are not comparable are useless. The Tower normalizes:
- **Per dollar spent** (ROI per $)
- **Per seat** (value per seat per month)
- **Per use case** (value per use-case-instance)
- **Vs peer set** (against benchmark from anonymized peer-tenant data via the knowledge fabric)
- **Vs internal baseline** (the program's own pre-launch state)

---

## §4 · Information architecture (the surface map)

The Tower has 13 pages — one for every concern, no overlap, every page earns its place.

### Index pages (3)
- **TWR-IDX-PORTFOLIO** — default; portfolio overview, all programs at a glance, top pressures, KPI band
- **TWR-IDX-LENSES** — same portfolio under each of the four lenses (tab-switchable)
- **TWR-IDX-DECISIONS** — chronological log of portfolio decisions

### Detail pages (5)
- **TWR-DTL-PROGRAM** — drill into one program (e.g., M365 Copilot)
- **TWR-DTL-PRESSURE** — drill into one pressure (e.g., $2.4M LLM inference overrun)
- **TWR-DTL-VENDOR** — drill into one vendor (e.g., Microsoft, Anthropic, ServiceNow)
- **TWR-DTL-OUTCOME** — drill into one promised outcome and its realization
- **TWR-DTL-DECISION** — drill into one decision, its consequences, its provenance

### Workspace pages (3)
- **TWR-FLW-ONBOARD** — bring a new AI program under Tower governance
- **TWR-FLW-REALLOCATE** — portfolio rebalancing simulator + decision flow
- **TWR-FLW-RENEWAL** — vendor renewal preparation workspace

### State pages (2)
- **TWR-EMP-NO-PROGRAMS** — empty (early-stage tenant)
- **TWR-ERR-PROGRAM-NOT-FOUND** — error

That is the entire Tower. Every page connects to at least three others; the graph is dense by design.

---

## §5 · Per-page design specifications

### TWR-IDX-PORTFOLIO · default

**Purpose:** The CFO opens this page once a day. In 30 seconds they should know: total spend, total value captured, top three pressures, top three decisions pending.

**Layout (working pane, top to bottom):**

1. **KPI band — 5 cards in a row**
   - Total annualized AI spend (run rate) · sparkline 90d · vs plan variance
   - Total value captured (rolling 90d, attributed) · sparkline · vs target variance
   - Portfolio ROI (multiple) · arrow indicator
   - Active pressures count · severity-weighted dot
   - Decisions pending review · count

2. **Pressure heat strip** — horizontal band of all open pressures, color-coded by severity, sorted by $ impact. Click any to navigate to TWR-DTL-PRESSURE.

3. **Program portfolio matrix** — 2×2 bubble chart, x-axis = adoption health, y-axis = value captured, bubble size = annual spend, color = pressure status. Each program is a bubble. M365 Copilot, Claude Code, Now Assist, Joule, etc., all visible at once. Click a bubble to open TWR-DTL-PROGRAM.

4. **Top 5 programs by value at risk** — table: program, value at risk, top driver, owner, last review. Click row → TWR-DTL-PROGRAM.

5. **Vendor concentration band** — horizontal stacked bar showing % of AI spend by vendor. Microsoft 38%, Anthropic 12%, ServiceNow 22%, etc. Identifies vendor concentration risk.

6. **Recent decisions** — last 10 decisions with one-line context. Click any → TWR-DTL-DECISION.

**Nexus voice on this page (Nexus is lead on Tower):**

> *"Portfolio at $14.2M annualized · value captured $9.8M trailing 12-mo · ROI 0.69x. Three pressures > $1M: M365 Copilot adoption gap (24%), LLM inference overrun ($2.4M), Now Assist + Copilot duplication ($1.2M). Renewal window opens for Microsoft in 47 days — leverage analysis attached."*

**Suggested actions (3):**
- A · Open M365 Copilot adoption pressure → TWR-DTL-PRESSURE
- B · Review duplication recommendation → TWR-FLW-REALLOCATE
- C · Prepare Microsoft renewal brief → TWR-FLW-RENEWAL

---

### TWR-IDX-LENSES · the four-cut view

**Purpose:** Tab between value · pressure · cost · adoption lenses without page navigation.

**Layout:**
- Tab strip at top: [VALUE] [PRESSURE] [COST] [ADOPTION]
- Same data table below; columns and sort change per lens

**Value lens columns:**
Program · Annual spend · Value captured 90d · Value attributed (causal) · ROI · Trajectory · Owner

**Pressure lens columns:**
Program · Active pressure · Severity · $ impact · Days open · Driver · Recommended action

**Cost lens columns:**
Program · Annual spend · Spend by department · % of AI budget · Variance vs plan · Trend

**Adoption lens columns:**
Program · Eligible users · Active users · MAU/eligible % · Behavior change index · Trajectory

The tab change is instant — no loading state, no route navigation. Same dataset, different projection.

---

### TWR-IDX-DECISIONS · the decisions log

**Purpose:** Audit trail of every portfolio decision. Single chronological log, filterable.

**Layout:**
- Filter bar: [date range] [decision type] [program] [decided by] [status]
- Timeline view: each decision = a card with date, decision title, program, $ impact, status, decided-by, link to source pressure
- Decisions in last 14 days highlighted with peach accent

Decision types: `kill`, `scale`, `consolidate`, `renegotiate`, `pivot`, `defer`, `pilot-extend`.

---

### TWR-DTL-PROGRAM · single program drill-down

**Purpose:** One program, end-to-end view. The page Engineering, Finance, and the CFO all want when discussing "how is M365 Copilot doing?"

**Layout:**

1. **Program header**
   - Program name, vendor, annualized spend, owner, lifecycle phase
   - Linked Source events (e.g., "Anchored in: Microsoft Enterprise Agreement renewal 2026 BAFO Stage 7")
   - Linked Programs (in the AbarVa Programs sense — the operational rollout work)

2. **Value model panel**
   - Typed value model for this program type (see §6)
   - Promised outcomes (from the program's original business case)
   - Realized values, time series
   - Variance: realized vs promised
   - Confidence in attribution (e.g., "high" if A/B-tested, "medium" if matched-cohort, "low" if survey-based)

3. **Adoption panel**
   - Eligible users, active users, MAU
   - Adoption by department (heatmap)
   - Power users vs casual users distribution
   - Behavior change indicators (specific to program type)

4. **Cost panel**
   - License count vs deployed
   - Effective per-user cost
   - Department allocation
   - Spend trajectory

5. **Pressure panel**
   - Active pressures on this program
   - Each linkable to TWR-DTL-PRESSURE

6. **Vendor panel**
   - Vendor performance scorecard
   - Renewal date, switching cost estimate
   - Linked to TWR-DTL-VENDOR

7. **Decisions log (program-scoped)**
   - All decisions affecting this program
   - Linked to TWR-DTL-DECISION

8. **Actions strip (bottom)**
   - "Open reallocation simulator" → TWR-FLW-REALLOCATE pre-loaded with this program
   - "Schedule program review"
   - "Export to board materials"

**Nexus voice on this page (program-specific):**

> *"M365 Copilot: $5.0M annualized, 12,400 eligible users, 2,950 active (24% adoption — below the 60% threshold for ROI breakeven). Finance and Legal are the lowest-adoption depts; Engineering is high-adoption but mostly using GitHub Copilot for the same use cases. Recommendation: scope a 90-day Finance acceleration sprint or accept lower-bound projections."*

---

### TWR-DTL-PRESSURE · single pressure drill-down

**Purpose:** One pressure, full forensics. When something is yelling for attention, this is where you go.

**Layout:**

1. **Pressure header**
   - Title (e.g., "LLM Inference cost overrun"), severity, $ impact, days open, programs affected
   - Trajectory indicator (worsening / stable / resolving)

2. **Driver decomposition** — what's actually causing this
   - Bar chart of contributors (e.g., "Inference volume +220% vs plan = $1.8M; rate-card miss = $400K; misallocation across regions = $200K")
   - Each driver linkable to its source data

3. **Impact projection**
   - If unresolved at current trajectory, projected impact at 30 / 90 / 365 days
   - Confidence interval

4. **Recommended actions** (typed)
   - Action 1: Negotiate rate card with Microsoft (estimated $180K/yr recovery)
   - Action 2: Move 40% of inference to Anthropic Bedrock (estimated $90K/yr recovery)
   - Action 3: Implement caching layer on top use cases (estimated $60K/yr recovery)
   - Each action has cost, time-to-impact, risk, owner

5. **Linked Source events**
   - The vendor decisions that contributed (e.g., "Linked: AMS Vendor Consolidation 2026 Stage 7 BAFO — vendor architecture decision constrains options")

6. **History**
   - Timeline of how this pressure emerged
   - Previous decisions that touched it

7. **Decision capture form**
   - Inline form: choose recommended action, add rationale, submit → creates TWR-DTL-DECISION entry

**Nexus voice:**

> *"LLM inference is at $4.8M annualized, $2.4M over plan. 73% of overrun is volume-driven (programs are scaling faster than budgeted) — the rest is rate-card mismatch. The AMS vendor architecture decision pending in Source will lock in your inference vendor for 36 months. Three options on the table; recommend (a) for 60-day cost relief and (b) for structural protection."*

---

### TWR-DTL-VENDOR · single vendor drill-down

**Purpose:** Vendor-level view. When you're preparing for a renewal or a renegotiation, you live here.

**Layout:**

1. **Vendor header** — name, total spend across all programs, contract end dates
2. **Programs spanned** — every program touching this vendor with $ allocation
3. **Performance scorecard** — uptime, response latency, support quality, security incidents, deal commitments hit/missed
4. **Switching analysis** — cost to migrate off (engineering hours, data movement, retraining), alternatives ranked
5. **Renewal calendar** — upcoming milestones (90-day, 60-day, 30-day, signing)
6. **Leverage indicators** — utilization rate, market alternatives strength, recent vendor pricing trends, our walkway probability

---

### TWR-DTL-OUTCOME · single outcome drill-down

**Purpose:** Promised outcomes are often forgotten by month 3. This page makes them un-forgettable. Single outcome, tracked over time, with full provenance.

**Layout:**

1. **Outcome header** — promised value, promise date, deadline, current realization
2. **Value model** — exactly how this outcome's value is calculated, with formula visible (no black boxes)
3. **Baseline** — what was the pre-program state, with citation
4. **Realization timeline** — value captured month over month
5. **Confidence**: causal evidence quality (RCT / matched cohort / survey / self-reported)
6. **Variance explanation** — when realization < promise, *why*

---

### TWR-DTL-DECISION · single decision drill-down

**Purpose:** Every decision is logged with full provenance. When it goes wrong (and some will), there's no "who decided that?" debate.

**Layout:**

1. **Decision header** — title, type (kill/scale/consolidate/etc.), date, decided by, effective date
2. **Context** — what was the pressure that prompted this; what was the recommendation
3. **Decision text** — the actual decision in plain language
4. **Provenance** — what data backed the decision; links to TWR-DTL-PRESSURE, TWR-DTL-PROGRAM
5. **Consequences** — what happened after; track for 90 days minimum
6. **Audit signatures** — who approved, when

---

### TWR-FLW-ONBOARD · bring a new AI program under Tower

**Purpose:** You can't track what isn't in the system. Onboarding flow guides bringing a new program in.

**Multi-step flow:**

1. **Identify** — name, vendor, type (coding / productivity / ERP / service-desk / ops / FoW / custom), business sponsor, technical owner
2. **Value model** — pick from the typed catalog (§6) or define custom; set baseline; set promised outcomes
3. **Cost model** — license / consumption / hybrid; expected annual spend; allocation by department
4. **Telemetry sources** — connect data feeds (vendor APIs, internal usage logs, finance system); validate provenance
5. **Pressures pre-flight** — Tower runs initial pressure analysis; surfaces obvious risks (e.g., "this overlaps 60% with M365 Copilot")
6. **Confirm & onboard** — program enters the portfolio; first review scheduled

---

### TWR-FLW-REALLOCATE · portfolio rebalancing simulator

**Purpose:** "What if we kill program X and scale program Y?" Answered in 60 seconds with confidence interval.

**Layout:**

1. **Current portfolio** — view of present state
2. **Simulation panel** — sliders / toggles for each program (kill / scale up / scale down / hold)
3. **Projected impact** — total spend change, total value change, ROI shift, risk shift
4. **Pressure resolution** — which currently-open pressures get resolved by this configuration
5. **New pressures created** — what new pressures emerge (e.g., killing a program creates "talent exodus" pressure)
6. **Implementation plan** — auto-generated phased plan if the configuration is committed
7. **Save scenario** — save as a TWR-DTL-DECISION draft

---

### TWR-FLW-RENEWAL · vendor renewal preparation

**Purpose:** Renewal-readiness. Auto-prepares the negotiation brief 90 / 60 / 30 days before vendor contract expiry.

**Sections produced automatically:**

1. **Utilization summary** — license count, MAU, $ per active user
2. **Value attribution** — what we got for the spend
3. **Pressure summary** — what's gone wrong, what's gone right
4. **Alternatives analysis** — competitive options with switching cost
5. **Walkway analysis** — what we'd lose / save by walking away
6. **Recommended position** — with target price, walkaway price, must-haves, nice-to-haves

This is what the CFO walks into the renewal meeting with.

---

### TWR-EMP-NO-PROGRAMS, TWR-ERR-PROGRAM-NOT-FOUND

Standard empty/error states. Empty state offers TWR-FLW-ONBOARD as the primary action.

---

## §6 · Value model framework · the typed value layer

The most important design decision in the Tower is the **typed value model**. Each program type has its own value formula; the Tower normalizes these so they're comparable.

### The seven program types

| Type | Examples | Primary value mechanism |
|---|---|---|
| **T-CODE** | GitHub Copilot, Claude Code, Cursor, Tabnine | Engineering velocity + quality |
| **T-PROD** | M365 Copilot, Google Duet, Notion AI | White-collar time recovery |
| **T-SVC** | ServiceNow Now Assist, Zendesk AI, Intercom Fin | Ticket deflection + agent productivity |
| **T-ERP** | SAP Joule, Workday AI, Oracle AI Apps | Process automation + decision support |
| **T-OPS** | Datadog Bits AI, PagerDuty AIOps, custom MLOps | Operational efficiency + incident reduction |
| **T-CUST** | Custom internal AI agents, CDP-tied AI, RAG apps | Domain-specific (varies by use case) |
| **T-FOW** | Future-of-work programs, change management, talent-AI | Org capability + retention + skill shift |

### Value model per type (the actual math)

#### T-CODE · Coding agents

```
Annual Value =
  (Δ PR throughput per dev per month × dev hourly cost × 160 hr/mo × dev count × 12)
+ (Δ PR quality lift × downstream defect cost avoided)
+ (Δ time-to-merge reduction × incident cost avoided)
- (license cost + change management cost)

Where:
  Δ PR throughput = post-rollout PRs/dev/mo − pre-rollout baseline
  Confidence: HIGH if A/B test ran; MEDIUM if cohort match; LOW if self-report
```

Concrete example: **Claude Code rollout for a 200-engineer org**
- Baseline: 4.2 PRs/dev/month
- Post-rollout: 5.8 PRs/dev/month (+38%)
- Engineer hourly fully-loaded: $120
- Hours saved: ~14/month/dev × $120 × 200 × 12 = **$4.03M/yr value**
- Quality lift: 8% fewer revert PRs, ~$200K/yr defect avoidance
- License cost: $400K/yr
- **Net annual value: $3.83M, ROI 9.6x**

This is what the Tower shows. Not "high adoption" or "developers love it." A defensible number.

#### T-PROD · Productivity agents (Copilot, Duet, etc.)

```
Annual Value =
  (Δ time-recovered per user per week × hourly cost × 52 × active user count)
× (utilization-weighted attribution factor)
+ (Δ output quality lift × business value of higher-quality output)
- (license cost × seat count + change management cost)

Where:
  utilization-weighted attribution factor =
    (active power users × 1.0) + (regular users × 0.5) + (occasional × 0.15) / total seats

  Confidence: typically MEDIUM — survey + log-based, rarely true experimental
```

This is where most enterprises overstate value. Vendor says "5 hours/week saved per user × 12,000 users × $80/hour = $25M." The Tower's discipline:
- Time-saved is self-reported; apply 0.4 confidence haircut
- Active-users is 24% of seats; apply attribution factor
- Result: not $25M — actually $2.4M
- License cost: $5M
- **Net: NEGATIVE value at current adoption**

This kind of number is uncomfortable. But it's the truth, and it's what enables the reallocation decision.

#### T-SVC · Service desk / customer service AI

```
Annual Value =
  (deflection rate × ticket volume × cost per ticket avoided)
+ (Δ first-contact resolution × CSAT-tied revenue retention)
+ (Δ agent handle time × agent hourly cost × ticket volume served by humans)
- (license cost + integration cost)

Confidence: HIGH (ticket logs are objective)
```

Example: ServiceNow Now Assist at a 50,000-employee org
- Internal IT tickets: 80,000/year
- Cost per ticket avoided: $32 (loaded)
- Deflection rate: 28%
- Value: 80,000 × 0.28 × $32 = $716K/yr
- Plus agent productivity on remaining: ~$400K
- License cost: $2.8M
- **Net: -$1.7M annual** unless deflection rate hits 50%+

#### T-ERP · ERP agents (Joule, Workday AI)

```
Annual Value =
  (process-automation cycle time reduction × volume × hourly cost)
+ (Δ forecast/decision accuracy × downstream impact)
+ (audit / compliance cost reduction)
- (license cost + integration cost + change management)

Confidence: typically MEDIUM — depends on integration depth
```

#### T-OPS · Operations AI

```
Annual Value =
  (incidents prevented × MTTR reduction × incident cost)
+ (alert noise reduction × ops engineer hours)
+ (capacity-planning accuracy lift × infra cost saved)
- (tooling cost)

Confidence: HIGH (incident data is objective)
```

#### T-CUST · Custom internal AI

Bespoke per use case. Value model defined at TWR-FLW-ONBOARD. The Tower enforces discipline (must have baseline, must have promised outcome, must have measurement plan) but doesn't prescribe the formula.

#### T-FOW · Future of work programs

```
Annual Value =
  (talent retention lift × replacement cost avoided)
+ (skill-coverage gap closure × strategic-capability premium)
+ (org velocity × compounding effect)
- (program cost + opportunity cost)

Confidence: typically LOW — composite indicator; tracked as leading vs lagging
```

The Tower is honest about confidence. T-FOW programs get LOW confidence; that doesn't mean they're not valuable, it means leadership should make decisions about them with appropriate epistemic humility.

### The normalization layer

Every program, regardless of type, gets normalized to four comparable metrics:

1. **ROI multiple** = (value − cost) / cost, expressed as "Nx"
2. **Cost per active user per month**
3. **Value per active user per month**
4. **Risk-adjusted ROI** = ROI × confidence factor (HIGH=1.0, MEDIUM=0.6, LOW=0.3)

These four numbers are what makes the portfolio bubble chart on TWR-IDX-PORTFOLIO actually meaningful.

---

## §7 · Pressure system · typed pressures

A **pressure** is a typed, severity-rated, programs-affecting concern that requires leadership attention. Pressures are first-class entities in the Tower (same as programs). They have their own pages, their own decisions, their own audit trails.

### The eight pressure types

| Type | What it indicates | Detection signal | Severity drivers |
|---|---|---|---|
| **P-COST** | Spending exceeding plan or value justification | Spend variance, ROI < 1 | $ overrun, % overrun |
| **P-ADOPT** | Licenses bought but not used (shelfware) | MAU/seat ratio | Magnitude of unused $ |
| **P-VALUE** | Value not materializing as projected | Realized < promised, > 90 days post-launch | Variance, time elapsed |
| **P-DUPL** | Two or more tools serving overlapping use cases | Use-case overlap analysis (graph store) | Spend in overlap zone |
| **P-RISK** | Compliance, security, or quality incident exposure | Incident logs, audit findings | Severity of incident |
| **P-VEND** | Vendor concentration, lock-in, or pricing change | Vendor share %, contract terms, market signals | Switching cost, dependency |
| **P-TLNT** | Org not absorbing the change; talent gap or fatigue | Adoption variance by dept, exit interviews | Strategic-capability impact |
| **P-SUB** | Substitution by alternative (sanctioned or shadow) | Shadow-tool usage telemetry | $ cannibalized |

### Severity model

Severity is computed from $ impact × time-decayed urgency, normalized to four buckets:

| Severity | $ impact | Visual |
|---|---|---|
| **Critical** | > $500K/yr | Rust dot |
| **High** | $100K–$500K/yr | Peach dot |
| **Medium** | $25K–$100K/yr | Amber dot |
| **Low** | < $25K/yr | Mint dot (resolved-able) |

The home page (HOM-IDX-DEFAULT) currently surfaces pressures > $1M as the "Tower Pressure" card. That threshold is tunable in `tower-config.ts`.

### Pressure lifecycle

```
emerged → triaged → in-decision → resolved
                  ↓
                escalated  → resolved-with-decision
                  ↓
              accepted-as-risk
```

Every pressure that lasts > 90 days without movement gets a "STALE" badge. Stale pressures are reviewed quarterly with the option to either resolve, escalate, or formally accept-as-risk (which removes from active board but logs to risk register).

### Pressure detection (the silent layer)

The Tower runs continuous pressure detection in the background. When new data arrives (usage logs, finance feeds, vendor signals), it re-scores all programs and surfaces new pressures. Detection rules are typed by pressure type — see §8 for data contract.

---

## §8 · Knowledge fabric data contract

The Tower has the most demanding data integration of any AbarVa surface. It draws from:

### Internal data (within AbarVa)
- **Source events** — vendor BAFOs, contracts, scorecards (from `src/lib/source/*`)
- **Programs** — program delivery state, milestones (from `src/lib/programs/*`)
- **Intelligence** — patterns, contradictions, industry signals (from `src/lib/intelligence/*`)
- **Setup** — connector configurations, data feed health (from `src/lib/setup/*`)

### External data (via connectors)

- **Vendor usage APIs**
  - Microsoft Graph for M365 Copilot usage
  - GitHub API for Copilot for Business metrics
  - Anthropic Console for Claude Enterprise usage
  - ServiceNow Now Assist API
  - SAP / Workday usage logs
  - Custom AI app telemetry (via OpenTelemetry feed)

- **Finance systems**
  - GL feed (chart of accounts mapped to AI cost categories)
  - PO/contract data
  - Vendor invoices

- **HR systems**
  - Headcount by department / role
  - Engagement / retention metrics
  - Skills inventory

- **Engineering / IT systems**
  - PR throughput data (GitHub, GitLab)
  - Incident data (PagerDuty, OpsGenie)
  - Ticket data (ServiceNow, Jira)

### Data contract

Every Tower number carries provenance:

```ts
type TowerProvenance = {
  // Required for all Tower-rendered values
  createdFrom:
    | 'deterministic_read_model'
    | 'connector_feed'
    | 'gateway_compose'
    | 'human_authored'
    | 'inferred_attribution';

  // Where the underlying data lives
  storeKey: 'relational' | 'vector' | 'graph' | 'object' | 'evidence_ledger';

  // Freshness
  observedAt: Date;
  ttlSeconds: number;

  // Quality signal
  confidence: 'high' | 'medium' | 'low';
  attributionMethod?: 'experimental' | 'cohort_match' | 'survey' | 'log_inference' | 'self_report';

  // Lineage
  upstreamSources: string[]; // connector IDs, source event IDs, program IDs
  evidenceLedgerEntryId: string;
};
```

Per the iceberg principle, this provenance is invisible by default but visible inside the Evidence Drawer (`TWR-DTL-OUTCOME` shows it visibly because outcomes are a defensibility surface).

### The "Tower can refuse" rule

If a program has insufficient data to produce a defensible value number, the Tower refuses to display a fake number. Instead it shows:

> **`<MissingInputChip type="value_data" program="M365 Copilot Finance Pilot" missing={['baseline_data', 'attribution_method']} />`**
>
> *"Value can't be computed — missing baseline measurement and attribution method. [Configure] to enable."*

This is critical. A black-box vendor-promised number is worse than an honest "we don't know."

---

## §9 · Agent voice · Nexus on Tower

Tower is **Nexus-led**. Nexus's voice on Tower is *portfolio strategist* — different from Nexus on Programs (operational maestro) or Sentinel on Source (validator).

### Voice register on Tower

Nexus on Tower:
- Speaks in **portfolio terms** (totals, ratios, comparisons)
- **Surfaces tradeoffs**, not individual moves
- **Quantifies confidence** explicitly when proposing reallocation
- **Names the decision-maker** for each recommendation (CFO / CIO / CTO / Sponsor)
- **Connects across surfaces** (links Source decisions to Program outcomes to Tower pressures)

Compare:

> **Nexus on Programs** (per APX-CDP-2026): *"Workshop 5 is blocking the Design gate. Highest-leverage move today is to clear it. AMS BAFO is also on the path; do it Friday after the workshop."*
>
> **Nexus on Tower** (portfolio): *"AI portfolio at 0.69x ROI; M365 Copilot is the largest negative contributor at -$1.7M. Two reallocation paths produce 0.94x by Q3: (a) shift Copilot seats from Finance to Engineering, or (b) consolidate Copilot + Now Assist for Finance use cases. Path (b) requires Microsoft renewal leverage analysis — that work is in flight."*

### What Nexus on Tower never says

- Vague optimism ("adoption is strong"). Always quantified.
- Single-program recommendations without portfolio context.
- "Investing in AI is the right thing." Never normative; always tradeoff-framed.
- Vendor-promised numbers without confidence flagging.

### Voice density rule

On TWR-IDX-PORTFOLIO: 2–3 sentences. On detail pages: 3–5 sentences. Voice quote density is regulated to keep the agent column ~30% of working pane usefulness; longer voice means less attention on the actual content.

---

## §10 · Cross-surface integration

The Tower is the most connected surface in AbarVa. It is the synthesis point.

### Tower → Programs (operational rollouts)

When a Tower decision says "scale Claude Code adoption to 100% of engineering," that creates or modifies a Program in the Programs surface. The Tower writes the decision; Programs executes it.

Bidirectional link: `TowerProgram.linkedProgramIds: string[]` and `Program.linkedTowerProgramIds: string[]`.

### Tower → Source (vendor decisions)

When a Tower pressure says "renegotiate Microsoft EA," that triggers a sourcing event in the Source surface. The Tower flags the need; Source runs the procurement.

Bidirectional link: `TowerProgram.linkedSourceEventIds: string[]` and `SourcingEvent.linkedTowerProgramIds: string[]`.

### Tower → Intelligence (patterns)

The Tower consumes patterns from Intelligence. Examples:
- "Companies with >40% Copilot adoption have 2.1x higher ROI" — pattern from Intelligence
- "Vendor pricing trend shows 12% YoY increase for AI seats" — Industry signal from Intelligence
- "Shadow-AI adoption typically lags sanctioned by 6 months" — pattern

These appear on relevant Tower pages as referenced (with `IND-SIGNAL` or `PATTERN-REF` markers).

### Tower → Setup (data feed health)

The Tower depends on connectors. When a connector breaks (e.g., M365 Graph API throttled), the Tower cannot compute fresh values. Setup health propagates to Tower as a meta-pressure: `P-DATA-HEALTH`.

### Tower → Home (executive landing)

Home (HOM-IDX-DEFAULT) shows Tower's top pressure card. The pressure that makes the cut is the highest-severity active pressure, refreshed in real time.

---

## §11 · Best-in-class principles (the design conviction)

### BIC-1 · Causal, not correlative
Every value number has an attribution method declared. Self-reported time savings get a 0.4 haircut. Survey data gets a 0.6 haircut. Cohort-matched gets 0.85. Experimental gets 1.0. The math is honest.

### BIC-2 · Real-time, not lagging
Connector data is refreshed at least daily. The Tower's "now" view is ≤ 24h stale. Quarterly board decks are produced from the Tower, not the other way around.

### BIC-3 · Comparable, not bespoke
The four normalized metrics (ROI multiple, cost/user/mo, value/user/mo, risk-adjusted ROI) make every program comparable to every other program. M365 Copilot vs Claude Code becomes a real comparison, not a vibes assessment.

### BIC-4 · Tied to decisions
Every pressure has a recommended action. Every action has an owner. Every decision has consequences tracked. The Tower is not a dashboard — it's a decision-driving instrument.

### BIC-5 · Connected to Source and Programs
Vendor decisions in Source flow into Tower constraints. Tower decisions flow into Programs work. The graph is dense; nothing exists in isolation.

### BIC-6 · Self-correcting
The Tower flags its own data quality. Missing baselines, low-confidence attribution, stale connectors — all surface as meta-pressures (`P-DATA-HEALTH`). The Tower distrusts itself appropriately.

### BIC-7 · Catches waste
Duplication detection (`P-DUPL`) is automated. Shelfware detection (`P-ADOPT`) is automated. Vendor concentration risk (`P-VEND`) is automated. Leadership doesn't have to ask; the Tower asks for them.

### BIC-8 · Forward-looking
Every metric has a projection (30/90/365 days) with confidence interval. Renewal calendar runs 12 months out. Pressure trajectories are visible.

### BIC-9 · Boardroom-ready
TWR-FLW-RENEWAL produces vendor renewal briefs in one click. TWR-IDX-DECISIONS produces audit logs. The Tower outputs are board-quality without analyst help.

### BIC-10 · Defensible
Every number traces to provenance. When the CFO is asked "where did that ROI number come from?" they can show the lineage in three clicks: Tower number → value model → upstream sources → connector → vendor API call → timestamp.

---

## §12 · Use case walkthroughs

How each of the founder's specific examples works through the Tower.

### Walkthrough 1 · M365 Copilot rollout

**Onboarding (TWR-FLW-ONBOARD):**
- Type: T-PROD
- Vendor: Microsoft
- Promised outcomes (from business case): "Save 5 hrs/week per knowledge worker"
- Cost: $5M/yr
- Eligible: 12,000 users
- Baseline: time-tracking sample taken pre-rollout
- Telemetry: M365 Graph API for usage; HRIS for headcount; survey instrument for self-report

**Steady state (TWR-DTL-PROGRAM):**
- Adoption: 24% MAU/eligible (low)
- Self-reported time saved: 4.2 hrs/wk by power users, 1.1 hrs/wk by occasional
- Attribution-weighted: 1.8 hrs/wk × $80/hr × 12,000 × 52 × 0.4 confidence haircut = **$3.6M attributed value**
- Cost: $5M
- **ROI: 0.72x** — below 1.0 breakeven
- Pressure surfaced: `P-ADOPT` (severity high, $1.6M shelfware)
- Pressure surfaced: `P-DUPL` (overlaps with Now Assist on summarization use cases, $0.8M)

**Recommended action (Nexus voice):**
> *"Two paths. Path A: 90-day Finance acceleration sprint to lift Finance adoption from 14% to 50% — projected to add $1.1M value, ROI moves to 0.94x. Path B: Consolidate Now Assist + Copilot for summarization (shift Now Assist seats to high-value use cases only) — saves $0.6M, ROI moves to 0.84x. Path A and B are not mutually exclusive."*

### Walkthrough 2 · Claude Code rollout for engineering

**Onboarding:**
- Type: T-CODE
- Vendor: Anthropic
- Promised outcomes: "30% PR throughput lift, 10% defect reduction"
- Cost: $400K/yr (200 engineers, $200/seat/month)
- Baseline: 4.2 PRs/dev/month, established via 90-day pre-rollout cohort

**Steady state:**
- Adoption: 88% MAU/eligible (high)
- PR throughput post: 5.8/dev/mo (+38%)
- Quality: 8% revert rate reduction
- Attribution: cohort-match (HIGH confidence)
- Calculated value: **$3.83M/yr**
- **ROI: 9.6x — highest in portfolio**

**Tower behavior:**
- This program is the green bubble in TWR-IDX-PORTFOLIO's bubble chart
- Nexus voice on this program: *"Claude Code is your highest-ROI AI program at 9.6x. Engineering wants to expand from 200 to 350 seats; cost goes to $700K/yr; projected value at $6.7M assuming linear scale. Constraint: Anthropic enterprise commitment in current Source event covers 280 seats — expansion above that requires renegotiation."*

**Cross-surface flow:**
- Tower pressure: `P-CAPACITY` on Claude Code
- Spawns Source event: "Claude Code seat expansion 2026"
- Spawns Program: "Claude Code rollout to remaining 150 engineers"

### Walkthrough 3 · ServiceNow Now Assist rollout

**Onboarding:**
- Type: T-SVC
- Vendor: ServiceNow
- Promised outcomes: "40% IT ticket deflection, $1.5M annual savings"
- Cost: $2.8M/yr
- Baseline: 80,000 IT tickets/year, $32 cost/ticket loaded

**Steady state:**
- Deflection rate: 28% (below 40% promise)
- Value: 80,000 × 0.28 × $32 = $716K
- Plus agent productivity: $400K
- Total: **$1.12M attributed**
- Cost: $2.8M
- **ROI: 0.40x — far below promise**

**Pressures surfaced:**
- `P-VALUE` (severity critical, $1.7M shortfall)
- `P-DUPL` (overlaps with M365 Copilot for FAQ summarization, $0.6M)

**Recommended action:**
> *"Now Assist is at 28% deflection vs 40% promised. Two structural issues: (a) knowledge-base integration is at 60% completeness, capping deflection ceiling; (b) 30% of current usage is duplicative of Copilot. Path forward: complete KB integration (estimated 90 days, $200K cost, lifts deflection to 38%, adds $260K/yr value); narrow Now Assist scope to ITSM-specific use cases. If we don't move on (a) by Q3, recommend descope at next renewal."*

### Walkthrough 4 · ERP agent rollout (SAP Joule or Workday AI)

**Onboarding:**
- Type: T-ERP
- Vendor: SAP
- Promised outcomes: "Reduce month-end close from 8 days to 5 days"
- Cost: $1.5M/yr (license + integration)

**Steady state:**
- Process automation: 64 routine tasks now AI-handled
- Decision-support: forecast variance reduced 14%
- Month-end close: 7 days (target 5)
- Value calculation: complex; finance team labor saved + faster close cycle business value
- Confidence: MEDIUM (integration depth = strong; attribution = mostly cohort-match)

**Special consideration:**
- Vendor lock: SAP Joule is tied to SAP S/4HANA core; switching cost extreme
- Pressure: `P-VEND` (severity medium, "concentration risk")
- Renewal calendar: 18 months out — no near-term decision needed
- Tower flags this as a *strategic* program, not a tactical one — different review cadence

### Walkthrough 5 · Future-of-work programs

**Onboarding:**
- Type: T-FOW
- Vendor: (mixed — internal program)
- Promised outcomes: "Increase AI-fluency to 60% of workforce; reduce time-to-productivity for new hires by 30%"
- Cost: $2M/yr (training, change management, tooling)

**Steady state:**
- Skills coverage: 38% AI-fluent (target 60%)
- Time-to-productivity: marginal change
- Confidence: LOW (composite indicator, leading-vs-lagging unclear)
- Value: explicitly flagged as "indicative, not defensible"

**Tower behavior:**
- T-FOW programs are shown on TWR-IDX-PORTFOLIO with a **dashed bubble outline** indicating low-confidence value attribution
- Nexus voice: *"Future-of-work program is showing leading indicators (skills coverage trending up). Lagging indicators (productivity, retention) won't be readable for 6-9 months. Recommend continuing investment with quarterly review; do not over-rotate based on early data."*
- Pressure: `P-TLNT` if skills coverage trajectory falls below trajectory needed to hit target

**This is the key honest move:** the Tower doesn't pretend T-FOW programs have the same kind of value defensibility as T-CODE programs. It surfaces them as strategic bets with leading indicators, not as ROI plays. Leadership makes those decisions with appropriate epistemic humility.

---

## §13 · Build wave plan

Following the orchestration spec, the Tower module gets its own per-module spec with waves T0–T7.

| Wave | Title | Catalog entries shipped | Notes |
|---|---|---|---|
| **T0** | Audit & spec | — | Per-module spec authored; gap analysis vs current 12 components in `src/components/tower/` |
| **T1** | Shell + index foundations | TWR-IDX-PORTFOLIO (skeleton) | AppShell wrap; portfolio table only (no chart yet) |
| **T2** | Bubble chart + lenses | TWR-IDX-PORTFOLIO (full), TWR-IDX-LENSES | Visual peak — bubble chart, lens tabs |
| **T3** | Program detail | TWR-DTL-PROGRAM | Most-trafficked drill-down |
| **T4** | Pressure system | TWR-DTL-PRESSURE, TWR-IDX-DECISIONS | Pressure detection rules + decision log |
| **T5** | Vendor & outcome detail | TWR-DTL-VENDOR, TWR-DTL-OUTCOME, TWR-DTL-DECISION | Defensibility surfaces |
| **T6** | Workspaces (heavy) | TWR-FLW-ONBOARD, TWR-FLW-REALLOCATE, TWR-FLW-RENEWAL | Largest wave — flows |
| **T7** | States + connector polish | TWR-EMP-NO-PROGRAMS, TWR-ERR-PROGRAM-NOT-FOUND, connector health | Closes module |

### Tower-specific dependencies

- **T1 depends on:** SHELL-3 (AppShell) shipped — already done
- **T2 depends on:** Programs `linkedTowerProgramIds` data plumbed — requires PROG-* coordination
- **T3 depends on:** Source `linkedTowerProgramIds` data plumbed — requires SRC-* coordination
- **T4 depends on:** at least one connector live (Microsoft Graph or GitHub recommended) — requires SET-* progress
- **T5 depends on:** Intelligence patterns surface ready — requires INT-* progress
- **T6 depends on:** all detail pages (T3, T4, T5) shipped

This makes Tower a **late module** in the build sequence — it integrates everything else.

### Smoke test

**T-SMOKE-PORTFOLIO** — three-program portfolio (Copilot, Claude Code, Now Assist seeded) renders end-to-end with:
- Real bubble chart positions based on value model output
- At least one pressure of each severity present
- Cross-surface link to Source AMS event resolves
- Renewal calendar shows Microsoft renewal entry
- Reallocation simulator produces a coherent counterfactual

If T-SMOKE-PORTFOLIO breaks, no Tower wave merges — same discipline as S-SMOKE-AMS for Source.

---

## §14 · Open decisions for founder

Before the Tower spec is finalized to v1.0 and Wave T0 launches, six decisions need founder input:

1. **Pressure $ thresholds.** Critical at >$500K, High at $100K-500K, Medium at $25K-100K. These are best-guess for a mid-market enterprise. For larger tenants (e.g., 50K+ employees), thresholds should scale up. For smaller tenants, scale down. Recommend: add tenant-tier configuration, default thresholds per tier.

2. **Confidence-haircut multipliers.** I prescribed 1.0 / 0.85 / 0.6 / 0.4 for experimental / cohort-match / survey / self-report. These are defensible but adjustable. Recommend: lock for v1.0; revisit after 90 days of real data.

3. **Renewal calendar lookahead.** I prescribed 12 months. For long-cycle vendors (3-5 year contracts) this might extend to 18-24. Recommend: tunable per vendor.

4. **T-FOW visualization.** I prescribed dashed bubble outline for low-confidence programs. Founder may prefer a different convention — e.g., separate "strategic bets" lane. Recommend: validate with one tenant before locking.

5. **Reallocation simulator scope.** TWR-FLW-REALLOCATE is the most ambitious page. It implies the Tower can predict counterfactuals, which is hard. Two approaches: (a) deterministic ("if you cut 20% of Copilot seats, here's the linear projection"), or (b) inferred-causal ("here's our best estimate with confidence interval"). Recommend (a) for v1.0; (b) is a v2 ambition.

6. **External benchmarking data.** I described "vs peer set" comparisons. This requires anonymized peer-tenant data via the knowledge fabric. That's a privacy/architecture question that touches the Private Data Plane spec. Recommend: defer "vs peer set" to v2; v1.0 ships with internal-only normalization.

---

## §15 · Why this design wins (the competitive position)

To anchor: how does this Tower compare to existing tools?

| Tool | What it does | What it doesn't do | Where Tower wins |
|---|---|---|---|
| **Apptio / TBM** | Allocates IT cost to towers (financial), produces dashboards | Doesn't attribute value, doesn't track AI-specific metrics, lagging | Causal value attribution, real-time, AI-typed |
| **Productiv / Zylo** | SaaS license tracking, shelfware detection | Doesn't model value, doesn't connect to outcomes, no decision flow | Value model, decision flow, outcome tracking |
| **Vendr** | Procurement & negotiation | Doesn't track ongoing value, doesn't attribute outcomes | Continuous value + integrated procurement (via Source) |
| **Mixpanel-style usage analytics** | Tracks events | Doesn't link to value, doesn't normalize across programs | Normalized portfolio view, value attribution |
| **DIY in Looker/Tableau** | Whatever the analyst built | Custom every time, no provenance, no agent layer | Pre-built typed value models, provenance, agent voice |
| **Vendor scorecards (gut feel)** | Annually compiled by IT/Finance | Lagging, anecdotal, no portfolio view | Real-time, defensible, portfolio-level |

The Tower is not in any of these categories. It is the **first portfolio-CFO surface specifically for AI investment management**, at a moment when AI investment is the largest unmanaged spend category in most enterprises.

---

## §16 · Document control

- **Authoritative location:** `docs/build/TOWER_DESIGN_SPEC.md`
- **Version:** 1.0
- **Authored:** April 28 2026
- **Owner:** Founder (Anand)
- **Status:** Prescriptive — to be ratified by founder before Wave T0 launches
- **Companion specs:**
  - `abarva-orchestration-spec.md` — outer build loop
  - `abarva-source-build-spec.md` — Source module
  - `abarva-tower-design-spec-PRIOR.md` — prior session's design doc (preserved as reference)
  - `abarva-session-dump-2026-04-28.md` — full system context

---

**End of Tower design spec.**
