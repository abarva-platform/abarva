import ExcelJS from 'exceljs';
import {
  buildScorecardWorkbook,
  type ScorecardPayload,
} from '../renderers/scorecard';

function makePayload(
  overrides: Partial<ScorecardPayload> = {},
): ScorecardPayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    issuedBy: 'Janet Fischer, VP IT Ops',
    generatedAt: '2026-05-08T03:30:00.000Z',
    roundLabel: 'Initial · pre-BAFO',
    criteria: [
      {
        id: 'C-FUNCTIONAL',
        label: 'Functional fit',
        weightPercent: 25,
        description: 'Coverage of d04 inventory.',
      },
      {
        id: 'C-PRICING',
        label: 'Pricing & TCO',
        weightPercent: 50,
        description: 'd19 normalized 3-year TCO.',
      },
      {
        id: 'C-RISK',
        label: 'Risk profile',
        weightPercent: 25,
        description: 'd20 trap log + financial stability.',
      },
    ],
    vendors: ['Acme', 'Beta', 'Gamma'],
    scoreGuidance: [
      { score: 1, label: 'Does not meet', rubric: 'Material gap.' },
      { score: 3, label: 'Meets', rubric: 'Fully meets the requirement.' },
      { score: 5, label: 'Best in class', rubric: 'Differentiated.' },
    ],
    ...overrides,
  };
}

describe('buildScorecardWorkbook', () => {
  it('produces a workbook with the five canonical sheets', () => {
    const wb = buildScorecardWorkbook(makePayload());
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Cover',
      'Criteria & Weights',
      'Vendor Scoring',
      'Score Guidance',
      'Decision Notes',
    ]);
  });

  it('Cover sheet carries event metadata + Evaluator slot + round label', () => {
    const wb = buildScorecardWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Cover')!);
    expect(text).toContain('Meridian Health Cloud & Infrastructure');
    expect(text).toContain('MERI-CLOUD-2026');
    expect(text).toContain('Evaluator name');
    expect(text).toContain('Initial · pre-BAFO');
  });

  it('Criteria & Weights sheet has one row per criterion + a totals row that sums to 100', () => {
    const wb = buildScorecardWorkbook(makePayload());
    const sheet = wb.getWorksheet('Criteria & Weights')!;
    expect(sheet.getCell('B2').value).toBe('Functional fit');
    expect(sheet.getCell('C2').value).toBe(25);
    expect(sheet.getCell('B4').value).toBe('Risk profile');
    // Totals row should be at row 5 (3 criteria + header).
    expect(sheet.getCell('A5').value).toBe('TOTAL');
    expect(sheet.getCell('C5').value).toMatchObject({
      formula: 'SUM(C2:C4)',
    });
  });

  it('Vendor Scoring sheet builds a 2-column block per vendor with weighted formulas', () => {
    const wb = buildScorecardWorkbook(makePayload());
    const sheet = wb.getWorksheet('Vendor Scoring')!;
    // Row 1 = vendor labels (merged); row 2 = sub-headers; first criterion row = 3.
    expect(sheet.getCell('A2').value).toBe('Criterion');
    expect(sheet.getCell('B2').value).toBe('Weight (%)');
    expect(sheet.getCell('C2').value).toBe('Description');
    expect(sheet.getCell('D2').value).toBe('Raw (1-5)');
    expect(sheet.getCell('E2').value).toBe('Weighted');
    // Vendor A weighted formula on row 3 = D3 * B3.
    expect(sheet.getCell('E3').value).toMatchObject({
      formula: expect.stringContaining('D3*B3'),
    });
    // Vendor B is columns F (raw) and G (weighted).
    expect(sheet.getCell('G3').value).toMatchObject({
      formula: expect.stringContaining('F3*B3'),
    });
    // Vendor C is columns H (raw) and I (weighted).
    expect(sheet.getCell('I3').value).toMatchObject({
      formula: expect.stringContaining('H3*B3'),
    });
  });

  it('Vendor Scoring totals row sums weighted columns per vendor', () => {
    const wb = buildScorecardWorkbook(makePayload());
    const sheet = wb.getWorksheet('Vendor Scoring')!;
    // 3 criteria → totals at row 6 (header rows 1-2, criteria rows 3-5).
    expect(sheet.getCell('A6').value).toBe('TOTAL (weighted)');
    expect(sheet.getCell('E6').value).toMatchObject({
      formula: 'SUM(E3:E5)',
    });
    expect(sheet.getCell('G6').value).toMatchObject({
      formula: 'SUM(G3:G5)',
    });
    expect(sheet.getCell('I6').value).toMatchObject({
      formula: 'SUM(I3:I5)',
    });
  });

  it('Score Guidance sheet contains all rubric rows', () => {
    const wb = buildScorecardWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Score Guidance')!);
    expect(text).toContain('Does not meet');
    expect(text).toContain('Meets');
    expect(text).toContain('Best in class');
  });

  it('Decision Notes sheet contains seed topics', () => {
    const wb = buildScorecardWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Decision Notes')!);
    expect(text).toContain('Top-ranked vendor');
    expect(text).toContain('Tiebreaker');
  });

  it('escapes formula-prefix characters in user-supplied strings', () => {
    const wb = buildScorecardWorkbook(
      makePayload({
        criteria: [
          {
            id: 'C-X',
            label: '=cmd|"/c calc"!A0',
            weightPercent: 100,
            description: 'evil',
          },
        ],
      }),
    );
    const sheet = wb.getWorksheet('Criteria & Weights')!;
    const cell = sheet.getCell('B2').value;
    expect(typeof cell).toBe('string');
    expect((cell as string).startsWith("'=")).toBe(true);
  });

  it('handles a single vendor without breaking the column layout', () => {
    const wb = buildScorecardWorkbook(makePayload({ vendors: ['Solo'] }));
    const sheet = wb.getWorksheet('Vendor Scoring')!;
    expect(sheet.getCell('D2').value).toBe('Raw (1-5)');
    expect(sheet.getCell('E2').value).toBe('Weighted');
    // No second vendor → column F header should be empty.
    expect(sheet.getCell('F2').value).toBeFalsy();
  });

  it('serializes to a non-empty xlsx buffer', async () => {
    const wb = buildScorecardWorkbook(makePayload());
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
