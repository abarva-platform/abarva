import type { ArchitectureDeckPage } from "./architecture-deck-composition";

/** Physical page budget for a governed architecture readout. Section dividers
 * are bands on the first visual page in each run, not pages of their own. */
export const ARCHITECTURE_DECK_BUDGET = {
  narrativeTable: 6,
  architectureBody: 8,
  core: 16,
  appendixTarget: 8,
  appendixMaximum: 11,
  physical: 27,
} as const;

export interface ArchitectureDeckPlan {
  cover: 1;
  narrativeTable: number;
  architectureBody: number;
  closing: 1;
  referenceAppendix: number;
  core: number;
  total: number;
  overflow: number;
  warning?: string;
}

const visualPages = (pages: readonly ArchitectureDeckPage[]) =>
  pages.filter((page) => page.kind !== "divider");

export function planArchitectureDeck(args: {
  narrativePages: number;
  tablePages: number;
  body: readonly ArchitectureDeckPage[];
  appendix: readonly ArchitectureDeckPage[];
  flowEdges?: number;
}): ArchitectureDeckPlan {
  const narrativeTable = args.narrativePages + args.tablePages;
  const body = visualPages(args.body);
  const appendix = visualPages(args.appendix);
  const architectureBody = body.length;
  const referenceAppendix = appendix.length;
  const core = 1 + narrativeTable + architectureBody + 1;
  const total = core + referenceAppendix;
  const overflow = Math.max(0, total - ARCHITECTURE_DECK_BUDGET.physical);
  const plan: ArchitectureDeckPlan = {
    cover: 1,
    narrativeTable,
    architectureBody,
    closing: 1,
    referenceAppendix,
    core,
    total,
    overflow,
  };

  if (
    narrativeTable > ARCHITECTURE_DECK_BUDGET.narrativeTable ||
    architectureBody > ARCHITECTURE_DECK_BUDGET.architectureBody ||
    core > ARCHITECTURE_DECK_BUDGET.core ||
    referenceAppendix > ARCHITECTURE_DECK_BUDGET.appendixMaximum ||
    total > ARCHITECTURE_DECK_BUDGET.physical
  ) {
    const surplus = Math.max(
      overflow,
      narrativeTable - ARCHITECTURE_DECK_BUDGET.narrativeTable,
      architectureBody - ARCHITECTURE_DECK_BUDGET.architectureBody,
      core - ARCHITECTURE_DECK_BUDGET.core,
      referenceAppendix - ARCHITECTURE_DECK_BUDGET.appendixMaximum,
    );
    const cause = [...body, ...appendix]
      .map((page) => page.visual.id)
      .join(", ");
    const flowCause =
      args.flowEdges === undefined
        ? ""
        : ` flow pages E=${args.flowEdges} requiring ceil(E/12)=${Math.ceil(args.flowEdges / 12)} pages;`;
    throw new Error(
      `DECK PLAN REFUSED — exceeds physical budget cover=1 narrative_table=${narrativeTable} architecture_body=${architectureBody} closing=1 reference_appendix=${referenceAppendix} core=${core} total=${total} physical_limit=${ARCHITECTURE_DECK_BUDGET.physical} overflow=${overflow} cause: governed visual ids [${cause}];${flowCause} action: move ${surplus} governed pages to a bound companion Architecture Reference Appendix; retain all edges; recount.`,
    );
  }
  if (total > 24) {
    plan.warning = `DECK PLAN OVERFLOW — appendix uses ${referenceAppendix} pages; total=${total}/27. Keep the 16-page core fixed and retain every governed visual.`;
  }
  return plan;
}
