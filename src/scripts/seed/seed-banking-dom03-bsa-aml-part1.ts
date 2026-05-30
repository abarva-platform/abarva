// seed-banking-dom03-bsa-aml-part1.ts
// Banking genome patterns — BSA/AML & Financial Crime Compliance
// Code range: B700–B759  (60 patterns)
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

export const BANKING_BSA_AML_PART1_PATTERNS: PatternSeed[] = [

  // ── Transaction Monitoring ────────────────────────────────────────────────
  {
    code: 'B700',
    name: 'Alert Threshold Tuning Without Statistical Back-Testing',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'OCC examiners find that transaction monitoring alert thresholds were set by analyst judgment rather than back-tested against historical SAR outcomes, violating OCC 2010-24 expectations for a documented tuning methodology. First Capital\'s TM system generates 1,400 alerts per month but SAR conversion is 1.8%, below the 3–5% peer benchmark, indicating thresholds are set too low and suppressing material alerts through volume-driven triage fatigue.',
    keywords: ['transaction monitoring', 'alert threshold', 'OCC 2010-24', 'SAR', 'back-testing', 'AML'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B701',
    name: 'Alert Disposition Governance Absent for Systematic Review',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'Analyst close rates for transaction monitoring alerts are not aggregated or reviewed by BSA management for systematic underinvestigation — individual analysts closing 95%+ of alerts without escalation are never flagged, a pattern FinCEN guidance identifies as a key indicator of AML program weakness. Without a disposition review committee, the bank cannot demonstrate to OCC examiners that the alert population is being worked consistently and in good faith.',
    keywords: ['alert disposition', 'AML', 'FinCEN', 'OCC', 'transaction monitoring', 'BSA'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B702',
    name: 'SAR Filing Rate Below Peer Benchmark Signals Over-Suppression',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'The transaction monitoring system generates thousands of alerts annually but the bank\'s SAR filing rate falls materially below peer group benchmarks published in FinCEN SAR statistics, suggesting systematic over-suppression at the analyst triage layer. OCC examination teams use peer SAR rate comparison as an initial screen; a bank filing SARs at half the peer rate without documented justification triggers a targeted review of the alert disposition process under OCC 2010-24.',
    keywords: ['SAR', 'AML', 'FinCEN', 'OCC 2010-24', 'peer benchmark', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B703',
    name: 'Nested Corporate Structure Monitoring Gap for Shell Layers',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'Transaction monitoring rules fire on direct customer activity but do not map beneficial ownership through nested corporate structures — a domestic LLC owned by a BVI holding company owned by a Cayman trust is treated as a single customer entity, and the ultimate natural person beneficial owner under 31 CFR 1010.230 (the CDD Rule) is never identified. OCC examiners have cited this gap as a material weakness because layering activity across shell company tiers is a core typology in commercial banking AML.',
    keywords: ['beneficial ownership', 'CDD Rule', 'shell company', 'AML', 'OCC', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B704',
    name: 'Correspondent Banking High-Risk Jurisdiction Alerts Suppressed',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      'Transaction monitoring scenarios for correspondent banking nostro and vostro activity have a suppression rule that excludes transactions below $50,000 from flagging, but FinCEN guidance on nested correspondent accounts identifies structuring below reporting thresholds as a primary typology. Alerts from respondent banks in FATF-blacklisted or high-risk jurisdictions are suppressed at the same rate as domestic low-risk correspondent activity, eliminating a critical detection layer without documented risk acceptance.',
    keywords: ['correspondent banking', 'AML', 'FinCEN', 'FATF', 'nested account', 'transaction monitoring'],
    demoRelevant: false,
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B705',
    name: 'TM System Alert Population Not Segmented by Risk Tier',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'Transaction monitoring alerts for high-risk customer segments — politically exposed persons, money service businesses, and cash-intensive commercial accounts — are queued alongside standard retail alerts without prioritisation, so the most consequential cases wait the same 30-day triage queue as low-risk alerts. FinCEN and OCC guidance both require risk-based resource allocation; a flat queue means the bank cannot demonstrate it dedicates proportional investigative effort to higher-risk activity.',
    keywords: ['transaction monitoring', 'AML', 'PEP', 'BSA', 'risk tier', 'OCC'],
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B706',
    name: 'Look-Back Period in TM Scenarios Too Short for Trade Finance',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Transaction monitoring look-back windows for trade finance accounts are set to 30 days, which is insufficient to detect over- or under-invoicing schemes that operate across 60–120-day letter-of-credit cycles. OCC examiners reviewing First Capital\'s trade finance portfolio found that a look-back period calibrated to invoice settlement cycles — a documented tuning requirement under OCC 2010-24 — was absent from the system\'s scenario configuration.',
    keywords: ['transaction monitoring', 'OCC 2010-24', 'trade finance', 'AML', 'look-back', 'BSA'],
    subTopic: 'transaction-monitoring',
  },

  // ── SAR / CTR Filing ──────────────────────────────────────────────────────
  {
    code: 'B707',
    name: 'SAR Narrative Written Without Legal Review by Junior Analyst',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Suspicious Activity Reports filed by First Capital are drafted by junior AML analysts and submitted without review by BSA counsel or a senior compliance officer — FinCEN guidance specifies that SAR narratives must contain specific, articulable facts and should describe why the activity is suspicious, not merely restate account data. OCC examiners have cited inadequate SAR narratives as a program deficiency because a legally deficient narrative can expose the bank to liability if the SAR is later subpoenaed.',
    keywords: ['SAR', 'FinCEN', 'AML', 'BSA', 'SAR narrative', 'OCC'],
    demoRelevant: true,
    subTopic: 'sar-ctr',
  },
  {
    code: 'B708',
    name: 'SAR Continuation Filings Not Triggered After Initial Report',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'After filing an initial SAR, the bank has no automated workflow to trigger a 90-day continuation SAR review if the suspicious activity persists — accounts flagged in an initial SAR continue transacting without re-evaluation, contrary to FinCEN\'s guidance that ongoing suspicious activity requires continuation filings. OCC examiners have found that First Capital\'s case management system closes SAR investigations at filing without setting a follow-up review, leaving continued criminal activity unreported.',
    keywords: ['SAR', 'FinCEN', 'AML', 'continuation filing', 'case management', 'OCC'],
    demoRelevant: true,
    subTopic: 'sar-ctr',
  },
  {
    code: 'B709',
    name: 'CTR 31-Day Exemption Documentation Gap',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Currency transaction reports for exempt persons — phase II exemptions for non-listed businesses — lack the annual review documentation required under 31 CFR 1020.315, and some exemptions have been in place for over five years without renewal. An OCC examination of First Capital\'s CTR program found that 22% of active phase II exemptions had no documented annual review, constituting a currency transaction reporting compliance gap that could result in FinCEN civil money penalties.',
    keywords: ['CTR', 'FinCEN', 'BSA', 'OCC', 'exemption', 'currency transaction reporting'],
    demoRelevant: false,
    subTopic: 'sar-ctr',
  },
  {
    code: 'B710',
    name: 'SAR-Adjacent Account Activity Not Reviewed After Filing',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'When a SAR is filed on a customer account, the bank does not automatically review related accounts — joint holders, beneficial owners under the same LLC, or frequent transaction counterparties — for potentially suspicious activity that mirrors the pattern triggering the original SAR. FinCEN guidance emphasises holistic suspicious activity investigation, and OCC examiners have identified this gap as evidence that the bank\'s AML program lacks the relational investigation capability required by its risk profile.',
    keywords: ['SAR', 'AML', 'FinCEN', 'OCC', 'beneficial ownership', 'BSA'],
    demoRelevant: true,
    subTopic: 'sar-ctr',
  },
  {
    code: 'B711',
    name: 'SAR 30-Day Filing Deadline Missed for Complex Cases',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'FinCEN requires SARs to be filed within 30 calendar days of initial detection of suspicious activity, extendable to 60 days if no suspect can be identified, but First Capital\'s case management workflow does not enforce deadline tracking — complex multi-account cases involving commercial customers sit in analyst queues past the 30-day threshold without escalation. Missed SAR filing deadlines constitute a BSA program deficiency and, if systemic, can trigger enforcement action under the Bank Secrecy Act.',
    keywords: ['SAR', 'FinCEN', 'BSA', 'AML', 'filing deadline', 'case management'],
    subTopic: 'sar-ctr',
  },

  // ── Customer Due Diligence & KYC ──────────────────────────────────────────
  {
    code: 'B712',
    name: 'Beneficial Ownership Not Refreshed at CDD Rule Trigger Events',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      'The CDD Rule (31 CFR 1010.230) requires covered financial institutions to collect and verify beneficial ownership at account opening and to update information when there is a known change, but First Capital\'s onboarding platform only collects beneficial ownership at account opening and has no trigger to refresh it when a commercial loan is renewed, a new product is added, or adverse news is identified. OCC examiners cited this as a material gap because ownership structures change through M&A, private equity exits, and restructuring events that alter beneficial ownership without the bank\'s knowledge.',
    keywords: ['CDD Rule', 'beneficial ownership', 'KYC', 'OCC', 'AML', 'BSA'],
    demoRelevant: true,
    subTopic: 'cdd-kyc',
  },
  {
    code: 'B713',
    name: 'EDD Not Applied Consistently to PEPs and High-Risk Customers',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      'Enhanced due diligence (EDD) requirements for politically exposed persons (PEPs), high-risk geographies, and money service business customers are documented in First Capital\'s AML policy but are inconsistently applied — relationship managers in the commercial banking group sometimes open PEP accounts with standard CDD rather than EDD because there is no system-enforced routing to the EDD workflow. FinCEN guidance and OCC examination standards both require EDD to be risk-based and systematically applied, not left to relationship manager discretion.',
    keywords: ['EDD', 'PEP', 'KYC', 'AML', 'FinCEN', 'OCC'],
    demoRelevant: true,
    subTopic: 'cdd-kyc',
  },
  {
    code: 'B714',
    name: 'KYC Documentation Expired for Legacy Commercial Accounts',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'KYC documentation for commercial accounts opened before the CDD Rule\'s May 2018 effective date has not been retroactively refreshed — First Capital\'s legacy book contains approximately 3,400 commercial accounts with government-issued ID or entity documents that are more than five years old, many from jurisdictions with high-frequency ownership changes. OCC examiners flagged this at the most recent examination as evidence that the bank\'s periodic review program does not reach legacy accounts at the same cadence as newly opened accounts.',
    keywords: ['KYC', 'CDD Rule', 'OCC', 'AML', 'BSA', 'legacy accounts'],
    demoRelevant: true,
    subTopic: 'cdd-kyc',
  },
  {
    code: 'B715',
    name: 'LLC and Trust KYC Does Not Resolve to Natural Person',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'Business account onboarding for LLCs and trusts collects entity-level documentation but does not trace ownership to the natural person beneficial owner as required by 31 CFR 1010.230 — the bank accepts a certificate of formation naming another LLC as the sole member without drilling down to identify natural persons with 25% or greater ownership or a single individual with significant control. This is the most commonly cited CDD Rule deficiency in OCC examination reports for community and regional banks.',
    keywords: ['CDD Rule', 'beneficial ownership', 'LLC', 'KYC', 'OCC', 'AML'],
    demoRelevant: true,
    subTopic: 'cdd-kyc',
  },
  {
    code: 'B716',
    name: 'Periodic KYC Review Cycle Not Risk-Tiered',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'First Capital\'s periodic KYC review schedule applies a uniform 36-month cycle to all commercial customers regardless of risk rating — high-risk accounts such as MSBs, foreign nationals, and cash-intensive businesses are reviewed on the same schedule as low-risk domestic retailers, contrary to FinCEN guidance that KYC refresh frequency must be commensurate with customer risk. OCC examination guidance suggests high-risk customers be reviewed annually or at shorter intervals, and a flat cycle indicates the risk-based program pillar is not operationally implemented.',
    keywords: ['KYC', 'periodic review', 'AML', 'FinCEN', 'OCC', 'BSA'],
    demoRelevant: false,
    subTopic: 'cdd-kyc',
  },
  {
    code: 'B717',
    name: 'Customer Risk Rating Not Updated at KYC Refresh',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Periodic KYC reviews update document currency but do not re-score the customer\'s AML risk rating — a customer whose business model has shifted from domestic retail to international trade finance retains a "low risk" designation because the review workflow does not include a risk-scoring step. FinCEN guidance and the OCC\'s AML examination manual both identify dynamic risk rating as a core pillar; static risk ratings defeat the risk-based allocation of monitoring resources.',
    keywords: ['KYC', 'AML', 'risk rating', 'FinCEN', 'OCC', 'BSA'],
    subTopic: 'cdd-kyc',
  },

  // ── AI/ML in AML ──────────────────────────────────────────────────────────
  {
    code: 'B718',
    name: 'AML Graph AI Creates Spurious Customer Network Links',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'A graph AI system deployed for network-based AML investigation uses shared address and phone number fields to infer customer relationships, but poor data quality causes unrelated customers who share a mail-forwarding address or a shared VoIP number to be linked as a financial crime network — investigators spend significant time disproving false networks flagged by the system. The model was not independently validated under SR 11-7 before deployment, and its false positive rate for network attribution was never measured against a labelled ground-truth dataset.',
    keywords: ['graph AI', 'AML', 'SR 11-7', 'model inventory', 'BSA', 'network analysis'],
    demoRelevant: true,
    subTopic: 'aml-ai',
  },
  {
    code: 'B719',
    name: 'ML Transaction Monitoring SAR Rate Inconsistent With Scenario System',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'An ML-based transaction monitoring model produces a SAR referral rate 40% lower than the legacy scenario-based system on the same transaction population, but the difference has not been investigated or explained — under SR 11-7, material differences in model outputs compared to a challenger or legacy benchmark must be documented in the model\'s performance monitoring record. First Capital\'s BSA compliance team cannot demonstrate to OCC examiners that the ML model is not suppressing SAR-worthy alerts that the scenario-based system would have surfaced.',
    keywords: ['ML model', 'SAR', 'SR 11-7', 'AML', 'OCC', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'aml-ai',
  },
  {
    code: 'B720',
    name: 'AI-Generated SAR Narrative Lacks Specific Facts',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'A natural language generation tool automatically produces SAR narrative drafts from transaction data and alert metadata, but the AI-generated text describes general patterns rather than specific facts, dates, amounts, and parties — FinCEN SAR guidance explicitly requires that the narrative identify specific suspicious transactions with dollar amounts, dates, and account numbers. OCC examiners reviewing a sample of First Capital\'s AI-drafted SARs found that regulatory-minimum factual specificity was absent in 60% of cases, triggering a program deficiency finding.',
    keywords: ['SAR', 'NLP', 'FinCEN', 'AML', 'AI', 'OCC'],
    demoRelevant: true,
    subTopic: 'aml-ai',
  },
  {
    code: 'B721',
    name: 'Unsupervised Clustering Model Cannot Be Explained to Examiner',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'An unsupervised ML clustering model segments the customer base into high-risk behavioral cohorts, but the cluster membership criteria cannot be explained in plain language to OCC examiners — the model identifies features algorithmically and the bank has no documented interpretation of what distinguishes a high-risk cluster from a low-risk cluster beyond the raw feature weights. SR 11-7 model risk management standards require that models used in compliance decisions be explainable and that management understand model limitations; an unexplainable cluster assignment fails this standard.',
    keywords: ['ML model', 'SR 11-7', 'AML', 'OCC', 'model inventory', 'BSA'],
    subTopic: 'aml-ai',
  },
  {
    code: 'B722',
    name: 'ML AML Model Inherits Historical SAR Bias',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'An ML transaction monitoring model trained on historical SAR data inherits the biases embedded in prior analyst investigation decisions — if analysts historically investigated cash-intensive small businesses at higher rates than correspondent banking counterparties, the model learns to flag the same demographics, encoding human judgment errors as algorithmic rules. SR 11-7 model validation requirements include assessment of training data representativeness and bias; a model trained on biased historical outcomes and deployed without this validation fails the independent review standard.',
    keywords: ['ML model', 'SR 11-7', 'SAR', 'AML', 'model inventory', 'BSA'],
    demoRelevant: false,
    subTopic: 'aml-ai',
  },
  {
    code: 'B723',
    name: 'Vendor AML AI Model Scope Change Without Bank Notification',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'The bank\'s contract with its vendor-supplied AML AI platform does not require the vendor to notify the bank when the underlying model is retrained, updated, or scoped to include new transaction types — model behaviour can change materially between examination cycles without the bank\'s knowledge, violating OCC model risk management expectations that the bank maintain oversight of vendor models used in compliance decisions. SR 11-7 applies to vendor-supplied models, and the absence of a model change notification clause is an SR 11-7 compliance gap.',
    keywords: ['vendor model', 'SR 11-7', 'AML', 'OCC', 'model inventory', 'BSA'],
    demoRelevant: true,
    subTopic: 'aml-ai',
  },
  {
    code: 'B724',
    name: 'AI Name-Matching Sanctions Screening False Negative Rate Exceeds Tolerance',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'An AI-powered name-matching system for OFAC sanctions screening produces a false negative rate — where a sanctioned individual or entity passes screening undetected — that exceeds the bank\'s documented risk tolerance, but no compensating control has been implemented to catch misses. OCC examination standards require that OFAC screening systems be tested against known SDN matches to establish hit rates; a false negative rate above tolerance without a compensating manual review layer constitutes a sanctions compliance deficiency.',
    keywords: ['OFAC', 'AI', 'sanctions screening', 'SDN', 'OCC', 'AML'],
    demoRelevant: true,
    subTopic: 'aml-ai',
  },
  {
    code: 'B725',
    name: 'GenAI Case File Summaries Create Attorney-Client Privilege Risk',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'First Capital\'s AML investigations team uses a generative AI tool to summarise case files before SAR submission, but legal counsel was not consulted on whether AI-generated summaries that synthesise attorney communications and investigation memoranda waive attorney-client privilege if the SAR is later subpoenaed. FinCEN has not issued formal guidance on GenAI use in SAR preparation, but banking regulators have flagged that any tool processing privileged communications in the SAR pipeline requires a formal privilege waiver analysis before deployment.',
    keywords: ['GenAI', 'SAR', 'AML', 'FinCEN', 'attorney-client privilege', 'BSA'],
    demoRelevant: false,
    subTopic: 'aml-ai',
  },
  {
    code: 'B726',
    name: 'AI Transaction Monitoring Model Not Registered in SR 11-7 Model Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'The ML model used for transaction monitoring alert generation is not registered in the bank\'s model inventory, which means it has not been subject to SR 11-7 independent validation, ongoing performance monitoring, or annual model review — OCC examiners will treat any unregistered model used in a compliance decision as an automatic model risk management deficiency. First Capital\'s model inventory covers credit models and market risk models but its BSA/AML compliance models were added to the scope only after an OCC examination finding.',
    keywords: ['SR 11-7', 'model inventory', 'AML', 'OCC', 'transaction monitoring', 'BSA'],
    demoRelevant: true,
    subTopic: 'aml-ai',
  },
  {
    code: 'B727',
    name: 'Fraud AI Alert Fatigue Suppresses AML Investigation Capacity',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'A fraud detection AI system generates high-volume alerts that share the same analyst queue as AML transaction monitoring alerts, creating alert fatigue that causes AML analysts to close transaction monitoring alerts more rapidly to manage queue depth — the fraud AI was deployed without a capacity impact assessment on the AML investigation team. FinCEN has noted that AML program resource adequacy is a key indicator of program effectiveness, and a shared queue that degrades AML investigation quality is a BSA program deficiency.',
    keywords: ['AI', 'AML', 'alert fatigue', 'FinCEN', 'BSA', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'aml-ai',
  },
  {
    code: 'B728',
    name: 'AI Adverse News Screening Not Mapped to CDD Refresh Trigger',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'An AI-powered adverse news monitoring system flags customers in negative news stories, but the system output is not connected to a CDD refresh trigger in the onboarding platform — adverse news hits generate a log entry but do not automatically initiate a KYC review or elevated risk rating update. FinCEN\'s CDD guidance requires covered institutions to update customer information when they become aware of information indicating changed risk, and an AI that identifies risk-elevating news without triggering a CDD update fails to operationalize that requirement.',
    keywords: ['AI', 'CDD Rule', 'AML', 'KYC', 'FinCEN', 'adverse news'],
    subTopic: 'aml-ai',
  },
  {
    code: 'B729',
    name: 'AI-Detected SAR Pattern Not Escalated Under Defined Human Review Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'An AI model that identifies SAR-worthy patterns routes high-confidence detections directly to the SAR filing queue without mandatory human review, contradicting OCC guidance that SAR filing decisions for OCC-regulated banks must involve a human decision-maker who reviews and approves the determination. The bank\'s SAR filing policy was not updated when the AI system was deployed, leaving a gap between the AI workflow and the policy requirement for human-reviewed SAR authorization.',
    keywords: ['SAR', 'AI', 'OCC', 'AML', 'SR 11-7', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'aml-ai',
  },
  {
    code: 'B730',
    name: 'AML Graph AI Network Expansion Exceeds Investigator Capacity',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Graph AI network expansion logic links a flagged customer to an average of 47 associated accounts per investigation, generating a workload volume that exceeds the AML team\'s capacity to investigate meaningfully — analysts close the peripheral nodes of each network without substantive review because the expansion algorithm does not apply an evidence-quality threshold to distinguish strong and weak links. SR 11-7 requires that model developers assess the operational impact of model output on downstream users, and a network expansion model that overwhelms investigator capacity has not met that standard.',
    keywords: ['graph AI', 'AML', 'SR 11-7', 'BSA', 'network analysis', 'OCC'],
    subTopic: 'aml-ai',
  },
  {
    code: 'B731',
    name: 'ML Model Trained on Non-Representative Transaction Sample',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'The AML ML model was trained on two years of historical transaction data, but that period excluded the COVID-19 pandemic transaction volatility and the bank\'s subsequent commercial banking expansion — the training sample is not representative of the current transaction population, and SR 11-7 model validation standards require ongoing assessment of whether training data remains representative of the live population. OCC examiners identified this gap after comparing model performance on commercial accounts opened post-2021 against legacy accounts, finding a significant performance decline on the newer segment.',
    keywords: ['ML model', 'SR 11-7', 'AML', 'OCC', 'model inventory', 'BSA'],
    subTopic: 'aml-ai',
  },

  // ── OFAC & Sanctions ──────────────────────────────────────────────────────
  {
    code: 'B732',
    name: 'OFAC Screening Does Not Check Wire Originator and Beneficiary Simultaneously',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      'OFAC sanctions screening on outgoing wire transfers checks the beneficiary name against the SDN list but does not simultaneously screen the originator fields — a domestic customer who is not on the SDN list can initiate a wire to a sanctioned beneficiary and the transaction clears because the screening logic only evaluates the originator. OFAC regulations require all parties to a wire transfer, including originators and beneficiaries, to be screened, and a unilateral screening architecture is a fundamental OFAC compliance deficiency.',
    keywords: ['OFAC', 'SDN', 'wire transfer', 'AML', 'sanctions screening', 'BSA'],
    demoRelevant: true,
    subTopic: 'ofac-sanctions',
  },
  {
    code: 'B733',
    name: 'Correspondent Nested Account Screening Does Not Reach Ultimate Beneficiary',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'Correspondent banking transactions processed through First Capital\'s nostro accounts are screened against the SDN list using the respondent bank\'s name as the customer identifier, but the ultimate beneficiary of nested correspondent transactions is not identified or screened — OFAC guidance on correspondent banking requires that institutions implement risk-based controls to identify and screen ultimate beneficiaries in nested account structures. OCC examiners have cited this as a high-risk OFAC gap for banks with active correspondent banking relationships.',
    keywords: ['OFAC', 'correspondent banking', 'SDN', 'nested account', 'AML', 'OCC'],
    demoRelevant: false,
    subTopic: 'ofac-sanctions',
  },
  {
    code: 'B734',
    name: 'SDN List Update Frequency Insufficient Between Batch Runs',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'OFAC publishes SDN list updates on an irregular schedule, sometimes multiple times per day during high-activity sanctions periods, but First Capital\'s sanctions screening system downloads the SDN list in a nightly batch — new designations published after the morning batch run are not applied to transactions processed intraday, creating a screening gap of up to 23 hours. OFAC expects covered institutions to screen against a current SDN list, and a nightly-only update cycle has been cited by OCC examiners as insufficient for institutions with active international wire transfer volumes.',
    keywords: ['OFAC', 'SDN', 'sanctions screening', 'OCC', 'AML', 'BSA'],
    demoRelevant: true,
    subTopic: 'ofac-sanctions',
  },
  {
    code: 'B735',
    name: 'Virtual Asset Crypto Address Not Included in Sanctions Screening',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'First Capital\'s OFAC screening program covers traditional payment identifiers — names, account numbers, and country codes — but does not screen cryptocurrency wallet addresses despite OFAC\'s publication of digital currency addresses on the SDN list since 2018. As the bank\'s commercial customers increasingly operate in crypto-adjacent business lines, transactions referencing blockchain addresses linked to SDN-listed entities will pass through undetected; OFAC has issued civil enforcement actions against financial institutions for processing transactions involving crypto addresses on the SDN list.',
    keywords: ['OFAC', 'SDN', 'virtual asset', 'AML', 'crypto', 'sanctions screening'],
    demoRelevant: false,
    subTopic: 'ofac-sanctions',
  },
  {
    code: 'B736',
    name: 'OFAC Voluntary Self-Disclosure Decision Made Without Legal Counsel',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'When an OFAC apparent violation is identified, the BSA compliance team makes the voluntary self-disclosure (VSD) decision internally without engaging legal counsel — OFAC\'s enforcement guidelines indicate that the VSD decision and the penalty calculation methodology both involve legal judgments about apparent violation severity, aggravating and mitigating factors, and transaction value that require counsel involvement. A VSD submitted without legal review may include admissions or omit mitigating factors that increase the resulting penalty calculation.',
    keywords: ['OFAC', 'BSA', 'voluntary self-disclosure', 'AML', 'OCC', 'sanctions'],
    subTopic: 'ofac-sanctions',
  },
  {
    code: 'B737',
    name: 'Sanctions Screening Not Applied to ACH Origination File Parties',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'OFAC screening is applied to wire transfers and new account origination but is not systematically applied to third-party ACH origination files submitted by corporate customers — a payroll processor or accounts payable originator can include SDN-listed payees in an ACH batch that the bank processes without sanctions review. OFAC\'s regulations apply to all transactions regardless of payment type, and the absence of ACH file-level sanctions screening is an architecture gap that increases OFAC liability for an OCC-chartered institution with active ACH origination.',
    keywords: ['OFAC', 'ACH', 'SDN', 'sanctions screening', 'OCC', 'BSA'],
    subTopic: 'ofac-sanctions',
  },

  // ── BSA Program Governance ────────────────────────────────────────────────
  {
    code: 'B738',
    name: 'BSA/AML Independent Testing Performed Without AML Expertise',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'First Capital\'s BSA/AML independent testing function is staffed by internal audit generalists who do not have dedicated AML or BSA expertise — OCC examination standards require that the independent testing function have sufficient expertise to evaluate the effectiveness of the AML program, including the adequacy of transaction monitoring tuning, SAR quality, and CDD completeness. An independent test performed by auditors who cannot evaluate whether threshold tuning decisions are statistically justified provides only superficial assurance.',
    keywords: ['BSA', 'AML', 'OCC', 'independent testing', 'internal audit', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B739',
    name: 'BSA Officer Cannot Escalate to Board Without Management Filter',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'First Capital\'s BSA Officer reports to the Chief Risk Officer and does not have direct escalation access to the board of directors or the audit committee — when the BSA Officer identifies a material AML program deficiency, the escalation path routes through senior management who can delay or moderate the communication before it reaches the board. OCC examination guidance and the four pillars of an effective BSA/AML program require that the BSA Officer have sufficient authority and independence to escalate program concerns directly to the board without management filter.',
    keywords: ['BSA', 'OCC', 'AML', 'BSA Officer', 'board escalation', 'program governance'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B740',
    name: 'BSA/AML Training Completion Tracked but Comprehension Not Assessed',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Annual BSA/AML training completion rates are reported to the board as a program metric, but the training does not include a comprehension assessment — employees who click through the training module without engaging with the content receive the same completion credit as those who demonstrate understanding. FinCEN guidance on BSA/AML program pillars states that training must be effective, not merely completed; OCC examination teams review training assessment scores as evidence of programme effectiveness, and a completion-only metric does not demonstrate comprehension.',
    keywords: ['BSA', 'AML', 'training', 'FinCEN', 'OCC', 'program governance'],
    subTopic: 'bsa-program',
  },
  {
    code: 'B741',
    name: 'Annual Four-Pillar Self-Assessment Not Documented',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'The BSA/AML program pillar self-assessment — covering internal controls, independent testing, BSA officer designation, and training — is performed informally by the compliance team but is not documented in a formal annual report presented to the board. OCC examination procedures include a review of the bank\'s self-assessment documentation; the absence of a documented assessment means the bank cannot demonstrate that management has evaluated program adequacy against the four pillars, which is a prerequisite for demonstrating a well-managed BSA program.',
    keywords: ['BSA', 'AML', 'OCC', 'program governance', 'internal controls', 'FinCEN'],
    demoRelevant: false,
    subTopic: 'bsa-program',
  },
  {
    code: 'B742',
    name: 'FinCEN 314(a) Search Response Process Not Operationalized',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'FinCEN 314(a) requests require covered institutions to search account and transaction records and respond within 14 days, but First Capital\'s BSA team has no documented procedure, assigned owner, or response tracking log for 314(a) requests — two missed response deadlines in the prior 18 months were attributed to the requests being routed to an unmonitored compliance email inbox. A missed 314(a) response deadline is a direct violation of the Bank Secrecy Act and can trigger a FinCEN examination referral.',
    keywords: ['FinCEN', 'BSA', '314(a)', 'AML', 'OCC', 'response deadline'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B743',
    name: 'BSA Program Risk Assessment Not Updated After New Product Launch',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'First Capital launched a digital commercial banking product with multi-currency wire capabilities but did not update the enterprise BSA/AML risk assessment to reflect the new money laundering and sanctions risks introduced by the product — OCC examination standards require the risk assessment to be updated when a material new product, service, or customer type is introduced. The gap means transaction monitoring scenarios and EDD requirements have not been calibrated to the risk profile of the new digital banking customers.',
    keywords: ['BSA', 'AML', 'risk assessment', 'OCC', 'FinCEN', 'program governance'],
    demoRelevant: false,
    subTopic: 'bsa-program',
  },
  {
    code: 'B744',
    name: 'BSA/AML Consent Order Remediation Tracked Without Independent Validation',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Under a prior OCC consent order related to BSA/AML deficiencies, First Capital tracks remediation action items in an internal project log reviewed by management but does not subject completed items to independent validation before reporting compliance to the OCC — remediation progress reported to the regulator is based on self-attestation rather than tested effectiveness. OCC consent order compliance requires that remediation be validated by an independent party, typically internal audit or an external consultant, before the bank represents that deficiencies have been cured.',
    keywords: ['OCC', 'BSA', 'AML', 'consent order', 'remediation', 'program governance'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B745',
    name: 'BSA/AML Policies Not Updated to Reflect Revised FinCEN Guidance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'First Capital\'s BSA/AML written policies were last comprehensively updated in 2021 and have not been revised to reflect FinCEN\'s 2023 national priorities on proliferation financing, cyber-enabled financial crime, and drug trafficking — OCC examination teams compare the bank\'s written policies to current FinCEN national priorities and cite gaps where the policy does not address a declared priority. A policy that predates a national priority signals to examiners that the compliance function is not monitoring regulatory developments.',
    keywords: ['BSA', 'AML', 'FinCEN', 'OCC', 'policy governance', 'program governance'],
    subTopic: 'bsa-program',
  },

  // ── Correspondent Banking AML ─────────────────────────────────────────────
  {
    code: 'B746',
    name: 'Respondent Bank Due Diligence Not Refreshed at Relationship Anniversary',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Correspondent banking due diligence on respondent banks is conducted at relationship inception but is not refreshed on a periodic schedule — several respondent relationships are more than eight years old with no documented re-evaluation of the respondent bank\'s AML program, ownership structure, or regulatory standing. OCC guidance on correspondent banking requires periodic due diligence refresh commensurate with the risk of the correspondent relationship, and a static due diligence file for a high-risk jurisdiction respondent is a material AML program gap.',
    keywords: ['correspondent banking', 'AML', 'OCC', 'BSA', 'due diligence', 'KYC'],
    demoRelevant: false,
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B747',
    name: 'Payable-Through Account Customer Identification Not Performed',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'First Capital maintains payable-through account relationships with foreign banks where the foreign bank\'s customers can transact directly through First Capital\'s accounts, but the bank has not implemented customer identification for the foreign bank\'s customers as required by the USA PATRIOT Act Section 312 enhanced due diligence requirements. Payable-through account customers are the functional equivalent of First Capital account holders from an AML risk perspective, and failure to identify them is a Section 312 compliance deficiency.',
    keywords: ['correspondent banking', 'AML', 'BSA', 'OCC', 'USA PATRIOT Act', 'KYC'],
    subTopic: 'transaction-monitoring',
  },

  // ── Structuring and Cash Reporting ───────────────────────────────────────
  {
    code: 'B748',
    name: 'Structuring Detection Rule Does Not Cover Multi-Branch Cash Deposits',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      'Transaction monitoring structuring detection rules identify multiple sub-$10,000 cash deposits at a single branch within a 24-hour period but do not aggregate cash activity across multiple First Capital branches — a customer making $9,500 cash deposits at three different branch locations on the same day avoids the structuring alert because the rule is branch-scoped rather than customer-scoped. FinCEN defines structuring as breaking up transactions to evade CTR reporting requirements regardless of the number of institutions or locations involved, and a branch-scoped detection rule systematically misses multi-location structuring.',
    keywords: ['structuring', 'CTR', 'FinCEN', 'AML', 'BSA', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'sar-ctr',
  },
  {
    code: 'B749',
    name: 'Cash Intensive Business Monitoring Threshold Not Differentiated',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Transaction monitoring alert thresholds for cash-intensive businesses — restaurants, car washes, laundromats — are set at the same dollar levels as non-cash-intensive commercial customers, so normal operating cash activity for these businesses generates chronic false positives while abnormal spikes below the standard threshold go undetected. OCC examination guidance and FinCEN typologies both identify cash-intensive businesses as requiring risk-calibrated monitoring thresholds that account for expected cash volumes in the customer\'s industry segment.',
    keywords: ['AML', 'BSA', 'transaction monitoring', 'FinCEN', 'OCC', 'cash intensive'],
    subTopic: 'transaction-monitoring',
  },

  // ── Trade Finance and International AML ──────────────────────────────────
  {
    code: 'B750',
    name: 'Trade-Based Money Laundering Typologies Not Included in TM Scenarios',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'First Capital\'s transaction monitoring scenario library does not include scenarios specific to trade-based money laundering (TBML) typologies — over- and under-invoicing, multiple invoicing, falsely described goods — despite the bank\'s growing portfolio of commercial customers with international trade finance activity. FinCEN has published TBML typologies as a national AML priority, and OCC examiners reviewing First Capital\'s scenario coverage identified TBML as a significant gap given the bank\'s trade finance book.',
    keywords: ['AML', 'BSA', 'trade finance', 'FinCEN', 'OCC', 'transaction monitoring'],
    demoRelevant: false,
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B751',
    name: 'International Wire Transfer Intermediary Bank Not Screened',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'OFAC and AML screening for international wire transfers checks the originator and beneficiary but does not screen intermediary banks in the SWIFT message chain — a transaction routed through a correspondent bank in a high-risk jurisdiction that itself has OFAC exposure can pass through First Capital\'s system undetected. OCC examination guidance requires screening of all parties in a payment message, and the absence of intermediary bank screening in a SWIFT-connected institution is a documented AML and OFAC architecture deficiency.',
    keywords: ['OFAC', 'AML', 'SWIFT', 'wire transfer', 'OCC', 'BSA'],
    subTopic: 'ofac-sanctions',
  },

  // ── Emerging Risk and Digital Banking AML ────────────────────────────────
  {
    code: 'B752',
    name: 'Digital Account Opening AML Controls Not Equivalent to Branch Controls',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      'First Capital\'s digital account opening channel for small business customers applies automated KYC checks but does not include the same beneficial ownership documentation collection as branch-opened accounts — the digital channel collects entity name and EIN but does not collect beneficial owner certifications required under 31 CFR 1010.230 for legal entity customers. OCC examination teams verify that digital and branch channels apply equivalent CDD Rule compliance, and a lighter-touch digital onboarding flow that omits beneficial ownership collection is a regulatory equivalence gap.',
    keywords: ['CDD Rule', 'beneficial ownership', 'KYC', 'OCC', 'AML', 'digital banking'],
    demoRelevant: true,
    subTopic: 'cdd-kyc',
  },
  {
    code: 'B753',
    name: 'Real-Time Payment AML Monitoring Lags Behind Transaction Speed',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'First Capital\'s real-time payment (RTP) and FedNow transaction monitoring operates on a post-settlement review cycle — alerts are generated after funds have already been transferred and are not blocked pre-execution. For structuring and layering typologies in the real-time payment environment, post-settlement alerts cannot prevent the underlying transaction, and FinCEN\'s emerging payment guidance indicates that institutions processing high-value real-time payments should implement pre-execution screening for high-risk scenarios.',
    keywords: ['AML', 'real-time payments', 'FinCEN', 'transaction monitoring', 'BSA', 'FedNow'],
    demoRelevant: false,
    subTopic: 'transaction-monitoring',
  },
  {
    code: 'B754',
    name: 'MSB Customer AML Monitoring Not Differentiated From Standard Commercial',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'Money service business (MSB) customers — check cashers, money transmitters, foreign exchange dealers — are onboarded into the standard commercial banking AML monitoring tier without the heightened transaction monitoring scenarios and EDD review cycle required for MSBs. FinCEN has designated MSBs as a high-risk customer category, and OCC examination teams routinely test whether MSB accounts receive differentiated monitoring that accounts for the elevated money laundering typologies associated with MSB activity.',
    keywords: ['AML', 'BSA', 'MSB', 'FinCEN', 'OCC', 'EDD'],
    demoRelevant: true,
    subTopic: 'cdd-kyc',
  },
  {
    code: 'B755',
    name: 'Cannabis-Related Business Banking Policy Not Aligned With FinCEN Guidance',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'First Capital banks several ancillary cannabis-related businesses — real estate lessors, equipment suppliers — without a formal policy that implements the FinCEN 2014 guidance on marijuana-related businesses, including the limited circumstances under which a bank may serve MRBs and the required SAR filing protocols (Marijuana Limited, Marijuana Priority, Marijuana Termination). OCC examiners reviewing First Capital\'s cannabis exposure found that relationship managers were making individual decisions without a policy framework, creating inconsistent compliance documentation across the portfolio.',
    keywords: ['FinCEN', 'BSA', 'AML', 'cannabis', 'SAR', 'OCC'],
    subTopic: 'bsa-program',
  },
  {
    code: 'B756',
    name: 'Beneficial Ownership Re-Certification Not Captured in Core Banking System',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Beneficial ownership re-certifications collected during periodic KYC reviews are stored in PDF attachments in a document management system but are not written back to a structured field in the core banking platform — regulators and auditors cannot query which accounts have current beneficial ownership certification and which are overdue. OCC examination teams use core system data extracts to test CDD Rule compliance, and beneficial ownership information that exists only in unstructured document attachments cannot be systematically verified.',
    keywords: ['CDD Rule', 'beneficial ownership', 'KYC', 'OCC', 'AML', 'BSA'],
    demoRelevant: true,
    subTopic: 'cdd-kyc',
  },
  {
    code: 'B757',
    name: 'AML Model Performance Reporting Does Not Include Precision and Recall',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Performance reporting for First Capital\'s ML transaction monitoring model includes alert volume and SAR conversion rate but does not include precision (SAR-filed rate among alerts worked) or recall (estimated percentage of SAR-worthy transactions that were flagged) — without precision and recall, the BSA Officer cannot assess whether the model is over-alerting, under-alerting, or both simultaneously in different customer segments. SR 11-7 model performance monitoring requirements include ongoing evaluation of model accuracy metrics relevant to the model\'s purpose, and a compliance model without recall measurement has an unquantified blind spot.',
    keywords: ['ML model', 'SR 11-7', 'AML', 'OCC', 'model inventory', 'transaction monitoring'],
    subTopic: 'aml-ai',
  },
  {
    code: 'B758',
    name: 'AML Lookback Examination Ordered But Scope Not Fully Resourced',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Following an OCC examination finding, First Capital was directed to conduct a lookback examination of transaction activity for a defined customer population over a 24-month period, but the compliance team was not given the additional headcount, budget, or system access required to complete the lookback within the OCC-specified timeframe. An incomplete or delayed lookback examination is a consent order compliance failure that demonstrates the bank\'s AML remediation programme is not adequately resourced, a factor that OCC weighs in determining whether to elevate supervisory action.',
    keywords: ['OCC', 'AML', 'BSA', 'lookback', 'consent order', 'remediation'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B759',
    name: 'Third-Party Payment Processor AML Risk Not Assessed at Onboarding',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'First Capital processes transactions for third-party payment processors (TPPPs) as part of its commercial banking business without conducting the enhanced due diligence on the TPPP\'s merchant portfolio that FinCEN and OCC guidance require — a TPPP whose merchant portfolio includes high-risk internet merchants or offshore gambling operators creates money laundering exposure for the bank through the TPPP relationship. OCC 2010-24 includes TPPPs as a distinct high-risk customer type that requires transaction monitoring calibrated to the aggregate risk of the TPPP\'s underlying merchant base.',
    keywords: ['AML', 'BSA', 'OCC 2010-24', 'TPPP', 'FinCEN', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring',
  },
];
