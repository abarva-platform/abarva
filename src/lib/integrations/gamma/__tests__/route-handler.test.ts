// Gamma route handler tests — auth, egress gate, config, success.
//
// The handler is the single seam every per-deck route calls. We mock the
// Gamma client and the tenancy + auth dependencies so the test exercises the
// route logic without touching the network.

import type { NextRequest } from 'next/server';

jest.mock('@/lib/auth/current-user', () => ({
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/programs/board-artifacts/board-grade-route-guard', () => ({
  assertBoardGradeTenancy: jest.fn(),
}));
jest.mock('../client', () => ({
  generateGammaDeck: jest.fn(),
  isGammaConfigured: jest.fn(),
  GammaError: jest.requireActual('../client').GammaError,
}));

import { handleGammaExport } from '../route-handler';
import { getCurrentUser } from '@/lib/auth/current-user';
import { assertBoardGradeTenancy } from '@/lib/programs/board-artifacts/board-grade-route-guard';
import { generateGammaDeck, isGammaConfigured, GammaError } from '../client';

const getCurrentUserMock = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const assertBoardGradeTenancyMock =
  assertBoardGradeTenancy as jest.MockedFunction<typeof assertBoardGradeTenancy>;
const generateGammaDeckMock = generateGammaDeck as jest.MockedFunction<
  typeof generateGammaDeck
>;
const isGammaConfiguredMock = isGammaConfigured as jest.MockedFunction<
  typeof isGammaConfigured
>;

function mockReq(url: string): NextRequest {
  return { url, headers: new Headers() } as unknown as NextRequest;
}

const SIGNED_IN_USER = {
  personId: 'p_1',
  clerkUserId: 'u_1',
  metadataClientKey: 'apexretail',
  name: 'Test User',
  email: 'test@example.com',
  primaryRole: 'maestro' as const,
  accessibleClients: [],
  defaultClientId: null,
};

describe('handleGammaExport — auth gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when there is no signed-in user', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const res = await handleGammaExport(
      mockReq('https://example.com/api/v1/moves/board-grade-discover-brief/gamma'),
      'discover-brief',
      'test-route',
    );
    expect(res.status).toBe(401);
  });
});

describe('handleGammaExport — egress gate (REFERENCE only)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(SIGNED_IN_USER);
    assertBoardGradeTenancyMock.mockResolvedValue(null);
    isGammaConfiguredMock.mockReturnValue(true);
  });

  it('refuses a moveId query parameter with 403', async () => {
    const res = await handleGammaExport(
      mockReq(
        'https://example.com/api/v1/moves/board-grade-discover-brief/gamma?moveId=move_42',
      ),
      'discover-brief',
      'test-route',
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string; detail: string };
    expect(body.detail).toContain('reference decks only');
    // The Gamma client must NEVER be called when the egress gate fires.
    expect(generateGammaDeckMock).not.toHaveBeenCalled();
  });
});

describe('handleGammaExport — config gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(SIGNED_IN_USER);
    assertBoardGradeTenancyMock.mockResolvedValue(null);
  });

  it('returns 503 when GAMMA_API_KEY is not configured', async () => {
    isGammaConfiguredMock.mockReturnValue(false);
    const res = await handleGammaExport(
      mockReq('https://example.com/api/v1/moves/board-grade-discover-brief/gamma'),
      'discover-brief',
      'test-route',
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string; detail: string };
    expect(body.detail).toContain('not configured');
    expect(generateGammaDeckMock).not.toHaveBeenCalled();
  });
});

describe('handleGammaExport — tenancy gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(SIGNED_IN_USER);
    isGammaConfiguredMock.mockReturnValue(true);
  });

  it('returns the tenancy guard response when the caller is cross-tenant', async () => {
    assertBoardGradeTenancyMock.mockResolvedValue(
      Response.json({ error: 'forbidden' }, { status: 403 }),
    );
    const res = await handleGammaExport(
      mockReq('https://example.com/api/v1/moves/board-grade-discover-brief/gamma'),
      'discover-brief',
      'test-route',
    );
    expect(res.status).toBe(403);
    expect(generateGammaDeckMock).not.toHaveBeenCalled();
  });
});

describe('handleGammaExport — success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(SIGNED_IN_USER);
    assertBoardGradeTenancyMock.mockResolvedValue(null);
    isGammaConfiguredMock.mockReturnValue(true);
  });

  it('returns the Gamma URL + export URL + audit fields on success', async () => {
    generateGammaDeckMock.mockResolvedValue({
      gammaUrl: 'https://gamma.app/docs/x',
      exportUrl: 'https://gamma.app/export/x.pptx',
      generationId: 'gen_99',
      gammaId: 'gid_99',
      credits: 8,
      rateLimit: {
        burstRemaining: '5',
        remaining: '95',
        dailyRemaining: '1000',
      },
    });

    const res = await handleGammaExport(
      mockReq('https://example.com/api/v1/moves/board-grade-discover-brief/gamma'),
      'discover-brief',
      'test-route',
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.gammaUrl).toBe('https://gamma.app/docs/x');
    expect(body.exportUrl).toBe('https://gamma.app/export/x.pptx');
    expect(body.generationId).toBe('gen_99');
    expect(body.deck).toBe('discover-brief');
    // The raw inputText must NOT appear in the response — only the URL set.
    expect(body.inputText).toBeUndefined();

    // The client received `cardSplit: 'inputTextBreaks'` per the contract.
    const args = generateGammaDeckMock.mock.calls[0][0];
    expect(args.cardSplit).toBe('inputTextBreaks');
    expect(args.additionalInstructions).toContain(
      'Render only the supplied content',
    );
  });

  it('maps Gamma timeout to HTTP 504', async () => {
    generateGammaDeckMock.mockRejectedValue(
      new GammaError('timed out', { kind: 'timeout' }),
    );
    const res = await handleGammaExport(
      mockReq('https://example.com/api/v1/moves/board-grade-discover-brief/gamma'),
      'discover-brief',
      'test-route',
    );
    expect(res.status).toBe(504);
  });

  it('maps Gamma failure to HTTP 502', async () => {
    generateGammaDeckMock.mockRejectedValue(
      new GammaError('upstream said no', { kind: 'gamma_failed' }),
    );
    const res = await handleGammaExport(
      mockReq('https://example.com/api/v1/moves/board-grade-discover-brief/gamma'),
      'discover-brief',
      'test-route',
    );
    expect(res.status).toBe(502);
  });
});
