import type { NextRequest } from 'next/server';

const requireTenancy = jest.fn();
const getActiveClientRow = jest.fn();
const createThread = jest.fn();
const assembleContext = jest.fn();
const touchThread = jest.fn();
const runProgramsNexusTurn = jest.fn();

jest.mock('@/app/api/v1/programs/_auth', () => {
  class MockTenancyError extends Error {
    constructor(public readonly code: 'unauthenticated' | 'no_client') {
      super(code);
    }
  }

  return {
    requireTenancy,
    TenancyError: MockTenancyError,
  };
});

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow,
}));

jest.mock('@/lib/programs/nexus', () => ({
  createThread,
  assembleContext,
  touchThread,
}));

jest.mock('@/lib/programs/nexus-free-text', () => ({
  runProgramsNexusTurn,
}));

function makeRequest(body: unknown | string): NextRequest {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('http://localhost/api/v1/programs/program_1/nexus/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }) as NextRequest;
}

async function readEvents(res: Response): Promise<Array<{ event: string; data: Record<string, unknown> }>> {
  const text = await res.text();
  return text
    .trim()
    .split('\n\n')
    .filter(Boolean)
    .map((chunk) => {
      const [eventLine, dataLine] = chunk.split('\n');
      return {
        event: eventLine.replace(/^event:\s*/, ''),
        data: JSON.parse(dataLine.replace(/^data:\s*/, '')) as Record<string, unknown>,
      };
    });
}

describe('POST /api/v1/programs/[programId]/nexus/ask', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    requireTenancy.mockResolvedValue({ clientId: 'client_1', userId: 'user_1' });
    getActiveClientRow.mockResolvedValue({
      id: 'client_1',
      key: 'apex-retail',
      name: 'Apex Retail',
      industry_code: 'retail',
    });
    createThread.mockResolvedValue({ id: 'thread_program_1' });
    assembleContext.mockResolvedValue({
      programId: 'program_1',
      program: {
        name: 'Morrison Owned-Brand Margin Recovery',
        archetype: 'operational_optimization',
        currentPhase: 2,
      },
      modules: [{ moduleKey: 'baseline', status: 'completed', phaseNumber: 1 }],
      patternPreload: { topic_key: 'owned_brand_margin_recovery' },
      deliverables: [{ id: 'd01', title: 'Program Charter', status: 'published', typeKey: 'program_charter' }],
      flags: [{ id: 'flag_1', headline: 'Margin model assumption unresolved', severity: 'warning' }],
    });
    touchThread.mockResolvedValue(undefined);
    runProgramsNexusTurn.mockResolvedValue({
      response: '1. Best anchor: [Owned Brand Margin Recovery](/preview/intelligence/patterns/owned-brand-margin-recovery).',
      routeType: 'manifest_fallback',
      confidence: 'medium',
      sparseEvidence: false,
      activePatternSlug: 'owned-brand-margin-recovery',
      suggestions: ['Pressure-test the assumptions behind Owned Brand Margin Recovery'],
      citations: [
        {
          slug: 'owned-brand-margin-recovery',
          label: 'Owned Brand Margin Recovery',
          href: '/preview/intelligence/patterns/owned-brand-margin-recovery',
          evidenceCount: 8,
          observationCount: 5,
          deliverableCount: 4,
          freshnessLabel: 'Apr 20',
          confidence: 0.78,
          confidenceBand: 'medium',
          matchReason: 'active program pattern anchor',
        },
      ],
      sources: [
        {
          id: 'program:program_1',
          type: 'engagement',
          name: 'Morrison Owned-Brand Margin Recovery',
          detail: 'Phase 2 · 1 deliverables · 1 open flags',
          confidence: 'high',
        },
        {
          id: 'pattern:owned-brand-margin-recovery',
          type: 'pattern',
          name: 'Owned Brand Margin Recovery',
          detail: '8 evidence sources · 5 observations',
          confidence: 'medium',
          url: '/preview/intelligence/patterns/owned-brand-margin-recovery',
        },
      ],
    });
  });

  it('creates a thread, emits sources, and completes with thread metadata', async () => {
    const { POST } = await import('@/app/api/v1/programs/[programId]/nexus/ask/route');
    const res = await POST(makeRequest({ query: 'What assumptions are load-bearing?' }), {
      params: Promise.resolve({ programId: 'program_1' }),
    });

    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await readEvents(res);
    expect(events[0]?.event).toBe('context_ready');
    expect(events.filter((event) => event.event === 'source_attached')).toHaveLength(2);
    expect(events.filter((event) => event.event === 'citation_attached')).toHaveLength(1);
    expect(events.some((event) => event.event === 'delta')).toBe(true);
    expect(events.at(-1)?.event).toBe('complete');

    expect(createThread).toHaveBeenCalledWith(
      { clientId: 'client_1', userId: 'user_1' },
      expect.objectContaining({ programId: 'program_1', mode: 'side_panel' }),
    );
    expect(runProgramsNexusTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: expect.objectContaining({ clientKey: 'apex-retail', clientName: 'Apex Retail' }),
        message: 'What assumptions are load-bearing?',
      }),
    );
    expect(events.at(-1)?.data).toMatchObject({
      threadId: 'thread_program_1',
      routeType: 'manifest_fallback',
      confidence: 'medium',
      citationCount: 1,
    });
    expect(touchThread).toHaveBeenCalledWith('thread_program_1');
  });
});
