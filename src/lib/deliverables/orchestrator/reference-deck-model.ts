// Native, editable Move deck contract. The caller supplies governed figures;
// presentation code never estimates or invents them.

import { factTokens } from "./numeric-lineage-tokens";

export const REFERENCE_ARCHETYPES = [
  "cover", "one_page", "contents", "divider", "big_number_context",
  "plain_english_table", "flow_today", "one_step_value", "three_year_value",
  "assumptions", "value_ledger", "users_decisions", "target_state",
  "channels", "releases", "shared_foundation", "client_needs",
  "ai_options", "next_steps", "rom_hours", "team", "sources",
] as const;
export type ReferenceArchetype = (typeof REFERENCE_ARCHETYPES)[number];
export type ReferenceEdition = "validation" | "investment";
export type ReferenceSection = "CONTEXT" | "WHAT" | "WHY" | "VALIDATE" | "CONFIRM" | "HOW";

export interface ReferenceFigure {
  display: string;
  /** A value-engine, ROM, register, evidence or approved public-source key. */
  sourceId: string;
  /** Cell in the companion workbook that carries this exact working figure. */
  workbookCell: string;
}
export type ReferenceCell = string | ReferenceFigure;

export type ReferenceBlock =
  | { kind: "table"; columns: string[]; rows: ReferenceCell[][]; decisiveRows?: number[] }
  | { kind: "metrics"; items: { label: string; value: ReferenceCell; meaning: string }[] }
  | { kind: "flow"; nodes: string[]; annotation?: string }
  | { kind: "architecture"; layers: { name: string; items: string[] }[]; governance: string }
  | { kind: "bars"; items: { label: string; value: ReferenceFigure; magnitude: number }[] }
  | { kind: "timeline"; quarters: string[]; rows: { label: string; from: number; to: number; cost?: ReferenceFigure }[]; today: number; commit: number }
  | { kind: "gap"; title: string; detail: string; nextAction: string }
  | { kind: "text"; lines: string[] };

export interface ReferenceSlide {
  archetype: ReferenceArchetype;
  section?: ReferenceSection;
  actionTitle: string;
  answerLabel?: string;
  answer?: string;
  /** Must begin with The point: and also explain the exhibit or method. */
  speakerNotes?: string;
  blocks: ReferenceBlock[];
  /** Exact governed source keys used in this slide, including narrative claims. */
  sourceIds?: string[];
}

export interface ReferenceDeckSpec {
  edition: ReferenceEdition;
  client: string;
  program: string;
  useCase: string;
  sponsorRole: string;
  monthYear: string;
  sourcesCheckedTo: string;
  /** Exact source labels, keyed by governed identifier. */
  sources: Record<string, string>;
  /** Server-built from governed inputs and the companion workbook, never model-authored. */
  figureLedger: ReferenceFigure[];
  slides: ReferenceSlide[];
}

const REQUIRED_BLOCK: Partial<Record<ReferenceArchetype, ReferenceBlock["kind"]>> = {
  one_page: "metrics", contents: "table", big_number_context: "metrics",
  plain_english_table: "table", flow_today: "flow", one_step_value: "table",
  three_year_value: "table", assumptions: "table", value_ledger: "table",
  users_decisions: "table", target_state: "architecture", channels: "table",
  releases: "timeline", shared_foundation: "metrics", client_needs: "table",
  ai_options: "text", next_steps: "table", rom_hours: "table",
  team: "table", sources: "table",
};

const VALIDATION_EXCLUDED = new Set<ReferenceArchetype>([
  "users_decisions", "target_state", "channels", "releases", "shared_foundation",
  "ai_options", "rom_hours", "team",
]);
const VALIDATION_FORBIDDEN = /\b(cost|rom|roi|investment|solution|plan|roadmap|release)\b/i;
const CELL_REF = /^(?:'[^']+'!|[A-Za-z_][\w ]*!|)[A-Z]+[1-9]\d*$/;
const SOURCE_REF = /^(?:\[A:(?:DL|V|D|A)[1-9]\d*\]|\[S:[1-9]\d*\]|(?:engine|rom|evidence):[A-Za-z0-9_.:-]+)$/;

/** Exhibit completeness checks. A generic table must not score as every archetype. */
export function referenceArchetypeGaps(slide: ReferenceSlide, edition: ReferenceEdition): string[] {
  const blocks = slide.blocks;
  const table = blocks.find((block) => block.kind === "table");
  const metrics = blocks.find((block) => block.kind === "metrics");
  const text = blocks.find((block) => block.kind === "text");
  const timeline = blocks.find((block) => block.kind === "timeline");
  const architecture = blocks.find((block) => block.kind === "architecture");
  const gaps: string[] = [];
  const rows = (columns: number, count: number) => {
    if (!table || table.columns.length < columns || table.rows.length < count)
      gaps.push(`needs a table with at least ${columns} columns and ${count} rows`);
  };
  const tiles = (count: number) => {
    if (!metrics || metrics.items.length < count) gaps.push(`needs at least ${count} KPI tiles`);
  };
  switch (slide.archetype) {
    case "one_page": tiles(edition === "validation" ? 3 : 4); if (!text || text.lines.length < 3) gaps.push("needs validation conditions and the ask"); break;
    case "contents": rows(2, 5); break;
    case "big_number_context": tiles(3); if (!text) gaps.push("needs a narrative panel"); break;
    case "plain_english_table": rows(4, 1); break;
    case "flow_today": if (!blocks.some((block) => block.kind === "flow" && block.nodes.length >= 3)) gaps.push("needs a source-to-decision flow"); break;
    case "one_step_value": rows(4, 1); if (!blocks.some((block) => block.kind === "bars")) gaps.push("needs the threshold band"); break;
    case "three_year_value": rows(edition === "validation" ? 4 : 5, 4); if (!blocks.some((block) => block.kind === "bars")) gaps.push("needs a year-by-year value chart"); break;
    case "assumptions": rows(5, 1); if (!table?.decisiveRows?.length) gaps.push("needs at least one decisive shaded row"); break;
    case "value_ledger": rows(6, 2); break;
    case "users_decisions": rows(5, 1); break;
    case "target_state": if (!architecture || architecture.layers.length < 6) gaps.push("needs the full source-to-use architecture"); break;
    case "channels": rows(5, 1); break;
    case "releases": if (!timeline || timeline.rows.length < 2) gaps.push("needs sequenced releases and a foundation band"); break;
    case "shared_foundation": tiles(2); break;
    case "client_needs": rows(3, 1); break;
    case "ai_options": if (!text || text.lines.length < 3) gaps.push("needs candidate, value and prerequisites"); break;
    case "next_steps": rows(3, 2); break;
    case "rom_hours": rows(8, 2); break;
    case "team": rows(4, 1); break;
    case "sources": rows(2, 3); break;
  }
  return gaps;
}

export interface ReferenceDeckFinding {
  slide: number;
  code: string;
  message: string;
  blocking: boolean;
}

export function figuresOnSlide(slide: ReferenceSlide): ReferenceFigure[] {
  const figures: ReferenceFigure[] = [];
  const take = (cell: ReferenceCell) => {
    if (typeof cell !== "string") figures.push(cell);
  };
  for (const block of slide.blocks) {
    if (block.kind === "table") block.rows.flat().forEach(take);
    if (block.kind === "metrics") block.items.forEach((item) => take(item.value));
    if (block.kind === "bars") block.items.forEach((item) => figures.push(item.value));
    if (block.kind === "timeline") block.rows.forEach((row) => row.cost && figures.push(row.cost));
  }
  return figures;
}

export function validateReferenceDeck(spec: ReferenceDeckSpec): ReferenceDeckFinding[] {
  const findings: ReferenceDeckFinding[] = [];
  const add = (slide: number, code: string, message: string, blocking = false) =>
    findings.push({ slide, code, message, blocking });
  const count = spec.slides.length;
  const ledger = new Set(spec.figureLedger.map((figure) =>
    `${figure.sourceId}\u0000${figure.workbookCell}\u0000${figure.display}`));
  const band = spec.edition === "validation" ? [10, 12] : [20, 26];
  if (count < band[0] || count > band[1])
    add(0, "edition_count", `${spec.edition} edition has ${count} slides; expected ${band[0]}–${band[1]}.`);
  if (spec.slides[0]?.archetype !== "cover") add(1, "cover", "The first slide must be a cover.");
  if (spec.edition === "validation" && !/no solution, plan or cost/i.test(spec.slides[0]?.actionTitle ?? ""))
    add(1, "validation_disclosure", "The validation cover must say no solution, plan or cost.", true);

  spec.slides.forEach((slide, index) => {
    const n = index + 1;
    const content = slide.archetype !== "cover" && slide.archetype !== "divider";
    const figures = figuresOnSlide(slide);
    const required = REQUIRED_BLOCK[slide.archetype];
    if (required && !slide.blocks.some((block) => block.kind === required))
      add(n, "archetype_body", `${slide.archetype} needs an editable ${required} block.`);
    for (const gap of referenceArchetypeGaps(slide, spec.edition))
      add(n, "archetype_completeness", `${slide.archetype} ${gap}.`);
    if (content && !slide.section) add(n, "section", "Content slide has no section.");
    if (content && spec.edition === "validation" && slide.section === "VALIDATE")
      add(n, "section", "Validation edition uses CONFIRM, not VALIDATE.");
    if (content && (!slide.answerLabel?.trim() || !slide.answer?.trim()))
      add(n, "answer_bar", "Content slide needs a labelled answer bar.");
    if (!slide.speakerNotes?.startsWith("The point:") || !/(How to read:|Method:)/.test(slide.speakerNotes))
      add(n, "notes", "Business-case slide needs The point and a reading method.");
    if (content && (slide.actionTitle.trim().split(/\s+/).length < 5 || /[.!?]\s+\S/.test(slide.actionTitle)))
      add(n, "action_title", "Action title should be one full sentence, not a topic label.");
    if (spec.edition === "validation" && (VALIDATION_EXCLUDED.has(slide.archetype) || (index > 0 && VALIDATION_FORBIDDEN.test([slide.actionTitle, slide.answer, ...slide.blocks.flatMap((block) => block.kind === "text" ? block.lines : [])].join(" ")))))
      add(n, "edition_violation", "Validation edition cannot contain cost, plan or solution material.", true);
    const sourceIds = new Set(slide.sourceIds ?? []);
    for (const figure of figures) {
      if (!SOURCE_REF.test(figure.sourceId) || !spec.sources[figure.sourceId] || !sourceIds.has(figure.sourceId) || !CELL_REF.test(figure.workbookCell))
        add(n, "figure_source", `Figure ${figure.display} lacks a governed source and workbook cell on this slide.`, true);
      if (!ledger.has(`${figure.sourceId}\u0000${figure.workbookCell}\u0000${figure.display}`))
        add(n, "figure_ledger", `Figure ${figure.display} does not match the governed figure ledger.`, true);
      if (!figure.display.trim()) add(n, "figure_empty", "A figure has no display value.", true);
    }
    if (figures.length > 0 && sourceIds.size === 0)
      add(n, "source_line", "Figure slide needs a source line.", true);
    for (const sourceId of sourceIds) {
      if (!spec.sources[sourceId]) add(n, "unknown_source", `Unknown source ${sourceId}.`, true);
    }
    // A plain string in any exhibit must not introduce a new working figure.
    const blockProse = slide.blocks.flatMap((block) => {
      switch (block.kind) {
        case "table": return [...block.columns, ...block.rows.flat().filter((cell): cell is string => typeof cell === "string")];
        case "metrics": return block.items.flatMap((item) => [item.label, item.meaning, ...(typeof item.value === "string" ? [item.value] : [])]);
        case "flow": return [...block.nodes, block.annotation ?? ""];
        case "architecture": return [...block.layers.flatMap((layer) => [layer.name, ...layer.items]), block.governance];
        case "bars": return block.items.map((item) => item.label);
        case "timeline": return [...block.quarters, ...block.rows.map((row) => row.label)];
        case "gap": return [block.title, block.detail, block.nextAction];
        case "text": return block.lines;
      }
    });
    // Every visible amount or date must match a typed figure on this slide.
    const figureTokens = new Set(figures.flatMap((figure) => factTokens(figure.display)));
    for (const token of factTokens([slide.actionTitle, slide.answer ?? "", slide.speakerNotes ?? "", ...blockProse].join(" "))) {
      if (content && !figureTokens.has(token))
        add(n, "unbound_prose_figure", `Figure ${token} in slide prose has no typed binding.`, true);
    }
  });
  return findings;
}
