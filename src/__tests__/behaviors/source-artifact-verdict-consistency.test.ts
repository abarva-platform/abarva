jest.mock('server-only', () => ({}));

import { buildSourceJudgmentFromDealPack } from '@/lib/source/expert-judgment/source-judgment-kernel';
import { buildSourceCxoNarrativeReport } from '@/lib/source/exports/cxo-report/source-cxo-narrative-report';
import type { DealPackInput, DealPackStage } from '@/lib/source/exports/deal-pack/stage-sections';

const GENERATED_AT = '2026-05-20T12:00:00.000Z';

describe('Source artifact verdict consistency', () => {
  it('keeps the CXO report pinned to an award-ready kernel verdict before the later stage label can override it', () => {
    const input = makeAwardReadyEvaluationBafoInput();
    const judgment = buildSourceJudgmentFromDealPack(input);

    expect(judgment.verdict).toBe('award_ready');

    const report = buildSourceCxoNarrativeReport(input);

    expect(report.verdict).toBe('Award / proceed');
    expect(report.verdict).not.toMatch(/^Pending/);
    expect(report.slides.find((slide) => slide.kind === 'answer')?.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Verdict',
          value: 'Award / proceed',
          status: 'good',
        }),
      ]),
    );
  });
});

function makeAwardReadyEvaluationBafoInput(): DealPackInput {
  const selectionMemoBody =
    '# Award finalist with commercial guardrails\n\nContract controls are closed; proceed with signature controls.';
  return {
    tenantName: 'Fixture Retail',
    eventCode: 'FX-SRC-2026',
    eventName: 'Fixture Source Event',
    eventOwner: 'Fixture sourcing owner',
    eventStatus: 'Active',
    currentStageKey: 'selection',
    archetype: 'contact_center_ai',
    estimatedValueUsd: 4_200_000,
    generatedAt: GENERATED_AT,
    stages: [
      stage(0, 'Demand & Strategy', [
        narrative('dx0_demand_challenge', 'Demand Challenge', '# Validate the demand'),
      ]),
      stage(1, 'Sourcing Approach', [
        narrative('dx1_sourcing_approach', 'Sourcing Approach', '# Competitive rebid with retained controls'),
      ]),
      stage(2, 'Market Scan', [structured('dx2_market_scan', 'Market Scan', 'market-scan')]),
      stage(3, 'Scope & RFP', [
        narrative('d05_scope_memo', 'Scope Memo', '# Scope memo\n\nIn scope: routing and QA workflow.'),
        narrative('d09_rfp_pack', 'RFP Package', '# RFP package\n\nIssued to finalist suppliers.'),
      ]),
      stage(4, 'Response & Pricing', [
        structured('d19c_pricing_comparison', 'Pricing Comparison', 'pricing-comparison'),
        structured('dx4_tco_iceberg', 'TCO Iceberg', 'tco-iceberg'),
      ]),
      stage(5, 'Evaluation & BAFO', [
        structured('d16_scorecard', 'Evaluation Scorecard', 'scorecard'),
        narrative('d27_selection_memo', 'Selection Memo', selectionMemoBody),
      ]),
      stage(6, 'Risk & Contract Controls', [
        narrative('dx6b_vendor_risk_pack', 'Vendor Risk Pack', '# Vendor Risk\n\nAll controls closed.'),
      ]),
      stage(7, 'Renewal & Value Handoff', [missing('dx7_renewal_decision', 'Renewal Decision')]),
    ],
    artifactStates: [
      { artifactCode: 'd27_selection_memo', body: selectionMemoBody } as DealPackInput['artifactStates'][number],
    ],
    gateCriteria: [
      { criterionId: 'selection-ready', state: 'met' } as DealPackInput['gateCriteria'][number],
    ],
    evidence: [
      {
        requirementId: 'pricing-comparison',
        currentState: 'Usable Evidence',
        sourceArtifactId: 'd19c_pricing_comparison',
        notes: 'Supplier pricing normalized by tower and workload.',
      } as DealPackInput['evidence'][number],
    ],
    cssBlock: '',
  };
}

function stage(stageNo: number, title: string, artifacts: DealPackStage['artifacts']): DealPackStage {
  return {
    stage: stageNo,
    slug: `stage-${stageNo}`,
    title,
    intent: `Stage ${stageNo} decision intent`,
    artifacts,
  };
}

function narrative(code: string, title: string, body: string): DealPackStage['artifacts'][number] {
  return {
    code,
    title,
    kind: 'narrative',
    bodyIsAuthored: true,
    bodyMarkdown: body,
    bodyHtml: `<h1>${title}</h1>`,
  };
}

function structured(
  code: string,
  title: string,
  kind: NonNullable<DealPackStage['artifacts'][number]['structured']>['kind'],
): DealPackStage['artifacts'][number] {
  return {
    code,
    title,
    kind: 'structured',
    bodyIsAuthored: true,
    structured: {
      kind,
      payload: {} as never,
    },
  };
}

function missing(code: string, title: string): DealPackStage['artifacts'][number] {
  return {
    code,
    title,
    kind: 'missing',
    bodyIsAuthored: false,
    missingReason: 'Not recorded - seed gap',
  };
}
