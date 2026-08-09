// Unit tests for the five derived presentation fields (handoff prompt §2.8).
//
// These are the only place in the Command Center where a money figure is
// computed rather than read, so the arithmetic is pinned here.

import type { TowerMartProgramLane } from "@/lib/cio-tower/tower-mart-view-model";
import {
  adoptionFraction,
  blockedUsd,
  claimableUsd,
  deriveProgramValues,
  evidenceMaturity,
  financeExceedsUsage,
  financeStatus,
  gatesClearedFraction,
  hasUsageEvidence,
  laneFor,
  proofSequenceExplanation,
  proofSequenceStatus,
  proofLevel,
  usageStatus,
  usageSupportedUsd,
} from "../derive";

const M = 1_000_000;

function lane(
  overrides: Partial<TowerMartProgramLane> = {},
): TowerMartProgramLane {
  return {
    laneKey: "tenant::lane::p1",
    programCode: "P1",
    programName: "Test Program",
    ownerRole: "CIO",
    financeOwnerRole: "CFO",
    decisionLane: "fix",
    decisionRationale: "Blocked on evidence",
    approvedFundingUsd: 50 * M,
    aiTaggedSpendUsd: 10 * M,
    promisedValueUsd: 10 * M,
    financeValidatedValueUsd: 0,
    usageMetric: null,
    usageActual: null,
    adoptionRatePct: null,
    valueClaimStatus: "blocked",
    towerClaimAllowed: "blocked",
    requiredGates: [],
    caveat: "",
    sourceFile: null,
    sourceRow: null,
    ...overrides,
  };
}

describe("adoptionFraction / hasUsageEvidence", () => {
  it("reads adoption_rate_pct as a 0–1 fraction", () => {
    expect(adoptionFraction(lane({ adoptionRatePct: 44 }))).toBeCloseTo(0.44);
    expect(adoptionFraction(lane({ adoptionRatePct: 100 }))).toBe(1);
  });

  it("clamps out-of-range percentages instead of trusting them", () => {
    expect(adoptionFraction(lane({ adoptionRatePct: 140 }))).toBe(1);
    expect(adoptionFraction(lane({ adoptionRatePct: -5 }))).toBe(0);
  });

  it("treats a missing adoption rate as zero, not as unknown-therefore-some", () => {
    expect(adoptionFraction(lane({ adoptionRatePct: null }))).toBe(0);
  });

  it("counts a usage metric with an actual as usage evidence even without a rate", () => {
    expect(
      hasUsageEvidence(
        lane({ usageMetric: "Seats active", usageActual: 1840 }),
      ),
    ).toBe(true);
    expect(
      hasUsageEvidence(
        lane({ usageMetric: "Seats active", usageActual: null }),
      ),
    ).toBe(false);
    expect(hasUsageEvidence(lane())).toBe(false);
  });
});

describe("usageSupportedUsd", () => {
  it("credits promised value in proportion to observed adoption", () => {
    const value = usageSupportedUsd(
      lane({
        promisedValueUsd: 10 * M,
        financeValidatedValueUsd: 2 * M,
        adoptionRatePct: 50,
      }),
    );
    expect(value).toBe(5 * M);
  });

  it("credits NOTHING at zero adoption, whatever Finance has validated", () => {
    // Pins the live Healthcare Composite Demo state verified 2026-07-23:
    // the shipped Tower reports Usage-supported $0 with Finance-validated
    // $3.8M. Flooring this at the finance figure would make the two Tower
    // surfaces disagree on the same tenant.
    const value = usageSupportedUsd(
      lane({
        promisedValueUsd: 10 * M,
        financeValidatedValueUsd: 3 * M,
        adoptionRatePct: 0,
      }),
    );
    expect(value).toBe(0);
  });

  it("credits nothing when no adoption rate is recorded at all", () => {
    expect(
      usageSupportedUsd(
        lane({
          promisedValueUsd: 10 * M,
          financeValidatedValueUsd: 3 * M,
          adoptionRatePct: null,
        }),
      ),
    ).toBe(0);
  });

  it("never exceeds promised value, even at full adoption", () => {
    const value = usageSupportedUsd(
      lane({
        promisedValueUsd: 10 * M,
        financeValidatedValueUsd: 4 * M,
        adoptionRatePct: 100,
      }),
    );
    expect(value).toBe(10 * M);
  });

  it("is zero when nothing is promised", () => {
    expect(
      usageSupportedUsd(lane({ promisedValueUsd: 0, adoptionRatePct: 90 })),
    ).toBe(0);
  });
});

describe("financeExceedsUsage", () => {
  it("flags Finance validating more than usage evidence supports", () => {
    expect(
      financeExceedsUsage(
        lane({
          promisedValueUsd: 10 * M,
          financeValidatedValueUsd: 3 * M,
          adoptionRatePct: null,
        }),
      ),
    ).toBe(true);
  });

  it("is false when adoption comfortably covers the validated figure", () => {
    expect(
      financeExceedsUsage(
        lane({
          promisedValueUsd: 10 * M,
          financeValidatedValueUsd: 3 * M,
          adoptionRatePct: 80,
        }),
      ),
    ).toBe(false);
  });
});

describe("proof sequence anomaly", () => {
  it("preserves finance validation ahead of usage evidence as an executive signal", () => {
    const row = lane({
      promisedValueUsd: 10 * M,
      financeValidatedValueUsd: 3.8 * M,
      adoptionRatePct: null,
      usageMetric: null,
      usageActual: null,
    });
    expect(usageSupportedUsd(row)).toBe(0);
    expect(proofSequenceStatus(row)).toBe(
      "finance_validation_ahead_of_usage_evidence",
    );
    expect(proofSequenceExplanation(row)).toMatch(
      /Finance has validated a partial benefit/,
    );
  });

  it("reports ordered when usage evidence supports the finance-validated value", () => {
    const row = lane({
      promisedValueUsd: 10 * M,
      financeValidatedValueUsd: 3 * M,
      adoptionRatePct: 80,
    });
    expect(proofSequenceStatus(row)).toBe("ordered");
    expect(proofSequenceExplanation(row)).toBeNull();
  });
});

describe("claimableUsd", () => {
  it('books finance-validated value only when the claim gate is "allowed"', () => {
    expect(
      claimableUsd({
        towerClaimAllowed: "allowed",
        financeValidatedValueUsd: 3.8 * M,
      }),
    ).toBe(3.8 * M);
  });

  it('books nothing on "partial" — validated is not the same as claimable', () => {
    expect(
      claimableUsd({
        towerClaimAllowed: "partial",
        financeValidatedValueUsd: 3.8 * M,
      }),
    ).toBe(0);
  });

  it('books nothing on "blocked" or on an unrecognised status', () => {
    expect(
      claimableUsd({
        towerClaimAllowed: "blocked",
        financeValidatedValueUsd: 9 * M,
      }),
    ).toBe(0);
    expect(
      claimableUsd({ towerClaimAllowed: "", financeValidatedValueUsd: 9 * M }),
    ).toBe(0);
  });

  it("is case- and whitespace-insensitive on the gate value", () => {
    expect(
      claimableUsd({
        towerClaimAllowed: " Allowed ",
        financeValidatedValueUsd: 1 * M,
      }),
    ).toBe(1 * M);
  });
});

describe("blockedUsd", () => {
  it("is every promised dollar that cannot be booked today", () => {
    expect(
      blockedUsd({
        promisedValueUsd: 35.5 * M,
        towerClaimAllowed: "partial",
        financeValidatedValueUsd: 3.8 * M,
      }),
    ).toBe(35.5 * M);
  });

  it("nets out the claimable portion when the gate has cleared", () => {
    expect(
      blockedUsd({
        promisedValueUsd: 10 * M,
        towerClaimAllowed: "allowed",
        financeValidatedValueUsd: 4 * M,
      }),
    ).toBe(6 * M);
  });

  it("never goes negative", () => {
    expect(
      blockedUsd({
        promisedValueUsd: 2 * M,
        towerClaimAllowed: "allowed",
        financeValidatedValueUsd: 9 * M,
      }),
    ).toBe(0);
  });
});

describe("gatesClearedFraction", () => {
  it("returns null when no gates are recorded — absence is not completion", () => {
    expect(gatesClearedFraction([])).toBeNull();
  });

  it("counts met / cleared / passed gates", () => {
    expect(
      gatesClearedFraction([
        { met: true },
        { status: "cleared" },
        { status: "open" },
        {},
      ]),
    ).toBe(0.5);
  });
});

describe("evidenceMaturity", () => {
  it("is 0 with promised value and no evidence at all", () => {
    expect(evidenceMaturity(lane({ promisedValueUsd: 10 * M }))).toBe(0);
  });

  it("is 100 when fully validated, fully adopted and fully gated", () => {
    expect(
      evidenceMaturity(
        lane({
          promisedValueUsd: 10 * M,
          financeValidatedValueUsd: 10 * M,
          adoptionRatePct: 100,
          requiredGates: [{ met: true }],
        }),
      ),
    ).toBe(100);
  });

  it("weights finance 0.40, adoption 0.35, gates 0.25", () => {
    // 0.40×1 + 0.35×0 + 0.25×0 = 40
    expect(
      evidenceMaturity(
        lane({ promisedValueUsd: 10 * M, financeValidatedValueUsd: 10 * M }),
      ),
    ).toBe(40);
    // 0.40×0 + 0.35×1 + 0.25×0 = 35
    expect(
      evidenceMaturity(
        lane({ promisedValueUsd: 10 * M, adoptionRatePct: 100 }),
      ),
    ).toBe(35);
    // 0.40×0 + 0.35×0 + 0.25×1 = 25
    expect(
      evidenceMaturity(
        lane({ promisedValueUsd: 10 * M, requiredGates: [{ met: true }] }),
      ),
    ).toBe(25);
  });

  it("scores 0 for finance when nothing is promised, rather than dividing by zero", () => {
    expect(
      evidenceMaturity(
        lane({ promisedValueUsd: 0, financeValidatedValueUsd: 5 * M }),
      ),
    ).toBe(0);
  });
});

describe("proofLevel", () => {
  it("is 3 only when value is actually claimable", () => {
    expect(
      proofLevel(
        lane({ towerClaimAllowed: "allowed", financeValidatedValueUsd: 1 * M }),
      ),
    ).toBe(3);
  });

  it("is 2 when Finance validated but the claim gate has not cleared", () => {
    expect(
      proofLevel(
        lane({ towerClaimAllowed: "partial", financeValidatedValueUsd: 1 * M }),
      ),
    ).toBe(2);
  });

  it("is 1 with usage evidence but no finance validation", () => {
    expect(proofLevel(lane({ adoptionRatePct: 44 }))).toBe(1);
  });

  it("is 0 with neither", () => {
    expect(proofLevel(lane())).toBe(0);
  });
});

describe("usageStatus / financeStatus", () => {
  it("calls 60%+ adoption strong and below it weak", () => {
    expect(usageStatus(lane({ adoptionRatePct: 96 }))).toBe("strong");
    expect(usageStatus(lane({ adoptionRatePct: 60 }))).toBe("strong");
    expect(usageStatus(lane({ adoptionRatePct: 44 }))).toBe("weak");
  });

  it("calls unquantified usage weak, and no usage none", () => {
    expect(
      usageStatus(lane({ usageMetric: "Alerts scored", usageActual: 1200 })),
    ).toBe("weak");
    expect(usageStatus(lane())).toBe("none");
  });

  it("separates validated from partial", () => {
    expect(
      financeStatus({
        towerClaimAllowed: "allowed",
        financeValidatedValueUsd: 1 * M,
      }),
    ).toBe("validated");
    expect(
      financeStatus({
        towerClaimAllowed: "partial",
        financeValidatedValueUsd: 1 * M,
      }),
    ).toBe("partial");
    expect(
      financeStatus({
        towerClaimAllowed: "blocked",
        financeValidatedValueUsd: 0,
      }),
    ).toBe("none");
  });
});

describe("laneFor", () => {
  it("passes the mart lane straight through when value is promised", () => {
    expect(
      laneFor({
        decisionLane: "fund",
        promisedValueUsd: 5 * M,
        approvedFundingUsd: 10 * M,
      }),
    ).toBe("fund");
  });

  it("reclassifies a funded line with no promised value as watch", () => {
    expect(
      laneFor({
        decisionLane: "fund",
        promisedValueUsd: 0,
        approvedFundingUsd: 84 * M,
      }),
    ).toBe("watch");
  });

  it("leaves an unfunded, unpromised row in its mart lane", () => {
    expect(
      laneFor({
        decisionLane: "stop",
        promisedValueUsd: 0,
        approvedFundingUsd: 0,
      }),
    ).toBe("stop");
  });
});

describe("deriveProgramValues", () => {
  it("keeps usage and finance inside promised, and claimable inside finance", () => {
    const promisedValueUsd = 12.4 * M;
    const financeValidatedValueUsd = 3.1 * M;
    const row = lane({
      promisedValueUsd,
      financeValidatedValueUsd,
      adoptionRatePct: 86,
      towerClaimAllowed: "partial",
    });
    const d = deriveProgramValues(row);
    expect(d.usageSupportedUsd).toBeLessThanOrEqual(promisedValueUsd);
    // 12.4M × 0.86 = 10.664M, comfortably above the 3.1M Finance validated.
    expect(d.usageSupportedUsd).toBeCloseTo(10.664 * M, 0);
    expect(financeValidatedValueUsd).toBeGreaterThanOrEqual(d.claimableUsd);
    expect(d.claimableUsd).toBe(0);
    expect(d.blockedUsd).toBe(12.4 * M);
    expect(d.proofLevel).toBe(2);
    expect(d.usageStatus).toBe("strong");
    expect(d.valueAtStakeUsd).toBe(12.4 * M);
  });

  it("handles an all-zero row without producing NaN", () => {
    const d = deriveProgramValues(
      lane({
        promisedValueUsd: 0,
        approvedFundingUsd: 0,
        financeValidatedValueUsd: 0,
      }),
    );
    expect(
      Object.values(d).every(
        (v) => typeof v !== "number" || Number.isFinite(v),
      ),
    ).toBe(true);
    expect(d.evidenceMaturity).toBe(0);
    expect(d.proofLevel).toBe(0);
  });
});
