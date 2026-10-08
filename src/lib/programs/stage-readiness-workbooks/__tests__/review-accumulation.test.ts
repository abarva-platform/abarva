const listMoveArtifacts = jest.fn();
const downloadArtifactBytes = jest.fn();

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  listMoveArtifacts: (...args: unknown[]) => listMoveArtifacts(...args),
  downloadArtifactBytes: (...args: unknown[]) => downloadArtifactBytes(...args),
}));

import {
  loadPriorStageReadinessReviewProposals,
  loadStageReadinessStoredReview,
  mergeStageReadinessReviewDecisions,
} from "../review-accumulation";

const ctx = {
  clientId: "tenant-1",
  clientKey: "tenant-key",
  userId: "user-1",
} as const;

function proposal(
  proposalId: string,
  overrides: { answerState?: string; response?: string } = {},
) {
  return {
    proposalId,
    answerState: overrides.answerState ?? "answered",
    response: overrides.response ?? "A real written answer.",
  } as Parameters<
    typeof mergeStageReadinessReviewDecisions
  >[0]["proposals"][number];
}

describe("mergeStageReadinessReviewDecisions", () => {
  it("carries an earlier batch's acceptances forward so a mixed review can clear the transition", () => {
    const proposals = [
      proposal("p1"),
      proposal("p2"),
      proposal("p3"),
      proposal("p4"),
    ];
    const merged = mergeStageReadinessReviewDecisions({
      proposals,
      priorReviewProposals: [
        { proposalId: "p1", disposition: "accepted" },
        { proposalId: "p2", disposition: "accepted" },
        { proposalId: "p3", disposition: "pending" },
        { proposalId: "p4", disposition: "pending" },
      ],
      decisions: [
        { proposalId: "p3", disposition: "rejected" },
        { proposalId: "p4", disposition: "rejected" },
      ],
    });

    expect(
      merged.map((decision) => [decision.proposalId, decision.disposition]),
    ).toEqual([
      ["p3", "rejected"],
      ["p4", "rejected"],
      ["p1", "accepted"],
      ["p2", "accepted"],
    ]);
    // Every proposal now holds a disposition, which is what clears
    // `pendingCount === 0` while `acceptedCount` stays above zero.
    expect(new Set(merged.map((decision) => decision.proposalId))).toEqual(
      new Set(["p1", "p2", "p3", "p4"]),
    );
    expect(
      merged.filter((decision) => decision.disposition === "accepted"),
    ).toHaveLength(2);
  });

  it("lets this batch overrule the disposition the previous one recorded", () => {
    const merged = mergeStageReadinessReviewDecisions({
      proposals: [proposal("p1")],
      priorReviewProposals: [{ proposalId: "p1", disposition: "accepted" }],
      decisions: [{ proposalId: "p1", disposition: "rejected" }],
    });

    expect(merged).toEqual([{ proposalId: "p1", disposition: "rejected" }]);
  });

  it("carries a needs_validation disposition forward rather than silently clearing it", () => {
    const merged = mergeStageReadinessReviewDecisions({
      proposals: [proposal("p1"), proposal("p2")],
      priorReviewProposals: [
        { proposalId: "p1", disposition: "needs_validation" },
      ],
      decisions: [{ proposalId: "p2", disposition: "accepted" }],
    });

    expect(merged).toEqual([
      { proposalId: "p2", disposition: "accepted" },
      {
        proposalId: "p1",
        disposition: "needs_validation",
        note: "Carried forward from the previous review batch.",
      },
    ]);
  });

  it("leaves a proposal with no prior decision pending", () => {
    const merged = mergeStageReadinessReviewDecisions({
      proposals: [proposal("p1"), proposal("p2")],
      priorReviewProposals: [{ proposalId: "p1", disposition: "pending" }],
      decisions: [{ proposalId: "p2", disposition: "accepted" }],
    });

    expect(merged).toEqual([{ proposalId: "p2", disposition: "accepted" }]);
  });

  it("drops a carried-forward acceptance of a blank response instead of throwing the review away", () => {
    const merged = mergeStageReadinessReviewDecisions({
      proposals: [
        proposal("p1", { answerState: "blank", response: "   " }),
        proposal("p2"),
      ],
      priorReviewProposals: [{ proposalId: "p1", disposition: "accepted" }],
      decisions: [{ proposalId: "p2", disposition: "accepted" }],
    });

    expect(merged).toEqual([{ proposalId: "p2", disposition: "accepted" }]);
  });

  it("carries a rejection of a blank response forward, which is the only way a blank row stops holding the phase", () => {
    const merged = mergeStageReadinessReviewDecisions({
      proposals: [
        proposal("p1", { answerState: "blank", response: "" }),
        proposal("p2"),
      ],
      priorReviewProposals: [{ proposalId: "p1", disposition: "rejected" }],
      decisions: [{ proposalId: "p2", disposition: "accepted" }],
    });

    expect(merged.map((decision) => decision.disposition)).toEqual([
      "accepted",
      "rejected",
    ]);
  });

  it("passes an unknown proposal id through so the review builder still refuses it", () => {
    const merged = mergeStageReadinessReviewDecisions({
      proposals: [proposal("p1")],
      priorReviewProposals: null,
      decisions: [{ proposalId: "not-in-this-set", disposition: "accepted" }],
    });

    expect(merged).toEqual([
      { proposalId: "not-in-this-set", disposition: "accepted" },
    ]);
  });

  it("returns this batch unchanged when no review has been recorded yet", () => {
    const decisions = [{ proposalId: "p1", disposition: "accepted" as const }];
    expect(
      mergeStageReadinessReviewDecisions({
        proposals: [proposal("p1")],
        priorReviewProposals: undefined,
        decisions,
      }),
    ).toEqual(decisions);
  });
});

const proposalSetRef = {
  proposalSetId: "proposal-set-1",
  artifactId: "proposal-artifact-1",
  artifactVersion: 1,
} as const;

function reviewArtifactRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    artifact_id: "review-artifact-1",
    move_id: "move-1",
    phase: 1,
    version: 2,
    // Spelled out rather than imported: a rename must fail this suite loudly
    // instead of quietly stopping it from exercising the match.
    artifact_type: "stage_readiness_workbook_proposal_review",
    metadata: {
      proposalSetId: proposalSetRef.proposalSetId,
      sourceProposalSetArtifact: {
        artifactId: proposalSetRef.artifactId,
        artifactVersion: proposalSetRef.artifactVersion,
      },
    },
    ...overrides,
  };
}

function reviewBody(overrides: Record<string, unknown> = {}): Buffer {
  return Buffer.from(
    JSON.stringify({
      proposalSetId: proposalSetRef.proposalSetId,
      sourceProposalSetArtifact: {
        artifactId: proposalSetRef.artifactId,
        artifactVersion: proposalSetRef.artifactVersion,
      },
      proposals: [
        { proposalId: "p1", disposition: "accepted" },
        { proposalId: "p2", disposition: "pending" },
      ],
      ...overrides,
    }),
    "utf-8",
  );
}

describe("loadPriorStageReadinessReviewProposals", () => {
  beforeEach(() => {
    listMoveArtifacts.mockReset();
    downloadArtifactBytes.mockReset();
  });

  it("returns the dispositions recorded for this proposal set", async () => {
    listMoveArtifacts.mockResolvedValue([reviewArtifactRow()]);
    downloadArtifactBytes.mockResolvedValue({ bytes: reviewBody() });

    await expect(
      loadPriorStageReadinessReviewProposals(ctx, "move-1", 1, proposalSetRef),
    ).resolves.toEqual([
      { proposalId: "p1", disposition: "accepted" },
      { proposalId: "p2", disposition: "pending" },
    ]);
    expect(listMoveArtifacts).toHaveBeenCalledWith(ctx, "move-1", {
      family: "approval_artifact",
      currentOnly: true,
    });
  });

  it("returns null when the current review belongs to a different proposal set", async () => {
    listMoveArtifacts.mockResolvedValue([
      reviewArtifactRow({
        metadata: {
          proposalSetId: "a-re-uploaded-set",
          sourceProposalSetArtifact: {
            artifactId: proposalSetRef.artifactId,
            artifactVersion: proposalSetRef.artifactVersion,
          },
        },
      }),
    ]);
    downloadArtifactBytes.mockResolvedValue({ bytes: reviewBody() });

    // The body IS read now, and deliberately: the same stored review is what
    // `loadStageReadinessStoredReview` hands the superseded reading, which
    // matches its decisions on answer text. This reading still answers null,
    // which is the contract its callers depend on.
    await expect(
      loadPriorStageReadinessReviewProposals(ctx, "move-1", 1, proposalSetRef),
    ).resolves.toBeNull();
  });

  it("returns null when the stored body disagrees with the artifact metadata", async () => {
    listMoveArtifacts.mockResolvedValue([reviewArtifactRow()]);
    downloadArtifactBytes.mockResolvedValue({
      bytes: reviewBody({ proposalSetId: "a-different-set" }),
    });

    await expect(
      loadPriorStageReadinessReviewProposals(ctx, "move-1", 1, proposalSetRef),
    ).resolves.toBeNull();
  });

  it("returns null when the only review sits at another phase", async () => {
    // Everything else about this review matches, including its stored body, so
    // the phase is the only thing that can rule it out.
    listMoveArtifacts.mockResolvedValue([reviewArtifactRow({ phase: 2 })]);
    downloadArtifactBytes.mockResolvedValue({ bytes: reviewBody() });

    await expect(
      loadPriorStageReadinessReviewProposals(ctx, "move-1", 1, proposalSetRef),
    ).resolves.toBeNull();
    expect(downloadArtifactBytes).not.toHaveBeenCalled();
  });

  it("returns null when the stored review is not valid JSON", async () => {
    listMoveArtifacts.mockResolvedValue([reviewArtifactRow()]);
    downloadArtifactBytes.mockResolvedValue({
      bytes: Buffer.from("not json", "utf-8"),
    });

    await expect(
      loadPriorStageReadinessReviewProposals(ctx, "move-1", 1, proposalSetRef),
    ).resolves.toBeNull();
  });

  it("returns null without listing artifacts when the proposal set has no id", async () => {
    await expect(
      loadPriorStageReadinessReviewProposals(ctx, "move-1", 1, {
        ...proposalSetRef,
        proposalSetId: "",
      }),
    ).resolves.toBeNull();
    expect(listMoveArtifacts).not.toHaveBeenCalled();
  });
});

describe("loadStageReadinessStoredReview", () => {
  beforeEach(() => {
    listMoveArtifacts.mockReset();
    downloadArtifactBytes.mockReset();
  });

  it("reports a review of this proposal set as the current one", async () => {
    listMoveArtifacts.mockResolvedValue([reviewArtifactRow()]);
    downloadArtifactBytes.mockResolvedValue({ bytes: reviewBody() });

    await expect(
      loadStageReadinessStoredReview(ctx, "move-1", 1, proposalSetRef),
    ).resolves.toEqual({
      kind: "current_set",
      proposals: [
        { proposalId: "p1", disposition: "accepted" },
        { proposalId: "p2", disposition: "pending" },
      ],
      artifactStatus: null,
      artifactMetadata: reviewArtifactRow().metadata,
      summary: undefined,
    });
  });

  it("returns the artifact status and the stored summary alongside the decisions", async () => {
    // The phase workspace needs the review's status, its metadata and the
    // server-measured readiness split in its `summary`, and it reads all of
    // them off this one artifact. Returning them here is what keeps that
    // surface on a single read instead of repeating the lookup.
    listMoveArtifacts.mockResolvedValue([
      reviewArtifactRow({ status: "approved" }),
    ]);
    downloadArtifactBytes.mockResolvedValue({
      bytes: reviewBody({
        summary: { readiness: { ready: 4, insufficientEvidence: 1 } },
      }),
    });

    const stored = await loadStageReadinessStoredReview(
      ctx,
      "move-1",
      1,
      proposalSetRef,
    );
    expect(stored?.artifactStatus).toBe("approved");
    expect(stored?.summary).toEqual({
      readiness: { ready: 4, insufficientEvidence: 1 },
    });
    expect(stored?.artifactMetadata).toEqual(reviewArtifactRow().metadata);
  });

  it("reports a review of an earlier proposal set as superseded, with its decisions", async () => {
    // A re-upload: same transition, different set. Returning the decisions
    // rather than null is what lets the carry-forward restore the rows whose
    // answers did not change. Reading them off `null` was the whole cost.
    listMoveArtifacts.mockResolvedValue([
      reviewArtifactRow({
        metadata: {
          proposalSetId: "a-re-uploaded-set",
          sourceProposalSetArtifact: {
            artifactId: proposalSetRef.artifactId,
            artifactVersion: proposalSetRef.artifactVersion,
          },
        },
      }),
    ]);
    downloadArtifactBytes.mockResolvedValue({
      bytes: reviewBody({ proposalSetId: "a-re-uploaded-set" }),
    });

    const stored = await loadStageReadinessStoredReview(
      ctx,
      "move-1",
      1,
      proposalSetRef,
    );
    expect(stored?.kind).toBe("superseded_set");
    expect(stored?.proposals).toEqual([
      { proposalId: "p1", disposition: "accepted" },
      { proposalId: "p2", disposition: "pending" },
    ]);
  });

  it("reads the stored review once", async () => {
    listMoveArtifacts.mockResolvedValue([reviewArtifactRow()]);
    downloadArtifactBytes.mockResolvedValue({ bytes: reviewBody() });

    await loadStageReadinessStoredReview(ctx, "move-1", 1, proposalSetRef);
    expect(downloadArtifactBytes).toHaveBeenCalledTimes(1);
  });

  it("returns null when no review sits at this phase", async () => {
    listMoveArtifacts.mockResolvedValue([reviewArtifactRow({ phase: 2 })]);

    await expect(
      loadStageReadinessStoredReview(ctx, "move-1", 1, proposalSetRef),
    ).resolves.toBeNull();
    expect(downloadArtifactBytes).not.toHaveBeenCalled();
  });
});
