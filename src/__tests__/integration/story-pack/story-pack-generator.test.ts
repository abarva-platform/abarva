// Wave 5, Slice 5.5 — Investor / CXO story pack generator unit tests.
//
// Pure. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - `buildStoryPack` composes a six-chapter walkthrough of the
//   North-Star loop from one typed `LoopDecisionInput`.
// - Chapters are always emitted in canonical journey order regardless
//   of the order the caller supplied stages.
// - A stage the caller omits becomes an explicit gap chapter, never a
//   silent omission.
// - The loop is "closed" only when all six stages are present AND
//   outcome evidence was fed back to the context layer.
// - Projected value is never reported as verified; the realization
//   ratio is only computed when both figures are present.
// - The pack is byte-identical across repeated calls (golden snapshot).

import {
  buildStoryPack,
  buildStoryChapters,
  buildStoryValueSummary,
  buildStoryThesis,
  type LoopDecisionInput,
  type LoopStageInput,
} from '@/lib/story-pack/story-pack-generator';

// ---------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------

function stage(
  overrides: Partial<LoopStageInput> & Pick<LoopStageInput, 'stage' | 'agent'>,
): LoopStageInput {
  return {
    summary: `Summary for ${overrides.stage}.`,
    expertJudgment: `Judgment for ${overrides.stage}.`,
    artifact: `Artifact for ${overrides.stage}.`,
    evidenceDrawnOn: [`Evidence for ${overrides.stage}.`],
    ...overrides,
  };
}

/** A fully-walked Apex contact-centre loop, all six stages closed. */
function fullApexInput(
  overrides: Partial<LoopDecisionInput> = {},
): LoopDecisionInput {
  return {
    tenantClientKey: 'apexretail',
    tenantName: 'Apex Retail Group',
    decisionTitle: 'Contact Centre AI Routing',
    decisionArchetype: 'Workforce / contact-centre AI',
    stages: [
      stage({ stage: 'context', agent: 'Steward' }),
      stage({ stage: 'intelligence', agent: 'Sentinel' }),
      stage({ stage: 'move', agent: 'Nexus' }),
      stage({ stage: 'source', agent: 'Sentinel' }),
      stage({ stage: 'tower', agent: 'Atlas' }),
      stage({ stage: 'outcome', agent: 'Atlas' }),
    ],
    value: {
      projectedAmount: 1_000_000,
      verifiedAmount: 250_000,
      valueDescription: 'contact-centre cost-to-serve',
    },
    evidenceFedBackToContext: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------
// buildStoryChapters
// ---------------------------------------------------------------------

describe('buildStoryChapters', () => {
  it('emits six chapters in canonical journey order', () => {
    const chapters = buildStoryChapters(fullApexInput());
    expect(chapters.map((c) => c.stage)).toEqual([
      'context',
      'intelligence',
      'move',
      'source',
      'tower',
      'outcome',
    ]);
    expect(chapters.map((c) => c.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('orders chapters canonically even when stages are supplied shuffled', () => {
    const shuffled = fullApexInput({
      stages: [
        stage({ stage: 'outcome', agent: 'Atlas' }),
        stage({ stage: 'context', agent: 'Steward' }),
        stage({ stage: 'tower', agent: 'Atlas' }),
        stage({ stage: 'intelligence', agent: 'Sentinel' }),
        stage({ stage: 'source', agent: 'Sentinel' }),
        stage({ stage: 'move', agent: 'Nexus' }),
      ],
    });
    expect(buildStoryChapters(shuffled).map((c) => c.stage)).toEqual([
      'context',
      'intelligence',
      'move',
      'source',
      'tower',
      'outcome',
    ]);
  });

  it('renders an omitted stage as an explicit gap chapter', () => {
    const input = fullApexInput({
      stages: [
        stage({ stage: 'context', agent: 'Steward' }),
        stage({ stage: 'intelligence', agent: 'Sentinel' }),
        stage({ stage: 'move', agent: 'Nexus' }),
      ],
    });
    const chapters = buildStoryChapters(input);
    const sourceChapter = chapters.find((c) => c.stage === 'source')!;
    expect(sourceChapter.isGap).toBe(true);
    expect(sourceChapter.agent).toBeNull();
    expect(sourceChapter.artifact).toBe('');
    expect(sourceChapter.expertJudgment).toBe('');
    expect(sourceChapter.narrative).toContain('not yet reached');
  });

  it('carries narrative, judgment, artifact and evidence for supplied stages', () => {
    const chapters = buildStoryChapters(fullApexInput());
    const move = chapters.find((c) => c.stage === 'move')!;
    expect(move.isGap).toBe(false);
    expect(move.agent).toBe('Nexus');
    expect(move.narrative).toBe('Summary for move.');
    expect(move.expertJudgment).toBe('Judgment for move.');
    expect(move.artifact).toBe('Artifact for move.');
    expect(move.evidenceDrawnOn).toEqual(['Evidence for move.']);
  });

  it('is deterministic when a caller double-supplies a stage (first wins)', () => {
    const input = fullApexInput({
      stages: [
        stage({ stage: 'context', agent: 'Steward', summary: 'first' }),
        stage({ stage: 'context', agent: 'Steward', summary: 'second' }),
      ],
    });
    const ctx = buildStoryChapters(input).find((c) => c.stage === 'context')!;
    expect(ctx.narrative).toBe('first');
  });
});

// ---------------------------------------------------------------------
// buildStoryValueSummary
// ---------------------------------------------------------------------

describe('buildStoryValueSummary', () => {
  it('computes the realization ratio from verified over projected', () => {
    const summary = buildStoryValueSummary({
      projectedAmount: 1_000_000,
      verifiedAmount: 250_000,
      valueDescription: 'cost-to-serve',
    });
    expect(summary.realizationRatio).toBeCloseTo(0.25);
    expect(summary.headline).toContain('25% realized');
  });

  it('never reports projected value as verified when verified is null', () => {
    const summary = buildStoryValueSummary({
      projectedAmount: 1_000_000,
      verifiedAmount: null,
      valueDescription: 'cost-to-serve',
    });
    expect(summary.verifiedAmount).toBeNull();
    expect(summary.realizationRatio).toBeNull();
    expect(summary.headline).toContain('not yet produced a verified reading');
  });

  it('returns a null-value summary when Tower was never reached', () => {
    const summary = buildStoryValueSummary(null);
    expect(summary.projectedAmount).toBe(0);
    expect(summary.verifiedAmount).toBeNull();
    expect(summary.realizationRatio).toBeNull();
    expect(summary.headline).toContain('has not yet reached Tower');
  });

  it('does not compute a ratio when projected is zero', () => {
    const summary = buildStoryValueSummary({
      projectedAmount: 0,
      verifiedAmount: 50_000,
      valueDescription: 'cost-to-serve',
    });
    expect(summary.realizationRatio).toBeNull();
    expect(summary.headline).toContain('no projected baseline');
  });
});

// ---------------------------------------------------------------------
// buildStoryThesis
// ---------------------------------------------------------------------

describe('buildStoryThesis', () => {
  it('states a closed loop when every stage is present and loop is closed', () => {
    const input = fullApexInput();
    const chapters = buildStoryChapters(input);
    const thesis = buildStoryThesis(input, chapters, true);
    expect(thesis).toContain('one closed loop, end to end');
  });

  it('reports an in-flight loop with a stage count when not closed', () => {
    const input = fullApexInput({
      stages: [
        stage({ stage: 'context', agent: 'Steward' }),
        stage({ stage: 'intelligence', agent: 'Sentinel' }),
      ],
    });
    const chapters = buildStoryChapters(input);
    const thesis = buildStoryThesis(input, chapters, false);
    expect(thesis).toContain('2 of 6 loop stages');
    expect(thesis).toContain('still in');
  });
});

// ---------------------------------------------------------------------
// buildStoryPack
// ---------------------------------------------------------------------

describe('buildStoryPack', () => {
  it('reports loopClosed when all stages present and evidence fed back', () => {
    const pack = buildStoryPack(fullApexInput());
    expect(pack.loopClosed).toBe(true);
    expect(pack.stageGapCount).toBe(0);
    expect(pack.headline).toContain('the loop is closed end to end');
  });

  it('does not close the loop when a stage is missing', () => {
    const pack = buildStoryPack(
      fullApexInput({
        stages: [
          stage({ stage: 'context', agent: 'Steward' }),
          stage({ stage: 'intelligence', agent: 'Sentinel' }),
          stage({ stage: 'move', agent: 'Nexus' }),
          stage({ stage: 'source', agent: 'Sentinel' }),
          stage({ stage: 'tower', agent: 'Atlas' }),
        ],
      }),
    );
    expect(pack.loopClosed).toBe(false);
    expect(pack.stageGapCount).toBe(1);
    expect(pack.headline).toContain('1 loop stage not yet reached');
  });

  it('does not close the loop when evidence was not fed back to context', () => {
    const pack = buildStoryPack(
      fullApexInput({ evidenceFedBackToContext: false }),
    );
    expect(pack.loopClosed).toBe(false);
    expect(pack.stageGapCount).toBe(0);
    expect(pack.headline).toContain('outcome evidence not yet fed back');
  });

  it('carries tenant and decision identity onto the pack', () => {
    const pack = buildStoryPack(fullApexInput());
    expect(pack.tenantClientKey).toBe('apexretail');
    expect(pack.tenantName).toBe('Apex Retail Group');
    expect(pack.decisionTitle).toBe('Contact Centre AI Routing');
    expect(pack.decisionArchetype).toBe('Workforce / contact-centre AI');
    expect(pack.deterministicSeed).toBe(true);
  });

  it('always carries the deterministic-composition disclaimer', () => {
    const pack = buildStoryPack(fullApexInput());
    expect(pack.disclaimer).toContain('Deterministic composition');
    expect(pack.disclaimer).toContain('invents no stages');
  });

  it('is byte-identical across repeated calls (golden snapshot)', () => {
    const first = buildStoryPack(fullApexInput());
    const second = buildStoryPack(fullApexInput());
    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
  });

  it('produces a pack with no Tower value when Tower is not reached', () => {
    const pack = buildStoryPack(
      fullApexInput({
        stages: [
          stage({ stage: 'context', agent: 'Steward' }),
          stage({ stage: 'intelligence', agent: 'Sentinel' }),
        ],
        value: null,
      }),
    );
    expect(pack.valueSummary.projectedAmount).toBe(0);
    expect(pack.valueSummary.verifiedAmount).toBeNull();
    expect(pack.loopClosed).toBe(false);
  });
});
