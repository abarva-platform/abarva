import type {
  RenderableDeliverable,
  RenderableDeckSlide,
  RenderableTable,
} from "./types";

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
  | "trend";
export interface PageIntent {
  question: string;
  scopeNote: string;
  shape?: "concepts" | "comparison" | "roles" | "decision";
  tableKey?: string;
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
}

export const PURPOSE_LAYOUTS = {
  cover: { maxItems: 1, minFontPt: 30 },
  statement: { maxItems: 3, minFontPt: 20 },
  concepts: { maxItems: 4, minFontPt: 18 },
  options: { maxItems: 3, minFontPt: 18 },
  roles: { maxItems: 4, minFontPt: 18 },
  process: { maxItems: 4, minFontPt: 18 },
  layers: { maxItems: 4, minFontPt: 18 },
  decision: { maxItems: 2, minFontPt: 18 },
  register: { maxItems: 6, minFontPt: 16 },
  trend: { maxItems: 12, minFontPt: 16 },
} as const;

export interface PurposePage {
  id: string;
  family: PurposeFamily;
  title: string;
  scope: string;
  question: string;
  sources: number[];
  notes: string;
  items: { label: string; detail: string }[];
  columns?: string[];
  rows?: string[][];
  chart?: PurposeChart;
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
const sourceIds = (text: string): number[] => [
  ...new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]))),
];

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

function paginate(page: PurposePage): PurposePage[] {
  if (page.family === "trend") return [page];
  if (page.columns && page.rows) {
    if (page.columns.length < 1 || page.columns.length > 5)
      throw new PurposePageError("table_needs_companion", page.id);
    const width = Math.floor(100 / page.columns.length);
    if (page.columns.some((cell) => estimatedLines(cell, width) > 2))
      throw new PurposePageError("column_label_needs_edit", page.id);
    const groups: string[][][] = [];
    let group: string[][] = [],
      used = 0.62;
    for (const row of page.rows) {
      if (row.length !== page.columns.length)
        throw new PurposePageError("table_shape", page.id);
      const lines = Math.max(...row.map((cell) => estimatedLines(cell, width)));
      // A single oversized record needs author review, not an unexplained truncation.
      const height = Math.max(0.5, lines * 0.245 + 0.17);
      if (height > 3.7) throw new PurposePageError("row_needs_edit", page.id);
      if (
        group.length &&
        (used + height > 4.35 ||
          group.length === PURPOSE_LAYOUTS.register.maxItems)
      ) {
        groups.push(group);
        group = [];
        used = 0.62;
      }
      group.push(row);
      used += height;
    }
    if (group.length) groups.push(group);
    return groups.map((rows, i) => ({
      ...page,
      id: `${page.id}:${i + 1}`,
      rows,
      title:
        groups.length > 1
          ? `${page.title} (${i + 1}/${groups.length})`
          : page.title,
    }));
  }
  const items = page.items.flatMap((item) => {
    const max = page.family === "statement" ? 260 : 140;
    if (estimatedLines(item.label, 27) > 2)
      throw new PurposePageError("label_needs_edit", page.id);
    const parts = splitText(item.detail, max);
    return (parts.length ? parts : [""]).map((detail, i) => ({
      label: i ? `${item.label} (continued)` : item.label,
      detail,
    }));
  });
  const cap = PURPOSE_LAYOUTS[page.family].maxItems;
  const pages: PurposePage[] = [];
  for (let i = 0; i < items.length; i += cap) {
    pages.push({
      ...page,
      id: `${page.id}:${pages.length + 1}`,
      items: items.slice(i, i + cap),
    });
  }
  if (!pages.length) throw new PurposePageError("empty_page", page.id);
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
  if (!table.rows.length) throw new PurposePageError("empty_table", base.id);
  if (table.rows.some((row) => row.length !== table.columns.length))
    throw new PurposePageError("table_shape", base.id);
  const sources = [
    ...new Set([...base.sources, ...sourceIds(table.rows.flat().join(" "))]),
  ];
  const family =
    table.pageShape === "roles"
      ? "roles"
      : table.pageShape === "comparison"
        ? "options"
        : table.pageShape === "decision"
          ? "decision"
          : "register";
  if (
    family !== "register" &&
    table.columns.length >= 2 &&
    table.columns.length <= 4
  ) {
    return {
      ...base,
      family,
      sources,
      items: table.rows.map((row) => ({
        label: row[0]!,
        detail: row
          .slice(1)
          .map((cell, i) => `${table.columns[i + 1]}: ${cell}`)
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
  if (chart.points.length > PURPOSE_LAYOUTS.trend.maxItems)
    throw new PurposePageError("chart_needs_split", chart.key);
  if (
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
  if (!doc.deckSlides?.length)
    throw new PurposePageError("storyline_missing", "deck");
  const pages: PurposePage[] = [
    {
      id: "cover",
      family: "cover",
      title: doc.title,
      question: "What decision does this readout support?",
      scope: draftScope,
      sources: [],
      notes: `The point: ${doc.recommendation}\n${draftScope}`,
      items: [
        { label: doc.clientDisplayName, detail: doc.initiativeDisplayName },
      ],
    },
  ];
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
    if (slide.pageIntent?.tableKey) {
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
          data.nodes.length <= 4 &&
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
    validatePurposeChart(chart, known);
    pages.push({
      id: chart.key,
      family: "trend",
      title: chart.title,
      question: `What changed in ${chart.metric}?`,
      scope: `${chart.unit}. ${chart.period}. ${chart.interpretation}`,
      sources: chart.sourceIds,
      notes: `The point: ${chart.title}\n${chart.interpretation}\n${chart.points.map((point) => `${point.label}: ${point.value} ${chart.unit}; ${point.sourceRow}`).join("\n")}`,
      items: [],
      chart,
    });
  }
  if (doc.nextActions.length)
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
  if (doc.sourceRegister.length)
    pages.push(
      ...paginate({
        id: "sources",
        family: "register",
        title: "Evidence behind this readout",
        question: "Where can each source be checked?",
        scope:
          "Source presence does not establish approval or resolve conflicting definitions.",
        sources: [],
        notes:
          "The point: source references let the reviewer trace claims. Review status remains separate.",
        columns: ["Ref", "Source", "Status / date"],
        rows: doc.sourceRegister.map((source) => [
          `[${source.citationNumber}]`,
          source.label,
          `${source.confidence}${source.asOf ? ` / ${source.asOf}` : ""}`,
        ]),
        items: [],
      }),
    );
  for (const page of pages) {
    page.sources = [
      ...new Set([
        ...page.sources,
        ...sourceIds(
          [
            page.title,
            page.scope,
            page.notes,
            ...page.items.flatMap((item) => [item.label, item.detail]),
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
  return pages;
}
