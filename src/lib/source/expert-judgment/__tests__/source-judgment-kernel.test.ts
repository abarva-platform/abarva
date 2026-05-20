import { buildSourceJudgment } from '../source-judgment-kernel';
import type { SourceJudgmentInput } from '../source-judgment-types';

describe('Source expert judgment kernel', () => {
  it('holds award when a selection memo is pending and gates remain blocked', () => {
    const judgment = buildSourceJudgment(
      makeInput({
        selectionMemo:
          'Selection status: pending. TaskFlow AI is provisional leader, not selected. Do not award yet until P0 legal clauses and telemetry evidence close.',
        gates: [{ criterionId: 'legal-ai-terms', state: 'not_met' }],
      }),
    );

    expect(judgment.verdict).toBe('do_not_award_yet');
    expect(judgment.blockers.map((blocker) => blocker.domain)).toContain('governance');
    expect(judgment.executiveSummary).toMatch(/do not award yet/i);
    expect(judgment.whatWouldChangeTheVerdict.join(' ')).toMatch(/p0 legal/i);
  });

  it('prevents cheapest vendor from winning when P0 telemetry rights remain open', () => {
    const judgment = buildSourceJudgment(
      makeInput({
        selectionMemo: 'BlueYonder is cheapest and should be considered.',
        riskArtifact:
          'BlueYonder is the cheapest vendor, but legal flagged telemetry model-improvement rights as a P0 data-rights blocker.',
      }),
    );

    expect(judgment.verdict).not.toBe('award_ready');
    expect(judgment.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'P0',
          domain: 'ai_data_rights',
        }),
      ]),
    );
    expect(judgment.challengedAssumptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assumption: expect.stringMatching(/lowest price/i),
        }),
      ]),
    );
  });

  it('blocks apples-to-apples normalization when vendor pricing is incomplete', () => {
    const judgment = buildSourceJudgment(
      makeInput({
        selectionMemo: 'Vendor field is ready for comparison.',
        pricingArtifact:
          'WorkForceNow left AI module pricing blank. Pricing is incomplete and not comparable; cannot normalize as apples-to-apples.',
      }),
    );

    expect(judgment.verdict).toBe('proceed_to_bafo');
    expect(judgment.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: 'pricing',
          description: expect.stringMatching(/incomplete|not comparable/i),
        }),
      ]),
    );
    expect(judgment.evidenceGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blocksDecision: true,
          gap: expect.stringMatching(/pricing/i),
        }),
      ]),
    );
  });

  it('downgrades challenged pilot savings instead of treating them as base case', () => {
    const judgment = buildSourceJudgment(
      makeInput({
        selectionMemo: 'Selection is still under review.',
        economicsArtifact:
          'Last year pilot savings were 11.4%, but the pilot excluded union stores and holiday weeks. CFO says savings above 6% are upside only, not base case.',
      }),
    );

    expect(judgment.verdict).not.toBe('award_ready');
    expect(judgment.challengedAssumptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assumption: expect.stringMatching(/pilot savings/i),
          sensitivity: 'high',
        }),
      ]),
    );
  });

  it('treats renewal urgency as action priority, not governance override', () => {
    const judgment = buildSourceJudgment(
      makeInput({
        selectionMemo: 'The renewal deadline is close and the notice window closes in 13 days. Selection status: pending.',
        riskArtifact: 'P0 audit rights blocker remains unresolved.',
      }),
    );

    expect(judgment.verdict).toBe('do_not_award_yet');
    expect(judgment.nextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: expect.stringMatching(/renewal notice window/i),
          urgency: 'now',
        }),
      ]),
    );
  });

  it('allows award readiness only when memo is affirmative and blockers are absent', () => {
    const judgment = buildSourceJudgment(
      makeInput({
        selectionMemo: 'Award Acme with commercial guardrails. Legal, pricing and transition controls are closed.',
        gates: [{ criterionId: 'selection-ready', state: 'met' }],
      }),
    );

    expect(judgment.verdict).toBe('award_ready');
    expect(judgment.blockers).toHaveLength(0);
  });
});

function makeInput(
  overrides: {
    selectionMemo?: string;
    riskArtifact?: string;
    pricingArtifact?: string;
    economicsArtifact?: string;
    gates?: SourceJudgmentInput['gateCriteria'];
  } = {},
): SourceJudgmentInput {
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
        body: overrides.selectionMemo ?? 'Selection status: pending. No award is approved.',
        bodyIsAuthored: true,
        kind: 'narrative',
      },
      {
        code: 'dx6a_ai_clause_gap',
        title: 'AI Clause Gap',
        body: overrides.riskArtifact ?? '',
        bodyIsAuthored: Boolean(overrides.riskArtifact),
        kind: 'narrative',
      },
      {
        code: 'd19c_pricing_comparison',
        title: 'Pricing Comparison',
        body: overrides.pricingArtifact ?? '',
        bodyIsAuthored: Boolean(overrides.pricingArtifact),
        kind: 'narrative',
      },
      {
        code: 'dx4_tco_iceberg',
        title: 'TCO and Savings Evidence',
        body: overrides.economicsArtifact ?? '',
        bodyIsAuthored: Boolean(overrides.economicsArtifact),
        kind: 'narrative',
      },
    ],
    gateCriteria: overrides.gates ?? [],
    evidence: [
      {
        requirementId: 'legal-ai-terms',
        currentState: overrides.riskArtifact ? 'Usable evidence' : 'Not recorded - seed gap',
        sourceArtifactId: 'dx6a_ai_clause_gap',
        notes: overrides.riskArtifact ?? null,
      },
      {
        requirementId: 'pricing-comparability',
        currentState: overrides.pricingArtifact ? 'Needs remediation' : 'Not recorded - seed gap',
        sourceArtifactId: 'd19c_pricing_comparison',
        notes: overrides.pricingArtifact ?? null,
      },
    ],
  };
}
