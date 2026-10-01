import {
  effectivePhaseAfterEvidenceChange,
  effectivePhaseAfterGateValidation,
  phaseApprovalMatchesEvidence,
} from "../phase-gate-evidence-binding";
import type { PhaseSnapshot } from "../types.db";

const currentEvidence = {
  revision: "evidence-revision-2",
  latestEvidenceActivityAt: "2026-09-29T18:00:00.000Z",
  revisionByPhase: {
    1: "evidence-revision-2",
    2: "p2-evidence-1",
    3: "p3-evidence-1",
  },
  latestEvidenceActivityAtByPhase: {
    1: "2026-09-29T16:00:00.000Z",
    2: "2026-09-29T18:00:00.000Z",
    3: null,
  },
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
      ? {
          evidenceSnapshotHash: evidenceRevision,
          phaseEvidenceSnapshotHash: evidenceRevision,
        }
      : {},
    lockedByUserId: null,
    lockedAt: at,
    approvalStatus: "approved",
    createdAt: at,
  };
}

function legacyApprovedSnapshot(
  phaseNumber: number,
  at: string,
  evidenceRevision: string,
): PhaseSnapshot {
  return {
    ...approvedSnapshot(phaseNumber, at),
    snapshot: { evidenceSnapshotHash: evidenceRevision },
  };
}

describe("phase-gate evidence binding", () => {
  it("keeps an approval current only for the evidence revision it reviewed", () => {
    const snapshot = approvedSnapshot(
      1,
      "2026-09-29T19:00:00.000Z",
      "evidence-revision-2",
    );

    expect(phaseApprovalMatchesEvidence(1, [snapshot], currentEvidence)).toBe(
      true,
    );
    expect(
      phaseApprovalMatchesEvidence(1, [snapshot], {
        ...currentEvidence,
        revision: "evidence-revision-3",
        revisionByPhase: {
          ...currentEvidence.revisionByPhase,
          1: "evidence-revision-3",
        },
      }),
    ).toBe(false);
  });

  it("does not reopen a closed phase for later evidence scoped to another phase", () => {
    const approval = legacyApprovedSnapshot(
      1,
      "2026-09-29T17:00:00.000Z",
      "evidence-revision-1",
    );

    expect(
      phaseApprovalMatchesEvidence(1, [approval], {
        ...currentEvidence,
        revision: "whole-move-revision-changed",
        latestEvidenceActivityAt: "2026-09-30T12:00:00.000Z",
        latestEvidenceActivityAtByPhase: {
          ...currentEvidence.latestEvidenceActivityAtByPhase,
          1: "2026-09-29T16:00:00.000Z",
          2: "2026-09-30T12:00:00.000Z",
        },
      }),
    ).toBe(true);
  });

  it("still reopens a closed phase when its own evidence changes", () => {
    const approval = legacyApprovedSnapshot(
      1,
      "2026-09-29T17:00:00.000Z",
      "evidence-revision-1",
    );

    expect(
      phaseApprovalMatchesEvidence(1, [approval], {
        ...currentEvidence,
        revision: "whole-move-revision-changed",
        latestEvidenceActivityAt: "2026-09-30T12:00:00.000Z",
        latestEvidenceActivityAtByPhase: {
          ...currentEvidence.latestEvidenceActivityAtByPhase,
          1: "2026-09-30T12:00:00.000Z",
        },
      }),
    ).toBe(false);
  });

  it("reopens a hash-bound approval when approved evidence activity is later", () => {
    const approval = approvedSnapshot(
      1,
      "2026-09-29T17:00:00.000Z",
      "evidence-revision-2",
    );

    expect(
      phaseApprovalMatchesEvidence(1, [approval], {
        revision: "evidence-revision-2",
        latestEvidenceActivityAt: "2026-09-30T02:56:00.000Z",
      }),
    ).toBe(false);
    expect(
      effectivePhaseAfterEvidenceChange(2, [approval], {
        revision: "evidence-revision-2",
        latestEvidenceActivityAt: "2026-09-30T02:56:00.000Z",
      }),
    ).toBe(1);
  });

  it("invalidates a legacy approval when approved evidence changed after it", () => {
    const legacyApproval = legacyApprovedSnapshot(
      1,
      "2026-09-29T17:00:00.000Z",
      "evidence-revision-1",
    );

    expect(
      phaseApprovalMatchesEvidence(1, [legacyApproval], {
        ...currentEvidence,
        latestEvidenceActivityAtByPhase: {
          ...currentEvidence.latestEvidenceActivityAtByPhase,
          1: "2026-09-30T02:56:00.000Z",
        },
      }),
    ).toBe(false);
  });

  it("preserves legacy approvals when no later evidence review is recorded", () => {
    const legacyApproval = legacyApprovedSnapshot(
      1,
      "2026-09-29T17:00:00.000Z",
      "evidence-revision-2",
    );

    expect(
      phaseApprovalMatchesEvidence(1, [legacyApproval], {
        revision: "evidence-revision-2",
        latestEvidenceActivityAt: "2026-09-29T16:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      phaseApprovalMatchesEvidence(1, [legacyApproval], {
        revision: "evidence-revision-2",
        latestEvidenceActivityAt: null,
      }),
    ).toBe(true);
  });

  it("fails closed when a legacy hash differs but history cannot prove an unrelated change", () => {
    const legacyApproval = legacyApprovedSnapshot(
      1,
      "2026-09-29T17:00:00.000Z",
      "evidence-revision-1",
    );

    expect(
      phaseApprovalMatchesEvidence(1, [legacyApproval], {
        revision: "evidence-revision-2",
        latestEvidenceActivityAt: null,
        latestEvidenceActivityAtByPhase: { 1: null },
      }),
    ).toBe(false);
  });

  it("reopens the earliest stale phase without changing the stored phase", () => {
    const snapshots = [
      approvedSnapshot(1, "2026-09-29T17:00:00.000Z", "evidence-revision-1"),
      approvedSnapshot(2, "2026-09-29T17:30:00.000Z", "evidence-revision-1"),
    ];

    expect(
      effectivePhaseAfterEvidenceChange(3, snapshots, {
        revision: "evidence-revision-2",
        latestEvidenceActivityAt: "2026-09-29T18:00:00.000Z",
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
        latestEvidenceActivityAt: "2026-09-29T18:00:00.000Z",
      }),
    ).toBe(1);
  });

  it("reopens a historical phase when its current hard gate no longer passes even if its evidence approval hash matches", () => {
    const currentApproval = approvedSnapshot(
      1,
      "2026-09-29T19:00:00.000Z",
      "evidence-revision-2",
    );
    const evidenceCurrentPhase = effectivePhaseAfterEvidenceChange(
      2,
      [currentApproval],
      currentEvidence,
    );

    expect(evidenceCurrentPhase).toBe(2);
    expect(
      effectivePhaseAfterGateValidation(
        evidenceCurrentPhase,
        new Map([[1, false]]),
      ),
    ).toBe(1);
  });

  it("keeps the current phase only when every prior hard gate is verified ready", () => {
    expect(
      effectivePhaseAfterGateValidation(
        4,
        new Map([
          [1, true],
          [2, true],
          [3, true],
        ]),
      ),
    ).toBe(4);
    expect(
      effectivePhaseAfterGateValidation(
        4,
        new Map([
          [1, true],
          [2, false],
          [3, true],
        ]),
      ),
    ).toBe(2);
    expect(effectivePhaseAfterGateValidation(3, new Map([[1, true]]))).toBe(2);
  });
});
