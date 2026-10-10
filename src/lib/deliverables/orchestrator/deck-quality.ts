import "server-only";

// Judge the deck that was actually rendered.
//
// The gate used to read `doc.deckSlides.length` — the authored storyline, which
// is what we INTENDED. When no storyline was authored the renderer fell back to
// one slide per document section and produced a physical deck the gate never
// saw. So `0 slides` sat next to a 12-slide file, and a deck could be 64 shapes
// off-canvas with every check green.
//
// Two different facts, now named as two different things:
//   authoredDeckSlides  — what the generation pass wrote
//   renderedPptxSlides  — what the client opens
//
// The second governs.

import type { InspectedDeck, InspectedSlide } from "./deck-inspection";
import { figuresOnSlide, referenceArchetypeGaps, type ReferenceDeckSpec } from "./reference-deck-model";

/**
 * Slide role. A cover or divider is legitimately thin and must SAY so — it is
 * never inferred from thinness, or every empty slide would excuse itself.
 */
export type SlideRole = "cover" | "divider" | "content" | "appendix";

export interface DeckPolicy {
  minSlides?: number;
  maxSlides?: number;
  /** Roles by 1-based slide index. Anything unlisted is content. */
  rolesByIndex?: Record<number, SlideRole>;
  referenceDeck?: ReferenceDeckSpec;
}

export type DeckFinding =
  | {
      kind: "off_canvas";
      slide: number;
      shapes: number;
      worstOverflowIn: number;
      message: string;
    }
  | { kind: "thin_slide"; slide: number; message: string }
  | { kind: "empty_canvas"; slide: number; message: string }
  | { kind: "empty_table"; slide: number; message: string }
  | { kind: "slide_count"; message: string }
  | { kind: "canvas"; message: string }
  | { kind: "reference_structure" | "reference_source" | "reference_edition" | "reference_editability"; slide: number; message: string };

export interface DeckVerdict {
  ok: boolean;
  renderedPptxSlides: number;
  canvasWidthIn: number;
  canvasHeightIn: number;
  findings: DeckFinding[];
  fidelityScore?: number;
}

const MIN_CONTENT_CHARS = 120;
const MIN_SUPPORTING_RUNS = 2;
/** Running header, slide number and title are chrome on every slide. */
const CHROME_RUNS = 3;

function roleOf(policy: DeckPolicy, slide: InspectedSlide): SlideRole {
  const archetype = policy.referenceDeck?.slides[slide.index - 1]?.archetype;
  if (archetype === "cover") return "cover";
  if (archetype === "divider") return "divider";
  const declared = policy.rolesByIndex?.[slide.index];
  if (declared) return declared;
  if (slide.layoutRole === "divider") return "divider";
  if (slide.index === 1) return "cover";
  return "content";
}

function judgeReferenceSlide(
  slide: InspectedSlide,
  spec: ReferenceDeckSpec,
  findings: DeckFinding[],
): void {
  const expected = spec.slides[slide.index - 1];
  if (!expected) return;
  const names = slide.objectNames ?? [];
  const named = slide.namedText ?? {};
  const add = (kind: "reference_structure" | "reference_source" | "reference_edition" | "reference_editability", message: string) =>
    findings.push({ kind, slide: slide.index, message });
  if (slide.pictureCount > names.filter((name) => name.startsWith("ref:logo:picture")).length)
    add("reference_editability", `slide ${slide.index}: raster picture outside the logo is not editable.`);
  if (!slide.notesText?.includes("The point:"))
    add("reference_structure", `slide ${slide.index}: business-case speaker notes omit The point.`);
  if (expected.archetype === "cover" || expected.archetype === "divider") return;
  for (const gap of referenceArchetypeGaps(expected, spec.edition))
    add("reference_structure", `slide ${slide.index}: ${expected.archetype} ${gap}.`);
  const actionMarker = `ref:action:${expected.archetype}:${expected.section ?? ""}`;
  const filled = names.filter((name) => /^ref:chip:.*:filled$/.test(name));
  if (filled.length !== 1 || filled[0] !== `ref:chip:${expected.section}:filled`)
    add("reference_structure", `slide ${slide.index}: filled chip does not match its section.`);
  const title = named[actionMarker] ?? "";
  if (title.split(/\s+/).length < 5 || /[.!?]\s+\S/.test(title))
    add("reference_structure", `slide ${slide.index}: action title is missing or reads as a topic label.`);
  if (!names.includes("ref:answer:bar") || !(named["ref:answer:text"] ?? "").trim())
    add("reference_structure", `slide ${slide.index}: answer bar is missing.`);
  const figureValues = figuresOnSlide(expected).map((figure) => figure.display);
  const sourceLine = named["ref:source-line"] ?? "";
  if (figureValues.length && !sourceLine.trim())
    add("reference_source", `slide ${slide.index}: figure has no rendered source line.`);
  for (const sourceId of expected.sourceIds ?? []) {
    if (!sourceLine.includes(sourceId))
      add("reference_source", `slide ${slide.index}: rendered source line omits ${sourceId}.`);
  }
  // `namedText` has one value per object name. Repeated KPI tiles share the
  // metric marker, so that map keeps only the last tile; inspect every text
  // run in the physical file when checking bound figures.
  const bodyText = slide.textRuns.join(" ");
  for (const value of figureValues) {
    if (!bodyText.includes(value))
      add("reference_source", `slide ${slide.index}: bound figure is absent from the rendered slide.`);
  }
  for (const block of expected.blocks) {
    if (block.kind !== "table" || slide.tableCount > 0) continue;
    const expectedCells = (block.rows.length + 1) * block.columns.length;
    const renderedCells = names.filter((name) => name.startsWith("ref:body:table-cell:")).length;
    if (renderedCells < expectedCells)
      add("reference_editability", `slide ${slide.index}: shape-built table is missing editable cells.`);
  }
  if (spec.edition === "validation" && /\b(cost|rom|roi|investment|solution|plan|roadmap|release)\b/i.test(slide.textRuns.join(" ")))
    add("reference_edition", `slide ${slide.index}: validation edition contains investment or solution material.`);
}

/**
 * Does this slide carry a decision-support payload?
 *
 * Deliberately NOT a word count. A populated table, a drawn visual or a chart
 * each qualify alone — a slide can be excellent with four words and a diagram.
 * What does not qualify is a title and a fragment.
 */
function hasSubstance(slide: InspectedSlide): boolean {
  const supportingText = slide.textRuns.slice(CHROME_RUNS).join(" ").trim();
  const supportingChars = supportingText.length;
  if (slide.tableCount > 0 && supportingChars > 40) return true;
  if (slide.pictureCount > 0) return true;
  if (slide.chartCount > 0) return true;
  const supporting = Math.max(0, slide.textRuns.length - CHROME_RUNS);
  return (
    supporting >= MIN_SUPPORTING_RUNS && supportingChars >= MIN_CONTENT_CHARS
  );
}

export function judgeRenderedDeck(
  deck: InspectedDeck,
  policy: DeckPolicy = {},
): DeckVerdict {
  const findings: DeckFinding[] = [];

  if (deck.canvasWidthIn < 13 || deck.canvasHeightIn < 7) {
    findings.push({
      kind: "canvas",
      message: `slide canvas is ${deck.canvasWidthIn.toFixed(2)}x${deck.canvasHeightIn.toFixed(2)}in; this renderer lays out for 13.33x7.50in, so content runs off the page.`,
    });
  }

  if (policy.minSlides !== undefined && deck.slideCount < policy.minSlides) {
    findings.push({
      kind: "slide_count",
      message: `${deck.slideCount} rendered slides; minimum ${policy.minSlides}.`,
    });
  }
  if (policy.maxSlides !== undefined && deck.slideCount > policy.maxSlides) {
    findings.push({
      kind: "slide_count",
      message: `${deck.slideCount} rendered slides against a ceiling of ${policy.maxSlides}.`,
    });
  }

  for (const slide of deck.slides) {
    if (policy.referenceDeck) judgeReferenceSlide(slide, policy.referenceDeck, findings);
    if (slide.offCanvas.length > 0) {
      const worst = Math.max(
        ...slide.offCanvas.map((o) =>
          Math.max(o.overflowRightIn, o.overflowBottomIn),
        ),
      );
      findings.push({
        kind: "off_canvas",
        slide: slide.index,
        shapes: slide.offCanvas.length,
        worstOverflowIn: Number(worst.toFixed(2)),
        message: `slide ${slide.index}: ${slide.offCanvas.length} shape(s) outside the canvas, worst by ${worst.toFixed(2)}in — content the client cannot see.`,
      });
    }

    const supportingChars = slide.textRuns
      .slice(CHROME_RUNS)
      .join(" ")
      .trim().length;
    if (slide.tableCount > 0 && supportingChars < 40) {
      findings.push({
        kind: "empty_table",
        slide: slide.index,
        message: `slide ${slide.index}: a table was drawn with no meaningful content in it.`,
      });
    }

    const role = roleOf(policy, slide);
    const narrativeChars =
      role === "cover" || role === "divider"
        ? slide.textRuns.join(" ").trim().length
        : supportingChars;
    if (
      slide.pictureCount === 0 &&
      slide.tableCount === 0 &&
      slide.chartCount === 0 &&
      narrativeChars === 0
    ) {
      findings.push({
        kind: "empty_canvas",
        slide: slide.index,
        message: `slide ${slide.index}: no narrative, table, chart, or exhibit was rendered on the canvas.`,
      });
      continue;
    }

    if (role === "cover" || role === "divider") continue;

    if (!hasSubstance(slide)) {
      findings.push({
        kind: "thin_slide",
        slide: slide.index,
        message: `slide ${slide.index}: a title and ${slide.visibleChars} characters, with no table, visual or supporting argument. A section heading on a slide is not a slide.`,
      });
    }
  }

  return {
    ok: findings.length === 0,
    renderedPptxSlides: deck.slideCount,
    canvasWidthIn: deck.canvasWidthIn,
    canvasHeightIn: deck.canvasHeightIn,
    findings,
    ...(policy.referenceDeck
      ? { fidelityScore: Math.max(0, 100 - findings.length * 5) }
      : {}),
  };
}
