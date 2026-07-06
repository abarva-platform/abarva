import { POST } from '../route';
import { askIntelligence } from '@/lib/intelligence/ask';
import { recordSynthesisEvent } from '@/lib/reasoning/synthesis-telemetry';

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(async () => ({ id: 'user-1' })),
}));

jest.mock('@/lib/auth/maestro', () => ({
  getCurrentPerson: jest.fn(async () => null),
}));

jest.mock('@/lib/agent/prompts/_shared/user-context', () => ({
  assembleUserContextBlock: jest.fn(async () => ''),
}));

jest.mock('@/lib/tenant/resolveTenant', () => ({
  resolveTenant: jest.fn(async () => ({
    clientId: 'client-1',
    canonicalKey: 'apex-retail',
    appClientKey: 'apexretail',
    displayName: 'Apex Retail Group',
  })),
}));

jest.mock('@/lib/intelligence/ask/session-memory', () => ({
  appendAskSessionTurn: jest.fn(async () => undefined),
  normalizeAskTabId: jest.fn((tabId) => tabId ?? 'tab-1'),
  prepareAskSessionMemory: jest.fn(async () => ({
    sessionId: 'ask-session-1',
    tabId: 'tab-1',
    priorTurnCount: 0,
    contextBlock: '',
  })),
}));

jest.mock('@/lib/agents/sentinel-reasoning', () => ({
  classifySentinelIntent: jest.fn(async () => ({
    intent: 'general',
    confidence: 0.8,
    matchedPatternSlugs: [],
  })),
  runSentinelReasoning: jest.fn(),
}));

jest.mock('@/lib/intelligence/ask', () => ({
  askIntelligence: jest.fn(async function* () {
    yield {
      type: 'sources',
      sources: [{ type: 'PATTERN', id: 'pattern-1', name: 'Pattern', detail: 'detail' }],
    };
    yield { type: 'delta', text: 'A useful Sentinel answer.' };
    yield { type: 'done' };
  }),
}));

jest.mock('@/lib/reasoning/synthesis-telemetry', () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: 'tlm_sentinel_1' })),
}));

jest.mock('@/lib/reasoning/telemetry-init', () => ({}));

function makeRequest(body: unknown) {
  return {
    json: async () => body,
    cookies: { get: () => undefined },
  };
}

async function readResponseText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

describe('POST /api/intelligence/ask telemetry', () => {
  it('records a sentinel telemetry event and emits its id on the done event', async () => {
    const response = await POST(makeRequest({ q: 'What should we sequence?', client: 'apexretail' }) as never);
    const text = await readResponseText(response);

    expect(recordSynthesisEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: 'sentinel',
        tenantId: 'client-1',
        instanceId: 'ask-session-1',
        patternId: 'pattern-1',
        citationCount: 1,
      }),
    );
    expect(text).toContain('"type":"done"');
    expect(text).toContain('"telemetryEventId":"tlm_sentinel_1"');
  });

  it('forwards trace-enabled requests into the Intelligence synthesis path', async () => {
    const response = await POST(makeRequest({
      q: 'Where should we fund AI first?',
      client: 'apexretail',
      traceEnabled: true,
      surfaceContext: {
        activeTab: 'intelligence',
        clientKey: 'apexretail',
        pageFacts: ['Apex Retail context lens: AI portfolio'],
      },
    }) as never);
    await readResponseText(response);

    expect(askIntelligence).toHaveBeenCalledWith(
      'Where should we fund AI first?',
      expect.objectContaining({
        traceEnabled: true,
        traceSession: expect.objectContaining({
          question: 'Where should we fund AI first?',
        }),
        surfaceContext: expect.objectContaining({
          activeTab: 'intelligence',
          pageFacts: ['Apex Retail context lens: AI portfolio'],
        }),
      }),
    );
  });
});
