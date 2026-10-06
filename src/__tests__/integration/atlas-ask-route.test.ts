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
      response: '**Atlas can see the pressure stack**, but the defensible next step is to inspect the program deliverables behind it. Portfolio KPI evidence shows gate slippage, sponsor ambiguity, and value-baseline risk. I recommend opening Programs before treating this as a Tower-only decision.',
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
    expect(json.renderedResponse.response_text).not.toContain('**');

    // This pair of assertions used to read `toContain('- Evidence:')` and
    // `toContain('- Next:')`, and they were CORRECT on the day they were
    // written: `buildAtlasRenderedResponse` shaped this surface through
    // `shapeAgentResponseForSurface('/tower', ...)`, and `/tower` was a
    // compacted surface, so the shaper rebuilt advisor prose into a fixed
    //
    //   {headline} / - Evidence: / - Missing: / - Next: / - Question:
    //
    // template. VOICE.STRAT-2026-05-10f removed `/tower` from that set ONE DAY
    // later, on the ground that the template "is a Brief violation by
    // construction" — see the comment on `shouldCompactSurface` in
    // `src/lib/agent/response-shape.ts`, which names Tower explicitly: "Tower
    // now preserves natural Atlas output and only applies safety repairs".
    //
    // So the labelled affordance is not an open question on this surface: it
    // was removed deliberately and is guarded elsewhere.
    //
    // The obvious repair — INVERTING the two assertions to `not.toMatch(/^-
    // Evidence:/m)` — was written, and then measured, and it is VACUOUS. Two
    // mutations that put the labelled lines back (re-adding `tower` to
    // `shouldCompactSurface`, and appending the labels in
    // `shapeAtlasVisibleResponse`) both made this case fail at
    // `expect(res.status).toBe(200)` instead: the route runs
    // `assertVisibleAnswerContract` over `response_text` and answers 422 on a
    // scaffolding label, so `response_text` can never carry one by the time a
    // test can read it. An assertion no mutation can reach is not coverage.
    //
    // What the two labels stood for is asserted instead, as substance rather
    // than as a literal: the evidence sentence and the recommended next step
    // both survive the shaping, unlabelled, in the model's own prose.
    expect(json.renderedResponse.response_text).toContain(
      'Portfolio KPI evidence shows gate slippage, sponsor ambiguity, and value-baseline risk.',
    );
    expect(json.renderedResponse.response_text).toContain(
      'I recommend opening Programs',
    );

    // NOT asserted here, deliberately, and this is the second thing measurement
    // changed: "the internal agent name never reaches the reader". It is true,
    // and it is defended twice — `BANNED_BRAND_RE` in
    // `src/lib/answer/shared-response-shaper.ts` rewrites Atlas to aVa upstream,
    // and `normalizeAtlasVisibleText` in `src/lib/atlas/rendered-response.ts`
    // then does it AGAIN, redundantly. Removing the second one changes nothing
    // observable: the response still reads "aVa can see the pressure stack".
    //
    // And with BOTH scrubs removed the route answers 422 rather than leaking the
    // name, because `assertVisibleAnswerContract` also bans it. So no single
    // mutation can make a brand assertion on a 200 response fail — it would fail
    // at the status line instead. An assertion in that position states a true
    // thing and guards nothing, so it is recorded here rather than written.

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

  // The reachable half of what the two deleted assertions were about. The
  // labelled Evidence/Next template is not merely absent from this surface —
  // the route REFUSES to display it, and nothing else in
  // `src/__tests__/integration` asserts that refusal on the Atlas route. The
  // mutation that proves this case is deleting the `visibleContract.passed`
  // block from `src/app/api/v1/atlas/ask/route.ts`: the route then answers 200
  // with the labelled text and this case fails.
  it('refuses to display an answer that carries scaffolding labels', async () => {
    runAtlasTurnDetailed.mockResolvedValue({
      threadId: 'atlas_thread_2',
      routeType: 'llm',
      intent: 'llm',
      response: 'Gate slippage is the pressure.\n- Evidence: three programs slipped.\n- Next: assign an owner.',
      suggestions: [],
      toolsUsed: [],
      signalId: null,
      observationId: 'obs_2',
      modelName: 'claude-opus-4-7',
      promptVersion: 'tower-w5-v1',
      toolResults: { programs: [], observations: [] },
    });

    const { POST } = await import('@/app/api/v1/atlas/ask/route');
    const res = await POST(makeRequest({
      message: 'Where is the pressure?',
      clientId: 'client_meridian',
    }));

    expect(res.status).toBe(422);

    const json = await res.json() as {
      error: string;
      violations: Array<{ id: string }>;
    };

    expect(json.error).toBe('visible_answer_contract_failed');
    expect(json.violations.map((v) => v.id)).toEqual(
      expect.arrayContaining(['scaffolding_label_evidence', 'scaffolding_label_next']),
    );
  });
});
