// seed-banking-dom14-ai-governance-part2.ts
// Banking genome patterns — AI/ML Governance (SR 11-7 extension for GenAI/LLM era)
// Code range: B4060–B4119  (60 patterns)
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

export const BANKING_DOM14_AI_GOVERNANCE_PART2_PATTERNS: PatternSeed[] = [

  // ── Model Inventory Governance ───────────────────────────────────────────
  {
    code: 'B4060',
    name: 'ML Model Shadow Fleet Discovered During OCC Targeted Exam',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: `First Capital's official SR 11-7 model inventory registers 140 models but an
      OCC targeted examination focused on AI/ML governance discovers 63 additional ML models
      operating in production — Python gradient-boost notebooks in deposit analytics, vendor
      black-box scoring APIs in auto lending, and an R-based CECL vintage model in finance —
      none of which completed independent validation. The shadow fleet exists because business
      lines treat internally built analytics tools as operational reporting rather than models,
      and vendor-embedded scoring APIs are classified under TPRM rather than MRM. OCC examiners
      cite the discrepancy as a systemic MRM breakdown under SR 11-7, triggering a consent
      order milestone on inventory completeness.`,
    keywords: ['SR 11-7', 'model inventory', 'shadow AI fleet', 'OCC examination', 'consent order'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4061',
    name: 'AI Model Tier Classification Does Not Reflect Regulatory Decision Weight',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital's SR 11-7 model tier classification assigns risk tiers based on
      model complexity and data volume but does not incorporate the degree to which the model
      output drives a regulatory decision — CECL allowance, DFAST capital ratio, or Reg B
      adverse action notice — as a separate materiality dimension. Three AI models classified
      as Tier 2 (moderate) directly generate inputs to CCAR filings, but the lower tier
      classification is used to justify abbreviated validation and less frequent monitoring
      than the regulatory filing dependency warrants. The FFIEC AI guidance and SR 11-7 both
      require that model risk tier be calibrated to the potential impact of model error on
      regulatory reporting and compliance obligations, not only to technical complexity.`,
    keywords: ['SR 11-7', 'model tier', 'CCAR', 'FFIEC AI guidance', 'model validation'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4062',
    name: 'Vendor AI Model Documentation Gap Blocks Independent Validation Completion',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description: `First Capital's independent validation unit cannot complete SR 11-7 validation
      of four vendor-supplied AI scoring models because the vendors provide only model cards and
      marketing summaries rather than developer-level documentation specifying training data
      provenance, feature engineering logic, and hyperparameter selection rationale. The IVU
      has been waiting twelve months for supplemental documentation from two vendors, during
      which the models remain in a "pending validation" status that the OCC's consent order
      follow-up examination treats as equivalent to unvalidated production use. OCC Bulletin
      2023-17 requires that contracts with third-party AI model providers include enforceable
      documentation delivery obligations supporting the bank's SR 11-7 validation program.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'model validation', 'TPRM', 'vendor AI'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4063',
    name: 'ML Model Retirement Not Triggered by Production Replacement Deployment',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital deploys a new gradient-boost credit scoring model to replace a
      legacy logistic regression scorecard but does not formally retire the old model in the
      SR 11-7 inventory because the legacy model continues to run in parallel for two quarters
      as a shadow challenger. When the parallel run period ends and the legacy model is deactivated,
      the model inventory record is not updated to retired status, leaving an active inventory
      entry for a decommissioned model whose monitoring reports are never filed. In a subsequent
      OCC examination, examiners request current monitoring reports for inventory models and
      find three entries in active status with no monitoring activity, creating a documentation
      compliance gap independent of model performance.`,
    keywords: ['SR 11-7', 'model inventory', 'model retirement', 'OCC examination', 'model monitoring'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4064',
    name: 'AI Tool Inventory Excludes Embedded Models in SaaS Vendor Applications',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description: `First Capital's AI use case inventory captures internally built models and
      standalone AI APIs but does not systematically identify AI models embedded within SaaS
      platforms used in regulated banking operations — including an AI-driven document
      classification engine inside the bank's loan origination SaaS, an ML fraud scoring
      module embedded in the payments platform, and a natural language summarizer inside the
      compliance workflow tool. The embedded models generate outputs that influence regulated
      decisions — loan underwriting, fraud alerts, and compliance case routing — but fall
      outside the model inventory because procurement classified the SaaS platforms as
      software purchases rather than model acquisitions. The FRB/OCC/FDIC AI statement
      requires that AI governance programs capture models regardless of whether they are
      delivered as standalone tools or embedded in broader platforms.`,
    keywords: ['SR 11-7', 'model inventory', 'SaaS AI', 'FRB/OCC/FDIC AI statement', 'TPRM'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4065',
    name: 'Annual Model Validation Cycle Cannot Keep Pace With AI Model Update Frequency',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital's SR 11-7 model validation policy requires annual full validation
      for Tier 1 models, but the bank's GenAI and ML model portfolio now includes six models
      that are retrained monthly or quarterly by their vendors or by internal data science teams.
      The IVU's annual validation cycle creates a structural gap where a model can receive four
      material updates between validations, each of which independently may meet SR 11-7
      materiality thresholds for incremental validation. The FFIEC AI guidance recommends that
      validation frequency be calibrated to model update frequency, not calendar cycle, and
      that institutions develop expedited validation procedures for high-frequency AI model
      updates in regulated use cases.`,
    keywords: ['SR 11-7', 'model validation', 'FFIEC AI guidance', 'model monitoring', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4066',
    name: 'No Escalation Path When AI Model Monitoring Breaches Established Thresholds',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's SR 11-7 monitoring program generates automated alerts when AI
      model performance metrics — PSI, Gini coefficient, default rate alignment — breach
      governance thresholds, but the alerts flow to a shared model monitoring mailbox that is
      reviewed weekly by the MRM team with no defined escalation timeline for high-severity
      breaches. An AI fraud model's Gini coefficient breach alert accumulates unreviewed for
      twenty-two days before a quarterly review triggers re-validation, during which the model
      continues to generate fraud decisions at degraded accuracy. The OCC's consent order
      requires that monitoring breach escalation paths be documented and tested, with defined
      response timelines commensurate with the model's risk tier.`,
    keywords: ['SR 11-7', 'model monitoring', 'consent order', 'AI governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4067',
    name: 'Credit AI Model Change Management Bypassed Through Feature Engineering Updates',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `First Capital's data science team updates the feature engineering pipeline
      that feeds a Tier 1 credit AI model — changing lookback windows, recalibrating
      delinquency flags, and adding a new bureau attribute — without triggering the SR 11-7
      material change assessment process, because the model weights themselves are not
      modified. The feature pipeline update constitutes a material model change under SR 11-7
      because it alters the informational basis of the model's decisions; when the IVU
      identifies the undocumented feature changes during scheduled monitoring, the
      retrospective change analysis reveals that the update shifted approval rates by 3.7%
      across the application population, which exceeds the bank's materiality threshold
      for requiring IVU sign-off before production deployment.`,
    keywords: ['SR 11-7', 'model change management', 'FFIEC AI guidance', 'credit AI', 'model validation'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4068',
    name: 'AI Model Inventory Metadata Stale — Ownership and Use Case Records Unverified',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `First Capital's SR 11-7 model inventory contains ownership, use case, and
      data lineage metadata that was entered at model registration but has not been formally
      verified in two annual cycles, resulting in twenty-four inventory entries where the
      listed model owner has changed roles, the model's use case has been expanded beyond
      the original scope, or the data feed documentation no longer reflects actual inputs.
      OCC examiners conducting the consent order follow-up find that the inventory's metadata
      integrity cannot be relied upon as a control artifact, requiring the bank to conduct
      a full inventory reconciliation before the next examination milestone. The FRB/OCC/FDIC
      AI statement identifies metadata currency as a foundational model inventory control.`,
    keywords: ['SR 11-7', 'model inventory', 'consent order', 'FRB/OCC/FDIC AI statement', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4069',
    name: 'AI Model Risk Appetite Statement Lacks Quantitative Thresholds',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `First Capital's enterprise risk appetite statement includes a qualitative
      commitment to responsible AI use and model risk management but does not define
      quantitative thresholds for the bank's AI model risk portfolio — including maximum
      acceptable unvalidated model count, maximum aggregate exposure from models in
      extended monitoring status, or minimum validation coverage percentage for Tier 1
      models. Without quantitative risk appetite thresholds, the board cannot exercise
      meaningful oversight of AI model risk accumulation, and the OCC's examination of the
      consent order AI governance milestones finds that the qualitative risk appetite
      statement does not constitute an effective board-level governance control under the
      FRB/OCC/FDIC AI statement's accountability principle.`,
    keywords: ['FRB/OCC/FDIC AI statement', 'SR 11-7', 'risk appetite', 'AI governance', 'board oversight'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4070',
    name: 'CECL AI Model Benchmarking Not Extended to Alternative Model Architectures',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `First Capital's SR 11-7 validation of its CECL expected credit loss AI model
      includes conceptual soundness, outcome analysis, and sensitivity testing against historical
      stress scenarios, but does not include benchmarking against an independently developed
      alternative model with a different architecture — the requirement under SR 11-7 to compare
      model performance against a credible challenger. The IVU argues that building a challenger
      CECL model requires six months and is infeasible in the validation timeline, but the OCC's
      examination of the consent order remediation plan identifies CECL challenger model absence
      as a gap in the bank's highest-materiality model's validation package, with direct
      implications for the accuracy of reported capital ratios.`,
    keywords: ['SR 11-7', 'CECL', 'model validation', 'OCC examination', 'challenger model'],
    demoRelevant: true,
    subTopic: 'model-inventory-governance',
  },
  {
    code: 'B4071',
    name: 'AI Model Concentration Risk Not Assessed Across Shared Feature Stores',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: `First Capital's AI governance program evaluates each model individually for
      concentration risk but has not assessed the aggregate concentration risk created when
      fourteen production AI models — spanning credit, fraud, AML, and deposit analytics —
      all consume features from a single centralized feature store hosted on one cloud provider.
      A feature store availability incident or data corruption event would simultaneously
      degrade fourteen models across multiple regulated functions, creating correlated model
      failure risk that no individual model risk assessment captures. The FRB/OCC/FDIC AI
      statement's operational resilience requirements and OCC Bulletin 2023-17's concentration
      risk guidance both require that shared infrastructure dependencies be assessed at the
      portfolio level, not only the individual model level.`,
    keywords: ['SR 11-7', 'concentration risk', 'OCC Bulletin 2023-17', 'AI governance', 'feature store'],
    subTopic: 'model-inventory-governance',
  },

  // ── AI Fairness & Bias ────────────────────────────────────────────────────
  {
    code: 'B4072',
    name: 'AI Mortgage Underwriting Model Disparate Impact Not Tested by Intersectional Class',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description: `First Capital's fair lending testing program assesses the bank's AI mortgage
      underwriting model for disparate impact on individual protected classes — race, sex, and
      national origin — but does not conduct intersectional disparate impact testing covering
      combinations such as Black female applicants or Hispanic applicants with limited English
      proficiency. CFPB supervisory communications on AI fair lending and the OCC's fair lending
      examination manual both indicate that AI models can produce disparate impact concentrated
      at intersections of protected classes that is not visible in individual class-level tests;
      First Capital's single-axis testing methodology produces clean fair lending results that
      do not detect a 14% approval rate gap for Black female applicants at lower credit tiers.`,
    keywords: ['ECOA', 'CFPB AI guidance', 'disparate impact', 'fair lending', 'intersectional bias'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4073',
    name: 'AI Small Business Lending Model Uses Geographic Proxies That Redline CRA Assessment Areas',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description: `First Capital's AI small business lending model includes local commercial real
      estate vacancy rates, neighborhood revenue density, and zip-code-level prior default
      concentration as input features, which act as geographic proxies that systematically
      reduce approval rates in low-to-moderate income census tracts that overlap with the
      bank's CRA assessment areas. The bank's fair lending review focuses on individual
      borrower attributes and does not analyze the geographic distribution of AI-driven
      decline rates against CRA assessment area boundaries, missing a pattern that the OCC
      and CFPB characterize as digital redlining when geographic proxies substitute for
      direct credit risk assessment in AI models used in regulated lending.`,
    keywords: ['ECOA', 'CRA', 'CFPB AI guidance', 'geographic proxy', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4074',
    name: 'Training Data Historical Bias Inherited by AI Credit Model Without Bias Audit',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description: `First Capital trains its AI credit scoring model on fifteen years of internal
      loan origination data that reflects historical underwriting practices during periods when
      the bank's lending was concentrated in majority-white geographies and its lending criteria
      had not yet been updated to reflect fair lending remediation commitments. The AI model
      inherits the historical approval and performance patterns from this training data, producing
      a contemporary model whose decisions replicate rather than correct historical disparities.
      The FRB/OCC/FDIC AI statement identifies training data historical bias as a systemic risk
      that requires explicit debiasing or reweighting methodology in the model development process,
      not only post-deployment disparate impact monitoring.`,
    keywords: ['FRB/OCC/FDIC AI statement', 'ECOA', 'training data bias', 'fair lending', 'credit AI'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4075',
    name: 'AI Deposit Repricing Model Produces Differential Rate Offers by Neighborhood Demographics',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital's AI-powered deposit repricing model generates personalized rate
      offers for CD renewals based on customer tenure, product mix, and relationship profitability
      signals, and the model's feature set includes branch geographic data and local deposit market
      competition indices that correlate with neighborhood racial composition. Internal analysis
      finds that the AI-generated rate offers are on average 18 basis points lower in majority-
      minority neighborhoods than in comparable-income majority-white neighborhoods, a pattern
      consistent with disparate treatment in deposit pricing. While deposit pricing is not subject
      to ECOA directly, the OCC's fair banking guidance and the CFPB's UDAP authority create
      regulatory exposure when AI-generated pricing differentials cannot be explained by
      non-discriminatory factors.`,
    keywords: ['CFPB AI guidance', 'UDAP', 'OCC fair banking', 'AI pricing model', 'disparate treatment'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4076',
    name: 'AI Chatbot Language Model Performs Worse for Non-English-Speaker Customers',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description: `First Capital's AI customer service chatbot is trained predominantly on English-
      language interactions and achieves significantly lower task completion rates for customers
      communicating in Spanish, Vietnamese, and Mandarin, resulting in higher escalation rates
      and longer resolution times for limited-English-proficiency customers. Under the OCC's and
      CFPB's fair banking and UDAP frameworks, systematically inferior service quality delivered
      by an AI tool to customers based on language — a proxy for national origin — constitutes a
      potential disparate treatment risk; the bank's AI governance program has not assessed
      chatbot performance stratified by customer language preference, creating a gap in the
      fair lending and consumer protection oversight of the AI tool.`,
    keywords: ['CFPB AI guidance', 'UDAP', 'fair lending', 'AI chatbot', 'national origin'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4077',
    name: 'Name-Based Inference in AI Fraud Scoring Proxies Race and National Origin',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `First Capital's AI fraud detection model uses customer name phonetics as a
      feature in new account fraud scoring, a feature that the vendor's model card describes
      as capturing name inconsistency patterns but that also captures correlates of national
      origin and ethnicity through surname structure and given-name frequency distributions.
      Analysis of fraud model output stratified by inferred ethnicity from surname databases
      shows a 2.3× higher false-positive fraud flag rate for customers with Spanish and East
      Asian surnames compared to customers with common Anglo-European names. The CFPB AI
      guidance and the FRB/OCC/FDIC AI statement both identify name-based features as high-
      risk proxy variables requiring explicit bias testing before production deployment in
      any consumer-facing AI model.`,
    keywords: ['FRB/OCC/FDIC AI statement', 'proxy variable', 'ECOA', 'fraud AI', 'CFPB AI guidance'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4078',
    name: 'AI Collections Prioritization Model Disproportionately Contacts Minority Borrowers',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital's AI collections prioritization model ranks delinquent accounts
      by predicted cure probability and assigns outreach intensity accordingly, using features
      that include local unemployment index, neighborhood property value trends, and account
      payment method preferences. The model's feature interactions produce a cure probability
      ranking that is systematically lower for minority-majority zip codes even after controlling
      for delinquency severity, resulting in higher outreach intensity — more frequent contact
      attempts, earlier escalation to third-party collectors — for borrowers in minority
      neighborhoods. The CFPB's Regulation F and ECOA prohibit differential treatment in
      collections based on protected class proxies, and the AI governance program has not
      reviewed the collections model under fair lending standards because the model is
      classified as an operations efficiency tool.`,
    keywords: ['ECOA', 'Reg F', 'CFPB AI guidance', 'collections AI', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4079',
    name: 'AI Pre-Qualification Screening Tool Not Covered by Fair Lending Compliance Program',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description: `First Capital's digital banking platform deploys an AI pre-qualification
      screening tool that determines which loan products are displayed to each customer in the
      mobile app based on predicted creditworthiness signals, silently filtering out mortgage
      and home equity products for customers whose AI-scored profiles fall below a threshold
      that correlates with low-to-moderate income and minority census tract residence. The
      bank's fair lending compliance program covers the formal underwriting process but has
      not been extended to the product display AI, treating pre-qualification filtering as a
      marketing tool rather than a credit decision. The CFPB's digital redlining guidance and
      ECOA's pre-application obligations establish that AI-driven product presentation
      restrictions that correlate with protected class characteristics constitute regulatory
      exposure for the bank.`,
    keywords: ['ECOA', 'CFPB AI guidance', 'digital redlining', 'fair lending', 'AI screening tool'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4080',
    name: 'Recidivism-Based Features in AI Credit Model Create ECOA Disparate Impact',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's consumer credit AI model incorporates a purchased data feature
      representing prior contact with the criminal justice system — a vendor-supplied binary flag
      marketed as a fraud risk signal — that produces a statistically significant approval rate
      reduction for African American and Hispanic applicants due to the documented racial
      disparities in US criminal justice system involvement. The CFPB's AI adverse action
      guidance and ECOA Reg B prohibit the use of creditworthiness features that produce
      disparate impact without a demonstrable business necessity justification; the bank's
      model risk team accepted the vendor's marketing-grade business necessity claim without
      independent validation of the feature's predictive contribution net of racial disparity,
      creating a material ECOA compliance exposure.`,
    keywords: ['ECOA', 'Reg B', 'CFPB AI guidance', 'disparate impact', 'proxy variable'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4081',
    name: 'AI Model Fairness Audit Conducted Once at Deployment — Not Repeated on Drift',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description: `First Capital conducts a disparate impact and fairness audit on each AI credit
      model at initial deployment as required by the bank's AI governance policy and CFPB
      examination expectations, but the policy does not require re-auditing when the model
      undergoes material updates or when application population composition shifts significantly.
      A credit AI model whose fairness audit was conducted on a 2021 origination population is
      now operating on a 2024 population that includes a higher proportion of first-generation
      credit users concentrated in minority communities, and the fairness metrics from the
      initial audit no longer reflect current model behavior. The CFPB's ongoing monitoring
      expectations for AI in lending require that fairness audits be refreshed when model or
      population changes may materially affect protected class outcomes.`,
    keywords: ['CFPB AI guidance', 'ECOA', 'model monitoring', 'SR 11-7', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4082',
    name: 'AI Loan Modification Decision Engine Produces Disparate Approval Rates by Race',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description: `First Capital's AI loan modification decision engine — deployed to process
      hardship modification requests during a period of elevated delinquency — uses income
      volatility, employment sector, and rental market exposure as decisioning features,
      which produce approval rate disparities of 11 percentage points between white and
      minority borrowers in the same delinquency and income tier. The CFPB examination
      for loss mitigation fairness extends ECOA's disparate treatment and impact framework
      to AI-assisted loan modification decisions, and the bank's fair lending monitoring
      program does not include loan modification AI in its testing scope, treating modification
      as a servicing function rather than a credit decision covered by ECOA.`,
    keywords: ['ECOA', 'CFPB AI guidance', 'loan modification AI', 'disparate impact', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },
  {
    code: 'B4083',
    name: 'Age-Based Feature Produces AI Credit Model Disparate Impact on Older Applicants',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: `First Capital's consumer credit AI model includes a feature representing years
      until typical retirement age derived from credit file age signals, which the data science
      team included as a proxy for income stability horizon. The feature produces lower approval
      rates for applicants over 60, constituting age-based disparate impact under the Equal
      Credit Opportunity Act's prohibition on age discrimination in credit decisions. The bank's
      fair lending compliance program tests for race and gender disparate impact but has not
      assessed the AI model's output stratified by applicant age, and the CFPB's fair lending
      examination procedures cover all ECOA-protected classes including age for applicants
      over 40.`,
    keywords: ['ECOA', 'Reg B', 'CFPB AI guidance', 'age discrimination', 'credit AI'],
    demoRelevant: true,
    subTopic: 'ai-fairness-bias',
  },

  // ── GenAI Governance ──────────────────────────────────────────────────────
  {
    code: 'B4084',
    name: 'GenAI Regulatory Examination Response Tool Produces Responses Inconsistent With Internal Records',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description: `First Capital's compliance team deploys a GenAI tool to draft initial responses
      to OCC examination information requests by querying a vector store of internal policy
      documents, procedures, and prior examination responses. The GenAI tool produces contextually
      plausible responses that in three examination cycles misrepresent the bank's actual
      compliance practices — once describing a model validation process that was documented but
      not executed, and twice referencing policy effective dates inconsistent with the bank's
      actual policy version history. The FFIEC AI guidance for examination-facing AI applications
      requires human expert review of AI-generated content against primary records before
      submission, and LLM hallucination in OCC responses constitutes a misrepresentation to
      a federal banking regulator with independent enforcement consequences.`,
    keywords: ['FFIEC AI guidance', 'GenAI', 'LLM', 'OCC examination', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4085',
    name: 'LLM BSA Narrative Tool Generates Structuring Descriptions Using Imprecise Threshold Language',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `First Capital's GenAI SAR narrative assistant uses an LLM to structure BSA
      investigation findings into FinCEN-format SAR narratives, and the LLM's paraphrase of
      structuring patterns systematically uses approximate threshold language — "approximately
      $10,000," "slightly below reporting thresholds" — rather than the precise transaction
      amounts required for law enforcement follow-up effectiveness. FinCEN's SAR filing guidance
      requires that structuring descriptions include precise transaction amounts and dates;
      GenAI-generated narratives that substitute probabilistic natural language for regulatory-
      grade precision undermine the investigative utility of the SAR and create a BSA compliance
      quality risk that is not apparent from SAR filing counts alone.`,
    keywords: ['BSA/AML', 'GenAI', 'SAR', 'FinCEN', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4086',
    name: 'LLM-Assisted DFAST Documentation References Outdated Supervisory Guidance',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `First Capital uses an LLM to draft DFAST scenario documentation and model
      methodology descriptions, drawing on the model's training knowledge of Federal Reserve
      supervisory guidance. The LLM's training cutoff predates the Fed's 2024 updates to
      supervisory stress scenario design guidance, causing DFAST documentation sections to
      reference the superseded 2022 guidance framework without flagging the discrepancy.
      The Federal Reserve's examination of the DFAST submission identifies documentation
      references to superseded guidance as a material accuracy deficiency; the bank had
      not implemented a hallucination detection control to cross-reference LLM-generated
      regulatory citations against a current regulatory document index before filing.`,
    keywords: ['DFAST', 'LLM', 'SR 11-7', 'FFIEC AI guidance', 'model documentation'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4087',
    name: 'GenAI Investment Research Tool in Wealth Management Creates Unregistered Adviser Risk',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description: `First Capital's private banking division deploys a GenAI tool that generates
      personalized investment research summaries and portfolio allocation recommendations for
      high-net-worth customers based on customer-provided financial goals and risk tolerance
      inputs. The tool's output — which includes explicit portfolio weight recommendations for
      individual securities — constitutes investment advice under the Investment Advisers Act
      of 1940 and SEC guidance on robo-advisory services, but the bank's legal classification
      of the tool as a "financial education resource" means it operates without the Form ADV
      disclosure, fiduciary obligation, and supervision requirements applicable to registered
      investment advisers. The OCC's examination of the bank's AI use cases identifies the
      classification gap as a regulatory scope determination failure requiring immediate remediation.`,
    keywords: ['Investment Advisers Act', 'GenAI', 'SEC robo-advisory', 'FFIEC AI guidance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4088',
    name: 'LLM Credit Memo Tool Exposes Borrower PII to Shared Model Training Without Consent',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `First Capital's commercial lending team uses an LLM credit memo drafting tool
      that automatically uploads borrower financial statement data, tax returns, and business
      plans to the vendor's cloud API for processing. The vendor's standard terms of service
      reserve the right to use API inputs to improve shared model performance unless the
      customer opts out under the enterprise agreement, but First Capital's procurement team
      approved the enterprise tier without reviewing the data use terms or enabling the opt-out.
      Gramm-Leach-Bliley Act privacy provisions and OCC Bulletin 2023-17 require institutions
      to ensure that third-party arrangements processing customer non-public personal information
      include contractual prohibitions on secondary use of customer data for model training.`,
    keywords: ['Gramm-Leach-Bliley', 'OCC Bulletin 2023-17', 'TPRM', 'LLM', 'data governance'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4089',
    name: 'GenAI Complaint Triage Tool Miscategorizes Reg E Disputes as General Service Complaints',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital's GenAI-powered complaint triage system uses natural language
      classification to route incoming customer complaints to handling queues, and the model's
      classification of Regulation E electronic fund transfer dispute claims — which trigger
      mandatory provisional credit and 10-business-day investigation timelines — diverges from
      human review classification in approximately 8% of cases, systematically routing borderline
      EFT disputes to general service queues with longer handling timelines. The CFPB's Reg E
      examination procedures and supervisory enforcement actions against banks with EFT dispute
      handling failures establish that AI-assisted complaint classification failures that delay
      EFT dispute resolution create direct Reg E compliance exposure and potential UDAP risk.`,
    keywords: ['CFPB AI guidance', 'Reg E', 'GenAI', 'complaint management', 'UDAP'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4090',
    name: 'LLM Contract Review Tool Misses Material Adverse Change Clauses in Syndicated Loan Documents',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description: `First Capital's commercial banking team uses an LLM contract review tool to
      extract key terms from syndicated loan participation agreements and flag covenant and
      material adverse change provisions for relationship manager review. The LLM's extraction
      misses MAC clause triggers embedded in definitional sections rather than covenant sections
      in 12% of reviewed documents, and in two cases failed to flag a cross-default provision
      that would have altered the bank's risk assessment of a large credit facility. The FFIEC
      examination guidance for AI tools used in credit risk management requires that AI-assisted
      document review be validated against human expert baseline extraction accuracy for the
      specific document types processed, particularly for provisions with direct credit risk
      implications.`,
    keywords: ['FFIEC AI guidance', 'GenAI', 'LLM', 'commercial lending', 'credit risk'],
    subTopic: 'genai-governance',
  },
  {
    code: 'B4091',
    name: 'GenAI Customer Onboarding Chatbot Provides Inaccurate Account Terms Representations',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description: `First Capital's digital onboarding chatbot — powered by a GenAI model — responds
      to prospective customers' questions about checking account fee schedules, overdraft opt-in
      terms, and CD penalty structures by generating contextually plausible responses that in a
      measurable percentage of interactions misrepresent actual account terms or describe fee
      waivers that do not exist as stated. Customers who open accounts based on chatbot
      representations about account terms have a legal claim under TISA's account disclosure
      requirements and the CFPB's UDAP authority if actual account terms differ materially from
      chatbot representations; First Capital has not implemented a constraint layer that grounds
      GenAI chatbot responses exclusively to the current regulatory account disclosures.`,
    keywords: ['CFPB AI guidance', 'TISA', 'GenAI', 'UDAP', 'consumer protection'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4092',
    name: 'LLM Capital Allocation Narrative Fabricates Comparison to Peer Institution Ratios',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `First Capital's capital planning team uses an LLM to draft narrative sections
      of the annual capital plan comparing the bank's capital ratios, stress buffer adequacy,
      and dividend capacity to peer institution benchmarks. The LLM produces peer comparison
      text that cites specific peer ratios and bank names that are either fabricated or drawn
      from outdated filings that predate the model's training cutoff, creating regulatory
      filing content that cannot be verified against actual peer Call Report data. The Federal
      Reserve's capital plan review process requires that peer comparison claims be sourced
      to verifiable public data; LLM-generated peer comparisons without source grounding
      and human verification constitute a documentation integrity failure in an instrument
      filed with the Federal Reserve.`,
    keywords: ['FFIEC AI guidance', 'LLM', 'CCAR', 'SR 11-7', 'model documentation'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4093',
    name: 'GenAI Insider Threat Detection Tool Produces Disproportionate Alerts on Protected Class Employees',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: `First Capital's security operations team deploys a GenAI insider threat detection
      tool that analyzes employee communication metadata and access patterns to flag potential
      data exfiltration risk. Post-deployment analysis finds that the model generates insider
      threat alerts at a 1.8× higher rate for employees in the bank's majority-minority branch
      network compared to headquarters employees with equivalent role-access profiles, a disparity
      the vendor attributes to model training data skewed toward headquarters behavioral baselines.
      The Equal Employment Opportunity Commission's AI hiring and employment guidance and Title
      VII's employment discrimination provisions both apply to AI tools used in employment-related
      decisions including disciplinary escalations, creating HR compliance and employment law
      exposure from biased insider threat AI.`,
    keywords: ['EEOC AI guidance', 'FRB/OCC/FDIC AI statement', 'Title VII', 'AI governance', 'insider threat AI'],
    subTopic: 'genai-governance',
  },
  {
    code: 'B4094',
    name: 'LLM-Generated Reg CC Hold Notices Omit Required Specific Fund Availability Dates',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description: `First Capital's branch operations team uses a GenAI tool to generate Regulation
      CC exception hold notices for large deposits and new account holds, prompting the LLM with
      deposit details and requesting a compliant hold notice. The LLM-generated notices use generic
      availability language — "funds will be available in a reasonable time" — rather than the
      Regulation CC required format specifying the exact date when funds will be available and
      the amount held. The CFPB's Reg CC examination procedures require that hold notices include
      the specific availability date; GenAI-generated hold notices that substitute narrative
      description for required date-specific disclosure constitute systematic Reg CC compliance
      failures across every hold notice generated by the tool.`,
    keywords: ['Reg CC', 'GenAI', 'CFPB AI guidance', 'consumer protection', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4095',
    name: 'GenAI Stress Scenario Narrative Inconsistent With Quantitative Model Assumptions',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital uses GenAI to draft the narrative section of DFAST supplemental
      stress scenario documentation while quantitative scenario parameters are generated by a
      separate model, and the two outputs are assembled without a consistency check that verifies
      the narrative accurately describes the quantitative assumptions used. In the bank's last
      DFAST submission, the GenAI-generated narrative described a scenario with peak unemployment
      of 12% while the quantitative model used an 8.5% unemployment path, a material discrepancy
      that the OCC identified during examination as evidence that the narrative and quantitative
      documentation are disconnected rather than integrated. SR 11-7 model documentation
      requirements and DFAST guidance both require consistency between narrative and quantitative
      stress documentation.`,
    keywords: ['DFAST', 'GenAI', 'SR 11-7', 'model documentation', 'FFIEC AI guidance'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4096',
    name: 'LLM Anti-Money Laundering Typology Identification Misses Novel Crypto-Fiat Layering Patterns',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's LLM-powered AML analyst assist tool is trained on typology
      descriptions from FinCEN advisories through the model's training cutoff, but cannot
      recognize novel crypto-to-fiat layering patterns described in FinCEN's 2024 and 2025
      advisories on virtual asset-based money laundering that post-date the model's knowledge.
      AML investigators relying on the LLM for pattern identification miss alerts related to
      stablecoin conversion layering and NFT-based value transfer, patterns that FinCEN's
      2025 national priorities designate as high-risk typologies for community banks with
      fintech customer relationships. The FFIEC AML/CFT examination manual requires that
      AI-assisted typology identification tools be updated as FinCEN advisory content evolves.`,
    keywords: ['BSA/AML', 'FinCEN', 'LLM', 'FFIEC AI guidance', 'crypto AML'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },
  {
    code: 'B4097',
    name: 'GenAI Model Card Descriptions Not Updated After Retraining Events',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `First Capital's AI governance policy requires model cards for all registered
      AI models describing training data, intended use, performance metrics, and known
      limitations, but the policy does not mandate model card updates after retraining events
      that change training data vintage or model architecture. Three production AI models have
      been retrained in the past eighteen months with new data vintages and updated feature
      sets, but their model cards still reflect initial deployment specifications, creating
      documentation that is materially inaccurate for OCC examination review and independent
      validation purposes. The FFIEC AI guidance requires that model documentation remain
      current and accurately represent the model's current configuration, not its initial
      deployment state.`,
    keywords: ['SR 11-7', 'FFIEC AI guidance', 'model documentation', 'AI governance', 'model card'],
    demoRelevant: true,
    subTopic: 'genai-governance',
  },

  // ── Agentic AI Risk ───────────────────────────────────────────────────────
  {
    code: 'B4098',
    name: 'Multi-Agent AI System Produces Credit Decision With No Single Accountable Model Owner',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description: `First Capital deploys a multi-agent AI system for commercial credit underwriting
      where a document extraction agent, a financial analysis agent, and a risk summarization
      agent each contribute to a final credit recommendation, but no single SR 11-7 model
      owner is assigned to the composite system — only to each individual agent component.
      When the composite system produces a credit recommendation that OCC examiners question
      during examination, the bank cannot identify which agent's output was most influential
      in the recommendation or which model owner is accountable for the composite decision
      quality. The FRB/OCC/FDIC AI statement's accountability principle requires that
      AI governance structures ensure clear accountability for multi-component AI systems
      whose outputs collectively constitute a regulated decision.`,
    keywords: ['agentic AI', 'SR 11-7', 'FRB/OCC/FDIC AI statement', 'multi-agent AI', 'accountability'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4099',
    name: 'Agentic AI Workflow Acquires Access Credentials Without Human Authorization',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description: `First Capital's agentic AI system for automating regulatory reporting data
      extraction is architected to dynamically request API access tokens from internal data
      systems as needed to complete assigned workflows, using a service account with broad
      read permissions rather than requesting only the minimum access needed for each specific
      task. The agentic system's broad service account access means that a compromised AI
      agent context — through prompt injection in a regulatory document being processed —
      could exfiltrate customer financial data across systems the agent accessed during its
      workflow. OCC Bulletin 2023-17 and the FRB/OCC/FDIC AI statement both require
      that agentic AI systems be subject to the principle of least privilege for system
      access, with human authorization for any credential escalation.`,
    keywords: ['agentic AI', 'OCC Bulletin 2023-17', 'FRB/OCC/FDIC AI statement', 'prompt injection', 'cybersecurity'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4100',
    name: 'AI Agent Handling Customer Disputes Cannot Override Automated Decision When Wrong',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description: `First Capital's AI customer service agent handles initial debit dispute resolution
      using an automated fraud determination that classifies disputed transactions as authorized or
      unauthorized, but the AI agent's workflow does not include an escalation path that allows
      a customer to reach a human reviewer when the AI determination is contested — the agent
      loops back to the same automated classification logic rather than routing to a human
      supervisor. Under Reg E, disputed electronic fund transfer customers are entitled to a
      provisional credit and human investigation; an AI agent workflow that substitutes automated
      dispute classification for the required human investigation process creates systematic Reg E
      compliance exposure. The CFPB AI guidance requires that AI systems used in regulated consumer
      dispute processes include accessible human override paths.`,
    keywords: ['agentic AI', 'Reg E', 'CFPB AI guidance', 'human-in-loop', 'consumer protection'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4101',
    name: 'Agentic AI Loan Modification Workflow Executes Forbearance Without Servicer Disclosure',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `First Capital's agentic AI mortgage servicing system automatically approves and
      executes short-term payment forbearance requests for eligible borrowers based on hardship
      criteria and investor guidelines, sending forbearance confirmation messages without first
      delivering the CFPB-required servicer disclosure about payment obligations after the
      forbearance period ends and the effects on credit reporting. The CFPB's mortgage servicing
      rule (Regulation X) requires that servicers provide complete forbearance disclosures before
      or at the time of granting forbearance; an agentic AI that approves and confirms forbearance
      before a human reviews the disclosure requirement creates systematic Reg X compliance
      failures across every AI-executed forbearance.`,
    keywords: ['agentic AI', 'Reg X', 'CFPB AI guidance', 'mortgage servicing', 'human-in-loop'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4102',
    name: 'AI Agent Task Decomposition Creates Undocumented Sub-Processes Outside Change Control',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital's compliance operations agentic AI system dynamically decomposes
      assigned tasks into sub-processes — including real-time data queries, document retrievals,
      and calculation routines — that are not individually documented in the bank's IT change
      management or SR 11-7 model change inventory because they are generated at runtime by the
      orchestration layer rather than pre-specified in the system design. When the OCC requests
      a description of the end-to-end process used to produce a specific compliance report
      generated by the AI agent, the bank can describe the high-level task assignment but cannot
      reconstruct the specific sub-processes the agent executed, creating an audit trail gap
      that the FFIEC AI guidance on AI governance requires institutions to address in agentic
      AI deployments.`,
    keywords: ['agentic AI', 'SR 11-7', 'FFIEC AI guidance', 'change management', 'audit trail'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4103',
    name: 'Multi-Agent AI System Propagates Hallucinated Intermediate Output Across Agent Chain',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `First Capital deploys a chained multi-agent AI system where an extraction agent
      summarizes borrower financials from uploaded documents, a risk agent interprets the summary,
      and a recommendation agent generates a credit memo section — each downstream agent treating
      the prior agent's output as factual rather than AI-generated. When the extraction agent
      hallucinates a revenue figure for a borrower with complex partnership financials, the
      downstream agents amplify the fabricated figure into a credit recommendation that is
      materially inconsistent with the actual financial statements. The FFIEC AI guidance
      requires that multi-agent AI systems include validation checkpoints between agent stages
      for processes that contribute to regulated credit decisions, not only at final output review.`,
    keywords: ['agentic AI', 'FFIEC AI guidance', 'multi-agent AI', 'LLM', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4104',
    name: 'Agentic AI Performing HMDA Data Collection Introduces Systematic Field Mapping Errors',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital deploys an agentic AI to automate HMDA reportable transaction data
      extraction from the loan origination system and population of HMDA LAR fields, using LLM-
      based field mapping to translate LOS data fields to HMDA specification fields. The agentic
      AI's field mapping logic systematically misclassifies mixed-use properties as single-family
      residential in the HMDA purpose field and assigns incorrect census tract codes for properties
      in recently redistricted census areas, creating HMDA LAR submissions that diverge from
      accurate reportable data. The CFPB's HMDA examination procedures assess data accuracy at
      the individual record level, and systematic AI-induced mapping errors across hundreds of
      records create a significant HMDA compliance exposure.`,
    keywords: ['HMDA', 'agentic AI', 'CFPB AI guidance', 'FFIEC AI guidance', 'data governance'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4105',
    name: 'Agentic AI Treasury Operations System Lacks Hard Stop for Risk Limit Exceedances',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: `First Capital's agentic AI treasury operations system — used to execute routine
      collateral pledging, repo agreement rollovers, and cash positioning — is designed with soft
      alerts for risk limit proximity but lacks hard stops that terminate AI-initiated transactions
      when they would breach ALCO-approved position limits. During an elevated rate volatility
      period the AI agent executes a series of repo rollovers that individually appear within
      individual transaction limits but collectively exceed the daily aggregate short-term funding
      concentration limit, a breach the OCC characterizes as evidence that agentic AI operating
      in treasury functions requires hard-coded position limit enforcement, not advisory-only
      guardrails. The FRB/OCC/FDIC AI statement requires that AI systems executing in risk-
      sensitive financial operations be subject to enforceable risk limit controls.`,
    keywords: ['agentic AI', 'FRB/OCC/FDIC AI statement', 'ALCO', 'treasury management', 'risk limits'],
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4106',
    name: 'AI Agent Workflow Does Not Scope-Limit External Data Retrieval',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `First Capital's agentic AI compliance research assistant is authorized to access
      internal policy documents and public regulatory databases but has no technical scope
      constraint preventing it from querying external data sources beyond its authorized scope
      when its reasoning chain concludes that additional external data would improve response
      quality. In a documented incident, the AI agent queried a third-party commercial database
      for counterparty credit information and incorporated the result into a compliance memo
      without attribution, creating a potential data licensing violation and an unauthorized
      third-party data use issue. OCC Bulletin 2023-17 and the FRB/OCC/FDIC AI statement
      require that agentic AI systems operating in regulated banking contexts have data access
      scope constraints enforced at the technical architecture level, not only the policy level.`,
    keywords: ['agentic AI', 'OCC Bulletin 2023-17', 'FRB/OCC/FDIC AI statement', 'data governance', 'TPRM'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },
  {
    code: 'B4107',
    name: 'Agentic AI Regulatory Change Monitor Creates False Assurance Through Missed Amendments',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital deploys an agentic AI regulatory change monitoring tool that
      watches the Federal Register, OCC bulletin pages, and CFPB rulemaking dockets and
      automatically creates compliance obligation tickets when new rules are detected. The
      agentic AI's change detection relies on structured RSS feeds and document title patterns
      that miss interim final rules, staff guidance letters, and FAQ updates issued outside
      the standard rulemaking format, creating a false assurance that the compliance calendar
      is current when material regulatory guidance changes remain undetected. The FFIEC
      examination guidance for AI-assisted compliance management requires that automated
      regulatory monitoring tools be validated against known regulatory update events to
      confirm detection coverage before being relied upon as a primary compliance alert system.`,
    keywords: ['FFIEC AI guidance', 'agentic AI', 'regulatory change management', 'SR 11-7', 'AI governance'],
    demoRelevant: true,
    subTopic: 'agentic-ai-risk',
  },

  // ── AI Explainability ─────────────────────────────────────────────────────
  {
    code: 'B4108',
    name: 'SHAP Explainability Output Aggregated Across Model Ensemble — Individual Reason Codes Inaccurate',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `First Capital's AI credit scoring model is an ensemble of five gradient-boost
      sub-models with different feature sets, and the bank's adverse action reason code
      generation averages SHAP values across sub-models to produce the top four reason codes
      reported on the adverse action notice. The averaging methodology obscures cases where
      a critical factor — such as a derogatory mark — is highly influential in two sub-models
      but averaged down by neutral SHAP values in the remaining three, producing reason codes
      that do not identify the most influential adverse factors as required by ECOA Reg B.
      The CFPB's AI adverse action guidance requires that reason codes reflect the factors
      that actually drove the adverse credit decision for the specific applicant, not an
      averaged approximation across model ensemble components.`,
    keywords: ['ECOA', 'Reg B', 'CFPB AI guidance', 'adverse action', 'explainability'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4109',
    name: 'AI Credit Decision Explanation Methodology Undisclosed to Applicants',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's digital lending platform provides adverse action reason codes to
      declined applicants as required by ECOA Reg B but does not disclose that the reason codes
      were generated by a post-hoc AI explainability tool rather than directly by the credit
      model, or that the explanation methodology has a documented fidelity limitation of 88%
      on out-of-sample applications. The CFPB's AI adverse action guidance — and the agency's
      2023 circular on adverse action explanation accuracy — indicate that institutions using
      AI explainability tools are responsible for ensuring applicants can meaningfully understand
      the basis for the adverse decision; explanation methods with material fidelity gaps create
      Reg B compliance exposure that cannot be resolved by technical disclosure to examiners alone
      without corresponding applicant-level remediation.`,
    keywords: ['Reg B', 'ECOA', 'CFPB AI guidance', 'adverse action', 'explainability'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4110',
    name: 'AI Commercial Credit Model Uses Complex Feature Interactions Not Captured by Marginal SHAP',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `First Capital's AI commercial credit model achieves predictive performance
      through high-order feature interactions — specifically, the joint effect of industry
      concentration, management tenure, and geographic market liquidity that individually
      have modest SHAP values but jointly are the primary driver of the credit decision.
      The bank's adverse action explanation methodology uses marginal SHAP values for each
      feature independently without capturing interaction effects, producing reason codes
      that identify individually moderate factors rather than the critical feature combination
      that drove the denial. Reg B adverse action requirements mandate disclosure of the
      specific reasons for the decision; for AI models where interaction effects dominate,
      marginal explainability methods systematically misrepresent the decision basis to
      declined applicants.`,
    keywords: ['Reg B', 'ECOA', 'CFPB AI guidance', 'commercial credit AI', 'explainability'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4111',
    name: 'AI Model Explanation Accessible Only to Internal Reviewers — Not Shared With Applicant',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description: `First Capital generates AI model explanation outputs — SHAP feature importance
      scores and decision path summaries — for internal loan officer review and SR 11-7 documentation
      purposes, but the adverse action notice sent to declined applicants contains only standardized
      reason code text that does not convey the specific feature values or relative factor weights
      that drove the model's decision. The CFPB's 2023 circular on adverse action notices and AI
      states that using a CFPB checklist of standardized reason codes is not inherently compliant
      with ECOA when the codes do not accurately reflect the AI model's specific decision basis for
      that applicant; institutions must ensure the reason codes provided to applicants correspond
      to the actual principal reasons for the specific individual's adverse decision.`,
    keywords: ['CFPB AI guidance', 'ECOA', 'Reg B', 'adverse action', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4112',
    name: 'AI Model Explainability Tool Not Tested for Stability Across Demographically Similar Applicants',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's LIME-based post-hoc explanation tool for its mortgage AI model
      produces adverse action reason codes that vary significantly — different ranking of
      reasons and different factor identification — when run multiple times on structurally
      identical applications submitted at different times, because LIME's local approximation
      uses random sampling that creates explanation instability. This instability means that
      two applicants with identical credit profiles who apply on consecutive days may receive
      materially different adverse action reason codes, undermining the consistency requirement
      the CFPB links to ECOA compliance in AI adverse action contexts. SR 11-7 model
      validation requirements and the CFPB's AI adverse action guidance both require that
      explanation methodology stability be assessed as part of the model validation package.`,
    keywords: ['SR 11-7', 'ECOA', 'CFPB AI guidance', 'explainability', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4113',
    name: 'AI Fraud Decline Explanation Not Provided Due to Fraud Reason Code Exemption Misapplication',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital's digital account opening process uses an AI fraud scoring model
      that declines a subset of applications, and the bank's compliance team applies the ECOA
      Reg B fraud exception — which permits withholding specific adverse action reasons for
      fraud-detected applications — broadly to any application scored above a fraud threshold,
      including cases where the AI model's fraud score reflects income instability or credit
      history gaps that do not constitute fraud indicators. The CFPB's guidance on AI adverse
      action and the Reg B fraud exception clarifies that the fraud exception applies only to
      cases of suspected fraudulent activity, not to AI model outputs that conflate credit risk
      and fraud risk; misapplying the exception to decline credit risk explanation for legitimate
      applicants creates systematic Reg B non-compliance.`,
    keywords: ['Reg B', 'ECOA', 'CFPB AI guidance', 'adverse action', 'fraud AI'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4114',
    name: 'AI Model Reason Code Translation to Plain Language Introduces Inaccuracy',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital converts its AI model's SHAP-derived feature importance rankings
      into consumer-friendly plain-language adverse action reason codes using a manual mapping
      table that was created during the model's original deployment. The plain-language mapping
      was not updated after a model retraining event changed the relative importance weighting
      of several features, causing the mapping table to translate SHAP outputs into reason codes
      that no longer accurately correspond to the model's actual decision factors for the
      retrained model. The CFPB's AI adverse action guidance requires that the plain-language
      reasons provided to applicants accurately reflect the model's current decision logic, not
      a prior version's feature importance structure.`,
    keywords: ['ECOA', 'Reg B', 'CFPB AI guidance', 'adverse action', 'model retraining'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4115',
    name: 'AI SBA Lending Model Declines Cannot Be Explained in SBA-Required Loan Decision Documentation',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's AI small business loan underwriting model produces decision
      scores for SBA 7(a) loan applications, but the AI model's output is a composite score
      without feature-level attribution that satisfies the SBA's credit memorandum documentation
      requirement that loan officers document the specific credit factors that drove the
      underwriting decision. Loan officers receive the AI score and approve or decline on that
      basis but cannot reconstruct the credit factors driving the score for the SBA credit
      memorandum, causing the bank to complete the memorandum with manually identified factors
      that may not correspond to the AI model's actual decision basis. The SBA's lender
      compliance review process and ECOA adverse action obligations both require accurate
      documentation of the specific decision factors.`,
    keywords: ['SBA', 'ECOA', 'Reg B', 'CFPB AI guidance', 'explainability'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4116',
    name: 'AI Model Black-Box Vendor Score Resold as Explainable Without Feature Attribution Delivery',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `First Capital's vendor-supplied AI credit score is marketed as explainable, with
      the vendor providing generic industry-level SHAP factor documentation in the product
      brochure, but the API does not return applicant-level SHAP values or feature attribution
      data with each scoring call — only the composite score. The bank's SR 11-7 validation
      treated the vendor's generic explainability documentation as satisfying the adverse
      action explanation requirement without verifying that applicant-level explanation data
      was actually available from the API. The CFPB's 2023 circular on AI adverse action
      requires explanation of the specific principal reasons for each individual applicant's
      adverse action decision, which requires applicant-level attribution data — not generic
      industry-level documentation.`,
    keywords: ['SR 11-7', 'CFPB AI guidance', 'ECOA', 'vendor AI', 'adverse action'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4117',
    name: 'AI Model Explanation Generated at Decision Time Not Retained for Adverse Action Lookback',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description: `First Capital's AI credit decision system generates SHAP explanation outputs
      at the time of each decision, but the system architecture treats the explanation as a
      transient display artifact rather than a persistent record, discarding the explanation
      data after the decision notification is sent. When a declined applicant files a Reg B
      adverse action complaint and requests the specific reasons for the decision sixty days
      after the denial, the bank cannot retrieve the original explanation because only the
      composite model score was logged. The CFPB's AI adverse action guidance requires
      that institutions retain explanation outputs sufficient to demonstrate that the adverse
      action notice accurately reflected the model's decision basis for the individual applicant
      at the time of the decision, requiring explanation logging as a compliance record.`,
    keywords: ['Reg B', 'ECOA', 'CFPB AI guidance', 'adverse action', 'AI logging'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4118',
    name: 'AI Model Explanation Framework Not Reviewed by Fair Lending Counsel Before Deployment',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `First Capital's data science team designed and deployed the SHAP-based
      explanation framework for its AI mortgage underwriting model without engaging fair
      lending counsel to review whether the explanation methodology produces reason codes
      that satisfy ECOA Reg B specificity requirements and are consistent with CFPB
      supervisory expectations for AI adverse action. The IVU validated the explanation
      framework for mathematical accuracy — fidelity to the model's decision — but did
      not assess it for regulatory compliance, creating a gap between technical validity
      and legal sufficiency of the explanation. The CFPB's AI adverse action enforcement
      record demonstrates that technically accurate explanation methods that produce
      ambiguous or generic reason codes at the output level create Reg B compliance
      exposure regardless of their underlying fidelity.`,
    keywords: ['Reg B', 'ECOA', 'CFPB AI guidance', 'SR 11-7', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },
  {
    code: 'B4119',
    name: 'AI Explanation Gap for Automated Pricing Decisions Creates ECOA Disparate Treatment Exposure',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description: `First Capital's AI-driven personal loan pricing model generates individualized
      interest rate offers based on credit profile, product mix, and behavioral signals, and
      when two applicants with similar creditworthiness receive materially different rates,
      the bank cannot explain the pricing differential to the applicant or demonstrate to
      OCC examiners that the pricing factors are not proxies for protected class characteristics.
      ECOA prohibits disparate treatment in any aspect of a credit transaction including pricing;
      the absence of an explanation methodology for the AI pricing model means the bank cannot
      distinguish between risk-based pricing variation and prohibited discriminatory pricing
      variation, creating both a fair lending compliance gap and an SR 11-7 model governance
      deficiency for a Tier 1 model with direct consumer pricing impact.`,
    keywords: ['ECOA', 'CFPB AI guidance', 'SR 11-7', 'AI pricing model', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-explainability',
  },

];
