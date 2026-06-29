import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';

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
});
