// seed-banking-dom07-core-banking-part5.ts
// Banking genome patterns — Core Banking Operations (Part 5)
// Code range: B2140–B2199  (60 patterns)
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

export const BANKING_DOM07_CORE_BANKING_PART5_PATTERNS: PatternSeed[] = [

  // ── ai-core-banking (18) ──────────────────────────────────────────────────
  {
    code: 'B2140',
    name: 'AI GL Reconciliation Deployed Without Dual-Control Approval',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an AI-powered general ledger reconciliation module that autonomously posts correcting entries to clear suspense items without requiring a human reviewer to approve each posting before it takes effect; within 60 days the system auto-posts $4.2M in erroneous entries that offset each other within the same GL period, masking a real cash shortage until quarter-end close. OCC SR 11-7 model risk management guidance and FFIEC supervisory expectations require dual-control review for any automated system that generates financial postings; AI-driven GL automation that bypasses the maker-checker principle violates fundamental internal control requirements for core banking operations.`,
    keywords: ['SR 11-7', 'GL reconciliation', 'dual-control', 'AI automation', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2141',
    name: 'GenAI Core System Documentation Creates Hallucinated Configuration References',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital uses a generative AI tool to auto-generate run-book and configuration documentation for its core banking platform, but the LLM hallucinates non-existent parameter names and batch job identifiers that engineers later reference during incident response; during a production outage the on-call engineer spends 47 minutes attempting to locate a configuration parameter cited in the AI-generated runbook before discovering the parameter does not exist. FFIEC IT Handbook operations management guidance requires banks to maintain accurate, validated technical documentation for production systems; AI-generated documentation that is not verified against actual system state introduces operational risk that can extend incident duration and increase mean time to recovery.`,
    keywords: ['FFIEC IT Handbook', 'GenAI', 'core banking documentation', 'hallucination', 'incident response'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2142',
    name: 'AI Account Classification Engine Miscodes Commercial Lines as Consumer',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an ML model to classify new account applications into regulatory reporting categories; the model is trained on historical data that underrepresents small-business revolving credit products and systematically miscodes commercial lines of credit below $50K as consumer accounts, triggering incorrect Regulation Z disclosures and HMDA reporting omissions. The misclassification affects 1,340 accounts over a 7-month production window before a compliance officer flags anomalies in the HMDA LAR peer comparison; remediation requires retroactive disclosure corrections and a self-identified supervisory event filing. SR 11-7 requires ongoing model performance monitoring for production models; classification models used in regulatory reporting require backtesting against known-correct samples and threshold-based human escalation for ambiguous cases.`,
    keywords: ['SR 11-7', 'Regulation Z', 'HMDA', 'ML classification', 'account coding'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2143',
    name: 'LLM-Assisted Core Banking RFP Produces Vendor Evaluation With Fabricated Benchmark Scores',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's technology procurement team uses a large language model to draft a core banking system RFP vendor evaluation matrix; the LLM inserts plausible-looking benchmark scores and analyst references for three vendor platforms that the bank cannot verify independently, and the fabricated scores influence the scoring committee to eliminate a vendor that would have ranked highest on actual independent benchmarks. The resulting platform selection leads to a contract with a vendor whose real-world scalability metrics fall 30% below the bank's transaction volume requirements, discovered only during integration testing 14 months into the programme. OCC Bulletin 2023-17 requires banks to perform independent due diligence in vendor selection; using AI-generated content as a substitute for verified vendor assessment data is an AI governance failure with material procurement risk consequences.`,
    keywords: ['OCC Bulletin 2023-17', 'LLM', 'vendor evaluation', 'core banking RFP', 'AI governance'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2144',
    name: 'ML Anomaly Detection for Core Transactions Violates SR 11-7 Validation Standards',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital deploys an ML anomaly detection model to flag unusual transaction patterns in its core banking platform without completing the SR 11-7 model validation lifecycle — no independent model validation, no conceptual soundness review, and no benchmarking against a challenger model. During an OCC examination the bank cannot produce a model inventory entry, validation report, or ongoing performance monitoring documentation for the anomaly detection system that has been in production for 11 months. SR 11-7 model risk management guidance applies to any quantitative model used in bank operations regardless of the use case; ML models that influence core banking transaction processing require the same validation rigour as credit scoring or market risk models.`,
    keywords: ['SR 11-7', 'ML anomaly detection', 'model validation', 'OCC', 'core banking'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2145',
    name: 'AI-Driven Interest Rate Repricing Engine Lacks Explainability for Exam Review',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital integrates an AI repricing engine into its core banking platform to dynamically adjust deposit interest rates based on a neural network model; when OCC examiners request documentation explaining how a specific customer's deposit rate was determined, the bank cannot produce a human-readable explanation because the model's internal weights are not interpretable. The examination team issues a Matter Requiring Attention requiring the bank to implement explainability controls or revert to rule-based repricing; the remediation requires a 6-month parallel run of an interpretable surrogate model. SR 11-7 requires banks to be able to explain model outputs to supervisors; AI models used in customer-facing rate-setting functions require explainability mechanisms that can support supervisory inquiry and fair lending examination.`,
    keywords: ['SR 11-7', 'AI explainability', 'interest rate repricing', 'OCC', 'core banking'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2146',
    name: 'Generative AI Trained on Core Banking Data Leaks PII in Model Outputs',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital fine-tunes a generative AI assistant on its internal core banking operational data including customer account records; the fine-tuned model memorises and reproduces verbatim account numbers, names, and balance information when prompted by internal users in ways that resemble training samples. A compliance officer testing the internal tool discovers that a prompt about account lookup procedures causes the model to reproduce specific customer account details from training data, triggering a GLBA Safeguards Rule breach disclosure obligation. GLBA Safeguards Rule and FFIEC information security guidance require banks to prevent unauthorized disclosure of customer financial information; using PII-containing operational data as AI training material without differential privacy or data anonymisation is an information security control failure.`,
    keywords: ['GLBA Safeguards Rule', 'GenAI', 'PII leakage', 'model training', 'core banking'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2147',
    name: 'AI-Powered Batch Job Scheduler Missequences Regulatory Reporting Runs',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital deploys an AI-based batch job orchestration system that learns optimal job sequencing from historical run times; the model learns to parallelise the DFAST data extract and the end-of-day GL close to reduce total batch window duration, but the two jobs share a database lock on the trial balance table, causing intermittent deadlocks that corrupt the DFAST snapshot on 3 of the first 12 quarter-end runs. The AI scheduler does not have access to the dependency graph encoded in the legacy batch control table, which was never documented for the ML training dataset. OCC model risk guidance and FFIEC IT Handbook batch management requirements expect banks to maintain deterministic, dependency-aware batch sequencing for regulatory reporting; AI optimisation of batch scheduling without full dependency modelling introduces systemic regulatory reporting risk.`,
    keywords: ['SR 11-7', 'DFAST', 'FFIEC IT Handbook', 'AI batch scheduling', 'core banking'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2148',
    name: 'AI Fraud Scoring Embedded in Core Banking Creates Fair Lending Disparate Impact',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital embeds an AI fraud scoring model directly into its core banking transaction approval workflow; the model uses device fingerprint and geolocation features that are correlated with race and national origin, causing the automated hold rate on legitimate transactions for minority customers to be 2.3x higher than for non-minority customers in a matched sample analysis. An ECOA disparate impact examination identifies the disparity and requires the bank to perform a full fair lending analysis of the AI model's feature set and outcome distributions. ECOA, Regulation B, and CFPB examination guidance require banks to evaluate AI models used in customer-impacting decisions for disparate impact; fraud scoring models embedded in core transaction processing are subject to the same fair lending standards as credit underwriting models.`,
    keywords: ['ECOA', 'Regulation B', 'AI fraud scoring', 'disparate impact', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2149',
    name: 'LLM Customer Service Integration Exposes Core Banking API Without Rate Limiting',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an LLM-powered chatbot that can retrieve account balance and transaction history by calling the core banking REST API on behalf of authenticated customers; the integration does not implement per-session rate limiting on the chatbot-to-core-banking API calls. A single session initiated by a customer support bot testing script generates 14,000 balance enquiry API calls in 6 minutes, overwhelming the core banking API gateway and causing a 23-minute degradation of balance query availability for all channels. FFIEC IT Handbook guidance on application security and availability requires banks to implement rate limiting and circuit breaker patterns for all API connections to core banking systems; AI assistant integrations that can generate unbounded API traffic against production core banking APIs are an availability risk.`,
    keywords: ['FFIEC IT Handbook', 'LLM', 'core banking API', 'rate limiting', 'availability'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2150',
    name: 'AI Model Drift in Core Transaction Categorisation Degrades HMDA Data Quality',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital uses an ML model for real-time transaction categorisation within its core banking platform to support HMDA data population; after 14 months in production without retraining, the model experiences concept drift as new payment types introduced by FedNow and open banking APIs fall outside its training distribution, causing 8.4% of FedNow mortgage-related payments to be miscategorised and omitted from HMDA LAR records. The bank's SR 11-7 monitoring programme does not include a population stability index check for the categorisation model because it was classified as low risk at deployment. SR 11-7 requires ongoing performance monitoring commensurate with model risk; models used in regulatory data pipelines should be reclassified when their output directly affects mandatory regulatory submissions regardless of initial risk tier.`,
    keywords: ['SR 11-7', 'HMDA', 'model drift', 'ML categorisation', 'core banking'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2151',
    name: 'Autonomous AI Agent Initiates Wire Transfers Without Human Authorisation Gate',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital pilots an autonomous AI agent designed to resolve stale nostro reconciliation items by initiating correcting wire transfers; the agent is granted direct API access to the wire origination module with a $100K per-transaction limit and executes 17 wire transfers totalling $1.1M over a weekend before the treasury operations team is notified. Three of the wires are incorrect due to the agent misidentifying correspondent bank accounts from ambiguous SWIFT message fields, requiring costly wire recalls and relationship management with correspondent banks. OCC guidance on operational risk and the Fedwire Funds Service operating circular both require banks to maintain human authorisation controls for outbound wire transfers; autonomous AI agents with direct wire origination authority bypass the segregation of duties requirements fundamental to treasury operations.`,
    keywords: ['OCC', 'Fedwire', 'autonomous AI agent', 'wire transfer', 'dual-control'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2152',
    name: 'AI-Generated Regulatory Capital Calculation Introduces Unvalidated Formula Substitution',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital uses a generative AI coding assistant to help its capital analytics team update the Basel III regulatory capital calculation scripts; the AI assistant substitutes a simplified RWA formula for the standardised approach that approximates but does not replicate the OCC-required calculation, resulting in a $12.3M understatement of risk-weighted assets that goes undetected through two quarterly submissions. The discrepancy is identified by an internal audit team member who independently re-runs the calculation using the official OCC capital adequacy standards documentation. Basel III capital adequacy rules and OCC examination standards require banks to implement regulatory capital calculations that precisely match the published formulae; AI-assisted code generation for capital calculation models requires mandatory independent validation before deployment to production.`,
    keywords: ['Basel III', 'OCC', 'regulatory capital', 'AI code generation', 'RWA calculation'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2153',
    name: 'ML Liquidity Forecasting Model Miscalibrates Intraday Cash Position Projection',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an ML model to forecast intraday liquidity needs and optimise its Federal Reserve account balance; the model is trained on historical payment flows but was not tested on scenarios where large commercial clients change their settlement patterns after adopting real-time treasury management systems. In Q4 the bank's largest commercial tenant migrates to continuous settlement, shifting $340M of daily payment volume from batch to intraday, causing the ML forecast to underestimate morning peak liquidity needs by 28% and triggering two same-day borrowing events at the Fed Funds rate. Federal Reserve LCR and intraday liquidity reporting guidance require banks to maintain reliable intraday cash position visibility; ML liquidity models require stress testing against payment pattern change scenarios before deployment and ongoing recalibration.`,
    keywords: ['Federal Reserve', 'LCR', 'ML liquidity forecasting', 'intraday cash', 'SR 11-7'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2154',
    name: 'AI Code Review Tool Approves Core Banking Patch With SQL Injection Vulnerability',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital integrates an AI-powered code review assistant into its core banking development pipeline and grants it the ability to auto-approve low-risk patches; the AI assistant approves a data migration patch containing a string concatenation SQL query that a human reviewer would have flagged as a SQL injection vulnerability, based on the AI's incorrect assessment that parameterised queries are not applicable to internal batch migration scripts. The vulnerability is discovered during a penetration test 3 months after deployment; remediation requires an emergency patch deployment and a retroactive review of 94 AI-approved patches from the same period. FFIEC IT Handbook application security guidance requires banks to perform security-sensitive code review by qualified human reviewers; AI auto-approval of code changes to core banking systems is inconsistent with the depth of review required for critical financial infrastructure.`,
    keywords: ['FFIEC IT Handbook', 'AI code review', 'SQL injection', 'core banking security', 'patch management'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2155',
    name: 'GenAI Summarisation of Core Banking Exam Findings Omits Material Observations',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's compliance team uses a generative AI tool to summarise OCC examination findings for board reporting; the AI model summarises a 140-page examination report and omits two Matters Requiring Attention related to core banking operational risk that appear in a technical appendix with dense regulatory language, because the model's summarisation training emphasised executive summary content over appendix material. The board receives a summary reporting zero MRAs when the actual report contains two that require a written remediation plan within 90 days, creating a governance gap identified only when the OCC follows up on the board response timeline. OCC examination process requirements and bank governance standards require that examination findings be communicated to the board accurately and completely; AI-assisted regulatory communication presents material risk when it substitutes for direct review of examination documents by qualified compliance officers.`,
    keywords: ['OCC', 'GenAI', 'examination findings', 'board reporting', 'compliance governance'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2156',
    name: 'AI-Powered Overdraft Decision Engine Bypasses Reg E Opt-In Requirement',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital deploys an AI overdraft decision engine that dynamically evaluates whether to authorise ATM and debit card transactions that would overdraw a customer's account; the system is configured to approve overdraft transactions for customers who the AI scores as high-credit-quality regardless of whether the customer has affirmatively opted into overdraft coverage under Regulation E. CFPB examination of the bank's debit card overdraft programme identifies that 2,100 customers have been charged overdraft fees without a valid Reg E opt-in on file. Regulation E Section 205.17 requires banks to obtain affirmative customer consent before charging overdraft fees on ATM and debit card transactions; AI overdraft decisioning systems must enforce regulatory opt-in status as a prerequisite before any credit quality scoring logic is applied.`,
    keywords: ['Regulation E', 'CFPB', 'overdraft', 'AI decision engine', 'opt-in requirement'],
    demoRelevant: true,
    subTopic: 'ai-core-banking',
  },
  {
    code: 'B2157',
    name: 'AI Vendor Change Management Process Does Not Require Bank Approval for Model Updates',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital licenses an AI-powered transaction monitoring module from a fintech vendor that is embedded in its core banking platform; the vendor's SaaS agreement allows the vendor to push model updates without prior bank notification, classifying model version changes as routine software maintenance. The vendor deploys a model update that reduces fraud detection sensitivity to lower false positive rates, causing First Capital's SAR filing volume to drop 34% in the subsequent 60 days — a change the bank's BSA officer does not attribute to the model update until the vendor discloses the change during a quarterly business review. OCC Bulletin 2013-29 TPRM requirements and SR 11-7 model risk management guidance require banks to receive advance notification of and approve material changes to vendor-hosted AI models used in compliance functions; silent model updates to core banking AI components are a model governance and vendor oversight failure.`,
    keywords: ['OCC Bulletin 2013-29', 'SR 11-7', 'AI vendor management', 'BSA', 'model governance'],
    demoRelevant: false,
    subTopic: 'ai-core-banking',
  },

  // ── core-migration-failures (12) ──────────────────────────────────────────
  {
    code: 'B2158',
    name: 'Data Migration Validation Suite Misses Truncated Account Number Fields',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's core banking migration validation suite tests row counts and nullable field coverage but does not validate field-level data length against the target schema's column constraints; when the migration utility writes account numbers to a target table with a VARCHAR(16) column that silently truncates values longer than 16 characters, 4,300 accounts with 17-character account numbers from an acquired institution have their identifiers truncated without error. The truncation is discovered six weeks post-cutover when the ACH returns matching engine cannot reconcile incoming returns to account records, causing 318 ACH returns to remain unposted. FFIEC IT Handbook data governance guidance requires banks to perform comprehensive field-level data validation during core banking migrations; row-count-only validation suites are an inadequate data migration quality assurance approach for regulated financial institutions.`,
    keywords: ['FFIEC IT Handbook', 'data migration', 'validation gap', 'ACH', 'core banking'],
    demoRelevant: true,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2159',
    name: 'Parallel-Run Testing Period Shortened by Six Weeks to Meet Board Deadline',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's core banking migration programme schedules a 12-week parallel-run period in which both the legacy and new systems process live transactions simultaneously; board pressure to meet a fiscal year-end cutover date leads programme management to shorten the parallel run to 6 weeks after the first 4 weeks show acceptable results in the consumer deposit book but before commercial lending and treasury modules have been tested under real transaction volumes. Post-cutover, commercial loan interest accrual discrepancies and treasury sweep configuration errors generate $1.8M in reconciliation exceptions in the first 30 days that would have been identified during the truncated parallel run period. OCC and FDIC examination guidance on core banking migrations require parallel testing periods that cover all product lines and seasonal volume patterns; shortening parallel-run testing to meet calendar deadlines is a programme governance failure that transfers risk to the production environment.`,
    keywords: ['OCC', 'FDIC', 'parallel-run testing', 'core banking migration', 'programme governance'],
    demoRelevant: true,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2160',
    name: 'Rollback Plan Lacks Pre-Approved Change Advisory Board Authorization',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's core banking cutover plan documents a rollback procedure but does not obtain pre-approved CAB authorisation for the rollback change before the cutover weekend begins; when a critical defect is discovered 4 hours into the go-live, the incident commander initiates rollback only to discover that the CAB approval process requires a minimum 2-hour convening period under the bank's change management policy. The delay adds 2.5 hours to the total incident duration and requires emergency escalation to the CTO to invoke an expedited approval path that the change policy does not formally recognise. FFIEC IT Handbook change management guidance requires banks to pre-authorise back-out procedures for major technology changes before change execution; rollback plans that are not pre-approved as part of the change package are a change management control deficiency.`,
    keywords: ['FFIEC IT Handbook', 'change management', 'rollback plan', 'CAB', 'core banking migration'],
    demoRelevant: false,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2161',
    name: 'Reference Data Migration Preserves Legacy Product Codes That New System Cannot Process',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital migrates its core banking product reference data without first rationalising 87 legacy product codes that exist only in the old system's code table and have no equivalent mapping in the target platform's product catalogue; the migration utility creates placeholder entries for unmapped codes rather than halting and requiring human review. Post-cutover, 6,200 accounts holding these products cannot complete online balance transfers because the new system's transaction engine rejects operations referencing unrecognised product codes. FFIEC IT Handbook guidance on data management and conversion requires banks to resolve all data mapping ambiguities before production migration rather than using placeholder values that defer the problem; reference data migration with unresolved mappings is a systemic quality gap in core banking conversion programmes.`,
    keywords: ['FFIEC IT Handbook', 'reference data', 'data migration', 'product codes', 'core banking'],
    demoRelevant: false,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2162',
    name: 'Historical Transaction Archive Not Migrated Causes Reg E Dispute Resolution Failure',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's core banking migration scope excludes transaction history older than 24 months from the production migration to reduce data volume and cutover duration; post-cutover, the bank's Reg E dispute resolution process requires access to transactions from the prior 36 months for a subset of disputes, and customer service representatives cannot locate the archived records in the legacy system that has been decommissioned. The bank is unable to meet the 10-day provisional credit and 45-day investigation timelines for 214 Reg E disputes that involve pre-migration transaction history. Regulation E Section 205.11 requires banks to investigate disputes within defined timeframes; decommissioning legacy systems that contain records required for regulatory dispute resolution without ensuring accessible archival constitutes a compliance gap.`,
    keywords: ['Regulation E', 'CFPB', 'data migration', 'transaction archive', 'dispute resolution'],
    demoRelevant: true,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2163',
    name: 'Migration Cutover Communication Plan Excludes ATM Vendor Network Downtime Coordination',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking cutover communication plan notifies internal business units and digital channel vendors but does not include a notification to its ATM network processor, which uses a separate settlement file format that the new core banking system does not initially support. During the first weekend post-cutover, ATM transactions process through the network but the settlement reconciliation fails for all 14 hours of overnight processing because the ATM processor is trying to match against the legacy settlement file format, causing 8,400 ATM transactions to settle into a suspense account. FFIEC IT Handbook guidance on change management and third-party coordination requires banks to identify all downstream counterparties affected by core banking changes and include them in cutover communication and testing plans.`,
    keywords: ['FFIEC IT Handbook', 'ATM network', 'cutover planning', 'settlement reconciliation', 'core banking migration'],
    demoRelevant: false,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2164',
    name: 'Interest Calculation Rounding Convention Mismatch Between Legacy and New Core',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's new core banking platform uses a different daily interest accrual rounding convention from the legacy system — rounding to 4 decimal places versus 6 — creating a systematic per-account daily variance that accumulates to $0.03–$0.18 per account over a month; across 340,000 interest-bearing accounts the aggregate monthly variance is $28,400, which is posted entirely to a single GL suspense account rather than allocated back to individual customers. The variance is immaterial at the individual account level but material in aggregate and triggers a regulatory examination finding related to accurate interest posting under Regulation DD. Regulation DD truth-in-savings requirements and OCC examination standards expect interest calculations to be accurate at the account level; rounding convention differences between legacy and replacement core systems must be identified and resolved before cutover.`,
    keywords: ['Regulation DD', 'OCC', 'interest calculation', 'rounding convention', 'core banking migration'],
    demoRelevant: false,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2165',
    name: 'User Acceptance Testing Pool Does Not Include Teller Workforce for Core Migration',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's core banking migration UAT programme invites participation from technology, compliance, and operations management but does not include front-line tellers who perform the highest daily transaction volume on the core banking platform. Post-cutover, tellers encounter 23 workflow differences from the legacy system that were not identified during UAT, including a changed cash advance posting flow that requires 4 additional keystrokes per transaction, reducing per-branch transaction capacity by 11% and generating customer queue time complaints in the first two weeks. FFIEC IT Handbook guidance on system development and acquisition requires banks to include end-user representatives in acceptance testing for systems that directly support customer-facing operations; excluding operational end-users from core banking UAT is a programme governance gap that defers usability defects to the production environment.`,
    keywords: ['FFIEC IT Handbook', 'UAT', 'core banking migration', 'teller operations', 'end-user testing'],
    demoRelevant: false,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2166',
    name: 'Dormant Account Migration Reactivates Escheatment-Due Balances Without State Filing',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's core banking migration resets the inactivity timestamp on 1,840 accounts that were within 90 days of their state escheatment reporting deadline, because the migration utility writes the current timestamp as the last-activity date for all migrated records rather than preserving the original dormancy date. The escheatment reporting cycle passes without these accounts being included in the state unclaimed property filing, creating a multi-state regulatory compliance gap that is discovered during the bank's next annual unclaimed property review 14 months later. State unclaimed property laws require banks to track dormancy periods accurately and file required reports on schedule; core banking migrations that modify account activity timestamps without preserving original dormancy data create systemic escheatment compliance risk.`,
    keywords: ['unclaimed property', 'escheatment', 'data migration', 'dormant accounts', 'core banking'],
    demoRelevant: true,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2167',
    name: 'Cutover Dry Run Executed on Non-Representative Data Sample Masks Production Defects',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital conducts two full cutover dress rehearsals using a sanitised data subset representing 20% of production account volume selected for data privacy compliance; the subset excludes multi-currency accounts and accounts with non-standard character sets in customer names because the data anonymisation tool cannot process them, which are exactly the account types where the migration utility has encoding bugs. The encoding defects surface only in the production cutover affecting 3,400 customers with names containing diacritical marks, whose online banking profiles display corrupted name fields. FFIEC IT Handbook guidance on technology migration testing requires rehearsals to be representative of production data characteristics; sanitised test datasets that exclude edge-case populations provide false confidence in migration readiness.`,
    keywords: ['FFIEC IT Handbook', 'cutover dry run', 'data migration', 'character encoding', 'core banking'],
    demoRelevant: false,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2168',
    name: 'Post-Migration Reconciliation Window Closed Before All Intraday Exceptions Resolved',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's core banking migration programme plan allocates a 72-hour post-cutover reconciliation window to resolve outstanding differences before decommissioning the legacy system's reconciliation processes; business pressure to declare cutover complete leads operations management to close the reconciliation window at 48 hours with 6 unresolved intraday settlement exceptions totalling $740K still pending investigation. The exceptions remain in a suspense account for 23 days before a separate internal audit engagement identifies and resolves them, during which period the bank's daily GL close contains a known unreconciled balance that is not disclosed to management in the operating reports. OCC and FFIEC guidance requires banks to resolve all reconciliation exceptions before closing migration validation activities; premature closure of post-migration reconciliation windows is a financial reporting integrity risk.`,
    keywords: ['OCC', 'FFIEC', 'post-migration reconciliation', 'suspense account', 'core banking'],
    demoRelevant: false,
    subTopic: 'core-migration-failures',
  },
  {
    code: 'B2169',
    name: 'Core Banking Vendor Hypercare Support Scope Narrower Than Bank Expected',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital contracts for a 60-day hypercare support period from its core banking platform vendor after go-live, expecting 24/7 on-site engineering support for all production defects; the vendor's hypercare agreement specifies support for defects in the vendor's base product only, excluding configuration defects, integration defects, and data migration exceptions which represent 68% of the post-cutover incident backlog. The bank incurs $890K in unplanned consulting fees to resolve configuration and integration defects that fall outside the hypercare scope while the vendor's hypercare team addresses only base product bugs. OCC Bulletin 2013-29 TPRM guidance requires banks to ensure vendor contracts define support scope with sufficient specificity for critical production support periods; vague hypercare scope definitions in core banking contracts are a contract negotiation and vendor management gap.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'hypercare', 'core banking migration', 'vendor contract'],
    demoRelevant: false,
    subTopic: 'core-migration-failures',
  },

  // ── ledger-reconciliation-gaps (10) ───────────────────────────────────────
  {
    code: 'B2170',
    name: 'Inter-System Reconciliation Break Persists 72 Hours Without Escalation Trigger',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital operates a core banking system and a separate loan servicing platform that reconcile balances daily; the reconciliation control framework sets an escalation threshold at $1M for any single-day break, but a break of $820K that persists across 3 consecutive days — totalling $2.46M in cumulative unreconciled exposure — never triggers escalation because the threshold is evaluated per-day rather than on a rolling basis. The break is caused by a loan servicing fee posting that the core banking system records differently from the loan servicer, and it remains in a subledger suspense account for 31 days before a monthly close review identifies it. OCC and FFIEC examination guidance expect banks to design reconciliation escalation controls that detect persistent breaks regardless of daily magnitude; per-day threshold designs that do not accumulate rolling balances are an internal control design weakness.`,
    keywords: ['OCC', 'FFIEC', 'inter-system reconciliation', 'subledger', 'suspense account'],
    demoRelevant: true,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2171',
    name: 'Nostro Reconciliation Uses T+2 Data While Correspondent Bank Reconciles T+1',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's nostro account reconciliation process uses the prior-day (T+1) SWIFT MT940 statement from its correspondent bank but compares it against the bank's own general ledger which reflects transactions booked at T+2 due to a legacy batch processing window; the two-day comparison horizon creates systematic phantom breaks that the reconciliation team spends an average of 3.8 hours per day manually ageing out. The reconciliation team cannot reliably identify genuine exceptions from timing differences, causing 4 genuine posting errors totalling $340K to be aged through the phantom break queue and remain undetected for an average of 11 days. Federal Reserve and OCC guidance on correspondent banking and nostro management requires banks to reconcile nostro accounts on a same-day basis using the most current available statements; T+2 reconciliation that systematically obscures genuine exceptions is an operational risk control gap.`,
    keywords: ['Federal Reserve', 'OCC', 'nostro reconciliation', 'SWIFT MT940', 'correspondent banking'],
    demoRelevant: false,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2172',
    name: 'Vostro Account Reconciliation Excludes FX Revaluation Entries From Comparison',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital maintains vostro accounts for three foreign correspondent banks and performs daily balance reconciliation; the reconciliation tool is configured to exclude FX revaluation entries from the comparison set because they were historically always zero-sum within a business day. Following an increase in FX volatility, same-day FX revaluation entries can be as large as $1.2M and are booked on different schedules by the two systems, causing genuine reconciliation breaks that the exclusion logic masks for 48 hours. An OCC examination of First Capital's international banking operations identifies the exclusion configuration as an internal control design flaw. OCC and Federal Reserve examination standards require all material transaction types to be included in nostro and vostro reconciliation controls; configuring reconciliation tools to exclude transaction categories based on historical behaviour creates blind spots when market conditions change.`,
    keywords: ['OCC', 'Federal Reserve', 'vostro account', 'FX revaluation', 'reconciliation control'],
    demoRelevant: false,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2173',
    name: 'Suspense Account Aging Policy Allows Items to Age 90 Days Without Management Review',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's suspense account management policy requires management review of items aged beyond 90 days, but the bank's reconciliation system does not automatically flag items to management when the threshold is crossed; the monthly suspense account report is generated manually and the operations team distributes it to the suspense account owner without a separate management escalation. An OCC examination identifies 14 items totalling $6.8M that have aged beyond 90 days in a single suspense account with no documented management review, including two items that appear to be duplicate credits from a prior year ACH processing error. OCC examination guidance and FFIEC IT Handbook internal control standards require banks to implement automated aging controls with mandatory management escalation for suspense accounts; manual reporting processes that rely on recipients to identify aged exceptions are ineffective internal controls.`,
    keywords: ['OCC', 'FFIEC IT Handbook', 'suspense account', 'aging policy', 'internal controls'],
    demoRelevant: true,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2174',
    name: 'Securities Settlement Fails Create Unmatched Positions in Core Banking DDA',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's broker-dealer subsidiary settles securities transactions through a DTC clearing account that is reconciled to the firm's core banking demand deposit account; when securities settlement fails occur and DTC issues a fail notice, the core banking reconciliation process does not reverse the original settlement debit, creating unmatched DDA positions that persist until the fail is resolved or bought-in. During a period of elevated settlement fails in a volatile market, 34 unmatched DDA positions accumulate over 3 days totalling $12.4M in potentially double-counted cash, which inflates the bank's reported liquidity position in intraday risk reporting. SEC Rule 15c3-3 customer protection rule and Federal Reserve intraday credit monitoring requirements require broker-dealers and their affiliated banks to accurately reflect fail positions in all financial reporting; fail-agnostic reconciliation designs that do not reverse settlement entries on notification are an operational risk gap.`,
    keywords: ['SEC Rule 15c3-3', 'Federal Reserve', 'securities settlement', 'DDA reconciliation', 'settlement fails'],
    demoRelevant: false,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2175',
    name: 'Intraday Liquidity Monitor Does Not Reconcile to Core Banking General Ledger',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital maintains a separate real-time intraday liquidity monitoring system that aggregates payment flows from CHIPS, Fedwire, and ACH; the intraday monitor uses a separate data feed from the payment processing systems and is never reconciled to the bank's core banking general ledger, creating a structural gap where $1.1B in intraday positions is managed using data that diverges from the official books of record by up to $230M at peak times due to timing differences in the two feeds. An FDIC examination identifies the structural divergence as a material liquidity risk management weakness. Federal Reserve supervisory guidance SR 14-1 on intraday liquidity risk management requires banks to ensure that intraday liquidity monitoring uses data that is reconcilable to the books of record; a standalone monitoring system that is structurally disconnected from the GL is an intraday risk management control gap.`,
    keywords: ['Federal Reserve SR 14-1', 'FDIC', 'intraday liquidity', 'GL reconciliation', 'CHIPS'],
    demoRelevant: true,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2176',
    name: 'ACH Return Item Suspense Accumulates Due to Unmapped Return Reason Code Handling',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's core banking ACH processing module has handling logic for the 28 most common return reason codes but does not have a defined disposition path for 6 less-common return codes introduced in the last Nacha Operating Rules annual update; transactions returned with unmapped codes are automatically routed to a catch-all suspense account rather than triggering an exception queue for manual review. Over a 6-month period, the catch-all suspense accumulates $3.4M in unmapped return items that are never investigated, and the bank fails to pass the correct return entries back to originating ODFIs within the Nacha-required 2-day return settlement window. Nacha Operating Rules require ODFIs to settle return items within defined timeframes; suspense routing that bypasses return processing timelines creates Nacha rule violation exposure and potential RDFI liability.`,
    keywords: ['Nacha', 'ACH returns', 'suspense account', 'return reason codes', 'ODFI'],
    demoRelevant: false,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2177',
    name: 'Month-End Close Reconciliation Requires Manual Override for Recurring Control Failures',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's month-end close process includes 14 automated reconciliation controls; two of the controls have failed on every month-end close for the past 9 months due to a known GL mapping defect that the core banking team has not prioritised for remediation. The controllers have established a documented manual override procedure that approves the GL close despite the failing controls, but the manual override approvals are not independently reviewed and the underlying defect has never been formally acknowledged in the bank's internal control inventory. OCC internal controls examination standards and COSO framework principles require that known control failures be remediated, tracked in the control deficiency register, and subject to compensating control review; normalised manual override of recurring control failures is a control environment degradation signal.`,
    keywords: ['OCC', 'COSO', 'month-end close', 'manual override', 'internal controls'],
    demoRelevant: false,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2178',
    name: 'Deferred Revenue Subledger to GL Reconciliation Run Weekly Instead of Daily',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital defers loan origination fee income in a subledger and amortises it to the GL on a daily schedule; the reconciliation between the subledger and the GL runs weekly rather than daily, creating a 6-day window in which undetected subledger-to-GL differences can accumulate before detection. During a 3-month period following a subledger configuration change, the weekly reconciliation masks a $4.7M systematic under-amortisation error that results in a material restatement of net interest margin in the quarterly financial supplement. GAAP ASC 310-20 revenue recognition requirements and OCC financial reporting examination guidance require banks to reconcile deferred fee subledgers to the GL on a frequency commensurate with the materiality of the balances; weekly reconciliation cycles for material subledgers are an internal control frequency gap.`,
    keywords: ['ASC 310-20', 'OCC', 'deferred revenue', 'subledger reconciliation', 'net interest margin'],
    demoRelevant: false,
    subTopic: 'ledger-reconciliation-gaps',
  },
  {
    code: 'B2179',
    name: 'Core Banking GL Chart of Accounts Has 340 Inactive Accounts Still Receiving Postings',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's general ledger chart of accounts contains 340 accounts that were marked inactive in the GL administration system during a rationalisation exercise but were not disabled in the core banking posting rules engine, which continues to route transactions to them based on stale account mappings. The inactive accounts accumulate $18.7M in postings over 18 months that are excluded from the bank's standard financial reporting extracts because the reporting tool filters out inactive accounts, creating a systematic omission from management accounts that is not detected until an internal audit GL completeness review. OCC financial reporting examination standards and GAAP completeness requirements require banks to ensure that all posted transactions are included in financial reports; GL system designs that permit postings to inactive accounts without reconciliation inclusion are a financial reporting integrity risk.`,
    keywords: ['OCC', 'GAAP', 'chart of accounts', 'GL reconciliation', 'financial reporting'],
    demoRelevant: true,
    subTopic: 'ledger-reconciliation-gaps',
  },

  // ── account-lifecycle-management (10) ─────────────────────────────────────
  {
    code: 'B2180',
    name: 'Dormant Account Escheatment Process Misses Accounts Reopened by Automated Fee Posting',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's dormancy tracking logic resets the inactivity clock whenever a transaction posts to an account, including automated monthly maintenance fee postings that the bank's system initiates without customer action; accounts that should qualify for escheatment after 3 years of customer inactivity are perpetually reset by the automated fee postings and never reach the escheatment trigger. An Ohio Division of Unclaimed Funds examination identifies that First Capital has failed to report and remit funds for an estimated 12,400 accounts that meet the statutory dormancy definition under Ohio unclaimed property law because the bank's dormancy definition treats bank-initiated fees as customer-initiated activity. All 50 states' unclaimed property statutes require banks to measure dormancy based on owner-initiated activity only; automated bank-originated transactions cannot be used to reset dormancy clocks under state unclaimed property law.`,
    keywords: ['unclaimed property', 'escheatment', 'dormant accounts', 'dormancy clock', 'state law'],
    demoRelevant: true,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2181',
    name: 'Account Closure Documentation Retention Policy Below Regulatory Minimum',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's records retention policy for closed account documentation specifies a 5-year retention period after account closure, which falls below the 7-year retention requirement applicable to account records under BSA and the bank's FDIC deposit insurance documentation obligations; closed account records purged under the 5-year policy are unavailable when the bank receives a grand jury subpoena for records from closed accounts in the 5-to-7-year range. FDIC Part 370 recordkeeping rules and BSA Section 31 CFR 1020.410 require banks to retain account records for a minimum of 5 years after account closure, with certain AML-related records subject to 7-year retention; a policy error that understates regulatory minimums and results in early destruction is a records management compliance failure with criminal investigation implications.`,
    keywords: ['BSA', 'FDIC Part 370', 'records retention', 'account closure', 'grand jury subpoena'],
    demoRelevant: false,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2182',
    name: 'Joint Account Survivorship Rights Not Enforced by Core Banking System at Account Level',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's core banking system stores joint account survivorship designation as a free-text comment field rather than a structured attribute, causing the death-of-co-owner processing workflow to rely on customer service representatives reading comment text rather than system-enforced logic; when a customer service representative processes the death of a joint account holder and does not notice the survivorship designation comment, the bank converts the account to an estate account rather than a single-owner account, requiring court documents from the surviving owner to restore access. The bank processes 34 such accounts incorrectly over a 2-year period, each requiring a legal remediation process. OCC fiduciary and deposit operations examination standards require banks to enforce account ownership structures as structured data attributes, not free-text comments; unstructured survivorship data creates systematic account mishandling risk.`,
    keywords: ['OCC', 'joint account', 'survivorship rights', 'account lifecycle', 'estate processing'],
    demoRelevant: false,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2183',
    name: 'Minor Account Automatic Conversion at Age of Majority Sends Incorrect Disclosures',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's core banking system automatically converts custodial minor accounts to individual accounts when the minor reaches age 18 based on date-of-birth data; the conversion process sends the new account holder a disclosure package for the bank's standard checking product rather than for the product the converted account actually represents, because the conversion routine uses a static disclosure template rather than dynamically selecting based on the converted account's product type. CFPB Regulation DD requires banks to provide accurate account terms disclosures for new accounts; sending incorrect disclosures for converted accounts because of a static template defect is a TISA compliance failure that affects all 890 minor account conversions the bank processes annually.`,
    keywords: ['Regulation DD', 'CFPB', 'minor accounts', 'account conversion', 'TISA disclosure'],
    demoRelevant: false,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2184',
    name: 'Account Reactivation Process Bypasses Enhanced Due Diligence for Dormant High-Risk Accounts',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's process for reactivating dormant accounts requires only identity verification but does not trigger a re-evaluation of the account's BSA risk rating or CDD profile, even for accounts that were dormant for more than 3 years; when a customer reactivates a formerly dormant account that was rated high-risk at opening, the reactivation does not prompt an EDD review and the account immediately begins transacting at elevated volumes. A FinCEN examination identifies the reactivation gap as a systemic weakness, noting that 43 reactivated high-risk accounts processed $12M in transactions in the 60 days following reactivation without triggering a CDD refresh. FinCEN CDD rules require banks to perform risk-appropriate due diligence at account opening and at any point where a risk-relevant change occurs; reactivation of a long-dormant high-risk account constitutes a material change in account activity that triggers enhanced due diligence obligations.`,
    keywords: ['FinCEN', 'BSA', 'CDD', 'EDD', 'dormant account reactivation'],
    demoRelevant: true,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2185',
    name: 'Power of Attorney Account Access Not Revoked When POA Document Expires',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital accepts durable and non-durable power of attorney documents for account access and stores the expiry date in the core banking customer profile, but the system does not automatically revoke POA-based access when the expiry date passes; a POA agent whose authority expired 14 months prior continues to access and transact on an elderly customer's accounts because the bank's daily process that should remove expired POA access has been non-operational since a core banking patch broke the scheduled job without alerting operations. The bank discovers the lapsed access during an internal audit of fiduciary account controls, identifying 312 accounts with expired POA access that was not revoked. OCC fiduciary activity examination standards require banks to maintain current and accurate access controls for accounts managed under fiduciary capacity; automated access controls that depend on scheduled processes without monitoring are inadequate internal controls.`,
    keywords: ['OCC', 'power of attorney', 'fiduciary access', 'account lifecycle', 'access revocation'],
    demoRelevant: false,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2186',
    name: 'Deceased Account Hold Process Does Not Prevent ACH Debits From Clearing',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's deceased account processing workflow places a debit hold on a deceased customer's account when a death certificate is received, but the hold is implemented as a core banking flag that blocks teller and online banking debits while ACH debit entries continue to process because the ACH processing engine reads holds from a separate table that the deceased account workflow does not update. Following notification of a customer's death, 11 ACH debit entries from recurring billers post to the account over the 45 days before the estate administrator contacts the bank, totalling $2,340 in post-death debits that the estate must recover from each biller individually. Nacha Operating Rules and OCC deposit operations guidance require banks to return ACH items presented against deceased customer accounts; account hold architectures that use separate control tables for different access channels create gaps that allow prohibited transactions to process.`,
    keywords: ['Nacha', 'OCC', 'deceased account', 'ACH debit hold', 'estate processing'],
    demoRelevant: false,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2187',
    name: 'Account Number Recycling Policy Assigns Former Account Numbers to New Customers',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's core banking system recycles account numbers from closed accounts after a 12-month waiting period; a new customer is assigned a recycled account number that was previously used by a customer who had unresolved ACH returns and outstanding overdraft balances. The new customer receives ACH debit entries and collections contacts intended for the prior account holder and has difficulty with the bank's ACH originator de-authorisation process because some originators cross-reference both account number and prior customer name. Nacha Operating Rules and CFPB account management expectations require banks to manage account number recycling with sufficient safeguards to prevent confusion between former and new account holders; 12-month recycling windows are insufficient for accounts with outstanding obligations.`,
    keywords: ['Nacha', 'CFPB', 'account number recycling', 'ACH', 'account lifecycle'],
    demoRelevant: false,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2188',
    name: 'Trust Account Termination Distributes Residual to Wrong Beneficiary Due to Stale Core Record',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's fiduciary operations team terminates a living trust account and distributes the residual balance to the beneficiary listed in the core banking customer profile; the core banking record reflects the original trust document beneficiary designation from 7 years prior, while a trust amendment filed 3 years ago with First Capital's trust operations department designated a different beneficiary and was stored in the document management system but never updated in the core banking profile. The distribution of $340,000 to the wrong beneficiary is discovered when the intended beneficiary contacts the bank; recovery requires legal proceedings. OCC fiduciary regulations 12 CFR Part 9 require banks to maintain accurate and current trust document records that are integrated with operational systems; document management systems that are not synchronised with core banking beneficiary records create systemic distribution error risk.`,
    keywords: ['OCC 12 CFR Part 9', 'trust account', 'fiduciary', 'beneficiary designation', 'core banking'],
    demoRelevant: false,
    subTopic: 'account-lifecycle-management',
  },
  {
    code: 'B2189',
    name: 'Business Account Beneficial Ownership Records Not Updated at Account Renewal',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital collects beneficial ownership certification for business accounts at opening as required by FinCEN's CDD rule, but the bank's account renewal process — triggered by periodic account reviews — does not prompt beneficial ownership re-certification, allowing business accounts to operate for years with stale beneficial ownership records after ownership changes. A FinCEN examination identifies that 1,240 business accounts have beneficial ownership records more than 3 years old, including 84 accounts where business registry filings indicate the ownership structure has changed materially since the original certification. FinCEN CDD rule requires banks to maintain accurate beneficial ownership information and to collect updated certifications when a risk-relevant change is identified; renewal processes that do not include beneficial ownership refresh are a systematic CDD control gap.`,
    keywords: ['FinCEN', 'CDD rule', 'beneficial ownership', 'BSA', 'account renewal'],
    demoRelevant: true,
    subTopic: 'account-lifecycle-management',
  },

  // ── core-system-resilience (10) ───────────────────────────────────────────
  {
    code: 'B2190',
    name: 'RTO Objective of Four Hours Not Met in Any of Last Three DR Tests',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description:
      `First Capital's business continuity plan specifies a 4-hour recovery time objective for its core banking platform; the bank conducts annual full failover DR tests and has failed to achieve the 4-hour RTO in each of the last three tests, with actual recovery times of 6.2, 7.8, and 5.9 hours, driven primarily by manual steps in the database failover procedure that have not been automated despite post-test remediation commitments. Each year's post-test action item list contains the database automation item as a carry-forward, with completion deferred due to resource constraints. OCC and FFIEC Business Continuity Management guidance require banks to demonstrate that their recovery objectives are achievable through testing; persistent RTO failures that are not remediated through enforceable action plans are a resilience programme governance failure that examiners treat as a material finding.`,
    keywords: ['OCC', 'FFIEC BCM', 'RTO', 'DR testing', 'core banking resilience'],
    demoRelevant: true,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2191',
    name: 'RPO Gap Discovered During Recovery Test When 18 Hours of Transaction Data Is Lost',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's core banking DR architecture uses asynchronous database replication to its disaster recovery site with a documented recovery point objective of 4 hours; during a full failover DR test, the team discovers that the replication lag under a realistic write load is 18 hours rather than 4, because the replication bandwidth allocation was not reconfigured after the core banking transaction volume grew 40% following a branch acquisition. The 18-hour RPO gap means the bank would lose 18 hours of transaction data in a real disaster, affecting deposits, loan payments, and wire transfers processed in that window. FFIEC Business Continuity Management guidance requires banks to validate RPO achievement under realistic production load conditions annually; replication architectures that are not sized to production workload create RPO gaps that are only discovered in disaster scenarios.`,
    keywords: ['FFIEC BCM', 'OCC', 'RPO', 'database replication', 'core banking resilience'],
    demoRelevant: true,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2192',
    name: 'Disaster Recovery Test Environment Uses Outdated Core Banking Software Version',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's disaster recovery environment is updated with software patches on a quarterly basis while the production environment is patched monthly; at the time of the annual DR test, the DR environment is two software patch levels behind production. The DR test succeeds at the DR-environment software version, but the bank cannot confirm that the failover would succeed at the current production patch level without a full retest, leaving an untested gap in the resilience programme. FFIEC Business Continuity Management guidance requires DR environments to maintain parity with production for tests to be meaningful; DR environments running materially older software versions provide false assurance because the test validates a configuration that does not match production.`,
    keywords: ['FFIEC BCM', 'OCC', 'DR environment parity', 'software patching', 'core banking resilience'],
    demoRelevant: false,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2193',
    name: 'BCBS 239 Data Availability During Outages Not Tested for Risk Reporting Continuity',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's business continuity plan addresses operational continuity for customer-facing services and transaction processing but does not include a tested recovery procedure for its BCBS 239-compliant risk data aggregation capabilities during a core banking outage; the bank has not validated that its risk reporting infrastructure can produce credit, market, and liquidity reports during the period when the core banking system is unavailable or operating from the DR environment. An OCC examination focused on risk governance identifies the gap, noting that BCBS 239 Principle 7 requires banks to demonstrate that risk data aggregation is available during stress scenarios including technology outages. BCBS 239 Principle 7 requires banks to ensure risk data aggregation capabilities are available during stress periods; BCM programmes that do not include risk reporting continuity testing are incomplete.`,
    keywords: ['BCBS 239', 'OCC', 'risk data aggregation', 'BCM', 'core banking resilience'],
    demoRelevant: false,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2194',
    name: 'Core Banking Single Point of Failure in Third-Party DNS Provider Not Mitigated',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's core banking platform and all digital channels depend on a single third-party DNS provider for service resolution; the bank has not implemented secondary DNS failover to a different provider, creating a concentration risk where a DNS provider outage would take down all digital banking services simultaneously. When the DNS provider experiences a 4-hour service disruption, First Capital's mobile app, online banking portal, and ATM network are all unavailable concurrently, affecting 340,000 customers during a weekday morning peak. OCC Bulletin 2023-17 on third-party risk and FFIEC IT Handbook guidance on critical infrastructure require banks to eliminate single points of failure in critical service provider dependencies; DNS provider concentration risk is a common but material infrastructure resilience gap.`,
    keywords: ['OCC Bulletin 2023-17', 'FFIEC IT Handbook', 'DNS resilience', 'SPOF', 'core banking resilience'],
    demoRelevant: true,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2195',
    name: 'Core Banking Backup Restoration Procedure Not Tested in Three Years',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital performs nightly backups of its core banking database and receives automated confirmation that backups complete successfully; however, the bank has not performed a full restoration test of the core banking backup in 3 years because the restoration test environment was decommissioned during a cost reduction exercise and a replacement was never provisioned. When a ransomware incident requires emergency recovery from backup, the restoration procedure takes 31 hours versus the 8-hour documented target, and restores to a state 36 hours before the incident rather than the 4-hour target, due to undocumented changes in the backup media rotation schedule. FFIEC Business Continuity Management guidance requires banks to test backup restoration procedures annually; relying on backup completion confirmations without periodic restoration testing is an inadequate resilience control for core banking systems.`,
    keywords: ['FFIEC BCM', 'OCC', 'backup restoration', 'ransomware', 'core banking resilience'],
    demoRelevant: false,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2196',
    name: 'Network Segmentation Failure Allows Core Banking Subnet Broadcast Storm to Propagate',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's network architecture deploys core banking systems on a VLAN that is supposed to be isolated from the branch network, but a misconfigured spanning tree protocol setting allows a broadcast storm originating in a branch network segment to propagate to the core banking VLAN during a network hardware failure event. The broadcast storm saturates the core banking database server network interface for 22 minutes, causing all in-flight transactions to time out and requiring a database reconciliation procedure to recover transaction integrity. FFIEC IT Handbook network security guidance requires banks to implement network segmentation that prevents propagation of faults between different network zones; spanning tree misconfigurations that breach VLAN isolation are a common but preventable network resilience failure in banking infrastructure.`,
    keywords: ['FFIEC IT Handbook', 'network segmentation', 'VLAN', 'broadcast storm', 'core banking resilience'],
    demoRelevant: false,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2197',
    name: 'Core Banking Vendor Support Contract Lacks 24x7 P1 Response SLA',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's core banking software support contract provides for a 4-hour response SLA for critical incidents during business hours but does not include a defined response time for critical incidents outside business hours; when a production outage occurs at 11PM on a Friday night, the bank escalates to the vendor and is told the next available support engineer cannot engage until Monday morning 9AM. The bank's own IT team is unable to resolve a vendor software defect without vendor involvement, resulting in a 34-hour core banking outage through the weekend. OCC Bulletin 2013-29 TPRM guidance requires banks to ensure vendor contracts provide adequate support for the bank's operational needs including off-hours critical incident response; support contracts without 24x7 P1 coverage for core banking systems are an operational resilience contract gap.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'vendor SLA', 'critical incident response', 'core banking resilience'],
    demoRelevant: true,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2198',
    name: 'Incident Runbook Accuracy Degrades After Core Banking Upgrade Without Runbook Update',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital maintains an incident response runbook library for its core banking platform that is updated at the time of major platform upgrades; a minor version upgrade changes the location and command syntax of 14 operational commands used in the runbooks without triggering the runbook review process because it is classified as a minor upgrade. During the next production incident, the on-call engineer follows the outdated runbook commands, executes an incorrect service restart procedure, and causes a secondary failure that extends the total incident duration from an estimated 45 minutes to 3.5 hours. FFIEC IT Handbook operations management guidance requires banks to maintain accurate operational documentation that reflects the current production configuration; change management processes that do not include documentation updates for operational runbooks are an operations reliability risk.`,
    keywords: ['FFIEC IT Handbook', 'incident runbook', 'change management', 'core banking operations', 'operational resilience'],
    demoRelevant: false,
    subTopic: 'core-system-resilience',
  },
  {
    code: 'B2199',
    name: 'Core Banking Capacity Planning Underestimates Black Friday Transaction Surge',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's annual core banking capacity plan projects peak transaction volume based on the prior year's Thanksgiving weekend peak plus a 15% growth factor; the bank's expansion of its buy-now-pay-later product and a co-branded credit card partnership drive a 62% year-over-year transaction volume increase on Black Friday, exceeding the provisioned capacity and causing core banking response times to degrade to 18 seconds for point-of-sale authorisations during the 6-hour peak window. The degradation results in 12,400 declined authorisations for transactions the bank would have approved, creating customer attrition risk and violating First Capital's card network participation performance requirements. FFIEC IT Handbook capacity management guidance requires banks to perform stress-tested capacity planning that incorporates business growth scenarios; capacity planning based on historical trends without incorporating known business development initiatives is systematically inadequate.`,
    keywords: ['FFIEC IT Handbook', 'capacity planning', 'core banking resilience', 'transaction volume', 'OCC'],
    demoRelevant: true,
    subTopic: 'core-system-resilience',
  },

];
