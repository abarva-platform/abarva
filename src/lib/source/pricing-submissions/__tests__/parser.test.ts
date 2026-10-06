import ExcelJS from 'exceljs';
import {
  buildPricingTemplateWorkbook,
  type PricingTemplatePayload,
} from '@/lib/source/exports/renderers/pricing-template';
import { parseVendorPricingSubmission } from '../parser';

/**
 * Test strategy: build a real d19a Pricing Template using our own
 * renderer, fill in vendor cells, serialize to xlsx bytes, then run the
 * parser against those bytes. This makes the test directly assert the
 * round-trip — any change to the renderer's column layout would break
 * the parser, which is exactly the regression we want to catch.
 */

const TEMPLATE_PAYLOAD: PricingTemplatePayload = {
  tenantName: 'Meridian Health',
  eventCode: 'MERI-CLOUD-2026',
  eventName: 'Meridian Health Cloud Sourcing Event',
  issuedBy: 'Janet Fischer, VP IT Ops',
  generatedAt: '2026-05-08T03:30:00.000Z',
  assumptions: [
    { key: 'Term horizon', value: '3 years (firm)' },
    { key: 'Annual escalator', value: '4.0%' },
  ],
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
    {
      id: 'L-OPS-02',
      category: 'Operating model',
      description: 'Release management for monthly upgrades',
      unit: 'release-cycle',
      annualQuantity: 12,
    },
  ],
  tcoYears: 3,
  escalator: 0.04,
};

/**
 * The Cover sheet's vendor-name slot, found by its label rather than by a
 * fixed coordinate. These cases used to write to `B16`; the Cover sheet grew
 * and the slot moved, so the writes landed in an unlabeled cell, three cases
 * went red and three more stopped exercising the vendor-name read at all
 * (T-795). Locating the slot by label keeps the fixture on the slot the
 * renderer actually emits, and the single-match assertion keeps a renamed or
 * duplicated label from silently passing.
 */
function vendorNameCell(wb: ExcelJS.Workbook): ExcelJS.Cell {
  const cover = wb.getWorksheet('Cover')!;
  const rows: number[] = [];
  cover.eachRow((row, rowNumber) => {
    const label = row.getCell(1).value;
    if (typeof label === 'string' && /^vendor\s*name\b/i.test(label.trim())) {
      rows.push(rowNumber);
    }
  });
  expect(rows).toHaveLength(1);
  return cover.getCell(rows[0]!, 2);
}

async function fillAndSerialize(
  fill: (wb: ExcelJS.Workbook) => void,
): Promise<Uint8Array> {
  const wb = buildPricingTemplateWorkbook(TEMPLATE_PAYLOAD);
  fill(wb);
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

describe('parseVendorPricingSubmission', () => {
  it('round-trips a vendor-filled template into a structured submission', async () => {
    const bytes = await fillAndSerialize((wb) => {
      vendorNameCell(wb).value = 'Acme Cloud Solutions';
      const detail = wb.getWorksheet('Pricing Detail')!;
      detail.getCell('F2').value = 380; // L-CMP-01 unit
      detail.getCell('F3').value = 95;  // L-OPS-01 unit
      detail.getCell('F4').value = 18000; // L-OPS-02 unit
      detail.getCell('H3').value = 'Capped at 24k incidents/year.';
      const notes = wb.getWorksheet('Pricing Notes')!;
      notes.getCell('B2').value =
        'We strongly propose a 5-year term horizon with a year-3 break clause.';
    });

    const result = await parseVendorPricingSubmission({
      bytes,
      filename: 'acme.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
    });

    expect(result.status).toBe('parsed');
    expect(result.insert.vendorName).toBe('Acme Cloud Solutions');
    expect(result.insert.unitPricesById).toEqual({
      'L-CMP-01': 380,
      'L-OPS-01': 95,
      'L-OPS-02': 18000,
    });
    expect(result.insert.vendorNotesById['L-OPS-01']).toContain('Capped at 24k');
    expect(result.insert.assumptionDeviations).toHaveLength(1);
    expect(result.insert.assumptionDeviations[0]?.assumptionKey).toBe('Term horizon');
    expect(result.insert.assumptionDeviations[0]?.severity).toBe('medium');
    expect(result.insert.parseWarnings).toHaveLength(0);
  });

  it('flags partial status when some line items are unpriced', async () => {
    const bytes = await fillAndSerialize((wb) => {
      vendorNameCell(wb).value = 'Beta';
      const detail = wb.getWorksheet('Pricing Detail')!;
      detail.getCell('F2').value = 400;
      // Leave F3 + F4 blank
    });
    const result = await parseVendorPricingSubmission({
      bytes,
      filename: 'beta.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
    });
    expect(result.status).toBe('partial');
    expect(Object.keys(result.insert.unitPricesById)).toEqual(['L-CMP-01']);
    const codes = result.insert.parseWarnings.map((w) => w.code);
    expect(codes).toContain('missing_unit_price');
    expect(codes).toContain('incomplete_pricing');
    // `partial` must come from the unpriced lines, not from a vendor name the
    // fixture failed to place: a missing name also yields `partial`.
    expect(result.insert.vendorName).toBe('Beta');
    expect(codes).not.toContain('missing_vendor_name');
  });

  it('falls back to vendorNameOverride when Cover sheet has no name', async () => {
    const bytes = await fillAndSerialize((wb) => {
      // Leave the vendor name slot blank
      wb.getWorksheet('Pricing Detail')!.getCell('F2').value = 400;
      wb.getWorksheet('Pricing Detail')!.getCell('F3').value = 95;
      wb.getWorksheet('Pricing Detail')!.getCell('F4').value = 18000;
    });
    const result = await parseVendorPricingSubmission({
      bytes,
      filename: 'untitled.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
      vendorNameOverride: 'Override Vendor',
    });
    expect(result.insert.vendorName).toBe('Override Vendor');
    expect(result.status).toBe('parsed');
  });

  it('flags missing_vendor_name when neither cover nor override provide one', async () => {
    const bytes = await fillAndSerialize((wb) => {
      wb.getWorksheet('Pricing Detail')!.getCell('F2').value = 400;
      wb.getWorksheet('Pricing Detail')!.getCell('F3').value = 95;
      wb.getWorksheet('Pricing Detail')!.getCell('F4').value = 18000;
    });
    const result = await parseVendorPricingSubmission({
      bytes,
      filename: 'no-name.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
    });
    expect(result.insert.parseWarnings.map((w) => w.code)).toContain(
      'missing_vendor_name',
    );
    expect(result.status).toBe('partial');
  });

  it('extracts multiple assumption deviations with severity inference', async () => {
    const bytes = await fillAndSerialize((wb) => {
      vendorNameCell(wb).value = 'Gamma';
      const detail = wb.getWorksheet('Pricing Detail')!;
      detail.getCell('F2').value = 500;
      detail.getCell('F3').value = 110;
      detail.getCell('F4').value = 22000;
      const notes = wb.getWorksheet('Pricing Notes')!;
      notes.getCell('B2').value =
        'Cannot accept 4.0% escalator — must use 6.5% (CPI + 200bps). Deal-breaker.';
      notes.getCell('B3').value =
        'We propose a consumption-based pricing model as alternative.';
      notes.getCell('B6').value = 'Assume DR drills included.';
    });
    const result = await parseVendorPricingSubmission({
      bytes,
      filename: 'gamma.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
    });
    expect(result.insert.vendorName).toBe('Gamma');
    const devs = result.insert.assumptionDeviations;
    expect(devs.length).toBeGreaterThanOrEqual(2);
    const escalatorDev = devs.find((d) => d.assumptionKey === 'Annual escalator');
    expect(escalatorDev?.severity).toBe('high');
    const altPricingDev = devs.find((d) => d.assumptionKey === 'Pricing model');
    expect(altPricingDev?.severity).toBe('medium');
  });

  it('does not turn explicit no-deviation notes into assumption deviations', async () => {
    const bytes = await fillAndSerialize((wb) => {
      vendorNameCell(wb).value = 'Delta';
      const detail = wb.getWorksheet('Pricing Detail')!;
      detail.getCell('F2').value = 500;
      detail.getCell('F3').value = 110;
      detail.getCell('F4').value = 22000;
      const notes = wb.getWorksheet('Pricing Notes')!;
      notes.getCell('B2').value =
        'Conforms to the locked term horizon; no assumption deviation.';
      notes.getCell('B3').value = 'No alternative pricing model requested.';
      notes.getCell('B6').value = 'N/A';
    });
    const result = await parseVendorPricingSubmission({
      bytes,
      filename: 'delta.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
    });

    expect(result.status).toBe('parsed');
    expect(result.insert.vendorName).toBe('Delta');
    expect(result.insert.assumptionDeviations).toEqual([]);
  });

  it('returns failed status when bytes are not a valid xlsx', async () => {
    const bogus = new TextEncoder().encode('not an xlsx file');
    const result = await parseVendorPricingSubmission({
      bytes: bogus,
      filename: 'bogus.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
    });
    expect(result.status).toBe('failed');
    expect(result.insert.parseStatus).toBe('failed');
    expect(result.insert.parseWarnings[0]?.code).toBe('xlsx_load_failed');
    expect(result.insert.unitPricesById).toEqual({});
  });

  it('returns failed status when the Pricing Detail sheet is missing', async () => {
    // Build a minimal workbook without a Pricing Detail sheet.
    const wb = new ExcelJS.Workbook();
    const cover = wb.addWorksheet('Cover');
    cover.addRow(['Vendor name', 'Solo']);
    const buf = await wb.xlsx.writeBuffer();
    const result = await parseVendorPricingSubmission({
      bytes: new Uint8Array(buf as ArrayBuffer),
      filename: 'no-detail.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
    });
    expect(result.status).toBe('failed');
    expect(result.insert.parseWarnings.map((w) => w.code)).toContain(
      'missing_pricing_detail_sheet',
    );
  });

  it('strips ExcelJS safeCell single-quote prefix on string reads', async () => {
    const bytes = await fillAndSerialize((wb) => {
      // Vendor name written with a leading single-quote (simulating the
      // safeCell escape applied during render). Parser should strip it.
      vendorNameCell(wb).value = "'Quoted Vendor";
      wb.getWorksheet('Pricing Detail')!.getCell('F2').value = 400;
      wb.getWorksheet('Pricing Detail')!.getCell('F3').value = 95;
      wb.getWorksheet('Pricing Detail')!.getCell('F4').value = 18000;
    });
    const result = await parseVendorPricingSubmission({
      bytes,
      filename: 'quoted.xlsx',
      sourceEventId: 'event-1',
      tenantKey: 'meridian',
    });
    expect(result.insert.vendorName).toBe('Quoted Vendor');
  });
});
