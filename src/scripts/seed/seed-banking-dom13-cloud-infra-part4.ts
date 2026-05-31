// seed-banking-dom13-cloud-infra-part4.ts
// Banking genome patterns — Cloud & Infrastructure Risk (dom13)
// Code range: B3880–B3939  (60 patterns)
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

export const BANKING_DOM13_CLOUD_INFRA_PART4_PATTERNS: PatternSeed[] = [

  // ── AI Cloud Governance (B3880–B3897) ────────────────────────────────────────
  {
    code: 'B3880',
    name: 'AI Workload Deployed Outside Approved Cloud Region Without Data Residency Validation',
    officeCategory: 'back_office',
    failureRatePct: 38,
    description:
      `First Capital deploys an AI inference cluster for customer-facing credit scoring and fraud detection in an EU-West cloud region without completing the data residency validation required for US-regulated customer PII, violating OCC cloud risk management guidance and GDPR Chapter V cross-border data transfer restrictions. The bank's cloud governance framework lacks AI-specific data classification rules that would flag inference workloads processing regulated data for mandatory residency review before deployment; during an OCC technology examination, examiners identify that customer account histories and transaction behavioural profiles used as inference inputs are routed through a region whose contractual data processing addendum does not satisfy the adequacy standard required for GLBA-protected financial data, triggering a Matters Requiring Attention citation that requires the bank to remediate 14 production AI deployments within 90 days.`,
    keywords: ['OCC cloud guidance', 'data residency', 'AI workload governance', 'GDPR', 'GLBA'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3881',
    name: 'GenAI Inference on Regulated Customer Data Without DLP Controls',
    officeCategory: 'back_office',
    failureRatePct: 44,
    description:
      `First Capital integrates a third-party large language model API for customer service automation and internal compliance summarisation without deploying data loss prevention controls to inspect and redact regulated customer data — including Social Security numbers, account balances, and wire transfer details — before the data is transmitted to the external model provider. FFIEC cybersecurity guidance and the OCC's expectations for third-party AI risk management require that banks assess data handling practices and implement technical controls preventing exfiltration of non-public customer information to AI service providers; when the compliance team audits API call logs six months after deployment, they discover that over 340,000 customer interactions containing unredacted PII were transmitted to the LLM provider's inference infrastructure, creating a potential Gramm-Leach-Bliley Act safeguards rule violation and triggering a mandatory breach assessment under state notification laws.`,
    keywords: ['DLP controls', 'GenAI third-party', 'FFIEC AI guidance', 'GLBA safeguards', 'LLM data exfiltration'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3882',
    name: 'AI GPU Cluster Without Business Continuity Plan Coverage',
    officeCategory: 'back_office',
    failureRatePct: 41,
    description:
      `First Capital operates a GPU cluster in a hyperscaler environment for AI model training and real-time risk scoring but has not incorporated the cluster into the bank's business continuity plan or conducted a business impact analysis for the AI workloads it supports — including automated credit decisioning and real-time fraud screening that processes over 2 million transactions daily. FFIEC Business Continuity Management booklet guidance requires that all critical technology components supporting banking operations be covered by tested recovery procedures with defined RTOs and RPOs; when a hyperscaler availability zone outage takes the GPU cluster offline for 11 hours, the bank's fraud detection system falls back to static rule-based screening that misses a $4.2 million coordinated card fraud event that the AI model would have flagged, exposing the gap between the bank's BCP documentation and its actual AI-dependent operational posture.`,
    keywords: ['FFIEC BCM booklet', 'AI BCP', 'GPU cluster resilience', 'RTO', 'fraud detection continuity'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3883',
    name: 'LLM API Third-Party Cloud Dependency Not in Vendor Risk Register',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      `First Capital's technology teams integrate LLM API services from multiple third-party AI providers as dependencies in production banking applications — including compliance monitoring, customer correspondence generation, and regulatory report summarisation — without registering these vendors in the bank's third-party risk management programme or conducting the due diligence required under OCC Bulletin 2013-29 for critical technology relationships. FFIEC guidance on third-party risk management requires that all vendors with access to customer data or supporting critical operations be subject to initial due diligence, contractual safeguards, and ongoing monitoring; when one LLM provider experiences a security incident affecting its API infrastructure, First Capital's incident response team discovers they have no contract, no SLA, no data processing agreement, and no established contact at the vendor — leaving them unable to determine whether First Capital customer data was affected.`,
    keywords: ['OCC Bulletin 2013-29', 'LLM vendor risk', 'third-party risk management', 'FFIEC', 'AI dependency'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3884',
    name: 'AI Training Data Exfiltration Risk via Uncontrolled Cloud Storage Access',
    officeCategory: 'back_office',
    failureRatePct: 35,
    description:
      `First Capital's AI development teams store model training datasets — including historical transaction records, customer credit histories, and behavioural analytics — in cloud object storage buckets with overly permissive IAM policies that allow access from any principal in the cloud organisation, creating an AI training data exfiltration risk that the bank's data loss prevention programme has not assessed. FFIEC cybersecurity guidance and NIST AI Risk Management Framework (AI RMF) governance practices require that training data containing regulated customer information be subject to the same access control and classification requirements as production data; an internal red team exercise identifies that a developer can enumerate and download training datasets from a misconfigured storage bucket using only their standard cloud console credentials, exposing 8.3 million customer records used for credit risk model training to potential exfiltration.`,
    keywords: ['AI training data', 'cloud storage IAM', 'NIST AI RMF', 'data exfiltration', 'FFIEC cybersecurity'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3885',
    name: 'Model Explainability Requirements Not Met for Cloud-Deployed Credit AI',
    officeCategory: 'middle_office',
    failureRatePct: 47,
    description:
      `First Capital deploys a gradient boosting credit risk model in a cloud-hosted inference service for automated loan decisioning without implementing the adverse action notice generation and explainability logging required under the Equal Credit Opportunity Act and OCC model risk management guidance (OCC Bulletin 2011-12). The cloud deployment architecture processes real-time credit decisions without capturing feature attribution scores or maintaining an audit trail that would allow the bank to generate Regulation B-compliant adverse action notices explaining specific reasons for credit denials; when a consumer files a complaint with the CFPB alleging that their small business loan application was denied without a specific explanation, the bank's compliance team discovers they cannot reconstruct the model's decision rationale for the cloud-deployed inference version, triggering a supervisory examination into the bank's AI model risk governance programme.`,
    keywords: ['ECOA', 'Regulation B', 'model explainability', 'OCC Bulletin 2011-12', 'adverse action notice'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3886',
    name: 'AI Model Drift Not Monitored in Production Cloud Environment',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      `First Capital's cloud-deployed fraud detection AI model operates in production for 18 months without automated drift monitoring — the model was validated against pre-pandemic transaction patterns and has not been retested as customer spending behaviour, payment channel mix, and fraud typologies have shifted materially. OCC Bulletin 2011-12 model risk management guidance requires that models be monitored on an ongoing basis to detect performance degradation, and FFIEC guidance on AI governance requires that deployed models remain fit for purpose; when the bank's annual model validation review identifies that the fraud model's precision has degraded from 94% to 71% over the deployment period, the subsequent analysis reveals that the cloud MLOps pipeline lacked any automated performance monitoring alerts, and the bank has been processing increased fraud losses attributable to model degradation for at least 9 months before detection.`,
    keywords: ['OCC Bulletin 2011-12', 'model drift', 'AI monitoring', 'MLOps', 'fraud model governance'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3887',
    name: 'Generative AI Output Not Subject to Human Review Before Customer Delivery',
    officeCategory: 'front_office',
    failureRatePct: 49,
    description:
      `First Capital deploys a generative AI system in its digital banking channels to produce personalised financial guidance, loan pre-qualification explanations, and account summary narratives that are delivered directly to customers without any human review workflow or automated content policy guardrails to intercept inaccurate, misleading, or non-compliant outputs. CFPB guidance on AI-generated consumer communications and OCC model risk management expectations require that AI systems producing consumer-facing financial information be subject to appropriate controls; the AI system generates a loan pre-qualification message to a customer stating a specific interest rate that reflects a stale model snapshot, the customer relies on the rate to make a purchase decision, and the actual rate offered at underwriting is 210 basis points higher — triggering a UDAAP complaint and a state banking regulator inquiry into the bank's AI communication practices.`,
    keywords: ['CFPB AI guidance', 'UDAAP', 'GenAI output controls', 'human-in-the-loop', 'OCC model risk'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3888',
    name: 'AI Cloud Spend Lacking Board-Level Oversight and Risk Appetite Alignment',
    officeCategory: 'back_office',
    failureRatePct: 36,
    description:
      `First Capital's AI and data science teams procure cloud GPU capacity, third-party model APIs, and vector database services on a project-by-project basis with no aggregated view of AI cloud expenditure presented to the board or reported within the bank's technology risk appetite framework, creating a situation where cumulative AI cloud commitments have grown to $18 million annually without board approval or risk-adjusted cost-benefit analysis. OCC and FFIEC guidance on technology governance require that material technology investments and their associated risk profiles be subject to board-level oversight; an internal audit identifies that AI cloud contracts have been executed through multiple procurement channels, the bank has vendor concentration risk in two AI providers that have not been escalated to the board risk committee, and the cumulative AI infrastructure spend exceeds the bank's approved technology discretionary budget by 23% — none of which has been disclosed in board reporting.`,
    keywords: ['board AI governance', 'AI cloud spend', 'OCC technology governance', 'FFIEC', 'risk appetite'],
    demoRelevant: false,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3889',
    name: 'AI Vendor Lock-In Risk Not Assessed for Core Banking Intelligence Functions',
    officeCategory: 'back_office',
    failureRatePct: 42,
    description:
      `First Capital has migrated its core anti-money laundering transaction monitoring, credit decisioning, and customer risk scoring functions to AI services that are deeply integrated with a single cloud provider's proprietary machine learning platform — including feature engineering pipelines, model serving infrastructure, and MLOps tooling — without conducting a vendor lock-in risk assessment or developing portability plans as required by OCC third-party risk management expectations. FFIEC guidance on cloud third-party risk requires that institutions assess exit strategy feasibility and concentration risk for critical technology dependencies; when the cloud provider announces a 35% pricing increase for its ML platform effective in 90 days, First Capital's technology team determines that migrating the AML and credit AI workloads to an alternative platform would take 18–24 months and cost $12–15 million due to the proprietary API dependencies that were not considered when the initial architecture decisions were made.`,
    keywords: ['AI vendor lock-in', 'OCC third-party risk', 'ML platform portability', 'AML AI', 'FFIEC cloud risk'],
    demoRelevant: false,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3890',
    name: 'Shadow AI Deployments Bypassing Cloud Governance Controls',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `Individual business units at First Capital deploy AI tools — including LLM integrations, automated analytics notebooks, and third-party AI SaaS applications — using departmental budget authority and personal cloud accounts, bypassing the bank's cloud governance process that requires security review, data classification assessment, and OCC-required third-party risk due diligence. FFIEC cybersecurity guidance and OCC model risk management expectations require that all AI systems processing customer data or supporting banking decisions be subject to enterprise governance; First Capital's annual cloud footprint audit discovers 47 AI-related cloud resources across 12 unregistered cloud accounts, including a business unit that has been routing customer complaint data through a consumer-grade LLM API for 14 months, creating a material GLBA safeguards rule exposure that the bank's information security officer was unaware of.`,
    keywords: ['shadow AI', 'cloud governance bypass', 'FFIEC cybersecurity', 'GLBA safeguards', 'OCC model risk'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3891',
    name: 'Biometric AI Model Deployed Without Disparate Impact Analysis',
    officeCategory: 'front_office',
    failureRatePct: 31,
    description:
      `First Capital deploys a cloud-hosted biometric authentication AI model for mobile banking identity verification without conducting a disparate impact analysis across protected demographic groups, despite CFPB guidance on algorithmic fairness and OCC model risk management requirements that models used in consumer banking contexts be tested for discriminatory outcomes. The biometric model, trained on a dataset with known underrepresentation of certain ethnic groups, has a false rejection rate of 3.2% for the general population but a false rejection rate of 11.7% for customers in specific demographic segments, effectively degrading access to digital banking services for those customers; when a civil rights organisation publishes an analysis of the bank's digital exclusion pattern, the OCC opens an examination into the bank's AI fairness practices and the CFPB issues a supervisory letter requesting documentation of pre-deployment bias testing for all consumer-facing AI models.`,
    keywords: ['biometric AI', 'disparate impact', 'CFPB algorithmic fairness', 'OCC model risk', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3892',
    name: 'AI Red-Teaming Not Conducted Before Production Cloud Deployment',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital deploys a conversational AI system for wealth management client onboarding and a document intelligence system for commercial lending underwriting without conducting structured AI red-team exercises to identify adversarial inputs, prompt injection vulnerabilities, and model manipulation risks before the systems go live in cloud production. NIST AI Risk Management Framework practices and emerging OCC AI risk management expectations require that AI systems deployed in regulated contexts be tested for adversarial robustness; a security researcher demonstrates during a post-deployment responsible disclosure that the lending document AI can be manipulated via crafted PDF inputs to misclassify fabricated financial statements as authentic, producing false confidence scores that would allow fraudulent loan applications to pass automated underwriting checks — a vulnerability that structured red-teaming prior to deployment would have identified and required remediation.`,
    keywords: ['AI red-teaming', 'NIST AI RMF', 'prompt injection', 'adversarial robustness', 'OCC AI risk'],
    demoRelevant: false,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3893',
    name: 'LLM Hallucination Risk Not Mitigated in Regulatory Reporting AI Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 33,
    description:
      `First Capital integrates a large language model into its regulatory reporting workflow to assist compliance analysts in drafting call report narratives, suspicious activity report summaries, and management certification language, without implementing retrieval-augmented generation grounding, confidence thresholds, or mandatory human review checkpoints to mitigate hallucination risk in regulatory submissions. Federal Reserve, OCC, and FFIEC expectations for accuracy in regulatory filings require that institutions maintain controls over the accuracy of information submitted; an LLM-assisted SAR narrative incorrectly characterises the geographic origin of suspicious transactions based on a hallucinated inference not grounded in the underlying transaction data, and the SAR is filed with FinCEN containing materially inaccurate information — a Bank Secrecy Act compliance failure that triggers a FinCEN inquiry and an internal investigation into the bank's AI-assisted compliance processes.`,
    keywords: ['LLM hallucination', 'regulatory reporting', 'SAR accuracy', 'Bank Secrecy Act', 'RAG controls'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3894',
    name: 'AI Model Inventory Not Maintained for Cloud-Deployed Models',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital lacks a comprehensive inventory of AI and machine learning models deployed in its cloud environment — including model versions, deployment dates, data inputs, business functions supported, validation status, and model owner — making it impossible to demonstrate compliance with OCC Bulletin 2011-12 model risk management requirements or respond to examiner requests for a complete picture of the bank's AI model landscape. OCC model risk management guidance requires that banks maintain an inventory of all models used in the institution, with sufficient documentation to support governance and audit; when OCC examiners request a complete model inventory during a scheduled technology examination, the bank produces a list of 23 validated models but subsequent cloud resource scanning identifies 94 deployed ML inference endpoints — revealing that 71 models in production have no governance documentation, no assigned model owner, and no record of validation or ongoing monitoring.`,
    keywords: ['AI model inventory', 'OCC Bulletin 2011-12', 'model governance', 'cloud ML inventory', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3895',
    name: 'Synthetic Data Generation AI Creating Regulatory Audit Trail Gaps',
    officeCategory: 'back_office',
    failureRatePct: 28,
    description:
      `First Capital's AI development teams use generative AI models to produce synthetic financial transaction datasets for model training and testing, but the synthetic data generation pipeline does not maintain provenance records linking synthetic training data back to the original data sources, generation model versions, and privacy-preservation parameters — creating regulatory audit trail gaps that prevent the bank from demonstrating GLBA compliance for AI training data handling. FFIEC guidance on AI model governance and OCC model risk management expectations require that model development processes be documented and auditable; during an internal model validation review, the validator cannot verify whether the synthetic training data used in a fraud model preserves the statistical properties required for the model to generalise to real transactions, and cannot confirm that the generation process met the bank's privacy-by-design standards — requiring the fraud model to be redeveloped from scratch at a cost of $1.4 million.`,
    keywords: ['synthetic data', 'AI training provenance', 'GLBA compliance', 'OCC model risk', 'data lineage'],
    demoRelevant: false,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3896',
    name: 'AI-Powered Customer Segmentation Without Fair Lending Oversight',
    officeCategory: 'middle_office',
    failureRatePct: 45,
    description:
      `First Capital deploys an AI-powered customer segmentation model in its cloud marketing platform that uses unsupervised clustering to identify customer segments for targeted product offers and pricing, without conducting fair lending analysis to verify that the segments do not function as proxies for protected class characteristics under the Equal Credit Opportunity Act and the Fair Housing Act. CFPB and OCC fair lending examination procedures require that AI-driven segmentation models used to make or inform credit or pricing decisions be tested for proxy discrimination; a targeted examination by the CFPB's fair lending division identifies that the AI segmentation model's highest-value customer cluster is statistically correlated with census tract majority-white geography at a rate that would constitute redlining under the bank's existing CRA assessment, and the bank faces a consent order requiring cessation of the AI segmentation programme and a $3.8 million remediation payment.`,
    keywords: ['AI segmentation', 'fair lending', 'ECOA', 'CFPB', 'proxy discrimination'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },
  {
    code: 'B3897',
    name: 'AI Incident Response Plan Not Extended to Cover Cloud AI System Failures',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      `First Capital's incident response plan covers cybersecurity incidents, data breaches, and cloud infrastructure outages but has not been extended to address AI-specific failure scenarios — including model degradation events, adversarial input attacks, AI system hallucination incidents producing incorrect customer communications, and cloud AI vendor outages affecting automated banking processes. FFIEC Business Continuity Management guidance and OCC operational resilience expectations require that incident response procedures cover all material operational risks, and NIST AI RMF governance practices require that AI systems have defined incident response protocols; when First Capital's automated customer service AI begins producing incorrect balance information to customers following a model serving infrastructure update, the bank's incident response team has no defined escalation path, no rollback procedure, no customer notification protocol, and no designated AI incident owner — resulting in 6,400 customers receiving incorrect account information for 4 hours before the system is manually taken offline.`,
    keywords: ['AI incident response', 'FFIEC BCM', 'NIST AI RMF', 'model failure', 'AI operational resilience'],
    demoRelevant: true,
    subTopic: 'ai-cloud-governance',
  },

  // ── Multi-Cloud Sovereignty (B3898–B3909) ─────────────────────────────────────
  {
    code: 'B3898',
    name: 'Cross-Cloud Data Replication Creating Unintended Data Sovereignty Violations',
    officeCategory: 'back_office',
    failureRatePct: 43,
    description:
      `First Capital operates a multi-cloud architecture spanning three hyperscalers for resilience and best-of-breed service selection, but the automated data replication pipelines that synchronise customer data across cloud environments do not enforce data sovereignty boundaries — resulting in regulated US customer data being replicated to cloud storage in jurisdictions where the bank has not completed the jurisdictional risk assessment required by its data governance policy and OCC cloud risk guidance. FFIEC guidance on data governance in cloud environments requires that institutions maintain visibility into where regulated data is stored and processed across all cloud environments; a data lineage audit identifies that transaction data subject to New York Banking Law data protection requirements is being replicated to a cloud provider's Asia-Pacific region as a side-effect of a cross-cloud backup pipeline that was configured without data classification awareness, creating a material data sovereignty exposure affecting 4.1 million customer records.`,
    keywords: ['multi-cloud sovereignty', 'data replication', 'OCC cloud risk', 'FFIEC data governance', 'cross-border data'],
    demoRelevant: true,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3899',
    name: 'Multi-Cloud Key Management Gap Leaving Encryption Keys Outside Bank Control',
    officeCategory: 'back_office',
    failureRatePct: 39,
    description:
      `First Capital uses customer-managed encryption keys (CMEK) for its primary cloud environment but relies on provider-managed keys for workloads deployed across its secondary and tertiary cloud providers, creating an inconsistent encryption governance posture where the bank does not maintain sole control over the cryptographic keys protecting regulated customer data across its entire multi-cloud estate. FFIEC guidance on cryptographic key management and OCC expectations for data protection in cloud environments require that institutions maintain key custody appropriate to the sensitivity of the data being protected; during a Federal Reserve technology examination, examiners identify that customer mortgage and investment account data encrypted with provider-managed keys in two cloud environments cannot be cryptographically destroyed by the bank in the event of a contract termination or regulatory order — a key custodianship gap that represents a material deficiency in the bank's data governance programme.`,
    keywords: ['CMEK', 'multi-cloud key management', 'FFIEC cryptography', 'OCC data protection', 'key custody'],
    demoRelevant: true,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3900',
    name: 'DORA Multi-Cloud Concentration Risk Not Reported to European Regulators',
    officeCategory: 'back_office',
    failureRatePct: 37,
    description:
      `First Capital's European banking subsidiary operates critical ICT functions across three cloud providers but has not performed the concentration risk assessment required under the Digital Operational Resilience Act (DORA) Article 30 to determine whether its aggregate dependence on cloud infrastructure from a single provider — which underlies each of its three cloud environments through a shared hyperconverged networking layer — constitutes a material concentration requiring disclosure to its lead European regulator. DORA requires that EU financial institutions identify, monitor, and report ICT concentration risks, including indirect concentration through common infrastructure dependencies; a DORA readiness assessment commissioned ahead of the January 2025 compliance deadline identifies that 73% of the subsidiary's production workloads across all three cloud providers route through the same underlying network provider's backbone, a concentration that must be reported to the European Banking Authority and addressed through a remediation plan within 90 days.`,
    keywords: ['DORA', 'ICT concentration risk', 'multi-cloud', 'EBA reporting', 'cloud third-party risk'],
    demoRelevant: true,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3901',
    name: 'Multi-Cloud Identity Federation Without Privileged Access Review',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      `First Capital federates identity across its three cloud environments using a central identity provider, but privileged role assignments made in the central identity directory are propagated to all cloud environments without per-environment access review, creating a situation where administrator-level access granted for a specific project in one cloud environment automatically confers equivalent privileges in other cloud environments containing production banking systems. FFIEC cybersecurity guidance on privileged access management and NIST 800-53 access control requirements mandate that privileged access be scoped to the minimum necessary and reviewed on a regular basis; an internal access review discovers that 34 identities with legacy administrator assignments in the bank's development cloud environment have had equivalent production access to core banking systems in the primary cloud environment for an average of 11 months — a privilege accumulation pattern that represents a material separation of duties violation.`,
    keywords: ['multi-cloud identity', 'privileged access', 'FFIEC cybersecurity', 'NIST 800-53', 'access federation'],
    demoRelevant: false,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3902',
    name: 'Cloud-to-Cloud Data Transfer Costs Not Mapped to Business Continuity Architecture',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      `First Capital's multi-cloud business continuity architecture requires automated data synchronisation between primary and secondary cloud environments for real-time failover capability, but the financial modelling for the BCP did not account for cross-cloud data egress costs — which have grown to $2.3 million annually as data volumes have scaled — creating a situation where the BCP's economic viability is dependent on a cost structure that was not approved in the original business case and has not been presented to the board risk committee. FFIEC Business Continuity Management guidance requires that BCP costs be regularly reviewed and that the cost of maintaining resilience be commensurate with the value of the functions being protected; the unplanned data transfer costs are discovered during a cloud cost optimisation review, and the subsequent analysis reveals that three of the bank's five DR runbooks would generate cloud egress costs exceeding $800,000 per activation — costs that have not been included in the bank's operational risk scenario modelling.`,
    keywords: ['cloud egress costs', 'multi-cloud BCP', 'FFIEC BCM', 'DR architecture', 'operational risk'],
    demoRelevant: false,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3903',
    name: 'Regulatory Examination Data Production Impeded by Multi-Cloud Fragmentation',
    officeCategory: 'middle_office',
    failureRatePct: 41,
    description:
      `First Capital's regulated data is distributed across three cloud environments without a unified data discovery and production capability, making it impossible for the bank to respond to OCC examination requests for specific customer data sets within the required regulatory timeframes — because data retrieval requires manual coordination across three cloud platforms, each with different query interfaces, access controls, and data formats. OCC and FFIEC examination guidance requires that banks be able to produce data and records requested by examiners promptly and completely; during a targeted examination into BSA/AML compliance, the bank takes 19 business days to produce a complete transaction history for a set of accounts that spans all three cloud environments, far exceeding the 5-day production window specified in the examination request — leading the OCC to make a Matters Requiring Immediate Attention finding regarding the bank's supervisory data production capability.`,
    keywords: ['regulatory data production', 'multi-cloud discovery', 'OCC examination', 'BSA/AML', 'FFIEC'],
    demoRelevant: true,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3904',
    name: 'Multi-Cloud Monitoring Blind Spots From Siloed Observability Tooling',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital operates separate observability stacks for each of its cloud environments — each cloud provider's native monitoring tooling, with no unified SIEM or cross-cloud event correlation platform — creating security monitoring blind spots where a threat actor moving laterally between cloud environments through compromised federated credentials generates alerts in multiple isolated platforms that are never correlated into a single incident. FFIEC cybersecurity guidance and OCC technology risk management expectations require that institutions maintain comprehensive threat detection capabilities across their technology estate; a post-incident review following a sophisticated phishing attack that resulted in compromised cloud credentials identifies that the attacker's lateral movement across three cloud environments over 72 hours generated 47 individual security alerts that were distributed across three monitoring consoles — none of which were correlated into a single security incident by the bank's security operations team.`,
    keywords: ['multi-cloud observability', 'SIEM', 'FFIEC cybersecurity', 'threat detection', 'lateral movement'],
    demoRelevant: true,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3905',
    name: 'Conflicting Data Retention Policies Across Cloud Environments Creating Compliance Gaps',
    officeCategory: 'back_office',
    failureRatePct: 44,
    description:
      `First Capital has deployed different data retention automation tools in each of its cloud environments, resulting in inconsistent retention periods for the same categories of regulated data — with transaction records retained for 5 years in the primary cloud, 3 years in the secondary cloud, and indefinitely in the tertiary environment due to a misconfigured retention policy — creating compliance gaps against the FFIEC's data retention guidance and OCC expectations for consistent data governance across the bank's technology estate. Inconsistent retention periods create litigation hold complexity, regulatory examination data production failures when historical data has been prematurely deleted from one cloud environment, and potential GDPR right-to-erasure violations where data that should have been deleted remains in one cloud environment after the legally required deletion window. An e-discovery request in a mortgage litigation matter reveals the inconsistency when loan servicing records are found to exist in one cloud environment but have been deleted from two others, creating a data spoliation risk.`,
    keywords: ['data retention', 'multi-cloud governance', 'FFIEC', 'OCC data management', 'litigation hold'],
    demoRelevant: false,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3906',
    name: 'Multi-Cloud Patch Management Lag Leaving Known Vulnerabilities Unaddressed',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's cloud infrastructure patching programme manages OS and container patching cycles independently for each cloud environment, resulting in patch lag differentials where vulnerabilities that have been remediated in the primary cloud environment remain unpatched in secondary and tertiary environments for periods ranging from 14 to 47 days — creating a material cybersecurity risk exposure that the bank's patch management SLA is failing to address across its full cloud estate. FFIEC cybersecurity guidance and CISA binding operational directives on patch management require that institutions apply security patches within defined SLAs based on vulnerability criticality; a threat intelligence briefing identifies that a critical cloud hypervisor vulnerability being actively exploited in the wild has been patched in the bank's primary cloud environment within the required 7-day window but remains unpatched in the secondary cloud environment hosting the bank's disaster recovery systems for 23 days, providing adversaries a window to compromise the bank's BCP infrastructure.`,
    keywords: ['patch management', 'multi-cloud security', 'FFIEC cybersecurity', 'CISA', 'vulnerability management'],
    demoRelevant: false,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3907',
    name: 'Third-Country Cloud Transfers Without Standard Contractual Clauses for EU Subsidiary',
    officeCategory: 'back_office',
    failureRatePct: 34,
    description:
      `First Capital's European banking subsidiary transfers personal data of EU customers to cloud infrastructure operated in the United States without executing Standard Contractual Clauses (SCCs) or conducting the Transfer Impact Assessment required following the Schrems II judgment, relying instead on the Privacy Shield adequacy decision that was invalidated by the Court of Justice of the European Union in 2020. GDPR Chapter V requires a valid transfer mechanism for any transfer of personal data to a third country, and the European Banking Authority's guidance on cloud outsourcing requires that financial institutions ensure their cloud contracts include appropriate data protection safeguards; a Data Protection Authority audit of the subsidiary's cloud outsourcing arrangements identifies the absence of executed SCCs for three cloud provider agreements covering 11.2 million customer records, resulting in a GDPR enforcement action with a proposed fine of €18.5 million.`,
    keywords: ['GDPR SCCs', 'Schrems II', 'EU data transfer', 'EBA cloud outsourcing', 'Privacy Shield'],
    demoRelevant: true,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3908',
    name: 'Multi-Cloud FinOps Governance Lacking Chargeback Accuracy for Regulatory Cost Allocation',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      `First Capital operates shared cloud infrastructure across business lines without granular cost allocation tagging, making it impossible to accurately attribute cloud costs to regulated product lines for FDIC assessment purposes, transfer pricing compliance, and activity-based costing required for internal fund transfer pricing models. OCC guidance on technology cost governance and internal audit expectations for financial reporting accuracy require that material technology costs be accurately allocated to the business activities they support; when the bank's finance team attempts to reconcile cloud costs to regulatory product line reporting for the annual FFIEC Call Report, they identify a $6.2 million unallocated cloud cost pool that cannot be definitively attributed to specific banking products — requiring a restatement adjustment and triggering an internal audit finding on cloud cost governance.`,
    keywords: ['cloud cost allocation', 'FinOps governance', 'FDIC assessment', 'transfer pricing', 'FFIEC reporting'],
    demoRelevant: false,
    subTopic: 'multi-cloud-sovereignty',
  },
  {
    code: 'B3909',
    name: 'Multi-Cloud Contract Termination Rights Not Exercisable Simultaneously',
    officeCategory: 'back_office',
    failureRatePct: 29,
    description:
      `First Capital's cloud contracts with its three hyperscaler providers have staggered termination notice windows — 30 days, 90 days, and 180 days respectively — with data export SLAs that make simultaneous termination and data migration practically impossible, creating a situation where the bank cannot execute a regulatory-mandated cloud exit within the timeframe that an OCC enforcement order might require. OCC third-party risk management guidance requires that institutions maintain exit plans that are realistically executable, and FFIEC guidance on cloud vendor management requires that termination rights and data portability be assessed as part of vendor due diligence; when the bank's third-party risk committee reviews the cloud contracts against the bank's 60-day operational exit target, it determines that complying with the contracts' staggered termination timelines would require a 9-month wind-down period — a gap that must be disclosed to the OCC as a third-party risk management deficiency.`,
    keywords: ['cloud contract exit', 'OCC third-party risk', 'FFIEC vendor management', 'data portability', 'exit planning'],
    demoRelevant: false,
    subTopic: 'multi-cloud-sovereignty',
  },

  // ── API Gateway Governance (B3910–B3919) ─────────────────────────────────────
  {
    code: 'B3910',
    name: 'API Versioning Governance Gaps Causing Breaking Changes to Partner Integrations',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's internal development teams deprecate and modify API versions for core banking services without enforcing a minimum notice period or executing the change communication process required under the bank's API governance policy, resulting in breaking changes to partner integrations that support open banking data sharing, fintech API access, and core banking system interfaces. FFIEC guidance on third-party risk management and OCC operational resilience expectations require that banks maintain reliable technology interfaces supporting critical operations; a payment services directive compliant open banking API is modified to remove a backward-compatible field that is required by 14 registered fintech partners, with a 3-day notice period that does not allow partners to test and deploy updated integrations — resulting in 6 fintech applications losing payment initiation capability for 8 days and triggering complaints to the financial services regulator about the bank's API reliability as an open banking data provider.`,
    keywords: ['API versioning', 'open banking', 'FFIEC third-party risk', 'API governance', 'breaking changes'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3911',
    name: 'Open Banking API Security Not Meeting PSD2 Strong Customer Authentication Standards',
    officeCategory: 'front_office',
    failureRatePct: 48,
    description:
      `First Capital's open banking API gateway implements account information service and payment initiation service APIs without enforcing PSD2 Strong Customer Authentication requirements for all payment initiation calls — a technical implementation gap that allows registered third-party providers to initiate payments on behalf of customers without triggering the multi-factor authentication challenge required under RTS on SCA and Common and Secure Open Standards of Communication. The European Banking Authority's RTS on SCA requires that payment service providers apply SCA for all electronic payments, and that open banking APIs enforce SCA in a manner that cannot be bypassed; a security researcher demonstrates that a registered TPP can use the bank's payment initiation API to execute payments up to the SEPA instant payment limit without triggering an SCA challenge for customers who have previously authenticated in the current browser session — a vulnerability affecting the security of 1.3 million customers' open banking payment journeys.`,
    keywords: ['PSD2 SCA', 'open banking API', 'EBA RTS', 'payment security', 'TPP authentication'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3912',
    name: 'Internal API Deprecation Without Consumer Team Notification Creating Production Outages',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's platform engineering teams deprecate internal microservice APIs supporting core banking operations — including account balance retrieval, transaction history, and payment routing — without notifying all consuming teams or validating that downstream services have migrated to the replacement APIs before the deprecated version is decommissioned, causing production outages when consuming services call deprecated endpoints that have been removed without their knowledge. FFIEC operational resilience guidance and the bank's own change management policy require that changes to shared infrastructure services be communicated to all dependent teams with sufficient lead time for migration; when the payments team decommissions an internal funds transfer API version that was listed as deprecated for 30 days, two consuming services that had been missed in the dependency inventory continue making calls to the deprecated endpoint, causing payment processing failures for 47 minutes during peak transaction volume and triggering a P1 incident review.`,
    keywords: ['API deprecation', 'internal API governance', 'FFIEC change management', 'microservices', 'production outage'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3913',
    name: 'API Rate Limiting Gaps Enabling Third-Party Enumeration of Customer Account Data',
    officeCategory: 'back_office',
    failureRatePct: 44,
    description:
      `First Capital's open banking and partner API gateway does not enforce per-client rate limiting or anomaly detection on account inquiry endpoints, allowing a compromised third-party provider credential to enumerate customer account existence and balance ranges through sequential API calls at a rate that automated security controls should detect and block. FFIEC cybersecurity guidance on API security and PCI DSS version 4.0 requirement 6.4.2 on application security testing require that APIs processing sensitive financial data implement rate limiting, enumeration protection, and anomaly detection; a threat hunting exercise identifies API call patterns consistent with automated account enumeration using a registered fintech partner's client credentials, with 84,000 sequential account inquiry calls made over 6 hours without triggering any rate limiting response — indicating that a compromised partner credential was being used to build a customer account dataset that could facilitate targeted fraud campaigns.`,
    keywords: ['API rate limiting', 'account enumeration', 'FFIEC API security', 'PCI DSS', 'open banking fraud'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3914',
    name: 'API Gateway Logging Insufficient for BSA/AML Transaction Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description:
      `First Capital's API gateway processes payment initiation and account access requests from registered open banking providers but does not log sufficient contextual information — including originating TPP identity, customer agent details, and request payload metadata — to support the Bank Secrecy Act transaction monitoring programme's need to trace suspicious payment patterns initiated through API channels. FinCEN guidance on digital payment monitoring and FFIEC BSA/AML examination procedures require that financial institutions maintain transaction records sufficient to reconstruct financial flows and identify suspicious activity regardless of the channel through which transactions were initiated; when the bank's AML team attempts to investigate a structuring pattern involving payments initiated through three different open banking apps, they discover that the API gateway logs contain insufficient origination data to distinguish between the three TPPs' payment requests — preventing the creation of a comprehensive SAR narrative that accurately describes the suspicious payment channel activity.`,
    keywords: ['API logging', 'BSA/AML', 'open banking monitoring', 'FinCEN', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3915',
    name: 'OAuth Token Management Gaps Enabling Persistent Unauthorised API Access',
    officeCategory: 'back_office',
    failureRatePct: 38,
    description:
      `First Capital's open banking OAuth 2.0 implementation issues long-lived access tokens with 30-day expiry without implementing token rotation or immediate revocation capability — so when a customer reports an open banking application as fraudulent or revokes consent in the bank's consent management portal, the previously issued token remains valid for the remainder of its 30-day lifetime and can continue to be used to access the customer's account data. FFIEC guidance on identity and access management and PSD2 technical standards for open banking require that customer consent revocation result in immediate invalidation of associated access credentials; the bank's consent revocation audit identifies 1,247 cases where customers revoked consent but the associated API tokens remained active and were used to make account data requests after revocation — with 23 cases where the requests were made more than 7 days after the customer had explicitly revoked consent, indicating potential misuse of persistent tokens by the revoked third-party applications.`,
    keywords: ['OAuth token management', 'PSD2 consent revocation', 'FFIEC IAM', 'open banking security', 'token revocation'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3916',
    name: 'API Contract Testing Not Implemented in CI/CD Pipeline',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's microservices development teams deploy updated API services without executing contract tests that verify the API behaviour conforms to published specifications — including open banking API standards, internal service contracts, and partner integration specifications — allowing API regressions that break consumer contracts to reach production without detection during the development pipeline. FFIEC IT examination handbook guidance on software development and change management requires that changes to critical banking systems be tested for compliance with their specifications; a deployment of an updated account information API introduces a change to the response schema that removes a field relied upon by the bank's own mobile banking application and three registered open banking partners, causing the bank's app to crash on transaction history pages and open banking data sharing to fail for 4 hours until the regression is identified and rolled back.`,
    keywords: ['API contract testing', 'CI/CD', 'FFIEC SDLC', 'API regression', 'change management'],
    demoRelevant: false,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3917',
    name: 'API Security Misconfigurations in Production Not Detected by Posture Management',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital deploys API gateway configurations across development, staging, and production environments using infrastructure-as-code but does not operate an API security posture management tool capable of detecting production misconfigurations — including inadvertent exposure of internal administrative endpoints, missing authentication requirements on sensitive endpoints, and overly permissive CORS policies that allow cross-origin API calls from arbitrary domains. FFIEC cybersecurity guidance and OWASP API Security Top 10 recommendations require that APIs be regularly tested for security misconfigurations; a third-party API security assessment commissioned during the bank's annual penetration test identifies that 11 internal administrative API endpoints are accessible from the public internet without authentication due to a firewall rule misconfiguration that was introduced during a cloud infrastructure migration 8 months prior — exposing internal banking system management functions to the internet for the entirety of that period.`,
    keywords: ['API security posture', 'FFIEC cybersecurity', 'OWASP API Security', 'misconfiguration', 'cloud misconfiguration'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3918',
    name: 'Undocumented Internal APIs Creating Shadow Integration Dependencies',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's core banking modernisation programme has left a layer of undocumented internal APIs that were created during legacy system migrations and remain in production use by multiple consuming services without formal documentation, versioning, or ownership assignment — creating shadow integration dependencies that are discovered only when they cause unexpected failures during platform changes. FFIEC IT examination guidance on application architecture management requires that financial institutions maintain accurate documentation of their technology dependencies; when the bank's core banking team decommissions what they believe to be an unused legacy API endpoint, 7 downstream services that had been silently depending on it begin failing, including the bank's regulatory reporting data extraction pipeline and the treasury management system's liquidity position feed — neither of which had been identified in the legacy API's dependency documentation because the API had never been formally registered in the bank's service catalogue.`,
    keywords: ['undocumented APIs', 'shadow dependencies', 'FFIEC IT governance', 'service catalogue', 'API management'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },
  {
    code: 'B3919',
    name: 'API-Level Fraud Detection Not Deployed for High-Risk Payment Initiation Endpoints',
    officeCategory: 'front_office',
    failureRatePct: 47,
    description:
      `First Capital's real-time fraud detection systems monitor card transactions and ACH batches but do not have API-level fraud scoring integrated into the open banking payment initiation API gateway — allowing payment initiation requests that exhibit fraud indicators (unusual amounts, novel beneficiaries, new device fingerprints) to bypass the fraud controls that would apply to the same transactions initiated through the bank's direct payment channels. FFIEC fraud risk management guidance requires that fraud detection controls be applied consistently across all transaction initiation channels, and the bank's own BSA/AML risk assessment identifies API-initiated payments as a high-risk channel; when a fraud ring exploits the API channel's lack of real-time fraud scoring to initiate 340 fraudulent international wire transfers totalling $4.7 million over a 4-hour period, post-incident analysis reveals that 94% of the transactions would have been declined by the bank's existing fraud model if the API channel had been integrated with the fraud scoring platform.`,
    keywords: ['API fraud detection', 'open banking fraud', 'FFIEC fraud risk', 'payment initiation', 'real-time fraud scoring'],
    demoRelevant: true,
    subTopic: 'api-gateway-governance',
  },

  // ── Container Orchestration Risk (B3920–B3929) ───────────────────────────────
  {
    code: 'B3920',
    name: 'Kubernetes RBAC Misconfiguration Granting Excessive Cluster Permissions',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's Kubernetes clusters hosting core banking microservices have role-based access control configurations that grant development team service accounts cluster-admin level permissions to facilitate debugging workflows — privileges that have persisted into production clusters without the least-privilege remediation required by the bank's cloud security standards. FFIEC cybersecurity guidance on privileged access management and NIST 800-53 access control requirements mandate that container orchestration platform permissions be scoped to the minimum necessary for each workload; a Kubernetes security assessment identifies that 14 service accounts in production clusters have cluster-admin bindings — including the service account used by the customer transaction processing microservice — meaning a compromise of the transaction service would give an adversary full control over the Kubernetes cluster hosting the bank's core banking operations, including the ability to access secrets, modify deployments, and exfiltrate all workload data.`,
    keywords: ['Kubernetes RBAC', 'cluster security', 'FFIEC cybersecurity', 'NIST 800-53', 'least privilege'],
    demoRelevant: true,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3921',
    name: 'Container Image Vulnerability Management Not Enforced at Deployment Gate',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's container CI/CD pipeline scans images for vulnerabilities during the build stage but does not enforce a deployment gate that prevents images with critical or high-severity CVEs from being deployed to production Kubernetes clusters — allowing known-vulnerable container images to be deployed when development teams override scan results to meet release deadlines. FFIEC cybersecurity guidance and PCI DSS version 4.0 requirement 6.3.3 require that software vulnerabilities be remediated in a timely manner, and that security controls not be bypassed without compensating control documentation; an operational security review identifies 23 production container images with unmitigated critical CVEs, including a base image vulnerability with a CVSS score of 9.8 that has been present in a payment processing container for 67 days — a period during which the vulnerability has been actively exploited in other organisations according to CISA known exploited vulnerability catalogue.`,
    keywords: ['container image scanning', 'CVE management', 'FFIEC cybersecurity', 'PCI DSS', 'Kubernetes security'],
    demoRelevant: true,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3922',
    name: 'Container Runtime Security Policy Gaps Allowing Privileged Container Execution',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's Kubernetes clusters do not enforce Pod Security Admission policies that would prevent the deployment of privileged containers, containers with host network access, or containers running as root — security configurations that significantly expand the blast radius of a container compromise by allowing a workload to escape its container isolation boundary and access the underlying host node. FFIEC cybersecurity guidance on containerisation and CIS Kubernetes Benchmark security standards require that container runtime security policies enforce least-privilege execution and prevent dangerous security context configurations; a red team exercise demonstrates that a simulated compromise of a non-privileged analytics container can escalate to full host node control in under 8 minutes by exploiting the absence of Pod Security Admission policies — from the host node, the red team is able to access Kubernetes secrets containing database credentials for the bank's core account ledger.`,
    keywords: ['container runtime security', 'Pod Security Admission', 'Kubernetes hardening', 'FFIEC cybersecurity', 'container escape'],
    demoRelevant: true,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3923',
    name: 'Container Secrets Management Using Environment Variables Instead of Secrets Manager',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's containerised banking application workloads inject database passwords, API keys, and encryption key references as Kubernetes environment variables in pod specifications stored in version-controlled Helm charts, rather than retrieving secrets at runtime from a dedicated secrets management service — creating a situation where sensitive credentials are stored in plaintext in source code repositories and Kubernetes etcd. FFIEC cybersecurity guidance on credential management and NIST 800-63B digital identity guidelines require that credentials be protected at rest and in transit and not stored in application code or configuration files; an internal security audit identifies that the bank's source code repositories contain Kubernetes deployment manifests with hardcoded database connection strings for production banking systems — with one credential having been committed to a semi-public internal repository 14 months earlier and accessible to all 800 members of the bank's technology organisation.`,
    keywords: ['container secrets', 'Kubernetes secrets management', 'FFIEC credential management', 'NIST 800-63B', 'hardcoded credentials'],
    demoRelevant: true,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3924',
    name: 'Kubernetes Network Policy Not Enforced Between Regulated and Non-Regulated Workloads',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital operates regulated banking workloads and non-regulated development and analytics workloads in shared Kubernetes clusters without enforcing network policies that restrict east-west traffic between namespaces — allowing any pod in the cluster to establish TCP connections to any other pod, including those containing payment processing services, customer account databases, and cryptographic key material. FFIEC cybersecurity guidance on network segmentation and PCI DSS version 4.0 requirement 1.3.1 on traffic restriction require that network controls restrict traffic between environments of different security classifications; a security assessment identifies that a developer workload running in a development namespace can successfully make REST API calls to the payment processing service API in the production namespace due to absent Kubernetes NetworkPolicy enforcement — a lateral movement path that would allow a compromised development workload to access production banking services directly.`,
    keywords: ['Kubernetes network policy', 'east-west traffic', 'FFIEC network segmentation', 'PCI DSS', 'namespace isolation'],
    demoRelevant: true,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3925',
    name: 'Container Registry Access Controls Not Preventing Unsigned Image Deployment',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      `First Capital's container registry does not enforce image signing requirements, and the Kubernetes admission controller does not validate image signatures before permitting deployment — allowing unsigned or externally sourced container images to be deployed to production clusters without validation that they originate from the bank's trusted build pipeline and have not been tampered with. FFIEC cybersecurity guidance on software supply chain security and NIST 800-161 supply chain risk management practices require that financial institutions implement controls to verify the integrity and provenance of software deployed to production systems; when a software supply chain attack compromises a widely used open-source container base image that is used in First Capital's banking application containers, the bank is unable to determine whether any of its production containers were built from the compromised image version — because it has no image provenance records and deployed images cannot be traced back to specific build pipeline runs.`,
    keywords: ['container image signing', 'supply chain security', 'FFIEC cybersecurity', 'NIST 800-161', 'Kubernetes admission'],
    demoRelevant: false,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3926',
    name: 'Kubernetes Cluster Upgrade Lag Creating Known Exploit Exposure',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's production Kubernetes clusters are running versions that are 4 minor releases behind the current supported version, placing them outside the Kubernetes community's support window and preventing the bank from applying security patches for known cluster-level vulnerabilities — including a critical control plane vulnerability that allows authenticated users to escalate privileges to cluster-admin. FFIEC IT examination handbook guidance on patch management and OCC technology risk expectations require that institutions apply security patches within defined timeframes based on vulnerability severity; the bank's infrastructure team has deferred the Kubernetes upgrade for 14 months due to concerns about application compatibility testing requirements — but the upgrade deferral means the cluster control plane is running with 3 known exploitable vulnerabilities, two of which have public proof-of-concept exploit code and are listed in CISA's Known Exploited Vulnerabilities catalogue.`,
    keywords: ['Kubernetes upgrade', 'cluster security', 'FFIEC patch management', 'CISA KEV', 'control plane vulnerability'],
    demoRelevant: false,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3927',
    name: 'Container Log Aggregation Gap Preventing Forensic Reconstruction of Security Events',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      `First Capital's containerised banking workloads write application and security logs to container stdout but the log aggregation pipeline is not configured to capture logs from short-lived job containers and sidecar containers, creating forensic gaps where security events occurring in ephemeral container workloads — including database backup jobs, certificate rotation jobs, and batch payment processing containers — are lost when the containers terminate. FFIEC cybersecurity guidance on logging and monitoring and OCC technology risk expectations require that institutions maintain complete audit trails for banking operations; during a forensic investigation into suspected insider data exfiltration, the incident response team determines that 11 data export jobs executed by the suspected insider used containerised workloads whose logs were not captured by the aggregation pipeline — making it impossible to determine definitively whether customer data was exfiltrated, the scope of any data accessed, or the complete timeline of the insider's activities.`,
    keywords: ['container logging', 'forensic readiness', 'FFIEC logging', 'OCC technology risk', 'ephemeral containers'],
    demoRelevant: true,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3928',
    name: 'Multi-Tenancy Isolation Failures in Shared Kubernetes Cluster',
    officeCategory: 'back_office',
    failureRatePct: 42,
    description:
      `First Capital operates a shared Kubernetes cluster serving multiple business line applications with namespace-level isolation but without enforcing resource quotas, limit ranges, or network policies between namespaces — creating a multi-tenancy isolation gap where a resource exhaustion event in one business line's namespace can consume cluster resources to the point of starving other namespaces, and where network traffic can flow freely between all tenant namespaces. FFIEC operational resilience guidance and the bank's own service level agreements require that critical banking services maintain availability and performance isolation from non-critical workloads; when a batch analytics job in the bank's marketing analytics namespace runs without resource limits and consumes 87% of the cluster's CPU capacity for 3.5 hours, the payment processing and fraud detection services in other namespaces experience degraded performance — with fraud screening latency increasing from 180ms to 4,200ms, causing real-time fraud decisions to time out and fall back to permissive rules that allow $1.1 million in fraudulent transactions.`,
    keywords: ['Kubernetes multi-tenancy', 'resource isolation', 'FFIEC resilience', 'namespace security', 'resource quotas'],
    demoRelevant: true,
    subTopic: 'container-orchestration-risk',
  },
  {
    code: 'B3929',
    name: 'Service Mesh mTLS Not Enforced Between Regulated Banking Microservices',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital operates a microservices architecture for its core banking platform with a service mesh deployed for observability purposes but has not enforced mutual TLS authentication between services in STRICT mode — allowing service-to-service communication to proceed without certificate-based authentication and leaving inter-service traffic subject to interception or spoofing by a threat actor who has gained access to the cluster network. FFIEC cybersecurity guidance on encryption and authentication and PCI DSS version 4.0 requirement 4.2.1 on cryptographic protection of cardholder data in transit require that sensitive financial data be protected with strong encryption in transit, including within internal network segments; a penetration test of the bank's Kubernetes environment demonstrates that ARP spoofing within a cluster namespace allows a compromised analytics pod to intercept plaintext HTTP traffic between the account management and notification services — traffic that includes customer account balance data and PII — because the service mesh is operating in PERMISSIVE mode.`,
    keywords: ['mTLS', 'service mesh', 'FFIEC encryption', 'PCI DSS', 'microservices security'],
    demoRelevant: true,
    subTopic: 'container-orchestration-risk',
  },

  // ── Cloud Cost Governance (B3930–B3939) ──────────────────────────────────────
  {
    code: 'B3930',
    name: 'Cloud Cost Anomaly Detection Gaps Allowing Runaway Spend to Escape Budget Controls',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's cloud financial operations programme relies on monthly billing review rather than real-time cost anomaly detection — meaning that cloud spend anomalies caused by misconfigured autoscaling policies, data pipeline runaway jobs, or developer test workloads left running in production accounts are not detected and stopped until the following month's billing cycle when the overspend is already materialised. OCC technology risk management expectations and the bank's own financial controls require that material budget variances be detected and escalated promptly; a misconfigured GPU autoscaling policy in the bank's AI development environment scales to 400 GPU instances over a weekend following an automated benchmark trigger, generating $840,000 in unbudgeted cloud spend over 3 days before the infrastructure team returns from the weekend to find the cluster running at maximum scale — a cost anomaly that real-time spend alerting would have surfaced within 2 hours of the scaling event.`,
    keywords: ['cloud cost anomaly', 'FinOps', 'autoscaling governance', 'OCC technology risk', 'cloud budget'],
    demoRelevant: true,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3931',
    name: 'FinOps Policy Enforcement Failures Allowing Non-Compliant Reserved Instance Purchases',
    officeCategory: 'back_office',
    failureRatePct: 43,
    description:
      `First Capital's cloud procurement policy requires that reserved instance and savings plan commitments above $500,000 receive CTO approval before execution, but the policy is enforced through manual review processes rather than automated controls in the cloud management platform — allowing teams with cloud billing account administrator access to make multi-year committed use discounts purchases that bypass the required approval workflow. OCC internal controls expectations and FFIEC guidance on technology financial management require that material financial commitments be subject to appropriate approval controls; an internal audit discovers that three teams have made reserved instance commitments totalling $4.2 million in the preceding 18 months without CTO approval, including a 3-year commitment for a cloud database service that the bank's architecture review board subsequently decides to migrate away from — leaving the bank with $1.8 million in stranded committed cloud spend on infrastructure it no longer uses.`,
    keywords: ['FinOps policy', 'reserved instance governance', 'OCC internal controls', 'cloud procurement', 'committed use'],
    demoRelevant: false,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3932',
    name: 'Shared Cloud Cost Allocation Inaccuracies Distorting Product Line Profitability',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital's shared cloud infrastructure — including networking, security tooling, observability platforms, and shared data services — is allocated to business lines using a flat percentage model based on headcount rather than actual consumption, systematically over-allocating cloud costs to retail banking and under-allocating to the commercial banking division that runs computationally intensive risk models and real-time data processing workloads. FDIC regulatory reporting requirements and the bank's internal management accounting framework require that product line costs be accurately attributed for performance measurement and regulatory capital allocation purposes; when the bank's management accounting team implements consumption-based cloud cost allocation using detailed resource tagging data, they discover that commercial banking has been under-allocated cloud costs by $3.4 million annually, retail banking has been over-allocated by $2.1 million, and the treasury division's actual cloud consumption is 4.3x what the headcount model allocated — materially distorting the profitability metrics used in the bank's resource allocation decisions.`,
    keywords: ['cloud cost allocation', 'FinOps', 'product line profitability', 'FDIC reporting', 'management accounting'],
    demoRelevant: false,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3933',
    name: 'Cloud Waste Not Identified or Reported in Technology Risk Dashboard',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's FinOps programme generates monthly cloud spend reports but does not systematically identify or report cloud waste — including idle compute resources, over-provisioned instances, abandoned storage volumes, orphaned snapshots, and unused reserved capacity — as a technology risk metric in the board technology risk dashboard, obscuring the efficiency and governance dimension of cloud financial management from risk governance reporting. OCC and FFIEC guidance on technology financial management and risk reporting require that the board and senior management receive reporting on material technology risks including financial efficiency and governance; a cloud cost optimisation engagement identifies $7.8 million in annual cloud waste across First Capital's environment, including $2.1 million in idle EC2 instances that have not processed a workload in over 60 days, $1.4 million in orphaned EBS snapshots from decommissioned systems, and $900,000 in reserved capacity that was purchased for a project that was cancelled 8 months ago — none of which has been captured in any risk or financial reporting to the board.`,
    keywords: ['cloud waste', 'FinOps governance', 'OCC technology risk', 'FFIEC', 'board reporting'],
    demoRelevant: true,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3934',
    name: 'Cloud Environment Sprawl Without Lifecycle Management Governance',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's development and project teams provision cloud environments — including development accounts, sandbox environments, proof-of-concept deployments, and temporary testing environments — without a lifecycle management policy that requires environment decommissioning when projects conclude, resulting in cloud account sprawl where the bank has 340 active cloud accounts with 47 having had no billable activity in over 90 days but remaining provisioned with active IAM credentials and resource access. FFIEC IT examination guidance on cloud governance and OCC technology risk expectations require that cloud environments be actively managed and decommissioned when no longer needed; a cloud governance audit identifies that 34 abandoned cloud environments contain residual data — including customer transaction exports, test datasets with real customer PII, and model training data — that was not securely deleted when the projects using those environments concluded, creating ongoing GLBA and state privacy law compliance exposure from data stored in environments with no active owner.`,
    keywords: ['cloud environment lifecycle', 'account sprawl', 'FFIEC cloud governance', 'OCC technology risk', 'GLBA'],
    demoRelevant: true,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3935',
    name: 'Data Transfer Cost Optimisation Not Considered in Cloud Architecture Reviews',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's cloud architecture review process evaluates compute, storage, and security requirements but does not systematically assess data transfer patterns and egress costs during solution design — resulting in architectures where high-volume data flows between availability zones, cloud regions, and external endpoints generate egress costs that were not included in total cost of ownership models and materially exceed projections. FFIEC guidance on technology financial management and prudent technology investment decision-making requires that all material costs be considered in architecture decisions; an analysis of First Capital's cloud billing identifies $4.1 million in unbudgeted annual data transfer costs, including a real-time data replication architecture for the core banking system that generates $1.2 million in inter-region transfer costs annually — costs that were not identified in the architecture business case because the cloud provider's pricing calculator was used without inputting the actual data volume projections from the bank's capacity planning model.`,
    keywords: ['data transfer costs', 'cloud architecture', 'FFIEC technology investment', 'egress costs', 'FinOps'],
    demoRelevant: false,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3936',
    name: 'Cloud Cost Governance Metrics Absent From Third-Party Vendor Contracts',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      `First Capital's contracts with third-party technology vendors who operate cloud infrastructure on the bank's behalf — including managed security service providers, data analytics platforms, and RegTech vendors — do not include cloud cost efficiency benchmarks, consumption reporting requirements, or cost-optimisation obligations, leaving the bank unable to verify whether vendors are operating the bank's workloads efficiently or whether vendor cloud costs are inflated by over-provisioned infrastructure. OCC Bulletin 2013-29 third-party risk management guidance and FFIEC guidance on vendor financial oversight require that contracts with critical technology vendors include appropriate performance and cost reporting obligations; an annual vendor review reveals that the bank's managed cloud security provider has been operating dedicated compute instances sized at 3x the capacity utilisation required by the bank's actual workload, generating $980,000 in annual infrastructure costs that could be reduced to $320,000 without any service degradation — a cost inefficiency that the bank's contract did not require the vendor to proactively identify or address.`,
    keywords: ['vendor cloud costs', 'OCC third-party risk', 'FFIEC vendor oversight', 'managed services', 'FinOps'],
    demoRelevant: false,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3937',
    name: 'Cloud Tagging Policy Non-Compliance Preventing Regulatory Cost Attribution',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's cloud resource tagging policy requires that all cloud resources be tagged with business unit, cost centre, regulatory classification, data sensitivity, and environment identifiers to support regulatory cost reporting, chargeback, and FFIEC IT examination data production — but tagging policy compliance is voluntary and unenforced, with 43% of cloud resources carrying incomplete or absent tags and 61% lacking the regulatory classification tag required for FDIC call report cost attribution. FFIEC guidance on technology cost management and OCC expectations for accurate regulatory reporting require that material technology costs be attributable to the regulated activities they support; when the bank's regulatory reporting team attempts to reconcile cloud infrastructure costs to the FFIEC call report's technology expense line items, they discover that over $9 million in annual cloud spend cannot be attributed to specific regulatory cost categories due to absent tagging — requiring the team to use statistical sampling to estimate cost attribution, a methodology that FDIC examiners flag as insufficiently precise for regulatory reporting purposes.`,
    keywords: ['cloud tagging', 'FFIEC cost reporting', 'FDIC call report', 'FinOps governance', 'resource governance'],
    demoRelevant: true,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3938',
    name: 'Cloud Rightsizing Recommendations Not Acted Upon Due to Change Aversion',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's cloud management platform generates automated rightsizing recommendations identifying significantly over-provisioned compute and database instances based on 90-day utilisation metrics, but the bank's change management process requires application team approval and a full change advisory board cycle for any production infrastructure changes — a process overhead that causes rightsizing recommendations to be deferred indefinitely, with the bank's FinOps platform reporting 847 open rightsizing recommendations totalling $5.3 million in potential annual savings that have been pending approval for an average of 11 months. OCC technology risk management expectations and FFIEC guidance on IT governance require that technology management processes be proportionate to risk and not create bottlenecks that prevent prudent operational management; an internal audit finding identifies that the change management process designed for critical banking system changes is being applied uniformly to low-risk compute rightsizing changes — and that the bank is spending $5.3 million annually in excess cloud costs due to a governance process that was not designed to accommodate routine infrastructure optimisation.`,
    keywords: ['cloud rightsizing', 'FinOps', 'change management', 'OCC technology risk', 'FFIEC IT governance'],
    demoRelevant: true,
    subTopic: 'cloud-cost-governance',
  },
  {
    code: 'B3939',
    name: 'Cloud FinOps Capability Maturity Insufficient for Board-Level Cost Risk Reporting',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      `First Capital's cloud financial operations capability operates at a reactive "crawl" maturity level — tracking historical spend and generating retrospective cost reports — without the forecasting accuracy, real-time anomaly detection, unit economics modelling, or cross-cloud cost visibility required to provide the board risk committee with forward-looking cloud cost risk reporting that is proportionate to the bank's $42 million annual cloud spend. OCC guidance on technology governance and FFIEC expectations for risk management reporting require that boards receive material risk information in a timely and actionable form; the board risk committee's technology risk sub-committee receives monthly cloud cost reports that show trailing spend by account but cannot answer the forward-looking questions material to technology risk oversight — including whether the bank is on track to stay within its cloud budget for the fiscal year, what the cloud cost impact of planned growth and new product launches will be, or which cloud commitments expose the bank to stranded cost risk if strategic priorities change — creating a governance gap that the OCC identifies as a technology risk reporting deficiency during a scheduled examination.`,
    keywords: ['FinOps maturity', 'cloud cost risk', 'OCC technology governance', 'FFIEC risk reporting', 'board reporting'],
    demoRelevant: true,
    subTopic: 'cloud-cost-governance',
  },
];
