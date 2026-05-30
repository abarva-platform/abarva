// resolvePostSignInPath tests — Tower-as-landing routing.
//
// Per Tower audit §5.1 ("A CIO arrives via /home and clicks into Tower
// via the AppRail"), portfolio-bearing tenants should land on /tower
// directly. Empty-portfolio tenants continue to /home so the absence
// of substrate is communicated explicitly.

import { resolvePostSignInPath } from '@/lib/auth/access-routing';

describe('resolvePostSignInPath — Tower-as-landing', () => {
  it('routes portfolio-bearing client users straight to /tower', () => {
    const path = resolvePostSignInPath('client', {
      email: 'cio@apex-retail.example.com',
      hasTowerPortfolio: true,
    });
    expect(path.startsWith('/tower')).toBe(true);
  });

  it('routes portfolio-bearing maestro users straight to /tower', () => {
    const path = resolvePostSignInPath('maestro', {
      email: 'maestro@abarva.com',
      clientId: 'apexretail',
      hasTowerPortfolio: true,
    });
    expect(path.startsWith('/tower')).toBe(true);
  });

  it('routes portfolio-bearing admin users to /tower', () => {
    const path = resolvePostSignInPath('admin', {
      email: 'admin@abarva.com',
      clientId: 'apexretail',
      hasTowerPortfolio: true,
    });
    expect(path.startsWith('/tower')).toBe(true);
  });

  it('keeps empty-portfolio client users on /home (the historical default)', () => {
    const path = resolvePostSignInPath('client', {
      email: 'cio@apex-retail.example.com',
      hasTowerPortfolio: false,
    });
    expect(path.startsWith('/home')).toBe(true);
  });

  it('keeps empty-portfolio maestro users on /home (the historical default)', () => {
    const path = resolvePostSignInPath('maestro', {
      email: 'maestro@abarva.com',
      clientId: 'apexretail',
      hasTowerPortfolio: false,
    });
    expect(path.startsWith('/home')).toBe(true);
  });

  it('never routes investors to /tower even with a portfolio (they get their own surface)', () => {
    const path = resolvePostSignInPath('investor', {
      hasTowerPortfolio: true,
    });
    expect(path.startsWith('/investor')).toBe(true);
  });

  it('never routes externals to /tower (they get the marketing root)', () => {
    const path = resolvePostSignInPath('external', {
      hasTowerPortfolio: true,
    });
    expect(path).toBe('/');
  });

  it('omitting hasTowerPortfolio preserves the historical /home default', () => {
    const path = resolvePostSignInPath('client', {
      email: 'cio@apex-retail.example.com',
    });
    expect(path.startsWith('/home')).toBe(true);
  });

  it('hasTowerPortfolio=true pins the client query param when a tenant is bound', () => {
    const path = resolvePostSignInPath('client', {
      email: 'cio@apex-retail.example.com',
      hasTowerPortfolio: true,
    });
    expect(path).toContain('client=');
  });
});
