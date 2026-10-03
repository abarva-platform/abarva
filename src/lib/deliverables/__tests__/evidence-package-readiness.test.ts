import { buildEvidencePackageReadiness } from "../evidence-package-readiness";

describe("buildEvidencePackageReadiness", () => {
  it("distinguishes unsupported client claims from an absent evidence register", () => {
    const readiness = buildEvidencePackageReadiness({
      status: "blocked",
      retrievedEvidence: 0,
      blockers: [
        "2 unsupported client-fact claim(s) (number/date/$/% with no [n], assumption, or placeholder)",
      ],
      warnings: [],
    });

    expect(readiness).toMatchObject({
      label: "Build blocked",
      evidenceCoveragePct: 0,
      confidenceTier: "bronze",
      confidenceLabel: "Internal working draft",
      canShareExternally: false,
      recommendedNextStep:
        "Add source-backed metrics or mark numeric targets as assumptions before re-running the package.",
    });
    expect(readiness.label).toBe("Build blocked");
    expect(readiness.missing).not.toContain("Source register for this Move");
    expect(readiness.missing).toContain(
      "Cited metrics, finance-approved baselines, or explicit assumption labels",
    );
  });

  it("does not turn an overlong draft into a false evidence request", () => {
    const blocker =
      "document too long for this artifact: 7595 words; target ceiling 3000 (advisory band up to 3600) - sections drifted off the decision this artifact exists to support";
    const readiness = buildEvidencePackageReadiness({
      status: "blocked",
      retrievedEvidence: 18,
      blockers: [blocker],
      warnings: [],
    });

    expect(readiness).toMatchObject({
      label: "Build blocked",
      evidenceCoveragePct: 100,
      retrievedEvidence: 18,
      missing: [],
      recommendedNextStep:
        "Shorten the draft to the artifact's target word ceiling, then rebuild. This length blocker does not indicate that more evidence is needed.",
    });
    expect(readiness.headline).not.toMatch(/evidence coverage is .*below/i);
    expect(readiness.missing).not.toContain(
      "Complete workshop findings and phase outputs",
    );
    expect(readiness.recommendedNextStep).not.toMatch(/upload/i);
  });

  it("names an absent source register even if evidence records were retrieved", () => {
    const readiness = buildEvidencePackageReadiness({
      status: "blocked",
      retrievedEvidence: 18,
      blockers: ["no source register"],
      warnings: [],
    });

    expect(readiness.missing).toContain("Source register for this Move");
    expect(readiness.recommendedNextStep).toMatch(
      /create or restore the source register/i,
    );
  });

  it("marks succeeded evidence-rich runs as board-ready advisory confidence", () => {
    const readiness = buildEvidencePackageReadiness({
      status: "succeeded",
      retrievedEvidence: 6,
      blockers: [],
      warnings: [],
    });

    expect(readiness).toMatchObject({
      label: "Executive package assembled",
      evidenceCoveragePct: 100,
      executiveReadinessPct: 100,
      confidenceTier: "board",
      confidenceLabel: "Board-ready",
      canShareExternally: true,
      missing: [],
    });
  });
});
