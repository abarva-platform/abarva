// seed-banking-dom13-cloud-infra-part1.ts
// Banking genome patterns — Cloud & Infrastructure Modernisation
// Code range: B3700–B3759  (60 patterns)
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

export const BANKING_CLOUD_INFRA_PART1_PATTERNS: PatternSeed[] = [

  // ── Cloud Migration: Mainframe-to-Cloud ──────────────────────────────────────
  {
    code: 'B3700',
    name: 'Mainframe-to-Cloud Migration Without OCC 2023-17 Regulatory Notification',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital initiates a mainframe-to-cloud migration for core deposit and loan processing workloads without providing the timely prior notice to the OCC required under OCC Bulletin 2023-17 for significant third-party technology relationships and infrastructure changes affecting critical operations. OCC Bulletin 2023-17 requires that OCC-supervised institutions notify examiners before executing major technology migrations that introduce new third-party dependencies or alter the risk profile of critical banking services; when the migration is discovered during a scheduled examination, the absence of prior notification is treated as a supervisory concern compounding the bank's existing third-party risk management deficiencies.`,
    keywords: ['OCC Bulletin 2023-17', 'mainframe migration', 'cloud migration', 'regulatory notification', 'third-party risk'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3701',
    name: 'Cloud Workload Classification Without Regulatory Risk Tiering for Critical Functions',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's cloud migration programme classifies workloads by technical complexity and migration effort but does not apply the OCC's supervisory framework for identifying critical activities — those whose disruption could cause significant customer harm, reputational damage, or regulatory non-compliance — before assigning cloud deployment targets. FFIEC IT Handbook guidance on risk-stratified cloud adoption requires that banks establish tiering criteria that distinguish between workloads supporting critical banking functions and those supporting administrative operations; without a risk-tiered classification, mission-critical payments processing and customer account systems migrate to shared cloud infrastructure using the same controls framework as internal HR and reporting tools, creating residual risk exposure that OCC Bulletin 2013-29 third-party risk management guidance is designed to prevent.`,
    keywords: ['FFIEC IT Handbook', 'cloud workload classification', 'OCC Bulletin 2013-29', 'critical functions', 'cloud migration'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3702',
    name: 'Regulated Data Residency Not Mapped Before Hyperscaler Region Selection',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital selects Azure East US as its primary cloud region and Azure West US as its disaster recovery region for core banking workloads, without first completing a data residency mapping exercise to identify regulated data subject to state-level data sovereignty requirements, Gramm-Leach-Bliley Act safeguards, and OCC expectations for supervisory access to regulated data. The FFIEC IT Handbook's cloud computing guidance requires that institutions understand where regulated customer financial data will be stored, processed, and transmitted before executing cloud contracts; when the migration is underway, the compliance team identifies that customer tax identification data, account history, and wire transfer records stored in the cloud provider's distributed object storage are replicated to nodes whose physical location cannot be contractually constrained to US jurisdiction.`,
    keywords: ['data residency', 'FFIEC IT Handbook', 'Gramm-Leach-Bliley', 'cloud region selection', 'regulated data'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3703',
    name: 'Cloud Provider SLA Falls Below Regulatory RTO Requirements for Core Banking Systems',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's core banking system is migrated to a cloud IaaS platform whose standard SLA commits to 99.9% uptime with a 4-hour recovery time objective for hardware failures, while the bank's own business continuity plan and OCC examination expectations for systemically important payment functions require a 1-hour RTO. FFIEC IT Handbook guidance on business continuity management and ISO 22301 principles require that third-party SLAs be contractually aligned with the institution's recovery objectives for critical functions; the 3-hour gap between the cloud provider's SLA RTO and the bank's required RTO is not addressed by a contractual enhancement or supplemental technical architecture, creating a regulatory resilience gap that OCC examiners identify during the annual business continuity programme review.`,
    keywords: ['RTO', 'FFIEC IT Handbook', 'cloud provider SLA', 'ISO 22301', 'business continuity'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3704',
    name: 'Lift-and-Shift Migration Carries Mainframe Control Gaps Into Cloud Without Remediation',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital executes a lift-and-shift migration of mainframe COBOL batch processing workloads to cloud virtual machines, replicating the existing application binaries and data structures without remediating known control gaps — including absence of database activity monitoring, hardcoded service account credentials, and batch job run-book procedures that bypass change management approval. The FFIEC IT Handbook's development and acquisition guidance requires that technology migrations include a control equivalence assessment confirming that existing compensating controls are replicated or improved in the new environment; the lift-and-shift approach transfers 14 open audit findings from the mainframe environment to the cloud environment without mitigation, creating a cloud estate that inherits legacy risk before cloud-native security controls are applied.`,
    keywords: ['FFIEC IT Handbook', 'lift-and-shift migration', 'control gaps', 'change management', 'cloud migration'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3705',
    name: 'Cloud Cost Overrun From Mainframe Exit Without FinOps Governance at Migration Cutover',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's mainframe-to-cloud migration budget assumes that cloud compute costs will replace mainframe MIPS costs at a 1:1 value ratio based on vendor benchmarking, but the first 90 days post-cutover reveal cloud spend running at 2.3× the projected amount because migrated batch workloads generate data transfer and egress charges not modeled in the business case. The FFIEC IT Handbook's information security governance guidance requires that technology investment decisions include comprehensive total-cost-of-ownership analysis; the absence of a FinOps governance process to monitor and optimize cloud spend in real time means the overrun grows for three billing cycles before it is reported to the finance committee, creating a budget variance that erodes the migration's projected ROI and introduces re-platforming pressure at a critical stabilization period.`,
    keywords: ['FFIEC IT Handbook', 'FinOps', 'cloud cost governance', 'mainframe migration', 'OCC Bulletin 2023-17'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3706',
    name: 'Cloud Contract Exit Rights Void for Core Banking Data — OCC Concentration Finding',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital migrates its core deposit, loan origination, and customer data platforms to a single hyperscaler under a 5-year enterprise agreement that does not include a contractual right to export all regulated data in a portable, machine-readable format upon termination. OCC Bulletin 2023-17 explicitly flags single-cloud dependency for critical banking functions as a supervisory concentration risk concern, and OCC Bulletin 2013-29 third-party risk management guidance requires that contracts with third parties holding critical data include data portability and exit rights that allow the bank to transition to an alternative provider without operational disruption; the absence of these provisions leaves the bank's core banking data effectively locked to one cloud provider with no practical exit path.`,
    keywords: ['OCC Bulletin 2023-17', 'OCC Bulletin 2013-29', 'cloud exit rights', 'data portability', 'vendor concentration'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3707',
    name: 'Network Segmentation Not Re-Established After Mainframe Decommission — PCI Scope Expansion',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital decommissions its mainframe-resident card transaction processing application and migrates it to a cloud-hosted payment processing platform, but does not re-establish the network segmentation boundaries that isolated the mainframe cardholder data environment from the broader corporate network. PCI DSS version 4.0 requires that the cardholder data environment be clearly scoped and segmented from out-of-scope systems; the migration expands the de-facto PCI scope to include cloud infrastructure shared with non-payment applications, causing First Capital's QSA to expand the scope of the annual PCI assessment and identify 22 new systems requiring PCI DSS compliance validation — a scope expansion that delays certification and triggers a remediation plan.`,
    keywords: ['PCI DSS', 'network segmentation', 'cardholder data environment', 'cloud migration', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3708',
    name: 'Legacy COBOL Batch Translated to Cloud Functions Without Performance Regression Testing',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital uses an automated COBOL-to-Java translation tool to convert mainframe batch processing programs to cloud-native serverless functions, but does not execute a formal regression testing programme that validates end-to-end business output equivalence — including GL posting accuracy, interest calculation precision, and regulatory report generation — before go-live. The FFIEC IT Handbook's development and acquisition guidance requires that any significant application change include testing that verifies functional equivalence and performance under production-representative load; when the translated batch jobs fail to complete within the overnight batch window on the first production weekend due to cold-start latency in the serverless runtime, the bank's overnight GL close is delayed by 6 hours, triggering an operational incident report to the OCC.`,
    keywords: ['FFIEC IT Handbook', 'COBOL migration', 'regression testing', 'cloud-native', 'mainframe migration'],
    subTopic: 'cloud-migration',
  },

  // ── Resilience & Disaster Recovery ──────────────────────────────────────────
  {
    code: 'B3709',
    name: 'RPO Gap for Systemically Important Payment Functions — Cloud Backup Cadence Insufficient',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's cloud-hosted real-time payments platform commits to a 15-minute recovery point objective in the business continuity plan, but the cloud backup configuration uses hourly snapshots of the payments database with no continuous replication to the secondary region. FFIEC IT Handbook business continuity guidance and ISO 22301 business continuity management standards require that recovery objectives be validated through documented technical architecture that demonstrates the backup cadence can achieve the stated RPO; when the primary cloud region experiences an availability zone failure during a FedNow processing window, 45 minutes of payment transaction records are unrecoverable from the most recent snapshot, creating a data loss event that exceeds the bank's stated RPO by 30 minutes and triggers OCC incident notification requirements.`,
    keywords: ['RPO', 'FFIEC IT Handbook', 'ISO 22301', 'FedNow', 'business continuity'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },
  {
    code: 'B3710',
    name: 'Multi-Region Failover Not Regulatory-Tested — DR Plan Paper Exercise Only',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's cloud disaster recovery architecture includes a documented multi-region failover capability where core banking and payments workloads can be promoted from the primary region to the secondary region, but the failover procedure has only been tested in a simulated tabletop exercise without executing an actual failover of production workloads to the secondary region. FFIEC IT Handbook guidance on business continuity testing and OCC supervisory expectations require that DR capabilities for critical systems be tested through actual failover exercises at a frequency appropriate to the operational risk; an untested multi-region failover carries unknown recovery time variance, database synchronization gaps, and application configuration differences that will only manifest under an actual regional outage — which is precisely when the bank cannot afford a discovery failure.`,
    keywords: ['FFIEC IT Handbook', 'disaster recovery testing', 'multi-region failover', 'OCC Bulletin 2023-17', 'ISO 22301'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },
  {
    code: 'B3711',
    name: 'Cyber Resilience FFIEC CAT Maturity Level Insufficient for Cloud Infrastructure Scope',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's FFIEC Cybersecurity Assessment Tool (CAT) self-assessment rates the bank at a "Baseline" maturity level for cyber resilience, but the bank's cloud migration has increased its inherent risk profile to "Elevated" by introducing new cloud API attack surfaces, shared-responsibility model complexity, and internet-accessible cloud management consoles without a corresponding uplift in cybersecurity maturity. The FFIEC CAT framework requires that an institution's cybersecurity maturity level be commensurate with its inherent risk profile; a bank operating at Elevated inherent risk with only Baseline maturity has an identified maturity gap that OCC examiners assess against the institution's progress in addressing the gap through its technology risk remediation plan.`,
    keywords: ['FFIEC CAT', 'cyber resilience', 'cloud security', 'inherent risk', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },
  {
    code: 'B3712',
    name: 'Incident Response Playbook Does Not Cover Cloud Provider Outage Scenarios',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's incident response plan was developed before the cloud migration and covers on-premises failure scenarios — server hardware failure, network switch outage, data centre power loss — but does not include playbooks for cloud-specific incidents such as hyperscaler region unavailability, cloud IAM control plane failures, or cloud object storage service degradation. The FFIEC IT Handbook's information security and business continuity guidance requires that incident response plans be updated to reflect changes in the technology environment; when an AWS S3 service degradation disrupts the bank's statement delivery and customer document workflows, the response team follows the on-premises file server playbook, loses 40 minutes before identifying the cloud-specific escalation path to the cloud provider's support portal, and fails to meet the OCC's 36-hour significant incident notification threshold.`,
    keywords: ['incident response', 'FFIEC IT Handbook', 'cloud outage', 'FFIEC CAT', 'OCC notification'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },
  {
    code: 'B3713',
    name: 'Business Continuity Plan Not Updated After Migration — On-Premises Recovery Steps Reference Decommissioned Hardware',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital decommissions its primary data centre hardware following the cloud migration, but the business continuity plan, disaster recovery runbooks, and incident response checklists retain references to on-premises failover procedures, recovery server locations, and data centre access protocols that no longer apply. FFIEC IT Handbook business continuity guidance requires that BCP documentation be reviewed and updated after any material change to the technology infrastructure, including migration to cloud platforms; when a tabletop exercise is conducted 8 months after the migration, the recovery team follows the documented on-premises runbook and discovers that 12 of 18 recovery steps reference systems, contacts, and procedures that no longer exist, making the documented recovery plan unexecutable.`,
    keywords: ['FFIEC IT Handbook', 'business continuity', 'BCP documentation', 'ISO 22301', 'cloud migration'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },
  {
    code: 'B3714',
    name: 'SOC 2 Type II Coverage Gap — Cloud Subprocessors Not Included in Audit Scope',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital obtains a SOC 2 Type II report from its primary cloud managed services provider covering compute, storage, and network controls, but the SOC 2 scope excludes the provider's content delivery network vendor and the third-party database-as-a-service vendor that the primary provider uses for managed PostgreSQL deployments. OCC Bulletin 2013-29 third-party risk management guidance requires that banks obtain assurance over the entire critical service delivery chain, including subprocessors and fourth-party vendors; the SOC 2 scope gap means that the customer financial data stored in the managed database service is not covered by any independent assurance report, creating a third-party risk management finding that the bank cannot resolve without negotiating scope expansion in the next SOC 2 audit cycle.`,
    keywords: ['SOC 2 Type II', 'OCC Bulletin 2013-29', 'cloud subprocessors', 'third-party risk', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },
  {
    code: 'B3715',
    name: 'Cloud Infrastructure Recovery Not Tested at FedNow Settlement Window — Hidden RTO Gap',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's cloud disaster recovery tests are conducted during low-traffic weekend windows and demonstrate a 45-minute RTO for payment infrastructure recovery, but the test workload represents only 8% of peak FedNow settlement transaction volume and does not replicate the database contention, API gateway load, and fraud screening queue depth present during the weekday 9am–11am settlement window. FFIEC IT Handbook business continuity guidance and the Federal Reserve's FedNow operating procedures require that participant banks demonstrate the ability to meet settlement obligations under operational stress; a recovery test that validates RTO under minimal load creates false confidence that evaporates when an actual outage occurs during peak settlement hours and the recovery takes 2.5 hours rather than the tested 45 minutes.`,
    keywords: ['FedNow', 'FFIEC IT Handbook', 'RTO', 'disaster recovery testing', 'ISO 22301'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },
  {
    code: 'B3716',
    name: 'NIST CSF Recovery Tier Not Aligned With Cloud Architecture — Undetected Resilience Gap',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital adopts the NIST Cybersecurity Framework to structure its technology risk programme and assigns Tier 3 "Repeatable" maturity to the Recover function, but the cloud infrastructure architecture does not implement the automated failover, chaos engineering testing, and resilience observability tooling that Tier 3 recovery practices require. The NIST CSF and FFIEC CAT alignment guidance require that maturity tier assignments reflect actual implemented practices rather than aspirational capability; an OCC examiner reviewing the bank's NIST CSF assessment against the cloud architecture documentation finds that the Recover function maturity is overstated by one tier, producing a risk-adjusted capital adequacy implication for the bank's operational risk capital model under Basel III Pillar 2.`,
    keywords: ['NIST CSF', 'FFIEC CAT', 'cloud resilience', 'Basel III', 'OCC examination'],
    subTopic: 'resilience-dr',
  },

  // ── Vendor Concentration Risk ─────────────────────────────────────────────────
  {
    code: 'B3717',
    name: 'Hyperscaler Concentration Risk Not Disclosed in TPRM Report to OCC',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital migrates 85% of its application and data workloads to a single hyperscaler over 18 months, but the quarterly third-party risk management report to the board and the annual TPRM submission to the OCC continue to characterize the cloud relationship as "moderate concentration" using pre-migration metrics that have not been updated to reflect the post-migration dependency. OCC Bulletin 2023-17 and the FFIEC IT Handbook's third-party management guidance require that concentration risk assessments reflect the current degree of operational dependence on individual third parties; when OCC examiners compare the TPRM report against the cloud infrastructure architecture diagram, the 85% workload concentration in a single provider is inconsistent with a "moderate" rating, creating a third-party risk governance credibility gap.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor concentration', 'TPRM', 'OCC Bulletin 2013-29', 'hyperscaler risk'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3718',
    name: 'Cloud Exit Strategy Not Developed — No Data Portability Plan for Hyperscaler Dependency',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description:
      `First Capital's enterprise cloud strategy commits to a hyperscaler-primary model but does not include a cloud exit strategy that documents how the bank would transition critical workloads to an alternative provider or on-premises infrastructure within a regulatory-acceptable timeframe if the hyperscaler relationship is terminated or the provider experiences a prolonged outage. OCC Bulletin 2023-17 and OCC Bulletin 2013-29 require that institutions have credible, tested exit plans for third-party relationships supporting critical operations; the absence of a cloud exit strategy is identified as a critical gap by OCC examiners who note that the bank's operational dependence on the hyperscaler has grown beyond the threshold where exit could be executed without material customer disruption.`,
    keywords: ['OCC Bulletin 2023-17', 'OCC Bulletin 2013-29', 'cloud exit strategy', 'data portability', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3719',
    name: 'Geographic Concentration in Single Cloud Provider Region — Regulatory Resilience Gap',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital deploys all production and disaster recovery workloads in AWS us-east-1 (primary) and us-east-2 (secondary), both located in the eastern US geographic region; a geopolitical or natural disaster event affecting the eastern US corridor would simultaneously impact both the primary and disaster recovery environments. FFIEC IT Handbook business continuity guidance and OCC Bulletin 2013-29 require that institutions hosting critical functions in cloud environments consider geographic diversity as a component of resilience architecture; the eastern US geographic concentration creates a correlated failure scenario that the bank's BCP does not address, leaving regulatory-required functions including payment processing and deposit account access with no geographically diverse recovery path.`,
    keywords: ['OCC Bulletin 2013-29', 'geographic concentration', 'cloud resilience', 'FFIEC IT Handbook', 'business continuity'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3720',
    name: 'FFIEC Concentration Risk Assessment Not Run Across All Cloud Providers — Hidden Multi-Cloud Dependency',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital conducts an annual cloud concentration risk assessment focused on its primary AWS relationship but does not aggregate concentration exposure across the Azure and Google Cloud services used by individual business units for analytics, AI model training, and collaboration tools — some of which process regulated customer financial data. The FFIEC IT Handbook's third-party management guidance requires that concentration risk be assessed across all third-party relationships involving critical or regulated data, not only the relationships managed by the central IT team; the unassessed multi-cloud footprint means that actual cloud provider concentration, regulatory data exposure, and combined spend are systematically understated in the TPRM programme.`,
    keywords: ['FFIEC IT Handbook', 'cloud concentration', 'TPRM', 'OCC Bulletin 2013-29', 'multi-cloud'],
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3721',
    name: 'Cloud Managed Services Vendor Auto-Renewal Trap — Contract Signed Without Exit Clause Review',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's cloud managed services contract auto-renews for a 3-year term 90 days before expiry, and the bank's procurement team is not notified until 30 days after the auto-renewal triggers because the contract management system does not flag cloud vendor renewals with the same advance notice as traditional software licenses. OCC Bulletin 2013-29 third-party risk management guidance requires that material vendor contracts include exit rights and that institutions maintain sufficient awareness of renewal timelines to exercise those rights; the post-renewal discovery eliminates the bank's negotiating leverage for price adjustment and exit clause enhancement, locking in a contract that does not include the data portability and provider-switch assistance provisions that OCC 2023-17 now expects.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'contract renewal', 'cloud vendor', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3722',
    name: 'Single SaaS Provider Hosts Both Core Banking and AML Screening — Concentration Compounded',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital contracts with a single cloud SaaS provider for both its core banking platform and its BSA/AML transaction monitoring system, creating a scenario where a provider outage simultaneously disrupts both payment processing and the screening controls that prevent prohibited transactions from completing. OCC Bulletin 2023-17 and FFIEC IT Handbook third-party concentration guidance require that banks assess the operational risk of single-provider dependencies for functions subject to independent regulatory obligations; the combined core-banking-plus-AML concentration means that a provider disruption would simultaneously trigger OCC operational incident notification requirements and FinCEN notification obligations under the Bank Secrecy Act, creating a compounded regulatory reporting burden that the bank's incident response plan does not address.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor concentration', 'BSA/AML', 'FFIEC IT Handbook', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },

  // ── DevOps & Security ─────────────────────────────────────────────────────────
  {
    code: 'B3723',
    name: 'Container Deployment Without PCI DSS Scope Assessment — Cardholder Data Exposure',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital adopts Kubernetes container orchestration for its cloud application deployment platform without completing a PCI DSS scope assessment to determine whether any containerized services process, store, or transmit cardholder data — or share network segments with systems that do. PCI DSS version 4.0 requires that organizations maintain a current inventory of all system components in scope and that containerized environments be assessed for CDE exposure, shared resource risks, and container image integrity controls; the absence of a container-specific PCI scope assessment means that three payment-adjacent microservices are deployed in the same Kubernetes cluster as out-of-scope applications, expanding the de-facto PCI scope and creating compliance gaps that the QSA discovers during the annual assessment.`,
    keywords: ['PCI DSS', 'container security', 'Kubernetes', 'cardholder data environment', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'devops-security',
  },
  {
    code: 'B3724',
    name: 'CI/CD Pipeline Secrets Management Gap — API Keys Committed to Source Repository',
    officeCategory: 'back_office',
    failureRatePct: 80,
    description:
      `First Capital's development teams use GitHub Actions for CI/CD pipeline automation, but secrets management governance is not enforced at the platform level — 14 API keys, database credentials, and cloud provider access tokens are found hardcoded in application source code committed to the internal repository, discovered during a routine code scan. FFIEC IT Handbook information security guidance and NIST CSF PR.AC controls require that privileged credentials be managed through secrets management solutions with rotation policies, audit trails, and access controls; hardcoded secrets in source repositories create a persistent credential exposure risk that could allow unauthorized access to production banking systems if the repository is compromised, and constitute a material finding under the bank's SOC 2 Type II audit criteria.`,
    keywords: ['FFIEC IT Handbook', 'secrets management', 'CI/CD', 'NIST CSF', 'PCI DSS'],
    demoRelevant: true,
    subTopic: 'devops-security',
  },
  {
    code: 'B3725',
    name: 'Privileged Access Management Gaps in Cloud Console — No PAM Tool for Cloud Admin Accounts',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital implements a privileged access management (PAM) solution for on-premises systems including core banking servers and network infrastructure, but cloud console access — including AWS IAM administrator roles, Azure portal owner permissions, and cloud billing console access — is managed through shared IAM accounts without integration into the PAM solution. FFIEC IT Handbook access management guidance and PCI DSS version 4.0 requirement 7 require that privileged access to all systems in scope be managed, monitored, and subject to session recording; the absence of PAM coverage for cloud administrator accounts means that privileged cloud actions are not session-recorded, are not subject to just-in-time access provisioning, and cannot be attributed to individual users in a regulatory audit — creating an FFIEC CAT access management maturity gap.`,
    keywords: ['PAM', 'FFIEC IT Handbook', 'cloud IAM', 'PCI DSS', 'FFIEC CAT'],
    demoRelevant: true,
    subTopic: 'devops-security',
  },
  {
    code: 'B3726',
    name: 'Infrastructure-as-Code Deployment Without Change Management Approval Gate',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's cloud infrastructure team uses Terraform for infrastructure-as-code provisioning, enabling developers to deploy new cloud environments and configuration changes through automated pipelines without routing the provisioning request through the bank's IT change management process for change advisory board approval. FFIEC IT Handbook change management guidance requires that changes to production technology infrastructure be subject to an approval process commensurate with the change risk; the bypass of the change advisory board for IaC-deployed changes means that infrastructure configurations affecting network security groups, encryption settings, and database access controls are being modified in production without independent review or rollback documentation, creating an audit trail gap that the bank's external auditors flag in the IT general controls assessment.`,
    keywords: ['FFIEC IT Handbook', 'change management', 'infrastructure-as-code', 'Terraform', 'NIST CSF'],
    demoRelevant: true,
    subTopic: 'devops-security',
  },
  {
    code: 'B3727',
    name: 'Container Image Vulnerability Scanning Not Enforced — Unpatched Images in Production',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital deploys containerized microservices using Docker images from the bank's internal container registry, but the CI/CD pipeline does not enforce a vulnerability scan gate that blocks deployment of images with critical-severity CVEs — container image scanning is configured but operating in audit-only mode that logs findings without blocking pipeline progression. PCI DSS version 4.0 requirement 6.3 and FFIEC IT Handbook patch management guidance require that software with known critical vulnerabilities not be deployed in production without a documented risk exception or remediation; the audit-only scanning configuration means that 7 production microservices are running base images with critical vulnerabilities that have been flagged in the scan report for 60+ days without remediation or exception approval.`,
    keywords: ['PCI DSS', 'container security', 'FFIEC IT Handbook', 'vulnerability scanning', 'CI/CD'],
    demoRelevant: true,
    subTopic: 'devops-security',
  },
  {
    code: 'B3728',
    name: 'Cloud Security Posture Management Alerts Not Triaged — 200+ Open Findings Unaddressed',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital deploys a cloud security posture management (CSPM) tool that continuously monitors the cloud environment for misconfigurations, but the security operations team lacks the capacity to triage and remediate the 200+ findings generated by the tool, resulting in a growing backlog of open findings including public-facing S3 buckets, security groups with 0.0.0.0/0 ingress rules, and unencrypted database instances. FFIEC CAT guidance and NIST CSF DE.CM controls require that security monitoring alerts be triaged and addressed within timelines appropriate to their severity; an organization with a 200+ finding backlog that includes critical-severity public exposure issues has a CSPM programme that is generating monitoring data without producing risk reduction, which OCC examiners assess as a cybersecurity governance failure.`,
    keywords: ['FFIEC CAT', 'NIST CSF', 'cloud security posture', 'FFIEC IT Handbook', 'cloud misconfiguration'],
    demoRelevant: true,
    subTopic: 'devops-security',
  },
  {
    code: 'B3729',
    name: 'DevOps Toolchain Vendor SLA Not Reviewed for Critical Path Dependency on GitHub Actions',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's software delivery pipeline depends on GitHub Actions for CI/CD orchestration and GitHub Packages for artifact storage; the bank's software delivery SLA and deployment frequency targets require that pipeline availability match production system availability requirements, but the GitHub Enterprise SLA providing 99.9% uptime is not reviewed against the bank's software delivery SLA commitments or included in the third-party concentration risk inventory. OCC Bulletin 2013-29 and FFIEC IT Handbook third-party management guidance require that dependencies on software delivery tooling be assessed for operational risk; when GitHub Actions experiences a 4-hour outage during a critical regulatory remediation deployment sprint, the bank cannot execute an emergency patch for a vulnerability in its AML screening API, creating a compounded technology risk event.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'DevOps toolchain', 'third-party risk', 'TPRM'],
    subTopic: 'devops-security',
  },

  // ── API Integration ───────────────────────────────────────────────────────────
  {
    code: 'B3730',
    name: 'API Gateway Monitoring Without Anomaly Detection — Credential Stuffing Attacks Undetected',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an API gateway to manage external-facing APIs for digital banking, open banking partners, and third-party payment processors, and implements request volume monitoring and error rate dashboards — but does not deploy behavioral anomaly detection that identifies credential stuffing attacks characterized by high-volume authentication requests across distributed source IPs using valid credential combinations. FFIEC IT Handbook information security and cybersecurity guidance and NIST CSF DE.AE anomaly detection controls require that API security monitoring detect attack patterns that do not exceed per-connection rate limits; a credential stuffing campaign targeting the mobile banking login API generates 85,000 authentication attempts over 6 hours — successfully compromising 340 accounts — before the security operations centre identifies the pattern from manual log review.`,
    keywords: ['FFIEC IT Handbook', 'API gateway', 'NIST CSF', 'anomaly detection', 'credential stuffing'],
    demoRelevant: true,
    subTopic: 'api-integration',
  },
  {
    code: 'B3731',
    name: 'Microservices Without Service Mesh Authorization — East-West Traffic Not Controlled',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's cloud-native banking platform uses a microservices architecture where 30 services communicate via REST APIs on the internal Kubernetes cluster network, but no service mesh authorization policy is implemented — any service can call any other service without authentication or mTLS, relying solely on Kubernetes network policies. PCI DSS version 4.0 requirement 1.3 requires that network access controls restrict traffic to what is explicitly authorized; the absence of service mesh authorization means that a compromised payment processing microservice can directly call the account ledger API, the customer PII service, and the AML screening bypass endpoint without triggering any access control violation — a lateral movement risk that the bank's cloud penetration test identifies but the remediation timeline has not yet been funded.`,
    keywords: ['PCI DSS', 'service mesh', 'Kubernetes', 'FFIEC IT Handbook', 'microservices authorization'],
    demoRelevant: true,
    subTopic: 'api-integration',
  },
  {
    code: 'B3732',
    name: 'Legacy ESB-to-API Migration Without Regression Testing — Core Banking Data Integrity Risk',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital decommissions its enterprise service bus (ESB) integration layer and migrates all integrations to a REST API gateway architecture, but does not execute a regression testing programme that validates message transformation accuracy, field mapping equivalence, and transaction ordering for the 85 business processes that relied on ESB orchestration. FFIEC IT Handbook development and acquisition guidance requires that integration architecture changes be tested to confirm functional equivalence before decommissioning the legacy system; when the nightly ACH batch integration with the Federal Reserve fails to transmit 1,200 entries because a field-length transformation error truncates account numbers in the API-formatted batch file, the bank discovers that the regression testing scope excluded batch-mode ESB integrations in the migration schedule.`,
    keywords: ['FFIEC IT Handbook', 'ESB migration', 'API gateway', 'ACH', 'regression testing'],
    demoRelevant: true,
    subTopic: 'api-integration',
  },
  {
    code: 'B3733',
    name: 'Open Banking API Scope Creep — Third-Party Apps Accessing Unintended Data Fields',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital implements an open banking API programme for personal financial management app integrations under a permissioned data access model, but the API authorization scopes are defined too broadly — the "account_details" scope returns transaction metadata, balance history, and product pricing information that exceeds the data fields the customer consented to share when authorizing the connection. FFIEC IT Handbook guidance on third-party data access and the OCC's guidance on responsible innovation require that APIs enforce minimum-necessary data access principles; the scope over-disclosure creates a Gramm-Leach-Bliley Act data sharing compliance issue where customer financial data is provided to third parties beyond the scope of the customer's consent, potentially triggering CFPB supervisory inquiry.`,
    keywords: ['FFIEC IT Handbook', 'open banking API', 'Gramm-Leach-Bliley', 'data access scope', 'OCC Bulletin 2013-29'],
    subTopic: 'api-integration',
  },
  {
    code: 'B3734',
    name: 'API Versioning Without Deprecation Governance — Critical Integrations Running on Unsupported Versions',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's internal API platform supports three live versions of the payment initiation API — v1, v2, and v3 — but v1 and v2 are using deprecated TLS 1.0 and TLS 1.1 cipher suites that were scheduled for decommission 12 months ago; the decommission has not occurred because two internal banking applications and one critical third-party fintech integration are still calling v1 endpoints. PCI DSS version 4.0 requirement 4.2 prohibits the use of TLS 1.0 and early TLS in cardholder data environments; the inability to decommission deprecated API versions because of undocumented dependencies creates a circular technical debt cycle that PCI QSA assessors flag as a non-compliance finding requiring immediate remediation.`,
    keywords: ['PCI DSS', 'API versioning', 'TLS deprecation', 'FFIEC IT Handbook', 'technical debt'],
    subTopic: 'api-integration',
  },
  {
    code: 'B3735',
    name: 'FedNow API Integration SLA Not Tested Under Peak Transaction Volume',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's FedNow instant payments integration uses a middleware API layer to translate ISO 20022 messages between the Federal Reserve's FedNow Service and the bank's core banking system; the API integration is tested at 100 transactions per second during UAT but the bank's peak FedNow processing volume reaches 850 transactions per second during month-end payroll settlement windows. FFIEC IT Handbook performance testing guidance requires that integration layers be tested under peak production-representative load to identify latency, throughput, and timeout thresholds; when the API middleware fails to route 12% of FedNow confirmation messages during a high-volume payroll period due to connection pool exhaustion, the bank's settlement reporting to the Federal Reserve shows unmatched credits requiring manual reconciliation.`,
    keywords: ['FedNow', 'ISO 20022', 'API integration', 'FFIEC IT Handbook', 'performance testing'],
    demoRelevant: true,
    subTopic: 'api-integration',
  },

  // ── AI Infrastructure ─────────────────────────────────────────────────────────
  {
    code: 'B3736',
    name: 'LLM Inference on Regulated Customer Data Without Data Residency Controls',
    officeCategory: 'back_office',
    failureRatePct: 82,
    description:
      `First Capital's commercial banking team deploys a vendor-hosted LLM for customer relationship management summarization, passing customer PII, account balances, transaction descriptions, and loan covenant status to the model's API endpoint without verifying that the inference infrastructure is contractually restricted to US data centres and that the model provider has signed an appropriate data processing agreement under Gramm-Leach-Bliley Act safeguards. OCC Bulletin 2023-17 third-party technology guidance and FFIEC IT Handbook requirements for cloud-hosted AI services require that institutions assess data residency, subprocessor chains, and training data retention policies before deploying AI tools that process regulated customer financial data; the absence of a data residency assessment means the LLM inference traffic may traverse the model provider's global infrastructure, creating Gramm-Leach-Bliley data handling violations.`,
    keywords: ['OCC Bulletin 2023-17', 'LLM inference', 'data residency', 'Gramm-Leach-Bliley', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3737',
    name: 'AI Workload Scaling Without FinOps Governance — Cloud Spend Spike From Model Training Jobs',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's data science team provisions GPU compute instances for AI model training through a self-service cloud portal without a FinOps approval gate that requires budget owner authorization for compute resources above a defined spend threshold; a fraud detection model training job that runs without completing for 48 hours consumes $180,000 in GPU compute before being identified by the cloud billing alert, which was configured at the monthly account level rather than at the per-workload level. The FFIEC IT Handbook's information technology risk management guidance requires that technology resource provisioning be subject to governance controls commensurate with the cost and risk; uncontrolled AI compute spend creates budget unpredictability that the bank's technology budget process cannot absorb and that OCC examiners assess as a technology governance maturity gap.`,
    keywords: ['FFIEC IT Handbook', 'FinOps', 'AI workload governance', 'cloud spend', 'model training'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3738',
    name: 'GenAI Sandbox Deployed Without Network Segmentation from Production Banking Systems',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital establishes a GenAI innovation sandbox for business unit teams to experiment with AI tools, but the sandbox environment is provisioned in the same virtual private cloud as production banking systems without a network isolation boundary — developers can access production API endpoints from sandbox instances using shared IAM credentials. PCI DSS version 4.0 and FFIEC IT Handbook development environment isolation controls require that non-production environments be logically separated from production systems and prohibited from accessing production data or services; the sandbox-to-production network path creates a lateral movement risk where a compromised sandbox instance or developer credential could be used to access live customer account data, which the bank's cloud penetration test team documents as a critical finding.`,
    keywords: ['PCI DSS', 'GenAI sandbox', 'network segmentation', 'FFIEC IT Handbook', 'NIST CSF'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3739',
    name: 'Automated Infrastructure Provisioning Without Change Management Approval — SR 11-7 Model Environment Risk',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's MLOps platform uses automated infrastructure provisioning to spin up model training environments and deploy model endpoints without routing the provisioning through the bank's IT change management process, treating MLOps infrastructure changes as application deployments exempt from change advisory board review. SR 11-7 model risk management guidance and OCC Bulletin 2013-29 require that changes to model production environments — including the infrastructure on which validated models run — be subject to governance controls that ensure consistency between the validated model environment and the production environment; when an automated provisioning script deploys a credit risk model to an environment with different Python dependency versions than the validation environment, model output diverges from the validated output by 3 percentage points before the discrepancy is detected by the monthly model monitoring report.`,
    keywords: ['SR 11-7', 'MLOps', 'change management', 'FFIEC IT Handbook', 'model environment'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3740',
    name: 'AI Ops Monitoring Without Regulatory Audit Trail for Model Decisions',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an AI model operations (MLOps) monitoring platform that tracks model performance metrics — accuracy, drift, throughput — but does not retain a tamper-evident audit log of individual model input and output records with timestamps sufficient to reconstruct which model version produced a specific credit or fraud decision on a given date. SR 11-7 model risk management guidance and OCC 2011-12 require that model output for material credit and risk decisions be retainable and attributable to the model version in use at the time of the decision; when an OCC examiner requests a retrospective analysis of credit decisions made by the ML scoring model during a disputed underwriting period, the MLOps platform cannot produce model-version-level decision logs — it can only show aggregate performance statistics — creating an SR 11-7 model governance documentation gap.`,
    keywords: ['SR 11-7', 'OCC 2011-12', 'MLOps', 'model audit trail', 'AI governance'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3741',
    name: 'LLM Vendor Model Version Updates Without SR 11-7 Impact Assessment',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital contracts with a third-party LLM vendor for automated credit memo summarization and customer communication drafting; the vendor updates the underlying foundation model monthly without notifying First Capital or providing a changelog describing what changed in model behavior. SR 11-7 requires that material changes to models used in regulated banking activities be subject to impact assessment and validation before deployment; when the LLM vendor silently updates from GPT-4 to a new model version, the credit memo summaries start omitting certain risk indicators that the previous version reliably surfaced, a change that is discovered only when a loan officer notices inconsistencies — by which point 45 credit memos have been filed under the new model's behavior without change management documentation.`,
    keywords: ['SR 11-7', 'LLM vendor', 'model change management', 'OCC 2011-12', 'AI governance'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3742',
    name: 'AI Model Training Data Retained in Cloud Without Data Classification or Retention Policy',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's data science team stores model training datasets containing customer transaction history, account balances, and loan application data in cloud object storage without applying the data classification labels, retention schedules, or access controls that the bank's data governance policy requires for regulated customer financial data. Gramm-Leach-Bliley Act safeguards, FFIEC IT Handbook information security guidance, and OCC Bulletin 2013-29 data management expectations require that customer financial data be protected by access controls and retention policies regardless of the purpose for which it is stored; the unclassified training data accumulates in cloud storage over 24 months and contains 18 months of customer records beyond the approved retention period, creating a regulatory data minimization violation.`,
    keywords: ['Gramm-Leach-Bliley', 'FFIEC IT Handbook', 'AI training data', 'data retention', 'data classification'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3743',
    name: 'AML AI Transaction Screening Inference Latency Exceeds Real-Time Payments Threshold',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital deploys a cloud-hosted AML AI transaction screening model for real-time FedNow payment screening, but the model's average inference latency is 340ms at peak load — exceeding the 150ms threshold required for the bank to return a screening decision within the FedNow settlement window without falling back to the legacy rules engine. The FFIEC IT Handbook performance management guidance and the Federal Reserve's FedNow operating procedures require that banks demonstrate sufficient capacity to process screening decisions within the real-time settlement window; the latency gap causes the bank to fall back to the legacy rules-based AML engine for 22% of FedNow transactions during peak hours, undermining the operational case for the AI screening investment and creating an inconsistent screening quality between AI-screened and rules-screened transactions.`,
    keywords: ['BSA/AML', 'FedNow', 'AI screening', 'FFIEC IT Handbook', 'inference latency'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3744',
    name: 'Generative AI Code Assistant Used in Banking App Development Without SAST Gate',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's development teams adopt GitHub Copilot as an AI code assistant for banking application development, but the CI/CD pipeline does not enforce a static application security testing (SAST) gate that validates AI-generated code for vulnerabilities before merging to the main branch — AI-generated code bypasses the same code review checklist that human-authored code is required to pass. PCI DSS version 4.0 requirement 6.2 and FFIEC IT Handbook secure development guidance require that all application code — regardless of its origin — be tested for security vulnerabilities before production deployment; AI-generated code introduced 3 SQL injection vulnerabilities and 2 hardcoded secrets into production payment processing code before the security team introduces a mandatory SAST pipeline gate.`,
    keywords: ['PCI DSS', 'AI code assistant', 'SAST', 'FFIEC IT Handbook', 'GitHub Copilot'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3745',
    name: 'AI Fraud Detection Model Retrained on Cloud Without OCC Change Notice for Material Model',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's cloud-hosted fraud detection model is retrained monthly using an automated MLOps pipeline that ingests new transaction data and replaces the production model endpoint without triggering the bank's SR 11-7 model change notification process — which requires that material model parameter changes be reported to the MRM committee and, for models under consent order monitoring, to the OCC model risk examiner team. SR 11-7 specifies that model retraining that changes model parameters or performance characteristics constitutes a model change requiring governance review; when the monthly retrained model produces a 40% increase in false positive fraud alerts due to a training data contamination issue, the MRM committee's first awareness of the model change is the fraud operations team's escalation — not an advance change notification.`,
    keywords: ['SR 11-7', 'fraud detection AI', 'model retraining', 'MLOps', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3746',
    name: 'Cloud AI Inference Costs Not Allocated to Business Units — Shadow AI Budget Proliferates',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's cloud billing for AI inference API calls — including OpenAI, Azure OpenAI, and Anthropic Claude API consumption — is routed to a shared technology cost centre rather than allocated to the business units consuming the AI capabilities, creating no cost signal that would prompt business units to govern their AI usage or evaluate return on investment. FFIEC IT Handbook technology cost governance guidance requires that technology investments be traceable to the business activities they support; the absence of business unit cost allocation allows AI inference spend to grow from $12,000 per month to $340,000 per month over 8 months without a formal budget approval, and when OCC examiners review the bank's technology risk management programme, the unallocated AI spend is identified as an indicator of unsanctioned AI adoption that has not been assessed under OCC Bulletin 2013-29 third-party risk management standards.`,
    keywords: ['FFIEC IT Handbook', 'FinOps', 'AI inference costs', 'OCC Bulletin 2013-29', 'shadow AI'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3747',
    name: 'AI Model Serving Infrastructure Not Covered by Business Continuity Plan',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's business continuity plan identifies critical technology systems requiring DR coverage but was last updated before the bank's AI model serving infrastructure was deployed; the cloud-hosted ML model endpoints for credit scoring, fraud detection, and AML screening are not included in the BCP as critical systems, so there is no documented recovery procedure, backup endpoint, or fallback to rules-based decision processes in the event the model serving infrastructure is unavailable. FFIEC IT Handbook business continuity management guidance and ISO 22301 require that the BCP be updated to reflect material changes to the technology environment; when the model serving platform experiences a 3-hour outage during a scheduled AWS maintenance window, the bank's digital origination platform and real-time fraud screening operate without AI scoring for the duration — decisions that are made with degraded controls and without a documented emergency procedure.`,
    keywords: ['FFIEC IT Handbook', 'business continuity', 'AI model serving', 'ISO 22301', 'BCP gap'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
  {
    code: 'B3748',
    name: 'Retrieval-Augmented Generation AI on Internal Policy Documents Without Data Loss Prevention',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital deploys a retrieval-augmented generation (RAG) AI assistant that enables employees to query internal policy documents, credit memos, and customer account summaries through a natural language interface hosted on a cloud AI platform; the system does not implement data loss prevention controls that prevent the AI's context window from including customer PII or confidential credit information when generating responses to general policy queries. Gramm-Leach-Bliley Act safeguards, FFIEC IT Handbook information security guidance, and OCC Bulletin 2023-17 require that AI systems processing regulated data implement data handling controls appropriate to the sensitivity of the data; the RAG system's retrieval mechanism pulls semantically similar documents without sensitivity-level filtering, causing customer account PII to appear in AI-generated responses accessible to bank employees without a need-to-know for that customer's data.`,
    keywords: ['OCC Bulletin 2023-17', 'RAG AI', 'Gramm-Leach-Bliley', 'data loss prevention', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },

  // ── Additional Cloud Migration ─────────────────────────────────────────────────
  {
    code: 'B3749',
    name: 'Database Encryption Key Management Not Transferred to Bank-Controlled HSM in Cloud',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital migrates its customer database to a cloud managed database service using provider-managed encryption keys rather than customer-managed keys stored in a bank-controlled hardware security module, accepting the cloud provider's default key management configuration that gives the provider technical access to the plaintext encryption keys. FFIEC IT Handbook encryption management guidance and OCC third-party risk requirements expect that banks maintain control over encryption keys protecting regulated customer data, particularly when the key management capability is held by the same provider storing the encrypted data; the provider-managed key configuration means that First Capital cannot independently revoke data access in a contract termination scenario without first migrating the key management to a bank-controlled HSM — a limitation that creates a cloud exit dependency the bank did not evaluate before migration.`,
    keywords: ['FFIEC IT Handbook', 'encryption key management', 'HSM', 'OCC Bulletin 2013-29', 'cloud database'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3750',
    name: 'Cloud Migration Timeline Does Not Allow for Parallel Run Validation — Cutover Risk',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's core banking migration project plan allocates a 2-week parallel run between the legacy mainframe and the cloud platform before final cutover, but the project timeline has been compressed by 8 weeks due to vendor delivery delays — reducing the parallel run to 3 days and eliminating the month-end parallel cycle that would validate GL reconciliation, interest accrual accuracy, and regulatory report generation. FFIEC IT Handbook guidance on application migration and OCC Bulletin 2013-29 third-party technology management require that banks test core banking migrations with a parallel run period sufficient to validate all material business processes including those that run on monthly and quarterly cycles; the 3-day parallel run provides insufficient coverage of month-end and quarter-end processing, creating unvalidated risk that materialises when the first full month-end close on the cloud platform generates a $2.3M GL reconciliation variance.`,
    keywords: ['FFIEC IT Handbook', 'parallel run', 'OCC Bulletin 2013-29', 'core banking migration', 'GL reconciliation'],
    demoRelevant: true,
    subTopic: 'cloud-migration',
  },
  {
    code: 'B3751',
    name: 'Cloud Migration Risk Register Not Updated for FFIEC IT Examination Preparation',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital maintains a cloud migration risk register that was populated during the project initiation phase but is updated only quarterly through a project status report process, meaning that risks identified during active migration sprints — including data mapping errors, middleware compatibility issues, and vendor support gaps — are not captured in the risk register in time to inform the bank's FFIEC IT examination preparation materials. FFIEC IT Handbook guidance on IT risk management and OCC examination management best practices require that risk documentation be current and comprehensive when presented to examiners; when the OCC IT examination team requests the cloud migration risk register, the 4-month-old register does not reflect 23 open risk items that the project team has been managing in a separate tracking spreadsheet, creating a credibility gap in the examination that examiners document as a risk management maturity finding.`,
    keywords: ['FFIEC IT Handbook', 'cloud migration risk', 'OCC examination', 'risk register', 'IT governance'],
    subTopic: 'cloud-migration',
  },

  // ── Additional Resilience & DR ─────────────────────────────────────────────────
  {
    code: 'B3752',
    name: 'Cyber Resilience Playbook Not Tested for Cloud-Specific Ransomware Scenario',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital's cyber incident response plan includes a ransomware response playbook developed in 2021 that addresses on-premises file server and endpoint encryption scenarios, but does not include a cloud-specific ransomware scenario where cloud storage (S3/Azure Blob) versioning and object lock settings are disabled and an attacker using a compromised cloud IAM credential encrypts cloud-hosted core banking data. FFIEC CAT cybersecurity maturity and NIST CSF RS.RP response planning controls require that incident response playbooks reflect the current attack surface; the absence of a cloud ransomware scenario means the response team has no documented procedure for assessing cloud backup integrity, revoking compromised cloud credentials at scale, or engaging the cloud provider's incident response team — all steps that are time-critical in a ransomware event.`,
    keywords: ['FFIEC CAT', 'NIST CSF', 'ransomware', 'cloud incident response', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },
  {
    code: 'B3753',
    name: 'RTO Commitment Made to Regulators Without Cloud Architecture Validation — Unfunded Gap',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital commits to a 2-hour RTO for core banking systems in its OCC-approved business continuity plan, but the cloud architecture supporting the RTO commitment relies on manually-triggered cross-region failover procedures that the infrastructure team estimates require 3.5–4 hours to execute due to database replication lag, DNS propagation delays, and application reconfiguration steps. ISO 22301 business impact analysis requirements and FFIEC IT Handbook BCP validation standards require that RTO commitments be grounded in tested technical capabilities rather than aspirational architecture targets; the unfunded gap between the committed 2-hour RTO and the tested 3.5-hour execution time is known to the technology team but has not been escalated to the OCC, creating a regulatory reporting accuracy issue in the BCP submission.`,
    keywords: ['ISO 22301', 'RTO', 'FFIEC IT Handbook', 'business continuity', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'resilience-dr',
  },

  // ── Additional Vendor Concentration ──────────────────────────────────────────────
  {
    code: 'B3754',
    name: 'Fourth-Party Cloud Dependency Not Assessed — CDN Provider Creates Hidden Critical Path',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's cloud managed services provider uses a third-party CDN vendor for content delivery and API gateway acceleration; this fourth-party dependency is not disclosed in the managed services provider's SOC 2 report and is not captured in First Capital's third-party risk inventory. OCC Bulletin 2013-29 third-party risk management guidance requires that banks assess and monitor fourth-party dependencies for critical services; when the CDN vendor experiences a global outage that takes the managed services provider's API gateway offline for 90 minutes, First Capital's mobile banking application and digital account opening platform become unavailable — a service disruption attributed to a fourth-party vendor that the bank had no visibility into through its standard TPRM programme.`,
    keywords: ['OCC Bulletin 2013-29', 'fourth-party risk', 'CDN', 'TPRM', 'FFIEC IT Handbook'],
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3755',
    name: 'Hyperscaler Shared Responsibility Matrix Not Reviewed for Regulatory Compliance Mapping',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's cloud compliance team accepts the hyperscaler's standard shared responsibility matrix at contract signing but does not map the matrix against the specific FFIEC IT Handbook, OCC, and PCI DSS controls applicable to First Capital's regulated workloads — leaving gaps where the bank assumes the provider covers compliance controls that are explicitly designated as customer responsibilities in the shared model. FFIEC IT Handbook guidance on cloud service management and OCC Bulletin 2013-29 third-party risk management require that institutions conduct a detailed shared responsibility analysis for each regulated workload type; the unreviewed gaps surface during the annual PCI assessment when the QSA finds that 6 PCI DSS controls the bank believed were covered by the cloud provider are documented as customer responsibilities in the provider's compliance guide.`,
    keywords: ['FFIEC IT Handbook', 'shared responsibility', 'OCC Bulletin 2013-29', 'PCI DSS', 'cloud compliance'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },

  // ── Additional DevOps & Security ──────────────────────────────────────────────
  {
    code: 'B3756',
    name: 'Cloud IAM Permission Sprawl — Developer Accounts Retain Production Access Post-Project',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital provisions elevated IAM permissions for developers during migration projects and sprint-based development work, but does not implement an access recertification process to revoke production cloud permissions when the project concludes; after 18 months of cloud migration activity, 48 developer accounts retain production IAM roles with write access to core banking databases and payment processing infrastructure. PCI DSS version 4.0 requirement 7 and FFIEC IT Handbook access management guidance require that privileged access be recertified at defined intervals and that access be revoked promptly when no longer required; the permission sprawl creates an attack surface where any of the 48 over-privileged accounts could be used to access production systems if the account credentials are compromised through phishing or credential stuffing.`,
    keywords: ['PCI DSS', 'IAM permission sprawl', 'FFIEC IT Handbook', 'access recertification', 'NIST CSF'],
    demoRelevant: true,
    subTopic: 'devops-security',
  },
  {
    code: 'B3757',
    name: 'Cloud Security Logging Not Centralised — Audit Trail Fragmented Across Provider Consoles',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's cloud environment generates security logs from AWS CloudTrail, Azure Monitor, and GCP Cloud Audit Logs for its three cloud providers, but these logs are retained in each provider's native logging service without aggregation into a central SIEM, creating an audit trail that requires manual correlation across three separate consoles to reconstruct a security incident timeline. FFIEC IT Handbook information security governance guidance and NIST CSF DE.AE-3 anomaly detection controls require that security events from all environments be aggregated and analysed in a way that enables timely detection and response; the fragmented logging architecture means that a coordinated attack using compromised credentials across two cloud providers cannot be correlated into a single incident timeline within the bank's 1-hour detection SLA.`,
    keywords: ['FFIEC IT Handbook', 'NIST CSF', 'cloud audit logging', 'SIEM', 'FFIEC CAT'],
    demoRelevant: true,
    subTopic: 'devops-security',
  },

  // ── Additional API Integration ─────────────────────────────────────────────────
  {
    code: 'B3758',
    name: 'API Rate Limiting Not Calibrated for DDoS Resilience — Payment API Vulnerable to Volumetric Attack',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's payment initiation API imposes a rate limit of 1,000 requests per minute per API key, but the API gateway does not implement IP-level or behavioral rate limiting that would throttle distributed attacks where each source IP generates only 10–50 requests per minute — well below the per-key threshold. FFIEC IT Handbook denial-of-service resilience guidance and NIST CSF PR.PT-4 protective technology controls require that internet-facing banking APIs implement multi-layer rate limiting including behavioral anomaly detection; a load test commissioned by the bank's security team demonstrates that a 500-node distributed attack can saturate the payment API at 5,000 requests per second without triggering the per-key rate limiter, overwhelming the API gateway's connection pool and making the payment initiation endpoint unavailable to legitimate customers.`,
    keywords: ['FFIEC IT Handbook', 'API rate limiting', 'NIST CSF', 'DDoS resilience', 'payment API'],
    demoRelevant: true,
    subTopic: 'api-integration',
  },

  // ── Additional AI Infrastructure ──────────────────────────────────────────────
  {
    code: 'B3759',
    name: 'AI-Powered Cloud Cost Optimization Tool Modifies Production Resource Config Without Change Review',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital deploys an AI-powered cloud cost optimization platform that automatically rightsizes cloud VM instances and adjusts auto-scaling policies based on observed utilisation patterns; the platform is granted write access to production cloud infrastructure and executes rightsizing changes during low-traffic windows without routing the changes through the IT change management process. FFIEC IT Handbook change management guidance and OCC Bulletin 2023-17 third-party AI tool governance requirements mandate that automated tools with write access to production banking infrastructure be subject to human approval gates for changes that could affect system performance or availability; when the AI tool downsizes the payment processing VM cluster ahead of an unanticipated payroll volume spike, the underpowered cluster experiences a 35-minute degraded performance event during FedNow settlement hours that triggers an OCC operational incident notification requirement.`,
    keywords: ['OCC Bulletin 2023-17', 'AI cost optimization', 'change management', 'FFIEC IT Handbook', 'FinOps'],
    demoRelevant: true,
    subTopic: 'ai-infra',
  },
];
