export interface TenantIsolationPersona {
  tenantKey: 'apexretail' | 'meridian' | 'skyharbor';
  displayName: string;
  email: string;
  homeRoute: string;
  expectedText: RegExp;
  forbiddenText: RegExp;
}

export const TENANT_ISOLATION_PERSONAS: TenantIsolationPersona[] = [
  {
    tenantKey: 'apexretail',
    displayName: 'Apex Retail',
    email: 'cio@apex-retail.example.com',
    homeRoute: '/home?client=apexretail',
    expectedText: /Apex Retail/i,
    forbiddenText: /Meridian Health|SkyHarbor/i,
  },
  {
    tenantKey: 'meridian',
    displayName: 'Meridian Health',
    email: 'cdio@meridian-health.example.com',
    homeRoute: '/home?client=meridian',
    expectedText: /Meridian Health/i,
    forbiddenText: /Apex Retail|SkyHarbor/i,
  },
  {
    tenantKey: 'skyharbor',
    displayName: 'SkyHarbor Air',
    email: 'admin@skyharbor-air.example.com',
    homeRoute: '/home?client=skyharbor',
    expectedText: /SkyHarbor/i,
    forbiddenText: /Apex Retail|Meridian Health/i,
  },
];
