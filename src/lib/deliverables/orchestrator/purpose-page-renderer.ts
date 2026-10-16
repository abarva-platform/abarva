import "server-only";
import PptxGenJS from "pptxgenjs";
import { COLORS } from "@/lib/design/design-tokens";
import { inspectDeck, type InspectedDeck } from "./deck-inspection";
import { referenceCellTextHeight } from "./reference-deck-layout";
import {
  estimatedLines,
  planPurposePages,
  PurposePageError,
  purposeCitations,
  purposeTableWidths,
  purposeStatementHeight,
  type PurposeChart,
  type PurposePage,
} from "./purpose-page-plan";
import type { RenderableDeliverable } from "./types";
import { purposeBrand, PURPOSE_COLORS } from "./purpose-page-brand";

const C = Object.fromEntries(
  Object.entries(COLORS).map(([key, value]) => [key, value.slice(1)]),
) as Record<keyof typeof COLORS, string>;
C.navy = PURPOSE_COLORS.accent;
C.skyPale = PURPOSE_COLORS.pale;
C.deckInk = PURPOSE_COLORS.ink;
C.deckMuted = PURPOSE_COLORS.muted;
const X = 0.64,
  W = 12.05,
  TOP = 2.08,
  H = 4.1;
type Slide = PptxGenJS.Slide;

export function purposeDensity(page: PurposePage) {
  const words = [
    ...page.items.flatMap((item) => [item.label, item.detail]),
    ...(page.rows ?? []).flat(),
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  const graphic = page.family === "trend" || page.family === "cover";
  // This is a content-load warning, not a pixel-area score. Backgrounds never count.
  const sparse = !graphic && words < 70;
  return {
    words,
    variant: sparse ? "compact" : "standard",
    reviewRequired: sparse,
  };
}

const reference = (page: PurposePage, id: number) =>
  `[${page.referenceLabels?.[id] || id}]`;
const copy = (page: PurposePage, value: string) =>
  purposeCitations(value, page.referenceLabels || {});
const sourceLine = (page: PurposePage) =>
  page.sources.length
    ? copy(page, page.sources.map((id) => `[${id}]`).join(" "))
    : "";
const semanticColors = {
  candidate: C.navy,
  condition: "9C650E",
  later: C.deckMuted,
  risk: "AE3547",
};

function text(
  slide: Slide,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  options: PptxGenJS.TextPropsOptions = {},
) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    fontFace: "Arial",
    fontSize,
    color: C.deckInk,
    margin: 0,
    breakLine: false,
    valign: "top",
    objectName: `purpose:text:${x}:${y}`,
    ...options,
  });
}

function frame(
  pptx: PptxGenJS,
  page: PurposePage,
  index: number,
  total: number,
): Slide {
  const slide = pptx.addSlide();
  const cover = page.family === "cover";
  const muted = cover ? C.deckCoverMuted : C.deckMuted;
  slide.background = { color: cover ? C.deckInk : C.white };
  const brand = purposeBrand(cover ? "dark" : "light");
  slide.addImage({
    data: `image/png;base64,${brand.png.toString("base64")}`,
    x: X,
    y: 0.19,
    w: 2.25,
    h: 2.25 / brand.aspect,
    objectName: "purpose:brand",
  });
  text(
    slide,
    `${page.section || (page.family === "cover" ? "CONTEXT" : "VALIDATE")}  /  DISCOVERY`,
    8.7,
    0.22,
    4,
    0.24,
    11,
    {
      align: "right",
      color: muted,
      objectName: "purpose:section",
    },
  );
  text(
    slide,
    copy(page, page.title),
    X,
    cover ? 4.1 : 0.55,
    W,
    cover ? 0.9 : 1.1,
    cover ? 26 : 30,
    {
      fontFace: "Georgia",
      color: cover ? C.white : C.deckInk,
      objectName: "purpose:title",
    },
  );
  const scopeFont = cover
    ? 22
    : [14, 13, 12].find(
        (size) =>
          referenceCellTextHeight(copy(page, page.scope), W, size) <= 0.36,
      );
  if (!scopeFont) throw new PurposePageError("scope_needs_edit", page.id);
  text(
    slide,
    copy(page, page.scope),
    X,
    cover ? 5.0 : 1.65,
    W,
    cover ? 0.85 : 0.36,
    scopeFont,
    {
      color: muted,
      objectName: "purpose:scope",
    },
  );
  slide.addShape(pptx.ShapeType.line, {
    x: X,
    y: 6.83,
    w: W,
    h: 0,
    line: { color: C.deckRule, width: 0.8 },
  });
  text(
    slide,
    `${page.classification ? `${page.classification}. ` : ""}AI-generated working draft. Human approval required.`,
    X,
    6.98,
    7.6,
    0.22,
    10,
    { color: muted, objectName: "purpose:status" },
  );
  text(
    slide,
    `${sourceLine(page)}     ${index + 1} / ${total}`,
    8.45,
    6.98,
    4.25,
    0.22,
    10,
    { color: muted, align: "right", objectName: "purpose:sources" },
  );
  slide.addNotes(
    `${copy(page, page.notes)}\nScope: ${page.scope}\nEvidence: ${page.sources.map((id) => reference(page, id)).join(" ") || "Document framing / source register"}\nLayout: ${page.family}; ${purposeDensity(page).variant}`,
  );
  if (page.takeaway) {
    rule(pptx, slide, X, 6.35, 0.12, C.navy, 3);
    const labelW = page.takeawayLabel ? 2.55 : 0;
    if (page.takeawayLabel)
      text(slide, page.takeawayLabel, X + 0.25, 6.23, labelW - 0.15, 0.58, 16, {
        bold: true,
        color: C.navy,
        objectName: "purpose:annotation:takeaway-label",
      });
    text(
      slide,
      copy(page, page.takeaway),
      X + 0.25 + labelW,
      6.23,
      W - 0.25 - labelW,
      0.58,
      16,
      {
        color: C.deckMuted,
        objectName: "purpose:annotation:takeaway",
      },
    );
  }
  return slide;
}

function labelledStatements(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const h = H / page.items.length;
  page.items.forEach((item, i) => {
    const y = TOP + i * h,
      color = semanticColors[item.tone!];
    rule(pptx, slide, X, y, W);
    slide.addShape(pptx.ShapeType.rect, {
      x: X,
      y: y + 0.14,
      w: 0.06,
      h: h - 0.28,
      fill: { color },
      line: { color },
      objectName: `purpose:statement-tone:${i}:${item.tone}`,
    });
    text(slide, item.label, X + 0.25, y + 0.18, 2.65, h - 0.3, 20, {
      bold: true,
      color,
      objectName: `purpose:statement-label:${i}`,
    });
    text(
      slide,
      copy(page, item.detail),
      X + 3.15,
      y + 0.18,
      W - 3.15,
      h - 0.3,
      20,
      { objectName: `purpose:statement-detail:${i}` },
    );
  });
}

function bigNumbers(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const w = (W - 0.65) / 2;
  page.items.forEach((item, i) => {
    const x = X + i * (w + 0.65),
      color = semanticColors[item.tone || (i ? "condition" : "candidate")];
    text(slide, item.label, x, TOP + 0.15, w, 0.8, 22, { bold: true });
    text(slide, item.value!, x, TOP + 1.15, w, 1.2, 54, {
      color,
      bold: true,
      objectName: `purpose:number:${i}`,
    });
    rule(pptx, slide, x, TOP + 2.6, w, color, 2);
    text(slide, copy(page, item.detail), x, TOP + 2.85, w, 1.15, 18, {
      objectName: `purpose:number-basis:${i}`,
    });
  });
}

function cards(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const count = page.items.length;
  const columns = page.family === "decision" ? 2 : Math.max(1, count);
  const rows = Math.ceil(count / columns);
  const bodyH = purposeDensity(page).variant === "compact" ? 2.8 : H;
  const bodyTop = TOP + (H - bodyH) / 2;
  const gap = 0.25,
    w = (W - (columns - 1) * gap) / columns,
    h = (bodyH - (rows - 1) * gap) / rows;
  for (const [i, item] of page.items.entries()) {
    const x = X + (i % columns) * (w + gap),
      y = bodyTop + Math.floor(i / columns) * (h + gap);
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w,
      h,
      line: { color: C.deckRule, width: 0.7 },
      fill: {
        color: page.family === "decision" && i === 1 ? C.amberSoft : C.skyPale,
      },
    });
    const label = item.label || `${i + 1}`;
    if (estimatedLines(label, Math.floor((w - 0.4) * 6.8)) > 2)
      throw new PurposePageError("card_label_needs_edit", page.id);
    text(slide, label, x + 0.2, y + 0.2, w - 0.4, 0.72, 20, {
      bold: true,
      objectName: `purpose:item-label:${i}`,
    });
    const detailY = y + 1.02,
      detailH = h - 1.22;
    const chars = Math.floor((w - 0.4) * 7.3);
    if (estimatedLines(item.detail, chars) * 0.29 > detailH + 0.05)
      throw new PurposePageError("card_text_needs_split", page.id);
    text(
      slide,
      copy(page, item.detail),
      x + 0.2,
      detailY,
      w - 0.4,
      detailH,
      18,
      {
        objectName: `purpose:item-detail:${i}`,
      },
    );
  }
}

function rule(
  pptx: PptxGenJS,
  slide: Slide,
  x: number,
  y: number,
  w: number,
  color: string = C.deckRule,
  width = 1,
) {
  slide.addShape(pptx.ShapeType.line, {
    x,
    y,
    w,
    h: 0,
    line: { color, width },
  });
}

function decision(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const w = (W - 0.6) / 2;
  page.items.forEach((item, i) => {
    const x = X + i * (w + 0.6),
      color = i === 0 ? C.navy : C.deckMuted;
    rule(pptx, slide, x, TOP + 0.3, w, color, 3);
    text(slide, item.label || `Decision ${i + 1}`, x, TOP + 0.58, w, 1.05, 24, {
      bold: true,
      color,
      objectName: `purpose:decision:${i}`,
    });
    text(slide, copy(page, item.detail), x, TOP + 1.78, w - 0.15, 2.2, 20);
  });
  if (!page.takeaway)
    text(slide, "Decision for review", X, 6.25, W, 0.3, 12, {
      color: C.deckMuted,
      objectName: "purpose:annotation:decision",
    });
}

function roles(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const bodyH =
    purposeDensity(page).variant === "compact"
      ? Math.min(H, page.items.length * 1.15)
      : H;
  const h = bodyH / page.items.length,
    top = TOP + (H - bodyH) / 2;
  page.items.forEach((item, i) => {
    const y = top + i * h;
    rule(pptx, slide, X, y, W);
    slide.addShape(pptx.ShapeType.rect, {
      x: X,
      y: y + 0.04,
      w: 3.5,
      h: 0.04,
      line: { color: C.navy, transparency: 100 },
      fill: { color: C.navy },
    });
    text(
      slide,
      item.label || `Role ${i + 1}`,
      X + 0.22,
      y + 0.12,
      3.06,
      h - 0.14,
      19,
      { color: C.deckInk, bold: true, objectName: `purpose:role:${i}` },
    );
    text(
      slide,
      copy(page, item.detail),
      X + 3.85,
      y + 0.12,
      W - 4.0,
      h - 0.14,
      18,
    );
  });
}

function options(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const gap = 0.5,
    w = (W - (page.items.length - 1) * gap) / page.items.length;
  if (
    page.items.some((item) => referenceCellTextHeight(item.detail, w, 18) > 1.9)
  ) {
    const h = H / page.items.length;
    page.items.forEach((item, i) => {
      const y = TOP + i * h;
      rule(pptx, slide, X, y, W);
      text(slide, item.label, X, y + 0.15, 3.5, h - 0.25, 20, {
        bold: true,
        objectName: `purpose:option:${i}`,
      });
      text(
        slide,
        copy(page, item.detail),
        X + 3.9,
        y + 0.15,
        W - 3.9,
        h - 0.25,
        18,
      );
    });
    return;
  }
  page.items.forEach((item, i) => {
    const x = X + i * (w + gap);
    text(slide, String(i + 1).padStart(2, "0"), x, TOP + 0.25, w, 0.65, 36, {
      color: C.navy,
    });
    text(slide, item.label || `Option ${i + 1}`, x, TOP + 1.05, w, 0.85, 24, {
      bold: true,
      objectName: `purpose:option:${i}`,
    });
    rule(pptx, slide, x, TOP + 2.0, w);
    text(slide, copy(page, item.detail), x, TOP + 2.2, w, 1.9, 18);
  });
}

function renderProcess(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const gap = 0.4,
    w = (W - (page.items.length - 1) * gap) / page.items.length;
  const labelH = Math.max(
    0.85,
    ...page.items.map((item) => referenceCellTextHeight(item.label, w, 24)),
  );
  const detailTop = TOP + 1.5 + labelH + 0.15;
  const detailH = TOP + H - detailTop;
  if (
    detailH < 0 ||
    page.items.some(
      (item) =>
        referenceCellTextHeight(copy(page, item.detail), w, 18) > detailH,
    )
  )
    throw new PurposePageError("process_text_needs_edit", page.id);
  page.items.forEach((item, i) => {
    const x = X + i * (w + gap);
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: TOP + 0.5,
      w: 0.6,
      h: 0.6,
      line: { color: C.navy },
      fill: { color: C.navy },
    });
    text(slide, String(i + 1), x, TOP + 0.61, 0.6, 0.4, 18, {
      color: C.white,
      bold: true,
      align: "center",
    });
    if (i < page.items.length - 1)
      slide.addShape(pptx.ShapeType.line, {
        x: x + 0.75,
        y: TOP + 0.8,
        w: w + gap - 0.95,
        h: 0,
        line: { color: C.navy, width: 1.4, endArrowType: "triangle" },
      });
    text(slide, item.label, x, TOP + 1.5, w, labelH, 24, {
      bold: true,
      objectName: `purpose:process:${i}`,
    });
    text(slide, copy(page, item.detail), x, detailTop, w, detailH, 18);
  });
}

function renderPage(
  pptx: PptxGenJS,
  page: PurposePage,
  index: number,
  total: number,
) {
  const slide = frame(pptx, page, index, total);
  if (page.family === "cover") {
    text(slide, page.items[0]!.label, X, 1.35, W, 0.5, 22, {
      color: C.deckCoverMuted,
      bold: true,
    });
    text(slide, page.items[0]!.detail, X, 2.15, W, 1.6, 44, {
      fontFace: "Georgia",
      color: C.white,
    });
    const edition = [page.cover?.edition, page.cover?.date]
      .filter(Boolean)
      .join(" / ");
    if (edition)
      text(slide, edition, X, 6.0, W, 0.38, 18, {
        objectName: "purpose:edition",
        color: C.deckCoverMuted,
      });
    if (page.cover?.milestone)
      text(slide, page.cover.milestone, X, 6.4, W, 0.3, 18, {
        color: C.deckCoverMuted,
      });
  } else if (page.family === "register") {
    const columns = page.columns!,
      rows = page.rows!;
    const weights = purposeTableWidths(page);
    const chars = weights.map((w) => Math.floor(100 * w));
    const lineCounts = rows.map((row) =>
      Math.max(...row.map((cell, i) => estimatedLines(cell, chars[i]!))),
    );
    const heights = [
      0.62,
      ...lineCounts.map((lines) =>
        page.sourceRegister
          ? Math.max(0.45, lines * 0.23 + 0.12)
          : Math.max(0.5, lines * 0.245 + 0.17),
      ),
    ];
    const height = heights.reduce((sum, h) => sum + h, 0);
    if (height > H + 0.001)
      throw new PurposePageError("table_text_needs_split", page.id);
    slide.addTable(
      [
        columns.map((cell) => ({
          text: cell,
          options: { bold: true, color: C.white, fill: { color: C.navy } },
        })),
        ...rows.map((row, i) =>
          row.map((cell) => ({
            text: copy(page, cell),
            options: { fill: { color: i % 2 ? C.skyPale : C.white } },
          })),
        ),
      ],
      {
        x: X,
        y: TOP + Math.max(0, (H - height) / 2),
        w: W,
        colW: weights.map((w) => W * w),
        rowH: heights,
        fontFace: "Arial",
        fontSize: 16,
        color: C.deckInk,
        margin: 0.08,
        border: { type: "solid", color: C.deckRule, pt: 0.5 },
        fill: { color: C.white },
        valign: "top",
        autoPage: false,
        objectName: "purpose:native-table",
      },
    );
  } else if (page.family === "trend") {
    const charts = page.charts || [page.chart!];
    charts.forEach((chart, index) => {
      const width = (W - (charts.length - 1) * 0.45) / charts.length;
      const x = X + index * (width + 0.45);
      text(slide, chart.metric, x, TOP, width, 0.65, 22, { bold: true });
      text(
        slide,
        `${chart.unit} / ${chart.period}`,
        x,
        TOP + 0.67,
        width,
        0.32,
        14,
        {
          color: C.deckMuted,
          objectName: `purpose:annotation:chart-unit:${index}`,
        },
      );
      slide.addChart(
        pptx.ChartType.line,
        [
          {
            name: chart.metric,
            labels: chart.points.map((point) =>
              point.label.replace(
                /^(January|February|March|April|May|June|July|August|September|October|November|December)$/i,
                (month) => month.slice(0, 3),
              ),
            ),
            values: chart.points.map((point) => point.value),
          },
        ],
        {
          x,
          y: TOP + 1.08,
          w: width,
          h: H - 1.25,
          showLegend: false,
          showTitle: false,
          showValue: charts.length === 1,
          catAxisLabelFontFace: "Arial",
          catAxisLabelFontSize: 12,
          // PptxGenJS omits zero (auto-rotation); this rounds to explicit OOXML rot="0".
          catAxisLabelRotate: Number.EPSILON,
          valAxisLabelFontFace: "Arial",
          valAxisLabelFontSize: 16,
          lineDataSymbol: "circle",
          lineDataSymbolSize: 5,
          chartColors: [C.navy],
          valAxisMinVal: chart.axisMin,
          valAxisMaxVal: chart.axisMax,
          dataLabelFormatCode: "0.##",
          dataLabelPosition: "t",
          dataLabelColor: C.deckInk,
          dataLabelFontSize: 16,
          valGridLine: { color: C.deckRule },
          showValAxisTitle: false,
        },
      );
    });
  } else if (page.family === "labelled_statements") {
    labelledStatements(pptx, slide, page);
  } else if (page.family === "big_numbers") {
    bigNumbers(pptx, slide, page);
  } else if (page.family === "process") {
    renderProcess(pptx, slide, page);
  } else if (page.family === "decision") {
    decision(pptx, slide, page);
  } else if (page.family === "roles") {
    roles(pptx, slide, page);
  } else if (page.family === "options") {
    options(pptx, slide, page);
  } else if (page.family === "layers") {
    const bodyH =
      purposeDensity(page).variant === "compact"
        ? Math.min(H, page.items.length * 1.15)
        : H;
    const h = bodyH / page.items.length,
      top = TOP + (H - bodyH) / 2;
    page.items.forEach((item, i) => {
      const y = top + i * h;
      slide.addShape(pptx.ShapeType.rect, {
        x: X,
        y,
        w: 3,
        h: h - 0.12,
        line: { color: C.deckRule },
        fill: { color: C.skyPale },
      });
      text(slide, item.label, X + 0.18, y + 0.18, 2.64, h - 0.36, 18, {
        bold: true,
      });
      text(
        slide,
        copy(page, item.detail),
        X + 3.25,
        y + 0.18,
        W - 3.25,
        h - 0.36,
        18,
      );
    });
  } else if (page.family === "statement") {
    const heights = page.items.map((item) =>
      purposeStatementHeight(copy(page, item.detail)),
    );
    const used = heights.reduce((a, b) => a + b, 0);
    if (used > H + 0.05)
      throw new PurposePageError("statement_needs_split", page.id);
    let cursor = TOP + (H - used) / 2;
    page.items.forEach((item, i) => {
      const y = cursor,
        h = heights[i]!;
      cursor += h;
      text(slide, String(i + 1).padStart(2, "0"), X, y + 0.1, 0.6, 0.4, 18, {
        color: C.navy,
        bold: true,
      });
      text(
        slide,
        copy(page, item.detail),
        X + 0.85,
        y + 0.1,
        W - 0.85,
        h - 0.2,
        22,
      );
    });
  } else cards(pptx, slide, page);
}

export async function renderPurposeDeck(
  doc: RenderableDeliverable,
  charts: readonly PurposeChart[] = [],
): Promise<Buffer> {
  const pages = planPurposePages(doc, charts);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Abarva";
  pptx.company = "Abarva";
  pptx.title = doc.title;
  pptx.subject = doc.initiativeDisplayName;
  pages.forEach((page, index) => renderPage(pptx, page, index, pages.length));
  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  const inspection = await inspectDeck(buffer);
  validatePurposeInspection(inspection, pages);
  return buffer;
}

/** Structural geometry checks complement, but do not replace, raster review. */
export function validatePurposeInspection(
  inspection: InspectedDeck,
  pages: readonly PurposePage[],
): void {
  if (
    inspection.slideCount !== pages.length ||
    inspection.slides.some(
      (slide) => slide.offCanvas.length || !slide.notesText,
    )
  )
    throw new PurposePageError("render_integrity", "deck");
  if (
    inspection.slides.reduce((sum, slide) => sum + slide.chartCount, 0) !==
    pages.reduce(
      (sum, page) => sum + (page.charts?.length || (page.chart ? 1 : 0)),
      0,
    )
  )
    throw new PurposePageError("native_chart_missing", "deck");
  for (const [i, slide] of inspection.slides.entries()) {
    const page = pages[i]!;
    if (
      slide.namedText?.["purpose:title"] !== copy(page, page.title) ||
      slide.namedText?.["purpose:scope"] !== copy(page, page.scope) ||
      !slide.namedText?.["purpose:status"]?.includes("Human approval required")
    )
      throw new PurposePageError("frame_missing", page.id);
    if (
      page.section &&
      !slide.namedText?.["purpose:section"]?.startsWith(page.section)
    )
      throw new PurposePageError("section_missing", page.id);
    if (
      page.takeaway &&
      slide.namedText?.["purpose:annotation:takeaway"] !==
        copy(page, page.takeaway)
    )
      throw new PurposePageError("takeaway_missing", page.id);
    if (
      page.takeawayLabel &&
      slide.namedText?.["purpose:annotation:takeaway-label"] !==
        page.takeawayLabel
    )
      throw new PurposePageError("takeaway_label_missing", page.id);
    if (page.family === "labelled_statements")
      page.items.forEach((item, n) => {
        if (
          slide.namedText?.[`purpose:statement-label:${n}`] !== item.label ||
          !slide.objectNames?.includes(
            `purpose:statement-tone:${n}:${item.tone}`,
          )
        )
          throw new PurposePageError("statement_semantics_missing", page.id);
      });
    if (page.family === "big_numbers")
      page.items.forEach((item, n) => {
        const box = slide.purposeText?.find(
          (t) => t.name === `purpose:number:${n}`,
        );
        if (!box || box.text !== item.value || box.fontSize < 48)
          throw new PurposePageError("display_number_missing", page.id);
      });
    if (
      page.classification &&
      !slide.namedText?.["purpose:status"]?.includes(page.classification)
    )
      throw new PurposePageError("classification_missing", page.id);
    if (
      page.sources.length &&
      !slide.namedText?.["purpose:sources"]?.includes(sourceLine(page))
    )
      throw new PurposePageError("citation_missing", page.id);
    if (page.family === "register" && !slide.tableCount)
      throw new PurposePageError("native_table_missing", page.id);
    const texts = slide.purposeText ?? [];
    if (!texts.length)
      throw new PurposePageError("text_geometry_missing", page.id);
    for (const [t, box] of texts.entries()) {
      const minimum =
        box.yIn < 2 ||
        box.yIn > 6.8 ||
        box.name.startsWith("purpose:annotation:")
          ? 10
          : 18;
      if (!Number.isFinite(box.fontSize) || box.fontSize < minimum)
        throw new PurposePageError("text_too_small", page.id);
      if (
        box.heightIn + 0.04 <
        referenceCellTextHeight(box.text, box.widthIn, box.fontSize)
      )
        throw new PurposePageError(
          "text_does_not_fit",
          `${page.id}/${box.name}`,
        );
      for (const other of texts.slice(t + 1)) {
        const x =
          Math.min(box.xIn + box.widthIn, other.xIn + other.widthIn) -
          Math.max(box.xIn, other.xIn);
        const y =
          Math.min(box.yIn + box.heightIn, other.yIn + other.heightIn) -
          Math.max(box.yIn, other.yIn);
        if (x > 0.02 && y > 0.02)
          throw new PurposePageError("text_overlap", page.id);
      }
    }
  }
}
