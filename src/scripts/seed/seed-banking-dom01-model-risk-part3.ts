// seed-banking-dom01-model-risk-part3.ts
// Banking genome patterns — Model Risk Management (SR 11-7 / SR 11-8)
// Code range: B220–B279  (60 patterns)
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

export const BANKING_DOM01_MODEL_RISK_PART3_PATTERNS: PatternSeed[] = [

  // ── Ongoing Model Validation Gaps ────────────────────────────────────────
  {
    code: 'B220',
    name: 'Out-of-Time Validation Testing Omitted From Periodic Re-Validation',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's periodic re-validation of its commercial credit scoring model
      replaces the original development dataset with a more recent observation window
      but does not conduct out-of-time testing — splitting data into a training period
      and a hold-out period from a later calendar window to assess temporal generalization.
      SR 11-7 requires outcome analysis to include testing on data not used in model
      development or calibration; without out-of-time testing, re-validation cannot detect
      a model that performs well on recent data but fails to generalize across credit cycles,
      and OCC examiners reviewing the validation report cite the omission as a conceptual
      soundness deficiency for a model used in CECL allowance estimation.`,
    keywords: ['SR 11-7', 'model validation', 'out-of-time testing', 'CECL', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B221',
    name: 'Benchmark Model Comparison Absent From Validation — No Challenger Reference',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's IVU validates the consumer loan probability-of-default model by
      assessing its internal performance metrics but does not compare it against an
      alternative benchmark model — such as a logistic regression challenger or a
      published industry scorecard — to establish whether the model's performance is
      competitive relative to simpler alternatives. SR 11-7's conceptual soundness
      requirement includes assessing whether the modeling approach is appropriate relative
      to alternatives; validating a complex ML model in isolation without a benchmark
      comparison does not establish that the additional model complexity provides
      measurably better performance than a simpler, more interpretable alternative,
      which is a governance standard increasingly expected by OCC examiners for AI credit models.`,
    keywords: ['SR 11-7', 'model validation', 'benchmark model', 'model governance', 'conceptual soundness'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B222',
    name: 'Validation Report Outcome Analysis Uses Stale Actuals — No Vintage-Level Reconciliation',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's IVU conducts outcome analysis for the auto loan loss model by
      comparing model-predicted loss rates against portfolio-level realized losses for
      the most recent 12-month period, without stratifying by origination vintage or
      loan cohort to isolate whether prediction accuracy is uniform across the book.
      SR 11-7 outcome analysis requirements expect validators to assess model performance
      in a manner that is informative about where the model succeeds and where it fails;
      portfolio-level accuracy can mask systematic underestimation in specific origination
      vintages — such as the high-rate 2022–2023 origination cohort — that would require
      targeted model recalibration.`,
    keywords: ['SR 11-7', 'model validation', 'CECL', 'vintage analysis', 'outcome analysis'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B223',
    name: 'Validation Scope Excludes Upstream Data Pipeline — Input Quality Never Assessed',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's IVU scopes model validations to assess the model algorithm and
      its outputs but treats data quality assessment as a separate process handled by
      the data governance team, meaning individual validation reports do not include a
      data quality section assessing whether the model's training data and live input
      feed meet SR 11-7 data integrity standards. When the core banking system undergoes
      a field mapping change that silently alters the loan-to-value ratio calculation
      fed into the CECL model, the error propagates through multiple quarterly allowance
      cycles before the monitoring team notices a divergence between the model input LTV
      distribution and the loan system source data — a data quality oversight that a
      validation-scoped data assessment would have detected at the next periodic review.`,
    keywords: ['SR 11-7', 'model validation', 'BCBS 239', 'data quality', 'CECL'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B224',
    name: 'User Acceptance Testing Not Documented as Part of Validation Evidence',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's model deployment process includes a user acceptance testing (UAT)
      phase where business unit staff verify that the model's outputs display correctly
      in reporting systems and that downstream workflows behave as expected, but UAT
      results are documented in the IT project management system rather than the MRM
      validation package. SR 11-7 requires that validation encompass the full model
      production cycle including implementation; OCC examiners reviewing the bank's
      validation evidence packages find that UAT documentation is absent from validation
      reports, creating a gap in the chain of evidence that the model as deployed in
      production matches the model as validated in the development environment.`,
    keywords: ['SR 11-7', 'model validation', 'OCC 2011-12', 'model governance', 'model documentation'],
    subTopic: 'model-validation',
  },
  {
    code: 'B225',
    name: 'Re-Validation Initiated by Calendar Schedule Not by Change Event Detection',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's re-validation scheduling system triggers periodic re-validation
      for all registered models on fixed calendar intervals regardless of whether material
      changes have occurred in the model's operating environment, the model itself, or the
      portfolio it governs. SR 11-7 requires that re-validation frequency respond to
      material changes — such as a significant shift in the economic environment, a model
      recalibration, or a change in model use — in addition to regular time-based cycles;
      a purely calendar-driven approach means models can operate in materially changed
      conditions for up to two years without triggering re-validation while models in
      stable environments absorb validation resources on schedule that could be redirected
      to event-triggered reviews of higher-risk situations.`,
    keywords: ['SR 11-7', 'model validation', 'model governance', 'OCC 2011-12', 'model monitoring'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B226',
    name: 'Model Limitation Register Not Maintained — Compensating Controls Undocumented',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's validation reports identify model limitations — such as insufficient
      training data for niche portfolio segments, simplified behavioral assumptions, and
      macro variable dependency — but there is no centralized model limitation register
      that tracks known limitations across the portfolio, the compensating controls designed
      to offset each limitation, and the residual risk remaining after compensating controls
      are applied. SR 11-7 requires that banks understand and manage model limitations;
      without a limitation register, the MRM committee cannot assess aggregate model
      uncertainty across the capital and allowance model suite, and decision-makers consuming
      model outputs may be unaware of the conditions under which model outputs become unreliable.`,
    keywords: ['SR 11-7', 'model validation', 'model governance', 'model documentation', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B227',
    name: 'Challenger Model Validation Deferred to Post-Champion Deployment Review',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's governance process for champion-challenger credit model configurations
      validates the challenger model only after it has accumulated six months of live
      performance data alongside the champion, treating challenger deployment as an extension
      of validation testing rather than as a production deployment that requires pre-deployment
      SR 11-7 validation. When the challenger model routes 15% of origination volume from
      day one, it is a production model in all material respects; OCC examiners reviewing
      the bank's model inventory find that the challenger has been in production for six
      months with no validated status, constituting the same unvalidated production model
      deficiency that the consent order requires the bank to remediate.`,
    keywords: ['SR 11-7', 'model validation', 'model champion-challenger', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B228',
    name: 'Stress Scenario Model Validation Does Not Cover Extreme Value Distributions',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's IVU validates DFAST stress models using standard performance metrics —
      goodness-of-fit, rank-ordering, and calibration — but does not assess model accuracy
      in the extreme tails of the distribution, where DFAST severe adverse scenarios operate.
      SR 11-7 conceptual soundness assessment for stress models should specifically address
      model behavior at the tails, because models calibrated on central tendency data often
      perform poorly under stress conditions that lie outside the historical training range;
      a model can appear fully validated on standard metrics while systematically
      underestimating tail losses by 30–50% in the severe adverse scenario that determines
      the bank's minimum capital requirement under the stress test.`,
    keywords: ['DFAST', 'SR 11-7', 'model validation', 'stress testing', 'extreme value'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B229',
    name: 'Model Performance Benchmark Sourced From Development Team Not IVU Selection',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `When the IVU validates First Capital's mortgage prepayment model, the benchmark
      models used to assess relative performance — a simpler PSA-based prepayment function
      and a competitor's industry curve — are selected by the model development team and
      provided to the IVU rather than selected independently by the validators. SR 11-7
      requires that validation independence extend to the choice of validation tools and
      benchmarks; a development team that selects benchmarks it knows will perform worse
      than the model being validated compromises the integrity of the benchmark comparison,
      and OCC examiners reviewing the validation report's benchmark selection methodology
      identify the independence failure when the benchmark selection rationale is absent.`,
    keywords: ['SR 11-7', 'model validation', 'independent validation unit', 'conceptual soundness', 'OCC examination'],
    subTopic: 'model-validation',
  },
  {
    code: 'B230',
    name: 'Multi-Year Validation Finding Tracking Does Not Surface Repeat Deficiencies',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's validation finding tracking system records findings for each model
      validation cycle independently without cross-referencing against prior cycle findings
      for the same model, making it impossible to identify systemic model weaknesses that
      appear as findings in consecutive validation cycles without triggering escalation.
      SR 11-7 governance requires that repeat validation findings be escalated and treated
      as evidence of a model structural weakness or an unaddressed root cause; OCC examiners
      reviewing five years of validation history for the bank's CRE stress model find that
      a data quality finding related to the property value input has appeared in four
      consecutive validation reports without ever being designated as a repeat finding or
      triggering a model development team remediation requirement.`,
    keywords: ['SR 11-7', 'model validation', 'model governance', 'OCC examination', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },
  {
    code: 'B231',
    name: 'Validation Independence Policy Not Applied to Automated Validation Tools',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's IVU uses an automated model validation platform procured through
      the same technology contract managed by the model development team, which also uses
      the platform for model testing during development. SR 11-7 independence requirements
      extend to the tools and environments used in validation; sharing a development and
      validation platform creates a risk that development-phase test results are inadvertently
      available to validators before they conduct independent assessment, and that the
      development team can configure platform settings that influence validation outputs.
      OCC examiners reviewing the validation tooling governance flag the shared platform
      as a structural independence control gap that requires remediation under the consent order.`,
    keywords: ['SR 11-7', 'model validation', 'independent validation unit', 'consent order', 'model governance'],
    demoRelevant: true,
    subTopic: 'model-validation',
  },

  // ── SR 11-7 Model Inventory Completeness ─────────────────────────────────
  {
    code: 'B232',
    name: 'Commercial Loan Covenant Monitoring Tool Not Registered in SR 11-7 Inventory',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's loan administration system uses a rules-based covenant compliance
      monitoring tool that calculates DSCR, leverage ratios, and interest coverage from
      borrower financial submissions and flags potential covenant violations for relationship
      manager review; the tool is classified as an operational workflow system and not
      registered in the SR 11-7 model inventory. OCC 2011-12 encompasses quantitative
      methods used in credit monitoring decisions; the covenant compliance tool's output
      directly determines whether borrowers are placed in enhanced monitoring, triggers
      loan classification changes, and influences CECL specific reserve calculations —
      functional uses that place it unambiguously within the model risk governance perimeter.`,
    keywords: ['SR 11-7', 'model inventory', 'OCC 2011-12', 'commercial real estate', 'CECL'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B233',
    name: 'Transfer Pricing Model Not Included in MRM Inventory Despite DFAST Use',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's internal funds transfer pricing (FTP) model assigns funding costs
      to business line assets and liabilities to compute risk-adjusted profitability,
      and the FTP rate surface feeds directly into the DFAST NII model as the cost of
      funds component for balance sheet projections. The FTP model is maintained by the
      treasury team and has never been submitted to the MRM function for SR 11-7 inventory
      registration or validation, because treasury characterizes it as a management
      accounting tool. SR 11-7 requires that models generating inputs to regulatory stress
      testing models be within the model risk framework; FTP model errors that propagate
      into DFAST NII projections undermine the accuracy of the bank's capital stress test
      without detection by the IVU.`,
    keywords: ['SR 11-7', 'model inventory', 'DFAST', 'transfer pricing', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B234',
    name: 'Model Inventory Does Not Capture Containerized ML Models in Cloud Deployment',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's model inventory tracks models by application system name in the IT
      asset catalog, but the bank's digital transformation program has containerized several
      ML models in Kubernetes-managed cloud infrastructure that are not registered as distinct
      application systems in the IT catalog. The containerized ML models — including a
      real-time fraud scoring model and a deposit churn prediction model — are invisible
      to the annual model inventory census, which relies on IT catalog reconciliation;
      SR 11-7 requires complete and current model inventory coverage regardless of deployment
      architecture, and cloud-native deployment models that outpace MRM census methodology
      are a growing inventory completeness risk that OCC examiners increasingly test for.`,
    keywords: ['SR 11-7', 'model inventory', 'cloud deployment', 'fraud AI', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B235',
    name: 'BI Reporting Models That Feed Loan Classification Decisions Outside MRM Scope',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's credit operations team uses business intelligence dashboards that
      apply statistical scoring rules to the commercial loan portfolio to surface criticized
      and classified asset candidates for loan review committee consideration; the BI models
      are managed by the analytics team and never assessed against SR 11-7 criteria because
      they are categorized as reporting tools rather than decision models. OCC loan review
      examiners find that the BI scoring rules systematically under-flag certain loan
      structures — particularly construction loans with interest reserve accounts — because
      the scoring logic was written before the CRE concentration stress environment and has
      not been updated, producing a classified asset identification gap that overstates the
      quality of the classified asset report reviewed by the board.`,
    keywords: ['SR 11-7', 'model inventory', 'loan classification', 'OCC examination', 'commercial real estate'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B236',
    name: 'API-Connected FinTech Credit Models Not Assessed Under SR 11-7 TPRM Framework',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital has established banking-as-a-service partnerships with two FinTech
      lenders that use their own AI credit models to underwrite loans for which First Capital
      is the originating bank of record; the FinTech partners' credit models are integrated
      via API and influence credit decisions made in First Capital's name, but neither
      model is assessed under First Capital's SR 11-7 inventory or TPRM framework. OCC
      guidance on third-party relationships and SR 11-7 together require that banks assess
      model risk in all models used in decisions for which the bank has regulatory accountability;
      as the originating bank of record, First Capital bears the compliance and credit risk
      of the FinTech partners' AI models regardless of whether the bank technically deploys them.`,
    keywords: ['SR 11-7', 'TPRM', 'OCC 2013-29', 'FinTech', 'model inventory'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B237',
    name: 'Regulatory Reporting Calculation Tools Excluded From Model Inventory by Convention',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's MRM policy explicitly excludes "regulatory reporting calculation tools"
      from the SR 11-7 model inventory on the basis that they implement regulatory formulas
      rather than applying statistical judgment; this convention excludes the bank's CECL
      Day 1 allowance calculator, the risk-weighted asset standardized approach engine, and
      the liquidity coverage ratio calculation system from MRM governance. OCC 2011-12 does
      not provide a blanket exclusion for regulatory calculation tools; when First Capital's
      LCR calculation system contains a field mapping error that misclassifies a category of
      retail deposits as less stable, the OCC examination team finds that no model risk
      assessment has ever been conducted on a tool that generates a key regulatory liquidity
      metric filed with the Federal Reserve.`,
    keywords: ['SR 11-7', 'model inventory', 'OCC 2011-12', 'LCR', 'regulatory reporting'],
    demoRelevant: false,
    subTopic: 'model-inventory',
  },
  {
    code: 'B238',
    name: 'Model Inventory Not Updated After Branch System Decommissioning Creates Ghost Records',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      `Following First Capital's branch network consolidation, 16 branch-level analytics
      models used for local loan pricing and customer lifetime value estimation were
      decommissioned from the branch server infrastructure but remain active in the SR 11-7
      model inventory with no decommissioning record, current validation status, or owner.
      The ghost inventory records inflate the apparent model portfolio size, consume validation
      planning resources allocated to non-existent models, and create confusion when OCC
      examiners cross-reference the inventory against the bank's active IT systems — the
      reconciliation gap is cited as evidence of inadequate model lifecycle management
      in the bank's consent order remediation assessment.`,
    keywords: ['SR 11-7', 'model inventory', 'model retirement', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B239',
    name: 'Credit Review Scorecard Used by Credit Officers Not Registered as Model',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's credit administration team uses a loan review scorecard that assigns
      numerical risk ratings to commercial loan credits based on financial performance,
      collateral coverage, and management quality inputs entered by relationship managers;
      the scorecard determines the initial risk rating assigned to new credits and informs
      subsequent rating changes, but it is classified as a manual credit policy guide rather
      than a model under SR 11-7. The rating scorecard drives CECL reserve calculation
      through its influence on loan classification, making errors in scorecard logic directly
      material to allowance adequacy; OCC examiners reviewing the bank's classified asset
      methodology find that the scorecard has never been validated and contains weighting
      factors that have not been updated since 2018.`,
    keywords: ['SR 11-7', 'model inventory', 'CECL', 'loan classification', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B240',
    name: 'Model Inventory Metadata Does Not Record Regulatory Capital Impact',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's SR 11-7 model inventory records model name, owner, tier, and last
      validation date but does not capture whether each model has a material impact on
      regulatory capital, CECL allowance, or regulatory filings. Without capital impact
      tagging, the MRM committee cannot quickly identify which models require priority
      validation attention under OCC examination timelines, and the bank's DFAST submission
      cannot be cross-referenced against validated model status in a systematic way.
      OCC examiners expect banks operating under an MRM consent order to maintain an
      inventory that enables rapid identification of models affecting capital adequacy,
      and the absence of regulatory impact metadata is cited as an inventory completeness
      deficiency at the follow-up examination.`,
    keywords: ['SR 11-7', 'model inventory', 'DFAST', 'OCC 2011-12', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B241',
    name: 'Acquired Digital Lender AI Models Not Subject to SR 11-7 Due Diligence Pre-Close',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital acquired a digital consumer lending platform and received OCC approval
      conditioned on meeting MRM consent order milestones, but the pre-acquisition due
      diligence did not include an SR 11-7 model risk assessment of the digital lender's
      AI credit, fraud, and identity verification models. Post-close integration reveals that
      the acquired entity operates 22 ML models with no validation documentation, no model
      inventory, and no change management process; the OCC expands the MRM consent order
      to include the acquired models, significantly increasing the bank's remediation scope
      and timeline and creating an integration risk that could have been identified and
      priced into the acquisition structure had SR 11-7 due diligence been conducted pre-close.`,
    keywords: ['SR 11-7', 'model inventory', 'merger integration', 'AI/ML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },

  // ── Champion-Challenger Testing Gaps ─────────────────────────────────────
  {
    code: 'B242',
    name: 'Champion-Challenger Traffic Split Not Risk-Stratified — High-Risk Segment Undertested',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's consumer credit champion-challenger configuration routes 10% of
      originations to the challenger uniformly across all risk segments, meaning the
      challenger receives proportionally few observations from the high-risk segment where
      performance differences between champion and challenger are most consequential for
      credit loss estimation. SR 11-7 model governance for champion-challenger frameworks
      requires that testing design be fit for the intended validation purpose; a uniform
      traffic split generates statistically unreliable challenger performance estimates
      in the high-risk segments that drive CECL allowance adequacy and may require the bank
      to continue the champion-challenger test for twice as long to accumulate sufficient
      high-risk observations for a statistically reliable comparison.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'model governance', 'CECL', 'credit risk'],
    demoRelevant: true,
    subTopic: 'challenger-models',
  },
  {
    code: 'B243',
    name: 'Challenger Model Uses Different Feature Engineering Than Champion — Unfair Comparison',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's fraud detection challenger model is developed using a richer feature
      set — including device fingerprint, behavioral biometrics, and transaction velocity —
      than the champion model, which was built before these data sources were available.
      The champion-challenger comparison therefore conflates the effect of model architecture
      improvements with data availability improvements, making it impossible to attribute
      performance differences to modeling innovation versus data enrichment. SR 11-7 requires
      that challenger testing be designed to isolate the variable being tested; a comparison
      that changes multiple dimensions simultaneously cannot produce a valid conclusion
      about which dimension drives performance improvement or whether the performance gain
      justifies the operational cost of the new feature infrastructure.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'model validation', 'fraud AI', 'model governance'],
    demoRelevant: true,
    subTopic: 'challenger-models',
  },
  {
    code: 'B244',
    name: 'Challenger Model Promotion Decision Made by Business Unit Without MRM Concurrence',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's consumer lending business unit promotes the challenger credit scoring
      model to champion based on a six-month performance review showing improved Gini and
      lower delinquency rates, without obtaining MRM function concurrence or conducting
      a formal re-validation of the promoted model in its new full-portfolio capacity.
      SR 11-7 requires that model lifecycle decisions — including champion-challenger
      promotion — be governed by a process that includes independent validation unit review;
      when OCC examiners discover the promotion decision in business unit project management
      records and find no corresponding MRM validation or approval documentation, they cite
      the governance bypass as a material model lifecycle control failure under the active
      consent order.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'model governance', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'challenger-models',
  },
  {
    code: 'B245',
    name: 'Champion-Challenger Experiment Not Pre-Registered — Outcome Metric Defined Post-Hoc',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital initiates a champion-challenger test for its deposit pricing model
      without pre-registering the experiment design, success metric, and decision rule;
      after six months, the model development team selects the performance metric that
      most favors the challenger — net interest margin per account — while de-emphasizing
      the originally discussed metric of 90-day churn rate, on which the challenger performs
      no better than the champion. SR 11-7 model lifecycle governance requires that model
      comparison tests be pre-designed with documented criteria before deployment; post-hoc
      metric selection introduces selection bias into the promotion decision and OCC examiners
      reviewing the experiment governance documentation find no pre-registration record.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'model governance', 'model documentation', 'interest rate risk'],
    subTopic: 'challenger-models',
  },
  {
    code: 'B246',
    name: 'Challenger Deployment Routing Logic Contains Implementation Error Undetected for Months',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's champion-challenger routing logic for its mortgage pricing model
      contains an implementation error that routes 25% of originations to the challenger
      rather than the intended 10%, causing the challenger to receive disproportionately
      large volume and making the champion performance metrics less stable due to the
      reduced champion traffic share. The routing error is undetected for four months
      because model monitoring reports track champion and challenger performance separately
      but do not include a routing volume check against the target split; SR 11-7 governance
      for champion-challenger deployments requires operational monitoring of the experiment
      design parameters, not only the performance outputs.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'model monitoring', 'model governance', 'OCC examination'],
    subTopic: 'challenger-models',
  },
  {
    code: 'B247',
    name: 'Challenger Model Tested Only on Prime Segment — Subprime Performance Unknown Before Promotion',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's consumer credit challenger model accumulates sufficient performance
      data on prime and near-prime credit tiers during the champion-challenger period, but
      the subprime origination segment — where credit losses are most sensitive to model
      accuracy — has produced only 180 observations in the test window, an insufficient
      sample for statistically reliable performance comparison. The model development team
      recommends promotion based on the aggregate and prime-tier performance data, treating
      the subprime sample size limitation as a footnote in the promotion memo rather than
      as a constraint on the promotion decision; SR 11-7 requires that model governance
      assess whether challenger testing coverage is adequate before promotion, and the IVU's
      concurrence without requiring minimum subprime sample coverage constitutes a validation
      scope limitation that OCC examiners flag at the next examination.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'model validation', 'consumer credit', 'CECL'],
    demoRelevant: true,
    subTopic: 'challenger-models',
  },
  {
    code: 'B248',
    name: 'No Rollback Plan Documented for Challenger-to-Champion Promotion',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's model governance process for champion-challenger promotion defines
      the conditions for promoting the challenger to champion but does not require a rollback
      plan documenting the criteria under which the recently promoted model would be reverted
      to the prior champion if post-promotion performance deteriorates unexpectedly. When
      the newly promoted consumer credit model shows an unexpected spike in early payment
      defaults in its first 90 days as champion, the model team has no defined rollback
      threshold or governance approval process, delaying the response while credit losses
      accumulate; SR 11-7 model lifecycle governance requires that operational risk
      management plans accompany material model deployment changes.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'model governance', 'credit risk', 'model monitoring'],
    demoRelevant: true,
    subTopic: 'challenger-models',
  },
  {
    code: 'B249',
    name: 'AML Challenger Ruleset Not Validated Before Shadow Mode Testing',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's BSA/AML team develops a challenger transaction monitoring ruleset
      intended to reduce false positives by 35% and deploys it in shadow mode — generating
      alerts but not routing them to analyst queues — to assess performance against the
      champion ruleset. The challenger ruleset is deployed in shadow mode without an SR 11-7
      pre-deployment validation, on the basis that it is not yet influencing decisions;
      however, when the shadow mode performance data is used to justify champion replacement
      without a separate validation, OCC examiners find that the challenger was never
      independently validated at any stage of its lifecycle, making the entire champion
      replacement cycle a governance bypass rather than a proper model lifecycle management
      process.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'AML', 'model validation', 'BSA'],
    demoRelevant: true,
    subTopic: 'challenger-models',
  },

  // ── AI/ML Model Risk Governance ───────────────────────────────────────────
  {
    code: 'B250',
    name: 'LLM-Generated SAR Narratives Filed Without Validation of Legal Sufficiency',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's BSA compliance team adopts an LLM-powered tool to generate
      Suspicious Activity Report narratives from structured alert data and analyst notes,
      reducing the average time to file from 4.5 hours to 45 minutes per SAR. The LLM
      tool is not registered in the SR 11-7 model inventory, has not been validated for
      accuracy and legal sufficiency of SAR narrative language, and has not been assessed
      for hallucination risk in regulatory filing contexts — the specific AI capability
      risk that OCC, FinCEN, and FDIC examiners have identified as a critical gap when
      AI-generated text enters regulatory submissions. When a FinCEN audit samples 20
      LLM-generated SARs and finds three with factually inaccurate transaction summaries
      traceable to LLM hallucination, the bank faces both BSA governance exposure and an
      SR 11-7 model inventory finding.`,
    keywords: ['SR 11-7', 'LLM', 'AML', 'BSA', 'model inventory'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B251',
    name: 'AutoML Credit Model Deployed Without SR 11-7 Classification or Architecture Documentation',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description:
      `First Capital's digital lending team uses an AutoML platform to automatically select,
      train, and tune credit underwriting models, deploying the platform's best-performing
      model without preparing the model architecture documentation, feature selection
      rationale, or hyperparameter justification required by SR 11-7 for conceptual soundness
      assessment. AutoML without SR 11-7 classification and documentation is the specific
      AI capability gap that OCC examination teams have cited in multiple recent banking
      enforcement actions — the platform's automated model selection produces a model that
      cannot be reconstructed or explained by the development team, making independent
      validation structurally impossible and Reg B adverse-action explanation legally
      precarious for every credit decision the model generates.`,
    keywords: ['SR 11-7', 'AutoML', 'model documentation', 'Reg B', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B252',
    name: 'Retrieval-Augmented Generation Credit Research Tool Not Assessed for Factual Accuracy',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's commercial lending team deploys a retrieval-augmented generation (RAG)
      tool that retrieves borrower financial statement excerpts, industry benchmarks, and
      covenant history to generate credit analysis summaries presented to relationship managers.
      The RAG tool's retrieval accuracy — whether it retrieves the correct borrower documents
      and correctly interprets financial statement line items — and generation fidelity — whether
      the LLM component accurately summarizes retrieved content without hallucination — are not
      validated under SR 11-7's model accuracy standards. OCC examiner guidance on AI model
      governance in commercial lending specifically calls out RAG-based credit analysis tools
      as requiring SR 11-7 model inventory registration and accuracy validation on the bank's
      own document corpus, a requirement First Capital has not implemented.`,
    keywords: ['SR 11-7', 'LLM', 'model inventory', 'credit risk', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B253',
    name: 'AI Regulatory Examination Preparation Tool Generates Responses Not Reviewed as Model Output',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's compliance team uses an AI-powered tool to assist in preparing OCC
      examination responses, automatically drafting responses to examiner information requests
      by searching internal policy documents and prior examination evidence packages. The
      tool is treated as a document search assistant rather than a model, but its output —
      AI-drafted examination responses — is submitted to the OCC with limited human
      reconstruction of the underlying evidence; SR 11-7 model governance and OCC supervisory
      expectations for AI tools used in regulatory interactions require that examination
      responses accurately represent the bank's practices, and an AI tool that miscites or
      mischaracterizes policy documents in examination responses creates both regulatory
      and model governance risk simultaneously.`,
    keywords: ['SR 11-7', 'LLM', 'model inventory', 'OCC examination', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B254',
    name: 'AI Fair Lending Monitoring Tool Uses Proxy Discrimination Methods Not Validated for Accuracy',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital deploys a vendor AI fair lending monitoring tool that uses Bayesian
      Improved Surname Geocoding (BISG) to assign proxy race and ethnicity attributes to
      loan applicants for disparate impact analysis, but the tool's BISG accuracy on First
      Capital's specific regional applicant population — which has high concentrations of
      names common in Southeast Asian and Middle Eastern communities where BISG performs
      below its published accuracy benchmarks — has not been independently validated.
      SR 11-7 and CFPB fair lending supervisory guidance together require that proxy
      discrimination methodologies used in compliance monitoring be validated for accuracy
      on the bank's actual customer population; a fair lending monitoring tool built on
      an inaccurate proxy method may fail to detect disparate impact in the specific
      demographic segments where First Capital has the highest concentration risk.`,
    keywords: ['SR 11-7', 'ECOA', 'Reg B', 'model validation', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B255',
    name: 'Embedded AI in Core Banking Vendor Platform Not Assessed Under SR 11-7',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's new core banking platform includes vendor-embedded AI features
      that automate account opening fraud risk scoring, customer churn prediction for
      proactive retention outreach, and overdraft fee waiver recommendation, all activated
      by default in the platform's enterprise configuration. The AI features are bundled
      into the core banking SaaS contract and not surface-disclosed as separate models;
      First Capital's TPRM assessment covers the core banking platform as an enterprise
      software product without conducting an SR 11-7 model risk assessment of the embedded
      AI components, which are individually within scope for model inventory registration,
      validation, and monitoring under OCC model risk governance expectations.`,
    keywords: ['SR 11-7', 'vendor AI', 'model inventory', 'TPRM', 'OCC 2013-29'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B256',
    name: 'Generative AI Policy Approval Workflow Deployed Without MRM Model Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's credit operations team deploys a GenAI-based exception approval
      workflow that reviews loan exception requests — credits that deviate from policy
      on LTV, debt service coverage, or credit grade — and recommends approve, decline,
      or escalate based on historical exception approval patterns and current portfolio
      concentration data. The GenAI tool is treated as a workflow automation product
      and procured outside the MRM model inventory process; SR 11-7's model perimeter
      encompasses tools that generate systematic recommendations influencing credit
      approval, and an unvalidated GenAI exception approval tool that incorporates
      historical approval patterns can perpetuate policy exception biases rather than
      providing independent credit quality oversight.`,
    keywords: ['SR 11-7', 'GenAI', 'model inventory', 'credit risk', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B257',
    name: 'AI Stress Scenario Generation Tool Used in ICAAP Without SR 11-7 Model Classification',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's capital planning team uses an AI scenario generation tool that
      employs a large language model and econometric engine to construct plausible adverse
      macro scenarios for the internal capital adequacy assessment process (ICAAP),
      outputting quantitative macro variable paths — GDP, unemployment, CRE price indices —
      that feed directly into the DFAST credit loss and NII models. The AI scenario
      generation tool is not registered in the SR 11-7 model inventory because it is
      characterized as a research aid rather than a model; however, its quantitative outputs
      are the key inputs to regulatory capital stress models, making it a model-of-models
      that OCC supervisory guidance explicitly places within the SR 11-7 validation perimeter.`,
    keywords: ['SR 11-7', 'GenAI', 'DFAST', 'model inventory', 'stress testing'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B258',
    name: 'AI Deposit Retention Model Outputs Not Tested for Disparate Treatment Risk',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's AI deposit retention model identifies customers at high churn risk
      and triggers proactive outreach with relationship-specific rate and product offers;
      the model's targeting and offer personalization logic has not been tested for whether
      it systematically delivers less favorable retention offers to customers in protected
      demographic segments. OCC and CFPB supervisory guidance on AI in banking requires
      that AI models used in customer offer personalization be assessed for disparate
      treatment risk under ECOA and CRA — AI deposit retention models that offer better
      rate incentives to higher-balance customers create a proxy discrimination risk if
      those customers are demographically concentrated, and SR 11-7 validation scope
      should include fair lending testing for all customer-facing AI decisioning tools.`,
    keywords: ['SR 11-7', 'AI/ML', 'ECOA', 'CRA', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B259',
    name: 'AI-Augmented Capital Allocation Model Lacks SR 11-7 End-to-End Governance Map',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's strategic planning function uses a capital allocation optimization
      model that combines traditional financial projection models with an AI component that
      learns historical capital allocation patterns and recommends cross-line capital
      distribution to maximize risk-adjusted return on equity. The combined model's governance
      maps only the traditional financial projection components to SR 11-7 inventory entries,
      leaving the AI optimization component — which controls the final capital allocation
      recommendations — outside the model risk framework. OCC supervisory expectations for
      AI model governance require end-to-end SR 11-7 governance coverage of hybrid
      human-AI decisioning systems, including the AI components that generate the
      recommendation logic even when traditional model components produce the underlying inputs.`,
    keywords: ['SR 11-7', 'AI/ML', 'model inventory', 'DFAST', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B260',
    name: 'LLM-Powered Credit Memo Assistant Not Monitored for Hallucination Drift Over Time',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's commercial lending workflow integrates an LLM-powered credit memo
      assistant that extracts financial data from borrower submissions and generates ratio
      analysis for credit memos; the LLM component was evaluated for accuracy at deployment
      but has no ongoing model monitoring program to detect hallucination rate drift as
      the underlying foundation model is updated by the vendor. LLM hallucination rate drift
      is a specific AI capability risk unique to GenAI tools — unlike deterministic models,
      LLM outputs can degrade in accuracy across model version updates without triggering
      statistical performance metrics — and SR 11-7 model monitoring requirements extend
      to all dimensions of model performance, including accuracy dimensions specific to the
      AI capability type in use. When a foundation model update increases the LLM's
      financial statement extraction error rate from 2% to 8%, no monitoring alert fires
      because the monitoring program does not track this AI-specific accuracy dimension.`,
    keywords: ['SR 11-7', 'LLM', 'model monitoring', 'credit risk', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B261',
    name: 'Agentic AI Loan Restructuring Tool Makes Binding Offers Without MRM Review',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's consumer collections unit deploys an agentic AI system that
      autonomously contacts delinquent borrowers via digital channel, proposes and
      finalizes loan restructuring offers — including interest rate reductions, term
      extensions, and principal deferral — within pre-defined authority limits without
      human review of individual offers. The agentic AI capability is specifically the
      autonomous offer generation and binding commitment function, not just an alert
      or recommendation engine, and SR 11-7 model governance and OCC supervisory
      expectations for agentic AI in regulated financial services require that autonomous
      decision authority be subject to model risk governance commensurate with the
      regulatory consequences — FDCPA, Reg F, and ECOA requirements apply to restructuring
      offers, and an unvalidated agentic AI system making binding offers creates multi-
      dimensional regulatory exposure.`,
    keywords: ['SR 11-7', 'AI/ML', 'Reg F', 'model inventory', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B262',
    name: 'Machine Learning Feature Store Shared Between Models Without Lineage Documentation',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's data science team maintains a shared feature store that computes
      and caches engineered features — such as rolling 12-month transaction velocity,
      behavioral risk scores, and delinquency probability estimates — consumed by multiple
      credit and fraud models. The feature store is not documented in any individual model's
      SR 11-7 development record, and the feature computation logic is not independently
      validated as part of any model validation cycle; when a feature computation bug
      introduces an error in the rolling transaction velocity calculation, the error
      propagates simultaneously into three production models, none of which have independent
      visibility into the feature store's accuracy — an ML infrastructure risk that BCBS 239
      data lineage principles and SR 11-7 data quality requirements together flag as a
      systemic model governance gap.`,
    keywords: ['SR 11-7', 'BCBS 239', 'model documentation', 'AI/ML', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B263',
    name: 'AI Vendor Model Monitoring SLA Not Contractually Defined — Performance Degradation Invisible',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's TPRM contract for its vendor-supplied AI credit scoring model does
      not specify performance monitoring obligations, notification requirements for model
      updates, or minimum accuracy SLAs on the bank's customer population; the vendor
      provides monthly aggregate performance reports but is not contractually required to
      alert the bank when model accuracy falls below a defined threshold. SR 11-7 and OCC
      2013-29 guidance on AI vendor risk management require banks to contractually establish
      the monitoring obligations and performance transparency needed to fulfill SR 11-7
      ongoing monitoring requirements; without contractual SLAs, the bank has no
      enforceable right to the performance data needed to meet its own SR 11-7 monitoring
      obligations for vendor-provided AI models.`,
    keywords: ['SR 11-7', 'OCC 2013-29', 'vendor AI', 'TPRM', 'model monitoring'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B264',
    name: 'AI Anti-Money Laundering Network Analysis Model Lacks SR 11-7 Typology Validation',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an AI-powered network analysis model that maps transaction
      relationships between accounts to detect structuring, layering, and integration
      typologies; the model is validated for statistical performance on the vendor's
      aggregate client portfolio but not validated against First Capital's specific
      AML typologies, customer risk profile, or geographic patterns. FinCEN's AML risk
      assessment guidance and SR 11-7's bank-specific validation requirement together
      demand that AML AI models be validated for typology detection accuracy on the
      institution's specific risk environment; an AI AML network model validated on
      a national portfolio may miss the specific structuring patterns common in First
      Capital's commercial banking customer base, creating BSA/AML compliance exposure
      that cannot be detected through aggregate false-positive or false-negative metrics alone.`,
    keywords: ['SR 11-7', 'AML', 'graph AI', 'BSA', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B265',
    name: 'AI Regulatory Horizon Scanning Tool Not Subject to SR 11-7 Governance',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's compliance department uses an AI regulatory horizon scanning
      platform that monitors regulatory publications, enforcement actions, and supervisory
      guidance and generates structured summaries of regulatory changes relevant to the
      bank's business lines; compliance staff use the AI summaries to update policies and
      training materials without consistently reviewing the underlying primary source.
      When the AI tool mischaracterizes an OCC supervisory letter update to model risk
      governance guidance — omitting a new requirement for AI model board reporting —
      First Capital's MRM policy is updated based on the AI summary without capturing
      the new board reporting requirement; SR 11-7 governance frameworks that are built
      on AI-summarized rather than primary-source regulatory analysis contain AI-introduced
      compliance gaps that OCC examiners identify by comparing the bank's MRM policy against
      the primary source.`,
    keywords: ['SR 11-7', 'LLM', 'model governance', 'OCC examination', 'model documentation'],
    demoRelevant: false,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B266',
    name: 'AI Collateral Valuation Tool Used in CRE Appraisal Review Not Validated for Accuracy',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's appraisal review function uses an AI-powered automated valuation
      model (AVM) to conduct a first-pass reasonableness check on commercial real estate
      appraisals before they reach the chief appraiser for review; AVMs that flag a wide
      variance from the appraised value trigger a more intensive review. The AI AVM tool
      is not registered in the SR 11-7 model inventory and has not been validated for
      accuracy on First Capital's CRE portfolio type mix — the tool performs well on
      standardized Class A office properties but has documented accuracy limitations on
      mixed-use and adaptive reuse properties that constitute 30% of First Capital's CRE
      appraisal volume. OCC real estate lending guidance and SR 11-7 together require that
      quantitative tools used in appraisal review be fit for purpose and subject to model
      governance proportional to their influence on collateral value determinations.`,
    keywords: ['SR 11-7', 'AI/ML', 'model inventory', 'commercial real estate', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-model-risk',
  },
  {
    code: 'B267',
    name: 'AI Climate Risk Scoring Vendor Model Not Validated Against Bank CRE Portfolio Exposure',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital uses a vendor AI climate risk scoring model to assign physical and
      transition risk scores to its commercial real estate and agricultural loan collateral,
      reporting aggregate climate risk exposure to the board and incorporating scores into
      the CECL scenario framework for climate-adjusted stress testing. The vendor model is
      accepted on the basis of vendor-provided accuracy documentation without bank-specific
      validation on First Capital's portfolio, which is concentrated in a geographic region
      with flood and wildfire exposure patterns that differ from the vendor's national
      accuracy benchmarks. OCC climate risk guidance issued in 2023 and SR 11-7 require
      that AI climate scoring models used in capital and loss forecasting be validated for
      accuracy on the institution's specific portfolio, not just accepted on published
      vendor accuracy claims.`,
    keywords: ['SR 11-7', 'climate risk', 'vendor AI', 'model validation', 'CECL'],
    demoRelevant: false,
    subTopic: 'ai-model-risk',
  },

  // ── Model Documentation and Conceptual Soundness ─────────────────────────
  {
    code: 'B268',
    name: 'Model Development Record Missing Economic Theory Justification for Selected Algorithm',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's model development documentation for its commercial loan probability
      of default model describes the selected gradient boosting algorithm's implementation
      parameters in technical detail but does not provide an economic or statistical
      justification for why gradient boosting was chosen over logistic regression,
      survival analysis, or other candidate modeling approaches for this specific use case.
      SR 11-7 conceptual soundness requirements mandate that model documentation explain
      why the chosen methodology is appropriate for the decision context, not merely document
      what was implemented; an IVU that cannot evaluate the theory-versus-practice alignment
      of the algorithm selection cannot conduct a meaningful conceptual soundness assessment,
      and OCC examiners reviewing the MDD cite the missing theoretical justification as a
      documentation deficiency under the consent order.`,
    keywords: ['SR 11-7', 'model documentation', 'conceptual soundness', 'OCC 2011-12', 'model validation'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B269',
    name: 'Assumptions Register Not Maintained as Living Document — Key Assumptions Undated',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's CECL model development document includes an assumptions section
      that lists key model assumptions — through-the-cycle default rate anchors, LGD
      recovery rate floors, and prepayment speed caps — but does not record when each
      assumption was last reviewed, by whom, or what evidence supports it at the current
      date. SR 11-7 requires that model assumptions be documented, supported, and periodically
      reviewed; an assumptions register that was accurate at model development but has not
      been updated through two credit cycles and a rate regime change cannot demonstrate
      that the model's conceptual basis remains sound under current conditions, and OCC
      examiners treat undated assumptions as evidence of inadequate model maintenance.`,
    keywords: ['SR 11-7', 'model documentation', 'CECL', 'conceptual soundness', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B270',
    name: 'Model Development Code Repository Not Linked to Model Documentation Package',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's MRM model development documents describe model logic at the
      conceptual level but do not include references to or version-controlled links to
      the production code repository where the model is implemented, making it impossible
      for the IVU to verify that the documented model logic matches the production
      implementation without conducting a manual code review. SR 11-7 requires that model
      documentation be sufficient to allow an informed third party to reconstruct the model;
      documentation that describes the conceptual design but cannot be linked to a specific
      version of production code leaves open the possibility — confirmed in the bank's own
      internal audit — that production models have diverged from their documentation through
      ad-hoc code changes that bypassed the model change management process.`,
    keywords: ['SR 11-7', 'model documentation', 'model governance', 'OCC examination', 'independent validation unit'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B271',
    name: 'Model Scope of Use Documentation Outdated — Model Deployed Beyond Original Design',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's consumer credit scoring model was originally validated and documented
      for use in personal installment loan origination, but business line expansion has
      extended the model's application to auto loan origination, credit card origination,
      and — without MRM sign-off — to initial qualification screening for home equity lines
      of credit. The model development document's scope of use section still reads "personal
      installment loan origination" while the production deployment spans five product types
      with materially different loss dynamics; SR 11-7 requires that models be used within
      their validated scope and that material scope expansions trigger re-validation, making
      every out-of-scope deployment a model governance finding that the consent order
      specifically requires First Capital to identify and remediate.`,
    keywords: ['SR 11-7', 'model documentation', 'model governance', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B272',
    name: 'Conceptual Soundness Section Cites Academic Papers Not Available to IVU Reviewers',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's DFAST severe adverse credit loss model development document cites
      ten academic papers to support its methodological choices — including the credit
      migration matrix specification and the macro factor loading approach — but three
      of the cited papers are behind journal paywalls and one is an unpublished conference
      presentation that the IVU cannot locate; the IVU's conceptual soundness review
      cannot verify the cited theoretical foundations without accessing the source materials.
      SR 11-7 requires that model documentation be sufficient for independent review; citing
      sources that are inaccessible to the IVU creates a conceptual soundness assessment gap
      that OCC examiners identify by testing whether validators actually reviewed the cited
      theoretical foundations or merely accepted the citations at face value.`,
    keywords: ['SR 11-7', 'model documentation', 'conceptual soundness', 'DFAST', 'independent validation unit'],
    subTopic: 'model-documentation',
  },
  {
    code: 'B273',
    name: 'Model Documentation Version Control Inadequate — Prior Versions Overwritten',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's model development documents are stored in a SharePoint document
      management system without version control locking; model owners can overwrite
      prior versions, and the document history is not automatically preserved. When
      OCC examiners request the model development document version that was current at
      the time of the model's last validation — to assess whether the validated model
      matches the currently documented model — the bank can only produce the most recent
      version, making it impossible to confirm that the 2021 validation covered the same
      model that was deployed in 2021. SR 11-7 requires that documentation be maintained
      with sufficient version history to support the model lifecycle governance record
      that examiners need to assess the bank's compliance posture.`,
    keywords: ['SR 11-7', 'model documentation', 'model governance', 'OCC examination', 'model validation'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B274',
    name: 'Model User Guide Absent — Business Users Cannot Interpret Output Ranges or Limitations',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's CECL qualitative adjustment model produces a numeric factor output
      that feeds into the allowance calculation, but no user guide documents the model's
      intended output range, the economic interpretation of specific output values, the
      model's known limitations under specific portfolio conditions, or the monitoring
      indicators that should trigger a user to override or flag the model output. SR 11-7
      requires that models be supported by documentation sufficient for appropriate model
      use; allowance committee members who lack a model user guide apply their own
      interpretations to the qualitative adjustment output — sometimes applying adjustments
      in the direction opposite to the model's intended signal — creating systematic
      errors in the bank's CECL allowance determination that OCC examiners identify
      through an allowance committee minute review.`,
    keywords: ['SR 11-7', 'model documentation', 'CECL', 'model governance', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B275',
    name: 'Conceptual Soundness Degraded by Undocumented Ad-Hoc Data Preprocessing Steps',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's credit loss model development documentation describes the model's
      statistical methodology and training data in detail but does not document ad-hoc
      data preprocessing steps applied by data engineers — including outlier winsorization
      thresholds, missing value imputation rules, and categorical variable encoding
      decisions — that materially influence the training data distribution and therefore
      the model's behavior. SR 11-7 conceptual soundness requires documentation of the
      full modeling process including data preparation choices; undocumented preprocessing
      decisions embedded in production code that are invisible in the MDD create a structural
      documentation gap where the IVU's conceptual soundness assessment is based on
      incomplete information about what the model actually does.`,
    keywords: ['SR 11-7', 'model documentation', 'conceptual soundness', 'CECL', 'independent validation unit'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B276',
    name: 'Model Use Case Description Too Narrow — Implicit Extensions Not Documented',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's interest rate risk EVE model is documented with a use case of
      "internal risk management reporting" without specifying whether the model's outputs
      are used in DFAST regulatory capital projections, ICAAP internal capital adequacy
      assessment, or liquidity stress testing, all of which it in fact feeds. SR 11-7 requires
      that the model inventory and development documentation capture all uses of a model,
      because use case scope determines the appropriate validation rigor; a model documented
      only for internal risk management but used in DFAST submissions should receive
      the higher validation standard appropriate to a regulatory submission model, and the
      scope understatement systematically results in under-validation of models that carry
      regulatory reporting materiality.`,
    keywords: ['SR 11-7', 'model documentation', 'DFAST', 'model governance', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B277',
    name: 'SR 11-7 Model Validation Report Template Does Not Require Replication Section',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's IVU validation report template includes sections for conceptual
      soundness, data quality, outcomes analysis, and findings, but does not include a
      replication section requiring the validator to independently reproduce a specified
      set of model outputs from the documented inputs and methodology. SR 11-7 requires
      that validators independently replicate and assess model outputs, not merely review
      documentation; a validation template that omits a replication section systematically
      allows validators to complete reports based on documentation review alone, reducing
      the validation's ability to detect discrepancies between documented model logic and
      the production implementation — a verification gap that OCC examiners test for by
      reviewing validation workpapers for evidence of independent replication.`,
    keywords: ['SR 11-7', 'model validation', 'model documentation', 'independent validation unit', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B278',
    name: 'Model Documentation Exempt From Records Retention Policy — MRR Access Gap at Examination',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's records retention policy covers loan files, regulatory correspondence,
      and board minutes but does not include model development documents, validation reports,
      or monitoring records as defined record categories subject to minimum retention periods.
      When OCC examiners request model risk documentation supporting the bank's DFAST
      submission from three years prior as part of a follow-up model risk examination,
      the bank cannot locate 12 of the 34 model validation reports that should cover the
      DFAST model suite for that year — the reports were deleted during routine document
      housekeeping because model documentation was not covered by the records retention
      schedule. SR 11-7 model governance requires that documentation supporting model use
      in regulatory submissions be retained for the period needed to demonstrate governance
      effectiveness to examiners.`,
    keywords: ['SR 11-7', 'model documentation', 'OCC examination', 'model governance', 'DFAST'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
  {
    code: 'B279',
    name: 'Vendor Black-Box Model Accepted Without Methodology Disclosure Clause in Contract',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital licenses a vendor AI credit risk model under a standard SaaS contract
      that does not include a contractual clause requiring the vendor to provide methodology
      documentation sufficient for SR 11-7 conceptual soundness review; the vendor markets
      the model as proprietary and refuses to share algorithm specifications. When the bank's
      IVU initiates an independent validation of the vendor model, it cannot complete the
      conceptual soundness section of the validation report because the model architecture,
      feature construction process, and training data are undisclosed, and the validation
      report is completed as a conditional approval with a persistent open finding that
      cannot be closed without methodology access — an OCC-cited model governance deficiency
      that OCC 2013-29 and SR 11-7 together require banks to address through contract
      negotiation before onboarding a vendor AI model for high-risk uses.`,
    keywords: ['SR 11-7', 'OCC 2013-29', 'vendor AI', 'TPRM', 'model documentation'],
    demoRelevant: true,
    subTopic: 'model-documentation',
  },
];
