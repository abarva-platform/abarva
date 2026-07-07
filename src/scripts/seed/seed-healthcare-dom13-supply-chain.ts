// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Healthcare Provider patterns — Supply Chain, Purchased Services & Clinical Procurement
// AbarVa corpus — Domain 13
// Code range: H3900–H4199 (300 patterns)
// Run: npx tsx src/scripts/seed/seed-healthcare-dom13-supply-chain.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface HealthcareSupplyChainPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const HEALTHCARE_SUPPLY_CHAIN_PATTERNS: HealthcareSupplyChainPatternSeed[] = [

  // ── GPO Contract Compliance Gaps ──────────────────────────────────────────
  {
    code: 'H3900',
    name: 'Off-Contract Medical-Surgical Spend Accumulation',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Meridian Health purchases 35% of commodity medical-surgical items — gloves, IV sets, drapes — outside active GPO (Vizient) contracts because department-level ordering bypasses the Prodigo automated procurement workflow. Off-contract spend averages 22% price premium over contract tier pricing, costing $8.4M annually against the $380M supply chain budget.',
    keywords: ['GPO', 'off-contract spend', 'Vizient', 'medical-surgical', 'Prodigo', 'contract compliance'],
    demoRelevant: true,
  },
  {
    code: 'H3901',
    name: 'GPO Tier Qualification Data Not Maintained In MMIS',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Premier Inc GPO contract tier qualifications require quarterly volume attestations submitted through the GHX platform. Infor MMIS purchase history is not reconciled against GPO tier thresholds before attestation deadlines — Meridian Health is systematically under-tiered on 48 active contracts, forfeiting $2.1M in tier-2 pricing annually.',
    keywords: ['GPO', 'Premier', 'tier qualification', 'MMIS', 'GHX', 'volume attestation'],
  },
  {
    code: 'H3902',
    name: 'Dual GPO Membership Causing Contract Conflict',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Meridian Health holds simultaneous membership in Vizient and Healthtrust Purchasing Group (HPG) for overlapping product categories. Conflicting contract commitments trigger minimum purchase shortfall penalties from HPG while Vizient compliance reports show adequate volume — net compliance cost exceeds $900K per contract year.',
    keywords: ['GPO', 'Vizient', 'Healthtrust Purchasing Group', 'HPG', 'dual membership', 'contract conflict'],
  },
  {
    code: 'H3903',
    name: 'GPO Contract Expiry Not Triggering Resourcing Event',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Supply chain staff do not receive automated alerts from Coupa contract management when GPO agreements expire. Eighteen product categories rolled to month-to-month at prior-tier pricing for an average of 7.3 months before renewal was initiated — missed new-tier pricing on renewed contracts represents $1.6M in foregone savings.',
    keywords: ['GPO', 'contract expiry', 'Coupa', 'contract management', 'purchased services', 'supply chain'],
  },
  {
    code: 'H3904',
    name: 'GPO Formulary Substitution Protocol Not Followed During Shortage',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'Product shortage events trigger ad hoc purchasing from non-contracted distributors rather than activating the Vizient shortage formulary substitution protocol. Emergency purchases at spot market prices average 31% above contract cost; shortage event documentation required for GPO contract relief is not captured in GHX, disqualifying the health system from shortage exception pricing.',
    keywords: ['GPO', 'shortage management', 'Vizient', 'GHX', 'formulary substitution', 'spot market'],
    demoRelevant: true,
  },
  {
    code: 'H3905',
    name: 'Local Custom Contract Not Loaded Into MMIS Pricing Table',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Meridian Health negotiates local custom pricing amendments to national GPO contracts but fails to load updated pricing into the Infor MMIS item master within 30 days. Invoices from McKesson Medical-Surgical are processed at national contract pricing rather than local pricing, overpaying by an average of $420K per amendment cycle.',
    keywords: ['MMIS', 'local contract', 'pricing table', 'McKesson Medical-Surgical', 'GPO', 'invoice processing'],
  },
  {
    code: 'H3906',
    name: 'GPO Compliance Reporting Methodology Inconsistent Across Facilities',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Meridian Health\'s three acute care hospitals calculate GPO contract compliance using different denominators — one facility excludes emergency purchase orders, another excludes capital, and the third includes all spend categories. Compliance rates reported to GPO partners range from 74% to 89% for the same product categories, masking true performance.',
    keywords: ['GPO', 'contract compliance', 'reporting methodology', 'supply chain analytics', 'purchased services', 'Vizient'],
  },
  {
    code: 'H3907',
    name: 'New Product Introduction Bypassing GPO Contract Check',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Clinical departments introduce new supply items through the Epic Supply Chain Storeroom Management requisition workflow without checking GPO contract availability first. Thirty-two new SKUs added in the prior fiscal year had equivalent GPO-contracted items — direct sourcing cost premium totals $780K versus what GPO pricing would have yielded.',
    keywords: ['GPO', 'new product introduction', 'Epic Supply Chain', 'contract compliance', 'value analysis', 'MMIS'],
  },

  // ── Physician Preference Item Standardisation Failures ───────────────────
  {
    code: 'H3908',
    name: 'PPI Proliferation Driving Supply Cost-Per-Case Variance',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'Meridian Health orthopedic and cardiovascular service lines carry 6.4 active implant systems per procedure category on average — industry benchmark is 2.1. Each additional PPI (physician preference item) system requires dedicated consignment inventory, tray sets, and clinical specialist coverage. Supply cost-per-case variance across surgeons in the same DRG exceeds 340%.',
    keywords: ['PPI', 'physician preference item', 'clinical standardisation', 'cost-per-case', 'consignment inventory', 'value analysis'],
    demoRelevant: true,
  },
  {
    code: 'H3909',
    name: 'Clinical Value Analysis Committee Physician Engagement Below Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'The clinical value analysis committee (CVAC) achieves physician quorum in only 58% of scheduled meetings. Without physician sign-off, PPI standardisation recommendations cannot be implemented. Backlog of 23 pending standardisation proposals has average age of 14 months — none progressed to vendor contract renegotiation.',
    keywords: ['clinical value analysis', 'PPI', 'physician engagement', 'CVAC', 'standardisation', 'GPO'],
    demoRelevant: true,
  },
  {
    code: 'H3910',
    name: 'PPI Contract Negotiations Without Cost-Per-Case Benchmark Data',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Supply chain negotiators enter PPI vendor contract renegotiations without Curvo purchased services analytics or Definitive Healthcare market intelligence data on peer institution pricing. Negotiated implant pricing is 18–24% above market benchmarks for total joint arthroplasty and spine fusion systems — gap represents $4.2M annual overspend.',
    keywords: ['PPI', 'vendor management', 'Curvo', 'Definitive Healthcare', 'cost-per-case', 'contract negotiation'],
  },
  {
    code: 'H3911',
    name: 'Physician Preference Card Inaccuracy Driving PPI Waste',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'Surgeon preference cards in Epic Supply Chain are updated manually by OR charge nurses and reflect actual implant selection in only 61% of cases. Unused PPI items opened but not implanted are wasted at an average cost of $1,840 per case; annual waste across Meridian Health OR volume totals $3.1M from preference card inaccuracy alone.',
    keywords: ['physician preference item', 'preference card', 'Epic Supply Chain', 'OR waste', 'implantable device', 'cost-per-case'],
    demoRelevant: true,
  },
  {
    code: 'H3912',
    name: 'PPI Standardisation Savings Not Captured In Budget Baseline',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Clinical value analysis committee approves PPI standardisation initiatives but savings are not loaded into supply chain budget baselines until the following fiscal year. Vendor rebate credits from standardisation flow to departmental cost centres rather than supply chain — $1.8M in realised PPI standardisation savings is not attributed to supply chain performance in Workday Financial reporting.',
    keywords: ['PPI', 'value analysis', 'Workday Financial', 'budget baseline', 'savings attribution', 'clinical standardisation'],
  },
  {
    code: 'H3913',
    name: 'Single-Use PPI Reprocessing Programme Underperforming',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Meridian Health operates an FDA-cleared single-use device reprocessing programme through a third-party reprocessor but capture rates are 34% against a peer-institution benchmark of 68%. Clinical staff are not trained on which PPI items are eligible for reprocessing — foregone savings from uncaptured reprocessing opportunities total $920K annually.',
    keywords: ['PPI', 'single-use device reprocessing', 'sustainability', 'supply chain', 'clinical standardisation', 'value analysis'],
  },

  // ── Implantable Device Inventory Management ───────────────────────────────
  {
    code: 'H3914',
    name: 'Consignment Inventory Count Accuracy Below 85%',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      'Physical consignment inventory counts at Meridian Health OR storerooms match vendor-reported inventory in only 82% of audits. Discrepancies result from implants used without charge capture, expired items not returned to vendors, and loaner trays not reconciled post-case. Annual write-off exposure from consignment inventory inaccuracy is $2.7M.',
    keywords: ['consignment inventory', 'implantable device', 'inventory management', 'charge capture', 'OR storeroom', 'vendor management'],
    demoRelevant: true,
  },
  {
    code: 'H3915',
    name: 'Implant Expiry Management Failure In Consignment Stock',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Vendor-managed consignment implant inventory is not systematically checked for expiry dates during routine storeroom replenishment cycles. Three Joint Commission survey findings in 18 months cited expired implants available for use. Expired item disposal cost and vendor replacement charges total $340K per year.',
    keywords: ['consignment inventory', 'implantable device', 'expiry management', 'Joint Commission', 'inventory management', 'vendor management'],
  },
  {
    code: 'H3916',
    name: 'Loaner Tray Reconciliation Delays Blocking Vendor Returns',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Orthopedic and spine loaner tray reconciliation averages 11 days post-case before trays are returned to vendors. Vendor late-return fees across 14 active implant vendors total $480K annually. OR scheduling cannot confirm tray availability for cases more than 5 days out because loaner inventory status is not real-time in the Epic Supply Chain module.',
    keywords: ['loaner tray', 'implantable device', 'consignment inventory', 'Epic Supply Chain', 'vendor management', 'OR scheduling'],
  },
  {
    code: 'H3917',
    name: 'UDI Capture Rate Below CMS Reporting Threshold',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'UDI (unique device identifier) capture at point of implant in the Epic Supply Chain module achieves 71% compliance — CMS Quality Payment Program and Joint Commission requirements set 90% as the minimum threshold for implantable devices. Missing UDI records prevent post-market surveillance participation and complicate recall notification workflows.',
    keywords: ['UDI', 'implantable device', 'Epic Supply Chain', 'CMS', 'recall management', 'charge capture'],
    demoRelevant: true,
  },
  {
    code: 'H3918',
    name: 'Implant Charge Capture Lag Causing Revenue Leakage',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'Implant charge entry into Epic from OR case documentation averages 2.8 days — CMS billing rules require implant charges within 24 hours for accurate DRG assignment. Late charge entries cause bill-hold days to exceed 4.2 average, and implant cost recovery shortfalls from missed charges total $1.4M annually across Meridian Health facilities.',
    keywords: ['implantable device', 'charge capture', 'Epic Supply Chain', 'revenue cycle', 'DRG', 'cost recovery'],
  },

  // ── Purchased Services Spend Under Management ─────────────────────────────
  {
    code: 'H3919',
    name: '35% Of Purchased Services Without Competitive Sourcing In 3 Years',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Meridian Health\'s Syntegrity Analytics purchased services analysis identifies $133M (35% of total purchased services spend of $380M) without competitive sourcing activity in more than 3 years. Consulting, IT outsourcing, facilities management, and biomedical services are the largest unsourced categories. Peer benchmarks suggest 12–18% savings potential on resourced spend.',
    keywords: ['purchased services', 'Syntegrity Analytics', 'competitive sourcing', 'Curvo', 'spend management', 'vendor management'],
    demoRelevant: true,
  },
  {
    code: 'H3920',
    name: 'Purchased Services Category Management Structure Absent',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Meridian Health procurement has category managers for medical-surgical supply but no dedicated purchased services category management. IT, facilities, HR consulting, and clinical staffing spend is managed by individual department heads without supply chain involvement — Jaggaer sourcing platform is not used for 78% of purchased services categories.',
    keywords: ['purchased services', 'category management', 'Jaggaer', 'supply chain', 'spend management', 'procurement'],
  },
  {
    code: 'H3921',
    name: 'IT Consulting Spend Without Hourly Rate Benchmarking',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Information technology consulting and implementation services totalling $42M annually are contracted at hourly rates 19–27% above Curvo analytics benchmarks for comparable health system engagements. Contracts are renewed annually without rate renegotiation or competitive RFP — supply chain is not consulted during IT vendor selection.',
    keywords: ['purchased services', 'IT consulting', 'Curvo', 'hourly rate benchmark', 'vendor management', 'contract management'],
  },
  {
    code: 'H3922',
    name: 'Clinical Staffing Agency Spend Without Consolidated MSP',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      'Meridian Health uses 22 separate agency staffing vendors for travel nursing and allied health with no managed service provider (MSP) programme. Bill rates vary by 34% for identical nursing specialties across agencies. Without consolidated MSP visibility in Coupa, total contingent labor spend of $67M annually has no rate card compliance monitoring.',
    keywords: ['purchased services', 'clinical staffing', 'MSP', 'travel nursing', 'Coupa', 'vendor master'],
    demoRelevant: true,
  },
  {
    code: 'H3923',
    name: 'Facilities Management Contract Scope Creep Without Change Order Governance',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Facilities management and environmental services contracts accumulate change orders averaging 28% above baseline contract value annually. Change orders are approved by facilities department leadership without supply chain review in SAP Ariba — cumulative scope creep across five facilities contracts adds $3.8M to annual spend above contracted scope.',
    keywords: ['purchased services', 'facilities management', 'SAP Ariba', 'change order', 'contract management', 'scope creep'],
  },
  {
    code: 'H3924',
    name: 'Purchased Services Spend Classification Inconsistency',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Workday Financial purchase order classification places 31% of purchased services spend in non-services GL accounts — IT hardware maintenance coded as capital equipment, biomedical services coded as supply expense. Purchased services analytics in Curvo cannot accurately identify the true scope of services spend, understating the category by $41M.',
    keywords: ['purchased services', 'Workday Financial', 'spend classification', 'Curvo', 'GL coding', 'supply chain analytics'],
  },

  // ── Vendor Master Data Quality Failures ───────────────────────────────────
  {
    code: 'H3925',
    name: 'Duplicate Vendor Records Causing Payment Control Failures',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Meridian Health\'s vendor master in Oracle Procurement Cloud contains 2,847 duplicate vendor records across its 2,400+ active supplier base. Duplicate records allow invoices to be processed twice — AP matching failures in Workday Financial detected $1.2M in duplicate payments in the prior fiscal year, with an estimated additional $800K undetected.',
    keywords: ['vendor master', 'duplicate vendor', 'Oracle Procurement Cloud', 'AP matching', 'Workday Financial', 'payment controls'],
    demoRelevant: true,
  },
  {
    code: 'H3926',
    name: 'Inactive Vendor Payments Continuing After Contract Termination',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Forty-three vendors terminated in the prior two years remain active in the Oracle Procurement Cloud vendor master with open purchase orders. Payments to inactive vendors totalling $640K were processed post-termination before accounts payable reconciliation identified the anomaly — absence of automated vendor deactivation workflow is the root cause.',
    keywords: ['vendor master', 'inactive vendor', 'Oracle Procurement Cloud', 'payment controls', 'vendor management', 'AP matching'],
  },
  {
    code: 'H3927',
    name: 'Vendor Banking Information Change Without Dual-Approval Workflow',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'Oracle Procurement Cloud vendor master banking information changes require only a single-approver workflow — two social engineering fraud incidents in 18 months resulted in misdirected payments of $380K and $210K to fraudulent bank accounts. Peer institution controls require dual approval plus callback verification for any ACH banking change.',
    keywords: ['vendor master', 'banking fraud', 'Oracle Procurement Cloud', 'payment controls', 'vendor management', 'AP matching'],
  },
  {
    code: 'H3928',
    name: 'Vendor Diversity Reporting Inaccurate Due To MMIS Classification Gaps',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Meridian Health reports minority-owned business spend at 4.2% of total supply spend in annual community benefit reporting — actual diverse supplier spend is estimated at 7.8% but 44% of diverse vendors are not flagged as such in the Infor MMIS vendor master. Regulatory reporting inaccuracy creates community benefit audit risk and misrepresents vendor diversity programme performance.',
    keywords: ['vendor master', 'supplier diversity', 'MMIS', 'community benefit', 'supply chain analytics', 'vendor management'],
  },
  {
    code: 'H3929',
    name: 'Vendor Contract Terms Not Synchronized With MMIS Pricing',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Negotiated price amendments between Meridian Health and 38 active medical-surgical vendors are stored as PDF attachments in Coupa but are not systematically loaded into the Infor MMIS item master. Invoices processed at outdated MMIS prices generate AP variances requiring manual resolution — 4.2 FTE are consumed by price variance resolution that automation would eliminate.',
    keywords: ['vendor master', 'MMIS', 'Coupa', 'contract management', 'AP matching', 'pricing accuracy'],
  },

  // ── Supply Chain Analytics: Cost-Per-Case Accuracy ───────────────────────
  {
    code: 'H3930',
    name: 'Cost-Per-Case Calculation Excluding Non-Implant Supply Cost',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Clinical value analysis cost-per-case models for orthopedic and cardiac procedures capture implant costs from the MMIS but exclude sutures, biological bone graft, OR disposables, and preference card ancillaries. True cost-per-case is understated by 18–24% — value analysis committee recommendations underestimate savings potential and misrank standardisation priorities.',
    keywords: ['cost-per-case', 'clinical value analysis', 'MMIS', 'supply chain analytics', 'PPI', 'value analysis'],
    demoRelevant: true,
  },
  {
    code: 'H3931',
    name: 'Supply Chain Analytics Platform Not Integrated With EHR Outcomes Data',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'Meridian Health\'s supply chain analytics in Infor and Curvo capture cost data but are not integrated with Epic clinical outcomes data. Value analysis cannot demonstrate correlation between supply choice and patient outcomes (LOS, readmission, complication rate) — physician resistance to standardisation is not overcome because the cost argument is unsupported by outcomes evidence.',
    keywords: ['supply chain analytics', 'Curvo', 'Epic', 'cost-per-case', 'clinical value analysis', 'value analysis'],
  },
  {
    code: 'H3932',
    name: 'DRG-Level Supply Cost Benchmarking Not Available To Service Line Leaders',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Service line leaders at Meridian Health receive quarterly cost-per-case reports that show internal trends but lack external peer benchmarks at the DRG level. Definitive Healthcare market intelligence data is purchased but not integrated into supply chain analytics dashboards — leaders cannot assess whether their supply cost position is competitive versus regional peers.',
    keywords: ['supply chain analytics', 'DRG', 'Definitive Healthcare', 'cost-per-case', 'benchmark', 'service line'],
  },
  {
    code: 'H3933',
    name: 'Supply Cost Attribution To Wrong Cost Centre In Workday',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Inter-department supply transfers at Meridian Health are processed in the Epic Supply Chain storeroom module without Workday Financial cost centre synchronisation. Fourteen percent of supply costs are attributed to the requesting cost centre with a 15–30-day lag, distorting monthly department P&L reports and causing budget variance conversations based on incomplete data.',
    keywords: ['supply chain analytics', 'Workday Financial', 'Epic Supply Chain', 'cost centre', 'cost attribution', 'MMIS'],
  },

  // ── Product Recall and Shortage Management ────────────────────────────────
  {
    code: 'H3934',
    name: 'Product Recall Notification To Clinical Staff Averaging 4.2 Days',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'FDA Class II and Class I device recall notifications received by Meridian Health supply chain take an average of 4.2 days to reach clinical department leadership — Joint Commission EC.02.01.01 requires immediate notification for Class I recalls. Manual process relying on email distribution lists causes delays when supply chain staff are unavailable.',
    keywords: ['product recall', 'FDA recall', 'Joint Commission', 'supply chain', 'recall management', 'vendor management'],
    demoRelevant: true,
  },
  {
    code: 'H3935',
    name: 'Recalled Product Quarantine Process Not Standardised Across Facilities',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'Product recall quarantine procedures differ across Meridian Health\'s three acute care campuses — one campus uses physical red-tag quarantine, another uses Epic Supply Chain hold flags, and the third uses a manual log. During a recent cardiac catheter recall, quarantine compliance was verified at only one campus within 24 hours, creating patient safety risk.',
    keywords: ['product recall', 'quarantine', 'Epic Supply Chain', 'supply chain', 'recall management', 'safety stock'],
    demoRelevant: true,
  },
  {
    code: 'H3936',
    name: 'Drug Shortage Response Without Formulary Substitution Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'Pharmacy supply chain at Meridian Health does not have a pre-approved therapeutic substitution protocol for the top 20 drugs on the FDA shortage list. Each shortage requires individual P&T committee review averaging 8.4 days — peer institutions with pre-approved shortage substitution protocols activate alternatives within 24 hours, reducing patient care disruption.',
    keywords: ['drug shortage', 'pharmacy supply chain', 'formulary substitution', 'P&T committee', 'safety stock', 'shortage management'],
  },
  {
    code: 'H3937',
    name: 'Critical Supply Safety Stock Levels Not Updated Post-Pandemic',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'Meridian Health PAR levels for PPE, ventilator circuits, and IV bag supplies were set in 2019 and not recalibrated following pandemic-era supply chain disruption lessons. Current safety stock for N95 respirators provides 8 days of coverage — ASPR hospital preparedness guidance recommends 90-day reserves. Supply chain resilience framework is not operationalised.',
    keywords: ['safety stock', 'supply chain resilience', 'PAR management', 'PPE', 'shortage management', 'pandemic preparedness'],
    demoRelevant: true,
  },
  {
    code: 'H3938',
    name: 'Single-Source Supplier Risk Not Mapped Across Critical Supply Categories',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Sixty-one critical supply items in Meridian Health\'s formulary have sole-source contracts with no qualified alternative supplier identified. Supply chain does not maintain a sole-source risk registry — a manufacturing disruption at a single IV solutions manufacturer caused a 23-day backorder event that required emergency allocation management affecting 4 surgical service lines.',
    keywords: ['sole-source contract', 'single-source supplier', 'supply chain resilience', 'safety stock', 'shortage management', 'vendor management'],
  },
  {
    code: 'H3939',
    name: 'GHX Shortage Alert Integration With PAR System Absent',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'GHX supply chain exchange shortage alert data is not integrated with the Infor MMIS PAR management system. Supply chain staff manually monitor GHX shortage alerts and then separately update PAR levels — average lag between GHX shortage notification and PAR adjustment is 6.8 days, leaving facilities exposed to stockouts during the response window.',
    keywords: ['GHX', 'PAR management', 'shortage management', 'MMIS', 'supply chain resilience', 'safety stock'],
  },

  // ── PAR/Kanban Inventory System Configuration Failures ────────────────────
  {
    code: 'H3940',
    name: 'PAR Levels Set By Historical Volume Not Adjusted For Seasonal Demand',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'PAR levels in the Infor MMIS for surgical supplies are set based on 12-month historical average usage without seasonal demand adjustment. Orthopedic elective surgery volumes increase 28% in Q4 — PAR levels set for average demand cause storeroom stockouts during Q4 peak periods, driving emergency purchase orders at premium pricing.',
    keywords: ['PAR management', 'Kanban', 'MMIS', 'demand forecasting', 'supply chain analytics', 'inventory optimisation'],
  },
  {
    code: 'H3941',
    name: 'Kanban Card Replenishment Frequency Misaligned With Usage Rate',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Kanban two-bin replenishment systems in Meridian Health procedure rooms use bin sizes calibrated 18 months ago and not reviewed since OR case volume growth of 14%. High-usage items such as closure staples and electrosurgical pencils reach empty-bin status before the replenishment order arrives — OR nurses must interrupt case setup for emergency storeroom runs.',
    keywords: ['Kanban', 'PAR management', 'inventory optimisation', 'OR storeroom', 'supply chain', 'replenishment'],
  },
  {
    code: 'H3942',
    name: 'Excess Inventory Tied Up In Slow-Moving Supply SKUs',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Meridian Health storeroom inventory analysis reveals $4.8M in slow-moving supply SKUs (less than 12 turns per year) and $1.1M in zero-movement items aged over 90 days. PAR system does not flag slow-moving items for clinical review — items continue to be replenished automatically, tying up working capital and occupying storeroom space needed for higher-velocity supplies.',
    keywords: ['inventory optimisation', 'PAR management', 'MMIS', 'slow-moving inventory', 'supply chain analytics', 'storeroom operations'],
    demoRelevant: true,
  },
  {
    code: 'H3943',
    name: 'Decentralised Floor Stock Not Included In MMIS Inventory Valuation',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Nursing unit floor stock — wound care supplies, IV start kits, urinary catheters — is managed outside the Infor MMIS PAR system through informal charge nurse ordering. Estimated $6.2M of floor stock inventory is not tracked in the MMIS, preventing accurate total inventory valuation, expiry monitoring, or supply cost attribution to clinical departments.',
    keywords: ['PAR management', 'floor stock', 'MMIS', 'inventory management', 'storeroom operations', 'supply chain analytics'],
  },
  {
    code: 'H3944',
    name: 'Point-Of-Use Cabinet Integration With MMIS Creating Phantom Inventory',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Pyxis and Omnicell point-of-use supply cabinets in Meridian Health catheterisation labs and procedure suites are not integrated with the Infor MMIS inventory system. Cabinet replenishment is triggered by cabinet-level min/max settings independent of MMIS PAR levels — phantom inventory in MMIS shows adequate stock when cabinet-level stock is depleted.',
    keywords: ['PAR management', 'point-of-use', 'MMIS', 'Pyxis', 'inventory management', 'storeroom operations'],
  },

  // ── GHX Integration Failures ──────────────────────────────────────────────
  {
    code: 'H3945',
    name: 'EDI 855 Purchase Order Acknowledgement Match Rate Below 90%',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'GHX EDI 855 purchase order acknowledgement transactions from Medline Industries and McKesson Medical-Surgical match to MMIS purchase orders at only 84% — the remaining 16% require manual intervention by accounts payable staff. Price and quantity discrepancies in unmatched transactions totalling $2.4M annually are resolved through email rather than automated exception management.',
    keywords: ['GHX', 'EDI 855', 'purchase order acknowledgement', 'MMIS', 'AP matching', 'supply chain'],
    demoRelevant: true,
  },
  {
    code: 'H3946',
    name: 'EDI 810 Invoice Match Failure Rate Driving Payment Delays',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'GHX EDI 810 invoice transactions fail three-way match (PO/receipt/invoice) in Oracle Procurement Cloud at an 18% rate — industry benchmark is below 5%. Primary failure causes are price table mismatches, quantity rounding differences, and freight charge coding errors. Average invoice resolution time of 22 days exceeds early payment discount windows of 10 days.',
    keywords: ['GHX', 'EDI 810', 'AP matching', 'Oracle Procurement Cloud', 'three-way match', 'invoice processing'],
    demoRelevant: true,
  },
  {
    code: 'H3947',
    name: 'GHX Item Master Synchronisation Lag Causing Order Errors',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Vendor product updates including catalogue number changes, unit-of-measure conversions, and discontinuation notices transmitted through GHX are not synchronised into the Infor MMIS item master within 5 business days. Stale item master data causes incorrect orders that are shipped as substitutions — substitution acceptance rate is 71%, below the target of 95%.',
    keywords: ['GHX', 'item master', 'MMIS', 'catalogue management', 'supply chain', 'vendor management'],
  },
  {
    code: 'H3948',
    name: 'GHX Order Status Visibility Not Surfaced To Storeroom Staff',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'GHX real-time order status and expected delivery date data is available in the GHX portal but is not integrated into the Infor MMIS storeroom management workflow. Storeroom staff manually check GHX portal separately from MMIS — OR schedulers cannot confirm supply availability for upcoming cases without a supply chain staff intermediary.',
    keywords: ['GHX', 'order status', 'MMIS', 'storeroom operations', 'supply chain', 'inventory management'],
  },
  {
    code: 'H3949',
    name: 'GHX Vendor Scorecard Data Not Used In Contract Renewal Decisions',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'GHX supply chain exchange generates vendor performance scorecards covering on-time delivery, fill rate, and invoice accuracy for Meridian Health\'s top 50 suppliers. Scorecard data is reviewed annually by supply chain but is not formally weighted in contract renewal negotiations — vendors with chronic delivery failures retain contracts at unchanged pricing.',
    keywords: ['GHX', 'vendor scorecard', 'vendor management', 'contract management', 'supply chain analytics', 'on-time delivery'],
  },

  // ── Single-Source Supplier Dependency Risk ────────────────────────────────
  {
    code: 'H3950',
    name: 'Single-Source Dependency Risk Registry Not Maintained',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Meridian Health procurement does not maintain a formal sole-source risk registry covering critical medical-surgical and pharmaceutical supplies. Without a registry, supply chain leadership has no systematic visibility into which backorder events are caused by single-source dependency versus demand spikes. Risk mitigation planning cannot be prioritised.',
    keywords: ['sole-source contract', 'single-source supplier', 'supply chain resilience', 'vendor management', 'risk management', 'shortage management'],
  },
  {
    code: 'H3951',
    name: 'Alternative Supplier Qualification Not Initiated Until Stockout Occurs',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'Meridian Health initiates alternative supplier qualification only after a stockout event, not proactively. For critical items with sole-source contracts, new supplier qualification averages 45 days — during this window, clinical departments manage supply shortages through rationing and procedure delays. Proactive qualification of alternates for top-30 sole-source items has not been resourced.',
    keywords: ['sole-source contract', 'supplier qualification', 'supply chain resilience', 'shortage management', 'vendor management', 'safety stock'],
  },
  {
    code: 'H3952',
    name: 'Geographic Concentration Risk In Sole-Source Supplier Base',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Analysis of Meridian Health\'s sole-source supply contracts reveals 68% of critical sole-source items are manufactured in a single geographic region. Natural disaster, geopolitical disruption, or regulatory action in that region would simultaneously disrupt 41 critical supply categories. Supply chain resilience planning does not address geographic concentration risk.',
    keywords: ['sole-source contract', 'supply chain resilience', 'geographic concentration', 'vendor management', 'safety stock', 'shortage management'],
  },

  // ── Supply Chain Resilience ────────────────────────────────────────────────
  {
    code: 'H3953',
    name: 'Supply Chain Business Continuity Plan Not Tested Annually',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Meridian Health supply chain business continuity plan was last tabletop-tested 26 months ago. ASPR hospital preparedness programme requirements and Joint Commission EC.04.01.01 recommend annual testing. The plan references GHX and Prodigo system integrations that have changed significantly since the last test — contact lists and alternative sourcing protocols are stale.',
    keywords: ['supply chain resilience', 'business continuity', 'Joint Commission', 'ASPR', 'shortage management', 'safety stock'],
  },
  {
    code: 'H3954',
    name: 'Strategic Supply Reserve Programme Not Funded In Operating Budget',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'CFO-approved supply chain resilience programme includes a $4.2M strategic reserve for critical supply categories but the operating budget allocation was not enacted in the current fiscal year due to capital constraints. Safety stock for ventilator circuits, dialysis supplies, and blood administration sets remains at pre-pandemic levels despite documented shortage risk.',
    keywords: ['supply chain resilience', 'safety stock', 'strategic reserve', 'pandemic preparedness', 'shortage management', 'supply chain'],
    demoRelevant: true,
  },
  {
    code: 'H3955',
    name: 'Supplier Financial Health Monitoring Not Integrated Into Vendor Management',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Meridian Health procurement does not systematically monitor supplier financial health indicators — credit ratings, Days Sales Outstanding, and bankruptcy filings — for critical supply vendors. A sole-source surgical mesh vendor filed Chapter 11 without supply chain awareness; 90-day supply disruption followed before alternative qualification was completed.',
    keywords: ['vendor management', 'supplier financial health', 'supply chain resilience', 'sole-source contract', 'risk management', 'shortage management'],
  },
  {
    code: 'H3956',
    name: 'Pandemic-Era Supply Chain Lessons Not Incorporated Into Policy',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Meridian Health conducted a post-pandemic supply chain after-action review in 2021 that identified 14 corrective actions including PAR level recalibration, sole-source risk reduction, and GHX integration improvements. As of the current review, only 4 of 14 corrective actions are fully implemented — policy documentation is complete but operational changes are not sustained.',
    keywords: ['supply chain resilience', 'pandemic preparedness', 'PAR management', 'safety stock', 'supply chain', 'shortage management'],
  },

  // ── Clinical Value Analysis Committee Governance ──────────────────────────
  {
    code: 'H3957',
    name: 'Value Analysis Committee Charter Not Updated For Current Spend Scope',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'Meridian Health\'s clinical value analysis committee charter defines a $50K annual spend threshold for CVAC review — the threshold has not been updated in 7 years and excludes the majority of PPI and purchased services decisions. Seventy percent of new product evaluations bypass formal CVAC governance, proceeding directly to department-level approval.',
    keywords: ['clinical value analysis', 'CVAC', 'governance', 'PPI', 'supply chain', 'value analysis'],
  },
  {
    code: 'H3958',
    name: 'New Product Request Approval Without Evidence-Based Review',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'New product requests submitted by clinical departments to the value analysis committee are approved in 62% of cases without peer-reviewed clinical evidence review. Supply chain staff conduct cost analysis but do not have clinical expertise to evaluate evidence claims — physician champions present vendor-provided clinical data without independent evidence assessment.',
    keywords: ['clinical value analysis', 'new product request', 'evidence-based review', 'PPI', 'value analysis', 'CVAC'],
  },
  {
    code: 'H3959',
    name: 'Value Analysis Savings Tracking Not Closed-Loop With Finance',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Clinical value analysis initiatives report projected savings to the supply chain leadership team but Workday Financial actuals are not reconciled against projections quarterly. Twelve of 18 approved value analysis initiatives from the prior year are unverified for actual savings — CFO cannot confirm whether $6.8M in projected value analysis savings materialised.',
    keywords: ['clinical value analysis', 'savings tracking', 'Workday Financial', 'supply chain analytics', 'CVAC', 'value analysis'],
    demoRelevant: true,
  },
  {
    code: 'H3960',
    name: 'Physician Co-Management Agreement Not Aligned With CVAC Governance',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Physician co-management agreement incentive structures for orthopedic and cardiovascular service lines reward patient volume and clinical quality but do not include supply cost-per-case performance measures. Physicians have no financial incentive to engage with CVAC standardisation recommendations — contract renegotiation to include supply cost metrics has not been initiated.',
    keywords: ['clinical value analysis', 'physician engagement', 'co-management agreement', 'PPI', 'cost-per-case', 'CVAC'],
  },

  // ── Sustainability In Healthcare Procurement ──────────────────────────────
  {
    code: 'H3961',
    name: 'Supplier ESG Requirements Not Included In RFP Evaluation Criteria',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Meridian Health Jaggaer sourcing RFP templates do not include environmental, social, and governance (ESG) criteria or scoring weights. Ninety-two percent of supply contracts executed in the prior year were awarded solely on price and service criteria. Meridian Health\'s Community Health Needs Assessment sustainability commitments are not operationalised in procurement decisions.',
    keywords: ['sustainability', 'ESG', 'Jaggaer', 'supplier management', 'procurement', 'purchased services'],
  },
  {
    code: 'H3962',
    name: 'Single-Use Device Reduction Programme Without Departmental Targets',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Meridian Health environmental sustainability programme identifies single-use device reduction as a priority but supply chain has not established department-level reduction targets or linked them to Coupa procurement performance metrics. Single-use supply spend is growing at 6.2% annually against a stated goal of 2% reduction — no accountability mechanism is in place.',
    keywords: ['sustainability', 'single-use device reprocessing', 'Coupa', 'supply chain', 'ESG', 'environmental'],
  },
  {
    code: 'H3963',
    name: 'Healthcare Supply Chain Carbon Footprint Not Measured',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Meridian Health does not measure Scope 3 supply chain carbon emissions as part of its organisational carbon accounting programme. Healthcare supply chain is estimated to represent 60–70% of a health system\'s carbon footprint — without measurement, Meridian Health cannot set supply chain emission reduction targets or respond to community stakeholder inquiries about supply chain sustainability.',
    keywords: ['sustainability', 'carbon footprint', 'ESG', 'supply chain', 'Scope 3', 'procurement'],
  },
  {
    code: 'H3964',
    name: 'Reusable Sharps Container Programme Underperforming Against Cost Benchmark',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Meridian Health\'s reusable sharps container programme achieves 61% container return rate against a peer benchmark of 84%. Unreturned containers increase per-disposal unit cost by 38% above the cost of a fully compliant reusable programme. Clinical staff education and pickup logistics gaps are the identified causes — programme has not been resourced for corrective action.',
    keywords: ['sustainability', 'sharps disposal', 'supply chain', 'environmental', 'storeroom operations', 'waste management'],
  },

  // ── Capital Equipment Procurement Governance ──────────────────────────────
  {
    code: 'H3965',
    name: 'Capital Equipment Replacement Cycle Planning Not Integrated With Supply Budget',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Meridian Health capital equipment replacement planning is managed by biomedical engineering separately from supply chain. Consumable cost implications of capital equipment selections — reagent lock-in, proprietary disposables, maintenance contract terms — are not evaluated during capital budget review in Workday Financial. Suboptimal capital selections drive excess consumable spend of $3.4M annually.',
    keywords: ['capital equipment', 'procurement governance', 'Workday Financial', 'supply chain analytics', 'biomedical engineering', 'purchased services'],
    demoRelevant: true,
  },
  {
    code: 'H3966',
    name: 'Capital Equipment Maintenance Contract Auto-Renewal Without Value Assessment',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Eighty-three percent of capital equipment full-service maintenance contracts at Meridian Health auto-renew annually without competitive assessment. Coupa contract management does not trigger a value assessment 90 days before renewal. Peer institution analysis shows 15–22% savings available on imaging, lab analyser, and biomedical equipment maintenance through competitive rebidding.',
    keywords: ['capital equipment', 'maintenance contract', 'Coupa', 'contract management', 'purchased services', 'procurement governance'],
  },
  {
    code: 'H3967',
    name: 'Shared Services Equipment Utilisation Data Not Available To Capital Committee',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Capital committee at Meridian Health approves new equipment requests without utilisation data for existing equipment of the same type. Biomedical engineering asset management system is not integrated with Epic scheduling or Workday Financial — average utilisation for CT scanners and anaesthesia machines cannot be determined, and over-equipment decisions are made without utilisation evidence.',
    keywords: ['capital equipment', 'procurement governance', 'utilisation', 'Workday Financial', 'biomedical engineering', 'supply chain analytics'],
  },
  {
    code: 'H3968',
    name: 'Capital Equipment Vendor Service Response SLA Not Monitored',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Biomedical engineering does not systematically track vendor response time, uptime achievement, and mean time to repair against contracted SLAs for capital equipment service contracts. Without automated SLA monitoring in Coupa, contract penalty clauses for SLA breaches are never invoked — estimated $680K in annual SLA penalty credits are not recovered.',
    keywords: ['capital equipment', 'maintenance contract', 'SLA', 'Coupa', 'vendor management', 'biomedical engineering'],
  },

  // ── Pharmacy Supply Chain Governance ──────────────────────────────────────
  {
    code: 'H3969',
    name: 'Drug Shortage 340B Compliance Risk During Emergency Sourcing',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'During drug shortage events, Meridian Health pharmacy sources substitute medications through non-340B eligible wholesalers to maintain patient care continuity. 340B programme compliance tracking in the pharmacy supply chain system does not flag substitute purchases that must be excluded from 340B pricing claims — retrospective 340B audit findings total $1.2M in recoupment risk.',
    keywords: ['pharmacy supply chain', '340B', 'drug shortage', 'formulary substitution', 'compliance', 'shortage management'],
    demoRelevant: true,
  },
  {
    code: 'H3970',
    name: 'Formulary Substitution Decision Not Reaching Prescribing Physicians Within 24 Hours',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'Pharmacy and Therapeutics committee formulary substitution decisions during drug shortage events take an average of 31 hours to communicate to prescribing physicians via Epic order sets — during this communication gap, 23% of physicians place orders for the unavailable formulary agent, creating pharmacy workflow disruption and patient safety risk from delayed therapy.',
    keywords: ['pharmacy supply chain', 'formulary substitution', 'drug shortage', 'Epic', 'P&T committee', 'shortage management'],
  },
  {
    code: 'H3971',
    name: 'Pharmaceutical Prime Vendor Contract Compliance Below Committed Volume',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Meridian Health\'s pharmaceutical prime vendor (wholesaler) contract commits to purchasing 95% of formulary drug volume through the primary distributor. Actual compliance is 87% due to 340B contract pharmacy purchasing and direct manufacturer purchases for oncology drugs — shortfall below contractual commitment triggers service level reductions and rebate forfeiture worth $840K annually.',
    keywords: ['pharmacy supply chain', 'prime vendor', 'contract compliance', 'GPO', '340B', 'purchased services'],
  },
  {
    code: 'H3972',
    name: 'Controlled Substance Supply Chain Diversion Detection Gap',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'Pharmacy supply chain analytics for controlled substance diversion detection relies on manual variance reconciliation between Omnicell dispensing data and MMIS inventory records. Automated diversion detection flagging in the pharmacy information system is not configured — two diversion incidents in the prior year were detected by manual audit 47 and 63 days after the events.',
    keywords: ['pharmacy supply chain', 'controlled substance', 'diversion detection', 'MMIS', 'Omnicell', 'inventory management'],
    demoRelevant: true,
  },

  // ── Distribution Centre and Storeroom Operations ──────────────────────────
  {
    code: 'H3973',
    name: 'Central Distribution Centre Throughput Constraint From Manual Receiving',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Meridian Health\'s central distribution centre processes 1,200–1,500 line items per day through manual receiving with paper-based GHX packing slip verification. Receiving productivity benchmarks for automated scanning operations are 2.8x higher — receiving queue backlogs during high-volume delivery days result in 1.4-day delays in supply availability after physical delivery.',
    keywords: ['storeroom operations', 'distribution centre', 'GHX', 'MMIS', 'receiving', 'supply chain'],
  },
  {
    code: 'H3974',
    name: 'Storeroom Layout Not Optimised For High-Velocity Item Placement',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Infor MMIS slotting data shows that the top 15% of supply SKUs by pick frequency (accounting for 68% of picks) are not co-located in the pick-optimised zone in Meridian Health\'s central storeroom. Picker travel time per order averages 34% above peer distribution centre benchmarks — estimated 1.2 FTE productivity loss from suboptimal slotting.',
    keywords: ['storeroom operations', 'distribution centre', 'MMIS', 'inventory management', 'supply chain analytics', 'PAR management'],
  },
  {
    code: 'H3975',
    name: 'OR Satellite Storeroom Replenishment Route Frequency Suboptimal',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'OR satellite storeroom replenishment runs from the central distribution centre occur twice daily on a fixed schedule rather than demand-driven routing. Fourteen percent of OR case delays in the prior quarter were supply-related — analysis shows the majority could have been prevented with on-demand replenishment triggered by Kanban system depletion events rather than fixed-schedule runs.',
    keywords: ['storeroom operations', 'OR storeroom', 'Kanban', 'replenishment', 'supply chain', 'PAR management'],
  },
  {
    code: 'H3976',
    name: 'Supply Chain Staff Turnover Impacting MMIS System Expertise',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Meridian Health supply chain operations experienced 31% annual staff turnover in the prior year — industry average is 18%. MMIS system expertise concentrated in 3–4 senior staff who departed created a 90-day period of degraded PAR management, receiving accuracy, and EDI resolution capability. No documented knowledge transfer or cross-training programme is in place.',
    keywords: ['supply chain workforce', 'MMIS', 'staff turnover', 'storeroom operations', 'supply chain', 'training'],
  },

  // ── Invoice Processing Automation ─────────────────────────────────────────
  {
    code: 'H3977',
    name: 'AP Matching Exception Queue Consuming 3.4 FTE',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Meridian Health accounts payable processes 42,000 supply invoices annually with an 18% three-way match exception rate — 7,560 invoices per year require manual resolution. Each exception averages 28 minutes of AP staff time, consuming 3.4 FTE annually in manual resolution. Automating price tolerance rules in Oracle Procurement Cloud would eliminate 60–70% of exceptions based on root cause analysis.',
    keywords: ['AP matching', 'invoice processing', 'Oracle Procurement Cloud', 'three-way match', 'supply chain', 'Workday Financial'],
    demoRelevant: true,
  },
  {
    code: 'H3978',
    name: 'Early Payment Discount Capture Rate Below 40%',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Meridian Health vendors offer early payment discounts (2/10 net 30) on $84M of annual supply invoices. Invoice processing delays from EDI match failures mean only 38% of eligible invoices are paid within the discount window — foregone early payment discounts total $672K annually against a capture rate achievable at 80%+ with automated exception resolution.',
    keywords: ['AP matching', 'early payment discount', 'invoice processing', 'Oracle Procurement Cloud', 'supply chain', 'cash flow'],
  },
  {
    code: 'H3979',
    name: 'Paper Invoice Processing For Small Vendors Without EDI Capability',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Approximately 680 of Meridian Health\'s 2,400+ suppliers (28%) are not connected to GHX EDI and submit invoices by mail or email PDF. Manual data entry for paper invoices has an error rate of 3.2% versus 0.4% for EDI invoices — paper invoice processing cost per invoice is $14.80 versus $2.40 for EDI. Supplier onboarding to GHX has not been prioritised for this segment.',
    keywords: ['AP matching', 'EDI', 'GHX', 'invoice processing', 'vendor management', 'supply chain'],
  },
  {
    code: 'H3980',
    name: 'Invoice Approval Workflow Timeout Causing Payment Term Violations',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Oracle Procurement Cloud invoice approval workflows route to department budget owners who are not monitoring approval queues during vacation periods — 340 invoices per month timeout and escalate to supply chain leadership, adding an average of 8 days to payment cycle. Contract payment term violations have generated $180K in vendor-imposed late payment interest charges.',
    keywords: ['invoice processing', 'Oracle Procurement Cloud', 'AP matching', 'payment terms', 'workflow', 'supply chain'],
  },

  // ── Implantable Device UDI Tracking ───────────────────────────────────────
  {
    code: 'H3981',
    name: 'Epic Supply Chain UDI Scanning Workflow Not Trained To All OR Staff',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Epic Supply Chain UDI scanning for implantable devices is configured but 34% of circulating nurses and surgical technicians have not completed UDI scanning workflow training. Non-compliance results in manual UDI entry with an error rate 8x higher than scan-based capture — UDI audit trail integrity is insufficient for FDA recall notification purposes.',
    keywords: ['UDI', 'Epic Supply Chain', 'implantable device', 'training', 'recall management', 'charge capture'],
  },
  {
    code: 'H3982',
    name: 'UDI-DI vs. UDI-PI Distinction Not Implemented In MMIS',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Infor MMIS captures UDI Device Identifier (UDI-DI) at item master level but does not capture Production Identifier (UDI-PI) including lot number and expiration date at transaction level for implantable devices. FDA 21 CFR Part 830 and CMS require UDI-PI capture for Class III implants — current MMIS configuration does not meet the regulatory standard.',
    keywords: ['UDI', 'MMIS', 'implantable device', 'FDA', 'lot number', 'Epic Supply Chain'],
    demoRelevant: true,
  },
  {
    code: 'H3983',
    name: 'UDI Data Not Flowing From Epic Into GUDID For Class III Devices',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'FDA Global Unique Device Identification Database (GUDID) requires health systems using Class III implantable devices to submit UDI implant records. Meridian Health\'s Epic Supply Chain UDI data is not configured for outbound GUDID submission — audit by the Joint Commission identified 4 device categories without compliant UDI registration workflows, citing patient safety risk from incomplete device traceability.',
    keywords: ['UDI', 'GUDID', 'Epic Supply Chain', 'FDA', 'implantable device', 'recall management'],
  },

  // ── Purchased Services Contract Management ────────────────────────────────
  {
    code: 'H3984',
    name: 'Purchased Services Auto-Renewal Rate 78% Without Value Review',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Seventy-eight percent of purchased services contracts at Meridian Health auto-renew without a formal value assessment. Coupa contract management alert for renewal review is set at 30 days — insufficient lead time for competitive sourcing. Syntegrity Analytics identifies $18.4M in purchased services contracts renewing without competitive review in the next 12 months.',
    keywords: ['purchased services', 'contract management', 'Coupa', 'Syntegrity Analytics', 'auto-renewal', 'vendor management'],
    demoRelevant: true,
  },
  {
    code: 'H3985',
    name: 'Purchased Services Contract Performance Metrics Not Defined',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Meridian Health purchased services contracts for consulting, IT, and facilities services define deliverables and fees but 71% lack measurable performance metrics or key performance indicators. Without contractual performance standards, underperforming vendors cannot be held to contractual remedies — three major consulting engagements delivered below agreed scope with no contract recourse exercised.',
    keywords: ['purchased services', 'contract management', 'Coupa', 'vendor management', 'SLA', 'performance metrics'],
  },
  {
    code: 'H3986',
    name: 'Purchased Services Spend Approval Thresholds Bypassed Via PO Splitting',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Oracle Procurement Cloud purchase order approval thresholds require CFO approval for purchased services engagements over $250K. Internal audit identified 34 instances of PO splitting — single engagements split into multiple POs each below $250K to avoid the approval threshold. Total circumvented PO value of $4.8M in the audit period represents a procurement controls failure.',
    keywords: ['purchased services', 'Oracle Procurement Cloud', 'procurement controls', 'PO splitting', 'vendor management', 'compliance'],
  },
  {
    code: 'H3987',
    name: 'IT Outsourcing Contract Scope Creep Without Change Control',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Meridian Health\'s primary IT managed services contract has grown from $12M to $18.4M annually through change orders executed by IT leadership without supply chain or legal review. SAP Ariba change order tracking shows 47 scope amendments with average value of $136K — change order approval workflow does not require supply chain review for IT service scope changes above $50K.',
    keywords: ['purchased services', 'IT outsourcing', 'SAP Ariba', 'contract management', 'change order', 'scope creep'],
  },

  // ── Supply Chain Workforce ────────────────────────────────────────────────
  {
    code: 'H3988',
    name: 'Supply Chain Staff Lacking Clinical Value Analysis Competency',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Clinical value analysis committee engagement requires supply chain staff with sufficient clinical literacy to evaluate evidence claims and facilitate physician conversations about standardisation. Meridian Health\'s supply chain team has no staff with formal AHRMM clinical value analysis certification (CVAHP) — value analysis recommendations are perceived as financially driven without clinical credibility.',
    keywords: ['supply chain workforce', 'clinical value analysis', 'AHRMM', 'CVAHP', 'PPI', 'training'],
  },
  {
    code: 'H3989',
    name: 'Procurement Staff Not Certified In Healthcare Contracting',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Meridian Health\'s procurement team of 14 staff includes only 2 with formal healthcare supply chain certification (CMRP or CPSM). Contract negotiation skills, GPO programme management, and healthcare-specific regulatory knowledge are identified as competency gaps in the last supply chain workforce assessment. Certification support programme has not been funded.',
    keywords: ['supply chain workforce', 'procurement', 'CMRP', 'CPSM', 'training', 'GPO'],
  },
  {
    code: 'H3990',
    name: 'Supply Chain Succession Planning Absent For Senior Roles',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Three of four senior supply chain leadership positions at Meridian Health have no documented succession plan or identified internal successor. Average tenure in these roles is 8.2 years — departure of any one creates significant institutional knowledge loss for GPO relationship management, MMIS configuration, and major vendor contracts.',
    keywords: ['supply chain workforce', 'succession planning', 'supply chain', 'vendor management', 'MMIS', 'GPO'],
  },
  {
    code: 'H3991',
    name: 'Supply Chain Analytics Capability Not Keeping Pace With Data Availability',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'GHX, Curvo, Definitive Healthcare, and Infor MMIS collectively generate substantially more data than Meridian Health supply chain staff can analyse. Analytics tools are licensed but used in fewer than 30% of active supply decisions — staff lack SQL and data visualisation skills needed to self-serve analytics without vendor professional services support.',
    keywords: ['supply chain analytics', 'supply chain workforce', 'Curvo', 'GHX', 'MMIS', 'data analytics'],
  },

  // ── Supply Chain Technology Failures ──────────────────────────────────────
  {
    code: 'H3992',
    name: 'MMIS Upgrade Deferred Creating Integration Debt With Epic',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Meridian Health\'s Infor MMIS is running a version released in 2018 — current version is 5 major releases ahead. Epic Supply Chain module integration requires MMIS API endpoints deprecated in the current MMIS version. Epic go-live for Storeroom Management has been delayed 9 months due to MMIS integration incompatibility rather than Epic readiness.',
    keywords: ['MMIS', 'Epic Supply Chain', 'supply chain technology', 'ERP', 'integration', 'Infor'],
    demoRelevant: true,
  },
  {
    code: 'H3993',
    name: 'Prodigo Automated Procurement Rules Not Enforcing GPO Compliance',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Prodigo automated procurement configuration allows users to override GPO contract routing with a one-click justification that requires no manager approval. Override usage has grown from 4% of orders in year one to 19% currently — the override pathway is being used as a workaround for GPO-contracted items that are temporarily backordered rather than triggering the proper shortage substitution protocol.',
    keywords: ['Prodigo', 'GPO', 'automated procurement', 'contract compliance', 'supply chain technology', 'MMIS'],
  },
  {
    code: 'H3994',
    name: 'Hybrent Supply Chain Platform Data Not Synchronised With MMIS',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Meridian Health piloted Hybrent healthcare supply chain platform in ambulatory surgery centres where full MMIS deployment was not justified. Hybrent inventory data is not synchronised with the central Infor MMIS — enterprise-level supply analytics cannot consolidate ambulatory and acute care supply spend, understating total spend by an estimated $8.7M.',
    keywords: ['Hybrent', 'MMIS', 'supply chain technology', 'supply chain analytics', 'inventory management', 'ambulatory'],
  },
  {
    code: 'H3995',
    name: 'Lawson S3 Legacy System Still Active For Specialty Pharmacy Supply',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Meridian Health\'s specialty pharmacy supply chain remains on Lawson S3 legacy ERP rather than migrating to Infor CloudSuite. Dual-system operation requires daily manual reconciliation between Lawson S3 and Oracle Procurement Cloud for specialty drug purchase orders — 0.8 FTE is consumed by reconciliation that system migration would eliminate.',
    keywords: ['Lawson S3', 'MMIS', 'supply chain technology', 'ERP', 'pharmacy supply chain', 'legacy system'],
  },
  {
    code: 'H3996',
    name: 'Coupa Integration With Oracle Procurement Cloud Creating Contract Duplication',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Coupa contract management and Oracle Procurement Cloud are both used for supply contracts — Coupa was implemented for purchased services while Oracle is used for medical-surgical supply. Contracts spanning both categories are duplicated across systems with diverging amendment histories. Legal cannot confirm which system contains the authoritative contract version.',
    keywords: ['Coupa', 'Oracle Procurement Cloud', 'contract management', 'supply chain technology', 'purchased services', 'vendor management'],
  },

  // ── Additional GPO Compliance Patterns ────────────────────────────────────
  {
    code: 'H3997',
    name: 'GPO Administrative Fee Reporting Not Audited By Meridian Health',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'GPO administrative fees (typically 2–3% of contracted purchases paid by vendors to the GPO) are disclosed in Vizient and Premier contracts but Meridian Health does not audit whether vendor pricing reflects GPO administrative fee pass-through. Independent analysis of six product categories found admin fee costs embedded in contracted pricing without GPO fee offset — estimated impact of $1.1M annually.',
    keywords: ['GPO', 'administrative fee', 'Vizient', 'Premier', 'contract compliance', 'supply chain analytics'],
  },
  {
    code: 'H3998',
    name: 'GPO Contract Bundling Incentive Not Evaluated Against Spend Optimality',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'Vizient and Premier offer enhanced pricing tiers for committed bundle purchasing across product categories. Meridian Health supply chain has not modelled whether accepting bundle pricing requirements produces a better total value outcome versus optimising each category independently. Three pending bundle offers with estimated $1.8M incentive value are unanalysed.',
    keywords: ['GPO', 'Vizient', 'Premier', 'bundle pricing', 'contract compliance', 'supply chain analytics'],
  },
  {
    code: 'H3999',
    name: 'New Facility Onboarding Supply Chain Integration Delayed 6+ Months',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'When Meridian Health acquired a community hospital 18 months ago, supply chain integration — GPO contract extension, MMIS configuration, GHX EDI connectivity, and Prodigo automated procurement deployment — took 8.3 months to complete. During the transition, the acquired facility purchased at retail pricing with no GPO compliance, costing an estimated $2.4M above what GPO pricing would have achieved.',
    keywords: ['supply chain', 'facility onboarding', 'GPO', 'MMIS', 'GHX', 'integration'],
    demoRelevant: true,
  },


];
