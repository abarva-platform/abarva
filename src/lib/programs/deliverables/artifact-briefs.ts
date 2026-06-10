// =============================================================================
// Artifact Intelligence Briefs — per (module × use-case × deliverable) guidance.
// -----------------------------------------------------------------------------
// The orchestrator does NOT hand Claude a cramped template. It hands an artifact
// brief: the artifact's purpose, the decision it supports, the EXHIBITS a senior
// consultant would expect for THIS use case, and explicit EXPERT LATITUDE — with
// the governance boundary intact (client facts stay governed/cited; expertise is
// for structure, framing, exhibits, frameworks, and standard language).
// =============================================================================

export type DeliverableModule = "moves" | "source" | "tower" | "intelligence";

export interface DeliverableArtifactBrief {
  module: DeliverableModule;
  archetypeId: string;
  deliverableType: string;
  label: string;
  purpose: string;
  audience: string;
  decisionToSupport: string;
  /** Use-case-specific exhibits a senior consultant would expect. */
  expectedExhibits: string[];
  /** Sections beyond the minimum that materially improve THIS artifact. */
  recommendedSections: string[];
  /** What expert (general) knowledge Claude may apply. */
  allowedExpertKnowledge: string[];
  /** Plain-English quality criteria for the red-team pass. */
  qualityCriteria: string[];
}

const EXPERT_BASE = [
  "best-practice artifact structure and section flow for this deliverable type",
  "consulting frameworks and decision logic (e.g. options analysis, gap-to-target, value trees, RACI, phase gates)",
  "standard boilerplate, instructions-to-bidders, and review-required legal/procurement placeholders",
  "what evidence a senior advisor would expect and what is missing",
  "executive-ready language, implications, and clear decision asks",
];

const QUALITY_BASE = [
  "reads like a senior consulting team prepared it for a CIO/CFO/CPO/board — not an LLM draft",
  "specific and decision-oriented; no generic filler; strong implications",
  "every client-specific fact is cited [n] or marked placeholder / assumption / client-to-complete",
  "exhibits and tables are present where a real artifact would carry them",
  "ends with an explicit recommendation, decision required, and 'do not proceed until' conditions",
];

// ── Use-case (archetype) exhibit intelligence ────────────────────────────────

const ARCHETYPE_EXHIBITS: Record<string, string[]> = {
  AI_PRODUCT_DEVELOPMENT_LIFECYCLE: [
    "Engineering delivery (DORA) baseline",
    "Engineering / product operating model",
    "Application & platform architecture in scope",
    "AI tooling adoption (current penetration + gaps)",
    "Human + AI-agent workflow design",
    "Security / governance gates",
    "Value hypothesis with measurable KPIs",
    "Phased roadmap with entry/exit gates",
  ],
  IT_SOURCING_EVENT: [
    "Service-tower scope",
    "Application & systems inventory",
    "Vendor & contract portfolio",
    "SLA / KPI baseline",
    "Incident / change / problem volumes",
    "Retained-org & staffing model",
    "Pricing schedule / commercial model",
    "Transition plan",
    "Evaluation model & weightings",
    "Negotiation levers & risk protections",
  ],
  ERP_SI_SELECTION: [
    "Process scope & rollout waves",
    "Integration landscape",
    "Data-migration complexity",
    "Business-readiness assessment",
    "Testing / cutover plan",
    "SI staffing & governance model",
    "Pricing template",
    "Evaluation model",
  ],
  CLOUD_MODERNIZATION: [
    "Application dependency map",
    "Infrastructure estate",
    "Landing-zone readiness",
    "Migration waves (6R disposition)",
    "Cloud-cost baseline & FinOps model",
    "Security / network constraints",
    "Target operating model",
    "Transition-risk register",
  ],
};

const MODULE_OF_ARCHETYPE: Record<string, DeliverableModule> = {
  AI_PRODUCT_DEVELOPMENT_LIFECYCLE: "moves",
  IT_SOURCING_EVENT: "source",
  ERP_SI_SELECTION: "source",
  CLOUD_MODERNIZATION: "moves",
};

// ── Deliverable-type intelligence ────────────────────────────────────────────

const DELIVERABLE_META: Record<
  string,
  {
    label: string;
    purpose: string;
    audience: string;
    decision: string;
    sections: string[];
  }
> = {
  program_charter: {
    label: "Program Charter",
    purpose: "Frame and authorize a strategic transformation initiative",
    audience:
      "CIO, CFO, CDAO, transformation leader, sponsor, steering committee",
    decision:
      "Authorize the initiative (scope, sponsorship, gates) and what must close before scale-up funding",
    sections: [
      "Operating model",
      "Value hypothesis",
      "Phase gates",
      "Stakeholder / RACI",
      "Risks / issues / dependencies",
    ],
  },
  ai_enabled_sdlc_architecture: {
    label: "Solution Approach & AI-Enabled SDLC Architecture",
    purpose:
      "Define the recommended approach and target architecture for AI-assisted delivery",
    audience:
      "CIO, chief architect, security, engineering & product leadership",
    decision:
      "Align on the solution approach, target architecture, guardrails, and human+agent operating model before roadmap and estimates",
    sections: [
      "Recommended approach & options analysis",
      "Target architecture",
      "Human + AI-agent operating model",
      "Guardrails & controls",
      "Data enablement",
      "Integration",
    ],
  },
  target_operating_model: {
    label: "Target AI-Powered Product Operating Model",
    purpose:
      "Define how product/engineering run AI-assisted delivery at target state",
    audience: "CIO, CPO, transformation leader, engineering leadership",
    decision:
      "Align on the target operating model, ownership, and ways of working",
    sections: [
      "Operating model",
      "Ways of working",
      "Roles & ownership",
      "Governance & guardrails",
    ],
  },
  discovery_report: {
    label: "Discovery Report",
    purpose: "Establish the current-state baseline, gaps, and opportunity",
    audience: "CIO, transformation leader, program team",
    decision: "Agree the diagnosis and where to focus",
    sections: [
      "Maturity assessment",
      "Two-gap analysis (foundation vs use-case)",
      "Opportunity sizing",
      "Change readiness",
    ],
  },
  business_case: {
    label: "Business Case",
    purpose: "Justify investment with value, cost, and risk",
    audience: "CFO, CIO, investment committee",
    decision: "Approve / stage funding",
    sections: [
      "Value model",
      "Cost model",
      "Sensitivity / scenarios",
      "Funding ask",
      "Benefit realization",
    ],
  },
  execution_roadmap: {
    label: "Execution Roadmap",
    purpose: "Sequence the work into phases and workstreams",
    audience: "CIO, delivery leadership, PMO",
    decision: "Approve sequence, dependencies, and resourcing",
    sections: [
      "Workstream plan",
      "Dependency map",
      "Resourcing",
      "Milestones & gates",
    ],
  },
  handoff_package: {
    label: "Handoff Pack",
    purpose: "Transition the program into run / Tower operations",
    audience: "Run organization, service owners",
    decision: "Accept the handoff",
    sections: [
      "Operating model",
      "Runbooks & ownership",
      "Open risks",
      "Acceptance checklist",
    ],
  },
  sourcing_strategy_memo: {
    label: "Sourcing Strategy Memo",
    purpose: "Set the sourcing approach for a procurement event",
    audience: "CIO, CPO, procurement, sponsor",
    decision: "Approve the sourcing strategy and event design",
    sections: [
      "Sourcing objective",
      "Event archetype",
      "Vendor landscape",
      "Commercial model",
      "Negotiation levers",
      "Risk protections",
    ],
  },
  rfp_package: {
    label: "RFP Package",
    purpose: "Issue a competitive request to the market",
    audience: "Bidders; internal procurement/legal",
    decision: "Approve issuance",
    sections: [
      "Scope of services",
      "Instructions to bidders",
      "Evaluation criteria",
      "Pricing schedule",
      "SLA/KPI requirements",
      "Contractual / legal terms (review-required)",
    ],
  },
};

export function resolveArtifactBrief(args: {
  archetypeId: string;
  deliverableType: string;
}): DeliverableArtifactBrief {
  const meta =
    DELIVERABLE_META[args.deliverableType] ?? DELIVERABLE_META.program_charter;
  const exhibits =
    ARCHETYPE_EXHIBITS[args.archetypeId] ??
    ARCHETYPE_EXHIBITS.AI_PRODUCT_DEVELOPMENT_LIFECYCLE;
  const mod = MODULE_OF_ARCHETYPE[args.archetypeId] ?? "moves";
  return {
    module: mod,
    archetypeId: args.archetypeId,
    deliverableType: args.deliverableType,
    label: meta.label,
    purpose: meta.purpose,
    audience: meta.audience,
    decisionToSupport: meta.decision,
    expectedExhibits: exhibits,
    recommendedSections: meta.sections,
    allowedExpertKnowledge: [
      `deep ${args.archetypeId.replace(/_/g, " ").toLowerCase()} domain expertise`,
      ...EXPERT_BASE,
    ],
    qualityCriteria: QUALITY_BASE,
  };
}

/** Human role line for the prompt, by use case. */
export function expertRoleLine(archetypeId: string): string {
  const map: Record<string, string> = {
    AI_PRODUCT_DEVELOPMENT_LIFECYCLE:
      "AI-enabled software delivery, engineering productivity, and product/platform transformation",
    IT_SOURCING_EVENT:
      "IT outsourcing / AMS sourcing, vendor strategy, and commercial negotiation",
    ERP_SI_SELECTION: "ERP programs and systems-integrator selection",
    CLOUD_MODERNIZATION:
      "cloud migration, FinOps, and infrastructure modernization",
  };
  const domain = map[archetypeId] ?? "enterprise technology transformation";
  return `You are a senior McKinsey/BCG partner and CIO advisor, and a recognized expert in ${domain}.`;
}
