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
import { formatPurposeNumber } from "./purpose-number-display";
import {
  collapsePurposeCitations,
  purposeCitationIds,
  compactPurposeCitationIds,
} from "./purpose-citations";

function compactDisplayValue(value: string): string {
  // Source markers remain in the page footer; qualifiers remain beside the value.
  return value
    .replace(/\[\d+(?:\s*[-–,]\s*\d+)*\]/g, "")
    .trim()
    .replace(/^approximately\s+/i, "~");
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
export interface PageIntent {
  question: string;
  scopeNote: string;
  shape?: "concepts" | "comparison" | "roles" | "decision";
  tableKey?: string;
  section?: "CONTEXT" | "WHAT" | "WHY" | "VALIDATE" | "HOW";
  takeaway?: string;
  takeawayLabel?: string;
  chartKeys?: string[];
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
  axisMin?: number;
  axisMax?: number;
}

export const PURPOSE_LAYOUTS = {
  cover: { maxItems: 1, minFontPt: 30 },
  statement: { maxItems: 3, minFontPt: 20 },
  concepts: { maxItems: 4, minFontPt: 18 },
  options: { maxItems: 3, minFontPt: 18 },
  roles: { maxItems: 6, minFontPt: 18 },
  process: { maxItems: 5, minFontPt: 18 },
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
export const purposeBodyHeight = (page: PurposePage) =>
  page.sourceRegister ? 4.45 : page.takeaway ? 3.9 : 4.1;
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
                16,
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
    page.sourceRegister ? 0.32 : 0.45,
    ...row.map(
      (cell, i) =>
        referenceCellTextHeight(
          purposeCitations(cell, page.referenceLabels || {}),
          widths[i]!,
          16,
        ) + (page.sourceRegister ? 0.04 : 0.06),
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
  if (!page.scope.trim() || estimatedLines(page.scope, 125) > 2)
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
      const height = (rs: string[][]) =>
        headerHeight +
        rs.reduce((sum, row) => sum + purposeRowHeight(page, row), 0);
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
      const cuts = Array.from(
        { length: Math.max(0, rows.length - 3) },
        (_, i) => i + 2,
      )
        .map((at) => ({
          at,
          a: height(rows.slice(0, at)),
          b: height(tail(at)),
        }))
        .filter(
          (c) =>
            (!page.sourceRegister || Boolean(rows[c.at - 1]?.[0])) &&
            c.a <= bodyHeight + 0.001 &&
            c.b <= bodyHeight + 0.001 &&
            c.a >= bodyHeight * 0.55 &&
            c.b >= bodyHeight * 0.55,
        )
        .sort((a, b) => Math.abs(a.a - a.b) - Math.abs(b.a - b.b));
      if (height(rows) <= bodyHeight + 0.001) groups.splice(0, 2, rows);
      else if (cuts[0])
        groups.splice(0, 2, rows.slice(0, cuts[0].at), tail(cuts[0].at));
    }
    return groups.map((rows, i) => ({
      ...page,
      id: `${page.id}:${i + 1}`,
      rows,
      title: i ? `${page.title} (continued)` : page.title,
    }));
  }
  const items = page.items.flatMap((item) => {
    const max =
      page.family === "statement"
        ? 420
        : page.family === "decision"
          ? 550
          : 360;
    if (estimatedLines(item.label, 27) > 2)
      throw new PurposePageError("label_needs_edit", page.id);
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
              `${i.tone!.toUpperCase()} / ${i.label}`,
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
    scope: slide.pageIntent?.scopeNote || draftScope,
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

function tablePage(table: RenderableTable, base: PurposePage): PurposePage {
  if (table.numericCells?.length) {
    const rows = table.rows.map((r) => [...r]);
    for (const cell of table.numericCells) {
      if (rows[cell.row]?.[cell.column] === undefined)
        throw new PurposePageError("numeric_cell_missing", base.id);
      rows[cell.row]![cell.column] = formatPurposeNumber(cell.value, cell.type);
    }
    table = { ...table, rows };
  }
  if (!table.rows.length) throw new PurposePageError("empty_table", base.id);
  if (table.rows.some((row) => row.length !== table.columns.length))
    throw new PurposePageError("table_shape", base.id);
  const sources = [
    ...new Set([...base.sources, ...sourceIds(table.rows.flat().join(" "))]),
  ];
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
      items: table.rows.map((row, i) => ({
        label: row[0]!,
        tone: table.rowTones?.[i],
        ...(family === "big_numbers"
          ? { value: compactDisplayValue(row[1]!) }
          : {}),
        detail: row
          .slice(family === "big_numbers" ? 2 : 1)
          .map((cell, i) =>
            table.columns.length === 2 || family === "big_numbers"
              ? cell
              : `${table.columns[i + 1]}: ${cell}`,
          )
          .join("\n"),
      })),
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

/** Endpoint comparisons only: no causal or statistical trend is inferred. */
export function purposeChartHeadline(charts: readonly PurposeChart[]): string {
  return charts
    .map((chart) => {
      const first = chart.points[0]?.value;
      const last = chart.points.at(-1)?.value;
      if (first === undefined || last === undefined)
        throw new PurposePageError("chart_without_data", chart.key);
      return `${chart.metric} ends ${last > first ? "higher" : last < first ? "lower" : "unchanged"}`;
    })
    .join("; ");
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
  const coverTitle = doc.title.startsWith(doc.initiativeDisplayName)
    ? doc.title
        .slice(doc.initiativeDisplayName.length)
        .replace(/^\s*[-–—:/]\s*/, "")
        .trim() || doc.title
    : doc.title;
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
      items: [
        { label: doc.clientDisplayName, detail: doc.initiativeDisplayName },
      ],
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
      if (slide.governingMessage !== purposeChartHeadline(selected))
        throw new PurposePageError(
          "chart_headline_not_bound_to_measures",
          page.id,
        );
      if (slide.pageIntent.takeaway || slide.points?.length)
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
          columns: ["From", "To", "Handoff"],
          rows: [
            ...data.edges.map((edge) => [
              nodeLabel(edge.from),
              nodeLabel(edge.to),
              edge.label || "Declared connection",
            ]),
            ...unconnected.map((node) => [
              nodeLabel(node.id),
              "Not connected",
              "No edge declared",
            ]),
          ],
          items: [],
        };
        const chain =
          data.nodes.length <= PURPOSE_LAYOUTS.process.maxItems &&
          data.edges.length === data.nodes.length - 1 &&
          data.nodes
            .slice(0, -1)
            .every((node, i) =>
              data.edges.some(
                (edge) =>
                  edge.from === node.id &&
                  edge.to === data.nodes[i + 1]!.id &&
                  !edge.label,
              ),
            );
        if (chain)
          page = {
            ...page,
            family: "process",
            columns: undefined,
            rows: undefined,
            items: data.nodes.map((node) => ({
              label: node.label,
              detail: node.role || "",
            })),
          };
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
        title: "Owners close the evidence needed for the next decision",
        question: "Who acts next?",
        scope: "Proposed actions for owner review.",
        sources: [],
        notes: doc.recommendation,
        columns: ["Owner", "Action", "Evidence"],
        columnWeights: [2.6, 5.2, 4.25],
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
    const scope = `${commonReview ? `${commonReview} · ` : ""}Source presence is not approval · ${[...new Set(entries.map((s) => s.asOf).filter(Boolean))].join(", ") || "Snapshot date not recorded"}`;
    const name = (value: string) =>
      value.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
    const register: PurposePage = {
      id: "sources",
      family: "register",
      title: "Sources for the decision and diagnostic evidence",
      question: "Where can each source be checked?",
      scope,
      sources: [],
      notes:
        "The point: source references let the reviewer trace claims. Review status remains separate.",
      columns: ["Ref", "Source", "Use and limitation"],
      columnWeights: [0.85, 4.8, 6.4],
      sourceRegister: true,
      rows: grouped.flatMap((group) => [
        ["", name(group.family), ""],
        ...group.entries.map((source) => [
          `[${source.referenceId || source.citationNumber}]`,
          `${name(source.label)}${!commonReview && source.reviewStatus ? ` (${source.reviewStatus})` : ""}`,
          source.useAndLimitation?.replace(
            /;?\s*human approval remains separate\.?/gi,
            "",
          ) ||
            "Use and limitations not recorded; confirm before relying on this source.",
        ]),
      ]),
      items: [],
    };
    pages.push(...paginate(register));
  }
  for (const page of pages) {
    page.classification = doc.presentationCover?.classification;
    page.referenceLabels = Object.fromEntries(
      doc.sourceRegister.map((source) => [
        source.citationNumber,
        source.referenceId || String(source.citationNumber),
      ]),
    );
    page.sources = [
      ...new Set([
        ...page.sources,
        ...sourceIds(
          [
            page.title,
            page.scope,
            page.takeaway || "",
            page.takeawayLabel || "",
            page.notes,
            ...page.items.flatMap((item) => [
              item.label,
              item.detail,
              item.value || "",
            ]),
            ...(page.columns ?? []),
            ...(page.rows ?? []).flat(),
          ].join("\n"),
        ),
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
