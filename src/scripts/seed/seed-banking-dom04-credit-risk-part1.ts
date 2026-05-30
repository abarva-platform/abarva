// seed-banking-dom04-credit-risk-part1.ts
// Banking genome patterns — Credit Risk & Underwriting
// Code range: B1000–B1059  (60 patterns)
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

export const BANKING_CREDIT_RISK_PART1_PATTERNS: PatternSeed[] = [

  // ── Credit Models: PD/LGD/EAD Recalibration ──────────────────────────────
  {
    code: 'B1000',
    name: 'PD Model Not Recalibrated After Post-2022 Rate Shock',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's commercial PD model was calibrated on 2015–2020 origination data where debt-service coverage ratios averaged 1.8x and floating-rate stress was minimal; the model has not been recalibrated following the 2022–2024 Fed funds rate trajectory that pushed DSCR below 1.0x for 18–22% of the commercial portfolio. SR 11-7 model monitoring requirements and OCC 2011-12 guidance require outcome analysis that compares predicted default rates to realized defaults at a segment level; without recalibration, the PD surface systematically underestimates risk-weighted assets for the floating-rate commercial book, inflating regulatory capital adequacy metrics at precisely the point where true capital consumption has increased.`,
    keywords: ['SR 11-7', 'PD model', 'recalibration', 'OCC 2011-12', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1001',
    name: 'LGD Surface Stale on Pre-GFC Recovery Rates for CRE Collateral',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's LGD model for commercial real estate collateral relies on recovery rate observations from the 2010–2015 workout cycle, when distressed CRE assets were absorbed by institutional investors at 65–75 cents on the dollar in a recovering market. Post-2023 office and retail CRE price declines have fundamentally altered the recovery landscape — appraisal-based collateral values for the bank's downtown office portfolio have declined 35–45%, but the LGD model continues to apply the historical recovery haircut, causing CECL allowances under ASU 2016-13 to understate expected credit loss for the CRE segment by a margin that the bank's internal audit flagged but the credit risk team has not escalated for model recalibration.`,
    keywords: ['LGD', 'CECL', 'ASU 2016-13', 'commercial real estate', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1002',
    name: 'EAD Model Assumes Pre-Draw CCF on Lines Regardless of Borrower Stress State',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's EAD model applies a uniform credit conversion factor derived from through-the-cycle draw behavior across all revolving credit facilities, without adjusting the CCF for borrowers flagged on the watchlist or in Stage 2 under IFRS 9 / CECL migration criteria. Basel III/IV internal ratings-based guidance and the OCC's supervisory expectations for CECL stress scenario modeling require EAD estimates to reflect elevated draw probability as borrower quality deteriorates; a flat CCF causes the bank to underestimate exposure at default for precisely the borrowers most likely to default, producing an artificially low CECL reserve for the watchlist cohort.`,
    keywords: ['EAD', 'Basel III', 'CECL', 'credit conversion factor', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1003',
    name: 'Through-the-Cycle vs Point-in-Time Toggle Not Governed by Written Policy',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital uses a TTC PD calibration for Basel III/IV regulatory capital calculations and a PIT PD calibration for CECL allowance estimation under ASU 2016-13, but no written policy governs which calibration applies to which use case, how the toggle is documented, or how the two surfaces are reconciled when they diverge by more than a defined threshold. SR 11-7 requires model documentation to be complete and accurate regarding the conditions of appropriate model use; when OCC examiners review the credit risk model suite, the absence of documented calibration selection criteria — and the discovery that the wrong calibration was applied to two quarterly CECL submissions — constitutes a model governance deficiency compounding the consent order timeline.`,
    keywords: ['SR 11-7', 'PD model', 'CECL', 'Basel III', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1004',
    name: 'Challenger PD Model Deployed Without MRM Sign-Off on Scope Change',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's quantitative credit risk team develops a challenger PD model using gradient boosting that outperforms the champion logistic regression model in backtesting; the business unit promotes the challenger to champion for commercial real estate origination decisions without obtaining MRM validation unit sign-off or convening the MRM committee for a deployment decision. SR 11-7 requires governance over all material model lifecycle changes including champion promotion; when the OCC examines First Capital's model risk framework under the consent order, the undocumented deployment of the challenger model — which was validated only on a limited development sample, not on the bank's current origination population — is cited as a model risk governance breach.`,
    keywords: ['SR 11-7', 'model champion-challenger', 'PD model', 'consent order', 'MRM committee'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1005',
    name: 'PD/LGD/EAD Model Correlation Not Tested Under Stress — Compound Risk Underestimated',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's CECL model treats PD, LGD, and EAD as independently estimated components, combining them multiplicatively without testing whether the components are jointly stressed under adverse macro scenarios where correlations between default probability, recovery rate, and draw behavior strengthen materially. Basel III/IV internal models guidance and SR 11-7 outcome analysis requirements anticipate stress scenario testing that captures joint tail behavior; a model architecture that assumes independence of credit risk components will systematically underestimate expected credit loss in the severe adverse scenario, producing a DFAST result that fails to capture the compound effect of stress on the commercial portfolio.`,
    keywords: ['Basel III', 'CECL', 'PD model', 'LGD', 'DFAST'],
    subTopic: 'credit-models',
  },
  {
    code: 'B1006',
    name: 'Macroeconomic Overlay Applied to CECL Without Formal Model Governance',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's CECL allowance process includes a qualitative macroeconomic overlay that adjusts model-generated ECL estimates by 10–25% to reflect management's view of forward economic conditions not captured in the baseline PD forecast; the overlay methodology is not documented under SR 11-7, has no independent validation, and is applied through a management discretion process with no defined quantitative basis or challenge record. OCC examiners and the FASB's ASU 2016-13 implementation guidance both address the governance of qualitative adjustments to CECL estimates — an undocumented overlay applied consistently in the same direction raises concerns about provision smoothing that can constitute a regulatory reporting integrity issue under SAB 99.`,
    keywords: ['CECL', 'ASU 2016-13', 'SR 11-7', 'macroeconomic overlay', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1007',
    name: 'AI ML Credit Scoring Model Deployed Without SR 11-7 Validation — Consent Order Finding',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's digital lending unit deploys an ML credit scoring model for small business loan origination that uses gradient boosting on alternative data inputs including cash flow variability, payment velocity, and supplier network density; the model is classified as a "decisioning rules engine" to avoid the SR 11-7 model validation cycle. The OCC's supervisory expectations under OCC 2011-12 and the SR 11-7 extension to ML models are explicit that any algorithm producing quantitative output used to inform a credit decision — regardless of the technique label — meets the model definition and requires independent validation, ongoing monitoring, and fair lending testing under ECOA Reg B; the undocumented deployment triggers a new Matters Requiring Attention in the consent order's model risk remediation milestone.`,
    keywords: ['SR 11-7', 'ML credit model', 'OCC 2011-12', 'ECOA', 'consent order'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },

  // ── Concentration Risk ─────────────────────────────────────────────────────
  {
    code: 'B1008',
    name: 'CRE Concentration Limit Breach Not Escalated to Board Within Required Timeframe',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's commercial real estate portfolio exceeds the OCC's supervisory guidance threshold of 300% of total capital for CRE concentration, but the breach is identified in an internal risk report and treated as a watch item rather than escalated to the board with a remediation plan within the timeframe required by the bank's own concentration risk policy. OCC guidance on commercial real estate concentration risk (OCC 2006-46 and the inter-agency guidance) requires banks operating above the supervisory threshold to demonstrate that board and management have the risk management capabilities to manage the elevated concentration; a documented escalation failure is a supervisory concern that compounds existing consent order obligations.`,
    keywords: ['CRE concentration', 'OCC guidance', 'Basel III', 'concentration risk', 'board escalation'],
    demoRelevant: true,
    subTopic: 'concentration-risk',
  },
  {
    code: 'B1009',
    name: 'Sector Concentration Limits Not Updated After Portfolio Growth in Technology Lending',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's credit risk policy defines concentration limits for each industry sector as a fixed percentage of total capital, calibrated when technology lending represented 4% of the commercial portfolio; three years of origination growth has pushed technology sector exposure to 18% of commercial commitments without a corresponding policy update or a formal concentration limit review. Basel III/IV concentration risk principles and OCC supervisory expectations require that concentration limits be reviewed at least annually and recalibrated when portfolio composition shifts materially; a static limit framework that lags portfolio growth creates concentration risk that is invisible to the risk governance process until the next periodic review.`,
    keywords: ['concentration risk', 'Basel III', 'OCC examination', 'credit policy', 'sector limit'],
    subTopic: 'concentration-risk',
  },
  {
    code: 'B1010',
    name: 'Large Exposure CRR2 Reporting Not Adapted for US DFAST Equivalent',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's large exposure monitoring framework was partially designed by a consultant using EU CRR2 large exposure standards — which cap single-borrower exposure at 25% of eligible capital — but the bank operates under OCC and Federal Reserve supervision where the equivalent Reg Y and OCC guidelines apply; the resulting monitoring system conflates CRR2 thresholds with domestic regulatory requirements, causing the risk operations team to report apparent breaches that are not actual violations and to miss genuine concentration thresholds under domestic rules. The disconnect between the EU CRR2 framework and the applicable US regulatory regime means that DFAST concentration stress inputs are drawn from a monitoring system calibrated to the wrong regulatory standard.`,
    keywords: ['CRR2', 'large exposure', 'Basel III', 'DFAST', 'concentration risk'],
    subTopic: 'concentration-risk',
  },
  {
    code: 'B1011',
    name: 'Geographic Concentration in Midwest Office CRE Not Stress-Tested Under Regional Scenario',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's DFAST severe adverse scenario applies national CRE price decline assumptions without a regional stress layer reflecting the Midwest office market's specific exposure to corporate relocation and remote work vacancy increases that are more severe than the national average. Interagency guidance on credit concentration risk and SR 11-7 stress testing requirements anticipate that banks with material geographic concentration should supplement the standard scenario with region-specific stress factors; the absence of a regional overlay causes the bank to underestimate tail loss for its Midwest office portfolio by an amount that the bank's internal real estate research team estimates at 15–20% of the segment's DFAST stressed loss.`,
    keywords: ['concentration risk', 'DFAST', 'commercial real estate', 'SR 11-7', 'stress testing'],
    demoRelevant: true,
    subTopic: 'concentration-risk',
  },
  {
    code: 'B1012',
    name: 'REAG Concentration Reporting Gap — Agriculture Portfolio Excluded From Aggregate',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital's risk reporting system calculates real estate and agriculture (REAG) concentration as a share of total capital for regulatory reporting purposes, but excludes agricultural land loans held in a trust-subsidiary from the REAG aggregate on the basis that they are trust assets rather than bank assets for Call Report purposes. OCC examiners reviewing the REAG concentration report find that the exclusion conflicts with the consolidated holding company reporting standard under Basel III/IV, resulting in a reported REAG concentration ratio that is 40 basis points below the actual consolidated exposure — a material misstatement in the concentration reporting framework.`,
    keywords: ['concentration risk', 'REAG', 'Basel III', 'OCC examination', 'Call Report'],
    subTopic: 'concentration-risk',
  },
  {
    code: 'B1013',
    name: 'Single-Borrower Limit Exception Rate Creep Without Board-Level Visibility',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's credit policy permits single-borrower exposure exceptions at credit committee level with officer approval, but exception tracking is maintained in a separate register that does not flow to the board's quarterly credit risk report. Over 18 months, single-borrower exceptions have grown from 3% to 11% of commercial commitments above the policy limit, with a cluster of exceptions concentrated in five large healthcare system borrowers; without board visibility, the concentration risk embedded in the exception population is not subject to the enhanced monitoring and escalation that OCC credit concentration guidance and Basel III/IV principles require for material policy exceptions.`,
    keywords: ['concentration risk', 'credit policy exception', 'Basel III', 'OCC guidance', 'board reporting'],
    demoRelevant: true,
    subTopic: 'concentration-risk',
  },

  // ── IFRS 9 / CECL ──────────────────────────────────────────────────────────
  {
    code: 'B1014',
    name: 'IFRS 9 Stage 2 Migration Trigger Miscalibrated — Significant Increase in Credit Risk Missed',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's CECL model uses IFRS 9 Stage 2 migration triggers adapted from the Basel III/IV PD migration framework, but the quantitative threshold for "significant increase in credit risk" was set at a PD increase of more than 50% relative to origination — a threshold calibrated on a stable rate environment that does not capture floating-rate borrowers whose DSCR has crossed below 1.0x without a corresponding PD increase in the model. FASB ASU 2016-13 and OCC supervisory guidance on CECL implementation require that Stage 2 migration triggers be calibrated to capture economic deterioration before it manifests in model-observable defaults; the miscalibrated trigger causes the bank to hold only a 12-month expected loss reserve for borrowers that industry peers are staging on a lifetime basis.`,
    keywords: ['CECL', 'ASU 2016-13', 'IFRS 9', 'Stage 2', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ifrs9-cecl',
  },
  {
    code: 'B1015',
    name: 'CECL Back-Testing Cadence Insufficient — Annual Frequency Misses Mid-Year Drift',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital performs CECL model back-testing annually, comparing the prior year's ECL estimates against realized net charge-offs on a once-per-year basis. The OCC's CECL implementation guidance and SR 11-7 outcome analysis requirements contemplate a more frequent back-testing cadence for institutions where portfolio composition or macro conditions are changing rapidly; an annual cadence means that deterioration in the commercial portfolio that develops over Q1–Q3 is not reflected in the back-testing record until the following year's annual review, leaving the MRM committee without evidence-based data to challenge whether the current-period CECL reserve is adequate.`,
    keywords: ['CECL', 'SR 11-7', 'back-testing', 'ASU 2016-13', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ifrs9-cecl',
  },
  {
    code: 'B1016',
    name: 'CECL Macroeconomic Scenarios Do Not Include a Severe Adverse Path for CRE Stress',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's CECL allowance estimation uses three macroeconomic scenarios — base, optimistic, and moderate downside — with probability weights of 50/30/20, but does not include a severe adverse scenario reflecting the possibility of a CRE price correction comparable to the 2008–2012 cycle. FASB ASU 2016-13 implementation guidance and OCC supervisory expectations for banks with material CRE concentration require scenario coverage that spans the tail of the loss distribution; the absence of a severe adverse path causes the probability-weighted CECL reserve to be systematically below the level that would be required if the bank's scenario set reflected its actual tail risk exposure.`,
    keywords: ['CECL', 'ASU 2016-13', 'commercial real estate', 'DFAST', 'macroeconomic scenario'],
    demoRelevant: true,
    subTopic: 'ifrs9-cecl',
  },
  {
    code: 'B1017',
    name: 'IFRS 9 Macroeconomic Overlay Governance — No Senior Sign-Off on Overlay Direction',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital applies a qualitative CECL overlay to reflect macroeconomic conditions not captured in the model's baseline forecast, but the overlay direction and magnitude are determined at staff level within the credit risk analytics team without a documented sign-off from a senior credit officer or the chief risk officer. FASB ASU 2016-13 and OCC CECL guidance require that qualitative adjustments to the quantitative model output be subject to governance that includes documented justification, senior sign-off, and an audit trail; the absence of senior governance over the overlay creates a provision manipulation risk that external auditors flag in their CECL model review, resulting in a management letter comment.`,
    keywords: ['CECL', 'ASU 2016-13', 'macroeconomic overlay', 'SR 11-7', 'model governance'],
    subTopic: 'ifrs9-cecl',
  },
  {
    code: 'B1018',
    name: 'CECL Vintage Analysis Excludes COVID-Era Originations — Back-Test Contaminated',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's CECL vintage analysis includes 2020–2021 originations without excluding the COVID-era cohort, whose default behavior was suppressed by government stimulus, forbearance programs, and CARES Act provisions rather than by genuine credit quality; the inclusion of these vintages understates through-the-cycle default rates in the back-testing sample. SR 11-7 conceptual soundness requirements and OCC CECL guidance require that training and validation datasets be representative of the operating environment for which the model will be used; a back-testing sample contaminated by abnormal cohorts produces a calibration that understates expected credit loss for the current origination environment.`,
    keywords: ['CECL', 'ASU 2016-13', 'SR 11-7', 'vintage analysis', 'model validation'],
    demoRelevant: true,
    subTopic: 'ifrs9-cecl',
  },
  {
    code: 'B1019',
    name: 'AI-Driven CECL Scenario Selection Without Human-in-Loop Governance Under ASU 2016-13',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an ML forecasting model to select and weight macroeconomic scenarios for its CECL allowance estimation; the model selects scenario weights automatically based on current macro indicators without a mandatory human review step before the weights are applied to the quarterly allowance calculation. FASB ASU 2016-13 implementation guidance and SR 11-7 require that qualitative judgment and management oversight be explicit components of the CECL estimation process; an automated scenario-selection system without a documented human-in-loop attestation step creates a model governance gap where the CECL provision could shift materially between quarters driven by AI model output rather than documented management judgment.`,
    keywords: ['CECL', 'ASU 2016-13', 'SR 11-7', 'ML forecasting model', 'human-in-loop'],
    demoRelevant: true,
    subTopic: 'ifrs9-cecl',
  },

  // ── Underwriting ───────────────────────────────────────────────────────────
  {
    code: 'B1020',
    name: 'Commercial Underwriting Policy Exception Rate Creep Exceeds Risk Appetite Threshold',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's commercial credit underwriting policy allows exceptions at credit officer level for deviations from standard DSCR, LTV, and guarantor requirements; over 24 months, the exception rate on new commercial originations has risen from 8% to 22% without a corresponding update to the credit risk appetite statement or a formal policy review. OCC supervisory guidance on credit underwriting standards requires that exception rates be monitored, reported to senior management and the board, and compared against peer benchmarks; an exception rate that has nearly tripled without triggering a policy review or risk appetite update is a credit culture warning sign that examiners interpret as evidence of standards erosion, particularly in a bank already operating under an MRM consent order.`,
    keywords: ['credit underwriting', 'OCC guidance', 'risk appetite', 'credit policy exception', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'underwriting',
  },
  {
    code: 'B1021',
    name: 'Covenant Lite Erosion in Leveraged Lending Portfolio Without Risk Appetite Update',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's leveraged lending portfolio has shifted toward covenant-lite structures — loans with maintenance covenants waived in favor of incurrence-only tests — over the most recent origination cycle, driven by competitive pressure from non-bank lenders; the risk appetite statement still references the prior covenant maintenance framework and has not been updated to reflect the increased monitoring burden and early warning gap created by covenant-lite structures. OCC and Federal Reserve leveraged lending guidance (OCC 2013-9) requires that banks maintain underwriting standards aligned with sound credit principles and that risk appetite explicitly address leveraged lending structures; a gap between documented risk appetite and actual portfolio composition is an examination finding.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'covenant lite', 'risk appetite', 'credit underwriting'],
    demoRelevant: true,
    subTopic: 'underwriting',
  },
  {
    code: 'B1022',
    name: 'Leveraged Lending Guidance Compliance Not Monitored Post-Origination',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital checks compliance with OCC/Federal Reserve leveraged lending guidance (OCC 2013-9) at origination — confirming that debt-to-EBITDA, interest coverage, and repayment capacity meet the guidance thresholds — but does not perform post-origination monitoring to ensure that acquired businesses maintain compliance as their financial performance evolves. Leveraged lending guidance anticipates that sponsored transactions are subject to ongoing surveillance; when a portfolio company's EBITDA deteriorates due to supply chain disruption and the debt-to-EBITDA ratio crosses the guidance threshold, First Capital has no alert mechanism, and the bank's only awareness comes when the sponsor's reporting obligation under the credit agreement triggers a notice 90 days after the threshold breach.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'post-origination monitoring', 'EWI', 'commercial credit'],
    subTopic: 'underwriting',
  },
  {
    code: 'B1023',
    name: 'CRE Underwriting Appraisal Lag — Market Value Not Reflecting Current NOI Compression',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital relies on appraisals commissioned at origination for ongoing LTV calculations on its CRE portfolio; for loans originated in 2021–2022, the appraisal values reflect peak NOI assumptions that have since been eroded by rising operating costs, elevated vacancy in office and retail segments, and cap rate expansion. OCC guidance on CRE risk management requires banks to maintain current collateral valuations for material CRE exposures and to update appraisals when market conditions indicate that values may have declined significantly; a portfolio where 30% of CRE loans have appraisals more than 24 months old — in a period of material market dislocation — represents a collateral valuation gap that inflates reported LTV metrics and understates true credit risk.`,
    keywords: ['CRE underwriting', 'appraisal', 'LTV', 'OCC guidance', 'concentration risk'],
    demoRelevant: true,
    subTopic: 'underwriting',
  },
  {
    code: 'B1024',
    name: 'LLM Credit Memo Drafting Without Human-in-Loop Attestation — SR 11-7 Exposure',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's commercial banking relationship managers use an LLM-based credit memo drafting tool that ingests borrower financial data and generates a draft credit memo including financial analysis, risk identification, and recommendation language; credit officers submit memos with minimal modification without an explicit attestation that they have independently reviewed the underlying financials. SR 11-7 and OCC 2011-12 model governance requirements apply to tools that generate quantitative or qualitative outputs used in credit decisions; when the LLM memo tool is used without a documented human-in-loop review, the credit memo becomes an unvalidated model output, and ECOA Reg B adverse action exposure increases if the AI-generated risk narrative is used to support a decline decision without evidence of independent human review.`,
    keywords: ['SR 11-7', 'LLM credit memo', 'OCC 2011-12', 'ECOA', 'human-in-loop'],
    demoRelevant: true,
    subTopic: 'underwriting',
  },
  {
    code: 'B1025',
    name: 'Construction Loan Interest Reserve Model Miscalibrated for Elevated Rate Environment',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital's construction loan underwriting model calculates the required interest reserve based on a projected draw schedule and a modeled construction period interest rate that was set at 5.5% during origination in 2022; with floating-rate construction debt now accruing at 7.5–8.5%, the interest reserves are depleting 18–24 months earlier than modeled, forcing borrowers to either inject additional equity or miss reserve replenishment, which triggers a watchlist migration under the bank's early warning indicator framework. OCC guidance on construction and development lending and Basel III concentration risk principles require that underwriting models reflect current rate environments and include sensitivity testing for rate scenarios; the undercalibrated reserve model is compounding CRE concentration risk.`,
    keywords: ['construction lending', 'interest reserve', 'Basel III', 'OCC guidance', 'EWI'],
    demoRelevant: true,
    subTopic: 'underwriting',
  },
  {
    code: 'B1026',
    name: 'Automated Covenant Monitoring AI Without Legal Review of Covenant Definition',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an automated covenant monitoring AI that ingests borrower financial statement data and compares it against covenant thresholds stored in the loan origination system; the AI system identifies apparent covenant breaches without a step where the bank's legal team confirms that the financial covenant definition in the credit agreement matches the metric as calculated by the monitoring system. The covenant monitoring AI generates 15–20 breach alerts per quarter that, on manual review by the credit team, resolve to definitional mismatches — EBITDA addbacks, acquisition accounting adjustments, and permitted basket calculations — that the AI's covenant parser cannot replicate, creating false positive alert fatigue that causes the credit team to reduce manual follow-up, increasing the risk that genuine breaches are missed.`,
    keywords: ['covenant monitoring AI', 'SR 11-7', 'leveraged lending', 'OCC 2013-9', 'false positive'],
    demoRelevant: true,
    subTopic: 'underwriting',
  },

  // ── Portfolio Monitoring ───────────────────────────────────────────────────
  {
    code: 'B1027',
    name: 'Early Warning Indicator Data Staleness — EWI Dashboard Refreshed Monthly Not Weekly',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's EWI framework for commercial credit monitoring aggregates internal indicators — payment performance, line utilization, overdraft frequency — and external signals — sector equity indices, credit spread widening, news sentiment — but refreshes the dashboard monthly, creating a 3–4 week lag between a borrower's financial deterioration and the bank's risk detection. OCC supervisory guidance on credit risk management and portfolio monitoring standards for commercial banks expect EWI systems to provide timely signals that allow proactive borrower outreach before formal default events; a monthly refresh cadence for an EWI designed to detect early deterioration defeats the purpose of the early warning function.`,
    keywords: ['EWI', 'portfolio monitoring', 'OCC guidance', 'commercial credit', 'watchlist'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1028',
    name: 'Watchlist Migration Delay — Borrowers in EWI Alert Status Not Migrated for 90+ Days',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's EWI system flags 35 commercial borrowers as showing two or more early warning signals, but the credit monitoring team's quarterly watchlist review cycle means that borrowers remain in EWI alert status for an average of 87 days before being formally placed on the watchlist and assigned to a workout relationship manager. OCC examination guidance on credit risk management expects banks to have defined timelines for watchlist migration after EWI triggers are met and to document the factors considered in the migration decision; an 87-day average lag — during which the borrower continues to operate under standard monitoring without enhanced oversight — is cited by OCC examiners as a credit risk process deficiency.`,
    keywords: ['watchlist', 'EWI', 'OCC guidance', 'portfolio monitoring', 'credit risk'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1029',
    name: 'Collateral Valuation Lag on CRE Portfolio — Desktop Appraisals Not Triggered by Market Decline',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's CRE portfolio monitoring process requires updated appraisals when a loan is placed on the watchlist or when a renewal is processed, but does not include a market-condition trigger that would initiate a desktop appraisal when sector-specific price indices decline beyond a defined threshold. For the bank's downtown office CRE portfolio — which has experienced a 40% price decline in the MSCI Office Capital Value Index since origination — the absence of a market-condition trigger means that the bank continues to report LTVs of 55–65% against collateral values that the market indicates are now 70–90% of the outstanding loan balance, materially understating the true credit risk and the CECL reserve requirement for this segment.`,
    keywords: ['CRE concentration', 'collateral valuation', 'appraisal', 'CECL', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1030',
    name: 'AI-Powered EWI System False Negative Rate Not Measured — Alert Suppression Undetected',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital deploys an AI-powered EWI system that uses ML to triage incoming EWI signals and suppress alerts classified as low-probability deterioration events; the system is measured exclusively on false-positive reduction, and no false-negative rate monitoring exists to detect cases where genuine deterioration is suppressed. SR 11-7 model monitoring requirements apply to AI models that filter or suppress information used in credit risk decisions; when a cluster of leveraged loan borrowers in the technology sector reaches formal default having generated no EWI alerts in the prior 12 months, post-mortem analysis reveals that the AI's alert suppression logic was systematically discounting sector-level signals that preceded individual borrower deterioration — a monitoring failure that SR 11-7 back-testing requirements are designed to prevent.`,
    keywords: ['EWI', 'SR 11-7', 'AI early warning', 'model monitoring', 'false negative'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1031',
    name: 'Annual Review Cycle Too Infrequent for Watchlist Borrowers With Deteriorating Financials',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's credit monitoring policy requires annual financial statement reviews for commercial borrowers with outstanding balances above $1M, but does not differentiate review frequency for borrowers on the watchlist with deteriorating DSCR or those in Stage 2 under the CECL migration framework. OCC examination guidance on commercial credit risk management expects that watchlisted borrowers receive enhanced monitoring — typically semi-annual or quarterly financial statement reviews — to allow timely loss identification and CECL staging; applying an annual review cycle uniformly to both performing and watchlisted borrowers understates the effective monitoring burden and delays loss recognition.`,
    keywords: ['watchlist', 'portfolio monitoring', 'OCC guidance', 'CECL', 'commercial credit'],
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1032',
    name: 'Portfolio Stress Test Not Run Between Annual DFAST Cycles — Intra-Year Shock Undetected',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital runs its commercial portfolio stress test as part of the annual DFAST cycle, but does not perform intra-year stress tests when material macro or sector-specific shocks occur — such as the March 2023 regional bank stress, the Q3 2023 commercial real estate repricing, or the Q4 2024 leveraged loan spread widening. Basel III/IV Pillar 2 supervisory review expectations and OCC credit risk management guidance require that banks have the capability to stress their credit portfolios on an ad-hoc basis when conditions warrant; relying exclusively on the annual DFAST cycle means that the board and senior management may be unaware of a material intra-year deterioration in credit risk exposure until the next annual stress test is filed.`,
    keywords: ['DFAST', 'Basel III', 'portfolio stress test', 'concentration risk', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1033',
    name: 'Loan Review Function Backlog Means New Commercial Originations Not Reviewed Within 12 Months',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's independent loan review function is responsible for reviewing all commercial loan relationships above $500K within 12 months of origination, but the function is understaffed relative to origination volume from the prior two years; the current review backlog means that 28% of commercial originations from the past 18 months have not yet received an independent loan review. OCC examination guidance on credit risk management and loan review requires timely independent assessment of new credits to identify underwriting deficiencies before they compound; the 28% backlog creates a systematic blind spot where underwriting policy exceptions and emerging credit quality issues go undetected until the relationship moves to watchlist status.`,
    keywords: ['loan review', 'OCC guidance', 'credit underwriting', 'commercial credit', 'independent review'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },

  // ── AI Credit Patterns ─────────────────────────────────────────────────────
  {
    code: 'B1034',
    name: 'ML Credit Scoring Without SR 11-7 MRM Compliance — Digital Origination Platform',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      `First Capital's digital origination platform for consumer and small business loans uses an ML credit scoring model developed by a fintech partner; the model uses gradient boosting on 120 alternative data variables including bank account transaction patterns, subscription service data, and social network signals not found in traditional bureau files. The model is not registered in First Capital's SR 11-7 model inventory, has not undergone independent validation by the bank's IVU, and lacks ongoing performance monitoring against realized default rates; OCC examiners reviewing the digital origination platform find a material SR 11-7 compliance gap that constitutes a breach of the bank's MRM consent order milestone requiring all credit decision models to be in the validated model inventory by Q2 2025.`,
    keywords: ['SR 11-7', 'ML credit scoring', 'OCC 2011-12', 'consent order', 'digital origination'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1035',
    name: 'AI Credit Scoring Explainability Gap Violates ECOA Reg B Adverse Action Requirements',
    officeCategory: 'front_office',
    failureRatePct: 80,
    description:
      `First Capital's AI credit scoring model for consumer lending uses a deep neural network whose decision logic cannot be directly interpreted to produce the specific adverse action reasons required by ECOA Regulation B; the bank's compliance team generates adverse action notices using SHAP-derived feature importance values mapped to approximate reason codes, but the CFPB's 2022 AI fairness circular and subsequent OCC supervisory guidance make clear that adverse action reasons must be specific, accurate, and tied to the actual credit decision, not an approximation derived from a post-hoc explainability method. When a CFPB examination reviews the bank's adverse action practices, the surrogate-derived reason codes do not satisfy the specificity requirement, creating a UDAP/ECOA violation that triggers a supervisory referral.`,
    keywords: ['ECOA', 'Reg B', 'SR 11-7', 'AI credit scoring', 'adverse action'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1036',
    name: 'LLM Credit Memo AI Generates Unsupported Financial Projections — No Audit Trail',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's LLM-based credit memo drafting tool generates financial projection narratives that include extrapolated revenue growth rates and EBITDA margin assumptions not explicitly stated in the borrower's submitted financial data; relationship managers who have not independently reviewed the underlying financials submit credit memos with AI-generated projections that the credit committee treats as analyst-verified. When a $25M commercial loan defaults 14 months after origination and the bank's internal audit reviews the credit file, the AI-generated projections in the approval memo cannot be traced to supporting documentation — creating a documentation integrity issue under OCC 2011-12 credit file standards and a potential misrepresentation risk if the credit decision was material to the bank's DFAST capital adequacy reporting.`,
    keywords: ['LLM credit memo', 'SR 11-7', 'OCC 2011-12', 'credit documentation', 'human-in-loop'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1037',
    name: 'Automated Underwriting System Proxy Discrimination Not Tested Under ECOA Reg B',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital's automated underwriting system uses geographic data — ZIP code-level demographic composition, median household income, and neighborhood stability indices — as inputs to the credit scoring model for home equity and small business loans. The CFPB and OCC expect that any automated underwriting system using geographic or socioeconomic proxies be subjected to regular disparate impact testing under ECOA Reg B and the Fair Housing Act; First Capital's fair lending program tests the output approval rates by race and national origin but does not test whether the geographic input variables act as proxies for protected characteristics, leaving the bank exposed to a CFPB supervisory finding on discriminatory model design.`,
    keywords: ['ECOA', 'Reg B', 'SR 11-7', 'automated underwriting', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1038',
    name: 'AI Covenant Monitoring System Not Registered as SR 11-7 Model — Alert Suppression Risk',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's automated covenant monitoring system uses NLP to parse borrower financial statements and compare covenant compliance metrics against credit agreement requirements; the system is categorized as an "operational workflow tool" by the technology team and is not in the SR 11-7 model inventory. OCC 2011-12 and SR 11-7 define a model broadly as any tool that applies statistical, quantitative, or computational methods to produce outputs used in risk management decisions — a NLP-based system that determines whether a borrower is in compliance or breach of a financial covenant is a model within this definition, and its classification outside the model inventory means there is no validation of the system's accuracy, no monitoring of false negatives, and no governance over methodology changes that could cause systematic misclassification of covenant status.`,
    keywords: ['SR 11-7', 'OCC 2011-12', 'covenant monitoring AI', 'model inventory', 'NLP'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1039',
    name: 'AI Credit Risk Rating Model Back-Testing Not Aligned With OCC Examination Standards',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an AI-assisted internal credit risk rating model that combines traditional financial ratio analysis with an ML component trained on peer default data to generate internal obligor risk ratings for the commercial portfolio; the model's back-testing framework validates the rank-ordering of ratings but does not test absolute rating accuracy — i.e., whether the default rates for each rating grade match the rating definition's implied PD. OCC examiners reviewing the bank's internal rating system under OCC 2011-12 expect that back-testing demonstrates not only rank-ordering but also calibration accuracy across the rating scale; a model that rank-orders well but assigns systematically optimistic ratings inflates regulatory capital adequacy and understates CECL reserves for the watchlist and substandard segments.`,
    keywords: ['SR 11-7', 'AI credit rating', 'OCC 2011-12', 'back-testing', 'CECL'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1040',
    name: 'GenAI Borrower Risk Narrative Not Validated — Hallucinated Financial Data in Credit File',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's commercial banking platform integrates a GenAI tool that generates borrower risk narratives by ingesting financial statement PDFs and producing a structured credit analysis; in multiple instances documented by the bank's quality control team, the GenAI tool hallucinated financial metrics — reporting EBITDA margins or debt levels that do not appear in the submitted financial statements — that were incorporated into credit memos without detection. SR 11-7 and OCC 2011-12 credit documentation standards require that credit file information be accurate and traceable to source documents; hallucinated data in credit memos creates both a documentation integrity issue and a potential UDAP/ECOA exposure if the error influenced a credit decision, while the absence of a human attestation step means the error propagation risk is systemic rather than isolated.`,
    keywords: ['GenAI', 'SR 11-7', 'OCC 2011-12', 'credit documentation', 'hallucination risk'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1041',
    name: 'LLM-Assisted Syndicated Loan Structuring Without Legal Review Attestation',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital uses an LLM-powered structuring tool to draft term sheets and propose covenant packages for syndicated commercial loans, generating suggested covenant definitions and cure provisions drawn from a training corpus of market precedent transactions. Relationship managers present LLM-generated term sheets to borrowers without an attestation from the bank's legal team confirming that the AI-generated covenant language is consistent with First Capital's credit policy and applicable enforceability standards; when a borrower's counsel challenges a covenant definition as unenforceable under the applicable governing law, the bank's legal team discovers the LLM-generated clause was drawn from a transaction governed by a different jurisdiction with incompatible default provisions, creating a credit documentation deficiency that requires a costly amendment.`,
    keywords: ['LLM structuring tool', 'SR 11-7', 'leveraged lending', 'OCC 2013-9', 'legal review'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1042',
    name: 'AI Early Warning System Trained on National Data — Miscalibrated for Regional Borrower Base',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital licenses an AI-powered early warning system from a fintech vendor that trained its alert model on a national bank portfolio dataset; the model's warning signals are calibrated to national average default and delinquency patterns, which do not reflect the cyclicality and sector composition of First Capital's Midwest commercial borrower base where agricultural and industrial cyclicality creates different default timing and severity patterns than the national training sample. SR 11-7 and OCC credit monitoring guidance require that AI models used in risk management be validated on the bank's own portfolio to confirm that the model's performance on national data translates to the bank's specific customer mix; the absence of population-specific validation means the bank's EWI system generates alerts that are systematically miscalibrated for its regional credit risk profile.`,
    keywords: ['SR 11-7', 'AI early warning', 'EWI', 'model validation', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1043',
    name: 'Alternative Data AI Credit Score Not Validated for Fair Lending Disparate Impact',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital acquires an AI credit scoring supplement from a data vendor that uses alternative data — cash flow patterns, payment behavior, and digital footprint signals — to generate a creditworthiness score for thin-file applicants who cannot qualify under traditional bureau scores; the supplemental score is used in underwriting decisions for consumer and small business lending without a disparate impact analysis on the alternative data variables. ECOA Reg B and CFPB supervisory guidance require that any credit scoring tool — regardless of whether it uses traditional or alternative data — be tested for discriminatory impact on protected classes; an AI credit score that uses geographic and behavioral signals correlated with protected characteristics without a validated disparate impact analysis creates fair lending examination risk that the bank's current compliance program has not assessed.`,
    keywords: ['ECOA', 'Reg B', 'AI credit scoring', 'disparate impact', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },
  {
    code: 'B1044',
    name: 'AI Automated Underwriting Override Logic Not Auditable — Reg B Compliance Risk',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's automated underwriting platform includes an AI override module that can approve applications declined by the primary scorecard and decline applications approved by the primary scorecard based on a secondary ML model trained on relationship manager judgment data; the override model's decision logic is embedded in a proprietary vendor platform that does not expose the specific factors driving each override decision. ECOA Reg B and the OCC's supervisory expectations for fair lending require that all credit decisions — including automated overrides — be explainable with specific, accurate adverse action reasons and that the override process be auditable for disparate treatment; a black-box override module that cannot produce auditable decision rationales creates a systematic Reg B compliance gap in the bank's automated underwriting process.`,
    keywords: ['ECOA', 'Reg B', 'automated underwriting', 'SR 11-7', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit',
  },

  // ── Additional Credit Models ───────────────────────────────────────────────
  {
    code: 'B1045',
    name: 'PD Model Through-the-Cycle Calibration Applied to Point-in-Time CECL Requirement',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial PD model uses a through-the-cycle calibration designed to be stable across economic cycles for Basel III/IV capital purposes; this TTC PD surface is also applied directly in the CECL allowance calculation without conversion to a point-in-time estimate, violating the ASU 2016-13 requirement that ECL estimates reflect current conditions and reasonable and supportable forecasts. The OCC's CECL examination guidance explicitly addresses the TTC-PIT mismatch, noting that TTC PDs systematically underestimate expected credit loss at the peak of a credit cycle and overestimate it at the trough; applying TTC PDs to a CECL calculation that coincides with a credit cycle peak results in a provision that is materially understated relative to ASU 2016-13 requirements.`,
    keywords: ['PD model', 'CECL', 'ASU 2016-13', 'Basel III', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1046',
    name: 'Commercial Loan Pricing Model Risk Premium Not Updated After Credit Spread Widening',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's commercial loan pricing model calculates the required loan spread over the risk-free rate using a credit risk premium derived from the bank's historical portfolio returns, calibrated in 2021 when credit spreads were at historical tights; the risk premium has not been updated to reflect 2022–2024 credit spread widening across the leveraged lending and middle-market credit markets. OCC supervisory guidance on loan pricing and profitability analysis expects that pricing models reflect current market credit risk premiums; an outdated risk premium causes the bank to underprice new originations relative to the current risk environment, accepting negative risk-adjusted returns that do not compensate for the PD and LGD risk in the portfolio.`,
    keywords: ['loan pricing', 'credit risk premium', 'SR 11-7', 'OCC guidance', 'leveraged lending'],
    subTopic: 'credit-models',
  },
  {
    code: 'B1047',
    name: 'Credit Risk Model Suite Not Revalidated After Core System Data Migration',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital completes a core loan origination system migration that alters the data schema for key credit risk model inputs — exposure at default, drawn vs. undrawn balance, collateral type classification, and guarantor structure — without triggering a revalidation of the credit risk models that consume these inputs. SR 11-7 requires that material data input changes be treated as model changes requiring validation reassessment; the OCC's model risk examination finds that 14 credit models continued to operate on post-migration data that had not been validated against the pre-migration input distributions, creating a systemic model data quality gap that could not be assessed without a comprehensive retrospective validation exercise.`,
    keywords: ['SR 11-7', 'model validation', 'data migration', 'OCC 2011-12', 'CECL'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1048',
    name: 'Retail Credit Model Transferred to Commercial Lending Without Revalidation',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's model risk team re-purposes a retail consumer PD model — originally developed and validated on personal loan and credit card data — for use in evaluating small business creditworthiness on the basis that behavioral similarities reduce model development costs. SR 11-7 requires that the appropriateness of a model for its intended use be established through validation against the target population; the consumer model's training data does not represent the cash flow volatility, seasonality, and sector-specific risk drivers of small business borrowers, and the absence of a population-specific validation leads to systematic miscalibration of PD estimates for the small business segment that the MRM consent order's validation remediation milestone is designed to address.`,
    keywords: ['SR 11-7', 'PD model', 'model validation', 'OCC 2011-12', 'small business credit'],
    demoRelevant: true,
    subTopic: 'credit-models',
  },
  {
    code: 'B1049',
    name: 'Probability of Default Model Not Sensitivity-Tested for Key Macro Variable Assumptions',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital's commercial PD model incorporates macroeconomic variables — unemployment rate, GDP growth, and credit spread indices — as inputs to the PD forecast, but the independent validation unit's conceptual soundness review does not include sensitivity analysis on these macro inputs to quantify how PD estimates change across plausible macro paths. SR 11-7 requires sensitivity analysis for models where inputs have high uncertainty, which applies directly to macro variable inputs in credit risk models; without a documented sensitivity surface, the MRM committee cannot determine whether the model's PD output is stable under a range of macro assumptions or highly sensitive to a single variable, leaving the bank without a tool to challenge the model output under stress scenarios.`,
    keywords: ['PD model', 'SR 11-7', 'sensitivity analysis', 'model validation', 'CECL'],
    subTopic: 'credit-models',
  },

  // ── Additional Concentration Risk ─────────────────────────────────────────
  {
    code: 'B1050',
    name: 'Shared National Credit Program — Participation Exposure Not Included in Concentration Metrics',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital participates in Shared National Credit (SNC) transactions as a participant lender, holding exposure in 30 syndicated leveraged loans where it is not the lead agent; these SNC participations are tracked in the syndications system and excluded from the single-borrower concentration limit calculations in the commercial credit concentration monitoring system on the basis that they are participations rather than direct credits. OCC and interagency SNC examination guidance and Basel III/IV large exposure standards require that participation exposures be included in the obligor concentration calculation on a consolidated basis; excluding SNC participations causes the bank to understate single-name concentration for several leveraged borrowers where the participation exposure, combined with direct credit, would trigger an exception.`,
    keywords: ['concentration risk', 'Shared National Credit', 'Basel III', 'OCC guidance', 'leveraged lending'],
    subTopic: 'concentration-risk',
  },
  {
    code: 'B1051',
    name: 'CRE Concentration Stress Test Uses Same Scenario as DFAST — No Stand-Alone CRE Scenario',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's CRE concentration stress test uses the Federal Reserve's DFAST severe adverse macro scenario as its stress path, treating CRE price assumptions embedded in the macro scenario as sufficient stress for the concentration monitoring framework. OCC interagency guidance on CRE concentrations recommends that banks with material CRE exposures run a stand-alone CRE stress scenario calibrated to the worst historical CRE price correction rather than relying exclusively on the macro scenario; for First Capital's downtown office portfolio, the DFAST macro CRE stress is 20–25% below the bank's own historical CRE stress scenario output, meaning the concentration monitoring framework systematically underestimates CRE tail risk.`,
    keywords: ['CRE concentration', 'DFAST', 'stress testing', 'OCC guidance', 'Basel III'],
    demoRelevant: true,
    subTopic: 'concentration-risk',
  },

  // ── Additional IFRS 9 / CECL ───────────────────────────────────────────────
  {
    code: 'B1052',
    name: 'CECL Model Governance Committee Has No Credit Officer Representation',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's CECL model governance committee is composed exclusively of finance, accounting, and model risk personnel, with no representation from senior credit officers who have direct knowledge of portfolio quality trends, underwriting standard changes, and workout experience. FASB ASU 2016-13 implementation guidance and OCC CECL supervisory expectations require that the governance process for CECL estimation integrate credit risk expertise alongside quantitative and accounting expertise; a governance structure that excludes senior credit judgment creates a risk that the quantitative model outputs are accepted without challenge from the practitioners best positioned to identify when model assumptions diverge from observed credit conditions.`,
    keywords: ['CECL', 'ASU 2016-13', 'model governance', 'SR 11-7', 'OCC examination'],
    subTopic: 'ifrs9-cecl',
  },
  {
    code: 'B1053',
    name: 'CECL Reasonable and Supportable Forecast Horizon Not Documented or Peer-Benchmarked',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital applies a 12-month reasonable and supportable forecast horizon in its CECL model without documenting the basis for selecting 12 months over alternative horizons and without benchmarking the horizon against peer institutions or OCC examination guidance. FASB ASU 2016-13 allows institutions to select a forecast horizon based on the reliability of available forecasts and the nature of the portfolio; OCC examiners reviewing CECL implementation practices expect that the horizon selection be supported by documented analysis of forecast reliability, reversion speed, and portfolio seasoning patterns — an undocumented horizon that may be shorter than what peers with similar portfolio characteristics apply raises allowance adequacy questions.`,
    keywords: ['CECL', 'ASU 2016-13', 'forecast horizon', 'OCC examination', 'model documentation'],
    demoRelevant: true,
    subTopic: 'ifrs9-cecl',
  },

  // ── Additional Underwriting ────────────────────────────────────────────────
  {
    code: 'B1054',
    name: 'Leveraged Lending Hold Level Exceeds Board-Approved Limit Without Documented Exception',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's credit policy establishes a maximum hold level of $35M per leveraged loan transaction to limit concentration and alignment risk; in three recent transactions, the bank retained final hold positions of $45–55M after syndication failed to achieve the target distribution, without convening the credit committee to approve the overhold as a formal policy exception. OCC leveraged lending guidance (OCC 2013-9) and the bank's own credit policy require board-level visibility into leveraged lending concentration and explicit exception approval when hold levels exceed policy limits; undocumented overhold positions create a trail of unrecorded policy exceptions that OCC examiners identify by comparing loan system hold balances against the credit approval memos, citing the discrepancy as a credit governance deficiency.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'credit policy exception', 'concentration risk', 'board approval'],
    demoRelevant: true,
    subTopic: 'underwriting',
  },
  {
    code: 'B1055',
    name: 'Global Cash Flow Analysis Omitted for Commercial Guarantors — OCC Credit Standard Gap',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial underwriting policy requires global cash flow analysis — assessing all of a guarantor's business entities and personal financial obligations — for guarantee structures securing commercial real estate loans, but the analysis is routinely omitted for guarantors classified as "sophisticated investors" with prior banking relationships. OCC examination guidance on commercial credit underwriting standards and credit policy exception documentation requires that global cash flow analysis be completed for all guarantor-supported credits regardless of guarantor familiarity; when three construction loans supported by the same guarantor default within six months, global cash flow analysis reveals the guarantor was already committed to $95M in other guarantees that the individual loan files did not reflect.`,
    keywords: ['credit underwriting', 'OCC guidance', 'global cash flow', 'commercial real estate', 'guarantor'],
    subTopic: 'underwriting',
  },

  // ── Additional Portfolio Monitoring ───────────────────────────────────────
  {
    code: 'B1056',
    name: 'Classified Asset Ratio Deterioration Not Linked to DFAST Scenario Update',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's classified asset ratio has risen from 1.2% to 2.8% of total loans over 18 months, driven by watchlist migration in the commercial real estate and leveraged lending segments; however, the DFAST credit loss model has not been updated to reflect the deterioration in the starting-point portfolio quality. SR 11-7 model monitoring requirements and OCC DFAST guidance require that stress test models be calibrated to the bank's current portfolio composition; running DFAST on a model parameterized to a healthier starting portfolio systematically understates stressed capital consumption, giving both management and the OCC an inaccurate picture of the bank's capital adequacy under the adverse scenario.`,
    keywords: ['DFAST', 'classified assets', 'SR 11-7', 'portfolio monitoring', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1057',
    name: 'Automated Credit Monitoring AI Alert Volume Too High — Team Reduces Threshold to Manage Workload',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's automated credit monitoring AI generates 200–300 alerts per week across the commercial portfolio by flagging any borrower showing one or more EWI triggers; the credit monitoring team, unable to process the alert volume with existing headcount, informally raises the alert threshold by changing the sensitivity setting in the vendor dashboard — reducing alerts to 40–60 per week — without documenting the change as a model parameter change subject to SR 11-7 governance. SR 11-7 requires that model parameter changes be documented and approved; the undocumented threshold increase is a material change to the bank's credit monitoring model that eliminates 75–80% of the early warning alerts, creating a systematic blind spot in the portfolio monitoring process that the bank's internal audit discovers only when reviewing the AI platform audit log.`,
    keywords: ['SR 11-7', 'AI credit monitoring', 'EWI', 'model governance', 'consent order'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1058',
    name: 'CRE Workout Recovery Model Not Updated After Asset Manager Market Exit',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's LGD model for CRE workout recovery assumes that distressed assets can be sold to a pool of institutional real estate asset managers at prices reflecting historical liquidation rates; since 2023, several large asset managers who historically absorbed distressed office and retail CRE assets have significantly reduced their distressed acquisition mandates, reducing the depth of the buyer pool. The LGD model has not been updated to reflect the thinner buyer market, producing recovery rate assumptions that are 15–20 percentage points above current observable transaction prices for office CRE workouts; as a result, the CECL-specific charge-off reserve for CRE watchlist assets is understated against realized losses, compounding the provision adequacy concerns under ASU 2016-13 that OCC examiners have already flagged.`,
    keywords: ['LGD', 'CECL', 'ASU 2016-13', 'CRE concentration', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
  {
    code: 'B1059',
    name: 'Credit Risk Dashboard KPIs Not Aligned With OCC Examination Metrics — Reporting Blind Spot',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's executive credit risk dashboard tracks internally defined KPIs — total criticized assets, net charge-off rate, and non-accrual volume — that are calculated using the bank's own segmentation methodology rather than the OCC's standardized credit quality rating definitions, creating a gap where the board and senior management are monitoring metrics that do not directly correspond to what OCC examiners will assess during the examination. OCC examiners calculate classified-to-capital ratios, special mention migration rates, and past-due concentration metrics using their own definitions; when management presents the internal dashboard to demonstrate credit risk management effectiveness, the OCC examiner team calculates materially different metrics from the same data, resulting in a credibility gap that complicates the consent order remediation narrative.`,
    keywords: ['OCC examination', 'credit risk reporting', 'classified assets', 'consent order', 'DFAST'],
    demoRelevant: true,
    subTopic: 'portfolio-monitoring',
  },
];
