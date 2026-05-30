// seed-banking-dom12-data-governance-part3.ts
// Banking genome patterns — Data Governance & Data Management (part 3)
// Code range: B3520–B3579  (60 patterns)
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

export const BANKING_DOM12_DATA_GOVERNANCE_PART3_PATTERNS: PatternSeed[] = [

  // ── Data Architecture ────────────────────────────────────────────────────
  {
    code: 'B3520',
    name: 'Enterprise Data Model Not Updated After Commercial Loan Product Expansion',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's enterprise data model governs the canonical attribute definitions for the commercial lending domain but has not been updated to include the data elements introduced when the bank expanded into equipment finance and asset-based lending — leaving five new loan product types and 42 associated attributes defined only in the origination system's local data dictionary. DAMA-DMBOK enterprise data architecture standards and BCBS 239 data definition governance require that all material data elements used in risk reporting and financial accounting be defined in the enterprise data model, not in system-local documentation; when the finance team attempts to include equipment finance balances in the CECL model for the first time, the absence of enterprise model definitions for collateral type and amortization schedule attributes forces three weeks of manual data mapping that introduces definitional inconsistencies across the loan segmentation logic.`,
    keywords: ['enterprise data model', 'DAMA-DMBOK', 'BCBS 239', 'CECL', 'data architecture'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3521',
    name: 'Data Warehouse Conformed Dimension Architecture Abandoned During Cloud Migration',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's legacy data warehouse used conformed dimensions — shared, centrally governed dimension tables for customer, account, product, and geography — that ensured consistent metric definitions across all business intelligence reports; during the cloud data platform migration, the architecture team substituted individual team-managed dimension tables in each business domain's schema without reestablishing conformance governance, and within 18 months there are seven non-conformed customer dimension variants with differing deduplication logic. DAMA-DMBOK data warehouse architecture standards and BCBS 239 data aggregation principles require that shared dimensional data used in cross-domain reporting be governed through conformed dimensions; the proliferation of non-conformed dimensions means that customer segment counts, balances, and risk metrics from different business units cannot be aggregated without a reconciliation sprint, a fragmentation that OCC examiners identify when comparing risk appetite metric definitions across examination workpapers.`,
    keywords: ['conformed dimensions', 'DAMA-DMBOK', 'BCBS 239', 'data warehouse', 'cloud migration'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3522',
    name: 'Data Lake Schema Governance Absent — Raw Zone Data Used Directly in Regulatory Calculations',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's cloud data lake is organized into raw, curated, and consumption zones, but the data governance policy for zone access controls has not been enforced after the platform team was restructured, and five of the bank's model development teams are querying raw zone data directly for CECL and DFAST model inputs without passing through the curated zone where data quality controls, schema validation, and BCBS 239 lineage tagging are applied. BCBS 239 Principle 2 and OCC model risk management guidance require that model inputs used in regulatory capital calculations be sourced from governed, quality-tested data layers rather than raw ingestion zones; raw zone data that bypasses quality controls may contain schema changes from source system upgrades, encoding errors from new file formats, or null records not yet remediated, and models trained or run on such data generate regulatory capital estimates that cannot be certified as quality-controlled.`,
    keywords: ['data lake governance', 'BCBS 239', 'OCC guidance', 'data zone architecture', 'model risk'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3523',
    name: 'Reference Data Synchronization Latency Between Core Banking and Risk Systems',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's core banking system is the system of record for product codes, risk grade definitions, and collateral type reference tables, and these reference tables are synchronized to the credit risk aggregation platform on a nightly batch schedule; when the bank's credit risk team updates risk grade boundaries mid-cycle — which happens at every quarterly loan review — the risk platform uses the prior-batch reference data for the remainder of the day, causing intraday credit risk calculations to reference out-of-date grade definitions. BCBS 239 Principle 2 requires that risk aggregation systems use current reference data that reflects governance decisions at the time of calculation; a 24-hour reference data synchronization lag that spans quarterly loan review cycles produces risk calculations during the lag window that are based on superseded grade definitions, creating a BCBS 239 data accuracy gap in any regulatory report produced during that window.`,
    keywords: ['reference data', 'BCBS 239', 'core banking', 'synchronization latency', 'data architecture'],
    subTopic: 'data-architecture',
  },
  {
    code: 'B3524',
    name: 'Analytical Sandbox Environment Does Not Inherit Production Data Governance Metadata',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital provides model developers and analysts with a sandbox analytics environment that contains copies of production data for exploratory modeling, but the data governance metadata — data element definitions, quality scores, lineage documentation, and sensitivity classifications from the enterprise data catalog — is not propagated to the sandbox copies, leaving analysts working with data whose governance context is unknown. SR 11-7 model risk management guidance and BCBS 239 data documentation standards require that model developers have access to the data quality and lineage metadata for the data they use to train and validate models; without governance metadata in the sandbox, model developers cannot assess whether a dataset meets the quality standards required for regulatory model use, and models built on sandbox data without quality pedigree may be promoted to production without the data quality assessment SR 11-7 requires.`,
    keywords: ['analytical sandbox', 'SR 11-7', 'BCBS 239', 'data catalog', 'data architecture'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3525',
    name: 'Real-Time Payments Data Architecture Not Designed for BCBS 239 Intraday Liquidity Reporting',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's FedNow and RTP real-time payments processing infrastructure generates high-frequency transaction events that are routed to an event streaming platform for operational processing, but the data architecture does not extract and persist intraday liquidity position snapshots at the regulatorily relevant frequencies required for the Federal Reserve's intraday liquidity monitoring framework under Basel III. Federal Reserve supervisory guidance on intraday liquidity monitoring requires that systemically important banks maintain current, auditable records of intraday liquidity positions that can be reconstructed for examination; First Capital's event streaming architecture discards position snapshots after 72 hours without archiving them to the BCBS 239-governed data environment, making it impossible to reconstruct intraday liquidity positions for periods longer than three days when regulators request historical intraday analysis.`,
    keywords: ['FedNow', 'BCBS 239', 'intraday liquidity', 'real-time payments', 'data architecture'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3526',
    name: 'Data Contract Standards Not Established Between Producing and Consuming Teams',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital has adopted a data mesh architecture for its analytics platform, with domain teams owning and publishing data products for consumption by other teams, but the bank has not established data contract standards that define API schema stability guarantees, data quality SLAs, deprecation notice periods, and ownership accountability for each published data product. DAMA-DMBOK data architecture governance and BCBS 239 data lineage standards require that cross-team data dependencies be formally governed with documented contracts that establish the consuming team's right to rely on data quality and schema stability; without data contracts, the credit risk team's CECL model breaks when the retail banking domain team changes the schema of a deposit behavior dataset without notice, producing a model error that persists undetected for two weeks because the consuming team is not alerted to the upstream schema change.`,
    keywords: ['data contracts', 'data mesh', 'DAMA-DMBOK', 'BCBS 239', 'data architecture'],
    subTopic: 'data-architecture',
  },
  {
    code: 'B3527',
    name: 'Semantic Layer Not Maintained — Business Metric Definitions Diverge Across Reporting Tools',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital deployed a semantic layer on top of its cloud data platform to centralize metric definitions for net interest margin, loan-to-deposit ratio, and risk-weighted asset density, but the semantic layer has not been maintained as the underlying data model evolved, and business intelligence teams in the retail, commercial, and treasury lines of business have created local metric definitions in their departmental reporting tools that deviate from the semantic layer definitions. BCBS 239 data aggregation principles and DAMA-DMBOK business intelligence governance standards require that key performance and risk metrics be defined in a single governed location that all reporting tools derive from; when the CFO presents NIM figures that differ from those in the CRO's risk dashboard during a board meeting, the root cause investigation reveals seven competing NIM definitions in use across the bank's reporting environment, triggering a four-week metric governance remediation effort.`,
    keywords: ['semantic layer', 'BCBS 239', 'DAMA-DMBOK', 'metric definitions', 'data architecture'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3528',
    name: 'OLTP Reporting Queries Degrading Core Banking System Performance During Peak Hours',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's risk and compliance analysts run ad-hoc SQL queries directly against the core banking system's operational database to extract current-day position data for regulatory and management reporting, and during peak transaction processing hours these long-running analytical queries compete for database I/O resources with real-time customer transaction processing, causing transaction processing latency spikes of 400–800 milliseconds. OCC operational resilience guidance and FFIEC business continuity management requirements prohibit mixing OLTP and OLAP workloads on the core banking system in a manner that degrades transaction processing reliability; the absence of a read replica or analytical offload layer means that the bank's current-day risk reporting capability creates operational resilience risk for the core banking transaction processing function it depends on.`,
    keywords: ['OLTP vs OLAP', 'OCC guidance', 'FFIEC', 'core banking', 'data architecture'],
    subTopic: 'data-architecture',
  },
  {
    code: 'B3529',
    name: 'API Data Gateway Does Not Enforce Field-Level Data Governance Policies',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's enterprise API gateway routes data requests between internal applications and the core banking and risk data platforms but does not implement field-level governance policies — masking sensitive PII fields, enforcing data sensitivity classifications, or logging access to personally identifiable and nonpublic personal information — relying instead on application-layer controls in each consuming application. GLBA Safeguards Rule and OCC data governance examination expectations require that access controls for customer NPI be enforced at the infrastructure layer, not solely in application code; when a new internal analytics application is deployed without correctly implementing the application-layer PII masking, the API gateway has no compensating control to prevent the analytics environment from receiving and storing unmasked NPI, creating a GLBA Safeguards Rule access control gap.`,
    keywords: ['API gateway', 'GLBA Safeguards Rule', 'OCC guidance', 'PII masking', 'data architecture'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3530',
    name: 'Historical Data Archive Not Accessible for Model Backtesting Within SR 11-7 Required Timeframe',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital maintains historical transaction and exposure data archives on cold storage with a 72-hour retrieval time, but SR 11-7 model validation requirements call for backtesting models over a minimum historical window that includes at least one full credit cycle, requiring access to 10–12 years of historical loan performance data that currently requires a formal retrieval request and IT project work to make queryable. SR 11-7 model validation standards require that model developers and validators have efficient access to the historical data needed to backtest model performance across market and credit cycles; when the model risk team initiates validation of the bank's upgraded CECL model on a consent order deadline, the 72-hour archive retrieval process for the pre-2015 data compresses the validation window to the point where a full credit-cycle backtest cannot be completed within the examination timeline.`,
    keywords: ['SR 11-7', 'data archive', 'model backtesting', 'CECL', 'data architecture'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3531',
    name: 'Data Mesh Domain Ownership Boundaries Not Aligned to Regulatory Reporting Domains',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's data mesh architecture assigns data product ownership to business domains organized around customer segments — retail, commercial, and wealth management — but BCBS 239 regulatory reporting requires risk aggregation across those customer segment boundaries by risk type (credit, market, operational), creating a structural mismatch where no single domain team owns the cross-domain data integration required for regulatory capital calculations. BCBS 239 Principle 1 requires that risk data architectures support enterprise-wide aggregation across all material risk types and business lines; a data mesh ownership model aligned to business segments rather than regulatory reporting domains requires a cross-domain integration function that the mesh architecture does not natively provide, and the bank's DFAST production cycle relies on manual data assembly by the regulatory reporting team to bridge the domain ownership gap each quarter.`,
    keywords: ['data mesh', 'BCBS 239', 'DFAST', 'regulatory reporting', 'data architecture'],
    subTopic: 'data-architecture',
  },

  // ── Cloud Data Governance ────────────────────────────────────────────────
  {
    code: 'B3532',
    name: 'Cloud Data Egress Costs Not Modeled — BCBS 239 Reporting Latency Increases After Migration',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital migrated its regulatory reporting data platform to a multi-region cloud architecture, but the financial model for the migration did not account for the egress costs associated with moving risk data aggregates from the cloud data platform to the bank's on-premises regulatory submission infrastructure; when egress costs prove prohibitive, the data transfer frequency is reduced from hourly to overnight batch, adding 18 hours of reporting latency that the BCBS 239 timeliness requirements for intraday risk reporting do not accommodate. OCC cloud risk guidance (OCC 2023-17) and BCBS 239 data timeliness requirements expect that cloud architectures maintain the data availability and timeliness characteristics of the environments they replace; a cost-driven latency degradation that affects regulatory reporting timeliness is a cloud governance failure that OCC examiners treat as a third-party risk management and operational resilience finding.`,
    keywords: ['cloud egress', 'BCBS 239', 'OCC 2023-17', 'regulatory reporting latency', 'cloud data governance'],
    demoRelevant: true,
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3533',
    name: 'Cloud Data Residency Controls Not Verified for Customer NPI in Multi-Tenant SaaS Platform',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's cloud-based loan origination SaaS platform contractually commits to storing customer NPI in US-based data centers, but the bank's cloud data governance program has not implemented technical controls that independently verify data residency — relying solely on the vendor's contractual representations without automated monitoring of where customer data is physically stored. GLBA Safeguards Rule and OCC 2013-29 third-party risk management guidance require that banks independently verify that service providers comply with data residency and sovereignty commitments rather than relying solely on contractual representations; when the bank's TPRM team conducts a technical audit of the SaaS platform, they discover that backup data is replicated to a European disaster recovery region without the bank's contractual consent, creating a GLBA Safeguards Rule data transfer violation.`,
    keywords: ['cloud data residency', 'GLBA Safeguards Rule', 'OCC 2013-29', 'SaaS governance', 'cloud data governance'],
    demoRelevant: true,
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3534',
    name: 'Shared Responsibility Model Misunderstanding Leaves Cloud Database Encryption Ungoverned',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's cloud deployment team assumes that the cloud provider's platform-level encryption satisfies the bank's GLBA Safeguards Rule encryption requirements for data at rest, not recognizing that the shared responsibility model places application-level encryption key management — including rotation schedules, HSM custody, and key access audit logging — under the bank's responsibility; as a result, customer NPI stored in cloud databases is encrypted but encryption keys are managed by the cloud provider's default key management service without the bank-controlled key rotation and access logging that GLBA requires. GLBA Safeguards Rule Section 314.4(e) and OCC cloud risk examination expectations require that encryption controls for customer NPI — including key management — be under the bank's governance and not delegated entirely to the cloud provider; the key management gap is identified during an OCC information security examination as a Safeguards Rule compliance deficiency that requires the bank to implement customer-managed encryption keys within 90 days.`,
    keywords: ['cloud encryption', 'GLBA Safeguards Rule', 'OCC guidance', 'key management', 'cloud data governance'],
    demoRelevant: true,
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3535',
    name: 'Cloud Data Classification Policy Not Applied to Unstructured Data in Object Storage',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's data classification policy assigns sensitivity tiers to structured database fields and applies access controls and encryption standards based on tier, but the policy has not been extended to cover unstructured data in the bank's cloud object storage — which contains scanned loan documents, customer correspondence images, and recorded voice files that include customer NPI classified as nonpublic personal information under GLBA. GLBA Safeguards Rule and OCC data governance examination standards require that data classification and protection controls apply to all formats in which customer NPI is stored, including unstructured documents and media files; the absence of classification metadata on object storage assets means that the bank's data loss prevention, retention enforcement, and deletion rights programs have no mechanism to identify or govern NPI in the unstructured data estate.`,
    keywords: ['data classification', 'GLBA Safeguards Rule', 'OCC guidance', 'object storage', 'cloud data governance'],
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3536',
    name: 'Cloud Cost Optimization Deletes Data Needed for BCBS 239 Long-Term Trend Analysis',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's cloud FinOps program implements automated lifecycle policies that move infrequently accessed data to low-cost cold storage after 90 days and delete data that has not been accessed for 24 months to optimize cloud storage costs; these lifecycle policies are applied uniformly across all cloud data assets including regulatory risk reporting history tables that BCBS 239 data retention standards and OCC examination documentation requirements mandate be retained for a minimum of seven years. OCC examination documentation requirements and BCBS 239 Principle 8 require that risk reporting data be retained for periods sufficient to support supervisory review of historical trends and to defend regulatory submissions; automated deletion of DFAST historical data before the seven-year retention minimum creates a regulatory documentation gap that an OCC examiner requests reconstruction of — which is impossible because the data has been permanently deleted.`,
    keywords: ['BCBS 239', 'OCC guidance', 'data retention', 'cloud FinOps', 'cloud data governance'],
    demoRelevant: true,
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3537',
    name: 'Cloud Data Governance Tool Configuration Misaligns With On-Premises Data Catalog Definitions',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital deployed a cloud-native data governance platform alongside its existing on-premises enterprise data catalog, creating a hybrid governance environment where cloud data assets are catalogued in the cloud tool and on-premises data assets remain in the legacy catalog; the two tools use different metadata schemas, sensitivity classification vocabularies, and data quality dimension definitions, making cross-environment data lineage reconstruction and unified quality reporting impossible. BCBS 239 data lineage governance and DAMA-DMBOK data catalog management standards require end-to-end lineage traceability across all environments in the data production pipeline; when the regulatory reporting data flow spans both on-premises source systems and cloud transformation layers, the broken lineage at the cloud-to-on-premises boundary prevents the bank from demonstrating continuous BCBS 239-compliant lineage to Federal Reserve examiners.`,
    keywords: ['data catalog', 'BCBS 239', 'DAMA-DMBOK', 'hybrid cloud governance', 'cloud data governance'],
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3538',
    name: 'Cloud Infrastructure Provisioning Bypasses Data Governance Review for New Analytics Workloads',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's cloud platform enables self-service infrastructure provisioning for analytics workloads through an internal developer portal, but the provisioning workflow does not include a mandatory data governance review checkpoint that ensures new analytics environments are registered in the enterprise data catalog, have appropriate data classification and access controls, and do not create new NPI storage locations outside the bank's GLBA Safeguards Rule data inventory. OCC data governance and GLBA Safeguards Rule asset management requirements expect that all new environments hosting customer data be captured in the bank's data inventory before going live; self-service provisioning without a governance gate has produced 23 unregistered cloud analytics environments over 18 months that collectively host customer NPI outside the bank's documented data governance perimeter.`,
    keywords: ['cloud self-service', 'GLBA Safeguards Rule', 'OCC guidance', 'data governance', 'cloud data governance'],
    demoRelevant: true,
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3539',
    name: 'Multi-Cloud Strategy Creates Data Sovereignty Gaps for Regulatory Reporting Data',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's technology team independently selected different cloud providers for the core banking analytics platform (AWS), the loan origination system (Azure), and the compliance monitoring platform (Google Cloud), creating a multi-cloud environment where regulatory reporting data flows cross three cloud provider boundaries with different data sovereignty controls, API governance frameworks, and audit logging capabilities. OCC 2023-17 third-party risk management guidance and BCBS 239 data governance standards require that data flows across all environments be subject to consistent governance and that the bank maintain visibility into data location and processing across its entire technology estate; the multi-cloud fragmentation means that the bank cannot produce a unified data lineage map for any regulatory report that draws inputs from more than one cloud platform, a gap that the OCC flags as a third-party concentration risk and data governance deficiency.`,
    keywords: ['multi-cloud', 'OCC 2023-17', 'BCBS 239', 'data sovereignty', 'cloud data governance'],
    demoRelevant: true,
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3540',
    name: 'Cloud Data Backup Restoration Not Tested Against BCBS 239 Recovery Time Objectives',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's cloud data platform backup strategy generates daily snapshots of all regulatory reporting data with a contractual recovery time objective of 4 hours, but the bank has not conducted a full backup restoration test against the BCBS 239 reporting environment in 14 months, and no test has validated that the restored data environment includes all BCBS 239-required lineage documentation, quality certifications, and metadata that are stored in separate governance system tables not included in the primary data backup scope. BCBS 239 Principle 4 operational resilience requirements and OCC business continuity guidance require that recovery testing validate the recoverability of the complete regulatory reporting environment, including governance metadata, not only the primary data tables; a restoration that recovers data without governance metadata produces a regulatory reporting environment that cannot be certified as BCBS 239-compliant until the governance metadata is separately reconstructed.`,
    keywords: ['BCBS 239', 'OCC guidance', 'backup restoration', 'operational resilience', 'cloud data governance'],
    subTopic: 'cloud-data-governance',
  },
  {
    code: 'B3541',
    name: 'Cloud Access Control Sprawl — Excessive IAM Permissions on Regulatory Data Assets',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's cloud IAM configuration for regulatory data assets — DFAST model inputs, CCAR submission data, and BCBS 239 critical data element stores — has accumulated excessive permissions through a pattern of granting broad roles to expedite project delivery without subsequent access reviews, with 62% of IAM principal assignments having permissions that exceed the principle of least privilege for the function the principal serves. OCC information security examination guidance and GLBA Safeguards Rule access control requirements mandate that access to customer NPI and regulatory data assets be governed by least-privilege principles with regular access recertification; excessive IAM permissions on regulatory data assets create both a data breach risk and a BCBS 239 data integrity risk, as over-permissioned service accounts can modify regulatory data in ways that do not pass through the bank's data governance controls.`,
    keywords: ['IAM permissions', 'GLBA Safeguards Rule', 'OCC guidance', 'cloud access control', 'cloud data governance'],
    demoRelevant: true,
    subTopic: 'cloud-data-governance',
  },

  // ── Data Ethics ─────────────────────────────────────────────────────────
  {
    code: 'B3542',
    name: 'Credit Model Proxies for Protected Class Characteristics Not Governed Under Fair Lending Review',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's credit underwriting models use behavioral and transactional features — including shopping patterns inferred from merchant category codes, mobility indicators derived from ATM usage geography, and social network proxies from co-signers — that are correlated with race, national origin, and familial status without being subject to the bank's fair lending adverse impact review process, because the features are classified as behavioral variables rather than demographic indicators. CFPB ECOA guidance and the Federal Reserve's fair lending supervisory expectations require that all model features used in credit decisions be evaluated for disparate impact against ECOA-protected classes, including indirect proxies; the absence of a fair lending review gate in the model feature approval process means that proxy features correlated with protected class characteristics are incorporated into production credit models without disparate impact assessment, creating ECOA and Equal Credit Opportunity Act liability.`,
    keywords: ['ECOA', 'CFPB', 'fair lending', 'disparate impact', 'data ethics'],
    demoRelevant: true,
    subTopic: 'data-ethics',
  },
  {
    code: 'B3543',
    name: 'Customer Behavioral Data Repurposed Beyond Original Consent Without New Notice',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's mobile banking application collects behavioral interaction data — screen navigation patterns, feature usage frequency, and session timing — with a privacy notice disclosing that the data is used to improve application performance; the bank's data science team subsequently uses this behavioral data as input features for a credit risk pre-screening model that influences which customers are offered credit products, a use case not covered by the original privacy notice. GLBA Privacy Rule and CFPB's consumer protection examination framework require that financial institutions honor the use limitations implied by their privacy notices and provide updated notice before materially expanding the use of customer data; using app behavioral data to influence credit pre-screening without notice updates constitutes a secondary use of data beyond original consent that CFPB examination staff classify as an unfair, deceptive, or abusive act or practice under the Consumer Financial Protection Act.`,
    keywords: ['GLBA', 'CFPB', 'data repurposing', 'consumer consent', 'data ethics'],
    demoRelevant: true,
    subTopic: 'data-ethics',
  },
  {
    code: 'B3544',
    name: 'Data Science Team Has No Ethics Review Process for Models With Disparate Community Impact',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's model development lifecycle includes technical validation, SR 11-7 documentation review, and business approval, but does not include a structured data ethics review that assesses whether models that affect credit access, pricing, or service availability in geographic communities could have disparate community impact through patterns of data representation bias or historically discriminatory data sources. CFPB CRA examination criteria and OCC fair lending supervisory guidance increasingly evaluate whether banks have internal governance processes that identify and address community-level disparate impact in the design of credit and service access models; the absence of a data ethics review function means that the bank's digital banking model for branch-free online account opening, which uses address-level risk features correlated with majority-minority community status, is deployed without a disparate community impact assessment.`,
    keywords: ['data ethics', 'CFPB', 'CRA', 'fair lending', 'model governance'],
    demoRelevant: true,
    subTopic: 'data-ethics',
  },
  {
    code: 'B3545',
    name: 'Customer Financial Hardship Data Used in Deposit Pricing Without Ethical Use Policy',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's treasury management team uses deposit pricing optimization models that incorporate customer financial distress indicators — overdraft frequency, low balance alerts, and NSF history — to segment customers into price sensitivity tiers and offer lower interest rates to customers identified as less likely to move deposits, effectively using data about customers in financial hardship to extract higher net interest margin from them. CFPB supervision of unfair, deceptive, or abusive acts and practices and OCC consumer protection examination guidelines evaluate whether banks use customer vulnerability data in a manner that exploits rather than protects financially distressed customers; using financial hardship signals in deposit pricing to offer lower rates to vulnerable customers can constitute an abusive practice under the Consumer Financial Protection Act's UDAAP standard, and the bank has no ethical use policy that evaluates whether uses of vulnerability data in pricing models meet consumer protection standards.`,
    keywords: ['CFPB UDAAP', 'OCC guidance', 'deposit pricing', 'financial hardship data', 'data ethics'],
    demoRelevant: true,
    subTopic: 'data-ethics',
  },
  {
    code: 'B3546',
    name: 'Synthetic Data Generation for Model Training Inherits Bias From Source Data Without Audit',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's model development team uses synthetic data generation to augment training datasets for credit underwriting models, generating synthetic borrower records that statistically mirror the distribution of the historical loan portfolio; because the historical portfolio reflects lending patterns from years when the bank had documented fair lending issues, the synthetic data inherits and amplifies the bias patterns present in the source data, producing training data that reinforces historical discrimination without the explicit training data containing any protected class attributes. SR 11-7 model documentation standards and CFPB fair lending supervision guidance require that training data composition be evaluated for representational bias before use in credit models; synthetic data that inherits historical bias is not neutral augmentation data — it is a mechanism for encoding and scaling historical discriminatory patterns in a form that obscures the bias source and makes disparate impact attribution more difficult for regulators.`,
    keywords: ['synthetic data', 'SR 11-7', 'CFPB', 'fair lending', 'data ethics'],
    subTopic: 'data-ethics',
  },
  {
    code: 'B3547',
    name: 'Employee Data Analytics Program Lacks Governance for Workforce Surveillance Boundaries',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's HR analytics team has deployed an employee productivity monitoring tool that collects application usage data, email response time metrics, and collaboration tool activity to generate workforce engagement and productivity scores used in performance review calibration; the tool's data collection scope has expanded over time without a formal governance review of what employee monitoring is permissible under the bank's HR policies, employment contracts, and applicable state employee privacy laws. California CPRA employment privacy provisions and state-level employee monitoring disclosure laws require that employers disclose the scope and purpose of employee monitoring before deploying surveillance tools; the absence of a governance framework for employee data analytics creates disclosure compliance gaps for California-based employees and exposes the bank to employment privacy litigation risk from workers whose activity is monitored in ways that were not disclosed at the time of hire.`,
    keywords: ['employee data', 'CCPA/CPRA', 'workforce surveillance', 'HR analytics', 'data ethics'],
    subTopic: 'data-ethics',
  },
  {
    code: 'B3548',
    name: 'Third-Party Data Broker Enrichment of Customer Profiles Not Disclosed in Privacy Notice',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's marketing personalization program enriches customer profiles with demographic and lifestyle data purchased from third-party data brokers — income estimates, life event signals, and property ownership indicators — and uses this enriched data to target credit product offers; the bank's GLBA privacy notice discloses that the bank collects information from credit reporting agencies but does not disclose the use of non-credit data broker enrichment that adds inferred demographic attributes to customer profiles. GLBA Privacy Rule notice requirements and CFPB fair lending examination guidance require that privacy notices accurately disclose the sources of information used in decisions that affect credit access and pricing; using undisclosed data broker enrichment in credit marketing targeting creates GLBA notice accuracy violations and a fair lending risk if the broker-enriched demographic inferences serve as proxies for protected characteristics in credit offer targeting.`,
    keywords: ['GLBA', 'CFPB', 'data broker enrichment', 'privacy notice', 'data ethics'],
    demoRelevant: true,
    subTopic: 'data-ethics',
  },
  {
    code: 'B3549',
    name: 'Data Ethics Framework Not Referenced in Vendor AI Procurement Evaluation Criteria',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's TPRM vendor evaluation framework assesses AI vendors on SR 11-7 model validation documentation, data security controls, and SLA compliance, but does not include evaluation criteria that assess the vendor's data ethics practices — including bias testing methodology, fairness metrics used in model validation, and the vendor's policy for handling discriminatory outcome patterns discovered post-deployment. OCC model risk examination standards and CFPB vendor oversight guidance require that banks evaluate third-party AI vendors on the ethical dimensions of model design and deployment as part of due diligence; when the bank deploys a vendor-provided AI-driven credit line management tool without evaluating the vendor's fairness testing practices, and the tool subsequently generates a pattern of disproportionate credit line reductions in majority-minority zip codes, the bank is held accountable for the disparate impact under ECOA regardless of the vendor's contractual responsibility for model design.`,
    keywords: ['AI vendor evaluation', 'CFPB', 'ECOA', 'OCC guidance', 'data ethics'],
    demoRelevant: true,
    subTopic: 'data-ethics',
  },

  // ── AI & Data Governance Part 3 ─────────────────────────────────────────
  {
    code: 'B3550',
    name: 'AI Deposit Retention Model Trained on Attrition Labels That Include Regulatory Holds',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's AI deposit retention model is trained on historical attrition labels that classify account closures as voluntary churn without filtering out closures attributable to regulatory holds, fraud-driven account terminations, and compliance-ordered account closures — embedding non-voluntary closure events as positive training examples of churn in a model intended to identify voluntary departure risk. SR 11-7 model risk management and BCBS 239 training data quality standards require that AI model training labels accurately represent the phenomenon the model is designed to predict; a retention model trained on contaminated attrition labels generates false churn risk signals for customers who closed accounts under regulatory duress rather than competitive pressure, causing the bank to direct retention incentives to a customer segment that has no voluntary departure risk, undermining the model's business value and its SR 11-7 model purpose documentation.`,
    keywords: ['SR 11-7', 'AI deposit retention', 'BCBS 239', 'model training labels', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3551',
    name: 'GenAI Loan Covenant Monitoring Without Verified Financial Statement Data Linkage',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's commercial lending team deploys a GenAI tool that monitors borrower covenant compliance by parsing the financial statements uploaded to the loan servicing platform and extracting the metrics relevant to each loan's covenant definitions; the tool extracts covenant metrics without verifying that the financial statements from which it extracts are the audited versions required by the loan agreement, accepting unaudited management accounts and generating compliance assessments based on data that may not meet the financial reporting standard specified in the credit agreement. SR 11-7 model risk and OCC credit risk examination guidance require that automated covenant monitoring tools incorporate data quality controls that verify the source and audit status of financial data before generating compliance determinations; covenant assessments based on management accounts rather than audited financials can produce false compliance certifications for borrowers in financial distress who submit preliminary unaudited figures that differ materially from the audited outcomes.`,
    keywords: ['GenAI covenant monitoring', 'SR 11-7', 'OCC guidance', 'financial statement data', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3552',
    name: 'AI Collateral Valuation Model Drift Not Detected Due to Stale Benchmark Data Feed',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital uses an AI automated valuation model for commercial real estate collateral that is calibrated against a market benchmark data feed updated quarterly; during a period of rapid commercial real estate market stress, the 90-day benchmark refresh cycle leaves the AVM using benchmark values that are 8–15% above current market prices, causing the model to systematically overstate collateral values during the market dislocation and underreporting collateral coverage shortfalls in the bank's credit risk reporting. SR 11-7 ongoing model monitoring requirements and OCC credit risk examination guidance require that AI models with market-sensitive inputs be monitored for performance degradation during periods of market stress and that benchmark data feeds be assessed for currency relative to market conditions; a quarterly refresh cadence calibrated for stable markets creates systematic overvaluation risk during market stress that is not detected until the bank's external auditor requests an independent collateral appraisal reconciliation.`,
    keywords: ['AI AVM', 'SR 11-7', 'OCC guidance', 'collateral valuation', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3553',
    name: 'AI Customer Segment Profiling Model Produces Differential Service Recommendations by Demographics',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital deploys an AI-powered customer relationship management tool that segments customers into service tier recommendations — determining the level of proactive outreach, product advisory, and relationship manager attention each customer receives — using features that correlate with race and national origin through zip code-level demographic proxies and language preference signals. CFPB CRA examination standards and OCC fair lending supervisory guidance require that service access and relationship management intensity not be differentiated by protected class characteristics or their proxies; an AI service segmentation model that systematically assigns lower service tier recommendations to customers in majority-minority communities or non-English language preference segments creates a disparate service impact that CFPB examiners treat as an ECOA and CRA service test violation when the pattern is identified through geographic fair lending analysis of customer contact data.`,
    keywords: ['AI customer segmentation', 'CFPB', 'ECOA', 'CRA', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3554',
    name: 'LLM Compliance Q&A Tool Hallucinates Regulatory Threshold Values',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's compliance operations team uses a Retrieval Augmented Generation LLM tool to answer regulatory questions from front-line staff — providing quick answers about Reg E dispute timeframes, BSA currency transaction report thresholds, and OFAC screening requirements — but the tool's retrieval corpus includes outdated regulatory text and the LLM occasionally generates specific threshold figures that are plausible but incorrect, such as stating a $10,500 CTR threshold when the actual Bank Secrecy Act threshold is $10,000. OCC BSA/AML examination standards and the Federal Reserve's model risk principles under SR 11-7 require that AI tools providing compliance guidance to bank staff be validated for factual accuracy and include disclaimers directing staff to authoritative source documents for compliance-critical figures; compliance staff who rely on an LLM-hallucinated CTR threshold without verification are exposed to BSA reporting violations that the OCC treats as evidence of inadequate BSA/AML program controls.`,
    keywords: ['LLM compliance tool', 'SR 11-7', 'BSA/AML', 'OCC guidance', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3555',
    name: 'AI Treasury Cash Flow Forecasting Model Not Validated Against Intraday Liquidity Regime',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an AI cash flow forecasting model for treasury liquidity management that is validated against end-of-day cash position accuracy but not against intraday peak liquidity demand, which the Federal Reserve's intraday liquidity monitoring framework requires large banks to measure separately from daily position forecasting. Federal Reserve intraday liquidity supervision guidance and BCBS 239 liquidity data requirements expect that AI tools supporting liquidity management be validated against the specific temporal resolution and stress scenario requirements of the applicable regulatory framework; an AI forecast model calibrated on end-of-day accuracy can perform well on daily position targets while systematically under-predicting peak intraday outflows during high-value payment processing windows — a failure mode that only surfaces when the bank experiences an intraday funding shortfall during peak RTP/FedNow settlement windows.`,
    keywords: ['AI treasury forecasting', 'BCBS 239', 'Federal Reserve', 'intraday liquidity', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3556',
    name: 'AI-Generated Regulatory Report Commentary Not Reviewed by Business Owner Before Submission',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital uses an AI tool to draft the management commentary and explanatory narrative sections of quarterly regulatory reports — FR Y-9C transmittal letters, HMDA annual report explanations, and Call Report supplemental notes — with drafts reviewed by the regulatory reporting team for grammatical accuracy but not reviewed by the business owners responsible for the facts described in the commentary. FFIEC regulatory reporting governance and OCC examination standards require that regulatory report commentary be certified by the officials accountable for the activities described; AI-generated commentary that is not business-owner reviewed can contain factual inaccuracies about the bank's operations, risk management actions, or regulatory compliance posture that the regulatory reporting team lacks the subject matter expertise to identify, creating a risk of materially inaccurate regulatory submissions signed by officers who have not verified the accuracy of the AI-generated content.`,
    keywords: ['AI regulatory commentary', 'FFIEC', 'OCC guidance', 'FR Y-9C', 'AI data governance'],
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3557',
    name: 'AI CECL Segmentation Tool Reassigns Loans Across Pools Without SR 11-7 Change Management',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital uses an AI-powered loan segmentation tool that dynamically reassigns loans to CECL model pools based on updated behavioral attributes, and the tool's auto-segmentation logic operates on a monthly cycle that produces loan pool reassignments between quarters without a formal SR 11-7 model change approval process — effectively making material changes to CECL model inputs through an automated process that bypasses the bank's model governance framework. SR 11-7 model risk management guidance and ASC 326 CECL governance expectations require that changes to model segmentation logic that materially affect the allowance calculation be documented, approved by the model risk committee, and disclosed in the CECL model change log; undisclosed automated segmentation changes between quarters create a CECL model governance gap that the bank's internal audit function identifies when it compares the quarter-end loan pool compositions and cannot reconcile the reassignments to any approved model change.`,
    keywords: ['SR 11-7', 'CECL', 'AI segmentation', 'ASC 326', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3558',
    name: 'AI Relationship Banker Assistant Stores Customer Conversation Data Outside GLBA Perimeter',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's commercial banking team deploys an AI relationship banker assistant that captures, summarizes, and stores relationship call notes and customer meeting records in the AI vendor's cloud environment to enable contextual follow-up recommendations; the vendor's cloud storage environment is not subject to the bank's GLBA Safeguards Rule data governance controls, is not included in the bank's TPRM data processing agreement review, and has not been assessed for data residency compliance under the bank's NPI storage standards. OCC 2013-29 third-party risk management guidance and GLBA Safeguards Rule Section 314.4(f) require that service providers handling customer NPI be contractually bound to appropriate safeguards and that the bank assess the adequacy of those safeguards; when the AI vendor experiences a data breach affecting its cloud storage, customer call records containing commercial loan discussions and financial planning details for 1,400 commercial customers are exposed, creating a GLBA Safeguards Rule incident notification obligation.`,
    keywords: ['AI banker assistant', 'GLBA Safeguards Rule', 'OCC 2013-29', 'customer data storage', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3559',
    name: 'AI Fraud Scoring Model Performance Degrades After Real-Time Payments Volume Surge Without Retraining',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI fraud detection model for real-time payments was trained on historical ACH and wire fraud patterns but has not been retrained since the bank's FedNow transaction volume increased tenfold over 12 months; the model was not trained on the specific fraud typologies — refund fraud, account takeover via one-time passcode interception, and business email compromise payment redirection — that dominate the FedNow fraud landscape because those patterns were underrepresented in the pre-FedNow training corpus. SR 11-7 ongoing model monitoring requirements and the OCC's payments fraud risk examination expectations require that AI fraud models be retrained or recalibrated when the transaction mix or fraud typology landscape changes materially; the model's precision rate on FedNow transactions is 43% — generating 57% false positive blocks — and its recall rate is 61%, leaving 39% of actual fraud undetected on the bank's fastest-growing and highest-risk payment rail.`,
    keywords: ['AI fraud scoring', 'FedNow', 'SR 11-7', 'OCC guidance', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3560',
    name: 'AI ESG Scoring Tool for Commercial Borrowers Uses Unverified Self-Reported Emissions Data',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's climate risk management program uses an AI ESG scoring tool to assess commercial borrowers' climate transition risk, with the tool generating sector-adjusted emissions intensity scores from borrower-provided climate disclosures; the tool does not apply data quality controls to distinguish between verified third-party-audited emissions data and unverified self-reported estimates, treating both input sources as equally reliable in the AI-generated transition risk scores that feed the bank's climate-adjusted credit risk model. Federal Reserve SR 23-8 climate risk management guidance and OCC climate risk principles require that climate risk data used in risk modeling be assessed for quality and reliability, with appropriate uncertainty discounting applied to unverified data; AI ESG scores derived from unverified self-reported data create a false precision in climate-adjusted credit metrics that OCC climate risk examiners identify as a governance deficiency in the bank's transition risk measurement framework.`,
    keywords: ['AI ESG scoring', 'SR 23-8', 'OCC guidance', 'climate risk data', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3561',
    name: 'AI Onboarding Identity Verification Tool Fails Disproportionately for Non-Western Name Formats',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital deploys an AI identity document verification tool in its digital onboarding flow that uses computer vision to extract and verify name fields from identity documents; the tool fails to correctly parse name formats common in East Asian, South Asian, and Arabic naming conventions — where given and family name order differs from Western convention — producing identity verification failures for 34% of applicants with non-Western name formats versus 3% for Western name format documents. CFPB ECOA and the OCC's fair lending examination guidance require that digital onboarding tools not create artificial barriers to credit access that disproportionately affect applicants based on national origin; differential verification failure rates that correlate with national origin-associated name formats constitute a disparate impact in the credit application process that CFPB examiners treat as an ECOA Regulation B fair lending finding regardless of the technical nature of the underlying AI accuracy gap.`,
    keywords: ['AI identity verification', 'ECOA', 'CFPB', 'fair lending', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3562',
    name: 'AI Regulatory Change Detection Tool Misses State-Level Banking Law Amendments',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital uses an AI regulatory change detection tool to monitor and classify regulatory changes requiring compliance program updates, but the tool's monitoring scope is configured to track federal banking regulators — OCC, Federal Reserve, CFPB, FinCEN — and does not cover the 12 state banking departments in the states where the bank operates, missing state-level consumer protection amendments, data privacy legislation, and money transmission rule changes that impose compliance obligations on the bank. OCC examination standards require that banks maintain awareness of their full regulatory environment including state banking law, and the bank's compliance program governance expects that regulatory change monitoring cover all applicable jurisdictions; when a state consumer financial protection agency issues a data governance rule for financial institutions that significantly expands data subject rights beyond CCPA requirements, the bank's AI tool does not detect it, and the bank misses the compliance implementation deadline.`,
    keywords: ['AI regulatory monitoring', 'OCC guidance', 'state banking law', 'CCPA/CPRA', 'AI data governance'],
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3563',
    name: 'AI Data Catalog Tagging Tool Creates Inaccurate Sensitivity Classifications at Scale',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an AI-powered automated data catalog tagging tool to classify data asset sensitivity across its cloud data platform, with the tool applying GLBA NPI, PCI DSS cardholder data, and general business sensitivity tags based on pattern matching and NLP analysis of field names and sample values; the tool classifies 8.4% of assets incorrectly — primarily miscategorizing encrypted NPI as non-sensitive based on the absence of recognizable PII patterns in the encrypted values and misidentifying business-internal risk model parameters as NPI. GLBA Safeguards Rule data classification requirements and OCC information security examination standards require that data classification be accurate as the foundation for access controls, encryption standards, and retention enforcement; AI tagging errors that misclassify NPI as non-sensitive cause the misclassified assets to receive lower access control and encryption standards than GLBA requires, creating a systematic Safeguards Rule compliance gap in the proportion of the data estate where the AI tool is trusted without human verification.`,
    keywords: ['AI data catalog', 'GLBA Safeguards Rule', 'OCC guidance', 'data classification', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3564',
    name: 'AI-Driven DFAST Sensitivity Analysis Produces Scenario Results Outside Regulatory Severity Bounds',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's capital planning team uses an AI-enhanced DFAST sensitivity analysis tool that generates internally developed adverse scenarios by perturbing the Federal Reserve's published severely adverse scenario along dimensions identified as most sensitive by the AI's scenario generation model; the AI-generated sensitivity paths repeatedly produce GDP contraction depths of negative 10–12% that exceed the Federal Reserve's maximum severity guidance for internal stress scenarios, resulting in capital depletion calculations that overstate capital vulnerability relative to regulatory expectations. Federal Reserve DFAST guidance and OCC capital planning examination standards require that internally developed stress scenarios be designed within a severity framework that is coherent with the regulatory scenario space; AI-generated scenarios that systematically exceed the regulatory severity envelope cannot be directly used in capital plan submissions and require manual adjustment, adding a review and recalibration step to every DFAST cycle that the bank's consent order timeline does not accommodate.`,
    keywords: ['DFAST', 'AI scenario generation', 'Federal Reserve', 'capital planning', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3565',
    name: 'AI Credit Approval Assistant Cites Stale Policy Version When Rendering Approval Guidance',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an AI credit approval assistant that provides guidance to commercial loan underwriters on policy conformance — flagging exceptions, suggesting approval conditions, and summarizing relevant credit policy requirements — but the assistant's knowledge base is updated only when IT releases a new tool version, with a 4–6 month lag between credit policy updates and the assistant's knowledge base reflecting those updates. SR 11-7 model risk and OCC credit risk examination standards require that AI tools providing guidance on credit policy compliance be based on the current approved version of credit policy; an AI assistant citing superseded policy requirements misguides underwriters on exception approval criteria, causing approval conditions to be documented against outdated standards that do not satisfy the bank's current credit risk appetite, producing loan approvals that the bank's independent credit review function subsequently classifies as policy exceptions that were not properly recognized as such at origination.`,
    keywords: ['SR 11-7', 'AI credit assistant', 'OCC guidance', 'credit policy', 'AI data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-part3',
  },
  {
    code: 'B3566',
    name: 'AI Data Quality Remediation Applies Automated Corrections Without Human Escalation for Edge Cases',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's AI-driven data quality remediation system automatically corrects data quality exceptions in the regulatory reporting pipeline — standardizing date formats, imputing industry standard codes for blank reference fields, and correcting transposition errors in account numbers — without routing ambiguous edge cases to human data stewards for review, applying the AI's best-guess correction even when the confidence score for the correction falls below 70%. BCBS 239 Principle 3 data accuracy standards and DAMA-DMBOK data quality governance require that automated data corrections be subject to human oversight when the correction confidence is below acceptable thresholds, and that all corrections applied to critical data elements used in regulatory reporting be documented in the data lineage record; a remediation system that applies low-confidence automated corrections without human escalation creates a population of regulatory data corrections that are not traceable to a verified source, producing BCBS 239 data accuracy attestation risk.`,
    keywords: ['AI data remediation', 'BCBS 239', 'DAMA-DMBOK', 'data quality automation', 'AI data governance'],
    subTopic: 'ai-data-part3',
  },

  // ── Open Data & APIs ─────────────────────────────────────────────────────
  {
    code: 'B3567',
    name: 'Open Banking API Rate Limits Not Configured to Prevent Data Harvesting by Aggregators',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's consumer-permissioned data sharing APIs — implemented under the CFPB's Section 1033 open banking framework — do not enforce rate limits, scope restrictions, or session duration controls that would prevent authorized data aggregators from performing continuous background polling at frequencies that harvest transaction data beyond the customer-permitted use case and store historical transaction data in the aggregator's own systems. CFPB Section 1033 rulemaking and the bank's open banking API governance framework require that customer-permissioned data sharing be scoped to the specific use case and temporal window for which the customer granted access, with technical controls preventing access scope creep; aggregators that exploit the absence of rate and scope controls to build proprietary customer transaction datasets using open banking APIs have access to customer financial data far beyond what the customer authorized, creating GLBA secondary use and consumer protection violations that the bank is responsible for under the Section 1033 data provider obligation framework.`,
    keywords: ['Section 1033', 'CFPB', 'open banking API', 'data aggregator', 'GLBA'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3568',
    name: 'FDX API Standard Adoption Incomplete — Legacy Screen Scraping Remains Active in Parallel',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital has implemented FDX API endpoints for consumer-permissioned data sharing but has not negotiated cessation of screen scraping agreements with the major data aggregators, meaning that aggregators continue to use credential-based screen scraping to access customer accounts alongside the new FDX APIs, maintaining a dual-access architecture that exposes customer credentials to aggregator infrastructure outside the bank's GLBA security controls. CFPB Section 1033 implementation guidance and the bank's open banking security architecture require that screen scraping be deprecated once standards-based APIs are available, as screen scraping involves customer credential sharing that is incompatible with GLBA access control and authentication standards; the coexistence of FDX APIs and screen scraping creates a security architecture where the bank cannot control credential exposure or audit access from screen scraping aggregators, undermining the security assurance model of the FDX API migration.`,
    keywords: ['FDX API', 'CFPB Section 1033', 'screen scraping', 'GLBA', 'open banking'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3569',
    name: 'Open Banking Customer Consent Records Not Stored in Auditable, Revocable Consent Ledger',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's open banking infrastructure processes customer consent authorizations for third-party data access through the OAuth 2.0 authorization flow, but consent grants are stored only in the OAuth token management system without a separate, auditable consent ledger that records the specific data scope authorized, the purpose for which access was granted, and the mechanism by which the customer can revoke access from within the bank's own digital banking application. CFPB Section 1033 consumer consent framework and OCC open banking governance expectations require that customers be able to view and revoke their authorized data sharing relationships through the bank's own interfaces, with a complete consent audit trail; the absence of an independent consent ledger means that customer consent records are embedded in OAuth infrastructure that customers cannot access directly, making the bank unable to comply with Section 1033's requirement to provide customers with a discoverable inventory of their active data sharing authorizations.`,
    keywords: ['Section 1033', 'CFPB', 'OAuth 2.0', 'consent ledger', 'open banking'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3570',
    name: 'API Developer Portal Exposes Internal Data Model Structure Through Verbose Error Messages',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's open banking API developer portal returns detailed error messages that expose internal data model field names, database table structures, and backend service identifiers to authorized API clients, with stack traces revealing the bank's internal system architecture in error responses to malformed API requests. OCC cybersecurity examination guidance and FFIEC Information Security Booklet requirements prohibit exposing internal system architecture details through API error messages, as this information facilitates targeted attack reconnaissance by threat actors who discover the API endpoints and probe them with malformed inputs; the verbose error messages also violate secure API design principles by exposing internal table names that match the BCBS 239 critical data element registry, providing adversaries with a map of the bank's regulatory data architecture.`,
    keywords: ['API security', 'OCC guidance', 'FFIEC', 'open banking', 'data architecture'],
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3571',
    name: 'Section 1033 API Data Accuracy Obligation Not Extended to Third-Party Data Aggregation Layers',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital complies with CFPB Section 1033 data accuracy requirements for data it shares directly through its open banking APIs, but the accuracy obligation is not contractually extended to the data aggregator layer that reformats, normalizes, and re-categorizes the bank's transaction data before presenting it to fintech applications; customers who use budgeting and financial planning apps powered by aggregated bank data see transaction categories and amounts that have been algorithmically altered by the aggregator, attributing the accuracy of the data to the bank when the aggregation layer has introduced categorization errors. CFPB Section 1033 consumer protection expectations and the bank's open banking data quality governance require that data accuracy standards extend through the data sharing chain to the consumer-facing representation; banks that do not contractually require accuracy maintenance from their aggregator partners are exposed to CFPB consumer protection enforcement when aggregator-introduced inaccuracies cause consumers to make financial decisions based on miscategorized transaction data attributed to the bank.`,
    keywords: ['Section 1033', 'CFPB', 'data aggregator', 'data accuracy', 'open banking'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3572',
    name: 'Open Banking API Versioning Strategy Does Not Support Parallel Version Deprecation Period',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital deploys open banking API version updates with a 30-day deprecation notice for API consumers, but the bank's API consumer base includes fintech partners whose engineering cycles require 60–90 days to implement and test API version changes; when a version deprecation forces fintech partners to migrate faster than their engineering capacity allows, customer data access disruptions generate CFPB consumer complaints attributable to the bank's API governance practices rather than partner implementation failures. CFPB Section 1033 implementation guidance and FFIEC technology service provider management requirements expect that banks implement API lifecycle governance that accounts for the integration complexity of their data consumer ecosystem; a 30-day deprecation window calibrated to the bank's internal development velocity rather than the partner ecosystem's integration capacity creates a structural data access reliability risk that undermines the consumer-permissioned data sharing intent of Section 1033.`,
    keywords: ['Section 1033', 'CFPB', 'API versioning', 'FFIEC', 'open banking'],
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3573',
    name: 'Bulk Customer Data Export API Not Subject to GLBA Secondary Use Restrictions',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital exposes a bulk customer data export API for corporate treasury customers to retrieve account and transaction data for cash management purposes, but the API does not enforce purpose-bound access restrictions — allowing corporate treasury staff with API credentials to extract customer financial data beyond the scope of the treasury management service and use it for internal commercial analytics without the customer's GLBA-required notice and opt-out opportunity. GLBA Privacy Rule secondary use restrictions and OCC customer data governance examination standards require that API access to customer NPI be scoped to the disclosed purpose for which the data sharing relationship was established; bulk export APIs without purpose-bound access controls create a secondary use risk where the technical affordances of the API exceed the legal scope of the customer's data sharing consent, exposing the bank to GLBA Privacy Rule violations when corporate clients use the export API for data uses beyond the treasury management service.`,
    keywords: ['GLBA', 'OCC guidance', 'bulk data export API', 'secondary data use', 'open banking'],
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3574',
    name: 'API Sandbox Does Not Reflect Production Data Structure Changes Made During Core Banking Upgrade',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital maintains a developer sandbox environment where fintech partners build and test integrations against the bank's open banking APIs, but the sandbox has not been updated to reflect the schema changes introduced during the bank's core banking platform upgrade, causing partners to build integrations against a sandbox that does not match the production API response structure and experiencing unexpected integration failures when they deploy to production. FFIEC technology management guidance and OCC third-party oversight requirements expect that banks maintain accurate test environments for API integrations that reflect the current production API specification; a sandbox that diverges from production due to unmanaged schema drift causes fintech partners to invest development resources in integrations built against incorrect specifications, produces production deployment failures that generate CFPB consumer complaints, and undermines the bank's open banking developer relations program.`,
    keywords: ['API sandbox', 'FFIEC', 'OCC guidance', 'core banking upgrade', 'open banking'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3575',
    name: 'Customer-Permissioned Data Sharing Revocation Does Not Propagate to Downstream Fintech Sub-Processors',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's open banking API infrastructure processes customer data access revocations by invalidating the OAuth token and ceasing data sharing with the authorized fintech application, but does not have a mechanism for notifying or requiring the fintech to purge data previously shared under the revoked authorization from any sub-processors or data storage systems the fintech has used, leaving customer financial data in downstream systems after the customer has revoked access. CFPB Section 1033 consumer rights framework and GLBA data governance requirements expect that customer revocation of data sharing access result in cessation of both prospective sharing and, where technically feasible, deletion of customer data previously shared; the absence of downstream deletion propagation means that customers who revoke open banking authorizations have their financial data retained indefinitely by fintech sub-processors, creating an unresolved secondary data lifecycle governance obligation that CFPB examiners identify as a gap in the bank's open banking consumer protection program.`,
    keywords: ['Section 1033', 'CFPB', 'GLBA', 'data revocation', 'open banking'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3576',
    name: 'Open Banking API Lacks Minimum Viable Scope Enforcement — Over-Scoped Access Granted by Default',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's open banking API authorization flow grants fintech applications access to all available data scopes — checking, savings, loans, investments, and bill pay history — unless the fintech application explicitly restricts the scope in the authorization request, effectively providing over-scoped access by default when fintech applications use the broad-scope authorization path without careful scope configuration. CFPB Section 1033 data minimization principles and GLBA customer data governance standards require that data sharing APIs be designed to provide the minimum data scope necessary for the authorized use case, with over-scoped access granted only on explicit justification rather than by default; the default over-scope architecture means that budgeting apps requesting checking account access also receive loan and investment data not needed for their use case, creating secondary data exposure that exceeds what customers understand they are authorizing.`,
    keywords: ['Section 1033', 'CFPB', 'GLBA', 'API scope governance', 'open banking'],
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3577',
    name: 'API Security Penetration Testing Not Conducted on Open Banking Endpoints Before Launch',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital launches its Section 1033-compliant open banking APIs under a time-pressure deployment schedule without completing a security penetration test specific to the new open banking endpoints — relying on a general application penetration test conducted six months earlier that did not cover the OAuth 2.0 authorization flow, token refresh logic, or rate limiting implementation of the new API surface. OCC cybersecurity examination guidance and FFIEC Information Security Booklet requirements mandate that material new API surfaces be subject to security penetration testing before production deployment; the untested open banking endpoints are found, within 30 days of launch, to contain an OAuth token fixation vulnerability that allows a malicious actor to pre-set a customer's session token and gain access to the customer's financial data after the customer authenticates, representing a material GLBA Safeguards Rule information security failure.`,
    keywords: ['API security', 'OCC guidance', 'FFIEC', 'GLBA Safeguards Rule', 'open banking'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3578',
    name: 'Third-Party Aggregator API Access Not Covered by TPRM Due Diligence Before Onboarding',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital onboards fintech companies as authorized data consumers of its Section 1033 open banking APIs through a streamlined developer portal registration process that collects business registration and technical contact information but does not require completion of the bank's full third-party risk management due diligence process — including cybersecurity assessment, financial stability review, and subprocessor mapping — as required by OCC 2013-29 for service providers receiving access to customer NPI. OCC 2013-29 third-party risk management guidance and GLBA Safeguards Rule Section 314.4(f) require that service providers with access to customer NPI undergo appropriate due diligence before being granted access; the streamlined onboarding process for open banking API consumers allows fintech companies with inadequate cybersecurity controls to receive customer financial data, and when a newly onboarded aggregator experiences a data breach, the bank's TPRM program has no prior risk assessment of the counterparty's control environment.`,
    keywords: ['OCC 2013-29', 'GLBA Safeguards Rule', 'TPRM', 'Section 1033', 'open banking'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
  {
    code: 'B3579',
    name: 'Open Banking API Transaction History Depth Not Sufficient to Support CFPB Portability Standard',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's open banking APIs provide 90 days of transaction history per API call — the minimum tested during initial Section 1033 compliance preparation — but the CFPB's Section 1033 final rule interpretation and fintech use case requirements for account switching and credit underwriting establish that a minimum of 12–24 months of portable transaction history is necessary for consumer financial portability and alternative credit assessment use cases. CFPB Section 1033 consumer financial data rights and the competitive access principles underlying the rule require that open banking APIs provide sufficient historical data depth to support the primary consumer portability use cases the rule was designed to enable; an API that provides only 90 days of transaction history is technically compliant with minimum specifications but fails the substantive portability standard that CFPB examiners use when evaluating whether a bank's open banking implementation meaningfully enables consumer financial data rights.`,
    keywords: ['Section 1033', 'CFPB', 'transaction history portability', 'GLBA', 'open banking'],
    demoRelevant: true,
    subTopic: 'open-data-apis',
  },
];
