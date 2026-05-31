// seed-banking-dom04-credit-risk-part4.ts
// Banking genome patterns — Credit Risk Management
// Code range: B1180–B1239  (60 patterns)
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

export const BANKING_DOM04_CREDIT_RISK_PART4_PATTERNS: PatternSeed[] = [

  // ── Commercial Real Estate (B1180–B1191) ─────────────────────────────────────

  {
    code: 'B1180',
    name: 'CRE Office Portfolio DSCR Deterioration Not Triggering Enhanced Monitoring Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital holds $420M in office CRE loans where declining occupancy rates have pushed debt service coverage ratios below 1.10x on 38% of the portfolio, but the bank's enhanced monitoring protocol requires only DSCR below 1.00x to trigger special assets review, leaving a large sub-1.10x cohort in standard annual review cycles without accelerated financial reporting or site inspection requirements. OCC CRE examination guidance and interagency CRE concentration guidance (OCC 2006-46) require that banks with elevated CRE concentrations maintain monitoring protocols that detect deterioration early — including occupancy-rate covenants and DSCR covenant triggers at levels above 1.00x for high-risk sub-sectors; the monitoring threshold gap allows office portfolio stress to accumulate for 12–18 months before individual loans reach the 1.00x trigger and enter special assets management, by which point the remediation options are materially narrower.`,
    keywords: ['CRE credit risk', 'DSCR monitoring', 'OCC 2006-46', 'office portfolio', 'enhanced monitoring'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1181',
    name: 'CRE Appraisal Cycle Not Accelerated for Distressed Sub-Markets — Collateral Values Stale',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's CRE loan portfolio relies on appraisals ordered at origination and refreshed only at maturity or covenant breach, but eight sub-markets in the bank's geographic footprint have experienced cap rate expansion of 150–250 basis points since 2022, likely reducing collateral values by 20–35% on loans where the appraisal is more than 18 months old and rendering the bank's loan-to-value ratios significantly understated. OCC CRE appraisal guidance and interagency appraisal regulations require that banks obtain updated appraisals when there is a known deterioration in market conditions affecting collateral value, and the 2022–2023 interest rate shock combined with secular office demand decline constitutes precisely the type of market deterioration that triggers an accelerated appraisal requirement; without current appraisals, the bank cannot accurately assess collateral coverage, calculate expected loss under CECL, or communicate collateral risk to the board risk committee.`,
    keywords: ['CRE credit risk', 'appraisal requirements', 'OCC appraisal guidance', 'collateral valuation', 'LTV'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1182',
    name: 'CRE Construction Loan Budget Monitoring Relies on Borrower-Submitted Cost Reports Without Third-Party Verification',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's construction loan administration process approves draw requests based on cost completion certificates submitted by the borrower's general contractor without requiring an independent third-party inspector to verify percentage completion, creating a monitoring gap where a distressed developer can draw construction funds ahead of actual work completion to manage cash flow. OCC guidance on construction loan risk management and OCC Bulletin 2004-20 both require that construction loan draw controls include independent verification of work completion before funds are disbursed; the absence of third-party inspection on nine active construction loans with a combined outstanding balance of $85M means the bank cannot verify whether draw disbursements are aligned with actual project completion, and two loans are showing early warning signs of budget overrun that would not be detectable without independent inspection data.`,
    keywords: ['CRE credit risk', 'construction lending', 'OCC 2004-20', 'draw controls', 'third-party inspection'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1183',
    name: 'CRE Loan Maturity Extension Policy Lacks Formal Credit Re-Underwriting Requirement',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's workout and special assets team has granted 12-month maturity extensions on 14 CRE loans with aggregate balances of $118M under an extension policy that does not require a full credit re-underwriting, allowing extensions to be approved based on current debt payment history without updated property appraisals, borrower financial statements, or DSCR recalculation at current market interest rates. OCC troubled debt restructuring guidance (ASC 310-40, now ASC 326) and OCC examination standards for CRE workouts require that any modification that grants a concession to the borrower be supported by documented analysis of the borrower's ability to perform under the modified terms, including updated collateral valuation; the absence of re-underwriting on maturity extensions allows First Capital to classify loans as performing under the extension while their actual credit quality — including covenant compliance under current rates — may justify a criticized or classified risk rating.`,
    keywords: ['CRE credit risk', 'troubled debt restructuring', 'ASC 326', 'OCC examination', 'maturity extension'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1184',
    name: 'CRE Tenant Lease Rollover Risk Not Captured in Credit Underwriting at Origination',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's CRE underwriting model projects debt service coverage using current contracted rent rolls without scenario-testing the impact of tenant non-renewal at lease expiration, so loans are approved on properties where anchor tenants representing 40–60% of rental income have leases expiring within three years of loan maturity, creating an embedded rollover risk that is not visible in the credit file or reflected in the loan's risk rating. OCC CRE examination guidance requires that underwriting analysis for income-producing properties include a lease expiration schedule and a sensitivity analysis showing DSCR impact of major tenant non-renewal; the absence of lease rollover analysis in origination credit memos means the bank cannot identify, at origination, the subset of CRE loans whose DSCR would breach covenant thresholds if anchor tenants do not renew, understating the forward credit risk of the CRE portfolio.`,
    keywords: ['CRE credit risk', 'lease rollover risk', 'OCC examination', 'DSCR underwriting', 'commercial real estate'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1185',
    name: 'Interest Reserve Drawdowns on CRE Construction Loans Not Tracked Separately in CECL Model',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's CECL model applies uniform consumer-grade loss rate assumptions to the construction loan segment without distinguishing between interest reserve drawdowns — where the borrower is using capitalized interest from the loan proceeds to service the debt — and actual cash debt service payments, causing the model to classify loans current on their payment schedule even when all recent payments have been funded from the interest reserve rather than borrower cash flow. FASB ASC 326 and OCC CECL guidance require that loss estimation reflect the credit characteristics of the specific loan type; construction loans using interest reserves to maintain current payment status should receive higher expected loss assumptions because reserve depletion without corresponding project revenue generation is a leading indicator of default; the misclassification causes First Capital to understate expected lifetime losses on the construction portfolio by an estimated $3.8M.`,
    keywords: ['CRE credit risk', 'CECL', 'construction lending', 'interest reserve', 'FASB ASC 326'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1186',
    name: 'CRE Guarantor Financial Strength Not Periodically Updated — Recourse Value Unverified',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital underwrites a significant portion of its CRE portfolio with full or partial recourse guarantees from principals, but the credit monitoring process does not require periodic updating of guarantor financial statements beyond the initial loan origination, causing the bank to carry recourse value assumptions on guarantors whose net worth and liquidity may have deteriorated materially in the 2022–2024 real estate market downturn. OCC CRE examination guidance requires that guarantor financial strength be verified at origination and updated at each annual review cycle, particularly when the guaranteed loan is experiencing covenant stress; the failure to update guarantor financials means the bank cannot accurately assess the loss given default on its recourse CRE portfolio, as guarantors who appeared creditworthy at origination may lack the liquidity to perform on guarantees when called in a distressed market environment.`,
    keywords: ['CRE credit risk', 'guarantor analysis', 'OCC examination', 'loss given default', 'annual review'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1187',
    name: 'CRE Participations Purchased Without Independent Credit Analysis — Lead Bank Reliance',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital has purchased participations in 16 CRE loans originated by lead banks where the credit decision was made based solely on the lead bank's credit memorandum and risk rating without First Capital's credit team conducting independent underwriting analysis or site inspection, creating a concentration of credit decisions that rely entirely on the lead institution's underwriting standards and monitoring diligence. OCC guidance on purchased loan participations and OCC Bulletin 2001-48 both require that participating banks conduct independent credit analysis equivalent to what would be performed if the institution were the lead lender, recognizing that the lead bank's interests — particularly its fee income from origination — may not align with the participant bank's ongoing credit risk interests; the absence of independent analysis on $68M of participation balances creates a portfolio segment where First Capital's credit risk assessment is entirely dependent on the lead bank's continued diligence.`,
    keywords: ['CRE credit risk', 'loan participation', 'OCC 2001-48', 'independent analysis', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1188',
    name: 'CRE Environmental Liability Risk Not Assessed in Pre-Closing Phase I Review Process',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's CRE loan origination process requires a Phase I Environmental Site Assessment for loans above $5M, but the Phase I scope is contracted to the borrower's environmental consultant rather than an independent bank-selected firm, and the bank's credit team does not review Phase I reports for recognized environmental conditions (RECs) before loan approval in transactions where the Phase I is submitted concurrently with closing documents. OCC guidance on environmental risk in credit transactions and the ASTM E1527-21 standard for Phase I ESAs both require that lender-directed environmental assessment be conducted by a firm without a conflict of interest with the borrower; Phase I reports ordered by borrowers are subject to selection bias where consultants with a history of identifying RECs may not be retained, creating a systematic gap in the bank's environmental risk management that can result in inherited CERCLA liability on foreclosed properties.`,
    keywords: ['CRE credit risk', 'environmental risk', 'Phase I ESA', 'CERCLA', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1189',
    name: 'Multifamily CRE Rent Control Exposure Not Reflected in Underwriting Assumptions',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's multifamily CRE underwriting model projects rent growth using market-rate assumptions without differentiating between properties in jurisdictions with rent stabilization or rent control ordinances, causing DSCR projections on rent-controlled multifamily properties to overstate future cash flow by assuming unrestricted rent escalation that cannot be legally achieved on the existing tenant base. OCC CRE underwriting guidance requires that income projections reflect applicable legal constraints on revenue growth; for multifamily properties in New York, California, Oregon, and other rent-controlled jurisdictions, the absence of a rent control adjustment in the underwriting model produces DSCR projections at origination that are 15–25% above the achievable range under stabilized occupancy, creating a systematic optimism bias in the bank's multifamily portfolio credit quality assessment.`,
    keywords: ['CRE credit risk', 'multifamily lending', 'rent control', 'OCC examination', 'DSCR underwriting'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1190',
    name: 'CRE Loan Covenant Breach Waivers Granted Without Credit Committee Approval',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's credit administration process allows relationship managers to grant CRE loan covenant waivers for DSCR and occupancy covenants without credit committee approval when the waiver is characterized as a "technical" or "administrative" breach rather than a substantive financial covenant violation, creating a classification discretion that allows relationship managers to avoid credit committee scrutiny on covenant waivers that are, in substance, acknowledgments of borrower financial distress. OCC credit risk examination guidance and OCC Bulletin 2012-28 on credit risk management both require that all covenant waivers — including those characterized as technical — be subject to documented credit committee review and that the waiver rationale be maintained in the credit file; OCC examiners reviewing the CRE portfolio find that 22 waivers granted as "technical" in the prior 12 months were on loans where DSCR had declined more than 20% from origination, a pattern consistent with substantive covenant accommodation rather than administrative correction.`,
    keywords: ['CRE credit risk', 'covenant waiver', 'OCC 2012-28', 'credit committee', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1191',
    name: 'CRE Valuation Model for Impaired Loans Uses Automated AVM Rather Than Certified Appraisal',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's special assets team uses automated valuation models (AVMs) produced by a data aggregator to estimate collateral values on impaired CRE loans for CECL collateral-dependent measurement purposes, relying on AVM outputs that the vendor's own disclosure acknowledges have confidence intervals of ±25% on commercial properties with limited comparable sales data in the trailing 12 months. OCC appraisal regulations and ASC 326 collateral-dependent measurement requirements both require that impaired loan collateral valuations be based on appraisals or evaluations performed by qualified, independent appraisers rather than automated models; using AVMs for CECL collateral-dependent measurement on individually significant impaired CRE loans constitutes a regulatory appraisal requirement violation that OCC examiners treat as a financial reporting deficiency requiring immediate remediation with certified appraisals.`,
    keywords: ['CRE credit risk', 'appraisal regulations', 'CECL', 'ASC 326', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },

  // ── Agricultural Credit (B1192–B1199) ────────────────────────────────────────

  {
    code: 'B1192',
    name: 'Agricultural Operating Line Renewal Not Conditioned on Commodity Price Stress Test',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's agricultural lending team renews operating lines of credit for row crop borrowers based on prior-year crop income and current land value without requiring a commodity price stress test that shows the borrower's debt service coverage at 20% below projected corn and soybean prices, leaving the bank without visibility into borrower viability under a commodity price decline scenario that has historically occurred two to three times per decade. OCC agricultural lending guidance and FDIC community bank supervisory guidance on agricultural credit both require that operating line renewals for farms with material commodity price exposure include sensitivity analysis across a range of price outcomes; without commodity price stress testing at renewal, First Capital's agricultural portfolio may contain a cohort of borrowers who are cash-flow viable only at current elevated commodity prices and would be insolvent at 2015–2016 price levels.`,
    keywords: ['agricultural credit', 'commodity price risk', 'OCC agricultural guidance', 'operating line', 'stress testing'],
    demoRelevant: false,
    subTopic: 'agricultural-credit',
  },
  {
    code: 'B1193',
    name: 'Farm Real Estate Collateral Values Not Adjusted for Drainage Tile and Irrigation Asset Depreciation',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's agricultural loan underwriting uses FSA-reported land values and county assessor records to estimate farm real estate collateral values but does not independently assess the condition or remaining useful life of subsurface drainage tile and irrigation infrastructure that constitutes 15–25% of a productive farm's total value, causing collateral valuations to overstate recoverable value on farms where drainage systems are at or beyond useful life. OCC appraisal guidance for agricultural loans and FDIC agricultural examination guidance both require that collateral valuations for farm real estate capture the condition and productivity-enhancing improvements; drainage tile installed before 1985 has a typical useful life of 40–50 years and may be approaching the end of its productive life, and farms with deteriorating drainage infrastructure experience yield losses of 20–40% that reduce both income and collateral value in ways that are invisible in surface-level appraisals.`,
    keywords: ['agricultural credit', 'farm real estate', 'OCC appraisal guidance', 'collateral valuation', 'FDIC examination'],
    demoRelevant: false,
    subTopic: 'agricultural-credit',
  },
  {
    code: 'B1194',
    name: 'Crop Insurance Assignment Not Perfected as Collateral — Lien Priority Gap on Loss Proceeds',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital requires crop insurance as a condition of agricultural operating line approval but does not consistently file USDA FSA Form CCC-10 (Assignment of Payment) to perfect its lien on crop insurance indemnity payments, allowing borrowers in a crop loss year to collect USDA Federal Crop Insurance Corporation loss payments directly without those proceeds being applied to the bank's outstanding operating line balance. The Agricultural Credit Act and OCC agricultural lending guidance both identify crop insurance assignment as a critical collateral perfection step for agricultural lenders; without a perfected assignment, the bank's collateral package loses its primary loss recovery mechanism in a year when crop failure and borrower financial stress coincide, precisely the scenario where the insurance proceeds are most needed to prevent agricultural loan charge-offs.`,
    keywords: ['agricultural credit', 'crop insurance', 'USDA FSA', 'collateral perfection', 'OCC agricultural guidance'],
    demoRelevant: false,
    subTopic: 'agricultural-credit',
  },
  {
    code: 'B1195',
    name: 'Agricultural Loan Portfolio Segment Not Included in DFAST Adverse Scenario — Capital Understated',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's DFAST stress testing framework models credit losses for the commercial real estate, C&I, and consumer segments but treats the agricultural loan portfolio as a separate segment with a simplified static loss rate assumption rather than a dynamic scenario model, causing the severely adverse scenario to apply a uniform 3% loss rate assumption rather than modeling the portfolio-specific impact of a commodity price shock combined with a drought year on the bank's Midwest agricultural borrowers. OCC stress testing guidance requires that stress test scenarios be applied across all material portfolio segments with assumptions calibrated to each segment's specific risk drivers; agricultural credit losses in severely adverse scenarios have historically ranged from 5–15% when commodity price declines coincide with weather events, and the static 3% assumption understates agricultural portfolio credit losses under the severely adverse scenario by an estimated $6–9M.`,
    keywords: ['agricultural credit', 'DFAST', 'stress testing', 'OCC guidance', 'commodity price risk'],
    demoRelevant: false,
    subTopic: 'agricultural-credit',
  },
  {
    code: 'B1196',
    name: 'Operating Cycle Mismatch — Annual Review Cadence Does Not Align With Crop Marketing Year',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's agricultural loan annual review cycle is scheduled based on loan origination anniversary dates rather than the crop marketing year calendar, causing some borrowers to be reviewed in March before the prior year's crop is fully marketed and income is known, while others are reviewed in October before harvest, producing reviews that rely on projected rather than actual income for the most recent crop year. OCC agricultural credit examination guidance and FDIC community bank examination procedures for agricultural credit both require that annual reviews be timed to capture finalized crop marketing data; reviews conducted before the crop marketing year closes cannot verify actual income or commodity price realization, and the mismatch between the review calendar and the operating cycle causes systematic use of projected income that overstates borrower repayment capacity in years when commodity prices or yields fall short of projections.`,
    keywords: ['agricultural credit', 'annual review', 'OCC agricultural guidance', 'FDIC examination', 'crop marketing year'],
    demoRelevant: false,
    subTopic: 'agricultural-credit',
  },
  {
    code: 'B1197',
    name: 'FSA Guaranteed Loan Servicing Requirements Not Met — Guarantee Voided on Default',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital services a portfolio of FSA-guaranteed farm operating and ownership loans under USDA's Business and Industry Guaranteed Loan Program, but the bank's loan servicing team has not met FSA's required annual on-site visit and financial analysis reporting requirements on eight loans, creating a servicing deficiency that allows FSA to deny the guarantee when these loans default, exposing the bank to unguaranteed credit losses on the unguaranteed portion in addition to potential loss of the guarantee on the guaranteed portion. FSA lender servicing requirements under 7 CFR Part 762 specify minimum frequency of borrower contact, financial analysis, and collateral inspection as conditions of maintaining guarantee eligibility; the servicing gap represents both a credit risk management deficiency and a contractual performance failure that puts $12.4M of FSA guarantee value at risk of being voided if any of the affected loans default before the servicing deficiencies are remediated.`,
    keywords: ['agricultural credit', 'FSA guarantee', 'USDA', '7 CFR Part 762', 'loan servicing'],
    demoRelevant: false,
    subTopic: 'agricultural-credit',
  },
  {
    code: 'B1198',
    name: 'Water Rights Collateral for Irrigated Farmland Not Verified in Title Search',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital accepts irrigated farmland as collateral for agricultural real estate loans but does not consistently include water rights verification in the title search and appraisal scope, relying on borrower representation of water rights ownership and priority standing rather than independent verification through the state water rights database, creating a collateral valuation risk on properties where the irrigation water right may be junior-priority or subject to curtailment in drought years. OCC appraisal guidance for agricultural collateral and Western state water law doctrine both establish that irrigated farmland without confirmed senior water rights has materially lower productive value and collateral value than irrigated land with established priority rights; on 22 irrigated farmland loans totaling $38M, the bank has no independent documentation of water right priority, creating a potential collateral overvaluation of 30–50% on loans where junior water rights would be curtailed before senior users in a drought year.`,
    keywords: ['agricultural credit', 'water rights', 'OCC appraisal guidance', 'collateral valuation', 'irrigated farmland'],
    demoRelevant: false,
    subTopic: 'agricultural-credit',
  },
  {
    code: 'B1199',
    name: 'Agricultural Portfolio Stress Scenario Does Not Include Concurrent Input Cost Spike and Price Decline',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's agricultural credit stress testing models commodity price shocks and input cost increases as independent scenarios rather than as concurrent stresses, preventing the bank from modeling the margin compression event — rising fertilizer, fuel, and equipment costs coinciding with a commodity price decline — that characterized the 2015–2016 agricultural credit cycle and caused above-peer charge-offs at regional banks with concentrated agricultural portfolios. OCC stress testing guidance and FDIC agricultural examination guidance both require that stress scenarios for agricultural portfolios reflect the historical co-movement of input costs and output prices; the independence assumption in First Capital's agricultural stress model produces a severely adverse scenario loss estimate 40–60% below what a correlated stress scenario would produce, causing the bank to underestimate the capital required to absorb a combined input-price and commodity-price stress event.`,
    keywords: ['agricultural credit', 'stress testing', 'OCC guidance', 'FDIC examination', 'margin compression'],
    demoRelevant: false,
    subTopic: 'agricultural-credit',
  },

  // ── Leveraged Lending (B1200–B1209) ──────────────────────────────────────────

  {
    code: 'B1200',
    name: 'Leveraged Lending Total Debt to EBITDA Calculated on Adjusted EBITDA Without Addback Scrutiny',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's leveraged lending underwriting calculates total leverage multiples using borrower-prepared adjusted EBITDA figures that include management-estimated synergy addbacks, cost-reduction addbacks, and one-time expense exclusions without independent third-party quality of earnings verification, causing the bank to approve loans at stated leverage multiples that are 0.5–1.5x below the actual leverage on unadjusted EBITDA. OCC leveraged lending guidance (OCC 2013-9) and interagency leveraged lending guidance (2013) both require that leverage metrics used in underwriting reflect realistic and independently verifiable earnings levels, and both guidance documents specifically address the risk of inflated EBITDA addbacks in sponsor-backed transactions; the absence of quality-of-earnings verification on nine transactions totaling $145M means the bank has approved leveraged credits at nominal leverage multiples that would breach the bank's own 6.0x total leverage appetite threshold if calculated on verified EBITDA.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'EBITDA addbacks', 'quality of earnings', 'leverage multiple'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1201',
    name: 'Leveraged Loan Covenant-Lite Structure Lacks Maintenance Covenants — Early Warning Signal Absent',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital has participated in six leveraged loan syndications structured with incurrence-only covenants rather than maintenance covenants, meaning the bank has no contractual trigger to require borrower financial reporting or initiate workout discussions until the borrower chooses to incur additional debt — a structure that historically produces a 40–60% longer interval between borrower distress onset and bank detection compared to loans with maintenance covenants. OCC leveraged lending guidance and OCC examination findings from 2022–2024 both identify covenant-lite structures as a supervisory concern for regional banks that lack the portfolio diversification to absorb concentrated losses on deteriorating leveraged credits; the OCC expects banks below $100B in assets to document their risk management rationale for accepting covenant-lite structures, including how alternative monitoring mechanisms compensate for the absence of financial maintenance covenants.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'covenant-lite', 'maintenance covenant', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1202',
    name: 'Leveraged Lending Pipeline Not Counted Against Credit Appetite Until Commitment Letter Signed',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's leveraged lending credit risk appetite framework monitors outstanding funded and committed leveraged loan balances against the bank's appetite threshold, but loans in the deal pipeline — for which indicative terms have been issued and sponsor due diligence is in process — are not counted against appetite until the commitment letter is executed, creating a period during which multiple pipeline transactions can accumulate to an aggregate size that would breach appetite if committed simultaneously. OCC leveraged lending guidance and OCC credit risk examination procedures require that pipeline exposure be included in concentration monitoring because the bank's economic exposure to the transaction begins when it issues indicative terms and enters the deal process; the pipeline exclusion allows First Capital's leveraged lending concentration to nominally appear within policy limits while the bank's actual economic and reputational exposure to the leveraged lending market significantly exceeds reported limits.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'pipeline exposure', 'credit concentration', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1203',
    name: 'Leveraged Loan Stress Test Does Not Include EBITDA Haircut Reflecting Integration Risk',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's leveraged lending stress test applies a uniform 20% EBITDA haircut to all leveraged credits in the adverse scenario without differentiating between organic operating companies and post-acquisition platforms where integration risk — system migrations, workforce reductions, customer attrition — creates additional EBITDA volatility in the 12–24 months following close. OCC stress testing guidance for leveraged lending and OCC 2013-9 guidance both acknowledge that post-acquisition businesses face an initial period of elevated earnings volatility and that stress scenarios for such businesses should apply additional haircuts reflecting integration execution risk; the uniform EBITDA haircut approach understates credit risk on the 40% of First Capital's leveraged portfolio that represents post-acquisition integration platforms, producing stress test results that understate potential losses on the riskiest cohort of leveraged credits.`,
    keywords: ['leveraged lending', 'stress testing', 'OCC 2013-9', 'EBITDA haircut', 'integration risk'],
    demoRelevant: false,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1204',
    name: 'Leveraged Lending Annual Review Cycle Insufficient for Covenant-Lite Credits — Monitoring Gap',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's leveraged lending portfolio is subject to the standard annual credit review cycle regardless of loan structure, but covenant-lite credits that provide no quarterly or semi-annual financial maintenance tests create a monitoring gap where the bank's only formal touchpoint with borrower financial performance is the annual review rather than each quarterly reporting period available under maintenance covenant structures. OCC leveraged lending examination guidance and OCC 2013-9 both require enhanced monitoring for covenant-lite structures to compensate for the absence of contractual reporting triggers; the annual-only review cadence on covenant-lite leveraged credits means the bank may go 9–12 months without any structured assessment of borrower financial condition, creating a detection lag that allows deterioration to compound before the bank identifies it in the annual review cycle.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'covenant-lite', 'annual review', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1205',
    name: 'Leveraged Loan PIK Toggle Feature Obscures Borrower Cash Distress in Payment History',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `Three of First Capital's leveraged loan participations include payment-in-kind (PIK) toggle features that allow borrowers to elect PIK interest — capitalizing interest into the principal balance rather than paying cash — during periods of financial stress, and two borrowers have exercised the PIK toggle in the past 12 months without generating any internal credit risk alert because the loans remain technically current on their payment schedule under the PIK election. OCC examination guidance on leveraged lending and OCC credit risk monitoring expectations require that PIK elections be treated as early warning indicators of borrower cash flow stress rather than as neutral payment mechanism changes; the bank's credit monitoring system does not generate an alert when a PIK toggle is exercised, preventing the credit risk team from assessing whether the election reflects prudent cash management or distress-driven avoidance of interest payments that the borrower cannot afford.`,
    keywords: ['leveraged lending', 'PIK toggle', 'OCC examination', 'payment-in-kind', 'early warning'],
    demoRelevant: false,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1206',
    name: 'Leveraged Lending Loss Given Default Assumption Understates Recoveries on Distressed Debt Sale',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's leveraged lending CECL model uses a 45% loss given default (LGD) assumption calibrated to recovery data from the 2008–2015 default cycle, but the 2020–2024 distressed debt market has shown meaningfully lower recoveries on senior secured leveraged loans — averaging 55–65% LGD — due to deteriorating covenant packages and EBITDA overstatement at origination, causing the CECL model to systematically understate expected losses on the leveraged lending book. SR 11-7 model validation requirements and FASB ASC 326 both require that CECL model assumptions be calibrated to current and forward-looking conditions; the use of a pre-2020 LGD assumption that does not incorporate the structural changes in leveraged loan covenant quality and borrower leverage levels produces an allowance on the leveraged portfolio that underestimates lifetime expected losses by an estimated $4–7M.`,
    keywords: ['leveraged lending', 'loss given default', 'CECL', 'SR 11-7', 'FASB ASC 326'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1207',
    name: 'Leveraged Loan Restricted Payment Baskets Allow Sponsor Dividends That Impair Debt Service',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `Several of First Capital's leveraged loan credit agreements include permitted payment baskets that allow the sponsor to extract dividends from the operating company based on a percentage of cumulative EBITDA without a minimum DSCR maintenance test, creating a legal structure where the sponsor can dividend-recap the business during years of strong performance, reducing the equity cushion available to absorb credit deterioration in subsequent periods. OCC leveraged lending guidance (OCC 2013-9) requires that credit agreements include structural protections preventing equity distributions that would impair the borrower's ability to service debt; the unrestricted dividend basket provisions in three First Capital leveraged credits were accepted as market terms during the origination process without a formal structural risk assessment, and one borrower has subsequently paid a $42M dividend that reduced the equity-to-debt ratio from 42% to 18%, materially increasing First Capital's credit risk without a corresponding change in the loan's risk rating.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'restricted payments', 'dividend recapitalization', 'structural risk'],
    demoRelevant: false,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1208',
    name: 'Leveraged Lending Concentration Reported Gross — Net Hold After Syndication Not Tracked',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's leveraged lending concentration reporting to the board risk committee shows gross origination commitments rather than the bank's net hold position after intended and actual syndication, creating a reporting framework where the board sees commitment levels that are 2–3x the bank's actual retained risk and cannot observe the bank's true concentration exposure until quarterly financial reports reflect the completed syndication. OCC leveraged lending guidance and interagency guidance (2013) both require that credit risk reporting reflect the bank's actual economic exposure on a net-retained basis, separately identifying both the committed amount and the distribution plan; the gross reporting approach also obscures situations where the bank fails to achieve its intended distribution — a risk that increases during market volatility — and the board risk committee is not informed when distribution shortfalls cause the net hold to exceed the bank's intended retention level.`,
    keywords: ['leveraged lending', 'syndication risk', 'OCC 2013-9', 'credit concentration', 'board reporting'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1209',
    name: 'Leveraged Loan Sector Concentration in Software-as-a-Service Not Stress-Tested for ARR Erosion',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital has $78M in leveraged loan exposure to software-as-a-service (SaaS) companies where the underwriting model uses annual recurring revenue multiples and revenue growth assumptions, but the credit stress testing framework does not include a scenario testing the impact of customer churn acceleration — where net revenue retention deteriorates from 110% to 85% due to competitive pressure or macroeconomic customer budget cuts — on the SaaS borrower's ability to service leveraged debt. OCC leveraged lending guidance requires that stress testing assumptions be calibrated to the specific revenue model and economic sensitivity of the borrower's business; SaaS companies with high leverage multiples on ARR are structurally different from asset-heavy borrowers, and the absence of a churn-driven ARR erosion scenario means First Capital's leveraged SaaS exposure carries unquantified downside risk that does not appear in the standard EBITDA-focused stress test framework.`,
    keywords: ['leveraged lending', 'SaaS credit risk', 'OCC 2013-9', 'stress testing', 'ARR'],
    demoRelevant: false,
    subTopic: 'leveraged-lending',
  },

  // ── AI Credit Risk Part 4 (B1210–B1227) ──────────────────────────────────────

  {
    code: 'B1210',
    name: 'AI-Powered CRE Rent Roll Extraction Model Misses Embedded Rent Abatement Clauses',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital uses an NLP-based AI tool to extract rent roll data from commercial lease documents at CRE loan origination, but the extraction model has a 12% error rate on embedded rent abatement provisions — tenant free-rent periods, step-rent escalations with backward-looking clauses, and early termination options — that reduce effective rental income below face lease value, causing DSCR calculations at underwriting to be based on contract rent rather than effective rent. SR 11-7 model risk management requirements apply to NLP models used in material credit decisions, and OCC CRE underwriting guidance requires that income projections reflect actual expected cash flows rather than nominal contract amounts; when the AI extraction model overstates effective rent, it produces DSCR calculations that systematically overstate borrower repayment capacity, and the absence of a human review step for AI-extracted lease economics means the error propagates into the final underwriting decision without correction.`,
    keywords: ['AI credit risk', 'SR 11-7', 'NLP model', 'CRE underwriting', 'rent roll extraction'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1211',
    name: 'AI-Driven Credit Portfolio Rebalancing Recommendations Not Subject to Human Credit Officer Review',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's AI portfolio optimization system generates quarterly credit portfolio rebalancing recommendations — including suggested origination limits, sector appetite changes, and concentration reduction targets — that are presented directly to the portfolio management committee as data-driven recommendations without requiring a credit officer review that evaluates whether the recommendations are consistent with the bank's credit culture, relationship banking commitments, and community reinvestment obligations. SR 11-7 model governance requirements and OCC Bulletin 2021-18 on AI risk management require that AI-generated recommendations in material credit decisions be subject to human review by qualified credit professionals before implementation; the absence of a credit officer review gate means that the AI system's recommendations can drive credit appetite changes without assessment of whether the optimization model is producing outcomes aligned with the bank's strategic credit objectives and regulatory commitments.`,
    keywords: ['AI credit risk', 'SR 11-7', 'OCC Bulletin 2021-18', 'portfolio optimization', 'human review'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1212',
    name: 'Generative AI Credit Summary Tool Hallucinating Financial Ratios in Borrower Annual Reviews',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital deploys a generative AI tool that ingests borrower financial statements and prior credit files to produce first-draft annual review summaries, and relationship managers are submitting AI-generated summaries to credit committees with financial ratios — current ratio, interest coverage, debt-to-EBITDA — that contain hallucinated values derived from interpolation between prior years rather than calculation from the submitted financial statements. OCC Bulletin 2023-17 on AI risk management requires that generative AI outputs used in credit decisioning be verified against source documents before use; OCC examiners reviewing annual review files find that six credit committee presentations in the prior quarter contained AI-generated financial ratios that differed from the audited financial statements by more than 10%, each representing a credit underwriting documentation deficiency attributable to inadequate generative AI output verification controls.`,
    keywords: ['AI credit risk', 'generative AI', 'OCC Bulletin 2023-17', 'hallucination', 'annual review'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1213',
    name: 'AI Adverse Action Explanation Engine Produces Inconsistent Reasons Across Similar Borrower Profiles',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's consumer lending AI underwriting system uses a post-hoc explainability layer to generate adverse action reason codes, but the explanation engine's SHAP-based attribution produces different top-reason codes for materially similar borrower profiles — two applicants with identical credit scores, income, and debt ratios receive different adverse action reasons based on minor feature value differences that the credit model treats as nearly equivalent — creating inconsistent adverse action disclosure that CFPB examiners treat as a fair lending red flag. Regulation B Section 202.9 and CFPB supervisory expectations for AI adverse action notices require that reason codes reflect the actual factors that most significantly contributed to the adverse action; inconsistent reason code attribution across similar profiles is evidence that the explainability layer is not accurately representing the model's decision logic, which exposes the bank to CFPB enforcement risk for adverse action disclosure violations under ECOA.`,
    keywords: ['AI credit risk', 'adverse action', 'ECOA', 'Regulation B', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1214',
    name: 'AI Model for Agricultural Credit Scoring Trained on Midwest Farms — Bias Against Southeast Borrowers',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's AI agricultural credit scoring model was trained on a dataset composed primarily of Midwest corn and soybean operations and produces systematically lower credit scores for Southeast peanut, cotton, and tobacco operations — not because of actual credit risk differences, but because the model's feature weights reflect Midwest-specific financial patterns that do not generalize to Southeast commodity crop financial structures. ECOA and CFPB supervisory guidance on AI credit models require that institutions test AI scoring models for geographic and demographic bias before deployment, and FDIC agricultural examination guidance requires that credit assessment methodologies be appropriate for the specific agricultural operations being evaluated; the geographic training sample bias causes First Capital to decline or under-lend to creditworthy Southeast agricultural borrowers at a rate that constitutes potential disparate impact under ECOA's geographic factors analysis.`,
    keywords: ['AI credit risk', 'ECOA', 'agricultural credit', 'CFPB', 'model bias'],
    demoRelevant: false,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1215',
    name: 'AI Commercial Underwriting Model Score Drift Not Monitored — Population Shift After 2023 Rate Rise',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's AI commercial credit scoring model for middle-market C&I borrowers has not been retrained or formally re-validated since 2021, and model performance monitoring has not been conducted since 2022, leaving the bank without evidence that the model's score distribution and discriminatory power have remained stable after the 2022–2023 interest rate shock dramatically changed the financial profile of floating-rate middle-market borrowers. SR 11-7 model risk management guidance requires ongoing performance monitoring for models used in material credit decisions, including population stability index calculations and Gini coefficient tracking; OCC model risk examiners reviewing the bank's model inventory find that the commercial AI scoring model — which influences $680M of C&I credit decisions annually — has no documented performance monitoring since adoption, constituting a model risk management deficiency that requires a validation remediation plan.`,
    keywords: ['AI credit risk', 'SR 11-7', 'model drift', 'population stability', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1216',
    name: 'AI Loan Document Classification Model Misfiles Subordination Agreements — Lien Priority Risk',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital uses an AI document classification model to route and file loan documents in the loan document management system, but the model has an 8% misclassification rate on subordination agreements, inter-creditor agreements, and participation certificates — routing them to generic "loan correspondence" folders rather than the lien priority document file — causing lien perfection and priority documentation to be inaccessible to credit administration staff who need it to verify collateral priority at annual review. OCC documentation and record-keeping guidance and UCC Article 9 lien perfection requirements both depend on accurate and accessible lien priority documentation; when the AI classification model misfiled subordination agreements are not discovered until a borrower enters workout, First Capital may lack the documentation needed to assert its lien priority in a restructuring negotiation, exposing the bank to lien priority disputes that would have been avoidable with a functioning document classification system.`,
    keywords: ['AI credit risk', 'document classification', 'lien priority', 'OCC examination', 'UCC Article 9'],
    demoRelevant: false,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1217',
    name: 'AI-Generated Credit Risk Heatmap Aggregates Data Incorrectly — Board Receives Distorted Portfolio View',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's board risk committee receives a quarterly AI-generated credit risk heatmap that visualizes portfolio concentration, criticized asset rates, and watchlist migration trends, but the heatmap's underlying data pipeline aggregates exposures using the originating business line rather than the borrower's primary SIC code, causing commercial real estate loans originated through the middle-market C&I team to appear as C&I exposure in the heatmap rather than CRE, artificially reducing the displayed CRE concentration metric. BCBS 239 risk data aggregation requirements and OCC board reporting governance expectations require that risk reporting be accurate and represent the true nature of underlying exposures; the data pipeline error causes the board to receive a systematically understated view of CRE concentration that has persisted for six quarters without detection, representing both a data governance failure and a board risk reporting deficiency.`,
    keywords: ['AI credit risk', 'BCBS 239', 'board reporting', 'data aggregation', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1218',
    name: 'AI Early Warning Model False-Positive Rate Causes Alert Fatigue — True Deterioration Signals Missed',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's AI commercial credit early warning system generates alerts for 22% of the portfolio in any given quarter — a false-positive rate that causes credit administration staff to become desensitized to alerts and to develop informal triage practices that override AI alerts without formal review documentation, resulting in true deterioration signals being dismissed by alert-fatigued credit officers using the same informal override process applied to the majority of false-positive alerts. SR 11-7 model performance monitoring requirements and OCC early warning system governance expectations require that alert models be calibrated to maintain actionable signal-to-noise ratios; an alert system with a 22% portfolio trigger rate is generating approximately 440 alerts per quarter for a 2,000-loan portfolio, a volume that exceeds the credit administration team's capacity for formal review and creates documented evidence of systematic override practices that OCC examiners cite as a model risk governance deficiency.`,
    keywords: ['AI credit risk', 'SR 11-7', 'early warning', 'alert fatigue', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1219',
    name: 'AI Credit Model Vendor Contract Does Not Include Source Code Escrow — Model Risk Unmitigated',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital licenses an AI credit scoring model from a fintech vendor whose contract does not include source code escrow, model documentation disclosure, or a continuity plan requiring the vendor to transfer model parameters to the bank in the event of vendor insolvency or business discontinuation, creating a third-party concentration risk in a model that underpins 35% of the bank's consumer credit decisions. OCC Bulletin 2023-17 on third-party risk management and OCC guidance on vendor model risk management both require that banks maintain the ability to independently operate or replicate models used in material credit decisions, particularly when vendor failure would immediately impair origination capacity; the absence of source code escrow and model documentation means First Capital would face an immediate origination capability gap if the vendor ceased operations, with no documented contingency for transitioning to an alternative scoring methodology.`,
    keywords: ['AI credit risk', 'OCC Bulletin 2023-17', 'vendor model risk', 'TPRM', 'source code escrow'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1220',
    name: 'AI Sentiment Analysis of Earnings Calls Used in Commercial Credit Without Model Validation',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial credit team uses an AI natural language processing tool that analyzes public company earnings call transcripts to generate sentiment scores used as supplementary factors in commercial credit risk assessments, but the NLP sentiment tool has never been validated as a model under SR 11-7, lacks documentation of its training data and methodology, and has not been tested for whether its sentiment scores are predictive of actual credit performance in First Capital's specific borrower population. SR 11-7 model risk management guidance requires that any quantitative tool used to inform material credit decisions be registered as a model, documented, and independently validated; using an unvalidated NLP sentiment tool in commercial credit assessments creates an SR 11-7 model inventory gap and, if the sentiment scores are later shown to produce biased assessments for borrowers from specific industries or geographic regions, constitutes an unmitigated fair lending risk.`,
    keywords: ['AI credit risk', 'SR 11-7', 'NLP model', 'model validation', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1221',
    name: 'AI Loan Origination System Decisioning Engine Lacks Audit Trail for Automated Decisions',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital's AI-driven consumer loan origination platform makes automated approval decisions for applications below a $25,000 threshold without generating a permanent audit trail that records the model inputs, model score, decision threshold applied, and any rule-based overrides that contributed to the automated outcome, preventing after-the-fact reconstruction of the basis for any specific consumer credit decision. CFPB supervisory guidance on automated underwriting and OCC Bulletin 2021-18 on AI risk management require that automated credit decisions be fully auditable, with system-generated records that allow regulators to reconstruct the exact decision logic applied to any individual application; without a complete audit trail, First Capital cannot respond to individual CFPB consumer complaint investigations, cannot perform the disparate impact analysis required by ECOA, and cannot demonstrate to OCC examiners that the automated decisioning system operated consistently with its documented policies and procedures.`,
    keywords: ['AI credit risk', 'OCC Bulletin 2021-18', 'automated underwriting', 'audit trail', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1222',
    name: 'AI Credit Limit Increase Algorithm Targets Revolving Customers Near Regulatory Complaint Thresholds',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's AI credit limit management system for consumer credit cards uses a revenue optimization objective that produces limit increase offers concentrated on customers near their existing credit limit, including customers with high utilization rates who are statistically more likely to be in financial distress, and the system's optimization targets have not been reviewed for compliance with the CFPB's unfair, deceptive, or abusive acts or practices (UDAAP) standards. CFPB supervisory guidance on credit card account management and OCC consumer compliance guidance require that limit increase programs serve a genuine consumer benefit and not exploit financially vulnerable customers; an AI system that targets high-utilization customers for limit increases — maximizing short-term interest income while likely worsening the financial position of customers already carrying high revolving balances — is a UDAAP risk pattern that CFPB examiners have cited in consent orders against larger card issuers.`,
    keywords: ['AI credit risk', 'CFPB UDAAP', 'credit card', 'account management', 'OCC consumer compliance'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1223',
    name: 'AI-Based Covenant Compliance Chatbot Provides Incorrect Waiver Guidance to Borrowers',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital has deployed an AI chatbot in its commercial client portal that answers borrower questions about covenant compliance reporting requirements and waiver request procedures, but the chatbot's responses have been shown in internal testing to misquote covenant definition language and misstate the bank's waiver approval process — including incorrectly telling two borrowers that covenant testing had been waived when it had not, and one borrower that a waiver request had been approved when it was still under review. OCC operational risk guidance and OCC Bulletin 2023-17 on AI risk management require that AI tools interacting with customers in ways that could affect their legal rights or contractual obligations be subject to output accuracy testing and human escalation protocols; the covenant compliance chatbot's errors created legal ambiguity about the bank's waiver positions and required legal analysis to confirm that no contractual waiver had been inadvertently created by the AI's erroneous responses.`,
    keywords: ['AI credit risk', 'OCC Bulletin 2023-17', 'generative AI', 'covenant compliance', 'operational risk'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1224',
    name: 'AI-Assisted Collateral Monitoring Uses Stale Property Data — Impairment Not Detected',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's AI collateral monitoring system for commercial and industrial loans ingests public record data — UCC filings, property tax records, and business license data — to detect collateral deterioration signals, but the data feeds are updated quarterly rather than in near-real time, creating a monitoring lag during which a borrower can sell or encumber collateral assets between update cycles without triggering any alert in the AI monitoring system. SR 11-7 model performance requirements and OCC collateral monitoring guidance require that collateral monitoring systems have data refresh frequencies commensurate with the collateral risk of the underlying portfolio; for C&I loans secured by inventory and receivables that can turn over within days, quarterly data updates are insufficient to detect the rapid collateral depletion patterns that characterize borrower distress events, and the AI system's structural latency has contributed to three instances where collateral impairment was discovered during annual review rather than through the real-time monitoring system.`,
    keywords: ['AI credit risk', 'SR 11-7', 'collateral monitoring', 'data latency', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1225',
    name: 'AI-Powered Loan Pricing Tool Produces Disparate Pricing Outcomes by Borrower Zip Code',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital's AI loan pricing model for small business loans incorporates geographic features — including business district type, county-level economic indicators, and neighborhood commercial activity indices — that are correlated with race and ethnicity at the census tract level, producing risk-adjusted spread recommendations that are systematically 35–55 basis points higher for businesses in majority-minority zip codes compared to businesses with equivalent credit profiles in majority-White zip codes. ECOA and the CRA require that pricing tools not use proxies for protected class characteristics, and CFPB and DOJ have brought enforcement actions against institutions using zip code-based variables in AI pricing tools without demonstrating that the geographic variables are not acting as demographic proxies; the absence of a disparate impact analysis on First Capital's AI pricing model constitutes a fair lending controls gap that CFPB examiners identify as a supervisory priority in AI credit risk examinations.`,
    keywords: ['AI credit risk', 'fair lending', 'ECOA', 'disparate pricing', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1226',
    name: 'AI Model Inventory Incomplete — Shadow AI Tools Used by Credit Team Not Registered Under SR 11-7',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description:
      `First Capital's SR 11-7 model inventory contains 18 registered credit models, but an internal model risk audit identifies 11 additional AI tools — including a GPT-4-based credit memo generator, three Python scripts that produce credit scoring adjustments, and two vendor API integrations that generate risk assessments — being used by the credit team in material credit decisions without registration, validation, or governance oversight. OCC model risk examination guidance and SR 11-7 both define a model as any quantitative tool used in material financial decisions, regardless of whether it is developed internally or accessed via a vendor API; the shadow AI tools represent an SR 11-7 model inventory gap that OCC examiners characterize as a systemic model governance failure, particularly because two of the unregistered tools are influencing credit decisions on loans that OCC has identified as exhibiting early stress indicators, meaning the models are being used without validation in the highest-risk segment of the portfolio.`,
    keywords: ['AI credit risk', 'SR 11-7', 'model inventory', 'shadow AI', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },
  {
    code: 'B1227',
    name: 'AI Workout Recommendation Engine Produces Forbearance Suggestions Without Regulatory Classification Review',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's special assets team uses an AI tool to generate workout strategy recommendations — including forbearance terms, modification structures, and charge-off timing — for distressed commercial credits, but the AI recommendations are implemented without a concurrent review of whether the proposed modification meets the ASC 326 definition of a troubled debt restructuring or qualifies as a short-term modification under CARES Act guidance, creating workout transactions whose accounting classification is determined after implementation rather than as a prerequisite. OCC examination guidance on troubled debt restructuring and FASB ASC 326-20-35-18 through 35-20 require that modification classification determinations be made before terms are offered to the borrower, because offering concession terms to a borrower in financial difficulty constitutes a TDR regardless of whether the bank subsequently recognizes it as such; AI workout recommendations that bypass accounting classification review expose the bank to allowance restatement risk and OCC criticism for inadequate TDR identification processes.`,
    keywords: ['AI credit risk', 'troubled debt restructuring', 'ASC 326', 'SR 11-7', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-part4',
  },

  // ── Climate Credit Risk (B1228–B1239) ─────────────────────────────────────────

  {
    code: 'B1228',
    name: 'Physical Climate Risk Scenarios Not Integrated Into DFAST Severely Adverse Scenario Design',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's DFAST stress testing framework uses the Federal Reserve's published macro scenarios — GDP contraction, unemployment spike, equity market decline — without incorporating a physical climate risk overlay that models the credit impact of an acute weather event on the bank's Gulf Coast and coastal Atlantic CRE and agricultural loan portfolios, leaving the severely adverse scenario without any modeling of the correlated credit losses that would follow a Category 4 hurricane or multi-year drought in the bank's geographic footprint. OCC 2023 climate risk principles and interagency climate risk guidance require that banks with material physical climate risk exposures incorporate climate-linked scenarios into credit stress testing; the absence of a physical climate overlay creates a structural gap in the severely adverse scenario that OCC examiners identify as inconsistent with the bank's actual geographic risk concentration, and produces stress capital estimates that understate the capital impact of the most plausible severely adverse scenario for a bank with First Capital's geographic footprint.`,
    keywords: ['climate credit risk', 'physical risk', 'DFAST', 'OCC climate guidance', 'stress testing'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1229',
    name: 'Transition Risk Not Modeled for Carbon-Intensive C&I Borrowers — Policy Scenario Gap',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's C&I loan portfolio includes $95M in loans to oil and gas production, coal transportation, and petrochemical manufacturing companies whose business models are materially exposed to carbon pricing policies, emissions regulations, and energy transition demand shifts, but the bank's credit risk assessment and CECL loss estimation do not incorporate a transition risk scenario that models borrower cash flow deterioration under a plausible accelerated decarbonization policy environment. OCC 2023 climate risk principles and TCFD (Task Force on Climate-related Financial Disclosures) framework both require that banks with material transition risk exposures develop transition risk scenarios sufficient to assess the potential credit impact on carbon-intensive borrowers; the absence of transition risk modeling means First Capital cannot quantify whether its C&I portfolio contains a climate-transition credit risk concentration that exceeds the bank's risk appetite under a policy-driven decarbonization scenario.`,
    keywords: ['climate credit risk', 'transition risk', 'OCC climate guidance', 'TCFD', 'carbon-intensive lending'],
    demoRelevant: false,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1230',
    name: 'Flood Zone Collateral Not Verified Against FEMA Map Service Center — Insurance Gap Risk',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's mortgage and CRE loan origination process relies on a third-party flood zone determination service to identify properties in FEMA Special Flood Hazard Areas (SFHA), but the bank does not verify flood zone determinations against the FEMA Map Service Center for properties near flood zone boundaries or for properties where the most recent FEMA map revision occurred after the third-party determination was obtained at origination, creating insurance compliance gaps where borrowers are not required to maintain flood insurance on properties that have been reclassified into SFHA since closing. The National Flood Insurance Program's mandatory purchase requirements under the Flood Disaster Protection Act and OCC flood insurance examination procedures require that lenders verify flood zone status at origination and at key loan milestones such as refinancing or modification; undetected post-origination reclassifications into SFHA mean First Capital holds collateral on properties that lack mandatory flood insurance, creating an uninsured loss risk on an estimated $22M of loans in dynamic flood zone boundary areas.`,
    keywords: ['climate credit risk', 'flood zone', 'FEMA', 'flood insurance', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1231',
    name: 'Climate Risk Disclosure in TCFD Report Not Reconciled With Internal Credit Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital publishes a voluntary TCFD climate risk report that describes climate-related financial risks in qualitative terms, but the climate risk assessments and scenario narratives in the TCFD report are prepared by the corporate sustainability team without reconciliation against the credit risk team's internal climate risk analysis, creating a disclosure document that uses different scenario assumptions and risk characterizations than the bank's own internal credit risk management processes. OCC climate risk guidance and SEC proposed climate disclosure rules both require that publicly disclosed climate risk information be grounded in the institution's actual risk management processes; the disconnect between the TCFD report's qualitative risk narratives and the credit risk team's internal quantitative assessments creates a disclosure credibility risk where OCC examiners or SEC reviewers can identify material inconsistencies between the bank's stated climate risk management approach and its actual credit risk methodology.`,
    keywords: ['climate credit risk', 'TCFD', 'OCC climate guidance', 'climate disclosure', 'SEC reporting'],
    demoRelevant: false,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1232',
    name: 'Wildfire Risk Exposure in California CRE Portfolio Not Captured in LGD Assumptions',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital holds $48M in CRE and agricultural loans secured by properties in California counties where Cal Fire identifies elevated wildfire risk, but the bank's CECL loss given default (LGD) assumptions for this collateral use statewide California real estate recovery rates rather than adjusting for the documented 20–35% discount in property values and insurance availability in high-wildfire-risk zones following the 2017–2021 California wildfire events. OCC 2023 climate risk principles and interagency climate risk guidance require that physical climate risk — including acute events such as wildfire — be incorporated into credit loss estimation methodologies for portfolios with material geographic exposure to these hazards; the use of statewide LGD averages on high-wildfire-risk collateral understates expected losses on the California portfolio by an estimated $4–7M under a forward-looking physical risk assessment.`,
    keywords: ['climate credit risk', 'wildfire risk', 'LGD assumptions', 'OCC climate guidance', 'CECL'],
    demoRelevant: false,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1233',
    name: 'Physical Climate Risk Data Provider Scores Not Validated for Predictive Accuracy Before Use in Underwriting',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital contracts with a physical climate risk data provider to generate property-level climate risk scores for CRE and mortgage loan originations, but has not validated whether these scores are predictive of actual property value impairment, insurance availability loss, or collateral deterioration in the bank's own geographic markets, relying instead on the vendor's general accuracy claims and marketing materials as justification for using the scores in underwriting. SR 11-7 model risk requirements apply to vendor-provided tools used in material credit decisions, and OCC Bulletin 2023-17 on third-party risk management requires that banks verify the fitness-for-purpose of vendor tools for their specific use case; climate risk scoring tools calibrated to national property databases may perform poorly in specific regional markets where local flood and wildfire dynamics differ significantly from national averages, and using unvalidated vendor scores in underwriting creates an SR 11-7 model risk deficiency.`,
    keywords: ['climate credit risk', 'SR 11-7', 'OCC Bulletin 2023-17', 'physical risk scoring', 'vendor validation'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1234',
    name: 'Climate Risk Not Included in New Product Approval Process for Green Finance Products',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital has launched a green finance lending program for commercial solar and wind energy projects without incorporating climate transition risk assessment into the new product approval process, specifically failing to model how changes in federal investment tax credit availability, net metering policy reversals, or interconnection queue backlogs could impair the cash flows of financed projects and reduce the bank's ability to recover principal on renewable energy loans that are often structured with project cash flow as the primary repayment source. OCC guidance on new product risk management and OCC climate risk principles both require that climate-related financial risks be assessed in the product approval process for products whose performance is directly tied to climate or energy policy; the omission of policy risk analysis from the green finance product approval documentation creates a structural gap where the bank's most climate-focused products carry unquantified transition risk exposure.`,
    keywords: ['climate credit risk', 'green finance', 'OCC climate guidance', 'transition risk', 'new product approval'],
    demoRelevant: false,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1235',
    name: 'Chronic Physical Climate Risk — Sea Level Rise — Not Modeled for Coastal Mortgage Portfolio',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital holds $112M in residential mortgage loans secured by coastal properties in Florida, North Carolina, and Virginia where NOAA sea level rise projections indicate 0.5–1.5 feet of relative sea level rise over a 20–30 year horizon — within the remaining term of many mortgage loans in the portfolio — but the bank's credit risk framework does not model the chronic physical climate risk of gradual property value decline from sea level rise, flood frequency increase, and insurance market withdrawal in high-risk coastal communities. OCC 2023 climate risk principles require that banks assess both acute and chronic physical climate risks for material portfolios; the absence of chronic sea level rise modeling means First Capital has no estimate of the portfolio-level credit exposure to long-horizon property value decline, creating a strategic planning gap where the bank's mortgage origination strategy in coastal markets may be producing long-duration exposures to structural collateral value impairment that will not manifest for 10–15 years but are already measurable in flood insurance premium trends.`,
    keywords: ['climate credit risk', 'sea level rise', 'OCC climate guidance', 'chronic physical risk', 'mortgage portfolio'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1236',
    name: 'Climate Risk Appetite Statement Not Quantitative — No Sector Limits for Carbon-Intensive Industries',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's enterprise risk appetite statement includes a qualitative statement that the bank will "manage climate-related financial risks consistent with regulatory expectations" but does not set quantitative sector concentration limits for carbon-intensive industries, portfolio-level financed emissions targets, or climate risk score thresholds for new originations, leaving climate risk management entirely dependent on qualitative judgment without measurable boundaries that the board can monitor or examiners can evaluate. OCC 2023 climate risk principles and interagency climate risk guidance both state that a sound climate risk governance framework includes quantitative risk appetite metrics that translate the institution's qualitative climate risk posture into measurable limits and escalation thresholds; without quantitative climate risk appetite metrics, First Capital cannot demonstrate to OCC examiners that its climate risk governance meets supervisory expectations, and the absence of measurable limits means the bank has no internal mechanism to detect when climate risk concentration is growing toward levels that would concern the board.`,
    keywords: ['climate credit risk', 'OCC climate guidance', 'risk appetite', 'climate governance', 'interagency guidance'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1237',
    name: 'Insurance Withdrawal From Coastal Markets Not Monitored as Collateral Impairment Trigger',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's collateral monitoring system for residential mortgage and CRE loans tracks property tax payments and UCC filing changes but does not monitor insurance market withdrawal events — where primary insurers exit a geographic market, forcing borrowers to obtain coverage from state FAIR Plans at 2–3x the prior premium — that are a leading indicator of collateral value decline and borrower financial stress in coastal Florida, Louisiana, and California markets. OCC guidance on collateral monitoring and climate risk management guidance both require that collateral monitoring reflect the risk drivers relevant to the specific collateral type and geography; insurance market withdrawal is a documented, market-observable climate risk signal that precedes property value decline by 12–36 months in the insurance economics literature, and the absence of insurance market monitoring as a collateral trigger means First Capital's coastal loan book does not generate early warning alerts as the insurance environment deteriorates.`,
    keywords: ['climate credit risk', 'insurance withdrawal', 'OCC climate guidance', 'collateral monitoring', 'coastal risk'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1238',
    name: 'Climate Risk Data Sourcing Relies on Single Vendor — No Independent Verification of Scores',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital sources all property-level climate risk data from a single vendor and uses that vendor's proprietary scores — without independent verification against government datasets such as FEMA flood maps, NOAA storm surge projections, and Cal Fire hazard maps — creating a single-point dependency where the vendor's methodology changes, scoring errors, or data coverage gaps affect the bank's entire climate risk assessment framework without detection. OCC Bulletin 2023-17 on third-party risk management and OCC climate risk guidance both require that critical data inputs to risk management processes be subject to validation and that single-vendor dependencies for risk-critical data be mitigated through alternative source verification; the absence of independent verification means that when the vendor updated its flood risk model in Q3 2024 — producing 15% lower risk scores for coastal Florida properties — First Capital accepted the score reduction without any independent check against FEMA's FIRM map data, which showed no corresponding reduction in actual flood risk for those properties.`,
    keywords: ['climate credit risk', 'OCC Bulletin 2023-17', 'vendor risk', 'climate data', 'TPRM'],
    demoRelevant: false,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1239',
    name: 'Climate Stress Testing Results Not Disclosed in Annual Report — Supervisory Expectation Unmet',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital has completed internal climate risk scenario analysis consistent with OCC climate risk guidance, but the results of the climate stress testing — including the bank's estimated credit losses under physical and transition risk scenarios — are not disclosed in the annual report or any public filing, leaving regulators and market participants without the transparency that OCC 2023 climate risk principles and TCFD recommendations both identify as an expected component of mature climate risk governance for institutions above $10B in assets. OCC examiners reviewing the bank's climate risk governance find that the absence of public climate risk disclosure is inconsistent with the interagency climate risk principles, which state that covered institutions should disclose material climate-related financial risks using established frameworks such as TCFD; the non-disclosure also creates a reputational risk that the bank's climate risk posture is less advanced than peer institutions that have published TCFD-aligned climate risk disclosures, potentially affecting the bank's access to ESG-oriented institutional deposit and capital sources.`,
    keywords: ['climate credit risk', 'TCFD', 'OCC climate guidance', 'climate disclosure', 'interagency principles'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },

];
