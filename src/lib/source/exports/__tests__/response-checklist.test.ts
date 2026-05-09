import ExcelJS from 'exceljs';
import {
  buildResponseChecklistWorkbook,
  type ResponseChecklistPayload,
} from '../renderers/response-checklist';

function makePayload(
  overrides: Partial<ResponseChecklistPayload> = {},
): ResponseChecklistPayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    issuedBy: 'Janet Fischer, VP IT Ops',
    generatedAt: '2026-05-08T03:30:00.000Z',
    submissionDeadline: '2026-06-15T17:00:00.000Z',
    mandatoryItems: [
      {
        id: 'M-EXEC-01',
        section: 'Executive summary',
        requirement: 'Executive summary (≤ 2 pages).',
      },
      {
        id: 'M-PRICING-01',
        section: 'Pricing',
        requirement: 'Submit d19 pricing workbook against locked assumption set.',
      },
    ],
    optionalItems: [
      {
        id: 'O-AI-01',
        section: 'AI / automation',
        requirement: 'AI uses in delivery with productivity claims.',
      },
    ],
    formatExpectations: [
      { topic: 'File formats', requirement: 'PDF + native xlsx.' },
      { topic: 'Filename convention', requirement: '{vendor}__{eventCode}__{artifact}.{ext}' },
    ],
    certifications: [
      'Officer is authorized to bind the Vendor.',
      'Pricing firm for 90 days.',
    ],
    ...overrides,
  };
}

describe('buildResponseChecklistWorkbook', () => {
  it('produces a workbook with the five canonical sheets', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Cover',
      'Mandatory Items',
      'Optional Items',
      'Format Expectations',
      'Submission Sign-off',
    ]);
  });

  it('Cover sheet carries event metadata + a Vendor name slot + submission deadline', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Cover')!);
    expect(text).toContain('Meridian Health Cloud & Infrastructure');
    expect(text).toContain('MERI-CLOUD-2026');
    expect(text).toContain('Vendor name');
    expect(text).toContain('2026-06-15T17:00:00.000Z');
  });

  it('Mandatory Items sheet has one row per item with the buyer columns locked-styled', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const sheet = wb.getWorksheet('Mandatory Items')!;
    expect(sheet.getCell('A2').value).toBe('M-EXEC-01');
    expect(sheet.getCell('A3').value).toBe('M-PRICING-01');
    expect(sheet.getCell('C3').value).toContain('d19');
    // Vendor confirmation column starts blank; data validation present.
    expect(sheet.getCell('D2').value).toBe('');
    expect(sheet.getCell('D2').dataValidation?.type).toBe('list');
  });

  it('Optional Items sheet preserves N/A as a valid value', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const sheet = wb.getWorksheet('Optional Items')!;
    expect(sheet.getCell('A2').value).toBe('O-AI-01');
    const validation = sheet.getCell('D2').dataValidation;
    expect(validation?.formulae?.[0]).toContain('N/A');
  });

  it('Format Expectations sheet contains every supplied row', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Format Expectations')!);
    expect(text).toContain('File formats');
    expect(text).toContain('Filename convention');
  });

  it('Submission Sign-off sheet contains certifications + sign-off fields', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Submission Sign-off')!);
    expect(text).toContain('Vendor legal name');
    expect(text).toContain('Authorized signing officer (name + title)');
    expect(text).toContain('Officer is authorized to bind the Vendor.');
  });

  it('escapes formula-prefix characters in user-supplied strings', () => {
    const wb = buildResponseChecklistWorkbook(
      makePayload({
        mandatoryItems: [
          {
            id: 'M-X-01',
            section: 'Pricing',
            requirement: '=cmd|"/c calc"!A0',
          },
        ],
      }),
    );
    const sheet = wb.getWorksheet('Mandatory Items')!;
    const cell = sheet.getCell('C2').value;
    expect(typeof cell).toBe('string');
    expect((cell as string).startsWith("'=")).toBe(true);
  });

  it('serializes to a non-empty xlsx buffer', async () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
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
