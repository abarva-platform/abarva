// Deck length — an enforced contract, not advice.
//
// Slide counts previously lived as prose inside `lengthGuidance` ("8–12 slides;
// board-grade"), which nothing read and nothing checked. Two of nine deck
// profiles mentioned slides at all; the rest said "pages".
//
// The CEILING matters more than the floor. An eleven-slide board deck is the
// product. A thirty-slide one is a document with page breaks, and it fails in
// the room rather than in the pipeline — which is exactly the failure this
// codebase cannot otherwise detect.

import type { DeliverableKey } from '@/lib/deliverables/profiles/types';

export interface SlideBand {
  min: number;
  max: number;
  /** What the deck is for, in the room. Drives the governing-message discipline. */
  purpose: string;
}

/**
 * One band per phase-level executive deck.
 *
 * Absent from this map means "not a deck" — those deliverables are documents
 * and are governed by the section/word bars instead. Do not add an entry to
 * make a document pass a deck check.
 */
export const SLIDE_BANDS: Partial<Record<DeliverableKey, SlideBand>> = {
  // charter — DELIBERATELY ABSENT.
  //
  // Charter is DOCX-primary. I added a mandatory 8-10 slide band on the
  // reasoning that every phase should have a deck; the earlier decision was
  // explicit and better. A charter deck is an OPTIONAL executive decision
  // projection, requested or configured — not an obligation created by the
  // phase existing, and not nine document headings placed on nine slides.
  //
  // When it is enabled it gets its own story contract, not the section
  // fallback. Absence here means "not a deck", which is exactly right.
  // "what it costs" presumed cost is evidenced, and on a real Move it was not:
  // 231 governed vendor records carried 3 contract values, and the enterprise
  // budget lines were not that programme's cost. A framing that assumes a figure
  // exists pushes the artifact to produce one.
  discovery_report: {
    min: 10,
    max: 14,
    purpose:
      'P2 — what is true today, what is evidenced, what remains uncertain, and what must close before the next decision',
  },
  root_cause_worksheet: { min: 6, max: 10, purpose: 'P2 — why it is true' },
  solution_approach_options: { min: 8, max: 12, purpose: 'P3 — the options and the rejected ones' },
  target_state_architecture: { min: 10, max: 16, purpose: 'P3 — the design and its control points' },
  solution_design: { min: 10, max: 16, purpose: 'P3 — how it is built' },
  operating_model_design: { min: 8, max: 12, purpose: 'P3 — who runs it afterwards' },
  execution_roadmap: { min: 8, max: 14, purpose: 'P4 — sequence, waves, dependencies' },
  business_case: { min: 10, max: 14, purpose: 'P4 — the economics and what must hold' },
  handoff_package: { min: 8, max: 12, purpose: 'P5 — the decision and the handover' },
  value_measurement_contract: { min: 6, max: 10, purpose: 'P5 — how value gets counted' },
  source_atlas_decision_brief: { min: 6, max: 12, purpose: 'Source — the sourcing decision and its leverage' },
};

export type SlideVerdict =
  | { ok: true; slides: number }
  | { ok: false; slides: number; reason: 'too_few' | 'too_many'; band: SlideBand; message: string };

/**
 * Judge a rendered deck against its band.
 *
 * Returns ok for a deliverable with no band — absence means "not a deck", and a
 * document must not be failed by a check that does not apply to it. A deck whose
 * profile forgot its band is caught by `deckProfilesHaveBands` instead, so the
 * two gaps stay distinguishable.
 */
export function judgeSlideCount(key: DeliverableKey, slides: number): SlideVerdict {
  const band = SLIDE_BANDS[key];
  if (!band) return { ok: true, slides };
  if (slides < band.min) {
    return {
      ok: false, slides, reason: 'too_few', band,
      message: `${slides} slides; ${band.purpose} needs at least ${band.min}. A deck this short is usually a section list, not an argument.`,
    };
  }
  if (slides > band.max) {
    return {
      ok: false, slides, reason: 'too_many', band,
      message: `${slides} slides against a ceiling of ${band.max}. ${band.purpose}. Past the ceiling an executive deck stops being read and starts being skimmed — cut, or move the detail to the document companion.`,
    };
  }
  return { ok: true, slides };
}

/** Every deliverable whose renderer produces a deck must declare a band. */
export function deckProfilesMissingBands(
  deckKeys: readonly DeliverableKey[],
): DeliverableKey[] {
  return deckKeys.filter((k) => !SLIDE_BANDS[k]);
}
