import {
  validateSlideStoryPlan,
  narrowPacketForCode,
  defaultRequiredBeats,
} from '../plan-gate';
import type { PresentationPacket, SlideStoryPlanEntry } from '../presentation-packet';
import type { LedgerEntry } from '../number-ledger';

const LEDGER: LedgerEntry[] = [
  { figureId: 'F001', value: 100, unit: 'count', label: 'a', formattedVariants: ['100'], sourceRef: 's' },
  { figureId: 'F002', value: 50, unit: 'count', label: 'b', formattedVariants: ['50'], sourceRef: 's' },
];

const PACKET = {
  slideGuidance: { min: 3, max: 8, purpose: 'proof' },
  sections: [
    { factId: 'exec', title: 'Exec', bodyMarkdown: 'body one', citationsUsed: [1] },
    { factId: 'risks', title: 'Risks', bodyMarkdown: 'body two', citationsUsed: [2] },
  ],
  tables: [{ key: 'risk_register', title: 'R', columns: ['a'], rows: [['1']] }],
  exhibits: [{ key: 'roadmap', title: 'RM', kind: 'roadmap', description: 'd' }],
} as unknown as PresentationPacket;

function slide(over: Partial<SlideStoryPlanEntry>): SlideStoryPlanEntry {
  return {
    slideId: 's1',
    title: 'A title',
    purpose: 'a purpose',
    decisionContribution: 'contributes',
    sourceFactIds: ['exec'],
    figureIds: ['F001'],
    visualIntent: 'a grid',
    slideType: 'content',
    designation: 'core',
    ...over,
  };
}

function validPlan(): SlideStoryPlanEntry[] {
  return [
    slide({ slideId: 's0', slideType: 'cover', title: 'Cover', visualIntent: 'title' }),
    slide({ slideId: 's1', title: 'Approve the architecture' }),
    slide({ slideId: 's2', sourceFactIds: ['risks'] }),
    slide({ slideId: 's3', sourceFactIds: ['risk_register'] }),
    slide({ slideId: 's4', sourceFactIds: ['roadmap'] }),
    slide({ slideId: 's5', sourceFactIds: ['recommendation'] }),
  ];
}

const opts = { packet: PACKET, ledger: LEDGER };

describe('slide story plan gate', () => {
  it('passes a plan that is traceable, in band, and carries the decision ask', () => {
    const v = validateSlideStoryPlan(validPlan(), [], opts);
    expect(v.findings).toEqual([]);
    expect(v.ok).toBe(true);
    expect(v.coreSlides).toBe(6);
  });

  it('blocks a figure the ledger does not hold', () => {
    const plan = validPlan();
    plan[2].figureIds = ['F404'];
    const v = validateSlideStoryPlan(plan, [], opts);
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'unknown_figure', figureId: 'F404' }));
  });

  it('blocks a source the frozen packet does not hold', () => {
    const plan = validPlan();
    plan[2].sourceFactIds = ['some_section_we_never_sent'];
    const v = validateSlideStoryPlan(plan, [], opts);
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'unknown_fact' }));
  });

  it('blocks a content slide with no traceable basis', () => {
    const plan = validPlan();
    plan[2].sourceFactIds = [];
    plan[2].figureIds = [];
    const v = validateSlideStoryPlan(plan, [], opts);
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'untraceable_slide' }));
  });

  it('blocks a slide count outside the artifact policy', () => {
    const v = validateSlideStoryPlan(validPlan().slice(0, 2), [], opts);
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'slide_count' }));
  });

  it('blocks a plan with no decision ask', () => {
    // Every slide describes; none asks. That is a briefing, not this artifact.
    const plan = validPlan().map((s) => ({ ...s, title: 'Observation', purpose: 'describes', decisionContribution: 'context' }));
    plan[0].slideType = 'cover';
    const v = validateSlideStoryPlan(plan, [], opts);
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'missing_beat', beat: 'decision ask' }));
  });

  it('recomputes a declared derivation before the code call is paid for', () => {
    const bad = validateSlideStoryPlan(
      validPlan(),
      [{ value: 999, unit: 'count', fromFigureIds: ['F001', 'F002'], operation: 'sum', label: 'wrong' }],
      opts,
    );
    expect(bad.findings).toContainEqual(expect.objectContaining({ kind: 'bad_derivation' }));

    const good = validateSlideStoryPlan(
      validPlan(),
      [{ value: 150, unit: 'count', fromFigureIds: ['F001', 'F002'], operation: 'sum', label: 'right' }],
      opts,
    );
    expect(good.findings.filter((f) => f.kind === 'bad_derivation')).toEqual([]);
  });

  it('blocks a prohibited term appearing in plan prose', () => {
    const plan = validPlan();
    plan[3].title = 'Real Client Holdings selected option B';
    const v = validateSlideStoryPlan(plan, [], { ...opts, prohibitedTerms: ['Real Client Holdings'] });
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'prohibited_term' }));
  });

  it('blocks a duplicate slideId', () => {
    const plan = validPlan();
    plan[3].slideId = plan[2].slideId;
    const v = validateSlideStoryPlan(plan, [], opts);
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'duplicate_slide_id' }));
  });

  it('requires a visual intent, because the code call composes against it', () => {
    const plan = validPlan();
    plan[2].visualIntent = '   ';
    const v = validateSlideStoryPlan(plan, [], opts);
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'empty_intent' }));
  });

  it('exposes the beats it checks so a caller can see what is not checked', () => {
    // The gate does not judge meaning preservation, and this test exists so that
    // stays visible: three mechanical beats, no prose lineage claim.
    expect(defaultRequiredBeats().map((b) => b.beat)).toEqual(['decision ask', 'opening', 'core content']);
  });
});

describe('narrowing the code call context', () => {
  it('passes only the sources and figures the plan allocated', () => {
    const plan = [slide({ sourceFactIds: ['exec'], figureIds: ['F001'] })];
    const narrowed = narrowPacketForCode(plan, PACKET, LEDGER);
    expect(narrowed.sections.map((s) => s.factId)).toEqual(['exec']);
    expect(narrowed.figures.map((f) => f.figureId)).toEqual(['F001']);
    expect(narrowed.droppedSections).toBe(1);
    expect(narrowed.droppedFigures).toBe(1);
  });

  it('drops nothing the plan actually cited across all its slides', () => {
    // The union across slides is what matters; narrowing per slide and losing a
    // source another slide needed would silently starve the code call.
    const plan = [
      slide({ slideId: 'a', sourceFactIds: ['exec'], figureIds: ['F001'] }),
      slide({ slideId: 'b', sourceFactIds: ['risks'], figureIds: ['F002'] }),
    ];
    const narrowed = narrowPacketForCode(plan, PACKET, LEDGER);
    expect(narrowed.sections).toHaveLength(2);
    expect(narrowed.figures).toHaveLength(2);
    expect(narrowed.droppedSections).toBe(0);
  });
});
