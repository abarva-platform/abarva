const mockRequireTenancy = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetProgramsRouteSupabase = jest.fn();
const mockHasAuthority = jest.fn();
const mockDraftModuleDeliverable = jest.fn();
const mockSignOffDeliverable = jest.fn();
const mockSaveMoveArtifact = jest.fn();
const mockGetGeneratedArtifactById = jest.fn();
const mockExtractProgramEvidenceFromUploadBuffer = jest.fn();

jest.mock("../../../../../_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (ctx: unknown, opts: unknown) =>
    mockLoadUserProgramAccessPolicy(ctx, opts),
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string, opts: unknown) =>
    mockGetProgramById(ctx, programId, opts),
}));

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: (mode: string) =>
    mockGetProgramsRouteSupabase(mode),
}));

jest.mock("@/lib/programs/governance", () => ({
  hasAuthority: (ctx: unknown, programId: string, required: string, opts: unknown) =>
    mockHasAuthority(ctx, programId, required, opts),
}));

jest.mock("@/lib/programs/nexus", () => ({
  draftModuleDeliverable: (ctx: unknown, input: unknown) =>
    mockDraftModuleDeliverable(ctx, input),
}));

jest.mock("@/lib/programs/mutations", () => ({
  signOffDeliverable: (ctx: unknown, programId: string, deliverableId: string, opts: unknown) =>
    mockSignOffDeliverable(ctx, programId, deliverableId, opts),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact: (ctx: unknown, input: unknown) =>
    mockSaveMoveArtifact(ctx, input),
}));

jest.mock("@/lib/artifacts/repository", () => ({
  getGeneratedArtifactById: (artifactId: string, opts: unknown) =>
    mockGetGeneratedArtifactById(artifactId, opts),
  renderableDocFromGeneratedArtifact: (artifact: { metadata?: Record<string, unknown> }) =>
    artifact.metadata?.renderableDoc ?? null,
  renderedHtmlFromGeneratedArtifact: (artifact: { metadata?: Record<string, unknown> }) =>
    artifact.metadata?.renderedHtml ?? null,
}));

jest.mock("@/lib/programs/deliverable-registry", () => ({
  DELIVERABLE_REGISTRY: [
    {
      deliverableTypeKey: "charter",
      documentTitle: "Program Charter",
      phase: 1,
    },
    {
      deliverableTypeKey: "discovery_report",
      documentTitle: "Discovery & Diagnosis Report",
      phase: 2,
    },
    {
      deliverableTypeKey: "root_cause_worksheet",
      documentTitle: "Root Cause Analysis Worksheet",
      phase: 2,
    },
  ],
}));

jest.mock("@/lib/deliverables/quality/deliverable-key-map", () => ({
  deliverableKeyForOrchestratorType: () => null,
}));

jest.mock("@/lib/programs/attachments/mime", () => ({
  isAllowedMimeType: () => true,
  isWithinSizeLimit: () => true,
  MAX_ATTACHMENT_SIZE_BYTES: 25_000_000,
}));

jest.mock("@/lib/programs/evidence-ingestion", () => ({
  extractProgramEvidenceFromUploadBuffer: (input: unknown) =>
    mockExtractProgramEvidenceFromUploadBuffer(input),
}));

const ctx = {
  clientId: "client-fs",
  clientKey: "arcturus",
  userId: "person-agent",
  role: "client_admin",
  email: "agent@example.com",
};

const generatedArtifact = {
  id: "artifact-1",
  clientId: "client-fs",
  artifactType: "move_board_pack",
  sourceArtifactRef: "move:prog-1:phase:1",
  renderEngine: "board_pack",
  outputFormat: "html",
  blobUrl: "/api/v1/artifacts/artifact-1",
  blobSha256: "sha",
  qualityScore: 90,
  evidenceLedgerIds: [],
  citedInputIds: [],
  generationEgressAudit: null,
  renderedAt: "2026-07-22T00:00:00Z",
  renderedBy: "agent",
  quarantineReason: null,
  supersededBy: null,
  metadata: {
    renderableDoc: {
      title: "Program Charter",
      deliverableTypeKey: "charter",
      recommendation: "Approve this charter for controlled discovery.",
      generatedSections: [
        {
          title: "Scope",
          bodyMarkdown: "Commercial lending onboarding and KYC exception handling.",
        },
      ],
    },
  },
};

function makeSupabase() {
  return {
    from: jest.fn((table: string) => {
      const api: Record<string, jest.Mock> = {};
      api.select = jest.fn(() => api);
      api.eq = jest.fn(() => api);
      api.limit = jest.fn(async () => {
        if (table === "engagement_participants") {
          return { data: [{ id: "other-sponsor" }], error: null };
        }
        return { data: [], error: null };
      });
      api.update = jest.fn(() => api);
      api.insert = jest.fn(() => api);
      return api;
    }),
  };
}

function request(body: Record<string, unknown>): Request {
  return new Request("http://test/api/v1/programs/prog-1/artifacts/artifact-1/client-approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ programId: "prog-1", artifactId: "artifact-1" });

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(ctx);
  mockGetProgramsRouteSupabase.mockResolvedValue({ supabase: makeSupabase() });
  mockGetProgramById.mockResolvedValue({ id: "prog-1", currentPhase: 1 });
  mockGetGeneratedArtifactById.mockResolvedValue(generatedArtifact);
  mockHasAuthority.mockResolvedValue(false);
  mockLoadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: true });
  mockDraftModuleDeliverable.mockResolvedValue({
    deliverableId: "deliverable-1",
    versionId: "version-1",
  });
  mockSignOffDeliverable.mockResolvedValue(true);
});

export {};

describe("POST /api/v1/programs/[programId]/artifacts/[artifactId]/client-approval", () => {
  it("allows policy-approved Moves admins even when participant-row authority alone denies", async () => {
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Client reviewer accepts this AI draft." }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      programId: "prog-1",
      artifactId: "artifact-1",
      deliverableId: "deliverable-1",
      versionId: "version-1",
      deliverableTypeKey: "charter",
      approvalMode: "accept_ai_draft_as_authoritative",
    });
    expect(mockHasAuthority).not.toHaveBeenCalled();
    expect(mockLoadUserProgramAccessPolicy).toHaveBeenCalledWith(ctx, {
      programId: "prog-1",
    });
    expect(mockDraftModuleDeliverable).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        programId: "prog-1",
        moduleKey: "charter",
        deliverableTypeKey: "charter",
      }),
    );
    expect(mockSignOffDeliverable).toHaveBeenCalled();
  });

  it("still denies callers without policy or participant approval authority", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: false });
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Trying without approval authority." }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(403);
    expect(json).toMatchObject({
      error: "forbidden",
      detail: "approver authority or higher required",
    });
    expect(mockDraftModuleDeliverable).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("uses persisted deliverable metadata instead of guessing from a generic title", async () => {
    mockGetProgramById.mockResolvedValue({ id: "prog-1", currentPhase: 2 });
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      sourceArtifactRef: "move:prog-1:phase:2",
      metadata: {
        deliverableTypeKey: "root_cause_worksheet",
        renderableDoc: {
          title: "FS Demo — Onboarding & KYC Agent-Assist Discovery",
          deliverableTypeKey: "root_cause_worksheet",
          recommendation: "Use this root-cause worksheet to separate process, data, and control drivers.",
          generatedSections: [
            {
              title: "Root causes",
              bodyMarkdown:
                "Exceptions, duplicated checks, and fragmented servicing evidence create rework.",
            },
          ],
        },
      },
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Client accepts the reviewed root-cause worksheet." }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      deliverableTypeKey: "root_cause_worksheet",
    });
    expect(mockDraftModuleDeliverable).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        programId: "prog-1",
        moduleKey: "diagnose",
        deliverableTypeKey: "root_cause_worksheet",
      }),
    );
  });
});
