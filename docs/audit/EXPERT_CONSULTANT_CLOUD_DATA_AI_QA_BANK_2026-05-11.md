# AbarVa Cloud, Data, AI, And Disruption QA Bank

Date: 2026-05-11
Purpose: executive-regression bank for CIO/CXO questions on cloud strategy, data platforms, AI infrastructure, hyperscaler economics, private cloud, Epic strategy sensitivity, and AI startup disruption across healthcare, retail, and financial services.

This bank complements:

- `EXPERT_CONSULTANT_QA_BANK_2026-05-11.md` — domain-depth questions.
- `EXPERT_CONSULTANT_SURFACE_QA_BANK_2026-05-11.md` — page/agent/surface behavior.

The questions below test whether the agent can sound like a real senior technology strategy advisor, not a cloud reseller, procurement analyst, or generic AI pundit.

## Universal Pass Bar

Every answer should:

- Form a view first.
- Separate workload fit from procurement leverage.
- Explain economics: run-rate, egress, committed spend, replatforming cost, operating-model complexity, talent, security, and time-to-value.
- Distinguish cloud AI, data-platform modernization, application hosting, and model-serving decisions.
- Avoid fabricating exact prices, discount levels, vendor market shares, or secret vendor roadmaps.
- Treat vendor-sensitive topics such as Epic hosting strategy carefully: reason from known market dynamics and client architecture, but do not claim inside knowledge of Epic's confidential roadmap.
- Identify startups by category and disruption vector where exact vendor evidence is not available.

Automatic fail terms:

- `the corpus does not contain`
- `limited indexed data`
- `indexed sources`
- `not corpus-grounded`
- Exact invented market share or pricing claims
- Claiming secret Epic roadmap knowledge
- Treating multicloud as a universal strategy without operating-model cost

## Healthcare / Meridian Health

Client context to use when relevant: Meridian has Epic as the clinical system of record, Snowflake / Epic Cogito / dbt context in analytics, Palantir in the research/analytics estate, legacy Hadoop, research-owned on-prem NVIDIA/private-cloud infrastructure hosting local LLMs, no current enterprise Claude-on-Bedrock/Azure Foundry adoption in research, CIO interest in cloud AI, data privacy/security constraints, and interest in what Stanford/Mayo-style cloud research programs imply.

| ID | Question | Expected advisor answer |
|---|---|---|
| HCAI-01 | Should Meridian go harder multicloud to pressure AWS for credits? | Push back: credit leverage is a tactic, not strategy. Segment by workload fit, data gravity, operating model, security, and actual migration credibility. |
| HCAI-02 | Should we put Claude on AWS Bedrock, Azure Foundry, or keep local LLMs? | Segment workloads: local LLMs for research/privacy-sensitive experimentation; Bedrock/Azure for governed enterprise workflows; choose by data boundary, Epic/M365 integration, and governance. |
| HCAI-03 | Does Epic's cloud/hosting ambiguity change our Azure strategy? | Yes, but do not speculate on Epic's confidential roadmap. Keep Epic integration architecture portable, avoid hard-coding a single hyperscaler thesis around future Epic hosting, and track Epic-hosted vs cloud-adjacent workloads separately. |
| HCAI-04 | Should Epic be hosted by Epic, Azure, or our own cloud team long term? | Treat this as a risk/options question. Epic-hosted may reduce operational burden; Azure adjacency may help Microsoft/clinical AI integration if Epic supports it; self-hosting keeps control but increases operational burden. |
| HCAI-05 | What should we ask Epic about AI and hosting without sounding naive? | Ask about validated cloud hosting patterns, data residency, model access boundaries, App Orchard/Cosmos/Cogito strategy, Azure/Microsoft interoperability, disaster recovery, and commercial implications. |
| HCAI-06 | Is Snowflake still the right analytics foundation for Meridian? | Likely yes for governed enterprise analytics; add Databricks or specialized ML tooling where feature engineering/model lifecycle requires it. Do not make this a religious migration. |
| HCAI-07 | Should we move research data from Hadoop into a lakehouse? | Yes, but sequence by data classification and research priority; retire Hadoop as a dependency for new AI while preserving validated historical datasets. |
| HCAI-08 | How do Palantir and Databricks coexist? | Palantir can be operational ontology/workflow; Databricks can be ML engineering; Snowflake can be governed analytics. The risk is competing sources of truth. |
| HCAI-09 | Should research digital twins run on GCP because Stanford/Mayo use cloud? | Not automatically. Learn from their cloud-research maturity, but Meridian's privacy posture, Epic estate, Palantir footprint, and local NVIDIA stack change the decision. |
| HCAI-10 | How do we compare private cloud GPUs vs hyperscaler GPUs? | Compare utilization, security, data movement, model lifecycle, burst capacity, talent, refresh cycles, and total cost. Private wins for steady sensitive workloads; cloud wins for elasticity and managed services. |
| HCAI-11 | What is the economic trap in building an AI platform for all healthcare processes? | A broad platform can consume years before ROI. Anchor platform spend to named workflows such as HCC, ambient documentation, prior auth, and care management. |
| HCAI-12 | Which healthcare startups are most disruptive to Epic? | Name categories rather than overclaim: ambient documentation, patient access, prior auth, revenue cycle, care navigation, clinical trial matching, and specialty AI. Epic remains the workflow gravity; startups win at focused workflow depth. |
| HCAI-13 | Is Abridge a threat to Epic or complementary? | Usually complementary if embedded into clinical documentation workflow; threatening only if it becomes the clinician-facing intelligence layer and owns downstream documentation/coding signals. |
| HCAI-14 | Should we bet on Microsoft healthcare AI because of Nuance and Teams? | Microsoft has real healthcare workflow adjacency through Nuance/Teams/Azure, but Meridian should test Epic integration, PHI governance, and clinical workflow fit rather than buy the platform story. |
| HCAI-15 | What is the cost case for moving clinical analytics to cloud? | Value comes from elasticity, data sharing, ML tooling, and reduced legacy drag; costs rise through duplicated platforms, egress, security overhead, and underused committed spend. |
| HCAI-16 | How should we negotiate with hyperscalers on AI commitments? | Tie commitments to specific workloads and exit ramps; avoid buying credits before data readiness and governance unblock usage. |
| HCAI-17 | Is Azure safer for healthcare because of Microsoft/Epic relationships? | Not automatically. Azure may be advantaged for M365/Nuance/Epic-adjacent workflows, but safety depends on architecture, BAAs, access controls, auditability, and data flows. |
| HCAI-18 | Should we standardize on one model provider? | No. Standardize governance, routing, evaluation, and data controls; allow multiple models where use cases differ. |
| HCAI-19 | What should the board hear about private AI infrastructure? | It buys control and privacy for sensitive workloads, but can become an expensive island without governance, integration, and utilization discipline. |
| HCAI-20 | What should Meridian do first in cloud AI? | Pick a high-value, low-clinical-risk workflow such as prior-auth evidence assembly, HCC workflow support, or enterprise knowledge retrieval; do not start with a broad healthcare OS. |
| HCAI-21 | How do we make AI cloud spend defensible to the CFO? | Show workload-level unit economics, value owner, utilization plan, data movement cost, and decommission path for legacy platforms. |
| HCAI-22 | Which healthcare AI startups matter for payer operations? | Categories: risk adjustment, prior auth, care gap closure, utilization management, claims intelligence, member engagement, and provider-plan data exchange. |
| HCAI-23 | How do we avoid vendor lock-in in healthcare AI? | Keep data contracts, evaluation harnesses, audit logs, and workflow orchestration portable; do not let one vendor own both data and decision workflow without exit rights. |
| HCAI-24 | Should Epic Cogito remain the clinical analytics spine? | Yes for Epic-native clinical reporting, but not necessarily for cross-enterprise AI, research, payer analytics, or advanced ML. |
| HCAI-25 | What is the one cloud/data/AI decision Meridian should not make blindly? | Do not choose a hyperscaler or AI platform based on credits or executive relationships before mapping data gravity, Epic integration, privacy constraints, and the first four value-backed use cases. |

## Retail / Apex Retail

Client context to use when relevant: Apex has Snowflake as a retail data foundation, Salesforce Commerce, SAP, partial POS and item-location confidence issues, CDP/customer identity as a constraint for loyalty AI, and AI bets across demand sensing, merchandising, supply chain, workforce scheduling, and personalization.

| ID | Question | Expected advisor answer |
|---|---|---|
| RAI-01 | Should Apex go AWS, Azure, or GCP for retail AI? | Choose by workload: Snowflake/data gravity, Salesforce/SAP integration, AI services, cost model, and team capability. Do not make hyperscaler choice the strategy. |
| RAI-02 | Is multicloud worth it for a retailer? | Usually only for specific workload leverage or risk management; broad multicloud adds FinOps/security/talent complexity that can exceed discount gains. |
| RAI-03 | Should we move from Snowflake to Databricks for demand sensing? | Not wholesale. Use Databricks if ML feature engineering/model lifecycle is the gap; Snowflake remains strong for governed analytics and data sharing. |
| RAI-04 | What cloud economics matter most for retail AI? | Unit cost per forecast/decision, data movement, committed spend, peak-season elasticity, integration labor, and decommissioned legacy cost. |
| RAI-05 | Should we use GCP because of retail AI and data science strength? | Consider it for analytics/ML strength, but only if it fits existing data gravity, integration with SAP/Salesforce/Snowflake, and team skills. |
| RAI-06 | How should Apex think about private cloud for AI? | Private cloud rarely wins for retail AI unless data sovereignty or latency is binding; cloud elasticity usually matters more for seasonal demand and experimentation. |
| RAI-07 | Are startups disrupting retail demand planning? | Yes, especially in demand sensing, allocation, pricing, inventory visibility, and merchant copilots. Incumbents still win where ERP/POS integration dominates. |
| RAI-08 | Which retail AI startup categories should we watch? | Demand sensing, inventory orchestration, returns/fraud, conversational commerce, store labor optimization, dynamic pricing, computer vision, and product-content automation. |
| RAI-09 | Should Apex build its own AI control plane? | Only if it anchors specific decisions across merchandising/supply chain/store ops; avoid a generic platform that does not change decisions. |
| RAI-10 | What is the risk of hyperscaler credits for retail AI? | Credits can pull Apex into premature platform commitments before data readiness and operating adoption are solved. |
| RAI-11 | Is Microsoft Copilot enough for retail knowledge work? | Good for productivity/M365 workflows; not enough for merchandising, demand sensing, and supply-chain decisions without tenant data and workflow-specific models. |
| RAI-12 | Should Salesforce AI own personalization? | Salesforce may be strong in activation, but Apex needs identity resolution and inventory/margin context outside Salesforce before personalization is trustworthy. |
| RAI-13 | How does SAP Joule fit retail AI? | Useful in finance/procurement/SAP workflows; less likely to be the primary engine for demand sensing, assortment, or store labor decisions. |
| RAI-14 | How should we negotiate cloud commitments around peak season? | Tie commitments to measured workloads, peak elasticity, and downside protection; avoid committing based only on expected AI demand. |
| RAI-15 | Is a retail data lakehouse necessary? | Necessary only if current analytics cannot support ML pipelines, near-real-time inventory, and feature reuse; otherwise fix data quality before replatforming. |
| RAI-16 | What data architecture unlocks inventory AI? | Governed item-location history, POS, inventory adjustments, product hierarchy, promo calendars, fulfillment/substitution data, and margin attribution. |
| RAI-17 | Which startup threat should a retail CIO take seriously first? | The ones embedding into the merchant/planner workflow and producing measurable margin/labor decisions, not generic AI copilots. |
| RAI-18 | How does private label change retail AI priorities? | Private label increases need for margin, vendor, forecast, and assortment intelligence; it makes COGS and substitution modeling more important. |
| RAI-19 | Should we centralize retail AI on one model provider? | No. Centralize governance, data contracts, evaluation, and FinOps; allow models/tools to vary by workflow. |
| RAI-20 | What should the CFO ask about cloud AI spend? | Which workloads create verified value, what unit economics are, what legacy spend retires, and who owns adoption. |
| RAI-21 | Should Apex create a feature store? | Only if multiple AI use cases reuse forecast, item, customer, and inventory features; otherwise it can become engineering theater. |
| RAI-22 | What is the biggest cloud-data risk in loyalty AI? | Customer identity and consent signals are weaker than the cloud platform story; wrong identity graph makes any cloud AI look smarter than it is. |
| RAI-23 | How do we compare vendor AI vs hyperscaler AI? | Vendor AI brings workflow/product depth; hyperscalers bring model/data tooling. The right answer depends on whether Apex is solving a workflow or platform problem. |
| RAI-24 | How do retail AI startups beat incumbents? | They win with narrow workflow depth, faster experimentation, and better UX; incumbents win on integration, scale, and procurement trust. |
| RAI-25 | What is the one cloud/data/AI decision Apex should avoid? | Do not choose a hyperscaler or lakehouse architecture before deciding which retail decisions must change and which data signals are trusted. |

## Financial Services / First Capital

Client context to use when relevant: First Capital operates in a regulated financial-services environment where SR 11-7/model risk, OCC-style scrutiny, AML/fraud, digital account opening, credit risk, banker copilots, auditability, explainability, and data lineage matter. Avoid inventing exact assets, findings, vendors, or market-share claims.

| ID | Question | Expected advisor answer |
|---|---|---|
| FAI-01 | Should First Capital use AWS, Azure, GCP, or private cloud for AI? | Segment by regulated workload, data boundary, MRM evidence, existing estate, and operational maturity. No single cloud answer fits all AI. |
| FAI-02 | Is private cloud safer for banking AI? | Safer only for control/data boundary; it can be worse if it lacks monitoring, patching, model governance, and modern tooling. |
| FAI-03 | Should we use Azure OpenAI because compliance will trust Microsoft? | Microsoft trust helps procurement, not model-risk approval. First Capital still needs validation, logging, data controls, and explainability. |
| FAI-04 | Is GCP better for fraud/ML? | GCP may be strong analytically, but the deciding factors are data gravity, validation evidence, latency, security, and team skill. |
| FAI-05 | How do we compare cloud AI economics in a bank? | Compare committed spend, model inference unit cost, data egress, control implementation, audit evidence, talent, and avoided manual operations. |
| FAI-06 | Should we centralize all AI workloads on one hyperscaler? | Not necessarily. Centralize governance and MRM; workload placement can vary if controls are consistent. |
| FAI-07 | What is the cost trap in GenAI copilots? | Token/inference cost is not the biggest issue; adoption, retrieval quality, review burden, and controls can dominate economics. |
| FAI-08 | Should we host models ourselves for SR 11-7? | Hosting does not equal compliance. Validation, monitoring, documentation, and accountability matter more than physical hosting location. |
| FAI-09 | How do AI startups disrupt banks? | They attack narrow workflows: fraud, AML triage, onboarding, credit analysis, compliance evidence, collections, advisor productivity. Banks still own trust, data, and regulation. |
| FAI-10 | Which startup categories should First Capital track? | AML/fraud decision support, KYC/account opening, credit memo automation, regulatory change management, advisor copilot, collections intelligence, and model-risk tooling. |
| FAI-11 | Should we trust vendor-hosted AI for credit workflows? | Only with source transparency, validation artifacts, audit logs, data controls, and First Capital-owned final decisions. |
| FAI-12 | Can cloud AI reduce compliance cost? | Yes through evidence assembly, obligation mapping, control testing support, and case summarization; not by automating regulated judgment first. |
| FAI-13 | How should we negotiate hyperscaler AI commitments? | Tie commitments to validated use cases and governance milestones; avoid paying for capacity before MRM and data controls unblock usage. |
| FAI-14 | What is the cloud architecture for banker copilots? | Approved knowledge retrieval, entitlement-aware client data access, logged prompts/outputs, human review, and model routing under governance. |
| FAI-15 | Should First Capital use a vector database for policies and procedures? | Yes if retrieval quality and access controls are strong; weak entitlement logic makes vector search a data-leak risk. |
| FAI-16 | How do cloud choices affect fair-lending risk? | Cloud does not solve fair-lending risk; data lineage, feature governance, explainability, and monitoring do. |
| FAI-17 | Are fintech startups a bigger threat than hyperscalers? | Startups threaten workflow economics; hyperscalers threaten platform dependency. The bank needs different defenses for each. |
| FAI-18 | Should we build a bank-wide AI platform? | Only around controlled use-case lanes with MRM, retrieval, logging, and human review; avoid a platform-first program without value cases. |
| FAI-19 | What is the economic case for AML AI? | Reduced false positives, investigator productivity, better SAR quality, and lower lookback/remediation risk; must be net of validation and review costs. |
| FAI-20 | Should model-risk tools be bought from startups? | Possibly; they can accelerate inventory, validation workflow, monitoring, and evidence management, but must integrate with governance and audit systems. |
| FAI-21 | What should the CEO know about cloud AI risk? | The risk is not just data leakage; it is uncontrolled model usage, weak validation, vendor opacity, and claims that cannot survive audit. |
| FAI-22 | How should we price AI business cases in banking? | Use risk-adjusted value: cost saved, losses avoided, cycle time reduced, controls improved, and regulatory risk not increased. |
| FAI-23 | Should First Capital allow open-source models? | Yes only in governed environments with security review, licensing clarity, monitoring, and restricted data access. |
| FAI-24 | How do we avoid AI vendor lock-in? | Own data, prompts/evals, logs, retrieval indexes, model-routing policies, and exit rights. Do not let a vendor own both evidence and decision workflow. |
| FAI-25 | What is the one cloud/data/AI decision First Capital should avoid? | Do not let procurement pick a model/cloud winner before model-risk, data lineage, and regulated-workflow ownership are designed. |

## Execution Recommendation

Run this bank after the domain-depth and surface-behavior banks:

1. Healthcare questions on Meridian / Intelligence.
2. Retail questions on Apex / Intelligence.
3. Financial-services questions on First Capital / Intelligence.
4. Then rerun selected vendor/startup questions on Source, and selected platform-Move questions on Nexus.

Target:

- 0 fail terms.
- No fabricated market-share, pricing, or secret-roadmap claims.
- 85%+ advisor-grade.
- Answers should make a CIO feel the agent understands cloud economics, not just AI use cases.
