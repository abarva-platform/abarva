import "server-only";

// Render a deck and inspect what was rendered, in one call.
//
// Nothing may serve a PPTX without this having looked at it. The canvas defect
// — every shape 2.5in off the right edge of every slide — survived because the
// render path and the check path were different paths, and only one of them
// ever ran.

import { renderDeliverablePptx } from "./renderers";
import { inspectDeck, type InspectedDeck } from "./deck-inspection";
import {
  judgeRenderedDeck,
  type DeckPolicy,
  type DeckVerdict,
} from "./deck-quality";
import type { RenderableDeliverable } from "./types";
import type { ArchitectureModel } from "@/lib/visual-system/architecture-model";

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
  usedSectionFallback: boolean;
}

export async function renderValidatedDeck(
  doc: RenderableDeliverable,
  policy: DeckPolicy = {},
  architectureModel?: ArchitectureModel,
): Promise<ValidatedDeck> {
  const renderAndJudge = async (candidate: RenderableDeliverable) => {
    const buffer = await renderDeliverablePptx(candidate, architectureModel);
    const inspection = await inspectDeck(buffer);
    return {
      buffer,
      inspection,
      verdict: judgeRenderedDeck(inspection, policy),
    };
  };

  let rendered = await renderAndJudge(doc);
  let usedSectionFallback = false;
  const hasThinAuthoredSlides = rendered.verdict.findings.some(
    (finding) => finding.kind === "thin_slide",
  );
  const hasSubstantiveSections = doc.generatedSections.some(
    (section) => section.bodyMarkdown.trim().length > 0,
  );

  if (
    (doc.deckSlides?.length ?? 0) > 0 &&
    hasThinAuthoredSlides &&
    hasSubstantiveSections
  ) {
    const fallback = await renderAndJudge({ ...doc, deckSlides: [] });
    const initialThinCount = rendered.verdict.findings.filter(
      (finding) => finding.kind === "thin_slide",
    ).length;
    const fallbackThinCount = fallback.verdict.findings.filter(
      (finding) => finding.kind === "thin_slide",
    ).length;
    if (fallback.verdict.ok || fallbackThinCount < initialThinCount) {
      rendered = fallback;
      usedSectionFallback = true;
    }
  }

  const { buffer, inspection, verdict } = rendered;

  const integrityFailures = verdict.findings
    .filter((f) => f.kind === "off_canvas" || f.kind === "canvas")
    .map((f) => f.message);

  if (integrityFailures.length > 0) {
    console.error("[renderValidatedDeck] deck failed physical integrity", {
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
    usedSectionFallback,
  };
}
