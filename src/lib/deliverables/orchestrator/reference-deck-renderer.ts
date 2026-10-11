import "server-only";

import type PptxGenJS from "pptxgenjs";
import { COLORS } from "@/lib/design/design-tokens";
import {
  figuresOnSlide,
  referenceSourceLine,
  validateReferenceDeck,
  type ReferenceBlock,
  type ReferenceCell,
  type ReferenceDeckSpec,
  type ReferenceSlide,
} from "./reference-deck-model";

type Slide = ReturnType<PptxGenJS["addSlide"]>;
const C = {
  paper: COLORS.cream.slice(1),
  ink: COLORS.deckInk.slice(1),
  muted: COLORS.deckMuted.slice(1),
  rule: COLORS.deckRule.slice(1),
  panel: "EFEEEA",
  accent: "9A2430",
  white: COLORS.white.slice(1),
};
const SECTIONS = ["CONTEXT", "WHAT", "WHY", "VALIDATE", "HOW"] as const;
const BODY = "DM Sans";
const SERIF = "Georgia";
const display = (cell: ReferenceCell): string =>
  typeof cell === "string" ? cell : cell.display;

function addCover(slide: Slide, spec: ReferenceDeckSpec, content: ReferenceSlide): void {
  slide.background = { color: C.ink };
  slide.addText(`${spec.client.toUpperCase()}  /  ${spec.useCase.toUpperCase()}`, {
    x: 0.72, y: 0.78, w: 10.8, h: 0.3, fontFace: BODY,
    fontSize: 11, bold: true, charSpacing: 1.2, color: C.white,
    objectName: "ref:cover:eyebrow",
  });
  slide.addText(content.actionTitle, {
    x: 0.72, y: 1.65, w: 11.8, h: 1.7, fontFace: SERIF,
    fontSize: 36, color: C.white, breakLine: false, fit: "shrink",
    objectName: "ref:cover:title",
  });
  slide.addText(content.answer ?? "", {
    x: 0.72, y: 3.75, w: 10.8, h: 0.85, fontFace: BODY,
    fontSize: 19, color: C.white, fit: "shrink", objectName: "ref:cover:promise",
  });
  slide.addText(`Sponsor: ${spec.sponsorRole}`, {
    x: 0.72, y: 5.02, w: 6, h: 0.34, fontFace: BODY,
    fontSize: 13, color: C.white,
  });
  slide.addText(`Discussion draft · ${spec.monthYear} · sources checked to ${spec.sourcesCheckedTo}`, {
    x: 0.72, y: 6.42, w: 11.8, h: 0.28, fontFace: BODY,
    fontSize: 10, color: C.white,
  });
  slide.addText(`Prepared by AbarVa · ${spec.edition} edition`, {
    x: 0.72, y: 6.83, w: 11.8, h: 0.28, fontFace: BODY,
    fontSize: 10, color: C.white,
  });
}

function addDivider(slide: Slide, spec: ReferenceDeckSpec, content: ReferenceSlide, number: number): void {
  slide.background = { color: C.ink };
  slide.addText(`${number.toString().padStart(2, "0")}  ${content.section ?? ""}`, {
    x: 0.72, y: 1.03, w: 11, h: 0.5, fontFace: BODY,
    fontSize: 16, bold: true, color: C.white, objectName: `ref:divider:${content.section ?? ""}`,
  });
  slide.addText(content.actionTitle, {
    x: 0.72, y: 2.05, w: 11.6, h: 1.3, fontFace: SERIF,
    fontSize: 40, color: C.white, fit: "shrink",
  });
  if (content.answer) slide.addText(content.answer, {
    x: 0.72, y: 3.68, w: 11.6, h: 0.7, fontFace: SERIF,
    fontSize: 23, italic: true, color: C.white, fit: "shrink",
  });
  const lines = content.blocks.flatMap((block) => block.kind === "text" ? block.lines : []);
  if (lines.length) slide.addText(`IN THIS SECTION\n${lines.join("\n")}`, {
    x: 0.72, y: 5.12, w: 10.5, h: 1.15, fontFace: BODY,
    fontSize: 13, color: C.white, breakLine: false,
  });
  slide.addText(`${spec.program} · ${spec.useCase} · Discussion draft`, {
    x: 0.72, y: 7.16, w: 10.9, h: 0.18, fontFace: BODY, fontSize: 8, color: C.white,
  });
}

function addChrome(slide: Slide, spec: ReferenceDeckSpec, content: ReferenceSlide, index: number): void {
  slide.background = { color: C.paper };
  slide.addText(spec.useCase.toUpperCase(), {
    x: 0.72, y: 0.24, w: 5.6, h: 0.25, fontFace: BODY,
    fontSize: 9, bold: true, charSpacing: 1, color: C.muted,
    objectName: "ref:running-header",
  });
  slide.addText("AbarVa", {
    x: 11.80, y: 0.24, w: 0.82, h: 0.25, fontFace: BODY,
    fontSize: 9.5, bold: true, color: C.ink, align: "right", objectName: "ref:logo-wordmark",
  });
  const sections = SECTIONS.map((s) => spec.edition === "validation" && s === "VALIDATE" ? "CONFIRM" : s);
  sections.forEach((section, i) => {
    const filled = section === content.section;
    slide.addShape("roundRect", {
      x: 6.12 + i * 1.13, y: 0.20, w: 1.04, h: 0.33,
      line: { color: filled ? C.accent : C.rule, width: 0.6 },
      fill: { color: filled ? C.accent : C.paper },
      objectName: `ref:chip:${section}:${filled ? "filled" : "outline"}`,
    });
    slide.addText(section, {
      x: 6.12 + i * 1.13, y: 0.235, w: 1.04, h: 0.17,
      fontFace: BODY, fontSize: 6.4, bold: true, align: "center",
      color: filled ? C.white : C.muted,
    });
  });
  slide.addShape("line", { x: 0.72, y: 0.64, w: 11.9, h: 0, line: { color: C.rule, width: 0.7 } });
  slide.addText(content.actionTitle, {
    x: 0.72, y: 0.83, w: 11.9, h: 0.83, fontFace: SERIF,
    fontSize: 25, color: C.ink, fit: "shrink",
    objectName: `ref:action:${content.archetype}:${content.section ?? ""}`,
  });
  slide.addShape("rect", {
    x: 0.72, y: 6.23, w: 11.9, h: 0.58,
    line: { color: C.ink, transparency: 100 }, fill: { color: C.ink },
    objectName: "ref:answer:bar",
  });
  slide.addText(`${content.answerLabel?.toUpperCase() ?? "THE ANSWER"}  ${content.answer ?? ""}`, {
    x: 0.92, y: 6.34, w: 11.5, h: 0.34, fontFace: BODY,
    fontSize: 12.5, color: C.white, bold: false, fit: "shrink",
    objectName: "ref:answer:text",
  });
  const sourceIds = content.sourceIds ?? [];
  if (sourceIds.length) {
    slide.addText(referenceSourceLine(content), {
      x: 0.72, y: 6.88, w: 11.9, h: 0.22, fontFace: BODY,
      fontSize: 8, italic: true, color: C.muted, fit: "shrink",
      objectName: "ref:source-line",
    });
  }
  slide.addText(`${spec.program} · ${spec.useCase} · Discussion draft`, {
    x: 0.72, y: 7.2, w: 10.9, h: 0.18, fontFace: BODY,
    fontSize: 8, color: C.muted, objectName: "ref:footer",
  });
  slide.addText(String(index + 1), {
    x: 11.98, y: 7.2, w: 0.62, h: 0.18, fontFace: BODY,
    fontSize: 8, color: C.muted, align: "right",
  });
}

function addBlock(slide: Slide, block: ReferenceBlock, y: number): number {
  const x = 0.72;
  const w = 11.9;
  switch (block.kind) {
    case "table": {
      const rows = block.rows.map((row) => row.map(display));
      const rowH = block.columns.length >= 6 && rows.length >= 5
        ? 0.4 : Math.min(0.48, 3.95 / Math.max(1, rows.length + 1));
      const cells = [block.columns, ...rows];
      const colW = w / block.columns.length;
      cells.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
        const xx = x + colIndex * colW;
        const yy = y + rowIndex * rowH;
        const decisive = rowIndex > 0 && block.decisiveRows?.includes(rowIndex - 1);
        slide.addShape("rect", {
          x: xx, y: yy, w: colW, h: rowH,
          line: { color: C.rule, width: 0.45 },
          fill: { color: rowIndex === 0 ? C.ink : decisive ? C.panel : C.white },
          objectName: `ref:body:table-cell:${rowIndex}:${colIndex}`,
        });
        slide.addText(value, {
          x: xx + 0.08, y: yy + 0.06, w: colW - 0.16, h: rowH - 0.11,
          fontFace: BODY, fontSize: rowIndex === 0 ? 10 : 11,
          bold: rowIndex === 0 || Boolean(decisive),
          color: rowIndex === 0 ? C.white : C.ink,
          fit: "shrink",
          objectName: `ref:body:table-text:${rowIndex}:${colIndex}`,
        });
      }));
      return y + rowH * (rows.length + 1) + 0.12;
    }
    case "metrics": {
      const count = block.items.length;
      const itemW = (w - (count - 1) * 0.15) / count;
      block.items.forEach((item, i) => {
        const xx = x + i * (itemW + 0.15);
        slide.addShape("rect", { x: xx, y, w: itemW, h: 1.55,
          line: { color: C.rule, width: 0.5 }, fill: { color: C.panel },
          objectName: "ref:body:metric" });
        slide.addText(item.label.toUpperCase(), { x: xx + 0.15, y: y + 0.12, w: itemW - 0.3, h: 0.25,
          fontFace: BODY, fontSize: 9, color: C.muted, bold: true });
        slide.addText(display(item.value), { x: xx + 0.15, y: y + 0.43, w: itemW - 0.3, h: 0.57,
          fontFace: SERIF, fontSize: 27, color: C.accent, fit: "shrink",
          objectName: typeof item.value === "string" ? "ref:metric:text" : "ref:figure:metric" });
        slide.addText(item.meaning, { x: xx + 0.15, y: y + 1.1, w: itemW - 0.3, h: 0.32,
          fontFace: BODY, fontSize: 10, color: C.ink, fit: "shrink" });
      });
      return y + 1.68;
    }
    case "flow": {
      const count = block.nodes.length;
      const itemW = (w - (count - 1) * 0.48) / count;
      block.nodes.forEach((node, i) => {
        const xx = x + i * (itemW + 0.48);
        slide.addShape("rect", { x: xx, y, w: itemW, h: 1.1,
          line: { color: C.rule, width: 0.7 }, fill: { color: C.panel }, objectName: "ref:body:flow" });
        slide.addText(node, { x: xx + 0.12, y: y + 0.25, w: itemW - 0.24, h: 0.6,
          fontFace: BODY, fontSize: 14, color: C.ink, align: "center", fit: "shrink" });
        if (i < count - 1) slide.addText("→", { x: xx + itemW + 0.06, y: y + 0.39, w: 0.36, h: 0.3,
          fontFace: BODY, fontSize: 18, color: C.accent, align: "center" });
      });
      if (block.annotation) slide.addText(block.annotation, { x, y: y + 1.25, w, h: 0.38,
        fontFace: BODY, fontSize: 12, color: C.muted });
      return y + 1.75;
    }
    case "architecture": {
      const count = block.layers.length;
      const itemW = (w - 2.5 - (count - 1) * 0.13) / count;
      block.layers.forEach((layer, i) => {
        const xx = x + i * (itemW + 0.13);
        slide.addShape("rect", { x: xx, y, w: itemW, h: 2.55,
          line: { color: C.rule, width: 0.7 }, fill: { color: C.panel }, objectName: "ref:body:architecture" });
        slide.addText(layer.name.toUpperCase(), { x: xx + 0.08, y: y + 0.14, w: itemW - 0.16, h: 0.3,
          fontFace: BODY, fontSize: 9, bold: true, color: C.accent, align: "center" });
        slide.addText(layer.items.join("\n"), { x: xx + 0.08, y: y + 0.62, w: itemW - 0.16, h: 1.68,
          fontFace: BODY, fontSize: 11, color: C.ink, align: "center", fit: "shrink" });
      });
      slide.addShape("rect", { x: x + w - 2.34, y, w: 2.34, h: 2.55,
        line: { color: C.rule, width: 0.7 }, fill: { color: C.ink } });
      slide.addText(`GOVERNANCE\n${block.governance}`, { x: x + w - 2.18, y: y + 0.2, w: 2.02, h: 2.18,
        fontFace: BODY, fontSize: 11, color: C.white, fit: "shrink" });
      return y + 2.7;
    }
    case "bars": {
      const max = Math.max(1, ...block.items.map((item) => item.magnitude));
      block.items.forEach((item, i) => {
        const yy = y + i * 0.54;
        slide.addText(item.label, { x, y: yy, w: 2.4, h: 0.27, fontFace: BODY, fontSize: 11, color: C.ink });
        slide.addShape("rect", { x: x + 2.52, y: yy + 0.02, w: 7.6 * item.magnitude / max, h: 0.2,
          line: { color: C.accent, transparency: 100 }, fill: { color: C.accent }, objectName: "ref:body:bar" });
        slide.addText(item.value.display, { x: x + 10.25, y: yy, w: 1.6, h: 0.27,
          fontFace: BODY, fontSize: 11, color: C.ink, align: "right", objectName: "ref:figure:bar" });
      });
      return y + block.items.length * 0.54 + 0.08;
    }
    case "timeline": {
      const gridX = x + 3.1;
      const quarterW = 8.8 / Math.max(1, block.quarters.length);
      block.quarters.forEach((q, i) => slide.addText(q, { x: gridX + i * quarterW, y, w: quarterW, h: 0.3,
        fontFace: BODY, fontSize: 10, color: C.muted, align: "center" }));
      slide.addShape("line", { x: gridX + block.today * quarterW, y: y + 0.3, w: 0, h: 3.5,
        line: { color: C.accent, width: 1.4 }, objectName: "ref:body:today" });
      block.rows.forEach((row, i) => {
        const yy = y + 0.47 + i * 0.43;
        slide.addText(row.label, { x, y: yy, w: 3, h: 0.27, fontFace: BODY, fontSize: 10.5, color: C.ink });
        slide.addShape("rect", { x: gridX + row.from * quarterW, y: yy + 0.05,
          w: Math.max(0.1, (row.to - row.from + 1) * quarterW - 0.08), h: 0.18,
          line: { color: C.ink, transparency: 100 }, fill: { color: C.ink }, objectName: "ref:body:timeline" });
        if (row.cost) slide.addText(row.cost.display, { x: x + 9.75, y: yy, w: 2.1, h: 0.27,
          fontFace: BODY, fontSize: 10, align: "right", color: C.ink, objectName: "ref:figure:timeline" });
      });
      slide.addText("◆", { x: gridX + block.commit * quarterW - 0.08, y: y + 3.9, w: 0.2, h: 0.2,
        fontFace: BODY, fontSize: 14, color: C.accent, objectName: "ref:body:commit" });
      return y + 4.17;
    }
    case "gap": {
      slide.addShape("rect", { x, y, w, h: 3.55,
        line: { color: C.rule, width: 0.8 }, fill: { color: C.panel },
        objectName: "ref:body:governed-gap" });
      slide.addShape("rect", { x, y, w: 0.1, h: 3.55,
        line: { color: C.accent, transparency: 100 }, fill: { color: C.accent } });
      slide.addText(block.title, { x: x + 0.36, y: y + 0.43, w: w - 0.8, h: 0.55,
        fontFace: SERIF, fontSize: 25, color: C.ink, fit: "shrink", objectName: "ref:body:gap-title" });
      slide.addText(block.detail, { x: x + 0.36, y: y + 1.24, w: w - 0.8, h: 0.66,
        fontFace: BODY, fontSize: 16, color: C.ink, fit: "shrink", objectName: "ref:body:gap-detail" });
      slide.addText(`NEXT READ  ${block.nextAction}`, { x: x + 0.36, y: y + 2.58, w: w - 0.8, h: 0.45,
        fontFace: BODY, fontSize: 12, bold: true, color: C.accent, fit: "shrink", objectName: "ref:body:gap-action" });
      return y + 3.67;
    }
    case "text": {
      slide.addText(block.lines.join("\n"), { x, y, w, h: Math.min(3.7, Math.max(0.52, block.lines.length * 0.47)),
        fontFace: BODY, fontSize: 15, color: C.ink, breakLine: false,
        objectName: "ref:body:text" });
      return y + Math.min(3.7, Math.max(0.52, block.lines.length * 0.47)) + 0.12;
    }
  }
}

/** Render only validated, editable shapes and text. No raster exhibit path exists here. */
export async function renderReferenceDeck(spec: ReferenceDeckSpec): Promise<Buffer> {
  const hard = validateReferenceDeck(spec).filter((finding) => finding.blocking);
  if (hard.length) throw new Error(`reference_deck_blocked: ${hard.map((f) => `${f.slide}:${f.code}`).join(", ")}`);
  const { default: PptxGen } = await import("pptxgenjs");
  const pptx = new PptxGen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "AbarVa";
  pptx.company = "AbarVa";
  pptx.title = `${spec.useCase} · ${spec.edition} edition`;
  spec.slides.forEach((content, index) => {
    const slide = pptx.addSlide();
    if (content.archetype === "cover") addCover(slide, spec, content);
    else if (content.archetype === "divider") addDivider(slide, spec, content, index + 1);
    else {
      addChrome(slide, spec, content, index);
      let y = 1.83;
      for (const block of content.blocks) y = addBlock(slide, block, y);
      if (y > 6.16) throw new Error(`reference_deck_body_overflow: slide ${index + 1}`);
    }
    if (content.speakerNotes) {
      const lineage = (content.sourceIds ?? []).map((id) => {
        const cells = figuresOnSlide(content).filter((figure) => figure.sourceId === id)
          .map((figure) => `${figure.workbookCell} ${figure.display}`).join(", ");
        return `${id}: ${spec.sources[id]}${cells ? `; ${cells}` : ""}`;
      });
      slide.addNotes(`${content.speakerNotes}${lineage.length ? `\nLineage: ${lineage.join(" | ")}` : ""}`);
    }
    if (figuresOnSlide(content).length && !(content.sourceIds ?? []).length)
      throw new Error(`reference_deck_missing_sources: slide ${index + 1}`);
  });
  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
