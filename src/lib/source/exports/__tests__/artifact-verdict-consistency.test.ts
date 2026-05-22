// Source · artifact-consistency test.
//
// The mission: every Source artifact must show the SAME verdict, sourced
// from the one Source expert-judgment kernel. No artifact may say
// "Award / proceed" when the kernel holds the award.
//
// This suite builds ONE Source event whose kernel verdict is a hold
// (held selection memo + open P0 gate + incomplete pricing) and asserts
// the Deal Pack, CXO report, CXO HTML, CXO PPTX, the in-pack scorecard
// and the in-pack pricing comparison all agree with the kernel.

jest.mock('server-only', () => ({}));

import JSZip from 'jszip';

import {
  buildSourceJudgment,
  buildSourceJudgmentFromDealPack,
} from '../../expert-judgment/source-judgment-kernel';
import { sourceJudgmentVerdictLabel } from '../../expert-judgment/source-judgment-rules';
import { assembleDealPackHtml, type DealPackInput, type DealPackStage } from '../deal-pack/stage-sections';
import { buildSourceCxoNarrativeReport } from '../cxo-report/source-cxo-narrative-report';
import { renderSourceCxoNarrativeHtml } from '../cxo-report/source-cxo-narrative-html';
import { renderSourceCxoNarrativePptx } from '../cxo-report/source-cxo-narrative-pptx';

const GENERATED_AT = '2026-05-20T12:00:00.000Z';

/**
 * A Source event in a kernel-hold posture. The selection memo holds the
 * award, an evaluation gate is open, and a vendor left AI-module pricing
 * blank — so the kernel returns a hold verdict (proceed_to_bafo) with a
 * pricing blocker and a governance blocker.
 */
function makeHeldEventInput(): DealPackInput {
  const selectionMemoBody = [
    '# Selection Memo',
    '',
    'Selection status: pending. TaskFlow AI is provisional leader, not selected.',
    'Do not award yet until P0 legal clauses, telemetry evidence and missing',
    'pricing close.',
  ].join('\n');
  const pricingComparisonBody = [
    'WorkForceNow left AI module pricing blank. Pricing is incomplete and not',
    'comparable; cannot normalize as apples-to-apples until BAFO closes.',
  ].join('\n');
  return {
    tenantName: 'Apex Retail',
    eventCode: 'APX-CC-2026',
    eventName: 'Apex Retail Contact Center AI',
    eventOwner: 'Maya Chen, VP Customer Ops',
    eventStatus: 'Active',
    currentStageKey: 'selection',
    archetype: 'contact_center_ai',
    estimatedValueUsd: 4_200_000,
    generatedAt: GENERATED_AT,
    stages: [
      stage(0, 'Demand & Strategy', [
        narrative('dx0_demand_challenge', 'Demand Challenge', '# Validate the contact-center AI demand'),
      ]),
      stage(1, 'Sourcing Approach', [
        narrative('dx1_sourcing_approach', 'Sourcing Approach', '# Competitive rebid with retained controls'),
      ]),
      stage(2, 'Market Scan', [structured('dx2_market_scan', 'Market Scan', 'market-scan', true)]),
      stage(3, 'Scope & RFP', [
        narrative('d05_scope_memo', 'Scope Memo', '# Scope memo\n\nIn scope: routing, agent assist, QA.'),
        narrative('d09_rfp_pack', 'RFP Package', '# RFP package\n\nIssued to four suppliers.'),
      ]),
      stage(4, 'Response & Pricing', [
        structured('d19c_pricing_comparison', 'Pricing Comparison', 'pricing-comparison', true),
        structured('dx4_tco_iceberg', 'TCO Iceberg', 'tco-iceberg', false),
      ]),
      stage(5, 'Evaluation & BAFO', [
        structured('d16_scorecard', 'Evaluation Scorecard', 'scorecard', true),
        narrative('d27_selection_memo', 'Selection Memo', selectionMemoBody),
      ]),
      stage(6, 'Risk & Contract Controls', [
        narrative('dx6b_vendor_risk_pack', 'Vendor Risk Pack', `# Vendor Risk\n\n${pricingComparisonBody}`),
      ]),
      stage(7, 'Renewal & Value Handoff', [missing('dx7_renewal_decision', 'Renewal Decision')]),
    ],
    artifactStates: [
      { artifactCode: 'd27_selection_memo', body: selectionMemoBody } as DealPackInput['artifactStates'][number],
    ],
    gateCriteria: [
      { criterionId: 'selection-ready', state: 'not_met' } as DealPackInput['gateCriteria'][number],
    ],
    evidence: [
      {
        requirementId: 'pricing-comparison',
        currentState: 'Low Confidence',
        sourceArtifactId: 'd19c_pricing_comparison',
        notes: pricingComparisonBody,
      } as DealPackInput['evidence'][number],
    ],
    cssBlock: '',
  };
}

describe('Source artifact verdict consistency · kernel hold', () => {
  const input = makeHeldEventInput();
  const judgment = buildSourceJudgmentFromDealPack(input);

  it('the kernel itself returns a hold verdict for the held event', () => {
    expect(judgment.verdict).not.toBe('award_ready');
    expect(['do_not_award_yet', 'proceed_to_bafo', 'pause_for_evidence']).toContain(
      judgment.verdict,
    );
    expect(judgment.blockers.length).toBeGreaterThan(0);
  });

  it('the Deal Pack shows the hold verdict and NEVER renders Award / proceed', () => {
    const html = assembleDealPackHtml(input);
    const verdictLabel = sourceJudgmentVerdictLabel(judgment.verdict);

    // The headline carries the kernel hold verdict.
    expect(html).toContain(verdictLabel);
    expect(html).toContain('dp-headline--hold');
    // No award-ready / proceed language anywhere in the pack.
    expect(html).not.toContain('Award / proceed');
    expect(html).not.toMatch(/award-ready/i);
    expect(html).not.toMatch(/proceed with (controlled )?award/i);
    // Blockers, evidence gaps and a next action are all surfaced.
    expect(html).toContain('Open blockers');
    expect(html.toLowerCase()).toContain('evidence gap');
    expect(html).toContain('What would change the verdict');
    expect(html).toMatch(/Confidence/);
  });

  it('the CXO report carries the same kernel verdict string', () => {
    const report = buildSourceCxoNarrativeReport(input);
    expect(report.verdict).toBe(sourceJudgmentVerdictLabel(judgment.verdict));
    expect(JSON.stringify(report)).not.toContain('Award / proceed');
  });

  it('the CXO HTML carries the same verdict string as the report', () => {
    const report = buildSourceCxoNarrativeReport(input);
    const html = renderSourceCxoNarrativeHtml(report);
    expect(html).toContain(report.verdict);
    expect(html).not.toContain('Award / proceed');
  });

  it('the CXO PPTX carries the same verdict string as the report', async () => {
    const report = buildSourceCxoNarrativeReport(input);
    const buffer = await renderSourceCxoNarrativePptx(report);
    const text = await extractPptxText(buffer);
    // The cover slide renders report.verdict.toUpperCase().
    expect(text).toContain(report.verdict.toUpperCase());
    expect(text).not.toContain('AWARD / PROCEED');
  });

  it('the in-pack scorecard surfaces the hold + blockers, not award-readiness', () => {
    const html = assembleDealPackHtml(input);
    // The scorecard renders within Stage 5; the kernel verdict banner
    // appears so a top-scoring vendor cannot read as a go.
    expect(html).toContain(`Kernel verdict: ${sourceJudgmentVerdictLabel(judgment.verdict)}`);
    expect(html).toMatch(/holds the award/);
    expect(html).toMatch(/not decision-ready/);
  });

  it('the in-pack pricing comparison flags incomplete / non-comparable pricing', () => {
    const html = assembleDealPackHtml(input);
    expect(html).toMatch(/Pricing is incomplete \/ not comparable/);
    expect(html).toMatch(/not decision-ready/);
    expect(html).toMatch(/Do not present these figures as an apples-to-apples/);
  });

  it('every artifact agrees: one verdict, sourced from one kernel', () => {
    const report = buildSourceCxoNarrativeReport(input);
    const dealPackHtml = assembleDealPackHtml(input);
    const cxoHtml = renderSourceCxoNarrativeHtml(report);
    const verdictLabel = sourceJudgmentVerdictLabel(judgment.verdict);

    // The report verdict, the deal pack headline and the CXO HTML all
    // carry the SAME verdict string.
    expect(report.verdict).toBe(verdictLabel);
    expect(dealPackHtml).toContain(verdictLabel);
    expect(cxoHtml).toContain(verdictLabel);
    // None of them say award / proceed.
    for (const artifact of [dealPackHtml, cxoHtml, JSON.stringify(report)]) {
      expect(artifact).not.toContain('Award / proceed');
    }
  });
});

describe('Source artifact verdict consistency · kernel award-ready', () => {
  it('an award-ready event reads consistently as Award / proceed', () => {
    const input = makeAwardReadyInput();
    const judgment = buildSourceJudgmentFromDealPack(input);
    expect(judgment.verdict).toBe('award_ready');

    const report = buildSourceCxoNarrativeReport(input);
    expect(report.verdict).toBe('Award / proceed');

    const dealPackHtml = assembleDealPackHtml(input);
    // The award-ready deal pack does NOT carry a hold banner.
    expect(dealPackHtml).not.toContain('dp-headline--hold');
  });
});

function makeAwardReadyInput(): DealPackInput {
  const base = makeHeldEventInput();
  const cleanSelectionMemo = '# Award Acme with commercial guardrails\n\nContract controls are closed; proceed with signature controls.';
  return {
    ...base,
    currentStageKey: 'selection',
    stages: base.stages.map((s) =>
      s.stage === 5
        ? {
            ...s,
            artifacts: [
              structured('d16_scorecard', 'Evaluation Scorecard', 'scorecard', true),
              narrative('d27_selection_memo', 'Selection Memo', cleanSelectionMemo),
            ],
          }
        : s.stage === 6
          ? { ...s, artifacts: [narrative('dx6b_vendor_risk_pack', 'Vendor Risk Pack', '# Vendor Risk\n\nAll controls closed.')] }
          : s.stage === 4
            ? {
                ...s,
                artifacts: [
                  structured('d19c_pricing_comparison', 'Pricing Comparison', 'pricing-comparison', true),
                  structured('dx4_tco_iceberg', 'TCO Iceberg', 'tco-iceberg', true),
                ],
              }
            : s,
    ),
    artifactStates: [
      { artifactCode: 'd27_selection_memo', body: cleanSelectionMemo } as DealPackInput['artifactStates'][number],
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
  };
}

describe('kernel hold verdict drives the held fixture', () => {
  it('isolated kernel call agrees with the from-deal-pack call', () => {
    const input = makeHeldEventInput();
    const fromDealPack = buildSourceJudgmentFromDealPack(input);
    const direct = buildSourceJudgment({
      eventName: input.eventName,
      eventCode: input.eventCode,
      currentStageKey: input.currentStageKey,
      eventOwner: input.eventOwner,
      estimatedValueUsd: input.estimatedValueUsd,
      artifacts: input.stages.flatMap((s) =>
        s.artifacts.map((a) => ({
          code: a.code,
          title: a.title,
          body:
            a.kind === 'narrative'
              ? a.bodyMarkdown
              : input.artifactStates.find((st) => st.artifactCode === a.code)?.body ?? '',
          bodyIsAuthored: a.bodyIsAuthored,
          kind: a.kind,
        })),
      ),
      gateCriteria: input.gateCriteria.map((g) => ({ criterionId: g.criterionId, state: g.state })),
      evidence: input.evidence.map((e) => ({
        requirementId: e.requirementId,
        currentState: e.currentState,
        sourceArtifactId: e.sourceArtifactId,
        notes: e.notes,
      })),
    });
    expect(fromDealPack.verdict).toBe(direct.verdict);
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name),
  );
  const parts = await Promise.all(
    slideFiles.map((name) => zip.files[name]!.async('string')),
  );
  return parts.join('\n');
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

function narrative(code: string, title: string, body: string | null): DealPackStage['artifacts'][number] {
  return {
    code,
    title,
    kind: 'narrative',
    bodyIsAuthored: Boolean(body),
    bodyMarkdown: body ?? '',
    bodyHtml: body ? `<h1>${title}</h1>` : '',
  };
}

function structured(
  code: string,
  title: string,
  kind: NonNullable<DealPackStage['artifacts'][number]['structured']>['kind'],
  authored: boolean,
): DealPackStage['artifacts'][number] {
  return {
    code,
    title,
    kind: 'structured',
    bodyIsAuthored: authored,
    structured: makeStructuredCarrier(kind),
  };
}

function makeStructuredCarrier(
  kind: NonNullable<DealPackStage['artifacts'][number]['structured']>['kind'],
): NonNullable<DealPackStage['artifacts'][number]['structured']> {
  // Minimal but valid payloads so the in-pack renderers exercise their
  // real code paths (scorecard + pricing comparison especially).
  if (kind === 'scorecard') {
    return {
      kind: 'scorecard',
      payload: {
        tenantName: 'Apex Retail',
        eventCode: 'APX-CC-2026',
        eventName: 'Apex Retail Contact Center AI',
        generatedAt: GENERATED_AT,
        roundLabel: 'Initial · pre-BAFO',
        criteria: [
          { id: 'C-FIT', label: 'Functional fit', weightPercent: 50, description: 'Coverage of scope.' },
          { id: 'C-RISK', label: 'Risk profile', weightPercent: 50, description: 'Trap log + stability.' },
        ],
        vendors: ['TaskFlow AI', 'WorkForceNow'],
        scoreGuidance: [
          { score: 1, label: 'Does not meet', rubric: 'Material gap.' },
          { score: 5, label: 'Best in class', rubric: 'Differentiated.' },
        ],
      },
    };
  }
  if (kind === 'pricing-comparison') {
    return {
      kind: 'pricing-comparison',
      payload: {
        tenantName: 'Apex Retail',
        eventCode: 'APX-CC-2026',
        eventName: 'Apex Retail Contact Center AI',
        generatedAt: GENERATED_AT,
        lineItems: [
          { id: 'L-CORE', category: 'Platform', description: 'Core platform', unit: 'seat', annualQuantity: 1200 },
          { id: 'L-AI', category: 'AI module', description: 'AI agent-assist module', unit: 'seat', annualQuantity: 1200 },
        ],
        assumptions: [{ key: 'Term', value: '3 years' }],
        escalator: 0.04,
        tcoYears: 3,
        submissions: [
          {
            vendorName: 'TaskFlow AI',
            submittedAt: GENERATED_AT,
            unitPricesById: { 'L-CORE': 240, 'L-AI': 90 },
            pricingNotes: '',
            assumptionDeviations: [],
          },
          {
            // WorkForceNow left the AI module blank — incomplete pricing.
            vendorName: 'WorkForceNow',
            submittedAt: GENERATED_AT,
            unitPricesById: { 'L-CORE': 220 },
            pricingNotes: 'AI module pricing pending.',
            assumptionDeviations: [],
          },
        ],
      },
    };
  }
  if (kind === 'tco-iceberg') {
    return {
      kind: 'tco-iceberg',
      payload: {
        tenantName: 'Apex Retail',
        eventCode: 'APX-CC-2026',
        eventName: 'Apex Retail Contact Center AI',
        generatedAt: GENERATED_AT,
        currency: 'USD',
        layers: [],
        definitions: [],
      },
    };
  }
  // market-scan
  return {
    kind: 'market-scan',
    payload: {
      tenantName: 'Apex Retail',
      eventCode: 'APX-CC-2026',
      eventName: 'Apex Retail Contact Center AI',
      generatedAt: GENERATED_AT,
      vendors: [],
      capabilities: [],
      rates: [],
      industrySignals: [],
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
