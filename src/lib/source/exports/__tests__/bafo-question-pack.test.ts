import ExcelJS from 'exceljs';
import {
  buildBafoQuestionPackWorkbook,
  type BafoQuestionPackPayload,
} from '../renderers/bafo-question-pack';

function makePayload(
  overrides: Partial<BafoQuestionPackPayload> = {},
): BafoQuestionPackPayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    issuedBy: 'Janet Fischer, VP IT Ops',
    generatedAt: '2026-05-08T03:30:00.000Z',
    roundLabel: 'BAFO Round 1',
    vendors: ['Acme', 'Beta', 'Gamma'],
    trapQuestions: [
      {
        id: 'TQ-EGRESS-01',
        source: 'T-EGRESS-01',
        severity: 'P0',
        question: 'Re Egress: provide your final position with redline.',
        responseFormat: 'Yes/no + redline + revised pricing impact ($)',
      },
      {
        id: 'TQ-SLA-01',
        source: 'T-SLA-01',
        severity: 'P1',
        question: 'Re SLA carve-out: redline or accommodate?',
        responseFormat: 'Yes/no + redline OR documented accommodation',
      },
    ],
    valueQuestions: [
      {
        id: 'VQ-INNOV-01',
        source: 'Innovation roadmap',
        severity: 'n/a',
        question: 'What roadmap investments will this engagement inherit?',
        responseFormat: 'Roadmap milestones + investment ($)',
      },
    ],
    ...overrides,
  };
}

describe('buildBafoQuestionPackWorkbook', () => {
  it('produces a workbook with the five canonical sheets', () => {
    const wb = buildBafoQuestionPackWorkbook(makePayload());
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Cover',
      'Vendors',
      'Trap-driven Questions',
      'Value-uplift Questions',
      'Vendor Response Grid',
    ]);
  });

  it('Vendors sheet has one row per shortlisted vendor', () => {
    const wb = buildBafoQuestionPackWorkbook(makePayload());
    const sheet = wb.getWorksheet('Vendors')!;
    expect(sheet.getCell('B2').value).toBe('Acme');
    expect(sheet.getCell('B3').value).toBe('Beta');
    expect(sheet.getCell('B4').value).toBe('Gamma');
  });

  it('Trap-driven Questions sheet preserves question + severity', () => {
    const wb = buildBafoQuestionPackWorkbook(makePayload());
    const sheet = wb.getWorksheet('Trap-driven Questions')!;
    expect(sheet.getCell('A2').value).toBe('TQ-EGRESS-01');
    expect(sheet.getCell('C2').value).toBe('P0');
    expect(sheet.getCell('A3').value).toBe('TQ-SLA-01');
    expect(sheet.getCell('C3').value).toBe('P1');
  });

  it('Vendor Response Grid lays out 2 columns per vendor with score validation', () => {
    const wb = buildBafoQuestionPackWorkbook(makePayload());
    const sheet = wb.getWorksheet('Vendor Response Grid')!;
    // Row 1: vendor labels, Row 2: sub-headers
    expect(sheet.getCell('A2').value).toBe('Question ID');
    expect(sheet.getCell('B2').value).toBe('Severity');
    expect(sheet.getCell('C2').value).toBe('Response');
    expect(sheet.getCell('D2').value).toBe('Score (1-5)');
    // Vendor B response column = E, score = F
    expect(sheet.getCell('E2').value).toBe('Response');
    expect(sheet.getCell('F2').value).toBe('Score (1-5)');
    // Question rows start at row 3
    expect(sheet.getCell('A3').value).toBe('TQ-EGRESS-01');
    expect(sheet.getCell('B3').value).toBe('P0');
  });

  it('Vendor Response Grid totals row averages each vendor score column', () => {
    const wb = buildBafoQuestionPackWorkbook(makePayload());
    const sheet = wb.getWorksheet('Vendor Response Grid')!;
    // 3 questions (2 trap + 1 value) → totals at row 6 (header rows 1-2, data rows 3-5)
    expect(sheet.getCell('A6').value).toBe('AVERAGE');
    expect(sheet.getCell('D6').value).toMatchObject({
      formula: expect.stringContaining('AVERAGE(D3:D5)'),
    });
    expect(sheet.getCell('F6').value).toMatchObject({
      formula: expect.stringContaining('AVERAGE(F3:F5)'),
    });
    expect(sheet.getCell('H6').value).toMatchObject({
      formula: expect.stringContaining('AVERAGE(H3:H5)'),
    });
  });

  it('escapes formula-prefix characters in user-supplied strings', () => {
    const wb = buildBafoQuestionPackWorkbook(
      makePayload({
        trapQuestions: [
          {
            id: 'TQ-X',
            source: '=cmd|"/c calc"!A0',
            severity: 'P0',
            question: '+attack',
            responseFormat: '@me',
          },
        ],
      }),
    );
    const sheet = wb.getWorksheet('Trap-driven Questions')!;
    expect((sheet.getCell('B2').value as string).startsWith("'=")).toBe(true);
  });

  it('handles a single vendor without breaking the response-grid layout', () => {
    const wb = buildBafoQuestionPackWorkbook(
      makePayload({ vendors: ['Solo'] }),
    );
    const sheet = wb.getWorksheet('Vendor Response Grid')!;
    expect(sheet.getCell('C2').value).toBe('Response');
    expect(sheet.getCell('D2').value).toBe('Score (1-5)');
    expect(sheet.getCell('E2').value).toBeFalsy();
  });

  it('serializes to a non-empty xlsx buffer', async () => {
    const wb = buildBafoQuestionPackWorkbook(makePayload());
    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(4000);
  });
});
