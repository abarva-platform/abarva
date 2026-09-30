import {
  effectivePhaseAfterEvidenceChange,
  phaseApprovalMatchesEvidence,
} from "../phase-gate-evidence-binding";
import type { PhaseSnapshot } from "../types.db";

const currentEvidence = {
  revision: "evidence-revision-2",
  latestReviewUpdatedAt: "2026-09-29T18:00:00.000Z",
};

function approvedSnapshot(
  phaseNumber: number,
  at: string,
  evidenceRevision?: string,
): PhaseSnapshot {
  return {
    id: `phase-${phaseNumber}-${at}`,
    engagementId: "move-a",
    phaseNumber,
    phaseName: null,
    snapshot: evidenceRevision
      ? { evidenceSnapshotHash: evidenceRevision }
      : {},
    lockedByUserId: null,
    lockedAt: at,
    approvalStatus: "approved",
    createdAt: at,
  };
}

describe("phase-gate evidence binding", () => {
  it("keeps an approval current only for the evidence revision it reviewed", () => {
    const snapshot = approvedSnapshot(
      1,
      "2026-09-29T17:00:00.000Z",
      "evidence-revision-2",
    );

    expect(phaseApprovalMatchesEvidence(1, [snapshot], currentEvidence)).toBe(
      true,
    );
    expect(
      phaseApprovalMatchesEvidence(1, [snapshot], {
        ...currentEvidence,
        revision: "evidence-revision-3",
      }),
    ).toBe(false);
  });

  it("invalidates a legacy approval when approved evidence changed after it", () => {
    const legacyApproval = approvedSnapshot(1, "2026-09-29T17:00:00.000Z");

    expect(
      phaseApprovalMatchesEvidence(1, [legacyApproval], currentEvidence),
    ).toBe(false);
  });

  it("preserves legacy approvals when no later evidence review is recorded", () => {
    const legacyApproval = approvedSnapshot(1, "2026-09-29T17:00:00.000Z");

    expect(
      phaseApprovalMatchesEvidence(1, [legacyApproval], {
        revision: "evidence-revision-2",
        latestReviewUpdatedAt: "2026-09-29T16:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      phaseApprovalMatchesEvidence(1, [legacyApproval], {
        revision: "evidence-revision-2",
        latestReviewUpdatedAt: null,
      }),
    ).toBe(true);
  });

  it("reopens the earliest stale phase without changing the stored phase", () => {
    const snapshots = [
      approvedSnapshot(1, "2026-09-29T17:00:00.000Z", "evidence-revision-1"),
      approvedSnapshot(2, "2026-09-29T17:30:00.000Z", "evidence-revision-1"),
    ];

    expect(
      effectivePhaseAfterEvidenceChange(3, snapshots, {
        revision: "evidence-revision-2",
        latestReviewUpdatedAt: "2026-09-29T18:00:00.000Z",
      }),
    ).toBe(1);
  });

  it("skips P0 and reopens the earliest stale evidence-bound phase", () => {
    const snapshots = [
      approvedSnapshot(0, "2026-09-29T16:00:00.000Z"),
      approvedSnapshot(1, "2026-09-29T17:00:00.000Z", "evidence-revision-1"),
    ];

    expect(
      effectivePhaseAfterEvidenceChange(2, snapshots, {
        revision: "evidence-revision-2",
        latestReviewUpdatedAt: "2026-09-29T18:00:00.000Z",
      }),
    ).toBe(1);
  });
});
