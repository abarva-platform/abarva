import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';

describe('canonicalClientDisplayName', () => {
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
