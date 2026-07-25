import {
  CHARTER_CONTRACT,
  CHARTER_PLACEHOLDER_LABELS,
  getArtifactContract,
  sectionWordCapTotal,
} from "../artifact-contracts";

describe("shared artifact contracts", () => {
  it("returns the charter contract by deliverable type", () => {
    expect(getArtifactContract("charter")).toBe(CHARTER_CONTRACT);
    expect(getArtifactContract("business_case")).toBeNull();
  });

  it("keeps the charter's per-section word caps under the hard word ceiling", () => {
    expect(sectionWordCapTotal(CHARTER_CONTRACT)).toBeLessThanOrEqual(
      CHARTER_CONTRACT.wordBudget.hardMaxWords,
    );
  });

  it("keeps the word budget internally consistent (min <= target min <= target max <= hard max)", () => {
    const wb = CHARTER_CONTRACT.wordBudget;
    expect(wb.minWords).toBeLessThanOrEqual(wb.targetWords.min);
    expect(wb.targetWords.min).toBeLessThanOrEqual(wb.targetWords.max);
    expect(wb.targetWords.max).toBeLessThanOrEqual(wb.hardMaxWords);
  });

  it("matches the reconciled canonical values (2026-07-25) exactly — not a looser historical floor", () => {
    expect(CHARTER_CONTRACT.wordBudget.minWords).toBe(900);
    expect(CHARTER_CONTRACT.wordBudget.targetWords).toEqual({
      min: 900,
      max: 1_100,
    });
    expect(CHARTER_CONTRACT.wordBudget.hardMaxWords).toBe(1_300);
    expect(CHARTER_CONTRACT.maxOutputTokens).toBe(4_000);
    expect(CHARTER_CONTRACT.estimatedRenderedPages).toBe("2-3");
  });

  it("declares the runtime policy flags every generation entry point should honor", () => {
    expect(CHARTER_CONTRACT.policy).toEqual({
      qualityContractRequired: true,
      visualRendererRequired: false,
      evidenceCitationRequired: true,
      phaseBoundaryValidationRequired: true,
      structuredRenderingRequired: true,
    });
  });

  it("exposes the three exact placeholder labels the P1 prompt must use verbatim", () => {
    expect(CHARTER_PLACEHOLDER_LABELS.clientDecisionRequired).toBe(
      "Client Decision Required",
    );
    expect(CHARTER_PLACEHOLDER_LABELS.toValidateDuringDiscovery).toBe(
      "To Validate During Discovery",
    );
    expect(CHARTER_PLACEHOLDER_LABELS.evidenceRequiredForP2).toBe(
      "Evidence Required for P2",
    );
  });

  it("requires exactly 9 sections (redesigned 2026-07-25 to give Discovery Preparation its own section), matching both pipelines' required-section count", () => {
    expect(CHARTER_CONTRACT.sections).toHaveLength(9);
    expect(CHARTER_CONTRACT.sections.map((s) => s.key)).toEqual([
      "charter_decision",
      "opportunity_context",
      "intended_outcomes",
      "scope",
      "success_measures",
      "sponsorship_governance",
      "known_constraints_dependencies",
      "discovery_preparation",
      "authorization_next_steps",
    ]);
  });

  it("declares the boundary statement and table ceiling for the presentation standard", () => {
    expect(CHARTER_CONTRACT.boundaryStatement).toMatch(
      /authorizes and bounds the Discovery phase/i,
    );
    expect(CHARTER_CONTRACT.maxSubstantiveTables).toBe(4);
  });
});
