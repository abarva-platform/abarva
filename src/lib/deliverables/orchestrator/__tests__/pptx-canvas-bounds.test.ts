export {};

// The rendered PPTX must fit on its own canvas.
//
// `pptx.layout` declared LAYOUT_16x9 (10.00in x 5.625in) while every content
// shape in this renderer is positioned for the wide canvas — x: 0.72, w: 11.8
// needs 12.52in. So body text, tables and exhibits ran ~2.5in off the right
// edge of every slide, and a 12-slide charter carried 64 off-canvas shapes.
//
// It was invisible because the aspect ratio is identical either way: slide
// counts, thumbnails and every existing check looked correct. Only opening the
// file showed it. This test opens the file.

import { renderDeliverablePptx } from '../renderers';
import { goodDocument } from '../__fixtures__/ams-rfp';
import { inspectDeck } from '../deck-inspection';

it('renders every shape inside the slide canvas', async () => {
  const deck = await inspectDeck(await renderDeliverablePptx(goodDocument()));

  // The canvas must be the one the coordinates were written for.
  expect(deck.canvasWidthIn).toBeCloseTo(13.33, 1);
  expect(deck.canvasHeightIn).toBeCloseTo(7.5, 1);
  expect(deck.slideCount).toBeGreaterThan(0);

  const offenders = deck.slides
    .filter((s) => s.offCanvas.length > 0)
    .map((s) => `slide ${s.index}: ${s.offCanvas.length} shape(s), worst right+${Math.max(...s.offCanvas.map((o) => o.overflowRightIn)).toFixed(2)}in`);
  expect(offenders).toEqual([]);
}, 60_000);
