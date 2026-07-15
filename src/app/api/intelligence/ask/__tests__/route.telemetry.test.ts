import { POST } from '../route';
import { askIntelligence } from '@/lib/intelligence/ask';
import { recordSynthesisEvent } from '@/lib/reasoning/synthesis-telemetry';

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(async () => ({ id: "user-1" })),
}));

jest.mock("@/lib/auth/maestro", () => ({
  getCurrentPerson: jest.fn(async () => null),
}));

jest.mock("@/lib/agent/prompts/_shared/user-context", () => ({
  assembleUserContextBlock: jest.fn(async () => ""),
}));

jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveTenant: jest.fn(async () => ({
    clientId: "client-1",
    canonicalKey: "apex-retail",
    appClientKey: "apexretail",
    displayName: "Apex Retail Group",
  })),
}));

jest.mock("@/lib/intelligence/ask/session-memory", () => ({
  appendAskSessionTurn: jest.fn(async () => undefined),
  normalizeAskTabId: jest.fn((tabId) => tabId ?? "tab-1"),
  prepareAskSessionMemory: jest.fn(async () => ({
    sessionId: "ask-session-1",
    tabId: "tab-1",
    priorTurnCount: 0,
    contextBlock: "",
  })),
}));

jest.mock("@/lib/agents/sentinel-reasoning", () => ({
  classifySentinelIntent: jest.fn(async () => ({
    intent: "general",
    confidence: 0.8,
    matchedPatternSlugs: [],
  })),
  runSentinelReasoning: jest.fn(),
}));

jest.mock("@/lib/intelligence/ask", () => ({
  askIntelligence: jest.fn(async function* () {
    yield {
      type: "sources",
      sources: [
        { type: "PATTERN", id: "pattern-1", name: "Pattern", detail: "detail" },
      ],
    };
    yield { type: "delta", text: "A useful aVa answer." };
    yield { type: "done" };
  }),
}));

jest.mock("@/lib/reasoning/synthesis-telemetry", () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: "tlm_intelligence_1" })),
}));

jest.mock("@/lib/reasoning/telemetry-init", () => ({}));

function makeRequest(body: unknown) {
  return {
    json: async () => body,
    cookies: { get: () => undefined },
  };
}

const tenantAskCases = [
  {
    client: "apexretail",
    canonicalKey: "apex-retail",
    displayName: "Apex Retail Group",
    query: "Which AI investments should Apex scale before holiday readiness?",
    expectedPrefix: "xp.retail.",
    disallowedPrefixes: [
      "xp.airline.",
      "xp.financial-services-banking.",
      "xp.healthcare-provider.",
    ],
  },
  {
    client: "skyharbor",
    canonicalKey: "skyharbor-air",
    displayName: "SkyHarbor Air",
    query:
      "What should SkyHarbor benchmark against for AI-assisted mainframe modernization?",
    expectedPrefix: "xp.airline.",
    disallowedPrefixes: [
      "xp.financial-services-banking.",
      "xp.healthcare-provider.",
      "xp.retail.",
    ],
  },
  {
    client: "meridian",
    canonicalKey: "meridian-health",
    displayName: "Meridian Health System",
    query:
      "What should Meridian do about Epic revenue cycle denials and workflow leakage?",
    expectedPrefix: "xp.healthcare-provider.",
    disallowedPrefixes: [
      "xp.airline.",
      "xp.financial-services-banking.",
      "xp.retail.",
    ],
  },
  {
    client: "arcturus",
    canonicalKey: "first-capital",
    displayName: "First Capital",
    query:
      "Which AI controls should First Capital prioritize for fraud and financial crime modernization?",
    expectedPrefix: "xp.financial-services-banking.",
    disallowedPrefixes: [
      "xp.airline.",
      "xp.healthcare-provider.",
      "xp.retail.",
    ],
  },
  {
    client: "lakeshore",
    canonicalKey: "lakeshore-holdings",
    displayName: "Lakeshore Holdings",
    query:
      "What supply chain resilience questions should Lakeshore prioritize across its portfolio?",
    expectedPrefix: "xp.x.",
    disallowedPrefixes: [
      "xp.airline.",
      "xp.financial-services-banking.",
      "xp.healthcare-provider.",
      "xp.retail.",
    ],
  },
] as const;

async function readResponseText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

describe("POST /api/intelligence/ask telemetry", () => {
  it("records an Intelligence telemetry event and emits its id on the done event", async () => {
    const response = await POST(
      makeRequest({
        q: "What should we sequence?",
        client: "apexretail",
      }) as never,
    );
    const text = await readResponseText(response);

    expect(recordSynthesisEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: "intelligence",
        tenantId: "client-1",
        instanceId: "ask-session-1",
        patternId: "pattern-1",
        citationCount: 1,
      }),
    );
    expect(text).toContain('"type":"done"');
    expect(text).toContain('"telemetryEventId":"tlm_intelligence_1"');
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

  it("does not expose raw advisory trace events or internal data-state language", async () => {
    (askIntelligence as jest.Mock).mockImplementationOnce(async function* () {
      yield {
        type: "sources",
        sources: [
          {
            type: "TENANT",
            id: "v7_02_business_functions",
            name: "V7 Business functions",
            detail:
              "Loaded substrate: 442 business records and 118 retrieval chunks. Transcript governance is not_loaded.",
          },
        ],
      };
      yield {
        type: "intelligence-dossier",
        intelligenceDossier: {
          tenantEvidenceDossier: {
            sections: [{ id: "s1" }],
            confidence: "strong",
          },
          evidenceBoundary: { missingTenantEvidence: [{}] },
          decisionOptionsDossier: { options: [{ id: "o1" }] },
        },
      };
      yield {
        type: "advisory-packet",
        advisoryPacket: {
          auditLineage: { sourceRefs: [{ id: "v7_01" }] },
          modelVisiblePacket: { tenantFacts: [{ id: "f1" }], gaps: [{}] },
          retrievalDiagnostics: { warningCount: 0 },
        },
      };
      yield {
        type: "delta",
        text: "Transcript governance is not loaded in the V7 substrate.",
      };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "For Meridian agent assist, rank the top opportunities.",
        client: "meridian",
        traceEnabled: true,
      }) as never,
    );
    const text = await readResponseText(response);

    expect(text).toContain('"type":"context-summary"');
    expect(text).toContain("not yet evidenced");
    expect(text).not.toMatch(
      /intelligence-dossier|advisory-packet|not loaded|not_loaded|V7|substrate|business records|retrieval chunks|v7_02/i,
    );
  });
});
