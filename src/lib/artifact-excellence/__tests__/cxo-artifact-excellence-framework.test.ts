import {
  createCxoArtifactStandard,
  scoreCxoArtifactExcellence,
  type CxoArtifactExcellenceSignals,
} from '../cxo-artifact-excellence-framework';

const BUSINESS_CASE_STANDARD = createCxoArtifactStandard({
  module: 'moves',
  artifactKind: 'business_case_pack',
  title: 'Business Case Pack',
  audience: 'CXO, CFO, board/ELT',
  decisionJob: 'Decide whether to fund, reshape or kill an AI/transformation bet.',
  requiredSections: ['answer', 'why_now', 'evidence', 'economics', 'risk', 'asks'],
  requiredExhibits: [
    'decision_card',
    'value_investment_bridge',
    'sensitivity_stack',
    'scenario_range',
    'evidence_gap_matrix',
  ],
  requiredEvidence: ['tenant_baseline', 'rate_card', 'assumption_ledger'],
  financialArtifact: true,
  architectureArtifact: false,
  riskArtifact: true,
});

describe('CXO artifact excellence framework', () => {
  it('passes a board-grade artifact only when the storyline, exhibits, evidence and governance are complete', () => {
    const score = scoreCxoArtifactExcellence(makeSignals(), BUSINESS_CASE_STANDARD);

    expect(score.passed).toBe(true);
    expect(score.score).toBeGreaterThanOrEqual(90);
    expect(score.hardFailures).toEqual([]);
    expect(score.missingExhibits).toEqual([]);
  });

  it('hard-fails a business case without sensitivity even if other signals are strong', () => {
    const score = scoreCxoArtifactExcellence(makeSignals({ hasSensitivity: false }), BUSINESS_CASE_STANDARD);

    expect(score.passed).toBe(false);
    expect(score.hardFailures).toContain('missing_sensitivity');
    expect(score.score).toBeLessThan(score.threshold);
  });

  it('hard-fails financial claims that are not grounded and ranged', () => {
    const score = scoreCxoArtifactExcellence(
      makeSignals({ financialClaimsAreGrounded: false, financialClaimsAreRanged: false }),
      BUSINESS_CASE_STANDARD,
    );

    expect(score.hardFailures).toContain('ungrounded_financial_claim');
    expect(score.recommendations).toContain('Close hard fail: ungrounded_financial_claim.');
  });

  it('hard-fails visible placeholder language', () => {
    const score = scoreCxoArtifactExcellence(
      makeSignals({ text: 'Executive answer is TBD after the team fills the placeholder.' }),
      BUSINESS_CASE_STANDARD,
    );

    expect(score.hardFailures).toContain('visible_placeholder_language');
    expect(score.passed).toBe(false);
  });

  it('keeps architecture artifacts from passing without a visual decision exhibit', () => {
    const architectureStandard = createCxoArtifactStandard({
      module: 'moves',
      artifactKind: 'solution_architecture_pack',
      title: 'Solution Architecture Pack',
      audience: 'CIO, enterprise architect, delivery lead',
      decisionJob: 'Select the architecture option and delivery boundary.',
      requiredSections: ['answer', 'options', 'architecture', 'controls', 'asks'],
      requiredExhibits: ['decision_card', 'options_comparison', 'risk_control_heatmap'],
      requiredEvidence: ['tenant_architecture', 'data_sources'],
      financialArtifact: false,
      architectureArtifact: true,
      riskArtifact: true,
    });

    const score = scoreCxoArtifactExcellence(
      makeSignals({
        artifactKind: 'solution_architecture_pack',
        exhibitFamilies: ['decision_card', 'risk_control_heatmap'],
        evidenceIds: ['tenant_architecture', 'data_sources'],
        sectionIds: ['answer', 'options', 'architecture', 'controls', 'asks'],
      }),
      architectureStandard,
    );

    expect(score.passed).toBe(false);
    expect(score.hardFailures).toContain('missing_architecture_visual');
    expect(score.missingExhibits).toContain('options_comparison');
  });
});

function makeSignals(
  overrides: Partial<CxoArtifactExcellenceSignals> = {},
): CxoArtifactExcellenceSignals {
  return {
    module: 'moves',
    artifactKind: 'business_case_pack',
    circulationLevel: 'board_circulation',
    sectionIds: ['answer', 'why_now', 'evidence', 'economics', 'risk', 'asks'],
    exhibitFamilies: [
      'decision_card',
      'value_investment_bridge',
      'sensitivity_stack',
      'scenario_range',
      'evidence_gap_matrix',
    ],
    evidenceIds: ['tenant_baseline', 'rate_card', 'assumption_ledger'],
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
    text:
      'Fund only after the cost-per-contact evidence gap is closed. The case includes evidence, range, sensitivity, owner, risk controls and measurement handoff.',
    ...overrides,
  };
}
