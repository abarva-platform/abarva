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
  org_workforce: [
    "operating_model_design",
    "execution_roadmap",
    "handoff_package",
  ],
  workforce_model: [
    "operating_model_design",
    "execution_roadmap",
    "handoff_package",
  ],
  // Healthcare / member-service Contact Center Agent Assist family ids —
  // see HEALTHCARE_CONTACT_CENTER_AGENT_ASSIST in discovery-blueprint.ts.
  current_state_workflow_map: [
    "discovery_report",
    "root_cause_worksheet",
    "target_state_architecture",
  ],
  contact_center_kpis: [
    "discovery_report",
    "business_case",
    "tower_metrics_plan",
    "value_measurement_contract",
  ],
  crm_contact_center_system_map: [
    "discovery_report",
    "target_state_architecture",
    "solution_design",
  ],
  claims_eligibility_benefits_data_access: [
    "target_state_architecture",
    "solution_design",
  ],
  knowledge_base_ownership_freshness: [
    "solution_design",
    "operating_model_design",
  ],
  call_recording_transcript_availability: [
    "discovery_report",
    "solution_design",
  ],
  phi_privacy_security_controls: [
    "solution_design",
    "operating_model_design",
  ],
  human_in_loop_model: ["operating_model_design", "solution_design"],
  model_risk_responsible_ai_controls: [
    "solution_design",
    "operating_model_design",
  ],
  measurement_owner_cadence: ["tower_metrics_plan", "value_measurement_contract"],
  finance_baseline_value_plan: ["business_case", "financial_model"],
  change_adoption_owner: ["operating_model_design", "handoff_package"],
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

const TREASURY_EXAMPLES: Partial<typeof GENERIC_EXAMPLES> = {
  current_state_process: {
    exampleTemplate: "Treasury operating process packet",
    exampleContent: [
      "Cash positioning, liquidity forecast, payment approval, and bank connectivity workflow notes",
      "Three to five real treasury operating examples with source system, owner, timing, exception, and resolution path",
      "Control checkpoints, signer rules, payment-format handling, cutover dependencies, and SOX evidence expectations",
    ],
    whyItMatters:
      "AbarVa cannot produce a credible treasury readiness or value plan until it knows how cash visibility, payments, approvals, bank connectivity, and controls work today.",
    nextAction:
      "Upload treasury process notes, bank connectivity plan, payment approval matrix, signer/control evidence, or Kyriba implementation workshop output.",
  },
  it_systems_landscape: {
    exampleTemplate: "Treasury systems and bank-connectivity map",
    exampleContent: [
      "Kyriba, SAP/AP/AR/GL, bank portals, payment hubs, reporting tools, and integration ownership",
      "Bank connectivity matrix with file/API type, frequency, format, control owner, and exception handling",
      "Known breakpoints such as stale SAP feeds, manual cash-positioning workarounds, signer gaps, and payment format exceptions",
    ],
    whyItMatters:
      "The architecture and cutover plan must show the actual treasury systems, bank interfaces, control boundaries, and owner handoffs.",
    nextAction:
      "Upload a treasury systems inventory, bank connectivity matrix, SAP feed map, payment format inventory, or architecture diagram.",
  },
  kpi_baseline: {
    exampleTemplate: "Treasury outcome baseline",
    exampleContent: [
      "Cash visibility timeliness, forecast accuracy, manual cash-positioning effort, payment exception volume, and bank connectivity completion",
      "Metric definitions, reporting period, source system, owner, and CFO/Treasurer validation status",
      "Current workaround volume, close/reporting dependency, cutover readiness, and control-evidence status",
    ],
    whyItMatters:
      "Tower metrics, adoption gates, and value proof need measured treasury baselines before go-live can be treated as business value.",
    nextAction:
      "Upload treasury KPI extracts, cash visibility baseline, forecast accuracy history, payment exception reports, or an owner-attested measurement worksheet.",
  },
  cost_baseline: {
    exampleTemplate: "Treasury cost and value baseline",
    exampleContent: [
      "Manual treasury effort, bank connectivity implementation cost, vendor/support cost, rework risk, and delayed go-live exposure",
      "Run-rate assumptions, finance validation status, implementation partner estimate, and control remediation cost",
      "Value-driver definitions for labor reduction, liquidity visibility, payment-risk reduction, and avoided cutover delay",
    ],
    whyItMatters:
      "The business case needs traceable treasury cost and value assumptions before it becomes funding-grade.",
    nextAction:
      "Upload finance baseline, treasury effort model, Kyriba implementation estimate, bank connectivity cost view, or value-estimate worksheet.",
  },
};

// Healthcare / member-service Contact Center Agent Assist. Family ids here
// match `HEALTHCARE_CONTACT_CENTER_AGENT_ASSIST.evidenceFamilies` in
// discovery-blueprint.ts (the catalog that actually feeds `readiness` into
// this file) — content is adapted from that catalog's real label/grounds/
// likelySource/format fields, not invented fresh. Note: `archetypes/
// registry.ts` defines a second, differently-keyed catalog for the same
// archetype (e.g. `contact_center_transcripts_intents` there vs
// `call_recording_transcript_availability` here) — the two are not merged;
// this table only needs to match the ids this specific pipeline actually
// receives.
const CONTACT_CENTER_AGENT_ASSIST_EXAMPLES: Partial<typeof GENERIC_EXAMPLES> = {
  current_state_workflow_map: {
    exampleTemplate: "Member-service workflow map",
    exampleContent: [
      "As-is workflow: intake, verification, systems touched, escalation, and resolution path per top intent",
      "Handle-time and transfer points broken out by intent category",
      "Owner-attested notes from Member Operations / Contact Center Operations",
    ],
    whyItMatters:
      "AbarVa needs the real member-service workflow — not a generic contact-center template — before it can diagnose where agent assist actually helps.",
    nextAction:
      "Upload workshop notes, a process map, or call-flow documentation from Member Operations.",
  },
  contact_center_kpis: {
    exampleTemplate: "Contact center baseline KPIs",
    exampleContent: [
      "AHT, FCR, transfer rate, repeat-contact rate, and CSAT by top intent",
      "Volume and staffing by queue, with recent-period trend",
      "Metric definitions, source (CCaaS reporting), and owner attestation",
    ],
    whyItMatters:
      "The value hypothesis, business case, and Tower metrics need measured contact-center baselines, not assumed ones.",
    nextAction:
      "Upload CCaaS/operations analytics reporting extracts or an owner-attested KPI worksheet.",
  },
  crm_contact_center_system_map: {
    exampleTemplate: "CRM/contact-center system and integration map",
    exampleContent: [
      "CRM, CCaaS, claims, eligibility, and knowledge systems agents touch per call, with owners",
      "Integration map between those systems: source, target, frequency, and failure handling",
      "Known breakpoints — systems agents must swivel-chair between today",
    ],
    whyItMatters:
      "Target architecture and solution design need the real system and integration boundaries agent assist has to work inside.",
    nextAction:
      "Upload a CMDB export, application inventory, or architecture diagram from Enterprise Architecture / Contact Center IT.",
  },
  claims_eligibility_benefits_data_access: {
    exampleTemplate: "Claims, eligibility, benefits, and prior-auth data access",
    exampleContent: [
      "Which systems hold claims, eligibility, benefits, and prior-authorization data, and how agent assist would query them",
      "Data freshness, access model, and interface catalog for each source",
      "Known data-quality or access gaps that would limit retrieval scope",
    ],
    whyItMatters:
      "Agent assist's answer quality is bounded by what it can actually retrieve — this defines the real retrieval scope, not an assumed one.",
    nextAction:
      "Upload a data inventory or interface catalog from Claims, Benefits, Prior Authorization, or the Data Platform team.",
  },
  knowledge_base_ownership_freshness: {
    exampleTemplate: "Knowledge base ownership and freshness",
    exampleContent: [
      "Which knowledge base(s) agents use today, who owns content, and refresh cadence",
      "Known stale or conflicting content areas",
      "Policy-approval path for content agent assist would surface",
    ],
    whyItMatters:
      "Agent assist is only as trustworthy as the knowledge it draws from — governance and freshness are gating, not optional.",
    nextAction:
      "Upload a knowledge-base export or ownership/refresh-cadence document from Knowledge Management / Policy Owners.",
  },
  call_recording_transcript_availability: {
    exampleTemplate: "Call transcript/recording availability",
    exampleContent: [
      "Redacted call transcripts or intent taxonomy covering real question types and agent search patterns",
      "Retention policy and a representative sample inventory (order of 50-100 calls)",
      "Repeat-contact drivers, transfer reasons, and known knowledge gaps surfaced in real calls",
    ],
    whyItMatters:
      "Intent taxonomy and training/evaluation data can only come from real calls — this is not something AbarVa can infer or template.",
    nextAction:
      "Upload redacted transcripts, a speech-analytics export, or an intent taxonomy from CCaaS / Speech Analytics / Compliance.",
  },
  phi_privacy_security_controls: {
    exampleTemplate: "PHI, privacy, security, and audit controls",
    exampleContent: [
      "PHI access, retention, and audit-logging controls that apply to any agent-assist surface",
      "Existing security architecture and control matrix for member-facing systems",
      "Compliance sign-off requirements before any pilot beyond internal agent use",
    ],
    whyItMatters:
      "This is a gate decision, not a nice-to-have — no clinical or member-facing AI capability should move beyond pilot without it.",
    nextAction:
      "Upload a controls matrix or security/privacy review from Security / Privacy / Compliance.",
  },
  human_in_loop_model: {
    exampleTemplate: "Human-in-the-loop decision model",
    exampleContent: [
      "Which decisions agent assist may draft vs. which must stay human-owned regardless of confidence",
      "Escalation and override rules, and who owns them",
      "Clinical or operational policy constraints on AI-drafted content",
    ],
    whyItMatters:
      "The operating model and responsible-AI controls need an explicit decision-rights model, not an assumed one.",
    nextAction:
      "Upload a decision-rights matrix from Operations Leadership / Compliance / Clinical Policy.",
  },
  model_risk_responsible_ai_controls: {
    exampleTemplate: "Model risk and responsible AI controls",
    exampleContent: [
      "Existing model-risk review process and approval guardrails, if any",
      "Monitoring, drift, and incident-response expectations for an agent-assist deployment",
      "Any existing responsible-AI policy this Move must comply with",
    ],
    whyItMatters:
      "AI governance and approval guardrails are a gate, not a checkbox — this needs the real control checklist, not a generic one.",
    nextAction:
      "Upload a control checklist or model-risk review artifact from Responsible AI / Model Risk / Compliance.",
  },
  measurement_owner_cadence: {
    exampleTemplate: "Measurement owner and cadence",
    exampleContent: [
      "Named owner for each contact-center metric this Move intends to move",
      "Reporting cadence and system of record for each metric",
      "How this ties to the Tower handoff and value measurement contract",
    ],
    whyItMatters:
      "Tower handoff and the value measurement contract need a named owner and cadence per metric, not an aspiration.",
    nextAction:
      "Upload a metric-owner table from Operations Analytics / Finance / PMO.",
  },
  finance_baseline_value_plan: {
    exampleTemplate: "Finance baseline and value measurement plan",
    exampleContent: [
      "Current run cost by queue/function relevant to the value hypothesis",
      "Value-driver definitions (handle time, containment, staffing) with finance-validated assumptions",
      "Validation status: finance-attested vs. planning assumption",
    ],
    whyItMatters:
      "The business case needs traceable, finance-validated cost and value assumptions before it's funding-grade.",
    nextAction:
      "Upload a finance baseline or value-measurement worksheet from Finance / FP&A.",
  },
  change_adoption_owner: {
    exampleTemplate: "Operational change and adoption owner",
    exampleContent: [
      "Named owner for agent training, rollout sequencing, and adoption tracking",
      "Planned adoption measurement approach (usage, override rate, satisfaction)",
      "Known change-management risks specific to frontline agent adoption",
    ],
    whyItMatters:
      "Adoption risk is a real failure mode for agent-assist tools — this needs a named owner before rollout, not after.",
    nextAction:
      "Upload a RACI or adoption plan from Training / Workforce / Change Lead.",
  },
};

function lower(value: string): string {
  return value.toLowerCase();
}

function isTreasuryMove(moveName: string): boolean {
  const text = lower(moveName);
  return [
    "kyriba",
    "treasury",
    "cash visibility",
    "cash positioning",
    "liquidity",
    "bank connectivity",
    "payment format",
    "signer",
    "payment control",
    "tms",
  ].some((token) => text.includes(token));
}

function isApInvoiceMove(moveName: string): boolean {
  const text = lower(moveName);
  return [
    "invoice",
    "ap ",
    "accounts payable",
    "payable",
    "procurement",
    "close",
    "exception",
  ].some((token) => text.includes(token));
}

// Same keyword set as archetypes/registry.ts's resolveProgramArchetype
// heuristic (kept in sync deliberately, not shared code) — a Move named
// "Meridian Member Service Agent Assist" resolves here the same way it
// resolves to the CONTACT_CENTER_AGENT_ASSIST archetype.
function isContactCenterAgentAssistMove(moveName: string): boolean {
  const text = lower(moveName);
  return [
    "contact center",
    "call center",
    "agent assist",
    "member service",
    "member experience",
    "member ai assist",
    "benefits",
    "eligibility",
    "prior auth",
    "prior authorization",
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
  const treasury = isTreasuryMove(moveName) ? TREASURY_EXAMPLES[familyId] : null;
  const finance = !treasury && isApInvoiceMove(moveName) ? FINANCE_AP_EXAMPLES[familyId] : null;
  const contactCenter =
    !treasury && !finance && isContactCenterAgentAssistMove(moveName)
      ? CONTACT_CENTER_AGENT_ASSIST_EXAMPLES[familyId]
      : null;
  const generic = GENERIC_EXAMPLES[familyId];
  return (
    treasury ??
    finance ??
    contactCenter ??
    generic ?? {
      exampleTemplate: "Evidence packet",
      exampleContent: [
        "Owner-attested source extract or document",
        "Period covered, source system, and freshness",
        "Known caveats, missing fields, and approval status",
      ],
      whyItMatters:
        "This input anchors the artifact in client evidence instead of unsupported assumptions.",
      nextAction:
        "Upload the source file or record a human waiver with rationale.",
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
          : "Final generation is blocked until this evidence is uploaded or formally waived.",
        cannotDraftLabel:
          family.status === "covered"
            ? "No current block from this evidence slot."
            : "Do not present final or board-ready output until this evidence is covered or waived.",
      },
      preliminaryGenerationCaveat:
        family.status === "covered"
          ? null
          : `A preliminary draft lane is not active for this phase. Final generation must wait until ${family.label.toLowerCase()} is uploaded or formally waived.`,
      waiverOption: required
        ? "A sponsor or accountable owner may record a waiver, but final artifacts must carry the waiver caveat."
        : "Optional input; waive only if the team accepts a lower-readiness artifact.",
      nextAction: guidance.nextAction,
      status,
      evidenceTitles: family.evidenceTitles,
    };
  });
}
