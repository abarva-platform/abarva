import ExcelJS from 'exceljs';
import {
  buildAppInventoryWorkbook,
  type AppInventoryPayload,
} from '../renderers/app-inventory';

function makePayload(
  overrides: Partial<AppInventoryPayload> = {},
): AppInventoryPayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    issuedBy: 'Janet Fischer, VP IT Ops',
    generatedAt: '2026-05-08T03:30:00.000Z',
    tierDefinitions: [
      {
        tier: 1,
        label: 'Mission-critical',
        criterion: 'Outage halts revenue or hurts patients.',
        recoveryObjective: 'RTO < 4h',
        examples: 'Epic CIS, MyChart',
      },
      {
        tier: 2,
        label: 'Important',
        criterion: 'Productivity loss within hours.',
        recoveryObjective: 'RTO < 24h',
        examples: 'ServiceNow ITSM',
      },
      {
        tier: 3,
        label: 'Standard',
        criterion: 'Tolerable for days.',
        recoveryObjective: 'RTO < 72h',
        examples: 'Archive systems',
      },
    ],
    rows: [
      {
        id: 'A-EPIC-01',
        name: 'Epic CIS',
        tier: 1,
        owner: 'Karen Liu',
        techStack: 'Cache MUMPS / Java',
        hostingToday: 'Newark colo · 12 VMs',
        annualWorkloadCount: 24000,
        inScope: true,
        notes: 'Tier-1 clinical; 24×7 support required.',
      },
      {
        id: 'A-MYCHART-02',
        name: 'MyChart',
        tier: 1,
        owner: 'Karen Liu',
        techStack: 'Java / OAuth',
        hostingToday: 'Newark colo · 6 VMs',
        annualWorkloadCount: 12000,
        inScope: true,
      },
      {
        id: 'A-ARCHIVE-03',
        name: 'Archive system',
        tier: 0, // unclassified — should color the cell amber
        owner: '',
        techStack: '',
        hostingToday: '',
        annualWorkloadCount: 0,
        inScope: false,
      },
    ],
    ...overrides,
  };
}

describe('buildAppInventoryWorkbook', () => {
  it('produces a workbook with the four canonical sheets', () => {
    const wb = buildAppInventoryWorkbook(makePayload());
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Cover',
      'Tier Definitions',
      'Application Inventory',
      'Inventory Summary',
    ]);
  });

  it('Cover sheet carries event metadata + an Inventory lead slot', () => {
    const wb = buildAppInventoryWorkbook(makePayload());
    const text = collectSheetText(wb.getWorksheet('Cover')!);
    expect(text).toContain('Meridian Health Cloud & Infrastructure');
    expect(text).toContain('MERI-CLOUD-2026');
    expect(text).toContain('Inventory lead');
  });

  it('Tier Definitions sheet has one row per tier with rubric content', () => {
    const wb = buildAppInventoryWorkbook(makePayload());
    const sheet = wb.getWorksheet('Tier Definitions')!;
    const text = collectSheetText(sheet);
    expect(text).toContain('Mission-critical');
    expect(text).toContain('Important');
    expect(text).toContain('Standard');
    expect(text).toContain('RTO < 4h');
  });

  it('Application Inventory sheet preserves application names and tier values', () => {
    const wb = buildAppInventoryWorkbook(makePayload());
    const sheet = wb.getWorksheet('Application Inventory')!;
    expect(sheet.getCell('B2').value).toBe('Epic CIS');
    expect(sheet.getCell('C2').value).toBe(1);
    expect(sheet.getCell('B3').value).toBe('MyChart');
    expect(sheet.getCell('H2').value).toBe('Y');
    expect(sheet.getCell('H4').value).toBe('N');
    // Tier 0 row leaves the tier cell blank.
    expect(sheet.getCell('C4').value).toBeFalsy();
  });

  it('Inventory Summary sheet has formula-driven counts that target the Application Inventory range', () => {
    const wb = buildAppInventoryWorkbook(makePayload());
    const sheet = wb.getWorksheet('Inventory Summary')!;
    // First metric row = Total applications inventoried via COUNTA.
    expect(sheet.getCell('B2').value).toMatchObject({
      formula: expect.stringContaining('COUNTA'),
    });
    expect(sheet.getCell('B3').value).toMatchObject({
      formula: expect.stringContaining('COUNTIF'),
    });
    expect(sheet.getCell('B8').value).toMatchObject({
      formula: expect.stringContaining('SUMIFS'),
    });
  });

  it('escapes formula-prefix characters in user-supplied strings', () => {
    const wb = buildAppInventoryWorkbook(
      makePayload({
        rows: [
          {
            id: 'evil',
            name: '=cmd|"/c calc"!A0',
            tier: 1,
            owner: '@bad',
            techStack: '+attack',
            hostingToday: '-attack',
            annualWorkloadCount: 0,
            inScope: true,
          },
        ],
      }),
    );
    const sheet = wb.getWorksheet('Application Inventory')!;
    const nameCell = sheet.getCell('B2').value;
    expect(typeof nameCell).toBe('string');
    expect((nameCell as string).startsWith("'=")).toBe(true);
  });

  it('serializes to a non-empty xlsx buffer', async () => {
    const wb = buildAppInventoryWorkbook(makePayload());
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
