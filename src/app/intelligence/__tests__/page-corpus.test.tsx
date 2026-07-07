/**
 * @jest-environment node
 */

import IntelligencePage from "../../(maestro)/intelligence/page";

jest.mock('server-only', () => ({}));

const mockHasLockedTenantSession = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockBuildIntelligenceV3PageData = jest.fn();
const mockGetVendorsForClient = jest.fn();
const mockGetByFunctionData = jest.fn();
const mockGetPeerActivityData = jest.fn();
const mockGetMyStrategyData = jest.fn();
const mockGetEnterpriseContextOverviewForTenant = jest.fn();
const mockListInitiativesForClient = jest.fn();
const mockIsFeatureEnabled = jest.fn();

jest.mock('@/lib/active-client', () => ({
  hasLockedTenantSession: () => mockHasLockedTenantSession(),
  getActiveClientRow: (requestedClient?: string | null) => mockGetActiveClientRow(requestedClient),
}));

jest.mock('@/lib/intelligence-v3/page-data', () => ({
  buildIntelligenceV3PageData: (requestedClient?: string | null) =>
    mockBuildIntelligenceV3PageData(requestedClient),
}));

jest.mock('@/lib/intelligence-v3/vendors-data', () => ({
  getVendorsForClient: (clientId: string) => mockGetVendorsForClient(clientId),
}));

jest.mock('@/lib/intelligence-v3/stages-data', () => ({
  getByFunctionData: () => mockGetByFunctionData(),
  getPeerActivityData: () => mockGetPeerActivityData(),
  getMyStrategyData: () => mockGetMyStrategyData(),
}));

jest.mock('@/lib/enterprise-context/intelligence-read-model', () => ({
  getEnterpriseContextOverviewForTenant: (clientKey: string, clientName: string) =>
    mockGetEnterpriseContextOverviewForTenant(clientKey, clientName),
}));

jest.mock('@/lib/admin/ai-initiatives/queries', () => ({
  listInitiativesForClient: (clientId: string) => mockListInitiativesForClient(clientId),
}));

jest.mock('@/components/intelligence-v3/IntelligenceV3Page', () => ({
  IntelligenceV3Page: 'mock-intelligence-v3-page',
}));

jest.mock('@/components/intelligence-v4/IntelligenceExplorerPage', () => ({
  IntelligenceExplorerPage: 'mock-intelligence-explorer-page',
}));

jest.mock('@/lib/features/is-feature-enabled', () => ({
  isFeatureEnabled: (ctx: unknown, key: string) => mockIsFeatureEnabled(ctx, key),
}));

const basePageData = {
  tenantName: 'Tenant',
  industry: 'Healthcare',
  refreshedLabel: 'just now',
  stats: { patterns: 0, contradictions: 0, syntheses: 0 },
  substrate: {
    tenantLoaded: 0,
    tenantTotal: 23,
    corpus: { failureModes: 0, patternRecords: 0, researchAnchors: 0 },
  },
  aiTrajectory: { headline: 'AI trajectory', body: 'Trajectory copy.' },
  pressureCards: [],
  conversationContext: { activeThread: 'Portfolio review', layerFocus: 'Decision Layer' },
  artOfThePossible: [],
  whatWeCantSee: [],
  sentinelOpener: 'Ready.',
  conversation: [],
};

function searchParamsFor(client: string) {
  return Promise.resolve({ client });
}

async function propsFor(client: string, row: { id: string; key: string; name: string; industry_code: string }) {
  mockGetActiveClientRow.mockResolvedValue(row);
  mockBuildIntelligenceV3PageData.mockResolvedValue({
    data: { ...basePageData, tenantName: row.name },
    isLiveBound: true,
  });

  const element = await IntelligencePage({ searchParams: searchParamsFor(client) });
  return element.props;
}

describe('/intelligence tenant corpus route binding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasLockedTenantSession.mockResolvedValue(true);
    mockGetVendorsForClient.mockResolvedValue(null);
    mockGetByFunctionData.mockResolvedValue(null);
    mockGetPeerActivityData.mockResolvedValue(null);
    mockGetMyStrategyData.mockResolvedValue(null);
    mockListInitiativesForClient.mockResolvedValue([]);
    mockGetEnterpriseContextOverviewForTenant.mockResolvedValue(null);
    mockIsFeatureEnabled.mockReturnValue(false);
  });

  it('passes Meridian seeded corpus data into the Intelligence page', async () => {
    const props = await propsFor('meridian', {
      id: 'client_meridian',
      key: 'meridian',
      name: 'Meridian Health System',
      industry_code: 'healthcare',
    });

    expect(props.clientKey).toBe('meridian');
    expect(props.intelligenceCorpusData?.briefData.tenantName).toBe('Meridian Health System');
    expect(props.intelligenceCorpusData?.briefData.bets[0]?.useCase.name).toContain('Population Health AI');
    expect(props.intelligenceCorpusData?.mapData.totalUseCases).toBeGreaterThan(0);
  });

  it('passes First Capital seeded corpus data into the Intelligence page', async () => {
    const props = await propsFor('firstcapital', {
      id: 'client_firstcapital',
      key: 'firstcapital',
      name: 'First Capital Financial',
      industry_code: 'finserv',
    });

    expect(props.clientKey).toBe('firstcapital');
    expect(props.intelligenceCorpusData?.briefData.tenantName).toBe('First Capital Financial');
    expect(props.intelligenceCorpusData?.briefData.bets[0]?.useCase.name).toContain('FedNow');
    expect(props.intelligenceCorpusData?.mapData.totalUseCases).toBeGreaterThan(0);
  });

  it('passes SkyHarbor seeded corpus data into the Intelligence page', async () => {
    const props = await propsFor('skyharbor', {
      id: 'client_skyharbor',
      key: 'skyharbor',
      name: 'SkyHarbor Air',
      industry_code: 'airline',
    });

    expect(props.clientKey).toBe('skyharbor');
    expect(props.intelligenceCorpusData?.briefData.tenantName).toBe('SkyHarbor Air');
    expect(props.intelligenceCorpusData?.briefData.bets[0]?.useCase.name).toContain('IROPs Recovery');
    expect(props.intelligenceCorpusData?.mapData.totalUseCases).toBeGreaterThan(0);
  });

  it('renders exactly one gated explorer shell without fixture count props', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client_skyharbor',
      key: 'skyharbor',
      name: 'SkyHarbor Air',
      industry_code: 'airline',
    });

    const element = await IntelligencePage({ searchParams: searchParamsFor('skyharbor') });

    expect(element.type).toBe('mock-intelligence-explorer-page');
    expect(element.props).toMatchObject({
      tenantKey: 'skyharbor',
      tenantName: 'SkyHarbor Air',
    });
    expect(element.props).not.toHaveProperty('dimensionsLoaded');
    expect(element.props).not.toHaveProperty('insightCount');
    expect(mockBuildIntelligenceV3PageData).not.toHaveBeenCalled();
  });
});
