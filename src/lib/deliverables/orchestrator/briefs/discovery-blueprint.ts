// Discovery blueprint — the archetype-driven catalog of WHAT EVIDENCE to gather
// and WHO TO INTERVIEW for the Discovery Plan deliverable. Data, not code:
// adding a use case = adding a blueprint entry, mirroring the brief-registry
// pattern. The Discovery Plan deliverable (generated at the P1→P2 gate) turns
// this catalog into a client-facing evidence-request list + interview guide.

import { z } from "zod";

export interface EvidenceFamily {
  id: string;
  label: string;
  /** which downstream section/decision this evidence grounds. */
  grounds: string;
  required: boolean;
  likelySource: string;
  format: string; // CSV template / XLSX / doc
}

export interface InterviewRole {
  role: string;
  side: "business" | "it";
  objectives: string;
  questions: string[];
}

export interface DiscoveryBlueprint {
  blueprintId: string;
  blueprintVersion: string;
  /** matched archetype label, for display/provenance. */
  archetypeLabel: string;
  evidenceFamilies: EvidenceFamily[];
  interviewRoster: InterviewRole[];
  /**
   * Setup-time hints only. These help a deployer's setup flow SUGGEST this
   * archetype for a Move's text ("this looks like Data Foundation — use it?").
   * They are never runtime authority: identity is declared (see
   * `resolveDeclaredDiscoveryBlueprint`), and declaration always wins over any
   * keyword signal. Optional so existing entries need no change.
   */
  suggestionKeywords?: string[];
}

// ── AI-Operations / Customer-Digital (IROPS-class) ──────────────────────────
const AI_OPERATIONS: DiscoveryBlueprint = {
  blueprintId: "ai_operations_customer_digital",
  blueprintVersion: "2026-07-17",
  archetypeLabel: "AI Operations / Customer-Digital",
  suggestionKeywords: [
    "irops",
    "recovery",
    "disruption",
    "operations",
    "operational optimization",
    "ai operations",
    "customer digital",
  ],
  evidenceFamilies: [
    {
      id: "disruption_ops_data",
      label:
        "Operations / disruption data (volume, cause, recovery time, channel mix)",
      grounds: "Discovery baselines · Value Model · Business Case",
      required: true,
      likelySource: "Operations Control / EDW",
      format: "CSV template",
    },
    {
      id: "it_systems_landscape",
      label: "IT systems landscape (operative path)",
      grounds: "Current-State Assessment · Target Architecture",
      required: true,
      likelySource: "Enterprise Architecture / CMDB",
      format: "CSV template",
    },
    {
      id: "data_analytics_estate",
      label:
        "Data & analytics estate profile (real-time vs batch; CDP/profile status)",
      grounds: "Target Architecture (real-time decision)",
      required: true,
      likelySource: "Data Platforms / EA",
      format: "Doc",
    },
    {
      id: "cost_pools",
      label: "Cost pools (operational + customer-care + goodwill)",
      grounds: "Value Model · Business Case ROI",
      required: true,
      likelySource: "Finance / FP&A",
      format: "XLSX template",
    },
    {
      id: "contact_center_analytics",
      label: "Contact-center analytics (spike, AHT, deflectable intent %)",
      grounds: "Deflection value · Operating Model",
      required: true,
      likelySource: "CCaaS / Speech Analytics",
      format: "CSV",
    },
    {
      id: "segment_value_data",
      label: "Customer / loyalty segment value + churn",
      grounds: "Triage design · retained-revenue value",
      required: false,
      likelySource: "Loyalty / CRM Analytics",
      format: "CSV",
    },
    {
      id: "inventory_rules",
      label: "Inventory / fulfilment rules + guardrails",
      grounds: "Solution Design · automated-action guardrails",
      required: true,
      likelySource: "Revenue Mgmt / Inventory",
      format: "Doc + rules export",
    },
    {
      id: "core_system_throughput",
      label: "Core transactional-system throughput / limits",
      grounds: "Non-functional design · throttling",
      required: true,
      likelySource: "Core platform owner",
      format: "Doc",
    },
    {
      id: "channel_consent",
      label: "Notification channel reach + consent",
      grounds: "Notification design · compliance",
      required: true,
      likelySource: "Digital / CPaaS / Consent",
      format: "CSV/Doc",
    },
    {
      id: "policy_entitlement",
      label: "Policy / regulatory entitlement rules",
      grounds: "Governance · automated-offer rules · audit",
      required: true,
      likelySource: "Legal / Policy engine",
      format: "Doc",
    },
    {
      id: "current_state_runbook",
      label: "Current-state process / runbook",
      grounds: "Current-State Assessment · gap analysis",
      required: true,
      likelySource: "Operations / Customer Care",
      format: "Doc",
    },
    {
      id: "workforce_model",
      label: "Workforce model (roles, volumes, constraints)",
      grounds: "Operating Model · change plan",
      required: false,
      likelySource: "Workforce & Change",
      format: "Doc",
    },
  ],
  interviewRoster: [
    {
      role: "Accountable executive sponsor",
      side: "business",
      objectives: "Outcome, value, success/kill definition",
      questions: [
        "Where in the operation do we lose the most value or the highest-value customers?",
        "What does a great outcome look like, and how would we know?",
        "What target would make this a success vs. a kill?",
        "What would make you NOT ship the change (the guardrails)?",
      ],
    },
    {
      role: "Operations / control-center lead",
      side: "business",
      objectives: "Operational truth, event coding, severe-day volumes",
      questions: [
        "Walk me through how a disruption/event is declared and worked today.",
        "When do you first know the downstream customer impact?",
        "How is cause/severity coded, and who owns it?",
        "What is the single operational truth a customer layer must read from?",
        "Severe-day (P95) volumes?",
      ],
    },
    {
      role: "Customer-care / contact-center lead",
      side: "business",
      objectives: "Deflection value, operating model",
      questions: [
        "Spike ratio and AHT vs. baseline during events?",
        "What share of contacts is deflectable self-service?",
        "What does the agent role become if simple cases self-serve?",
        "What must agents have pre-loaded for the hard cases?",
      ],
    },
    {
      role: "Loyalty / customer-value lead",
      side: "business",
      objectives: "Triage, retained-revenue value",
      questions: [
        "Value concentration by segment/tier?",
        "Churn lift after a bad event, by tier?",
        "Can you see high-value customers in the recovery queue today?",
        "Where should goodwill be spent to retain revenue?",
      ],
    },
    {
      role: "Digital / mobile product lead",
      side: "business",
      objectives: "Channel reach, notification design",
      questions: [
        "Channel reach (app vs SMS/messaging) for affected customers?",
        "What is missing to push actionable, personalized options (not a generic alert)?",
        "What is the one-tap action transaction path?",
      ],
    },
    {
      role: "Revenue / inventory lead",
      side: "business",
      objectives: "Automated-action guardrails",
      questions: [
        "Protected-inventory / fare/eligibility rules that must bound automation?",
        "Own vs partner priority logic?",
      ],
    },
    {
      role: "Finance / FP&A lead",
      side: "business",
      objectives: "Value model, ROI proof",
      questions: [
        "Goodwill/compensation spend and estimated leakage vs policy?",
        "Which recorded baselines must the value model tie to?",
        "What proof would let you sign the business case?",
      ],
    },
    {
      role: "Legal / regulatory lead",
      side: "business",
      objectives: "Governance, audit",
      questions: [
        "Entitlement logic by jurisdiction?",
        "What must be logged for an automated offer to be auditable/defensible?",
        "Consent rules for operational vs marketing messaging; duty-of-care cases?",
      ],
    },
    {
      role: "Chief / enterprise architect",
      side: "it",
      objectives: "Systems landscape, integration",
      questions: [
        "Which systems are in the path and where are the integration gaps?",
        "Event-backbone maturity — can events stream in real time?",
        "Identity resolution across digital / CRM / loyalty / transactional records?",
      ],
    },
    {
      role: "Head of data platforms",
      side: "it",
      objectives: "The real-time-vs-batch decision",
      questions: [
        "Describe the estate: legacy warehouse vs cloud vs lake — what is where?",
        "What is the real-time data path today, or is it all batch?",
        "Is the real-time customer profile / CDP activated? If not, timeline and blockers?",
        "Could a thin purpose-built real-time layer beat activating the CDP?",
        "What decision latency is realistic?",
      ],
    },
    {
      role: "Core transactional platform owner",
      side: "it",
      objectives: "Non-functional limits",
      questions: [
        "Transaction throughput ceiling; behavior under self-service load spikes?",
        "What throttling/queueing protects the core system?",
      ],
    },
  ],
};

// ── Healthcare / Member-Service Contact Center Agent Assist ────────────────
const HEALTHCARE_CONTACT_CENTER_AGENT_ASSIST: DiscoveryBlueprint = {
  blueprintId: "healthcare_contact_center_agent_assist",
  suggestionKeywords: [
    "contact center",
    "call center",
    "member service",
    "agent assist",
    "crm",
    "patient",
    "member",
    "claims",
    "eligibility",
    "prior auth",
  ],
  blueprintVersion: "2026-07-17",
  archetypeLabel: "Healthcare Contact Center Agent Assist",
  evidenceFamilies: [
    {
      id: "current_state_workflow_map",
      label: "Current-state member-service workflow map",
      grounds: "Current-State Assessment · Future-State Process",
      required: true,
      likelySource: "Member Operations / Contact Center Operations",
      format: "Workshop notes or process map",
    },
    {
      id: "contact_center_kpis",
      label: "Contact center baseline KPIs",
      grounds: "Value Hypothesis · Business Case · Tower Metrics",
      required: true,
      likelySource: "Operations Analytics / CCaaS reporting",
      format: "CSV/XLSX",
    },
    {
      id: "crm_contact_center_system_map",
      label: "CRM/contact-center system and integration map",
      grounds: "Current-State Systems · Target Architecture",
      required: true,
      likelySource: "Enterprise Architecture / Contact Center IT",
      format: "CSV or architecture inventory",
    },
    {
      id: "claims_eligibility_benefits_data_access",
      label: "Claims, eligibility, benefits, and prior-auth data access",
      grounds: "Data Foundation · Agent Assist Retrieval Scope",
      required: true,
      likelySource: "Claims, Benefits, Prior Authorization, Data Platform",
      format: "Data inventory / interface catalog",
    },
    {
      id: "knowledge_base_ownership_freshness",
      label: "Knowledge base ownership and freshness",
      grounds: "Answer Quality · Knowledge Governance · Operating Model",
      required: true,
      likelySource: "Knowledge Management / Policy Owners",
      format: "Doc/export with owner and refresh cadence",
    },
    {
      id: "call_recording_transcript_availability",
      label: "Call transcript/recording availability and retention",
      grounds: "Intent Taxonomy · Training/Evaluation Data · Compliance",
      required: true,
      likelySource: "CCaaS / Speech Analytics / Compliance",
      format: "Retention policy + sample inventory",
    },
    {
      id: "phi_privacy_security_controls",
      label: "PHI, privacy, security, and audit controls",
      grounds: "Risk Controls · Security Architecture · Gate Decision",
      required: true,
      likelySource: "Security / Privacy / Compliance",
      format: "Controls matrix",
    },
    {
      id: "human_in_loop_model",
      label: "Human-in-the-loop decision model",
      grounds: "Operating Model · Responsible AI Controls",
      required: true,
      likelySource: "Operations Leadership / Compliance / Clinical Policy",
      format: "Decision-rights matrix",
    },
    {
      id: "model_risk_responsible_ai_controls",
      label: "Model risk and responsible AI controls",
      grounds: "AI Governance · Approval Guardrails",
      required: true,
      likelySource: "Responsible AI / Model Risk / Compliance",
      format: "Control checklist",
    },
    {
      id: "measurement_owner_cadence",
      label: "Measurement owner and cadence",
      grounds: "Tower Handoff · Value Measurement Contract",
      required: true,
      likelySource: "Operations Analytics / Finance / PMO",
      format: "Metric owner table",
    },
    {
      id: "finance_baseline_value_plan",
      label: "Finance baseline and value measurement plan",
      grounds: "Business Case · Value Proof",
      required: true,
      likelySource: "Finance / FP&A",
      format: "XLSX",
    },
    {
      id: "change_adoption_owner",
      label: "Operational change and adoption owner",
      grounds: "Change Plan · Adoption Risk",
      required: false,
      likelySource: "Training / Workforce / Change Lead",
      format: "RACI or adoption plan",
    },
  ],
  interviewRoster: [
    {
      role: "Executive sponsor for member experience",
      side: "business",
      objectives: "Outcome, scope, value, and risk appetite",
      questions: [
        "Which member-service pain points must improve first: handle time, repeat contact, transfers, consistency, or satisfaction?",
        "Which decisions must remain human-owned even if AI drafts the answer?",
        "What would make this initiative not worth scaling?",
      ],
    },
    {
      role: "VP Member Operations / Contact Center Director",
      side: "business",
      objectives: "Workflow truth, agent pain, exceptions, and operating model",
      questions: [
        "Walk through a claims, eligibility, benefits, and prior-auth inquiry from answer to escalation.",
        "Where do agents switch systems or interpret policy manually?",
        "Which intents drive avoidable transfers, repeat contacts, and after-call work?",
      ],
    },
    {
      role: "Operations Analytics / Finance value owner",
      side: "business",
      objectives: "Baseline, target, measurement cadence, and value proof",
      questions: [
        "Which baseline metrics are reliable today: AHT, FCR, transfer rate, repeat contact, ACW, CSAT, cost per contact?",
        "Who signs off the measurement method and value realization cadence?",
      ],
    },
    {
      role: "Enterprise architect / contact-center platform owner",
      side: "it",
      objectives:
        "CRM, CCaaS, claims/auth/benefits integration and target architecture",
      questions: [
        "Which systems must the agent-assist layer read from at answer time?",
        "What is batch versus real-time today, and where are the API or data-product gaps?",
        "How will AWS, Databricks, CRM, CCaaS, IAM, and audit logging fit together?",
      ],
    },
    {
      role: "Security / Privacy / Compliance / Responsible AI lead",
      side: "it",
      objectives:
        "PHI controls, auditability, model-risk gates, and human review",
      questions: [
        "Where can PHI appear in transcripts, CRM notes, claims data, or generated responses?",
        "What answer types require human approval, suppression, or escalation?",
        "What logs and evidence must exist before production scale?",
      ],
    },
  ],
};

// ── Financial Services / Commercial Lending Agent Assist ───────────────────
const FINANCIAL_SERVICES_COMMERCIAL_LENDING_AGENT_ASSIST: DiscoveryBlueprint = {
  blueprintId: "financial_services_commercial_lending_agent_assist",
  suggestionKeywords: [
    "commercial lending",
    "loan",
    "lending",
    "credit",
    "kyc",
    "sanctions",
    "collateral",
    "covenant",
    "servicing",
    "loan origination",
    "core banking",
    "document intelligence",
  ],
  blueprintVersion: "2026-07-22",
  archetypeLabel: "Financial Services Commercial Lending Agent Assist",
  evidenceFamilies: [
    {
      id: "commercial_lending_workflow_map",
      label: "Commercial lending onboarding workflow map",
      grounds: "Current-State Assessment · Future-State Process",
      required: true,
      likelySource: "Commercial Lending Operations / Process Owner",
      format: "Workshop notes or process map",
    },
    {
      id: "loan_onboarding_kpis",
      label: "Loan onboarding baseline KPIs",
      grounds: "Value Hypothesis · Business Case · Tower Metrics",
      required: true,
      likelySource: "Lending Operations Analytics / Finance",
      format: "CSV/XLSX",
    },
    {
      id: "los_crm_core_system_map",
      label: "LOS, CRM, document, KYC/sanctions, and core banking system map",
      grounds: "Current-State Systems · Target Architecture",
      required: true,
      likelySource: "Enterprise Architecture / Lending Technology",
      format: "CSV or architecture inventory",
    },
    {
      id: "kyc_sanctions_credit_policy_controls",
      label: "KYC, sanctions, credit-policy, and approval controls",
      grounds: "Risk Controls · AI Governance · Gate Decision",
      required: true,
      likelySource: "Compliance / Credit Policy / Model Risk",
      format: "Controls matrix",
    },
    {
      id: "document_intake_quality",
      label: "Document intake, collateral, and data-quality evidence",
      grounds:
        "Data Foundation · Exception Reduction · Agent Assist Retrieval Scope",
      required: true,
      likelySource: "Loan Ops / Collateral / Document Management",
      format: "Document inventory + quality sample",
    },
    {
      id: "decision_rights_human_review_model",
      label: "Decision rights and human-review model",
      grounds: "Operating Model · Responsible AI Controls",
      required: true,
      likelySource: "Credit Leadership / Operations / Compliance",
      format: "Decision-rights matrix",
    },
    {
      id: "relationship_manager_credit_ops_org",
      label:
        "RM, credit analyst, KYC, collateral, and servicing operating model",
      grounds: "Operating Model · Adoption Risk · Change Plan",
      required: false,
      likelySource: "Commercial Bank Leadership / Workforce Planning",
      format: "RACI or org/workflow notes",
    },
    {
      id: "finance_baseline_value_plan",
      label: "Finance baseline and value measurement plan",
      grounds: "Business Case · Value Proof",
      required: true,
      likelySource: "Finance / FP&A / Lending Operations",
      format: "XLSX",
    },
  ],
  interviewRoster: [
    {
      role: "Executive sponsor for commercial lending operations",
      side: "business",
      objectives: "Outcome, scope, value, and risk appetite",
      questions: [
        "Which commercial lending pain points must improve first: cycle time, rework, document defects, KYC latency, approval handoffs, or auditability?",
        "Which credit, KYC, sanctions, collateral, or covenant decisions must remain human-owned?",
        "What would make the agent-assist option unsafe or not worth scaling?",
      ],
    },
    {
      role: "Commercial lending operations / onboarding owner",
      side: "business",
      objectives: "Workflow truth, handoffs, defects, and operating model",
      questions: [
        "Walk through loan onboarding from banker request through booking and servicing handoff.",
        "Where do bankers, credit analysts, KYC reviewers, collateral teams, and operations specialists rekey or reinterpret information?",
        "Which defects or missing documents drive repeat work and delays?",
      ],
    },
    {
      role: "Credit policy / compliance / model-risk lead",
      side: "business",
      objectives: "Controls, review boundaries, and decision rights",
      questions: [
        "Which recommendations can AI draft versus only explain?",
        "What evidence must be retained for KYC, sanctions, credit-policy, covenant, and audit review?",
        "Which model-risk controls are required before production use?",
      ],
    },
    {
      role: "Enterprise architect / lending technology owner",
      side: "it",
      objectives:
        "LOS, CRM, document management, core banking, data, and integration scope",
      questions: [
        "Which systems are sources of record for customer, loan, document, approval, collateral, covenant, and servicing data?",
        "Which systems can be read in near real time, and which remain batch or manual?",
        "Where should AWS, Databricks, search, semantic layer, IAM, and audit logging fit?",
      ],
    },
    {
      role: "Finance / value owner",
      side: "business",
      objectives: "Baseline, target, measurement cadence, and value proof",
      questions: [
        "Which baseline metrics are reliable today: cycle time, manual touch hours, defect rate, rework, approval latency, audit exceptions, cost per booked loan?",
        "Who signs off the measurement method and value-realization cadence?",
      ],
    },
  ],
};

// ── Generic default (any non-ops archetype) ──
const DEFAULT_BLUEPRINT: DiscoveryBlueprint = {
  blueprintId: "general_default",
  blueprintVersion: "2026-07-17",
  archetypeLabel: "General (default)",
  evidenceFamilies: [
    {
      id: "current_state_process",
      label: "Current-state process / operating documentation",
      grounds: "Current-State Assessment",
      required: true,
      likelySource: "Process owner",
      format: "Doc",
    },
    {
      id: "it_systems_landscape",
      label: "Systems landscape",
      grounds: "Current-State · Target Architecture",
      required: true,
      likelySource: "Enterprise Architecture",
      format: "CSV",
    },
    {
      id: "kpi_baseline",
      label: "KPI / metric baseline",
      grounds: "Value Model · Business Case",
      required: true,
      likelySource: "Finance / Analytics",
      format: "XLSX",
    },
    {
      id: "cost_baseline",
      label: "Cost baseline",
      grounds: "Value Model · ROI",
      required: true,
      likelySource: "Finance",
      format: "XLSX",
    },
    {
      id: "org_workforce",
      label: "Org / workforce model",
      grounds: "Operating Model",
      required: false,
      likelySource: "HR / Workforce",
      format: "Doc",
    },
  ],
  interviewRoster: [
    {
      role: "Accountable executive sponsor",
      side: "business",
      objectives: "Outcome, value, success/kill",
      questions: [
        "What outcome defines success?",
        "Where is the value or the pain?",
        "What would make this a kill?",
      ],
    },
    {
      role: "Process / function owner",
      side: "business",
      objectives: "Current-state reality",
      questions: [
        "Walk me through the as-is process.",
        "Where are the biggest pain points and exceptions?",
      ],
    },
    {
      role: "Finance lead",
      side: "business",
      objectives: "Cost + value baselines",
      questions: [
        "What are the cost baselines?",
        "Which baselines must the value model tie to?",
      ],
    },
    {
      role: "Enterprise architect",
      side: "it",
      objectives: "Systems + integration",
      questions: [
        "What systems are in scope?",
        "Where are the integration and data gaps?",
      ],
    },
  ],
};

// ── Governed Data Foundation for AI / LLM Automation ────────────────────────
// A data-governance / platform-readiness archetype: the bet is a certified,
// governed data foundation (ownership, semantic layer, lineage/audit, quality,
// platform) BEFORE any AI/LLM workflow is claimed. Distinct from the
// contact-center agent-assist archetype, which the keyword matcher wrongly
// inferred for data-foundation Moves that mention clinical/claims terms.
const GOVERNED_DATA_FOUNDATION: DiscoveryBlueprint = {
  blueprintId: "governed_data_foundation",
  blueprintVersion: "2026-10-05",
  archetypeLabel: "Governed Data Foundation for AI / LLM Automation",
  suggestionKeywords: [
    "data foundation",
    "data governance",
    "governed data",
    "semantic layer",
    "lineage",
    "data quality",
    "medallion",
    "lakehouse",
    "data catalog",
    "master data",
    "identity spine",
    "ai audit",
    "data platform",
  ],
  evidenceFamilies: [
    {
      id: "data_governance_ownership",
      label:
        "Data governance ownership (council, policies, decision rights, stewardship)",
      grounds: "Current-State Assessment · Operating Model · Gate controls",
      required: true,
      likelySource: "Data governance / CDO office",
      format: "Doc",
    },
    {
      id: "semantic_layer_certification",
      label:
        "Semantic layer / certified metric & entity definitions and ownership",
      grounds: "Target Architecture · Value Model",
      required: true,
      likelySource: "Analytics engineering / data platform",
      format: "Doc",
    },
    {
      id: "data_lineage_audit_trail",
      label: "Data lineage + AI/model audit trail (source-to-use traceability)",
      grounds: "Current-State · Responsible-AI controls",
      required: true,
      likelySource: "Data platform / governance",
      format: "Doc",
    },
    {
      id: "data_quality_rules",
      label: "Data quality rules (defined, loaded, monitored) + exception owners",
      grounds: "Current-State Assessment · Gate controls",
      required: true,
      likelySource: "Data quality / stewardship",
      format: "CSV",
    },
    {
      id: "source_system_data_access",
      label:
        "Source system data access (EMR, claims, pharmacy, marts) + contracts/SLAs",
      grounds: "Current-State · Target Architecture",
      required: true,
      likelySource: "Enterprise Architecture / source owners",
      format: "CSV",
    },
    {
      id: "platform_architecture_readiness",
      label:
        "Platform & architecture readiness (lakehouse/medallion, environments)",
      grounds: "Target Architecture",
      required: true,
      likelySource: "Data platform engineering",
      format: "Doc",
    },
    {
      id: "master_identity_resolution",
      label: "Master / entity identity resolution (patient, member, provider spine)",
      grounds: "Target Architecture · Value Model",
      required: true,
      likelySource: "Data governance / MDM",
      format: "Doc",
    },
    {
      id: "privacy_security_controls",
      label: "Privacy & security controls for the data foundation (PHI, access)",
      grounds: "Risk · Gate controls",
      required: true,
      likelySource: "Security / privacy office",
      format: "Doc",
    },
    {
      id: "model_risk_responsible_ai_controls",
      label: "Responsible-AI / model-risk controls for downstream automation",
      grounds: "Risk · Responsible-AI controls",
      required: true,
      likelySource: "Model risk / responsible AI",
      format: "Doc",
    },
    {
      id: "measurement_owner_cadence",
      label: "Measurement owners + cadence for the certified foundation",
      grounds: "Value Model · Operating Model",
      required: true,
      likelySource: "Analytics / finance",
      format: "Doc",
    },
    {
      id: "finance_baseline_value_plan",
      label: "Finance baseline + value plan (quantify after baselines sign off)",
      grounds: "Value Model · Business Case",
      required: true,
      likelySource: "Finance",
      format: "XLSX",
    },
    {
      id: "change_adoption_owner",
      label: "Change / adoption owner for governed-foundation rollout",
      grounds: "Operating Model",
      required: false,
      likelySource: "Transformation / change",
      format: "Doc",
    },
  ],
  interviewRoster: [
    {
      role: "Chief Data / Analytics Officer (sponsor)",
      side: "business",
      objectives: "Outcome, value, governance mandate, success/kill",
      questions: [
        "What does a certified, governed foundation unlock?",
        "What would make this a kill?",
      ],
    },
    {
      role: "Data governance lead",
      side: "business",
      objectives: "Ownership, policies, decision rights, stewardship",
      questions: [
        "Who owns governance decisions and stewardship today?",
        "Which policies and controls are actually enforced?",
      ],
    },
    {
      role: "Data platform architect",
      side: "it",
      objectives: "Semantic layer, lineage, platform readiness",
      questions: [
        "What is certified in the semantic layer vs. ad hoc?",
        "Where does lineage/audit break today?",
      ],
    },
    {
      role: "Data quality / MDM lead",
      side: "it",
      objectives: "Quality rules + identity resolution",
      questions: [
        "Which data quality rules are loaded and monitored?",
        "How is master/entity identity resolved today?",
      ],
    },
    {
      role: "Finance lead",
      side: "business",
      objectives: "Baselines + value plan",
      questions: [
        "What baselines must the value model tie to?",
        "What signoff is required before quantifying value?",
      ],
    },
  ],
};

/**
 * The discovery blueprint catalog — the single source of truth, keyed by
 * `blueprintId` (the archetype id). Adding an industry/client archetype is a
 * catalog entry, not a new matcher branch. This is the extensibility seam a
 * deploying firm configures against (today in code; later movable to
 * DB/config + a setup UI) without touching resolution logic.
 */
export const DISCOVERY_BLUEPRINT_CATALOG: Readonly<
  Record<string, DiscoveryBlueprint>
> = {
  [AI_OPERATIONS.blueprintId]: AI_OPERATIONS,
  [HEALTHCARE_CONTACT_CENTER_AGENT_ASSIST.blueprintId]:
    HEALTHCARE_CONTACT_CENTER_AGENT_ASSIST,
  [FINANCIAL_SERVICES_COMMERCIAL_LENDING_AGENT_ASSIST.blueprintId]:
    FINANCIAL_SERVICES_COMMERCIAL_LENDING_AGENT_ASSIST,
  [GOVERNED_DATA_FOUNDATION.blueprintId]: GOVERNED_DATA_FOUNDATION,
  [DEFAULT_BLUEPRINT.blueprintId]: DEFAULT_BLUEPRINT,
};

/** Normalize a declared archetype token to a catalog key. */
function normalizeArchetypeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s./-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Resolve a DECLARED archetype to its blueprint — the authoritative path.
 * Returns null when nothing was declared or the declaration does not exactly
 * match a known catalog archetype (so a stale/garbage value falls through to
 * inference rather than silently mis-selecting a blueprint).
 */
export function resolveDeclaredDiscoveryBlueprint(
  declaredArchetypeId: string | null | undefined,
): DiscoveryBlueprint | null {
  if (!declaredArchetypeId || !declaredArchetypeId.trim()) return null;
  return DISCOVERY_BLUEPRINT_CATALOG[normalizeArchetypeId(declaredArchetypeId)] ?? null;
}

export interface DiscoveryArchetypeSuggestion {
  blueprintId: string;
  archetypeLabel: string;
  /** How many suggestion keywords matched the text (higher = stronger hint). */
  score: number;
}

/**
 * Setup-time suggestion only: rank catalog archetypes by how well their
 * `suggestionKeywords` match a Move's text, so an origination/setup flow can
 * PROPOSE an archetype for a human to confirm and declare. This never resolves
 * a blueprint on its own — resolution honors the declaration
 * (`resolveDeclaredDiscoveryBlueprint`); this only helps a person choose what to
 * declare. The general default is never suggested.
 */
export function suggestDiscoveryArchetypes(
  text: string,
  limit = 3,
): DiscoveryArchetypeSuggestion[] {
  const haystack = (text || "").toLowerCase();
  if (!haystack.trim()) return [];
  return Object.values(DISCOVERY_BLUEPRINT_CATALOG)
    .filter((bp) => bp.blueprintId !== DEFAULT_BLUEPRINT.blueprintId)
    .map((bp) => {
      const keywords =
        bp.suggestionKeywords && bp.suggestionKeywords.length > 0
          ? bp.suggestionKeywords
          : [bp.archetypeLabel.toLowerCase(), bp.blueprintId.replace(/_/g, " ")];
      let score = 0;
      for (const keyword of keywords) {
        if (keyword && haystack.includes(keyword.toLowerCase())) score += 1;
      }
      return {
        blueprintId: bp.blueprintId,
        archetypeLabel: bp.archetypeLabel,
        score,
      };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.blueprintId.localeCompare(b.blueprintId),
    )
    .slice(0, Math.max(0, limit));
}

/** Resolve the discovery blueprint for a Move.
 *
 * Identity is declared, never inferred: a `declaredArchetypeId` that matches a
 * catalog archetype wins outright. Only when nothing is declared (or the
 * declaration is unknown) does keyword inference run, and it is a fallback
 * suggestion, never authority. `useCaseArchetype` that is itself exactly a
 * catalog id is also honored as a declaration.
 */
/**
 * How a blueprint came to be selected for a Move. Every value above `inferred`
 * means a human's declaration decided it; `inferred` and `default` mean nobody
 * did, and keyword matching (or the general case) chose instead.
 */
export type DiscoveryBlueprintBasis =
  /** `declaredArchetypeId` matched a catalog archetype. */
  | "declared"
  /** The `useCaseArchetype` argument was itself exactly a catalog archetype id. */
  | "declared_via_use_case"
  /** Nothing matched the catalog; keyword inference picked a specific archetype. */
  | "inferred"
  /** Nothing matched and no keywords fired; the general-case blueprint applies. */
  | "default";

export interface DiscoveryBlueprintResolution {
  blueprint: DiscoveryBlueprint;
  basis: DiscoveryBlueprintBasis;
  /**
   * A declaration WAS supplied but does not name a catalog archetype, so it was
   * discarded and selection fell through to inference. Non-null here is a
   * governance signal, not a detail: the blueprint grading this Move's evidence
   * was not the one anybody declared. Callers surfacing a blueprint to a person
   * should say so rather than present the selection as declared.
   */
  unknownDeclaration: string | null;
}

/**
 * Resolve the discovery blueprint for a Move AND report what decided it.
 *
 * `getDiscoveryBlueprint` is this function's blueprint, with the provenance
 * dropped; the selection rules live here and have exactly one implementation.
 */
export function resolveDiscoveryBlueprintWithBasis(
  useCaseArchetype: string,
  declaredArchetypeId?: string | null,
): DiscoveryBlueprintResolution {
  // Declared identity wins over inference. Try the explicit declaration first,
  // then the primary arg in case a caller passed a clean catalog id as the
  // archetype. A multi-word inference blob won't exact-match a catalog key, so
  // this never false-matches.
  const declaredBlueprint = resolveDeclaredDiscoveryBlueprint(declaredArchetypeId);
  if (declaredBlueprint) {
    return {
      blueprint: declaredBlueprint,
      basis: "declared",
      unknownDeclaration: null,
    };
  }
  const declaredViaUseCase = resolveDeclaredDiscoveryBlueprint(useCaseArchetype);
  if (declaredViaUseCase) {
    return {
      blueprint: declaredViaUseCase,
      basis: "declared_via_use_case",
      unknownDeclaration: null,
    };
  }

  // A declaration that was supplied and did not resolve is carried out, because
  // the caller cannot otherwise tell this case from "nothing was declared" —
  // and the two have very different standing.
  const unknownDeclaration =
    declaredArchetypeId && declaredArchetypeId.trim()
      ? declaredArchetypeId.trim()
      : null;

  const inferred = inferDiscoveryBlueprint(useCaseArchetype);
  return {
    blueprint: inferred,
    basis: inferred.blueprintId === DEFAULT_BLUEPRINT.blueprintId ? "default" : "inferred",
    unknownDeclaration,
  };
}

/** Keyword inference — the fallback, never authority. */
function inferDiscoveryBlueprint(useCaseArchetype: string): DiscoveryBlueprint {
  const a = (useCaseArchetype || "").toLowerCase();
  const hasFinancialLendingSignals =
    /financial|bank|banking|commercial.?lend|loan|lending|credit|kyc|sanctions?|collateral|covenant|booking|servicing|relationship.?manager|los|core.?bank/.test(
      a,
    ) &&
    /agent.?assist|agentic.?assist|ai.?assist|document.?intelligence|onboarding|workflow|operations?/.test(
      a,
    );
  const hasHealthcareDomainSignals =
    /health|meridian|clinical|provider|payer|patient|member|claims?|eligibility|benefits?|prior.?auth|authorization|phi/.test(
      a,
    );
  const hasMemberServiceAgentAssistSignals =
    /member.?service|member.?experience|contact.?center|call.?center|customer.?service|agent.?assist|agentic.?assist|assisted.?agent|crm/.test(
      a,
    );
  const hasHealthcareMemberServiceSignals =
    hasHealthcareDomainSignals && hasMemberServiceAgentAssistSignals;

  if (hasHealthcareMemberServiceSignals) {
    return HEALTHCARE_CONTACT_CENTER_AGENT_ASSIST;
  }
  if (hasFinancialLendingSignals) {
    return FINANCIAL_SERVICES_COMMERCIAL_LENDING_AGENT_ASSIST;
  }
  if (
    /irops|re-?accom|recovery|disrupt|operation|ai_ops|ai-operations|customer.?digital|operational_optimization|ai_operations/.test(
      a,
    )
  ) {
    return AI_OPERATIONS;
  }
  return DEFAULT_BLUEPRINT;
}

/** Resolve the discovery blueprint for a Move.
 *
 * Identity is declared, never inferred: a `declaredArchetypeId` that matches a
 * catalog archetype wins outright. Only when nothing is declared (or the
 * declaration is unknown) does keyword inference run, and it is a fallback
 * suggestion, never authority. `useCaseArchetype` that is itself exactly a
 * catalog id is also honored as a declaration.
 *
 * Use `resolveDiscoveryBlueprintWithBasis` when the caller shows the selected
 * archetype to a person and therefore needs to say whether it was declared.
 */
export function getDiscoveryBlueprint(
  useCaseArchetype: string,
  declaredArchetypeId?: string | null,
): DiscoveryBlueprint {
  return resolveDiscoveryBlueprintWithBasis(useCaseArchetype, declaredArchetypeId)
    .blueprint;
}

// ── Config contract + loader (Phase 2 of the configurable archetype layer) ──
// The catalog is data: these schemas define what a configured source — a JSON
// file today, a DB table or setup UI later — must satisfy, and the loader
// overlays a validated configured source onto the built-in seed. The seam lets
// a deploying firm add or override an archetype WITHOUT shipping code, while an
// invalid source is rejected whole so the catalog can never be partially
// corrupted. Co-located with the catalog it governs.
export const EvidenceFamilySchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "family id must be snake_case [a-z0-9_]"),
  label: z.string().min(1),
  grounds: z.string().min(1),
  required: z.boolean(),
  likelySource: z.string().min(1),
  format: z.string().min(1),
});

export const InterviewRoleSchema = z.object({
  role: z.string().min(1),
  side: z.enum(["business", "it"]),
  objectives: z.string().min(1),
  questions: z.array(z.string().min(1)).min(1),
});

export const DiscoveryBlueprintSchema = z.object({
  blueprintId: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "blueprintId must be snake_case [a-z0-9_]"),
  blueprintVersion: z.string().min(1),
  archetypeLabel: z.string().min(1),
  suggestionKeywords: z.array(z.string().min(1)).optional(),
  evidenceFamilies: z
    .array(EvidenceFamilySchema)
    .min(1)
    .refine(
      (families) =>
        new Set(families.map((family) => family.id)).size === families.length,
      { message: "evidence family ids must be unique within a blueprint" },
    ),
  interviewRoster: z.array(InterviewRoleSchema).min(1),
});

export const DiscoveryBlueprintCatalogSchema = z.array(DiscoveryBlueprintSchema);

export type DiscoveryBlueprintConfig = z.infer<typeof DiscoveryBlueprintSchema>;

export interface LoadedDiscoveryBlueprintCatalog {
  catalog: Record<string, DiscoveryBlueprint>;
  /** Added or overridden archetype ids from the configured source. */
  applied: string[];
  /** Validation errors; when non-empty the configured source was rejected. */
  errors: string[];
}

/**
 * Build the effective catalog: the built-in seed, with a validated configured
 * source overlaid on top (an entry whose `blueprintId` matches a seed id
 * overrides it; a new id adds an archetype). A configured source that fails
 * validation is rejected whole — the seed is returned unchanged and the errors
 * are surfaced — so a malformed config cannot partially corrupt the catalog.
 */
export function loadDiscoveryBlueprintCatalog(
  configuredBlueprints?: unknown,
): LoadedDiscoveryBlueprintCatalog {
  const catalog: Record<string, DiscoveryBlueprint> = {
    ...DISCOVERY_BLUEPRINT_CATALOG,
  };
  if (configuredBlueprints == null) {
    return { catalog, applied: [], errors: [] };
  }
  const parsed = DiscoveryBlueprintCatalogSchema.safeParse(configuredBlueprints);
  if (!parsed.success) {
    return {
      catalog,
      applied: [],
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    };
  }
  const applied: string[] = [];
  for (const blueprint of parsed.data) {
    catalog[blueprint.blueprintId] = blueprint as DiscoveryBlueprint;
    applied.push(blueprint.blueprintId);
  }
  return { catalog, applied, errors: [] };
}

/**
 * Validate the built-in seed against the schema. The seam only holds if the
 * seed itself conforms to the contract a configured source must meet.
 */
export function validateBuiltInDiscoveryBlueprintCatalog(): string[] {
  const parsed = DiscoveryBlueprintCatalogSchema.safeParse(
    Object.values(DISCOVERY_BLUEPRINT_CATALOG),
  );
  if (parsed.success) return [];
  return parsed.error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
}
