// seed-banking-dom13-cloud-infra-part2.ts
// Banking genome patterns — Cloud Infrastructure & Technology Risk
// Code range: B3760–B3819  (60 patterns)
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

export const BANKING_DOM13_CLOUD_INFRA_PART2_PATTERNS: PatternSeed[] = [

  // ── Cloud Security (B3760–B3771) ────────────────────────────────────────────
  {
    code: 'B3760',
    name: 'S3 Bucket Public ACL Not Blocked — Customer Statement Data Exposed on Cloud Object Storage',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital migrates customer statement generation to a cloud-native workflow that writes PDF statements to an S3 bucket, but the bucket's Block Public Access setting is not enabled at the account level and a misconfigured bucket ACL grants public read access to the statement prefix — exposing 11 months of customer account statements to unauthenticated HTTP requests. FFIEC CAT Baseline maturity controls and NIST CSF PR.AC-3 require that cloud storage holding regulated customer data be protected against unintended public exposure through enforced account-level access controls and continuous posture monitoring; the exposed statements trigger a Gramm-Leach-Bliley Act Safeguards Rule breach notification obligation and an OCC incident report that identifies the root cause as absence of a cloud security posture management control that prevents public ACL misconfiguration at provisioning time.`,
    keywords: ['FFIEC CAT', 'S3 misconfiguration', 'Gramm-Leach-Bliley', 'NIST CSF', 'cloud data exposure'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3761',
    name: 'Cloud IAM Role with Wildcard Permissions Assigned to Customer-Facing Application Service Account',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's digital banking application runs under an AWS IAM service account role that was provisioned with a wildcard action policy ("Action": "*") during a rapid deployment sprint; the over-permissive role grants the application service account read and write access to all S3 buckets, all DynamoDB tables, and all KMS keys in the account — far exceeding the least-privilege scope required for the application's defined functions. PCI DSS version 4.0 requirement 7.2 and FFIEC IT Handbook access management guidance require that service accounts be assigned only the permissions required for their defined functions; an attacker who achieves remote code execution in the application container inherits the wildcard IAM role, enabling lateral movement to core banking databases and encryption key material — a critical finding documented during the bank's annual penetration test that has remained open for 120 days without remediation.`,
    keywords: ['PCI DSS', 'IAM least privilege', 'FFIEC IT Handbook', 'cloud IAM', 'service account security'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3762',
    name: 'FFIEC CAT Encryption Maturity Gap — Data at Rest Unencrypted on Cloud Block Storage Volumes',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's cloud infrastructure team provisions EBS volumes for core banking application servers without enabling AES-256 encryption at rest, relying on application-layer encryption for a subset of fields; when the cloud estate is inventoried during an FFIEC CAT assessment, 34 production EBS volumes holding transaction log data, audit files, and customer session data are found unencrypted. FFIEC CAT Evolving maturity-level controls require that data at rest in cloud environments be encrypted using strong cryptographic standards and that encryption be enforced through cloud configuration policy rather than relying solely on application-layer protections; the unencrypted volumes create a Gramm-Leach-Bliley Safeguards Rule gap and are flagged in the FFIEC CAT assessment as a control deficiency requiring a remediation plan with a committed timeline.`,
    keywords: ['FFIEC CAT', 'encryption at rest', 'Gramm-Leach-Bliley', 'FFIEC IT Handbook', 'EBS security'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3763',
    name: 'Cloud Security Group Allows RDP and SSH From 0.0.0.0/0 — Internet-Accessible Admin Ports on Banking Servers',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's cloud IaaS environment contains 18 production EC2 instances supporting payment processing and core banking operations whose security group configurations allow RDP (port 3389) and SSH (port 22) ingress from the public internet (0.0.0.0/0), a configuration that was set during initial deployment for temporary remote access and never hardened after go-live. FFIEC IT Handbook network security guidance and PCI DSS version 4.0 requirement 1.3 require that inbound access to production servers be restricted to authorized source IP ranges and that administrative access to cardholder data environment systems be limited to approved management networks; the open administrative ports are discovered during the bank's quarterly cloud security posture scan and classified as a critical finding requiring immediate remediation under the bank's vulnerability management SLA.`,
    keywords: ['FFIEC IT Handbook', 'PCI DSS', 'security group misconfiguration', 'cloud network security', 'NIST CSF'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3764',
    name: 'Multi-Factor Authentication Not Enforced on Cloud Console Root Accounts — FFIEC CAT Gap',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's cloud governance policy requires MFA on all cloud console access but enforcement is implemented through IAM permission boundary policies that do not apply to root account users; the AWS and Azure root accounts used during initial cloud account setup retain only password authentication, and the bank's FFIEC CAT assessment records them as hardened against unauthorized access. FFIEC CAT Baseline maturity and NIST CSF PR.AC-7 authentication controls require that all privileged user accounts, including cloud root and global administrator accounts, be protected by multi-factor authentication; when a phishing campaign targeting First Capital's IT administrators harvests root account credentials, the absence of MFA allows adversary access to the AWS root console where the attacker modifies CloudTrail logging configuration before the intrusion is detected.`,
    keywords: ['FFIEC CAT', 'MFA', 'NIST CSF', 'cloud root account', 'privileged access'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3765',
    name: 'Cloud KMS Key Rotation Policy Not Set — Encryption Keys Exceed Maximum Age for Regulated Data',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital enables customer-managed keys through AWS KMS for encrypting core banking database volumes but does not configure automatic annual key rotation, leaving the initial keys in service for 34 months — exceeding the bank's own key management policy requiring annual rotation and NIST SP 800-57 key lifecycle guidance recommending rotation for long-lived symmetric keys protecting sensitive financial data. FFIEC IT Handbook cryptographic key management guidance and PCI DSS version 4.0 requirement 3.7.4 require that encryption keys protecting cardholder data be rotated at defined intervals and that key age be monitored; the unrotated KMS keys are identified during the bank's annual cryptographic key management review as a compliance gap that requires emergency rotation and a remediation plan to implement automatic rotation enforcement across all regulated data encryption keys.`,
    keywords: ['FFIEC IT Handbook', 'KMS key rotation', 'NIST SP 800-57', 'PCI DSS', 'cryptographic key management'],
    subTopic: 'cloud-security',
  },
  {
    code: 'B3766',
    name: 'Cloud Network ACL Allows Cross-Zone Traffic Between Production and Development Environments',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's cloud virtual private cloud network design routes production and development environment subnets through a shared transit gateway without network ACL rules that block cross-environment traffic, allowing development environment servers to establish connections to production database instances when developers use IP addresses within the shared CIDR range for debugging. PCI DSS version 4.0 requirement 1.3.3 requires that production and non-production environments be logically separated such that direct traffic between them is prohibited; the cross-environment network path is exploited by a developer who uses a production database connection string committed to the development codebase to extract 50,000 customer records from the production customer data platform during a routine development workflow.`,
    keywords: ['PCI DSS', 'network ACL', 'environment segmentation', 'FFIEC IT Handbook', 'cloud network security'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3767',
    name: 'FFIEC CAT Adaptive Security Architecture Not Implemented — No Zero-Trust for Cloud Internal Traffic',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's cloud security architecture implements perimeter controls at the VPC boundary but relies on implicit trust for east-west traffic between services within the production VPC — any service within the production network can reach any other service on internal ports without authentication or mTLS. FFIEC CAT Innovative maturity-level controls and NIST SP 800-207 Zero Trust Architecture guidance require that institutions progressing to advanced cloud security maturity implement identity-based access controls for internal service-to-service traffic rather than relying solely on network perimeter trust; the implicit trust architecture means that a compromised application container can probe internal services including the payment processing API, the AML screening engine, and the customer data API without encountering an authentication challenge.`,
    keywords: ['FFIEC CAT', 'zero-trust architecture', 'NIST SP 800-207', 'FFIEC IT Handbook', 'cloud internal traffic'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3768',
    name: 'Hardcoded Database Credentials in Lambda Functions — Secrets Not Rotated in Serverless Workloads',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's cloud engineering team deploys AWS Lambda functions for event-driven transaction processing that contain hardcoded PostgreSQL connection strings with embedded database usernames and passwords in the function code package — the functions predate the team's adoption of AWS Secrets Manager and were never migrated to use dynamic credential retrieval. FFIEC IT Handbook access management and credential hygiene guidance and PCI DSS version 4.0 requirement 8.3 require that application passwords be stored using approved secrets management mechanisms with rotation policies, not embedded in application code; a code scan performed ahead of a SOC 2 Type II audit identifies hardcoded credentials in 12 Lambda function packages, some with credentials that have not been rotated in 22 months.`,
    keywords: ['FFIEC IT Handbook', 'PCI DSS', 'secrets management', 'Lambda security', 'credential rotation'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3769',
    name: 'Cloud Logging Disabled on Core Banking RDS Instances — PCI DSS Audit Trail Gap',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's cloud-hosted core banking database runs on AWS RDS with enhanced monitoring enabled but with database audit logging disabled — query logs, login events, and schema change events are not captured, creating an audit trail gap for the database tier that holds customer account balances, loan records, and transaction history. PCI DSS version 4.0 requirement 10.2 requires that audit logs capture all access to cardholder data, all administrative actions, and all changes to the audit log configuration; the absence of RDS query logging means that unauthorized data access events — including bulk data extraction queries — would not be recorded and could not be identified during forensic analysis, a finding that the bank's QSA documents as a PCI DSS non-compliance requiring immediate remediation.`,
    keywords: ['PCI DSS', 'RDS audit logging', 'FFIEC IT Handbook', 'cloud database', 'audit trail'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3770',
    name: 'CloudTrail Management Events Not Monitored — Privileged Cloud API Actions Undetected',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital enables AWS CloudTrail data event logging for S3 and Lambda but does not configure CloudTrail management event monitoring or CloudWatch alarm rules that alert on high-risk API calls — including IAM role modification, security group changes, CloudTrail disablement, and KMS key deletion. FFIEC CAT and NIST CSF DE.AE-2 detection controls require that cloud management plane activity be monitored for anomalous privileged actions; when an attacker with a compromised IAM key modifies a security group to allow exfiltration traffic and then disables CloudTrail to cover the action, the bank's SIEM does not generate an alert because the CloudTrail management event stream is not connected to the SIEM alerting rules — the breach is discovered 18 days later through a network flow anomaly.`,
    keywords: ['FFIEC CAT', 'CloudTrail', 'NIST CSF', 'cloud privileged access monitoring', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },
  {
    code: 'B3771',
    name: 'Shared Cloud Account Structure — Development and Production Workloads in Single AWS Account',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital deploys all cloud workloads — production banking systems, development environments, test infrastructure, and analytics platforms — within a single AWS account without implementing an AWS Organizations multi-account structure that provides account-level blast radius containment. PCI DSS version 4.0 and FFIEC IT Handbook cloud governance guidance require that production environments be isolated from non-production environments with controls that prevent cross-contamination; the shared account structure means that a misconfigured IAM policy in the development workloads or a compromised developer credential can reach production banking resources because account-level resource boundaries do not exist — a structural risk that the cloud security architect identifies when conducting the bank's cloud security baseline assessment.`,
    keywords: ['PCI DSS', 'AWS Organizations', 'cloud account isolation', 'FFIEC IT Handbook', 'blast radius'],
    demoRelevant: true,
    subTopic: 'cloud-security',
  },

  // ── Resilience & Recovery (B3772–B3781) ──────────────────────────────────────
  {
    code: 'B3772',
    name: 'Cloud DR Runbook Assumes Automated Failover That Was Never Deployed — Manual Steps Undocumented',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's disaster recovery plan documents an automated multi-region failover using AWS Route 53 health checks and traffic policies, but the Route 53 automated failover was descoped during the infrastructure build phase and replaced with a manual failover procedure — the DR plan documentation was never updated to reflect this change. FFIEC IT Handbook business continuity and DR testing guidance requires that recovery documentation accurately reflect implemented procedures and that manual fallback steps be fully documented; when an actual DR event requires failover activation, the response team spends 80 minutes discovering that the documented automated failover does not exist, then attempts to reconstruct the manual steps from institutional knowledge, exceeding the committed RTO by 2.5 hours and triggering an OCC incident escalation.`,
    keywords: ['FFIEC IT Handbook', 'DR runbook', 'Route 53 failover', 'ISO 22301', 'business continuity'],
    demoRelevant: true,
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3773',
    name: 'BCP Test Scope Excludes Third-Party Fintech Partners — Dependency Failures Not Simulated',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital conducts annual business continuity testing for its owned cloud infrastructure but does not include simulation of third-party fintech partner failures in the test scope — the bank's digital account opening platform, instant payment rails, and credit decisioning workflow each have external API dependencies on fintech vendors whose outage scenarios have never been tabletop- or live-tested. FFIEC IT Handbook BCP testing guidance and OCC Bulletin 2013-29 third-party risk management require that resilience tests evaluate the bank's ability to maintain critical functions when material third-party dependencies fail; when a fintech partner's API gateway experiences an unplanned 4-hour outage, the digital account opening platform fails silently because no fallback procedure was ever designed, tested, or communicated to operations staff.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2013-29', 'BCP testing', 'ISO 22301', 'fintech dependency'],
    demoRelevant: true,
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3774',
    name: 'Cloud Backup Restore Not Validated — Recovery Point Verification Skipped After Initial Setup',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital configures AWS Backup for its cloud-hosted core banking and payments databases with daily snapshots and 30-day retention, verifies the initial backup configuration at deployment, and then does not perform restore validation tests at any subsequent point — backup health metrics show successful completion but the integrity and recoverability of backup data has not been verified. FFIEC IT Handbook business continuity guidance and ISO 22301 require that backup recovery be tested periodically at a frequency appropriate to the criticality of the data; when a database corruption event in the core banking RDS instance requires restoration from backup, the restore process fails because a schema version mismatch between the backup and the current application version was never identified during the 14 months of untested backup operation.`,
    keywords: ['FFIEC IT Handbook', 'backup restore validation', 'ISO 22301', 'AWS Backup', 'cloud database recovery'],
    demoRelevant: true,
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3775',
    name: 'FedNow Participant Recovery Plan Not Tested for End-to-End Settlement Continuity',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's FedNow participation agreement requires the bank to demonstrate ability to recover payment processing capability within the Federal Reserve's participant recovery time requirements, but the bank's BCP testing for FedNow covers only the bank's own cloud infrastructure failover and does not test the end-to-end settlement workflow including the core banking ledger posting, fraud screening, and ACH origination interplay that FedNow transactions trigger downstream. The Federal Reserve's FedNow Operating Circular and FFIEC IT Handbook BCP testing guidance require that recovery tests validate the complete transaction lifecycle; when an actual cloud outage affects the bank's FedNow middleware, the recovered environment cannot process settlement confirmations because the downstream ledger posting integration was broken in the secondary region and had never been tested.`,
    keywords: ['FedNow', 'FFIEC IT Handbook', 'settlement continuity', 'ISO 22301', 'cloud DR'],
    demoRelevant: true,
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3776',
    name: 'Cloud Chaos Engineering Not Conducted — Unknown Failure Modes in Production Banking Systems',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's cloud engineering team is aware of chaos engineering principles but has not implemented any structured fault injection programme — no controlled experiments have been run to identify how the payment processing, core banking, or fraud screening services behave under compute node failure, network partition, database connection exhaustion, or dependency timeout conditions. FFIEC CAT Innovative maturity controls and NIST CSF PR.PT-5 resilience controls encourage institutions operating critical cloud workloads to proactively identify failure modes through controlled fault injection; the absence of chaos engineering means First Capital discovers its application's failure behaviour — including a cascading timeout cascade between the fraud screening and payment processing microservices — only during an actual uncontrolled outage, when discovery is maximally costly.`,
    keywords: ['FFIEC CAT', 'chaos engineering', 'NIST CSF', 'cloud resilience', 'FFIEC IT Handbook'],
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3777',
    name: 'Regulatory Notification Threshold Not Embedded in Cloud Incident Escalation — OCC 36-Hour Window Missed',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's cloud incident management process routes severity-1 incidents through a technical triage and resolution workflow but does not include an automated check against regulatory notification thresholds — the OCC Computer-Security Incident Notification Rule requires that banking organizations notify the OCC within 36 hours of discovering a computer-security incident that materially disrupts critical banking operations. When a cloud infrastructure failure causes a 3-hour outage of the bank's mobile banking and digital account access platform, the incident is resolved through the technical escalation process without triggering a regulatory notification assessment; the bank's regulatory affairs team discovers the missed notification 52 hours after incident resolution during a routine review, requiring a retroactive disclosure to the OCC.`,
    keywords: ['OCC notification', 'FFIEC IT Handbook', 'cloud incident management', 'regulatory escalation', 'NIST CSF'],
    demoRelevant: true,
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3778',
    name: 'Cloud Availability Zone Failure Not Included in BIA — Hidden Single AZ Dependency in Core Banking',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's business impact analysis identifies cloud region failure as a plausible disruption scenario and documents multi-region resilience as a mitigating control, but does not assess availability zone (AZ) level failure as a separate scenario — the core banking database cluster is deployed in a single AZ configuration for cost reasons, creating a hidden dependency that the BIA's region-level analysis obscures. FFIEC IT Handbook BIA guidance and ISO 22301 require that impact analysis scenarios reflect the granularity of the actual infrastructure dependencies; when AWS us-east-1a experiences an AZ-level power event affecting the single-AZ RDS primary database, the bank experiences a 90-minute unplanned outage that exceeds the BIA's accepted maximum tolerable downtime threshold — a scenario the BIA classified as controlled because it documented multi-region as a mitigation.`,
    keywords: ['FFIEC IT Handbook', 'business impact analysis', 'ISO 22301', 'availability zone', 'cloud single-AZ'],
    demoRelevant: true,
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3779',
    name: 'RTO/RPO Metrics Not Reported to Board Risk Committee — BCP Gaps Invisible to Governance',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's board risk committee receives a quarterly operational risk report that includes business continuity status but reports only whether BCP tests were completed on schedule — it does not report the tested RTO and RPO achieved versus committed values, gaps between cloud architecture capabilities and BCP commitments, or open remediation items from prior year BCP test findings. FFIEC IT Handbook corporate governance guidance and ISO 22301 require that senior leadership and the board receive sufficient information about business continuity performance to make informed risk acceptance decisions; the absence of RTO/RPO gap reporting means the board is approving a BCP that on paper commits to a 2-hour RTO while the technology team knows the tested recovery time is 4.5 hours — a material gap that the board has never been asked to accept or remediate.`,
    keywords: ['FFIEC IT Handbook', 'ISO 22301', 'board risk committee', 'RTO reporting', 'BCP governance'],
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3780',
    name: 'Cloud Service Degradation Below Full Outage Not Covered by BCP — Partial Failure Procedures Absent',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's BCP documents procedures for full cloud region outages and for on-premises system failures but does not document response procedures for partial cloud service degradations — scenarios where the cloud provider's API gateway is operating at 30% capacity, where managed database read replicas are unavailable but the primary is functioning, or where cloud DNS is intermittently failing. FFIEC IT Handbook business continuity guidance requires that BCPs address a range of disruption scenarios including partial degradation and not only complete outages; the absence of partial-degradation procedures means that when AWS CloudFront experiences a 40% capacity degradation affecting the bank's digital banking portal, operations staff follow the full-outage playbook, unnecessarily triggering customer communications and regulatory notifications that create reputational and regulatory cost for a manageable degradation event.`,
    keywords: ['FFIEC IT Handbook', 'BCP', 'cloud service degradation', 'ISO 22301', 'partial outage'],
    subTopic: 'resilience-recovery',
  },
  {
    code: 'B3781',
    name: 'Warm Standby DR Architecture Insufficiently Funded — DR Environment Scaled at 10% of Production Capacity',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's cloud DR architecture uses a warm standby model in the secondary region with infrastructure scaled at 10% of production capacity to minimize standing DR costs; the BCP documents the RTO as the time to promote the secondary region to primary, but the scale-up time required to grow the DR environment from 10% to 100% of production capacity is not included in the RTO calculation. FFIEC IT Handbook BCP guidance and ISO 22301 require that stated RTOs reflect the complete end-to-end recovery timeline including all infrastructure provisioning steps; when the primary region is declared unavailable during a DR exercise, the total recovery time including scale-up of the DR environment is 5.5 hours rather than the documented 2-hour RTO — a discrepancy that invalidates the bank's OCC BCP submission and requires immediate restatement of committed recovery objectives.`,
    keywords: ['FFIEC IT Handbook', 'warm standby', 'ISO 22301', 'RTO calculation', 'DR capacity'],
    demoRelevant: true,
    subTopic: 'resilience-recovery',
  },

  // ── Cloud Vendor Risk (B3782–B3789) ──────────────────────────────────────────
  {
    code: 'B3782',
    name: 'Cloud Provider SOC 2 Bridge Letter Gap — 6-Month Coverage Gap Before Annual Report Renewal',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital relies on its primary cloud managed services provider's annual SOC 2 Type II report for third-party assurance, but the provider's report covers the 12 months ending September 30 and is not issued until February of the following year — creating a 6-month period from October through March where the bank's TPRM programme has no current independent assurance over the cloud provider's controls. OCC Bulletin 2013-29 third-party risk management guidance requires that institutions maintain current third-party assurance; when the OCC conducts an IT examination in November, the bank cannot produce a current SOC 2 report and has not requested a bridge letter from the provider to cover the gap period — a TPRM documentation failure that the OCC documents as a deficiency in the bank's third-party risk oversight.`,
    keywords: ['OCC Bulletin 2013-29', 'SOC 2 Type II', 'bridge letter', 'TPRM', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'cloud-vendor-risk',
  },
  {
    code: 'B3783',
    name: 'Cloud Provider Subprocessor List Not Reviewed After Contract Signing — New Subprocessors Unvetted',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital reviews the cloud managed services provider's subprocessor list during vendor due diligence at contract inception but does not subscribe to subprocessor change notifications or conduct periodic reviews; over 18 months, the provider adds 4 new subprocessors including a data analytics firm that processes usage telemetry containing metadata about banking transaction types. OCC Bulletin 2013-29 and FFIEC IT Handbook fourth-party risk management requirements mandate that institutions monitor changes to the subprocessor chains of critical third parties; the unreviewed subprocessor addition means First Capital's TPRM inventory does not reflect the current third-party chain, and the bank cannot confirm whether the new analytics subprocessor processes data subject to Gramm-Leach-Bliley Safeguards Rule protections.`,
    keywords: ['OCC Bulletin 2013-29', 'cloud subprocessor', 'TPRM', 'Gramm-Leach-Bliley', 'fourth-party risk'],
    subTopic: 'cloud-vendor-risk',
  },
  {
    code: 'B3784',
    name: 'Cloud Provider Financial Viability Not Assessed — Critical Banking Workload on Undercapitalized Vendor',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital migrates its commercial loan origination platform to a cloud SaaS provider that was selected on feature and price criteria; the TPRM onboarding review does not include financial viability assessment because the vendor's category was classified as "non-critical" — a classification that was not revisited when the bank's commercial lending team began routing all origination workflow through the platform. OCC Bulletin 2013-29 third-party risk management guidance requires that concentration risk and financial viability assessments be conducted for third parties whose failure would significantly disrupt the bank's operations regardless of the initial risk classification; when the SaaS provider files for Chapter 11 bankruptcy, First Capital has no exit plan, no data export, and no alternative origination workflow — creating a 6-week manual processing backlog during the bankruptcy proceedings.`,
    keywords: ['OCC Bulletin 2013-29', 'vendor financial viability', 'TPRM', 'cloud SaaS risk', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'cloud-vendor-risk',
  },
  {
    code: 'B3785',
    name: 'Cloud Provider Contractual SLA Does Not Include Incident Root Cause Timeline — Regulatory Gap',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's cloud managed services agreement specifies uptime SLA credit provisions but does not require the provider to deliver a post-incident root cause analysis within a defined timeframe; when the provider's infrastructure experiences an outage affecting First Capital's payment processing for 2.5 hours, the bank receives a brief incident summary but no root cause analysis — required for the bank's OCC incident notification and BCBS 239 operational risk reporting. OCC Bulletin 2013-29 third-party contract requirements include expectations for incident documentation and root cause reporting; the contractual gap means First Capital must submit an incomplete OCC incident notification and cannot close the operational risk event in its risk management system because the root cause remains unconfirmed 45 days after the incident.`,
    keywords: ['OCC Bulletin 2013-29', 'cloud SLA', 'incident root cause', 'BCBS 239', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'cloud-vendor-risk',
  },
  {
    code: 'B3786',
    name: 'Cloud Exit Transition Cost Not Modeled — Regulatory-Required Exit Exercise Surfaces $8M Unbudgeted Cost',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital documents a cloud exit plan as part of its OCC Bulletin 2023-17 compliance programme, but the exit plan is a high-level narrative without a financial model quantifying the data migration, re-platforming, retraining, and transition vendor costs associated with moving core banking and payments workloads to an alternative provider. OCC Bulletin 2023-17 and OCC Bulletin 2013-29 require that exit plans be credible and executable, which includes financial feasibility; when First Capital's TPRM team commissions a financial model as part of an OCC examination preparation exercise, the modeled exit cost is $8.2M over 18 months — an amount for which no budget exists, rendering the documented exit plan non-credible and requiring the bank to either fund a contingency reserve or strengthen its vendor concentration risk controls.`,
    keywords: ['OCC Bulletin 2023-17', 'OCC Bulletin 2013-29', 'cloud exit plan', 'TPRM', 'vendor concentration'],
    demoRelevant: true,
    subTopic: 'cloud-vendor-risk',
  },
  {
    code: 'B3787',
    name: 'Hyperscaler API Deprecation Not Tracked — Core Banking Integration Breaks on Scheduled Retirement',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking integration middleware uses AWS SDK API calls that include three deprecated API versions scheduled for retirement in the provider's published deprecation roadmap; the bank's technology team does not subscribe to AWS deprecation notices and has no process for tracking planned API retirements that could affect production integrations. OCC Bulletin 2013-29 third-party risk management and FFIEC IT Handbook change management guidance require that institutions proactively manage technology dependency lifecycles; when AWS retires the deprecated API endpoints on the scheduled date, the core banking middleware throws unhandled exceptions that prevent overnight batch processing from completing — a service disruption caused entirely by a known, scheduled change that the bank's TPRM programme failed to capture.`,
    keywords: ['OCC Bulletin 2013-29', 'API deprecation', 'FFIEC IT Handbook', 'dependency lifecycle', 'change management'],
    subTopic: 'cloud-vendor-risk',
  },
  {
    code: 'B3788',
    name: 'Cloud Provider Regulatory Examination Access Provision Not Enforced — OCC Access Right Waived in Contract',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's cloud managed services contract does not include a provision granting OCC examiners the right to access the provider's facilities, personnel, and records related to services provided to the bank — a contractual right that OCC Bulletin 2013-29 requires in all third-party contracts for critical functions. The bank's legal team accepted the provider's standard terms at contract signing without negotiating the regulatory examination access clause; when OCC examiners request access to the cloud provider's physical data centre facilities and compliance team during an IT examination, the bank discovers the contractual gap and must request an emergency contract amendment — a process that takes 6 weeks and delays the examination schedule.`,
    keywords: ['OCC Bulletin 2013-29', 'regulatory examination access', 'cloud contract', 'TPRM', 'OCC Bulletin 2023-17'],
    demoRelevant: true,
    subTopic: 'cloud-vendor-risk',
  },
  {
    code: 'B3789',
    name: 'Multi-Cloud Vendor Governance Not Consolidated — Three Hyperscalers Managed in Separate Silos',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital uses AWS for core banking infrastructure, Azure for identity and collaboration workloads, and GCP for AI and analytics workloads, but each hyperscaler relationship is managed by a different IT team using provider-specific governance processes — there is no consolidated cloud vendor management programme that provides an aggregate view of concentration risk, regulatory data exposure, combined spend, and cross-provider incident correlation. FFIEC IT Handbook third-party management guidance requires that the overall risk from third-party relationships be assessed at the portfolio level rather than relationship-by-relationship; the siloed governance structure means the bank's TPRM programme underestimates total cloud concentration risk, cannot identify cross-provider data sovereignty gaps, and misses correlated outage risk from shared fourth-party CDN and DNS vendors used by all three hyperscalers.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2013-29', 'multi-cloud governance', 'TPRM', 'cloud concentration'],
    subTopic: 'cloud-vendor-risk',
  },

  // ── AI / Cloud Tech Risk (B3790–B3807) ───────────────────────────────────────
  {
    code: 'B3790',
    name: 'GenAI Customer Chatbot Deployed Without SR 11-7 Model Risk Governance — Unvalidated LLM in Production',
    officeCategory: 'front_office',
    failureRatePct: 82,
    description:
      `First Capital deploys a GenAI-powered customer service chatbot using a vendor-hosted LLM for account inquiries, dispute guidance, and product recommendations without conducting an SR 11-7 model risk management review — the chatbot is categorized as a "software tool" rather than a "model" in the bank's model inventory, bypassing MRM validation requirements. SR 11-7 defines a model as any quantitative method or system that generates outputs used to inform business decisions including customer-facing communications that guide financial product choices; when the chatbot begins recommending a high-fee overdraft product to customers who ask about managing low balances — a recommendation pattern the vendor's default system prompt creates — the bank faces CFPB scrutiny for unfair, deceptive, or abusive acts or practices (UDAAP) associated with AI-generated product recommendations that were never validated.`,
    keywords: ['SR 11-7', 'GenAI chatbot', 'CFPB UDAAP', 'OCC Bulletin 2023-17', 'LLM model risk'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3791',
    name: 'LLM API Calls Include Unmasked PII in Prompt Context — Gramm-Leach-Bliley Safeguards Violation',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description:
      `First Capital's commercial banking relationship management team uses an internal AI assistant powered by a third-party LLM API; the prompt construction code passes customer names, account numbers, credit scores, and tax identification numbers as unmasked context strings to the LLM inference endpoint — data that traverses the vendor's inference infrastructure and may be included in the vendor's request logging. OCC Bulletin 2023-17 and FFIEC IT Handbook requirements for AI tool governance require that data minimization and masking controls be applied before regulated customer financial data is passed to third-party AI API endpoints; the absence of pre-prompt PII masking creates a Gramm-Leach-Bliley Safeguards Rule violation where customer financial data is disclosed to a third-party AI provider without a qualifying business purpose exception or contractual data processing agreement.`,
    keywords: ['OCC Bulletin 2023-17', 'LLM PII masking', 'Gramm-Leach-Bliley', 'FFIEC IT Handbook', 'GenAI data handling'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3792',
    name: 'AI Credit Underwriting Model Deployed in Cloud Without ECOA Adverse Action Explainability',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital deploys a cloud-hosted gradient boosting AI model for small business loan underwriting that uses 420 input features drawn from transaction history, behavioral signals, and alternative data; the model's complex feature interactions cannot produce plain-language principal reasons for adverse action decisions, as required under the Equal Credit Opportunity Act adverse action notice regulation. The CFPB's 2023 guidance on AI credit models and SR 11-7 model risk governance require that AI credit models used for adverse action decisions provide regulatorily compliant adverse action notices that accurately describe the primary reasons for denial; when the CFPB examines First Capital's small business lending programme, adverse action notices citing generic model categories rather than principal reason factors are identified as ECOA violations requiring model redesign or supplemental explainability tooling.`,
    keywords: ['SR 11-7', 'ECOA adverse action', 'CFPB', 'AI credit model', 'explainability'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3793',
    name: 'Cloud-Based AI Fraud Model Threshold Tuned for Cost Reduction Without FFIEC CAT Validation',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's cloud-hosted AI fraud detection model for card-not-present transactions has its decisioning threshold adjusted from 0.65 to 0.75 by the fraud operations team to reduce false positive alert volume and manual review costs; the threshold change is implemented through the MLOps platform configuration interface without triggering the bank's SR 11-7 model change governance process. SR 11-7 treats changes to model thresholds that materially alter risk decisions as model changes requiring MRM committee review and back-testing; when fraud losses increase 34% in the quarter following the threshold change, the MRM committee's retrospective review finds that the threshold was moved without testing the impact on fraud loss rates across demographic customer segments — raising fair lending concerns about disparate fraud screening thresholds.`,
    keywords: ['SR 11-7', 'fraud AI model', 'FFIEC CAT', 'model threshold change', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3794',
    name: 'GenAI Regulatory Report Drafting Tool Deployed Without Human Review Gate — Hallucinated Figures Filed',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital deploys a GenAI tool to assist compliance staff in drafting FFIEC Call Report narratives and OCC examination responses, using an LLM that generates text referencing specific financial figures from retrieved documents; the workflow does not include a mandatory human verification step that confirms all figures in the AI-drafted regulatory submission match source financial data before filing. FFIEC IT Handbook AI governance guidance and OCC Bulletin 2023-17 require that AI tools producing outputs used in regulatory submissions be subject to human review and validation; when an LLM hallucination produces an incorrect Tier 1 capital ratio figure in a draft OCC examination response that is submitted without verification, the bank must file a corrected response and disclose the use of unvalidated GenAI in a regulatory submission — a governance failure that the OCC documents as part of the examination record.`,
    keywords: ['OCC Bulletin 2023-17', 'GenAI hallucination', 'FFIEC IT Handbook', 'regulatory reporting', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3795',
    name: 'AI Model Drift in Cloud-Hosted Credit Scorecard — Quarterly Monitoring Cadence Too Infrequent for Real-Time Economy Shifts',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's cloud-hosted consumer credit scorecard is monitored for concept drift on a quarterly basis using Population Stability Index and Characteristic Analysis reports; during a rapid macroeconomic shift where unemployment increases 2.1 percentage points in 45 days, the quarterly monitoring cadence fails to detect significant model drift that causes the scorecard to systematically underestimate default probability for newly unemployed borrowers until the quarterly report is produced. SR 11-7 model risk management guidance requires that model monitoring frequency be commensurate with the pace of change in the model's operating environment; the quarterly monitoring gap allows 8,200 credit decisions to be made using a demonstrably drifted scorecard during the economic stress period, creating a CECL provisioning revision and potential fair lending exposure related to underwriting decisions made under degraded model accuracy.`,
    keywords: ['SR 11-7', 'model drift monitoring', 'CECL', 'credit scorecard', 'AI cloud monitoring'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3796',
    name: 'AI-Powered AML Transaction Monitoring Platform Not Validated Under OCC Model Risk Standards',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital replaces its legacy rules-based AML transaction monitoring system with a vendor-provided AI/ML platform that uses unsupervised anomaly detection and supervised alert scoring; the vendor positions the platform as a "rules engine with AI enhancement," and First Capital's compliance team does not submit it for SR 11-7 model validation because it was not categorized as a model in the MRM inventory. FinCEN guidance on automated AML monitoring and SR 11-7 model risk management standards both apply to AI-based transaction monitoring systems used for BSA/AML compliance; when FinCEN examiners review First Capital's AML programme, the absence of independent model validation for the AI monitoring platform — including back-testing against known typologies, false negative rate analysis, and demographic bias assessment — is cited as a significant AML programme deficiency.`,
    keywords: ['SR 11-7', 'BSA/AML', 'AI transaction monitoring', 'FinCEN', 'OCC model validation'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3797',
    name: 'LLM-Based Internal Knowledge Assistant Retrieves Confidential M&A Documents Without Access Control',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital deploys a RAG-based LLM knowledge assistant using an enterprise vector search index built from SharePoint documents; the index includes confidential M&A analysis documents, board pre-approval materials, and non-public customer credit files that were ingested from shared drives without document-level access control enforcement in the retrieval layer. FFIEC IT Handbook information security guidance and SEC Regulation FD requirements for material non-public information handling require that systems accessing confidential documents enforce role-based access controls that reflect the original document access permissions; the knowledge assistant surfaces M&A target analysis to a junior analyst who asks a general question about competitive strategy — creating an insider information access event that triggers a securities law review.`,
    keywords: ['FFIEC IT Handbook', 'RAG AI', 'MNPI', 'SEC Regulation FD', 'LLM access control'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3798',
    name: 'AI-Generated Compliance Policy Summaries Contain Outdated Regulatory Requirements — Stale Training Cutoff',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital deploys a GenAI tool to summarize regulatory compliance requirements for business units, using a foundation model with a training cutoff of mid-2023; when staff use the AI to look up current CFPB small business data collection requirements under Section 1071 of Dodd-Frank, the AI produces a summary based on the pre-final-rule regulatory landscape that does not reflect the final rule's specific data fields, thresholds, and implementation timelines. OCC Bulletin 2023-17 AI governance and FFIEC IT Handbook guidance require that AI tools providing compliance guidance be validated for accuracy against current regulatory requirements and that model knowledge cutoffs be clearly disclosed; compliance staff following the AI-generated guidance implement an incomplete Section 1071 data collection programme that requires corrective action after an examination finding.`,
    keywords: ['OCC Bulletin 2023-17', 'GenAI compliance tool', 'CFPB Section 1071', 'FFIEC IT Handbook', 'model knowledge cutoff'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3799',
    name: 'AI Scoring Model Retrained on Biased Historical Approval Data — ECOA Disparate Impact Perpetuated',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital retrains its cloud-hosted mortgage pre-qualification AI model on 5 years of historical approval and denial data without conducting a disparate impact analysis on the training set — the historical approvals reflect lending patterns from a period when the bank's geographic footprint systematically underserved minority neighborhoods, causing the retrained model to perpetuate the same geographic-proxy discrimination encoded in the historical approvals. SR 11-7 model risk management and the CFPB's 2023 AI fair lending guidance require that model training data be assessed for historical bias before use in model training; the model's disparate impact on Black and Hispanic applicants — a 19% lower approval rate after controlling for creditworthiness — is identified during the OCC's fair lending examination as a Regulation B ECOA violation requiring model retraining and retrospective borrower analysis.`,
    keywords: ['SR 11-7', 'ECOA disparate impact', 'CFPB fair lending', 'AI bias', 'Regulation B'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3800',
    name: 'GenAI Contract Review Tool Misses Material Loan Covenant — AI Output Not Legally Reviewed Before Execution',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's commercial lending team deploys a GenAI contract review assistant to identify material covenants, representations, and conditions in commercial loan agreements; the AI tool misses a cross-default clause in a $45M syndicated facility because the clause is embedded in a schedule with non-standard formatting that the model's document chunking strategy splits across retrieval segments. OCC Bulletin 2023-17 and SR 11-7 model risk governance require that AI tools used in material credit process steps be subject to human review gates and that the scope of AI analysis be clearly defined; the missed cross-default clause is discovered by outside counsel during a portfolio review 14 months after execution, when a borrower default on another facility would have triggered the cross-default under the missed clause — a credit risk management failure attributable to over-reliance on unvalidated GenAI analysis.`,
    keywords: ['OCC Bulletin 2023-17', 'SR 11-7', 'GenAI contract review', 'commercial lending', 'AI credit risk'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3801',
    name: 'AI-Assisted KYC Onboarding Accepts Synthetic Identity Documents — FRAML Risk From GenAI Fraud',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an AI-powered digital KYC onboarding platform that uses computer vision and NLP to verify identity documents; adversaries use GenAI-generated synthetic identity documents — deepfake state IDs with plausible biometric photos and fabricated data registry entries — that the AI verification model was not trained to detect because the training data predates the GenAI-enabled synthetic document generation capabilities available in 2024. FinCEN's Customer Due Diligence Rule and OCC BSA/AML examination guidelines require that CDD programmes be updated to address emerging fraud typologies; when First Capital's AI onboarding platform approves 180 synthetic identity accounts that are subsequently used for first-party fraud, the BSA/AML examination finding cites failure to adapt CDD controls to the GenAI-enabled synthetic identity threat as a programme deficiency.`,
    keywords: ['BSA/AML', 'KYC', 'FinCEN CDD Rule', 'GenAI fraud', 'synthetic identity'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3802',
    name: 'AI Model Inventory Does Not Include Third-Party LLM APIs — SR 11-7 Model Inventory Incomplete',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital maintains an SR 11-7 model inventory that includes internally developed quantitative models for credit, market, and operational risk, but does not capture third-party LLM API integrations used for customer communication drafting, document analysis, and compliance summarization — these are classified as "SaaS tools" rather than models in the inventory. SR 11-7 model risk guidance and OCC model risk examination guidance require that the model inventory be comprehensive and include all models that meet the definition regardless of whether they are internally developed or accessed through a vendor API; when OCC examiners request the bank's model inventory as part of an MRM examination, the 14 production LLM API integrations are absent, creating an SR 11-7 model inventory completeness finding that requires back-filing risk tiers and validation plans for each excluded AI system.`,
    keywords: ['SR 11-7', 'model inventory', 'OCC model risk', 'LLM API governance', 'OCC Bulletin 2023-17'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3803',
    name: 'AI Liquidity Forecasting Model Deployed Without BCBS 239 Data Lineage Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys a cloud-hosted LSTM neural network model for intraday liquidity forecasting that ingests real-time payment flows, reserve position data, and correspondent bank confirmation messages; the model's feature engineering pipeline aggregates and transforms data from 6 source systems without maintaining BCBS 239-compliant data lineage documentation that traces each model input to its authoritative source system. BCBS 239 Principle 2 requires that risk data be accurate and that risk models have documented data lineage from source systems to risk outputs; when First Capital submits its liquidity adequacy report to the Federal Reserve under LCR rules, examiners note that the AI forecasting model's data lineage documentation does not satisfy BCBS 239 requirements, creating an operational risk data quality finding that must be remediated before the model can be used in supervisory stress scenarios.`,
    keywords: ['BCBS 239', 'SR 11-7', 'liquidity AI model', 'data lineage', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3804',
    name: 'Automated AI News Monitoring Tool Generates Adverse Media False Positives for BSA Name Screening',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI-powered adverse media screening tool that uses NLP entity extraction to identify regulatory sanctions, criminal charges, and negative news associated with commercial banking customers; the model's entity resolution logic generates a 42% false positive rate for common-name matches, flooding the BSA compliance team with adverse media alerts on legitimate customers whose names match unrelated adverse subjects. FinCEN SAR filing guidance and OCC BSA/AML examination expectations require that automated screening tools be calibrated for accuracy and that false positive rates not impair the compliance team's ability to investigate genuine alerts; the high false positive volume creates a triaging backlog that causes the compliance team to miss three genuine adverse media hits that should have triggered enhanced due diligence, documented as an AML programme quality gap in the OCC's examination findings.`,
    keywords: ['BSA/AML', 'FinCEN', 'adverse media AI', 'NLP entity resolution', 'OCC Bulletin 2013-29'],
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3805',
    name: 'Cloud-Hosted AI Customer Segmentation Model Used for CRA Assessment Without Fair Lending Review',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital uses a cloud-hosted ML customer segmentation model to identify low-to-moderate income geographies for CRA performance planning; the model uses demographic proxy variables derived from census tract data that are correlated with protected classes under the Fair Housing Act — ZIP code median income, homeownership rate, and language preference inferred from mobile app locale settings. The OCC's CRA guidance and the CFPB's 2023 AI fair lending examination procedures require that AI models informing CRA strategy and geographic service area decisions be reviewed for proxy discrimination; when the OCC CRA examination team requests the model documentation, the absence of a fair lending proxy variable analysis creates an examination finding that the bank's CRA planning process incorporates unvalidated demographic proxies that could constitute disparate treatment in service area design.`,
    keywords: ['CRA', 'CFPB fair lending', 'SR 11-7', 'AI segmentation', 'Fair Housing Act'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3806',
    name: 'AI-Driven Cloud Auto-Scaling Causes Production Outage During Anti-Money Laundering Batch Window',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's cloud infrastructure uses an AI-driven auto-scaling platform that predicts compute demand and preemptively scales resources down during identified low-utilization periods; the AI scaling model misclassifies the nightly AML transaction monitoring batch window as low-priority because the batch jobs have low CPU utilization per job while running thousands of parallel jobs — the aggregate memory and IOPS demand pattern is not represented in the model's training features. OCC Bulletin 2023-17 AI tool governance and FFIEC IT Handbook infrastructure change management guidance require that AI-driven infrastructure automation tools be tested for correctness across all production workload types before production deployment; when the auto-scaler terminates 60% of the AML batch processing nodes during the nightly transaction screening run, the batch fails to complete before the SAR filing deadline, creating a BSA programme compliance gap.`,
    keywords: ['OCC Bulletin 2023-17', 'AI auto-scaling', 'BSA/AML', 'FFIEC IT Handbook', 'cloud infrastructure AI'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },
  {
    code: 'B3807',
    name: 'GenAI Tool Vendor Training Data Opt-Out Not Exercised — Bank Data Used to Train Commercial LLM',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital deploys a GenAI productivity tool that processes customer service tickets, internal memos, and credit decision rationales; the vendor's default terms allow API input data to be used for model improvement unless the enterprise customer explicitly opts out of training data use within 30 days of contract signing — the bank's procurement team does not identify or exercise the opt-out, and 8 months of customer interaction data is used to train the vendor's commercial foundation model. Gramm-Leach-Bliley Safeguards Rule requirements and OCC Bulletin 2023-17 third-party AI governance standards require that banks assess and contractually control how AI vendors use bank-related data; the failure to exercise the training opt-out means regulated customer interaction data — including account numbers, dispute reasons, and credit rationales — has been used to train a commercial AI model whose customers include the bank's competitors.`,
    keywords: ['OCC Bulletin 2023-17', 'GenAI training data', 'Gramm-Leach-Bliley', 'FFIEC IT Handbook', 'vendor data use'],
    demoRelevant: true,
    subTopic: 'ai-cloud-tech-risk',
  },

  // ── Technology Change Management (B3808–B3819) ────────────────────────────────
  {
    code: 'B3808',
    name: 'Emergency Change Procedure Overused — 40% of Cloud Changes Bypass CAB Review',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's IT change management policy includes an emergency change procedure that allows production infrastructure changes to bypass change advisory board (CAB) review with post-hoc approval; over 12 months, the emergency change procedure is used for 40% of all cloud infrastructure changes — including routine security patches and configuration updates that are classified as emergency to avoid the weekly CAB scheduling cadence. FFIEC IT Handbook change management guidance requires that the emergency change procedure be reserved for genuine operational emergencies and that circumvention of the standard approval process be monitored as an indicator of change process quality; when the OCC IT examiner reviews the change management report, the 40% emergency change rate is identified as evidence that the change management control is ineffective — changes are bypassing independent review at a rate that makes the CAB approval meaningless as a risk control.`,
    keywords: ['FFIEC IT Handbook', 'change management', 'CAB review', 'NIST CSF', 'emergency change'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3809',
    name: 'Patch Management SLA Not Met for Cloud OS Images — Critical CVEs Aged 90+ Days in Production',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's patch management policy requires that critical-severity CVEs be remediated within 30 days on all production systems; a quarterly cloud asset inventory review finds 43 production EC2 instances running operating system versions with critical CVEs that are 90–180 days old — the patching backlog exists because cloud OS image updates require application regression testing that the operations team has not scheduled. FFIEC IT Handbook vulnerability management guidance and PCI DSS version 4.0 requirement 6.3 require that critical vulnerabilities be patched within defined timelines and that patch management KPIs be monitored and escalated when SLAs are breached; the 43 over-aged critical CVEs include vulnerabilities in the OpenSSL and Linux kernel that are actively exploited in banking sector attacks, creating a regulatory examination finding that requires an immediate remediation plan with milestone tracking.`,
    keywords: ['FFIEC IT Handbook', 'patch management', 'PCI DSS', 'NIST CSF', 'vulnerability management'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3810',
    name: 'Configuration Drift in Cloud Production Environment — Infrastructure-as-Code State Diverges From Live Config',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital manages its cloud infrastructure using Terraform state files maintained in a GitOps repository, but the operations team makes emergency manual changes to security groups, load balancer rules, and auto-scaling configurations through the AWS console during incidents — these changes are not back-ported to the Terraform state, causing the IaC definition to diverge from the running infrastructure. FFIEC IT Handbook change management and NIST CSF PR.IP-1 baseline configuration controls require that production infrastructure be maintained in a known, documented configuration and that deviations be detected and reconciled; the 14 undocumented manual configuration changes discovered during the next Terraform plan run include a security group rule change that removed an outbound restriction on the payment processing subnet, creating an unintentional network path that the security team had not approved.`,
    keywords: ['FFIEC IT Handbook', 'NIST CSF', 'configuration drift', 'Terraform', 'infrastructure-as-code'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3811',
    name: 'Cloud Third-Party Component Inventory Not Maintained — SBOM Absent for Banking Application Stack',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's cloud-hosted banking applications use a complex dependency tree of open-source libraries, third-party SDKs, and cloud provider-maintained packages, but the bank does not maintain a software bill of materials (SBOM) that catalogues the full component inventory — making it impossible to determine which applications are affected when a critical vulnerability like log4shell or a major OpenSSL CVE is announced. FFIEC IT Handbook vulnerability management guidance and NIST Cybersecurity Supply Chain Risk Management guidelines recommend that organizations maintain SBOMs for production applications to enable rapid impact assessment when component vulnerabilities are disclosed; the absence of an SBOM means that First Capital's response to a major open-source vulnerability announcement requires a 2-week manual inventory effort before remediation scope is understood — a delay that keeps critical banking systems exposed while the inventory is assembled.`,
    keywords: ['FFIEC IT Handbook', 'SBOM', 'NIST CSF', 'vulnerability management', 'software supply chain'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3812',
    name: 'Cloud Database Schema Changes Deployed Without DBA Review — Silent Data Integrity Regression',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's application development teams use database migration frameworks (Flyway/Liquibase) that allow developers to commit and automatically deploy schema changes to production databases through the CI/CD pipeline without a mandatory DBA review step; a developer adds a nullable foreign key constraint migration that bypasses referential integrity enforcement for a critical account-to-transaction relationship table. FFIEC IT Handbook change management and development lifecycle guidance require that database schema changes affecting production financial data be reviewed by qualified personnel before deployment; the bypassed DBA review allows 3 weeks of transaction records to be inserted without proper account linkage, creating a GL reconciliation discrepancy that requires a $1.8M manual adjustment and a regulatory operational risk event report.`,
    keywords: ['FFIEC IT Handbook', 'database change management', 'schema migration', 'data integrity', 'CI/CD'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3813',
    name: 'Cloud Vendor Patch Not Tested in Non-Production Before Production Deployment — Payment Processing Outage',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's cloud managed services provider pushes a mandatory security patch to the bank's managed Kubernetes control plane nodes during a maintenance window; the bank's change management process classifies provider-initiated mandatory patches as exempt from the standard non-production testing requirement because the provider's patch validation process is trusted. FFIEC IT Handbook change management guidance requires that all changes to production systems — including vendor-initiated patches — be tested in a non-production environment that matches production configuration before being applied to production; when the Kubernetes control plane patch contains a breaking change to a pod scheduling API that the bank's payment processing workloads depend on, the payments cluster experiences a 90-minute disruption before the incompatibility is identified and the patch is rolled back.`,
    keywords: ['FFIEC IT Handbook', 'Kubernetes patching', 'change management', 'vendor patch', 'payment outage'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3814',
    name: 'Technology Risk Appetite Not Calibrated for Cloud Change Velocity — Board Threshold Predates Agile Cadence',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's board-approved technology risk appetite statement defines acceptable levels of technology change risk using metrics calibrated for a waterfall delivery model — quarterly releases, 60-day change freezes around regulatory reporting windows, and a maximum of 50 production changes per month. Following cloud migration and adoption of agile delivery, the bank's production change rate has grown to 400+ changes per month, well above the board-approved threshold, which technically triggers a risk appetite breach every month but is not escalated because the technology team considers the threshold obsolete. FFIEC IT Handbook IT risk governance guidance requires that risk appetite statements be reviewed when the operating environment changes materially; the misalignment between the stated risk appetite and actual operating practice creates a governance gap where the board believes it has approved a change risk limit that the bank is systematically exceeding without escalation or re-approval.`,
    keywords: ['FFIEC IT Handbook', 'technology risk appetite', 'change management', 'board governance', 'OCC examination'],
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3815',
    name: 'Cloud Release Freeze Policy Not Enforced During DFAST Submission Window — Material System Change During Regulatory Deliverable',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital maintains a release freeze policy that prohibits material cloud infrastructure changes during the 45 days surrounding DFAST and CCAR regulatory submission windows, but the policy is implemented as a guidance document without automated enforcement in the CI/CD pipeline; during a DFAST submission window, an infrastructure team deploys a cloud database configuration change that alters query plan caching behavior, changing the output of the bank's capital planning models by 0.03% — a difference that must be explained in the DFAST submission. FFIEC IT Handbook change management guidance and OCC DFAST examination standards require that capital modelling environments be stable during regulatory submission periods; the uninvestigated model output change delays the DFAST submission by 8 days as the model risk team traces the change to the database configuration update.`,
    keywords: ['FFIEC IT Handbook', 'DFAST', 'CCAR', 'change freeze', 'cloud change management'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3816',
    name: 'End-of-Life Cloud OS Components Not Remediated — Ubuntu 20.04 LTS Support Expiry Creates Compliance Gap',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's cloud infrastructure inventory contains 62 production Ubuntu 20.04 LTS instances running core banking application components; when Ubuntu 20.04 LTS reaches end-of-life and Canonical ceases publishing security updates, the bank has no upgrade plan funded or scheduled and continues running the EOL OS in production banking workloads. FFIEC IT Handbook patch management and vulnerability management guidance and PCI DSS version 4.0 requirement 6.3 require that production systems run supported OS versions that receive security updates; the continued operation of EOL Ubuntu instances means First Capital cannot satisfy PCI DSS 6.3's requirement that all system components receive security patches, creating a sustained PCI non-compliance finding and an FFIEC CAT vulnerability management maturity gap.`,
    keywords: ['FFIEC IT Handbook', 'PCI DSS', 'end-of-life OS', 'patch management', 'FFIEC CAT'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3817',
    name: 'Cloud API Gateway Version Migration Without Regression Suite — 200 Integrations Impacted Silently',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital migrates its AWS API Gateway from the v1 REST API format to v2 HTTP API format to reduce latency and cost; the migration is executed across all 200 API integrations simultaneously without a regression testing suite that validates behavioral equivalence — the v2 API has different request/response payload handling for binary content types that affects PDF document upload endpoints used by mortgage and commercial lending applications. FFIEC IT Handbook development and change management guidance requires that platform migrations affecting multiple business-critical integrations be tested with a representative regression suite before production deployment; the simultaneous cutover causes document upload failures in 14 lending applications that are discovered only when loan officers report inability to attach collateral documentation — an issue that is traced back to the API gateway version migration 3 days after deployment.`,
    keywords: ['FFIEC IT Handbook', 'API gateway migration', 'regression testing', 'change management', 'cloud platform migration'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3818',
    name: 'Change Management Metrics Not Included in Technology Risk Dashboard — Repeat Failures Invisible',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's technology risk dashboard reported to the chief risk officer and board risk committee includes metrics on availability, patch compliance, and security incidents, but does not include change management quality metrics — change-related incident rate, emergency change volume, rollback frequency, or mean time between change-induced outages — that would reveal systemic change process deficiencies. FFIEC IT Handbook IT risk governance guidance requires that the risk reporting framework capture the quality of change management as a leading indicator of operational technology risk; the absence of change management metrics means the board and CRO are unaware that 28% of severity-1 cloud incidents in the prior year were caused by change-induced failures — a pattern that is only identified during an internal audit review of the incident log, not through the technology risk reporting process.`,
    keywords: ['FFIEC IT Handbook', 'change management metrics', 'technology risk dashboard', 'OCC examination', 'IT governance'],
    subTopic: 'technology-change-management',
  },
  {
    code: 'B3819',
    name: 'Cloud Configuration Baseline Not Version-Controlled — Drift From Security Standard Undetected for 9 Months',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital establishes a cloud security baseline configuration standard aligned with CIS Benchmarks for AWS and Azure, but stores the baseline as a static PDF document rather than version-controlled policy-as-code — cloud configurations are validated against the baseline during annual security reviews rather than continuously, allowing 9 months of drift to accumulate between reviews. FFIEC CAT and NIST CSF PR.IP-1 baseline configuration management controls require that production systems be continuously compared against authorised baselines and that deviations trigger a timely remediation or exception process; the 9-month detection gap allows 28 configuration deviations to accumulate — including 3 critical misconfigurations that opened unintended network paths — before the annual review discovers the drift and documents a FFIEC CAT baseline configuration maturity deficiency.`,
    keywords: ['FFIEC CAT', 'NIST CSF', 'configuration baseline', 'CIS Benchmarks', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'technology-change-management',
  },
];
