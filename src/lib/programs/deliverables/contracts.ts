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
  label: "P1 Charter Brief",
  audience:
    "executive sponsor, operating owner, technology/data owner, finance/risk owner, and phase-gate approver",
  confidentiality: "Confidential — P1 gate decision record",
  sections: [
    {
      id: "exec_summary",
      title: "Charter Summary",
      purpose:
        "The approved P0 bet, why it matters, and the P1 decision being recorded",
      mode: "auto_governed",
      authored: true,
      qualityCriteria:
        "Maximum 150 words. Use only P0-captured or approved-evidence facts. If a current-state fact is not proved, say 'To validate in P2.'",
    },
    {
      id: "at_a_glance",
      title: "Charter At-a-Glance",
      purpose: "One concise table of the decision record",
      mode: "auto_governed",
      authored: true,
      ...T(["Field", "P1 record", "Evidence / caveat"]),
      qualityCriteria:
        "Rows: Move, problem/opportunity, pattern, sponsor/title, scope, value hypothesis, P2 evidence plan, next decision. Do not add rows that imply P2 discovery has already happened.",
    },
    {
      id: "problem",
      title: "Problem and Value Hypothesis",
      purpose:
        "Problem statement and directional success criteria carried forward from P0",
      mode: "auto_governed",
      authored: true,
      qualityCriteria:
        "Do not provide baselines, targets, financial ranges, or quantified impact unless they are in evidence. Use directional language and mark metrics as P2 validation items.",
    },
    {
      id: "governance",
      title: "Sponsor, Scope, and Decision Rights",
      purpose: "Title/role accountability and first-slice boundary",
      mode: "auto_governed",
      authored: true,
      ...T(["Decision area", "Role / title", "P1 status", "P2 validation needed"]),
      qualityCriteria:
        "Use role/title only. Do not invent named people. Keep scope in/out explicit and push detailed operating model, architecture, and roadmap decisions to later phases.",
    },
    {
      id: "p2_plan",
      title: "P2 Evidence Plan and Gate Decision",
      purpose: "What Discovery must validate before design or roadmap work",
      mode: "auto_governed",
      authored: true,
      ...T(["Evidence family", "Why needed", "Owner role", "Status"]),
      qualityCriteria:
        "This is the close: approve the charter only as permission to run P2 Discovery. Do not recommend a solution approach, architecture, operating model, roadmap, or estimate here.",
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
