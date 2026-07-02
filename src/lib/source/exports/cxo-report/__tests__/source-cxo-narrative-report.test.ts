jest.mock('server-only', () => ({}));

import JSZip from 'jszip';

import type { DealPackInput, DealPackStage } from '../../deal-pack/stage-sections';
import { renderSourceCxoNarrativeHtml } from '../source-cxo-narrative-html';
import { renderSourceCxoNarrativePptx } from '../source-cxo-narrative-pptx';
import { buildSourceCxoNarrativeReport } from '../source-cxo-narrative-report';

const GENERATED_AT = '2026-05-20T12:00:00.000Z';

describe('Source CXO narrative report', () => {
  it('builds a boardroom story spine over the Source deal pack input', () => {
    const report = buildSourceCxoNarrativeReport(makeDealPackInput());

    expect(report.tenantName).toBe('Apex Retail');
    expect(report.eventCode).toBe('APX-CC-2026');
    expect(report.audience).toContain('VP Sourcing');
    expect(report.verdict).toBe('Pending — Evaluation / BAFO / Decision');
    expect(report.slides.map((slide) => slide.kind)).toEqual([
      'cover',
      'answer',
      'why-now',
      'path',
      'economics',
      'vendor-field',
      'commercial-risk',
      'renewal',
      'evidence',
      'asks',
    ]);
  });

  it('maps lifecycle artifacts to standards and preserves missing/scaffold states', () => {
    const report = buildSourceCxoNarrativeReport(
      makeDealPackInput({ currentStageKey: 'executive_decision' }),
    );
    const selection = report.artifactCoverage.find((item) => item.artifactCode === 'd27_selection_memo');
    const tco = report.artifactCoverage.find((item) => item.artifactCode === 'dx4_tco_iceberg');
    const renewal = report.artifactCoverage.find((item) => item.artifactCode === 'dx7_renewal_decision');

    expect(selection).toMatchObject({
      artifactKind: 'selection-memo',
      status: 'authored',
      minimumScore: 78,
    });
    expect(tco).toMatchObject({
      artifactKind: 'tco-iceberg',
      status: 'scaffold',
    });
    expect(renewal).toMatchObject({
      artifactKind: 'renewal-decision',
      status: 'missing',
    });
  });

  it('does not convert a pending selection memo into award / proceed', () => {
    const input = makeDealPackInput({
      selectionMemoBody:
        '# Selection Memo\n\nSelection status: pending. TaskFlow AI is provisional leader, not selected. Do not award yet until P0 legal clauses and telemetry evidence close.',
      gateState: 'not_met',
    });
    const report = buildSourceCxoNarrativeReport(input);
    const answer = report.slides.find((slide) => slide.kind === 'answer');

    expect(report.verdict).toBe('Do not award yet');
    expect(answer?.metrics.find((metric) => metric.label === 'Verdict')?.value).toBe('Do not award yet');
    expect(answer?.message).toMatch(/pending|not selected|do not award/i);
    expect(JSON.stringify(report)).not.toContain('Award / proceed');
  });

  it('does not invent an award recommendation when no decision artifact is authored', () => {
    const input = makeDealPackInput({ selectionMemoBody: null, eventOwner: null });
    const report = buildSourceCxoNarrativeReport(input);
    const answer = report.slides.find((slide) => slide.kind === 'answer');

    expect(report.verdict).toBe('Pause for evidence');
    expect(answer?.message).not.toContain('Award');
    expect(JSON.stringify(report)).toContain('Not recorded');
  });

  it('renders a self-contained HTML deck', () => {
    const html = renderSourceCxoNarrativeHtml(buildSourceCxoNarrativeReport(makeDealPackInput()));

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('CXO Narrative Report');
    expect(html).toContain('Apex Retail Contact Center AI');
    expect(html).not.toMatch(/<script\s+src=/i);
    expect(html).not.toMatch(/<link[^>]+href=["']https?:/i);
    expect(html).not.toContain('Lorem ipsum');
  });

  it('PINS the CXO HTML verdict to the report verdict (kernel hold)', () => {
    const input = makeDealPackInput({
      selectionMemoBody:
        '# Selection Memo\n\nSelection status: pending. TaskFlow AI is provisional leader, not selected. Do not award yet until P0 legal clauses and telemetry evidence close.',
      gateState: 'not_met',
    });
    const report = buildSourceCxoNarrativeReport(input);
    const html = renderSourceCxoNarrativeHtml(report);

    expect(report.verdict).toBe('Do not award yet');
    // The HTML deck renders FROM the report object — it inherits the
    // kernel verdict and never re-synthesizes its own conclusion.
    expect(html).toContain(report.verdict);
    expect(html).not.toContain('Award / proceed');
  });

  it('PINS the CXO PPTX verdict to the report verdict (kernel hold)', async () => {
    const input = makeDealPackInput({
      selectionMemoBody:
        '# Selection Memo\n\nSelection status: pending. TaskFlow AI is provisional leader, not selected. Do not award yet until P0 legal clauses and telemetry evidence close.',
      gateState: 'not_met',
    });
    const report = buildSourceCxoNarrativeReport(input);
    const buffer = await renderSourceCxoNarrativePptx(report);
    const text = await extractPptxText(buffer);

    expect(report.verdict).toBe('Do not award yet');
    // The cover slide renders report.verdict.toUpperCase() — the PPTX
    // inherits the kernel verdict, it does not re-synthesize.
    expect(text).toContain(report.verdict.toUpperCase());
    expect(text).not.toContain('AWARD / PROCEED');
  });

  it('PINS the CXO PPTX verdict to the report verdict (award-ready)', async () => {
    const report = buildSourceCxoNarrativeReport(
      makeDealPackInput({ currentStageKey: 'executive_decision' }),
    );
    const buffer = await renderSourceCxoNarrativePptx(report);
    const text = await extractPptxText(buffer);

    expect(report.verdict).toBe('Award / proceed');
    expect(text).toContain(report.verdict.toUpperCase());
  });
});

async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name),
  );
  const parts = await Promise.all(slideFiles.map((name) => zip.files[name]!.async('string')));
  return parts.join('\n');
}

function makeDealPackInput(
  overrides: {
    selectionMemoBody?: string | null;
    eventOwner?: string | null;
    gateState?: 'met' | 'not_met';
    currentStageKey?: DealPackInput['currentStageKey'];
  } = {},
): DealPackInput {
  const selectionMemoBody =
    overrides.selectionMemoBody === undefined
      ? '# Award Acme with commercial guardrails\n\nContract controls are closed; proceed with signature controls.'
      : overrides.selectionMemoBody;
  return {
    tenantName: 'Apex Retail',
    eventCode: 'APX-CC-2026',
    eventName: 'Apex Retail Contact Center AI',
    eventOwner: overrides.eventOwner === undefined ? 'Maya Chen, VP Customer Ops' : overrides.eventOwner,
    eventStatus: 'Active',
    currentStageKey: overrides.currentStageKey ?? 'selection',
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
      stage(2, 'Market Scan', [
        structured('dx2_market_scan', 'Market Scan', 'market-scan', true),
      ]),
      stage(3, 'Scope & RFP', [
        narrative('d05_scope_memo', 'Scope Memo', '# Scope memo\n\nIn scope: routing, agent assist, QA workflow.'),
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
        structured('dx6a_ai_clause_gap', 'AI Clause Gap', 'ai-clause-gap', true),
      ]),
      stage(7, 'Renewal & Value Handoff', [
        missing('dx7_renewal_decision', 'Renewal Decision'),
      ]),
    ],
    artifactStates: selectionMemoBody
      ? [
          {
            artifactCode: 'd27_selection_memo',
            body: selectionMemoBody,
          } as DealPackInput['artifactStates'][number],
        ]
      : [],
    gateCriteria: [
      { criterionId: 'selection-ready', state: overrides.gateState ?? 'met' } as DealPackInput['gateCriteria'][number],
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
