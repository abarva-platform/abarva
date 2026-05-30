import ExcelJS from 'exceljs';

import { buildServiceNowCmdbWorkbook } from '@/lib/tower/ingest/servicenow-cmdb/template';
import { parseServiceNowCmdbWorkbook } from '@/lib/tower/ingest/servicenow-cmdb/parse';
import {
  CMDB_CI_COLUMNS,
  CMDB_DEPENDENCY_COLUMNS,
  CMDB_SHEET_CIS,
  CMDB_SHEET_DEPS,
  CMDB_SHEET_HOWTO,
  CMDB_SHEET_SCHEMA,
} from '@/lib/tower/ingest/servicenow-cmdb/schema';

async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

describe('ServiceNow CMDB · template shape', () => {
  it('blank template has the four required sheets and the header row in row 2 (banner is row 1)', async () => {
    const wb = await buildServiceNowCmdbWorkbook({ filled: false });
    expect(wb.getWorksheet(CMDB_SHEET_CIS)).toBeDefined();
    expect(wb.getWorksheet(CMDB_SHEET_DEPS)).toBeDefined();
    expect(wb.getWorksheet(CMDB_SHEET_HOWTO)).toBeDefined();
    expect(wb.getWorksheet(CMDB_SHEET_SCHEMA)).toBeDefined();

    const ciSheet = wb.getWorksheet(CMDB_SHEET_CIS)!;
    const banner = ciSheet.getRow(1).getCell(1).value;
    expect(String(banner)).toMatch(/BLANK TEMPLATE/);

    // Header row is row 2.
    for (let i = 0; i < CMDB_CI_COLUMNS.length; i += 1) {
      const headerCell = ciSheet.getRow(2).getCell(i + 1).value;
      expect(String(headerCell)).toBe(CMDB_CI_COLUMNS[i]!.header);
    }
  });

  it('filled template carries the synthetic-data banner', async () => {
    const wb = await buildServiceNowCmdbWorkbook({ filled: true });
    const ciSheet = wb.getWorksheet(CMDB_SHEET_CIS)!;
    const depSheet = wb.getWorksheet(CMDB_SHEET_DEPS)!;
    expect(String(ciSheet.getRow(1).getCell(1).value)).toMatch(/SYNTHETIC NORTHWIND/);
    expect(String(depSheet.getRow(1).getCell(1).value)).toMatch(/SYNTHETIC NORTHWIND/);
  });
});

describe('ServiceNow CMDB · parser', () => {
  it('parses both sheets from the filled template (banner-aware) into well-formed rows', async () => {
    const wb = await buildServiceNowCmdbWorkbook({ filled: true });
    const buf = await workbookToBuffer(wb);

    const result = await parseServiceNowCmdbWorkbook(buf);
    expect(result.cis.length).toBeGreaterThanOrEqual(200);
    expect(result.dependencies.length).toBeGreaterThanOrEqual(300);
    expect(result.issues).toEqual([]);

    // Every CI row has a 32-char sys_id and a non-empty name.
    for (const ci of result.cis.slice(0, 5)) {
      expect(ci.ciSysId).toMatch(/^[a-f0-9]{32}$/);
      expect(ci.ciName.length).toBeGreaterThan(0);
    }
    // Every dependency has one of three canonical types.
    const types = new Set(result.dependencies.map((d) => d.dependencyType));
    for (const t of types) expect(['depends_on', 'runs_on', 'connects_to']).toContain(t);
  });

  it('records issues for missing required columns and rejects invalid enum values', async () => {
    const wb = new ExcelJS.Workbook();
    const cis = wb.addWorksheet(CMDB_SHEET_CIS);
    // Intentionally omit the required `criticality` column.
    cis.addRow([
      'ci_sys_id',
      'ci_name',
      'ci_type',
      'ci_class',
      'lifecycle_state',
      'owner_team',
      'business_service',
      // criticality intentionally missing
      'environment',
    ]);
    cis.addRow([
      '11111111111111111111111111111111',
      'app-1',
      'application',
      'cmdb_ci_appl',
      'production',
      'Team A',
      'Service A',
      'prod',
    ]);
    const deps = wb.addWorksheet(CMDB_SHEET_DEPS);
    deps.addRow(['source_ci_sys_id', 'target_ci_sys_id', 'dependency_type']);
    deps.addRow([
      '11111111111111111111111111111111',
      '22222222222222222222222222222222',
      'NOT_A_REAL_TYPE',
    ]);

    const buf = Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer);
    const result = await parseServiceNowCmdbWorkbook(buf);
    expect(result.cis).toHaveLength(0);
    expect(
      result.issues.some(
        (i) => i.sheet === CMDB_SHEET_CIS && i.column === 'criticality',
      ),
    ).toBe(true);
    expect(
      result.issues.some(
        (i) => i.sheet === CMDB_SHEET_DEPS && i.column === 'dependency_type',
      ),
    ).toBe(true);
  });

  it('reports a missing-required-value issue but skips fully-blank rows', async () => {
    const wb = new ExcelJS.Workbook();
    const cis = wb.addWorksheet(CMDB_SHEET_CIS);
    cis.addRow(CMDB_CI_COLUMNS.map((c) => c.header));
    // Row with only sys_id — the rest are missing.
    cis.addRow([
      '33333333333333333333333333333333',
      '', '', '', '', '', '', '', '',
    ]);
    // Fully-blank row.
    cis.addRow(['', '', '', '', '', '', '', '', '']);
    const deps = wb.addWorksheet(CMDB_SHEET_DEPS);
    deps.addRow(CMDB_DEPENDENCY_COLUMNS.map((c) => c.header));

    const buf = Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer);
    const result = await parseServiceNowCmdbWorkbook(buf);
    expect(result.cis).toHaveLength(0);
    // Exactly one issue for the partially-blank row; the fully-blank
    // row is skipped silently.
    const partialIssues = result.issues.filter(
      (i) => i.sheet === CMDB_SHEET_CIS && i.message.startsWith('Missing required'),
    );
    expect(partialIssues).toHaveLength(1);
  });
});
