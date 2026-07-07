// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Healthcare Provider patterns — Finance, Managed Care Contracting & Physician Enterprise
// AbarVa corpus — Domain 17: Healthcare Finance, Managed Care Contracting & Physician Enterprise Management
// Code range: H5100–H5399 (300 patterns)
// Run: npx tsx src/scripts/seed/seed-healthcare-dom17-finance-contracting.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface HealthcareFinancePatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const HEALTHCARE_FINANCE_PATTERNS: HealthcareFinancePatternSeed[] = [

  // ── Managed Care Contract Modelling Without Dedicated Tool ────────────────
  {
    code: 'H5100',
    name: 'Excel-Based Payer Contract Modelling Rate Error',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'Meridian Health\'s managed care contracts with Aetna, UnitedHealth, and BCBS are modelled in Excel without a dedicated contract modelling tool such as nThrive or Strata — analysts hand-build fee schedule crosswalks across 4,000+ CPT codes, and version-control failures produce rate assumption errors that persist into signed contract language; one 2% fee-schedule error on a $120M annual payer contract represents $2.4M in unrealised net revenue per contract year.',
    keywords: ['managed care contract', 'payer contract modelling', 'fee schedule', 'net revenue', 'Excel', 'nThrive'],
    demoRelevant: true,
  },
  {
    code: 'H5101',
    name: 'Contract Scenario Comparison Not Possible Before Negotiation Deadline',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'Without contract modelling software, the finance team cannot run side-by-side scenario comparisons across payer counter-proposals — negotiators accept payer terms without quantifying the net revenue impact of carve-out service lines, case-rate vs. fee-schedule hybrids, or stop-loss provisions; decisions made on incomplete financial models leave $3–8M per renewal cycle on the table.',
    keywords: ['managed care contract', 'contract modelling', 'payer negotiation', 'scenario analysis', 'net revenue', 'fee schedule'],
    demoRelevant: true,
  },
  {
    code: 'H5102',
    name: 'Payer Contract Rate Build Not Tied To Actual Cost Data',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      'Contract negotiators set minimum acceptable rate thresholds using Medicare benchmark multiples rather than service-line cost accounting data from Strata — contracts are signed at rates below fully-loaded cost for high-complexity procedural service lines; the cost-below-rate position is discovered only at annual operating plan review when service-line P&L is compiled, 12 months after contract execution.',
    keywords: ['managed care contract', 'cost accounting', 'payer rate', 'service line P&L', 'Strata', 'net revenue'],
    demoRelevant: true,
  },
  {
    code: 'H5103',
    name: 'Multi-Payer Contract Overlap Creating Billing Ambiguity',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Overlapping coverage provisions across three major commercial contracts — Aetna, UnitedHealth, BCBS — create coordination-of-benefits ambiguity for dual-eligible commercial members; billing teams apply incorrect primary/secondary sequencing, resulting in underpayments that are not identified until secondary payer denial analysis six months post-service.',
    keywords: ['managed care contract', 'coordination of benefits', 'payer mix', 'billing', 'underpayment', 'net revenue'],
  },
  {
    code: 'H5104',
    name: 'Case-Rate Contract Modelling Without Outlier Stop-Loss Calculation',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'Case-rate contracts for surgical episodes are modelled in Excel without actuarial stop-loss analysis — the finance team does not calculate the cost exposure from high-severity outlier cases above the case-rate ceiling; one contract year with above-average case mix index among bundled hip-replacement episodes produces a $4–7M unfavourable variance against modelled net revenue.',
    keywords: ['managed care contract', 'case rate', 'stop-loss', 'contract modelling', 'net revenue', 'case mix index'],
  },
  {
    code: 'H5105',
    name: 'DRG-to-Per-Diem Contract Conversion Modelling Error',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'When payers request conversion from DRG-based inpatient contracts to per-diem structures, Excel models fail to correctly weight per-diem rates against actual length-of-stay distributions by DRG — conversion produces per-diem rates that are financially disadvantageous for long-stay, high-complexity admissions; the error is worth $1.5–4M annually on mid-size inpatient payer contracts.',
    keywords: ['managed care contract', 'DRG', 'per diem', 'contract modelling', 'net revenue', 'payer negotiation'],
  },
  {
    code: 'H5106',
    name: 'Payer Contract Signed Without Physician Fee Schedule Attachment',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Hospital-based physician group fee schedules are negotiated separately from facility contracts, but managed care contracts are occasionally executed without attached and signed physician fee schedule exhibits — payers apply default Medicare rates to physician claims until the omission is discovered, producing six to eighteen months of physician underpayment that requires retroactive reconciliation.',
    keywords: ['managed care contract', 'physician fee schedule', 'payer contract', 'net revenue', 'physician enterprise', 'underpayment'],
  },
  {
    code: 'H5107',
    name: 'Value-Based Contract Metric Definitions Misaligned Across Payer Contracts',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Each of Meridian\'s three major commercial contracts defines quality metric denominators differently — readmission windows, attribution rules, and risk-adjustment methodologies differ between Aetna, UnitedHealth, and BCBS VBC addenda; clinical quality teams cannot track a single performance dashboard, and shared-savings calculations are disputed at each contract reconciliation cycle.',
    keywords: ['managed care contract', 'VBC shared savings', 'quality metrics', 'payer contract', 'risk adjustment', 'net revenue'],
    demoRelevant: true,
  },
  {
    code: 'H5108',
    name: 'Contract Modelling Not Updated After Utilisation Pattern Shift',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Managed care contract rate structures are modelled at signature using prior-year utilisation data — COVID-era volume shifts and post-pandemic procedure mix changes make the original models stale; no process exists to re-baseline contract financial projections mid-term, so the CFO presents net revenue forecasts built on outdated volume assumptions through the full contract term.',
    keywords: ['managed care contract', 'contract modelling', 'utilisation', 'net revenue', 'payer mix', 'FP&A'],
  },
  {
    code: 'H5109',
    name: 'Carve-Out Service Line Not Identified During Contract Negotiation',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'High-cost service lines — transplant, NICU level IV, CAR-T cell therapy — are inadvertently included in standard facility fee schedule terms rather than carved out for case-rate or cost-plus arrangements; the error is identified only when actual cost-per-case exceeds contracted rates, and renegotiation must wait for the next contract renewal cycle.',
    keywords: ['managed care contract', 'carve-out', 'service line', 'fee schedule', 'net revenue', 'payer negotiation'],
  },

  // ── Net Revenue Estimation Failures ──────────────────────────────────────
  {
    code: 'H5110',
    name: 'Contractual Adjustment Methodology Producing Gross-to-Net Estimation Error',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Net revenue recognition requires accurate contractual adjustment accruals for each payer — Meridian\'s finance team uses prior-period contractual adjustment percentages applied to current gross charges without adjusting for contract rate changes, payer mix shifts, or procedure mix evolution; the methodology produces a 3–5% net revenue estimation variance that requires material restatement at year-end audit.',
    keywords: ['net revenue', 'contractual adjustment', 'gross-to-net', 'revenue recognition', 'payer mix', 'FP&A'],
    demoRelevant: true,
  },
  {
    code: 'H5111',
    name: 'Payer-Specific Contractual Adjustment Rate Not Maintained In Revenue System',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Epic Resolute hospital billing maintains contractual adjustment rates by payer class but not by individual contract — when Aetna and BCBS contracts have different rates for the same CPT codes, the system applies a blended payer-class average; gross-to-net estimation errors accumulate until contract-level rate tables are entered, typically months after contract effective date.',
    keywords: ['net revenue', 'contractual adjustment', 'Epic Resolute', 'payer contract', 'revenue recognition', 'billing'],
  },
  {
    code: 'H5112',
    name: 'Medicare Rate Change Impact Not Modelled In Net Revenue Budget',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'CMS Medicare Physician Fee Schedule and OPPS updates effective January 1 each year change relative value unit weights and conversion factors — FP&A teams build annual net revenue budgets without modelling the volume-weighted Medicare rate change impact by service line; the budget-to-actual variance from unmodelled Medicare rate changes reaches $2–6M at large academic medical centres.',
    keywords: ['net revenue', 'Medicare', 'fee schedule', 'FP&A', 'CMS', 'budget variance'],
  },
  {
    code: 'H5113',
    name: 'Bad Debt Reclassification Distorting Net Revenue Trend Analysis',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Accounts written off as bad debt are periodically reclassified to charity care for 340B and community benefit reporting — reclassification entries are posted without corresponding net revenue adjustments, creating distortions in the rolling 12-month net revenue trend that mislead CFO decision-making on payer mix strategy and collection performance.',
    keywords: ['net revenue', 'bad debt', 'charity care', 'revenue recognition', '340B', 'FP&A'],
  },
  {
    code: 'H5114',
    name: 'Gross Charge Master Not Updated After New Service Lines Open',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'New procedural service lines — robotics surgery, interventional radiology suites, hybrid OR — generate charges under placeholder charge codes not yet mapped to contract fee schedule crosswalks; net revenue estimation for new service lines defaults to zero contractual adjustment, overstating net revenue until charge master maintenance catches up, typically 60–90 days post-service-line launch.',
    keywords: ['net revenue', 'charge master', 'fee schedule', 'contractual adjustment', 'service line', 'revenue cycle'],
  },
  {
    code: 'H5115',
    name: 'Observation vs. Inpatient Status Revenue Recognition Inconsistency',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Patients placed in observation status generate Part B outpatient revenue while clinically similar patients admitted as inpatients generate Part A DRG revenue — status assignment inconsistencies create net revenue recognition errors; CMS Recovery Audit Contractor reviews find improper inpatient admission status, requiring repayment of DRG payments and retroactive outpatient billing.',
    keywords: ['net revenue', 'observation status', 'inpatient status', 'Medicare', 'DRG', 'RAC audit'],
    demoRelevant: true,
  },
  {
    code: 'H5116',
    name: 'Disproportionate Share Hospital Payment Estimation Error',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'DSH (disproportionate share hospital) payments from Medicare and Medicaid depend on low-income patient fraction calculations — FP&A teams estimate DSH payments without access to current SSI eligibility data and Medicaid day fractions; DSH payment estimates deviate from actual settlements by $1–4M, requiring budget reforecasting when CMS issues final settlement notices.',
    keywords: ['net revenue', 'DSH', 'disproportionate share', 'Medicare', 'Medicaid', 'FP&A'],
  },
  {
    code: 'H5117',
    name: 'Supplemental Medicaid Revenue Not Captured In Net Revenue Model',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'State supplemental Medicaid programs — upper payment limit settlements, directed payment programs, SNCP waiver payments — provide revenue above standard Medicaid fee-for-service rates; these supplemental revenue streams are tracked outside the primary net revenue model and not included in service-line P&L, making Medicaid-heavy service lines appear unprofitable relative to their true net contribution.',
    keywords: ['net revenue', 'Medicaid', 'supplemental payment', 'UPL', 'service line P&L', 'FP&A'],
  },
  {
    code: 'H5118',
    name: 'Contractual Adjustment Accrual Not Reversed When Payer Overpays',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'When payers pay above contracted rates — due to system loading errors or contract configuration mismatches — contractual adjustment accruals are not reversed; overpayments sit in deferred revenue until payer recoups the balance, at which point the recovery creates a net revenue debit that is misclassified as a new underpayment rather than a reversal of prior over-accrual.',
    keywords: ['net revenue', 'contractual adjustment', 'overpayment', 'payer contract', 'revenue recognition', 'billing'],
  },
  {
    code: 'H5119',
    name: 'Net Revenue Per Adjusted Discharge Trend Misinterpreted Without Case Mix Normalisation',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'CFO reports track net revenue per adjusted discharge as a key productivity metric without normalising for case mix index changes — a rising case mix index from service-line expansion inflates net revenue per discharge; the metric overstates pricing improvement and masks deteriorating contract rates when CMI-adjusted net revenue per discharge is declining.',
    keywords: ['net revenue', 'case mix index', 'FP&A', 'adjusted discharge', 'payer mix', 'operating margin'],
  },

  // ── Payer Contract Auto-Renewal Without Renegotiation ────────────────────
  {
    code: 'H5120',
    name: 'Payer Contract Auto-Renewing Without Rate Escalation Capture',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      'Meridian\'s largest commercial contract — accounting for 28% of net revenue — contains an auto-renewal clause with a 90-day termination notice window; the contract renewed automatically for two consecutive terms without rate renegotiation because no calendar alert was set; Meridian lost an estimated $8–12M in achievable rate escalation over four contract years against an inflation backdrop of 5–7% annually.',
    keywords: ['managed care contract', 'payer contract', 'auto-renewal', 'rate negotiation', 'net revenue', 'contract management'],
    demoRelevant: true,
  },
  {
    code: 'H5121',
    name: 'Contract Expiry Tracking Spreadsheet Not Maintained',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'Without a dedicated contract management system like nThrive Contract Manager, contract expiry dates are tracked in a shared spreadsheet maintained by the managed care contracting team — spreadsheet ownership gaps during staff turnover result in missed termination windows; three secondary commercial contracts renewed at prior rates without negotiation in a single fiscal year.',
    keywords: ['managed care contract', 'contract management', 'auto-renewal', 'nThrive', 'payer contract', 'contract expiry'],
    demoRelevant: true,
  },
  {
    code: 'H5122',
    name: 'Letter-of-Agreement Rates Not Escalated After Expiry',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'One-year letter-of-agreement rate supplements attached to multi-year managed care contracts expire without triggering renegotiation — revenue cycle teams continue billing at LOA rates after expiry; payers revert to base contract rates, producing underpayments that are not detected until quarterly payment variance analysis reveals systematic shortfall.',
    keywords: ['managed care contract', 'letter of agreement', 'rate escalation', 'payer contract', 'underpayment', 'net revenue'],
  },
  {
    code: 'H5123',
    name: 'New Service Line Not Added to Existing Payer Contract Before Launch',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'New service lines — cardiac electrophysiology lab, proton therapy, behavioural health inpatient unit — open without amending existing payer contracts to include the new service categories; payers deny claims as non-covered services or apply default out-of-network rates until contract amendments are executed, typically four to eight months after service-line launch.',
    keywords: ['managed care contract', 'service line', 'payer contract', 'contract amendment', 'net revenue', 'coverage'],
  },
  {
    code: 'H5124',
    name: 'Termination Notice Window Missed After Payer Acquisition',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Payer consolidation events — insurer acquisitions or merger — trigger contract assignment provisions with 60-day termination windows that are not monitored by the managed care team; contracts automatically assign to the acquiring payer at prior rates, removing the leverage of a new-contract negotiation that the acquisition event would otherwise create.',
    keywords: ['managed care contract', 'payer acquisition', 'contract assignment', 'auto-renewal', 'payer negotiation', 'net revenue'],
  },
  {
    code: 'H5125',
    name: 'Rate Escalator Formula Not Applied By Payer Without Health System Challenge',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'Multi-year contracts with CPI-linked or fixed-percentage rate escalators depend on the payer correctly applying the escalator at each anniversary — payers routinely fail to apply escalators without challenge; Meridian\'s revenue cycle team does not systematically audit escalator application, and the shortfall per contract year averages 1.5–2.5% of the payer\'s contract revenue.',
    keywords: ['managed care contract', 'rate escalator', 'payer contract', 'net revenue', 'underpayment', 'contract management'],
    demoRelevant: true,
  },
  {
    code: 'H5126',
    name: 'Physician Network Adequacy Failure Weakening Contract Renegotiation Leverage',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Payers use network adequacy gaps — specialty physician shortages, geographic access deficiencies — as negotiating leverage to resist rate increases; Meridian\'s physician enterprise management team has not provided the managed care team with current network adequacy data demonstrating market indispensability, reducing negotiating leverage for rate escalation at contract renewal.',
    keywords: ['managed care contract', 'physician network', 'network adequacy', 'payer negotiation', 'physician enterprise', 'net revenue'],
  },
  {
    code: 'H5127',
    name: 'Evergreen Clause In Medicaid Managed Care Contract Locking Below-Cost Rates',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Medicaid managed care organisation contracts containing evergreen (automatic renewal) clauses renew at actuarially deficient rates as Medicaid managed care capitation rates lag healthcare cost inflation — no formal renegotiation cycle is established, and the managed care team accepts rolling renewals rather than demanding rate rebasing when CMS updates base Medicaid fee schedule rates.',
    keywords: ['managed care contract', 'Medicaid', 'evergreen clause', 'auto-renewal', 'net revenue', 'capitation'],
  },
  {
    code: 'H5128',
    name: 'Contract Database Not Linked To Claims Payment System For Rate Validation',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Contract rate tables maintained in the managed care contracting team\'s spreadsheets are not electronically linked to Epic Resolute or the claims payment system — payer payments cannot be auto-validated against contracted rates; payment variance analysis requires manual extraction and reconciliation, reducing the frequency and coverage of underpayment audits.',
    keywords: ['managed care contract', 'payer contract', 'underpayment', 'Epic Resolute', 'payment variance', 'contract management'],
  },
  {
    code: 'H5129',
    name: 'Payer Contract Renewal Negotiation Without Market Rate Benchmarking Data',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'Managed care contract renewals are negotiated without current market rate benchmarking data showing Meridian\'s relative rate position versus regional competitors — negotiators cannot substantiate rate increase requests with market comparables, weakening negotiating position; payer counter-proposals are accepted without independent verification of whether rates are above or below peer health systems.',
    keywords: ['managed care contract', 'rate benchmarking', 'payer negotiation', 'market rate', 'net revenue', 'contract management'],
    demoRelevant: true,
  },

  // ── Underpayment and Overpayment Identification Failures ─────────────────
  {
    code: 'H5130',
    name: 'Payer Payment Variance Not Systematically Audited Below Threshold Amount',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      'Revenue cycle teams set underpayment follow-up thresholds at $500–$1,000 per claim — underpayments below the threshold are written off without audit; systematic under-payment of $50–$200 per claim across tens of thousands of payer claims represents $2–5M in recoverable revenue annually that is invisible to the payment variance analysis process.',
    keywords: ['underpayment', 'payer payment variance', 'revenue cycle', 'net revenue', 'payment audit', 'managed care contract'],
    demoRelevant: true,
  },
  {
    code: 'H5131',
    name: 'Experian Contract Analytics Not Deployed For Automated Underpayment Detection',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'Meridian has not deployed Experian Health Contract Analytics for automated payment-to-contract comparison — manual payment variance review covers only 15–20% of claims volume; systematic payer underpayments from contract loading errors, fee schedule mismatches, and pricing engine bugs remain undetected until manual sampling happens to catch a specific pattern.',
    keywords: ['underpayment', 'Experian Health', 'contract analytics', 'payer payment variance', 'revenue cycle', 'net revenue'],
    demoRelevant: true,
  },
  {
    code: 'H5132',
    name: 'Payer Bundled Payment Adjudication Error Not Detected Until Annual Reconciliation',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Bundled payment contracts with episode-based reimbursement are adjudicated by payer systems that misallocate component claims across episodes — over-adjudicated episodes result in overpayments that payers recoup at annual reconciliation without prior notice; under-adjudicated episodes represent underpayments discovered only when Meridian audits episode attribution post-reconciliation.',
    keywords: ['underpayment', 'bundled payment', 'payer contract', 'episode payment', 'net revenue', 'reconciliation'],
  },
  {
    code: 'H5133',
    name: 'Medicare Advantage Overpayment Recoupment Without Advance Notice',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Medicare Advantage plans execute post-payment audits and recoup overpayments by offsetting future claims payments without providing itemised remittance advice — revenue cycle teams cannot identify which specific claims are being recouped; cash flow disruption and unreconciled AR balances persist for 60–90 days until CMS recoupment documentation is obtained.',
    keywords: ['underpayment', 'Medicare Advantage', 'overpayment', 'recoupment', 'revenue cycle', 'net revenue'],
  },
  {
    code: 'H5134',
    name: 'Coordination of Benefits Overpayment Not Refunded Within Timely Filing Window',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Coordination of benefits overpayments identified when a secondary payer pays after the primary — resulting in total payment above allowed amount — are not refunded within payer-required timely refund windows; delayed refunds trigger payer offset from future payments, creating AR reconciliation complexity and potential compliance liability under federal overpayment rules.',
    keywords: ['overpayment', 'coordination of benefits', 'net revenue', 'revenue cycle', 'compliance', 'payer contract'],
  },
  {
    code: 'H5135',
    name: 'Payer Contract Loading Error Producing Systematic Underpayment For 90-Day Period',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      'Renegotiated fee schedule rates loaded incorrectly into payer adjudication systems at contract effective date — Meridian bills at new rates but payer adjudicates at prior rates, producing systematic underpayment for 60–90 days before the error is identified; recovery requires formal dispute, corrected remittance, and reprocessing of several thousand claims; recoverable amount is $800K–$2.5M per contract loading error event.',
    keywords: ['underpayment', 'payer contract', 'fee schedule', 'contract loading', 'net revenue', 'payment variance'],
    demoRelevant: true,
  },
  {
    code: 'H5136',
    name: 'Outlier Payment Threshold Calculation Methodology Dispute',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Case-rate and DRG contracts include outlier payment provisions for high-cost cases above a cost or charge threshold — payers apply outlier calculation methodologies that differ from the contract language; disputes over cost-to-charge ratios used in outlier calculations result in underpayment of $200K–$800K per payer per year, recoverable only through formal contract dispute resolution.',
    keywords: ['underpayment', 'outlier payment', 'cost-to-charge ratio', 'payer contract', 'DRG', 'net revenue'],
  },
  {
    code: 'H5137',
    name: 'Timely Filing Denial Rate Inflated By Internal Billing Lag',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Claims with timely filing denial codes represent 2–4% of total denial volume at Meridian — root cause analysis finds that late charge capture from clinical departments (pathology, radiology, ancillary services) routinely generates claims beyond payer timely filing windows; timely filing denials represent net revenue written off without contractual basis for recovery.',
    keywords: ['net revenue', 'timely filing denial', 'revenue cycle', 'charge capture', 'billing', 'denial management'],
  },
  {
    code: 'H5138',
    name: 'Claim Underpayment Recovery Programme ROI Not Measured',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Meridian contracts a third-party underpayment recovery vendor but does not track recovered amounts against vendor contingency fees — recovery programme ROI is assumed to be positive but never validated; vendors cherry-pick large-dollar disputes, leaving systematic small-balance underpayment patterns unaddressed while consuming claims team capacity for dispute resolution.',
    keywords: ['underpayment', 'revenue cycle', 'net revenue', 'payer payment variance', 'recovery programme', 'managed care contract'],
  },
  {
    code: 'H5139',
    name: 'Zero-Pay Claim Not Appealed Within Payer Appeal Window',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Claims adjudicated at zero payment — denied as non-covered, duplicate, or not medically necessary — are not appealed within payer-specific appeal timelines; Meridian\'s denial management team prioritises high-dollar denials, and zero-pay claims below $1,000 are written off; the aggregate zero-pay write-off represents $3–7M annually for a mid-size academic medical centre.',
    keywords: ['underpayment', 'denial management', 'zero-pay claim', 'net revenue', 'revenue cycle', 'appeal'],
  },

  // ── Cost Accounting Methodology Design Failures ────────────────────────
  {
    code: 'H5140',
    name: 'Cost-to-Charge Ratio Methodology Overstating Low-Cost Service Line Costs',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'Meridian uses department-level cost-to-charge ratios for CMS cost reporting and internal service-line costing — departments with high-charge, low-cost services (laboratory, pharmacy) have compressed CCRs that distort allocated costs when applied to individual patient encounters; ambulatory surgery line costs are overstated by 15–25% relative to activity-based costing, masking true profitability.',
    keywords: ['cost accounting', 'cost-to-charge ratio', 'activity-based costing', 'service line P&L', 'CMS cost report', 'Strata'],
    demoRelevant: true,
  },
  {
    code: 'H5141',
    name: 'Strata Decision Technology Not Fully Implemented For Service-Line Costing',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Meridian licensed Strata Decision Technology for cost accounting but has implemented only departmental cost allocation modules without enabling the patient-level cost-per-encounter engine — service-line P&Ls are produced at departmental aggregate level rather than by patient encounter, preventing identification of high-cost patient cohorts and physician-level practice pattern cost variation.',
    keywords: ['cost accounting', 'Strata', 'service line P&L', 'activity-based costing', 'patient-level costing', 'operating margin'],
    demoRelevant: true,
  },
  {
    code: 'H5142',
    name: 'Indirect Cost Allocation Pool Not Updated For Facility Expansion',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Indirect cost allocation pools — administration, facilities, IT, finance — are calibrated annually but not adjusted for mid-year facility expansions or service-line additions; new cost centres absorb incorrect overhead burden, distorting contribution margin calculations and misrepresenting the financial performance of newly launched service lines to clinical leadership.',
    keywords: ['cost accounting', 'indirect cost', 'cost allocation', 'service line P&L', 'operating margin', 'FP&A'],
  },
  {
    code: 'H5143',
    name: 'Physician Practice Subsidy Embedded In Hospital Cost Pool Without Transparency',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Hospital cost pools include subsidies to hospital-based physician practice groups — professional service agreements, medical directorship payments, call coverage stipends — without identifying these as explicit physician enterprise subsidies; service-line P&L reports reflect artificially inflated costs that obscure true hospital operational margins and physician compensation subsidy levels.',
    keywords: ['cost accounting', 'physician enterprise', 'physician subsidy', 'service line P&L', 'operating margin', 'professional service agreement'],
  },
  {
    code: 'H5144',
    name: 'Medicare Cost Report Cost-to-Charge Ratio Producing Incorrect Outlier Trigger',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Inaccurate departmental cost-to-charge ratios on the Medicare cost report alter the cost threshold for outlier payment eligibility — CCRs that are too high make high-cost inpatient cases ineligible for outlier supplemental payments that Meridian is entitled to receive; missed outlier payments from CCR errors amount to $500K–$2M annually depending on case mix.',
    keywords: ['cost accounting', 'cost-to-charge ratio', 'CMS cost report', 'Medicare', 'outlier payment', 'net revenue'],
  },
  {
    code: 'H5145',
    name: 'Activity-Based Costing Not Deployed For High-Cost Technology Procedures',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      'High-cost procedural services — robotic surgery, complex interventional procedures, CAR-T cell therapy — require activity-based costing to accurately capture per-case resource consumption; CCR-based costing overstates or understates per-case costs by 20–40%, making it impossible for the CFO to determine whether new technology investments are contributing positively to operating margin.',
    keywords: ['cost accounting', 'activity-based costing', 'service line P&L', 'operating margin', 'Strata', 'technology investment'],
  },
  {
    code: 'H5146',
    name: 'Clinical Labor Cost Not Allocated To Service Line From HRIS Timekeeping',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Nursing and clinical staff timekeeping data in Workday HR is not integrated with Strata service-line costing — labor cost allocation uses budgeted FTE ratios rather than actual hours worked by patient care unit; during census fluctuations, actual labor cost deviates significantly from allocated labor cost, producing inaccurate service-line contribution margins.',
    keywords: ['cost accounting', 'clinical labor', 'service line P&L', 'Workday', 'Strata', 'operating margin'],
  },
  {
    code: 'H5147',
    name: 'Implant and High-Cost Supply Cost Not Captured At Patient Level',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'High-cost implants and biologics — joint replacement implants, cardiac stents, infusion biologics — are billed through supply chain charge capture but not reconciled to patient-level cost accounting records in Strata; implant cost variances between contracted prices and actual utilisation are allocated to departmental supply pools rather than individual patient encounters, masking per-procedure cost drivers.',
    keywords: ['cost accounting', 'implant cost', 'supply chain', 'patient-level costing', 'service line P&L', 'Strata'],
  },
  {
    code: 'H5148',
    name: 'Pharmacy Cost-to-Charge Ratio Masking 340B Programme Savings',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Pharmacy department CCRs blend 340B acquisition cost drugs with non-340B drugs at standard WAC prices — the blended CCR understates 340B programme savings in service-line cost accounting; clinical leadership cannot distinguish the true pharmaceutical cost of 340B-eligible encounters from non-340B encounters, obscuring the financial value of 340B programme optimisation opportunities.',
    keywords: ['cost accounting', 'cost-to-charge ratio', '340B', 'pharmacy', 'service line P&L', 'operating margin'],
    demoRelevant: true,
  },
  {
    code: 'H5149',
    name: 'Cost Accounting Refresh Cycle Too Infrequent For Margin Management Decisions',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Strata cost accounting data is refreshed quarterly rather than monthly — the 90-day data lag means clinical operations and finance leadership make margin management decisions based on stale cost information; intra-quarter cost shifts from supply price changes, census variation, or physician ordering pattern changes are invisible until the next quarterly refresh.',
    keywords: ['cost accounting', 'Strata', 'operating margin', 'service line P&L', 'FP&A', 'data refresh'],
  },

  // ── Physician Compensation Model Misalignment With VBC Metrics ───────────
  {
    code: 'H5150',
    name: 'Physician Compensation Model Rewarding Volume Without VBC Quality Link',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      'Meridian\'s physician compensation model pays base salary plus WRVU-based incentive without linking quality scores, readmission rates, or patient satisfaction to compensation; managed care VBC contracts pay shared savings based on quality performance, but physicians are not financially incentivised to improve the quality metrics driving shared savings — creating a structural misalignment between payer value-based payments and internal physician compensation.',
    keywords: ['physician compensation', 'WRVU', 'VBC shared savings', 'quality metrics', 'managed care contract', 'physician enterprise'],
    demoRelevant: true,
  },
  {
    code: 'H5151',
    name: 'Compensation Committee Not Reviewing VBC Metric Performance Against Comp Model',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'Physician compensation committee meetings review WRVU productivity against targets but do not include managed care VBC performance reporting — quality bonus payments from Aetna and UnitedHealth VBC contracts are not distributed to physicians whose care patterns drove the performance; physician-level accountability for population health cost and quality metrics is absent from compensation governance.',
    keywords: ['physician compensation', 'VBC shared savings', 'WRVU', 'compensation committee', 'physician enterprise', 'quality metrics'],
  },
  {
    code: 'H5152',
    name: 'Subspecialty Physician Compensation Misaligned With Hospital System Priorities',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Hospital-employed subspecialty physicians — cardiologists, oncologists, orthopaedic surgeons — receive WRVU-weighted compensation that incentivises procedural volume but not care coordination, appropriate utilisation, or population health management; as the payer mix shifts toward value-based contracts, the comp model perpetuates fee-for-service behaviour that increases total cost of care.',
    keywords: ['physician compensation', 'WRVU', 'subspecialty', 'physician enterprise', 'value-based care', 'operating margin'],
  },
  {
    code: 'H5153',
    name: 'Physician Compensation At Risk Of Anti-Kickback Statute Violation',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Physician compensation arrangements that exceed 75th percentile MGMA benchmarks without documented productivity justification carry Anti-Kickback Statute and Stark Law risk — Meridian\'s legal and compliance team has not conducted a fair market value review of all physician compensation arrangements within the past 24 months, leaving compensation structures that may not meet regulatory safe harbours.',
    keywords: ['physician compensation', 'MGMA', 'Stark Law', 'Anti-Kickback Statute', 'fair market value', 'physician enterprise'],
  },
  {
    code: 'H5154',
    name: 'Quality Bonus Pool Not Linked To Attribution-Level VBC Performance Data',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'Physician quality bonus pools are funded from system-level VBC shared savings receipts and allocated using system-wide quality metrics — physician-level attribution data from payer VBC reports is not used to allocate bonuses to individual physicians whose patient panels drove specific quality improvements; physicians gaming the system at the system level are rewarded equally with high-performers.',
    keywords: ['physician compensation', 'VBC shared savings', 'attribution', 'quality metrics', 'bonus pool', 'physician enterprise'],
  },
  {
    code: 'H5155',
    name: 'Employed Physician Compensation Subsidy Unsustainable As Payer Rates Lag Costs',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'Primary care physician employment models operate at $150K–$250K annual subsidy per physician as WRVU-based revenue does not cover compensation and overhead — as commercial payer rates auto-renew without escalation and Medicare rates face negative adjustments, the per-physician subsidy grows; the aggregate physician enterprise operating loss is not modelled against payer rate trajectory, masking the long-term financial sustainability risk.',
    keywords: ['physician compensation', 'physician enterprise', 'operating margin', 'payer rate', 'managed care contract', 'FP&A'],
    demoRelevant: true,
  },
  {
    code: 'H5156',
    name: 'Hospital Ownership Physician Compensation Model Not Updated Post-Acquisition',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Acquired physician practices are transitioned to the hospital employer\'s compensation model without reconciling the acquired physicians\' historical productivity levels with Meridian\'s standard WRVU targets — physicians from higher-compensation private practice models receive lower total compensation under the hospital model, driving turnover within 24 months of acquisition and requiring costly replacement recruitment.',
    keywords: ['physician compensation', 'physician enterprise', 'WRVU', 'physician acquisition', 'MGMA', 'physician retention'],
  },
  {
    code: 'H5157',
    name: 'Compensation Model Not Accounting For Telemedicine WRVU Differences',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Telemedicine visits generate lower average WRVU values than in-person encounters for the same patient panel — physicians whose practice mix shifted to telehealth post-COVID earn less total compensation under WRVU-based models despite equivalent patient encounter volumes; compensation inequity depresses physician satisfaction and creates resistance to telehealth programme adoption.',
    keywords: ['physician compensation', 'WRVU', 'telemedicine', 'physician enterprise', 'physician satisfaction', 'VBC'],
  },
  {
    code: 'H5158',
    name: 'Physician Compensation Governance Not Aligned With Kaufman Hall FP&A Projections',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Physician compensation decisions made by the compensation committee are not integrated with the Kaufman Hall financial planning model — mid-year compensation adjustments, new hire guarantees, and subspecialty recruitment packages are approved without modelling their impact on the five-year operating margin projection; aggregate physician enterprise costs exceed budget by $5–12M annually when unmodelled commitments are compounded.',
    keywords: ['physician compensation', 'FP&A', 'Kaufman Hall', 'physician enterprise', 'operating margin', 'financial planning'],
  },
  {
    code: 'H5159',
    name: 'On-Call Stipend Payments Not Benchmarked Against MGMA Fair Market Value',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Hospital call coverage stipends for emergency department, trauma, and neurosurgery coverage are set through physician negotiation without reference to MGMA call coverage benchmarks — stipends for specialty call coverage range from 50% below to 80% above MGMA fair market value; extreme outliers create compliance risk and inequity that drive retention issues among underpaid specialties.',
    keywords: ['physician compensation', 'on-call stipend', 'MGMA', 'fair market value', 'physician enterprise', 'Stark Law'],
  },

  // ── WRVU Target Setting Inaccuracies ─────────────────────────────────────
  {
    code: 'H5160',
    name: 'WRVU Targets Set Without Specialty-Specific Panel Size Modelling',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      'Annual WRVU targets are derived from prior-year WRVU actuals without modelling the relationship between panel size, access availability, and achievable WRVU per physician FTE — physicians with under-managed panels produce below-target WRVUs not from productivity issues but from scheduling and access constraints; compensation managers incorrectly attribute target misses to physician effort rather than systemic access gaps.',
    keywords: ['WRVU', 'physician compensation', 'panel size', 'physician productivity', 'MGMA', 'physician enterprise'],
    demoRelevant: true,
  },
  {
    code: 'H5161',
    name: '2024 CPT Code WRVU Revaluation Not Applied To Compensation Targets',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'CMS periodically revalues CPT codes, increasing or decreasing assigned WRVU values — primary care E&M code WRVU revaluations in 2021 significantly increased the WRVU value of office visits; Meridian\'s compensation model did not recalibrate WRVU targets following the revaluation, resulting in primary care physicians exceeding targets without a true productivity increase and earning unintended incentive compensation.',
    keywords: ['WRVU', 'CPT code', 'physician compensation', 'CMS', 'MGMA', 'physician productivity'],
  },
  {
    code: 'H5162',
    name: 'WRVU Target Not Adjusted For Physician Administrative Time Allocation',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'Physicians with significant administrative roles — medical director, department chair, quality officer — have WRVU targets set at full clinical FTE levels without reducing targets for administrative time; physicians cannot achieve both administrative commitments and full clinical WRVU targets, creating chronic target shortfalls that depress physician morale and generate compensation disputes.',
    keywords: ['WRVU', 'physician compensation', 'administrative time', 'physician enterprise', 'physician productivity', 'MGMA'],
  },
  {
    code: 'H5163',
    name: 'New Physician WRVU Guarantee Period Extending Beyond Reasonable Ramp Time',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'New physician employment contracts include guaranteed compensation for 12–18 months while the physician builds a patient panel — guarantee extensions granted beyond standard ramp periods are not tracked against panel growth metrics; physicians with stalled panel growth receive extended guarantees without management intervention, creating physician enterprise operating losses that compound over multiple guarantee extension cycles.',
    keywords: ['WRVU', 'physician compensation', 'physician recruitment', 'guarantee period', 'physician enterprise', 'operating margin'],
  },
  {
    code: 'H5164',
    name: 'MGMA WRVU Benchmarks Applied Without Regional Cost-Of-Living Adjustment',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'National MGMA WRVU productivity benchmarks are applied directly to set compensation targets without adjusting for regional labour market differences — physicians in high-cost urban markets have higher base salary requirements, making the MGMA 50th percentile WRVU target economically inadequate to attract qualified candidates; recruitment failures are attributed to compensation budget constraints rather than benchmark misapplication.',
    keywords: ['WRVU', 'MGMA', 'physician compensation', 'benchmarking', 'physician recruitment', 'physician enterprise'],
  },
  {
    code: 'H5165',
    name: 'WRVU Production Shortfall Not Investigated For Access Or Scheduling Root Cause',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'Physician WRVU shortfalls trigger compensation clawback or incentive forfeit under the compensation plan — the root cause investigation process does not systematically examine scheduling panel access, referral pattern changes, or payer authorisation denial rates as production drivers; legitimate productivity constraints are misclassified as physician performance issues, damaging the physician-employer relationship.',
    keywords: ['WRVU', 'physician productivity', 'physician compensation', 'scheduling', 'physician enterprise', 'MGMA'],
  },
  {
    code: 'H5166',
    name: 'Surgeon WRVU Inflation From Documentation Coaching Not Quality-Controlled',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Surgical WRVU optimisation programmes trained by coding and documentation specialists increase WRVU capture from appropriate code selection — some physicians apply upcoding practices that do not accurately reflect actual procedure complexity; inflated WRVU values increase compensation costs without a corresponding increase in clinical value delivered, and create false productivity benchmarking data.',
    keywords: ['WRVU', 'physician compensation', 'documentation', 'upcoding', 'physician productivity', 'compliance'],
  },
  {
    code: 'H5167',
    name: 'Hospital-Based Specialist WRVU Not Capturing All Billable Encounters',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Hospital-based physicians — hospitalists, intensivists, emergency medicine — have billable encounter WRVU potential that is not fully captured due to documentation gaps, late charge entry, and failure to bill consultation codes during inpatient stays; average WRVU capture rates for hospital-based specialties are 10–15% below potential, representing $500K–$1.5M in annual net revenue per 10-physician group.',
    keywords: ['WRVU', 'physician productivity', 'charge capture', 'net revenue', 'physician enterprise', 'hospitalist'],
  },
  {
    code: 'H5168',
    name: 'Provider-Based Billing WRVU Split Not Aligned With Physician Employment Agreement',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Provider-based outpatient departments generate both facility and professional fee revenue — the professional component WRVU attribution to individual physicians is not tracked in the physician compensation model; physicians working in provider-based departments are compensated on a WRVU basis that does not reflect the additional facility revenue their practice generates for the health system.',
    keywords: ['WRVU', 'provider-based billing', 'physician compensation', 'professional fee', 'net revenue', 'physician enterprise'],
  },
  {
    code: 'H5169',
    name: 'Locum Tenens WRVU Not Excluded From Employed Physician Productivity Reports',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'When locum tenens physicians cover vacancies, WRVUs generated under employed physician NPIs are credited to the employed physician\'s productivity record — the inflation distorts physician productivity benchmarking and creates incorrect compensation incentive calculations; the error is discovered only during annual compensation reconciliation when locum staffing reports are cross-referenced against WRVU records.',
    keywords: ['WRVU', 'locum tenens', 'physician productivity', 'physician compensation', 'AMN Healthcare', 'physician enterprise'],
  },

  // ── Managed Care Rate Benchmarking ────────────────────────────────────────
  {
    code: 'H5170',
    name: 'No External Payer Rate Benchmarking Data Purchased For Contract Negotiations',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description:
      'Meridian\'s managed care contracting team negotiates payer rates without access to commercial rate benchmarking databases — without knowing whether Meridian\'s rates are at the 25th or 75th percentile relative to regional peer hospitals, negotiators cannot substantiate rate increase requests or resist payer pressure to accept below-market rates; estimated revenue impact of rate position uncertainty is $10–25M annually on the commercial contract book.',
    keywords: ['managed care contract', 'rate benchmarking', 'payer rate', 'payer negotiation', 'net revenue', 'market rate'],
    demoRelevant: true,
  },
  {
    code: 'H5171',
    name: 'Payer Rate Position Analysis Not Stratified By Service Line',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'When external rate benchmarking is conducted, it produces blended facility fee rate comparisons across all service lines — Meridian cannot identify which specific service lines (cardiovascular, oncology, orthopaedics) are priced below market versus above market; rate renegotiation strategy cannot be service-line targeted, missing opportunities to restore rates selectively where the gap is largest.',
    keywords: ['managed care contract', 'rate benchmarking', 'service line', 'payer rate', 'payer negotiation', 'net revenue'],
  },
  {
    code: 'H5172',
    name: 'Competitor Payer Rate Intelligence Not Gathered During Contract Cycle',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'The managed care contracting team has no systematic process for gathering intelligence on competitor health system payer rate levels — rates obtained through informal market contacts and physician recruitment intelligence are anecdotal; payer negotiators exploit the information asymmetry, claiming that competitor rates are lower than Meridian\'s when the reverse may be true.',
    keywords: ['managed care contract', 'rate benchmarking', 'competitive intelligence', 'payer rate', 'payer negotiation', 'market rate'],
  },
  {
    code: 'H5173',
    name: 'Medicare Rate Multiple Used As Proxy For Market Rate Without Validation',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Managed care contracts expressed as a percentage of Medicare fee schedule are benchmarked against national Medicare multiple averages — local market Medicare multiples can vary significantly from national averages; using national benchmarks as a proxy overstates or understates the market rate, leading to incorrect assessment of Meridian\'s rate position relative to regional competitors.',
    keywords: ['managed care contract', 'rate benchmarking', 'Medicare', 'payer rate', 'market rate', 'net revenue'],
  },
  {
    code: 'H5174',
    name: 'Employer Direct Contract Rate Intelligence Not Used In Commercial Payer Strategy',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Meridian is approached by large self-insured employers for direct contracting at rates above commercial insurance rates — direct contract rate data is not shared with the managed care team to benchmark and improve commercial payer negotiations; the value of employer willingness to pay above commercial rates is not leveraged in payer contract renegotiation as evidence of Meridian\'s market rate position.',
    keywords: ['managed care contract', 'rate benchmarking', 'direct contracting', 'employer', 'payer rate', 'net revenue'],
  },
  {
    code: 'H5175',
    name: 'Market Share Analysis Not Incorporated Into Rate Negotiation Position',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'Meridian\'s market share in certain specialties — cardiac surgery, neurosurgery, cancer care — gives it significant negotiating leverage with payers who need network access to these services; market share data is maintained by the strategy department but not shared with the managed care team at contract negotiation time, preventing leverage-based rate positioning arguments.',
    keywords: ['managed care contract', 'market share', 'payer negotiation', 'rate benchmarking', 'net revenue', 'payer rate'],
  },
  {
    code: 'H5176',
    name: 'Out-Of-Network Rate Accepted Without Benchmarking Against In-Network Potential',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      'For secondary and tertiary payers representing 2–5% of payer mix, Meridian accepts out-of-network payment at billed charges percentage rather than evaluating whether in-network contracting at a negotiated rate would produce higher or lower net revenue; for some out-of-network payers, the effective payment rate exceeds what a negotiated contract would deliver.',
    keywords: ['managed care contract', 'out-of-network', 'rate benchmarking', 'payer rate', 'net revenue', 'payer mix'],
  },
  {
    code: 'H5177',
    name: 'Price Transparency CMS Disclosure Not Used To Benchmark Own Rates',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'CMS hospital price transparency requirements mandate public posting of all payer-negotiated rates — competitors post rates that can be used for market benchmarking; Meridian\'s managed care team has not systematically analysed competitor machine-readable rate files to benchmark Meridian\'s rates relative to market, missing a free data source for rate position analysis.',
    keywords: ['managed care contract', 'rate benchmarking', 'CMS price transparency', 'payer rate', 'market rate', 'net revenue'],
  },
  {
    code: 'H5178',
    name: 'Rate Benchmarking Data Not Granular Enough For Ancillary Service Lines',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Available rate benchmarking databases provide comparison data for major inpatient DRGs and high-volume outpatient CPT codes but lack granularity for ancillary service lines — laboratory, imaging, rehabilitation, and pharmacy rates cannot be benchmarked; ancillary service line rates may be systematically below market without detection, representing 15–25% of total net revenue.',
    keywords: ['managed care contract', 'rate benchmarking', 'ancillary services', 'payer rate', 'net revenue', 'service line P&L'],
  },
  {
    code: 'H5179',
    name: 'Managed Care Rate Benchmarking Not Adjusted For Quality Designation Premium',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Meridian holds Joint Commission accreditation, Blue Distinction Centre designations, and CMS five-star ratings that justify a quality premium in payer rates — rate benchmarking analyses compare Meridian rates to all-hospital averages rather than quality-matched peers; rate improvement requests are not supported with quality premium arguments, leaving achievable rate premiums uncaptured.',
    keywords: ['managed care contract', 'rate benchmarking', 'quality designation', 'payer rate', 'net revenue', 'Joint Commission'],
  },

  // ── CMS Medicare Cost Report Accuracy ─────────────────────────────────────
  {
    code: 'H5180',
    name: 'Medicare Cost Report Filed With Material CCR Errors',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Meridian\'s Medicare cost report (Form CMS-2552) contains departmental cost-to-charge ratio errors from incorrect cost allocation and charge master mapping — material CCR errors affect outlier payment calculations, DSH payment fractions, and Medicare bad debt reimbursement; FI settlement findings require cost report amendments with repayment demands or additional payments that were not anticipated in the net revenue budget.',
    keywords: ['CMS cost report', 'cost-to-charge ratio', 'Medicare', 'DSH', 'cost accounting', 'net revenue'],
    demoRelevant: true,
  },
  {
    code: 'H5181',
    name: 'Graduate Medical Education Cost Report Not Maximising IME and Direct GME Payments',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'Indirect Medical Education (IME) and Direct Graduate Medical Education cost report worksheets are completed by staff without dedicated GME cost report expertise — calculation errors in resident FTE counts, rotational cost sharing with affiliated teaching sites, and program cost attribution reduce IME and Direct GME payments below achievable levels; GME payment optimisation opportunity typically represents $1–4M annually at academic medical centres.',
    keywords: ['CMS cost report', 'GME', 'IME', 'graduate medical education', 'Medicare', 'net revenue'],
    demoRelevant: true,
  },
  {
    code: 'H5182',
    name: 'Medicare Bad Debt Cost Report Claim Not Filed Or Under-Filed',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Medicare bad debt reimbursement requires specific documentation of collection efforts and bad debt write-off timing on the cost report — incomplete documentation results in Medicare Part A bad debt reimbursement claims being disallowed at settlement; recoverable Medicare bad debt reimbursement at 65% of the allowable bad debt amount represents $500K–$2M annually at hospitals with significant Medicare volumes.',
    keywords: ['CMS cost report', 'bad debt', 'Medicare', 'net revenue', 'cost report settlement', 'bad debt reserve'],
  },
  {
    code: 'H5183',
    name: 'Cost Report Settlement Reserve Estimation Not Incorporating Open Years Risk',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'FP&A teams maintain a cost report settlement reserve for open Medicare cost report years — the reserve estimation methodology uses last-settled year adjustment amounts without modelling program-specific risks in open years such as new DSH fractions, GME slot changes, or bad debt methodology audits; settlement reserve inadequacy results in unplanned charges to net revenue when FI settlements are issued.',
    keywords: ['CMS cost report', 'settlement reserve', 'Medicare', 'FP&A', 'net revenue', 'cost accounting'],
  },
  {
    code: 'H5184',
    name: 'Provider-Based Department Cost Report Status Not Maintained After Acquisition',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Acquired physician practices designated as provider-based departments require specific cost report treatment and OPPS billing under CMS provider-based billing rules — cost report filings after acquisitions do not correctly include acquired provider-based departments, resulting in missed facility fee billing and cost report reimbursement for HOPD services that qualify for provider-based status.',
    keywords: ['CMS cost report', 'provider-based billing', 'Medicare', 'net revenue', 'OPPS', 'physician enterprise'],
  },
  {
    code: 'H5185',
    name: 'Uncompensated Care Cost Report Pool Calculation Not Maximising DSH Payment',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'The ACA uncompensated care DSH payment pool distribution is based on cost report data on Medicaid days and uncompensated care costs — cost report preparers do not include all qualifying uncompensated care costs and Medicaid day equivalents, understating Meridian\'s share of the DSH uncompensated care pool; lost DSH pool share is worth $1–3M annually at safety net hospitals with significant Medicaid and uninsured volume.',
    keywords: ['CMS cost report', 'DSH', 'uncompensated care', 'Medicaid', 'net revenue', 'cost accounting'],
  },
  {
    code: 'H5186',
    name: 'Swing Bed and SNF Cost Report Blended With Acute Care Without Carve-Out',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Critical access hospitals and hospitals with swing bed or SNF distinct-part units must file separate cost report schedules for post-acute services — cost report preparers blend acute care and post-acute costs without proper schedule separation; CMS settlement adjustments disallow blended costs that should have been carved into SNF or swing bed schedules, requiring cost report amendments.',
    keywords: ['CMS cost report', 'swing bed', 'SNF', 'Medicare', 'cost accounting', 'net revenue'],
  },
  {
    code: 'H5187',
    name: 'Joint Venture Cost Reporting Obligations Not Met',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Hospital joint ventures with physician groups for ambulatory surgery centres, imaging centres, or cancer centres create complex cost report obligations — joint venture investment income and depreciation must be correctly reported; cost report preparers omit JV-related entries or incorrectly include JV cost allocations, producing cost report errors that surface as audit findings during CMS settlement.',
    keywords: ['CMS cost report', 'joint venture', 'Medicare', 'cost accounting', 'ambulatory surgery', 'net revenue'],
  },
  {
    code: 'H5188',
    name: 'Capital Cost Report Depreciation Schedule Errors From Fixed Asset System Migration',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Workday Finance fixed asset module migrations cause depreciation schedule errors in Medicare cost report capital cost worksheets — asset cost basis, useful life, and accumulated depreciation figures populated from migrated fixed asset records contain errors; capital-related cost report worksheets with depreciation errors affect Medicare capital passthrough payments and overall cost report settlement amounts.',
    keywords: ['CMS cost report', 'depreciation', 'Medicare', 'Workday', 'fixed assets', 'cost accounting'],
  },
  {
    code: 'H5189',
    name: 'Cost Report Reopening Opportunity Not Pursued For Favourable Adjustment Claims',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'CMS allows cost report reopening requests within three years of settlement for errors favouring the provider — Meridian\'s cost reporting team does not systematically review settled cost reports for reopening opportunities; DSH payment fraction corrections, additional bad debt documentation, and GME FTE corrections that were missed in the original filing are not pursued, leaving recoverable payments on the table.',
    keywords: ['CMS cost report', 'Medicare', 'cost report reopening', 'DSH', 'GME', 'net revenue'],
  },

  // ── Capital Planning Process Failures ─────────────────────────────────────
  {
    code: 'H5190',
    name: 'Clinical Capital Requests Not Evaluated Against Service-Line Financial Return',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'The capital planning committee evaluates clinical capital requests based on clinical need narratives without financial return analysis tied to service-line P&L — capital decisions for major equipment (MRI, CT, surgical robots) are made without modelling incremental net revenue, contribution margin per procedure, and payback period; post-implementation reviews consistently find capital projects delivering below-projected financial returns.',
    keywords: ['capital planning', 'service line P&L', 'operating margin', 'FP&A', 'Kaufman Hall', 'net revenue'],
    demoRelevant: true,
  },
  {
    code: 'H5191',
    name: 'Strategic Capital Not Separated From Maintenance Capital In Annual Budget',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'Capital budget allocations blend maintenance/replacement capital with strategic growth capital in a single pool — strategic capital investments that should be evaluated against long-term financial return compete on equal footing with maintenance replacements; in constrained capital environments, strategic investments are deferred in favour of maintenance projects, slowing clinical program development.',
    keywords: ['capital planning', 'FP&A', 'operating margin', 'Kaufman Hall', 'strategic capital', 'maintenance capital'],
  },
  {
    code: 'H5192',
    name: 'Kaufman Hall Capital Model Not Updated For Interest Rate Environment Change',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Long-range financial plans in Kaufman Hall model capital projects using discount rates calibrated to the low-interest rate environment of 2018–2022 — the 2022–2024 interest rate rise materially changed the cost of capital for health system debt financing; capital project financial returns modelled at 4–5% discount rates overstate NPV relative to the current 7–9% borrowing cost environment.',
    keywords: ['capital planning', 'Kaufman Hall', 'FP&A', 'interest rate', 'operating margin', 'capital allocation'],
  },
  {
    code: 'H5193',
    name: 'Medical Equipment Lease vs. Buy Decision Made Without Tax-Exempt Financing Analysis',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'As a tax-exempt health system, Meridian can access tax-exempt bond financing for qualified capital expenditures at below-market interest rates — capital lease decisions for major equipment are made without comparing the lease cost to tax-exempt bond financing; systematic over-use of equipment leasing adds $2–5M annually in financing cost above what tax-exempt debt would cost for the same asset base.',
    keywords: ['capital planning', 'tax-exempt financing', 'equipment lease', 'FP&A', 'operating margin', 'capital allocation'],
  },
  {
    code: 'H5194',
    name: 'Facilities Master Plan Not Linked To Capital Budget Cycle',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'The facilities master plan identifying long-term space and infrastructure needs is updated on a five-year cycle but not linked to the annual capital budget process — capital requests from clinical departments for facility modifications are evaluated without reference to the master plan; reactive capital allocation for facility projects results in piecemeal investments that are inconsistent with the long-term facilities strategy.',
    keywords: ['capital planning', 'facilities', 'FP&A', 'operating margin', 'capital allocation', 'strategic planning'],
  },
  {
    code: 'H5195',
    name: 'IT Capital Not Included In Multi-Year Capital Plan',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'Information technology capital — EHR upgrades, infrastructure refresh, cybersecurity investments — is budgeted annually by IT without inclusion in the five-year strategic capital plan; unplanned IT capital requirements emerge mid-year as cybersecurity mandates, regulatory compliance requirements, or vendor end-of-life notifications force emergency capital allocations that displace planned clinical capital investments.',
    keywords: ['capital planning', 'IT capital', 'FP&A', 'capital allocation', 'Kaufman Hall', 'operating margin'],
  },
  {
    code: 'H5196',
    name: 'Post-Implementation Capital Review Not Conducted For Prior-Year Investments',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      'The capital committee approves annual capital requests based on financial return projections but does not conduct systematic post-implementation reviews of prior-year capital investments — actual volume, net revenue, and margin outcomes are never compared to approved projections; capital planning assumptions are not calibrated against historical accuracy, perpetuating systematic return overestimation in new capital requests.',
    keywords: ['capital planning', 'FP&A', 'operating margin', 'capital allocation', 'post-implementation review', 'service line P&L'],
  },
  {
    code: 'H5197',
    name: 'Philanthropic Capital Offset Not Modelled In Capital Plan Cash Flow',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Major capital projects for which philanthropic fundraising is planned show full capital expenditure in the operating cash flow model without offsetting expected gift receipts — capital plan cash flow projections overstate debt financing requirements; when philanthropic gifts are received, they are not credited against debt service, creating surplus cash that could have been directed to additional capital investment.',
    keywords: ['capital planning', 'philanthropy', 'FP&A', 'cash flow', 'capital allocation', 'operating margin'],
  },
  {
    code: 'H5198',
    name: 'Capital Allocation Not Aligned With Population Health Strategy Investment Priorities',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Meridian\'s strategic plan commits to population health and value-based care investment — but the capital allocation process rewards volume-generating clinical capital over population health infrastructure (care management technology, telehealth, analytics platforms); capital allocation misalignment between strategy and investment perpetuates fee-for-service capital bias as VBC contract exposure grows.',
    keywords: ['capital planning', 'population health', 'VBC shared savings', 'capital allocation', 'FP&A', 'strategic planning'],
  },
  {
    code: 'H5199',
    name: 'Debt Covenant Capital Spending Restriction Not Incorporated Into Capital Plan',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Meridian\'s bond covenants include capital expenditure restrictions tied to debt service coverage ratio performance — the capital planning team builds the annual capital plan without modelling covenant compliance thresholds; in years when operating margin declines, the capital plan is inconsistent with covenant requirements, requiring last-minute capital project cancellations that disrupt clinical program development timelines.',
    keywords: ['capital planning', 'debt covenant', 'FP&A', 'operating margin', 'capital allocation', 'Kaufman Hall'],
  },

];
