// seed-banking-dom12-data-governance-part2.ts
// Banking genome patterns — Data Governance & BCBS 239 (part 2)
// Code range: B3460–B3519  (60 patterns)
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

export const BANKING_DOM12_DATA_GOVERNANCE_PART2_PATTERNS: PatternSeed[] = [

  // ── Data Quality: Lineage, Controls, BCBS 239 ────────────────────────────
  {
    code: 'B3460',
    name: 'Data Lineage Coverage Drops Below 60 Percent After Core Banking Upgrade',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's documented BCBS 239 data lineage covered 78% of critical data elements before the core banking platform upgrade, but post-migration validation finds that 38% of previously documented lineage paths are broken because the upgrade changed internal table names, field structures, and ETL extraction procedures without a corresponding lineage update process. BCBS 239 Principle 2 requires that data lineage documentation be maintained as a current, verified record of actual data flows rather than a historical snapshot; the upgrade-induced lineage gap leaves the bank unable to certify the accuracy of DFAST submission data for the post-migration reporting period, and the Federal Reserve examiner requests a 90-day lineage remediation plan as a condition of accepting the next stress test submission.`,
    keywords: ['BCBS 239', 'data lineage', 'core banking upgrade', 'DFAST', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3461',
    name: 'Data Quality Control Failures Not Linked to Financial Restatement Risk Assessment',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's data quality exception reports track the number and severity of data quality failures in the regulatory reporting environment but do not assess whether any exception — individually or in aggregate — rises to a level of materiality that would require disclosure in the bank's financial statements or regulatory submissions. BCBS 239 and DAMA-DMBOK governance frameworks require that material data quality failures in the regulatory reporting chain be evaluated against financial reporting materiality thresholds to determine whether corrections or disclosures are required; without a linkage between data quality exception management and financial materiality assessment, the bank may submit regulatory reports containing data quality-driven errors without making the determination required by GAAP and SEC financial reporting standards.`,
    keywords: ['BCBS 239', 'data quality', 'DAMA-DMBOK', 'financial materiality', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3462',
    name: 'Data Profiling Not Run on Post-Transformation Datasets Before Regulatory Load',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital performs data profiling on source system extracts before ETL transformation but does not re-run data profiling on the transformed datasets immediately before they are loaded into the regulatory reporting data mart, leaving a validation gap for transformation-introduced errors such as precision loss, null population during join operations, and date format conversion failures. DAMA-DMBOK quality control practices and BCBS 239 data accuracy standards require that data quality validation be performed at each material stage of the data production pipeline, including post-transformation, not only at source ingestion; without post-transformation profiling, ETL-introduced defects pass through quality gates into the regulatory data mart where they are certified as source-clean data, producing false-positive quality attestations for CCAR and DFAST submission datasets.`,
    keywords: ['BCBS 239', 'data profiling', 'DAMA-DMBOK', 'ETL validation', 'data quality'],
    subTopic: 'data-quality',
  },
  {
    code: 'B3463',
    name: 'BCBS 239 Data Accuracy Threshold Not Met for Counterparty Credit Risk Exposures',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's BCBS 239 data accuracy measurement for counterparty credit risk exposures — derivative notionals, collateral values, and netting set aggregates — shows a 6.4% error rate against the bank's own 1% accuracy threshold, driven by mismatches between the front-office trading system and the credit risk aggregation platform that are not resolved intraday. BCBS 239 Principle 3 requires that risk data accuracy be measured and that material inaccuracies be escalated and resolved; the 6× breach of the self-imposed accuracy threshold for CCR exposures affects the bank's SA-CCR capital calculation accuracy, and Federal Reserve examination of the capital adequacy reporting identifies the intraday reconciliation gap as a systemic data quality control failure that must be remediated before the next CCAR submission.`,
    keywords: ['BCBS 239', 'SA-CCR', 'counterparty credit risk', 'data accuracy', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3464',
    name: 'Data Quality Certification Signed by IT Without Business Owner Attestation',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's quarterly data quality certification for regulatory reporting datasets is signed by the IT data engineering lead rather than the business data owner accountable for the accuracy and completeness of the reported metrics, based on the assertion that IT manages the data production pipeline and is best positioned to certify data quality. BCBS 239 governance principles and DAMA-DMBOK accountability standards require that data quality certifications for regulatory reporting be attested by the business owner with domain knowledge of what the data is supposed to represent, not only by the technical team responsible for its delivery; OCC examiners reviewing the certification process find that the IT signatory has no visibility into whether data values are business-correct — only that fields are populated and within format constraints.`,
    keywords: ['BCBS 239', 'data quality certification', 'DAMA-DMBOK', 'OCC guidance', 'business owner attestation'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3465',
    name: 'Referential Integrity Violations in Risk Reporting Database Not Remediated',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's credit risk aggregation database contains 12,400 orphaned records — loan records whose obligor identifiers do not match any record in the master obligor table — that were created during a data migration two years prior and have never been remediated because the data ownership of the orphaned records is disputed between the origination and servicing teams. DAMA-DMBOK and BCBS 239 data integrity requirements prohibit the use of data with unresolved referential integrity violations in regulatory reporting, as orphaned records represent exposures without a valid counterparty that cannot be correctly aggregated into concentration risk and single-borrower limit calculations; the orphaned records collectively represent $180M in outstanding balances that are excluded from the single-borrower exposure calculations in the bank's current CCAR submission.`,
    keywords: ['BCBS 239', 'referential integrity', 'DAMA-DMBOK', 'CCAR', 'data governance'],
    subTopic: 'data-quality',
  },
  {
    code: 'B3466',
    name: 'Data Quality Trend Reporting Absent — Point-in-Time Measures Replace Longitudinal Tracking',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's data quality dashboard displays current-period quality scores for each critical data element but does not track quality trend lines over rolling 12-month periods, making it impossible to distinguish whether the current 94% completeness score for a CCAR dataset represents a stable quality level, a short-term improvement after remediation, or a post-remediation regression. BCBS 239 data quality measurement standards and DAMA-DMBOK quality management practices recommend longitudinal quality tracking as the basis for governance oversight because point-in-time scores without trend context cannot support the board's assessment of whether the data governance program is achieving durable improvement or managing a chronic quality deficit through repeated tactical remediation.`,
    keywords: ['BCBS 239', 'DAMA-DMBOK', 'data quality', 'longitudinal tracking', 'data governance'],
    subTopic: 'data-quality',
  },
  {
    code: 'B3467',
    name: 'BCBS 239 Completeness Metric Counts Records Not Fields — Misleading Quality Signal',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital measures BCBS 239 data completeness by calculating the percentage of records with at least one populated field, rather than measuring field-level completeness for each critical data element individually; this approach produces a reported completeness rate of 99.2% for the DFAST loan dataset while field-level analysis reveals that collateral type is absent for 31% of records and current collateral value is absent for 18% of records — both BCBS 239-designated CDEs. BCBS 239 Principle 3 and DAMA-DMBOK quality dimension standards require completeness measurement at the field level for each designated CDE, not at the record level; record-level completeness is a necessary but insufficient quality measure that systematically overstates the bank's BCBS 239 completeness compliance and masks field-level gaps that affect stress test collateral recovery assumptions.`,
    keywords: ['BCBS 239', 'data completeness', 'DAMA-DMBOK', 'DFAST', 'data quality'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3468',
    name: 'Data Quality Rules for Interest Rate Risk Reporting Not Aligned With IRRBB Standards',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's data quality rules for interest rate risk in the banking book reporting — rate reset dates, contractual repricing terms, and behavioral maturity assumptions — were defined during the IRRBB framework implementation but have not been updated to reflect the Basel Committee's 2022 revised IRRBB standards or the Federal Reserve's subsequent supervisory expectations for rate sensitivity data quality. BCBS 239 requires that data quality standards for each risk reporting domain reflect the regulatory definitions applicable to that domain; quality rules calibrated to the pre-2022 IRRBB framework may pass records that do not satisfy the revised behavioral maturity documentation requirements, causing the bank's EVE and NII sensitivity calculations to be based on incompletely governed behavioral assumption data.`,
    keywords: ['BCBS 239', 'IRRBB', 'interest rate risk', 'Federal Reserve', 'data quality'],
    subTopic: 'data-quality',
  },
  {
    code: 'B3469',
    name: 'Operational Risk Loss Event Data Completeness Below BCBS Minimum for AMA Migration',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's operational risk loss event database has a data completeness rate of 71% for mandatory fields — business line classification, Basel II event category, and gross loss amount — falling below the BCBS 239 data completeness standards and the Federal Reserve's supervisory guidance minimum of 85% completeness for operational risk loss data used in capital modeling. BCBS 239 data accuracy requirements apply to all risk data used in regulatory capital calculations, including operational risk loss data used in scenario analysis and capital adequacy assessment; the 71% completeness rate means that the bank's operational risk capital model is calibrated on a dataset with a material quality deficit, creating a capital adequacy risk that the Federal Reserve supervisory team identifies during the operational resilience component of the annual examination.`,
    keywords: ['BCBS 239', 'operational risk', 'loss event data', 'Federal Reserve', 'Basel III'],
    subTopic: 'data-quality',
  },

  // ── Master Data Management: Golden Record, MDM Governance ────────────────
  {
    code: 'B3470',
    name: 'MDM Platform Customer Identity Resolution Fails for Trust Account Beneficial Owners',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's MDM platform resolves individual customer identities for retail and commercial deposit accounts but does not extend identity resolution logic to beneficial owners of trust accounts and estate accounts, whose underlying individuals are known to the bank's trust administration system but are not linked to the MDM golden record for the same individuals who hold retail accounts. BCBS 239 counterparty aggregation requirements and GLBA customer relationship governance expect that all exposures to an individual be consolidated under a single customer identity for risk concentration and relationship management purposes; the gap in trust account beneficial owner identity resolution causes understatement of individual exposure concentrations and prevents the compliance team from reliably identifying cross-product relationship patterns required for CDD refreshes under the BSA/AML FinCEN Customer Due Diligence rule.`,
    keywords: ['MDM', 'BCBS 239', 'beneficial owner', 'GLBA', 'CDD rule'],
    demoRelevant: true,
    subTopic: 'master-data-management',
  },
  {
    code: 'B3471',
    name: 'MDM Hierarchy Synchronization Latency Causes Single-Borrower Limit Breach Underreporting',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's MDM platform refreshes customer hierarchy data — parent-subsidiary relationships and affiliated entity linkages — on a weekly batch cycle, but the bank's credit risk aggregation platform calculates single-borrower exposure limits daily using the prior week's hierarchy snapshot; when a large borrower restructures its corporate family in between weekly MDM refreshes, the credit risk system continues aggregating exposure under the pre-restructuring hierarchy for up to seven days, potentially missing a single-borrower limit breach for the restructured entity. BCBS 239 Principle 2 requires that counterparty hierarchies used in risk aggregation be current and that the aggregation system reflect organizational changes within a timeframe consistent with the bank's risk appetite; a seven-day hierarchy synchronization lag is identified by Federal Reserve examiners as a material gap in the bank's single-borrower concentration risk framework.`,
    keywords: ['MDM', 'BCBS 239', 'single-borrower limit', 'counterparty hierarchy', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'master-data-management',
  },
  {
    code: 'B3472',
    name: 'MDM Product Master Lacks Risk Classification Attributes for CECL Segmentation',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's MDM product master defines financial product types for the bank's commercial and retail loan portfolio but does not include the CECL-required risk classification attributes — loan purpose, collateral type category, and geographic market segment — that the bank's CECL model uses as segmentation variables for probability of default estimation. BCBS 239 CDE governance and the FASB ASC 326 CECL implementation requirements expect that segmentation attributes used in expected credit loss models be governed as critical data elements with documented definitions, owner accountability, and quality measurement; when the CECL model team uses product master data lacking governed risk classification attributes, they substitute analyst-defined mappings that vary across the quarterly production cycle, introducing segmentation inconsistency into the allowance calculation.`,
    keywords: ['MDM', 'CECL', 'BCBS 239', 'ASC 326', 'loan segmentation'],
    demoRelevant: true,
    subTopic: 'master-data-management',
  },
  {
    code: 'B3473',
    name: 'Duplicate Counterparty Records in MDM Create CRA Reporting Inaccuracies',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's MDM duplicate resolution logic matches commercial borrowers on tax identification number and legal name, but fails to deduplicate entities that use DBAs (doing business as names) or that have had name changes following acquisitions, creating a 2.8% duplicate rate in the commercial entity registry that affects CRA small business lending geographies and the HMDA loan application register. CFPB CRA examination guidance and FFIEC HMDA reporting requirements expect accurate borrower identification data underlying geographic distribution reports; duplicates in the commercial entity registry cause both geographic and income-tier miscategorization of a share of commercial loans in the CRA performance evaluation dataset, creating a risk of adverse CRA findings attributable to data quality rather than genuine lending performance.`,
    keywords: ['MDM', 'CRA', 'HMDA', 'FFIEC', 'duplicate entity resolution'],
    subTopic: 'master-data-management',
  },
  {
    code: 'B3474',
    name: 'MDM Governance Policy Not Enforced for Core Banking System Inserts — Bypasses Golden Record',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's MDM governance policy requires that all new commercial customer records be created through the MDM hub, which applies match-and-merge logic before provisioning a golden record that is then synchronized to the core banking system; branch operational staff are permitted to create customer records directly in the core banking system when MDM connectivity is unavailable, and these direct-entry records are not subsequently reviewed against the MDM hub for deduplication. DAMA-DMBOK and BCBS 239 master data governance standards require that all customer record creation flow through the governed MDM process to maintain the integrity of the golden record; the bypass exception has produced 8,400 direct-entry commercial records over 24 months that have never been matched against the MDM hub, creating an undeclared segment of the commercial customer portfolio operating outside the bank's data governance framework.`,
    keywords: ['MDM', 'DAMA-DMBOK', 'BCBS 239', 'golden record', 'core banking'],
    demoRelevant: true,
    subTopic: 'master-data-management',
  },
  {
    code: 'B3475',
    name: 'Account-Level MDM Linkage to Customer Missing for 15 Percent of Retail Portfolio',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's MDM system stores customer golden records and account records as separate entities linked by a relationship table, but 15% of retail deposit and loan accounts have no MDM customer linkage due to historical data migration gaps from a 2019 core banking conversion, leaving these accounts unassociated with a customer identity in the bank's enterprise data environment. BCBS 239 data completeness requirements and GLBA customer relationship governance expect all accounts to have a resolvable customer identity for risk aggregation, cross-sell governance, and regulatory reporting; the 15% unlinkage rate affects the bank's ability to produce accurate customer-level profitability and attrition models and causes systemic undercounting of total customer relationship depth in the CRA assessment area community development service reports.`,
    keywords: ['MDM', 'BCBS 239', 'GLBA', 'data completeness', 'CRA'],
    subTopic: 'master-data-management',
  },
  {
    code: 'B3476',
    name: 'MDM Data Stewardship Operating Model Not Scaled for Merger Integration Volume',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's MDM operating model supports a data stewardship team of six analysts who govern match-merge decisions for the existing customer portfolio, but the bank's pending acquisition will introduce 180,000 new commercial customer records that require match-merge evaluation against the existing MDM hub within a 90-day regulatory conversion timeline. DAMA-DMBOK MDM program management standards and OCC core conversion guidance require that MDM operating capacity be assessed and scaled before an integration event of this scale; the six-analyst team working at normal throughput would require 18 months to evaluate the incoming records without automation augmentation, meaning the bank will face a choice between accepting a high auto-merge error rate that creates duplicate records or delaying the conversion timeline and triggering OCC guidance on post-merger integration readiness.`,
    keywords: ['MDM', 'DAMA-DMBOK', 'OCC guidance', 'merger integration', 'core conversion'],
    demoRelevant: true,
    subTopic: 'master-data-management',
  },
  {
    code: 'B3477',
    name: 'MDM Golden Record Confidence Score Not Exposed to Downstream Risk Systems',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's MDM platform assigns a confidence score to each golden record indicating the quality and certainty of the match-merge determination, but this confidence score is not propagated to the downstream credit risk, AML, and regulatory reporting systems that consume the golden record, meaning downstream systems treat all MDM-resolved records as equally authoritative regardless of matching certainty. DAMA-DMBOK data quality transparency standards and BCBS 239 data accuracy principles require that the uncertainty inherent in probabilistic data quality processes — such as MDM fuzzy matching — be made visible to data consumers so that risk analysts can apply appropriate caution to low-confidence records; without confidence score propagation, the AML transaction monitoring system applies the same risk-based alert thresholds to high-confidence and low-confidence customer identities, creating both over-alerting on correctly merged records and under-alerting on split entities.`,
    keywords: ['MDM', 'DAMA-DMBOK', 'BCBS 239', 'golden record confidence', 'AML'],
    subTopic: 'master-data-management',
  },
  {
    code: 'B3478',
    name: 'MDM Platform Cannot Support Real-Time Golden Record Queries for Digital Onboarding',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's MDM platform is architected for batch processing and provides a daily refreshed golden record view, but the bank's new digital onboarding platform requires real-time customer identity lookup at account opening to determine whether an applicant is an existing customer and to retrieve their risk profile; the MDM platform cannot respond to real-time queries within the digital onboarding latency budget of 2 seconds, forcing the onboarding platform to use a separate, ungovened identity cache. DAMA-DMBOK and OCC third-party risk management guidance require that customer identity lookups in onboarding workflows use governed, current master data; the ungoverned identity cache diverges from the MDM golden record within 24–48 hours of a customer record change, causing new accounts to be opened for existing customers under duplicate identities that create CDD compliance gaps under the FinCEN Customer Due Diligence rule.`,
    keywords: ['MDM', 'DAMA-DMBOK', 'OCC guidance', 'digital onboarding', 'CDD rule'],
    demoRelevant: true,
    subTopic: 'master-data-management',
  },
  {
    code: 'B3479',
    name: 'MDM Industry Classification Codes Not Mapped to NAICS for CRA Small Business Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's MDM commercial customer master uses the bank's proprietary industry classification scheme for internal risk segmentation and relationship management, but the FFIEC CRA small business lending reporting requirement uses NAICS codes to classify the industries of small business borrowers; the bank does not maintain a governed NAICS code attribute in the MDM master, requiring the CRA reporting team to manually assign NAICS codes to each borrower in the annual CRA data collection process. FFIEC CRA examination guidance and BCBS 239 critical data element governance require that industry classification data used in regulatory reporting be governed with consistent definitions; manual NAICS assignment without a governed MDM attribute produces a 12–15% inconsistency rate when the same borrower's industry classification is compared across consecutive CRA reporting cycles.`,
    keywords: ['MDM', 'CRA', 'NAICS', 'FFIEC', 'BCBS 239'],
    subTopic: 'master-data-management',
  },

  // ── Data Privacy & Governance: CCPA/CPRA, GLBA, PII, Retention ──────────
  {
    code: 'B3480',
    name: 'GLBA Safeguards Rule Data Inventory Not Current — High-Risk Data Locations Undocumented',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's GLBA Safeguards Rule compliance program requires an annual inventory of all locations where customer nonpublic personal information is stored or processed, but the most recent inventory was completed 22 months ago and predates the bank's migration of commercial loan origination to a SaaS platform and the deployment of a cloud-based document management system — both of which host material NPI data. GLBA Safeguards Rule (16 CFR Part 314), as updated by the FTC in 2023, requires a current, accurate inventory of customer NPI as the foundation for the access controls, encryption standards, and disposal requirements in the bank's information security program; an inventory that misses two significant NPI hosting environments leaves the bank in regulatory non-compliance with Safeguards Rule asset management requirements and exposes it to FTC enforcement exposure if a data breach involves the untracked environments.`,
    keywords: ['GLBA Safeguards Rule', 'NPI inventory', 'FTC', 'data privacy governance', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3481',
    name: 'CCPA/CPRA Data Deletion Rights Not Operationalized for Loan Application Rejectees',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital operates in California and is subject to the CCPA/CPRA, which gives consumers the right to request deletion of their personal information; the bank's data deletion workflow is operationalized for current customers but cannot process deletion requests from individuals whose loan applications were declined, because their personal data is retained in the loan origination system under a legal hold tied to ECOA adverse action file retention requirements without a process for partial deletion of non-legally-required fields. CPRA regulations and GLBA privacy governance require that financial institutions maintain a compliant process for responding to deletion rights requests even when some data must be retained for legal or regulatory purposes; the absence of a selective deletion workflow for declined applicants causes the bank to reject all deletion requests from this population with a blanket legal hold citation, which CPRA enforcement guidance identifies as a non-compliant categorical denial of deletion rights.`,
    keywords: ['CCPA/CPRA', 'GLBA', 'data deletion rights', 'ECOA', 'data privacy governance'],
    demoRelevant: true,
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3482',
    name: 'PII Retention Schedule Not Enforced Programmatically — Manual Purge Process Creates Compliance Risk',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's data retention policy specifies that retail customer PII be purged seven years after account closure, but the purge process is executed through a semi-annual manual request to the IT database team that does not cover all storage systems, resulting in PII retention rates of 12–15 years in the loan origination system archive and the core banking system history tables. GLBA Safeguards Rule, CCPA/CPRA data minimization principles, and OCC data governance examination expectations require that retention schedules be enforced programmatically with automated deletion triggers rather than manual processes that create compliance gaps; when a state regulator requests evidence of the bank's data minimization practices in response to a consumer complaint, the bank cannot demonstrate systematic PII purge enforcement, creating GLBA Safeguards Rule exposure and CPRA data minimization obligation risk.`,
    keywords: ['GLBA Safeguards Rule', 'CCPA/CPRA', 'data retention', 'PII purge', 'OCC guidance'],
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3483',
    name: 'Third-Party Data Processor Subcontracting Clause Missing From Vendor Agreements',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's data processing agreements with third-party vendors that process customer NPI — including the document management SaaS, the digital lending platform, and the marketing analytics provider — do not include clauses prohibiting subcontracting of NPI processing to downstream vendors without the bank's prior written consent, as required by the GLBA Safeguards Rule and California's CCPA/CPRA service provider requirements. OCC third-party risk management guidance (OCC 2013-29) and GLBA Safeguards Rule obligations require that data processing agreements with NPI handlers include subcontracting restrictions and audit rights to ensure that the bank maintains visibility into its full NPI processing chain; the absence of subcontracting restrictions means that the digital lending platform has subcontracted loan application data processing to a credit analytics firm the bank has not evaluated under its TPRM framework.`,
    keywords: ['GLBA Safeguards Rule', 'OCC 2013-29', 'CCPA/CPRA', 'third-party data processor', 'NPI'],
    demoRelevant: true,
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3484',
    name: 'Data Minimization Controls Not Applied to Marketing Analytics Data Warehouse',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's marketing analytics data warehouse contains full customer profiles — including transaction histories, account balances, and credit behavior attributes — replicated from the core banking system for customer segmentation and campaign targeting; the warehouse does not apply data minimization controls that would restrict the fields replicated to only those necessary for permitted marketing purposes under GLBA's notice and opt-out framework. GLBA privacy rule and CCPA/CPRA data minimization principles require that customer data use be limited to the disclosed purposes for which consent or notice was given; the marketing warehouse retains financial transaction detail that exceeds what is required for the defined marketing analytics use cases, creating regulatory exposure if a data breach or regulatory examination reveals that the bank retains more granular customer financial data in an analytics environment than its privacy notice discloses.`,
    keywords: ['GLBA', 'CCPA/CPRA', 'data minimization', 'marketing analytics', 'data privacy governance'],
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3485',
    name: 'Privacy Impact Assessment Process Not Triggered by New Data Use Initiatives',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's data governance policy requires a Privacy Impact Assessment before deploying any new system or process that materially changes how customer NPI is collected, used, or shared, but the PIA requirement is not embedded in the IT project intake process, causing 60% of new data initiatives — including the deployment of a customer churn prediction model that uses NPI from six data sources — to launch without a completed PIA. GLBA Safeguards Rule and OCC data governance examination standards require that privacy governance be integrated into the product and technology development lifecycle to ensure that NPI use changes are evaluated for regulatory and privacy risk before deployment; PIAs conducted retroactively after system launches cannot achieve the risk mitigation purpose that GLBA Safeguards Rule governance requires, and the OCC cites the missing PIA for the churn model as a program governance gap.`,
    keywords: ['GLBA Safeguards Rule', 'OCC guidance', 'privacy impact assessment', 'NPI', 'data privacy governance'],
    demoRelevant: true,
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3486',
    name: 'PII Discovery Scan Does Not Cover Unstructured Data in Email Archives',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's GLBA Safeguards Rule PII discovery program scans structured databases and file servers for customer NPI but does not include the bank's Microsoft Exchange email archive, which contains 12 years of internal correspondence including customer NPI transmitted via email during account opening, loan processing, and dispute resolution processes. GLBA Safeguards Rule asset management requirements and CCPA/CPRA data mapping obligations require that all repositories hosting customer personal information — including unstructured data in email systems — be identified, documented, and subject to appropriate access controls and retention enforcement; email archive NPI that is outside the GLBA discovery perimeter is not subject to access controls, retention rules, or deletion rights processing, creating a systemic gap in the bank's Safeguards Rule compliance posture.`,
    keywords: ['GLBA Safeguards Rule', 'CCPA/CPRA', 'PII discovery', 'unstructured data', 'data privacy governance'],
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3487',
    name: 'Data Subject Access Request Fulfillment Exceeds CCPA 45-Day Statutory Deadline',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital receives California consumer requests to know what personal information the bank has collected, and the current DSAR fulfillment process — which requires manual data extraction from six systems of record and a legal review of each response — takes an average of 58 days to complete, exceeding the CCPA/CPRA 45-day statutory maximum response period for 62% of requests. CCPA/CPRA imposes a $2,500 per unintentional violation civil penalty for DSAR non-compliance, with repeat violations subject to $7,500 per intentional violation; a 62% non-compliance rate on DSAR timeliness represents systemic statutory non-compliance that the California Privacy Protection Agency's enforcement program is actively investigating in the financial services sector following high-profile enforcement actions in 2024.`,
    keywords: ['CCPA/CPRA', 'DSAR', 'GLBA', 'data subject rights', 'data privacy governance'],
    demoRelevant: true,
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3488',
    name: 'Opt-Out Preference Not Honored Across All Data Sharing Channels Due to System Siloes',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's customers who exercise their GLBA opt-out right to prohibit information sharing with nonaffiliated third parties have their opt-out recorded in the core banking system, but three downstream platforms — the digital banking application, the mortgage servicing system, and the credit card processing gateway — do not receive real-time opt-out status updates and continue to share data with third-party marketing partners and analytics providers until the next monthly batch synchronization. GLBA Privacy Rule (12 CFR Part 1016) requires that financial institutions honor opt-out elections before making any subsequent disclosures to nonaffiliated third parties; the batch synchronization latency means the bank violates GLBA's opt-out honoring requirement for customers who exercise opt-out rights in the interval between monthly syncs, creating Regulation P compliance risk and CFPB examination exposure.`,
    keywords: ['GLBA', 'Regulation P', 'CFPB', 'opt-out preference', 'data privacy governance'],
    demoRelevant: true,
    subTopic: 'data-privacy-governance',
  },
  {
    code: 'B3489',
    name: 'Employee PII Governance Policy Not Extended to HR Analytics Platform',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's data governance program establishes controls for customer NPI under GLBA but does not formally extend comparable governance controls to employee personal data that is being aggregated into an HR analytics platform used for workforce planning, turnover prediction, and compensation benchmarking. California CPRA extends employment data privacy rights to employees of covered businesses and requires data minimization, retention enforcement, and privacy notice obligations for employee PII; the absence of a data governance framework for employee PII in the HR analytics platform creates CPRA compliance exposure for California-based employees and leaves the bank without audit-ready documentation of how employee data is governed, retained, and protected — a gap that employment privacy advocates and plaintiffs' attorneys are actively targeting in the financial services sector.`,
    keywords: ['CCPA/CPRA', 'employee PII', 'GLBA', 'HR analytics', 'data privacy governance'],
    subTopic: 'data-privacy-governance',
  },

  // ── AI Data Governance: LLM Risk, GenAI Data Quality, Regulatory Hooks ──
  {
    code: 'B3490',
    name: 'LLM Training Data Includes Unmasked Customer NPI Without GLBA Data Governance Review',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's data science team fine-tunes a large language model for internal customer service automation using a training corpus extracted from customer service interaction logs, loan application narratives, and dispute resolution records — all of which contain unmasked customer NPI including names, Social Security numbers, account numbers, and income figures — without routing the training data assembly through the bank's GLBA Safeguards Rule data governance review. GLBA Safeguards Rule Section 314.4(b) requires that any new processing activity involving customer NPI be assessed against the bank's information security program, including AI model training; using unmasked NPI as LLM training data without a Safeguards Rule review creates regulatory risk under GLBA and potential FTC enforcement exposure, as the trained model may inadvertently memorize and reproduce specific customer financial details in its outputs.`,
    keywords: ['LLM training data', 'GLBA Safeguards Rule', 'unmasked NPI', 'AI data governance', 'FTC'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3491',
    name: 'AI Data Quality Tool Bypasses BCBS 239 Data Lineage Documentation Requirements',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an AI-powered automated data quality remediation tool that identifies and corrects data quality issues in the regulatory reporting data mart — resolving null values, standardizing date formats, and imputing missing reference codes — without creating data lineage documentation for the corrections applied, as the tool does not integrate with the bank's BCBS 239 lineage management system. BCBS 239 Principle 2 requires that all data transformations applied to critical data elements used in regulatory reporting be documented in the lineage record so that regulators can trace the provenance of reported values to their source; AI-applied corrections that are not recorded in the lineage system create a class of undocumented data transformations that violate BCBS 239 lineage completeness requirements and prevent the bank from demonstrating the reproducibility of regulatory submission figures to Federal Reserve examiners.`,
    keywords: ['AI data quality tool', 'BCBS 239', 'data lineage documentation', 'Federal Reserve', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3492',
    name: 'GenAI Credit Memo Summarization Using Non-Governed Source Data Without SR 11-7 Review',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial lending team deploys a GenAI tool that automatically summarizes borrower credit memos by extracting financial metrics from loan origination system data and generating a structured credit summary presented to underwriters; the tool sources financial data from an intermediate analytical layer that is not governed as a BCBS 239 critical data element source and is not included in the bank's SR 11-7 model inventory, despite the fact that the AI-generated summaries directly influence credit approval decisions. SR 11-7 model risk management guidance and BCBS 239 data accuracy requirements apply to AI tools that generate credit decision inputs from bank data; a GenAI tool operating outside the SR 11-7 model inventory framework lacks the validation, ongoing monitoring, and outcome tracking that OCC examiners expect for any analytical tool materially influencing credit decisions in a bank operating under an MRM consent order.`,
    keywords: ['GenAI credit memo', 'SR 11-7', 'BCBS 239', 'model inventory', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3493',
    name: 'AI Adverse Action Explanation Generator Draws From Unvalidated Feature Data',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital uses an AI tool to generate ECOA-required adverse action reasons from rejected loan application data, with the tool selecting the top contributing factors from the underwriting model's feature importance rankings; the tool pulls feature values from a real-time data feed that is not subject to BCBS 239 data quality governance or the SR 11-7 model input data validation required for the bank's OCC-registered credit decision models. Regulation B's adverse action notice requirements and CFPB ECOA guidance require that adverse action reasons accurately reflect the specific reasons for denial based on validated credit data; when the AI tool draws feature values from an unvalidated data feed that contains stale credit bureau data, it generates adverse action reasons citing incorrect credit utilization rates, exposing the bank to CFPB Regulation B adverse action accuracy violations and potential fair lending examination findings.`,
    keywords: ['AI adverse action', 'ECOA', 'BCBS 239', 'SR 11-7', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3494',
    name: 'AI AML Typology Training Without Validated Labeled Dataset — False Network Expansion Risk',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an AI graph analytics tool for AML transaction monitoring network expansion — identifying second- and third-degree counterparty relationships among suspicious transaction networks — trained on a labeled dataset of historical STR filings that was assembled by the compliance team without a formal data quality validation confirming that the historical STRs used as positive training examples were correctly filed and are representative of the current customer portfolio mix. FinCEN AML guidance and the OCC's BSA/AML examination procedures require that transaction monitoring models, including AI-enhanced network analysis tools, be validated for their training data quality and representativeness under SR 11-7 model risk principles; a graph AI model trained on a biased or unvalidated STR dataset generates false network expansion alerts that overstate connection density in legitimate commercial networks, producing a 40% increase in SAR referrals that overwhelm the financial intelligence unit without a proportional increase in actionable intelligence.`,
    keywords: ['AI AML typology', 'AML graph AI', 'FinCEN', 'SR 11-7', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3495',
    name: 'LLM SAR Narrative Drafting Cannot Demonstrate Factual Traceability to Source Records',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's AML compliance team uses an LLM to draft Suspicious Activity Report narrative sections from the structured alert data and case notes in the transaction monitoring system; the LLM-generated narratives contain fluent summaries of suspicious activity patterns but the tool does not produce a citation map linking each factual assertion in the narrative to the specific transaction record, account activity, or case note from which it was drawn. FinCEN SAR filing guidance and OCC BSA/AML examination standards require that SAR narratives be factually accurate and based on documented evidence; when FinCEN or law enforcement requests supporting documentation for an AI-drafted SAR narrative, the bank cannot produce a factual trace from narrative statements to underlying transaction evidence, creating a BSA/AML compliance integrity risk and potential FinCEN enforcement exposure for filing materially inaccurate SARs.`,
    keywords: ['LLM SAR narrative', 'FinCEN', 'BSA/AML', 'OCC guidance', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3496',
    name: 'AI Model Monitoring Dashboard Draws From Different Data Source Than Model Training Set',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's SR 11-7 model risk management framework requires ongoing performance monitoring for all registered models, and the bank deploys an AI-powered model monitoring dashboard that tracks distribution shifts, accuracy degradation, and population stability index; however, the dashboard is sourced from a summary data mart that differs in schema, aggregation logic, and refresh cadence from the production data pipeline that feeds the model's live inference environment. SR 11-7 model risk management guidance requires that model monitoring use data from the same production environment that feeds the model to ensure monitoring detects real performance degradation rather than data pipeline differences; monitoring data sourced from a different pipeline introduces artificial variance that causes 30% of drift alerts to be false positives attributable to pipeline divergence rather than genuine model performance issues, exhausting model risk management team capacity on non-actionable monitoring noise.`,
    keywords: ['SR 11-7', 'AI model monitoring', 'BCBS 239', 'model governance', 'data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3497',
    name: 'GenAI Risk Assessment Tool Fed Stale Regulatory Change Feed — Compliance Guidance Outdated',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's regulatory compliance team uses a GenAI tool that synthesizes regulatory change summaries and risk assessment recommendations from a curated regulatory intelligence feed, but the feed is updated quarterly rather than in real time, meaning the GenAI tool is generating compliance risk assessments based on regulatory guidance that may be two to three months out of date at any given time. OCC and Federal Reserve examination preparation requires that compliance risk assessments be based on current regulatory guidance and recent examination findings; a GenAI compliance advisory tool sourced from a stale regulatory feed generates risk assessments that miss recently issued OCC bulletins, Federal Reserve supervisory letters, and FinCEN guidance updates — creating a risk that compliance officers relying on the AI tool's assessments are unaware of new regulatory obligations that have already taken effect.`,
    keywords: ['GenAI compliance tool', 'OCC guidance', 'Federal Reserve', 'AI data governance', 'regulatory intelligence'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3498',
    name: 'AI Fraud Detection Model Training Includes Synthetic Data Not Disclosed in SR 11-7 Validation',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's fraud detection AI model was retrained using a dataset that blends real transaction records with synthetic fraud scenarios generated by the vendor to augment underrepresented fraud types; the model validation documentation submitted for SR 11-7 approval describes the training data as consisting of historical transaction records without disclosing the synthetic data augmentation, leaving the model risk committee unaware that a portion of the training set is vendor-generated. SR 11-7 model documentation standards and OCC model risk examination expectations require that training data composition — including synthetic data augmentation — be disclosed in validation documentation so that the model risk committee can assess whether synthetic data introduces biases or failure modes not present in the bank's actual transaction history; the undisclosed synthetic augmentation becomes an examination finding when the OCC requests training data documentation as part of the bank's consent order model validation remediation.`,
    keywords: ['SR 11-7', 'fraud detection AI', 'synthetic training data', 'model governance', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3499',
    name: 'AI Capital Planning Scenario Generator Produces Stress Paths Without DFAST Boundary Constraints',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's capital planning team uses an AI scenario generation tool to augment its DFAST adverse and severely adverse scenarios with AI-generated macroeconomic stress paths for internal stress testing; the AI tool generates stress scenarios without programmatic constraints enforcing the Federal Reserve's DFAST scenario definition boundaries for unemployment rate maxima, GDP contraction floors, and asset price corridors, resulting in AI-generated scenarios that fall outside the regulatory scenario severity envelope. Federal Reserve DFAST scenario guidance and OCC capital planning supervisory expectations require that internal stress scenarios be designed within a defined regulatory severity framework; AI-generated scenarios outside the DFAST envelope are used in the bank's internal capital adequacy assessment without being flagged as outside-boundary, causing the ICAAP document submitted to regulators to reflect stress test results from regulatory boundary-violating scenarios.`,
    keywords: ['DFAST', 'AI scenario generation', 'BCBS 239', 'Federal Reserve', 'capital planning'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3500',
    name: 'LLM Used for CECL Macroeconomic Forecast Commentary Without Model Risk Validation',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's finance team uses an LLM to generate the macroeconomic forecast commentary included in the quarterly CECL allowance for credit loss disclosure, with the LLM producing narrative explanations of forecast assumptions and their relationship to expected credit loss estimates based on the model's macroeconomic variable inputs; the LLM-generated commentary is not reviewed by the model risk management team as a model output subject to SR 11-7 validation requirements. ASC 326 CECL disclosure standards require that qualitative commentary on macroeconomic assumptions be accurate and consistent with the quantitative model outputs; an LLM that generates commentary without being validated against the actual model assumptions can produce narrative descriptions that are inconsistent with the model's documented inputs, creating a disclosure accuracy risk in the bank's quarterly public financial reporting.`,
    keywords: ['LLM CECL commentary', 'ASC 326', 'SR 11-7', 'CECL', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3501',
    name: 'AI Data Quality Tool Deployed in Production Without Explainability for Compliance Sign-Off',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital deploys an AI-based data quality anomaly detection tool in the regulatory reporting data pipeline that flags and suppresses records it identifies as anomalous based on multivariate pattern recognition; the tool does not provide human-readable explanations for its anomaly determinations, making it impossible for the data governance team to assess whether suppressed records are genuinely erroneous or represent legitimate but unusual exposures that should appear in regulatory reports. BCBS 239 data accuracy standards and SR 11-7 model risk governance require that AI tools making consequential data governance decisions in the regulatory reporting chain be explainable and subject to human oversight; an AI anomaly suppression tool operating as a black box in the regulatory data pipeline creates an undocumented data exclusion mechanism that OCC examiners cannot evaluate for appropriateness during examination of the bank's regulatory reporting controls.`,
    keywords: ['AI data quality tool', 'SR 11-7', 'BCBS 239', 'explainability', 'AI data governance'],
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3502',
    name: 'Vendor GenAI Tool Trains on Bank Customer Data Without DPA Prohibiting Model Training Use',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital uses a vendor-provided GenAI document processing tool to extract and structure data from commercial loan documents; the bank's data processing agreement with the vendor does not include a clause prohibiting the vendor from using customer data processed through the tool to train or fine-tune the vendor's foundation model, and the vendor's terms of service permit model training use of processed data. GLBA Safeguards Rule Section 314.4(f) requires that contracts with service providers include provisions ensuring appropriate safeguards for customer NPI and limiting the vendor's use of the data to the contracted service; OCC 2013-29 third-party risk management guidance requires banks to review vendor data use rights in service contracts; the absence of a model training prohibition in the DPA means the bank's commercial borrower financial data may be incorporated into the vendor's shared model, violating GLBA's limitation on secondary use of customer financial information.`,
    keywords: ['GenAI vendor training', 'GLBA Safeguards Rule', 'OCC 2013-29', 'DPA', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3503',
    name: 'AI Model Documentation Generator Produces Incomplete SR 11-7 Inventory Entries',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital uses an AI documentation generation tool to automatically create SR 11-7 model inventory entries for newly deployed analytical models by extracting metadata from model code repositories and deployment logs; the tool consistently omits model purpose statements, intended use limitations, and governance approval dates from the generated entries because this qualitative information does not exist in structured form in the code repository. SR 11-7 model inventory documentation standards require that each registered model include a purpose statement, intended use scope, known limitations, and a governance approval record; inventory entries lacking these elements are incomplete under OCC examination standards, and a model inventory populated primarily by AI-generated incomplete entries fails to demonstrate the MRM program depth that the bank's consent order remediation requires.`,
    keywords: ['SR 11-7', 'AI documentation generator', 'model inventory', 'OCC guidance', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3504',
    name: 'AI Regulatory Change Impact Analysis Tool Misidentifies Applicability of CFPB Final Rules',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's regulatory compliance team uses an AI tool to assess the applicability and impact of newly issued CFPB final rules to the bank's product lines and data governance controls; the tool's training corpus is limited to publicly available federal register text and does not include the bank's internal product terms, geographic footprint, or customer composition data required to accurately determine whether specific CFPB thresholds and exemptions apply to the bank's specific circumstances. CFPB regulation applicability determinations — including asset-size thresholds, geographic reach provisions, and product type carve-outs — require fact-specific analysis against the bank's actual portfolio and operational characteristics; an AI tool that assesses regulatory applicability without access to the bank's current product and portfolio data produces applicability conclusions that the bank's legal team must completely rework, providing no net efficiency and creating a risk of initial over- or under-compliance responses to new CFPB rules.`,
    keywords: ['AI regulatory analysis', 'CFPB', 'OCC guidance', 'compliance data governance', 'AI data governance'],
    subTopic: 'ai-data-governance',
  },

  // ── Regulatory Data Reporting: BCBS 239, Supervisory Quality ────────────
  {
    code: 'B3505',
    name: 'Supervisory Data Submission System Not Tested for Peak Concurrent User Load',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's regulatory reporting infrastructure — which generates and submits FR Y-9C, Call Report, and CCAR data electronically — has not been load-tested for the concurrent user scenario that occurs at quarter-end when the DFAST data production team, the regulatory reporting analysts, and the senior management review group all access the reporting system simultaneously during the final pre-submission review window. BCBS 239 Principle 4 and OCC operational resilience guidance require that critical regulatory reporting capabilities be tested under realistic peak load conditions; when the Q3 CCAR production cycle experiences a system slowdown during the concurrent review window due to unmanaged database query load, the submission deadline is missed by four hours — an event that the Federal Reserve's CCAR examination team notes as a control environment gap.`,
    keywords: ['BCBS 239', 'CCAR', 'OCC guidance', 'operational resilience', 'supervisory data submission'],
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3506',
    name: 'DFAST Scenario Data Versioning Not Controlled — Multiple Versions in Circulation During Production',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's DFAST stress test production cycle uses Federal Reserve-published macroeconomic scenario data as input to stress models, but the bank does not enforce a formal data versioning control that locks the specific scenario data version to be used in each model run; during the last DFAST production cycle, three different versions of the Federal Reserve scenario data — the initial release, a technical correction, and an extended vintage — were used in different model runs without a central version registry tracking which models used which version. Federal Reserve DFAST submission requirements and BCBS 239 data governance standards require that all models in a stress test submission use the same scenario data version for results to be comparable and aggregatable; scenario data version inconsistency across models produces non-comparable stress results that require a full re-run after the inconsistency is discovered — consuming the final 10 days of the submission preparation timeline.`,
    keywords: ['DFAST', 'BCBS 239', 'scenario data versioning', 'Federal Reserve', 'data governance'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3507',
    name: 'Supervisory Data Quality Score Below Peer Median in Federal Reserve Off-Site Review',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `Federal Reserve horizontal analysis of peer bank supervisory data quality — comparing FR Y-9C data accuracy, CCAR submission completeness, and regulatory report resubmission rates across the bank's peer group — places First Capital at the 28th percentile on supervisory data quality, below the peer median of 50th percentile, reflecting a resubmission rate of 3.2 per year versus the peer average of 0.8 and a data quality deficiency finding rate in the top quartile of peer frequency. BCBS 239 governance and the Federal Reserve's supervisory data quality assessment framework treat horizontal peer comparison as a leading indicator of systemic data governance weakness; a persistent below-peer supervisory data quality standing is a pre-examination signal that the Federal Reserve's examination team uses to scope enhanced review of the bank's data governance, model risk, and regulatory reporting controls.`,
    keywords: ['BCBS 239', 'supervisory data quality', 'Federal Reserve', 'peer benchmarking', 'FR Y-9C'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3508',
    name: 'Call Report Schedule RC-C Loan Classification Not Aligned With Internal Risk Rating',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's internal risk rating system classifies commercial loans as Pass, Special Mention, Substandard, Doubtful, or Loss using OCC examination guidance criteria, but the mapping between these internal ratings and the Call Report Schedule RC-C loan classification categories is maintained in an analyst-curated Excel crosswalk that is not automated and is reviewed only annually. OCC examination standards and FFIEC Call Report instructions require that loan classification in regulatory filings reflect the bank's actual risk rating determinations at the reporting date; when the Excel crosswalk is not updated following a mid-year OCC examination that recategorized a class of commercial real estate loans from Pass to Special Mention, the Q2 Call Report filing continues to use the pre-examination classification, creating a post-examination restatement requirement and an OCC finding that regulatory reporting data does not reflect examination outcomes.`,
    keywords: ['FR Y-9C', 'Call Report', 'OCC guidance', 'BCBS 239', 'loan classification'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3509',
    name: 'HMDA LAR Geocoding Error Rate Exceeds CFPB Examination Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's Home Mortgage Disclosure Act loan application register geocoding process — which assigns census tract, county, and Metropolitan Statistical Area codes to each loan application — has an error rate of 4.8% based on internal quality review, exceeding the CFPB's examination threshold of 2% geocoding accuracy errors above which the CFPB's HMDA examination procedures require an enhanced review of the bank's fair lending and CRA performance. FFIEC HMDA reporting requirements and CFPB Regulation C require accurate geocoding as the foundation of geographic fair lending analysis; a 4.8% geocoding error rate introduces systematic geographic misclassification into the HMDA data that affects the bank's self-assessment of denial rates by geography and the CFPB's ability to use the bank's HMDA data for fair lending surveillance, creating examination risk and potential CRA performance evaluation impact.`,
    keywords: ['HMDA', 'CFPB', 'geocoding error', 'CRA', 'FFIEC'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3510',
    name: 'Regulatory Report Version Control Not Enforced — Submitted Versus Retained Copy Diverge',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital retains copies of submitted FR Y-9C and Call Report filings in the bank's document management system, but the version control process does not ensure that the retained copy is identical to the transmitted filing — with two instances in the past three years where post-transmission corrections to the submission system produced a transmitted version that differs from the document management copy retained as the bank's official record. OCC examination standards and FFIEC regulatory reporting governance require that banks maintain exact copies of submitted regulatory reports as the basis for examination review and subsequent restatement analysis; a retained copy that differs from the submitted version means that the bank's examination preparation team cannot rely on their internal records to accurately reconstruct what was reported to regulators, creating a documentation integrity gap in the bank's regulatory reporting control environment.`,
    keywords: ['FR Y-9C', 'FFIEC', 'OCC guidance', 'version control', 'regulatory reporting'],
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3511',
    name: 'Operational Risk Regulatory Capital Calculation Not Reconciled to Call Report Schedule RC-R',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital calculates operational risk regulatory capital using the Basic Indicator Approach with gross income data sourced from the management reporting system, but does not reconcile this calculation to the gross income data in Call Report Schedule RC-R — which is sourced from the general ledger — before submission; the two gross income figures diverge by $12M due to timing differences in intercompany elimination treatment, producing a Basel III operational risk RWA figure in the capital adequacy report that is not reconcilable to the bank's public regulatory filings. OCC capital adequacy guidance and BCBS 239 data reconciliation requirements expect that all regulatory capital inputs be reconcilable to the bank's financial statements; the gross income discrepancy between management reporting and the Call Report is identified during the annual audit process rather than through the bank's data governance controls, representing a quarterly control failure that has persisted undetected for six reporting periods.`,
    keywords: ['Basel III', 'operational risk RWA', 'OCC guidance', 'BCBS 239', 'Call Report'],
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3512',
    name: 'Liquidity Coverage Ratio Reporting Data Not Subject to Same Quality Standards as Capital Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital applies BCBS 239 data quality governance — including CDE ownership, quality measurement, and lineage documentation — to the data feeding its capital adequacy and stress test reporting, but does not extend the same governance framework to the data feeding its daily Liquidity Coverage Ratio calculation and monthly LCR reporting, which draws on high-quality liquid asset classifications, cash flow run-off assumptions, and intraday liquidity position data from separate systems. Federal Reserve LCR rule (Regulation WW) and OCC liquidity supervision guidance require that LCR reporting data be of sufficient quality and completeness to support examination-level review; applying a lower data governance standard to LCR reporting than to capital reporting creates a liquidity reporting quality asymmetry that OCC examiners identify when they compare the LCR data sourcing documentation against the bank's BCBS 239 compliance documentation.`,
    keywords: ['LCR', 'BCBS 239', 'Regulation WW', 'OCC guidance', 'liquidity reporting'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3513',
    name: 'CCAR Qualitative Assessment Data Not Maintained at Same Quality as Quantitative Stress Data',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's CCAR capital planning process maintains rigorous data quality governance for the quantitative stress test data — loss rate inputs, capital ratio projections, and scenario sensitivity analyses — but does not apply equivalent governance to the qualitative assessment data: policies, governance minutes, risk committee materials, and internal audit findings that document the capital planning process quality required for the Federal Reserve's qualitative CCAR evaluation. Federal Reserve CCAR qualitative assessment criteria examine the quality and completeness of the evidence base supporting the bank's capital adequacy narrative; when the Federal Reserve's examination team requests documentation supporting the capital planning process descriptions in the CCAR narrative, the bank produces materials of inconsistent completeness and format that do not demonstrate the governance rigor described in the qualitative CCAR narrative, contributing to a CCAR qualitative assessment finding.`,
    keywords: ['CCAR', 'Federal Reserve', 'qualitative assessment data', 'BCBS 239', 'capital planning'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3514',
    name: 'Reg CC Funds Availability Data Integrity Gap — Customer Hold Exceptions Not Systematically Logged',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital grants exceptions to Regulation CC standard funds availability schedules for new customers, large deposits, and redeposited checks through a branch operational process where tellers apply holds in the core banking system, but the exception reason, the specific Reg CC provision cited, and the notice provided to the customer are not systematically captured in a structured data field — relying instead on free-text teller notes. CFPB and OCC Regulation CC examination guidance require that exception holds be supported by documented compliance with the notice, timing, and permissible reason requirements of 12 CFR Part 229; the absence of structured exception logging means the bank cannot produce systematic data demonstrating that its exception hold practices comply with Reg CC, and CFPB examination sampling of exception transactions finds incomplete or missing exception documentation in 22% of holds reviewed.`,
    keywords: ['Regulation CC', 'CFPB', 'OCC guidance', 'funds availability', 'data integrity'],
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3515',
    name: 'CRA Assessment Area Definition Data Not Updated After Branch Rationalization',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital closed seven branches in low- and moderate-income census tracts as part of a cost reduction program, but the bank's CRA assessment area definition — which is defined in the bank's CRA public file and used as the geographic boundary for evaluating lending, investment, and service performance — was not updated to reflect the post-closure branch network, leaving the bank's CRA assessment area referencing branch locations that no longer exist. OCC CRA examination procedures require that the assessment area accurately reflect the bank's current deposit-taking branch network and delineation requirements under 12 CFR Part 25; an assessment area that references closed branches is inaccurate under CRA delineation rules and may include or exclude communities in a manner that distorts the bank's measured CRA performance relative to its actual service area, creating examination findings that affect the bank's CRA rating.`,
    keywords: ['CRA', 'OCC guidance', 'assessment area', 'FFIEC', 'community reinvestment'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3516',
    name: 'FRTB Market Risk RWA Inputs Not Governed Under BCBS 239 CDE Framework',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital is preparing for FRTB standardized approach implementation, and the market risk RWA inputs — sensitivity measures, risk factor eligibilities, and bucket assignments under the SA framework — will be sourced from risk systems that are not currently governed under the bank's BCBS 239 critical data element framework. BCBS 239 Principles 1–4 and the Basel Committee's FRTB implementation guidance require that data underlying regulatory capital calculations be subject to the same governance, quality measurement, and lineage documentation requirements as other risk reporting data; onboarding FRTB without extending BCBS 239 governance to the new risk factor and sensitivity data creates a governance gap at inception — embedding a data quality and lineage deficiency into the bank's FRTB reporting infrastructure from the first regulatory submission.`,
    keywords: ['FRTB', 'BCBS 239', 'market risk RWA', 'Basel III', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3517',
    name: 'BSA/AML Customer Risk Rating Data Not Reviewed at Required Refresh Frequency',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's BSA/AML program assigns risk ratings to all commercial customers based on industry, transaction volume, geographic footprint, and product mix, with the bank's written policy requiring annual refresh of the risk rating for all Tier 2 and Tier 3 customers; internal audit sampling finds that 28% of Tier 2 commercial customer risk ratings have not been refreshed within the policy-required 12-month window, with the oldest outstanding refreshes exceeding 30 months. FinCEN Customer Due Diligence rule (31 CFR Part 1010) and OCC BSA/AML examination procedures require that customer risk ratings be maintained and refreshed according to the bank's documented risk-based schedule; a 28% refresh delinquency rate across the Tier 2 commercial portfolio is a BSA/AML governance deficiency that OCC examiners cite as evidence that the bank's CDD program is not operationally effective, compounding the examination exposure of the bank's AML transaction monitoring threshold recalibration backlog.`,
    keywords: ['BSA/AML', 'FinCEN CDD rule', 'OCC guidance', 'customer risk rating', 'data governance'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3518',
    name: 'Climate Risk Data Aggregation Not Integrated Into BCBS 239 CDE Framework',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital has begun collecting physical climate risk exposure data — flood zone classifications, wildfire risk scores, and sea level rise exposure indicators for real estate collateral — and transition risk data for commercial borrowers in carbon-intensive industries, but these datasets are stored in an ad-hoc analytical environment outside the bank's BCBS 239 CDE governance framework and without the lineage documentation, quality measurement, and business owner accountability that the framework requires. Federal Reserve climate risk supervisory guidance (SR 23-8) and OCC climate risk management principles require that climate-related risk data be subject to governance standards commensurate with the materiality of climate risk in the bank's portfolio; building climate risk reporting on ungoverned data creates a foundational gap that will require remediation when climate scenario analysis and stress testing requirements are formalized, as the data governance infrastructure will need to be rebuilt from scratch rather than extended from an established governance foundation.`,
    keywords: ['climate risk data', 'BCBS 239', 'SR 23-8', 'OCC guidance', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
  {
    code: 'B3519',
    name: 'CCAR Submission Data Attestation Signed Without Formal Data Certification Process',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's CFO and CRO sign the CCAR capital plan data attestation certifying the accuracy of submitted data under Federal Reserve submission requirements, but the attestation is signed based on verbal assurances from the regulatory reporting team without a formal, documented data certification process that traces each attested metric to its quality-tested source, verified lineage path, and authorized data owner sign-off. BCBS 239 governance and Federal Reserve CCAR submission governance requirements expect that CEO/CFO data attestations for regulatory capital submissions be supported by a documented certification process that creates an auditable basis for the attestation; when Federal Reserve examiners review the bank's CCAR attestation control process and find it consists of email sign-offs rather than a structured data certification chain, the examination finding cites the absence of a formal attestation support process as a capital planning governance deficiency that must be remediated as part of the bank's consent order data governance commitments.`,
    keywords: ['CCAR', 'BCBS 239', 'data attestation', 'Federal Reserve', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'regulatory-data-reporting',
  },
];
