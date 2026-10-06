/**
 * The control under test: a Tower factual-spine question must be answered by the
 * GOVERNED Tower answer contract, not by free LLM composition.
 *
 * This suite previously mocked `@/lib/cio-tower/answer` and
 * `@/lib/cio-tower/metric-packet`. The orchestrator imports neither: it calls
 * `answerCurrentTowerQuestion` from `@/lib/tower/current-layer-answer`
 * (orchestrator.ts:44, :289) and both canonicalizers from
 * `@/lib/tower/metric-packet` (:41, :43). Because the mock intercepted nothing,
 * the real answer contract ran and opened a Postgres session
 * (`azure_read_adapter_no_connection`), so the suite could only ever be red
 * here and would have performed live tenant reads anywhere DATABASE_URL is set.
 * The boundary below is the one the orchestrator actually resolves.
 *
 * The canonicalizers are deliberately NOT mocked. They are pure lookup tables,
 * and the old mocks hand-fed "skyharbor-air"/"Airline Demo" — values the real
 * table does not produce. Letting them run is what makes the cover-name
 * assertion mean something.
 */
const queryTowerCurrentState = jest.fn();
const runAtlasLlm = jest.fn();
const answerCurrentTowerQuestion = jest.fn();
const appendAtlasTrace = jest.fn(async () => null);
const appendAtlasReasoningTrace = jest.fn(async () => null);
const createAtlasObservation = jest.fn(async () => "obs-governed");
const getOrCreateAtlasThread = jest.fn(async () => ({ id: "thread-governed" }));
const touchAtlasThread = jest.fn(async () => null);

jest.mock("@/lib/atlas/classifier", () => ({
  classifyAtlasIntent: jest.fn(() => ({ routeType: "llm", intent: "llm" })),
}));

jest.mock("@/lib/atlas/llm", () => ({
  runAtlasLlm,
}));

jest.mock("@/lib/atlas/tool-belt", () => ({
  query_tower_current_state: queryTowerCurrentState,
}));

// The boundary the orchestrator actually imports. Keeps every tenant read out
// of this process; nothing here may reach Postgres.
jest.mock("@/lib/tower/current-layer-answer", () => ({
  answerCurrentTowerQuestion,
}));

jest.mock("@/lib/atlas/repository", () => ({
  appendAtlasTrace,
  appendAtlasReasoningTrace,
  createAtlasObservation,
  getOrCreateAtlasThread,
  touchAtlasThread,
}));

jest.mock("@/lib/tower/atlas-pattern-selectors", () => ({
  selectAtlasPatterns: jest.fn(() => ({
    leadPattern: "governed-tower-contract",
    secondaryPatterns: [],
  })),
}));

jest.mock("@/lib/atlas/value-grounding", () => ({
  buildAtlasGroundingDisclosure: jest.fn(() => null),
}));

// Canonical values produced by the REAL table in src/lib/tower/metric-packet.ts:
// every "skyharbor*" alias maps to this key, and the key maps to this
// demo-safe display name. The legacy label below must never reach the contract.
const CANONICAL_TENANT_KEY = "skyharbor_global";
const CANONICAL_TENANT_NAME = "SkyHarbor Global";
const LEGACY_TENANT_LABEL = "SkyHarbor Air";

const towerState = {
  client: {
    clientId: "client-skyharbor",
    clientName: LEGACY_TENANT_LABEL,
    tenantKey: "skyharbor-air",
    industryCode: "GENERAL",
  },
  todayIso: "2026-07-01",
  activeLens: "value",
  substrateCounts: {
    initiatives: 30,
    vendors: 12,
    kpiSnapshots: 0,
    decisions: 0,
    scenarios: 0,
    stakeholderNotes: 0,
    pressures: 0,
    observations: 0,
    alignmentDots: 0,
  },
  bandMetrics: { metrics: [] },
  pressuresView: { cards: [] },
  atlasObservationsView: { observations: [] },
  alignment2x2View: { dots: [], strategicBets: [], totalPlotted: 0 },
  budgetRollups: [],
  initiatives: [],
  vendors: [],
  kpiSnapshots: [],
  decisions: [],
  scenarios: [],
  stakeholderNotes: [],
};

describe("runAtlasTurnDetailed governed Tower path", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryTowerCurrentState.mockResolvedValue(towerState);
    answerCurrentTowerQuestion.mockResolvedValue({
      response: `Top 10 IT programs at ${CANONICAL_TENANT_NAME}, ranked by budget and value proof.`,
      modelOutputRaw: JSON.stringify({
        answer: `Top 10 IT programs at ${CANONICAL_TENANT_NAME}, ranked by budget and value proof.`,
      }),
      promptPackageKey: "prompt-governed",
      traceKey: "trace-governed",
      model: "deterministic-cio-tower-boundary-v1",
    });
    runAtlasLlm.mockResolvedValue({
      modelName: "free-composition-model",
      toolResults: {},
      response: "Free-composition answer.",
      suggestions: [],
      toolsUsed: [],
      atlasMode: "live",
      fallbackReason: null,
      debugTrace: undefined,
    });
  });

  it("routes top-program questions through the governed Tower answer contract", async () => {
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({
      ctx: {
        clientId: "client-skyharbor",
        clientKey: "skyharbor",
        userId: "user-skyharbor",
      },
      message: "give me the list of top 10 IT programs",
      surfaceContext: { traceMode: true },
    });

    expect(answerCurrentTowerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: CANONICAL_TENANT_KEY,
        tenantName: CANONICAL_TENANT_NAME,
        question: "give me the list of top 10 IT programs",
      }),
    );
    // The control: the free-composition path must not have been taken.
    expect(runAtlasLlm).not.toHaveBeenCalled();
    expect(result.toolsUsed).toContain("answer_current_tower_question");
    expect(result.response).toContain("Top 10 IT programs");
    expect(result.debugTrace?.rawModelResponse).toContain(
      CANONICAL_TENANT_NAME,
    );
  });

  it("routes advisor-posture questions through the governed Tower answer contract", async () => {
    answerCurrentTowerQuestion.mockResolvedValueOnce({
      response: `${CANONICAL_TENANT_NAME} should inspect before scaling Engineering Productivity AI.`,
      modelOutputRaw: JSON.stringify({
        answer: `${CANONICAL_TENANT_NAME} should inspect before scaling Engineering Productivity AI.`,
      }),
      promptPackageKey: "prompt-governed-posture",
      traceKey: "trace-governed-posture",
      model: "deterministic-cio-tower-boundary-v1",
    });

    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({
      ctx: {
        clientId: "client-skyharbor",
        clientKey: "skyharbor",
        userId: "user-skyharbor",
      },
      message:
        "Which investment posture should the CIO take on Engineering Productivity AI, and why?",
      surfaceContext: { traceMode: true },
    });

    expect(answerCurrentTowerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: CANONICAL_TENANT_KEY,
        tenantName: CANONICAL_TENANT_NAME,
        question:
          "Which investment posture should the CIO take on Engineering Productivity AI, and why?",
      }),
    );
    expect(runAtlasLlm).not.toHaveBeenCalled();
    expect(result.toolsUsed).toContain("answer_current_tower_question");
    expect(result.response).toContain("inspect before scaling");
    expect(result.debugTrace?.finalPrompt).toBe("prompt-governed-posture");
  });

  /**
   * Negative control. Without this, a mutation that routes EVERY question to the
   * governed contract passes both cases above. The gate has to be able to say no.
   */
  it("leaves a non-factual-spine question on the free-composition path", async () => {
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    await runAtlasTurnDetailed({
      ctx: {
        clientId: "client-skyharbor",
        clientKey: "skyharbor",
        userId: "user-skyharbor",
      },
      message: "Summarise the stakeholder meeting notes from last week.",
      surfaceContext: { traceMode: true },
    });

    expect(answerCurrentTowerQuestion).not.toHaveBeenCalled();
    expect(runAtlasLlm).toHaveBeenCalled();
  });

  /**
   * Cover-name discipline: the legacy label is what the tower state carries, and
   * canonicalization is the only thing that stops it reaching the answer
   * contract. Asserted against the real lookup table, not a mocked one.
   */
  it("canonicalizes the legacy tenant label before the governed contract sees it", async () => {
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({
      ctx: {
        clientId: "client-skyharbor",
        clientKey: "skyharbor",
        userId: "user-skyharbor",
      },
      message: "what is the total budget across all programs",
      surfaceContext: { traceMode: true },
    });

    const [callArgs] = answerCurrentTowerQuestion.mock.calls;
    expect(callArgs[0].tenantName).toBe(CANONICAL_TENANT_NAME);
    expect(callArgs[0].tenantName).not.toBe(LEGACY_TENANT_LABEL);
    expect(callArgs[0].tenantKey).toBe(CANONICAL_TENANT_KEY);
    expect(result.response).not.toContain(LEGACY_TENANT_LABEL);
  });
});
