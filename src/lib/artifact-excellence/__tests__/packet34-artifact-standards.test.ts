import {
  getPacket34ArtifactStandard,
  listPacket34ArtifactStandards,
  PACKET34_REQUIRED_ARTIFACT_KINDS,
  type Packet34ArtifactKind,
} from "../packet34-artifact-standards";
import {
  scoreCxoArtifactExcellence,
  type CxoArtifactExcellenceSignals,
} from "../cxo-artifact-excellence-framework";

describe("Packet 34 artifact standards", () => {
  it("declares a runtime standard for every required Packet 34 artifact kind", () => {
    expect(listPacket34ArtifactStandards()).toHaveLength(
      PACKET34_REQUIRED_ARTIFACT_KINDS.length,
    );

    for (const kind of PACKET34_REQUIRED_ARTIFACT_KINDS) {
      const standard = getPacket34ArtifactStandard(kind);
      expect(standard.artifactKind).toBe(kind);
      expect(standard.requiredSections.length).toBeGreaterThanOrEqual(6);
      expect(standard.requiredExhibits.length).toBeGreaterThanOrEqual(3);
      expect(standard.requiredEvidence.length).toBeGreaterThanOrEqual(3);
      expect(standard.minimumScores.board_circulation).toBeGreaterThanOrEqual(
        90,
      );
    }
  });

  it("passes a complete board-circulation quality card for each standard", () => {
    for (const standard of listPacket34ArtifactStandards()) {
      const score = scoreCxoArtifactExcellence(
        makeSignals(standard.artifactKind as Packet34ArtifactKind),
        standard,
      );

      expect(score.passed).toBe(true);
      expect(score.score).toBeGreaterThanOrEqual(score.threshold);
      expect(score.hardFailures).toEqual([]);
    }
  });

  it("fails a Packet 34 quality card when a required exhibit is missing", () => {
    const standard = getPacket34ArtifactStandard("executive_briefing_memo");
    const score = scoreCxoArtifactExcellence(
      makeSignals("executive_briefing_memo", {
        exhibitFamilies: ["decision_card", "evidence_gap_matrix"],
      }),
      standard,
    );

    expect(score.passed).toBe(false);
    expect(score.missingExhibits).toContain("options_comparison");
    expect(score.recommendations).toContain(
      "Add required exhibit: options_comparison.",
    );
  });
});

function makeSignals(
  kind: Packet34ArtifactKind,
  overrides: Partial<CxoArtifactExcellenceSignals> = {},
): CxoArtifactExcellenceSignals {
  const standard = getPacket34ArtifactStandard(kind);

  return {
    module: standard.module,
    artifactKind: standard.artifactKind,
    circulationLevel: "board_circulation",
    sectionIds: [...standard.requiredSections],
    exhibitFamilies: [...standard.requiredExhibits],
    evidenceIds: [...standard.requiredEvidence],
    hasRecommendation: true,
    hasDecisionOwner: true,
    hasAssumptionLedger: true,
    hasSensitivity: true,
    hasOptionsConsidered: true,
    hasEditablePptxWhenRequested: true,
    hasEvidenceTrace: true,
    hasReviewerState: true,
    financialClaimsAreRanged: true,
    financialClaimsAreGrounded: true,
    staleOrMissingEvidenceVisible: true,
    visualsCarryDecisionLogic: true,
    riskOwnersNamed: true,
    text: "Executive answer with a cited recommendation, options, sensitivity, evidence trace, named owner, risk control, and next action.",
    ...overrides,
  };
}
