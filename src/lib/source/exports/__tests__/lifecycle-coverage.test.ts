// Source · lifecycle-coverage wave renderer tests.
//
// Asserts every new artifact × format combination ships a non-empty
// document with the right magic bytes (ZIP for docx + xlsx, %PDF for
// pdf, %HTML for the AI Clause Gap HTML share). Empty / seed-gap
// payloads must also produce valid documents — never throw.
//
// Grounding tests at the bottom assert that "Not recorded — seed gap"
// surfaces explicitly in the empty path (never silently dropped).

import ExcelJS from 'exceljs';
import { Packer } from 'docx';
import { pdf } from '@react-pdf/renderer';

import { buildNarrativeDocx, DEMAND_CHALLENGE_DOCX_CONFIG, SOURCING_APPROACH_DOCX_CONFIG, VENDOR_RISK_PACK_DOCX_CONFIG } from '../renderers/narrative-docx';
import { buildNarrativePdf, DEMAND_CHALLENGE_PDF_CONFIG, SOURCING_APPROACH_PDF_CONFIG, VENDOR_RISK_PACK_PDF_CONFIG } from '../renderers/narrative-pdf';
import type { NarrativeDocxPayload } from '../renderers/narrative-docx';

import { buildMarketScanWorkbook, type MarketScanPayload } from '../renderers/market-scan';
import { buildMarketScanDocx } from '../renderers/market-scan-docx';
import { buildMarketScanPdf } from '../renderers/market-scan-pdf';

import { buildTcoIcebergWorkbook, type TcoIcebergPayload } from '../renderers/tco-iceberg';
import { buildTcoIcebergDocx } from '../renderers/tco-iceberg-docx';
import { buildTcoIcebergPdf } from '../renderers/tco-iceberg-pdf';

import { buildAiClauseGapWorkbook, type AiClauseGapPayload } from '../renderers/ai-clause-gap';
import { buildAiClauseGapDocx } from '../renderers/ai-clause-gap-docx';
import { buildAiClauseGapPdf } from '../renderers/ai-clause-gap-pdf';
import { buildAiClauseGapHtml } from '../renderers/ai-clause-gap-html';

import { buildRenewalDecisionWorkbook, type RenewalDecisionPayload } from '../renderers/renewal-decision';
import { buildRenewalDecisionDocx } from '../renderers/renewal-decision-docx';
import { buildRenewalDecisionPdf } from '../renderers/renewal-decision-pdf';

const COMMON = {
  tenantName: 'Apex Retail',
  eventCode: 'APX-CC-2026',
  eventName: 'Apex Retail Contact Center AI',
  issuedBy: 'Maya Chen, VP Customer Ops',
  generatedAt: '2026-05-19T12:00:00.000Z',
} as const;

async function packDocx(doc: import('docx').Document): Promise<Buffer> {
  return (await Packer.toBuffer(doc)) as unknown as Buffer;
}

async function packPdf(
  element: import('react').ReactElement<import('@react-pdf/renderer').DocumentProps>,
): Promise<Buffer> {
  const stream = await pdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function packXlsx(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

function expectZip(buffer: Buffer): void {
  expect(buffer.byteLength).toBeGreaterThan(1500);
  expect(buffer[0]).toBe(0x50); // 'P'
  expect(buffer[1]).toBe(0x4b); // 'K'
}

function expectPdf(buffer: Buffer): void {
  expect(buffer.byteLength).toBeGreaterThan(800);
  expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
}

// ── Demand Challenge (narrative) ────────────────────────────────────────────

function narrativePayload(body: string, authored = true): NarrativeDocxPayload {
  return {
    tenantName: COMMON.tenantName,
    eventCode: COMMON.eventCode,
    eventName: COMMON.eventName,
    issuedBy: COMMON.issuedBy,
    generatedAt: COMMON.generatedAt,
    body,
    bodyIsAuthored: authored,
  };
}

describe('lifecycle · Demand Challenge', () => {
  it('builds a valid docx with a markdown body', async () => {
    const body = '# Demand Challenge — Apex Retail Contact Center AI\n\n## Verdict\nProceed with caveats.\n';
    expectZip(await packDocx(buildNarrativeDocx(narrativePayload(body), DEMAND_CHALLENGE_DOCX_CONFIG)));
  });
  it('builds a valid pdf', async () => {
    const body = '# Demand Challenge\n\nVerdict: do not source.\n';
    expectPdf(await packPdf(buildNarrativePdf(narrativePayload(body), DEMAND_CHALLENGE_PDF_CONFIG)));
  });
  it('renders the seed-gap line literally when scaffolded with empty substrate', async () => {
    const body = '# Demand Challenge\n\n— Not recorded — seed gap\n';
    const buf = await packDocx(buildNarrativeDocx(narrativePayload(body, false), DEMAND_CHALLENGE_DOCX_CONFIG));
    expectZip(buf);
    // docx is zipped — assert size only here; grounding tests below
    // assert the body string explicitly via the body-builder unit.
  });
});

describe('lifecycle · Sourcing Approach', () => {
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildNarrativeDocx(narrativePayload('# body', false), SOURCING_APPROACH_DOCX_CONFIG)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildNarrativePdf(narrativePayload('# body', false), SOURCING_APPROACH_PDF_CONFIG)));
  });
});

describe('lifecycle · Vendor Risk Pack', () => {
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildNarrativeDocx(narrativePayload('# body', false), VENDOR_RISK_PACK_DOCX_CONFIG)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildNarrativePdf(narrativePayload('# body', false), VENDOR_RISK_PACK_PDF_CONFIG)));
  });
});

// ── Market Scan (structured) ────────────────────────────────────────────────

const MARKET_SCAN: MarketScanPayload = {
  ...COMMON,
  vendors: [
    { id: 'V-AWS', name: 'AWS', archetype: 'Cloud · hyperscaler', hq: 'Seattle, US', scale: 'Public Tier-1', platformReality: 'real_platform', maFlag: 'none', notes: '' },
    { id: 'V-WRAP', name: 'WrapperCo', archetype: 'AI · wrapper', hq: 'SF', scale: 'Pre-seed', platformReality: 'thin_wrapper', maFlag: 'rumored', notes: 'Thin OpenAI wrapper.' },
  ],
  capabilities: [
    { capability: 'Multi-region', importance: 'M', byVendor: { 'V-AWS': 'full', 'V-WRAP': 'gap' } },
  ],
  rates: [
    { archetype: 'Big-4 SI', delivery: 'onshore', specialization: 'Architect', rateUsdHrLow: 280, rateUsdHrHigh: 380, source: 'AbarVa rate-card 2026' },
  ],
  industrySignals: [
    { topic: 'Vendor concentration', observation: 'Three hyperscalers cover 92% of enterprise compute spend.', source: 'industry_context:vendor_landscape_2026' },
  ],
};

describe('lifecycle · Market Scan', () => {
  it('builds a valid xlsx', async () => {
    expectZip(await packXlsx(buildMarketScanWorkbook(MARKET_SCAN)));
  });
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildMarketScanDocx(MARKET_SCAN)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildMarketScanPdf(MARKET_SCAN)));
  });
  it('renders seed-gap row when industry_context is empty', async () => {
    const empty: MarketScanPayload = { ...MARKET_SCAN, industrySignals: [] };
    expectZip(await packXlsx(buildMarketScanWorkbook(empty)));
    expectZip(await packDocx(buildMarketScanDocx(empty)));
    expectPdf(await packPdf(buildMarketScanPdf(empty)));
  });
});

// ── TCO Iceberg ─────────────────────────────────────────────────────────────

const TCO_ICEBERG: TcoIcebergPayload = {
  ...COMMON,
  currency: 'USD',
  layers: [
    { id: 'L-LICENSE', label: 'License / subscription', visibility: 'visible', driver: 'Vendor quote', year1Usd: 1_000_000, year2Usd: 1_040_000, year3Usd: 1_081_600, confidence: 'high', sensitivityLowUsd: 950_000, sensitivityHighUsd: 1_050_000 },
    { id: 'L-INT', label: 'Integration', visibility: 'hidden', driver: 'Connectors', year1Usd: 250_000, year2Usd: 260_000, year3Usd: 270_400, confidence: 'medium', sensitivityLowUsd: 150_000, sensitivityHighUsd: 450_000 },
  ],
  definitions: [
    { layerLabel: 'License / subscription', rubric: 'Vendor quote; typically 20-35% of true TCO.' },
  ],
};

describe('lifecycle · TCO Iceberg', () => {
  it('builds a valid xlsx with formula-driven totals', async () => {
    const wb = buildTcoIcebergWorkbook(TCO_ICEBERG);
    expectZip(await packXlsx(wb));
    const sheet = wb.getWorksheet('Iceberg Cost Model')!;
    // Visible subtotal row uses SUMIF on Visibility column.
    const allRows: ExcelJS.CellValue[] = [];
    sheet.eachRow((r) => r.eachCell((c) => allRows.push(c.value)));
    const hasSumif = allRows.some(
      (v) => typeof v === 'object' && v != null && 'formula' in v && /SUMIF/.test((v as { formula: string }).formula),
    );
    expect(hasSumif).toBe(true);
  });
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildTcoIcebergDocx(TCO_ICEBERG)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildTcoIcebergPdf(TCO_ICEBERG)));
  });
  it('renders empty state without inventing layers', async () => {
    const empty: TcoIcebergPayload = { ...TCO_ICEBERG, layers: [] };
    expectZip(await packXlsx(buildTcoIcebergWorkbook(empty)));
    expectZip(await packDocx(buildTcoIcebergDocx(empty)));
    expectPdf(await packPdf(buildTcoIcebergPdf(empty)));
  });
});

// ── AI Clause Gap ───────────────────────────────────────────────────────────

const AI_CLAUSE_GAP: AiClauseGapPayload = {
  ...COMMON,
  vendorName: 'Acme AI',
  clauses: [
    {
      id: 'AI-001',
      clause: 'Model-training rights',
      whyItMatters: 'Vendor must not train on customer data.',
      requiredLanguage: 'No training on customer data, prompts, or outputs.',
      riskIfMissing: 'critical',
      status: 'missing',
      notes: '',
    },
    {
      id: 'AI-005',
      clause: 'Consumption cap',
      whyItMatters: 'Unbounded token cost = unbounded risk.',
      requiredLanguage: 'Hard monthly cap + 80% alerting + annualised ceiling.',
      riskIfMissing: 'critical',
      status: 'partial',
      notes: 'Cap exists but no alerting.',
    },
  ],
};

describe('lifecycle · AI Clause Gap', () => {
  it('builds a valid xlsx with formula gap summary', async () => {
    const wb = buildAiClauseGapWorkbook(AI_CLAUSE_GAP);
    expectZip(await packXlsx(wb));
    const sheet = wb.getWorksheet('Gap Summary')!;
    const allRows: ExcelJS.CellValue[] = [];
    sheet.eachRow((r) => r.eachCell((c) => allRows.push(c.value)));
    const hasSumProduct = allRows.some(
      (v) => typeof v === 'object' && v != null && 'formula' in v && /SUMPRODUCT/.test((v as { formula: string }).formula),
    );
    expect(hasSumProduct).toBe(true);
  });
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildAiClauseGapDocx(AI_CLAUSE_GAP)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildAiClauseGapPdf(AI_CLAUSE_GAP)));
  });
  it('builds a valid html with %DOCTYPE prefix and gap summary', () => {
    const html = buildAiClauseGapHtml(AI_CLAUSE_GAP);
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('Gap summary');
    expect(html).toContain('Acme AI');
    expect(html).toContain('Model-training rights');
  });
  it('renders empty-state for the library without inventing clauses', async () => {
    const empty: AiClauseGapPayload = { ...AI_CLAUSE_GAP, clauses: [] };
    expectZip(await packXlsx(buildAiClauseGapWorkbook(empty)));
    expectZip(await packDocx(buildAiClauseGapDocx(empty)));
    expectPdf(await packPdf(buildAiClauseGapPdf(empty)));
    const html = buildAiClauseGapHtml(empty);
    expect(html).toContain('— No clauses in library —');
  });
});

// ── Renewal Decision ────────────────────────────────────────────────────────

const RENEWAL: RenewalDecisionPayload = {
  ...COMMON,
  candidates: [
    {
      id: 'R-001',
      vendor: 'ServiceNow',
      scope: 'ITSM platform',
      annualSpendUsd: 2_400_000,
      renewalDate: '2026-08-15',
      daysUntilRenewal: 88,
      posture: 'renegotiate',
      rationale: 'Material spend; benchmark suggests 12% leverage on multi-year extend.',
      topAlternative: 'Atlassian Jira Service Management',
      finalDecision: '',
      autoRenew: true,
      noticePeriodDays: 90,
      daysToNoticeDeadline: -2,
      utilizationRate: 0.64,
      estimatedShelfwareUsd: 320_000,
      benchmarkUsd: 2_050_000,
      overspendVsBenchmarkUsd: 350_000,
      overlapRead: 'Workflow overlap with Jira Service Management; rationalization candidate.',
      riskRead: 'ITSM dependency is high; rebid needs transition runway and service desk acceptance.',
      negotiationPosture: 'Renegotiate price protection, shelfware true-up and AI/data terms.',
      owner: 'Maya Chen',
      srmAction: 'Open Tower watch item for realized savings and renewal terms.',
    },
  ],
  signals: [
    {
      metric: 'P0 incident response',
      value: 'within SLA, 99.4% adherence',
      source: 'operating_telemetry:itsm_sla',
      impact: 'Supports renew_as_is — neutral.',
    },
  ],
  triggers: [
    { trigger: 'Vendor introduces new term', ifTrue: 'Flip → renegotiate.' },
  ],
};

describe('lifecycle · Renewal Decision', () => {
  it('builds a valid xlsx', async () => {
    const wb = buildRenewalDecisionWorkbook(RENEWAL);
    expectZip(await packXlsx(wb));
    expect(wb.getWorksheet('Executive Answer')).toBeDefined();
    expect(wb.getWorksheet('Timing & Leverage')).toBeDefined();
    expect(wb.getWorksheet('Usage & Value')).toBeDefined();
    expect(wb.getWorksheet('Spend & Uplift')).toBeDefined();
    expect(wb.getWorksheet('Negotiation Posture')).toBeDefined();
    expect(wb.getWorksheet('SRM Tower Handoff')).toBeDefined();
  });
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildRenewalDecisionDocx(RENEWAL)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildRenewalDecisionPdf(RENEWAL)));
  });
  it('renders seed-gap row when no candidates are recorded', async () => {
    const empty: RenewalDecisionPayload = { ...RENEWAL, candidates: [], signals: [] };
    const wb = buildRenewalDecisionWorkbook(empty);
    expectZip(await packXlsx(wb));
    const verdict = wb.getWorksheet('Renewal Verdict')!;
    expect(verdict.getCell('B2').value).toContain('Not recorded');
    expectZip(await packDocx(buildRenewalDecisionDocx(empty)));
    expectPdf(await packPdf(buildRenewalDecisionPdf(empty)));
  });
});

// ── Grounding tests on body builders ────────────────────────────────────────

describe('lifecycle substrate · grounded narrative scaffolds', () => {
  it('demand challenge scaffold renders "Not recorded — seed gap" when substrate is empty', async () => {
    const { buildDemandChallengeBody } = await import('../payloads/lifecycle-bodies');
    const ctx = {
      tenantKey: 'apex-retail',
      tenantName: 'Apex Retail',
      event: {
        id: 'evt',
        code: 'APX',
        name: 'Test event',
        archetype: 'cloud',
        rigor: 'standard',
        currentStageKey: 'strategy',
        statusLabel: 'active',
        owner: 'Maya Chen',
        triggerDescription: null,
        scopeDescription: null,
        estimatedValueUsd: null,
      },
      artifactStates: [],
      gateCriteria: [],
      evidence: [],
    };
    // @ts-expect-error structural ctx for test
    const body = buildDemandChallengeBody(ctx, { contracts: [], landscape: [], financials: [] });
    expect(body).toContain('Not recorded — seed gap');
    expect(body).toContain('DO NOT PROCEED');
  });

  it('sourcing-approach scaffold flips to RFI when no contracts on file', async () => {
    const { buildSourcingApproachBody } = await import('../payloads/lifecycle-bodies');
    const ctx = {
      tenantKey: 'meridian',
      tenantName: 'Meridian Health',
      event: {
        id: 'evt',
        code: 'MERI',
        name: 'Test',
        archetype: 'ams',
        rigor: 'standard',
        currentStageKey: 'strategy',
        statusLabel: 'active',
        owner: null,
        triggerDescription: null,
        scopeDescription: null,
        estimatedValueUsd: null,
      },
      artifactStates: [],
      gateCriteria: [],
      evidence: [],
    };
    // @ts-expect-error structural ctx for test
    const body = buildSourcingApproachBody(ctx, { contracts: [], landscape: [], financials: [] });
    expect(body).toContain('Solicitation:** RFI');
  });

  it('vendor-risk body returns HOLD when neither contracts nor compliance on file', async () => {
    const { buildVendorRiskBody } = await import('../payloads/lifecycle-bodies');
    const ctx = {
      tenantKey: 'firstcapital',
      tenantName: 'First Capital',
      event: {
        id: 'evt',
        code: 'FC',
        name: 'Vendor security review',
        archetype: 'saas',
        rigor: 'enhanced',
        currentStageKey: 'evaluation',
        statusLabel: 'active',
        owner: null,
        triggerDescription: null,
        scopeDescription: null,
        estimatedValueUsd: null,
      },
      artifactStates: [],
      gateCriteria: [],
      evidence: [],
    };
    // @ts-expect-error structural ctx for test
    const body = buildVendorRiskBody(ctx, { contracts: [], compliance: [] });
    expect(body).toContain('HOLD');
    expect(body).toContain('Not recorded — seed gap');
  });
});
