import { buildEvidencePackageReadiness } from "../evidence-package-readiness";

describe("buildEvidencePackageReadiness", () => {
  it("turns a zero-evidence blocked run into an educational package-readiness message", () => {
    const readiness = buildEvidencePackageReadiness({
      status: "blocked",
      retrievedEvidence: 0,
      blockers: ["2 unsupported client-fact claim(s) (number/date/$/% with no [n], assumption, or placeholder)"],
      warnings: [],
    });

    expect(readiness).toMatchObject({
      label: "Cannot assemble executive package",
      evidenceCoveragePct: 0,
      confidenceTier: "bronze",
      confidenceLabel: "Internal working draft",
      canShareExternally: false,
      recommendedNextStep:
        "Upload and approve the phase workshop outputs, source files, and decision evidence, then re-run Approve & Build.",
    });
    expect(readiness.missing).toContain("Source-backed evidence attached to this Move");
    expect(readiness.missing).toContain(
      "Cited metrics, finance-approved baselines, or explicit assumption labels",
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
