import {
  getSourceArtifactStandard,
  scoreSourceArtifactQuality,
  type SourceArtifactQualitySignals,
} from '../artifact-standards';

const RENEWAL_COMPLETE: SourceArtifactQualitySignals = {
  kind: 'renewal-decision',
  sectionIds: [
    'renewal_answer',
    'timing_and_leverage',
    'usage_and_value',
    'spend_and_uplift',
    'overlap_and_rationalization',
    'risk_and_dependency',
    'negotiation_posture',
    'srm_tower_handoff',
  ],
  visualIds: [
    'renewal_decision_card',
    'renewal_timeline',
    'usage_vs_license_chart',
    'spend_uplift_bridge',
    'overlap_matrix',
    'renewal_risk_table',
    'negotiation_posture_table',
    'srm_action_queue',
  ],
  evidenceIds: [
    'vendor_contracts',
    'notice_terms',
    'usage_telemetry',
    'benchmark',
    'owner',
    'human_decision_owner',
    'ai_decision_attestation',
  ],
  text: 'Renegotiate ServiceNow before notice deadline.',
};

describe('Source artifact standards', () => {
  it('defines standards for the current Source deliverable catalog', () => {
    const standard = getSourceArtifactStandard('renewal-decision');
    expect(standard.title).toBe('Renewal Decision');
    expect(standard.requiredSections.map((s) => s.id)).toContain('negotiation_posture');
    expect(standard.requiredVisuals.map((v) => v.id)).toContain('spend_uplift_bridge');
    expect(standard.requiredEvidence.map((e) => e.id)).toContain('benchmark');
  });

  it('scores a complete renewal artifact above the minimum bar', () => {
    const score = scoreSourceArtifactQuality(RENEWAL_COMPLETE);
    expect(score.passed).toBe(true);
    expect(score.score).toBeGreaterThanOrEqual(82);
    expect(score.hardFailures).toEqual([]);
  });

  it('lets hard failures override otherwise high scores', () => {
    const score = scoreSourceArtifactQuality({
      ...RENEWAL_COMPLETE,
      sectionIds: RENEWAL_COMPLETE.sectionIds.filter((id) => id !== 'timing_and_leverage'),
      visualIds: RENEWAL_COMPLETE.visualIds.filter((id) => id !== 'renewal_timeline'),
      dimensionScores: {
        executiveClarity: 100,
        evidenceGrounding: 100,
        financialDefensibility: 100,
        expertChallenge: 100,
        visualUsefulness: 100,
        actionability: 100,
        formattingReadability: 100,
        auditability: 100,
      },
    });
    expect(score.passed).toBe(false);
    expect(score.hardFailures).toContain('missing_timing');
    expect(score.score).toBeLessThan(82);
  });

  it('fails a renewal decision without usage/value evidence', () => {
    const score = scoreSourceArtifactQuality({
      ...RENEWAL_COMPLETE,
      sectionIds: RENEWAL_COMPLETE.sectionIds.filter((id) => id !== 'usage_and_value'),
      evidenceIds: RENEWAL_COMPLETE.evidenceIds.filter((id) => id !== 'usage_telemetry'),
    });
    expect(score.passed).toBe(false);
    expect(score.hardFailures).toContain('missing_usage');
    expect(score.missingEvidence).toContain('usage_telemetry');
  });

  it('flags draft scaffold text as a hard fail', () => {
    const score = scoreSourceArtifactQuality({
      ...RENEWAL_COMPLETE,
      text: `${['T', 'BD'].join('')} draft scaffold for renewal decision.`,
    });
    expect(score.passed).toBe(false);
    expect(score.hardFailures).toContain('blank_or_lorem');
  });

  it('requires visuals for generic consulting artifacts too', () => {
    const score = scoreSourceArtifactQuality({
      kind: 'decision-brief',
      sectionIds: ['answer', 'evidence', 'analysis', 'challenge', 'next_actions'],
      visualIds: ['decision_summary', 'evidence_table'],
      evidenceIds: [
        'tenant_substrate',
        'source_methodology',
        'human_decision_owner',
        'ai_decision_attestation',
      ],
      text: 'Award Supplier A because the normalized evidence supports the tradeoff.',
    });
    expect(score.passed).toBe(false);
    expect(score.missingVisuals).toContain('risk_or_tradeoff_view');
  });

  it('requires human decision accountability for decision-bearing artifacts', () => {
    const score = scoreSourceArtifactQuality({
      kind: 'decision-brief',
      sectionIds: ['answer', 'evidence', 'analysis', 'challenge', 'next_actions'],
      visualIds: ['decision_summary', 'evidence_table', 'risk_or_tradeoff_view'],
      evidenceIds: ['tenant_substrate', 'source_methodology'],
      text: 'Recommend Supplier A as a candidate path for review.',
    });

    expect(score.passed).toBe(false);
    expect(score.hardFailures).toContain('missing_human_decision_accountability');
    expect(score.missingEvidence).toEqual(expect.arrayContaining([
      'human_decision_owner',
      'ai_decision_attestation',
    ]));
  });
});
