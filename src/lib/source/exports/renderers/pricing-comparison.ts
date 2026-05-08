// Source · d19c Pricing Normalization Comparison
//
// Takes a set of vendor pricing submissions (each one a filled-in copy
// of the d19a Pricing Template) and emits a side-by-side comparison
// xlsx. This is the closure of the pricing-normalization workflow:
// d19a ships the template → vendors fill it → d19c normalizes them.
//
// Structure (6 sheets):
//   1. Cover                    — event metadata, vendor list,
//                                  normalization timestamp
//   2. Submissions Index        — one row per vendor: submitted-at,
//                                  completeness %, raw + normalized
//                                  3-yr TCO, deviation count
//   3. Pricing Comparison       — locked line items as rows; 3 cols per
//                                  vendor (Unit / Extended / Δ vs
//                                  cheapest). Annual total + delta row.
//   4. TCO Comparison           — Y1/Y2/Y3 + 3-yr cumulative per
//                                  vendor; cheapest highlighted; range
//                                  (max-min) row.
//   5. Assumption Deviations    — vendor pricing-notes flagged with
//                                  affected assumption + severity hint.
//   6. Recommendation           — narrative seed topics for the buyer.
//
// The renderer is pure (payload → ExcelJS.Workbook). The "cheapest"
// logic is implemented as Excel formulas (MIN / INDEX / MATCH) so the
// workbook stays live — buyers can rerun cells if a vendor revises.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  safeCell,
} from './xlsx-base';
import type {
  PricingAssumption,
  PricingLineItem,
} from './pricing-template';

/** A vendor's filled-in submission. Numeric fields come from parsing. */
export interface VendorPricingSubmission {
  /** Vendor display name as captured on submission. */
  vendorName: string;
  /** ISO 8601 of submission. */
  submittedAt: string;
  /** Per-line unit prices, keyed by line item id. */
  unitPricesById: Record<string, number>;
  /** Optional per-line vendor notes, keyed by line item id. */
  vendorNotesById?: Record<string, string>;
  /** Free-form pricing notes (Sheet 5 of the template). */
  pricingNotes: string;
  /**
   * Vendor's submitted assumption deviations. Each deviation flags an
   * assumption the vendor wishes to challenge. Empty when the vendor
   * accepted the locked assumption set as-is.
   */
  assumptionDeviations: ReadonlyArray<{
    /** Assumption key from the locked d21 set. */
    assumptionKey: string;
    /** Vendor's proposed alternative (free-form). */
    proposedAlternative: string;
    /** Severity hint: `low` / `medium` / `high`. Best-effort heuristic. */
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface PricingComparisonPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  /** ISO 8601 of comparison-build run. */
  generatedAt: string;
  /** Locked line items snapshot from d19a template. */
  lineItems: ReadonlyArray<PricingLineItem>;
  /** Locked assumption set from d21 / d19a. */
  assumptions: ReadonlyArray<PricingAssumption>;
  /** Annual escalator (e.g. 0.04). */
  escalator: number;
  /** TCO term (typically 3). */
  tcoYears: number;
  /** Vendor submissions to compare. Order is preserved in column order. */
  submissions: ReadonlyArray<VendorPricingSubmission>;
  /**
   * If true, the cover sheet shows a "DEMO MODE — synthetic submissions"
   * banner. Used while the upload-back path (Slice 2c.2) isn't yet wired.
   */
  demoMode?: boolean;
}

export function buildPricingComparisonWorkbook(
  payload: PricingComparisonPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Pricing Comparison · ${payload.eventCode}`;

  const instructions = [
    `Comparing ${payload.submissions.length} vendor submission${payload.submissions.length === 1 ? '' : 's'}.`,
    'Sheet 2 (Submissions Index) — one row per vendor with raw + normalized 3-year TCO and a count of assumption deviations flagged.',
    'Sheet 3 (Pricing Comparison) — locked line items, three columns per vendor (Unit / Extended / Δ vs cheapest). Annual totals row at the bottom.',
    'Sheet 4 (TCO Comparison) — Year 1/2/3 + 3-year cumulative per vendor, with the cheapest highlighted and a range (max−min) row.',
    'Sheet 5 (Assumption Deviations) — every deviation a vendor flagged in their Pricing Notes, with an affected-assumption pointer and a severity hint.',
    'Sheet 6 (Recommendation) — narrative seed topics for the buyer to populate before BAFO routing.',
  ];
  if (payload.demoMode) {
    instructions.unshift(
      'DEMO MODE — vendor submissions on this comparison are synthetic. Replace with real submissions once the upload-back path (Slice 2c.2) is live.',
    );
  }

  buildCoverSheet(workbook, {
    title: `Pricing Comparison · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    generatedAt: payload.generatedAt,
    instructions,
  });
  // Vendor list on the Cover sheet (after instructions).
  const cover = workbook.getWorksheet('Cover');
  if (cover) {
    cover.addRow([]);
    const header = cover.addRow(['Vendors compared', '']);
    header.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    for (const sub of payload.submissions) {
      const r = cover.addRow(['', `• ${safeCell(sub.vendorName)} · submitted ${safeCell(sub.submittedAt.slice(0, 10))}`]);
      r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    }
  }

  buildSubmissionsIndexSheet(workbook, payload);
  buildPricingComparisonSheet(workbook, payload);
  buildTcoComparisonSheet(workbook, payload);
  buildAssumptionDeviationsSheet(workbook, payload);
  buildRecommendationSheet(workbook);

  return workbook;
}

function buildSubmissionsIndexSheet(
  workbook: ExcelJS.Workbook,
  payload: PricingComparisonPayload,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Submissions Index', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 26 },
    { header: 'Submitted at', key: 'submittedAt', width: 22 },
    { header: 'Completeness (%)', key: 'completeness', width: 18 },
    { header: 'Raw annual total (USD)', key: 'rawAnnual', width: 24 },
    { header: 'Raw 3-yr TCO (USD)', key: 'rawTco', width: 22 },
    { header: 'Deviations flagged', key: 'deviations', width: 18 },
  ];
  applyHeaderRow(sheet.getRow(1));

  const totalLineCount = payload.lineItems.length;
  for (const sub of payload.submissions) {
    const filled = countFilledLines(sub, payload.lineItems);
    const annualTotal = computeAnnualTotal(sub, payload.lineItems);
    const tco = computeThreeYearTco(annualTotal, payload.escalator, payload.tcoYears);
    const r = sheet.addRow({
      vendor: safeCell(sub.vendorName),
      submittedAt: safeCell(sub.submittedAt),
      completeness:
        totalLineCount === 0 ? 0 : Math.round((filled / totalLineCount) * 100),
      rawAnnual: annualTotal,
      rawTco: tco,
      deviations: sub.assumptionDeviations.length,
    });
    r.getCell('rawAnnual').numFmt = '"$"#,##0';
    r.getCell('rawTco').numFmt = '"$"#,##0';
    r.getCell('completeness').numFmt = '0';
    if (sub.assumptionDeviations.length > 0) {
      r.getCell('deviations').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
  }

  return sheet;
}

function buildPricingComparisonSheet(
  workbook: ExcelJS.Workbook,
  payload: PricingComparisonPayload,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Pricing Comparison', {
    views: [
      { showGridLines: true, state: 'frozen', xSplit: 5, ySplit: 2 },
    ],
  });

  const vendors = payload.submissions;
  // Header row 1 (vendor labels) + row 2 (sub-headers).
  const headerRow1: ExcelJS.CellValue[] = ['', '', '', '', ''];
  const headerRow2: ExcelJS.CellValue[] = [
    'Line ID',
    'Category',
    'Description',
    'Unit',
    'Annual Qty',
  ];
  for (const v of vendors) {
    headerRow1.push(v.vendorName, '', '');
    headerRow2.push('Unit Price', 'Extended', 'Δ vs cheapest');
  }
  const r1 = sheet.addRow(headerRow1);
  const r2 = sheet.addRow(headerRow2);
  applyHeaderRow(r1);
  applyHeaderRow(r2);
  // Merge each vendor's 3-cell header in row 1.
  for (let i = 0; i < vendors.length; i++) {
    const startCol = 6 + i * 3;
    const endCol = startCol + 2;
    const startAddr = sheet.getCell(1, startCol).address;
    const endAddr = sheet.getCell(1, endCol).address;
    sheet.mergeCells(`${startAddr}:${endAddr}`);
  }

  // Column widths.
  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 22;
  sheet.getColumn(3).width = 50;
  sheet.getColumn(4).width = 16;
  sheet.getColumn(5).width = 12;
  for (let i = 0; i < vendors.length; i++) {
    sheet.getColumn(6 + i * 3).width = 14;
    sheet.getColumn(7 + i * 3).width = 14;
    sheet.getColumn(8 + i * 3).width = 14;
  }

  // One row per line item.
  let rowNum = 3;
  for (const item of payload.lineItems) {
    const baseCells: ExcelJS.CellValue[] = [
      safeCell(item.id),
      safeCell(item.category),
      safeCell(item.description),
      safeCell(item.unit),
      item.annualQuantity,
    ];
    // Per-vendor: unit, extended (=qty*unit), Δ (extended − MIN(extended row across vendors)).
    for (let v = 0; v < vendors.length; v++) {
      const sub = vendors[v]!;
      const unitPrice = sub.unitPricesById[item.id];
      const unitColLetter = colLetter(6 + v * 3);
      baseCells.push(typeof unitPrice === 'number' ? unitPrice : '');
      baseCells.push({ formula: `IFERROR(E${rowNum}*${unitColLetter}${rowNum},"")` });
      // Δ: percent above row-min extended price. Computed AFTER all
      // extended cells are placed; we patch the formula post-row.
      baseCells.push(''); // placeholder — patched below
    }
    const r = sheet.addRow(baseCells);
    // Lock the locked-style columns (Line ID through Annual Qty).
    for (let c = 1; c <= 5; c++) {
      r.getCell(c).protection = { locked: true };
      r.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
      };
    }
    r.getCell(3).alignment = { wrapText: true, vertical: 'top' };
    // Vendor cell formatting.
    for (let v = 0; v < vendors.length; v++) {
      const unitColIndex = 6 + v * 3;
      const extendedColIndex = 7 + v * 3;
      const deltaColIndex = 8 + v * 3;
      r.getCell(unitColIndex).numFmt = '"$"#,##0';
      r.getCell(extendedColIndex).numFmt = '"$"#,##0';
      // Patch the delta formula now that we know the extended-cell row.
      // Build MIN() across extended cells in this row (one per vendor).
      const extendedAddrs: string[] = [];
      for (let w = 0; w < vendors.length; w++) {
        extendedAddrs.push(`${colLetter(7 + w * 3)}${rowNum}`);
      }
      const minRef = `MIN(${extendedAddrs.join(',')})`;
      const extendedSelf = `${colLetter(extendedColIndex)}${rowNum}`;
      r.getCell(deltaColIndex).value = {
        formula: `IFERROR((${extendedSelf}-${minRef})/${minRef},"")`,
      };
      r.getCell(deltaColIndex).numFmt = '0.0%';
    }
    rowNum += 1;
  }

  // Totals row at bottom.
  const totalsRowNum = rowNum;
  const totalCells: ExcelJS.CellValue[] = [
    'TOTAL',
    '',
    'Annual Steady-State Total',
    '',
    '',
  ];
  for (let v = 0; v < vendors.length; v++) {
    const extendedColLetter = colLetter(7 + v * 3);
    totalCells.push('');
    totalCells.push({
      formula: `SUM(${extendedColLetter}3:${extendedColLetter}${totalsRowNum - 1})`,
    });
    totalCells.push('');
  }
  const totalsRow = sheet.addRow(totalCells);
  totalsRow.font = { bold: true };
  for (let v = 0; v < vendors.length; v++) {
    const extendedColIndex = 7 + v * 3;
    const deltaColIndex = 8 + v * 3;
    totalsRow.getCell(extendedColIndex).numFmt = '"$"#,##0';
    totalsRow.getCell(extendedColIndex).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
    };
    // Delta total = vendor total − MIN(vendor totals) / MIN.
    const totalAddrs: string[] = [];
    for (let w = 0; w < vendors.length; w++) {
      totalAddrs.push(`${colLetter(7 + w * 3)}${totalsRowNum}`);
    }
    const minTotalRef = `MIN(${totalAddrs.join(',')})`;
    const selfTotal = `${colLetter(extendedColIndex)}${totalsRowNum}`;
    totalsRow.getCell(deltaColIndex).value = {
      formula: `IFERROR((${selfTotal}-${minTotalRef})/${minTotalRef},"")`,
    };
    totalsRow.getCell(deltaColIndex).numFmt = '0.0%';
    totalsRow.getCell(deltaColIndex).font = { bold: true };
  }

  return sheet;
}

function buildTcoComparisonSheet(
  workbook: ExcelJS.Workbook,
  payload: PricingComparisonPayload,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('TCO Comparison', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 1, ySplit: 1 }],
  });

  const vendors = payload.submissions;
  // Build header: Year | V1 Annual | V1 Cumulative | V2 Annual | V2 Cumulative ...
  const headerCells: ExcelJS.CellValue[] = ['Term Year'];
  for (const v of vendors) {
    headerCells.push(`${v.vendorName} · Annual`);
    headerCells.push(`${v.vendorName} · Cumulative`);
  }
  applyHeaderRow(sheet.addRow(headerCells));
  sheet.getColumn(1).width = 14;
  for (let i = 0; i < vendors.length; i++) {
    sheet.getColumn(2 + i * 2).width = 22;
    sheet.getColumn(3 + i * 2).width = 24;
  }

  // Compute per-vendor annual totals (as numbers) — referenced by the
  // TCO formulas below. Putting them as values rather than reaching
  // back into the Pricing Comparison sheet keeps formulas self-contained.
  const annualTotals = vendors.map((v) =>
    computeAnnualTotal(v, payload.lineItems),
  );

  for (let y = 1; y <= payload.tcoYears; y++) {
    const power = y - 1;
    const factor = Math.pow(1 + payload.escalator, power);
    const row: ExcelJS.CellValue[] = [`Year ${y}`];
    for (let v = 0; v < vendors.length; v++) {
      const annual = annualTotals[v]! * factor;
      row.push(annual);
      // Cumulative computed via formula referencing prior cumulative.
      const cumulativeColLetter = colLetter(3 + v * 2);
      const annualColLetter = colLetter(2 + v * 2);
      const rowNum = 1 + y;
      const cumulativeFormula =
        y === 1
          ? `${annualColLetter}${rowNum}`
          : `${cumulativeColLetter}${rowNum - 1}+${annualColLetter}${rowNum}`;
      row.push({ formula: cumulativeFormula });
    }
    const r = sheet.addRow(row);
    for (let v = 0; v < vendors.length; v++) {
      r.getCell(2 + v * 2).numFmt = '"$"#,##0';
      r.getCell(3 + v * 2).numFmt = '"$"#,##0';
    }
  }

  // 3-year cumulative summary row + cheapest indicator.
  sheet.addRow([]);
  const summaryRowNum = 2 + payload.tcoYears + 1;
  const summaryCells: ExcelJS.CellValue[] = [`${payload.tcoYears}-yr TCO`];
  for (let v = 0; v < vendors.length; v++) {
    summaryCells.push('');
    const cumulativeColLetter = colLetter(3 + v * 2);
    const finalCumulativeRow = 1 + payload.tcoYears;
    summaryCells.push({ formula: `${cumulativeColLetter}${finalCumulativeRow}` });
  }
  const sum = sheet.addRow(summaryCells);
  sum.font = { bold: true, size: 13 };
  for (let v = 0; v < vendors.length; v++) {
    const cumulativeColIndex = 3 + v * 2;
    sum.getCell(cumulativeColIndex).numFmt = '"$"#,##0';
    sum.getCell(cumulativeColIndex).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
    };
  }

  // Cheapest indicator row — references the 3-yr summary row's cumulative cells.
  const cheapestRowCells: ExcelJS.CellValue[] = ['Cheapest 3-yr'];
  // Build a flat list of cumulative-cell addresses for MIN().
  const cumulativeCells: string[] = [];
  for (let v = 0; v < vendors.length; v++) {
    cumulativeCells.push(`${colLetter(3 + v * 2)}${summaryRowNum}`);
  }
  const minFormula = `MIN(${cumulativeCells.join(',')})`;
  for (let v = 0; v < vendors.length; v++) {
    const ownCell = `${colLetter(3 + v * 2)}${summaryRowNum}`;
    cheapestRowCells.push('');
    cheapestRowCells.push({
      formula: `IF(${ownCell}=${minFormula},"★","")`,
    });
  }
  sheet.addRow(cheapestRowCells);

  // Range row (max − min).
  const rangeCells: ExcelJS.CellValue[] = ['Range (max−min)', '', { formula: `MAX(${cumulativeCells.join(',')})-${minFormula}` }];
  for (let v = 1; v < vendors.length; v++) {
    rangeCells.push('', '');
  }
  const rangeRow = sheet.addRow(rangeCells);
  rangeRow.getCell(3).numFmt = '"$"#,##0';

  return sheet;
}

function buildAssumptionDeviationsSheet(
  workbook: ExcelJS.Workbook,
  payload: PricingComparisonPayload,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Assumption Deviations', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 24 },
    { header: 'Affected assumption', key: 'assumption', width: 28 },
    { header: 'Vendor proposed alternative', key: 'alternative', width: 60 },
    { header: 'Severity', key: 'severity', width: 14 },
  ];
  applyHeaderRow(sheet.getRow(1));

  let anyDeviation = false;
  for (const sub of payload.submissions) {
    for (const dev of sub.assumptionDeviations) {
      anyDeviation = true;
      const r = sheet.addRow({
        vendor: safeCell(sub.vendorName),
        assumption: safeCell(dev.assumptionKey),
        alternative: safeCell(dev.proposedAlternative),
        severity: safeCell(dev.severity),
      });
      r.getCell('alternative').alignment = { wrapText: true, vertical: 'top' };
      const fill =
        dev.severity === 'high'
          ? SOURCE_XLSX.ERROR_FILL
          : dev.severity === 'medium'
            ? SOURCE_XLSX.WARNING_FILL
            : SOURCE_XLSX.LOCKED_FILL;
      r.getCell('severity').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fill },
      };
      r.height = 32;
    }
  }
  if (!anyDeviation) {
    const r = sheet.addRow({
      vendor: '— no deviations —',
      assumption: '',
      alternative:
        'All vendors accepted the locked assumption set as written. No normalization adjustments required.',
      severity: 'low',
    });
    applyLockedRow(r);
    r.getCell('alternative').alignment = { wrapText: true, vertical: 'top' };
  }

  return sheet;
}

function buildRecommendationSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Recommendation', {
    properties: { defaultColWidth: 30 },
  });
  sheet.columns = [
    { header: 'Topic', key: 'topic', width: 40 },
    { header: 'Narrative', key: 'narrative', width: 80 },
  ];
  applyHeaderRow(sheet.getRow(1));

  const seedTopics = [
    'Cheapest 3-year TCO — vendor and rationale',
    'Best-value 3-year TCO — vendor and rationale (cite criteria from d16)',
    'Outliers — line items where one vendor is materially above peers (>30% delta)',
    'Assumption deviations — which deviations to accept vs reject (cite Sheet 5 rows)',
    'Cross-check against d20 trap log — any priced trap that materially shifts ranking?',
    'Risk-adjusted recommendation — preferred vendor for BAFO and why',
    'BAFO target — what the buyer wants each vendor to revise in their next round',
  ];
  for (const topic of seedTopics) {
    const r = sheet.addRow([safeCell(topic), '']);
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    r.height = 48;
  }

  return sheet;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function countFilledLines(
  sub: VendorPricingSubmission,
  lineItems: ReadonlyArray<PricingLineItem>,
): number {
  let count = 0;
  for (const item of lineItems) {
    const v = sub.unitPricesById[item.id];
    if (typeof v === 'number' && v > 0) count += 1;
  }
  return count;
}

function computeAnnualTotal(
  sub: VendorPricingSubmission,
  lineItems: ReadonlyArray<PricingLineItem>,
): number {
  let total = 0;
  for (const item of lineItems) {
    const unit = sub.unitPricesById[item.id];
    if (typeof unit === 'number') total += unit * item.annualQuantity;
  }
  return total;
}

function computeThreeYearTco(
  annualTotal: number,
  escalator: number,
  years: number,
): number {
  let tco = 0;
  for (let y = 0; y < years; y++) {
    tco += annualTotal * Math.pow(1 + escalator, y);
  }
  return tco;
}

/** 1-based column index → Excel column letter (A, B, …, Z, AA, …). */
function colLetter(idx: number): string {
  let s = '';
  let n = idx;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
