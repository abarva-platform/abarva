// seed-banking-dom07-core-banking-part4.ts
// Banking genome patterns — Core Banking Modernisation (Part 4)
// Code range: B2080–B2139  (60 patterns)
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

export const BANKING_DOM07_CORE_BANKING_PART4_PATTERNS: PatternSeed[] = [

  // ── cloud-core-migration (12) ──────────────────────────────────────────────
  {
    code: 'B2080',
    name: 'Multi-Cloud Core Deployment Splits Transaction Ledger Across Availability Zones',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital deploys its cloud-native core banking platform across three availability zones to meet a 99.99% uptime SLA, but the distributed ledger synchronisation design does not handle AZ partition events atomically, causing 11-second windows during AZ network micro-partitions where deposit balance reads return different values depending on which AZ the query routes to. The inconsistency window is sufficient for duplicate ACH withdrawal attempts to succeed simultaneously against the same account balance when the customer's mobile app and a standing ACH debit both query different AZ replicas in the same 11-second window. FFIEC IT Handbook guidance on resilience and data integrity requires banks to ensure that distributed infrastructure designs maintain ACID transaction properties for deposit account operations; cloud multi-AZ designs that sacrifice consistency for availability in deposit processing violate fundamental banking data integrity requirements.`,
    keywords: ['FFIEC IT Handbook', 'cloud migration', 'core banking', 'distributed ledger', 'ACH'],
    demoRelevant: true,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2081',
    name: 'Cloud Cost Model Underestimate Doubles Core Banking Platform TCO in Year Two',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's cloud core banking business case projects a 35% TCO reduction over 5 years based on Year 1 workload benchmarks; by Year 2, the bank's transaction volume grows 28% due to digital channel adoption, and cloud egress costs — which the original model treated as negligible — account for $1.8M of a $4.2M annual overage versus the approved budget. The bank did not model data egress charges for the high-volume event streaming between the core banking platform and its analytics data lake, nor did it negotiate egress cost caps in its cloud framework agreement. OCC Bulletin 2023-17 on third-party risk and the FFIEC IT Handbook both require banks to perform ongoing financial monitoring of cloud service agreements and to include cost-growth scenarios in their cloud migration business cases; surprise cost overruns that threaten programme ROI create concentration risk concerns at examination.`,
    keywords: ['OCC Bulletin 2023-17', 'cloud migration', 'FFIEC IT Handbook', 'TCO', 'core banking'],
    demoRelevant: true,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2082',
    name: 'Shared Responsibility Model Misunderstanding Leaves Cloud Core Without Encryption Key Control',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital migrates its core banking platform to a cloud-hosted SaaS deployment and assumes the cloud provider manages encryption of customer PII at rest; the bank's security team does not contract for customer-managed encryption keys (CMEK), leaving all encryption key material under the cloud provider's control. An OCC examination identifies that the bank cannot produce evidence of exclusive control over the encryption keys protecting customer account data, which is a requirement under GLBA Safeguards Rule and OCC Bulletin 2020-10 on cloud due diligence; the absence of CMEK also means the bank cannot perform cryptographic erasure as a data deletion mechanism for state consumer privacy law obligations. The bank requires a retroactive CMEK implementation costing $640K in migration labour and a 90-day architecture remediation.`,
    keywords: ['GLBA Safeguards Rule', 'OCC', 'cloud migration', 'CMEK', 'encryption key management'],
    demoRelevant: true,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2083',
    name: 'Cloud-Native Core Vendor SLA Does Not Cover Planned Maintenance Windows for Exam Periods',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's cloud-hosted core banking vendor reserves the right to perform maintenance updates during weekend windows without bank consent, as specified in a clause of the SaaS agreement the bank's legal team accepted as standard. During an OCC examination week, the vendor deploys a patch during Saturday evening hours that introduces a configuration regression affecting branch opening procedures on Monday morning, creating a 3-hour production incident that the examination team directly observes. OCC Bulletin 2013-29 requires banks to contractually ensure that critical third-party service providers do not perform unilateral changes to production systems without bank approval; a core banking SaaS agreement that does not require advance notification and bank consent for production changes fails basic TPRM requirements.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'cloud core banking', 'SaaS agreement', 'vendor maintenance'],
    demoRelevant: true,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2084',
    name: 'Core Banking Cloud Region Geo-Restriction Conflicts With FDIC Data Sovereignty Requirements',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital selects a global cloud core banking SaaS provider whose default data residency configuration replicates data to a secondary region in the European Union for disaster recovery purposes; the bank does not enable US-only geo-restriction at contract execution. During an FDIC examination, examiners flag that customer financial data is stored in EU data centres, creating a potential cross-border data transfer issue under US bank regulatory expectations and the EU's GDPR, which the bank has not contractually addressed. FDIC regulatory guidance and OCC Bulletin 2023-17 expect banks to know the geographic location of all data assets and to have contractual control over data residency for customer account information; cloud SaaS default configurations that replicate data outside the US require explicit contractual restrictions and bank approval before deployment.`,
    keywords: ['FDIC', 'OCC Bulletin 2023-17', 'data residency', 'cloud core banking', 'GDPR'],
    demoRelevant: false,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2085',
    name: 'Cloud Core Rollback Capability Not Tested Before Production Cutover Extends Incident Duration',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's cloud core banking migration plan identifies rollback to the legacy mainframe as a contingency option for the first 72 hours post-cutover, but the rollback procedure is never rehearsed in a full dress-rehearsal environment before the production go-live weekend. When the go-live discovers a critical defect in the mortgage payment posting module 8 hours after cutover, the incident management team begins executing the undocumented rollback procedure and encounters 6 configuration dependencies between the new cloud core and downstream channel systems that were not present in the original parallel run, extending the total outage to 19 hours. FFIEC Business Continuity Management guidance requires banks to test recovery and rollback procedures for major technology migrations in conditions that simulate production; untested rollback procedures for core banking platforms are a systemic resilience gap cited in OCC examination findings.`,
    keywords: ['FFIEC', 'OCC', 'cloud migration', 'rollback testing', 'business continuity'],
    demoRelevant: true,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2086',
    name: 'Cloud Core Banking Platform Auto-Scaling Triggers During Regulatory Reporting Batch',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's cloud-native core banking platform is configured with auto-scaling that adds compute capacity when CPU utilisation exceeds 75%; during the quarter-end DFAST data extract and HMDA LAR generation, the auto-scaling triggers and launches new compute instances in the middle of a multi-table JOIN operation, causing the database cluster to rebalance data shards and invalidate in-progress query cursors. The quarter-end regulatory batch that normally completes in 6 hours runs for 22 hours as the rebalancing event forces repeated query restarts, causing DFAST submission data to be delivered to the Federal Reserve 4 hours past the submission window. Federal Reserve and OCC stress testing rules require banks to demonstrate reliable, repeatable regulatory data production capability; auto-scaling architectures that interrupt regulatory batch workloads are a capacity planning and configuration gap.`,
    keywords: ['DFAST', 'HMDA', 'FFIEC IT Handbook', 'cloud core banking', 'auto-scaling'],
    demoRelevant: false,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2087',
    name: 'Lift-and-Shift Cloud Core Migration Retains Legacy Monolith Anti-Patterns',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital chooses a lift-and-shift approach to migrate its on-premises core banking monolith to cloud infrastructure, replicating the existing application architecture on cloud VMs rather than refactoring to cloud-native services; 18 months after migration, the bank discovers its cloud core inherits all legacy scalability constraints, cannot leverage managed cloud database services for cost optimisation, and requires the same manual patching and operational runbook procedures as the original on-premises system. The total cost of the lift-and-shift migration equals 85% of the cost of a full cloud-native re-platform, while delivering none of the operational agility or cost elasticity that justified the cloud migration business case. McKinsey research on bank cloud migrations identifies lift-and-shift as a value-destroying approach that delays genuine modernisation; Gartner's banking technology surveys show 68% of lift-and-shift migrations require a second transformation within 4 years.`,
    keywords: ['OCC Bulletin 2013-29', 'cloud migration', 'FFIEC IT Handbook', 'core banking', 'lift-and-shift'],
    demoRelevant: false,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2088',
    name: 'Cloud Core Identity Federation Gap Creates Orphaned Service Accounts With Elevated Privileges',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital migrates its core banking platform to cloud infrastructure and connects it to the enterprise identity provider via SAML federation for human user access, but the bank's operational automation scripts — which access core banking APIs using long-lived service account credentials stored in legacy configuration files — are not migrated to cloud-native workload identity or secrets management. Six months post-migration, an annual access review identifies 24 service accounts with core banking administrator privileges that have not been rotated in 18 months and are not subject to privileged access management controls. OCC cybersecurity examination guidance and the FFIEC IT Handbook's information security booklet require banks to apply the same identity governance and privileged access management controls to cloud workloads as to on-premises systems; service account credential hygiene gaps in core banking platforms are a high-severity internal control finding.`,
    keywords: ['OCC', 'FFIEC IT Handbook', 'cloud migration', 'privileged access management', 'core banking'],
    demoRelevant: false,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2089',
    name: 'Cloud-Hosted Core Banking Provider Subprocessor Change Not Disclosed Timely',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's cloud core banking SaaS agreement requires 30-day notice before the vendor engages a new subprocessor that will have access to bank customer data; the vendor migrates its database infrastructure to a new cloud sub-provider and posts a notice on its customer portal without sending direct notification to First Capital. The bank discovers the subprocessor change during its quarterly TPRM review — 47 days after the change — and determines the new subprocessor is domiciled in a jurisdiction with government data access laws that the bank's privacy counsel considers incompatible with its consumer privacy programme. OCC Bulletin 2013-29 TPRM requirements and GLBA Safeguards Rule obligations require banks to know who has access to customer data and to contractually control subprocessor changes; portal-only notification that bypasses the bank's TPRM process is a vendor governance failure.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'GLBA Safeguards Rule', 'cloud core banking', 'subprocessor'],
    demoRelevant: false,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2090',
    name: 'Cloud Core Banking Network Peering Architecture Creates Regulatory Data Pathway Through Untrusted Zone',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's cloud core banking deployment uses a hub-and-spoke virtual network topology where the core banking workload VNet peers through a shared services hub that also hosts a development environment; the network security group rules between development and production environment VNets are misconfigured, creating a permitted routing path for lateral movement from development to production core banking database tiers. The FFIEC IT Handbook's information security booklet requires production financial systems to be strictly isolated from non-production environments with no permitted network paths; the OCC's cybersecurity examination process includes network segmentation validation as a core control; a permitted routing path between development and production in a core banking cloud architecture is a critical control gap.`,
    keywords: ['FFIEC IT Handbook', 'OCC', 'cloud migration', 'network segmentation', 'core banking security'],
    demoRelevant: true,
    subTopic: 'cloud-core-migration',
  },
  {
    code: 'B2091',
    name: 'Cloud Core Observability Gaps Leave Batch Performance Regression Undetected for Two Weeks',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital migrates its core banking platform to cloud infrastructure and configures cloud-native monitoring dashboards for API response times and error rates, but does not instrument its overnight batch processing pipeline with equivalent observability tooling — a gap from the on-premises model where batch performance was monitored via mainframe SMF records. A batch processing performance regression introduced in a vendor patch extends the nightly interest posting cycle from 3 hours to 6 hours for 16 days before a compliance officer notices discrepancies in the morning GL opening balance and escalates. FFIEC IT Handbook guidance on operations management requires banks to maintain comprehensive monitoring of all production workloads including batch; cloud migration projects that modernise real-time observability without extending it to batch workloads create operational blind spots that delay incident detection.`,
    keywords: ['FFIEC IT Handbook', 'OCC', 'cloud migration', 'core banking', 'batch monitoring'],
    demoRelevant: false,
    subTopic: 'cloud-core-migration',
  },

  // ── api-modernization (10) ─────────────────────────────────────────────────
  {
    code: 'B2092',
    name: 'Open Banking API Gateway Lacks Consent Lifecycle Management for Third-Party Data Sharing',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital deploys an open banking API gateway to allow CFPB Section 1033-compliant third-party data access; the gateway authenticates and authorises third-party requests but does not implement a consent management lifecycle — tracking the scope, expiry date, and revocation status of customer authorisations for each connected application. When customers attempt to revoke access to a third-party budgeting app, the bank's core banking system continues issuing API tokens because the revocation event is not propagated from the consent management layer to the token issuance service. CFPB Section 1033 final rule requires banks to implement consumer data access rights with revocation capability that takes effect within one business day; an API architecture that cannot honour revocation within required timeframes is a direct regulatory compliance failure.`,
    keywords: ['CFPB Section 1033', 'open banking', 'consent management', 'API gateway', 'data access'],
    demoRelevant: true,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2093',
    name: 'Core Banking REST API Lacks Idempotency Headers Causing Duplicate Loan Disbursements',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's new core banking platform exposes a REST API for loan disbursement operations that does not require or honour idempotency keys on POST requests; when First Capital's loan origination system experiences a network timeout and retries the disbursement request, the core banking API processes both requests as independent transactions and disburses the loan amount twice to the borrower's linked account. The duplicate disbursement for a $240,000 commercial term loan is identified 4 hours later during the daily disbursement reconciliation, but recovery requires a wire reversal to the borrower and a 48-hour resolution of the accounting entries. Nacha Operating Rules and Federal Reserve payment system guidelines require originating systems to implement duplicate detection; the FFIEC IT Handbook's development standards booklet expects financial APIs to support idempotency for any non-idempotent financial operation.`,
    keywords: ['Nacha', 'FFIEC IT Handbook', 'REST API', 'core banking', 'loan disbursement'],
    demoRelevant: false,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2094',
    name: 'API-First Core Banking Design Exposes Internal Domain Model in Public API Contract',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital builds its API layer to directly expose the internal core banking domain model as its public API contract — using internal field names, enumeration values, and entity identifiers that are implementation details of the core platform — rather than designing a stable consumer-oriented API surface. When the bank undergoes a core banking platform upgrade 2 years later, 34 downstream integrations fail because the upgrade changes internal field naming conventions and entity relationship structures that were implicitly committed to in the public API. The FFIEC IT Handbook's development and acquisition booklet requires banks to maintain stable, versioned API contracts for inter-system dependencies; exposing implementation internals as a public API contract is a software architecture anti-pattern that makes every core upgrade a breaking change event for all consumers.`,
    keywords: ['FFIEC IT Handbook', 'API design', 'core banking', 'OCC Bulletin 2013-29', 'integration'],
    demoRelevant: false,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2095',
    name: 'Core Banking API Rate Limiting Policy Not Aligned With Real-Time Payments SLA Requirements',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's core banking platform imposes a 100-requests-per-second rate limit on its internal API, which was calibrated for legacy batch processing; when the bank enables FedNow instant payment processing, inbound payment notifications require balance validation queries at burst rates of 340 requests per second during morning business-to-business payment settlement windows. The API rate limiter throttles balance validation queries during peak periods, causing FedNow payment completions to queue beyond the Federal Reserve's 20-second completion window, triggering automatic payment returns and FedNow performance monitoring flags. Federal Reserve FedNow operating procedures require participant banks to maintain completion performance within defined windows; an API rate limit architecture that cannot support real-time payments burst traffic is an infrastructure readiness gap that should be identified before enabling instant payment services.`,
    keywords: ['FedNow', 'Federal Reserve', 'API rate limiting', 'core banking', 'real-time payments'],
    demoRelevant: true,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2096',
    name: 'Core Banking Webhook Event Delivery Has No Retry With Backoff Causing Lost Fraud Alerts',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking platform delivers real-time fraud alert events to its fraud management system via webhooks; the webhook delivery implementation makes a single delivery attempt and discards the event if the fraud system endpoint returns an error or times out, without implementing retry with exponential backoff or a dead-letter queue. During a 4-hour fraud system maintenance window, the core banking platform silently drops 8,400 fraud alert webhook events; when the fraud system comes back online it has no awareness of transactions that occurred during the outage and cannot apply retrospective fraud rules. The FFIEC IT Handbook requires banks to ensure that inter-system event delivery for risk and compliance controls is reliable and auditable; the OCC's fraud risk management guidance expects banks to maintain comprehensive transaction monitoring coverage without silent gaps.`,
    keywords: ['OCC', 'FFIEC IT Handbook', 'fraud monitoring', 'core banking API', 'webhook reliability'],
    demoRelevant: true,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2097',
    name: 'API Token Expiry Policy Shorter Than Regulatory Reporting Batch Cycle Breaks DFAST Extract',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's core banking API issues OAuth 2.0 access tokens with a 1-hour expiry; the bank's DFAST regulatory data extraction pipeline is a long-running batch job that takes 4–6 hours to complete and was written with token refresh logic for 2-hour token expiry from the legacy system. During the first DFAST extraction cycle after a core API security hardening initiative reduces token expiry to 1 hour, the extraction pipeline fails mid-run when its 2-hour refresh cycle triggers against a token that has already expired. The Federal Reserve's DFAST submission timeline does not accommodate technical failures that cause data production delays; FFIEC IT Handbook change management guidance requires banks to assess the downstream impact of API security configuration changes on dependent regulatory reporting pipelines before deploying to production.`,
    keywords: ['DFAST', 'FFIEC IT Handbook', 'OCC', 'OAuth 2.0', 'core banking API'],
    demoRelevant: false,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2098',
    name: 'Core Banking API Audit Log Does Not Capture Field-Level Changes Required for BCBS 239',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's core banking API logs all API calls at the operation level — recording the endpoint, timestamp, and user identity — but does not capture the field-level before-and-after values for account data modification operations, leaving no audit trail for changes to customer credit risk ratings, account limit adjustments, and interest rate overrides. BCBS 239 principle 2 requires banks to maintain accurate and complete data lineage for risk data; OCC model risk guidance requires banks to document changes to model inputs and parameters with audit trails that can be reconstructed for examination; operating a core banking API that cannot produce field-level change history for credit and risk data fields is a data governance deficiency. During a BCBS 239 supervisory review, the bank cannot demonstrate that credit rating changes in the core were not manipulated in the run-up to DFAST submission.`,
    keywords: ['BCBS 239', 'OCC', 'DFAST', 'core banking API', 'audit logging'],
    demoRelevant: true,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2099',
    name: 'Microservices Core Banking API Mesh Without Service-to-Service mTLS Fails PCI DSS Audit',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital decomposes its core banking monolith into microservices communicating over an internal API mesh; to accelerate deployment timelines, the initial go-live is launched without mutual TLS authentication between microservices, relying on network-layer isolation as the sole control. A PCI DSS v4.0 audit finds that core banking microservices processing cardholder data communicate without service-to-service authentication, violating PCI DSS Requirement 6.4.1 for network transmission security and Requirement 10.2.2 for authenticated access logging. The remediation requires retrofitting mTLS certificates across 34 microservices with a certificate management platform, a 14-week effort that delays the bank's annual PCI Report on Compliance certification. PCI DSS v4.0 explicitly requires mutual authentication for all service-to-service API communications within the cardholder data environment.`,
    keywords: ['PCI DSS', 'mTLS', 'microservices', 'core banking API', 'FFIEC IT Handbook'],
    demoRelevant: false,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2100',
    name: 'Core Banking API Pagination Design Causes Incomplete GL Balance Reconciliation Exports',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's core banking platform exposes GL balance export functionality via a paginated REST API; the pagination implementation uses offset-based paging that does not handle concurrent writes, causing pages to shift between requests when new transactions are posted during a running export — resulting in some accounts appearing on two pages and others appearing on no pages. The nightly GL reconciliation batch relies on this API and produces a balance sheet that is $2.7M out of balance on high-volume processing days, triggering manual reconciliation work by the accounting team that averages 4 hours per incident. OCC financial reporting guidance and FFIEC IT Handbook standards for financial system integrity require banks to design data export mechanisms that produce complete, consistent datasets regardless of concurrent processing activity; offset-based pagination for financial data export is a known anti-pattern that violates financial data completeness requirements.`,
    keywords: ['OCC', 'FFIEC IT Handbook', 'GL reconciliation', 'core banking API', 'pagination'],
    demoRelevant: false,
    subTopic: 'api-modernization',
  },
  {
    code: 'B2101',
    name: 'Core Banking GraphQL API Exposes Unintended Customer Data Through Introspection Endpoint',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital deploys a GraphQL API layer over its core banking data model to enable flexible data access for internal analytics consumers; the GraphQL introspection endpoint — which exposes the full schema including field names and types — is left enabled in the production environment and accessible without authentication. A red team assessment discovers that an attacker who gains access to a low-privilege service account can use the introspection endpoint to map the full customer account data schema and then craft queries that extract account balances, interest rates, and credit limits for any customer in the system. GLBA Safeguards Rule and FFIEC IT Handbook security standards require banks to restrict access to systems containing customer financial data to authorised users with demonstrated business need; exposing an unauthenticated schema introspection endpoint for a core banking API is a critical information disclosure vulnerability.`,
    keywords: ['GLBA Safeguards Rule', 'FFIEC IT Handbook', 'GraphQL', 'core banking API', 'OCC'],
    demoRelevant: false,
    subTopic: 'api-modernization',
  },

  // ── vendor-core-selection (8) ──────────────────────────────────────────────
  {
    code: 'B2102',
    name: 'Core Banking Vendor RFP Does Not Include Regulatory Examination Information Request Capability Test',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital selects its core banking platform vendor based on product functionality, implementation timeline, and pricing criteria; the RFP evaluation does not include a scenario test requiring the vendor to demonstrate how the bank can respond to an OCC or Federal Reserve information request requiring production of specific customer account records, transaction histories, and system configuration logs within a 5-business-day examiner deadline. After contract execution and implementation, the bank discovers the vendor's audit log export function requires a custom data extract engagement — not available within 5 days — to produce the structured data format required for regulatory information requests. OCC Bulletin 2013-29 requires banks to ensure that third-party technology providers can support the bank's ability to respond to regulatory examinations; failing to test this capability during vendor selection creates a compliance gap that cannot be easily remediated post-contract.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'core banking vendor', 'regulatory examination', 'RFP'],
    demoRelevant: true,
    subTopic: 'vendor-core-selection',
  },
  {
    code: 'B2103',
    name: 'Core Banking Vendor Implementation Methodology Lacks Bank-Specific Regulatory Configuration Library',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital selects a globally deployed core banking platform and contracts for the vendor's standard implementation methodology, which is based on a generic product configuration accelerator not tailored to US OCC-chartered bank regulatory requirements; the implementation team must custom-configure dormancy rules, Reg CC funds availability logic, Reg DD CD maturity disclosure workflows, and Reg E dispute resolution workflows from scratch rather than from a validated US regulatory baseline. The custom configuration effort adds 9 months to the implementation timeline and introduces 23 compliance defects that are identified during parallel run — defects that a US regulatory configuration library would have addressed through pre-validated templates. McKinsey and Gartner benchmarks of core banking implementations consistently identify regulatory configuration library gaps as the most common cause of schedule slippage in US bank core conversions.`,
    keywords: ['OCC', 'Reg CC', 'Reg E', 'core banking vendor', 'implementation methodology'],
    demoRelevant: true,
    subTopic: 'vendor-core-selection',
  },
  {
    code: 'B2104',
    name: 'Core Vendor Financial Stability Not Assessed Before 7-Year Contract Execution',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital signs a 7-year core banking platform contract with a mid-tier vendor without performing a TPRM financial stability assessment; 3 years into the contract, the vendor is acquired by a private equity firm that restructures its engineering workforce and reduces platform support SLA commitments as part of a cost-cutting programme. The bank's account is downgraded from dedicated to pooled support, extending incident response times from 4 hours to 72 hours under the original contract terms that did not include anti-dilution provisions. OCC Bulletin 2013-29 requires banks to assess third-party provider viability and resilience at onboarding and on an ongoing basis; multi-year core banking contracts without right-to-exit provisions triggered by material changes to vendor ownership, support staffing, or service commitments expose banks to unsupported legacy platform risk.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'vendor financial stability', 'core banking', 'contract governance'],
    demoRelevant: false,
    subTopic: 'vendor-core-selection',
  },
  {
    code: 'B2105',
    name: 'Core Banking Vendor Proof-of-Concept Uses Synthetic Data That Masks Real-World Performance Gap',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital evaluates its shortlisted core banking vendors through a proof-of-concept exercise using synthetic transaction data generated by the vendor; the synthetic data does not replicate the bank's actual account dormancy distribution, the long-tail of legacy product codes, or the mixed-character-set customer name records from its acquired institutions. In production, the new core processes 18% of account records 4–6 times slower than demonstrated in the POC because those records trigger edge cases in the product configuration that the synthetic data never exercised. The OCC and FFIEC IT Handbook both require banks to conduct vendor due diligence using production-representative data conditions; core banking platform performance evaluations based on vendor-supplied synthetic data systematically underestimate real-world processing complexity.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'core banking vendor', 'POC', 'TPRM'],
    demoRelevant: false,
    subTopic: 'vendor-core-selection',
  },
  {
    code: 'B2106',
    name: 'Core Banking Vendor Certification for SWIFT Connectivity Not Verified Before Selection',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital selects a core banking platform vendor based on its stated SWIFT connectivity capability; after contract execution, the bank discovers the vendor's SWIFT interface is certified only for FIN message types and does not support SWIFT gpi for cross-border payment tracking, which is required for First Capital's corporate treasury customers. Retrofitting SWIFT gpi support into the core's integration layer requires a custom development engagement quoted at $1.4M and an 18-month implementation timeline that delays the bank's corporate treasury product launch. SWIFT member banks are required to support gpi for all new cross-border payment installations; failing to verify the specific SWIFT product certification scope of a core banking vendor before selection is a procurement due diligence failure that creates product capability gaps post-implementation.`,
    keywords: ['SWIFT', 'SWIFT gpi', 'OCC Bulletin 2013-29', 'core banking vendor', 'corporate banking'],
    demoRelevant: true,
    subTopic: 'vendor-core-selection',
  },
  {
    code: 'B2107',
    name: 'Core Platform Vendor References Not Checked for OCC Consent Order Clients',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital, operating under an OCC MRM consent order, selects a core banking vendor whose reference clients are community banks and credit unions without pending regulatory orders; the bank does not seek references from other OCC-chartered institutions that have implemented the platform under enhanced supervisory scrutiny. After go-live, the bank's implementation team and the vendor's delivery team encounter recurring disagreements about whether the platform's audit logging and model risk governance integration features meet OCC consent order remediation standards, issues the vendor was not prepared to address. OCC examination guidance on technology change management expects banks under consent orders to evaluate whether prospective core banking vendors have demonstrated capability to support consent order remediation requirements; checking vendor references only for standard implementations without regulatory overlay is an incomplete due diligence approach.`,
    keywords: ['OCC', 'consent order', 'TPRM', 'core banking vendor', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'vendor-core-selection',
  },
  {
    code: 'B2108',
    name: 'Core Banking Vendor Escrow Agreement Does Not Include Operational Run-Book Material',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital negotiates source code escrow rights with its core banking vendor as a condition of the contract, but the escrow agreement specifies only source code delivery; it does not require deposit of build scripts, environment configuration templates, database schema migration scripts, or operational runbooks needed to compile and operate the platform without the vendor's involvement. When the bank exercises its escrow rights following the vendor's bankruptcy, it receives source code it cannot compile because the build environment specifications and deployment automation were never deposited. OCC Bulletin 2013-29 requires banks to ensure that escrow agreements for critical third-party software include sufficient materials to recreate a functional deployment; source-code-only escrow without operational artefacts provides illusory rather than real continuity protection.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'source code escrow', 'core banking vendor', 'business continuity'],
    demoRelevant: false,
    subTopic: 'vendor-core-selection',
  },
  {
    code: 'B2109',
    name: 'Core Banking Platform Upgrade Roadmap Dependency Not Assessed Before 5-Year Contract',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital signs a 5-year core banking platform contract without assessing the vendor's upgrade roadmap and the bank's obligation to remain on a supported platform version; 3 years into the contract, the vendor drops support for the version First Capital is running and requires a mandatory paid upgrade to the new major version, which contains breaking API changes that invalidate 8 of the bank's fintech integrations. The contractual upgrade obligation was not identified during due diligence because it appeared only in the vendor's technical support policy document rather than the main contract. OCC Bulletin 2013-29 TPRM guidance requires banks to review all vendor policy documents that define support obligations and upgrade requirements; core banking contracts without explicit version support guarantees or upgrade cost caps expose banks to unbudgeted mandatory upgrade cycles.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'core banking vendor', 'platform upgrade', 'contract governance'],
    demoRelevant: true,
    subTopic: 'vendor-core-selection',
  },

  // ── ai-core-part4 (18) ────────────────────────────────────────────────────
  {
    code: 'B2110',
    name: 'AI Core Banking Configuration Advisor Generates Non-Compliant Overdraft Product Parameters',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital uses a generative AI assistant embedded in its core banking administration console to recommend overdraft protection product configuration parameters for a new checking account tier; the AI recommends an overdraft fee structure and grace period configuration based on training data from peer banks, but does not incorporate First Capital's specific CFPB consent order requirements that mandate a 24-hour grace period before assessing overdraft fees for accounts in the new tier. The bank deploys the AI-recommended configuration and charges overdraft fees to 4,200 customers within the protected grace period before the compliance team identifies the non-conforming configuration. OCC Bulletin 2023-17 on generative AI governance requires banks to perform human review of AI-generated system configuration recommendations for regulatory-sensitive product parameters; treating AI configuration suggestions as final without compliance validation creates UDAP exposure.`,
    keywords: ['OCC Bulletin 2023-17', 'CFPB', 'UDAP', 'AI configuration', 'overdraft'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2111',
    name: 'AI Deposit Pricing Optimisation Model Violates Reg Q Prohibition Without Human Review',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital deploys an AI deposit pricing optimisation model that recommends relationship-tier interest rates for commercial demand deposit accounts; the model identifies a configuration that maximises NIM by offering differentiated rate tiers to commercial customers with higher credit facility utilisations, which inadvertently creates an arrangement that regulators interpret as paying above-market interest on demand deposits as an inducement for loan business — a Regulation Q violation. The AI model was not constrained by Reg Q rules in its optimisation objective function because the compliance team assumed the outcome space would remain within compliant bounds. SR 11-7 requires banks to document the regulatory constraints applied to AI model optimisation objectives; models that optimise financial product parameters without embedded regulatory guardrails create compliance exposure that human review must catch before implementation.`,
    keywords: ['SR 11-7', 'OCC', 'Reg Q', 'AI pricing model', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2112',
    name: 'AI Vendor Contract Redlining Tool Misses Core Banking Indemnification Carve-Outs',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's procurement team uses an AI contract review tool to analyse a core banking platform vendor agreement; the AI tool flags standard commercial terms for negotiation but fails to identify a vendor indemnification carve-out that exempts the vendor from liability for data loss, regulatory fines, or consequential damages arising from the vendor's own security incidents — carve-outs that are non-standard in banking technology contracts and directly relevant to OCC Bulletin 2013-29 TPRM requirements. The bank executes the contract based on the AI review, and subsequently incurs $3.4M in regulatory remediation costs following a vendor-side security incident for which the vendor disclaims all liability under the indemnification carve-out the AI tool missed. SR 11-7 and OCC Bulletin 2023-17 require human legal and compliance review of AI-assisted contract analysis for material risk provisions; AI contract tools that produce incomplete reviews without confidence scoring create a false assurance risk.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'TPRM', 'AI contract review', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2113',
    name: 'AI-Powered Teller Scripting Tool Provides Inaccurate Account Balance Information During Core Cutover',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an AI teller assist tool that retrieves account information from the core banking platform via API and generates natural-language response scripts for branch teller customer interactions; during the core banking cutover weekend, the API connection between the AI teller tool and the new core is not activated until 6 hours into Monday operations, but the teller tool remains active and serves balance information from a cached snapshot of the legacy core that is 36 hours stale. Tellers using the AI tool provide customers with balance information that does not reflect weekend transactions, and 340 customers make withdrawal or payment commitments based on incorrect balance information. The CFPB's supervisory guidance on customer account information accuracy requires banks to ensure that customer-facing tools provide accurate, current account data; AI tools that serve stale data without a staleness indicator or fallback to authoritative source create consumer protection risk.`,
    keywords: ['CFPB', 'Reg E', 'AI teller assist', 'core banking migration', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2114',
    name: 'AI Interest Rate Risk Model Not Re-Calibrated After Core Banking Platform Rate Methodology Change',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's AI-enhanced interest rate risk model uses daily repricing sensitivity features derived from the core banking platform's yield curve parameters; a core banking platform upgrade changes the day-count convention used in the platform's interest rate calculation engine from actual/365 to 30/360 for a subset of adjustable-rate mortgage products, altering the repricing sensitivity values the AI model receives. The AI model continues producing asset-liability management recommendations based on the pre-upgrade methodology, systematically underestimating the repricing gap for ARM portfolios by 14 basis points. SR 11-7 model risk guidelines require banks to re-validate AI models following material changes to upstream data sources or calculation methodologies; the OCC's interest rate risk examination guidance expects banks to ensure ALCO modelling tools reflect the current methodology of the core banking platform.`,
    keywords: ['SR 11-7', 'OCC', 'AI interest rate risk', 'ALCO', 'core banking upgrade'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2115',
    name: 'Generative AI Core Documentation Tool Produces Stale SOX Control Narratives',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital uses a generative AI tool to maintain its IT general controls documentation for Sarbanes-Oxley Section 404 compliance, automatically updating control narratives when configuration changes are detected; after a core banking platform upgrade, the AI tool updates the change management control narrative but does not reflect the updated segregation of duties configuration, producing a SOX 404 narrative that describes legacy RACF-style controls that no longer exist in the new platform. The bank's external auditor performs walkthrough testing against the AI-generated narrative and identifies that the documented controls differ from the controls actually in place, triggering a significant deficiency finding. OCC Bulletin 2023-17 requires banks to validate AI-generated compliance documentation against operational reality; AI tools that update documentation based on partial change detection without a completeness check create audit risk that is more expensive to remediate than manual documentation maintenance.`,
    keywords: ['OCC Bulletin 2023-17', 'SOX', 'AI documentation', 'core banking', 'segregation of duties'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2116',
    name: 'AI Fraud Ring Detection Graph Model Expands False Network After Core Account Number Reformat',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's AI fraud ring detection model uses account-to-account transaction graphs to identify coordinated fraud networks; after the core banking migration changes account number format from 10-digit to 16-digit, the graph model's entity resolution layer incorrectly links 420 legitimate customer accounts whose new 16-digit numbers share the same 10-digit suffix as fraud-flagged accounts from the historical training data. The model produces 420 false fraud network expansion alerts that freeze accounts of legitimate customers for up to 11 days while fraud analysts investigate. BSA/AML requirements and CFPB consumer protection standards both require banks to have processes to rapidly identify and remediate false-positive fraud actions that restrict customer account access; SR 11-7 model risk guidelines require re-validation of fraud models after changes to account identifiers used as graph entity keys.`,
    keywords: ['SR 11-7', 'BSA/AML', 'AI fraud ring detection', 'CFPB', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2117',
    name: 'AI Regulatory Change Impact Assessor Fails to Flag Core Banking Implications of CFPB Rule Update',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital deploys an AI regulatory change monitoring and impact assessment tool to help its compliance team identify the core banking configuration changes required by new regulatory guidance; when the CFPB issues a final rule updating the small business lending data collection requirements under Dodd-Frank Section 1071, the AI tool summarises the rule correctly but assesses its core banking impact as "no system changes required" because the tool was trained on consumer banking system taxonomy and does not recognise the bank's commercial loan origination system as a regulated "covered financial institution" under the new rule. The bank misses a 12-month implementation deadline and is cited in a CFPB examination for late compliance with Section 1071. OCC Bulletin 2023-17 requires banks to validate AI regulatory impact assessments against authoritative regulatory text; AI tools that produce compliance clearance statements without domain-complete coverage create regulatory deadline risk.`,
    keywords: ['CFPB', 'Dodd-Frank Section 1071', 'OCC Bulletin 2023-17', 'AI regulatory monitoring', 'SR 11-7'],
    demoRelevant: false,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2118',
    name: 'AI Core Banking Test Case Generator Misses Negative Balance Boundary Scenarios',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital uses a generative AI tool to automatically generate test cases for its core banking platform UAT, providing the AI with business requirements documents and existing test case libraries; the AI generates a comprehensive set of happy-path and common error scenarios but does not generate tests for negative balance boundary conditions — accounts that reach exactly $0.00 balance during high-value wire debit processing — because these conditions do not appear in the training corpus. An undetected negative-balance processing defect in the new core reaches production, causing 890 accounts to fall below zero without triggering the bank's standard overdraft workflow, resulting in $1.2M in uncollected overdraft positions. FFIEC IT Handbook development standards require banks to define acceptance criteria that include boundary conditions and negative scenarios; AI-generated test suites that rely on historical test case patterns will systematically miss novel edge cases that appear in new platform implementations.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2023-17', 'AI test generation', 'core banking UAT', 'overdraft'],
    demoRelevant: false,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2119',
    name: 'AI Customer Segmentation Model Assigns Migration Cohort to Wrong Product Tier',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital uses an AI customer segmentation model to assign new and existing customers to product tier configurations in the new core banking platform; the model uses a 24-month transaction history feature set, but migration customers whose history was partially truncated at data cutover receive AI-assigned product tiers that do not match their actual relationship depth, resulting in 6,200 long-tenured commercial customers being placed in retail product tiers with lower transaction limits and higher service fees. The incorrect tier assignments generate 1,800 customer complaints and require a manual correction campaign, and the fee overcharges for the 8 days before the error is detected require UDAP remediation under CFPB guidance. ECOA and SR 11-7 model risk requirements both mandate that AI segmentation models be re-validated when input feature completeness changes materially, as it does when historical data is truncated during platform migration.`,
    keywords: ['SR 11-7', 'ECOA', 'CFPB', 'AI customer segmentation', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2120',
    name: 'AI-Driven Core Banking Release Approval Tool Approves Defective Change With Insufficient Testing Evidence',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital implements an AI-assisted release approval tool for its core banking platform change management process; the AI tool reviews automated test results, code quality metrics, and deployment checklists to recommend release approval or rejection. A deployment package with 94% test pass rate — above the AI tool's 90% approval threshold — is approved by the AI and deployed to production; the 6% failing tests included the only tests covering the platform's Reg CC hold calculation for mobile-deposit cheques, and the deployed code contains a regression that incorrectly waives mandatory Reg CC holds for mobile deposits above $5,000. FFIEC IT Handbook change management guidance requires banks to ensure that changes affecting regulatory compliance functionality undergo specific compliance officer sign-off that cannot be delegated to an AI threshold test; AI-assisted release gates that do not separate compliance-critical test failures from non-critical failures create regulatory release risk.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2023-17', 'Reg CC', 'AI release management', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2121',
    name: 'AI Natural Language Query Interface to Core Banking Data Returns PII Without Access Controls',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital deploys a generative AI natural language interface that allows bank employees to query core banking data using plain English questions; the interface connects directly to a data warehouse replica of the core banking system and does not apply the bank's column-level data masking rules for PII fields — because the masking was implemented at the core banking application layer, not the underlying database layer. A branch manager who has view access to account balance aggregates uses the AI query interface to retrieve individual customer SSN and date-of-birth fields that their role does not authorise, which the interface provides without restriction. GLBA Safeguards Rule and OCC information security guidance require banks to enforce access controls at the data layer, not only at the application layer; AI natural language query interfaces that bypass application-layer data masking create material privacy and GLBA compliance exposure.`,
    keywords: ['GLBA Safeguards Rule', 'OCC', 'AI data query', 'core banking', 'PII access control'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2122',
    name: 'AI Model Drift Monitoring Tool Does Not Cover Core Banking Embedded Score Models',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital implements an enterprise AI model drift monitoring platform that tracks performance degradation for its 47 registered SR 11-7 models; the core banking platform vendor embeds proprietary AI-powered overdraft prediction and deposit churn models within the platform's risk analytics module, which the bank's MRM team classifies as "vendor product features" exempt from enterprise drift monitoring. An OCC model risk examination identifies that the embedded vendor models have not been monitored for drift, have not been independently validated, and are not included in the bank's model inventory — representing a significant MRM consent order remediation gap. SR 11-7 explicitly requires banks to apply model risk management to all models regardless of whether they are vendor-supplied or internally developed; embedded AI models in core banking platforms require the same inventory, validation, and drift monitoring as standalone models.`,
    keywords: ['SR 11-7', 'OCC', 'model drift monitoring', 'AI vendor model', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2123',
    name: 'AI-Powered Core Banking Incident Triage Mis-Classifies Production Outage Severity',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital deploys an AI incident management triage tool that classifies incoming core banking production alerts by severity and routes them to on-call response teams; the AI model correctly classifies most high-volume alert types but assigns a P2 (4-hour response) classification to a core banking database connection pool exhaustion event — which affects only 3 API endpoints — rather than P1 (15-minute response), because those 3 endpoints happen to be the bank's FedNow instant payment confirmation API, the debit card authorisation API, and the ACH origination submission API. The 4-hour P2 response window results in 3.5 hours of silent failure for FedNow, debit card, and ACH processing before escalation. The FFIEC IT Handbook requires banks to calibrate incident severity classification systems based on the business criticality of affected services, not just the volume of affected endpoints; AI triage models that classify severity without understanding payment system criticality create disproportionate outage impact.`,
    keywords: ['FFIEC IT Handbook', 'FedNow', 'OCC', 'AI incident management', 'core banking resilience'],
    demoRelevant: false,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2124',
    name: 'AI-Assisted Core Banking Capacity Planning Underestimates Holiday Weekend ACH Volume',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital implements an AI capacity planning tool for its cloud core banking infrastructure that learns from historical workload patterns and recommends pre-scaling events; the model is trained on 18 months of post-migration data and identifies weekly and monthly patterns, but does not have sufficient training data to capture the ACH and wire payment volume spikes that occur specifically at Thanksgiving and Christmas holiday weekends — anomalous patterns that recur only once per year. The first Thanksgiving post-implementation, the AI capacity plan recommends a standard weekend scale-out that is insufficient for the 3.4x holiday volume surge, causing ACH processing queue depth to exceed platform capacity and resulting in same-day ACH credits failing to post on Thanksgiving Day. FFIEC Business Continuity Management guidance requires banks to incorporate known seasonal volume patterns in capacity planning; AI capacity models with insufficient seasonal training data cannot reliably identify annual peak events.`,
    keywords: ['FFIEC', 'OCC', 'AI capacity planning', 'cloud core banking', 'ACH'],
    demoRelevant: false,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2125',
    name: 'Generative AI Core Banking Knowledge Base Propagates Outdated Compliance Guidance to Relationship Managers',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital deploys a generative AI knowledge base assistant for relationship managers that synthesises product information, compliance guidelines, and regulatory requirements from a training corpus last updated 11 months prior; the AI assistant continues to provide CRA assessment guidance based on the pre-2023 CRA final rule framework, advising relationship managers on qualifying community development activities under criteria the OCC's revised CRA rule has superseded. Relationship managers relying on the AI assistant incorrectly categorise $28M of commercial loans as CRA-qualifying community development investments under outdated assessment criteria, inflating the bank's CRA performance score for the examination period. OCC Bulletin 2023-17 requires banks to establish update cycles for AI knowledge base tools used in regulatory compliance; compliance-guidance AI tools with stale training data create regulatory exam credibility risk.`,
    keywords: ['OCC Bulletin 2023-17', 'CRA', 'SR 11-7', 'generative AI', 'relationship banking'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2126',
    name: 'AI Collateral Valuation Model Not Validated Against Core Banking Lien Priority Data',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital uses an AI model to automate collateral valuation updates for commercial real estate loans in its core banking system, integrating automated property valuation model outputs with the loan servicing module; the AI valuation model does not verify lien priority data before calculating loan-to-value ratios, and after the core migration scrambled some UCC lien priority metadata (see B2034), the AI model computes LTV ratios assuming first-lien position for loans that are actually second-lien, systematically understating credit risk for 890 commercial loans. The understated LTV ratios feed directly into the CECL allowance for credit loss model, reducing loan loss reserves by $14.2M below the appropriate level. SR 11-7 requires banks to validate that AI model input data is accurate before using model outputs for regulatory reporting; CECL accuracy requirements under ASC 326 require banks to ensure that input data quality is maintained across all systems feeding the allowance calculation.`,
    keywords: ['SR 11-7', 'CECL', 'ASC 326', 'AI collateral valuation', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },
  {
    code: 'B2127',
    name: 'AI Core Banking Migration Progress Dashboard Misreports Cutover Readiness to Executive Steering Committee',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital uses an AI programme management dashboard to aggregate core banking migration workstream status and present a RAG status to the executive steering committee; the AI tool aggregates completion percentages from project management tickets and calculates an overall readiness score of 94%, which the steering committee uses to approve an accelerated cutover date. The AI dashboard does not capture or weight the severity of 14 open defects identified in parallel run — recorded in a separate defect tracking system the AI tool does not integrate — including 3 P1 defects in the Reg CC funds availability module. The accelerated cutover proceeds with the unresolved P1 defects, causing a Reg CC compliance failure that the CFPB identifies in a subsequent examination. FFIEC IT Handbook governance standards require banks to ensure that programme reporting tools reflect the complete risk picture before major go-live decisions; AI dashboards that aggregate from incomplete data sources provide dangerous false confidence to executive decision-makers.`,
    keywords: ['FFIEC IT Handbook', 'CFPB', 'Reg CC', 'AI programme management', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-core-part4',
  },

  // ── resilience-continuity (12) ─────────────────────────────────────────────
  {
    code: 'B2128',
    name: 'Core Banking Recovery Time Objective Assumed From Legacy System Not Re-Validated for New Platform',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's Business Continuity Plan declares a 4-hour Recovery Time Objective for core banking operations based on the legacy mainframe's tested recovery capability; after migrating to the cloud-native core banking platform, the BCP is updated to reference the new platform but the 4-hour RTO is carried forward without re-testing. When the cloud core experiences a regional availability zone failure 14 months post-migration, the actual recovery time is 9.5 hours because the new platform's failover procedures involve cloud infrastructure reprovisioning steps that did not exist on the mainframe and were never incorporated into the tested runbook. FFIEC Business Continuity Management guidance requires banks to test recovery objectives against the actual operational platform and to update RTOs and recovery procedures when the underlying technology changes; inheriting RTOs from decommissioned systems without re-validation is a BCP governance gap.`,
    keywords: ['FFIEC', 'business continuity', 'RTO', 'core banking', 'OCC'],
    demoRelevant: true,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2129',
    name: 'Core Banking DR Site Runs One Version Behind Production After Deferred Patch Cycle',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital maintains a warm disaster recovery site for its core banking platform that is updated on a 30-day patch cycle; when a critical security patch is applied to the production core banking environment on an accelerated 7-day timeline due to a CVE advisory, the DR site is not included in the emergency patch cycle and remains on the unpatched version. A production incident 19 days later requires failover to the DR site; the bank's DR runbook does not include a step to verify platform version compatibility before failover, and the DR site's unpatched version processes transactions with a known data validation defect that was fixed in the production patch. FFIEC Business Continuity Management guidance requires banks to maintain DR environments at production parity; OCC cybersecurity guidance requires emergency security patches to be applied to all production-equivalent environments including DR within the same maintenance window.`,
    keywords: ['FFIEC', 'OCC', 'disaster recovery', 'core banking', 'security patching'],
    demoRelevant: false,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2130',
    name: 'Core Banking BCP Does Not Address Third-Party Fintech Integration Failure During DR Activation',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's core banking Business Continuity Plan covers internal platform failover but does not document the failure modes and recovery procedures for the 11 active fintech integrations — including BaaS partners, digital account opening, and FedNow connectivity — that will not automatically reconnect when the bank's core failover activates in the DR environment with a different API endpoint URL. During a DR test, the bank successfully activates its core banking DR environment but discovers that all 11 fintech integrations continue attempting to reach the primary production API endpoints, resulting in failed payments and account access errors that the BCP team cannot quickly resolve because the integration partner contact procedures are not included in the DR runbook. OCC Bulletin 2013-29 TPRM guidelines and FFIEC Business Continuity Management guidance require banks to incorporate third-party dependency failover into their BCP and to test partner reconnection procedures in full DR exercises.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC', 'business continuity', 'BaaS', 'FedNow'],
    demoRelevant: true,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2131',
    name: 'Core Banking Operational Resilience Stress Test Does Not Cover Cyber-Induced Data Corruption Scenario',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital conducts annual core banking resilience testing that includes hardware failure, network outage, and power loss scenarios; the testing programme does not include a scenario where a ransomware attack encrypts production core banking database files after corrupting the most recent backup snapshots — the scenario that OCC cybersecurity examination guidance and FFIEC Business Continuity Management guidelines identify as the most difficult and most likely severe disruption for financial institutions in the current threat environment. When the bank experiences a ransomware incident that corrupts both production and the immediately preceding backup snapshots, the recovery team must restore from a 72-hour-old backup and manually reconstruct 2 business days of transactions from paper records and branch system logs. The OCC expects banks to test for cyber-adversarial disruption scenarios, not just infrastructure failure scenarios, in their core banking resilience programmes.`,
    keywords: ['OCC', 'FFIEC', 'ransomware', 'core banking resilience', 'business continuity'],
    demoRelevant: true,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2132',
    name: 'Core Banking Platform Change Freeze Window Not Aligned With FedNow Settlement Certification Calendar',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital implements a 2-week core banking change freeze window around its DFAST submission period each March; the bank does not align this change freeze with the Federal Reserve FedNow service's annual certification testing calendar, which requires participant banks to complete connectivity and message format certification testing in a vendor-scheduled February window. A required FedNow certification update — needed to maintain instant payment participation — is blocked by the bank's core change freeze and cannot be deployed in February; the FedNow service logs the bank as non-certified and suspends the bank's ability to receive inbound instant payments for 3 weeks until a change freeze exception is approved. Federal Reserve FedNow operating rules require participants to complete annual certification updates within defined windows; bank change management policies that conflict with mandatory payment network certification calendars create payment service continuity risk.`,
    keywords: ['FedNow', 'Federal Reserve', 'DFAST', 'core banking', 'change management'],
    demoRelevant: true,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2133',
    name: 'Core Banking Platform Vendor Concentration Creates Single Point of Failure for Five Regional Banks',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital and four other regional OCC-chartered banks share the same cloud core banking SaaS platform on a multi-tenant deployment; a platform-level configuration deployment error affects all five banks simultaneously, creating a correlated outage that disrupts core banking operations for institutions with a combined $95B in assets during a peak Thursday payment processing window. The shared infrastructure failure is not covered by any individual bank's BCP because each bank's plan assumes vendor failures are isolated events; no bank has contractual rights to a dedicated infrastructure tier or to advance notice of multi-tenant changes. OCC's concentration risk guidance and FFIEC Business Continuity Management guidelines require banks to assess and document concentration risk in third-party providers; OCC Bulletin 2023-17 specifically calls out multi-tenant cloud platform concentration as an emerging systemic risk for community and regional banks.`,
    keywords: ['OCC', 'OCC Bulletin 2023-17', 'concentration risk', 'cloud core banking', 'TPRM'],
    demoRelevant: true,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2134',
    name: 'Core Banking Warm Standby Failover Requires Manual DNS Cutover Not Included in Crisis Runbook',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's core banking DR architecture uses a warm standby environment that can be activated in 4 hours; however, the DNS records pointing internal systems and customer-facing channels to the core banking API endpoints are managed by a third-party DNS provider and require manual login to the DNS management console to update — a step that is not documented in the crisis runbook because the DR architecture design team assumed DNS updates were automatic. When the DR activation is needed, the on-call infrastructure team spends 2 hours locating the DNS management credentials in a physical key safe that requires two-person access, extending the total recovery time from the design target of 4 hours to 6.5 hours. FFIEC Business Continuity Management guidance requires banks to document and test all manual steps in recovery procedures including DNS failover; recovery procedures that depend on undocumented manual steps consistently underperform their designed RTO targets.`,
    keywords: ['FFIEC', 'OCC', 'disaster recovery', 'DNS failover', 'core banking'],
    demoRelevant: false,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2135',
    name: 'Core Banking Platform Backup Retention Policy Does Not Satisfy BSA Transaction Reconstruction Requirement',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital configures its cloud core banking platform with a 30-day transaction log backup retention policy, which satisfies the platform vendor's recommended operational recovery window; however, BSA regulations require banks to maintain records of all fund transfers over $3,000 for 5 years, and the 30-day backup retention policy means transaction log data needed for BSA reconstruction purposes is not available from the backup system after day 30. When FinCEN issues a special measures information request referencing transactions from 8 months prior, the bank must reconstruct the transaction record from customer statement archives rather than system logs, creating a 22-day production delay that FinCEN flags as a potential compliance gap. BSA record retention rules under 31 CFR 1020 require wire transfer and transaction records to be retained for 5 years; backup retention policies for core banking platforms must be designed to meet the most demanding regulatory retention requirement, not the operational recovery window.`,
    keywords: ['BSA/AML', 'FinCEN', 'data retention', 'core banking', 'OCC'],
    demoRelevant: false,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2136',
    name: 'Core Banking Failover Test Does Not Include Regulatory Reporting Workload Validation',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital conducts semi-annual core banking DR failover tests that validate transaction processing, customer inquiry, and payment origination capabilities on the failover environment; the tests do not include execution of the DFAST data extract, HMDA LAR generation, or call report data production workloads because the DR test is scheduled during mid-month when these workloads are not normally run. When a DR activation is required during a quarter-end period, the bank discovers that the failover environment's regulatory reporting batch jobs fail due to incorrect file path configurations that were never corrected because the workloads had never been tested in DR. Federal Reserve DFAST guidelines and OCC call report examination procedures require banks to demonstrate that regulatory reporting capabilities are available and accurate in all operating environments; DR tests that exclude regulatory reporting workloads leave a material gap in resilience validation.`,
    keywords: ['DFAST', 'HMDA', 'OCC', 'disaster recovery', 'FFIEC'],
    demoRelevant: true,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2137',
    name: 'Core Banking Incident Communication Plan Does Not Include Reg E 10-Day Provisional Credit Trigger',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's core banking incident management process includes customer communication templates and stakeholder notification protocols, but does not trigger a Reg E provisional credit review when a core banking outage prevents customers from accessing their accounts or completing transactions for more than 2 business days. When a 52-hour core banking outage prevents 18,000 customers from completing ACH debits for mortgage and rent payments during a processing window, the bank's incident team focuses on recovery rather than Reg E implications. Reg E requires banks to provisionally credit disputed amounts within 10 business days; the CFPB's supervisory guidance on service outage impact assessment expects banks to proactively identify and remediate consumer harm caused by platform failures, including by issuing provisional credits where customer financial injury occurs. The bank receives 340 Reg E complaints and a CFPB supervisory letter for failure to address consumer harm during the outage.`,
    keywords: ['Reg E', 'CFPB', 'core banking outage', 'incident management', 'OCC'],
    demoRelevant: false,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2138',
    name: 'Core Banking Platform Geographic Redundancy Does Not Meet OCC Operational Resilience Expectations',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's cloud core banking platform is deployed with primary and warm standby environments in two cloud availability zones within the same geographic metro region; an OCC examination following a regional flood event that simultaneously affects both AZs finds that the bank's operational resilience design does not meet supervisory expectations for geographic diversity in critical financial infrastructure. The OCC's operational resilience guidance — aligned with Basel Committee on Banking Supervision principles for sound management of operational risk — expects systemically important functions such as core deposit processing and payment origination to have geographically diversified recovery capabilities that are resilient to regional disasters. The bank is required to remediate its core banking deployment architecture to use geographically separated regions, a $2.8M infrastructure re-architecture project.`,
    keywords: ['OCC', 'FFIEC', 'operational resilience', 'cloud core banking', 'geographic redundancy'],
    demoRelevant: true,
    subTopic: 'resilience-continuity',
  },
  {
    code: 'B2139',
    name: 'Core Banking Crisis Simulation Does Not Test Concurrent Payment System and Core Failure Scenario',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital conducts separate annual resilience exercises for core banking platform failures and for payment system (FedNow, SWIFT, ACH) disruptions, but never tests the concurrent failure of both — a scenario that the Federal Reserve's payment system risk guidance identifies as the most operationally stressful scenario for participating banks. When a vendor software defect simultaneously impacts the bank's core banking platform API performance and its FedNow connectivity adapter during the year-end settlement window, the crisis management team has no playbook for triaging two concurrent critical system incidents and allocating the bank's limited operations and technology staff across both workstreams simultaneously. FFIEC Business Continuity Management guidance requires banks to stress test for multiple concurrent operational failures in combined-scenario exercises; single-scenario annual testing leaves banks unprepared for correlated failure events that are predictable in complex, highly integrated technology environments.`,
    keywords: ['FFIEC', 'FedNow', 'OCC', 'business continuity', 'concurrent failure scenario'],
    demoRelevant: true,
    subTopic: 'resilience-continuity',
  },

];
