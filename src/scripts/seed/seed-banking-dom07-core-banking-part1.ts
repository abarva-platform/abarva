// seed-banking-dom07-core-banking-part1.ts
// Banking genome patterns — Core Banking Modernisation
// Code range: B1900–B1959  (60 patterns)
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

export const BANKING_CORE_BANKING_PART1_PATTERNS: PatternSeed[] = [

  // ── core-migration ─────────────────────────────────────────────────────────
  {
    code: 'B1900',
    name: 'Big-Bang Core Conversion Initiates Uncontrolled Customer Impact Window',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description:
      `First Capital Bank executes a big-bang core banking replacement over a 72-hour maintenance window, freezing account maintenance and debit processing for the entire retail and commercial deposit book simultaneously. OCC Bulletin 2013-29 on third-party technology service providers requires the bank to maintain documented contingency plans with defined customer impact boundaries and rollback criteria; a conversion approach that cannot be reversed once initiated — and that freezes Reg E-regulated access to funds — violates the operational resilience planning standards the OCC expects under its technology supervision framework. The resulting backlog of 4,200 failed debit transactions generates NSF fee reversals, Reg E dispute filings, and a formal consumer complaint pattern that the CFPB flags within 30 days of cutover.`,
    keywords: ['OCC Bulletin 2013-29', 'core banking migration', 'big-bang conversion', 'Reg E', 'operational resilience'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1901',
    name: 'Phased Migration Scope Creep Inflates Parallel-Run Cost Past Business Case',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital adopts a phased core banking migration strategy to reduce cutover risk, but each wave adds scope for additional product types and legacy interfaces — extending the parallel-run period from 6 months to 22 months before the final wave closes. Running both the legacy mainframe core and the new platform simultaneously requires double-staffing for reconciliation, maintains two sets of vendor SLAs, and delays decommission of the legacy data centre; Gartner research on core banking modernisation projects documents cost overruns averaging 43% in phased programmes where parallel-run scope is not governed by a time-bounded migration charter. The OCC expects banks to demonstrate cost-benefit discipline in technology transformation under its Heightened Standards for large institutions and its technology supervision principles in OCC Bulletin 2013-29.`,
    keywords: ['OCC Bulletin 2013-29', 'parallel run', 'core banking migration', 'phased migration', 'mainframe'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1902',
    name: 'Rollback Criteria Not Defined Before Cutover Execution Decision',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's core banking cutover plan defines go/no-go criteria for initiating the migration weekend but does not specify measurable rollback triggers — such as transaction error rates, reconciliation variance thresholds, or ATM availability percentages — that would require aborting and reverting to the legacy platform. When the cutover encounters a data conversion defect affecting 12% of commercial deposit accounts, the programme team debates rollback for 6 hours before committing to proceed forward because rollback costs and timelines were never pre-approved; OCC Bulletin 2013-29 and the FFIEC IT Examination Handbook's Development and Acquisition booklet require banks to document and obtain senior management sign-off on contingency and rollback procedures before initiating high-risk technology changes.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2013-29', 'core banking migration', 'rollback criteria', 'cutover governance'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1903',
    name: 'Legacy Product Rules Not Fully Mapped Before Migration Leaves Orphan Accounts',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's legacy core banking platform hosts 47 distinct deposit and loan product types, but the migration team documents only 31 product configurations before the cutover wave — classifying the remaining 16 as legacy discontinued products not requiring mapping. Post-migration, 8,400 customer accounts holding active balances on those legacy products are assigned default configurations in the new core that do not match their contractual terms for interest accrual, fee schedules, and statement cycles. The resulting discrepancy triggers Reg E and Reg DD disclosure accuracy violations and requires a remediation programme to correct affected accounts, a cost that was not in the migration business case.`,
    keywords: ['OCC Bulletin 2013-29', 'Reg DD', 'Reg E', 'core banking migration', 'product mapping'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1904',
    name: 'Migration Programme Lacks Independent Programme Assurance With OCC Visibility',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking transformation programme is managed entirely by internal technology and business teams with the systems integrator — without an independent programme assurance function that reports to the board or provides status transparency to the OCC. The OCC's technology supervision framework and OCC Bulletin 2013-29 expect banks undertaking material technology programmes to maintain governance structures that give the board and regulators confidence in programme risk management; the absence of independent assurance means the board receives status updates only through the programme team, limiting its ability to challenge assumptions or escalate emerging risks before they become examination findings.`,
    keywords: ['OCC Bulletin 2013-29', 'programme assurance', 'core banking migration', 'FFIEC IT Handbook', 'board governance'],
    subTopic: 'core-migration',
  },
  {
    code: 'B1905',
    name: 'Technical Debt in Migration Architecture Embeds New Mainframe Dependency',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's core banking migration preserves the legacy mainframe as an intermediary processing layer for commercial loan servicing and wire transfer origination rather than fully decommissioning it, because rebuilding these functions on the new platform exceeds the programme budget. The resulting architecture creates a new integration dependency on the mainframe that the bank's OCC technology risk profile documents as a residual risk to be addressed in a future phase — but no timeline or budget is committed, and the mainframe dependency is simply inherited into the new operating model. This pattern — documented in Gartner's 2024 core banking transformation research — reduces the return on the modernisation investment by extending mainframe operating costs and perpetuating the single-point-of-failure the programme was intended to eliminate.`,
    keywords: ['core banking migration', 'mainframe', 'technical debt', 'FFIEC IT Handbook', 'OCC Bulletin 2013-29'],
    subTopic: 'core-migration',
  },

  // ── data-migration ─────────────────────────────────────────────────────────
  {
    code: 'B1906',
    name: 'GL Reconciliation Failure During Migration Creates Regulatory Reporting Gap',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `During First Capital's core banking cutover, the general ledger balances extracted from the legacy platform and loaded into the new core do not agree to the prior-day close by $2.4M across 14 GL accounts — a variance that the migration team cannot resolve within the cutover window and chooses to carry as an adjustment. SOX 404 internal control over financial reporting requires the bank's external auditors to assess whether IT-dependent controls, including GL completeness and accuracy, function effectively through technology changes; an unresolved GL reconciliation at the point of go-live that is carried as a manual adjustment rather than resolved to a source document constitutes an IT general control deficiency that the auditors must evaluate in the SOX assessment.`,
    keywords: ['SOX 404', 'GL reconciliation', 'core banking migration', 'FFIEC IT Handbook', 'data migration integrity'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B1907',
    name: 'Customer Master Data Deduplication Not Completed Before Core Cutover',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's legacy core banking system contains 28,000 duplicate customer master records created over 15 years of acquisitions and manual data entry — an issue the migration team identifies but defers to post-cutover remediation to maintain schedule. When the duplicate records migrate into the new core, customers with duplicate profiles receive incorrect consolidated balance and transaction visibility in digital banking, and the bank's CDD rule compliance team cannot run accurate KYC refresh reviews against a contaminated customer master. The FFIEC IT Examination Handbook's Development and Acquisition booklet requires banks to validate data quality and completeness before migration acceptance, and FinCEN's CDD rule requires accurate customer identification records — a deferred deduplication programme creates exposure across both frameworks.`,
    keywords: ['FFIEC IT Handbook', 'FinCEN CDD rule', 'customer master data', 'data migration integrity', 'KYC'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B1908',
    name: 'Regulatory Reporting Continuity Breaks at Cutover Due to Schema Differences',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's Call Report data extraction process pulls from the legacy core banking data schema using field names and table structures that do not exist in the new core platform's data model; the migration team does not rebuild the Call Report extraction logic before cutover, expecting to complete it in the first two weeks of the new system's operation. The OCC requires accurate and timely Call Report submission, and a gap between core go-live and the availability of validated regulatory reporting extracts creates a window where the bank either submits estimates or delays the quarterly filing — both of which trigger examination scrutiny. BCBS 239's risk data aggregation principles require banks to maintain accurate and timely data pipelines for regulatory reporting independent of technology migration timelines.`,
    keywords: ['OCC', 'Call Report', 'BCBS 239', 'core banking migration', 'regulatory reporting continuity'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B1909',
    name: 'Historical Transaction Archive Inaccessible After Migration Decommissions Legacy',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital migrates five years of live transaction history to the new core banking platform but decommissions the legacy system before archiving the preceding seven years of transaction history in an accessible format; the bank's record retention policy and OCC examination readiness standards require transaction records to be retrievable for examination and litigation purposes for up to 10 years. When a commercial loan fraud investigation requires access to transaction records from 2018, the data exists only on legacy backup tapes in a format that the bank no longer has licensed software to read — a records access failure that exposes the bank to OCC findings on records retention and increases litigation risk.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'core banking migration', 'records retention', 'data archival'],
    subTopic: 'data-migration',
  },
  {
    code: 'B1910',
    name: 'Interest Accrual Recalculation Errors at Cutover Require Account-Level Remediation',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's core migration recalculates interest accruals on commercial loan accounts as of the cutover date using the new platform's calculation engine, which applies day-count conventions differently from the legacy system for certain loan types. The resulting discrepancy — an average of $23 per affected account — triggers Reg Z accuracy requirements for consumer loan accounts and contractual disclosure obligations for commercial loans; the bank's legal and compliance teams initiate an account-level review covering 6,700 accounts, consuming remediation resources that the migration budget did not anticipate and generating customer communications that attract CFPB attention.`,
    keywords: ['Reg Z', 'FFIEC IT Handbook', 'core banking migration', 'interest accrual', 'data migration integrity'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
  {
    code: 'B1911',
    name: 'Migrated Loan Covenant Data Missing Required Fields for Commercial Portfolio',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's legacy loan origination system stores covenant conditions in free-text fields that cannot be automatically mapped to the structured covenant management module in the new core banking platform; the migration team migrates the free-text fields as notes but does not manually code the 1,400 covenant conditions into the structured module before cutover. Credit officers lose automated covenant monitoring and breach alert functionality for the commercial portfolio immediately after go-live, increasing the risk of missed covenant violations during the 90-day manual remediation period and creating an internal audit finding on commercial credit risk monitoring controls under the bank's FFIEC IT Handbook-aligned IT risk assessment.`,
    keywords: ['FFIEC IT Handbook', 'core banking migration', 'commercial credit risk', 'data migration integrity', 'covenant management'],
    subTopic: 'data-migration',
  },

  // ── api-banking ────────────────────────────────────────────────────────────
  {
    code: 'B1912',
    name: 'Core API Versioning Without Deprecation Policy Breaks Third-Party Integrations',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's new core banking platform exposes a REST API layer that third-party partners — payroll processors, mortgage servicers, and fintech lending partners — rely on for account balance inquiry, debit authorization, and payment initiation. The bank's API governance framework does not include a formal versioning and deprecation policy: when the core vendor releases a schema update that changes field names and removes deprecated parameters, the bank applies the update without notifying partners or maintaining a prior version in parallel. OCC Bulletin 2013-29 requires banks to manage third-party technology relationships including integration interface stability; the unannounced breaking change causes 14 third-party integrations to fail simultaneously, generating transaction failures and a TPRM finding on interface governance.`,
    keywords: ['OCC Bulletin 2013-29', 'API versioning', 'TPRM', 'core banking', 'third-party integration'],
    demoRelevant: true,
    subTopic: 'api-banking',
  },
  {
    code: 'B1913',
    name: 'Third-Party Integration Certification Gap Allows Unvalidated Partners Into Production',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's core banking API onboarding process for new third-party integrators requires a certification test in the sandbox environment, but business development teams approve production API credential issuance to fintech partners before certification testing is complete — treating the sandbox testing as a parallel-track activity rather than a gate. When a payroll-embedded banking partner goes live before its debit authorization logic is certified, it sends malformed ISO 20022 messages that the core platform cannot parse, generating a cascading authorization queue failure that affects debit processing for all connected partners for 40 minutes. The FFIEC IT Examination Handbook's Management booklet and OCC Bulletin 2013-29 require banks to manage third-party access through governed onboarding processes with security and functional testing before production access.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'ISO 20022', 'third-party integration', 'API certification'],
    subTopic: 'api-banking',
  },
  {
    code: 'B1914',
    name: 'BaaS Partner Onboarding Without OCC Non-Objection Creates Supervision Gap',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital expands into Banking-as-a-Service by providing deposit account infrastructure to three fintech partners under program management agreements that allow the fintechs to offer FDIC-insured accounts to their end customers. The bank treats the BaaS programme as a technology and product decision and does not proactively brief the OCC on the new activity or obtain a non-objection under the OCC's process for novel or higher-risk bank activities, as described in the OCC's Comptroller's Handbook on Third-Party Relationships. When the OCC examines First Capital's BaaS activities, it finds that the bank's CDD and BSA/AML oversight for fintech-originated accounts is deficient relative to the customer risk profile, and issues a Matter Requiring Attention on the bank's third-party BSA/AML programme oversight.`,
    keywords: ['OCC', 'BaaS', 'BSA/AML', 'OCC Bulletin 2013-29', 'third-party integration'],
    demoRelevant: true,
    subTopic: 'api-banking',
  },
  {
    code: 'B1915',
    name: 'Open Banking API Security Controls Not Aligned With FFIEC Authentication Guidance',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's core banking API layer uses API key authentication for data aggregation partners without implementing OAuth 2.0 token-scoping or short-lived credential rotation, which the FFIEC's Authentication and Access to Financial Institution Services and Systems guidance recommends for external API access to customer financial data. When a data aggregation partner's environment is compromised and its API key is used to make bulk balance inquiry calls against 40,000 customer accounts, First Capital cannot attribute the access to a specific partner session or revoke access without revoking all partner integrations, extending the incident exposure window and triggering OCC inquiry into the bank's API security controls.`,
    keywords: ['FFIEC IT Handbook', 'OCC', 'API security', 'OAuth 2.0', 'open banking'],
    subTopic: 'api-banking',
  },
  {
    code: 'B1916',
    name: 'Middleware API Layer Between Core and Channels Creates Unmonitored Failure Point',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital deploys a middleware API gateway between its new core banking platform and its digital banking, mobile, and branch teller channels to translate between the core's native API schema and the existing channel integrations. The middleware layer is not subject to the same DR testing and monitoring coverage as the core platform itself: when the middleware encounters a memory leak during peak end-of-month processing, all channel access is unavailable for 3.5 hours while the core remains fully operational. The FFIEC IT Examination Handbook's Business Continuity Management booklet requires banks to include all technology dependencies — including middleware — in their RTO/RPO analysis and DR test scope, a requirement the bank's business continuity programme team had not applied to the new middleware layer.`,
    keywords: ['FFIEC IT Handbook', 'middleware', 'core banking', 'business continuity', 'RTO'],
    subTopic: 'api-banking',
  },

  // ── resilience ─────────────────────────────────────────────────────────────
  {
    code: 'B1917',
    name: 'Core Banking RPO Exceeds Regulatory and Contractual Requirements',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's new core banking platform is configured with a 4-hour recovery point objective for its primary data centre, meaning that a primary site failure could result in up to 4 hours of transaction data loss before recovery from the secondary site begins. The OCC's bank supervision principles for business continuity and the FFIEC's Business Continuity Management booklet expect banks to establish RPO targets for critical systems — including core banking — that are consistent with regulatory obligations such as Reg E's prohibition on retaining NSF fees for unavailable funds and commercial customer SLAs in treasury management agreements that typically specify 15-minute RPO for payment processing. A 4-hour RPO exposes First Capital to regulatory liability and contractual breach across its most critical banking relationships.`,
    keywords: ['FFIEC IT Handbook', 'RPO', 'business continuity', 'core banking', 'Reg E'],
    demoRelevant: true,
    subTopic: 'resilience',
  },
  {
    code: 'B1918',
    name: 'DR Test Excludes Full Transaction Replay — Recovery Assurance Is Incomplete',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's annual disaster recovery test for its core banking platform validates the recovery of system configuration and account balance data but does not test full transaction replay from the point of failure — the re-processing of in-flight payment transactions, ACH originations, and debit authorizations that were in queue when the simulated failure occurs. The FFIEC Business Continuity Management booklet and ISO 22301 business continuity management standards require organizations to test recovery procedures to the level of completeness that the business actually requires; a DR test that validates balance recovery but not transaction replay gives the bank false assurance that its core banking recovery meets the full operational resumption standard that Reg E and NACHA rules demand.`,
    keywords: ['ISO 22301', 'FFIEC IT Handbook', 'DR testing', 'transaction replay', 'business continuity'],
    demoRelevant: true,
    subTopic: 'resilience',
  },
  {
    code: 'B1919',
    name: 'Single Mainframe Middleware Bottleneck Propagates Core Outage to All Channels',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's core banking architecture routes all real-time transaction authorization traffic — debit card, wire transfer, and ACH — through a single mainframe message broker that translates between the new core platform and the payment network gateways. The mainframe middleware is a single point of failure with no hot standby: when the broker experiences a software fault during a scheduled maintenance window that extends unexpectedly, all payment authorization is suspended for 2 hours, affecting 380,000 customer debit transactions and triggering Reg E dispute rights for unavailable funds. The OCC's operational resilience expectations and the FFIEC IT Handbook's Business Continuity Management booklet require banks to eliminate or provide redundancy for single points of failure in critical payment processing infrastructure.`,
    keywords: ['FFIEC IT Handbook', 'single point of failure', 'mainframe', 'core banking', 'Reg E'],
    demoRelevant: true,
    subTopic: 'resilience',
  },
  {
    code: 'B1920',
    name: 'Core Banking Failover to Secondary Site Not Tested Under Production Transaction Load',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's core banking DR plan specifies a 2-hour RTO for failover to the secondary data centre, validated by annual DR tests that simulate failover under 20% of production transaction volume. When an actual primary site failure occurs during the last business day of the month — peak transaction volume — the secondary site's database replication lag and processing queue depth extends the actual recovery to 5.5 hours, far exceeding the 2-hour RTO and generating Reg E and commercial customer SLA breaches. ISO 22301 and the FFIEC Business Continuity Management booklet both require that recovery time objectives be validated under realistic operational conditions, not reduced test loads.`,
    keywords: ['ISO 22301', 'FFIEC IT Handbook', 'RTO', 'DR testing', 'core banking failover'],
    subTopic: 'resilience',
  },
  {
    code: 'B1921',
    name: 'Cyber Incident Response Plan Not Updated for New Core Banking Attack Surface',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's incident response plan was written for the legacy core banking architecture and has not been updated to address the new attack surface introduced by the cloud-hosted core platform, its API gateway, and its third-party integration ecosystem. When a ransomware attack targets the API gateway, the incident response team follows the legacy playbook — which isolates the mainframe but does not include procedures for API credential revocation, cloud resource isolation, or fintech partner notification — extending the containment phase by 4 hours. The FFIEC Cybersecurity Assessment Tool and OCC Bulletin 2023-17 on third-party relationships require banks to maintain incident response plans that reflect the current operating architecture, including cloud and third-party integration dependencies.`,
    keywords: ['FFIEC IT Handbook', 'OCC', 'incident response', 'core banking', 'cyber resilience'],
    subTopic: 'resilience',
  },
  {
    code: 'B1922',
    name: 'Core Banking Capacity Planning Does Not Account for Digital Channel Growth',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's capacity plan for the new core banking platform is based on historical transaction volumes from the legacy system, which was primarily used by branch and telephone banking channels. As digital banking adoption accelerates — driven by the bank's mobile app relaunch — transaction volumes during peak periods exceed core platform capacity thresholds, causing processing queue buildup that delays debit authorizations by 45–90 seconds and generates false declines at point-of-sale. The FFIEC IT Examination Handbook's Development and Acquisition booklet requires banks to perform capacity and performance testing that reflects anticipated growth in transaction volumes; basing capacity on legacy rather than projected digital volumes is a planning deficiency that the OCC examines as part of the bank's technology risk management programme.`,
    keywords: ['FFIEC IT Handbook', 'capacity planning', 'core banking', 'digital banking', 'OCC'],
    subTopic: 'resilience',
  },

  // ── vendor-risk ────────────────────────────────────────────────────────────
  {
    code: 'B1923',
    name: 'Core Banking Vendor Concentration Creates Supervisory Concern Under OCC 2023-17',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital selects a single core banking platform vendor for its transformation programme and migrates 100% of its retail and commercial banking workloads to that vendor's cloud-hosted platform, creating a vendor concentration where a single third party controls all core banking processing, data storage, and regulatory reporting extraction. OCC Bulletin 2023-17 on third-party relationships requires banks to assess concentration risk where critical activities are dependent on a single provider and to maintain contingency plans for third-party disruption; with no viable backup processing arrangement and no data portability mechanism that would allow the bank to migrate to an alternative provider within a reasonable timeframe, First Capital cannot satisfy OCC examiners that its third-party concentration risk management meets supervisory expectations.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC 2023-17', 'vendor concentration risk', 'TPRM', 'core banking'],
    demoRelevant: true,
    subTopic: 'vendor-risk',
  },
  {
    code: 'B1924',
    name: 'Core Banking Vendor SLA Enforcement Gaps Allow Performance Degradation',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's core banking vendor contract specifies a 99.95% availability SLA for the core processing environment, but the SLA measurement methodology excludes planned maintenance windows, partial degradation events where some but not all transaction types are affected, and incidents lasting fewer than 5 minutes. The effective availability experienced by First Capital's customers — including three 2-hour partial outages and 11 sub-5-minute interruptions — is materially lower than the contractual SLA, but the bank's TPRM programme does not track incidents against a customer-impact definition and therefore cannot enforce the SLA or trigger contractual remedies. OCC Bulletin 2013-29 requires banks to maintain effective oversight of third-party performance, including SLA monitoring using metrics aligned to the bank's actual risk exposure.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'SLA enforcement', 'core banking', 'vendor management'],
    demoRelevant: true,
    subTopic: 'vendor-risk',
  },
  {
    code: 'B1925',
    name: 'Contract Exit Strategy Absent — No Data Portability Clause With Core Vendor',
    officeCategory: 'back_office',
    failureRatePct: 80,
    description:
      `First Capital's core banking vendor contract does not include a data portability clause specifying the format, timeline, and cost for exporting the full customer and transaction dataset in a standard format upon contract termination. When First Capital's board initiates a competitive RFP for a core banking platform replacement 5 years into the contract, the bank discovers it cannot obtain a complete data export in any format other than the vendor's proprietary schema — which no other vendor's migration tooling supports — effectively locking the bank into the incumbent vendor. OCC Bulletin 2023-17 and OCC 2013-29 guidance on third-party relationships require banks to include exit strategy provisions and data portability rights in contracts for critical third-party services; the absence of a portability clause is a supervisory finding and a material constraint on the bank's strategic flexibility.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC 2023-17', 'vendor exit strategy', 'data portability', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-risk',
  },
  {
    code: 'B1926',
    name: 'Subcontractor Dependency in Core Banking Vendor Chain Not Disclosed',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital contracts with a core banking platform vendor whose cloud infrastructure relies on two subcontractors — a cloud infrastructure provider and a database management service — neither of which are disclosed in the vendor's due diligence questionnaire responses provided to the bank. When the cloud infrastructure subcontractor experiences a regional outage, First Capital's core banking platform is unavailable for 90 minutes, and the bank discovers for the first time that its core processing is four levels removed from its own control. OCC Bulletin 2013-29 and OCC 2023-17 require banks to conduct due diligence on material subcontractors used by critical third-party providers, and to obtain disclosure of the third-party's own dependency chain — a gap in First Capital's TPRM programme that the OCC flags at examination.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC 2023-17', 'TPRM', 'subcontractor', 'fourth-party risk'],
    subTopic: 'vendor-risk',
  },
  {
    code: 'B1927',
    name: 'Core Banking Vendor Financial Instability Not Monitored as Concentration Risk',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's TPRM programme conducts initial financial due diligence on its core banking vendor at contract inception but does not schedule recurring financial health assessments — despite the vendor's products and services being classified as critical under OCC Bulletin 2013-29. When the core banking vendor announces financial restructuring and a strategic review 3 years into the contract, First Capital has no contingency plan for vendor insolvency or distress, no escrow arrangement for source code and data, and no alternative provider that has been pre-qualified for an accelerated transition. OCC supervisory guidance expects banks to monitor the financial condition of critical third parties on an ongoing basis and to maintain contingency plans for vendor disruption or failure.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'vendor financial risk', 'core banking', 'concentration risk'],
    subTopic: 'vendor-risk',
  },
  {
    code: 'B1928',
    name: 'Core Vendor Change Management Does Not Require Bank Approval for Material Updates',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's core banking vendor contract grants the vendor the right to apply platform updates, patches, and configuration changes to the bank's production environment without prior notification or bank approval for changes classified as non-emergency. When the vendor applies a regulatory reporting schema update that alters the HMDA data extraction field mappings, First Capital's automated HMDA submission file generates incorrect census tract and borrower income data for 90 days before the discrepancy is discovered in an internal audit. OCC Bulletin 2013-29 requires banks to include change management notification and approval rights in vendor contracts for critical systems to ensure the bank can assess the impact of changes on regulatory compliance and operational risk before they are applied.`,
    keywords: ['OCC Bulletin 2013-29', 'HMDA', 'vendor change management', 'TPRM', 'core banking'],
    subTopic: 'vendor-risk',
  },

  // ── ai-modernisation ───────────────────────────────────────────────────────
  {
    code: 'B1929',
    name: 'Migration Mapping AI Produces Field Transformations Without Reconciliation Validation',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's systems integrator uses an AI-assisted data migration mapping tool to automatically generate field-level transformation rules between the legacy core's 2,400 data fields and the new platform's schema — reducing mapping time from an estimated 18 months to 6 weeks. The AI tool generates transformation rules without producing a reconciliation validation layer: there is no automated check confirming that the count, sum, and statistical distribution of key fields (account balances, interest rates, maturity dates) match between source and target after transformation is applied. When 3% of commercial loan maturity dates are transformed incorrectly due to a date-format ambiguity in the AI mapping rules, the error propagates into the new core and triggers incorrect loan renewal notices for 340 commercial clients — a data integrity failure that OCC Bulletin 2013-29 and the FFIEC IT Handbook's Development and Acquisition booklet require banks to prevent through data validation testing before migration acceptance.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'AI data migration mapping', 'reconciliation validation', 'data integrity'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1930',
    name: 'LLM Requirements Gathering Produces Scope Without Business Analyst Sign-Off',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's core banking transformation programme uses a large language model tool to accelerate requirements gathering by synthesizing interview notes and legacy system documentation into draft functional requirements — compressing a 6-month business analysis phase to 8 weeks. The LLM-generated requirements are reviewed by the vendor's technical architects but are not formally signed off by First Capital's business analyst team or product owners, who would identify gaps in the requirements for commercial treasury management and escrow product configurations. When the new platform goes live missing 14 required commercial product configurations because the LLM failed to extract them from legacy documentation, the bank's commercial banking team cannot service 200 existing commercial clients without manual workarounds — a scope deficiency that the FFIEC IT Handbook's Development and Acquisition booklet attributes to inadequate requirements validation.`,
    keywords: ['FFIEC IT Handbook', 'LLM requirements gathering', 'core banking', 'business analysis', 'requirements validation'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1931',
    name: 'GenAI Test Case Generation Without Regression Governance Creates Undetected Defects',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's systems integrator uses a GenAI tool to generate test cases for the core banking acceptance testing phase, producing 14,000 test scenarios in 3 weeks rather than the estimated 9 months for manual test case writing. The GenAI-generated test cases do not include negative-path tests for Reg E dispute workflow edge cases — such as NSF transactions on accounts with provisional credits — because the tool was prompted against functional requirements documentation that omitted these scenarios. The missing Reg E edge case tests allow a defect in the dispute management workflow to pass acceptance testing and reach production, where it generates incorrect provisional credit reversals for 1,200 customers and triggers CFPB complaint volume that the bank's compliance team cannot explain to examiners without tracing the defect back to the test coverage gap.`,
    keywords: ['FFIEC IT Handbook', 'GenAI test generation', 'regression governance', 'Reg E', 'core banking testing'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1932',
    name: 'Automated Cutover Decision AI Tool Removes Human Approval Gate at Go-Live',
    officeCategory: 'back_office',
    failureRatePct: 82,
    description:
      `First Capital's systems integrator proposes using an AI-driven cutover orchestration tool that automatically evaluates go/no-go criteria — data validation metrics, system health checks, and reconciliation variances — and initiates the final cutover sequence without requiring explicit human approval once thresholds are met. The bank's programme governance team accepts the automated approach to compress the cutover window and reduce weekend staffing; when the AI tool misclassifies a GL reconciliation variance as within acceptable tolerance due to a misconfigured threshold, the cutover proceeds automatically at 2:47 AM while the human programme managers are asleep — initiating a migration wave that cannot be reversed once started. OCC Bulletin 2013-29 and the FFIEC IT Handbook's Development and Acquisition booklet require that major technology changes include explicit human sign-off at critical decision gates, and a fully automated cutover decision with no human approval step is a governance deficiency that the OCC examines as part of technology change management oversight.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'AI cutover automation', 'human approval gate', 'change governance'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1933',
    name: 'AI-Assisted Data Quality Scoring Suppresses Migration Exceptions Below Remediation Threshold',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's data migration quality platform uses an AI model to score data quality exceptions — assigning each exception a severity score that determines whether it is escalated for manual remediation before cutover. The AI scoring model is trained on a reference dataset from the vendor's prior implementation, not on First Capital's specific data characteristics; it systematically underscores exceptions related to the bank's commercial loan fee structures because those patterns were absent from the training data. The result is that 890 commercial loan accounts with fee configuration exceptions are scored as acceptable by the AI and migrate to production without remediation, generating incorrect fee income accruals in the new core that the bank's finance team must manually correct across three post-cutover quarter-end closes.`,
    keywords: ['FFIEC IT Handbook', 'AI data quality scoring', 'data migration integrity', 'core banking', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1934',
    name: 'AI Code Generation for Core Integration Bypasses Security Code Review',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's integration development team uses a GenAI code assistant to accelerate development of the API connectors between the new core banking platform and the digital banking channels, generating 40,000 lines of integration code in 6 weeks. The AI-generated code is reviewed for functional correctness through unit testing but is not subjected to the bank's standard security code review process — which screens for hardcoded credentials, SQL injection vulnerabilities, and insecure serialization patterns — because the team treats AI-generated code as vendor-supplied rather than internally developed. The FFIEC IT Examination Handbook's Development and Acquisition booklet requires banks to apply security controls to all code entering production, regardless of its origin; a post-go-live security penetration test finds three medium-severity vulnerabilities in the AI-generated integration code that bypass the bank's standard API authentication controls.`,
    keywords: ['FFIEC IT Handbook', 'GenAI code generation', 'security code review', 'core banking integration', 'API security'],
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1935',
    name: 'AI Migration Mapping Tool Produces Undocumented Transformation Logic',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's AI-assisted migration mapping tool generates executable transformation scripts from source-to-target field mapping specifications, but does not produce human-readable documentation of the transformation logic that auditors and regulators can review. When the OCC requests documentation supporting the data migration approach as part of a technology examination — specifically, evidence that the transformation logic was reviewed for regulatory field accuracy (HMDA, CRA, BSA/AML data elements) — First Capital cannot produce readable documentation because the AI tool stores transformation logic as compiled code that is not interpretable without the vendor's proprietary tooling. SOX 404 IT general control requirements and OCC examination practices require that material technology changes be supported by documentation sufficient for independent review; undocumented AI-generated transformation logic fails this standard.`,
    keywords: ['SOX 404', 'OCC Bulletin 2013-29', 'AI migration mapping', 'transformation documentation', 'HMDA'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1936',
    name: 'LLM Test Script Synthesis Skips Regulatory Edge Cases for Deposit Products',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's testing team uses an LLM to synthesize test scripts for the new core banking platform's deposit product configurations, feeding the tool the product catalogue documentation and the new platform's configuration guide. The LLM generates comprehensive positive-path tests for standard checking and savings products but generates no test cases for Regulation CC funds availability holds, overdraft opt-in/opt-out logic under Reg E, or Truth in Savings disclosure accuracy under Reg DD — regulatory product behaviors that are documented in separate regulatory guidance documents not included in the LLM's context window. The missing regulatory test coverage allows configuration defects in Reg CC hold logic to reach production, affecting 6,000 consumer accounts and generating a CFPB examination inquiry into the bank's funds availability practices.`,
    keywords: ['FFIEC IT Handbook', 'LLM test synthesis', 'Reg CC', 'Reg DD', 'core banking testing'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1937',
    name: 'AI-Driven Migration Progress Reporting Masks Velocity Risks From Steering Committee',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking programme office uses an AI project reporting tool that aggregates milestone completion data, resource burn rates, and testing defect trends into an automated programme dashboard for the steering committee. The AI reporting tool is configured to present RAG status based on percentage-complete metrics rather than risk-adjusted completion forecasts; because the percentage-complete methodology does not weight the remediation of open defects by severity, the dashboard shows 87% programme completion while the test defect log contains 34 open critical defects that the programme team has not yet resolved. The steering committee does not see the critical defect backlog until a manual programme assurance review presents it outside the AI dashboard, by which time the originally planned cutover date is two months away with insufficient time to remediate.`,
    keywords: ['FFIEC IT Handbook', 'AI programme reporting', 'core banking migration', 'steering committee governance', 'OCC Bulletin 2013-29'],
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1938',
    name: 'GenAI Architecture Design Tool Recommends Cloud Config Inconsistent With OCC Guidance',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's enterprise architecture team uses a GenAI architecture design assistant to generate reference architecture options for the new core banking platform's cloud deployment, evaluating trade-offs between single-region and multi-region configurations. The GenAI tool recommends a single-region active-active configuration based on cost and latency optimization criteria, without incorporating OCC Bulletin 2023-17's guidance on geographic concentration risk for critical banking systems or the FFIEC's BCM requirements for critical system resilience. The board approves the single-region design based on the AI-generated recommendation; the OCC subsequently issues a supervisory finding that the bank's core banking infrastructure design does not meet the geographic resilience standard expected for a bank of First Capital's size and systemic importance to its regional market.`,
    keywords: ['OCC 2023-17', 'FFIEC IT Handbook', 'GenAI architecture design', 'cloud resilience', 'geographic concentration'],
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1939',
    name: 'AI-Assisted Vendor Evaluation Omits Regulatory Compliance Capability Assessment',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital uses an AI-assisted procurement platform to evaluate competing core banking vendors, scoring proposals across 120 capability dimensions generated from the bank's RFP requirements. The AI scoring tool weights dimensions by the frequency of their mention in the bank's RFP document; because the bank's RFP emphasizes technology architecture, integration capabilities, and implementation timeline — with regulatory compliance capability listed as a single requirement — the AI scoring model assigns regulatory compliance a low weight relative to vendor-selected functional areas. The vendor selected through the AI-scored evaluation scores highest on technology architecture but cannot demonstrate OCC examination readiness features — regulatory report extraction, HMDA data field mapping, CRA lending data tracking — until late in the implementation, delaying go-live by 7 months.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'AI vendor evaluation', 'core banking', 'regulatory compliance capability'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },

  // ── Additional core-migration patterns ────────────────────────────────────
  {
    code: 'B1940',
    name: 'Core Conversion Data Freeze Triggers Reg E Complaints at Scale',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital executes its core banking conversion over a 72-hour maintenance window during which customer account changes, electronic fund transfers, and debit authorizations are suspended — a condition documented in the bank's §6.2 mandatory failure archetype for core banking modernisation. The communication plan reaches 34% of affected customers through email and in-app notification, but 15–20% of consumer customers attempt transactions during the freeze period — generating NSF fees on accounts with available balances and triggering Reg E Section 1005.17 dispute rights for all affected customers. The CFPB receives 4,200 complaints within the first 30 days following conversion; the OCC's consumer compliance examination cites the NSF fee generation during a bank-imposed maintenance window as an unfair practice requiring remediation, consistent with OCC Bulletin 2013-29's requirement that banks plan for customer impact during technology transitions.`,
    keywords: ['OCC Bulletin 2013-29', 'Reg E', 'core banking conversion', 'data freeze', 'CFPB'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1941',
    name: 'Post-Migration Reconciliation Programme Understaffed Delays SOX Control Attestation',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's migration programme allocates reconciliation resources for the 90-day post-cutover stabilization period but underestimates the volume of reconciliation breaks — receiving 12,000 automated break alerts in the first 30 days versus the 1,200 anticipated. The understaffed reconciliation team cannot clear breaks within the SOX 404 control attestation timeline, causing First Capital's external auditors to identify material reconciliation aged items as a potential IT general control deficiency that requires remediation before the year-end financial statement sign-off. SOX 404 requires that IT general controls — including data completeness and accuracy controls over financial reporting systems — operate effectively throughout the year; a migration that generates unresolved reconciliation breaks within the SOX testing window puts the bank's clean audit opinion at risk.`,
    keywords: ['SOX 404', 'post-migration reconciliation', 'core banking', 'FFIEC IT Handbook', 'IT general controls'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1942',
    name: 'Legacy System Documentation Inadequate — Migration Team Cannot Reverse-Engineer Rules',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's legacy core banking system — implemented 22 years ago — has no current technical documentation; the original implementation team has retired and the system's business logic is encoded in COBOL programs that were last modified in 2009 without documentation updates. The migration team must reverse-engineer 380 business rules from the production codebase to document them for migration into the new platform, consuming 14 months of analyst time — doubling the pre-migration documentation phase. The FFIEC IT Handbook's Development and Acquisition booklet requires banks to maintain current documentation for critical systems sufficient to support technology transitions; the absence of legacy documentation is a systemic governance gap that inflates migration cost and risk.`,
    keywords: ['FFIEC IT Handbook', 'legacy documentation', 'COBOL', 'core banking migration', 'OCC Bulletin 2013-29'],
    subTopic: 'core-migration',
  },
  {
    code: 'B1943',
    name: 'Integration Testing Scope Excludes Real-Time Payment Rails at Migration',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's core banking migration testing programme includes end-to-end testing for ACH origination, domestic wire transfer, and debit card processing, but excludes the bank's FedNow instant payment integration — treating it as out of scope because the FedNow integration was deployed only 8 months before the core migration and is considered stable. Post-migration, the FedNow gateway cannot authenticate to the new core platform because the OAuth 2.0 token endpoint has changed, causing FedNow instant payment origination to fail for 72 hours. The FFIEC IT Handbook's Development and Acquisition booklet requires banks to conduct regression testing across all production integrations when migrating core systems; excluding newly deployed payment rails from migration testing is a scope deficiency that the OCC examines as part of change management review.`,
    keywords: ['FFIEC IT Handbook', 'FedNow', 'core banking migration', 'integration testing', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },

  // ── Additional data-migration patterns ────────────────────────────────────
  {
    code: 'B1944',
    name: 'Escheatment Reporting Data Lost in Migration Delays State Compliance Filing',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's core banking migration does not include a dedicated data migration path for escheatment tracking fields — dormancy status, last customer contact date, and unclaimed property review flags — leaving these fields unmapped and defaulting to null in the new core for 22,000 deposit accounts. The bank discovers the gap when its annual unclaimed property compliance filing process cannot produce complete dormancy histories for the affected accounts; the state unclaimed property administrator receives an incomplete filing and initiates an examination inquiry. State escheatment laws require banks to maintain complete and accurate records of account dormancy history; the data migration gap creates both a regulatory compliance failure and a potential reputational risk.`,
    keywords: ['FFIEC IT Handbook', 'escheatment', 'data migration integrity', 'core banking', 'unclaimed property'],
    subTopic: 'data-migration',
  },
  {
    code: 'B1945',
    name: 'CRA Lending Data Migration Breaks Geocoding Link for Exam Preparation',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's migration of loan origination data to the new core banking platform does not preserve the census tract geocoding fields used to classify CRA-reportable loans by assessment area. The migration extracts loan origination addresses but does not carry forward the resolved census tract codes, requiring the bank to re-geocode 18 months of loan origination records before its next CRA examination. When the bank's community reinvestment officer attempts to run the CRA self-assessment against the new core data, 23% of loans cannot be attributed to an assessment area — creating a gap in the bank's CRA lending distribution analysis that the OCC examines as evidence of inadequate CRA data management.`,
    keywords: ['CRA', 'FFIEC IT Handbook', 'geocoding', 'data migration integrity', 'core banking'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },

  // ── Additional api-banking and resilience patterns ─────────────────────────
  {
    code: 'B1946',
    name: 'Core Banking API Rate Limiting Not Configured — DDoS Exposure at Launch',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's new core banking API gateway goes live without API rate limiting configured for the public-facing account inquiry and payment initiation endpoints, because the programme team defers rate limiting as a post-go-live optimization. Within 72 hours of launch, a credential-stuffing attack sends 2.4 million authentication requests per hour to the account inquiry endpoint, saturating the API gateway and causing denial-of-service conditions for legitimate digital banking users. The FFIEC Cybersecurity Assessment Tool and FFIEC IT Handbook's Information Security booklet require banks to implement controls against known attack vectors — including rate limiting for public API endpoints — before production deployment; omitting rate limiting is not a post-launch optimization, it is a go-live prerequisite.`,
    keywords: ['FFIEC IT Handbook', 'API security', 'rate limiting', 'core banking', 'DDoS'],
    subTopic: 'api-banking',
  },
  {
    code: 'B1947',
    name: 'Business Continuity Plan Not Updated to Reflect New Core Platform Dependencies',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's enterprise business continuity plan references the legacy core banking system architecture — including mainframe recovery procedures, legacy middleware failover sequences, and legacy data centre recovery timelines — and is not updated to reflect the new cloud-hosted core banking platform's recovery architecture until 14 months after go-live. When the bank conducts its annual BCP tabletop exercise 9 months post-migration, the recovery team follows legacy procedures that do not apply to the new architecture, and the exercise cannot validate the actual RTO/RPO capabilities of the live environment. ISO 22301 requires organizations to maintain current business continuity plans that reflect the actual operating environment; a BCP that references a decommissioned architecture provides no assurance of recovery capability and fails the FFIEC BCM examination standard.`,
    keywords: ['ISO 22301', 'FFIEC IT Handbook', 'business continuity', 'core banking', 'RTO'],
    subTopic: 'resilience',
  },

  // ── Additional vendor-risk patterns ───────────────────────────────────────
  {
    code: 'B1948',
    name: 'Core Vendor Audit Rights Not Exercised — Compliance Assurance Gaps at Examination',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's core banking vendor contract includes audit rights that allow the bank to conduct or commission an independent review of the vendor's security, operational, and compliance controls, but the bank's TPRM programme has never exercised these rights in 4 years of the relationship — relying instead on the vendor's SOC 2 Type II report, which covers general cloud security controls but does not address banking-specific regulatory compliance. When the OCC examines First Capital's TPRM programme, examiners note that the bank has not assessed whether the vendor's environment satisfies OCC Bulletin 2013-29's requirements for critical third-party service providers and that the SOC 2 report scope is insufficient for a provider hosting core banking operations. OCC Bulletin 2013-29 explicitly calls out the bank's responsibility to exercise audit and examination rights for critical third-party providers.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'vendor audit rights', 'SOC 2', 'core banking'],
    demoRelevant: true,
    subTopic: 'vendor-risk',
  },
  {
    code: 'B1949',
    name: 'Core Platform Vendor Roadmap Dependency Creates Regulatory Feature Gap',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's new core banking platform vendor has committed to delivering ISO 20022-native payment message support and CFPB 1033 consumer data access API compliance in roadmap releases scheduled 18–24 months after First Capital's go-live date. The bank's core banking transformation business case assumed these regulatory capabilities would be available at go-live; instead, First Capital must build custom middleware to bridge ISO 20022 requirements for FedNow and SWIFT connectivity, and cannot offer CFPB 1033-compliant data access to customers until the vendor roadmap feature ships. OCC Bulletin 2013-29 requires banks to assess whether contracted third-party services will meet the bank's regulatory requirements on the required timeline, not on the vendor's preferred roadmap schedule.`,
    keywords: ['OCC Bulletin 2013-29', 'CFPB 1033', 'ISO 20022', 'vendor roadmap', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-risk',
  },

  // ── Additional ai-modernisation patterns ──────────────────────────────────
  {
    code: 'B1950',
    name: 'AI Parallel-Run Comparison Tool Masks Systematic Calculation Differences',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital uses an AI comparison tool to analyze parallel-run output differences between the legacy core and the new platform, feeding both systems' transaction outputs into the tool to identify discrepancies beyond a configurable tolerance band. The AI comparison tool's tolerance configuration is set to suppress differences below $5 per account per day as rounding variations — a calibration that suppresses systematic daily interest calculation differences for a portfolio of 12,000 money market accounts where the new core applies a different day-count convention than the legacy system. Over a 90-day parallel run, the suppressed systematic difference accumulates to $1.8M in unrecognized interest liability that is not identified until a manual reconciliation sample review conducted outside the AI comparison tool catches the pattern.`,
    keywords: ['FFIEC IT Handbook', 'AI comparison tool', 'parallel run', 'core banking', 'SOX 404'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1951',
    name: 'GenAI User Acceptance Training Materials Omit Regulatory Compliance Scenarios',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's programme team uses a GenAI content creation tool to produce user acceptance testing scripts and end-user training materials for the new core banking platform — reducing training content development time from 4 months to 6 weeks. The GenAI tool generates training scenarios based on the vendor's default platform documentation rather than First Capital's regulatory context; as a result, the training materials for deposit operations staff do not include Reg CC funds availability hold scenarios, Reg E dispute resolution workflows, or BSA/AML alert escalation procedures. Staff go-live readiness assessments show 94% task completion on the GenAI-generated scenarios but the missing regulatory scenarios create a competency gap that produces compliance errors in the first 60 days of post-migration operations.`,
    keywords: ['FFIEC IT Handbook', 'GenAI training content', 'Reg CC', 'BSA/AML', 'core banking'],
    subTopic: 'ai-modernisation',
  },
  {
    code: 'B1952',
    name: 'AI Risk Assessment Tool Misclassifies Core Migration Risk as Moderate',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's enterprise risk management team uses an AI-assisted risk assessment platform to evaluate the bank's core banking transformation programme, scoring risk dimensions including operational risk, customer impact, and regulatory compliance. The AI risk tool classifies the programme as "moderate risk" based on the programme team's status inputs — which report green across all milestones — without independently assessing the completeness of the parallel-run reconciliation, the resolution status of critical test defects, or the adequacy of the rollback plan. The OCC's supervisory perspective on technology risk management expects bank boards and senior management to challenge programme risk assessments using independent evidence; an AI risk tool that aggregates self-reported programme status without independent validation provides false comfort rather than genuine risk oversight.`,
    keywords: ['OCC Bulletin 2013-29', 'AI risk assessment', 'core banking migration', 'FFIEC IT Handbook', 'programme governance'],
    demoRelevant: true,
    subTopic: 'ai-modernisation',
  },

  // ── Cross-cutting core banking modernisation patterns ─────────────────────
  {
    code: 'B1953',
    name: 'Change Management Programme Does Not Address Commercial Banker Digital Workflow Shift',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's core banking transformation change management programme focuses on retail branch staff and operations team training, underinvesting in commercial banking relationship managers who must adapt their loan administration, covenant monitoring, and treasury management workflows to the new platform. In the 90 days post-cutover, commercial banking productivity metrics decline 35% — commercial bankers cannot locate historical loan documents, cannot run covenant compliance reports from the new system, and route all complex transactions through the operations center rather than self-serving. The FFIEC IT Handbook's Management booklet requires that technology change programmes include comprehensive user adoption planning; a change management scope that omits the commercial banking segment creates customer experience failures and revenue attrition risk that the programme's business case did not anticipate.`,
    keywords: ['FFIEC IT Handbook', 'change management', 'commercial banking', 'core banking', 'user adoption'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1954',
    name: 'Decommission Timeline Compressed Beyond Legacy Data Retention Requirements',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's programme budget model assumes the legacy core banking system will be decommissioned within 6 months of cutover to eliminate dual-running costs — a timeline that does not allow for the completion of the 24-month BSA/AML record retention look-back period on legacy transaction data and the 7-year record retention requirement under IRS regulations for loan origination documentation. When the programme team begins legacy decommissioning on schedule, the bank's compliance and legal teams discover that 14 categories of records required for OCC examination, BSA/AML historical analysis, and loan dispute resolution exist only in legacy format and cannot be migrated on the available timeline — forcing a 12-month decommission delay that consumes the entire projected programme cost savings.`,
    keywords: ['BSA/AML', 'OCC Bulletin 2013-29', 'records retention', 'core banking decommission', 'FFIEC IT Handbook'],
    subTopic: 'data-migration',
  },
  {
    code: 'B1955',
    name: 'Branch Teller System Integration Failure Causes Day-One Customer Service Breakdown',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's core banking migration validates the new platform's REST API connectivity to the branch teller system in a test environment, but the teller system's production instance uses a different API authentication profile than the test environment — a configuration difference discovered when branch tellers attempt to open the bank on day one post-migration and cannot authenticate to the core. For 4.5 hours, all branch-based transactions — account openings, teller deposits, cash advances — are unavailable while the integration team resolves the authentication mismatch. OCC Bulletin 2013-29 and the FFIEC IT Handbook's Development and Acquisition booklet require banks to conduct production-environment integration tests that replicate the actual production authentication and network configuration, not just test-environment equivalents.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'branch teller integration', 'core banking migration', 'production testing'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1956',
    name: 'Treasury Management System Connectivity Breaks Wire Cut-Off Times Post-Migration',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's new core banking platform processes Fedwire origination through a new middleware integration that has 15-minute higher processing latency than the legacy core — a latency difference not identified during integration testing because test-environment processing volumes are too low to exhibit the queue congestion that occurs under production commercial wire volumes. Post-migration, First Capital's commercial treasury clients miss the bank's 5:00 PM Fedwire cut-off time on the first day of operation, causing same-day wire failures for 34 commercial clients with time-sensitive payment obligations. Commercial banking treasury management agreements specify wire cut-off time guarantees; the bank must issue contractual waivers and compensate clients for late-payment penalties, creating unanticipated liability that the FFIEC IT Handbook's Development and Acquisition booklet attributes to inadequate performance testing under production-representative load.`,
    keywords: ['FFIEC IT Handbook', 'Fedwire', 'wire cut-off', 'core banking migration', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'resilience',
  },
  {
    code: 'B1957',
    name: 'Mainframe COBOL Batch Jobs Not Replicated Fully in New Core — Month-End Close Fails',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's legacy core banking system includes 840 COBOL batch jobs that run the month-end close process — interest posting, statement generation, fee billing, and GL extract creation. The migration programme documents and replicates 790 of these batch jobs in the new core's job scheduling framework, classifying the remaining 50 as low-frequency and deferring their migration to a post-go-live batch enhancement phase. When the first month-end close runs on the new platform, the missing batch jobs include the accrued interest capitalization job for commercial construction loans and the escrow analysis batch for mortgage accounts — creating $4.2M in unposted accruals and 3,400 incorrect escrow statements that the bank must manually correct before the regulatory reporting deadline.`,
    keywords: ['SOX 404', 'FFIEC IT Handbook', 'COBOL batch migration', 'month-end close', 'core banking'],
    demoRelevant: true,
    subTopic: 'core-migration',
  },
  {
    code: 'B1958',
    name: 'Digital Banking App Not Tested Against New Core API Under Concurrent User Load',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's digital banking mobile app is tested against the new core banking API in pre-go-live integration testing at 500 concurrent users — 40% of the peak concurrent user load observed in the legacy system. On the first business day post-migration, the mobile app's real-time account balance and transaction history calls create API gateway saturation at 1,250 concurrent users during the morning rush period, causing balance inquiry response times to exceed 12 seconds and generating 24,000 app error dismissals that the bank's customer service team receives as complaints. The FFIEC IT Handbook's Development and Acquisition booklet requires performance and load testing to reflect realistic production volumes; validating against sub-peak loads gives false assurance and produces a day-one customer experience failure for a bank whose digital transformation programme is a strategic priority.`,
    keywords: ['FFIEC IT Handbook', 'performance testing', 'digital banking', 'core banking', 'API load testing'],
    demoRelevant: true,
    subTopic: 'resilience',
  },
  {
    code: 'B1959',
    name: 'Post-Migration Audit Trail Gaps Impair Fraud Investigation Capability',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's new core banking platform captures transaction audit trails in a different log structure than the legacy system, and the bank's fraud investigation team's case management tooling — which was built to query legacy core audit log schemas — cannot retrieve audit records from the new core without a manual export-and-reformatting step. When the bank's BSA team receives a FinCEN information request requiring transaction history reconstruction for a suspected money laundering network, the investigation team cannot provide the full audit trail within the 20-day FinCEN response window, submitting a partial response that the FinCEN follow-up examination identifies as an AML programme deficiency. The FFIEC IT Handbook's Information Security booklet requires banks to maintain audit log integrity and accessibility across technology transitions; migrating to a new core without updating the fraud investigation and AML monitoring tooling creates a compliance gap that FinCEN examines under the BSA/AML programme standard.`,
    keywords: ['BSA/AML', 'FinCEN', 'audit trail', 'FFIEC IT Handbook', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'data-migration',
  },
];
