// Discovery blueprint — the archetype-driven catalog of WHAT EVIDENCE to gather
// and WHO TO INTERVIEW for the Discovery Plan deliverable. Data, not code:
// adding a use case = adding a blueprint entry, mirroring the brief-registry
// pattern. The Discovery Plan deliverable (generated at the P1→P2 gate) turns
// this catalog into a client-facing evidence-request list + interview guide.

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
  /** matched archetype label, for display/provenance. */
  archetypeLabel: string;
  evidenceFamilies: EvidenceFamily[];
  interviewRoster: InterviewRole[];
}

// ── AI-Operations / Customer-Digital (IROPS-class) ──────────────────────────
const AI_OPERATIONS: DiscoveryBlueprint = {
  archetypeLabel: "AI Operations / Customer-Digital",
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

// ── Generic default (any non-ops archetype) ──
const DEFAULT_BLUEPRINT: DiscoveryBlueprint = {
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

/** Resolve the discovery blueprint for an archetype (ops tokens → AI-Operations). */
export function getDiscoveryBlueprint(
  useCaseArchetype: string,
): DiscoveryBlueprint {
  const a = (useCaseArchetype || "").toLowerCase();
  if (
    /irops|re-?accom|recovery|disrupt|operation|ai_ops|ai-operations|customer.?digital|operational_optimization|ai_operations/.test(
      a,
    )
  ) {
    return AI_OPERATIONS;
  }
  return DEFAULT_BLUEPRINT;
}
