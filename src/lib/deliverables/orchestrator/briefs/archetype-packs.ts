// Archetype packs — the use-case-specific artifact intelligence.
//
// Each pack carries the exhibits, tables, and key evidence families a senior
// consultant expects for that use case. The brief registry composes a pack with a
// deliverable structure to produce a full DeliverableArtifactBrief, so deliverables
// genuinely DIFFER by archetype rather than sharing one generic template.

import type { ExpectedExhibit, ExpectedTable } from "../types";

export interface ArchetypePack {
  archetype: string;
  label: string; // how the role line describes the expertise
  /** evidence families this use case typically needs (drives grounding + intake). */
  keyEvidenceFamilies: string[];
  exhibits: ExpectedExhibit[];
  tables: ExpectedTable[];
  /** extra governance note appended to the disallowed-fabrication boundary. */
  governanceNote?: string;
}

const ex = (
  key: string,
  title: string,
  kind: ExpectedExhibit["kind"],
  purpose: string,
  preferredFormat: ExpectedExhibit["preferredFormat"] = "pptx",
): ExpectedExhibit => ({ key, title, kind, purpose, preferredFormat });

const tbl = (
  key: string,
  title: string,
  columns: string[],
  groundingMode: ExpectedTable["groundingMode"] = "governed_facts",
  moveToExcelIfWide = true,
): ExpectedTable => ({ key, title, columns, groundingMode, moveToExcelIfWide });

const RISK_TABLE = tbl(
  "risk_register",
  "Risks, Issues & Dependencies",
  ["Item", "Type", "Impact", "Owner", "Mitigation"],
  "mixed",
  false,
);

// ── AMS / IT outsourcing ──
const AMS: ArchetypePack = {
  archetype: "AMS_IT_OUTSOURCING",
  label: "application management services and IT outsourcing",
  keyEvidenceFamilies: [
    "service_tower_scope",
    "application_inventory",
    "sla_baseline",
    "ticket_volumes",
    "incident_problem_change",
    "staffing_baseline",
    "run_cost_baseline",
    "contract_baseline",
    "transition_constraints",
  ],
  exhibits: [
    ex(
      "tower_scope_map",
      "Service Tower Scope Map",
      "matrix",
      "Towers × services × in/out of scope.",
      "xlsx",
    ),
    ex(
      "transition_timeline",
      "Transition Timeline",
      "timeline",
      "Phased transition with KT, parallel run, and gates.",
    ),
    ex(
      "evaluation_model",
      "Evaluation Model",
      "matrix",
      "Criteria × weights × scoring method.",
      "xlsx",
    ),
    ex(
      "negotiation_levers",
      "Negotiation Levers",
      "matrix",
      "Levers × leverage × target outcome (internal).",
    ),
  ],
  tables: [
    tbl("application_inventory", "Application Inventory", [
      "App",
      "Criticality",
      "Business function",
      "Tower",
    ]),
    tbl("sla_schedule", "SLA / KPI Schedule", [
      "Service",
      "Metric",
      "Target",
      "Window",
      "Credit",
    ]),
    tbl("volume_baseline", "Demand Baseline", [
      "Tower",
      "Priority",
      "Period",
      "Volume",
    ]),
    tbl(
      "staffing_baseline",
      "Staffing / Retained-Org Baseline",
      ["Role", "Tower", "FTE", "Location mix"],
      "mixed",
    ),
    tbl(
      "pricing_template",
      "Pricing Response Template",
      ["Tower", "Resource unit", "Rate", "Volume", "Annual"],
      "expert_template",
    ),
    RISK_TABLE,
  ],
  governanceNote:
    "For an ISSUED RFP, never disclose incumbent vendor names or incumbent spend — those are internal-only.",
};

// ── ERP / SI selection ──
const ERP_SI: ArchetypePack = {
  archetype: "ERP_SI_SELECTION",
  label: "ERP and systems-integrator selection",
  keyEvidenceFamilies: [
    "process_scope",
    "integration_landscape",
    "data_migration_complexity",
    "business_readiness",
    "application_inventory",
    "run_cost_baseline",
  ],
  exhibits: [
    ex(
      "process_scope_map",
      "Process Scope Map",
      "matrix",
      "L1/L2 processes × in-scope × rollout wave.",
      "xlsx",
    ),
    ex(
      "rollout_waves",
      "Rollout Waves",
      "timeline",
      "Geographies/entities × waves with go-lives.",
    ),
    ex(
      "integration_landscape",
      "Integration Landscape",
      "flow",
      "Source/target systems × interfaces × pattern.",
    ),
    ex(
      "cutover_plan",
      "Testing & Cutover Plan",
      "timeline",
      "Test stages, mock cutovers, go/no-go gates.",
    ),
    ex(
      "evaluation_model",
      "SI Evaluation Model",
      "matrix",
      "Criteria × weights × scoring.",
      "xlsx",
    ),
  ],
  tables: [
    tbl("process_scope", "Process Scope", [
      "Process (L1/L2)",
      "In scope",
      "Wave",
      "Owner",
    ]),
    tbl("integration_register", "Integration Register", [
      "Source",
      "Target",
      "Pattern",
      "Volume",
      "Criticality",
    ]),
    tbl("data_objects", "Data Migration Objects", [
      "Object",
      "Source",
      "Records",
      "Complexity",
      "Cleansing",
    ]),
    tbl(
      "si_staffing",
      "SI Staffing Model",
      ["Role", "Onshore/Offshore", "FTE", "Phase"],
      "mixed",
    ),
    tbl(
      "pricing_template",
      "Pricing Template",
      ["Phase", "Deliverable", "Effort", "Rate", "Cost"],
      "expert_template",
    ),
    RISK_TABLE,
  ],
};

// ── Cloud modernization ──
const CLOUD_MOD: ArchetypePack = {
  archetype: "CLOUD_MODERNIZATION",
  label: "cloud modernization and migration",
  keyEvidenceFamilies: [
    "application_inventory",
    "app_dependency_map",
    "infrastructure_estate",
    "cloud_cost_baseline",
    "security_network_constraints",
    "run_cost_baseline",
  ],
  exhibits: [
    ex(
      "app_dependency_map",
      "Application Dependency Map",
      "flow",
      "Apps × dependencies × migration grouping.",
    ),
    ex(
      "migration_waves",
      "Migration Waves",
      "timeline",
      "Move-groups × waves × disposition (6Rs).",
    ),
    ex(
      "landing_zone",
      "Landing Zone Readiness",
      "heatmap",
      "Foundation controls × readiness state.",
    ),
    ex(
      "finops_model",
      "FinOps / Cost Model",
      "chart",
      "Baseline vs target run-rate by service.",
      "xlsx",
    ),
  ],
  tables: [
    tbl("app_disposition", "Application Disposition (6Rs)", [
      "App",
      "Disposition",
      "Wave",
      "Complexity",
      "Risk",
    ]),
    tbl("infra_estate", "Infrastructure Estate", [
      "Asset",
      "Class",
      "Location",
      "Lifecycle",
    ]),
    tbl(
      "cost_baseline",
      "Cloud Cost Baseline",
      ["Service", "Current $", "Target $", "Driver"],
      "mixed",
    ),
    tbl(
      "security_constraints",
      "Security / Network Constraints",
      ["Constraint", "Scope", "Control owner"],
      "mixed",
    ),
    RISK_TABLE,
  ],
};

// ── AI-powered product development lifecycle ──
const AI_PDLC: ArchetypePack = {
  archetype: "AI_PDLC",
  label: "the AI-powered product development lifecycle",
  keyEvidenceFamilies: [
    "dora_baseline",
    "engineering_operating_model",
    "platform_architecture",
    "ai_tooling_adoption",
    "security_governance_gates",
  ],
  exhibits: [
    ex(
      "dora_baseline",
      "DORA Baseline",
      "chart",
      "Deploy freq, lead time, CFR, MTTR vs benchmark.",
      "xlsx",
    ),
    ex(
      "operating_model",
      "Engineering / Product Operating Model",
      "matrix",
      "Teams × responsibilities × interfaces.",
    ),
    ex(
      "platform_architecture",
      "Application / Platform Architecture",
      "flow",
      "Platforms, services, and data flows.",
    ),
    ex(
      "human_agent_workflow",
      "Human + Agent Workflow",
      "flow",
      "Where agents act vs humans decide, with gates.",
    ),
    ex(
      "governance_gates",
      "Security / Governance Gates",
      "flow",
      "SDLC gates for AI-generated change.",
    ),
    ex(
      "phase_roadmap",
      "Phase Roadmap",
      "timeline",
      "Capability build-out by phase.",
    ),
  ],
  tables: [
    tbl(
      "dora_metrics",
      "DORA Metrics",
      ["Metric", "Current", "Target", "Benchmark"],
      "mixed",
    ),
    tbl(
      "ai_tooling",
      "AI Tooling Adoption",
      ["Tool", "Use case", "Adoption %", "Owner"],
      "mixed",
    ),
    tbl(
      "value_hypothesis",
      "Value Hypothesis",
      ["Lever", "Mechanism", "KPI", "Target"],
      "mixed",
    ),
    RISK_TABLE,
  ],
};

// ── Analytics capability repatriation / managed analytics exit ──
const ANALYTICS_REPATRIATION: ArchetypePack = {
  archetype: "ANALYTICS_CAPABILITY_REPATRIATION",
  label: "analytics capability repatriation and managed analytics exit",
  keyEvidenceFamilies: [
    "analytics_capability_inventory",
    "vendor_data_feed_register",
    "processing_transparency",
    "business_rules_measure_logic",
    "output_workflow_inventory",
    "data_quality_identity_conformance",
    "internal_databricks_readiness",
    "controls_privacy_security_regulatory",
    "sla_operations_baseline",
    "contract_ip_data_return_exit",
    "current_cost_value_baseline",
    "operating_model_readiness",
  ],
  exhibits: [
    ex(
      "strategic_control_repatriation_readiness",
      "Strategic Control x Repatriation Readiness",
      "matrix",
      "Four-quadrant decision view: retain/optimize, hybrid/coexistence, phased repatriation, or full repatriation.",
    ),
    ex(
      "vendor_to_databricks_traceability",
      "Vendor-to-Databricks Capability Traceability",
      "matrix",
      "Existing vendor capability -> inputs -> known/unknown logic -> target component -> output/workflow -> control -> acceptance/parity test -> treatment.",
      "xlsx",
    ),
    ex(
      "target_analytics_architecture",
      "Target Analytics Architecture on a Page",
      "logical_architecture",
      "Capability, ingestion, Bronze/Silver/Gold, semantic/metric, governance, activation, monitoring, and coexistence views when evidenced.",
    ),
    ex(
      "parallel_run_parity_plan",
      "Parallel Run and Parity Plan",
      "timeline",
      "Sequenced proof of output parity, reconciliation, operating readiness, and exit/reset gates.",
    ),
    ex(
      "transition_cost_stack",
      "Investment and Transition Cost Stack",
      "chart",
      "Separates shared foundation, capability reconstruction, transition/double-run, retained vendor obligations, cloud run, and reuse value.",
      "xlsx",
    ),
  ],
  tables: [
    tbl("capability_inventory", "Managed Analytics Capability Inventory", [
      "Capability",
      "Business owner",
      "Inputs",
      "Outputs",
      "Workflow",
      "Criticality",
    ]),
    tbl("vendor_data_flows", "Data Sent to Provider", [
      "Source",
      "Dataset",
      "Frequency",
      "PII/PHI/regulated data",
      "Return path",
      "Control",
    ]),
    tbl("logic_transparency", "Business Rules, Measures and Model Logic", [
      "Capability",
      "Known logic",
      "Unknown logic",
      "Evidence",
      "Treatment",
    ]),
    tbl("parity_traceability", "Capability Parity Traceability Matrix", [
      "Vendor capability",
      "Target component",
      "Control",
      "Acceptance/parity test",
      "Treatment",
    ]),
    tbl(
      "exit_posture",
      "Contract, IP, Data Return and Exit Posture",
      ["Contract area", "Known position", "Risk", "Required decision", "Owner"],
      "mixed",
    ),
    tbl(
      "cost_value_stack",
      "Cost, Value and Reuse Stack",
      [
        "Cost/value bucket",
        "Evidence status",
        "Amount/range",
        "Timing",
        "Condition",
      ],
      "mixed",
    ),
    RISK_TABLE,
  ],
  governanceNote:
    "For analytics repatriation, migrate capabilities rather than screens. Never compute savings as vendor spend minus internal platform cost; quantified value requires validated vendor cost, retained obligations, foundation investment, capability investment, transition/double-run cost, run cost, timing, and risk conditions.",
};

export const ARCHETYPE_PACKS: Record<string, ArchetypePack> = {
  AMS_IT_OUTSOURCING: AMS,
  ERP_SI_SELECTION: ERP_SI,
  CLOUD_MODERNIZATION: CLOUD_MOD,
  AI_PDLC,
  ANALYTICS_CAPABILITY_REPATRIATION: ANALYTICS_REPATRIATION,
};

export function getArchetypePack(archetype: string): ArchetypePack | undefined {
  return ARCHETYPE_PACKS[archetype];
}
