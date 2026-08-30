import {
  scoreLensDivergence,
  findInventedNumbers,
  findApplicationCountErrors,
  findInventoryOpening,
  JUDGMENT_CLASS_RULES_UNCHECKED,
  type ScorableChapter,
} from "../home-lens-quality";

const CEO_PROSE =
  "The board faces one decision this quarter. Capital is committed against a priority whose cost " +
  "exposure keeps climbing, and the trade-off is between margin protection and revenue urgency. " +
  "The consequence of deferring that choice is a larger investment later.";

const CTO_PROSE =
  "The estate concentrates on one platform tier whose integration topology creates a hard " +
  "dependency. Hosting throughput is constrained by coupling across the component interface, and " +
  "the architecture carries workload resilience risk at that boundary.";

function chapter(
  chapterId: string,
  prose: string,
  expectedClass: ScorableChapter["expectedClass"],
  claimStatements: string[] = [],
): ScorableChapter {
  return { chapterId, prose, claimStatements, expectedClass };
}

describe("lens divergence scoring", () => {
  it("separates a board-voiced chapter from an architecture-voiced chapter", () => {
    const report = scoreLensDivergence([
      chapter("executive_brief", CEO_PROSE, "money_decision"),
      chapter("technology_data", CTO_PROSE, "architecture_dependency"),
    ]);

    for (const separation of report.separations) {
      expect(separation.separation).toBeGreaterThan(0);
    }
    expect(report.meanSeparation).toBeGreaterThan(0);
    expect(report.mostSimilarPair?.cosine ?? 1).toBeLessThan(0.5);
  });

  // The gate has to be observed failing, or it is not a gate. Two chapters written in ONE voice is
  // exactly the failure the config-level lens tests cannot see: eight hats, one writer.
  it("reports no separation when two lenses are written in the same voice", () => {
    const report = scoreLensDivergence([
      chapter("executive_brief", CEO_PROSE, "money_decision"),
      chapter("technology_data", CEO_PROSE, "architecture_dependency"),
    ]);

    expect(report.mostSimilarPair?.cosine).toBeCloseTo(1, 5);
    // Every lens fails to separate, not just one -- with a single voice there is no hat to detect.
    for (const separation of report.separations) {
      expect(separation.separation).toBeLessThanOrEqual(0);
    }
    expect(report.meanSeparation).toBeLessThanOrEqual(0);
  });

  it("excludes routed claim words so shared evidence cannot masquerade as voice", () => {
    const claims = ["Integration dependency across the platform tier constrains throughput."];
    const withClaimWordsOnly = scoreLensDivergence([
      chapter("technology_data", claims[0], "architecture_dependency", claims),
      chapter("executive_brief", CEO_PROSE, "money_decision"),
    ]);

    expect(withClaimWordsOnly.separations.find((s) => s.chapterId === "technology_data")?.ownRate).toBe(0);
  });
});

describe("must_not_do checked against output", () => {
  it("flags a number that appears in no routed claim", () => {
    const violations = findInventedNumbers(
      chapter("performance_value", "Realized benefit reached 47 percent of the committed target.", "value_governance", [
        "The committed target is tracked against attested benefit.",
      ]),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("quote a number that is not in the packet");
    expect(violations[0].detail).toContain("47");
  });

  it("allows a number the routed claims actually assert", () => {
    const violations = findInventedNumbers(
      chapter("performance_value", "Realized benefit reached 47 percent of target.", "value_governance", [
        "Attested benefit stands at 47 percent of the committed target.",
      ]),
    );

    expect(violations).toEqual([]);
  });

  it("names the deployment count when the technology chapter reports it as applications", () => {
    const violations = findApplicationCountErrors(
      chapter("technology_data", "The estate runs 1650 applications across four regions.", "architecture_dependency"),
      { applications: 750, deployments: 1650 },
    );

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("count deployments as applications");
    expect(violations[0].detail).toContain("is the deployment count");
  });

  it("accepts the canonical application count", () => {
    const violations = findApplicationCountErrors(
      chapter("technology_data", "The estate runs 750 applications across four regions.", "architecture_dependency"),
      { applications: 750, deployments: 1650 },
    );

    expect(violations).toEqual([]);
  });

  it("flags an executive brief that opens on an inventory", () => {
    const violations = findInventoryOpening(
      chapter("executive_brief", "The enterprise runs 750 applications across 92 vendors and 30 platforms. Spend is rising.", "money_decision"),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("start with a technology inventory");
  });

  it("accepts an executive brief that opens on business consequence", () => {
    expect(findInventoryOpening(chapter("executive_brief", CEO_PROSE, "money_decision"))).toEqual([]);
  });

  it("declares the judgment-class rules it does not check", () => {
    expect(JUDGMENT_CLASS_RULES_UNCHECKED.length).toBeGreaterThan(0);
    expect(JUDGMENT_CLASS_RULES_UNCHECKED).toContain("treat expected value as realized value");
  });
});
