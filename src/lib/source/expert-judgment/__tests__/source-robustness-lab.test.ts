import {
  SOURCE_ROBUSTNESS_HARD_QUESTIONS,
  scoreSourceRobustness,
} from '../source-robustness-lab';
import type { SourceJudgmentInput } from '../source-judgment-types';

describe('Source robustness lab', () => {
  it('hard-fails the pre-fix contradiction where an artifact says award while the kernel holds', () => {
    const score = scoreSourceRobustness({
      scenario: apexHardCase(),
      artifactTexts: {
        cxoReport: 'Verdict: Award / proceed. BlueYonder is cheapest. Use the 11.4% pilot savings as base case.',
      },
      hardQuestions: SOURCE_ROBUSTNESS_HARD_QUESTIONS as unknown as string[],
    });

    expect(score.overall).toBeLessThan(7);
    expect(score.hardFailures).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Award \/ proceed/),
      ]),
    );
  });

  it('passes the post-fix Apex hard case above the minimum bar', () => {
    const score = scoreSourceRobustness({
      scenario: apexHardCase(),
      artifactTexts: {
        cxoReport:
          'Verdict: Do not award yet. Proceed to targeted BAFO. Close P0 telemetry model-improvement rights, incomplete WorkForceNow AI module pricing, and challenged savings evidence before award.',
        dealPack:
          'Pricing is not apples-to-apples until missing AI module prices are resubmitted. The 11.4% pilot savings are upside only because the pilot excluded union stores and holiday weeks.',
      },
      hardQuestions: SOURCE_ROBUSTNESS_HARD_QUESTIONS as unknown as string[],
    });

    expect(score.hardFailures).toEqual([]);
    expect(score.overall).toBeGreaterThanOrEqual(8);
    expect(score.categories.artifactConsistency).toBeGreaterThanOrEqual(8);
    expect(score.categories.conversationalQuality).toBeGreaterThanOrEqual(8);
  });
});

function apexHardCase(): SourceJudgmentInput {
  return {
    eventName: 'Apex Store Ops AI Scheduling Platform Sourcing',
    eventCode: 'APX-STOREOPS-AI-E2E',
    currentStageKey: 'selection',
    eventOwner: 'Apex VP Sourcing',
    estimatedValueUsd: 6_900_000,
    artifacts: [
      {
        code: 'd27_selection_memo',
        title: 'Selection Memo',
        body: 'Selection status: pending. TaskFlow AI is provisional leader, not selected. Do not award yet until P0 legal clauses and telemetry evidence close.',
        bodyIsAuthored: true,
        kind: 'narrative',
      },
      {
        code: 'dx6a_ai_clause_gap',
        title: 'AI Clause Gap',
        body: 'BlueYonder is cheapest, but telemetry model-improvement rights are a P0 legal/data-rights blocker.',
        bodyIsAuthored: true,
        kind: 'narrative',
      },
      {
        code: 'd19c_pricing_comparison',
        title: 'Pricing Comparison',
        body: 'WorkForceNow left AI module pricing blank; pricing is incomplete and non-comparable.',
        bodyIsAuthored: true,
        kind: 'narrative',
      },
      {
        code: 'dx4_tco_iceberg',
        title: 'TCO and Savings Evidence',
        body: 'Prior pilot showed 11.4% savings but excluded union stores and holiday weeks. CFO says above 6% is upside only.',
        bodyIsAuthored: true,
        kind: 'narrative',
      },
    ],
    gateCriteria: [{ criterionId: 'legal-ai-terms', state: 'not_met' }],
    evidence: [
      {
        requirementId: 'legal-ai-terms',
        currentState: 'Usable evidence',
        sourceArtifactId: 'dx6a_ai_clause_gap',
        notes: 'P0 telemetry model-improvement rights blocker.',
      },
      {
        requirementId: 'pricing-comparability',
        currentState: 'Needs remediation',
        sourceArtifactId: 'd19c_pricing_comparison',
        notes: 'Missing AI module pricing blocks apples-to-apples comparison.',
      },
    ],
  };
}
