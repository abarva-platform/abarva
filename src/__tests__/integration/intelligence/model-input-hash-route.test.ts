import { NextRequest } from 'next/server';
import { hashModelInput } from '@/lib/agent-trace/redaction';

const askIntelligence = jest.fn();
const emitAgentContextTraceAsync = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn().mockResolvedValue({ id: 'user-test', publicMetadata: {} }),
}));
jest.mock('@/lib/auth/maestro', () => ({ getCurrentPerson: jest.fn().mockResolvedValue(null) }));
jest.mock('@/lib/tenant/resolveTenant', () => ({
  resolveTenant: jest.fn().mockResolvedValue({
    clientId: 'tenant-test',
    canonicalKey: 'tenant-test',
    appClientKey: 'tenant-test',
    displayName: 'Test tenant',
  }),
}));
jest.mock('@/lib/intelligence/ask', () => ({ askIntelligence }));
jest.mock('@/lib/intelligence/ask/session-memory', () => ({
  prepareAskSessionMemory: jest.fn().mockResolvedValue(null),
  appendAskSessionTurn: jest.fn().mockResolvedValue(undefined),
  normalizeAskTabId: jest.fn((tabId: string) => tabId),
}));
jest.mock('@/lib/agents/sentinel-reasoning', () => ({
  classifySentinelIntent: jest.fn().mockResolvedValue({
    intent: 'general', confidence: 1, matchedPatternSlugs: [],
  }),
}));
jest.mock('@/lib/agent-trace', () => ({
  buildAvaTrace: jest.requireActual('@/lib/agent-trace/build').buildAvaTrace,
  hashModelInput: jest.requireActual('@/lib/agent-trace/redaction').hashModelInput,
  emitAgentContextTraceAsync,
}));
jest.mock('@/lib/agent-claims', () => ({
  validateClaimsAndCitations: jest.fn().mockReturnValue({
    claimValidationStatus: 'passed',
    tenantIsolationStatus: 'passed',
    unsupportedClaims: [],
    namespaceFindings: [],
    tenantLeakage: [],
  }),
}));
jest.mock('@/lib/reasoning/synthesis-telemetry', () => ({
  recordSynthesisEvent: jest.fn().mockReturnValue({ id: 'event-test' }),
}));
jest.mock('@/lib/reasoning/telemetry-init', () => ({}));
jest.mock('@/lib/agent/product-truth', () => ({
  applyProductTruthRuntimeGuard: jest.fn((text: string) => ({ text })),
  productTruthGroundingText: jest.fn().mockReturnValue(''),
}));
jest.mock('@/lib/intelligence/ask/retired-fact-gate', () => ({
  scanRetiredFacts: jest.fn().mockReturnValue([]),
}));
jest.mock('@/lib/intelligence/ask/tenant-fence-answer', () => ({
  shouldFenceForeignTenantQuery: jest.fn().mockReturnValue(false),
}));
jest.mock('@/lib/home/know/home-know-agent-answer', () => ({
  shouldUseHomeKnowAgentAnswer: jest.fn().mockReturnValue(false),
}));
jest.mock('@/lib/source/ava/source-workspace-visual-answer', () => ({
  canBuildSourceContractOptimizationExportAnswer: jest.fn().mockReturnValue(false),
  canBuildSourceWorkspaceVisualAnswer: jest.fn().mockReturnValue(false),
}));
jest.mock('@/lib/features/is-feature-enabled', () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(false),
}));
jest.mock('@/lib/intelligence/answer/router', () => ({
  routeQuestion: jest.fn().mockReturnValue({ outputShape: 'answer' }),
}));
jest.mock('@/lib/intelligence/ask/advisor-composer', () => ({
  advisorRequiredArtifactForQuery: jest.fn().mockReturnValue(null),
  withAdvisorSupportSources: jest.fn((_query: string, sources: unknown[]) => sources),
}));
jest.mock('@/lib/intelligence/answer/structured-exhibits', () => ({
  buildStructuredExhibits: jest.fn(({ prose }: { prose: string }) => ({
    prose, tables: [], charts: [], graphs: [], citations: [], followups: [],
  })),
  hasRenderableStructuredExhibits: jest.fn().mockReturnValue(false),
}));
jest.mock('@/lib/intelligence/answer/structured-fence-stream-filter', () => ({
  createStructuredFenceStreamFilter: jest.fn(() => ({
    push: (text: string) => text,
    flush: () => '',
  })),
  stripGovernedArtifactPayloadsFromText: jest.fn((text: string) => text),
}));
jest.mock('@/lib/intelligence/tabbed-response', () => ({
  parseIntelligenceTabbedResponse: jest.fn((text: string) => ({
    mainAnswer: text, rawText: text, tabs: [],
  })),
}));
jest.mock('@/lib/ava-answer/composeAvaAnswer', () => ({
  composeAvaAnswer: jest.fn((answer: unknown) => answer),
}));

describe('Intelligence Ask model input trace', () => {
  it('hashes the input observed by generation and emits it with the rendered answer', async () => {
    const firstInput = { system: 'system instruction', user: 'first model input' };
    const finalInput = { system: 'system instruction', user: 'final model input' };
    askIntelligence.mockImplementation(async function* (_query, options) {
      options.onModelInput?.(firstInput);
      options.onModelInput?.(finalInput);
      yield { type: 'delta', text: 'Generated answer.' };
    });

    const { POST } = await import('@/app/api/intelligence/ask/route');
    const response = await POST(new NextRequest('http://localhost/api/intelligence/ask', {
      method: 'POST',
      body: JSON.stringify({ q: 'A question' }),
      headers: { 'content-type': 'application/json' },
    }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('Generated answer.');
    expect(emitAgentContextTraceAsync).toHaveBeenCalledTimes(1);
    const trace = emitAgentContextTraceAsync.mock.calls[0][0];
    expect(trace.model_input_hash).toBe(hashModelInput(finalInput));
    expect(trace.model_input_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(trace)).not.toContain(finalInput.user);
  });
});
