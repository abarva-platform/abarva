import ExcelJS from 'exceljs';
import {
  buildResponseChecklistWorkbook,
  type ResponseChecklistPayload,
} from '../renderers/response-checklist';
import { parseChecklistFromRfp } from '../payloads/response-checklist-payload';

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
        category: 'commercial and pricing',
        requirementLevel: 'Scored',
        responseType: 'Pricing',
        evidenceRequired: true,
        evaluationCriterionId: 'CRIT-COMMERCIAL-01',
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
  it('preserves the issued RFP requirement matrix before using legacy bullet parsing', () => {
    const parsed = parseChecklistFromRfp(`
## Requirement Response Matrix
| Requirement ID | Requirement Category | RFP Section | Requirement Statement | Mandatory / Scored / Informational | Response Type | Evidence Required | Evaluation Criterion ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-SCOPE-001 | service scope | Scope | Confirm the application boundary. | Mandatory | Evidence | Yes | |
| REQ-PRICE-001 | commercial and pricing | Pricing | Submit normalized run pricing. | Scored | Pricing | Yes | CRIT-COMMERCIAL-01 |
| REQ-INNOV-001 | innovation and value | Innovation | Describe optional innovation ideas. | Informational | Narrative | No | |
`);

    expect(parsed.mandatory).toHaveLength(2);
    expect(parsed.optional).toHaveLength(1);
    expect(parsed.mandatory[1]).toMatchObject({
      id: 'REQ-PRICE-001',
      category: 'commercial and pricing',
      section: 'Pricing',
      requirement: 'Submit normalized run pricing.',
      requirementLevel: 'Scored',
      responseType: 'Pricing',
      evidenceRequired: true,
      evaluationCriterionId: 'CRIT-COMMERCIAL-01',
    });
  });

  it('produces one governed workbook with every required response-control sheet', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Guide',
      'Cover',
      'Mandatory Compliance',
      'Optional Items',
      'Vendor Claims',
      'Solution Approach',
      'Pricing Response',
      'Staffing & Location',
      'SLA Commitments',
      'Automation Commitments',
      'Assumptions & Exclusions',
      'Transition Plan',
      'Commercial Exceptions',
      'Evidence Checklist',
      'Format Expectations',
      'Submission Sign-off',
    ]);
  });

  it('Guide sheet explains completion rules and vendor-facing purpose', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Guide')!);
    expect(text).toContain('Vendor Response Control Pack');
    expect(text).toContain('Vendor-facing response workbook');
    expect(text).toContain('Mandatory Compliance');
    expect(text).toContain('Automation Commitments');
    expect(text).toContain('Evidence references');
    expect(text).toContain('Partially Comply');
    expect(text).toContain('requirement-ID level');
  });

  it('Cover sheet carries event metadata + a Vendor name slot + submission deadline', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Cover')!);
    expect(text).toContain('Meridian Health Cloud & Infrastructure');
    expect(text).toContain('MERI-CLOUD-2026');
    expect(text).toContain('Vendor name');
    expect(text).toContain('2026-06-15T17:00:00.000Z');
  });

  it('Mandatory Compliance sheet has one row per item with the buyer columns locked-styled', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const sheet = wb.getWorksheet('Mandatory Compliance')!;
    expect(sheet.getCell('A2').value).toBe('M-EXEC-01');
    expect(sheet.getCell('A3').value).toBe('M-PRICING-01');
    expect(sheet.getCell('D3').value).toContain('d19');
    // Vendor disposition starts blank; data validation is constrained.
    expect(sheet.getCell('I2').value).toBe('');
    expect(sheet.getCell('I2').dataValidation?.type).toBe('list');
  });

  it('issues a normalized requirement matrix that preserves scoring and evidence lineage', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const sheet = wb.getWorksheet('Mandatory Compliance')!;

    expect(sheet.getRow(1).values).toEqual(
      expect.arrayContaining([
        'Requirement ID',
        'Requirement category',
        'Requirement level',
        'Response type',
        'Evaluation criterion ID',
        'Evidence required',
        'Response disposition',
        'Pricing reference',
        'SLA / KPI reference',
        'Assumption / exception reference',
        'Vendor owner',
      ]),
    );
    expect(sheet.getCell('B3').value).toBe('commercial and pricing');
    expect(sheet.getCell('E3').value).toBe('Scored');
    expect(sheet.getCell('F3').value).toBe('Pricing');
    expect(sheet.getCell('G3').value).toBe('CRIT-COMMERCIAL-01');
    expect(sheet.getCell('H3').value).toBe('Yes');
    expect(sheet.getCell('I3').dataValidation.formulae).toEqual([
      '"Comply,Partially Comply,Exception,Not Applicable"',
    ]);
    expect(sheet.getCell('A3').protection.locked).toBe(true);
    expect(sheet.getCell('I3').protection.locked).toBe(false);
  });

  it('requires measurable automation claims and complete commercial controls', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const automation = wb.getWorksheet('Automation Commitments')!;
    const pricing = wb.getWorksheet('Pricing Response')!;
    const staffing = wb.getWorksheet('Staffing & Location')!;
    const sla = wb.getWorksheet('SLA Commitments')!;
    const evidence = wb.getWorksheet('Evidence Checklist')!;

    expect(collectSheetText(automation)).toContain('Measurement source');
    expect(collectSheetText(automation)).toContain('Commercial remedy');
    expect(automation.getCell('A3').value).toBe('AUTO-001');
    expect(automation.getCell('B3').dataValidation?.type).toBe('list');
    expect(collectSheetText(pricing)).toContain('Productivity credit');
    expect(collectSheetText(pricing)).toContain('retained costs');
    expect(collectSheetText(staffing)).toContain('Productive hours / FTE');
    expect(collectSheetText(sla)).toContain('Chronic miss remedy');
    expect(collectSheetText(evidence)).toContain('Tab / page / row');
  });

  it('fits every sheet to one printed page width', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    for (const sheet of wb.worksheets) {
      expect(sheet.pageSetup.fitToPage).toBe(true);
      expect(sheet.pageSetup.fitToWidth).toBe(1);
      expect(sheet.pageSetup.fitToHeight).toBe(0);
      expect(sheet.headerFooter.oddFooter).toContain('Page &P of &N');
    }
  });

  it('Optional Items sheet preserves N/A as a valid value', () => {
    const wb = buildResponseChecklistWorkbook(makePayload());
    const sheet = wb.getWorksheet('Optional Items')!;
    expect(sheet.getCell('A2').value).toBe('O-AI-01');
    const validation = sheet.getCell('I2').dataValidation;
    expect(validation?.formulae?.[0]).toContain('Not Applicable');
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
    const sheet = wb.getWorksheet('Mandatory Compliance')!;
    const cell = sheet.getCell('D2').value;
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
