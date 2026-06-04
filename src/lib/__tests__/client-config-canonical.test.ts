import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';

describe('canonicalClientDisplayName', () => {
  it('renders Apex aliases as Apex Retail Group', () => {
    expect(getClientOption('apexretail').name).toBe('Apex Retail Group');
    expect(canonicalClientDisplayName({ key: 'apexretail' })).toBe('Apex Retail Group');
    expect(canonicalClientDisplayName({ key: 'apex-retail' })).toBe('Apex Retail Group');
    expect(canonicalClientDisplayName({ name: 'Apex Retail' })).toBe('Apex Retail Group');
    expect(canonicalClientDisplayName({ name: 'Apex Retail Group' })).toBe('Apex Retail Group');
  });

  it('renders Meridian aliases as Meridian Health', () => {
    expect(getClientOption('meridian').name).toBe('Meridian Health System');
    expect(canonicalClientDisplayName({ key: 'meridian' })).toBe('Meridian Health');
    expect(
      canonicalClientDisplayName({
        key: 'meridian',
        name: 'Meridian Health',
      }),
    ).toBe('Meridian Health');
    expect(canonicalClientDisplayName({ name: 'Meridian Health' })).toBe('Meridian Health');
  });
});
