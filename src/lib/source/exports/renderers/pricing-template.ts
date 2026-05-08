// Source · d19a Pricing Workbook template
//
// Generates the empty pricing template the agent sends to vendors.
// This is the load-bearing piece the user called out: without an
// agent-generated template tied to the locked assumption set + scope
// line items, the whole pricing-normalization automation collapses
// into "humans normalize PDFs by hand."
//
// Structure (5 sheets):
//   1. Cover         — event metadata, vendor name slot, instructions
//   2. Assumption Set — locked rows from d21 (read-only); vendors
//                       price against this to make submissions
//                       comparable
//   3. Pricing Detail — line items derived from d05 scope; vendors
//                       fill unit price; extended price = qty × unit
//   4. TCO Summary   — Year 1/2/3 totals + 3-year, formula-driven
//                       from Pricing Detail; locked
//   5. Pricing Notes — vendor-fill narrative for assumptions they
//                       want to challenge or alternative pricing
//                       models
//
// The sheet order is chosen to encourage a top-down vendor read:
// vendors see context (Cover) before assumptions before the pricing
// detail. Pricing Notes sits last so vendors don't anchor on caveats.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  safeCell,
} from './xlsx-base';

/** One row in the Pricing Detail sheet. Vendors fill `unitPrice`. */
export interface PricingLineItem {
  /** Stable id (e.g. "L23-CIS-INCIDENT") for cross-vendor normalization. */
  id: string;
  /** Category — In-scope service / Application / Platform / Operating model. */
  category: string;
  /** Plain-language description of the line. */
  description: string;
  /** Unit (FTE-month / incident-call / VM-month / etc.). */
  unit: string;
  /** Annual quantity at steady state. */
  annualQuantity: number;
  /** Optional pricing notes the agent inserts for vendor context. */
  note?: string;
}

/** One row in the Assumption Set sheet (locked, read-only for vendors). */
export interface PricingAssumption {
  key: string;
  value: string;
  rationale?: string;
}

export interface PricingTemplatePayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  /** ISO 8601 of generation. */
  generatedAt: string;
  /** Locked assumption rows (typically pulled from d21). */
  assumptions: ReadonlyArray<PricingAssumption>;
  /** Scope-derived pricing line items. */
  lineItems: ReadonlyArray<PricingLineItem>;
  /** Term horizon in years for the TCO calc. Default 3. */
  tcoYears: number;
  /** Annual escalator from the assumption set (e.g. 0.04 = 4%). */
  escalator: number;
}

/** Build the workbook. Pure (payload) → Workbook; the route serializes. */
export function buildPricingTemplateWorkbook(
  payload: PricingTemplatePayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Pricing Template · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `Pricing Template · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Vendor of record: fill the cell next to "Vendor name" on this sheet before completing pricing.',
      'Sheet 2 (Assumption Set) is locked — these are the assumptions all vendor submissions are normalized against.',
      'Sheet 3 (Pricing Detail) — fill the Unit Price column for every row. Extended Price calculates automatically.',
      'Sheet 4 (TCO Summary) is locked — it computes Year 1 / Year 2 / Year 3 totals from Sheet 3 using the assumption-set escalator.',
      'Sheet 5 (Pricing Notes) — flag any assumption you wish to challenge, plus any alternative pricing model you want considered. Submissions that ignore Sheet 5 will be normalized against the locked assumption set with no caveats applied.',
    ],
  });
  // Vendor name slot on the Cover sheet — we add it as the last row so
  // it's discoverable without crowding the metadata block.
  const cover = workbook.getWorksheet('Cover');
  if (cover) {
    cover.addRow([]);
    const r = cover.addRow(['Vendor name', '']);
    r.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    r.getCell(2).protection = { locked: false };
  }

  buildAssumptionSetSheet(workbook, payload.assumptions);
  buildPricingDetailSheet(workbook, payload.lineItems);
  buildTcoSummarySheet(workbook, payload);
  buildPricingNotesSheet(workbook);

  return workbook;
}

function buildAssumptionSetSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<PricingAssumption>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Assumption Set', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 1 }],
    properties: { defaultColWidth: 20 },
  });
  sheet.columns = [
    { header: 'Assumption', key: 'key', width: 32 },
    { header: 'Value', key: 'value', width: 28 },
    { header: 'Rationale', key: 'rationale', width: 60 },
  ];
  applyHeaderRow(sheet.getRow(1));

  for (const a of rows) {
    const r = sheet.addRow({
      key: safeCell(a.key),
      value: safeCell(a.value),
      rationale: safeCell(a.rationale ?? ''),
    });
    applyLockedRow(r);
    r.getCell('rationale').alignment = { wrapText: true, vertical: 'top' };
  }
  return sheet;
}

function buildPricingDetailSheet(
  workbook: ExcelJS.Workbook,
  lineItems: ReadonlyArray<PricingLineItem>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Pricing Detail', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Line ID', key: 'id', width: 18 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Description', key: 'description', width: 56 },
    { header: 'Unit', key: 'unit', width: 16 },
    { header: 'Annual Qty', key: 'qty', width: 14 },
    { header: 'Unit Price (USD)', key: 'unitPrice', width: 18 },
    { header: 'Extended Annual Price (USD)', key: 'extended', width: 26 },
    { header: 'Vendor Note', key: 'note', width: 48 },
  ];
  applyHeaderRow(sheet.getRow(1));

  let rowNum = 2;
  for (const item of lineItems) {
    sheet.addRow({
      id: safeCell(item.id),
      category: safeCell(item.category),
      description: safeCell(item.description),
      unit: safeCell(item.unit),
      qty: item.annualQuantity,
      unitPrice: '', // vendor fills
      extended: { formula: `IFERROR(E${rowNum}*F${rowNum},"")` },
      note: safeCell(item.note ?? ''),
    });
    sheet.getRow(rowNum).getCell('description').alignment = {
      wrapText: true,
      vertical: 'top',
    };
    // Unit price + note are vendor-editable; lock everything else by
    // intent (Excel still requires sheet-protect to enforce).
    sheet.getRow(rowNum).getCell('unitPrice').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    sheet.getRow(rowNum).getCell('unitPrice').numFmt = '"$"#,##0.00';
    sheet.getRow(rowNum).getCell('extended').numFmt = '"$"#,##0';
    rowNum += 1;
  }

  // Totals row.
  const totalsRowNum = rowNum;
  const total = sheet.addRow({
    id: 'TOTAL',
    category: '',
    description: 'Annual Steady-State Total',
    unit: '',
    qty: '',
    unitPrice: '',
    extended: { formula: `SUM(G2:G${rowNum - 1})` },
    note: '',
  });
  total.font = { bold: true };
  total.getCell('extended').numFmt = '"$"#,##0';
  total.getCell('extended').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
  };

  // Stash totals row reference on the worksheet for the TCO sheet.
  sheet.getCell(`G${totalsRowNum}`).name = 'PricingDetail_AnnualTotal';
  return sheet;
}

function buildTcoSummarySheet(
  workbook: ExcelJS.Workbook,
  payload: PricingTemplatePayload,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('TCO Summary', {
    views: [{ showGridLines: false }],
    properties: { defaultColWidth: 22 },
  });
  sheet.columns = [
    { header: 'Term Year', key: 'year', width: 14 },
    { header: 'Escalator', key: 'escalator', width: 14 },
    { header: 'Annual TCO (USD)', key: 'annual', width: 22 },
    { header: 'Cumulative TCO (USD)', key: 'cumulative', width: 24 },
  ];
  applyHeaderRow(sheet.getRow(1));

  // Pull annual base from the totals row of Pricing Detail.
  const detailSheetRef = `'Pricing Detail'!PricingDetail_AnnualTotal`;
  const escalator = payload.escalator;

  let cumulativeFormulaCells: string[] = [];
  for (let y = 1; y <= payload.tcoYears; y++) {
    const power = y - 1;
    const annualFormula =
      power === 0
        ? `${detailSheetRef}`
        : `${detailSheetRef}*POWER(1+${escalator},${power})`;
    const r = sheet.addRow({
      year: `Year ${y}`,
      escalator: power === 0 ? 0 : escalator,
      annual: { formula: annualFormula },
      cumulative: '', // filled below
    });
    cumulativeFormulaCells.push(`C${r.number}`);
    r.getCell('annual').numFmt = '"$"#,##0';
    r.getCell('escalator').numFmt = '0.00%';
    applyLockedRow(r);
  }
  // Patch cumulative formulas now that we have all the year row numbers.
  for (let i = 0; i < cumulativeFormulaCells.length; i++) {
    const rowNum = i + 2;
    const cumulativeFormula = `SUM(C2:C${rowNum})`;
    sheet.getCell(`D${rowNum}`).value = { formula: cumulativeFormula };
    sheet.getCell(`D${rowNum}`).numFmt = '"$"#,##0';
  }

  // Big-number summary at the bottom.
  sheet.addRow([]);
  const totalLabelRow = sheet.addRow([
    `${payload.tcoYears}-year TCO`,
    '',
    '',
    { formula: `D${1 + payload.tcoYears}` },
  ]);
  totalLabelRow.font = { bold: true, size: 13 };
  totalLabelRow.getCell(4).numFmt = '"$"#,##0';
  totalLabelRow.getCell(4).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
  };

  return sheet;
}

function buildPricingNotesSheet(
  workbook: ExcelJS.Workbook,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Pricing Notes', {
    properties: { defaultColWidth: 30 },
  });
  sheet.columns = [
    { header: 'Topic', key: 'topic', width: 32 },
    { header: 'Vendor narrative', key: 'narrative', width: 90 },
  ];
  applyHeaderRow(sheet.getRow(1));

  const seedTopics = [
    'Assumption challenge — which row in Sheet 2 do you contest? (state row + your alternative)',
    'Alternative pricing model — describe any consumption / outcome / shared-risk model you propose',
    'Volume sensitivities — at what quantities does your unit price step? (cite line ID + threshold)',
    'Term sensitivities — pricing change at 5y vs 3y commit?',
    'Inclusions you assume but did not see in scope (we will add to d06 exclusion log if accepted)',
    'Exclusions / carve-outs not visible in our scope memo (will be reconciled at BAFO)',
  ];
  for (const topic of seedTopics) {
    const r = sheet.addRow([safeCell(topic), '']);
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
  }

  return sheet;
}
