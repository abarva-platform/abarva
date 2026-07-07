// Artifact intelligence brief registry.
//
// Resolves the DeliverableArtifactBrief for a (module × use-case archetype ×
// deliverable type). The brief is the "intelligence" handed to Claude: a senior
// consultant's baseline structure + expected exhibits/tables PLUS explicit expert
// latitude and the governance boundary. Briefs are data, not code branches — add a
// use case here, not in the orchestrator. PR-2 fills out the full library; this file
// seeds the contract, the resolver, the shared governance language, and the AMS
// reference brief, with a sound module-level default so nothing ships unbriefed.

import type {
  BriefSection,
  DeliverableArtifactBrief,
  DeliverableIntelligenceRequest,
  DeliverableModule,
} from "./types";
import { getArchetypePack } from "./briefs/archetype-packs";
import { getDeliverableStructure } from "./briefs/deliverable-structures";
import { getDiscoveryBlueprint } from "./briefs/discovery-blueprint";

const CITATION_POLICY =
  "Cite every client-specific fact with [n] tied to the Source Register. Do not expose internal source ids, chunk ids, table names, or fact keys.";

const ALLOWED_EXPERT_KNOWLEDGE =
  "Use full expert knowledge of consulting frameworks, industry benchmarks (described qualitatively, never as fabricated client numbers), document structure, standard/boilerplate sections, decision frameworks, exhibits, and executive language. You may add sections, tables, and exhibits beyond the baseline when they materially improve the artifact.";

const DISALLOWED_FABRICATION =
  "Do not invent client names, owners, dates, financial values, KPIs, systems, vendor contracts, timelines, legal terms, market benchmarks, pricing data, or approvals. Missing client facts must be marked [EVIDENCE MISSING], [ASSUMPTION TO VALIDATE], or [CLIENT TO COMPLETE].";

const FORMATTING_INSTRUCTIONS =
  "Use clear numbered headings, decision and evidence tables, and a risk/issues/dependencies table. Keep body text readable (no tiny tables). Move wide datasets into Excel companion exhibits.";

const BOARD_QUALITY_CRITERIA = [
  "Reads like a senior engagement team prepared it for a CIO/CFO/CPO/board steering committee.",
  "Specific, structured, decision-oriented; synthesis and implications are explicit.",
  "Every client fact is cited, an approved assumption, or a labelled placeholder.",
  "Avoids generic filler; the recommendation and decision ask are unambiguous.",
];

// ── AMS / IT outsourcing — RFP package (reference brief) ──

const AMS_RFP_BRIEF: DeliverableArtifactBrief = {
  module: "source",
  useCaseArchetype: "AMS_IT_OUTSOURCING",
  deliverableType: "rfp_package",
  purpose:
    "Issue a defensible, enterprise-grade RFP for application management / IT outsourcing that lets qualified vendors respond on a like-for-like basis and gives the client a clean evaluation and negotiation position.",
  audience: ["cio", "cpo", "cfo", "procurement", "steering_committee"],
  decisionToSupport:
    "Approve issuance of the RFP and the scope/evaluation/commercial model it commits the client to.",
  recommendedStructure: [
    {
      key: "exec_overview",
      title: "Executive Overview & Objectives",
      intent: "Frame the sourcing objective, drivers, and the decision sought.",
      groundingMode: "mixed",
      expectedEvidenceFamilies: [],
      expertLatitude: "Sharpen the strategic rationale and the value at stake.",
    },
    {
      key: "scope_service_towers",
      title: "Scope & Service Towers",
      intent: "Define in-scope towers, services, and boundaries.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [
        "service_tower_scope",
        "application_inventory",
      ],
      expertLatitude: "Structure the tower taxonomy to enterprise norms.",
    },
    {
      key: "current_environment",
      title: "Current Environment",
      intent:
        "Describe the application/infrastructure estate vendors will support.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: ["application_inventory", "tooling_landscape"],
      expertLatitude: "Organize the estate so bidders can size effort.",
    },
    {
      key: "current_state_baseline",
      title: "Current-State Baseline (Volumes)",
      intent: "Provide demand baseline (tickets/incidents/changes) for sizing.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: ["ticket_volumes", "incident_problem_change"],
      expertLatitude:
        "Present demand in a way that supports resource-unit pricing.",
    },
    {
      key: "service_requirements",
      title: "Service Requirements",
      intent: "State functional/operational service requirements per tower.",
      groundingMode: "mixed",
      expectedEvidenceFamilies: ["service_tower_scope"],
      expertLatitude: "Bring standard AMS service-requirement structure.",
    },
    {
      key: "sla_kpi",
      title: "SLA / KPI Schedule",
      intent: "Define service levels, measurement windows, and credits.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: ["sla_baseline"],
      expertLatitude: "Design a defensible SLA/credit framework.",
    },
    {
      key: "transition",
      title: "Transition & Cutover",
      intent:
        "Define transition approach, KT, parallel run, exit-of-incumbent.",
      groundingMode: "mixed",
      expectedEvidenceFamilies: ["transition_constraints"],
      expertLatitude: "Provide a standard transition methodology with gates.",
    },
    {
      key: "security_compliance",
      title: "Security & Compliance",
      intent: "State security, data, and compliance obligations.",
      groundingMode: "client_to_complete",
      expectedEvidenceFamilies: ["security_requirements"],
      expertLatitude:
        "Draft standard control families; client confirms specifics.",
    },
    {
      key: "governance_retained_org",
      title: "Governance & Retained Organization",
      intent: "Define governance model and retained-org responsibilities.",
      groundingMode: "mixed",
      expectedEvidenceFamilies: ["retained_org_model", "staffing_baseline"],
      expertLatitude:
        "Bring a standard retained-org / vendor-management model.",
    },
    {
      key: "pricing_commercial",
      title: "Pricing & Commercial Model",
      intent: "Define the commercial model and the pricing response template.",
      groundingMode: "mixed",
      expectedEvidenceFamilies: ["staffing_baseline", "run_cost_baseline"],
      expertLatitude:
        "Design a resource-unit + productivity-glidepath template; do NOT disclose incumbent spend.",
    },
    {
      key: "vendor_response_instructions",
      title: "Instructions to Bidders",
      intent: "Tell vendors exactly how to respond.",
      groundingMode: "expert_template",
      expectedEvidenceFamilies: [],
      expertLatitude: "Standard, complete instructions-to-bidders.",
    },
    {
      key: "evaluation_criteria",
      title: "Evaluation Criteria & Weights",
      intent: "State how proposals will be scored.",
      groundingMode: "client_to_complete",
      expectedEvidenceFamilies: ["evaluation_weights"],
      expertLatitude:
        "Propose a weighted model; client confirms final weights.",
    },
    {
      key: "assumptions_dependencies",
      title: "Assumptions & Dependencies",
      intent: "State assumptions bidders may rely on.",
      groundingMode: "assumption_driven",
      expectedEvidenceFamilies: [],
      expertLatitude: "Capture standard assumptions/dependencies.",
    },
    {
      key: "contracting_terms",
      title: "Contracting & Commercial Terms",
      intent: "Frame the contracting approach and key terms.",
      groundingMode: "client_to_complete",
      expectedEvidenceFamilies: ["legal_terms"],
      expertLatitude:
        "Draft standard term headings; legal completes positions.",
    },
  ],
  requiredSections: [
    "exec_overview",
    "scope_service_towers",
    "current_environment",
    "service_requirements",
    "sla_kpi",
    "transition",
    "pricing_commercial",
    "vendor_response_instructions",
    "evaluation_criteria",
  ],
  optionalSections: [
    "current_state_baseline",
    "security_compliance",
    "governance_retained_org",
    "assumptions_dependencies",
    "contracting_terms",
  ],
  expectedExhibits: [
    {
      key: "tower_scope_map",
      title: "Service Tower Scope Map",
      kind: "matrix",
      purpose: "Towers × services × in/out of scope.",
      preferredFormat: "xlsx",
    },
    {
      key: "transition_timeline",
      title: "Transition Timeline",
      kind: "timeline",
      purpose: "Phased transition with gates.",
      preferredFormat: "pptx",
    },
    {
      key: "evaluation_model",
      title: "Evaluation Model",
      kind: "matrix",
      purpose: "Criteria × weights × scoring method.",
      preferredFormat: "xlsx",
    },
  ],
  expectedTables: [
    {
      key: "application_inventory",
      title: "Application Inventory",
      columns: ["App", "Criticality", "Business function", "Tower"],
      groundingMode: "governed_facts",
      moveToExcelIfWide: true,
    },
    {
      key: "sla_schedule",
      title: "SLA / KPI Schedule",
      columns: ["Service", "Metric", "Target", "Window", "Credit"],
      groundingMode: "governed_facts",
      moveToExcelIfWide: true,
    },
    {
      key: "pricing_template",
      title: "Pricing Response Template",
      columns: ["Tower", "Resource unit", "Rate", "Volume", "Annual"],
      groundingMode: "expert_template",
      moveToExcelIfWide: true,
    },
    {
      key: "risk_register",
      title: "Risks, Issues & Dependencies",
      columns: ["Item", "Type", "Impact", "Owner", "Mitigation"],
      groundingMode: "mixed",
      moveToExcelIfWide: false,
    },
  ],
  requiredPlaceholders: [
    "security_specifics",
    "evaluation_final_weights",
    "legal_positions",
  ],
  requiredClientDecisions: [
    "evaluation_final_weights",
    "legal_positions",
    "procurement_timeline",
  ],
  citationPolicy: CITATION_POLICY,
  allowedExpertKnowledge: ALLOWED_EXPERT_KNOWLEDGE,
  disallowedFabrication: `${DISALLOWED_FABRICATION} For an ISSUED RFP, never disclose incumbent vendor names or incumbent spend — those are internal-only.`,
  formattingInstructions: FORMATTING_INSTRUCTIONS,
  qualityCriteria: BOARD_QUALITY_CRITERIA,
};

// ── Discovery Plan (Evidence Request Pack) — generated at the P1→P2 gate ──
// Prescribes WHAT evidence to gather and WHO to interview, archetype-driven.

function buildDiscoveryPlanBrief(
  req: DeliverableIntelligenceRequest,
): DeliverableArtifactBrief {
  const bp = getDiscoveryBlueprint(req.useCaseArchetype);
  const familyList = bp.evidenceFamilies
    .map(
      (f) =>
        `- ${f.label} [${f.required ? "REQUIRED" : "optional"}] — grounds ${f.grounds}; likely source: ${f.likelySource}; format: ${f.format}`,
    )
    .join("\n");
  const rosterList = bp.interviewRoster
    .map(
      (r) =>
        `- (${r.side.toUpperCase()}) ${r.role} — ${r.objectives}. Sample questions: ${r.questions.slice(0, 4).join(" | ")}`,
    )
    .join("\n");

  const structure: BriefSection[] = [
    {
      key: "charter_recap",
      title: "What the Charter Establishes (do not re-collect)",
      intent:
        "Summarize the approved Charter (scope, sponsor, metrics, value pools, kill condition) so discovery does not re-ask known facts.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Tighten into a crisp pre-fill; do not invent beyond the Charter.",
    },
    {
      key: "evidence_request_list",
      title: "Evidence Request List",
      intent: `Tell the client exactly what evidence to gather and WHY each item matters (which downstream section/decision it grounds), required vs optional, likely source system, format/template, owner role, and status. Use this archetype catalog as the baseline (add items that materially improve coverage):\n${familyList}`,
      groundingMode: "expert_template",
      expectedEvidenceFamilies: bp.evidenceFamilies.map((f) => f.id),
      expertLatitude:
        "Add evidence families the use case needs; keep it scoped, not an exhaustive IT audit.",
    },
    {
      key: "interview_guide",
      title: "Interview Guide (Business & IT)",
      intent: `Provide a role-by-role interview guide spanning BUSINESS and IT, with objectives and tailored questions per role. Use this roster as the baseline:\n${rosterList}`,
      groundingMode: "expert_template",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Tailor and extend the questions to this use case; keep both business and IT tracks.",
    },
    {
      key: "evidence_readiness",
      title: "Evidence Readiness & Gap Derivation",
      intent:
        "Define the readiness score (required families satisfied ÷ required) and state that requested-but-missing required families become the discovery gap register automatically.",
      groundingMode: "expert_template",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Explain the readiness model and the P2→P3 gate threshold.",
    },
    {
      key: "scoping_discipline",
      title: "Scoping Discipline",
      intent:
        "State that requests are scoped to what changes the decision — not a full enterprise IT/data audit.",
      groundingMode: "expert_template",
      expectedEvidenceFamilies: [],
      expertLatitude: "Keep it short and firm.",
    },
  ];

  return {
    module: req.module,
    useCaseArchetype: req.useCaseArchetype,
    deliverableType: "discovery_plan",
    purpose:
      "Prescribe a scoped, archetype-driven discovery agenda: exactly what evidence to gather and who to interview to ground the discovery and downstream deliverables for this use case.",
    audience: req.audience.length
      ? req.audience
      : ["program_leadership", "steering_committee"],
    decisionToSupport:
      "Run a scoped, evidence-grounded discovery that fills the gaps behind the approved Charter (do not redefine the Charter).",
    recommendedStructure: structure,
    requiredSections: ["evidence_request_list", "interview_guide"],
    optionalSections: [
      "charter_recap",
      "evidence_readiness",
      "scoping_discipline",
    ],
    expectedExhibits: [],
    expectedTables: [
      {
        key: "evidence_request_table",
        title: "Evidence Request List",
        columns: [
          "Evidence family",
          "Why it grounds",
          "Required?",
          "Likely source",
          "Format",
          "Owner (role)",
          "Status",
        ],
        groundingMode: "expert_template",
        moveToExcelIfWide: false,
      },
      {
        key: "interview_business",
        title: "Interview Guide — Business",
        columns: ["Role", "Objectives", "Key questions"],
        groundingMode: "expert_template",
        moveToExcelIfWide: false,
      },
      {
        key: "interview_it",
        title: "Interview Guide — IT",
        columns: ["Role", "Objectives", "Key questions"],
        groundingMode: "expert_template",
        moveToExcelIfWide: false,
      },
    ],
    requiredPlaceholders: [],
    requiredClientDecisions: [],
    citationPolicy: CITATION_POLICY,
    allowedExpertKnowledge: `${ALLOWED_EXPERT_KNOWLEDGE} Use the archetype evidence-family catalog and interview question bank above as the baseline.`,
    disallowedFabrication: `${DISALLOWED_FABRICATION} For a discovery plan, do NOT assert client systems, owners, or data as facts — request them as items to gather (with the owner as a role, or [CLIENT TO COMPLETE]).`,
    formattingInstructions:
      "Numbered sections; an Evidence Request table (family · why · required · source · format · owner · status); separate Business and IT interview tables. Readable, not tiny.",
    qualityCriteria: [
      "Reads like a senior team prescribing discovery — specific to this use case, not a generic checklist.",
      "Every evidence family states WHY it matters (which downstream section/decision it grounds).",
      "Covers BOTH business and IT interviews with tailored questions.",
      "Respects what the Charter already establishes (no re-asking known facts); scoped, not exhaustive.",
    ],
  };
}

function normalizeType(t: string): string {
  return t
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ── Registry + resolver ──

const REGISTRY: DeliverableArtifactBrief[] = [AMS_RFP_BRIEF];

function key(
  module: string,
  archetype: string,
  deliverableType: string,
): string {
  return `${module}::${archetype}::${deliverableType}`;
}

const BY_KEY = new Map(
  REGISTRY.map((b) => [
    key(b.module, b.useCaseArchetype, b.deliverableType),
    b,
  ]),
);

/** Module-level default so an un-briefed deliverable still gets a sound consulting baseline. */
function defaultBrief(
  req: DeliverableIntelligenceRequest,
): DeliverableArtifactBrief {
  const moduleStructure: Record<
    DeliverableModule,
    { key: string; title: string }[]
  > = {
    moves: [
      { key: "exec_summary", title: "Executive Summary" },
      { key: "decision_required", title: "Decision Required" },
      { key: "problem_opportunity", title: "Problem / Opportunity" },
      { key: "current_state", title: "Current-State Evidence" },
      { key: "objectives", title: "Strategic Objectives" },
      { key: "scope", title: "Scope" },
      { key: "value_hypothesis", title: "Value Hypothesis & KPIs" },
      { key: "operating_model", title: "Operating Model & RACI" },
      { key: "risks", title: "Risks, Issues & Dependencies" },
      { key: "phase_gates", title: "Phase Gates" },
      { key: "evidence_gaps", title: "Evidence Gaps & Client-to-Complete" },
      { key: "recommendation", title: "Recommendation & Next Actions" },
    ],
    source: [
      { key: "sourcing_objective", title: "Sourcing Objective" },
      { key: "scope", title: "Scope" },
      { key: "evidence_readiness", title: "Evidence Readiness" },
      { key: "current_state", title: "Current-State Baseline" },
      { key: "commercial_model", title: "Pricing / Commercial Model" },
      { key: "evaluation", title: "Evaluation Criteria" },
      { key: "risks", title: "Risks & Protections" },
      { key: "source_register", title: "Source Register" },
      { key: "recommendation", title: "Recommendation & Next Actions" },
    ],
    tower: [
      { key: "exec_summary", title: "Executive Summary" },
      { key: "current_state", title: "Current-State Evidence" },
      { key: "analysis", title: "Analysis" },
      { key: "risks", title: "Risks & Dependencies" },
      { key: "recommendation", title: "Recommendation & Next Actions" },
    ],
    intelligence: [
      { key: "exec_summary", title: "Executive Summary" },
      { key: "signal", title: "Signal & Pattern" },
      { key: "implication", title: "Implication" },
      { key: "recommendation", title: "Recommended Move" },
    ],
  };
  const sections = moduleStructure[req.module];
  return {
    module: req.module,
    useCaseArchetype: req.useCaseArchetype,
    deliverableType: req.deliverableType,
    purpose: `Produce a board-grade ${req.deliverableType.replace(/_/g, " ")} for the ${req.module} module.`,
    audience: req.audience,
    decisionToSupport: req.decisionContext,
    recommendedStructure: sections.map((s) => ({
      key: s.key,
      title: s.title,
      intent: `Standard ${s.title.toLowerCase()} content for this artifact.`,
      groundingMode: /current_state|evidence|baseline|signal/.test(s.key)
        ? "governed_facts"
        : "mixed",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Bring expert structure and synthesis; add sections if they improve the artifact.",
    })),
    requiredSections: sections
      .slice(0, Math.min(5, sections.length))
      .map((s) => s.key),
    optionalSections: sections.slice(5).map((s) => s.key),
    expectedExhibits: [],
    expectedTables: [
      {
        key: "risk_register",
        title: "Risks, Issues & Dependencies",
        columns: ["Item", "Type", "Impact", "Owner", "Mitigation"],
        groundingMode: "mixed",
        moveToExcelIfWide: false,
      },
    ],
    requiredPlaceholders: [],
    requiredClientDecisions: [],
    citationPolicy: CITATION_POLICY,
    allowedExpertKnowledge: ALLOWED_EXPERT_KNOWLEDGE,
    disallowedFabrication: DISALLOWED_FABRICATION,
    formattingInstructions: FORMATTING_INSTRUCTIONS,
    qualityCriteria: BOARD_QUALITY_CRITERIA,
  };
}

/**
 * Compose a brief from a deliverable structure (section flow) × an archetype pack
 * (use-case exhibits/tables/evidence). This is what makes the SAME deliverable type
 * differ by archetype. Returns null when there is no structure to build on.
 */
function composeBrief(
  req: DeliverableIntelligenceRequest,
): DeliverableArtifactBrief | null {
  const structure = getDeliverableStructure(req.module, req.deliverableType);
  if (!structure) return null;
  const pack = getArchetypePack(req.useCaseArchetype);

  // enrich current-state/baseline sections with the archetype's key evidence families
  const sections: BriefSection[] = structure.sections.map((sec) =>
    pack && /current_state|baseline|signal|findings|environment/.test(sec.key)
      ? {
          ...sec,
          expectedEvidenceFamilies: [
            ...new Set([
              ...sec.expectedEvidenceFamilies,
              ...pack.keyEvidenceFamilies,
            ]),
          ],
        }
      : sec,
  );

  const disallowed = pack?.governanceNote
    ? `${DISALLOWED_FABRICATION} ${pack.governanceNote}`
    : DISALLOWED_FABRICATION;

  return {
    module: req.module,
    useCaseArchetype: req.useCaseArchetype,
    deliverableType: req.deliverableType,
    purpose: structure.purpose,
    audience: req.audience,
    decisionToSupport: structure.decisionToSupport || req.decisionContext,
    recommendedStructure: sections,
    requiredSections: structure.requiredSectionKeys,
    optionalSections: sections
      .map((s) => s.key)
      .filter((k) => !structure.requiredSectionKeys.includes(k)),
    forbiddenSectionTopics: structure.forbiddenSectionTopics,
    expectedExhibits: pack?.exhibits ?? [],
    expectedTables: pack?.tables ?? [
      {
        key: "risk_register",
        title: "Risks, Issues & Dependencies",
        columns: ["Item", "Type", "Impact", "Owner", "Mitigation"],
        groundingMode: "mixed",
        moveToExcelIfWide: false,
      },
    ],
    requiredPlaceholders: sections
      .filter((s) => s.groundingMode === "client_to_complete")
      .map((s) => s.key),
    requiredClientDecisions: sections
      .filter((s) => s.groundingMode === "client_to_complete")
      .map((s) => s.key),
    citationPolicy: CITATION_POLICY,
    allowedExpertKnowledge: ALLOWED_EXPERT_KNOWLEDGE,
    disallowedFabrication: disallowed,
    formattingInstructions: FORMATTING_INSTRUCTIONS,
    qualityCriteria: BOARD_QUALITY_CRITERIA,
  };
}

export function getArtifactBrief(
  req: DeliverableIntelligenceRequest,
): DeliverableArtifactBrief {
  const t = normalizeType(req.deliverableType);
  if (t === "discovery_plan" || t === "evidence_request_pack") {
    return buildDiscoveryPlanBrief(req);
  }
  return (
    BY_KEY.get(key(req.module, req.useCaseArchetype, req.deliverableType)) ??
    composeBrief(req) ??
    defaultBrief(req)
  );
}

export function hasDedicatedBrief(
  module: string,
  archetype: string,
  deliverableType: string,
): boolean {
  return BY_KEY.has(key(module, archetype, deliverableType));
}

export function listArtifactBriefs(): DeliverableArtifactBrief[] {
  return [...REGISTRY];
}
