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

// ── AI_OPERATIONS_DECISION_SUPPORT (third archetype — operations work) ───────
// An AI decision-support/recommendation layer for operational workflows (e.g.
// airline IROPS recovery, claims operations, supply-chain exceptions). The
// evidence axis is the OPERATION (process/decision flow, event volume + cost),
// not the SDLC — no DORA, no product/platform operating model.

const AI_OPS_FAMILIES: EvidenceFamilySpec[] = [
  {
    key: "ops_process_baseline",
    label: "Operational process & decision-flow baseline",
    kind: "qualitative",
    whyNeeded:
      "The current operational process / decision flow the AI layer must support — events in, decisions made, by whom, against which systems and SLAs. Without it, recommendations have no workflow to land in.",
    sourceDocHint: "Process map / SOP / decision-flow document",
    acceptedFormats: ["pdf", "docx", "pptx"],
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
  {
    key: "ops_event_cost_baseline",
    label: "Operational event volume & cost baseline",
    kind: "financial",
    whyNeeded:
      "Disruption/exception event volumes and cost per event (recovery cost, penalties, lost revenue, manual effort) — the measurable baseline the decision-support value case is built on.",
    sourceDocHint: "Event/disruption log + cost baseline (CSV or XLSX)",
    acceptedFormats: ["csv", "xlsx"],
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
  {
    key: "it_systems_landscape",
    label: "IT systems & application landscape",
    kind: "inventory",
    whyNeeded:
      "The operational systems the decision layer must read from and recommend into — applications, criticality, dependencies, integration points.",
    sourceDocHint: "CMDB export as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_cmdb_cis", keyColumn: "client_id" },
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "it_org_structure",
    label: "Operations / IT org structure",
    kind: "org",
    whyNeeded:
      "Operations teams, roles, shift coverage, reporting lines — who makes the operational decisions today and who adopts the recommendations.",
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
      "Named owners, contributors, and blockers — who decides, who operates, who can stop it.",
    sourceDocHint: "Captured in-charter with Nexus, or a stakeholder list",
    acceptedFormats: ["csv", "docx"],
  },
  {
    key: "value_kpi_baseline",
    label: "Value & KPI baseline",
    kind: "financial",
    whyNeeded:
      "Current operational KPI baselines the Move's value will be measured against — without them, targets are unsourced.",
    sourceDocHint: "KPI export or finance baseline (CSV)",
    acceptedFormats: ["csv", "xlsx"],
  },
  {
    key: "ops_change_readiness",
    label: "Operational change readiness",
    kind: "qualitative",
    whyNeeded:
      "How ready the operations teams are to act on AI recommendations — trust/override norms, training, prior automation experience, union/regulatory constraints.",
    sourceDocHint: "Change-readiness assessment or captured with Nexus",
    acceptedFormats: ["docx", "pdf"],
  },
];

const AI_OPS_PHASES: PhaseRequirements[] = [
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
      { family: "ops_process_baseline", severity: "hard" },
      { family: "ops_event_cost_baseline", severity: "hard" },
      { family: "it_systems_landscape", severity: "hard" },
      { family: "it_org_structure", severity: "hard" },
      { family: "stakeholder_map", severity: "hard" },
      { family: "value_kpi_baseline", severity: "hard" },
      { family: "ops_change_readiness", severity: "soft" },
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
      { family: "ops_process_baseline", severity: "hard" },
      { family: "ops_event_cost_baseline", severity: "hard" },
      { family: "it_systems_landscape", severity: "hard" },
      { family: "it_org_structure", severity: "hard" },
      { family: "ops_change_readiness", severity: "soft" },
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

export const AI_OPERATIONS_DECISION_SUPPORT: StrategicMoveArchetype = {
  id: "AI_OPERATIONS_DECISION_SUPPORT",
  name: "AI Operations Decision Support",
  description:
    "Build an AI decision-support/recommendation layer for operational workflows (e.g., airline IROPS recovery, claims ops, supply-chain exceptions). Grounded in the operational process, event volume + cost, and systems evidence — not SDLC metrics.",
  version: "0.1.0",
  status: "draft",
  applicableIndustries: ["*"],
  applicableFunctions: [
    "operations",
    "service operations",
    "supply chain",
    "customer operations",
  ],
  phaseModel: AI_OPS_PHASES,
  evidenceFamilies: AI_OPS_FAMILIES,
  analysisMethods: [
    "maturity_scoring",
    "two_gap",
    "leverage_ranking",
    "workpackage_roadmap_estimate",
  ],
  // Same deliverable keys as AI-PDLC (routes look deliverables up by key);
  // labels/sections/rubrics adapted to operations language.
  deliverablePack: [
    {
      key: "program_charter",
      label: "Program Charter",
      phase: "charter",
      audience: "Sponsor · Operations leadership",
      sections: [
        "Executive summary",
        "Sponsor commitment & decision rights",
        "Stakeholder map",
        "Current-state operational baseline (cited)",
        "Success metrics & value range",
        "Scope boundary",
      ],
      qualityBar: {
        minSections: 6,
        requiresCitations: true,
        altitude: "exec",
        rubric: [
          "Names this client's actual operations, systems and teams (not generic)",
          "Every quantitative claim cited or marked missing",
          "Value range stated as a range with assumptions, not a point",
        ],
      },
      refinement: REF(),
      formats: ["html", "docx"],
      gateArtifact: true,
    },
    {
      key: "discovery_report",
      label: "Discovery & Diagnostic Report",
      phase: "diagnose",
      audience: "Sponsor · Steering committee",
      sections: [
        "Current-state operational baseline (quantified, cited)",
        "Decision-flow & process analysis",
        "Capability gaps (foundation vs use-case)",
        "Where to start (event leverage × readiness)",
        "Root causes",
        "Continue / discontinue recommendation",
      ],
      qualityBar: {
        minSections: 6,
        requiresCitations: true,
        altitude: "exec",
        rubric: [
          "Every baseline metric cited to its source row",
          "Event-cost analysis shows confidence + insufficient_evidence where unbacked",
          "Where-to-start ranking shows its math",
        ],
      },
      refinement: REF(),
      formats: ["html", "docx", "pptx"],
      gateArtifact: true,
    },
    {
      key: "target_operating_model",
      label: "Target AI-Augmented Operations Model",
      phase: "design",
      audience: "Sponsor · Operations leadership",
      sections: [
        "Human + agent decision workflow design",
        "Ownership, escalation & override rights",
        "Operational governance model",
        "Adoption & change plan",
      ],
      qualityBar: {
        minSections: 4,
        requiresCitations: true,
        altitude: "exec",
        rubric: [
          "Grounded in the current process/decision-flow evidence",
          "Names real teams/roles",
        ],
      },
      refinement: REF(),
      formats: ["html", "docx"],
    },
    {
      key: "ai_enabled_sdlc_architecture",
      label: "AI Decision-Support Architecture",
      phase: "design",
      audience: "Architecture · Platform",
      sections: [
        "Data & integration design",
        "Recommendation / decision engine design",
        "Governance, guardrails & override controls",
        "Reference architecture",
      ],
      qualityBar: {
        minSections: 4,
        requiresCitations: true,
        altitude: "full",
        rubric: [
          "Maps to the client's actual systems landscape",
          "Guardrails tied to real operational controls",
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
        "Value model (cited to event-cost baseline)",
        "Cost model (rate-card provenance)",
        "Payback & sensitivity",
        "Roadmap cash flow",
      ],
      qualityBar: {
        minSections: 5,
        requiresCitations: true,
        altitude: "board",
        rubric: [
          "Every value claim traces to the committed event/KPI baseline",
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
          "Sequencing follows the event-leverage ranking",
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
    key: "ops_event_cost_value",
    label: "Operational event cost & recovery uplift",
    method: "leverage_ranking",
    baselineFamilies: ["ops_event_cost_baseline", "value_kpi_baseline"],
    ratifiedAtPhase: "charter",
  },
  riskModel: {
    key: "ai_ops_decision_risk",
    label: "AI-in-operations risk",
    dimensions: [
      "recommendation quality / trust & override behavior",
      "operational disruption during adoption",
      "data freshness & integration reliability",
      "regulatory / safety / customer-impact exposure",
    ],
  },
  agentGuidance: {
    systemFraming:
      "This Move is an AI Operations Decision Support archetype: an AI recommendation/decision-support layer for an operational workflow (e.g., IROPS recovery, claims ops, supply-chain exceptions). Reason over the client's committed operational process, event volume + cost, systems, and org evidence. Never assert an operational baseline or recommendation without committed evidence; name missing evidence explicitly. Do NOT require SDLC metrics (DORA) — they do not apply here.",
    keyQuestions: [
      "What current-state evidence is missing before the charter can be approved?",
      "What does the event volume + cost baseline imply for AI decision-support leverage?",
      "Which operational decisions/events should the AI layer support first, and why (computed)?",
    ],
    requiresGroundedAnswer: true,
  },
};

// ── CONTACT_CENTER_AGENT_ASSIST (member/customer service agent assist) ───────
// A specialized operations archetype for member/customer service Agent Assist.
// It uses the operations spine but its evidence contract is call-center/current-
// state evidence, not engineering delivery evidence. DORA/ITSM can help later
// for implementation estimation, but they are never hard P2 strategy blockers.

const CONTACT_CENTER_AGENT_ASSIST_FAMILIES: EvidenceFamilySpec[] = [
  {
    key: "member_service_process_map",
    label: "Member-service process and escalation map",
    kind: "qualitative",
    whyNeeded:
      "Shows how agents handle eligibility, benefits, claims, prior authorization, CRM history, knowledge lookup, transfers, and escalation today.",
    sourceDocHint: "Current-state process map, SOP, or workshop notes",
    acceptedFormats: ["docx", "pdf", "pptx"],
    feedsMethods: ["two_gap", "leverage_ranking"],
  },
  {
    key: "member_service_metrics_baseline",
    label: "Contact-center performance baseline",
    kind: "metric_baseline",
    whyNeeded:
      "AHT, after-call work, first-call resolution, repeat contact, transfer rate, backlog, abandonment, CSAT/NPS, QA score, and agent adoption are the baseline for the value case.",
    sourceDocHint: "Contact-center KPI export or operations dashboard extract",
    acceptedFormats: ["csv", "xlsx", "pdf"],
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
  {
    key: "contact_center_transcripts_intents",
    label: "Call transcripts and intent taxonomy",
    kind: "qualitative",
    whyNeeded:
      "Reveals the real question types, agent search patterns, repeat-contact drivers, transfer reasons, and knowledge gaps the agent-assist layer must handle.",
    sourceDocHint: "Redacted call transcripts, intent taxonomy, QA samples, or speech analytics export",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf"],
    feedsMethods: ["two_gap", "leverage_ranking"],
  },
  {
    key: "member_service_systems_data_landscape",
    label: "Member-service systems and data landscape",
    kind: "inventory",
    whyNeeded:
      "Identifies the systems and data sources the agent-assist layer must read from or link to: CRM, claims, prior auth, eligibility/benefits, pharmacy, knowledge base, telephony, and data platform.",
    sourceDocHint: "Application inventory, data-source inventory, integration map, or architecture notes",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf", "pptx"],
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
  {
    key: "knowledge_policy_content_inventory",
    label: "Knowledge, policy, and script inventory",
    kind: "inventory",
    whyNeeded:
      "Agent Assist can only answer consistently if the knowledge base, policies, scripts, and source-of-truth ownership are known and reviewable.",
    sourceDocHint: "Knowledge-base export, policy inventory, script list, or content ownership matrix",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf"],
    feedsMethods: ["two_gap"],
  },
  {
    key: "phi_controls_and_human_approval",
    label: "PHI controls and human-approval boundaries",
    kind: "qualitative",
    whyNeeded:
      "Defines PHI handling, audit logging, role-based access, explainability, escalation, and where the assistant must inform rather than decide.",
    sourceDocHint: "Security/privacy review notes, control matrix, PHI handling policy, or compliance attestation",
    acceptedFormats: ["docx", "pdf", "xlsx"],
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "stakeholder_map",
    label: "Stakeholder and decision-rights map",
    kind: "qualitative",
    whyNeeded:
      "Names the executive sponsor role, operating owner, technology/data owners, risk/privacy approvers, finance value owner, and change owner for this Move.",
    sourceDocHint: "Stakeholder map, RACI, sponsor notes, or governance workshop output",
    acceptedFormats: ["csv", "xlsx", "docx", "pptx"],
  },
  {
    key: "member_service_org_change_readiness",
    label: "Member-service org and change readiness",
    kind: "org",
    whyNeeded:
      "Shows supervisor/agent roles, training model, adoption risks, workforce impacts, decision rights, and operating ownership for the assistant.",
    sourceDocHint: "Org chart, change-readiness assessment, training plan, or stakeholder workshop notes",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf"],
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "solution_delivery_estimation_context",
    label: "Solution delivery estimation context",
    kind: "qualitative",
    whyNeeded:
      "Optional later-phase context for sizing implementation effort: delivery cadence, change controls, ITSM/change windows, SDLC constraints, and vendor/platform team capacity. Useful for ROM estimates, not a P2 hard strategy blocker.",
    sourceDocHint: "Optional delivery/ITSM/SDLC notes or implementation-capacity input",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf"],
    feedsMethods: ["workpackage_roadmap_estimate"],
  },
];

const CONTACT_CENTER_AGENT_ASSIST_PHASES: PhaseRequirements[] = [
  {
    phase: "originate",
    requiredEvidence: [],
    analysisMethods: [],
    deliverables: ["origination_brief"],
    gateRequirements: [
      {
        key: "program_seed_recorded",
        describe: "Brief signed off with contact-center agent-assist archetype",
        severity: "hard",
      },
      {
        key: "value_hypothesis_seed",
        describe: "Value hypothesis names member-service trigger + outcome",
        severity: "hard",
      },
    ],
  },
  {
    phase: "charter",
    requiredEvidence: [
      { family: "member_service_process_map", severity: "hard" },
      { family: "member_service_metrics_baseline", severity: "hard" },
      { family: "member_service_systems_data_landscape", severity: "hard" },
      { family: "stakeholder_map", severity: "hard" },
      { family: "member_service_org_change_readiness", severity: "soft" },
    ],
    analysisMethods: ["maturity_scoring", "two_gap", "leverage_ranking"],
    deliverables: ["program_charter"],
    gateRequirements: [
      {
        key: "charter_signed_off",
        describe: "Charter signed off by member-service sponsor",
        severity: "hard",
      },
    ],
  },
  {
    phase: "diagnose",
    requiredEvidence: [
      { family: "member_service_process_map", severity: "hard" },
      { family: "member_service_metrics_baseline", severity: "hard" },
      { family: "contact_center_transcripts_intents", severity: "hard" },
      { family: "member_service_systems_data_landscape", severity: "hard" },
      { family: "knowledge_policy_content_inventory", severity: "hard" },
      { family: "phi_controls_and_human_approval", severity: "hard" },
      { family: "member_service_org_change_readiness", severity: "soft" },
      { family: "solution_delivery_estimation_context", severity: "soft" },
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
        describe: "Member-service current-state baseline committed + cited",
        severity: "hard",
      },
    ],
  },
];

export const CONTACT_CENTER_AGENT_ASSIST: StrategicMoveArchetype = {
  id: "CONTACT_CENTER_AGENT_ASSIST",
  name: "Contact Center Agent Assist",
  description:
    "Design and scale an AI-assisted agent layer for member/customer service workflows. Grounded in call-center operations, knowledge content, CRM/claims/auth/benefits data, controls, and change readiness — not SDLC metrics.",
  version: "0.1.0",
  status: "draft",
  applicableIndustries: ["healthcare", "insurance", "retail", "financial services", "*"],
  applicableFunctions: [
    "member services",
    "customer operations",
    "contact center",
    "claims operations",
    "operations",
  ],
  phaseModel: CONTACT_CENTER_AGENT_ASSIST_PHASES,
  evidenceFamilies: CONTACT_CENTER_AGENT_ASSIST_FAMILIES,
  analysisMethods: [
    "maturity_scoring",
    "two_gap",
    "leverage_ranking",
    "workpackage_roadmap_estimate",
  ],
  deliverablePack: AI_OPERATIONS_DECISION_SUPPORT.deliverablePack,
  valueModel: {
    key: "agent_assist_member_service_value",
    label: "Member-service productivity and experience uplift",
    method: "leverage_ranking",
    baselineFamilies: [
      "member_service_metrics_baseline",
      "contact_center_transcripts_intents",
    ],
    ratifiedAtPhase: "charter",
  },
  riskModel: {
    key: "agent_assist_healthcare_risk",
    label: "Agent Assist operating and control risk",
    dimensions: [
      "answer accuracy / knowledge freshness",
      "PHI, audit, and access controls",
      "human approval and escalation boundaries",
      "agent adoption and change readiness",
      "systems/data integration reliability",
    ],
  },
  agentGuidance: {
    systemFraming:
      "This Move is a Contact Center Agent Assist archetype. Reason over member-service process, contact-center metrics, transcripts/intents, CRM/claims/auth/benefits systems, knowledge content, PHI controls, and operating ownership. Do not require DORA, CI/CD, or engineering SDLC evidence for P2 strategy discovery; those are optional later-phase delivery-estimation inputs only.",
    keyQuestions: [
      "Which current member-service workflow, metric, transcript, system, knowledge, or control evidence is missing?",
      "Which intents and handoffs create the strongest Agent Assist value opportunity?",
      "Which data, knowledge, PHI, and human-approval foundations must be ready before scaling?",
    ],
    requiresGroundedAnswer: true,
  },
};

// ── COMMERCIAL_LENDING_AGENT_ASSIST ─────────────────────────────────────────
// Specialized operations archetype for banking/commercial-lending Agent Assist.
// It deliberately does not inherit AI-PDLC evidence such as DORA/CI-CD. Those
// inputs can matter later for implementation sizing, but P2 discovery should
// be grounded in lending process, KYC/control, policy, systems, and value data.

const COMMERCIAL_LENDING_AGENT_ASSIST_FAMILIES: EvidenceFamilySpec[] = [
  {
    key: "commercial_lending_process_map",
    label: "Commercial lending process and handoff map",
    kind: "qualitative",
    whyNeeded:
      "Shows how bankers, credit analysts, KYC reviewers, collateral teams, operations, and servicing move a loan package from intake to booking today.",
    sourceDocHint: "Current-state workflow, SOP, workshop notes, or process observation notes",
    acceptedFormats: ["docx", "pdf", "pptx"],
    feedsMethods: ["two_gap", "leverage_ranking"],
  },
  {
    key: "commercial_lending_metrics_baseline",
    label: "Loan onboarding performance baseline",
    kind: "metric_baseline",
    whyNeeded:
      "Cycle time, queue aging, application volume, touch time, rework, document defect rate, KYC completion, credit memo turnaround, and booking exceptions anchor the value case.",
    sourceDocHint: "Loan operations KPI export, dashboard extract, or baseline metrics workbook",
    acceptedFormats: ["csv", "xlsx", "pdf"],
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
  {
    key: "kyc_document_defect_log",
    label: "KYC, document, and control defect log",
    kind: "qualitative",
    whyNeeded:
      "Reveals the defect patterns, missing evidence, policy exceptions, rework loops, and control constraints the assistant must respect.",
    sourceDocHint: "KYC exception log, document defect sample, audit finding extract, or compliance notes",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf"],
    feedsMethods: ["two_gap", "leverage_ranking"],
  },
  {
    key: "lending_systems_data_landscape",
    label: "Lending systems and data landscape",
    kind: "inventory",
    whyNeeded:
      "Identifies the systems and data sources the assistant must read from or link to: CRM, loan origination, core banking, document management, KYC/sanctions, policy, workflow, and data platform.",
    sourceDocHint: "Application inventory, data-source inventory, integration map, or architecture notes",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf", "pptx"],
    feedsMethods: ["maturity_scoring", "leverage_ranking"],
  },
  {
    key: "credit_policy_knowledge_inventory",
    label: "Credit policy and knowledge inventory",
    kind: "inventory",
    whyNeeded:
      "Agent Assist can only support consistent banker/operations decisions if credit policy, KYC guidance, document checklists, covenant rules, and source-of-truth ownership are known.",
    sourceDocHint: "Policy inventory, knowledge-base export, checklist catalog, or content ownership matrix",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf"],
    feedsMethods: ["two_gap"],
  },
  {
    key: "banking_controls_human_approval",
    label: "Banking controls and human-approval boundaries",
    kind: "qualitative",
    whyNeeded:
      "Defines privacy, audit trail, role-based access, model limitations, credit authority, adverse-action boundaries, and where the assistant must inform rather than decide.",
    sourceDocHint: "Risk/control matrix, compliance review notes, credit authority policy, or model-risk guardrails",
    acceptedFormats: ["docx", "pdf", "xlsx"],
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "stakeholder_map",
    label: "Stakeholder and decision-rights map",
    kind: "qualitative",
    whyNeeded:
      "Names the sponsor role, commercial banking owner, loan operations owner, credit risk owner, KYC/AML owner, technology/data owner, finance owner, and change owner.",
    sourceDocHint: "Stakeholder map, RACI, sponsor notes, or governance workshop output",
    acceptedFormats: ["csv", "xlsx", "docx", "pptx"],
  },
  {
    key: "lending_org_change_readiness",
    label: "Lending org and change readiness",
    kind: "org",
    whyNeeded:
      "Shows role impacts, adoption risks, training needs, decision rights, and operating ownership for bankers, credit, KYC, collateral, operations, and servicing.",
    sourceDocHint: "Org chart, change-readiness assessment, training plan, or stakeholder workshop notes",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf"],
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "solution_delivery_estimation_context",
    label: "Solution delivery estimation context",
    kind: "qualitative",
    whyNeeded:
      "Optional later-phase context for ROM sizing: delivery cadence, change controls, integration team capacity, vendor/platform constraints, and release windows. Useful for estimates, not a P2 hard strategy blocker.",
    sourceDocHint: "Optional delivery/ITSM/SDLC notes or implementation-capacity input",
    acceptedFormats: ["csv", "xlsx", "docx", "pdf"],
    feedsMethods: ["workpackage_roadmap_estimate"],
  },
];

const COMMERCIAL_LENDING_AGENT_ASSIST_PHASES: PhaseRequirements[] = [
  {
    phase: "originate",
    requiredEvidence: [],
    analysisMethods: [],
    deliverables: ["origination_brief"],
    gateRequirements: [
      {
        key: "program_seed_recorded",
        describe: "Brief signed off with commercial-lending Agent Assist archetype",
        severity: "hard",
      },
      {
        key: "value_hypothesis_seed",
        describe: "Value hypothesis names loan-onboarding trigger + outcome",
        severity: "hard",
      },
    ],
  },
  {
    phase: "charter",
    requiredEvidence: [
      { family: "commercial_lending_process_map", severity: "hard" },
      { family: "commercial_lending_metrics_baseline", severity: "hard" },
      { family: "lending_systems_data_landscape", severity: "hard" },
      { family: "stakeholder_map", severity: "hard" },
      { family: "lending_org_change_readiness", severity: "soft" },
    ],
    analysisMethods: ["maturity_scoring", "two_gap", "leverage_ranking"],
    deliverables: ["program_charter"],
    gateRequirements: [
      {
        key: "charter_signed_off",
        describe: "Charter signed off by commercial-lending sponsor",
        severity: "hard",
      },
    ],
  },
  {
    phase: "diagnose",
    requiredEvidence: [
      { family: "commercial_lending_process_map", severity: "hard" },
      { family: "commercial_lending_metrics_baseline", severity: "hard" },
      { family: "kyc_document_defect_log", severity: "hard" },
      { family: "lending_systems_data_landscape", severity: "hard" },
      { family: "credit_policy_knowledge_inventory", severity: "hard" },
      { family: "banking_controls_human_approval", severity: "hard" },
      { family: "lending_org_change_readiness", severity: "soft" },
      { family: "solution_delivery_estimation_context", severity: "soft" },
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
        describe: "Commercial-lending current-state baseline committed + cited",
        severity: "hard",
      },
    ],
  },
];

export const COMMERCIAL_LENDING_AGENT_ASSIST: StrategicMoveArchetype = {
  id: "COMMERCIAL_LENDING_AGENT_ASSIST",
  name: "Commercial Lending Agent Assist",
  description:
    "Design and scale an AI-assisted workflow for commercial loan onboarding, grounded in loan operations, KYC/control evidence, credit policy, lending systems, data readiness, and human approval boundaries.",
  version: "0.1.0",
  status: "draft",
  applicableIndustries: ["financial services", "banking"],
  applicableFunctions: [
    "commercial lending",
    "loan operations",
    "credit operations",
    "kyc aml",
    "banking operations",
  ],
  phaseModel: COMMERCIAL_LENDING_AGENT_ASSIST_PHASES,
  evidenceFamilies: COMMERCIAL_LENDING_AGENT_ASSIST_FAMILIES,
  analysisMethods: [
    "maturity_scoring",
    "two_gap",
    "leverage_ranking",
    "workpackage_roadmap_estimate",
  ],
  deliverablePack: AI_OPERATIONS_DECISION_SUPPORT.deliverablePack,
  valueModel: {
    key: "commercial_lending_agent_assist_value",
    label: "Commercial lending productivity, control quality, and cycle-time uplift",
    method: "leverage_ranking",
    baselineFamilies: [
      "commercial_lending_metrics_baseline",
      "kyc_document_defect_log",
    ],
    ratifiedAtPhase: "charter",
  },
  riskModel: {
    key: "commercial_lending_agent_assist_risk",
    label: "Commercial lending Agent Assist operating and control risk",
    dimensions: [
      "credit-authority and adverse-action boundaries",
      "KYC/AML and document-control evidence quality",
      "auditability, access controls, and source citation",
      "banker/credit/operations adoption",
      "lending-system integration reliability",
    ],
  },
  agentGuidance: {
    systemFraming:
      "This Move is a Commercial Lending Agent Assist archetype. Reason over loan-onboarding process, commercial lending metrics, KYC/document defects, lending systems, credit policy/knowledge, banking controls, and human credit authority. Do not require DORA, CI/CD, or engineering SDLC evidence for P2 strategy discovery; those are optional later-phase delivery-estimation inputs only.",
    keyQuestions: [
      "Which loan-onboarding workflow, metric, KYC/control, system, policy, or ownership evidence is missing?",
      "Which document defects, rework loops, KYC exceptions, and handoffs create the strongest Agent Assist value opportunity?",
      "Which data, policy, control, and human-approval foundations must be ready before scaling?",
    ],
    requiresGroundedAnswer: true,
  },
};

// ── Registry ─────────────────────────────────────────────────────────────────

export const ARCHETYPE_REGISTRY: Record<string, StrategicMoveArchetype> = {
  [AI_PRODUCT_DEVELOPMENT_LIFECYCLE.id]: AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
  [IT_SOURCING_EVENT.id]: IT_SOURCING_EVENT,
  [AI_OPERATIONS_DECISION_SUPPORT.id]: AI_OPERATIONS_DECISION_SUPPORT,
  [CONTACT_CENTER_AGENT_ASSIST.id]: CONTACT_CENTER_AGENT_ASSIST,
  [COMMERCIAL_LENDING_AGENT_ASSIST.id]: COMMERCIAL_LENDING_AGENT_ASSIST,
};

export const DEFAULT_ARCHETYPE_ID = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.id;

export function getArchetype(id: string): StrategicMoveArchetype | undefined {
  return ARCHETYPE_REGISTRY[id];
}

export function listArchetypes(): StrategicMoveArchetype[] {
  return Object.values(ARCHETYPE_REGISTRY);
}

// ── Per-Move archetype resolution ────────────────────────────────────────────
// A Move's framework archetype is resolved from what the program row actually
// carries: an exact registry id wins; otherwise a heuristic over the program's
// archetype key (e.g. "operational_optimization"), charter classification, and
// name. Unknown/empty input falls back to AI-PDLC (back-compat with the
// pre-resolver behavior — DEFAULT_ARCHETYPE_ID).

export function resolveProgramArchetype(input: {
  archetype?: string | null;
  classification?: string | null;
  name?: string | null;
}): StrategicMoveArchetype {
  // Exact registry id (e.g. a route that already carries a framework id).
  if (input.archetype) {
    const exact = getArchetype(input.archetype);
    if (exact) return exact;
  }

  const haystack = [input.archetype, input.classification, input.name]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ")
    .toLowerCase();

  if (
    /commercial lending|loan onboarding|loan origination|credit memo|credit analyst|credit policy|kyc|aml|covenant|collateral|core banking/.test(
      haystack,
    ) &&
    /agent assist|ai-assisted|assistant|workflow|onboarding/.test(haystack)
  ) {
    return COMMERCIAL_LENDING_AGENT_ASSIST;
  }
  if (
    /contact center|call center|agent assist|member service|member experience|member ai assist|member.*assist|benefits|eligibility|prior auth|prior authorization/.test(
      haystack,
    )
  ) {
    return CONTACT_CENTER_AGENT_ASSIST;
  }
  if (/sourcing|vendor|renegoti/.test(haystack)) {
    return IT_SOURCING_EVENT;
  }
  // Strong operations tokens outrank PDLC: an IROPS Move whose classification
  // happens to mention "product development" must still resolve to ops
  // (founder-reported: DORA shown on an IROPS Move's workspace).
  if (
    /irops|re-?accom|operational_optimization|recovery|disruption/.test(
      haystack,
    )
  ) {
    return AI_OPERATIONS_DECISION_SUPPORT;
  }
  if (
    /pdlc|sdlc|product development|software|engineering lifecycle/.test(
      haystack,
    )
  ) {
    return AI_PRODUCT_DEVELOPMENT_LIFECYCLE;
  }
  if (
    /irops|operations|operational_optimization|ops |recovery|disruption|claims|exception|contact center|call center|agent assist|member service|prior auth|prior authorization|eligibility|benefits|re-?accommodation/.test(
      haystack,
    )
  ) {
    return AI_OPERATIONS_DECISION_SUPPORT;
  }
  // Back-compat default: behave exactly like the old DEFAULT_ARCHETYPE_ID path.
  return AI_PRODUCT_DEVELOPMENT_LIFECYCLE;
}
