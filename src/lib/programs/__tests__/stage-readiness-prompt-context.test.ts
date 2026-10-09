/**
 * The prompt reading of a transition review, which is a different policy from
 * the forward controls' finished-review reading.
 *
 * Lives in `src/lib/programs/__tests__` deliberately: that directory is
 * directory-swept by the required `AI surface control catalog` job, while
 * `stage-readiness-workbooks/__tests__` is swept only by the non-required
 * unit-suites workflow.
 */
jest.mock("server-only", () => ({}), { virtual: true });

const listMoveArtifacts = jest.fn();
const downloadArtifactBytes = jest.fn();

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  listMoveArtifacts: (...args: unknown[]) => listMoveArtifacts(...args),
  downloadArtifactBytes: (...args: unknown[]) => downloadArtifactBytes(...args),
}));

import {
  formatStageReadinessPromptContext,
  loadStageReadinessPromptContext,
} from "@/lib/programs/stage-readiness-workbooks/prompt-context";
import {
  formatAcceptedStageReadinessContextForPrompt,
  loadAcceptedStageReadinessContext,
} from "@/lib/programs/stage-readiness-workbooks/accepted-context";

const ctx = {
  clientId: "tenant-1",
  clientKey: "tenant-key",
  userId: "user-1",
} as const;

function acceptedResponse(overrides: Record<string, unknown> = {}) {
  return {
    proposalId: "proposal-1",
    questionId: "q_governance_owner",
    dimensionId: "data_governance_ownership",
    requirement: "required",
    sourceClass: "client_fact",
    question: "Who owns data governance decisions?",
    response: "The data governance council, chaired by the CDO office.",
    context: "Confirmed in the governance review session.",
    evidenceOrSource: "Existing evidence: ev-governance",
    owner: "CDO office",
    workbookLocation: { sheetName: "Data & Quality", rowNumber: 2 },
    answerState: "answered",
    acceptedAt: "2026-10-07T00:00:00.000Z",
    acceptedBy: "user-1",
    ...overrides,
  };
}

/**
 * A review with every required answer accepted and sourced, and ONE optional
 * response left undecided. A blank response cannot be accepted or rejected, and
 * every question of a non-required family is written `recommended`, so this is
 * the ordinary shape of a completed workbook — not an edge case.
 */
function reviewWithOneOpenOptionalResponse() {
  return {
    reviewId: "review-1",
    proposalSetId: "proposal-set-1",
    moveId: "move-1",
    transition: { fromPhase: 1, toPhase: 2, stage: "P1 to P2" },
    sourceProposalSetArtifact: {
      artifactId: "proposal-artifact-1",
      artifactVersion: 1,
    },
    reviewer: { userId: "user-1", email: "reviewer@example.com" },
    reviewedAt: "2026-10-07T00:00:00.000Z",
    summary: {
      proposalCount: 2,
      pendingCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      needsValidationCount: 0,
      acceptedAnswerStates: {
        answered: 1,
        unknown: 0,
        insufficient_evidence: 0,
        blank: 0,
      },
      readiness: {
        ready: 1,
        partial: 0,
        insufficientEvidence: 0,
        unknown: 0,
      },
    },
    decisions: [],
    acceptedResponses: [acceptedResponse()],
    proposals: [
      {
        proposalId: "proposal-1",
        questionId: "q_governance_owner",
        dimensionId: "data_governance_ownership",
        requirement: "required",
        answerState: "answered",
        disposition: "accepted",
        evidenceOrSource: "Existing evidence: ev-governance",
      },
      {
        proposalId: "proposal-2",
        questionId: "q_change_owner",
        dimensionId: "change_adoption_owner",
        requirement: "recommended",
        answerState: "blank",
        disposition: "pending",
        evidenceOrSource: "",
      },
    ],
  };
}

/** The upload the review above was recorded against, still under review. */
function proposalSetRow(overrides: Record<string, unknown> = {}) {
  return {
    artifact_id: "proposal-artifact-1",
    version: 1,
    phase: 1,
    artifact_type: "stage_readiness_workbook_proposal_set",
    status: "review_required",
    metadata: { proposalSetId: "proposal-set-1" },
    ...overrides,
  };
}

function artifactRow(
  metadata: Record<string, number>,
  setRow: Record<string, unknown> | null = proposalSetRow(),
) {
  return [
    {
      artifact_id: "review-artifact-1",
      version: 4,
      phase: 1,
      artifact_type: "stage_readiness_workbook_proposal_review",
      metadata: {
        ...metadata,
        proposalSetId: "proposal-set-1",
        sourceProposalSetArtifact: {
          artifactId: "proposal-artifact-1",
          artifactVersion: 1,
        },
      },
    },
    ...(setRow ? [setRow] : []),
  ];
}

const OPEN_COUNTS = {
  acceptedCount: 1,
  pendingCount: 1,
  needsValidationCount: 0,
};

function stored(review: unknown) {
  return {
    fileName: "review.json",
    fileFormat: "json",
    bytes: Buffer.from(JSON.stringify(review)),
  };
}

describe("stage readiness prompt context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listMoveArtifacts.mockResolvedValue(artifactRow(OPEN_COUNTS));
    downloadArtifactBytes.mockResolvedValue(
      stored(reviewWithOneOpenOptionalResponse()),
    );
  });

  it("gives the prompt every accepted answer while one response is still open", async () => {
    const promptContext = await loadStageReadinessPromptContext(
      ctx,
      "move-1",
      2,
    );

    expect(promptContext).not.toBeNull();
    expect(promptContext?.openResponseCount).toBe(1);
    expect(promptContext?.reviewOpen).toBe(true);
    expect(promptContext?.context.acceptedResponses).toHaveLength(1);
    expect(promptContext?.context.sourcePhase).toBe(1);
    expect(promptContext?.context.targetPhase).toBe(2);
    expect(promptContext?.context.reviewArtifactId).toBe("review-artifact-1");
    expect(promptContext?.context.reviewArtifactVersion).toBe(4);
  });

  it("is exactly the review the finished-review policy refuses", async () => {
    // The two readings driven apart on one stored review. This is the defect:
    // the prompt used to go through the policy on the right.
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.not.toBeNull();
    await expect(
      loadAcceptedStageReadinessContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("keeps the finished-review policy asserting the body, not just the row", async () => {
    // The artifact row and the review body are written from one summary, so
    // they agree by construction. The finished-review policy asserts both
    // anyway; this pins the second reading so it cannot quietly relax to the
    // row alone. The prompt reading is unaffected either way.
    const review = reviewWithOneOpenOptionalResponse();
    review.summary.pendingCount = 1;
    listMoveArtifacts.mockResolvedValue(
      artifactRow({
        acceptedCount: 1,
        pendingCount: 0,
        needsValidationCount: 0,
      }),
    );
    downloadArtifactBytes.mockResolvedValue(stored(review));

    await expect(
      loadAcceptedStageReadinessContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.not.toBeNull();
  });

  it("keeps the finished-review policy asserting needs-validation in the body", async () => {
    const review = reviewWithOneOpenOptionalResponse();
    review.summary.pendingCount = 0;
    review.summary.needsValidationCount = 1;
    listMoveArtifacts.mockResolvedValue(
      artifactRow({
        acceptedCount: 1,
        pendingCount: 0,
        needsValidationCount: 0,
      }),
    );
    downloadArtifactBytes.mockResolvedValue(stored(review));

    await expect(
      loadAcceptedStageReadinessContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
    const promptContext = await loadStageReadinessPromptContext(
      ctx,
      "move-1",
      2,
    );
    expect(promptContext?.openResponseCount).toBe(1);
  });

  it("counts needs-validation responses as open alongside pending ones", async () => {
    const review = reviewWithOneOpenOptionalResponse();
    review.summary.pendingCount = 2;
    review.summary.needsValidationCount = 3;
    listMoveArtifacts.mockResolvedValue(
      artifactRow({
        acceptedCount: 1,
        pendingCount: 2,
        needsValidationCount: 3,
      }),
    );
    downloadArtifactBytes.mockResolvedValue(stored(review));

    const promptContext = await loadStageReadinessPromptContext(
      ctx,
      "move-1",
      2,
    );

    expect(promptContext?.openResponseCount).toBe(5);
  });

  it("reports a finished review as closed, with no open-review caveat", async () => {
    const review = reviewWithOneOpenOptionalResponse();
    review.summary.pendingCount = 0;
    review.summary.proposalCount = 1;
    review.proposals = [review.proposals[0]];
    listMoveArtifacts.mockResolvedValue(
      artifactRow({
        acceptedCount: 1,
        pendingCount: 0,
        needsValidationCount: 0,
      }),
    );
    downloadArtifactBytes.mockResolvedValue(stored(review));

    const promptContext = await loadStageReadinessPromptContext(
      ctx,
      "move-1",
      2,
    );

    expect(promptContext?.openResponseCount).toBe(0);
    expect(promptContext?.reviewOpen).toBe(false);
    expect(formatStageReadinessPromptContext(promptContext)).not.toContain(
      "still open",
    );
  });

  it("names the open count in the prompt block, below the governance line", async () => {
    const promptContext = await loadStageReadinessPromptContext(
      ctx,
      "move-1",
      2,
    );
    const block = formatStageReadinessPromptContext(promptContext);

    expect(block).toContain(
      "## Accepted Stage Readiness Workbook Responses (P1 to P2)",
    );
    expect(block).toContain(
      "This review is still open: 1 workbook response(s) carry no decision yet and are excluded.",
    );
    expect(block).toContain(
      "The data governance council, chaired by the CDO office.",
    );
    expect(block).toContain(
      "Evidence/source: Existing evidence: ev-governance",
    );
    // The governance stance is unchanged and still stated.
    expect(block).toContain(
      "Pending, rejected, and needs-validation workbook proposals are excluded.",
    );
  });

  it("never carries an undecided response into the prompt block", async () => {
    const block = formatStageReadinessPromptContext(
      await loadStageReadinessPromptContext(ctx, "move-1", 2),
    );

    expect(block).not.toContain("q_change_owner");
    expect(block).not.toContain("change_adoption_owner");
  });

  it("has nothing to say when a review records no acceptance at all", async () => {
    const review = reviewWithOneOpenOptionalResponse();
    review.acceptedResponses = [];
    review.summary.acceptedCount = 0;
    review.summary.pendingCount = 2;
    listMoveArtifacts.mockResolvedValue(
      artifactRow({
        acceptedCount: 0,
        pendingCount: 2,
        needsValidationCount: 0,
      }),
    );
    downloadArtifactBytes.mockResolvedValue(stored(review));

    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
    expect(formatStageReadinessPromptContext(null)).toBe("");
  });

  it("returns nothing when no review artifact answers this transition", async () => {
    listMoveArtifacts.mockResolvedValue([]);

    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
    expect(downloadArtifactBytes).not.toHaveBeenCalled();
  });

  it("refuses a review body belonging to another Move or transition", async () => {
    const wrongTransition = reviewWithOneOpenOptionalResponse();
    wrongTransition.transition = { fromPhase: 1, toPhase: 3, stage: "wrong" };
    downloadArtifactBytes.mockResolvedValue(stored(wrongTransition));
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();

    const wrongMove = reviewWithOneOpenOptionalResponse();
    wrongMove.moveId = "another-move";
    downloadArtifactBytes.mockResolvedValue(stored(wrongMove));
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("refuses a review that cannot be parsed, rather than throwing", async () => {
    downloadArtifactBytes.mockResolvedValue({
      fileName: "review.json",
      fileFormat: "json",
      bytes: Buffer.from("{ not json"),
    });

    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("gives the prompt nothing from a review of an earlier upload", async () => {
    // The workbook was re-uploaded after review. The upload writes only a new
    // set, so the earlier review is still the current review artifact, and its
    // acceptances are answers to text this upload may have changed. The page
    // and the gate read every response of the new upload as undecided.
    listMoveArtifacts.mockResolvedValue(
      artifactRow(
        OPEN_COUNTS,
        proposalSetRow({
          artifact_id: "proposal-artifact-2",
          metadata: { proposalSetId: "proposal-set-2" },
        }),
      ),
    );

    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
    await expect(
      loadAcceptedStageReadinessContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
    // Refused on the rows: the superseded review is never downloaded.
    expect(downloadArtifactBytes).not.toHaveBeenCalled();
  });

  it("refuses a newer version of the same upload, as the gate does", async () => {
    // Identical workbook content yields the same proposal set id, so the id
    // alone cannot tell two uploads apart; the artifact version can.
    listMoveArtifacts.mockResolvedValue(
      artifactRow(OPEN_COUNTS, proposalSetRow({ version: 2 })),
    );

    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("refuses a different upload artifact carrying the same set id", async () => {
    listMoveArtifacts.mockResolvedValue(
      artifactRow(
        OPEN_COUNTS,
        proposalSetRow({ artifact_id: "proposal-artifact-2" }),
      ),
    );

    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("asserts membership on the review body, not only its row", async () => {
    const review = reviewWithOneOpenOptionalResponse();
    review.sourceProposalSetArtifact = {
      artifactId: "proposal-artifact-0",
      artifactVersion: 1,
    };
    downloadArtifactBytes.mockResolvedValue(stored(review));

    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();

    const otherSet = reviewWithOneOpenOptionalResponse();
    otherSet.proposalSetId = "proposal-set-0";
    downloadArtifactBytes.mockResolvedValue(stored(otherSet));
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("vouches for nothing when no upload is under review beside the review", async () => {
    listMoveArtifacts.mockResolvedValue(artifactRow(OPEN_COUNTS, null));
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();

    listMoveArtifacts.mockResolvedValue(
      artifactRow(OPEN_COUNTS, proposalSetRow({ status: "superseded" })),
    );
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();

    listMoveArtifacts.mockResolvedValue(
      artifactRow(OPEN_COUNTS, proposalSetRow({ phase: 2 })),
    );
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();

    listMoveArtifacts.mockResolvedValue(
      artifactRow(OPEN_COUNTS, proposalSetRow({ metadata: {} })),
    );
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
    expect(downloadArtifactBytes).not.toHaveBeenCalled();
  });

  it("does not match an upload with no set id to a review with none either", async () => {
    // Two missing ids are not one upload. Without its own guard the set id
    // would compare undefined to undefined and vouch for the review.
    const rows = artifactRow(OPEN_COUNTS, proposalSetRow({ metadata: {} }));
    const reviewRow = rows[0] as { metadata: Record<string, unknown> };
    delete reviewRow.metadata.proposalSetId;
    listMoveArtifacts.mockResolvedValue(rows);
    const review: Record<string, unknown> = {
      ...reviewWithOneOpenOptionalResponse(),
    };
    delete review.proposalSetId;
    downloadArtifactBytes.mockResolvedValue(stored(review));

    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 2),
    ).resolves.toBeNull();
  });

  it("asks for no review below phase 1", async () => {
    await expect(
      loadStageReadinessPromptContext(ctx, "move-1", 0),
    ).resolves.toBeNull();
    expect(listMoveArtifacts).not.toHaveBeenCalled();
  });

  it("keeps the shared renderer as the single renderer of responses", async () => {
    const promptContext = await loadStageReadinessPromptContext(
      ctx,
      "move-1",
      2,
    );
    if (!promptContext) throw new Error("expected a prompt context");

    expect(formatStageReadinessPromptContext(promptContext)).toBe(
      formatAcceptedStageReadinessContextForPrompt(promptContext.context, {
        openResponseCount: promptContext.openResponseCount,
      }),
    );
  });

  it("omits the caveat when the shared renderer is given no open count", async () => {
    const promptContext = await loadStageReadinessPromptContext(
      ctx,
      "move-1",
      2,
    );
    if (!promptContext) throw new Error("expected a prompt context");

    const withoutOptions = formatAcceptedStageReadinessContextForPrompt(
      promptContext.context,
    );
    expect(withoutOptions).not.toContain("still open");
    expect(withoutOptions).toContain(
      "## Accepted Stage Readiness Workbook Responses (P1 to P2)",
    );
  });
});
