import ExcelJS from 'exceljs';
import {
  buildPricingComparisonWorkbook,
  type PricingComparisonPayload,
  type VendorPricingSubmission,
} from '../renderers/pricing-comparison';

function makeSubmission(
  overrides: Partial<VendorPricingSubmission> & { vendorName: string },
): VendorPricingSubmission {
  const base: VendorPricingSubmission = {
    vendorName: overrides.vendorName,
    submittedAt: '2026-06-12T12:00:00.000Z',
    unitPricesById: {
      'L-CMP-01': 400,
      'L-OPS-01': 95,
    },
    pricingNotes: '',
    assumptionDeviations: [],
  };
  return { ...base, ...overrides };
}

function makePayload(
  overrides: Partial<PricingComparisonPayload> = {},
): PricingComparisonPayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    generatedAt: '2026-06-15T10:00:00.000Z',
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
    assumptions: [
      { key: 'Term horizon', value: '3 years', rationale: 'Default' },
      { key: 'Annual escalator', value: '4.0%' },
    ],
    escalator: 0.04,
    tcoYears: 3,
    submissions: [
      makeSubmission({ vendorName: 'Acme' }),
      makeSubmission({
        vendorName: 'Beta',
        unitPricesById: { 'L-CMP-01': 450, 'L-OPS-01': 88 },
        assumptionDeviations: [
          {
            assumptionKey: 'Term horizon',
            proposedAlternative: '5-year firm with break clause',
            severity: 'medium',
          },
        ],
      }),
      makeSubmission({
        vendorName: 'Gamma',
        unitPricesById: { 'L-CMP-01': 500, 'L-OPS-01': 110 },
        assumptionDeviations: [
          {
            assumptionKey: 'Annual escalator',
            proposedAlternative: '6.5% escalator',
            severity: 'high',
          },
        ],
      }),
    ],
    ...overrides,
  };
}

describe('buildPricingComparisonWorkbook', () => {
  it('produces a workbook with the six canonical sheets', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Cover',
      'Submissions Index',
      'Pricing Comparison',
      'TCO Comparison',
      'Assumption Deviations',
      'Recommendation',
    ]);
  });

  it('Cover sheet lists every vendor compared', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Cover')!);
    expect(text).toContain('Acme');
    expect(text).toContain('Beta');
    expect(text).toContain('Gamma');
    expect(text).toContain('MERI-CLOUD-2026');
  });

  it('Cover sheet shows DEMO MODE banner when demoMode is true', () => {
    const wb = buildPricingComparisonWorkbook(makePayload({ demoMode: true }));
    const text = collectSheetText(wb.getWorksheet('Cover')!);
    expect(text).toContain('DEMO MODE');
  });

  it('Submissions Index has one row per vendor with raw + TCO computed', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const sheet = wb.getWorksheet('Submissions Index')!;
    expect(sheet.getCell('A2').value).toBe('Acme');
    expect(sheet.getCell('A3').value).toBe('Beta');
    expect(sheet.getCell('A4').value).toBe('Gamma');
    // Acme: 400*3360 + 95*24000 = 1,344,000 + 2,280,000 = 3,624,000
    expect(sheet.getCell('D2').value).toBe(3_624_000);
    // Acme 3-yr TCO @ 4% escalator = 3.624M * (1 + 1.04 + 1.0816) ≈ 11,313,408
    const tco = sheet.getCell('E2').value as number;
    expect(tco).toBeGreaterThan(11_300_000);
    expect(tco).toBeLessThan(11_320_000);
    // Deviations counts
    expect(sheet.getCell('F2').value).toBe(0);
    expect(sheet.getCell('F3').value).toBe(1);
    expect(sheet.getCell('F4').value).toBe(1);
  });

  it('Pricing Comparison sheet builds 3 columns per vendor with Δ-vs-cheapest formulas', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const sheet = wb.getWorksheet('Pricing Comparison')!;
    // Row 2 is sub-header.
    expect(sheet.getCell('F2').value).toBe('Unit Price');
    expect(sheet.getCell('G2').value).toBe('Extended');
    expect(sheet.getCell('H2').value).toBe('Δ vs cheapest');
    expect(sheet.getCell('I2').value).toBe('Unit Price'); // Vendor B
    expect(sheet.getCell('L2').value).toBe('Unit Price'); // Vendor C
    // Row 3: first line item, Vendor A unit price
    expect(sheet.getCell('F3').value).toBe(400);
    // Vendor A extended formula: =E3*F3
    expect(sheet.getCell('G3').value).toMatchObject({
      formula: expect.stringContaining('E3*F3'),
    });
    // Δ vs cheapest formula references MIN of all 3 vendor extended cells (G3, J3, M3)
    const deltaFormula = (sheet.getCell('H3').value as { formula: string }).formula;
    expect(deltaFormula).toContain('MIN(G3,J3,M3)');
  });

  it('Pricing Comparison totals row sums extended columns per vendor', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const sheet = wb.getWorksheet('Pricing Comparison')!;
    // 2 line items → totals at row 5 (header rows 1-2, line rows 3-4).
    expect(sheet.getCell('A5').value).toBe('TOTAL');
    expect(sheet.getCell('G5').value).toMatchObject({ formula: 'SUM(G3:G4)' });
    expect(sheet.getCell('J5').value).toMatchObject({ formula: 'SUM(J3:J4)' });
    expect(sheet.getCell('M5').value).toMatchObject({ formula: 'SUM(M3:M4)' });
  });

  it('TCO Comparison sheet builds Year 1..N rows with cumulative formulas', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const sheet = wb.getWorksheet('TCO Comparison')!;
    expect(sheet.getCell('A2').value).toBe('Year 1');
    expect(sheet.getCell('A3').value).toBe('Year 2');
    expect(sheet.getCell('A4').value).toBe('Year 3');
    // Year 1 cumulative = annual (B2) for vendor A.
    expect(sheet.getCell('C2').value).toMatchObject({ formula: 'B2' });
    // Year 2 cumulative = prior cumulative + this annual.
    expect(sheet.getCell('C3').value).toMatchObject({ formula: 'C2+B3' });
    expect(sheet.getCell('C4').value).toMatchObject({ formula: 'C3+B4' });
  });

  it('TCO Comparison includes a Cheapest 3-yr indicator + Range row', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('TCO Comparison')!);
    expect(text).toContain('Cheapest 3-yr');
    expect(text).toContain('Range (max−min)');
  });

  it('Assumption Deviations sheet flags every vendor deviation with severity coloring', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const sheet = wb.getWorksheet('Assumption Deviations')!;
    expect(sheet.getCell('A2').value).toBe('Beta');
    expect(sheet.getCell('B2').value).toBe('Term horizon');
    expect(sheet.getCell('D2').value).toBe('medium');
    expect(sheet.getCell('A3').value).toBe('Gamma');
    expect(sheet.getCell('B3').value).toBe('Annual escalator');
    expect(sheet.getCell('D3').value).toBe('high');
  });

  it('Assumption Deviations sheet shows a "no deviations" row when nobody flagged', () => {
    const wb = buildPricingComparisonWorkbook(
      makePayload({
        submissions: [
          makeSubmission({ vendorName: 'Acme' }),
          makeSubmission({ vendorName: 'Beta' }),
        ],
      }),
    );
    const text = collectSheetText(wb.getWorksheet('Assumption Deviations')!);
    expect(text).toContain('— no deviations —');
  });

  it('Recommendation sheet has narrative seed topics', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Recommendation')!);
    expect(text).toContain('Cheapest 3-year TCO');
    expect(text).toContain('Risk-adjusted recommendation');
    expect(text).toContain('BAFO target');
  });

  it('escapes formula-prefix characters in vendor-supplied strings', () => {
    const wb = buildPricingComparisonWorkbook(
      makePayload({
        submissions: [
          makeSubmission({
            vendorName: '=cmd|"/c calc"!A0',
            assumptionDeviations: [
              {
                assumptionKey: '=evil',
                proposedAlternative: '+attack',
                severity: 'high',
              },
            ],
          }),
        ],
      }),
    );
    const sheet = wb.getWorksheet('Assumption Deviations')!;
    const cell = sheet.getCell('A2').value as string;
    expect(cell.startsWith("'=")).toBe(true);
  });

  it('handles a single-vendor comparison without breaking column layout', () => {
    const wb = buildPricingComparisonWorkbook(
      makePayload({ submissions: [makeSubmission({ vendorName: 'Solo' })] }),
    );
    const sheet = wb.getWorksheet('Pricing Comparison')!;
    expect(sheet.getCell('F2').value).toBe('Unit Price');
    expect(sheet.getCell('G2').value).toBe('Extended');
    expect(sheet.getCell('H2').value).toBe('Δ vs cheapest');
    // No second vendor → column I header should be empty.
    expect(sheet.getCell('I2').value).toBeFalsy();
  });

  it('serializes to a non-empty xlsx buffer', async () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(4000);
  });
});

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
