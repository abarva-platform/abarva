# Apex Retail Group · Intelligence Layer Overlay

**The Apex-specific instantiation of the AbarVa Intelligence Layer North Star Specification v1.0. Extends the base Apex Retail Group composite seed with KPI architecture, pattern pack upgrades, telemetry sources, external signal envelope, and dual-scope configuration per the north star specification.**

Reads alongside:
- `docs/specs/platform/intelligence-layer-north-star-spec.md` — authoritative north star
- `docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md` — base tenant seed (ingested in PR #22)

**Apex is the Target-class retail composite.** This overlay establishes parity with the Keystone reference implementation across the same eight intelligence layers. Serves as the second in the four-composite instantiation sequence.

---

## Part 1 · Scope

This overlay adds to the base Apex seed:

- **34 first-class KPI objects** with full north star schema compliance (Part 4)
- **7 pattern packs** upgraded from narrative to full schema (Part 6)
- **External signal envelope** defining Apex's tracked sources and entities (Part 8)
- **9 operational telemetry sources** with dual-scope access control (Parts 9-10)
- **Dual-scope configuration** for all KPIs, patterns, and telemetry (Part 11)
- **Graph entity population plan** specifying entity and edge counts

---

## Part 2 · KPI Architecture · 34 First-Class Metrics

Every KPI conforms to the schema in north star Part 4.1. Fields shown are the critical subset; full schema populated during ingestion.

### 2.1 · Financial KPIs

**2.1.1 — Revenue Growth (Total)**
- ID: `apex_revenue_growth_total`
- Definition: Total revenue YoY growth, rolling 4-quarter
- Owner: David Morrison (EVP CFO) · Strategic priority: Profitable Growth
- Target: 4.5% · Current: 3.1% · Trend: flat · Benchmark median: 3.2% (mass retail)
- Linked initiatives: Owned Brand Expansion, Digital Commerce Modernization
- Reasoning scope: broad · Disclosure scope: broad (public)

**2.1.2 — Comparable Sales Growth (Same-Store)**
- ID: `apex_comp_sales_growth`
- Definition: Stores open ≥13 months, YoY sales growth
- Owner: David Morrison · Target: 2.5% · Current: 1.4% · Trend: flat
- Benchmark median: 1.9% · Peer position: bottom half
- Linked initiatives: Merchandising Refresh, Store Experience Program
- Linked patterns: Owned Brand Margin Underperformance (3.1), Omnichannel Fulfillment Decisioning Gap (3.2)
- Reasoning scope: broad · Disclosure scope: broad (public)

**2.1.3 — Gross Margin %**
- ID: `apex_gross_margin_pct`
- Current: 28.4% · Target: 30.0% · Benchmark median: 29.1% · Peer position: bottom third
- Trend: declining 40 bps YoY · Freight and markdown pressure
- Linked patterns: Owned Brand Margin Underperformance (3.1)
- Reasoning scope: broad · Disclosure scope: broad

**2.1.4 — Operating Margin %**
- ID: `apex_operating_margin_pct`
- Current: 4.9% · Target: 6.2% · Benchmark median: 5.4%
- Linked initiatives: Operating Model Efficiency
- Reasoning scope: broad · Disclosure scope: broad

**2.1.5 — Inventory Turns**
- ID: `apex_inventory_turns`
- Current: 5.4 · Target: 6.0 · Benchmark median: 5.8 · Peer position: bottom half
- Linked initiatives: Supply Chain Optimization, Inventory Precision
- Reasoning scope: broad · Disclosure scope: broad

**2.1.6 — ROIC**
- ID: `apex_roic` · Current: 11.2% · Target: 14.0% · Benchmark median: 12.8%
- Reasoning scope: broad · Disclosure scope: broad

### 2.2 · Merchandising KPIs

**2.2.1 — Owned Brand Penetration %**
- ID: `apex_owned_brand_penetration`
- Definition: Owned brand revenue / total merchandise revenue
- Owner: Rebecca Chen-Matsuda (EVP Chief Merchandising Officer) · Strategic priority: Owned Brand Growth
- Target: 32% by FY2027 · Current: 24% · Trend: up +2% YoY · Benchmark: Target 35%, Walmart 30%, Costco 28%
- Linked initiatives: Owned Brand Expansion Program (primary)
- Linked patterns: Owned Brand Margin Underperformance (3.1)
- Reasoning scope: broad · Disclosure scope: broad

**2.2.2 — Owned Brand Gross Margin Differential**
- ID: `apex_owned_brand_margin_differential`
- Definition: Owned brand GM% minus national brand GM%
- Current: 640 bps · Target: 950 bps · Peer benchmark (Target): 1,100 bps
- Linked patterns: Owned Brand Margin Underperformance (3.1)
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Merchandising Transformation disclosable; other programs reasoning-only given competitive sensitivity)

**2.2.3 — Category Growth Rate (Weighted)**
- ID: `apex_category_growth_weighted`
- Current: 2.8% · Target: 4.2% · Weighted by category revenue contribution
- Reasoning scope: broad · Disclosure scope: broad

**2.2.4 — Sell-Through Rate (Seasonal Categories)**
- ID: `apex_sellthrough_seasonal`
- Current: 78% at 6-week mark · Target: 85% · Benchmark median: 82%
- Reasoning scope: broad · Disclosure scope: broad

**2.2.5 — Markdown Rate**
- ID: `apex_markdown_rate`
- Current: 11.2% · Target: 9.5% · Benchmark median: 10.1%
- Linked patterns: Owned Brand Margin Underperformance, Omnichannel Fulfillment Decisioning Gap
- Reasoning scope: broad · Disclosure scope: broad

**2.2.6 — Vendor Fill Rate**
- ID: `apex_vendor_fill_rate`
- Current: 91.3% · Target: 95% · Benchmark median: 93.8%
- Reasoning scope: broad · Disclosure scope: broad

### 2.3 · Customer KPIs

**2.3.1 — Net Promoter Score**
- ID: `apex_nps`
- Owner: Marcus Whitfield (EVP Chief Customer Officer)
- Target: 52 · Current: 38 · Trend: flat · Benchmark: Target 48, Costco 74, Walmart 32
- Linked initiatives: Customer Experience Transformation, Store Experience Program
- Reasoning scope: broad · Disclosure scope: broad

**2.3.2 — Customer Satisfaction (Omnichannel Survey)**
- ID: `apex_csat_omnichannel`
- Current: 72% top-box · Target: 82% · Benchmark median: 78%
- Linked patterns: Omnichannel Fulfillment Decisioning Gap (3.2)
- Reasoning scope: broad · Disclosure scope: broad

**2.3.3 — Basket Size (Units)**
- ID: `apex_basket_size_units`
- Current: 4.2 · Target: 4.8 · Benchmark median: 4.6
- Reasoning scope: broad · Disclosure scope: broad

**2.3.4 — Basket Value ($)**
- ID: `apex_basket_value`
- Current: $47.20 · Target: $52.00 · Benchmark median: $49.80
- Reasoning scope: broad · Disclosure scope: broad

**2.3.5 — Conversion Rate (Store)**
- ID: `apex_conversion_rate_store`
- Current: 36% · Target: 42% · Benchmark median: 40%
- Reasoning scope: broad · Disclosure scope: broad

**2.3.6 — Conversion Rate (Digital)**
- ID: `apex_conversion_rate_digital`
- Current: 3.2% · Target: 4.1% · Benchmark median: 3.7%
- Reasoning scope: broad · Disclosure scope: broad

**2.3.7 — Loyalty Active Members**
- ID: `apex_loyalty_active_members`
- Current: 62M · Target: 75M by FY2027 · Peer benchmark: Target Circle ~100M, Walmart+ ~25M paid
- Linked initiatives: Loyalty Program 2.0
- Reasoning scope: broad · Disclosure scope: broad

**2.3.8 — Loyalty Member Spend Premium**
- ID: `apex_loyalty_member_spend_premium`
- Definition: Loyalty member spend per visit / non-member spend per visit
- Current: 1.32x · Target: 1.55x · Benchmark median: 1.45x
- Reasoning scope: broad · Disclosure scope: broad

**2.3.9 — Customer Retention (12-Month)**
- ID: `apex_retention_12mo`
- Current: 68% · Target: 76% · Benchmark median: 72%
- Reasoning scope: broad · Disclosure scope: broad

### 2.4 · Digital and omnichannel KPIs

**2.4.1 — E-Commerce Revenue Penetration %**
- ID: `apex_ecom_penetration`
- Current: 14% · Target: 22% by FY2027 · Benchmark: Target 18%, Walmart 15%, Best Buy 33%
- Linked initiatives: Digital Commerce Modernization (primary)
- Reasoning scope: broad · Disclosure scope: broad

**2.4.2 — Same-Day Fulfillment %**
- ID: `apex_same_day_fulfillment_pct`
- Definition: Digital orders fulfilled same-day (delivery or pickup)
- Current: 42% · Target: 68% · Benchmark: Target 70%+ (drives Shipt+drive-up+same-day)
- Linked patterns: Omnichannel Fulfillment Decisioning Gap (3.2)
- Reasoning scope: broad · Disclosure scope: broad

**2.4.3 — Click-and-Collect Adoption**
- ID: `apex_click_collect_adoption`
- Current: 23% of digital orders · Target: 38% · Benchmark: Target drive-up ~65%
- Reasoning scope: broad · Disclosure scope: broad

**2.4.4 — Ship-From-Store Volume**
- ID: `apex_sfs_volume`
- Current: 31% of online fulfillment · Target: 52%
- Linked initiatives: Digital Commerce Modernization
- Reasoning scope: broad · Disclosure scope: broad

### 2.5 · Operational KPIs

**2.5.1 — Store Labor Productivity**
- ID: `apex_store_labor_productivity`
- Definition: Revenue per store labor hour
- Current: $284 · Target: $320 · Benchmark median: $310
- Reasoning scope: broad · Disclosure scope: broad

**2.5.2 — Shrinkage %**
- ID: `apex_shrinkage_pct`
- Current: 1.8% · Target: 1.3% · Benchmark median: 1.5% · Industry crisis-level
- Linked initiatives: Loss Prevention Modernization
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Loss Prevention, Operations Excellence disclosable; general disclosure only at aggregate level given law-enforcement sensitivity)

**2.5.3 — DC Throughput (Units per Hour)**
- ID: `apex_dc_throughput`
- Current: 1,840 · Target: 2,400 · Benchmark median: 2,100
- Linked initiatives: Supply Chain Optimization
- Reasoning scope: broad · Disclosure scope: broad

**2.5.4 — Order Fulfillment Accuracy**
- ID: `apex_order_fulfillment_accuracy`
- Current: 97.2% · Target: 99.0% · Benchmark median: 98.4%
- Reasoning scope: broad · Disclosure scope: broad

**2.5.5 — Store Operational Availability**
- ID: `apex_store_operational_availability`
- Definition: % scheduled operating hours available (excluding planned closures)
- Current: 99.1% · Target: 99.7%
- Reasoning scope: broad · Disclosure scope: broad

### 2.6 · Supply chain KPIs

**2.6.1 — Working Capital Days**
- ID: `apex_working_capital_days`
- Current: 54 · Target: 42 · Benchmark median: 48
- Reasoning scope: broad · Disclosure scope: broad

**2.6.2 — Out-of-Stock Rate**
- ID: `apex_oos_rate`
- Current: 6.2% · Target: 3.5% · Benchmark median: 4.8%
- Linked patterns: Omnichannel Fulfillment Decisioning Gap
- Reasoning scope: broad · Disclosure scope: broad

**2.6.3 — Inventory Accuracy**
- ID: `apex_inventory_accuracy`
- Current: 94.8% · Target: 98.5% · RFID-enabled categories: 99.2%
- Linked initiatives: Inventory Precision Program
- Reasoning scope: broad · Disclosure scope: broad

### 2.7 · Employee KPIs

**2.7.1 — Store Team Engagement**
- ID: `apex_store_engagement`
- Current: 68% favorable · Target: 76% · Benchmark median: 71%
- Reasoning scope: broad · Disclosure scope: broad

**2.7.2 — Store Team Retention**
- ID: `apex_store_retention`
- Current: 62% annual · Target: 72% · Retail average: 60%
- Reasoning scope: broad · Disclosure scope: broad

**2.7.3 — Corporate Team Engagement**
- ID: `apex_corporate_engagement`
- Current: 74% · Target: 80% · Benchmark median: 72%
- Reasoning scope: broad · Disclosure scope: broad

### 2.8 · Cross-functional KPIs

**2.8.1 — Cybersecurity Maturity (NIST CSF)**
- ID: `apex_cybersecurity_maturity`
- Current: 3.4 · Target: 4.2
- Linked initiatives: Cybersecurity Modernization
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Cybersecurity programs full; others aggregate only)

**2.8.2 — AI Governance Maturity**
- ID: `apex_ai_governance_maturity`
- Current: Stage 2 (emerging) · Target: Stage 4
- Linked patterns: Shadow AI in Merchandising and Customer Ops (3.3)
- Linked initiatives: AI Platform and Governance Program
- Reasoning scope: broad · Disclosure scope: broad

**2.8.3 — Decision Latency (Capital Prioritization)**
- ID: `apex_decision_latency_capital`
- Current: 4-6 months · Target: 2 months
- Reasoning scope: broad · Disclosure scope: **program-scoped**

### 2.9 · KPI relationship graph summary

**Primary clusters:**
- Financial (2.1.1-2.1.6) ← affected by Owned Brand Margin pattern, Omnichannel Fulfillment pattern
- Merchandising (2.2.1-2.2.6) ← primary levers for margin and growth
- Customer (2.3.1-2.3.9) ← affected by Experience Transformation, Loyalty 2.0
- Digital (2.4.1-2.4.4) ← affected by Omnichannel Fulfillment pattern, Digital Commerce Modernization
- Operational (2.5.1-2.5.5) ← store experience and productivity
- Supply chain (2.6.1-2.6.3) ← foundational to margin and customer metrics

**Cross-cluster relationships:**
- Owned brand penetration (2.2.1) → gross margin (2.1.3) upstream relationship
- Out-of-stock rate (2.6.2) → customer satisfaction (2.3.2) → conversion rate (2.3.5, 2.3.6)
- Same-day fulfillment (2.4.2) → digital conversion (2.3.6) → e-commerce penetration (2.4.1)
- Shadow AI pattern (3.3) → AI governance maturity (2.8.2) and customer-facing AI reliability

---

## Part 3 · Pattern Pack Upgrades · 7 Patterns to Full Schema

### 3.1 · Owned Brand Margin Underperformance

Variant of foundational cross-sector pattern (variant of Analytics Modernization + sector-specific application).

**Classification.** Category: Merchandising Strategy — Margin Optimization · Sector applicability: retail

**Detection signals.**
- Owned brand margin differential <800 bps vs national brand (peer median: 1,000+ bps)
- Owned brand penetration below peer median while margin differential also below
- Category-level margin variance suggesting uneven execution
- Sourcing cost vs peer sourcing-cost benchmarks (where available)

**Likely root causes.** Owned brand product development under-investment · sourcing and supplier strategy not optimized for margin capture · pricing architecture not differentiating owned brand value · marketing investment insufficient to drive penetration · category-level ownership fragmented across merchants

**Intervention options.**
- Owned brand product development capability build
- Sourcing strategy optimization (direct sourcing, consolidated suppliers)
- Pricing architecture review and owned brand premium/value positioning
- Marketing investment reallocation toward owned brand
- Category ownership clarity and accountability redesign

**Phase-mapped deliverables.**

*Phase 1 — Intake.* Owned brand current state audit · margin differential by category · sourcing analysis · competitive benchmarking · marketing investment review

*Phase 2 — Diagnosis.* Root cause deep-dive · peer sourcing strategies analysis · pricing architecture review · category ownership review · product development capability assessment

*Phase 3 — Decision.* Owned brand strategy · sourcing roadmap · pricing architecture commitments · marketing reallocation · category accountability design

*Phase 4 — Execution.* Product development capability build · sourcing renegotiations · pricing implementation · marketing launches · category leadership changes

**Expected outcomes.** Margin differential up 200+ bps within 18 months · owned brand penetration up 5+ pts within 24 months · gross margin up 60-80 bps enterprise

**Required sponsor profile.** Chief Merchandising Officer with CFO partnership · enterprise scope · high political capital

**Linked KPIs.** Owned Brand Penetration (2.2.1), Owned Brand Margin Differential (2.2.2), Gross Margin (2.1.3), Operating Margin (2.1.4)

**Apex evidence.** 24% penetration vs 32% target and Target's 35% · 640 bps differential vs 950 bps target and Target's 1,100 bps · category execution variance across 14 merchant teams

### 3.2 · Omnichannel Fulfillment Decisioning Gap

Foundational pattern pack (#12 in north star top 20) — retail-specific.

**Classification.** Category: Omnichannel Operations — Fulfillment Logic · Sector applicability: retail

**Detection signals.**
- Same-day fulfillment <50% while peers at 65%+
- Out-of-stock rate >5% while inventory turns peer-average
- Ship-from-store volume <40% of online fulfillment
- Customer satisfaction top-box gap on fulfillment experience
- Click-and-collect adoption <30% with friction signals in journey

**Likely root causes.** Fulfillment decisioning rules not optimized for margin + customer experience tradeoffs · inventory visibility incomplete across nodes · ship-from-store capability inconsistent by store · labor model not supporting store fulfillment · last-mile partner economics unfavorable

**Intervention options.**
- Fulfillment orchestration platform (decisioning engine)
- Real-time inventory visibility across all nodes
- Store fulfillment capability standardization
- Labor model redesign for omnichannel operations
- Last-mile partner strategy review (owned vs partner)

**Linked KPIs.** Same-Day Fulfillment (2.4.2), Click-and-Collect (2.4.3), Ship-From-Store (2.4.4), Out-of-Stock (2.6.2), CSAT Omnichannel (2.3.2)

**Apex evidence.** 42% same-day vs Target 70%+ · inventory visibility lag of 4-6 hours in peak periods · 31% SFS volume vs 52% target · customer complaints concentrated on fulfillment experience

### 3.3 · Shadow AI in Merchandising and Customer Operations

Retail-specific instantiation of the cross-industry Shadow AI Governance foundational pattern pack (#1 in north star top 20).

**Classification.** Variant of: Shadow AI Governance · Cross-industry: yes · Sector applicability: retail

**Detection signals.** AI tool procurement below governance threshold · AI governance policy vs practice contradiction · customer-facing AI without model governance · price optimization tools with limited oversight

**Apex evidence.** 14 AI tools identified across merchandising, customer ops, pricing, and marketing · $2.1M annualized spend · 9/14 below formal governance threshold · 3 with customer-facing inference · 2 with pricing decision integration

**Linked KPIs.** AI Governance Maturity (2.8.2), Cybersecurity Maturity (2.8.1), CSAT Omnichannel (2.3.2), Conversion Rate Digital (2.3.6)

### 3.4 · Customer Data Platform Consolidation

Foundational cross-industry pattern — retail application.

**Detection signals.** Multiple customer data stores (CRM, loyalty, e-commerce, stores, marketing) without unified view · segmentation inconsistency across channels · customer experience personalization limited · data quality degradation in 360 views

**Apex evidence.** 4 customer data stores (enterprise CRM, loyalty platform, e-commerce customer, store clienteling) · segmentation consistency <60% across channels · loyalty penetration stalled at 62M while peers growing

**Linked KPIs.** Loyalty Active Members (2.3.7), Loyalty Member Spend Premium (2.3.8), Retention (2.3.9), NPS (2.3.1)

### 3.5 · Enterprise Analytics Modernization

Foundational cross-industry pattern.

**Detection signals.** Analytics capability fragmented across BUs · data platform not scaled for current workloads · analytical talent concentration in small team · use case backlog significantly exceeds delivery

**Apex evidence.** 3 distinct analytics platforms across merchandising/customer/supply chain · use case backlog 73 identified, 18 delivered · analytics talent concentrated in 28-person team serving $80B revenue enterprise

**Linked KPIs.** AI Governance Maturity (2.8.2), Decision Latency Capital (2.8.3)

### 3.6 · Store Workforce Productivity and Engagement Gap

Foundational cross-industry pattern — retail-specific application.

**Detection signals.** Store engagement <70% while retention target-level · productivity below peer median · labor scheduling rigidity · career path clarity issues · compensation competitiveness gaps

**Apex evidence.** 68% engagement vs 76% target · 62% retention above industry but below aspiration · labor model designed for stability not flexibility · career progression unclear for 60%+ of store team

**Linked KPIs.** Store Engagement (2.7.1), Store Retention (2.7.2), Store Labor Productivity (2.5.1), Customer Satisfaction (2.3.2)

### 3.7 · Loss Prevention Modernization

Retail-specific pattern (not in core 20, Apex-specific severity).

**Detection signals.** Shrinkage >1.5% · organized retail crime evidence · associate safety concerns · community relations tension · technology investment below industry pace

**Apex evidence.** 1.8% shrinkage vs 1.3% target and 1.5% median · concentrated ORC in 40 high-priority stores · associate safety incident rate up 40% YoY · technology investment trailing peer pace

**Linked KPIs.** Shrinkage (2.5.2), Store Engagement (2.7.1), Store Operational Availability (2.5.5)

---

## Part 4 · External Signal Envelope

### 4.1 · Tracked executives (name-level)

**Executive Committee (~12).** CEO, CFO, COO, Chief Merchandising Officer, Chief Customer Officer, Chief Digital Officer, Chief Supply Chain Officer, Chief People Officer, Chief Legal Officer, Chief Communications Officer, Chief Marketing Officer, Chief Technology Officer.

**Extended leadership (~20 SVPs).** Per base seed.

### 4.2 · Tracked business units

Merchandising, Customer, Digital, Supply Chain, Stores Operations, Marketing, Owned Brands, Technology, Finance, Human Resources, Legal, Corporate Affairs.

### 4.3 · Tracked initiatives

All active initiatives from base seed. Owned Brand Expansion, Digital Commerce Modernization, Supply Chain Optimization, Customer Experience Transformation, Loyalty Program 2.0, Inventory Precision, Store Experience Program, Cybersecurity Modernization, AI Platform and Governance, Loss Prevention Modernization.

### 4.4 · Tracked vendor and partner relationships

**Technology.** Microsoft Azure, AWS, Snowflake, Databricks, Salesforce, Adobe, SAP, Workday, Splunk, Okta, Oracle (retail), Manhattan Associates (supply chain), Relex Solutions (demand forecasting), Dynamic Yield (personalization).

**AI/ML.** OpenAI, Anthropic, AWS Bedrock, Google Cloud AI.

**Last-mile and fulfillment.** DoorDash, Instacart, FedEx, UPS, USPS.

**Merchandise suppliers.** Top 40 consumer brands partnerships (tracked at aggregate level).

### 4.5 · Tracked peer competitors

**Primary peer set.** Target, Walmart, Costco, Kroger, Amazon (retail segment), Best Buy.

**Extended peers.** Home Depot, Lowe's, TJX, Dollar General, Dollar Tree, Aldi, Whole Foods, Trader Joe's, Wayfair (category-specific benchmarks).

**Specialty benchmarks.** Sephora (beauty), REI (specialty), Trader Joe's (owned brand), Costco (membership loyalty).

### 4.6 · Tracked topics

**Strategic priority-linked.** Owned brand growth, digital commerce, customer experience, supply chain resilience, store experience, loyalty and personalization, operational excellence.

**Industry-level.** Retail consolidation, digital disruption, consumer behavior shifts, supply chain dynamics, inflation and pricing, retail media, AI in retail, labor and wage dynamics, shrinkage and ORC, sustainability and ESG.

**Event-driven.** Competitor earnings, competitor product launches, M&A activity, executive moves, labor actions, major cybersecurity incidents (industry-level), regulatory actions.

### 4.7 · Geographic scope

Primary: United States. Secondary (via cross-border e-commerce): Canada, Mexico. Monitoring: supply chain origin markets (China, Vietnam, India, Central America).

---

## Part 5 · Operational Telemetry Sources · 9 Registered

All entries are composite-world simulations establishing architectural patterns. When real retail clients onboard, same source types instantiated with real data.

### 5.1 · Weekly Merchandise Operating Review Deck

- **ID:** `apex_weekly_merch_review`
- **Description:** CMO's weekly merchandising performance review
- **Modality:** Export (PowerPoint) · weekly refresh
- **KPIs populated:** 2.2.1-2.2.6 (merchandising), 2.1.2 (comp sales), 2.1.3 (gross margin), category-level detail
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** competitively-sensitive (category performance, supplier-level data)
- **Reasoning scope:** Merchandising Transformation programs, Executive Advisory
- **Disclosure scope:** Merchandising programs (full) · Executive Advisory (full) · other programs (aggregate enterprise level only)

### 5.2 · CFO Financial Scorecard (Power BI)

- **ID:** `apex_cfo_scorecard`
- **Description:** Weekly financial performance scorecard
- **Modality:** API (Power BI) · weekly
- **KPIs populated:** 2.1.1-2.1.6, cash position, debt metrics, capex tracking
- **Residency mode:** client_owned_client_hosted (material non-public information)
- **Compliance tags:** SOX, MNPI, SEC disclosure
- **Reasoning scope:** Finance Transformation, Executive Advisory
- **Disclosure scope:** Finance Transformation (full) · Executive Advisory (full) · others (reasoning-only; specific values never disclosed)

### 5.3 · Digital Commerce Performance Dashboard (Tableau)

- **ID:** `apex_digital_dashboard`
- **Description:** E-commerce and digital performance
- **Modality:** API (Tableau) · daily
- **KPIs populated:** 2.4.1-2.4.4 (digital), 2.3.5 (store conversion), 2.3.6 (digital conversion)
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** PII (customer-level aggregated), state privacy laws
- **Reasoning scope:** Digital Commerce programs, Customer Experience programs, Executive Advisory
- **Disclosure scope:** Digital/CX programs (full) · Executive Advisory (aggregate)

### 5.4 · Store Operations Dashboard

- **ID:** `apex_store_ops_dashboard`
- **Description:** Store-level operational performance
- **Modality:** API (internal dashboard platform) · daily
- **KPIs populated:** 2.5.1-2.5.5 (operational), 2.2.4 (sell-through), store-level detail
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** employee-data-linked, PII, competitive-sensitivity at store detail
- **Reasoning scope:** Store Operations programs, Executive Advisory, Loss Prevention program (subset)
- **Disclosure scope:** Store Ops programs (full) · Executive Advisory (aggregate) · Loss Prevention program (security-relevant subset)

### 5.5 · Customer Analytics Platform (Customer 360)

- **ID:** `apex_customer_360`
- **Description:** Customer analytics dashboards across loyalty, behavior, segmentation
- **Modality:** API (enterprise analytics platform) · daily
- **KPIs populated:** 2.3.1-2.3.9 (customer and loyalty)
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** PII, state privacy (CCPA, etc.), loyalty data regulatory
- **Reasoning scope:** Customer Experience, Loyalty, Marketing programs, Executive Advisory
- **Disclosure scope:** CX/Loyalty programs (aggregate + segment-level) · no customer-specific data disclosable · Executive Advisory (aggregate)

### 5.6 · Supply Chain Performance Tracker

- **ID:** `apex_supply_chain_tracker`
- **Description:** Supply chain and inventory performance
- **Modality:** API (Manhattan + custom) · daily
- **KPIs populated:** 2.1.5 (inventory turns), 2.2.6 (vendor fill), 2.5.3-2.5.4 (operational), 2.6.1-2.6.3 (supply chain)
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** supplier-confidential, competitive-sensitivity
- **Reasoning scope:** Supply Chain programs, Merchandising programs, Executive Advisory
- **Disclosure scope:** Supply Chain (full) · Merchandising (supplier-aggregated) · Executive Advisory (aggregate) · others (reasoning-only)

### 5.7 · Technology Investment and Portfolio Tracker

- **ID:** `apex_tech_portfolio_tracker`
- **Description:** Enterprise technology portfolio, architecture, spend
- **Modality:** Export (Excel monthly) + share-link architecture diagrams
- **KPIs populated:** 2.8.1 (cybersecurity), 2.8.2 (AI governance), application portfolio, vendor spend
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** cybersecurity-sensitive, vendor-confidential
- **Reasoning scope:** Technology Transformation, Cybersecurity, AI Platform programs, Executive Advisory
- **Disclosure scope:** per-program scope · cybersecurity specifics tightly restricted

### 5.8 · Loss Prevention and Security Dashboard

- **ID:** `apex_loss_prevention_dashboard`
- **Description:** Shrinkage, ORC, safety, security metrics
- **Modality:** API (internal LP platform) · weekly
- **KPIs populated:** 2.5.2 (shrinkage), incident data, ORC trends
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** law-enforcement-sensitive, employee-safety, public-safety
- **Reasoning scope:** Loss Prevention program, Executive Advisory, Store Operations programs (aggregate)
- **Disclosure scope:** LP program (full) · Executive Advisory (aggregate) · Store Operations (store-level high-level only) · other programs (aggregate only, no incident specifics)

### 5.9 · Workforce Analytics (Workday-based)

- **ID:** `apex_workforce_analytics`
- **Description:** Employee engagement, retention, compensation, development
- **Modality:** API (Workday) · weekly
- **KPIs populated:** 2.7.1-2.7.3 (employee)
- **Residency mode:** client_owned_abarva_hosted
- **Compliance tags:** PII (employee), labor relations, state employment law
- **Reasoning scope:** HR Strategy, Workforce Transformation programs, Executive Advisory
- **Disclosure scope:** HR programs (aggregate and role-level) · Executive Advisory (aggregate) · no individual employee data disclosable

### 5.10 · Telemetry source summary

| Source | Modality | Refresh | Residency | Most restricted by |
|---|---|---|---|---|
| Weekly Merch Review | Export | Weekly | AbarVa-hosted | Competitive + supplier sensitivity |
| CFO Scorecard | API | Weekly | Client-hosted | SOX + MNPI |
| Digital Dashboard | API | Daily | AbarVa-hosted | PII + state privacy |
| Store Ops Dashboard | API | Daily | AbarVa-hosted | Employee-linked + PII |
| Customer 360 | API | Daily | AbarVa-hosted | PII + state privacy |
| Supply Chain Tracker | API | Daily | AbarVa-hosted | Supplier-confidential |
| Tech Portfolio | Export | Monthly | AbarVa-hosted | Cybersecurity-sensitive |
| Loss Prevention | API | Weekly | AbarVa-hosted | Law enforcement + safety |
| Workforce Analytics | API | Weekly | AbarVa-hosted | PII + labor relations |

---

## Part 6 · Dual-Scope Configuration Examples

### 6.1 · Scenario: Customer Experience Transformation program

**Reasoning access:** Customer 360 (5.5), Digital dashboard (5.3), Store ops (5.4), Customer satisfaction data across sources. CFO scorecard in reasoning-only mode (CX investment constraints inform strategy).

**Disclosure access:** Customer analytics aggregate + segment-level. Digital performance. Store experience metrics. CFO scorecard specific figures NOT disclosable — only general capital posture.

**Example conversational pattern.** CX leader asks: "Should we fund the personalization engine or the loyalty tier refresh?" Agent reasons from capital constraints (CFO scorecard, reasoning-only), customer analytics (Customer 360, full), and competitive context (external signals). Response: "Given the capital runway and what peer personalization engines are returning, I'd lean personalization first. The loyalty tier refresh can sequence behind it and benefit from the personalization backbone. Want to sketch what a phased plan looks like?"

### 6.2 · Scenario: Loss Prevention program with law enforcement sensitivity

**Reasoning access:** Loss Prevention dashboard (5.8) full, Store Ops (5.4), external signal on ORC trends industry-wide.

**Disclosure access:** Loss Prevention program team full disclosure. Store-level incident specifics never disclosable outside LP program. Aggregate shrinkage metrics disclosable to Executive Advisory. Store-specific ORC patterns reasoning-only for most programs given law enforcement coordination sensitivity.

### 6.3 · Scenario: Merchandising and competitive sensitivity

**Situation.** Weekly merchandising review contains category-level margin and supplier-level performance data. Competitively sensitive.

**Reasoning access:** Merchandising program maestro full. Executive Advisory full. Supply Chain program maestro full. Others reasoning-only on derived implications.

**Disclosure access:** Merchandising program (full). Executive Advisory (aggregate enterprise). Other programs cannot surface category-level or supplier-level specifics. Informed indirection when relevant.

**Example scenario.** CX leader asks: "Why are our prices lagging Target in home goods?" CX program's agent has reasoning access to merchandising review data. Response: "I can see the pattern in the competitive positioning — there's a gap in category pricing architecture that the merchandising team is actively working on. I can't share the specific margin and supplier analysis, but I can tell you the work-in-flight is oriented toward closing exactly the gap you're describing. Worth a conversation with CMO's team?"

Agent used competitively-sensitive data to reason, didn't disclose specifics, gave genuinely useful strategic direction.

---

## Part 7 · Graph Entity Population Summary

- **Client entities:** 1 (Apex Retail Group)
- **Person entities:** ~35 (full exec committee + extended leadership)
- **Role entities:** ~30
- **StrategicPriority entities:** 6
- **Initiative entities:** ~15
- **KPI entities:** 34
- **Pattern entities:** 7 (upgraded to full packs)
- **System entities:** ~25 (merchandising, customer, operations, digital, supply chain)
- **Vendor entities:** ~30
- **Benchmark entities:** ~40
- **TelemetrySource entities:** 9
- **ExternalEvent entities:** ~50 (initial seed)
- **Evidence entities:** ~200
- **Source entities:** ~30
- **Contradiction entities:** ~5
- **Risk entities:** ~12

**Total approximate entity count: ~530**

Edge counts scale with entity relationships; approximately 2,300-3,200 edges at full depth.

---

## Part 8 · Smoke Tests

**KPI queries.**
1. "What is Apex's owned brand penetration?" → 24% with trend, target, peer benchmark
2. "Who owns the same-day fulfillment metric?" → owner returned from CCO organization
3. "How does Apex compare on comp sales growth?" → 1.4% vs 1.9% median, peer position bottom half
4. "What KPIs does the Omnichannel Fulfillment pattern degrade?" → Same-Day Fulfillment, Click-and-Collect, OOS, CSAT

**Pattern queries.**
5. "What patterns are active at Apex?" → 7 patterns with evidence
6. "What interventions apply to Owned Brand Margin pattern?" → structured intervention options
7. "What Phase 2 deliverables for Omnichannel Fulfillment pattern?" → structured deliverable list

**Telemetry and dual-scope queries.**
8. "What operational telemetry sources registered?" → 9 sources with modality
9. "Can CX program maestro see CFO scorecard figures?" → reasoning yes, disclosure no
10. "What's the loss prevention data handling?" → law enforcement sensitivity description

**Complex reasoning.**
11. "Should Apex prioritize personalization engine or loyalty refresh?" → informed multi-factor response
12. "What's changed at Apex this quarter?" → external signal synthesis

---

## Part 9 · Ingestion Notes for Codex

### 9.1 · Applies north star to Apex per established Keystone template

This overlay follows the exact same structure as the Keystone overlay. Ingestion logic should be template-driven at this point — most of the schema heavy-lifting happened in A1 (Keystone + schema migration PR). Apex overlay is a data instantiation task.

### 9.2 · Base seed already ingested in PR #22

The Apex base seed was merged in PR #22 (Apex + Meridian + First Capital comprehensive seeds). This overlay extends that base with intelligence layer depth.

### 9.3 · Preserve PR #22 conventions

Short name compatibility (`clients.name = "Apex Retail"`) preserved. Benchmark data in `org_master_data.benchmark_data` JSONB.

### 9.4 · Smoke test priority

12 smoke tests from Part 8 should all pass post-ingestion. Use same smoke test harness established in A1.

### 9.5 · Template validation

This ingestion validates that the north star schema is genuinely template-driven across composites. Apex ingestion should reuse the Keystone ingestion pipeline with data swap only — no architectural changes.

---

**END OF APEX INTELLIGENCE LAYER OVERLAY**

*Companion to intelligence-layer-north-star-spec.md and apex-retail-group-comprehensive-seed.md. Second in four-composite intelligence layer instantiation sequence. Retail sector reference implementation.*
