export type CanonicalTenant = {
  readonly key: string;
  readonly name: string;
  readonly industry: string;
  readonly mimics: string;
};

export const CANONICAL_TENANTS = [
  {
    key: 'apex-retail',
    name: 'Apex Retail',
    industry: 'retail',
    mimics: 'Generic mass-market retailer',
  },
  {
    key: 'meridian-health',
    name: 'Meridian Health',
    industry: 'healthcare_provider',
    mimics: 'PHS-shape hospital system',
  },
  {
    key: 'northstar-clinical',
    name: 'Northstar Clinical Technologies',
    industry: 'healthcare_medtech',
    mimics: 'Solventum-shape healthcare products and devices company',
  },
  {
    key: 'first-capital',
    name: 'First Capital',
    industry: 'financial_services_banking',
    mimics: 'Mid-tier banking institution',
  },
  {
    key: 'skyharbor-air',
    name: 'SkyHarbor Air',
    industry: 'airline',
    mimics: 'Delta-shape global airline',
  },
] as const satisfies readonly CanonicalTenant[];

export type CanonicalTenantKey = (typeof CANONICAL_TENANTS)[number]['key'];

export const CANONICAL_TENANT_KEYS = CANONICAL_TENANTS.map((tenant) => tenant.key);
