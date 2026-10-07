/**
 * A restored decision may be shown and may not answer the gate.
 *
 * The composition is the point of this suite: the preview, the seeding and
 * the evidence-packet reading are each correct alone, and the defect lived
 * only in what the page handed from one to the next. So the phase-1
 * assertions run the real chain — `previewStageReadinessStoredReview` into
 * `seedProposalsFromReviewPreview` into `recordedDispositionsOnly` into
 * `applyStageReadinessToEvidencePackets` — rather than asserting on a
 * hand-built disposition list that could not have caught it.
 */

import {
  applyStageReadinessToEvidencePackets,
  type StageReadinessGateProposal,
} from "@/lib/programs/stage-readiness-workbooks/gate-readiness";
import { previewStageReadinessStoredReview } from "@/lib/programs/stage-readiness-workbooks/review-preview";
import {
  isRestoredDisposition,
  keptDecisionsToRecord,
  recordedDispositionsOnly,
  seedProposalsFromReviewPreview,
} from "@/lib/programs/stage-readiness-workbooks/review-provenance";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";

const MOVE_ID = "move-provenance";

/** One answered, sourced row. `proposalId` is the only field a re-upload changes. */
function row(proposalId: string, questionId: string) {
  return {
    proposalId,
    questionId,
    dimensionId: `dim_${questionId}`,
    requirement: "required" as const,
    response: `Answer for ${questionId}`,
    context: `Context for ${questionId}`,
    evidenceOrSource: `Source for ${questionId}`,
    answerState: "answered" as const,
    disposition: "pending",
  };
}

/** The same answers as they were stored against the EARLIER upload. */
function priorReviewed(questionId: string, disposition: string) {
  return {
    proposalId: `old-${questionId}`,
    questionId,
    response: `Answer for ${questionId}`,
    context: `Context for ${questionId}`,
    evidenceOrSource: `Source for ${questionId}`,
    disposition,
  };
}

const CURRENT_SET = [row("new-a", "q_a"), row("new-b", "q_b")];

function evidencePacket(familyId: string): MoveEvidenceNeedPacket {
  return {
    moveId: MOVE_ID,
    phase: 1,
    artifactType: null,
    evidenceSlot: `${familyId} evidence`,
    familyId,
    priority: "required",
    ownerSource: "Move team",
    acceptedFormats: ["PDF"],
    exampleTemplate: "Example",
    exampleContent: ["Example content"],
    whyItMatters: "Required for the Charter phase.",
    guidanceBasis: "packet_specific",
    blockedArtifacts: [],
    nextAction: "Provide the evidence.",
  } as unknown as MoveEvidenceNeedPacket;
}

/** The page's own projection, minus the provenance step under test. */
function gateProposals(
  proposals: readonly {
    questionId?: string;
    dimensionId?: string;
    requirement?: "required" | "recommended";
    answerState?: string;
    disposition?: string | null;
    evidenceOrSource?: string;
  }[],
): StageReadinessGateProposal[] {
  return proposals.map((proposal): StageReadinessGateProposal => ({
    questionId: proposal.questionId ?? "",
    dimensionId: proposal.dimensionId ?? "",
    requirement:
      proposal.requirement === "recommended"
        ? ("recommended" as const)
        : ("required" as const),
    answerState:
      proposal.answerState === "answered" ||
      proposal.answerState === "unknown" ||
      proposal.answerState === "insufficient_evidence"
        ? proposal.answerState
        : ("blank" as const),
    disposition:
      proposal.disposition === "accepted" ||
      proposal.disposition === "rejected" ||
      proposal.disposition === "needs_validation"
        ? proposal.disposition
        : ("pending" as const),
    evidenceOrSource: proposal.evidenceOrSource ?? "",
  }));
}

function holdsCharterOnWorkbook(
  proposals: readonly StageReadinessGateProposal[],
): boolean {
  const packets = applyStageReadinessToEvidencePackets(
    [evidencePacket("dim_q_a"), evidencePacket("dim_q_b")],
    1,
    proposals,
    MOVE_ID,
  );
  return packets.some(
    (packet) => packet.familyId === "stage_readiness_p1_p2",
  );
}

describe("restored dispositions and the Charter gate", () => {
  const restoredPreview = previewStageReadinessStoredReview({
    proposals: CURRENT_SET,
    storedReview: {
      kind: "superseded_set",
      proposals: [
        priorReviewed("q_a", "accepted"),
        priorReviewed("q_b", "accepted"),
      ],
    },
  });

  it("restores both decisions onto the re-uploaded set", () => {
    expect(restoredPreview.source).toBe("prior_upload");
    expect(restoredPreview.restoredFromPriorUploadCount).toBe(2);
  });

  it("marks every restored row, and only those rows", () => {
    const seeded = seedProposalsFromReviewPreview({
      proposals: CURRENT_SET,
      preview: restoredPreview,
    });
    expect(seeded.map((proposal) => proposal.disposition)).toEqual([
      "accepted",
      "accepted",
    ]);
    expect(seeded.every(isRestoredDisposition)).toBe(true);
  });

  it("does not mark a review recorded against the set under review", () => {
    const current = previewStageReadinessStoredReview({
      proposals: CURRENT_SET,
      storedReview: {
        kind: "current_set",
        proposals: [
          { ...priorReviewed("q_a", "accepted"), proposalId: "new-a" },
          { ...priorReviewed("q_b", "accepted"), proposalId: "new-b" },
        ],
      },
    });
    const seeded = seedProposalsFromReviewPreview({
      proposals: CURRENT_SET,
      preview: current,
    });
    expect(seeded.map((proposal) => proposal.disposition)).toEqual([
      "accepted",
      "accepted",
    ]);
    expect(seeded.some(isRestoredDisposition)).toBe(false);
  });

  // The defect. Before provenance, the seeded list went straight into the
  // gate projection, so the phase read as reviewed on a preview alone.
  it("holds the Charter phase while the restored review is only previewed", () => {
    const seeded = seedProposalsFromReviewPreview({
      proposals: CURRENT_SET,
      preview: restoredPreview,
    });
    expect(holdsCharterOnWorkbook(gateProposals(seeded))).toBe(false);
    expect(
      holdsCharterOnWorkbook(gateProposals(recordedDispositionsOnly(seeded))),
    ).toBe(true);
  });

  it("releases the Charter phase on a review recorded for this set", () => {
    const recorded = CURRENT_SET.map((proposal) => ({
      ...proposal,
      disposition: "accepted",
    }));
    expect(
      holdsCharterOnWorkbook(gateProposals(recordedDispositionsOnly(recorded))),
    ).toBe(false);
  });

  it("leaves a recorded rejection rejected rather than returning it to pending", () => {
    const recorded = [
      { ...CURRENT_SET[0], disposition: "rejected" },
      { ...CURRENT_SET[1], disposition: "accepted" },
    ];
    expect(
      recordedDispositionsOnly(recorded).map((p) => p.disposition),
    ).toEqual(["rejected", "accepted"]);
  });
});

describe("recording the decisions a re-upload kept", () => {
  it("submits each restored row as the disposition already recorded for it", () => {
    const seeded = seedProposalsFromReviewPreview({
      proposals: CURRENT_SET,
      preview: previewStageReadinessStoredReview({
        proposals: CURRENT_SET,
        storedReview: {
          kind: "superseded_set",
          proposals: [
            priorReviewed("q_a", "accepted"),
            priorReviewed("q_b", "rejected"),
          ],
        },
      }),
    });
    expect(keptDecisionsToRecord(seeded)).toEqual([
      { proposalId: "new-a", disposition: "accepted" },
      { proposalId: "new-b", disposition: "rejected" },
    ]);
  });

  it("offers nothing to record when no decision was restored", () => {
    const recorded = CURRENT_SET.map((proposal) => ({
      ...proposal,
      disposition: "accepted",
    }));
    expect(keptDecisionsToRecord(recorded)).toEqual([]);
  });

  it("skips a restored row that names no proposal", () => {
    expect(
      keptDecisionsToRecord([
        {
          proposalId: "",
          disposition: "accepted",
          dispositionRestoredFromPriorUpload: true,
        },
      ]),
    ).toEqual([]);
  });
});
