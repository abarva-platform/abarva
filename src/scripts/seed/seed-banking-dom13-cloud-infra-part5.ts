// seed-banking-dom13-cloud-infra-part5.ts
// Banking genome patterns — Cloud & Infrastructure Risk (dom13)
// Code range: B3940–B3999  (60 patterns)
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
  aiInsertionRisk?: boolean;
}

export const BANKING_DOM13_CLOUD_INFRA_PART5_PATTERNS: PatternSeed[] = [

  // ── AI Cloud Advanced (B3940–B3957) ──────────────────────────────────────────
  {
    code: 'B3940',
    name: 'AI Model Training Infrastructure Deployed Without BCP Coverage',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      `First Capital operates a distributed AI model training cluster in a hyperscaler environment that continuously retrains fraud detection, credit risk, and AML transaction monitoring models on live customer data, but the cluster has not been incorporated into the bank's business continuity plan — no recovery time objective, recovery point objective, or documented failover procedure exists for the training infrastructure. FFIEC Business Continuity Management booklet guidance requires that all technology components supporting critical banking functions be assessed for business impact and covered by tested recovery procedures; when a cloud networking outage takes the training cluster offline for 36 hours, model retraining pipelines that feed production risk scoring models fall 5 days behind their scheduled refresh cadence, and the bank's fraud model operates on stale patterns during a coordinated fraud wave that causes $3.1 million in undetected losses before the cluster is restored and models are refreshed.`,
    keywords: ['AI BCP', 'FFIEC BCM', 'model training infrastructure', 'RTO RPO', 'fraud model continuity'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3941',
    name: 'GenAI Inference API Rate Limiting Not Implemented for Incident Scenarios',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      `First Capital integrates third-party generative AI inference APIs into its automated customer service, compliance summarisation, and loan origination document processing workflows without implementing rate limiting controls or circuit breaker patterns — meaning that during high-volume incident scenarios where API call volumes spike, the bank has no mechanism to prioritise critical banking workflow calls over lower-priority requests or to shed load gracefully when API rate limits are breached externally. FFIEC operational resilience guidance and the bank's own API dependency management policy require that third-party API integrations include failure mode controls; during a peak customer service volume event triggered by a system maintenance notification, the GenAI inference API rate limit is hit for all callers simultaneously, causing automated complaint categorisation, fraud alert triage, and regulatory correspondence drafting workflows to fail silently — with 14,000 customer interactions going unprocessed for 3 hours before the operations team identifies the cascading failure.`,
    keywords: ['GenAI rate limiting', 'FFIEC operational resilience', 'API circuit breaker', 'inference API', 'incident response'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3942',
    name: 'LLM Fine-Tuning Pipeline Leaking Regulated Customer Data to Cloud Provider',
    officeCategory: 'back_office',
    failureRatePct: 39,
    description:
      `First Capital's AI team uses a cloud provider's managed fine-tuning service to adapt a foundation large language model for compliance and customer service tasks, submitting training datasets that contain unredacted customer correspondence, transaction dispute records, and account management notes without first applying the data minimisation and anonymisation controls required under the GLBA Safeguards Rule and FFIEC guidance on third-party data handling. OCC and FFIEC expectations for AI vendor risk management require that regulated customer data submitted to third-party AI providers be assessed under the bank's data classification and vendor risk framework; a data governance audit of the fine-tuning pipeline identifies that over 920,000 customer records containing PII, account numbers, and financial health information were transmitted to the cloud provider's fine-tuning service under a standard commercial agreement that does not include the data processing addendum or data return and destruction terms required for GLBA-regulated data sharing.`,
    keywords: ['LLM fine-tuning', 'GLBA Safeguards Rule', 'data minimisation', 'third-party AI', 'FFIEC vendor risk'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3943',
    name: 'AI GPU Cluster Lacking Documented Disaster Recovery Runbook',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's AI infrastructure team operates a GPU cluster on a major hyperscaler that supports real-time credit scoring, AML screening, and fraud detection inference for over 4 million daily transactions, but has never produced a disaster recovery runbook documenting the cluster's recovery procedures, dependency map, RTO/RPO targets, or failover architecture — making the GPU cluster one of the most operationally critical and least-documented components in the bank's technology estate. OCC guidance on technology and operational risk requires that all components supporting critical banking processes have documented recovery procedures, and FFIEC Business Continuity Management expectations require that recovery plans be tested and kept current; when the cluster experiences a catastrophic node failure during a scheduled maintenance window, the infrastructure team requires 11 hours to restore service because there is no documented recovery runbook — during which time fraud detection operates at degraded accuracy and three production credit decisioning workflows are suspended entirely.`,
    keywords: ['GPU cluster DR', 'FFIEC BCM', 'OCC technology risk', 'AI disaster recovery', 'inference infrastructure'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3944',
    name: 'ML Pipeline Orchestration Single Point of Failure in Production',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's machine learning pipeline orchestration layer — which coordinates data ingestion, feature engineering, model training, validation, and deployment for all production AI models — runs as a single-instance service on one cloud virtual machine without high-availability configuration, load balancing, or automated failover, creating a single point of failure that can bring the entire ML operations pipeline offline if the orchestration instance becomes unavailable. FFIEC operational resilience guidance and OCC expectations for technology architecture design require that components supporting critical operations be designed with appropriate redundancy; when the orchestration instance's storage volume fails, the entire ML pipeline halts for 8 hours — no new features are computed, model retraining jobs queue indefinitely, and an urgent model rollback needed to address a fraud model performance degradation cannot be executed through the automated pipeline, requiring a manual emergency deployment that bypasses the bank's model change management controls.`,
    keywords: ['ML pipeline orchestration', 'single point of failure', 'FFIEC operational resilience', 'MLOps HA', 'OCC technology risk'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3945',
    name: 'AI Inference Latency SLAs Not Defined for Real-Time Credit Decisioning',
    officeCategory: 'middle_office',
    failureRatePct: 44,
    description:
      `First Capital's cloud-deployed AI credit scoring service processes real-time loan decisioning requests for consumer credit card and personal loan applications but has no defined inference latency SLA — no contractual or internal target for the maximum acceptable response time has been established, and the service has no latency alerting, autoscaling triggers, or fallback scoring policy for periods when inference latency degrades. FFIEC guidance on AI governance and OCC model risk management expectations require that AI systems supporting customer-facing banking decisions have defined performance standards and monitoring; during a model update deployment that inadvertently doubles inference latency from 180ms to 420ms, the credit origination platform begins timing out on AI scoring calls after 300ms, causing 34% of applicants to receive error responses rather than credit decisions — a service disruption that goes undetected for 6 hours because no latency threshold alert was configured.`,
    keywords: ['inference latency SLA', 'AI credit decisioning', 'OCC model risk', 'FFIEC AI governance', 'autoscaling'],
    demoRelevant: false,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3946',
    name: 'AI Feature Store Without Encryption at Rest for Sensitive Customer Features',
    officeCategory: 'back_office',
    failureRatePct: 36,
    description:
      `First Capital operates a centralised ML feature store in its cloud environment that aggregates engineered features derived from customer transaction history, behavioural analytics, and credit bureau data for use across multiple AI models — but the feature store storage layer is configured without encryption at rest, leaving derived financial features that are sufficiently specific to reverse-engineer individual customer profiles unprotected in cloud object storage. FFIEC cybersecurity guidance and GLBA Safeguards Rule requirements mandate that sensitive customer financial information be encrypted at rest in cloud environments; a security architecture review identifies that the feature store contains over 2.1 billion feature records derived from customer data that are stored in plaintext — meaning that a cloud storage misconfiguration or insider access event would expose re-identifiable customer financial profiles without triggering the bank's DLP controls, which are configured only to detect direct PII rather than derived financial features.`,
    keywords: ['ML feature store', 'encryption at rest', 'GLBA Safeguards', 'FFIEC cybersecurity', 'customer feature privacy'],
    demoRelevant: false,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3947',
    name: 'Multi-Tenant AI Inference Infrastructure Sharing PCI-Scoped Workloads',
    officeCategory: 'back_office',
    failureRatePct: 42,
    description:
      `First Capital deploys AI fraud screening models that process cardholder data on a shared multi-tenant inference infrastructure platform where PCI DSS-scoped payment transaction data co-exists on the same compute nodes as non-PCI workloads — a segmentation violation that expands the bank's PCI DSS cardholder data environment scope to encompass infrastructure that was not designed or assessed for PCI compliance. PCI DSS requirements 1.3 and 4.1 mandate that cardholder data be isolated to a defined and assessed CDE with appropriate network segmentation; a PCI DSS v4.0 assessment conducted by the bank's QSA identifies that AI inference containers processing authorisation data share underlying compute with marketing analytics workloads, requiring the bank to either segment the inference infrastructure into a fully PCI-compliant cluster or remove payment data from the AI fraud model inputs — a remediation that requires 4 months and $1.7 million in infrastructure redesign.`,
    keywords: ['PCI DSS CDE', 'multi-tenant AI', 'cardholder data', 'QSA assessment', 'inference segmentation'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3948',
    name: 'AI Model Versioning Without Rollback Capability for Regulatory-Required Recall',
    officeCategory: 'middle_office',
    failureRatePct: 50,
    description:
      `First Capital's cloud MLOps pipeline deploys model updates incrementally using a blue-green deployment pattern but does not retain prior model versions in a format that supports rapid rollback — each new model version overwrites the previous serving artefact, and the serving infrastructure has no tested procedure for deploying a prior version within a regulatory-required timeframe. OCC Bulletin 2011-12 model risk management guidance requires that banks maintain the ability to roll back model changes and restore prior versions, and FFIEC guidance on AI governance requires that model change management procedures include tested recovery capabilities; when a credit model update produces a disparate impact finding during a post-deployment monitoring review, the compliance team requests an immediate rollback to the prior version — only to discover that the serving infrastructure no longer holds the prior artefact, and the model training pipeline must be re-run from a code tag to produce a deployable rollback candidate, a process taking 18 hours.`,
    keywords: ['model versioning', 'OCC Bulletin 2011-12', 'rollback capability', 'MLOps', 'model risk management'],
    demoRelevant: false,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3949',
    name: 'AI Workload Auto-Scaling Not Bounded by Cloud Cost Controls',
    officeCategory: 'back_office',
    failureRatePct: 33,
    description:
      `First Capital's AI inference autoscaling configuration allows workloads to scale GPU compute to unlimited capacity in response to request volume spikes, without cloud budget alerts, spending caps, or approval gates that would prevent runaway scaling events from generating cloud costs that exceed the bank's approved technology budget. OCC guidance on technology cost governance and the bank's own financial controls framework require that automated infrastructure scaling be bounded by approved spending limits with escalation procedures; a load testing script inadvertently executed against a production AI endpoint triggers the autoscaler to provision 340 high-memory GPU instances over 4 hours, generating a $218,000 unplanned cloud bill before the anomaly is detected — a cost control failure that triggers an internal audit finding and requires the bank to implement cloud spending guardrails across all AI inference infrastructure within 60 days.`,
    keywords: ['AI autoscaling', 'cloud cost controls', 'GPU spend', 'OCC technology governance', 'runaway scaling'],
    demoRelevant: false,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3950',
    name: 'Federated Learning Implementation Exposing Gradient Updates to Membership Inference',
    officeCategory: 'back_office',
    failureRatePct: 27,
    description:
      `First Capital pilots a federated learning approach to train fraud detection models across subsidiary institutions without centralising raw customer data, but the gradient aggregation protocol transmits unprotected model gradients that can be used in membership inference attacks to determine whether specific customer records were included in each subsidiary's training dataset — a privacy risk that the bank's AI governance review did not assess before deployment. NIST AI Risk Management Framework and FFIEC guidance on AI privacy risk require that AI training architectures be assessed for data leakage pathways; a research review of the federated learning implementation by the bank's AI red team demonstrates that gradient updates from subsidiaries can be inverted to recover approximate customer transaction amounts and account features for a subset of training participants — exposing the federated learning protocol as a privacy-preserving architecture that does not meet GLBA standards for customer data protection.`,
    keywords: ['federated learning', 'membership inference', 'NIST AI RMF', 'GLBA privacy', 'gradient privacy'],
    demoRelevant: false,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3951',
    name: 'AI Inference Endpoint Without Web Application Firewall Protection',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's cloud-hosted AI inference endpoints for customer-facing credit scoring and fraud classification are exposed via public API gateway without web application firewall protection, leaving them vulnerable to prompt injection payloads, adversarial input attacks, and model extraction queries that could degrade model performance, expose model architecture, or bypass fraud detection logic. FFIEC cybersecurity guidance requires that internet-facing services be protected by appropriate application-layer security controls, and NIST AI RMF governance practices require that AI system deployment architectures include protections against adversarial inputs; a penetration test commissioned as part of the bank's annual red team exercise demonstrates that crafted input payloads can cause the fraud model to consistently output low-risk scores for transactions that match known fraud patterns — a model manipulation vulnerability that has been present since the inference endpoint was first deployed without WAF coverage 14 months earlier.`,
    keywords: ['AI inference WAF', 'adversarial input', 'FFIEC cybersecurity', 'NIST AI RMF', 'model extraction'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3952',
    name: 'Cloud AI Service Outage Not Covered by Operational Risk Capital Model',
    officeCategory: 'middle_office',
    failureRatePct: 38,
    description:
      `First Capital's operational risk capital model includes scenarios for core banking system outages, cybersecurity incidents, and natural disaster events, but does not include AI cloud service outage scenarios — missing the material operational risk associated with the bank's growing dependence on cloud-hosted AI for fraud detection, credit decisioning, and AML monitoring, each of which could generate significant financial loss or regulatory violation if the underlying AI services become unavailable. Basel III operational risk capital requirements and OCC guidance on operational risk management require that capital models incorporate all material risk scenarios; an internal model validation review identifies that the bank's AMA operational risk model has not been updated since the AI-dependent banking functions were deployed, creating a capital model blind spot — and a stress test demonstrates that a 4-hour outage of the bank's cloud AI fraud detection service during peak payment processing would generate $6.8 million in fraud losses that are not captured in any existing capital scenario.`,
    keywords: ['operational risk capital', 'AI service outage', 'Basel III', 'OCC operational risk', 'AMA model'],
    demoRelevant: false,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3953',
    name: 'AI Training Job Scheduling Without Separation From Production Inference Compute',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      `First Capital's cloud AI infrastructure shares GPU compute capacity between model training jobs and production inference workloads using a shared cluster scheduler, without resource isolation guarantees — a training job that exhausts available GPU memory can starve the inference queue, causing production fraud detection and credit scoring requests to time out during periods of intensive training activity. FFIEC operational resilience guidance and the bank's internal SLA for AI-dependent banking functions require that production inference services maintain guaranteed resource availability; a large-scale model retraining job triggered by an automated drift detection alert consumes 87% of shared GPU capacity, causing production inference latency for the bank's real-time fraud model to increase from 95ms to 1,800ms over a 2-hour window — a degradation that the bank's payment processor interprets as an API failure and routes transactions through a fallback static rules engine that misses $940,000 in fraud.`,
    keywords: ['AI compute isolation', 'GPU resource contention', 'FFIEC operational resilience', 'inference SLA', 'training scheduling'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3954',
    name: 'Automated MLOps Promotion Pipeline Bypassing Model Risk Validation Gate',
    officeCategory: 'middle_office',
    failureRatePct: 44,
    description:
      `First Capital's MLOps continuous deployment pipeline automatically promotes models from staging to production when they pass automated performance benchmarks, without requiring the independent model validation review mandated by OCC Bulletin 2011-12 for material model changes — allowing models with improved benchmark metrics but unvalidated assumptions, fairness issues, or stability risks to enter production without human oversight from the model risk management function. OCC model risk management guidance explicitly requires independent validation before material model changes are deployed to production; a fraud model variant that achieves superior precision on benchmark datasets is automatically promoted to production via the CI/CD pipeline, and post-deployment monitoring reveals that the model's improved precision came at the cost of a 31% reduction in recall for a specific merchant category — a degradation that would have been identified during independent model validation but was not captured by the automated benchmark suite.`,
    keywords: ['MLOps promotion', 'OCC Bulletin 2011-12', 'model validation gate', 'CI/CD model risk', 'automated deployment'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3955',
    name: 'AI Data Pipeline Without Lineage Tracking for Regulatory Explainability',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's AI data pipelines that prepare customer data for model training and inference do not maintain end-to-end data lineage tracking — the transformations applied to raw customer data to produce model input features are not recorded with sufficient granularity to trace which source records, transformations, and business rules produced any specific model input, preventing the bank from satisfying OCC and CFPB explainability expectations for AI-based credit and compliance decisions. OCC Bulletin 2011-12 and CFPB guidance on AI use in consumer credit require that banks be able to explain the basis for AI-driven decisions, which requires traceability from raw data through feature engineering to model inputs; when the OCC requests documentation of the feature engineering pipeline for the bank's automated loan underwriting model as part of a technology examination, the bank's AI team cannot produce a complete lineage trace — relying instead on code documentation that is 8 months out of date and does not reflect live pipeline transformations.`,
    keywords: ['data lineage', 'AI explainability', 'OCC Bulletin 2011-12', 'CFPB AI guidance', 'feature engineering audit'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3956',
    name: 'AI Batch Scoring Job Without Data Freshness Validation Before Production Scoring',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      `First Capital operates nightly batch AI scoring jobs that recompute customer risk scores, credit limits, and AML risk tiers using features computed from data extracted earlier in the processing day, but the batch scoring pipeline does not validate whether input feature data meets defined freshness thresholds before execution — allowing the pipeline to run on stale features when upstream data feeds are delayed without alerting the risk operations team. FFIEC guidance on data quality for risk models and OCC model risk management expectations require that models operating on time-sensitive data validate input freshness; when a core banking system ETL delay causes transaction features to be 31 hours stale during a nightly risk tier recalculation, the batch scoring job runs without validation, producing risk tier assignments based on outdated transaction patterns that cause 4,700 customers to be incorrectly classified at a lower risk tier than their current behaviour warrants — an error that results in AML monitoring gaps that persist for 24 hours before the next batch corrects them.`,
    keywords: ['batch scoring freshness', 'data quality', 'OCC model risk', 'FFIEC data governance', 'AML risk tier'],
    demoRelevant: false,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B3957',
    name: 'AI Model Serving Without Canary Deployment Rollout Controls',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      `First Capital deploys updated AI models to production by switching 100% of inference traffic to the new model version simultaneously — without canary deployment controls that would route a small percentage of traffic to the updated model first and allow performance comparison against the incumbent model before full rollout. OCC model risk management guidance and FFIEC change management expectations require that material changes to production AI systems follow a change management process that enables detection and rapid response to unexpected behaviour; a fraud model update that performs within acceptable tolerance on validation datasets is deployed at full traffic, and within 90 minutes post-deployment monitoring reveals that the model produces anomalously low fraud scores for a specific transaction type not represented in the validation dataset — but by the time the issue is identified and a rollback is initiated, 680,000 transactions have been scored under the degraded model, including $1.4 million in fraud that received low-risk scores.`,
    keywords: ['canary deployment', 'model rollout', 'FFIEC change management', 'OCC model risk', 'AI serving strategy'],
    demoRelevant: true,
    subTopic: 'ai-cloud-advanced',
    aiInsertionRisk: true,
  },

  // ── Zero-Trust Architecture (B3958–B3969) ────────────────────────────────────
  {
    code: 'B3958',
    name: 'Zero-Trust Implementation Gaps in Core Banking Cloud Migration',
    officeCategory: 'back_office',
    failureRatePct: 47,
    description:
      `First Capital migrates its core banking workloads to a cloud environment with a stated zero-trust architecture strategy but retains implicit network-based trust for traffic traversing the bank's legacy VPN concentrators — allowing any device authenticated to the VPN to reach core banking APIs without per-session identity verification, defeating the zero-trust principle of never-trust-always-verify that the architecture is supposed to enforce. FFIEC cybersecurity guidance and CISA zero-trust maturity model guidance require that financial institutions implementing zero-trust architectures validate all sessions regardless of network source; a red team exercise demonstrates that a device compromised through a phishing attack on a remote employee can access core banking service APIs through the VPN tunnel without triggering any per-session authentication challenges, because the zero-trust policy enforcement has not been applied to legacy VPN paths that predate the cloud migration — exposing a trust boundary gap affecting 2,400 remote-access users.`,
    keywords: ['zero-trust architecture', 'FFIEC cybersecurity', 'CISA zero-trust', 'VPN trust bypass', 'never trust always verify'],
    demoRelevant: true,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3959',
    name: 'Micro-Segmentation Policy Deficiencies Allowing Lateral Movement Between Banking Zones',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      `First Capital's cloud network micro-segmentation policies define broad security zones for retail banking, commercial banking, and treasury functions but allow east-west traffic between services within each zone without service-level policy enforcement — meaning that a compromised workload within the retail banking zone can reach all other retail banking services through the zone's implicit allow rules rather than being restricted to only the specific services it legitimately needs to communicate with. FFIEC cybersecurity guidance and NIST SP 800-207 zero-trust architecture requirements mandate that network segmentation enforce the principle of least privilege at the workload level, not just at the zone level; a red team exercise demonstrates that a compromised retail banking microservice can enumerate and connect to 47 other services within the retail zone — including payment processing and account management APIs — without triggering any network policy violation, because micro-segmentation has been implemented at the zone perimeter rather than at the individual service level.`,
    keywords: ['micro-segmentation', 'east-west traffic', 'FFIEC cybersecurity', 'NIST 800-207', 'lateral movement prevention'],
    demoRelevant: true,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3960',
    name: 'Identity-Aware Proxy Configuration Errors Exposing Internal Banking APIs',
    officeCategory: 'back_office',
    failureRatePct: 43,
    description:
      `First Capital deploys an identity-aware proxy (IAP) as the primary access control mechanism for internal banking APIs under its zero-trust architecture, but misconfigured IAP bypass rules created by developers during a migration project allow direct access to API backends from specific source IP ranges without IAP authentication — creating an unauthenticated access path to internal banking services that persists after the migration is complete because the bypass rules are never removed. FFIEC cybersecurity guidance and the bank's zero-trust architecture policy require that all access to internal resources be authenticated and authorised through the identity-aware proxy without exception; an internal security review of IAP configuration discovers that 12 internal banking APIs — including the account balance service, transaction history endpoint, and payment routing API — are directly accessible from the bank's data centre IP ranges without IAP authentication, a configuration that has been in place for 7 months and is indistinguishable from an intentional backdoor.`,
    keywords: ['identity-aware proxy', 'IAP misconfiguration', 'FFIEC cybersecurity', 'zero-trust bypass', 'API authentication'],
    demoRelevant: true,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3961',
    name: 'Device Trust Certificates Not Enforced for Zero-Trust Cloud Access',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      `First Capital's zero-trust access architecture requires that all devices accessing cloud banking resources present a valid device trust certificate issued by the bank's PKI before access is granted — but the certificate enforcement policy has exceptions for 340 legacy devices that cannot support the required certificate format, and these devices retain access through username-password authentication alone, creating a significant gap in the bank's device posture verification controls. NIST SP 800-207 zero-trust architecture principles require continuous verification of device trustworthiness as a component of access decisions, and FFIEC cybersecurity guidance requires that institutions maintain controls over the security posture of devices accessing banking systems; when a legacy device exception is exploited in a targeted attack that uses a phishing-captured employee credential to authenticate from an unmanaged personal device, the attacker gains access to core banking systems because the device certificate requirement is not enforced for the exception category — accessing treasury management APIs for 4 hours before the anomalous access pattern is detected.`,
    keywords: ['device trust certificate', 'zero-trust access', 'NIST 800-207', 'FFIEC cybersecurity', 'PKI enforcement'],
    demoRelevant: true,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3962',
    name: 'Privileged Access Workstation Policy Not Extended to Cloud Administration',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      `First Capital requires that all privileged access to on-premises banking systems be performed from dedicated Privileged Access Workstations (PAWs) with hardened configurations and endpoint detection controls, but this requirement has not been extended to cloud console access — cloud administrators can access hyperscaler management consoles and infrastructure-as-code deployment tooling from their standard corporate laptops, which have access to productivity applications, email, and the internet. FFIEC cybersecurity guidance on privileged access management and the bank's own privileged user policy require that privileged access to all banking systems, including cloud-hosted systems, use appropriately secured access pathways; a cloud administrator's standard corporate laptop is compromised through a malicious email attachment, and the attacker uses the browser session credential cache on the compromised device to access the cloud management console and modify network security group rules to open an egress path for data exfiltration — an attack vector that would have been blocked had the PAW requirement extended to cloud administration.`,
    keywords: ['PAW policy', 'privileged access workstation', 'FFIEC cybersecurity', 'cloud administration', 'endpoint security'],
    demoRelevant: false,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3963',
    name: 'Service Mesh mTLS Not Enforced Between All Microservices',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's microservices architecture uses a service mesh with mutual TLS (mTLS) configured in permissive mode that logs mTLS failures but does not enforce mTLS for all inter-service communications — allowing services that were not updated to support mTLS to continue operating without authenticated service-to-service communication, creating a zero-trust gap where service identity is not verified for a subset of internal API calls. FFIEC cybersecurity guidance and NIST SP 800-207 zero-trust architecture requirements mandate that all communications between services be authenticated; a security architecture review identifies that 23% of internal service-to-service communication paths in the bank's payments microservices cluster are operating without mTLS enforcement due to permissive mode configuration, and that service accounts associated with these paths have not been rotated in over 18 months — creating an authenticated-but-unverified communication pattern that contradicts the bank's stated zero-trust architecture posture.`,
    keywords: ['mTLS enforcement', 'service mesh', 'FFIEC cybersecurity', 'NIST 800-207', 'zero-trust service identity'],
    demoRelevant: false,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3964',
    name: 'ZTNA Vendor Single-Tenant Deployment Creating Concentration Risk',
    officeCategory: 'back_office',
    failureRatePct: 35,
    description:
      `First Capital deploys a Zero Trust Network Access (ZTNA) solution from a single vendor as the sole access gateway for all remote employees accessing cloud banking applications, creating a technology concentration risk where a ZTNA vendor outage, security incident, or contract disruption would simultaneously deny cloud access to all 8,200 remote workers supporting critical banking functions. FFIEC guidance on third-party risk and operational resilience require that institutions assess concentration risk for critical technology components and maintain alternative access capabilities; when the ZTNA vendor experiences a global service disruption affecting all customers simultaneously for 3.5 hours, First Capital's remote workforce loses all access to cloud banking systems — suspending trading desk operations, loan origination processing, and customer service capabilities during a period when 67% of the bank's workforce is remote-first.`,
    keywords: ['ZTNA concentration risk', 'FFIEC third-party risk', 'FFIEC operational resilience', 'remote access resilience', 'vendor single point'],
    demoRelevant: true,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3965',
    name: 'Continuous Access Evaluation Not Implemented for High-Value Banking Sessions',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      `First Capital's zero-trust architecture issues access tokens with 8-hour lifetimes for cloud banking application sessions, without implementing continuous access evaluation (CAE) that would revoke tokens immediately when risk signals — such as impossible travel, location anomaly, or credential compromise notification — indicate that an authenticated session may be under adversarial control during the token's valid lifetime. FFIEC cybersecurity guidance on session management and NIST SP 800-207 zero-trust architecture requirements expect that access decisions be continuously evaluated rather than one-time gate checks; a threat intelligence feed notifies the bank's SOC that a cloud credential associated with a treasury manager has been found in a credential dump, but because CAE is not implemented, the compromised credential's active 8-hour session token remains valid and authorised until it expires naturally — allowing a 4.5-hour window during which the attacker accesses treasury management APIs and initiates a $2.3 million wire transfer that requires a manual recall.`,
    keywords: ['continuous access evaluation', 'FFIEC cybersecurity', 'NIST 800-207', 'session revocation', 'token lifetime'],
    demoRelevant: true,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3966',
    name: 'Zero-Trust Maturity Assessment Not Conducted Before Regulatory Filing',
    officeCategory: 'middle_office',
    failureRatePct: 41,
    description:
      `First Capital files its annual OCC technology risk self-assessment representing its zero-trust architecture as "fully implemented" based on vendor marketing collateral and internal project documentation, without conducting a structured zero-trust maturity assessment against the CISA Zero Trust Maturity Model to verify actual implementation depth across identity, devices, networks, applications, and data pillars. OCC guidance on technology risk governance requires that self-assessments be grounded in objective evidence, and FFIEC cybersecurity guidance expects that institutions accurately represent their security controls posture in regulatory filings; when OCC examiners conduct a follow-up technology examination and assess the bank's zero-trust implementation against the CISA maturity model, they find that the bank is at "Initial" or "Advanced" maturity on three of five pillars — specifically network segmentation and data protection — and the self-assessment overstatement constitutes a misleading regulatory representation that triggers an MRA requiring an independent zero-trust gap assessment.`,
    keywords: ['CISA zero-trust maturity', 'OCC self-assessment', 'zero-trust governance', 'regulatory representation', 'FFIEC cybersecurity'],
    demoRelevant: false,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3967',
    name: 'Cloud Workload Identity Not Integrated With HR Offboarding for Zero-Trust',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's zero-trust identity architecture provisions cloud workload identities for employees that are tied to their corporate identity but the automated offboarding workflow that deprovisions access when an employee leaves does not include cloud workload identity revocation — former employees' cloud service account credentials and API keys that were provisioned under their personal namespace remain active in cloud environments for an average of 47 days after their human resources departure date. FFIEC cybersecurity guidance and SOX logical access controls requirements mandate that access be revoked promptly upon termination, and NIST 800-53 access control requirements set a standard of immediate revocation for terminated personnel; an internal access review identifies 14 active cloud service accounts associated with departed employees, including a senior cloud architect who left 6 months earlier and whose cloud credentials could have been used to modify infrastructure as code templates affecting production banking systems.`,
    keywords: ['workload identity', 'offboarding', 'FFIEC cybersecurity', 'SOX access controls', 'NIST 800-53'],
    demoRelevant: false,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3968',
    name: 'API Zero-Trust Enforcement Not Applied to Legacy ESB Traffic',
    officeCategory: 'back_office',
    failureRatePct: 44,
    description:
      `First Capital's zero-trust architecture enforces API authentication and authorisation through an API gateway for modern microservices but exempts legacy enterprise service bus (ESB) traffic from zero-trust policy enforcement — creating a parallel, unauthenticated communication pathway used by core banking integrations that was excluded from zero-trust scope because retrofitting the ESB to support certificate-based authentication was deemed too costly. FFIEC cybersecurity guidance requires comprehensive security controls across all technology components, and NIST SP 800-207 zero-trust principles cannot be selectively applied without creating exploitable trust boundaries; a red team assessment demonstrates that a compromised workload can use the legacy ESB pathway to communicate with core banking services without triggering any zero-trust policy alert — effectively using the legacy integration pathway as an authenticated bypass around the zero-trust gateway that the security architecture team had not modelled as an attack vector.`,
    keywords: ['ESB zero-trust', 'legacy integration', 'FFIEC cybersecurity', 'NIST 800-207', 'API gateway bypass'],
    demoRelevant: true,
    subTopic: 'zero-trust-architecture',
  },
  {
    code: 'B3969',
    name: 'Zero-Trust Policy Exceptions Not Tracked or Time-Bounded',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's zero-trust architecture policy exception process allows teams to request temporary exemptions from specific zero-trust controls during migration projects and integration testing, but the exception tracking register does not enforce expiration dates or automated reviews — policy exceptions accumulate over time without periodic revalidation, and the bank's security architecture team has no reliable visibility into which exceptions remain active. FFIEC cybersecurity guidance requires that security policy exceptions be documented, time-bounded, and subject to periodic review, and OCC expectations for technology risk governance require that risk acceptance decisions be renewed rather than treated as permanent; an audit of the zero-trust exception register identifies 156 active exceptions, of which 93 have been open for more than 12 months without revalidation — including exceptions granting unrestricted inbound access from specific IP ranges to production banking APIs that were approved as temporary during a platform migration that completed 14 months prior.`,
    keywords: ['zero-trust exceptions', 'FFIEC cybersecurity', 'OCC technology governance', 'policy exception tracking', 'risk acceptance'],
    demoRelevant: false,
    subTopic: 'zero-trust-architecture',
  },

  // ── Cloud Security Posture (B3970–B3979) ─────────────────────────────────────
  {
    code: 'B3970',
    name: 'CSPM Alert Fatigue Without Remediation SLA Creating Persistent Misconfigurations',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital deploys a cloud security posture management (CSPM) platform that generates over 3,400 misconfiguration findings per week across its cloud environments, but the security operations team has no defined remediation SLA, no severity-based triage process, and no escalation path for critical findings — causing the alert queue to grow continuously while critical findings related to publicly exposed storage buckets and over-permissioned service accounts remain unaddressed for months. FFIEC cybersecurity guidance requires that institutions maintain effective security monitoring with timely response to identified vulnerabilities, and NIST 800-53 configuration management controls require that security findings be tracked and remediated within risk-appropriate timeframes; a regulatory examination review of the CSPM finding backlog identifies a critical finding about an internet-exposed cloud storage bucket containing mortgage application documents that was initially flagged 4 months earlier but was never escalated above the security operations queue — exposing 67,000 mortgage applicant records to potential unauthorised access.`,
    keywords: ['CSPM alert fatigue', 'FFIEC cybersecurity', 'NIST 800-53 configuration management', 'remediation SLA', 'cloud misconfiguration'],
    demoRelevant: true,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3971',
    name: 'Misconfigured S3 Blob Storage Exposing Customer Account Statement Data',
    officeCategory: 'back_office',
    failureRatePct: 45,
    description:
      `First Capital's cloud storage environment includes a blob storage container used for customer account statement archival that was reconfigured to allow public read access during a developer testing session and never restored to private access — exposing 14 months of archived customer account statements covering 1.2 million customer accounts to unauthenticated internet access. GLBA Safeguards Rule requirements and FFIEC guidance on data protection in cloud environments require that customer financial data be protected against unauthorised access through appropriate access controls; the misconfiguration is discovered by a third-party security researcher who notifies the bank through its vulnerability disclosure programme — not through the bank's own CSPM tooling, which had flagged the storage container as publicly accessible 6 weeks earlier but the finding had not been prioritised for remediation among the hundreds of active CSPM alerts in the security operations queue.`,
    keywords: ['S3 misconfiguration', 'blob storage', 'GLBA Safeguards', 'FFIEC cloud security', 'public access'],
    demoRelevant: true,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3972',
    name: 'IAM Over-Permissioned Service Accounts With Cross-Account Access',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's cloud IAM configuration includes 340 service accounts that have been granted administrator-level permissions within their home cloud account and cross-account access to production banking environments — permissions that were provisioned for initial deployment tasks and never right-sized to the principle of least privilege after deployment. FFIEC cybersecurity guidance and NIST 800-53 account management controls require that service account permissions be scoped to minimum necessary access and reviewed on a regular basis; an IAM permissions audit reveals that service accounts associated with development and testing workloads have read and write access to production database services, payment processing APIs, and customer data stores — and that 14 of these service accounts have not been rotated in over 24 months, creating a material privilege exposure that represents a single-pivot attack path from development to production banking systems.`,
    keywords: ['IAM over-permission', 'service accounts', 'FFIEC cybersecurity', 'NIST 800-53', 'least privilege'],
    demoRelevant: true,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3973',
    name: 'Cloud Security Benchmark Deviations Not Tracked Against CIS Controls',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital's cloud environments are configured without systematic alignment to CIS Cloud Security Benchmarks — each cloud workload team applies security configurations independently, resulting in inconsistent hardening standards where some workloads exceed CIS Level 2 recommendations and others fall below CIS Level 1 minimums for the same control categories. FFIEC cybersecurity guidance and OCC technology risk management expectations require that financial institutions maintain consistent and documented security configurations for cloud infrastructure; a cloud security configuration audit commissioned ahead of a PCI DSS assessment finds that 28% of cloud compute instances running in the bank's production environment have security baseline deviations that would constitute PCI DSS findings — including disabled audit logging, unrestricted outbound network access, and root account SSH access enabled — none of which are tracked in the bank's vulnerability management programme because CIS benchmark compliance is not incorporated into the bank's continuous configuration monitoring.`,
    keywords: ['CIS benchmarks', 'cloud hardening', 'FFIEC cybersecurity', 'OCC technology risk', 'PCI DSS configuration'],
    demoRelevant: false,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3974',
    name: 'Cloud Security Posture Not Included in Board Technology Risk Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 49,
    description:
      `First Capital's board technology risk committee receives quarterly technology risk reports covering cybersecurity incidents, vulnerability management metrics, and penetration test findings, but cloud security posture metrics — including CSPM finding counts, critical misconfiguration trends, and cloud compliance benchmark scores — are not included in board-level reporting, leaving the board without visibility into the bank's cloud security posture risk. OCC guidance on technology risk governance requires that the board receive information sufficient to oversee technology risk, and FFIEC guidance on cloud risk management expects that governance structures include board-level oversight of cloud-specific risks; an OCC technology examination finds that the board risk committee has never reviewed a cloud security posture report, has never approved the bank's cloud security standards, and was not informed of a critical CSPM finding regarding publicly accessible cloud storage that was internally escalated to the CISO — a governance gap that the examiners characterise as a board-level technology risk oversight deficiency.`,
    keywords: ['CSPM board reporting', 'OCC technology governance', 'FFIEC cloud risk', 'board risk committee', 'cloud security oversight'],
    demoRelevant: false,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3975',
    name: 'Cloud Database Firewall Rules Allowing Unrestricted Access From Application Tier',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's cloud-hosted banking databases are protected by firewall rules that allow any connection originating from the application tier subnet without application-level authentication — meaning that any compromised application server within the application subnet can connect to production banking databases without additional credential challenges or IP source verification beyond subnet membership. FFIEC cybersecurity guidance on database security and NIST 800-53 system and communications protection controls require that database access be restricted to authorised application identities with appropriate authentication; a penetration test demonstrates that exploiting a remote code execution vulnerability in one application server provides direct, unauthenticated access to all production databases within the same subnet, including the core banking system database — because the database firewall rule was designed for operational convenience when the subnet was first provisioned and has never been tightened to application-level trust.`,
    keywords: ['database firewall', 'subnet access control', 'FFIEC cybersecurity', 'NIST 800-53', 'application-tier trust'],
    demoRelevant: true,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3976',
    name: 'Cloud Security Posture Drift Between Environments From Manual Configuration Changes',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's cloud security configuration baseline is defined in infrastructure-as-code templates but operations teams frequently apply manual configuration changes to resolve incidents and performance issues without updating the IaC templates — causing progressive posture drift between the documented baseline and actual deployed configuration, so that the bank's CSPM tooling compares actual configuration against an outdated baseline and misses security deviations that have been manually introduced since the last template update. FFIEC cybersecurity guidance and OCC technology risk management requirements expect that security configurations be maintained accurately and that deviations from baseline be detected and remediated; an incident response post-mortem following a cloud security event identifies that the attack exploited a manually configured inbound security group rule that was added 3 months earlier during an application performance incident and never removed — a manual change that did not appear in CSPM comparisons because the IaC baseline template had not been updated to reflect the current approved configuration.`,
    keywords: ['configuration drift', 'FFIEC cybersecurity', 'IaC baseline', 'manual change management', 'CSPM accuracy'],
    demoRelevant: true,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3977',
    name: 'Encryption Key Rotation Not Enforced for Cloud-Hosted Customer Data',
    officeCategory: 'back_office',
    failureRatePct: 43,
    description:
      `First Capital's cloud data protection policy requires that encryption keys for customer data be rotated on a 12-month schedule, but the key management service configuration does not enforce automatic rotation — keys remain in service indefinitely unless manually rotated, and 34% of active encryption keys protecting production customer data have not been rotated in over 24 months. FFIEC cybersecurity guidance and NIST 800-57 key management recommendations require that cryptographic keys be rotated according to defined schedules, and GLBA Safeguards Rule requirements include cryptographic controls as part of the required information security programme; a key management audit identifies that the encryption key protecting the bank's primary customer PII datastore has been in service for 3.5 years — well beyond the policy-mandated rotation schedule — and that the key rotation workflow was never automated when the data was migrated to cloud, creating a key management gap that the bank's CISO was unaware of.`,
    keywords: ['key rotation', 'FFIEC cybersecurity', 'NIST 800-57', 'GLBA Safeguards', 'cloud encryption'],
    demoRelevant: false,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3978',
    name: 'Cloud Threat Detection Rules Not Tuned for Banking-Specific Attack Patterns',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital deploys cloud-native threat detection services with default rule configurations that are tuned for generic cloud workload attack patterns, but has not customised detection rules to identify banking-specific threat scenarios — including bulk customer data export by privileged users, anomalous API call patterns consistent with account takeover reconnaissance, or credential stuffing patterns targeting the bank's authentication APIs. FFIEC cybersecurity guidance requires that institutions maintain threat detection capabilities appropriate to their risk profile, and OCC technology risk management expectations require security monitoring to be calibrated to material threats facing the institution; a threat intelligence report identifies that a financially-motivated threat actor has been conducting reconnaissance against the bank's cloud APIs using patterns specifically designed to evade generic cloud threat detection — the actor's activity generates no alerts across 6 weeks of reconnaissance because the detection rules are not tuned for banking-specific API enumeration patterns, and the first indication of the intrusion is a FinCEN suspicious activity report from a correspondent bank.`,
    keywords: ['cloud threat detection', 'banking-specific tuning', 'FFIEC cybersecurity', 'OCC technology risk', 'API enumeration'],
    demoRelevant: true,
    subTopic: 'cloud-security-posture',
  },
  {
    code: 'B3979',
    name: 'Cloud Security Posture Assessment Not Conducted After Major Architecture Change',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      `First Capital completes a major cloud architecture migration that introduces a new cloud provider, three new service integrations, and a re-architected network topology for its retail banking platform, but the bank's change management process does not require a cloud security posture reassessment after major architecture changes — only routine CSPM scanning continues, which does not evaluate whether the new architecture introduces security risks not covered by existing CSPM rules. FFIEC guidance on technology change management and OCC operational resilience expectations require that material technology changes be subject to security risk assessment before and after deployment; a Federal Reserve examination conducted 4 months after the architecture migration identifies multiple security configuration gaps introduced by the new architecture that were not detected by CSPM scanning — including a misconfigured cross-account IAM trust relationship that grants the new cloud provider's management plane implicit access to the bank's existing cloud environment.`,
    keywords: ['cloud architecture change', 'FFIEC change management', 'OCC operational resilience', 'security reassessment', 'IAM trust'],
    demoRelevant: false,
    subTopic: 'cloud-security-posture',
  },

  // ── Infrastructure as Code Risk (B3980–B3989) ─────────────────────────────────
  {
    code: 'B3980',
    name: 'IaC Drift From Manual Changes Creating Undocumented Security Exceptions',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's infrastructure team uses Terraform-based infrastructure as code to define and manage cloud banking infrastructure, but operations engineers routinely make emergency changes to production infrastructure through the cloud console during incidents — and the reconciliation process for updating IaC templates to reflect these manual changes is informal and inconsistent, leading to an accumulating gap between the declared infrastructure state in IaC and the actual deployed configuration. FFIEC change management guidance and OCC technology risk management expectations require that infrastructure changes follow documented processes that maintain accurate records of production configuration; an IaC state audit identifies 287 production infrastructure resources whose actual configuration diverges from the Terraform state file — including network security group rules, IAM role bindings, and database configuration parameters — with some drift items representing security exceptions approved verbally during incidents that have never been formally documented or subject to risk acceptance review.`,
    keywords: ['IaC drift', 'Terraform state', 'FFIEC change management', 'OCC technology risk', 'manual infrastructure changes'],
    demoRelevant: true,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3981',
    name: 'Terraform State File Containing Credentials Stored Without Access Control',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      `First Capital's Terraform state files — which contain the complete declared configuration of the bank's cloud infrastructure including database connection strings, API keys, and service account credentials embedded in resource definitions — are stored in a cloud storage bucket with read access granted to all members of the cloud engineering organisation, rather than being restricted to the specific CI/CD service accounts and administrators who require access for infrastructure operations. FFIEC cybersecurity guidance on secrets management and NIST 800-53 configuration management controls require that sensitive configuration data be protected with appropriate access controls; a cloud access review identifies that 340 engineers across the bank's technology organisation have read access to Terraform state files containing production database credentials, API keys for payment processors, and HSM configuration details — providing any compromised engineer credential an immediate path to all production infrastructure secrets without requiring any additional privilege escalation.`,
    keywords: ['Terraform state', 'secrets management', 'FFIEC cybersecurity', 'NIST 800-53', 'IaC credentials'],
    demoRelevant: true,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3982',
    name: 'GitOps Pipeline Security Controls Allowing Unapproved Infrastructure Deployment',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's GitOps infrastructure deployment pipeline automatically applies Terraform changes merged to the main branch without requiring a separate deployment approval step — any engineer with merge rights to the infrastructure repository can deploy infrastructure changes to production banking environments by merging a pull request, even if the change has not been reviewed by the cloud security architecture team or approved by the change advisory board. FFIEC change management guidance and OCC technology risk management expectations require that changes to production banking infrastructure be subject to appropriate approval controls; a developer accidentally merges an infrastructure change that removes network egress restrictions from the payment processing subnet, and the GitOps pipeline deploys the change to production within 4 minutes — before the security team's automated scanning pipeline flags the change as a security regression, by which time the misconfiguration has been live for 23 minutes and a subsequent audit must determine whether any unauthorised outbound connections occurred during the exposure window.`,
    keywords: ['GitOps pipeline', 'FFIEC change management', 'infrastructure deployment approval', 'OCC technology risk', 'Terraform automation'],
    demoRelevant: true,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3983',
    name: 'IaC Module Library Without Security Review Process for Third-Party Modules',
    officeCategory: 'back_office',
    failureRatePct: 43,
    description:
      `First Capital's engineering teams use a shared Terraform module library that includes both internally developed and publicly sourced third-party modules from the Terraform Registry — but there is no security review or approval process for third-party modules before they are used in production infrastructure, allowing modules with insecure defaults or malicious insertions to be incorporated into banking infrastructure without assessment. FFIEC cybersecurity guidance on third-party software risk and NIST 800-53 supply chain risk management controls require that software components used in critical banking infrastructure be assessed for security risks; an internal security review identifies that a widely-used third-party Terraform module for cloud load balancer configuration has a misconfigured default that disables TLS termination inspection, and that this module has been used to provision 14 production banking load balancers without the security review that would have identified the insecure default before deployment.`,
    keywords: ['Terraform module security', 'FFIEC supply chain risk', 'NIST 800-53 SCRM', 'third-party IaC', 'infrastructure library'],
    demoRelevant: false,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3984',
    name: 'Infrastructure Code Repository Without Secrets Scanning Controls',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's infrastructure-as-code repositories do not have automated secrets scanning configured — developers frequently commit API keys, database passwords, and service account credentials into IaC configuration files, and these secrets persist in the repository's git history even after they are removed from the current codebase. FFIEC cybersecurity guidance on secrets management and GLBA Safeguards Rule requirements for protecting customer information from unauthorised access require that credential management controls prevent secrets from being committed to source control; a security audit of IaC repository git history identifies 47 instances of committed secrets — including 3 active production database credentials, 2 payment processor API keys, and 8 cloud service account key files — that were committed and subsequently deleted from the working tree but remain accessible in repository history to any team member with repository read access.`,
    keywords: ['secrets scanning', 'IaC credentials', 'FFIEC cybersecurity', 'GLBA Safeguards', 'git history secrets'],
    demoRelevant: true,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3985',
    name: 'IaC Policy-as-Code Controls Not Enforced for Compliance-Critical Configurations',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      `First Capital's IaC deployment pipeline does not incorporate policy-as-code controls — such as OPA or Sentinel — that would automatically reject infrastructure changes violating compliance-critical security policies, like public internet exposure of databases, disabling encryption, or provisioning resources outside approved regions; compliance rules are documented in policy documents but are not automatically enforced in the deployment pipeline, relying on engineer awareness and code review instead. FFIEC change management guidance requires preventive controls for changes that could introduce material risk, and OCC technology risk management expectations require that security policies be enforced through automated controls where possible; a misconfigured database deployment that disables encryption-at-rest passes code review and is deployed to production because the reviewers did not recognise the encryption configuration parameter — a policy enforcement failure that would have been prevented by a policy-as-code check that rejects any infrastructure change disabling encryption for regulated data stores.`,
    keywords: ['policy as code', 'FFIEC change management', 'OCC technology risk', 'OPA Sentinel', 'IaC compliance enforcement'],
    demoRelevant: false,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3986',
    name: 'Immutable Infrastructure Principle Not Applied to Core Banking VMs',
    officeCategory: 'back_office',
    failureRatePct: 47,
    description:
      `First Capital's core banking virtual machines are treated as mutable infrastructure — operations teams patch, update, and modify running VM configurations through SSH access and configuration management agents rather than replacing VMs with newly built immutable images, creating configuration drift and making it impossible to verify that production VMs match their intended security baseline. FFIEC cybersecurity guidance on server hardening and NIST 800-53 configuration management controls require that production systems maintain their security baseline and that baseline deviations be detectable; a forensic investigation following a suspected malware incident on a core banking VM cannot determine the full scope of system modifications because the VM has been patched and reconfigured through 18 months of in-place operations — the forensic team cannot establish a clean baseline against which to identify malicious modifications, extending the incident investigation from a targeted 3-day exercise to a 3-week engagement.`,
    keywords: ['immutable infrastructure', 'FFIEC cybersecurity', 'NIST 800-53 configuration', 'VM baseline', 'configuration drift'],
    demoRelevant: false,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3987',
    name: 'Cloud Resource Tagging Non-Compliance Preventing Automated Security Policy Enforcement',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's cloud security and compliance automation relies on resource tags to determine the sensitivity classification, regulatory scope, and required security controls for each cloud resource — but 43% of production cloud resources lack required tags or have incorrect tag values, causing automated security policies to skip enforcement for resources that should be subject to encryption, access restriction, and logging requirements. FFIEC guidance on data governance in cloud environments and OCC technology risk management expectations require that institutions maintain accurate inventory of cloud resources and their associated risk classifications; an automated compliance scan that relies on a "data-classification:regulated" tag to enforce GLBA-required encryption fails silently for 890 production resources with missing or misconfigured tags — a gap that means encryption-at-rest has never been enforced for these resources despite the compliance scan consistently reporting 100% encryption compliance based on tag-filtered scope.`,
    keywords: ['cloud resource tagging', 'FFIEC cloud governance', 'automated compliance', 'OCC technology risk', 'encryption enforcement'],
    demoRelevant: false,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3988',
    name: 'IaC Privileged Execution Role Without Just-In-Time Access Controls',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's infrastructure-as-code deployment pipeline uses a standing privileged cloud role with administrator-level permissions that is permanently assumed by the CI/CD service account — rather than using just-in-time privilege elevation that grants administrator access only for the duration of a specific approved deployment. FFIEC privileged access management guidance and NIST 800-53 account management controls require that privileged access be granted only when needed and only for the minimum duration required; if the CI/CD service account credentials are compromised — through a supply chain attack on a pipeline dependency or a code injection in a pipeline configuration — the attacker inherits permanent administrator access to all cloud banking environments, without any time-bound limitation that a just-in-time access model would enforce; a red team assessment demonstrates the attack vector and recommends eliminating standing privilege from the CI/CD pipeline within 30 days.`,
    keywords: ['just-in-time access', 'CI/CD privileged role', 'FFIEC privileged access', 'NIST 800-53', 'IaC deployment security'],
    demoRelevant: true,
    subTopic: 'infrastructure-as-code-risk',
  },
  {
    code: 'B3989',
    name: 'IaC Destroy Operations Without Approval Gate for Production Resources',
    officeCategory: 'back_office',
    failureRatePct: 34,
    description:
      `First Capital's GitOps infrastructure deployment pipeline allows Terraform destroy operations — which permanently delete cloud resources — to execute on production banking environments without requiring a separate approval gate beyond the standard code review process, meaning that an engineer with merge rights can initiate the deletion of production databases, load balancers, or network configurations through the same workflow used for routine infrastructure additions. FFIEC change management guidance requires that high-risk operations with irreversible impact be subject to enhanced approval controls, and OCC operational resilience expectations require that banking institutions prevent accidental or unauthorised deletion of systems supporting critical operations; a Terraform refactoring that restructures resource module organisation is merged and deployed, triggering an unintended destroy-and-recreate sequence for a production database cluster — the database is deleted and 6 hours of transaction data is lost before the cluster is restored from the most recent backup.`,
    keywords: ['Terraform destroy', 'FFIEC change management', 'production deletion control', 'OCC operational resilience', 'IaC approval gate'],
    demoRelevant: false,
    subTopic: 'infrastructure-as-code-risk',
  },

  // ── Observability & Monitoring (B3990–B3999) ─────────────────────────────────
  {
    code: 'B3990',
    name: 'Log Retention Compliance Gaps for Cloud-Hosted Audit Logs',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's cloud audit logs — covering administrator activity, API calls, data access events, and security-relevant configuration changes — are retained for 90 days in the cloud provider's default logging service, which falls short of the 7-year retention requirement for banking system access logs under FFIEC guidance and the bank's own records management policy, creating a compliance gap where historical audit evidence cannot be produced for regulatory examinations. OCC and FFIEC guidance on audit logging require that financial institutions retain security logs for periods sufficient to support regulatory examination, litigation hold, and forensic investigation requirements; an OCC technology examination requests access to administrator activity logs for a 2-year period to investigate a historical configuration change, and First Capital cannot produce logs beyond the 90-day cloud retention window — a retention gap that constitutes a supervisory finding and requires the bank to implement long-term log archival within 60 days.`,
    keywords: ['log retention', 'FFIEC audit logging', 'OCC examination', 'cloud audit logs', 'records management'],
    demoRelevant: true,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3991',
    name: 'Distributed Tracing Data Capturing Sensitive Customer Payload Content',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      `First Capital's distributed tracing implementation in its cloud microservices architecture captures full HTTP request and response payloads as trace attributes to facilitate debugging — including API calls that transmit customer account numbers, transaction amounts, authentication tokens, and personal financial information — storing this sensitive data in the distributed tracing backend without the access controls and encryption required for regulated customer data. FFIEC cybersecurity guidance and GLBA Safeguards Rule requirements extend to all systems where regulated customer information is stored, including observability infrastructure that was not initially classified as a regulated data store; a data governance audit of the observability stack identifies that the distributed tracing backend contains 14 months of banking API traces including unredacted customer PII, account data, and authentication tokens — data that is accessible to all engineers with tracing platform access and has not been included in the bank's customer data inventory or DLP monitoring scope.`,
    keywords: ['distributed tracing', 'GLBA Safeguards', 'FFIEC cybersecurity', 'observability data sensitivity', 'PII in traces'],
    demoRelevant: true,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3992',
    name: 'SIEM Alert Correlation Failures Allowing Multi-Stage Attack to Proceed Undetected',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      `First Capital's SIEM system receives security event feeds from cloud infrastructure, application APIs, IAM systems, and endpoint detection platforms, but alert correlation rules are not configured to detect multi-stage attack patterns — each individual stage of an attack (credential enumeration, privilege escalation, lateral movement, data staging) generates isolated alerts that individually fall below escalation thresholds, and the SIEM lacks correlation rules that would link these alerts into a unified attack chain. FFIEC cybersecurity guidance requires that security monitoring maintain the capability to detect coordinated attacks across multiple systems, and OCC technology risk management expectations require that threat detection be calibrated to the bank's risk profile; a post-incident review following a cloud credential compromise that resulted in access to payment data identifies that the SIEM generated 14 individual alerts across 6 hours of attacker activity — but correlation rules that would have linked credential anomaly, API enumeration, and data export patterns into a single high-priority incident did not exist, allowing each alert to be triaged individually and dismissed as low-confidence.`,
    keywords: ['SIEM correlation', 'FFIEC cybersecurity', 'OCC threat detection', 'multi-stage attack', 'alert chaining'],
    demoRelevant: true,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3993',
    name: 'Cloud Monitoring Coverage Gaps for Serverless Banking Functions',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital migrates several payment processing and customer notification workflows to serverless cloud functions, but the bank's existing monitoring and alerting infrastructure is configured for virtual machines and container-based workloads — serverless functions are not covered by existing health monitoring, error rate alerting, or distributed tracing integration, creating observability blind spots where function failures and performance degradations go undetected. FFIEC operational resilience guidance requires that all components supporting critical banking functions be subject to appropriate monitoring, and OCC technology risk management expectations require that institutions maintain visibility into the operational health of all critical systems; a serverless function responsible for processing regulatory push notifications fails silently for 4 days due to a downstream API permission change, and 12,400 customers do not receive mandatory regulatory disclosures within the required timeframe — a compliance failure that is only discovered when a customer complains about not receiving a required notification.`,
    keywords: ['serverless monitoring', 'FFIEC operational resilience', 'OCC technology risk', 'cloud function observability', 'monitoring coverage'],
    demoRelevant: false,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3994',
    name: 'Metrics and Alerting for Critical Banking APIs Not Configured to Detect Degradation',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's cloud operations team has not configured latency, error rate, or availability alerting for critical banking APIs — including the payment initiation API, account balance service, and fraud screening endpoint — relying instead on customer complaint inflow and transaction monitoring dashboards to identify API degradation, which introduces a detection lag of 30-90 minutes before banking API issues are escalated to the engineering team. FFIEC Business Continuity Management guidance and OCC operational resilience expectations require that institutions have timely detection capabilities for failures in critical systems, with recovery initiated within defined timeframes; an API gateway configuration change that introduces a 900ms latency regression for the payment initiation API goes undetected through monitoring for 47 minutes, during which 6,200 payment attempts timeout and are abandoned — losses that are only quantified retrospectively from payment processor reconciliation data after the issue is identified through a customer escalation.`,
    keywords: ['API monitoring', 'FFIEC BCM', 'OCC operational resilience', 'latency alerting', 'payment API observability'],
    demoRelevant: true,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3995',
    name: 'Security Log Tampering Detection Not Implemented for Cloud Audit Trail',
    officeCategory: 'back_office',
    failureRatePct: 37,
    description:
      `First Capital's cloud audit logging infrastructure does not implement tamper-evident log storage or integrity verification — audit logs are written to a cloud storage bucket that can be modified or deleted by cloud administrators with appropriate IAM permissions, and the bank has no mechanism to detect whether audit log records have been modified or deleted to conceal administrative activity. FFIEC cybersecurity guidance on audit logging and SOX Section 302/404 requirements for internal control over financial reporting require that audit logs be protected against unauthorised modification, and OCC expectations for governance and controls require that audit trails be reliable; an internal audit review identifies that the IAM role used by the SIEM integration also has write and delete permissions on the audit log storage bucket — creating a scenario where a compromised SIEM service account could be used to delete audit evidence of a security incident, a control deficiency that must be remediated by implementing immutable log storage within 30 days.`,
    keywords: ['log tamper detection', 'FFIEC audit logging', 'SOX internal controls', 'OCC governance', 'immutable logs'],
    demoRelevant: false,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3996',
    name: 'Synthetic Monitoring Not Implemented for Customer-Facing Banking Channels',
    officeCategory: 'front_office',
    failureRatePct: 44,
    description:
      `First Capital's digital banking channels — including mobile banking, online banking, and the open banking API portal — are not monitored by synthetic transaction monitoring that would proactively test critical customer journeys from external perspectives, meaning that availability and functional issues affecting customers are detected only through reactive monitoring of infrastructure metrics or customer complaint volume rather than proactive verification. FFIEC Business Continuity Management guidance requires that institutions maintain monitoring capabilities sufficient to detect service disruptions and initiate recovery within defined RTOs; a certificate renewal failure causes the online banking login endpoint to return TLS handshake errors to customers for 2.5 hours during a weekend morning — the bank's infrastructure monitoring shows all backend systems healthy because the failure is at the edge certificate layer, and the only indication of the customer-facing outage is a spike in mobile app error logs that is not configured to trigger an alert, leaving the incident undiscovered until Monday morning customer service calls.`,
    keywords: ['synthetic monitoring', 'FFIEC BCM', 'digital banking availability', 'customer journey monitoring', 'proactive detection'],
    demoRelevant: true,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3997',
    name: 'Observability Data Sovereignty Violation From Cloud-Provider Managed Monitoring',
    officeCategory: 'back_office',
    failureRatePct: 41,
    description:
      `First Capital uses a cloud provider's managed observability platform for log aggregation, metrics collection, and distributed tracing across its banking workloads, but has not assessed whether the observability platform stores log and metric data — which may contain transaction patterns, customer activity metadata, and operational details — in cloud regions that comply with the bank's data sovereignty requirements and the contractual data processing terms in its cloud agreement. FFIEC guidance on data governance in cloud environments and OCC cloud risk management expectations require that institutions assess where all data associated with banking operations is processed and stored; a data residency audit identifies that the cloud observability platform is configured to replicate log data to a geographically distributed backend for redundancy, with one replica stored in a region outside the bank's approved data sovereignty perimeter — exposing operational data that includes API call patterns, authentication events, and transaction processing logs to a jurisdiction the bank has not assessed under its data sovereignty framework.`,
    keywords: ['observability data sovereignty', 'FFIEC cloud data governance', 'OCC cloud risk', 'log data residency', 'managed monitoring'],
    demoRelevant: false,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3998',
    name: 'On-Call Engineering Coverage Gaps Extending Cloud Incident Mean Time to Resolve',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's cloud operations on-call rotation covers platform infrastructure incidents but does not include application-layer and AI system specialists — cloud incidents requiring diagnosis of application-specific behaviour, database query performance, or AI model serving issues outside business hours must wait for SME engineers to be paged through an informal escalation process that adds 45-90 minutes to mean time to resolve, extending customer-facing service disruptions well beyond the bank's defined RTO for critical banking services. FFIEC Business Continuity Management guidance and OCC operational resilience expectations require that recovery procedures be executable within defined timeframes, which requires available expertise to diagnose and resolve incidents at the required pace; a weekend cloud incident affecting payment processing is resolved in 4.5 hours — 3 hours beyond the bank's 90-minute payment processing RTO — because the on-call team diagnosed the issue within 30 minutes but required 3 hours to page, brief, and engage the application engineering specialist with the expertise to resolve the root cause.`,
    keywords: ['on-call coverage', 'FFIEC BCM', 'OCC operational resilience', 'MTTR', 'cloud incident response'],
    demoRelevant: false,
    subTopic: 'observability-monitoring',
  },
  {
    code: 'B3999',
    name: 'Cloud Cost Anomaly Detection Not Linked to Security Operations Alerting',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      `First Capital's cloud cost anomaly detection tools and security operations monitoring operate as separate platforms with no integration — unusual cloud spending patterns that may indicate crypto-mining malware, data exfiltration egress, or unauthorised resource provisioning by a threat actor are reported to the FinOps team through the cost management dashboard, but are not automatically escalated to the security operations team for threat assessment. FFIEC cybersecurity guidance and OCC technology risk management expectations require that financial institutions maintain threat detection capabilities across all relevant signals, and NIST 800-53 incident response controls recommend that anomalous operational signals be evaluated for security significance; a sudden 340% spike in cloud egress costs is flagged by the cost anomaly tool and assigned to the FinOps queue for cost investigation — while the security team is simultaneously investigating an unrelated alert, the FinOps investigation takes 11 days to identify that the egress spike represents a data exfiltration event in progress, during which the threat actor exports 2.3 million customer records.`,
    keywords: ['cloud cost anomaly', 'FFIEC cybersecurity', 'OCC technology risk', 'NIST 800-53 incident response', 'data exfiltration detection'],
    demoRelevant: true,
    subTopic: 'observability-monitoring',
  },
];
