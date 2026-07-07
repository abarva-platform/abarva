import { LEARN_NAV, findLearnNavItem } from '../learn-nav';

describe('LEARN_NAV', () => {
  it('frames operational setup guidance as an Admin guide inside Learn', () => {
    const adminGroup = LEARN_NAV.find((group) => group.group === 'Admin Guide');

    expect(adminGroup).toBeDefined();
    expect(adminGroup?.items).toEqual([
      { slug: 'admin', label: 'Admin workspace & connectors' },
    ]);
  });

  it('does not expose setup as a Home learn navigation category', () => {
    expect(LEARN_NAV.map((group) => group.group)).not.toContain('Setup');
    expect(findLearnNavItem('setup')).toBeNull();
  });
});
