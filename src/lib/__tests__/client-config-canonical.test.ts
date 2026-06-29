import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';

describe('canonicalClientDisplayName', () => {
  it('renders retail aliases as the demo-safe tenant label', () => {
    expect(getClientOption('apexretail').name).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ key: 'apexretail' })).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ key: 'apex-retail' })).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ name: 'Apex Retail' })).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ name: 'Apex Retail Group' })).toBe('Retail Demo');
    expect(canonicalClientDisplayName({ name: 'Retail Demo' })).toBe('Retail Demo');
  });

  it('renders healthcare aliases as the demo-safe tenant label', () => {
    expect(getClientOption('meridian').name).toBe('Healthcare Demo');
    expect(canonicalClientDisplayName({ key: 'meridian' })).toBe('Healthcare Demo');
    expect(
      canonicalClientDisplayName({
        key: 'meridian',
        name: 'Meridian Health',
      }),
    ).toBe('Healthcare Demo');
    expect(canonicalClientDisplayName({ name: 'Meridian Health' })).toBe('Healthcare Demo');
    expect(canonicalClientDisplayName({ name: 'Healthcare Demo' })).toBe('Healthcare Demo');
  });

  it('renders airline, industrial, financial, and clinical demo labels from old aliases', () => {
    expect(canonicalClientDisplayName({ key: 'skyharbor', name: 'SkyHarbor Air' })).toBe('Airline Demo');
    expect(canonicalClientDisplayName({ key: 'lakeshore', name: 'Lakeshore Holdings' })).toBe('Industrial Demo');
    expect(canonicalClientDisplayName({ key: 'arcturus', name: 'First Capital Financial' })).toBe('Financial Services Demo');
    expect(canonicalClientDisplayName({ key: 'northstar', name: 'Northstar Clinical Technologies' })).toBe('Clinical Technology Demo');
  });
});
