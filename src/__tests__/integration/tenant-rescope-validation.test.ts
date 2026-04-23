import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getSeedPlan } from '@/lib/deliverables/seed-route-resolver';
import { SeedProgramsIndex, SeedTenantPattern, SeedTenantTower } from '@/components/deliverables/SeedRouteShell';
import { buildTenantRescopeSnapshot, validateTenantRescope } from '@/lib/integrity/tenant-rescope';

describe('tenant switcher re-scope validation', () => {
  it('fully re-scopes seeded surfaces when switching from Meridian to Apex', () => {
    const validation = validateTenantRescope('meridian-health', 'apex-retail');

    expect(validation.from.tenantName).toBe('Meridian Health System');
    expect(validation.to.tenantName).toBe('Apex Retail Group');
    expect(validation.to.programNames).toContain('Morrison Owned Brand Margin Recovery');
    expect(validation.leakedTerms).toEqual([]);
  });

  it('renders Apex program list, pattern state, Tower data, and admin signature without Meridian content', () => {
    const plan = getSeedPlan();
    const apex = plan.tenants.find((tenant) => tenant.routeSlug === 'apex-retail')!;
    const meridian = buildTenantRescopeSnapshot('meridian-health');
    const apexSnapshot = buildTenantRescopeSnapshot('apex-retail');
    const renderedApexSurfaces = [
      renderToStaticMarkup(createElement(SeedProgramsIndex, { tenant: apex })),
      renderToStaticMarkup(createElement(SeedTenantPattern, { tenant: apex, patternSlug: 'owned-brand-margin-recovery' })),
      renderToStaticMarkup(createElement(SeedTenantTower, { tenant: apex })),
      apexSnapshot.adminDataSignature,
    ].join('\n');

    expect(renderedApexSurfaces).toContain('Apex Retail Group');
    expect(renderedApexSurfaces).toContain('Morrison Owned Brand Margin Recovery');
    expect(renderedApexSurfaces).toContain('owned-brand-margin-recovery');
    expect(renderedApexSurfaces).toContain('Apex Retail Group admin data');

    for (const meridianTerm of [meridian.tenantName, ...meridian.programNames, ...meridian.patternSlugs]) {
      expect(renderedApexSurfaces).not.toContain(meridianTerm);
    }
  });
});
