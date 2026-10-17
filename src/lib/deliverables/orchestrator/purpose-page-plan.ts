import type {
  RenderableDeliverable,
  RenderableDeckSlide,
  RenderableTable,
  SourceRegisterEntry,
} from "./types";
import {
  referenceCellTextHeight,
  layoutReferenceTable,
} from "./reference-deck-layout";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { PhrasingContent } from "mdast";
import { purposeTypedTableRows } from "./purpose-number-display";
import {
  collapsePurposeCitations,
  purposeCitationIds,
  compactPurposeCitationIds,
} from "./purpose-citations";

export function purposeUpstreamReferences(
  source: Pick<SourceRegisterEntry, "upstreamReferences">,
  separator = "; ",
): string {
  const groups = new Map<
    string,
    { id: string; locators: Set<string>; status: string }
  >();
  for (const ref of source.upstreamReferences || []) {
    const status =
      ref.availability === "supplied" ? ref.sourceReferenceId! : "not supplied";
    const key = JSON.stringify([ref.id, status]);
    const group = groups.get(key) || {
      id: ref.id,
      locators: new Set<string>(),
      status,
    };
    if (ref.locator !== ref.id) group.locators.add(ref.locator);
    groups.set(key, group);
  }
  const references = [...groups.values()].map(
    (group) =>
      `${group.id}${group.locators.size ? `, ${[...group.locators].join(" / ")}` : ""} (${group.status})`,
  );
  return references.length
    ? `${separator === "\n" ? "\n" : " "}Upstream:${separator === "\n" ? "\n" : " "}${references.join(separator)}`
    : "";
}

function compactDisplayValue(value: string): string {
  // Source markers remain in the page footer; qualifiers remain beside the value.
  return value
    .replace(/\[\d+(?:\s*[-–,]\s*\d+)*\]/g, "")
    .trim()
    .replace(/^approximately\s+/i, "~");
}

function labelledStatementParts(value: string): {
  label: string;
  body: string;
} {
  const node = fromMarkdown(value).children[0];
  if (node?.type !== "paragraph" || node.children[0]?.type !== "strong")
    return { label: value, body: "" };
  const label = node.children[0].children;
  const rest = node.children.slice(1);
  if (
    label.some((n) => n.type !== "text") ||
    rest.some((n) => n.type !== "text")
  )
    return { label: value, body: "" };
  const labelText = label
    .map((n) => (n.type === "text" ? n.value : ""))
    .join("");
  const body = rest
    .map((n) => (n.type === "text" ? n.value : ""))
    .join("")
    .replace(/^\s*[-–—:]\s*/, "")
    .trim();
  return body ? { label: labelText, body } : { label: value, body: "" };
}

export type PurposeFamily =
  | "cover"
  | "statement"
  | "concepts"
  | "options"
  | "roles"
  | "process"
  | "layers"
  | "decision"
  | "register"
  | "labelled_statements"
  | "big_numbers"
  | "trend";
export type PurposeTone = "candidate" | "condition" | "later" | "risk";

/**
 * The one label a client reads for each internal state.
 *
 * Labels used to render as `CANDIDATE / Proposed decision` and `CONDITION / Outside the evidence`:
 * an internal taxonomy code, a slash, then the writer's own sub-label. A reader meets the
 * classification system rather than the decision. Each state now has exactly one client label, and
 * a candidate is the only state with two, because "proposed" and "supported now" are different
 * claims about the same option.
 */
export function purposeClientLabel(tone: PurposeTone, label: string): string {
  // The reference decks' own wording, which is what a reviewer compares against: DESIGN CANDIDATE,
  // CONDITIONS TO CLOSE, LATER APPROVAL. A candidate the evidence already supports says so.
  if (tone === "candidate")
    return /\bsupport/i.test(label) ? "Supported now" : "Design candidate";
  return tone === "condition"
    ? "Conditions to close"
    : tone === "later"
      ? "Later approval"
      : "Open risk";
}

/** Whether the writer's label only restates the state, rather than naming the item. */
function isStateSynonym(tone: PurposeTone, label: string): boolean {
  const value = label.trim().replace(/:$/, "").toLowerCase();
  return (
    !value ||
    value === tone ||
    value === purposeClientLabel(tone, label).toLowerCase() ||
    /^(?:proposed decision|supported now|candidate|design candidate|conditions?(?: to close)?|later(?: approval)?|(?:open )?risk)$/.test(
      value,
    )
  );
}

/**
 * The label a reader sees: the client state where the writer only restated it, otherwise the
 * writer's own name for the item. Never both, and never the slash form.
 *
 * A risk labelled "Access boundary" is the name of the risk, and dropping it would lose which risk
 * it is -- so a name survives as the label. What goes is the taxonomy prefix in front of it.
 */
export function purposeStatusLabel(tone: PurposeTone, label: string): string {
  return isStateSynonym(tone, label)
    ? purposeClientLabel(tone, label).toUpperCase()
    : label.trim().replace(/:$/, "");
}

/**
 * One row per client label, in the order each label first appears.
 *
 * Three conditions used to take three rows, each repeating the same status, which is how a decision
 * page reached five or six rows. Grouping them is what lets the page carry the decision in three,
 * the way the reference decks do. Details keep their own citations; nothing moves between claims.
 */
export function groupPurposeStatusItems<
  T extends { label: string; tone?: PurposeTone; detail: string },
>(items: T[]): T[] {
  if (!items.some((item) => item.tone)) return items;
  const groups = new Map<string, T>();
  for (const item of items) {
    const key = item.tone
      ? purposeClientLabel(item.tone, item.label)
      : `untoned:${item.label}`;
    // A grouped row is labelled by its state, so an item's own name moves to lead its detail rather
    // than being lost when it stops being the row label.
    const named =
      item.tone && !isStateSynonym(item.tone, item.label)
        ? `${item.label.trim().replace(/:$/, "")}: ${item.detail}`
        : item.detail;
    const existing = groups.get(key);
    groups.set(
      key,
      existing
        ? { ...existing, detail: `${existing.detail}\n${named}` }
        : {
            ...item,
            // The display form, so every later path renders the same words whether or not it
            // passes the label back through purposeStatusLabel (which leaves it unchanged).
            label: item.tone ? purposeStatusLabel(item.tone, key) : item.label,
            detail: named,
          },
    );
  }
  return [...groups.values()];
}
export interface PageIntent {
  question: string;
  scopeNote: string;
  shape?: "concepts" | "comparison" | "roles" | "decision";
  tableKey?: string;
  section?: "CONTEXT" | "WHAT" | "WHY" | "VALIDATE" | "HOW";
  takeaway?: string;
  takeawayLabel?: string;
  chartKeys?: string[];
  chartMessage?: "endpoints" | "measurement_boundary";
}

/** Supplied by a governed read, never parsed from model-authored prose. */
export interface PurposeChart {
  key: string;
  title: string;
  metric: string;
  unit: string;
  period: string;
  sourceIds: number[];
  points: { label: string; value: number; sourceRow: string }[];
  interpretation: string;
  comparisonSubject?: string;
  population?: string;
  axisMin?: number;
  axisMax?: number;
}

/** Line charts may use a bounded axis, which the renderer must label explicitly. */
export function purposeChartAxis(chart: PurposeChart) {
  if (chart.axisMin !== undefined || chart.axisMax !== undefined)
    return { min: chart.axisMin, max: chart.axisMax };
  const values = chart.points.map((point) => point.value);
  const low = Math.min(...values),
    high = Math.max(...values);
  const span = high - low;
  if (!Number.isFinite(span) || span === 0) return {};
  const rough = span / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].find((n) => n * power >= rough)! * power;
  const min = Math.floor((low - span * 0.1) / step) * step;
  const max = Math.ceil((high + span * 0.1) / step) * step;
  return {
    min: Number((low >= 0 ? Math.max(0, min) : min).toPrecision(12)),
    max: Number(max.toPrecision(12)),
  };
}

export const PURPOSE_LAYOUTS = {
  cover: { maxItems: 1, minFontPt: 30 },
  statement: { maxItems: 3, minFontPt: 20 },
  concepts: { maxItems: 4, minFontPt: 18 },
  options: { maxItems: 3, minFontPt: 18 },
  roles: { maxItems: 6, minFontPt: 18 },
  process: { maxItems: 6, minFontPt: 18 },
  layers: { maxItems: 4, minFontPt: 18 },
  decision: { maxItems: 2, minFontPt: 18 },
  register: { maxItems: 8, minFontPt: 16 },
  trend: { maxItems: 12, minFontPt: 16 },
  labelled_statements: { maxItems: 4, minFontPt: 18 },
  big_numbers: { maxItems: 2, minFontPt: 18 },
} as const;

export interface PurposePage {
  id: string;
  family: PurposeFamily;
  title: string;
  scope: string;
  question: string;
  sources: number[];
  notes: string;
  items: {
    label: string;
    detail: string;
    tone?: PurposeTone;
    value?: string;
  }[];
  columns?: string[];
  columnWeights?: number[];
  sourceRegister?: boolean;
  semanticStatusColumn?: boolean;
  /**
   * Each row's status, carried beside the row rather than parsed back out of its label. Colour used
   * to be recovered by splitting the display label on " / ", which tied the row's meaning to the
   * very taxonomy prefix a reader should not see.
   */
  rowTones?: (PurposeTone | undefined)[];
  /** One line under a process flow naming the branch off the main path. */
  exceptionPath?: string;
  processNote?: string;
  /** Sources a table shared on every row, moved off the canvas and stated once in the footer. */
  footerSources?: number[];
  compactTableRows?: boolean;
  tableFontSize?: 14 | 15;
  rows?: string[][];
  chart?: PurposeChart;
  charts?: PurposeChart[];
  section?: PageIntent["section"];
  takeaway?: string;
  takeawayLabel?: string;
  referenceLabels?: Record<number, string>;
  cover?: RenderableDeliverable["presentationCover"];
  classification?: string;
  compact?: boolean;
  statementColumns?: 2;
  statementLabelWidth?: number;
}

export class PurposePageError extends Error {
  constructor(
    public readonly code: string,
    public readonly pageId: string,
  ) {
    super(`purpose_page:${code}:${pageId}`);
  }
}

const draftScope =
  "Working draft for human review. No phase approval or funding commitment is recorded by this output.";
const sourceIds = purposeCitationIds;
export function purposeScopeLayout(page: PurposePage) {
  const value = purposeCitations(page.scope, page.referenceLabels || {});
  for (const height of [0.36, 0.55]) {
    const fontSize = [14, 13, 12].find(
      (size) => referenceCellTextHeight(value, 12.05, size) <= height,
    );
    if (fontSize)
      return {
        height,
        fontSize,
        scopeTop:
          referenceCellTextHeight(page.title, 12.05, 30) <= 0.65 ? 1.22 : 1.65,
        bodyTop:
          (height === 0.36 ? 2.08 : 2.3) -
          (referenceCellTextHeight(page.title, 12.05, 30) <= 0.65 ? 0.43 : 0),
      };
  }
  throw new PurposePageError("scope_needs_edit", page.id);
}
export const purposeBodyHeight = (page: PurposePage) =>
  (page.sourceRegister ? 6.53 : page.takeaway ? 5.98 : 6.18) -
  purposeScopeLayout(page).bodyTop;
export const purposeTableHeaderHeight = (page: PurposePage) =>
  page.sourceRegister
    ? 0.38
    : page.columns
      ? Math.max(
          0.48,
          ...page.columns.map(
            (cell, i) =>
              referenceCellTextHeight(
                cell,
                12.05 * purposeTableWidths(page)[i]! - 0.16,
                page.tableFontSize || 16,
              ) + 0.06,
          ),
        )
      : 0.62;

/** Slide families own emphasis; do not print inline Markdown delimiters as content. */
export function purposePlainText(value: string): string {
  if (!value.includes("**")) return value;
  const root = fromMarkdown(value);
  const inline = (nodes: PhrasingContent[]): string | null => {
    const parts = nodes.map((node): string | null =>
      node.type === "text"
        ? node.value
        : node.type === "strong"
          ? inline(node.children)
          : node.type === "break"
            ? "\n"
            : null,
    );
    return parts.includes(null) ? null : parts.join("");
  };
  const paragraphs = root.children.map((node) =>
    node.type === "paragraph" ? inline(node.children) : null,
  );
  return paragraphs.includes(null) ? value : paragraphs.join("\n\n");
}

export function purposeCitations(
  text: string,
  labels: Record<number, string>,
): string {
  return collapsePurposeCitations(text).replace(
    /\[\d+(?:\s*[-–,]\s*\d+)*\]/g,
    (group) => {
      const ids = sourceIds(group);
      if (ids.some((id) => !labels[id]))
        throw new PurposePageError("unknown_source", "citations");
      return ids.every((id) => labels[id] === String(id))
        ? compactPurposeCitationIds(ids)
        : `[${ids.map((id) => labels[id]).join(", ")}]`;
    },
  );
}

export function purposeSourceGroups(sources: SourceRegisterEntry[]) {
  const groups = new Map<string, SourceRegisterEntry[]>();
  for (const source of sources) {
    for (const upstream of source.upstreamReferences || []) {
      if (
        !upstream.id.trim() ||
        !upstream.locator.trim() ||
        (upstream.availability !== "supplied" &&
          upstream.availability !== "not_supplied") ||
        (upstream.availability === "supplied" &&
          (!upstream.sourceReferenceId ||
            upstream.sourceReferenceId === source.referenceId ||
            !sources.some(
              (entry) => entry.referenceId === upstream.sourceReferenceId,
            ))) ||
        (upstream.availability === "not_supplied" && upstream.sourceReferenceId)
      )
        throw new PurposePageError(
          "upstream_reference_invalid",
          source.referenceId || String(source.citationNumber),
        );
    }
    const family = source.evidenceFamily.trim() || "Evidence";
    groups.set(family, [...(groups.get(family) || []), source]);
  }
  return [...groups].map(([family, entries]) => ({ family, entries }));
}

export function purposeTableWidths(page: PurposePage): number[] {
  const weights = page.columnWeights || page.columns!.map(() => 1);
  if (
    weights.length !== page.columns!.length ||
    weights.some((w) => !Number.isFinite(w) || w <= 0)
  )
    throw new PurposePageError("column_weights_invalid", page.id);
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
}

export const purposeStatementHeight = (
  detail: string,
  width = 11.2,
  font = 22,
): number =>
  Math.max(0.55, referenceCellTextHeight(detail, width, font) + 0.22);

export function purposeRowHeight(page: PurposePage, row: string[]): number {
  const widths = purposeTableWidths(page).map((w) => 12.05 * w - 0.16);
  return Math.max(
    page.sourceRegister ? 0.32 : page.compactTableRows ? 0.35 : 0.45,
    ...row.map(
      (cell, i) =>
        referenceCellTextHeight(
          purposeCitations(cell, page.referenceLabels || {}),
          widths[i]!,
          page.tableFontSize || 16,
        ) + (page.sourceRegister ? 0.04 : page.compactTableRows ? 0.02 : 0.06),
    ),
  );
}

/** Conservative word wrapping; long unbroken strings are counted too. */
export function estimatedLines(text: string, characters: number): number {
  let lines = 0;
  for (const paragraph of text.split(/\n/)) {
    let current = 0;
    lines += 1;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (current && current + 1 + word.length > characters) {
        lines++;
        current = 0;
      }
      if (word.length > characters) {
        lines += Math.floor((word.length - 1) / characters);
        current = ((word.length - 1) % characters) + 1;
      } else current += (current ? 1 : 0) + word.length;
    }
  }
  return lines;
}

function splitText(text: string, maxChars: number): string[] {
  const words = text.trim().match(/\S+\s*/g) ?? [];
  const parts: string[] = [];
  let part = "";
  for (const word of words) {
    if (word.trim().length > maxChars)
      throw new PurposePageError("unbreakable_text", "text");
    if (part && part.length + word.trimEnd().length > maxChars) {
      parts.push(part.trimEnd());
      part = "";
    }
    part += word;
  }
  if (part) parts.push(part.trimEnd());
  return parts;
}

function validateFrame(page: PurposePage, known: Set<number>) {
  if (!page.title.trim() || estimatedLines(page.title, 68) > 2)
    throw new PurposePageError("title_needs_edit", page.id);
  if (page.scope.trim() && estimatedLines(page.scope, 125) > 2)
    throw new PurposePageError("scope_needs_edit", page.id);
  if (page.sources.some((id) => !known.has(id)))
    throw new PurposePageError("unknown_source", page.id);
  if (!page.notes.trim() || !page.question.trim())
    throw new PurposePageError("missing_story", page.id);
}

function normalizePage(input: PurposePage): PurposePage {
  return {
    ...input,
    title: purposePlainText(input.title),
    scope: purposePlainText(input.scope),
    takeaway: input.takeaway
      ? purposePlainText(input.takeaway).replace(
          new RegExp(
            `^${(input.takeawayLabel || "(?!)").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*`,
            "i",
          ),
          "",
        )
      : undefined,
    takeawayLabel: input.takeawayLabel
      ? purposePlainText(input.takeawayLabel)
      : undefined,
    items: input.items.map((item) => ({
      ...item,
      label: purposePlainText(item.label),
      detail: purposePlainText(item.detail).trim(),
    })),
    columns: input.columns?.map(purposePlainText),
    rows: input.rows?.map((row) => row.map(purposePlainText)),
  };
}

function columnAllocations(count: number, remaining: number): number[][] {
  return count === 1
    ? remaining >= 3
      ? [[remaining]]
      : []
    : Array.from(
        { length: Math.max(0, remaining - 3 * (count - 1) - 2) },
        (_, i) => i + 3,
      ).flatMap((width) =>
        columnAllocations(count - 1, remaining - width).map((rest) => [
          width,
          ...rest,
        ]),
      );
}

function paginateRawContent(input: PurposePage): PurposePage[] {
  let page = normalizePage(input);
  if (page.columns && page.rows && !page.columnWeights) {
    const weighted = {
      ...page,
      columnWeights: layoutReferenceTable(
        { kind: "table", columns: page.columns, rows: page.rows },
        12.05,
      ).columnWidths,
    };
    const total = (p: PurposePage) =>
      p.rows!.reduce((sum, row) => sum + purposeRowHeight(p, row), 0);
    if (total(weighted) < total(page)) page = weighted;
    if (
      total(page) + purposeTableHeaderHeight(page) >
      purposeBodyHeight(page)
    ) {
      // Try readable column allocations before creating a continuation. Long
      // handoff labels often need width that a short status column does not.
      let best = total(page) + purposeTableHeaderHeight(page);
      for (const columnWeights of columnAllocations(page.columns!.length, 24)) {
        const candidate = { ...page, columnWeights };
        const height = total(candidate) + purposeTableHeaderHeight(candidate);
        if (height < best - 0.001) {
          page = candidate;
          best = height;
        }
      }
    }
  }
  if (page.columns && page.rows && !page.sourceRegister) {
    const compact = { ...page, compactTableRows: true };
    const height = (candidate: PurposePage) =>
      purposeTableHeaderHeight(candidate) +
      candidate.rows!.reduce(
        (sum, row) => sum + purposeRowHeight(candidate, row),
        0,
      );
    if (
      height(page) > purposeBodyHeight(page) &&
      height(compact) <= purposeBodyHeight(compact) + 0.001
    )
      page = compact;
    if (height(page) > purposeBodyHeight(page)) {
      for (const tableFontSize of [15, 14] as const) {
        let best = { ...compact, tableFontSize };
        for (const columnWeights of columnAllocations(
          page.columns!.length,
          24,
        )) {
          const candidate = { ...best, columnWeights };
          if (height(candidate) < height(best)) best = candidate;
        }
        if (height(best) <= purposeBodyHeight(best) + 0.001) {
          page = best;
          break;
        }
      }
    }
  }
  const bodyHeight = purposeBodyHeight(page);
  const headerHeight = purposeTableHeaderHeight(page);
  if (page.family === "trend") return [page];
  if (page.columns && page.rows) {
    if (page.columns.length < 1 || page.columns.length > 5)
      throw new PurposePageError("table_needs_companion", page.id);
    const widths = purposeTableWidths(page).map((w) => Math.floor(100 * w));
    if (page.columns.some((cell, i) => estimatedLines(cell, widths[i]!) > 2))
      throw new PurposePageError("column_label_needs_edit", page.id);
    const groups: string[][][] = [];
    let group: string[][] = [],
      used = headerHeight;
    for (const row of page.rows) {
      if (row.length !== page.columns.length)
        throw new PurposePageError("table_shape", page.id);
      // A single oversized record needs author review, not an unexplained truncation.
      const height = purposeRowHeight(page, row);
      if (height > 3.7) throw new PurposePageError("row_needs_edit", page.id);
      if (group.length && used + height > bodyHeight + 0.001) {
        groups.push(group);
        group = [];
        used = headerHeight;
      }
      group.push(row);
      used += height;
    }
    if (group.length) groups.push(group);
    if (groups.length === 2) {
      const rows = groups.flat();
      const height = (rs: string[][], candidate = page) =>
        purposeTableHeaderHeight(candidate) +
        rs.reduce((sum, row) => sum + purposeRowHeight(candidate, row), 0);
      const tail = (at: number) => {
        const slice = rows.slice(at);
        const previousHeader =
          page.sourceRegister && slice[0]?.[0]
            ? rows.slice(0, at).findLast((row) => !row[0])
            : undefined;
        return previousHeader
          ? [["", `${previousHeader[1]} (continued)`, ""], ...slice]
          : slice;
      };
      const cutsFor = (candidate: PurposePage, requireFill = true) =>
        Array.from({ length: Math.max(0, rows.length - 3) }, (_, i) => i + 2)
          .map((at) => ({
            at,
            a: height(rows.slice(0, at), candidate),
            b: height(tail(at), candidate),
          }))
          .filter(
            (c) =>
              (!page.sourceRegister || Boolean(rows[c.at - 1]?.[0])) &&
              c.a <= bodyHeight + 0.001 &&
              c.b <= bodyHeight + 0.001 &&
              (!requireFill || c.a >= bodyHeight * 0.55) &&
              (!requireFill || c.b >= bodyHeight * 0.55),
          )
          .sort((a, b) => Math.abs(a.a - a.b) - Math.abs(b.a - b.b));
      let cuts = cutsFor(page);
      // A family header must travel with its rows even when neither balanced
      // page reaches the target fill; retain context before optimizing density.
      if (!cuts.length && page.sourceRegister) cuts = cutsFor(page, false);
      // The shortest total table is not always the best two-page split. Try
      // other readable widths before rejecting a continuation with a thin tail.
      if (
        !cuts.length &&
        !page.sourceRegister &&
        height(rows) > bodyHeight + 0.001
      ) {
        for (const columnWeights of columnAllocations(
          page.columns.length,
          24,
        )) {
          const candidate = { ...page, columnWeights };
          const widths = purposeTableWidths(candidate).map((w) =>
            Math.floor(100 * w),
          );
          if (
            candidate.columns!.some(
              (cell, i) => estimatedLines(cell, widths[i]!) > 2,
            )
          )
            continue;
          const possible = cutsFor(candidate);
          if (possible.length) {
            page = candidate;
            cuts = possible;
            break;
          }
        }
      }
      if (height(rows) <= bodyHeight + 0.001) groups.splice(0, 2, rows);
      else if (cuts[0])
        groups.splice(0, 2, rows.slice(0, cuts[0].at), tail(cuts[0].at));
    }
    // A split partitions the original row objects without copying them, so each row's status is
    // found again by identity rather than by index -- an inserted continuation row cannot shift it.
    const toneOf = new Map(
      (page.rows ?? []).map((row, i) => [row, page.rowTones?.[i]] as const),
    );
    return groups.map((rows, i) => ({
      ...page,
      id: `${page.id}:${i + 1}`,
      rows,
      ...(page.rowTones
        ? { rowTones: rows.map((row) => toneOf.get(row)) }
        : {}),
      title: i
        ? page.sourceRegister
          ? "Sources and traceability (continued)"
          : `${page.title} (continued)`
        : page.title,
      ...(i < groups.length - 1
        ? { takeaway: undefined, takeawayLabel: undefined }
        : {}),
    }));
  }
  const items = page.items.flatMap((item) => {
    const max =
      page.family === "statement"
        ? 420
        : page.family === "decision"
          ? 550
          : 360;
    const labelFits =
      page.family === "big_numbers"
        ? referenceCellTextHeight(item.label, 5.7, 22) <= 0.9
        : estimatedLines(item.label, 27) <= 2;
    if (!labelFits) throw new PurposePageError("label_needs_edit", page.id);
    const parts = splitText(item.detail, max);
    return (parts.length ? parts : [""]).map((detail, i) => ({
      ...item,
      label: i ? `${item.label} (continued)` : item.label,
      detail,
    }));
  });
  const cap = PURPOSE_LAYOUTS[page.family].maxItems;
  const pages: PurposePage[] = [];
  if (page.family === "statement") {
    let group: PurposePage["items"] = [],
      height = 0;
    for (const item of items) {
      const next = purposeStatementHeight(
        purposeCitations(item.detail, page.referenceLabels || {}),
        11.2,
        page.compact ? 18 : 22,
      );
      if (next > bodyHeight)
        throw new PurposePageError("statement_needs_edit", page.id);
      if (
        group.length &&
        (group.length === cap || height + next > bodyHeight)
      ) {
        pages.push({
          ...page,
          id: `${page.id}:${pages.length + 1}`,
          items: group,
        });
        group = [];
        height = 0;
      }
      group.push(item);
      height += next;
    }
    if (group.length)
      pages.push({
        ...page,
        id: `${page.id}:${pages.length + 1}`,
        items: group,
      });
    if (!pages.length) throw new PurposePageError("empty_page", page.id);
    return pages.map((p, i) => ({
      ...p,
      title: i ? `${page.title} (continued)` : page.title,
    }));
  }
  for (let i = 0; i < items.length; i += cap) {
    pages.push({
      ...page,
      id: `${page.id}:${pages.length + 1}`,
      items: items.slice(i, i + cap),
    });
  }
  if (!pages.length) throw new PurposePageError("empty_page", page.id);
  return pages.map((p, i) => ({
    ...p,
    title: i ? `${page.title} (continued)` : page.title,
  }));
}

function paginateContent(page: PurposePage): PurposePage[] {
  page = normalizePage(page);
  const bodyHeight = purposeBodyHeight(page);
  if (page.family === "trend") return [page];
  // Fit the whole message before introducing a continuation.
  if (page.family === "statement" && page.items.length) {
    const height = (width: number, font: number, items = page.items) =>
      items.reduce(
        (n, i) =>
          n +
          purposeStatementHeight(
            purposeCitations(i.detail, page.referenceLabels || {}),
            width,
            font,
          ),
        0,
      );
    if (page.items.length <= 3 && height(11.2, 22) <= bodyHeight)
      return paginateRawContent(page);
    if (page.items.length <= 5 && height(11.2, 18) <= bodyHeight)
      return [{ ...page, compact: true }];
    if (
      page.items.length <= 6 &&
      [
        page.items.filter((_, i) => i % 2 === 0),
        page.items.filter((_, i) => i % 2 === 1),
      ].every((items) => height(5.1, 18, items) <= bodyHeight)
    )
      return [{ ...page, compact: true, statementColumns: 2 }];
    page = {
      ...page,
      family: "register",
      compact: true,
      columns: ["Action or finding"],
      rows: page.items.map((i) => [
        i.label ? `${i.label}: ${i.detail}` : i.detail,
      ]),
      items: [],
    };
  }
  if (page.family === "labelled_statements" && page.items.length <= 6) {
    const labelWidth = [3.2, 4.2, 5.2].find((width) =>
      page.items.every(
        (i) =>
          Math.max(
            referenceCellTextHeight(
              purposeStatusLabel(i.tone!, i.label),
              width,
              18,
            ),
            referenceCellTextHeight(
              purposeCitations(i.detail, page.referenceLabels || {}),
              11.55 - width,
              18,
            ),
          ) +
            0.12 <=
          bodyHeight / page.items.length,
      ),
    );
    if (labelWidth !== undefined)
      return [{ ...page, compact: true, statementLabelWidth: labelWidth }];
    const compactStatus: PurposePage = {
      ...page,
      family: "register",
      compact: true,
      columns: ["Status and statement", "Evidence or condition"],
      semanticStatusColumn: true,
      rowTones: page.items.map((item) => item.tone),
      rows: page.items.map((item) => [
        purposeStatusLabel(item.tone!, item.label),
        item.detail,
      ]),
      items: [],
    };
    try {
      return paginateContent(compactStatus);
    } catch (error) {
      if (
        !(error instanceof PurposePageError) ||
        ![
          "sparse_continuation",
          "continuation_fill_needs_edit",
          "message_needs_edit",
        ].includes(error.code)
      )
        throw error;
    }
    page = {
      ...compactStatus,
      columns: ["Status", "Statement", "Evidence or condition"],
      columnWeights: [1.45, 5.8, 4.8],
      rows: page.items.map((item) => [
        item.tone!.toUpperCase(),
        item.label,
        item.detail,
      ]),
    };
  }
  if (
    ["concepts", "options", "roles", "decision"].includes(page.family) &&
    page.items.length > PURPOSE_LAYOUTS[page.family].maxItems
  ) {
    page = {
      ...page,
      family: "register",
      compact: true,
      columns: ["Item", "Detail"],
      rows: page.items.map((i) => [i.label, i.detail]),
      items: [],
    };
  }
  let pages = paginateRawContent(
    page.columns ? { ...page, compact: true } : page,
  );
  if (pages.length > 2)
    throw new PurposePageError("message_needs_edit", page.id);
  if (pages.length === 2 && !page.rows) {
    const items = pages.flatMap((p) => p.items);
    const at = Math.ceil(items.length / 2);
    if (at >= 2 && items.length - at >= 2)
      pages = pages.map((p, i) => ({
        ...p,
        items: i ? items.slice(at) : items.slice(0, at),
      }));
  }
  if (
    pages.length > 1 &&
    pages.some((p) => (p.rows?.length ?? p.items.length) < 2)
  )
    throw new PurposePageError("sparse_continuation", page.id);
  if (
    pages.length > 1 &&
    pages.some(
      (p) =>
        p.rows &&
        purposeTableHeaderHeight(p) +
          p.rows.reduce((n, row) => n + purposeRowHeight(p, row), 0) <
          purposeBodyHeight(p) * 0.55,
    )
  )
    throw new PurposePageError("continuation_fill_needs_edit", page.id);
  return pages;
}

function basePage(slide: RenderableDeckSlide, index: number): PurposePage {
  const question =
    slide.pageIntent?.question || slide.title || slide.governingMessage;
  return {
    id: slide.key || `page-${index + 1}`,
    family: "statement",
    title: slide.governingMessage,
    question,
    scope: slide.pageIntent?.scopeNote || "",
    section: slide.pageIntent?.section,
    takeaway: slide.pageIntent?.takeaway,
    takeawayLabel: slide.pageIntent?.takeawayLabel,
    sources: [
      ...new Set([
        ...(slide.citationsUsed ?? []),
        ...sourceIds(
          [slide.governingMessage, ...(slide.points ?? [])].join(" "),
        ),
      ]),
    ],
    notes: `The point: ${slide.governingMessage}\nQuestion: ${question}\n${slide.speakerNotes ?? ""}\nAuthored detail:\n${(slide.points ?? []).join("\n")}`,
    items: (slide.points ?? []).map((detail) => ({ label: "", detail })),
  };
}

const SHAPED_TABLE_FAMILIES = new Set<string>([
  "roles",
  "labelled_statements",
  "big_numbers",
  "decision",
]);

function tablePage(table: RenderableTable, base: PurposePage): PurposePage {
  if (table.numericCells?.length) {
    table = { ...table, rows: purposeTypedTableRows(table) };
  }
  if (!table.rows.length) throw new PurposePageError("empty_table", base.id);
  if (table.rows.some((row) => row.length !== table.columns.length))
    throw new PurposePageError("table_shape", base.id);
  // Sources are collected before any column is removed, so dropping a constant column can never
  // drop a source from the page footer.
  const sources = [
    ...new Set([...base.sources, ...sourceIds(table.rows.flat().join(" "))]),
  ];
  let notes = base.notes;
  // Any table that is not one of the shaped families renders as a plain register -- including a
  // declared comparison and a writer's undeclared shape -- so every one gets the same hygiene.
  if (!SHAPED_TABLE_FAMILIES.has(table.pageShape ?? "")) {
    table = withoutConstantColumns(table);
    const sourced = withSourceColumn(table);
    table = sourced.table;
    if (sourced.cellSources.length)
      notes += `\nCell sources: ${sourced.cellSources.join("; ")}`;
    if (sourced.sharedSources)
      base = { ...base, footerSources: sourced.sharedSources };
  }
  return shapedTablePage(table, { ...base, notes }, sources);
}

/**
 * Moves a register's citation codes out of its sentences into one narrow final Source column, the
 * way a reader expects a table to attribute. The codes stay on the canvas, so the page footer, which
 * describes visible evidence, keeps every source. Where cells in one row cited different sources,
 * that claim-level attribution is returned for the notes rather than dropped.
 *
 * A table that already has a Source column is left alone. One whose every row cites the same
 * sources has them returned as shared, for the page footer to state once.
 */
export function withSourceColumn<
  T extends { columns: string[]; rows: string[][] },
>(table: T): { table: T; cellSources: string[]; sharedSources?: number[] } {
  const unchanged = { table, cellSources: [] };
  if (table.columns.some((column) => /^sources?$/i.test(column.trim())))
    return unchanged;
  const rowIds = table.rows.map((row) => sourceIds(row.join(" ")));
  if (!rowIds.some((ids) => ids.length)) return unchanged;
  const keys = new Set(rowIds.map((ids) => ids.join(",")));
  // Every row citing the same sources is one attribution for the whole table: it is stated once in
  // the footer, not repeated down a column that would then say nothing per row.
  if (keys.size === 1)
    return {
      table: {
        ...table,
        rows: table.rows.map((row) => row.map(stripCitations)),
      },
      cellSources: [],
      sharedSources: rowIds[0]!,
    };
  const cellSources: string[] = [];
  const rows = table.rows.map((row, r) => {
    const cited = row
      .map((cell, c) => ({ column: table.columns[c]!, ids: sourceIds(cell) }))
      .filter((cell) => cell.ids.length);
    if (new Set(cited.map((cell) => cell.ids.join(","))).size > 1)
      cellSources.push(
        `${stripCitations(row[0]!)}: ${cited
          .map(
            (cell) => `${cell.column} ${compactPurposeCitationIds(cell.ids)}`,
          )
          .join(", ")}`,
      );
    return [...row.map(stripCitations), compactPurposeCitationIds(rowIds[r]!)];
  });
  return {
    table: { ...table, columns: [...table.columns, "Source"], rows },
    cellSources,
  };
}

function stripCitations(value: string): string {
  return value
    .replace(/\s*\[\d+(?:\s*[-–,]\s*\d+)*\]/g, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();
}

type PurposeFlowData = {
  nodes: { id: string; label: string; role?: string }[];
  edges: { from: string; to: string; label?: string }[];
};

/**
 * Reads a recorded handoff graph as a numbered flow: the main path follows the declared node order
 * while each node hands off to the next, and every remaining edge becomes one exception-path line.
 * A handoff label that is identical on every main-path edge says nothing per step, so it is dropped
 * the way a constant table column is. Distinct handoff labels, an unconnected node, too many steps
 * fewer than three steps (a fork reads better as a register) or a branch that cannot be said in one
 * line keep the edge register, which loses nothing.
 */
export function purposeFlowSteps(
  data: PurposeFlowData,
  nodeLabel: (id: string) => string,
  unconnectedCount = 0,
): { steps: PurposeFlowData["nodes"]; exceptionPath?: string } | null {
  if (unconnectedCount > 0 || data.nodes.length < 2) return null;
  const steps = [data.nodes[0]!];
  const mainEdges = new Set<PurposeFlowData["edges"][number]>();
  for (const node of data.nodes.slice(1)) {
    const edge = data.edges.find(
      (item) =>
        item.from === steps[steps.length - 1]!.id && item.to === node.id,
    );
    if (!edge) break;
    mainEdges.add(edge);
    steps.push(node);
  }
  if (steps.length < 3 || steps.length > PURPOSE_LAYOUTS.process.maxItems)
    return null;
  const handoffs = new Set(
    [...mainEdges].map((edge) => (edge.label || "").trim().toLowerCase()),
  );
  if (handoffs.size > 1) return null;
  const branches = data.edges.filter((edge) => !mainEdges.has(edge));
  const onPath = new Set(steps.map((node) => node.id));
  if (branches.length > 3 || data.nodes.length - steps.length > 4) return null;
  if (!branches.length) return { steps };
  const name = (id: string) =>
    onPath.has(id) ? data.nodes.find((n) => n.id === id)!.label : nodeLabel(id);
  const handoff = (edge: PurposeFlowData["edges"][number]) =>
    `${name(edge.to)}${edge.label ? ` (${edge.label.trim()})` : ""}`;
  const branchChain = branches.every(
    (edge, i) => i === 0 || branches[i - 1]!.to === edge.from,
  );
  const exceptionPath = branchChain
    ? `${name(branches[0]!.from)} → ${branches.map(handoff).join(" → ")}`
    : branches
        .map((edge) => `${name(edge.from)} → ${handoff(edge)}`)
        .join("; ");
  if (exceptionPath.length > 280) return null;
  return { steps, exceptionPath };
}

/**
 * R5 §4: a column that says the same thing on every row says it once.
 *
 * A handoff column reading "Declared connection" down every row costs a column's width and tells a
 * reader nothing per row. It is removed, and its value is stated once in the header of the first
 * column, where it stays visible. That matters when the shared value is a status: a register whose
 * every row reads "Pending" must not lose "Pending" from the page, or the rows read as settled. The
 * header is the same place the action register already carries its shared proposal status.
 *
 * Deliberately narrow. Only tables that render as a plain register, at least three rows so
 * that "every row" is a pattern rather than a coincidence, at least three columns so that two remain,
 * and a short value -- a long sentence repeated down a column is more likely a writer's error than a
 * shared status.
 *
 * And only an uncited value. The page footer is rebuilt from the evidence that stays visible, so
 * removing a cited column would leave its value on the page with its source gone. A cited constant
 * stays where its citation is attached.
 */
export function withoutConstantColumns<
  T extends { columns: string[]; rows: string[][] },
>(table: T): T {
  if (table.rows.length < 3 || table.columns.length < 3) return table;
  const constant = table.columns
    .map((_, column) => column)
    .filter(
      (column) =>
        column > 0 &&
        Boolean(table.rows[0]![column]?.trim()) &&
        table.rows.every((row) => row[column] === table.rows[0]![column]) &&
        sourceIds(table.rows[0]![column]!).length === 0 &&
        purposePlainText(table.rows[0]![column]!).length <= 40,
    );
  if (!constant.length || table.columns.length - constant.length < 2)
    return table;
  const note = constant
    .map(
      (column) =>
        `${table.columns[column]!.toLowerCase()}: ${table.rows[0]![
          column
        ]!.replace(/\s*\[[^\]]*\]/g, "").trim()}`,
    )
    .join("; ");
  const keep = (row: string[]) => row.filter((_, i) => !constant.includes(i));
  return {
    ...table,
    columns: keep(table.columns).map((header, i) =>
      i === 0 ? `${header} (${note})` : header,
    ),
    rows: table.rows.map(keep),
  };
}

function shapedTablePage(
  table: RenderableTable,
  base: PurposePage,
  sources: number[],
): PurposePage {
  const family =
    table.pageShape === "roles"
      ? "roles"
      : table.pageShape === "labelled_statements"
        ? "labelled_statements"
        : table.pageShape === "big_numbers"
          ? "big_numbers"
          : table.pageShape === "decision"
            ? "decision"
            : "register";
  if (
    family === "roles" &&
    table.rows.some((row) => estimatedLines(row[0] || "", 27) > 2)
  )
    return {
      ...base,
      family: "register",
      sources,
      columns: table.columns,
      rows: table.rows,
      items: [],
      ...(table.columns.length === 2 ? { columnWeights: [4, 8.05] } : {}),
    };
  if (
    family !== "register" &&
    table.columns.length >= 2 &&
    table.columns.length <= 4
  ) {
    if (
      table.rowTones &&
      (table.rowTones.length !== table.rows.length ||
        table.rowTones.some(
          (tone) => !["candidate", "condition", "later", "risk"].includes(tone),
        ))
    )
      throw new PurposePageError("invalid_row_tones", base.id);
    if (
      family === "labelled_statements" &&
      (!table.rowTones || table.columns.length !== 2)
    )
      throw new PurposePageError(
        "labelled_statement_semantics_missing",
        base.id,
      );
    if (
      family === "big_numbers" &&
      (table.columns.length !== 3 ||
        table.rows.some((r) => compactDisplayValue(r[1]!).length > 18))
    )
      throw new PurposePageError("big_number_shape", base.id);
    if (
      family === "big_numbers" &&
      (table.rows.length !== 2 ||
        table.valueUnits?.length !== 2 ||
        !table.valueUnits[0] ||
        table.valueUnits[0] !== table.valueUnits[1])
    )
      throw new PurposePageError("big_number_units_not_comparable", base.id);
    return {
      ...base,
      family,
      sources,
      // Only the decision page groups by state. A readiness page listing five distinct conditions is
      // five items, and labelling each by its own name keeps it from repeating one state five times.
      items: (family === "decision"
        ? groupPurposeStatusItems
        : <T>(rows: T[]) => rows)(
        table.rows.map((row, i) => {
          const statement =
            family === "labelled_statements"
              ? labelledStatementParts(row[0]!)
              : { label: row[0]!, body: "" };
          return {
            label: statement.label,
            tone: table.rowTones?.[i],
            ...(family === "big_numbers"
              ? { value: compactDisplayValue(row[1]!) }
              : {}),
            detail: [
              statement.body,
              row
                .slice(family === "big_numbers" ? 2 : 1)
                .map((cell, i) =>
                  table.columns.length === 2 || family === "big_numbers"
                    ? cell
                    : `${table.columns[i + 1]}: ${cell}`,
                )
                .join("\n"),
            ]
              .filter(Boolean)
              .join("\n"),
          };
        }),
      ),
    };
  }
  return {
    ...base,
    family: "register",
    sources,
    columns: table.columns,
    rows: table.rows,
    items: [],
  };
}

export function validatePurposeChart(
  chart: PurposeChart,
  known: Set<number>,
): void {
  if (!chart.points.length)
    throw new PurposePageError("chart_without_data", chart.key);
  if (
    (chart.axisMin !== undefined && !Number.isFinite(chart.axisMin)) ||
    (chart.axisMax !== undefined && !Number.isFinite(chart.axisMax)) ||
    (chart.axisMin !== undefined &&
      chart.axisMax !== undefined &&
      chart.axisMin >= chart.axisMax) ||
    chart.points.some(
      (point) =>
        (chart.axisMin !== undefined && point.value < chart.axisMin) ||
        (chart.axisMax !== undefined && point.value > chart.axisMax),
    )
  )
    throw new PurposePageError("chart_axis_invalid", chart.key);
  if (chart.points.length > PURPOSE_LAYOUTS.trend.maxItems)
    throw new PurposePageError("chart_needs_split", chart.key);
  if (
    !chart.title.trim() ||
    !chart.metric.trim() ||
    !chart.unit.trim() ||
    !chart.period.trim() ||
    !chart.sourceIds.length ||
    chart.sourceIds.some((id) => !known.has(id))
  )
    throw new PurposePageError("chart_basis_missing", chart.key);
  if (
    new Set(chart.points.map((point) => point.label)).size !==
    chart.points.length
  )
    throw new PurposePageError("chart_duplicate_period", chart.key);
  if (
    chart.points.some(
      (point) =>
        !Number.isFinite(point.value) ||
        !point.sourceRow.trim() ||
        !point.label.trim() ||
        point.label.length > 22,
    )
  )
    throw new PurposePageError("chart_point_invalid", chart.key);
}

/** Descriptive series comparisons only: no causal or statistical trend is inferred. */
export function purposeChartHeadline(
  charts: readonly PurposeChart[],
  message: PageIntent["chartMessage"] = "endpoints",
): string {
  if (message === "measurement_boundary") {
    if (
      charts.length !== 2 ||
      charts.some(
        (c) => !c.comparisonSubject?.trim() || !c.population?.trim(),
      ) ||
      charts[0]!.unit === charts[1]!.unit ||
      charts[0]!.population === charts[1]!.population ||
      charts[0]!.period !== charts[1]!.period
    )
      throw new PurposePageError(
        "chart_boundary_needs_distinct_measures",
        "chart",
      );
    return `${charts[0]!.comparisonSubject} and ${charts[1]!.comparisonSubject} need separate measures`;
  }
  if (message !== "endpoints")
    throw new PurposePageError("unknown_chart_message", "chart");
  const trends = charts.map((chart) => ({
    chart,
    ...purposeChartTrend(chart),
  }));
  // One clause, never a semicolon. Two series used to be joined with "; ", which made every
  // two-chart title two findings, put a capital letter mid-sentence, and broke the title limit the
  // writer was then told to copy verbatim.
  const subject = (metric: string, first: boolean) =>
    first || /^[A-Z0-9]{2,}\b/.test(metric)
      ? metric
      : metric.charAt(0).toLowerCase() + metric.slice(1);
  const joined = trends
    .map((t, i) => `${subject(t.chart.metric, i === 0)} ${t.phrase}`)
    .join(" while ");
  if (joined.length <= PURPOSE_TITLE_MAX_CHARS || trends.length === 1)
    return joined;
  // Too long to be one title: lead with the series that moved most, measured against its own
  // threshold so a large-unit series cannot win on scale alone.
  const lead = [...trends].sort((a, b) => b.strength - a.strength)[0]!;
  return trends.every((t) => t.direction === "steady")
    ? "Both measures hold broadly steady"
    : `${lead.chart.metric} ${lead.phrase}`;
}

/** Longest title a page can carry as one finding on one line. */
export const PURPOSE_TITLE_MAX_CHARS = 72;
/** Longest scope note that still reads as a caveat rather than a second paragraph. */
export const PURPOSE_CAVEAT_MAX_CHARS = 110;
/** The decision page holds at most this many rows once grouped by state; the rest belong later. */
export const PURPOSE_DECISION_MAX_ROWS = 3;

/**
 * Whether a series moved enough to earn a direction word, computed from the bound points only.
 *
 * The headline used to call any series that ended above where it started, with one lower interior
 * point, a recovery -- with no magnitude test at all. A first-contact rate moving two points around
 * seventy-five per cent was published as "recovers after a dip". A direction word is a claim about
 * the data, so the data has to support it: the first-to-last change, and the largest excursion from
 * the mean, each against a threshold of five per cent of the mean, or three points for a series
 * already measured in per cent.
 */
export function purposeChartTrend(chart: PurposeChart): {
  direction: "recovers" | "retreats" | "rises" | "falls" | "dips" | "steady";
  phrase: string;
  strength: number;
} {
  const values = chart.points.map((p) => p.value);
  const first = values[0];
  const last = values.at(-1);
  if (first === undefined || last === undefined)
    throw new PurposePageError("chart_without_data", chart.key);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const threshold = /\bpercent\b|%/i.test(chart.unit)
    ? 3
    : Math.abs(mean) * 0.05;
  const interior = values.slice(1, -1);
  const change = last - first;
  const dip = interior.some((v) => v < first && mean - v >= threshold);
  const peak = interior.some((v) => v > first && v - mean >= threshold);
  const excursion = Math.max(0, ...values.map((v) => Math.abs(v - mean)));
  const strength =
    threshold > 0 ? Math.max(Math.abs(change), excursion) / threshold : 0;
  const result = (
    direction: ReturnType<typeof purposeChartTrend>["direction"],
    phrase: string,
  ) => ({ direction, phrase, strength });
  if (change === 0 || Math.abs(change) < threshold)
    return dip
      ? result("dips", "dips and returns to its starting level")
      : result("steady", "holds broadly steady");
  if (change > 0)
    return dip
      ? result("recovers", "recovers after a dip")
      : result("rises", "increases overall");
  return peak
    ? result("retreats", "falls after a rise")
    : result("falls", "decreases overall");
}

/** Presentation only: preserve the authored sequence and declared graph edges. */
export function planPurposePages(
  doc: RenderableDeliverable,
  charts: readonly PurposeChart[] = [],
): PurposePage[] {
  if (doc.referenceDeck)
    throw new PurposePageError("reference_deck_needs_adapter", "deck");
  if (doc.publicSources?.length)
    throw new PurposePageError("public_sources_need_adapter", "deck");
  const known = new Set(
    doc.sourceRegister.map((source) => source.citationNumber),
  );
  const labels = doc.sourceRegister.map(
    (source) => source.referenceId || String(source.citationNumber),
  );
  if (
    new Set(labels).size !== labels.length ||
    labels.some((label) => !/^[A-Za-z0-9_-]{1,16}$/.test(label))
  )
    throw new PurposePageError("invalid_reference_labels", "deck");
  if (!doc.deckSlides?.length)
    throw new PurposePageError("storyline_missing", "deck");
  const referenceLabels = Object.fromEntries(
    doc.sourceRegister.map((s) => [
      s.citationNumber,
      s.referenceId || String(s.citationNumber),
    ]),
  );
  const paginate = (page: PurposePage) =>
    paginateContent({ ...page, referenceLabels });
  const titleSuffix = doc.title.startsWith(doc.initiativeDisplayName)
    ? doc.title.slice(doc.initiativeDisplayName.length)
    : "";
  const hasSubtitle = /^\s*[-–—:/]\s*\S/.test(titleSuffix);
  const coverTitle = hasSubtitle
    ? titleSuffix.replace(/^\s*[-–—:/]\s*/, "").trim()
    : "Discovery readout";
  const coverSubject = hasSubtitle ? doc.initiativeDisplayName : doc.title;
  const pages: PurposePage[] = [
    {
      id: "cover",
      family: "cover",
      title: coverTitle,
      question: "What decision does this readout support?",
      scope:
        doc.deckSlides[0]?.pageIntent?.question ||
        "What does the evidence support, and what decision comes next?",
      cover: doc.presentationCover,
      sources: [],
      notes: `The point: ${doc.recommendation}\n${draftScope}`,
      items: [{ label: doc.clientDisplayName, detail: coverSubject }],
    },
  ];
  const usedCharts = new Set<string>();
  const usedTables = new Set<string>(),
    usedExhibits = new Set<string>();
  for (const [index, slide] of doc.deckSlides.entries()) {
    let page = basePage(slide, index);
    if (slide.pageIntent?.shape) {
      const family = {
        comparison: "options",
        roles: "roles",
        decision: "decision",
        concepts: "concepts",
      }[slide.pageIntent.shape];
      if (!family) throw new PurposePageError("unknown_shape", page.id);
      page.family = family as PurposeFamily;
    }
    if (slide.pageIntent?.chartKeys?.length) {
      if (slide.pageIntent.chartKeys.length > 2)
        throw new PurposePageError("chart_pair_limit", page.id);
      const selected = slide.pageIntent.chartKeys.map((key) => {
        const chart = charts.find((item) => item.key === key);
        if (!chart)
          throw new PurposePageError("chart_reference_missing", page.id);
        validatePurposeChart(chart, known);
        usedCharts.add(key);
        return chart;
      });
      const message = slide.pageIntent.chartMessage || "endpoints";
      if (slide.governingMessage !== purposeChartHeadline(selected, message))
        throw new PurposePageError(
          "chart_headline_not_bound_to_measures",
          page.id,
        );
      const boundary = `${selected[0]!.period}. Separate populations and axes; no intervention effect is established.`;
      if (
        slide.points?.length ||
        (slide.pageIntent.takeaway &&
          (message !== "measurement_boundary" ||
            slide.pageIntent.takeaway !== boundary))
      )
        throw new PurposePageError(
          "chart_interpretation_needs_governed_binding",
          page.id,
        );
      page.family = "trend";
      page.charts = selected;
      page.sources = [
        ...new Set([
          ...page.sources,
          ...selected.flatMap((chart) => chart.sourceIds),
        ]),
      ];
      page.notes +=
        "\n" +
        selected
          .map(
            (chart) =>
              `${chart.metric} (${chart.unit}), ${chart.period}\n${chart.points.map((p) => `${p.label}: ${p.value}; ${p.sourceRow}`).join("\n")}`,
          )
          .join("\n");
    } else if (slide.pageIntent?.tableKey) {
      const table = doc.tables.find(
        (item) => item.key === slide.pageIntent!.tableKey,
      );
      if (!table || table.targetFormat === "xlsx")
        throw new PurposePageError("table_reference_missing", page.id);
      page = tablePage(table, page);
      usedTables.add(table.key);
    } else if (slide.exhibitKey) {
      const exhibit = doc.exhibits.find(
        (item) => item.key === slide.exhibitKey,
      );
      if (!exhibit?.data)
        throw new PurposePageError("exhibit_reference_missing", page.id);
      usedExhibits.add(exhibit.key);
      const data = exhibit.data;
      page.notes += `\nExhibit: ${exhibit.description}`;
      if (data.kind === "flow") {
        const nodes = new Map(data.nodes.map((node) => [node.id, node]));
        if (
          nodes.size !== data.nodes.length ||
          data.edges.some(
            (edge) => !nodes.has(edge.from) || !nodes.has(edge.to),
          )
        )
          throw new PurposePageError("invalid_topology", page.id);
        // An edge register preserves branching, cycles and cross-page references.
        const nodeLabel = (id: string) => {
          const node = nodes.get(id)!;
          return `${node.label}${node.role ? ` (${node.role})` : ""}`;
        };
        const unconnected = data.nodes.filter(
          (node) =>
            !data.edges.some(
              (edge) => edge.from === node.id || edge.to === node.id,
            ),
        );
        page = {
          ...page,
          family: "register",
          columns: data.edges.some((edge) => edge.label)
            ? ["From", "To", "Handoff"]
            : ["From", "To"],
          rows: [
            ...data.edges.map((edge) => [
              nodeLabel(edge.from),
              nodeLabel(edge.to),
              ...(data.edges.some((item) => item.label)
                ? [edge.label || "Unlabelled connection"]
                : []),
            ]),
            ...unconnected.map((node) => [
              nodeLabel(node.id),
              "Not connected",
              ...(data.edges.some((item) => item.label)
                ? ["No edge declared"]
                : []),
            ]),
          ],
          items: [],
        };
        const flow = purposeFlowSteps(data, nodeLabel, unconnected.length);
        if (flow)
          page = {
            ...page,
            family: "process",
            columns: undefined,
            rows: undefined,
            items: flow.steps.map((node) => ({
              label: node.label,
              detail: node.role || "",
            })),
            ...(flow.exceptionPath
              ? { exceptionPath: flow.exceptionPath }
              : {}),
            processNote: slide.points?.join("\n"),
          };
        else if (slide.points?.length)
          page.rows!.push(
            ...slide.points.map((point) => [
              "Recorded note",
              point,
              ...(page.columns!.length === 3 ? [""] : []),
            ]),
          );
      } else if (
        "lanes" in data &&
        data.kind !== "timeline" &&
        data.kind !== "roadmap"
      ) {
        if ("edges" in data && data.edges?.length)
          throw new PurposePageError("layer_topology_needs_renderer", page.id);
        page.family = "layers";
        page.items = data.lanes.map((lane) => ({
          label: lane.label,
          detail: (lane.items as string[]).join("\n"),
        }));
      } else if (
        data.kind === "comparison" ||
        data.kind === "matrix" ||
        data.kind === "heatmap"
      ) {
        page.family = "register";
        page.columns = [
          data.axes?.x || "Dimension",
          data.axes?.y || "Category",
          "Finding",
          "Value",
        ];
        page.rows = data.cells.map((cell) => [
          cell.x,
          cell.y,
          cell.label,
          cell.value ?? "Not established",
        ]);
        page.items = [];
      } else throw new PurposePageError("unsupported_exhibit", page.id);
    }
    pages.push(...paginate(page));
  }
  for (const table of doc.tables.filter(
    (item) => item.targetFormat !== "xlsx" && !usedTables.has(item.key),
  )) {
    pages.push(
      ...paginate(
        tablePage(table, {
          id: table.key,
          family: "register",
          title: table.title,
          question: `What does ${table.title} establish?`,
          scope: draftScope,
          sources: [],
          notes: `The point: ${table.title}\nRead each record across its declared columns.`,
          items: [],
        }),
      ),
    );
  }
  if (
    doc.exhibits.some(
      (exhibit) => exhibit.data && !usedExhibits.has(exhibit.key),
    )
  )
    throw new PurposePageError("unplaced_exhibit", "deck");
  if (doc.assumptions.length)
    pages.push(
      ...paginate({
        id: "assumptions",
        family: "register",
        title: "The recommendation retains its stated assumptions",
        question: "What must the reviewer validate?",
        scope: draftScope,
        sources: [],
        notes: "The point: assumptions remain explicit, not established facts.",
        columns: ["Assumption", "Basis", "Review"],
        rows: doc.assumptions.map((item) => [
          item.statement,
          item.basis,
          item.mustValidate ? "Validation required" : "Recorded assumption",
        ]),
        items: [],
      }),
    );
  if (doc.clientCompleteChecklist.length)
    pages.push(
      ...paginate({
        id: "open-inputs",
        family: "register",
        title: "Open inputs need an accountable owner",
        question: "What does the team still need to provide?",
        scope: draftScope,
        sources: [],
        notes: "The point: generating a readout does not close missing inputs.",
        columns: ["Input", "Owner", "Reason"],
        rows: doc.clientCompleteChecklist.map((item) => [
          item.label,
          item.owner,
          item.reason,
        ]),
        items: [],
      }),
    );
  for (const chart of charts) {
    if (usedCharts.has(chart.key)) continue;
    validatePurposeChart(chart, known);
    pages.push({
      id: chart.key,
      family: "trend",
      title: purposeChartHeadline([chart]),
      question: `What changed in ${chart.metric}?`,
      scope: `${chart.unit}. ${chart.period}. ${chart.interpretation}`,
      sources: chart.sourceIds,
      notes: `The point: ${purposeChartHeadline([chart])}\n${chart.interpretation}\n${chart.points.map((point) => `${point.label}: ${point.value} ${chart.unit}; ${point.sourceRow}`).join("\n")}`,
      items: [],
      chart,
    });
  }
  if (doc.actionRegister?.length)
    pages.push(
      ...paginate({
        id: "next-actions",
        family: "register",
        title: "Proposed actions prepare the evidence for the next decision",
        question: "Who acts next?",
        scope: "Proposed actions for owner review.",
        section: "HOW",
        sources: [],
        notes: doc.recommendation,
        columns: ["Proposed owner", "Next action", "Proposed evidence"],
        rows: doc.actionRegister.map((a) => [a.owner, a.action, a.evidence]),
        items: [],
      }),
    );
  else if (doc.nextActions.length)
    pages.push(
      ...paginate({
        id: "next-actions",
        family: "statement",
        title: "Next actions remain subject to owner review",
        question: "What should the team do next?",
        scope: draftScope,
        sources: [],
        notes: `The point: ${doc.recommendation}\nThe actions are proposals, not approval records.`,
        items: doc.nextActions.map((detail) => ({ label: "", detail })),
      }),
    );
  // Compatible groups share the register; review caveats are stated once.
  const grouped = purposeSourceGroups(doc.sourceRegister);
  if (grouped.length) {
    const entries = doc.sourceRegister;
    const commonReview =
      new Set(entries.map((s) => s.reviewStatus)).size === 1
        ? entries[0]?.reviewStatus
        : undefined;
    const reviewStates = [
      ...new Set(entries.map((s) => s.reviewStatus).filter(Boolean)),
    ];
    const keyedReview =
      !commonReview && reviewStates.length > 1 && reviewStates.length <= 3;
    const reviewKey = (state: string) => `R${reviewStates.indexOf(state) + 1}`;
    const reviewLegend = keyedReview
      ? reviewStates.map((s) => `${reviewKey(s!)}: ${s}`).join("; ")
      : commonReview;
    const scope = `${reviewLegend ? `${reviewLegend} · ` : ""}Source presence is not approval · ${[...new Set(entries.map((s) => s.asOf).filter(Boolean))].join(", ") || "Snapshot date not recorded"}`;
    const name = (value: string) =>
      value.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
    const register: PurposePage = {
      id: "sources",
      family: "register",
      section: "HOW",
      title: "Sources and traceability",
      question: "Where can each source be checked?",
      scope,
      sources: [],
      notes:
        "The point: source references let the reviewer trace claims. Review status remains separate.",
      columns: ["Ref", "Source", "Use and limitation"],
      columnWeights: [1.15, 4.5, 6.4],
      sourceRegister: true,
      tableFontSize: 14,
      referenceLabels,
      rows: grouped.flatMap((group) => [
        ["", name(group.family), ""],
        ...group.entries.map((source) => [
          `[${source.referenceId || source.citationNumber}]`,
          `${name(source.label)}${!commonReview && source.reviewStatus ? ` (${keyedReview ? reviewKey(source.reviewStatus) : source.reviewStatus})` : ""}`,
          (source.useAndLimitation
            ?.replace(/;?\s*human approval remains separate\.?/gi, "")
            .replace(/^\s*[a-z]/, (letter) => letter.toUpperCase()) ||
            "Use and limitations not recorded; confirm before relying on this source.") +
            purposeUpstreamReferences(source),
        ]),
      ]),
      items: [],
    };
    register.columnWeights = [
      3.6, 3.8, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 5.2, 5.4, 5.6,
    ]
      .map((width) => {
        const weights = [1.15, width, 10.9 - width];
        const candidate = { ...register, columnWeights: weights };
        return {
          weights,
          height: register.rows!.reduce(
            (sum, row) => sum + purposeRowHeight(candidate, row),
            0,
          ),
        };
      })
      .sort((a, b) => a.height - b.height)[0]!.weights;
    try {
      pages.push(...paginate(register));
    } catch (error) {
      if (
        !(error instanceof PurposePageError) ||
        error.code !== "message_needs_edit" ||
        grouped.length < 2
      )
        throw error;
      // A register is several evidence families, not one narrative message.
      // Pack complete families first so a new upstream locator cannot force the
      // writer to regenerate an otherwise valid deck or silently omit a source.
      const families: { names: string[]; rows: string[][] }[] = [];
      for (const row of register.rows!) {
        if (!row[0]) families.push({ names: [row[1]!], rows: [row] });
        else families.at(-1)!.rows.push(row);
      }
      const packed: typeof families = [];
      const fits = (rows: string[][]) =>
        purposeTableHeaderHeight(register) +
          rows.reduce((sum, row) => sum + purposeRowHeight(register, row), 0) <=
        purposeBodyHeight(register);
      for (const family of families) {
        const previous = packed.at(-1);
        if (previous && fits([...previous.rows, ...family.rows])) {
          previous.names.push(...family.names);
          previous.rows.push(...family.rows);
        } else packed.push(family);
      }
      // A one-source family belongs with its neighbour, not on an isolated page.
      for (let i = packed.length - 1; i >= 0; i--) {
        if (packed[i]!.rows.filter((row) => row[0]).length !== 1) continue;
        const neighbour = i ? i - 1 : i + 1;
        if (!packed[neighbour]) continue;
        const pair = [packed[i]!, packed[neighbour]!].sort(
          (a, b) =>
            register.rows!.indexOf(a.rows[0]!) -
            register.rows!.indexOf(b.rows[0]!),
        );
        packed[neighbour] = {
          names: pair.flatMap((p) => p.names),
          rows: pair.flatMap((p) => p.rows),
        };
        packed.splice(i, 1);
      }
      for (const [i, group] of packed.entries())
        pages.push(
          ...paginate({
            ...register,
            id: `sources-family-${i + 1}`,
            title: `Sources: ${group.names.join(" / ")}`,
            rows: group.rows,
          }),
        );
    }
  }
  for (const page of pages) {
    page.classification = doc.presentationCover?.classification;
    page.referenceLabels = Object.fromEntries(
      doc.sourceRegister.map((source) => [
        source.citationNumber,
        source.referenceId || String(source.citationNumber),
      ]),
    );
    for (const id of [...page.sources, ...sourceIds(page.notes)])
      if (!known.has(id)) throw new PurposePageError("unknown_source", page.id);
    const visibleSources = sourceIds(
      [
        page.title,
        page.scope,
        page.takeaway || "",
        page.takeawayLabel || "",
        page.exceptionPath || "",
        page.processNote || "",
        ...page.items.flatMap((item) => [
          item.label,
          item.detail,
          item.value || "",
        ]),
        ...(page.columns ?? []),
        ...(page.rows ?? []).flat(),
      ].join("\n"),
    );
    // Notes retain their references, but a page footer describes visible evidence.
    page.sources = [
      ...new Set([
        ...(visibleSources.length && page.family !== "trend"
          ? []
          : page.sources),
        ...visibleSources,
        ...(page.footerSources ?? []),
      ]),
    ];
    validateFrame(page, known);
  }
  if (pages.length > 60)
    throw new PurposePageError("page_budget_exceeded", "deck");
  for (let i = 1; i < pages.length; i++)
    if (
      pages[i]!.title.trim().toLowerCase() ===
      pages[i - 1]!.title.trim().toLowerCase()
    )
      throw new PurposePageError("repeated_title", pages[i]!.id);
  return pages;
}
