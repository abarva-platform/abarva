# Apex Intelligence Layer · Validation Results

Validation run for the Apex retail overlay implementation on `codex/apex-intelligence-overlay`.

## Overlay ingestion results

Raw output from `npm run db:seed:apex-intelligence`:

```text
Apex intelligence layer seeded
  access scopes      · 24
  benchmark cohorts  · 3
  external sources   · 8
  external events    · 6
  kpis               · 39
  pattern packs      · 7
  telemetry sources  · 9
  evidence           · 61
```

## Verification results

Raw output from `npm run db:verify:apex-intelligence`:

```text
Apex intelligence layer verification
  PASS · access scopes >= 6 · 24
  PASS · benchmark cohorts >= 3 · 3
  PASS · external sources >= 8 · 8
  PASS · external events >= 6 · 6
  PASS · kpis >= 39 · 39
  PASS · pattern packs = 7 · 7
  PASS · telemetry sources = 9 · 9
  PASS · evidence >= 61 · 61
  PASS · kpis all scoped · 0
  PASS · patterns all scoped · 0
  PASS · telemetry all scoped · 0
```

## Smoke test results

Raw output from `npm run db:smoke:apex-intelligence`:

```text
Q: What is Apex's owned brand penetration?
A: Owned Brand Penetration %: 24% as of null; target 32%; benchmark median 35%.
PASS: yes

Q: Who owns the same-day fulfillment metric?
A: Karel Jensen owns Same-Day Fulfillment %; role Chief Marketing and Customer Officer; current 42%.
PASS: yes

Q: How does Apex compare on comp sales growth?
A: Comparable Sales Growth (Same-Store): current 1.4% vs peer median 1.9%; peer position bottom half.
PASS: yes

Q: What KPIs does the Shadow AI pattern degrade?
A: Shadow AI in Merchandising and Customer Operations: degrades AI Governance Maturity, Cybersecurity Maturity (NIST CSF), Customer Satisfaction (Omnichannel Survey), Conversion Rate (Digital).
PASS: yes

Q: What patterns are active at Apex?
A: Owned Brand Margin Underperformance: 24% penetration vs 32% target and Target's 35% · 640 bps differential vs 950 bps target and Target's 1,100 bps · category execution variance across 14 merchant teams | Omnichannel Fulfillment Decisioning Gap: 42% same-day vs Target 70%+ · inventory visibility lag of 4-6 hours in peak periods · 31% SFS volume vs 52% target · customer complaints concentrated on fulfillment experience | Shadow AI in Merchandising and Customer Operations: 14 AI tools identified across merchandising, customer ops, pricing, and marketing · $2.1M annualized spend · 9/14 below formal governance threshold · 3 with customer-facing inference · 2 with pricing decision integration | Customer Data Platform Consolidation: 4 customer data stores (enterprise CRM, loyalty platform, e-commerce customer, store clienteling) · segmentation consistency <60% across channels · loyalty penetration stalled at 62M while peers growing | Enterprise Analytics Modernization: 3 distinct analytics platforms across merchandising/customer/supply chain · use case backlog 73 identified, 18 delivered · analytics talent concentrated in 28-person team serving $80B revenue enterprise | Store Workforce Productivity and Engagement Gap: 68% engagement vs 76% target · 62% retention above industry but below aspiration · labor model designed for stability not flexibility · career progression unclear for 60%+ of store team | Loss Prevention Modernization: 1.8% shrinkage vs 1.3% target and 1.5% median · concentrated ORC in 40 high-priority stores · associate safety incident rate up 40% YoY · technology investment trailing peer pace
PASS: yes

Q: What interventions apply to Owned Brand Margin pattern?
A: Owned Brand Margin Underperformance: Owned brand product development capability build
- Sourcing strategy optimization (direct sourcing, consolidated suppliers)
- Pricing architecture review and owned brand premium/value positioning
- Marketing investment reallocation toward owned brand
- Category ownership clarity and accountability redesign. Sponsor: Chief Merchandising Officer with CFO partnership · enterprise scope · high political capital
PASS: yes

Q: What Phase 2 deliverables does Omnichannel Fulfillment pattern require?
A: Omnichannel Fulfillment Decisioning Gap Phase 2: Fulfillment orchestration platform (decisioning engine)
- Real-time inventory visibility across all nodes
- Store fulfillment capability standardization
- Labor model redesign for omnichannel operations
- Last-mile partner strategy review (owned vs partner)
PASS: yes

Q: What operational telemetry sources are registered?
A: Weekly Merchandise Operating Review Deck (export) | CFO Financial Scorecard (Power BI) (api) | Digital Commerce Performance Dashboard (Tableau) (api) | Store Operations Dashboard (api) | Customer Analytics Platform (Customer 360) (api) | Supply Chain Performance Tracker (api) | Technology Investment and Portfolio Tracker (share_link) | Loss Prevention and Security Dashboard (api) | Workforce Analytics (Workday-based) (api)
PASS: yes

Q: Can a CX program maestro see CFO scorecard figures?
A: CFO Scorecard reasoning scope apex_scope_finance_transformation_executive_advisory; disclosure scope apex_scope_finance_transformation_full_executive_advisory_full_others_reasoning_only_specific_values_; disclosure notes Disclosure scope:** Finance Transformation (full) · Executive Advisory (full) · others (reasoning-only; specific values never disclosed)
PASS: yes

Q: What's the loss prevention data handling?
A: Loss Prevention dashboard compliance law-enforcement-sensitive, employee-safety, public-safety; disclosure notes Disclosure scope:** LP program (full) · Executive Advisory (aggregate) · Store Operations (store-level high-level only) · other programs (aggregate only, no incident specifics)
PASS: yes

Q: Should Apex prioritize personalization engine or loyalty refresh?
A: Personalization has the faster near-term payoff: digital penetration sits at 14% against a 22% target, so conversion and basket value still have room to move. Loyalty is already proving monetization upside with a 1.32% member spend premium, which makes the loyalty refresh more powerful after the data and personalization backbone is stronger. Given the CFO scorecard capital boundary and the customer-data pattern, sequence personalization first and stage the loyalty refresh behind it as Phase 2 scale-up.
PASS: yes

Q: What's changed at Apex this quarter?
A: 2026-04-10: Shadow AI governance exposure surfaced across 17 teams | 2026-03-12: Analyst day reaffirmed ambitious 2027 margin and digital targets | 2026-02-14: Activist fund disclosed 3.4% stake and pushed owned-brand monetization | 2026-01-20: Vendor bankruptcy exposed East Region supply concentration risk
PASS: yes
```

## Notes

1. The Apex overlay currently enumerates 39 KPI blocks in Part 2. The ingestion honors the authored blocks directly.
2. Several KPI blocks do not include authored as-of dates. The seeded rows preserve the values and default the higher-level row timestamps to the validation date.
3. Most Apex patterns do not include explicit phase-mapped deliverables in the source markdown. The seed pipeline derives a fallback phase structure from intervention options so downstream drafting stays useful without mutating the authored spec.
