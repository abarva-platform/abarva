import type {
  DiscoveryEvidenceReadiness,
  DiscoveryFamilyCoverage,
  DiscoveryGapRegisterItem,
} from "@/lib/programs/discovery/evidence-readiness";
import {
  DELIVERABLE_REGISTRY,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";

export type MoveEvidenceNeedStatus =
  | "missing"
  | "partial"
  | "covered"
  | "waived"
  | "not_applicable";

export type MoveEvidenceNeedPriority = "required" | "recommended" | "optional";

export interface MoveEvidenceNeedPacket {
  moveId: string;
  phase: number | null;
  artifactType: string | null;
  evidenceSlot: string;
  familyId: string;
  priority: MoveEvidenceNeedPriority;
  ownerSource: string;
  acceptedFormats: string[];
  exampleTemplate: string;
  exampleContent: string[];
  whyItMatters: string;
  blockedArtifacts: Array<{
    artifactType: string;
    title: string;
    phase: number;
    reason: string;
  }>;
  canDraftBoundary: {
    canDraft: boolean;
    canDraftLabel: string;
    cannotDraftLabel: string;
  };
  preliminaryGenerationCaveat: string | null;
  waiverOption: string | null;
  nextAction: string;
  status: MoveEvidenceNeedStatus;
  evidenceTitles: string[];
}

export interface MoveEvidenceNeedPacketInput {
  moveId: string;
  moveName: string;
  currentPhase?: number | null;
  readiness: DiscoveryEvidenceReadiness;
}

const FAMILY_TO_ARTIFACTS: Record<string, string[]> = {
  current_state_process: [
    "discovery_report",
    "root_cause_worksheet",
    "target_state_architecture",
    "solution_design",
  ],
  current_state_runbook: [
    "discovery_report",
    "root_cause_worksheet",
    "operating_model_design",
  ],
  it_systems_landscape: [
    "discovery_report",
    "target_state_architecture",
    "solution_design",
    "sourcing_strategy",
  ],
  data_analytics_estate: [
    "discovery_report",
    "target_state_architecture",
    "solution_design",
  ],
  kpi_baseline: [
    "discovery_report",
    "execution_roadmap",
    "business_case",
    "tower_metrics_plan",
    "value_measurement_contract",
  ],
  cost_baseline: ["business_case", "financial_model", "cfo_pack"],
  cost_pools: ["business_case", "financial_model"],
  org_workforce: ["operating_model_design", "execution_roadmap", "handoff_package"],
  workforce_model: ["operating_model_design", "execution_roadmap", "handoff_package"],
};

const GENERIC_EXAMPLES: Record<
  string,
  Pick<
    MoveEvidenceNeedPacket,
    "exampleTemplate" | "exampleContent" | "whyItMatters" | "nextAction"
  >
> = {
  current_state_process: {
    exampleTemplate: "Current-state process packet",
    exampleContent: [
      "As-is workflow with handoff points, queues, exceptions, and approval rules",
      "Three to five real examples with outcomes and timestamps",
      "Known pain points, control checks, and owner-attested process notes",
    ],
    whyItMatters:
      "AbarVa needs the actual work pattern before it can diagnose root causes or design a credible future-state workflow.",
    nextAction:
      "Upload a current-state process document, workshop notes, or a process-observation export.",
  },
  it_systems_landscape: {
    exampleTemplate: "Application and integration landscape",
    exampleContent: [
      "System inventory with business owner, technical owner, lifecycle, and criticality",
      "Integration map with source, target, frequency, payload, and failure handling",
      "Relevant ERP, workflow, data, reporting, and control platforms",
    ],
    whyItMatters:
      "Architecture and sourcing artifacts need the actual systems, interfaces, and ownership boundaries.",
    nextAction:
      "Upload a CMDB export, application inventory, integration catalog, or architecture diagram.",
  },
  kpi_baseline: {
    exampleTemplate: "Outcome baseline and KPI packet",
    exampleContent: [
      "Current volume, exception rate, cycle time, backlog, quality, and SLA measures",
      "Metric definitions, calculation logic, reporting cadence, and accountable owner",
      "Recent period baseline with source system and finance or operations attestation",
    ],
    whyItMatters:
      "Roadmap, Tower metrics, and value realization need measured baselines, not generated assumptions.",
    nextAction:
      "Upload baseline KPI extracts or an owner-attested measurement worksheet.",
  },
  cost_baseline: {
    exampleTemplate: "Cost and effort baseline packet",
    exampleContent: [
      "Current labor effort, run cost, vendor cost, leakage, penalties, and exception cost",
      "Rate-card or finance assumptions with confidence and validation status",
      "Cost driver definitions and period covered",
    ],
    whyItMatters:
      "The business case and financial model need traceable cost and value assumptions before funding-grade estimates.",
    nextAction:
      "Upload finance baseline, AP cost model, rate-card assumptions, or value-estimate worksheet.",
  },
  org_workforce: {
    exampleTemplate: "Operating model and workforce packet",
    exampleContent: [
      "Roles, teams, RACI, approval limits, and named accountable owners where available",
      "Work volume by role or queue and current capacity constraints",
      "Change readiness, training needs, and human approval boundaries",
    ],
    whyItMatters:
      "Operating model, roadmap, and handoff artifacts need the people and decision-rights model.",
    nextAction:
      "Upload RACI, org/workforce model, interview notes, or workshop output.",
  },
};

const FINANCE_AP_EXAMPLES: Partial<typeof GENERIC_EXAMPLES> = {
  current_state_process: {
    exampleTemplate: "AP invoice exception process packet",
    exampleContent: [
      "AP invoice exception workflow notes with exception categories, handoffs, approval rules, and rework loops",
      "Three to five real invoice exception examples with cause, queue, aging, resolution, and business impact",
      "Control checkpoints, escalation rules, and where procurement, AP, finance, and business approvers interact",
    ],
    whyItMatters:
      "AbarVa cannot produce a credible P2 Current Work Diagnostic or P3 Future-State Workflow until it knows how invoice exceptions move through the organization today.",
    nextAction:
      "Upload AP workflow notes, exception-handling SOPs, process workshop notes, or sampled exception case summaries.",
  },
  it_systems_landscape: {
    exampleTemplate: "AP/ERP application and integration map",
    exampleContent: [
      "ERP/AP platform extracts, workflow tools, procurement systems, reporting tools, and service-management systems involved in invoice exceptions",
      "Integration map between procurement, ERP/AP, approval workflow, payment, vendor master, and reporting layers",
      "Known breakpoints such as duplicate vendor records, PO mismatch, approval aging, and control exceptions",
    ],
    whyItMatters:
      "The P3 architecture must show the actual systems, integrations, and control boundaries behind exception handling.",
    nextAction:
      "Upload an application inventory, ERP/AP extract, integration map, service map, or architecture diagram.",
  },
  kpi_baseline: {
    exampleTemplate: "Invoice exception KPI baseline",
    exampleContent: [
      "Invoice volume, exception volume, exception rate, aging, resolution cycle time, touch time, and backlog",
      "Duplicate payment rate, late payment penalties, discount leakage, first-pass match rate, and SLA misses",
      "Metric owner, calculation logic, reporting period, and finance validation status",
    ],
    whyItMatters:
      "AbarVa needs measured baselines before it can build a defensible roadmap, Tower metric plan, or value case.",
    nextAction:
      "Upload AP KPI extracts, approval aging reports, leakage history, or an owner-attested baseline worksheet.",
  },
  cost_baseline: {
    exampleTemplate: "Finance cost and value baseline",
    exampleContent: [
      "Manual AP effort, exception resolution effort, fully loaded labor assumptions, run cost, and vendor support cost",
      "Leakage history: duplicate payments, missed discounts, late fees, write-offs, audit findings, and rework cost",
      "Rate-card provenance and whether finance/client validation is complete or still required",
    ],
    whyItMatters:
      "The P4 Business Case and Financial Model should use ranges and caveats until finance validates cost and rate assumptions.",
    nextAction:
      "Upload finance baseline, cost-center extract, rate-card assumptions, leakage analysis, or value-estimate worksheet.",
  },
};

function lower(value: string): string {
  return value.toLowerCase();
}

function isFinanceBackOfficeMove(moveName: string): boolean {
  const text = lower(moveName);
  return [
    "invoice",
    "ap ",
    "accounts payable",
    "payable",
    "finance",
    "procurement",
    "close",
    "kyriba",
    "treasury",
    "back-office",
    "back office",
    "exception",
  ].some((token) => text.includes(token));
}

function splitFormats(format: string): string[] {
  return format
    .split(/[,+/]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function artifactsForFamily(familyId: string): DeliverableSpec[] {
  const keys = FAMILY_TO_ARTIFACTS[familyId] ?? [];
  return keys
    .map((key) =>
      DELIVERABLE_REGISTRY.find((spec) => spec.deliverableTypeKey === key),
    )
    .filter(Boolean) as DeliverableSpec[];
}

function familyGuidance(
  familyId: string,
  moveName: string,
): Pick<
  MoveEvidenceNeedPacket,
  "exampleTemplate" | "exampleContent" | "whyItMatters" | "nextAction"
> {
  const useFinanceSpecific = isFinanceBackOfficeMove(moveName);
  const finance = useFinanceSpecific ? FINANCE_AP_EXAMPLES[familyId] : null;
  const generic = GENERIC_EXAMPLES[familyId];
  return (
    finance ??
    generic ?? {
      exampleTemplate: "Evidence packet",
      exampleContent: [
        "Owner-attested source extract or document",
        "Period covered, source system, and freshness",
        "Known caveats, missing fields, and approval status",
      ],
      whyItMatters:
        "This input anchors the artifact in client evidence instead of unsupported assumptions.",
      nextAction: "Upload the source file or record a human waiver with rationale.",
    }
  );
}

function gapForFamily(
  family: DiscoveryFamilyCoverage,
  gaps: DiscoveryGapRegisterItem[],
): DiscoveryGapRegisterItem | null {
  return gaps.find((gap) => gap.familyId === family.familyId) ?? null;
}

export function buildMoveEvidenceNeedPackets(
  input: MoveEvidenceNeedPacketInput,
): MoveEvidenceNeedPacket[] {
  return input.readiness.families.map((family) => {
    const gap = gapForFamily(family, input.readiness.gapRegister);
    const guidance = familyGuidance(family.familyId, input.moveName);
    const blockedSpecs = artifactsForFamily(family.familyId);
    const status: MoveEvidenceNeedStatus =
      family.status === "covered"
        ? "covered"
        : family.required
          ? "missing"
          : "partial";
    const required = family.required;
    const canDraft = !required || family.status === "covered";
    const blockedArtifacts = blockedSpecs.map((spec) => ({
      artifactType: spec.deliverableTypeKey,
      title: spec.documentTitle,
      phase: spec.phase,
      reason:
        family.status === "covered"
          ? "Evidence available for this artifact."
          : `${family.label} is needed for a final-quality ${spec.documentTitle}.`,
    }));

    return {
      moveId: input.moveId,
      phase: input.currentPhase ?? null,
      artifactType: blockedArtifacts[0]?.artifactType ?? null,
      evidenceSlot: family.label,
      familyId: family.familyId,
      priority: required
        ? "required"
        : family.status === "covered"
          ? "recommended"
          : "optional",
      ownerSource: gap?.likelySource ?? "Client owner / evidence steward",
      acceptedFormats: splitFormats(gap?.format ?? "Doc, CSV, XLSX"),
      exampleTemplate: guidance.exampleTemplate,
      exampleContent: guidance.exampleContent,
      whyItMatters: guidance.whyItMatters,
      blockedArtifacts,
      canDraftBoundary: {
        canDraft,
        canDraftLabel: canDraft
          ? "Can draft with current evidence."
          : "Only a preliminary draft with evidence caveats is appropriate.",
        cannotDraftLabel:
          family.status === "covered"
            ? "No current block from this evidence slot."
            : "Do not present final or board-ready output until this evidence is covered or waived.",
      },
      preliminaryGenerationCaveat:
        family.status === "covered"
          ? null
          : `Any draft must state that ${family.label.toLowerCase()} is missing and that final sign-off is blocked until the evidence is uploaded or waived.`,
      waiverOption: required
        ? "A sponsor or accountable owner may record a waiver, but final artifacts must carry the waiver caveat."
        : "Optional input; waive only if the team accepts a lower-readiness artifact.",
      nextAction: guidance.nextAction,
      status,
      evidenceTitles: family.evidenceTitles,
    };
  });
}

