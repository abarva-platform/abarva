import type { NextRequest } from 'next/server';

const requireAtlasTenancy = jest.fn();
const runAtlasTurnDetailed = jest.fn();

jest.mock('@/app/api/v1/atlas/_auth', () => ({
  requireAtlasTenancy,
  tenancyErrorResponse: (err: Error & { code?: string }) =>
    Response.json({ error: err.code ?? 'internal_error' }, { status: err.code === 'unauthenticated' ? 401 : 403 }),
}));

jest.mock('@/lib/atlas/orchestrator', () => ({
  runAtlasTurnDetailed,
}));

function makeRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/v1/atlas/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/v1/atlas/ask', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    requireAtlasTenancy.mockResolvedValue({
      clientId: 'client_meridian',
      userId: 'user_1',
    });

    runAtlasTurnDetailed.mockResolvedValue({
      threadId: 'atlas_thread_1',
      routeType: 'llm',
      intent: 'llm',
      response: 'Atlas can see the pressure stack, but the defensible next step is to inspect the program deliverables behind it.',
      suggestions: [
        { label: 'Open programs', value: 'Open programs', kind: 'link', href: '/engagements' },
      ],
      toolsUsed: ['query_portfolio_aggregates', 'query_programs'],
      signalId: null,
      observationId: 'obs_1',
      modelName: 'claude-opus-4-7',
      promptVersion: 'tower-w5-v1',
      toolResults: {
        portfolio: {
          clientId: 'client_meridian',
          clientName: 'Meridian Health System',
          activeUseCaseCount: 42,
          criticalSignalCount: 2,
          warningSignalCount: 3,
          governedAiSpendUsd: 900000,
          shadowAiSpendUsd: 120000,
          estimatedValueUsd: 2400000,
          realizedValueUsd: 1300000,
          averageTrustworthinessScore: 74,
          staleIntegrationCount: 1,
          adoptionPenetrationPctAvg: 64,
          trackedActiveUsers: 15250,
          distinctAiVendorsCount: 7,
          valueAttainmentPctAvg: 51,
          adoptionPercentile: 62,
          spendIntensityPercentile: 71,
          valueAttainmentPercentile: 58,
          vendorCountPercentile: 68,
          asOf: '2026-04-24T00:00:00.000Z',
        },
        programs: [
          {
            id: 'eng_meridian_ambient',
            name: 'Ambient Clinical Value Chain Activation',
            currentPhase: 3,
            status: 'active',
            originSource: 'seed',
          },
        ],
        observations: [],
      },
    });
  });

  it('returns a rendered response with an explicit Nexus handoff for deliverable-context asks', async () => {
    const { POST } = await import('@/app/api/v1/atlas/ask/route');
    const res = await POST(makeRequest({
      message: 'Walk me through the top contradictions and which deliverables carry them.',
      clientId: 'client_meridian',
    }));

    expect(res.status).toBe(200);

    const json = await res.json() as {
      threadId: string;
      renderedResponse: {
        response_text: string;
        follow_up_actions: Array<{ label: string; kind: string; target?: string }>;
        handoff_affordance: { to_agent: string; target_href: string } | null;
      };
    };

    expect(json.threadId).toBe('atlas_thread_1');
    expect(json.renderedResponse.response_text).toContain('defensible next step');
    expect(json.renderedResponse.follow_up_actions[0]).toMatchObject({
      label: 'Open programs',
      kind: 'navigate',
      target: '/engagements',
    });
    expect(json.renderedResponse.handoff_affordance).toMatchObject({
      to_agent: 'nexus',
      target_href: '/engagements',
    });
    expect(runAtlasTurnDetailed).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Walk me through the top contradictions and which deliverables carry them.',
    }));
  });
});
