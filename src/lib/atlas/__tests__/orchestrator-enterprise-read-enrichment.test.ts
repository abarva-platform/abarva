/**
 * The orchestrator leads certain answers with an "Enterprise read:" block built
 * from the derived enterprise read artifact. That block is authored by us, not
 * by the model, and it is prepended *after* the answer producer has already run
 * its autonomous-decision scrub. This suite drives the real orchestrator turn
 * and asserts the authored block is governed like every other line we render:
 *
 *  - it passes `sanitizeAutonomousDecisionLanguage`, so an artifact phrased as a
 *    settled decision cannot reach a reader as one; and
 *  - it carries the artifact's own `dataQualityCaution`, so the read cannot be
 *    quoted more confidently than the read itself claims to be.
 *
 * `@/lib/ai-liability/human-decision-controls` is deliberately NOT mocked: the
 * real scrub has to run for these assertions to mean anything.
 */

const runAtlasLlm = jest.fn();
const appendAtlasTrace = jest.fn(async () => null);
const appendAtlasReasoningTrace = jest.fn(async () => null);
const createAtlasObservation = jest.fn(async () => "obs-enterprise-read");
const getOrCreateAtlasThread = jest.fn(async () => ({
  id: "thread-enterprise-read",
}));
const touchAtlasThread = jest.fn(async () => null);

jest.mock("@/lib/atlas/classifier", () => ({
  classifyAtlasIntent: jest.fn(() => ({ routeType: "llm", intent: "llm" })),
}));

jest.mock("@/lib/atlas/llm", () => ({
  runAtlasLlm,
}));

jest.mock("@/lib/atlas/tool-belt", () => ({
  query_tower_current_state: jest.fn(),
}));

jest.mock("@/lib/atlas/repository", () => ({
  appendAtlasTrace,
  appendAtlasReasoningTrace,
  createAtlasObservation,
  getOrCreateAtlasThread,
  touchAtlasThread,
}));

jest.mock("@/lib/atlas/value-grounding", () => ({
  buildAtlasGroundingDisclosure: jest.fn(() => "Grounding: Tower substrate."),
}));

const CAUTION =
  "Application inventory is 60% attested; vendor spend rows predate the latest close.";

function derivedEnterpriseRead(overrides?: {
  headline?: string;
  decision?: string;
  dataQualityCaution?: string | null;
}) {
  return {
    readId: "enterprise-read-demo",
    tenantKey: "skyharbor-air",
    tenantName: "Airline Demo",
    industry: "aviation",
    headline:
      overrides?.headline ??
      "Integration debt is the binding constraint on consolidation",
    executiveSummary: "Integration debt is the binding constraint.",
    architecturePattern: "hub-and-spoke",
    maturityRead: "emerging",
    whatThisMeans: "Sequencing matters more than scope.",
    confirmedTechnologyStack: ["Integration platform"],
    dataQualityCaution:
      overrides?.dataQualityCaution === undefined
        ? CAUTION
        : overrides.dataQualityCaution,
    northStar: "One governed integration layer",
    peerImplication: "Peers sequence integration before consolidation.",
    insights: [],
    matchedPatterns: [],
    recommendedMoves: [
      {
        title: "Integration backlog triage",
        owner: "Platform lead",
        decision:
          overrides?.decision ??
          "Atlas selected the integration platform for the consolidation wave.",
        expectedImpact: "not quantified",
      },
    ],
    source: {
      kind: "local_v4_derived_artifact" as const,
      path: "datasets/demo/derived-intelligence/enterprise-reads.json",
    },
  };
}

function llmTurn(read: ReturnType<typeof derivedEnterpriseRead> | null) {
  return {
    // The producer already scrubbed its own text; only the orchestrator's
    // authored prepend is under test here.
    response: "The portfolio is grounded on 30 initiatives and 12 vendors.",
    suggestions: [],
    toolsUsed: ["query_tower_current_state"],
    atlasMode: "grounded",
    fallbackReason: null,
    modelName: "claude-test",
    debugTrace: undefined,
    toolResults: { derivedEnterpriseRead: read },
  };
}

const ctx = {
  clientId: "client-demo",
  clientKey: "skyharbor",
  userId: "user-demo",
};

// Matches shouldLeadAtlasWithEnterpriseRead and no Tower factual-spine pattern.
const LEAD_MESSAGE = "what should i know";

describe("runAtlasTurnDetailed enterprise-read lead block", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("scrubs autonomous-decision language out of the authored lead block", async () => {
    runAtlasLlm.mockResolvedValue(llmTurn(derivedEnterpriseRead()));
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({ ctx, message: LEAD_MESSAGE });

    expect(result.response).toContain("Enterprise read:");
    expect(result.response).not.toContain("Atlas selected");
    expect(result.response).toContain(
      "The AI advisor recommended for human review",
    );
  });

  it("scrubs a headline phrased as a settled obligation", async () => {
    runAtlasLlm.mockResolvedValue(
      llmTurn(
        derivedEnterpriseRead({
          headline: "Leadership must approve the consolidation wave this quarter",
        }),
      ),
    );
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({ ctx, message: LEAD_MESSAGE });

    expect(result.response).not.toContain("must approve");
    expect(result.response).toContain("should review whether to");
  });

  it("carries the read's own data-quality caution into the lead block", async () => {
    runAtlasLlm.mockResolvedValue(llmTurn(derivedEnterpriseRead()));
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({ ctx, message: LEAD_MESSAGE });

    expect(result.response).toContain(CAUTION);
  });

  it("omits the caution line when the read declares none", async () => {
    runAtlasLlm.mockResolvedValue(
      llmTurn(derivedEnterpriseRead({ dataQualityCaution: null })),
    );
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({ ctx, message: LEAD_MESSAGE });

    expect(result.response).toContain("Enterprise read:");
    expect(result.response).not.toContain("Data quality caution");
  });

  it("leaves the answer untouched when no enterprise read is available", async () => {
    runAtlasLlm.mockResolvedValue(llmTurn(null));
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({ ctx, message: LEAD_MESSAGE });

    expect(result.response).toBe(
      "The portfolio is grounded on 30 initiatives and 12 vendors.",
    );
  });

  it("does not lead with the enterprise read on an unrelated question", async () => {
    runAtlasLlm.mockResolvedValue(llmTurn(derivedEnterpriseRead()));
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({
      ctx,
      message: "who owns the integration platform",
    });

    expect(result.response).not.toContain("Enterprise read:");
  });

  it("does not prepend a second lead block when the answer already carries it", async () => {
    const read = derivedEnterpriseRead();
    runAtlasLlm.mockResolvedValue({
      ...llmTurn(read),
      // The llm fallback path already emits the headline, scrubbed.
      response: `Airline Demo Enterprise read: ${read.headline}\n\nThe portfolio is grounded on 30 initiatives.`,
    });
    const { runAtlasTurnDetailed } = await import("@/lib/atlas/orchestrator");

    const result = await runAtlasTurnDetailed({ ctx, message: LEAD_MESSAGE });

    expect(result.response.match(/Enterprise read:/g)).toHaveLength(1);
  });
});

export {};
