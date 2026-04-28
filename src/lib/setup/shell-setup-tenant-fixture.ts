export interface TenantInfo {
  name: string;
  slug: string;
  industry: string;
  region: string;
  tier: string;
  status: 'locked' | 'active' | 'suspended';
  contractStart: string;
  contractEnd: string;
  renewalOwner: string;
  programCount: number;
  activePrograms: number;
  dataResidency: string;
  ssoProvider: string;
  createdDate: string;
}

export const TENANT_FIXTURE: TenantInfo = {
  name: 'Apex Retail Group',
  slug: 'apex-retail',
  industry: 'Retail · Omnichannel',
  region: 'North America',
  tier: 'Enterprise',
  status: 'locked',
  contractStart: 'Jan 1 2026',
  contractEnd: 'Dec 31 2027',
  renewalOwner: 'Sarah Mitchell',
  programCount: 4,
  activePrograms: 3,
  dataResidency: 'US-East-1 (AWS)',
  ssoProvider: 'Okta',
  createdDate: 'Nov 2025',
};

export const TENANT_AGENT_VOICE = {
  quote: 'Apex Retail Group is a locked Enterprise tenant. Contract active through Dec 2027 — renewal owner is Sarah Mitchell. 4 programs registered, 3 active. SSO via Okta, data residency in US-East-1.',
  agentContext: 'Steward · Tenant · Apex Retail Group · Apr 27 2026',
  actions: [
    { letter: 'A' as const, text: 'View contract details', detail: 'Enterprise agreement — 2-year term, Jan 2026 – Dec 2027' },
    { letter: 'B' as const, text: 'Check renewal timeline', detail: 'Renewal owner: Sarah Mitchell · renewal window opens Oct 2027' },
    { letter: 'C' as const, text: 'Review data residency', detail: 'US-East-1 · all program data stored in-region' },
  ],
};
