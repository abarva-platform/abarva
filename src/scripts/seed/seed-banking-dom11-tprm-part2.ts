// seed-banking-dom11-tprm-part2.ts
// Banking genome patterns — Third-Party & Vendor Risk Management (TPRM) Part 2
// Code range: B3160–B3219  (60 patterns)
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

export const BANKING_TPRM_PART2_PATTERNS: PatternSeed[] = [

  // ── Cloud Concentration ───────────────────────────────────────────────────
  {
    code: 'B3160',
    name: 'FFIEC Cloud Concentration Risk Assessment Not Performed — Single Hyperscaler Dependency',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital has migrated its core deposit platform, fraud detection, and model risk infrastructure to a single hyperscaler without conducting the formal cloud concentration risk assessment that FFIEC guidance and OCC Bulletin 2023-17 require when a critical-activity workload creates a dependency on a single cloud service provider. The FFIEC IT Examination Handbook's cloud computing guidance specifies that banks must assess whether single-CSP dependency creates correlated failure risk across multiple simultaneous critical functions — a risk that is materially different from single-vendor concentration in on-premises hardware. Without this assessment, the TPRM committee cannot quantify the probability that an extended CSP regional outage would simultaneously impair customer-facing banking, fraud controls, and regulatory model submissions.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2023-17', 'cloud concentration', 'CSP dependency', 'TPRM'],
    demoRelevant: true,
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3161',
    name: 'Multi-Cloud Strategy Governance Gap — No Defined Owner for Cross-Cloud Risk Aggregation',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's digital transformation programme has deployed workloads across two hyperscalers — AWS for digital banking and Azure for data analytics — without assigning ownership for aggregating cross-cloud risk into a single enterprise view that the TPRM committee and OCC examiners can assess. OCC Bulletin 2023-17 requires that banks understand and manage concentration risk at the enterprise level; a multi-cloud architecture managed by separate business units with separate TPRM records gives the false appearance of diversification while the underlying data flows, shared identity providers, and cross-cloud API dependencies create concentration risks that are invisible to any single business unit. The absence of a cross-cloud risk owner means OCC 2023-17's requirement for documented enterprise concentration assessment is structurally unmet.`,
    keywords: ['OCC Bulletin 2023-17', 'multi-cloud governance', 'FFIEC IT Handbook', 'cloud concentration', 'TPRM'],
    demoRelevant: true,
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3162',
    name: 'Cloud Exit Planning Documentation Absent — No Tested Migration Path From Primary CSP',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's cloud adoption programme migrated six critical workloads to its primary hyperscaler over 18 months but has produced no cloud exit plan specifying the data portability formats, re-platforming options, timeline estimates, or cost models for migrating those workloads to an alternative provider or returning them to on-premises infrastructure. OCC Bulletin 2023-17 explicitly requires exit documentation for critical cloud relationships that is proportional to the operational dependency created; the vendor's cloud services agreement does not include contractual portability obligations, meaning the bank's implicit exit plan is to remain on the same CSP indefinitely — a position OCC examiners have categorised as an inadequate exit strategy for a relationship that meets the critical-activity threshold.`,
    keywords: ['OCC Bulletin 2023-17', 'cloud exit plan', 'CSP portability', 'TPRM', 'critical activity'],
    demoRelevant: true,
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3163',
    name: 'Shared Responsibility Model Misalignment — Bank Assumes CSP Covers Regulatory Data Controls',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's IT leadership operates under the assumption that migrating regulated workloads to a major hyperscaler transfers GLBA Safeguards Rule and OCC data security compliance obligations to the cloud provider; the bank has not documented which controls in the shared responsibility model are the bank's own obligation and which are fulfilled by the CSP. FFIEC cloud guidance and OCC Bulletin 2023-17 are explicit that the bank retains full regulatory responsibility for the security and availability of its data regardless of hosting location; a formal shared responsibility matrix review would reveal that encryption key management, privileged access controls, data classification tagging, and logging retention are bank-side obligations that are currently unimplemented in the cloud environment.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2023-17', 'shared responsibility model', 'GLBA Safeguards Rule', 'cloud concentration'],
    demoRelevant: true,
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3164',
    name: 'Cloud SLA Regulatory Adequacy Not Assessed — CSP Availability SLA Below Bank RTO Requirement',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's primary hyperscaler offers a 99.9% monthly uptime SLA for its managed database and compute services, which translates to approximately 43 minutes of permitted downtime per month; the bank's OCC-required recovery time objective for its core deposit platform is 4 hours, and its business impact analysis classifies any deposit platform outage exceeding 30 minutes as a critical disruption requiring incident response activation. The FFIEC Business Continuity Management Handbook requires that cloud SLAs be assessed for regulatory adequacy against the bank's own RTO and RPO commitments; the gap between the CSP's contractual SLA and the bank's regulatory RTO means that the CSP can meet its contractual obligations while leaving the bank in regulatory non-compliance during an availability event.`,
    keywords: ['FFIEC Business Continuity Handbook', 'OCC Bulletin 2023-17', 'cloud SLA', 'RTO', 'TPRM'],
    demoRelevant: true,
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3165',
    name: 'CSP Sub-Processor Chain for AI/ML Workloads Not Disclosed — Fourth-Party Cloud Risk',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's AI and machine learning workloads run on a hyperscaler's managed ML platform that relies on specialised hardware providers, GPU cluster operators, and inference acceleration sub-processors that are not disclosed in the bank's cloud services agreement. OCC Bulletin 2023-17's fourth-party risk requirements apply to cloud sub-processors as well as traditional vendor subcontractors; the bank has no visibility into whether these cloud sub-processors handle bank data in jurisdictions subject to foreign government data access orders, whether they maintain SOC 2 Type II attestations, or whether their geographic concentration compounds the bank's existing cloud concentration risk profile.`,
    keywords: ['OCC Bulletin 2023-17', 'fourth-party risk', 'cloud sub-processor', 'TPRM', 'FFIEC IT Handbook'],
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3166',
    name: 'Cloud Configuration Drift Not Detected — TPRM Oversight Framework Covers Contract Not Controls',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's TPRM oversight of its primary hyperscaler relationship is focused on contract terms, SLA reports, and annual security questionnaire reviews without any mechanism for detecting configuration drift — changes to security group rules, access control policies, encryption settings, or logging configurations that degrade the bank's security posture within the cloud environment. FFIEC cloud guidance and OCC Bulletin 2023-17 require ongoing technical monitoring of cloud environments as part of third-party risk oversight; the absence of cloud security posture management tooling means the bank's TPRM programme is contractually compliant but operationally blind to the actual security configuration of its most critical cloud workloads.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2023-17', 'cloud configuration drift', 'CSPM', 'TPRM'],
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3167',
    name: 'Cloud Egress Cost Not Quantified in Concentration Risk Assessment — Hidden Lock-In Measure',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's TPRM concentration risk assessment for its primary hyperscaler does not quantify cloud data egress costs as a component of the switching barrier and exit cost analysis; at the bank's current cloud data storage volumes, migrating to an alternative provider would incur CSP egress charges of approximately $1.8–2.4M before any re-platforming or integration costs are included. OCC Bulletin 2023-17 requires that concentration risk assessments quantify the financial and operational barriers to exit; the unquantified egress cost is a hidden component of vendor lock-in that systematically inflates the true switching cost and reduces the credibility of the bank's documented exit strategy.`,
    keywords: ['OCC Bulletin 2023-17', 'cloud egress cost', 'vendor lock-in', 'TPRM', 'exit strategy'],
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3168',
    name: 'Cloud Resilience Testing Does Not Include CSP-Triggered Failure Scenarios',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's business continuity testing programme includes simulated outages of internal systems and network failures but does not include scenarios where the primary hyperscaler's managed services experience an extended regional failure — a scenario that OCC Bulletin 2023-17 and the FFIEC Business Continuity Management Handbook identify as a distinct risk category requiring separate testing. The bank's last annual BCP test assumed all cloud services remain available throughout the simulated crisis scenario, making the test structurally unable to validate the bank's ability to maintain critical functions during a genuine CSP disruption; OCC examiners have noted that banks with 40%+ of critical workloads in the cloud must include CSP-failure scenarios in resilience testing to demonstrate adequate operational continuity planning.`,
    keywords: ['OCC Bulletin 2023-17', 'FFIEC Business Continuity Handbook', 'cloud resilience', 'BCP testing', 'TPRM'],
    demoRelevant: true,
    subTopic: 'cloud-concentration',
  },
  {
    code: 'B3169',
    name: 'Cloud Contractual Right to Audit Not Exercised — CSP Limits Bank Access to Audit Reports',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's cloud services agreement includes a provision allowing the bank to receive the CSP's SOC 2 Type II and ISO 27001 audit reports in lieu of direct bank audits; the bank has not requested these reports in 18 months, and the CSP's most recently available SOC 2 Type II report is from 14 months ago with six qualified exceptions in the availability trust service criteria. OCC Bulletin 2023-17 requires that banks obtain and review relevant audit reports for critical-activity vendors on a periodic basis consistent with the risk tier; an unrequested and unreviewed SOC 2 report with availability exceptions for the bank's primary cloud provider represents a material ongoing monitoring gap for a relationship where availability directly affects the bank's regulatory operational resilience obligations.`,
    keywords: ['OCC Bulletin 2023-17', 'SOC 2 Type II', 'audit rights', 'cloud concentration', 'TPRM'],
    subTopic: 'cloud-concentration',
  },

  // ── Fintech Partnerships ──────────────────────────────────────────────────
  {
    code: 'B3170',
    name: 'BaaS Sponsor Bank Oversight Gap — OCC Bulletin 2023-17 Program Manager Audit Rights Absent',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description:
      `First Capital operates as a Banking-as-a-Service sponsor bank for two fintech program managers that offer consumer deposit and lending products under the bank's charter; the program management agreements do not include enforceable audit rights allowing First Capital to conduct independent examinations of the fintech's compliance operations, BSA/AML controls, and customer service practices. OCC Bulletin 2023-17 and the OCC's 2021 guidance on BaaS arrangements require that sponsor banks maintain effective oversight of all consumer-facing activities conducted by program managers operating under the bank's charter — including the right to conduct unannounced audits; without contractual audit rights, First Capital cannot independently verify that the fintech program managers' compliance and customer protection practices meet the standards for which the bank bears regulatory liability.`,
    keywords: ['OCC Bulletin 2023-17', 'BaaS sponsor bank', 'program manager oversight', 'audit rights', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-partnerships',
  },
  {
    code: 'B3171',
    name: 'Co-Brand Credit Card Issuer Compliance Gap — Fintech Partner Consumer Complaint Resolution Unmonitored',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital co-brands a consumer credit card with a fintech retail partner where the fintech manages customer-facing marketing, onboarding, and dispute intake while First Capital is the issuing bank; the partnership agreement does not require the fintech to share customer complaint data with First Capital, and the bank has not established a monitoring mechanism to track whether the fintech's complaint resolution practices meet CFPB's expectations for issuing bank oversight of co-brand arrangements. OCC Bulletin 2023-17 and CFPB supervisory guidance require the issuing bank to maintain full visibility into consumer complaint patterns and resolution timelines for products offered under the bank's charter; a co-brand partner with a systematic complaint resolution lag creates Regulation E and UDAP exposure that the bank cannot detect without the complaint data the partnership agreement does not require to be shared.`,
    keywords: ['OCC Bulletin 2023-17', 'co-brand credit card', 'CFPB', 'complaint monitoring', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-partnerships',
  },
  {
    code: 'B3172',
    name: 'BNPL Partnership Consumer Compliance Oversight — CFPB Circular 2022-05 Requirements Unaddressed',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital participates as a funding bank in a Buy Now Pay Later programme where a fintech partner offers point-of-sale installment credit using First Capital's balance sheet; the program management agreement does not address the consumer compliance obligations identified in CFPB Circular 2022-05 regarding BNPL products, including disclosure of total cost of credit, dispute resolution rights equivalent to Regulation Z credit card protections, and appropriate underwriting standards for consumers demonstrating multiple concurrent BNPL obligations. OCC Bulletin 2023-17 requires that banks operating through fintech partners ensure all applicable consumer protection obligations are met by the program manager under the bank's supervision; the absence of CFPB Circular 2022-05 requirements from the BNPL partnership agreement leaves First Capital exposed to CFPB examination findings on a product the fintech markets, designs, and distributes.`,
    keywords: ['OCC Bulletin 2023-17', 'BNPL', 'CFPB Circular 2022-05', 'fintech partnership', 'consumer compliance'],
    demoRelevant: true,
    subTopic: 'fintech-partnerships',
  },
  {
    code: 'B3173',
    name: 'Fintech Program Manager CRA Activity Not Counted — Partnership Structure Severs CRA Credit',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's two BaaS fintech program managers originate a significant volume of small-dollar consumer loans in LMI census tracts that would qualify for CRA lending credit if originated by the bank directly; the program management agreement structure routes the originations through the fintech's technology platform in a way that OCC CRA examination guidance does not permit the bank to claim as qualifying CRA lending activity. The interagency CRA final rule and OCC Bulletin 2023-17 collectively require that sponsor banks structure BaaS partnerships to preserve appropriate regulatory characterisation of the underlying activities; the bank's CRA officer has not reviewed the BaaS partnership structure for CRA eligibility, meaning the bank may be substantially under-reporting qualifying CRA activity while bearing the regulatory liability for the partnerships.`,
    keywords: ['OCC Bulletin 2023-17', 'CRA', 'BaaS partnership', 'TPRM', 'LMI lending'],
    subTopic: 'fintech-partnerships',
  },
  {
    code: 'B3174',
    name: 'Fintech Partner Onboarding Algorithm Not Assessed for ECOA Disparate Impact',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's digital lending fintech partner uses a proprietary onboarding and credit decisioning algorithm to pre-qualify customers for bank-chartered consumer loans; the bank has never obtained access to the algorithm's methodology documentation, training data characteristics, or disparate impact analysis, and the TPRM due diligence record contains only the fintech's self-attestation that the algorithm complies with ECOA and the Fair Housing Act. OCC Bulletin 2023-17 and CFPB fair lending examination procedures require that banks assess the fair lending risk of algorithmic decisioning tools used in credit origination regardless of whether the algorithm is operated by a third party; First Capital bears full ECOA liability for credit decisions made by the fintech's algorithm on bank-chartered products, and cannot demonstrate ECOA compliance without access to the algorithmic methodology.`,
    keywords: ['OCC Bulletin 2023-17', 'ECOA', 'fintech algorithm', 'disparate impact', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-partnerships',
  },
  {
    code: 'B3175',
    name: 'Fintech Digital Wallet Partner Not Assessed for Reg E Error Resolution Compliance',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital participates in a digital wallet partnership where a fintech firm's consumer app provides access to First Capital deposit accounts and executes electronic fund transfers; the TPRM record for the fintech wallet partner does not include an assessment of the partner's Regulation E error resolution practices, including whether provisional credit is issued within 10 business days and whether investigations are completed within 45 days as required under 12 CFR Part 1005.11. OCC Bulletin 2023-17 requires that banks maintain oversight of Reg E compliance across all third-party channels through which customers initiate EFTs; the bank's compliance monitoring for the wallet partnership covers transaction volumes and fraud metrics but not the Reg E error resolution pipeline, where a systematic backlog at the fintech would expose First Capital to CFPB enforcement.`,
    keywords: ['OCC Bulletin 2023-17', 'Reg E', 'digital wallet', 'fintech partnership', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-partnerships',
  },
  {
    code: 'B3176',
    name: 'Fintech Partner Data Monetisation Clause Conflicts With GLBA Customer NPI Obligations',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's BaaS program management agreement with a consumer fintech partner permits the fintech to use anonymised transaction and behavioural data derived from First Capital customer accounts for the fintech's own commercial analytics and data monetisation purposes; the bank's TPRM and legal teams have not assessed whether this data use is permissible under GLBA's Privacy Rule, which requires that customers receive opt-out rights before their NPI is shared with non-affiliated third parties for marketing purposes. The data monetisation clause was accepted during contract negotiation because the fintech's legal team classified the data as "aggregated and de-identified," but GLBA's regulatory guidance does not permit the bank to substitute de-identification for compliance with the Privacy Rule's opt-out requirements when the underlying data is derived from customer account transactions.`,
    keywords: ['GLBA Privacy Rule', 'OCC Bulletin 2023-17', 'fintech data monetisation', 'NPI', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-partnerships',
  },
  {
    code: 'B3177',
    name: 'Embedded Finance Partner Insurance Product Sold Without Bank TPRM Review of Regulatory Scope',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's embedded finance fintech partner has begun offering credit insurance products alongside the bank-chartered consumer loans delivered through the partnership, without the bank's TPRM team assessing whether the insurance sales activity brings the partnership within the scope of the Gramm-Leach-Bliley Act's insurance sales rules or triggers state insurance licensing obligations for First Capital as the sponsoring institution. OCC Bulletin 2023-17 requires that banks proactively assess regulatory scope changes when fintech partners expand the products and services offered through bank-chartered relationships; the addition of insurance products to the embedded finance programme has not triggered any TPRM re-review, creating potential licensing exposure in states where the bank is not an authorised insurance producer.`,
    keywords: ['OCC Bulletin 2023-17', 'embedded finance', 'insurance product', 'TPRM', 'GLBA'],
    subTopic: 'fintech-partnerships',
  },

  // ── Vendor Resilience ─────────────────────────────────────────────────────
  {
    code: 'B3178',
    name: 'Critical Vendor BCP Not Tested Against OCC Bulletin 2013-29 Standards — Paper Plan Only',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital collects business continuity plans from its top 15 critical-activity vendors annually but has not required any vendor to provide evidence of a live BCP test — tabletop exercise results, failover test documentation, or DR simulation outcomes — in the current examination cycle. OCC Bulletin 2013-29 and OCC Bulletin 2023-17 both require that banks assess not just the existence of vendor BCPs but their operational validity through testing evidence; a vendor BCP that has never been exercised provides no assurance that the documented recovery procedures are achievable, that recovery time objectives reflect actual system recovery capabilities, or that the vendor's staff are trained to execute the plan under crisis conditions.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'BCP testing', 'vendor resilience', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-resilience',
  },
  {
    code: 'B3179',
    name: 'Single-Source Critical Vendor Substitution Plan Not Documented — No Alternative Provider Identified',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's TPRM programme identifies five critical-activity vendors for which no alternative provider has been identified and no vendor substitution plan exists; these single-source vendor relationships include the bank's credit bureau data integration layer, its AML alert investigation platform, and its core banking overnight batch processing service. OCC Bulletin 2013-29 and OCC Bulletin 2023-17 require that banks develop contingency plans for replacing critical vendors under adverse circumstances, which at minimum requires identifying potential alternative providers and estimating the time and cost required to onboard them; the absence of any alternative provider research for these five relationships means the bank's exit strategy documentation is non-compliant with the OCC's vendor resilience planning requirements.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'single-source vendor', 'substitution plan', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-resilience',
  },
  {
    code: 'B3180',
    name: 'Fourth-Party Subcontractor Risk Visibility Gap — Vendor BCP Does Not Cover Sub-Tier Failures',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's critical data analytics vendor has a documented BCP covering its own operations but does not include recovery procedures for failure of its material subcontractors — the cloud hosting provider, the data pipeline vendor, and the market data feed supplier on whom the analytics platform depends. OCC Bulletin 2023-17 requires that vendor BCPs address subcontractor dependencies and include recovery scenarios where the failure originates in a fourth-party rather than the direct vendor; a BCP that only covers first-tier vendor failure provides no assurance of recovery when the actual disruption point is a sub-processor outage, which is increasingly the primary source of enterprise application failures in cloud-native service architectures.`,
    keywords: ['OCC Bulletin 2023-17', 'fourth-party risk', 'vendor BCP', 'TPRM', 'OCC Bulletin 2013-29'],
    subTopic: 'vendor-resilience',
  },
  {
    code: 'B3181',
    name: 'Vendor Financial Health Monitoring Not Triggered by Private Equity Acquisition',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's TPRM ongoing monitoring programme does not include event-driven financial health reassessment triggers; three critical-activity vendors have been acquired by private equity firms in the past 24 months with significant debt leverage attached to each acquisition, but none of the acquisitions has triggered a re-assessment of the vendors' financial stability under OCC Bulletin 2023-17's ongoing monitoring requirements. Financial stress at a highly leveraged PE-owned core technology vendor — workforce reductions, deferred maintenance investment, or insolvency proceedings — is one of the most common precursors to sudden vendor failure in the banking technology sector; First Capital has no early warning mechanism to detect financial deterioration at these vendors before it manifests as a service outage or vendor exit.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'vendor financial health', 'TPRM', 'concentration risk'],
    demoRelevant: true,
    subTopic: 'vendor-resilience',
  },
  {
    code: 'B3182',
    name: 'Vendor RTO Commitment Unvalidated — Contractual 4-Hour Recovery Never Tested in Production',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's core banking platform vendor contractually commits to a 4-hour recovery time objective for major outage scenarios, but the bank has never required the vendor to demonstrate this RTO through a simulated production failover that includes the bank's actual data volumes, integration touchpoints, and downstream dependent systems. OCC Bulletin 2013-29 and OCC Bulletin 2023-17 require that banks validate vendor recovery capabilities rather than rely solely on contractual commitments; the vendor's internal tests are conducted in isolated test environments without the 14-year history of customer data and the 47 active integrations that would be present in a real recovery scenario — making the 4-hour RTO an engineering aspiration rather than an operationally validated commitment.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'RTO validation', 'vendor resilience', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-resilience',
  },
  {
    code: 'B3183',
    name: 'Vendor Key Personnel Dependency — Critical Operations Rely on Two Named Employees',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's TPRM assessment of its AML platform vendor identifies that two specific vendor employees hold all system administration credentials, perform all custom integration maintenance, and are the only personnel with knowledge of the proprietary configuration layer used by First Capital's deployment; neither the vendor's BCP nor First Capital's contract includes key-person succession provisions or knowledge transfer requirements. OCC Bulletin 2023-17's operational resilience requirements for critical-activity vendors extend to personnel dependency risk; the sudden unavailability of either key person — resignation, illness, or departure following a PE acquisition-driven cost reduction — could result in First Capital being unable to maintain, upgrade, or troubleshoot its AML platform for an indefinite period.`,
    keywords: ['OCC Bulletin 2023-17', 'key personnel dependency', 'vendor resilience', 'TPRM', 'OCC Bulletin 2013-29'],
    subTopic: 'vendor-resilience',
  },
  {
    code: 'B3184',
    name: 'Interconnected Vendor Failure Scenario Not Modelled — Cascade Risk Across TPRM Portfolio',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's TPRM risk assessments evaluate each vendor in isolation without modelling scenarios where the failure of one critical vendor causes cascading impairment of connected vendors — for example, an outage at the bank's cloud data integration vendor simultaneously disabling the fraud detection system, the AML transaction monitoring platform, and the credit bureau real-time decisioning feed that all depend on the same data pipeline. OCC Bulletin 2023-17 and FFIEC operational resilience guidance require that banks understand and manage the interdependencies among their third-party relationships; the absence of interconnected failure scenario modelling means First Capital's TPRM portfolio presents a misleadingly favourable resilience picture because single-point failures in the integration layer are not captured by individual vendor risk assessments.`,
    keywords: ['OCC Bulletin 2023-17', 'FFIEC IT Handbook', 'cascade failure', 'vendor resilience', 'TPRM'],
    subTopic: 'vendor-resilience',
  },
  {
    code: 'B3185',
    name: 'Geographic Concentration in Vendor Data Center Portfolio — All Critical Vendors in Same Region',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's three critical-activity data processing vendors — core banking, fraud detection, and digital banking — each operate primary data centers in the same geographic region, creating a correlated geographic failure risk where a regional infrastructure event such as a power grid disruption, natural disaster, or physical security incident could simultaneously impair all three vendors' primary operations. OCC Bulletin 2023-17 requires that concentration risk be assessed across geographic dimensions as well as vendor-count dimensions; the TPRM programme's vendor-by-vendor risk assessments do not aggregate geographic data center locations, so the enterprise-level geographic concentration has never been identified or reported to the TPRM committee.`,
    keywords: ['OCC Bulletin 2023-17', 'geographic concentration', 'data center', 'TPRM', 'OCC Bulletin 2013-29'],
    subTopic: 'vendor-resilience',
  },

  // ── Data Security TPRM ────────────────────────────────────────────────────
  {
    code: 'B3186',
    name: 'Vendor Data Breach Notification SLA Misaligned With OCC 12 CFR Part 53 Filing Window',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's vendor contracts require notification of a material data security incident within 72 hours of the vendor becoming aware of the incident; OCC's Computer Security Incident Notification rule at 12 CFR Part 53 requires banks to notify the OCC within 36 hours of the bank becoming aware of a notification incident, creating a structural compliance gap when the vendor uses the full 72-hour contractual window. The sequential process — vendor notifies bank at hour 72, bank assesses regulatory scope, bank files OCC notification — cannot complete within the 36-hour window that begins when the bank receives the vendor's notification; FFIEC guidance and OCC Bulletin 2023-17 both require vendor notification SLAs to be designed so that the bank's regulatory obligations can be met, not merely the vendor's contractual minimum.`,
    keywords: ['OCC Bulletin 2023-17', '12 CFR Part 53', 'vendor breach notification', 'TPRM', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'data-security-tprm',
  },
  {
    code: 'B3187',
    name: 'GLBA Information Security Safeguards Not Extended to Sub-Processors Handling NPI',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's GLBA information security programme and vendor contracts require direct vendors to maintain safeguards equivalent to the bank's GLBA-compliant information security standard, but this obligation does not flow down contractually to sub-processors and fourth parties who handle customer NPI as part of the vendor's service delivery. GLBA's Safeguards Rule under 16 CFR Part 314.4(f) requires banks to oversee third-party service providers by contractually requiring them to implement appropriate safeguards and by monitoring those safeguards; a vendor that complies with the bank's GLBA requirements while itself using sub-processors without equivalent requirements creates a GLBA compliance gap in the extended data supply chain that the bank is responsible for managing.`,
    keywords: ['GLBA Safeguards Rule', 'OCC Bulletin 2023-17', 'sub-processor', 'NPI', 'TPRM'],
    demoRelevant: true,
    subTopic: 'data-security-tprm',
  },
  {
    code: 'B3188',
    name: 'CCPA/CPRA Vendor Data Processing Obligations Not Incorporated in California Vendor Contracts',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital serves California-resident customers through its digital banking channel and shares their personal financial data with technology vendors who process it under service agreements that do not include the data processing agreement provisions required under the California Consumer Privacy Act and California Privacy Rights Act — specifically the limitation on using personal data outside the scope of the service relationship, the requirement to delete data upon request, and the prohibition on selling or sharing personal data. Although GLBA's financial data exemption limits CCPA/CPRA's direct applicability to core financial data, the technology and marketing vendors who process non-financial personal data collected from California customers are subject to CCPA/CPRA data processing requirements that First Capital's TPRM and legal teams have not incorporated into vendor contracting templates.`,
    keywords: ['CCPA/CPRA', 'OCC Bulletin 2023-17', 'vendor data processing', 'TPRM', 'GLBA'],
    subTopic: 'data-security-tprm',
  },
  {
    code: 'B3189',
    name: 'PCI-DSS Vendor Compliance Attestation Gap — Service Providers Not on Current AOC List',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's TPRM programme requires payment technology vendors to maintain PCI-DSS compliance and provide annual Attestations of Compliance, but the current TPRM inventory shows three payment service providers with AOCs that are 15–22 months old — beyond the PCI Security Standards Council's 12-month re-assessment requirement for Level 1 service providers. PCI-DSS v4.0 Requirement 12.8 requires that entities with which cardholder data is shared maintain PCI-DSS compliance and provide current AOCs; operating with payment service providers whose AOC currency cannot be confirmed exposes First Capital to card brand penalties and increases the bank's liability scope under PCI-DSS if a breach occurs during a gap period when the vendor's compliance status is unknown.`,
    keywords: ['PCI-DSS', 'OCC Bulletin 2023-17', 'AOC', 'payment vendor', 'TPRM'],
    demoRelevant: true,
    subTopic: 'data-security-tprm',
  },
  {
    code: 'B3190',
    name: 'Vendor Data Deletion Upon Contract Termination Not Verified — NPI Retained Past Contractual Window',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's vendor contracts require that vendors delete or return all customer NPI within 30 days of contract termination, but the bank's TPRM programme does not include a process for verifying that data deletion has occurred — no deletion certificate is requested, no third-party audit of deletion is conducted, and no technical confirmation method is specified. GLBA's Safeguards Rule and OCC Bulletin 2023-17 require that banks ensure service providers protect NPI throughout its lifecycle, including after the service relationship ends; two recently terminated vendors retain copies of historical customer transaction data that the bank cannot confirm has been deleted, creating ongoing NPI exposure and a potential GLBA Safeguards Rule gap for data that the bank no longer has a business purpose for the vendor to hold.`,
    keywords: ['GLBA Safeguards Rule', 'OCC Bulletin 2023-17', 'data deletion', 'NPI', 'TPRM'],
    subTopic: 'data-security-tprm',
  },
  {
    code: 'B3191',
    name: 'Vendor Minimum Encryption Standard Below NIST SP 800-131A — Legacy Algorithm Permitted',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's TPRM vendor security questionnaire requires vendors to confirm that customer data is encrypted in transit and at rest but does not specify a minimum encryption algorithm standard; two critical data vendors confirmed encryption use without disclosing that they rely on deprecated algorithms — including SHA-1 for certificate signing and 3DES for legacy data warehouse encryption — that NIST SP 800-131A has deprecated and the FFIEC Cybersecurity Assessment Tool classifies as insufficient for protecting sensitive financial data. The absence of a specific NIST SP 800-131A-aligned minimum standard in vendor contracts means the bank's GLBA Safeguards Rule compliance posture is dependent on encryption implementations that the bank cannot independently validate and that may not meet current regulatory expectations.`,
    keywords: ['NIST SP 800-131A', 'OCC Bulletin 2023-17', 'encryption standard', 'GLBA Safeguards Rule', 'TPRM'],
    subTopic: 'data-security-tprm',
  },
  {
    code: 'B3192',
    name: 'Vendor Security Incident Response Integration Not Tested — Bank IR Plan Assumes Ideal Vendor Notification',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's incident response plan includes a section on vendor-related security incidents that describes the bank's response workflow assuming timely and complete notification from the vendor; the plan has never been tested in a joint simulation with any critical-activity vendor, so the bank has no validated understanding of what information vendors will provide in their initial notification, how long forensic information takes to obtain, or which aspects of the bank's IR plan are contingent on vendor cooperation that may not be contractually guaranteed. OCC Bulletin 2023-17 and FFIEC Cybersecurity Assessment Tool guidance on response and recovery require that banks test incident response capabilities including vendor-related scenarios; an untested IR integration creates the risk of coordination failures during a real vendor-originated security incident when speed of response is most critical.`,
    keywords: ['OCC Bulletin 2023-17', 'FFIEC Cybersecurity Assessment Tool', 'incident response', 'vendor security', 'TPRM'],
    demoRelevant: true,
    subTopic: 'data-security-tprm',
  },
  {
    code: 'B3193',
    name: 'Data Loss Prevention Not Extended to Vendor API Channels — NPI Exfiltration Blind Spot',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's data loss prevention programme monitors outbound email, file transfers, and web uploads for NPI exfiltration but does not cover the API channels through which vendors programmatically retrieve customer data from bank systems — including the data analytics vendor's batch export API, the CRM integration feed, and the fraud analytics real-time data stream. GLBA's Safeguards Rule under 16 CFR Part 314.4(c) requires banks to identify and assess risks to the security of customer information, including risks from access channels not covered by standard DLP monitoring; the absence of API-channel coverage means the bank cannot detect whether a vendor's API access is retrieving data beyond the scope of its authorisation — a pattern that OCC examination teams increasingly flag as a DLP programme maturity gap.`,
    keywords: ['GLBA Safeguards Rule', 'OCC Bulletin 2023-17', 'DLP', 'API channel', 'TPRM'],
    subTopic: 'data-security-tprm',
  },

  // ── AI TPRM ──────────────────────────────────────────────────────────────
  {
    code: 'B3194',
    name: 'Vendor AI Credit Model Treated as Software Not Model — SR 11-7 Governance Bypassed',
    officeCategory: 'middle_office',
    failureRatePct: 83,
    description:
      `First Capital's consumer lending operations deploy a vendor-supplied AI credit scoring engine that generates risk probability scores used to make approve/decline decisions on personal loan applications; the model is classified in the bank's technology inventory as "vendor software" rather than registered in the SR 11-7 model inventory, allowing it to bypass the independent validation, documentation, and ongoing performance monitoring requirements that the consent order mandates for all models driving credit decisions. SR 11-7 and OCC 2011-12 are unambiguous that the model risk management framework applies to all quantitative tools generating outputs used in credit decisions regardless of whether the tool is internally developed or externally provided; OCC examiners reviewing the consumer lending portfolio will identify the missing model inventory registration as a consent order violation and a direct indicator that the bank's MRM remediation programme has systemic classification gaps.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI credit model', 'consent order', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3195',
    name: 'LLM Vendor Contract Missing Audit Rights for Training Data — SR 11-7 Documentation Gap',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description:
      `First Capital's enterprise LLM deployment for customer service automation is sourced from a foundation model vendor whose contract does not include audit rights for training data composition, model architecture documentation, or training procedure records that would be required to perform SR 11-7-compliant model validation of a model used to generate customer-facing financial communications. SR 11-7 requires that banks be able to obtain sufficient documentation to assess whether a model's conceptual soundness is appropriate for its use case; for an LLM generating product disclosures and account explanations to bank customers, the inability to audit training data creates an irreducible conceptual soundness assessment gap that means the model cannot be validated to the standard the consent order requires. Without contractual audit rights for training data, First Capital cannot determine whether the LLM's pre-training corpus included financially inaccurate or regulatory non-compliant content that may surface as confident-sounding hallucinations in customer interactions.`,
    keywords: ['SR 11-7', 'LLM vendor', 'OCC Bulletin 2023-17', 'training data audit rights', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3196',
    name: 'AI Due Diligence Checklist Missing Sub-Processor Disclosure for Training Infrastructure',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's TPRM AI vendor due diligence checklist captures the primary AI vendor's security posture, model documentation, and data handling practices but does not require disclosure of the sub-processors involved in the AI training and inference infrastructure — including the cloud GPU providers, annotation and labelling sub-contractors, and data pipeline operators whose access to training data may include customer financial information. OCC Bulletin 2023-17 and FFIEC guidance on AI vendor oversight require that third-party AI risk assessments extend to material sub-processors involved in model training and operation; a foundation model trained using sub-contracted annotation firms that access sensitive data without equivalent GLBA safeguards creates a data security exposure that the primary vendor's SOC 2 report will not capture because annotation sub-processors are typically excluded from the SOC 2 scope.`,
    keywords: ['OCC Bulletin 2023-17', 'AI due diligence', 'sub-processor disclosure', 'TPRM', 'GLBA Safeguards Rule'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3197',
    name: 'GenAI Vendor Hallucination Risk Not Incorporated Into Vendor Scorecard',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's TPRM vendor scorecard for its generative AI document summarisation and customer communication vendor evaluates security posture, data handling, and SLA performance but does not include a hallucination risk metric — no assessment of the vendor's methodology for measuring and controlling factual accuracy in financial contexts, no contractual commitment to accuracy performance benchmarks, and no incident reporting requirement for identified hallucination events. OCC Bulletin 2023-17 and emerging OCC guidance on AI risk require that banks assess model accuracy risk as a component of vendor risk for AI systems generating customer-facing or decision-influencing outputs; a GenAI vendor scorecard without a hallucination risk dimension cannot support the bank's SR 11-7 extended model risk assessment for vendor AI tools.`,
    keywords: ['OCC Bulletin 2023-17', 'SR 11-7', 'GenAI hallucination risk', 'vendor scorecard', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3198',
    name: 'ML Model Bias Testing Absent From Vendor Ongoing Monitoring — ECOA Exposure Undetected',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's ongoing monitoring programme for its AI credit underwriting vendor includes accuracy and stability metrics but does not include regular disparate impact analysis measuring the model's approval and pricing rates by protected class attributes under ECOA and the Fair Housing Act; the bank receives monthly performance reports from the vendor showing aggregate approval rates and model accuracy but no demographic parity or disparate impact statistics. OCC Bulletin 2023-17, CFPB fair lending examination procedures, and SR 11-7's requirements for ongoing model monitoring collectively require that banks monitor AI models used in credit decisions for disparate impact on an ongoing basis — not only at initial validation; a model that degrades differentially across demographic groups after deployment would not be detected under the current monitoring framework until an examiner or litigation event forces a retrospective analysis.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'ML model bias', 'ECOA', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3199',
    name: 'AI Concentration Risk — Over-Reliance on Single Foundation Model Vendor Across Three LOBs',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's retail banking, commercial banking, and wealth management lines of business have each independently adopted AI tools from the same foundation model provider — consumer loan decisioning, commercial credit memo generation, and investment recommendation screening — without the TPRM committee assessing the aggregate concentration risk of having three credit-related AI functions dependent on a single foundation model vendor's continued availability, pricing, and model version stability. OCC Bulletin 2023-17 requires enterprise-level concentration risk assessment that includes AI vendor relationships; a pricing dispute, API deprecation, or vendor operational event at this single foundation model provider would simultaneously impair AI-assisted decision-making across all three lines of business, creating a correlated risk concentration that no individual LOB's TPRM assessment is designed to detect.`,
    keywords: ['OCC Bulletin 2023-17', 'AI concentration risk', 'foundation model vendor', 'SR 11-7', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3200',
    name: 'AI Vendor Adverse Action Explainability Gap — ECOA Reg B Disclosure Requirements Unmet',
    officeCategory: 'middle_office',
    failureRatePct: 85,
    description:
      `First Capital uses an AI vendor's ensemble model for consumer credit decisions, but the model's outputs include only a score and an approve/decline recommendation without the specific, principal-reason adverse action factors that Regulation B under ECOA requires to be disclosed to declined applicants. The AI vendor's contract does not include a requirement to provide Reg B-compliant adverse action reason codes, and the bank's compliance team has implemented a parallel rules-based system to generate Reg B reasons that may not align with the actual factors the AI model weighted in its decision. OCC Bulletin 2023-17 and CFPB supervisory expectations require that adverse action notices accurately reflect the basis for the credit decision; providing Reg B reasons derived from a rules-based system that does not match the AI model's actual decision logic constitutes a Reg B violation that the CFPB has cited as a priority examination focus for AI-assisted credit decisions.`,
    keywords: ['Reg B', 'OCC Bulletin 2023-17', 'SR 11-7', 'adverse action explainability', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3201',
    name: 'Vendor AI SAR Narrative Generation Not Validated Under SR 11-7 — BSA Liability Exposure',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's AML operations team has deployed a vendor AI tool that auto-drafts Suspicious Activity Report narratives from transaction data and investigation case files; the AI-generated SAR narrative tool has not been registered in the SR 11-7 model inventory, and no independent validation has assessed whether the tool's narrative outputs accurately and completely represent the underlying transaction evidence in a manner that meets FinCEN's SAR narrative quality standards. SR 11-7's model governance framework applies to tools that generate regulatory-facing outputs; an AI SAR narrative generator that systematically omits material transaction context, introduces factual inaccuracies, or fails to articulate the elements of suspicious activity required under FinCEN guidance creates BSA compliance liability because SAR filings are legal documents for which First Capital bears full responsibility regardless of which vendor tool generated the first draft.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI SAR narrative', 'FinCEN', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3202',
    name: 'Predictive AI Vendor Serving DFAST Stress Scenario Generation Not in Model Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's finance function uses a vendor-supplied predictive AI platform to generate macroeconomic stress scenarios and revenue projections for Dodd-Frank Act Stress Testing submissions; this AI tool is classified as a "scenario library subscription" in the bank's procurement system and has not been registered in the SR 11-7 model inventory despite generating quantitative forecasts that directly inform First Capital's DFAST capital adequacy submission to the Federal Reserve. SR 11-7 and OCC guidance on model risk in DFAST submissions require that all models contributing to regulatory capital filings be subject to independent validation and ongoing monitoring; an AI stress scenario generator used in DFAST that has bypassed model governance is among the highest-visibility SR 11-7 compliance gaps OCC examiners will identify during a consent order compliance review.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'DFAST', 'AI stress scenario', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3203',
    name: 'AI Vendor Model Version Update Without Bank Re-Validation — Silent Material Change',
    officeCategory: 'middle_office',
    failureRatePct: 81,
    description:
      `First Capital's consumer lending operations use a vendor AI credit model that has been updated three times in 18 months as the vendor improved training methodology and expanded the feature set; the bank's contract does not require the vendor to notify First Capital of model version changes, and First Capital has not re-validated the updated versions under SR 11-7 — meaning the bank's IVU-approved validation was performed on a model version that is no longer deployed in production. SR 11-7 requires that model changes meeting a materiality threshold trigger re-validation before deployment; for a vendor-managed AI model, the bank cannot satisfy this requirement without a contractual notification provision that classifies model version updates as material changes subject to the bank's model governance process before the updated version is pushed to production in First Capital's environment.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI model version change', 'model re-validation', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3204',
    name: 'GenAI Vendor Pre-Training Data Includes Competitor Client Data — Competitive Confidentiality Risk',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's generative AI commercial lending documentation vendor trained its foundation model on a corpus that includes anonymised commercial loan documents from multiple bank customers across the vendor's client base; the bank's contract does not include a provision restricting the vendor from using First Capital's commercial lending documents — term sheets, credit memos, covenant structures — in training the model that is simultaneously offered to First Capital's competitor banks. OCC Bulletin 2023-17 and GLBA Safeguards Rule require banks to assess the data use practices of AI vendors handling customer-related documents; a vendor that uses a bank's proprietary credit structures and deal terms to train a model shared with competitors creates a competitive confidentiality exposure that is distinct from the NPI protection issue and requires separate contractual carve-outs that First Capital's current vendor agreement does not include.`,
    keywords: ['OCC Bulletin 2023-17', 'GLBA Safeguards Rule', 'GenAI training data', 'competitive confidentiality', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3205',
    name: 'AI Fraud Detection Model Vendor Provides No Model Card — SR 11-7 Conceptual Soundness Unassessable',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's real-time AI fraud detection system processes every debit card and ACH transaction through a vendor model that the vendor has not documented with a model card or equivalent conceptual soundness documentation; the vendor considers the model architecture, feature importance rankings, and training data characteristics proprietary, making it impossible for First Capital's IVU to assess whether the model is conceptually sound for the bank's specific customer population and fraud pattern mix. SR 11-7 requires banks to understand the conceptual soundness of models generating material risk outputs; a black-box fraud model that the IVU cannot assess conceptually is by definition operating outside the SR 11-7 framework — and for a model making approximately 2.1 million blocking decisions per month, the unmeasured false positive rate is a direct source of regulatory and customer harm risk.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI fraud detection', 'model card', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3206',
    name: 'AI Regulatory Change Monitoring Vendor Not Assessed for SR 11-7 Model Risk — Compliance Output Used in Board Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's compliance operations team uses an AI regulatory change monitoring platform to identify and classify regulatory developments relevant to the bank's compliance programme, with the AI's output directly informing the compliance heat map presented to the board risk committee; this AI tool has not been reviewed for SR 11-7 model risk despite generating a scored, prioritised output that drives the board's understanding of compliance exposure and resource allocation decisions. SR 11-7 guidance on model risk is clear that the governance framework applies to models whose outputs are used in decisions that materially affect the bank — including governance and board reporting decisions; an AI compliance monitoring tool that misclassifies or systematically deprioritises a material regulatory development could cause the bank to under-invest in a compliance area that subsequently becomes a consent order finding.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI compliance monitoring', 'board reporting', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3207',
    name: 'AI Chatbot Vendor Sentiment Scoring Not in SR 11-7 Inventory — Drives Customer Escalation Routing',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's customer service AI chatbot vendor uses a sentiment scoring model to classify customer interactions and route escalations to human agents; the sentiment model is not registered in the bank's SR 11-7 model inventory despite driving material customer service decisions — including which customers are escalated to complaint resolution specialists and which are allowed to continue with automated resolution. SR 11-7 guidance and OCC 2011-12 do not limit model governance to credit and risk models; any model generating scored outputs that influence how customers are treated in a regulated context should be evaluated for SR 11-7 applicability, and a sentiment scoring model that systematically mis-routes customer complaints could create UDAP, Reg E, or consumer complaint pattern issues that the bank's compliance team would not detect until an examination.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI chatbot sentiment', 'customer escalation routing', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3208',
    name: 'AI AML Network Analysis Vendor False Positive Expansion Not Monitored — Investigation Backlog Compounds',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI graph network analysis tool from a vendor to identify AML typologies and suspicious network patterns that rule-based transaction monitoring systems miss; the vendor's model generates network expansion alerts that assign risk scores to accounts connected to flagged entities, but the bank has no ongoing monitoring programme measuring the rate at which network expansion alerts are substantiated versus dismissed as false positives. FinCEN's AML priorities and OCC examination guidance on automated transaction monitoring require that banks monitor the quality and calibration of their AML detection systems; an AI network analysis tool that systematically expands suspicious activity networks beyond the boundary of genuine typological connections would compound the bank's investigation backlog with unsubstantiated cases, increasing SAR filing cost without improving BSA compliance and potentially triggering an OCC examination finding about alert quality calibration.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI AML network analysis', 'FinCEN', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },

  // ── Additional Cloud Concentration ────────────────────────────────────────
  {
    code: 'B3209',
    name: 'Cloud Access Management Vendor Processes Bank IAM Credentials — Scope Exceeds TPRM Review',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital uses a cloud identity and access management vendor that processes and stores privileged administrator credentials for the bank's cloud infrastructure, effectively holding the keys to every cloud-hosted critical application; the TPRM review for this vendor was conducted at Tier 2 significance level because annual contract value was below the bank's Tier 1 threshold, without recognising that the vendor's access scope — all cloud privileged accounts — makes it a critical-activity relationship regardless of contract value. OCC Bulletin 2023-17 requires risk-based rather than cost-based TPRM tiering; the cloud IAM vendor has access to more bank systems than any other single technology vendor, and the FFIEC Cybersecurity Assessment Tool's identity and access management domain requires enhanced oversight of any vendor holding privileged access credentials.`,
    keywords: ['OCC Bulletin 2023-17', 'cloud IAM', 'FFIEC Cybersecurity Assessment Tool', 'TPRM', 'privileged access'],
    subTopic: 'cloud-concentration',
  },

  // ── Additional Fintech Partnerships ───────────────────────────────────────
  {
    code: 'B3210',
    name: 'Sponsor Bank Deposit Sweep Fintech Partner Lacks FDIC Pass-Through Disclosure Compliance',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital receives deposits swept from a fintech partner's customer accounts under a deposit programme agreement; the fintech markets these accounts as FDIC-insured but the programme's customer disclosure does not clearly specify the sweep mechanics, the flow of funds timeline, or the FDIC pass-through eligibility conditions under which customer deposits are covered — requirements the FDIC has emphasised in its 2023 guidance on banking-as-a-service deposit arrangements. OCC Bulletin 2023-17 requires that banks assess consumer disclosure accuracy across all third-party deposit programmes operating under the bank's charter; misleading FDIC insurance disclosures by the fintech partner create regulatory exposure for First Capital because the bank, as the insured institution, bears responsibility for accurate representation of deposit insurance coverage to customers whose deposits it holds.`,
    keywords: ['OCC Bulletin 2023-17', 'FDIC pass-through', 'fintech deposit sweep', 'BaaS', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-partnerships',
  },
  {
    code: 'B3211',
    name: 'Fintech Lending Partner Charges Fees Not in Bank-Approved Fee Schedule — UDAP Exposure',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's fintech digital lending partner has introduced three new loan origination fees over the past year that were not reviewed or approved by First Capital's compliance team before launch; the fees are presented to customers as part of the First Capital-branded loan product and billed through the bank's account infrastructure, but were added by the fintech under a programme management agreement provision allowing the fintech to update fee schedules with 30-day advance notice to the bank rather than advance bank approval. OCC Bulletin 2023-17 and CFPB UDAP examination guidance require that banks maintain supervisory control over all fees charged to customers through bank-chartered products; a fintech partner who can unilaterally introduce new fees with notice-only procedures — not prior approval — creates a UDAP risk that the bank discovers after customer exposure rather than before.`,
    keywords: ['OCC Bulletin 2023-17', 'UDAP', 'fintech lending', 'fee schedule', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-partnerships',
  },

  // ── Additional Vendor Resilience ──────────────────────────────────────────
  {
    code: 'B3212',
    name: 'Vendor Tabletop Exercise Results Not Shared With Bank — BCP Validation One-Way',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's TPRM programme requires critical vendors to conduct annual business continuity tabletop exercises but does not require vendors to share the exercise findings, identified gaps, or remediation commitments with the bank; vendors confirm annually that a tabletop was conducted but provide no evidence of what scenarios were tested or what weaknesses were discovered. OCC Bulletin 2013-29 and OCC Bulletin 2023-17 require that banks assess the results of vendor BCP exercises, not merely confirm their occurrence; a tabletop exercise that reveals material recovery gaps is only valuable to the bank's risk assessment if the bank knows about those gaps — a vendor who confirms exercise completion while withholding gap findings provides the appearance of compliance without the substance of vendor resilience assurance.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'BCP tabletop exercise', 'vendor resilience', 'TPRM'],
    subTopic: 'vendor-resilience',
  },
  {
    code: 'B3213',
    name: 'Vendor Staffing Model Not Assessed — 40% Staff Turnover at Critical Operations Vendor',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's critical payment operations vendor has experienced 40% annual staff turnover for two consecutive years following post-acquisition restructuring, but the bank's TPRM ongoing monitoring does not include vendor workforce stability indicators that would surface this operational risk. OCC Bulletin 2023-17 requires ongoing monitoring of critical vendors' operational stability; high turnover in vendor operations teams — particularly in roles involving bank-specific configuration knowledge, operational procedures, and incident response — is a leading indicator of service degradation, knowledge loss, and increased error rates that will manifest in bank-impacting events before vendor financial metrics deteriorate enough to trigger traditional TPRM financial health alerts.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor staffing stability', 'OCC Bulletin 2013-29', 'TPRM', 'operational resilience'],
    subTopic: 'vendor-resilience',
  },

  // ── Additional Data Security TPRM ─────────────────────────────────────────
  {
    code: 'B3214',
    name: 'Vendor Access Deprovisioning Gap — Former Vendor Employee Retains Production Database Access',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's privileged access management process for external vendor employees does not include an automated deprovisioning workflow triggered when a vendor notifies the bank that an employee with bank system access has departed; in a review of active production database credentials, three accounts belonging to former employees of an active technology vendor retain read access to the bank's customer transaction database. GLBA Safeguards Rule under 16 CFR Part 314.4(e) requires banks to implement safeguards for access termination, and FFIEC IT Handbook guidance on access management requires that vendor personnel access be revoked promptly upon departure; the active credentials represent both a GLBA compliance gap and a live data security risk for which the bank bears regulatory accountability.`,
    keywords: ['GLBA Safeguards Rule', 'FFIEC IT Handbook', 'vendor access deprovisioning', 'TPRM', 'privileged access'],
    demoRelevant: true,
    subTopic: 'data-security-tprm',
  },
  {
    code: 'B3215',
    name: 'Vendor Penetration Test Scope Excludes Bank-Specific Integration Points — Partial Coverage',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's critical fraud analytics vendor conducts annual third-party penetration tests of its core platform, but the test scope is defined by the vendor and explicitly excludes the bank-specific API integration layer and the custom data enrichment pipeline that processes First Capital's transaction data. FFIEC IT Handbook guidance and OCC Bulletin 2023-17 require that penetration tests relevant to a bank's third-party risk assessment cover the systems and integrations that process or access bank data; a penetration test that excludes the exact components handling First Capital's customer transaction stream provides assurance about the vendor's generic platform security while leaving the bank's specific integration — which is the actual attack surface for First Capital data — unassessed.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2023-17', 'penetration test scope', 'TPRM', 'API security'],
    subTopic: 'data-security-tprm',
  },

  // ── Additional AI TPRM ───────────────────────────────────────────────────
  {
    code: 'B3216',
    name: 'AI Pricing Model Vendor Not Assessed for ECOA Disparate Pricing Risk in Deposit Products',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital uses a vendor AI personalised pricing tool to dynamically offer deposit interest rates and certificate of deposit yields based on customer behavioural and deposit behaviour patterns; the vendor's model has not been assessed for ECOA disparate impact on protected class attributes despite the tool influencing the prices offered to customers in a deposit product context. CFPB supervisory guidance on AI pricing tools and OCC Bulletin 2023-17 require banks to assess whether AI-driven pricing differentials in deposit and fee products create disparate impact on ECOA-protected groups; while ECOA's primary scope addresses credit, banking regulators have signalled that AI pricing models in deposit products require equivalent disparate impact scrutiny, and the absent SR 11-7 classification means the model has not been through the channel that would trigger such an assessment.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI pricing model', 'ECOA disparate impact', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3217',
    name: 'AI Mortgage Underwriting Vendor HMDA Data Collection Not Verified — Reg C Gap',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital uses a vendor AI platform to assist mortgage underwriters in document review and credit analysis for residential loan applications; the TPRM due diligence for this vendor has not assessed whether the AI platform's pre-screening and document extraction functions affect the completeness or accuracy of HMDA data fields — application disposition codes, action taken reasons, and denial reason codes — that First Capital is required to report under Regulation C. OCC examination guidance on HMDA compliance and OCC Bulletin 2023-17 require that banks assess how third-party technology affects the accuracy of required regulatory data collection; an AI mortgage platform that extracts structured fields from unstructured documents may truncate or misclassify denial reason data in ways that produce systematic HMDA reporting errors that neither the bank's compliance team nor the vendor's product team has identified.`,
    keywords: ['OCC Bulletin 2023-17', 'HMDA', 'Reg C', 'AI mortgage underwriting', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3218',
    name: 'AI Commercial Loan Spreading Vendor Output Used in Credit Committee Without Model Risk Label',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's commercial credit analysts use a vendor AI financial statement spreading and analysis tool whose normalised financial ratios, covenant compliance calculations, and credit risk flags are incorporated directly into credit committee presentation decks without a disclosure that the figures were generated by an AI model that has not been validated under SR 11-7. SR 11-7 requires that model risk governance include appropriate labelling and transparency around model-generated outputs used in credit decisions; credit committee members approving or declining commercial loans based on AI-generated financial analysis without knowing it is model output — and therefore subject to model error, data extraction mistakes, and unsupported methodology — cannot exercise the independent judgement and challenge function that SR 11-7's use and review layer requires.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI financial spreading', 'commercial credit', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },
  {
    code: 'B3219',
    name: 'AI Vendor CRA Small Business Data Scoring Not Assessed for CRA Exam Readiness',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital uses a vendor AI platform to score small business lending demand and CRA performance across its assessment areas, with the AI's output incorporated into the bank's CRA self-assessment narrative and provided to examiners as supporting evidence for the bank's CRA rating. The AI CRA scoring model has not been registered in the SR 11-7 model inventory, and the bank's CRA team has not assessed whether the model's geographic demand estimates and peer benchmarks are methodologically sound enough to withstand OCC examination scrutiny. OCC Bulletin 2023-17 and CRA examination guidance require that quantitative tools supporting CRA documentation meet standards of accuracy and transparency; an AI CRA scoring tool that overstates small business lending demand in the bank's assessment area — making the bank appear to under-serve its CRA obligations relative to demand — could generate an unexpected CRA rating downgrade when examiners apply their own assessment-area analysis to the same data.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'CRA AI scoring', 'small business lending', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm',
  },

];
