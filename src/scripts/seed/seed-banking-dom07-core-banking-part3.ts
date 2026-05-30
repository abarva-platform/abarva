// seed-banking-dom07-core-banking-part3.ts
// Banking genome patterns — Core Banking Modernisation (Part 3)
// Code range: B2020–B2079  (60 patterns)
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

export const BANKING_DOM07_CORE_BANKING_PART3_PATTERNS: PatternSeed[] = [

  // ── core-system-migration (12) ─────────────────────────────────────────────
  {
    code: 'B2020',
    name: 'Vendor Contract Lock-In Prevents Core Platform Exit Without Penalty',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's core banking vendor contract contains a 7-year exclusivity clause with a termination-for-convenience fee equal to 36 months of recurring license costs, which the bank's technology team discovers mid-migration when evaluating a competitor platform's superior API capabilities. OCC Bulletin 2013-29 on third-party risk management requires banks to negotiate exit provisions and transition assistance rights before execution; entering a multi-year core banking contract without explicit termination-fee caps, data portability guarantees, and source-code escrow rights creates a strategic lock-in that regulators cite in TPRM examination findings. The bank proceeds with the original vendor, forgoing $3.1M in anticipated API-layer cost savings over the contract term.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'vendor lock-in', 'core banking migration', 'contract governance'],
    demoRelevant: true,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2021',
    name: 'Data Centre Co-Location Migration Sequencing Causes Core Availability Gap',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital migrates its core banking application to a new co-location facility six months before the primary network circuits are upgraded, relying on a temporary cross-connect that introduces 8ms of additional round-trip latency on all real-time debit authorisation calls. The latency increase causes 4% of POS authorisations to exceed the Visa and Mastercard 3-second response time threshold, triggering stand-in processing and resulting in $890K in chargebacks from transactions that stood-in as approved but were later declined on the new core. FFIEC IT Handbook guidance on infrastructure risk management requires banks to sequence technology migrations so that dependent infrastructure components are upgraded before application cutover, not after.`,
    keywords: ['FFIEC IT Handbook', 'core banking migration', 'data centre', 'Visa', 'authorisation latency'],
    demoRelevant: false,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2022',
    name: 'Legacy Dormant Account Rules Not Migrated Trigger State Escheatment Violations',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `During First Capital's core banking migration, dormancy calculation logic for savings accounts — which accrues days-since-last-customer-initiated-activity using a state-specific statutory clock — is not ported to the new platform, causing the core to reset dormancy counters on system-generated interest credits rather than customer-initiated transactions. After 18 months of live operation, the bank's annual unclaimed property review identifies 2,400 accounts that should have been escheated to the state under applicable unclaimed property statutes but were not flagged because the dormancy clock was reset incorrectly. State unclaimed property audits typically assess interest penalties of 18–24% per year on undereported amounts, and the CFPB considers dormant account mismanagement a consumer financial protection failure under the UDAP standards.`,
    keywords: ['unclaimed property', 'state escheatment', 'core banking migration', 'CFPB', 'UDAP'],
    demoRelevant: true,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2023',
    name: 'Currency Rounding Convention Change at Cutover Creates GL Reconciliation Breaks',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's legacy core truncates fractional-cent interest calculations at the transaction level, while the new core rounds to the nearest cent using ASTM E29 standard rounding rules; no reconciliation adjustment is made during cutover to account for the $147K aggregate rounding variance across 680,000 deposit accounts. The GL break persists undetected for 9 days post-cutover because automated reconciliation tolerances were set to $10K per GL account, and the rounding variance was distributed across 124 GL sub-accounts below the tolerance threshold. OCC financial reporting examination guidance expects banks to identify and resolve systematic GL variances within one business day; a 9-day unresolved break in deposit liability GL accounts is a significant internal control weakness.`,
    keywords: ['OCC', 'GL reconciliation', 'core banking migration', 'interest rounding', 'internal controls'],
    demoRelevant: false,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2024',
    name: 'ACH Origination Limit Configuration Lost at Core Cutover Enables Fraud Exposure',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's legacy core enforces per-customer ACH origination daily limits as hard-coded parameters in the ACH processing module; when the bank migrates to its new core, these limits are not re-configured in the new platform's risk parameter tables because they were not identified in the migration requirements scope. During the first 72 hours of live operation, the absence of ACH origination limits allows a business account to originate $4.2M in same-day ACH credits — 14 times the customer's historical average — that the fraud team only identifies after Reg E dispute filings from payees begin arriving. Nacha's Operating Rules require originators to maintain reasonable risk controls on ACH volume; the OCC expects BSA/AML programme controls to include transaction monitoring thresholds that survive system replacements.`,
    keywords: ['Nacha', 'ACH', 'BSA/AML', 'core banking migration', 'Reg E'],
    demoRelevant: true,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2025',
    name: 'Core Upgrade Breaks Existing ISO 20022 Message Mapping for Wire Payments',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital upgrades its core banking platform to a release that changes the internal wire payment data model, breaking the bank's ISO 20022 pacs.008 message translation layer without issuing a migration guide to integration partners. Downstream SWIFT and FedWire payment processing systems begin rejecting messages with malformed BIC code fields and missing LEI references, causing 340 commercial wire instructions to fail on the first business day after the upgrade. BCBS 239 principles for effective risk data aggregation require banks to maintain data lineage and mapping documentation across system upgrades; wire payment message format breaks also create potential Reg J compliance exposure and correspondent banking relationship risk.`,
    keywords: ['ISO 20022', 'SWIFT', 'BCBS 239', 'wire payments', 'core banking upgrade'],
    demoRelevant: true,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2026',
    name: 'New Core Lacks Relationship Pricing Engine for Deposit Product Bundling',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's legacy core executes relationship pricing logic that waives monthly maintenance fees for customers holding both a qualifying checking account and a mortgage balance; the new core platform's product catalogue does not support cross-product relationship fee-waiver logic without a custom configuration engagement, which was not scoped in the migration project. After cutover, 23,000 customers who qualified for the relationship fee waiver begin receiving monthly maintenance fee charges, generating 4,800 customer complaints and $1.1M in fee reversals over the first 90 days. CFPB supervisory guidance on unfair practices considers charging fees that customers were contractually promised would be waived to be a UDAP violation that requires remediation and retroactive refund of all affected customers.`,
    keywords: ['CFPB', 'UDAP', 'relationship pricing', 'core banking migration', 'deposit products'],
    demoRelevant: true,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2027',
    name: 'Core Platform Timezone Handling Creates Overdraft Fee Timing Disputes',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's new core banking platform processes end-of-business-day overdraft determination using UTC timestamps rather than the branch's local Eastern Time zone, causing accounts with late-afternoon deposits to be assessed overdraft fees on items that posted before the deposit was made in wall-clock time but after the deposit in UTC. The CFPB has issued guidance under Regulation E and its UDAP authority that overdraft fee timing must align with the chronological order customers reasonably expect based on their account disclosures; timezone-driven overdraft sequencing that differs from disclosed business day cutoffs has resulted in consent orders and restitution requirements at multiple large regional banks. The bank's failure to test timezone-dependent overdraft scenarios in UAT allowed this defect to reach production.`,
    keywords: ['CFPB', 'Reg E', 'overdraft', 'core banking migration', 'UDAP'],
    demoRelevant: false,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2028',
    name: 'Parallel Run Reconciliation Tolerance Too Wide Masks Systematic Migration Defect',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital runs its legacy core and new core in parallel for 8 weeks but sets daily reconciliation tolerance thresholds at 0.1% of total account balance, which allows a systematic rounding error affecting approximately 0.07% of balances to pass undetected throughout the parallel-run period. The defect — a fixed-point arithmetic difference in CD interest accrual between the two platforms — compounds over time, producing a $2.4M aggregate variance by the scheduled cutover date that exceeds the legal threshold for material misstatement under the bank's financial reporting obligations. FFIEC guidance on system change management requires parallel-run tolerance thresholds to be calibrated to the precision requirements of the affected product type, not a flat percentage of total balances.`,
    keywords: ['FFIEC IT Handbook', 'parallel run', 'core banking migration', 'reconciliation', 'CD interest accrual'],
    demoRelevant: false,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2029',
    name: 'Core Conversion Invalidates Outstanding Debit Card Authorisations Causing Settlement Failures',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's weekend core banking cutover does not transfer open debit card authorisation hold records from the legacy authorisation file to the new core, causing all hotel, rental car, and restaurant pre-authorisation holds placed before the cutover weekend to be released upon migration completion. When settlement files arrive the following Monday for transactions backed by those now-released holds, 8,200 accounts that relied on the holds to cover available balance calculations overdraft, generating $620K in overdraft fees and 1,400 Reg E disputes from customers who had verified their available balance before making large purchases. Visa and Mastercard network rules require issuers to maintain authorisation hold continuity through technology transitions; failure to do so creates card network compliance risk in addition to customer remediation obligations.`,
    keywords: ['Visa', 'Mastercard', 'debit card authorisation', 'core banking migration', 'Reg E'],
    demoRelevant: true,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2030',
    name: 'Core Vendor Dependency on Single Database Schema Version Blocks Security Patching',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's core banking vendor certifies its application only against a specific version of the underlying database engine, preventing the bank's infrastructure team from applying a critical CVE-rated security patch to the database without first obtaining vendor re-certification — a process that takes 14 weeks. The OCC's cybersecurity examination guidance and FFIEC IT Security Handbook require banks to apply critical security patches within a risk-based timeframe that typically does not permit a 14-week delay; the bank must document and accept the residual risk of operating on an unpatched database or risk production instability from an uncertified patch. TPRM frameworks under OCC Bulletin 2013-29 require banks to contractually require vendors to certify against current-version software or to provide accelerated patch certification processes for critical vulnerabilities.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Security Handbook', 'TPRM', 'security patching', 'core banking vendor'],
    demoRelevant: false,
    subTopic: 'core-system-migration',
  },
  {
    code: 'B2031',
    name: 'Core Platform API Versioning Policy Breaks Third-Party Fintech Integrations Post-Upgrade',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's core banking platform upgrade introduces breaking changes to its REST API response schema without maintaining backward compatibility for a minimum deprecation period, causing seven active fintech partner integrations — including a BaaS lending partner and a small business expense management provider — to return errors for customers attempting to access linked accounts. OCC Bulletin 2017-21 on responsible innovation and the FFIEC's guidance on third-party relationships require banks to manage technology change in a way that preserves contractually committed service levels for downstream partners; API breaking changes without adequate deprecation notice and parallel version support breach partner SLAs and create reputational and operational risk. The bank incurs $280K in emergency remediation labour and faces a contractual penalty from the BaaS partner.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC', 'API versioning', 'BaaS', 'fintech integration'],
    demoRelevant: true,
    subTopic: 'core-system-migration',
  },

  // ── data-migration (10) ────────────────────────────────────────────────────
  {
    code: 'B2032',
    name: 'Historical Transaction Archive Not Migrated Breaks 7-Year Regulatory Lookback',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital migrates only 24 months of transaction history to the new core banking platform at cutover, retaining older records in a read-only legacy archive that requires a separate access request process for customer inquiries and regulatory subpoenas. When a grand jury subpoena arrives 8 months post-cutover requesting 5 years of wire transfer records for a BSA/AML investigation, the bank's compliance team spends 11 days reconstructing data from the legacy archive — missing the court-ordered 72-hour production deadline. BSA record retention regulations require banks to maintain wire transfer records for 5 years and CTR/SAR records for 5 years; FFIEC BSA/AML Examination Manual guidance expects banks to have an integrated data access capability that can produce responsive records within legally required timeframes regardless of the originating platform.`,
    keywords: ['BSA/AML', 'FFIEC BSA/AML Examination Manual', 'data migration', 'wire transfer records', 'OCC'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B2033',
    name: 'Customer Address Data Quality Defects in Migration Trigger USPS Return Mail Surge',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's data migration ETL process does not include address standardisation or CASS certification validation, causing 18,000 customer mailing addresses to migrate with street abbreviation inconsistencies, missing apartment numbers, or ZIP+4 codes that no longer match the primary address. The first monthly statement cycle post-cutover generates a 12% statement return rate — compared to a normal 0.8% — costing $94K in reprocessing and re-mailing, and more critically creating a Reg E and FCRA compliance exposure because returned statements may mask dispute notification deadlines the bank is legally obligated to track. CFPB examination guidance on data quality in consumer account management expects banks to validate address data integrity as part of any platform migration acceptance criterion.`,
    keywords: ['CFPB', 'Reg E', 'FCRA', 'data migration', 'address data quality'],
    demoRelevant: false,
    subTopic: 'data-migration',
  },
  {
    code: 'B2034',
    name: 'Loan Collateral Record Migration Drops Lien Priority Metadata for UCC Filings',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's core banking data migration extracts commercial loan collateral records from the legacy system but does not migrate the UCC filing date, UCC filing jurisdiction, and lien priority rank fields, which were stored in a non-standard schema in the legacy platform and were not mapped in the data migration specification. When the bank's credit risk team attempts to run its annual lien perfection audit on the new platform, it discovers 1,400 commercial loans where lien priority cannot be determined from the migrated data, requiring manual review of paper UCC filing records. OCC credit risk examination guidance requires banks to maintain accurate, complete collateral and lien documentation as a condition of loan classification accuracy; losing lien metadata in migration creates a direct loan grading and credit loss provisioning risk under CECL.`,
    keywords: ['OCC', 'UCC', 'CECL', 'data migration', 'commercial lending'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B2035',
    name: 'Duplicate Customer Record Consolidation During Migration Creates Merged Account Errors',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's pre-migration data cleansing programme identifies 22,000 apparent duplicate customer records in the legacy CIF — customers who opened accounts at multiple branches under slightly different name or address spellings — and runs a fuzzy-match deduplication algorithm to consolidate them before migration. The algorithm incorrectly merges 340 legitimate distinct customers who share similar names and addresses (e.g. family members at the same address), combining their account balances, credit profiles, and transaction histories into single CIF records. FCRA requires banks to maintain accurate consumer information; merging legitimate distinct customers into a single credit file creates FCRA data accuracy violations, incorrect credit bureau reporting, and fiduciary risk if combined balances trigger erroneous tax reporting thresholds.`,
    keywords: ['FCRA', 'data migration', 'CIF deduplication', 'core banking', 'CFPB'],
    demoRelevant: false,
    subTopic: 'data-migration',
  },
  {
    code: 'B2036',
    name: 'Encrypted Data Field Migration Loses Key Association for PII Vault Records',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's core banking migration transfers encrypted Social Security Number and date-of-birth fields from the legacy platform but does not successfully migrate the encryption key identifiers that link each ciphertext record to its decryption key in the bank's HSM-backed key vault, rendering 9,200 customer PII records permanently unreadable on the new platform. The key-association gap is not detected during UAT because testers used synthetic test SSNs that were re-encrypted under new keys during the test data generation process; production PII uses legacy key IDs that the new core's decryption service does not recognise. GLBA Safeguards Rule and state breach notification statutes require banks to protect and be able to access customer PII; permanently inaccessible encrypted PII may require breach notification and creates BSA/AML KYC compliance exposure.`,
    keywords: ['GLBA Safeguards Rule', 'BSA/AML', 'KYC', 'encryption key management', 'data migration'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B2037',
    name: 'CD Maturity Date Recalculation Error in Migration Triggers Wrong Auto-Renewal Actions',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's migration ETL recalculates CD maturity dates from the original open date and term stored in the legacy system, but applies a 30/360 day-count convention on accounts that were originated under an actual/365 convention — producing maturity dates that are 1–3 days earlier than the contractually correct dates for 14,000 CD accounts. CDs that reach their recalculated (incorrect) maturity date during the grace period trigger the bank's auto-renewal logic, rolling over customer funds into new CDs at a lower rate before customers had the opportunity to exercise their contractual grace-period withdrawal right. Reg DD requires banks to honour the terms and grace periods disclosed at CD origination; auto-renewing CDs before the contractual maturity date violates the disclosed terms and requires UDAP remediation.`,
    keywords: ['Reg DD', 'CFPB', 'CD auto-renewal', 'data migration', 'UDAP'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B2038',
    name: 'Beneficiary Designation Records Not Migrated for IRA and Trust Accounts',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's data migration scope covers primary account holder and product records but excludes beneficiary designation data from IRA, payable-on-death, and trust accounts — which were stored in a separate legacy document management system that was not included in the core banking migration perimeter. When the first account holder death occurs post-cutover, the bank cannot produce a valid beneficiary designation for the decedent's IRA, delaying estate settlement and creating potential fiduciary liability. IRS regulations governing IRA beneficiary designations require financial institutions to maintain complete and accurate beneficiary records; state trust and estate laws impose fiduciary duties on banks administering trust accounts; losing beneficiary designation data in migration is a material compliance and legal risk.`,
    keywords: ['IRS', 'IRA', 'beneficiary designation', 'data migration', 'fiduciary risk'],
    demoRelevant: false,
    subTopic: 'data-migration',
  },
  {
    code: 'B2039',
    name: 'HMDA LAR Historical Data Not Mapped Correctly to New Core Loan Category Schema',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital migrates 3 years of mortgage origination records to its new core banking platform, but the legacy system's loan purpose codes — which use a proprietary numbering scheme — are not correctly crosswalked to the HMDA 2018 LAR purpose codes required by CFPB Regulation C. Approximately 8% of migrated mortgage records are classified as "home improvement" in the new core when they should be classified as "home purchase" based on the original application purpose, distorting the bank's HMDA fair lending profile and creating potential CRA and ECOA exposure. CFPB HMDA examination guidance requires HMDA data to accurately reflect the original transaction purpose; data migration crosswalk errors that persist into regulatory filings create enforcement risk under Regulation C.`,
    keywords: ['CFPB', 'HMDA', 'Reg C', 'CRA', 'data migration'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B2040',
    name: 'Account Number Format Change at Migration Breaks Standing Order References',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's new core banking platform uses a 16-digit account number format to replace the legacy system's 10-digit numbers; the bank publishes number-mapping tables to internal systems but does not proactively notify the 34,000 customers who have provided their legacy account numbers to external payees for recurring ACH debit authorisations. In the first three months post-migration, 6,200 inbound ACH debit items are returned as account-not-found because the originating companies' records still reference legacy account numbers, causing missed utility payments, rent debits, and insurance premium collections for affected customers. Nacha Operating Rules require receiving depository financial institutions to return items with valid reason codes; the bank's failure to manage account number transition communication creates customer harm that the CFPB may characterise as an unfair practice.`,
    keywords: ['Nacha', 'ACH', 'CFPB', 'account number migration', 'data migration'],
    demoRelevant: false,
    subTopic: 'data-migration',
  },
  {
    code: 'B2041',
    name: 'Commercial Loan Fee Accrual Basis Migrated Without Recalculating Origination Fee Amortisation',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital migrates commercial loan origination fee records to its new core without recalculating the remaining unamortised fee balance under ASC 310-20, resulting in 2,100 commercial loans where the migrated fee amortisation schedule produces incorrect interest income accruals from the cutover date forward. The error overestimates net interest income by $1.8M in the first full quarter post-cutover, which is material under the bank's $1.5M individual misstatement threshold for SEC reporting. CECL methodology requirements under ASC 326 and SEC SAB 99 materiality guidance both require banks to ensure migrated accounting parameters produce results consistent with the original GAAP measurement basis; treating origination fee amortisation as a non-critical migration item is a common accounting data migration oversight.`,
    keywords: ['ASC 310-20', 'CECL', 'ASC 326', 'data migration', 'commercial lending'],
    demoRelevant: false,
    subTopic: 'data-migration',
  },

  // ── integration-middleware (8) ─────────────────────────────────────────────
  {
    code: 'B2042',
    name: 'ESB Message Queue Depth Grows Unchecked During Core Cutover Causing Downstream Timeouts',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital routes all core-to-channel messaging through an enterprise service bus; during the core banking cutover weekend, the ESB's inbound queue accumulates 2.4 million messages from the new core's event stream while downstream channel systems are in maintenance mode, but the queue depth monitoring alert threshold was not adjusted for the cutover event. When channel systems come back online Monday morning, the queue backlog creates a 4-hour delay in balance and transaction updates to online and mobile banking, causing customers to see stale balances and triggering 14,000 support calls. FFIEC IT Handbook guidance on resilience requires banks to validate that middleware infrastructure can absorb and process message surges from major platform transitions without creating cascading availability failures in customer-facing channels.`,
    keywords: ['FFIEC IT Handbook', 'ESB', 'core banking migration', 'message queue', 'operational resilience'],
    demoRelevant: true,
    subTopic: 'integration-middleware',
  },
  {
    code: 'B2043',
    name: 'API Gateway Rate Limits Not Recalibrated After Core Platform Latency Improvement',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      `First Capital's new core banking platform processes balance enquiries 60% faster than the legacy system, but the API gateway sitting between the core and mobile banking channels retains its original rate-limit configuration that was calibrated to prevent the legacy system from being overwhelmed. Mobile banking now throttles legitimate customer requests at volumes well within the new core's capacity, creating artificial 429 Too-Many-Requests errors during high-traffic periods such as Friday payroll postings. The FFIEC IT Handbook's information security booklet requires banks to calibrate security controls — including rate limiting — proportionally to actual risk rather than legacy operational constraints; over-limiting legitimate customer transactions creates availability risk and UDAP exposure if customers cannot access their funds.`,
    keywords: ['FFIEC IT Handbook', 'API gateway', 'rate limiting', 'core banking', 'mobile banking'],
    demoRelevant: false,
    subTopic: 'integration-middleware',
  },
  {
    code: 'B2044',
    name: 'Middleware Idempotency Controls Missing Allow Duplicate Payment Processing on Retry',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's payment origination middleware submits ACH and wire payment instructions to the new core banking platform without including idempotency keys, so network timeout-triggered retries from the origination layer result in duplicate payment submissions that the core processes as independent transactions. In the first 30 days of live operation, 78 duplicate wire payments totalling $14.2M are initiated before the treasury operations team identifies the pattern; all duplicates are eventually recovered, but the 72-hour recovery window creates a FedWire return and liquidity management overhead. Nacha's Operating Rules and Federal Reserve FedWire operating circulars both contemplate that originator systems will implement duplicate-detection controls; the FFIEC IT Handbook's payment systems booklet requires banks to test retry-scenario behaviour explicitly before deploying new payment processing integrations.`,
    keywords: ['Nacha', 'FedWire', 'FFIEC IT Handbook', 'payment middleware', 'idempotency'],
    demoRelevant: true,
    subTopic: 'integration-middleware',
  },
  {
    code: 'B2045',
    name: 'Core-to-SIEM Event Log Format Change Causes Fraud Monitoring Blind Spot',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's new core banking platform emits security event logs in a structured JSON format that differs from the syslog-formatted output of the legacy system; the bank's SIEM and fraud monitoring rules are built on regex patterns that parse the legacy log format and silently fail to match the new format, creating a 3-week monitoring blind spot between cutover and SIEM rule remediation. During this period, a credential-stuffing attack exploiting compromised online banking credentials goes undetected for 11 days because the login-failure velocity rules cannot parse the new core's authentication event format. The FFIEC Cybersecurity Assessment Tool and OCC cybersecurity examination guidance require banks to validate that security monitoring capabilities remain operational through all technology transitions.`,
    keywords: ['OCC', 'FFIEC Cybersecurity Assessment Tool', 'SIEM', 'fraud monitoring', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'integration-middleware',
  },
  {
    code: 'B2046',
    name: 'FedNow Connectivity Layer Not Stress-Tested at Core Go-Live Creates RTP Capacity Failure',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital connects to the FedNow instant payment network through a middleware adapter layer that was designed and tested against the legacy core; after the new core go-live, the adapter's connection pooling configuration is not updated to match the new core's higher transaction throughput, causing the FedNow adapter to exhaust its connection pool and queue RTP credit transfers on the second business day when business-to-business instant payment volumes peak. Customers awaiting FedNow credits for payroll and supply chain payments experience delays of 2–4 hours that undermine the value proposition of the instant payment product. Federal Reserve FedNow operating rules require participant financial institutions to process received transactions within defined completion windows; persistent queue backlogs may result in FedNow participation suspension.`,
    keywords: ['FedNow', 'RTP', 'core banking migration', 'payment middleware', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'integration-middleware',
  },
  {
    code: 'B2047',
    name: 'Core Integration Transformation Layer Introduces Silent Data Loss for Memo Post Items',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital's integration middleware transforms core banking memo-post balance records into the format expected by its online banking presentment layer, but the transformation logic incorrectly drops memo-post items where the transaction description field exceeds 40 characters — a constraint inherited from a legacy channel that no longer applies. Customers viewing their online banking transaction history do not see pending debit card authorisations that carry extended merchant description strings, causing 11,000 customers per week to make spending decisions based on inaccurate available-balance displays. Reg E requires banks to present account balance information accurately; CFPB supervisory guidance on mobile and online banking platforms expects balance presentment to reflect all known pending transactions, not just those that pass middleware transformation filters.`,
    keywords: ['Reg E', 'CFPB', 'memo-post', 'integration middleware', 'online banking'],
    demoRelevant: false,
    subTopic: 'integration-middleware',
  },
  {
    code: 'B2048',
    name: 'SWIFT gpi Tracker Feed Not Reconnected After Core Replacement Breaks Payment Status',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital replaces its core banking platform but the integration restoring the SWIFT gpi tracker data feed — which delivers real-time end-to-end correspondent payment status updates — is deprioritised and not reconnected until 6 weeks post-cutover. During this period, corporate treasury customers using First Capital's wire inquiry portal receive stale status data for cross-border payments, and the bank's correspondent banking team cannot confirm credit confirmations to beneficiary banks within the 4-hour gpi SLA. SWIFT gpi Universal Confirmation requirements apply to SWIFT member banks; persistent gpi SLA breaches generate SWIFT incident notices and can affect correspondent relationship credit limits.`,
    keywords: ['SWIFT', 'SWIFT gpi', 'wire payments', 'core banking migration', 'correspondent banking'],
    demoRelevant: false,
    subTopic: 'integration-middleware',
  },
  {
    code: 'B2049',
    name: 'Core Banking Event Stream Schema Change Breaks Real-Time CRM Customer Profiling',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      `First Capital's new core banking platform emits account event data through a Kafka topic using an Avro schema that changes field names from camelCase to snake_case compared to the legacy event format; the bank's CRM integration consumer does not handle schema evolution gracefully and begins failing to deserialise product-holding events, causing the CRM's customer propensity models to stop updating for 14 days until the schema mismatch is identified. The sales team continues generating outbound calling campaigns based on stale propensity scores, resulting in 1,200 calls to customers offering products they have already purchased in the post-cutover period. While not directly a regulatory issue, the OCC's guidance on operational risk and the FFIEC IT Handbook's management booklet expect banks to manage technology change without creating blind spots in risk and customer management systems.`,
    keywords: ['FFIEC IT Handbook', 'Kafka', 'CRM', 'core banking migration', 'event-driven architecture'],
    demoRelevant: true,
    subTopic: 'integration-middleware',
  },

  // ── ai-core-banking (18) ───────────────────────────────────────────────────
  {
    code: 'B2050',
    name: 'AI Transaction Anomaly Detector Trained on Legacy Core Event Schema Fails After Migration',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital deploys an AI-based real-time transaction anomaly detection model trained on 24 months of event features extracted from the legacy core banking platform's transaction log schema; after the core migration, the new core emits structurally different event features — different field names, altered enumeration values for transaction type codes, and the absence of a legacy "channel indicator" field the model weights heavily. The model begins producing a 43% false-negative rate on ACH fraud because it cannot correctly parse the new core's transaction representation, and the anomaly score distribution shifts so significantly that the alert threshold calibrated on legacy data generates no alerts at all for 8 days. SR 11-7 model risk management guidance requires banks to re-validate AI models after material changes to input data sources; failing to re-validate the anomaly detection model before the core cutover is a model governance failure that creates BSA/AML exposure.`,
    keywords: ['SR 11-7', 'BSA/AML', 'AI fraud detection', 'core banking migration', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2051',
    name: 'AI Loan Underwriting Model Receives Stale Core Data Features During Migration Parallel Run',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital runs an AI-assisted consumer lending underwriting model that draws behavioural features — average daily balance trend, overdraft frequency, direct deposit regularity — from the production core banking platform; during the 8-week parallel run, the model continues reading from the legacy core, which no longer receives updates from branches that have already been cut over to the new platform. The model's overdraft-frequency feature becomes systematically understated for 14,000 customers whose accounts are live on the new core, causing the AI to assign these applicants artificially low risk scores and approve 340 loans that would have been declined under correctly updated feature inputs. SR 11-7 and ECOA/Reg B require banks to ensure AI underwriting models operate on accurate, current data; model decisions made on stale input features create fair lending exposure if the affected population has a disparate demographic profile.`,
    keywords: ['SR 11-7', 'ECOA', 'Reg B', 'AI underwriting', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2052',
    name: 'Generative AI Core Modernisation Advisor Recommends Deprecated API Endpoints',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital deploys a generative AI assistant to help its technology team write integration code for connecting internal applications to the new core banking platform's API layer; the model's training data pre-dates the current platform API version, and it generates code samples referencing deprecated v2 API endpoints that the vendor has removed in the current v3 release. Integration teams who rely on the AI-generated code without independently verifying the API reference documentation ship broken integrations that fail silently in staging before discovery — delaying 4 integration workstreams by an average of 3 weeks. OCC Bulletin 2023-17 on model risk for generative AI applications requires banks to establish human review processes for AI-generated artefacts used in technology delivery; treating AI code generation output as authoritative without independent validation is a model governance gap.`,
    keywords: ['OCC Bulletin 2023-17', 'generative AI', 'model risk', 'core banking API', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2053',
    name: 'AI-Driven Deposit Churn Prediction Model Bias Amplified by Core Migration Data Gap',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's AI deposit retention model predicts churn probability using 18 months of historical account activity features; after the core migration truncates accessible history to 12 months for recently migrated customer segments, the model's feature calculation pipeline silently substitutes zero-values for the missing historical periods, which the model interprets as low engagement and assigns elevated churn risk scores. The retention marketing team targets 9,200 customers with high-cost retention incentives — fee waivers and bonus rate promotions — who are actually long-tenured, low-churn customers, wasting $340K in retention budget while missing genuine churn signals for a different segment. SR 11-7 model risk requirements include validating that model inputs remain representative after data infrastructure changes; ECOA monitoring should verify that AI-driven retention targeting does not exhibit disparate impact across protected class demographics.`,
    keywords: ['SR 11-7', 'ECOA', 'AI deposit retention', 'core banking migration', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2054',
    name: 'AI-Generated BSA Suspicious Activity Narrative Lacks Specific Transaction References',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital deploys an AI large-language-model tool to draft BSA Suspicious Activity Report narratives from structured alert data generated by its transaction monitoring system; the model produces fluent, grammatically correct narratives but systematically omits specific dollar amounts, transaction dates, and account identifiers when the source alert data contains structured fields the model was not fine-tuned to parse correctly. FinCEN's SAR filing requirements under 31 CFR 1020.320 require narratives to contain sufficient factual detail — including specific dates, amounts, and parties — to enable law enforcement to assess the activity; vague AI-generated narratives that cannot be used for law enforcement referral are considered non-compliant filings and may trigger FinCEN remediation requirements. Model risk management under SR 11-7 requires validation of AI outputs for regulatory document generation against compliance completeness criteria.`,
    keywords: ['FinCEN', 'BSA/AML', 'SAR', 'AI narrative generation', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2055',
    name: 'AI-Powered Core Banking Chatbot Provides Incorrect Reg CC Hold Information',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital launches an AI-powered conversational banking assistant to handle deposit hold inquiries; the model is fine-tuned on historical customer service scripts but not on First Capital's specific Reg CC funds availability policy disclosures, causing it to quote generic 2-business-day next-day availability rules when customers ask about holds on large cheque deposits that are actually subject to the bank's 7-business-day exception hold policy. Customers who rely on the chatbot's incorrect hold-end information make payment commitments that result in overdrafts when funds do not clear on the AI-stated date. Reg CC requires banks to provide accurate hold information in response to customer inquiries; providing materially incorrect hold information via an AI agent creates CFPB UDAP exposure and requires the bank to remediate affected customers who incur overdraft fees based on the incorrect guidance.`,
    keywords: ['Reg CC', 'CFPB', 'UDAP', 'AI chatbot', 'funds availability'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2056',
    name: 'AI Credit Score Override Model Not Documented as Model Under SR 11-7 MRM Framework',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's consumer lending division deploys a gradient-boosted AI model that overrides the bureau credit score input in the bank's primary underwriting scorecard for applicants whose core banking deposit behaviour indicates higher creditworthiness than the bureau score alone would suggest; the model is classified internally as a "data enhancement tool" rather than a credit model, exempting it from the bank's SR 11-7 model risk management framework. When the OCC examines the bank's MRM programme, examiners identify the override model as an unregistered model that has approved 4,200 loans without independent model validation, developer documentation, or ongoing performance monitoring. SR 11-7 defines a model as any quantitative method used to make business decisions with financial consequences; credit score override tools meet this definition regardless of how they are labelled internally.`,
    keywords: ['SR 11-7', 'OCC', 'model risk management', 'AI credit scoring', 'ECOA'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2057',
    name: 'AI Mainframe Code Refactoring Tool Introduces Logical Errors in Interest Calculation COBOL',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital uses an AI code refactoring assistant to modernise COBOL interest calculation routines from its legacy mainframe as part of a pre-migration code-cleaning initiative; the model correctly transforms syntactic patterns but misinterprets a COBOL COMPUTE statement that implements the bank's proprietary daily balance average logic for compound interest, replacing it with a simpler formula that undercalculates interest for accounts with mid-period deposits. The refactored code passes the team's automated test suite — which tests boundary conditions but does not include regression tests for mid-period deposit scenarios — and reaches production, causing 28,000 savings account customers to receive 4–12 basis points less interest than contractually entitled. OCC examination guidance on model risk and the FFIEC IT Handbook's Development and Acquisition booklet both require banks to test AI-assisted code changes with the same rigour as human-authored changes, including negative and boundary test scenarios.`,
    keywords: ['OCC', 'FFIEC IT Handbook', 'AI code generation', 'mainframe modernisation', 'COBOL'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2058',
    name: 'AI CECL Model Feature Engineering Pipeline Breaks After Core Data Schema Update',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's AI-enhanced CECL loan loss reserve model uses an automated feature engineering pipeline that extracts delinquency transition rates from the new core banking platform's loan servicing data; a platform patch updates the delinquency bucket code mapping from a 4-category to a 6-category scheme without a migration guide for downstream consumers, causing the feature pipeline to misclassify 30-day delinquencies as current accounts. The CECL model, receiving incorrect delinquency inputs, underestimates the allowance for credit losses by $8.7M — a material amount relative to the bank's $180M ACL balance — in the quarter-end reporting cycle. ASC 326 CECL requirements and SEC disclosure standards both require banks to disclose material changes to CECL methodologies; undetected input data corruption that produces a materially incorrect ACL is an accounting control failure that may require a restatement.`,
    keywords: ['CECL', 'ASC 326', 'SR 11-7', 'AI credit risk model', 'core banking data'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2059',
    name: 'Explainability Gap in AI Adverse Action Notices Fails ECOA Model Risk Standard',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital uses a deep neural network to generate composite credit risk scores for consumer loan applications; the model's internal feature weighting cannot be directly mapped to the top-four adverse action reason codes required by ECOA and FCRA adverse action notice regulations, so the bank's compliance team uses a post-hoc SHAP-value explanation method to generate reason codes that the OCC's model risk examiners find do not reliably correspond to the model's actual decision drivers. CFPB and OCC joint guidance on AI in lending (citing SR 11-7) requires that adverse action reasons be accurate reflections of the factors that most influenced the credit decision; using approximate post-hoc explanations that diverge materially from true model drivers fails both ECOA and model governance standards. Regulators have indicated that adverse action reason codes derived from unexplainable AI models will face heightened scrutiny in fair lending examinations.`,
    keywords: ['ECOA', 'FCRA', 'SR 11-7', 'CFPB', 'AI adverse action'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2060',
    name: 'AI-Assisted DFAST Scenario Modelling Produces Inconsistent Capital Adequacy Projections',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital supplements its Dodd-Frank Act Stress Testing capital projection workflow with an AI scenario analysis tool that generates macroeconomic factor sensitivity outputs; the AI tool's outputs differ by $42M from the bank's traditional econometric model projections for the severely adverse scenario because the AI model was trained on a post-2020 data period that underweights the correlation structure between commercial real estate values and unemployment during pre-2020 recession cycles. The Federal Reserve's DFAST guidance and the OCC's stress testing rules require banks to use methodologies that are appropriate for the risk profile of the institution and that can be explained to examiners; AI-assisted capital projections that diverge materially from established econometric benchmarks without documented justification create supervisory credibility risk in stress test submissions.`,
    keywords: ['DFAST', 'CCAR', 'OCC', 'AI stress testing', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2061',
    name: 'AI Vendor Model Used for Commercial Loan Pricing Not Subject to Bank MRM Oversight',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital licences an AI-powered loan pricing model from a fintech vendor that recommends risk-adjusted interest rates for commercial term loans based on borrower financial statement features; the bank's MRM team classifies the vendor-supplied model as a "vendor tool" exempt from model validation requirements, relying on the vendor's internal validation summary rather than conducting independent validation. SR 11-7 explicitly states that the same rigor of model risk management applies to vendor-supplied models as to internally developed models, and OCC supervisory guidance expects banks to obtain sufficient model documentation from vendors to perform independent validation; third-party model reliance without adequate validation creates credit risk concentration and regulatory finding risk. An OCC examination cites the model as a significant model risk finding and requires independent validation within 90 days.`,
    keywords: ['SR 11-7', 'OCC', 'vendor model', 'commercial lending', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2062',
    name: 'AI Document Classification for AML Alert Review Introduces Systematic Bias Against Certain Transaction Types',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an AI document classification model to triage BSA transaction monitoring alerts by severity, prioritising alerts with attached customer documentation over those without; the model systematically down-scores alerts from correspondent banking and trade finance transactions — which rarely have attached documentation at the alert stage — resulting in these alert types being consistently reviewed last and sometimes expiring beyond the SAR filing deadline. FinCEN's SAR filing rules under 31 CFR 1020.320 require banks to file SARs within 30 calendar days of detecting suspicious activity; an AI triage model that structurally delays review of an alert category beyond the filing deadline creates systemic AML compliance failure. SR 11-7 model governance requires banks to monitor AI-assisted compliance processes for systematic bias that could create compliance gaps.`,
    keywords: ['FinCEN', 'BSA/AML', 'SAR', 'AI alert triage', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2063',
    name: 'AI-Powered Onboarding KYC Model Trained on Domestic Customer Data Fails for International Applicants',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital deploys an AI model to automate identity verification and KYC risk scoring for new account applicants; the model is trained exclusively on domestic US applicant data and performs poorly on international student and immigrant applicants whose identification documents — foreign passports, national ID cards, ITIN documentation — are underrepresented in training data, producing a 38% manual escalation rate for this population versus 6% for domestic applicants. The CIP requirements under BSA/AML and CFPB fair lending principles both require banks to apply consistent identity verification standards without creating unjustified barriers for protected class members; a model that disproportionately burdens foreign-national applicants with extended verification delays may constitute disparate treatment under ECOA. FFIEC BSA/AML guidance expects banks to validate that automated CIP tools perform equitably across customer populations.`,
    keywords: ['BSA/AML', 'KYC', 'CIP', 'ECOA', 'AI onboarding'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2064',
    name: 'AI Overdraft Prediction Model Disparately Impacts Low-Income Customer Segment',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital uses an AI model to predict overdraft probability and dynamically limit debit card spending in real time for customers enrolled in its linked-credit overdraft programme; the model's feature set includes average daily balance, deposit regularity, and merchant category pattern — features that are correlated with income level — causing the model to impose more frequent spending limits on lower-income customers regardless of their actual overdraft programme eligibility or credit limit utilisation. CFPB examination guidance on overdraft programmes and ECOA fair lending rules require banks to apply programme terms consistently and to evaluate whether AI-assisted credit decisions have disparate impact on protected classes; using income-correlated behavioural features to restrict credit access without a business necessity justification creates ECOA and CFPB UDAP exposure. The bank has not conducted the required disparate impact analysis under the CFPB's fair lending examination procedures.`,
    keywords: ['CFPB', 'ECOA', 'overdraft', 'AI credit decisions', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2065',
    name: 'LLM-Based Regulatory Change Monitoring Tool Misses BCBS 239 Amendment Effective Date',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital deploys a large-language-model regulatory change monitoring tool to summarise and prioritise new regulatory guidance for its technology and compliance teams; the model correctly identifies the issuance of a BCBS 239 supervisory update but misclassifies the amendment's effective date from the document metadata, reporting the implementation deadline as 18 months from publication when the actual effective date for systemically important banks is 6 months. The compliance programme team schedules remediation work against the incorrect timeline, resulting in a 12-month gap in BCBS 239-compliant risk data aggregation reporting that the Federal Reserve identifies in an annual examination. SR 11-7 and OCC Bulletin 2023-17 on AI governance require banks to validate the accuracy of AI-generated compliance information against authoritative source documents; treating AI regulatory summaries as definitive without human review creates compliance programme risk.`,
    keywords: ['BCBS 239', 'SR 11-7', 'OCC Bulletin 2023-17', 'LLM regulatory monitoring', 'Federal Reserve'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2066',
    name: 'AI-Assisted Core Requirements Documentation Gaps Lead to Missed Acceptance Criteria',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's core banking transformation team uses a generative AI assistant to draft system requirements and acceptance criteria from business process documentation; the model produces comprehensive-sounding requirement documents but systematically omits non-functional requirements for data encryption at rest, audit logging completeness, and role-based access control granularity — categories underrepresented in the training corpus of legacy banking system documents the model was fine-tuned on. When the new core goes live, several OCC IT examination requirements for access control granularity and audit logging completeness are not met because they were never specified as acceptance criteria; the bank receives a Matter Requiring Attention (MRA) for IT general controls. OCC Bulletin 2023-17 requires banks to perform human review of AI-generated compliance and controls artefacts before treating them as programme deliverables.`,
    keywords: ['OCC', 'OCC Bulletin 2023-17', 'AI requirements generation', 'core banking', 'IT general controls'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2067',
    name: 'AI-Powered Liquidity Forecasting Model Fails to Reflect Core Banking Migration Cash Flow Disruptions',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital relies on an AI time-series forecasting model for daily liquidity management, projecting cash position and FedFunds requirements 5 days forward; the model's training data does not include prior core banking migration events, so it cannot recognise or adjust for the atypical ACH return surge, wire payment backlog, and customer balance inquiry-driven mobile funding activity that occur during the first week post-cutover. The AI forecasting model recommends drawing down the FedFunds overnight position by $120M on day 2 post-cutover, creating a liquidity shortfall that requires emergency borrowing from the Federal Home Loan Bank. Federal Reserve Regulation YY and OCC liquidity risk guidance require banks to incorporate stress scenarios — including operational disruptions — into their internal liquidity stress testing; relying on an AI liquidity forecast that cannot adapt to known operational transitions is a contingency planning gap.`,
    keywords: ['OCC', 'Regulation YY', 'AI liquidity forecasting', 'core banking migration', 'Federal Home Loan Bank'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },

  // ── mainframe-modernisation (12) ───────────────────────────────────────────
  {
    code: 'B2068',
    name: 'Mainframe COBOL Conversion to Java Drops Implicit Numeric Truncation Behaviour',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital converts its mainframe COBOL payment calculation routines to Java microservices using an automated code translation tool; the tool correctly translates computational logic but does not replicate COBOL's PIC 9(7)V99 implicit numeric truncation, which discards fractional cents beyond 2 decimal places during intermediate calculation steps. The Java implementation accumulates rounding differences in multi-step fee calculations, causing the daily overdraft fee calculation for accounts subject to both a per-item fee and a daily maximum cap to overcharge by $0.01–$0.05 per day for 18,000 accounts. CFPB UDAP guidance requires banks to charge fees exactly as disclosed; systematic overcharging — even at fractions of a cent — requires full remediation and refund of overcharged amounts across the affected population when identified in examination.`,
    keywords: ['CFPB', 'UDAP', 'mainframe modernisation', 'COBOL migration', 'overdraft fee'],
    demoRelevant: true,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2069',
    name: 'z/OS Job Scheduling Dependencies Not Replicated in Cloud-Native Orchestration',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital migrates its mainframe batch job catalogue from z/OS JES2 scheduling to a cloud-native workflow orchestration platform but does not fully document and replicate the implicit job dependency chain that controls the sequence of GL extract, interest posting, and statement generation jobs. In the new orchestration platform, GL extract and interest posting jobs run in parallel rather than sequentially, causing the interest posting job to operate on an incomplete GL snapshot and producing interest calculations that do not reflect the day's final GL balances. The FFIEC IT Handbook and OCC operational risk guidance require banks to document and test batch job interdependencies before migrating workload scheduling to a new platform; untested parallelism in financial batch processes can produce materially incorrect accounting outputs.`,
    keywords: ['FFIEC IT Handbook', 'OCC', 'mainframe modernisation', 'batch orchestration', 'GL reconciliation'],
    demoRelevant: true,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2070',
    name: 'Mainframe VSAM File Replacement with Relational DB Loses Sequential Access Performance',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital replaces mainframe VSAM key-sequenced data set files with a relational database as part of its mainframe exit programme; the VSAM files supported highly efficient sequential batch reads for statement generation and interest posting that ran in 22 minutes end-to-end. The relational database replacement — queried via standard SQL with no columnar indexing or partitioning strategy designed for batch sequential access — completes the same workload in 4.8 hours, extending the bank's nightly batch window beyond the 3-hour maintenance window and delaying morning branch opening for 18 branches. FFIEC IT Handbook guidance on capacity management requires banks to validate that replacement infrastructure meets the same performance characteristics as the legacy system before decommissioning; failing to benchmark sequential access performance before VSAM retirement is a capacity planning gap.`,
    keywords: ['FFIEC IT Handbook', 'mainframe modernisation', 'VSAM', 'batch performance', 'OCC Bulletin 2013-29'],
    demoRelevant: false,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2071',
    name: 'Mainframe-Era Cryptographic Algorithm Migration Breaks HSM Integration for PIN Processing',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's mainframe payment processing system uses 3DES PIN block encryption for debit card PIN verification, which is integrated with its hardware security module network; when the bank migrates payment processing to a modern core platform, the new platform uses AES-256 PIN block encryption by default, but the HSM network integration layer is not updated to support the new algorithm, causing all PIN-based debit card transactions to fail with an invalid PIN error for 6 hours on the first business day. PCI DSS 4.0 requires card-present PIN processing to use ANSI X9.24 compliant key management and algorithm configurations; Visa and Mastercard mandates require notification to the card network before changes to PIN processing cryptographic methods. The outage generates Reg E dispute obligations and card network fines for processing unavailability.`,
    keywords: ['PCI DSS', 'Visa', 'Mastercard', 'mainframe modernisation', 'HSM PIN processing'],
    demoRelevant: true,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2072',
    name: 'Mainframe Decommission Executed Before Legacy Report Archive Is Accessible Off-Platform',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital decommissions its mainframe 90 days after the new core banking platform reaches full operational status, but discovers 6 months later that 140 historical regulatory reports — including DFAST model documentation, OCC examination response packages, and HMDA disclosure statements — were stored only in native mainframe JES spool and report repository formats that cannot be read after the mainframe is powered off. The bank cannot respond to an OCC information request for 3-year-old stress testing documentation within the examiner's requested 10-business-day window because the files are inaccessible. FFIEC record retention guidance and OCC examination information request procedures require banks to maintain retrievable records for the applicable retention period regardless of technology migrations; mainframe decommission without a complete accessible-archive checklist is a records management gap.`,
    keywords: ['OCC', 'FFIEC', 'mainframe decommission', 'records retention', 'DFAST'],
    demoRelevant: false,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2073',
    name: 'Mainframe Rehosting Vendor Emulation Layer Introduces Undocumented Behavioural Differences',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital selects a mainframe rehosting approach that runs COBOL applications under a software emulator on x86 infrastructure rather than performing a full re-platforming; the emulation vendor's documentation discloses a known behavioural difference in its handling of packed decimal arithmetic overflow conditions — a condition that rarely occurs in standard processing but is triggered by First Capital's annual interest adjustment batch for 401(k) custodial accounts. The overflow discrepancy causes 3,200 custodial account interest postings to be processed as zero-amount transactions rather than triggering the intended exception report, delaying interest posting for an entire participant cohort by 19 days. FFIEC IT Handbook guidance on application development and acquisition requires banks to document all known emulation-layer behavioural differences and test edge cases that may be affected before moving custodial account processing to a rehosted environment.`,
    keywords: ['FFIEC IT Handbook', 'mainframe rehosting', 'COBOL emulation', 'custodial accounts', 'OCC'],
    demoRelevant: false,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2074',
    name: 'Mainframe Capacity Right-Sizing Underestimates Peak MIPS for Year-End Processing',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital migrates from a mainframe to a cloud-native core infrastructure and sizes its compute capacity based on average monthly MIPS consumption rather than peak annual consumption during year-end IRS 1099-INT and 1098 tax form generation, which requires 4.2x the average MIPS. During the first year-end processing cycle on the new platform, the tax form generation job runs 14 hours beyond its scheduled window, causing 24,000 tax forms to be generated after the IRS-mandated January 31 mailing deadline and requiring an IRS penalty assessment under IRC 6722 for late information return filing. The FFIEC IT Handbook's capacity management guidance requires banks to design infrastructure capacity for peak-period workloads, not average workloads; tax processing is a known annual peak that must be included in capacity planning.`,
    keywords: ['IRS', 'FFIEC IT Handbook', 'mainframe modernisation', 'capacity planning', '1099 tax forms'],
    demoRelevant: false,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2075',
    name: 'Mainframe Modernisation Stalls When Business Subject Matter Experts Retire Before Knowledge Transfer',
    officeCategory: 'back_office',
    failureRatePct: 80,
    description:
      `First Capital's mainframe modernisation programme depends on institutional knowledge held by three COBOL developers and two operations analysts who understand the implicit business rules embedded in 340,000 lines of undocumented legacy code; two of these individuals retire during the programme's 30-month timeline before completing their knowledge transfer obligations, leaving critical interest calculation and GL mapping logic undocumented. The programme team cannot safely convert several core interest accrual subroutines and is forced to re-scope a direct rehost of those modules, extending the project timeline by 14 months and adding $6.2M in unplanned cost. OCC and FFIEC guidance on operational resilience explicitly cites key-person dependency in technology operations as a concentration risk that requires documented succession and knowledge transfer plans; treating mainframe modernisation as a pure technical project without a structured knowledge capture programme is a recurring industry failure documented in McKinsey and Gartner surveys of large-bank modernisation programmes.`,
    keywords: ['OCC', 'FFIEC IT Handbook', 'mainframe modernisation', 'key-person risk', 'COBOL'],
    demoRelevant: true,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2076',
    name: 'Mainframe-to-Cloud Network Latency Creates OLTP Response Time SLA Breach for Branch Operations',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital replaces its mainframe core with a cloud-hosted platform whose primary region is geographically further from its branch network than the on-premises mainframe was, adding 22ms of round-trip network latency to every branch teller transaction. Branch tellers who previously completed deposit and withdrawal transactions in 3 seconds on the mainframe core now experience 5–6 second response times on routine operations, reducing teller throughput by 18% and extending average customer wait times by 4 minutes during peak hours. The FFIEC IT Handbook's outsourcing and service provider guidance requires banks to assess the geographic latency implications of cloud migration on operational performance SLAs for customer-facing workloads; migrating to a distant cloud region without latency benchmarking against branch operation SLA requirements is a service delivery planning failure.`,
    keywords: ['FFIEC IT Handbook', 'mainframe modernisation', 'cloud migration', 'branch banking', 'OCC Bulletin 2013-29'],
    demoRelevant: false,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2077',
    name: 'Mainframe Disaster Recovery Runbook Not Updated After Partial Application Migration',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital migrates 60% of its application portfolio off the mainframe while retaining legacy payment processing and GL applications on the mainframe for a subsequent migration phase; the bank's DR runbook, tested annually, covers either a full mainframe DR scenario or a full distributed DR scenario, but does not document the recovery sequence for the hybrid state in which the bank operates for 14 months during the phased migration. When a data centre cooling failure forces an emergency failover, the DR team discovers that the recovery sequence for hybrid state requires manual coordination between two separate failover procedures that have conflicting step sequences, extending recovery time from the target 4 hours to 11 hours. FFIEC Business Continuity Management guidelines require banks to maintain accurate, tested DR procedures for the actual operating environment, including all intermediate states during major technology migrations.`,
    keywords: ['FFIEC', 'business continuity', 'mainframe modernisation', 'disaster recovery', 'OCC'],
    demoRelevant: true,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2078',
    name: 'Mainframe Print Output Services Not Replaced Before Mainframe Decommission Disrupts Reg E Notice Delivery',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's mainframe hosts a centralised print output management system that generates all Reg E error resolution notices, CD maturity notices, and overdraft opt-in/opt-out confirmation letters; the bank decommissions the mainframe before completing the migration of this print service to a cloud-hosted document composition platform. For 28 days, approximately 4,200 time-sensitive Reg E notices that should be sent within the regulation's 10-business-day resolution window are queued but not printed or mailed. Reg E requires banks to send provisional credit and resolution notices within specific timeframes; failing to deliver Reg E notices due to a print service infrastructure gap is a direct regulatory compliance failure requiring notification to the applicable regulators and restitution to affected customers.`,
    keywords: ['Reg E', 'CFPB', 'mainframe decommission', 'document composition', 'FFIEC IT Handbook'],
    demoRelevant: false,
    subTopic: 'mainframe-modernisation',
  },
  {
    code: 'B2079',
    name: 'Mainframe Security Control Architecture Not Replicated Leaves New Platform Without Segregation of Duties',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital's mainframe environment enforces strict segregation of duties between production batch operations, application code deployment, and financial data modification through RACF resource profiles that have been maintained and audited for 20 years; during the migration to a cloud-native core platform, the RACF control architecture is not formally mapped to equivalent IAM roles and permission boundaries in the new environment, leaving a 4-month gap during which deployment engineers also have direct write access to production financial data. The OCC's IT examination guidance and FFIEC IT Handbook cybersecurity booklet consider segregation of duties over production financial systems to be a fundamental internal control; operating a bank's core platform without documented segregation of duties controls is a Sarbanes-Oxley Section 404 internal control weakness and an OCC MRA-level IT finding.`,
    keywords: ['OCC', 'FFIEC IT Handbook', 'RACF', 'segregation of duties', 'mainframe modernisation'],
    demoRelevant: true,
    subTopic: 'mainframe-modernisation',
  },

];
