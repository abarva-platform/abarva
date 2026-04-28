# Part 3.4b · Commodity Trading AI (Energy)

## 3.4b · Commodity Trading AI

### YAML front-matter

```yaml
pattern_id: pattern_commodity_trading_ai
slug: commodity-trading-ai
name: Commodity Trading AI
version: 1.0.0
status: active
category: Trading, Risk & Settlement
cross_industry: false
sector_applicability: [energy, utilities, oil_gas, power_marketing, natural_gas_marketing, renewables_rec, emissions]
primary_sector: energy
short_description: >
  The integrated modernization of commodity trading operations with AI
  across power, natural gas, crude, refined products, emissions, RECs,
  and environmental credits — price and load forecasting, trading signal
  generation and decision support, credit and counterparty risk models,
  trade surveillance and regulatory reporting automation, RFQ/RFP and
  structured product workflow, generative AI for analyst productivity,
  and integration with physical asset optimization. Pattern addresses the
  recurring failure modes of fragmented ETRM/CTRM stacks, forecasting
  disconnected from market data, surveillance that lags regulatory
  expectations, and generative AI adoption without control frameworks
  appropriate to a regulated market-facing function.
long_description: >
  Commodity trading in energy spans a complex lattice of markets, instruments,
  and regulatory regimes: wholesale power in organized RTO/ISO markets
  (PJM, MISO, ERCOT, CAISO, SPP, NYISO, ISO-NE) and bilateral, natural gas
  pipeline and hub markets, crude and refined product markets, emissions
  (RGGI, California CCA, EU ETS, CSAPR allowances), renewable energy
  certificates (RECs by state and compliance regime), LCFS and carbon
  offsets, weather derivatives, and physical-financial hybrid products.
  The operational stack — ETRM/CTRM platforms (ION Commodities / Allegro /
  Openlink / Endur, FIS / Aligne, Murex, Enverus / RightAngle, triplepoint
  lineage, in-house build), market data (ICE, CME, Bloomberg, Refinitiv,
  Platts, Argus, Wood Mackenzie, Kpler, Enverus), specialized tools (OATI
  for power scheduling and credit, NERC-compliant systems), compliance and
  surveillance tools, and analyst desktops — is typically fragmented, with
  AI adoption uneven. Modern AI capability touches nearly every trading
  function: price forecasting, load forecasting, weather-informed models,
  congestion prediction in nodal markets, fuel and supply forecasting,
  credit exposure modeling, counterparty behavior analytics, trade
  surveillance with generative AI for context and narrative, regulatory
  reporting automation, generative AI for analyst productivity (research,
  summarization, documentation, RFQ drafting), and physical asset
  optimization for owned generation and storage. The pattern captures
  the integrated program across these capabilities, along with the
  control environment required for a regulated, market-facing function
  under CFTC Title VII, FERC, EMIR, MiFID II, and related regimes.
confidence_floor: 0.70
n_observations_floor: 6
related_patterns:
  - { id: pattern_predictive_maintenance_modernization, relationship: associative }
  - { id: pattern_analytics_modernization, relationship: parent }
  - { id: pattern_ai_governance_operating_model, relationship: associative }
  - { id: pattern_ai_use_case_portfolio, relationship: associative }
  - { id: pattern_fraud_detection_modernization, relationship: analogous }
regulatory_frameworks:
  - id: framework_cftc_dodd_frank_title_vii
    applicability: swaps
  - id: framework_ferc_market_manipulation
    applicability: ferc_jurisdictional_markets
  - id: framework_ferc_order_741
    applicability: rto_iso_credit
  - id: framework_ferc_order_760
    applicability: electronic_trade_reporting
  - id: framework_emir
    applicability: eu_derivatives
  - id: framework_mifid_ii
    applicability: eu_investment_firms
  - id: framework_remit
    applicability: eu_energy_trading
  - id: framework_nist_ai_rmf
    applicability: always
  - id: framework_eu_ai_act
    applicability: eu_operations_material_models
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_commodity_trading_ai`
**Name:** Commodity Trading AI
**Short description:** Integrated AI modernization program across commodity trading — price and load forecasting, congestion prediction, trading signal and decision support, credit and counterparty risk models, trade surveillance with generative AI, regulatory reporting automation, analyst productivity (generative AI with control framework), and physical asset optimization integration — within the CFTC, FERC, EMIR, MiFID II, and REMIT regulatory envelope.

**Long description:** Commodity trading is simultaneously a markets function, a risk function, a regulated activity, and increasingly an AI-saturated workflow. The economic returns from better forecasting, better risk sizing, better analyst productivity, and tighter surveillance are meaningful. The risks from poorly controlled AI — hallucinated analysis, unvalidated models driving position sizing, generative AI blurring the line between research and market communication, surveillance gaps — are material and specifically scrutinized by CFTC, FERC, and EU regulators. The pattern captures the integrated modernization across the trading front office, middle office, back office, and compliance functions, with the control framework required to deploy AI inside a regulated market-facing business.

### Part B · Classification

**Category:** Trading, Risk & Settlement
**Cross-industry:** No — energy trading core (principles translate to commodity trading in other sectors with regulatory variations)
**Primary sector:** Energy (power, natural gas, crude, refined products, emissions, RECs, carbon)
**Sector applicability:** Energy broadly — utility trading operations, IPP commercial desks, oil majors, natural gas marketers, producer marketing arms, merchants, trading houses, integrated energy companies, specialty (REC / carbon / LCFS) traders
**Variant of:** None (foundational energy vertical pattern paired with predictive maintenance)

### Part C · Detection — Signals

Pattern activates when ≥3 signals present with sufficient severity:

1. **Forecasting fragmentation.** Price, load, weather, fuel, and congestion forecasting done in disconnected tools with inconsistent methods. Analysts consolidate manually in Excel. Forecast skill measurement inconsistent or absent.

2. **ETRM/CTRM platform on extend-and-bolt-on path.** Incumbent ETRM (ION / Allegro / Openlink / Endur, FIS Aligne, Murex, in-house) patched repeatedly. Capability gaps addressed with surrounding tools. Data reconciliation problems chronic.

3. **Generative AI adoption in desk with no control framework.** Traders and analysts using GenAI tools (ChatGPT, Copilot, Claude) for research, email, documentation, market summaries — outside compliance, surveillance, and model risk frameworks. Shadow AI pattern active specifically on trading floor.

4. **Trade surveillance lag.** Surveillance tools and processes haven't evolved to the volume and complexity of modern electronic trading. False positive / miss rate concerns. Regulatory examination findings on surveillance capability.

5. **Credit and counterparty exposure models dated.** Credit exposure calculated nightly or less frequently; counterparty concentration and wrong-way risk not well modeled; FERC Order 741 credit requirements addressed with workarounds.

6. **Regulatory reporting labor-intensive.** Dodd-Frank swap reporting (SDR), FERC EQR, EMIR reporting, REMIT reporting consume analyst and back-office time. Data quality failures require rework.

7. **Physical-financial integration weak.** Physical asset positions (generation, storage, pipeline capacity, refinery flows) and financial positions managed in separate tools. Optimization between physical and financial is manual or absent.

8. **Analyst productivity underleveraged.** Research, summarization, outage parsing (FERC outage notices, EIA, operator announcements), RFQ drafting, desk note production, and similar cognitive work done manually. GenAI opportunity visible but unstructured.

### Part D · Detection — Diagnostic Questions

1. What forecasting inputs drive your trading decisions (price, load, weather, fuel, renewables output, congestion)? Who owns each forecast? How is forecast skill measured?

2. What ETRM/CTRM platform do you run? What's the extension / replacement roadmap? Where are the data reconciliation pain points?

3. What generative AI tools are currently used by traders and analysts? What control framework governs their use? Are surveillance, compliance, and model risk in the loop?

4. What trade surveillance tools and processes do you have? What's the false positive / miss rate posture? Have there been regulatory findings?

5. How is credit exposure computed and monitored? FERC Order 741 compliance posture? Counterparty concentration and wrong-way risk modeling?

6. What regulatory reporting regimes apply (CFTC Title VII, FERC EQR, EMIR, REMIT, MiFID II)? How much labor do they consume? What's the data quality posture?

7. How integrated are physical asset operations with trading? For utilities with generation: is there joint optimization across generation, reserves, ancillary services, and commercial positions?

8. Where is analyst cognitive work bottlenecking? Research synthesis, outage reading, price signal narrative, RFQ drafting — and what GenAI control framework would need to exist to accelerate it safely?

### Part E · Causal Structure

**Root causes:**

- **ETRM/CTRM platform inheritance.** Dominant ETRM platforms were designed pre-cloud, pre-AI, with deep customization per operator. Modernization is operationally risky; most programs extend rather than replace, producing capability gaps that fill with side tools.
- **Market data vendor lock and cost.** Premium market data (ICE, CME, Platts, Argus, Wood Mackenzie, Kpler, Enverus, Bloomberg, Refinitiv) is expensive and contractually constrained. Data fusion across vendors is non-trivial and often done in analyst desktops.
- **Regulatory regime layering.** CFTC Title VII swap rules, FERC jurisdictional markets oversight, EMIR, MiFID II, REMIT, state-level emissions markets — created successive compliance obligations without architectural re-baselining.
- **Trading floor culture.** Traders are high-autonomy, high-velocity; traditional enterprise controls (slow approval, formal governance) resisted; tools adopted on desk ahead of formal sanction. Shadow AI particularly acute here.
- **Middle and back office maturity lag.** Middle and back office often under-invested relative to front office; surveillance and reporting platforms older, staffing lean.
- **Model risk framing inconsistent.** Pricing and risk models have MRM discipline in sophisticated shops; forecasting, signal, and AI-augmented workflows often don't.
- **Physical-financial organizational split.** Generation ops, power scheduling, and commercial trading sometimes report into different executives with different systems and incentive structures.

**Immediate causes:**

- Forecast skill variable by analyst and product.
- Generative AI adoption ahead of control framework; shadow AI patterns active.
- Surveillance false-positive volume high; miss rate concerns persistent.
- Credit exposure latency and gaps.
- Regulatory reporting data quality friction.
- Physical-financial arbitrage opportunities missed.

**Effects:**

- P&L variance from forecast error.
- Regulatory findings on surveillance / reporting / credit.
- Operational risk from shadow AI use on market-facing content.
- Opportunity cost on physical-financial optimization.
- Analyst capacity constrained by low-value cognitive work.
- Competitive disadvantage vs. firms with mature AI-augmented trading.

### Part F · Interventions

Eight interventions form the full program:

1. **Unified forecasting platform.** Consolidated forecasting infrastructure covering price (nodal / hub / zonal), load, weather, fuel, renewables output, and congestion, with consistent skill measurement, model inventory, and feature store. Success rate 70% on forecast skill uplift in targeted products.

2. **GenAI control framework for trading floor.** Sanctioned GenAI pattern library for analyst use (research synthesis, outage parsing, desk note drafting, RFQ drafting), integrated with enterprise DLP, sanctioned tool catalog (Copilot for M365, Claude with enterprise controls, custom workflows), supervision, surveillance integration, and model risk framing. Success rate 75% on GenAI uptake with control when program is sponsored from front office and compliance jointly.

3. **Trade surveillance modernization.** Modern surveillance platform (Nasdaq SMARTS, Scila, Eventus, NICE Actimize trade compliance, b-next, or platform-native) with AI-augmented lexical and behavioral detection, generative AI for context summarization of alerts, and structured case management. Integration with broader financial crimes posture. Success rate 65% on surveillance quality and examination posture.

4. **Credit and counterparty risk modernization.** Real-time or near-real-time credit exposure, dynamic credit limit management, counterparty concentration and wrong-way risk modeling, FERC Order 741 RTO credit automation. Success rate 70%.

5. **Regulatory reporting automation.** Automated CFTC SDR reporting, FERC EQR, EMIR / MiFID II / REMIT reporting pipelines with data quality monitoring, exception handling, and lineage. Success rate 75%.

6. **Physical-financial integration.** Joint optimization across generation fleet dispatch, reserves, ancillary services, storage, and commercial positions where the organization has physical assets and a trading function. Digital twin integration where applicable. Success rate 55% (organizational).

7. **Analyst productivity platform.** Research synthesis assistants, outage / EIA / FERC filing parsing, price narrative generation, desk note drafting, RFQ drafting — all on sanctioned GenAI infrastructure with appropriate supervision. Success rate 70% on analyst capacity release.

8. **Model risk management for trading AI.** Model inventory covering forecasting, signal generation, credit, surveillance, and generative AI workflows. Tiered validation under MRM framework adapted for AI. Success rate 65%.

### Part G · Anti-Patterns

1. **Generative AI adopted desk-by-desk without framework.** Each desk adopts GenAI tools independently; no sanctioned catalog; compliance and surveillance unaware; model risk not applied.

2. **Forecast consolidation in Excel.** Multiple forecast streams consolidated by analysts in Excel; forecast skill not measured systematically; model risk management absent.

3. **Surveillance tuned for minimum examination posture.** Surveillance systems tuned to pass examination without investment in quality. False positives high, miss rate unknown, case handling manual.

4. **Credit exposure reported nightly in a rapidly-changing market.** Daily exposure reports in markets that move intraday; real-time or near-real-time exposure absent.

5. **Regulatory reporting as manual Excel process.** Dodd-Frank, FERC EQR, EMIR, REMIT reporting assembled in Excel quarterly with high rework.

6. **Physical and financial siloed organizationally.** Generation ops and commercial trading report separately with separate tools; joint optimization impossible.

7. **ETRM modernization treated as pure technology project.** Platform selection or upgrade treated as IT project without data, process, or operating model rethink.

8. **Analyst cognitive work treated as "that's the job."** Research, outage reading, reporting drafting accepted as labor-intensive analyst work rather than GenAI-augmentable function.

### Part H · Vendor Landscape

**ETRM / CTRM platforms:**
- **ION Commodities (Allegro, Aligne, Endur, Openlink, TriplePoint, Amphora, Agiboo).** Dominant consolidation; broad platform portfolio across power, gas, oil, softs, metals.
- **FIS / Aligne.** Power and gas trading.
- **Murex.** Broader financial markets with commodities coverage.
- **Enverus RightAngle.** Upstream and midstream oil & gas.
- **SAP Commodity Management.**
- **In-house ETRMs.** Several large trading operations run significant proprietary builds.
- **Pioneer Solutions (Energy), Eka, CTRM Cube, Agiboo (now ION).**

**Market data / intelligence:**
- **ICE (Intercontinental Exchange), CME Group.** Exchange data.
- **Bloomberg Terminal.** General markets + commodities.
- **LSEG (Refinitiv Eikon / Workspace).** General markets + commodities.
- **S&P Global Commodity Insights (Platts).** Price assessments, news, analytics.
- **Argus Media.** Price assessments and news.
- **Wood Mackenzie.** Research and analytics.
- **Kpler.** Physical flow intelligence (tankers, LNG, refined products, crude).
- **Vortexa.** Refined products and crude flow.
- **Genscape (Wood Mackenzie).** Pipeline, storage, power plant signals.
- **Enverus.** Oil & gas data and analytics.
- **Yes Energy.** Power market analytics.
- **EnergyGPS, Morningstar Commodity Data.**

**Specialized trading / scheduling:**
- **OATI (Open Access Technology International).** Power scheduling, credit, NERC-compliant tools.
- **PCI Energy Solutions.** Power trading and portfolio management.
- **Open Systems International (OSI).** Utility operations adjacent.

**Surveillance and compliance:**
- **Nasdaq SMARTS Surveillance.**
- **Scila (Nasdaq).**
- **Eventus (Validus).**
- **NICE Actimize Trade Compliance.**
- **b-next.**
- **KRM22, SteelEye.**
- **Custom + regtech specialists.**

**Specialized AI / analytics:**
- **Amperon.** AI load forecasting.
- **Enelyst, Veritone, AggreGate.**
- **Databricks / Snowflake + custom ML.**
- **Domain specialist: weather — Atmospheric G2, DTN, ClimateAI, Weather Company (IBM).**

**Generative AI for analyst productivity:**
- Enterprise Copilot (Microsoft), Claude (Anthropic), OpenAI Enterprise, domain-tuned custom assistants.

Platform strategy: most operators run an ION-based or FIS-based ETRM core with a surrounding ecosystem of market data, specialized analytics, and increasingly AI-native tooling; surveillance is typically a Nasdaq SMARTS or Actimize deployment with augmentation.

### Part I · Regulatory Considerations

Commodity trading sits in a dense regulatory perimeter:

- **CFTC / Dodd-Frank Title VII.** Swap rules, SDR reporting, swap dealer registration thresholds, position limits, large trader reporting. NFA rulemaking.

- **FERC Part 35 / FERC Order 741 / Order 760 / market manipulation authority.** Electronic trade reporting, RTO/ISO credit management, anti-manipulation prohibitions, quarterly EQR reporting. FERC Office of Enforcement active in energy market manipulation.

- **FERC-regulated markets and RTO/ISO rules.** Market Monitor oversight (e.g., Monitoring Analytics at PJM, Potomac Economics at MISO/NYISO/CAISO/ERCOT/NEPOOL). Market rules create specific surveillance obligations.

- **EMIR (EU).** Derivatives reporting, clearing, risk mitigation, margin.

- **MiFID II / MiFIR (EU).** Investment firm regulation — pre-trade and post-trade transparency, position reporting, best execution, algorithmic trading governance.

- **REMIT (EU).** Energy market transparency and integrity — wholesale energy products reporting (data provider registration), inside information publication, market abuse prohibition.

- **SEC (where securities).** Rare but applicable for some structured products.

- **EPA and state emissions / environmental markets.** RGGI, California CCA, Washington Climate Commitment Act, state REC programs, LCFS. Compliance market integrity.

- **OFAC / sanctions.** Trading with sanctioned parties or on sanctioned commodities.

- **SR 11-7 for bank-owned trading operations.** Model risk management.

- **NIST AI RMF and EU AI Act.** Frameworks applicable to trading AI; EU AI Act high-risk classification for some trading model uses.

- **Emerging AI disclosure expectations.** Buy-side and regulatory interest in AI model disclosure for trading operations is rising.

### Part J · Observations from Composite Programs

1. **Keystone Energy trading AI modernization.** Composite integrated energy operator (generation fleet + midstream + commercial trading + wholesale marketing). Program scope: unified forecasting platform (load, price, congestion, weather, fuel) on Databricks; ION-based ETRM retained with augmentation layer; GenAI control framework for analyst use with Claude enterprise deployment; Nasdaq SMARTS surveillance modernization with generative AI for case narrative; FERC Order 741 credit automation; joint physical-financial optimization for generation fleet. Outcomes over 30 months: forecast skill uplift in target products; shadow AI eliminated through sanctioned catalog and control framework; surveillance examination posture improved; analyst capacity released 20%+ on research and reporting workloads. Composite organization built from real-world data.

2. **IPP commercial desk GenAI productivity program.** Composite IPP with large commercial desk. GenAI research synthesis, outage parsing, desk note drafting. Analyst time on high-value scenario work increased. Composite.

3. **Natural gas marketer surveillance modernization.** Composite natural gas marketer. Nasdaq SMARTS deployment with generative AI layer for alert summarization; reduction in case handling time; reduction in false positive burden. Composite.

4. **Utility power trading desk forecasting modernization.** Composite utility trading operation. Amperon load forecasting + Yes Energy market data + proprietary weather models unified. Nodal congestion prediction uplift; real-time bid optimization improvements. Composite.

5. **Oil major physical-financial integration.** Composite integrated oil major. Physical trading (crude cargoes, refined products, LNG) integrated with financial hedging desk; joint optimization platform reducing manual reconciliation. Composite.

6. **Emissions and REC trading operation.** Composite environmental markets trading firm. Multi-jurisdiction RGGI / CCA / RECs / LCFS trading consolidated on modern stack; compliance market integrity monitoring upgraded. Composite.

7. **Trading house GenAI analyst assistant.** Composite independent trading house. Custom research assistant fed with sanctioned market data feeds (Kpler, Platts, Argus) for vessel tracking, flow analysis, narrative drafting. Composite.

8. **Regulatory reporting automation for swap dealer.** Composite swap-dealer-registered trading operation. Dodd-Frank SDR reporting automation with data quality monitoring; reduction in rework; examination posture improved. Composite.

### Part K · Success Measures

**Trading performance:**
- Forecast skill by product (MAPE, bias, Pinball loss for probabilistic)
- P&L attribution clarity
- Signal-to-P&L correlation on AI-driven recommendations
- Physical-financial optimization uplift

**Operating model:**
- Analyst productivity (time allocation between high-value and low-value work)
- GenAI adoption rate on sanctioned catalog
- Shadow AI incidence trending down
- Desk-to-compliance cycle time

**Risk and compliance:**
- Trade surveillance alert quality (FPR, miss rate)
- Case aging and handling time
- Credit exposure latency and accuracy
- Counterparty concentration and wrong-way risk coverage
- Regulatory reporting timeliness and data quality
- Regulatory examination findings
- Model risk coverage of trading AI

**Financial outcomes:**
- Trading P&L improvement
- Regulatory penalty / settlement avoidance
- Operational cost reduction (reporting, reconciliation, case handling)
- Capital efficiency (real-time credit)
- Analyst capacity ROI

### Part L · Timeline

**Months 0-6:** Forecasting platform foundation. GenAI control framework and sanctioned catalog. Surveillance modernization selection.
**Months 6-12:** Forecasting platform core deployment. GenAI analyst productivity wave 1. Surveillance platform core. Credit modernization.
**Months 12-18:** Regulatory reporting automation. Physical-financial integration. Model risk management expansion to AI.
**Months 18-24:** Advanced capabilities — probabilistic forecasting, nodal congestion, weather derivatives modeling, joint physical-financial optimization at scale.
**Months 24-36:** Continuous improvement. Integration with emerging regulatory expectations (EU AI Act, enhanced FERC / CFTC AI scrutiny).

### Part M · Governance Mechanism

**Trading & Commercial Operations Committee.** Weekly. Members: Head of Trading (chair), Head of Risk, Head of Compliance, Head of Operations, Head of Technology, Head of Analytics. Reviews: trading performance, forecast skill, surveillance quality, credit posture, regulatory reporting health, AI adoption.

**AI Trading Control Forum.** Biweekly. Sanctioned tool catalog, new AI use case intake, control effectiveness, surveillance integration, shadow AI patterns.

**Model Risk Committee.** Per MRM framework. All material trading models including forecasting, signal, credit, surveillance, and generative AI workflows subject to tiered validation.

**AI Council linkage.** Material model changes flow through enterprise AI Council per pattern 2.3. Trading AI receives heightened attention given regulatory sensitivity.

**Regulatory Engagement.** Proactive dialogue with CFTC, FERC (where applicable), state regulators, and Market Monitors.

### Part N · Sector Variants

- **Utility trading.** Physical-financial integration with generation; RTO/ISO scheduling; state regulatory overlay.
- **IPP / merchant generator commercial desk.** Less physical-financial breadth but deep nodal market focus.
- **Integrated oil major.** Global physical presence; refining, shipping, LNG, crude, products.
- **Natural gas marketer.** Pipeline and hub focus; transportation capacity management.
- **Swap dealer registered operation.** Full Dodd-Frank Title VII obligations.
- **Trading house / merchant (non-producer).** Minimal physical presence; financial focus.
- **Environmental markets (REC / carbon / LCFS) specialist.** Compliance market integrity focus.
- **Producer marketing arm.** Hedging + physical sales; less speculative footprint.
- **Renewables developer trading desk.** PPA optimization, hedging, REC strategy.

### Part O · Graph Schema Contribution

```cypher
MERGE (p:Pattern {id: 'pattern_commodity_trading_ai'})
ON CREATE SET
  p.name = 'Commodity Trading AI',
  p.category = 'Trading, Risk & Settlement',
  p.cross_industry = false,
  p.primary_sector = 'energy',
  p.confidence_floor = 0.70,
  p.n_observations_floor = 6,
  p.version = '1.0.0';

MERGE (t_fcst:Topic {id: 'topic_unified_trading_forecasting'})
ON CREATE SET t_fcst.name = 'Unified Trading Forecasting Platform';
MERGE (t_gai:Topic {id: 'topic_genai_trading_control_framework'})
ON CREATE SET t_gai.name = 'GenAI Control Framework for Trading Floor';
MERGE (t_surv:Topic {id: 'topic_trade_surveillance_modernization'})
ON CREATE SET t_surv.name = 'Trade Surveillance Modernization';
MERGE (t_credit:Topic {id: 'topic_credit_counterparty_risk_ai'})
ON CREATE SET t_credit.name = 'Credit & Counterparty Risk Modernization';
MERGE (t_reg:Topic {id: 'topic_regulatory_reporting_automation'})
ON CREATE SET t_reg.name = 'Regulatory Reporting Automation';
MERGE (t_pf:Topic {id: 'topic_physical_financial_integration'})
ON CREATE SET t_pf.name = 'Physical-Financial Integration';
MERGE (t_ap:Topic {id: 'topic_analyst_productivity_platform'})
ON CREATE SET t_ap.name = 'Analyst Productivity Platform';
MERGE (t_mrm:Topic {id: 'topic_trading_ai_model_risk_management'})
ON CREATE SET t_mrm.name = 'Model Risk Management for Trading AI';

MERGE (p)-[:COVERS_TOPIC]->(t_fcst);
MERGE (p)-[:COVERS_TOPIC]->(t_gai);
MERGE (p)-[:COVERS_TOPIC]->(t_surv);
MERGE (p)-[:COVERS_TOPIC]->(t_credit);
MERGE (p)-[:COVERS_TOPIC]->(t_reg);
MERGE (p)-[:COVERS_TOPIC]->(t_pf);
MERGE (p)-[:COVERS_TOPIC]->(t_ap);
MERGE (p)-[:COVERS_TOPIC]->(t_mrm);

// Related patterns
MERGE (p_pm:Pattern {id: 'pattern_predictive_maintenance_modernization'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_pm);

MERGE (p_am:Pattern {id: 'pattern_analytics_modernization'});
MERGE (p)-[:CHILD_OF]->(p_am);

MERGE (p_gov:Pattern {id: 'pattern_ai_governance_operating_model'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_gov);

MERGE (p_port:Pattern {id: 'pattern_ai_use_case_portfolio'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_port);

MERGE (p_fraud:Pattern {id: 'pattern_fraud_detection_modernization'});
MERGE (p)-[:RELATED_TO {relationship_type: 'analogous'}]->(p_fraud);

// Sectors
MERGE (s_en:Sector {id: 'sector_energy', name: 'Energy'});
MERGE (p)-[:APPLIES_TO]->(s_en);

// Vendors — ETRM/CTRM
MERGE (v_ion:Vendor {id: 'vendor_ion_commodities'})
ON CREATE SET v_ion.name = 'ION Commodities (Allegro / Aligne / Endur / Openlink / TriplePoint / Amphora)', v_ion.category = 'ETRM/CTRM Platform';
MERGE (v_ion)-[:APPEARS_IN]->(p);

MERGE (v_fis:Vendor {id: 'vendor_fis_aligne'})
ON CREATE SET v_fis.name = 'FIS / Aligne', v_fis.category = 'ETRM';
MERGE (v_fis)-[:APPEARS_IN]->(p);

MERGE (v_murex:Vendor {id: 'vendor_murex'})
ON CREATE SET v_murex.name = 'Murex', v_murex.category = 'Trading Platform';
MERGE (v_murex)-[:APPEARS_IN]->(p);

MERGE (v_env:Vendor {id: 'vendor_enverus_rightangle'})
ON CREATE SET v_env.name = 'Enverus RightAngle', v_env.category = 'Oil & Gas ETRM';
MERGE (v_env)-[:APPEARS_IN]->(p);

// Market data
MERGE (v_ice:Vendor {id: 'vendor_ice'})
ON CREATE SET v_ice.name = 'ICE (Intercontinental Exchange)', v_ice.category = 'Exchange + Data';
MERGE (v_ice)-[:APPEARS_IN]->(p);

MERGE (v_cme:Vendor {id: 'vendor_cme'})
ON CREATE SET v_cme.name = 'CME Group', v_cme.category = 'Exchange + Data';
MERGE (v_cme)-[:APPEARS_IN]->(p);

MERGE (v_bbg:Vendor {id: 'vendor_bloomberg'})
ON CREATE SET v_bbg.name = 'Bloomberg Terminal', v_bbg.category = 'Market Data + Analytics';
MERGE (v_bbg)-[:APPEARS_IN]->(p);

MERGE (v_lseg:Vendor {id: 'vendor_lseg_refinitiv'})
ON CREATE SET v_lseg.name = 'LSEG (Refinitiv Eikon/Workspace)', v_lseg.category = 'Market Data';
MERGE (v_lseg)-[:APPEARS_IN]->(p);

MERGE (v_platts:Vendor {id: 'vendor_sp_global_commodity_insights'})
ON CREATE SET v_platts.name = 'S&P Global Commodity Insights (Platts)', v_platts.category = 'Price Assessments + Analytics';
MERGE (v_platts)-[:APPEARS_IN]->(p);

MERGE (v_argus:Vendor {id: 'vendor_argus_media'})
ON CREATE SET v_argus.name = 'Argus Media', v_argus.category = 'Price Assessments';
MERGE (v_argus)-[:APPEARS_IN]->(p);

MERGE (v_wm:Vendor {id: 'vendor_wood_mackenzie'})
ON CREATE SET v_wm.name = 'Wood Mackenzie', v_wm.category = 'Research + Analytics';
MERGE (v_wm)-[:APPEARS_IN]->(p);

MERGE (v_kpl:Vendor {id: 'vendor_kpler'})
ON CREATE SET v_kpl.name = 'Kpler', v_kpl.category = 'Physical Flow Intelligence';
MERGE (v_kpl)-[:APPEARS_IN]->(p);

MERGE (v_vx:Vendor {id: 'vendor_vortexa'})
ON CREATE SET v_vx.name = 'Vortexa', v_vx.category = 'Refined Products + Crude Flow';
MERGE (v_vx)-[:APPEARS_IN]->(p);

MERGE (v_ye:Vendor {id: 'vendor_yes_energy'})
ON CREATE SET v_ye.name = 'Yes Energy', v_ye.category = 'Power Market Analytics';
MERGE (v_ye)-[:APPEARS_IN]->(p);

// Surveillance
MERGE (v_nasd:Vendor {id: 'vendor_nasdaq_smarts'})
ON CREATE SET v_nasd.name = 'Nasdaq SMARTS Surveillance', v_nasd.category = 'Trade Surveillance';
MERGE (v_nasd)-[:APPEARS_IN]->(p);

MERGE (v_scila:Vendor {id: 'vendor_scila'})
ON CREATE SET v_scila.name = 'Scila (Nasdaq)', v_scila.category = 'Trade Surveillance';
MERGE (v_scila)-[:APPEARS_IN]->(p);

MERGE (v_evts:Vendor {id: 'vendor_eventus'})
ON CREATE SET v_evts.name = 'Eventus (Validus)', v_evts.category = 'Trade Surveillance';
MERGE (v_evts)-[:APPEARS_IN]->(p);

MERGE (v_act:Vendor {id: 'vendor_nice_actimize_trade'})
ON CREATE SET v_act.name = 'NICE Actimize Trade Compliance', v_act.category = 'Trade Surveillance';
MERGE (v_act)-[:APPEARS_IN]->(p);

// Specialized power
MERGE (v_oati:Vendor {id: 'vendor_oati'})
ON CREATE SET v_oati.name = 'OATI', v_oati.category = 'Power Scheduling + Credit';
MERGE (v_oati)-[:APPEARS_IN]->(p);

// Load forecasting AI
MERGE (v_amp:Vendor {id: 'vendor_amperon'})
ON CREATE SET v_amp.name = 'Amperon', v_amp.category = 'AI Load Forecasting';
MERGE (v_amp)-[:APPEARS_IN]->(p);

// Regulatory frameworks
MERGE (f_cftc:RegulatoryFramework {id: 'framework_cftc_dodd_frank_title_vii'})
ON CREATE SET f_cftc.name = 'CFTC Dodd-Frank Title VII';
MERGE (f_cftc)-[:APPLIES_TO]->(p);

MERGE (f_ferc_mm:RegulatoryFramework {id: 'framework_ferc_market_manipulation'})
ON CREATE SET f_ferc_mm.name = 'FERC Market Manipulation Authority';
MERGE (f_ferc_mm)-[:APPLIES_TO]->(p);

MERGE (f_ferc_741:RegulatoryFramework {id: 'framework_ferc_order_741'})
ON CREATE SET f_ferc_741.name = 'FERC Order 741 (RTO/ISO Credit)';
MERGE (f_ferc_741)-[:APPLIES_TO]->(p);

MERGE (f_ferc_760:RegulatoryFramework {id: 'framework_ferc_order_760'})
ON CREATE SET f_ferc_760.name = 'FERC Order 760 (EQR)';
MERGE (f_ferc_760)-[:APPLIES_TO]->(p);

MERGE (f_emir:RegulatoryFramework {id: 'framework_emir'})
ON CREATE SET f_emir.name = 'EMIR';
MERGE (f_emir)-[:APPLIES_TO]->(p);

MERGE (f_mifid:RegulatoryFramework {id: 'framework_mifid_ii'})
ON CREATE SET f_mifid.name = 'MiFID II / MiFIR';
MERGE (f_mifid)-[:APPLIES_TO]->(p);

MERGE (f_remit:RegulatoryFramework {id: 'framework_remit'})
ON CREATE SET f_remit.name = 'REMIT';
MERGE (f_remit)-[:APPLIES_TO]->(p);
```

### Part P · Retrieval Contribution

~70 chunks. Namespace `global:patterns:energy`. Sub-variants across utility-trading / IPP-commercial / oil-major / gas-marketer / swap-dealer / trading-house / env-markets / producer-marketing / renewables-dev. Chunks carry `desk_type`, `commodity` (power | gas | crude | products | emissions | REC | LCFS | weather | freight), and `capability_area` (forecasting | genai-control | surveillance | credit | reporting | physical-financial | analyst-productivity | mrm).

### Part Q · Prompting Contract

**Detection fragment:**

```
PATTERN: pattern_commodity_trading_ai (ENERGY)
Summary: Commodity trading AI modernization — unified forecasting, GenAI control framework for trading floor, trade surveillance modernization, credit/counterparty risk, regulatory reporting automation, physical-financial integration, analyst productivity platform, MRM for trading AI.
Activates when:
- Forecasting fragmentation (price/load/weather/fuel/congestion siloed)
- ETRM on extend-and-bolt-on path with data reconciliation pain
- GenAI adoption on desk without control framework
- Trade surveillance lag (FPR / miss rate concerns, examination findings)
- Credit / counterparty exposure models dated
- Regulatory reporting labor-intensive (Dodd-Frank / FERC / EMIR / REMIT)
- Physical-financial integration weak
- Analyst productivity underleveraged
Diagnostic questions focus on forecasting ownership, ETRM roadmap, GenAI control, surveillance posture, credit exposure latency, regulatory regimes, physical-financial, analyst cognitive work.
If active, output pattern_id, confidence, signals_triggered, rationale.
```

**Injection fragment:** Interventions emphasizing unified forecasting platform, GenAI control framework (sanctioned catalog + supervision), trade surveillance modernization, credit/counterparty risk modernization, regulatory reporting automation, physical-financial integration, analyst productivity platform, MRM for trading AI. Observations: Keystone Energy trading AI program (primary reference); IPP commercial desk GenAI; natural gas marketer surveillance; utility power trading forecasting; oil major physical-financial integration; emissions/REC trading; trading house GenAI assistant; swap dealer regulatory reporting automation. Anti-patterns: desk-by-desk GenAI adoption, forecast consolidation in Excel, surveillance tuned for minimum examination, nightly credit in intraday markets, Excel-based regulatory reporting, siloed physical/financial, ETRM modernization as pure tech project, analyst cognitive work as "that's the job."

**Diagnostic fragment:** Sequenced probing: forecasting ownership + skill measurement; ETRM state + roadmap; GenAI adoption posture + control; surveillance posture + regulatory findings; credit exposure latency; regulatory reporting regimes + labor; physical-financial integration scope; analyst cognitive bottleneck analysis.

### Part R · Rendering Contract

`/intelligence/patterns/commodity-trading-ai`. Light hero + dark working zone.

Hero copy: **"AI is on every desk. The control framework, surveillance, and forecasting platform usually aren't."**

Unique rendering element: trading AI capability matrix — forecasting | GenAI productivity | surveillance | credit | reporting | physical-financial | MRM — with tenant-specific maturity overlay; sanctioned GenAI catalog snapshot; surveillance alert quality trend; regulatory reporting health dashboard.

Right sidebar (tenant): forecasting skill scorecard, GenAI control maturity, surveillance FPR and case aging, credit latency, regulatory reporting data quality, physical-financial integration score.

Cross-links to predictive maintenance modernization pattern, analytics modernization parent, AI governance operating model, and AI use case portfolio. Also cross-linked to fraud detection modernization (analogous surveillance control discipline).

Composite tenant callout: Keystone Energy trading AI modernization shown as primary reference program. Always labeled "composite organization built from real-world data."

---

*End of Part 3.4b · Commodity Trading AI*

*Next in file sequence: `14-persistence-design.md` — Part 4 Persistence Design*

---
