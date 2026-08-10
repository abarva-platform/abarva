import { buildSourceGenerationContext } from "@/lib/source/agent-generation/context-binder";
import type { SourcingEventDetail } from "@/lib/source/types";

jest.mock("@/lib/source/canvas-substrate/queries", () => ({
  listArtifactStatesForEvent: jest.fn(),
  listEvidenceStatesForEvent: jest.fn(),
  listGateCriterionStatesForEvent: jest.fn(),
}));

jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: jest.fn(),
  isUuid: jest.fn(),
  resolveSourceEventUuidForClient: jest.fn(),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(),
}));

jest.mock("@/lib/client-config", () => ({
  canonicalClientDisplayName: jest.fn(() => "Apex Retail"),
}));

jest.mock("@/lib/auth/current-user", () => ({
  __esModule: true,
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("@/lib/admin/setup-data-broker", () => ({
  __esModule: true,
  listAppInventoryRecords: () => Promise.resolve([]),
}));

jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  __esModule: true,
  clientKeyToInventorySubstrateKey: (key: string) => key,
}));

jest.mock("@/lib/source/archetypes/event-archetype-resolver", () => ({
  __esModule: true,
  resolveArchetypeForEvent: () => ({
    resolved: false,
    archetype: null,
    archetypeId: null,
    source: "unresolved",
    categoryId: null,
    reason: "test",
  }),
}));

jest.mock("@/lib/source/stage-guidebooks/repository", () => ({
  __esModule: true,
  getSourceStageGuidebook: jest.fn(),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const {
  listArtifactStatesForEvent,
  listEvidenceStatesForEvent,
  listGateCriterionStatesForEvent,
} = jest.requireMock("@/lib/source/canvas-substrate/queries") as {
  listArtifactStatesForEvent: jest.Mock;
  listEvidenceStatesForEvent: jest.Mock;
  listGateCriterionStatesForEvent: jest.Mock;
};

const { getSourcingEvent, isUuid, resolveSourceEventUuidForClient } =
  jest.requireMock("@/lib/source/queries") as {
    getSourcingEvent: jest.Mock;
    isUuid: jest.Mock;
    resolveSourceEventUuidForClient: jest.Mock;
  };

const { getActiveClientRow } = jest.requireMock("@/lib/active-client") as {
  getActiveClientRow: jest.Mock;
};

const { canonicalClientDisplayName } = jest.requireMock(
  "@/lib/client-config",
) as {
  canonicalClientDisplayName: jest.Mock;
};

const { getAzureReadFluentClient } = jest.requireMock(
  "@/lib/data-plane/postgresCompat",
) as {
  getAzureReadFluentClient: jest.Mock;
};

const { getSourceStageGuidebook } = jest.requireMock(
  "@/lib/source/stage-guidebooks/repository",
) as {
  getSourceStageGuidebook: jest.Mock;
};

const { getCurrentUser } = jest.requireMock("@/lib/auth/current-user") as {
  getCurrentUser: jest.Mock;
};

function makeFluentResult(data: unknown[] = []) {
  const chain: {
    select: jest.MockedFunction<() => typeof chain>;
    eq: jest.MockedFunction<() => typeof chain>;
    in: jest.MockedFunction<() => typeof chain>;
    order: jest.MockedFunction<() => typeof chain>;
    limit: jest.MockedFunction<() => Promise<{ data: unknown[]; error: null }>>;
  } = {} as {
    select: jest.MockedFunction<() => typeof chain>;
    eq: jest.MockedFunction<() => typeof chain>;
    in: jest.MockedFunction<() => typeof chain>;
    order: jest.MockedFunction<() => typeof chain>;
    limit: jest.MockedFunction<() => Promise<{ data: unknown[]; error: null }>>;
  };
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.in = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);
  chain.limit = jest.fn(() => Promise.resolve({ data, error: null }));
  return chain;
}

function mockUploadedEvidenceQueries(
  args: {
    artifacts?: unknown[];
    chunks?: unknown[];
    facts?: unknown[];
  } = {},
) {
  const artifacts = makeFluentResult(args.artifacts ?? []);
  const chunks = makeFluentResult(args.chunks ?? []);
  const facts = makeFluentResult(args.facts ?? []);
  getAzureReadFluentClient.mockReturnValue({
    from: jest.fn((table: string) => {
      if (table === "source_artifacts") return artifacts;
      if (table === "source_artifact_chunks") return chunks;
      if (table === "source_artifact_facts") return facts;
      return makeFluentResult([]);
    }),
  });
}

function makeSeedEvent(): SourcingEventDetail {
  return {
    id: "apex-retail-ams-outsourcing-2026",
    code: "SRC-004",
    name: "AMS Outsourcing 2026",
    accountName: "Apex Retail",
    leadAgent: "Sentinel",
    archetype: "Managed Services / Outsourcing",
    rigor: "strategic",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "strategy",
    currentStageLabel: "Strategy",
    openAlerts: 0,
    owner: "Carlos Rivera",
    agingDays: 0,
    blocker: null,
    nextAction: "Continue Source workflow",
    isAtRisk: false,
    valueAtStakeUsd: 35_000_000,
    projectedValueUsd: 35_000_000,
    realizedValueUsd: 0,
    nextDecision: "Continue Source workflow",
    synopsis: "Test synopsis",
    problemStatement: "Why now: renewal and run-cost pressure.",
    stages: [],
    alerts: [],
    artifacts: [],
    scorecard: {
      decisionOwner: "Carlos Rivera",
      reviewCadence: "Stage-gate",
      approvalState: "default_generated",
      criteria: [],
    },
    valueLedger: {
      updatedAt: "2026-06-03T00:00:00.000Z",
      projected: [],
      realized: [],
    },
    dataReadiness: [],
  };
}

describe("buildSourceGenerationContext", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    listArtifactStatesForEvent.mockResolvedValue([]);
    listGateCriterionStatesForEvent.mockResolvedValue([]);
    listEvidenceStatesForEvent.mockResolvedValue([]);
    mockUploadedEvidenceQueries();
    getCurrentUser.mockResolvedValue(null);
    getActiveClientRow.mockResolvedValue({
      id: "client-apex",
      key: "apexretail",
      name: "Apex Retail",
      industry_code: "RETAIL",
    });
    getSourceStageGuidebook.mockResolvedValue(null);
  });

  it("binds parsed uploaded evidence chunks and facts for generation prompts", async () => {
    getSourcingEvent.mockResolvedValue({
      ...makeSeedEvent(),
      id: "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    });
    isUuid.mockImplementation(
      (value: string) => value === "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
    mockUploadedEvidenceQueries({
      artifacts: [
        {
          id: "artifact-1",
          original_name: "11_Data_Center_Infrastructure_Inventory.csv",
          artifact_family: "other",
          source_format: "csv",
          parse_status: "parsed",
          evidence_state: "parsed_uncited",
          stage_key: "scope",
          created_at: "2026-06-12T00:00:00.000Z",
        },
      ],
      chunks: [
        {
          artifact_id: "artifact-1",
          chunk_text:
            "VMware Cloud Foundation footprint across seven data centers.",
          confidence: 0.91,
        },
      ],
      facts: [
        {
          artifact_id: "artifact-1",
          fact_type: "artifact_summary",
          fact_key: "text_uploaded",
          fact_value: { chunk_count: 1 },
          confidence: 0.85,
        },
      ],
    });

    const ctx = await buildSourceGenerationContext(
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );

    expect(ctx?.uploadedEvidence).toEqual([
      expect.objectContaining({
        originalName: "11_Data_Center_Infrastructure_Inventory.csv",
        chunkExcerpts: [
          "VMware Cloud Foundation footprint across seven data centers.",
        ],
        factSummaries: ['artifact_summary/text_uploaded: {"chunk_count":1}'],
      }),
    ]);
  });

  it("binds current and next-stage guidebooks for workflow-aware artifact prompts", async () => {
    getSourcingEvent.mockResolvedValue({
      ...makeSeedEvent(),
      id: "522eedf2-ff6b-4307-b312-3e0903c6fd42",
      currentStageKey: "strategy",
    });
    isUuid.mockImplementation(
      (value: string) => value === "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
    const strategyGuidebook = {
      id: "guidebook-strategy",
      stageKey: "strategy",
      clientKey: null,
      title: "Strategy approval workshop",
      purpose: "Align the sponsor on why this sourcing event should run.",
      durationMinutes: 30,
      status: "published",
      sections: [],
      version: 1,
      createdBy: null,
      updatedBy: null,
      publishedAt: "2026-08-10T00:00:00.000Z",
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
    };
    const scopeGuidebook = {
      ...strategyGuidebook,
      id: "guidebook-scope",
      stageKey: "scope",
      title: "Scope evidence collection workshop",
      purpose:
        "Collect volumetrics, SLA baseline, application inventory, and commercial terms before Scope approval.",
    };
    getSourceStageGuidebook.mockImplementation(async (stageKey: string) =>
      stageKey === "strategy" ? strategyGuidebook : scopeGuidebook,
    );

    const ctx = await buildSourceGenerationContext(
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );

    expect(getSourceStageGuidebook).toHaveBeenCalledWith(
      "strategy",
      "apexretail",
    );
    expect(getSourceStageGuidebook).toHaveBeenCalledWith("scope", "apexretail");
    expect(ctx?.currentStageGuidebook?.title).toBe(
      "Strategy approval workshop",
    );
    expect(ctx?.nextStageGuidebook?.title).toBe(
      "Scope evidence collection workshop",
    );
  });

  it("re-checks tenant_key at every join hop of the uploaded-evidence read (RLS/tenant-isolation workstream, PR B)", async () => {
    getSourcingEvent.mockResolvedValue({
      ...makeSeedEvent(),
      id: "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    });
    isUuid.mockImplementation(
      (value: string) => value === "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
    const artifacts = makeFluentResult([
      {
        id: "artifact-1",
        original_name: "evidence.pdf",
        artifact_family: "other",
        source_format: "pdf",
        parse_status: "parsed",
        evidence_state: "parsed_uncited",
        stage_key: "scope",
        created_at: "2026-06-12T00:00:00.000Z",
      },
    ]);
    const chunks = makeFluentResult([]);
    const facts = makeFluentResult([]);
    getAzureReadFluentClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === "source_artifacts") return artifacts;
        if (table === "source_artifact_chunks") return chunks;
        if (table === "source_artifact_facts") return facts;
        return makeFluentResult([]);
      }),
    });

    await buildSourceGenerationContext("522eedf2-ff6b-4307-b312-3e0903c6fd42");

    // First hop: source_artifacts filtered by tenant_key, not just event.
    expect(artifacts.eq).toHaveBeenCalledWith("tenant_key", "apexretail");
    // Second hop: the artifact_id-keyed chunks/facts reads carry an
    // INDEPENDENT tenant_key check too — never just trusting the first
    // hop's artifactIds without re-verifying.
    expect(chunks.eq).toHaveBeenCalledWith("tenant_key", "apexretail");
    expect(facts.eq).toHaveBeenCalledWith("tenant_key", "apexretail");
  });

  it("binds the latest uploaded artifact per filename when live crawls re-upload evidence", async () => {
    getSourcingEvent.mockResolvedValue({
      ...makeSeedEvent(),
      id: "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    });
    isUuid.mockImplementation(
      (value: string) => value === "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
    mockUploadedEvidenceQueries({
      artifacts: [
        {
          id: "new-risk",
          original_name: "13_Security_Compliance_Control_Posture.csv",
          artifact_family: "other",
          source_format: "csv",
          parse_status: "parsed",
          evidence_state: "parsed_uncited",
          stage_key: "scope",
          source_origin: "uploaded",
          created_at: "2026-06-12T08:00:00.000Z",
        },
        {
          id: "generated-d09",
          original_name: "d09_rfp_pack-aa559505.md",
          artifact_family: "rfp",
          source_format: "markdown",
          parse_status: "pending",
          evidence_state: "unparsed",
          stage_key: "rfp",
          source_origin: "generated",
          created_at: "2026-06-12T07:59:00.000Z",
        },
        {
          id: "old-risk",
          original_name: "13_Security_Compliance_Control_Posture.csv",
          artifact_family: "other",
          source_format: "csv",
          parse_status: "pending",
          evidence_state: "unparsed",
          stage_key: "scope",
          source_origin: "uploaded",
          created_at: "2026-06-12T07:00:00.000Z",
        },
      ],
      chunks: [
        {
          artifact_id: "new-risk",
          chunk_text:
            "CSPM backlog includes 27 critical findings and patch compliance at 88.5%.",
          confidence: 0.91,
        },
        {
          artifact_id: "old-risk",
          chunk_text: "stale risk row",
          confidence: 0.91,
        },
      ],
    });

    const ctx = await buildSourceGenerationContext(
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );

    expect(ctx?.uploadedEvidence).toEqual([
      expect.objectContaining({
        id: "new-risk",
        originalName: "13_Security_Compliance_Control_Posture.csv",
        parseStatus: "parsed",
        chunkExcerpts: [
          "CSPM backlog includes 27 critical findings and patch compliance at 88.5%.",
        ],
      }),
    ]);
  });

  it("re-binds seeded golden slugs to the persisted event UUID before substrate reads", async () => {
    getSourcingEvent.mockResolvedValue(makeSeedEvent());
    isUuid.mockImplementation(
      (value: string) => value === "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
    resolveSourceEventUuidForClient.mockImplementation(
      async (value: string, clientKey: string) => {
        if (
          clientKey === "apexretail" &&
          (value === "apex-retail-ams-outsourcing-2026" || value === "SRC-004")
        ) {
          return "522eedf2-ff6b-4307-b312-3e0903c6fd42";
        }
        return null;
      },
    );

    const ctx = await buildSourceGenerationContext(
      "apex-retail-ams-outsourcing-2026",
    );

    expect(ctx?.event.id).toBe("522eedf2-ff6b-4307-b312-3e0903c6fd42");
    expect(resolveSourceEventUuidForClient).toHaveBeenCalledWith(
      "apex-retail-ams-outsourcing-2026",
      "apexretail",
    );
    expect(listArtifactStatesForEvent).toHaveBeenCalledWith(
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
    expect(listGateCriterionStatesForEvent).toHaveBeenCalledWith(
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
    expect(listEvidenceStatesForEvent).toHaveBeenCalledWith(
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
  });

  it("retries event-code lookup through the active-client UUID before returning null", async () => {
    const persistedEvent = {
      ...makeSeedEvent(),
      id: "522eedf2-ff6b-4307-b312-3e0903c6fd42",
      code: "LSH-KYRIBA-TREASURY-2026",
      name: "Kyriba Treasury Rollout Commercial Readiness",
      accountName: "Lakeshore Holdings",
    };
    getActiveClientRow.mockResolvedValue({
      id: "client-lakeshore",
      key: "lakeshore",
      name: "Lakeshore Holdings",
      industry_code: "HOLDCO",
    });
    getSourcingEvent.mockImplementation(async (value: string) => {
      if (value === "522eedf2-ff6b-4307-b312-3e0903c6fd42") {
        return persistedEvent;
      }
      return null;
    });
    isUuid.mockImplementation(
      (value: string) => value === "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
    resolveSourceEventUuidForClient.mockImplementation(
      async (value: string, clientKey: string) => {
        if (value === "LSH-KYRIBA-TREASURY-2026" && clientKey === "lakeshore") {
          return "522eedf2-ff6b-4307-b312-3e0903c6fd42";
        }
        return null;
      },
    );

    const ctx = await buildSourceGenerationContext("LSH-KYRIBA-TREASURY-2026", {
      requestedClientId: "lakeshore",
    });

    expect(ctx?.event.id).toBe("522eedf2-ff6b-4307-b312-3e0903c6fd42");
    expect(getActiveClientRow).toHaveBeenCalledWith("lakeshore");
    expect(getSourcingEvent).toHaveBeenNthCalledWith(
      1,
      "LSH-KYRIBA-TREASURY-2026",
      "lakeshore",
    );
    expect(resolveSourceEventUuidForClient).toHaveBeenCalledWith(
      "LSH-KYRIBA-TREASURY-2026",
      "lakeshore",
    );
    expect(getSourcingEvent).toHaveBeenNthCalledWith(
      2,
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
      "lakeshore",
    );
    expect(listArtifactStatesForEvent).toHaveBeenCalledWith(
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
  });

  it("uses the concrete Source event account name when canonical display is a generic demo placeholder", async () => {
    canonicalClientDisplayName.mockReturnValue("Airline Demo");
    getActiveClientRow.mockResolvedValue({
      id: "client-skyharbor",
      key: "skyharbor",
      name: "SkyHarbor Air",
      industry_code: "AIRLINE",
    });
    getSourcingEvent.mockResolvedValue({
      ...makeSeedEvent(),
      id: "522eedf2-ff6b-4307-b312-3e0903c6fd42",
      code: "SKYH-AMS-CONTRACT-OPT-2026",
      name: "SkyHarbor Air AMS Contract Optimization",
      accountName: "SkyHarbor Air",
    });
    isUuid.mockImplementation(
      (value: string) => value === "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );

    const ctx = await buildSourceGenerationContext(
      "SKYH-AMS-CONTRACT-OPT-2026",
    );

    expect(ctx?.tenantName).toBe("SkyHarbor Air");
  });

  it("derives the Source event business label when the stored event account is also a generic demo placeholder", async () => {
    canonicalClientDisplayName.mockReturnValue("Airline Demo");
    getActiveClientRow.mockResolvedValue({
      id: "client-skyharbor",
      key: "skyharbor",
      name: "Airline Demo",
      industry_code: "AIRLINE",
    });
    getSourcingEvent.mockResolvedValue({
      ...makeSeedEvent(),
      id: "522eedf2-ff6b-4307-b312-3e0903c6fd42",
      code: "SKYH-AMS-CONTRACT-OPT-2026",
      name: "SkyHarbor AMS Contract Optimization and Renewal Decision",
      accountName: "Airline Demo",
    });
    isUuid.mockImplementation(
      (value: string) => value === "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );

    const ctx = await buildSourceGenerationContext(
      "SKYH-AMS-CONTRACT-OPT-2026",
    );

    expect(ctx?.tenantName).toBe("SkyHarbor Global");
  });
});
