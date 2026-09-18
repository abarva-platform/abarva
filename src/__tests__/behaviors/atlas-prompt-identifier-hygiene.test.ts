/**
 * Backlog item 17 — the Atlas prompt must be clean by construction.
 *
 * `runAtlasLlm` assembles a user message that tells the model, in its own
 * words, not to expose "raw IDs, UUIDs, file names, table names, source keys,
 * JSON, or internal field names" — and then appends the full tool-result map as
 * pretty-printed JSON under a line advertising it as being there "for exact IDs
 * and auditability".
 *
 * The only thing standing between a tenant identifier and the model is
 * `sanitizeForTenantPrompt`, which rewrites *string values* matching two
 * shapes — a v1-v5 UUID, and a `AA-BB-123` style program code — and redacts by
 * key name only for secrets. Every other identifier the tool belt actually
 * returns (`programs[].id`, `useCases[].id`, `signals[].signalKey`,
 * `client.clientId`, `initiativeDisplayId`, a retrieved chunk's `sourceKey`)
 * reaches the model verbatim.
 *
 * That is the "or the output gate catches IDs" half of the acceptance being
 * asked to carry the whole load, and it is the weaker half: the gate is a
 * regex over prose, while the prompt hands the model the identifiers and then
 * asks it not to use them. This suite asserts the preferred half instead — the
 * context is clean before it is sent.
 *
 * These cases drive the real `runAtlasLlm` and read the prompt actually handed
 * to the audited Anthropic client. The tool belt, retrieval and the dossier
 * loader are mocked because they are I/O; the prompt assembly and
 * `sanitizeForTenantPrompt` are NOT mocked — they are the subject.
 */

// This file declares module-scoped fixtures; without an export it is a script
// and its names collide with other test files in the same program.
export {};

const queryTowerCurrentState = jest.fn();
const queryPortfolioAggregates = jest.fn();
const querySignals = jest.fn();
const queryPrograms = jest.fn();
const queryUseCases = jest.fn();
const queryCohortBenchmarks = jest.fn();
const querySignalEvidence = jest.fn();
const assembleRetrievalContext = jest.fn();
const getDerivedEnterpriseReadForTenant = jest.fn();
const buildAtlasValueGrounding = jest.fn();
const loadCuratedSemanticDossier = jest.fn();
const getAuditedAnthropicClient = jest.fn();

jest.mock("@/lib/atlas/tool-belt", () => ({
  query_tower_current_state: (...args: unknown[]) =>
    queryTowerCurrentState(...args),
  query_portfolio_aggregates: (...args: unknown[]) =>
    queryPortfolioAggregates(...args),
  query_signals: (...args: unknown[]) => querySignals(...args),
  query_programs: (...args: unknown[]) => queryPrograms(...args),
  query_use_cases: (...args: unknown[]) => queryUseCases(...args),
  query_cohort_benchmarks: (...args: unknown[]) =>
    queryCohortBenchmarks(...args),
  query_signal_evidence: (...args: unknown[]) => querySignalEvidence(...args),
}));

jest.mock("@/lib/agent/retrieval", () => ({
  assembleRetrievalContext: (...args: unknown[]) =>
    assembleRetrievalContext(...args),
}));

jest.mock("@/lib/enterprise-context/derived-enterprise-read", () => ({
  getDerivedEnterpriseReadForTenant: (...args: unknown[]) =>
    getDerivedEnterpriseReadForTenant(...args),
}));

jest.mock("@/lib/atlas/value-grounding", () => ({
  buildAtlasValueGrounding: (...args: unknown[]) =>
    buildAtlasValueGrounding(...args),
  renderAtlasValueGrounding: () => "Grounding: Tower substrate.",
}));

jest.mock("@/lib/semantic-dossiers", () => ({
  loadCuratedSemanticDossier: (...args: unknown[]) =>
    loadCuratedSemanticDossier(...args),
}));

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    getAuditedAnthropicClient(...args),
}));

/**
 * Identifiers that only exist here. Each is placed on a field the real tool
 * belt populates, so a case failing means that field's identifier reached the
 * model, not that the fixture was contrived.
 */
const IDENTIFIERS = {
  clientId: "7c1f2a54-3b8d-4e21-9f44-b7a90c2d1e08",
  programId: "prog_kq48xt2r9v",
  useCaseId: "uc_9d31mfp0ab",
  signalId: "sig_4h71ndc2",
  signalKey: "signal:vendor-concentration:q3",
  initiativeDisplayId: "AR-02",
  evidenceArtifactRef: "blob://tenant-evidence/9f21/vendor-consolidation.pdf",
} as const;

/**
 * A retrieved chunk's `sourceKey` is the one identifier the prompt publishes on
 * purpose: `CITATION_INSTRUCTION` tells the model to cite "the exact source_key
 * shown with the chunk". It is therefore held to a narrower rule — withheld
 * from the supporting payload, where it is a duplicate, and kept in the
 * citation block, where the answer contract needs it.
 */
const CITED_SOURCE_KEY =
  "enterprise_context_chunks/skyharbor-air/vendor-brief-14.md";

function towerState() {
  return {
    client: {
      clientId: IDENTIFIERS.clientId,
      clientName: "Airline Demo",
      tenantKey: "skyharbor-air",
      industryCode: "GENERAL",
    },
    todayIso: "2026-09-18",
    activeLens: "value",
    substrateCounts: {
      initiatives: 3,
      vendors: 1,
      kpiSnapshots: 1,
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
    kpiSnapshots: [
      {
        initiativeDisplayId: IDENTIFIERS.initiativeDisplayId,
        initiativeName: "Baggage telemetry",
        kpiName: "Mishandled bags per 1k",
        quarter: "2026Q3",
        value: 4.1,
        targetValue: 3.0,
        peerMedian: 3.6,
        confidenceLevel: "medium",
      },
    ],
    decisions: [],
    scenarios: [],
    stakeholderNotes: [],
  };
}

/**
 * Where the raw tool-result JSON starts. The prompt has two halves and they are
 * governed differently: everything above is composed prose, including the
 * citation block; everything below is the serialized tool-result map.
 */
const PAYLOAD_MARKER_RE = /^(?:Supporting|Raw) tool context follows/m;

function payloadOffset(prompt: string): number {
  const index = prompt.search(PAYLOAD_MARKER_RE);
  if (index < 0) {
    throw new Error(
      "the line introducing the tool-result payload is not in the prompt; " +
        "this suite splits the prompt on it and cannot tell the halves apart",
    );
  }
  return index;
}

function payloadSection(prompt: string): string {
  return prompt.slice(payloadOffset(prompt));
}

/** The prompt text the model was actually given, from the audited client call. */
async function capturePrompt(message = "what are peers doing on vendor risk?") {
  const { runAtlasLlm } = await import("@/lib/atlas/llm");
  await runAtlasLlm(
    {
      clientId: IDENTIFIERS.clientId,
      clientKey: "skyharbor",
      userId: "user-1",
    },
    message,
  );
  const call = getAuditedAnthropicClient.mock.calls.at(-1)?.[0] as
    | { prompt: string }
    | undefined;
  if (!call) throw new Error("the audited Anthropic client was never called");
  return call.prompt;
}

describe("Atlas prompt identifier hygiene", () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Without a key `runAtlasLlm` returns the deterministic fallback and never
    // builds a prompt; these cases are about the prompt.
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    queryTowerCurrentState.mockResolvedValue(towerState());
    queryPortfolioAggregates.mockResolvedValue({
      initiativeCount: 3,
      totalCommittedUsd: 1_000_000,
    });
    querySignals.mockResolvedValue([
      {
        id: IDENTIFIERS.signalId,
        signalKey: IDENTIFIERS.signalKey,
        headline: "Vendor concentration rising",
        signalTitle: "Vendor concentration rising",
        severity: "warning",
        state: "new",
        impactUsd: 250_000,
        firedAt: "2026-09-01",
        pillar: "risk",
        cohortLabel: "Regional carriers",
        percentile: 82,
        evidenceSummary: {},
      },
    ]);
    queryPrograms.mockResolvedValue([
      {
        id: IDENTIFIERS.programId,
        name: "Baggage telemetry",
        currentPhase: 2,
        status: "active",
        originSource: "tower",
      },
    ]);
    queryUseCases.mockResolvedValue([
      {
        id: IDENTIFIERS.useCaseId,
        name: "Predictive rebooking",
        stage: "pilot",
        businessUnit: "Operations",
        vendor: "Acme",
      },
    ]);
    queryCohortBenchmarks.mockResolvedValue({
      metricName: "Adoption penetration",
      pillar: "adoption",
      label: "Regional carriers",
      sampleSize: 11,
      p25: 18,
      p50: 31,
      p75: 44,
      p90: 58,
      apexValue: 62,
      apexPercentile: 95,
      note: null,
      peers: [],
    });
    querySignalEvidence.mockResolvedValue({
      id: IDENTIFIERS.signalId,
      signalKey: IDENTIFIERS.signalKey,
      headline: "Vendor concentration rising",
      signalTitle: "Vendor concentration rising",
      severity: "warning",
      state: "new",
      impactUsd: 250_000,
      firedAt: "2026-09-01",
      pillar: "risk",
      cohortLabel: "Regional carriers",
      percentile: 82,
      evidenceSummary: {},
      narrative: {},
      cohortContext: {},
      benchmark: null,
      recommendedActions: [],
      evidence: [
        {
          id: "ev_2p84qz",
          position: 1,
          evidenceType: "contract",
          sourceLabel: "Vendor consolidation brief",
          artifactRef: IDENTIFIERS.evidenceArtifactRef,
          vendorName: "Acme",
          title: "Five baggage vendors under three master agreements",
          summary: "Consolidation candidates identified in the 2026 review.",
          amountUsd: 1_200_000,
          metricValue: null,
          metricUnit: null,
          confidence: "medium",
          metadata: {},
        },
      ],
    });
    assembleRetrievalContext.mockResolvedValue({
      industryChunks: [],
      topicChunks: [],
      clientChunks: [
        {
          sourceKey: CITED_SOURCE_KEY,
          text: "Peers consolidated two of five baggage vendors in 2025.",
          score: 0.8,
        },
      ],
      atlasIacComposition: null,
    });
    getDerivedEnterpriseReadForTenant.mockResolvedValue(null);
    buildAtlasValueGrounding.mockResolvedValue({ claims: [] });
    loadCuratedSemanticDossier.mockResolvedValue(null);
    getAuditedAnthropicClient.mockResolvedValue({
      client: {
        messages: {
          create: jest.fn(async () => ({
            content: [{ type: "text", text: "Peers consolidated vendors." }],
          })),
        },
      },
    });
  });

  it.each(Object.entries(IDENTIFIERS))(
    "withholds the %s the tool belt returned from the prompt",
    async (_field, identifier) => {
      const prompt = await capturePrompt();
      expect(prompt).not.toContain(identifier);
    },
  );

  it("withholds a retrieved chunk's source key from the supporting payload", async () => {
    const prompt = await capturePrompt();
    expect(payloadSection(prompt)).not.toContain(CITED_SOURCE_KEY);
  });

  it("still publishes that source key where the citation contract needs it", async () => {
    // The narrower rule, pinned so a later sweep cannot quietly take the
    // citation token away: `CITATION_INSTRUCTION` asks for "the exact
    // source_key shown with the chunk", and the chunk is above the payload.
    const prompt = await capturePrompt();
    expect(prompt.slice(0, payloadOffset(prompt))).toContain(CITED_SOURCE_KEY);
  });

  it("does not tell the model the context is there for exact IDs", async () => {
    const prompt = await capturePrompt();
    expect(prompt).not.toMatch(/for exact IDs/i);
  });

  it("still carries the business substance the identifiers were attached to", async () => {
    const prompt = await capturePrompt();
    // Withholding an identifier must not cost the record it identifies. If
    // these fail, the sanitiser is deleting content rather than identifiers.
    expect(prompt).toContain("Baggage telemetry");
    expect(prompt).toContain("Predictive rebooking");
    expect(prompt).toContain("Vendor concentration rising");
    expect(prompt).toContain("Five baggage vendors under three master agreements");
    expect(prompt).toContain("Adoption penetration");
    expect(prompt).toContain(
      "Peers consolidated two of five baggage vendors in 2025.",
    );
  });

  it("keeps the instruction that forbids exposing identifiers", async () => {
    const prompt = await capturePrompt();
    expect(prompt).toContain("Do not expose raw IDs");
  });
});
