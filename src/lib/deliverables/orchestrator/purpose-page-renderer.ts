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
  purposeRowHeight,
  purposeBodyHeight,
  purposeTableHeaderHeight,
  purposeScopeLayout,
  purposeChartAxis,
  purposeStatusLabel,
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
  W = 12.05;
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
const titleCopy = (page: PurposePage) =>
  copy(page, page.title.replace(/\[\d+(?:\s*[-–,]\s*\d+)*\]/g, "")).trim();
const sourceLine = (page: PurposePage) => {
  let count = Math.min(5, page.sources.length);
  while (count) {
    const shown = copy(
      page,
      page.sources
        .slice(0, count)
        .map((id) => `[${id}]`)
        .join(" "),
    );
    const rest = page.sources.length - count;
    const line = `${shown}${rest ? ` +${rest}` : ""}`;
    if (line.length <= 44 || count === 1) return line;
    count--;
  }
  return "";
};
const semanticColors = {
  candidate: C.navy,
  condition: "9C650E",
  later: C.deckMuted,
  risk: "AE3547",
};

export function balancedPurposeTitle(value: string): string {
  if (value.length <= 68 || value.includes("\n")) return value;
  const words = value.split(/\s+/);
  const cuts = words.slice(1, -2).map((_, i) => i + 2);
  const at = cuts.sort(
    (a, b) =>
      Math.abs(
        words.slice(0, a).join(" ").length - words.slice(a).join(" ").length,
      ) -
      Math.abs(
        words.slice(0, b).join(" ").length - words.slice(b).join(" ").length,
      ),
  )[0];
  return at
    ? `${words.slice(0, at).join(" ")}\n${words.slice(at).join(" ")}`
    : value;
}

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
  if (cover) {
    const brand = purposeBrand("dark");
    slide.addImage({
      data: `image/png;base64,${brand.png.toString("base64")}`,
      x: X,
      y: 0.19,
      w: 2.25,
      h: 2.25 / brand.aspect,
      objectName: "purpose:brand",
    });
  }
  text(
    slide,
    `${cover ? "MOVES" : page.section || "VALIDATE"}  /  P2 DISCOVERY`,
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
    balancedPurposeTitle(titleCopy(page)),
    X,
    cover ? 3.65 : 0.55,
    W,
    cover ? 0.9 : 1.1,
    cover ? 26 : 30,
    {
      fontFace: "Georgia",
      color: cover ? C.white : C.deckInk,
      objectName: "purpose:title",
    },
  );
  const scopeLayout = cover
    ? { fontSize: 22, height: 0.85 }
    : purposeScopeLayout(page);
  text(
    slide,
    copy(page, page.scope),
    X,
    cover ? 4.65 : 1.65,
    W,
    scopeLayout.height,
    scopeLayout.fontSize,
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
    6.94,
    7.6,
    0.22,
    10,
    { color: muted, objectName: "purpose:status" },
  );
  text(slide, sourceLine(page), 8.45, 6.94, 3.2, 0.22, 10, {
    color: muted,
    align: "right",
    objectName: "purpose:sources",
  });
  text(slide, `${index + 1} / ${total}`, 11.9, 6.94, 0.8, 0.22, 10, {
    color: muted,
    align: "right",
    objectName: "purpose:page-number",
  });
  slide.addNotes(
    `${copy(page, page.notes)}\nScope: ${page.scope}\nEvidence: ${page.sources.map((id) => reference(page, id)).join(" ") || "Document framing / source register"}\nLayout: ${page.family}; ${purposeDensity(page).variant}`,
  );
  if (page.takeaway) {
    const takeawayText = copy(page, page.takeaway);
    slide.addShape(pptx.ShapeType.line, {
      x: X,
      y: 6.23,
      w: 0,
      h: 0.5,
      line: { color: C.navy, width: 2 },
      objectName: "purpose:annotation:takeaway-rule",
    });
    const labelW = page.takeawayLabel ? 2.55 : 0;
    if (page.takeawayLabel)
      text(slide, page.takeawayLabel, X + 0.25, 6.23, labelW - 0.15, 0.58, 16, {
        bold: true,
        color: C.navy,
        objectName: "purpose:annotation:takeaway-label",
      });
    text(
      slide,
      takeawayText,
      X + 0.25 + labelW,
      6.23,
      W - 0.25 - labelW,
      0.58,
      referenceCellTextHeight(takeawayText, W - 0.25 - labelW, 16) > 0.36
        ? 15
        : 16,
      {
        color: C.deckMuted,
        objectName: "purpose:annotation:takeaway",
      },
    );
  }
  return slide;
}

function labelledStatements(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const TOP = purposeScopeLayout(page).bodyTop;
  const h = purposeBodyHeight(page) / page.items.length;
  const labelWidth = page.statementLabelWidth ?? 3.2;
  const inset = page.compact ? 0.06 : 0.18;
  const padding = page.compact ? 0.12 : 0.3;
  page.items.forEach((item, i) => {
    const y = TOP + i * h,
      color = semanticColors[item.tone!];
    rule(pptx, slide, X, y, W);
    slide.addShape(pptx.ShapeType.rect, {
      x: X,
      y: y + inset,
      w: 0.06,
      h: h - padding,
      fill: { color },
      line: { color },
      objectName: `purpose:statement-tone:${i}:${item.tone}`,
    });
    text(
      slide,
      purposeStatusLabel(item.tone!, item.label),
      X + 0.25,
      y + inset,
      labelWidth,
      h - padding,
      page.compact ? 18 : 20,
      {
        bold: true,
        color,
        objectName: `purpose:statement-label:${i}`,
      },
    );
    text(
      slide,
      copy(page, item.detail),
      X + labelWidth + 0.5,
      y + inset,
      W - labelWidth - 0.5,
      h - padding,
      page.compact ? 18 : 20,
      { objectName: `purpose:statement-detail:${i}` },
    );
  });
}

function bigNumbers(pptx: PptxGenJS, slide: Slide, page: PurposePage) {
  const TOP = purposeScopeLayout(page).bodyTop;
  const w = (W - 0.65) / 2;
  page.items.forEach((item, i) => {
    const x = X + i * (w + 0.65),
      color = semanticColors[item.tone || (i ? "condition" : "candidate")];
    text(slide, item.label, x, TOP + 0.15, w, 0.9, 22, { bold: true });
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
  const TOP = purposeScopeLayout(page).bodyTop;
  const H = purposeBodyHeight(page);
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
  const TOP = purposeScopeLayout(page).bodyTop;
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
  const TOP = purposeScopeLayout(page).bodyTop;
  const H = purposeBodyHeight(page);
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
  const TOP = purposeScopeLayout(page).bodyTop;
  const H = purposeBodyHeight(page);
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
  const TOP = purposeScopeLayout(page).bodyTop;
  // The exception path takes one line under the steps rather than a column beside them.
  const exceptionH = page.exceptionPath ? 0.55 : 0;
  const H = purposeBodyHeight(page) - exceptionH;
  if (page.exceptionPath)
    text(
      slide,
      `Exception path: ${copy(page, page.exceptionPath)}`,
      X,
      TOP + H + 0.1,
      W,
      0.4,
      18,
      { objectName: "purpose:process:exception", color: C.navy },
    );
  const gap = 0.4,
    w = (W - (page.items.length - 1) * gap) / page.items.length;
  const layouts = [24, 22, 20].map((font) => {
    const labelH = Math.max(
      0.85,
      ...page.items.map((item) => referenceCellTextHeight(item.label, w, font)),
    );
    const labelOffset = font === 24 ? 1.5 : 1.2;
    const detailH = H - labelOffset - labelH - 0.15;
    return {
      font,
      labelH,
      labelOffset,
      fits:
        detailH >= 0 &&
        page.items.every(
          (item) =>
            referenceCellTextHeight(copy(page, item.detail), w, 18) <= detailH,
        ),
    };
  });
  const layout = layouts.find((candidate) => candidate.fits) || layouts[0]!;
  const { labelH, labelOffset } = layout;
  const detailTop = TOP + labelOffset + labelH + 0.15;
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
    text(slide, item.label, x, TOP + labelOffset, w, labelH, layout.font, {
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
  const TOP = purposeScopeLayout(page).bodyTop;
  const H = purposeBodyHeight(page);
  if (page.family === "cover") {
    text(slide, page.items[0]!.label, X, 1.15, W, 0.5, 22, {
      color: C.deckCoverMuted,
      bold: true,
    });
    text(slide, page.items[0]!.detail, X, 1.95, W, 1.5, 44, {
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
    const heights = [
      purposeTableHeaderHeight(page),
      ...rows.map((row) => purposeRowHeight(page, row)),
    ];
    const height = heights.reduce((sum, h) => sum + h, 0);
    if (height > H + 0.001)
      throw new PurposePageError("table_text_needs_split", page.id);
    const groups = rows.flatMap((row) =>
      row.flatMap(
        (cell) => copy(page, cell).match(/\[[A-Za-z0-9,\s–-]+\]/g) || [],
      ),
    );
    // Repeated identical attribution is stated once in the visible page footer.
    const sharedCitation =
      !page.sourceRegister &&
      page.sources.length === 1 &&
      groups.length > 2 &&
      new Set(groups).size === 1 &&
      groups[0] === sourceLine(page)
        ? groups[0]
        : undefined;
    slide.addTable(
      [
        columns.map((cell) => ({
          text: cell,
          options: { bold: true, color: C.white, fill: { color: C.navy } },
        })),
        ...rows.map((row, i) =>
          row.map((cell, column) => ({
            text: sharedCitation
              ? copy(page, cell)
                  .split(sharedCitation)
                  .join("")
                  .replace(/\s+([.,;:!?])/g, "$1")
                  .replace(/ {2,}/g, " ")
                  .trim()
              : copy(page, cell),
            options: {
              bold: Boolean(
                (page.sourceRegister && !row[0]) ||
                (page.semanticStatusColumn && column === 0),
              ),
              ...(page.semanticStatusColumn &&
              column === 0 &&
              page.rowTones?.[i]
                ? { color: semanticColors[page.rowTones[i]!] }
                : {}),
              fill: {
                color:
                  page.sourceRegister && !row[0]
                    ? C.skyPale
                    : i % 2
                      ? C.skyPale
                      : C.white,
              },
            },
          })),
        ),
      ],
      {
        x: X,
        y: TOP + Math.min(0.22, Math.max(0, (H - height) / 2)),
        w: W,
        colW: weights.map((w) => W * w),
        rowH: heights,
        fontFace: "Arial",
        fontSize: page.tableFontSize || 16,
        color: C.deckInk,
        margin: page.sourceRegister
          ? 0.025
          : page.compactTableRows
            ? [0.01, 0.08, 0.01, 0.08]
            : 0.08,
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
      const axis = purposeChartAxis(chart);
      const width = (W - (charts.length - 1) * 0.45) / charts.length;
      const x = X + index * (width + 0.45);
      const caption = `${chart.unit} / ${chart.period}${axis.min !== undefined && axis.min !== 0 ? ` / axis starts at ${axis.min}` : ""}`;
      const captionHeight = Math.max(
        0.44,
        referenceCellTextHeight(caption, width, 13) + 0.06,
      );
      const chartTop = 0.67 + captionHeight + 0.1;
      text(slide, chart.metric, x, TOP, width, 0.65, 22, { bold: true });
      text(slide, caption, x, TOP + 0.67, width, captionHeight, 13, {
        color: C.deckMuted,
        objectName: `purpose:annotation:chart-unit:${index}`,
      });
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
          y: TOP + chartTop,
          w: width,
          h: H - chartTop - 0.17,
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
          valAxisMinVal: axis.min,
          valAxisMaxVal: axis.max,
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
    const columns = page.statementColumns || 1;
    const width = columns === 2 ? 5.1 : W - 0.85;
    const font = page.compact ? 18 : 22;
    const heights = page.items.map((item) =>
      purposeStatementHeight(copy(page, item.detail), width, font),
    );
    const used = Array.from({ length: columns }, (_, column) =>
      heights.reduce((sum, h, i) => sum + (i % columns === column ? h : 0), 0),
    );
    if (used.some((h) => h > H + 0.05))
      throw new PurposePageError("statement_needs_split", page.id);
    const cursor = used.map((h) => TOP + (H - h) / 2);
    page.items.forEach((item, i) => {
      const column = i % columns,
        x = X + column * (W / columns + 0.1);
      const y = cursor[column]!,
        h = heights[i]!;
      cursor[column] = y + h;
      text(slide, String(i + 1).padStart(2, "0"), x, y + 0.1, 0.6, 0.4, 18, {
        color: C.navy,
        bold: true,
      });
      text(
        slide,
        copy(page, item.detail),
        x + 0.85,
        y + 0.1,
        width,
        h - 0.2,
        font,
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
      slide.namedText?.["purpose:title"] !== titleCopy(page) ||
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
          slide.namedText?.[`purpose:statement-label:${n}`] !==
            purposeStatusLabel(item.tone!, item.label) ||
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
