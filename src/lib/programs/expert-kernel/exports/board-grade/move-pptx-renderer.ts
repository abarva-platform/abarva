// Generic, kernel-derived Move Costed Business-Case Pack — editable PowerPoint.
//
// The Move-data-driven sibling of `renderApexCostedBusinessCasePptx`. It
// consumes the SAME pack view-model the generic HTML deck uses
// (`buildMoveCostedBusinessCasePack`) and the SAME SVG exhibits, so the PPTX
// and HTML never diverge. An unbound Move yields an honest unbound deck — never
// a fabricated one.
//
// Format-matrix role: the Costed Business Case is "always PPTX" (board
// artifact). All prose boxes use shrink-to-fit autofit (`fit: 'shrink'`) so
// variable-length kernel text never overruns — enforced by pptx-autofit-gate.
//
// Pure given (move, generatedOn); async only because the SVG rasteriser is.

import PptxGenJS from "pptxgenjs";

import {
  buildMoveCostedBusinessCasePack,
  type MoveCostedBusinessCasePack,
  type MoveSectionAnatomy,
} from "./move-pack-model";
import type { MoveBusinessCaseInput } from "../../../move-business-case";
import {
  economicsStrip,
  investmentWaterfall,
  valueBridge,
  sensitivityTornado,
} from "./svg-charts";
import { rasteriseSvgToDataUrl } from "./svg-raster";

const COLOR = {
  cream: "F8F7F4",
  paper: "FBFAF7",
  ink: "070707",
  inkSoft: "5B5852",
  accent: "0B4A91",
  accentSoft: "E8F0FA",
  rule: "D8D3C6",
  ruleSoft: "E6E1D5",
} as const;

const SERIF = "Georgia";
const SANS = "Arial";
const SLIDE_W = 13.333;
const MARGIN = 0.62;
const CONTENT_W = SLIDE_W - MARGIN * 2;

type Slide = PptxGenJS.Slide;

const CONFIDENCE_LABEL: Record<
  MoveSectionAnatomy["evidence"]["confidence"],
  string
> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  blocked: "Blocked",
};

function slideChrome(slide: Slide, slideNo: number, total: number): void {
  slide.background = { color: COLOR.cream };
  slide.addText("ABARVA · MOVES", {
    x: MARGIN,
    y: 0.28,
    w: 4,
    h: 0.26,
    fontFace: SANS,
    fontSize: 8.5,
    bold: true,
    color: COLOR.accent,
    charSpacing: 1.5,
  });
  slide.addText(`SLIDE ${slideNo} / ${total}`, {
    x: SLIDE_W - MARGIN - 2,
    y: 0.28,
    w: 2,
    h: 0.26,
    fontFace: SANS,
    fontSize: 8.5,
    color: COLOR.inkSoft,
    align: "right",
  });
  slide.addShape("line", {
    x: MARGIN,
    y: 0.64,
    w: CONTENT_W,
    h: 0,
    line: { color: COLOR.ruleSoft, width: 0.75 },
  });
}

function slideHeadline(slide: Slide, a: MoveSectionAnatomy): void {
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
  });
  slide.addText(a.takeaway, {
    x: MARGIN,
    y: 1.04,
    w: CONTENT_W,
    h: 0.92,
    fontFace: SERIF,
    fontSize: 20,
    color: COLOR.ink,
    valign: "top",
    lineSpacingMultiple: 1.06,
    fit: "shrink",
    wrap: true,
  });
}

function slideFooter(slide: Slide, a: MoveSectionAnatomy): void {
  const ev = a.evidence;
  const gapText =
    ev.gaps.length > 0
      ? `${ev.gaps.length} open ${ev.gaps.length === 1 ? "gap" : "gaps"}`
      : "No open gaps";
  const footY = 6.66;
  slide.addShape("line", {
    x: MARGIN,
    y: footY - 0.1,
    w: CONTENT_W,
    h: 0,
    line: { color: COLOR.ruleSoft, width: 0.75 },
  });
  const cells = [
    { key: "DECISION ROLE", val: a.decisionRole },
    { key: "OWNER", val: a.owner },
    {
      key: "EVIDENCE",
      val:
        `${ev.sources.length} ${ev.sources.length === 1 ? "source" : "sources"} · ` +
        `as of ${ev.asOf} · confidence ${CONFIDENCE_LABEL[ev.confidence]} · ${gapText}`,
    },
    { key: "NEXT GATE", val: a.nextGate },
  ];
  const colW = CONTENT_W / cells.length;
  cells.forEach((cell, i) => {
    slide.addText(
      [
        {
          text: cell.key,
          options: {
            color: COLOR.inkSoft,
            bold: true,
            fontSize: 7,
            charSpacing: 1,
            breakLine: true,
          },
        },
        { text: cell.val, options: { color: COLOR.ink, fontSize: 8 } },
      ],
      {
        x: MARGIN + colW * i,
        y: footY,
        w: colW - 0.12,
        h: 0.66,
        fontFace: SANS,
        valign: "top",
        lineSpacingMultiple: 1.05,
        fit: "shrink",
        wrap: true,
      },
    );
  });
}

function lede(slide: Slide, text: string, y: number, h = 0.7): void {
  slide.addText(text, {
    x: MARGIN,
    y,
    w: CONTENT_W,
    h,
    fontFace: SANS,
    fontSize: 11,
    color: "2C2A26",
    valign: "top",
    lineSpacingMultiple: 1.16,
    fit: "shrink",
    wrap: true,
  });
}

function bullets(slide: Slide, items: string[], y: number, h: number): void {
  slide.addText(
    items.map((t) => ({
      text: t,
      options: { bullet: { code: "2022", indent: 14 }, breakLine: true },
    })),
    {
      x: MARGIN,
      y,
      w: CONTENT_W,
      h,
      fontFace: SANS,
      fontSize: 10.5,
      color: "2C2A26",
      valign: "top",
      lineSpacingMultiple: 1.14,
      paraSpaceAfter: 5,
      fit: "shrink",
      wrap: true,
    },
  );
}

function placeExhibit(slide: Slide, svg: string, y: number, h: number): void {
  const { dataUrl, aspect } = rasteriseSvgToDataUrl(svg, 3);
  let w = CONTENT_W;
  let imgH = w / aspect;
  if (imgH > h) {
    imgH = h;
    w = imgH * aspect;
  }
  const x = MARGIN + (CONTENT_W - w) / 2;
  const yy = y + (h - imgH) / 2;
  slide.addShape("rect", {
    x: x - 0.14,
    y: yy - 0.14,
    w: w + 0.28,
    h: imgH + 0.28,
    fill: { color: COLOR.paper },
    line: { color: COLOR.rule, width: 0.75 },
  });
  slide.addImage({ data: dataUrl, x, y: yy, w, h: imgH });
}

const VERDICT_WORD: Record<MoveCostedBusinessCasePack["verdict"], string> = {
  fund: "FUND",
  shape: "SHAPE",
  kill: "STOP",
};

function renderCover(pptx: PptxGenJS, pack: MoveCostedBusinessCasePack): void {
  const slide = pptx.addSlide();
  slide.background = { color: COLOR.ink };
  slide.addText("ABARVA · MOVES", {
    x: MARGIN,
    y: 0.9,
    w: 8,
    h: 0.3,
    fontFace: SANS,
    fontSize: 11,
    bold: true,
    color: "9DB8DC",
    charSpacing: 2,
  });
  slide.addText("COSTED BUSINESS-CASE PACK", {
    x: MARGIN,
    y: 1.2,
    w: 11,
    h: 0.3,
    fontFace: SANS,
    fontSize: 10,
    color: "B9B5AC",
    charSpacing: 1.5,
  });
  slide.addText(pack.moveLabel, {
    x: MARGIN,
    y: 1.9,
    w: CONTENT_W,
    h: 1.7,
    fontFace: SERIF,
    fontSize: 40,
    color: "FFFFFF",
    valign: "top",
    lineSpacingMultiple: 1.02,
    fit: "shrink",
    wrap: true,
  });
  slide.addText(
    `${pack.tenantLabel}  ·  ${pack.tenantKey}  ·  ${pack.functionLabel}`,
    {
      x: MARGIN,
      y: 3.7,
      w: CONTENT_W,
      h: 0.4,
      fontFace: SANS,
      fontSize: 13,
      color: "D7D2C8",
      fit: "shrink",
      wrap: true,
    },
  );
  slide.addShape("rect", {
    x: MARGIN,
    y: 4.5,
    w: 4.6,
    h: 0.92,
    fill: { color: COLOR.accent },
    line: { color: COLOR.accent, width: 0 },
  });
  slide.addText(
    [
      {
        text: "KERNEL VERDICT   ",
        options: { color: "BFD4EF", bold: true, fontSize: 9, charSpacing: 1 },
      },
      {
        text: VERDICT_WORD[pack.verdict],
        options: { color: "FFFFFF", bold: true, fontSize: 18 },
      },
    ],
    {
      x: MARGIN + 0.22,
      y: 4.62,
      w: 4.2,
      h: 0.7,
      fontFace: SANS,
      valign: "middle",
      fit: "shrink",
      wrap: true,
    },
  );
  slide.addText(pack.verdictRationale, {
    x: MARGIN + 4.9,
    y: 4.5,
    w: CONTENT_W - 4.9,
    h: 0.92,
    fontFace: SANS,
    fontSize: 10.5,
    color: "E7E3DA",
    valign: "top",
    lineSpacingMultiple: 1.12,
    fit: "shrink",
    wrap: true,
  });
  slide.addText(
    `Generated ${pack.generatedOn} · synthetic, inspired-by context — not confidential client data`,
    {
      x: MARGIN,
      y: 6.9,
      w: CONTENT_W,
      h: 0.3,
      fontFace: SANS,
      fontSize: 8,
      color: "8E897E",
      italic: true,
    },
  );
}

function section(
  pptx: PptxGenJS,
  pack: MoveCostedBusinessCasePack,
  a: MoveSectionAnatomy,
  slideNo: number,
  total: number,
  body: (slide: Slide) => void,
): void {
  const slide = pptx.addSlide();
  slideChrome(slide, slideNo, total);
  slideHeadline(slide, a);
  body(slide);
  slideFooter(slide, a);
}

/**
 * Render the generic Move Costed Business-Case Pack as an editable 16:9 PPTX.
 * Returns the `.pptx` as a Node Buffer. An unbound Move renders the honest
 * unbound deck.
 */
export async function renderMoveCostedBusinessCasePptx(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): Promise<Buffer> {
  const result = buildMoveCostedBusinessCasePack(move, generatedOn);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "AbarVa · Moves Expert Kernel";
  pptx.company = "AbarVa";
  pptx.subject = "Costed Business-Case Pack";

  if (!result.bound) {
    pptx.title = `${result.moveLabel} — Costed Business-Case Pack — unbound`;
    const slide = pptx.addSlide();
    slide.background = { color: COLOR.cream };
    slide.addText(result.moveLabel, {
      x: MARGIN,
      y: 1.4,
      w: CONTENT_W,
      h: 1.2,
      fontFace: SERIF,
      fontSize: 30,
      color: COLOR.ink,
      valign: "top",
      fit: "shrink",
      wrap: true,
    });
    slide.addText("Costed Business-Case Pack — UNBOUND", {
      x: MARGIN,
      y: 2.7,
      w: CONTENT_W,
      h: 0.4,
      fontFace: SANS,
      fontSize: 13,
      bold: true,
      color: "7A4F01",
    });
    slide.addText(
      `No curated Domain Function Pack covers this Move's function, so the ` +
        `kernel does not fabricate a business case. ${result.unboundReason}`,
      {
        x: MARGIN,
        y: 3.2,
        w: CONTENT_W,
        h: 2,
        fontFace: SANS,
        fontSize: 12,
        color: "2C2A26",
        valign: "top",
        lineSpacingMultiple: 1.2,
        fit: "shrink",
        wrap: true,
      },
    );
    const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
    return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
  }

  pptx.title = `${result.moveLabel} — Costed Business-Case Pack`;
  const s = result.sections;
  const TOTAL = 8;
  renderCover(pptx, result);

  // §1 Board answer — verdict + economics strip.
  section(pptx, result, s.boardAnswer.anatomy, 2, TOTAL, (slide) => {
    lede(
      slide,
      `${s.boardAnswer.verdictHeadline} — ${s.boardAnswer.verdictDetail}`,
      2.0,
      0.8,
    );
    placeExhibit(slide, economicsStrip(s.boardAnswer.economics), 2.95, 3.5);
  });

  // §2 Inherited outline — curated TOC.
  section(pptx, result, s.inheritedOutline.anatomy, 3, TOTAL, (slide) => {
    bullets(
      slide,
      s.inheritedOutline.outline
        .slice(0, 8)
        .map((o) => `${o.heading} — ${o.guidance}`),
      2.0,
      4.4,
    );
  });

  // §3 Investment case — waterfall + cost stack.
  section(pptx, result, s.investmentCase.anatomy, 4, TOTAL, (slide) => {
    placeExhibit(
      slide,
      investmentWaterfall(s.investmentCase.waterfall),
      2.0,
      3.0,
    );
    if (s.investmentCase.costStack.length > 0) {
      lede(slide, s.investmentCase.buildVsChangeNote, 5.2, 1.2);
    }
  });

  // §4 Value case — gross-to-net value bridge.
  section(pptx, result, s.valueCase.anatomy, 5, TOTAL, (slide) => {
    placeExhibit(
      slide,
      valueBridge(
        s.valueCase.grossValue,
        s.valueCase.bridgeSteps,
        s.valueCase.netValue,
      ),
      2.0,
      4.3,
    );
  });

  // §5 Sensitivity — tornado + what breaks the case.
  section(pptx, result, s.sensitivity.anatomy, 6, TOTAL, (slide) => {
    placeExhibit(slide, sensitivityTornado(s.sensitivity.tornado), 2.0, 3.0);
    lede(
      slide,
      `What breaks the case: ${s.sensitivity.whatBreaksTheCase}`,
      5.2,
      1.2,
    );
  });

  // §6 Evidence & gaps — coverage + the precise seed gaps.
  section(pptx, result, s.evidenceGaps.anatomy, 7, TOTAL, (slide) => {
    lede(
      slide,
      `${s.evidenceGaps.recordedCount} recorded · ${s.evidenceGaps.gapCount} seed gaps · ` +
        `${s.evidenceGaps.coveragePct}% coverage.`,
      2.0,
      0.6,
    );
    bullets(
      slide,
      s.evidenceGaps.seedGaps
        .slice(0, 6)
        .map((g) => `${g.metric} — ${g.reason} (${g.expectedDataSource})`),
      2.7,
      3.7,
    );
  });

  // §7 Recommendation — verdict + kill triggers + Tower handoff.
  section(pptx, result, s.recommendation.anatomy, 8, TOTAL, (slide) => {
    lede(
      slide,
      `${s.recommendation.verdictHeadline} — ${s.recommendation.verdictDetail}`,
      2.0,
      0.9,
    );
    bullets(
      slide,
      [
        ...s.recommendation.killTriggers
          .slice(0, 3)
          .map((t) => `Kill trigger: ${t}`),
        ...s.recommendation.towerHandoff
          .slice(0, 3)
          .map(
            (t) => `Tower will measure: ${t.metric} (baseline ${t.baseline})`,
          ),
      ],
      3.0,
      3.4,
    );
  });

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}
