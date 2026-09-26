import 'server-only';

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

import type { InspectedDeck, InspectedSlide } from './deck-inspection';

/**
 * Slide role. A cover or divider is legitimately thin and must SAY so — it is
 * never inferred from thinness, or every empty slide would excuse itself.
 */
export type SlideRole = 'cover' | 'divider' | 'content' | 'appendix';

export interface DeckPolicy {
  minSlides?: number;
  maxSlides?: number;
  /** Roles by 1-based slide index. Anything unlisted is content. */
  rolesByIndex?: Record<number, SlideRole>;
}

export type DeckFinding =
  | { kind: 'off_canvas'; slide: number; shapes: number; worstOverflowIn: number; message: string }
  | { kind: 'thin_slide'; slide: number; message: string }
  | { kind: 'empty_table'; slide: number; message: string }
  | { kind: 'slide_count'; message: string }
  | { kind: 'canvas'; message: string };

export interface DeckVerdict {
  ok: boolean;
  renderedPptxSlides: number;
  canvasWidthIn: number;
  canvasHeightIn: number;
  findings: DeckFinding[];
}

const MIN_CONTENT_CHARS = 140;
const MIN_SUPPORTING_RUNS = 2;
/** Running header, slide number and title are chrome on every slide. */
const CHROME_RUNS = 3;

function roleOf(policy: DeckPolicy, slide: InspectedSlide): SlideRole {
  const declared = policy.rolesByIndex?.[slide.index];
  if (declared) return declared;
  if (slide.index === 1) return 'cover';
  return 'content';
}

/**
 * Does this slide carry a decision-support payload?
 *
 * Deliberately NOT a word count. A populated table, a drawn visual or a chart
 * each qualify alone — a slide can be excellent with four words and a diagram.
 * What does not qualify is a title and a fragment.
 */
function hasSubstance(slide: InspectedSlide): boolean {
  if (slide.tableCount > 0 && slide.visibleChars > 40) return true;
  if (slide.pictureCount > 0) return true;
  if (slide.chartCount > 0) return true;
  const supporting = Math.max(0, slide.textRuns.length - CHROME_RUNS);
  return supporting >= MIN_SUPPORTING_RUNS && slide.visibleChars >= MIN_CONTENT_CHARS;
}

export function judgeRenderedDeck(deck: InspectedDeck, policy: DeckPolicy = {}): DeckVerdict {
  const findings: DeckFinding[] = [];

  if (deck.canvasWidthIn < 13 || deck.canvasHeightIn < 7) {
    findings.push({
      kind: 'canvas',
      message: `slide canvas is ${deck.canvasWidthIn.toFixed(2)}x${deck.canvasHeightIn.toFixed(2)}in; this renderer lays out for 13.33x7.50in, so content runs off the page.`,
    });
  }

  if (policy.minSlides !== undefined && deck.slideCount < policy.minSlides) {
    findings.push({ kind: 'slide_count', message: `${deck.slideCount} rendered slides; minimum ${policy.minSlides}.` });
  }
  if (policy.maxSlides !== undefined && deck.slideCount > policy.maxSlides) {
    findings.push({ kind: 'slide_count', message: `${deck.slideCount} rendered slides against a ceiling of ${policy.maxSlides}.` });
  }

  for (const slide of deck.slides) {
    if (slide.offCanvas.length > 0) {
      const worst = Math.max(
        ...slide.offCanvas.map((o) => Math.max(o.overflowRightIn, o.overflowBottomIn)),
      );
      findings.push({
        kind: 'off_canvas',
        slide: slide.index,
        shapes: slide.offCanvas.length,
        worstOverflowIn: Number(worst.toFixed(2)),
        message: `slide ${slide.index}: ${slide.offCanvas.length} shape(s) outside the canvas, worst by ${worst.toFixed(2)}in — content the client cannot see.`,
      });
    }

    if (slide.tableCount > 0 && slide.visibleChars < 40) {
      findings.push({
        kind: 'empty_table',
        slide: slide.index,
        message: `slide ${slide.index}: a table was drawn with no meaningful content in it.`,
      });
    }

    const role = roleOf(policy, slide);
    if (role === 'cover' || role === 'divider') continue;

    if (!hasSubstance(slide)) {
      findings.push({
        kind: 'thin_slide',
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
  };
}
