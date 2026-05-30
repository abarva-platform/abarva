// seed-banking-dom01-model-risk-part1.ts
// Banking genome patterns — Model Risk Management (SR 11-7 / SR 11-8)
// Code range: B100–B159  (60 patterns)
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

export const BANKING_MODEL_RISK_PART1_PATTERNS: PatternSeed[] = [

  // ── Model Inventory ────────────────────────────────────────────────────────
  {
    code: 'B100',
    name: 'Vendor-Embedded AI Models Absent From MRM Inventory',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'First Capital Bank licenses credit scoring SaaS, a fraud detection engine, and an AML transaction monitoring platform, none of which appear in the SR 11-7 model inventory because procurement owns the vendor contracts rather than the Model Risk Management function. OCC examiners reviewing the model inventory find it covers only internally built models, creating a material gap that constitutes a consent order finding — vendor-embedded AI models that influence credit decisions or regulatory reporting are explicitly in scope under SR 11-7 regardless of whether the bank built them.',
    keywords: ['SR 11-7', 'model inventory', 'vendor AI', 'OCC examination', 'TPRM'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B101',
    name: 'Model-in-Model Dependency Chain Not Tracked in Inventory',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'The CECL allowance model consumes PD outputs from a separate probability-of-default model, which in turn ingests macro variable forecasts from a third econometric model; none of these upstream dependencies are captured in the model inventory record for the CECL model itself. When the econometric model is recalibrated following the 2022–2024 rate cycle, the allowance model continues to use the prior PD surface, producing a provision estimate that the independent validation unit cannot reconcile against the revised macro path — a direct SR 11-8 documentation deficiency.',
    keywords: ['SR 11-7', 'model inventory', 'CECL', 'model-in-model', 'SR 11-8'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B102',
    name: 'Model Tiering Not Risk-Based — CECL Provision Grouped With Analytics',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'First Capital applies a flat two-tier model classification that places the CECL allowance model in the same tier as low-stakes branch analytics dashboards because both are internally built and use regression techniques. SR 11-7 requires tiering to reflect the materiality and complexity of a model\'s use; a provision model driving capital adequacy decisions requires more rigorous validation frequency, broader sensitivity testing, and senior MRM committee review than a descriptive analytics tool — collapsing them to the same tier is an OCC-cited governance deficiency.',
    keywords: ['SR 11-7', 'model tiering', 'CECL', 'OCC 2011-12', 'model governance'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B103',
    name: 'Shadow Model Fleet of Excel VBA Scripts Outside MRM Inventory',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      'Commercial banking and treasury business units maintain a fleet of Excel VBA workbooks and ad-hoc Python scripts that price non-standard loan structures, calculate covenant compliance, and generate internal transfer-pricing rates — none are registered in the MRM model inventory because the SR 11-7 model definition is interpreted narrowly to cover only enterprise-deployed systems. When a VBA workbook used to price a $120M commercial real estate portfolio is corrupted, the loss attribution cannot be traced to a validated model, creating both financial misstatement risk and an OCC model risk governance finding.',
    keywords: ['SR 11-7', 'model inventory', 'shadow models', 'Excel VBA', 'model governance'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B104',
    name: 'Model Inventory Fields Incomplete — Use Case and Material Change History Missing',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'First Capital\'s model inventory spreadsheet captures model name, owner, and last validation date but omits the decision use case, downstream consumer systems, regulatory capital or provisioning impact, and history of material changes. OCC examiners under OCC 2011-12 require inventory completeness sufficient to assess aggregate model risk across the portfolio; without use-case tagging, the MRM committee cannot identify which models are in scope for DFAST or CECL stress testing, leaving the bank unable to demonstrate comprehensive model risk oversight.',
    keywords: ['SR 11-7', 'model inventory', 'OCC 2011-12', 'model documentation', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B105',
    name: 'Acquired Bank Models Not Integrated Into Inventory Post-Merger',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Following First Capital\'s acquisition of a community bank, the acquired institution\'s credit scoring, deposit pricing, and prepayment models are absorbed into production workflows but not added to the acquirer\'s SR 11-7 inventory or subjected to independent validation. Post-merger integration checklists focus on system connectivity and data migration, missing a model risk due diligence step; the OCC expects the acquiring bank to validate all inherited models and assign them to its governance framework within a defined timeline, which SR 11-7 guidance confirms.',
    keywords: ['SR 11-7', 'model inventory', 'merger integration', 'OCC examination', 'model validation'],
    subTopic: 'model-inventory',
  },
  {
    code: 'B106',
    name: 'Model Inventory Not Reconciled Against Production Deployment Catalog',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'The MRM model inventory is maintained by the governance team while production model deployments are tracked in a separate IT change management system; the two catalogs are reconciled annually at most. Models deployed mid-year to support new product launches or digital transformation initiatives are visible in the IT catalog but absent from the MRM inventory, creating a gap that OCC examiners exploited in the most recent model risk examination to identify seven unvalidated production models.',
    keywords: ['SR 11-7', 'model inventory', 'OCC examination', 'model governance', 'change management'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },

  // ── Model Validation ───────────────────────────────────────────────────────
  {
    code: 'B107',
    name: 'Model Validation Performed by Development Team — SR 11-7 Independence Violation',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description:
      'First Capital\'s deposit pricing model is validated by the quantitative analytics team that built it rather than by the independent validation unit, because the IVU lacks the subject-matter expertise to challenge the model design. SR 11-7 explicitly requires validation independence — the validator must not have any stake in whether the model is approved — and OCC examinations routinely cite this as a Matters Requiring Attention when developer-and-validator overlap is documented. The MRM consent order includes a specific remediation milestone to staff and empower an independent validation function with authority to reject models.',
    keywords: ['SR 11-7', 'model validation', 'independent validation unit', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B108',
    name: 'Model Deployed Before Validation Findings Resolved',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'The fraud detection model receives a validation report citing three open findings — one rated "high" for insufficient out-of-time testing — but is deployed to production on schedule because the business cannot absorb the delay. SR 11-7 requires a documented process for managing models with open findings, including compensating controls and senior management sign-off; instead, the deployment proceeds with no compensating monitoring controls activated and the high finding remains unresolved for 14 months, compounding the consent order remediation timeline.',
    keywords: ['SR 11-7', 'model validation', 'consent order', 'model monitoring', 'compensating controls'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B109',
    name: 'Conceptual Soundness Review Ignores Distributional Shift Since Training',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'The independent validation unit\'s conceptual soundness section for the commercial credit scoring model confirms that the modeling technique is theoretically appropriate but does not assess whether the training data distribution — dominated by the low-rate, low-default 2015–2019 period — still describes the 2023–2025 operating environment. SR 11-7\'s conceptual soundness requirement encompasses the choice of training data and its representativeness; a model trained on pre-rate-shock data that is deployed into a rising-rate high-default environment carries unquantified out-of-sample risk that the validation report does not surface.',
    keywords: ['SR 11-7', 'model validation', 'conceptual soundness', 'distributional shift', 'CECL'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B110',
    name: 'Validation Uses Same Data as Development — No Holdout Sample or Leakage Test',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'The AML transaction monitoring model is validated using the same historical transaction dataset used for development, with no separate holdout sample and no leakage test to confirm that outcome labels were not available at prediction time. SR 11-7 validation standards require independent data or at minimum a rigorous out-of-sample design; using the development dataset inflates validation performance metrics and suppresses the true out-of-sample false-negative rate, leaving the bank exposed to undetected suspicious activity and a FinCEN examination finding.',
    keywords: ['SR 11-7', 'model validation', 'AML', 'holdout sample', 'data leakage'],
    subTopic: 'model-validation',
  },
  {
    code: 'B111',
    name: 'DFAST Stress Model Validated Only Under Base Scenario',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'First Capital\'s DFAST net interest income stress model undergoes annual validation against the base macro scenario but not the severe adverse scenario mandated by the Federal Reserve\'s SR 11-7 DFAST guidance. The severe adverse scenario involves nonlinear credit migration dynamics and liquidity stress that may expose model instability invisible under the base case; validating only the base scenario satisfies the letter of the validation calendar but fails the conceptual soundness and outcome analysis requirements when the model is presented to the OCC as fully validated.',
    keywords: ['DFAST', 'SR 11-7', 'model validation', 'stress testing', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B112',
    name: 'Backtesting Frequency Insufficient for Intraday Risk Models',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'First Capital\'s intraday liquidity risk model and value-at-risk model for the treasury portfolio are backtested quarterly, but SR 11-7 and BCBS 239 data quality requirements imply a higher-frequency review cadence for models that drive real-time limit consumption and collateral management decisions. Quarterly backtesting cannot detect model degradation caused by regime shifts — such as the 2023 regional bank stress — within a window that allows timely recalibration before limit breaches accumulate.',
    keywords: ['SR 11-7', 'backtesting', 'BCBS 239', 'intraday liquidity', 'model monitoring'],
    subTopic: 'model-validation',
  },
  {
    code: 'B113',
    name: 'Vendor Model Validation Accepted Without Independent Reproduction',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'First Capital accepts the vendor\'s own validation report for a credit risk scoring model acquired under a SaaS contract, treating it as equivalent to an independent SR 11-7 validation. SR 11-7 is explicit that vendor-supplied validation documentation supplements but does not replace the bank\'s own independent validation; the OCC examiner finds no evidence that the IVU reproduced the model\'s performance metrics on First Capital\'s own customer data, a requirement that forms the core of the consent order\'s TPRM model risk remediation milestone.',
    keywords: ['SR 11-7', 'model validation', 'vendor model', 'TPRM', 'consent order'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B114',
    name: 'Sensitivity Analysis Omitted From Validation Report for Rate-Sensitive Models',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Validation reports for First Capital\'s deposit repricing and mortgage prepayment models include outcome analysis and benchmarking sections but omit sensitivity analysis to the key rate assumptions, which SR 11-7 requires for models where small input changes can drive large output swings. Without a documented sensitivity surface, the MRM committee cannot set risk-adjusted limits on how far model inputs can stray from validation conditions before the model result is considered unreliable, leaving the bank with no early-warning trigger for model performance degradation.',
    keywords: ['SR 11-7', 'model validation', 'sensitivity analysis', 'interest rate risk', 'model documentation'],
    subTopic: 'model-validation',
  },

  // ── Model Monitoring ───────────────────────────────────────────────────────
  {
    code: 'B115',
    name: 'Monitoring Covers Accuracy Metrics But Not Business Outcome Drift',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'First Capital\'s model monitoring program tracks Gini coefficient and KS statistic for the consumer credit model monthly but does not compare predicted loss rates against realized net charge-offs at a segment level. SR 11-7 requires outcome analysis — the comparison of model predictions against actual outcomes — as a core element of ongoing model performance review; tracking discrimination metrics alone cannot detect a miscalibrated PD surface where rank-ordering is preserved but absolute loss forecasts are systematically biased upward or downward.',
    keywords: ['SR 11-7', 'model monitoring', 'outcome analysis', 'CECL', 'PD calibration'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B116',
    name: 'Alert Thresholds Set at Development-Time Volatility, Not Updated Post-Regime-Change',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'The model monitoring alert thresholds for the CECL allowance model were calibrated against 2018–2020 data volatility and have not been reviewed since initial deployment. After the 2022–2024 rate shock changed the volatility regime for commercial real estate PD and LGD estimates, the existing thresholds fail to trigger even when model outputs deviate materially from realized outcomes, because the threshold bands are wide relative to post-2022 variability — a monitoring design deficiency that SR 11-7 guidance addresses through the requirement for periodic review of monitoring program design.',
    keywords: ['SR 11-7', 'model monitoring', 'CECL', 'regime change', 'PD'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B117',
    name: 'CECL PD Calibration Drift Not Monitored After Rate Rise',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      'First Capital\'s CECL allowance model uses a PD surface calibrated on historical through-the-cycle default data; monitoring reports do not include a calibration test comparing modeled PD against observed default frequencies in the post-2022 rate environment. The bank\'s commercial loan portfolio has experienced a structural shift in default behavior as floating-rate borrowers face debt service coverage ratios below 1.0x, but the monitoring program does not flag calibration drift until the model owner manually reviews quarterly investor reports — by which point the CECL provision may be understated for two consecutive reporting periods.',
    keywords: ['CECL', 'SR 11-7', 'PD', 'model monitoring', 'LGD'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B118',
    name: 'Champion-Challenger Framework Deployed Without Decision Rights for Promotion',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'First Capital\'s fraud detection model operates in a champion-challenger configuration where the challenger model routes 10% of transactions, but no governance document defines who has authority to promote the challenger to champion, what performance threshold triggers promotion review, or what validation steps are required before promotion. SR 11-7 requires that model lifecycle governance cover deployment changes; without documented decision rights, challenger promotion is either blocked indefinitely or executed informally outside the validation cycle, each of which is a governance finding.',
    keywords: ['SR 11-7', 'model champion-challenger', 'model governance', 'model validation', 'fraud AI'],
    subTopic: 'model-monitoring',
  },
  {
    code: 'B119',
    name: 'No Model Performance Monitoring for Vendor-Provided Models',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      'First Capital assumes that ongoing performance monitoring for its vendor-supplied AML transaction monitoring model is the vendor\'s responsibility, and receives only annual summary reports without segment-level or population-specific performance data. SR 11-7 requires the bank to maintain adequate monitoring of all models it uses regardless of source; when the AML model\'s false-negative rate rises following changes in the bank\'s commercial customer mix, First Capital has no visibility into the degradation until a FinCEN examination flags Suspicious Activity Report coverage gaps that exceed peer benchmarks.',
    keywords: ['SR 11-7', 'model monitoring', 'AML', 'vendor model', 'TPRM'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B120',
    name: 'Model Monitoring Reports Produced But Not Reviewed by MRM Committee',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Monthly model performance reports are generated by the model monitoring team and distributed by email but do not appear on the MRM committee agenda unless an alert threshold is breached. Alerts are calibrated conservatively to avoid unnecessary committee escalations, meaning routine performance degradation below threshold is never escalated for governance review. SR 11-7 requires that model monitoring results be reviewed by appropriate levels of management; a distribution-only process without a documented review and challenge record is a governance deficiency that OCC examiners consistently cite.',
    keywords: ['SR 11-7', 'model monitoring', 'MRM committee', 'OCC examination', 'model governance'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },

  // ── Consent Order & Examination ───────────────────────────────────────────
  {
    code: 'B121',
    name: 'MRM Consent Order Findings Unresolved at OCC Follow-Up Examination',
    officeCategory: 'back_office',
    failureRatePct: 82,
    description:
      'First Capital\'s MRM consent order issued following the 2022 OCC examination cited seven model risk governance deficiencies with 12-month remediation deadlines. At the 2023 follow-up examination, five findings remain open — including model inventory completeness and independent validation unit staffing — because the remediation plan lacked dedicated resourcing and senior management accountability. OCC examiners escalate unresolved consent order findings to Matters Requiring Immediate Attention, triggering civil money penalty consideration and heightening capital planning scrutiny.',
    keywords: ['consent order', 'OCC examination', 'SR 11-7', 'model governance', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'consent-order',
  },
  {
    code: 'B122',
    name: 'Consent Order Remediation Plan Lacks Measurable Milestones',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'First Capital\'s consent order remediation plan describes actions such as "enhance model inventory" and "strengthen validation independence" but does not specify completion criteria, target dates by finding, responsible owners, or metrics by which the OCC can assess progress. When examiners request evidence of remediation at the follow-up examination, management presents policy documents and committee minutes rather than quantitative evidence — the number of models added to inventory, validation backlogs cleared, or IVU headcount hired — leaving examiners unable to assess whether the consent order\'s intent has been achieved.',
    keywords: ['consent order', 'OCC examination', 'SR 11-7', 'model governance', 'remediation plan'],
    demoRelevant: true,
    subTopic: 'consent-order',
  },
  {
    code: 'B123',
    name: 'Model Risk Committee Has Policy Authority But Not Deployment Veto',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'First Capital\'s model risk committee is chartered to approve and update model risk policy but business lines retain unilateral authority to deploy models once validation is completed, without a committee sign-off step on deployment timing or scope of use. SR 11-7 requires that governance structures provide oversight of the full model lifecycle including deployment; when the commercial lending business unit deploys an AI credit underwriting model at a broader scale than the validation scope covered, the committee has no mechanism to intervene, creating a consent order finding on governance structure effectiveness.',
    keywords: ['SR 11-7', 'MRM committee', 'model governance', 'consent order', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'consent-order',
  },
  {
    code: 'B124',
    name: 'MRM Policy Updated But Not Operationalized — Procedures Not Linked to Lifecycle',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'First Capital revises its model risk management policy to satisfy a consent order policy-update milestone, but the updated policy is not accompanied by revised standard operating procedures, workflow tools, or training. Business unit model owners continue to follow pre-policy practices for model registration, validation scheduling, and monitoring escalation because no procedure manual or system workflow enforces the new policy requirements. OCC examiners distinguish policy from operationalization — a policy document without demonstrable process change does not satisfy a consent order finding on model risk governance.',
    keywords: ['consent order', 'SR 11-7', 'MRM policy', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'consent-order',
  },
  {
    code: 'B125',
    name: 'OCC 2011-12 Model Risk Requirements Met on Paper But Governance Board Inactive',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'First Capital\'s model governance board exists on the organizational chart and has a charter satisfying OCC 2011-12 requirements, but meeting minutes show the board convened only once in the preceding 12 months and no material model risk decisions were escalated to it. The MRM committee operates below the board and resolves issues without escalation; OCC examiners reviewing governance effectiveness cite the absence of active board oversight as evidence that the bank\'s three-lines-of-defense model risk framework is formalistic rather than operational, a qualitative finding not addressed by policy documentation alone.',
    keywords: ['OCC 2011-12', 'model governance', 'SR 11-7', 'consent order', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'consent-order',
  },

  // ── AI / ML SR 11-7 Extension ─────────────────────────────────────────────
  {
    code: 'B126',
    name: 'AI/ML Models Classified as Non-Models to Avoid SR 11-7 Validation',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      'First Capital\'s digital lending unit classifies its ML credit decisioning algorithm as a "rules engine" rather than a model to avoid the SR 11-7 validation cycle and its associated timeline and cost. The OCC\'s SR 11-7 extension guidance clarifies that ML algorithms that generate output used to inform or make decisions — including credit approval, pricing, and fraud detection — meet the SR 11-7 model definition regardless of whether they use traditional statistical methods; the reclassification strategy is overturned at examination, requiring immediate retroactive validation and triggering a consent order milestone breach.',
    keywords: ['SR 11-7', 'AI/ML', 'model inventory', 'model validation', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B127',
    name: 'Vendor AI Credit Underwriting Model Exempt From Internal Validation',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'First Capital relies entirely on the vendor\'s internal model validation documentation for its AI-based small business credit underwriting model, treating vendor attestation as a substitute for the independent validation required under SR 11-7. The vendor\'s validation was conducted on national portfolio data that does not represent First Capital\'s regional commercial customer mix; when the OCC examines First Capital\'s model risk practices, the absence of bank-specific validation — including performance testing on the bank\'s own origination population — is cited as a material SR 11-7 compliance gap and a consent order finding on third-party model risk.',
    keywords: ['SR 11-7', 'vendor AI', 'model validation', 'TPRM', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B128',
    name: 'LLM Used for Regulatory Report Drafting Not in Model Inventory',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'First Capital\'s compliance team adopts a large language model tool to assist in drafting Call Report narratives, HMDA data quality narratives, and OCC examination response letters, treating it as a productivity tool rather than a model. SR 11-7\'s model definition encompasses tools that generate outputs used in regulatory filings; an LLM producing regulatory report text that is filed with the OCC without human reconstruction of the underlying analysis is within scope, and the absence of any model inventory registration, validation, or monitoring constitutes a material model governance gap at the bank\'s next examination.',
    keywords: ['SR 11-7', 'LLM', 'model inventory', 'regulatory reporting', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B129',
    name: 'GenAI Code Assistant Produces Risk Model Code Without MRM Review',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Quantitative analysts at First Capital use a GenAI code assistant to accelerate development of DFAST stress scenario models and CECL vintage analysis tools; the generated code is reviewed for syntax but not for model logic, embedded assumptions, or SR 11-7 compliance. The code assistant can introduce stochastic interpolation methods, regularization choices, and data preprocessing steps that alter the model\'s theoretical basis without being documented in the model development record, creating a conceptual soundness gap that the independent validation unit cannot surface if it reviews documentation rather than code.',
    keywords: ['SR 11-7', 'GenAI', 'model validation', 'DFAST', 'conceptual soundness'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B130',
    name: 'AI Credit Model Adverse-Action Explanation Does Not Reflect AI Decision Logic',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      'First Capital\'s AI credit underwriting model generates FICO-style factor codes for adverse action notices to satisfy Reg B and ECOA requirements, but the factor codes are derived from a surrogate logistic regression fitted to the AI model\'s outputs rather than from the model\'s actual decision logic. The CFPB\'s 2022 guidance and subsequent OCC supervisory expectations require that adverse-action explanations be specific, accurate, and tied to the actual reasons for the credit decision; a surrogate-derived explanation that diverges from the AI model\'s true feature importance creates fair lending examination risk and Reg B compliance exposure.',
    keywords: ['Reg B', 'ECOA', 'adverse action', 'SR 11-7', 'AI/ML'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B131',
    name: 'AI Champion-Challenger Cannot Advance Without Additional Validation Cycle',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'First Capital operates an ML fraud model in champion-challenger configuration where the challenger outperforms the champion on precision and recall in backtesting, but MRM governance policy requires the challenger to undergo a full independent validation before promotion rather than recognizing the ongoing monitoring data as validation evidence. The full validation cycle takes four to six months, by which time the challenger\'s performance advantage may narrow — the policy creates a structural lag between evidence of model superiority and deployment that SR 11-7 guidance allows banks to address through tiered validation proportional to the degree of change.',
    keywords: ['SR 11-7', 'model champion-challenger', 'model validation', 'AI/ML', 'fraud AI'],
    subTopic: 'ai-sr117',
  },
  {
    code: 'B132',
    name: 'DFAST Adverse Scenario Uses AI-Generated Macro Inputs Without Input Validation',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'First Capital\'s DFAST scenario team uses a GenAI forecasting tool to generate supplemental macro variable paths for the adverse scenario, including unemployment, commercial real estate price declines, and credit spreads. The AI-generated macro inputs are fed directly into the CECL and NII stress models without a separate SR 11-7 validation of the input generator itself; an AI tool that generates quantitative inputs material to regulatory capital stress testing is within the SR 11-7 model perimeter, and using unvalidated AI-generated inputs in DFAST without disclosure to the OCC is a model risk governance deficiency.',
    keywords: ['DFAST', 'SR 11-7', 'GenAI', 'model validation', 'stress testing'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B133',
    name: 'Pre-Trained Foundation Model Fine-Tuned for Credit Risk Not Independently Validated',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'First Capital fine-tunes a publicly available language model foundation on internal credit memo text to produce a credit quality scoring signal used alongside the traditional scorecard in underwriting decisioning. The fine-tuned model is not registered in the SR 11-7 inventory, not independently validated by the IVU, and not subject to ongoing performance monitoring; the OCC\'s SR 11-7 extension guidance explicitly includes foundation model fine-tunes used in high-risk decisions within the model validation perimeter, making the bank\'s position — that the base model provider\'s documentation is sufficient — untenable at examination.',
    keywords: ['SR 11-7', 'LLM', 'model validation', 'model inventory', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B134',
    name: 'AML Graph AI Model Outside Validation Scope — Treated as Rules Augmentation',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'First Capital deploys a graph-based AI model that analyzes transaction network topology to detect money laundering typologies; the model is classified as a supplementary rules-augmentation tool by the AML compliance team to avoid the SR 11-7 validation cycle. When the graph AI model\'s alert suppression logic causes it to suppress SAR-candidate alerts for a human trafficking network that is later discovered by law enforcement, the OCC and FinCEN examine the model\'s validation history and find no SR 11-7 registration, no independent validation, and no performance monitoring — a multi-agency finding that feeds into the consent order remediation.',
    keywords: ['SR 11-7', 'AML', 'graph AI', 'model inventory', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B135',
    name: 'Vendor Fraud AI Monitoring Thresholds Not Calibrated to Bank Population',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'First Capital\'s vendor-provided fraud AI model is configured with default alert thresholds calibrated to the vendor\'s aggregate bank client portfolio, which skews toward large national banks with different card product mixes and regional risk profiles than First Capital\'s community bank customer base. SR 11-7 model monitoring requirements apply to models in use regardless of source; the bank\'s failure to recalibrate thresholds to its own population results in a false-negative rate 40% above the vendor\'s published benchmark, which OCC examiners identify by comparing First Capital\'s reported fraud rates against peer group data.',
    keywords: ['SR 11-7', 'fraud AI', 'model monitoring', 'vendor model', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },

  // ── DFAST / CCAR / Capital Models ─────────────────────────────────────────
  {
    code: 'B136',
    name: 'DFAST Severe Adverse Scenario Not Updated After 2022–2024 Rate Environment',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'First Capital\'s DFAST severe adverse scenario was last comprehensively updated in 2021 and incorporates a rate path peaking at 2.5% — materially below the actual Fed funds rate trajectory that reached 5.25–5.50% through 2023–2024. A severe adverse scenario designed for a low-rate environment cannot stress test the bank\'s rate-sensitive deposit franchise, commercial real estate concentration, or floating-rate loan portfolio under the conditions that characterized the most significant banking stress since 2008; the OCC\'s DFAST guidance requires scenarios to reflect plausible near-term adverse conditions, and using an outdated scenario produces capital projections that understate tail risk.',
    keywords: ['DFAST', 'SR 11-7', 'stress testing', 'OCC examination', 'interest rate risk'],
    demoRelevant: true,
    subTopic: 'capital-models',
  },
  {
    code: 'B137',
    name: 'CCAR Capital Model Relies on Pre-Pandemic Prepayment Behavior Assumptions',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'First Capital\'s CCAR capital model for the mortgage portfolio incorporates a prepayment speed model calibrated on 2010–2019 refinance behavior, where borrowers prepaid aggressively in response to small rate declines. Post-pandemic borrower lock-in — where existing mortgage holders with sub-3% rates show near-zero prepayment propensity regardless of rate incentives — invalidates the pre-pandemic behavioral assumptions; the CECL and NII projections for the mortgage book systematically overestimate prepayment and underestimate duration extension in a rate-up scenario.',
    keywords: ['CCAR', 'CECL', 'prepayment model', 'SR 11-7', 'interest rate risk'],
    subTopic: 'capital-models',
  },
  {
    code: 'B138',
    name: 'Management Stress Overlay Applied Without SR 11-7 Model Documentation',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'First Capital\'s DFAST process includes a qualitative management overlay that adjusts the model-generated stressed loss estimates by 15–30% to reflect portfolio-specific risks that the quantitative models are judged to underestimate, but the overlay methodology is not documented as a model under SR 11-7, has no independent validation, and is applied through a management discretion process with no repeatable quantitative basis. SR 11-7 guidance addresses adjustments and overlays explicitly — any systematic quantitative adjustment that influences regulatory capital or provision estimates is within the model risk framework and requires documentation and governance.',
    keywords: ['DFAST', 'SR 11-7', 'stress testing', 'management overlay', 'model documentation'],
    demoRelevant: true,
    subTopic: 'capital-models',
  },
  {
    code: 'B139',
    name: 'CECL Allowance Committee Overrides Model Without Formal Challenge Process',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'First Capital\'s CECL allowance committee routinely adjusts the quantitative model output by applying qualitative factors that can move the reported allowance by up to 20% relative to the model estimate, but no formal challenge process requires the committee to document the basis for the adjustment, compare it against external benchmarks, or obtain MRM validation team sign-off when adjustments exceed a defined materiality threshold. OCC examiners reviewing the allowance methodology cite the absence of a documented challenge process as a weakness in the CECL governance framework, noting that qualitative overlays applied without rigor can mask model degradation.',
    keywords: ['CECL', 'SR 11-7', 'MRM committee', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'capital-models',
  },
  {
    code: 'B140',
    name: 'DFAST Satellite Models Not Validated as Part of Aggregate Capital Model Suite',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'First Capital\'s DFAST capital model suite includes a primary NII model and a credit loss model, both of which are validated independently, but several satellite models — a fee revenue model, an operational loss model, and a pre-provision net revenue model — feed into the aggregate capital projection and are not included in any validation scope. SR 11-7 requires that all models used in the capital planning process be subject to governance standards proportional to their materiality; omitting satellite models from the validation framework allows errors to propagate into the final capital estimate without detection.',
    keywords: ['DFAST', 'SR 11-7', 'model validation', 'capital planning', 'stress testing'],
    subTopic: 'capital-models',
  },

  // ── Documentation & Governance ────────────────────────────────────────────
  {
    code: 'B141',
    name: 'Model Documentation Not Updated After Material Model Change',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'First Capital\'s credit concentration model was materially recalibrated following a change in the commercial real estate concentration limit framework, but the model development document (MRM-1) still reflects the prior parameterization. SR 11-7 requires model documentation to be current and accurate; when the independent validation unit initiates a scheduled validation of the model, the MRM-1 document does not match the code in production, forcing the validation team to reverse-engineer the model\'s current logic from the production codebase — consuming additional validation resources and creating a documentation version mismatch that OCC examiners flag.',
    keywords: ['SR 11-7', 'model documentation', 'model governance', 'OCC examination', 'independent validation unit'],
    demoRelevant: true,
    subTopic: 'documentation',
  },
  {
    code: 'B142',
    name: 'Model Retirement Process Absent — Obsolete Models Accumulate Latent Risk',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'First Capital\'s MRM framework defines processes for model development, validation, and monitoring but includes no formal model retirement process. Thirteen models that have been replaced by more current versions remain in the inventory as active, with running monitoring reports, consuming validation resources and creating confusion about which model version is authoritative for a given use case. SR 11-7 requires a complete model lifecycle framework; the absence of retirement governance means models can remain technically active long after they cease to drive decisions, creating an inflated inventory that obscures genuine model risk exposure.',
    keywords: ['SR 11-7', 'model retirement', 'model inventory', 'model governance', 'OCC 2011-12'],
    subTopic: 'documentation',
  },
  {
    code: 'B143',
    name: 'New Product Approval Process Does Not Include MRM Sign-Off',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'First Capital\'s new product approval committee reviews credit, compliance, operational, and legal risk when approving new lending products but does not include a mandatory MRM sign-off step. When digital banking launches a buy-now-pay-later product that relies on a new ML credit scoring model, the product goes live without the scoring model passing SR 11-7 validation; OCC examiners reviewing the product launch find that the bank offered a regulated credit product whose decisioning model had not been validated, combining consumer compliance risk with model governance deficiency.',
    keywords: ['SR 11-7', 'new product approval', 'model governance', 'OCC examination', 'ML credit model'],
    demoRelevant: true,
    subTopic: 'documentation',
  },
  {
    code: 'B144',
    name: 'Model Risk Appetite Not Defined — No Quantitative Limit on Aggregate Model Uncertainty',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'First Capital\'s risk appetite framework defines quantitative limits for credit, market, liquidity, and operational risk but does not include a model risk appetite statement with measurable limits — such as a maximum acceptable aggregate model uncertainty range for CECL allowance or DFAST capital projections. SR 11-7 and OCC supervisory expectations require model risk to be integrated into the risk appetite framework so that the board and senior management have a defined tolerance for model-driven uncertainty; without quantitative limits, the MRM committee has no basis for escalating aggregate model risk to the board.',
    keywords: ['SR 11-7', 'model risk appetite', 'model governance', 'OCC 2011-12', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'documentation',
  },
  {
    code: 'B145',
    name: 'Model Validation Reports Lack Minimum Required Sections Under SR 11-7',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Validation reports for several of First Capital\'s tier-2 models omit the conceptual soundness, data quality assessment, or outcomes analysis sections that SR 11-7 identifies as core validation components, relying instead on abbreviated scope justifications referencing the model\'s low materiality tier. OCC examiners reviewing a cross-section of validation reports find that the abbreviated format was applied inconsistently and that three models classified as low-materiality are used in DFAST inputs, making the truncated validation scope inappropriate given actual use.',
    keywords: ['SR 11-7', 'model validation', 'OCC examination', 'model documentation', 'conceptual soundness'],
    subTopic: 'documentation',
  },
  {
    code: 'B146',
    name: 'Third-Party Model Risk Due Diligence Not Integrated Into TPRM Framework',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'First Capital\'s third-party risk management program conducts vendor due diligence covering cybersecurity, business continuity, and financial stability but does not assess SR 11-7 model risk controls at AI and analytics vendors. When the bank\'s credit bureau data vendor changes its scoring model methodology without notifying First Capital, the bank continues to rely on the old model documentation for its SR 11-7 inventory record; the model risk governance gap is discovered when the IVU attempts to validate the refreshed credit score and finds that the production model no longer matches the documented model.',
    keywords: ['TPRM', 'SR 11-7', 'model inventory', 'vendor model', 'model documentation'],
    demoRelevant: true,
    subTopic: 'documentation',
  },
  {
    code: 'B147',
    name: 'BCBS 239 Data Lineage Requirements Not Met for Risk Model Inputs',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'First Capital\'s DFAST and CECL models consume data aggregated from core banking, loan origination, and treasury systems, but the data lineage from source system through transformation to model input is not documented at the field level as required by BCBS 239 principles for risk data aggregation. When the IVU attempts to validate the data quality section of the CECL model, it cannot trace discrepancies between the model input dataset and the core system source records, making the data quality assessment inconclusive and triggering an open validation finding on data integrity.',
    keywords: ['BCBS 239', 'SR 11-7', 'model validation', 'CECL', 'data lineage'],
    subTopic: 'documentation',
  },
  {
    code: 'B148',
    name: 'Model Change Policy Does Not Define Materiality Threshold for Full Re-Validation',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'First Capital\'s MRM policy references a model change management process but does not define quantitative criteria for distinguishing minor parameter updates from material model changes requiring full re-validation under SR 11-7. Model owners exercise discretion in classifying changes, consistently characterizing recalibrations as minor to avoid triggering a full validation cycle; OCC examiners reviewing change management records find multiple instances where recalibrations that changed model output distributions by more than 10% were classified as minor changes, bypassing the validation requirement.',
    keywords: ['SR 11-7', 'model governance', 'model documentation', 'OCC examination', 'model validation'],
    demoRelevant: true,
    subTopic: 'documentation',
  },

  // ── Extended AI/ML and Cross-Cutting Patterns ─────────────────────────────
  {
    code: 'B149',
    name: 'ML Credit Model Fair Lending Testing Not Included in Validation Scope',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      'First Capital\'s independent validation of its ML small business credit model covers predictive performance and conceptual soundness but does not include disparate impact testing across race, national origin, or sex as proxy variables, despite the model\'s use in automated credit decisioning. The CFPB and OCC expect that validation of models used in consumer and small business credit decisions explicitly tests for disparate impact consistent with Reg B and ECOA requirements; the absence of fair lending analysis in the validation scope is cited at examination as a gap in the bank\'s fair lending model risk governance.',
    keywords: ['Reg B', 'ECOA', 'SR 11-7', 'model validation', 'ML credit model'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B150',
    name: 'Model Risk Second Line Does Not Have Budget Authority for Validation Resources',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'First Capital\'s MRM second line function is responsible for validation quality but does not control its own staffing or budget — both are managed by the CFO organization alongside the first-line business units that own the models being validated. When the bank\'s model portfolio grows by 30 models following the digital transformation program, the IVU cannot increase its validation throughput because budget requests are deprioritized in favor of business unit technology investments; the validation backlog grows to 18 overdue validations, creating a systemic SR 11-7 compliance gap that the consent order exacerbates.',
    keywords: ['SR 11-7', 'independent validation unit', 'model governance', 'consent order', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'consent-order',
  },
  {
    code: 'B151',
    name: 'Stress Test Model Aggregation Logic Not Documented — Results Cannot Be Reproduced',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'First Capital\'s DFAST submission aggregates credit loss, NII, fee revenue, and operational loss projections across business lines using a consolidation spreadsheet maintained by the CFO team; the aggregation logic, elimination entries, and manual adjustments embedded in the spreadsheet are not documented as part of the SR 11-7 model documentation suite. When the OCC requests documentation supporting the aggregation methodology, the bank cannot produce a reproducible process description, and the spreadsheet\'s VBA macros contain undocumented logic that the validation team cannot independently verify.',
    keywords: ['DFAST', 'SR 11-7', 'model documentation', 'stress testing', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'capital-models',
  },
  {
    code: 'B152',
    name: 'Interest Rate Risk Model Uses Vendor Black-Box — No Access to Methodology',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'First Capital\'s interest rate risk model for economic value of equity (EVE) and net interest income (NII) sensitivity runs on a vendor platform where the prepayment, deposit repricing, and option-adjusted spread algorithms are proprietary and not disclosed to the bank. SR 11-7 requires that banks be able to understand and challenge the models they use, including vendor models; a black-box vendor model for which the bank cannot access methodology documentation, reproduce outputs from inputs, or perform sensitivity analysis independently cannot satisfy the conceptual soundness and independent validation requirements.',
    keywords: ['SR 11-7', 'interest rate risk', 'vendor model', 'model validation', 'TPRM'],
    subTopic: 'model-validation',
  },
  {
    code: 'B153',
    name: 'Credit Loss Model LGD Assumptions Not Updated for Post-Pandemic Recovery Rates',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'First Capital\'s CECL credit loss model uses LGD assumptions calibrated on historical recovery rates from the 2008–2015 period, which saw elevated recoveries on commercial real estate collateral as asset prices recovered. Post-2022 commercial real estate price declines — particularly in office and retail segments — imply structurally lower recovery rates than the historical calibration period, but the LGD assumption has not been updated through model monitoring or a formal model recalibration; the CECL allowance is systematically understated in segments with office and retail CRE exposure.',
    keywords: ['CECL', 'LGD', 'SR 11-7', 'model monitoring', 'commercial real estate'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B154',
    name: 'Model Validation Finding Remediation Tracked in Email — No Governance System of Record',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Open model validation findings are communicated via email between the IVU and model owners, with status updates tracked in a spreadsheet maintained by the MRM governance team. When the MRM consent order requires First Capital to demonstrate that all high-priority validation findings are remediated within 90 days, the bank cannot produce a complete and current status record from a system of record, relying instead on a manually maintained spreadsheet that contains inconsistent status entries and unresolved conflicts between IVU and model owner assessments of finding closure.',
    keywords: ['SR 11-7', 'model governance', 'consent order', 'independent validation unit', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'documentation',
  },
  {
    code: 'B155',
    name: 'Deposit Behavior Model Not Re-Validated After Surge Deposit Runoff',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'First Capital\'s deposit behavior model, which drives DFAST NII projections and internal liquidity stress testing, was last validated in 2021 using a deposit base inflated by pandemic-era stimulus deposits. The subsequent 2022–2023 deposit runoff — driven by rate normalization and competitive pressure from money market funds — represents a structural shift that invalidates core model assumptions about deposit beta, non-maturity deposit duration, and core deposit premium; no model recalibration trigger fires because monitoring alert thresholds were not set to detect regime-level behavioral shifts.',
    keywords: ['DFAST', 'SR 11-7', 'model monitoring', 'interest rate risk', 'BCBS 239'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B156',
    name: 'GenAI Document Summarization Used in Credit Memo Process Without Validation',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'First Capital\'s commercial lending unit uses a GenAI tool to summarize borrower financial statements and generate covenant compliance analyses embedded in credit memos that are presented to the credit committee. The GenAI tool is not registered in the SR 11-7 model inventory because it is classified as a productivity aid rather than a credit decision model; however, credit committee members report relying on the GenAI summaries rather than the underlying financials in a material proportion of approvals, making the tool a functional input to credit decisions and therefore within the SR 11-7 model governance perimeter.',
    keywords: ['SR 11-7', 'GenAI', 'model inventory', 'credit risk', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-sr117',
  },
  {
    code: 'B157',
    name: 'Model Risk Reporting to Board Lacks Aggregate Exposure Quantification',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'First Capital\'s quarterly model risk report to the board of directors lists the number of models by tier, validation status, and open findings but does not quantify the aggregate financial exposure attributable to model uncertainty — for example, the range of CECL allowance or DFAST capital outcomes across the distribution of model uncertainty. OCC supervisory expectations under SR 11-7 require board-level model risk reporting to enable informed oversight of aggregate model risk; a count-based report without financial impact quantification does not satisfy the substance of board governance responsibility for model risk.',
    keywords: ['SR 11-7', 'model governance', 'MRM committee', 'OCC 2011-12', 'CECL'],
    demoRelevant: true,
    subTopic: 'documentation',
  },
  {
    code: 'B158',
    name: 'AML Transaction Monitoring Threshold Tuning Not Subject to SR 11-7 Validation',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      'First Capital tunes its AML transaction monitoring alert thresholds annually to reduce false positives, treating threshold adjustments as a compliance operations activity rather than a model change subject to SR 11-7 governance. The threshold tuning process uses a data-driven methodology that systematically adjusts the statistical boundary above which transactions generate alerts; SR 11-7 encompasses model parameter adjustments that materially change model output distributions, and annual threshold tuning that reduces alert volume by 30–40% is a material model change requiring validation documentation and IVU sign-off.',
    keywords: ['SR 11-7', 'AML', 'model monitoring', 'model governance', 'consent order'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B159',
    name: 'SR 11-7 Self-Assessment Annual Certification Not Linked to Exam Evidence',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'First Capital\'s MRM function completes an annual SR 11-7 self-assessment that rates model governance maturity across inventory, validation, monitoring, and governance dimensions, but the self-assessment ratings are not linked to specific examination-ready evidence artifacts — policy documents, validation reports, committee minutes — that would substantiate each rating. When OCC examiners request evidence supporting the bank\'s self-reported "satisfactory" rating for model inventory completeness, management cannot immediately produce a reconciliation between the inventory and production systems, exposing the self-assessment as aspirational rather than evidence-based and undermining the bank\'s examination posture under the consent order.',
    keywords: ['SR 11-7', 'OCC examination', 'model governance', 'consent order', 'model inventory'],
    demoRelevant: true,
    subTopic: 'consent-order',
  },
];
