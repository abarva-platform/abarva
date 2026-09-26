/**
 * The deterministic gate between the story-plan call and the code call.
 *
 * Spending a 56k-token code call on a plan that was already going to fail is the
 * expensive version of this mistake; shipping a deck built from one is the
 * dangerous version. Everything checkable without a model is checked here.
 *
 * What this gate CANNOT do is judge whether the narrative preserves meaning.
 * Deterministic string matching does not establish prose lineage, and a gate
 * that claimed to would be worse than one that says where it stops: traceability
 * is mechanical (every slide names its sources), meaning is the reviewer's.
 */

import type { LedgerEntry, DerivedFigure } from './number-ledger';
import type { PresentationPacket, SlideStoryPlanEntry } from './presentation-packet';

export type PlanFinding =
  | { kind: 'slide_count'; message: string }
  | { kind: 'unknown_figure'; slide: string; figureId: string; message: string }
  | { kind: 'unknown_fact'; slide: string; factId: string; message: string }
  | { kind: 'untraceable_slide'; slide: string; message: string }
  | { kind: 'bad_derivation'; label: string; message: string }
  | { kind: 'missing_beat'; beat: string; message: string }
  | { kind: 'prohibited_term'; slide: string; term: string; message: string }
  | { kind: 'empty_intent'; slide: string; message: string }
  | { kind: 'duplicate_slide_id'; slide: string; message: string };

export interface PlanVerdict {
  ok: boolean;
  slideCount: number;
  coreSlides: number;
  appendixSlides: number;
  findings: PlanFinding[];
}

export interface PlanGateOptions {
  packet: PresentationPacket;
  ledger: LedgerEntry[];
  /** Cover names are canonical; a real identity in a plan is a disclosure defect. */
  prohibitedTerms?: string[];
  /** Beats the artifact type must carry. Absent means the deck is not the artifact. */
  requiredBeats?: { beat: string; test: (plan: SlideStoryPlanEntry[]) => boolean }[];
}

const APPROVAL = /\b(approve|approval|endorse|authoris|authoriz|fund|decision|ask|commit)\w*/i;

export function defaultRequiredBeats(): NonNullable<PlanGateOptions['requiredBeats']> {
  return [
    {
      beat: 'decision ask',
      // Somewhere the deck must actually ask for the decision. A deck that only
      // describes is a briefing, and this artifact type is not a briefing.
      test: (plan) =>
        plan.some(
          (s) =>
            s.designation === 'core' &&
            (APPROVAL.test(s.title) || APPROVAL.test(s.purpose) || APPROVAL.test(s.decisionContribution)),
        ),
    },
    {
      beat: 'opening',
      test: (plan) => plan.length > 0 && plan[0].slideType === 'cover',
    },
    {
      beat: 'core content',
      test: (plan) => plan.filter((s) => s.designation === 'core' && s.slideType === 'content').length >= 5,
    },
  ];
}

function checkDerivation(d: DerivedFigure, ledger: LedgerEntry[]): number | null {
  const parts = d.fromFigureIds.map((id) => ledger.find((e) => e.figureId === id));
  if (parts.some((p) => !p)) return null;
  const values = (parts as LedgerEntry[]).map((p) => p.value);
  switch (d.operation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'difference':
      return values.slice(1).reduce((a, b) => a - b, values[0] ?? 0);
    case 'percent_of':
      return values.length === 2 && values[1] !== 0 ? (values[0] / values[1]) * 100 : null;
  }
}

export function validateSlideStoryPlan(
  plan: SlideStoryPlanEntry[],
  derived: DerivedFigure[],
  opts: PlanGateOptions,
): PlanVerdict {
  const { packet, ledger } = opts;
  const findings: PlanFinding[] = [];

  const figureIds = new Set(ledger.map((f) => f.figureId));
  // A plan may point at a narrative section, a table, an exhibit, or one of the
  // packet-level fields. Anything else is a reference to something the composer
  // was never given, which is where invented content enters.
  const factIds = new Set<string>([
    ...packet.sections.map((s) => s.factId),
    ...packet.tables.map((t) => t.key),
    ...packet.exhibits.map((e) => e.key),
    'recommendation',
    'next_actions',
    'decision',
    'sources',
    'assumptions',
  ]);

  const { min, max } = packet.slideGuidance;
  if (plan.length < min || plan.length > max) {
    findings.push({
      kind: 'slide_count',
      message: `plan has ${plan.length} slides; policy for this artifact is ${min}–${max}`,
    });
  }

  const seenIds = new Set<string>();
  for (const slide of plan) {
    const id = slide.slideId || slide.title.slice(0, 40);
    if (seenIds.has(id)) {
      findings.push({ kind: 'duplicate_slide_id', slide: id, message: `slideId ${id} appears twice` });
    }
    seenIds.add(id);

    for (const f of slide.figureIds ?? []) {
      if (!figureIds.has(f)) {
        findings.push({
          kind: 'unknown_figure',
          slide: id,
          figureId: f,
          message: `slide ${id} claims figure ${f}, which is not in the ledger`,
        });
      }
    }
    for (const f of slide.sourceFactIds ?? []) {
      if (!factIds.has(f)) {
        findings.push({
          kind: 'unknown_fact',
          slide: id,
          factId: f,
          message: `slide ${id} cites source ${f}, which is not in the frozen packet`,
        });
      }
    }
    if (slide.slideType === 'content' && !(slide.sourceFactIds?.length || slide.figureIds?.length)) {
      findings.push({
        kind: 'untraceable_slide',
        slide: id,
        message: `content slide ${id} names no governed source and no figure`,
      });
    }
    if (slide.slideType !== 'divider' && !slide.visualIntent?.trim()) {
      findings.push({
        kind: 'empty_intent',
        slide: id,
        message: `slide ${id} declares no visual intent, so the code call has nothing to compose against`,
      });
    }
    for (const term of opts.prohibitedTerms ?? []) {
      const haystack = `${slide.title} ${slide.purpose} ${slide.visualIntent}`.toLowerCase();
      if (haystack.includes(term.toLowerCase())) {
        findings.push({
          kind: 'prohibited_term',
          slide: id,
          term,
          message: `slide ${id} carries a prohibited term`,
        });
      }
    }
  }

  for (const d of derived) {
    const expected = checkDerivation(d, ledger);
    if (expected === null) {
      findings.push({
        kind: 'bad_derivation',
        label: d.label,
        message: `derived figure "${d.label}" names a figureId that is not in the ledger`,
      });
    } else if (Math.abs(expected - d.value) > Math.max(1, Math.abs(expected) * 0.005)) {
      findings.push({
        kind: 'bad_derivation',
        label: d.label,
        message: `derived figure "${d.label}" declares ${d.value} but ${d.operation} over its inputs gives ${expected}`,
      });
    }
  }

  for (const { beat, test } of opts.requiredBeats ?? defaultRequiredBeats()) {
    if (!test(plan)) {
      findings.push({ kind: 'missing_beat', beat, message: `the plan carries no ${beat}` });
    }
  }

  return {
    ok: findings.length === 0,
    slideCount: plan.length,
    coreSlides: plan.filter((s) => s.designation === 'core').length,
    appendixSlides: plan.filter((s) => s.designation === 'appendix').length,
    findings,
  };
}

/**
 * The narrowed context for the code call.
 *
 * The code call must not be handed the whole evidence universe again. It is not
 * deciding the story — that is settled — and re-showing it every governed fact
 * invites it to reach for one the plan never allocated. It gets the plan, the
 * facts each slide was allocated, and nothing else.
 */
export function narrowPacketForCode(
  plan: SlideStoryPlanEntry[],
  packet: PresentationPacket,
  ledger: LedgerEntry[],
): {
  sections: PresentationPacket['sections'];
  tables: PresentationPacket['tables'];
  exhibits: PresentationPacket['exhibits'];
  figures: LedgerEntry[];
  droppedSections: number;
  droppedFigures: number;
} {
  const wantedFacts = new Set(plan.flatMap((s) => s.sourceFactIds ?? []));
  const wantedFigures = new Set(plan.flatMap((s) => s.figureIds ?? []));

  const sections = packet.sections.filter((s) => wantedFacts.has(s.factId));
  const tables = packet.tables.filter((t) => wantedFacts.has(t.key));
  const exhibits = packet.exhibits.filter((e) => wantedFacts.has(e.key));
  const figures = ledger.filter((f) => wantedFigures.has(f.figureId));

  return {
    sections,
    tables,
    exhibits,
    figures,
    droppedSections: packet.sections.length - sections.length,
    droppedFigures: ledger.length - figures.length,
  };
}
