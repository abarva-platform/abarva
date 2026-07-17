import type { DeliverableKey } from "@/lib/deliverables/profiles/types";

export type PhaseDeliverableOutputKind =
  | "docx_editable_phase_record"
  | "html_visual_review_companion"
  | "pdf_snapshot"
  | "xlsx_estimate_or_baseline_model"
  | "evidence_provenance_manifest"
  | "workshop_evidence_pack"
  | "derived_visualization_inventory";

export interface PhaseDeliverableOutput {
  kind: PhaseDeliverableOutputKind;
  required: boolean;
  clientFacingLabel: string;
  purpose: string;
}

export interface PhaseDeliverablePackageContract {
  artifact: DeliverableKey;
  phase: number;
  formalEditableRecordRequired: boolean;
  primaryEditableRecordLabel: string;
  outputs: PhaseDeliverableOutput[];
  wordDocumentSections: string[];
  requiredWorkshopEvidence: string[];
  provenanceRules: string[];
}

const DEFAULT_WORD_SECTIONS = [
  "Cover page with tenant, Move, phase, draft/final status, owner, and review date",
  "Table of contents",
  "Executive summary and decision needed",
  "Storyline and narrative arc: why this matters, what changed, what the evidence says, and what decision is next",
  "Evidence basis and provenance summary",
  "What we know today",
  "What remains uncertain or client-to-complete",
  "Implications for the next phase",
  "Appendix: source register, caveats, and review log",
];

const DEFAULT_WORKSHOP_EVIDENCE = [
  "Workshop or interview agenda",
  "Stakeholder roster and roles",
  "Session notes or interview notes",
  "Decisions captured",
  "Open questions and evidence requests",
  "Client corrections or approvals",
];

const DEFAULT_PROVENANCE_RULES = [
  "Client-loaded evidence must be separated from AbarVa-generated deliverables.",
  "AbarVa-derived visuals must say they are derived from client-loaded evidence unless the client provided the visual itself.",
  "Generated deliverables must cite evidence, assumptions, caveats, and human approvals separately.",
  "Operator proof and QA screenshots are not client-loaded evidence and not client-facing deliverables.",
];

const P1_CHARTER_SECTIONS = [
  "Move name and P0 source",
  "Business problem / opportunity captured in P0",
  "Transformation pattern and why it fits",
  "Sponsor role, operating owner roles, and decision rights by title only",
  "Scope boundary: in, out, adjacent, and explicit caveats",
  "Directional value hypothesis and success criteria to validate in P2",
  "P2 evidence plan: required evidence families, sessions, and client-to-complete items",
  "Gate decision, open assumptions, and next action",
];

const P1_CHARTER_EVIDENCE = [
  "Approved P0 origination answers",
  "Sponsor/title and operating-owner role attestation",
  "Scope boundary attestation",
  "Directional value hypothesis and success criteria",
  "Evidence family plan for P2 discovery",
];

const P1_CHARTER_PROVENANCE_RULES = [
  ...DEFAULT_PROVENANCE_RULES,
  "P1 Charter may use only P0-captured fields and approved Move evidence.",
  "Current-state process, system, org, metric, architecture, roadmap, estimate, or operating-model claims must be marked 'To validate in P2' unless already backed by approved evidence.",
  "Do not invent insights, targets, owners, systems, solution options, delivery plans, or financial ranges after P0.",
];

function baseOutputs(): PhaseDeliverableOutput[] {
  return [
    {
      kind: "docx_editable_phase_record",
      required: true,
      clientFacingLabel: "Editable Word phase deliverable",
      purpose:
        "Formal client-editable record for redlines, sponsor comments, and approval workflow.",
    },
    {
      kind: "html_visual_review_companion",
      required: true,
      clientFacingLabel: "HTML visual review companion",
      purpose:
        "Browser-friendly visual companion for review, diagrams, charts, and live aVa references.",
    },
    {
      kind: "evidence_provenance_manifest",
      required: true,
      clientFacingLabel: "Evidence and provenance manifest",
      purpose:
        "Separates client-loaded evidence, AbarVa-generated deliverables, derived visuals, and operator proof.",
    },
    {
      kind: "workshop_evidence_pack",
      required: true,
      clientFacingLabel: "Workshop and session evidence pack",
      purpose:
        "Keeps agendas, interview guides, notes, decisions, and client feedback attached to the phase record.",
    },
    {
      kind: "derived_visualization_inventory",
      required: true,
      clientFacingLabel: "Derived visualization inventory",
      purpose:
        "Lists process flows, architecture diagrams, data flows, charts, and tables generated from evidence.",
    },
  ];
}

function p1CharterOutputs(): PhaseDeliverableOutput[] {
  return [
    {
      kind: "docx_editable_phase_record",
      required: true,
      clientFacingLabel: "P1 Charter brief / decision record",
      purpose:
        "Concise editable record of the approved P0 bet, sponsor/title, scope, value hypothesis, evidence plan, caveats, and P2 entry decision.",
    },
    {
      kind: "evidence_provenance_manifest",
      required: true,
      clientFacingLabel: "Evidence and caveat manifest",
      purpose:
        "Separates P0 user-entered facts, approved Move evidence, assumptions to validate, and P2 evidence requests.",
    },
    {
      kind: "html_visual_review_companion",
      required: false,
      clientFacingLabel: "Optional HTML review companion",
      purpose:
        "Browser-friendly copy for sponsor review; not a separate board pack.",
    },
  ];
}

function p2CurrentStateSections(): string[] {
  return [
    ...DEFAULT_WORD_SECTIONS,
    "How work is organized today",
    "Leadership, teams, decision rights, and ways of working",
    "Workforce footprint: locations, roles, offshore/onshore mix where loaded, and adoption constraints",
    "Current-state business process narrative before diagrams",
    "Current-state process flows and handoff maps",
    "Systems and technology in use, including ERP/HCM/workflow platforms such as Workday, Oracle, ServiceNow, Jira, or client-loaded alternatives",
    "Data, reporting, controls, and governance signals",
    "What works today and should be preserved",
    "What breaks today, why it breaks, and operational implications",
    "Change, adoption, culture, and readiness observations",
    "Root causes, gaps, and evidence confidence",
    "Sponsor review packet: approve for draft design, request revisions, or hold for evidence",
  ];
}

function p2WorkshopEvidence(): string[] {
  return [
    ...DEFAULT_WORKSHOP_EVIDENCE,
    "Business process discovery workshop agenda",
    "Business stakeholder interview guide",
    "IT/application/data owner interview guide",
    "Current-state walkthrough notes",
    "Process observation notes",
    "Adoption, change, culture, and workforce-location observations",
    "Client-confirmed process corrections",
  ];
}

function businessCaseOutputs(outputs: PhaseDeliverableOutput[]): PhaseDeliverableOutput[] {
  return [
    ...outputs,
    {
      kind: "xlsx_estimate_or_baseline_model",
      required: true,
      clientFacingLabel: "Editable Excel estimate model",
      purpose:
        "Formal editable model for rate-card provenance, scenarios, finance review, and assumptions.",
    },
  ];
}

export function getPhaseDeliverablePackageContract(args: {
  artifact: DeliverableKey;
  phase: number;
}): PhaseDeliverablePackageContract {
  const artifactKey = String(args.artifact);
  const isP1Charter =
    args.phase === 1 || artifactKey === "program_charter" || artifactKey === "charter";
  const outputs = isP1Charter
    ? p1CharterOutputs()
    : args.artifact === "business_case"
      ? businessCaseOutputs(baseOutputs())
      : baseOutputs();
  const isP2CurrentState =
    args.phase === 2 || args.artifact === "discovery_report" || args.artifact === "root_cause_worksheet";

  return {
    artifact: args.artifact,
    phase: args.phase,
    formalEditableRecordRequired: true,
    primaryEditableRecordLabel: isP1Charter
      ? "P1 Charter Brief / Decision Record"
      : isP2CurrentState
      ? "Current State Process and Diagnostic Word Document"
      : "Editable Phase Deliverable Word Document",
    outputs,
    wordDocumentSections: isP1Charter
      ? P1_CHARTER_SECTIONS
      : isP2CurrentState
        ? p2CurrentStateSections()
        : DEFAULT_WORD_SECTIONS,
    requiredWorkshopEvidence: isP1Charter
      ? P1_CHARTER_EVIDENCE
      : isP2CurrentState
        ? p2WorkshopEvidence()
        : DEFAULT_WORKSHOP_EVIDENCE,
    provenanceRules: isP1Charter ? P1_CHARTER_PROVENANCE_RULES : DEFAULT_PROVENANCE_RULES,
  };
}

export function renderPhaseDeliverablePackagePrompt(args: {
  artifact: DeliverableKey;
  phase: number;
}): string {
  const contract = getPhaseDeliverablePackageContract(args);
  const outputs = contract.outputs
    .map(
      (output) =>
        `- ${output.clientFacingLabel} (${output.kind}) — ${output.required ? "required" : "optional"}: ${output.purpose}`,
    )
    .join("\n");
  const wordSections = contract.wordDocumentSections.map((section) => `- ${section}`).join("\n");
  const workshopEvidence = contract.requiredWorkshopEvidence.map((item) => `- ${item}`).join("\n");
  const provenanceRules = contract.provenanceRules.map((rule) => `- ${rule}`).join("\n");

  const isP1Charter =
    contract.phase === 1 ||
    String(contract.artifact) === "program_charter" ||
    String(contract.artifact) === "charter";
  const wordStandard = isP1Charter
    ? `P1 charter standard:
This is a concise governed charter brief / decision record, not a discovery report, board deck, solution architecture, roadmap, estimate, or implementation plan. Target 2-4 pages / 700-1,200 words. Do not include a table of contents, long appendix, narrative arc, current-state diagnosis, target-state design, detailed risks, detailed RACI, roadmap, financial ranges, or operating model unless approved evidence already exists. State unknowns as "To validate in P2" and keep every client-specific fact tied to P0 answers or approved evidence.`
    : `Word document standard:
The phase-end deliverable must have an editable Word-equivalent record. The HTML artifact is the visual review companion, not the only deliverable. Write the artifact with document-grade structure so it can be exported cleanly to Word with headings, TOC-ready sections, executive summary, storyline, narrative arc, tables, appendices, review notes, and client-editable language. Important deliverables must read like a human-authored consulting document: clear setup, evidence-backed diagnosis, implications, decision points, and next actions.`;

  return `PHASE DELIVERABLE PACKAGE CONTRACT
Formal editable record: ${contract.primaryEditableRecordLabel}

Required output package:
${outputs}

${wordStandard}

Required Word-equivalent sections:
${wordSections}

Required workshop/session evidence:
${workshopEvidence}

Provenance rules:
${provenanceRules}

For process flows, handoff maps, architecture diagrams, charts, and tables generated by AbarVa, use this client-facing provenance label: "AbarVa-generated visualization derived from client-loaded evidence."`;
}
