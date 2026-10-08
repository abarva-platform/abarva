/**
 * The risk-factor vocabulary join.
 *
 * The defect this pins: the thirteen D1-D5/E1-E8 factors were asked in one
 * hardcoded clinical vocabulary ("Clinical Decisioning", "Patient-Facing
 * Exposure", "PHI / Sensitive Data Exposure") on every Move, including a Move
 * that had DECLARED a non-clinical archetype. The panel requires all thirteen
 * before it will save, so a declared data-foundation Move could not record an
 * assessment without rating a clinical decision.
 *
 * The two invariants that make the vocabulary safe to configure are asserted
 * here, not just the re-wording: the key SET and ORDER are identical across
 * every vocabulary, and nothing about the stored value or the score moves.
 */

import {
  RISK_DIMENSION_KEYS,
  RISK_ESCALATOR_KEYS,
  RISK_FACTOR_VOCABULARY_CATALOG,
  SHIPPED_RISK_FACTOR_VOCABULARY,
  archetypeVocabularyKey,
  resolveRiskFactorVocabulary,
} from "../risk-factor-vocabulary";
import { computeRiskTier, type RiskTierInputs } from "../risk-tier-scoring";

const ANSWERED: RiskTierInputs = {
  d1DataSensitivity: "Critical",
  d2HumanOversight: "Low",
  d3IntegrationImpact: "Critical",
  d4BuildOrigin: "Moderate",
  d5DomainBreadth: "Moderate",
  e1PhiExposure: "High",
  e2AutonomousAction: "NotTriggered",
  e3ClinicalDecisioning: "Moderate",
  e4OrganizationReadiness: "NotTriggered",
  e5CrossDomainIntegration: "Moderate",
  e6PublicRegulatoryExposure: "High",
  e7BrandReputationRisk: "Moderate",
  e8PatientFacingExposure: "High",
};

describe("resolveRiskFactorVocabulary", () => {
  it("re-words a declared archetype's domain-bound factors", () => {
    const resolved = resolveRiskFactorVocabulary("governed_data_foundation");
    const labels = resolved.escalators.map((prompt) => prompt.label);
    expect(labels).toContain("E3 · Decision Authority");
    expect(labels).toContain("E8 · External-Facing Exposure");
    expect(labels).toContain("E1 · Regulated / Sensitive Data Exposure");
  });

  it("asks a declared archetype none of the clinical questions", () => {
    const resolved = resolveRiskFactorVocabulary("governed_data_foundation");
    const text = [...resolved.dimensions, ...resolved.escalators]
      .flatMap((prompt) => [
        prompt.label,
        prompt.question,
        "hint" in prompt ? prompt.hint : "",
      ])
      .join(" | ");
    // Each of these IS present in the shipped wording, which is the defect.
    expect(text).not.toMatch(/clinical/i);
    expect(text).not.toMatch(/patient/i);
    expect(text).not.toMatch(/PHI/);
  });

  it("keeps the shipped wording when nothing is declared", () => {
    for (const declared of [null, undefined, "", "   "]) {
      expect(resolveRiskFactorVocabulary(declared)).toBe(
        SHIPPED_RISK_FACTOR_VOCABULARY,
      );
    }
  });

  it("keeps the shipped wording for an archetype with no catalog entry", () => {
    expect(resolveRiskFactorVocabulary("contact_center_agent_assist")).toBe(
      SHIPPED_RISK_FACTOR_VOCABULARY,
    );
    expect(resolveRiskFactorVocabulary("not_an_archetype_at_all")).toBe(
      SHIPPED_RISK_FACTOR_VOCABULARY,
    );
  });

  it("still asks the clinical factors by their clinical names on the shipped set", () => {
    const labels = SHIPPED_RISK_FACTOR_VOCABULARY.escalators.map(
      (prompt) => prompt.label,
    );
    expect(labels).toContain("E3 · Clinical Decisioning");
    expect(labels).toContain("E8 · Patient-Facing Exposure");
  });

  it("resolves a declared id whatever its spelling", () => {
    const want = resolveRiskFactorVocabulary("governed_data_foundation");
    for (const spelling of [
      "GOVERNED_DATA_FOUNDATION",
      "Governed Data Foundation",
      "governed-data-foundation",
      "  governed_data_foundation  ",
    ]) {
      expect(resolveRiskFactorVocabulary(spelling)).toEqual(want);
    }
  });

  it("normalises a catalog key", () => {
    expect(archetypeVocabularyKey("Governed Data Foundation")).toBe(
      "governed_data_foundation",
    );
    expect(archetypeVocabularyKey(null)).toBe("");
    expect(archetypeVocabularyKey("--leading-and-trailing--")).toBe(
      "leading_and_trailing",
    );
  });

  it("asks exactly the thirteen factors, in one order, under every vocabulary", () => {
    const expectedDimensions = [
      "d1DataSensitivity",
      "d2HumanOversight",
      "d3IntegrationImpact",
      "d4BuildOrigin",
      "d5DomainBreadth",
    ];
    const expectedEscalators = [
      "e1PhiExposure",
      "e2AutonomousAction",
      "e3ClinicalDecisioning",
      "e4OrganizationReadiness",
      "e5CrossDomainIntegration",
      "e6PublicRegulatoryExposure",
      "e7BrandReputationRisk",
      "e8PatientFacingExposure",
    ];
    expect([...RISK_DIMENSION_KEYS]).toEqual(expectedDimensions);
    expect([...RISK_ESCALATOR_KEYS]).toEqual(expectedEscalators);

    const vocabularies = [
      resolveRiskFactorVocabulary(null),
      ...Object.keys(RISK_FACTOR_VOCABULARY_CATALOG).map((id) =>
        resolveRiskFactorVocabulary(id),
      ),
    ];
    expect(vocabularies.length).toBeGreaterThan(1);
    for (const vocabulary of vocabularies) {
      expect(vocabulary.dimensions.map((p) => p.key)).toEqual(
        expectedDimensions,
      );
      expect(vocabulary.escalators.map((p) => p.key)).toEqual(
        expectedEscalators,
      );
    }
  });

  it("gives every factor, under every vocabulary, a label, a question and (for a dimension) a hint", () => {
    for (const id of [null, ...Object.keys(RISK_FACTOR_VOCABULARY_CATALOG)]) {
      const vocabulary = resolveRiskFactorVocabulary(id);
      for (const prompt of vocabulary.dimensions) {
        expect(prompt.label.trim()).not.toBe("");
        expect(prompt.question.trim()).not.toBe("");
        expect(prompt.hint.trim()).not.toBe("");
      }
      for (const prompt of vocabulary.escalators) {
        expect(prompt.label.trim()).not.toBe("");
        expect(prompt.question.trim()).not.toBe("");
      }
    }
  });

  it("keeps a dimension's answer LEVELS fixed while re-wording its cases", () => {
    // The hint maps real-world cases onto Low/Moderate/High/Critical. A
    // vocabulary may rename the cases; it may not change which levels exist,
    // or the score would mean something different per archetype.
    for (const id of [null, ...Object.keys(RISK_FACTOR_VOCABULARY_CATALOG)]) {
      const vocabulary = resolveRiskFactorVocabulary(id);
      for (const prompt of vocabulary.dimensions) {
        const levels = [...prompt.hint.matchAll(/(Low|Moderate|High|Critical)\s*=/g)]
          .map((match) => match[1]);
        expect(levels).toEqual(["Low", "Moderate", "High", "Critical"]);
      }
    }
  });

  it("does not change the score — the same answers tier identically under every vocabulary", () => {
    const baseline = computeRiskTier(ANSWERED);
    for (const id of [null, ...Object.keys(RISK_FACTOR_VOCABULARY_CATALOG)]) {
      // Nothing in the vocabulary is an input to the model; resolving one must
      // not be able to move a band. Asserted so a later entry cannot smuggle
      // scoring into prompt text.
      resolveRiskFactorVocabulary(id);
      expect(computeRiskTier(ANSWERED)).toEqual(baseline);
    }
  });

  it("re-words a factor without dropping the fields it does not name", () => {
    const shipped = SHIPPED_RISK_FACTOR_VOCABULARY;
    const resolved = resolveRiskFactorVocabulary("governed_data_foundation");
    const overlay = RISK_FACTOR_VOCABULARY_CATALOG.governed_data_foundation;
    for (const [index, prompt] of resolved.escalators.entries()) {
      if (overlay[prompt.key]?.question) continue;
      expect(prompt.question).toBe(shipped.escalators[index].question);
    }
    // D1 is re-worded by its hint only — its label and question are shipped.
    const d1 = resolved.dimensions[0];
    expect(d1.label).toBe(shipped.dimensions[0].label);
    expect(d1.question).toBe(shipped.dimensions[0].question);
    expect(d1.hint).not.toBe(shipped.dimensions[0].hint);
  });

  it("does not mutate the shipped set when it resolves an overlay", () => {
    const before = JSON.stringify(SHIPPED_RISK_FACTOR_VOCABULARY);
    resolveRiskFactorVocabulary("governed_data_foundation");
    resolveRiskFactorVocabulary("governed_data_foundation");
    expect(JSON.stringify(SHIPPED_RISK_FACTOR_VOCABULARY)).toBe(before);
  });
});
