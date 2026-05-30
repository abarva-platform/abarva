// seed-banking-dom03-bsa-aml-part3.ts
// Banking genome patterns — BSA/AML & Financial Crime Compliance
// Code range: B820–B879  (60 patterns)
// Loaded by: scripts/corpus/load-authored-genome-seeds.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface PatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
  subTopic?: string;
}

export const BANKING_BSA_AML_PART3_PATTERNS: PatternSeed[] = [

  // ── Crypto AML: VASP Monitoring Under FinCEN 2020 Rule ────────────────────
  {
    code: 'B820',
    name: 'FinCEN 2020 CVC Rule Compliance Gap in VASP Customer Onboarding',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `First Capital's VASP customer onboarding process does not fully implement
      the requirements of FinCEN's 2020 Final Rule on Convertible Virtual Currency (CVC)
      and Digital Assets, which extended Bank Secrecy Act obligations explicitly to money
      transmitters dealing in CVC — the bank's BSA onboarding checklist for VASP customers
      was last updated in 2019 and does not require collection of the VASP's own CDD
      program documentation, Travel Rule compliance infrastructure, or FinCEN registration
      certificate. OCC examination teams reviewing First Capital's VASP portfolio in 2024
      found that five of eleven VASP customers had not been onboarded against the 2020
      rule's enhanced requirements, a systemic program gap that FinCEN has cited as a
      primary BSA examination deficiency at similarly situated regional banks.`,
    keywords: ['FinCEN 2020 CVC Rule', 'VASP', 'AML', 'BSA', 'OCC', 'cryptocurrency'],
    demoRelevant: true,
    subTopic: 'crypto-aml',
  },
  {
    code: 'B821',
    name: 'DeFi Transaction Tracing Capability Absent for High-Risk VASP Accounts',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital provides fiat banking services to VASP customers whose
      underlying transaction flows include DeFi protocol interactions — liquidity pool
      withdrawals, cross-chain bridge transactions, and mixer-adjacent smart contract
      interactions — but the bank has no on-chain tracing capability to assess the
      provenance of fiat deposits funded by these DeFi-sourced proceeds. FATF's updated
      Recommendation 15 guidance (2021) identifies DeFi transaction opacity as a primary
      money laundering risk vector because smart contract automation permits layering
      without a custodial intermediary visible to AML controls; FinCEN's examination
      teams have flagged banks that provide fiat-off-ramp services for DeFi without
      commensurate on-chain analytics as having a structural monitoring gap.`,
    keywords: ['DeFi tracing', 'VASP', 'FATF R.15', 'FinCEN', 'AML', 'blockchain analytics'],
    demoRelevant: false,
    subTopic: 'crypto-aml',
  },
  {
    code: 'B822',
    name: 'NFT-Based Layering Pattern Not Detected by Fiat Transaction Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital banks customers who engage in NFT marketplace activity, but
      the transaction monitoring system monitors only fiat-side transactions — deposits from
      NFT marketplace operator accounts and withdrawals to fund NFT purchases — without any
      assessment of whether the NFT transaction pattern itself constitutes layering through
      wash-trading or round-trip value transfer. FinCEN's 2022 financial trend analysis
      and the Financial Action Task Force's October 2022 updated virtual asset guidance
      both identify NFT wash-trading as a documented layering technique; the absence of
      an NFT-specific fiat correlation monitor means that a customer converting illicit
      fiat to crypto, washing it through NFT trades, and converting back to fiat would
      pass through each fiat transaction leg undetected.`,
    keywords: ['NFT layering', 'FATF', 'FinCEN', 'AML', 'VASP', 'wash-trading'],
    demoRelevant: false,
    subTopic: 'crypto-aml',
  },
  {
    code: 'B823',
    name: 'Stablecoin Settlement Risk Not Addressed in BSA/AML Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `First Capital's VASP customers increasingly use stablecoin (USDT, USDC,
      DAI) settlements rather than BTC or ETH for large-value transfers, but the bank's
      AML risk assessment treats all crypto-originated fiat deposits as equivalent
      regardless of the underlying stablecoin settlement mechanism — stablecoins present
      distinct AML risks because programmatic settlement speeds, reduced on-chain
      congestion, and cross-chain bridging create layering velocities not achievable
      with traditional BTC or ETH. FinCEN has noted in examination guidance and public
      statements that stablecoins' speed and programmability make them attractive for
      rapid layering; the bank's risk assessment failure to differentiate stablecoin
      settlement risk means monitoring scenarios are under-calibrated for this exposure.`,
    keywords: ['stablecoin', 'VASP', 'FinCEN', 'AML', 'BSA', 'OCC'],
    demoRelevant: false,
    subTopic: 'crypto-aml',
  },
  {
    code: 'B824',
    name: 'Crypto Exchange EDD Relies on Self-Reported Compliance Attestation Only',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description: `Enhanced due diligence for First Capital's crypto exchange customers relies
      entirely on self-reported compliance program attestations from the exchange — the bank
      does not obtain independent third-party compliance assessments, audit reports, or
      regulatory examination letters to corroborate the exchange's representations about its
      AML controls. USA PATRIOT Act Section 312 enhanced due diligence for foreign
      financial institution accounts requires an assessment of the respondent's AML program
      using information beyond self-attestation; OCC examination findings at peer institutions
      have cited sole reliance on customer-provided attestations as inadequate EDD for high-risk
      VASP relationships, particularly where the exchange operates in a lightly regulated
      offshore jurisdiction.`,
    keywords: ['crypto exchange EDD', 'USA PATRIOT Act', 'FinCEN', 'AML', 'OCC', 'VASP'],
    demoRelevant: true,
    subTopic: 'crypto-aml',
  },
  {
    code: 'B825',
    name: 'Mixer and Tumbler Transaction Exposure Unaddressed in VASP Monitoring Scope',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital's VASP customers include exchanges and payment processors
      whose platform transactions include known mixer and tumbler outputs — blockchain
      analytics would identify mixing service interactions in a portion of VASP-originated
      fiat deposits, but the bank does not subscribe to or query any blockchain analytics
      service to identify mixer exposure in its VASP account inflows. FinCEN sanctioned
      the Tornado Cash mixer protocol in August 2022 under IEEPA authorities and issued
      guidance that financial institutions providing fiat services to VASPs that receive
      mixer-originated proceeds may be facilitating money laundering; First Capital's
      absence of blockchain analytics capability prevents it from meeting this expectation.`,
    keywords: ['crypto mixer', 'FinCEN', 'VASP', 'AML', 'blockchain analytics', 'IEEPA'],
    demoRelevant: false,
    subTopic: 'crypto-aml',
  },

  // ── Trade-Based Money Laundering (TBML) ───────────────────────────────────
  {
    code: 'B826',
    name: 'TBML Commodity Price Reference Data Gap in Commercial Banking Underwriting',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `First Capital's commercial banking trade finance underwriters do not have
      real-time access to commodity price reference databases — LME, CME, S&P Global Platts,
      Refinitiv — during the letter of credit review process, so price benchmarking against
      invoiced commodity values is performed only on an ad hoc basis when a relationship
      manager flags an anomaly. The Wolfsberg Group's 2019 Trade Finance Principles and FATF's
      2020 TBML guidance both require that trade finance institutions maintain access to
      market reference data sufficient to identify material over- or under-invoicing; a
      workflow where commodity price benchmarking is discretionary rather than systematic
      cannot consistently detect the price manipulation that is the primary mechanism for
      value transfer in TBML.`,
    keywords: ['TBML', 'commodity price benchmarking', 'FATF', 'trade finance', 'FinCEN', 'AML'],
    demoRelevant: false,
    subTopic: 'trade-based-ml',
  },
  {
    code: 'B827',
    name: 'Over-Invoicing Detection Program Absent for Agricultural Commodity Trade',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital's largest TBML exposure is its agricultural commodity trade
      finance book — corn, soybeans, coffee — where invoice price variances are common due
      to quality grading and logistics adjustments, and where over-invoicing by 15–25% would
      be within normal commercial variation; the bank has no documented price-banding
      methodology that distinguishes legitimate commercial pricing variance from TBML-motivated
      over-invoicing for these commodities. FinCEN's TBML advisory specifically cites
      agricultural commodities as a high-risk TBML vehicle because the price opacity of
      physical commodity markets makes it difficult for banks to challenge invoice prices
      without commodity-specific expertise; the absence of any agricultural commodity
      benchmarking tool is a documented TBML control gap.`,
    keywords: ['TBML', 'over-invoicing', 'agricultural commodity', 'FinCEN', 'FATF', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-based-ml',
  },
  {
    code: 'B828',
    name: 'Dual-Use Export Control Screening Not Integrated in Trade Finance Approval Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `First Capital does not screen trade finance transactions against the Bureau
      of Industry and Security Entity List, Commerce Control List, or State Department DDTC
      munitions list before approving letter of credit issuance — the screening step is
      performed only for OFAC SDN matches, not export control designees. FinCEN's proliferation
      finance guidance and FATF Recommendation 7 require financial institutions to implement
      targeted financial sanctions related to WMD proliferation and to apply enhanced due
      diligence to transactions involving dual-use goods; a trade finance approval workflow
      that does not screen for BIS or DDTC designations creates both AML and OFAC-adjacent
      proliferation finance exposure that OCC examination teams have begun testing as part
      of the national priorities assessment.`,
    keywords: ['dual-use goods', 'BIS Entity List', 'export controls', 'FinCEN', 'FATF R.7', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-based-ml',
  },
  {
    code: 'B829',
    name: 'Under-Invoicing Pattern Detection Absent for Capital Flight Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `TBML programs exploit under-invoicing — importing goods at prices below
      market value — as a capital flight mechanism to transfer value from higher-tax or
      capital-controlled jurisdictions into the U.S. banking system; First Capital's trade
      finance monitoring focuses on over-invoicing detection and misses the under-invoicing
      channel entirely. FATF's 2020 updated TBML guidance explicitly addresses the
      asymmetry between over-invoicing (common for outbound capital flight from developing
      markets to developed financial systems) and under-invoicing (common for import
      financing where the difference between invoice price and actual value is extracted
      as cash in the destination market); the bank's scenario library addresses only one
      direction of price manipulation.`,
    keywords: ['TBML', 'under-invoicing', 'capital flight', 'FATF', 'AML', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-based-ml',
  },
  {
    code: 'B830',
    name: 'Phantom Shipment Financing Detected Only at Documentary Stage, Not at Funds Settlement',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital's trade finance controls require that shipping documentation be
      presented before LC proceeds are released, but the bank does not cross-reference customs
      clearance records or port arrival confirmation against presented bills of lading — a
      phantom shipment scheme using forged shipping documents passes the documentary control
      but is detectable if customs arrival data is checked against the presented transport
      documents. The Wolfsberg Trade Finance Principles require that banks implement
      reasonable verification beyond documentary compliance for high-value or high-risk
      shipments; FATF's TBML typology library identifies phantom shipment financing using
      forged documents as one of the three most common TBML mechanisms, and a control that
      verifies only document presentation rather than actual shipment does not address it.`,
    keywords: ['phantom shipment', 'TBML', 'FATF', 'letter of credit', 'AML', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-based-ml',
  },

  // ── AML Model Risk (SR 11-7 for TM Models) ────────────────────────────────
  {
    code: 'B831',
    name: 'Transaction Monitoring Model Not Registered in SR 11-7 Model Inventory',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description: `First Capital's primary transaction monitoring system — a rules-based plus
      ML-scored hybrid platform from a third-party vendor — has never been formally registered
      in the bank's SR 11-7 model inventory because the BSA compliance team classifies it as
      an "AML tool" rather than a "model," despite the ML scoring component meeting the
      Federal Reserve's SR 11-7 definition of a model as any quantitative method used to
      apply a transformation to input data and produce outputs that inform decisions. OCC
      examination findings at ten peer institutions in 2023–2024 cited failure to register
      vendor-supplied AML transaction monitoring platforms as a primary SR 11-7 deficiency;
      the consent order First Capital is currently remediating includes a specific finding
      on AML model inventory completeness.`,
    keywords: ['SR 11-7', 'model inventory', 'transaction monitoring', 'AML', 'OCC', 'BSA'],
    demoRelevant: true,
    subTopic: 'aml-model-risk',
  },
  {
    code: 'B832',
    name: 'False Positive Rate Optimization Creates SAR Under-Filing Risk',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description: `First Capital's AML technology team tuned the transaction monitoring system
      to reduce false positive alerts from 85% to 60% of total alert volume, but the tuning
      methodology optimized exclusively for alert volume reduction without testing whether
      the threshold changes affected the true positive rate — SAR conversion rate declined
      from 4.2% to 2.8% in the 90 days following the tuning, below the peer percentile
      benchmark that FinCEN uses as a program adequacy signal. SR 11-7 model performance
      monitoring requirements mandate that models used in compliance decisions be monitored
      for both efficiency (false positive rate) and efficacy (true positive rate / SAR
      conversion); a tuning that reduces analyst workload while also suppressing genuine
      suspicious activity detection violates the performance monitoring framework.`,
    keywords: ['false positive rate', 'SR 11-7', 'SAR', 'AML', 'FinCEN', 'OCC'],
    demoRelevant: true,
    subTopic: 'aml-model-risk',
  },
  {
    code: 'B833',
    name: 'AML ML Model Drift Not Measured Between Annual Validation Cycles',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description: `First Capital's ML transaction monitoring model undergoes full SR 11-7
      validation annually, but between validations the bank has no continuous drift
      monitoring — no automated alerts when the model's score distribution shifts,
      when population characteristics change, or when performance metrics fall outside
      the tolerance bands documented in the model validation report. SR 11-7 requires
      ongoing performance monitoring appropriate to the model's materiality and the
      rate of change in the underlying data environment; AML transaction patterns
      respond rapidly to macroeconomic shocks, cryptocurrency price cycles, and
      emerging typologies, meaning a 12-month validation cycle without interim drift
      monitoring is insufficient for a model deployed in a dynamic financial crime
      environment.`,
    keywords: ['AML model drift', 'SR 11-7', 'model monitoring', 'OCC', 'FinCEN', 'machine learning'],
    demoRelevant: true,
    subTopic: 'aml-model-risk',
  },
  {
    code: 'B834',
    name: 'AML Model Training Data Includes Biased Historical SAR Labels',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital's ML transaction monitoring model was trained on five years
      of historical SAR decisions as the ground-truth label, but the SAR decisions were
      made under a prior regime where certain customer segments — MSBs, cash-intensive
      small businesses, immigrant remittance senders — were systematically over-flagged
      relative to large commercial clients for reasons that reflected analyst bias rather
      than objective risk criteria. SR 11-7 model development standards require that
      training data be assessed for representativeness and that known biases in historical
      labels be documented and addressed; a model trained on biased SAR labels replicates
      and amplifies the original bias, creating both AML program effectiveness gaps and
      CFPB UDAAP disparate impact risk.`,
    keywords: ['biased training data', 'SR 11-7', 'AML', 'CFPB', 'machine learning', 'OCC'],
    demoRelevant: true,
    subTopic: 'aml-model-risk',
  },
  {
    code: 'B835',
    name: 'AML Model Challenger Framework Absent for Performance Benchmarking',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `First Capital operates a single AML transaction monitoring model in
      production without a challenger model framework to continuously benchmark
      performance — the bank has no mechanism to compare the incumbent model's
      detection efficacy against a challenger trained on more recent data or using
      a different algorithm architecture. SR 11-7 model risk governance best practice
      and OCC examiner guidance both recommend champion-challenger frameworks for
      high-materiality compliance models; without a challenger benchmark, the bank
      cannot quantify the performance cost of maintaining the incumbent model against
      alternatives, and model replacement decisions are driven by contract cycles rather
      than empirical performance comparisons.`,
    keywords: ['champion-challenger', 'SR 11-7', 'AML', 'model governance', 'OCC', 'FinCEN'],
    demoRelevant: false,
    subTopic: 'aml-model-risk',
  },
  {
    code: 'B836',
    name: 'Vendor Black-Box AML Model Prevents SR 11-7 Validation Completion',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description: `First Capital's independent model validation team attempted SR 11-7
      validation of the vendor-supplied AML scoring engine but could not complete the
      conceptual soundness review because the vendor declined to disclose model
      architecture, training data, or feature weights as proprietary information —
      the validation report documents this as a scope limitation but the model
      remains in production. SR 11-7 explicitly states that banks cannot rely on vendor
      claims of model quality in lieu of independent validation and that the vendor's
      refusal to provide methodology documentation is itself a model risk finding;
      OCC examiners reviewing the consent order remediation plan have flagged the
      incomplete validation as an unresolved MRM deficiency.`,
    keywords: ['vendor model', 'SR 11-7', 'AML', 'black-box', 'OCC', 'model validation'],
    demoRelevant: true,
    subTopic: 'aml-model-risk',
  },
  {
    code: 'B837',
    name: 'AML Scenario Efficacy Testing Not Conducted After Regulatory Guidance Updates',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `When FinCEN publishes updated advisory typologies — such as the 2022
      ransomware payment advisory or the 2023 fentanyl trafficking financial indicators
      advisory — First Capital does not conduct backtesting of its existing transaction
      monitoring scenarios against the newly described typologies to determine whether
      current scenarios would have detected them. SR 11-7 model testing standards require
      that models be tested against relevant use cases, including newly identified risk
      scenarios; a scenario library that is not backtested against current FinCEN
      advisory typologies provides no assurance that the bank's AML model would detect
      the financial crime patterns that FinCEN has currently identified as priorities.`,
    keywords: ['scenario backtesting', 'FinCEN', 'SR 11-7', 'AML', 'OCC', 'typology'],
    demoRelevant: false,
    subTopic: 'aml-model-risk',
  },

  // ── SAR Quality: Advanced ──────────────────────────────────────────────────
  {
    code: 'B838',
    name: 'SAR Narrative Quality Metrics Not Tracked in BSA Management Reporting',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital's BSA management reporting includes SAR filing volume,
      timeliness, and 90-day continuation rates, but does not track SAR narrative quality
      metrics — narrative completeness scores, percentage of narratives meeting FinCEN's
      five required elements (who, what, when, where, why), or law enforcement feedback
      received through FinCEN's BSA reporting portal. FinCEN's quality feedback mechanism
      allows requesting institutions to receive law enforcement utility ratings on filed SARs,
      but First Capital has not enrolled in this feedback program and has no data on
      whether its SAR narratives are generating actionable law enforcement intelligence;
      OCC examination guidance identifies SAR quality measurement as a program maturity
      indicator.`,
    keywords: ['SAR quality metrics', 'FinCEN', 'BSA', 'OCC', 'AML', 'law enforcement'],
    demoRelevant: true,
    subTopic: 'sar-quality',
  },
  {
    code: 'B839',
    name: 'FinCEN SAR Feedback Not Incorporated Into Analyst Training Program',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital occasionally receives informal feedback from law enforcement
      contacts and FinCEN examination staff on the quality of its SAR filings, but this
      feedback is not systematically captured, analyzed, or incorporated into the BSA
      analyst training curriculum — analyst training modules were last updated in 2022
      and do not reflect FinCEN's more recent guidance on narrative structure, suspect
      identification fields, and typology-specific language requirements. FinCEN's best
      practice guidance on AML program effectiveness recommends establishing a feedback
      loop between law enforcement utility assessments and analyst training; a program
      where feedback is received but not institutionalized cannot continuously improve
      SAR quality or respond to evolving law enforcement intelligence needs.`,
    keywords: ['FinCEN feedback', 'SAR training', 'AML', 'BSA', 'OCC', 'CAMS'],
    demoRelevant: false,
    subTopic: 'sar-quality',
  },
  {
    code: 'B840',
    name: 'SAR Filing Decision Documentation Not Retained for OCC Examination Review',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's case management system retains closed SAR alerts but
      does not preserve the analyst's contemporaneous decision documentation — the
      specific articulable facts considered, the typology matched, and the supervisor
      concurrence rationale — in a format that can be produced to OCC examiners during
      examination. FinCEN and OCC both require that institutions be able to demonstrate
      the basis for SAR filing decisions, including decisions not to file; a system
      that stores only the final SAR document without the investigative decision record
      cannot satisfy the documentation standard and creates a gap in the bank's
      ability to defend its SAR program methodology during examination.`,
    keywords: ['SAR documentation', 'FinCEN', 'OCC', 'BSA', 'AML', 'case management'],
    demoRelevant: true,
    subTopic: 'sar-quality',
  },
  {
    code: 'B841',
    name: 'Law Enforcement Utility Gap From Omitted Prior SAR Filing History in Narratives',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description: `First Capital's SAR analysts compose narratives without querying prior
      SAR filings on the same subject — FinCEN's SAR guidance requires that continuation
      and follow-on SARs reference prior filing dates and BSA identifier numbers to allow
      law enforcement to link related filings into a complete suspicious activity picture.
      The case management system does not surface prior SAR filings for the same customer
      or related entities during the alert investigation workflow, meaning analysts compose
      narratives that describe only the current alert period without contextualizing prior
      filing history; this results in law enforcement receiving fragmented intelligence
      that cannot be assembled into a longitudinal view of the subject's activity.`,
    keywords: ['SAR narrative', 'prior filings', 'FinCEN', 'AML', 'BSA', 'OCC'],
    demoRelevant: false,
    subTopic: 'sar-quality',
  },

  // ── CDD Advanced: UBO, PEP, Correspondent, Shell Companies ───────────────
  {
    code: 'B842',
    name: 'Ultimate Beneficial Ownership Verification Not Conducted Beyond First Layer',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description: `First Capital's CDD Rule implementation under 31 CFR 1010.230 collects
      beneficial ownership information for legal entities at the first layer of ownership,
      but does not look through intermediate holding companies to identify the ultimate
      beneficial owner when ownership chains have three or more tiers — a bank that holds
      25% of a US LLC which owns 60% of a Cayman shell which owns 100% of the account
      entity would pass First Capital's CDD process without the bank knowing the natural
      person who ultimately controls the relationship. FinCEN's 2016 CDD Rule preamble
      and OCC examination guidance both require that beneficial ownership determination
      pursue the ownership chain to natural persons, not stop at the first layer of
      corporate ownership; single-layer CDD is a documented rule implementation gap.`,
    keywords: ['beneficial ownership', 'CDD Rule', 'FinCEN', 'AML', 'OCC', 'KYC'],
    demoRelevant: true,
    subTopic: 'cdd-advanced',
  },
  {
    code: 'B843',
    name: 'Nested Shell Company Structure Detection Not Integrated Into Onboarding Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `First Capital's commercial customer onboarding workflow does not include a
      systematic check for nested shell company structures — entities that are themselves
      shell companies owned by other shell companies through multiple jurisdictions — beyond
      reviewing the documents submitted by the customer. FinCEN's 2022 rulemaking on
      beneficial ownership in the Corporate Transparency Act context and OCC examination
      guidance on CDD both require that institutions identify and document nested structures
      rather than accept customer-provided organizational charts at face value; the absence
      of a database-driven ownership structure check for corporate customers creates
      a CDD gap that is exploited by money launderers using complex multi-tier structures
      specifically to exhaust manual investigation capacity.`,
    keywords: ['nested shell company', 'CDD Rule', 'FinCEN', 'AML', 'OCC', 'beneficial ownership'],
    demoRelevant: false,
    subTopic: 'cdd-advanced',
  },
  {
    code: 'B844',
    name: 'PEP Screening Program Does Not Cover Domestic PEPs or Family Members',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `First Capital's PEP screening program focuses on foreign politically exposed
      persons as defined in USA PATRIOT Act Section 312, but does not systematically screen
      for domestic PEPs — senior U.S. federal and state officials, elected representatives,
      and senior executives of state-owned enterprises — or for the immediate family members
      and close associates of PEPs, as required by FATF Recommendation 12. FinCEN's
      guidance and OCC examination practice both follow FATF's expanded PEP definition;
      a PEP program that screens only for foreign officials and omits domestic PEPs and
      PEP family members is under-scoped relative to the risk-based approach required
      by the BSA, and creates blind spots for domestic political corruption and
      state-level bribery schemes.`,
    keywords: ['PEP screening', 'FATF R.12', 'FinCEN', 'AML', 'OCC', 'CDD'],
    demoRelevant: true,
    subTopic: 'cdd-advanced',
  },
  {
    code: 'B845',
    name: 'Correspondent Banking EDD Refreshed Annually Rather Than Event-Driven',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description: `First Capital performs enhanced due diligence on foreign correspondent
      bank accounts on a fixed annual cycle, but does not trigger EDD refresh when material
      risk events occur between annual reviews — regulatory actions against the correspondent
      in its home jurisdiction, FATF gray-listing of the correspondent's country, or public
      reporting of money laundering allegations against the respondent bank. USA PATRIOT Act
      Section 312 and OCC examination guidance both require that EDD be updated promptly when
      material changes in correspondent risk occur; an annual-only EDD refresh cycle means
      a correspondent bank that became high-risk in February may not receive updated EDD
      until the following December, an 11-month window during which the risk goes unaddressed.`,
    keywords: ['correspondent banking EDD', 'USA PATRIOT Act', 'FATF', 'AML', 'OCC', 'BSA'],
    demoRelevant: false,
    subTopic: 'cdd-advanced',
  },
  {
    code: 'B846',
    name: 'Corporate Transparency Act Data Not Integrated Into CDD Verification Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `FinCEN's beneficial ownership reporting database under the Corporate
      Transparency Act (CTA), which became operative January 1, 2024, provides a searchable
      registry of beneficial ownership information for covered U.S. companies — First Capital
      has not integrated access to the FinCEN BOI database into its customer onboarding or
      periodic CDD review workflow, missing an opportunity to cross-reference customer-provided
      ownership information against the regulatory database. OCC examination guidance
      updated in 2024 expects that institutions leverage the CTA registry as a CDD verification
      tool where available; a bank that continues to rely solely on customer-submitted
      ownership documentation after the CTA database became available is not employing
      a current risk-based approach to beneficial ownership verification.`,
    keywords: ['Corporate Transparency Act', 'FinCEN BOI', 'CDD Rule', 'AML', 'OCC', 'KYC'],
    demoRelevant: true,
    subTopic: 'cdd-advanced',
  },
  {
    code: 'B847',
    name: 'PEP Risk Rating Not Escalated to BSA Officer Before Account Approval',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description: `When First Capital's onboarding screening identifies a customer as a PEP,
      the case is flagged for enhanced due diligence but the account opening decision is
      made by the relationship manager following standard commercial approval — there is
      no required BSA Officer or senior compliance sign-off before a PEP account is opened.
      FinCEN guidance and FATF Recommendation 12 both require senior management approval for
      PEP relationships and ongoing senior oversight of PEP accounts; a process that allows
      PEP accounts to be opened without BSA Officer approval violates the governance
      requirements for PEP programs and creates a documented BSA program gap that OCC
      examiners specifically test through PEP account sample reviews.`,
    keywords: ['PEP approval', 'FATF R.12', 'FinCEN', 'AML', 'OCC', 'BSA Officer'],
    demoRelevant: true,
    subTopic: 'cdd-advanced',
  },
  {
    code: 'B848',
    name: 'Beneficial Ownership Refresh Not Triggered by Business Ownership Change Events',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital's CDD Rule program requires beneficial ownership collection
      at account opening and periodic re-certification on a 24-month cycle, but does not
      trigger a beneficial ownership refresh when customers experience ownership changes
      mid-cycle — corporate acquisitions, PE fund exits, management buyouts, or death
      of an owner — unless the customer self-reports. FinCEN's CDD Rule requires that
      institutions maintain accurate and current beneficial ownership information; a
      24-month refresh cycle without event-driven triggers for known ownership changes
      means the bank's ownership records are systematically stale for customers that
      undergo significant structural changes between scheduled reviews.`,
    keywords: ['beneficial ownership refresh', 'CDD Rule', 'FinCEN', 'AML', 'OCC', 'KYC'],
    demoRelevant: false,
    subTopic: 'cdd-advanced',
  },

  // ── AI-AML: Explicit 2025–2026 AI Insertion Failure Patterns ──────────────
  {
    code: 'B849',
    name: 'LLM-Assisted SAR Narrative Generation Without Compliance Review Certification',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description: `First Capital's AML operations team deployed a generative AI assistant
      that drafts complete SAR narratives from case data — account numbers, transaction
      descriptions, alert reasons — and analysts submit LLM-generated narratives with
      minimal review, effectively bypassing the CAMS-certified analyst narrative review
      step that FinCEN's SAR guidance requires. FinCEN's SAR filing certification
      requires the BSA Officer to attest that the narrative accurately and completely
      represents the suspicious activity; an LLM-generated narrative that has not received
      substantive human review and subject-matter attestation does not satisfy the
      certification standard, and SR 11-7 model governance requires that any AI tool
      influencing a compliance filing decision be inventoried and validated.`,
    keywords: ['LLM SAR generation', 'FinCEN', 'SR 11-7', 'AML', 'OCC', 'CAMS'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B850',
    name: 'AI Transaction Monitoring Platform Not Registered in SR 11-7 Model Inventory',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description: `First Capital procured an AI-driven transaction monitoring platform as a
      SaaS subscription through the technology budget, bypassing the bank's model risk
      management onboarding workflow — the platform is in production producing compliance
      alerts that drive SAR decisions, but it has never been registered in the SR 11-7
      model inventory or subjected to independent model validation. OCC model risk guidance
      explicitly states that vendor-supplied quantitative tools that produce outputs
      influencing compliance decisions are models subject to SR 11-7 regardless of
      procurement channel; a platform that determines which customer activity receives
      SAR investigation is among the highest-materiality compliance models in the bank's
      portfolio and its absence from the inventory is a consent order remediation gap.`,
    keywords: ['AI TM platform', 'SR 11-7', 'model inventory', 'AML', 'OCC', 'BSA'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B851',
    name: 'GenAI KYC Due Diligence Summaries Used Without Legal Hold Verification',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description: `First Capital's commercial banking onboarding team uses a generative
      AI tool to compile KYC due diligence summaries from publicly available sources
      — corporate registry filings, news articles, regulatory databases — but the
      summaries are used in account opening decisions without verifying that the
      underlying sources are current, legally permissible to rely upon, or free of
      AI hallucination artifacts. CDD Rule compliance under 31 CFR 1010.230 requires
      that customer identification and due diligence be based on reliable information;
      a GenAI summary tool that may hallucinate citations or surface stale regulatory
      actions does not satisfy the reliability standard, and the bank has no legal
      hold verification process to confirm that GenAI-sourced factual claims are
      accurate before they are used in compliance decisions.`,
    keywords: ['GenAI KYC', 'CDD Rule', 'FinCEN', 'AML', 'OCC', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B852',
    name: 'AI Sanctions Screening Blackbox Without Examiner-Explainable Match Logic',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: `First Capital's AI sanctions screening model uses neural name-matching
      embeddings that produce match scores without any human-readable explanation of
      why a particular name combination produced a hit — when OCC examiners ask why
      a specific transaction was screened as a potential OFAC match, the bank cannot
      explain the model's reasoning beyond pointing to a numeric similarity score.
      OFAC guidance requires that institutions implement sanctions screening that is
      sufficiently rigorous to avoid violations and that the institution be able to
      demonstrate the adequacy of its screening program; an explainability gap that
      prevents the bank from explaining to examiners how its screening logic works
      fails this accountability standard and violates SR 11-7 requirements for
      model use documentation in compliance applications.`,
    keywords: ['AI sanctions screening', 'OFAC', 'SR 11-7', 'explainability', 'AML', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B853',
    name: 'ML AML Model Trained on Biased Historical SAR Labels Without SR 11-7 Remediation',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital's ML transaction monitoring model was trained using historical
      analyst SAR filing decisions as ground-truth labels, but model development documentation
      does not address the known systematic over-representation of minority-owned small businesses
      and immigrant remittance customers in historical SAR filings — the biased labels were
      carried forward into the ML model without the bias assessment and remediation that
      SR 11-7 requires for training data with known quality limitations. The CFPB and
      OCC have both issued guidance warning that ML compliance models trained on biased
      historical decisions perpetuate and amplify the underlying bias; the absence of
      bias documentation and remediation in the model development record is an SR 11-7
      model governance gap that OCC examiners are testing in ML AML model validations.`,
    keywords: ['ML bias', 'SR 11-7', 'AML', 'CFPB', 'FinCEN', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B854',
    name: 'AI AML Graph Network Expansion Without Documented Evidence-Quality Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital deployed an AML graph AI platform that constructs customer
      risk networks by linking accounts sharing common behavioral attributes — device
      fingerprints, IP addresses, payment counterparties — but the platform has no
      documented minimum evidence-quality threshold that distinguishes meaningful
      associative links from coincidental attribute sharing at a public Wi-Fi location
      or shared residential address. SR 11-7 model documentation requires that model
      assumptions, boundaries, and output interpretation guidance be documented for
      all compliance models; an AML graph AI system without evidence quality thresholds
      generates investigation queues that flood analyst capacity with weak links and
      creates CFPB disparate impact risk when shared-attribute features correlate with
      protected customer demographics.`,
    keywords: ['AML graph AI', 'SR 11-7', 'FinCEN', 'AML', 'CFPB', 'network analysis'],
    demoRelevant: false,
    subTopic: 'ai-aml',
  },
  {
    code: 'B855',
    name: 'AI STR Narrative Auto-Generation Deployed Without FinCEN Guidance Compliance Review',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `First Capital's AML team deployed an AI tool that auto-generates suspicious
      transaction report (STR) narrative drafts and submits them to FinCEN's BSA E-Filing
      system with analyst approval reduced to a single-click confirmation rather than a
      substantive review — FinCEN has not issued guidance on AI-assisted STR/SAR filing
      and the bank's compliance team did not consult FinCEN or OCC before deploying a
      production STR workflow where AI generates the filing content. The absence of
      regulatory pre-clearance or formal legal opinion on whether AI-generated SAR
      content satisfies the BSA certification requirements exposes the bank to exam
      findings when OCC examiners review the single-click approval workflow and
      determine that the BSA Officer certification lacks substantive human review.`,
    keywords: ['AI STR generation', 'FinCEN', 'SAR', 'AML', 'BSA', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B856',
    name: 'Vendor AI AML Model Update Deployed Without SR 11-7 Re-Validation Trigger',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description: `First Capital's vendor-supplied AI AML platform released four algorithm
      updates in the prior 12 months under the guise of "system enhancements" — each update
      materially changed the model's alert scoring logic — but none of the updates triggered
      the bank's SR 11-7 model change management process because the contract classifies
      algorithm updates as routine maintenance rather than material model changes requiring
      re-validation. SR 11-7 requires that material model changes, including those made
      by a vendor to a bank's production model, trigger the bank's change control and
      re-validation process; OCC examination teams reviewing First Capital's model change
      log identified this gap as a systemic failure to maintain SR 11-7 compliance
      over the model's operational lifecycle.`,
    keywords: ['vendor model update', 'SR 11-7', 'AML', 'OCC', 'model change management', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B857',
    name: 'AI KYC Due Diligence Without SR 11-7 Model Inventory Registration',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description: `First Capital's digital onboarding channel uses an AI-powered identity
      verification and KYC due diligence tool that scores customer risk and recommends
      enhanced or standard CDD treatment — but the tool has never been registered in
      the bank's SR 11-7 model inventory because the compliance technology team classified
      it as an "onboarding tool" rather than a "model." Under SR 11-7, a quantitative
      tool that applies statistical or AI methods to customer data to produce a risk-based
      CDD recommendation is a model regardless of how it is commercially labeled;
      the tool's absence from the model inventory means it has never received SR 11-7
      validation, ongoing performance monitoring is not in place, and the bank cannot
      demonstrate compliance with OCC model risk governance expectations for AI tools
      used in regulatory compliance workflows.`,
    keywords: ['AI KYC tool', 'SR 11-7', 'CDD Rule', 'FinCEN', 'OCC', 'model inventory'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B858',
    name: 'Generative AI Alert Disposition Rationale Not Auditable for OCC Examination',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `First Capital's AML analysts use a generative AI copilot that suggests
      alert disposition rationales — "close as non-suspicious: customer profile consistent
      with stated business purpose" — based on case data, and analysts accept the
      AI-suggested rationale with minimal modification, resulting in case files where
      the analyst's documented reasoning is AI-generated text that does not reflect
      the analyst's own independent assessment. FinCEN and OCC require that alert
      disposition decisions reflect genuine analyst judgment with documented articulable
      facts; AI-generated rationale text accepted without substantive human modification
      fails to satisfy the independent analyst judgment requirement and creates a BSA
      program quality deficiency visible in OCC examination case file reviews.`,
    keywords: ['AI alert disposition', 'FinCEN', 'AML', 'OCC', 'BSA', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B859',
    name: 'AI Adverse Action AML Account Closure Without CFPB UDAAP Disparate Impact Review',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital's AI AML risk scoring model triggers automated account
      closure recommendations for commercial customers whose risk scores exceed a
      defined threshold — but the model outputs are used to initiate closures without
      a CFPB UDAAP disparate impact analysis confirming that the AI-driven closure
      recommendations do not disproportionately target customers in protected class
      segments. OCC and CFPB guidance on algorithmic decision-making requires that
      AI tools used in adverse customer actions be evaluated for fair banking compliance
      before deployment and periodically thereafter; an AI closure recommendation
      engine operating without disparate impact review violates SR 11-7 model governance
      requirements and creates CFPB examination risk that the bank has not yet
      addressed in its consent order remediation plan.`,
    keywords: ['AI account closure', 'CFPB UDAAP', 'SR 11-7', 'AML', 'OCC', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B860',
    name: 'AI VASP Risk Scoring Tool Deployed Without FinCEN Regulatory Scope Confirmation',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital deployed a third-party AI platform that scores VASP customer
      risk using on-chain behavioral analytics and assigns EDD tier ratings, but the bank
      did not obtain a legal opinion or FinCEN informal guidance confirming that the
      tool's methodology satisfies the enhanced due diligence requirements of USA PATRIOT
      Act Section 312 for foreign financial institution accounts. FinCEN's 2019 and 2020
      guidance on virtual currency emphasizes that EDD for VASP customers must address
      the VASP's own AML controls, Travel Rule compliance, and regulatory registration —
      an AI scoring tool that evaluates on-chain behavior but does not assess the VASP's
      compliance program may produce scores that pass the technology review but fail the
      regulatory standard for Section 312 EDD adequacy.`,
    keywords: ['AI VASP scoring', 'FinCEN', 'USA PATRIOT Act', 'AML', 'OCC', 'VASP EDD'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },
  {
    code: 'B861',
    name: 'LLM Hallucination in AI KYC Summary Produces False Negative PEP Match',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description: `First Capital's generative AI KYC summarization tool compiled a due
      diligence report for a new commercial customer that incorrectly stated the customer
      had "no adverse regulatory history in any jurisdiction" — an LLM hallucination that
      omitted a documented regulatory sanction from the EU jurisdiction — resulting in
      the customer receiving standard CDD treatment rather than the PEP-enhanced due
      diligence that would have been triggered by accurate information. CDD Rule compliance
      requires that customer identification be based on reliable information; an LLM tool
      that produces false negative adverse media findings is inherently unreliable for
      PEP and adverse media screening, and deploying such a tool without hallucination
      detection controls and mandatory human adversarial review of negative findings
      is an AML program design failure.`,
    keywords: ['LLM hallucination', 'KYC', 'CDD Rule', 'FinCEN', 'AML', 'OCC'],
    demoRelevant: false,
    subTopic: 'ai-aml',
  },
  {
    code: 'B862',
    name: 'AI-Powered Alert Prioritization Changes SAR Rate Without SR 11-7 Performance Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `First Capital deployed an AI alert prioritization model that reranks
      transaction monitoring alerts by predicted SAR conversion probability, and since
      deployment analysts have focused on high-priority alerts while low-priority alerts
      age unreviewed — the overall alert queue review completion rate improved from 78%
      to 94%, but SAR filing volume declined by 28% without a documented analysis of
      whether the AI prioritization is suppressing legitimate SAR-worthy activity. SR
      11-7 requires ongoing performance monitoring for compliance models and mandates
      that model performance be assessed against the model's intended use — the intended
      use of AML transaction monitoring is to detect suspicious activity, not to
      minimize analyst workload; a model that increases efficiency while reducing
      detection must be evaluated for the tradeoff between the two objectives.`,
    keywords: ['AI alert prioritization', 'SR 11-7', 'SAR', 'AML', 'OCC', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },

  // ── Additional CDD Advanced ────────────────────────────────────────────────
  {
    code: 'B863',
    name: 'Correspondent Bank Payable-Through Account EDD Not Conducted Separately From Account EDD',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital has three foreign correspondent banking relationships where
      the respondent bank offers payable-through account services to its own customers —
      effectively making those third-party customers sub-accountholders of First Capital's
      correspondent account — but the bank treats the PTA arrangement as a single
      correspondent relationship and does not perform separate EDD on the respondent's
      PTA customer base. USA PATRIOT Act Section 312 requires specific enhanced due
      diligence for payable-through accounts because they extend the bank's BSA obligations
      to indirect sub-accountholders; failure to address PTA sub-accountholders in the
      EDD assessment is a documented Section 312 compliance gap that OCC examination
      teams test specifically in correspondent banking reviews.`,
    keywords: ['payable-through account', 'USA PATRIOT Act', 'correspondent banking', 'AML', 'OCC', 'EDD'],
    demoRelevant: false,
    subTopic: 'cdd-advanced',
  },
  {
    code: 'B864',
    name: 'High-Risk Customer CDD Periodic Review Queue 18 Months Behind Schedule',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description: `First Capital's risk-based CDD program requires that high-risk commercial
      customers receive a full CDD periodic review every 12 months, but the AML operations
      team's case queue for high-risk customer reviews is 18 months behind schedule —
      the backlog grew during a system migration that reduced CDD workflow efficiency,
      and staffing has not been increased to address the backlog. FinCEN's CDD Rule requires
      ongoing customer due diligence that keeps information current and accurate; OCC
      examination findings at peer institutions have cited periodic review backlogs exceeding
      six months as a systemic CDD Rule compliance failure, and a backlog of 18 months
      for the highest-risk customer segment is among the most serious CDD program
      deficiencies an institution can present to examiners.`,
    keywords: ['CDD periodic review', 'CDD Rule', 'FinCEN', 'AML', 'OCC', 'KYC'],
    demoRelevant: true,
    subTopic: 'cdd-advanced',
  },
  {
    code: 'B865',
    name: 'Trust Account Beneficial Owner Verification Limited to Trustee Only',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `When First Capital onboards trust accounts, CDD verification is conducted
      on the trustee only — the named manager and signatory authority of the trust — without
      identifying or verifying the identity of the trust's grantors and beneficiaries who
      are the ultimate beneficial owners of the trust assets. FinCEN's CDD Rule and its
      2016 FAQs on beneficial ownership explicitly address trust accounts and require
      that the bank identify the beneficial owners of trust assets, including grantors
      and beneficiaries with more than 25% beneficial interest; a CDD process that
      treats the trustee as the only relevant party in a trust account relationship
      misses the ownership verification requirement and creates a gap that is
      exploitable by trusts established specifically to obscure beneficial ownership.`,
    keywords: ['trust account', 'CDD Rule', 'FinCEN', 'AML', 'OCC', 'beneficial ownership'],
    demoRelevant: false,
    subTopic: 'cdd-advanced',
  },

  // ── Additional Crypto AML ─────────────────────────────────────────────────
  {
    code: 'B866',
    name: 'Stablecoin Issuer Customer Risk Classification Absent From AML Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital provides treasury management services to a stablecoin issuer
      whose core business involves maintaining reserve assets in the bank and issuing
      redeemable stablecoin tokens to retail and institutional customers globally — the bank
      treats this customer as a standard financial services corporate account without
      recognizing that the stablecoin issuer functions as a de facto money transmitter
      and is subject to FinCEN registration requirements and VASP-equivalent EDD. FinCEN's
      2019 and 2020 CVC guidance covers stablecoin issuers as money transmitters under
      the BSA; the bank's failure to classify its stablecoin issuer customer as a
      VASP-equivalent entity means the account has never received the VASP EDD that
      FinCEN and OCC examination guidance require.`,
    keywords: ['stablecoin issuer', 'FinCEN', 'VASP', 'AML', 'OCC', 'CVC Rule'],
    demoRelevant: false,
    subTopic: 'crypto-aml',
  },
  {
    code: 'B867',
    name: 'Crypto Ransomware Payment Facilitation Risk Not Addressed in BSA Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `First Capital processes wire transfers for several cybersecurity incident
      response firms that on occasion facilitate ransom payments in cryptocurrency on behalf
      of corporate victims, but the bank's BSA risk assessment does not address this
      customer segment or the associated ransomware payment facilitation risk — FinCEN's
      2020 and 2021 advisories on ransomware note that financial institutions facilitating
      ransomware payments may be providing financial services to SDN-designated ransomware
      groups and must apply OFAC compliance and SAR filing obligations to these transactions.
      An AML risk assessment that does not identify incident response firms as potentially
      high-risk crypto-adjacent customers creates a systematic monitoring gap for one of
      FinCEN's designated national AML priorities.`,
    keywords: ['ransomware payment', 'FinCEN', 'OFAC', 'AML', 'BSA', 'OCC'],
    demoRelevant: false,
    subTopic: 'crypto-aml',
  },

  // ── Additional AML Model Risk ──────────────────────────────────────────────
  {
    code: 'B868',
    name: 'Third-Party AML Model Performance Review Delegated to Vendor Without Bank Oversight',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `First Capital's contract with its primary AML technology vendor delegates
      ongoing model performance monitoring to the vendor — the vendor reports quarterly
      on false positive rates and model accuracy, but the bank's own model risk function
      does not independently validate or challenge the vendor's performance metrics using
      the bank's own SAR outcomes, alert disposition records, or examination findings.
      SR 11-7 is unambiguous that the bank's MRM function retains responsibility for
      model performance monitoring regardless of whether the model is vendor-supplied;
      delegating performance monitoring to the same vendor that built the model and benefits
      from renewal creates a conflict of interest that OCC examination teams characterize
      as a systemic SR 11-7 governance failure.`,
    keywords: ['vendor model monitoring', 'SR 11-7', 'AML', 'OCC', 'MRM', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'aml-model-risk',
  },
  {
    code: 'B869',
    name: 'AML Segmentation Model Uses Outdated Customer Typology Definitions',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's transaction monitoring system applies alert thresholds
      based on customer segments — retail, small business, commercial, MSB — that were
      defined in 2020 and have not been updated to reflect the bank's current product
      mix, which now includes digital-first commercial accounts with significantly
      different transaction patterns from the 2020 commercial segment definition. SR 11-7
      requires that model inputs and segmentation frameworks be reviewed for continued
      applicability to current business conditions; a segmentation model whose customer
      categories no longer accurately reflect the bank's current portfolio creates
      threshold mis-calibration that produces both false positives in some segments
      and detection gaps in others.`,
    keywords: ['AML segmentation', 'SR 11-7', 'transaction monitoring', 'FinCEN', 'AML', 'OCC'],
    demoRelevant: false,
    subTopic: 'aml-model-risk',
  },

  // ── Additional SAR Quality ─────────────────────────────────────────────────
  {
    code: 'B870',
    name: 'SAR 30-Day Filing Deadline Missed for High-Risk Cyber-Enabled Transactions',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description: `FinCEN requires that SARs be filed within 30 calendar days of initial
      detection of a suspicious transaction, or within 60 days if the suspect cannot
      initially be identified — First Capital's AML operations data shows that 18% of
      SARs filed in the prior year were submitted after the applicable deadline, primarily
      because cyber-enabled financial crime alerts involving BEC proceeds and account
      takeovers were routed through a separate fraud operations queue that operates outside
      the standard 30-day SAR filing workflow. OCC examination findings identify systematic
      SAR deadline failures as a BSA program deficiency requiring immediate remediation;
      the structural routing of cyber-enabled financial crime through a non-AML queue
      is the root cause of the filing delay pattern.`,
    keywords: ['SAR deadline', 'FinCEN', 'BSA', 'OCC', 'AML', 'cyber-enabled financial crime'],
    demoRelevant: true,
    subTopic: 'sar-quality',
  },
  {
    code: 'B871',
    name: 'Joint SAR Filing Coordination With Other Institutions Not Documented',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `FinCEN permits and encourages joint SAR filing by multiple financial
      institutions that have each identified the same suspicious activity involving a
      shared customer, but First Capital does not have a documented policy or workflow
      for coordinating joint SARs with correspondent bank partners or with other banks
      identified through FinCEN 314(b) information sharing. The absence of a joint SAR
      filing process means that complex financial crime schemes involving multiple
      institutions are documented in fragmented individual SARs rather than a unified
      joint SAR that provides law enforcement with a consolidated view of the activity;
      FinCEN has highlighted joint SAR utilization as an underused tool for improving
      the intelligence utility of BSA filings.`,
    keywords: ['joint SAR', 'FinCEN 314(b)', 'AML', 'BSA', 'OCC', 'FinCEN'],
    demoRelevant: false,
    subTopic: 'sar-quality',
  },

  // ── Additional TBML ───────────────────────────────────────────────────────
  {
    code: 'B872',
    name: 'Free Trade Zone Transaction Risk Not Reflected in Commercial Banking Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital finances import/export transactions routed through free trade
      zones in Dubai, Panama, and Singapore — jurisdictions FATF has identified as high-risk
      for TBML due to limited customs oversight, commingled goods, and re-export documentation
      opacity — but the bank's AML risk assessment does not identify FTZ-routed transactions
      as a distinct risk category requiring enhanced monitoring. FATF's 2010 and 2020 TBML
      reports specifically identify free trade zones as primary TBML venues, and FinCEN's
      TBML advisory notes that FTZ transactions require heightened scrutiny because the
      reduced customs documentation in FTZs makes price and quantity verification more
      difficult for AML purposes.`,
    keywords: ['free trade zone', 'TBML', 'FATF', 'FinCEN', 'AML', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-based-ml',
  },
  {
    code: 'B873',
    name: 'Intercompany Trade Finance Between Related Entities Not Subject to TBML Controls',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: `First Capital provides trade finance facilities for transactions between
      a commercial customer and its overseas subsidiary — intercompany transactions — but
      applies the same LC documentation standards as arm's-length trade, without enhanced
      scrutiny for the TBML risk that intercompany transactions pose when transfer pricing
      is not at fair market value. FATF's TBML guidance notes that related-party transactions
      are particularly susceptible to over- and under-invoicing because pricing can be
      manipulated without arm's-length commercial pressure; the bank's trade finance
      underwriting policy does not distinguish between third-party and intercompany
      transactions for AML purposes, creating a TBML control gap for a high-risk
      transaction category.`,
    keywords: ['intercompany TBML', 'FATF', 'AML', 'FinCEN', 'trade finance', 'OCC'],
    demoRelevant: false,
    subTopic: 'trade-based-ml',
  },

  // ── Additional AI AML ─────────────────────────────────────────────────────
  {
    code: 'B874',
    name: 'AI Name Matching Model Not Tested Against Transliterated and Alias Name Variations',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `First Capital's AI-powered name-screening model for sanctions and PEP
      screening was tested on English-language name variations during deployment, but
      was not tested for accuracy on transliterated names from Arabic, Cyrillic, and
      Chinese scripts — the primary scripts in which SDN-designated entities and
      PEPs appear in FinCEN and OFAC databases. OFAC guidance on sanctions compliance
      programs identifies transliteration inconsistency as a major source of screening
      failures; SR 11-7 model testing requirements mandate that the model be tested
      against the full range of inputs it will encounter in production, including
      transliterated and phonetically similar name variants; the absence of
      transliteration testing is a documented AI model validation gap with direct
      OFAC exposure.`,
    keywords: ['AI name matching', 'OFAC', 'SR 11-7', 'AML', 'OCC', 'transliteration'],
    demoRelevant: false,
    subTopic: 'ai-aml',
  },
  {
    code: 'B875',
    name: 'AI AML Customer Risk Score Used in Underwriting Without SR 11-7 Credit Model Review',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital's commercial lending team uses the AML AI risk score assigned
      to a customer by the transaction monitoring platform as one input in commercial loan
      underwriting credit decisions — effectively using an AML compliance model as a
      credit risk input — but this use of the AML model in underwriting has not been
      reviewed under SR 11-7 as a credit model application, nor has CFPB fair lending
      compliance been assessed for the use of AML-derived scores in credit decisions.
      SR 11-7 requires that each use of a model be scoped in the model inventory and
      validated for that specific application; a model validated for AML alert generation
      that is also used for credit underwriting without a separate validation for the
      underwriting application is operating outside its validated scope.`,
    keywords: ['AML risk score', 'SR 11-7', 'credit underwriting', 'CFPB', 'OCC', 'AML'],
    demoRelevant: true,
    subTopic: 'ai-aml',
  },

  // ── Program Governance ────────────────────────────────────────────────────
  {
    code: 'B876',
    name: 'AML Independent Testing Scope Excludes VASP and Crypto Customer Portfolio',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's annual BSA independent testing program — conducted by
      internal audit — does not include the bank's VASP and crypto-business customer
      portfolio as an in-scope testing area; the VASP portfolio was added to the
      commercial banking book 24 months ago but has not yet been incorporated into
      the independent testing scope. FinCEN's BSA program requirements under 31 U.S.C.
      5318(h) mandate independent testing of all aspects of the AML program; OCC
      examination guidance requires that independent testing be comprehensive across
      all business lines and product types; a testing program that excludes a growing
      high-risk customer segment for two consecutive years fails both requirements.`,
    keywords: ['BSA independent testing', 'VASP', 'FinCEN', 'AML', 'OCC', 'internal audit'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B877',
    name: 'AML Training Program Not Updated for FinCEN 2022–2024 National Priority Typologies',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital's BSA/AML training curriculum for front-line bankers and
      operations staff has not been updated since 2022 and does not cover the typologies
      designated as national AML priorities by FinCEN in its 2022–2024 publications —
      ransomware payment facilitation, fentanyl trafficking proceeds, human trafficking
      financial indicators, and cyber-enabled financial crime patterns. FinCEN's national
      AML priorities require that BSA training programs be updated to ensure that personnel
      can identify the priority typologies in their day-to-day work; OCC examination teams
      have cited training curriculum that lags FinCEN priority publications as a BSA
      program deficiency at similarly situated institutions.`,
    keywords: ['AML training', 'FinCEN priorities', 'BSA', 'OCC', 'AML', 'typology'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B878',
    name: 'BSA Risk Assessment Not Updated Following Significant New Business Line Launch',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: `First Capital launched a digital commercial banking platform for
      marketplace lenders and payment companies 18 months ago, significantly changing
      the bank's customer risk profile, but has not conducted a formal update to its
      enterprise BSA/AML risk assessment to reflect the new business line's customer
      characteristics, transaction patterns, or elevated AML risk. OCC examination
      guidance requires that the BSA risk assessment be updated whenever significant
      changes in products, services, customers, or geographies alter the bank's
      overall risk profile; operating an AML program calibrated to a risk profile
      that does not reflect a significant new business segment means monitoring
      scenarios, thresholds, and staffing levels are systematically under-calibrated
      for the new risk exposure.`,
    keywords: ['BSA risk assessment', 'FinCEN', 'OCC', 'AML', 'BSA', 'program governance'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B879',
    name: 'AML Program Gap Remediation Tracked in Spreadsheets Without Audit Trail',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital tracks consent order and examination finding remediation
      for its AML program in a shared spreadsheet maintained by the BSA compliance
      team — issue descriptions, responsible owners, target dates, and status updates
      are managed in Excel without version control, automated escalation, or an audit
      trail that demonstrates the sequence of actions taken to address each finding.
      OCC examination guidance and consent order remediation standards require that
      remediation tracking provide a documentable evidence trail demonstrating progress
      and completion; a spreadsheet-based tracking system without audit trail controls
      cannot satisfy this standard, and OCC remediation verifiers frequently reject
      spreadsheet documentation as insufficient evidence of sustained compliance with
      program governance requirements.`,
    keywords: ['AML remediation tracking', 'OCC', 'consent order', 'BSA', 'program governance', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
];
