// seed-banking-dom15-commercial-banking-part1.ts
// Banking genome patterns — Commercial Banking & Treasury Management
// Code range: B4300–B4359  (60 patterns)
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

export const BANKING_COMMERCIAL_BANKING_PART1_PATTERNS: PatternSeed[] = [

  // ── Treasury Operations ────────────────────────────────────────────────────
  {
    code: 'B4300',
    name: 'Intraday Liquidity Monitoring Gap Violates BCBS 248 Reporting Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's treasury operations team reports end-of-day liquidity positions to the board and to OCC examiners but does not capture intraday liquidity peaks and troughs that occur between opening and closing settlement cycles. BCBS 248 intraday liquidity monitoring standards require banks to measure and monitor intraday liquidity usage, including peak intraday liquidity demand, by currency and by settlement system — an end-of-day snapshot misses the intraday exposure window during which the bank's Fedwire and CHIPS settlement obligations generate maximum credit and liquidity risk. When OCC examiners review the treasury risk management framework, the absence of intraday monitoring infrastructure creates a supervisory finding that compounds the bank's existing consent order obligations around liquidity risk governance.`,
    keywords: ['BCBS 248', 'intraday liquidity', 'Fedwire', 'OCC examination', 'treasury operations'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4301',
    name: 'LCR Reporting Accuracy Gap — HQLA Classification Inconsistent With OCC Guidance',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's liquidity coverage ratio calculation classifies a portion of its agency mortgage-backed securities as Level 2A high-quality liquid assets using a haircut assumption that does not reflect the OCC's and Federal Reserve's supervisory expectations for the applicable stress window under the LCR final rule. The misclassification overstates the LCR numerator by approximately 8–12%, causing the reported LCR to appear well above the 100% regulatory minimum when the corrected calculation using OCC-conforming HQLA classifications would place the ratio within 5 percentage points of the minimum. Examiners reviewing the bank's liquidity risk framework under the consent order find the HQLA classification methodology is not documented in a policy approved by senior treasury leadership, constituting an LCR reporting accuracy deficiency.`,
    keywords: ['LCR', 'HQLA', 'OCC guidance', 'liquidity risk', 'BCBS 248'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4302',
    name: 'NSFR Calculation Excludes Off-Balance-Sheet Commitments — Required Stable Funding Understated',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's net stable funding ratio calculation applies required stable funding factors only to on-balance-sheet assets and does not include the RSF contribution from undrawn commercial credit commitments and letters of credit, which under BCBS 248 and the US NSFR final rule carry an RSF factor of 5–10% depending on counterparty type. The omission of off-balance-sheet RSF contributions causes the NSFR to be overstated by 4–7 percentage points for a bank with $3.2B in undrawn commercial commitments, a meaningful calculation error that the MRM team identifies only during a pre-examination self-assessment when the treasury analytics model is compared line-by-line against the Basel framework documentation.`,
    keywords: ['NSFR', 'BCBS 248', 'OCC guidance', 'required stable funding', 'commercial commitments'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4303',
    name: 'Collateral Management Optimization Not Integrated With Intraday Funding Needs',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's collateral management function optimizes the allocation of pledged securities across Fed discount window, FHLB advances, and bilateral repo agreements on an end-of-day basis, without a real-time view of intraday collateral usage tied to Fedwire settlement flows. BCBS 248 and OCC liquidity risk management guidance expect that collateral optimization systems have intraday awareness of pledging requirements to avoid intraday overcollateralization or undercollateralization events; the disconnect between the end-of-day optimization engine and real-time settlement flow means that the bank sometimes pledges securities needed for Fedwire same-day settlement to FHLB as overnight collateral, forcing the treasury desk to secure last-minute intraday credit at a cost premium.`,
    keywords: ['collateral management', 'BCBS 248', 'Fedwire', 'FHLB', 'intraday liquidity'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4304',
    name: 'Repo Governance Framework Does Not Cover Reverse Repo Counterparty Concentration',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital's repo governance policy establishes haircuts, eligible collateral, and maximum term parameters for repurchase agreements used to fund the securities portfolio, but does not address reverse repurchase agreement counterparty concentration — the bank's reverse repo book is concentrated in three money market fund counterparties that collectively represent 80% of the bank's short-term cash deployment. OCC guidance on short-term wholesale funding and BCBS 248 liquidity stress scenario requirements anticipate that banks identify and manage concentration in both repo and reverse repo counterparties; when one of the three money market fund counterparties reduces its reverse repo participation during a market stress event, the bank faces a sudden $400M cash reinvestment gap with no documented contingency playbook.`,
    keywords: ['repo governance', 'BCBS 248', 'OCC guidance', 'counterparty concentration', 'wholesale funding'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4305',
    name: 'Contingent Liquidity Stress Scenario Does Not Include Commercial Deposit Runoff',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's contingent liquidity stress scenario models retail deposit runoff at rates drawn from BCBS 248 and LCR final rule parameters but applies only a 5% runoff rate to operational commercial deposits and a 10% rate to non-operational commercial deposits, without a separate severe stress layer reflecting the rapid outflows observed at regional banks during the March 2023 stress episode. OCC liquidity risk management guidance updated following the 2023 regional bank failures expects that banks with material commercial deposit bases stress their commercial deposit assumptions under a severe idiosyncratic scenario that reflects digital transfer speed and concentration in large depositor relationships; a stress scenario calibrated to pre-2023 parameters systematically underestimates the speed and magnitude of potential commercial deposit outflows.`,
    keywords: ['BCBS 248', 'LCR', 'commercial deposit runoff', 'OCC guidance', 'liquidity stress'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4306',
    name: 'Interest Rate Risk Model Does Not Reflect Non-Maturity Deposit Behavioral Assumptions Update',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's interest rate risk model uses non-maturity deposit behavioral assumptions — effective maturity, decay rates, and pricing sensitivity coefficients — calibrated during the 2015–2019 low-rate environment that do not reflect the materially faster deposit repricing and shorter effective maturities observed during the 2022–2024 rate cycle. OCC and Federal Reserve interest rate risk supervisory guidance require that NMD behavioral assumptions be validated against actual observed customer behavior; the outdated assumptions cause the model's net interest income sensitivity output to underestimate the impact of rate changes on deposit cost, overstating projected NII in a rising-rate scenario and causing the bank to hold less interest rate hedge than its true exposure warrants.`,
    keywords: ['interest rate risk', 'non-maturity deposits', 'SR 11-7', 'OCC guidance', 'BCBS 248'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4307',
    name: 'AI Treasury Optimization Deployed Without BCBS 248 Intraday Compliance Validation',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's treasury team deploys an AI-powered liquidity optimization tool that allocates excess intraday liquidity across overnight Fed funds sold, reverse repos, and FHLB advances to maximize net interest income; the tool operates autonomously throughout the business day without a compliance check confirming that each allocation decision maintains the bank's BCBS 248 intraday liquidity monitoring thresholds and LCR buffers. SR 11-7 model governance requirements and OCC liquidity risk guidance expect that AI models influencing treasury balance sheet decisions be validated for regulatory compliance as well as financial performance; when the optimization AI deploys excess liquidity into a term reverse repo just before a large commercial client draws on a committed credit line, the bank temporarily falls below its internal intraday liquidity buffer threshold — an event that BCBS 248 monitoring requires be reported to the board.`,
    keywords: ['AI treasury optimization', 'BCBS 248', 'SR 11-7', 'intraday liquidity', 'LCR'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },

  // ── Cash Management ────────────────────────────────────────────────────────
  {
    code: 'B4308',
    name: 'Commercial Cash Concentration Architecture Lacks Notional Pooling Legal Documentation',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital offers commercial clients a notional pooling cash concentration structure that allows subsidiaries' balances to be offset for interest calculation without physical movement of funds; the bank has not maintained current legal opinions confirming the enforceability of the cross-entity offset arrangements under the governing laws of all jurisdictions where participating entities are domiciled. OCC guidance on cash management services and the Federal Reserve's expectations for commercial banking services require that notional pooling structures be supported by current, jurisdiction-specific legal opinions addressing set-off enforceability; when a multinational corporate client's Dutch subsidiary enters insolvency proceedings, the absence of a current Netherlands-law legal opinion prevents the bank from exercising the notional pool offset, exposing the bank to the full gross credit exposure rather than the net notional position.`,
    keywords: ['cash concentration', 'notional pooling', 'OCC guidance', 'commercial banking', 'Reg D'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },
  {
    code: 'B4309',
    name: 'Zero-Balance Account Sweep Compliance Gap — ZBA Structure Not Tested Under Reg D',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      `First Capital's commercial cash management platform offers zero-balance account sweep services to corporate clients, automatically transferring balances from subsidiary ZBAs to a master concentration account at end of day; the sweep architecture was designed before the Federal Reserve's April 2020 Reg D amendments eliminating the 6-transfer limit on savings accounts, and the bank has not reviewed whether the post-amendment Reg D treatment of the sweep transactions is properly reflected in the account disclosures and TM documentation provided to commercial clients. An OCC compliance examination of the commercial banking division finds that 23 corporate clients' ZBA sweep disclosures reference the pre-2020 Reg D framework, creating a technical disclosure inaccuracy that must be remediated with updated documentation and client notices before the next examination cycle.`,
    keywords: ['ZBA sweep', 'Reg D', 'NACHA', 'OCC compliance', 'cash management'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },
  {
    code: 'B4310',
    name: 'Controlled Disbursement Reconciliation Breaks During High-Volume ACH Settlement Days',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's controlled disbursement service provides corporate clients with a morning notification of checks and ACH debits clearing that day, enabling clients to fund their disbursement accounts precisely; on high-volume days — month-end and quarter-end — the bank's ACH presentment data feed from the Federal Reserve ACH network is delivered 45–90 minutes later than the contracted notification window, causing clients to overfund disbursement accounts and creating short-term interest cost that the bank's treasury clients document in service review escalations. NACHA operating rules and OCC service delivery standards for commercial banking services require that controlled disbursement notifications be timely and accurate; the systematic late delivery on peak-volume days has prompted two corporate clients to issue RFPs to competing banks, representing relationship revenue at risk.`,
    keywords: ['controlled disbursement', 'NACHA', 'ACH', 'OCC guidance', 'cash management'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },
  {
    code: 'B4311',
    name: 'Positive Pay Exception Management SLA Breach — Fraud Losses Attributed to Bank Delay',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's positive pay service requires corporate clients to review check exceptions — checks that do not match the issued check file — and make a pay-or-return decision by 2 pm Eastern to meet the Fed's return item deadline; when the bank's online banking platform experiences performance degradation during peak morning hours, clients cannot access the exception decisioning interface within the required window, and the bank defaults to a pay-all rule rather than returning unmatched items. OCC guidance on commercial banking services and the UCC Article 4 framework governing bank check processing require that banks not expose commercial clients to fraud losses arising from bank-caused processing delays; in three documented cases, the bank's platform latency caused fraudulent altered checks to pay through, and corporate clients successfully asserted that the bank's SLA breach created a UCC 4-406 liability exposure for the fraudulent items.`,
    keywords: ['positive pay', 'OCC guidance', 'UCC Article 4', 'NACHA', 'commercial banking fraud'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },
  {
    code: 'B4312',
    name: 'AI-Driven Cash Flow Forecasting Tool Not Validated Under SR 11-7 — Treasury Model Risk',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an AI cash flow forecasting tool for its commercial treasury management clients that uses ML on historical transaction data to predict daily funding needs and optimize sweep account balances; the tool is offered as a value-added analytics service and is not registered in the bank's SR 11-7 model inventory on the basis that it is a client-facing service rather than a bank risk management model. OCC 2011-12 and SR 11-7 define models broadly to include quantitative tools offered to bank clients where the output influences the client's financial decisions and where the bank retains reputational or credit exposure to model error; an AI forecasting tool that systematically underestimates a corporate client's funding needs can create overdraft events that generate Reg E complaints, NSF fees, and relationship escalations that constitute indirect model risk exposure for the bank.`,
    keywords: ['AI cash forecasting', 'SR 11-7', 'OCC 2011-12', 'treasury management', 'model risk'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },
  {
    code: 'B4313',
    name: 'Commercial ACH Origination Exposure Limit Not Calibrated to Current Client Volume',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's commercial ACH origination program establishes exposure limits for corporate clients originating ACH transactions in the form of daily and monthly dollar caps; these limits were set at onboarding and have not been reviewed for clients whose ACH volume has grown significantly since the limit was established. NACHA operating rules and OCC guidance on ACH origination risk management require that banks review ACH origination exposure limits periodically and adjust them based on current volume, client creditworthiness, and return rate history; a corporate client whose monthly ACH origination has grown from $2M to $12M over three years while operating on a $3M exposure limit routinely exceeds the limit and is manually approved by a treasury operations officer without a documented risk assessment, creating a systematic NACHA compliance gap.`,
    keywords: ['ACH origination', 'NACHA', 'OCC guidance', 'commercial banking', 'exposure limit'],
    demoRelevant: false,
    subTopic: 'cash-management',
  },

  // ── Trade Finance ──────────────────────────────────────────────────────────
  {
    code: 'B4314',
    name: 'Standby LC vs Performance Bond Documentation Ambiguity Creates Drawdown Dispute',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital issues standby letters of credit for commercial clients that, in certain transactions, are structured with performance-based drawdown conditions that resemble performance bond rather than pure documentary LC obligations; when a beneficiary presents documents for payment on a standby LC that includes performance contingency language, the bank's trade finance team incorrectly applies the UCP 600 documentary compliance standard rather than the ISP98 rules applicable to standby instruments, leading to a wrongful dishonor determination. OCC guidance on commercial lending documentation and ICC's UCC Article 5 and ISP98 frameworks create clear but separate rules for documentary LCs versus standby LCs versus performance bonds; the failure to correctly classify the instrument at issuance, and to train documentary examiners on the applicable rule set, results in a wrongful dishonor that exposes the bank to liability under UCC 5-108.`,
    keywords: ['standby LC', 'UCP 600', 'ISP98', 'OCC guidance', 'trade finance'],
    demoRelevant: true,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4315',
    name: 'Trade-Based Money Laundering Detection Gap in LC Document Examination',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's trade finance documentary examination team reviews letters of credit for technical documentary compliance under UCP 600 but does not apply a systematic TBML screening overlay that flags discrepancies indicative of trade-based money laundering — over-invoicing, under-invoicing, phantom shipment descriptions, and multiple collateralized financing of the same shipment. FinCEN's 2010 advisory on TBML and OCC guidance on commercial banking BSA/AML risk require that banks with active trade finance portfolios implement TBML controls integrated into the documentary examination workflow; First Capital's BSA program addresses wire transfer and ACH transaction monitoring but has no structured TBML detection protocol, creating a regulatory gap that FinCEN's 2024 national AML priorities identify as a systemic weakness in mid-size bank trade finance operations.`,
    keywords: ['TBML', 'BSA/AML', 'UCP 600', 'FinCEN', 'trade finance'],
    demoRelevant: true,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4316',
    name: 'UCP 600 Discrepancy Rate Rising — Examination Team Lacks Current Trade Finance Training',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital's documentary credit examination team has experienced significant turnover over the past three years, and the replacement examiners have not completed the ICC's CDCS (Certified Documentary Credit Specialist) training program or equivalent structured trade finance education; the bank's LC discrepancy rate has risen from 12% to 28% of presentations, causing corporate clients to experience delayed payments and increasing the bank's exposure to wrongful dishonor claims under UCP 600 Article 34 and UCC 5-108. OCC guidance on commercial banking risk management expects that banks offering trade finance services maintain personnel with current, demonstrable competency in international trade documentation standards; the training gap creates both operational risk in the documentary examination function and reputational risk with the bank's corporate client base.`,
    keywords: ['UCP 600', 'documentary credit', 'OCC guidance', 'trade finance', 'CDCS'],
    demoRelevant: true,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4317',
    name: 'Supply Chain Finance Program Not Reviewed for CFPB Small Business Lending Rule Applicability',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      `First Capital operates a supply chain finance program — reverse factoring — that allows approved suppliers of the bank's large corporate clients to receive early payment on receivables at a discount; the bank treats the program as a commercial banking product governed by its wholesale treasury management policies and has not assessed whether individual supplier advances constitute credit covered by the CFPB's final 1071 small business lending data collection rule when the supplier meets the small business size definition. The CFPB's Section 1071 final rule, effective for large filers beginning January 2026, requires data collection for covered credit extended to small businesses regardless of the product structure; a supply chain finance program that extends credit to qualifying small business suppliers without a 1071 compliance assessment creates a supervisory exposure that compounds the bank's existing regulatory portfolio.`,
    keywords: ['supply chain finance', 'CFPB 1071', 'OCC guidance', 'small business lending', 'Reg B'],
    demoRelevant: true,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4318',
    name: 'AI Trade Finance Document Verification Without UCP 600 Legal Review',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital pilots an AI document verification tool that uses computer vision and NLP to examine trade finance documents — bills of lading, commercial invoices, certificates of origin — for UCP 600 documentary compliance and flags discrepancies for examiner review; the AI system is deployed to reduce examination time but is not validated against a representative sample of disputed presentations, and its compliance logic has not been reviewed by the bank's trade finance legal counsel to confirm alignment with UCP 600 and ISP98 interpretive standards. SR 11-7 model governance requirements and OCC guidance on commercial banking operational risk expect that AI systems used in credit-relevant compliance determinations be validated for accuracy and legal alignment; when the AI tool incorrectly clears a presentation that contains a material transport document discrepancy, the bank honors the LC and later faces a demand from the applicant for reimbursement of the wrongfully paid amount, creating a $2.4M dispute that is attributable to the unvalidated AI system.`,
    keywords: ['AI document verification', 'UCP 600', 'SR 11-7', 'OCC guidance', 'trade finance'],
    demoRelevant: true,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4319',
    name: 'Import LC Sanctions Screening Does Not Cover Transshipment Port Jurisdictions',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital screens letter of credit applications against OFAC SDN and consolidated sanctions lists at the point of issuance, checking the beneficiary country, applicant, and stated port of loading; the bank's screening logic does not check intermediate transshipment ports listed in the shipping terms against the current OFAC country sanctions list, creating a gap where LC transactions routed through sanctioned transshipment hubs are not flagged. OFAC's 50% Rule and OCC BSA/AML examination guidance require that banks' sanctions screening programs cover the full transaction footprint, including routing and transshipment jurisdictions; an import LC with shipping terms specifying a transshipment through a port in a sanctioned jurisdiction — a pattern documented in OFAC advisories on Iran sanctions evasion — clears First Capital's screening system without generating an alert.`,
    keywords: ['OFAC', 'sanctions screening', 'BSA/AML', 'OCC guidance', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },

  // ── Commercial Deposits ────────────────────────────────────────────────────
  {
    code: 'B4320',
    name: 'Earnings Credit Rate Pricing Not Transparent — UDAP Exposure in Treasury Billing',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital sets earnings credit rates for commercial deposit analysis accounts at relationship-manager discretion, with ECR spread decisions made informally without a documented pricing matrix, floor rate, or supervisory approval process; corporate treasury clients receive account analysis statements showing service charge credits and debits without a clear disclosure of the ECR methodology or how the rate compares to market benchmarks such as the Fed funds effective rate. CFPB and OCC UDAP guidance requires that fee structures and service charge calculations be transparent, accurate, and not misleading; a commercial deposit analysis program where the ECR is set opaquely and can be reduced at relationship manager discretion without client notification creates a UDAP exposure that a CFPB supervision team identifies when reviewing First Capital's commercial banking practices.`,
    keywords: ['ECR pricing', 'UDAP', 'OCC guidance', 'commercial deposits', 'account analysis'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4321',
    name: 'Commercial Deposit Analysis Statement Errors Due to Legacy Service Code Mapping',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's commercial deposit analysis platform generates monthly account analysis statements by mapping transaction volumes to service charge codes in a legacy fee schedule; after a treasury management platform upgrade in 2023, 14 service codes were remapped to new descriptions without updating the billing module's code-to-fee crosswalk, causing certain wire transfer and ACH origination fees to be charged under incorrect codes that produce inaccurate billing totals. OCC commercial banking examination guidance and NACHA rules require that account analysis billing be accurate and auditable; when a corporate treasury client's internal audit compares the bank's account analysis statements against detailed transaction logs, the fee miscoding generates a $47K overcharge claim and a formal bank error complaint that triggers an OCC consumer compliance review of the commercial billing system.`,
    keywords: ['account analysis', 'NACHA', 'OCC guidance', 'commercial deposits', 'treasury management'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4322',
    name: 'Commercial Sweep Account Documentation Does Not Disclose FDIC Insurance Limitations',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      `First Capital offers commercial clients overnight sweep products that invest excess balances in government money market funds or short-term Treasuries; the sweep product documentation does not clearly disclose that funds swept out of the FDIC-insured deposit account and into money market fund shares are no longer covered by FDIC deposit insurance, and the account agreement language describing the sweep mechanics is written in technical terms that are not accessible to a corporate treasurer without a securities background. OCC and FDIC consumer protection guidance applicable to commercial banking relationships require that sweep account disclosures clearly communicate the change in insurance status when customer funds move from a deposit to a non-deposit investment product; a corporate client that loses sweep fund balances during a money market fund NAV disruption event successfully argues that the bank's disclosure failure constitutes a breach of the account agreement.`,
    keywords: ['sweep account', 'FDIC insurance', 'OCC guidance', 'commercial deposits', 'disclosure'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4323',
    name: 'Large Commercial Depositor Concentration Not Flagged in Liquidity Risk Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's top 10 commercial deposit relationships represent 38% of total commercial deposit balances, with the largest single relationship — a state government tax authority — representing $1.1B or 7.2% of total deposits; this concentration is not identified as a liquidity risk concentration in the bank's BCBS 248 monitoring framework or in the board liquidity risk report, which aggregates commercial deposits as a single line item without decomposing large depositor concentration. OCC liquidity risk management guidance updated following the 2023 regional bank stress events requires that banks identify and monitor large depositor concentrations by individual relationship, industry, and geography, with stress runoff assumptions calibrated to single-entity departure scenarios; the absence of depositor concentration monitoring means the board has no visibility into the liquidity cliff that would result from the state authority withdrawing its balances.`,
    keywords: ['depositor concentration', 'BCBS 248', 'OCC guidance', 'liquidity risk', 'commercial deposits'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4324',
    name: 'AI Deposit Pricing Model Deployed Without UDAP Review — Discriminatory ECR Outcome',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI deposit pricing model that recommends earnings credit rates for new and renewing commercial deposit relationships based on relationship profitability, balance tier, and service utilization patterns; the model recommends systematically lower ECRs for relationships with certain industry sector codes — including minority-owned business enterprise (MBE) classifications — that the model associates with lower service fee revenue, without a UDAP fairness review of whether the sector-based ECR differential produces disparate pricing outcomes for protected-class business owners. OCC UDAP guidance and the CFPB's supervisory approach to commercial banking fairness require that AI-driven pricing tools be tested for discriminatory outcomes before deployment; the unreviewed sector-based ECR differential creates a pricing disparity that CFPB examiners identify when they analyze ECR rates by SIC code and MBE status.`,
    keywords: ['AI deposit pricing', 'UDAP', 'OCC guidance', 'SR 11-7', 'ECR pricing'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },

  // ── Relationship Banking ───────────────────────────────────────────────────
  {
    code: 'B4325',
    name: 'RM Incentive Structure Creates CRA Coverage Gaps in Low-Income Commercial Territory',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial relationship manager compensation is structured around revenue generation targets weighted heavily toward large deal origination fees and treasury management balances, without any weighting for CRA-eligible small business lending activity or community development loan originations in low-to-moderate income census tracts. OCC CRA examination guidance and the revised CRA final rule require that banks demonstrate that their CRA performance reflects a good-faith effort across the full assessment area, including LMI geographies; a compensation structure that financially penalizes RMs for spending time on smaller CRA-eligible credits creates a systematic CRA coverage gap that OCC examiners identify when comparing First Capital's CRA lending map against its RM territory assignments, resulting in a CRA performance rating downgrade from Outstanding to Satisfactory.`,
    keywords: ['CRA', 'OCC guidance', 'relationship banking', 'small business lending', 'LMI'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4326',
    name: 'Cross-Sell Compliance Gap — Treasury Products Recommended Without Needs-Based Documentation',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial banking relationship managers recommend treasury management products — lockbox, ACH, wire, and sweep services — to commercial clients based on product campaign targets rather than documented client needs assessments; the bank's commercial onboarding process does not require a treasury needs analysis before recommending products, and the relationship pricing system applies standard fees without reference to a documented client financial profile. CFPB and OCC UDAP guidance requires that product recommendations to business clients be grounded in a documented suitability assessment that supports the recommendation; when a CFPB examination reviews First Capital's commercial cross-sell practices, the absence of needs-based documentation for treasury product recommendations — combined with evidence that clients were enrolled in services they did not use — generates an unfair practices finding under UDAP Section 5.`,
    keywords: ['cross-sell compliance', 'UDAP', 'OCC guidance', 'treasury management', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4327',
    name: 'Small Business Lending Disparate Impact Not Tested Under HMDA and CRA Combined Analysis',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital conducts separate fair lending analyses for HMDA-reportable home equity and small business mortgage products and for CRA-reportable small business loans, but does not conduct a combined analysis that tests whether approval rates, pricing, and geographic coverage are consistent across the full small business lending portfolio when both HMDA and CRA data are analyzed together. OCC fair lending examination guidance and the revised CRA final rule create an expectation that banks assess their small business lending performance on an integrated basis, including geographic distribution, borrower income characteristics, and approval rate disparities by race and national origin where proxies are available; a siloed analytical approach that treats HMDA and CRA small business lending as separate compliance programs misses cross-portfolio disparate impact patterns that emerge only in the integrated analysis.`,
    keywords: ['HMDA', 'CRA', 'disparate impact', 'OCC guidance', 'small business lending'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4328',
    name: 'Commercial Client Onboarding KYB Refresh Not Linked to Beneficial Ownership Update',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's commercial know-your-business onboarding process collects beneficial ownership information at account opening under FinCEN's CDD final rule but does not trigger an automatic beneficial ownership refresh when the bank's account monitoring systems detect corporate events — change of control notices, new officer filings in public registries, or restructuring transactions — that may indicate a change in the entity's ownership structure. FinCEN's beneficial ownership rule under 31 CFR 1010.230 and OCC BSA/AML examination guidance require banks to have processes to identify and verify material changes in beneficial ownership on an ongoing basis; the absence of a corporate event trigger linked to the beneficial ownership refresh process means that ownership changes in high-risk commercial clients can persist in the bank's CDD file undetected for multiple annual review cycles.`,
    keywords: ['KYB', 'beneficial ownership', 'FinCEN CDD rule', 'BSA/AML', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4329',
    name: 'AI-Powered RM Relationship Scoring Without Fair Lending Governance Framework',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an AI relationship scoring tool that ranks commercial banking clients by revenue potential, cross-sell propensity, and attrition risk, and routes clients to senior relationship managers or junior bankers based on the AI score; the scoring model uses input variables that correlate with client geography and industry sector in ways that disproportionately assign minority-owned businesses and businesses in LMI geographies to less experienced relationship managers with smaller service capacity. OCC UDAP and fair lending supervisory guidance and the CFPB's AI fairness framework require that AI tools used in client segmentation and service assignment be tested for discriminatory outcomes; the unreviewed RM assignment algorithm creates a disparate service provision pattern that OCC CRA examiners identify when they map AI-assigned relationship tiers against census tract demographics.`,
    keywords: ['AI relationship scoring', 'UDAP', 'CRA', 'SR 11-7', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4330',
    name: 'GenAI RFP Response Submitted Without Relationship Manager Sign-Off or Compliance Review',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial banking team deploys a GenAI RFP response tool that generates draft treasury management and commercial banking proposal responses by combining product descriptions, pricing schedules, and service commitment language from a training corpus of prior winning proposals; relationship managers submit AI-generated RFP responses to corporate prospects without reviewing the pricing commitments, service-level representations, and fee waiver terms generated by the AI against current product policy. OCC commercial banking risk management guidance and the bank's own sales practice policy require that pricing commitments and service representations in RFP responses be reviewed and approved by the appropriate credit and treasury management officer before submission; when an AI-generated RFP response includes a pricing commitment that is 35 basis points below the bank's current floor ECR pricing, the resulting client onboarding generates a treasury relationship that is immediately loss-making, and the pricing error cannot be unilaterally corrected without breaching the contractual commitment in the executed treasury management agreement.`,
    keywords: ['GenAI RFP', 'SR 11-7', 'UDAP', 'OCC guidance', 'treasury management'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },

  // ── AI Commercial Patterns ─────────────────────────────────────────────────
  {
    code: 'B4331',
    name: 'LLM Commercial Credit Memo Without Human Underwriter Review — SR 11-7 Gap',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital's commercial banking relationship managers use an LLM credit memo drafting tool to generate credit approval memos for commercial lines of credit and term loans in the $1M–$10M range; the LLM tool produces a formatted credit memo including financial analysis, risk identification, and a recommended credit structure, and relationship managers submit these memos to the credit committee with minimal independent verification of the AI-generated financial analysis sections. SR 11-7 and OCC 2011-12 model governance requirements define any tool generating quantitative outputs used in credit decisions as a model subject to independent validation; when the credit committee treats LLM-generated financial projections as analyst-reviewed without an explicit human underwriter attestation, the bank creates a systematic documentation quality gap that OCC examiners flag as an MRM consent order compliance breach in the commercial underwriting workflow.`,
    keywords: ['LLM credit memo', 'SR 11-7', 'OCC 2011-12', 'commercial underwriting', 'human-in-loop'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4332',
    name: 'AI Commercial Deposit Pricing Engine Lacks UDAP Fairness Review Before Production',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's commercial banking technology team deploys an ML-driven deposit pricing engine that calculates individualized ECR quotes for commercial deposit relationships based on relationship profitability scoring, balance tier, tenure, and service bundle composition; the pricing engine is promoted from development to production based on financial performance metrics — improving treasury net interest margin — without a parallel UDAP fairness review testing whether the AI's pricing recommendations produce systematically lower ECRs for protected-class business owners or businesses in LMI communities. OCC UDAP supervisory guidance and the CFPB's published AI pricing fairness expectations require that pricing algorithms be reviewed for discriminatory outcomes before production deployment; when an independent fair lending analysis conducted after deployment reveals that the AI engine prices $14M in annual ECR credits below the bank's manual pricing baseline for MBE-classified clients, the bank must retroactively remediate the pricing disparity and notify affected clients.`,
    keywords: ['AI deposit pricing', 'UDAP', 'SR 11-7', 'OCC guidance', 'ECR pricing'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4333',
    name: 'AI Treasury Analytics Platform Vendor Not Assessed Under SR 11-7 Third-Party Model Risk',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital licenses an AI treasury analytics platform from a fintech vendor that provides real-time cash flow forecasting, liquidity gap analysis, and interest rate risk dashboards to the bank's commercial clients; the platform is classified as a client-facing technology service and is not assessed under the bank's SR 11-7 third-party model risk management framework, despite the fact that treasury client decisions — including funding elections and hedge placement — are influenced by the platform's AI-generated forecasts. OCC Bulletin 2023-17 on third-party relationships and SR 11-7 extension guidance on vendor AI models require that bank-sponsored AI models used by clients in financial decisions be included in the bank's model risk governance; the unassessed vendor AI platform represents an unmanaged model risk exposure that the consent order's model inventory remediation milestone requires be addressed.`,
    keywords: ['AI treasury analytics', 'SR 11-7', 'OCC Bulletin 2023-17', 'TPRM', 'treasury management'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4334',
    name: 'GenAI Commercial Banking Chatbot Provides Credit Guidance Without Compliance Review',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital deploys a GenAI chatbot on its commercial banking portal that responds to commercial client inquiries about loan availability, credit terms, and treasury service pricing; the chatbot generates responses drawing on product documentation and rate sheets, but its outputs are not reviewed by the bank's compliance team before deployment, and the response generation logic is not constrained to prevent the chatbot from offering specific credit or pricing commitments that exceed the bank's current policy parameters. OCC guidance on commercial banking communication practices and CFPB supervisory expectations for AI-assisted customer service require that AI tools used in commercial banking client interactions be reviewed by compliance before deployment and monitored for misleading statements or commitments that could create UDAP or contractual liability; when the chatbot offers a commercial client a credit line at a rate below the current risk-adjusted floor, the client relies on the AI output as a bank commitment.`,
    keywords: ['GenAI chatbot', 'UDAP', 'SR 11-7', 'OCC guidance', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4335',
    name: 'AI-Assisted Covenant Extraction From Credit Agreements Not Validated for Legal Accuracy',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI NLP tool to extract financial covenant definitions from executed credit agreement PDFs and populate them into the covenant monitoring system, automating a process previously performed by trained credit analysts; the AI extraction tool has not been validated on a held-out sample of diverse credit agreement structures, including those with complex EBITDA addback definitions, restricted payments baskets, and step-down covenant schedules. SR 11-7 model validation requirements and OCC commercial banking documentation standards require that AI tools used to populate credit monitoring systems be validated for accuracy across the full range of agreement structures encountered in the bank's portfolio; when the AI extraction tool misreads a $100M revolving credit facility's EBITDA definition — omitting a permitted addback that changes the covenant calculation by $8M — the bank generates a false covenant breach notice that triggers an unnecessary default discussion with the borrower.`,
    keywords: ['AI covenant extraction', 'SR 11-7', 'OCC 2011-12', 'NLP', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4336',
    name: 'AI Commercial Portfolio Risk Summary Lacks Human Analyst Attestation for Board Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's credit risk team deploys an AI tool that synthesizes commercial portfolio monitoring data — watchlist migration, DSCR deterioration trends, sector concentration changes, and EWI alert volumes — into a narrative risk summary that is incorporated directly into the board's quarterly credit risk report without a credit officer reviewing and attesting to the accuracy of the AI-generated narrative. SR 11-7 model governance requirements and OCC board reporting standards require that reports to the board on credit risk be prepared or reviewed by a responsible senior credit officer; an AI-generated board narrative that contains an error in the watchlist count — attributable to a data pull timing mismatch in the AI pipeline — goes undetected when the board receives the report, and the OCC examiner reviewing board minutes finds that the reported watchlist balance differs materially from the examination's independently verified figure.`,
    keywords: ['AI risk summary', 'SR 11-7', 'OCC examination', 'board reporting', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4337',
    name: 'LLM Commercial Loan Pricing Tool Recommends Below-Floor Rates Without Policy Guardrails',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an LLM-powered commercial loan pricing tool that recommends spread and rate structures for new commercial originations by analyzing comparable transactions in a training corpus of market precedents and the bank's own prior deals; the LLM pricing recommendations are presented to relationship managers as guidance but are not constrained by the bank's current floor pricing matrix, and the tool's rate outputs can fall below the bank's risk-adjusted minimum required return on capital for a given credit grade. OCC guidance on loan pricing governance and the bank's own credit risk policy require that all new commercial pricing be compared against the bank's RAROC floor before approval; when an RM presents an LLM-recommended rate to a borrower and the credit committee approves the loan at below-floor pricing without identifying the discrepancy, the resulting loan generates negative risk-adjusted returns that compound the bank's capital adequacy concerns under the consent order.`,
    keywords: ['LLM loan pricing', 'SR 11-7', 'RAROC', 'OCC guidance', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4338',
    name: 'AI Trade Finance TBML Detection Model Not Registered in SR 11-7 Model Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital deploys an AI TBML detection model that uses ML to flag trade finance transactions exhibiting over/under-invoicing patterns, unusual commodity-to-country combinations, and circular shipment structures; the model is developed by the bank's BSA/AML analytics team and deployed into the trade finance LC examination workflow without being registered in the SR 11-7 model inventory, as the BSA team classifies it as a compliance screening tool rather than a risk model. OCC 2011-12 and SR 11-7 define models to include quantitative tools used in regulatory compliance determinations — a TBML detection model that influences which LC transactions receive enhanced BSA scrutiny meets the SR 11-7 model definition, and its absence from the model inventory means it has no validated false negative rate, no ongoing performance monitoring, and no governance over algorithm changes that could silently reduce the bank's TBML detection effectiveness.`,
    keywords: ['AI TBML detection', 'SR 11-7', 'BSA/AML', 'FinCEN', 'trade finance'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4339',
    name: 'AI Cash Flow Forecasting Without SR 11-7 Validation Influences Commercial Loan Sizing',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's commercial banking origination team uses an AI cash flow forecasting tool to project borrower operating cash flows over the loan term as part of the underwriting analysis for asset-based lending and cash flow-based commercial loans; the AI projections are incorporated into the credit memo as supporting analysis without being disclosed as AI-generated or subjected to independent validation under the bank's SR 11-7 framework. OCC 2011-12 and SR 11-7 require that quantitative tools used to inform credit decisions be in the validated model inventory with documented conceptual soundness and outcome analysis; an AI cash flow projection that is systematically optimistic for borrowers in cyclical industries — because its training data is dominated by the 2021–2022 post-stimulus growth period — causes the bank to approve commercial loans at leverage levels that prove unsustainable when industry-specific cyclical compression materializes.`,
    keywords: ['AI cash flow forecasting', 'SR 11-7', 'OCC 2011-12', 'commercial underwriting', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4340',
    name: 'GenAI Client Onboarding Due Diligence Summary Without BSA/AML Officer Review',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital deploys a GenAI tool that generates CDD due diligence summaries for new commercial banking onboarding by synthesizing publicly available information about prospective clients — corporate registry data, news coverage, litigation history, and industry press — into a structured KYB narrative; BSA officers approve onboarding based on the AI-generated summary without independently reviewing the underlying source material or verifying that the AI accurately captured all adverse information. FinCEN's CDD final rule and OCC BSA/AML examination guidance require that beneficial ownership and customer due diligence determinations be made by a qualified BSA officer with access to verified source information; when the GenAI tool fails to surface a state attorney general enforcement action against a prospective client that appears in a state court database not covered by the AI's data sources, the bank onboards a high-risk commercial relationship without the enhanced due diligence required for the client's risk profile.`,
    keywords: ['GenAI KYB', 'BSA/AML', 'FinCEN CDD rule', 'OCC guidance', 'commercial onboarding'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4341',
    name: 'AI Commercial Banking Platform Vendor Contract Lacks Model Drift Telemetry and SR 11-7 Audit Rights',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital contracts with a commercial banking fintech platform that provides AI-driven cash management, treasury analytics, and relationship scoring capabilities as embedded features of the commercial banking portal; the vendor contract does not include provisions requiring the vendor to provide model drift telemetry, performance monitoring reports, or audit rights for the bank's model risk management team to assess the AI components against SR 11-7 requirements. OCC Bulletin 2023-17 on third-party relationships and SR 11-7 model governance guidance require that contracts for AI-enabled banking services include explicit terms governing model risk oversight, performance monitoring access, and the bank's right to audit the model's ongoing accuracy; the absence of SR 11-7-aligned contract provisions means the bank cannot discharge its model risk governance obligations for vendor AI that influences credit and treasury decisions.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'TPRM', 'AI contract governance', 'commercial banking platform'],
    demoRelevant: true,
    subTopic: 'ai-commercial',
  },
  {
    code: 'B4342',
    name: 'LLM Commercial Banking RFI Response Discloses Proprietary Pricing Methodology',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      `First Capital's commercial banking team uses an LLM tool to draft responses to corporate RFIs for treasury management services; the LLM generates detailed, accurate responses that include specific pricing methodology descriptions — ECR calculation formulas, fee waiver threshold logic, and relationship profitability model parameters — that the bank treats as proprietary and confidential information not intended for disclosure in competitive bid situations. The LLM tool, trained on a corpus that includes internal product documentation and prior approved RFI responses, reproduces proprietary pricing logic in its generated output without any constraint on what constitutes disclosable information; when an RFI response including detailed pricing methodology is submitted to a prospect that subsequently terminates the process and joins a competitor bank, the bank's treasury management pricing framework is exposed to competitive intelligence use, requiring an immediate repricing policy review.`,
    keywords: ['LLM RFI response', 'UDAP', 'OCC guidance', 'treasury management', 'commercial banking'],
    demoRelevant: false,
    subTopic: 'ai-commercial',
  },

  // ── Additional Treasury Operations ─────────────────────────────────────────
  {
    code: 'B4343',
    name: 'Liquidity Coverage Ratio Fails After Unannounced Corporate Deposit Withdrawal',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's LCR buffer is maintained at 115% under base conditions, providing a 15-percentage-point buffer above the regulatory minimum; when a single corporate depositor — a large technology company with $650M in operational and non-operational deposit balances — announces a cash repatriation program and withdraws $520M over five business days, the bank's LCR falls below 100% for three consecutive reporting periods. The bank's LCR stress scenario did not include a deposit outflow scenario calibrated to a single large non-operational depositor withdrawal, and the bank's contingency funding plan does not include a pre-positioned playbook for a sudden large-depositor departure; OCC examiners reviewing the LCR breach under BCBS 248 monitoring requirements find that the bank failed to activate its contingency funding plan within the required timeframe.`,
    keywords: ['LCR', 'BCBS 248', 'OCC guidance', 'contingency funding', 'large depositor'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4344',
    name: 'Stress Liquidity Survival Horizon Not Recalculated After Balance Sheet Composition Shift',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital calculates its stress liquidity survival horizon — the number of days the bank can meet its cash outflow obligations without accessing wholesale funding markets — on a quarterly basis using balance sheet composition data from the prior quarter-end; after a $900M growth in commercial loan commitments and a $600M shift from retail to commercial deposits over two quarters, the survival horizon has materially shortened from the 45-day estimate calculated at the prior annual review but has not been updated in the board-level liquidity risk report. BCBS 248 and OCC liquidity risk management guidance require that survival horizon calculations reflect current balance sheet composition and stress scenario assumptions; a board-level liquidity report that presents a survival horizon 12 days longer than the current calculation creates a governance gap between reported and actual liquidity risk.`,
    keywords: ['BCBS 248', 'survival horizon', 'OCC guidance', 'liquidity risk', 'board reporting'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4345',
    name: 'FX Hedging Program for Commercial Clients Not Reviewed for Reg E Applicability',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      `First Capital offers FX forward and option contracts to commercial banking clients for hedging import/export payment obligations; the bank's treasury derivatives program documentation classifies all FX contracts as exempt from Reg E consumer protection disclosures on the basis that they are commercial transactions. Following a CFPB interpretive release clarifying that FX forward contracts entered into by small business clients who are individuals — sole proprietors and small partnerships — may meet the Reg E definition of an electronic fund transfer in certain circumstances, the bank has not reviewed its FX client base to determine whether any clients classified as commercial are actually consumer-eligible, creating a potential Reg E disclosure gap for the affected client segment.`,
    keywords: ['Reg E', 'FX hedging', 'OCC guidance', 'CFPB', 'commercial banking'],
    demoRelevant: false,
    subTopic: 'treasury-operations',
  },
  {
    code: 'B4346',
    name: 'Transfer Pricing for Internal Funds Not Aligned With OCC Net Interest Income Attribution',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's funds transfer pricing system allocates funding cost to the commercial banking division based on a blended cost of funds that does not differentiate between the maturity and repricing characteristics of commercial loans being funded by short-term wholesale vs. long-term retail deposits; the blended FTP rate causes the commercial banking P&L to show higher profitability than the actual risk-adjusted margin when short-term wholesale funding costs rise, because the division's funding cost is subsidized by the lower blended rate. OCC examination guidance on management reporting and risk-adjusted performance measurement expects that FTP systems accurately reflect the bank's funding cost structure to support informed business decisions; an inaccurate FTP system that masks commercial lending margin compression prevents senior management from making timely pricing adjustments.`,
    keywords: ['transfer pricing', 'OCC guidance', 'net interest income', 'commercial banking', 'funds transfer pricing'],
    demoRelevant: true,
    subTopic: 'treasury-operations',
  },

  // ── Additional Cash Management ─────────────────────────────────────────────
  {
    code: 'B4347',
    name: 'Commercial Lockbox Processing SLA Breach During Volume Spikes — Remittance Data Lost',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's commercial lockbox processing service promises a same-day availability cutoff of 2 pm for items received before noon; during month-end volume spikes when check and remittance volumes triple normal levels, the bank's lockbox operation misses the same-day availability cutoff for 15–20% of items, and the remittance data capture — optical character recognition of check stub data — generates unreadable records that the corporate client must manually reconcile. NACHA rules and OCC commercial banking service standards require that contracted service level commitments be met consistently; when three lockbox clients document a pattern of SLA breaches that require them to maintain manual backup reconciliation processes, the bank faces service contract disputes and RFP competitive exposure from clients who are actively evaluating alternative banking providers for their remittance processing needs.`,
    keywords: ['lockbox processing', 'NACHA', 'OCC guidance', 'commercial banking', 'remittance'],
    demoRelevant: false,
    subTopic: 'cash-management',
  },
  {
    code: 'B4348',
    name: 'Same-Day ACH Commercial Origination Cutoff Not Communicated in Client Agreement',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      `First Capital supports NACHA same-day ACH origination for commercial clients with a 2:00 pm ET submission cutoff for the 4:30 pm Federal Reserve processing window; the bank's commercial treasury service agreement references the standard NACHA origination cutoff times for next-day ACH but does not clearly specify the same-day ACH submission deadline, causing corporate payroll and vendor payment administrators to miss the same-day window by submitting after 2:00 pm and experiencing delayed payroll funding that triggers employee complaints and state labor law inquiry. NACHA operating rules and OCC commercial banking disclosure standards require that service agreements clearly disclose all applicable cutoff times for same-day ACH origination; the disclosure ambiguity constitutes a material omission that the bank's commercial banking compliance team identifies during a NACHA operating rules self-assessment.`,
    keywords: ['same-day ACH', 'NACHA', 'OCC guidance', 'commercial banking', 'payroll'],
    demoRelevant: false,
    subTopic: 'cash-management',
  },
  {
    code: 'B4349',
    name: 'Wire Transfer Commercial Client Authentication Does Not Meet FFIEC Guidance for High-Value Wires',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial wire transfer initiation platform requires password authentication and a one-time SMS passcode for domestic wires up to $500K but does not require an additional out-of-band authentication step — a callback verification or token-based authentication — for high-value international wires above $500K submitted through the online commercial banking portal. FFIEC guidance on authentication in internet banking environments and OCC operational risk management expectations require that high-risk transactions such as large commercial wire transfers employ layered security controls proportionate to the fraud risk; when a business email compromise attack targets a commercial client's treasury administrator and the compromised credentials are used to initiate a $1.2M international wire, the bank's single-layer authentication fails to detect the fraudulent session and the wire is executed, generating a wire fraud loss that the corporate client claims was enabled by inadequate bank authentication controls.`,
    keywords: ['wire transfer security', 'FFIEC', 'OCC guidance', 'commercial banking fraud', 'authentication'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },

  // ── Additional Trade Finance ───────────────────────────────────────────────
  {
    code: 'B4350',
    name: 'Export LC Confirmation Exposure Not Capped by Country Risk Policy Limits',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's trade finance unit adds its confirmation to export letters of credit issued by foreign correspondent banks in emerging market jurisdictions; the confirmations are approved at the trade finance officer level without reference to the bank's country risk limit framework, which is maintained separately by the credit risk management team and applies country-specific exposure caps to cross-border credit exposure. OCC guidance on country risk management and concentration risk principles require that confirmed LC exposure to correspondent banks in a given country be included in the country risk limit aggregate; when the bank's confirmed LC exposure to Turkish bank correspondents exceeds the country risk policy limit without triggering an exception approval, the OCC's country risk examination identifies the gap between the trade finance approval process and the country risk limit framework as a credit governance deficiency.`,
    keywords: ['export LC confirmation', 'country risk', 'OCC guidance', 'trade finance', 'concentration risk'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4351',
    name: "Banker's Acceptance Eligibility Determination Not Reviewed After Fed Policy Change",
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      `First Capital creates banker's acceptances to finance import transactions for commercial clients, booking them as eligible acceptances for Federal Reserve discount window purposes under the bank's liquidity buffer framework; following the Federal Reserve's 2019 policy update clarifying the eligibility criteria for discount window collateral, the bank has not reviewed whether its acceptance documentation standards and underlying trade transactions continue to meet the updated eligibility requirements. OCC guidance on contingent liquidity management and BCBS 248 stress scenario calibration require that liquidity buffers include only verified-eligible collateral; an acceptance portfolio that is partially ineligible for discount window pledge after the policy update causes the bank to overstate its contingent liquidity capacity, a gap that the bank's internal audit identifies during a pre-examination liquidity buffer quality review.`,
    keywords: [`banker's acceptance`, 'Fed discount window', 'BCBS 248', 'OCC guidance', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },

  // ── Additional Commercial Deposits ────────────────────────────────────────
  {
    code: 'B4352',
    name: 'Dormant Commercial Account Escheatment Process Misses Multi-Entity Group Structures',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital's unclaimed property escheatment process identifies dormant commercial accounts for state reporting by scanning individual account records for the applicable dormancy trigger period, without cross-referencing accounts within the same corporate group structure; when a commercial client group's operating subsidiary becomes dormant following a corporate restructuring while the parent's master account remains active, the subsidiary's balances are not identified as dormant because the system treats the related-entity relationship as sufficient proof of owner contact. State unclaimed property statutes in most jurisdictions do not recognize related-entity activity as an owner contact that resets the dormancy clock unless the owner of the specific account takes affirmative action; the bank's escheatment error creates state unclaimed property audit exposure and potential penalties under applicable state statutes.`,
    keywords: ['escheatment', 'unclaimed property', 'OCC guidance', 'commercial deposits', 'dormant accounts'],
    demoRelevant: false,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4353',
    name: 'Commercial Deposit Growth Exceeds FDIC Insurance Communication — Client Exposure Undisclosed',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's commercial relationship managers have encouraged clients to consolidate deposit balances at the bank to improve ECR pricing, resulting in several corporate clients maintaining aggregate deposit balances — across checking, money market, and time deposit accounts — materially above the $250K FDIC insurance per-depositor limit without receiving proactive disclosure of their uninsured exposure. FDIC consumer education guidance and OCC commercial banking conduct expectations require that banks proactively disclose the FDIC insurance coverage limit and the amount of uninsured balances to depositors who exceed the threshold; when a corporate client's CFO discovers in a board meeting that the company holds $8.2M in an uninsured bank account — following public coverage of another regional bank's stress events — the relationship escalation and reputational impact from the undisclosed exposure triggers a formal OCC inquiry.`,
    keywords: ['FDIC insurance', 'OCC guidance', 'commercial deposits', 'disclosure', 'uninsured deposits'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },

  // ── Additional Relationship Banking ──────────────────────────────────────
  {
    code: 'B4354',
    name: 'Relationship Profitability Reporting Excludes CRA Credit Value — Business Case Distorted',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's relationship profitability reporting system calculates the net present value of commercial banking relationships based on loan spread income, treasury fee income, and capital consumption, but does not include a positive value attribution for CRA-eligible lending activity that contributes to the bank's CRA performance rating and, by extension, to its ability to obtain OCC approval for acquisitions and branch expansions. OCC CRA examination guidance and the revised CRA final rule create tangible strategic value for CRA-qualified activity that is not captured in traditional relationship profitability models; relationship managers whose P&L is evaluated on a profitability score that ignores CRA contribution rationally deprioritize CRA-eligible credits, creating a systematic incentive misalignment that the bank's CRA officer identifies as a root cause of the CRA performance rating gap in the LMI lending component.`,
    keywords: ['CRA', 'relationship profitability', 'OCC guidance', 'LMI', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4355',
    name: 'Commercial Banking Client Complaint Process Does Not Meet CFPB Supervisory Standards',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial banking client complaint process routes corporate client escalations through the relationship manager and their team leader as the first-line resolution channel, without a separate complaint intake pathway that ensures escalations are logged, tracked, and routed to the bank's independent consumer complaint function. CFPB supervisory guidance on complaint management and OCC commercial banking examination standards expect that all client complaints — including those from commercial banking clients — be logged in a central complaint management system with defined resolution timelines, root cause analysis, and escalation to the CRA and compliance functions when patterns emerge; the RM-level complaint routing means that systemic issues with commercial banking fees, service delivery, and product disclosures are not surfaced to the bank's compliance function.`,
    keywords: ['complaint management', 'CFPB', 'OCC guidance', 'commercial banking', 'UDAP'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4356',
    name: 'Commercial Banking RM Portfolio Concentration in Single Industry — Relationship Risk Unmonitored',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's commercial banking relationship manager portfolio assignments are determined by geography and relationship manager tenure rather than industry sector expertise, resulting in several RMs managing portfolios that are 60–75% concentrated in a single industry sector — healthcare, commercial real estate, or manufacturing — without enhanced monitoring of the sector concentration risk within each RM's portfolio. OCC credit risk management guidance and the bank's own relationship management policy require that RM portfolio concentrations be monitored for industry concentration risk and that RMs managing concentrated portfolios receive sector-specific credit education and monitoring support; an RM portfolio that is 70% healthcare services lending requires sector-specific awareness of MACRA reimbursement changes and Medicaid expansion dynamics that a generalist RM is not equipped to monitor without structured support.`,
    keywords: ['RM portfolio concentration', 'OCC guidance', 'commercial banking', 'sector risk', 'credit risk'],
    demoRelevant: false,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4357',
    name: 'Oral Credit Commitment by Relationship Manager Creates Unauthorized Binding Obligation',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial banking relationships managers routinely communicate informal indications of credit appetite to commercial clients — "I think we can get you a $5M line" — without the required pre-screening against current credit policy and without written disclaimers that the indication is non-binding pending credit committee approval; in multiple instances, corporate borrowers rely on these oral indications to make business commitments before the bank's formal credit approval is received, and when credit committee declines or materially modifies the request, the client asserts a detrimental reliance claim. OCC commercial banking conduct standards and the bank's own lending policy require that all credit commitments be made in writing after credit committee approval; a pattern of unauthorized oral commitments generates legal exposure that the bank's legal department tracks as a recurring relationship management conduct issue requiring RM training remediation.`,
    keywords: ['oral credit commitment', 'OCC guidance', 'commercial banking', 'credit policy', 'Reg B'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4358',
    name: 'Commercial Client Adverse Action Notice Deficiency for Business Loan Declines',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial banking credit process provides decline notifications to commercial loan applicants as informal relationship manager conversations rather than written adverse action notices, on the basis that ECOA Reg B adverse action notification requirements apply to consumer credit rather than commercial lending. The CFPB's interpretation of ECOA's adverse action notification requirements under Section 1691(d) and the bank's legal analysis of Reg B Section 202.9 — which applies to both consumer and business credit — establish that adverse action notices are required for all credit applications, including commercial loans, when the bank takes adverse action; the bank's failure to provide written adverse action notices with specific reasons for commercial loan declines generates a Reg B compliance gap identified in the OCC's fair lending examination as a pattern of procedural non-compliance.`,
    keywords: ['ECOA', 'Reg B', 'adverse action', 'OCC guidance', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4359',
    name: 'Commercial Banking Incentive Compensation Not Reviewed Under CFPB Incentive Pay Guidance',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial banking incentive compensation plan rewards relationship managers for new loan origination volume, treasury management fee revenue, and commercial deposit growth without a corresponding compliance metric, risk quality adjustment, or clawback provision linked to subsequent loan performance; the plan has not been reviewed against the CFPB and OCC guidance on incentive compensation practices that require compensation structures to not encourage practices that harm clients or result in regulatory violations. OCC supervisory guidance on incentive compensation in commercial banking and the interagency guidance on sound incentive compensation policies require that banks periodically review their incentive structures to confirm they do not create incentives to recommend unsuitable products or to violate fair lending and UDAP requirements; the absence of a periodic incentive compensation review is flagged by the OCC examiner as an oversight gap in the bank's commercial banking compliance management system.`,
    keywords: ['incentive compensation', 'OCC guidance', 'CFPB', 'commercial banking', 'UDAP'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
];
