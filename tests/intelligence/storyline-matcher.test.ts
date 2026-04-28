import {
  buildProgramStorylineContext,
  buildSourceStorylineContext,
  buildTowerStorylineContext,
  matchStorylinePatterns,
} from '@/lib/intelligence/storyline-matcher';

describe('storyline matcher', () => {
  it('matches APX-CDP-2026 P3 Design to CDP pattern chips', () => {
    const matches = matchStorylinePatterns(
      buildProgramStorylineContext({
        programId: 'apx-cdp-2026',
        displayId: 'APX-CDP-2026',
        name: 'Apex Retail CDP Activation',
        phaseLabel: 'P3 Design',
      }),
    );

    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.map((match) => match.id)).toContain('PAT-CDP-001');
    expect(matches.every((match) => match.href.startsWith('/patterns/'))).toBe(true);
  });

  it('matches Source BAFO context to sourcing and CDP evidence patterns', () => {
    const matches = matchStorylinePatterns(buildSourceStorylineContext(), { limit: 5 });
    const ids = matches.map((match) => match.id);

    expect(ids).toContain('PAT-SRC-010');
    expect(matches.some((match) => match.domain === 'cdp')).toBe(true);
  });

  it('matches Tower program scope without a permanent panel requirement', () => {
    const matches = matchStorylinePatterns(buildTowerStorylineContext());

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toEqual(
      expect.objectContaining({
        href: expect.stringMatching(/^\/patterns\//),
        matchReason: expect.any(String),
      }),
    );
  });

  it('does not emit false positives for unrelated contexts', () => {
    const matches = matchStorylinePatterns(
      {
        surface: 'programs',
        id: 'GENERIC',
        title: 'Facilities maintenance renewal',
        phase: 'Archive',
        domainTags: ['facilities', 'lease', 'maintenance'],
        workflowTags: ['parking', 'janitorial'],
      },
      { minScore: 4 },
    );

    expect(matches).toEqual([]);
  });
});
