// seed-banking-dom01-model-risk-part4.ts
// Banking genome patterns — Model Risk Management (SR 11-7 / SR 11-8)
// Code range: B280–B339  (60 patterns)
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

export const BANKING_DOM01_MODEL_RISK_PART4_PATTERNS: PatternSeed[] = [

  // ── Model Governance ──────────────────────────────────────────────────────
  {
    code: 'B280',
    name: 'MRM Policy Not Reviewed After Consent Order Expansion — Governance Gap Persists',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's model risk management policy was last formally reviewed eighteen
      months before the OCC consent order was issued; since the consent order, no policy
      review has been completed to incorporate the consent order's specific remediation
      requirements into standing MRM policy language. SR 11-7 requires that MRM policy
      reflect current governance standards and regulatory expectations; operating under a
      consent order with an unreflected MRM policy means the bank's governance framework
      document and its regulatory obligation document are not aligned, and examiners
      conducting a follow-up review cite the gap as evidence that the consent order
      remediation has not been institutionalized into permanent governance structure.`,
    keywords: ['SR 11-7', 'MRM policy', 'consent order', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B281',
    name: 'Model Risk Governance Committee Quorum Requirements Not Enforced — Decisions Lacking Oversight',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's MRM governance committee charter specifies quorum requirements
      ensuring that CRO, CFO, and independent validation unit lead participate in any
      model approval or exception decision, but in practice quorum is not tracked and
      six material model approval decisions over the past year were made in meetings
      where one or more required participants were absent. SR 11-7 governance requirements
      for model oversight committees demand that the committee function as designed;
      when OCC examiners review committee meeting minutes and discover that quorum
      requirements were routinely waived informally, the undocumented governance
      exceptions are cited as structural MRM committee control failures under the
      active consent order.`,
    keywords: ['SR 11-7', 'MRM committee', 'model governance', 'OCC examination', 'consent order'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B282',
    name: 'Model Risk Escalation Path Undefined for First Line of Defense Discoveries',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's three-lines-of-defense model risk framework defines the IVU as the
      second-line validator and internal audit as the third-line reviewer, but does not
      specify a clear escalation path for first-line business unit staff who discover
      model performance anomalies, data quality issues, or out-of-scope model use in
      their day-to-day operations. When a commercial relationship manager notices that
      the credit scoring model is producing implausible outputs for a specific borrower
      industry segment, there is no documented escalation channel and the observation
      is never reviewed by the MRM function; SR 11-7 requires that governance
      frameworks enable observations at all lines of defense to reach the model risk
      function, and an undefined first-line escalation path creates a systematic model
      risk blind spot.`,
    keywords: ['SR 11-7', 'model governance', 'three-lines-of-defense', 'model monitoring', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B283',
    name: 'Board-Level Model Risk Reporting Lacks Aggregate Risk Metrics — Only Status Updates',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's board risk committee receives quarterly model risk reports that
      summarize validation completion status, open finding counts, and new model
      registrations but do not present aggregate model risk metrics — such as total
      model risk exposure by business line, capital at risk attributable to model
      uncertainty, or concentration of unvalidated model use in material portfolios.
      SR 11-7 requires that board oversight of model risk be substantive and informed;
      a board report that presents process metrics without risk-level metrics does not
      enable the board to assess whether the bank's aggregate model risk is within
      appetite, and OCC examiners reviewing board reporting quality cite the absence
      of risk-level metrics as a governance deficiency.`,
    keywords: ['SR 11-7', 'model governance', 'MRM committee', 'OCC examination', 'model risk appetite'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B284',
    name: 'Model Risk Independence Impaired by Shared Reporting Line Between MRM and Model Development',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's MRM function and the quantitative analytics team that develops
      models for credit, capital, and treasury both report to the CFO, creating a
      structural independence conflict where the executive responsible for model
      development outcomes also oversees the function charged with identifying model
      deficiencies. SR 11-7 requires that the model risk function have sufficient
      independence from model development to conduct objective oversight; OCC examiners
      reviewing the bank's governance structure during the consent order remediation
      assessment find that the shared reporting line creates an independence impairment
      that must be remediated, typically by reporting MRM to the CRO rather than the CFO,
      before the bank can demonstrate the governance structure expected by the guidance.`,
    keywords: ['SR 11-7', 'model governance', 'independent validation unit', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B285',
    name: 'Model Change Control Policy Threshold Too High — Minor Recalibrations Escape Governance',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's model change control policy requires MRM review and IVU validation
      only for changes classified as "major" — defined as changes to core algorithm,
      training data source, or output format — while "minor" changes such as parameter
      recalibrations, threshold adjustments, and variable weight updates are permitted
      without MRM review. Over an eighteen-month period, the CECL loss model undergoes
      eleven recalibrations classified as minor that collectively shift the model's
      average loss estimate by 14%; SR 11-7 requires that the change management process
      be calibrated to capture all changes that materially affect model output, and
      cumulative minor changes that produce a material aggregate effect are a documented
      governance gap that OCC examiners explicitly test for through change log analysis.`,
    keywords: ['SR 11-7', 'model governance', 'model change management', 'CECL', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B286',
    name: 'MRM Function Staffing Inadequate for Consent Order Remediation — Validation Backlog Accumulates',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's MRM consent order requires that all high-tier models be validated
      within 180 days; the IVU's current staffing level of four validator FTEs can complete
      approximately 18 validations per year, while the consent order remediation backlog
      requires 44 validations in the same period. The staffing gap is known to the CRO
      and is documented in the consent order project plan, but budget approval for
      additional IVU staff has been delayed by two quarterly planning cycles;
      SR 11-7 requires that the model risk function be appropriately resourced relative
      to the size and complexity of the model portfolio, and an IVU structurally incapable
      of meeting its own consent order timeline is a governance finding that the OCC
      will cite in the progress assessment if the backlog does not clear.`,
    keywords: ['SR 11-7', 'model governance', 'consent order', 'independent validation unit', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B287',
    name: 'Model Tiering Criteria Not Calibrated to Regulatory Capital Materiality',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's SR 11-7 model tiering framework assigns risk tiers based on model
      complexity and business line usage without explicitly incorporating a criterion for
      whether the model materially influences regulatory capital calculations, DFAST
      stress results, or CECL allowance determinations. Several models that directly
      input into DFAST credit loss projections are classified as Tier 2 rather than Tier 1
      because their technical complexity scores are moderate; the tiering misclassification
      causes these regulatory-capital-material models to receive validation resources
      appropriate for lower-risk operational tools, and OCC examiners reviewing the
      tiering methodology identify the missing regulatory capital materiality criterion
      as a calibration deficiency that understates the validation priority of models
      with direct regulatory filing consequences.`,
    keywords: ['SR 11-7', 'model governance', 'DFAST', 'OCC 2011-12', 'model risk appetite'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B288',
    name: 'Model Governance Framework Not Extended to Third-Party Hosted Scoring Engines',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's model governance framework explicitly covers internally developed
      and deployed models but does not include a governance track for vendor-hosted
      scoring engines where the model is accessed via API and the bank has no access
      to model code, training data, or technical documentation. The bank's CRA small
      business lending product uses a third-party hosted credit scoring engine that
      generates credit recommendations for small business applicants; the engine is
      not in the SR 11-7 inventory and has not been assessed for fair lending risk
      or ECOA adverse action explainability. OCC 2013-29 and SR 11-7 together require
      governance proportional to the risk of all models used in bank decision-making
      regardless of hosting location.`,
    keywords: ['SR 11-7', 'OCC 2013-29', 'TPRM', 'model governance', 'CRA'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },
  {
    code: 'B289',
    name: 'Annual Model Risk Attestation Process Does Not Include Business Line Self-Assessment',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's annual model risk attestation process requires the CRO and IVU lead
      to attest to the adequacy of model risk governance but does not include a structured
      self-assessment by business line model owners — the individuals closest to day-to-day
      model use who would be most aware of out-of-scope use, undocumented modifications,
      and emerging model performance issues. SR 11-7's governance framework envisions model
      risk oversight as a shared responsibility across lines of defense; an annual attestation
      process that collects governance certifications only from central risk functions
      without a business line self-assessment component misses the systematic feedback
      loop that would surface first-line model risk observations before they escalate
      to examination findings.`,
    keywords: ['SR 11-7', 'model governance', 'three-lines-of-defense', 'OCC 2011-12', 'model risk appetite'],
    demoRelevant: false,
    subTopic: 'model-governance',
  },
  {
    code: 'B290',
    name: 'Model Risk Culture Metrics Not Included in Performance Management for Model Owners',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's performance management framework for model development and business
      line staff does not include model risk culture metrics — such as timely MDD submission,
      model change notification compliance, or response to validation findings — creating
      no individual accountability incentive for the behaviors that SR 11-7 governance
      depends on. When validation findings are not resolved within the agreed remediation
      timeline, the IVU escalates to the MRM committee but no individual performance
      consequence attaches to the model owner; SR 11-7 requires management accountability
      for model risk governance, and OCC examiners increasingly probe whether banks have
      embedded model risk accountability into the incentive and performance management
      structures that govern individual behavior, not just into committee oversight processes.`,
    keywords: ['SR 11-7', 'model governance', 'model risk appetite', 'OCC examination', 'MRM committee'],
    demoRelevant: false,
    subTopic: 'model-governance',
  },
  {
    code: 'B291',
    name: 'Model Governance Policy Gaps Allow Exception Approvals Without Expiry or Tracking',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's MRM governance framework includes an exception process that allows
      models to be deployed with open validation findings under an exception approval,
      but the exception policy does not require a defined expiry date, a remediation
      commitment with milestones, or tracking in the model inventory against the
      exception status. Over 36 months, 23 exception approvals accumulate with no
      expiry, no remediation closure, and no escalation trigger; when OCC examiners
      request the open exception population as part of the consent order follow-up,
      the bank cannot confirm which exceptions are still active, which have been resolved,
      and which are effectively permanent — a model lifecycle governance failure that
      SR 11-7 explicitly anticipates by requiring that exception use be tracked and
      time-limited.`,
    keywords: ['SR 11-7', 'model governance', 'consent order', 'OCC examination', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'model-governance',
  },

  // ── Model Lifecycle ───────────────────────────────────────────────────────
  {
    code: 'B292',
    name: 'Model Pre-Approval Checklist Not Completed Before Development Resources Allocated',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's model development process requires a pre-approval checklist confirming
      that the business need is documented, the proposed model approach has been reviewed
      by the MRM function, and data availability has been assessed before development
      resources are committed; in practice, three of the last eight model development
      projects began construction before the pre-approval checklist was signed, because
      business sponsors treated the checklist as a post-hoc documentation requirement.
      SR 11-7 requires that governance controls be applied throughout the model lifecycle
      beginning at initiation, not merely at deployment; models built without pre-approval
      review frequently encounter SR 11-7 compliance barriers late in development that
      require costly rework or result in deployment delays that damage business sponsor
      confidence in the MRM process.`,
    keywords: ['SR 11-7', 'model lifecycle', 'model governance', 'OCC 2011-12', 'model documentation'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B293',
    name: 'Model Retirement Process Does Not Include Data Retention Assessment for Regulatory Access',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's model retirement governance process decommissions models by
      revoking system access, archiving code, and updating inventory status but does
      not systematically assess whether the model's historical output data — credit
      scores assigned to loan decisions, CECL allowance estimates, stress test projections —
      needs to be retained for regulatory examination access over the standard examination
      lookback window. When an OCC examiner requests model outputs supporting a DFAST
      submission from two years prior, the retired model's scored data has been deleted
      from the model output repository as part of routine data housekeeping; SR 11-7
      model lifecycle governance requires that retirement processes preserve regulatory
      access to model outputs for the periods required by examination and regulatory
      reporting obligations.`,
    keywords: ['SR 11-7', 'model lifecycle', 'model retirement', 'DFAST', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B294',
    name: 'Parallel Run Period Between Old and New Model Not Structured as Validation Evidence',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `When First Capital replaces its commercial real estate appraisal review model,
      a 90-day parallel run period is conducted where both old and new models score
      the same appraisal queue, but the parallel run is managed by the model development
      team rather than the IVU and its results are not structured as validation evidence —
      the outputs are compared informally and a decision to deploy the new model is
      made based on business sponsor satisfaction rather than a statistically structured
      comparison against defined acceptance criteria. SR 11-7 requires that parallel
      runs conducted as part of model validation be designed with pre-specified acceptance
      criteria and conducted under IVU oversight; a parallel run managed by the
      development team without formal acceptance criteria provides no independent
      validation evidence that the new model meets the performance standard required
      for deployment.`,
    keywords: ['SR 11-7', 'model lifecycle', 'model validation', 'independent validation unit', 'commercial real estate'],
    demoRelevant: false,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B295',
    name: 'Model Deployment Approval Sign-Off Not Captured in Audit Trail',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's model deployment process requires documented approval from the
      IVU, the model owner, and the MRM committee before a model is moved to production,
      but approval is recorded in email threads rather than in the model inventory system —
      creating an audit trail that cannot be systematically queried, is vulnerable to
      email archive gaps, and does not link approval records to the specific model version
      deployed. SR 11-7 model lifecycle governance requires a demonstrable approval chain
      for each production deployment; when OCC examiners request evidence of pre-deployment
      approval for three specific models, the bank's inability to produce the approval
      records in a systematic form rather than searching email archives is cited as an
      audit trail deficiency under the consent order remediation expectations.`,
    keywords: ['SR 11-7', 'model lifecycle', 'model governance', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B296',
    name: 'New Product Model Requirements Not Triggered Until After Business Case Approval',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's new product approval process includes a model risk assessment
      requirement, but the model risk gate is positioned after business case approval
      rather than during the product design phase, meaning that product structure
      decisions — pricing methodology, risk segmentation approach, regulatory
      classification — are locked before the MRM function reviews their model
      implications. When a new structured HELOC product with a complex rate-reset
      mechanism requires a customized interest rate risk model that the IVU estimates
      will require eight months to develop and validate, the product launch timeline
      is already committed in the business case; SR 11-7 integration into new product
      governance requires that model risk be assessed during product design, not
      after commercial decisions have been made.`,
    keywords: ['SR 11-7', 'model lifecycle', 'model governance', 'interest rate risk', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B297',
    name: 'Model Sunset Criteria Not Defined — Models Persist Beyond Useful Predictive Horizon',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's model governance framework defines processes for model development,
      validation, and ongoing monitoring but does not specify sunset criteria — measurable
      thresholds at which a model's declining performance, data coverage deterioration,
      or regulatory environment change should trigger consideration for retirement or
      replacement. Several credit models built during the zero-interest-rate environment
      of 2012–2021 continue in production without any governance trigger to assess
      whether their core rate assumptions remain valid in the current 5%+ rate environment;
      SR 11-7's requirement for ongoing model performance assessment implicitly requires
      that governance frameworks include criteria for when performance deterioration
      reaches a level that justifies model replacement rather than ongoing recalibration.`,
    keywords: ['SR 11-7', 'model lifecycle', 'model governance', 'model monitoring', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B298',
    name: 'Post-Deployment Model Performance Review Schedule Not Linked to Model Tier',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's model monitoring program requires all models to submit annual
      performance monitoring reports regardless of tier, business criticality, or
      the rate of change in the model's operating environment; high-tier CECL allowance
      models receive the same monitoring frequency as low-tier management reporting
      tools that have no capital or regulatory reporting impact. SR 11-7 model
      monitoring requirements should be calibrated to model risk; a uniform monitoring
      schedule that does not differentiate by tier, materiality, or change exposure
      wastes validation resources on low-risk models while providing only annual
      visibility into high-risk models that warrant monthly or quarterly monitoring
      — a monitoring design gap that OCC examiners flag when reviewing the bank's
      monitoring program adequacy.`,
    keywords: ['SR 11-7', 'model lifecycle', 'model monitoring', 'OCC 2011-12', 'CECL'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B299',
    name: 'Emergency Model Override Process Bypasses IVU Review — Override Patterns Untracked',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's model governance framework includes an emergency override process
      that permits senior management to apply judgmental adjustments to model outputs
      under crisis conditions — such as pandemic-period economic disruption — without
      the standard IVU review cycle, but the override process does not require systematic
      documentation of override frequency, magnitude, or business rationale in the model
      inventory. Over an 18-month period following a macroeconomic stress event, 34
      emergency overrides are applied to the CECL allowance model without documentation
      in the model governance system; SR 11-7 requires that management overrides be
      documented, tracked, and assessed for pattern, because persistent high-frequency
      override use signals model conceptual soundness deterioration that should trigger
      a re-validation.`,
    keywords: ['SR 11-7', 'model lifecycle', 'CECL', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B300',
    name: 'Model Performance Monitoring Report Distribution Does Not Include CRO or Model Owner',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's model monitoring reports are produced by the IVU and distributed
      only within the MRM function, without systematic distribution to the CRO, the
      business line model owner, or the MRM committee unless a finding triggers an
      escalation threshold. When the quarterly monitoring report for the commercial
      loan PD model shows a 12-percentage-point degradation in rank-ordering accuracy
      over three consecutive quarters — a trend that does not cross the defined
      escalation threshold but is directionally significant — neither the CRO nor
      the business line risk officer receives the report and no action is taken before
      an OCC examiner discovers the trend in the monitoring history during an examination.
      SR 11-7 requires that performance monitoring results reach the model owners and
      risk governance functions responsible for acting on them.`,
    keywords: ['SR 11-7', 'model lifecycle', 'model monitoring', 'MRM committee', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },
  {
    code: 'B301',
    name: 'Model Re-Training Schedule Not Accelerated When Portfolio Composition Shifts Materially',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's credit loss models are retrained on a fixed annual schedule
      without a provision to accelerate the retraining cycle when the portfolio
      composition shifts materially — for example, when a commercial banking initiative
      doubles the concentration of healthcare sector loans within 12 months.
      The models continue generating loss estimates based on a training dataset that
      does not represent the current portfolio mix, systematically underestimating
      sector-specific risk for the newly concentrated segments; SR 11-7 ongoing
      model performance assessment requires that banks respond to material changes
      in model operating conditions, and a fixed retraining calendar without
      environmental triggers is a lifecycle governance design deficiency.`,
    keywords: ['SR 11-7', 'model lifecycle', 'CECL', 'model monitoring', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'model-lifecycle',
  },

  // ── Model Risk Appetite ───────────────────────────────────────────────────
  {
    code: 'B302',
    name: 'Model Risk Appetite Statement Not Linked to Board-Approved Risk Tolerance Levels',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's enterprise risk appetite statement includes qualitative language
      on model risk — "maintain a low tolerance for material model risk" — but does not
      translate this into quantitative metrics such as maximum percentage of capital
      estimates attributable to unvalidated models, maximum open finding age for
      high-tier models, or maximum model override rate for CECL allowance determination.
      SR 11-7 requires that model risk be managed within a defined governance framework
      with management accountability; a risk appetite statement that remains qualitative
      does not provide the measurable thresholds that would allow the board to assess
      whether the bank is operating within appetite, and OCC examiners reviewing the
      MRM consent order remediation progress expect quantitative risk appetite metrics
      as a governance baseline.`,
    keywords: ['SR 11-7', 'model risk appetite', 'model governance', 'MRM committee', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-risk-appetite',
  },
  {
    code: 'B303',
    name: 'Tolerance for Unvalidated Model Use in Regulatory Submissions Not Explicitly Zero',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's model risk appetite framework does not explicitly state a zero
      tolerance for unvalidated models in regulatory capital, DFAST stress, or CECL
      allowance submissions; the framework instead describes a goal to "minimize"
      unvalidated model use in regulatory filings without defining a specific maximum.
      The absence of an explicit zero-tolerance statement for regulatory submissions
      enables the bank to operate with models pending validation while still feeding
      their outputs into regulatory filings under an exception approval, creating
      exactly the governance gap that the MRM consent order was issued to address.
      OCC examiners expect that institutions under MRM consent orders have adopted
      zero tolerance for unvalidated model use in any regulatory filing context.`,
    keywords: ['SR 11-7', 'model risk appetite', 'DFAST', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-risk-appetite',
  },
  {
    code: 'B304',
    name: 'Model Uncertainty Reserve Not Established for CECL Allowance Determination',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      `First Capital's CECL allowance methodology does not include an explicit model
      uncertainty reserve component — an allowance buffer calibrated to the aggregate
      model uncertainty across the CECL model suite, scaled to the known limitations,
      validation findings, and performance volatility of the models that generate
      the quantitative loss estimate. SR 11-7 and FASB ASC 326 together support the
      concept of a qualitative adjustment for model risk; without a model uncertainty
      reserve, First Capital's CECL allowance fully reflects model point estimates
      without buffering for known model limitations, and OCC examiner assessment of
      the bank's CECL reasonableness finds no evidence that model uncertainty is
      quantified and reserved for in the allowance determination process.`,
    keywords: ['SR 11-7', 'CECL', 'model risk appetite', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-risk-appetite',
  },
  {
    code: 'B305',
    name: 'Risk Appetite Breach Escalation for Model Risk Not Tested With Simulated Threshold Breach',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's model risk appetite framework includes escalation triggers
      defined for specific threshold breaches — such as more than ten high-tier
      models with overdue validation — but the escalation mechanics have never been
      tested with a simulated threshold breach to confirm that the monitoring
      system detects the breach, the correct escalation notification fires, and
      the governance committee receives the escalation in the timeframe required
      by the policy. SR 11-7 operational risk governance for model risk management
      requires that governance controls be tested for effectiveness; an untested
      escalation mechanism may contain detection or notification gaps that are only
      discovered during a real threshold breach when the governance response is
      needed to prevent a consent order reporting violation.`,
    keywords: ['SR 11-7', 'model risk appetite', 'model governance', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-risk-appetite',
  },
  {
    code: 'B306',
    name: 'Model Risk Appetite Not Differentiated by Business Line Risk Profile',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's model risk appetite applies uniform tolerance thresholds across
      all business lines without differentiating based on the regulatory sensitivity,
      capital materiality, or consumer protection exposure of each line's model
      portfolio; the retail mortgage business — where model errors in fair lending
      models carry regulatory enforcement risk — operates under the same model risk
      tolerance as the treasury cash management reporting tools. SR 11-7 requires
      model governance to be proportional to model risk; a one-size-fits-all risk
      appetite that does not elevate tolerance standards for business lines with
      regulatory filing, capital, or consumer harm consequences systematically
      under-governs the highest-risk portions of the model portfolio.`,
    keywords: ['SR 11-7', 'model risk appetite', 'model governance', 'OCC 2011-12', 'Reg B'],
    demoRelevant: false,
    subTopic: 'model-risk-appetite',
  },
  {
    code: 'B307',
    name: 'AI Model-Specific Risk Appetite Metrics Not Defined Separately From Traditional Model Limits',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's model risk appetite framework uses metrics designed for traditional
      statistical models — validation coverage ratio, finding age, and override frequency —
      but does not include AI-specific appetite metrics such as maximum acceptable LLM
      hallucination rate for regulatory-filing use cases, maximum model drift tolerance
      for production ML models before mandatory retraining, or AI model explainability
      threshold below which adverse action explainability obligations cannot be met.
      OCC supervisory expectations for AI governance issued in 2024 and 2025 explicitly
      identify the need for AI-specific risk appetite metrics as a governance gap in
      existing SR 11-7 frameworks; without AI-specific thresholds, the bank's appetite
      framework cannot assess whether its AI model portfolio is within the boundaries
      that regulators increasingly test for in AI model risk examinations.`,
    keywords: ['SR 11-7', 'model risk appetite', 'AI/ML', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-risk-appetite',
  },
  {
    code: 'B308',
    name: 'Aggregate Model Risk Exposure Not Quantified — Capital-at-Risk From Model Uncertainty Unknown',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's MRM function tracks model validation status, open findings, and
      tier distribution but does not produce an aggregate model risk exposure estimate
      quantifying the range of capital or allowance outcomes attributable to model
      uncertainty across the DFAST and CECL model suites. The absence of a capital-at-risk
      estimate from model uncertainty means the board cannot assess whether the bank is
      holding sufficient capital buffers to absorb adverse model performance, and the
      ICAAP does not include model risk as a quantified Pillar 2 exposure. SR 11-7's
      model risk management framework implicitly requires understanding of aggregate model
      risk magnitude, and OCC capital adequacy examiners expect that banks operating
      under MRM consent orders have made progress toward quantifying aggregate model risk
      as a capital planning input.`,
    keywords: ['SR 11-7', 'model risk appetite', 'DFAST', 'CECL', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-risk-appetite',
  },
  {
    code: 'B309',
    name: 'Risk Appetite Metric Reporting Cadence Too Infrequent to Detect Rapid Inventory Degradation',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's model risk appetite metrics are reported to the MRM committee on
      a quarterly basis, which creates a potential 90-day gap between when the bank
      crosses a risk appetite threshold — such as the maximum allowable count of
      overdue validations — and when the governance committee receives a report that
      would trigger corrective action. When a wave of model revalidations is delayed
      by six IVU staff departures, the bank exceeds its maximum overdue validation
      threshold within 45 days but the quarterly reporting cycle means the governance
      breach is not reported to the MRM committee for another 45 days. SR 11-7 model
      governance requires that risk appetite monitoring be sufficiently frequent to
      enable timely corrective action, particularly for banks operating under active
      consent order remediation.`,
    keywords: ['SR 11-7', 'model risk appetite', 'model governance', 'consent order', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'model-risk-appetite',
  },

  // ── AI Model Risk Part 4 ──────────────────────────────────────────────────
  {
    code: 'B310',
    name: 'AI Synthetic Data Training Pipeline Not Assessed for Regulatory Bias Amplification',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's data science team uses a synthetic data generation AI to augment
      thin-file credit applicant training data — producing synthetic credit bureau profiles
      to improve model performance for consumers with limited credit history. The synthetic
      data generation AI is not subject to SR 11-7 model inventory registration or validation,
      and no assessment has been conducted to determine whether the synthetic data generation
      methodology systematically amplifies historical lending disparities by over-representing
      characteristics of approved borrowers from prior periods when discriminatory lending was
      practiced. CFPB and OCC fair lending guidance on AI training data governance and SR 11-7
      together require that banks validate the data preparation tools that generate training
      inputs for credit models, as synthetic data bias is a specific AI capability risk that
      can propagate historical discrimination into new model generations.`,
    keywords: ['SR 11-7', 'AI/ML', 'CFPB', 'model validation', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B311',
    name: 'AI Model Explainability Tool Generates Inconsistent Adverse Action Reasons Across Identical Inputs',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital deploys an AI explainability tool to generate Reg B adverse action
      reason codes for credit denials produced by its gradient boosting credit model;
      the explainability tool uses a SHAP-based attribution method to identify the top
      denial reasons. During validation, the IVU discovers that the explainability tool
      generates different top-reason orderings for identical input profiles on different
      run iterations, because the SHAP background sample is resampled randomly rather
      than fixed — the specific AI explainability instability risk that OCC and CFPB
      examiners have identified as creating adverse action compliance exposure when
      applicants who reapply after addressing the stated reasons are denied for reasons
      that differ from those in the original adverse action notice.`,
    keywords: ['SR 11-7', 'Reg B', 'AI/ML', 'model validation', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B312',
    name: 'AI Model Cards Not Maintained for Vendor ML Models in Production',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital has adopted an AI model card documentation standard for internally
      developed ML models, requiring documentation of intended use, known limitations,
      performance metrics by demographic segment, and applicable regulatory scope; however,
      the standard has not been extended to require vendor-supplied AI model cards as
      a procurement condition for third-party ML models. When OCC examiners request
      model documentation for the bank's three vendor AI credit scoring models, the
      bank can produce only vendor marketing materials and technical integration guides
      rather than SR 11-7-compliant model cards; OCC guidance on AI governance for
      banking institutions identifies model cards as a governance best practice that banks
      should contractually require from AI vendors before onboarding high-risk AI models.`,
    keywords: ['SR 11-7', 'OCC 2013-29', 'vendor AI', 'model documentation', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B313',
    name: 'Agentic AI Treasury Reconciliation Bot Accesses Production Data Without Model Inventory Registration',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's treasury operations team deploys an agentic AI system that
      autonomously reconciles interbank settlement positions, identifies breaks, and
      initiates correction requests to counterparty banks via SWIFT messaging — a
      production financial workflow function with direct impact on the bank's settlement
      risk position and regulatory reporting. The agentic AI treasury bot is procured
      as an operations automation tool and is not registered in the SR 11-7 model
      inventory; SR 11-7's model perimeter encompasses automated systems that make
      or recommend financial decisions with material operational or regulatory impact,
      and an unregistered agentic AI system accessing SWIFT production messaging in an
      autonomous reconciliation role represents a model governance gap that OCC
      operational risk examination guidance identifies as requiring SR 11-7-aligned
      governance regardless of product packaging.`,
    keywords: ['SR 11-7', 'AI/ML', 'model inventory', 'SWIFT', 'operational risk'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B314',
    name: 'AI Model Drift Monitoring Alert Thresholds Set at Development-Time Statistics — Never Updated',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's ML model monitoring program configures drift alert thresholds —
      PSI thresholds for input distribution drift and KS statistic thresholds for
      output score distribution drift — at the time of model deployment using the
      development-period data distribution as the reference baseline, without
      updating the reference baseline when the model is retrained or when the
      portfolio composition shifts materially. After two years, the credit scoring
      model's reference baseline reflects a 2022 credit environment while the live
      portfolio reflects 2025 risk characteristics; the drift monitor reports
      green status because it is comparing the live distribution against a stale
      reference, and the specific AI monitoring risk of stale reference baselines
      causing false-negative drift detection is not addressed in the SR 11-7
      monitoring program design.`,
    keywords: ['SR 11-7', 'AI/ML', 'model monitoring', 'model drift', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B315',
    name: 'AI Loan Pricing Personalization Engine Not Tested for Rate Disparity Across Protected Classes',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's consumer lending digital origination platform uses an AI pricing
      personalization engine that dynamically adjusts interest rate offers based on
      predicted borrower lifetime value, digital engagement signals, and real-time
      competitive positioning data. The AI pricing engine is validated for revenue
      optimization performance but not tested for whether its personalized rate
      recommendations produce systematic rate disparities across demographic groups
      — the specific AI fair lending risk identified by CFPB supervisory guidance on
      algorithmic pricing in consumer lending. When an internal fair lending analyst
      samples 3,000 AI-generated rate offers and finds a 42 basis point average rate
      premium for Hispanic borrowers controlling for credit risk characteristics,
      the bank has no SR 11-7-required validation evidence to explain or rebut the
      disparity.`,
    keywords: ['SR 11-7', 'AI/ML', 'ECOA', 'CFPB', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B316',
    name: 'GenAI Internal Audit Co-Pilot Tool Creates Hallucinated Findings in Draft Audit Reports',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's internal audit function deploys a GenAI co-pilot that drafts
      model risk audit findings from examiner workpapers and interview notes, reducing
      finding drafting time by 60%. The GenAI tool generates findings referencing
      specific SR 11-7 subsections, OCC examination expectations, and prior finding
      patterns — but the tool's accuracy on regulatory citation has not been validated,
      and three of the GenAI-drafted findings in a model risk audit report contain
      inaccurate SR 11-7 subsection references and one cites an OCC bulletin number that
      does not exist. When the CRO presents the audit report to the OCC examination team
      containing a hallucinated regulatory citation, the error undermines the bank's
      credibility in the consent order remediation dialogue — the specific GenAI
      hallucination risk in regulatory reporting contexts that OCC guidance identifies
      as requiring accuracy validation before deployment.`,
    keywords: ['SR 11-7', 'LLM', 'model inventory', 'OCC examination', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B317',
    name: 'AI Model Version Control Not Enforced — Production and Development Models Share Same Endpoint',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's ML model serving infrastructure allows data scientists to update
      model files at the production endpoint directly from the development environment
      without requiring a formal promotion workflow, a version tag increment in the model
      registry, or an IVU notification. When a data scientist makes a "quick fix" to
      the fraud detection model's feature computation logic to address a data pipeline
      issue, the production model silently changes without triggering the change management
      process, and the model inventory records the pre-fix model as the current production
      version. SR 11-7 model lifecycle governance and the specific AI/ML infrastructure
      risk of version control bypass are well-documented OCC examination concerns; the
      combination of uncontrolled model updates and stale inventory records creates
      a governance gap that makes the bank's SR 11-7 compliance posture fundamentally
      unreliable.`,
    keywords: ['SR 11-7', 'AI/ML', 'model lifecycle', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B318',
    name: 'AI Customer Complaint Routing Model Not Validated for UDAP Risk in Channel Deflection',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's digital banking platform uses an AI model to route incoming customer
      complaints and service requests to either self-service deflection — chatbot resolution —
      or human agent escalation, based on predicted resolution probability and channel cost.
      The AI routing model has been validated for operational efficiency but not assessed
      for UDAP risk in whether the channel deflection logic systematically routes
      regulatory complaints — such as billing errors, credit reporting disputes, and
      Reg E unauthorized transaction claims — to self-service channels where they
      are less likely to be resolved, creating a pattern of complaint suppression
      that CFPB examination guidance on AI-driven complaint handling identifies as
      a potential unfair or deceptive practice requiring SR 11-7-aligned governance
      review.`,
    keywords: ['SR 11-7', 'AI/ML', 'CFPB', 'model validation', 'Reg E'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B319',
    name: 'Multi-Modal AI Document Processing Model Not Validated for OCR Accuracy on Borrower Tax Documents',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's digital mortgage origination platform uses a multi-modal AI model
      to extract income, employment, and asset data from borrower-submitted PDF tax
      documents, W-2 forms, and bank statements to auto-populate the underwriting data
      file. The AI document processing model was validated using a test dataset of
      high-quality scanned documents but not assessed for accuracy on the range of
      document quality — handwritten annotations, low-resolution fax-sourced documents,
      and non-standard tax preparer formats — that applicants actually submit. The
      specific AI capability risk of multi-modal model accuracy degradation on real-world
      document quality requires SR 11-7 validation testing on a representative sample
      of production document quality, and undetected extraction errors feed incorrect
      income and asset data into underwriting decisions with both credit risk and ECOA
      compliance consequences.`,
    keywords: ['SR 11-7', 'AI/ML', 'model validation', 'ECOA', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B320',
    name: 'AI BSA/AML Watchlist Screening Model Not Assessed for Sanction Evasion Pattern Coverage',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description:
      `First Capital's AI-powered watchlist screening model uses fuzzy matching and
      entity resolution to identify potential OFAC and FinCEN watchlist matches in
      customer onboarding and transaction monitoring workflows. The AI model is
      validated for false positive reduction — a vendor-reported 40% alert reduction
      compared to rule-based screening — but has not been independently validated
      against First Capital's actual OFAC violation risk environment for the specific
      sanction evasion typologies involving nominee accounts, transliteration variants,
      and beneficial ownership obfuscation that FinCEN typology guidance identifies
      as prevalent in the bank's commercial customer segments. OFAC enforcement actions
      have cited insufficient validation of AI-based screening accuracy against known
      evasion patterns as a program governance deficiency, and SR 11-7 requires
      bank-specific validation of AML AI models against the institution's risk profile.`,
    keywords: ['SR 11-7', 'AML', 'OFAC', 'model validation', 'BSA'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B321',
    name: 'AI Financial Planning Assistant Deployed Without Suitability Model Governance',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's retail banking mobile app includes an AI-powered financial planning
      assistant that analyzes customer transaction history and generates personalized
      savings, investment, and product recommendations. The AI assistant's recommendation
      engine has not been registered in the SR 11-7 model inventory and has not been
      assessed for whether its product recommendations satisfy suitability standards
      under applicable banking and investment regulatory requirements — the specific
      AI capability risk where personalized recommendation models that optimize for
      bank fee revenue may systematically recommend higher-cost products to customers
      whose financial profile is better served by lower-cost alternatives. OCC and CFPB
      supervisory guidance on AI-driven product recommendations in retail banking identifies
      this as a consumer harm risk requiring governance proportional to the AI model's
      influence on customer financial decisions.`,
    keywords: ['SR 11-7', 'AI/ML', 'CFPB', 'model inventory', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B322',
    name: 'AI Model Third-Party Audit Rights Not Established — Vendor Validation Evidence Unverifiable',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's TPRM contracts for three AI credit and fraud models do not include
      audit rights allowing the bank to commission an independent third-party technical
      audit of the vendor model's validation methodology, training data governance, or
      production monitoring program. SR 11-7 requires that banks maintain a model risk
      governance framework commensurate with the risk of models used in their decision
      processes; for vendor AI models where methodology is proprietary, audit rights
      are the primary mechanism through which the bank can independently verify vendor
      validation claims rather than relying solely on vendor-produced documentation.
      OCC 2013-29 and SR 11-7 together require that contracts for AI models used in
      high-risk banking decisions include audit rights as a non-negotiable governance
      condition, and contracts that lack these rights leave the bank unable to fulfill
      its own SR 11-7 obligations for model oversight.`,
    keywords: ['SR 11-7', 'OCC 2013-29', 'vendor AI', 'TPRM', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B323',
    name: 'AI Underwriting Model Governance Gap for Buy-Now-Pay-Later Product Line',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's consumer banking division launches a buy-now-pay-later (BNPL)
      product using an AI underwriting model procured from a FinTech partner; the
      BNPL AI model makes credit approval decisions for transactions in real time with
      no human review step, and the model is accessed via the FinTech partner's API.
      The AI underwriting model is not in First Capital's SR 11-7 model inventory
      and has not been validated for Reg B adverse action explainability, ECOA
      disparate impact risk, or accuracy on the bank's BNPL customer demographic.
      OCC guidance on bank-FinTech partnerships issued in 2024 explicitly requires
      that banks apply SR 11-7 model risk governance to AI models used in credit
      decisions for which the bank has regulatory accountability, regardless of
      whether the bank or the FinTech partner built the model.`,
    keywords: ['SR 11-7', 'AI/ML', 'ECOA', 'Reg B', 'OCC 2013-29'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B324',
    name: 'AI Model Red Teaming Not Conducted Before Production Deployment in High-Risk Use Cases',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's model validation process for AI credit and fraud models includes
      standard SR 11-7 validation components — conceptual soundness, data quality, outcome
      analysis — but does not include adversarial testing (red teaming) to assess whether
      the AI model can be manipulated by adversarial inputs designed to produce incorrect
      favorable credit scores, evade fraud detection, or bypass AML screening. OCC
      supervisory guidance on AI model risk governance issued in 2024–2025 identifies
      red teaming as a required governance component for high-risk AI models in banking,
      specifically citing the risk that AI fraud detection and AML models can be reverse-
      engineered by sophisticated actors to identify evasion strategies; SR 11-7 conceptual
      soundness assessment for AI models should include adversarial robustness testing
      commensurate with the model's exposure to manipulation attempts.`,
    keywords: ['SR 11-7', 'AI/ML', 'model validation', 'AML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B325',
    name: 'AI Code Generation Tool Used by Model Development Team Not Assessed for Code Quality Risk',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's model development team uses an AI code generation assistant to
      accelerate development of model training scripts, data pipelines, and validation
      test suites; the AI-generated code is reviewed by developers but not systematically
      assessed for correctness on the specific statistical and financial computation
      patterns used in SR 11-7-governed models. When an AI code generation tool produces
      a vectorized implementation of a credit migration matrix calculation that contains
      an off-by-one error in the period-end boundary condition — an error that produces
      results visually plausible enough to pass reviewer inspection — the error propagates
      into three DFAST models before being detected. The specific AI code generation
      risk of plausibly-incorrect numerical code in regulated financial models is a
      governance dimension that SR 11-7 model development process standards should
      address through code review protocols calibrated to AI-generated code risks.`,
    keywords: ['SR 11-7', 'AI/ML', 'DFAST', 'model documentation', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B326',
    name: 'AI Deposit Pricing Model Trained on Competitor Rate Data Without Antitrust Review',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's treasury team deploys an AI deposit pricing model that incorporates
      real-time competitor rate data sourced from a third-party benchmarking service to
      dynamically set deposit rates for commercial and retail accounts. The AI model's
      use of competitor rate data in a dynamic pricing context has not been reviewed by
      the bank's legal team for antitrust and Sherman Act compliance — the specific AI
      pricing governance risk where AI models that use competitor price data as a training
      input can be characterized as facilitating horizontal price coordination, an
      emerging regulatory concern that DOJ and OCC examiners have flagged in AI pricing
      model governance reviews. SR 11-7 model governance and the model's use-case scope
      documentation should include an antitrust compliance assessment when competitor
      pricing data is a direct model input.`,
    keywords: ['SR 11-7', 'AI/ML', 'model governance', 'interest rate risk', 'model documentation'],
    demoRelevant: false,
    subTopic: 'ai-model-risk-part4',
  },
  {
    code: 'B327',
    name: 'AI Customer Segmentation Model Feeds Marketing and Pricing — No Fair Lending Firewall',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's marketing analytics team uses an AI customer segmentation model
      that groups retail customers into behavioral clusters based on transaction patterns,
      digital engagement, and product usage; the segmentation model's outputs feed both
      marketing campaign targeting and deposit pricing tier assignment through downstream
      models that consume segment membership as a feature. The AI segmentation model is
      not in the SR 11-7 model inventory and has not been assessed for whether segment
      membership is a proxy for protected class characteristics — the specific AI fair
      lending risk where behavioral segmentation variables that appear neutral can encode
      demographic information through geographic and transaction pattern correlations.
      CFPB and OCC fair lending guidance on AI segmentation in banking requires that
      segmentation models feeding pricing or credit decisions be assessed for proxy
      discrimination risk under ECOA and CRA.`,
    keywords: ['SR 11-7', 'AI/ML', 'ECOA', 'CFPB', 'CRA'],
    demoRelevant: true,
    subTopic: 'ai-model-risk-part4',
  },

  // ── Model Audit ───────────────────────────────────────────────────────────
  {
    code: 'B328',
    name: 'Internal Audit Model Risk Coverage Plan Does Not Include All Tier 1 Models Annually',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's internal audit function audits model risk governance processes
      on an annual cycle but does not include a specific review of all Tier 1 model
      validation quality and MRM committee oversight effectiveness as a separate audit
      work stream; model risk findings emerge only indirectly when model-intensive
      business areas such as credit and treasury are audited. SR 11-7 requires that
      independent review — the third line of defense — provide coverage of model risk
      governance that is substantive and not merely incidental to business line audits;
      OCC examination of internal audit coverage of the MRM function under the consent
      order finds that no dedicated model risk audit has been completed in the three
      years covered by the examination lookback.`,
    keywords: ['SR 11-7', 'model audit', 'internal audit', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B329',
    name: 'Model Audit Scope Excludes Vendor AI Model Governance Assessment',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's internal audit coverage of model risk explicitly scopes out
      vendor-supplied AI models on the basis that they are covered by TPRM reviews,
      and the TPRM review coverage of vendor AI models focuses on SLA compliance and
      data security rather than SR 11-7 model risk governance. Neither function
      provides substantive coverage of whether vendor AI models have been appropriately
      validated for accuracy, bias, and regulatory compliance in the bank's specific
      operating context; SR 11-7 and OCC third-party guidance together require a
      complete governance picture for all models used in bank decisions, and the gap
      between TPRM and model audit coverage creates a systematic blind spot for
      the vendor AI model population that represents 35% of First Capital's
      Tier 1 production models.`,
    keywords: ['SR 11-7', 'model audit', 'vendor AI', 'OCC 2013-29', 'TPRM'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B330',
    name: 'Model Audit Findings Not Distinguished From Model Validation Findings in Tracking System',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's model risk finding tracking system consolidates validation findings
      from the IVU and audit findings from internal audit into a single finding register
      without distinguishing between the two sources, making it impossible to analyze
      whether audit has identified model risk issues that validation missed or whether
      the same findings appear repeatedly without being closed. SR 11-7 requires that
      independent review provide an additional governance layer beyond validation, and
      the three-lines framework depends on the independence of each layer; a finding
      tracking system that conflates IVU and internal audit findings makes it impossible
      for the MRM committee or OCC examiners to assess whether the independent audit
      function is discovering issues that the second-line validation process did not,
      or whether the third line is merely duplicating second-line work.`,
    keywords: ['SR 11-7', 'model audit', 'internal audit', 'MRM committee', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'model-audit',
  },
  {
    code: 'B331',
    name: 'Model Audit Team Lacks Quantitative Expertise — Technical Findings Unsupported',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's internal audit team responsible for model risk audit coverage
      consists of generalist auditors with banking operations backgrounds but no
      quantitative modeling expertise; audit findings on model risk governance focus
      on process compliance — documentation completeness, approval workflow adherence —
      rather than the technical sufficiency of validation work, the appropriateness
      of modeling assumptions, or the accuracy of model performance metrics. SR 11-7
      requires that independent review be substantive and technically credible; an
      audit function that cannot assess whether an IVU's validation methodology is
      technically adequate provides only process-level assurance that the SR 11-7
      governance form has been followed, not that the substance of model risk oversight
      is adequate — a qualitative gap that OCC examiners identify when reviewing
      internal audit workpapers for technical depth.`,
    keywords: ['SR 11-7', 'model audit', 'independent validation unit', 'OCC examination', 'model governance'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B332',
    name: 'Consent Order Model Risk Audit Not Conducted at Correct Scope or Frequency',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's MRM consent order requires independent internal audit assessment
      of model risk governance remediation progress on a semi-annual basis; the bank's
      internal audit function conducts annual model risk coverage that does not expand
      to semi-annual frequency to meet the consent order requirement, and the audit
      scope does not explicitly address the consent order's specific remediation items.
      When OCC examiners request evidence of the semi-annual independent audit required
      by the consent order, the bank produces annual audit reports that do not directly
      address the consent order findings, creating both a consent order compliance
      breach and a governance assurance gap. SR 11-7's independent review requirement
      during consent order remediation must be calibrated to the consent order's
      specific requirements, not the bank's standard audit calendar.`,
    keywords: ['SR 11-7', 'model audit', 'consent order', 'OCC examination', 'independent validation unit'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B333',
    name: 'Model Audit Testing Does Not Include Independent Model Replication or Re-Performance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's internal model risk audit methodology relies on interviewing the IVU,
      reviewing validation reports, and testing that the governance process was followed —
      approval documentation, finding tracking, committee minutes — without including
      independent re-performance of key validation tests to verify that the IVU's reported
      results are reproducible. SR 11-7's three-lines framework requires that the third
      line provide assurance over the quality and reliability of the second line's work,
      not merely attest that the second line completed a process; an audit methodology
      that does not include technical re-performance cannot detect cases where validation
      reports misrepresent test results or where the IVU's methodology contains technical
      errors that produce false assurance on model conceptual soundness.`,
    keywords: ['SR 11-7', 'model audit', 'internal audit', 'independent validation unit', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B334',
    name: 'Model Audit Report Distribution Does Not Reach OCC Supervisory Point of Contact',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's internal model risk audit reports are distributed to the board
      audit committee, the CRO, and the MRM function, but are not proactively shared
      with the bank's OCC supervisory point of contact on the schedule agreed during
      the consent order remediation dialogue. When the OCC's model risk examiner requests
      internal audit reports covering model risk from the prior 12 months as part of
      the consent order follow-up examination, the bank must locate and produce five
      audit reports from different distribution archives; the production delay and
      the absence of a systematic delivery commitment signal to the OCC that the bank's
      governance transparency under the consent order is not operating as expected.
      SR 11-7 governance under a consent order requires proactive regulatory communication
      including timely delivery of third-line audit findings to supervisors.`,
    keywords: ['SR 11-7', 'model audit', 'consent order', 'OCC examination', 'model governance'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B335',
    name: 'Audit Trail for Model Risk Examination Evidence Package Assembly Not Maintained',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `When First Capital assembles model risk evidence packages for OCC examination
      information requests, the assembly process involves manually pulling documents
      from multiple SharePoint sites, email archives, and the model inventory system
      without maintaining a documented audit trail of which documents were selected,
      from which source, and by whom — creating an evidence package with no provenance
      record that the OCC can independently verify. SR 11-7 and OCC examination
      expectations require that examination evidence be produced accurately and
      completely; an evidence assembly process without an audit trail creates risk
      that the examination package omits unfavorable documents, includes documents
      from the wrong model version, or contains inconsistencies between related
      documents that undermine the bank's examination response credibility.`,
    keywords: ['SR 11-7', 'model audit', 'OCC examination', 'model documentation', 'consent order'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B336',
    name: 'AI Model Audit Coverage Relies on Static Sampling — Misses Intra-Year Drift Events',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's internal audit of AI model governance uses annual point-in-time
      sampling of model performance and validation records, which means that AI model
      drift events, monitoring threshold breaches, and unplanned model updates that
      occur between the sample date and the prior year sample are invisible to the
      audit coverage. AI models exhibit intra-year performance degradation events —
      foundation model version updates from vendors, abrupt distribution shifts from
      macroeconomic events — that are not captured by annual sampling; SR 11-7 audit
      coverage of AI-specific model risks requires continuous or event-triggered
      monitoring coverage rather than annual sampling, a governance design requirement
      that OCC AI examination guidance identifies as a standard expectation for
      AI-intensive model portfolios.`,
    keywords: ['SR 11-7', 'model audit', 'AI/ML', 'model monitoring', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B337',
    name: 'Model Audit Independence Compromised by Shared Services With IVU',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's internal audit function and IVU share a model risk data platform
      maintained by the IT risk team, and audit staff use the same model inventory query
      tools as the IVU when conducting model risk audit work; in one instance, an
      internal auditor uses an IVU-configured query template to generate the model
      population for audit testing rather than constructing an independent population
      query. SR 11-7 three-lines independence requires that each line conduct its
      oversight independently of the others; when internal audit relies on IVU-built
      tooling or IVU-generated data populations for audit testing, the independence
      condition is compromised — if the IVU's tools or data contain errors, internal
      audit will replicate rather than detect those errors, defeating the purpose of
      independent third-line review.`,
    keywords: ['SR 11-7', 'model audit', 'independent validation unit', 'model governance', 'OCC 2011-12'],
    demoRelevant: false,
    subTopic: 'model-audit',
  },
  {
    code: 'B338',
    name: 'Continuous Monitoring Audit Program for CECL Models Not Established — Annual Review Insufficient',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's internal audit plan covers CECL model governance on an annual
      cycle, but the CECL allowance is calculated quarterly and material model changes —
      including recalibrations, macroeconomic variable updates, and qualitative adjustment
      decisions — occur between annual audit cycles without independent third-line review.
      OCC examination of allowance adequacy increasingly includes assessment of model
      governance over the full four-quarter period preceding the examination, not only
      the most recent quarter; an annual audit cycle provides only one of four quarter-
      end governance observations, leaving three quarters of CECL model governance and
      allowance determination potentially unreviewed by the internal audit function.
      SR 11-7 audit coverage should be calibrated to the decision cycle frequency of
      the highest-risk models.`,
    keywords: ['SR 11-7', 'model audit', 'CECL', 'internal audit', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
  {
    code: 'B339',
    name: 'Audit Committee Not Briefed on Model Risk Examination Findings Before OCC Consent Order Update',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `When First Capital's OCC examiner issues a model risk examination finding update
      under the active consent order, the finding is communicated to the CRO and MRM
      function but not presented to the board audit committee before the bank issues
      its written response to the OCC. The audit committee receives the examination
      finding and the bank's response simultaneously in a quarterly board package, without
      the opportunity to review and direct the response. SR 11-7 requires substantive
      board-level oversight of model risk governance, and OCC governance expectations
      for banks under consent orders require that the board audit committee be briefed
      on examination findings in time to provide meaningful governance oversight of
      the bank's remediation response — a sequencing failure that OCC examiners identify
      as evidence of inadequate board governance under the consent order requirements.`,
    keywords: ['SR 11-7', 'model audit', 'consent order', 'MRM committee', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-audit',
  },
];
