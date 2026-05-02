export type SetupAiInitiativeArchetype =
  | "copilot_rollout"
  | "agent_rollout"
  | "vendor_ai_feature"
  | "internal_build"
  | "abarva_program";
export type SetupAiInitiativeStatus =
  | "planning"
  | "active"
  | "at-risk"
  | "realizing"
  | "settled"
  | "paused"
  | "canceled";

export interface SetupAiInitiativeOutcome {
  name: string;
  targetValue: string;
  unit: string;
  targetDate: string;
}
export interface SetupAiInitiativeSignal {
  outcomeName: string;
  currentValue: string;
  asOfDate: string;
  source: string;
}
export interface SetupAiInitiativeRiskSignal {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  raisedAt: string;
  raisedBy: string;
}
export interface SetupAiInitiativeDirectionalSummary {
  budget: string;
  spend: string;
  value: string;
  trajectory: "improving" | "stable" | "watch" | "at_risk";
}
export interface SetupAiInitiativeEvidenceLink {
  label: string;
  href: string;
  sourceType:
    | "program"
    | "workshop"
    | "architecture"
    | "vendor"
    | "metric"
    | "minutes";
}
export interface SetupAiInitiativeRecord {
  initiativeId: string;
  tenantKey: string;
  clientId: string;
  name: string;
  archetype: SetupAiInitiativeArchetype;
  sponsorRole: string;
  ownerRole: string;
  sponsorUserId?: string | null;
  ownerUserId?: string | null;
  vendor?: string | null;
  parentProduct?: string | null;
  internalTeam?: string | null;
  status: SetupAiInitiativeStatus;
  linkedProgramId?: string | null;
  startedAt: string;
  targetOutcomes: readonly SetupAiInitiativeOutcome[];
  realizedSignals: readonly SetupAiInitiativeSignal[];
  riskSignals: readonly SetupAiInitiativeRiskSignal[];
  budgetAmount?: number | null;
  spendToDate?: number | null;
  directionalSummary: SetupAiInitiativeDirectionalSummary;
  evidenceLinks: readonly SetupAiInitiativeEvidenceLink[];
  tags: readonly string[];
  visibility: {
    personaDefault: "cxo" | "admin" | "operator";
    readGroups: readonly string[];
    writeGroups: readonly string[];
  };
  source:
    | "demo_fixture"
    | "setup_upload"
    | "program_sync"
    | "manual_entry"
    | "private_data_plane";
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}
export interface SetupAiInitiativeSummary {
  tenantKey: string;
  total: number;
  atRisk: number;
  activeOrRealizing: number;
  linkedPrograms: number;
  stale: number;
  archetypeCounts: Record<SetupAiInitiativeArchetype, number>;
  statusCounts: Record<SetupAiInitiativeStatus, number>;
}
export interface SetupAiInitiativeFilters {
  status?: readonly SetupAiInitiativeStatus[];
  archetype?: readonly SetupAiInitiativeArchetype[];
  updatedSince?: string | null;
  includeProgramLinks?: boolean;
  financialVisibility?: boolean;
}

const TENANT_ALIASES: Record<string, string> = {
  apexretail: "apex-retail",
  "apex-retail": "apex-retail",
  "apex-retail-group": "apex-retail",
  meridian: "meridian-health",
  meridianhealth: "meridian-health",
  "meridian-health": "meridian-health",
  arcturus: "first-capital",
  "arcturus-financial": "first-capital",
  "arcturus-financial-group": "first-capital",
  firstcapital: "first-capital",
  "first-capital": "first-capital",
};
const ARCHETYPES: readonly SetupAiInitiativeArchetype[] = [
  "copilot_rollout",
  "agent_rollout",
  "vendor_ai_feature",
  "internal_build",
  "abarva_program",
] as const;
const STATUSES: readonly SetupAiInitiativeStatus[] = [
  "planning",
  "active",
  "at-risk",
  "realizing",
  "settled",
  "paused",
  "canceled",
] as const;
const VISIBILITY = {
  personaDefault: "admin",
  readGroups: ["tenant-admin", "programs", "source", "tower"],
  writeGroups: ["tenant-admin", "initiative-owner"],
} as const;

function o(
  name: string,
  targetValue: string,
  unit: string,
  targetDate: string,
): SetupAiInitiativeOutcome {
  return { name, targetValue, unit, targetDate };
}
function s(
  outcomeName: string,
  currentValue: string,
  source: string,
): SetupAiInitiativeSignal {
  return { outcomeName, currentValue, asOfDate: "2026-05-01", source };
}
function r(
  type: string,
  severity: SetupAiInitiativeRiskSignal["severity"],
  description: string,
): SetupAiInitiativeRiskSignal {
  return {
    type,
    severity,
    description,
    raisedAt: "2026-05-02",
    raisedBy: "Steward",
  };
}
function d(
  trajectory: SetupAiInitiativeDirectionalSummary["trajectory"],
  budget: string,
  spend: string,
  value: string,
): SetupAiInitiativeDirectionalSummary {
  return { trajectory, budget, spend, value };
}
function e(
  label: string,
  sourceType: SetupAiInitiativeEvidenceLink["sourceType"],
): SetupAiInitiativeEvidenceLink {
  return {
    label,
    sourceType,
    href: `abarva://setup/evidence/${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  };
}
function initiative(
  input: Omit<
    SetupAiInitiativeRecord,
    "visibility" | "source" | "lastUpdatedAt" | "lastUpdatedBy"
  > &
    Partial<
      Pick<
        SetupAiInitiativeRecord,
        "source" | "lastUpdatedAt" | "lastUpdatedBy"
      >
    >,
): SetupAiInitiativeRecord {
  return {
    visibility: VISIBILITY,
    source: "demo_fixture",
    lastUpdatedAt: "2026-05-01T18:00:00Z",
    lastUpdatedBy: "codex-demo-fixture",
    ...input,
  };
}
export const SETUP_AI_INITIATIVE_FIXTURES: readonly SetupAiInitiativeRecord[] =
  [
    initiative({
      initiativeId: "apex-aii-copilot-store-ops",
      tenantKey: "apex-retail",
      clientId: "apex-retail",
      name: "Store Operations Copilot Rollout",
      archetype: "copilot_rollout",
      sponsorRole: "Chief Stores Officer",
      ownerRole: "Director, Store Product Operations",
      vendor: "Microsoft",
      parentProduct: "M365 Copilot",
      status: "active",
      startedAt: "2026-02-12",
      targetOutcomes: [
        o("manager adoption", "72", "% weekly users", "2026-09-30"),
      ],
      realizedSignals: [s("manager adoption", "41%", "Setup KPI upload")],
      riskSignals: [
        r(
          "adoption_variance",
          "medium",
          "Regional managers report uneven prompt literacy and no common use-case catalog.",
        ),
      ],
      budgetAmount: 780000,
      spendToDate: 215000,
      directionalSummary: d(
        "watch",
        "material platform commitment",
        "early ramp spend",
        "adoption signal exists but operating-model value is not yet repeatable",
      ),
      evidenceLinks: [
        e("Apex store ops workshop minutes", "workshop"),
        e("PAT-MET retail adoption baselines", "metric"),
      ],
      tags: ["store-ops", "productivity", "frontline"],
    }),
    initiative({
      initiativeId: "apex-aii-demand-agent",
      tenantKey: "apex-retail",
      clientId: "apex-retail",
      name: "Demand Forecast Exception Agent",
      archetype: "agent_rollout",
      sponsorRole: "SVP, Supply Chain",
      ownerRole: "Director, Enterprise Data Products",
      vendor: "AbarVa / Internal",
      status: "at-risk",
      linkedProgramId: "apex-demand-forecast-modernization",
      startedAt: "2026-01-21",
      targetOutcomes: [
        o("forecast override effort", "25", "% reduction", "2026-12-15"),
      ],
      realizedSignals: [
        s(
          "forecast override effort",
          "measurement gap",
          "No trusted process-mining feed",
        ),
      ],
      riskSignals: [
        r(
          "data_foundation",
          "high",
          "Promotion rules depend on SKU-store availability and margin signals split across ERP and planning tools.",
        ),
      ],
      budgetAmount: 1250000,
      spendToDate: 390000,
      directionalSummary: d(
        "at_risk",
        "large strategic bet",
        "meaningful discovery spend",
        "value depends on resolving data-grain and governance gaps",
      ),
      evidenceLinks: [
        e("Apex supply-chain architecture notes", "architecture"),
        e("Program P1 decision brief", "program"),
      ],
      tags: ["supply-chain", "forecasting", "agentic-ai"],
      source: "program_sync",
    }),
    initiative({
      initiativeId: "apex-aii-einstein-merchandising",
      tenantKey: "apex-retail",
      clientId: "apex-retail",
      name: "Einstein Merchandising Recommendations",
      archetype: "vendor_ai_feature",
      sponsorRole: "Chief Digital Officer",
      ownerRole: "Director, Digital Product Delivery",
      vendor: "Salesforce",
      parentProduct: "Commerce Cloud Einstein",
      status: "realizing",
      startedAt: "2025-11-04",
      targetOutcomes: [
        o("personalized conversion lift", "4", "%", "2026-08-31"),
      ],
      realizedSignals: [
        s(
          "personalized conversion lift",
          "2.1% directional lift",
          "Digital analytics export",
        ),
      ],
      riskSignals: [
        r(
          "measurement_design",
          "medium",
          "Incrementality is not consistently separated from campaign seasonality.",
        ),
      ],
      budgetAmount: 420000,
      spendToDate: 280000,
      directionalSummary: d(
        "improving",
        "moderate vendor feature investment",
        "tracking within expected ramp",
        "commercial signal is positive but attribution needs tightening",
      ),
      evidenceLinks: [e("Apex ecommerce KPI upload", "metric")],
      tags: ["commerce", "personalization", "salesforce"],
    }),
    initiative({
      initiativeId: "apex-aii-customer-data-rag",
      tenantKey: "apex-retail",
      clientId: "apex-retail",
      name: "Customer Data Product RAG Pilot",
      archetype: "internal_build",
      sponsorRole: "Chief Data Officer",
      ownerRole: "Director, Enterprise Data Products",
      internalTeam: "Customer Data Platform",
      status: "planning",
      startedAt: "2026-03-18",
      targetOutcomes: [
        o("analyst research cycle time", "30", "% reduction", "2026-11-30"),
      ],
      realizedSignals: [
        s(
          "analyst research cycle time",
          "baseline pending",
          "Workshop action log",
        ),
      ],
      riskSignals: [
        r(
          "security_review",
          "medium",
          "PII redaction and data-retention control design is not yet approved.",
        ),
      ],
      budgetAmount: 610000,
      spendToDate: 85000,
      directionalSummary: d(
        "stable",
        "funded discovery",
        "low early build spend",
        "promising but cannot scale before privacy guardrails are signed off",
      ),
      evidenceLinks: [e("Apex CDP RAG architecture sketch", "architecture")],
      tags: ["cdp", "rag", "privacy"],
    }),
    initiative({
      initiativeId: "apex-aii-source-value-agent",
      tenantKey: "apex-retail",
      clientId: "apex-retail",
      name: "Source Value Tracking Agent",
      archetype: "abarva_program",
      sponsorRole: "Chief Procurement Officer",
      ownerRole: "Director, IT Procurement",
      vendor: "AbarVa",
      status: "active",
      linkedProgramId: "apex-source-value-tracking",
      startedAt: "2026-04-02",
      targetOutcomes: [
        o(
          "sourcing savings leakage",
          "12",
          "% leakage reduction",
          "2026-12-31",
        ),
      ],
      realizedSignals: [
        s(
          "sourcing savings leakage",
          "measurement gap",
          "No value ledger baseline",
        ),
      ],
      riskSignals: [
        r(
          "value_realization",
          "high",
          "Savings commitments are not consistently tied to contract-stage evidence and owner handoff.",
        ),
      ],
      budgetAmount: 900000,
      spendToDate: 150000,
      directionalSummary: d(
        "watch",
        "strategic procurement platform bet",
        "controlled early spend",
        "value capture depends on Source-to-Tower handoff discipline",
      ),
      evidenceLinks: [
        e("Apex source event minutes", "minutes"),
        e("Source value ledger gap", "metric"),
      ],
      tags: ["source", "procurement", "value"],
      source: "program_sync",
    }),
    initiative({
      initiativeId: "meridian-aii-epic-ambient",
      tenantKey: "meridian-health",
      clientId: "meridian-health",
      name: "Epic Ambient Documentation Expansion",
      archetype: "vendor_ai_feature",
      sponsorRole: "Chief Medical Information Officer",
      ownerRole: "Director, Clinical Product Operations",
      vendor: "Epic",
      parentProduct: "Epic ambient clinical documentation",
      status: "active",
      startedAt: "2026-01-09",
      targetOutcomes: [
        o("clinician pajama time", "20", "% reduction", "2026-10-31"),
        o("note closure", "85", "% same-day closure", "2026-10-31"),
      ],
      realizedSignals: [
        s(
          "clinician pajama time",
          "directional reduction",
          "Clinical workshop minutes",
        ),
      ],
      riskSignals: [
        r(
          "clinical_adoption",
          "medium",
          "Specialty-by-specialty workflows need separate acceptance criteria and coding review.",
        ),
      ],
      budgetAmount: 1420000,
      spendToDate: 510000,
      directionalSummary: d(
        "improving",
        "large clinical enablement investment",
        "ramping with rollout",
        "clinician value is visible but coding-quality controls must mature",
      ),
      evidenceLinks: [
        e("Meridian CMIO workshop notes", "workshop"),
        e("Epic workflow architecture input", "architecture"),
      ],
      tags: ["epic", "clinician-experience", "documentation"],
    }),
    initiative({
      initiativeId: "meridian-aii-prior-auth-agent",
      tenantKey: "meridian-health",
      clientId: "meridian-health",
      name: "Prior Authorization Intake Agent",
      archetype: "agent_rollout",
      sponsorRole: "Chief Revenue Cycle Officer",
      ownerRole: "Director, RCM Innovation",
      vendor: "ServiceNow / Internal",
      status: "at-risk",
      linkedProgramId: "meridian-prior-auth-modernization",
      startedAt: "2026-02-01",
      targetOutcomes: [
        o(
          "clean prior-auth packets",
          "90",
          "% complete at first submission",
          "2026-11-30",
        ),
      ],
      realizedSignals: [
        s("clean prior-auth packets", "63% baseline", "RCM KPI upload"),
      ],
      riskSignals: [
        r(
          "workflow_variation",
          "high",
          "Payer-specific rules and specialty documentation variance are not encoded in the intake taxonomy.",
        ),
      ],
      budgetAmount: 1680000,
      spendToDate: 445000,
      directionalSummary: d(
        "at_risk",
        "large RCM automation bet",
        "meaningful discovery and integration spend",
        "cost-to-collect benefit depends on payer-rule and clinical documentation depth",
      ),
      evidenceLinks: [
        e("Prior auth workshop minutes", "workshop"),
        e("RCM integration architecture", "architecture"),
      ],
      tags: ["prior-auth", "rcm", "payer"],
      source: "program_sync",
    }),
    initiative({
      initiativeId: "meridian-aii-coding-accuracy",
      tenantKey: "meridian-health",
      clientId: "meridian-health",
      name: "Coding Accuracy AI Review",
      archetype: "internal_build",
      sponsorRole: "VP, Revenue Integrity",
      ownerRole: "Director, Data and Analytics",
      internalTeam: "Revenue Analytics",
      status: "planning",
      startedAt: "2026-03-05",
      targetOutcomes: [o("coding rework", "18", "% reduction", "2026-12-31")],
      realizedSignals: [
        s("coding rework", "baseline pending", "Coding sample design"),
      ],
      riskSignals: [
        r(
          "clinical_validation",
          "high",
          "Coder and physician advisor validation loop is not yet staffed.",
        ),
      ],
      budgetAmount: 980000,
      spendToDate: 115000,
      directionalSummary: d(
        "watch",
        "targeted revenue-integrity investment",
        "low early build spend",
        "value could be material if clinical validation and denial taxonomy are strong",
      ),
      evidenceLinks: [
        e("Coding accuracy discovery notes", "minutes"),
        e("PAT-MET denial metrics", "metric"),
      ],
      tags: ["coding", "denials", "revenue-integrity"],
    }),
    initiative({
      initiativeId: "meridian-aii-vbc-care-gap",
      tenantKey: "meridian-health",
      clientId: "meridian-health",
      name: "Value-Based Care Gap Closure Copilot",
      archetype: "copilot_rollout",
      sponsorRole: "Chief Population Health Officer",
      ownerRole: "Director, Digital Product Management",
      vendor: "Microsoft",
      parentProduct: "M365 Copilot + Epic reporting",
      status: "realizing",
      startedAt: "2025-12-12",
      targetOutcomes: [
        o("care-gap outreach completion", "15", "% improvement", "2026-09-30"),
      ],
      realizedSignals: [
        s(
          "care-gap outreach completion",
          "7% directional improvement",
          "Population health scorecard",
        ),
      ],
      riskSignals: [
        r(
          "equity_measurement",
          "medium",
          "Outreach lift is not yet segmented by payer, geography, or risk cohort.",
        ),
      ],
      budgetAmount: 620000,
      spendToDate: 315000,
      directionalSummary: d(
        "improving",
        "moderate enablement spend",
        "within expected ramp",
        "VBC signal is positive but equity and payer segmentation need depth",
      ),
      evidenceLinks: [e("VBC care gap workshop", "workshop")],
      tags: ["vbc", "population-health", "copilot"],
    }),
    initiative({
      initiativeId: "meridian-aii-data-platform",
      tenantKey: "meridian-health",
      clientId: "meridian-health",
      name: "Clinical Analytics Data Platform Modernization",
      archetype: "abarva_program",
      sponsorRole: "VP, Data and Analytics",
      ownerRole: "Director, IT Procurement",
      vendor: "AbarVa",
      status: "active",
      linkedProgramId: "meridian-clinical-analytics-modernization",
      startedAt: "2026-04-10",
      targetOutcomes: [
        o(
          "trusted analytics domains",
          "6",
          "domains operational",
          "2027-01-31",
        ),
      ],
      realizedSignals: [
        s(
          "trusted analytics domains",
          "2 domains in design",
          "Architecture workshop",
        ),
      ],
      riskSignals: [
        r(
          "source_system_depth",
          "high",
          "Epic, claims, RCM, and scheduling semantic ownership is not yet mapped to data-product owners.",
        ),
      ],
      budgetAmount: 3100000,
      spendToDate: 240000,
      directionalSummary: d(
        "watch",
        "enterprise data foundation bet",
        "early planning spend",
        "AI strategy credibility depends on source-system semantics and ownership",
      ),
      evidenceLinks: [
        e("Meridian analytics modernization architecture", "architecture"),
        e("Epic source-system notes", "workshop"),
      ],
      tags: ["analytics", "epic", "data-platform"],
      source: "program_sync",
    }),
    initiative({
      initiativeId: "firstcapital-aii-contact-center-agent",
      tenantKey: "first-capital",
      clientId: "first-capital",
      name: "Commercial Banking Contact Center Agent",
      archetype: "agent_rollout",
      sponsorRole: "Head of Commercial Banking",
      ownerRole: "Director, Digital Product Management",
      vendor: "Salesforce",
      parentProduct: "Service Cloud / Einstein",
      status: "active",
      startedAt: "2026-01-15",
      targetOutcomes: [
        o("case containment", "18", "% self-service containment", "2026-11-30"),
      ],
      realizedSignals: [
        s(
          "case containment",
          "9% early containment",
          "Service Cloud dashboard",
        ),
      ],
      riskSignals: [
        r(
          "conduct_risk",
          "medium",
          "Disclosure handling and escalation paths need compliance-approved guardrails.",
        ),
      ],
      budgetAmount: 1380000,
      spendToDate: 470000,
      directionalSummary: d(
        "watch",
        "large customer-service bet",
        "tracking near planned ramp",
        "service value exists but conduct-risk controls must be demonstrable",
      ),
      evidenceLinks: [e("First Capital contact-center workshop", "workshop")],
      tags: ["commercial-banking", "contact-center", "conduct-risk"],
    }),
    initiative({
      initiativeId: "firstcapital-aii-fraud-rag",
      tenantKey: "first-capital",
      clientId: "first-capital",
      name: "Fraud Investigation Knowledge Assistant",
      archetype: "internal_build",
      sponsorRole: "Chief Risk Officer",
      ownerRole: "Director, Payments Program Management",
      internalTeam: "Financial Crimes Analytics",
      status: "at-risk",
      linkedProgramId: "firstcapital-fraud-knowledge-modernization",
      startedAt: "2026-02-20",
      targetOutcomes: [
        o("investigation cycle time", "22", "% reduction", "2026-12-31"),
      ],
      realizedSignals: [
        s(
          "evidence citation completeness",
          "measurement gap",
          "Model audit not connected",
        ),
      ],
      riskSignals: [
        r(
          "model_risk",
          "high",
          "Evidence lineage, retention class, and human-review thresholds are not yet approved by model risk.",
        ),
      ],
      budgetAmount: 1850000,
      spendToDate: 360000,
      directionalSummary: d(
        "at_risk",
        "strategic risk-operations investment",
        "meaningful foundation spend",
        "cannot progress without model-risk evidence and auditability",
      ),
      evidenceLinks: [
        e("Fraud RAG model risk notes", "minutes"),
        e("Investigation data architecture", "architecture"),
      ],
      tags: ["fraud", "rag", "model-risk"],
      source: "program_sync",
    }),
    initiative({
      initiativeId: "firstcapital-aii-copilot-risk-controls",
      tenantKey: "first-capital",
      clientId: "first-capital",
      name: "Copilot Risk Controls Rollout",
      archetype: "copilot_rollout",
      sponsorRole: "Chief Information Security Officer",
      ownerRole: "Director, IT Sourcing",
      vendor: "Microsoft",
      parentProduct: "M365 Copilot",
      status: "planning",
      startedAt: "2026-03-07",
      targetOutcomes: [
        o("approved use-case coverage", "12", "use cases", "2026-08-31"),
      ],
      realizedSignals: [
        s(
          "approved use-case coverage",
          "5 use cases drafted",
          "Security workshop minutes",
        ),
      ],
      riskSignals: [
        r(
          "data_loss_prevention",
          "medium",
          "DLP exceptions and customer-data handling taxonomy are not yet approved.",
        ),
      ],
      budgetAmount: 760000,
      spendToDate: 95000,
      directionalSummary: d(
        "stable",
        "moderate productivity investment",
        "low early spend",
        "safe rollout depends on DLP and approved-use-case controls",
      ),
      evidenceLinks: [e("Copilot security control workshop", "workshop")],
      tags: ["copilot", "security", "dlp"],
    }),
    initiative({
      initiativeId: "firstcapital-aii-core-payments-ai",
      tenantKey: "first-capital",
      clientId: "first-capital",
      name: "Core Payments Exception Triage",
      archetype: "vendor_ai_feature",
      sponsorRole: "Chief Product Officer, Digital Banking",
      ownerRole: "Director, Payments Program Management",
      vendor: "FIS",
      parentProduct: "Payments exception management",
      status: "realizing",
      startedAt: "2025-10-18",
      targetOutcomes: [
        o("manual exception review", "16", "% reduction", "2026-09-30"),
      ],
      realizedSignals: [
        s(
          "manual exception review",
          "11% directional reduction",
          "Payments ops scorecard",
        ),
      ],
      riskSignals: [
        r(
          "operational_resilience",
          "medium",
          "Fallback procedures for high-value exceptions are not fully rehearsed.",
        ),
      ],
      budgetAmount: 540000,
      spendToDate: 330000,
      directionalSummary: d(
        "improving",
        "targeted vendor-feature investment",
        "within expected ramp",
        "operations value is emerging but resilience evidence is thin",
      ),
      evidenceLinks: [e("Payments exception workshop", "workshop")],
      tags: ["payments", "operations", "resilience"],
    }),
    initiative({
      initiativeId: "firstcapital-aii-source-risk-intel",
      tenantKey: "first-capital",
      clientId: "first-capital",
      name: "Third-Party Risk Intelligence Program",
      archetype: "abarva_program",
      sponsorRole: "Chief Procurement Officer",
      ownerRole: "Director, IT Sourcing",
      vendor: "AbarVa",
      status: "active",
      linkedProgramId: "firstcapital-third-party-risk-intel",
      startedAt: "2026-04-06",
      targetOutcomes: [
        o(
          "critical vendor risk reviews",
          "100",
          "% evidence-backed",
          "2026-12-31",
        ),
      ],
      realizedSignals: [
        s(
          "critical vendor risk reviews",
          "baseline pending",
          "Source event handoff",
        ),
      ],
      riskSignals: [
        r(
          "third_party_risk",
          "high",
          "Risk acceptance, sourcing evidence, and control-owner signoff are not yet unified.",
        ),
      ],
      budgetAmount: 1120000,
      spendToDate: 180000,
      directionalSummary: d(
        "watch",
        "strategic third-party-risk investment",
        "controlled early spend",
        "success depends on Source evidence and risk-control ownership converging",
      ),
      evidenceLinks: [e("Third-party risk sourcing notes", "minutes")],
      tags: ["source", "third-party-risk", "controls"],
      source: "program_sync",
    }),
  ] as const;

export function normalizeSetupAiInitiativeTenantKey(
  tenantKey: string | null | undefined,
): string {
  const key = (tenantKey ?? "").trim().toLowerCase().replace(/_/g, "-");
  return TENANT_ALIASES[key] ?? key;
}
export function isSetupAiInitiativeArchetype(
  value: string,
): value is SetupAiInitiativeArchetype {
  return (ARCHETYPES as readonly string[]).includes(value);
}
export function isSetupAiInitiativeStatus(
  value: string,
): value is SetupAiInitiativeStatus {
  return (STATUSES as readonly string[]).includes(value);
}
export function parseSetupAiInitiativeList<T extends string>(
  raw: string | null,
  guard: (value: string) => value is T,
): T[] | undefined {
  if (!raw) return undefined;
  const accepted = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter(guard);
  return accepted.length > 0 ? accepted : undefined;
}
export function getSetupAiInitiatives(
  tenantKey: string | null | undefined,
): SetupAiInitiativeRecord[] {
  const normalized = normalizeSetupAiInitiativeTenantKey(tenantKey);
  return SETUP_AI_INITIATIVE_FIXTURES.filter(
    (initiative) => initiative.tenantKey === normalized,
  ).map((initiative) => ({ ...initiative }));
}
export function filterSetupAiInitiatives(
  records: readonly SetupAiInitiativeRecord[],
  filters: SetupAiInitiativeFilters = {},
): SetupAiInitiativeRecord[] {
  const updatedSinceMs = filters.updatedSince
    ? Date.parse(filters.updatedSince)
    : Number.NaN;
  return records.filter((record) => {
    if (filters.status?.length && !filters.status.includes(record.status))
      return false;
    if (
      filters.archetype?.length &&
      !filters.archetype.includes(record.archetype)
    )
      return false;
    if (
      Number.isFinite(updatedSinceMs) &&
      Date.parse(record.lastUpdatedAt) <= updatedSinceMs
    )
      return false;
    return true;
  });
}
export function applySetupAiInitiativeFinancialFirewall(
  record: SetupAiInitiativeRecord,
  financialVisibility = false,
): SetupAiInitiativeRecord {
  return financialVisibility
    ? { ...record }
    : { ...record, budgetAmount: null, spendToDate: null };
}
function emptyArchetypeCounts(): Record<SetupAiInitiativeArchetype, number> {
  return {
    copilot_rollout: 0,
    agent_rollout: 0,
    vendor_ai_feature: 0,
    internal_build: 0,
    abarva_program: 0,
  };
}
function emptyStatusCounts(): Record<SetupAiInitiativeStatus, number> {
  return {
    planning: 0,
    active: 0,
    "at-risk": 0,
    realizing: 0,
    settled: 0,
    paused: 0,
    canceled: 0,
  };
}
export function summarizeSetupAiInitiatives(
  tenantKey: string,
  records: readonly SetupAiInitiativeRecord[] = getSetupAiInitiatives(
    tenantKey,
  ),
): SetupAiInitiativeSummary {
  const archetypeCounts = emptyArchetypeCounts();
  const statusCounts = emptyStatusCounts();
  for (const record of records) {
    archetypeCounts[record.archetype] += 1;
    statusCounts[record.status] += 1;
  }
  return {
    tenantKey: normalizeSetupAiInitiativeTenantKey(tenantKey),
    total: records.length,
    atRisk: statusCounts["at-risk"],
    activeOrRealizing: statusCounts.active + statusCounts.realizing,
    linkedPrograms: records.filter((record) => record.linkedProgramId).length,
    stale: records.filter(
      (record) =>
        Date.parse(record.lastUpdatedAt) < Date.parse("2026-04-02T00:00:00Z"),
    ).length,
    archetypeCounts,
    statusCounts,
  };
}
