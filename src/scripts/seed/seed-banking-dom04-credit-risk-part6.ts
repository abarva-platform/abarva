// seed-banking-dom04-credit-risk-part6.ts
// Banking genome patterns — Credit Risk Management
// Code range: B1300–B1359  (60 patterns)
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

export const BANKING_DOM04_CREDIT_RISK_PART6_PATTERNS: PatternSeed[] = [

  // ── AI Credit Advanced (B1300–B1317) ─────────────────────────────────────────

  {
    code: 'B1300',
    name: 'AI Loan-to-Value Model Without Collateral Validation Layer',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description:
      `First Capital's AI-driven loan-to-value calculation engine ingests automated property data feeds and appraiser desktop valuations to compute LTV ratios at origination, but the model lacks a collateral validation layer that cross-checks AI-generated LTV outputs against appraisal reports for data completeness, property type eligibility, and comparable selection quality before the LTV ratio is written to the loan origination system and used to determine product eligibility and pricing. OCC appraisal and evaluation guidance and OCC Bulletin 2023-17 on AI risk management require that AI outputs used in material credit decisions be validated against source documentation before being operationalized; an AI LTV engine that writes unvalidated collateral valuations directly into the origination workflow can systematically overstate collateral coverage across a loan population, causing the bank to originate loans at actual LTV ratios materially higher than recorded without detection until collateral is liquidated.`,
    keywords: ['ai-ltv-model', 'collateral-validation', 'OCC-2023-17', 'appraisal-accuracy', 'loan-to-value'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1301',
    name: 'GenAI Covenant Waiver Analysis Producing Unsupported Legal Conclusions',
    officeCategory: 'front_office',
    failureRatePct: 81,
    description:
      `First Capital's relationship managers use a GenAI tool to analyze borrower covenant waiver requests by uploading credit agreement excerpts and borrower waiver letters, and the tool is generating waiver analysis memos that assert legal conclusions about waiver precedent, materiality thresholds, and cross-default implications without citation to the credit agreement language or applicable legal standards — producing analysis that credit officers are accepting as sufficient support for waiver approval decisions without independent legal review. OCC guidance on credit administration and credit approval governance requires that material waiver decisions be supported by documented analysis that can withstand examiner scrutiny; GenAI analysis memos containing unsupported legal conclusions about covenant waiver materiality are not adequate credit decision support documents under OCC standards, and waiver approvals resting solely on AI-generated legal conclusions without attorney sign-off create a systematic credit administration deficiency across the commercial portfolio.`,
    keywords: ['genai-covenant-waiver', 'OCC-credit-administration', 'legal-conclusions', 'ai-verification', 'waiver-governance'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1302',
    name: 'ML Portfolio Stress Test Without Challenger Model Comparison',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's credit stress testing function relies exclusively on a single ML gradient-boosting stress loss model without maintaining a parallel challenger model — a traditional regression-based approach or peer stress loss benchmarks — that would allow the stress testing team to assess whether ML model outputs are within a plausible range during each stress test cycle, leaving the bank without a mechanism to detect when the production ML model produces stress loss estimates that diverge materially from methodologically different approaches. SR 11-7 model risk management guidance requires that material models be benchmarked against alternative methodologies to assess model uncertainty; a stress test model operating without challenger comparison cannot demonstrate that its outputs represent a reasonable estimate of credit losses under adverse scenarios, and board risk committee presentations of stress test results that lack challenger benchmarking cannot be certified as representing a full assessment of model uncertainty in the credit loss estimates.`,
    keywords: ['ml-stress-test', 'challenger-model', 'SR-11-7', 'model-benchmarking', 'credit-stress-testing'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1303',
    name: 'AI CECL Forecasting Model Absent from SR 11-7 Model Inventory',
    officeCategory: 'back_office',
    failureRatePct: 83,
    description:
      `First Capital has deployed an AI-enhanced CECL loss forecasting module that uses ML-driven macroeconomic scenario weighting and lifetime PD/LGD projection to produce the bank's allowance for credit losses, but this AI module has not been registered in the bank's SR 11-7 model inventory, has not undergone independent model validation, and its methodology documentation does not meet the completeness standards required for a material model used in regulatory financial reporting. OCC Bulletin 2021-18 and SR 11-7 both require that models used in the determination of regulatory capital adequacy measures — including CECL allowance calculations — be registered in the model inventory and subjected to independent validation prior to deployment in regulatory reporting; an AI CECL model outside the model inventory constitutes a model governance deficiency that affects the bank's ability to assert the reliability of its allowance for credit losses to OCC examiners and external auditors.`,
    keywords: ['ai-cecl-forecasting', 'SR-11-7', 'model-inventory', 'OCC-2021-18', 'allowance-credit-losses'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1304',
    name: 'LLM Credit Committee Memo Containing Unverifiable Market Assertions',
    officeCategory: 'front_office',
    failureRatePct: 80,
    description:
      `First Capital's relationship managers use a large language model to draft credit committee memos for commercial loan approvals, and the LLM is inserting market commentary and industry outlook statements — citing specific market share figures, competitor financial metrics, and industry growth projections — that cannot be traced to identified data sources, because the LLM generates plausible-sounding but unverifiable assertions from its training data rather than from current, cited market research. OCC credit underwriting guidance and OCC examination standards for commercial credit require that credit committee submissions include analysis based on identified and verifiable sources of market and industry information; LLM-generated credit memos containing market assertions that are not attributed to verifiable sources cannot satisfy the documentation standard for credit committee approvals, and credit decisions approved on the basis of unverifiable AI-generated market analysis create a systemic credit underwriting documentation deficiency.`,
    keywords: ['llm-credit-memo', 'unverifiable-assertions', 'OCC-credit-underwriting', 'ai-hallucination', 'credit-committee'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1305',
    name: 'AI Borrower Financial Spreading Ignoring Off-Balance-Sheet Obligations',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI financial spreading tool extracts and spreads borrower financial statements from PDF uploads but does not capture off-balance-sheet obligations — operating lease commitments under ASC 842, contingent liabilities disclosed in footnotes, and unconsolidated variable interest entity exposures — resulting in leveraged metrics and debt service coverage calculations that systematically understate the borrower's total financial obligations. OCC commercial credit underwriting guidance requires that leverage and debt service coverage analyses account for all known material obligations including off-balance-sheet items disclosed in financial statement footnotes; an AI spreading tool that captures only balance sheet line items without parsing footnote disclosures produces DSCR and leverage ratios that overstate borrower repayment capacity, causing the bank to underestimate credit risk across the commercial loan portfolio.`,
    keywords: ['ai-financial-spreading', 'off-balance-sheet', 'OCC-underwriting', 'ASC-842', 'debt-service-coverage'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1306',
    name: 'ML Risk Rating Override Recommendation Engine Lacks Audit Trail',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's ML risk rating tool generates risk rating recommendations for commercial credits, and when relationship managers override the ML recommendation to assign a more favorable rating, the loan administration system records the final rating but does not capture the ML model's recommendation, the basis for the override, or the identity of the approving officer in a structured, queryable format — making it impossible for the bank to monitor override rates, override directionality, or the performance of overridden credits versus model-recommended credits. SR 11-7 model risk management guidance and OCC examination standards for risk rating governance require that model override decisions be documented with sufficient detail to support model performance monitoring and governance review; an ML rating tool whose overrides are not captured in a structured audit trail cannot be monitored for appropriate use, and systematic override of ML rating recommendations toward more favorable grades without documentation is a credit risk governance deficiency.`,
    keywords: ['ml-risk-rating', 'override-audit-trail', 'SR-11-7', 'credit-governance', 'model-monitoring'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1307',
    name: 'GenAI Loan Renewal Memo Recycling Prior-Year Analysis Without Update',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital's GenAI loan renewal drafting tool is configured to use prior-year credit memos as context documents when drafting renewal memos, and the tool is generating renewal memos that retain the prior year's borrower financial analysis, industry commentary, and risk assessment language with only surface-level updates — failing to reflect material changes in borrower financial condition, covenant compliance history, or industry outlook that occurred during the prior credit year. OCC annual review and credit renewal guidance requires that renewal memos reflect current borrower financial condition and document any material changes from the prior review period; GenAI renewal memos that largely recycle prior-year analysis without substantive updates fail to satisfy the OCC's annual review documentation standard and create a pattern of credit renewals approved on the basis of stale analysis, which examiners identify as a systemic credit administration deficiency.`,
    keywords: ['genai-loan-renewal', 'stale-analysis', 'OCC-annual-review', 'credit-administration', 'ai-recycling'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1308',
    name: 'AI Pricing Model Using Unvalidated Competitive Rate Inputs',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's AI loan pricing model incorporates competitive market rate feeds from a third-party data aggregator as inputs to its spread recommendation algorithm, but the bank has not validated the accuracy or representativeness of these competitive rate inputs — whether they reflect the relevant competitive market for First Capital's borrower segment, geography, and loan size — nor has it established a process for detecting when the data feed produces stale, erroneous, or unrepresentative rate inputs that would cause the pricing model to recommend spreads that are systematically too wide or too narrow for the actual competitive environment. OCC model risk management guidance and SR 11-7 require that model inputs be assessed for quality and fitness-for-purpose; a pricing model that ingests unvalidated third-party rate data without input quality controls may produce pricing recommendations that expose the bank to competitive margin compression or adverse selection risk that the bank cannot diagnose because it has not assessed input data quality.`,
    keywords: ['ai-loan-pricing', 'unvalidated-inputs', 'SR-11-7', 'competitive-rate-data', 'model-input-quality'],
    demoRelevant: false,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1309',
    name: 'LLM Borrower Industry Classification Producing Incorrect Stress Scenario Assignment',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital uses an LLM to classify commercial borrowers into industry stress scenario groups based on business description narratives in the credit file, but the LLM is misclassifying borrowers in diversified business models — assigning a healthcare technology company primarily to a technology stress scenario when its revenue is predominantly healthcare-services-driven — resulting in stress loss estimates that apply incorrect historical loss rate assumptions and sensitivity parameters to material segments of the commercial portfolio. OCC stress testing guidance requires that borrower segmentation for scenario analysis accurately reflect the primary economic drivers of credit risk for each borrower; LLM-based industry classification that misassigns borrowers to incorrect stress scenario groups produces stress loss estimates that do not accurately represent the bank's actual sector exposure profile, causing material misstatements in sector-level stress results presented to the board risk committee.`,
    keywords: ['llm-industry-classification', 'stress-scenario-assignment', 'OCC-stress-testing', 'borrower-segmentation', 'sector-risk'],
    demoRelevant: false,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1310',
    name: 'AI Credit Monitoring Dashboard Not Alerting on Covenant Cure Period Expiry',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's AI credit monitoring platform ingests covenant compliance certifications and tracks covenant compliance status but does not generate automated alerts when covenant cure periods are approaching expiry — the system flags the initial covenant breach but does not maintain a cure period countdown or trigger a relationship manager alert when the cure period end date is within 10 business days, resulting in situations where cure period deadlines pass without bank action and the bank loses its enforcement rights. OCC credit administration guidance requires that covenant monitoring systems track all material covenant breach timelines including cure periods to ensure timely exercise of lender remedies; an AI monitoring platform that identifies covenant breaches but fails to track cure period deadlines allows borrowers to cure covenant breaches on an unmonitored basis or allows cure periods to lapse without bank action, creating both credit risk and legal remedies exposure across the monitored portfolio.`,
    keywords: ['ai-credit-monitoring', 'covenant-cure-period', 'OCC-credit-administration', 'lender-remedies', 'covenant-tracking'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1311',
    name: 'ML PD Model Training Data Excluding Pandemic-Era Default Observations',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's ML probability of default model for commercial credits was retrained on a 2022 dataset that excluded 2020–2021 observations on the basis that pandemic-era defaults were anomalous and not representative of through-the-cycle credit behavior, but the exclusion was not documented in model validation materials and the model has not been assessed for whether the excluded period's default patterns — concentrated in hospitality, retail, and transportation — materially affect PD estimates for segments where the bank has current concentration. SR 11-7 model development and validation requirements specify that training data selection decisions must be documented, justified, and assessed for their effect on model outputs; excluding the most significant credit loss event in a generation from PD model training data without documented justification and impact assessment constitutes a model development deficiency, and the resulting PD estimates for pandemic-sensitive sectors may systematically understate through-the-cycle default probability.`,
    keywords: ['ml-pd-model', 'training-data-exclusion', 'SR-11-7', 'pandemic-defaults', 'model-development'],
    demoRelevant: false,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1312',
    name: 'GenAI Credit Policy Exception Memo Not Referencing Specific Policy Sections',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      `First Capital's relationship managers use GenAI to draft credit policy exception memos when proposing loans outside policy guidelines, and the AI-generated memos describe the exception in general terms without citing the specific credit policy section being excepted, the policy parameter being exceeded, the magnitude of the deviation, or the compensating factors being invoked — producing exception memos that credit approval authorities accept without the structured analysis required to document that the exception is knowingly approved with full understanding of the policy deviation. OCC credit policy and exception management guidance requires that policy exceptions be documented with reference to the specific policy provision being excepted and a discussion of compensating factors justifying approval outside policy; exception memos that lack specific policy citations and quantified deviation amounts do not satisfy OCC documentation standards for policy exception governance, and their acceptance creates a pattern of exception approvals without adequate governance documentation.`,
    keywords: ['genai-policy-exception', 'OCC-credit-policy', 'exception-governance', 'compensating-factors', 'policy-deviation'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1313',
    name: 'AI Collateral Monitoring System Misidentifying Pledged Asset Lien Priority',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI collateral management system tracks pledged collateral and lien positions for secured commercial loans, but the system is misidentifying lien priority on collateral securing multiple loan facilities — incorrectly recording second-lien positions as first-lien on shared collateral packages due to document parsing errors in the AI-driven UCC filing review module, causing the bank's loan-to-value calculations and collateral coverage assessments to overstate the bank's actual secured position on affected credits. OCC collateral management guidance requires that the bank maintain accurate records of its lien position on all pledged collateral, with first-lien-only LTV calculations where the bank holds a second-lien position; AI collateral document parsing errors that misidentify lien priority cause the bank to hold inadequate collateral coverage for the risk rating assigned, and lien priority errors in the collateral management system constitute a systemic credit administration deficiency in the secured commercial portfolio.`,
    keywords: ['ai-collateral-monitoring', 'lien-priority', 'OCC-collateral-management', 'UCC-filing', 'secured-lending'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1314',
    name: 'LLM Third-Party Risk Assessment Hallucinating Vendor Financial Stability Data',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital uses an LLM-based vendor due diligence tool to support third-party risk assessments for credit-critical service providers — credit bureau data suppliers, loan origination software vendors, and collateral appraisal management companies — and the tool is generating vendor financial stability assessments that cite revenue figures, debt ratings, and ownership structures that cannot be verified against public sources, because the LLM is producing plausible-sounding financial profiles that blend training data with hallucinated specifics. OCC third-party risk management guidance and OCC Bulletin 2023-17 require that AI tools used in third-party risk due diligence be validated for accuracy and that outputs be verified against authoritative sources before reliance; third-party risk assessments containing hallucinated vendor financial data cannot satisfy the OCC's due diligence documentation standard and create both an operational risk governance gap and a model risk exposure in the bank's third-party risk management program.`,
    keywords: ['llm-vendor-due-diligence', 'hallucination', 'OCC-third-party-risk', 'OCC-2023-17', 'vendor-financial-stability'],
    demoRelevant: false,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1315',
    name: 'AI Appraisal Review Tool Approving Unsupported Comparable Sales Adjustments',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's AI appraisal review tool performs automated desk reviews of residential and commercial appraisals submitted for loan origination, but the tool is approving appraisals that contain unsupported comparable sales adjustments — accepting appraisals where adjustments for condition, location, and amenity differences between comparables and subject property exceed USPAP guidance thresholds without flagging them for human reviewer escalation — causing inflated appraised values to pass into the loan origination system without challenge. OCC appraisal review guidance and USPAP require that appraisal review identify reports with adjustments that exceed defensible limits and escalate them for independent review by a qualified reviewer; an AI appraisal review tool that approves appraisals with excessive unsupported adjustments allows inflated collateral values to support loan approvals that would not survive a rigorous independent review, creating systematic LTV understatement in the origination pipeline.`,
    keywords: ['ai-appraisal-review', 'comparable-adjustments', 'OCC-appraisal', 'USPAP', 'collateral-valuation'],
    demoRelevant: false,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1316',
    name: 'ML Loan Forbearance Eligibility Model Without Fair Lending Disparate Impact Test',
    officeCategory: 'front_office',
    failureRatePct: 82,
    description:
      `First Capital has deployed an ML model to recommend forbearance and payment deferral eligibility for consumer borrowers experiencing financial hardship, but the model has not been tested for disparate impact across protected class categories — race, national origin, and sex as proxied by geography and surname analysis — meaning the bank cannot certify that the ML forbearance recommendation system does not systematically deny relief at higher rates to borrowers in protected classes than to similarly situated non-protected borrowers. CFPB supervisory guidance on algorithmic decision-making and ECOA require that automated systems used in credit accommodation decisions be assessed for disparate impact; deploying an ML forbearance eligibility model without disparate impact testing exposes First Capital to fair lending violations on every forbearance decision influenced by the model, and the absence of pre-deployment disparate impact testing constitutes a fair lending compliance program deficiency in the consumer credit servicing function.`,
    keywords: ['ml-forbearance-model', 'disparate-impact', 'ECOA', 'CFPB-fair-lending', 'protected-class'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },
  {
    code: 'B1317',
    name: 'AI Credit Limit Increase Engine Exceeding Board-Approved Concentration Thresholds',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's AI-driven credit limit increase recommendation engine for revolving commercial lines of credit generates automatic limit increase recommendations based on utilization patterns and payment performance, but the engine does not check whether approving a recommended increase would push sector-level or geographic concentration above board-approved thresholds — resulting in the engine recommending increases that, when approved in batch by credit officers, collectively advance portfolio concentration beyond policy limits without triggering a concentration policy alert. OCC concentration risk management guidance and board credit policy require that individual credit decisions incorporate a portfolio-level concentration check to prevent incremental approvals from silently breaching concentration limits; an AI credit limit engine that operates without real-time concentration constraint enforcement creates an approval channel through which concentration limits can be exceeded by accumulated small decisions that each appear compliant in isolation.`,
    keywords: ['ai-credit-limit', 'concentration-threshold', 'OCC-concentration-risk', 'board-policy', 'portfolio-governance'],
    demoRelevant: true,
    subTopic: 'ai-credit-advanced',
  },

  // ── Structured Finance Risk (B1318–B1329) ────────────────────────────────────

  {
    code: 'B1318',
    name: 'CLO Tranche Exposure Without Underlying Asset Class Transparency',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital holds $185M in CLO mezzanine tranches as part of its investment portfolio, but the credit risk management function does not perform look-through analysis to assess the underlying leveraged loan composition by industry, geography, borrower leverage, or covenant quality — relying instead on the CLO manager's quarterly investor reports without independently verifying that the underlying collateral pool characteristics remain consistent with the risk parameters underwritten at purchase. OCC guidance on structured finance instruments and the interagency guidance on complex securities require that bank holding companies with material CLO exposures perform look-through analysis to understand underlying collateral composition and risk; CLO tranche exposures managed without look-through transparency cannot be stress-tested accurately, and the bank cannot assess whether CLO exposures are correlated with direct loan portfolio concentrations, creating a blind spot in total credit concentration monitoring.`,
    keywords: ['CLO-tranche-exposure', 'look-through-analysis', 'OCC-structured-finance', 'leveraged-loans', 'concentration-risk'],
    demoRelevant: true,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1319',
    name: 'CDO Residual Interest Valuation Lacking Independent Price Verification',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital holds CDO residual interest positions with a carrying value of $42M that are valued using the CDO manager's internal model price rather than independent price verification, and the bank's independent price verification process does not include a procedure for CDO residual interests because the positions were not included in the scope of the investment portfolio's IPV program at the time of its design — creating Level 3 fair value measurements that are not subject to independent challenge. ASC 820 fair value measurement requirements and OCC investment securities guidance require that Level 3 fair value measurements be subject to independent price verification using alternative models or market data; CDO residual positions valued at manager-provided model prices without independent verification are subject to management bias and estimation uncertainty that cannot be quantified without alternative pricing models, and their exclusion from the IPV program is an investment accounting control deficiency.`,
    keywords: ['CDO-residual-interest', 'fair-value-level-3', 'ASC-820', 'OCC-investment-securities', 'independent-price-verification'],
    demoRelevant: false,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1320',
    name: 'Securitization Residual Risk Retained Below Risk Retention Rule Threshold Documentation',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital sponsors a commercial mortgage-backed securities conduit through which it securitizes commercial real estate loans, and the bank's risk retention documentation for recent securitization transactions does not demonstrate that the required 5% economic risk retention under Regulation RR is being maintained through a qualifying retention structure — specifically, the bank lacks documentation of the fair value calculation methodology used to verify that the retained interest's value equals the required 5% of the aggregate fair value of the ABS interests. SEC Risk Retention Rule and Regulation RR require that securitization sponsors maintain documentation sufficient to demonstrate compliance with the required retained interest calculation and holding period requirements; inadequate risk retention documentation creates a Regulation RR compliance deficiency that exposes the bank to regulatory action and reputational risk in the conduit securitization business.`,
    keywords: ['securitization-risk-retention', 'Regulation-RR', 'CMBS-conduit', 'ABS-interests', 'risk-retention-documentation'],
    demoRelevant: false,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1321',
    name: 'Warehouse Lending Concentration in Single Mortgage Originator Without Sublimit',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's warehouse lending portfolio has a single mortgage banking client representing $95M — 34% of the total warehouse lending book — without a board-approved single-obligor sublimit for warehouse lending counterparties, creating a concentration exposure to one mortgage originator that could generate a material credit loss if the originator experiences a disruption in its secondary market loan sale pipeline or a warehouse facility covenant event. OCC concentration risk management guidance and OCC lending guidance for warehouse lines of credit require that warehouse lending programs include counterparty concentration limits and regular assessment of originator pipeline quality, secondary market execution capacity, and liquidity position; the absence of a single-originator sublimit allows warehouse lending concentration to grow to a level that, if the originator fails to sell through its pipeline, could create a credit exposure exceeding the bank's large-exposure thresholds without a board-approved limit framework.`,
    keywords: ['warehouse-lending-concentration', 'single-obligor', 'OCC-warehouse-lending', 'mortgage-banking', 'concentration-sublimit'],
    demoRelevant: true,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1322',
    name: 'ABCP Conduit Liquidity Facility Trigger Not Tested Under Stress Scenarios',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital provides a liquidity facility to an asset-backed commercial paper conduit it administers, but the liquidity facility trigger conditions — which define when the bank is obligated to fund the conduit under market disruption events — have not been tested under stress scenarios to determine whether the trigger conditions could be activated simultaneously with other bank liquidity stress events, and the bank has not estimated the maximum simultaneous liquidity call from the facility under an ABCP market disruption scenario. OCC liquidity risk management guidance and Basel III LCR requirements require that contingent liquidity exposures including committed facilities to sponsored conduits be incorporated into liquidity stress scenarios; an unassessed ABCP liquidity facility that could trigger during a market-wide stress event represents an unquantified contingent liquidity exposure that may cause the bank to understate its stressed liquidity outflows and overstate its liquidity coverage ratio under severe market stress conditions.`,
    keywords: ['ABCP-conduit', 'liquidity-facility', 'OCC-liquidity-risk', 'Basel-III-LCR', 'contingent-liquidity'],
    demoRelevant: false,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1323',
    name: 'CLO Manager Replacement Trigger Assessment Not Performed at Acquisition',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's investment portfolio team acquires CLO tranche positions without performing a structured assessment of manager replacement trigger provisions in CLO indentures — the contractual conditions under which the trustee can remove the collateral manager — and has not assessed whether the current CLO managers for its positions are operating close to compliance covenant thresholds that would trigger a manager replacement process and potentially disrupt collateral reinvestment and portfolio quality. OCC investment portfolio management guidance requires that pre-acquisition due diligence for structured securities assess governance provisions affecting collateral management quality; failure to review manager replacement trigger conditions means the bank cannot detect whether it holds CLO positions whose underlying collateral management is at risk of disruption, which could impair principal recovery in stressed scenarios when collateral management quality is most important.`,
    keywords: ['CLO-manager-replacement', 'collateral-management', 'OCC-investment-portfolio', 'structured-securities', 'due-diligence'],
    demoRelevant: false,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1324',
    name: 'Synthetic CDO Counterparty Exposure Not Aggregated with Cash Position Limits',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital holds synthetic CDO positions whose credit protection is written on reference entities that overlap with direct commercial loan exposures to the same borrowers, but the bank's credit counterparty exposure aggregation system does not combine synthetic CDO reference entity notional exposure with direct loan outstanding balances when calculating total counterparty exposure for limit monitoring purposes — allowing the combined direct and synthetic exposure to certain reference names to exceed the bank's large-exposure limits without triggering a limit breach alert. OCC guidance on large exposures and the BCBS large exposures framework require that all credit exposures to a counterparty — direct lending, guarantees, and off-balance-sheet reference entity exposures — be aggregated for limit compliance monitoring; the failure to aggregate synthetic and cash exposures creates phantom limit capacity that allows the bank to accumulate credit risk to single names beyond its board-approved risk appetite.`,
    keywords: ['synthetic-CDO', 'counterparty-aggregation', 'OCC-large-exposure', 'BCBS-large-exposures', 'credit-limits'],
    demoRelevant: false,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1325',
    name: 'Warehouse Line Advance Rate Not Adjusted for Aged Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's warehouse lending program advances against mortgage loans at a standard 98% advance rate regardless of the age of the loan in the warehouse, without applying a haircut schedule that reduces the advance rate on loans that have been in the warehouse for more than 45 days and are approaching the maximum takeout commitment period — allowing aged inventory to remain fully advanced even as the probability of secondary market execution decreases and the risk of the originator being unable to sell through the pipeline increases. OCC guidance on warehouse lending credit risk management and commercial lending guidance require that warehouse credit facilities incorporate margin maintenance and advance rate adjustment mechanisms that reflect the changing risk profile of aged mortgage inventory; a static advance rate without an aging haircut schedule allows warehouse lending credit exposure to remain fully extended against inventory whose liquidation value has deteriorated below the advance amount.`,
    keywords: ['warehouse-advance-rate', 'aged-inventory', 'OCC-warehouse-lending', 'margin-maintenance', 'takeout-risk'],
    demoRelevant: true,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1326',
    name: 'Structured Credit Mark-to-Model Process Lacking Stress Sensitivity Analysis',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's structured credit portfolio — comprising CLO tranches, synthetic CDO positions, and CMBS bonds — is valued through a mark-to-model process that produces quarterly fair value estimates but does not include a stress sensitivity analysis showing how valuations would change under adverse credit spread, default correlation, and prepayment assumptions, leaving the board audit committee without the information needed to assess valuation uncertainty in the structured credit book. ASC 820 disclosure requirements and OCC investment portfolio risk management guidance require that Level 3 fair value measurements include sensitivity analysis showing the effect of alternative model assumptions on reported fair values; structured credit positions valued without stress sensitivity disclosure cannot be presented to the board with a complete representation of fair value estimation uncertainty, and the absence of sensitivity analysis is an investment fair value disclosure deficiency.`,
    keywords: ['structured-credit', 'mark-to-model', 'ASC-820', 'stress-sensitivity', 'fair-value-uncertainty'],
    demoRelevant: false,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1327',
    name: 'Securitization Subordination Level Assessment Not Updated Post-Origination',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's credit risk assessments for retained CMBS and CLO positions incorporate the subordination levels at the time of acquisition, but the bank does not perform ongoing assessments of whether current subordination levels — as reduced by realized collateral losses since acquisition — still provide adequate credit enhancement for the bank's risk rating assigned to the position, allowing risk ratings to become stale as subordination erosion occurs within the structured security pool. OCC guidance on structured finance credit risk management requires that risk ratings for structured securities reflect current credit enhancement levels, not origination-period assumptions; retained structured positions whose assigned risk ratings are based on original subordination levels without adjustment for pool performance deterioration may carry ratings that overstate current credit quality, causing understated expected loss estimates and inadequate credit reserves for the structured security portfolio.`,
    keywords: ['securitization-subordination', 'credit-enhancement', 'OCC-structured-finance', 'risk-rating', 'pool-performance'],
    demoRelevant: false,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1328',
    name: 'CLO Overcollateralization Test Breach Monitoring Not Automated',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital holds mezzanine CLO tranche positions where overcollateralization test breaches would divert cash flows from mezzanine interest payments to senior note redemption, but the bank's CLO monitoring function relies on quarterly investor reports to identify OC test results rather than automating a real-time alert from trustee report data feeds — resulting in a 60–90 day lag between an OC test breach occurring within a CLO and the bank's awareness of the event and its cash flow implications. OCC investment portfolio monitoring guidance requires that banks with structured security positions have monitoring processes adequate to detect material events affecting cash flows and credit quality; a 60–90 day monitoring lag on CLO overcollateralization test breaches means the bank cannot take timely action on positions experiencing cash flow diversion — either reassessing carrying value or executing a disposition decision — before the event is fully reflected in investor reporting.`,
    keywords: ['CLO-overcollateralization', 'OC-test-breach', 'OCC-investment-monitoring', 'cash-flow-diversion', 'trustee-reporting'],
    demoRelevant: false,
    subTopic: 'structured-finance-risk',
  },
  {
    code: 'B1329',
    name: 'Warehouse Lender Repurchase Obligation Not Assessed in Originator Due Diligence',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital's warehouse lending underwriting process assesses mortgage originator financial condition, pipeline quality, and secondary market execution relationships but does not include an assessment of the originator's outstanding repurchase obligation exposure — specifically, the volume of repurchase demands received from agency and investor buyers for loans previously sold — leaving First Capital without visibility into contingent originator liabilities that could impair the originator's liquidity and its ability to retire the warehouse facility in a pipeline disruption event. OCC guidance on warehouse lending credit risk requires that warehouse lender due diligence assess all material contingent liabilities of mortgage banking clients, including repurchase obligation volumes and trends; unassessed repurchase exposure that materially impairs originator liquidity is a leading indicator of warehouse line default risk that First Capital cannot detect without incorporating repurchase metrics into its ongoing originator monitoring program.`,
    keywords: ['warehouse-lender', 'repurchase-obligation', 'OCC-warehouse-lending', 'originator-due-diligence', 'contingent-liability'],
    demoRelevant: true,
    subTopic: 'structured-finance-risk',
  },

  // ── Credit Portfolio Management (B1330–B1339) ────────────────────────────────

  {
    code: 'B1330',
    name: 'Portfolio Hedge Documentation Failing to Establish Hedge Effectiveness Under ASC 815',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description:
      `First Capital uses credit default swap positions and credit-linked note purchases to hedge commercial loan credit risk, but the bank's hedge accounting documentation does not satisfy the formal designation and effectiveness testing requirements of ASC 815 — specifically, prospective effectiveness assessments are prepared at hedge inception but retrospective effectiveness testing is not performed at each reporting date, and the documentation does not identify the hedged risk with sufficient specificity to match the derivative's risk profile to the hedged item. ASC 815 requires that formal hedge documentation be completed at hedge inception and maintained throughout the hedge relationship, with prospective and retrospective effectiveness assessments at each reporting date; credit hedges lacking qualifying hedge accounting documentation must be reported at fair value with changes recognized in earnings rather than in OCI, creating P&L volatility and capital ratio variation that the bank's treasury function has not incorporated into its financial planning assumptions.`,
    keywords: ['credit-hedge-documentation', 'ASC-815', 'hedge-effectiveness', 'CDS-accounting', 'OCC-hedge-accounting'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1331',
    name: 'Credit Derivative Counterparty Exposure Netting Not Legally Enforceable',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's credit risk management framework nets credit derivative exposures against the same counterparty's loan exposures for large-exposure limit monitoring and regulatory capital calculations, but the legal opinion supporting the enforceability of master netting arrangements with three of the bank's five credit derivative counterparties has expired without renewal, meaning the bank may not be able to enforce the netting upon a counterparty default and may be required to post full gross collateral rather than net exposure amounts in a stress event. OCC guidance on netting enforceability and Basel III capital treatment of bilateral netting require that legal opinions supporting netting enforceability be current and jurisdiction-specific; expired legal opinions supporting credit derivative netting cause the bank to understate its gross counterparty exposure and to misstate its regulatory capital requirement for counterparty credit risk, with potential capital ratio impact if netting is not legally enforceable at the time of counterparty default.`,
    keywords: ['credit-derivative', 'netting-enforceability', 'Basel-III-CCR', 'legal-opinion', 'OCC-counterparty-exposure'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1332',
    name: 'Risk Transfer Effectiveness Not Tested — CDS Purchased Reference Name Mismatch',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's credit risk hedging program purchases credit default swap protection on index reference names to hedge the commercial loan portfolio, but the bank has not performed a formal risk transfer effectiveness analysis assessing whether the CDS reference name composition provides meaningful correlation with the bank's actual loan portfolio risk — specifically, whether the CDS positions offset credit losses in a stress scenario given that the bank's portfolio is concentrated in regional middle-market names not represented in major CDS indices. OCC guidance on credit risk mitigation and Basel III credit risk mitigation standards require that risk mitigation instruments provide demonstrable risk reduction with sufficient correlation to the underlying exposures; CDS positions on index names that are poorly correlated with the bank's actual credit exposures do not provide effective risk mitigation and may consume hedge budget without producing meaningful protection during a regional credit stress event.`,
    keywords: ['risk-transfer-effectiveness', 'CDS-reference-name', 'OCC-credit-risk-mitigation', 'Basel-III-CRM', 'hedge-correlation'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1333',
    name: 'Portfolio Concentration Limit Utilization Reporting Missing Intraday Granularity',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's portfolio concentration monitoring system produces daily end-of-day concentration reports that are distributed to credit risk management and ALCO, but the system does not support intraday concentration limit utilization visibility — meaning that loan commitments approved during the business day can push sector concentrations above limits for hours before the overnight batch run produces a limit breach alert, by which time the commitment is already legally executed and cannot be easily unwound. OCC concentration risk management guidance requires that concentration limit monitoring systems be capable of detecting limit breaches with sufficient timeliness to enable corrective action; an end-of-day-only concentration monitoring framework for an active origination business that processes multiple large loan commitments per day allows concentration limits to be exceeded intraday without detection, creating a systematic gap between concentration policy and concentration control.`,
    keywords: ['concentration-limit', 'intraday-monitoring', 'OCC-concentration-risk', 'loan-commitment', 'real-time-reporting'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1334',
    name: 'Loan Sale Portfolio Management Strategy Not Integrated with Capital Planning',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's loan sale and portfolio management function executes loan sales to manage concentration and generate liquidity but does not formally coordinate with the capital planning function to optimize the timing and volume of loan sales against projected capital ratio trajectories — resulting in loan sale decisions that provide concentration relief but may not be timed to maximize capital ratio impact in periods preceding regulatory minimum ratio thresholds or stress test submissions. OCC capital adequacy guidance and DFAST stress testing requirements expect that capital planning incorporate all material capital-generating activities including loan sales; a loan portfolio management function that executes disposition decisions without integration into the capital plan cannot demonstrate that loan sale activity is part of a capital strategy, which OCC examiners view as a weakness in integrated capital and credit risk management governance.`,
    keywords: ['loan-sale', 'capital-planning', 'OCC-capital-adequacy', 'DFAST', 'portfolio-disposition'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1335',
    name: 'Credit Portfolio Vintage Analysis Not Informing Underwriting Standards Review',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's credit risk analytics function produces quarterly vintage analysis reports showing loss rates and delinquency patterns by origination cohort across the commercial and consumer loan portfolios, but these vintage reports are distributed to portfolio management without a formal feedback loop to the underwriting standards committee — meaning that vintages showing elevated early-period delinquency rates do not automatically trigger a review of whether the underwriting standards in effect at the time of those originations should be adjusted. OCC credit risk management guidance and OCC annual review expectations require that performance data from existing vintages inform the continuous review of underwriting policies; vintage analysis that is not formally connected to an underwriting standards feedback process is a management information system that produces insight without producing action, which OCC examiners view as a credit risk management governance gap.`,
    keywords: ['vintage-analysis', 'underwriting-standards', 'OCC-credit-governance', 'loss-rates', 'feedback-loop'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1336',
    name: 'Leveraged Loan Portfolio Covenant-Lite Share Not Reported to ALCO',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's leveraged lending portfolio contains a growing proportion of covenant-lite structures — loans with maintenance covenants waived in favor of incurrence-only covenants — but the bank's ALCO credit reporting does not separately identify the covenant-lite share of the leveraged portfolio or assess the monitoring implications of a portfolio composition that relies primarily on incurrence covenants for early warning trigger points, leaving ALCO without visibility into the bank's covenant monitoring intensity relative to the portfolio's risk profile. OCC leveraged lending guidance and interagency guidance on leveraged lending require that banks with material leveraged lending portfolios monitor and report on covenant structure composition and assess whether the monitoring program is adapted for covenant-lite exposures; a leveraged portfolio reporting structure that does not separately track covenant-lite exposure leaves ALCO making credit risk decisions without full visibility into the portfolio's early warning system adequacy.`,
    keywords: ['leveraged-loans', 'covenant-lite', 'OCC-leveraged-lending', 'ALCO-reporting', 'covenant-monitoring'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1337',
    name: 'Participations Purchased Without Independent Credit Underwriting Documentation',
    officeCategory: 'front_office',
    failureRatePct: 81,
    description:
      `First Capital participates in shared national credits and club deal structures where the lead arranger originates and underwrites the credit, and First Capital's participation purchase process relies on the lead arranger's credit memorandum as the primary credit analysis rather than preparing an independent credit analysis — meaning the bank's credit approval documentation for participation purchases consists of an approval memo referencing the lead arranger's analysis without First Capital's own independent assessment of borrower financial condition, industry risk, and repayment sources. OCC guidance on purchased loans and participation lending requires that purchasing institutions conduct their own independent credit underwriting analysis before participating in a credit facility; reliance on lead arranger underwriting without independent analysis is a credit underwriting deficiency that OCC examiners specifically cite in participation lending examinations, and First Capital cannot demonstrate independent credit judgment on its participation portfolio to OCC examiners reviewing credit underwriting quality.`,
    keywords: ['participation-purchased', 'independent-underwriting', 'OCC-participation-lending', 'shared-national-credits', 'lead-arranger'],
    demoRelevant: true,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1338',
    name: 'Portfolio-Level Expected Loss Estimate Not Reconciled to CECL Allowance',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's credit risk management function produces a portfolio-level expected loss estimate using the bank's internal PD, LGD, and EAD models for capital adequacy assessment purposes, but this expected loss estimate is not formally reconciled to the CECL allowance for credit losses computed by the accounting function — meaning the bank has two separate estimates of lifetime expected credit losses for the same portfolio that are not compared or explained, and differences between the two estimates are not reviewed to ensure that methodological differences are intentional and justified. OCC examination standards for CECL and credit risk capital alignment expect that the expected loss estimate used in capital planning and the CECL allowance be reconciled with documented explanation of methodology differences; unexplained divergence between the bank's internal EL estimate and CECL allowance suggests that one or both estimates may be methodologically inconsistent, creating a credit reserves accuracy concern.`,
    keywords: ['expected-loss', 'CECL-reconciliation', 'OCC-CECL', 'capital-adequacy', 'allowance-accuracy'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },
  {
    code: 'B1339',
    name: 'Sector Stress Loss Limits Not Calibrated to Current Portfolio Composition',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's credit risk appetite framework includes sector-level stress loss limits — maximum acceptable loss estimates under an adverse credit scenario for each major industry sector — but these limits were calibrated three years ago based on the then-current portfolio composition and have not been recalibrated to reflect significant changes in portfolio sector mix, particularly the growth of technology-sector lending and the reduction in energy lending, meaning the current sector stress loss limits do not accurately represent the board's risk appetite relative to the actual current portfolio risk profile. OCC credit risk appetite governance guidance requires that risk limits be reviewed and recalibrated periodically to ensure they remain aligned with the institution's actual risk profile and strategic objectives; stress loss limits that are materially stale relative to portfolio composition changes do not provide meaningful constraint on sector risk-taking, because the limits were designed for a different portfolio than the one they are currently applied to.`,
    keywords: ['sector-stress-limits', 'risk-appetite', 'OCC-credit-risk-appetite', 'limit-calibration', 'portfolio-composition'],
    demoRelevant: false,
    subTopic: 'credit-portfolio-management',
  },

  // ── Commercial Real Estate Advanced (B1340–B1349) ────────────────────────────

  {
    code: 'B1340',
    name: 'CRE Debt Service Coverage Monitoring Frequency Below OCC Minimum for Classified Assets',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description:
      `First Capital's CRE loan portfolio monitoring policy requires annual DSCR updates for all performing CRE loans, but classified CRE credits — those rated Substandard or Doubtful — are subject to the same annual DSCR update cycle rather than the semi-annual or quarterly update cycle that OCC examination standards recommend for criticized and classified CRE assets, leaving the bank's special assets team making collateral coverage and loss reserve decisions on DSCR information that may be 6–18 months old on credits where financial deterioration is the most likely trajectory. OCC guidance on CRE loan administration and CRE examination procedures require that banks implement enhanced monitoring frequencies for criticized and classified CRE loans, with DSCR updates at least semi-annually for Substandard credits and quarterly for Doubtful credits; applying the performing loan monitoring frequency to classified CRE assets is a credit administration deficiency that OCC examiners specifically cite when assessing the adequacy of classified asset management processes.`,
    keywords: ['CRE-DSCR-monitoring', 'classified-assets', 'OCC-CRE-examination', 'special-assets', 'monitoring-frequency'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1341',
    name: 'Construction Loan Inspection Reports Not Reviewed by Credit Officer Before Advance',
    officeCategory: 'front_office',
    failureRatePct: 80,
    description:
      `First Capital's construction lending program uses third-party inspectors to produce draw request inspection reports verifying construction progress before loan disbursements, but the current process routes inspection reports to the loan administration team for disbursement processing without requiring credit officer review of the inspection findings — allowing construction draws to be approved and funded based on disbursement calculations without a credit officer reviewing whether the inspection identified any construction deficiencies, budget variances, or completion schedule deviations that should affect the draw approval decision. OCC construction lending guidance and OCC examination procedures for construction loans require that inspection reports be reviewed by qualified bank personnel — typically the relationship manager or credit officer — before construction draws are approved; processing construction draws without credit officer review of inspection findings removes the primary control for detecting project distress signals before additional bank funds are disbursed into a deteriorating construction project.`,
    keywords: ['construction-loan-inspection', 'draw-approval', 'OCC-construction-lending', 'disbursement-control', 'credit-officer-review'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1342',
    name: 'CRE Appraisal Independence Deficiency — Appraiser Selected by Borrower',
    officeCategory: 'front_office',
    failureRatePct: 85,
    description:
      `First Capital's CRE loan origination process for certain correspondent lending relationships allows the borrower or borrower's broker to select and engage the appraiser directly, with the completed appraisal submitted to the bank as part of the loan package — a practice that violates the appraiser independence requirements of the interagency appraisal and evaluation guidelines by allowing the borrower to select and control the appraisal engagement. Interagency appraisal guidelines, OCC Bulletin 2010-42, and FIRREA require that the bank — not the borrower — select, engage, and communicate directly with the appraiser to ensure appraiser independence; borrower-selected appraisers are subject to appraiser selection bias that inflates appraised values to facilitate loan approval, and the practice of accepting borrower-arranged appraisals in First Capital's correspondent channel is a direct violation of appraiser independence requirements that OCC examiners treat as a Regulation Requirement finding requiring immediate remediation.`,
    keywords: ['CRE-appraisal-independence', 'borrower-selected-appraiser', 'OCC-Bulletin-2010-42', 'FIRREA', 'interagency-appraisal'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1343',
    name: 'Office CRE Portfolio Repricing Risk Assessment Not Updated for Hybrid Work Demand Shift',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's office CRE loan portfolio contains $220M in class B and class C suburban office exposures whose credit risk assessments have not been formally updated to reflect the structural reduction in suburban office demand caused by the shift to hybrid work arrangements — the last portfolio-level office sector review was completed before hybrid work adoption became a permanent structural feature of the market — leaving the board without a current assessment of repricing risk when the portfolio's office loans approach maturity over the next 24 months. OCC CRE examination guidance requires that banks with material office sector concentrations assess the credit risk implications of structural market changes on their portfolio, including cap rate compression risk and vacancy rate assumptions used in DSCR projections; a CRE credit risk program that has not updated its office sector analysis for a structural demand shift cannot provide the board with a reliable estimate of repricing loss risk at loan maturity, which OCC examiners treat as a current credit risk management deficiency.`,
    keywords: ['office-CRE', 'hybrid-work', 'OCC-CRE-examination', 'repricing-risk', 'maturity-concentration'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1344',
    name: 'Hotel CRE RevPAR-Based DSCR Calculation Missing Seasonality Adjustment',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's hotel and hospitality CRE loan underwriting and annual review process calculates debt service coverage using trailing 12-month RevPAR data without applying a seasonality-adjusted DSCR that normalizes for peak-season revenue concentration — causing DSCR calculations performed on loans whose annual review coincides with the high-season reporting period to overstate annualized debt service coverage relative to the property's full-cycle revenue capacity. OCC CRE underwriting guidance for hospitality properties requires that DSCR calculations for lodging assets reflect stabilized, normalized operations rather than trailing performance that may be distorted by seasonal peaks; seasonality-unadjusted DSCR calculations that coincide with high-season performance periods produce DSCR ratios that overstate credit quality and may cause the bank to carry loans at passing risk ratings that would be classified as Special Mention based on normalized operating performance.`,
    keywords: ['hotel-CRE', 'RevPAR-DSCR', 'OCC-hospitality-lending', 'seasonality-adjustment', 'debt-service-coverage'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1345',
    name: 'CRE Loan Maturity Concentration Not Stress-Tested for Refinance Market Disruption',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's CRE portfolio has 41% of outstanding balances maturing within a 14-month window, but the bank's CRE stress testing program does not include a scenario that combines the maturity concentration with a refinance market disruption — rising cap rates, tightened DSCR requirements, and reduced lender appetite for the affected property types — to estimate how many loans in the maturity window would be unable to refinance and the potential extension, modification, or loss implications of a refinance market stress. OCC guidance on CRE concentration risk and interagency CRE guidance both require that stress scenarios for CRE-concentrated institutions address maturity wall risk; a stress testing program that does not assess the combined effect of maturity concentration and refinance market stress cannot quantify the maximum loss or capital impact under a plausible adverse scenario for First Capital's most material credit risk concentration.`,
    keywords: ['CRE-maturity-concentration', 'refinance-risk', 'OCC-CRE-concentration', 'maturity-wall', 'stress-testing'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1346',
    name: 'Multifamily CRE Rent Regulation Exposure Not Tracked in Loan Administration',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's multifamily CRE portfolio includes properties in jurisdictions with rent stabilization and rent control ordinances, but the bank's loan administration system does not flag rent-regulated properties or track the proportion of units subject to rent regulation, preventing the credit risk management function from assessing the revenue ceiling implications of rent regulation on DSCR projections, stress testing, and risk ratings for the multifamily portfolio. OCC CRE guidance and examination standards for multifamily lending require that credit risk analysis for multifamily CRE account for regulatory constraints on rent income, including rent stabilization and rent control provisions; a loan administration system that does not identify rent-regulated properties cannot support a credit risk assessment of the income limitation risk inherent in multifamily assets operating under rent regulation, which is particularly material for properties in major metropolitan markets where regulatory changes are actively increasing rent regulation scope.`,
    keywords: ['multifamily-CRE', 'rent-regulation', 'OCC-multifamily', 'loan-administration', 'DSCR-ceiling'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1347',
    name: 'CRE Environmental Risk Assessment Not Refreshed for Regulatory Designation Changes',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's CRE collateral management process obtains Phase I environmental site assessments at origination but does not have a procedure for refreshing environmental risk assessments when properties are listed on federal or state hazardous site registries — CERCLA Superfund preliminary assessment, RCRA corrective action designation, or state brownfield program listing — after the loan origination date, leaving the bank unaware that collateral properties have received environmental designations post-origination that materially impair their liquidation value. OCC collateral management guidance requires that the bank monitor known environmental risks associated with collateral properties and reassess collateral value when environmental events occur that could impair liquidation value; collateral properties receiving post-origination Superfund or RCRA designations may have environmental remediation liabilities that exceed appraised value, and the bank's failure to monitor regulatory designation changes means these collateral impairments may not be detected until foreclosure.`,
    keywords: ['CRE-environmental-risk', 'CERCLA-Superfund', 'OCC-collateral-management', 'Phase-I-assessment', 'environmental-impairment'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1348',
    name: 'Construction Loan Budget Contingency Adequacy Not Assessed at Draw Review',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's construction loan draw review process evaluates physical completion percentage and disbursement balance but does not include a formal assessment of whether the remaining undisbursed loan balance — including unused contingency — is sufficient to complete the project based on current cost-to-complete estimates, leaving the bank without visibility into whether projects are approaching a budget shortfall before funds are exhausted. OCC construction lending examination guidance requires that banks monitor construction loan budget adequacy throughout the construction period, not merely at origination; a draw review process that does not assess cost-to-complete versus remaining loan balance cannot detect approaching budget shortfalls in time to require the borrower to inject additional equity or restructure the facility before the bank runs out of committed funds, which is the point at which a budget deficiency converts from a manageable risk to an active credit loss.`,
    keywords: ['construction-loan-budget', 'cost-to-complete', 'OCC-construction-lending', 'draw-review', 'budget-shortfall'],
    demoRelevant: true,
    subTopic: 'commercial-real-estate-advanced',
  },
  {
    code: 'B1349',
    name: 'CRE Loan Interest Reserve Adequacy Not Reassessed at Mid-Construction',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's construction loans include interest reserves sized at origination based on the projected construction timeline and initial interest rate, but the bank does not perform a mid-construction interest reserve adequacy assessment — evaluating whether the remaining interest reserve will cover projected interest accruals through the revised completion and lease-up timeline — on projects where construction schedules have slipped beyond the original underwritten timeline, allowing interest reserves to be exhausted before construction completion without triggering a bank response. OCC construction lending guidance requires that construction loan monitoring include assessment of interest reserve adequacy when projects experience timeline delays; interest reserves that are exhausted mid-construction require the borrower to service debt from equity injection or cause interest to be paid from remaining loan proceeds not intended for that purpose, which is an early indicator of project distress that the bank cannot detect without a proactive interest reserve reassessment process.`,
    keywords: ['construction-interest-reserve', 'timeline-delay', 'OCC-construction-lending', 'reserve-adequacy', 'project-distress'],
    demoRelevant: false,
    subTopic: 'commercial-real-estate-advanced',
  },

  // ── Credit Approval Governance (B1350–B1359) ─────────────────────────────────

  {
    code: 'B1350',
    name: 'Credit Committee Quorum Achieved by Email Approval Without Deliberation Record',
    officeCategory: 'front_office',
    failureRatePct: 83,
    description:
      `First Capital's credit committee governance policy counts email approval responses from committee members as valid quorum votes for credit committee decisions, and in practice more than 60% of credit approvals are obtained through serial email vote rather than through a convened committee deliberation — creating a pattern of credit decisions that satisfy the technical quorum requirement without any documented committee discussion, challenge, or deliberation on the credit presented. OCC credit governance examination standards require that credit committee approvals reflect genuine collegial review of credit risk rather than a serial ratification of the relationship manager's recommendation; email-only approval processes that produce no record of committee deliberation cannot demonstrate to OCC examiners that the credit committee is functioning as a substantive governance mechanism rather than a form of group ratification, and the absence of deliberation records for the majority of credit committee approvals is a credit governance deficiency.`,
    keywords: ['credit-committee-quorum', 'email-approval', 'OCC-credit-governance', 'deliberation-record', 'committee-governance'],
    demoRelevant: true,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1351',
    name: 'Approval Authority Delegation Matrix Not Updated for Organizational Restructuring',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      `First Capital reorganized its commercial banking division 14 months ago — combining regional banking and specialty lending into a unified commercial banking group — but the credit approval authority delegation matrix has not been updated to reflect the new organizational structure, resulting in loan approvals being executed under authority delegations tied to legacy titles and reporting lines that no longer exist, and new officers exercising credit approval authority based on informal management direction rather than formal board-delegated authority. OCC credit governance standards require that credit approval authority be formally delegated through a board-approved delegation matrix that is maintained to reflect current organizational structure; approval authority exercised under a stale delegation matrix that does not reflect the current organizational structure is of questionable legal validity, and OCC examiners reviewing credit governance find that loan approvals executed under authority not formally delegated to the approving officer's current role constitute a credit governance deficiency requiring immediate documentation remediation.`,
    keywords: ['approval-authority-delegation', 'OCC-credit-governance', 'delegation-matrix', 'organizational-restructuring', 'board-delegation'],
    demoRelevant: true,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1352',
    name: 'Policy Exception Tracking System Not Capturing All Approval Authority Levels',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's exception tracking system captures policy exceptions approved at credit committee and above but does not capture exceptions approved at the relationship manager and regional credit officer level — where the bank's credit policy authorizes individual approval of policy exceptions up to specific size and deviation thresholds — resulting in an exception tracking database that reflects only a fraction of total policy exceptions granted across the commercial portfolio. OCC credit policy governance guidance requires that all policy exceptions — regardless of the approval level at which they are granted — be tracked in a centralized exception management system that enables portfolio-level exception monitoring, trend analysis, and board reporting; an exception tracking system that captures only senior-level exceptions misrepresents the bank's actual exception rate to the board risk committee and prevents management from detecting whether certain relationship managers or regional offices have elevated exception rates that warrant credit policy training or oversight.`,
    keywords: ['policy-exception-tracking', 'OCC-credit-policy', 'exception-management', 'approval-authority-levels', 'board-reporting'],
    demoRelevant: true,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1353',
    name: 'Credit Approval Turnaround Time Pressure Creating Incomplete Underwriting Submissions',
    officeCategory: 'front_office',
    failureRatePct: 80,
    description:
      `First Capital's commercial banking division operates under a 5-business-day credit approval turnaround time commitment to relationship managers, and audit review of credit committee submissions finds that 28% of approvals are based on incomplete credit packages — missing current borrower financial statements, updated appraisals, or required sensitivity analysis — because relationship managers submit incomplete packages to meet the turnaround commitment rather than waiting for complete credit information, and credit officers approve the incomplete submissions rather than returning them for completion. OCC credit underwriting standards require that credit decisions be based on complete credit information appropriate to the loan type and size; approving credits based on incomplete credit packages to meet turnaround time commitments constitutes a credit underwriting standard deficiency where operational service level pressures are causing credit quality controls to be bypassed, which OCC examiners identify as an underwriting process governance failure.`,
    keywords: ['credit-approval-turnaround', 'incomplete-underwriting', 'OCC-credit-underwriting', 'service-level-pressure', 'credit-governance'],
    demoRelevant: true,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1354',
    name: 'Out-of-Territory Approvals Lacking Enhanced Due Diligence Documentation',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's credit policy requires enhanced due diligence documentation — including third-party market analysis and local market expert opinion — for commercial loans originated outside the bank's defined geographic market footprint, but 34% of out-of-territory originations in the prior 12 months do not contain the required enhanced documentation because the policy's geographic footprint definition was not updated to reflect the bank's expanded lending activity in two new states, leaving a documentation compliance gap that is not being captured in exception tracking. OCC geographic concentration and out-of-market lending guidance require that banks lending outside their primary geographic market exercise heightened underwriting standards that compensate for reduced local market knowledge; the failure to require or track enhanced documentation for out-of-territory originations means the bank is extending credit outside its core market without the additional scrutiny that the policy was designed to require, creating credit underwriting quality uncertainty in the geographic expansion portfolio.`,
    keywords: ['out-of-territory', 'enhanced-due-diligence', 'OCC-geographic-risk', 'geographic-expansion', 'underwriting-standards'],
    demoRelevant: false,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1355',
    name: 'Interim Credit Approvals Outstanding Beyond Board-Authorized Time Limit',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital's credit policy authorizes interim credit approvals — temporary commitment letters issued before full credit committee review — for up to 30 days to facilitate time-sensitive transactions, but 19 interim approvals in the current portfolio are outstanding beyond 90 days without conversion to a full credit committee approval, because neither the loan administration system nor the credit oversight function has an automated tracking mechanism that escalates stale interim approvals for management review and resolution. OCC credit governance guidance requires that interim or conditional credit approvals be resolved within the bank's authorized temporary approval period; interim approvals outstanding beyond the board-authorized time limit are not properly approved credits under the bank's governance framework, and loans funded under expired interim approvals represent a credit governance deficiency that OCC examiners may treat as loans originated without proper credit authority.`,
    keywords: ['interim-credit-approval', 'OCC-credit-governance', 'approval-expiration', 'temporary-commitment', 'governance-escalation'],
    demoRelevant: false,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1356',
    name: 'Relationship Manager Conflict of Interest Disclosure Not Required at Approval Submission',
    officeCategory: 'front_office',
    failureRatePct: 79,
    description:
      `First Capital's credit approval process does not require relationship managers to certify the absence of personal conflicts of interest — personal financial relationships with the borrower, equity stakes in the borrowing entity, or referral fee arrangements — at the time of credit approval submission, leaving the credit committee to review credits without awareness of whether the originating relationship manager has undisclosed personal economic interests that could have influenced credit recommendation terms. OCC ethics and conflict of interest guidance and OCC examination standards for credit governance require that credit approval processes include a mechanism for identifying and managing conflict of interest situations involving the originating officer; the absence of a conflict of interest disclosure requirement at credit submission creates a credit governance control gap that allows undisclosed conflicts to influence credit decisions without the credit committee's knowledge, which examiners view as a fiduciary and governance deficiency in the credit approval process.`,
    keywords: ['conflict-of-interest', 'OCC-credit-governance', 'relationship-manager', 'disclosure-requirement', 'credit-approval'],
    demoRelevant: false,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1357',
    name: 'Exception to Policy Approval Signed by Same Officer Who Underwrote the Credit',
    officeCategory: 'front_office',
    failureRatePct: 85,
    description:
      `First Capital's credit policy permits credit officers who originate a credit to also approve the policy exception memo for the same credit transaction when no higher-level approval authority is required under the delegation matrix — creating a self-approval structure where the officer who identified and recommended the credit also approves the exception to policy, eliminating the independent challenge function that exception approval is intended to provide. OCC credit governance examination standards and OCC guidance on credit policy exception management require that policy exception approvals be made by an officer independent from the originating relationship manager or credit officer; self-approved policy exceptions provide no governance value because the approving officer has the same economic incentives and analytical perspective as the originating officer, and OCC examiners treat self-approved exceptions as a structural credit governance deficiency requiring separation of the origination and exception approval functions.`,
    keywords: ['self-approved-exception', 'OCC-credit-governance', 'exception-approval', 'independence', 'credit-governance'],
    demoRelevant: true,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1358',
    name: 'Loan Approval Conditions Not Cleared Before First Disbursement',
    officeCategory: 'front_office',
    failureRatePct: 81,
    description:
      `First Capital's credit committee routinely attaches closing conditions to credit approvals — perfected lien verification, hazard insurance confirmation, organizational document review, and environmental clearance — but the loan administration system does not prevent disbursement authorization until all conditions of approval are documented as cleared, allowing loan officers to process first disbursements on loans with uncleared approval conditions by marking conditions as "pending" in the system and proceeding with funding. OCC credit administration and loan disbursement guidance require that conditions of credit approval be satisfied and documented before funds are advanced; disbursing loan proceeds before approval conditions are cleared defeats the purpose of conditional approval as a credit risk governance mechanism and creates a pattern where the bank advances funds into unsecured or incomplete transactions that the credit committee intended to hold pending completion of specific risk-mitigating conditions.`,
    keywords: ['loan-approval-conditions', 'OCC-credit-administration', 'disbursement-control', 'closing-conditions', 'conditional-approval'],
    demoRelevant: true,
    subTopic: 'credit-approval-governance',
  },
  {
    code: 'B1359',
    name: 'Credit Policy Annual Review Not Completed — Policy Contains Superseded Regulatory References',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's commercial credit policy has not undergone its required annual review in 26 months, and the policy contains regulatory references to guidelines and bulletins that have since been superseded — citing OCC Bulletin 2006-39 on CRE concentrations that was superseded by the 2020 CRE guidance, SR 11-7's 2011 version without incorporating subsequent 2021-18 updates, and Regulation B adverse action notice standards that predate 2023 CFPB AI adverse action guidance — creating a policy document that may guide credit decisions toward outdated regulatory standards. OCC credit policy governance standards require that credit policies be reviewed and updated annually to incorporate changes in regulatory standards, market conditions, and the bank's own risk appetite; a credit policy that references superseded regulatory guidance may cause credit personnel to apply outdated standards on regulatory matters where updated guidance imposes materially different requirements, creating systematic compliance gaps in credits originated under the stale policy framework.`,
    keywords: ['credit-policy-annual-review', 'OCC-credit-governance', 'superseded-regulatory-references', 'policy-currency', 'compliance-gap'],
    demoRelevant: false,
    subTopic: 'credit-approval-governance',
  },

];
