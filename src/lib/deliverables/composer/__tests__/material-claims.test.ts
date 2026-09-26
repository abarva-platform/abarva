import { deriveMaterialClaims } from '../material-claims';

describe('deriving the material claims a deck must preserve', () => {
  const claims = deriveMaterialClaims({
    recommendation:
      'Approve the Selective Replatform pattern and fund Horizon 1 at $53M, holding the passenger core until 2028-06-30. Five contracts carry 32.6% of spend.',
    nextActions: [
      'The Architecture Steering Committee ratifies the integration standard by 2026-12-31.',
      'VP Data & AI Platforms confirms the landing-zone controls.',
    ],
  });

  it('reads the decision verbs actually present, not a fixed list', () => {
    expect(claims.askTerms).toEqual(expect.arrayContaining(['approve', 'fund', 'hold']));
    expect(claims.askTerms).not.toContain('defer');
  });

  it('finds the selected option named in the recommendation', () => {
    expect(claims.selectedOptions).toContain('Selective Replatform');
  });

  it('takes headline figures from the decision, not from the whole document', () => {
    expect(claims.headlineFigures).toEqual(expect.arrayContaining(['$53M', '32.6%']));
  });

  it('collects material dates from the recommendation and the next actions', () => {
    expect(claims.materialDates).toEqual(['2028-06-30', '2026-12-31']);
  });

  it('collects named owners without a leading article', () => {
    // "The Architecture Steering Committee" would never match a slide that says
    // "Architecture Steering Committee", and the gate would report a lost owner
    // that is on the slide in front of it.
    expect(claims.owners).toEqual(
      expect.arrayContaining(['Architecture Steering Committee', 'VP Data & AI Platforms']),
    );
    expect(claims.owners.some((o) => /^the\s/i.test(o))).toBe(false);
  });

  it('returns empty lists rather than guessing when the decision names nothing', () => {
    // A run that checked nothing must be visibly distinct from a run that found
    // nothing missing; the verdict counts what was checked for exactly this.
    const bare = deriveMaterialClaims({ recommendation: 'We recommend proceeding.', nextActions: [] });
    expect(bare.selectedOptions).toEqual([]);
    expect(bare.headlineFigures).toEqual([]);
    expect(bare.materialDates).toEqual([]);
  });
});
