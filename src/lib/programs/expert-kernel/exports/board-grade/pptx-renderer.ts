// Board-grade Costed Business-Case Pack — editable PowerPoint (.pptx) renderer.
//
// The HTML deck (`html-renderer.ts`) is a board-circulation artifact a CXO can
// READ. This renderer produces the artifact a CXO can EDIT: a native 16:9
// PowerPoint of the same 12 slides — the cover plus the 11 board sections.
//
// FIDELITY MODEL — hybrid, decided up front:
//   • NATIVE editable PowerPoint objects for every WORD on the slide — the
//     eyebrow, the takeaway headline, the lede prose, the footer facts, the
//     board-decision callout, the fund-now / do-not-fund lists, the assumption
//     ledger and evidence tables, the decision checklist, the headline figures.
//     A CXO clicks any of these and edits the text in PowerPoint or Keynote.
//   • IMAGE for each bespoke financial exhibit (investment waterfall, cost
//     stack, value bridge, adoption curve, sensitivity tornado, payback curve,
//     roadmap swimlane, risk heatmap, baseline impact). The exact SVG strings
//     from `svg-charts.ts` are rasterised to high-resolution PNGs so the
//     exhibits look like the HTML deck. The exhibits are visual evidence — a
//     CXO does not hand-edit a waterfall; they edit the words around it.
//
// HONESTY (blueprint §9 hard fail): every figure traces to the kernel
// view-model. Payback is rendered "Not computable — monetisation blocked",
// never a fabricated number; seed gaps stay explicit; the verdict is `shape`.
//
// The renderer is async only because the rasteriser is — it is otherwise a
// pure, deterministic function of `generatedOn`.

import PptxGenJS from 'pptxgenjs';

import {
  buildApexCostedBusinessCasePack,
  type CostedBusinessCasePack,
  type SectionAnatomy,
  type EvidenceStrip,
} from './pack-model';
import {
  investmentWaterfall,
  valueBridge,
  sensitivityTornado,
  roadmapSwimlane,
  riskHeatmap,
  baselineImpact,
  compactUsd,
} from './svg-charts';
import { rasteriseSvgToDataUrl } from './svg-raster';

// ---------------------------------------------------------------------------
// Locked AbarVa design tokens — the same restrained register as the HTML deck.
// pptxgenjs expects colours WITHOUT the leading "#".
// ---------------------------------------------------------------------------

const COLOR = {
  cream: 'F8F7F4', // slide ground
  paper: 'FBFAF7', // exhibit / card panels
  ink: '070707', // near-black body ink
  inkSoft: '5B5852', // muted captions
  accent: '0B4A91', // the single navy accent
  rule: 'D8D3C6', // hairline rules
  ruleSoft: 'E6E1D5',
  good: '1B5E20',
  goodSoft: 'E2EFE2',
  warn: '7A4F01',
  warnSoft: 'F7ECD6',
  bad: '8B1F0F',
  badSoft: 'F4DDD6',
  accentSoft: 'E8F0FA',
} as const;

// A universally-available serif for headings — the design system's serif
// fallback. PowerPoint and Keynote both ship Georgia, so the deck renders the
// same on either without an embedded font.
const SERIF = 'Georgia';
const SANS = 'Arial';

// 16:9 widescreen — pptxgenjs `LAYOUT_16x9` is 13.333in × 7.5in. The vertical
// band is laid out against that 7.5in height: header ~0.6in, footer from 6.66.
const SLIDE_W = 13.333;
const MARGIN = 0.62;
const CONTENT_W = SLIDE_W - MARGIN * 2;
const SLIDE_COUNT = 12;

// ---------------------------------------------------------------------------
// Slide scaffold — every section slide shares the same calm chrome: a slim
// header rule, the eyebrow, the takeaway headline, the hero exhibit as the
// dominant element, and a thin footer fact line. One idea per slide.
// ---------------------------------------------------------------------------

function confidenceLabel(c: EvidenceStrip['confidence']): string {
  const map: Record<EvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

type Slide = PptxGenJS.Slide;

/** Paint the cream ground and the slim running header on a section slide. */
function slideChrome(
  slide: Slide,
  pack: CostedBusinessCasePack,
  a: SectionAnatomy,
  slideNo: number,
): void {
  slide.background = { color: COLOR.cream };

  // Running header rule — brand · section on the left, slide count on the
  // right. Native text so a CXO can re-label the deck.
  slide.addText(
    [
      { text: pack.moveLabel.toUpperCase(), options: { color: COLOR.accent, bold: true } },
      { text: '   ·   ', options: { color: COLOR.rule } },
      { text: a.navLabel.toUpperCase(), options: { color: COLOR.inkSoft } },
    ],
    {
      x: MARGIN,
      y: 0.3,
      w: CONTENT_W * 0.7,
      h: 0.3,
      fontFace: SANS,
      fontSize: 8.5,
      charSpacing: 1,
      align: 'left',
    },
  );
  slide.addText(`SLIDE ${slideNo} / ${SLIDE_COUNT}`, {
    x: MARGIN + CONTENT_W * 0.7,
    y: 0.3,
    w: CONTENT_W * 0.3,
    h: 0.3,
    fontFace: SANS,
    fontSize: 8.5,
    color: COLOR.inkSoft,
    charSpacing: 1,
    align: 'right',
  });
  // Hairline under the header.
  slide.addShape('line', {
    x: MARGIN,
    y: 0.64,
    w: CONTENT_W,
    h: 0,
    line: { color: COLOR.ruleSoft, width: 0.75 },
  });
}

/** The eyebrow + the takeaway headline — the slide's single point of view. */
function slideHeadline(slide: Slide, a: SectionAnatomy): void {
  slide.addText(`SECTION ${a.page}  ·  ${a.navLabel.toUpperCase()}`, {
    x: MARGIN,
    y: 0.78,
    w: CONTENT_W,
    h: 0.26,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.accent,
    charSpacing: 1.5,
    align: 'left',
  });
  slide.addText(a.takeaway, {
    x: MARGIN,
    y: 1.04,
    w: CONTENT_W,
    h: 0.92,
    fontFace: SERIF,
    fontSize: 21,
    color: COLOR.ink,
    align: 'left',
    valign: 'top',
    lineSpacingMultiple: 1.06,
  });
}

/** The thin footer fact strip — decision role, owner, evidence, next gate. */
function slideFooter(slide: Slide, a: SectionAnatomy): void {
  const ev = a.evidence;
  const gapText =
    ev.gaps.length > 0
      ? `${ev.gaps.length} open ${ev.gaps.length === 1 ? 'gap' : 'gaps'}`
      : 'No open gaps';
  const footY = 6.66;

  slide.addShape('line', {
    x: MARGIN,
    y: footY - 0.1,
    w: CONTENT_W,
    h: 0,
    line: { color: COLOR.ruleSoft, width: 0.75 },
  });

  const cells: Array<{ key: string; val: string }> = [
    { key: 'DECISION ROLE', val: a.decisionRole },
    { key: 'OWNER', val: a.owner },
    {
      key: 'EVIDENCE',
      val:
        `${ev.sources.length} ${ev.sources.length === 1 ? 'source' : 'sources'} · ` +
        `as of ${ev.asOf} · confidence ${confidenceLabel(ev.confidence)} · ${gapText}`,
    },
    { key: 'NEXT GATE', val: a.nextGate },
  ];
  const colW = CONTENT_W / cells.length;
  cells.forEach((cell, i) => {
    slide.addText(
      [
        {
          text: cell.key,
          options: { color: COLOR.inkSoft, bold: true, fontSize: 7, charSpacing: 1, breakLine: true },
        },
        { text: cell.val, options: { color: COLOR.ink, fontSize: 8 } },
      ],
      {
        x: MARGIN + colW * i,
        y: footY,
        w: colW - 0.12,
        h: 0.66,
        fontFace: SANS,
        align: 'left',
        valign: 'top',
        lineSpacingMultiple: 1.05,
      },
    );
  });
}

/** The hero-exhibit caption — sits above the rasterised chart. */
function exhibitCaption(slide: Slide, caption: string, y: number): void {
  slide.addText(caption.toUpperCase(), {
    x: MARGIN,
    y,
    w: CONTENT_W,
    h: 0.26,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.ink,
    charSpacing: 0.6,
    align: 'left',
  });
}

/**
 * Place a rasterised SVG exhibit inside a paper-coloured frame. The exhibit is
 * an IMAGE — the visual evidence — sized to its natural aspect ratio so it is
 * never distorted, and centred in the available band.
 */
function placeExhibit(
  slide: Slide,
  svg: string,
  band: { x: number; y: number; w: number; h: number },
  opts: { scale?: number; framed?: boolean } = {},
): void {
  const { dataUrl, aspect } = rasteriseSvgToDataUrl(svg, opts.scale ?? 3);
  // Fit the natural aspect ratio inside the band.
  let w = band.w;
  let h = w / aspect;
  if (h > band.h) {
    h = band.h;
    w = h * aspect;
  }
  const x = band.x + (band.w - w) / 2;
  const y = band.y + (band.h - h) / 2;

  if (opts.framed !== false) {
    slide.addShape('rect', {
      x: x - 0.14,
      y: y - 0.14,
      w: w + 0.28,
      h: h + 0.28,
      fill: { color: COLOR.paper },
      line: { color: COLOR.rule, width: 0.75 },
    });
  }
  slide.addImage({ data: dataUrl, x, y, w, h });
}

/** A short lede paragraph — 2 to 4 lines of supporting prose. */
function lede(slide: Slide, text: string, y: number, h = 0.78): void {
  slide.addText(text, {
    x: MARGIN,
    y,
    w: CONTENT_W,
    h,
    fontFace: SANS,
    fontSize: 11.5,
    color: '2C2A26',
    align: 'left',
    valign: 'top',
    lineSpacingMultiple: 1.18,
  });
}

/**
 * A native, editable bullet list inside a bordered card. The bullets are real
 * PowerPoint text runs — a CXO clicks in and edits them.
 */
function bulletCard(
  slide: Slide,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    titleColor: string;
    accentColor: string;
    items: string[];
    fontSize?: number;
  },
): void {
  slide.addShape('rect', {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    fill: { color: 'FFFFFF' },
    line: { color: COLOR.rule, width: 0.75 },
  });
  // Accent spine on the left edge.
  slide.addShape('rect', {
    x: opts.x,
    y: opts.y,
    w: 0.05,
    h: opts.h,
    fill: { color: opts.accentColor },
    line: { color: opts.accentColor, width: 0 },
  });
  slide.addText(opts.title.toUpperCase(), {
    x: opts.x + 0.16,
    y: opts.y + 0.12,
    w: opts.w - 0.3,
    h: 0.28,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: opts.titleColor,
    charSpacing: 0.6,
    align: 'left',
  });
  slide.addText(
    opts.items.map((t) => ({
      text: t,
      options: { bullet: { code: '2022', indent: 12 }, breakLine: true },
    })),
    {
      x: opts.x + 0.16,
      y: opts.y + 0.42,
      w: opts.w - 0.32,
      h: opts.h - 0.54,
      fontFace: SANS,
      fontSize: opts.fontSize ?? 9.5,
      color: '2C2A26',
      align: 'left',
      valign: 'top',
      lineSpacingMultiple: 1.12,
      paraSpaceAfter: 4,
    },
  );
}

/**
 * A native, editable PowerPoint table. PowerPoint and Keynote both treat this
 * as a real table object — a CXO can edit any cell, add rows, re-sort.
 */
function dataTable(
  slide: Slide,
  opts: {
    x: number;
    y: number;
    w: number;
    h?: number;
    head: string[];
    rows: Array<Array<string | { text: string; color?: string; bold?: boolean }>>;
    colW?: number[];
    fontSize?: number;
  },
): void {
  const fontSize = opts.fontSize ?? 8.5;
  const headRow: PptxGenJS.TableRow = opts.head.map((h) => ({
    text: h.toUpperCase(),
    options: {
      bold: true,
      color: COLOR.paper,
      fill: { color: COLOR.ink },
      fontFace: SANS,
      fontSize: fontSize - 1.2,
      charSpacing: 0.4,
      valign: 'middle',
    },
  }));
  const bodyRows: PptxGenJS.TableRow[] = opts.rows.map((row, ri) =>
    row.map((cell) => {
      const c = typeof cell === 'string' ? { text: cell } : cell;
      return {
        text: c.text,
        options: {
          color: c.color ?? '2C2A26',
          bold: c.bold ?? false,
          fill: { color: ri % 2 === 1 ? 'F4F2EC' : 'FFFFFF' },
          fontFace: SANS,
          fontSize,
          valign: 'middle',
        },
      };
    }),
  );
  slide.addTable([headRow, ...bodyRows], {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    ...(opts.h ? { h: opts.h } : {}),
    colW: opts.colW,
    border: { type: 'solid', color: COLOR.ruleSoft, pt: 0.5 },
    margin: 3,
    autoPage: false,
  });
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(pptx: PptxGenJS, pack: CostedBusinessCasePack): void {
  const slide = pptx.addSlide();
  slide.background = { color: COLOR.cream };

  slide.addText('ABARVA · MOVES', {
    x: MARGIN,
    y: 0.7,
    w: CONTENT_W,
    h: 0.3,
    fontFace: SANS,
    fontSize: 11,
    bold: true,
    color: COLOR.accent,
    charSpacing: 2.5,
  });
  slide.addText('COSTED BUSINESS-CASE PACK · BOARD-GRADE REFERENCE ARTIFACT', {
    x: MARGIN,
    y: 1.06,
    w: CONTENT_W,
    h: 0.3,
    fontFace: SANS,
    fontSize: 10,
    bold: true,
    color: COLOR.inkSoft,
    charSpacing: 0.8,
  });
  slide.addText(pack.moveLabel, {
    x: MARGIN,
    y: 1.5,
    w: CONTENT_W,
    h: 1.5,
    fontFace: SERIF,
    fontSize: 44,
    color: COLOR.ink,
    valign: 'top',
    lineSpacingMultiple: 1.02,
  });
  slide.addText(`${pack.tenantLabel}  ·  ${pack.tenantKey}`, {
    x: MARGIN,
    y: 2.92,
    w: CONTENT_W,
    h: 0.34,
    fontFace: SANS,
    fontSize: 13,
    bold: true,
    color: COLOR.ink,
  });
  slide.addText(
    [
      {
        text:
          'A board deck in 12 slides. Every figure is produced by the Moves ' +
          'Expert Kernel from Apex’s audited substrate. Where data is not ' +
          'recorded it is declared a seed gap — never invented. The honest ' +
          'verdict is ',
      },
      { text: 'shape', options: { bold: true, italic: true } },
      {
        text:
          ': fund the next shaping gate, not the full build. The words on ' +
          'every slide are editable; the exhibits match the reference deck.',
      },
    ],
    {
      x: MARGIN,
      y: 3.46,
      w: CONTENT_W * 0.72,
      h: 1.5,
      fontFace: SANS,
      fontSize: 12.5,
      color: '2C2A26',
      valign: 'top',
      lineSpacingMultiple: 1.25,
    },
  );

  // Meta strip — verdict / payback / slides / generated. Native text tiles.
  const meta: Array<{ label: string; value: string }> = [
    { label: 'VERDICT', value: pack.verdict.toUpperCase() },
    { label: 'PAYBACK', value: 'Blocked — seed gap' },
    { label: 'SLIDES', value: String(SLIDE_COUNT) },
    { label: 'GENERATED', value: pack.generatedOn },
  ];
  const metaY = 5.45;
  slide.addShape('line', {
    x: MARGIN,
    y: metaY - 0.18,
    w: CONTENT_W,
    h: 0,
    line: { color: COLOR.rule, width: 0.75 },
  });
  const metaColW = CONTENT_W / meta.length;
  meta.forEach((m, i) => {
    slide.addText(
      [
        {
          text: m.label,
          options: { color: COLOR.inkSoft, bold: true, fontSize: 8.5, charSpacing: 1, breakLine: true },
        },
        { text: m.value, options: { color: COLOR.ink, bold: true, fontSize: 15 } },
      ],
      {
        x: MARGIN + metaColW * i,
        y: metaY,
        w: metaColW - 0.15,
        h: 0.86,
        fontFace: SANS,
        align: 'left',
        valign: 'top',
        lineSpacingMultiple: 1.1,
      },
    );
  });
}

// ===========================================================================
// Slide 2 — Board answer.
// ===========================================================================

function renderBoardAnswer(pptx: PptxGenJS, pack: CostedBusinessCasePack): void {
  const slide = pptx.addSlide();
  const s = pack.sections.boardAnswer;
  slideChrome(slide, pack, s.anatomy, 2);
  slideHeadline(slide, s.anatomy);

  // Board-decision callout — native editable text in a warn-toned card.
  const calloutY = 2.0;
  slide.addShape('rect', {
    x: MARGIN,
    y: calloutY,
    w: CONTENT_W,
    h: 0.92,
    fill: { color: COLOR.warnSoft },
    line: { color: COLOR.warn, width: 1 },
  });
  slide.addText(
    [
      {
        text: 'BOARD DECISION   ',
        options: { color: COLOR.warn, bold: true, fontSize: 9, charSpacing: 1 },
      },
      { text: s.verdictHeadline, options: { color: COLOR.ink, fontSize: 13, fontFace: SERIF } },
    ],
    {
      x: MARGIN + 0.2,
      y: calloutY + 0.08,
      w: CONTENT_W - 0.4,
      h: 0.78,
      fontFace: SANS,
      align: 'left',
      valign: 'middle',
      lineSpacingMultiple: 1.1,
    },
  );

  // Headline economics — five native figure tiles (NOT an image: a CXO edits
  // the numbers). Mirrors the HTML `economicsStrip` exhibit.
  exhibitCaption(slide, 'Exhibit 1 — Headline economics at a glance', 3.06);
  const tileY = 3.34;
  const tileH = 1.0;
  const tileGap = 0.12;
  const tileW = (CONTENT_W - tileGap * (s.economics.length - 1)) / s.economics.length;
  const toneColor = (tone: string): string =>
    tone === 'good'
      ? COLOR.good
      : tone === 'warn'
        ? COLOR.warn
        : tone === 'bad'
          ? COLOR.bad
          : COLOR.ink;
  s.economics.forEach((tile, i) => {
    const tx = MARGIN + (tileW + tileGap) * i;
    slide.addShape('rect', {
      x: tx,
      y: tileY,
      w: tileW,
      h: tileH,
      fill: { color: 'F3F0E9' },
      line: { color: COLOR.rule, width: 0.5 },
    });
    slide.addShape('rect', {
      x: tx,
      y: tileY,
      w: 0.045,
      h: tileH,
      fill: { color: toneColor(tile.tone) },
      line: { color: toneColor(tile.tone), width: 0 },
    });
    slide.addText(
      [
        {
          text: tile.label.toUpperCase(),
          options: { color: COLOR.inkSoft, bold: true, fontSize: 7.5, charSpacing: 0.5, breakLine: true },
        },
        {
          text: tile.value,
          options: { color: toneColor(tile.tone), bold: true, fontSize: tile.value.length > 9 ? 14 : 18, breakLine: true },
        },
        ...(tile.sub
          ? [{ text: tile.sub, options: { color: COLOR.inkSoft, fontSize: 7.5 } }]
          : []),
      ],
      {
        x: tx + 0.14,
        y: tileY + 0.1,
        w: tileW - 0.22,
        h: tileH - 0.18,
        fontFace: SANS,
        align: 'left',
        valign: 'top',
        lineSpacingMultiple: 1.05,
      },
    );
  });

  // Fund-now / do-not-fund-yet — two native editable bullet lists.
  const splitY = 4.56;
  const splitH = 1.92;
  const colGap = 0.24;
  const colW = (CONTENT_W - colGap) / 2;
  bulletCard(slide, {
    x: MARGIN,
    y: splitY,
    w: colW,
    h: splitH,
    title: 'Fund now',
    titleColor: COLOR.good,
    accentColor: COLOR.good,
    items: s.fundNow,
    fontSize: 9,
  });
  bulletCard(slide, {
    x: MARGIN + colW + colGap,
    y: splitY,
    w: colW,
    h: splitH,
    title: 'Do not fund yet',
    titleColor: COLOR.bad,
    accentColor: COLOR.bad,
    items: s.doNotFundYet,
    fontSize: 9,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 3 — Why now.
// ===========================================================================

function renderWhyNow(pptx: PptxGenJS, pack: CostedBusinessCasePack): void {
  const slide = pptx.addSlide();
  const s = pack.sections.whyNow;
  slideChrome(slide, pack, s.anatomy, 3);
  slideHeadline(slide, s.anatomy);

  lede(
    slide,
    `Containment is plateaued and agents run hot. ${s.trigger.split('. ')[0]}. ` +
      'Repeat transfers and CSAT both read as mis-routing — the problem is now ' +
      'capacity-bound, not a tooling preference.',
    2.04,
    0.78,
  );

  exhibitCaption(
    slide,
    'Exhibit 2 — Current-state baseline against the Move target',
    2.86,
  );
  placeExhibit(slide, baselineImpact(s.baselineBars), {
    x: MARGIN,
    y: 3.14,
    w: CONTENT_W,
    h: 3.36,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 4 — What we are funding.
// ===========================================================================

function renderWhatWeAreFunding(
  pptx: PptxGenJS,
  pack: CostedBusinessCasePack,
): void {
  const slide = pptx.addSlide();
  const s = pack.sections.whatWeAreFunding;
  slideChrome(slide, pack, s.anatomy, 4);
  slideHeadline(slide, s.anatomy);

  lede(
    slide,
    'We are funding an agent-assist routing layer over NICE CXone — not an ' +
      'IVR replacement, and not autonomous customer-facing inference. The ' +
      'three lists below are the funded boundary.',
    2.04,
    0.64,
  );

  // Three native editable scope lists — in scope / excluded / retained.
  const cardY = 2.78;
  const cardH = 3.74;
  const colGap = 0.2;
  const colW = (CONTENT_W - colGap * 2) / 3;
  bulletCard(slide, {
    x: MARGIN,
    y: cardY,
    w: colW,
    h: cardH,
    title: 'In scope',
    titleColor: COLOR.good,
    accentColor: COLOR.good,
    items: s.included,
    fontSize: 9,
  });
  bulletCard(slide, {
    x: MARGIN + colW + colGap,
    y: cardY,
    w: colW,
    h: cardH,
    title: 'Excluded',
    titleColor: COLOR.bad,
    accentColor: COLOR.bad,
    items: s.excluded,
    fontSize: 9,
  });
  bulletCard(slide, {
    x: MARGIN + (colW + colGap) * 2,
    y: cardY,
    w: colW,
    h: cardH,
    title: 'Retained accountabilities',
    titleColor: COLOR.accent,
    accentColor: COLOR.accent,
    items: s.retainedAccountabilities,
    fontSize: 9,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 5 — Investment case.
// ===========================================================================

function renderInvestmentCase(
  pptx: PptxGenJS,
  pack: CostedBusinessCasePack,
): void {
  const slide = pptx.addSlide();
  const s = pack.sections.investmentCase;
  slideChrome(slide, pack, s.anatomy, 5);
  slideHeadline(slide, s.anatomy);

  lede(
    slide,
    `The build is a ${compactUsd(s.investmentRange.point)} base bet — range ` +
      `${compactUsd(s.investmentRange.low)} to ${compactUsd(s.investmentRange.high)}. ` +
      'The waterfall shows where the money goes; the change lane is the ' +
      'execution risk to protect, not trim.',
    2.04,
    0.64,
  );

  // Hero exhibit — the investment waterfall image. Left column.
  exhibitCaption(
    slide,
    `Exhibit 4 — Investment waterfall: where the ${compactUsd(s.investmentRange.point)} base goes`,
    2.74,
  );
  const exhibitW = CONTENT_W * 0.52;
  placeExhibit(slide, investmentWaterfall(s.waterfall), {
    x: MARGIN,
    y: 3.02,
    w: exhibitW,
    h: 3.46,
  });

  // Right column — native editable per-workstream table.
  const tableX = MARGIN + exhibitW + 0.3;
  const tableW = CONTENT_W - exhibitW - 0.3;
  slide.addText('EIGHT-WORKSTREAM BREAKDOWN', {
    x: tableX,
    y: 2.74,
    w: tableW,
    h: 0.26,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.ink,
    charSpacing: 0.6,
  });
  const wsRows = s.workstreams.map((w) => [
    { text: w.label },
    { text: compactUsd(w.base), bold: true },
    { text: `${w.durationMonths} mo` },
    { text: `${w.agentSplitPct}%`, color: COLOR.accent },
  ]);
  wsRows.push([
    { text: 'Total — base', bold: true },
    { text: compactUsd(s.investmentRange.point), bold: true },
    { text: '', bold: false },
    { text: '', bold: false },
  ]);
  dataTable(slide, {
    x: tableX,
    y: 3.04,
    w: tableW,
    head: ['Workstream', 'Base', 'Dur.', 'AI'],
    rows: wsRows,
    colW: [tableW * 0.46, tableW * 0.22, tableW * 0.18, tableW * 0.14],
    fontSize: 7.6,
  });
  slide.addText(s.buildVsChangeNote, {
    x: tableX,
    y: 5.96,
    w: tableW,
    h: 0.6,
    fontFace: SANS,
    fontSize: 8,
    italic: true,
    color: COLOR.inkSoft,
    valign: 'top',
    lineSpacingMultiple: 1.12,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 6 — Value case.
// ===========================================================================

function renderValueCase(pptx: PptxGenJS, pack: CostedBusinessCasePack): void {
  const slide = pptx.addSlide();
  const s = pack.sections.valueCase;
  slideChrome(slide, pack, s.anatomy, 6);
  slideHeadline(slide, s.anatomy);

  lede(
    slide,
    `Gross 3-year value of ${compactUsd(s.grossValue)} is discounted ` +
      `${s.totalHaircutPct}% by the mandatory six-factor haircut, landing at a ` +
      `net ${compactUsd(s.netValue)}. Adoption and data readiness take the two ` +
      'largest cuts.',
    2.04,
    0.64,
  );

  // Hero exhibit — the gross-to-net value bridge image.
  exhibitCaption(
    slide,
    'Exhibit 5 — Gross-to-net value bridge: every haircut, in dollars',
    2.74,
  );
  const exhibitW = CONTENT_W * 0.54;
  placeExhibit(slide, valueBridge(s.grossValue, s.bridgeSteps, s.netValue), {
    x: MARGIN,
    y: 3.02,
    w: exhibitW,
    h: 3.46,
  });

  // Right column — native editable six-factor haircut table.
  const tableX = MARGIN + exhibitW + 0.3;
  const tableW = CONTENT_W - exhibitW - 0.3;
  slide.addText('SIX-FACTOR HAIRCUT DETAIL', {
    x: tableX,
    y: 2.74,
    w: tableW,
    h: 0.26,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.ink,
    charSpacing: 0.6,
  });
  dataTable(slide, {
    x: tableX,
    y: 3.04,
    w: tableW,
    head: ['Haircut factor', 'Score', 'Weight', 'Discount'],
    rows: s.factors.map((f) => [
      { text: f.label },
      { text: f.score.toFixed(2) },
      { text: `${f.weightPct}%` },
      { text: `${f.discountPct}%`, color: COLOR.bad, bold: true },
    ]),
    colW: [tableW * 0.42, tableW * 0.18, tableW * 0.2, tableW * 0.2],
    fontSize: 8,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 7 — Payback and sensitivity.
// ===========================================================================

function renderPaybackSensitivity(
  pptx: PptxGenJS,
  pack: CostedBusinessCasePack,
): void {
  const slide = pptx.addSlide();
  const s = pack.sections.paybackSensitivity;
  slideChrome(slide, pack, s.anatomy, 7);
  slideHeadline(slide, s.anatomy);

  // Honest payback callout — NEVER a fabricated number.
  const calloutY = 2.0;
  slide.addShape('rect', {
    x: MARGIN,
    y: calloutY,
    w: CONTENT_W,
    h: 0.74,
    fill: { color: COLOR.warnSoft },
    line: { color: COLOR.warn, width: 1 },
  });
  slide.addText(
    [
      {
        text: 'PAYBACK   ',
        options: { color: COLOR.warn, bold: true, fontSize: 9, charSpacing: 1 },
      },
      {
        text:
          'Not computable — monetisation is blocked by the cost-per-contact ' +
          'seed gap. This pack shows no payback number rather than a ' +
          'fabricated one.',
        options: { color: COLOR.ink, fontSize: 10.5 },
      },
    ],
    {
      x: MARGIN + 0.2,
      y: calloutY + 0.06,
      w: CONTENT_W - 0.4,
      h: 0.62,
      fontFace: SANS,
      align: 'left',
      valign: 'middle',
      lineSpacingMultiple: 1.1,
    },
  );

  // Hero exhibit — sensitivity tornado image.
  exhibitCaption(
    slide,
    'Exhibit 6 — Sensitivity tornado: what moves the case most',
    2.88,
  );
  const exhibitW = CONTENT_W * 0.56;
  placeExhibit(slide, sensitivityTornado(s.tornado), {
    x: MARGIN,
    y: 3.16,
    w: exhibitW,
    h: 3.3,
  });

  // Right column — native editable three-scenario table; payback shown
  // honestly as "Blocked" where the kernel returns null.
  const tableX = MARGIN + exhibitW + 0.3;
  const tableW = CONTENT_W - exhibitW - 0.3;
  slide.addText('THREE-SCENARIO RANGE', {
    x: tableX,
    y: 2.88,
    w: tableW,
    h: 0.26,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.ink,
    charSpacing: 0.6,
  });
  dataTable(slide, {
    x: tableX,
    y: 3.16,
    w: tableW,
    head: ['Scenario', 'Investment', 'Net value', 'Payback'],
    rows: s.scenarios.map((sc) => [
      { text: sc.name, bold: true },
      { text: compactUsd(sc.investment) },
      { text: compactUsd(sc.netValue) },
      sc.paybackMonths === null
        ? { text: 'Blocked', color: COLOR.bad, bold: true }
        : { text: `${sc.paybackMonths} mo` },
    ]),
    colW: [tableW * 0.28, tableW * 0.26, tableW * 0.24, tableW * 0.22],
    fontSize: 8,
  });
  slide.addText(
    [
      {
        text: 'WHAT BREAKS THE CASE',
        options: { color: COLOR.accent, bold: true, fontSize: 8, charSpacing: 0.6, breakLine: true },
      },
      { text: s.whatBreaksTheCase, options: { color: '2C2A26', fontSize: 8.5 } },
    ],
    {
      x: tableX,
      y: 4.5,
      w: tableW,
      h: 1.96,
      fontFace: SANS,
      align: 'left',
      valign: 'top',
      lineSpacingMultiple: 1.15,
    },
  );

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 8 — Roadmap.
// ===========================================================================

function renderRoadmap(pptx: PptxGenJS, pack: CostedBusinessCasePack): void {
  const slide = pptx.addSlide();
  const s = pack.sections.roadmap;
  slideChrome(slide, pack, s.anatomy, 8);
  slideHeadline(slide, s.anatomy);

  lede(
    slide,
    `${s.totalMonths} months across four phases, each ending on a gate. ` +
      'Phase 0 is foundational and unlocks no value; Phase 1 is the first ' +
      'place value is verifiable — and the first place the board can stop.',
    2.04,
    0.64,
  );

  // Hero exhibit — roadmap swimlane image.
  exhibitCaption(
    slide,
    `Exhibit 7 — Phased roadmap: ${s.totalMonths} months, four gates`,
    2.74,
  );
  placeExhibit(slide, roadmapSwimlane(s.phases, s.totalMonths), {
    x: MARGIN,
    y: 3.0,
    w: CONTENT_W,
    h: 1.92,
  });

  // Native editable gate-decision table below the swimlane.
  slide.addText('GATE DECISIONS — WHAT IS DECIDED AT EACH GATE', {
    x: MARGIN,
    y: 5.0,
    w: CONTENT_W,
    h: 0.24,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.ink,
    charSpacing: 0.6,
  });
  dataTable(slide, {
    x: MARGIN,
    y: 5.26,
    w: CONTENT_W,
    head: ['Gate', 'Name', 'Decision at the gate', 'Kill point'],
    rows: s.gates.map((g) => [
      { text: g.code, bold: true },
      { text: g.name },
      { text: g.decision },
      g.killable
        ? { text: 'Killable', color: COLOR.bad, bold: true }
        : { text: 'Handoff', color: COLOR.good, bold: true },
    ]),
    colW: [
      CONTENT_W * 0.08,
      CONTENT_W * 0.2,
      CONTENT_W * 0.58,
      CONTENT_W * 0.14,
    ],
    fontSize: 8,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 9 — Risks and controls.
// ===========================================================================

function renderRisksControls(
  pptx: PptxGenJS,
  pack: CostedBusinessCasePack,
): void {
  const slide = pptx.addSlide();
  const s = pack.sections.risksControls;
  slideChrome(slide, pack, s.anatomy, 9);
  slideHeadline(slide, s.anatomy);

  lede(
    slide,
    'The monetisation seed gap (R1) and the transcript-privacy review (R2) ' +
      'are the two risks that can block approval. Both sit in the high-impact ' +
      'band, both have a named owner and a dated control.',
    2.04,
    0.62,
  );

  // Hero exhibit — risk heatmap image. Left column (the heatmap is squarer).
  exhibitCaption(slide, 'Exhibit 8 — Risk heatmap: likelihood × impact', 2.72);
  const exhibitW = CONTENT_W * 0.34;
  placeExhibit(slide, riskHeatmap(s.heatmap), {
    x: MARGIN,
    y: 3.0,
    w: exhibitW,
    h: 3.46,
  });

  // Right column — native editable risk register.
  const tableX = MARGIN + exhibitW + 0.3;
  const tableW = CONTENT_W - exhibitW - 0.3;
  slide.addText('RISK REGISTER — ALL SIX RISKS, CONTROLS AND OWNERS', {
    x: tableX,
    y: 2.72,
    w: tableW,
    h: 0.24,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.ink,
    charSpacing: 0.6,
  });
  dataTable(slide, {
    x: tableX,
    y: 2.98,
    w: tableW,
    head: ['Risk', 'L', 'I', 'Control / mitigation', 'Owner'],
    rows: s.risks.map((r) => [
      { text: `${r.code}  ${r.risk}` },
      { text: r.likelihood },
      { text: r.impact },
      { text: r.control },
      { text: r.owner },
    ]),
    colW: [
      tableW * 0.34,
      tableW * 0.07,
      tableW * 0.07,
      tableW * 0.32,
      tableW * 0.2,
    ],
    fontSize: 7.2,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 10 — Assumption ledger.
// ===========================================================================

function renderAssumptionLedger(
  pptx: PptxGenJS,
  pack: CostedBusinessCasePack,
): void {
  const slide = pptx.addSlide();
  const s = pack.sections.assumptionLedger;
  slideChrome(slide, pack, s.anatomy, 10);
  slideHeadline(slide, s.anatomy);

  lede(
    slide,
    'Assumptions are ranked by how much the case moves if they are wrong. ' +
      'The two highest-ranked are seed-gap proxies — they stand in for absent ' +
      'tenant data and are the evidence asks that gate funding.',
    2.04,
    0.62,
  );

  // The full ledger as one native editable table — every row a real cell.
  slide.addText(
    `FULL ASSUMPTION LEDGER — ALL ${s.assumptions.length} RANKED ENTRIES`,
    {
      x: MARGIN,
      y: 2.74,
      w: CONTENT_W,
      h: 0.24,
      fontFace: SANS,
      fontSize: 9,
      bold: true,
      color: COLOR.ink,
      charSpacing: 0.6,
    },
  );
  dataTable(slide, {
    x: MARGIN,
    y: 3.0,
    w: CONTENT_W,
    head: ['#', 'Assumption', 'Owner', 'Confidence', 'Sensitivity', 'Source'],
    rows: s.assumptions.map((a) => [
      { text: String(a.rank), bold: true },
      {
        text: a.isProxy ? `${a.statement}  [seed-gap proxy]` : a.statement,
        color: a.isProxy ? COLOR.warn : '2C2A26',
      },
      { text: a.owner },
      {
        text: a.confidence,
        color:
          a.confidence === 'high'
            ? COLOR.good
            : a.confidence === 'low'
              ? COLOR.bad
              : COLOR.warn,
      },
      {
        text: a.sensitivity,
        color:
          a.sensitivity === 'high'
            ? COLOR.bad
            : a.sensitivity === 'low'
              ? COLOR.good
              : COLOR.warn,
      },
      { text: a.source },
    ]),
    colW: [
      CONTENT_W * 0.05,
      CONTENT_W * 0.36,
      CONTENT_W * 0.17,
      CONTENT_W * 0.12,
      CONTENT_W * 0.12,
      CONTENT_W * 0.18,
    ],
    fontSize: 7.6,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 11 — Evidence appendix.
// ===========================================================================

function renderEvidenceAppendix(
  pptx: PptxGenJS,
  pack: CostedBusinessCasePack,
): void {
  const slide = pptx.addSlide();
  const s = pack.sections.evidenceAppendix;
  slideChrome(slide, pack, s.anatomy, 11);
  slideHeadline(slide, s.anatomy);

  const recordedCount = s.recorded.length;
  const gapCount = s.seedGaps.length;
  const total = recordedCount + gapCount;
  const coveragePct = total > 0 ? Math.round((recordedCount / total) * 100) : 0;

  lede(
    slide,
    `Baseline coverage is ${coveragePct}% — ${recordedCount} metrics are ` +
      `measured, sourced and dated; ${gapCount} are declared seed gaps. None ` +
      'are invented. The case is auditable end to end.',
    2.04,
    0.6,
  );

  // Recorded metrics — native editable table (left).
  slide.addText('RECORDED METRICS — MEASURED, SOURCED, DATED', {
    x: MARGIN,
    y: 2.66,
    w: CONTENT_W,
    h: 0.24,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.accent,
    charSpacing: 0.6,
  });
  dataTable(slide, {
    x: MARGIN,
    y: 2.92,
    w: CONTENT_W,
    head: ['Metric', 'Value', 'Source', 'As of', 'Confidence'],
    rows: s.recorded.map((m) => [
      { text: m.metric },
      { text: m.value, bold: true },
      { text: m.source },
      { text: m.asOf },
      {
        text: m.confidence,
        color:
          m.confidence === 'high'
            ? COLOR.good
            : m.confidence === 'low'
              ? COLOR.bad
              : COLOR.warn,
      },
    ]),
    colW: [
      CONTENT_W * 0.26,
      CONTENT_W * 0.16,
      CONTENT_W * 0.34,
      CONTENT_W * 0.12,
      CONTENT_W * 0.12,
    ],
    fontSize: 7.4,
  });

  // Seed gaps — declared, never blank. Native editable table (lower).
  slide.addText('SEED GAPS — DECLARED, NEVER BLANK, NEVER INVENTED', {
    x: MARGIN,
    y: 4.78,
    w: CONTENT_W,
    h: 0.24,
    fontFace: SANS,
    fontSize: 9,
    bold: true,
    color: COLOR.bad,
    charSpacing: 0.6,
  });
  dataTable(slide, {
    x: MARGIN,
    y: 5.04,
    w: CONTENT_W,
    head: ['Metric', 'Why it is missing', 'Owner', 'Decision impact'],
    rows: s.seedGaps.map((g) => [
      { text: `${g.metric}  [seed gap]`, color: COLOR.bad, bold: true },
      { text: g.reason },
      { text: g.owner },
      { text: g.decisionImpact },
    ]),
    colW: [
      CONTENT_W * 0.2,
      CONTENT_W * 0.26,
      CONTENT_W * 0.18,
      CONTENT_W * 0.36,
    ],
    fontSize: 7.2,
  });

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Slide 12 — Recommendation and asks.
// ===========================================================================

function renderRecommendation(
  pptx: PptxGenJS,
  pack: CostedBusinessCasePack,
): void {
  const slide = pptx.addSlide();
  const s = pack.sections.recommendation;
  slideChrome(slide, pack, s.anatomy, 12);
  slideHeadline(slide, s.anatomy);

  // Recommendation callout — native editable text.
  const calloutY = 2.0;
  slide.addShape('rect', {
    x: MARGIN,
    y: calloutY,
    w: CONTENT_W,
    h: 0.78,
    fill: { color: COLOR.warnSoft },
    line: { color: COLOR.warn, width: 1 },
  });
  slide.addText(
    [
      {
        text: 'RECOMMENDATION   ',
        options: { color: COLOR.warn, bold: true, fontSize: 9, charSpacing: 1 },
      },
      { text: s.verdictHeadline, options: { color: COLOR.ink, fontSize: 12, fontFace: SERIF } },
    ],
    {
      x: MARGIN + 0.2,
      y: calloutY + 0.06,
      w: CONTENT_W - 0.4,
      h: 0.66,
      fontFace: SANS,
      align: 'left',
      valign: 'middle',
      lineSpacingMultiple: 1.1,
    },
  );

  // Decision checklist — native editable table; the state column carries the
  // approve / hold / condition verdict per item.
  exhibitCaption(
    slide,
    'Exhibit 11 — Decision checklist: what is requested at this gate',
    2.94,
  );
  const stateText = (st: 'approve' | 'hold' | 'condition'): { text: string; color: string } =>
    st === 'approve'
      ? { text: 'Approve now', color: COLOR.good }
      : st === 'hold'
        ? { text: 'Hold', color: COLOR.bad }
        : { text: 'Condition', color: COLOR.warn };
  dataTable(slide, {
    x: MARGIN,
    y: 3.22,
    w: CONTENT_W,
    head: ['Decision item', 'State', 'Detail'],
    rows: s.checklist.map((c) => {
      const st = stateText(c.state);
      return [
        { text: c.label, bold: true },
        { text: st.text, color: st.color, bold: true },
        { text: c.detail },
      ];
    }),
    colW: [CONTENT_W * 0.26, CONTENT_W * 0.14, CONTENT_W * 0.6],
    fontSize: 8,
  });

  // Requested spend — native editable accent line.
  const askY = 5.74;
  slide.addShape('rect', {
    x: MARGIN,
    y: askY,
    w: CONTENT_W,
    h: 0.74,
    fill: { color: COLOR.accentSoft },
    line: { color: COLOR.accent, width: 0.75 },
  });
  slide.addText(
    [
      {
        text: 'REQUESTED SPEND   ',
        options: { color: COLOR.accent, bold: true, fontSize: 8.5, charSpacing: 1 },
      },
      { text: s.requestedSpend, options: { color: '2C2A26', fontSize: 10 } },
    ],
    {
      x: MARGIN + 0.2,
      y: askY + 0.05,
      w: CONTENT_W - 0.4,
      h: 0.64,
      fontFace: SANS,
      align: 'left',
      valign: 'middle',
      lineSpacingMultiple: 1.1,
    },
  );

  slideFooter(slide, s.anatomy);
}

// ===========================================================================
// Public renderer.
// ===========================================================================

/**
 * Render the Apex Costed Business-Case Pack as an editable 16:9 PowerPoint.
 *
 * Returns the `.pptx` as a Node `Buffer`. Deterministic given `generatedOn` —
 * async only because the SVG rasteriser is. Every figure traces to the
 * `CostedBusinessCasePack` view-model; nothing is recomputed or fabricated.
 *
 * @param generatedOn ISO date (YYYY-MM-DD) stamped on the cover.
 */
export async function renderApexCostedBusinessCasePptx(
  generatedOn: string,
): Promise<Buffer> {
  const pack = buildApexCostedBusinessCasePack(generatedOn);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'AbarVa · Moves Expert Kernel';
  pptx.company = 'AbarVa';
  pptx.subject = 'Costed Business-Case Pack';
  pptx.title = `${pack.moveLabel} — Costed Business-Case Pack`;

  // 12 slides — cover + the 11 board sections, the HTML deck's order.
  renderCover(pptx, pack);
  renderBoardAnswer(pptx, pack);
  renderWhyNow(pptx, pack);
  renderWhatWeAreFunding(pptx, pack);
  renderInvestmentCase(pptx, pack);
  renderValueCase(pptx, pack);
  renderPaybackSensitivity(pptx, pack);
  renderRoadmap(pptx, pack);
  renderRisksControls(pptx, pack);
  renderAssumptionLedger(pptx, pack);
  renderEvidenceAppendix(pptx, pack);
  renderRecommendation(pptx, pack);

  // `write` with `nodebuffer` returns the .pptx as a Node Buffer.
  const out = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}
