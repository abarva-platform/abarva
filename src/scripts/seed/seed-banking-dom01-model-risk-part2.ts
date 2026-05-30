// seed-banking-dom01-model-risk-part2.ts
// Banking genome patterns — Model Risk Management (SR 11-7 / SR 11-8)
// Code range: B160–B219  (60 patterns)
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

export const BANKING_MODEL_RISK_PART2_PATTERNS: PatternSeed[] = [

  // ── Model Inventory Completeness ──────────────────────────────────────────
  {
    code: 'B160',
    name: 'Spreadsheet Models Used in Regulatory Filings Never Registered',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's finance and treasury teams maintain over 40 Excel workbooks that
      calculate DFAST NII projections, CECL qualitative factor adjustments, and Call Report
      Schedule RC-R reconciliations — none of which appear in the SR 11-7 model inventory
      because the MRM policy excludes "office productivity tools." OCC Bulletin 2011-12
      and SR 11-7 define a model as any quantitative method that applies statistical,
      economic, financial, or mathematical theory to transform inputs into estimates used
      in business decisions or regulatory filings; spreadsheets that generate numbers in
      regulatory submissions are unambiguously within scope, and their absence from the
      inventory constitutes a material model governance gap that OCC examiners identify
      within the first day of examination.`,
    keywords: ['SR 11-7', 'model inventory', 'OCC 2011-12', 'Excel model', 'DFAST'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B161',
    name: 'Python Notebook Models in Production Not Captured in MRM Inventory',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's data science team has deployed 18 Jupyter notebooks to a shared
      server where business unit analysts run them on demand to generate credit concentration
      risk scores, liquidity buffer adequacy estimates, and collateral haircut calculations;
      none are registered in the SR 11-7 model inventory because they were created as
      exploratory analyses and never formally transitioned to production status. The
      distinction between exploratory and production use is irrelevant under SR 11-7 when
      outputs influence business or risk decisions; OCC examiners reviewing the bank's
      model risk examination find evidence that concentration risk scores from unregistered
      notebooks were presented to the credit committee in three board packages during the
      review period, constituting a consent order-level inventory deficiency.`,
    keywords: ['SR 11-7', 'model inventory', 'shadow models', 'Python notebook', 'consent order'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B162',
    name: 'Vendor Model Version Upgrades Not Triggering Inventory Re-Registration',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's credit bureau scoring vendor releases a new model version annually,
      but the bank's model inventory records the original model registered at onboarding and
      does not update the inventory entry when the vendor deploys a new scoring algorithm.
      OCC 2011-12 requires that the model inventory reflect the model currently in production
      use; when the vendor's v8 scoring model replaces v7 with a materially different feature
      set and scoring range, the inventory record still describes v7, the validation history
      covers v7, and the IVU has no information to assess whether a new validation is needed —
      a gap that surfaced when OCC examiners compared the vendor's release notes against the
      bank's inventory records.`,
    keywords: ['SR 11-7', 'model inventory', 'vendor model', 'OCC 2011-12', 'TPRM'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B163',
    name: 'Shadow CRE Pricing Models Used by Relationship Managers Outside MRM Scope',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `Commercial real estate relationship managers at First Capital use internally built
      loan pricing tools on their laptops to estimate debt service coverage ratios, loan-to-
      value sensitivities, and yield spreads when structuring new credit facilities; the
      tools are not registered in the MRM inventory and have not been reviewed by MRM or
      credit risk governance. SR 11-7 applies to models used to inform pricing and credit
      structuring decisions; when a $75 million CRE credit facility is priced using a RM's
      laptop spreadsheet with an undiscovered error in the DSCR formula, the resulting
      underpriced credit is only discovered during post-close portfolio review, at which point
      the origination economics cannot be corrected.`,
    keywords: ['SR 11-7', 'shadow models', 'model inventory', 'commercial real estate', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B164',
    name: 'Model Inventory Annual Census Does Not Cross-Reference IT Asset Register',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital conducts an annual model inventory census by polling business unit
      heads for self-reported model counts, without reconciling against the IT asset
      register, application catalog, or cloud deployment logs. Self-reporting systematically
      undercounts shadow models because business owners do not recognize in-house analytics
      tools as models under SR 11-7; the OCC expects banks to maintain inventory through
      a combination of self-attestation and independent census, and a process that relies
      solely on voluntary disclosure cannot satisfy the completeness standard articulated
      in OCC Bulletin 2011-12's model risk governance requirements.`,
    keywords: ['SR 11-7', 'model inventory', 'OCC 2011-12', 'model governance', 'shadow models'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B165',
    name: 'Third-Party Data Aggregator Models Not Assessed Under SR 11-7 TPRM',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital uses a data aggregation vendor to compile and score alternative data
      signals — small business cash flow patterns, utility payment history, and payroll
      deposit frequency — as input features to its digital lending credit model. The
      aggregator's scoring algorithm is used as a model input but is not registered in
      the SR 11-7 inventory and has not been subjected to vendor model due diligence;
      OCC 2013-29 and SR 11-7 together require that third-party data processing with
      model characteristics be assessed within the bank's model risk and third-party risk
      frameworks, especially where the output influences credit decisions subject to Reg B
      and ECOA adverse-action requirements.`,
    keywords: ['SR 11-7', 'TPRM', 'OCC 2013-29', 'model inventory', 'alternative data'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },
  {
    code: 'B166',
    name: 'Model Inventory Ownership Records Stale After Organizational Restructuring',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `Following First Capital's digital transformation reorganization, 34 model inventory
      records still reference model owners who have left the bank or moved to different
      business units, and 11 records list a model owner department that no longer exists.
      SR 11-7 requires model owners to have accountability for model performance and
      governance; stale ownership records mean no one is monitoring model performance,
      scheduling validation reviews, or escalating anomalies — a systemic breakdown that
      OCC examiners identify by cross-referencing inventory ownership fields against the
      bank's HR directory and organizational chart.`,
    keywords: ['SR 11-7', 'model inventory', 'model governance', 'OCC examination', 'model ownership'],
    demoRelevant: true,
    subTopic: 'model-inventory',
  },

  // ── Validation Governance ─────────────────────────────────────────────────
  {
    code: 'B167',
    name: 'Validation Backlog Exceeds 30 Models With No Prioritization Framework',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's independent validation unit has a backlog of 34 models awaiting
      initial or periodic validation, with no documented framework for prioritizing which
      models are validated first based on materiality, regulatory sensitivity, or time
      since last validation. SR 11-7 requires that validation be conducted at a frequency
      commensurate with model materiality and use; without a risk-based prioritization
      framework, the IVU works through the backlog in the order validation requests are
      received, meaning DFAST-critical capital models with expired validation cycles may
      wait behind lower-risk tier-3 analytics models — a prioritization failure that the
      MRM consent order cites as a systemic model governance deficiency.`,
    keywords: ['SR 11-7', 'model validation', 'independent validation unit', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },
  {
    code: 'B168',
    name: 'Independent Validation Unit Understaffed Relative to Model Portfolio Size',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's IVU consists of three quantitative analysts responsible for
      validating a portfolio of 180 registered models across credit, market, AML, and
      capital planning — a ratio that allows each analyst to complete approximately eight
      full validations per year against a model portfolio requiring annual or biennial review.
      OCC examiners examining the bank's MRM consent order remediation find that the
      IVU staffing level cannot realistically clear the validation backlog within the
      consent order timeline, and that the bank's plan to address the backlog through
      vendor-assisted validation does not include SR 11-7-compliant independence controls
      for the external validators engaged.`,
    keywords: ['SR 11-7', 'independent validation unit', 'consent order', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },
  {
    code: 'B169',
    name: 'Post-Implementation Review Cadence Undefined for Material Models',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's model governance policy requires that material models undergo a
      post-implementation review (PIR) within 90 days of production deployment to confirm
      that live performance matches validation expectations, but the policy does not define
      what constitutes a material model for PIR purposes, who is responsible for initiating
      PIR, or what minimum evidence must be produced. In practice, PIRs are conducted for
      fewer than 30% of new model deployments; OCC examiners reviewing the bank's CECL
      allowance model find that no PIR was conducted following a material model recalibration
      and redeploy cycle, despite the recalibration changing the allowance estimate by more
      than 8%.`,
    keywords: ['SR 11-7', 'model validation', 'post-implementation review', 'OCC 2011-12', 'CECL'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },
  {
    code: 'B170',
    name: 'Validation Report Sign-Off Delays Exceed 60 Days for Tier-1 Models',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `After the IVU completes a validation report for a tier-1 model, the report must
      be reviewed by the model owner, the MRM director, and then approved by the MRM
      committee at its next scheduled meeting — a process that averages 68 days from
      report completion to formal sign-off. SR 11-7 does not specify a sign-off timeline,
      but OCC supervisory expectations require that governance processes not create
      operational delays that leave models in production under an expired validation status;
      First Capital has 12 tier-1 models operating with completed-but-unsigned validation
      reports for more than 90 days, including two DFAST-critical models, a condition
      the OCC treats as equivalent to an unvalidated model for examination purposes.`,
    keywords: ['SR 11-7', 'model validation', 'MRM committee', 'DFAST', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },
  {
    code: 'B171',
    name: 'Periodic Re-Validation Cycle Not Linked to Model Use Materiality',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital validates all registered models on a three-year cycle regardless of
      materiality tier, regulatory sensitivity, or change in the model's operating environment.
      SR 11-7 requires re-validation frequency to be commensurate with a model's risk profile;
      applying a uniform three-year cycle means that CECL allowance models and DFAST stress
      models receive the same review frequency as branch-level customer segmentation models,
      while the annual rate environment changes demand more frequent recalibration of the
      bank's most material risk models — a structural gap that OCC examination finds produces
      stale validation coverage exactly when it is needed most.`,
    keywords: ['SR 11-7', 'model validation', 'model governance', 'CECL', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },
  {
    code: 'B172',
    name: 'External Validator Independence Not Documented for Consent Order Remediation Validations',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital engages an external consulting firm to clear the validation backlog
      arising from the MRM consent order, but the engagement letter does not address SR 11-7
      independence requirements, and the external validators receive model documentation
      prepared by the same development team they are assessing. SR 11-7 requires validators
      to have no stake in whether the model is approved; when OCC examiners review the
      consent order remediation evidence package, they find that two external validation
      reports were prepared by consultants who also provided model development advisory
      services to the bank in the prior year — a structural independence violation that
      invalidates the remediation credit for those validations.`,
    keywords: ['SR 11-7', 'model validation', 'consent order', 'independent validation unit', 'TPRM'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },
  {
    code: 'B173',
    name: 'Validation Finding Severity Classification Not Consistently Applied Across Models',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's IVU validation reports use a three-tier severity classification
      (high, medium, low) for validation findings, but no written criteria define what
      distinguishes high from medium severity, leading individual validators to apply
      different standards — the same type of data quality deficiency is rated high in one
      validation and medium in another. When the MRM consent order requires the bank to
      close all high-severity validation findings within 90 days, inconsistent classification
      means some material model weaknesses escape the 90-day escalation requirement, and
      OCC examiners using their own severity assessment find that the bank has underclassified
      findings to reduce the apparent consent order remediation burden.`,
    keywords: ['SR 11-7', 'model validation', 'model governance', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },

  // ── Model Monitoring ──────────────────────────────────────────────────────
  {
    code: 'B174',
    name: 'Data Drift Monitoring Not Separated From Concept Drift in Model Reports',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's model monitoring program uses population stability index (PSI)
      metrics to detect changes in model input distributions, but the monitoring design
      does not distinguish between data drift — changes in the input feature distribution —
      and concept drift — changes in the relationship between inputs and the target outcome.
      SR 11-7 conceptual soundness requirements imply that a model validated under a given
      input-outcome relationship must be revalidated when that relationship changes; tracking
      only PSI can show that the input population is stable while the credit cycle has
      shifted the default rate relationship, leaving the model miscalibrated without
      triggering any monitoring alert.`,
    keywords: ['SR 11-7', 'model monitoring', 'data drift', 'concept drift', 'CECL'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B175',
    name: 'Performance Metric Thresholds Defined at Mean but Not at Tail for Credit Models',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's credit loss model monitoring program defines alert thresholds based
      on mean prediction error — the average difference between predicted and observed loss
      rates — but does not set thresholds for tail accuracy, such as whether the model
      correctly ranks the worst-performing segments or captures loss concentration in
      adversely graded loan cohorts. SR 11-7 outcome analysis requirements extend beyond
      mean accuracy to the model's behavior in the tails of the distribution, which matter
      most for CECL adequacy and stress testing; a model can have acceptable mean accuracy
      while systematically underestimating tail losses in the segments most material to
      capital adequacy.`,
    keywords: ['SR 11-7', 'model monitoring', 'CECL', 'outcome analysis', 'credit risk'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B176',
    name: 'Early Warning Indicator Framework Lacks Prescribed Response Actions',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's model monitoring program defines early warning indicators (EWIs)
      for its credit and capital models — PSI thresholds, Gini coefficient degradation
      bands, and calibration error limits — but the monitoring framework does not specify
      what action the model owner or MRM team must take when an EWI is triggered. Without
      prescribed response actions, EWI triggers result in ad hoc discussions rather than
      systematic recalibration, override documentation, or escalation; SR 11-7 requires
      that ongoing monitoring include a defined governance response loop, and OCC examiners
      reviewing First Capital's monitoring records find multiple EWI breaches with no
      documented follow-up action.`,
    keywords: ['SR 11-7', 'model monitoring', 'model governance', 'OCC examination', 'early warning'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B177',
    name: 'Champion-Challenger Performance Gap Not Defined — Challenger Never Evaluated for Promotion',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's consumer credit scoring model has operated in champion-challenger
      configuration for 22 months, with the challenger model consistently outperforming
      the champion on KS statistic and Gini, but no governance document defines the
      performance threshold that would trigger a formal promotion evaluation. SR 11-7 model
      lifecycle governance requires that all significant deployment decisions — including
      promotion of a challenger — be governed by a documented process with defined criteria;
      the absence of a performance gap threshold means the challenger improvement is
      recognized qualitatively but never formally assessed for promotion, leaving the bank
      using an inferior model while the better-performing challenger routes only 5% of
      volume indefinitely.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'model governance', 'model monitoring', 'consumer credit'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B178',
    name: 'AML Model Alert Suppression Logic Monitors Throughput Not Effectiveness',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's AML transaction monitoring model includes a suppression logic layer
      that reduces alert volume by filtering structurally low-risk transactions, and the
      model monitoring program tracks suppression rate and total alert throughput as the
      primary metrics. The monitoring design treats alert volume reduction as success without
      measuring the false-negative rate — the proportion of genuinely suspicious transactions
      that the suppression layer eliminates; when FinCEN examination data reveals that peer
      banks with similar portfolios filed SARs at significantly higher rates, the root cause
      is identified as suppression logic that was tuned to reduce analyst workload rather than
      to preserve SAR coverage at population-appropriate levels, a BSA/AML model governance
      failure with consent order implications.`,
    keywords: ['SR 11-7', 'AML', 'model monitoring', 'BSA', 'consent order'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B179',
    name: 'CECL Allowance Model Monitoring Conducted After Reporting Date Not Before',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's CECL allowance model monitoring cycle produces a quarterly
      performance report approximately 45 days after each reporting period closes, meaning
      monitoring findings cannot influence the allowance estimate they are assessing. When
      the model monitoring team identifies calibration drift in the commercial real estate
      PD component after Q3 close, the Q3 allowance has already been filed with regulators
      and cannot be restated; SR 11-7 requires that monitoring programs be designed to
      produce actionable findings within the governance cycle, not retrospectively after
      regulatory submissions have been made.`,
    keywords: ['CECL', 'SR 11-7', 'model monitoring', 'OCC examination', 'PD calibration'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },

  // ── Stress Testing ────────────────────────────────────────────────────────
  {
    code: 'B180',
    name: 'DFAST Model Assumption Documentation Incomplete for OCC Examination Review',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's DFAST submission includes model output tables and scenario results
      but the supporting model assumption documentation — which the OCC examines to assess
      whether scenarios are plausible and models are conceptually sound — does not document
      the basis for key behavioral assumptions including deposit beta paths, commercial loan
      prepayment speeds, and credit migration matrix choices. SR 11-7 requires that model
      assumptions be documented, supported, and subject to sensitivity analysis; OCC examiners
      conducting the model risk examination request the assumption documentation package and
      are unable to locate complete rationale for the assumptions driving the NII and credit
      loss projections in the adverse scenario.`,
    keywords: ['DFAST', 'SR 11-7', 'model documentation', 'OCC examination', 'stress testing'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B181',
    name: 'Reverse Stress Test Model Not Subject to SR 11-7 Validation',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital conducts reverse stress testing as part of its internal capital
      adequacy assessment process (ICAAP), using a model that identifies scenarios under
      which the bank's capital would fall below regulatory minimums; the model is developed
      by the capital planning team and has never been reviewed by the IVU or registered in
      the SR 11-7 inventory. The OCC expects banks to apply SR 11-7 governance to all
      quantitative tools used in capital adequacy assessment, including reverse stress test
      models; a model used to identify existential risk scenarios but exempt from validation
      contradicts the risk-proportionate validation principle and is cited in the OCC's
      model risk examination as a governance structure gap.`,
    keywords: ['DFAST', 'SR 11-7', 'model validation', 'ICAAP', 'stress testing'],
    subTopic: 'stress-testing',
  },
  {
    code: 'B182',
    name: 'DFAST Scenario Coverage Excludes Cyber Loss Scenario Required by OCC Guidance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's DFAST scenario set covers credit loss, market risk, and NII
      compression scenarios but does not include an operational loss scenario anchored to
      a cyber incident, despite OCC supervisory guidance that banks include operational
      risk scenarios in stress testing frameworks proportionate to identified operational
      risk concentrations. First Capital's operational risk assessment identifies a high
      concentration of cyber risk related to its digital banking platform migration; the
      absence of a cyber loss scenario in DFAST creates an inconsistency between the
      bank's operational risk assessment and its capital planning framework that OCC
      examiners flag as a supervisory concern.`,
    keywords: ['DFAST', 'SR 11-7', 'stress testing', 'OCC examination', 'operational risk'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B183',
    name: 'CRE Concentration Stress Scenario Uses 2008–2012 Loss Rates Not CRE 2023–2025',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's commercial real estate stress scenario for DFAST anchors CRE loss
      rates on the 2008–2012 commercial real estate crisis, which saw office vacancy rates
      peak at approximately 17% and stabilize; the 2023–2025 office CRE stress environment
      involves structural vacancy driven by hybrid work adoption that is broadly expected
      to persist rather than revert. Using a cyclical stress calibration for what analysts
      characterize as a structural shift in office demand means that First Capital's DFAST
      CRE loss estimates understate the tail risk in its office portfolio, and OCC examiners
      with access to peer bank CRE stress calibrations identify First Capital's scenario
      as an outlier on the low end.`,
    keywords: ['DFAST', 'SR 11-7', 'stress testing', 'commercial real estate', 'LGD'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B184',
    name: 'CCAR Macro Variable Paths Not Reconciled Against Fed Published Scenarios',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital uses internally developed macro variable paths for its CCAR-equivalent
      internal stress testing rather than anchoring to the Federal Reserve's published
      supervisory scenario variables, and the reconciliation between internal and Fed
      scenario paths is not documented or validated. When OCC examiners compare First
      Capital's internally generated severe adverse GDP, unemployment, and house price
      paths against the Federal Reserve's published supervisory variables, they find that
      First Capital's adverse scenario is materially less severe on commercial real estate
      prices and unemployment duration — a scenario severity gap that undermines the
      credibility of the bank's capital adequacy conclusions under stress.`,
    keywords: ['CCAR', 'DFAST', 'SR 11-7', 'stress testing', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B185',
    name: 'Climate Risk Stress Scenario Not Integrated Into DFAST Capital Framework',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital has conducted a preliminary climate risk assessment identifying material
      physical and transition risk concentrations in its agricultural lending and coastal
      commercial real estate portfolios, but the climate scenarios developed for this
      assessment are not integrated into the DFAST stress testing framework or reflected
      in the CECL allowance methodology. OCC guidance issued in 2023 on climate-related
      financial risk management and the FDIC parallel framework expect banks with material
      climate risk concentrations to incorporate climate scenarios into capital and loss
      forecasting; the absence of integration means the bank's capital planning understates
      tail risk from climate-related credit losses in identified concentration segments.`,
    keywords: ['DFAST', 'SR 11-7', 'climate risk', 'stress testing', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'stress-testing',
  },
  {
    code: 'B186',
    name: 'Stress Test Model Interaction Effects Not Assessed Across Credit and Market Models',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital runs its DFAST credit loss models and market risk models independently
      and aggregates results without assessing the interaction effects between credit
      deterioration and market conditions that are inherent in a severe adverse scenario —
      for example, the impact of a credit spread widening on the bank's held-to-maturity
      portfolio value, or the effect of collateral devaluation on LGD estimates in the
      credit model. SR 11-7 requires that the limitations of models be documented and
      assessed; running stress models that explicitly ignore cross-model interactions
      in a scenario designed to stress multiple risk dimensions simultaneously is a material
      modeling limitation that must be disclosed and offset with sensitivity analysis.`,
    keywords: ['DFAST', 'SR 11-7', 'stress testing', 'model documentation', 'Basel III'],
    subTopic: 'stress-testing',
  },

  // ── Consent Order Remediation ─────────────────────────────────────────────
  {
    code: 'B187',
    name: 'MRM Policy Gap Remediation Addresses Form Not Function — Same Gap Persists',
    officeCategory: 'back_office',
    failureRatePct: 80,
    description:
      `First Capital's consent order requires remediation of model inventory completeness
      by updating the MRM policy to explicitly include vendor models, Excel tools, and AI
      models within the SR 11-7 perimeter; the bank updates the policy language but does
      not conduct an inventory re-census using the expanded definition or build a process
      to capture newly in-scope models going forward. When OCC examiners assess progress
      at the follow-up examination, they find that the policy now correctly describes
      scope but that the actual inventory has grown by only 8 models against an estimated
      population of 60+ newly in-scope models — the same inventory gap persists under
      a new policy description, which the OCC characterizes as remediation of form rather
      than substance.`,
    keywords: ['consent order', 'SR 11-7', 'model inventory', 'OCC examination', 'model governance'],
    demoRelevant: true,
    subTopic: 'consent-order-remediation',
  },
  {
    code: 'B188',
    name: 'Consent Order Finding Re-Open Risk — Root Cause Not Addressed in Remediation',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's consent order remediation plan addresses each examination finding
      as a discrete deficiency without a root cause analysis that maps findings to underlying
      governance structure or process weaknesses; as a result, remediating one finding
      by adding a policy procedure does not prevent a variant of the same finding from
      emerging in a different business unit or model type. OCC examination practice
      distinguishes between point remediation — fixing a specific instance — and systemic
      remediation — correcting the governance gap that allows the deficiency to occur;
      when OCC examiners return for the follow-up examination, they discover three new
      instances of the same root-cause weakness that the bank's point-remediation approach
      failed to eliminate, reopening the finding with heightened MRA severity.`,
    keywords: ['consent order', 'OCC examination', 'SR 11-7', 'model governance', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'consent-order-remediation',
  },
  {
    code: 'B189',
    name: 'Consent Order Timeline Management Without Status Dashboard Risks Milestone Miss',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital manages its MRM consent order remediation milestones in a project plan
      spreadsheet maintained by the chief compliance officer's team, without a real-time
      status dashboard visible to senior management, the MRM committee, or the board audit
      committee. When a critical validation backlog clearance milestone approaches, the
      project tracking system does not provide adequate warning that five of the eight
      required validations are blocked on model owner document submissions; the milestone
      is missed by 45 days, triggering an OCC notification requirement and creating a
      derogatory record in the bank's examination history at a time when the bank is
      seeking OCC approval for an acquisition.`,
    keywords: ['consent order', 'OCC examination', 'SR 11-7', 'model governance', 'remediation plan'],
    demoRelevant: true,
    subTopic: 'consent-order-remediation',
  },
  {
    code: 'B190',
    name: 'Examiner-Identified Finding Evidence Quality Insufficient for MRA Closure',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital submits remediation evidence packages for consent order Matters
      Requiring Attention (MRAs) consisting primarily of updated policy documents, committee
      meeting minutes referencing the finding, and attestation letters from business unit
      heads — evidence that documents discussion of remediation rather than demonstrating
      operational change. OCC supervisory standards for MRA closure require evidence of
      sustained operational practice over a sufficient observation period, not policy
      adoption or management attestation; the OCC rejects the evidence package for four
      of six MRAs, extending the consent order and requiring First Capital to produce
      process observation data, validation report samples, and monitoring record extracts
      demonstrating the new controls working as designed.`,
    keywords: ['consent order', 'OCC examination', 'SR 11-7', 'remediation plan', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'consent-order-remediation',
  },
  {
    code: 'B191',
    name: 'MRM Consent Order Scope Creep — New Findings Added After Initial Issuance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `As First Capital executes remediation activities under its initial MRM consent
      order, the OCC's ongoing monitoring activities identify additional model governance
      weaknesses not covered by the original order — including AI model inventory gaps
      and DFAST satellite model validation failures — which the OCC adds to the consent
      order as supplemental findings during the remediation period. The bank's project
      management framework did not anticipate in-flight scope expansion, and the remediation
      team lacks capacity to absorb new findings without deferring existing milestone
      commitments; the expanding consent order scope strains the bank's governance
      improvement program and creates a compounding backlog that requires OCC-approved
      timeline amendments.`,
    keywords: ['consent order', 'OCC examination', 'SR 11-7', 'model governance', 'DFAST'],
    demoRelevant: true,
    subTopic: 'consent-order-remediation',
  },
  {
    code: 'B192',
    name: 'Board Model Risk Committee Does Not Receive Consent Order Remediation Updates',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's consent order remediation is managed through the executive MRM
      committee and reported to the chief risk officer, but the board audit committee
      and board risk committee do not receive regular, structured updates on consent order
      milestone status, evidence submission progress, or OCC feedback on remediation
      adequacy. OCC supervisory expectations for consent order governance require board-level
      oversight of remediation progress as a demonstration that management is accountable
      to the board for resolving the governance deficiencies identified; the absence of
      board-level reporting is cited at the follow-up examination as evidence of inadequate
      board engagement in model risk governance remediation.`,
    keywords: ['consent order', 'OCC 2011-12', 'model governance', 'MRM committee', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'consent-order-remediation',
  },
  {
    code: 'B193',
    name: 'MRM Policy Remediation Does Not Include Training Deployment Evidence',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's consent order requires the bank to update its model risk policy
      and ensure staff are trained on the new requirements; the policy update is completed
      on schedule and a training module is developed, but completion rates across business
      units responsible for model development and ownership remain below 40% at the OCC's
      follow-up review. OCC examiners assess training completion as evidence of policy
      operationalization; a 40% completion rate three months after a consent order policy
      milestone demonstrates that the cultural and process change required to embed the
      new model risk standards has not been achieved, and the bank is required to provide
      a supplemental training plan with enforced completion milestones.`,
    keywords: ['consent order', 'OCC examination', 'SR 11-7', 'model governance', 'remediation plan'],
    demoRelevant: true,
    subTopic: 'consent-order-remediation',
  },

  // ── AI/MRM Advanced ───────────────────────────────────────────────────────
  {
    code: 'B194',
    name: 'GenAI Model in Production Without SR 11-7 Inventory Entry',
    officeCategory: 'back_office',
    failureRatePct: 82,
    description:
      `First Capital's commercial banking team deploys a GenAI model that analyzes
      borrower earnings call transcripts, news sentiment, and covenant compliance language
      to generate an early warning credit risk score used by relationship managers in
      portfolio review meetings. The GenAI tool is procured through the technology budget
      as a productivity application and never presented to the MRM team for SR 11-7
      assessment; the credit risk scoring output, however, is explicitly cited in portfolio
      review documents presented to the credit committee, placing it firmly within the
      SR 11-7 model perimeter. OCC examiners reviewing the bank's AI governance discover
      the unregistered GenAI model through a review of credit committee package metadata,
      and the finding is incorporated into the active MRM consent order.`,
    keywords: ['SR 11-7', 'GenAI', 'model inventory', 'OCC examination', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B195',
    name: 'Foundation Model Fine-Tuned on Credit Data Redeployed Without Revalidation',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's data science team fine-tuned a large language model foundation on
      commercial credit agreement text to support covenant extraction and classify borrower
      financial covenant compliance status; after the base model provider released a
      significantly updated version of the foundation model, the team re-fine-tuned the
      new base without submitting the updated model for SR 11-7 independent validation,
      treating the update as a minor model change. SR 11-7 requires that material changes
      to model structure — including changes to the pre-trained weights underlying a fine-
      tuned model — trigger revalidation; the new base model introduces different attention
      patterns and term relationships that alter covenant classification outcomes in ways
      the original validation cannot have assessed.`,
    keywords: ['SR 11-7', 'LLM', 'model validation', 'model inventory', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B196',
    name: 'Multi-Model AI Pipeline Lacks End-to-End SR 11-7 Governance Coverage',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's digital lending decisioning workflow chains four AI models in
      sequence: an identity verification model, an income verification model, a credit
      risk scoring model, and a pricing model — each registered separately in the SR 11-7
      inventory and validated independently. The pipeline's aggregate behavior — how errors
      propagate across model boundaries, how combined model uncertainty affects the final
      credit decision, and how a failure in the income verification model cascades into
      mis-priced credit — is not assessed or documented anywhere in the model governance
      framework. SR 11-7's systemic model risk requirements extend to aggregated model
      workflows; OCC examiners examining the digital lending program identify the pipeline
      governance gap as a material weakness not covered by the individual model validations.`,
    keywords: ['SR 11-7', 'model governance', 'AI/ML', 'model validation', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B197',
    name: 'AI Model Output Used in Regulatory Filing Without MRM Sign-Off',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital's finance team uses an AI-powered financial statement analysis tool
      to generate variance commentary for its quarterly Call Report narrative and Board
      DFAST presentation, but the AI tool has not been reviewed by the MRM function and
      has no SR 11-7 inventory registration or validation documentation. The OCC's model
      risk examination guidance explicitly addresses AI tools used in regulatory filings;
      deploying an unvalidated AI tool to generate content for a supervisory submission
      creates a model governance deficiency at precisely the point where the accuracy
      and reliability of AI outputs carries the highest supervisory consequence — the
      regulatory record itself.`,
    keywords: ['SR 11-7', 'AI/ML', 'model inventory', 'regulatory reporting', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B198',
    name: 'Third-Party AI API Used for AML Risk Scoring Without Model Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's BSA/AML compliance team subscribes to a third-party AI API that
      assigns typology risk scores to incoming payments based on geolocation, counterparty
      network analysis, and transaction pattern classification; the API scores are consumed
      by the AML alert management system to prioritize analyst review queues. The API
      vendor provides a data sheet but no methodology documentation, no performance metrics
      on First Capital's transaction population, and no contractual access to model
      internals; under OCC 2013-29 and SR 11-7, third-party AI services used in high-risk
      compliance functions require a model risk assessment, and deploying an opaque API
      without assessment into the SAR decision workflow creates both MRM and BSA/AML
      governance exposure.`,
    keywords: ['SR 11-7', 'AML', 'OCC 2013-29', 'TPRM', 'AI/ML'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B199',
    name: 'AI Fraud Detection Copilot Used by Analysts Without Validation or Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's fraud operations team uses a commercial AI copilot tool that
      analyzes transaction alerts, surfaces recommended disposition decisions, and drafts
      SAR narrative sections for analyst review. The copilot is classified as an analyst
      assist tool rather than a model by the vendor, but in practice analysts accept the
      AI recommendation with minimal review in more than 60% of alert dispositions, making
      the copilot a functional decision model within the meaning of SR 11-7. The absence
      of an SR 11-7 inventory entry, performance monitoring, or validation of the copilot's
      disposition accuracy on First Capital's fraud portfolio creates a systemic oversight
      gap that FinCEN examination and OCC model risk examination both have authority to cite.`,
    keywords: ['SR 11-7', 'fraud AI', 'AML', 'model inventory', 'BSA'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B200',
    name: 'AI Deposit Pricing Engine Deployed Without Behavioral Model Revalidation',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's treasury team deploys an AI-based deposit pricing optimization
      engine that dynamically adjusts retail savings and CD rates using competitive rate
      feeds, balance migration models, and churn prediction signals. The pricing engine
      is treated as a business intelligence tool rather than a model, but it consumes
      outputs from First Capital's deposit behavior model — which is independently
      validated — without any assessment of how the pricing engine's optimization logic
      interacts with the behavioral model's assumptions. SR 11-7 requires that models
      consuming validated model outputs as inputs be themselves validated; the pricing
      engine's optimization logic can amplify or counteract the behavioral model's
      assumptions in ways not covered by the underlying model's validation scope.`,
    keywords: ['SR 11-7', 'AI/ML', 'model inventory', 'interest rate risk', 'DFAST'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B201',
    name: 'NLP Model Screening BSA High-Risk Customers Not Validated on Bank Population',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an NLP model to analyze news feeds and adverse media for
      BSA customer due diligence, automatically flagging mentions of sanctions, money
      laundering, or fraud associated with customer names. The NLP model is trained
      on a generic financial crime news corpus by the vendor and has not been validated
      on First Capital's customer name set for precision and recall against the bank's
      own customer risk profile. SR 11-7 and FinCEN's risk-based CDD requirements
      together require that automated CDD tools perform at a level appropriate to the
      bank's specific customer and risk profile; an unvalidated NLP model generating
      false negatives on customer names common in First Capital's regional demographic
      creates both BSA governance exposure and fair lending risk under ECOA.`,
    keywords: ['SR 11-7', 'AML', 'NLP model', 'BSA', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B202',
    name: 'AI Underwriting Copilot Generates Credit Memo Summaries Not Reviewed as Model Output',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial lending platform integrates an AI copilot that reads
      borrower financial statements and generates structured credit memo summaries including
      financial ratio analysis, covenant compliance tables, and qualitative risk narrative.
      The credit memo summaries are reviewed by underwriters before committee submission,
      but the review process does not include a step to independently verify the AI-generated
      financial ratios against the source financials; when an AI calculation error in a
      DSCR computation goes undetected, a commercial real estate credit is approved at
      an LTV and debt service coverage threshold that would have required additional
      credit mitigants under the bank's policy — an SR 11-7 and credit risk governance
      failure that surfaces at post-close portfolio review.`,
    keywords: ['SR 11-7', 'GenAI', 'credit risk', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B203',
    name: 'AI Liquidity Risk Monitoring Tool Not Assessed Under SR 11-7 Perimeter',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's treasury risk team subscribes to an AI-based liquidity risk
      monitoring platform that generates intraday liquidity adequacy scores, contingency
      funding gap projections, and stress-day cash flow alerts. The platform is procured
      as a risk analytics SaaS subscription and sits outside the MRM model inventory;
      the platform's scoring and projection algorithms are not documented at a level
      sufficient for SR 11-7 conceptual soundness assessment, and First Capital has
      not conducted an independent validation of the tool's liquidity projections against
      the bank's own historical stress periods. The OCC's SR 11-7 framework covers tools
      that generate risk estimates used in regulatory liquidity reporting and management
      decisions, placing this tool within the model governance perimeter regardless of
      its SaaS procurement classification.`,
    keywords: ['SR 11-7', 'AI/ML', 'model inventory', 'BCBS 239', 'liquidity risk'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B204',
    name: 'Vendor AI Credit Scoring API Opaque to SR 11-7 Conceptual Soundness Review',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital consumes a third-party AI credit scoring API for digital consumer
      loan origination; the API returns a score and risk bucket but provides no feature
      importance disclosure, model methodology documentation, or performance metrics on
      representative consumer populations. SR 11-7 requires banks to understand and
      challenge models, including vendor models; an opaque AI API where the bank cannot
      conduct conceptual soundness review, assess feature selection for proxy discrimination,
      or reproduce model outputs does not satisfy the independence requirements of SR 11-7
      validation. The CFPB's 2022 AI adverse-action guidance adds a parallel fair lending
      governance requirement that makes the opacity of this vendor API a dual-exposure
      regulatory risk.`,
    keywords: ['SR 11-7', 'vendor AI', 'model validation', 'Reg B', 'OCC 2013-29'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B205',
    name: 'Synthetic Data Used in Model Training Not Assessed for Distributional Fidelity',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's data science team uses a vendor synthetic data generation tool to
      augment training datasets for credit risk and fraud models where real customer data
      is limited or imbalanced; the synthetic data is incorporated into model training
      without any SR 11-7 documentation of the generation methodology, distributional
      fidelity assessment, or validation of whether the synthetic data introduces bias
      into the training population. OCC model risk guidance requires that training data
      quality — including synthetic data — be assessed as part of the conceptual soundness
      review; synthetic data that does not faithfully represent the target population can
      produce models with inflated in-sample performance and degraded real-world accuracy,
      a risk that is invisible without distributional fidelity testing.`,
    keywords: ['SR 11-7', 'model validation', 'synthetic data', 'AI/ML', 'model documentation'],
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B206',
    name: 'AI Model Explainability Framework Absent for Adverse-Action Sensitive Decisions',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital operates three ML credit models — for consumer auto, personal loan,
      and small business credit — none of which have a documented explainability framework
      that produces actionable factor codes meeting CFPB and OCC adverse-action standards.
      The models' outputs are mapped to traditional scorecard factor codes through a post-
      hoc SHAP approximation, but the approximation was validated only at the portfolio
      level and has not been tested for accuracy at the individual decision level where
      Reg B adverse-action notice accuracy is legally required. When a CFPB examination
      samples adverse-action notices and finds that the stated factor codes do not match
      the model's actual feature importances for individual applicants, the bank faces
      both Reg B compliance exposure and an SR 11-7 model governance finding on
      explainability documentation.`,
    keywords: ['SR 11-7', 'AI/ML', 'Reg B', 'adverse action', 'ECOA'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },

  // ── Additional Cross-Cutting Patterns ────────────────────────────────────
  {
    code: 'B207',
    name: 'Model Validation Independence Compromised by Matrix Reporting Structure',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's independent validation unit reports in a matrix structure to both
      the Chief Risk Officer and the Chief Financial Officer — the CFO controls IVU budget
      and headcount decisions while the CRO oversees model risk governance. When the CFO
      organization presses for a faster validation sign-off on the DFAST NII model to
      meet a board presentation deadline, the IVU director agrees to a conditional approval
      with three open findings, overriding the normal governance requirement that high
      findings be resolved before approval. SR 11-7 requires structural independence that
      includes freedom from organizational pressure on validation conclusions; a matrix
      reporting structure where a business-facing executive controls IVU resources is a
      structural independence failure that OCC examiners cite as a design defect in the
      bank's MRM governance architecture.`,
    keywords: ['SR 11-7', 'independent validation unit', 'model governance', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },
  {
    code: 'B208',
    name: 'CECL Model Qualitative Factor Methodology Not Independently Validated',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's CECL allowance process includes a qualitative factor component that
      adjusts the quantitative model output for factors not captured in historical loss data,
      such as current economic uncertainty, portfolio concentration, and management judgment;
      the qualitative factor methodology is documented as a policy but has not been subject
      to independent validation as a model component under SR 11-7. FASB ASC 326 requires
      that CECL methodologies be applied on a reasonable and supportable basis, and OCC
      supervisory guidance expects that qualitative factor frameworks be subject to MRM
      governance — including documentation of the basis for each factor, the range of
      adjustments, and a review process that prevents qualitative factors from masking
      quantitative model degradation.`,
    keywords: ['CECL', 'SR 11-7', 'model validation', 'OCC examination', 'model governance'],
    demoRelevant: true,
    subTopic: 'validation-governance',
  },
  {
    code: 'B209',
    name: 'Basel III RWA Model Not Subject to Annual Validation Cycle',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's standardized risk-weighted asset (RWA) calculations for Basel III
      capital reporting use internally developed risk-weighting algorithms that map loan
      attributes to regulatory capital buckets; these algorithms were implemented at the
      time of Basel III adoption and have not been subject to an SR 11-7 validation cycle
      because they are characterized as regulatory calculation engines rather than models.
      OCC model risk guidance does not exempt regulatory calculation tools from validation
      when they apply quantitative methods to transform loan data into capital-impacting
      outputs; the absence of any validation history for the RWA calculation engine means
      mapping errors that arose from core banking system changes have been propagating
      through regulatory capital reports undetected for multiple quarters.`,
    keywords: ['SR 11-7', 'Basel III', 'model validation', 'OCC examination', 'model governance'],
    demoRelevant: false,
    subTopic: 'validation-governance',
  },
  {
    code: 'B210',
    name: 'Model Retirement Not Executed After Replacement — Dual-Model Confusion Risk',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital replaces its commercial loan PD model with a next-generation version
      following a full validation cycle, but the legacy model is not formally retired from
      the SR 11-7 inventory or decommissioned from the analytics environment; both models
      remain active in the inventory and continue to generate monthly monitoring reports.
      When a business analyst running a portfolio review query inadvertently references
      the legacy model's output rather than the current validated model, the portfolio
      review presented to the credit committee contains PD estimates based on a deprecated
      model — an error that is only discovered when the CRO notices discrepancies between
      the committee package and the current CECL reserve calculation, triggering a data
      integrity investigation.`,
    keywords: ['SR 11-7', 'model retirement', 'model inventory', 'model governance', 'CECL'],
    subTopic: 'model-inventory',
  },
  {
    code: 'B211',
    name: 'Model Risk Cost Allocation Not Aligned With Business Unit Model Usage',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital allocates MRM function costs uniformly across business units as an
      overhead charge rather than in proportion to each unit's model count, validation
      complexity, or model risk exposure; as a result, business units with large model
      portfolios and complex AI deployments pay the same MRM cost as units with minimal
      model usage, removing any economic incentive for business units to rationalize their
      model portfolios or invest in model documentation quality. SR 11-7 governance
      effectiveness depends on business unit owners having accountability for model risk;
      a cost allocation model that severs the link between model risk ownership and
      financial accountability systematically reduces the quality of business unit model
      documentation and monitoring responsiveness.`,
    keywords: ['SR 11-7', 'model governance', 'OCC 2011-12', 'model inventory', 'MRM committee'],
    subTopic: 'consent-order-remediation',
  },
  {
    code: 'B212',
    name: 'AI Credit Scoring Model Bias Not Reassessed After Portfolio Demographic Shift',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's AI consumer credit scoring model was deployed with a fair lending
      disparate impact analysis conducted on its 2021 origination population; since then,
      a branch network expansion into demographically different markets has shifted the
      applicant population significantly, but no reassessment of the model's disparate
      impact has been conducted on the current population. OCC and CFPB examination practice
      requires that fair lending testing of AI credit models reflect the current borrower
      population served by the bank; a disparate impact analysis conducted on a different
      population provides no assurance about the model's fairness properties in the current
      application environment, and the model's SR 11-7 validation is effectively stale
      for fair lending purposes.`,
    keywords: ['SR 11-7', 'Reg B', 'ECOA', 'AI/ML', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B213',
    name: 'Vendor Foundation Model Used for Loan Document Analysis Without TPRM Model Review',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's operations team deploys a vendor foundation model to extract loan
      covenant terms, borrower entity names, and collateral descriptions from commercial
      loan documents at origination; the model's outputs populate the loan administration
      system and drive collateral tracking and covenant compliance monitoring workflows.
      The vendor is approved through the bank's standard TPRM program, which assesses
      data security, business continuity, and financial viability but does not include
      an SR 11-7 model risk assessment of the foundation model's extraction accuracy on
      First Capital's specific loan document formats. OCC 2013-29 and SR 11-7 require
      that third-party AI services used in critical workflow automation be assessed for
      model risk; extraction errors that miscategorize collateral types or misread covenant
      thresholds propagate downstream into regulatory and credit reporting without detection.`,
    keywords: ['SR 11-7', 'OCC 2013-29', 'LLM', 'TPRM', 'model inventory'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B214',
    name: 'AI Capital Allocation Recommendation Tool Not Registered as Model',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's capital planning team uses an AI-powered scenario analysis tool
      that recommends optimal capital allocation across business lines under multiple
      stress scenarios; the tool generates quantitative recommendations that CFO
      leadership uses to inform capital distribution decisions presented to the board.
      The tool is licensed as a strategic planning software subscription and has not
      been assessed against SR 11-7 model governance requirements, despite producing
      quantitative outputs that directly influence capital allocation decisions material
      to DFAST submissions and regulatory capital planning. OCC examiners reviewing
      the bank's capital planning process identify the tool through board presentation
      footnotes and find it has no inventory registration, no validation documentation,
      and no monitoring program, adding it to the consent order's model inventory
      remediation scope.`,
    keywords: ['SR 11-7', 'DFAST', 'model inventory', 'AI/ML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B215',
    name: 'AI-Assisted HMDA LAR Review Not Validated on Fair Lending Accuracy',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital uses an AI tool to assist with Home Mortgage Disclosure Act (HMDA)
      Loan Application Register (LAR) data quality review, automatically identifying
      potential data entry errors and suggesting corrections before the LAR is filed
      with the CFPB. The tool is classified as a data quality aid and has not been
      assessed under SR 11-7, despite the fact that its suggested corrections influence
      the final demographic and geographic data underlying CFPB fair lending analysis.
      SR 11-7 encompasses tools that generate outputs used to modify regulatory submissions;
      an AI tool that systematically suggests corrections to HMDA protected class fields
      without validated accuracy on First Capital's origination patterns creates a fair
      lending data integrity risk that CFPB HMDA reviewers have authority to examine.`,
    keywords: ['SR 11-7', 'HMDA', 'AI/ML', 'model governance', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
  {
    code: 'B216',
    name: 'Automated Stress Testing Sensitivity Tool Not Covered by DFAST Model Governance',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's DFAST team uses an automated sensitivity analysis tool that runs
      hundreds of parameterized stress scenarios around the base and adverse cases to
      assess model output sensitivity to key macro variable assumptions; the tool is
      built on a commercial analytics platform and generates the sensitivity disclosures
      included in the DFAST submission. The tool is not registered in the SR 11-7 inventory
      or subject to validation, despite generating quantitative outputs cited in a
      regulatory submission; SR 11-7's model perimeter encompasses tools that produce
      systematic quantitative outputs material to regulatory capital analysis, and the
      OCC examiner reviewing the DFAST submission's sensitivity section discovers the
      tool's existence and requests its methodology documentation, which the bank cannot
      produce.`,
    keywords: ['DFAST', 'SR 11-7', 'model governance', 'OCC examination', 'stress testing'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B217',
    name: 'Model Risk Consent Order Remediation Plan Not Linked to DFAST Submission Calendar',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's MRM consent order remediation milestones are managed on an
      independent project timeline without coordination with the annual DFAST submission
      calendar; as a result, validation backlog clearance milestones are scheduled to
      complete six weeks after the DFAST submission date, meaning the bank files its DFAST
      submission with unvalidated models in the capital model suite. OCC examiners reviewing
      the DFAST submission alongside the consent order status confirm that three models used
      in the NII and credit loss projections submitted to the OCC do not have current
      validation documentation — a compounding supervisory concern that undermines both
      the DFAST submission's credibility and the consent order remediation program's
      credibility simultaneously.`,
    keywords: ['consent order', 'DFAST', 'SR 11-7', 'OCC examination', 'model governance'],
    demoRelevant: true,
    subTopic: 'consent-order-remediation',
  },
  {
    code: 'B218',
    name: 'AI Model Monitoring Vendor Produces Dashboards But No Actionable Findings',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital engages a model monitoring vendor to produce automated performance
      dashboards for its AI credit and fraud models, generating monthly statistical
      summaries of PSI, Gini, KS, and calibration metrics. The vendor's dashboards show
      metric trends but do not produce structured finding reports, severity assessments,
      or recommended actions, leaving First Capital's MRM team to interpret raw metrics
      without guidance on thresholds or materiality. SR 11-7 requires that monitoring
      produce actionable findings reviewed by appropriate management; a dashboard service
      that generates metrics without findings does not satisfy the SR 11-7 monitoring
      governance requirement, and OCC examiners reviewing the bank's monitoring program
      find no evidence of MRM committee review of specific model performance findings
      despite six months of monthly dashboard delivery.`,
    keywords: ['SR 11-7', 'model monitoring', 'AI/ML', 'model governance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'model-monitoring',
  },
  {
    code: 'B219',
    name: 'Agentic AI Workflow Used in Collections Without SR 11-7 MRM Assessment',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's consumer collections team deploys an agentic AI system that
      autonomously initiates outreach to delinquent borrowers, selects contact channel
      and messaging strategy, determines optimal contact timing, and proposes settlement
      and payment plan offers within pre-defined parameters. The agentic system is
      procured as a collections optimization platform and classified as an operational
      workflow tool rather than a model; however, its autonomous offer-generation logic
      constitutes a quantitative decisioning system within the SR 11-7 model perimeter,
      its FDCPA and Reg F compliance implications require credit and compliance governance
      review, and its settlement authority thresholds directly affect the bank's
      allowance adequacy for charged-off receivables. OCC examiners identify the agentic
      AI system through a Reg F compliance examination and refer the model governance gap
      to the model risk examination team.`,
    keywords: ['SR 11-7', 'AI/ML', 'model inventory', 'Reg F', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-mrm-advanced',
  },
];
