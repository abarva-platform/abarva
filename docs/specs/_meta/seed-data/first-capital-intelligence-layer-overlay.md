# First Capital Financial · Intelligence Layer Overlay

**The First Capital-specific instantiation of the AbarVa Intelligence Layer North Star Specification v1.0. Extends the base First Capital Financial composite seed with KPI architecture, pattern pack upgrades, telemetry sources, external signal envelope, and dual-scope configuration per the north star specification.**

Reads alongside:
- `docs/specs/platform/intelligence-layer-north-star-spec.md` — authoritative north star
- `docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md` — base tenant seed (ingested in PR #22)

**First Capital is the Truist-class super-regional bank composite.** This overlay introduces the financial services sector into AbarVa's intelligence architecture with particular attention to the BSA/AML regulatory context (active consent order baseline), capital and liquidity regulatory overlays, and the cross-franchise (commercial banking + wealth + consumer) dynamics that define super-regional banks.

---

## Part 1 · Scope

This overlay adds to the base First Capital seed:

- **36 first-class KPI objects** across financial performance, credit, capital, deposits, loans, wealth, digital, and risk/compliance categories (Part 4)
- **7 pattern packs** upgraded from narrative to full schema (Part 6)
- **External signal envelope** for banking sector (Part 8)
- **9 operational telemetry sources** with regulatory-aware dual-scope access control (Parts 9-10)
- **Dual-scope configuration** with MNPI and legal-privileged handling (Part 11)
- **Graph entity population plan** reflecting franchise-structure complexity

**Financial-sector architectural notes:** This overlay exercises the most complex regulatory-compliance framework in AbarVa's composite set. GLBA, FFIEC guidance, SOX, PCI DSS, BSA/AML, state banking, OCC/Federal Reserve/FDIC all apply simultaneously. The active BSA/AML consent order context creates legal-privileged material handling requirements. Codex should treat this as validation of north star's regulatory-complexity handling.

---

## Part 2 · KPI Architecture · 36 First-Class Metrics

### 2.1 · Financial performance KPIs

**2.1.1 — Net Interest Margin**
- ID: `firstcap_nim` · Owner: CFO (Daniel Kovač) · Strategic priority: Margin Protection
- Target: 3.35% · Current: 3.12% · Trend: down 18 bps YoY · Benchmark median (super-regional): 3.28%
- Linked patterns: Deposit Cost and Franchise Value Erosion (3.2)
- Reasoning scope: broad · Disclosure scope: broad (public)

**2.1.2 — Efficiency Ratio**
- ID: `firstcap_efficiency_ratio`
- Current: 59.4% · Target: 55.0% · Benchmark median: 57.8% · Peer position: bottom half
- Linked initiatives: Operating Model Modernization
- Reasoning scope: broad · Disclosure scope: broad

**2.1.3 — Return on Assets (ROA)**
- ID: `firstcap_roa` · Current: 1.08% · Target: 1.25% · Benchmark median: 1.18%
- Reasoning scope: broad · Disclosure scope: broad

**2.1.4 — Return on Tangible Common Equity (ROTCE)**
- ID: `firstcap_rotce` · Current: 12.4% · Target: 15.5% · Benchmark median: 14.2%
- Reasoning scope: broad · Disclosure scope: broad

**2.1.5 — Pre-Provision Net Revenue**
- ID: `firstcap_ppnr` · Current: $4.2B annualized · Target: $5.0B
- Reasoning scope: broad · Disclosure scope: broad

**2.1.6 — Non-Interest Income Ratio**
- ID: `firstcap_non_interest_income_ratio`
- Current: 28% of total revenue · Target: 35% · Benchmark median: 32%
- Linked initiatives: Wealth Expansion, Fee Income Acceleration
- Reasoning scope: broad · Disclosure scope: broad

### 2.2 · Credit quality KPIs

**2.2.1 — Net Charge-Off Rate**
- ID: `firstcap_nco_rate`
- Current: 0.42% · Target: <0.35% · Benchmark median: 0.38%
- Trend: elevated from 0.28% prior year
- Reasoning scope: broad · Disclosure scope: broad (public)

**2.2.2 — Non-Performing Loan Ratio**
- ID: `firstcap_npl_ratio`
- Current: 0.68% · Target: <0.50% · Benchmark median: 0.55%
- Reasoning scope: broad · Disclosure scope: broad

**2.2.3 — Allowance for Loan and Lease Losses (ALLL) / Total Loans**
- ID: `firstcap_alll_to_loans`
- Current: 1.48% · Target: 1.35% (after reserve normalization)
- Reasoning scope: broad · Disclosure scope: broad

**2.2.4 — Commercial Real Estate Concentration**
- ID: `firstcap_cre_concentration`
- Current: 268% of total regulatory capital · Target: <250% · Regulatory threshold monitoring: 300%
- Linked patterns: Portfolio Concentration Risk Management (3.6)
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Risk, Credit, Executive — full; regulatory-sensitive for others)

**2.2.5 — C&I Delinquency**
- ID: `firstcap_ci_delinquency`
- Current: 1.2% · Target: <0.9% · Benchmark median: 1.0%
- Reasoning scope: broad · Disclosure scope: broad

### 2.3 · Capital and liquidity KPIs

**2.3.1 — Tier 1 Capital Ratio**
- ID: `firstcap_tier1_capital_ratio`
- Current: 11.8% · Target: 11.5-12.0% (management target) · Regulatory minimum: 8.5%
- Reasoning scope: broad · Disclosure scope: broad

**2.3.2 — CET1 Capital Ratio**
- ID: `firstcap_cet1_ratio`
- Current: 10.9% · Target: 10.5-11.0% · Regulatory minimum: 7.0%
- Reasoning scope: broad · Disclosure scope: broad

**2.3.3 — Liquidity Coverage Ratio (LCR)**
- ID: `firstcap_lcr`
- Current: 128% · Regulatory minimum: 100% · Target: 115-125%
- Reasoning scope: broad · Disclosure scope: broad (required)

**2.3.4 — Net Stable Funding Ratio (NSFR)**
- ID: `firstcap_nsfr`
- Current: 118% · Regulatory minimum: 100%
- Reasoning scope: broad · Disclosure scope: broad

**2.3.5 — Loan-to-Deposit Ratio**
- ID: `firstcap_loan_to_deposit`
- Current: 86% · Target: 82-88% range · Benchmark median: 84%
- Reasoning scope: broad · Disclosure scope: broad

### 2.4 · Deposits and balance sheet KPIs

**2.4.1 — Deposit Growth**
- ID: `firstcap_deposit_growth`
- Current: -2.1% YoY · Target: +3.0% · Industry context: deposit competition intense
- Linked patterns: Deposit Cost and Franchise Value Erosion (3.2)
- Reasoning scope: broad · Disclosure scope: broad

**2.4.2 — Cost of Deposits**
- ID: `firstcap_cost_of_deposits`
- Current: 248 bps · Target: <200 bps · Trend: up 82 bps YoY
- Linked patterns: Deposit Cost and Franchise Value Erosion
- Reasoning scope: broad · Disclosure scope: broad

**2.4.3 — Non-Interest-Bearing Deposit %**
- ID: `firstcap_nib_deposit_pct`
- Current: 22% · Target: 28% · Benchmark median: 26%
- Trend: declining (franchise value erosion signal)
- Reasoning scope: broad · Disclosure scope: broad

**2.4.4 — Deposit Attrition Rate**
- ID: `firstcap_deposit_attrition`
- Current: 8.4% annualized · Target: <6.5% · Benchmark median: 7.1%
- Reasoning scope: broad · Disclosure scope: broad

**2.4.5 — Commercial Deposit Concentration (Top 25)**
- ID: `firstcap_commercial_concentration_top25`
- Current: 18% of total deposits from top 25 commercial relationships
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Commercial Banking, Risk, Executive disclosable; others aggregate only)

### 2.5 · Loan KPIs

**2.5.1 — Loan Growth (Total)**
- ID: `firstcap_loan_growth_total` · Current: 1.8% YoY · Target: 4.0%
- Reasoning scope: broad · Disclosure scope: broad

**2.5.2 — Commercial Mix**
- ID: `firstcap_commercial_mix`
- Current: 58% of total loans · Target: 55-60% (balance)
- Reasoning scope: broad · Disclosure scope: broad

**2.5.3 — Production-to-Payoff Ratio**
- ID: `firstcap_production_to_payoff`
- Current: 1.12 · Target: 1.25
- Reasoning scope: broad · Disclosure scope: broad

**2.5.4 — Yield on Earning Assets**
- ID: `firstcap_yield_earning_assets` · Current: 5.42% · Target: 5.65%
- Reasoning scope: broad · Disclosure scope: broad

### 2.6 · Wealth management KPIs

**2.6.1 — AUM Growth**
- ID: `firstcap_aum_growth`
- Owner: Head of Wealth · Target: 8% annual organic · Current: 4.2%
- Linked patterns: Cross-Franchise Relationship Deepening Gap (3.7)
- Reasoning scope: broad · Disclosure scope: broad

**2.6.2 — Wealth Client Retention**
- ID: `firstcap_wealth_client_retention`
- Current: 92% · Target: 96% · Benchmark median: 94%
- Reasoning scope: broad · Disclosure scope: broad

**2.6.3 — Net New Households (Wealth)**
- ID: `firstcap_wealth_net_new_households` · Current: 1,800 annual · Target: 3,500
- Reasoning scope: broad · Disclosure scope: broad

**2.6.4 — Advisor Productivity ($ AUM per Advisor)**
- ID: `firstcap_advisor_productivity` · Current: $180M · Target: $220M
- Reasoning scope: broad · Disclosure scope: broad

**2.6.5 — Fee-to-AUM (bps)**
- ID: `firstcap_fee_to_aum` · Current: 72 bps · Target: 78 bps
- Reasoning scope: broad · Disclosure scope: broad

### 2.7 · Digital and customer KPIs

**2.7.1 — Digital Adoption (Consumer)**
- ID: `firstcap_digital_adoption_consumer`
- Current: 74% · Target: 88% · Benchmark median: 82%
- Reasoning scope: broad · Disclosure scope: broad

**2.7.2 — Mobile Active User Growth**
- ID: `firstcap_mobile_mau_growth` · Current: 4% YoY · Target: 12%
- Reasoning scope: broad · Disclosure scope: broad

**2.7.3 — JD Power Retail Banking CSAT**
- ID: `firstcap_jdpower_retail_csat`
- Current: 810 · Target: 840 (top quartile) · Benchmark median: 822
- Reasoning scope: broad · Disclosure scope: broad

**2.7.4 — Net New Primary Households (Consumer)**
- ID: `firstcap_net_new_primary_households`
- Current: 14,000 annual · Target: 35,000
- Linked patterns: Cross-Franchise Relationship Deepening Gap (3.7)
- Reasoning scope: broad · Disclosure scope: broad

**2.7.5 — Digital Account Opening %**
- ID: `firstcap_digital_account_opening_pct`
- Current: 42% of new accounts · Target: 68%
- Reasoning scope: broad · Disclosure scope: broad

### 2.8 · Risk and compliance KPIs

**2.8.1 — BSA/AML Alert Volume**
- ID: `firstcap_aml_alert_volume`
- Current: 24,000 monthly · Alert-to-SAR ratio monitored separately
- Linked patterns: AML/BSA Compliance Modernization (3.1)
- Linked initiatives: BSA/AML Modernization Program (per consent order)
- Reasoning scope: broad · Disclosure scope: **program-scoped + legal-privileged** (BSA/AML, Compliance, Legal disclosable; aggregate only for others)

**2.8.2 — AML False Positive Rate**
- ID: `firstcap_aml_false_positive_rate`
- Current: 96% · Target: 85% · Benchmark median: 90%
- Linked patterns: AML/BSA Compliance Modernization
- Reasoning scope: broad · Disclosure scope: **program-scoped + legal-privileged**

**2.8.3 — SAR Filings (Monthly Average)**
- ID: `firstcap_sar_filings_monthly` · Current: ~140 · Tracked against investigation quality metrics
- Reasoning scope: **program-scoped** (BSA/AML, Compliance, Legal only) · Disclosure scope: **program-scoped + legal-privileged** (BSA/AML disclosable; aggregate-only cross-program; external disclosure prohibited)

**2.8.4 — Regulatory Exam Findings (Open)**
- ID: `firstcap_regulatory_exam_findings_open`
- Current: 12 (range from low-severity to Matters Requiring Attention)
- Linked initiatives: Regulatory Remediation Programs (multi-agency)
- Reasoning scope: **program-scoped** (affected programs, Compliance, Legal, Executive) · Disclosure scope: **program-scoped + legal-privileged**

**2.8.5 — Operational Risk Losses (12-Month)**
- ID: `firstcap_op_risk_losses_12mo` · Current: $28M
- Reasoning scope: broad · Disclosure scope: program-scoped (aggregate for most programs; specifics for Risk Management)

**2.8.6 — Fraud Loss Rate (Consumer)**
- ID: `firstcap_fraud_loss_rate_consumer`
- Current: 4.2 bps · Target: <3.5 bps · Benchmark median: 3.8 bps
- Reasoning scope: broad · Disclosure scope: broad

### 2.9 · Cross-functional KPIs

**2.9.1 — Cybersecurity Maturity (FFIEC CAT)**
- ID: `firstcap_cybersecurity_maturity_cat`
- Current: Intermediate stage · Target: Advanced (regulatory expectation)
- Reasoning scope: broad · Disclosure scope: **program-scoped** (Cybersecurity, Executive full; others aggregate only given bank-specific critical infrastructure sensitivity)

**2.9.2 — AI Governance Maturity**
- ID: `firstcap_ai_governance_maturity`
- Current: Stage 2 · Target: Stage 4 (ahead of peer median given regulatory environment)
- Linked patterns: Shadow AI in Lending and Customer Operations (3.3)
- Reasoning scope: broad · Disclosure scope: broad

**2.9.3 — Model Risk Management Maturity (SR 11-7)**
- ID: `firstcap_mrm_maturity`
- Current: Intermediate · Target: Advanced
- Reasoning scope: broad · Disclosure scope: broad

### 2.10 · KPI relationship graph summary

**Primary clusters.** Financial Performance · Credit Quality · Capital/Liquidity · Deposits · Loans · Wealth · Digital · Risk/Compliance · Cross-Functional.

**Cross-cluster (franchise-integrated) relationships.**
- Cost of Deposits (2.4.2) → NIM (2.1.1) → ROA (2.1.3)
- Commercial Concentration (2.4.5) + CRE Concentration (2.2.4) → Credit Quality cluster
- Net New Primary Households (2.7.4) → Wealth AUM Growth (2.6.1) via cross-franchise pattern (3.7)
- BSA/AML Alert Volume (2.8.1) + False Positive Rate (2.8.2) → Operational Risk (2.8.5) + efficiency (2.1.2)

**Pattern-affected clusters.**
- AML/BSA Modernization → 2.8.1, 2.8.2, 2.8.3, 2.1.2 (efficiency)
- Deposit Cost and Franchise Erosion → 2.4.1, 2.4.2, 2.4.3, 2.1.1
- Cross-Franchise Deepening → 2.6.1, 2.7.4, 2.6.3
- Portfolio Concentration → 2.2.4, 2.4.5, 2.2.1

---

## Part 3 · Pattern Pack Upgrades · 7 Patterns to Full Schema

### 3.1 · AML/BSA Compliance Modernization

Foundational pattern pack #15 — financial-services-specific.

**Classification.** Category: Regulatory Compliance — Financial Crimes · Sector applicability: financial services (all depository institutions, broker-dealers, crypto)

**Detection signals.**
- False positive rate >90% on AML alerts
- Alert-to-SAR ratio heavily skewed to false positives
- Investigator workload exceeding benchmark productivity
- Open MRA or consent order related to BSA/AML
- Legacy monitoring platform age >5 years
- Minimal machine learning adoption in transaction monitoring

**Likely root causes.** Legacy rule-based monitoring with excessive false positives · investigator capacity constrained · machine learning adoption blocked by model risk management process · regulatory scrutiny following prior findings · data integration gaps across banking systems

**Intervention options.**
- Machine learning model deployment for alert prioritization (MRM-compliant)
- Investigator workflow automation
- Platform modernization (typically 24-36 month program)
- Data integration across transaction sources
- Regulatory constructive engagement on modernization roadmap

**Phase-mapped deliverables.**

*Phase 1.* Current state audit · consent order/MRA mapping · platform assessment · benchmark analysis · regulator relationship mapping

*Phase 2.* Platform options · ML governance options · workflow automation opportunities · regulatory engagement plan

*Phase 3.* Platform decision · implementation roadmap · MRM integration plan · regulator engagement strategy

*Phase 4.* Platform build · model deployment · workflow rollout · regulatory milestone tracking

**Expected outcomes.** False positive rate reduction 20-30 points within 18 months · investigator productivity up 40%+ · consent order/MRA path to closure · efficiency ratio improvement 30-50 bps

**Required sponsor profile.** Chief Compliance Officer with CFO + Chief Risk Officer partnership · enterprise scope · high political capital given regulatory context

**Linked KPIs.** AML Alert Volume (2.8.1), AML False Positive Rate (2.8.2), SAR Filings (2.8.3), Regulatory Exam Findings (2.8.4), Efficiency Ratio (2.1.2)

**First Capital evidence.** Active consent order context (per base seed) · 96% false positive rate vs 85% target · investigator productivity below peer · regulatory remediation commitments outstanding

**Sensitivity.** All First Capital AML-related work carries **legal-privileged** material handling. Reasoning scope is program-scoped; disclosure scope is strictly program-scoped with external communication prohibited.

### 3.2 · Deposit Cost and Franchise Value Erosion

Foundational pattern pack — financial-services-specific.

**Classification.** Category: Balance Sheet Management — Deposit Franchise · Sector applicability: banking

**Detection signals.**
- Deposit growth negative while industry flat-to-positive
- Non-interest-bearing deposit % declining materially
- Cost of deposits increasing faster than Fed Funds rate
- Deposit attrition concentrated in specific customer segments
- Franchise value (deposit premium implied in market cap) contracting

**Likely root causes.** Rate environment + competitive response · digital-native competition · wealth-adjacent customers moving to money market funds · commercial customer liquidity management · branch network vs digital experience asymmetry · loyalty/relationship depth insufficient to resist rate shopping

**Intervention options.**
- Deposit pricing strategy refinement (segmented approach)
- Primary-relationship depth increase (cross-franchise pattern)
- Digital experience competitiveness acceleration
- Treasury services expansion for commercial deposits
- Branch network rationalization with digital substitution

**Linked KPIs.** Deposit Growth (2.4.1), Cost of Deposits (2.4.2), NIB Deposit % (2.4.3), Deposit Attrition (2.4.4), NIM (2.1.1)

**First Capital evidence.** -2.1% deposit growth · 248 bps cost of deposits up 82 bps · NIB % declining · NIM compression 18 bps YoY

### 3.3 · Shadow AI in Lending and Customer Operations

Financial-services variant of cross-sector Shadow AI Governance pattern.

**Financial-sector-specific sensitivities.** Fair lending implications (model discrimination risk) · model risk management non-compliance · regulatory scrutiny on AI in credit decisioning · customer-facing AI without fair-treatment oversight

**First Capital evidence.** 12 AI tools identified · 7 below governance threshold · 3 in credit-adjacent workflows (fair lending risk) · 2 customer-facing without model governance

**Linked KPIs.** AI Governance Maturity (2.9.2), Model Risk Management Maturity (2.9.3), Cybersecurity Maturity (2.9.1)

### 3.4 · Portfolio Concentration Risk Management

Financial-services-specific pattern.

**Detection signals.** Commercial real estate concentration >250% of capital · commercial concentration (top 25) >15% of deposits · geographic concentration in specific markets · industry sector concentration · regulatory concentration flag triggers

**First Capital evidence.** 268% CRE concentration (regulatory threshold 300%) · 18% top-25 commercial concentration · geographic concentration in primary banking markets

**Linked KPIs.** CRE Concentration (2.2.4), Commercial Concentration Top 25 (2.4.5), Net Charge-Off Rate (2.2.1), NPL Ratio (2.2.2)

### 3.5 · Operating Model Efficiency Gap

Foundational cross-sector pattern — financial-services application.

**Detection signals.** Efficiency ratio >58% · peer efficiency variance · technology debt constraining productivity · operating model fragmentation across business units

**First Capital evidence.** 59.4% efficiency ratio · productivity variance across franchise segments · technology platform fragmentation (legacy core + acquired platforms)

**Linked KPIs.** Efficiency Ratio (2.1.2), Operating Risk Losses (2.8.5)

### 3.6 · Digital Customer Acquisition Gap

Financial-services-specific pattern.

**Detection signals.** Digital account opening % <50% · mobile adoption trailing peers · net new primary household growth insufficient · CAC-LTV ratio unfavorable

**First Capital evidence.** 42% digital account opening vs 68% target · mobile MAU growth 4% vs 12% target · 14K net new primary households vs 35K target

**Linked KPIs.** Digital Account Opening (2.7.5), Mobile MAU Growth (2.7.2), Net New Primary Households (2.7.4), Digital Adoption (2.7.1)

### 3.7 · Cross-Franchise Relationship Deepening Gap

Foundational pattern pack #16 — financial-services-specific (primary franchise-model banks).

**Classification.** Category: Franchise Integration — Customer Deepening · Sector applicability: super-regional banks, universal banks

**Detection signals.**
- Wealth-bank cross-sell rate <5%
- Commercial-wealth cross-sell rate <15%
- Net new primary household growth below industry
- Wealth AUM growth below organic peer benchmark
- Referral program productivity low
- Franchise-integration technology incomplete

**Likely root causes.** Franchise silos (legacy of M&A integration) · compensation alignment absent across franchises · technology platform separation preventing 360-view · referral processes manual · brand positioning not unified

**Intervention options.**
- Cross-franchise technology platform (unified customer 360)
- Compensation realignment
- Referral process automation
- Integrated brand architecture
- Unified client experience design

**Linked KPIs.** AUM Growth (2.6.1), Net New Households Wealth (2.6.3), Net New Primary Households Consumer (2.7.4)

**First Capital evidence.** 4.2% AUM growth vs 8% target · 1.8K net new wealth households vs 3.5K target · cross-franchise cross-sell rate at 3% · legacy franchise platform separation

---

## Part 4 · External Signal Envelope

### 4.1 · Tracked executives

**Executive Committee.** CEO, President, CFO (Daniel Kovač), COO, Chief Risk Officer, Chief Credit Officer, Chief Compliance Officer, Chief Legal Officer, Chief Information Officer, Chief Digital Officer, Head of Consumer Banking, Head of Commercial Banking, Head of Wealth.

**Extended leadership.** ~30 SVPs and business segment leaders.

### 4.2 · Tracked business units

Consumer Banking, Commercial Banking, Wealth Management, Corporate and Investment Banking, Treasury and Payments, Digital, Technology, Finance, Risk, Compliance, Operations, Human Resources.

### 4.3 · Tracked vendor and partner relationships

**Core banking and platforms.** FIS, Fiserv, Jack Henry (where applicable), internal cores.

**Analytics and data.** Snowflake, Databricks, Microsoft Azure, Oracle.

**AML/BSA monitoring.** NICE Actimize, SAS, Oracle Financial Services Analytical Applications, Verafin.

**CRM and customer platform.** Salesforce, Microsoft Dynamics.

**Wealth platforms.** Envestnet, Orion, BlackRock Aladdin.

**Cybersecurity.** CrowdStrike, Palo Alto, Splunk.

**AI/ML.** Microsoft Azure (with FIDS BAA-equivalents), internal ML platforms.

### 4.4 · Tracked peer competitors

**Super-regionals (primary).** Truist, PNC, Regions, Fifth Third, KeyCorp, Huntington, M&T, Citizens.

**Large banks (extended).** JPMorgan Chase, Bank of America, Wells Fargo, Citi, US Bank.

**Digital-native (extended).** SoFi, Varo, Chime (for digital benchmark).

**Wealth-specific (extended).** Morgan Stanley, Merrill Lynch, Raymond James, LPL.

### 4.5 · Tracked regulatory bodies

**Federal.** OCC (primary prudential for national banks), Federal Reserve (bank holding company), FDIC (deposit insurance), CFPB (consumer protection), FinCEN (BSA/AML).

**State.** State banking commissioner (primary state), state DOI (insurance products, if applicable), state securities (wealth).

**SRO.** FINRA (wealth operations), FinCEN for BSA.

**Industry.** FFIEC, CISA (banking critical infrastructure), IMF/Basel (global standards reference).

### 4.6 · Tracked topics

**Strategic priority-linked.** Deposit franchise, digital transformation, wealth expansion, regulatory modernization, credit discipline, operational efficiency.

**Industry-level.** Deposit competition, rate environment, CRE stress cycle, regulatory rulemaking (Basel III endgame, CRA modernization, FinCEN rulemakings), M&A activity, consent orders (industry), fintech competition, banking-as-a-service dynamics, AI in financial services.

**Event-driven.** Competitor earnings, competitor regulatory actions, major cyber incidents (industry), rate decisions, stress test results, M&A announcements.

### 4.7 · Geographic scope

Primary: First Capital's operating footprint states. National: federal regulatory. International: where wealth business extends.

---

## Part 5 · Operational Telemetry Sources · 9 Registered

### 5.1 · CFO Weekly Scorecard (Power BI)

- **ID:** `firstcap_cfo_scorecard`
- **Modality:** API · weekly
- **KPIs:** 2.1.1-2.1.6 (financial), 2.3.1-2.3.5 (capital and liquidity), treasury metrics
- **Residency:** client_owned_client_hosted (MNPI + regulatory reporting basis)
- **Compliance:** SOX, MNPI, SEC disclosure, FFIEC regulatory reporting
- **Reasoning scope:** Finance Transformation, Executive Advisory
- **Disclosure scope:** Finance (full) · Executive Advisory (full) · others (reasoning-only; specific values never disclosed externally to programs)

### 5.2 · Credit Risk Dashboard

- **ID:** `firstcap_credit_risk_dashboard`
- **Modality:** API · daily
- **KPIs:** 2.2.1-2.2.5 (credit quality), portfolio segmentation
- **Residency:** client_owned_client_hosted (regulatory-sensitive, MNPI)
- **Compliance:** SR 11-7 (model risk), CCAR, Basel III reporting
- **Reasoning scope:** Credit Risk, Executive Advisory, Risk Management
- **Disclosure scope:** program-specific with regulatory-commentary treatment

### 5.3 · BSA/AML Operations Dashboard

- **ID:** `firstcap_bsa_aml_dashboard`
- **Modality:** API · daily
- **KPIs:** 2.8.1-2.8.3 (AML operations)
- **Residency:** client_owned_client_hosted (legal-privileged + BSA/AML sensitivity)
- **Compliance:** BSA/AML, FinCEN, legal-privileged material (consent order context)
- **Reasoning scope:** BSA/AML Modernization program, Compliance, Legal, Executive Advisory (limited)
- **Disclosure scope:** **program-scoped + legal-privileged** (extreme constraint); BSA/AML program disclosable internally; cross-program reasoning-only with specific values never surfaced outside program

### 5.4 · Deposit and Balance Sheet Tracker

- **ID:** `firstcap_deposit_balance_sheet_tracker`
- **Modality:** API · daily
- **KPIs:** 2.4.1-2.4.5 (deposits)
- **Residency:** client_owned_client_hosted
- **Compliance:** FFIEC reporting, MNPI
- **Reasoning scope:** Treasury, Finance, Consumer Banking, Commercial Banking, Executive Advisory
- **Disclosure scope:** program-specific

### 5.5 · Wealth Management Platform Dashboard

- **ID:** `firstcap_wealth_dashboard`
- **Modality:** API · daily
- **KPIs:** 2.6.1-2.6.5 (wealth)
- **Residency:** client_owned_abarva_hosted (client-level data de-identified); client_owned_client_hosted (advisor-level and client-level detail)
- **Compliance:** SEC (investment adviser), FINRA, state securities, fiduciary standards
- **Reasoning scope:** Wealth programs, Cross-Franchise programs, Executive Advisory
- **Disclosure scope:** tightly scoped; client-specific never disclosed; advisor-specific program-scoped

### 5.6 · Consumer Banking Performance Dashboard

- **ID:** `firstcap_consumer_banking_dashboard`
- **Modality:** API · daily
- **KPIs:** 2.7.1-2.7.5 (digital and customer)
- **Residency:** client_owned_abarva_hosted
- **Compliance:** GLBA, state privacy, CFPB-relevant consumer protection
- **Reasoning scope:** Consumer Banking programs, Digital Transformation, Executive Advisory
- **Disclosure scope:** program-specific aggregate; customer-specific never disclosed

### 5.7 · Commercial Banking Relationship Tracker

- **ID:** `firstcap_commercial_banking_tracker`
- **Modality:** API · weekly
- **KPIs:** Commercial loan metrics, commercial deposit concentration, relationship depth
- **Residency:** client_owned_client_hosted (commercial-client sensitivity + competitive)
- **Compliance:** commercial-banking confidentiality (NDA), GLBA business-customer provisions
- **Reasoning scope:** Commercial Banking programs, Treasury, Executive Advisory
- **Disclosure scope:** program-specific; specific commercial relationships never disclosed cross-program

### 5.8 · Regulatory Examination and Audit Tracker

- **ID:** `firstcap_regulatory_exam_tracker`
- **Modality:** API · weekly + event-driven
- **KPIs:** 2.8.4 (exam findings), 2.8.5 (op risk losses), exam cycle status by regulator
- **Residency:** client_owned_client_hosted (legal-privileged + regulatory-sensitive)
- **Compliance:** legal-privileged material, regulatory confidentiality
- **Reasoning scope:** Compliance programs, Legal, Executive Advisory, Risk Management
- **Disclosure scope:** **program-scoped + legal-privileged** (extreme constraint); affected-program-only; external disclosure prohibited

### 5.9 · Technology and Security Posture Tracker

- **ID:** `firstcap_tech_security_tracker`
- **Modality:** Export (monthly) + share-link architecture
- **KPIs:** 2.9.1-2.9.3 (cross-functional technology)
- **Residency:** client_owned_abarva_hosted
- **Compliance:** FFIEC cybersecurity assessment tool (CAT), GLBA Safeguards Rule, regulatory reporting on significant incidents
- **Reasoning scope:** Technology, Cybersecurity, AI Platform programs, Executive Advisory
- **Disclosure scope:** Cybersecurity specifics tightly restricted (critical-infrastructure-sensitive for banking)

### 5.10 · Telemetry source summary

| Source | Modality | Residency | Most restricted by |
|---|---|---|---|
| CFO Scorecard | API | Client-hosted | SOX + MNPI |
| Credit Risk | API | Client-hosted | Regulatory + MNPI |
| BSA/AML Ops | API | Client-hosted | Legal-privileged + BSA |
| Deposit/Balance Sheet | API | Client-hosted | FFIEC + MNPI |
| Wealth | API | Hybrid | Fiduciary + client confidentiality |
| Consumer Banking | API | AbarVa-hosted | GLBA + CFPB |
| Commercial Banking | API | Client-hosted | Commercial confidentiality + competitive |
| Regulatory Exam | API | Client-hosted | Legal-privileged + regulatory |
| Tech/Security | Export | AbarVa-hosted | FFIEC CAT + critical-infrastructure |

---

## Part 6 · Regulatory and Compliance Handling

### 6.1 · Compound regulatory framework

Financial services operates under the most complex regulatory framework in AbarVa's composite set:
- **Prudential:** OCC, Federal Reserve, FDIC, state banking
- **Consumer protection:** CFPB, state AGs
- **Financial crimes:** FinCEN, BSA, state financial-crimes laws
- **Securities:** SEC, FINRA (wealth operations)
- **Privacy:** GLBA Safeguards Rule, state privacy laws
- **Reporting:** SOX, SEC disclosure, FFIEC
- **Capital/liquidity:** Basel III, stress testing, CCAR
- **Model risk:** SR 11-7
- **Cybersecurity:** FFIEC CAT, state breach notification

Every telemetry source, KPI, and pattern operates against one or more of these frameworks.

### 6.2 · MNPI handling

Material non-public information requires particular care:
- CFO scorecard data, specific financial metrics, forward-looking forecasts are MNPI
- MNPI data stays in client-hosted residency
- Disclosure strictly program-scoped
- Reasoning scope broader but outputs filtered

### 6.3 · Legal-privileged material

BSA/AML operations, regulatory examination content, litigation-adjacent material is legal-privileged:
- Handling preserves privilege (no third-party disclosure that would waive)
- Client-hosted residency required
- Program-scoped disclosure limited to specific-need personnel
- External disclosure prohibited categorically

### 6.4 · Consent order context

Where a regulatory consent order is active:
- All related work operates under legal-privileged treatment
- Program team reports to Chief Legal; Compliance maintains regulator relationship
- AbarVa's architecture supports but does not direct remediation
- Progress reporting to regulator is client responsibility, not AbarVa

### 6.5 · Fair lending implications

AI/ML applied to credit decisioning has fair lending implications:
- Models require MRM review (SR 11-7)
- Disparate impact testing mandatory
- Documentation preservation for regulatory review
- AbarVa's pattern intelligence for lending use cases must respect these requirements

---

## Part 7 · Dual-Scope Configuration Examples

### 7.1 · BSA/AML Modernization program scenario

**Program scope.** Chief Compliance Officer sponsors; Chief Risk Officer co-sponsors; program team includes BSA officers, IT, vendor partners.

**Reasoning access (tightly scoped).**
- BSA/AML Operations Dashboard (5.3) full
- Regulatory Exam Tracker (5.8) subset relevant to BSA/AML
- Credit Risk, Operating Risk adjacent context
- External signal on industry AML modernization

**Disclosure access.**
- Program team full disclosure within program
- **Outside program: nothing disclosable on specifics**
- Aggregate false-positive rate trend may be mentioned at Executive Advisory, no specifics
- External disclosure completely prohibited

**Example.** Risk Management program lead asks Executive Advisory maestro: "How is our AML modernization progressing?" Agent has reasoning access to progress metrics. Response: "The program is actively executing against the modernization roadmap. I can't share specifics with you given the legal-privileged treatment of BSA/AML material, but the CCO's office has full context and can engage directly. Worth coordinating if there's cross-program dependency."

Agent acknowledged awareness without leaking specifics. Informed indirection at its most disciplined.

### 7.2 · Deposit franchise scenario

**Situation.** Commercial deposit concentration includes specific top-25 customer relationships that are competitively sensitive.

**Reasoning access.** Treasury, Commercial Banking, Executive Advisory — full access.

**Disclosure access.** Treasury + Commercial Banking (full). Executive Advisory (full aggregate; specific relationships on demand with audit log). Consumer Banking program (aggregate deposit metrics only, no commercial-specific data). Wealth program (aggregate only).

### 7.3 · Credit portfolio scenario

**Situation.** Specific sectoral exposure or geographic concentration may be regulatory-sensitive during examination cycles.

**Reasoning access.** Credit, Risk, Finance, Executive Advisory.

**Disclosure access.** Credit + Risk (full). Finance (full with regulatory-commentary treatment). Executive Advisory (full). Others (aggregate portfolio level only).

---

## Part 8 · Graph Entity Population Summary

- **Client entities:** 1 (First Capital)
- **Person entities:** ~40 (full exec + wealth advisory leadership + risk/compliance leadership)
- **Role entities:** ~36
- **StrategicPriority entities:** 6
- **Initiative entities:** ~18 (including BSA/AML Modernization)
- **KPI entities:** 36
- **Pattern entities:** 7
- **System entities:** ~32 (core banking, AML, CRM, wealth, etc.)
- **Vendor entities:** ~35
- **Benchmark entities:** ~50 (super-regional + wealth + digital)
- **TelemetrySource entities:** 9
- **ExternalEvent entities:** ~60 (regulatory-heavy industry)
- **Evidence entities:** ~230
- **Source entities:** ~34
- **Contradiction entities:** ~6 (including BSA/AML public capability claims vs consent order reality)
- **Risk entities:** ~20 (regulatory, credit, operational)
- **LegalPrivilegedContext entities:** ~8 (new entity type for legal-privileged tracking)

**Total approximate entity count: ~620**

Edge counts scale with entity relationships; approximately 2,600-3,600 edges.

---

## Part 9 · Smoke Tests

### KPI queries

1. "What is First Capital's NIM?" → 3.12% with 18 bps YoY decline context
2. "Who owns the AML alert volume metric?" → CCO with BSA officer context
3. "How does First Capital compare on CRE concentration?" → 268% vs regulatory threshold 300%
4. "What KPIs does AML/BSA Modernization pattern affect?" → graph traversal

### Pattern queries

5. "What patterns are active at First Capital?" → 7 patterns
6. "What interventions apply to Deposit Franchise Erosion?" → structured options
7. "What Phase 2 deliverables for AML/BSA Modernization?" → structured list

### Regulatory/dual-scope queries

8. "What telemetry sources require legal-privileged handling?" → BSA/AML and Regulatory Exam
9. "Can a Consumer Banking maestro see AML alert specifics?" → reasoning no, disclosure no (categorically scoped out)
10. "How is MNPI handled?" → client-hosted residency, program-scoped disclosure

### Complex reasoning

11. "How should First Capital think about AML modernization timing vs regulatory examination cycle?" → informed multi-factor response with privilege awareness
12. "What's changed at First Capital this quarter?" → external signal synthesis (rate-environment, regulatory, deposit competition)

---

## Part 10 · Ingestion Notes for Codex

### 10.1 · Template pattern solid

Fourth composite overlay. Template from Keystone, Apex, Meridian applies cleanly. First Capital-specific additions:
- Compound regulatory compliance framework
- MNPI handling architecture
- Legal-privileged material tracking (new entity type)
- Consent order context sensitivity
- Fair lending AI requirements

### 10.2 · Preserve PR #22 conventions

Short name compatibility (`clients.name = "First Capital"`). Benchmark data in JSONB.

### 10.3 · New entity type: LegalPrivilegedContext

First Capital introduces the LegalPrivilegedContext entity for tracking privileged material status. Schema:
```
LegalPrivilegedContext {
  id: string
  client_id: string
  context_description: text
  privilege_type: enum          // attorney_client | work_product | 
                                // regulatory_examination | litigation
  duration: enum                // active | historical
  related_entities: array[entity_id]
  access_restrictions: AccessScope  // typically severe
}
```

### 10.4 · Regulatory architecture validation

This overlay validates north star's handling of compound regulatory frameworks. Codex should verify:
- Each regulatory framework has appropriate compliance tag
- MNPI and legal-privileged flows enforce correctly
- Dual-scope respects regulatory categorical restrictions
- Audit logging active for sensitive access

### 10.5 · Smoke test priority

12 tests from Part 9. Emphasize regulatory/dual-scope tests (8, 9, 10) for compliance validation.

### 10.6 · Non-goals

- No actual regulatory reporting integration (notional)
- No actual consent order workflow (architectural hooks)
- No actual AML production alert ingestion (architecture only)
- No fair lending model testing (hooks only)

---

**END OF FIRST CAPITAL FINANCIAL INTELLIGENCE LAYER OVERLAY**

*Fourth in four-composite intelligence layer instantiation sequence. Financial services sector reference implementation with compound regulatory compliance framework validation. Completes the foundational composite library at full north star depth.*
