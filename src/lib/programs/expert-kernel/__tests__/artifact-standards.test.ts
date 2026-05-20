import {
  ARTIFACT_STANDARDS,
  SOLUTION_ARCHITECTURE_STANDARD,
  assertArtifactStandardsComplete,
  listArtifactStandards,
} from '../artifact-standards';
import {
  buildCurrentGeneratedArtifactQualitySignals,
  scoreArtifactAgainstStandard,
  scoreCurrentGeneratedArtifacts,
} from '../artifact-quality-rubric';
import { KERNEL_ARTIFACTS } from '../exports/artifact-catalog';

describe('Moves artifact gold-standard catalog', () => {
  it('defines exactly one standard for each kernel artifact', () => {
    expect(() => assertArtifactStandardsComplete()).not.toThrow();
    expect(Object.keys(ARTIFACT_STANDARDS).sort()).toEqual(
      KERNEL_ARTIFACTS.map((artifact) => artifact.id).sort(),
    );
    expect(listArtifactStandards()).toHaveLength(6);
  });

  it('makes every standard decision-oriented and enforceable', () => {
    for (const standard of listArtifactStandards()) {
      expect(standard.audiences.length).toBeGreaterThan(0);
      expect(standard.decisionJob.length).toBeGreaterThan(20);
      expect(standard.requiredSections.length).toBeGreaterThanOrEqual(6);
      expect(standard.requiredVisuals.length).toBeGreaterThanOrEqual(4);
      expect(standard.requiredEvidence.length).toBeGreaterThanOrEqual(3);
      expect(standard.hardFailRules.length).toBeGreaterThanOrEqual(4);
      expect(standard.minimumAcceptableScore).toBeGreaterThanOrEqual(8.5);
      expect(standard.boardReadyScore).toBeGreaterThanOrEqual(9);
    }
  });

  it('scores the current generated artifact signals without fabricating a pass', () => {
    const scores = scoreCurrentGeneratedArtifacts();

    expect(scores.map((score) => score.artifactId)).toEqual(
      KERNEL_ARTIFACTS.map((artifact) => artifact.id),
    );
    expect(scores.every((score) => Number.isFinite(score.score))).toBe(true);
    expect(scores.some((score) => score.missingVisuals.length > 0)).toBe(true);
    expect(
      scores.find((score) => score.artifactId === 'business_case_pack')
        ?.hardFailures.map((failure) => failure.ruleId),
    ).toContain('missing_architecture_diagram');
  });

  it('requires consulting-grade financial exhibits for C-suite artifacts', () => {
    expect(ARTIFACT_STANDARDS.business_case_pack.requiredVisuals).toEqual(
      expect.arrayContaining([
        'value_vs_investment_chart',
        'investment_vs_return_waterfall',
        'sensitivity_tornado',
        'payback_range_curve',
      ]),
    );
    expect(ARTIFACT_STANDARDS.financial_model.requiredVisuals).toEqual(
      expect.arrayContaining([
        'workstream_cost_stack',
        'sensitivity_tornado',
        'payback_range_curve',
        'rate_card_source_table',
      ]),
    );
    expect(ARTIFACT_STANDARDS.cfo_pack.requiredVisuals).toEqual(
      expect.arrayContaining([
        'executive_economics_card',
        'investment_vs_return_waterfall',
        'sensitivity_tornado',
        'payback_range_curve',
      ]),
    );
  });
});

describe('Moves artifact quality rubric', () => {
  it('caps the score when a hard fail is present', () => {
    const signals = buildCurrentGeneratedArtifactQualitySignals('cfo_pack');
    const score = scoreArtifactAgainstStandard({
      ...signals,
      hasRecommendation: false,
      presentVisuals: [...ARTIFACT_STANDARDS.cfo_pack.requiredVisuals],
      presentEvidence: [...ARTIFACT_STANDARDS.cfo_pack.requiredEvidence],
      hasSensitivity: true,
      hasDownsideCase: true,
      hasDoNotFundYet: true,
      hasTowerHandoff: true,
    });

    expect(score.uncappedScore).toBeGreaterThan(8);
    expect(score.score).toBeLessThanOrEqual(7.4);
    expect(score.verdict).toBe('hard_fail');
    expect(score.hardFailures.map((failure) => failure.ruleId)).toContain(
      'missing_recommendation',
    );
  });

  it('hard-fails a business case without sensitivity', () => {
    const signals = buildCurrentGeneratedArtifactQualitySignals('business_case_pack');
    const score = scoreArtifactAgainstStandard({
      ...signals,
      presentVisuals: [...ARTIFACT_STANDARDS.business_case_pack.requiredVisuals],
      presentEvidence: [
        ...ARTIFACT_STANDARDS.business_case_pack.requiredEvidence,
      ],
      hasArchitectureDiagram: true,
      hasSensitivity: false,
      hasDownsideCase: true,
      hasRateCardBasis: true,
    });

    expect(score.hardFailures.map((failure) => failure.ruleId)).toContain(
      'missing_sensitivity',
    );
    expect(score.improvementRecommendations).toContain(
      'Add base/conservative/upside sensitivity and the assumptions that move each case.',
    );
  });

  it('hard-fails a solution architecture standard without a diagram', () => {
    const score = scoreArtifactAgainstStandard(
      {
        artifactId: 'solution_architecture_pack',
        presentSections: [...SOLUTION_ARCHITECTURE_STANDARD.requiredSections],
        presentVisuals: ['integration_map', 'control_overlay'],
        presentEvidence: [...SOLUTION_ARCHITECTURE_STANDARD.requiredEvidence],
        hasRecommendation: true,
        hasArchitectureDiagram: false,
        hasFabricatedMetric: false,
        hasUncitedFinancialNumber: false,
        hasSeedGapDisclosure: true,
        hasAssumptionOwners: true,
        formattingReadable: true,
        auditTrailVisible: true,
      },
      SOLUTION_ARCHITECTURE_STANDARD,
    );

    expect(score.score).toBeLessThanOrEqual(7.4);
    expect(score.hardFailures.map((failure) => failure.ruleId)).toContain(
      'missing_architecture_diagram',
    );
    expect(score.missingVisuals).toEqual(
      expect.arrayContaining([
        'architecture_context_diagram',
        'logical_architecture_diagram',
        'data_flow_diagram',
        'build_buy_boundary_view',
      ]),
    );
  });
});
