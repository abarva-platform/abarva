import {
  getStaticLaunchAccessProfile,
  isStaticLaunchApprovedEmail,
} from '@/lib/auth/launch-access';
import { inferClientKeyFromEmail } from '@/lib/client-config';

describe('launch access roster', () => {
  it('allows approved AbarVa admin identities', () => {
    expect(isStaticLaunchApprovedEmail('admin@abarva.ai')).toBe(true);
    expect(getStaticLaunchAccessProfile('admin@abarva.ai')).toMatchObject({
      role: 'client',
      clientKey: 'meridian',
    });
    expect(getStaticLaunchAccessProfile('anand@abarva.ai')).toMatchObject({
      role: 'admin',
      clientKey: 'skyharbor',
    });
  });

  it('pins Anand client test aliases to the right tenant keys', () => {
    expect(inferClientKeyFromEmail('anand.sundaram+firstcapital@thesundaram.com')).toBe('arcturus');
    expect(inferClientKeyFromEmail('anand.sundaram+meridian@thesundaram.com')).toBe('meridian');
    expect(inferClientKeyFromEmail('anand.sundaram+skyharbor@thesundaram.com')).toBe('skyharbor');
    expect(inferClientKeyFromEmail('anand.sundaram+lakeshore@thesundaram.com')).toBe('lakeshore');
  });

  it('does not approve retired role-based synthetic demo emails for launch access', () => {
    expect(isStaticLaunchApprovedEmail('cio@firstcapital.example.com')).toBe(false);
    expect(isStaticLaunchApprovedEmail('cdio@meridian-health.example.com')).toBe(false);
    expect(isStaticLaunchApprovedEmail('cto@skyharbor-air.example.com')).toBe(false);
  });
});
