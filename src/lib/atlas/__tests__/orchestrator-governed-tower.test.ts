const queryTowerCurrentState = jest.fn();
const runAtlasLlm = jest.fn();
const answerCioTowerQuestion = jest.fn();
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

jest.mock("@/lib/cio-tower/answer", () => ({
  answerCioTowerQuestion,
  canonicalCioTowerTenantKey: jest.fn((value: string) =>
    value === "skyharbor" || value === "skyharbor-air" ? "skyharbor-air" : value,
  ),
}));

jest.mock("@/lib/cio-tower/metric-packet", () => ({
  canonicalCioTowerTenantDisplayName: jest.fn(
    ({ key, name }: { key?: string | null; name?: string | null }) =>
      key === "skyharbor-air" || name === "Airline Demo" ? "SkyHarbor Air" : name,
  ),
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

const towerState = {
  client: {
    clientId: "client-skyharbor",
    clientName: "Airline Demo",
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
    answerCioTowerQuestion.mockResolvedValue({
      response:
        "Top 10 IT programs at SkyHarbor Air, ranked by budget and value proof.",
      modelOutputRaw: JSON.stringify({
        answer:
          "Top 10 IT programs at SkyHarbor Air, ranked by budget and value proof.",
      }),
      promptPackageKey: "prompt-governed",
      traceKey: "trace-governed",
      model: "deterministic-cio-tower-boundary-v1",
    });
  });

  it("routes top-program questions through the governed CIO Tower answer contract", async () => {
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

    expect(answerCioTowerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "skyharbor-air",
        tenantName: "SkyHarbor Air",
        question: "give me the list of top 10 IT programs",
      }),
    );
    expect(runAtlasLlm).not.toHaveBeenCalled();
    expect(result.response).toContain("Top 10 IT programs at SkyHarbor Air");
    expect(result.response).not.toContain("Airline Demo");
    expect(result.toolsUsed).toContain("answer_cio_tower_question");
    expect(result.debugTrace?.rawModelResponse).toContain("SkyHarbor Air");
  });

  it("routes advisor-posture questions through the governed CIO Tower answer contract", async () => {
    answerCioTowerQuestion.mockResolvedValueOnce({
      response:
        "SkyHarbor Air should inspect before scaling Engineering Productivity AI.",
      modelOutputRaw: JSON.stringify({
        answer:
          "SkyHarbor Air should inspect before scaling Engineering Productivity AI.",
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

    expect(answerCioTowerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "skyharbor-air",
        tenantName: "SkyHarbor Air",
        question:
          "Which investment posture should the CIO take on Engineering Productivity AI, and why?",
      }),
    );
    expect(runAtlasLlm).not.toHaveBeenCalled();
    expect(result.response).toContain("inspect before scaling");
    expect(result.toolsUsed).toContain("answer_cio_tower_question");
    expect(result.debugTrace?.finalPrompt).toBe("prompt-governed-posture");
  });
});
