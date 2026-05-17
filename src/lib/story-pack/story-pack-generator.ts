// Wave 5, Slice 5.5 — Investor / CXO story pack generator.
//
// Tower's Slice 3.5 board pack answers "what does the board need to
// ratify this quarter?". This module answers a different question, for
// a different reader: "show me, in five minutes, that AbarVa does not
// stop at insight — that it shaped, sourced, governed, and learned from
// one real decision." The reader is a non-technical investor or a CXO
// evaluating the product, not an operator inside it.
//
// The artifact is a board-style walkthrough of the North-Star loop for
// ONE tenant decision:
//
//   Context Layer
//     -> Intelligence identifies and pressure-tests the bet
//     -> Moves shapes it into a governed initiative
//     -> Source determines the commercial / partner / vendor path
//     -> Tower tracks value, risk, adoption, and outcomes
//     -> Outcome evidence feeds the context layer and pattern graph
//
// This module is a PURE composition. Its single input is a typed
// `LoopDecisionInput` — a structured description of one decision's
// journey through the five surfaces, exactly as a scenario doc such as
// `SCENARIO-APEX-CONTACT-CENTER.md` lays it out. It performs NO I/O,
// holds NO clock and NO randomness: given the same input it returns a
// byte-identical pack, so the golden snapshot test is stable.
//
// No-fabrication contract:
//
//   - The pack never invents a stage. A stage the caller did not
//     supply is rendered as an explicit "not yet reached" gap, never as
//     silent omission — an investor must never mistake a missing stage
//     for a complete loop.
//   - Every value figure traces to the Tower stage the caller passed
//     in. Projected and verified value are reported separately; the
//     pack never promotes projected value into verified.
//   - The loop is only described as "closed" when an outcome stage is
//     present AND it reports evidence written back to the context
//     layer. Otherwise the pack says the loop is still in flight.
//
// This module deliberately depends on NOTHING else in the codebase —
// no Tower, Source, or Moves imports — so it is safe to compose and
// test in isolation.

// ---------------------------------------------------------------------
// Input contract — one decision's journey through the loop
// ---------------------------------------------------------------------

/** The five surfaces of the North-Star loop, in journey order. */
export type LoopStageKey =
  | 'context'
  | 'intelligence'
  | 'move'
  | 'source'
  | 'tower'
  | 'outcome';

/** The fronting agent for each surface (brand-level, not specialist). */
export type LoopAgent = 'Steward' | 'Sentinel' | 'Nexus' | 'Atlas';

/**
 * One stage of the loop as the caller observed it. Every stage shares
 * this shape; stage-specific colour lives in `expertJudgment` and
 * `artifact`, which are plain prose so the pack reads as a narrative.
 */
export interface LoopStageInput {
  /** Which surface this stage describes. */
  readonly stage: LoopStageKey;
  /** Fronting agent for the surface. */
  readonly agent: LoopAgent;
  /** Plain-language headline — what happened at this stage. */
  readonly summary: string;
  /** The expert judgment the agent applied — the "why this, why now". */
  readonly expertJudgment: string;
  /** The concrete artifact or decision the stage produced. */
  readonly artifact: string;
  /** Tenant context / evidence the stage drew on. */
  readonly evidenceDrawnOn: readonly string[];
}

/** Value figures the Tower stage tracked for the decision. USD-seed. */
export interface LoopValueInput {
  /** Projected value committed when the initiative was shaped. */
  readonly projectedAmount: number;
  /**
   * Value verified by outcome telemetry. Null when the pilot has not
   * yet produced a verified reading — never assume zero is the same as
   * "not yet measured".
   */
  readonly verifiedAmount: number | null;
  /** What the value represents, e.g. "contact-centre cost-to-serve". */
  readonly valueDescription: string;
}

/**
 * One decision's full journey, as a scenario doc lays it out. This is
 * the sole input to the generator.
 */
export interface LoopDecisionInput {
  /** Tenant the decision belongs to, e.g. `apexretail`. */
  readonly tenantClientKey: string;
  /** Human tenant name, e.g. "Apex Retail Group". */
  readonly tenantName: string;
  /** The decision in one line, e.g. "Contact Centre AI Routing". */
  readonly decisionTitle: string;
  /** The decision archetype, e.g. "Workforce / contact-centre AI". */
  readonly decisionArchetype: string;
  /**
   * The loop stages the caller observed. Order is not significant —
   * the generator sorts into canonical journey order. Stages may be
   * omitted; omitted stages surface as explicit gaps.
   */
  readonly stages: readonly LoopStageInput[];
  /** Tower value tracking for the decision. Null if Tower not reached. */
  readonly value: LoopValueInput | null;
  /**
   * True when verified outcome evidence has been written back to the
   * context layer — the signal that the loop is genuinely closed.
   */
  readonly evidenceFedBackToContext: boolean;
}

// ---------------------------------------------------------------------
// Output pack shapes
// ---------------------------------------------------------------------

/** A single chapter of the walkthrough — one surface in the loop. */
export interface StoryChapter {
  /** Stable id of the form `chapter-{stage}`. */
  readonly id: string;
  /** Surface this chapter covers. */
  readonly stage: LoopStageKey;
  /** 1-based position in the journey (1 = Context .. 6 = Outcome). */
  readonly order: number;
  /** Display title, e.g. "Intelligence — pressure-test the bet". */
  readonly title: string;
  /** Fronting agent, or null when the stage was not reached. */
  readonly agent: LoopAgent | null;
  /** Narrative prose for the chapter. */
  readonly narrative: string;
  /** The expert judgment applied — empty when the stage is a gap. */
  readonly expertJudgment: string;
  /** The artifact produced — empty when the stage is a gap. */
  readonly artifact: string;
  /** Evidence the stage drew on. */
  readonly evidenceDrawnOn: readonly string[];
  /** True when the caller did not supply this stage. */
  readonly isGap: boolean;
}

/** The value story — projected vs verified, told without inflation. */
export interface StoryValueSummary {
  /** Projected value committed when the initiative was shaped. */
  readonly projectedAmount: number;
  /** Verified value, or null when not yet measured. */
  readonly verifiedAmount: number | null;
  /** Realized share of projected value, 0..1, or null when uncomputable. */
  readonly realizationRatio: number | null;
  /** Plain-English value line for the pack. */
  readonly headline: string;
}

/** The assembled investor / CXO story pack. */
export interface StoryPack {
  readonly tenantClientKey: string;
  readonly tenantName: string;
  readonly decisionTitle: string;
  readonly decisionArchetype: string;
  /** One-line framing for the top of the pack. */
  readonly headline: string;
  /** The five-minute thesis — what the walkthrough proves. */
  readonly thesis: string;
  /** The six loop chapters, always in canonical journey order. */
  readonly chapters: readonly StoryChapter[];
  /** The projected-vs-verified value story. */
  readonly valueSummary: StoryValueSummary;
  /** True when every loop stage was supplied and the loop is closed. */
  readonly loopClosed: boolean;
  /** Count of loop stages the caller did not supply. */
  readonly stageGapCount: number;
  /** Honesty disclaimer — the pack is a deterministic composition. */
  readonly disclaimer: string;
  /** Provenance marker. */
  readonly deterministicSeed: true;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

/** Canonical journey order — drives chapter ordering and gap detection. */
const STAGE_ORDER: readonly LoopStageKey[] = [
  'context',
  'intelligence',
  'move',
  'source',
  'tower',
  'outcome',
];

/** Display titles per stage — kept here so chapters read consistently. */
const STAGE_TITLES: Record<LoopStageKey, string> = {
  context: 'Context Layer — what the tenant already knows',
  intelligence: 'Intelligence — identify and pressure-test the bet',
  move: 'Moves — shape it into a governed initiative',
  source: 'Source — choose the commercial / partner / vendor path',
  tower: 'Tower — track value, risk, adoption, and outcomes',
  outcome: 'Outcome — evidence feeds back to the context layer',
};

/** Default fronting agent per stage, used only for gap-chapter copy. */
const STAGE_GAP_AGENT: Record<LoopStageKey, string> = {
  context: 'Steward',
  intelligence: 'Sentinel',
  move: 'Nexus',
  source: 'Sentinel',
  tower: 'Atlas',
  outcome: 'Atlas',
};

const PACK_DISCLAIMER =
  'Deterministic composition · This story pack is assembled purely from a typed ' +
  'description of one tenant decision as it moved through the AbarVa loop. It ' +
  'introduces no new figures and invents no stages — a stage not supplied is shown ' +
  'as an explicit gap, and projected value is never reported as verified.';

// ---------------------------------------------------------------------
// Formatting helpers (pure)
// ---------------------------------------------------------------------

function formatUsd(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

// ---------------------------------------------------------------------
// Section builders (pure)
// ---------------------------------------------------------------------

/**
 * Build the six loop chapters in canonical journey order. Stages the
 * caller supplied become narrative chapters; stages they omitted become
 * explicit gap chapters so an investor never mistakes a missing surface
 * for a complete loop.
 */
export function buildStoryChapters(
  input: LoopDecisionInput,
): readonly StoryChapter[] {
  const supplied = new Map<LoopStageKey, LoopStageInput>();
  for (const stage of input.stages) {
    // First occurrence wins — deterministic when a caller double-supplies.
    if (!supplied.has(stage.stage)) {
      supplied.set(stage.stage, stage);
    }
  }

  return STAGE_ORDER.map((stageKey, index) => {
    const order = index + 1;
    const title = STAGE_TITLES[stageKey];
    const observed = supplied.get(stageKey);

    if (!observed) {
      return {
        id: `chapter-${stageKey}`,
        stage: stageKey,
        order,
        title,
        agent: null,
        narrative:
          `This decision has not yet reached the ${stageKey} stage. ` +
          `${STAGE_GAP_AGENT[stageKey]} would front this surface; the loop ` +
          'is incomplete until the stage is recorded.',
        expertJudgment: '',
        artifact: '',
        evidenceDrawnOn: [],
        isGap: true,
      };
    }

    return {
      id: `chapter-${stageKey}`,
      stage: stageKey,
      order,
      title,
      agent: observed.agent,
      narrative: observed.summary,
      expertJudgment: observed.expertJudgment,
      artifact: observed.artifact,
      evidenceDrawnOn: observed.evidenceDrawnOn,
      isGap: false,
    };
  });
}

/**
 * Build the projected-vs-verified value story. Realization ratio is
 * verified / projected, only computed when both a non-null verified
 * figure and a positive projected figure exist — projected value is
 * never silently treated as earned.
 */
export function buildStoryValueSummary(
  value: LoopValueInput | null,
): StoryValueSummary {
  if (!value) {
    return {
      projectedAmount: 0,
      verifiedAmount: null,
      realizationRatio: null,
      headline:
        'This decision has not yet reached Tower — no projected or verified ' +
        'value is tracked.',
    };
  }

  const realizationRatio =
    value.verifiedAmount !== null && value.projectedAmount > 0
      ? value.verifiedAmount / value.projectedAmount
      : null;

  let headline: string;
  if (value.verifiedAmount === null) {
    headline =
      `${formatUsd(value.projectedAmount)} of projected ${value.valueDescription} ` +
      'is committed; pilot telemetry has not yet produced a verified reading.';
  } else if (realizationRatio === null) {
    headline =
      `${formatUsd(value.verifiedAmount)} of verified ${value.valueDescription} ` +
      'is recorded; no projected baseline exists to compute a realization ratio.';
  } else {
    headline =
      `${formatUsd(value.verifiedAmount)} of ${formatUsd(value.projectedAmount)} ` +
      `projected ${value.valueDescription} is verified by outcome telemetry — ` +
      `${formatPercent(realizationRatio)} realized.`;
  }

  return {
    projectedAmount: value.projectedAmount,
    verifiedAmount: value.verifiedAmount,
    realizationRatio,
    headline,
  };
}

/**
 * The five-minute thesis line — what the assembled walkthrough proves.
 * It states plainly whether the loop is closed, so a non-technical
 * reader gets the verdict before the chapters.
 */
export function buildStoryThesis(
  input: LoopDecisionInput,
  chapters: readonly StoryChapter[],
  loopClosed: boolean,
): string {
  const reached = chapters.filter((c) => !c.isGap).length;

  if (loopClosed) {
    return (
      `In five minutes this pack shows that AbarVa did not stop at insight on ` +
      `"${input.decisionTitle}" for ${input.tenantName}: it pressure-tested the ` +
      'bet, shaped a governed initiative, chose a commercial path, tracked the ' +
      'outcome, and fed verified evidence back into the context layer — one ' +
      'closed loop, end to end.'
    );
  }

  return (
    `This pack walks "${input.decisionTitle}" for ${input.tenantName} through ` +
    `${reached} of ${STAGE_ORDER.length} loop stages. The loop is still in ` +
    'flight: the remaining stages are shown as explicit gaps, not omitted, so ' +
    'the in-progress state is legible rather than hidden.'
  );
}

// ---------------------------------------------------------------------
// Pack composer
// ---------------------------------------------------------------------

/**
 * Compose the investor / CXO story pack from one decision's loop
 * journey.
 *
 * Pure and deterministic: given the same `LoopDecisionInput` this
 * returns a byte-identical pack. No clock, no randomness, no I/O.
 *
 * The loop is reported as "closed" only when all six stages were
 * supplied AND `evidenceFedBackToContext` is true — the structural
 * signal that the outcome genuinely re-grounded the context layer.
 *
 * @param input One decision's journey through the North-Star loop.
 */
export function buildStoryPack(input: LoopDecisionInput): StoryPack {
  const chapters = buildStoryChapters(input);
  const valueSummary = buildStoryValueSummary(input.value);

  const stageGapCount = chapters.filter((c) => c.isGap).length;
  const allStagesPresent = stageGapCount === 0;
  const loopClosed = allStagesPresent && input.evidenceFedBackToContext;

  const thesis = buildStoryThesis(input, chapters, loopClosed);

  const loopClause = loopClosed
    ? 'the loop is closed end to end'
    : stageGapCount > 0
      ? `${stageGapCount} loop stage${stageGapCount === 1 ? '' : 's'} not yet reached`
      : 'the loop is in flight — outcome evidence not yet fed back to context';

  const headline =
    `Story pack · ${input.tenantName} · "${input.decisionTitle}" ` +
    `(${input.decisionArchetype}) — ${loopClause}; ${valueSummary.headline}`;

  return {
    tenantClientKey: input.tenantClientKey,
    tenantName: input.tenantName,
    decisionTitle: input.decisionTitle,
    decisionArchetype: input.decisionArchetype,
    headline,
    thesis,
    chapters,
    valueSummary,
    loopClosed,
    stageGapCount,
    disclaimer: PACK_DISCLAIMER,
    deterministicSeed: true,
  };
}
