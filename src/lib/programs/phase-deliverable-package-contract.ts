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
  const outputs = args.artifact === "business_case" ? businessCaseOutputs(baseOutputs()) : baseOutputs();
  const isP2CurrentState =
    args.phase === 2 || args.artifact === "discovery_report" || args.artifact === "root_cause_worksheet";

  return {
    artifact: args.artifact,
    phase: args.phase,
    formalEditableRecordRequired: true,
    primaryEditableRecordLabel: isP2CurrentState
      ? "Current State Process and Diagnostic Word Document"
      : "Editable Phase Deliverable Word Document",
    outputs,
    wordDocumentSections: isP2CurrentState ? p2CurrentStateSections() : DEFAULT_WORD_SECTIONS,
    requiredWorkshopEvidence: isP2CurrentState ? p2WorkshopEvidence() : DEFAULT_WORKSHOP_EVIDENCE,
    provenanceRules: DEFAULT_PROVENANCE_RULES,
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

  return `PHASE DELIVERABLE PACKAGE CONTRACT
Formal editable record: ${contract.primaryEditableRecordLabel}

Required output package:
${outputs}

Word document standard:
The phase-end deliverable must have an editable Word-equivalent record. The HTML artifact is the visual review companion, not the only deliverable. Write the artifact with document-grade structure so it can be exported cleanly to Word with headings, TOC-ready sections, executive summary, storyline, narrative arc, tables, appendices, review notes, and client-editable language. Important deliverables must read like a human-authored consulting document: clear setup, evidence-backed diagnosis, implications, decision points, and next actions.

Required Word-equivalent sections:
${wordSections}

Required workshop/session evidence:
${workshopEvidence}

Provenance rules:
${provenanceRules}

For process flows, handoff maps, architecture diagrams, charts, and tables generated by AbarVa, use this client-facing provenance label: "AbarVa-generated visualization derived from client-loaded evidence."`;
}
