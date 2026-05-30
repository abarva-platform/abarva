// seed-banking-dom04-credit-risk-part3.ts
// Banking genome patterns — Credit Risk Management
// Code range: B1120–B1179  (60 patterns)
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

export const BANKING_DOM04_CREDIT_RISK_PART3_PATTERNS: PatternSeed[] = [

  // ── Credit Concentration (B1120–B1129) ──────────────────────────────────────

  {
    code: 'B1120',
    name: 'Single-Name Concentration Limit Breach Unreported to Board Risk Committee',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's credit policy sets a single-obligor concentration limit at 10% of Tier 1 capital, but the credit risk system does not aggregate affiliated-entity exposures under a common ownership structure, allowing a private equity-backed borrower group to collectively represent 14% of Tier 1 capital before the breach is identified in a manual quarterly review. OCC concentration risk guidance and SR 11-7 model risk requirements both mandate that affiliated-entity aggregation be automated in the concentration monitoring system, and the absence of parent-company linkage logic in the loan origination system means the board risk committee receives concentration reports that systematically understate single-name exposure by excluding subsidiary and co-borrower balances from the obligor-level roll-up.`,
    keywords: ['credit concentration', 'OCC concentration guidance', 'Tier 1 capital', 'single-name exposure', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1121',
    name: 'Industry Concentration Limit for Commercial Real Estate Not Differentiated by Sub-Sector',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's credit risk appetite statement establishes a single CRE concentration limit of 300% of risk-based capital but does not set sub-sector limits for office, multifamily, retail, and industrial, so the concentration monitoring system treats a shift from diversified CRE into highly correlated office assets as a non-event that does not breach any limit. Interagency CRE concentration guidance (OCC 2006-46) and OCC examination findings from 2022–2024 consistently cite the absence of sub-sector concentration limits as a deficiency in banks with CRE concentrations above the supervisory threshold; without granular limits, the board risk committee cannot observe the bank's progressive concentration in distressed office assets until impairment losses materialize.`,
    keywords: ['credit concentration', 'CRE concentration', 'OCC 2006-46', 'sub-sector limits', 'Basel III'],
    demoRelevant: true,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1122',
    name: 'Geographic Concentration in Single MSA Exceeds Peer Median Without Mitigant Documentation',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's C&I and CRE loan portfolios are 71% concentrated in a single metropolitan statistical area, compared to a peer median of 48%, creating correlated credit risk exposure to a regional economic downturn that the bank's capital planning does not explicitly model as an identifiable concentration risk scenario. OCC supervisory guidance on geographic concentration risk requires that banks with above-peer MSA concentration document specific mitigants — portfolio diversification plans, enhanced stress testing, capital buffers tied to geographic correlation — and report concentration metrics to the board with peer context; the absence of a documented mitigant strategy means OCC examiners treat the geographic concentration as an unmanaged risk and include it as an examination finding in the Management component of the CAMELS rating.`,
    keywords: ['credit concentration', 'geographic concentration', 'MSA', 'OCC examination', 'CAMELS'],
    demoRelevant: true,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1123',
    name: 'Counterparty Concentration in Derivatives Portfolio Not Included in Credit Risk Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's credit risk concentration reports aggregate on-balance-sheet loan exposures but do not include derivatives counterparty credit risk (CCR) exposures from interest rate swap and foreign exchange contracts, understating gross single-name exposure for six financial institution counterparties by an average of $8M per counterparty when current replacement value is included. BCBS 239 risk data aggregation principles and OCC counterparty credit risk guidance require that CCR exposures be included in enterprise-wide single-name concentration reporting; the separate management of CCR within the treasury function, disconnected from the credit risk database, creates a systematic gap in the concentration monitoring framework that is invisible to the board risk committee.`,
    keywords: ['credit concentration', 'counterparty credit risk', 'BCBS 239', 'derivatives', 'OCC guidance'],
    demoRelevant: false,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1124',
    name: 'Sectoral Concentration Limit Breach in Technology Lending Discovered Only at Annual Review',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's technology sector C&I lending has grown to 18% of the total commercial loan portfolio, exceeding the 15% sector concentration limit in the credit risk policy, but the concentration monitoring system checks policy limits quarterly rather than continuously and reports against prior-quarter balances, creating a 90-day lag between limit breach and detection. OCC credit risk supervision handbooks and SR 11-7 model governance guidance require that concentration limits be monitored on a frequency commensurate with the rate of portfolio change; in a rapidly growing lending segment, a 90-day detection lag allows the breach to compound before any corrective action is initiated, and the delay is treated by examiners as a control deficiency rather than a limit breach requiring corrective action.`,
    keywords: ['credit concentration', 'sectoral concentration', 'C&I lending', 'SR 11-7', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1125',
    name: 'Sponsor Concentration Across Multiple Portfolio Companies Not Aggregated in LBO Risk Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital has leveraged lending exposures to seven portfolio companies owned by a single private equity sponsor, but the credit risk database links borrowers by legal entity name rather than ultimate beneficial owner, so the sponsor's aggregate credit exposure of $245M — 18% of Tier 1 capital — does not appear in any single-name concentration report or trigger any policy limit. OCC leveraged lending guidance (OCC 2013-9) and OCC concentration risk expectations require that sponsor-level aggregation be a component of leveraged lending concentration monitoring, recognizing that portfolio companies of the same sponsor share governance, strategy, and financial distress correlation; the absence of sponsor-entity mapping means the bank has no early warning mechanism when the sponsor's fund faces liquidity stress that could trigger covenant waivers across multiple portfolio companies simultaneously.`,
    keywords: ['credit concentration', 'leveraged lending', 'OCC 2013-9', 'private equity', 'sponsor exposure'],
    demoRelevant: true,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1126',
    name: 'Loan Maturity Concentration Creates Cliff-Edge Refinancing Risk in 2025–2026 Vintage',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's CRE and leveraged lending portfolios have a pronounced maturity concentration in 2025–2026, with 41% of outstanding balances by dollar volume reaching final maturity within 18 months, creating a cliff-edge refinancing risk during a period of elevated interest rates and tightened capital markets liquidity. OCC credit risk management guidance and DFAST scenario design requirements both recognize maturity concentration as a distinct dimension of credit risk requiring dedicated stress scenarios; the bank's stress testing framework does not include a refinancing cliff scenario, and the asset liability committee has not briefed the board on the potential that a large share of maturing loans will be unable to refinance at existing terms without covenant modifications or payoff requests from distressed borrowers.`,
    keywords: ['credit concentration', 'maturity concentration', 'refinancing risk', 'DFAST', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1127',
    name: 'Shared National Credit Participation Concentration Underreported in Call Report',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital participates in 22 shared national credits (SNCs) as a lead or participant bank, but the bank's call report preparation process classifies SNC participations under the lead agent's NAICS code rather than independently verifying the ultimate borrower's industry, causing SNC-driven industry concentration to be systematically misreported in Schedule RC-C call report data. The annual SNC examination conducted by OCC, FDIC, and Federal Reserve examiners applies a consistent credit risk rating to each shared credit, and discrepancies between First Capital's internal risk ratings and the SNC examination's consensus rating on six credits represent a calibration deficiency that contributes to inaccurate ALLL provisioning on the SNC participation book.`,
    keywords: ['shared national credit', 'SNC examination', 'call report', 'credit concentration', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1128',
    name: 'Climate-Correlated Concentration Risk in Coastal Commercial Real Estate Not Stress-Tested',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital has $380M in CRE loans secured by coastal properties in flood zones AE and VE, representing 29% of total CRE exposure, but the bank's credit stress testing framework does not include a physical climate risk scenario that models the impact of increased flood insurance premiums, property value discounting near sea-level rise projections, or forced-sale dynamics from insurer withdrawal. OCC 2021 climate risk guidance and the interagency principles for climate-related financial risk management (2023) require that banks with material climate-correlated concentration quantify physical risk exposures and incorporate them into credit risk scenario analysis; the absence of a coastal property stress scenario creates a material gap in the bank's understanding of its tail credit risk under climate-adverse conditions.`,
    keywords: ['credit concentration', 'climate risk', 'OCC climate guidance', 'physical risk', 'CRE concentration'],
    demoRelevant: true,
    subTopic: 'credit-concentration',
  },
  {
    code: 'B1129',
    name: 'Customer Concentration in SME Book — Top 20 Borrowers Represent 55% of C&I Outstandings',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's community banking segment has a pronounced customer concentration in its small and medium enterprise C&I book, where the top 20 borrowing relationships account for 55% of total C&I outstandings; the bank's credit risk dashboard does not display a borrower concentration Herfindahl-Hirschman Index or equivalent metric, so the board lacks a quantitative frame for the portfolio's structural concentration. OCC credit risk supervision standards for community banks require that boards understand borrower concentration risk in plain terms and receive reporting that enables them to assess whether the concentration is consistent with the bank's risk appetite; without HHI or similar concentration metrics, the board cannot evaluate whether the top-20 concentration has increased or decreased relative to prior periods or to peer institutions of comparable asset size.`,
    keywords: ['credit concentration', 'SME lending', 'HHI', 'C&I concentration', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'credit-concentration',
  },

  // ── Stress Testing (B1130–B1139) ────────────────────────────────────────────

  {
    code: 'B1130',
    name: 'DFAST Scenario Severity Not Calibrated to Bank-Specific Loan Portfolio Composition',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital applies the Federal Reserve's published DFAST severely adverse scenario to its loan portfolio using sector-average loss rate assumptions from the Fed's own disclosure, without adjusting the scenario severity for the bank's above-average CRE and leveraged lending concentrations that would be expected to generate losses materially worse than the sector average in a stress event. Federal Reserve DFAST guidance and OCC supervisory expectations for stress testing require that bank-specific scenario calibration reflect the institution's actual portfolio composition, and examiners consistently cite the use of published loss rates without portfolio-specific adjustments as a stress testing methodology deficiency; the calibration gap causes First Capital to underestimate severely adverse scenario losses by an estimated $35–50M relative to the OCC's independent stress testing model output.`,
    keywords: ['DFAST', 'stress testing', 'OCC examination', 'CCAR', 'scenario calibration'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1131',
    name: 'Stress Testing Model Uses Static Balance Sheet Assumption — No Business Response Modeled',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's credit stress testing model assumes a static balance sheet in which loan volumes, deposit balances, and fee income remain constant throughout the nine-quarter stress horizon, failing to model the bank's expected business response to a severely adverse scenario — including new origination slowdown, workout staffing increases, and deposit flight from high-rate funding. Federal Reserve stress testing guidance and OCC supervisory letters on capital planning both require that stress testing models capture the dynamic interaction between credit losses and the bank's balance sheet response over the planning horizon; the static balance sheet assumption produces overstated net interest income that offsets modeled credit losses, resulting in post-stress capital levels that examiners view as unrealistically optimistic by 80–120 basis points of CET1.`,
    keywords: ['stress testing', 'DFAST', 'static balance sheet', 'OCC examination', 'capital planning'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1132',
    name: 'Credit Stress Test Does Not Include Correlated Market Risk Loss Overlay',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's credit stress testing is conducted independently of market risk stress, producing separate projected credit loss and trading loss estimates that are then added algebraically without adjusting for the correlation between credit spread widening and collateral value deterioration in a severely adverse macro scenario. BCBS 239 risk data aggregation requirements and Federal Reserve DFAST guidance both expect that credit and market risk stress tests reflect the correlation structure observed during historical stress periods; the additive combination of independent stress tests fails to capture the amplification effect where market risk losses reduce the collateral values securing credit exposures, causing the bank to underestimate total stressed loss by failing to model the mark-to-market feedback loop into credit risk outcomes.`,
    keywords: ['stress testing', 'BCBS 239', 'correlated stress', 'DFAST', 'market risk'],
    demoRelevant: false,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1133',
    name: 'Stress Testing Satellite Model for Commercial Real Estate Not Validated After 2022 Rate Shock',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's credit stress testing framework uses a satellite model for commercial real estate loss estimation that was calibrated on 2010–2019 data and has not been re-validated following the 2022–2023 interest rate shock, a period that produced DSCR deterioration dynamics and cap rate expansion not present in the training sample. SR 11-7 model risk management guidance requires that material models be validated annually or after significant changes in the economic environment affecting model inputs; OCC examiners reviewing the CRE satellite model's ongoing validation documentation find that the 2022–2023 rate environment represents a structural break in the model's assumptions about borrower refinancing behavior, and the absence of post-rate-shock validation is escalated as a model risk management deficiency.`,
    keywords: ['stress testing', 'SR 11-7', 'model validation', 'CRE stress', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1134',
    name: 'Reverse Stress Test Not Conducted — Bank Cannot Identify Capital-Depleting Scenario',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital conducts forward-looking stress tests using a fixed scenario menu but has not performed a reverse stress test to identify the specific combination of credit, market, and liquidity shocks that would reduce CET1 to the regulatory minimum, leaving senior management without a clear understanding of the bank's distance to insolvency under tailored adverse conditions. OCC capital planning guidance and the Federal Reserve's SR 12-7 stress testing guidance both recommend reverse stress testing as a complement to forward scenario testing, particularly for institutions with concentrated portfolios; without a reverse stress test, the bank cannot communicate to the board risk committee the specific scenario thresholds that would breach capital minimums, a gap that OCC examiners treat as a capital planning governance deficiency.`,
    keywords: ['reverse stress test', 'stress testing', 'OCC guidance', 'capital planning', 'CET1'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1135',
    name: 'Stress Testing Frequency Insufficient for Portfolio Change Rate — Annual Tests Lag Composition Shifts',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's credit stress testing cycle runs annually, producing results that are presented to the board in Q2 based on year-end portfolio composition; by the time results are produced, the portfolio's credit risk profile has changed materially through originations, payoffs, and rating migrations that occurred in Q1 and Q2, making the stress test results stale for mid-year capital planning decisions. OCC stress testing guidance and Federal Reserve capital planning expectations require that stress testing frequency be commensurate with the materiality and rate of change of the portfolio; for institutions with active leveraged lending and CRE origination pipelines, annual stress testing is insufficient to inform mid-year capital actions, and OCC examiners cite the frequency gap as a contributing factor in the bank's inability to anticipate the Q3 capital charge associated with SNC rating downgrades.`,
    keywords: ['stress testing', 'OCC examination', 'capital planning', 'DFAST', 'stress test frequency'],
    demoRelevant: false,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1136',
    name: 'Stress Test Results Not Feeding Back Into Credit Origination Standards — Loop Broken',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's credit stress testing produces scenario results that are reported to the board risk committee but are not formally integrated into credit underwriting standards or origination approval criteria, so the bank continues to originate CRE construction loans at terms that the stress test identifies as likely to breach covenants under a moderately adverse scenario. OCC stress testing supervisory guidance and OCC Bulletin 2012-33 both require that stress test results inform credit policy, risk appetite setting, and origination standards; the absence of a feedback loop from stress testing to underwriting — evidenced by the lack of any stress test findings cited in credit policy revision memos from the past two years — creates a structural disconnect between risk identification and risk management that OCC examiners cite as a governance deficiency.`,
    keywords: ['stress testing', 'credit underwriting', 'OCC 2012-33', 'feedback loop', 'credit policy'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1137',
    name: 'Liquidity Stress Not Integrated With Credit Stress — Combined Shock Not Modeled',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's credit stress testing and liquidity stress testing are managed by separate teams using different scenario assumptions, preventing the bank from modeling the combined impact of a simultaneous credit loss event and liquidity stress that depletes the bank's High Quality Liquid Assets while credit losses consume capital, a co-occurrence that characterized the 2008 financial crisis and SVB's 2023 failure. BCBS 239 and Federal Reserve guidance on integrated stress testing require that credit and liquidity stresses be evaluated together to capture the feedback effect where credit mark-to-market losses accelerate deposit outflows; the siloed stress testing structure prevents the ALCO from understanding whether the bank's liquidity buffer is sufficient to survive a credit-driven confidence shock in the deposit base.`,
    keywords: ['stress testing', 'liquidity stress', 'BCBS 239', 'integrated stress', 'DFAST'],
    demoRelevant: false,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1138',
    name: 'Third-Party Vendor Stress Test Model Not Subject to SR 11-7 Model Risk Controls',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital licenses a third-party vendor credit loss projection model for DFAST and CECL purposes and relies on the vendor's documentation and annual validation report in lieu of conducting independent model validation, a practice that the OCC's SR 11-7 guidance explicitly prohibits for models classified as high materiality. SR 11-7 requires that model validation be independent of model development — including vendor-developed models — and that the bank conduct its own conceptual soundness review, benchmarking, and outcomes analysis even when the vendor provides validation materials; OCC examiners find that three years of DFAST results are based on vendor model output that has never been benchmarked against internal first-principles models, creating an SR 11-7 model risk deficiency that the board risk committee is unaware of.`,
    keywords: ['SR 11-7', 'model risk', 'stress testing', 'vendor model', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'stress-testing',
  },
  {
    code: 'B1139',
    name: 'DFAST Pre-Provision Net Revenue Forecasting Model Overestimates Fee Income Under Stress',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's DFAST model for pre-provision net revenue (PPNR) uses a regression model that projects fee income based on balance sheet size without including a fee income sensitivity to credit stress scenarios, causing the severely adverse scenario to project commercial fee income at levels close to the baseline even as credit conditions deteriorate sharply. Federal Reserve DFAST guidance and OCC examiners reviewing the PPNR model both expect that fee income components be sensitive to the stress scenario's impact on customer activity — including reduced loan origination fees, lower trade finance volume, and decreased treasury management revenue as corporate customers reduce activity under severe macro stress; the insensitive fee income model overstates PPNR under stress by an estimated 18%, partially offsetting credit losses in a way that produces unrealistically favorable capital projections.`,
    keywords: ['DFAST', 'PPNR', 'stress testing', 'OCC examination', 'pre-provision net revenue'],
    demoRelevant: false,
    subTopic: 'stress-testing',
  },

  // ── Credit Portfolio Management (B1140–B1149) ───────────────────────────────

  {
    code: 'B1140',
    name: 'Credit Portfolio Optimization Model Not Validated — Capital Allocation Decisions Distorted',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's credit portfolio management team uses a portfolio optimization model to allocate credit risk appetite across business lines and product types, but the model has not been through SR 11-7 validation — it was classified as a decision-support tool rather than a model, enabling it to bypass the model inventory and governance controls. SR 11-7 defines a model as any quantitative method used to make business decisions with material financial implications, and a capital allocation tool that influences origination limits across eight business lines clearly meets that definition; OCC examiners reviewing the model inventory find that the optimization model — responsible for recommending $420M in business-line credit appetite shifts — lacks the documentation, validation, and governance required by the bank's own model risk management policy.`,
    keywords: ['SR 11-7', 'model risk', 'credit portfolio management', 'capital allocation', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1141',
    name: 'Loan Sale and Syndication Strategy Not Integrated With Credit Risk Appetite Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital originates leveraged loans with the intention of syndicating or selling down to risk appetite levels, but the credit risk appetite monitoring system reports gross origination exposure rather than net retained exposure, causing the board risk committee to receive concentration reports that reflect origination volumes rather than the bank's actual risk position after intended distributions. OCC leveraged lending guidance (OCC 2013-9) and OCC credit risk supervision guidance both require that credit risk reporting reflect the bank's actual retained exposure and that pipeline loans intended for distribution be tracked separately from hold-to-maturity commitments; the gross vs. net reporting disconnect causes the board to believe leveraged lending concentration is within policy when actual retained exposure — which varies with market liquidity conditions — periodically exceeds appetite limits.`,
    keywords: ['credit portfolio management', 'leveraged lending', 'OCC 2013-9', 'syndication', 'loan sale'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1142',
    name: 'Credit Default Swap Hedges Not Reflected in Economic Capital Model — Portfolio Risk Overstated',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital uses credit default swaps to hedge single-name concentration risk in its large corporate C&I book, but the economic capital model used for internal capital adequacy assessment (ICAAP) does not reflect CDS hedge positions, causing the model to overstate economic capital requirements for the C&I segment and under-allocate capital to unhedged concentration risks in the CRE portfolio. OCC ICAAP guidance and BCBS 239 data aggregation requirements both expect that credit risk mitigation instruments be reflected in internal capital models on a consistent basis; the failure to include CDS hedges in the economic capital model produces a systematic distortion in business-line RAROC calculations, causing the C&I business to appear less capital-efficient than the underlying risk profile warrants.`,
    keywords: ['credit portfolio management', 'economic capital', 'ICAAP', 'BCBS 239', 'credit default swap'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1143',
    name: 'Watchlist Credit Migration Not Triggering Portfolio-Level Risk Appetite Review',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's watchlist management process monitors individual credits for deterioration and escalates to special assets management, but the portfolio management framework has no automated trigger to convene a portfolio-level risk appetite review when watchlist migration rates accelerate beyond historical norms, preventing senior management from detecting early-cycle credit stress before losses materialize. OCC credit risk examination procedures require that portfolio monitoring include portfolio-level early warning indicators — including watchlist formation rates, criticized asset migration, and 30-day delinquency trends — that trigger management review when they breach established thresholds; the absence of a portfolio-level trigger mechanism means that the special assets team can see individual credit deterioration while the board risk committee receives aggregate portfolio metrics that do not yet reflect the deterioration trend.`,
    keywords: ['credit portfolio management', 'watchlist', 'OCC examination', 'criticized assets', 'risk appetite'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1144',
    name: 'Criticized and Classified Asset Ratio Trending Above Peer Without Board Escalation Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's criticized and classified asset ratio has increased from 4.2% to 7.8% over six quarters, trending 210 basis points above the peer bank median without triggering any formal board escalation; the credit risk policy defines escalation thresholds for individual loan ratings but does not set a portfolio-level threshold at which the CEO is required to brief the board risk committee on portfolio quality trends. OCC CAMELS examination criteria weight criticized and classified asset ratios heavily in the Asset Quality component, and banks with ratios above peer for more than two consecutive examination cycles receive adverse asset quality ratings; the absence of a portfolio-level escalation protocol means that the board is informed of CRA trends only through quarterly credit reports, not through a structured management escalation that would allow the board to assess whether corrective action is needed.`,
    keywords: ['credit portfolio management', 'criticized assets', 'CAMELS', 'OCC examination', 'board governance'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1145',
    name: 'Credit Limit Utilization Data Stale — Revolving Facility Draws Not Reflected in Real Time',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's credit risk concentration system receives revolving credit facility utilization data from the core banking system via a nightly batch feed, creating up to a 24-hour lag between actual draw activity and the concentration reporting used to monitor single-name and sector limits, during which a borrower can draw its full $75M revolver without triggering any real-time limit alert. OCC guidance on credit risk data management and BCBS 239 risk data aggregation principles both require that risk measurement systems receive data at a frequency commensurate with the risk being managed; for revolving credit facilities, intraday draw visibility is critical during credit events when borrowers systematically draw revolvers in advance of distress announcements, and the nightly batch lag means First Capital cannot detect the pattern until the following day's concentration report.`,
    keywords: ['credit portfolio management', 'BCBS 239', 'revolving credit', 'real-time data', 'OCC guidance'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1146',
    name: 'Portfolio Vintage Analysis Not Conducted — Underwriting Standard Drift Not Detected',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's credit portfolio management team produces periodic credit quality reports based on current risk ratings and delinquency trends but does not conduct vintage analysis that tracks the performance of loans originated in each underwriting period, preventing the detection of systematic underwriting standard drift in the 2021–2022 origination cohort that benefited from pandemic-era federal stimulus and suppressed charge-off experience. OCC credit examination guidance consistently identifies vintage analysis as a required component of sound portfolio management for institutions with active origination programs, because cohort-based performance tracking is the only reliable method to detect whether credit standards have deteriorated before the deterioration manifests in aggregate portfolio statistics; the absence of vintage analysis caused First Capital to continue applying 2021–2022 underwriting standards through 2023, originating a cohort of consumer and small business loans that is now exhibiting early-payment default rates 40% above the historical average.`,
    keywords: ['credit portfolio management', 'vintage analysis', 'OCC examination', 'underwriting standards', 'charge-off'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1147',
    name: 'Loan-Level Data Tape Quality Insufficient for Whole Loan Sale Due Diligence',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's attempts to execute whole loan sales of consumer installment and auto loan portfolios have been unsuccessful because the loan-level data tapes produced from the core banking system are missing fields required by institutional buyers — including origination FICO score, debt-to-income at origination, and payment history — that are stored in legacy origination systems not integrated with the servicing database. The inability to produce complete loan-level data tapes for whole loan sale purposes prevents the bank from executing portfolio rebalancing transactions to manage credit concentration, and the data quality gap causes prospective buyers to apply a 2–4% bid discount to compensate for documentation uncertainty, reducing the economic benefit of portfolio management transactions by an estimated $3–5M per sale.`,
    keywords: ['credit portfolio management', 'whole loan sale', 'loan-level data', 'BCBS 239', 'data quality'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1148',
    name: 'Economic Capital Allocation Methodology Not Disclosed in ICAAP — Examiner Scrutiny Risk',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's Internal Capital Adequacy Assessment Process (ICAAP) document references economic capital allocation but does not describe the methodology, model parameters, confidence intervals, or correlation assumptions used to convert modeled credit losses into Pillar 2 capital requirements, leaving examiners unable to assess the soundness of the bank's internal capital assessment. OCC guidance on capital planning and internal capital adequacy assessment requires that ICAAP documentation be sufficiently detailed to enable supervisory review, including disclosure of the quantitative methodologies and qualitative overlays used; without methodology disclosure, OCC examiners treat the ICAAP as incomplete and request detailed model documentation under a Matters Requiring Attention, triggering a 90-day documentation production timeline that delays the bank's capital planning cycle.`,
    keywords: ['ICAAP', 'economic capital', 'credit portfolio management', 'OCC examination', 'Pillar 2'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1149',
    name: 'Cross-Sell Credit Risk Not Included in Portfolio Risk Appetite — Embedded Consumer Exposure Unmonitored',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      `First Capital's corporate treasury management clients receive unsecured overdraft facilities, credit card programs, and employee benefit loans that are managed by the retail banking segment outside the commercial credit risk appetite framework, creating embedded consumer credit exposure to commercial clients whose financial condition is monitored only in the commercial credit file. OCC guidance on enterprise-wide credit risk management and OCC examination procedures for community banks require that credit exposure to a single customer relationship be aggregated across all products and segments for concentration and risk appetite purposes; the cross-sell credit exposure gap means that a commercial borrower in financial distress can simultaneously draw on an unsecured overdraft line, miss credit card payments, and breach commercial covenants without any single risk officer having visibility to the aggregate exposure trend.`,
    keywords: ['credit portfolio management', 'cross-sell risk', 'OCC examination', 'enterprise credit risk', 'concentration'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },

  // ── AI Credit Risk (B1150–B1167) ────────────────────────────────────────────

  {
    code: 'B1150',
    name: 'AI Underwriting Model Produces Disparate Impact on Protected Classes Without ECOA Testing',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      `First Capital deploys an AI machine learning underwriting model for consumer installment lending that uses alternative data features — including transaction pattern data, device behavior scores, and cash flow volatility metrics — to predict default probability, but the fair lending compliance team has not conducted an adverse impact analysis under ECOA to determine whether the AI model's use of alternative data produces disparate impact on protected classes. CFPB supervisory expectations for AI credit models and the March 2023 interagency statement on fair lending and AI require that institutions using AI-based underwriting conduct regular disparate impact testing against HMDA and 1071 demographic data; the absence of disparate impact testing means First Capital is operating a consumer lending model with unknown fair lending risk, which regulators treat as a supervisory priority in AI credit risk examinations.`,
    keywords: ['AI credit risk', 'ECOA', 'disparate impact', 'fair lending', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1151',
    name: 'AI Credit Score Vendor Black-Box Model Cannot Provide Adverse Action Reasons Under FCRA',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital licenses a third-party AI credit scoring model to supplement FICO scores in consumer loan underwriting, but the vendor's model produces a single numeric score without attributable reason codes, preventing the bank from generating the specific adverse action reasons required under FCRA and Regulation B when a consumer application is declined or approved on less favorable terms. FCRA Section 615 and Regulation B Section 202.9 both require that creditors provide specific reasons for adverse action based on the factors that most significantly affected the credit decision; the AI model's inability to produce reason codes means First Capital must fall back to the traditional FICO score for adverse action reasons even when the AI score is the determinative input, creating a regulatory risk that CFPB examiners identify as a failure to accurately disclose the basis for the credit decision.`,
    keywords: ['AI credit risk', 'FCRA', 'Regulation B', 'adverse action', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1152',
    name: 'AI Early Warning System Trained on Pre-2022 Data — Interest Rate Stress Signatures Not Learned',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's AI early warning system for commercial credit deterioration was trained on 2015–2021 credit performance data and uses delinquency, financial covenant breach, and deposit flow patterns as leading indicators, but the model was not retrained to recognize the cash flow stress signatures associated with the 2022–2023 rate shock — specifically, the pattern of declining operating cash flow ratios coinciding with rising revolver utilization on floating-rate borrowers. SR 11-7 model validation requirements mandate that models be retrained or re-validated when the economic environment changes in ways that affect model inputs; the absence of a rate-shock retraining cycle means the early warning system missed deterioration signals in 11 commercial borrowers that subsequently defaulted, producing a false-negative rate 35% above the model's pre-2022 validation benchmark.`,
    keywords: ['AI credit risk', 'SR 11-7', 'early warning system', 'model retraining', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1153',
    name: 'Generative AI Used in Credit Memo Preparation Without Output Verification Control',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital relationship managers use a generative AI tool to draft commercial credit memoranda from CRM notes and financial data extracts, but the bank has not established a review control that requires verification of AI-generated financial ratios, covenant comparisons, and industry comparisons against source documents before the memo is submitted for credit approval. OCC guidance on operational risk and OCC Bulletin 2023-17 on AI risk management require that institutions using generative AI in decision-relevant workflows establish verification controls proportionate to the risk of AI hallucination; OCC examiners reviewing credit files find that four credit memos contained AI-generated EBITDA ratios that differed from the borrower's financial statements by 8–15%, ratios that had been approved without comparison to source documents, representing a credit underwriting documentation quality control failure.`,
    keywords: ['AI credit risk', 'generative AI', 'OCC Bulletin 2023-17', 'credit memo', 'hallucination'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1154',
    name: 'AI Loan Pricing Model Not in SR 11-7 Model Inventory — Pricing Decisions Unvalidated',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's commercial lending team uses an AI-powered loan pricing model that recommends risk-adjusted spreads based on obligor risk rating, sector, loan structure, and relationship profitability factors, but the model was deployed as a business intelligence tool and has never been entered into the bank's SR 11-7 model inventory or subjected to independent validation. SR 11-7 defines a model as any quantitative method with material financial implications, and a pricing model that determines risk premiums across a $2.1B commercial loan portfolio clearly meets that definition; OCC model risk examiners discovering the unregistered pricing model require immediate model inventory registration, documentation of the model's development methodology, and an independent validation plan within 60 days, triggering a parallel model risk MRA.`,
    keywords: ['AI credit risk', 'SR 11-7', 'model inventory', 'loan pricing', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1155',
    name: 'AI-Powered Credit Limit Management System Increases Limits on Deteriorating Accounts',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's AI credit limit management system for consumer revolving products uses account management models trained on 2019–2022 data to automatically increase limits for accounts showing positive usage patterns, but the model's positive feature weights for rising utilization — learned from a low-rate environment where utilization growth preceded eventual payoff — are producing limit increases on accounts where utilization growth is driven by financial distress rather than normal spending behavior. SR 11-7 model risk requirements and CFPB supervisory expectations for credit limit management require that account management models be monitored for population drift and economic regime change; the model's continued operation without a drift detection mechanism is producing limit increases on 1,800 accounts per month that a challenger model analysis shows would receive limit decreases under conservative assumptions, increasing the bank's exposure to peak-before-charge-off balance concentration by an estimated $12M.`,
    keywords: ['AI credit risk', 'SR 11-7', 'account management', 'CFPB', 'model drift'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1156',
    name: 'AI Fraud-to-Credit Risk Handoff Gap — Synthetic Identity Borrowers Not Flagged at Origination',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's AI fraud detection system at account origination and the AI credit underwriting model operate as independent pipelines without a data handoff, causing synthetic identity fraud indicators detected by the fraud model — including inconsistent employment tenure data and cross-account device fingerprint matches — to not propagate to the credit decision model where they would reduce the probability of approval. FFIEC guidance on identity verification and OCC guidance on fraud risk in digital lending channels both require that fraud risk signals be integrated into the credit origination risk assessment; the siloed AI pipeline architecture means that 340 synthetic identity accounts with detectable fraud indicators passed credit underwriting in the prior 12 months, accounting for $4.2M in first-year charge-offs.`,
    keywords: ['AI credit risk', 'synthetic identity fraud', 'FFIEC guidance', 'OCC guidance', 'digital lending'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1157',
    name: 'AI CRA Analysis Tool Misclassifies Low-Moderate Income Geographies — CRA Score Distorted',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital uses an AI tool to map loan origination geographies to CRA assessment area designations and LMI census tract classifications, but the tool uses a 2020 Census tract boundary file without incorporating FFIEC 2023 CRA assessment area revisions, causing a systematic misclassification of 12% of originations as LMI-qualifying that do not qualify under the updated tract boundaries. The January 2023 CRA final rule and FFIEC's updated CRA rating methodology require that qualifying assessment area activity be mapped to current FFIEC census tract data; OCC examiners conducting the CRA Performance Evaluation find that First Capital's AI-driven CRA reporting overstates LMI lending volume by $18M, reducing the bank's CRA rating from "Satisfactory" to "Needs to Improve" because the actual LMI lending volume falls below the threshold for the bank's assessment area size.`,
    keywords: ['AI credit risk', 'CRA', 'FFIEC guidance', 'LMI classification', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1158',
    name: 'AI Collections Score Deployed Without Disparate Impact Analysis on Protected Classes',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's consumer collections team uses an AI score to prioritize collection contact intensity and settlement offer thresholds, with higher-score accounts receiving more favorable settlement terms earlier in the delinquency cycle, but the bank has not conducted a disparate impact analysis to determine whether the AI score's feature weights produce systematically different collection treatment for borrowers in protected class groups. CFPB supervisory expectations for collections AI and the March 2023 interagency fair lending AI statement require that AI models affecting the terms of credit resolution be subject to the same disparate impact testing as origination models; OCC and CFPB joint examination of First Capital's collections practices finds that the AI score produces a statistically significant 14% difference in favorable settlement offer rates between majority-minority census tract residents and majority-White census tract residents, constituting a potential ECOA violation.`,
    keywords: ['AI credit risk', 'ECOA', 'collections AI', 'disparate impact', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1159',
    name: 'AI Cash Flow Underwriting for Small Business Lacks Human Override Documentation Requirement',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's AI-powered cash flow underwriting system for small business loans analyzes 12 months of business checking account transaction data to produce a creditworthiness score, and relationship managers are permitted to override the AI recommendation but are not required to document the basis for the override in the credit file, creating a systematic override documentation gap. OCC guidance on AI in lending and OCC Bulletin 2021-18 on model risk management both require that AI-assisted credit decisions include documented human review that captures the basis for any override, ensuring that a consistent standard is applied to AI recommendations across all origination channels; the absence of override documentation prevents the bank from analyzing its override rate for fair lending disparate treatment risk, a gap that CFPB examiners identify as a fair lending controls deficiency.`,
    keywords: ['AI credit risk', 'OCC Bulletin 2021-18', 'small business lending', 'override documentation', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1160',
    name: 'AI Covenant Monitoring System Misses Covenant Definitions Customized at Origination',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's AI-based covenant monitoring system uses a natural language processing model to extract covenant definitions from loan agreements and configure automated compliance monitoring, but the NLP extraction model has a 15% error rate on covenant definitions that use non-standard drafting conventions or incorporate bespoke carve-outs negotiated at closing, causing 23 CRE and leveraged loans to have incorrectly configured covenant tests that do not match the executed loan agreement. SR 11-7 model risk requirements apply to NLP models used in material financial decisions, and OCC examination of First Capital's covenant compliance process finds that the AI extraction model's error rate — combined with the absence of human verification of extracted covenant terms — creates a material risk that covenant breaches go undetected because the monitoring system is testing the wrong threshold.`,
    keywords: ['AI credit risk', 'SR 11-7', 'covenant monitoring', 'NLP model', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1161',
    name: 'AI Climate Risk Scoring for CRE Not Included in Credit Rating Methodology',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital contracts with a climate risk data provider to score CRE collateral properties for physical climate risk (flood, heat, wildfire) and produces AI-generated climate risk scores at origination, but these scores are not integrated into the credit risk rating methodology and do not influence the probability of default or loss given default assumptions used in the bank's internal rating system. OCC 2023 climate risk principles require that material climate-related risks be incorporated into credit risk assessment processes; the disconnect between the AI climate risk scoring tool and the credit rating system means the bank collects climate risk data without using it to inform credit pricing or risk-based capital allocation, producing an AI-driven data collection exercise without any corresponding credit risk management benefit.`,
    keywords: ['AI credit risk', 'climate risk', 'OCC climate guidance', 'credit rating', 'physical risk'],
    demoRelevant: false,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1162',
    name: 'AI Portfolio Monitoring Dashboard Aggregates Data Incorrectly — Watchlist Count Understated',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's AI-powered credit portfolio monitoring dashboard pulls risk rating data from three source systems — the loan origination system, the commercial loan servicing platform, and the special assets tracking system — but uses account number as the join key without resolving loan restructurings that create new account numbers, causing restructured loans that remain in special assets to appear twice in the total loan count and appear zero times in the watchlist count. BCBS 239 risk data aggregation requirements mandate that risk reporting systems produce accurate, complete, and consistent data, and the AI dashboard's data integration error causes the board risk committee to receive watchlist statistics that undercount the actual number of criticized relationships by 18%, a gap that OCC examiners identify during the examination data request review.`,
    keywords: ['AI credit risk', 'BCBS 239', 'data aggregation', 'watchlist', 'portfolio monitoring'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1163',
    name: 'AI Trade Finance Document Verification Model Has Unacceptable False-Negative Rate for Fraud',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's trade finance operations use an AI document verification model to screen bills of lading, letters of credit, and commercial invoices for fraud indicators, but the model's false-negative rate — the rate at which it passes fraudulent documents as authentic — is 8% on the bank's validation dataset, a rate that produces an expected one fraudulent transaction per 12 validated documents at current trade finance volumes. OCC operational risk guidance and FFIEC guidance on fraud risk in trade finance both require that AI models used in fraud detection maintain false-negative rates commensurate with the financial risk of the transaction; the 8% false-negative rate, combined with the average $2.1M transaction size in First Capital's trade finance book, implies an expected fraud loss from AI-cleared fraudulent documents of approximately $6–8M annually, a figure that exceeds the cost of supplementary human review at a volume of 95 monthly transactions.`,
    keywords: ['AI credit risk', 'trade finance', 'fraud detection', 'OCC operational risk', 'FFIEC guidance'],
    demoRelevant: false,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1164',
    name: 'AI Credit Risk Model Explainability Report Not Produced for Regulatory Examination',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital uses a gradient boosting AI model for consumer credit underwriting that produces high predictive accuracy but cannot generate per-application SHAP value explanations at examination time because the model was deployed without an explainability layer and the training environment is no longer accessible. OCC Bulletin 2021-18 and the interagency AI principles (2021) require that institutions using AI in material credit decisions be able to explain model outputs to regulators on demand; the absence of an explainability layer means OCC examiners cannot verify whether the model's decision factors are compliant with ECOA, Regulation B, and fair lending requirements, causing the examiners to require that the model be taken offline until a validated explainability capability is deployed, disrupting the consumer origination channel for an estimated six weeks.`,
    keywords: ['AI credit risk', 'model explainability', 'OCC Bulletin 2021-18', 'ECOA', 'SHAP'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1165',
    name: 'AI-Assisted Annual Review Process Misses Covenant Waivers Not Stored in Core System',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's AI-assisted annual review process ingests financial covenant compliance data from the core commercial loan servicing platform to generate credit review summaries, but covenant waivers granted informally by relationship managers and stored only in email attachments rather than in the servicing system are not picked up by the AI ingestion process, causing the AI-generated annual review to show clean covenant compliance for loans that have active waivers outstanding. SR 11-7 model risk requirements and OCC credit examination guidance both require that AI-assisted credit review tools operate on complete and accurate data; the email attachment waiver gap causes the AI system to produce misleading credit review summaries that understate the number of relationships with acknowledged covenant stress, exposing the bank to criticism that annual review quality controls are inadequate.`,
    keywords: ['AI credit risk', 'SR 11-7', 'annual review', 'covenant compliance', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1166',
    name: 'AI Model Used for CECL Forecast Not Registered as Material Model — SR 11-7 Gap',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital supplements its CECL allowance estimation with an AI neural network model that projects lifetime loss rates for the consumer installment portfolio, but the model was registered in the model inventory as a "management reporting tool" rather than a material model, allowing it to bypass the annual independent validation requirement applicable to CECL models under SR 11-7. FASB ASC 326 implementation guidance and OCC supervisory letters on CECL model risk both require that all models used to estimate the allowance for credit losses be subject to rigorous model risk management controls, including independent validation and outcomes monitoring; OCC examiners reviewing the CECL allowance documentation discover the unvalidated AI model and issue a Matter Requiring Attention requiring re-estimation of the allowance using a validated methodology, triggering a material restatement risk.`,
    keywords: ['AI credit risk', 'CECL', 'SR 11-7', 'model inventory', 'FASB ASC 326'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },
  {
    code: 'B1167',
    name: 'AI Stress Test Scenario Generator Produces Implausible Macro Paths Without Expert Review',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's risk management team uses a generative AI tool to produce novel stress scenarios for credit risk planning, but the tool generates macro-economic paths — including simultaneous GDP contraction, employment growth, and interest rate decline — that are internally inconsistent and would be rejected by a senior economist; the scenarios are being used in board presentations without a mandatory expert review gate that would catch implausible combinations before they reach senior management. SR 11-7 model risk principles and OCC stress testing guidance both require that stress scenarios be reviewed for plausibility and internal consistency before use in capital planning or board reporting; the absence of an expert review gate means the board risk committee has approved three planning cycles using AI-generated scenarios with identifiable logical inconsistencies, potentially creating liability if the flawed scenarios are cited in regulatory submissions.`,
    keywords: ['AI credit risk', 'stress testing', 'generative AI', 'SR 11-7', 'OCC stress testing guidance'],
    demoRelevant: true,
    subTopic: 'ai-credit-risk',
  },

  // ── CECL / Allowance (B1168–B1179) ──────────────────────────────────────────

  {
    code: 'B1168',
    name: 'CECL Reasonable and Supportable Forecast Period Shorter Than Peer — Allowance Understated',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital uses a two-quarter reasonable and supportable (R&S) forecast period in its CECL model before reverting to historical average loss rates, while the peer group median for a bank with comparable portfolio composition is four quarters; the shorter R&S period causes the allowance to revert to historical average loss rates before the economic forecast's deterioration signal is fully incorporated into the lifetime loss estimate, systematically understating the allowance during periods when near-term economic indicators are negative. FASB ASC 326 requires that the R&S forecast period reflect the bank's actual ability to generate reliable economic forecasts, and OCC supervisory expectations for CECL model calibration require that the R&S period be supported by documented evidence of forecast accuracy; the two-quarter R&S period has never been validated against the bank's historical forecast accuracy data, creating an SR 11-7 model documentation deficiency in addition to the allowance calibration concern.`,
    keywords: ['CECL', 'FASB ASC 326', 'allowance for credit losses', 'SR 11-7', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1169',
    name: 'CECL Qualitative Adjustment Framework Not Documented — Examiner Cannot Verify Basis',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's CECL allowance includes a qualitative Q-factor overlay that adjusts the quantitative model output by $8M at year-end, but the Q-factor framework does not document the factors considered, the quantification methodology, the range of reasonable estimates, or the management discussion that determined the final Q-factor amount; OCC examiners cannot verify whether the Q-factor is appropriately calibrated or whether it double-counts risks already captured in the quantitative model. FASB ASC 326 and OCC CECL supervisory guidance both require that qualitative adjustments be supported by documented analysis of factors not captured in the quantitative model, including changes in lending standards, economic uncertainty, and model limitations; the undocumented Q-factor creates both an accounting compliance risk and an examination finding that the bank's CECL methodology lacks the rigor expected for a FASB ASC 326 implementation.`,
    keywords: ['CECL', 'qualitative adjustment', 'FASB ASC 326', 'OCC examination', 'allowance for credit losses'],
    demoRelevant: true,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1170',
    name: 'CECL Model Segment Definitions Don\'t Align With Loan Origination System — Data Mapping Error',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's CECL model segments loans by product type using a six-category classification — residential mortgage, home equity, consumer installment, commercial real estate, C&I, and construction — but the loan origination system uses a 14-category product type code that is mapped to CECL segments using a manual crosswalk maintained in a spreadsheet; the crosswalk has three mapping errors that cause $145M of commercial construction loans to be classified as C&I in the CECL model, producing loss rate assumptions calibrated to term C&I rather than construction, where historical loss rates are 2.5x higher. OCC CECL supervisory guidance and FASB ASC 326 ASU 2016-13 require that loan segmentation be based on shared credit risk characteristics, and a product code mapping error that causes construction loans to be modeled with C&I loss rates represents a CECL methodology deficiency that OCC examiners require be corrected with allowance restatement.`,
    keywords: ['CECL', 'data mapping', 'FASB ASC 326', 'loan segmentation', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1171',
    name: 'CECL Economic Scenarios Not Weighted — Single Baseline Scenario Used for Allowance Estimate',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's CECL allowance calculation uses a single baseline economic scenario — the bank's own economic forecast — without probability-weighting multiple scenarios to reflect economic uncertainty, a simplification that FASB ASC 326 allows only when multiple scenarios would produce allowance estimates that are not materially different from the single-scenario estimate. FASB ASC 326 and OCC CECL guidance both require that allowance estimates reflect the full range of expected credit losses, and for institutions with concentrated CRE and leveraged lending portfolios, single-scenario CECL estimates have been shown to understate the allowance by 15–25% compared to probability-weighted three-scenario approaches; OCC examiners reviewing First Capital's CECL methodology require documentation demonstrating that the single-scenario simplification is appropriate for the bank's portfolio composition.`,
    keywords: ['CECL', 'economic scenarios', 'FASB ASC 326', 'OCC examination', 'probability weighting'],
    demoRelevant: true,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1172',
    name: 'CECL Unfunded Commitment Reserve Not Calculated — Off-Balance Sheet Liability Understated',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's CECL implementation calculates allowance on funded loan balances but does not separately calculate and accrue the liability for expected credit losses on unfunded commitments — specifically, the expected draw and default probability on undrawn revolving credit facilities and construction loan commitments — causing the off-balance-sheet credit loss liability required under ASC 326-20-30-11 to be omitted from the balance sheet. FASB ASC 326 and OCC CECL supervisory guidance both require that the allowance framework capture both funded and unfunded credit exposures; the omission of the unfunded commitment reserve understates the bank's total credit loss liability by an estimated $4.2M and represents a GAAP compliance deficiency that the external auditor identifies in the management representation letter review.`,
    keywords: ['CECL', 'unfunded commitment', 'FASB ASC 326', 'off-balance sheet', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1173',
    name: 'CECL Allowance Backtesting Not Performed — Model Performance Unverified Against Actual Losses',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital has been running its CECL model for three years since adoption, but the model validation team has not conducted backtesting to compare the model's predicted lifetime loss rates against actual charge-offs on the same cohorts, preventing any assessment of whether the CECL model is over- or under-provisioning relative to realized loss experience. SR 11-7 model risk management requirements and OCC CECL supervisory guidance both require that CECL models be subject to ongoing performance monitoring and outcomes analysis, including backtesting against actual loss experience on a rolling basis; the absence of backtesting means the bank cannot demonstrate to OCC examiners that the CECL model's loss rate assumptions are calibrated to the bank's actual portfolio experience, creating an SR 11-7 model risk deficiency that triggers a requirement for a validation remediation plan within 60 days.`,
    keywords: ['CECL', 'backtesting', 'SR 11-7', 'model validation', 'FASB ASC 326'],
    demoRelevant: true,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1174',
    name: 'CECL Transition Adjustment Disclosure in 10-K Does Not Comply With ASC 326 Transition Guidance',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's 10-K disclosure for the year of CECL adoption does not separately present the pre-adoption ALLL balance and the post-adoption ACL balance with a reconciliation of the transition adjustment, and the bank has not disclosed the cumulative-effect adjustment to retained earnings as required by ASC 326 transition guidance, creating a financial statement disclosure deficiency that the SEC and OCC can identify in the call report transition disclosures. FASB ASC 326-10-65-1 and SEC Staff Accounting Bulletins on CECL transition require specific disclosures for the year of adoption, including the transition adjustment, the pre-adoption methodology, and the impact on retained earnings; the incomplete transition disclosure represents a GAAP compliance gap that external auditors include in an audit adjustment request and that OCC examiners treat as a financial reporting control deficiency.`,
    keywords: ['CECL', 'ASC 326', 'transition disclosure', 'SEC reporting', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1175',
    name: 'CECL Model for Purchased Credit Deteriorated Loans Uses Wrong Starting Loss Assumption',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital acquired a portfolio of commercial real estate loans through a bank acquisition and must account for loans meeting the purchased credit deteriorated (PCD) definition under ASC 326, but the bank's CECL model applies the same origination-cohort loss rate framework used for non-PCD loans without adjusting for the at-acquisition credit quality of PCD assets, causing the allowance on the acquired portfolio to be calculated using general population loss rates rather than the credit-deteriorated cohort rates required by ASC 326-20-30-13 for PCD assets. FASB ASC 326's PCD accounting guidance requires that the gross-up adjustment at acquisition — recognizing both the asset and the corresponding allowance simultaneously — be followed by ongoing allowance estimation using the asset's actual credit characteristics; the failure to use PCD-specific loss rates understates the allowance on the acquired portfolio by an estimated $6.5M and constitutes a FASB ASC 326 accounting policy error.`,
    keywords: ['CECL', 'PCD loans', 'FASB ASC 326', 'acquisition accounting', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1176',
    name: 'CECL Allowance Coverage Ratio Declining Without Board Explanation in Audit Committee Report',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's allowance coverage ratio — ACL as a percentage of total loans — has declined from 1.42% to 1.08% over six quarters as loan balances have grown faster than allowance additions, but the audit committee has not received an explanation from management addressing whether the declining coverage ratio reflects genuine portfolio quality improvement or systematic under-provisioning in the CECL model. OCC guidance on CECL governance requires that the board audit committee receive quarterly coverage ratio trend analysis with management's documented rationale for allowance levels, particularly during periods of declining coverage; the absence of a board-level coverage ratio trend analysis creates a governance gap that OCC examiners cite as evidence that board oversight of the allowance adequacy process is insufficient, contributing to a "needs improvement" rating on the bank's corporate governance self-assessment.`,
    keywords: ['CECL', 'allowance coverage', 'audit committee', 'OCC examination', 'board governance'],
    demoRelevant: true,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1177',
    name: 'CECL Collateral-Dependent Measurement Exception Not Applied Consistently Across Asset Classes',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's CECL framework applies the collateral-dependent measurement practical expedient under ASC 326-20-35-6 — using fair value of collateral less selling costs as the loss estimate — to individually evaluated CRE loans, but does not apply the same expedient to individually evaluated construction loans with the same collateral characteristics, creating an inconsistent measurement basis across asset classes that distorts the allowance and cannot be justified under FASB ASC 326's consistency principle. FASB ASC 326 requires that measurement elections be applied consistently within and across reporting periods for loans with similar characteristics; OCC examiners reviewing the allowance methodology find that six individually significant construction loans are using the discounted cash flow method while similar loans in the CRE segment use the collateral-dependent expedient, and require management to justify or correct the inconsistency in the next quarterly allowance calculation.`,
    keywords: ['CECL', 'collateral-dependent measurement', 'FASB ASC 326', 'individually evaluated', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1178',
    name: 'CECL Model Governance Committee Not Meeting Quarterly — Allowance Process Oversight Gaps',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital established a CECL model governance committee at adoption but the committee has not convened in the past 12 months due to scheduling conflicts, causing the quarterly allowance process to proceed without formal committee review of model assumption updates, scenario selection, and Q-factor changes that would normally require governance committee approval under the bank's own CECL policy. SR 11-7 model governance requirements and OCC CECL supervisory guidance both require that model changes, assumption updates, and Q-factor decisions be subject to documented governance review; OCC examiners reviewing the CECL governance structure find that the committee's inactivity has created an 18-month gap in governance oversight during which management has made at least four model assumption changes without the required committee approval, each of which represents a governance policy violation.`,
    keywords: ['CECL', 'model governance', 'SR 11-7', 'OCC examination', 'allowance governance'],
    demoRelevant: false,
    subTopic: 'cecl-allowance',
  },
  {
    code: 'B1179',
    name: 'CECL Day-Two Adjustment Process Not Documented — Provisions Booked Without Formal Methodology',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's CECL allowance process documents the initial model output but does not maintain a formal methodology document for the day-two provision adjustment process — the quarterly calculation that updates the allowance from the prior quarter's balance to the current quarter's model output — causing each quarter's provision to be a result of informal analysis by the credit risk team without a documented, repeatable methodology that auditors and examiners can test. FASB ASC 326 and OCC CECL supervisory guidance require that the provision and allowance adjustment process be documented in sufficient detail to enable external audit and regulatory examination; the external auditor issues a management letter comment on the day-two methodology gap, and OCC examiners treat the documentation deficiency as a control weakness in the financial reporting process, contributing to a qualified opinion risk on the allowance footnote.`,
    keywords: ['CECL', 'day-two provision', 'FASB ASC 326', 'OCC examination', 'allowance methodology'],
    demoRelevant: true,
    subTopic: 'cecl-allowance',
  },

];
