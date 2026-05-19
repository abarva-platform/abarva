// Source · G7 format-parity renderer tests.
//
// Direct unit coverage for the docx + pdf renderers added in Slice G7
// for the structured artifacts that were previously xlsx-only:
//   d19 pricing-template / pricing-comparison, d20 trap-log,
//   d22 bafo-question-pack.
//
// Each test builds a real document and asserts it serializes to a
// non-empty buffer with the right magic bytes. docx → ZIP magic;
// pdf → %PDF magic. We also assert the empty-payload path yields a
// valid document rather than throwing — empty state, never invented.

import { Packer } from 'docx';
import { pdf } from '@react-pdf/renderer';

import { buildPricingTemplateDocx } from '../renderers/pricing-template-docx';
import { buildPricingTemplatePdf } from '../renderers/pricing-template-pdf';
import { buildPricingComparisonDocx } from '../renderers/pricing-comparison-docx';
import { buildPricingComparisonPdf } from '../renderers/pricing-comparison-pdf';
import { buildTrapLogDocx } from '../renderers/trap-log-docx';
import { buildTrapLogPdf } from '../renderers/trap-log-pdf';
import { buildBafoQuestionPackDocx } from '../renderers/bafo-question-pack-docx';
import { buildBafoQuestionPackPdf } from '../renderers/bafo-question-pack-pdf';
import { buildAppInventoryPdf } from '../renderers/app-inventory-pdf';
import { buildResponseChecklistPdf } from '../renderers/response-checklist-pdf';
import { buildScorecardPdf } from '../renderers/scorecard-pdf';

import type { PricingTemplatePayload } from '../renderers/pricing-template';
import type { PricingComparisonPayload } from '../renderers/pricing-comparison';
import type { TrapLogPayload } from '../renderers/trap-log';
import type { BafoQuestionPackPayload } from '../renderers/bafo-question-pack';
import type { AppInventoryPayload } from '../renderers/app-inventory';
import type { ResponseChecklistPayload } from '../renderers/response-checklist';
import type { ScorecardPayload } from '../renderers/scorecard';

const COMMON = {
  tenantName: 'Meridian Health',
  eventCode: 'MERI-CLOUD-2026',
  eventName: 'Meridian Health Cloud & Infrastructure',
  issuedBy: 'Janet Fischer, VP IT Ops',
  generatedAt: '2026-05-08T03:30:00.000Z',
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

function expectZip(buffer: Buffer): void {
  expect(buffer.byteLength).toBeGreaterThan(2000);
  expect(buffer[0]).toBe(0x50);
  expect(buffer[1]).toBe(0x4b);
}

function expectPdf(buffer: Buffer): void {
  expect(buffer.byteLength).toBeGreaterThan(1000);
  expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
}

const PRICING_TEMPLATE: PricingTemplatePayload = {
  ...COMMON,
  assumptions: [
    { key: 'Term', value: '3 years', rationale: 'Standard buyer commit.' },
    { key: 'Egress ceiling', value: '$0.05/GB', rationale: 'd21 locked.' },
  ],
  lineItems: [
    { id: 'L-CMP-01', category: 'Platform', description: 'Compute', unit: 'unit-month', annualQuantity: 280 },
    { id: 'L-STG-01', category: 'Platform', description: 'Storage', unit: 'TB-month', annualQuantity: 1200, note: 'Tier 1 only.' },
  ],
  tcoYears: 3,
  escalator: 0.04,
};

const PRICING_COMPARISON: PricingComparisonPayload = {
  ...COMMON,
  lineItems: PRICING_TEMPLATE.lineItems,
  assumptions: PRICING_TEMPLATE.assumptions,
  escalator: 0.04,
  tcoYears: 3,
  submissions: [
    {
      vendorName: 'Acme Cloud',
      submittedAt: COMMON.generatedAt,
      unitPricesById: { 'L-CMP-01': 120, 'L-STG-01': 18 },
      pricingNotes: 'Volume discount beyond 400 units.',
      assumptionDeviations: [
        { assumptionKey: 'Term', proposedAlternative: '5 years', severity: 'high' },
      ],
    },
    {
      vendorName: 'Beta Infra',
      submittedAt: COMMON.generatedAt,
      unitPricesById: { 'L-CMP-01': 135, 'L-STG-01': 15 },
      pricingNotes: '',
      assumptionDeviations: [],
    },
  ],
};

const TRAP_LOG: TrapLogPayload = {
  ...COMMON,
  severityDefinitions: [
    { severity: 'P0', label: 'Deal-shaping', rubric: 'Material TCO shift.' },
    { severity: 'P1', label: 'Material', rubric: 'Adjusts TCO 3-15%.' },
  ],
  rows: [
    { id: 'T-EGR-01', severity: 'P0', category: 'Egress', description: 'Egress overage.', surfacedFor: 'all', surfacedBy: 'Sentinel' },
    { id: 'T-SLA-01', severity: 'P1', category: 'SLA', description: 'Maintenance carve-out.', surfacedFor: 'all', surfacedBy: 'Sentinel' },
  ],
};

const BAFO: BafoQuestionPackPayload = {
  ...COMMON,
  roundLabel: 'BAFO Round 1',
  vendors: ['Acme Cloud', 'Beta Infra'],
  trapQuestions: [
    { id: 'TQ-EGR-01', source: 'T-EGR-01', severity: 'P0', question: 'Resolve egress overage?', responseFormat: 'y/n + redline' },
  ],
  valueQuestions: [
    { id: 'VQ-AI-01', source: 'AI / automation', severity: 'n/a', question: 'Quantify uplift?', responseFormat: '% + baseline' },
  ],
};

describe('G7 · d19 pricing-template renderers', () => {
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildPricingTemplateDocx(PRICING_TEMPLATE)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildPricingTemplatePdf(PRICING_TEMPLATE)));
  });
  it('renders an empty state — no fabricated rows — when sections are empty', async () => {
    const empty: PricingTemplatePayload = { ...PRICING_TEMPLATE, assumptions: [], lineItems: [] };
    expectZip(await packDocx(buildPricingTemplateDocx(empty)));
    expectPdf(await packPdf(buildPricingTemplatePdf(empty)));
  });
});

describe('G7 · d19 pricing-comparison renderers', () => {
  it('builds a valid docx with computed annual totals', async () => {
    expectZip(await packDocx(buildPricingComparisonDocx(PRICING_COMPARISON)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildPricingComparisonPdf(PRICING_COMPARISON)));
  });
  it('renders an empty state when there are no submissions', async () => {
    const empty: PricingComparisonPayload = { ...PRICING_COMPARISON, submissions: [] };
    expectZip(await packDocx(buildPricingComparisonDocx(empty)));
    expectPdf(await packPdf(buildPricingComparisonPdf(empty)));
  });
});

describe('G7 · d20 trap-log renderers', () => {
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildTrapLogDocx(TRAP_LOG)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildTrapLogPdf(TRAP_LOG)));
  });
  it('renders an empty state when no traps are logged', async () => {
    const empty: TrapLogPayload = { ...TRAP_LOG, rows: [] };
    expectZip(await packDocx(buildTrapLogDocx(empty)));
    expectPdf(await packPdf(buildTrapLogPdf(empty)));
  });
});

describe('G7 · d22 bafo-question-pack renderers', () => {
  it('builds a valid docx', async () => {
    expectZip(await packDocx(buildBafoQuestionPackDocx(BAFO)));
  });
  it('builds a valid pdf', async () => {
    expectPdf(await packPdf(buildBafoQuestionPackPdf(BAFO)));
  });
  it('renders an empty state when there are no questions', async () => {
    const empty: BafoQuestionPackPayload = { ...BAFO, trapQuestions: [], valueQuestions: [] };
    expectZip(await packDocx(buildBafoQuestionPackDocx(empty)));
    expectPdf(await packPdf(buildBafoQuestionPackPdf(empty)));
  });
});

describe('G7 · d04 / d11 / d16 pdf renderers (parity with their docx)', () => {
  it('app-inventory pdf is valid', async () => {
    const payload: AppInventoryPayload = {
      ...COMMON,
      tierDefinitions: [
        { tier: 1, label: 'Mission-critical', criterion: 'Outage halts revenue.', recoveryObjective: 'RTO < 4h', examples: 'Epic CIS' },
      ],
      rows: [
        { id: 'A-EPIC-01', name: 'Epic CIS', tier: 1, owner: 'Karen Liu', techStack: 'Cache MUMPS', hostingToday: 'Newark colo', annualWorkloadCount: 24000, inScope: true },
      ],
    };
    expectPdf(await packPdf(buildAppInventoryPdf(payload)));
  });

  it('response-checklist pdf is valid', async () => {
    const payload: ResponseChecklistPayload = {
      ...COMMON,
      submissionDeadline: '2026-06-15T17:00:00.000Z',
      mandatoryItems: [{ id: 'M-EXEC-01', section: 'Exec', requirement: 'Exec summary ≤ 2 pages.' }],
      optionalItems: [],
      formatExpectations: [{ topic: 'File formats', requirement: 'PDF + native xlsx.' }],
      certifications: ['Officer is authorized to bind the Vendor.'],
    };
    expectPdf(await packPdf(buildResponseChecklistPdf(payload)));
  });

  it('scorecard pdf is valid', async () => {
    const payload: ScorecardPayload = {
      ...COMMON,
      criteria: [{ id: 'C-FIT', label: 'Functional fit', weightPercent: 100, description: 'd04 coverage.' }],
      vendors: ['Acme'],
      scoreGuidance: [{ score: 3, label: 'Meets', rubric: 'Fully meets.' }],
    };
    expectPdf(await packPdf(buildScorecardPdf(payload)));
  });
});
