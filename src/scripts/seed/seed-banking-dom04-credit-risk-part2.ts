// seed-banking-dom04-credit-risk-part2.ts
// Banking genome patterns — Credit Risk & Underwriting
// Code range: B1060–B1119  (60 patterns)
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

export const BANKING_CREDIT_RISK_PART2_PATTERNS: PatternSeed[] = [

  // ── Commercial Real Estate: DFAST / HVCRE / FIRREA / CRE Concentration ─────
  {
    code: 'B1060',
    name: 'CRE DFAST Stress Scenario Not Calibrated to Office Vacancy Shock',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's CRE stress testing under DFAST uses a generic commercial real estate price decline assumption without differentiating between office, multifamily, and industrial sub-sectors, applying a uniform 25% CRE price decline that significantly underestimates the severity of vacancy-driven office value deterioration. Federal Reserve DFAST guidance and OCC supervisory expectations for CRE concentration stress testing require that banks with material sub-sector concentration apply segment-specific stress factors that reflect the documented vacancy and cap rate dynamics of each asset type; the undifferentiated scenario causes the bank to model $28M of stressed CRE losses against a segment that independent valuations suggest could generate $55–70M of charge-offs under a realistic office vacancy stress path.`,
    keywords: ['DFAST', 'CRE concentration', 'stress testing', 'OCC guidance', 'office CRE'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1061',
    name: 'HVCRE Designation Compliance Lapse on Construction Loan Portfolio',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital applies HVCRE (High Volatility Commercial Real Estate) risk weight designations to new acquisition, development, and construction loans based on origination-time borrower equity contributions, but does not have a systematic process to re-evaluate the HVCRE designation when subsequent draws or equity injections change the loan-to-value ratio relative to the project's contributed capital. Basel III/IV HVCRE risk weight rules under the regulatory capital framework require that a loan retain its HVCRE designation until the qualifying conditions — appraised value reflecting completed project, borrower equity at least 15% of project costs — are met and documented; the absence of ongoing HVCRE re-evaluation results in 18 construction loans continuing to carry a 150% risk weight that the capital team is unable to release even after project milestones are met, overstating risk-weighted assets by an estimated $12M.`,
    keywords: ['HVCRE', 'Basel III', 'construction lending', 'risk-weighted assets', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1062',
    name: 'CRE Appraisal Independence Violation — FIRREA Compliance Gap in Review Process',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's CRE appraisal process allows relationship managers to select the appraiser from an approved panel and transmit the property-specific engagement details directly to the appraiser, creating a channel of influence between the lending function and the appraiser that is prohibited under FIRREA Title XI and OCC appraisal independence guidance. FIRREA requires that regulated institutions ensure appraisals are conducted independently of the lending function; OCC examiners reviewing First Capital's appraisal process find that RM-to-appraiser communications without routing through the appraisal management desk constitute a FIRREA independence violation in 34% of sampled CRE appraisals, resulting in a Matters Requiring Attention that requires the bank to restructure the appraisal ordering process within 90 days.`,
    keywords: ['FIRREA', 'appraisal independence', 'CRE underwriting', 'OCC guidance', 'FIRREA Title XI'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1063',
    name: 'CRE Concentration Supervisory Guidance Threshold Breached Without Board Action Plan',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's CRE portfolio has grown to 340% of total risk-based capital, exceeding the interagency supervisory guidance threshold of 300% without a board-approved concentration management plan addressing portfolio growth limits, enhanced stress testing frequency, and risk appetite alignment. The 2006 interagency CRE concentration guidance (OCC 2006-46) and subsequent OCC supervisory communications require that banks operating above the 300% threshold demonstrate a documented board-level response including a risk management framework commensurate with the elevated concentration; the absence of a formal action plan — documented in board minutes and communicated to OCC supervisors — converts a supervisory guidance threshold breach into a governance deficiency that OCC examiners treat as an aggravating factor in the bank's consent order remediation assessment.`,
    keywords: ['CRE concentration', 'OCC 2006-46', 'interagency guidance', 'Basel III', 'board governance'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1064',
    name: 'Mixed-Use CRE Asset Classification Error — Office Reclassified Without Appraiser Update',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital has a mixed-use CRE portfolio segment where properties with a combination of retail and office space were originally classified as retail CRE for risk weighting and concentration reporting purposes; as retail tenants vacate and space is repurposed to office use, the asset classification has not been updated in the loan origination system, causing the concentration monitoring system to underreport office CRE exposure and overreport retail CRE against OCC CRE concentration thresholds. FIRREA appraisal guidance and OCC examination expectations require that collateral classification reflect the property's current use and income-generating characteristics; the classification lag means the bank's reported office CRE concentration is approximately 15% below its actual level, understating the segment's exposure to the office vacancy stress scenario used in DFAST.`,
    keywords: ['FIRREA', 'CRE concentration', 'OCC guidance', 'collateral classification', 'DFAST'],
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1065',
    name: 'CRE Interest Rate Cap Expiry Not Tracked — Floating Rate Risk Unmonitored on Maturing Caps',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital requires interest rate caps as a condition of floating-rate CRE loan origination to protect DSCR from rate increases, but the bank's loan administration system does not track cap expiry dates or alert the portfolio management team when a cap is approaching expiration. As 2021–2022 vintage three-year caps begin expiring with underlying SOFR at 5.3%, 28 CRE loans that relied on rate caps to maintain DSCR compliance are now exposed to full floating-rate risk without replacement caps; OCC credit monitoring guidance and Basel III interest rate risk in the banking book (IRRBB) principles require that rate cap dependencies be monitored as a component of CRE credit risk management, and the expiry tracking gap has caused DSCR breaches to emerge without early warning.`,
    keywords: ['CRE concentration', 'IRRBB', 'Basel III', 'OCC guidance', 'interest rate cap'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1066',
    name: 'AI CRE Appraisal Tool Used Without FIRREA Independence Validation',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's commercial real estate team deploys an AI-powered automated valuation model (AVM) to produce desk-review appraisals for CRE loans below $500K, using the AVM output directly in the credit file without a licensed appraiser review. FIRREA Title XI and OCC appraisal regulations require that federally regulated transactions meet minimum appraisal standards, and OCC guidance on appraisal evaluation thresholds specifies the conditions under which an evaluation rather than a full appraisal may be used; the AI AVM does not constitute a FIRREA-compliant evaluation because it lacks the disclosure, market condition analysis, and appraiser certification required by OCC appraisal guidelines, creating a portfolio-wide FIRREA compliance deficiency across 85 loans originated using the AVM-only process.`,
    keywords: ['AI AVM', 'FIRREA', 'OCC guidance', 'CRE underwriting', 'appraisal independence'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },

  // ── Leveraged Lending: OCC Guidance / EBITDA / Covenant-Lite / Board Approval ──
  {
    code: 'B1067',
    name: 'EBITDA Addback Documentation Absent From Leveraged Loan Credit Files',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's leveraged lending underwriting allows sponsors to claim EBITDA addbacks for synergies, cost savings, and one-time charges that inflate the reported adjusted EBITDA used in leverage ratio calculations; the credit files document the addback amounts but do not include the sponsor's supporting analysis, methodology, or management representations required to verify that addbacks are quantifiable and achievable. OCC leveraged lending guidance (OCC 2013-9) and the interagency leveraged lending guidelines require that EBITDA adjustments be documented with supporting analysis justifying their inclusion; without documentation, OCC examiners treat addbacks as unverified management estimates, recalculate leverage ratios excluding disputed addbacks, and find that three transactions exceed the guidance's 6x leverage threshold when tested on unadjusted EBITDA.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'EBITDA addback', 'OCC examination', 'credit documentation'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1068',
    name: 'Covenant-Lite Leveraged Loan Portfolio Growth Without Board-Approved Risk Appetite Update',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's leveraged lending portfolio has shifted to 65% covenant-lite (incurrence-only tests) from 30% two years ago, driven by competitive market conditions and sponsor pressure; the bank's credit risk appetite statement still references a covenant maintenance framework as the standard structure and has not been updated by the board to reflect or explicitly approve the covenant-lite migration. OCC leveraged lending guidance (OCC 2013-9) and OCC bulletin 2015-4 both require board-level risk appetite documentation that explicitly addresses leveraged lending structure types and the governance applicable to covenant-lite structures; the gap between the documented appetite and actual portfolio composition is an examination finding that the bank's compliance team has not escalated to the board risk committee.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'covenant-lite', 'board governance', 'risk appetite'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1069',
    name: 'Leveraged Lending Repayment Capacity Analysis Based on Sponsor Projections Only',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's leveraged lending credit approvals document repayment capacity using the private equity sponsor's management case financial projections, with a sensitivity analysis that stress-tests down to a management case minus 10%; independent bank-developed downside scenarios are not included in the credit approval memo. OCC leveraged lending guidance requires that repayment capacity analyses reflect conservative credit assumptions independent of sponsor projections, including a scenario where the borrower must service and repay debt using only cash flows that can be verified from historical financials; reliance on sponsor management case projections without an independent conservative scenario produces a systematic optimism bias in repayment capacity analysis that OCC examiners consistently cite as a leveraged lending underwriting deficiency.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'repayment capacity', 'credit underwriting', 'DFAST'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1070',
    name: 'Leveraged Lending Portfolio Stress Test Excludes Sponsor-Linked Cross-Default Risk',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's leveraged lending stress test models each portfolio company's performance independently without testing the correlated default risk arising from the bank's exposure to multiple portfolio companies owned by the same private equity sponsor. When the same sponsor's fund is under capital call pressure and delays equity injections across multiple portfolio companies simultaneously, the bank's stress test — which treats each obligor independently — fails to capture the correlated deterioration; OCC leveraged lending guidance and Basel III concentration risk principles require that stress testing address the correlation between obligors with common owners or sponsors, and the independent obligor stress model underestimates the bank's downside exposure to any single large PE sponsor by approximately 40%.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'concentration risk', 'Basel III', 'stress testing'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1071',
    name: 'Leveraged Lending Origination Pipeline Concentration Not Reported to Risk Committee',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's leveraged lending pipeline management system tracks committed but unfunded transactions separately from the funded portfolio, and the risk committee's concentration metrics are calculated only on funded exposures — meaning that $180M of committed but undrawn leveraged loan commitments in a single sector are invisible to the concentration monitoring framework until funding. OCC guidance on concentration risk management and leveraged lending governance requires that pipeline commitments be included in concentration calculations because committed exposure creates the same economic concentration risk as funded exposure; when three pipeline transactions fund simultaneously, the sector concentration jumps from 14% to 24% of commercial commitments without triggering the risk committee alert threshold.`,
    keywords: ['leveraged lending', 'OCC guidance', 'concentration risk', 'Basel III', 'pipeline management'],
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1072',
    name: 'AI EBITDA Normalization Tool Accepts Sponsor Adjustments Without Independent Verification',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an AI-powered EBITDA normalization tool that ingests management-provided financial data and automatically processes EBITDA addbacks submitted by the private equity sponsor, generating a calculated adjusted EBITDA used in the leverage ratio computation for leveraged lending approvals. The AI tool accepts sponsor-submitted addback categories — synergies, restructuring charges, pro-forma revenue — without a workflow step requiring the underwriter to independently verify the reasonableness of each addback against the company's actual financial history; OCC leveraged lending guidance (OCC 2013-9) requires that EBITDA adjustments be supported by management representations and bank-verified documentation, and an AI tool that automates addback processing without a mandatory independent verification step systematically inflates adjusted EBITDA, reducing apparent leverage ratios below the OCC's guidance threshold for deals that would otherwise require exception approval.`,
    keywords: ['leveraged lending', 'AI EBITDA tool', 'OCC 2013-9', 'SR 11-7', 'EBITDA addback'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },

  // ── Syndications: Agent Bank Obligations / Independent Credit Review / SNC ──
  {
    code: 'B1073',
    name: 'Agent Bank Information Sharing Obligations Not Fulfilled — Participant Lenders Uninformed',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital serves as agent bank on 12 syndicated commercial loans and is responsible for distributing borrower financial statements, covenant compliance certificates, and waiver notices to participant lenders within the timelines specified in each credit agreement; the agent bank's syndications team does not have a systematic tracking system for participant distribution deadlines, and lender surveys in three transactions identify delays of 30–60 days in financial statement distribution. OCC guidance on syndicated loan agency obligations and fiduciary responsibility standards require that agent banks fulfill information-sharing duties with care and diligence; systematic distribution delays create agent bank liability risk and reputational exposure with participant banks that rely on timely reporting to maintain their own credit monitoring and CECL allowance processes.`,
    keywords: ['syndicated loans', 'agent bank', 'OCC guidance', 'participant lenders', 'credit documentation'],
    subTopic: 'syndications',
  },
  {
    code: 'B1074',
    name: 'Participation Purchased Without Independent Credit Review — Passed Through as Agent Analysis',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital purchases participation interests in syndicated commercial loans where the lead agent bank's credit approval memo is incorporated by reference in First Capital's credit file without an independent credit analysis performed by First Capital's own underwriters. OCC examination guidance on credit risk management and loan participation policies requires that purchasing institutions perform independent credit analysis for participation interests regardless of the quality of the lead agent's analysis; the reliance on agent bank analysis without independent review means that First Capital's underwriters have not applied the bank's own credit standards, risk appetite framework, or CECL staging criteria to the participation exposures, creating a credit quality and documentation gap that OCC examiners cite as a participation management deficiency.`,
    keywords: ['syndicated loans', 'OCC guidance', 'participation', 'independent credit review', 'CECL'],
    demoRelevant: true,
    subTopic: 'syndications',
  },
  {
    code: 'B1075',
    name: 'Shared National Credit Exam Preparation — Classified Rating Not Pre-Aligned With Regulators',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital participates in 22 Shared National Credit (SNC) transactions subject to the annual interagency SNC examination program, but does not conduct a pre-examination self-assessment to evaluate whether its internal credit ratings for SNC credits are likely to align with the examination team's rating methodology, resulting in material rating mismatches that require retroactive CECL allowance adjustments after the examination. The OCC, Federal Reserve, and FDIC SNC examination program provides advance examination schedules and requests that participant banks prepare credit files meeting examination standards; banks that fail to align their internal ratings with OCC examination criteria in advance of the SNC exam face surprise downgrade findings and compelled reserve increases that disrupt the quarterly allowance process.`,
    keywords: ['Shared National Credit', 'OCC examination', 'CECL', 'credit rating', 'SNC examination'],
    demoRelevant: true,
    subTopic: 'syndications',
  },
  {
    code: 'B1076',
    name: 'SNC Participation Exit Rights Not Documented — Trapped in Distressed Syndicated Credit',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's participation agreements in several SNC credits include transfer restrictions that require lead agent consent to assign or sell the participation interest, but these restrictions were not identified during origination credit review or documented in the bank's credit portfolio management system as a liquidity constraint. When three SNC credits migrate to substandard and First Capital seeks to reduce exposure by selling the participation interests, the bank discovers that agent consent restrictions limit its ability to exit; the trapped positions require full CECL lifetime reserve provisioning while the bank cannot manage its portfolio concentration through normal secondary market activity, and OCC examiners note the absence of exit right documentation as a credit risk management gap.`,
    keywords: ['Shared National Credit', 'OCC guidance', 'participation', 'credit risk', 'portfolio management'],
    subTopic: 'syndications',
  },
  {
    code: 'B1077',
    name: 'Syndication Documentation Governance Gap — Side Letters Not Disclosed to Participants',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital, as a lead arranger in a leveraged loan syndication, enters into a side letter with the borrower modifying a covenant definition after the syndication closes; the modification is not shared with participant lenders, creating a situation where participants are monitoring a covenant definition that differs from the one the borrower is actually subject to. OCC leveraged lending guidance (OCC 2013-9) and agent bank fiduciary responsibility standards require that material modifications to credit terms be communicated to all lenders in the syndicate; the undisclosed side letter constitutes a breach of the agent bank's information sharing obligation and creates potential lender liability when the covenant breach that participants expected does not occur, and participants later allege they were misled about borrower compliance.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'syndicated loans', 'agent bank', 'credit documentation'],
    demoRelevant: true,
    subTopic: 'syndications',
  },
  {
    code: 'B1078',
    name: 'AI Automated SNC Reporting Without Examiner Format Compliance Check',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital deploys an AI-powered document generation tool that automatically compiles SNC examination credit packages by extracting financial data and narrative summaries from the loan origination system, producing structured credit files submitted directly to the OCC examination team without a credit officer review of format compliance. The interagency SNC examination program specifies precise requirements for credit file organization, financial statement presentation, and rating rationale documentation that the AI-generated package does not consistently meet — examination teams return 8 of 22 credit packages with format deficiencies requiring resubmission, delaying the examination timeline and creating an adverse impression of First Capital's credit administration capabilities that compounds the bank's consent order remediation narrative.`,
    keywords: ['Shared National Credit', 'AI reporting tool', 'OCC examination', 'SR 11-7', 'credit documentation'],
    demoRelevant: true,
    subTopic: 'syndications',
  },

  // ── Counterparty Credit: CVA / Wrong-Way Risk / ISDA SIMM ─────────────────
  {
    code: 'B1079',
    name: 'CVA Calculation Methodology Not Aligned With Basel III SA-CVA Framework',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital calculates Credit Valuation Adjustment for its interest rate swap and FX forward portfolio using a simplified expected exposure approach that does not conform to the Basel III standardized approach for CVA risk (SA-CVA), applying a flat credit spread assumption rather than the counterparty-specific credit spread inputs required by the SA-CVA framework. Under Basel III/IV implementation in the US, the SA-CVA framework requires counterparty credit spreads to reflect current market-implied CDS spreads or proxy spreads derived from comparable entities; the simplified CVA calculation systematically understates CVA for counterparties in sectors experiencing credit spread widening, causing the bank to understate the capital charge for CVA risk and overstate the fair value of derivative positions with deteriorating counterparties.`,
    keywords: ['CVA', 'Basel III', 'SA-CVA', 'derivatives', 'counterparty credit'],
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1080',
    name: 'Wrong-Way Risk Documentation Absent for Commodity Producer Swap Counterparties',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's derivative portfolio includes commodity price swaps with agricultural and energy producers where there is a natural wrong-way risk correlation: when commodity prices fall, the swap has a positive value to the bank (the producer pays more) precisely when the producer's creditworthiness deteriorates, making it less likely to perform on the payment obligation. Basel III/IV counterparty credit risk guidelines and OCC guidance on derivatives risk management require that wrong-way risk be identified, documented, and addressed through collateral or exposure limits for counterparties where this correlation exists; First Capital's CVA and counterparty credit functions have not documented the wrong-way risk relationships in the commodity producer portfolio, and the stress scenarios used for DFAST derivatives exposure do not include the commodity price and credit default correlation that would capture the compound risk.`,
    keywords: ['wrong-way risk', 'Basel III', 'CVA', 'DFAST', 'counterparty credit'],
    demoRelevant: true,
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1081',
    name: 'ISDA SIMM Initial Margin Model Deployed Without Model Risk Management Sign-Off',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital implements the ISDA Standard Initial Margin Model (SIMM) for calculating non-cleared OTC derivative initial margin requirements under BCBS-IOSCO margin rules, deploying the SIMM calculation engine supplied by a third-party vendor without subjecting it to independent model risk management validation under SR 11-7. The Federal Reserve and OCC have communicated in supervisory guidance that SIMM implementations are models subject to SR 11-7 governance requirements, requiring independent validation of the calculation methodology, input data quality, and sensitivity to risk factor assumptions; the bank's deployment of the vendor SIMM engine without MRM sign-off means the initial margin amounts exchanged with dealer counterparties may be systematically miscalculated, creating both regulatory capital and counterparty exposure inaccuracies.`,
    keywords: ['ISDA SIMM', 'SR 11-7', 'Basel III', 'OTC derivatives', 'model validation'],
    demoRelevant: true,
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1082',
    name: 'Collateral Management System Does Not Capture Counterparty Exposure Netting Agreements',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's collateral management system tracks derivative exposure and collateral balances at the transaction level but does not capture ISDA master netting agreements that entitle the bank to net exposures across all transactions with a single counterparty in the event of default. When the bank's risk reporting system calculates gross positive replacement cost for its derivative book, it overstates counterparty exposure by 35–45% relative to the net exposure after applying ISDA close-out netting; Basel III/IV counterparty credit risk capital rules permit netting only when legally enforceable netting agreements are documented and recognized by the capital calculation system, and the absence of netting recognition in the collateral system causes the bank to hold excess CVA capital and to report inflated gross counterparty exposure metrics in its DFAST submission.`,
    keywords: ['ISDA', 'counterparty credit', 'Basel III', 'collateral management', 'DFAST'],
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1083',
    name: 'Derivative Counterparty Stress Testing Excludes Simultaneous Multi-Counterparty Default',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's counterparty credit stress testing framework applies single-name idiosyncratic stress — testing the impact of a single large counterparty default — without testing the correlated multi-counterparty stress scenario where several counterparties in the same sector default simultaneously due to a shared macro shock. Basel III/IV Pillar 2 requirements and OCC guidance on derivatives risk management require that counterparty credit stress scenarios include sector-correlated stress where applicable; for a bank with concentrated derivative exposure to financial sector counterparties, a single-name stress scenario will systematically understate the systemic risk embedded in the portfolio relative to a correlated multi-counterparty scenario calibrated to a financial system stress event.`,
    keywords: ['counterparty credit', 'Basel III', 'DFAST', 'stress testing', 'OCC guidance'],
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1084',
    name: 'AI CVA Calculation Model Not Validated for Sensitivity to Market Stress Regime Shifts',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an AI-enhanced CVA calculation model that uses ML to estimate exposure profiles for complex structured derivatives, replacing the traditional Monte Carlo simulation with a neural network-based expected exposure approximation that reduces computation time by 90%; the model has not been validated under market stress regime conditions that lie outside the training data distribution, such as the March 2020 volatility spike or the 2022 rate shock. SR 11-7 model validation requirements and OCC guidance on derivatives model risk require that models used in regulatory capital calculation be validated across the full range of market conditions, including tail scenarios not represented in the training history; a CVA model that performs accurately under normal conditions but degrades under stress produces unreliable CVA charges precisely when accurate measurement is most critical for capital adequacy assessment.`,
    keywords: ['CVA', 'AI CVA model', 'SR 11-7', 'Basel III', 'DFAST'],
    demoRelevant: true,
    subTopic: 'counterparty-credit',
  },

  // ── Climate Credit Risk: Physical / Transition / NGFS / TCFD ──────────────
  {
    code: 'B1085',
    name: 'Physical Climate Risk Not Integrated Into CRE Collateral Valuation',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's CRE appraisal and collateral monitoring process does not include physical climate risk factors — flood zone exposure, wildfire hazard, chronic heat stress — in collateral valuation, meaning that properties in elevated climate-risk geographies are valued without adjustment for the long-term impairment of income-generating capacity and insurability. OCC's 2023 climate risk management principles require that banks incorporate physical climate risk into credit risk assessments and collateral valuation for significant exposures; for First Capital's Gulf Coast and Southwest CRE portfolio, the absence of physical climate risk factors understates expected LGD for properties at elevated risk of insurance non-renewal and value impairment, creating a CECL reserve gap that will widen as FEMA flood map updates and private insurer withdrawals accelerate.`,
    keywords: ['climate credit risk', 'OCC climate guidance', 'CRE concentration', 'NGFS', 'TCFD'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1086',
    name: 'Transition Climate Risk Not Assessed for Carbon-Intensive Commercial Borrowers',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's commercial credit underwriting for energy, industrial, and manufacturing sector borrowers does not include a transition risk assessment evaluating how regulatory carbon pricing, cap-and-trade requirements, or energy efficiency mandates could affect the borrower's operating cost structure, capital expenditure requirements, and competitive position over the loan term. NGFS climate scenario analysis frameworks and OCC climate risk management principles require that banks assess transition risk for material exposures to carbon-intensive sectors; the absence of transition risk underwriting criteria means that First Capital may be originating loans to borrowers whose business models are vulnerable to accelerating energy transition policies, creating latent credit risk that is not reflected in PD estimates or CECL reserves.`,
    keywords: ['climate credit risk', 'transition risk', 'NGFS', 'OCC climate guidance', 'CECL'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1087',
    name: 'NGFS Climate Scenario Coverage Insufficient — Only One Scenario Pathway Modeled',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's climate risk stress testing exercise uses only the NGFS "Current Policies" baseline scenario to assess credit portfolio vulnerability, without including the "Net Zero 2050" and "Delayed Transition" scenarios that represent materially different physical and transition risk profiles for the bank's commercial portfolio. The Federal Reserve's 2023 climate scenario analysis pilot guidance and OCC climate risk management principles require multi-scenario coverage to capture the range of possible outcomes under different policy trajectories; a single-scenario analysis anchored to the current policy baseline systematically underestimates transition risk for carbon-intensive borrowers in a scenario where policy acceleration occurs, and underestimates physical risk for all borrowers in a scenario where physical climate damages increase faster than transition.`,
    keywords: ['NGFS', 'climate credit risk', 'OCC climate guidance', 'DFAST', 'stress testing'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1088',
    name: 'TCFD Credit Portfolio Disclosure Metrics Not Aligned With Regulatory Expectations',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital publishes a TCFD-aligned climate risk disclosure that reports portfolio-level Scope 3 financed emissions using a self-developed attribution methodology, but does not include the portfolio alignment metrics — such as weighted average carbon intensity (WACI), percentage of portfolio in high-transition-risk sectors, or climate value-at-risk estimates — that OCC and Federal Reserve climate supervisory expectations identify as relevant for assessing credit portfolio climate risk exposure. TCFD implementation guidance for financial institutions and OCC's climate risk management principles for large financial institutions require that disclosures provide decision-useful information on credit portfolio climate risk; a disclosure that reports aggregate emissions without sector-specific credit risk metrics does not satisfy the qualitative and quantitative expectations regulators are increasingly enforcing through supervisory feedback.`,
    keywords: ['TCFD', 'OCC climate guidance', 'climate credit risk', 'NGFS', 'financed emissions'],
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1089',
    name: 'Agricultural Portfolio Physical Climate Risk Not Scenario-Tested for Drought Severity',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's agricultural lending portfolio in the Midwest is exposed to chronic drought risk as precipitation patterns shift under physical climate scenarios, but the bank's annual DFAST stress test does not include an agricultural sector-specific stress scenario incorporating prolonged drought severity comparable to NGFS physical risk projections for the region. OCC supervisory expectations for agricultural lenders with climate-exposed portfolios and NGFS acute physical risk scenario guidance require that banks test agricultural credit portfolios under realistic physical climate stress; the absence of a drought-severity scenario means the bank's agricultural loan impairment estimates are anchored to historical weather patterns that are becoming less representative of the forward risk distribution, understating the CECL reserve requirement for the agricultural segment under chronic physical risk conditions.`,
    keywords: ['climate credit risk', 'NGFS', 'agricultural lending', 'OCC climate guidance', 'DFAST'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1090',
    name: 'Climate Risk Underwriting Criteria Not Embedded in Credit Policy — Ad Hoc Assessment Only',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's credit policy for commercial lending does not include climate risk assessment criteria as a required underwriting component; relationship managers perform ad hoc climate risk reviews for large transactions on a voluntary basis, but there are no minimum standards for what constitutes adequate climate risk analysis, no requirement that the assessment be documented in the credit file, and no thresholds that trigger enhanced climate risk review for high-exposure sectors. OCC climate risk management principles require that climate risk be integrated into credit policies and underwriting standards in a manner that is proportionate to the bank's climate risk exposures; the absence of embedded policy criteria means that climate risk underwriting quality is entirely dependent on individual RM judgment, producing inconsistent and undocumentable assessments that OCC examiners cannot evaluate for adequacy.`,
    keywords: ['climate credit risk', 'OCC climate guidance', 'TCFD', 'credit underwriting', 'NGFS'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1091',
    name: 'CRE Flood Insurance Monitoring Gap — Insurance Non-Renewal Not Tracked as EWI Trigger',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's CRE portfolio monitoring process requires flood insurance as a loan covenant for properties in FEMA-designated Special Flood Hazard Areas, but the loan administration system does not include an automated alert when flood insurance policies lapse, are cancelled by the insurer due to underwriting exit from high-risk markets, or are renewed with materially reduced coverage limits that no longer satisfy the covenant requirement. As private insurers exit high-risk coastal and flood-prone markets — a physical climate risk trend documented in NGFS scenario analysis — an increasing share of First Capital's CRE collateral is at risk of being uninsured or underinsured against flood loss without triggering the bank's covenant monitoring process, undermining the collateral protection that underpins the LGD assumptions in the CECL model.`,
    keywords: ['climate credit risk', 'CRE concentration', 'NGFS', 'OCC guidance', 'collateral monitoring'],
    subTopic: 'climate-credit-risk',
  },

  // ── AI Credit Part 2: Climate AI / LLM DFAST / ML CRE / AI SNC / AI Syndication ──
  {
    code: 'B1092',
    name: 'AI Climate Risk Credit Score Without Actuarial Validation Against Observed Loss Data',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital adopts a third-party AI climate risk credit scoring tool that generates borrower-level physical and transition risk scores by ingesting property location, sector, and business activity data and applying a machine learning model trained on global loss databases; the tool's scores are incorporated directly into underwriting risk assessments without independent actuarial validation confirming that the AI scores predict actual credit losses in First Capital's regional portfolio. SR 11-7 model validation requirements and OCC climate risk management principles both require that AI tools used in credit risk assessment be validated on data representative of the bank's actual exposure; a climate credit AI score that correlates with global loss data but has not been tested against First Capital's portfolio default and recovery patterns may generate systematically inaccurate risk assessments for the bank's specific borrower mix and geographic footprint.`,
    keywords: ['AI climate risk score', 'SR 11-7', 'OCC climate guidance', 'NGFS', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1093',
    name: 'LLM DFAST Scenario Narrative Generated Without Economist Review',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's DFAST submission team uses an LLM tool to draft the qualitative narrative sections of the stress test submission — describing the economic rationale for the adverse scenario, the transmission channels for macro stress to credit losses, and management's assessment of capital adequacy under stress — without a mandatory review step requiring a credentialed economist or chief risk officer to attest that the AI-generated narrative accurately reflects the bank's actual modeling assumptions and economic judgment. Federal Reserve DFAST examination guidance and OCC supervisory expectations for internal capital adequacy assessments require that the narrative rationale for stress scenarios reflect genuine management judgment and be consistent with the quantitative model results; an LLM-generated narrative that paraphrases the regulatory scenario description without reflecting the bank's specific portfolio vulnerabilities creates a disconnect between the quantitative submission and the qualitative narrative that examiners flag as a credibility concern.`,
    keywords: ['DFAST', 'LLM scenario narrative', 'SR 11-7', 'OCC examination', 'human-in-loop'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1094',
    name: 'ML CRE Appraisal Review Tool Deployed Without FIRREA Independence Verification',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's credit review team uses an ML-powered appraisal review tool that ingests appraisal reports and generates a quality score and recommendation — accept, flag for desk review, or return to appraiser — used by credit officers to efficiently screen a high volume of CRE appraisals. The ML tool was developed by the technology team and deployed without a FIRREA-compliance review confirming that using an AI system to make appraisal disposition recommendations does not create a conflict with FIRREA appraisal independence requirements or OCC guidance on the use of evaluations in lieu of appraisals; OCC examiners find that the ML tool's recommendations constitute a systematic influence on the appraisal review outcome that undermines the independence of the review process required by FIRREA Title XI.`,
    keywords: ['ML CRE appraisal', 'FIRREA', 'OCC guidance', 'SR 11-7', 'appraisal independence'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1095',
    name: 'AI Transition Risk Scoring Without SR 11-7 Registration — Carbon-Intensive Sector Underwriting',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's commercial banking team uses an AI transition risk scoring tool provided by a data vendor to assess the carbon transition exposure of commercial borrowers in energy, utilities, and heavy industry, generating a risk score used in credit approval discussions and watchlist surveillance without the tool being registered as a model in the SR 11-7 model inventory. OCC climate risk management principles require that quantitative tools generating risk assessments for credit decisions be subject to model risk governance; an AI transition risk score that influences credit decisions without SR 11-7 validation has unknown accuracy for First Capital's borrower population, may generate systematically biased assessments of industries in the bank's home region, and creates a model governance gap in the bank's climate risk management framework that conflicts with its stated TCFD implementation commitments.`,
    keywords: ['AI transition risk', 'SR 11-7', 'OCC climate guidance', 'TCFD', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1096',
    name: 'AI-Generated Syndication Documents Without Legal Sign-Off on Governing Law Clauses',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's leveraged lending and syndication team uses an AI document generation tool to draft term sheets, mandate letters, and credit agreement term summary documents, with AI-generated boilerplate governing law and jurisdiction clauses drawn from a training corpus that includes both New York and Delaware law precedent transactions. Relationship managers present AI-generated term sheets to sponsors and borrowers without legal review of the governing law and choice of forum provisions, which in three transactions resulted in terms that were inconsistent with First Capital's standard credit agreement template and the borrower's organizational domicile; OCC 2013-9 leveraged lending guidance and the bank's syndication governance policy require that governing documents be reviewed by legal counsel before borrower presentation, and the AI-drafting workflow without mandatory legal attestation creates enforceability risk in the bank's commercial credit documentation.`,
    keywords: ['AI syndication documents', 'leveraged lending', 'OCC 2013-9', 'SR 11-7', 'legal review'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1097',
    name: 'GenAI Physical Risk Assessment Narrative Hallucinating Flood Zone Data in Credit Files',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's CRE underwriting team uses a GenAI tool to generate property-level physical climate risk narrative summaries in credit memos, pulling flood zone designation, storm surge exposure, and wildfire risk from an AI-synthesized property risk profile; in multiple documented cases, the GenAI tool produces FEMA flood zone designations that do not match the actual FEMA FIRM panel data for the property, including designating properties outside SFHA as Zone AE and omitting flood plain overlays for properties with actual flood risk. FIRREA appraisal standards and OCC credit documentation guidance require that collateral risk descriptions in credit files be accurate and traceable to verified data sources; hallucinated flood zone data in credit memos creates both FIRREA compliance exposure and a credit decision integrity risk when loan officers rely on AI-generated risk summaries without independent verification against FEMA and first-party data.`,
    keywords: ['GenAI physical risk', 'FIRREA', 'OCC climate guidance', 'SR 11-7', 'credit documentation'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1098',
    name: 'ML NGFS Scenario Mapping Tool Not Validated for First Capital Portfolio Composition',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital uses an ML tool that maps borrower-level financial data to NGFS climate scenario impacts, translating sector-level transition and physical risk estimates from NGFS pathways into borrower-specific PD adjustments used in the bank's climate stress testing exercise. The ML mapping tool was licensed from a vendor whose training data reflects the portfolio composition of large global banks, and the tool has not been validated against First Capital's Midwest-concentrated, community and mid-market-focused borrower mix where sector exposure, carbon intensity profiles, and geographic physical risk distributions differ materially from the global training population. SR 11-7 model validation requirements require that vendor-provided models be evaluated for applicability to the bank's actual exposure before deployment in regulatory submissions; an unvalidated NGFS mapping tool produces climate stress PD adjustments that may be systematically miscalibrated for First Capital's regional portfolio.`,
    keywords: ['NGFS', 'ML scenario mapping', 'SR 11-7', 'climate credit risk', 'OCC climate guidance'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },

  // ── Additional Supplemental Patterns Across Sub-Topics ────────────────────
  {
    code: 'B1099',
    name: 'CRE Tenant Concentration Analysis Not Part of Underwriting — Anchor Tenant Loss Unmodeled',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's CRE underwriting for office and retail properties analyzes aggregate NOI and occupancy at origination but does not perform tenant concentration analysis identifying the share of NOI attributable to a single anchor or major tenant; in several retail and office assets, a single tenant accounts for 60–80% of rent revenue, but the credit approval memo presents the blended occupancy rate without highlighting the anchor dependency. OCC credit analysis guidance and FIRREA appraisal standards require that CRE underwriting reflect property-specific risk factors including tenant concentration; when anchor tenants at three retail properties exercise early termination clauses in a rising vacancy environment, NOI drops by 65–70%, triggering DSCR breaches and CECL Stage 2 migration without any prior EWI alert due to the absence of tenant concentration monitoring.`,
    keywords: ['CRE underwriting', 'FIRREA', 'OCC guidance', 'CECL', 'tenant concentration'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1100',
    name: 'Leveraged Loan Amendment and Waiver Activity Not Tracked as Portfolio Stress Indicator',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital holds participation interests in 40 leveraged loans across private equity sponsors, but the bank's portfolio monitoring system tracks amendment and waiver requests as administrative workflow items rather than flagging them as credit quality indicators requiring enhanced risk assessment. Elevated amendment frequency — covenant relief waivers, EBITDA basket expansions, extended maturities without principal reduction — is a documented leading indicator of leveraged loan credit deterioration; OCC leveraged lending guidance (OCC 2013-9) requires that banks monitor the pace of amendment activity as a signal of borrower financial distress, and a portfolio monitoring system that processes amendments without credit quality escalation creates a systematic blind spot in the bank's EWI framework for leveraged loan surveillance.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'EWI', 'portfolio monitoring', 'amendment activity'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1101',
    name: 'SNC Agent Bank Certification Deficiency — Required Certifications Not Maintained',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital is the agent bank for 12 SNC credits and is required under the interagency SNC program to certify that credit files meet OCC examination standards; the bank's syndications operations team does not have a formal pre-examination certification process, and credit files are submitted to the SNC examination team without a bank officer review and certification that each file contains all required documentation. OCC SNC examination procedures require that agent banks take responsibility for the quality and completeness of the credit packages submitted for examination review; the absence of an agent bank certification process means that examination deficiencies are not identified before submission, creating a pattern of returned files and remediation requirements that damages First Capital's credibility as an agent bank and complicates its consent order remediation timeline.`,
    keywords: ['Shared National Credit', 'OCC examination', 'agent bank', 'credit documentation', 'consent order'],
    demoRelevant: true,
    subTopic: 'syndications',
  },
  {
    code: 'B1102',
    name: 'Margin Dispute Resolution Process Absent — ISDA SIMM Margin Calls Contested Without Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's derivatives operations team does not have a documented margin dispute resolution procedure for situations where its ISDA SIMM initial margin calculation differs from a dealer counterparty's calculation, resulting in ad hoc negotiations that delay margin settlement and create intraday liquidity risk. ISDA SIMM operational guidance and the BCBS-IOSCO uncleared margin rules require that institutions have documented procedures for resolving margin disputes within defined timeframes to maintain compliance with regulatory margin requirements; the absence of a formal dispute resolution protocol has resulted in three instances of delayed margin settlement in the past 12 months where intraday exposure exceeded the bank's internal counterparty credit limit during the resolution period.`,
    keywords: ['ISDA SIMM', 'OTC derivatives', 'counterparty credit', 'Basel III', 'margin rules'],
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1103',
    name: 'Physical Risk Climate Heat Map Not Integrated Into CECL Geographic Segmentation',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's CECL allowance model segments the commercial portfolio geographically by state and metropolitan statistical area for regional macro factor assignment, but the segmentation schema does not overlay physical climate risk exposure — flood zone concentration, wildfire interface density, coastal storm surge risk — as a dimension that could affect default and loss severity at the sub-MSA level. OCC climate risk management principles and NGFS physical risk scenario guidance indicate that granular geographic climate risk exposure should inform credit loss estimation for portfolios with material climate-exposed concentration; without a climate-overlay segmentation, the CECL model assigns the same macro scenario loss factors to climate-exposed and climate-resilient properties within the same MSA, creating a reserve estimation error that grows as physical climate events increase in frequency.`,
    keywords: ['CECL', 'climate credit risk', 'NGFS', 'OCC climate guidance', 'ASU 2016-13'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1104',
    name: 'HVCRE Risk Weight Error Due to Equity Contribution Calculation Methodology Ambiguity',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's regulatory capital calculation team applies HVCRE risk weights to acquisition, development, and construction loans using a contributed-capital-to-appraised-value ratio that diverges from the OCC's prescribed methodology for calculating contributed equity as a percentage of completed project appraised value versus as-is land value. The resulting HVCRE designation errors apply the 150% risk weight to loans that should qualify for the standard 100% CRE risk weight, overstating risk-weighted assets by an estimated $18M and reducing the bank's common equity Tier 1 ratio by 6 basis points; while the error is conservative from a capital adequacy perspective, it demonstrates a Basel III implementation deficiency that OCC examiners identify when reviewing the capital calculation methodology, requiring a correction and a review of HVCRE designations across the full ADC portfolio.`,
    keywords: ['HVCRE', 'Basel III', 'OCC guidance', 'risk-weighted assets', 'construction lending'],
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1105',
    name: 'Interagency Leveraged Lending Guidance Self-Assessment Not Formally Documented',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital does not perform a formal annual self-assessment against the interagency leveraged lending guidance (OCC 2013-9) requirements, relying instead on the commercial credit policy review process to capture leveraged lending compliance without a specific leveraged lending assessment checklist. OCC supervisory communications and the interagency guidance itself contemplate that regulated institutions assess their compliance with the guidance and document findings for examiner review; the absence of a formal self-assessment means that compliance gaps in EBITDA documentation, hold-level governance, and post-origination monitoring accumulate without detection until the next OCC examination, at which point the bank faces a concentrated finding rather than a continuous improvement record.`,
    keywords: ['leveraged lending', 'OCC 2013-9', 'OCC examination', 'credit policy', 'consent order'],
    demoRelevant: true,
    subTopic: 'leveraged-lending',
  },
  {
    code: 'B1106',
    name: 'CVA Hedging Effectiveness Not Tested — Hedge Accounting Designation Without Back-Test',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital designates certain CDS positions as CVA hedges for regulatory capital purposes under the Basel III hedging eligibility requirements, reducing the CVA capital charge, but has not performed prospective or retrospective hedge effectiveness testing to confirm that the designated hedges have a high degree of effectiveness in offsetting CVA variability. Basel III/IV CVA risk framework rules require that eligible hedges satisfy a documented effectiveness standard; the absence of hedge effectiveness testing means the capital reduction taken for CVA hedges has not been validated, creating a potential capital adequacy overstatement and an OCC model risk examination finding when the derivatives risk management team cannot produce hedge effectiveness documentation in response to examiner inquiry.`,
    keywords: ['CVA', 'Basel III', 'derivatives', 'hedge accounting', 'OCC examination'],
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1107',
    name: 'CRE Appraisal Review Independence — Same Appraiser Used for Review and Original Appraisal',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's appraisal review process for significant CRE credits requires a second appraisal or desk review of the original appraisal, but in 20% of sampled transactions the appraisal review was assigned to the same appraiser who performed the original appraisal, eliminating the independence that the review is designed to provide. FIRREA Title XI appraisal independence requirements and OCC appraisal guidance require that review appraisers be independent of the original appraiser and the transaction; the use of the same appraiser for both the origination appraisal and the review appraisal creates a self-referential review that OCC examiners treat as an independence violation, requiring the bank to commission independent reviews for all affected transactions and revise the appraisal panel assignment process.`,
    keywords: ['FIRREA', 'appraisal independence', 'CRE underwriting', 'OCC guidance', 'FIRREA Title XI'],
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1108',
    name: 'AI Counterparty Risk Dashboard Not Validated for Data Completeness Under BCBS 239',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital deploys an AI-powered counterparty credit risk dashboard that aggregates derivative exposures, collateral balances, netting agreement status, and CVA estimates in a real-time monitoring view; the dashboard has not been validated for data completeness and lineage under BCBS 239 risk data aggregation principles, and several counterparty positions held in a subsidiary booking entity are excluded from the consolidated dashboard due to a data feed configuration gap. BCBS 239 requires that risk data be complete, accurate, and aggregated on a consolidated basis for risk management purposes; an AI counterparty risk dashboard that presents an incomplete picture of consolidated exposures due to missing subsidiary data feeds could cause the risk management team to underestimate the bank's total credit risk to systemically important counterparties, creating both supervisory and credit risk management concerns.`,
    keywords: ['BCBS 239', 'counterparty credit', 'AI dashboard', 'SR 11-7', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1109',
    name: 'NGFS Transition Risk Scenario Not Applied to Agricultural Borrower Carbon Cost Analysis',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's agricultural loan portfolio includes row crop and livestock operations that would face material cost increases under a carbon pricing scenario modeled in the NGFS "Divergent Net Zero" pathway, but the bank's credit underwriting and annual review process for agricultural borrowers does not include a sensitivity analysis showing how borrower cash flow would change under a carbon cost of $50–150 per metric ton as modeled in NGFS transition scenarios. OCC climate risk management principles and NGFS agricultural sector guidance recommend that agricultural lenders assess transition risk for borrowers whose operating cost structures are exposed to carbon pricing; the absence of NGFS-informed agricultural transition risk analysis means the bank's agricultural CECL reserves and PD estimates are derived from a historical pattern that does not account for the regulatory cost disruption modeled in credible forward climate scenarios.`,
    keywords: ['NGFS', 'transition risk', 'agricultural lending', 'OCC climate guidance', 'CECL'],
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1110',
    name: 'LLM ISDA SIMM Documentation Generator Without MRM Sign-Off on Output Accuracy',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's derivatives operations team uses an LLM tool to generate ISDA SIMM model documentation — including methodology descriptions, input data specifications, and sensitivity calculation narratives — used in counterparty presentations and regulatory submissions, without a model risk management review confirming that the LLM-generated documentation accurately describes the actual SIMM implementation in the bank's calculation engine. SR 11-7 model documentation standards require that model documentation accurately and completely describe the model's design, inputs, and limitations; LLM-generated SIMM documentation that paraphrases the ISDA SIMM technical specification without reflecting the specific configuration, known limitations, and input data quality controls of First Capital's implementation creates a documentation integrity risk that OCC examiners identify when the documentation does not match the bank's actual SIMM calculation parameters.`,
    keywords: ['ISDA SIMM', 'LLM documentation', 'SR 11-7', 'OCC examination', 'model documentation'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1111',
    name: 'AI Climate Scenario Engine Outputting PD Adjustments Without Actuarial Peer Review',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital licenses an AI climate scenario engine that maps NGFS climate pathways to sector-level PD adjustment factors applied to commercial credit portfolios, generating PD uplift estimates used in the bank's climate stress test and TCFD portfolio alignment disclosures; the PD adjustment methodology and actuarial assumptions embedded in the vendor AI engine have not been reviewed by an independent actuarial or quantitative credit risk expert to assess whether the adjustment factors are calibrated to empirical default data. SR 11-7 conceptual soundness requirements and OCC climate risk management principles both require that quantitative models generating credit loss estimates be subject to independent expert review; a climate-linked PD adjustment model that has not been peer-reviewed by an actuary or credit risk specialist may generate adjustment factors that are not grounded in the observed relationship between climate events and credit defaults, producing climate stress test results that cannot be defended to OCC examiners or the bank's audit committee.`,
    keywords: ['AI climate scenario', 'SR 11-7', 'NGFS', 'OCC climate guidance', 'actuarial validation'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1112',
    name: 'AI CRE DFAST Scenario Generator Producing Implausible Sector Correlations',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI DFAST scenario generation tool that uses a generative model to produce sector-specific loss rate assumptions for the CRE portfolio under the adverse scenario; the AI model generates sector correlations that are inconsistent with historical CRE stress cycles — for example, predicting uncorrelated losses for office and retail CRE during a macro downturn, when historical DFAST data shows high positive correlation — without a human economist review flagging the implausible correlation structure before the scenario is incorporated into the DFAST submission. Federal Reserve DFAST guidance requires that scenario assumptions be internally consistent and reflect plausible economic transmission mechanisms; an AI-generated scenario with implausible sector correlations that is submitted without economist review creates a credibility risk in the DFAST submission that examiners identify by comparing sector-level loss rates against historical stress benchmarks.`,
    keywords: ['DFAST', 'AI scenario generator', 'CRE concentration', 'SR 11-7', 'stress testing'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1113',
    name: 'Automated SNC Credit Package Compiler Not Tested for Examiner Format Compliance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital uses an automated document assembly tool to compile SNC credit packages — collating financial statements, credit approval memos, covenant compliance certificates, and internal risk ratings from disparate source systems — without validating that the assembled package format meets current OCC SNC examination submission requirements, which are updated annually. The OCC SNC examination program publishes specific requirements for credit package content, financial statement presentation, and rating rationale narrative formatting; when the bank's automated package assembler uses a template from two examination cycles ago, 12 of 22 submitted packages require resubmission with reformatted financial data, causing the bank to miss the examination window and receive an adverse examination process notation that the bank's consent order remediation team must address.`,
    keywords: ['Shared National Credit', 'OCC examination', 'automated SNC reporting', 'credit documentation', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1114',
    name: 'Leveraged Lending AI Covenant Extractor Misreads EBITDA Definition — Silent Breach',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's AI covenant extraction tool parses credit agreement PDFs to extract covenant definitions and thresholds into the bank's loan administration system, but the NLP model misinterprets EBITDA definition language in 8% of parsed agreements — particularly when EBITDA definitions include complex permitted addback baskets with cross-reference schedules — storing an incorrect EBITDA threshold that causes the covenant monitoring system to show compliance when the borrower is actually in breach. SR 11-7 model risk requirements and OCC leveraged lending guidance (OCC 2013-9) both require that covenant monitoring systems accurately reflect credit agreement terms; a systematic parsing error in the AI covenant extractor that causes silent compliance misclassification for 8% of leveraged loan agreements exposes the bank to undetected covenant breaches where the bank's remedies under the credit agreement may be compromised by the failure to declare a timely event of default.`,
    keywords: ['AI covenant extractor', 'leveraged lending', 'OCC 2013-9', 'SR 11-7', 'NLP'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1115',
    name: 'AI-Assisted Syndication Allocations Without Fair Process Documentation',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's syndications team uses an AI tool to recommend final allocation amounts to bank participants in transactions where First Capital is the lead arranger, with the AI optimizing allocations to maximize fee income and relationship credit across the participant bank network; the allocation recommendations are implemented by the syndications desk without documenting the basis for allocations in a manner that demonstrates fair dealing to all participant banks. OCC leveraged lending guidance (OCC 2013-9) and general syndication market standards require that lead arrangers conduct the syndication process fairly and that allocation decisions not unfairly disadvantage participants; AI-optimized allocations that are not accompanied by a documented allocation rationale create both a fair dealing risk and a litigation exposure if a participant bank alleges that the AI allocation process systematically disadvantaged it relative to other participants.`,
    keywords: ['AI syndication allocation', 'leveraged lending', 'OCC 2013-9', 'agent bank', 'SR 11-7'],
    subTopic: 'ai-credit-part2',
  },
  {
    code: 'B1116',
    name: 'CRE Portfolio Cap Rate Expansion Not Flowing Into DFAST Collateral Stress Assumptions',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's DFAST CRE stress scenario applies a uniform CRE price decline assumption without reflecting the cap rate expansion that has occurred since 2022 as an independent driver of collateral value decline distinct from NOI deterioration; for stable-income CRE properties, cap rate expansion from 4.5% to 7.5% generates a price decline of 35–40% even without any reduction in NOI. OCC credit concentration stress testing guidance and DFAST program expectations require that CRE stress assumptions capture all material drivers of value decline including cap rate movements; the DFAST scenario's blended price decline metric fails to separately model the cap rate component, causing the stressed LTV calculations for the office and multifamily segments to understate the extent to which current market cap rates have already moved collateral values below the DFAST stressed assumption.`,
    keywords: ['DFAST', 'CRE concentration', 'stress testing', 'OCC guidance', 'Basel III'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate',
  },
  {
    code: 'B1117',
    name: 'TCFD Financed Emissions Methodology Not Reconciled With CECL Climate Risk Assumptions',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital publishes TCFD-aligned financed emissions disclosures using a PCAF (Partnership for Carbon Accounting Financials) methodology that attributes portfolio-level Scope 3 emissions to the commercial lending book, but the bank's CECL allowance and climate stress testing functions use a separate third-party climate risk model whose sector-level risk calibrations are not reconciled with the TCFD emissions attribution — creating two parallel representations of climate risk in the portfolio that produce conflicting sector-level risk signals. OCC climate risk management principles require that climate risk management be integrated and consistent across risk functions; the lack of reconciliation between the TCFD reporting framework and the CECL climate risk model means that neither the sustainability team nor the credit risk team can confirm that the two representations of climate risk are mutually consistent, undermining the credibility of both the external TCFD disclosure and the internal CECL climate reserve.`,
    keywords: ['TCFD', 'CECL', 'OCC climate guidance', 'NGFS', 'financed emissions'],
    demoRelevant: true,
    subTopic: 'climate-credit-risk',
  },
  {
    code: 'B1118',
    name: 'Counterparty Credit Limit Breach in OTC Derivatives Not Escalated Per Policy',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's counterparty credit limit framework sets maximum OTC derivative exposure limits per counterparty as a percentage of Tier 1 capital, but the derivatives trading desk's real-time exposure monitoring system generates limit breach alerts that are routed to the back-office operations team rather than the counterparty credit risk officers, creating a process break where limit breaches are resolved operationally by unwinding new trades rather than escalated to senior credit risk management for review and formal exception approval. Basel III/IV counterparty credit risk governance principles and OCC guidance on derivatives risk management require that limit breach escalation follow documented governance procedures that ensure senior credit risk oversight; the routing of breach alerts to operations rather than credit risk management means that a pattern of repeat limit breaches with a single dealer counterparty goes undetected at the credit risk committee level, accumulating counterparty concentration without governance visibility.`,
    keywords: ['counterparty credit', 'OTC derivatives', 'Basel III', 'OCC guidance', 'credit limit breach'],
    demoRelevant: true,
    subTopic: 'counterparty-credit',
  },
  {
    code: 'B1119',
    name: 'AI SNC Pre-Examination Readiness Tool Missing Current OCC Rating Calibration Update',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital licenses an AI-powered SNC pre-examination readiness tool that scores credit files against OCC examination standards and recommends rating adjustments before submission, but the AI tool's rating calibration was last updated 18 months ago and does not reflect OCC's current supervisory posture on leveraged loan ratings, DSCR stress assumptions, and addback documentation standards communicated in recent supervisory messages and examination findings. SR 11-7 model monitoring requirements and OCC SNC program expectations require that tools used to prepare for examination reflect current examiner calibration; an AI pre-examination tool with a stale rating calibration produces a false confidence that credit files will withstand examination scrutiny, causing the bank to submit packages with ratings the examiner downgrades — generating surprise reserve requirements and a pattern of examination findings that undermine the bank's consent order remediation credibility.`,
    keywords: ['Shared National Credit', 'AI examination tool', 'OCC examination', 'SR 11-7', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-credit-part2',
  },

];
