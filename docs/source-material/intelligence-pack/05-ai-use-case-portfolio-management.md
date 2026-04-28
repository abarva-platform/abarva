# Part 2.5 · AI Use Case Portfolio Management

## 2.5 · AI Use Case Portfolio Management

### YAML front-matter

```yaml
pattern_id: pattern_ai_use_case_portfolio
slug: ai-use-case-portfolio-management
name: AI Use Case Portfolio Management
version: 1.0.0
status: active
category: AI Strategy & Investment Management
cross_industry: true
sector_applicability: [healthcare, retail, financial_services, energy, cross_sector]
short_description: >
  The managed portfolio of AI use cases across an enterprise — from
  exploration through pilot, scaled, and sustained stages — with explicit
  value-at-risk, stage-gate discipline, outcome attribution, and portfolio-
  level investment decisions. The upstream pattern that drives analytics
  modernization priorities, governance focus, and vendor rationalization.
long_description: >
  Most enterprises in 2026 deploy AI as a collection of use-case experiments
  owned by whichever team felt the pressure first. The outcome is a sprawl
  of proofs-of-concept with unclear business value, a handful of use cases
  that graduated to production without measured attribution, and a perpetual
  sense that "AI is happening" without a clear picture of where, how much,
  or with what return. AI Use Case Portfolio Management is the discipline
  that inverts this: the portfolio is treated as an investment portfolio
  with named stages, explicit value-at-risk, attribution measurement,
  stage-gate criteria, and portfolio-level investment decisions (invest,
  scale, sustain, kill). Portfolio discipline is the upstream input that
  makes analytics modernization coherent (see pattern_analytics_modernization),
  governance focused (see pattern_ai_governance_operating_model), and vendor
  selection purposeful (see pattern_vendor_sprawl_ai_tool_rationalization).
confidence_floor: 0.65
n_observations_floor: 8
related_patterns:
  - { id: pattern_analytics_modernization, relationship: causal, direction: forward }
  - { id: pattern_ai_governance_operating_model, relationship: associative }
  - { id: pattern_vendor_sprawl_ai_tool_rationalization, relationship: associative }
  - { id: pattern_ai_led_pdlc, relationship: associative }
regulatory_frameworks:
  - id: framework_nist_ai_rmf
    applicability: indirect
  - id: framework_eu_ai_act
    applicability: portfolio_tier_visibility
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_ai_use_case_portfolio`
**Name:** AI Use Case Portfolio Management
**Short description:** The managed portfolio of AI use cases with stage discipline, value-at-risk, outcome attribution, and portfolio-level investment decisions.

**Long description:** The portfolio is the organizing unit that reconciles AI ambition with AI investment reality. Without portfolio discipline, use case decisions happen at individual sponsor level, investment concentrates where loudest voices win, modernization priorities have no demand signal, governance focus is reactive, and "what's our AI strategy?" becomes unanswerable because the answer is the sum of uncoordinated choices. With portfolio discipline, use cases flow through stage gates, resource allocation reflects deliberate investment, outcomes are measured with attribution, and kill decisions are made explicitly. The portfolio becomes the enterprise's AI strategy in executable form.

### Part B · Classification

**Category:** AI Strategy & Investment Management
**Cross-industry:** Yes
**Sector applicability:** All sectors
**Variant of:** None (foundational pattern; upstream input to modernization, governance, tool rationalization)
**Related patterns:** Analytics Modernization (downstream — portfolio drives modernization demand), AI Governance (portfolio is governed), Vendor Sprawl (portfolio informs tool selection), AI-Led PDLC (portfolio delivery depends on PDLC)

### Part C · Detection

#### C.1 · Trigger symptoms

- "AI use case" count cannot be produced authoritatively
- Investment allocation across use cases unclear; no portfolio view
- Use cases proceed from POC to production without stage-gate discipline
- Proof-of-concept graveyard: many POCs completed, few graduated
- Executives describe AI strategy in aspirational rather than portfolio terms
- Use case ROI or outcome attribution absent or unreliable
- Portfolio decisions (what to invest in, what to kill) happen by default rather than by deliberate review
- Multiple teams working on similar use cases without coordination
- Data engineering / platform team has no coherent demand signal for prioritization

#### C.2 · Detection signals

**Signal 1 · Use case inventory void.**
- Type: `evidence_pattern`
- Threshold: When asked, "how many AI use cases in production?", leadership gives conflicting counts (e.g., 8 vs 14 vs 23)
- Evidence: use case inventory (or absence), stakeholder interviews

**Signal 2 · POC graveyard.**
- Type: `evidence_pattern`
- Threshold: POC-to-production graduation rate <15% over 12-month rolling window
- Evidence: POC records, production deployment records

**Signal 3 · Outcome attribution gap.**
- Type: `evidence_pattern`
- Threshold: <50% of production AI use cases have documented baseline + target + actual outcome measurement
- Evidence: use case records, measurement audit

**Signal 4 · Duplicate use case work.**
- Type: `evidence_pattern`
- Threshold: 2+ instances of teams working on similar use cases without coordination visibility
- Evidence: use case inventory, cross-team stakeholder interviews

**Signal 5 · Stage-gate absence.**
- Type: `evidence_pattern`
- Threshold: No defined criteria for advancing a use case from exploration to pilot, pilot to scaled, scaled to sustained
- Evidence: portfolio governance documentation

**Signal 6 · Kill-decision avoidance.**
- Type: `evidence_pattern`
- Threshold: In the last 12 months, 0 use cases explicitly killed despite portfolio having underperforming or stalled cases
- Evidence: portfolio decisions log

**Signal 7 · Portfolio investment misalignment.**
- Type: `kpi_deviation`
- Threshold: Investment concentrated in use cases not scored highest on business value + feasibility + strategic fit
- Evidence: investment allocation vs prioritization scoring

**Signal 8 · Data engineering demand signal missing.**
- Type: `evidence_pattern`
- Threshold: Data engineering team reports unclear prioritization; modernization roadmap not anchored to portfolio
- Evidence: data engineering team surveys, roadmap documents

#### C.3 · Diagnostic questions

1. How many AI use cases are in production, and what is the outcome attribution for each?
2. What is your POC-to-production graduation rate, and what criteria govern graduation?
3. Who owns the AI use case portfolio, and what decision rights do they have?
4. When a use case stalls, what is the mechanism for deciding continue vs kill?
5. How does the portfolio drive modernization, governance, and tool-selection priorities?
6. What is the value-at-risk across the portfolio, and how is it tracked?
7. How are duplicate or competing use cases across teams identified and resolved?
8. What is the cadence for portfolio review, and what decisions get made at each cadence?

#### C.4 · Evidence requirements

- Use case inventory with stages, outcomes, investment
- POC records and production deployment records
- Portfolio governance documentation (or absence)
- Stakeholder interviews with CDO, CAIO, business sponsors, data engineering lead
- Investment allocation records

#### C.5 · Confidence rubric

- **0.9+:** No portfolio view, POC graveyard obvious, no attribution, no kill decisions
- **0.75-0.9:** Partial portfolio discipline; gaps in stage gates or attribution
- **0.6-0.75:** Portfolio function emerging; maturity unclear
- **Below 0.6:** Do not surface

### Part D · Causal Structure

**Root cause 1 · AI treated as experimental portfolio without investment discipline.**
Early AI adoption pattern (pre-2023) rewarded experimentation; that mode persisted past its useful life. Use cases launched as "innovation" without stage-gate or attribution expected.

**Root cause 2 · Distributed use case ownership without portfolio view.**
Every function (marketing, sales, service, operations, HR, finance) owns their own AI use cases. No cross-function portfolio view. Overlap and gap not visible.

**Root cause 3 · Outcome attribution hard, so avoided.**
Attribution methodology is genuinely hard (counterfactuals, A/B, difference-in-differences). Absent methodology discipline, attribution skipped; use case outcomes never credibly measured.

**Root cause 4 · Kill decisions politically hard.**
Killing a use case means defunding a sponsor's pet project; making an executive admit a bet didn't pay off; ending a team's work. Default behavior is to let underperforming use cases persist until they die from attrition.

**Root cause 5 · Strategy-to-execution translation missing.**
Executive AI strategy expressed as themes ("responsible AI," "data-driven decisions," "AI-augmented operations") without translation to use case portfolio. Execution disconnects from strategy.

**Causal chain:**

```
experimental_mode_persists
  + distributed_ownership_no_portfolio
  + attribution_hard_so_avoided
  + kill_decisions_politically_hard
  + strategy_to_execution_gap
  → POC_graveyard
  + investment_misalignment
  + duplicate_work
  + data_engineering_without_demand_signal
  → modernization_without_coherence
  → governance_without_focus
  → vendor_selection_without_purpose
```

### Part E · Interventions

**Intervention 1 · Named portfolio owner with decision rights.**
Single accountable executive (Chief AI Officer or CDO extension) for AI use case portfolio with documented decision rights: approve new additions, approve stage advancement, authorize kill decisions, set investment allocation.
- *Success rate:* 0.76 (n=12)
- *Effort:* Medium · 4-8 weeks
- *Conditions:* CEO sponsorship; willingness to designate single accountability

**Intervention 2 · Stage-gate framework.**
Define explicit stages (e.g., Exploration / Pilot / Scaled / Sustained) with advancement criteria. Every use case has a stage; advancement requires criteria met; regression allowed (and documented).
- *Success rate:* 0.72 (n=11)
- *Effort:* Medium · 8-12 weeks to design and deploy
- *Conditions:* Portfolio owner engagement; advancement criteria cross-functionally defined; enforcement discipline

**Intervention 3 · Outcome attribution spine.**
For every use case, baseline + target + measurement methodology + attribution approach documented before stage advancement. Attribution methodology menu (direct measurement, counterfactual, A/B, quasi-experiment) with use case fit. Actual outcomes measured at defined intervals.
- *Success rate:* 0.68 (n=10)
- *Effort:* Medium · 8-12 weeks to institute; ongoing discipline
- *Conditions:* Business partners engaged; attribution methodology ownership; measurement discipline; finance alignment on outcome crediting

**Intervention 4 · Kill-meeting cadence.**
Explicit portfolio review cadence (quarterly typical) with kill decisions on agenda. Use cases underperforming or stalled presented for continue / invest-further / kill decision. Kill decisions celebrated as portfolio hygiene, not failure.
- *Success rate:* 0.64 (n=9)
- *Effort:* Small-Medium · 4-8 weeks to institute; ongoing discipline
- *Conditions:* Executive willingness to make kill decisions; cultural framing (hygiene not failure); sponsor communication plan

**Intervention 5 · Portfolio investment concentration target.**
Set targets for investment concentration (e.g., 60% of AI investment in top 5 use cases by strategic fit × feasibility). Surfaces spread-too-thin patterns. Drives concentration in highest-value work.
- *Success rate:* 0.62 (n=8)
- *Effort:* Small · 4-6 weeks to establish; ongoing tracking
- *Conditions:* Finance visibility; portfolio owner authority; scoring methodology

**Intervention 6 · Portfolio-modernization integration.**
Modernization roadmap explicitly anchored to portfolio: data products prioritized by portfolio demand; sprints scoped to portfolio use cases; backlog reflects portfolio.
- *Success rate:* 0.70 (n=11)
- *Effort:* Medium · 8-12 weeks
- *Conditions:* CDO / data engineering lead engagement; portfolio visibility to data engineering; sprint planning integration

**Intervention 7 · Shadow use case discovery.**
Surface shadow AI use cases: business units running AI without portfolio visibility (including shadow consumer tool usage for real workflows). Consolidate into portfolio view; either sanction (stage gate applied retroactively) or retire.
- *Success rate:* 0.60 (n=7)
- *Effort:* Medium · 8-12 weeks
- *Conditions:* Cross-function cooperation; employee survey / shadow AI discovery; non-punitive framing

**Intervention 8 · Portfolio dashboard and cadence.**
Portfolio dashboard tracking: use case count by stage, investment allocation, outcome attribution status, value-at-risk, portfolio velocity (additions / advancements / kills per quarter). Reviewed monthly by portfolio owner; quarterly by executive committee; annually at board level.
- *Success rate:* 0.66 (n=10)
- *Effort:* Medium · 8-12 weeks to build dashboard; ongoing maintenance
- *Conditions:* Data capture infrastructure; cadence discipline; executive engagement

### Part F · Anti-Patterns

- **Use-case-as-innovation.** Use cases framed as innovation experiments indefinitely; no graduation expectation.
- **Attribution fakery.** Outcomes credited to AI without methodology; retrospective storytelling.
- **Kill-decision avoidance.** Underperforming use cases allowed to linger; portfolio never cleared.
- **Portfolio theater.** Dashboard exists but decisions happen outside portfolio review.
- **Strategy-theme overload.** Executive themes don't translate to portfolio; strategy remains abstract.
- **Data team as portfolio owner.** Data team owns portfolio by default; supply-driven, not demand-driven.
- **Single-stage fixation.** Organization stuck at pilot stage; few graduations to scaled or sustained.
- **Duplicate-use-case tolerance.** Overlapping use cases allowed to proceed in parallel without consolidation.

### Part G · Vendor Landscape

Most AI use case portfolio management in 2026 is done with:
- Custom spreadsheets (early maturity)
- Jira / Asana / Monday.com adapted with custom fields (emerging)
- Dedicated AI portfolio platforms: **Dataiku Govern, Credo AI, Holistic AI** (governance crossover), **Dealhub/similar** adapted
- Purpose-built emerging tools: **Accenture AI Refinery**, Portfolio modules within **Databricks, Snowflake Horizon**
- Strategic consulting firms offering portfolio frameworks (McKinsey QuantumBlack, BCG Gamma, PwC, EY — mentioned for completeness; AbarVa does not partner but acknowledges market context)

**AbarVa positioning:** AbarVa's platform provides native AI use case portfolio management integrated with modernization, governance, and delivery. Portfolio discipline is one of the highest-leverage patterns AbarVa surfaces because it unlocks coherent decisions in the other patterns.

### Part H · Regulatory Considerations

- **NIST AI RMF** — portfolio view supports MAP function (risk context)
- **EU AI Act** — portfolio tier visibility required for compliance; high-risk use cases identifiable in portfolio
- **Sector-specific:** SR 11-7 (financial services) aligns to portfolio view of models; HIPAA (healthcare) attaches to PHI-touching use cases

### Part I · Observations

**Obs 1 · Healthcare IDN portfolio stand-up.**
Large IDN had ~30 use cases distributed across departments without portfolio view. Stood up portfolio with CMIO + CFO co-ownership. First 90 days: inventory consolidation (30 → 22 after dedupe); stage assignment; attribution methodology per use case. First year: 8 use cases killed, 4 graduated to scaled, 3 new initiated with deliberate prioritization. Investment re-concentrated: 55% of AI investment in top 5 use cases (vs 22% before).

**Obs 2 · Retail portfolio + modernization integration.**
Mass retailer aligned modernization roadmap to portfolio demand. Data engineering team's sprints scoped from portfolio backlog. POC graduation rate rose from 11% to 38% over 18 months. Use case-to-outcome time reduced from 14 months mean to 6.5 months mean.

**Obs 3 · Financial services stage-gate enforcement.**
Tier-2 bank enforced stage-gate discipline: exploration / pilot / scaled / sustained. Advancement required documented outcome + governance approval + investment re-authorization. Initial 18 months: 40 use cases in portfolio; 14 advanced to sustained; 18 killed; 8 remaining at pilot. Portfolio investment tightened; data engineering backlog aligned.

**Obs 4 · Energy portfolio with OT/IT split.**
Integrated energy company maintained two portfolios: IT AI (under CDO) and OT AI (under COO with regulatory oversight). Separate stage gates reflecting different risk profiles. Integration point at executive committee quarterly review.

**Obs 5 · Cross-sector POC graveyard remediation.**
Organizations that shifted to portfolio discipline reported reducing POC graveyard by 40-70% over 18 months. Kill decisions celebrated initially as hygiene; over time, cultural shift to "killed fast" as positive signal.

**Obs 6 · Attribution methodology maturity.**
Portfolio-managed organizations converged on attribution methodology menu: direct measurement (where possible), A/B test (where applicable), quasi-experiment / difference-in-differences (for deployed use cases), counterfactual (for enterprise-wide use cases). Methodology-per-use-case documentation became standard.

**Obs 7 · Shadow use case surfacing.**
Organizations conducting shadow use case discovery typically found 30-60% additional use cases not in official portfolio. Some were meaningful; many were consumer-tool workarounds. Remediation typically resulted in 40% sanctioned-into-portfolio + 50% retired + 10% pending further review.

**Obs 8 · Portfolio-to-strategy translation.**
Organizations with portfolio discipline reported executive AI strategy conversations shifting from abstract theme discussion to concrete portfolio discussion. CEO could describe AI strategy in portfolio terms: "15 use cases in sustained; 8 in scaled; investment concentration in four strategic areas."

### Part J · Success Measures

**Leading indicators (monthly):**
- Portfolio use case count by stage
- POC graduation rate (rolling 12-month)
- Investment allocation concentration
- Use cases with outcome attribution methodology documented

**Lagging indicators (quarterly):**
- Portfolio outcome realization (cumulative business value)
- Kill decisions per quarter
- Investment reallocation as portfolio evolves
- Portfolio velocity (additions / advancements / kills)

**Maturity thresholds:**
- **Emerging:** no portfolio view; distributed ownership; no attribution
- **Scaling:** named owner; stage gates; attribution emerging; quarterly review
- **Mature:** discipline institutionalized; kill decisions routine; modernization anchored to portfolio
- **Optimized:** continuous portfolio evolution; concentration targets met; strategy expressed in portfolio terms

### Part K · Timeline & Sequencing

**Months 0-3:** Portfolio owner named; use case inventory; stage framework drafted
**Months 3-6:** Stage assignment; attribution methodology; first kill decisions
**Months 6-12:** Portfolio integrated with modernization; shadow discovery; dashboard
**Months 12-18:** Concentration target; quarterly discipline; cross-functional integration
**Months 18-24:** Institutionalized; continuous evolution

### Part L · Governance Mechanism

| Decision | Owner | Review body | Cadence |
|---|---|---|---|
| New use case admission | Portfolio owner | AI Council | Monthly |
| Stage advancement | Portfolio owner + use case sponsor | AI Council | Per advancement |
| Kill decisions | Portfolio owner | AI Council + sponsor | Quarterly |
| Investment concentration | CFO + portfolio owner | Executive committee | Quarterly |
| Portfolio-modernization alignment | Portfolio owner + CDO | — | Monthly |

### Part M · Sector Variants

**Healthcare:** Portfolio includes clinical + operational + revenue use cases with different stage gates reflecting clinical evidence standards. CMIO ownership common.
**Financial Services:** Portfolio includes decisioning + operational + compliance use cases. Integration with model risk management mandatory.
**Retail:** Portfolio balances merchandising, supply chain, marketing, customer experience. Fast-moving; portfolio refresh cadence higher.
**Energy:** Dual portfolio (IT/OT) common. OT portfolio conservative; IT portfolio more experimental.
**Cross-sector:** Portfolio tier visibility required for EU AI Act compliance.

### Part N · Related Patterns

- **`pattern_analytics_modernization`** (causal, forward) — portfolio drives modernization demand
- **`pattern_ai_governance_operating_model`** (associative) — portfolio governed
- **`pattern_vendor_sprawl_ai_tool_rationalization`** (associative) — portfolio drives tool selection
- **`pattern_ai_led_pdlc`** (associative) — portfolio delivery depends on PDLC

### Part O · Graph Contribution

```cypher
MERGE (p:Pattern {id: 'pattern_ai_use_case_portfolio'})
SET p.slug = 'ai-use-case-portfolio-management',
    p.name = 'AI Use Case Portfolio Management',
    p.version = '1.0.0',
    p.category = 'AI Strategy & Investment Management',
    p.cross_industry = true,
    p.confidence_floor = 0.65,
    p.n_observations_floor = 8,
    p.status = 'active';

// Full structure: categories, sectors, signals, interventions, anti-patterns, observations, vendors, frameworks as in prior patterns

// Important causal relationship (portfolio drives modernization)
MATCH (p:Pattern {id: 'pattern_ai_use_case_portfolio'})
MATCH (m:Pattern {id: 'pattern_analytics_modernization'})
MERGE (m)-[:CAUSED_BY {confidence: 0.85, evidence_note: 'Modernization without portfolio defaults to infra replacement'}]->(p);
```

### Part P · Retrieval Contribution

~48 chunks. Namespace `global:patterns`.

### Part Q · Prompting Contract

**Detection fragment:** Triggers on use case inventory void, POC graveyard, attribution gap, duplicate work, stage-gate absence, kill-decision avoidance.

**Injection fragment:** Top interventions (named owner, stage gates, attribution spine, kill cadence, concentration targets, modernization integration). Top observations across sectors. Top anti-patterns.

**Diagnostic fragment:** 4-6 probing questions; sequenced to surface ownership, stage discipline, attribution maturity, kill decision willingness.

### Part R · Rendering Contract

`/intelligence/patterns/ai-use-case-portfolio-management`. Light hero + dark working zone.

Unique rendering element: interactive portfolio view — stage-by-stage matrix with use case cards, investment allocation visualization, outcome attribution status. "Seed your portfolio" widget for organizations without one.

---

*End of Part 2.5 · AI Use Case Portfolio Management*

*End of Part 2 · Universal Patterns (5 of 5 complete)*

*Next in file sequence: `06-ambient-clinical-value-chain.md` — Part 3.1a Healthcare*

---
