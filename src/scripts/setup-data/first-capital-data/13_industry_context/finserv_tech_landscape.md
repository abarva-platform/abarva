# FinServ IT Landscape + Metrics Guide — First Capital Financial

**Tenant key:** `first-capital`
**Last updated:** 2026-05-06
**Companion to:** `finserv_context.md` (industry signals and competitive environment)
**Purpose:** Prebuilt reference for AI agent use when answering questions about technology decisions, vendor evaluations, and financial metrics. Avoid duplicating material already in `finserv_context.md`.

---

## Section 1: Core Banking Systems — Platform Reference

### 1.1 FiServ Cleartouch — First Capital's Incumbent Core (since 1998)

**Architecture:** Legacy batch-processing core. Designed for community bank product set. Processes end-of-day batch runs for account reconciliation, statement generation, and regulatory reporting extracts. No real-time transaction streaming capability.

**API posture:** SOAP/XML APIs only. No REST, no GraphQL, no event-driven messaging. Any integration with modern systems (cloud data warehouse, open banking APIs, digital experience platforms) requires custom middleware. The 2023 Deloitte API assessment (sourcing artifact `sa:fcfi:003`) quantified this as an $8M custom middleware requirement just to support real-time account opening — a single use case.

**Strengths:**
- Stable, battle-tested for community bank product operations
- Deep regulatory reporting integration for FFIEC 031/041, call report, CRA
- FiServ support organization is well-established for community banks
- Certified for community bank compliance requirements through 2028 contract term

**Weaknesses:**
- Batch-only processing creates 24h lag in data availability for analytics, CRM, and digital experience
- SOAP-only APIs are architecturally incompatible with real-time digital banking expectations
- No native support for account-level event streaming (required for CDP identity resolution)
- Custom middleware accumulated over 28-year deployment creates significant operational risk and change cost
- Product catalog is constrained by legacy parametric structure — new product types require FiServ professional services, not configuration

**Typical client profile:** Community banks and thrifts under $3B in assets. Many First Capital peers have already replaced Cleartouch or are actively evaluating alternatives.

**Implementation risk for replacement:** High. 28 years of production data, custom middleware integrations across 23 systems, and FiServ's incentive to retain the account create complexity. Data migration from legacy account hierarchy to modern account structure is the highest-risk workload.

**First Capital relevance:** The batch processing constraint is the root cause of 18 of the 23 manual data handoffs documented in the Deloitte API assessment. The $8M middleware estimate only covers real-time account opening; full real-time capability would cost more. The OCC's Section 1033 / FDX API compliance deadline (2027) cannot be met with Cleartouch-native capabilities.

**Important note on FiServ EPS:** FiServ's next-generation platform (FiServ EPS / Finxact — see below) is a different product line. Migration from Cleartouch to FiServ EPS is not a simple upgrade; it is a full core replacement with the same risk profile as migrating to Temenos or Jack Henry. The migration path is not documented in FiServ's standard roadmap for Cleartouch clients as of 2026.

---

### 1.2 Temenos Transact + Infinity

**Architecture:** Cloud-native banking platform. Transact is the core banking engine; Infinity is the digital banking and channel layer. API-first: REST APIs, GraphQL, and event-driven (Kafka-compatible) messaging. Designed for cloud deployment on AWS, Azure, or GCP.

**Pricing:** $54M proposal for First Capital (4-year total cost of ownership, including implementation, licenses, infrastructure, and training). Implementation partners: PwC and Accenture.

**Migration model:** 18-month parallel run required. Both Cleartouch and Transact operate simultaneously during the transition period. This is operationally demanding — running two general ledgers, two loan systems, and two deposit systems with reconciliation between them for 18 months.

**Strengths:**
- True cloud-native: no batch processing; real-time account events available via API
- Parametric product configuration: new product types (e.g., new CD structures, new loan types) can be configured without code changes. No professional services required for most product catalog changes
- 14 global bank references; established platform in Europe, Asia-Pacific, and Middle East
- Infinity digital layer provides native mobile/web experience without additional vendors
- API-first architecture satisfies CFPB Section 1033 / FDX compliance requirements natively

**Weaknesses:**
- European heritage: US regulatory reporting (FFIEC call report, HMDA LAR, CRA performance context data) requires configuration that may not be pre-built for First Capital's Virginia/North Carolina footprint. Estimated configuration effort 6-8 months
- Only 2 US community bank references above $3B in assets — limited US community bank reference base for First Capital's scale and regulatory context
- 18-month parallel run creates staffing load; running two cores simultaneously requires dedicated reconciliation team
- Implementation partners PwC and Accenture carry premium rates; implementation risk shifts to bank during the parallel period

**Implementation risk:** High-Medium. Parallel run model reduces cutover risk but extends operational complexity. US regulatory configuration gap is the primary uncertainty.

**First Capital relevance:** The highest-capability option evaluated. Addresses all five of First Capital's core banking pain points (batch processing, API architecture, digital experience, product configuration, regulatory reporting) but at the highest cost and implementation complexity. The 2 US reference banks above $3B is a legitimate concern; Laura Jensen (Board) has specifically raised the scaling question.

---

### 1.3 Finxact (now part of FiServ)

**Architecture:** Cloud-native composable core. Event-driven microservices architecture. No monolithic product catalog — the bank composes the exact product and account types needed. Each capability (deposit accounts, loans, ledger, interest calculation) is a microservice that can be deployed independently. Built on AWS.

**Pricing:** $48M over 3.5 years. Implementation partner: Deloitte.

**Migration model:** No parallel run required. Finxact uses an event-driven migration model: accounts migrate progressively via event replay rather than a hard cutover or parallel operation. In theory, this reduces operational risk relative to parallel run models.

**Strengths:**
- Microservices composition means First Capital only deploys what it needs — no legacy product constraints from Cleartouch carry into the new core
- No parallel run required — the event-driven migration model is operationally lighter than the Temenos parallel run
- Event-driven architecture natively supports real-time analytics and CDP integration
- US-built platform; FFIEC/HMDA/CRA reporting documentation is US-native
- $48M vs $54M (Temenos) provides modest cost advantage

**Weaknesses:**
- All 6 US reference banks are under $2B in assets. First Capital at $4.2B is 2x the largest reference. Implementation scaling is unproven at First Capital's complexity
- Acquired by FiServ in 2022. This creates a structural conflict: FiServ owns both the incumbent system (Cleartouch) and the replacement First Capital is evaluating. FiServ's sales incentive and roadmap prioritization is legitimately uncertain
- Event-driven migration model is newer and less validated at community bank scale than parallel-run models
- Microservices composability requires more sophisticated IT organization to manage than a monolithic core

**Implementation risk:** Medium-High. The scaling concern (no reference above $2B) and the FiServ ownership conflict are the two primary risk factors. Laura Jensen (Board) has specifically flagged the scaling concern.

**First Capital relevance:** The FiServ ownership conflict is significant. First Capital must explicitly evaluate whether FiServ has an incentive to accelerate or slow the Finxact implementation relative to retaining Cleartouch revenue. Any Finxact evaluation should include contractual commitments on roadmap independence and migration support.

---

### 1.4 Jack Henry Banno

**Architecture:** Not a true core replacement. Jack Henry Banno is an integrated digital banking stack that sits above the existing core (Cleartouch remains as the system of record). The Banno digital layer handles the consumer and small business digital experience while Cleartouch continues to handle back-office processing, ledger, and regulatory reporting.

**Pricing:** $38M estimated (digital layer implementation + platform fees). No parallel run required for the digital layer. Timeline: 24-month path to 78% digital adoption.

**Strengths:**
- Lower implementation risk than full core replacement — Cleartouch continues operating, no data migration, no GL cutover
- Shorter timeline to digital experience improvement (estimated 12-18 months to production digital launch vs. 18-month parallel run for Temenos)
- Jack Henry has deep Cleartouch integration documentation; Banno is designed to work with FiServ cores
- FDX API-compliant digital layer satisfies CFPB Section 1033 requirements
- Karen Nakamura (CIO) has assessed this as the lowest implementation risk option

**Weaknesses:**
- Does not address the batch processing constraint. Cleartouch batch cycles remain; analytics data, CDP feeds, and real-time banking capabilities are still constrained by end-of-day batch
- Not a path to real-time core banking. The back-office remains on 1998-vintage batch infrastructure
- Vincent Morales (CDO) has characterized this as "polishing a legacy constraint" — the digital experience improvement is real, but the underlying data architecture problem (batch core, 18 manual handoffs) is not solved
- Leaves First Capital dependent on Cleartouch through contract expiry (2028) and likely beyond, accumulating technical debt
- Does not resolve the API architecture gap flagged in the Deloitte assessment (`sa:fcfi:003`) — $8M middleware requirement remains

**Implementation risk:** Low-Medium. The risk is low for the digital layer itself but high in a different dimension: if Banno is selected, First Capital is committing to Cleartouch for at least 5-7 additional years, which means the real-time architecture problem is deferred — not solved.

**First Capital relevance:** The CIO vs. CDO divergence on this option reflects a genuine strategic tension. Nakamura is optimizing for implementation certainty; Morales is optimizing for architectural capability. The Board needs to adjudicate whether First Capital is solving for a 3-year digital improvement or a 10-year competitive platform. The answer to that question determines whether Banno is a valid choice or a deferral of an inevitable larger decision.

---

### 1.5 NCR Voyix (formerly NCR Financial Solutions)

**Architecture:** Mid-market core banking platform for community and regional banks. Integrated with NCR's branch teller and ITM/ATM hardware. Cloud migration path available but not universally deployed.

**Market position:** Strong in community banks under $3B. Less common for full core replacement at $4B+ institutions. NCR's split from Atleos (ATM/ITM hardware) in 2023 created some organizational and roadmap uncertainty.

**Relevance to First Capital:** First Capital already uses NCR Atleos for ATM fleet management (`sys:fcfi:ncr-atm-mgmt`). A full NCR Voyix core replacement would consolidate the ATM/branch ecosystem but does not address the digital banking or API architecture gaps. Not currently on First Capital's formal evaluation shortlist. Less likely to address the CFPB Section 1033 and real-time banking requirements given limited cloud-native reference deployments at First Capital's scale.

---

### 1.6 Q2 Holdings

**Architecture:** Digital banking platform (not a core banking system). Q2 provides consumer and small business digital banking experiences that connect to existing core systems. Similar positioning to Jack Henry Banno — digital layer, not core replacement.

**Market position:** Used by approximately 450 community and regional banks. Strong on digital account opening, digital lending, and mobile experience. Integration connectors available for major core systems including FiServ Cleartouch.

**Relevance to First Capital:** Q2 appears on Vincent Morales' (CDO) Architecture Blueprint as the digital banking vendor recommendation alongside Temenos. This creates a potential architecture: Temenos Transact as the new core (replacing Cleartouch) with Q2 as the digital banking experience layer (replacing the existing Jack Henry digital platform, `sys:fcfi:digital-banking`). This is a higher-capability but also higher-complexity architecture than single-vendor approaches. The CDO's Q2 preference is worth noting in vendor evaluation discussions — it suggests Morales envisions a best-of-breed digital stack rather than the single-vendor approach that Banno (Jack Henry) or Infinity (Temenos) would provide.

---

## Section 2: AML / BSA Compliance Technology

### 2.1 NICE Actimize — First Capital's Current Vendor

**Platform:** Enterprise transaction monitoring, case management, SAR filing workflow, and fraud detection. First Capital's Actimize instance (`sys:fcfi:actimize`) has been deployed since 2015. On-premises deployment.

**Market position:** Used by the majority of the top 100 US banks. Scenario-based rule engine with optional ML overlay (Actimize ActOne AI). Industry-standard for enterprise AML at banks $1B+.

**First Capital's current state:**
- 112 active transaction monitoring rules
- 38% of rules generating zero alerts (dead rules — per Exiger diagnostic `sa:fcfi:006`). Dead rules are rules that haven't generated a single alert in the review period; they consume processing resources and obscure monitoring effectiveness
- Pre-tuning false-positive rate: 31%. Industry benchmark for well-tuned legacy systems: 20-25%; AI-augmented target: ≤15%
- Active engagement: $680K Actimize tuning engagement, 90-day delivery, targeting ≤20% false-positive rate post-tuning
- Model risk: Transaction monitoring model has not been independently validated per SR 11-7. This is the basis for OCC MRA-2

**Strengths:** Enterprise-grade, regulator-familiar, deep integration with SAR e-filing, strong case management workflow.

**Weaknesses in First Capital's context:** On-premises deployment limits cloud analytics integration. The 38% dead rule rate and 31% false-positive rate reflect accumulated rule technical debt from 11 years of production use without systematic model management. Actimize itself is capable; the problem is governance, not platform.

---

### 2.2 Oracle Financial Services Anti Money Laundering (OFSAA AML)

**Platform:** Enterprise AML platform for large banks. Scenario-based rule engine plus behavioral analytics. Strong on regulatory reporting integration with Oracle FLEXCUBE (Oracle's core banking system).

**Relevance to First Capital:** Oracle AML is primarily deployed at banks on Oracle's core banking stack. First Capital is on FiServ Cleartouch; a migration to Oracle AML would require significant integration work without the native core banking synergy. Not on First Capital's active shortlist. Most relevant in an alternative scenario where First Capital considered Oracle Flexcube as a core (not currently evaluated).

---

### 2.3 FiServ AML Manager

**Platform:** FiServ's native AML solution, tightly integrated with the FiServ ecosystem including Cleartouch.

**Relevance to First Capital:** If First Capital selects Finxact (also FiServ) for core banking modernization, FiServ AML Manager would offer deeper integration than retaining Actimize. However, this would create single-vendor concentration risk across core, AML, and potentially digital banking — exactly the dynamic the Board Risk Committee should evaluate. Given the OCC's focus on First Capital's AML model governance, migrating AML platforms during the active MRA remediation period would add significant regulatory risk.

---

### 2.4 SR 11-7 Model Validation — Regulatory Context

**What SR 11-7 is:** SR 11-7 is the Federal Reserve's 2011 Supervisory Guidance on Model Risk Management. It is the definitive regulatory standard for model governance at US banks and applies to any model that influences material business decisions, including transaction monitoring models used for BSA/AML. The OCC adopted equivalent standards; both agencies conduct model risk examinations against SR 11-7 criteria.

**SR 11-7 requirements for transaction monitoring models:**
1. **Model documentation:** Conceptual framework, methodology description, data inputs, assumptions, and limitations must be formally documented
2. **Conceptual soundness review:** An independent party must assess whether the model's methodology is theoretically appropriate for its intended use
3. **Outcome analysis:** Model performance must be measured against observed outcomes (alert accuracy, SAR conversion rates, alert disposition patterns)
4. **Ongoing monitoring:** Periodic performance review must be documented and acted upon; deteriorating model performance triggers re-validation
5. **Independent validation:** For material models (which includes AML transaction monitoring at First Capital's scale), the OCC expects validation by a party independent of model development — typically an external firm

**First Capital's OCC MRA-2 specifics:** MRA-2 is specifically about the Actimize transaction monitoring model not having been independently validated per SR 11-7. EY is engaged for independent validation ($380K engagement, concurrent with the Actimize tuning work). The validation must be completed before the OCC's next progress review. Running validation concurrently with tuning creates a sequencing challenge: the model being validated (pre-tuning) may differ from the model EY finishes reviewing (post-tuning), potentially requiring a second validation cycle.

**Practical implication:** Patricia Holbrook (Chief Compliance Officer) must ensure the EY validation scope explicitly covers both the pre-tuning baseline and the post-tuning model state. A single validation pass that only covers the pre-tuning model will not satisfy MRA-2 if the tuning engagement materially changes the model's rule logic and parameters.

---

### 2.5 Exiger — AML Diagnostic and Remediation Partner

**Firm profile:** Exiger is a third-party AML/KYC risk management firm specializing in compliance diagnostics, regulatory remediation, and ongoing monitoring. Clients include US banks under OCC, Federal Reserve, and FinCEN enforcement actions.

**First Capital engagement:** Exiger conducted the BSA/AML diagnostic (`sa:fcfi:006`) that identified:
- 74% CDD completeness (26% gap to 100% FinCEN requirement)
- 14% of accounts missing expected transaction volume data (monitoring blind spots)
- 38% dead rules in the Actimize monitoring rule set
- Multiple SAR workflow procedural deficiencies

Exiger is now leading AML remediation implementation alongside First Capital's internal BSA team. Their role is program management and remediation quality assurance — not replacing internal compliance staff.

**Industry context on CDD completeness:** The FinCEN CDD Rule (effective 2018 for new accounts; extended compliance deadline for legacy accounts by 2026) requires banks to collect and verify beneficial ownership for all legal entity accounts. First Capital's 74% completeness rate reflects accumulated backlog on existing business accounts opened before the CDD Rule's effective date. 100% completeness is required; the OCC's MRAC-1 severity reflects that regulators view CDD completeness as non-negotiable.

---

## Section 3: Wealth Management Technology

### 3.1 SS&C Advent Geneva — First Capital's Current Portfolio Management System

**Platform:** Professional portfolio management system for investment managers, multi-family offices, and private wealth. Geneva is the industry gold standard for alternatives tracking, multi-asset portfolios, and institutional-grade performance attribution.

**First Capital's deployment (`sys:fcfi:advent-geneva`):** On-premises deployment since 2012. Primary book of record for $2.84B AUM across First Capital Wealth's discretionary and non-discretionary accounts. 42 internal users (wealth advisors and operations staff).

**What Geneva does well:**
- Trade-level accounting and reconciliation
- Multi-asset class performance attribution (equities, fixed income, alternatives, cash)
- Institution-grade audit trail for performance reporting
- Handles complex account hierarchies (trusts, joint accounts, beneficiary structures)

**What Geneva does not do well in First Capital's context:**
- Client portal experience: Geneva is designed for investment managers, not client self-service. Client portal functionality requires a separate system (Orion)
- Real-time data access: First Capital's Geneva is on-premises and batch-synchronized. No real-time account data available for Orion or Salesforce FSC
- 18 manual data handoffs per day between Geneva, Orion, and Salesforce FSC — documented as a key operational efficiency and data quality risk
- The custom account hierarchy built during 2012 implementation exceeded the import capabilities of Envestnet during the WEALTH-CONSOLIDATION-2021 evaluation (see below)

**Contract status:** Renewal due September 2027. Any platform consolidation decision (toward Envestnet or another unified platform) must be made at least 18 months before renewal to execute migration without overpaying on a short-term extension.

---

### 3.2 Orion Advisor Services — Current Client Portal

**Platform:** Wealth management technology for independent RIAs and bank wealth affiliates. Core capabilities: client reporting, performance attribution display, financial planning integrations, proposal generation, and client portal.

**First Capital's deployment (`sys:fcfi:orion-wealth`):** Cloud deployment (AWS) since 2020. Primary client-facing portal for First Capital Wealth's 4,200 active clients. 42% portal adoption rate vs. 70-80% at top-performing bank wealth affiliates (Cerulli 2025 benchmark).

**Architecture issue:** Orion is fed by Geneva via overnight batch. Client portal data is 24 hours stale. If Geneva records contain errors (reconciliation failures, manual entry mistakes), those errors propagate directly to the client portal where clients can see them. Three months of FY2025 had documented reconciliation errors visible to clients — a client experience and fiduciary risk.

**Renewal status:** Contract expiry September 2026 — within the current planning horizon. The platform consolidation decision (keep Orion + Geneva vs. migrate to Envestnet) directly determines whether to renew Orion. If Envestnet is selected, Orion renewal would be a bridge contract only. Diana Stern (Wealth Management Head) is the decision owner.

---

### 3.3 Envestnet — Unified Wealth Platform Proposal

**Platform:** Comprehensive wealth management platform integrating portfolio management, financial planning, trading, rebalancing, and client portal in a single system. Would replace both SS&C Advent Geneva and Orion Advisor Services.

**Proposal terms:** $8.2M over 3 years. 6 bank affiliate references provided. Implementation would require full data migration from Geneva including the custom account hierarchy.

**Why this option exists:** Single-platform architecture eliminates the 18 manual data handoffs between Geneva and Orion. Real-time data synchronization across all components. One vendor contract instead of two. One data model for the wealth book of record, financial planning, and client portal.

**Critical risk — WEALTH-CONSOLIDATION-2021 failure:** A previous Envestnet evaluation at First Capital was halted in 2021 when the data migration assessment revealed that Geneva's custom account hierarchy exceeded Envestnet's import capabilities. Specific issue: Geneva's trust and beneficiary account structures use non-standard relationship fields that Envestnet's migration tooling could not map automatically. Manual remediation was estimated at $2M+ before the evaluation was paused. Diana Stern negotiated the pause and owns this history.

**Current evaluation status:** The 2021 failure is not necessarily permanent. Envestnet has released new data migration tooling since 2021, and a fresh migration assessment should be commissioned before accepting or rejecting Envestnet again. However, the custom hierarchy problem in Geneva is a First Capital issue, not an Envestnet issue — it will need to be resolved for any platform migration.

**Strengths:** Single-platform architecture; real-time data; eliminates manual handoffs; strong bank affiliate reference base; financial planning integration is stronger than Orion.

**Weaknesses:** 2021 migration failure history; requires full data migration from Geneva; implementation risk concentrated in the Geneva account hierarchy problem.

---

### 3.4 SEI Wealth Platform

**Platform:** Integrated investment management and wealth administration platform. Strong on multi-family office, ultra-high-net-worth, and institutional trust administration.

**Market positioning:** SEI is more commonly deployed at trust companies and multi-family offices than at bank wealth management affiliates. Its institutional custody and trust capabilities are its primary differentiator.

**Relevance to First Capital:** SEI Wealth Platform is most compelling if First Capital's strategy is to expand upmarket into institutional trust and family office. For a regional bank wealth affiliate focused on HNWI relationships at the $1M-$10M level, Envestnet's advisor workflow tools and client portal experience are more directly applicable. Not currently on First Capital's formal evaluation list.

---

### 3.5 Salesforce Financial Services Cloud (FSC) — CRM Layer

**Platform:** Salesforce's vertical CRM for financial services. First Capital has two separate FSC deployments (`sys:fcfi:salesforce-fsc`): one for commercial banking (68 relationship managers + ops staff) and one for wealth management (22 relationship managers).

**The data latency chain in wealth:** Geneva → (overnight batch) → Orion → (API sync) → Salesforce FSC Wealth. Two hops of latency. Reconciliation errors in Geneva propagate through Orion to FSC. Three months of FY2025 had documented reconciliation errors in the FSC wealth view.

**FSC adoption context:** Commercial banking FSC adoption is 28% (measured by active weekly users vs. total licensed users). Wealth FSC adoption is not separately tracked but likely comparable. Low adoption in both lines of business reflects data quality concerns — relationship managers disengage from CRM when they cannot trust the data they see.

**Cross-instance problem:** The commercial and wealth FSC instances have no data synchronization. A client who is both a commercial banking client and a wealth management client appears twice, with no linked view. This is a known gap that limits cross-sell effectiveness and creates regulatory risk (KYC/BSA data inconsistency across instances).

---

## Section 4: Banking KPIs — What the Board and OCC Actually Watch

### 4.1 Net Interest Margin (NIM)

**Definition:** NIM = Net Interest Income (NII) / Average Earning Assets. The most-watched profitability metric for banks. Represents the spread between what a bank earns on loans and investments and what it pays for deposits and borrowings.

**Components:**
- **Asset yield:** The weighted average interest rate earned on loans, investment securities, and other earning assets. Driven by loan mix (floating vs. fixed rate, loan type) and market rates
- **Cost of funds:** The weighted average interest rate paid on deposits (savings, CDs, money market), borrowings (FHLB advances, subordinated debt), and other interest-bearing liabilities
- **Net Interest Spread:** Asset yield minus cost of funds. NIM also includes the benefit of non-interest-bearing (NIB) deposits — deposits that cost nothing but fund earning assets

**Key dynamics:**
- **Deposit repricing pressure:** As CDs mature and reprice at current market rates (4.6% in First Capital's context), cost of funds increases. Banks with high CD concentrations (like First Capital) see more rapid NIM compression than banks with large NIB or savings deposit bases
- **Asset repricing:** Floating-rate C&I loans tied to SOFR reprice immediately when market rates change. Fixed-rate mortgage loans do not reprice until maturity or sale. First Capital's loan mix (C&I, CRE, mortgage) determines how quickly the asset side of NIM responds to rate changes
- **Asset-liability mismatch scenarios:** Banks model NIM under rate shock scenarios (+100bp, -100bp, +200bp, etc.). If more assets reprice than liabilities in a +100bp scenario, NIM expands (asset-sensitive bank). If more liabilities reprice than assets, NIM compresses (liability-sensitive bank)

**First Capital's position:** NIM 4.12% vs. peer median 4.28% (SNL Financial data). Declined 14bp in FY2025. The CDs repricing at current 4.6% market rates are the primary pressure. First Capital's strategy to grow core deposits (NIB and low-cost savings) through digital channel expansion is the primary lever for NIM stabilization.

**Why this matters for technology investment:** Every digital banking investment that improves core deposit acquisition or reduces deposit rate sensitivity directly supports NIM recovery. Karen Nakamura and Vincent Morales must frame technology ROI in terms of NIM impact to get Board attention.

---

### 4.2 Efficiency Ratio

**Definition:** Efficiency Ratio = NonInterest Expense / (Net Interest Income + NonInterest Income). Measures how much it costs the bank to generate each dollar of revenue. Lower is better.

**Benchmarks:**
- Below 55%: Top quartile; operationally excellent
- 55-65%: Peer median range
- 65-70%: Below median; requires management explanation
- Above 70%: Red flag; typically triggers analyst questions and board oversight

**First Capital:** Efficiency ratio 62.4%. At the higher end of median range. Heavy technology investment in FY2026 ($20.6M, 8.5% of revenue) will pressure the efficiency ratio further in the near term before productivity benefits are realized.

**Technology investment and efficiency ratio tension:** This is the CFO's primary concern. Charlotte Reid must model the efficiency ratio trajectory under each technology investment scenario — when does the investment stop pressuring efficiency and start improving it? The Board expects a return to sub-60% within 3-4 years of peak investment.

---

### 4.3 CRE Concentration Ratio

**Definition:** Commercial Real Estate (CRE) loans as a percentage of total regulatory capital. Includes construction and land development loans (C&D) and non-owner-occupied CRE (income-producing properties).

**Regulatory thresholds (OCC/Fed joint guidance):**
- CRE > 300% of total capital: Requires enhanced risk management program with board-approved concentration limits, stress testing, and reporting
- CRE construction/land development > 100% of total capital: Triggers mandatory board-level oversight and reporting
- These are not hard limits — banks above them are not automatically in violation — but they trigger heightened OCC scrutiny during examinations and may result in growth restrictions or capital requirements

**First Capital:** CRE concentration at 225% of total capital. Not above the 300% threshold but approaching it. The 12 months preceding First Capital's next OCC examination will determine whether CRE growth has been prudently managed against concentration limits.

**Management implication:** CRE growth must be modeled against the 300% threshold. If current CRE growth rates continue, First Capital crosses 300% in approximately 18-24 months, triggering mandatory enhanced risk management program implementation. Marcus Osei (Chief Risk Officer) should have concentration limits and growth scenarios documented for Board Risk Committee reporting.

---

### 4.4 Capital Ratios — Basel III Regulatory Framework

**Four primary ratios measured and reported:**

| Ratio | Definition | Regulatory Minimum | Well-Capitalized | First Capital |
|---|---|---|---|---|
| CET1 (Common Equity Tier 1) | Common equity / Risk-weighted assets | 4.5% | 6.5% | 12.8% |
| Tier 1 Capital | Core capital (CET1 + additional T1) / RWA | 6.0% | 8.0% | ~13.5% est. |
| Total Capital | All regulatory capital / RWA | 8.0% | 10.0% | ~14.5% est. |
| Leverage Ratio | Tier 1 / Average total assets | 4.0% | 5.0% | ~8.1% est. |

**Capital Conservation Buffer:** Basel III requires an additional 2.5% CET1 buffer above the regulatory minimum. Effective minimum CET1 = 4.5% + 2.5% = 7.0% to avoid restrictions on distributions (dividends, buybacks). Well-capitalized threshold for practical operations = 9.5%+ CET1.

**First Capital:** CET1 at 12.8% is well above regulatory requirements. However, it is declining as asset growth outpaces retained earnings. Capital position must be managed against: (1) organic loan growth, (2) technology investment OpEx/CapEx absorption, (3) potential M&A opportunities, and (4) possible future Basel III Endgame applicability.

**Why declining capital matters:** Strong capital ratios are a prerequisite for M&A activity. The regional banking consolidation environment creates acquisition opportunities for well-capitalized banks. First Capital's CRA rating (Satisfactory vs. Outstanding) is already a constraint on M&A optionality; declining capital ratios would be a second constraint.

---

### 4.5 ROAA and ROAE

**ROAA (Return on Average Assets):**
- Definition: Net income / Average total assets. Measures how efficiently a bank uses its assets to generate profit
- Top quartile: > 1.5%
- Peer median: 1.1-1.3%
- Bottom quartile: < 0.8%
- First Capital: 1.35% — above median, below top quartile

**ROAE (Return on Average Equity):**
- Definition: Net income / Average stockholders' equity. The equity return metric most comparable to other industries
- Top quartile: > 12%
- Peer median: 8-10%
- Cost of equity for regional banks: typically 10-11% (based on CAPM with regional bank beta and current risk-free rate)
- First Capital: 9.8% — below cost of equity. This is significant: First Capital is not earning its cost of equity, which means the bank is destroying economic value in the current configuration

**Implication:** An ROAE below cost of equity is the fundamental driver of First Capital's strategic urgency. The technology transformation programs must demonstrate a credible path to ROAE improvement — through NIM stabilization (deposit growth), efficiency improvement (cost reduction from automation), fee income growth (wealth management platform improvement), and credit quality protection (AML/BSA remediation limiting regulatory capital penalties).

---

### 4.6 BSA/AML Regulatory Benchmarks

**FinCEN CDD Rule (Customer Due Diligence):**
- Effective date: May 2018 for new legal entity accounts
- Beneficial ownership collection required: All natural persons owning 25%+ of an entity, plus one control person
- Certification requirement: Beneficial ownership information must be certified by the account opener at account opening and recertified when known changes occur
- Legacy account compliance: Extended compliance expected by 2026 for accounts opened before the rule's effective date
- First Capital: 74% CDD completeness (26% gap). This is the basis for MRAC-1 — the OCC's most severe finding category

**False-positive rate benchmarks for AML transaction monitoring:**
- Legacy rule-based systems without tuning: 85-95% false-positive rate (most alerts are false)
- Well-tuned legacy rule-based systems: 20-30%
- AI/ML-augmented systems: 10-20%
- First Capital pre-tuning: 31%; target post-Actimize tuning: ≤20%
- Practical meaning: At 31% false-positive rate, 31% of alerts that investigators must review will turn out to be non-suspicious. This creates investigator workload that crowds out review of genuinely suspicious activity

**SAR filing benchmarks:** Banks of First Capital's size ($4-5B assets) typically file 200-500 SARs annually. SAR quality (supporting documentation, narrative completeness) is reviewed by OCC during examinations. Deficient SAR quality is a common examination finding that does not require a separate MRA — it can escalate to the existing MRA remediation scope.

---

### 4.7 OCC Examination Process — How It Works

**CAMELS Rating System:**
The OCC rates banks on six components during each examination cycle. Each component is rated 1 (best) to 5 (worst). A composite CAMELS rating is derived from the component ratings.

| Component | What It Covers |
|---|---|
| **C — Capital Adequacy** | Capital ratios; capital planning; stress testing |
| **A — Asset Quality** | Credit quality; NPL ratio; CECL reserve adequacy; concentration risk |
| **M — Management** | Board governance; risk management framework; internal controls; audit |
| **E — Earnings** | NIM; efficiency ratio; ROAA; earnings sustainability |
| **L — Liquidity** | Deposit stability; contingency funding; FHLB capacity; concentration |
| **S — Sensitivity to Market Risk** | Interest rate risk; asset-liability management; NIM sensitivity models |

**Examination frequency:** Banks with composite CAMELS ratings of 1-2 are examined on a 12-18 month cycle. Banks rated 3+ are examined more frequently, sometimes with continuous on-site examiner presence.

**MRA vs. MRAC — Critical Distinction:**

| Category | Definition | Urgency | Implication |
|---|---|---|---|
| **MRA** (Matter Requiring Attention) | Significant deficiency requiring remediation; serious but not immediately threatening | 12-18 month typical remediation window | Must be reported to Board Audit Committee; tracked in every subsequent examination |
| **MRAC** (Matter Requiring Immediate Attention) | Most serious OCC finding category; immediate safety and soundness concern | 90-180 day remediation window typical | May trigger formal enforcement action (Consent Order) if not remediated; restricts certain bank activities |

**First Capital's findings:**
- MRAC-1: CDD completeness below FinCEN regulatory requirement (74% vs. 100%). Severity: MRAC because CDD deficiency has a known legal compliance deadline
- MRA-2: AML transaction monitoring model not independently validated per SR 11-7. Severity: MRA because SR 11-7 is supervisory guidance, not a statutory requirement; however, OCC has stated intent to escalate to MRAC if not remediated within examination cycle

**Quarterly progress reviews:** The OCC schedules quarterly calls with bank management to review progress on open MRAs/MRACs. These calls require:
- Written status updates submitted 2 weeks prior
- Documented milestones achieved since the last quarterly review
- Forward-looking remediation timeline with named accountable executives
- Board Audit Committee certification that findings have been reported

Management workload impact: Each quarterly review requires CCO, CRO, CIO, and often CEO participation. For First Capital with 2 active findings plus an active examination in progress, quarterly OCC review preparation consumes an estimated 40-60 person-hours per quarter across the executive team.

**Regulatory risk and capital/M&A capacity:** Banks with active MRACs or formal enforcement actions face OCC restrictions on:
- Dividend payments (OCC approval required)
- Share buybacks (OCC approval required)
- M&A acquisitions (OCC approval required; practical moratorium)
- New product or market entry (OCC non-objection required)

This is the mechanism by which First Capital's regulatory remediation status directly affects M&A capacity and capital allocation flexibility. Clearing MRAC-1 and MRA-2 is not just a compliance matter — it is a prerequisite for the strategic optionality the Board expects.

---

## Quick Reference: First Capital Technology Investment Decision Matrix

| Initiative | Core Technical Gap Addressed | Regulatory Dependency | Board Priority Driver |
|---|---|---|---|
| Core Banking Modernization (fcfi-core-2026) | Batch processing → real-time; SOAP → REST/API | CFPB Section 1033 (2027 FDX deadline) | ROAE improvement; M&A optionality |
| BSA/AML Remediation | CDD completeness; model governance | MRAC-1 (CDD); MRA-2 (SR 11-7 validation) | OCC enforcement risk; regulatory-imposed constraints |
| Digital Banking (fcfi-digital-2026) | Consumer digital experience; deposit growth | Section 1033 partial dependency | NIM stabilization; competitive position |
| Wealth Platform Consolidation | 18 manual handoffs; client portal quality | Fiduciary duty documentation | Fee income growth; advisor productivity |
| Commercial CRM (fcfi-crm-2026) | 28% FSC adoption; data quality | None direct | Cross-sell revenue; RM productivity |
