import { canonicalClientDisplayName, demoSafeClientText, getClientOption } from '@/lib/client-config';

describe('canonicalClientDisplayName', () => {
  it('renders Apex aliases as Retail Demo', () => {
    expect(getClientOption('apexretail').name).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ key: 'apexretail' })).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ key: 'apex-retail' })).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ name: 'Apex Retail' })).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ name: 'Apex Retail Group' })).toBe('Retail Demo');
  });

  it('renders Meridian aliases as Healthcare Demo', () => {
    expect(getClientOption('meridian').name).toBe('Healthcare Demo');
    expect(canonicalClientDisplayName({ key: 'meridian' })).toBe('Healthcare Demo');
    expect(
      canonicalClientDisplayName({
        key: 'meridian',
        name: 'Meridian Health',
      }),
    ).toBe('Healthcare Demo');
    expect(canonicalClientDisplayName({ name: 'Meridian Health' })).toBe('Healthcare Demo');
  });

  it('scrubs tenant names embedded in visible move titles and codes', () => {
    expect(
      demoSafeClientText('CANARY - SkyHarbor Recovery Command IROPS Architecture - skyharbor-canary-20260622161738'),
    ).toBe('CANARY - Airline Demo Recovery Command IROPS Architecture - Airline Demo-canary-20260622161738');
    expect(
      demoSafeClientText('Lakeshore Enterprise Finance & Treasury Modernization'),
    ).toBe('Industrial Demo Enterprise Finance & Treasury Modernization');
  });
});
