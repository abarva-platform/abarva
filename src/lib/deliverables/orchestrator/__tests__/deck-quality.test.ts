export {};

// The gate must judge the rendered FILE, and must fail on planted defects.

import { renderDeliverablePptx } from '../renderers';
import { goodDocument } from '../__fixtures__/ams-rfp';
import { inspectDeck, type InspectedDeck, type InspectedSlide } from '../deck-inspection';
import { judgeRenderedDeck } from '../deck-quality';

function slide(over: Partial<InspectedSlide> = {}): InspectedSlide {
  return {
    index: 2,
    textRuns: ['RUNNING HEADER', '2/8', 'A Title', 'A real supporting argument of useful length.', 'A second supporting point with substance.'],
    visibleChars: 180,
    tableCount: 0, pictureCount: 0, chartCount: 0, offCanvas: [],
    ...over,
  };
}
const deckOf = (slides: InspectedSlide[]): InspectedDeck => ({
  canvasWidthIn: 13.33, canvasHeightIn: 7.5, slideCount: slides.length, slides,
});
const kinds = (v: ReturnType<typeof judgeRenderedDeck>) => v.findings.map((f) => f.kind);

describe('planted defects must fail', () => {
  it('title-only slide', () => {
    const v = judgeRenderedDeck(deckOf([slide({ index: 1 }),
      slide({ index: 2, textRuns: ['HEADER', '2/2', 'Scope & Service Towers'], visibleChars: 38 })]));
    expect(v.ok).toBe(false);
    expect(kinds(v)).toContain('thin_slide');
  });

  it('title plus one fragment', () => {
    const v = judgeRenderedDeck(deckOf([slide({ index: 1 }),
      slide({ index: 2, textRuns: ['HEADER', '2/2', 'Pricing', 'Resource-unit pricing applies.'], visibleChars: 72 })]));
    expect(kinds(v)).toContain('thin_slide');
  });

  it('empty table shell', () => {
    const v = judgeRenderedDeck(deckOf([slide({ index: 1 }),
      slide({ index: 2, tableCount: 1, textRuns: ['HEADER', '2/2', 'Risks'], visibleChars: 22 })]));
    expect(kinds(v)).toContain('empty_table');
  });

  it('off-canvas shape, and it says how far', () => {
    const v = judgeRenderedDeck(deckOf([slide({ index: 1 }),
      slide({ index: 2, offCanvas: [{ xIn: 0.72, yIn: 1, widthIn: 11.8, heightIn: 1, overflowRightIn: 2.52, overflowBottomIn: 0 }] })]));
    expect(v.ok).toBe(false);
    const f = v.findings.find((x) => x.kind === 'off_canvas');
    expect(f && 'worstOverflowIn' in f ? f.worstOverflowIn : 0).toBeCloseTo(2.52, 2);
  });

  // The defect that actually shipped.
  it('a narrow canvas fails on its own', () => {
    const v = judgeRenderedDeck({ ...deckOf([slide({ index: 1 }), slide()]), canvasWidthIn: 10, canvasHeightIn: 5.63 });
    expect(kinds(v)).toContain('canvas');
  });

  it('slide count, both edges', () => {
    const d = deckOf([slide({ index: 1 }), slide()]);
    expect(kinds(judgeRenderedDeck(d, { minSlides: 8 }))).toContain('slide_count');
    expect(kinds(judgeRenderedDeck(d, { maxSlides: 1 }))).toContain('slide_count');
  });
});

describe('valid slides must pass', () => {
  it('a visual carries a slide on four words', () => {
    expect(judgeRenderedDeck(deckOf([slide({ index: 1 }),
      slide({ index: 2, textRuns: ['HEADER', '2/2', 'Target State'], visibleChars: 30, pictureCount: 1 })])).ok).toBe(true);
  });

  it('a populated table carries a slide', () => {
    expect(judgeRenderedDeck(deckOf([slide({ index: 1 }),
      slide({ index: 2, tableCount: 1, textRuns: ['HEADER', '2/2', 'Risks', 'Transition window', 'high', 'CIO'], visibleChars: 96 })])).ok).toBe(true);
  });

  // Thin is acceptable only when the slide SAYS it is a divider. Inferring it
  // from thinness would let every empty slide excuse itself.
  it('a declared divider may be thin; an undeclared one may not', () => {
    const d = deckOf([slide({ index: 1 }), slide({ index: 2, textRuns: ['HEADER', '2/2', 'Part Two'], visibleChars: 26 })]);
    expect(judgeRenderedDeck(d, { rolesByIndex: { 2: 'divider' } }).ok).toBe(true);
    expect(judgeRenderedDeck(d).ok).toBe(false);
  });
});

describe('against the real rendered file', () => {
  it('reports rendered slides, not authored ones, and clean bounds', async () => {
    const deck = await inspectDeck(await renderDeliverablePptx(goodDocument()));
    const v = judgeRenderedDeck(deck);
    expect(v.renderedPptxSlides).toBe(deck.slideCount);
    expect(v.renderedPptxSlides).toBeGreaterThan(0);
    expect(v.canvasWidthIn).toBeCloseTo(13.33, 1);
    expect(v.findings.filter((f) => f.kind === 'off_canvas')).toEqual([]);
  }, 60_000);
});
