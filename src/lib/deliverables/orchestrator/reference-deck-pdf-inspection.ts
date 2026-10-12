import "server-only";

import type { DeckFinding } from "./deck-quality";
import {
  clientCopyIssue, coverUsesEditionRule, referenceSourceLine, visibleFiguresOnSlide,
  type ReferenceDeckSpec,
} from "./reference-deck-model";

interface ReferencePdfPage {
  pageNumber: number;
  width: number;
  height: number;
  text: string;
}

const searchable = (value: string): string => value.normalize("NFKC").replace(/[^\p{L}\p{N}]/gu, "").toLocaleLowerCase();

/** Check the PDF's own pages and text rather than assuming PPTX parity. */
export function judgeReferencePdfPages(pages: ReferencePdfPage[], spec: ReferenceDeckSpec): DeckFinding[] {
  const findings: DeckFinding[] = [];
  if (pages.length !== spec.slides.length)
    findings.push({ kind: "slide_count", message: "The rendered PDF page count does not match the edition." });
  for (const [index, expected] of spec.slides.entries()) {
    const page = pages.find((item) => item.pageNumber === index + 1);
    const slide = index + 1;
    if (!page) {
      findings.push({ kind: "empty_canvas", slide, message: "An expected PDF page is missing." });
      continue;
    }
    if (!Number.isFinite(page.width) || !Number.isFinite(page.height)
      || Math.abs(page.width - 960) > 0.5 || Math.abs(page.height - 540) > 0.5)
      findings.push({ kind: "canvas", message: `PDF page ${slide} does not use the expected landscape canvas.` });
    const visible = searchable(page.text);
    const add = (kind: "reference_source" | "reference_client_copy" | "reference_structure", detailCode: string, message: string) =>
      findings.push({ kind, slide, detailCode, message });
    if (!visible) {
      findings.push({ kind: "empty_canvas", slide, message: "The rendered PDF page has no readable text." });
      continue;
    }
    if (clientCopyIssue(page.text)) add("reference_client_copy", "internal_term", "PDF client text contains internal workflow language.");
    if (coverUsesEditionRule(page.text)) add("reference_client_copy", "edition_rule_visible", "The edition rule appears in PDF client text.");
    if (!visible.includes(searchable(expected.actionTitle)))
      add("reference_structure", "pdf_title_missing", "The authored title is absent from the rendered PDF page.");
    if (expected.answer && !visible.includes(searchable(expected.answer)))
      add("reference_structure", "pdf_answer_missing", "The authored answer is absent from the rendered PDF page.");
    if (expected.archetype === "divider" && expected.blocks.some((block) => block.kind === "text"
      && block.lines.some((line) => !visible.includes(searchable(line)))))
      add("reference_structure", "pdf_divider_text_missing", "The divider's supporting text is absent from the rendered PDF page.");
    const sourceLine = referenceSourceLine(expected);
    if (expected.archetype !== "cover" && expected.archetype !== "divider" && sourceLine
      && !visible.includes(searchable(sourceLine)))
      add("reference_source", "source_line_mismatch", "The rendered PDF omits its expected source line.");
    for (const figure of visibleFiguresOnSlide(expected)) {
      if (!visible.includes(searchable(figure.display)))
        add("reference_source", "bound_figure_missing", "A bound figure is absent from the rendered PDF page.");
    }
  }
  return findings;
}

export async function inspectReferenceDeckPdf(bytes: Buffer, spec: ReferenceDeckSpec): Promise<DeckFinding[]> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const info = await parser.getInfo({ parsePageInfo: true });
    const text = await parser.getText();
    const pages = info.pages.map((page) => ({
      pageNumber: page.pageNumber, width: page.width, height: page.height,
      text: text.pages.find((item) => item.num === page.pageNumber)?.text ?? "",
    }));
    return judgeReferencePdfPages(pages, spec);
  } finally {
    await parser.destroy();
  }
}
