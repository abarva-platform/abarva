// seed-banking-dom13-cloud-infra-part3.ts
// Banking genome patterns — Cloud Infrastructure & Technology Risk
// Code range: B3820–B3879  (60 patterns)
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

export const BANKING_DOM13_CLOUD_INFRA_PART3_PATTERNS: PatternSeed[] = [

  // ── DevSecOps (B3820–B3831) ──────────────────────────────────────────────────
  {
    code: 'B3820',
    name: 'Static Application Security Testing Not Integrated in CI Pipeline — Vulnerabilities Reach Production',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's CI/CD pipeline for cloud-hosted banking applications does not include a mandatory static application security testing (SAST) gate — developers can merge and deploy code to production without a machine-enforced scan for OWASP Top 10 vulnerabilities, SQL injection, or insecure deserialization. FFIEC IT Handbook development security guidance and PCI DSS version 4.0 requirement 6.2.4 require that all in-scope applications be reviewed for common vulnerabilities before deployment; without an enforced SAST gate, a SQL injection vulnerability in the commercial loan origination API is deployed to production and remains exploitable for 6 weeks before detection during a quarterly penetration test — a period during which an adversary could have extracted the entire loan pipeline database.`,
    keywords: ['FFIEC IT Handbook', 'SAST', 'PCI DSS', 'CI/CD security', 'OWASP'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3821',
    name: 'Dynamic Application Security Testing Skipped in Pre-Production — Runtime Vulnerabilities Not Surfaced',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital relies on SAST for application security reviews but does not conduct dynamic application security testing (DAST) against deployed pre-production environments before releasing new banking application versions — runtime vulnerabilities that only manifest when the application is executing against a running data layer are not tested. FFIEC IT Handbook application security guidance and PCI DSS version 4.0 requirement 6.2.4 require both static and dynamic security testing for applications processing cardholder data; when a new digital banking release introduces a broken object-level authorization flaw in the account transfer API, the SAST scan misses it because the vulnerability requires runtime context, and it is discovered 4 months later by a white-hat researcher who reports it to the bank's bug bounty programme.`,
    keywords: ['FFIEC IT Handbook', 'DAST', 'PCI DSS', 'application security testing', 'broken authorization'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3822',
    name: 'Container Image Scanning Not Enforced — Production Banking Containers Run With Critical CVEs',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's Kubernetes-based cloud banking platform does not enforce container image scanning as a mandatory gate in the CI/CD pipeline — teams can push container images to the production registry and deploy them to the production cluster without a scan against a known vulnerability database. FFIEC IT Handbook vulnerability management guidance and NIST CSF PR.IP-12 software update controls require that container images be scanned for known vulnerabilities before deployment into production environments handling financial data; a PCI DSS QSA audit identifies 22 production containers running base images with critical-severity CVEs in the system C library and OpenSSL, some of which have public exploit code — findings that trigger a Level 1 PCI remediation finding with a 30-day deadline.`,
    keywords: ['FFIEC IT Handbook', 'container image scanning', 'PCI DSS', 'NIST CSF', 'Kubernetes security'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3823',
    name: 'Secrets Leaked in Git History — Rotation Lag Leaves Banking API Keys Exposed After Developer Commit',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `A First Capital developer accidentally commits an AWS access key, a Stripe API key, and a Supabase service role secret to a public-facing GitHub repository; while the commit is deleted within 2 hours, the secrets are already indexed by automated credential scanning services and the AWS key is used by an adversary to enumerate S3 buckets within 40 minutes of the commit. FFIEC IT Handbook information security and developer security training guidance and PCI DSS version 4.0 requirement 3.6 require that cryptographic keys and API credentials be managed through approved secrets management systems and that developer education prevent inadvertent credential exposure; the bank's incident response team discovers the keys have been rotated in only 1 of 3 affected systems 6 hours after the breach — the remaining two systems continue to accept the compromised credentials.`,
    keywords: ['FFIEC IT Handbook', 'secrets management', 'PCI DSS', 'credential exposure', 'git security'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3824',
    name: 'Software Composition Analysis Not Implemented — Open-Source License and Vulnerability Risk Unmanaged',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's application development programme does not use software composition analysis (SCA) tooling to track open-source library versions, known vulnerabilities in transitive dependencies, or license obligations — the bank has no visibility into which applications depend on which open-source packages or which packages carry GPL or AGPL license obligations that could affect proprietary banking software. FFIEC IT Handbook software development lifecycle guidance and OCC Bulletin 2023-17 technology risk management require that third-party components used in banking applications be inventoried and assessed for security and compliance risk; when a critical zero-day vulnerability is announced in a widely-used Java serialization library, the bank requires 9 days to manually identify all affected applications and cannot confirm remediation completeness — a response lag that the OCC cites as evidence of inadequate software supply chain controls.`,
    keywords: ['FFIEC IT Handbook', 'SCA', 'software composition analysis', 'OCC Bulletin 2023-17', 'open-source risk'],
    subTopic: 'devsecops',
  },
  {
    code: 'B3825',
    name: 'DevSecOps Security Champion Programme Not Established — Security Review Bottlenecked at Central AppSec Team',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's application security reviews are performed exclusively by a 3-person central AppSec team that reviews all code changes for 14 product development squads — the review queue averages 22 days, causing development teams to bypass security reviews by deploying through emergency change paths or delaying security engagement until post-deployment. FFIEC IT Handbook development security guidance requires that security be integrated throughout the software development lifecycle and not treated as a gate imposed after development is complete; the bottleneck creates a perverse incentive structure where the 22-day review cycle causes more deployment security bypasses than it prevents, and the AppSec team's findings are concentrated in late-stage code reviews where remediation cost is 10–15× higher than if issues were caught during development.`,
    keywords: ['FFIEC IT Handbook', 'DevSecOps', 'security champion', 'application security', 'SDLC'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3826',
    name: 'Infrastructure-as-Code Security Scanning Not Applied — Terraform Misconfigurations Promoted to Cloud',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital uses Terraform to provision cloud infrastructure but does not apply IaC security scanning tools (Checkov, tfsec, or equivalent) to Terraform plans before applying them — infrastructure configurations with security misconfigurations pass through code review and are promoted to production without automated security policy checks. FFIEC CAT and NIST CSF PR.IP-1 configuration management controls require that infrastructure configurations be validated against security policy before deployment; a Terraform plan that provisions an S3 bucket without server-side encryption or a public-access block is merged and applied, creating a data storage configuration violation that is discovered 3 months later during the bank's cloud security posture management review.`,
    keywords: ['FFIEC CAT', 'IaC security scanning', 'Terraform', 'NIST CSF', 'cloud misconfiguration'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3827',
    name: 'Penetration Test Findings Not Tracked to Closure — 40% of Critical Findings Unresolved After 180 Days',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital conducts an annual external penetration test of its cloud banking environment and receives a findings report, but does not have a formal tracking system that monitors remediation status of penetration test findings — the responsible teams acknowledge findings verbally but there is no mandatory remediation SLA, no escalation path, and no closed-loop verification that fixes were implemented correctly. FFIEC IT Handbook vulnerability management and PCI DSS version 4.0 requirement 11.4 require that penetration test findings be remediated according to a defined timeline and that retesting confirm closure of critical findings; when the following year's penetration test is conducted, the external tester identifies 8 critical findings that are identical to prior-year findings — demonstrating that 40% of the critical findings from the prior engagement were never remediated.`,
    keywords: ['FFIEC IT Handbook', 'penetration testing', 'PCI DSS', 'vulnerability remediation', 'FFIEC CAT'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3828',
    name: 'AI Code Assistant Introduces Insecure Cryptography Pattern — LLM-Generated Banking Code Fails PCI Review',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's development teams use an AI code assistant (GitHub Copilot / Amazon CodeWhisperer) to accelerate implementation of cryptographic functions in the payment processing service; the AI generates an implementation using MD5 for HMAC-based message authentication — a deprecated algorithm prohibited by PCI DSS for new cryptographic implementations — and the developer accepts the suggestion without recognizing the PCI compliance gap. OCC Bulletin 2023-17 AI tool governance and PCI DSS version 4.0 requirement 4.2.1 require that AI-generated code be reviewed for regulatory compliance requirements that the LLM training data may not reflect accurately; the AI-generated MD5 implementation is discovered during a PCI DSS QSA code review, requiring emergency remediation and a re-assessment before the bank can maintain its PCI compliance attestation for the affected payment service.`,
    keywords: ['OCC Bulletin 2023-17', 'AI code assistant', 'PCI DSS', 'cryptography', 'LLM-generated code'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3829',
    name: 'Branch Protection Rules Not Enforced on Core Banking Repositories — Direct Commits to Main Without Review',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's core banking application repositories in GitHub Enterprise do not enforce branch protection rules that require at least one approved pull request review and a passing CI security gate before merging to the main branch — senior developers retain direct-push permissions to the main branch for emergency hotfix purposes, and these permissions are used for non-emergency changes without review. FFIEC IT Handbook change management and development security guidance requires that changes to production banking application code be reviewed by a qualified person independent of the author; a developer inadvertently introduces a race condition in the account balance update logic through a direct commit to main that bypasses the standard review process, causing intermittent double-credit events on 340 transactions before the defect is identified.`,
    keywords: ['FFIEC IT Handbook', 'branch protection', 'code review', 'change management', 'git security'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },
  {
    code: 'B3830',
    name: 'Security Regression Test Suite Not Maintained — Fixed Vulnerabilities Re-Introduced in Subsequent Releases',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's application security team fixes critical vulnerabilities identified in penetration tests and code reviews but does not convert the fix into a regression test case in the CI pipeline — there is no automated test that will detect if the same vulnerability is re-introduced in a future code change. FFIEC IT Handbook application security and testing guidance requires that security testing be systematic and repeatable, not ad hoc per release; when a developer refactoring the digital banking session management code inadvertently re-introduces an account enumeration vulnerability that was originally fixed 8 months prior, the regression is not caught by the CI pipeline and is deployed to production, where it is exploited by an automated credential-stuffing campaign before discovery.`,
    keywords: ['FFIEC IT Handbook', 'security regression testing', 'NIST CSF', 'CI/CD', 'vulnerability management'],
    subTopic: 'devsecops',
  },
  {
    code: 'B3831',
    name: 'Cloud-Native SIEM Integration Incomplete — Container Workload Security Events Not Collected',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's SIEM platform collects security events from on-premises systems, network appliances, and cloud IAM services, but does not have log collection agents or Kubernetes audit log forwarding configured for the containerized banking application workloads — runtime security events, container escape attempts, and abnormal API server activity from the Kubernetes cluster are invisible to the SIEM. FFIEC IT Handbook security monitoring and NIST CSF DE.AE-3 event correlation controls require that security monitoring cover all environments handling customer financial data including cloud-native and containerized workloads; a threat actor who achieves container escape and moves laterally within the Kubernetes cluster generates no SIEM alerts during a 4-day dwell period because the container runtime events are not feeding the detection platform.`,
    keywords: ['FFIEC IT Handbook', 'SIEM', 'NIST CSF', 'container security', 'Kubernetes monitoring'],
    demoRelevant: true,
    subTopic: 'devsecops',
  },

  // ── Incident Response — Cloud (B3832–B3841) ──────────────────────────────────
  {
    code: 'B3832',
    name: 'Cloud Incident Runbooks Not Tested — Response Team Unfamiliar With Cloud-Native Recovery Procedures',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital documents cloud-specific incident response runbooks for common scenarios — IAM key compromise, data exfiltration from S3, Kubernetes cluster intrusion, and ransomware on EBS volumes — but conducts tabletop exercises only for on-premises scenarios; the cloud runbooks have never been rehearsed and the incident response team has not practiced the AWS and Azure console actions required to contain and recover from cloud-specific events. FFIEC IT Handbook incident response guidance and NIST SP 800-61 Computer Security Incident Handling Guide require that incident response procedures be tested through exercises that reflect the current operational environment; when a genuine cloud security incident occurs, the response team takes 3× the expected time to contain the incident because no one has practiced the cloud-specific containment steps — the IAM key revocation, snapshot isolation, and CloudTrail reconstruction workflow — under realistic conditions.`,
    keywords: ['FFIEC IT Handbook', 'NIST SP 800-61', 'cloud incident response', 'tabletop exercise', 'cloud runbook'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3833',
    name: 'Cloud Forensics Capability Not Established — Evidence Preservation Fails During Active Cloud Incident',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital does not have a documented cloud forensics capability — no procedure for preserving volatile evidence (memory images, running process lists, network connections) from cloud instances before containment actions delete the evidence, and no approved tooling for cloud-native forensic data collection. FFIEC IT Handbook incident response guidance and OCC Computer-Security Incident Notification Rule require that banks be able to conduct forensic analysis sufficient to determine the scope and cause of a security incident; when a suspected data exfiltration incident requires forensic analysis to determine what customer data was accessed, the incident response team terminates the compromised EC2 instances before capturing memory images, destroying the only evidence that would have identified the exfiltration method and the attacker's persistence mechanism.`,
    keywords: ['FFIEC IT Handbook', 'cloud forensics', 'NIST SP 800-61', 'OCC notification', 'incident response'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3834',
    name: 'Incident Classification Criteria Do Not Cover Cloud Service Degradations — Severity Matrix Incomplete',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's incident severity classification matrix defines severity levels based on on-premises failure scenarios — application server unavailability, network link failures, and database outages — but does not include classification criteria for cloud-specific events such as hyperscaler API throttling, managed service partial degradation, or multi-tenant platform performance issues. FFIEC IT Handbook incident management guidance requires that incident classification frameworks be maintained to reflect the current operating environment; when AWS throttles API calls to the bank's FedNow payment middleware during peak transaction volume due to a multi-tenant resource contention event, the operations team cannot determine whether to classify the event as a Severity 1 or Severity 2 incident, delays escalation by 45 minutes, and misses the OCC 36-hour notification assessment window.`,
    keywords: ['FFIEC IT Handbook', 'incident classification', 'FedNow', 'cloud service degradation', 'OCC notification'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3835',
    name: 'Post-Incident Review Process Not Standardized for Cloud Incidents — Root Cause Analysis Inconsistent',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital conducts post-incident reviews for major cloud outages but does not use a standardized root cause analysis methodology — some reviews produce 5-Whys analysis while others produce timeline narratives, and the resulting action items are recorded in an untracked email thread rather than a managed action item system. FFIEC IT Handbook incident response improvement guidance and ISO 22301 require that lessons learned from incidents be systematically captured, actioned, and verified to drive ongoing improvement; without a standardized PIR process, repeat incidents caused by the same underlying misconfiguration recur because corrective actions from prior incidents are never tracked to completion — a pattern that the bank's internal audit team identifies when correlating 18 months of cloud incident reports.`,
    keywords: ['FFIEC IT Handbook', 'post-incident review', 'ISO 22301', 'root cause analysis', 'cloud incident management'],
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3836',
    name: 'GenAI Incident Triage Tool Produces Incorrect Severity Assessment — LLM-Assisted SOC Misdirects Response',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's security operations center deploys a GenAI-powered alert triage assistant that classifies incoming SIEM alerts and recommends severity levels to reduce analyst fatigue; the LLM assistant incorrectly classifies a cloud IAM key compromise alert as low-severity because the contextual explanation includes a benign-sounding API call pattern that the model associates with routine administrative activity. OCC Bulletin 2023-17 AI tool governance and FFIEC IT Handbook incident response guidance require that AI tools used in security operations be validated for accuracy and that human review be mandatory before downgrading high-severity security events; when the analyst follows the AI recommendation and classifies the compromise as low-severity, the incident response escalation is not triggered and the attacker has 18 additional hours of uncontested access to the compromised IAM role.`,
    keywords: ['OCC Bulletin 2023-17', 'GenAI SOC', 'FFIEC IT Handbook', 'AI incident triage', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3837',
    name: 'Cloud Incident Communication Template Does Not Address Regulator Notification — Drafting Delay Misses 36-Hour Window',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's incident response communication templates cover internal escalation, customer notification, and press statement templates for major incidents, but do not include a pre-drafted regulator notification template for the OCC Computer-Security Incident Notification Rule's 36-hour reporting window — when an actual incident triggers the reporting requirement, the compliance team must draft the notification from scratch under time pressure. OCC Computer-Security Incident Notification Rule and FFIEC IT Handbook communication planning guidance require that notification procedures be pre-established so that regulatory obligations can be met without drafting time consuming them inside a compressed timeline; the absence of a pre-approved OCC notification template causes a 6-hour delay in initiating the notification draft, which — combined with the time required for legal review — results in the notification being submitted 4 hours past the 36-hour window.`,
    keywords: ['OCC notification', 'FFIEC IT Handbook', 'incident communication', 'cloud incident', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3838',
    name: 'Cloud Threat Intelligence Not Integrated Into Incident Detection — Banking Sector IOCs Not Actioned',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital receives threat intelligence feeds through its FS-ISAC membership and OCC threat alerts, but does not have an automated process that converts banking-sector indicators of compromise (IOCs) into SIEM detection rules or cloud security group deny-list entries — the threat intelligence is read by a security analyst and filed without being operationalized. FFIEC CAT cybersecurity maturity and NIST CSF ID.RA-2 threat intelligence integration controls require that threat information be used to update defensive controls in a timely manner; when FS-ISAC issues a TLP:AMBER alert about an active campaign targeting US regional bank cloud infrastructure with specific attacker IP ranges and malware hashes, First Capital's SOC does not add the IOCs to its detection rules, and the bank's cloud environment is subsequently compromised by the same threat actor using the published attack infrastructure.`,
    keywords: ['FFIEC CAT', 'FS-ISAC', 'NIST CSF', 'threat intelligence', 'IOC integration'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3839',
    name: 'Mean Time to Detect Cloud Security Incidents Exceeds FFIEC Benchmark — SOC Monitoring Gap in Off-Hours',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's security operations center provides 24×7 SIEM monitoring but staffs the overnight shift with a single analyst who handles all alert triage for on-premises and cloud environments — cloud security alert volume during incident peaks exceeds the single analyst's capacity to review all alerts within the FFIEC's guidance-implied detection window, resulting in a mean time to detect for cloud security events of 6.8 hours during off-peak hours. FFIEC CAT cybersecurity maturity controls at the Evolving level require that the institution detect anomalous activity in a timely manner consistent with the criticality of the systems being monitored; the detection gap is exploited when a credential-stuffing campaign targeting First Capital's digital banking platform begins at 2:30am and is not detected until the morning shift arrives, by which time 1,200 account takeover events have occurred.`,
    keywords: ['FFIEC CAT', 'FFIEC IT Handbook', 'MTTD', 'SOC monitoring', 'cloud security detection'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3840',
    name: 'Cloud Backup Used as Primary Recovery Path for Ransomware — Backup Integrity Not Verified Before Restoration',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's ransomware response plan designates cloud backup restoration as the primary recovery path, but the plan does not include a pre-restoration backup integrity verification step — when ransomware encrypts production EBS volumes, the recovery team initiates restoration from the most recent backup snapshot without first validating that the snapshot predates the ransomware's initial access and does not contain ransomware-encrypted files. NIST SP 800-61 ransomware response guidance and FFIEC IT Handbook business continuity planning require that backup integrity be verified before restoration, including confirmation that the backup was created before the initial compromise; the bank restores from a snapshot that contains ransomware-encrypted database files because the initial access event predated the snapshot by 11 hours — the restoration fails and the bank must restore from a 30-hour-older clean snapshot, exceeding the committed RTO by 22 hours.`,
    keywords: ['FFIEC IT Handbook', 'NIST SP 800-61', 'ransomware recovery', 'backup integrity', 'cloud DR'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },
  {
    code: 'B3841',
    name: 'Cloud Vendor Incident Notification Contractually Not Required — Bank Learns of Provider Breach From News',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's cloud managed services contract does not include a provision requiring the provider to notify the bank within a defined timeframe when the provider's infrastructure or shared services experience a security breach that could affect the bank's data or systems — the bank learns of a cloud provider security incident affecting shared database infrastructure from a news report rather than a provider notification. OCC Bulletin 2013-29 third-party contract requirements and FFIEC IT Handbook vendor management guidance require that contracts include incident notification obligations with defined timelines; the absence of a contractual notification requirement means First Capital cannot determine for 72 hours whether its customer data was within the scope of the provider's breach — delaying its Gramm-Leach-Bliley breach assessment and OCC notification obligation.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'vendor incident notification', 'Gramm-Leach-Bliley', 'cloud contract'],
    demoRelevant: true,
    subTopic: 'incident-response-cloud',
  },

  // ── Hybrid & Multi-Cloud (B3842–B3849) ───────────────────────────────────────
  {
    code: 'B3842',
    name: 'Hybrid Cloud Identity Federation Not Configured — Separate Credential Stores for On-Premises and Cloud',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital operates a hybrid cloud environment where on-premises Active Directory and AWS IAM Identity Center are managed as separate identity systems — staff who need access to both environments maintain separate credentials, separate MFA registrations, and are managed through separate onboarding and offboarding processes that are not synchronized. FFIEC IT Handbook access management guidance and NIST CSF PR.AC-1 identity management controls require that privileged access be managed through a unified identity governance framework; the separate credential stores mean that when a staff member is terminated, their on-premises AD account is deprovisioned within 4 hours per policy, but their cloud IAM Identity Center account remains active for an average of 11 days — a deprovisioning gap that creates an insider threat window exploited in one documented case.`,
    keywords: ['FFIEC IT Handbook', 'NIST CSF', 'hybrid cloud identity', 'IAM Identity Center', 'access deprovisioning'],
    demoRelevant: true,
    subTopic: 'hybrid-multicloud',
  },
  {
    code: 'B3843',
    name: 'Multi-Cloud Cost and Compliance Reporting Siloed — Aggregate Risk Posture Invisible to CRO',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's three hyperscaler environments (AWS, Azure, GCP) are monitored through provider-native consoles and separate CSPM tools that do not feed a unified compliance and risk dashboard — the chief risk officer receives cloud risk metrics only at the individual provider level, with no cross-cloud view of total policy violations, aggregate data sovereignty exposure, or combined concentration risk. FFIEC IT Handbook IT risk governance guidance and OCC examination expectations require that technology risk reporting provide the board and senior management with a consolidated view of risk across all technology platforms; the siloed reporting means the CRO cannot see that the combined count of critical cloud policy violations across all three hyperscalers is 94 — a number that would trigger escalation — because the individual per-provider reports show 34, 29, and 31 violations that each appear below the escalation threshold in isolation.`,
    keywords: ['FFIEC IT Handbook', 'multi-cloud governance', 'CSPM', 'OCC examination', 'technology risk reporting'],
    demoRelevant: true,
    subTopic: 'hybrid-multicloud',
  },
  {
    code: 'B3844',
    name: 'Hybrid Cloud Network Latency Not Baselined — Core Banking Response Time Degrades After Cloud Migration',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital migrates the account inquiry API to a cloud-hosted microservice while keeping the core ledger on-premises, creating a hybrid architecture where customer-facing transactions require a round-trip from cloud API to on-premises database over a Direct Connect link; the engineering team does not establish a network latency baseline before migration or set alerting thresholds for latency-sensitive transaction paths. FFIEC IT Handbook capacity and performance management guidance requires that performance baselines be established and monitored after architecture changes; Direct Connect congestion during peak transaction periods increases API response times from 180ms to 4.2 seconds for account inquiries, which the digital banking platform interprets as a timeout and presents as an error to customers — generating a flood of customer service calls before the root cause is identified as hybrid network latency rather than an application defect.`,
    keywords: ['FFIEC IT Handbook', 'hybrid cloud', 'Direct Connect', 'network latency', 'performance baseline'],
    demoRelevant: true,
    subTopic: 'hybrid-multicloud',
  },
  {
    code: 'B3845',
    name: 'Multi-Cloud Data Residency Controls Not Validated — Customer Data Replicated to Offshore Region Without Review',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's multi-cloud data strategy does not include validated data residency controls for each cloud provider — managed database replication and backup features are enabled with default region configurations that include disaster recovery replication to provider-selected secondary regions, some of which are outside the United States. Gramm-Leach-Bliley Safeguards Rule and OCC data governance guidance require that banks understand where customer financial data resides and that cross-border data transfers be assessed for regulatory compliance; when the bank's compliance team audits cloud data flows during an OCC examination, they discover that AWS RDS automated backups have been replicating production customer account data to an AWS eu-west-1 region for 14 months without a cross-border data transfer assessment or contractual data localization obligation.`,
    keywords: ['Gramm-Leach-Bliley', 'OCC Bulletin 2013-29', 'data residency', 'multi-cloud', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'hybrid-multicloud',
  },
  {
    code: 'B3846',
    name: 'On-Premises to Cloud Migration Dependency Map Incomplete — Hidden Application Couplings Cause Post-Migration Failures',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's cloud migration programme uses an application dependency mapping tool that scans network flows and configuration files but misses undocumented integrations where applications communicate through shared file system paths, database views, and message queue subscriptions that were not registered in the configuration management database. FFIEC IT Handbook change management and architecture governance guidance require that system interdependencies be fully mapped before migrations that change network topology; when the commercial banking CRM is migrated to cloud while the loan origination system remains on-premises, three file-based integrations that the dependency scan missed cause the loan origination system to fail silently — producing incomplete loan files for 6 days before the missing data is discovered during a routine credit file review.`,
    keywords: ['FFIEC IT Handbook', 'cloud migration', 'dependency mapping', 'CMDB', 'application integration'],
    demoRelevant: true,
    subTopic: 'hybrid-multicloud',
  },
  {
    code: 'B3847',
    name: 'Hybrid Observability Stack Incomplete — On-Premises and Cloud Metrics Not Correlated for End-to-End Transaction Tracing',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's hybrid cloud architecture runs the customer-facing API tier in AWS while core banking transaction processing runs on-premises, but the observability platforms for each environment use different tooling and trace IDs that are not correlated — an end-to-end transaction trace that spans cloud and on-premises cannot be assembled into a unified view. FFIEC IT Handbook operational monitoring guidance requires that institutions have the capability to monitor and diagnose performance issues across all components of production systems processing customer transactions; when intermittent payment processing failures affect 3% of FedNow transactions, the operations team cannot determine within a 2-hour window whether the failure originates in the cloud API tier or the on-premises core banking system — extending the mean time to resolve by 90 minutes per incident.`,
    keywords: ['FFIEC IT Handbook', 'hybrid observability', 'distributed tracing', 'FedNow', 'cloud monitoring'],
    demoRelevant: true,
    subTopic: 'hybrid-multicloud',
  },
  {
    code: 'B3848',
    name: 'Cloud Landing Zone Not Enforced — Business Units Provision Shadow Cloud Accounts Outside Governance',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital establishes an AWS Organizations landing zone with security guardrails, approved region lists, and mandatory tagging policies for centrally managed accounts, but does not prevent business units from using departmental credit cards to provision individual AWS accounts outside the landing zone — the commercial banking analytics team and the retail banking digital team each provision shadow accounts that process customer data outside the bank's approved security controls. FFIEC CAT and OCC Bulletin 2023-17 cloud governance guidance require that all cloud accounts processing customer financial data operate under the institution's approved governance framework; the shadow accounts hold customer segment data and transaction analytics that are not covered by the bank's SOC 2 scope, DLP controls, or TPRM programme — a control gap identified during an internal cloud inventory audit that finds 7 unmanaged accounts outside the central landing zone.`,
    keywords: ['FFIEC CAT', 'cloud landing zone', 'OCC Bulletin 2023-17', 'AWS Organizations', 'shadow IT'],
    demoRelevant: true,
    subTopic: 'hybrid-multicloud',
  },
  {
    code: 'B3849',
    name: 'Multi-Cloud FinOps Governance Absent — Unbudgeted Cloud Spend Exceeds Annual IT Budget by 30%',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital approves an annual cloud budget based on the prior year's hyperscaler invoices, but does not implement cloud financial operations (FinOps) governance — no showback/chargeback model, no tagging-based cost allocation, and no automated spend anomaly alerts — and cloud consumption grows 30% beyond the annual IT budget because development teams provision resources without cost awareness and leave non-production environments running continuously. FFIEC IT Handbook IT governance and OCC examination guidance require that technology expenditures be managed within approved budgets and that material variances be escalated; the 30% budget overrun is discovered at the annual budget reconciliation rather than being detected in-month, requiring an emergency supplemental budget request to the board — a governance failure that the OCC examiners cite as evidence of inadequate technology financial management.`,
    keywords: ['FFIEC IT Handbook', 'FinOps', 'cloud cost governance', 'OCC examination', 'cloud budget'],
    demoRelevant: true,
    subTopic: 'hybrid-multicloud',
  },

  // ── AI Cloud — Part 3 (B3850–B3867) ─────────────────────────────────────────
  {
    code: 'B3850',
    name: 'AI Fraud Scoring Model Vendor Contract Lacks Model Version Change Notification — Silent SR 11-7 Drift',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital contracts a vendor-hosted AI fraud scoring model for debit card authorization decisions; the contract does not require the vendor to notify the bank before deploying model version updates or retraining the model on new data — the vendor's model is updated 6 times over 18 months and First Capital's MRM team has no knowledge of these changes. SR 11-7 model risk management guidance requires that changes to vendor models used in credit and fraud decisioning trigger the bank's model change management process including re-validation; when the OCC MRM examiner reviews the fraud model's SR 11-7 documentation, the absence of model version change tracking means the bank cannot demonstrate that the fraud model being used today is the same model that was validated 18 months ago — a material MRM programme deficiency that requires immediate vendor contract renegotiation and back-filing of model change records.`,
    keywords: ['SR 11-7', 'fraud AI model', 'OCC model risk', 'vendor AI governance', 'model version control'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3851',
    name: 'AI Deposit Pricing Model Deployed Without DFAST Stress Scenario Integration — Capital Planning Gap',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital deploys a cloud-hosted ML model to optimize deposit pricing across retail and commercial segments; the model is validated under SR 11-7 as a pricing model but the DFAST stress testing framework uses a separate, manually calibrated deposit run-off model that was not updated to reflect the AI pricing model's behavior under stress conditions — creating an inconsistency between the live pricing AI and the stressed deposit assumptions used in regulatory capital planning. SR 11-7 model risk management and OCC DFAST guidance require that models used in regulatory capital planning accurately reflect the bank's actual risk profile including behavioral assumptions driven by AI pricing tools; the disconnect between the AI pricing model's predicted behavior under rate stress and the DFAST deposit assumption set causes First Capital to materially underestimate deposit outflow in the severely adverse scenario, a finding identified during the OCC's supervisory stress test review.`,
    keywords: ['SR 11-7', 'DFAST', 'AI pricing model', 'CCAR', 'OCC model risk'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3852',
    name: 'AI-Powered Document Intelligence Platform Processes Regulated Data Without BAA — GLBA Safeguards Exposure',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital deploys a third-party AI document intelligence platform to extract data from loan applications, account statements, and tax returns; the vendor is contracted as a SaaS software provider rather than a covered service provider under the Gramm-Leach-Bliley Act, and no information security program agreement or data processing addendum is negotiated before the bank begins routing regulated customer financial documents through the AI platform. OCC Bulletin 2013-29 and FFIEC IT Handbook third-party risk management require that vendors processing nonpublic personal information on the bank's behalf be governed by appropriate contractual protections including information security program requirements; the absence of a GLBA-compliant data processing agreement means First Capital cannot demonstrate regulatory compliance for the AI platform's processing of customer financial documents when examined by the OCC.`,
    keywords: ['Gramm-Leach-Bliley', 'OCC Bulletin 2013-29', 'AI document intelligence', 'TPRM', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3853',
    name: 'AI Model Explainability Tool Produces Inconsistent Adverse Action Reasons — ECOA Compliance Risk',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital adds a post-hoc explainability wrapper (SHAP or LIME) to its cloud-hosted AI credit model to generate adverse action reasons for regulatory compliance; the explainability tool produces different principal reason rankings on 15% of loan applications when run multiple times on the same input due to sampling randomness in the approximation algorithm — creating a condition where two identical applicants receive different adverse action reason statements. SR 11-7 model risk validation requirements and CFPB Regulation B adverse action notice standards require that adverse action reason generation be deterministic and consistent; the non-deterministic explainability creates ECOA compliance risk that is identified during the bank's model validation when the validator tests the same application twice and receives two different top-4 reason lists.`,
    keywords: ['SR 11-7', 'ECOA adverse action', 'CFPB', 'SHAP explainability', 'AI credit model'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3854',
    name: 'AI-Generated Personalized Marketing Emails Contain Inferred Health or Protected-Class Proxy Data',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital deploys a GenAI-powered personalized marketing platform that uses ML-inferred customer segments to tailor product offers in email campaigns; the segmentation model uses transaction pattern features that serve as statistical proxies for protected class characteristics — including spending patterns associated with healthcare conditions and neighborhood income levels correlated with race — and the AI email copy generator references these proxy segments in ways that vary offer terms by inferred characteristic. CFPB UDAAP guidance and fair lending examination standards require that AI-driven marketing platforms not use protected-class proxies in product offer differentiation; when a CFPB examination team reviews First Capital's AI marketing programme, the inferred proxy variable analysis reveals that AI-personalized email offers for home equity products are offered at materially different terms to customers in minority-majority ZIP codes — a disparate treatment finding requiring immediate programme suspension.`,
    keywords: ['CFPB UDAAP', 'fair lending', 'AI marketing', 'protected class proxy', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3855',
    name: 'AI Cash Flow Forecasting Model for Commercial Clients Not Disclosed as AI — CFPB Small Business Rule Risk',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital offers commercial banking clients an AI-powered cash flow forecasting service embedded in the commercial banking portal; the service uses an ML model that generates 90-day cash flow projections and identifies working capital risk signals — but the interface does not disclose that the projections are AI-generated or that the model has a documented 23% mean absolute percentage error at the 90-day horizon. CFPB Section 1071 small business data collection rulemaking and emerging AI disclosure guidance require that financial institutions disclose the use of automated systems in financial decision support provided to business customers; the absence of an AI disclosure creates a UDAAP exposure when the bank's commercial lending team recommends increasing a commercial line of credit based on an AI-generated cash flow projection that subsequently fails to materialize — exposing the client to an over-leveraged position.`,
    keywords: ['CFPB UDAAP', 'CFPB Section 1071', 'AI disclosure', 'commercial banking AI', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3856',
    name: 'AI Synthetic Data Generation for Model Training Creates Regulatory Data Governance Gap',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's model development team uses a generative AI model to produce synthetic transaction datasets for training fraud detection and credit risk models, aiming to avoid privacy risks associated with using real customer data; the synthetic data generation methodology is not validated for statistical fidelity and the synthetic data distribution systematically underrepresents fraud patterns in minority-dominated transaction corridors. SR 11-7 model risk management requires that training data quality be assessed and validated for the model's intended use case regardless of whether the data is real or synthetic; when the fraud detection model trained on biased synthetic data is deployed, it produces a 28% higher false positive rate for transactions from minority customer segments — a fair lending and FFIEC CAT AI governance concern requiring model retraining and synthetic data validation methodology review.`,
    keywords: ['SR 11-7', 'synthetic data', 'fraud AI', 'FFIEC CAT', 'model training data'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3857',
    name: 'Agentic AI Workflow Executes Customer Account Actions Without Human Approval Gate — Reg E Exposure',
    officeCategory: 'front_office',
    failureRatePct: 80,
    description:
      `First Capital deploys an agentic AI assistant for the commercial banking team that can autonomously execute account actions — wire transfer approvals, stop payment orders, and overdraft fee reversals — when the AI determines the action meets a defined confidence threshold, without requiring explicit human approval for each action. CFPB Regulation E and OCC guidance on automated account management require that material account actions be authorized by the accountholder or a duly authorized representative and that automated systems acting on behalf of customers have documented authorization frameworks; when the agentic AI erroneously reverses $340,000 in overdraft fees across 180 commercial accounts based on a misclassification of corporate account types, the bank cannot produce per-action authorization records to satisfy Regulation E's error resolution requirements — creating a systemic UDAAP and Reg E compliance finding.`,
    keywords: ['Regulation E', 'CFPB UDAAP', 'agentic AI', 'OCC Bulletin 2023-17', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3858',
    name: 'AI Stress Testing Scenario Generator Introduces Correlated Scenarios — CCAR Capital Adequacy Underestimated',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys a GenAI tool to assist the capital planning team in generating stress testing scenarios for CCAR; the LLM generates plausible-sounding stress narratives but its scenario generation process produces scenarios that are implicitly correlated — a hypothetical credit shock narrative and a simultaneously generated market stress narrative both assume US unemployment rising to 9%, creating a correlated double-shock that the capital planning model has not been designed to evaluate jointly. SR 11-7 model risk management and Federal Reserve CCAR guidance require that stress scenarios be independently reviewed for realism, correlation structure, and coverage of tail risks; the AI-generated correlated scenarios cause the capital adequacy assessment to underestimate joint stress outcomes by not properly modeling the dependency structure between credit and market risk — a finding identified by the Federal Reserve's quantitative model reviewer.`,
    keywords: ['SR 11-7', 'CCAR', 'GenAI stress testing', 'Federal Reserve', 'capital planning'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3859',
    name: 'AI-Powered Credit Limit Increase Automation Bypasses Board-Approved Credit Policy Floor',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital deploys a cloud-hosted AI model that automatically approves credit limit increases for qualifying consumer cardholders without individual human review; the model's feature engineering includes a derived variable that systematically overestimates creditworthiness for a specific customer segment, causing the automated approvals to extend credit limits beyond the minimum credit quality floor defined in the board-approved credit risk policy. SR 11-7 model risk management and OCC credit risk examination guidance require that automated credit decision systems operate within board-approved risk parameters and that the MRM programme monitor for policy compliance; when the OCC examines First Capital's consumer credit portfolio, the pattern of automated limit increases extending credit to sub-floor customers is identified as a credit policy violation attributable to an unvalidated model variable — requiring an immediate model suspension and retrospective portfolio review.`,
    keywords: ['SR 11-7', 'OCC credit risk', 'AI credit automation', 'credit policy', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3860',
    name: 'AI Financial Wellness Chatbot Provides Specific Tax Advice Without Qualified Person Disclosure',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's mobile banking application includes an AI-powered financial wellness chatbot that uses an LLM to answer customer questions about personal finance; when customers ask tax-related questions, the chatbot provides specific tax advice including guidance on retirement account contribution limits, deductibility of mortgage interest, and HSA eligibility rules without disclosing that the answers are AI-generated and that the bank is not providing tax advice. CFPB UDAAP guidance and the bank's own legal terms require that automated financial guidance tools include disclosures that clearly communicate the limitations of AI-generated advice and recommend consultation with a qualified professional; when a customer files a complaint alleging that the chatbot's erroneous HSA contribution limit guidance caused them to incur an IRS penalty, the CFPB opens a UDAAP inquiry into whether the AI financial wellness tool constitutes misleading advice without adequate disclosure.`,
    keywords: ['CFPB UDAAP', 'AI chatbot', 'OCC Bulletin 2023-17', 'financial advice disclosure', 'GenAI'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3861',
    name: 'AI Model Used for CECL Allowance Estimation Not in SR 11-7 Model Inventory — Regulatory Capital Risk',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's accounting team uses a vendor-provided ML model to assist in estimating the allowance for credit losses under CECL (ASC 326) — the model incorporates macroeconomic forecasts and loss rate predictions — but classifies the tool as an "accounting software" rather than a "model" in the bank's SR 11-7 inventory, bypassing the MRM validation process. SR 11-7 model risk management and OCC model risk examination guidance define models to include quantitative methods used to inform estimates of regulatory capital and loss reserves; when OCC examiners review First Capital's CECL programme and request the SR 11-7 model documentation for the allowance estimation tool, the absence of a model inventory entry, validation report, or ongoing monitoring documentation triggers a critical MRM finding that requires the bank to suspend use of the unvalidated tool and rely on its manual CECL estimation process during the remediation period.`,
    keywords: ['SR 11-7', 'CECL', 'OCC model risk', 'credit loss estimation', 'ASC 326'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3862',
    name: 'AI Regulatory Change Monitoring Tool Misses Effective Date — Compliance Programme Not Updated in Time',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI-powered regulatory change monitoring tool that uses NLP to extract and classify regulatory publications from OCC, CFPB, FDIC, and Federal Reserve sources; the model fails to extract the correct effective date from a CFPB final rule with a non-standard effective date structure, classifying the rule as having an effective date 90 days later than the actual date. OCC Bulletin 2023-17 AI tool governance and FFIEC IT Handbook compliance programme governance require that AI tools used in regulatory change management be validated for extraction accuracy including edge cases in document structure; the incorrect effective date classification causes First Capital's compliance programme update for the affected rule to be scheduled for completion after the rule's actual effective date — the bank operates in non-compliance for 90 days while the compliance team believes it has adequate lead time.`,
    keywords: ['OCC Bulletin 2023-17', 'AI regulatory monitoring', 'FFIEC IT Handbook', 'compliance management', 'NLP'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3863',
    name: 'AI Treasury Cash Positioning Model Has No Circuit Breaker — Erroneous Fed Funds Transfer Submitted',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's treasury management team deploys an AI model to automate end-of-day fed funds positioning decisions; the model generates a sell recommendation of $750M in overnight fed funds when it misclassifies an intraday peak balance as a persistent excess reserve position — there is no automated circuit breaker that flags recommendations exceeding a defined percentage of the bank's typical overnight positioning. SR 11-7 model risk management and OCC examination guidance for treasury models require that automated decision systems have governance controls including anomaly detection and human confirmation requirements for recommendations exceeding defined thresholds; the $750M recommendation is submitted without human review because the automation workflow was configured to execute recommendations automatically for positions under $1B — a threshold that failed to account for the model's ability to generate a single erroneous recommendation at that scale.`,
    keywords: ['SR 11-7', 'treasury AI', 'fed funds', 'OCC examination', 'model circuit breaker'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3864',
    name: 'AI-Assisted SAR Narrative Generation Not Reviewed for Accuracy — FinCEN Filing Contains AI Hallucination',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description:
      `First Capital's BSA/AML compliance team uses a GenAI tool to draft Suspicious Activity Report narratives from structured alert data — the tool synthesizes transaction details, customer history, and typology descriptions into SAR narrative text; a GenAI hallucination introduces a fabricated transaction amount ($230,000 that does not appear in the underlying transaction data) into a SAR narrative that is filed with FinCEN without the analyst verifying all figures against source records. FinCEN SAR filing guidance and OCC BSA/AML examination standards require that SAR narratives accurately reflect the underlying transaction activity and that institutions maintain records supporting all narrative claims; the inaccurate SAR filing requires a SAR amendment filing and triggers an OCC examination inquiry into the bank's AI-assisted SAR workflow governance — specifically whether the bank has sufficient human verification controls for AI-generated regulatory filings.`,
    keywords: ['BSA/AML', 'FinCEN', 'GenAI SAR narrative', 'OCC Bulletin 2023-17', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3865',
    name: 'AI Vendor Risk Scoring Tool Uses Stale Training Data — New Fintech Risk Profiles Not Reflected',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI-powered third-party risk scoring tool that evaluates fintech partners and cloud vendors based on ML-derived risk signals; the model's training data ends in Q2 2023 and the model has not been retrained — emerging fintech risk typologies including embedded finance regulatory exposures, buy-now-pay-later platform default clusters, and AI-native fintech governance gaps are not represented in the risk scoring model's feature space. OCC Bulletin 2013-29 TPRM guidance and SR 11-7 model risk management require that models used in risk management be monitored for continued accuracy as the risk environment evolves; the stale training data causes the AI risk scoring tool to underestimate the risk of a buy-now-pay-later fintech partner that subsequently fails — a vendor that the tool scored as medium-risk despite publicly available signals of financial distress that post-dated the model's training cutoff.`,
    keywords: ['OCC Bulletin 2013-29', 'SR 11-7', 'AI TPRM', 'vendor risk scoring', 'model staleness'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3866',
    name: 'AI Model Output Used as Hard Cutoff in Loan Workflow — Judgmental Override Not Available to Underwriters',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital configures its cloud-hosted AI underwriting model as the final decision authority in the small business loan workflow — applications scoring below the model threshold are automatically declined without an underwriter review path, eliminating the judgmental override capability that SR 11-7 model risk governance and fair lending principles require for AI credit models. CFPB fair lending examination guidance and SR 11-7 model risk management require that AI credit models include a human override process for applications near decision boundaries and that the model not function as an irrebuttable authority; when an OCC fair lending examiner reviews a sample of AI-declined small business applications, 12 cases are identified where an underwriter override would have been appropriate based on mitigating factors visible in the application file that the model did not score — creating a pattern of disparate treatment that the bank cannot rebut without the judgmental review path.`,
    keywords: ['SR 11-7', 'CFPB fair lending', 'AI credit model', 'judgmental override', 'OCC credit risk'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },
  {
    code: 'B3867',
    name: 'AI Collateral Valuation Model Not Validated for Non-Standard Asset Classes — Commercial Real Estate Mispriced',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys a cloud-hosted AI automated valuation model for collateral assessment in commercial real estate lending; the model's training data covers standard commercial office and retail properties, but it is applied without additional validation to non-standard asset classes including medical office buildings, self-storage facilities, and data centres — asset types with fundamentally different cap rate dynamics and cash flow structures. SR 11-7 model risk management requires that models be validated for each use case and that model scope limitations be documented and enforced; the model systematically overestimates the value of data centre collateral by 18–22% because it applies office cap rate comparables to assets whose valuations are driven by power infrastructure and hyperscaler lease structures — collateral overvaluation that the bank's loan review committee identifies during an annual portfolio review when three data centre loans surface as under-collateralized.`,
    keywords: ['SR 11-7', 'OCC credit risk', 'AI valuation model', 'commercial real estate', 'model scope'],
    demoRelevant: true,
    subTopic: 'ai-cloud-part3',
  },

  // ── FinOps & Cloud Cost (B3868–B3879) ────────────────────────────────────────
  {
    code: 'B3868',
    name: 'Cloud Reserved Instance Commitment Not Aligned to Workload Lifecycle — $2.4M in Unused Capacity',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital purchases 3-year AWS Reserved Instance commitments for compute capacity based on a legacy application footprint; when the cloud migration programme decommissions 40% of the workloads covered by the reservations ahead of the 3-year term, the unused Reserved Instance capacity generates $2.4M in committed spending with no corresponding workload — the bank cannot sell the reservations at full value and the FinOps programme does not have a process to match RI commitments to workload lifecycle plans. FFIEC IT Handbook IT governance and financial management guidance require that technology expenditures be managed to deliver value and that material procurement commitments be aligned with business plans; the unused RI capacity represents a technology financial governance failure where procurement decisions were not coordinated with the migration programme's decommission timeline — a gap identified during the annual technology budget review.`,
    keywords: ['FFIEC IT Handbook', 'cloud FinOps', 'reserved instances', 'cloud cost management', 'IT governance'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3869',
    name: 'Cloud Tagging Policy Not Enforced — 35% of Resources Untagged and Cost Allocation Impossible',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital establishes a cloud resource tagging policy requiring all provisioned resources to carry cost_center, application, environment, and owner tags for financial management and chargeback purposes; tag enforcement is not automated at the AWS Organizations policy level and 35% of production resources are provisioned without required tags by teams who bypass tagging in the interest of deployment speed. FFIEC IT Handbook financial management guidance requires that technology costs be attributable to business units and cost centres for governance and accountability; the untagged resources make 35% of the monthly cloud spend unallocable to business units, meaning the technology finance team cannot produce an accurate chargeback report and business unit leaders cannot see the cost impact of their technology consumption decisions — a governance failure that inflates IT cost overruns by obscuring which units are driving the spend.`,
    keywords: ['FFIEC IT Handbook', 'cloud tagging', 'FinOps', 'cost allocation', 'AWS Organizations'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3870',
    name: 'Cloud Egress Costs Not Modeled in TCO Analysis — $1.8M Annual Egress Surprise After Migration',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's cloud total cost of ownership analysis for the core banking migration focuses on compute and storage costs but does not model cloud egress data transfer costs — the analysis assumes data replication between cloud and on-premises core banking systems is a negligible cost based on initial data volume estimates that do not account for real-time payment notification streams and continuous data synchronization. FFIEC IT Handbook IT financial management guidance requires that TCO analyses for cloud migrations be comprehensive and include all recurring cost categories; when the migrated core banking API begins generating 2.4TB of daily outbound data transfer to the on-premises core ledger for transaction reconciliation, the egress costs add $1.8M annually to the cloud budget — a cost that was not in the migration business case and that now makes the migration's NPV negative compared to the on-premises alternative.`,
    keywords: ['FFIEC IT Handbook', 'cloud TCO', 'egress costs', 'FinOps', 'cloud migration'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3871',
    name: 'Development Environments Not Scheduled for Shutdown — Always-On Dev Cluster Exceeds Production Spend',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's cloud development environments run continuously 24 hours a day, 7 days a week without automated shutdown schedules — development Kubernetes clusters, non-production databases, and test infrastructure consume cloud resources at full capacity during off-hours when no development activity is occurring. FFIEC IT Handbook technology financial management guidance requires that non-production cloud expenditures be subject to cost controls proportionate to their business value; the always-on development environment infrastructure consumes 38% of the bank's total cloud spend — slightly exceeding the production environment's cost — because 16 independent development clusters run continuously rather than being scheduled to shut down during evenings and weekends, a FinOps discipline gap that the cloud financial governance review identifies as eliminating $920K of annually recoverable spend.`,
    keywords: ['FFIEC IT Handbook', 'FinOps', 'cloud cost waste', 'development environment', 'cloud governance'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3872',
    name: 'Cloud Cost Anomaly Detection Threshold Too High — $180K Unbudgeted Spend Not Flagged by Monitoring',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital configures AWS Cost Anomaly Detection with a $500K monthly threshold — calibrated when the bank's cloud footprint was much smaller — without updating the threshold as cloud spend grew; a cryptomining attack on a compromised EC2 instance generates $180K in GPU instance charges over 12 days without triggering an anomaly alert because the spend does not reach the $500K threshold. FFIEC IT Handbook and OCC Bulletin 2023-17 cloud governance guidance require that cost monitoring controls be calibrated to the institution's current cloud spend profile and risk appetite; the miscalibrated anomaly detection threshold allows the attack to continue for 12 days, generating charges that ultimately exceed the cost of the cryptomining attack by the time remediation is completed — a financial loss that would have been limited to 2 days if the anomaly threshold had been set at 15% above daily baseline spend.`,
    keywords: ['FFIEC IT Handbook', 'cloud cost anomaly', 'OCC Bulletin 2023-17', 'FinOps', 'cloud security'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3873',
    name: 'Cloud Savings Plan Not Matched to Committed Workload — Flexible Compute Coverage Gap in Production',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital purchases AWS Compute Savings Plans based on a generic compute hourly commitment without analyzing which production workloads have stable, predictable usage patterns — the Savings Plan coverage is applied to dynamic-scaling payment processing workloads whose actual usage fluctuates 300% between peak and off-peak hours, providing poor coverage efficiency, while the stable core banking database workloads that would benefit most from Savings Plan coverage remain at on-demand pricing. FFIEC IT Handbook technology financial management and cloud governance guidance require that cloud financial optimization decisions be based on workload analysis; the mismatched Savings Plan produces 41% coverage efficiency — far below the 80% efficiency achievable by applying Savings Plan commitments to the bank's stable workload baseline — creating $640K in annual on-demand charges that Savings Plan analysis would have eliminated.`,
    keywords: ['FFIEC IT Handbook', 'AWS Savings Plans', 'FinOps', 'cloud cost optimization', 'cloud governance'],
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3874',
    name: 'Cloud Database Right-Sizing Not Conducted — Over-Provisioned RDS Instances Waste 60% of Allocated Compute',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital provisions its AWS RDS database instances at the largest size recommended by the cloud migration vendor during initial deployment to avoid performance risk; 18 months post-migration, performance monitoring data shows that the largest instances consistently operate at 12–18% CPU utilization and 22% memory utilization during peak hours — the instances are over-provisioned by an estimated 60% relative to observed demand. FFIEC IT Handbook technology financial management guidance requires that technology resources be sized to operational requirements and that over-provisioning be identified through ongoing performance review; the right-sizing analysis conducted during a FinOps audit identifies $1.1M in annual savings available through instance tier reduction — a saving that the bank's IT team knew existed but had not actioned because no formal right-sizing review process had been established.`,
    keywords: ['FFIEC IT Handbook', 'FinOps', 'RDS right-sizing', 'cloud cost optimization', 'performance management'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3875',
    name: 'Cloud S3 Storage Lifecycle Policy Not Configured — Compliance Archive Data Stored in Hot Tier',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital migrates its regulatory compliance document archive — including 7 years of examination correspondence, model validation reports, and consent order remediation documentation — to AWS S3 Standard storage without configuring lifecycle policies that would automatically transition aging objects to S3 Infrequent Access or S3 Glacier based on access frequency and age. FFIEC IT Handbook records management and technology financial management guidance require that storage tier decisions reflect the access patterns and cost profile of the data; the compliance archive is accessed fewer than 4 times per year but is stored at S3 Standard pricing — costing 8× what S3 Glacier Flexible Retrieval would cost for the same data volume — generating $380K in unnecessary annual storage costs that the FinOps review identifies as eliminating through lifecycle policy implementation.`,
    keywords: ['FFIEC IT Handbook', 'S3 lifecycle policy', 'FinOps', 'cloud storage tiering', 'records management'],
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3876',
    name: 'Multi-Account Cloud Consolidated Billing Not Configured — Volume Discount Tier Not Achieved',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital manages cloud spend across 14 AWS accounts but does not use AWS Organizations consolidated billing — each account is billed separately, and combined cloud spend that would qualify for higher volume discount tiers is not aggregated, resulting in each account paying at the entry-level tier rather than the volume tier applicable to the aggregate spend. FFIEC IT Handbook technology financial management guidance requires that procurement decisions maximize the value obtained from technology expenditures; the absence of consolidated billing means First Capital pays on-demand rates that are 8–12% higher than the volume-tiered rates achievable through consolidated billing — an avoidable overpayment of $290K annually that the bank's cloud financial governance programme identifies as a quick-win remediation requiring a one-time Organizations consolidation exercise.`,
    keywords: ['FFIEC IT Handbook', 'AWS Organizations', 'FinOps', 'cloud billing', 'volume discount'],
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3877',
    name: 'FinOps Practice Not Staffed — Cloud Cost Optimization Responsibility Has No Named Owner',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital operates a cloud estate consuming $8.4M annually without a dedicated FinOps function — cloud cost optimization is informally expected from the cloud engineering team alongside their primary delivery responsibilities, but no staff member has cost optimization in their formal role description, performance objectives, or dedicated work allocation. FFIEC IT Handbook technology financial management and OCC examination guidance on technology risk governance require that material technology expenditures be governed by accountable parties with defined responsibilities; the absence of a FinOps ownership creates a situation where known cost optimization opportunities totalling $2.1M annually — identified in an external cloud cost review — are not implemented because no team has the mandate, capacity, or incentive to drive the changes required across 14 cloud accounts and 6 product engineering teams.`,
    keywords: ['FFIEC IT Handbook', 'FinOps', 'cloud cost governance', 'OCC examination', 'cloud financial management'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3878',
    name: 'Cloud Cost Unit Economics Not Tracked — No Per-Transaction Cost Baseline for Payment Processing',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital manages cloud costs at the aggregate account level but does not track unit economics — the cost per FedNow transaction processed, the cost per loan application decisioned, or the cost per AML alert reviewed — making it impossible to assess whether cloud investments in payment infrastructure are delivering improving or worsening cost efficiency as transaction volumes grow. FFIEC IT Handbook technology financial management guidance requires that technology investments be measured against business value delivered; the absence of unit cost metrics means that when the FedNow payment processing cloud costs grow 45% year-over-year while transaction volume grows 20%, the business case for the infrastructure investment cannot be assessed and the bank cannot determine whether the additional spend reflects capacity investment or inefficiency — a technology financial governance gap identified during the board technology committee's annual review.`,
    keywords: ['FFIEC IT Handbook', 'cloud unit economics', 'FinOps', 'FedNow', 'cloud cost management'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
  {
    code: 'B3879',
    name: 'Cloud Migration Business Case Not Refreshed — Realized Cost Savings 40% Below Projection After 24 Months',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's cloud migration business case projected $4.2M in annual IT cost savings from decommissioning on-premises data centre capacity, reducing hardware refresh spend, and consolidating vendor contracts; 24 months after migration completion, an actual-versus-projected cost analysis shows realized savings of $2.5M — 40% below the projection — because the data centre lease was renewed rather than terminated, on-premises staff were redeployed rather than reduced, and cloud software licensing costs were underestimated in the original model. FFIEC IT Handbook technology financial management and OCC examination guidance require that technology investment business cases be tracked to actual outcomes and that material variances be explained; the 40% shortfall in realized savings is not escalated to the board because the migration programme has been closed and no residual tracking obligation was established — the variance is discovered during a technology portfolio review 24 months later.`,
    keywords: ['FFIEC IT Handbook', 'cloud migration ROI', 'FinOps', 'OCC examination', 'business case tracking'],
    demoRelevant: true,
    subTopic: 'finops-cloud-cost',
  },
];
