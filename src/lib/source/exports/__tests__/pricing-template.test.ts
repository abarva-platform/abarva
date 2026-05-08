import ExcelJS from 'exceljs';
import {
  buildPricingTemplateWorkbook,
  type PricingTemplatePayload,
} from '../renderers/pricing-template';

function makePayload(
  overrides: Partial<PricingTemplatePayload> = {},
): PricingTemplatePayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    issuedBy: 'Janet Fischer, VP IT Ops',
    generatedAt: '2026-05-08T03:30:00.000Z',
    assumptions: [
      { key: 'Term horizon', value: '3 years', rationale: 'Default' },
      { key: 'Annual escalator', value: '4.0%', rationale: 'Year 2 + 3' },
      { key: 'FTE blended rate', value: '$185 / hour' },
    ],
    lineItems: [
      {
        id: 'L-CMP-01',
        category: 'Platform',
        description: 'Compute (workload-months)',
        unit: 'workload-month',
        annualQuantity: 3360,
      },
      {
        id: 'L-OPS-01',
        category: 'Operating model',
        description: 'L2/L3 incident management 24×7',
        unit: 'incident-call',
        annualQuantity: 24000,
      },
    ],
    tcoYears: 3,
    escalator: 0.04,
    ...overrides,
  };
}

describe('buildPricingTemplateWorkbook', () => {
  it('produces a workbook with the five canonical sheets', async () => {
    const wb = buildPricingTemplateWorkbook(makePayload());
    const sheetNames = wb.worksheets.map((s) => s.name);
    expect(sheetNames).toEqual([
      'Cover',
      'Assumption Set',
      'Pricing Detail',
      'TCO Summary',
      'Pricing Notes',
    ]);
  });

  it('Cover sheet carries event metadata + a Vendor name slot', async () => {
    const wb = buildPricingTemplateWorkbook(makePayload());
    const cover = wb.getWorksheet('Cover')!;
    const text = collectSheetText(cover);
    expect(text).toContain('Meridian Health Cloud & Infrastructure');
    expect(text).toContain('MERI-CLOUD-2026');
    expect(text).toContain('Vendor name');
  });

  it('Assumption Set sheet contains every assumption + rationale', () => {
    const wb = buildPricingTemplateWorkbook(makePayload());
    const sheet = wb.getWorksheet('Assumption Set')!;
    const text = collectSheetText(sheet);
    expect(text).toContain('Term horizon');
    expect(text).toContain('Annual escalator');
    expect(text).toContain('FTE blended rate');
  });

  it('Pricing Detail sheet has one row per line item + a totals row with SUM formula', () => {
    const wb = buildPricingTemplateWorkbook(makePayload());
    const sheet = wb.getWorksheet('Pricing Detail')!;
    expect(collectSheetText(sheet)).toContain('Compute (workload-months)');
    expect(collectSheetText(sheet)).toContain(
      'L2/L3 incident management 24',
    );
    // Extended price formulas on each row.
    expect(sheet.getCell('G2').value).toMatchObject({ formula: expect.stringContaining('IFERROR(E2*F2') });
    expect(sheet.getCell('G3').value).toMatchObject({ formula: expect.stringContaining('IFERROR(E3*F3') });
    // Totals SUM formula.
    expect(sheet.getCell('G4').value).toMatchObject({
      formula: 'SUM(G2:G3)',
    });
  });

  it('TCO Summary sheet has Year 1..N rows + a final 3-year cumulative row', () => {
    const wb = buildPricingTemplateWorkbook(makePayload({ tcoYears: 3 }));
    const sheet = wb.getWorksheet('TCO Summary')!;
    const text = collectSheetText(sheet);
    expect(text).toContain('Year 1');
    expect(text).toContain('Year 2');
    expect(text).toContain('Year 3');
    expect(text).toContain('3-year TCO');
  });

  it('serializes to a non-empty xlsx buffer', async () => {
    const wb = buildPricingTemplateWorkbook(makePayload());
    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(4000);
  });

  it('escapes formula-prefix characters in user-supplied strings', () => {
    const wb = buildPricingTemplateWorkbook(
      makePayload({
        assumptions: [
          { key: 'evil', value: '=cmd|"/c calc"!A0', rationale: 'attack' },
        ],
      }),
    );
    const sheet = wb.getWorksheet('Assumption Set')!;
    const cell = sheet.getCell('B2').value;
    // safeCell prefixes a single quote to disarm the formula.
    expect(typeof cell).toBe('string');
    expect((cell as string).startsWith("'=")).toBe(true);
  });
});

/** Walk every cell and collect non-empty string values. */
function collectSheetText(sheet: ExcelJS.Worksheet): string {
  const parts: string[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value;
      if (typeof v === 'string') parts.push(v);
      else if (typeof v === 'number') parts.push(String(v));
      else if (v && typeof v === 'object' && 'formula' in v) {
        parts.push(`{formula:${(v as { formula: string }).formula}}`);
      }
    });
  });
  return parts.join('\n');
}
