export const DEMO_ROLE_ACCOUNTS = {
  admin: {
    email: 'anand+clerk_test@abarva.com',
    expectedPath: /\/home$/,
    pageMarker: { kind: 'link', label: 'Admin' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower', 'Platform', 'Investor', 'Admin'],
    hiddenNav: [],
  },
  maestro: {
    email: 'af@abarva.com',
    expectedPath: /\/home$/,
    pageMarker: { kind: 'text', label: 'Maestro' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower', 'Platform'],
    hiddenNav: ['Investor', 'Admin'],
  },
  investor: {
    email: 'investor+clerk_test@abarva.com',
    expectedPath: /\/investor(s)?$/,
    pageMarker: { kind: 'text', label: 'Warm-intro investor materials' },
    visibleNav: ['Home', 'Programs', 'Intelligence', 'Control Tower', 'Platform', 'Investor'],
    hiddenNav: ['Admin'],
  },
  client: {
    email: 'mh+clerk_test@abarva.com',
    expectedPath: /\/client-view\?client=meridian$/,
    pageMarker: { kind: 'text', label: '404' },
    visibleNav: [],
    hiddenNav: [],
  },
} as const;

export type DemoRoleAccountKey = keyof typeof DEMO_ROLE_ACCOUNTS;
