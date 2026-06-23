import {
  assertPhaseReadyForGeneration,
  statusForReadiness,
  type GateReadinessSources,
} from "../assert-phase-ready";

const sources = (over: Partial<GateReadinessSources> = {}): GateReadinessSources => ({
  captureComplete: async () => ({ complete: true, missing: [] }),
  gateApproved: async () => true,
  ...over,
});

describe("assertPhaseReadyForGeneration (Slice 6 — no approved gate, no generation)", () => {
  it("ready when capture complete AND gate approved", async () => {
    const r = await assertPhaseReadyForGeneration({ moveId: "m", phase: 3 }, sources());
    expect(r.ready).toBe(true);
    expect(statusForReadiness(r)).toBe(200);
  });

  it("blocks (409) with structured blockers when capture is incomplete", async () => {
    const r = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 3 },
      sources({ captureComplete: async () => ({ complete: false, missing: ["KPI baseline"] }) }),
    );
    expect(r.ready).toBe(false);
    expect(statusForReadiness(r)).toBe(409);
    expect(r.blockers.some((b) => b.code === "capture_incomplete")).toBe(true);
  });

  it("blocks when the gate is not approved", async () => {
    const r = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 3 },
      sources({ gateApproved: async () => false }),
    );
    expect(r.ready).toBe(false);
    expect(r.blockers.some((b) => b.code === "gate_not_approved")).toBe(true);
  });

  it("allows retry on an already-approved phase, but never bypasses an unapproved gate", async () => {
    const approvedRetry = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 3, allowApprovedRetry: true },
      sources({ captureComplete: async () => ({ complete: false, missing: ["x"] }) }),
    );
    expect(approvedRetry.ready).toBe(true); // approved → retry allowed

    const unapprovedRetry = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 3, allowApprovedRetry: true },
      sources({ gateApproved: async () => false }),
    );
    expect(unapprovedRetry.ready).toBe(false); // not approved → still blocked
  });
});
