const listMoveArtifacts = jest.fn();
const downloadArtifactBytes = jest.fn();

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  listMoveArtifacts: (...args: unknown[]) => listMoveArtifacts(...args),
  downloadArtifactBytes: (...args: unknown[]) => downloadArtifactBytes(...args),
}));

const ctx = {
  clientId: "tenant-1",
  clientKey: "tenant-key",
  userId: "user-1",
} as const;

const acceptedReview = {
  reviewId: "review-1",
  proposalSetId: "proposal-set-1",
  moveId: "move-1",
  transition: { fromPhase: 1, toPhase: 2, stage: "P1 to P2" },
  sourceProposalSetArtifact: {
    artifactId: "proposal-artifact-1",
    artifactVersion: 1,
  },
  reviewer: { userId: "user-1", email: "reviewer@example.com" },
  reviewedAt: "2026-08-20T00:00:00.000Z",
  summary: {
    proposalCount: 2,
    pendingCount: 0,
    acceptedCount: 2,
    rejectedCount: 0,
    needsValidationCount: 0,
    acceptedAnswerStates: {
      answered: 0,
      unknown: 1,
      insufficient_evidence: 1,
      blank: 0,
    },
    readiness: {
      ready: 0,
      partial: 0,
      insufficientEvidence: 1,
      unknown: 1,
    },
  },
  decisions: [],
  acceptedResponses: [
    {
      proposalId: "proposal-1",
      questionId: "q_baseline",
      dimensionId: "baseline_metrics",
      requirement: "required",
      sourceClass: "client_metric",
      question: "Provide baseline.",
      response: "Unknown",
      context: "Current latency has not been measured.",
      evidenceOrSource: "",
      owner: "Operations",
      workbookLocation: { sheetName: "Performance", rowNumber: 2 },
      answerState: "unknown",
      acceptedAt: "2026-08-20T00:00:00.000Z",
      acceptedBy: "user-1",
    },
    {
      proposalId: "proposal-2",
      questionId: "q_volume",
      dimensionId: "delay_volume",
      requirement: "required",
      sourceClass: "evidence_gap",
      question: "Provide volume.",
      response: "Insufficient evidence",
      context: "No client source establishes annual volume.",
      evidenceOrSource: "Discovery workbook",
      owner: "Finance",
      workbookLocation: { sheetName: "Performance", rowNumber: 3 },
      answerState: "insufficient_evidence",
      acceptedAt: "2026-08-20T00:00:00.000Z",
      acceptedBy: "user-1",
    },
  ],
  proposals: [
    {
      questionId: "q_baseline",
      dimensionId: "baseline_metrics",
      requirement: "required",
      answerState: "unknown",
      disposition: "accepted",
    },
    {
      questionId: "q_volume",
      dimensionId: "delay_volume",
      requirement: "required",
      answerState: "insufficient_evidence",
      disposition: "accepted",
    },
  ],
};

describe("accepted stage readiness context", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    listMoveArtifacts.mockResolvedValue([
      {
        artifact_id: "review-artifact-1",
        version: 3,
        phase: 1,
        artifact_type: "stage_readiness_workbook_proposal_review",
        metadata: {
          acceptedCount: 2,
          pendingCount: 0,
          needsValidationCount: 0,
        },
      },
    ]);
    downloadArtifactBytes.mockResolvedValue({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from(JSON.stringify(acceptedReview)),
    });
  });

  it("loads only a complete accepted review for the requested target phase", async () => {
    const {
      loadAcceptedStageReadinessContext,
      formatAcceptedStageReadinessContextForPrompt,
    } = await import("../accepted-context");

    const context = await loadAcceptedStageReadinessContext(ctx, "move-1", 2);

    expect(context).toMatchObject({
      moveId: "move-1",
      sourcePhase: 1,
      targetPhase: 2,
      reviewArtifactId: "review-artifact-1",
      reviewArtifactVersion: 3,
    });
    expect(context?.acceptedResponses).toHaveLength(2);
    expect(context?.proposals).toMatchObject([
      expect.objectContaining({ answerState: "unknown" }),
      expect.objectContaining({ answerState: "insufficient_evidence" }),
    ]);
    const prompt = formatAcceptedStageReadinessContextForPrompt(context);
    expect(prompt).toContain("Accepted Stage Readiness Workbook Responses");
    expect(prompt).toContain("Readiness: unknown");
    expect(prompt).toContain("Readiness: insufficient evidence");
    expect(prompt).toContain("do not infer the missing fact");
  });

  it("excludes pending or needs-validation reviews from next-phase context", async () => {
    listMoveArtifacts.mockResolvedValueOnce([
      {
        artifact_id: "review-artifact-1",
        version: 3,
        phase: 1,
        artifact_type: "stage_readiness_workbook_proposal_review",
        metadata: {
          acceptedCount: 2,
          pendingCount: 0,
          needsValidationCount: 1,
        },
      },
    ]);
    const { loadAcceptedStageReadinessContext } =
      await import("../accepted-context");

    await expect(
      loadAcceptedStageReadinessContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
    expect(downloadArtifactBytes).not.toHaveBeenCalled();
  });

  it("excludes review bytes whose move or transition no longer match", async () => {
    downloadArtifactBytes.mockResolvedValueOnce({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from(
        JSON.stringify({
          ...acceptedReview,
          transition: { fromPhase: 1, toPhase: 3, stage: "wrong" },
        }),
      ),
    });
    const { loadAcceptedStageReadinessContext } =
      await import("../accepted-context");

    await expect(
      loadAcceptedStageReadinessContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });
});

/**
 * The partial-review sibling, tested beside the strict loader on purpose: the
 * ONLY difference between them that matters is which dispositions they admit,
 * and these cases pin that difference against the same fake artifact store.
 */
describe("stage readiness gate proposals — the review as it stands", () => {
  /** The same review, except one RECOMMENDED response was never decided. */
  const heldByRecommended = {
    ...acceptedReview,
    summary: {
      ...acceptedReview.summary,
      proposalCount: 3,
      pendingCount: 1,
    },
    proposals: [
      ...acceptedReview.proposals,
      {
        questionId: "q_optional_context",
        dimensionId: "nice_to_have_context",
        requirement: "recommended",
        answerState: "blank",
        disposition: "pending",
        evidenceOrSource: "",
      },
    ],
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    listMoveArtifacts.mockResolvedValue([
      {
        artifact_id: "review-artifact-1",
        version: 3,
        phase: 1,
        artifact_type: "stage_readiness_workbook_proposal_review",
        metadata: { acceptedCount: 2, pendingCount: 1, needsValidationCount: 0 },
      },
    ]);
    downloadArtifactBytes.mockResolvedValue({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from(JSON.stringify(heldByRecommended)),
    });
  });

  it("reads a review the strict loader refuses, which is the whole point", async () => {
    const { loadStageReadinessGateProposals } = await import(
      "../gate-proposal-context"
    );
    const { loadAcceptedStageReadinessContext } = await import(
      "../accepted-context"
    );

    // Strict: one undecided response means the review is not finished, so no
    // response may feed the next phase's prompt.
    await expect(
      loadAcceptedStageReadinessContext(ctx, "move-1", 2),
    ).resolves.toBeNull();

    // Gate: the review exists and both required responses are accepted.
    const proposals = await loadStageReadinessGateProposals(ctx, "move-1", 2);
    expect(proposals).toHaveLength(3);
    expect(proposals).toEqual([
      expect.objectContaining({
        dimensionId: "baseline_metrics",
        requirement: "required",
        disposition: "accepted",
      }),
      expect.objectContaining({
        dimensionId: "delay_volume",
        requirement: "required",
        disposition: "accepted",
      }),
      expect.objectContaining({
        dimensionId: "nice_to_have_context",
        requirement: "recommended",
        disposition: "pending",
        answerState: "blank",
      }),
    ]);
  });

  it("is still null when no review artifact exists for the source phase", async () => {
    listMoveArtifacts.mockResolvedValueOnce([
      {
        artifact_id: "other-artifact",
        version: 1,
        // A review for a DIFFERENT transition is not this transition's review.
        phase: 2,
        artifact_type: "stage_readiness_workbook_proposal_review",
        metadata: {},
      },
    ]);
    const { loadStageReadinessGateProposals } = await import(
      "../gate-proposal-context"
    );

    await expect(
      loadStageReadinessGateProposals(ctx, "move-1", 2),
    ).resolves.toBeNull();
    expect(downloadArtifactBytes).not.toHaveBeenCalled();
  });

  it("refuses a review whose stored move or transition no longer matches", async () => {
    const { loadStageReadinessGateProposals } = await import(
      "../gate-proposal-context"
    );

    downloadArtifactBytes.mockResolvedValueOnce({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from(
        JSON.stringify({ ...heldByRecommended, moveId: "move-2" }),
      ),
    });
    await expect(
      loadStageReadinessGateProposals(ctx, "move-1", 2),
    ).resolves.toBeNull();

    downloadArtifactBytes.mockResolvedValueOnce({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from(
        JSON.stringify({
          ...heldByRecommended,
          transition: { fromPhase: 1, toPhase: 3, stage: "wrong" },
        }),
      ),
    });
    await expect(
      loadStageReadinessGateProposals(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("treats unreadable or empty review bytes as no review at all", async () => {
    const { loadStageReadinessGateProposals } = await import(
      "../gate-proposal-context"
    );

    downloadArtifactBytes.mockResolvedValueOnce({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from("{ not json"),
    });
    await expect(
      loadStageReadinessGateProposals(ctx, "move-1", 2),
    ).resolves.toBeNull();

    downloadArtifactBytes.mockResolvedValueOnce({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from(JSON.stringify({ ...heldByRecommended, proposals: [] })),
    });
    await expect(
      loadStageReadinessGateProposals(ctx, "move-1", 2),
    ).resolves.toBeNull();

    downloadArtifactBytes.mockResolvedValueOnce(null);
    await expect(
      loadStageReadinessGateProposals(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("fails closed on an unrecognised requirement, disposition or answer state", async () => {
    const { loadStageReadinessGateProposals } = await import(
      "../gate-proposal-context"
    );

    downloadArtifactBytes.mockResolvedValueOnce({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from(
        JSON.stringify({
          ...heldByRecommended,
          proposals: [
            {
              questionId: "q_odd",
              dimensionId: "odd_family",
              requirement: "whatever",
              answerState: "whatever",
              disposition: "whatever",
            },
          ],
        }),
      ),
    });

    // An unreadable requirement must gate, an unreadable decision must not
    // count as a decision, and an unreadable answer must not count as answered.
    await expect(
      loadStageReadinessGateProposals(ctx, "move-1", 2),
    ).resolves.toEqual([
      {
        questionId: "q_odd",
        dimensionId: "odd_family",
        requirement: "required",
        answerState: "blank",
        disposition: "pending",
        evidenceOrSource: "",
      },
    ]);
  });

  it("asks the store for nothing when the target phase has no predecessor", async () => {
    const { loadStageReadinessGateProposals } = await import(
      "../gate-proposal-context"
    );

    await expect(
      loadStageReadinessGateProposals(ctx, "move-1", 0),
    ).resolves.toBeNull();
    expect(listMoveArtifacts).not.toHaveBeenCalled();
  });
});
