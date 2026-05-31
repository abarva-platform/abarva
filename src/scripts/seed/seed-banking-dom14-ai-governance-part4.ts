// seed-banking-dom14-ai-governance-part4.ts
// Banking genome patterns — AI Governance (dom14)
// Code range: B4180–B4239  (60 patterns)
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

export const BANKING_DOM14_AI_GOVERNANCE_PART4_PATTERNS: PatternSeed[] = [

  // ── AI Regulatory Compliance ─────────────────────────────────────────────

  {
    code: 'B4180',
    name: 'EU AI Act High-Risk Classification Gap in Lending',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital operates AI-assisted credit scoring models for consumer and SME
      lending that the EU AI Act classifies as high-risk AI systems under Annex III because they
      affect individuals' access to financial services. The bank's AI compliance programme has
      not completed a conformity assessment, appointed an EU-qualified person responsible, or
      registered the systems in the EU AI Act database, leaving the institution exposed to fines
      of up to €30 million or 6% of annual global turnover. No internal mapping of existing
      models to EU AI Act risk tiers has been completed, and the bank's legal team has not
      issued a binding determination on whether the Act's territorial scope applies to
      cross-border EU retail customers.`,
    keywords: ['eu-ai-act', 'high-risk-ai', 'conformity-assessment', 'credit-scoring', 'regulatory-compliance'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4181',
    name: 'EU AI Act Technical Documentation Requirements Not Met',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's high-risk AI systems used in loan origination and credit risk
      decisioning lack the technical documentation mandated by EU AI Act Article 11, including
      a description of system architecture, training data governance, performance metrics,
      risk management procedures, and post-market monitoring plans. The documentation gap
      means that the bank cannot demonstrate conformity to notified bodies, national competent
      authorities, or market surveillance authorities, creating liability for systems already
      in production. The bank's MRM documentation framework predates the EU AI Act and does
      not include the Act's mandatory Annex IV documentation elements.`,
    keywords: ['eu-ai-act', 'technical-documentation', 'annex-iv', 'conformity', 'mrc-gap'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4182',
    name: 'CFPB AI Examination Readiness Gaps in Adverse Action',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description: `First Capital's CFPB examination readiness assessment for AI-driven adverse
      action notice generation reveals that the bank cannot produce a complete audit trail
      linking each adverse action code to the specific AI model feature values that drove
      the decision for a given applicant. CFPB supervisory guidance on AI in credit decisions
      requires that creditors relying on AI for adverse action notice generation maintain
      explainability documentation sufficient to demonstrate Reg B compliance during
      examination, and the bank's current SHAP-based explanation system does not map
      directly to the seven CFPB-recognized adverse action reason categories.`,
    keywords: ['cfpb-examination', 'adverse-action', 'reg-b', 'ai-explainability', 'shap'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4183',
    name: 'CFPB UDAAP AI Supervision Readiness Deficiency',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description: `First Capital's AI governance programme has not mapped CFPB UDAAP supervisory
      expectations onto existing AI use cases that generate consumer-facing communications,
      fee assessments, and product recommendations. The CFPB's 2023 UDAAP examination
      procedures explicitly include AI-driven decision systems as subject to unfair, deceptive,
      or abusive standards, but the bank's UDAAP compliance programme still treats AI outputs
      as pass-through from the product owners who configure the AI rather than direct bank
      conduct subject to examination. CFPB examiners reviewing the bank's digital engagement
      AI identified three instances of AI-generated fee assessment language that could
      constitute deceptive acts or practices under the UDAAP standard.`,
    keywords: ['cfpb-udaap', 'ai-supervision', 'consumer-protection', 'fee-assessment', 'deceptive-practices'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4184',
    name: 'OCC AI Non-Objection Process Gap for New Use Cases',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `First Capital has deployed four AI use cases in credit underwriting and
      fraud detection without completing the OCC's AI non-objection process outlined in
      OCC Bulletin 2021-38 and subsequent examination guidance. The bank's AI governance
      committee approved the deployments based on internal model risk management sign-off
      but did not engage the OCC's supervisory office prior to production release, creating
      a supervisory relationship gap. When the OCC conducted a targeted AI governance
      examination, examiners noted the absence of pre-deployment OCC engagement as a
      governance control failure requiring a commitment letter with remediation timeline.`,
    keywords: ['occ-non-objection', 'ai-governance', 'supervisory-engagement', 'model-deployment', 'examination-gap'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4185',
    name: 'OCC Safe and Sound AI Standards Not Documented',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description: `First Capital's AI governance framework lacks a documented mapping to OCC
      safe and sound standards for AI as articulated in the OCC's AI risk management guidance,
      leaving the bank unable to demonstrate to examiners that its AI risk management
      programme satisfies the safety and soundness expectations that the OCC applies to
      national banks. The gap is particularly material for AI models used in capital
      estimation, liquidity risk management, and interest rate risk modelling, where
      the OCC expects a clear nexus between model risk management controls and
      capital adequacy. Board-approved risk appetite documents do not reference
      OCC AI guidance.`,
    keywords: ['occ-safe-sound', 'ai-risk-management', 'capital-adequacy', 'board-risk-appetite', 'examination-readiness'],
    demoRelevant: false,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4186',
    name: 'NY DFS AI Circular Compliance Gap in Credit Underwriting',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description: `First Capital's New York state-chartered operations are subject to the
      NY DFS circular letter on AI and external data in insurance and financial services,
      which requires that AI systems used in underwriting and credit decisions document
      data sources, assess proxy discrimination risk, and implement a consumer complaint
      process for AI-driven decisions. The bank's compliance team has not issued a legal
      opinion on the circular's applicability to state-chartered banking operations and
      has not mapped the circular's requirements onto existing credit AI systems,
      creating regulatory exposure with the DFS.`,
    keywords: ['ny-dfs', 'ai-circular', 'proxy-discrimination', 'credit-underwriting', 'state-regulation'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4187',
    name: 'NY DFS AI Bias Testing for Protected Class Proxies Not Completed',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description: `First Capital's NY DFS compliance programme has not completed proxy
      discrimination analysis for the six AI models used in consumer lending
      underwriting and pricing, despite the NY DFS AI circular's explicit
      requirement that institutions assess whether AI input variables act
      as proxies for race, gender, national origin, or other protected class
      characteristics. The bank's fair lending team lacks the AI-specific
      methodological framework to perform proxy variable analysis on gradient
      boosted tree models with high feature counts, and the external fair
      lending vendor has not been engaged for proxy testing.`,
    keywords: ['ny-dfs', 'proxy-discrimination', 'fair-lending', 'gradient-boost', 'protected-class'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4188',
    name: 'FDIC AI-Assisted Examination Preparation Errors',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description: `First Capital uses an AI-assisted tool to prepare examination response packages
      for FDIC community reinvestment, safety and soundness, and IT examinations. In two
      consecutive examination cycles the AI tool misclassified CRA-eligible activities,
      produced inaccurate balance sheet summaries, and generated responses citing superseded
      examination guidance. The bank's examination management team did not have a structured
      review protocol for AI-generated examination responses, and the errors were discovered
      by FDIC examiners rather than internal review, damaging the bank's examiner relationship
      and triggering a post-examination corrective action commitment.`,
    keywords: ['fdic-examination', 'ai-preparation', 'cra', 'examination-response', 'accuracy-error'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4189',
    name: 'FDIC IT Examination AI Security Controls Assessment Gap',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description: `First Capital's FDIC IT examination preparation does not include an AI-specific
      security controls narrative, leaving the bank unable to articulate to FDIC IT examiners
      how cybersecurity controls, access management, data integrity, and incident response
      apply to AI systems in production. The FDIC's IT examination handbook has been updated
      to include AI and machine learning systems as a distinct examination topic, and the
      bank's IT risk team has not completed a gap assessment against the handbook's
      AI-specific control objectives.`,
    keywords: ['fdic-it-examination', 'ai-security', 'access-management', 'incident-response', 'control-objectives'],
    demoRelevant: false,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4190',
    name: 'Federal Reserve SR 11-7 Annual Validation Backlog for AI Models',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital has accumulated a 14-model annual validation backlog under SR 11-7
      for AI models used in DFAST stress scenarios, BSA/AML transaction monitoring, and
      consumer credit decisioning. The backlog exists because model validation resource
      capacity has not scaled with the AI model portfolio and because GenAI use cases
      added in the prior 18 months have not been scheduled for independent validation.
      Federal Reserve examiners reviewing the bank's model risk management programme
      noted the validation backlog as a systemic governance gap and issued a Matter
      Requiring Attention requiring a validation resource plan with board approval
      within 90 days.`,
    keywords: ['sr-11-7', 'annual-validation', 'validation-backlog', 'federal-reserve', 'mra'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4191',
    name: 'ECOA AI Decision Audit Trail Insufficient for Examination',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description: `First Capital's AI-assisted mortgage underwriting system does not maintain
      an ECOA-compliant audit trail that records the specific AI model version, input
      feature values, and confidence scores associated with each application decision.
      CFPB examination procedures require that creditors using AI in credit decisions
      maintain records sufficient to demonstrate that the decision-making process
      complied with ECOA and Reg B, and the bank's current audit log captures only
      the final decision code and approval status without the intermediate AI outputs
      that drove the decision.`,
    keywords: ['ecoa', 'audit-trail', 'mortgage-underwriting', 'reg-b', 'ai-decision-records'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4192',
    name: 'BSA/AML AI System Not in Scope of Formal Examination Readiness',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description: `First Capital's BSA/AML transaction monitoring platform uses an AI-based
      alert scoring model that has not been included in the bank's formal examination
      readiness programme despite FinCEN and OCC guidance confirming that AI in
      BSA/AML surveillance systems is subject to examination. The AI scoring model
      was procured as a vendor feature upgrade and classified under TPRM rather than
      MRM, resulting in no SR 11-7 validation, no examination readiness documentation,
      and no performance benchmarking against the legacy rule-based system it supplemented.`,
    keywords: ['bsa-aml', 'transaction-monitoring', 'ai-alert-scoring', 'fincen', 'examination-readiness'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4193',
    name: 'CRA AI-Assisted Assessment Methodology Not Disclosed',
    officeCategory: 'front_office',
    failureRatePct: 44,
    description: `First Capital uses an AI model to assist in identifying CRA-eligible assessment
      area activities and assigning credit values to community development investments, but
      the methodology underpinning the AI's CRA eligibility classifications has not been
      documented in a form reviewable by FDIC examiners. The CRA final rule and FDIC
      examination expectations require that institutions using AI or automated tools in
      CRA programme management disclose the methodology and demonstrate that AI outputs
      are subject to human review before CRA credit claims are finalised.`,
    keywords: ['cra', 'ai-eligibility', 'community-development', 'fdic', 'methodology-disclosure'],
    demoRelevant: false,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4194',
    name: 'EU GDPR Automated Decision-Making Compliance Gap for AI',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `First Capital's AI credit scoring and fraud detection systems operating
      in EU-served markets are subject to GDPR Article 22, which prohibits solely
      automated decisions producing legal or significant effects on individuals without
      meaningful human review, explicit consent, or a contractual necessity ground.
      The bank's privacy team has not conducted a GDPR Article 22 assessment for
      each AI system and has not implemented the required safeguards, including the
      right to human review, contestation, and explanation of the basis for automated
      decisions. Supervisory authority inquiries have not been proactively addressed.`,
    keywords: ['gdpr-article-22', 'automated-decision', 'eu-privacy', 'human-review', 'right-to-explanation'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4195',
    name: 'OFAC AI Sanctions Screening False-Negative Rate Not Validated',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description: `First Capital's OFAC sanctions screening platform incorporates an AI
      name-matching component that has not been independently validated for false-negative
      rates since it was upgraded 18 months ago. OFAC compliance examination procedures
      require that institutions validate the effectiveness of sanctions screening
      systems, and AI-augmented screening tools are subject to the same accuracy and
      completeness standards as rule-based systems. The bank's compliance team cannot
      produce a current false-negative rate estimate, creating regulatory exposure if
      a sanctions violation is attributed to an unvalidated AI screening component.`,
    keywords: ['ofac', 'sanctions-screening', 'false-negative', 'ai-validation', 'name-matching'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4196',
    name: 'Volcker Rule AI Trading Surveillance Validation Gap',
    officeCategory: 'middle_office',
    failureRatePct: 47,
    description: `First Capital's Volcker Rule proprietary trading surveillance system uses
      an ML classification model to flag potential proprietary trading activity in the
      market-making book. The model has not been validated against an independent test
      dataset since its initial deployment, and the bank has not assessed whether model
      drift has degraded its ability to detect the trading patterns that regulators
      associate with prohibited proprietary trading. Federal Reserve and OCC Volcker
      Rule examination teams have access to the surveillance output and the absence
      of validation documentation is a material gap.`,
    keywords: ['volcker-rule', 'trading-surveillance', 'ml-validation', 'proprietary-trading', 'model-drift'],
    demoRelevant: false,
    subTopic: 'ai-regulatory-compliance',
  },
  {
    code: 'B4197',
    name: 'Regulation E AI Dispute Resolution Classification Error Rate',
    officeCategory: 'front_office',
    failureRatePct: 56,
    description: `First Capital uses an AI model to classify consumer dispute claims submitted
      under Regulation E, routing disputes to different resolution workflows based on predicted
      claim type and fraud likelihood. An internal audit found that the AI's classification
      error rate of 8.4% results in Reg E disputes being routed to incorrect resolution
      workflows, causing resolution timeline violations and a pattern of delayed provisional
      credit that exposes the bank to CFPB examination findings. The AI model was deployed
      without SR 11-7 validation and without a Reg E compliance review of the classification
      logic.`,
    keywords: ['regulation-e', 'dispute-resolution', 'ai-classification', 'cfpb', 'provisional-credit'],
    demoRelevant: true,
    subTopic: 'ai-regulatory-compliance',
  },

  // ── AI Procurement Governance ────────────────────────────────────────────

  {
    code: 'B4198',
    name: 'AI Vendor RFP Without Model Risk Assessment Requirements',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: `First Capital's procurement RFP template for AI vendor selection does not
      include mandatory requirements for vendor-provided SR 11-7 model documentation,
      third-party validation attestation, or model performance benchmarking data, allowing
      AI vendors to be selected based solely on commercial factors without model risk
      governance evaluation. When the OCC reviewed three AI vendor contracts executed in
      the prior fiscal year, none of the RFP packages included requests for SR 11-7
      compliance documentation, and the vendor contracts do not obligate vendors to
      provide model documentation to the bank's model risk management function.`,
    keywords: ['ai-rfp', 'vendor-selection', 'sr-11-7', 'procurement-governance', 'model-documentation'],
    demoRelevant: true,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4199',
    name: 'AI Tool Procurement Without Model Risk Management Assessment',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description: `First Capital's technology procurement process does not route AI tool
      acquisitions through the model risk management function as a mandatory step before
      contract execution. Business units have procured fourteen AI tools in the past
      two years — covering HR analytics, marketing personalisation, and compliance
      monitoring — without any of the tools receiving an MRM assessment for SR 11-7
      applicability, fair lending implications, or data governance requirements.
      The OCC's AI risk management guidance requires that institutions apply model
      risk management principles to AI tools used in decisions affecting consumers
      and the bank's risk profile.`,
    keywords: ['ai-procurement', 'mrm-assessment', 'sr-11-7-applicability', 'business-unit', 'governance-bypass'],
    demoRelevant: true,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4200',
    name: 'AI Contract IP Ownership Ambiguity for Bank-Specific Models',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `First Capital's AI vendor contracts do not clearly define intellectual property
      ownership for models fine-tuned or customised on the bank's proprietary data, including
      customer transaction history, internal credit performance data, and regulatory reporting
      data. Three AI vendor agreements contain clauses permitting the vendor to use bank-
      provided fine-tuning data to improve the vendor's general model capabilities,
      potentially exposing confidential customer data and proprietary credit performance
      intelligence to competitive exploitation. The bank's legal team has not issued
      AI-specific IP guidance for procurement negotiations.`,
    keywords: ['ai-contract', 'ip-ownership', 'fine-tuning', 'vendor-data-use', 'proprietary-data'],
    demoRelevant: true,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4201',
    name: 'AI Vendor Liability Gaps for AI-Driven Decision Errors',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description: `First Capital's AI vendor contracts contain broad limitation-of-liability
      clauses that effectively transfer all regulatory and legal liability for AI-driven
      decision errors to the bank, even when the error originates from vendor model defects,
      training data quality issues, or silent model updates. FFIEC guidance is explicit that
      regulatory responsibility for AI decisions affecting consumers rests with the supervised
      institution regardless of vendor involvement, but the contracts do not establish
      indemnification obligations or model performance warranties that would provide
      contractual recourse when vendor AI defects cause regulatory violations.`,
    keywords: ['ai-liability', 'vendor-contract', 'indemnification', 'regulatory-responsibility', 'model-defect'],
    demoRelevant: true,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4202',
    name: 'AI SaaS Vendor Data Residency Not Validated for Regulatory Compliance',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `First Capital's AI SaaS vendor contracts do not specify or enforce data
      residency requirements, and three vendors process bank customer data in cloud regions
      that may not satisfy OCC data governance expectations, state data privacy laws,
      or EU GDPR data transfer restrictions for EU-related customer accounts. The bank's
      TPRM programme reviewed the vendors for general data security but did not assess
      AI-specific data residency risks, including the risk that training data derived from
      bank customer data is stored or processed in jurisdictions with different regulatory
      protections.`,
    keywords: ['data-residency', 'ai-saas', 'cloud-governance', 'gdpr-transfer', 'tprm-gap'],
    demoRelevant: false,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4203',
    name: 'AI Procurement Steering Committee Does Not Include Risk Function',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's AI procurement steering committee is composed of technology,
      operations, and business line representatives but does not include mandatory participation
      from model risk management, compliance, or legal. This governance gap allows AI
      procurement decisions to be made without real-time input from the functions responsible
      for SR 11-7 compliance, fair lending, data privacy, and regulatory examination readiness.
      The OCC's AI governance examination approach specifically looks for evidence that risk
      management functions are integrated into AI procurement governance rather than
      consulted after contracts are executed.`,
    keywords: ['procurement-governance', 'steering-committee', 'mrm-integration', 'compliance-input', 'occ-governance'],
    demoRelevant: false,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4204',
    name: 'AI Vendor Concentration Risk Not Assessed',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description: `First Capital has concentrated 63% of its AI decision systems on APIs
      from two foundation model vendors, creating a third-party concentration risk that
      has not been formally assessed or reported to the board. A service outage, pricing
      change, or regulatory action against either vendor could simultaneously impair
      credit decisioning, fraud detection, and compliance monitoring capabilities.
      The OCC and FDIC's third-party risk management guidance requires that institutions
      assess and manage concentration risk for critical third parties, and AI infrastructure
      vendors that power material bank decisions qualify as critical third parties.`,
    keywords: ['vendor-concentration', 'third-party-risk', 'foundation-model', 'critical-service', 'occ-tprm'],
    demoRelevant: true,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4205',
    name: 'AI Tool Sunset and Off-boarding Governance Gap',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description: `First Capital does not have a formal AI tool sunset and off-boarding governance
      process, resulting in three legacy AI tools remaining in limited production use after
      the primary contracts expired. These legacy tools process customer data under expired
      data processing agreements, operate without current vendor support or security patching,
      and retain access to production data systems through credentials that were not deprovisioned
      when the tools were deemed end-of-life. The absence of AI lifecycle governance creates
      data security and regulatory compliance risks.`,
    keywords: ['ai-sunset', 'tool-lifecycle', 'data-processing-agreement', 'deprovisioning', 'legacy-ai'],
    demoRelevant: false,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4206',
    name: 'AI Open Source Component License Compliance Not Tracked',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `First Capital's internally developed AI models and AI-enabled applications
      incorporate open source components — including popular Python ML libraries — without
      a formal license compliance programme tracking copyleft obligations, patent grant
      conditions, or attribution requirements. Three internally developed AI models
      use components with GPL-family licenses that could, under some interpretations,
      require the bank to open-source the containing application. Legal has not reviewed
      open source licence terms for AI components, and no software composition analysis
      tool is applied to AI model repositories.`,
    keywords: ['open-source-license', 'gpl', 'software-composition', 'ai-model-ip', 'license-compliance'],
    demoRelevant: false,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4207',
    name: 'AI Vendor Model Update Notification SLA Not in Contract',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description: `First Capital's AI vendor contracts do not contain mandatory pre-notification
      SLAs for model updates that affect the vendor's AI decision outputs. Under FFIEC AI
      guidance and SR 11-7, vendor model updates that are material to regulated decisions
      must be treated as model changes subject to the bank's change management and incremental
      validation requirements, but this obligation cannot be fulfilled without advance notice
      from the vendor. The bank has experienced three undisclosed vendor model updates in
      the past 12 months that changed AI output distributions without triggering internal
      change management review.`,
    keywords: ['vendor-model-update', 'notification-sla', 'change-management', 'sr-11-7', 'ffiec-ai-guidance'],
    demoRelevant: true,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4208',
    name: 'AI Vendor Audit Rights Not Exercised Under TPRM Programme',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's TPRM programme has not exercised contractual audit rights
      against any AI vendor in the past three years, despite the OCC's third-party risk
      management guidance requiring that institutions periodically validate critical vendor
      AI system performance, security controls, and compliance with agreed service level
      and governance obligations. The bank's vendor management team lacks AI-specific
      audit methodologies and has relied entirely on vendor-provided SOC 2 reports, which
      do not address AI model accuracy, fairness, or SR 11-7 documentation completeness.`,
    keywords: ['vendor-audit-rights', 'tprm', 'ai-vendor', 'soc2-limitation', 'occ-guidance'],
    demoRelevant: false,
    subTopic: 'ai-procurement-governance',
  },
  {
    code: 'B4209',
    name: 'AI Procurement Anti-Competitive Data Sharing Risk Not Assessed',
    officeCategory: 'back_office',
    failureRatePct: 43,
    description: `First Capital's AI vendor agreements do not prohibit AI vendors from using
      bank-provided transaction and customer behavioural data to train models that are
      subsequently licensed to the bank's direct competitors. Three fintech AI vendors
      serving First Capital also serve competing mid-size banks under similar data sharing
      terms, creating a risk that the bank's proprietary customer data indirectly improves
      competitor AI capabilities. The bank's legal and compliance teams have not assessed
      this anti-competitive data sharing risk or consulted antitrust counsel.`,
    keywords: ['anti-competitive', 'data-sharing', 'vendor-data-use', 'proprietary-data', 'fintech-vendor'],
    demoRelevant: false,
    subTopic: 'ai-procurement-governance',
  },

  // ── AI Operations Monitoring ─────────────────────────────────────────────

  {
    code: 'B4210',
    name: 'AI System Uptime SLA Governance Not Aligned to Business Criticality',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description: `First Capital's AI operations team manages uptime SLAs for AI systems under
      a uniform 99.5% availability standard that does not distinguish between AI systems
      used in time-sensitive regulatory workflows — such as real-time OFAC screening and
      Reg E dispute routing — and non-critical analytical AI tools. Three AI systems
      supporting mandatory regulatory compliance functions have experienced outages lasting
      45–90 minutes without triggering the business continuity escalation protocols
      applicable to critical banking operations, because the AI operations governance
      framework does not classify AI systems by their regulatory criticality.`,
    keywords: ['ai-uptime-sla', 'regulatory-criticality', 'business-continuity', 'ofac-screening', 'operations-governance'],
    demoRelevant: true,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4211',
    name: 'AI Performance Dashboard Lacks Regulatory Threshold Alerts',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `First Capital's AI operations performance dashboard monitors infrastructure
      metrics — latency, throughput, and error rates — but does not track model performance
      metrics with regulatory relevance, such as adverse action reason code accuracy,
      BSA/AML alert false-positive rate trends, or credit score distribution shifts
      that could indicate fair lending model drift. SR 11-7 requires ongoing monitoring
      of model performance against key performance thresholds, but the bank's operations
      monitoring infrastructure is not configured to alert when model outputs breach
      regulatory or risk-management performance thresholds.`,
    keywords: ['ai-dashboard', 'performance-monitoring', 'regulatory-thresholds', 'sr-11-7', 'fair-lending-drift'],
    demoRelevant: true,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4212',
    name: 'Model Drift Alerting Infrastructure Not Deployed for Credit AI',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's consumer and commercial credit AI models operate without
      automated model drift alerting infrastructure, relying instead on annual independent
      validation to detect performance degradation. This annual cycle creates a monitoring
      gap of up to 12 months during which data drift, concept drift, or distribution shift
      can erode model performance below acceptable regulatory thresholds without detection.
      SR 11-7 section on ongoing monitoring requires that material models have continuous
      or at minimum quarterly performance tracking with documented threshold triggers
      for escalation, and FFIEC AI guidance reinforces real-time monitoring as a
      leading practice for AI in consumer credit.`,
    keywords: ['model-drift', 'alerting-infrastructure', 'credit-ai', 'continuous-monitoring', 'sr-11-7-monitoring'],
    demoRelevant: true,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4213',
    name: 'AI Incident Response Plan Does Not Cover Model Failure Scenarios',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital's technology incident response plan covers infrastructure failures,
      cybersecurity incidents, and data breaches but does not include model failure scenarios —
      situations where an AI model produces systematically incorrect outputs without a detectable
      infrastructure error. In a tabletop exercise, the bank's incident response team had no
      established escalation path, communication protocol, or regulatory notification framework
      for a scenario where the credit AI model produced discriminatory decision patterns at scale.
      The absence of AI-specific incident response procedures is a gap noted in FFIEC AI guidance.`,
    keywords: ['ai-incident-response', 'model-failure', 'regulatory-notification', 'tabletop-exercise', 'discriminatory-output'],
    demoRelevant: true,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4214',
    name: 'AI Model Champion-Challenger Testing Not Documented in Production',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description: `First Capital runs champion-challenger experiments for credit AI model improvements
      without a documented champion-challenger governance framework, resulting in challenger models
      being promoted to champion status based on informal team consensus rather than a documented
      performance comparison against SR 11-7 model performance standards and fair lending
      benchmarks. Three champion promotions in the past 18 months lack documentation of the
      Gini improvement rationale, fair lending disparate impact comparison, or model risk
      management sign-off required under the bank's own model change management policy.`,
    keywords: ['champion-challenger', 'model-promotion', 'sr-11-7', 'fair-lending', 'change-management-gap'],
    demoRelevant: false,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4215',
    name: 'AI Throughput Degradation Not Linked to Regulatory Decision Quality',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description: `First Capital's AI operations team monitors processing throughput for the
      fraud detection AI system but has not established a protocol linking throughput
      degradation events to regulatory decision quality monitoring. During two high-volume
      trading days, the fraud detection system operated in degraded mode with reduced
      feature computation, and the degraded mode outputs were not logged with a degraded-mode
      flag, meaning the bank's compliance records do not distinguish between full-feature
      AI decisions and degraded-mode decisions for the same time period.`,
    keywords: ['throughput-degradation', 'fraud-detection', 'degraded-mode', 'decision-quality', 'compliance-logging'],
    demoRelevant: false,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4216',
    name: 'AI Model Rollback Procedure Not Tested After Production Deployment',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `First Capital's AI model deployment procedures include a rollback step in
      the runbook documentation, but the rollback procedure has not been tested in production
      for any of the seven AI models deployed in the past 24 months. Untested rollback
      procedures create operational risk that model rollback in a live incident will fail
      or cause extended downtime, and FFIEC AI guidance cites tested fallback procedures
      as a required element of AI operational resilience. The bank's technology governance
      committee has approved deployment without requiring rollback testing evidence.`,
    keywords: ['model-rollback', 'deployment-procedure', 'operational-resilience', 'ffiec-ai-guidance', 'untested-procedure'],
    demoRelevant: false,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4217',
    name: 'AI Feature Pipeline Failures Not Monitored for Compliance Impact',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description: `First Capital's credit scoring AI models depend on feature pipelines that
      aggregate real-time bureau data, transaction history, and behavioural signals. The bank's
      data engineering team monitors pipeline uptime but does not alert on feature value
      distribution anomalies that may indicate upstream data quality degradation silently
      affecting model outputs. SR 11-7 requires that material models have data quality
      controls ensuring that model inputs meet the quality standards assumed in model
      validation, and feature pipeline monitoring is the primary mechanism for
      continuous data quality assurance in production AI systems.`,
    keywords: ['feature-pipeline', 'data-quality', 'distribution-anomaly', 'sr-11-7', 'credit-ai-monitoring'],
    demoRelevant: true,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4218',
    name: 'AI Retraining Schedule Not Documented or Approved by MRM',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's AI models are retrained on ad hoc schedules determined by
      data science team capacity rather than governance-approved retraining triggers based
      on model drift metrics, data vintage, or performance threshold breaches. SR 11-7
      requires that model development and retraining follow a documented and approved
      process subject to model risk management oversight, and ad hoc retraining schedules
      create risk that models are retrained without MRM review, fair lending assessment,
      or change management documentation.`,
    keywords: ['retraining-schedule', 'model-governance', 'mrm-approval', 'drift-trigger', 'sr-11-7-development'],
    demoRelevant: false,
    subTopic: 'ai-operations-monitoring',
  },
  {
    code: 'B4219',
    name: 'AI Explainability Degradation Not Tracked Post-Deployment',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description: `First Capital's credit AI explainability framework generates SHAP values
      at model deployment time but does not track whether explainability quality — measured
      by explanation fidelity, consistency of top reason codes, and coherence with
      regulatory adverse action categories — degrades as the model encounters production
      data distributions that differ from the training set. CFPB and OCC expect that
      AI models used in adverse action notice generation maintain consistent explainability
      quality throughout the model lifecycle, not just at deployment.`,
    keywords: ['explainability-degradation', 'shap-monitoring', 'adverse-action', 'explanation-fidelity', 'post-deployment'],
    demoRelevant: true,
    subTopic: 'ai-operations-monitoring',
  },

  // ── AI Board Oversight ───────────────────────────────────────────────────

  {
    code: 'B4220',
    name: 'Board AI Literacy Gap Impairs Effective Risk Oversight',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `First Capital's board of directors receives quarterly AI governance reports
      but the majority of board members lack the technical literacy to evaluate whether
      AI risk management disclosures are complete and whether AI risk appetite limits are
      appropriate. Federal Reserve and OCC supervisory expectations require that bank boards
      provide effective oversight of AI risks, and the OCC's AI governance examination framework
      evaluates whether board reporting on AI is presented in a form that enables
      substantive board engagement. Three consecutive OCC examination cycles have noted
      the board's AI literacy gap as a governance weakness.`,
    keywords: ['board-ai-literacy', 'ai-oversight', 'board-governance', 'occ-examination', 'risk-reporting'],
    demoRelevant: true,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4221',
    name: 'AI Risk Appetite Statement Does Not Include Quantitative Limits',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital's enterprise risk appetite statement includes a qualitative
      commitment to responsible AI but does not define quantitative AI risk appetite
      metrics — such as maximum acceptable adverse impact ratios for credit AI,
      permissible false-negative rate bounds for BSA/AML AI, or maximum number of
      AI models operating without independent validation. The absence of quantitative
      AI risk appetite limits means the board cannot determine whether the bank is
      operating within or outside its approved AI risk tolerance, a gap that OCC
      examiners have flagged in AI governance reviews.`,
    keywords: ['risk-appetite', 'quantitative-limits', 'ai-governance', 'adverse-impact', 'board-oversight'],
    demoRelevant: true,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4222',
    name: 'AI Strategic Plan Lacks Board-Approved Governance Milestones',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's AI strategic plan describes a three-year roadmap for
      AI adoption across lending, fraud, and compliance but does not include board-approved
      governance milestones for SR 11-7 compliance, EU AI Act readiness, or FFIEC AI
      guidance adoption. Without governance milestones, the board cannot track whether
      AI expansion is proceeding in lockstep with the risk management infrastructure
      required to govern it, and the technology-first strategy creates a risk that
      the bank accumulates AI governance debt as the portfolio expands faster than
      governance capacity.`,
    keywords: ['ai-strategic-plan', 'governance-milestones', 'sr-11-7-roadmap', 'eu-ai-act-readiness', 'board-approval'],
    demoRelevant: true,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4223',
    name: 'Board AI Report Does Not Include Regulatory Examination Findings',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `First Capital's quarterly board AI governance report does not include a
      consolidated summary of AI-related regulatory examination findings, Matters Requiring
      Attention, and remediation status from OCC, FDIC, and Federal Reserve examinations.
      Board members are therefore unaware of the cumulative regulatory concern signals
      regarding the bank's AI governance programme, and the board audit committee has
      not requested an independent assessment of AI regulatory examination risk. FFIEC
      governance expectations require board-level visibility into regulatory feedback
      on AI systems.`,
    keywords: ['board-reporting', 'examination-findings', 'mra-status', 'ai-regulatory-risk', 'audit-committee'],
    demoRelevant: true,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4224',
    name: 'Board AI Risk Committee Has No Independent AI Expert Member',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description: `First Capital's board risk committee, which has oversight responsibility
      for AI risk, does not include an independent director with AI, data science, or
      technology risk expertise. The committee's effectiveness is therefore limited to
      reviewing management presentations without the independent technical perspective
      needed to challenge AI risk assessments and governance disclosures. Both the OCC's
      AI governance examination criteria and FSOC's AI guidance cite the importance of
      independent director expertise in AI as a board-level governance leading practice.`,
    keywords: ['board-risk-committee', 'independent-director', 'ai-expertise', 'board-composition', 'fsoc-guidance'],
    demoRelevant: false,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4225',
    name: 'Board Not Briefed on Systemic AI Concentration Risk',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description: `First Capital's board has not received a briefing on systemic AI concentration
      risk — the risk that a significant portion of the bank's credit, fraud, and compliance
      decisions are powered by a small number of AI vendors and foundation models, creating
      correlated failure risk. FSOC and FSB guidance on AI in financial services identifies
      AI concentration risk as a systemic concern warranting board attention at regulated
      institutions, and the bank's enterprise risk committee has not escalated AI concentration
      risk to board level despite the bank's material dependence on two AI vendors.`,
    keywords: ['ai-concentration-risk', 'board-briefing', 'systemic-risk', 'fsoc', 'vendor-dependence'],
    demoRelevant: false,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4226',
    name: 'Board Approval for AI Model Tier Re-Classification Not Required',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `First Capital's model risk management policy does not require board or
      board committee approval when a model is downgraded from Tier 1 (high-risk) to
      Tier 2 (moderate-risk), reducing its validation frequency and oversight intensity.
      Management has downgraded three AI models previously validated as Tier 1 following
      business line requests for reduced compliance burden, without board visibility into
      the re-classification rationale or the reduction in governance intensity that results.
      OCC governance expectations require board or board committee oversight of material
      changes to risk management programmes.`,
    keywords: ['model-tier', 'reclassification', 'board-approval', 'mrm-policy', 'governance-intensity'],
    demoRelevant: false,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4227',
    name: 'Board AI Ethics Policy Not Ratified or Published',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description: `First Capital has not adopted a board-ratified AI ethics policy establishing
      principles for responsible AI use, prohibited AI applications, and ethical review
      obligations for high-risk AI deployments. The absence of a board-ratified AI ethics
      policy leaves ethical review of new AI use cases to management discretion, creates
      a gap in the governance framework visible to OCC examiners and institutional
      investors, and does not meet the AI ethics governance expectations articulated in
      the OCC's responsible AI framework and FFIEC AI guidance.`,
    keywords: ['ai-ethics-policy', 'board-ratification', 'responsible-ai', 'prohibited-applications', 'occ-responsible-ai'],
    demoRelevant: false,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4228',
    name: 'AI Capital Allocation Not Included in Board Capital Planning',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description: `First Capital's ICAAP capital planning framework does not include an
      explicit capital allocation for AI-related operational risk — covering model error
      losses, AI-driven compliance violations, and AI third-party failure scenarios.
      The bank's operational risk capital model is calibrated on historical loss data
      that predates material AI adoption, meaning the capital base may not adequately
      reflect the incremental operational risk associated with the bank's current AI
      portfolio. The Federal Reserve's DFAST guidance encourages institutions to
      reflect emerging risk factors in capital planning.`,
    keywords: ['icaap', 'ai-operational-risk', 'capital-planning', 'model-error-losses', 'dfast'],
    demoRelevant: false,
    subTopic: 'ai-board-oversight',
  },
  {
    code: 'B4229',
    name: 'Board Not Informed of AI Model Validation Failures',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `First Capital's model risk management reporting escalation path does not
      require that AI model validation failures — instances where independent validation
      identifies material model weaknesses, overrides model approvals, or conditions model
      use on remediation — be escalated to the board risk committee. Four AI model
      validations in the past 18 months resulted in conditional approvals with material
      limitations, none of which were reported to the board. OCC and Federal Reserve
      supervisory guidance require that board-level oversight of model risk management
      include visibility into material validation findings.`,
    keywords: ['validation-failure', 'board-escalation', 'conditional-approval', 'mrm-reporting', 'occ-supervisory'],
    demoRelevant: true,
    subTopic: 'ai-board-oversight',
  },

  // ── AI Human Oversight ───────────────────────────────────────────────────

  {
    code: 'B4230',
    name: 'Human-in-the-Loop Documentation Gap for Regulated AI Decisions',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's AI governance framework requires human-in-the-loop review
      for AI decisions above defined materiality thresholds but does not maintain documentation
      of each human review event — including the reviewer identity, review outcome, time spent,
      and whether the AI recommendation was accepted, modified, or overridden. CFPB and OCC
      examiners have identified the absence of human-review documentation as a material gap
      because it prevents the bank from demonstrating to regulators that human oversight
      of AI decisions is substantive rather than nominal, which is a key element of
      FFIEC AI governance expectations.`,
    keywords: ['human-in-the-loop', 'review-documentation', 'ai-oversight', 'cfpb-examination', 'ffiec-governance'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4231',
    name: 'AI Override Tracking System Not Implemented',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital's credit underwriting and fraud detection AI systems do not
      have a systematic override tracking mechanism that records when human reviewers
      reject AI recommendations and the reasons for doing so. SR 11-7 requires that
      model use policies document override processes and that override rates be monitored
      as a model performance indicator, but the bank's workflow systems capture only
      the final human decision without recording whether an AI recommendation was received
      and overridden. High override rates can signal model quality degradation requiring
      validation, and the absence of override tracking eliminates this early warning signal.`,
    keywords: ['ai-override', 'tracking-system', 'sr-11-7-override', 'model-performance', 'credit-underwriting'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4232',
    name: 'AI Reliance Documentation Insufficient for Examiner Review',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital cannot produce examination-ready documentation demonstrating
      the degree of reliance placed on AI recommendations in each regulated decision workflow.
      OCC and CFPB examination requests for AI reliance documentation — including the weight
      given to AI output versus human judgment, the circumstances under which AI outputs
      are treated as determinative, and training provided to human reviewers on AI
      limitations — have been met with incomplete or inconsistent responses from different
      business lines, indicating that AI reliance standards are not uniformly documented
      or applied across the institution.`,
    keywords: ['ai-reliance', 'examiner-documentation', 'occ-examination', 'human-judgment', 'reliance-standards'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4233',
    name: 'Automation Bias Training for AI Users Not Completed',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description: `First Capital has not implemented automation bias training for employees
      who review AI recommendations in credit, fraud, and compliance workflows. Research and
      regulatory guidance both confirm that untrained reviewers exhibit automation bias —
      systematically deferring to AI recommendations even when their own judgment indicates
      the AI output is incorrect — undermining the effectiveness of human-in-the-loop controls.
      FFIEC AI guidance explicitly identifies automation bias awareness as a component of
      effective human oversight infrastructure, and the bank's compliance training programme
      does not include AI-specific modules on critical evaluation of AI recommendations.`,
    keywords: ['automation-bias', 'human-oversight-training', 'ai-reviewer', 'ffiec-guidance', 'compliance-training'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4234',
    name: 'AI Decision Contestation Process Not Documented for Consumers',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description: `First Capital's consumer-facing AI systems — including AI credit decisioning,
      AI-assisted fee assessment, and AI product eligibility screening — do not have a
      documented consumer contestation process that allows consumers to challenge AI-driven
      decisions and request human review. CFPB regulatory guidance, EU AI Act Article 14
      for high-risk systems, and GDPR Article 22 all require that institutions operating
      AI systems with significant consumer impact provide a meaningful and accessible
      contestation pathway, and the bank's current adverse action and complaint processes
      do not specifically address AI-driven decisions.`,
    keywords: ['contestation-process', 'consumer-rights', 'eu-ai-act-article-14', 'gdpr-article-22', 'human-review-request'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4235',
    name: 'AI Minimum Human Review Time Standards Not Defined',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description: `First Capital's human-in-the-loop review process for AI credit decisions
      does not define minimum time standards for human review, allowing reviewers to complete
      AI oversight in as little as 15 seconds per decision. Time-motion analysis of the
      review process indicates that reviews at this pace cannot constitute substantive
      evaluation of AI decision quality, and the bank's operational metrics show that
      98.7% of AI credit recommendations are accepted without modification. OCC and
      Federal Reserve examiners assess whether human-in-the-loop controls are genuinely
      independent or constitute a rubber-stamp approval process.`,
    keywords: ['human-review-time', 'rubber-stamp', 'ai-oversight-quality', 'time-motion', 'occ-examination'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4236',
    name: 'AI Escalation Threshold for Human Review Not Risk-Calibrated',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's AI human review escalation thresholds — defining which AI
      decisions require human review based on model confidence score — were set at initial
      deployment and have not been recalibrated as model performance has evolved and the
      business mix of applications has shifted. The current threshold routes only 12% of
      credit decisions to human review, but the bank's fair lending analysis suggests that
      the AI decisions with the highest disparate impact risk are concentrated in a
      confidence score range that falls below the escalation threshold, meaning that
      the decisions most susceptible to fair lending risk bypass human review.`,
    keywords: ['escalation-threshold', 'fair-lending-risk', 'confidence-score', 'human-review-calibration', 'disparate-impact'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4237',
    name: 'Human Reviewer AI Training Competency Not Assessed',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `First Capital does not assess the AI competency of human reviewers who
      provide oversight of AI credit, fraud, and compliance recommendations, and does not
      require that reviewers demonstrate minimum competency in understanding AI model
      outputs, known failure modes, and the limitations of AI confidence scores before
      they are authorised to conduct AI oversight reviews. FFIEC AI guidance and
      OCC AI governance expectations both specify that effective human oversight requires
      reviewers to have sufficient understanding of the AI system to provide meaningful
      rather than nominal oversight.`,
    keywords: ['reviewer-competency', 'ai-training', 'human-oversight-standards', 'ffiec-guidance', 'authorisation'],
    demoRelevant: false,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4238',
    name: 'AI Human Override Audit Log Not Retained for Regulatory Review',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `First Capital's AI decision systems do not retain a structured audit log
      of human override events with the data fields necessary for regulatory review —
      including decision date, reviewer ID, AI recommendation, human override decision,
      override reason code, and elapsed review time. When CFPB examiners requested
      AI override data to assess the effectiveness of the bank's human-in-the-loop
      controls, the bank produced only aggregate monthly override rate statistics
      without individual decision-level audit trail data, preventing examination
      of whether override patterns indicate systemic AI performance issues or
      discriminatory AI outputs being systematically corrected by human reviewers.`,
    keywords: ['override-audit-log', 'regulatory-retention', 'cfpb-examination', 'decision-audit-trail', 'discriminatory-pattern'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },
  {
    code: 'B4239',
    name: 'AI Fully Automated Decision Policy Not Board-Approved',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: `First Capital operates several AI use cases in fully automated mode —
      including small-dollar consumer loan approvals below $5,000 and automated fraud
      block decisions — where no human reviews the AI recommendation before action is
      taken. The bank does not have a board-approved policy defining the categories
      of decisions permissible for full automation, the maximum decision amount or
      consumer impact thresholds for full automation, and the performance and fairness
      standards an AI system must meet before full automation is approved. FFIEC AI
      guidance and EU AI Act Article 14 both require explicit governance approval for
      fully automated decision-making in consumer-facing financial services.`,
    keywords: ['fully-automated-decision', 'board-policy', 'eu-ai-act-article-14', 'small-dollar-loan', 'governance-approval'],
    demoRelevant: true,
    subTopic: 'ai-human-oversight',
  },

];
