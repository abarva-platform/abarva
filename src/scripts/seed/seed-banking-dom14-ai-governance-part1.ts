// seed-banking-dom14-ai-governance-part1.ts
// Banking genome patterns — AI/ML Governance (SR 11-7 extension for GenAI/LLM era)
// Code range: B4000–B4059  (60 patterns)
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

export const BANKING_AI_GOVERNANCE_PART1_PATTERNS: PatternSeed[] = [

  // ── Foundation Model Risk ─────────────────────────────────────────────────
  {
    code: 'B4000',
    name: 'Foundation Model Fine-Tune Not Registered in SR 11-7 Model Inventory',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: `First Capital fine-tunes a publicly available large language model foundation on
      internal loan-officer call transcripts to generate credit quality signals used alongside the
      traditional scorecard in commercial underwriting decisioning. The fine-tuned model is not
      registered in the SR 11-7 model inventory because the risk team treats the base model
      provider's model card as sufficient documentation, ignoring that the fine-tuning step creates
      a distinct model with First Capital-specific behavior. OCC examiners reviewing the digital
      lending portfolio find no independent validation record for the fine-tuned foundation model,
      constituting a consent order milestone breach on AI/ML governance.`,
    keywords: ['SR 11-7', 'foundation model', 'model inventory', 'LLM fine-tuning', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'foundation-model-risk',
  },
  {
    code: 'B4001',
    name: 'Third-Party LLM API Deployed Without SR 11-7 Equivalence Assessment',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital's commercial banking team routes CCAR stress narrative generation
      and DFAST sensitivity commentary through a third-party LLM API without conducting an SR 11-7
      equivalence assessment to determine whether the LLM constitutes a model under the bank's
      governance framework. The OCC's SR 11-7 guidance explicitly covers tools that generate
      quantitative or qualitative outputs material to regulatory submissions, and an LLM producing
      CCAR narrative used in Fed filings falls within that scope. The bank's TPRM vendor review
      evaluated the LLM API provider's cybersecurity posture but did not assess model risk
      controls, leaving a dual governance gap under OCC Bulletin 2023-17 and SR 11-7.`,
    keywords: ['SR 11-7', 'LLM', 'CCAR', 'OCC Bulletin 2023-17', 'TPRM'],
    demoRelevant: true,
    subTopic: 'foundation-model-risk',
  },
  {
    code: 'B4002',
    name: 'Model Drift Monitoring Framework Not Extended to Non-Traditional ML',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's model monitoring program applies Population Stability Index and
      Gini coefficient tracking to traditional scorecard models but has no equivalent drift
      monitoring framework for gradient-boosted and transformer-based ML models deployed in fraud
      detection and deposit repricing. Non-traditional ML models exhibit drift patterns — embedding
      space shift, attention weight redistribution, and feature interaction drift — that PSI-based
      monitoring cannot detect. SR 11-7 monitoring requirements apply regardless of model
      architecture, and the FFIEC's AI guidance notes that financial institutions must adapt
      monitoring methodologies to the specific properties of the AI technique in use.`,
    keywords: ['SR 11-7', 'model drift', 'FFIEC AI guidance', 'model monitoring', 'gradient boosting'],
    demoRelevant: true,
    subTopic: 'foundation-model-risk',
  },
  {
    code: 'B4003',
    name: 'Foundation Model Provider Financial Stability Not Assessed in TPRM',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `First Capital consumes foundation model APIs from two startup-stage AI providers
      for customer-facing chatbot responses and internal credit memo drafting, but the bank's TPRM
      annual due diligence focuses on cybersecurity certification and SLA uptime without assessing
      provider financial viability, concentration risk, or exit-and-portability provisions. OCC
      Bulletin 2023-17 on third-party relationships requires banks to assess the financial condition
      and business continuity of critical service providers; a foundation model API that powers
      regulated banking workflows qualifies as a critical arrangement, and provider insolvency would
      create a sudden operational gap with no validated alternative model available.`,
    keywords: ['TPRM', 'OCC Bulletin 2023-17', 'foundation model', 'concentration risk', 'exit rights'],
    demoRelevant: true,
    subTopic: 'foundation-model-risk',
  },
  {
    code: 'B4004',
    name: 'Pre-Trained Embeddings Used in AML Without Bias and Drift Validation',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `First Capital's AML team deploys a transaction embedding model using pre-trained
      financial text vectors to enrich entity risk scoring, treating the embedding layer as a static
      data transformation rather than a model component. When the embedding model's training corpus
      — which skews toward large-bank typologies — underrepresents First Capital's community banking
      customer population, the risk scores systematically diverge from investigator judgments on
      regional small-business cash transactions. The FRB/OCC/FDIC joint AI statement (2023) calls
      attention to pre-trained component bias as a systemic risk that inherits into downstream models
      that consume their outputs, and SR 11-7 requires that data inputs to registered models be
      subject to data quality and representativeness review.`,
    keywords: ['SR 11-7', 'AML', 'embedding model', 'FRB/OCC/FDIC AI statement', 'bias testing'],
    demoRelevant: true,
    subTopic: 'foundation-model-risk',
  },
  {
    code: 'B4005',
    name: 'LLM Context Window Truncation Silently Drops Regulatory-Material Input Fields',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `First Capital's LLM-assisted regulatory examination response tool processes OCC
      examination requests by feeding document batches into the model context window, but the tool
      has no logic to detect or flag when document length exceeds the context limit and inputs are
      silently truncated. Truncated context can cause the LLM to omit acknowledgment of adverse
      findings documented in later pages of an examination package, producing responses that
      inadvertently misrepresent the bank's compliance posture. The FFIEC guidance on AI use in
      examination-facing workflows requires human review of AI-generated regulatory outputs and
      explicit validation that model inputs are complete and representative.`,
    keywords: ['FFIEC AI guidance', 'LLM', 'SR 11-7', 'OCC examination', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'foundation-model-risk',
  },
  {
    code: 'B4006',
    name: 'Multi-Tenant Foundation Model API Leaks Cross-Client Training Signal',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description: `First Capital uploads proprietary commercial loan portfolio data to a multi-tenant
      foundation model API for fine-tuning and inference, without contractual confirmation that the
      provider isolates training data and does not use client data to improve shared model weights
      available to other clients. OCC Bulletin 2023-17 requires explicit contractual protections for
      confidential banking data processed by third parties; a multi-tenant AI training environment
      without data isolation creates a potential competitive intelligence exposure and a data
      governance violation under the bank's Gramm-Leach-Bliley obligations.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM', 'data governance', 'foundation model', 'Gramm-Leach-Bliley'],
    subTopic: 'foundation-model-risk',
  },

  // ── GenAI Output Risk ─────────────────────────────────────────────────────
  {
    code: 'B4007',
    name: 'LLM Hallucination in CCAR/DFAST Narrative Filed With Federal Reserve',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description: `First Capital uses a GenAI tool to accelerate drafting of CCAR capital planning
      narratives, including sections on risk identification, scenario design, and model limitations.
      The GenAI tool produces plausible-sounding text that in two instances cites fictitious
      Federal Reserve guidance documents and in one case attributes a risk factor to a portfolio
      segment that does not exist at First Capital. The FFIEC's AI guidance and the FRB's CCAR
      examination process require that regulatory filings accurately represent the institution's
      actual practices; filing a CCAR document that contains hallucinated regulatory citations
      or fabricated risk descriptions exposes the bank to examination findings for misrepresentation
      and demonstrates a failure of SR 11-7-style output governance for GenAI tools.`,
    keywords: ['CCAR', 'GenAI', 'hallucination', 'SR 11-7', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4008',
    name: 'LLM Adverse Action Letter Fails Reg B Specificity Requirement',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description: `First Capital's digital lending platform uses a GenAI model to auto-draft adverse
      action notices for declined consumer loan applications, generating narrative explanations that
      reference general risk factors rather than the specific principal reasons for the credit
      decision as required by ECOA Regulation B. The CFPB's 2022 AI adverse action guidance and
      subsequent supervisory communications confirm that adverse action notices generated by or with
      assistance from AI models must identify the specific features that actually drove the decision,
      not generic risk language; GenAI-generated notices that substitute narrative fluency for
      regulatory precision create systematic Reg B compliance exposure and CFPB examination risk.`,
    keywords: ['Reg B', 'ECOA', 'GenAI', 'adverse action', 'CFPB AI guidance'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4009',
    name: 'GenAI Financial Advice Output Not Reviewed for Investment Advisers Act Compliance',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description: `First Capital's retail banking chatbot, powered by a GenAI model, responds to
      customer queries about certificate of deposit rates, savings allocation strategies, and
      retirement fund distribution with personalized recommendations that constitute investment
      advice under the Investment Advisers Act of 1940. The bank's legal team classified the
      chatbot as a transactional information tool and did not route the AI output review through
      the investment advisory compliance function. The OCC's examination guidance on AI-driven
      customer interactions and the CFPB's AI guidance both flag unbounded GenAI responses in
      banking contexts as creating unintended regulatory scope for the institution.`,
    keywords: ['Investment Advisers Act', 'GenAI', 'CFPB AI guidance', 'OCC examination', 'financial advice'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4010',
    name: 'DFAST Sensitivity Commentary Generated by LLM Contains Stale Model Assumptions',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's DFAST documentation process uses a GenAI tool to generate
      sensitivity commentary sections by feeding model output tables into the LLM and requesting
      narrative explanation. The LLM's training cutoff and the bank's context window populate the
      commentary with rate and credit assumptions drawn from the model's prior calibration period
      rather than the current parameter set, producing narratives that describe sensitivities
      inconsistent with the actual model configuration filed with regulators. SR 11-7 documentation
      requirements and DFAST guidance require that model documentation accurately describe the
      model's current assumptions, making GenAI-generated commentary that drifts from actual
      inputs a documentation integrity failure.`,
    keywords: ['DFAST', 'LLM', 'SR 11-7', 'model documentation', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4011',
    name: 'GenAI SAR Narrative Omits Key Predicate Offense Indicators',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `First Capital's BSA/AML team deploys a GenAI tool to assist analysts in drafting
      Suspicious Activity Report narratives from investigation workpapers. The GenAI model
      compresses the workpaper content into concise narrative but in a statistically meaningful
      fraction of cases omits specific predicate offense indicators — transaction structuring
      patterns, geographic concentration anomalies, and layering sequences — that are required
      for a complete SAR narrative under FinCEN's SAR filing guidance. The FRB/OCC/FDIC AI joint
      statement (2023) explicitly notes that AI-assisted regulatory filing processes require
      human oversight sufficient to catch material omissions, and systematic omission of predicate
      indicators creates BSA compliance risk independent of whether the SAR was filed.`,
    keywords: ['BSA/AML', 'GenAI', 'SAR', 'FRB/OCC/FDIC AI statement', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4012',
    name: 'LLM-Generated Loan Commitment Letters Include Unintended Binding Terms',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description: `First Capital's commercial lending operations team uses a GenAI document drafting
      tool to produce loan commitment letters from deal term sheets, and in several instances the
      LLM interpolates standard market terms — prepayment premiums, financial covenant thresholds,
      and cross-default provisions — that were not discussed in the underlying deal negotiations and
      were not caught in the attorney review step because the differences were subtle. Legal exposure
      from binding commitment letters that diverge from negotiated terms is a direct operational
      risk; the FFIEC guidance on AI use in banking operations requires that AI-generated legal
      documents be reviewed against source deal terms before execution.`,
    keywords: ['FFIEC AI guidance', 'GenAI', 'LLM', 'operational risk', 'commercial lending'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },

  // ── Autonomous AI ────────────────────────────────────────────────────────
  {
    code: 'B4013',
    name: 'Agentic AI Workflow Executes Account Actions Without Human-in-Loop Approval Gate',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description: `First Capital deploys an agentic AI system to automate delinquent account
      collections workflow steps — generating payment demand communications, scheduling follow-up
      outreach, and flagging accounts for charge-off — without a human approval gate before any
      customer-facing action is executed. Under CFPB supervisory expectations and Reg F (FDCPA),
      automated collection actions must comply with communication frequency and method restrictions
      that the agentic AI does not enforce; when the system sends seventeen text messages to a
      single delinquent borrower in one day, it triggers a regulatory complaint that the bank
      cannot attribute to a human decision-maker, exposing a governance gap that the FRB/OCC/FDIC
      AI joint statement (2023) directly addresses through its human accountability principle.`,
    keywords: ['agentic AI', 'human-in-loop', 'CFPB AI guidance', 'Reg F', 'FRB/OCC/FDIC AI statement'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4014',
    name: 'AI Orchestration Pipeline Lacks Immutable Audit Trail for Regulatory Review',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description: `First Capital's AI orchestration platform chains multiple LLM calls, retrieval
      steps, and tool-use actions to process loan modification requests, but the intermediate
      reasoning steps, retrieved documents, and tool invocations are not logged in an immutable
      audit trail accessible to the compliance and examination teams. When OCC examiners request
      documentation of the decision logic behind a series of loan modification denials processed
      through the AI pipeline, the bank can produce the input and final output but not the
      intermediate AI reasoning chain that determined the outcome. The FFIEC guidance on AI
      governance and SR 11-7 model documentation requirements both require explainability and
      audit capability for AI-assisted decision processes.`,
    keywords: ['agentic AI', 'audit trail', 'SR 11-7', 'FFIEC AI guidance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4015',
    name: 'AI Pipeline Code Not Version-Controlled — Production Model Cannot Be Reproduced',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital's fraud detection AI pipeline — which chains a feature engineering
      step, an ML scoring model, and a GenAI narrative explanation generator — is maintained in
      a shared Jupyter notebook environment without formal version control or deployment pipeline
      integration. When the bank's SR 11-7 independent validation unit attempts to reproduce the
      model's behavior at a prior date to validate monitoring alert logic, the notebook state at
      that date is unavailable, making the retrospective validation infeasible. SR 11-7 model
      documentation requirements and the FFIEC AI guidance both require that AI model code and
      configurations be version-controlled and reproducible as a prerequisite for independent
      validation.`,
    keywords: ['SR 11-7', 'AI pipeline', 'version control', 'model validation', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4016',
    name: 'Autonomous AI Rate-Setting Agent Executes Deposit Pricing Without ALCO Review',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: `First Capital pilots an autonomous AI agent for retail deposit pricing that
      adjusts certificate of deposit rates in real-time based on competitor rate scraping, deposit
      flow modeling, and interest rate hedge requirements, executing rate changes without an
      Asset/Liability Committee approval step. The ALCO governance framework requires board-delegated
      committee review of material pricing changes; an AI agent that modifies deposit rates daily
      outside the ALCO calendar creates a governance bypass that OCC examiners would characterize
      as an operational risk control deficiency and a potential interest rate risk management
      governance gap under the FRB/OCC/FDIC AI statement's accountability principle.`,
    keywords: ['agentic AI', 'ALCO', 'interest rate risk', 'FRB/OCC/FDIC AI statement', 'human-in-loop'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4017',
    name: 'AI Vendor Agent Has Write Access to Core Banking System Without Change Management',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `A third-party AI agent integrated with First Capital's core banking system via
      API is granted write permissions to update account attributes — contact preferences, account
      classifications, and dispute status flags — as part of an automated customer service
      workflow. The AI agent's write access was provisioned through a standard API integration
      agreement and was not subjected to the bank's IT change management or operational risk
      assessment processes applicable to systems that modify core banking records. OCC Bulletin
      2023-17 requires third-party risk oversight commensurate with the risk exposure of the
      arrangement; an AI agent with unsupervised write access to core customer records represents
      a higher-risk arrangement requiring enhanced controls and governance.`,
    keywords: ['agentic AI', 'OCC Bulletin 2023-17', 'TPRM', 'core banking', 'change management'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4018',
    name: 'AI Fraud Suppression Agent Operates Without Override Logging',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's real-time fraud detection system includes an AI suppression agent
      that downscores fraud alerts when contextual signals suggest the flagged transaction is
      likely legitimate, reducing analyst queue volume by 30%. The suppression agent's override
      decisions — cases where a high-score alert was suppressed before reaching a human analyst —
      are not logged in a format accessible to SR 11-7 model monitoring or BSA compliance review.
      When a confirmed fraud network later triggers law enforcement review and bank examiners
      request the history of fraud alerts for affiliated accounts, the suppressed alert history is
      irrecoverable, creating a compliance documentation gap and a retroactive model monitoring
      failure.`,
    keywords: ['SR 11-7', 'agentic AI', 'fraud AI', 'model monitoring', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },

  // ── Explainability and Fairness ──────────────────────────────────────────
  {
    code: 'B4019',
    name: 'Black-Box ML Credit Model Deployed Without ECOA Explainability Framework',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description: `First Capital deploys a gradient-boosted ensemble credit model for small business
      loan decisions that produces a binary approve/decline output with no inherent feature
      importance ranking, and the bank's SR 11-7 validation does not require the model owners to
      document a compliant adverse action explanation methodology before deployment. ECOA Regulation
      B requires creditors to disclose the specific principal reasons for adverse action on credit
      applications; for ML models, the CFPB's AI adverse action guidance requires that the
      explanation accurately reflect the model's actual decision factors, not generic risk
      categories. A black-box model deployed without an ECOA-compliant explainability framework
      is both an SR 11-7 governance deficiency and a consumer protection compliance risk.`,
    keywords: ['ECOA', 'Reg B', 'SR 11-7', 'CFPB AI guidance', 'black-box model'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4020',
    name: 'Disparate Impact Testing Gap for LLM-Assisted Mortgage Underwriting',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description: `First Capital's mortgage operations team uses an LLM to assist underwriters
      in synthesizing borrower financial narratives and flagging compensating factors during
      underwriting review, but the bank has not conducted disparate impact testing to assess
      whether the LLM's synthesis and flagging behavior systematically differs by borrower race,
      national origin, or sex as proxied by neighborhood demographics and name-based signals.
      The CFPB AI guidance and OCC fair lending examination procedures require that any AI tool
      contributing to a credit decision be tested for disparate impact under ECOA; the bank's
      internal legal team classified the LLM as an analyst productivity tool, deferring the
      disparate impact analysis, which the OCC characterizes as a fair lending governance gap.`,
    keywords: ['ECOA', 'disparate impact', 'LLM', 'CFPB AI guidance', 'fair lending'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4021',
    name: 'Proxy Variable Detection Not Applied to GenAI Output in Credit Decisioning',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description: `First Capital's GenAI-assisted commercial credit analysis tool generates
      counterparty risk narratives that reference geographic concentration, industry cluster
      characteristics, and neighborhood retail density — variables that, while economically
      relevant, serve as statistical proxies for race and national origin in certain markets.
      The bank's fair lending monitoring program applies proxy variable detection to traditional
      scorecard inputs but has not been extended to review the content and patterns of GenAI-
      generated narratives that inform credit committee decisions. The FRB/OCC/FDIC AI joint
      statement (2023) identifies proxy variable risk in AI outputs as a heightened supervisory
      concern, and ECOA Reg B applies to the full set of information considered in a credit
      decision regardless of whether a human or AI generated it.`,
    keywords: ['ECOA', 'proxy variable', 'GenAI', 'FRB/OCC/FDIC AI statement', 'fair lending'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4022',
    name: 'Explainability Method Inconsistently Applied Across Model Versions',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `First Capital uses SHAP values to generate adverse action reason codes for its
      ML consumer credit model, but after a model version update the SHAP implementation was
      changed from tree-level to kernel-level SHAP to accommodate a new model architecture,
      producing adverse action codes that are not comparable across pre- and post-update decisions.
      CFPB supervisory communications on AI adverse action require consistency in the explanation
      methodology to support fair lending examination comparisons across time; an explanation
      method change that breaks temporal consistency in reason code assignment undermines the
      bank's ability to demonstrate that protected class outcome patterns are explained by model
      performance rather than methodology shifts.`,
    keywords: ['CFPB AI guidance', 'ECOA', 'adverse action', 'model validation', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4023',
    name: 'EU AI Act High-Risk Classification Not Assessed for Cross-Border LLM Deployment',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: `First Capital's parent holding company operates a branch in the European Union
      that uses the same LLM-based credit underwriting assistant deployed in the US, without
      assessing whether the EU AI Act's Article 10 requirements for high-risk AI systems in
      credit scoring apply to the EU branch's use. The EU AI Act classifies AI systems used for
      creditworthiness assessment as high-risk under Annex III, requiring conformity assessments,
      technical documentation, data governance controls, and human oversight measures beyond
      what SR 11-7 demands. The bank's AI governance program treats EU deployment as a
      jurisdictional extension of the US program without a formal high-risk classification
      assessment, creating regulatory exposure in the EU branch's upcoming supervisory review.`,
    keywords: ['EU AI Act', 'SR 11-7', 'LLM', 'credit scoring', 'cross-border AI'],
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4024',
    name: 'Model Fairness Metrics Not Included in Ongoing SR 11-7 Monitoring Reports',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `First Capital's ML credit model monitoring reports track predictive performance
      metrics — KS statistic, Gini coefficient, and approval rate stability — but do not include
      ongoing fairness metrics such as equal opportunity difference, demographic parity, and
      calibration by protected class proxies. The CFPB's examination manual and the FRB's fair
      lending guidance require institutions using AI in credit decisions to monitor for disparate
      impact on an ongoing basis, not only at initial deployment validation; the absence of
      fairness monitoring in the monthly SR 11-7 monitoring report means that cumulative
      demographic outcome drift can accumulate undetected between annual fair lending reviews.`,
    keywords: ['SR 11-7', 'model monitoring', 'CFPB AI guidance', 'fair lending', 'ECOA'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },

  // ── AI Procurement ───────────────────────────────────────────────────────
  {
    code: 'B4025',
    name: 'Third-Party AI Vendor Contract Missing SR 11-7 Model Risk Coverage Clause',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `First Capital's vendor contracts for three AI analytics platforms — a deposit
      attrition model, a credit card activation predictor, and an NLP-based complaint router —
      do not include contractual provisions requiring the vendor to support SR 11-7 independent
      validation, provide model documentation to the bank's IVU, or notify the bank of material
      model changes. OCC Bulletin 2023-17 requires contracts with third parties providing critical
      activities to include provisions for the bank's ability to perform model risk management
      activities; without these clauses, the bank cannot fulfill its SR 11-7 obligations for
      vendor-embedded models and the MRM consent order remediation milestone on third-party
      model risk governance remains unresolved.`,
    keywords: ['SR 11-7', 'TPRM', 'OCC Bulletin 2023-17', 'vendor AI', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-procurement',
  },
  {
    code: 'B4026',
    name: 'AI API Rate Limit Creates SLA Gap for Time-Sensitive Regulated Decisions',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital's real-time credit decisioning pipeline uses a third-party AI
      scoring API subject to a 500-requests-per-minute rate limit that is not reflected in the
      bank's SLA for consumer credit decisions. During peak digital application volumes — Black
      Friday promotional events and tax season — the API rate limit is breached, causing the
      pipeline to queue decisions that exceed the ECOA 30-business-day adverse action notice
      deadline. The bank's TPRM framework did not assess API throughput capacity against regulatory
      decision timing requirements when the AI vendor was onboarded, a gap that OCC Bulletin
      2023-17 requires to be addressed for AI services supporting time-sensitive regulatory
      obligations.`,
    keywords: ['TPRM', 'OCC Bulletin 2023-17', 'ECOA', 'AI API', 'SLA'],
    demoRelevant: true,
    subTopic: 'ai-procurement',
  },
  {
    code: 'B4027',
    name: 'AI Vendor Audit Rights Clause Untested — Bank Cannot Examine Model Methodology',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's AI credit scoring vendor contract includes an audit rights clause
      allowing the bank to examine model methodology and data practices, but the bank has never
      exercised this right and has not verified that the vendor's compliance team would cooperate
      with an SR 11-7 methodology review. When the IVU attempts to schedule a methodology review
      after the bank's consent order milestone requires independent validation of all vendor AI
      models, the vendor invokes its standard contract interpretation that audit rights apply only
      to financial audits, not model methodology access. OCC Bulletin 2023-17 requires institutions
      to confirm that audit rights in vendor contracts are operationally effective, not merely
      present in contract language.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM', 'SR 11-7', 'audit rights', 'vendor AI'],
    demoRelevant: true,
    subTopic: 'ai-procurement',
  },
  {
    code: 'B4028',
    name: 'AI RFP Process Does Not Require SR 11-7 Compliance Documentation From Bidders',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `First Capital's technology procurement process for AI analytics vendors issues
      RFPs that evaluate security certifications (SOC 2, ISO 27001), implementation support, and
      pricing, but does not require bidders to submit model documentation, validation methodology,
      or performance benchmarking data sufficient for SR 11-7 independent validation. When a
      selected vendor's contract is signed and the IVU begins validation, the vendor produces only
      marketing-grade model summaries rather than developer-level documentation, forcing either a
      costly model reproduction effort or an extended unvalidated production period. The FFIEC AI
      guidance recommends that procurement processes for AI vendors include model risk governance
      due diligence requirements proportionate to the regulated use case.`,
    keywords: ['FFIEC AI guidance', 'SR 11-7', 'TPRM', 'RFP', 'vendor AI'],
    demoRelevant: true,
    subTopic: 'ai-procurement',
  },
  {
    code: 'B4029',
    name: 'Foundation Model Provider Model-Change Notification Lag Exceeds Governance Tolerance',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital's LLM API provider updates the underlying model weights to a new
      version with a 30-day advance notice period in the contract, but the bank's SR 11-7 model
      change management policy requires a validation assessment before any material model change
      can be used in production. The 30-day provider notice window is shorter than the bank's
      minimum validation cycle for material AI model changes, meaning either the bank accepts an
      unvalidated model update or requests a contract waiver that may not be commercially available.
      The OCC's SR 11-7 extension guidance and OCC Bulletin 2023-17 both contemplate this scenario
      and require institutions to negotiate provider notification provisions consistent with the
      bank's internal governance timelines.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'LLM', 'model governance', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-procurement',
  },
  {
    code: 'B4030',
    name: 'AI Tool Indemnification Clause Excludes Regulatory Penalty Coverage',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description: `First Capital's vendor agreement for an AI-powered BSA/AML screening tool
      includes an indemnification clause covering data breach losses but explicitly excludes
      regulatory penalties, examination costs, and consent order remediation expenses arising from
      the vendor's model performance. When the AI screening tool's false-negative rate contributes
      to a FinCEN finding and the bank incurs $2.4M in examination and remediation costs, the
      vendor declines to cover any portion on the basis of the exclusion. OCC Bulletin 2023-17
      requires institutions to ensure that contracts with third parties supporting critical
      regulatory compliance activities include appropriate indemnification and liability provisions
      that align with the bank's risk exposure.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM', 'BSA/AML', 'AI vendor', 'indemnification'],
    subTopic: 'ai-procurement',
  },

  // ── AI Governance Operations ─────────────────────────────────────────────
  {
    code: 'B4031',
    name: 'AI Ethics Committee Lacks Decision Authority — Recommendations Routinely Overridden',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital established an AI ethics committee as part of its consent order
      remediation plan for AI governance, but the committee's charter limits its role to issuing
      recommendations rather than approvals, and business lines have overridden four of the
      committee's last six material recommendations on AI model deployment scope and customer
      data use. The FRB/OCC/FDIC AI joint statement (2023) requires that AI governance structures
      include accountability mechanisms with real decision-making authority, not advisory-only
      bodies that can be bypassed by business unit leadership; an ethics committee without veto
      authority does not satisfy the accountability principle that regulators use to evaluate
      AI governance program effectiveness.`,
    keywords: ['FRB/OCC/FDIC AI statement', 'AI governance', 'consent order', 'SR 11-7', 'accountability'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4032',
    name: 'Model Champion-Challenger Framework Not Extended to GenAI Use Cases',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's SR 11-7 model governance framework requires champion-challenger
      testing for all model updates above the materiality threshold, but the AI governance team
      has not developed equivalent champion-challenger methodology for GenAI use cases where
      the output is text or structured recommendations rather than a scalar score. When the
      bank upgrades its GenAI credit memo summarization tool to a new model version, the
      upgrade is treated as a software update rather than a model change, and no challenger
      testing is performed to assess whether the new model generates materially different
      underwriting recommendations on the same loan applications. The FFIEC guidance on AI
      governance and the FRB/OCC/FDIC AI statement both support extending model governance
      disciplines to GenAI output quality monitoring.`,
    keywords: ['SR 11-7', 'GenAI', 'model champion-challenger', 'AI governance', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4033',
    name: 'AI Incident Response Playbook Does Not Cover LLM Hallucination Events',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: `First Capital's operational resilience and incident response framework includes
      playbooks for data breaches, system outages, and model performance degradation, but does
      not include an AI-specific incident response scenario for LLM hallucination events —
      situations where the GenAI system generates confidently stated but factually incorrect
      information in a customer-facing or regulator-facing context. When a GenAI chatbot
      provides a customer with an incorrect interest rate commitment that the customer relies
      on for a mortgage application, the bank's incident response team escalates the event as
      a customer complaint rather than a model failure, delaying the SR 11-7 model incident
      notification to the MRM committee and the OCC as required by the bank's model risk policy.`,
    keywords: ['SR 11-7', 'LLM', 'AI incident response', 'operational resilience', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4034',
    name: 'Regulatory Inquiry Response for AI-Generated Output Lacks Decision Attribution',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description: `When the OCC requests documentation supporting specific credit decision outcomes
      as part of the consent order follow-up examination, First Capital's response team cannot
      clearly attribute individual decisions to human vs. AI reasoning because the AI pipeline
      and human review steps were not separately logged during the decisioning workflow. The
      inability to demonstrate at the individual-decision level whether the AI model's output
      or a human reviewer's judgment drove the final outcome makes it impossible to assess
      whether the bank's human-in-loop requirements were applied consistently. The FFIEC AI
      guidance requires financial institutions to maintain records sufficient to reconstruct
      the decision process and demonstrate compliance with human oversight commitments.`,
    keywords: ['FFIEC AI guidance', 'OCC examination', 'consent order', 'AI governance', 'audit trail'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4035',
    name: 'AI Model Inventory Not Differentiated from Traditional SR 11-7 Inventory',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `First Capital maintains a single model inventory that comingles traditional
      statistical models, ML models, and GenAI/LLM tools under a unified SR 11-7 framework
      without distinguishing the governance attributes specific to each model type — specifically,
      the explainability, drift monitoring, output risk, and human oversight requirements that
      the FFIEC AI guidance and FRB/OCC/FDIC AI joint statement apply uniquely to AI and GenAI
      systems. OCC examiners reviewing the AI governance program find that the bank cannot
      demonstrate which inventory entries require GenAI-specific controls vs. traditional model
      controls, making the inventory an inadequate tool for managing the differentiated risk
      profile of the bank's AI portfolio.`,
    keywords: ['SR 11-7', 'AI governance', 'model inventory', 'FFIEC AI guidance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4036',
    name: 'AI Use Case Inventory Not Reconciled Against IT Asset Register Quarterly',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `First Capital's AI governance program maintains an AI use case inventory
      populated through business unit self-reporting, while the IT asset register independently
      tracks software deployments including AI API integrations and ML model containers. The
      two inventories are reconciled annually at most, and a quarterly reconciliation conducted
      as part of consent order remediation identifies eleven AI tools in the IT asset register
      that are not in the AI use case inventory — including three vendor AI scoring services
      for auto loan and home equity underwriting. The FRB/OCC/FDIC AI statement identifies
      AI inventory completeness as a foundational governance control, and a 12-month
      reconciliation gap allows unregistered AI tools to operate without oversight.`,
    keywords: ['AI governance', 'SR 11-7', 'model inventory', 'TPRM', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4037',
    name: 'AI Governance Policy Does Not Address Foundation Model Version Sunset Risk',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `First Capital's AI governance policy covers model retirement for internally
      built models but does not address the scenario where a foundation model provider announces
      end-of-life for the specific model version the bank has validated and deployed, requiring
      migration to an unvalidated newer version on the provider's timeline. When an LLM API
      provider announces 90-day deprecation of a model version that underlies the bank's
      compliance document analysis tool, the bank has no governance process for emergency
      validation of the replacement version, forcing a choice between deploying an unvalidated
      model or suspending a compliance workflow. OCC Bulletin 2023-17 requires contingency
      planning for critical third-party service disruptions, including AI model version
      deprecation.`,
    keywords: ['OCC Bulletin 2023-17', 'SR 11-7', 'foundation model', 'AI governance', 'contingency planning'],
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4038',
    name: 'Board AI Literacy Insufficient to Provide Meaningful Governance Oversight',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description: `First Capital's board of directors receives quarterly AI governance reports but
      board member AI literacy is assessed by the governance committee as insufficient to enable
      substantive challenge of AI risk management practices, model inventory decisions, or
      vendor AI concentration exposure. The FRB/OCC/FDIC AI joint statement (2023) emphasizes
      that board-level accountability requires boards to have or access sufficient expertise to
      provide effective oversight of AI risks; a board that receives AI governance reports but
      cannot challenge their content does not fulfill the accountability principle, and OCC
      examiners assess board AI governance effectiveness through direct examination of meeting
      minutes and board member questioning records.`,
    keywords: ['FRB/OCC/FDIC AI statement', 'AI governance', 'board oversight', 'SR 11-7', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },

  // ── Additional cross-cutting AI governance patterns ──────────────────────
  {
    code: 'B4039',
    name: 'GenAI Used in Complaint Analysis Without CFPB Supervisory-Grade Output Controls',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `First Capital's compliance operations team uses GenAI to categorize, triage,
      and draft preliminary responses to CFPB complaint portal submissions, without applying
      output controls that ensure the AI-generated triage classifications are reviewed against
      CFPB supervisory risk categories before complaint records are finalized. The CFPB's AI
      guidance and supervisory examination procedures assess whether institutions use AI to
      systematically under-classify complaints in categories that trigger heightened review;
      GenAI-assisted complaint triage without supervisory-grade output validation creates both
      an operational risk of missed escalations and an examination risk if the classification
      patterns appear systematically favorable to the institution.`,
    keywords: ['CFPB AI guidance', 'GenAI', 'complaint management', 'AI governance', 'operational risk'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4040',
    name: 'LLM Knowledge Cutoff Creates Stale Regulatory Interpretation in Compliance Guidance',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital's compliance team uses an LLM-powered internal guidance tool
      that answers regulatory interpretation questions for business line staff, but the model's
      training cutoff predates several material regulatory updates — including the OCC's 2023
      final rule on third-party relationships and the CFPB's 2024 AI adverse action guidance
      clarifications — that the model cannot accurately represent. Staff relying on the LLM
      guidance tool without awareness of the knowledge cutoff limitation receive outdated
      interpretations that diverge from current regulatory expectations, creating a systematic
      compliance training risk. The FFIEC AI guidance requires institutions to implement controls
      ensuring AI tools used for regulatory guidance reflect current requirements.`,
    keywords: ['FFIEC AI guidance', 'LLM', 'OCC Bulletin 2023-17', 'AI governance', 'compliance training'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4041',
    name: 'Agentic AI Credit Workflow Executes After Business Hours Without Escalation Path',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description: `First Capital's agentic AI system for processing overnight batch credit
      applications executes decisioning workflows between midnight and 6 AM when no human
      reviewer is on-call, with no escalation path for cases where the AI's confidence score
      falls below the governance threshold requiring human review. Applications that exceed the
      human-in-loop threshold accumulate in a queue that is not reviewed until the next business
      day, creating a de facto 8-hour window where the agentic AI operates without human
      oversight for edge cases. The FRB/OCC/FDIC AI statement's accountability principle
      and ECOA's adverse action timing requirements both create governance obligations that
      the current architecture does not satisfy for overnight operations.`,
    keywords: ['agentic AI', 'human-in-loop', 'FRB/OCC/FDIC AI statement', 'ECOA', 'AI governance'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4042',
    name: 'AI Model Output Calibration Not Tested After Core Banking Data Migration',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `First Capital's core banking system migration changes the field encoding,
      aggregation logic, and historical lookback methodology for several inputs to the bank's
      SR 11-7 credit and fraud AI models, but the model validation team is not notified of
      the migration changes until after go-live. Post-migration monitoring reveals that
      CECL allowance model outputs shift by 12% in the first reporting period and the fraud
      model's alert rate changes by 18%, both of which exceed SR 11-7 materiality thresholds
      for full re-validation. The FFIEC AI guidance requires data supply chain changes that
      affect AI model inputs to trigger a model impact assessment before production deployment.`,
    keywords: ['SR 11-7', 'FFIEC AI guidance', 'model monitoring', 'CECL', 'core banking'],
    demoRelevant: true,
    subTopic: 'foundation-model-risk',
  },
  {
    code: 'B4043',
    name: 'GenAI Customer Communication Violates CAN-SPAM and Reg E Disclosure Standards',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description: `First Capital's GenAI-powered customer communication system generates
      personalized account alert messages and promotional content that in a subset of cases
      omit required Regulation E electronic fund transfer disclosures and include opt-out
      language that does not meet CAN-SPAM requirements. The GenAI system was trained on
      compliant template communications, but prompt variation and context injection produce
      outputs that deviate from the required disclosure format when customer context data is
      sparse. The CFPB AI guidance and FFIEC examination procedures for consumer protection
      require that AI-generated customer communications be validated against required
      disclosure formats before deployment at scale.`,
    keywords: ['CFPB AI guidance', 'Reg E', 'GenAI', 'CAN-SPAM', 'consumer protection'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4044',
    name: 'AI-Assisted KYC Onboarding Risk Score Not in Model Inventory',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description: `First Capital's digital onboarding platform uses an AI risk scoring engine
      to assign initial KYC risk tiers to new commercial customers, determining whether the
      customer undergoes standard or enhanced due diligence. The AI risk scoring engine is
      not registered in the SR 11-7 model inventory because the BSA compliance team classifies
      it as a process automation tool rather than a model, despite it generating a quantitative
      risk score that drives the customer's CDD pathway. The FRB/OCC/FDIC AI statement and
      SR 11-7 both encompass AI tools that generate quantitative outputs used to make compliance
      decisions about customers, and the FFIEC AML/CFT examination manual reinforces that
      AI-assisted risk scoring in KYC must meet model governance standards.`,
    keywords: ['SR 11-7', 'KYC', 'AI governance', 'FRB/OCC/FDIC AI statement', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4045',
    name: 'LLM Policy Summarization Generates Inaccurate Compliance Obligations',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's regulatory change management team uses an LLM to summarize
      new regulations and generate preliminary compliance obligation inventories distributed
      to business line compliance officers. The LLM summaries for two OCC final rules
      contained material inaccuracies — one summary omitted a key applicability threshold,
      another mischaracterized an effective date — that business lines relied upon without
      cross-referencing the source text. The FFIEC AI guidance for compliance management
      applications requires that AI-generated regulatory interpretation documents be reviewed
      by qualified compliance professionals before distribution; treating LLM summaries as
      primary compliance guidance without human validation creates a systematic exposure for
      material regulatory gaps to enter the compliance program.`,
    keywords: ['FFIEC AI guidance', 'LLM', 'regulatory change management', 'SR 11-7', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4046',
    name: 'AI Code Assistant Introduces Data Masking Errors in Regulatory Reporting Scripts',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's data engineering team uses a GenAI code assistant to accelerate
      development of HMDA, CRA, and Call Report data extraction scripts, and the code assistant
      in multiple instances generates SQL that incorrectly applies data masking logic — either
      over-masking fields required for regulatory submission or under-masking fields containing
      non-public personal information. The errors persist through code review because reviewers
      focus on functional correctness rather than regulatory field inclusion, and the masking
      defects are discovered only during pre-submission data quality checks. SR 11-7 encompasses
      data transformation processes material to regulatory reporting, and the FFIEC examination
      guidance on AI in banking operations requires human validation of AI-generated code that
      processes regulated data fields.`,
    keywords: ['SR 11-7', 'GenAI', 'HMDA', 'CRA', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4047',
    name: 'AI Stress Testing Scenario Generator Not Validated Against Historical Crises',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `First Capital pilots a GenAI stress scenario generation tool that produces
      hypothetical economic scenarios for DFAST supplemental analysis and ALCO portfolio
      stress testing, but the scenario generator has not been validated against historical
      crisis episodes — 2008 GFC, 2020 COVID shock, 2023 regional bank stress — to confirm
      that its scenarios reproduce plausible stress dynamics. SR 11-7 model validation
      requirements and DFAST guidance both require that stress models demonstrate the ability
      to generate plausible severe scenarios; a GenAI scenario generator that is not benchmarked
      against historical analogs may produce superficially novel scenarios that are structurally
      inconsistent with how banking sector stress propagates, creating false assurance in the
      stress testing program.`,
    keywords: ['DFAST', 'SR 11-7', 'GenAI', 'stress testing', 'model validation'],
    demoRelevant: true,
    subTopic: 'foundation-model-risk',
  },
  {
    code: 'B4048',
    name: 'LLM Retrieval-Augmented Generation Mixes Public and Privileged Sources',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `First Capital's internal legal and compliance research tool uses retrieval-
      augmented generation (RAG) that indexes both public regulatory sources and internal
      privileged communications — attorney-client memos, MRM consent order correspondence,
      and OCC examination workpaper drafts — in a unified vector store without access controls
      segregating privileged from public content. LLM responses to compliance queries may
      inadvertently surface privileged content to users without the appropriate access level,
      creating an attorney-client privilege waiver risk and an OCC examination response
      confidentiality risk. The FFIEC AI guidance on data governance for AI systems requires
      that retrieval systems enforce the same access controls as the underlying source documents.`,
    keywords: ['FFIEC AI guidance', 'LLM', 'data governance', 'attorney-client privilege', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4049',
    name: 'AI-Assisted Loan Pricing Engine Lacks HMDA Rate Spread Consistency Check',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description: `First Capital's AI-powered loan pricing engine generates individualized rate
      offers for residential mortgage applications based on borrower credit profile, market
      conditions, and profitability targets, but the engine does not include a real-time HMDA
      rate spread consistency check to flag pricing outcomes that would generate HMDA higher-
      priced mortgage loan designations at rates that differ materially across demographic
      proxies. The CFPB's fair lending examination procedures for AI pricing engines require
      that algorithmic pricing tools include guardrails preventing disparate pricing outcomes
      across protected class proxies before human review, not only as a post-hoc audit.`,
    keywords: ['HMDA', 'CFPB AI guidance', 'fair lending', 'ECOA', 'AI pricing engine'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4050',
    name: 'Autonomous AI Treasury Agent Executes FX Hedges Outside Approved Limit Structure',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description: `First Capital's treasury team pilots an autonomous AI agent that monitors
      foreign currency exposure for commercial clients with cross-border operations and
      executes FX forward hedge recommendations based on real-time rate and portfolio data.
      The AI agent's position limits were set during pilot configuration but were not
      integrated with the bank's risk limit management system, allowing the agent to
      accumulate FX forward positions that exceed the treasury risk policy limit during
      a period of elevated currency volatility. The FRB/OCC/FDIC AI statement's accountability
      and human oversight principles require that autonomous AI agents operating in financial
      markets be subject to the same limit structures as human traders.`,
    keywords: ['agentic AI', 'FRB/OCC/FDIC AI statement', 'treasury management', 'risk limits', 'operational risk'],
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4051',
    name: 'GenAI CRA Narrative Overstates Community Development Qualifying Activity',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `First Capital uses GenAI to draft Community Reinvestment Act performance
      narratives for the annual CRA self-assessment, and in the drafting process the LLM
      interpolates plausible-sounding qualifying activities — community development loans,
      service activities, and investment descriptions — that generalize from peer bank
      practices rather than accurately reflecting First Capital's documented CRA activities.
      The OCC's CRA examination process cross-references narrative claims against supporting
      documentation; GenAI-generated narratives that assert activities not supported by bank
      records create examination findings for misrepresentation that are distinct from the
      underlying CRA performance issue and reflect a GenAI output governance failure.`,
    keywords: ['CRA', 'GenAI', 'OCC examination', 'FFIEC AI guidance', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4052',
    name: 'AI Underwriting Explainer Tool Tested Only on Development Population',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `First Capital's post-hoc SHAP-based explainability tool for its ML mortgage
      underwriting model was validated for accuracy — measured as fidelity to the model's
      decisions — only on the model development population from 2019–2022, and was not tested
      on the current 2024 origination population where the applicant demographic mix, credit
      score distribution, and LTV profile have shifted. When the CFPB requests adverse action
      explanation fidelity evidence as part of a fair lending examination, the bank provides
      the 2022 development population fidelity metrics; examiners note that fidelity metrics
      on out-of-sample populations with different demographic representation are required to
      confirm that the explanation methodology accurately represents model behavior for
      current protected class applicants.`,
    keywords: ['CFPB AI guidance', 'ECOA', 'SR 11-7', 'adverse action', 'explainability'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4053',
    name: 'AI Model Pre-Deployment Risk Assessment Does Not Cover Regulatory Scope Creep',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital's AI governance pre-deployment risk assessment checklist covers
      model accuracy, data privacy, and cybersecurity but does not include a regulatory scope
      assessment to identify whether the AI tool's intended use could inadvertently create
      regulated activity obligations — for example, whether a GenAI financial planning chatbot
      constitutes investment advice, whether an AI document generation tool produces instruments
      subject to EFTA, or whether an agentic AI workflow constitutes automated decision-making
      under CCPA. The FFIEC AI guidance and OCC supervisory communications require that the
      pre-deployment risk review assess the full regulatory perimeter of the AI tool's output,
      not only its technical performance.`,
    keywords: ['FFIEC AI guidance', 'AI governance', 'SR 11-7', 'OCC examination', 'regulatory scope'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
  {
    code: 'B4054',
    name: 'LLM Used in Collections Workflow Creates FDCPA Communication Frequency Risk',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital's collections operations team uses an LLM-powered communication
      generator to personalize delinquency outreach messages across email, text, and letter
      channels, but the LLM scheduling logic does not track cumulative contact frequency per
      borrower per week across channels, allowing the system to generate compliant-looking
      individual messages that collectively exceed FDCPA's 7-day communication frequency
      presumption for a single debt. CFPB Regulation F requires collectors to track and limit
      contact frequency across all channels; an LLM communication workflow without cross-channel
      frequency aggregation creates systematic Reg F compliance risk that is compounded by the
      high output volume achievable with AI-assisted communication generation.`,
    keywords: ['CFPB AI guidance', 'Reg F', 'FDCPA', 'LLM', 'collections AI'],
    demoRelevant: true,
    subTopic: 'genai-output-risk',
  },
  {
    code: 'B4055',
    name: 'AI BSA Risk Rating Engine Overrides Manual Analyst Judgment Without Escalation',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's AI-powered BSA customer risk rating engine automatically
      overrides analyst-assigned risk ratings when the model's confidence score exceeds a
      defined threshold, without routing the override to a supervisor for review when the
      analyst and AI disagree. In BSA/AML operations, analyst judgment can incorporate
      contextual intelligence — local business knowledge, relationship history, law enforcement
      advisories — not available to the model; systematic AI override of analyst judgment
      without human escalation path eliminates contextual intelligence from the risk rating
      process. The FFIEC AML/CFT examination manual and the FRB/OCC/FDIC AI statement both
      require that AI decision authority in BSA operations be subject to human accountability
      and escalation controls.`,
    keywords: ['BSA/AML', 'FRB/OCC/FDIC AI statement', 'human-in-loop', 'AI governance', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'autonomous-ai',
  },
  {
    code: 'B4056',
    name: 'AI Model Vendor SLA Covers Uptime But Not Prediction Consistency',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: `First Capital's contract with a vendor AI credit model API defines SLA metrics
      exclusively in terms of system uptime and API latency, with no SLA provisions governing
      prediction consistency — the requirement that the same inputs produce the same outputs
      within a defined tolerance window. When the vendor silently A/B tests a model update,
      First Capital's loan officers observe inconsistent credit recommendations for structurally
      identical applications submitted at different times, creating compliance exposure under
      ECOA's requirement that credit decisions be based on consistent, non-arbitrary criteria.
      OCC Bulletin 2023-17 requires that contracts for critical AI services include performance
      standards covering the dimensions of risk most material to the regulated use case.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM', 'ECOA', 'vendor AI', 'SLA'],
    subTopic: 'ai-procurement',
  },
  {
    code: 'B4057',
    name: 'GenAI Used in Fair Lending Monitoring Without Disparate Impact Validation',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description: `First Capital's fair lending compliance team uses a GenAI tool to identify
      potential disparate impact patterns in lending data by generating natural language
      analyses of demographic outcome tables, but the GenAI tool's own outputs have not
      been tested for whether the model's interpretations of demographic patterns are
      consistent and unbiased across race and ethnicity categories in the data. Using a
      potentially biased AI tool to monitor for AI bias in lending creates a compounding
      risk: the monitoring layer may systematically understate or mischaracterize protected
      class outcome patterns in ways that satisfy legal review at the surface level without
      detecting genuine disparate impact. The CFPB AI guidance requires that AI tools used
      in compliance monitoring be subject to the same governance standards as AI tools
      used in regulated decisions.`,
    keywords: ['CFPB AI guidance', 'ECOA', 'GenAI', 'disparate impact', 'fair lending'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4058',
    name: 'AI Loan Origination System Logs Insufficient for Adverse Action Reconstruction',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description: `First Capital's AI-enabled digital loan origination platform logs the final
      credit decision and the model score at decision time but does not log the individual
      feature values, model version, and explanation output that constituted the adverse
      action basis at that specific moment. When a customer files a Reg B adverse action
      dispute 45 days after denial, the compliance team cannot reconstruct the exact
      explanation that should have accompanied the adverse action notice because model
      feature values at decision time are not preserved and the explanation output was
      generated but not retained. The CFPB's AI adverse action guidance and Reg B require
      that institutions retain documentation sufficient to demonstrate that the adverse
      action notice accurately reflected the actual decision basis, which requires logging
      the explanation at the point of decision.`,
    keywords: ['Reg B', 'ECOA', 'CFPB AI guidance', 'adverse action', 'AI logging'],
    demoRelevant: true,
    subTopic: 'explainability-fairness',
  },
  {
    code: 'B4059',
    name: 'AI Governance Maturity Assessment Uses Self-Reported Metrics Without Evidence Artifacts',
    officeCategory: 'back_office',
    failureRatePct: 80,
    description: `First Capital's annual AI governance maturity assessment — conducted to satisfy
      the consent order's AI governance remediation milestone — relies on business unit self-
      reported maturity ratings for model inventory completeness, validation independence, and
      monitoring effectiveness, without requiring submission of examination-ready evidence
      artifacts such as inventory reconciliation reports, validation independence sign-off
      records, and monitoring dashboard screenshots. The OCC's examination of the self-
      assessment finds that self-reported "Advanced" ratings for model inventory completeness
      are contradicted by inventory reconciliation data showing eleven unregistered AI tools,
      making the maturity assessment a formalistic exercise that does not satisfy the consent
      order's intent. The FRB/OCC/FDIC AI statement requires that AI governance assessments
      be evidence-based and independently verifiable.`,
    keywords: ['consent order', 'AI governance', 'SR 11-7', 'FRB/OCC/FDIC AI statement', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-governance-ops',
  },
];
