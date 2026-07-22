// List route proof: tenant-scoped, grouped, history opt-in.
const tenancy = { clientId: "c1", clientKey: "skyharbor-air", userId: "u1" };
let listArgs: unknown[] = [];
let mockFileCabinetArtifacts: Array<Record<string, unknown>> = [];

function artifactFixture(
  overrides: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    id: "a1",
    clientId: "c1",
    tenantKey: "skyharbor-air",
    sourceEventId: "evt-1",
    sourcingStage: "rfp",
    artifactGroup: "generated",
    artifactType: "rfp_package",
    artifactFamily: "rfp",
    title: "AMS RFP",
    description: null,
    fileName: "AMS RFP.md",
    fileFormat: "md",
    blobContainer: "source-artifacts",
    blobPath: "inline://a1",
    fileSize: null,
    version: 1,
    status: "preliminary",
    generatedBy: "aVa",
    generatedAt: "2026-07-03T00:00:00.000Z",
    sourceBasis: null,
    confidence: null,
    citationReady: true,
    evidenceFamiliesUsed: [],
    sourceRegisterId: null,
    contextBundleTraceId: null,
    approvalState: null,
    approvedBy: null,
    approvedAt: null,
    maestroOverrideId: null,
    missingInputs: [],
    clientCompleteItems: [],
    assumptions: [],
    supersedesArtifactId: null,
    supersededByArtifactId: null,
    lifecycleState: "current",
    blobSha256: null,
    isClientFinal: false,
    isCurrentAuthoritative: false,
    sourceGeneratedArtifactId: null,
    clientFinalUploadedBy: null,
    clientFinalUploadedAt: null,
    clientFinalAcceptedBy: null,
    clientFinalAcceptedAt: null,
    clientFinalNote: null,
    clientFinalReviewMeetingDate: null,
    clientFinalStakeholderGroup: null,
    clientFinalChangeSummary: {},
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-03T00:00:00.000Z",
    ...overrides,
  };
}

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("not tenancy");
  }),
}));
jest.mock("@/lib/source/canvas-substrate/queries", () => ({
  listArtifactStatesForEvent: jest.fn(async () => []),
}));
jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventId: jest.fn(async () => []),
}));
jest.mock("@/lib/source/canonical-specs", () => ({
  specByCode: jest.fn((code: string) =>
    code === "d24_decision_brief"
      ? { name: "D24 Decision Brief", description: "Executive decision brief." }
      : undefined,
  ),
}));
jest.mock("@/lib/source/file-cabinet/repository", () => ({
  listSourceArtifacts: jest.fn(
    async (eventId: string, clientId: string, filter: unknown) => {
      listArgs = [eventId, clientId, filter];
      return mockFileCabinetArtifacts;
    },
  ),
}));

import { GET } from "../route";
import { listArtifactStatesForEvent } from "@/lib/source/canvas-substrate/queries";
import { listSourceArtifactsForSourceEventId } from "@/lib/source/artifact-registry";

function req(url: string): import("next/server").NextRequest {
  return { url } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  listArgs = [];
  mockFileCabinetArtifacts = [
    artifactFixture({ id: "a1" }),
    artifactFixture({
      id: "a2",
      sourcingStage: "approval",
      artifactGroup: "approval",
      artifactType: "approval_packet",
      artifactFamily: "approval",
      title: "Approval",
      fileName: "Approval.pdf",
      fileFormat: "pdf",
      status: "approved",
    }),
  ];
  jest.mocked(listArtifactStatesForEvent).mockResolvedValue([]);
  jest.mocked(listSourceArtifactsForSourceEventId).mockResolvedValue([]);
});

describe("GET /api/v1/source/events/[eventId]/artifacts", () => {
  it("400 when eventId blank", async () => {
    const res = await GET(req("https://x/api"), {
      params: Promise.resolve({ eventId: " " }),
    });
    expect(res.status).toBe(400);
  });
  it("returns grouped artifacts scoped to the caller client", async () => {
    const res = await GET(req("https://x/api"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, never>;
    expect((json as Record<string, unknown>).count).toBe(2);
    const grouped = (json as Record<string, Record<string, unknown[]>>).grouped;
    expect(grouped.generated).toHaveLength(1);
    expect(grouped.approval).toHaveLength(1);
    expect(listArgs[1]).toBe("c1"); // client-scoped
  });
  it("passes includeHistory + group filter through", async () => {
    await GET(req("https://x/api?includeHistory=1&group=generated"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });
    expect(
      (listArgs[2] as { includeHistory: boolean; artifactGroup: string })
        .includeHistory,
    ).toBe(true);
    expect((listArgs[2] as { artifactGroup: string }).artifactGroup).toBe(
      "generated",
    );
  });
  it("collapses same-stage artifact rows to the authoritative file by default", async () => {
    mockFileCabinetArtifacts = [
      artifactFixture({
        id: "generated-draft",
        artifactGroup: "generated",
        artifactType: "d09_rfp_pack",
        title: "Generated RFP Pack",
        version: 1,
        status: "draft",
        updatedAt: "2026-07-03T00:00:00.000Z",
      }),
      artifactFixture({
        id: "client-final",
        artifactGroup: "upload",
        artifactType: "d09_rfp_pack",
        title: "Client Final RFP Pack",
        fileName: "Client Final RFP Pack.docx",
        fileFormat: "docx",
        version: 2,
        status: "client_final",
        isClientFinal: true,
        isCurrentAuthoritative: true,
        clientFinalAcceptedAt: "2026-07-04T00:00:00.000Z",
      }),
      artifactFixture({
        id: "risk-register",
        artifactGroup: "upload",
        artifactType: "risk_register",
        title: "Risk Register",
        fileName: "Risk Register.xlsx",
        fileFormat: "xlsx",
      }),
    ];

    const res = await GET(req("https://x/api"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(
      (json.artifacts as Array<Record<string, unknown>>).map((item) => item.id),
    ).toEqual(["client-final", "risk-register"]);
    expect(json.count).toBe(2);
  });
  it("preserves raw same-slot rows when includeHistory is requested", async () => {
    mockFileCabinetArtifacts = [
      artifactFixture({
        id: "generated-draft",
        artifactGroup: "generated",
        artifactType: "d09_rfp_pack",
        title: "Generated RFP Pack",
        version: 1,
        status: "draft",
      }),
      artifactFixture({
        id: "client-final",
        artifactGroup: "upload",
        artifactType: "d09_rfp_pack",
        title: "Client Final RFP Pack",
        version: 2,
        status: "client_final",
        isClientFinal: true,
      }),
    ];

    const res = await GET(req("https://x/api?includeHistory=1"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(
      (json.artifacts as Array<Record<string, unknown>>).map((item) => item.id),
    ).toEqual(["generated-draft", "client-final"]);
    expect(json.count).toBe(2);
  });
  it("bridges linked generated artifact-state rows into the generated group", async () => {
    jest.mocked(listArtifactStatesForEvent).mockResolvedValue([
      {
        id: "state-24",
        sourceEventId: "evt-1",
        tenantKey: "skyharbor-air",
        artifactCode: "d24_decision_brief",
        stage: "executive_decision",
        family: "decision_brief",
        tier: "rich",
        status: "approved",
        requirementLevel: "required",
        gateDefining: true,
        linkedArtifactId: "registry-24",
        notes: null,
        body: "# Decision",
        bodyFormat: "markdown",
        bodyAuthoredBy: "u1",
        bodyUpdatedAt: "2026-07-03T00:00:00.000Z",
        bodyGenerationMetadata: null,
        createdAt: "2026-07-03T00:00:00.000Z",
        updatedAt: "2026-07-03T00:00:00.000Z",
      },
    ]);

    const res = await GET(req("https://x/api"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.count).toBe(3);
    const grouped = json.grouped as Record<
      string,
      Array<Record<string, unknown>>
    >;
    expect(grouped.generated.map((item) => item.id)).toEqual([
      "a1",
      "registry-24",
    ]);
    expect(grouped.generated[1]).toMatchObject({
      title: "D24 Decision Brief",
      artifactGroup: "generated",
      artifactType: "d24_decision_brief",
      fileFormat: "pdf",
      fileName: "D24 Executive Decision Brief.pdf",
      status: "issue_ready",
      sourceBasis: "source_event_artifact_states:state-24",
    });
  });
  it("falls back to tenant-scoped artifact registry rows when File Cabinet projection is absent", async () => {
    jest.mocked(listSourceArtifactsForSourceEventId).mockResolvedValue([
      {
        id: "registry-generated-1",
        tenantKey: "skyharbor-air",
        sourceEventId: "evt-1",
        sourceEventRowId: null,
        stageKey: "evaluation",
        artifactFamily: "decision_brief",
        artifactKind: "d24_decision_brief",
        sourceOrigin: "generated",
        sourceFormat: "markdown",
        originalName: "D24 Decision Brief.md",
        blobUri: "az://source-artifacts/skyharbor/evt-1/d24.md",
        uploaderUserId: "u1",
        mimeType: "text/markdown",
        sizeBytes: 2048,
        sha256: "abc123",
        parseStatus: "parsed",
        embeddingStatus: "not_applicable",
        graphStatus: "not_applicable",
        classificationStatus: "classified",
        dataClassification: "Internal",
        evidenceState: "cited",
        approvalState: "approved",
        isClientFinal: false,
        isCurrentAuthoritative: false,
        sourceGeneratedArtifactId: null,
        clientFinalUploadedBy: null,
        clientFinalUploadedAt: null,
        clientFinalAcceptedBy: null,
        clientFinalAcceptedAt: null,
        clientFinalNote: null,
        clientFinalReviewMeetingDate: null,
        clientFinalStakeholderGroup: null,
        clientFinalChangeSummary: {},
        citedSourceArtifactIds: [],
        version: 1,
        supersedesArtifactVersionId: null,
        createdBy: "aVa",
        validatedBy: null,
        createdAt: "2026-07-03T00:00:00.000Z",
        updatedAt: "2026-07-03T00:00:00.000Z",
        deletedAt: null,
      },
      {
        id: "wrong-tenant-generated",
        tenantKey: "lakeshore-holdings",
        sourceEventId: "evt-1",
        sourceEventRowId: null,
        stageKey: "evaluation",
        artifactFamily: "decision_brief",
        artifactKind: "d24_decision_brief",
        sourceOrigin: "generated",
        sourceFormat: "markdown",
        originalName: "Wrong Tenant.md",
        blobUri: "az://source-artifacts/lakeshore/evt-1/d24.md",
        uploaderUserId: "u1",
        mimeType: "text/markdown",
        sizeBytes: 2048,
        sha256: "def456",
        parseStatus: "parsed",
        embeddingStatus: "not_applicable",
        graphStatus: "not_applicable",
        classificationStatus: "classified",
        dataClassification: "Internal",
        evidenceState: "cited",
        approvalState: "approved",
        isClientFinal: false,
        isCurrentAuthoritative: false,
        sourceGeneratedArtifactId: null,
        clientFinalUploadedBy: null,
        clientFinalUploadedAt: null,
        clientFinalAcceptedBy: null,
        clientFinalAcceptedAt: null,
        clientFinalNote: null,
        clientFinalReviewMeetingDate: null,
        clientFinalStakeholderGroup: null,
        clientFinalChangeSummary: {},
        citedSourceArtifactIds: [],
        version: 1,
        supersedesArtifactVersionId: null,
        createdBy: "aVa",
        validatedBy: null,
        createdAt: "2026-07-03T00:00:00.000Z",
        updatedAt: "2026-07-03T00:00:00.000Z",
        deletedAt: null,
      },
    ]);

    const res = await GET(req("https://x/api?group=generated"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    const grouped = json.grouped as Record<
      string,
      Array<Record<string, unknown>>
    >;
    expect(grouped.generated.map((item) => item.id)).toEqual([
      "a1",
      "registry-generated-1",
    ]);
    expect(grouped.generated[1]).toMatchObject({
      artifactGroup: "generated",
      artifactType: "d24_decision_brief",
      fileFormat: "md",
      sourceBasis: "source_artifacts:registry-generated-1",
      sourceRegisterId: "registry-generated-1",
    });
  });
});
