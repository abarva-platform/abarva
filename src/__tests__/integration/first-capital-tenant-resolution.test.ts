import { resolveTenantHome } from '@/components/home/tenant-home-fixtures';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';

describe('First Capital tenant resolution', () => {
  it('resolves canonical arcturus client key to the First Capital home fixture', () => {
    const home = resolveTenantHome('arcturus');

    expect(home.key).toBe('firstcap');
    expect(home.title).toBe('First Capital Financial');
    expect(home.tagline).toContain('regional bank');
    expect(getClientOption('arcturus').name).toBe('First Capital Financial');
    expect(canonicalClientDisplayName({ key: 'arcturus', name: 'Brindlemark Financial' })).toBe('First Capital Financial');
  });

  // The prior `getFirstCapitalBriefData` / `getFirstCapitalMapData`
  // assertions were removed alongside the fixtures themselves: the
  // Intelligence Brief/Map no longer render hand-authored fixture corpus
  // for First Capital. Per the no-fabrication rule, an un-seeded tenant
  // now renders an honest "corpus not yet seeded" state instead — see
  // IntelligenceV3Page → CorpusNotSeededState.
});
