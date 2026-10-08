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
const mockLoadApprovedSolutionApproach = jest.fn();
const mockLoadCurrentMoveContextExtractFreshness = jest.fn();
const mockLoadApprovedMoveEvidenceSnapshot = jest.fn();
const mockPackerToBuffer = jest.fn();
const mockRenderDeliverableDocx = jest.fn();
const mockRenderDeliverablePptx = jest.fn();
const mockRenderValidatedDeck = jest.fn();
const mockRenderValidatedDocx = jest.fn();
let sponsorParticipantExists = true;
let routeSupabase: ReturnType<typeof makeSupabase>;

jest.mock("docx", () => ({
  Packer: { toBuffer: (doc: unknown) => mockPackerToBuffer(doc) },
}));

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
  hasAuthority: (
    ctx: unknown,
    programId: string,
    required: string,
    opts: unknown,
  ) => mockHasAuthority(ctx, programId, required, opts),
}));

jest.mock("@/lib/programs/nexus", () => ({
  draftModuleDeliverable: (ctx: unknown, input: unknown) =>
    mockDraftModuleDeliverable(ctx, input),
}));

jest.mock("@/lib/programs/mutations", () => ({
  signOffDeliverable: (
    ctx: unknown,
    programId: string,
    deliverableId: string,
    opts: unknown,
  ) => mockSignOffDeliverable(ctx, programId, deliverableId, opts),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact: (ctx: unknown, input: unknown) =>
    mockSaveMoveArtifact(ctx, input),
}));

jest.mock("@/lib/artifacts/repository", () => ({
  getGeneratedArtifactById: (artifactId: string, opts: unknown) =>
    mockGetGeneratedArtifactById(artifactId, opts),
  renderableDocFromGeneratedArtifact: (artifact: {
    metadata?: Record<string, unknown>;
  }) => artifact.metadata?.renderableDoc ?? null,
  renderedHtmlFromGeneratedArtifact: (artifact: {
    metadata?: Record<string, unknown>;
  }) => artifact.metadata?.renderedHtml ?? null,
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
    {
      deliverableTypeKey: "target_state_architecture",
      documentTitle: "Target Architecture",
      phase: 3,
    },
  ],
}));

jest.mock("@/lib/programs/approved-solution-approach", () => ({
  P3_ARCHITECTURE_DELIVERABLE_KEYS: new Set(["target_state_architecture"]),
  loadApprovedSolutionApproach: (input: unknown) =>
    mockLoadApprovedSolutionApproach(input),
  validateArchitectureGenerationLineage: ({
    lineage,
    approved,
    currentContextSnapshotHash,
  }: Record<string, unknown>) =>
    lineage && approved && currentContextSnapshotHash === "context-hash"
      ? { ok: true, lineage }
      : { ok: false, detail: "Architecture lineage is stale." },
}));

jest.mock("@/lib/programs/move-context-extract", () => ({
  loadCurrentMoveContextExtractFreshness: (input: unknown) =>
    mockLoadCurrentMoveContextExtractFreshness(input),
}));

jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  ...jest.requireActual("@/lib/programs/approved-move-evidence-snapshot"),
  loadApprovedMoveEvidenceSnapshot: (input: unknown) =>
    mockLoadApprovedMoveEvidenceSnapshot(input),
}));

jest.mock("@/lib/deliverables/orchestrator/renderers", () => ({
  renderDeliverableDocx: (doc: unknown) => mockRenderDeliverableDocx(doc),
  renderDeliverablePptx: (doc: unknown) => mockRenderDeliverablePptx(doc),
}));

jest.mock("@/lib/deliverables/orchestrator/render-validated-deck", () => ({
  renderValidatedDeck: (doc: unknown) => mockRenderValidatedDeck(doc),
}));

jest.mock("@/lib/deliverables/orchestrator/render-validated-doc", () => ({
  renderValidatedDocx: (doc: unknown) => mockRenderValidatedDocx(doc),
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
    evidenceSnapshotHash: "revision-current",
    renderableDoc: {
      title: "Program Charter",
      deliverableTypeKey: "charter",
      recommendation: "Approve this charter for controlled discovery.",
      generatedSections: [
        {
          title: "Scope",
          bodyMarkdown:
            "Commercial lending onboarding and KYC exception handling.",
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
          return {
            data: sponsorParticipantExists ? [{ id: "other-sponsor" }] : [],
            error: null,
          };
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
  return new Request(
    "http://test/api/v1/programs/prog-1/artifacts/artifact-1/client-approval",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

function uploadedReviewRequest(): Request {
  const form = new FormData();
  form.append("reason", "Synthetic reviewer approved the reviewed charter.");
  form.append(
    "file",
    new File(["Reviewed charter content."], "client-reviewed-charter.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
  );
  return new Request(
    "http://test/api/v1/programs/prog-1/artifacts/artifact-1/client-approval",
    { method: "POST", body: form },
  );
}

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const params = Promise.resolve({
  programId: "prog-1",
  artifactId: "artifact-1",
});

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(ctx);
  sponsorParticipantExists = true;
  routeSupabase = makeSupabase();
  mockGetProgramsRouteSupabase.mockResolvedValue({ supabase: routeSupabase });
  mockGetProgramById.mockResolvedValue({ id: "prog-1", currentPhase: 1 });
  mockGetGeneratedArtifactById.mockResolvedValue(generatedArtifact);
  mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
    revision: "revision-current",
    approvedEvidenceCount: 1,
    rows: [],
    latestEvidenceActivityAt: null,
    revisionByPhase: {
      1: "revision-current",
      2: "revision-current",
      3: "revision-current",
      4: "revision-current",
      5: "revision-current",
    },
    latestEvidenceActivityAtByPhase: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
    },
  });
  mockHasAuthority.mockResolvedValue(false);
  mockLoadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: true });
  mockDraftModuleDeliverable.mockResolvedValue({
    deliverableId: "deliverable-1",
    versionId: "version-1",
  });
  mockSignOffDeliverable.mockResolvedValue(true);
  mockSaveMoveArtifact.mockResolvedValue({
    artifactId: "stored-final-artifact-1",
    version: 1,
    blobPath:
      "moves/arcturus/prog-1/generated/p1/charter/v1/Program Charter.docx",
    blobStored: true,
  });
  mockRenderDeliverableDocx.mockReturnValue({ doc: "docx" });
  mockRenderDeliverablePptx.mockResolvedValue(Buffer.from("pptx"));
  mockRenderValidatedDeck.mockResolvedValue({
    buffer: Buffer.from("pptx"),
    physicallyIntact: true,
    integrityFailures: [],
    usedSectionFallback: false,
    verdict: { ok: true, findings: [], renderedPptxSlides: 3 },
  });
  mockPackerToBuffer.mockResolvedValue(Buffer.from("docx"));
  mockRenderValidatedDocx.mockResolvedValue(Buffer.from("docx"));
  mockLoadApprovedSolutionApproach.mockResolvedValue({
    decisionHash: "decision-hash",
    selectedOptionId: "option-2",
    selectedOptionVersion: "1",
  });
  mockLoadCurrentMoveContextExtractFreshness.mockResolvedValue({
    evidenceFingerprint: "context-hash",
    freshnessStatus: "fresh",
  });
});

export {};

describe("POST /api/v1/programs/[programId]/artifacts/[artifactId]/client-approval", () => {
  it("does not create sponsor authority while an authorized user approves a generated artifact", async () => {
    sponsorParticipantExists = false;
    const { POST } = await import("../route");

    const res = await POST(
      request({
        reason: "Authorized user reviewed the generated charter.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    expect(
      routeSupabase.from.mock.calls.filter(
        ([table]) => table === "engagement_participants",
      ),
    ).toEqual([]);
  });

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
        structuredData: expect.objectContaining({
          evidenceSnapshotHash: "revision-current",
          generatedArtifactId: "artifact-1",
        }),
      }),
    );
    expect(mockSignOffDeliverable).toHaveBeenCalled();
    expect(mockSaveMoveArtifact).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        moveId: "prog-1",
        phase: 1,
        artifactType: "charter",
        artifactFamily: "generated_deliverable",
        fileFormat: "docx",
        status: "approved",
        sourceBasis: "generated_artifact_acceptance",
        requireBlobStored: true,
        metadata: expect.objectContaining({
          evidenceSnapshotHash: "revision-current",
          generatedArtifactId: "artifact-1",
        }),
      }),
    );
    expect(mockSignOffDeliverable).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      "deliverable-1",
      expect.objectContaining({
        approvedArtifactId: "stored-final-artifact-1",
        approvedContent: undefined,
        approvalLineage: {
          source: "generated_artifact_acceptance",
          generatedArtifactId: "artifact-1",
          evidenceSnapshotHash: "revision-current",
          phaseEvidenceSnapshotHash: "revision-current",
          evidenceSnapshotScope: "phase",
          // The moment the two revisions above were read. Without it the gate's
          // currency check cannot run and this approval reads as stale.
          generatedAt: expect.stringMatching(ISO_TIMESTAMP),
          approvalMode: "accept_ai_draft_as_authoritative",
        },
      }),
    );
  });

  it("copies the reviewed upload's verified artifact lineage onto the gate row", async () => {
    mockExtractProgramEvidenceFromUploadBuffer.mockResolvedValue({
      extractedText: "Reviewed charter content.",
      extractedStructured: {
        parse_method: "docx-mammoth",
        warnings: [],
      },
    });
    const { POST } = await import("../route");

    const res = await POST(uploadedReviewRequest() as never, { params });
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      approvalMode: "client_approved_replacement",
      deliverableTypeKey: "charter",
    });
    expect(mockSignOffDeliverable).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      "deliverable-1",
      expect.objectContaining({
        approvedArtifactId: "stored-final-artifact-1",
        approvedContent: expect.objectContaining({
          content: "Reviewed charter content.",
          generationLineage: expect.objectContaining({
            evidenceSnapshotHash: "revision-current",
          }),
        }),
        approvalLineage: {
          source: "generated_artifact_acceptance",
          generatedArtifactId: "artifact-1",
          evidenceSnapshotHash: "revision-current",
          phaseEvidenceSnapshotHash: "revision-current",
          evidenceSnapshotScope: "phase",
          // The moment the two revisions above were read. Without it the gate's
          // currency check cannot run and this approval reads as stale.
          generatedAt: expect.stringMatching(ISO_TIMESTAMP),
          approvalMode: "client_approved_replacement",
        },
      }),
    );
    expect(mockSaveMoveArtifact).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        sourceBasis: "client_approved_deliverable",
        confidence: "medium",
        citationReady: false,
        metadata: expect.objectContaining({
          factualClaimsIndependentlyEvidenceVerified: false,
        }),
      }),
    );
  });

  it("blocks a reviewed upload that introduces an unsupported financial amount", async () => {
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      metadata: {
        ...generatedArtifact.metadata,
        renderableDoc: {
          ...generatedArtifact.metadata.renderableDoc,
          generatedSections: [
            {
              title: "Value hypothesis",
              bodyMarkdown:
                "$8.0M is an unvalidated annual value hypothesis; Finance has not confirmed it.",
            },
          ],
        },
      },
    });
    mockExtractProgramEvidenceFromUploadBuffer.mockResolvedValue({
      extractedText: "$11.5M confirmed savings are approved.",
      extractedStructured: {
        parse_method: "docx-mammoth",
        warnings: [],
      },
    });
    const { POST } = await import("../route");

    const res = await POST(uploadedReviewRequest() as never, { params });
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(422);
    expect(json).toMatchObject({
      error: "unsupported_financial_claim_delta",
    });
    expect(json.detail).toContain("financial evidence");
    expect(mockSaveMoveArtifact).not.toHaveBeenCalled();
    expect(mockDraftModuleDeliverable).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("blocks a reviewed upload that upgrades an existing hypothesis to a confirmed claim", async () => {
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      metadata: {
        ...generatedArtifact.metadata,
        renderableDoc: {
          ...generatedArtifact.metadata.renderableDoc,
          generatedSections: [
            {
              title: "Value hypothesis",
              bodyMarkdown:
                "$8.0M is a value hypothesis and is not Finance validated.",
            },
          ],
        },
      },
    });
    mockExtractProgramEvidenceFromUploadBuffer.mockResolvedValue({
      extractedText:
        "$8,000,000 in savings is Finance validated and confirmed.",
      extractedStructured: {
        parse_method: "docx-mammoth",
        warnings: [],
      },
    });
    const { POST } = await import("../route");

    const res = await POST(uploadedReviewRequest() as never, { params });
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(422);
    expect(json).toMatchObject({
      error: "unsupported_financial_claim_delta",
    });
    expect(mockSaveMoveArtifact).not.toHaveBeenCalled();
    expect(mockDraftModuleDeliverable).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("allows equivalent formatting of an existing unvalidated amount", async () => {
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      metadata: {
        ...generatedArtifact.metadata,
        renderableDoc: {
          ...generatedArtifact.metadata.renderableDoc,
          generatedSections: [
            {
              title: "Value hypothesis",
              bodyMarkdown: "$8.0M remains an unvalidated value hypothesis.",
            },
          ],
        },
      },
    });
    mockExtractProgramEvidenceFromUploadBuffer.mockResolvedValue({
      extractedText: "$8,000,000 remains an unvalidated value hypothesis.",
      extractedStructured: {
        parse_method: "docx-mammoth",
        warnings: [],
      },
    });
    const { POST } = await import("../route");

    const res = await POST(uploadedReviewRequest() as never, { params });

    expect(res.status).toBe(200);
    expect(mockSaveMoveArtifact).toHaveBeenCalled();
    expect(mockSignOffDeliverable).toHaveBeenCalled();
  });

  it("does not sign off an accepted AI draft when final artifact storage is unavailable", async () => {
    mockSaveMoveArtifact.mockRejectedValue(
      new Error("artifact_blob_storage_unavailable"),
    );
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Client reviewer accepts this AI draft." }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(503);
    expect(json).toMatchObject({
      error: "artifact_storage_unavailable",
    });
    expect(mockDraftModuleDeliverable).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("does not approve a PPTX whose rendered slide quality gate remains blocked", async () => {
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      outputFormat: "pptx",
    });
    mockRenderValidatedDeck.mockResolvedValue({
      buffer: Buffer.from("pptx"),
      physicallyIntact: true,
      integrityFailures: [],
      usedSectionFallback: false,
      verdict: {
        ok: false,
        findings: [{ kind: "thin_slide", message: "slide 2 is a placeholder" }],
        renderedPptxSlides: 3,
      },
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({
        reason: "Synthetic reviewer attempted a test approval.",
      }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(422);
    expect(json).toMatchObject({
      error: "generated_artifact_final_render_failed",
    });
    expect(json.detail).toContain("generated_artifact_pptx_quality_failed");
    expect(mockSaveMoveArtifact).not.toHaveBeenCalled();
    expect(mockDraftModuleDeliverable).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("does not approve a DOCX whose declared figure failed packaged quality", async () => {
    mockRenderValidatedDocx.mockRejectedValue(
      new Error("generated_docx_failed_quality:empty_figure"),
    );
    const { POST } = await import("../route");

    const res = await POST(
      request({
        reason: "Synthetic reviewer attempted a test approval.",
      }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(422);
    expect(json).toMatchObject({
      error: "generated_artifact_final_render_failed",
    });
    expect(mockSaveMoveArtifact).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("refuses AI-draft acceptance when no final editable artifact can be rendered", async () => {
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      metadata: {
        evidenceSnapshotHash: "revision-current",
        deliverableTypeKey: "charter",
        renderedHtml: "<h1>Program Charter</h1><p>Preview only.</p>",
      },
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Client reviewer accepts this AI draft." }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(422);
    expect(json).toMatchObject({
      error: "generated_artifact_final_not_available",
    });
    expect(mockSaveMoveArtifact).not.toHaveBeenCalled();
    expect(mockDraftModuleDeliverable).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("finds generated artifacts persisted under the tenant key alias", async () => {
    mockGetGeneratedArtifactById.mockImplementation(
      async (_artifactId: string, opts: { clientId?: string }) =>
        opts.clientId === ctx.clientKey ? generatedArtifact : null,
    );
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Client reviewer accepts this AI draft." }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      artifactId: "artifact-1",
      deliverableTypeKey: "charter",
    });
    expect(mockGetGeneratedArtifactById).toHaveBeenNthCalledWith(
      1,
      "artifact-1",
      {
        clientId: ctx.clientId,
      },
    );
    expect(mockGetGeneratedArtifactById).toHaveBeenNthCalledWith(
      2,
      "artifact-1",
      {
        clientId: ctx.clientKey,
      },
    );
    expect(mockDraftModuleDeliverable).toHaveBeenCalled();
    expect(mockSignOffDeliverable).toHaveBeenCalled();
  });

  it("still denies callers without authorized-user gate permission", async () => {
    mockRequireTenancy.mockResolvedValue({ ...ctx, role: "founder" });
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      canApproveGates: false,
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Trying without approval authority." }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(403);
    expect(json).toMatchObject({
      error: "forbidden",
      detail: "Authorized Move approval permission required.",
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
        evidenceSnapshotHash: "revision-current",
        deliverableTypeKey: "root_cause_worksheet",
        renderableDoc: {
          title: "FS Demo — Onboarding & KYC Agent-Assist Discovery",
          deliverableTypeKey: "root_cause_worksheet",
          recommendation:
            "Use this root-cause worksheet to separate process, data, and control drivers.",
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
      request({
        reason: "Client accepts the reviewed root-cause worksheet.",
      }) as never,
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

  it("maps ambiguous P2 discovery and root-cause diagnostic titles to the discovery report gate artifact", async () => {
    mockGetProgramById.mockResolvedValue({ id: "prog-1", currentPhase: 2 });
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      sourceArtifactRef: "move:prog-1:phase:2",
      metadata: {
        evidenceSnapshotHash: "revision-current",
        renderableDoc: {
          title:
            "Commercial Onboarding & KYC-Evidence Agent-Assist — Discovery & Root Cause Diagnostic",
          recommendation:
            "Proceed to P3 draft shaping after sponsor review; no unresolved hard gaps remain.",
          generatedSections: [
            {
              title: "Diagnosis",
              bodyMarkdown:
                "Current-state workshops, baseline metrics, stakeholder map, and source-of-record notes indicate the diagnosis is ready for Design.",
            },
          ],
        },
      },
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({
        reason: "Client accepts the reviewed discovery diagnostic.",
      }) as never,
      { params },
    );
    const json = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      deliverableTypeKey: "discovery_report",
    });
    expect(mockDraftModuleDeliverable).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        programId: "prog-1",
        moduleKey: "diagnose",
        deliverableTypeKey: "discovery_report",
      }),
    );
    expect(mockSignOffDeliverable).toHaveBeenCalled();
  });

  it("blocks approval when a P3 architecture artifact lacks current lineage", async () => {
    mockGetProgramById.mockResolvedValue({ id: "prog-1", currentPhase: 3 });
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      sourceArtifactRef: "move:prog-1:phase:3",
      artifactType: "target_state_architecture",
      metadata: {
        evidenceSnapshotHash: "revision-current",
        deliverableTypeKey: "target_state_architecture",
        renderableDoc: {
          title: "Target Architecture",
          deliverableTypeKey: "target_state_architecture",
          generatedSections: [
            {
              title: "Architecture",
              bodyMarkdown: "Approved option architecture.",
            },
          ],
        },
      },
    });
    const { POST } = await import("../route");
    const res = await POST(
      request({ reason: "Approve stale architecture." }) as never,
      { params },
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: "architecture_lineage_not_current",
    });
    expect(mockDraftModuleDeliverable).not.toHaveBeenCalled();
  });

  it("preserves verified P3 architecture lineage in the authoritative deliverable", async () => {
    const lineage = {
      decisionHash: "decision-hash",
      decisionVersion: "v1",
      approvedOptionId: "option-2",
      approvedOptionVersion: "1",
      contextSnapshotHash: "context-hash",
      architectureModelVersion: "moves-architecture-model-v2",
    };
    mockGetProgramById.mockResolvedValue({ id: "prog-1", currentPhase: 3 });
    mockGetGeneratedArtifactById.mockResolvedValue({
      ...generatedArtifact,
      sourceArtifactRef: "move:prog-1:phase:3",
      artifactType: "target_state_architecture",
      metadata: {
        evidenceSnapshotHash: "revision-current",
        deliverableTypeKey: "target_state_architecture",
        generationLineage: lineage,
        renderableDoc: {
          title: "Target Architecture",
          deliverableTypeKey: "target_state_architecture",
          generatedSections: [
            {
              title: "Architecture",
              bodyMarkdown: "Approved option architecture.",
            },
          ],
        },
      },
    });
    const { POST } = await import("../route");
    const res = await POST(
      request({ reason: "Architecture reviewed." }) as never,
      { params },
    );
    expect(res.status).toBe(200);
    expect(mockDraftModuleDeliverable).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        structuredData: expect.objectContaining({
          evidenceSnapshotHash: "revision-current",
          generationLineage: expect.objectContaining({
            ...lineage,
            evidenceSnapshotHash: "revision-current",
          }),
        }),
      }),
    );
  });

  it("blocks approval when approved evidence changed after generation", async () => {
    mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
      revision: "revision-after-review",
      approvedEvidenceCount: 2,
      rows: [],
      latestEvidenceActivityAt: "2026-07-23T00:00:00.000Z",
      revisionByPhase: {
        1: "revision-after-review",
        2: "revision-after-review",
        3: "revision-after-review",
        4: "revision-after-review",
        5: "revision-after-review",
      },
      latestEvidenceActivityAtByPhase: {
        1: "2026-07-23T00:00:00.000Z",
        2: "2026-07-23T00:00:00.000Z",
        3: "2026-07-23T00:00:00.000Z",
        4: "2026-07-23T00:00:00.000Z",
        5: "2026-07-23T00:00:00.000Z",
      },
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Review the current generated document." }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: "stale_approved_evidence_snapshot",
    });
    expect(mockSaveMoveArtifact).not.toHaveBeenCalled();
    expect(mockDraftModuleDeliverable).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  // The route's own text already hedged — "or its evidence revision cannot be
  // verified" — while the code stayed `stale_` and the prescription stayed
  // "Rebuild the phase outputs before approval." For an unreadable basis the
  // rebuild re-reads the same basis, and the rebuild path refuses it the same
  // way, so the two controls pointed at each other. The refusal stands (this
  // route stamps a lineage it cannot read); only the claim changes.
  // `TenancyCtx` declares `clientKey?: string` and `assertTenancy` requires only
  // clientId + userId, so this route can run with no tenant key — and then the
  // approved-evidence read was never issued at all. Its own cause, distinct from
  // a read that ran and could not answer, so an operator is not sent to look at
  // the data when the request never reached it.
  it("names a missing tenant key as its own unevaluable cause", async () => {
    mockRequireTenancy.mockResolvedValue({ ...ctx, clientKey: undefined });
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Review the current generated document." }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; detail: string };
    expect(body.error).toBe("approved_evidence_basis_unevaluable");
    expect(body.detail).toContain("no active tenant key was resolved");
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("refuses approval without calling the document stale when the evidence basis cannot be read", async () => {
    mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue(null);
    const { POST } = await import("../route");

    const res = await POST(
      request({ reason: "Review the current generated document." }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; detail: string };
    expect(body.error).toBe("approved_evidence_basis_unevaluable");
    expect(body.detail).toContain("was not verified as changed");
    expect(body.detail).not.toMatch(/\bRebuild\b/);
    expect(mockSaveMoveArtifact).not.toHaveBeenCalled();
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });
});
