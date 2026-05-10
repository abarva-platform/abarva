import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';

describe('canonicalClientDisplayName', () => {
  it('renders legacy Heliara aliases as Meridian Health', () => {
    expect(getClientOption('meridian').name).toBe('Meridian Health System');
    expect(canonicalClientDisplayName({ key: 'meridian' })).toBe('Meridian Health');
    expect(
      canonicalClientDisplayName({
        key: 'meridian',
        name: 'Heliara Health Alliance',
      }),
    ).toBe('Meridian Health');
    expect(canonicalClientDisplayName({ name: 'Heliara Health' })).toBe('Meridian Health');
  });
});
