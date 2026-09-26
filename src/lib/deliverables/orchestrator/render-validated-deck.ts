import 'server-only';

// Render a deck and inspect what was rendered, in one call.
//
// Nothing may serve a PPTX without this having looked at it. The canvas defect
// — every shape 2.5in off the right edge of every slide — survived because the
// render path and the check path were different paths, and only one of them
// ever ran.

import { renderDeliverablePptx } from './renderers';
import { inspectDeck, type InspectedDeck } from './deck-inspection';
import { judgeRenderedDeck, type DeckPolicy, type DeckVerdict } from './deck-quality';
import type { RenderableDeliverable } from './types';

export interface ValidatedDeck {
  buffer: Buffer;
  inspection: InspectedDeck;
  verdict: DeckVerdict;
  /**
   * Physical integrity: the deck fits on its own canvas.
   *
   * Separated from the full verdict on purpose. A thin slide is a STORY defect
   * and the section-fallback renderer produces them by construction until the
   * story contract replaces it — blocking downloads on that today would stop
   * work without improving anything. Content the client cannot see is different
   * in kind, and must never be served.
   */
  physicallyIntact: boolean;
  integrityFailures: string[];
}

export async function renderValidatedDeck(
  doc: RenderableDeliverable,
  policy: DeckPolicy = {},
): Promise<ValidatedDeck> {
  const buffer = await renderDeliverablePptx(doc);
  const inspection = await inspectDeck(buffer);
  const verdict = judgeRenderedDeck(inspection, policy);

  const integrityFailures = verdict.findings
    .filter((f) => f.kind === 'off_canvas' || f.kind === 'canvas')
    .map((f) => f.message);

  if (integrityFailures.length > 0) {
    console.error('[renderValidatedDeck] deck failed physical integrity', {
      title: doc.title,
      renderedPptxSlides: verdict.renderedPptxSlides,
      canvas: `${verdict.canvasWidthIn.toFixed(2)}x${verdict.canvasHeightIn.toFixed(2)}in`,
      failures: integrityFailures.slice(0, 5),
    });
  }

  return {
    buffer,
    inspection,
    verdict,
    physicallyIntact: integrityFailures.length === 0,
    integrityFailures,
  };
}
