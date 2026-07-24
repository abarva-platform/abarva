/**
 * Nexus Pricing Engine — PR4 effort-engine reference-pack generator.
 *
 * Produces the 8 PR4 CSVs under `datasets/reference/pricing-engine-v1/`:
 * `pricing_archetypes.csv`, `pricing_activity_packs.csv`,
 * `pricing_effort_drivers.csv`, `pricing_effort_rules.csv`,
 * `pricing_activity_role_mix.csv`, `pricing_archetype_activity_map.csv`,
 * `pricing_range_policies.csv`, `pricing_agent_costs.csv`.
 *
 * ## Why a generator script rather than hand-typed CSV rows
 *
 * The content itself is 100% hand-authored (see the domain data below and
 * every row's `source_artifact = "hand-authored-pr4"` tag) — this script is
 * only a deterministic, reviewable RENDERING of that hand-authored content
 * into the exact CSV shape the PR4 migration/loader expects, the same
 * separation-of-concerns PR1's `convert-workbook-to-reference-pack.ts` uses
 * (there, a workbook was the source; here, the arrays below ARE the source).
 * Typing ~450 CSV rows by hand across 8 interrelated files is far more
 * error-prone (typos in a role_code, a dangling activity_pack_code
 * reference) than defining the same content as typed TS literals once and
 * letting the compiler + this script's own cross-reference checks catch
 * mistakes before a single row is written.
 *
 * Every real `role_code` / `tower_code` / `capability_code` referenced below
 * was read directly from `datasets/reference/pricing-engine-v1/
 * pricing_roles.csv` / `pricing_towers.csv` / `pricing_capabilities.csv`
 * (PR1's real, committed taxonomy) — none are invented codes. See
 * `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` and the PR4 execution
 * prompt for the honesty requirement this satisfies.
 *
 * Run: `npx tsx scripts/pricing/generate-pr4-effort-pack.ts`
 */
import path from "node:path";
import { writeCsv } from "./csv-utils";

const SOURCE = "hand-authored-pr4";

// ---------------------------------------------------------------------------
// 1. Archetypes (brief §7.6 — exactly 8)
// ---------------------------------------------------------------------------
const archetypes = [
  {
    archetype_code: "ARCH-01",
    archetype_name: "AI / automation use case",
    description:
      "A discrete AI, GenAI, agentic-AI, or intelligent-automation use case: solution design, model/agent build, MLOps/LLMOps enablement, responsible-AI governance.",
  },
  {
    archetype_code: "ARCH-02",
    archetype_name: "Data and analytics product",
    description:
      "A data platform, data product, or analytics capability: data architecture, engineering/pipeline build, governance/quality/MDM, BI/reporting.",
  },
  {
    archetype_code: "ARCH-03",
    archetype_name: "Application implementation or modernization",
    description:
      "Custom application build, replatforming, or modernization: solution architecture, backend/API/frontend/mobile engineering, quality engineering.",
  },
  {
    archetype_code: "ARCH-04",
    archetype_name: "Cloud, platform or integration initiative",
    description:
      "Cloud landing zone / platform engineering / SRE enablement plus integration architecture and iPaaS/event-streaming build.",
  },
  {
    archetype_code: "ARCH-05",
    archetype_name: "Process and operating-model transformation",
    description:
      "Operating-model redesign, business-process reengineering, process mining, and intelligent automation applied to a process (not a standalone AI use case).",
  },
  {
    archetype_code: "ARCH-06",
    archetype_name: "Managed-services / sourcing transition",
    description:
      "Transitioning application/platform support into a managed-services model: transition and service design, knowledge transfer, L1/L2/L3 stand-up, observability.",
  },
  {
    archetype_code: "ARCH-07",
    archetype_name: "ERP implementation or upgrade",
    description:
      "ERP solution architecture and migration strategy, functional configuration, technical build, data migration/cutover, and ERP security/controls.",
  },
  {
    archetype_code: "ARCH-08",
    archetype_name: "Legacy / mainframe modernization",
    description:
      "Mainframe modernization architecture, COBOL/batch engineering, z/OS & DB2 platform engineering, and modernized target-state application build.",
  },
] as const;

type ArchetypeCode = (typeof archetypes)[number]["archetype_code"];

// ---------------------------------------------------------------------------
// 2. Effort drivers (global vocabulary; brief §9.6 example names honored
//    where applicable: integration_count, impacted_user_count,
//    rollout_wave_count).
// ---------------------------------------------------------------------------
const drivers = [
  { driver_code: "integration_count", driver_name: "Integration Count", unit_label: "integration", description: "Number of point-to-point/API/event integrations in scope." },
  { driver_code: "impacted_user_count", driver_name: "Impacted User Count", unit_label: "user", description: "Number of end users impacted by the change, for training/adoption sizing." },
  { driver_code: "rollout_wave_count", driver_name: "Rollout Wave Count", unit_label: "wave", description: "Number of deployment/rollout waves." },
  { driver_code: "stakeholder_group_count", driver_name: "Stakeholder Group Count", unit_label: "stakeholder group", description: "Number of distinct stakeholder groups requiring tailored engagement." },
  { driver_code: "course_count", driver_name: "Course Count", unit_label: "course", description: "Number of distinct training courses to design." },
  { driver_code: "training_session_count", driver_name: "Training Session Count", unit_label: "session", description: "Number of scheduled training delivery sessions." },
  { driver_code: "supplier_month_count", driver_name: "Supplier-Month Count", unit_label: "supplier-month", description: "Number of supplier-months under active commercial/vendor governance." },
  { driver_code: "data_domain_count", driver_name: "Data Domain Count", unit_label: "data domain", description: "Number of data domains in scope for governance/modeling." },
  { driver_code: "data_source_count", driver_name: "Data Source Count", unit_label: "data source", description: "Number of source systems feeding the data pipeline." },
  { driver_code: "report_count", driver_name: "Report Count", unit_label: "report", description: "Number of BI reports/dashboards to build." },
  { driver_code: "process_count", driver_name: "Process Count", unit_label: "process", description: "Number of end-to-end business processes in scope." },
  { driver_code: "automation_count", driver_name: "Automation Count", unit_label: "automation", description: "Number of automations/bots to design and build." },
  { driver_code: "environment_count", driver_name: "Environment Count", unit_label: "environment", description: "Number of cloud/platform environments to stand up." },
  { driver_code: "application_count", driver_name: "Application Count", unit_label: "application", description: "Number of applications in scope for build/modernization." },
  { driver_code: "module_count", driver_name: "Module Count", unit_label: "module", description: "Number of ERP functional modules in scope (e.g. FI/CO, MM, SD)." },
  { driver_code: "batch_job_count", driver_name: "Batch Job Count", unit_label: "batch job", description: "Number of mainframe batch jobs to migrate or re-platform." },
  { driver_code: "program_count", driver_name: "COBOL Program Count", unit_label: "COBOL program", description: "Number of COBOL programs to remediate or modernize." },
  { driver_code: "ai_use_case_count", driver_name: "AI Use Case Count", unit_label: "AI use case", description: "Number of distinct AI/agentic use cases in scope." },
  { driver_code: "model_count", driver_name: "Model Count", unit_label: "model", description: "Number of ML/GenAI models requiring MLOps/validation/governance." },
  { driver_code: "support_ticket_volume_monthly", driver_name: "Monthly Support Ticket Volume", unit_label: "ticket/month", description: "Steady-state monthly ticket volume used to size a managed-services support model." },
  { driver_code: "role_count", driver_name: "Role Count", unit_label: "role", description: "Number of distinct organizational/security roles in scope (RACI/config sizing)." },
  { driver_code: "test_case_count", driver_name: "Test Case Count", unit_label: "test case", description: "Number of automated test cases to build." },
  { driver_code: "hypercare_week_count", driver_name: "Hypercare Week Count", unit_label: "week", description: "Number of weeks of post-go-live hypercare stabilization support." },
] as const;

type DriverCode = (typeof drivers)[number]["driver_code"];

// ---------------------------------------------------------------------------
// 3. Activity packs — 37 archetype-specific technical + 12 shared
//    non-technical (brief §7.5). tower_code/capability_code are the
//    "natural home" taxonomy reference for traceability (soft references,
//    see migration comment).
// ---------------------------------------------------------------------------
interface ActivityPackDef {
  activity_pack_code: string;
  activity_pack_name: string;
  category: "technical" | "shared_nontechnical";
  tower_code: string | null;
  capability_code: string | null;
  description: string;
}

const technicalPacks: ActivityPackDef[] = [
  // ARCH-01 — AI / automation (TWR-05 AI & GenAI, TWR-03 Business Process)
  { activity_pack_code: "AP-TECH-AI-01", activity_pack_name: "AI Solution Design & Agent Architecture", category: "technical", tower_code: "TWR-05", capability_code: "CAP-027", description: "Use-case discovery, agent/solution architecture, and integration design for an AI or agentic-AI initiative." },
  { activity_pack_code: "AP-TECH-AI-02", activity_pack_name: "GenAI/Agent Build & Prompt Engineering", category: "technical", tower_code: "TWR-05", capability_code: "CAP-028", description: "Build of the GenAI/agent capability itself: prompt/context engineering, retrieval, tool-use wiring." },
  { activity_pack_code: "AP-TECH-AI-03", activity_pack_name: "MLOps/LLMOps Platform Enablement", category: "technical", tower_code: "TWR-05", capability_code: "CAP-031", description: "Model/agent deployment pipeline, monitoring, and platform enablement for ongoing operation." },
  { activity_pack_code: "AP-TECH-AI-04", activity_pack_name: "Responsible AI, Model Validation & AI Governance", category: "technical", tower_code: "TWR-05", capability_code: "CAP-035", description: "Model validation, bias/safety review, and AI governance sign-off specific to the AI use case." },
  { activity_pack_code: "AP-TECH-AI-05", activity_pack_name: "Intelligent Automation / RPA Integration", category: "technical", tower_code: "TWR-03", capability_code: "CAP-012", description: "RPA/workflow automation build where the AI use case includes a robotic-process-automation component." },

  // ARCH-02 — Data & analytics product (TWR-04)
  { activity_pack_code: "AP-TECH-DATA-01", activity_pack_name: "Data Architecture & Modeling", category: "technical", tower_code: "TWR-04", capability_code: "CAP-013", description: "Target-state data architecture and logical/physical data modeling for the data product." },
  { activity_pack_code: "AP-TECH-DATA-02", activity_pack_name: "Data Engineering & Pipeline Build", category: "technical", tower_code: "TWR-04", capability_code: "CAP-019", description: "Ingestion/transformation pipeline build from source systems into the target data platform." },
  { activity_pack_code: "AP-TECH-DATA-03", activity_pack_name: "Data Governance, Quality & MDM", category: "technical", tower_code: "TWR-04", capability_code: "CAP-014", description: "Governance policy, data-quality rules, and master-data management for the domains in scope." },
  { activity_pack_code: "AP-TECH-DATA-04", activity_pack_name: "BI/Analytics & Reporting Enablement", category: "technical", tower_code: "TWR-04", capability_code: "CAP-020", description: "BI semantic layer, reports, and dashboards built on the data product." },
  { activity_pack_code: "AP-TECH-DATA-05", activity_pack_name: "Data Product Management", category: "technical", tower_code: "TWR-04", capability_code: "CAP-018", description: "Product management and phased rollout of the data product to consuming teams." },

  // ARCH-03 — Application implementation/modernization (TWR-09)
  { activity_pack_code: "AP-TECH-APP-01", activity_pack_name: "Solution & Modernization Architecture", category: "technical", tower_code: "TWR-09", capability_code: "CAP-054", description: "Target-state application architecture and modernization approach (rehost/replatform/rearchitect)." },
  { activity_pack_code: "AP-TECH-APP-02", activity_pack_name: "Backend/API Engineering Build", category: "technical", tower_code: "TWR-09", capability_code: "CAP-052", description: "Backend service and API implementation for the application(s) in scope." },
  { activity_pack_code: "AP-TECH-APP-03", activity_pack_name: "Frontend/UX Engineering Build", category: "technical", tower_code: "TWR-09", capability_code: "CAP-051", description: "Frontend implementation for the application(s) in scope." },
  { activity_pack_code: "AP-TECH-APP-04", activity_pack_name: "Mobile Engineering Build", category: "technical", tower_code: "TWR-09", capability_code: "CAP-053", description: "Native/cross-platform mobile implementation, where the application scope includes a mobile client." },
  { activity_pack_code: "AP-TECH-APP-05", activity_pack_name: "Quality Engineering & Test Automation", category: "technical", tower_code: "TWR-15", capability_code: "CAP-083", description: "Test strategy and automated test-suite build for the application(s) in scope." },

  // ARCH-04 — Cloud/platform/integration (TWR-12 Cloud, TWR-10 Integration)
  { activity_pack_code: "AP-TECH-CLOUD-01", activity_pack_name: "Cloud/Landing-Zone Architecture", category: "technical", tower_code: "TWR-12", capability_code: "CAP-066", description: "Cloud landing-zone and platform architecture design." },
  { activity_pack_code: "AP-TECH-CLOUD-02", activity_pack_name: "Platform Engineering & DevOps/IaC", category: "technical", tower_code: "TWR-12", capability_code: "CAP-069", description: "Platform engineering, CI/CD, and infrastructure-as-code build for the environments in scope." },
  { activity_pack_code: "AP-TECH-CLOUD-03", activity_pack_name: "SRE & Site Reliability Enablement", category: "technical", tower_code: "TWR-12", capability_code: "CAP-071", description: "SLO/SLI definition and site-reliability engineering enablement for the platform." },
  { activity_pack_code: "AP-TECH-INTEG-01", activity_pack_name: "Integration Architecture & API Management", category: "technical", tower_code: "TWR-10", capability_code: "CAP-057", description: "Integration architecture, API management, and contract design across the integrations in scope." },
  { activity_pack_code: "AP-TECH-INTEG-02", activity_pack_name: "iPaaS/Event Streaming Build", category: "technical", tower_code: "TWR-10", capability_code: "CAP-056", description: "iPaaS flow and/or event-streaming pipeline build for the integrations in scope." },

  // ARCH-05 — Process & operating-model transformation (TWR-03, TWR-01)
  { activity_pack_code: "AP-TECH-PROC-01", activity_pack_name: "Operating Model & Transformation Strategy", category: "technical", tower_code: "TWR-01", capability_code: "CAP-002", description: "Target operating-model design and transformation strategy/roadmap." },
  { activity_pack_code: "AP-TECH-PROC-02", activity_pack_name: "Process Design & Reengineering", category: "technical", tower_code: "TWR-03", capability_code: "CAP-010", description: "Current/target-state process design and reengineering for the processes in scope." },
  { activity_pack_code: "AP-TECH-PROC-03", activity_pack_name: "Process Mining & Diagnostics", category: "technical", tower_code: "TWR-03", capability_code: "CAP-011", description: "Process-mining diagnostic work to baseline current-state process performance." },
  { activity_pack_code: "AP-TECH-PROC-04", activity_pack_name: "Intelligent Automation for Process", category: "technical", tower_code: "TWR-03", capability_code: "CAP-012", description: "Workflow/automation build applied to the redesigned process(es)." },

  // ARCH-06 — Managed services / sourcing transition (TWR-17)
  { activity_pack_code: "AP-TECH-AMS-01", activity_pack_name: "Transition & Service Design", category: "technical", tower_code: "TWR-17", capability_code: "CAP-091", description: "Service design and transition planning from the incumbent model to the target managed-services model." },
  { activity_pack_code: "AP-TECH-AMS-02", activity_pack_name: "Knowledge Transfer & Runbook Build", category: "technical", tower_code: "TWR-17", capability_code: "CAP-091", description: "Knowledge capture and operational runbook build ahead of go-live." },
  { activity_pack_code: "AP-TECH-AMS-03", activity_pack_name: "L1/L2/L3 Support Model Stand-up", category: "technical", tower_code: "TWR-17", capability_code: "CAP-089", description: "Stand-up of the tiered support organization and processes." },
  { activity_pack_code: "AP-TECH-AMS-04", activity_pack_name: "Observability & Monitoring Enablement", category: "technical", tower_code: "TWR-16", capability_code: "CAP-087", description: "Monitoring/observability tooling enablement for the transitioned estate." },

  // ARCH-07 — ERP implementation/upgrade (TWR-11) — SAP used as the
  // representative vendor family (the most fully populated ERP vendor in
  // PR1's taxonomy); the pack shape generalizes to Oracle/Workday equivalents.
  { activity_pack_code: "AP-TECH-ERP-01", activity_pack_name: "ERP Solution Architecture & Migration Strategy", category: "technical", tower_code: "TWR-11", capability_code: "CAP-106", description: "ERP solution architecture and migration-wave strategy." },
  { activity_pack_code: "AP-TECH-ERP-02", activity_pack_name: "ERP Functional Configuration — Finance & SCM", category: "technical", tower_code: "TWR-11", capability_code: "CAP-059", description: "Functional configuration of finance and supply-chain modules." },
  { activity_pack_code: "AP-TECH-ERP-03", activity_pack_name: "ERP Technical Build — ABAP/Fiori/Integration", category: "technical", tower_code: "TWR-11", capability_code: "CAP-107", description: "Custom technical development and integration build on the ERP platform." },
  { activity_pack_code: "AP-TECH-ERP-04", activity_pack_name: "ERP Data Migration & Cutover", category: "technical", tower_code: "TWR-11", capability_code: "CAP-061", description: "Legacy data migration, mock/dress-rehearsal cutovers, and go-live cutover execution." },
  { activity_pack_code: "AP-TECH-ERP-05", activity_pack_name: "ERP Security & Controls", category: "technical", tower_code: "TWR-11", capability_code: "CAP-061", description: "Segregation-of-duties design and security-role build for the ERP platform." },

  // ARCH-08 — Legacy / mainframe modernization (TWR-18)
  { activity_pack_code: "AP-TECH-LEGACY-01", activity_pack_name: "Mainframe Modernization Architecture", category: "technical", tower_code: "TWR-18", capability_code: "CAP-092", description: "Modernization architecture and wave sequencing for the mainframe estate." },
  { activity_pack_code: "AP-TECH-LEGACY-02", activity_pack_name: "COBOL/Batch Engineering", category: "technical", tower_code: "TWR-18", capability_code: "CAP-093", description: "COBOL remediation and batch-job re-engineering." },
  { activity_pack_code: "AP-TECH-LEGACY-03", activity_pack_name: "z/OS & DB2 Platform Engineering", category: "technical", tower_code: "TWR-18", capability_code: "CAP-095", description: "z/OS and DB2 platform engineering supporting the modernization." },
  { activity_pack_code: "AP-TECH-LEGACY-04", activity_pack_name: "Modernized Target-State Application Build", category: "technical", tower_code: "TWR-18", capability_code: "CAP-054", description: "Build of the modernized, non-mainframe target-state application(s)." },
];

const sharedPacks: ActivityPackDef[] = [
  { activity_pack_code: "AP-SHARED-01", activity_pack_name: "Change & Stakeholder Engagement", category: "shared_nontechnical", tower_code: "TWR-19", capability_code: "CAP-096", description: "Organizational change management and stakeholder engagement planning/execution." },
  { activity_pack_code: "AP-SHARED-02", activity_pack_name: "Communications", category: "shared_nontechnical", tower_code: "TWR-19", capability_code: "CAP-098", description: "Communications planning and execution across the stakeholder groups in scope." },
  { activity_pack_code: "AP-SHARED-03", activity_pack_name: "Org & Operating-Model Design", category: "shared_nontechnical", tower_code: "TWR-01", capability_code: "CAP-002", description: "Organization design and role/RACI definition arising from the initiative." },
  { activity_pack_code: "AP-SHARED-04", activity_pack_name: "Training Design, Content, Delivery & Localization", category: "shared_nontechnical", tower_code: "TWR-19", capability_code: "CAP-097", description: "End-to-end training: curriculum design, content build, delivery, and localization." },
  { activity_pack_code: "AP-SHARED-05", activity_pack_name: "Adoption Support & Measurement", category: "shared_nontechnical", tower_code: "TWR-19", capability_code: "CAP-099", description: "Post-launch adoption support and measurement of usage/behavior-change outcomes." },
  { activity_pack_code: "AP-SHARED-06", activity_pack_name: "Hypercare", category: "shared_nontechnical", tower_code: "TWR-16", capability_code: "CAP-086", description: "Intensive post-go-live stabilization support for a defined hypercare window." },
  { activity_pack_code: "AP-SHARED-07", activity_pack_name: "Program / Project Management", category: "shared_nontechnical", tower_code: "TWR-20", capability_code: "CAP-101", description: "Program/project management, PMO, and delivery governance for the initiative." },
  { activity_pack_code: "AP-SHARED-08", activity_pack_name: "Architecture / Design Authority", category: "shared_nontechnical", tower_code: "TWR-21", capability_code: "CAP-104", description: "Enterprise/solution architecture review and design-authority governance." },
  { activity_pack_code: "AP-SHARED-09", activity_pack_name: "Risk, Security, Compliance & Model Validation Governance", category: "shared_nontechnical", tower_code: "TWR-14", capability_code: "CAP-079", description: "Risk, security, and compliance governance, including model-validation oversight where AI is in scope." },
  { activity_pack_code: "AP-SHARED-10", activity_pack_name: "Financial / Benefits / Value Governance", category: "shared_nontechnical", tower_code: "TWR-20", capability_code: "CAP-141", description: "TBM/FinOps, value management, and benefits-realization governance for the initiative." },
  { activity_pack_code: "AP-SHARED-11", activity_pack_name: "Vendor / Commercial / Supplier Governance", category: "shared_nontechnical", tower_code: "TWR-01", capability_code: "CAP-004", description: "Sourcing strategy and vendor/commercial governance where third-party suppliers are engaged." },
  { activity_pack_code: "AP-SHARED-12", activity_pack_name: "Transition & Knowledge Transfer", category: "shared_nontechnical", tower_code: "TWR-17", capability_code: "CAP-091", description: "Knowledge transfer and transition-to-run activities at the close of the initiative." },
];

const activityPacks: ActivityPackDef[] = [...technicalPacks, ...sharedPacks];
const activityPackCodes = new Set(activityPacks.map((p) => p.activity_pack_code));
const technicalPackCodesByArchetype: Record<ArchetypeCode, string[]> = {
  "ARCH-01": ["AP-TECH-AI-01", "AP-TECH-AI-02", "AP-TECH-AI-03", "AP-TECH-AI-04", "AP-TECH-AI-05"],
  "ARCH-02": ["AP-TECH-DATA-01", "AP-TECH-DATA-02", "AP-TECH-DATA-03", "AP-TECH-DATA-04", "AP-TECH-DATA-05"],
  "ARCH-03": ["AP-TECH-APP-01", "AP-TECH-APP-02", "AP-TECH-APP-03", "AP-TECH-APP-04", "AP-TECH-APP-05"],
  "ARCH-04": ["AP-TECH-CLOUD-01", "AP-TECH-CLOUD-02", "AP-TECH-CLOUD-03", "AP-TECH-INTEG-01", "AP-TECH-INTEG-02"],
  "ARCH-05": ["AP-TECH-PROC-01", "AP-TECH-PROC-02", "AP-TECH-PROC-03", "AP-TECH-PROC-04"],
  "ARCH-06": ["AP-TECH-AMS-01", "AP-TECH-AMS-02", "AP-TECH-AMS-03", "AP-TECH-AMS-04"],
  "ARCH-07": ["AP-TECH-ERP-01", "AP-TECH-ERP-02", "AP-TECH-ERP-03", "AP-TECH-ERP-04", "AP-TECH-ERP-05"],
  "ARCH-08": ["AP-TECH-LEGACY-01", "AP-TECH-LEGACY-02", "AP-TECH-LEGACY-03", "AP-TECH-LEGACY-04"],
};

// ---------------------------------------------------------------------------
// 4. Effort rules + 5. Role mix, per activity pack.
// ---------------------------------------------------------------------------
type Operation =
  | "fixed_hours"
  | "per_unit_hours"
  | "tiered_unit_hours"
  | "percentage_of_selected_labor"
  | "hours_per_week"
  | "hours_per_wave"
  | "hours_per_stakeholder_group"
  | "hours_per_course"
  | "hours_per_training_session"
  | "hours_per_supplier_month"
  | "manual_cost_line";

type Classification = "initiative_specific" | "shared_program" | "reused" | "already_funded" | "out_of_scope";

interface RuleDef {
  activity_pack_code: string;
  rule_code: string;
  operation: Operation;
  driver_code: DriverCode | null;
  parameters: Record<string, unknown>;
  classification: Classification;
  sequence: number;
}

interface RoleMixDef {
  activity_pack_code: string;
  role_code: string;
  allocation_pct: number;
  level_hint: string | null;
}

const rules: RuleDef[] = [];
const roleMix: RoleMixDef[] = [];

function addRule(
  packCode: string,
  ruleSuffix: string,
  operation: Operation,
  driverCode: DriverCode | null,
  parameters: Record<string, unknown>,
  classification: Classification = "initiative_specific",
) {
  const seq = rules.filter((r) => r.activity_pack_code === packCode).length + 1;
  rules.push({
    activity_pack_code: packCode,
    rule_code: `${packCode}-R${ruleSuffix}`,
    operation,
    driver_code: driverCode,
    parameters,
    classification,
    sequence: seq,
  });
}

function addRoleMix(packCode: string, entries: [roleCode: string, pct: number, levelHint?: string][]) {
  for (const [roleCode, pct, levelHint] of entries) {
    roleMix.push({ activity_pack_code: packCode, role_code: roleCode, allocation_pct: pct, level_hint: levelHint ?? null });
  }
}

// --- ARCH-01 AI/automation technical packs -------------------------------
addRule("AP-TECH-AI-01", "1", "fixed_hours", null, { hours: 120 });
addRule("AP-TECH-AI-01", "2", "per_unit_hours", "ai_use_case_count", { unitHours: 24 });
addRoleMix("AP-TECH-AI-01", [["ROL-204", 40], ["ROL-049", 35], ["ROL-047", 25]]);

addRule("AP-TECH-AI-02", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-AI-02", "2", "per_unit_hours", "ai_use_case_count", { unitHours: 180 });
addRoleMix("AP-TECH-AI-02", [["ROL-053", 45], ["ROL-057", 30], ["ROL-197", 25]]);

addRule("AP-TECH-AI-03", "1", "fixed_hours", null, { hours: 160 });
addRule("AP-TECH-AI-03", "2", "per_unit_hours", "model_count", { unitHours: 60 });
addRule("AP-TECH-AI-03", "3", "manual_cost_line", null, {
  costCents: 1_500_000,
  rationale: "Initial LLMOps platform tooling license/setup fee — fixed regardless of scale.",
}, "shared_program");
addRoleMix("AP-TECH-AI-03", [["ROL-055", 50], ["ROL-056", 30], ["ROL-202", 20]]);

addRule("AP-TECH-AI-04", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-TECH-AI-04", "2", "per_unit_hours", "model_count", { unitHours: 20 });
addRoleMix("AP-TECH-AI-04", [["ROL-060", 40], ["ROL-058", 35], ["ROL-059", 25]]);

addRule("AP-TECH-AI-05", "1", "fixed_hours", null, { hours: 40 });
addRule("AP-TECH-AI-05", "2", "per_unit_hours", "automation_count", { unitHours: 50 });
addRoleMix("AP-TECH-AI-05", [["ROL-019", 30], ["ROL-020", 45], ["ROL-173", 25]]);

// --- ARCH-02 Data & analytics technical packs ----------------------------
addRule("AP-TECH-DATA-01", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-TECH-DATA-01", "2", "per_unit_hours", "data_domain_count", { unitHours: 40 });
addRoleMix("AP-TECH-DATA-01", [["ROL-023", 45], ["ROL-022", 25], ["ROL-179", 30]]);

addRule("AP-TECH-DATA-02", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-DATA-02", "2", "per_unit_hours", "data_source_count", { unitHours: 60 });
addRoleMix("AP-TECH-DATA-02", [["ROL-037", 50], ["ROL-176", 30], ["ROL-178", 20]]);

addRule("AP-TECH-DATA-03", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-TECH-DATA-03", "2", "per_unit_hours", "data_domain_count", { unitHours: 30 });
addRoleMix("AP-TECH-DATA-03", [["ROL-026", 40], ["ROL-030", 35], ["ROL-029", 25]]);

addRule("AP-TECH-DATA-04", "1", "fixed_hours", null, { hours: 40 });
addRule("AP-TECH-DATA-04", "2", "per_unit_hours", "report_count", { unitHours: 16 });
addRoleMix("AP-TECH-DATA-04", [["ROL-040", 30], ["ROL-041", 50], ["ROL-042", 20]]);

addRule("AP-TECH-DATA-05", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-DATA-05", "2", "hours_per_wave", "rollout_wave_count", { hoursPerWave: 24 });
addRoleMix("AP-TECH-DATA-05", [["ROL-024", 60], ["ROL-025", 40]]);

// --- ARCH-03 Application technical packs ---------------------------------
addRule("AP-TECH-APP-01", "1", "fixed_hours", null, { hours: 120 });
addRule("AP-TECH-APP-01", "2", "per_unit_hours", "application_count", { unitHours: 40 });
addRoleMix("AP-TECH-APP-01", [["ROL-084", 40], ["ROL-077", 30], ["ROL-078", 30]]);

addRule("AP-TECH-APP-02", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-TECH-APP-02", "2", "per_unit_hours", "application_count", { unitHours: 220 });
addRoleMix("AP-TECH-APP-02", [["ROL-080", 45], ["ROL-083", 30], ["ROL-219", 25]]);

addRule("AP-TECH-APP-03", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-APP-03", "2", "per_unit_hours", "application_count", { unitHours: 160 });
addRoleMix("AP-TECH-APP-03", [["ROL-081", 60], ["ROL-223", 40]]);

addRule("AP-TECH-APP-04", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-TECH-APP-04", "2", "per_unit_hours", "application_count", { unitHours: 200 });
addRoleMix("AP-TECH-APP-04", [["ROL-082", 40], ["ROL-224", 30], ["ROL-225", 30]]);

addRule("AP-TECH-APP-05", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-TECH-APP-05", "2", "per_unit_hours", "test_case_count", { unitHours: 1.5 });
addRoleMix("AP-TECH-APP-05", [["ROL-118", 25], ["ROL-292", 45], ["ROL-120", 30]]);

// --- ARCH-04 Cloud/Integration technical packs ---------------------------
addRule("AP-TECH-CLOUD-01", "1", "fixed_hours", null, { hours: 120 });
addRule("AP-TECH-CLOUD-01", "2", "per_unit_hours", "environment_count", { unitHours: 60 });
addRoleMix("AP-TECH-CLOUD-01", [["ROL-099", 40], ["ROL-272", 35], ["ROL-100", 25]]);

addRule("AP-TECH-CLOUD-02", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-CLOUD-02", "2", "tiered_unit_hours", "environment_count", {
  tiers: [
    { uptoQuantity: 3, unitHours: 90 },
    { uptoQuantity: null, unitHours: 65 },
  ],
});
addRoleMix("AP-TECH-CLOUD-02", [["ROL-104", 40], ["ROL-106", 35], ["ROL-271", 25]]);

addRule("AP-TECH-CLOUD-03", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-TECH-CLOUD-03", "2", "per_unit_hours", "environment_count", { unitHours: 40 });
addRoleMix("AP-TECH-CLOUD-03", [["ROL-107", 45], ["ROL-125", 55]]);

addRule("AP-TECH-INTEG-01", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-INTEG-01", "2", "per_unit_hours", "integration_count", { unitHours: 30 });
addRoleMix("AP-TECH-INTEG-01", [["ROL-085", 55], ["ROL-242", 45]]);

addRule("AP-TECH-INTEG-02", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-TECH-INTEG-02", "2", "per_unit_hours", "integration_count", { unitHours: 70 });
addRoleMix("AP-TECH-INTEG-02", [["ROL-086", 40], ["ROL-087", 35], ["ROL-240", 25]]);

// --- ARCH-05 Process/OpModel technical packs ------------------------------
addRule("AP-TECH-PROC-01", "1", "fixed_hours", null, { hours: 160 });
addRule("AP-TECH-PROC-01", "2", "hours_per_stakeholder_group", "stakeholder_group_count", { hoursPerGroup: 20 });
addRoleMix("AP-TECH-PROC-01", [["ROL-003", 45], ["ROL-001", 20], ["ROL-002", 35]]);

addRule("AP-TECH-PROC-02", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-PROC-02", "2", "per_unit_hours", "process_count", { unitHours: 50 });
addRoleMix("AP-TECH-PROC-02", [["ROL-017", 40], ["ROL-172", 30], ["ROL-175", 30]]);

addRule("AP-TECH-PROC-03", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-TECH-PROC-03", "2", "per_unit_hours", "process_count", { unitHours: 20 });
addRoleMix("AP-TECH-PROC-03", [["ROL-018", 100]]);

addRule("AP-TECH-PROC-04", "1", "fixed_hours", null, { hours: 40 });
addRule("AP-TECH-PROC-04", "2", "per_unit_hours", "automation_count", { unitHours: 55 });
addRoleMix("AP-TECH-PROC-04", [["ROL-019", 30], ["ROL-020", 40], ["ROL-174", 30]]);

// --- ARCH-06 Managed services technical packs -----------------------------
addRule("AP-TECH-AMS-01", "1", "fixed_hours", null, { hours: 120 });
addRule("AP-TECH-AMS-01", "2", "hours_per_supplier_month", "supplier_month_count", { hoursPerSupplierMonth: 8 });
addRoleMix("AP-TECH-AMS-01", [["ROL-303", 40], ["ROL-304", 35], ["ROL-302", 25]]);

addRule("AP-TECH-AMS-02", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-AMS-02", "2", "per_unit_hours", "application_count", { unitHours: 24 });
addRoleMix("AP-TECH-AMS-02", [["ROL-305", 55], ["ROL-127", 45]]);

addRule("AP-TECH-AMS-03", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-TECH-AMS-03", "2", "per_unit_hours", "support_ticket_volume_monthly", { unitHours: 0.6 });
addRoleMix("AP-TECH-AMS-03", [["ROL-126", 20], ["ROL-127", 25], ["ROL-128", 30], ["ROL-129", 25]]);

addRule("AP-TECH-AMS-04", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-TECH-AMS-04", "2", "per_unit_hours", "environment_count", { unitHours: 30 });
addRoleMix("AP-TECH-AMS-04", [["ROL-124", 60], ["ROL-123", 40]]);

// --- ARCH-07 ERP technical packs -------------------------------------------
addRule("AP-TECH-ERP-01", "1", "fixed_hours", null, { hours: 160 });
addRule("AP-TECH-ERP-01", "2", "per_unit_hours", "module_count", { unitHours: 50 });
addRoleMix("AP-TECH-ERP-01", [["ROL-089", 55], ["ROL-252", 45]]);

addRule("AP-TECH-ERP-02", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-TECH-ERP-02", "2", "per_unit_hours", "module_count", { unitHours: 220 });
addRoleMix("AP-TECH-ERP-02", [["ROL-090", 25], ["ROL-243", 30], ["ROL-091", 20], ["ROL-244", 25]]);

addRule("AP-TECH-ERP-03", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-ERP-03", "2", "per_unit_hours", "integration_count", { unitHours: 45 });
addRoleMix("AP-TECH-ERP-03", [["ROL-248", 40], ["ROL-249", 30], ["ROL-251", 30]]);

addRule("AP-TECH-ERP-04", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-TECH-ERP-04", "2", "per_unit_hours", "data_domain_count", { unitHours: 70 });
addRoleMix("AP-TECH-ERP-04", [["ROL-093", 35], ["ROL-037", 65]]);

addRule("AP-TECH-ERP-05", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-TECH-ERP-05", "2", "per_unit_hours", "role_count", { unitHours: 6 });
addRoleMix("AP-TECH-ERP-05", [["ROL-092", 100]]);

// --- ARCH-08 Legacy/mainframe technical packs ------------------------------
addRule("AP-TECH-LEGACY-01", "1", "fixed_hours", null, { hours: 140 });
addRule("AP-TECH-LEGACY-01", "2", "per_unit_hours", "program_count", { unitHours: 8 });
addRoleMix("AP-TECH-LEGACY-01", [["ROL-130", 55], ["ROL-307", 45]]);

addRule("AP-TECH-LEGACY-02", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-TECH-LEGACY-02", "2", "per_unit_hours", "batch_job_count", { unitHours: 20 });
addRoleMix("AP-TECH-LEGACY-02", [["ROL-131", 25], ["ROL-132", 50], ["ROL-308", 25]]);

addRule("AP-TECH-LEGACY-03", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-TECH-LEGACY-03", "2", "per_unit_hours", "batch_job_count", { unitHours: 12 });
addRoleMix("AP-TECH-LEGACY-03", [["ROL-133", 55], ["ROL-306", 45]]);

addRule("AP-TECH-LEGACY-04", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-TECH-LEGACY-04", "2", "per_unit_hours", "application_count", { unitHours: 260 });
addRoleMix("AP-TECH-LEGACY-04", [["ROL-084", 25], ["ROL-080", 75]]);

// --- Shared non-technical packs (12) --------------------------------------
addRule("AP-SHARED-01", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-SHARED-01", "2", "hours_per_stakeholder_group", "stakeholder_group_count", { hoursPerGroup: 16 });
addRoleMix("AP-SHARED-01", [["ROL-134", 55], ["ROL-309", 45]]);

addRule("AP-SHARED-02", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-SHARED-02", "2", "hours_per_stakeholder_group", "stakeholder_group_count", { hoursPerGroup: 8 });
addRoleMix("AP-SHARED-02", [["ROL-136", 100]]);

addRule("AP-SHARED-03", "1", "fixed_hours", null, { hours: 100 });
addRule("AP-SHARED-03", "2", "per_unit_hours", "role_count", { unitHours: 4 });
addRoleMix("AP-SHARED-03", [["ROL-003", 60], ["ROL-317", 40]]);

addRule("AP-SHARED-04", "1", "fixed_hours", null, { hours: 40 });
addRule("AP-SHARED-04", "2", "hours_per_course", "course_count", { hoursPerCourse: 32 });
addRule("AP-SHARED-04", "3", "hours_per_training_session", "training_session_count", { hoursPerSession: 6 });
addRoleMix("AP-SHARED-04", [["ROL-135", 40], ["ROL-310", 60]]);

addRule("AP-SHARED-05", "1", "fixed_hours", null, { hours: 40 });
addRule("AP-SHARED-05", "2", "per_unit_hours", "impacted_user_count", { unitHours: 0.08 });
addRoleMix("AP-SHARED-05", [["ROL-137", 60], ["ROL-311", 40]]);

addRule("AP-SHARED-06", "1", "fixed_hours", null, { hours: 40 });
addRule("AP-SHARED-06", "2", "hours_per_week", "hypercare_week_count", { hoursPerWeek: 60 });
addRoleMix("AP-SHARED-06", [["ROL-140", 30], ["ROL-128", 40], ["ROL-127", 30]]);

addRule("AP-SHARED-07", "1", "fixed_hours", null, { hours: 80 });
addRule("AP-SHARED-07", "2", "percentage_of_selected_labor", null, {
  percentage: 0.12,
  selectionScope: "technical_packs_in_archetype",
});
addRoleMix("AP-SHARED-07", [["ROL-139", 25], ["ROL-140", 35], ["ROL-142", 20], ["ROL-141", 20]]);

addRule("AP-SHARED-08", "1", "fixed_hours", null, { hours: 60 });
addRule(
  "AP-SHARED-08",
  "2",
  "percentage_of_selected_labor",
  null,
  { percentage: 0.08, selectionScope: "technical_packs_in_archetype" },
  "shared_program",
);
addRoleMix("AP-SHARED-08", [["ROL-144", 45], ["ROL-145", 55]]);

addRule("AP-SHARED-09", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-SHARED-09", "2", "percentage_of_selected_labor", null, {
  percentage: 0.06,
  selectionScope: "technical_packs_in_archetype",
});
addRoleMix("AP-SHARED-09", [["ROL-115", 40], ["ROL-116", 35], ["ROL-060", 25]]);

addRule("AP-SHARED-10", "1", "fixed_hours", null, { hours: 60 });
addRule(
  "AP-SHARED-10",
  "2",
  "percentage_of_selected_labor",
  null,
  { percentage: 0.05, selectionScope: "technical_packs_in_archetype" },
  "shared_program",
);
addRoleMix("AP-SHARED-10", [["ROL-322", 35], ["ROL-323", 35], ["ROL-324", 30]]);

addRule("AP-SHARED-11", "1", "fixed_hours", null, { hours: 40 });
addRule("AP-SHARED-11", "2", "hours_per_supplier_month", "supplier_month_count", { hoursPerSupplierMonth: 6 });
addRoleMix("AP-SHARED-11", [["ROL-147", 45], ["ROL-148", 55]]);

addRule("AP-SHARED-12", "1", "fixed_hours", null, { hours: 60 });
addRule("AP-SHARED-12", "2", "per_unit_hours", "application_count", { unitHours: 10 });
addRoleMix("AP-SHARED-12", [["ROL-305", 50], ["ROL-303", 50]]);

// ---------------------------------------------------------------------------
// 6. Archetype -> activity-pack map (technical packs required for their own
//    archetype; all 12 shared packs mapped to all 8 archetypes except two
//    documented exclusions).
// ---------------------------------------------------------------------------
interface MapDef {
  archetype_code: ArchetypeCode;
  activity_pack_code: string;
  applicability: "required" | "conditional" | "excluded";
  notes: string | null;
}
const archetypeActivityMap: MapDef[] = [];

for (const archetype of archetypes) {
  const code = archetype.archetype_code as ArchetypeCode;
  for (const packCode of technicalPackCodesByArchetype[code]) {
    archetypeActivityMap.push({ archetype_code: code, activity_pack_code: packCode, applicability: "required", notes: null });
  }
  for (const shared of sharedPacks) {
    let applicability: MapDef["applicability"] = "required";
    let notes: string | null = null;
    if (shared.activity_pack_code === "AP-SHARED-11" ) {
      if (code === "ARCH-06") {
        applicability = "required";
        notes = "Sourcing/vendor governance is the core subject of a managed-services transition.";
      } else if (code === "ARCH-05") {
        applicability = "excluded";
        notes = "A pure internal operating-model/process transformation is assumed to carry no third-party sourcing relationship in scope; include explicitly if the real Move engages an outside vendor.";
      } else {
        applicability = "conditional";
        notes = "Applies only when a third-party vendor/SI is engaged for delivery; excluded for a fully internally-delivered initiative.";
      }
    }
    if (shared.activity_pack_code === "AP-SHARED-06" && code === "ARCH-05") {
      applicability = "excluded";
      notes = "A pure organizational/process-design transformation with no technical cutover event has no hypercare window; include explicitly if a technical go-live is later added to scope.";
    }
    archetypeActivityMap.push({ archetype_code: code, activity_pack_code: shared.activity_pack_code, applicability, notes });
  }
}

// ---------------------------------------------------------------------------
// 7. Range policies (brief §7.8) — deterministic score -> multiplier band.
// ---------------------------------------------------------------------------
const rangePolicies = [
  { policy_code: "RANGE-TIGHT", policy_name: "Tight (high confidence)", min_score: 0, max_score: 2, low_multiplier: 0.9, high_multiplier: 1.15, description: "Mature scope, strong evidence, low novelty, low quantity uncertainty, high rate-card coverage." },
  { policy_code: "RANGE-STANDARD", policy_name: "Standard", min_score: 3, max_score: 5, low_multiplier: 0.75, high_multiplier: 1.35, description: "Typical planning-stage confidence across the five input dimensions." },
  { policy_code: "RANGE-WIDE", policy_name: "Wide", min_score: 6, max_score: 8, low_multiplier: 0.6, high_multiplier: 1.6, description: "Meaningful scope/evidence/novelty/quantity/coverage uncertainty; early-stage estimate." },
  { policy_code: "RANGE-VERY-WIDE", policy_name: "Very Wide (early/low confidence)", min_score: 9, max_score: 10, low_multiplier: 0.45, high_multiplier: 2.0, description: "Highest uncertainty across all five dimensions; very early planning horizon." },
] as const;

// ---------------------------------------------------------------------------
// 8. Agent costs (brief §7.9 AI-accelerated scenario cost assumptions).
// ---------------------------------------------------------------------------
const agentCosts = [
  { agent_cost_code: "AGT-001", cost_key: "ai_platform_license_monthly_usd", applies_to_archetype_code: "ARCH-01", cost_value: 8000, unit: "USD/month", description: "Ongoing GenAI/agent platform license fee for the duration of build + hypercare." },
  { agent_cost_code: "AGT-002", cost_key: "agent_compute_per_use_case_usd", applies_to_archetype_code: "ARCH-01", cost_value: 1200, unit: "USD/AI use case", description: "One-time inference/compute provisioning cost per AI use case brought to production." },
  { agent_cost_code: "AGT-003", cost_key: "coding_copilot_seat_monthly_usd", applies_to_archetype_code: null, cost_value: 45, unit: "USD/engineer-seat/month", description: "AI coding-assistant seat license, applicable to any archetype with an engineering build activity." },
  { agent_cost_code: "AGT-004", cost_key: "data_pipeline_ai_assist_monthly_usd", applies_to_archetype_code: "ARCH-02", cost_value: 2500, unit: "USD/month", description: "AI-assisted data-pipeline authoring/testing tooling license." },
  { agent_cost_code: "AGT-005", cost_key: "test_generation_ai_assist_monthly_usd", applies_to_archetype_code: null, cost_value: 1800, unit: "USD/month", description: "AI-assisted test-case generation tooling license, applicable wherever quality engineering is in scope." },
  { agent_cost_code: "AGT-006", cost_key: "legacy_code_translation_ai_assist_monthly_usd", applies_to_archetype_code: "ARCH-08", cost_value: 3200, unit: "USD/month", description: "AI-assisted COBOL-to-target-language translation tooling license." },
] as const;

// ---------------------------------------------------------------------------
// Cross-reference validation — fail loudly rather than write inconsistent CSVs.
// ---------------------------------------------------------------------------
function assertCrossReferences() {
  const driverCodes = new Set(drivers.map((d) => d.driver_code));
  for (const rule of rules) {
    if (!activityPackCodes.has(rule.activity_pack_code)) {
      throw new Error(`Effort rule ${rule.rule_code} references unknown activity_pack_code ${rule.activity_pack_code}`);
    }
    if (rule.driver_code && !driverCodes.has(rule.driver_code)) {
      throw new Error(`Effort rule ${rule.rule_code} references unknown driver_code ${rule.driver_code}`);
    }
  }
  for (const rm of roleMix) {
    if (!activityPackCodes.has(rm.activity_pack_code)) {
      throw new Error(`Role mix row references unknown activity_pack_code ${rm.activity_pack_code}`);
    }
  }
  for (const m of archetypeActivityMap) {
    if (!activityPackCodes.has(m.activity_pack_code)) {
      throw new Error(`Archetype map row references unknown activity_pack_code ${m.activity_pack_code}`);
    }
  }
  for (const pack of activityPacks) {
    const hasRoleMix = roleMix.some((rm) => rm.activity_pack_code === pack.activity_pack_code);
    const hasRules = rules.some((r) => r.activity_pack_code === pack.activity_pack_code);
    if (!hasRoleMix) throw new Error(`Activity pack ${pack.activity_pack_code} has no role mix rows`);
    if (!hasRules) throw new Error(`Activity pack ${pack.activity_pack_code} has no effort rules`);
  }
  // Every archetype's role-mix roles must sum close to 100% per pack (sanity, not a hard 100.00 requirement).
  const byPack = new Map<string, number>();
  for (const rm of roleMix) {
    byPack.set(rm.activity_pack_code, (byPack.get(rm.activity_pack_code) ?? 0) + rm.allocation_pct);
  }
  for (const [packCode, total] of byPack) {
    if (total < 95 || total > 105) {
      throw new Error(`Activity pack ${packCode} role-mix allocation sums to ${total}%, expected ~100%`);
    }
  }
}
assertCrossReferences();

// ---------------------------------------------------------------------------
// Write CSVs
// ---------------------------------------------------------------------------
function withSource<T extends Record<string, unknown>>(rows: readonly T[]): (T & { source_artifact: string; status: string })[] {
  return rows.map((r) => ({ ...r, source_artifact: SOURCE, status: "active" }));
}

const outDir = path.resolve(__dirname, "..", "..", "datasets", "reference", "pricing-engine-v1");

writeCsv(
  path.join(outDir, "pricing_archetypes.csv"),
  ["archetype_code", "archetype_name", "description", "source_artifact", "status"],
  withSource(archetypes as unknown as Record<string, unknown>[]),
);

writeCsv(
  path.join(outDir, "pricing_activity_packs.csv"),
  ["activity_pack_code", "activity_pack_name", "category", "tower_code", "capability_code", "description", "source_artifact", "status"],
  withSource(activityPacks as unknown as Record<string, unknown>[]),
);

writeCsv(
  path.join(outDir, "pricing_effort_drivers.csv"),
  ["driver_code", "driver_name", "unit_label", "description", "source_artifact", "status"],
  withSource(drivers as unknown as Record<string, unknown>[]),
);

writeCsv(
  path.join(outDir, "pricing_effort_rules.csv"),
  ["activity_pack_code", "rule_code", "operation", "driver_code", "parameters", "classification", "sequence", "source_artifact", "status"],
  withSource(
    rules.map((r) => ({ ...r, driver_code: r.driver_code ?? "", parameters: JSON.stringify(r.parameters) })) as unknown as Record<
      string,
      unknown
    >[],
  ),
);

writeCsv(
  path.join(outDir, "pricing_activity_role_mix.csv"),
  ["activity_pack_code", "role_code", "allocation_pct", "level_hint", "source_artifact", "status"],
  withSource(roleMix.map((rm) => ({ ...rm, level_hint: rm.level_hint ?? "" })) as unknown as Record<string, unknown>[]),
);

writeCsv(
  path.join(outDir, "pricing_archetype_activity_map.csv"),
  ["archetype_code", "activity_pack_code", "applicability", "notes", "source_artifact", "status"],
  withSource(archetypeActivityMap.map((m) => ({ ...m, notes: m.notes ?? "" })) as unknown as Record<string, unknown>[]),
);

writeCsv(
  path.join(outDir, "pricing_range_policies.csv"),
  ["policy_code", "policy_name", "min_score", "max_score", "low_multiplier", "high_multiplier", "description", "source_artifact", "status"],
  withSource(rangePolicies as unknown as Record<string, unknown>[]),
);

writeCsv(
  path.join(outDir, "pricing_agent_costs.csv"),
  ["agent_cost_code", "cost_key", "applies_to_archetype_code", "cost_value", "unit", "description", "source_artifact", "status"],
  withSource(agentCosts.map((a) => ({ ...a, applies_to_archetype_code: a.applies_to_archetype_code ?? "" })) as unknown as Record<
    string,
    unknown
  >[]),
);

console.log(
  JSON.stringify(
    {
      archetypes: archetypes.length,
      activityPacksTechnical: technicalPacks.length,
      activityPacksShared: sharedPacks.length,
      activityPacksTotal: activityPacks.length,
      effortDrivers: drivers.length,
      effortRules: rules.length,
      roleMixRows: roleMix.length,
      archetypeActivityMapRows: archetypeActivityMap.length,
      rangePolicies: rangePolicies.length,
      agentCosts: agentCosts.length,
    },
    null,
    2,
  ),
);
