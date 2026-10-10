import {
  countActionClauses,
  floorAverage,
  hasFigureProvenance,
  overflowIssues,
  scoreWalkUx,
  type WalkDomSnapshot,
  type WalkUxInput,
} from "../e2e/_helpers/moves-walk-ux-score";
import { buildJourney } from "../e2e/_helpers/moves-walk-journey";
import {
  phaseReachable,
  walkCoverage,
} from "../e2e/_helpers/moves-walk-coverage";

const goodSnapshot: WalkDomSnapshot = {
  stepHead: true,
  nextAction: true,
  contextLine: true,
  workGroupOrEmptyState: true,
  footer: true,
  currentStepMatches: true,
  nextActionText: "Review 2 open rows.",
  countLabel: "2 of 4 settled",
  workRowCount: 2,
  viewportWidth: 390,
  documentScrollWidth: 390,
  documentClientWidth: 390,
  wideElements: [],
  clippedTextElements: [],
  figures: [{ value: "$120", nearbyText: "FACT · $120 [E:2]" }],
  tenantName: "Demo organization",
  themeScheme: "light",
  unreviewedReadError: null,
};

function input(): WalkUxInput {
  return {
    expectedTenantName: "Demo organization",
    settledHeadMs: 2_000,
    variants: {
      desktopLight: {
        snapshot: { ...goodSnapshot, viewportWidth: 1440 },
        seriousCriticalAxeIds: [],
      },
      phoneLight: { snapshot: goodSnapshot, seriousCriticalAxeIds: [] },
      desktopDark: {
        snapshot: { ...goodSnapshot, viewportWidth: 1440, themeScheme: "dark" },
        contrastAxeIds: [],
      },
      phoneDark: {
        snapshot: { ...goodSnapshot, themeScheme: "dark" },
        contrastAxeIds: [],
      },
    },
  };
}

describe("Moves live-walk UX scoring", () => {
  it("counts commas and standalone conjunctions as clauses", () => {
    expect(
      countActionClauses("Review the basis, accept it, and continue."),
    ).toBe(4);
    expect(countActionClauses("Review the basis and continue.")).toBe(2);
    expect(countActionClauses("Review the handoff.")).toBe(1);
    expect(countActionClauses(" ")).toBe(0);
  });

  it("requires a nearby fact, estimate, or register citation for figures", () => {
    expect(hasFigureProvenance("$120 FACT")).toBe(true);
    expect(hasFigureProvenance("$120 ESTIMATE")).toBe(true);
    expect(hasFigureProvenance("$120 [A:ROM-1]")).toBe(true);
    expect(hasFigureProvenance("42% [E:2]")).toBe(true);
    expect(hasFigureProvenance("42% [S:3]")).toBe(true);
    expect(hasFigureProvenance("$120 is a possible saving")).toBe(false);
    expect(hasFigureProvenance("$120 PATTERN")).toBe(false);
  });

  it("detects page overflow, wide elements and clipped text", () => {
    expect(overflowIssues(goodSnapshot)).toEqual([]);
    expect(
      overflowIssues({
        ...goodSnapshot,
        documentScrollWidth: 412,
        wideElements: ["chart 420px"],
        clippedTextElements: ["value 280/120"],
      }),
    ).toEqual([
      "page scroll 412/390",
      "wide: chart 420px",
      "clipped: value 280/120",
    ]);
  });

  it("scores a fully measured compliant page at 100", () => {
    const result = scoreWalkUx(input());
    expect(result.score).toBe(100);
    expect(result.measuredPoints).toBe(100);
    expect(result.violations).toEqual([]);
  });

  it("deducts for unclear action, unlabelled figures, responsive defects and axe IDs", () => {
    const measured = input();
    measured.variants.desktopLight.snapshot = {
      ...goodSnapshot,
      nextActionText: "Record this step's decisions, and continue.",
      figures: [{ value: "$120", nearbyText: "$120 is a possible saving" }],
    };
    measured.variants.phoneLight.snapshot = {
      ...goodSnapshot,
      documentScrollWidth: 420,
    };
    measured.variants.desktopLight.seriousCriticalAxeIds = [
      "aria-required-attr",
    ];
    measured.variants.phoneDark.contrastAxeIds = ["color-contrast"];
    const result = scoreWalkUx(measured);
    expect(result.dimensions.nextAction.earned).toBe(0);
    expect(result.dimensions.honesty.earned).toBe(0);
    expect(result.dimensions.responsiveness.earned).toBe(0);
    expect(result.dimensions.accessibility.earned).toBe(15);
    expect(result.dimensions.themes.earned).toBe(7);
    expect(result.score).toBe(52);
    expect(result.violations).toContain("accessibility: aria-required-attr");
  });

  it("marks an unavailable dimension and states the measured denominator", () => {
    const measured = input();
    measured.variants.phoneDark.contrastAxeIds = null;
    const result = scoreWalkUx(measured);
    expect(result.dimensions.themes).toEqual({
      earned: null,
      possible: 10,
      reason: "dark-mode contrast result unavailable at one or both widths",
    });
    expect(result.measuredPoints).toBe(90);
    expect(result.score).toBe(100);
    expect(floorAverage([82, 83, null])).toBe(82);
  });

  it("keeps every UX dimension unmeasured on an unreachable phase", () => {
    const result = scoreWalkUx({
      ...input(),
      unavailableReason: "Move is at P3",
    });
    expect(result.score).toBeNull();
    expect(result.measuredPoints).toBe(0);
    expect(
      Object.values(result.dimensions).every(
        (item) => item.earned === null && item.reason === "Move is at P3",
      ),
    ).toBe(true);
  });
});

describe("Moves live-walk journey derivation", () => {
  it("counts only phases at or before the persisted phase as reachable", () => {
    expect(phaseReachable(3, 3)).toBe(true);
    expect(phaseReachable(3, 4)).toBe(false);
    expect(phaseReachable(3.5, 3)).toBe(false);
    expect(
      walkCoverage(["pass", "known_gap", "fail", "not_reachable"]),
    ).toEqual({
      total: 4,
      reached: 3,
      passed: 1,
      knownGap: 1,
      failed: 1,
      notReachable: 1,
      unassessed: 0,
    });
    expect(walkCoverage(["pass"], 29)).toMatchObject({
      total: 29,
      passed: 1,
      unassessed: 28,
    });
  });

  it("never turns an unevaluated gate into zero met checks", () => {
    const readbacks = Array.from({ length: 6 }, (_, phase) => ({
      currentPhase: 3,
      terminalComplete: false,
      criteria: [
        {
          id: `check-${phase}`,
          label: "Required check",
          severity: "hard" as const,
          verified: phase !== 4,
          completed: phase < 3,
          reason: "Needs review",
        },
      ],
      reason: null,
    }));
    const journey = buildJourney(readbacks, [], true);
    expect(journey[2].state).toBe("done");
    expect(journey[3].state).toBe("current");
    expect(journey[4].state).toBe("upcoming");
    expect(journey[4].hard).toEqual({ met: null, total: 1 });
    expect(journey[3].firstOpenHard).toEqual({
      id: "check-3",
      reason: "Needs review",
    });
  });

  it("counts only current generated artifacts and current-version sign-offs", () => {
    const journey = buildJourney(
      Array.from({ length: 6 }, () => ({
        currentPhase: 5,
        terminalComplete: true,
        criteria: [],
        reason: null,
      })),
      [
        {
          artifactId: "one",
          phase: 4,
          family: "generated_deliverable",
          currentVersion: 2,
          signedOffVersion: 2,
        },
        {
          artifactId: "two",
          phase: 4,
          family: "generated_deliverable",
          currentVersion: 2,
          signedOffVersion: 1,
        },
        {
          artifactId: "evidence",
          phase: 4,
          family: "evidence",
          currentVersion: 1,
          signedOffVersion: 1,
        },
      ],
      true,
    );
    expect(journey[5].state).toBe("done");
    expect(journey[4].documents.currentBuiltCount).toBe(2);
    expect(journey[4].documents.signedOffCount).toBe(1);
    expect(journey[4].documents.allObservedSignedOff).toBe(false);
  });
});
