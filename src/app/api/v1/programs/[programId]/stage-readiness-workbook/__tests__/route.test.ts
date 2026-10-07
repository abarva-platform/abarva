const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockLoadDiscoveryEvidenceReadiness = jest.fn();
const mockBuildMoveEvidenceNeedPackets = jest.fn();
const mockBuildStageReadinessWorkbookSpec = jest.fn();
const mockRenderStageReadinessWorkbookXlsx = jest.fn();
const mockParseStageReadinessWorkbookXlsx = jest.fn();
const mockPersistStageReadinessProposalSet = jest.fn();
const mockPersistStageReadinessProposalReview = jest.fn();
const mockGetMoveArtifactForTenant = jest.fn();
const mockDownloadArtifactBytes = jest.fn();
const mockListMoveArtifacts = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
}));

jest.mock("@/lib/programs/discovery/evidence-readiness", () => ({
  loadDiscoveryEvidenceReadiness: (ctx: unknown, programId: string) =>
    mockLoadDiscoveryEvidenceReadiness(ctx, programId),
}));

jest.mock(
  "@/lib/programs/evidence-readiness/move-evidence-need-packet",
  () => ({
    buildMoveEvidenceNeedPackets: (input: unknown) =>
      mockBuildMoveEvidenceNeedPackets(input),
  }),
);

jest.mock("@/lib/programs/stage-readiness-workbooks/resolver", () => ({
  buildStageReadinessWorkbookSpec: (input: unknown) =>
    mockBuildStageReadinessWorkbookSpec(input),
}));

jest.mock("@/lib/programs/stage-readiness-workbooks/xlsx", () => ({
  renderStageReadinessWorkbookXlsx: (spec: unknown) =>
    mockRenderStageReadinessWorkbookXlsx(spec),
}));

jest.mock("@/lib/programs/stage-readiness-workbooks/parser", () => ({
  parseStageReadinessWorkbookXlsx: (input: unknown, options: unknown) =>
    mockParseStageReadinessWorkbookXlsx(input, options),
}));

// The persist calls are mocked, but `isReviewForStageReadinessProposalSet` is
// the real one: `review-accumulation` runs unmocked in this suite so the
// multi-batch review path is exercised through the route, not around it.
jest.mock("@/lib/programs/stage-readiness-workbooks/proposals", () => ({
  ...jest.requireActual("@/lib/programs/stage-readiness-workbooks/proposals"),
  persistStageReadinessProposalSet: (input: unknown) =>
    mockPersistStageReadinessProposalSet(input),
  persistStageReadinessProposalReview: (input: unknown) =>
    mockPersistStageReadinessProposalReview(input),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  getMoveArtifactForTenant: (ctx: unknown, artifactId: string) =>
    mockGetMoveArtifactForTenant(ctx, artifactId),
  downloadArtifactBytes: (ctx: unknown, artifactId: string) =>
    mockDownloadArtifactBytes(ctx, artifactId),
  listMoveArtifacts: (ctx: unknown, moveId: string, options: unknown) =>
    mockListMoveArtifacts(ctx, moveId, options),
}));

const params = Promise.resolve({ programId: "move-1" });
const ctx = {
  clientId: "client-1",
  clientKey: "tenant-1",
  userId: "person-1",
};

function req(
  url = "http://test/api/v1/programs/move-1/stage-readiness-workbook",
) {
  return new Request(url);
}

function uploadReq(
  url = "http://test/api/v1/programs/move-1/stage-readiness-workbook",
) {
  const form = new FormData();
  form.set("file", new File([Buffer.from("xlsx")], "workbook.xlsx"));
  return new Request(url, { method: "POST", body: form });
}

function jsonUploadReq(
  body: unknown = {
    workbookBase64: Buffer.from("xlsx").toString("base64"),
  },
  url = "http://test/api/v1/programs/move-1/stage-readiness-workbook",
) {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function patchReq(body: unknown) {
  return new Request(
    "http://test/api/v1/programs/move-1/stage-readiness-workbook",
    {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    },
  );
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(ctx);
  mockGetProgramById.mockResolvedValue({
    id: "move-1",
    name: "Predictive Reliability",
    currentPhase: 1,
    archivedAt: null,
    deletedAt: null,
  });
  mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
    archetypeLabel: "Data-Intensive Predictive Use Case",
  });
  mockBuildMoveEvidenceNeedPackets.mockReturnValue([
    { familyId: "kpi_baseline" },
  ]);
  mockBuildStageReadinessWorkbookSpec.mockReturnValue({
    workbookId: "move-1:p1-p2:stage-readiness",
    metadata: { workbookContentHash: "abc123" },
  });
  mockRenderStageReadinessWorkbookXlsx.mockResolvedValue(Buffer.from("xlsx"));
  // No stored review by default: the first review batch of a proposal set has
  // nothing to carry forward.
  mockListMoveArtifacts.mockResolvedValue([]);
  mockParseStageReadinessWorkbookXlsx.mockResolvedValue({
    ok: true,
    metadata: {
      workbookId: "move-1:p1-p2:stage-readiness",
      moveId: "move-1",
      phase: 1,
      nextPhase: 2,
    },
    responses: [
      {
        questionId: "q-1",
        dimensionId: "business_process",
        response: "Confirmed",
      },
    ],
    issues: [],
    summary: {
      totalQuestions: 1,
      answeredQuestions: 1,
      requiredAnswered: 1,
      requiredTotal: 1,
      warningCount: 0,
      errorCount: 0,
    },
  });
  mockPersistStageReadinessProposalSet.mockResolvedValue({
    artifactId: "proposal-artifact-1",
    artifactVersion: 1,
    blobStored: true,
    proposalSet: {
      proposalSetId: "proposal-set-1",
      summary: {
        proposalCount: 1,
        pendingCount: 1,
        answerStates: {
          answered: 1,
          unknown: 0,
          insufficient_evidence: 0,
          blank: 0,
        },
      },
      proposals: [
        {
          proposalId: "proposal-1",
          questionId: "q-1",
          dimensionId: "business_process",
          requirement: "required",
          question: "Confirm process.",
          response: "Confirmed",
          answerState: "answered",
          disposition: "pending",
        },
      ],
    },
  });
  mockGetMoveArtifactForTenant.mockResolvedValue({
    artifact_id: "proposal-artifact-1",
    move_id: "move-1",
    artifact_type: "stage_readiness_workbook_proposal_set",
    version: 2,
  });
  mockDownloadArtifactBytes.mockResolvedValue({
    fileName: "proposal-set.json",
    fileFormat: "json",
    bytes: Buffer.from(
      JSON.stringify({
        proposalSetId: "proposal-set-1",
        moveId: "move-1",
        transition: { fromPhase: 1, toPhase: 2, stage: "P1 to P2" },
        proposals: [
          {
            proposalId: "proposal-1",
            questionId: "q-1",
            dimensionId: "baseline_metrics",
            requirement: "required",
            sourceClass: "client_metric",
            question: "Provide baseline.",
            response: "Unknown",
            context: "Current latency has not been measured.",
            evidenceOrSource: "",
            owner: "Operations",
            workbookLocation: {
              sheetName: "Performance & Value",
              rowNumber: 2,
            },
            answerState: "unknown",
            disposition: "pending",
          },
          {
            proposalId: "proposal-2",
            questionId: "q-2",
            dimensionId: "delay_volume",
            requirement: "required",
            sourceClass: "evidence_gap",
            question: "Provide volume.",
            response: "Insufficient evidence",
            context: "No client source establishes annual volume.",
            evidenceOrSource: "",
            owner: "Finance",
            workbookLocation: {
              sheetName: "Performance & Value",
              rowNumber: 3,
            },
            answerState: "insufficient_evidence",
            disposition: "pending",
          },
        ],
      }),
    ),
  });
  mockPersistStageReadinessProposalReview.mockResolvedValue({
    artifactId: "review-artifact-1",
    artifactVersion: 1,
    blobStored: true,
    proposalReview: {
      reviewId: "review-1",
      proposalSetId: "proposal-set-1",
      summary: {
        acceptedCount: 1,
        rejectedCount: 0,
        needsValidationCount: 1,
        pendingCount: 0,
        acceptedAnswerStates: {
          answered: 0,
          unknown: 1,
          insufficient_evidence: 0,
          blank: 0,
        },
        readiness: {
          ready: 0,
          partial: 0,
          insufficientEvidence: 0,
          unknown: 1,
        },
      },
      acceptedResponses: [{ questionId: "q-1" }],
    },
  });
});

describe("GET /api/v1/programs/[programId]/stage-readiness-workbook", () => {
  it("renders a deterministic XLSX workbook for the current phase", async () => {
    const { GET } = await import("../route");
    const res = await GET(req(), { params });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers.get("content-disposition")).toContain(
      "predictive-reliability-p1-p2-readiness-workbook.xlsx",
    );
    expect(res.headers.get("x-abarva-workbook-id")).toBe(
      "move-1:p1-p2:stage-readiness",
    );
    await expect(res.arrayBuffer()).resolves.toHaveProperty("byteLength", 4);

    expect(mockBuildMoveEvidenceNeedPackets).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "move-1",
        moveName: "Predictive Reliability",
        currentPhase: 1,
      }),
    );
    expect(mockBuildStageReadinessWorkbookSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "move-1",
        phase: 1,
        nextPhase: 2,
        archetype: "Data-Intensive Predictive Use Case",
      }),
    );
  });

  it("allows an explicit phase query within the transition range", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      req(
        "http://test/api/v1/programs/move-1/stage-readiness-workbook?phase=3",
      ),
      { params },
    );

    expect(res.status).toBe(200);
    expect(mockBuildStageReadinessWorkbookSpec).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 3, nextPhase: 4 }),
    );
  });

  it("rejects phases outside supported next-phase transitions", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      req(
        "http://test/api/v1/programs/move-1/stage-readiness-workbook?phase=5",
      ),
      { params },
    );

    expect(res.status).toBe(400);
    expect(mockRenderStageReadinessWorkbookXlsx).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/programs/[programId]/stage-readiness-workbook", () => {
  it("stores an uploaded workbook as a pending proposal set without accepting the responses", async () => {
    const { POST } = await import("../route");
    const res = await POST(uploadReq(), { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      metadata: {
        workbookId: "move-1:p1-p2:stage-readiness",
        moveId: "move-1",
      },
      summary: { totalQuestions: 1, answeredQuestions: 1 },
      proposalSet: {
        proposalSetId: "proposal-set-1",
        artifactId: "proposal-artifact-1",
        status: "review_required",
        proposalCount: 1,
        pendingCount: 1,
        message:
          "Workbook responses were stored as pending proposals. They do not feed P2 until accepted.",
      },
    });
    expect(mockParseStageReadinessWorkbookXlsx).toHaveBeenCalledWith(
      expect.any(Buffer),
      { expectedMoveId: "move-1", expectedPhase: 1 },
    );
    expect(mockPersistStageReadinessProposalSet).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx,
        parsed: expect.objectContaining({ ok: true }),
        uploadedWorkbookSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(mockBuildStageReadinessWorkbookSpec).not.toHaveBeenCalled();
    expect(mockRenderStageReadinessWorkbookXlsx).not.toHaveBeenCalled();
  });

  it("stores a base64 JSON workbook upload through the same pending proposal path", async () => {
    const { POST } = await import("../route");
    const res = await POST(jsonUploadReq(), { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      proposalSet: {
        proposalSetId: "proposal-set-1",
        artifactId: "proposal-artifact-1",
        status: "review_required",
        pendingCount: 1,
      },
    });
    expect(mockParseStageReadinessWorkbookXlsx).toHaveBeenCalledWith(
      Buffer.from("xlsx"),
      { expectedMoveId: "move-1", expectedPhase: 1 },
    );
    expect(mockPersistStageReadinessProposalSet).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx,
        parsed: expect.objectContaining({ ok: true }),
        uploadedWorkbookSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
  });

  it("returns 422 when workbook metadata does not match the route context", async () => {
    mockParseStageReadinessWorkbookXlsx.mockResolvedValueOnce({
      ok: false,
      metadata: {
        workbookId: "other:p1-p2:stage-readiness",
        moveId: "other",
        phase: 1,
        nextPhase: 2,
      },
      responses: [],
      issues: [
        {
          severity: "error",
          code: "move_mismatch",
          message:
            "Workbook moveId other does not match expected moveId move-1.",
        },
      ],
      summary: {
        totalQuestions: 0,
        answeredQuestions: 0,
        requiredAnswered: 0,
        requiredTotal: 0,
        warningCount: 0,
        errorCount: 1,
      },
    });

    const { POST } = await import("../route");
    const res = await POST(uploadReq(), { params });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "move_mismatch" })],
      proposalSet: null,
    });
    expect(mockPersistStageReadinessProposalSet).not.toHaveBeenCalled();
  });

  it("rejects requests without a workbook file", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      new Request(
        "http://test/api/v1/programs/move-1/stage-readiness-workbook",
        {
          method: "POST",
          body: new FormData(),
        },
      ),
      { params },
    );

    expect(res.status).toBe(400);
    expect(mockParseStageReadinessWorkbookXlsx).not.toHaveBeenCalled();
  });

  it("rejects JSON workbook uploads without base64 bytes", async () => {
    const { POST } = await import("../route");
    const res = await POST(jsonUploadReq({ workbookBase64: "" }), { params });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "bad_request",
      detail: "workbookBase64 is required",
    });
    expect(mockParseStageReadinessWorkbookXlsx).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/v1/programs/[programId]/stage-readiness-workbook", () => {
  it("carries the dispositions of an earlier review batch forward, so a mixed review can clear the transition", async () => {
    // The stored proposal set is always all-pending. Without accumulation a
    // second batch recomputes the review from that set and discards the first
    // batch, which left `acceptedCount: 0` and held the phase forever.
    mockListMoveArtifacts.mockResolvedValue([
      {
        artifact_id: "review-artifact-1",
        move_id: "move-1",
        phase: 1,
        version: 1,
        artifact_type: "stage_readiness_workbook_proposal_review",
        metadata: {
          proposalSetId: "proposal-set-1",
          sourceProposalSetArtifact: {
            artifactId: "proposal-artifact-1",
            artifactVersion: 2,
          },
        },
      },
    ]);
    const priorReview = {
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from(
        JSON.stringify({
          proposalSetId: "proposal-set-1",
          sourceProposalSetArtifact: {
            artifactId: "proposal-artifact-1",
            artifactVersion: 2,
          },
          proposals: [
            { proposalId: "proposal-1", disposition: "accepted" },
            { proposalId: "proposal-2", disposition: "pending" },
          ],
        }),
      ),
    };
    const storedProposalSet = await mockDownloadArtifactBytes();
    mockDownloadArtifactBytes.mockReset();
    // The proposal set is read first, then the review this batch builds on.
    mockDownloadArtifactBytes
      .mockResolvedValueOnce(storedProposalSet)
      .mockResolvedValueOnce(priorReview);

    const { PATCH } = await import("../route");
    const res = await PATCH(
      patchReq({
        proposalSetArtifactId: "proposal-artifact-1",
        proposalSetArtifactVersion: 2,
        decisions: [{ proposalId: "proposal-2", disposition: "rejected" }],
      }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(mockPersistStageReadinessProposalReview).toHaveBeenCalledTimes(1);
    const persisted = mockPersistStageReadinessProposalReview.mock
      .calls[0][0] as {
      decisions: { proposalId: string; disposition: string }[];
    };
    expect(
      persisted.decisions.map((decision) => [
        decision.proposalId,
        decision.disposition,
      ]),
    ).toEqual([
      ["proposal-2", "rejected"],
      ["proposal-1", "accepted"],
    ]);
    // Exactly one of the two readings answers for a given set. A review that
    // belongs to THIS set is the merge's business, so the superseded reading
    // must stay silent and the two can never double-count a decision.
    const body = (await res.json()) as {
      proposalReview: { carriedForwardFromPriorUpload: number };
    };
    expect(body.proposalReview.carriedForwardFromPriorUpload).toBe(0);
  });

  // A corrected re-upload is a NEW proposal set with new ids for every row,
  // including the rows nobody touched. Carrying the superseded review forward
  // on ANSWER TEXT is what keeps one fixed cell from costing a whole re-review
  // — the widest archetype in the catalog carries 55 required answers across
  // a single transition.
  it("restores a superseded review's decision for a re-uploaded answer that did not change", async () => {
    mockListMoveArtifacts.mockResolvedValue([
      {
        artifact_id: "review-artifact-0",
        move_id: "move-1",
        phase: 1,
        version: 1,
        artifact_type: "stage_readiness_workbook_proposal_review",
        metadata: {
          proposalSetId: "a-superseded-set",
          sourceProposalSetArtifact: {
            artifactId: "proposal-artifact-0",
            artifactVersion: 1,
          },
        },
      },
    ]);

    const storedProposalSet = await mockDownloadArtifactBytes();
    mockDownloadArtifactBytes.mockReset();
    mockDownloadArtifactBytes
      .mockResolvedValueOnce(storedProposalSet)
      .mockResolvedValueOnce({
        fileName: "review.json",
        fileFormat: "json",
        bytes: Buffer.from(
          JSON.stringify({
            proposalSetId: "a-superseded-set",
            sourceProposalSetArtifact: {
              artifactId: "proposal-artifact-0",
              artifactVersion: 1,
            },
            // The predecessor's id for this row. It cannot match the current
            // set's `proposal-1` — `buildProposal` hashes the uploaded file —
            // so only the four answer fields can tie the two together.
            proposals: [
              {
                proposalId: "superseded-row-id",
                questionId: "q-1",
                response: "Unknown",
                context: "Current latency has not been measured.",
                evidenceOrSource: "",
                disposition: "accepted",
              },
            ],
          }),
        ),
      });

    const { PATCH } = await import("../route");
    const res = await PATCH(
      patchReq({
        proposalSetArtifactId: "proposal-artifact-1",
        proposalSetArtifactVersion: 2,
        decisions: [{ proposalId: "proposal-2", disposition: "rejected" }],
      }),
      { params },
    );

    expect(res.status).toBe(200);
    const persisted = mockPersistStageReadinessProposalReview.mock
      .calls[0][0] as {
      decisions: { proposalId: string; disposition: string; note?: string }[];
    };
    expect(
      persisted.decisions.map((decision) => [
        decision.proposalId,
        decision.disposition,
      ]),
    ).toEqual([
      ["proposal-2", "rejected"],
      ["proposal-1", "accepted"],
    ]);
    expect(persisted.decisions[1].note).toContain("previous upload");
    const body = (await res.json()) as {
      proposalReview: {
        carriedForwardFromPriorUpload: number;
        message: string;
      };
    };
    expect(body.proposalReview.carriedForwardFromPriorUpload).toBe(1);
    expect(body.proposalReview.message).toContain("previous upload");
  });

  it("withholds a superseded review's decision when the answer was edited", async () => {
    mockListMoveArtifacts.mockResolvedValue([
      {
        artifact_id: "review-artifact-0",
        move_id: "move-1",
        phase: 1,
        version: 1,
        artifact_type: "stage_readiness_workbook_proposal_review",
        metadata: {
          proposalSetId: "a-superseded-set",
          sourceProposalSetArtifact: {
            artifactId: "proposal-artifact-0",
            artifactVersion: 1,
          },
        },
      },
    ]);

    const storedProposalSet = await mockDownloadArtifactBytes();
    mockDownloadArtifactBytes.mockReset();
    mockDownloadArtifactBytes
      .mockResolvedValueOnce(storedProposalSet)
      .mockResolvedValueOnce({
        fileName: "review.json",
        fileFormat: "json",
        bytes: Buffer.from(
          JSON.stringify({
            proposalSetId: "a-superseded-set",
            sourceProposalSetArtifact: {
              artifactId: "proposal-artifact-0",
              artifactVersion: 1,
            },
            // Same question, DIFFERENT answer. An edited answer is a new
            // answer: the acceptance recorded against the old text says
            // nothing about this one, so it must be judged again.
            proposals: [
              {
                proposalId: "superseded-row-id",
                questionId: "q-1",
                response: "Measured at 240ms against the September extract.",
                context: "Current latency has not been measured.",
                evidenceOrSource: "",
                disposition: "accepted",
              },
            ],
          }),
        ),
      });

    const { PATCH } = await import("../route");
    const res = await PATCH(
      patchReq({
        proposalSetArtifactId: "proposal-artifact-1",
        proposalSetArtifactVersion: 2,
        decisions: [{ proposalId: "proposal-2", disposition: "rejected" }],
      }),
      { params },
    );

    expect(res.status).toBe(200);
    const persisted = mockPersistStageReadinessProposalReview.mock
      .calls[0][0] as {
      decisions: { proposalId: string; disposition: string }[];
    };
    expect(persisted.decisions).toEqual([
      { proposalId: "proposal-2", disposition: "rejected" },
    ]);
    const body = (await res.json()) as {
      proposalReview: { carriedForwardFromPriorUpload: number };
    };
    expect(body.proposalReview.carriedForwardFromPriorUpload).toBe(0);
  });

  it("records human review decisions for a proposal set without accepting unreviewed upload state", async () => {
    const { PATCH } = await import("../route");
    const res = await PATCH(
      patchReq({
        proposalSetArtifactId: "proposal-artifact-1",
        proposalSetArtifactVersion: 2,
        decisions: [
          { proposalId: "proposal-1", disposition: "accepted" },
          {
            proposalId: "proposal-2",
            disposition: "needs_validation",
            note: "Finance must source annual volume before value math.",
          },
        ],
      }),
      { params },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      proposalReview: {
        reviewId: "review-1",
        artifactId: "review-artifact-1",
        status: "review_required",
        acceptedCount: 1,
        needsValidationCount: 1,
        acceptedResponses: 1,
        message:
          "Human review recorded. Only accepted workbook responses can feed the next phase context.",
      },
    });
    expect(mockGetMoveArtifactForTenant).toHaveBeenCalledWith(
      ctx,
      "proposal-artifact-1",
    );
    expect(mockDownloadArtifactBytes).toHaveBeenCalledWith(
      ctx,
      "proposal-artifact-1",
    );
    expect(mockPersistStageReadinessProposalReview).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx,
        sourceProposalSetArtifactId: "proposal-artifact-1",
        sourceProposalSetArtifactVersion: 2,
        decisions: [
          { proposalId: "proposal-1", disposition: "accepted" },
          {
            proposalId: "proposal-2",
            disposition: "needs_validation",
            note: "Finance must source annual volume before value math.",
          },
        ],
      }),
    );
  });

  it("rejects stale proposal-set reviews with an explicit reload conflict", async () => {
    const { PATCH } = await import("../route");
    const res = await PATCH(
      patchReq({
        proposalSetArtifactId: "proposal-artifact-1",
        proposalSetArtifactVersion: 1,
        decisions: [{ proposalId: "proposal-1", disposition: "accepted" }],
      }),
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "proposal_set_unavailable",
      detail: "proposal set version changed; reload before reviewing",
    });
    expect(mockPersistStageReadinessProposalReview).not.toHaveBeenCalled();
  });

  it("rejects acceptance of a blank response even when context and sources exist", async () => {
    mockDownloadArtifactBytes.mockResolvedValueOnce({
      fileName: "proposal-set.json",
      fileFormat: "json",
      bytes: Buffer.from(
        JSON.stringify({
          proposalSetId: "proposal-set-1",
          moveId: "move-1",
          transition: { fromPhase: 1, toPhase: 2, stage: "P1 to P2" },
          proposals: [
            {
              proposalId: "blank-proposal",
              questionId: "q-process-current",
              answerState: "answered",
              response: "",
              context: "Available evidence: current workflow notes",
              evidenceOrSource: "Existing evidence: workflow-record-1",
              disposition: "pending",
            },
          ],
        }),
      ),
    });
    const { PATCH } = await import("../route");
    const res = await PATCH(
      patchReq({
        proposalSetArtifactId: "proposal-artifact-1",
        proposalSetArtifactVersion: 2,
        decisions: [
          { proposalId: "blank-proposal", disposition: "accepted" },
        ],
      }),
      { params },
    );

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({
      error: "blank_workbook_response",
    });
    expect(mockPersistStageReadinessProposalReview).not.toHaveBeenCalled();
  });

  it("rejects pending as an explicit human decision", async () => {
    const { PATCH } = await import("../route");
    const res = await PATCH(
      patchReq({
        proposalSetArtifactId: "proposal-artifact-1",
        decisions: [{ proposalId: "proposal-1", disposition: "pending" }],
      }),
      { params },
    );

    expect(res.status).toBe(400);
    expect(mockDownloadArtifactBytes).not.toHaveBeenCalled();
    expect(mockPersistStageReadinessProposalReview).not.toHaveBeenCalled();
  });
});

export {};
