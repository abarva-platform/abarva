export const DEMO_ROLE_ACCOUNTS = {
  admin: {
    email: 'anand+clerk_test@abarva.com',
    expectedPath: /\/home\?client=meridian$/,
    pageMarker: { kind: 'link', label: 'Admin' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower', 'Platform', 'Investor', 'Admin'],
    hiddenNav: [],
  },
  maestro: {
    email: 'af+clerk_test@abarva.com',
    expectedPath: /\/home\?client=arcturus$/,
    pageMarker: { kind: 'text', label: 'Maestro' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower', 'Platform'],
    hiddenNav: ['Investor', 'Admin'],
  },
  investor: {
    email: 'investor+clerk_test@abarva.com',
    expectedPath: /\/investor\?client=meridian$/,
    pageMarker: { kind: 'text', label: 'Warm-intro investor materials' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower', 'Platform', 'Investor'],
    hiddenNav: ['Admin'],
  },
  client: {
    email: 'mh+clerk_test@abarva.com',
    expectedPath: /\/home\?client=meridian$/,
    pageMarker: { kind: 'text', label: 'Meridian Health' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower', 'Platform'],
    hiddenNav: ['Investor', 'Admin'],
  },
} as const;

export type DemoRoleAccountKey = keyof typeof DEMO_ROLE_ACCOUNTS;
