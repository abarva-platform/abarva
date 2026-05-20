import 'server-only';

import pptxgen from 'pptxgenjs';

import type { SourceCxoNarrativeReport, SourceCxoSlide } from './source-cxo-narrative-report';

export const SOURCE_CXO_PPTX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

type PptxShapeType = Parameters<pptxgen.Slide['addShape']>[0];
type PptxTableRows = Parameters<pptxgen.Slide['addTable']>[0];

const COLORS = {
  ink: '11100E',
  muted: '625D55',
  paper: 'FBFAF7',
  sand: 'E8E4DA',
  line: 'D8D0C1',
  blue: '0B4A91',
  gold: 'D8B65A',
  green: '2D7D46',
  warn: 'BD7B12',
  bad: '9B2D1F',
  white: 'FFFFFF',
};

export async function renderSourceCxoNarrativePptx(
  report: SourceCxoNarrativeReport,
): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'AbarVa Source';
  pptx.subject = `${report.eventCode} Source CXO Narrative Report`;
  pptx.title = `${report.eventName} — Source CXO Narrative Report`;
  pptx.company = 'AbarVa';
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
  };
  pptx.defineLayout({ name: 'ABARVA_WIDE', width: 13.333, height: 7.5 });
  pptx.layout = 'ABARVA_WIDE';

  const rect = pptx.ShapeType.rect;
  const line = pptx.ShapeType.line;
  report.slides.forEach((slide, index) => {
    if (index === 0) addCoverSlide(pptx, report, slide, index + 1, rect, line);
    else addContentSlide(pptx, report, slide, index + 1, rect, line);
  });

  const out = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}

function addCoverSlide(
  pptx: pptxgen,
  report: SourceCxoNarrativeReport,
  slideModel: SourceCxoSlide,
  slideNo: number,
  rect: PptxShapeType,
  line: PptxShapeType,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.paper };
  addTopRule(slide, report, slideNo, line);
  slide.addText('ABARVA · SOURCE', {
    x: 0.7,
    y: 0.72,
    w: 3.2,
    h: 0.25,
    color: COLORS.blue,
    bold: true,
    fontFace: 'Aptos',
    fontSize: 10,
    charSpacing: 2,
  });
  slide.addText('CXO Narrative Report', {
    x: 0.7,
    y: 1.18,
    w: 5.4,
    h: 0.35,
    color: COLORS.ink,
    fontSize: 18,
    bold: true,
  });
  slide.addText(report.eventName, {
    x: 0.7,
    y: 1.7,
    w: 7.3,
    h: 1.2,
    color: COLORS.ink,
    fontFace: 'Georgia',
    fontSize: 39,
    breakLine: false,
    fit: 'shrink',
  });
  slide.addText(`${report.tenantName} · ${report.eventCode}`, {
    x: 0.72,
    y: 3.04,
    w: 4.8,
    h: 0.28,
    color: COLORS.muted,
    fontSize: 12,
    bold: true,
  });
  slide.addShape(rect, {
    x: 8.45,
    y: 1.3,
    w: 3.9,
    h: 3.1,
    fill: { color: COLORS.ink },
    line: { color: COLORS.ink },
  });
  slide.addText(report.verdict.toUpperCase(), {
    x: 8.75,
    y: 1.68,
    w: 3.2,
    h: 0.45,
    color: COLORS.gold,
    fontSize: 18,
    bold: true,
    charSpacing: 1.2,
  });
  slide.addText(report.verdictDetail, {
    x: 8.75,
    y: 2.26,
    w: 3.15,
    h: 1.35,
    color: 'F7F2E8',
    fontSize: 15,
    fit: 'shrink',
    breakLine: false,
  });
  addMetricRow(slide, slideModel.metrics, 0.7, 4.75, 12.0, rect);
  addFooter(slide, report, slideNo, line);
}

function addContentSlide(
  pptx: pptxgen,
  report: SourceCxoNarrativeReport,
  slideModel: SourceCxoSlide,
  slideNo: number,
  rect: PptxShapeType,
  line: PptxShapeType,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.paper };
  addTopRule(slide, report, slideNo, line);
  slide.addText(slideModel.proofLabel.toUpperCase(), {
    x: 0.58,
    y: 0.62,
    w: 5.5,
    h: 0.2,
    color: COLORS.blue,
    fontSize: 8.5,
    bold: true,
    charSpacing: 1.2,
  });
  slide.addText(slideModel.title, {
    x: 0.58,
    y: 0.92,
    w: 8.9,
    h: 0.62,
    color: COLORS.ink,
    fontFace: 'Georgia',
    fontSize: 24,
    fit: 'shrink',
  });
  slide.addText(slideModel.message, {
    x: 0.6,
    y: 1.58,
    w: 7.9,
    h: 0.56,
    color: COLORS.muted,
    fontSize: 11,
    fit: 'shrink',
    breakLine: false,
  });
  addMetricRow(slide, slideModel.metrics.slice(0, 4), 0.6, 2.25, 7.9, rect);
  if (slideModel.table) {
    addTable(slide, slideModel, 0.6, 3.45, 11.9, 2.55);
  }
  if (slideModel.notes.length > 0) {
    slide.addText(slideModel.notes.slice(0, 2).map((note) => `• ${note}`).join('\n'), {
      x: 9.0,
      y: 1.52,
      w: 3.1,
      h: 1.45,
      color: COLORS.muted,
      fontSize: 10,
      breakLine: false,
      fit: 'shrink',
    });
  }
  addFooter(slide, report, slideNo, line);
}

function addTopRule(slide: pptxgen.Slide, report: SourceCxoNarrativeReport, slideNo: number, line: PptxShapeType): void {
  slide.addShape(line, {
    x: 0.55,
    y: 0.38,
    w: 12.2,
    h: 0,
    line: { color: COLORS.line, width: 1 },
  });
  slide.addText(`${report.eventCode} · Source CXO Report`, {
    x: 0.58,
    y: 0.18,
    w: 5.8,
    h: 0.2,
    color: COLORS.muted,
    fontSize: 7.5,
    bold: true,
    charSpacing: 0.7,
  });
  slide.addText(`Slide ${slideNo} / ${report.slides.length}`, {
    x: 11.1,
    y: 0.18,
    w: 1.6,
    h: 0.2,
    align: 'right',
    color: COLORS.muted,
    fontSize: 7.5,
    bold: true,
  });
}

function addMetricRow(
  slide: pptxgen.Slide,
  metrics: ReadonlyArray<SourceCxoSlide['metrics'][number]>,
  x: number,
  y: number,
  width: number,
  rect: PptxShapeType,
): void {
  const gap = 0.12;
  const w = (width - gap * (metrics.length - 1)) / metrics.length;
  metrics.forEach((metric, index) => {
    const left = x + index * (w + gap);
    const color = metric.status === 'good' ? COLORS.green : metric.status === 'warn' ? COLORS.warn : metric.status === 'bad' ? COLORS.bad : COLORS.ink;
    slide.addShape(rect, {
      x: left,
      y,
      w,
      h: 0.95,
      fill: { color: COLORS.white },
      line: { color: COLORS.line, width: 1 },
    });
    slide.addShape(rect, {
      x: left,
      y,
      w: 0.05,
      h: 0.95,
      fill: { color },
      line: { color },
    });
    slide.addText(metric.label.toUpperCase(), {
      x: left + 0.14,
      y: y + 0.12,
      w: w - 0.22,
      h: 0.14,
      color: COLORS.muted,
      fontSize: 6.5,
      bold: true,
      charSpacing: 0.7,
      fit: 'shrink',
    });
    slide.addText(metric.value, {
      x: left + 0.14,
      y: y + 0.34,
      w: w - 0.22,
      h: 0.24,
      color: COLORS.ink,
      fontSize: 13,
      bold: true,
      fit: 'shrink',
    });
    slide.addText(metric.note, {
      x: left + 0.14,
      y: y + 0.64,
      w: w - 0.22,
      h: 0.22,
      color: COLORS.muted,
      fontSize: 6.7,
      fit: 'shrink',
    });
  });
}

function addTable(
  slide: pptxgen.Slide,
  slideModel: SourceCxoSlide,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const table = slideModel.table;
  if (!table) return;
  slide.addText(table.title.toUpperCase(), {
    x,
    y: y - 0.28,
    w,
    h: 0.18,
    color: COLORS.ink,
    fontSize: 7.5,
    bold: true,
    charSpacing: 0.8,
  });
  const rows: PptxTableRows = [
    table.columns.map((c) => ({
      text: c,
      options: { bold: true, color: COLORS.ink, fill: { color: COLORS.sand } },
    })),
    ...table.rows.slice(0, 5).map((row) =>
      row.map((cell) => ({
        text: cell,
        options: { color: COLORS.ink, fill: { color: COLORS.white } },
      })),
    ),
  ];
  slide.addTable(rows, {
    x,
    y,
    w,
    h,
    border: { type: 'solid', color: COLORS.line, pt: 0.5 },
    fontFace: 'Aptos',
    fontSize: 7.7,
    margin: 0.07,
    valign: 'top',
  });
}

function addFooter(slide: pptxgen.Slide, report: SourceCxoNarrativeReport, slideNo: number, line: PptxShapeType): void {
  slide.addShape(line, {
    x: 0.55,
    y: 7.08,
    w: 12.2,
    h: 0,
    line: { color: COLORS.line, width: 1 },
  });
  slide.addText(`Confidential · ${report.tenantName} · Generated ${report.generatedAt.slice(0, 10)}`, {
    x: 0.58,
    y: 7.18,
    w: 7.8,
    h: 0.18,
    color: COLORS.muted,
    fontSize: 7.2,
  });
  slide.addText(String(slideNo).padStart(2, '0'), {
    x: 12.0,
    y: 7.15,
    w: 0.7,
    h: 0.22,
    align: 'right',
    color: COLORS.muted,
    fontSize: 8,
    bold: true,
  });
}
