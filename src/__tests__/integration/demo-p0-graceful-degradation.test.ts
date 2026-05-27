jest.mock('next/navigation', () => ({
  usePathname: () => '/source/value',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      primaryEmailAddress: { emailAddress: 'maya.chen@skyharbor-air.example.com' },
      publicMetadata: { moduleAccess: ['source', 'tower'] },
      firstName: 'Maya',
      lastName: 'Chen',
    },
  }),
  useClerk: () => ({ signOut: jest.fn() }),
}));

describe('Delta demo P0 graceful degradation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Tower portfolio as a degraded empty state when tenancy cannot load', async () => {
    jest.doMock('@/lib/auth/tenancy', () => ({
      requireTenancy: jest.fn(async () => {
        throw new Error('Connection closed.');
      }),
    }));
    jest.doMock('@/lib/tower/value-states', () => ({
      getPortfolioValueRollup: jest.fn(async () => {
        throw new Error('Connection closed.');
      }),
    }));

    const { default: TowerPortfolioValuePage } = await import('@/app/(maestro)/tower/portfolio/page');
    const { renderToStaticMarkup } = await import('react-dom/server');

    const html = renderToStaticMarkup(await TowerPortfolioValuePage());

    expect(html).toContain('Live data unavailable');
    expect(html).toContain('degraded empty state rather than inventing value');
    expect(html).not.toContain('Connection closed');
  });

  it('renders Source value as a degraded empty ledger when ledger data cannot load', async () => {
    jest.doMock('@/lib/source/queries', () => ({
      getSourceValueLedger: jest.fn(async () => {
        throw new Error('Connection closed.');
      }),
    }));
    jest.doMock('@/lib/active-client', () => ({
      getActiveClientRow: jest.fn(async () => {
        throw new Error('Connection closed.');
      }),
    }));
    jest.doMock('@/lib/auth/tenancy', () => ({
      requireTenancy: jest.fn(async () => {
        throw new Error('Connection closed.');
      }),
    }));
    jest.doMock('@/lib/auth/source-access-policy', () => ({
      loadUserSourceAccessPolicy: jest.fn(),
    }));

    const { default: SourceValuePage } = await import('@/app/(maestro)/source/value/page');
    const { renderToStaticMarkup } = await import('react-dom/server');

    const html = renderToStaticMarkup(await SourceValuePage());

    expect(html).toContain('degraded empty ledger rather than inventing value');
    expect(html).toContain('No value ledger rows are available for this tenant right now.');
    expect(html).not.toContain('Connection closed');
  });
});
