import { resolveTenantHome } from '@/components/home/tenant-home-fixtures';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';

describe('SkyHarbor home tenant resolution', () => {
  it('resolves SkyHarbor aliases to the airline home fixture instead of Apex', () => {
    for (const key of ['skyharbor', 'skyharbor-air', 'skyharborair']) {
      const home = resolveTenantHome(key);

      expect(home.key).toBe('skyharbor');
      expect(home.title).toBe('SkyHarbor Air');
      expect(home.tagline).toContain('$52.1B global network carrier');
      expect(home.tagline).toContain('IBM Z modernization to AWS');
      expect(home.tagline).not.toContain('Apex Retail');
      expect(home.tagline).not.toContain('specialty retailer');
    }
  });

  it('keeps client option and canonical display name aligned for SkyHarbor', () => {
    expect(getClientOption('skyharbor').name).toBe('SkyHarbor Air');
    expect(canonicalClientDisplayName({ key: 'skyharbor', name: 'SkyHarbor Airlines' })).toBe(
      'SkyHarbor Air',
    );
  });
});
