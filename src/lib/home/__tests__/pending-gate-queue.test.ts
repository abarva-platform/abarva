import {
  pendingGatePhase,
  recordsGateApproval,
} from "@/lib/home/pending-gate-queue";

describe("recordsGateApproval", () => {
  it("counts a bare number, the form the terminal P5 write appends", () => {
    expect(recordsGateApproval(5, 5)).toBe(true);
    expect(recordsGateApproval(5, 4)).toBe(false);
  });

  it("counts an approving status on a record naming the phase", () => {
    for (const status of ["approved", "signed_off", "complete", "completed"]) {
      expect(recordsGateApproval({ phase: 2, status }, 2)).toBe(true);
    }
    expect(recordsGateApproval({ phase: 2, status: "APPROVED" }, 2)).toBe(true);
  });

  it("counts a timestamp or actor field as the approval signal", () => {
    expect(recordsGateApproval({ phase: 1, signed_at: "2026-10-01" }, 1)).toBe(
      true,
    );
    expect(recordsGateApproval({ phase: 1, approved_by: "u1" }, 1)).toBe(true);
  });

  it("reads phase_number and phaseNumber as the phase", () => {
    expect(
      recordsGateApproval({ phase_number: 3, status: "approved" }, 3),
    ).toBe(true);
    expect(recordsGateApproval({ phaseNumber: 3, status: "approved" }, 3)).toBe(
      true,
    );
  });

  it("is not an approval when the record names the phase and nothing else", () => {
    expect(recordsGateApproval({ phase: 2 }, 2)).toBe(false);
    expect(recordsGateApproval({ phase: 2, status: "pending" }, 2)).toBe(false);
  });

  it("does not credit an approval of a different phase", () => {
    expect(recordsGateApproval({ phase: 1, status: "approved" }, 2)).toBe(
      false,
    );
  });

  it("ignores entries that are neither numbers nor objects", () => {
    for (const entry of [null, undefined, "2", true]) {
      expect(recordsGateApproval(entry, 2)).toBe(false);
    }
  });
});

describe("pendingGatePhase", () => {
  // The demo Move's shipped seed: P0 and P1 approved, sitting at P2. This is
  // the case the previous reader could not report, because every entry in the
  // array was approved and it only emitted an item for an UNAPPROVED entry.
  const seededGates = [
    { phase: 0, status: "approved", signed_at: "2026-09-27" },
    { phase: 1, status: "approved", signed_at: "2026-10-01" },
  ];

  it("reports the current phase when no entry approves it", () => {
    expect(
      pendingGatePhase({ currentPhase: 2, gatesPassed: seededGates }),
    ).toBe(2);
  });

  it("reports nothing once the current phase is approved", () => {
    expect(
      pendingGatePhase({
        currentPhase: 2,
        gatesPassed: [...seededGates, { phase: 2, status: "approved" }],
      }),
    ).toBe(null);
  });

  it("moves forward with the Move as gates are approved and the phase advances", () => {
    // An approval advances current_phase without appending to gates_passed, so
    // the pending phase must track current_phase rather than the array.
    expect(
      pendingGatePhase({ currentPhase: 3, gatesPassed: seededGates }),
    ).toBe(3);
    expect(
      pendingGatePhase({ currentPhase: 4, gatesPassed: seededGates }),
    ).toBe(4);
  });

  it("reports nothing past the last gate, where a terminal handoff lands", () => {
    expect(pendingGatePhase({ currentPhase: 6, gatesPassed: [] })).toBe(null);
    expect(pendingGatePhase({ currentPhase: -1, gatesPassed: [] })).toBe(null);
  });

  it("reports P0 for a Move with no recorded gates at all", () => {
    expect(pendingGatePhase({ currentPhase: 0, gatesPassed: null })).toBe(0);
    expect(pendingGatePhase({ currentPhase: 0, gatesPassed: [] })).toBe(0);
  });

  it("reports P5 until the terminal bare-number write lands", () => {
    expect(pendingGatePhase({ currentPhase: 5, gatesPassed: [] })).toBe(5);
    expect(pendingGatePhase({ currentPhase: 5, gatesPassed: [5] })).toBe(null);
  });

  it("reports nothing when the phase is not an integer", () => {
    for (const currentPhase of [null, undefined, "2", 2.5, NaN]) {
      expect(pendingGatePhase({ currentPhase, gatesPassed: [] })).toBe(null);
    }
  });

  it("tolerates a non-array gates_passed", () => {
    expect(pendingGatePhase({ currentPhase: 1, gatesPassed: "nope" })).toBe(1);
  });
});
