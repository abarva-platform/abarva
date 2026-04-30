type DemoRoleAccount = {
  email: string;
  expectedPath: RegExp;
  pageMarker: { kind: 'link' | 'text'; label: string };
  visibleNav: string[];
  hiddenNav: string[];
};

export const DEMO_ROLE_ACCOUNTS: Record<string, DemoRoleAccount> = {
  founderMeridian: {
    email: 'anand.sundaram@thesundaram.com',
    expectedPath: /\/home\?client=meridian$/,
    pageMarker: { kind: 'text', label: 'Meridian Health' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower'],
    hiddenNav: ['Investor'],
  },
  clientFirstCapital: {
    email: 'demo-firstcapital+clerk_test@abarva.com',
    expectedPath: /\/home\?client=arcturus$/,
    pageMarker: { kind: 'text', label: 'Arcturus Financial' },
    visibleNav: ['Home', 'Programs', 'Control Tower'],
    hiddenNav: ['Intelligence', 'Platform', 'Investor', 'Admin'],
  },
  investor: {
    email: 'investor+clerk_test@abarva.com',
    expectedPath: /\/investor\?client=meridian$/,
    pageMarker: { kind: 'text', label: 'Warm-intro investor materials' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower', 'Platform', 'Investor'],
    hiddenNav: ['Admin'],
  },
  client: {
    email: 'demo-meridian+clerk_test@abarva.com',
    expectedPath: /\/home\?client=meridian$/,
    pageMarker: { kind: 'text', label: 'Meridian Health' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower'],
    hiddenNav: ['Investor', 'Admin'],
  },
  clientApexRetail: {
    email: 'demo-apexretail+clerk_test@abarva.com',
    expectedPath: /\/home\?client=apexretail$/,
    pageMarker: { kind: 'text', label: 'Apex Retail' },
    visibleNav: ['Home', 'Programs', 'Control Tower'],
    hiddenNav: ['Intelligence', 'Platform', 'Investor', 'Admin'],
  },
};

export type DemoRoleAccountKey = keyof typeof DEMO_ROLE_ACCOUNTS;
