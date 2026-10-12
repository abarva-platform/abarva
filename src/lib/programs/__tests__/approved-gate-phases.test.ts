import {
  gatesPassedContainsPhase,
  snapshotsApprovePhase,
  isGateApprovedForPhase,
  findGatesPassedEntryForPhase,
  originationApprovalReadback,
} from "@/lib/programs/approved-gate-phases";
import type { PhaseSnapshot } from "@/lib/programs/types.db";

describe("stored origination approval readback", () => {
  const snapshot = {
    id: "snapshot-a",
    engagementId: "move-a",
    phaseNumber: 0,
    approvalStatus: "approved",
    phaseName: "Originate",
    lockedByUserId: "user-a",
    createdAt: "2026-10-12T12:00:00Z",
    lockedAt: "2026-10-12T12:00:00Z",
    snapshot: {
      humanRationale: "Approved after reviewing the captured source.",
    },
  } as PhaseSnapshot;
  it("retains the exact stored rationale and timestamp without phase progression as an input", () => {
    expect(originationApprovalReadback("move-a", [snapshot])).toEqual({
      state: "recorded",
      moveId: "move-a",
      snapshotId: "snapshot-a",
      approvedAt: snapshot.lockedAt,
      rationale: snapshot.snapshot.humanRationale,
    });
  });
  it("does not substitute an older approval for the latest pending P0 snapshot", () => {
    expect(
      originationApprovalReadback("move-a", [
        { ...snapshot, id: "newer", approvalStatus: "pending" },
        snapshot,
      ]).state,
    ).toBe("not_recorded");
  });
  it("keeps unavailable and absent distinct and rejects another Move's row", () => {
    expect(originationApprovalReadback("move-a", null).state).toBe(
      "unavailable",
    );
    expect(originationApprovalReadback("move-a", []).state).toBe(
      "not_recorded",
    );
    expect(originationApprovalReadback("move-b", [snapshot]).state).toBe(
      "unavailable",
    );
  });
  it("keeps missing details unknown while retaining the explicit approval fact", () => {
    expect(
      originationApprovalReadback("move-a", [
        { ...snapshot, lockedAt: null, snapshot: {} },
      ]),
    ).toEqual({
      state: "recorded",
      moveId: "move-a",
      snapshotId: "snapshot-a",
      approvedAt: null,
      rationale: null,
    });
  });
});

// The shape the demo tenant's engagement is seeded with: full gate records for
// the phases it was seeded past, and nothing for the phases walked in product.
const SEEDED_GATES = [
  { phase: 0, status: "approved", signed_at: "2026-09-26T00:00:00.000Z" },
  { phase: 1, status: "approved", signed_at: "2026-09-30T00:00:00.000Z" },
];

describe("gatesPassedContainsPhase — the denormalized array arm", () => {
  it("accepts the bare phase, its string form, and its P-prefixed form", () => {
    expect(gatesPassedContainsPhase([5], 5)).toBe(true);
    expect(gatesPassedContainsPhase(["5"], 5)).toBe(true);
    expect(gatesPassedContainsPhase(["P5"], 5)).toBe(true);
  });

  it("accepts every recorded phase-key spelling", () => {
    for (const key of [
      "phase",
      "phase_number",
      "phaseNumber",
      "fromPhase",
      "from_phase",
      "completedPhase",
      "completed_phase",
    ]) {
      expect(
        gatesPassedContainsPhase([{ [key]: 2, status: "approved" }], 2),
      ).toBe(true);
    }
  });

  it("treats a record with no status as approved, as it always has", () => {
    expect(gatesPassedContainsPhase([{ phase: 3 }], 3)).toBe(true);
  });

  it("rejects a record whose status is not an approving one", () => {
    expect(gatesPassedContainsPhase([{ phase: 3, status: "pending" }], 3)).toBe(
      false,
    );
    expect(
      gatesPassedContainsPhase([{ phase: 3, status: "rejected" }], 3),
    ).toBe(false);
  });

  it("accepts the other approving statuses", () => {
    for (const status of ["approved", "passed", "complete", "completed"]) {
      expect(gatesPassedContainsPhase([{ phase: 4, status }], 4)).toBe(true);
    }
  });

  it("does not match a different phase, and tolerates non-arrays", () => {
    expect(gatesPassedContainsPhase(SEEDED_GATES, 2)).toBe(false);
    expect(gatesPassedContainsPhase(null, 2)).toBe(false);
    expect(gatesPassedContainsPhase(undefined, 2)).toBe(false);
  });
});

describe("snapshotsApprovePhase — the authoritative arm", () => {
  it("reads either column spelling", () => {
    expect(
      snapshotsApprovePhase(
        [{ phaseNumber: 2, approvalStatus: "approved" }],
        2,
      ),
    ).toBe(true);
    expect(
      snapshotsApprovePhase(
        [{ phase_number: 2, approval_status: "approved" }],
        2,
      ),
    ).toBe(true);
  });

  it("requires approved exactly, as the reader it came from required", () => {
    for (const status of ["pending", "draft", "rejected", "complete"]) {
      expect(
        snapshotsApprovePhase([{ phaseNumber: 2, approvalStatus: status }], 2),
      ).toBe(false);
    }
  });

  it("does not match a different phase, and tolerates non-arrays", () => {
    expect(
      snapshotsApprovePhase(
        [{ phaseNumber: 3, approvalStatus: "approved" }],
        2,
      ),
    ).toBe(false);
    expect(snapshotsApprovePhase(null, 2)).toBe(false);
  });
});

describe("isGateApprovedForPhase — the union both readers must ask", () => {
  // The defect this module exists for. A Move walked through the product has
  // its P2 gate approval in `phase_snapshots` and nothing new in
  // `gates_passed`, because no reachable control appends P1-P4 to the array.
  it("reports a product-approved gate the array does not record", () => {
    const sources = {
      gatesPassed: SEEDED_GATES,
      snapshots: [{ phaseNumber: 2, approvalStatus: "approved" as const }],
    };
    expect(isGateApprovedForPhase(sources, 2)).toBe(true);
    // ...and the array arm alone is exactly what missed it.
    expect(gatesPassedContainsPhase(SEEDED_GATES, 2)).toBe(false);
  });

  it("still reports a seeded gate that has no snapshot", () => {
    expect(
      isGateApprovedForPhase({ gatesPassed: SEEDED_GATES, snapshots: [] }, 1),
    ).toBe(true);
  });

  it("reports nothing for a phase neither record approves", () => {
    expect(
      isGateApprovedForPhase(
        {
          gatesPassed: SEEDED_GATES,
          snapshots: [{ phaseNumber: 2, approvalStatus: "pending" }],
        },
        2,
      ),
    ).toBe(false);
  });

  it("works with either source absent", () => {
    expect(isGateApprovedForPhase({ gatesPassed: SEEDED_GATES }, 0)).toBe(true);
    expect(
      isGateApprovedForPhase(
        { snapshots: [{ phaseNumber: 4, approvalStatus: "approved" }] },
        4,
      ),
    ).toBe(true);
    expect(isGateApprovedForPhase({}, 1)).toBe(false);
  });
});

describe("findGatesPassedEntryForPhase", () => {
  it("is the predicate's own rule, so the two cannot disagree", () => {
    const arrays: Array<readonly unknown[] | null> = [
      null,
      [],
      [2],
      ["2"],
      ["P2"],
      [{ phase: 2, status: "approved" }],
      [{ phase_number: 2, status: "passed" }],
      [{ phase: 2, status: "rejected" }],
      [{}],
      ["nonsense"],
    ];
    for (const gatesPassed of arrays) {
      for (const phase of [0, 1, 2, 3, 4, 5]) {
        expect(findGatesPassedEntryForPhase(gatesPassed, phase) !== null).toBe(
          gatesPassedContainsPhase(gatesPassed, phase),
        );
      }
    }
  });

  it("returns a dateless match for the bare phase number", () => {
    expect(findGatesPassedEntryForPhase([5], 5)).toEqual({
      signedAt: null,
      summary: null,
    });
  });

  it("carries the recorded date and summary when the record has them", () => {
    expect(
      findGatesPassedEntryForPhase(
        [
          {
            phase: 3,
            status: "approved",
            signed_at: "2026-05-06T00:00:00.000Z",
            summary: "Design agreed",
          },
        ],
        3,
      ),
    ).toEqual({
      signedAt: "2026-05-06T00:00:00.000Z",
      summary: "Design agreed",
    });
  });

  it("reports a blank date as absent rather than as an empty string", () => {
    expect(
      findGatesPassedEntryForPhase(
        [{ phase: 1, status: "approved", signed_at: "  " }],
        1,
      ),
    ).toEqual({ signedAt: null, summary: null });
  });

  it("returns null for a phase the array does not name", () => {
    expect(
      findGatesPassedEntryForPhase([{ phase: 1, status: "approved" }], 2),
    ).toBeNull();
  });
});

describe("phase approval and origination request remain distinct", () => {
  const approved = {
    id: "phase-a",
    engagementId: "move-a",
    phaseNumber: 0,
    approvalStatus: "approved",
    snapshot: { humanRationale: "Stored rationale" },
    lockedAt: null,
    phaseName: null,
    lockedByUserId: null,
    createdAt: "2026-10-12T11:00:00Z",
  } as PhaseSnapshot;
  it("retains the exact pending request and submitted Move lifecycle beside the stored phase approval", () => {
    expect(
      originationApprovalReadback(
        "move-a",
        [approved],
        [
          {
            id: "request-a",
            programId: "move-a",
            requestStatus: "pending",
            briefSnapshot: {},
          },
        ],
        "submitted_for_approval",
      ),
    ).toEqual({
      state: "recorded",
      moveId: "move-a",
      snapshotId: "phase-a",
      approvedAt: null,
      rationale: "Stored rationale",
      requestLifecycle: { readable: true, status: "pending" },
      moveLifecycle: "submitted_for_approval",
    });
  });
  it.each([
    null,
    [
      {
        id: "request-b",
        programId: "move-b",
        requestStatus: "approved",
        briefSnapshot: {},
      },
    ],
  ])(
    "does not clear an unavailable or foreign request lifecycle",
    (requests) => {
      const readback = originationApprovalReadback(
        "move-a",
        [approved],
        requests,
      );
      expect(readback.state).toBe("recorded");
      if (readback.state === "recorded")
        expect(readback.requestLifecycle).toEqual({
          readable: false,
          status: null,
        });
    },
  );
});
