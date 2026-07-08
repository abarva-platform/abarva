import { buildFeedForwardPack, type FeedForwardSignals } from '../feed-forward';

const p2Signals: FeedForwardSignals = {
  whereToStart: 'Start with data governance.',
  maturity: [
    { label: 'Data Architecture', score: 3 },
    { label: 'Analytics & AI', score: null },
  ],
  gaps: [
    { capability: 'Golden-record mastering', severity: 'medium' },
    { capability: 'Data ownership model', severity: 'foundational' },
    { capability: 'Model monitoring', severity: 'high' },
  ],
  hardGaps: ['System of record unconfirmed'],
  softGaps: ['Data owner not named'],
  coverageScore: 62,
  missingEvidence: ['Baseline metrics', 'Process detail'],
  openGateCriteria: ['Current-state approved'],
  controlConstraints: ['Attorney approval for non-standard terms'],
};

const titles = (fromPhase: number, next: string, s: FeedForwardSignals) =>
  buildFeedForwardPack(fromPhase, next, s).sections.map((x) => x.title);

describe('buildFeedForwardPack — transition-aware, deterministic, honest', () => {
  it('P2 → P3: design inputs / evidence gaps / risks / recommended focus, from real state', () => {
    const p = buildFeedForwardPack(2, 'P3 Choose the Approach', p2Signals);
    expect(p.headline).toBe('Prepared for P3 Choose the Approach');
    expect(titles(2, 'P3 Choose the Approach', p2Signals)).toEqual([
      'Design inputs',
      'Evidence gaps',
      'Risks to consider',
      'Recommended P3 Choose the Approach focus',
    ]);
    const design = p.sections.find((s) => s.title === 'Design inputs')!;
    expect(design.status).toBe('ready');
    // gaps ordered most-severe first, then readiness constraints, then controls
    expect(design.items[0]).toBe('Data ownership model');
    expect(design.items).toContain('System of record unconfirmed');
    expect(design.items).toContain('Attorney approval for non-standard terms');
    const evidence = p.sections.find((s) => s.title === 'Evidence gaps')!;
    expect(evidence.items).toEqual(expect.arrayContaining(['Baseline metrics', 'Data owner not named']));
    const risks = p.sections.find((s) => s.title === 'Risks to consider')!;
    expect(risks.items).toContain('Do not over-automate high-control decisions');
    expect(p.isBlank).toBe(false);
  });

  it('P3 → P4: selected approach / workstreams / constraints / focus', () => {
    const p = buildFeedForwardPack(3, 'P4 Build the Plan', {
      selectedApproach: 'CLM-embedded assisted triage (Option B)',
      workstreams: ['Intake redesign', 'Metadata remediation'],
      controlConstraints: ['Audit trail'],
      hardGaps: [],
    });
    expect(titles(3, 'P4 Build the Plan', { selectedApproach: 'x' })).toEqual([
      'Selected approach',
      'Workstream candidates',
      'Constraints & controls',
      'Recommended P4 Build the Plan focus',
    ]);
    expect(p.sections.find((s) => s.title === 'Selected approach')!.items).toEqual([
      'CLM-embedded assisted triage (Option B)',
    ]);
    expect(p.sections.find((s) => s.title === 'Workstream candidates')!.items).toContain('Intake redesign');
  });

  it('P4 → P5: workstreams & owners / launch readiness / risks / focus', () => {
    expect(titles(4, 'P5 Prepare to Execute', { workstreams: ['A'] })).toEqual([
      'Workstreams & owners',
      'Launch readiness',
      'Risks to consider',
      'Recommended P5 Prepare to Execute focus',
    ]);
  });

  it('P5 → Tower: metrics / owners / risks / focus', () => {
    const p = buildFeedForwardPack(5, 'Tower Track Outcomes', { metrics: ['Cycle time'] });
    expect(titles(5, 'Tower Track Outcomes', { metrics: ['Cycle time'] })).toEqual([
      'Metrics to track',
      'Metric owners',
      'Risks to consider',
      'Recommended Tower Track Outcomes focus',
    ]);
    expect(p.sections.find((s) => s.title === 'Metrics to track')!.items).toEqual(['Cycle time']);
    // the standing Tower risk is always present (deterministic guidance, not a claim)
    expect(p.sections.find((s) => s.title === 'Risks to consider')!.items[0]).toMatch(/overclaim/i);
  });

  it('missing signals surface as "Needs confirmation", never fabricated', () => {
    const p = buildFeedForwardPack(3, 'P4', {}); // no selected approach, no workstreams
    const approach = p.sections.find((s) => s.title === 'Selected approach')!;
    expect(approach.status).toBe('needs_confirmation');
    expect(approach.items).toEqual([]);
    expect(approach.emptyLabel).toBe('Needs confirmation');
  });

  it('isBlank when no section has data and there are no open questions', () => {
    const p = buildFeedForwardPack(2, 'P3', {});
    // P2 always has the deterministic "recommended focus" line → not blank
    expect(p.sections.find((s) => s.title.startsWith('Recommended'))!.items.length).toBe(1);
    expect(p.isBlank).toBe(false);
  });
});
