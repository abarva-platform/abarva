// =============================================================================
// Deliverable section contracts — the artifact standard the factory enforces.
// -----------------------------------------------------------------------------
// Each deliverable type declares an ordered list of sections, each with a MODE
// (auto-governed / auto-template / elicit / client-complete), whether it must
// carry a table (and the columns), and its citation/client-complete policy.
// The generator prompts Claude with this; the renderer lays it out; the quality
// gate validates against it. Reusable across Moves and Source deliverables.
// =============================================================================

export type SectionMode =
  | "auto_governed" // generated from governed evidence, cited
  | "auto_template" // standard advisory boilerplate, review-required
  | "elicit" // missing info — Nexus should ask
  | "client_complete"; // client/legal/procurement must confirm

export interface DeliverableSectionContract {
  id: string;
  title: string;
  purpose: string;
  mode: SectionMode;
  /** Authored by Claude (true) vs rendered by the factory (cover/register/etc). */
  authored: boolean;
  requiresTable?: boolean;
  tableColumns?: string[];
  /** Plain-English quality criteria injected into the prompt. */
  qualityCriteria?: string;
}

export interface DeliverableContract {
  deliverableType: string;
  label: string;
  audience: string;
  /** Confidentiality label for the cover/footers. */
  confidentiality: string;
  sections: DeliverableSectionContract[];
}

const T = (cols: string[]) => ({ requiresTable: true, tableColumns: cols });

export const PROGRAM_CHARTER_CONTRACT: DeliverableContract = {
  deliverableType: "program_charter",
  label: "Program Charter",
  audience:
    "CIO, CFO, CDAO, transformation leader, program sponsor, product/engineering leaders, steering committee",
  confidentiality: "Confidential — for client steering committee review",
  sections: [
    // Rendered by the factory (not Claude prose):
    {
      id: "cover",
      title: "Cover Page",
      purpose: "Identity + confidentiality + version",
      mode: "auto_template",
      authored: false,
    },
    {
      id: "revision",
      title: "Revision History",
      purpose: "Version control",
      mode: "auto_template",
      authored: false,
      ...T(["Version", "Date", "Changes", "Owner", "Approval status"]),
    },
    {
      id: "toc",
      title: "Contents",
      purpose: "Navigation",
      mode: "auto_template",
      authored: false,
    },
    // Authored by Claude (governed):
    {
      id: "exec_summary",
      title: "Executive Summary",
      purpose:
        "Business context, why now, decision required, key constraints, value thesis, scale-up blockers",
      mode: "auto_governed",
      authored: true,
      qualityCriteria:
        "Board-readable in isolation. Lead with the decision required. State the value thesis or flag it as an open item. Name the constraints that block scale-up.",
    },
    {
      id: "at_a_glance",
      title: "Charter At-a-Glance",
      purpose: "One-table snapshot of the program",
      mode: "auto_governed",
      authored: true,
      ...T(["Field", "Value"]),
      qualityCriteria:
        "Rows: Program, Sponsor, Accountable executive, Business owner, Technology owner, Phase, Expected outcome, Current readiness, Value hypothesis, Decision gates, Top risks, Next decision. Use [CLIENT TO COMPLETE: ...] where evidence is absent.",
    },
    {
      id: "problem",
      title: "Problem Statement & Opportunity",
      purpose:
        "Problem, in/out of scope, why current process is insufficient, why AI is relevant",
      mode: "auto_governed",
      authored: true,
    },
    {
      id: "objectives",
      title: "Strategic Objectives",
      purpose: "Objectives tied to measurable KPIs",
      mode: "auto_governed",
      authored: true,
      ...T([
        "Objective",
        "KPI",
        "Baseline",
        "Target",
        "Source [n]",
        "Owner",
        "Status",
      ]),
      qualityCriteria:
        "Where baseline/target values are not in evidence, use [VALUE TEAM TO CONFIRM: ...].",
    },
    {
      id: "current_state",
      title: "Current-State Evidence Summary",
      purpose: "What the committed evidence shows and its gaps",
      mode: "auto_governed",
      authored: true,
      ...T([
        "Evidence family",
        "Status",
        "Source [n]",
        "Confidence",
        "Implication",
        "Gaps",
      ]),
    },
    {
      id: "decision_rights",
      title: "Sponsor Commitment & Decision Rights",
      purpose: "Named decision gates and their owners",
      mode: "auto_governed",
      authored: true,
      ...T([
        "Decision right",
        "Owner",
        "Approval required",
        "Evidence [n]",
        "Implication",
        "Unresolved issue",
      ]),
    },
    {
      id: "raci",
      title: "Stakeholder & RACI",
      purpose: "Roles, responsibilities, decision rights",
      mode: "client_complete",
      authored: true,
      ...T([
        "Role",
        "Name / placeholder",
        "Responsibility",
        "Decision right",
        "Involvement",
        "Open issue",
      ]),
      qualityCriteria:
        "Use [CLIENT TO COMPLETE: name] for any role not named in evidence. Never invent names.",
    },
    {
      id: "scope",
      title: "Scope Definition",
      purpose: "In/out of scope, assumptions, dependencies",
      mode: "auto_governed",
      authored: true,
      ...T(["In scope", "Out of scope", "Assumptions", "Dependencies"]),
    },
    {
      id: "value",
      title: "Value Hypothesis",
      purpose:
        "Value categories, measurable outcomes, baseline evidence, missing value evidence",
      mode: "auto_governed",
      authored: true,
      ...T([
        "Value category",
        "Measurable outcome",
        "Baseline evidence [n]",
        "Status / gap",
      ]),
      qualityCriteria:
        "Do not invent financial ranges. Use [CLIENT TO CONFIRM: value target] where absent.",
    },
    {
      id: "phase_gates",
      title: "Delivery Approach & Phase Gates",
      purpose: "Phases with entry/exit criteria and approvers",
      mode: "auto_governed",
      authored: true,
      ...T([
        "Phase",
        "Objective",
        "Entry criteria",
        "Exit criteria",
        "Required evidence",
        "Approver",
      ]),
    },
    {
      id: "risks",
      title: "Risks, Issues & Dependencies",
      purpose: "Material risks with mitigations and owners",
      mode: "auto_governed",
      authored: true,
      ...T([
        "Risk / issue",
        "Severity",
        "Owner",
        "Mitigation",
        "Evidence [n]",
        "Status",
      ]),
    },
    {
      id: "client_complete",
      title: "Open Items / Client-to-Complete Checklist",
      purpose: "Everything the client must provide before scale-up",
      mode: "client_complete",
      authored: true,
      ...T(["Item", "Owner", "Why needed", "Required before", "Status"]),
    },
    {
      id: "recommendation",
      title: "Recommendation & Next Step",
      purpose:
        "Clear recommendation, what should/should not proceed, what Nexus asks next",
      mode: "auto_governed",
      authored: true,
      qualityCriteria:
        "End with an explicit 'Decision required' and a 'Do not proceed until' statement.",
    },
  ],
};

export const CONTRACTS: Record<string, DeliverableContract> = {
  program_charter: PROGRAM_CHARTER_CONTRACT,
};

export function getDeliverableContract(
  deliverableType: string,
): DeliverableContract | null {
  return CONTRACTS[deliverableType] ?? null;
}

/** Authored (Claude-written) section titles — used for required-section checks. */
export function authoredSectionTitles(c: DeliverableContract): string[] {
  return c.sections.filter((s) => s.authored).map((s) => s.title);
}

/** Authored sections that must carry a table. */
export function authoredTableSectionTitles(c: DeliverableContract): string[] {
  return c.sections
    .filter((s) => s.authored && s.requiresTable)
    .map((s) => s.title);
}
