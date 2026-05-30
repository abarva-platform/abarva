// Tower · ERP ingest · parser + validator tests.
//
// Coverage:
//  · Round-trip a synthetic dataset through the workbook builder and
//    the parser — every row must come back identical.
//  · Source-system header inference (Oracle, SAP, neutral).
//  · Validation: capex+opex > actual rejected with row-level reason.
//  · Validation: period_start > period_end rejected.
//  · Validation: vendor_id FK to Vendor Spend sheet.
//  · Validation: duplicate (program_id, period_start) rejected.
//  · Validation: missing required sheet rejected.

import ExcelJS from 'exceljs';
import {
  ERP_FINANCIALS_SHEET,
  ERP_VENDOR_SPEND_SHEET,
  parseErpWorkbook,
} from '../parse';
import { buildErpWorkbook } from '../template-builder';
import { buildSyntheticNorthwindDataset } from '../sample-data';

async function makeWorkbookBuffer(
  finRows: Array<Record<string, string | number>>,
  venRows: Array<Record<string, string | number>>,
  finHeaders: string[] = [
    'program_id',
    'period_start',
    'period_end',
    'budget_usd',
    'actual_usd',
    'capex_usd',
    'opex_usd',
    'vendor_id',
    'cost_center',
    'gl_account',
  ],
  venHeaders: string[] = [
    'vendor_id',
    'vendor_name',
    'cost_center',
    'gl_account',
    'ttm_spend_usd',
  ],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const fin = wb.addWorksheet(ERP_FINANCIALS_SHEET);
  fin.getRow(1).values = ['banner'];
  fin.getRow(2).values = ['title'];
  fin.getRow(3).values = finHeaders;
  finRows.forEach((r, i) => {
    fin.getRow(4 + i).values = finHeaders.map((h) => r[h] ?? '');
  });
  const ven = wb.addWorksheet(ERP_VENDOR_SPEND_SHEET);
  ven.getRow(1).values = ['banner'];
  ven.getRow(2).values = ['title'];
  ven.getRow(3).values = venHeaders;
  venRows.forEach((r, i) => {
    ven.getRow(4 + i).values = venHeaders.map((h) => r[h] ?? '');
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

describe('parseErpWorkbook · happy paths', () => {
  it('round-trips the synthetic Northwind dataset', async () => {
    const ds = buildSyntheticNorthwindDataset({ programCount: 50 });
    const buffer = await buildErpWorkbook({ filled: { financials: ds.financials, vendors: ds.vendors } });
    const result = await parseErpWorkbook(buffer);

    expect(result.errors).toEqual([]);
    expect(result.vendors).toHaveLength(ds.vendors.length);
    expect(result.financials).toHaveLength(ds.financials.length);

    // Spot-check the first row in each sheet matches.
    expect(result.vendors[0].vendor_id).toBe(ds.vendors[0].vendor_id);
    expect(result.vendors[0].vendor_name).toBe(ds.vendors[0].vendor_name);
    expect(result.financials[0].program_id).toBe(ds.financials[0].program_id);
    expect(result.financials[0].budget_usd).toBeCloseTo(ds.financials[0].budget_usd ?? 0, 2);
    expect(result.financials[0].actual_usd).toBeCloseTo(ds.financials[0].actual_usd ?? 0, 2);
  });

  it('honors Oracle-style headers and tags source as oracle_gl_ap', async () => {
    const buffer = await makeWorkbookBuffer(
      [
        {
          'Project Number': 'P-100',
          'Posting Date From': '2025-01-01',
          'Posting Date To': '2025-01-31',
          'Plan Amount': '100000',
          'Actual Cost': '95000',
          'Capital Cost': '30000',
          'Operating Cost': '65000',
          'Supplier ID': 'V-1',
          'Cost Center': 'CC-100',
          'Natural Account': '6210',
        },
      ],
      [
        {
          'Supplier ID': 'V-1',
          'Supplier Name': 'Test Vendor',
          'Cost Center': 'CC-100',
          'Natural Account': '6210',
          'TTM Spend': '1200000',
        },
      ],
      [
        'Project Number',
        'Posting Date From',
        'Posting Date To',
        'Plan Amount',
        'Actual Cost',
        'Capital Cost',
        'Operating Cost',
        'Supplier ID',
        'Cost Center',
        'Natural Account',
      ],
      ['Supplier ID', 'Supplier Name', 'Cost Center', 'Natural Account', 'TTM Spend'],
    );

    const result = await parseErpWorkbook(buffer);
    expect(result.errors).toEqual([]);
    expect(result.source_system_guess).toBe('oracle_gl_ap');
    expect(result.financials).toHaveLength(1);
    expect(result.financials[0].program_id).toBe('P-100');
    expect(result.financials[0].budget_usd).toBe(100000);
  });

  it('honors SAP-style headers and tags source as sap_co_pa', async () => {
    const buffer = await makeWorkbookBuffer(
      [
        {
          'WBS Element': 'WBS-1',
          'Posting Date From': '2025-01-01',
          'Posting Date To': '2025-01-31',
          'Plan Amount': '50000',
          'Actual Cost': '48000',
          Capex: '10000',
          Opex: '38000',
          'Vendor Number': 'V-1',
          'Profit Center': 'PC-100',
          'G/L Account': '6100',
        },
      ],
      [
        {
          'Vendor Number': 'V-1',
          'Supplier Name': 'SAP Vendor',
          'Profit Center': 'PC-100',
          'G/L Account': '6100',
          'TTM Spend': '500000',
        },
      ],
      [
        'WBS Element',
        'Posting Date From',
        'Posting Date To',
        'Plan Amount',
        'Actual Cost',
        'Capex',
        'Opex',
        'Vendor Number',
        'Profit Center',
        'G/L Account',
      ],
      ['Vendor Number', 'Supplier Name', 'Profit Center', 'G/L Account', 'TTM Spend'],
    );

    const result = await parseErpWorkbook(buffer);
    expect(result.errors).toEqual([]);
    expect(result.source_system_guess).toBe('sap_co_pa');
    expect(result.financials[0].program_id).toBe('WBS-1');
    expect(result.vendors[0].vendor_id).toBe('V-1');
    expect(result.vendors[0].vendor_name).toBe('SAP Vendor');
  });
});

describe('parseErpWorkbook · validation', () => {
  it('rejects rows where capex + opex exceeds actual', async () => {
    const buffer = await makeWorkbookBuffer(
      [
        {
          program_id: 'P-1',
          period_start: '2025-01-01',
          period_end: '2025-01-31',
          actual_usd: '100',
          capex_usd: '70',
          opex_usd: '50', // 70+50=120 > 100+1
        },
      ],
      [],
    );
    const result = await parseErpWorkbook(buffer);
    expect(result.financials).toHaveLength(0);
    expect(result.errors.some((e) => /capex.*opex.*exceeds actual/i.test(e.reason))).toBe(true);
  });

  it('rejects rows where period_start > period_end', async () => {
    const buffer = await makeWorkbookBuffer(
      [
        {
          program_id: 'P-1',
          period_start: '2025-02-01',
          period_end: '2025-01-31',
        },
      ],
      [],
    );
    const result = await parseErpWorkbook(buffer);
    expect(result.financials).toHaveLength(0);
    expect(result.errors.some((e) => /period_start.*period_end/.test(e.reason))).toBe(true);
  });

  it('rejects vendor_id that is not in the Vendor Spend sheet', async () => {
    const buffer = await makeWorkbookBuffer(
      [
        {
          program_id: 'P-1',
          period_start: '2025-01-01',
          period_end: '2025-01-31',
          actual_usd: '100',
          vendor_id: 'V-MISSING',
        },
      ],
      [
        { vendor_id: 'V-EXISTS', vendor_name: 'Exists' },
      ],
    );
    const result = await parseErpWorkbook(buffer);
    expect(result.financials).toHaveLength(0);
    expect(result.errors.some((e) => /V-MISSING/.test(e.reason))).toBe(true);
  });

  it('rejects duplicate (program_id, period_start)', async () => {
    const buffer = await makeWorkbookBuffer(
      [
        { program_id: 'P-1', period_start: '2025-01-01', period_end: '2025-01-31' },
        { program_id: 'P-1', period_start: '2025-01-01', period_end: '2025-01-31' },
      ],
      [],
    );
    const result = await parseErpWorkbook(buffer);
    expect(result.financials).toHaveLength(1);
    expect(result.errors.some((e) => /Duplicate.*program_id.*period_start/.test(e.reason))).toBe(true);
  });

  it('rejects when Program Financials sheet is missing', async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet(ERP_VENDOR_SPEND_SHEET);
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    const result = await parseErpWorkbook(buffer);
    expect(result.errors.some((e) => e.sheet === 'Program Financials' && /missing required sheet/i.test(e.reason))).toBe(true);
  });

  it('rejects negative amounts', async () => {
    const buffer = await makeWorkbookBuffer(
      [
        {
          program_id: 'P-1',
          period_start: '2025-01-01',
          period_end: '2025-01-31',
          actual_usd: '-100',
        },
      ],
      [],
    );
    const result = await parseErpWorkbook(buffer);
    expect(result.financials).toHaveLength(0);
    expect(result.errors.some((e) => /actual_usd.*non-negative/.test(e.reason))).toBe(true);
  });
});
