// =============================================================================
// Archetype registry (PR-1 + PR-2 seed).
// -----------------------------------------------------------------------------
// Archetypes declare what strategy work needs per phase — evidence, methods,
// deliverables, gates, value/risk models, agent guidance. Phase/Charter code does
// NOT hardcode any of this. AI_PRODUCT_DEVELOPMENT_LIFECYCLE is the first full
// archetype; IT_SOURCING_EVENT is a deliberately different second archetype that
// proves generality (different P1/P2 evidence with zero Charter-code change).
// =============================================================================

import type {
  StrategicMoveArchetype,
  EvidenceFamilySpec,
  PhaseRequirements,
} from "./types";

// Shared deliverable refinement contract (board-grade, grounded, no fabrication).
const REFINEMENT = {
  promptable: true,
  scopes: ["whole", "section"] as const,
  allowedIntents: [
    "content",
    "audience",
    "quality",
    "structure",
    "tone",
    "depth",
  ] as const,
  groundingGuard:
    "Refinement sharpens narrative, structure, depth and audience-fit. It cannot add a fact not in the evidence — claims stay cited, missing evidence stays visible, confidence stays honest.",
  versioned: true,
};

// Fresh DeliverableRefinement (mutable arrays) per deliverable.
const REF = () => ({
  promptable: REFINEMENT.promptable,
  scopes: [...REFINEMENT.scopes],
  allowedIntents: [...REFINEMENT.allowedIntents],
  groundingGuard: REFINEMENT.groundingGuard,
  versioned: REFINEMENT.versioned,
});

// ── AI_PRODUCT_DEVELOPMENT_LIFECYCLE ─────────────────────────────────────────

const AI_PDLC_FAMILIES: EvidenceFamilySpec[] = [
  {
    key: "eng_performance_dora",
    label: "Engineering delivery baseline (DORA)",
    kind: "metric_baseline",
    whyNeeded:
      "Deploy frequency, lead time, change-failure rate, MTTR — the measurable baseline for teams that ship via CI/CD. Estate-scoped: for a mainframe estate this resolves to change-cadence/batch, not DORA.",
    sourceDocHint: "CI/CD export (e.g. GitHub Actions) as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_dora_metrics", keyColumn: "client_id" },
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
  {
    key: "it_systems_landscape",
    label: "IT systems & application landscape",
    kind: "inventory",
    whyNeeded:
      "Applications, criticality, dependencies the SDLC touches — and a reveal of which team/work archetypes exist.",
    sourceDocHint: "CMDB export as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_cmdb_cis", keyColumn: "client_id" },
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "it_org_structure",
    label: "IT / engineering org structure",
    kind: "org",
    whyNeeded:
      "Teams, levels, contractor ratio, reporting lines, locations — who builds, who decides, the change surface.",
    sourceDocHint: "HRIS export or org chart (CSV preferred)",
    acceptedFormats: ["csv", "xlsx"],
    backing: { table: "tower_workforce", keyColumn: "client_id" },
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "stakeholder_map",
    label: "Stakeholder / decision-rights map",
    kind: "qualitative",
    whyNeeded:
      "Named owners, contributors, and blockers — who decides, who builds, who can stop it.",
    sourceDocHint: "Captured in-charter with Nexus, or a stakeholder list",
    acceptedFormats: ["csv", "docx"],
  },
  {
    key: "product_platform_operating_model",
    label: "Product / platform operating model",
    kind: "qualitative",
    whyNeeded:
      "How product and platform teams are funded, prioritized, and run today — the operating model AI must work within.",
    sourceDocHint: "Operating-model doc or captured with Nexus",
    acceptedFormats: ["docx", "pdf"],
  },
  {
    key: "value_kpi_baseline",
    label: "Value & KPI baseline",
    kind: "financial",
    whyNeeded:
      "Current KPI baselines the Move's value will be measured against — without them, targets are unsourced.",
    sourceDocHint: "KPI export or finance baseline (CSV)",
    acceptedFormats: ["csv", "xlsx"],
  },
  // P2 diagnostic families
  {
    key: "delivery_quality_itsm",
    label: "Delivery quality / ITSM (change-failure, MTTR)",
    kind: "metric_baseline",
    whyNeeded:
      "Incidents, changes, MTTR and change-success — the operational quality picture.",
    sourceDocHint: "ServiceNow ITSM export as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_itsm_records", keyColumn: "tenant_key" },
  },
  {
    key: "ai_tooling_today",
    label: "AI tooling adoption — benefits & gaps today",
    kind: "metric_baseline",
    whyNeeded:
      "Current AI dev-tool penetration and the benefits/gaps seen today — the 'before' for an AI-led SDLC.",
    sourceDocHint: "Tool admin export as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_ai_tool_usage", keyColumn: "client_id" },
  },
  // ── Estate-conditional engineering baselines (resolve INSTEAD of DORA) ──
  {
    key: "mainframe_change_cadence",
    label: "Mainframe change cadence & batch profile",
    kind: "metric_baseline",
    whyNeeded:
      "For mainframe teams the engineering delivery baseline is release/change cadence, batch windows, and incident exposure — DORA deploy-frequency is meaningless here.",
    sourceDocHint: "Change calendar + batch schedule export",
    acceptedFormats: ["csv", "xlsx"],
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
  {
    key: "mainframe_modernization_candidates",
    label: "Mainframe code & modernization candidates",
    kind: "inventory",
    whyNeeded:
      "Program/COBOL inventory, code size/complexity, SME coverage — where AI-assisted modernization has leverage vs risk.",
    sourceDocHint: "Code inventory / static-analysis export",
    acceptedFormats: ["csv", "xlsx"],
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "etl_job_inventory",
    label: "ETL job inventory & run SLAs",
    kind: "inventory",
    whyNeeded:
      "For DataStage/Informatica teams the unit of AI leverage is the job/pipeline — inventory, schedules, run SLAs.",
    sourceDocHint: "ETL tool job export",
    acceptedFormats: ["csv"],
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
];

const AI_PDLC_PHASES: PhaseRequirements[] = [
  {
    phase: "originate",
    requiredEvidence: [],
    analysisMethods: [],
    deliverables: ["origination_brief"],
    gateRequirements: [
      {
        key: "program_seed_recorded",
        describe: "Brief signed off with archetype",
        severity: "hard",
      },
      {
        key: "value_hypothesis_seed",
        describe: "Value hypothesis names trigger + outcome",
        severity: "hard",
      },
    ],
  },
  {
    phase: "charter",
    requiredEvidence: [
      // "Engineering delivery baseline" resolves per estate: DORA for cloud/
      // full-stack, change-cadence for mainframe (only one applies).
      { family: "eng_performance_dora", severity: "hard", estateScoped: true },
      {
        family: "mainframe_change_cadence",
        severity: "hard",
        estateScoped: true,
      },
      { family: "it_systems_landscape", severity: "hard", estateScoped: true },
      { family: "it_org_structure", severity: "hard" },
      { family: "stakeholder_map", severity: "hard" },
      { family: "product_platform_operating_model", severity: "hard" },
      { family: "value_kpi_baseline", severity: "hard" },
    ],
    analysisMethods: ["maturity_scoring", "two_gap", "leverage_ranking"],
    deliverables: ["program_charter"],
    gateRequirements: [
      {
        key: "charter_signed_off",
        describe: "Charter signed off by sponsor",
        severity: "hard",
      },
    ],
  },
  {
    phase: "diagnose",
    requiredEvidence: [
      { family: "eng_performance_dora", severity: "hard", estateScoped: true },
      {
        family: "mainframe_change_cadence",
        severity: "hard",
        estateScoped: true,
      },
      {
        family: "mainframe_modernization_candidates",
        severity: "soft",
        estateScoped: true,
      },
      { family: "etl_job_inventory", severity: "soft", estateScoped: true },
      { family: "it_systems_landscape", severity: "hard" },
      { family: "it_org_structure", severity: "hard" },
      { family: "delivery_quality_itsm", severity: "soft" },
      { family: "ai_tooling_today", severity: "soft" },
    ],
    analysisMethods: [
      "maturity_scoring",
      "two_gap",
      "leverage_ranking",
      "workpackage_roadmap_estimate",
    ],
    deliverables: ["discovery_report"],
    gateRequirements: [
      {
        key: "baseline_evidence_committed",
        describe: "Current-state baseline committed + cited",
        severity: "hard",
      },
    ],
  },
];

export const AI_PRODUCT_DEVELOPMENT_LIFECYCLE: StrategicMoveArchetype = {
  id: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
  name: "AI-Powered Product Development Lifecycle",
  description:
    "Adopt AI across the software/product development lifecycle (ideation → design → build → release). Estate-conditional: applicability differs by team archetype (full-stack vs mainframe vs data).",
  version: "0.1.0",
  status: "draft",
  applicableIndustries: ["*"],
  applicableFunctions: ["engineering", "product", "technology", "digital"],
  phaseModel: AI_PDLC_PHASES,
  evidenceFamilies: AI_PDLC_FAMILIES,
  analysisMethods: [
    "maturity_scoring",
    "two_gap",
    "leverage_ranking",
    "workpackage_roadmap_estimate",
  ],
  deliverablePack: [
    {
      key: "program_charter",
      label: "Program Charter",
      phase: "charter",
      audience: "Sponsor · Leadership team",
      sections: [
        "Executive summary",
        "Sponsor commitment & decision rights",
        "Stakeholder map",
        "Current-state baseline (cited)",
        "Success metrics & value range",
        "Scope boundary",
      ],
      qualityBar: {
        minSections: 6,
        requiresCitations: true,
        altitude: "exec",
        rubric: [
          "Names this client's actual systems/teams (not generic)",
          "Every quantitative claim cited or marked missing",
          "Value range stated as a range with assumptions, not a point",
        ],
      },
      refinement: {
        ...REFINEMENT,
        scopes: [...REFINEMENT.scopes],
        allowedIntents: [...REFINEMENT.allowedIntents],
      },
      formats: ["html", "docx"],
      gateArtifact: true,
    },
    {
      key: "discovery_report",
      label: "Discovery & Diagnostic Report",
      phase: "diagnose",
      audience: "Sponsor · Steering committee",
      sections: [
        "Current-state baseline (quantified, cited)",
        "Maturity profile (8 dimensions)",
        "Capability gaps (foundation vs use-case)",
        "Where to start (leverage × readiness)",
        "Root causes",
        "Continue / discontinue recommendation",
      ],
      qualityBar: {
        minSections: 6,
        requiresCitations: true,
        altitude: "exec",
        rubric: [
          "Every baseline metric cited to its source row",
          "Maturity scores show confidence + insufficient_evidence where unbacked",
          "Where-to-start ranking shows its math",
        ],
      },
      refinement: REF(),
      formats: ["html", "docx", "pptx"],
      gateArtifact: true,
    },
    {
      key: "target_operating_model",
      label: "Target AI-Powered Product Operating Model",
      phase: "design",
      audience: "Sponsor · Engineering leadership",
      sections: [
        "Human + agent workflow design",
        "Ownership & decision rights",
        "Funding & prioritization model",
        "Adoption & change plan",
      ],
      qualityBar: {
        minSections: 4,
        requiresCitations: true,
        altitude: "exec",
        rubric: [
          "Grounded in the current operating model evidence",
          "Names real teams/roles",
        ],
      },
      refinement: REF(),
      formats: ["html", "docx"],
    },
    {
      key: "ai_enabled_sdlc_architecture",
      label: "AI-Enabled SDLC Architecture",
      phase: "design",
      audience: "Architecture · Platform",
      sections: [
        "Toolchain & integration design",
        "Governance & control model",
        "DevSecOps controls",
        "Reference architecture",
      ],
      qualityBar: {
        minSections: 4,
        requiresCitations: true,
        altitude: "full",
        rubric: [
          "Maps to the client's actual systems landscape",
          "Governance tied to real controls",
        ],
      },
      refinement: REF(),
      formats: ["html", "docx"],
    },
    {
      key: "business_case",
      label: "Business Case & Financial Model",
      phase: "roadmap_business_case",
      audience: "CFO · Investment committee",
      sections: [
        "Investment summary",
        "Value model (cited to baseline)",
        "Cost model (rate-card provenance)",
        "Payback & sensitivity",
        "Roadmap cash flow",
      ],
      qualityBar: {
        minSections: 5,
        requiresCitations: true,
        altitude: "board",
        rubric: [
          "Every value claim traces to the committed baseline",
          "Cost phased BY the roadmap work-packages",
          "Rate-card provenance banner present",
        ],
      },
      refinement: REF(),
      formats: ["html", "docx", "xlsx"],
      gateArtifact: true,
    },
    {
      key: "execution_roadmap",
      label: "Execution Roadmap",
      phase: "roadmap_business_case",
      audience: "Sponsor · Delivery leadership",
      sections: [
        "Phased work-packages",
        "Sequencing rationale",
        "Value milestones",
        "Dependencies & risks",
      ],
      qualityBar: {
        minSections: 4,
        requiresCitations: true,
        altitude: "exec",
        rubric: [
          "Sequencing follows the leverage ranking",
          "Each work-package closes named capability gaps",
        ],
      },
      refinement: REF(),
      formats: ["html", "pptx"],
    },
    {
      key: "mobilization_packet",
      label: "Mobilization & Go-Decision Packet",
      phase: "mobilize",
      audience: "Delivery team · Tower",
      sections: ["Team & RACI", "Approvals", "Handoff readiness"],
      qualityBar: {
        minSections: 3,
        requiresCitations: false,
        altitude: "exec",
        rubric: ["Named delivery leads", "Explicit go/no-go"],
      },
      refinement: REF(),
      formats: ["html", "docx"],
    },
    {
      key: "handoff_package",
      label: "Tower Handoff Package",
      phase: "handoff_operate",
      audience: "Tower delivery",
      sections: [
        "Executable plan",
        "Value measurement contract",
        "Open decisions (none)",
      ],
      qualityBar: {
        minSections: 3,
        requiresCitations: false,
        altitude: "full",
        rubric: ["Tower-accepted as executable by a named individual"],
      },
      refinement: REF(),
      formats: ["html", "docx"],
      gateArtifact: true,
    },
  ],
  valueModel: {
    key: "dora_uplift_value",
    label: "Engineering throughput & quality uplift",
    method: "leverage_ranking",
    baselineFamilies: ["eng_performance_dora", "value_kpi_baseline"],
    ratifiedAtPhase: "charter",
  },
  riskModel: {
    key: "ai_sdlc_risk",
    label: "AI-in-SDLC risk",
    dimensions: [
      "adoption/change readiness",
      "security/DevSecOps governance",
      "model/tooling risk",
      "architecture/platform constraint",
    ],
  },
  agentGuidance: {
    systemFraming:
      "This Move is an AI-Powered Product Development Lifecycle archetype. Reason over the client's committed engineering delivery, systems, org, and tooling evidence. Never assert a maturity score or recommendation without committed evidence; name missing evidence explicitly.",
    keyQuestions: [
      "What current-state evidence is missing before the charter can be approved?",
      "What does the engineering delivery baseline imply for AI leverage?",
      "Which teams/areas should adopt AI first, and why (computed)?",
    ],
    requiresGroundedAnswer: true,
  },
};

// ── IT_SOURCING_EVENT (second archetype — proves generality) ─────────────────

const SOURCING_FAMILIES: EvidenceFamilySpec[] = [
  {
    key: "vendor_spend",
    label: "Vendor spend",
    kind: "financial",
    whyNeeded: "Current spend by vendor/service — the cost base to optimize.",
    sourceDocHint: "Spend export (CSV)",
    acceptedFormats: ["csv", "xlsx"],
    feedsMethods: ["should_cost"],
  },
  {
    key: "contract_inventory",
    label: "Contract inventory",
    kind: "commercial",
    whyNeeded: "Active contracts, terms, and obligations in scope.",
    sourceDocHint: "Contract register (CSV)",
    acceptedFormats: ["csv", "xlsx"],
    feedsMethods: ["should_cost"],
  },
  {
    key: "sla_baseline",
    label: "SLA baseline",
    kind: "metric_baseline",
    whyNeeded: "Current SLA targets vs performance — the service quality bar.",
    sourceDocHint: "SLA report (CSV)",
    acceptedFormats: ["csv"],
    feedsMethods: ["sla_gap"],
  },
  {
    key: "current_scope",
    label: "Current scope / service towers",
    kind: "inventory",
    whyNeeded: "What's in scope today across service towers.",
    sourceDocHint: "Scope/tower doc",
    acceptedFormats: ["docx", "xlsx"],
  },
  {
    key: "renewal_timeline",
    label: "Renewal timeline",
    kind: "commercial",
    whyNeeded: "Renewal/expiry dates that set negotiation leverage windows.",
    sourceDocHint: "Renewal calendar (CSV)",
    acceptedFormats: ["csv"],
  },
  {
    key: "incumbent_performance",
    label: "Incumbent performance",
    kind: "metric_baseline",
    whyNeeded: "How the incumbent is performing — the case for change.",
    sourceDocHint: "Performance report",
    acceptedFormats: ["csv", "docx"],
    feedsMethods: ["sla_gap"],
  },
];

export const IT_SOURCING_EVENT: StrategicMoveArchetype = {
  id: "IT_SOURCING_EVENT",
  name: "IT Sourcing Event",
  description:
    "Run a sourcing/renegotiation event for an IT service estate — should-cost, SLA gaps, incumbent performance, commercial leverage.",
  version: "0.1.0",
  status: "draft",
  applicableIndustries: ["*"],
  applicableFunctions: ["procurement", "it", "vendor management", "finance"],
  phaseModel: [
    {
      phase: "originate",
      requiredEvidence: [],
      analysisMethods: [],
      deliverables: ["origination_brief"],
      gateRequirements: [],
    },
    {
      phase: "charter",
      requiredEvidence: [
        { family: "vendor_spend", severity: "hard" },
        { family: "contract_inventory", severity: "hard" },
        { family: "sla_baseline", severity: "hard" },
        { family: "current_scope", severity: "hard" },
        { family: "renewal_timeline", severity: "soft" },
      ],
      analysisMethods: ["should_cost", "sla_gap"],
      deliverables: ["sourcing_charter"],
      gateRequirements: [
        {
          key: "charter_signed_off",
          describe: "Charter signed off by sponsor",
          severity: "hard",
        },
      ],
    },
    {
      phase: "diagnose",
      requiredEvidence: [
        { family: "incumbent_performance", severity: "hard" },
        { family: "sla_baseline", severity: "hard" },
        { family: "vendor_spend", severity: "hard" },
      ],
      analysisMethods: ["should_cost", "sla_gap"],
      deliverables: ["sourcing_diagnostic"],
      gateRequirements: [],
    },
  ],
  evidenceFamilies: SOURCING_FAMILIES,
  analysisMethods: ["should_cost", "sla_gap"],
  deliverablePack: [
    {
      key: "sourcing_charter",
      label: "Sourcing Charter",
      phase: "charter",
      audience: "Sponsor · Procurement leadership",
      sections: [
        "Executive summary",
        "Scope & service towers",
        "Spend baseline",
        "SLA baseline",
        "Commercial leverage",
      ],
      qualityBar: {
        minSections: 5,
        requiresCitations: true,
        altitude: "exec",
        rubric: [
          "Names actual vendors/contracts",
          "Spend figures cited",
          "Leverage windows tied to real renewal dates",
        ],
      },
      refinement: {
        ...REFINEMENT,
        scopes: [...REFINEMENT.scopes],
        allowedIntents: [...REFINEMENT.allowedIntents],
      },
      formats: ["html", "docx"],
      gateArtifact: true,
    },
  ],
  valueModel: {
    key: "cost_takeout_value",
    label: "Sourcing cost takeout",
    method: "should_cost",
    baselineFamilies: ["vendor_spend", "contract_inventory"],
    ratifiedAtPhase: "charter",
  },
  riskModel: {
    key: "sourcing_risk",
    label: "Sourcing risk",
    dimensions: [
      "transition risk",
      "incumbent lock-in",
      "SLA continuity",
      "commercial/contractual",
    ],
  },
  agentGuidance: {
    systemFraming:
      "This Move is an IT Sourcing Event archetype. Reason over committed spend, contract, SLA, and incumbent-performance evidence. Never assert a savings number without committed spend evidence; name missing evidence.",
    keyQuestions: [
      "What spend is in scope?",
      "Where are the SLA gaps?",
      "What is the renewal-driven leverage window?",
    ],
    requiresGroundedAnswer: true,
  },
};

// ── Registry ─────────────────────────────────────────────────────────────────

export const ARCHETYPE_REGISTRY: Record<string, StrategicMoveArchetype> = {
  [AI_PRODUCT_DEVELOPMENT_LIFECYCLE.id]: AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
  [IT_SOURCING_EVENT.id]: IT_SOURCING_EVENT,
};

export const DEFAULT_ARCHETYPE_ID = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.id;

export function getArchetype(id: string): StrategicMoveArchetype | undefined {
  return ARCHETYPE_REGISTRY[id];
}

export function listArchetypes(): StrategicMoveArchetype[] {
  return Object.values(ARCHETYPE_REGISTRY);
}
