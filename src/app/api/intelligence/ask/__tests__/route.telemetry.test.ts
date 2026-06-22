import { POST } from '../route';
import {
  classifySentinelIntent,
  runSentinelReasoning,
} from '@/lib/agents/sentinel-reasoning';
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

  it('emits AgentAnswer attribution without inferring exhibits for the Sentinel reasoning path', async () => {
    jest.mocked(classifySentinelIntent).mockResolvedValueOnce({
      intent: 'it_productivity',
      confidence: 0.91,
      entities: ['Apex Retail Group'],
      matchedPatternSlugs: ['ai-productivity-value-gate'],
      citations: [],
      reason: 'IT productivity question',
    });
    jest.mocked(runSentinelReasoning).mockImplementationOnce(async function* () {
      yield {
        id: 'clarify',
        name: 'Clarify',
        sequence: 1,
        content:
          'Apex should stage a $590K productivity-AI portfolio and hold $120K until telemetry proves adoption.',
        citations: [
          {
            id: 'PAT-AI-001',
            label: 'AI productivity value gate',
            sourceType: 'corpus_pattern',
            version: 1,
            detail: 'Require telemetry before scaling AI productivity claims.',
          },
        ],
        confidence: 0.82,
        dataClass: 'internal',
        clientId: 'client-1',
        corpusVersionPinned: 1,
        templateVersionPinned: 1,
        traceId: 'trace-1',
      };
    });

    const response = await POST(
      makeRequest({ q: 'Show Apex AI productivity spend as a table', client: 'apexretail' }) as never,
    );
    const text = await readResponseText(response);
    const events = text
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const agentAnswer = events.find((event) => event.type === 'agent-answer')?.answer;

    expect(agentAnswer).toBeTruthy();
    expect(agentAnswer.tables).toEqual([
      expect.objectContaining({
        id: 'answer-source-register',
        title: 'Evidence Used',
      }),
    ]);
    expect(agentAnswer.tables[0].rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: '$590K' }),
        expect.objectContaining({ value: '$120K' }),
      ]),
    );
    expect(agentAnswer.charts).toEqual([]);
    expect(agentAnswer.citations[0]).toEqual(
      expect.objectContaining({
        recordId: 'PAT-AI-001',
        sourceClass: 'corpus-pattern',
      }),
    );
    expect(text).toContain('"type":"done"');
  });

  it('uses tenant industry when routing AgentAnswer experts for Apex exhibits', async () => {
    jest.mocked(askIntelligence).mockImplementationOnce(async function* () {
      yield {
        type: 'sources',
        sources: [
          {
            type: 'TENANT',
            id: 'APX-INIT-001',
            name: 'Apex Retail AI investment substrate',
            detail:
              'Retail lakehouse and inventory graph has $95M committed and $12M realized for Apex Retail.',
          },
        ],
      };
      yield {
        type: 'delta',
        text:
          'Apex should scale inventory truth first: the retail lakehouse and customer inventory graph has $95M committed and $12M realized.',
      };
      yield { type: 'done' };
    });

    const response = await POST(
      makeRequest({
        q: 'Which AI investments should Apex scale before holiday readiness?',
        client: 'apexretail',
      }) as never,
    );
    const text = await readResponseText(response);
    const events = text
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const agentAnswer = events.find((event) => event.type === 'agent-answer')?.answer;
    const expertIds = agentAnswer.contributingExperts.map(
      (expert: { id: string }) => expert.id,
    );

    expect(expertIds).toEqual(
      expect.arrayContaining([
        'xp.retail.merchandising-pricing',
        'xp.retail.store-operations',
      ]),
    );
    expect(expertIds).not.toContain(
      'xp.healthcare-provider.clinical-process-transformation',
    );
  });
});
