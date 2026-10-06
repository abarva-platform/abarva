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
    normalizedUnitPricesById: {
      'L-CMP-01': 400,
      'L-OPS-01': 95,
    },
    pricingBasis: {
      raw: {
        currency: 'USD',
        period: 'annual',
        scenario: 'vendor-submitted',
      },
      normalized: {
        currency: 'USD',
        period: 'annual',
        scenario: 'locked-rfp-basis',
      },
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
    expect(sheet.getCell('E2').value).toBe(3_624_000);
    const tco = sheet.getCell('F2').value as number;
    expect(tco).toBeGreaterThan(11_300_000);
    expect(tco).toBeLessThan(11_320_000);
    // Deviations counts
    expect(sheet.getCell('G2').value).toBe(0);
    expect(sheet.getCell('G3').value).toBe(1);
    expect(sheet.getCell('G4').value).toBe(1);
  });

  it('blocks comparison and TCO claims when pricing basis metadata is missing', () => {
    const wb = buildPricingComparisonWorkbook(
      makePayload({
        submissions: [
          {
            vendorName: 'Raw Only Vendor',
            submittedAt: '2026-06-12T12:00:00.000Z',
            unitPricesById: {
              'L-CMP-01': 400,
              'L-OPS-01': 95,
            },
            pricingNotes: '',
            assumptionDeviations: [],
          },
        ],
      }),
    );

    const indexText = collectSheetText(wb.getWorksheet('Submissions Index')!);
    expect(indexText).toContain('Blocked');
    expect(indexText).toContain('normalized amount');

    const pricingSheet = wb.getWorksheet('Pricing Comparison')!;
    expect(pricingSheet.getCell('I3').value).toBe('BLOCKED');

    const tcoText = collectSheetText(wb.getWorksheet('TCO Comparison')!);
    expect(tcoText).toContain('TCO claims blocked');
    expect(tcoText).not.toContain('Cheapest 3-yr');
    expect(tcoText).not.toContain('Range (max−min)');

    const recommendationText = collectSheetText(wb.getWorksheet('Recommendation')!);
    expect(recommendationText).toContain('Pricing comparability blocked');
    expect(recommendationText).not.toContain('Cheapest 3-year TCO');
  });

  it('blocks comparison when normalized currency does not match the shared basis', () => {
    const wb = buildPricingComparisonWorkbook(
      makePayload({
        submissions: [
          makeSubmission({ vendorName: 'Acme' }),
          makeSubmission({
            vendorName: 'Beta',
            pricingBasis: {
              raw: {
                currency: 'USD',
                period: 'annual',
                scenario: 'vendor-submitted',
              },
              normalized: {
                currency: 'EUR',
                period: 'annual',
                scenario: 'locked-rfp-basis',
              },
            },
          }),
        ],
      }),
    );

    const indexText = collectSheetText(wb.getWorksheet('Submissions Index')!);
    expect(indexText).toContain('normalized_basis_mismatch');
    expect(indexText).toContain('currency');
  });

  it('Pricing Comparison sheet keeps raw and normalized unit prices distinct', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const sheet = wb.getWorksheet('Pricing Comparison')!;
    // Row 2 is sub-header.
    expect(sheet.getCell('F2').value).toBe('Raw Unit Price');
    expect(sheet.getCell('G2').value).toBe('Normalized Unit Price');
    expect(sheet.getCell('H2').value).toBe('Normalized Extended');
    expect(sheet.getCell('I2').value).toBe('Δ vs cheapest');
    expect(sheet.getCell('J2').value).toBe('Raw Unit Price'); // Vendor B
    expect(sheet.getCell('N2').value).toBe('Raw Unit Price'); // Vendor C
    // Row 3: first line item, Vendor A unit price
    expect(sheet.getCell('F3').value).toBe(400);
    expect(sheet.getCell('G3').value).toBe(400);
    // Vendor A normalized extended formula: =E3*G3
    expect(sheet.getCell('H3').value).toMatchObject({
      formula: expect.stringContaining('E3*G3'),
    });
    // Δ vs cheapest formula references MIN of all 3 normalized extended cells (H3, L3, P3)
    const deltaFormula = (sheet.getCell('I3').value as { formula: string }).formula;
    expect(deltaFormula).toContain('MIN(H3,L3,P3)');
  });

  it('Pricing Comparison totals row sums extended columns per vendor', () => {
    const wb = buildPricingComparisonWorkbook(makePayload());
    const sheet = wb.getWorksheet('Pricing Comparison')!;
    // 2 line items → totals at row 5 (header rows 1-2, line rows 3-4).
    expect(sheet.getCell('A5').value).toBe('TOTAL');
    expect(sheet.getCell('H5').value).toMatchObject({ formula: 'SUM(H3:H4)' });
    expect(sheet.getCell('L5').value).toMatchObject({ formula: 'SUM(L3:L4)' });
    expect(sheet.getCell('P5').value).toMatchObject({ formula: 'SUM(P3:P4)' });
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
    expect(sheet.getCell('F2').value).toBe('Raw Unit Price');
    expect(sheet.getCell('G2').value).toBe('Normalized Unit Price');
    expect(sheet.getCell('H2').value).toBe('Normalized Extended');
    expect(sheet.getCell('I2').value).toBe('Δ vs cheapest');
    // No second vendor → column J header should be empty.
    expect(sheet.getCell('J2').value).toBeFalsy();
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
