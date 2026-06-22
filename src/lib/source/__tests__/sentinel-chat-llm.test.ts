import {
  buildSourceSentinelChatSystemPrompt,
  maybeCreateSourceSentinelChatLlmResponse,
  shouldUseSourceSentinelChatLlm,
  SOURCE_SENTINEL_CHAT_DEFAULT_MODEL,
} from "../sentinel-chat-llm";
import type { SourceLiveTenantContextSnapshot } from "../agent-context";
import type { SourceNexusApiStubResponse } from "../nexus-api";
import type { SourcingEventDetail } from "../types";

jest.mock("@/lib/integrations/ai-egress", () => ({
  preflightAnthropicDirectClient: jest.fn(),
}));

const { preflightAnthropicDirectClient } = jest.requireMock(
  "@/lib/integrations/ai-egress",
) as {
  preflightAnthropicDirectClient: jest.Mock;
};

const event = {
  id: "apex-retail-ams-outsourcing-2026",
  code: "SRC-APX-AMS-2026",
  name: "Apex Retail AMS Outsourcing 2026",
  accountName: "Apex Retail Group",
  archetype: "managed_services",
  rigor: "strategic",
  currentStageKey: "bafo",
  owner: "CIO Office",
  valueAtStakeUsd: 35_000_000,
  scorecard: {
    decisionOwner: "Carlos Rivera",
    criteria: [],
  },
} as unknown as SourcingEventDetail;

const liveTenantContext: SourceLiveTenantContextSnapshot = {
  clientKey: "apexretail",
  brokerTenantKey: "apex-retail",
  inventoryRecordCount: 403,
  contextChunkCount: 935,
  embeddedContextChunkCount: 935,
  sourceEventFound: true,
  segments: [],
  currentStateAreas: ["Vendor Contracts", "IT Landscape"],
  evidenceBasis: ["Vendor Contracts: live context loaded"],
  warnings: [],
  retrievedEvidence: [
    {
      id: "chunk:vendor_contracts:wipro",
      segmentId: "vendor_contracts",
      recordId: "vendor_contracts:apex:wipro",
      title: "Wipro AMS incumbent baseline",
      sourceType: "contextChunk",
      sourceDoc: "wipro-ams-contract-register.csv",
      excerpt:
        "claim: Wipro is the incumbent AMS vendor with a $32M baseline and Q3 2026 renewal window.",
      confidence: "high",
      score: 14,
    },
    {
      id: "chunk:it_landscape:ams",
      segmentId: "it_landscape",
      recordId: "it_landscape:apex:ams",
      title: "AMS scope systems",
      sourceType: "contextChunk",
      sourceDoc: "ams-application-scope.xlsx",
      excerpt:
        "claim: SAP ECC, Sterling OMS, and NCR POS are in the AMS scope.",
      confidence: "high",
      score: 13,
    },
  ],
};

const fallbackResponse = {
  ok: true,
  httpStatus: 200,
  requestId: "req-source-test",
  eventId: event.id,
  prompt: "Help me write the strategy memo from the event facts",
  mode: "event",
  generatedAt: "2026-06-04T00:00:00.000Z",
  noModel: true,
  answerStatus: "answered",
  contextScope: "event",
  contextQuality: null,
  context: {
    eventName: event.name,
    stageLabel: "BAFO",
    missingInputs: ["BAFO challenge log not approved"],
    blockers: [],
    selectedAttachmentIds: [],
  },
  sourceIntelligence: null,
  sourceAnswer: {
    engineVersion: "source-answer-engine/v1",
    mode: "cxo_guidance",
    title: "CXO guidance",
    answerText: "Deterministic fallback answer.",
    currentStateFindings: [],
    sourcingImplications: [],
    cxoGuidance: [],
    expertLens: [],
    riskTraps: [],
    missingData: [],
    recommendedNextAction: "Press incumbent on renewal leverage.",
    confidence: "medium",
    limits: [],
    evidenceCitations: [],
    responseParts: [],
    categoryStrategy: null,
    deliveryModelGate: null,
    shouldCostEstimate: null,
    proposalNormalization: null,
  },
  sentinelBriefing: null,
  multiAgentBriefing: null,
  nexusSummary: {
    title: "CXO guidance",
    summary: "Deterministic fallback answer.",
    primaryFinding: "Fallback.",
    recommendedNextAction: "Press incumbent on renewal leverage.",
    confidence: "medium",
  },
  suggestedActions: [],
  agentResponseParts: [],
  contextValidationSummary: null,
  workflowValidationSummary: null,
  warnings: [],
  defers: [],
  cannotProceedReasons: [],
  summary: "Deterministic fallback answer.",
} satisfies SourceNexusApiStubResponse;

describe("Source Sentinel chat LLM helper", () => {
  beforeEach(() => {
    preflightAnthropicDirectClient.mockReset();
  });

  it("keeps deterministic chat disabled unless the feature flag is explicit", () => {
    expect(shouldUseSourceSentinelChatLlm({} as NodeJS.ProcessEnv)).toBe(false);
    expect(
      shouldUseSourceSentinelChatLlm({
        SENTINEL_CHAT_USE_LLM: "false",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      shouldUseSourceSentinelChatLlm({
        SENTINEL_CHAT_USE_LLM: "true",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("builds a load-bearing event-grounded prompt with numbered evidence", () => {
    const prompt = buildSourceSentinelChatSystemPrompt({
      event,
      liveTenantContext,
      promptEvidence: [
        {
          label: "E1",
          citation: {
            id: "E1",
            label: "[E1] Wipro AMS incumbent baseline",
            segmentId: "vendor_contracts",
            recordId: "vendor_contracts:apex:wipro",
            sourceDoc: "wipro-ams-contract-register.csv",
            excerpt: "claim: Wipro is the incumbent AMS vendor.",
            confidence: "high",
          },
        },
      ],
      fallbackResponse,
    });

    expect(prompt).toContain(
      "assisting a senior IT sourcing executive at Apex Retail Group",
    );
    expect(prompt).toContain("one specific sourcing event");
    expect(prompt).toContain("Apex Retail AMS Outsourcing 2026");
    expect(prompt).toContain("Every material claim");
    expect(prompt).toContain("[E1]");
    expect(prompt).toContain(
      "Do not fall back to a generic sourcing checklist",
    );
    expect(prompt).toContain("AGENT OUTPUT CONTRACT v2026-06-05");
    expect(prompt).toContain(
      "CXO decision digest labels: My read; Why; Decision fork; What I would do next; Evidence gap",
    );
    expect(prompt).toContain("Simple factual questions stay simple");
  });

  it("upgrades the deterministic response with a cited model answer when enabled", async () => {
    preflightAnthropicDirectClient.mockResolvedValue({
      ok: true,
      client: {
        messages: {
          create: jest.fn().mockResolvedValue({
            model: SOURCE_SENTINEL_CHAT_DEFAULT_MODEL,
            usage: { input_tokens: 2100, output_tokens: 220 },
            content: [
              {
                type: "text",
                text: "Use the strategy memo to frame incumbent pressure around the $32M Wipro baseline [E1] and the SAP ECC / Sterling OMS / NCR POS scope [E2]. Next, press Wipro on renewal leverage before BAFO.",
              },
            ],
          }),
        },
      },
    });

    const response = await maybeCreateSourceSentinelChatLlmResponse({
      fallbackResponse,
      tenantId: "apex-retail",
      userId: "user-apex-source",
      prompt: fallbackResponse.prompt,
      event,
      liveTenantContext,
      env: {
        SENTINEL_CHAT_USE_LLM: "true",
        ANTHROPIC_API_KEY: "sk-ant-test",
      } as unknown as NodeJS.ProcessEnv,
    });

    expect(preflightAnthropicDirectClient).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: "source-sentinel-chat",
        model: SOURCE_SENTINEL_CHAT_DEFAULT_MODEL,
      }),
    );
    expect(response.noModel).toBe(false);
    expect(response.sourceAnswer?.answerText).toContain("$32M Wipro baseline");
    expect(
      response.sourceAnswer?.evidenceCitations.map((citation) => citation.id),
    ).toEqual(["E1", "E2"]);
    expect(response.summary).toBe(response.sourceAnswer?.answerText);
    expect(response.sourceAnswer?.limits).toEqual(
      expect.arrayContaining([
        `Generated by ${SOURCE_SENTINEL_CHAT_DEFAULT_MODEL}; human review required before external use.`,
        "Model usage: 2100 input tokens, 220 output tokens.",
      ]),
    );
  });

  it("keeps fallback visible when the LLM flag is enabled but the key is missing", async () => {
    const response = await maybeCreateSourceSentinelChatLlmResponse({
      fallbackResponse,
      tenantId: "apex-retail",
      userId: "user-apex-source",
      prompt: fallbackResponse.prompt,
      event,
      liveTenantContext,
      env: {
        SENTINEL_CHAT_USE_LLM: "true",
      } as unknown as NodeJS.ProcessEnv,
    });

    expect(response.noModel).toBe(true);
    expect(response.warnings).toContain(
      "Sentinel chat LLM is enabled but ANTHROPIC_API_KEY is not configured; returned deterministic fallback.",
    );
    expect(preflightAnthropicDirectClient).not.toHaveBeenCalled();
  });

  it("flags model answers that do not cite loaded evidence", async () => {
    preflightAnthropicDirectClient.mockResolvedValue({
      ok: true,
      client: {
        messages: {
          create: jest.fn().mockResolvedValue({
            model: SOURCE_SENTINEL_CHAT_DEFAULT_MODEL,
            usage: { input_tokens: 2000, output_tokens: 120 },
            content: [
              {
                type: "text",
                text: "Use BAFO to press the incumbent and keep the strategy memo brief.",
              },
            ],
          }),
        },
      },
    });

    const response = await maybeCreateSourceSentinelChatLlmResponse({
      fallbackResponse,
      tenantId: "apex-retail",
      userId: "user-apex-source",
      prompt: fallbackResponse.prompt,
      event,
      liveTenantContext,
      env: {
        SENTINEL_CHAT_USE_LLM: "true",
        ANTHROPIC_API_KEY: "sk-ant-test",
      } as unknown as NodeJS.ProcessEnv,
    });

    expect(response.noModel).toBe(false);
    expect(response.sourceAnswer?.evidenceCitations).toEqual([]);
    expect(response.warnings).toContain(
      "Citation gap: Sentinel used the LLM path but returned no event evidence citations. Treat as non-decision-grade until cited.",
    );
  });
});
