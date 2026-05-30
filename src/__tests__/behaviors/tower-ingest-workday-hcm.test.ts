// Tower ingest · Workday HCM — parser / validator / synthetic generator tests.
//
// Pure logic only (no DB). Aim:
//   1. parser handles aliased headers and tolerated date formats
//   2. parser rejects invalid functions / non-boolean contractor flags / bad dates
//   3. attrition_date < start_date is rejected
//   4. validator detects duplicate employee_ids within an extract
//   5. synthetic Northwind generator hits PII discipline + headcount targets
//   6. registry has the dataClass=restricted entry

import Papa from 'papaparse';
import { ONBOARDING_CATALOG } from '@/lib/tower/onboarding-catalog';
import { parseWorkdayHcmCsv } from '@/lib/tower/ingest/workday-hcm/parse';
import { validateParseResult } from '@/lib/tower/ingest/workday-hcm/validate';
import { generateNorthwindWorkforce } from '@/lib/tower/ingest/workday-hcm/synthetic';
import {
  ATTRITION_REASON_ENUM,
  WORKDAY_FUNCTION_ENUM,
} from '@/lib/tower/ingest/workday-hcm/types';

function csv(rows: Array<Record<string, string>>): string {
  return Papa.unparse(rows);
}

describe('parseWorkdayHcmCsv', () => {
  it('parses a minimal valid row with canonical headers', () => {
    const out = parseWorkdayHcmCsv(csv([
      {
        employee_id: 'EMP-NW-00001',
        function: 'Stores',
        contractor_flag: 'false',
        start_date: '2022-01-15',
      },
    ]));
    expect(out.errors).toHaveLength(0);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0]).toMatchObject({
      employee_id: 'EMP-NW-00001',
      function: 'Stores',
      contractor_flag: false,
      start_date: '2022-01-15',
      attrition_date: null,
      attrition_reason: null,
    });
  });

  it('accepts Workday-export header aliases', () => {
    const out = parseWorkdayHcmCsv(csv([
      {
        'Worker ID': 'EMP-NW-00002',
        'Job Family Group': 'Customer Care',
        'Job Family': 'Tier 1 Voice',
        'Work Location': 'Columbus, OH',
        'Career Level': 'IC2',
        'Worker Type': 'FTE',
        'Hire Date': '6/14/2021',
        'Termination Date': '',
      },
    ]));
    expect(out.errors).toHaveLength(0);
    expect(out.rows[0].function).toBe('Customer Care');
    expect(out.rows[0].sub_function).toBe('Tier 1 Voice');
    // M/D/YYYY -> ISO
    expect(out.rows[0].start_date).toBe('2021-06-14');
  });

  it('rejects function values outside the enum', () => {
    const out = parseWorkdayHcmCsv(csv([
      {
        employee_id: 'EMP-NW-00003',
        function: 'Astronaut Corps',
        contractor_flag: 'false',
        start_date: '2022-01-15',
      },
    ]));
    expect(out.rows).toHaveLength(0);
    expect(out.errors[0]).toMatchObject({ field: 'function' });
  });

  it('rejects non-boolean contractor_flag', () => {
    const out = parseWorkdayHcmCsv(csv([
      {
        employee_id: 'EMP-NW-00004',
        function: 'IT',
        contractor_flag: 'maybe',
        start_date: '2022-01-15',
      },
    ]));
    expect(out.rows).toHaveLength(0);
    expect(out.errors[0]).toMatchObject({ field: 'contractor_flag' });
  });

  it('rejects rows where attrition_date is before start_date', () => {
    const out = parseWorkdayHcmCsv(csv([
      {
        employee_id: 'EMP-NW-00005',
        function: 'Stores',
        contractor_flag: 'false',
        start_date: '2022-06-01',
        attrition_date: '2020-12-31',
      },
    ]));
    expect(out.rows).toHaveLength(0);
    expect(out.errors[0]).toMatchObject({ field: 'attrition_date' });
    expect(out.errors[0].message).toMatch(/before start_date/);
  });

  it('reports an error and zero rows when a required column is missing', () => {
    const out = parseWorkdayHcmCsv(csv([
      { employee_id: 'EMP-NW-00006', start_date: '2022-01-15' },
    ]));
    expect(out.rows).toHaveLength(0);
    expect(out.errors.some((e) => e.field === 'function')).toBe(true);
    expect(out.errors.some((e) => e.field === 'contractor_flag')).toBe(true);
  });
});

describe('validateParseResult', () => {
  it('detects duplicate employee_ids within an extract', () => {
    const parsed = parseWorkdayHcmCsv(csv([
      { employee_id: 'EMP-NW-00001', function: 'Stores', contractor_flag: 'false', start_date: '2022-01-15' },
      { employee_id: 'EMP-NW-00001', function: 'IT',     contractor_flag: 'false', start_date: '2023-01-15' },
    ]));
    const summary = validateParseResult(parsed);
    expect(summary.errors.some((e) => e.message.startsWith('duplicate'))).toBe(true);
  });

  it('aggregates FTE / contractor / function counts', () => {
    const parsed = parseWorkdayHcmCsv(csv([
      { employee_id: 'EMP-NW-00001', function: 'Stores',       contractor_flag: 'false', start_date: '2022-01-15' },
      { employee_id: 'EMP-NW-00002', function: 'IT',           contractor_flag: 'true',  start_date: '2023-01-15' },
      { employee_id: 'EMP-NW-00003', function: 'Customer Care', contractor_flag: 'false', start_date: '2024-01-15' },
    ]));
    const summary = validateParseResult(parsed);
    expect(summary.contractorCount).toBe(1);
    expect(summary.fteCount).toBe(2);
    expect(summary.functionsSeen.size).toBe(3);
  });
});

describe('generateNorthwindWorkforce (PII discipline + shape)', () => {
  const rows = generateNorthwindWorkforce({ asOfDate: '2026-05-30' });

  it('produces ~1080 rows (1000 FTE + 80 contractors by default)', () => {
    expect(rows.length).toBe(1080);
    expect(rows.filter((r) => r.contractor_flag).length).toBe(80);
    expect(rows.filter((r) => !r.contractor_flag).length).toBe(1000);
  });

  it('uses synthetic generator IDs only (no real names)', () => {
    rows.forEach((r) => {
      expect(r.employee_id).toMatch(/^EMP-NW-\d{5}$/);
    });
  });

  it('all rows have a function from the enum', () => {
    const enumSet = new Set<string>(WORKDAY_FUNCTION_ENUM);
    rows.forEach((r) => expect(enumSet.has(r.function)).toBe(true));
  });

  it('attrition rows have a valid reason from the enum', () => {
    const reasonSet = new Set<string>(ATTRITION_REASON_ENUM);
    rows
      .filter((r) => r.attrition_date !== null)
      .forEach((r) => {
        expect(r.attrition_reason).not.toBeNull();
        expect(reasonSet.has(r.attrition_reason as string)).toBe(true);
        expect(r.attrition_date! >= r.start_date).toBe(true);
      });
  });

  it('hits multiple functions and multiple locations (plausible spread)', () => {
    const fns = new Set(rows.map((r) => r.function));
    const locs = new Set(rows.map((r) => r.location));
    expect(fns.size).toBeGreaterThanOrEqual(8);
    expect(locs.size).toBeGreaterThanOrEqual(5);
  });

  it('serialises back through the parser without loss (round-trip)', () => {
    const headers = Object.keys(rows[0]);
    const text = Papa.unparse(rows, { columns: headers });
    const reparsed = parseWorkdayHcmCsv(text);
    expect(reparsed.errors).toHaveLength(0);
    expect(reparsed.rows.length).toBe(rows.length);
  });

  it('is deterministic for the same seed', () => {
    const a = generateNorthwindWorkforce({ asOfDate: '2026-05-30', seed: 42 });
    const b = generateNorthwindWorkforce({ asOfDate: '2026-05-30', seed: 42 });
    expect(a[0]).toEqual(b[0]);
    expect(a[a.length - 1]).toEqual(b[b.length - 1]);
  });
});

describe('onboarding catalog · workday_hcm entry', () => {
  it('is present with dataClass=restricted', () => {
    const entry = ONBOARDING_CATALOG.find((e) => e.key === 'workday_hcm');
    expect(entry).toBeDefined();
    expect(entry?.dataClass).toBe('restricted');
    expect(entry?.fields.length).toBeGreaterThan(5);
  });
});
