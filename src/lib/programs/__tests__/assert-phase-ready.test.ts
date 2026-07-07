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
    expect(r.generationMode).toBe("final");
    expect(r.gateApproved).toBe(true);
    expect(r.draftOnly).toBe(false);
    expect(r.draftCaveats).toEqual([]);
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
    expect(r.draftOnly).toBe(false);
  });

  it("blocks when the gate is not approved", async () => {
    const r = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 3 },
      sources({ gateApproved: async () => false }),
    );
    expect(r.ready).toBe(false);
    expect(r.blockers.some((b) => b.code === "gate_not_approved")).toBe(true);
    expect(r.draftOnly).toBe(false);
  });

  it("allows a pre-gate draft when capture is complete but the gate is not approved", async () => {
    const r = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 1, generationMode: "draft" },
      sources({ gateApproved: async () => false }),
    );
    expect(r.ready).toBe(true);
    expect(statusForReadiness(r)).toBe(200);
    expect(r.generationMode).toBe("draft");
    expect(r.gateApproved).toBe(false);
    expect(r.draftOnly).toBe(true);
    expect(r.blockers).toEqual([]);
    expect(r.draftCaveats).toEqual([
      expect.objectContaining({
        code: "gate_not_approved",
        phase: 1,
        severity: "hard",
      }),
    ]);
  });

  it("does not allow a pre-gate draft when capture itself is incomplete", async () => {
    const r = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 1, generationMode: "draft" },
      sources({
        gateApproved: async () => false,
        captureComplete: async () => ({ complete: false, missing: ["Sponsor review module"] }),
      }),
    );
    expect(r.ready).toBe(false);
    expect(statusForReadiness(r)).toBe(409);
    expect(r.draftOnly).toBe(false);
    expect(r.blockers.map((b) => b.code)).toEqual([
      "capture_incomplete",
      "gate_not_approved",
    ]);
  });

  it("allows P3 draft shaping when prior phase review approved it, without marking the gate approved", async () => {
    const r = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 3, generationMode: "draft" },
      sources({
        gateApproved: async () => false,
        captureComplete: async () => ({ complete: false, missing: ["P3 modules"] }),
        priorPhaseDraftApproval: async () => ({
          approved: true,
          caveats: ["P2 is approved only for P3 draft shaping."],
        }),
      }),
    );
    expect(r.ready).toBe(true);
    expect(statusForReadiness(r)).toBe(200);
    expect(r.gateApproved).toBe(false);
    expect(r.draftOnly).toBe(true);
    expect(r.draftCaveats.map((caveat) => caveat.reason)).toContain(
      "P2 is approved only for P3 draft shaping.",
    );
  });

  it("does not allow final generation from prior phase draft approval", async () => {
    const r = await assertPhaseReadyForGeneration(
      { moveId: "m", phase: 3, generationMode: "final" },
      sources({
        gateApproved: async () => false,
        captureComplete: async () => ({ complete: true, missing: [] }),
        priorPhaseDraftApproval: async () => ({
          approved: true,
          caveats: ["P2 is approved only for P3 draft shaping."],
        }),
      }),
    );
    expect(r.ready).toBe(false);
    expect(statusForReadiness(r)).toBe(409);
    expect(r.blockers.map((blocker) => blocker.code)).toEqual([
      "gate_not_approved",
    ]);
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
