// seed-banking-dom15-commercial-banking-part2.ts
// Banking genome patterns — Commercial Banking & Middle Market
// Code range: B4360–B4419  (60 patterns)
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

export const BANKING_DOM15_COMMERCIAL_BANKING_PART2_PATTERNS: PatternSeed[] = [

  // ── Commercial Credit ──────────────────────────────────────────────────────
  {
    code: 'B4360',
    name: 'C&I Loan Underwriting Gap — DSCR Calculation Excludes Off-Balance-Sheet Lease Obligations',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's commercial-and-industrial loan underwriting templates calculate debt service coverage ratios using only on-balance-sheet funded debt obligations, omitting the annualized operating lease payments that mid-market borrowers capitalize under ASC 842 and that materially increase effective fixed-charge obligations. OCC credit risk examination guidance and the bank's own commercial underwriting policy require that DSCR calculations reflect all fixed financial obligations when assessing repayment capacity; a $7M C&I term loan approved at a 1.35x DSCR on the incomplete calculation would fall to 1.07x — inside the bank's 1.20x minimum threshold — when operating lease obligations are correctly included, creating a systematic underwriting quality deficiency that internal loan review flags as a portfolio-wide calibration error affecting 34 credits in the $2M–$15M segment.`,
    keywords: ['DSCR', 'C&I underwriting', 'ASC 842', 'OCC credit guidance', 'fixed-charge coverage'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4361',
    name: 'Covenant Monitoring System Fails to Detect Step-Down Threshold Breaches Mid-Quarter',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's covenant monitoring platform checks financial covenant compliance at the quarterly financial statement delivery date using borrower-provided statements, but does not track step-down covenant thresholds — where the minimum DSCR or maximum leverage ratio tightens at predefined intervals during a loan's term — applying only the initial covenant level to all periods. OCC commercial credit examination guidance requires that covenant monitoring systems reflect the actual contractual terms of the executed credit agreement, including step-down schedules; when a borrower's leverage covenant steps down from 3.5x to 3.0x at the 24-month mark, and the borrower's leverage is at 3.2x at that date, the system reports compliance because it is still testing against the original 3.5x threshold, generating a false-negative that allows the bank to fund a subsequent revolver draw on a technically defaulted facility.`,
    keywords: ['covenant monitoring', 'OCC credit guidance', 'leverage covenant', 'C&I lending', 'step-down covenant'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4362',
    name: 'Global Cash Flow Analysis Omits Guarantor Personal Financial Statement Liabilities',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial underwriting process requires a global cash flow analysis for guaranteed C&I loans that consolidates the borrowing entity's cash flows with those of the principal guarantor, but the analysis relies on guarantor personal financial statements that are accepted without third-party verification and that routinely omit contingent liabilities — guarantees on other business debts, limited partnership obligations, and real estate mortgage obligations held in personal names. OCC credit risk guidance and supervisory expectations for commercial underwriting quality require that global cash flow analyses be based on verified income and liability information from guarantors, including third-party confirmation of large real estate liabilities visible in credit reports; when a guarantor's undisclosed obligations exceed the guaranty value at the time of commercial loan default, the bank's recovery expectation is materially impaired relative to the underwriting assumption.`,
    keywords: ['global cash flow', 'guarantor analysis', 'OCC credit guidance', 'C&I underwriting', 'Reg B'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4363',
    name: 'Commercial Criticized Asset Migration Reporting Excludes Pass-Watch Transition Signals',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's criticized asset management process tracks loans rated Special Mention, Substandard, and Doubtful and reports migration trends to the credit committee, but does not include early warning indicators for Pass-Watch credits — loans rated Pass that exhibit one or more deterioration signals such as revolver utilization above 80%, DSCR trending toward the covenant floor, or industry sector stress. OCC examination guidance on commercial credit risk management and supervisory expectations for allowance adequacy under CECL require that banks identify potential deterioration in Pass-rated credits before they migrate to criticized status, using forward-looking qualitative factors; a criticized asset reporting framework that only captures loans already classified misses the leading-edge risk signal that the Pass-Watch population provides, causing the bank to underestimate CECL qualitative factor adjustments for the commercial loan segment.`,
    keywords: ['criticized assets', 'OCC credit guidance', 'CECL', 'Pass-Watch', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4364',
    name: 'Asset-Based Lending Borrowing Base Certificate Not Audited — Collateral Overstatement Risk',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's asset-based lending portfolio relies on monthly borrowing base certificates submitted by borrowers to calculate eligible collateral and available credit under revolving ABL facilities, but the bank's field examination program audits only credits above $15M, leaving $340M in ABL commitments below that threshold without an independent verification of the borrower-reported accounts receivable aging, ineligible receivable exclusions, and inventory valuations. OCC credit risk guidance on ABL supervision and the bank's own ABL policy require that all ABL facilities receive field examinations at a frequency calibrated to facility size, borrower risk rating, and collateral quality trends; the absence of field examination coverage for sub-$15M ABL credits creates a systematic collateral quality blind spot that the bank's internal loan review identifies when three ABL borrowers in the same sector submit borrowing base certificates that overstate eligible receivables by an average of 22%.`,
    keywords: ['asset-based lending', 'borrowing base certificate', 'OCC credit guidance', 'field examination', 'ABL'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4365',
    name: 'Annual Review Cadence for Criticized Commercial Loans Lags OCC Examination Expectations',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial credit review policy requires annual credit reviews for all pass-rated commercial loans above $1M but does not shorten the review cadence for Special Mention and Substandard credits, which receive full credit reviews on the same annual cycle despite their elevated risk profile. OCC credit risk examination guidance and supervisory expectations for criticized loan management require that banks perform more frequent reviews — typically semi-annual or quarterly — for loans rated Special Mention or worse, reflecting the increased probability of further deterioration and the need for active workout planning; when OCC examiners find that 18 Substandard-rated commercial credits above $2M have not received a credit review update in 14–16 months, the examination reports a systemic credit administration deficiency that becomes a matter requiring attention in the bank's examination report.`,
    keywords: ['criticized loan review', 'OCC credit guidance', 'Special Mention', 'credit administration', 'CECL'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4366',
    name: 'Middle-Market Underwriting Spreads Not Risk-Adjusted for Industry Sector Concentration',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital prices middle-market commercial loans using a risk-adjusted spread matrix that differentiates by credit grade and loan structure but does not include an explicit concentration premium for loans to borrowers in sectors where the bank already holds material portfolio concentrations — commercial real estate services, healthcare staffing, and specialty retail. OCC guidance on commercial lending concentration risk and the bank's own credit concentration policy require that loan pricing reflect incremental concentration risk when new originations increase existing sector concentrations above internal threshold levels; the absence of a concentration-aware pricing component causes the bank to underprice the marginal credit risk of its most concentrated industry exposures, contributing to a return-on-capital shortfall in the commercial banking segment that the consent order's capital planning remediation track identifies.`,
    keywords: ['concentration risk', 'OCC guidance', 'middle-market lending', 'loan pricing', 'RAROC'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4367',
    name: 'Commercial Real Estate Stress Test Does Not Apply OCC Stressed Cap Rate Scenarios',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial real estate loan portfolio stress testing applies property-value haircuts calibrated to observed peak-to-trough market declines from 2009–2011, without incorporating the OCC's current supervisory stress scenario guidance that prescribes stressed cap rate expansion assumptions based on current market cap rate levels and interest rate shock scenarios. OCC supervisory guidance on commercial real estate concentration risk and the Interagency CRE Guidance require that banks stress their CRE portfolios using scenarios consistent with regulatory supervisory stress benchmarks; when the bank's 2024 CRE stress results are reviewed by OCC examiners, the examiner's independently applied stressed cap rate scenario produces loan-to-value ratios 18–25 percentage points higher than the bank's internal stress results, materially increasing the estimated stressed loss content of the CRE portfolio.`,
    keywords: ['CRE stress test', 'OCC guidance', 'cap rate', 'commercial real estate', 'concentration risk'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4368',
    name: 'Participation Loan Credit Review Does Not Include Independent Analysis of Lead Bank Underwriting',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital participates in shared national credits and bilateral participation loans originated by lead banks, approving participation interests based on the lead bank's credit memorandum and financial analysis without conducting an independent credit underwriting assessment of the borrower. OCC shared national credit examination guidance and OCC credit risk supervisory expectations require that participating banks perform independent credit analysis — not merely review the lead bank's memo — before approving a participation interest, because the lead bank's underwriting standards and risk appetite may differ from the participating bank's; when the lead bank approves a leveraged buyout credit at 7.5x debt-to-EBITDA under its own policy and First Capital's independent analysis limit is 6.0x, the participation approval without independent underwriting creates a policy exception that was never identified or approved.`,
    keywords: ['participation loans', 'shared national credits', 'OCC credit guidance', 'lead bank', 'leveraged lending'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },
  {
    code: 'B4369',
    name: 'CECL Commercial Loan Qualitative Factor Adjustment Lacks Documented Basis and Back-Testing',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's CECL allowance for credit losses calculation applies qualitative factor (Q-factor) adjustments to the commercial loan quantitative baseline to reflect economic uncertainty, portfolio concentration risk, and credit quality migration trends; the Q-factor adjustments are determined by the credit risk committee through a consensus discussion process without quantitative back-testing against historical loss outcomes or documented empirical basis for the adjustment magnitude. OCC and FASB guidance on CECL implementation and the bank's own ACL policy require that Q-factor adjustments be supportable — grounded in specific evidence or analysis that explains the direction and magnitude of the adjustment — and periodically back-tested to confirm that historical Q-factor choices were reasonable; an ACL framework with undocumented Q-factor methodology is flagged by OCC examiners reviewing the bank's CECL implementation as a financial reporting risk.`,
    keywords: ['CECL', 'qualitative factors', 'OCC guidance', 'ACL', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'commercial-credit',
  },

  // ── Treasury & Cash Management ────────────────────────────────────────────
  {
    code: 'B4370',
    name: 'ICS and CDARS Program Disclosure Does Not Disclose Network Bank Exposure',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      `First Capital participates in the IntraFi ICS and CDARS deposit placement programs, sweeping large commercial deposit balances above $250K into a network of FDIC-insured banks to extend deposit insurance coverage to the full commercial client balance; the bank's program disclosure documents describe the insurance expansion benefit but do not clearly explain that the client's funds are held at multiple network banks, and does not disclose that the client's relationship with First Capital as custodian does not extend to the underlying network banks. FDIC guidance on brokered deposit disclosure and OCC commercial banking transparency expectations require that clients understand the counterparty structure of deposit placement programs; a commercial client that assumes its $10M ICS balance is held entirely at First Capital experiences settlement friction when the client attempts to access funds during a wire transfer instruction cut-off window that does not align with the network bank settlement timing.`,
    keywords: ['ICS', 'CDARS', 'FDIC insurance', 'OCC guidance', 'commercial deposits'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4371',
    name: 'Commercial Sweep Yield Reporting Misrepresents Net After-Fee Return to Clients',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital's commercial sweep account performance reports display the gross yield on overnight money market fund or Treasury sweep investments without netting out the bank's sweep administration fee, presenting a gross return figure that overstates the client's actual after-fee yield by 20–35 basis points depending on relationship tier and sweep volume. OCC UDAP guidance and the bank's own commercial banking disclosure standards require that performance metrics communicated to commercial clients reflect actual net returns after fees and charges; when a corporate treasury client benchmarks the bank's reported sweep yield against a competing bank's all-in net yield during a competitive RFP, the discovery of the gross vs. net reporting discrepancy triggers a formal client complaint and a competitive pricing review that the bank's treasury management team was not prepared to address.`,
    keywords: ['sweep account yield', 'UDAP', 'OCC guidance', 'commercial deposits', 'treasury management'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4372',
    name: 'Earnings Credit Rate Floor Not Applied During Negative Rate Scenario Planning',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      `First Capital's commercial deposit account analysis system calculates earnings credit using a formula pegged to the Fed funds effective rate, with no contractual floor preventing the ECR from falling to zero or below in a negative policy rate scenario; the bank's commercial deposit agreements for treasury management clients do not include an explicit ECR floor provision, creating potential contractual ambiguity about whether the bank could pass negative ECR credits to commercial depositors in a negative rate environment similar to the European Central Bank's 2014–2022 negative rate period. OCC commercial banking risk management guidance requires that treasury management account agreements clearly specify ECR calculation mechanics, including floor provisions; the absence of explicit floor language in 847 commercial account agreements creates a contract remediation obligation that the bank's legal and treasury teams estimate will require 90 days to execute before the next rate cycle review.`,
    keywords: ['ECR floor', 'OCC guidance', 'negative rate', 'commercial deposits', 'account analysis'],
    demoRelevant: false,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4373',
    name: 'Commercial Deposit Pricing Committee Does Not Benchmark Against Fed Funds Effective Rate Weekly',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's commercial deposit pricing committee reviews and sets earnings credit rates on a monthly cadence, without a process for intra-month adjustments when the Fed funds effective rate moves significantly between FOMC meetings; during a period of rapid Fed tightening with 75-basis-point increases at consecutive meetings, the bank's ECR lags the Fed funds rate by 60–90 days, causing relationship managers to lose competitive commercial deposit relationships to banks with more responsive ECR adjustment processes. OCC commercial banking examination guidance and UDAP transparency expectations require that ECR pricing be competitive and aligned with the bank's own cost of funds; a systematic ECR lag during rising rate cycles creates both relationship attrition risk and a potential UDAP transparency concern when the bank's own funding costs rise faster than the ECR passed to commercial depositors.`,
    keywords: ['ECR pricing', 'OCC guidance', 'UDAP', 'commercial deposits', 'deposit pricing committee'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4374',
    name: 'Large Commercial Depositor Retention Program Lacks Formal Approval and Board Oversight',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial banking group operates an informal large depositor retention program where relationship managers offer above-standard ECRs, fee waivers, and preferential loan pricing to commercial clients who threaten to move deposits, with approvals made at the group head level without board or risk committee oversight or documentation of the financial impact. OCC governance guidance and the bank's own interest rate risk and funding policies require that material exceptions to commercial deposit pricing be approved through a documented exception framework and reported to the Asset-Liability Committee; an undocumented large depositor retention program creates pricing consistency risk, UDAP fairness concerns if similarly-situated clients receive materially different ECR treatment, and a governance gap that OCC examiners flag when reviewing commercial banking management practices.`,
    keywords: ['depositor retention', 'OCC guidance', 'UDAP', 'commercial deposits', 'ALCO'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4375',
    name: 'Operational Deposit Classification Overstated — Non-Operational Balances Assigned Lower Runoff Factor',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital classifies a larger proportion of its commercial deposit portfolio as operational deposits — eligible for a lower 25% runoff rate under LCR rules — than is supported by the operational relationship criteria required under the LCR final rule, by counting deposit relationships as operational where the commercial client uses only basic ACH origination services rather than requiring the full range of operational banking activities specified in the Federal Reserve's LCR rule commentary. The overclassification of non-operational commercial deposits as operational reduces the LCR outflow assumption for the commercial deposit portfolio, artificially inflating the reported LCR; OCC examiners reviewing the bank's LCR operational deposit methodology under BCBS 248 supervision find that correcting the classification to a defensible operational deposit standard reduces the bank's reported LCR by 9 percentage points.`,
    keywords: ['LCR', 'operational deposits', 'BCBS 248', 'OCC guidance', 'commercial deposits'],
    demoRelevant: true,
    subTopic: 'commercial-deposits',
  },
  {
    code: 'B4376',
    name: 'Commercial Payment Hub Cutover Disrupts Positive Pay and ACH Flows for 72 Hours',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital migrates its commercial payment operations to a new treasury management hub platform over a holiday weekend, but the data migration of commercial client positive pay issued-check files and ACH origination templates is not fully validated before go-live, resulting in 72 hours of positive pay service disruption and 14 ACH origination template failures affecting corporate payroll and vendor payment runs on the first business day after cutover. NACHA operating rules hold the bank liable for same-day ACH failures caused by bank systems, and OCC commercial banking operational risk guidance requires that payment system migration plans include full parallel-run validation before cutover; the post-migration service disruption generates NACHA rule violation exposure, client claims for downstream payroll funding costs, and a reputational impact that triggers two corporate clients to initiate competitive RFP processes.`,
    keywords: ['payment hub migration', 'NACHA', 'OCC guidance', 'positive pay', 'ACH'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },
  {
    code: 'B4377',
    name: 'Real-Time Payment Connectivity for Commercial Clients Not Covered by Treasury Service Agreement',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      `First Capital enables RTP network access for commercial clients through its treasury management platform as an extension of existing ACH origination services, but the bank's standard treasury service agreement does not include specific disclosures about RTP transaction finality, irrevocability, and the absence of a dispute-correction mechanism that applies to traditional ACH transactions. The Clearing House RTP network rules and OCC commercial banking disclosure guidance require that clients be informed of the unique characteristics of real-time payment finality before using RTP for commercial transactions; when a corporate client initiates a $480K RTP payment to the wrong beneficiary account due to a data entry error, the client's assumption that the bank can recall the payment as it would an ACH credit entry is incorrect, and the client suffers a permanent loss that it attributes to the bank's failure to disclose RTP irrevocability.`,
    keywords: ['RTP', 'The Clearing House', 'OCC guidance', 'commercial banking', 'payment finality'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },
  {
    code: 'B4378',
    name: 'FedNow Instant Payment SLA Not Defined in Commercial Treasury Service Agreement',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      `First Capital launches FedNow instant payment origination for commercial clients as a premium treasury feature without updating the bank's commercial treasury service agreement to include FedNow-specific SLA terms — maximum processing time, system availability commitments, error correction procedures, and the distinction between FedNow credit transfer finality and traditional ACH correction rights. OCC commercial banking disclosure guidance and FedNow operating rules require that banks clearly communicate the terms and conditions governing instant payment services before client enrollment; when the bank's FedNow system experiences a 90-minute processing outage during business hours, commercial clients have no contractual SLA basis to assert service credits, and the bank's legal team discovers that the standard treasury agreement's force majeure provision does not clearly apply to system-availability disruptions.`,
    keywords: ['FedNow', 'OCC guidance', 'commercial banking', 'payment SLA', 'treasury management'],
    demoRelevant: true,
    subTopic: 'cash-management',
  },

  // ── Trade Finance ─────────────────────────────────────────────────────────
  {
    code: 'B4379',
    name: 'Supply Chain Finance Buyer Concentration Risk Not Captured in TPRM Framework',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's supply chain finance program — reverse factoring — concentrates early-payment receivable funding against approved payables from a small number of anchor buyers, with the top three buyers representing 68% of the program's approved payables volume; this buyer concentration is not assessed in the bank's third-party risk management framework as a supply chain program counterparty risk, nor is it reflected in the bank's credit concentration reporting to the board. OCC guidance on third-party risk management and concentration risk principles require that banks identify concentration exposures arising from supply chain finance anchor buyer relationships and include them in the board's credit concentration reporting; when an anchor buyer enters financial distress and suspends the supply chain program, the rapid reduction in approved payables volume creates a funding cliff for participating suppliers who have built their working capital planning around early payment access.`,
    keywords: ['supply chain finance', 'OCC Bulletin 2023-17', 'TPRM', 'concentration risk', 'reverse factoring'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4380',
    name: 'UCP 600 Presentation Period Waiver Not Documented — Confirming Bank Waiver Exposure',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's trade finance unit grants presentation period extensions on letters of credit at the request of corporate applicants — extending the 21-day UCP 600 Article 14(c) presentation window to accommodate late shipment documentation — without obtaining the confirming bank's written consent when First Capital is acting as the confirming bank on a foreign LC. UCP 600 Article 14(c) requires that presentation period extensions be agreed by all parties to the credit, including any confirming bank; when First Capital unilaterally extends the presentation period and the foreign issuing bank subsequently refuses to reimburse for a presentation made after the original period but within the extended window, First Capital as confirming bank is obligated to honor the presentation from its own funds without a reimbursement right, creating a $1.8M out-of-pocket loss attributable to the waiver documentation failure.`,
    keywords: ['UCP 600', 'presentation period', 'confirming bank', 'OCC guidance', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4381',
    name: 'Supply Chain Finance Program ESG Criteria Not Audited Against Supplier Certifications',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      `First Capital's supply chain finance program offers preferential early-payment discount rates to suppliers that provide ESG certification documentation — sustainability ratings, responsible sourcing attestations, and carbon reduction commitments — to fulfill anchor buyer ESG supply chain requirements; the bank accepts supplier ESG certifications at face value without a third-party audit or refresh cycle, and the pricing differential is applied based on the initial certification without monitoring for certification revocations or supplier practice changes. OCC guidance on commercial banking ESG risk and sustainable finance disclosures and the SEC's supply chain climate risk disclosure framework create expectations that ESG-linked financial product terms be verifiable and auditable; when an anchor buyer's ESG audit discloses that a preferred-rate supplier's carbon certification was fraudulent, the bank's supply chain program faces reputational exposure and anchor buyer claims that the bank's certification process failed its ESG product integrity commitment.`,
    keywords: ['supply chain finance', 'ESG', 'OCC guidance', 'sustainable finance', 'supplier certification'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4382',
    name: 'Trade Finance SWIFT Messaging Upgrade Not Tested Against ISO 20022 Field Requirements',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's trade finance operations platform generates SWIFT MT 700 and MT 760 messages for LC issuance and standby LC guarantee transmissions; the bank's SWIFT migration roadmap includes a transition from MT to MX (ISO 20022) message formats required under SWIFT's mandatory migration timeline, but the trade finance system vendor has not delivered an ISO 20022-compatible message generator, and the bank has not completed mapping of its LC data fields to ISO 20022 camt and tsin message schemas. OCC operational risk guidance and SWIFT's mandatory migration requirements create a compliance deadline for MT-to-MX migration; when First Capital's correspondent banks complete their ISO 20022 migrations and begin rejecting legacy MT format messages, the bank's trade finance unit is unable to issue new LCs for 48 hours while the messaging format incompatibility is diagnosed and a workaround is implemented.`,
    keywords: ['SWIFT ISO 20022', 'MT to MX', 'OCC guidance', 'trade finance', 'SWIFT migration'],
    demoRelevant: true,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4383',
    name: 'Import LC Financing Exposure Not Included in Borrower Aggregate Credit Limit Calculation',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital issues import letters of credit for commercial borrowers whose total bank credit is managed against an aggregate credit limit, but the bank's credit exposure tracking system classifies import LC contingent liabilities separately from funded credit exposures, resulting in LC exposure not being included in the borrower's aggregate limit utilization until the LC is presented and funded. OCC credit concentration guidance and Regulation Y single-obligor lending limit requirements under 12 CFR Part 32 require that contingent credit exposures — including undrawn LC exposure — be included in the single-obligor limit calculation; when a borrower's import LC contingent exposure causes the aggregate credit — funded plus contingent — to exceed First Capital's 15% of capital single-obligor limit, the credit policy breach is not detected until a quarterly credit review, at which point two additional LC issuances have already compounded the excess.`,
    keywords: ['import LC', 'single-obligor limit', 'OCC guidance', 'Reg Y', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4384',
    name: 'Forfaiting and Receivables Discounting Program Not Assessed for True-Sale Accounting Treatment',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's trade finance unit purchases export receivables from corporate clients through forfaiting and receivables discounting arrangements that the bank books as purchases rather than secured loans, relying on client representations that the underlying receivables are free and clear and that the transfers meet ASC 860 true-sale criteria; the bank has not obtained legal opinions confirming true-sale treatment for its receivables purchase programs in the jurisdictions of the key exporting clients. OCC examination guidance on off-balance-sheet exposures and FASB ASC 860 derecognition criteria require that receivable purchase programs be supported by current legal opinions addressing true-sale enforceability under applicable law; when an exporting client enters insolvency and the insolvency trustee challenges the true-sale transfer on the basis that the receivables were encumbered by a floating charge that First Capital did not discover, the bank's receivables purchase exposure reverts to a secured claim subordinate to the floating charge holder.`,
    keywords: ['forfaiting', 'ASC 860 true sale', 'OCC guidance', 'trade finance', 'receivables discounting'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B4385',
    name: 'AI Trade Financing Eligibility Screening Flags Permissible Dual-Use Commodities as Prohibited',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital deploys an AI screening tool that reviews LC applications for prohibited commodity content by matching commodity descriptions against OFAC, BIS Export Administration Regulations, and the Wassenaar Arrangement dual-use goods list; the AI screening model applies overly conservative keyword matching that flags common industrial commodities — precision-ground steel tubing, optical sensors, and specialized lubricants — as potential dual-use items requiring enhanced review, even when the specific product specifications clearly fall within the EAR99 classification that requires no export license. SR 11-7 model governance and OCC BSA/AML compliance management guidance require that AI screening models be calibrated to minimize false-positive rates that impede legitimate commercial transactions; an AI model with a 34% false-positive rate for dual-use screening creates a commercial banking operational bottleneck that delays legitimate LC approvals by 5–7 business days and damages the bank's reputation for trade finance execution speed.`,
    keywords: ['AI trade screening', 'OFAC', 'EAR', 'SR 11-7', 'trade finance'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },

  // ── AI Commercial Banking ─────────────────────────────────────────────────
  {
    code: 'B4386',
    name: 'AI Commercial Loan Origination Platform Vendor Not Registered in SR 11-7 Third-Party Model Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital licenses an AI-powered commercial loan origination platform that uses ML to score C&I loan applications, recommend credit structures, and generate preliminary credit memos, deployed as the intake layer for loans in the $500K–$5M segment; the platform is classified as a software tool rather than a model and is not registered in the bank's SR 11-7 model inventory, meaning its ML scoring algorithms have not been independently validated, its training data composition is unknown to the bank's model risk team, and its performance has not been back-tested against the bank's actual loss experience. SR 11-7 and OCC 2011-12 define third-party vendor tools that generate quantitative outputs used in credit decisions as models subject to bank model risk governance; an AI origination platform scoring $340M in annual loan volume outside the model inventory represents a systemic MRM consent order compliance breach that the bank's model risk officer identifies in a routine inventory reconciliation.`,
    keywords: ['AI loan origination', 'SR 11-7', 'OCC 2011-12', 'third-party model risk', 'commercial underwriting'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4387',
    name: 'LLM-Generated Commercial Credit Spread Analysis Not Validated Against Bank Pricing Model',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's commercial banking team uses an LLM to generate peer-comparable credit spread analysis for middle-market deal pricing, with the LLM synthesizing recent market precedents from public leveraged loan data and the bank's own deal history to produce a competitive spread recommendation; relationship managers present the LLM spread analysis to borrowers and credit committees as market data without disclosing the AI-generated nature of the analysis or comparing it against the bank's own validated RAROC-based pricing model floor. SR 11-7 model governance and OCC guidance on commercial loan pricing transparency require that pricing recommendations used in credit approvals be grounded in validated quantitative models with documented assumptions; when the LLM recommends a spread 40 basis points below the bank's RAROC minimum for the applicable credit grade — because public market comparables reflect broadly syndicated market pricing rather than the bank's hold-to-maturity bilateral cost structure — the resulting approval at below-floor pricing generates negative risk-adjusted returns that compound the bank's consent order capital planning deficit.`,
    keywords: ['LLM credit spread', 'SR 11-7', 'RAROC', 'OCC guidance', 'middle-market lending'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4388',
    name: 'AI DSCR Projection Tool Trained on Pre-COVID Growth Data Overstates Mid-Market Repayment Capacity',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI tool that projects forward DSCR over the loan term for middle-market C&I credits by fitting a growth model to the borrower's historical revenue and EBITDA, with the model trained on a dataset dominated by 2017–2022 mid-market financial performance that reflects above-trend growth driven by fiscal stimulus and post-COVID demand recovery. SR 11-7 model validation requirements and OCC commercial underwriting guidance require that forward projection models be tested for out-of-sample performance across the full economic cycle, including stress periods; the AI tool's growth model systematically overestimates sustainable DSCR for borrowers in mean-reverting cyclical sectors because its training data excludes the 2001–2003 and 2008–2010 stress cycles, causing the bank to approve commercial credits at leverage levels that default at a materially higher rate than the AI's projected loss content.`,
    keywords: ['AI DSCR projection', 'SR 11-7', 'model validation', 'OCC credit guidance', 'C&I underwriting'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4389',
    name: 'GenAI Commercial Deal Screening Tool Surfaces Sensitive Competitor Client Information',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital deploys a GenAI deal screening assistant that helps relationship managers research potential commercial clients by synthesizing publicly available business information, credit metrics, and industry intelligence; the AI tool is trained on a corpus that includes confidential deal information from prior pitch processes, and its responses to commercial prospect research queries occasionally surface details about other clients' credit structures or relationship terms that were included in the training corpus without sanitization. OCC commercial banking conduct standards and the bank's own information barrier and client confidentiality policies require that AI tools used in client-facing sales processes not create information leakage between client relationships; when a GenAI deal screening response includes a reference to a competitor's existing credit facility structure — gleaned from a prior deal memo in the training corpus — the information exposure creates a client confidentiality breach that requires immediate remediation of the AI training dataset and a formal notification to the affected client.`,
    keywords: ['GenAI deal screening', 'SR 11-7', 'OCC guidance', 'information barrier', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4390',
    name: 'AI Commercial Covenant Monitoring Drift — Model Retraining Not Triggered by Credit Agreement Amendment',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's AI covenant monitoring system extracts financial covenant definitions from credit agreements using NLP at origination and tracks compliance over the loan term, but does not re-execute the extraction process when credit agreements are amended — covenant step-downs, modified EBITDA definitions, and basket size changes incorporated in amendments are not reflected in the monitoring system's compliance testing logic. SR 11-7 model governance and OCC credit administration guidance require that automated monitoring systems reflect current, executed contractual terms including all amendments; when a borrower's credit agreement is amended to modify the EBITDA definition following an acquisition, and the covenant monitoring AI continues testing against the pre-amendment definition, the system reports technical compliance on a facility that would show a covenant breach under the amended definition — a monitoring failure that internal loan review discovers 9 months after the amendment.`,
    keywords: ['AI covenant monitoring', 'SR 11-7', 'NLP', 'OCC credit guidance', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4391',
    name: 'LLM Commercial Banking Relationship Summary Produces Inaccurate Relationship Revenue Figures',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's commercial banking CRM is augmented with an LLM that generates relationship summary narratives for relationship managers preparing for client meetings, synthesizing loan balances, treasury service volumes, deposit balances, and fee revenue from multiple source systems; the LLM's data aggregation logic contains a join error that causes it to double-count treasury fee revenue for relationships with multiple TM accounts, and the resulting inflated revenue figures are presented in client meeting materials without independent verification by the relationship manager. OCC commercial banking governance standards and the bank's own client relationship management policy require that client financial information presented in bank materials be accurate and reviewed; when a relationship manager presents a client with a relationship revenue summary that overstates annual fee income by $140K and the client challenges the accuracy, the bank's commercial banking credibility is damaged and the error source — the unvalidated LLM data aggregation — triggers a broader review of AI-generated client reporting.`,
    keywords: ['LLM relationship summary', 'SR 11-7', 'OCC guidance', 'CRM', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4392',
    name: 'AI Commercial Fraud Detection Model Not Updated for Business Email Compromise Patterns',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's AI fraud detection model for commercial wire and ACH transactions was validated and deployed in 2021, using a training dataset that predates the significant evolution of business email compromise attack patterns — specifically the use of virtual account numbers, layered correspondent routing, and real-time payment channels that BEC actors adopted in 2022–2024 to evade legacy commercial fraud detection heuristics. SR 11-7 ongoing monitoring requirements and OCC operational risk guidance on commercial fraud prevention require that fraud detection models be retrained and re-validated when the fraud pattern landscape changes materially; the 2021-vintage BEC detection model achieves an 82% detection rate on historical fraud patterns but only a 54% detection rate on 2023–2024 BEC schemes — a performance gap that the bank's fraud operations team documents through 18 months of missed detection cases before a model retraining request is formally submitted to the model risk team.`,
    keywords: ['AI fraud detection', 'SR 11-7', 'BEC', 'OCC guidance', 'commercial banking fraud'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4393',
    name: 'GenAI Commercial Banking Newsletter Produces Regulatory Guidance Errors Distributed to Clients',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's commercial banking marketing team deploys a GenAI tool to produce monthly treasury management newsletters distributed to corporate clients, containing regulatory updates, market commentary, and product feature announcements; the GenAI tool, drawing on a training corpus with a knowledge cutoff, produces an inaccurate summary of the CFPB's final Section 1071 small business lending data collection rule implementation timeline that misquotes the compliance effective date by six months, causing corporate clients to update their internal compliance programs based on incorrect bank-sourced information. OCC commercial banking conduct standards and CFPB supervisory expectations require that compliance information provided by banks to business clients be accurate, current, and reviewed by qualified compliance personnel before distribution; the newsletter compliance error requires an immediate client correction communication, a review of all prior AI-generated newsletters, and a pre-publication review process for regulatory content.`,
    keywords: ['GenAI client communication', 'CFPB 1071', 'OCC guidance', 'UDAP', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4394',
    name: 'AI Commercial Underwriting Assistant Hallucinates Industry Benchmark Data in Credit Memos',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's commercial underwriting team uses an LLM assistant to populate industry benchmark sections of credit memos, prompting the AI to provide peer leverage ratios, EBITDA margins, and interest coverage benchmarks for the borrower's industry sector; the LLM produces specific, plausible-sounding benchmark figures — including apparent citations to industry surveys — that are hallucinations rather than real data, and credit analysts accept the AI-generated benchmarks without verifying them against actual published sources such as RMA Annual Statement Studies or S&P Capital IQ sector reports. SR 11-7 model governance and OCC commercial underwriting documentation standards require that industry benchmark data used in credit approvals be sourced from verified, authoritative publications; when an OCC examiner independently checks the industry benchmarks cited in five credit memos against RMA data and finds that three contain materially inaccurate figures that influenced the leverage assessment, the credit documentation quality finding becomes a consent order remediation item.`,
    keywords: ['LLM hallucination', 'SR 11-7', 'OCC 2011-12', 'commercial underwriting', 'RMA benchmarks'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4395',
    name: 'AI Middle-Market Credit Scoring Model Exhibits Disparate Impact on Minority-Owned Businesses',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI credit scoring model for middle-market loan pre-qualification that uses ML to predict probability of default based on financial statement ratios, industry code, geographic market, and business tenure; the model was not tested for disparate impact under ECOA and Reg B before deployment, and a post-deployment fair lending analysis reveals that the model's denial rate for minority business enterprise (MBE) classified applicants is 28 percentage points higher than for non-MBE applicants at similar financial statement quality levels, attributable to the model's weighting of industry sector codes that are disproportionately populated by MBE businesses. OCC and CFPB fair lending examination guidance and Reg B's disparate impact standard require that AI credit models be tested for discriminatory outcomes using available proxies before production deployment; the identified disparate impact requires immediate model suspension, a look-back remediation for affected applicants, and SR 11-7 validation with a mandatory fair lending component.`,
    keywords: ['AI credit scoring', 'ECOA', 'Reg B', 'SR 11-7', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4396',
    name: 'AI Commercial Treasury Chatbot Provides Tax Advice Outside Bank Authorization Scope',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital deploys a GenAI chatbot for its commercial treasury management portal that responds to client inquiries about cash management, account features, and service configurations; the chatbot's guardrails do not prevent it from responding to corporate client questions about the tax treatment of treasury management earnings credits, sweep account income, and controlled disbursement timing strategies, producing responses that constitute tax advice requiring professional CPA or tax attorney qualifications. OCC commercial banking conduct standards and the bank's own scope-of-services policy prohibit bank employees and bank-sponsored tools from providing tax advice; when a corporate client acts on the chatbot's advice about the deductibility of treasury service fees and faces a tax audit adjustment, the client claims the bank's AI tool provided the tax guidance on which they relied, creating liability exposure that the bank's legal team must address by negotiating a release and redesigning the chatbot's topic constraints.`,
    keywords: ['GenAI chatbot', 'OCC guidance', 'UDAP', 'commercial banking', 'unauthorized advice'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4397',
    name: 'Predictive Commercial Attrition Model Deployed Without UDAP Retention Offer Review',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital deploys an ML attrition prediction model that identifies commercial banking clients with high probability of relationship departure and triggers automated retention offers — fee waivers, ECR enhancements, and preferential loan pricing — targeted to the at-risk segment identified by the model; the automated retention offer program was deployed without a UDAP fairness review confirming that the retention pricing offered to AI-identified at-risk clients does not produce a discriminatory outcome where minority business owners and LMI-community businesses are systematically denied retention benefits because the attrition model under-predicts their departure probability. OCC UDAP guidance and the CFPB's published AI fairness supervisory expectations require that AI-triggered pricing and retention programs be tested for discriminatory access outcomes; when a fair lending analysis reveals that the attrition model's training data reflects historical relationship attrition patterns that systematically underrepresent MBE clients — because MBE clients left without generating the account closure events the model uses as departure signals — the resulting retention offer program excludes a protected class from its benefits.`,
    keywords: ['ML attrition model', 'UDAP', 'SR 11-7', 'OCC guidance', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4398',
    name: 'AI Collateral Valuation Tool for Commercial Real Estate Not Validated Against Appraisal Standards',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an AI automated valuation model (AVM) to produce interim collateral valuations for commercial real estate collateral on performing loans in the $1M–$10M range, using the AVM output to satisfy the bank's annual collateral review requirement between full-cycle FIRREA appraisals; the AVM has not been validated against a holdout sample of contemporaneous FIRREA-compliant appraisals, and the bank has not confirmed that the AVM's confidence interval is sufficient to support the collateral valuation conclusion for supervisory purposes. OCC real estate lending and appraisal guidance under 12 CFR Part 34 and the Interagency Appraisal and Evaluation Guidelines require that evaluations — including AVM-based evaluations — be validated for the specific property type, geographic market, and loan size for which they are used; an AVM that produces valuations 18–24% above independently appraised values for suburban office properties during a period of post-pandemic office market stress causes the bank to systematically underestimate LTV ratios in its CRE monitoring portfolio.`,
    keywords: ['AI AVM', 'FIRREA', 'OCC Part 34', 'commercial real estate', 'collateral valuation'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4399',
    name: 'LLM Adverse Action Explanation for AI Commercial Credit Denial Does Not Meet ECOA Specificity',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital uses an AI credit scoring model to pre-qualify commercial loan applications, and deploys an LLM to generate adverse action explanations when the AI model denies an application; the LLM-generated adverse action notices use general language — "insufficient cash flow coverage" and "elevated leverage relative to industry norms" — that does not identify the specific financial ratios and thresholds that triggered the denial as required under Reg B Section 202.9(b)(2). OCC fair lending examination guidance and CFPB adverse action interpretation guidance require that adverse action notices for credit denials provide the principal reasons for the adverse action with sufficient specificity that the applicant can understand what information was considered and what they can do to improve their application; LLM-generated notices that paraphrase the AI model's output without translating the model's specific feature contributions into human-readable Reg B reasons constitute a systematic Reg B compliance failure across all AI-assisted commercial denials.`,
    keywords: ['ECOA', 'Reg B', 'adverse action', 'LLM', 'AI credit denial'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4400',
    name: 'AI Commercial Portfolio Stress Testing Model Not Submitted to DFAST Validation Review',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital uses an AI machine learning model to project commercial loan loss rates under Dodd-Frank Act stress test scenarios, generating stressed probability of default and loss given default estimates for the commercial portfolio by training on internal historical loss data and macroeconomic factor series; the AI stress model was developed by the credit risk analytics team and deployed into the DFAST submission workflow without being submitted to the independent model validation unit for a full SR 11-7 validation, on the basis that the DFAST submission deadline did not allow time for a validation cycle. SR 11-7 and OCC expectations for DFAST model governance explicitly require that all models used in regulatory capital stress testing be independently validated before their first use in a regulatory submission; when OCC examiners review the bank's DFAST documentation and find that the commercial loss projection model lacks a validation report, the finding compounds the bank's existing consent order MRM remediation obligations.`,
    keywords: ['DFAST', 'AI stress testing', 'SR 11-7', 'OCC guidance', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4401',
    name: 'GenAI Commercial Client Onboarding Risk Narrative Bypasses BSA Officer Second Review',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital integrates a GenAI tool into the commercial client onboarding workflow that generates a BSA risk narrative — summarizing adverse media, beneficial ownership structure, and transaction profile risk factors — which is presented to the front-line relationship manager for review and approval, with the GenAI output accepted as satisfying the BSA officer second-review requirement without an independent BSA officer examination of the underlying source materials. FinCEN's CDD final rule and OCC BSA/AML examination guidance require that BSA risk determinations for commercial onboarding be made or independently reviewed by a qualified BSA officer who has access to and reviews the underlying customer due diligence information, not merely the AI's synthesized narrative; when the GenAI tool produces an inaccurate low-risk narrative for a commercial applicant with significant adverse media in foreign-language sources not covered by the AI's data sources, the client is onboarded without EDD, and a subsequent SAR review identifies the high-risk relationship.`,
    keywords: ['GenAI BSA narrative', 'FinCEN CDD rule', 'BSA/AML', 'OCC guidance', 'commercial onboarding'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4402',
    name: 'AI-Powered Commercial Loan Monitoring Fails to Detect Financial Statement Manipulation',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital deploys an AI monitoring tool that ingests borrower-provided financial statements for commercial loan covenant compliance and cash flow analysis, using ML-based anomaly detection to flag unusual revenue and expense patterns; the AI anomaly detection model is trained on legitimate financial statement variations and does not include a fraud detection component calibrated to common financial statement manipulation techniques — channel stuffing, round-trip transactions, and fictitious receivable inflation — that are distinct in their statistical signature from organic performance variability. SR 11-7 model governance and OCC credit risk examination guidance require that commercial monitoring systems be effective at detecting deterioration including manipulation-driven overstatement of repayment capacity; when a commercial borrower manipulates accounts receivable balances to maintain covenant compliance, the AI monitoring tool reports no anomaly while a trained credit analyst conducting an annual review identifies the manipulation pattern through ratio analysis.`,
    keywords: ['AI loan monitoring', 'SR 11-7', 'OCC credit guidance', 'financial statement fraud', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4403',
    name: 'AI Commercial Relationship Profitability Model Not Segmented by Risk-Adjusted Return',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's AI relationship profitability model ranks commercial banking relationships by total gross revenue contribution — loans, deposits, fees, and cross-sell — without adjusting for the capital consumed and credit risk embedded in each relationship's loan exposure, causing the model to rank high-revenue relationships with elevated credit risk and concentrated exposures as more profitable than lower-revenue relationships with superior risk-adjusted economics. SR 11-7 model governance and OCC guidance on performance measurement in commercial banking require that relationship profitability models used in RM compensation and relationship retention decisions reflect risk-adjusted metrics; when the AI model consistently ranks the bank's most concentrated and highest-risk commercial credits as its top relationships, RM behavior is reinforced to pursue similar credits, and the bank's commercial loan portfolio risk concentration trend is driven by a misaligned profitability signal.`,
    keywords: ['AI profitability model', 'SR 11-7', 'RAROC', 'OCC guidance', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4404',
    name: 'LLM Commercial Credit Policy Interpretation Tool Provides Inconsistent Guidance Across RMs',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital deploys an LLM tool that relationship managers query to interpret commercial credit policy for deal structuring questions — maximum advance rates, eligible collateral types, permitted covenant definitions, and leveraged lending guidance applicability; because the LLM generates contextually-dependent responses that are not anchored to a single canonical policy interpretation, different RMs querying the same policy question with slightly different wording receive materially different guidance, leading to inconsistent credit structure decisions across the commercial banking team. OCC commercial banking governance and credit policy administration standards require that credit policy be applied consistently and that RM access to policy guidance not produce interpretive divergence; when two RMs structure otherwise identical commercial real estate credits with different collateral advance rates — both citing LLM tool policy guidance — the credit committee's discovery of the inconsistency triggers a formal review of all LLM-assisted policy interpretation cases.`,
    keywords: ['LLM credit policy', 'SR 11-7', 'OCC guidance', 'credit administration', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4405',
    name: 'AI Commercial Banking Platform Trained on Proprietary Data Without Client Consent for Model Training Use',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial banking fintech platform vendor uses the bank's commercial client transaction data to retrain and improve its AI models under a contract clause granting the vendor rights to use "anonymized transaction data" for platform improvement purposes; the bank has not obtained client consent for the use of their financial data in third-party AI model training, and the vendor's anonymization process — which removes account numbers but retains industry sector, geographic, and transaction size patterns — is insufficient to prevent re-identification of large commercial clients whose transaction patterns are distinctive. OCC Bulletin 2023-17 on third-party relationships and the bank's own privacy policy require that client financial data not be shared with third parties for purposes beyond service delivery without client consent; when the bank's legal team reviews the vendor contract after a data privacy inquiry from a corporate client, the model training data use clause is identified as a breach of the bank's client privacy representations.`,
    keywords: ['AI data use', 'OCC Bulletin 2023-17', 'TPRM', 'privacy', 'commercial banking platform'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4406',
    name: 'AI Commercial Early Warning System Alert Fatigue Causes Relationship Managers to Dismiss Valid Signals',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital deploys an AI early warning indicator system that generates alerts for commercial loan relationships exhibiting deterioration signals — declining operating account balances, revolver utilization creep, late financial statement delivery, and industry sector stress flags — but the model is calibrated too broadly, generating 40–60 alerts per RM per month that include a high proportion of false positives for credits that subsequently perform without incident. SR 11-7 ongoing model performance monitoring and OCC commercial credit supervision guidance require that EWI systems be calibrated to achieve a balance between sensitivity and specificity sufficient to make alerts actionable; when RMs routinely dismiss alerts without documented review because the signal-to-noise ratio is too low, the EWI system provides no effective deterioration detection coverage — and when three dismissed alerts on a $22M commercial credit precede a sudden bankruptcy filing, the bank's loan review function identifies the alert dismissal pattern as a systemic credit monitoring failure.`,
    keywords: ['AI early warning', 'SR 11-7', 'OCC credit guidance', 'alert fatigue', 'commercial credit'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },

  // ── Relationship Banking ──────────────────────────────────────────────────
  {
    code: 'B4407',
    name: 'Middle-Market Client Segmentation Does Not Reflect Updated CFPB Small Business Size Definitions',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's commercial banking client segmentation framework uses internal revenue thresholds — businesses below $10M in annual revenue are classified as small business, $10M–$100M as middle market — that do not align with the CFPB's small business size standard under the Section 1071 final rule, which uses SBA size standards by NAICS code to determine whether a business qualifies for 1071 data collection coverage. The misalignment causes the bank to apply its small business product suite and pricing to some clients that are CFPB-defined small businesses while applying its middle-market framework to others, creating a compliance gap where Section 1071 data collection obligations apply to clients that the bank's systems classify as middle market and therefore exempt. OCC commercial banking examination guidance requires that compliance frameworks reflect regulatory definitions; the segmentation misalignment generates a Section 1071 underreporting risk that the bank's compliance team identifies only during its initial 1071 implementation assessment.`,
    keywords: ['CFPB 1071', 'small business segmentation', 'OCC guidance', 'Reg B', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4408',
    name: 'Commercial Banking Call Reporting Error — Unfunded Commitments Classification Understated',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's Call Report preparation process for Schedule RC-L off-balance-sheet items classifies revolving commercial credit facilities as unused commitments only to the extent the undrawn amount is immediately available for draw, excluding portions of commitments that are subject to borrowing base availability or covenant compliance conditions that currently prevent draw; this understates the bank's reported unfunded commitment balance because most of the bank's commercial revolving credits are subject to a borrowing base or covenant condition that, while temporarily limiting current draw capacity, represents a legally binding commitment that reverts to full availability when the condition is satisfied. OCC Call Report instruction guidance and FFIEC reporting requirements require that revolving commitment balances be reported based on the legal commitment amount, not the currently available amount under conditions; the systematic underreporting of unfunded commitments distorts the bank's reported risk-based capital ratio for off-balance-sheet items.`,
    keywords: ['Call Report', 'FFIEC', 'OCC guidance', 'unfunded commitments', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4409',
    name: 'Commercial Banking Relationship Review Process Does Not Capture Full Relationship Profitability',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's annual commercial relationship review process captures loan exposure, deposit balances, and treasury fee income for each commercial client, but does not include capital market fee revenue — interest rate swap income, FX forward fees, and bond underwriting credits — generated by the bank's affiliated capital markets team for the same client relationship, causing total relationship profitability to be understated for clients with significant capital markets activity. OCC commercial banking management reporting and performance measurement guidance expects that relationship profitability reporting reflect the full economics of a client relationship for effective resource allocation and retention prioritization; when relationship managers advocate for pricing accommodations to retain clients on the basis of incomplete relationship profitability data, the bank makes suboptimal retention decisions that can either over-invest in retaining unprofitable relationships or under-invest in retaining highly profitable capital-markets-active clients.`,
    keywords: ['relationship profitability', 'OCC guidance', 'commercial banking', 'capital markets', 'CRM'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4410',
    name: 'Commercial Client Transition Plan Not Executed When Relationship Manager Departs',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital does not have a formal commercial banking relationship transition plan protocol that activates when a tenured relationship manager departs, leaving commercial clients without an assigned coverage officer for 4–8 weeks while HR and the commercial banking group head manage the replacement process through informal handoffs; during the transition gap, commercial clients with maturing credits, pending treasury service changes, or active deal conversations receive no proactive outreach from the bank, creating a vulnerability window during which competing banks successfully solicit and win the relationship. OCC commercial banking risk management guidance expects that banks maintain continuity of client coverage for material commercial relationships regardless of personnel changes; the systemic absence of a documented RM transition plan creates a recurring deposit and loan attrition pattern that the bank's commercial banking analytics team correlates with RM departure events.`,
    keywords: ['RM transition', 'OCC guidance', 'commercial banking', 'relationship management', 'client retention'],
    demoRelevant: false,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4411',
    name: 'Middle-Market Credit Approval Delegation Authority Not Updated for Current Risk Profile',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial banking credit approval delegation authority matrix authorizes regional commercial banking directors to approve credits up to $15M without escalation to the credit committee, based on a delegation framework established in 2019 when the bank's commercial loan portfolio was smaller and the consent order's model risk findings had not yet established heightened credit governance expectations. OCC consent order remediation requirements and the bank's own credit risk governance framework require that approval delegation authority be calibrated to current portfolio risk, concentrations, and supervisory expectations; when OCC examiners review a sample of regional director-approved commercial credits and find that three approvals in the $12M–$15M range contain policy exceptions that should have been escalated to the credit committee under the consent order's enhanced governance provisions, the finding is incorporated into the consent order remediation tracking as a credit governance deficiency.`,
    keywords: ['credit approval delegation', 'OCC guidance', 'consent order', 'commercial credit', 'credit policy'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4412',
    name: 'Commercial Banking Referral Arrangement With CPA Firms Not Reviewed for Fee-Splitting Rules',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      `First Capital's commercial banking business development program includes referral arrangements with regional CPA firms and business advisory consultancies, providing the referring parties with fee credits, marketing support, and co-sponsorship of client events in exchange for commercial loan and treasury management referrals; the referral arrangements have not been reviewed for compliance with the OCC's guidance on bank service referral arrangements and state banking law provisions that may restrict fee-splitting between banks and non-bank referral sources. OCC commercial banking conduct standards and applicable state banking statutes in First Capital's operating markets restrict the terms under which banks can compensate third parties for commercial banking referrals; when a state banking department examines the referral arrangements in the context of a broader commercial banking market conduct review, two referral agreements are found to include fee structures that constitute impermissible consideration under the applicable state statute.`,
    keywords: ['referral arrangement', 'OCC guidance', 'commercial banking', 'UDAP', 'fee splitting'],
    demoRelevant: false,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4413',
    name: 'Commercial Banking Concentration Report Does Not Distinguish Committed From Funded Exposure',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's commercial banking industry concentration report — prepared monthly and distributed to the credit committee and board — reports exposure by industry sector using funded balance sheet exposures only, excluding the unfunded commitment portion of revolving credit facilities and letters of credit; this causes the healthcare sector concentration to appear at 18% of total commercial credit when the correct measure — funded plus unfunded commitment exposure — is 29%, well above the bank's 25% internal sector concentration policy limit. OCC credit concentration risk examination guidance requires that industry concentration limits and reporting reflect total committed exposure, not only the funded portion; the discrepancy between the reported and actual healthcare sector concentration is identified by OCC examiners who recalculate the concentration metric using the full commitment data from the bank's loan system, generating a credit governance finding under the consent order.`,
    keywords: ['concentration report', 'OCC guidance', 'commercial credit', 'unfunded commitments', 'sector limit'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4414',
    name: 'Commercial Banking Digital Onboarding Tool Does Not Collect NAICS Code for Section 1071 Compliance',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      `First Capital's commercial banking digital onboarding platform for new small business credit applications — introduced in 2023 to accelerate the sub-$1M commercial loan origination experience — does not include a NAICS code collection field, collecting instead a free-text business type description that cannot be systematically mapped to NAICS classifications required for CFPB Section 1071 small business lending data reporting. CFPB Section 1071 final rule data fields require that covered financial institutions collect and report the applicant's NAICS code as one of the mandatory data points for each covered small business credit application; the digital onboarding tool's omission of the NAICS field means that every application processed through the platform generates an incomplete 1071 record, requiring a retroactive data enrichment exercise estimated at 1,800 records before the bank's first 1071 submission deadline.`,
    keywords: ['CFPB 1071', 'NAICS code', 'OCC guidance', 'commercial onboarding', 'small business lending'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4415',
    name: 'Commercial Loan Portfolio Vintage Analysis Not Produced for OCC Examination — Credit Cycle Risk Hidden',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's commercial credit reporting package includes current-period metrics — outstanding balances, criticized asset ratios, and loss rates — but does not produce a vintage analysis that tracks the loss performance of commercial loan cohorts by origination year and credit grade, making it impossible to determine whether loans originated during the 2020–2022 pandemic-era stimulus period are performing at materially different loss rates than pre-pandemic vintages. OCC credit risk examination guidance and supervisory expectations for commercial portfolio analytics require that banks be able to present vintage performance data to examiners to demonstrate that current loss assumptions reflect the full credit cycle experience of the portfolio; when OCC examiners request a vintage analysis and the bank cannot produce one without a multi-week data extraction effort, the inability to respond to the examiner request generates a credit information deficiency finding that delays the examination timeline.`,
    keywords: ['vintage analysis', 'OCC credit guidance', 'commercial credit', 'CECL', 'credit cycle'],
    demoRelevant: true,
    subTopic: 'relationship-banking',
  },
  {
    code: 'B4416',
    name: 'AI Commercial Pipeline Forecasting Tool Not Validated — Revenue Projections Used in Board Budget',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's commercial banking group uses an AI ML model to forecast commercial loan and deposit pipeline conversion rates and project quarterly revenue from pipeline credits, with the AI pipeline forecast incorporated directly into the bank's board-level financial plan and earnings guidance; the AI pipeline model was built by the commercial analytics team using CRM opportunity data and has not been validated by the model risk function under SR 11-7, and its forecasting accuracy has not been back-tested against actual conversion outcomes. SR 11-7 and OCC model risk governance guidance require that models used in board-level financial planning be in the validated model inventory with documented accuracy metrics; when the AI pipeline model systematically overestimates commercial loan conversion rates during a period of credit market tightening — because the model was trained on a 2019–2022 closing rate dataset that reflects accommodative credit conditions — the bank's commercial loan growth falls 22% below board-approved projections, triggering a capital planning revision.`,
    keywords: ['AI pipeline forecast', 'SR 11-7', 'OCC guidance', 'commercial banking', 'board reporting'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4417',
    name: 'Commercial Banking AI Vendor Due Diligence Does Not Include SR 11-7 Model Scope Questionnaire',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's commercial banking technology procurement team evaluates AI-powered commercial banking platforms — loan origination tools, treasury analytics, and relationship scoring systems — through a standard vendor due diligence process that assesses security, financial stability, and business continuity but does not include a model risk questionnaire that identifies the AI components, their training data sources, validation history, and performance monitoring processes. OCC Bulletin 2023-17 on third-party risk management and SR 11-7 guidance on third-party model risk require that banks' vendor due diligence processes for AI-enabled platforms include a structured assessment of the AI model components against the bank's model risk governance standards before contract execution; without a model risk component in procurement due diligence, the bank contracts for AI-powered commercial banking services without establishing whether the vendor's models are suitable for use in credit-relevant decisions at a bank operating under an MRM consent order.`,
    keywords: ['AI vendor due diligence', 'SR 11-7', 'OCC Bulletin 2023-17', 'TPRM', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4418',
    name: 'AI Commercial Loan Servicing Bot Provides Incorrect Payoff Quote — Interest Accrual Error',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital deploys an AI servicing chatbot for its commercial loan clients that provides loan account information — current balance, next payment date, accrued interest, and payoff quote estimates — by querying the loan servicing system's API; the chatbot's payoff quote calculation does not correctly account for per diem interest accrual on floating-rate commercial loans when the quote date falls after the loan's monthly interest reset date, generating payoff estimates that are understated by 5–12 days of accrued interest. OCC commercial banking servicing standards and UCC Article 9 payoff quote accuracy requirements create bank liability for payoff quote errors that cause payoff shortfalls; when a commercial borrower refinances to a competing bank based on the AI chatbot's payoff quote and the actual payoff amount is $28K higher than the quoted figure — causing the borrower to require additional wire instructions and closing delays — the bank absorbs the accrued interest shortfall and faces a client complaint that the AI-provided payoff quote was inaccurate.`,
    keywords: ['AI servicing chatbot', 'OCC guidance', 'UDAP', 'payoff quote', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4419',
    name: 'AI Commercial Banking Governance Framework Not Integrated With Consent Order MRM Remediation Plan',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital has an active OCC consent order requiring remediation of model risk management governance deficiencies, with a defined remediation plan and milestone schedule; the bank's commercial banking group has deployed 14 AI tools across underwriting, treasury management, client servicing, and relationship management functions over the prior 18 months without integrating these deployments into the consent order's MRM remediation plan, resulting in a growing shadow AI fleet that is not covered by the remediation timeline, not assigned validation milestones, and not reported to the OCC through the consent order compliance reporting process. SR 11-7, OCC consent order enforcement guidance, and the bank's own consent order remediation obligations require that all new model deployments during the remediation period be disclosed to the OCC and incorporated into the remediation tracking framework; when the bank's compliance team prepares the quarterly consent order status report, the 14 unregistered commercial banking AI tools are identified as a material remediation gap that requires immediate disclosure to the OCC supervisory team and an expedited validation program.`,
    keywords: ['consent order', 'SR 11-7', 'AI governance', 'OCC guidance', 'MRM remediation'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
];
