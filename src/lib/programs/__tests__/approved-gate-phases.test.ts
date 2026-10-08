import {
  gatesPassedContainsPhase,
  snapshotsApprovePhase,
  isGateApprovedForPhase,
} from "@/lib/programs/approved-gate-phases";

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
    expect(
      gatesPassedContainsPhase([{ phase: 3, status: "pending" }], 3),
    ).toBe(false);
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
      snapshotsApprovePhase([{ phaseNumber: 2, approvalStatus: "approved" }], 2),
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
      snapshotsApprovePhase([{ phaseNumber: 3, approvalStatus: "approved" }], 2),
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
