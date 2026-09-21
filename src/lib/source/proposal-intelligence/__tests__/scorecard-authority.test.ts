import {
  buildScorecardAuthorityView,
  type ScorecardAuthorityCriterionRecord,
  type ScorecardAuthorityScoreRecord,
} from "../scorecard-authority";

const baseCriterion: ScorecardAuthorityCriterionRecord = {
  tenantKey: "tenant-a",
  sourceEventId: "event-1",
  criterionId: "transition",
  criterionVersion: "crit-v1",
  label: "Transition certainty",
  weight: 40,
  weightsFrozen: true,
  approvedCriterionVersion: "crit-v1",
  approvedBy: "procurement-lead",
  approvedAt: "2026-09-19T12:00:00Z",
};

const baseScore: ScorecardAuthorityScoreRecord = {
  tenantKey: "tenant-a",
  sourceEventId: "event-1",
  vendorId: "vendor-a",
  vendorName: "Vendor A",
  criterionId: "transition",
  criterionVersion: "crit-v1",
  evaluatorId: "eval-1",
  evaluatorName: "A. Evaluator",
  evaluatorScore: 8,
  evidenceReference: "EVID-TRANSITION-01",
  overrideReason: null,
  overrideReasonRequired: false,
  lockState: "locked",
  lockedBy: "eval-1",
  lockedAt: "2026-09-19T12:30:00Z",
};

function view(args: {
  tenantKey?: string;
  criteria?: ScorecardAuthorityCriterionRecord[];
  scores?: ScorecardAuthorityScoreRecord[];
}) {
  return buildScorecardAuthorityView({
    tenantKey: args.tenantKey ?? "tenant-a",
    sourceEventId: "event-1",
    criteria: args.criteria ?? [baseCriterion],
    scores: args.scores ?? [baseScore],
  });
}

describe("buildScorecardAuthorityView", () => {
  it("blocks ranking and BAFO readiness when authority records are absent", () => {
    const result = view({ criteria: [], scores: [] });

    expect(result.state).toBe("blocked");
    expect(result.rankAllowed).toBe(false);
    expect(result.advanceAllowed).toBe(false);
    expect(result.bafoReady).toBe(false);
    expect(result.vendorRows).toEqual([]);
    expect(result.blockers.map((blocker) => blocker.blockerId)).toContain(
      "scorecard-authority-missing",
    );
  });

  it("marks the read contract ready only from approved frozen criteria and locked named evaluator scores", () => {
    const result = view({});

    expect(result.state).toBe("ready");
    expect(result.rankAllowed).toBe(false);
    expect(result.advanceAllowed).toBe(false);
    expect(result.bafoReady).toBe(false);
    expect(result.weightTotal).toBe(40);
    expect(result.criteria[0]).toEqual(
      expect.objectContaining({
        approvedCriterionVersion: "crit-v1",
        weightsFrozen: true,
      }),
    );
    expect(result.scoreRows[0]).toEqual(
      expect.objectContaining({
        evaluatorName: "A. Evaluator",
        evidenceReference: "EVID-TRANSITION-01",
        overrideReason: null,
        lockState: "locked",
      }),
    );
    expect(result.vendorRows).toEqual([
      {
        vendorId: "vendor-a",
        vendorName: "Vendor A",
        lockedScoreCount: 1,
        requiredScoreCount: 1,
        completenessState: "complete",
        conflictState: "none",
      },
    ]);
    expect(result.blockers).toEqual([]);
  });

  it("does not rank suppliers or expose weighted totals when score authority is complete", () => {
    const result = view({
      scores: [
        {
          ...baseScore,
          vendorId: "vendor-a",
          vendorName: "Vendor A",
          evaluatorScore: 6,
        },
        {
          ...baseScore,
          vendorId: "vendor-b",
          vendorName: "Vendor B",
          evaluatorScore: 9,
        },
      ],
    });

    expect(result.state).toBe("ready");
    expect(result.vendorRows).toEqual([
      expect.objectContaining({
        vendorId: "vendor-a",
        vendorName: "Vendor A",
        lockedScoreCount: 1,
        requiredScoreCount: 1,
        completenessState: "complete",
        conflictState: "none",
      }),
      expect.objectContaining({
        vendorId: "vendor-b",
        vendorName: "Vendor B",
        lockedScoreCount: 1,
        requiredScoreCount: 1,
        completenessState: "complete",
        conflictState: "none",
      }),
    ]);
    expect(JSON.stringify(result.vendorRows)).not.toMatch(
      /weightedScore|rank/i,
    );
  });

  it("refuses criteria whose weights are not frozen or approved at the same version", () => {
    const result = view({
      criteria: [
        { ...baseCriterion, weightsFrozen: false },
        {
          ...baseCriterion,
          criterionId: "commercial",
          label: "Commercial value",
          criterionVersion: "crit-v2",
          approvedCriterionVersion: "crit-v1",
        },
      ],
      scores: [
        baseScore,
        {
          ...baseScore,
          criterionId: "commercial",
          criterionVersion: "crit-v2",
        },
      ],
    });

    expect(result.state).toBe("blocked");
    expect(result.rankAllowed).toBe(false);
    expect(result.bafoReady).toBe(false);
    expect(result.vendorRows).toEqual([]);
    expect(result.blockers.map((blocker) => blocker.blockerId)).toEqual(
      expect.arrayContaining([
        "criterion-transition-weights-not-frozen",
        "criterion-commercial-version-not-approved",
      ]),
    );
  });

  it("refuses scores without named evaluator, evidence, override reason, or lock", () => {
    const result = view({
      scores: [
        {
          ...baseScore,
          evaluatorName: " ",
          evidenceReference: null,
          overrideReasonRequired: true,
          overrideReason: null,
          lockState: "unlocked",
          lockedBy: null,
          lockedAt: null,
        },
      ],
    });

    expect(result.state).toBe("blocked");
    expect(result.advanceAllowed).toBe(false);
    expect(result.scoreRows[0]).toEqual(
      expect.objectContaining({
        evaluatorName: " ",
        evidenceReference: null,
        overrideReasonRequired: true,
        overrideReason: null,
        lockState: "unlocked",
      }),
    );
    expect(result.blockers.map((blocker) => blocker.blockerId)).toEqual(
      expect.arrayContaining([
        "score-vendor-a-transition-named-evaluator-missing",
        "score-vendor-a-transition-evidence-missing",
        "score-vendor-a-transition-override-reason-missing",
        "score-vendor-a-transition-not-locked",
      ]),
    );
  });

  it("filters by tenant and does not use another tenant's authority rows", () => {
    const result = view({
      tenantKey: "tenant-b",
      criteria: [baseCriterion],
      scores: [baseScore],
    });

    expect(result.state).toBe("blocked");
    expect(result.rankAllowed).toBe(false);
    expect(result.bafoReady).toBe(false);
    expect(result.blockers.map((blocker) => blocker.blockerId)).toContain(
      "scorecard-authority-missing",
    );
    expect(result.scoreRows).toEqual([]);
    expect(result.vendorRows).toEqual([]);
  });
});
