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
  | { kind: "flow"; nodes: string[]; fullNodes?: string[]; annotation?: string }
  | { kind: "architecture"; layers: { name: string; items: string[]; fullItems?: string[] }[]; governance: string }
  | { kind: "bars"; items: { label: string; value: ReferenceFigure; magnitude: number }[] }
  | { kind: "timeline"; quarters: string[]; rows: { label: string; from: number; to: number; cost?: ReferenceFigure }[]; today: number; commit: number }
  | { kind: "gap"; title: string; detail: string; nextAction: string; compact?: boolean }
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
  /** Governed figures substituted into titles, answer bars or notes. */
  narrativeFigures?: ReferenceFigure[];
  /** Subset substituted into visible title or answer text; notes-only figures stay in narrativeFigures. */
  visibleNarrativeFigures?: ReferenceFigure[];
  /** Human-readable governed sources for substituted narrative slots. */
  narrativeSourceLabels?: string[];
  /** Exact governed source keys used in this slide, including narrative claims. */
  sourceIds?: string[];
  /** Server-derived availability and counting basis, never model-authored. */
  narrativeEvidence?: ReferenceNarrativeEvidence;
}

export interface ReferenceNarrativeEvidence {
  valueAvailable?: boolean;
  estimateAvailable?: boolean;
  /** Whether the approved AI-assisted scenario saves anything the slide can cite; set only for the slide that shows it. */
  aiScenarioAvailable?: boolean;
  baselineAvailable?: boolean;
  acceptedOwnersAvailable?: boolean;
  publicSourcesAvailable?: boolean;
  activeCount?: string;
  openCount?: string;
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

/** Human-readable source line; exact IDs remain in notes and the figure ledger. */
export function referenceSourceLine(slide: ReferenceSlide): string {
  const ids = slide.sourceIds ?? [];
  if (!ids.length) return "";
  const groups: string[] = [];
  const engine = ids.filter((id) => id.startsWith("engine:"));
  const rom = ids.filter((id) => id.startsWith("rom:"));
  const assumptions = ids.filter((id) => id.startsWith("[A:"));
  const publicSources = ids.filter((id) => id.startsWith("[S:"));
  const capture = ids.filter((id) => /^evidence:P[1-5]:/.test(id));
  const registerMetrics = ids.filter((id) => id.startsWith("evidence:register_"));
  const publicMetrics = ids.filter((id) => id.startsWith("evidence:approved_public_"));
  const missing = ids.filter((id) => id.startsWith("gap:"));
  if (engine.length) groups.push("Calculated value figures");
  if (rom.length) groups.push("Approved delivery estimate");
  if (assumptions.length || registerMetrics.length) groups.push("Working assumptions");
  if (publicSources.length || publicMetrics.length) groups.push("Published sources");
  if (capture.length) groups.push("Workshop evidence");
  if (missing.length) groups.push("Inputs to confirm");
  const known = new Set([...engine, ...rom, ...assumptions, ...publicSources, ...capture, ...registerMetrics, ...publicMetrics, ...missing]);
  if (ids.some((id) => !known.has(id))) groups.push("Supporting evidence");
  return `Sources: ${[...new Set(groups)].join(" · ")}.`;
}

const CLIENT_INTERNAL_TERMS: Array<[string, RegExp]> = [
  ["slot", /\bslots?\b/i], ["readback", /\breadbacks?\b/i],
  ["capture", /\bcaptur(?:e[ds]?|ing)\b/i], ["governed gap", /\bgoverned\s+gaps?\b/i],
  ["register row", /\bregister\s+rows?\b/i], ["step reference", /\bP[0-5](?:\s+Step\s+\d+)?\b/i],
  ["Move", /\bMove\b/i], ["flag", /\bflags?\b/i],
  ["preview", /\bpreviews?\b/i], ["snapshot ID", /\bsnapshot\s+id\b/i],
  ["ROM", /\bROM\b/i], ["value engine", /\bvalue[ -]engine\b/i],
  ["role setup instruction", /\b(?:role alias only|no real person|external email|synthetic role contact)\b/i],
  ["edition instruction", /\b(?:this|the)\s+edition\s+(?:requires|allows|forbids|uses)\b/i],
  ["source feed configuration", /\bpublic source access\b.*\b(?:this|the|current)\s+configuration\b/i],
  ["layout label", /\b(?:cover|divider|one page|big number context|plain english table|flow today|one step value)\s*:/i],
];

export function clientCopyIssue(value: string): string | null {
  const prose = value.replace(/\s+/g, " ");
  return CLIENT_INTERNAL_TERMS.find(([, pattern]) => pattern.test(prose))?.[0] ?? null;
}

// A claim the evidence cannot support is refused only where it is asserted. The
// same words framed as an absence or a precondition ("until a measured baseline
// is agreed", "the measured baseline has not been confirmed") are the honest form
// the repair instruction asks for. The frame must sit in the claim's own clause,
// and a condition must come before the claim, so "no objection, and the measured
// baseline is confirmed" is still an assertion.
const ABSENCE_FRAME = /\b(?:has|have|is|are|was|were)(?:\s+not|n't)\s+(?:yet\s+)?(?:been\s+)?(?:measured|verified|confirmed|agreed|accepted|assigned|mapped|established|available|in place)\b|\b(?:unconfirmed|unverified|unmeasured|unassigned|unaccepted|pending|prerequisite|precondition)\b/i;
const CONDITION_FRAME = /\b(?:no|without|until|unless|before|once|only\s+(?:after|when|once)|needs?|requires?|must|depends\s+on|subject\s+to)\b/i;

function assertsClaim(sentence: string, claim: RegExp): boolean {
  return sentence.split(/\s*[,;:\u2013\u2014]\s*/).some((clause) => {
    const match = claim.exec(clause);
    return Boolean(match) && !ABSENCE_FRAME.test(clause) && !CONDITION_FRAME.test(clause.slice(0, match!.index));
  });
}

/** Refuse a completed-evidence claim when its governed basis is missing. */
export function referenceNarrativeIssue(prose: string, evidence?: ReferenceNarrativeEvidence): string | null {
  if (!evidence) return null;
  const sentences = prose.replace(/\s+/g, " ").split(/[.!?]\s+/);
  const unavailable = /\b(?:unavailable|missing|not yet|to confirm|still needs?|needs? confirmation|awaits? confirmation)\b/i;
  const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const sentence of sentences) {
    if (evidence.activeCount && evidence.activeCount !== evidence.openCount) {
      const quantity = `(?<![\\w])${escaped(evidence.activeCount)}(?![\\w])`;
      if (new RegExp(`${quantity}\\s+(?:[A-Za-z-]+\\s+){0,4}(?:open|outstanding|unreviewed|unconfirmed)\\b`, "i").test(sentence)
        || new RegExp(`\\b(?:open|outstanding|unreviewed|unconfirmed)\\s+(?:[A-Za-z-]+\\s+){0,4}${quantity}`, "i").test(sentence))
        return "active_count_as_open";
    }
    if (evidence.publicSourcesAvailable === false && /\bno\s+source\b|\ball\s+(?:figures|references|sources)\s+(?:remain|are)\s+provisional\b/i.test(sentence))
      return "public_source_scope";
    if (unavailable.test(sentence)) continue;
    if (/^(?:Confirm|Review|Agree|Establish|Identify|Assess|Check|Validate|Resolve|Discuss|Obtain)\b/i.test(sentence.trim())
      && !/\b(?:this|that)\s+(?:figure|estimate|amount|total)\b/i.test(sentence)) continue;
    // Like the baseline and owner rules below: a prerequisite ("needs an approved
    // estimate", "until the annual value is confirmed") states the gap honestly.
    if (evidence.valueAvailable === false && assertsClaim(sentence, /\b(?:this|that|the)\s+(?:(?:measured|approved|current|annual|credited|working|counted|confirmed|three-year|current-state)\s+){0,3}(?:figure|value|amount|total)\b/i))
      return "unavailable_value_claim";
    if (evidence.estimateAvailable === false && assertsClaim(sentence, /\b(?:this|that)\s+(?:figure|estimate|amount)\b|\b(?:the|an?)\s+(?:approved|current|plan-basis)\s+(?:delivery\s+)?estimate\b/i))
      return "unavailable_estimate_claim";
    if (evidence.aiScenarioAvailable === false && /\bAI[- ]assist(?:ed|ance)\b/i.test(sentence)
      && /\b(?:would|could|will|can|saves?|cuts?|reduces?|shortens?|lowers?)\b/i.test(sentence))
      return "unavailable_ai_scenario_claim";
    if (evidence.baselineAvailable === false && assertsClaim(sentence, /\b(?:measured|verified|confirmed|source-verified)\s+(?:current-state\s+)?baseline\b|\bbaseline\s+(?:has been|is|was)\s+(?:measured|verified|confirmed)\b/i))
      return "unavailable_baseline_claim";
    if (evidence.acceptedOwnersAvailable === false
      && assertsClaim(sentence, /\b(?:has|have|is|are|was|were|already)\s+(?:been\s+)?(?:mapped|assigned|accepted|agreed|confirmed)\b/i)
      && /\b(?:owners?|users?|decision|authority|accountability)\b/i.test(sentence))
      return "unaccepted_owner_claim";
    if (evidence.publicSourcesAvailable === false
      && (/\b(?:every|all|each)\b.*\b(?:claim|assertion|figure|evidence)\b.*\b(?:traces?|supported|underpinned|approved|citations?)\b/i.test(sentence)
        || /\b(?:approved|confirmed)\s+(?:public\s+|published\s+)?(?:sources?|citations?)\b.*\b(?:support|underpin|prove)\b/i.test(sentence)))
      return "unavailable_public_source_claim";
    if (evidence.publicSourcesAvailable !== undefined
      && /\b(?:every|all|each)\b.*\b(?:factual claim|case fact|figure)\b.*\b(?:traces?|supported|underpinned)\b.*\b(?:public|published|citations?)\b/i.test(sentence))
      return "public_source_scope";
  }
  return null;
}

export function coverUsesEditionRule(title: string): boolean {
  return /\bvalidate\s+the\s+need\s*;/i.test(title)
    || (/\b(?:no|exclude[sd]?|omit(?:s|ted)?|without)\b/i.test(title)
      && ["solution", "plan", "cost"].every((term) => new RegExp(`\\b${term}\\b`, "i").test(title)));
}

export function answerIsCountDump(answer: string): boolean {
  return /\b(?:number|total)\s+(?:\d|[$€£¥₹])/i.test(answer)
    || /\b(?:rows?|citations?|owners?|sources?)\s+(?:number|total)\b/i.test(answer);
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
  if (blocks.some((block) => block.kind === "gap")) return [];
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
    case "contents":
      rows(3, 5);
      if (table?.rows.some((row, index) => !new RegExp(`^0?${index + 1}\\s`).test(String(row[0] ?? ""))))
        gaps.push("needs five numbered sections");
      if (table?.rows.some((row) => typeof row[1] !== "string" || row[1].trim().split(/\s+/).length < 5 || row[1].includes("\n") || !String(row[2] ?? "").trim()))
        gaps.push("needs a one-line answer and slide numbers for every section");
      break;
    case "big_number_context": tiles(3); if (!text) gaps.push("needs a narrative panel"); break;
    case "plain_english_table": rows(4, 1); break;
    case "flow_today": if (!blocks.some((block) => block.kind === "flow" && block.nodes.length >= 3 && block.fullNodes?.length === block.nodes.length)
      || !slide.sourceIds?.some((id) => id.startsWith("evidence:"))) gaps.push("needs source-linked current handoffs"); break;
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
  detailCode?: string;
}

/** Refusal metadata excludes source values, authored prose and finding messages. */
export class ReferenceDeckLineageRefusal extends Error {
  readonly findings: { kind: "reference_lineage"; slide: number; code: string; detailCode: string }[];

  constructor(blocked: readonly ReferenceDeckFinding[]) {
    super(`reference_deck_lineage_refusal: ${blocked.map((item) => `${item.slide}:${item.code}`).join(",")}`);
    this.name = "ReferenceDeckLineageRefusal";
    this.findings = blocked.map(({ slide, code, detailCode }) => ({ kind: "reference_lineage", slide, code, detailCode: detailCode ?? code }));
  }
}

function blockFiguresOnSlide(slide: ReferenceSlide): ReferenceFigure[] {
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

export function figuresOnSlide(slide: ReferenceSlide): ReferenceFigure[] {
  return [...(slide.narrativeFigures ?? []), ...blockFiguresOnSlide(slide)];
}

export function visibleFiguresOnSlide(slide: ReferenceSlide): ReferenceFigure[] {
  return [...(slide.visibleNarrativeFigures ?? slide.narrativeFigures ?? []), ...blockFiguresOnSlide(slide)];
}

export function validateReferenceDeck(spec: ReferenceDeckSpec): ReferenceDeckFinding[] {
  const findings: ReferenceDeckFinding[] = [];
  const add = (slide: number, code: string, message: string, blocking = false, detailCode?: string) =>
    findings.push({ slide, code, message, blocking, ...(detailCode ? { detailCode } : {}) });
  const count = spec.slides.length;
  const ledger = new Set(spec.figureLedger.map((figure) =>
    `${figure.sourceId}\u0000${figure.workbookCell}\u0000${figure.display}`));
  const band = spec.edition === "validation" ? [10, 12] : [20, 26];
  if (count < band[0] || count > band[1])
    add(0, "edition_count", `${spec.edition} edition has ${count} slides; expected ${band[0]}–${band[1]}.`);
  if (spec.slides[0]?.archetype !== "cover") add(1, "cover", "The first slide must be a cover.");
  if (spec.slides[0]?.actionTitle !== spec.useCase)
    add(1, "cover_use_case", "The cover title must be the use-case name.", true);
  if (coverUsesEditionRule(spec.slides[0]?.actionTitle ?? ""))
    add(1, "cover_edition_rule", "The edition rule cannot appear in the cover title.", true);

  spec.slides.forEach((slide, index) => {
    const n = index + 1;
    const content = slide.archetype !== "cover" && slide.archetype !== "divider";
    const figures = figuresOnSlide(slide);
    const required = REQUIRED_BLOCK[slide.archetype];
    if (required && !slide.blocks.some((block) => block.kind === required || block.kind === "gap"))
      add(n, "archetype_body", `${slide.archetype} needs an editable ${required} block.`);
    for (const gap of referenceArchetypeGaps(slide, spec.edition))
      add(n, "archetype_completeness", `${slide.archetype} ${gap}.`);
    if (content && !slide.section) add(n, "section", "Content slide has no section.");
    if (content && spec.edition === "validation" && slide.section === "VALIDATE")
      add(n, "section", "Validation edition uses CONFIRM, not VALIDATE.");
    if (content && (!slide.answerLabel?.trim() || !slide.answer?.trim()))
      add(n, "answer_bar", "Content slide needs a labelled answer bar.");
    if (content && answerIsCountDump(slide.answer ?? ""))
      add(n, "answer_count_dump", "The answer bar lists a count without interpreting it.");
    if (!slide.speakerNotes?.startsWith("The point:") || !/(How to read:|Method:)/.test(slide.speakerNotes))
      add(n, "notes", "Business-case slide needs The point and a reading method.");
    if (content && (slide.actionTitle.trim().split(/\s+/).length < 5 || /[.!?]\s+\S/.test(slide.actionTitle)))
      add(n, "action_title", "Action title should be one full sentence, not a topic label.");
    if (spec.edition === "validation" && (VALIDATION_EXCLUDED.has(slide.archetype) || (index > 0 && VALIDATION_FORBIDDEN.test([slide.actionTitle, slide.answer, slide.speakerNotes, ...slide.blocks.flatMap((block) => block.kind === "text" ? block.lines : [])].join(" ")))))
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
        case "table": return [...block.columns, ...block.rows.flatMap((row) => row.filter((cell, column): cell is string =>
          typeof cell === "string" && !(slide.archetype === "contents" && (column === 0 || column === 2))))];
        case "metrics": return block.items.flatMap((item) => [item.label, item.meaning, ...(typeof item.value === "string" ? [item.value] : [])]);
        case "flow": return [...block.nodes, block.annotation ?? ""];
        case "architecture": return [...block.layers.flatMap((layer) => [layer.name, ...layer.items]), block.governance];
        case "bars": return block.items.map((item) => item.label);
        case "timeline": return [...block.quarters, ...block.rows.map((row) => row.label)];
        case "gap": return [block.title, block.detail, block.nextAction];
        case "text": return block.lines;
      }
    });
    const clientText = [slide.actionTitle, slide.answer ?? "", ...blockProse, referenceSourceLine(slide)].join(" ");
    const narrativeIssue = referenceNarrativeIssue(`${slide.actionTitle}. ${slide.answer ?? ""}`, slide.narrativeEvidence);
    if (narrativeIssue) add(n, "unsupported_narrative", `Client-facing interpretation violates its evidence basis: ${narrativeIssue}.`, true, narrativeIssue);
    const internalTerm = clientCopyIssue(clientText);
    if (internalTerm) add(n, "client_copy_term", `Client-facing text contains internal term: ${internalTerm}.`, true);
    if (coverUsesEditionRule(clientText))
      add(n, "edition_rule_visible", "The edition rule cannot appear in client-facing text.", true);
    for (const block of slide.blocks) {
      if (block.kind !== "flow" || !block.fullNodes) continue;
      block.nodes.forEach((label, nodeIndex) => {
        if (!label.endsWith("…")) return;
        const prefix = label.slice(0, -1);
        const full = block.fullNodes?.[nodeIndex] ?? "";
        if (!full.startsWith(prefix) || !/^\s/.test(full.slice(prefix.length)))
          add(n, "flow_midword", "A flow label was cut inside a word.");
      });
    }
    // Every visible amount or date must match a typed figure on this slide.
    const figureTokens = new Set(figures.flatMap((figure) => factTokens(figure.display)));
    for (const token of factTokens([slide.actionTitle, slide.answer ?? "", slide.speakerNotes ?? "", ...blockProse].join(" "))) {
      if (content && !figureTokens.has(token))
        add(n, "unbound_prose_figure", `Figure ${token} in slide prose has no typed binding.`, true);
    }
  });
  return findings;
}
