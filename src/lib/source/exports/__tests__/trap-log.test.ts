import ExcelJS from 'exceljs';
import {
  buildTrapLogWorkbook,
  type TrapLogPayload,
} from '../renderers/trap-log';

function makePayload(overrides: Partial<TrapLogPayload> = {}): TrapLogPayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    issuedBy: 'Janet Fischer, VP IT Ops',
    generatedAt: '2026-05-08T03:30:00.000Z',
    severityDefinitions: [
      { severity: 'P0', label: 'Deal-shaping', rubric: 'Material to TCO/risk by ≥ 15%.' },
      { severity: 'P1', label: 'Material', rubric: '3-15% TCO impact.' },
      { severity: 'P2', label: 'Noted', rubric: 'Surfaced for transparency.' },
    ],
    rows: [
      {
        id: 'T-EGRESS-01',
        severity: 'P0',
        category: 'Egress',
        description: 'Egress charges exceed assumption-set ceiling.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
      {
        id: 'T-SLA-01',
        severity: 'P1',
        category: 'SLA carve-out',
        description: 'Maintenance windows reduce effective uptime.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
      {
        id: 'T-AUDIT-01',
        severity: 'P2',
        category: 'Audit access',
        description: 'Audit clause caps third-party access.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
    ],
    ...overrides,
  };
}

describe('buildTrapLogWorkbook', () => {
  it('produces a workbook with the four canonical sheets', () => {
    const wb = buildTrapLogWorkbook(makePayload());
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Cover',
      'Severity Definitions',
      'Trap Log',
      'Resolution Summary',
    ]);
  });

  it('Severity Definitions sheet contains the rubric rows', () => {
    const wb = buildTrapLogWorkbook(makePayload());
    const sheet = wb.getWorksheet('Severity Definitions')!;
    expect(sheet.getCell('A2').value).toBe('P0');
    expect(sheet.getCell('B2').value).toBe('Deal-shaping');
    expect(sheet.getCell('A4').value).toBe('P2');
  });

  it('Trap Log sheet has one row per trap with editable resolution columns', () => {
    const wb = buildTrapLogWorkbook(makePayload());
    const sheet = wb.getWorksheet('Trap Log')!;
    expect(sheet.getCell('A2').value).toBe('T-EGRESS-01');
    expect(sheet.getCell('B2').value).toBe('P0');
    expect(sheet.getCell('A3').value).toBe('T-SLA-01');
    // Resolution columns start blank — vendor-fillable.
    expect(sheet.getCell('G2').value).toBe('');
    expect(sheet.getCell('G2').dataValidation?.type).toBe('list');
  });

  it('Resolution Summary uses formula-driven counts referencing the Trap Log range', () => {
    const wb = buildTrapLogWorkbook(makePayload());
    const sheet = wb.getWorksheet('Resolution Summary')!;
    expect(sheet.getCell('B2').value).toMatchObject({ formula: expect.stringContaining('COUNTA') });
    expect(sheet.getCell('B3').value).toMatchObject({ formula: expect.stringContaining('COUNTIF') });
    expect(sheet.getCell('B6').value).toMatchObject({ formula: expect.stringContaining('Open') });
  });

  it('escapes formula-prefix characters in user-supplied strings', () => {
    const wb = buildTrapLogWorkbook(
      makePayload({
        rows: [
          {
            id: 'evil',
            severity: 'P0',
            category: '=cmd|"/c calc"!A0',
            description: '+attack',
            surfacedFor: '@me',
            surfacedBy: '-bad',
          },
        ],
      }),
    );
    const sheet = wb.getWorksheet('Trap Log')!;
    const cell = sheet.getCell('C2').value as string;
    expect(cell.startsWith("'=")).toBe(true);
  });

  it('serializes to a non-empty xlsx buffer', async () => {
    const wb = buildTrapLogWorkbook(makePayload());
    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(4000);
  });
});
