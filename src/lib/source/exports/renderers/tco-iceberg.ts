// Source · Stage-4 TCO Iceberg xlsx renderer (dx4_tco_iceberg).
//
// Methodology §5: the quoted license/subscription is typically 20–35%
// of true cost. This artifact adds the iceberg below sticker price —
// integration, change/adoption, ops/run, consumption, exit/transition —
// so the buyer never repeats the vendor quote as "the cost."
//
// Structure (4 sheets):
//   1. Cover                — event metadata + how-to-use
//   2. Iceberg Cost Model   — layer × year-1/year-2/year-3/3y total
//                              with formula totals + visibility flags
//   3. Sensitivity          — range bands (low / mid / high) per layer
//   4. Iceberg Definitions  — locked rubric for every layer
//
// Pure: payload → ExcelJS.Workbook.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  safeCell,
} from '@/lib/exports-shared/xlsx-base';

export type IcebergVisibility = 'visible' | 'hidden';

export interface IcebergLayer {
  /** Stable id (e.g. "L-LICENSE", "L-INTEGRATION"). */
  id: string;
  /** Cost-layer label per methodology §5. */
  label: string;
  /** Vendor-quoted vs hidden in iceberg. */
  visibility: IcebergVisibility;
  /** What drives this cost (e.g. "Vendor quote", "Connectors to existing it_landscape"). */
  driver: string;
  /** Year-1 USD. */
  year1Usd: number;
  /** Year-2 USD. */
  year2Usd: number;
  /** Year-3 USD. */
  year3Usd: number;
  /** Confidence band — describes how tight the estimate is. */
  confidence: 'high' | 'medium' | 'low';
  /** Sensitivity low (USD per year, used in Sensitivity sheet). */
  sensitivityLowUsd: number;
  /** Sensitivity high (USD per year, used in Sensitivity sheet). */
  sensitivityHighUsd: number;
}

export interface IcebergDefinition {
  layerLabel: string;
  rubric: string;
}

export interface TcoIcebergPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  generatedAt: string;
  /** Currency code for display (USD only in v1). */
  currency: 'USD';
  /** Iceberg layers. Empty allowed — surfaces a seed-gap row. */
  layers: ReadonlyArray<IcebergLayer>;
  /** Locked methodology §5 definitions. */
  definitions: ReadonlyArray<IcebergDefinition>;
}

const SEED_GAP_LINE = '— Not recorded — seed gap';

export function buildTcoIcebergWorkbook(
  payload: TcoIcebergPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `TCO Iceberg · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `TCO Iceberg · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Sheet 2 (Iceberg Cost Model) — every cost layer per methodology §5. The vendor quote is one row of many. Year totals are formula-driven.',
      'Sheet 3 (Sensitivity) — low / mid / high bands per layer. Use when the d19 pricing comparison is challenged.',
      'Sheet 4 (Iceberg Definitions) is the locked rubric. Layers below the visibility line are commonly missed by vendor quotes.',
      'Rule: never present TCO as a single point — always a range with iceberg itemised.',
    ],
  });

  buildIcebergSheet(workbook, payload.layers);
  buildSensitivitySheet(workbook, payload.layers);
  buildDefinitionsSheet(workbook, payload.definitions);

  return workbook;
}

function buildIcebergSheet(
  workbook: ExcelJS.Workbook,
  layers: ReadonlyArray<IcebergLayer>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Iceberg Cost Model', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Layer ID', key: 'id', width: 16 },
    { header: 'Cost layer', key: 'label', width: 32 },
    { header: 'Visibility', key: 'visibility', width: 12 },
    { header: 'Driver', key: 'driver', width: 36 },
    { header: 'Year 1 USD', key: 'year1Usd', width: 14 },
    { header: 'Year 2 USD', key: 'year2Usd', width: 14 },
    { header: 'Year 3 USD', key: 'year3Usd', width: 14 },
    { header: '3-yr total USD', key: 'total', width: 14 },
    { header: 'Confidence', key: 'confidence', width: 12 },
  ];
  applyHeaderRow(sheet.getRow(1));

  if (layers.length === 0) {
    const r = sheet.addRow({
      id: '',
      label: SEED_GAP_LINE,
      visibility: '',
      driver: 'No layers supplied. Author at least the visible vendor-quote layer + integration + change-management lines before circulating.',
      year1Usd: '',
      year2Usd: '',
      year3Usd: '',
      total: '',
      confidence: '',
    });
    r.getCell('label').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    return sheet;
  }

  let rowNum = 2;
  for (const layer of layers) {
    const r = sheet.addRow({
      id: safeCell(layer.id),
      label: safeCell(layer.label),
      visibility: layer.visibility,
      driver: safeCell(layer.driver),
      year1Usd: layer.year1Usd,
      year2Usd: layer.year2Usd,
      year3Usd: layer.year3Usd,
      total: { formula: `E${rowNum}+F${rowNum}+G${rowNum}` },
      confidence: layer.confidence,
    });
    for (const col of ['year1Usd', 'year2Usd', 'year3Usd', 'total'] as const) {
      r.getCell(col).numFmt = '"$"#,##0';
    }
    if (layer.visibility === 'hidden') {
      r.getCell('visibility').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    if (layer.confidence === 'low') {
      r.getCell('confidence').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
      };
    }
    rowNum += 1;
  }
  // Totals row
  const totalsRow = sheet.addRow({
    id: '',
    label: 'TOTAL (3-year)',
    visibility: '',
    driver: '',
    year1Usd: { formula: `SUM(E2:E${rowNum - 1})` },
    year2Usd: { formula: `SUM(F2:F${rowNum - 1})` },
    year3Usd: { formula: `SUM(G2:G${rowNum - 1})` },
    total: { formula: `SUM(H2:H${rowNum - 1})` },
    confidence: '',
  });
  totalsRow.font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
  for (const col of ['year1Usd', 'year2Usd', 'year3Usd', 'total'] as const) {
    totalsRow.getCell(col).numFmt = '"$"#,##0';
  }
  // Visible-only subtotal (challenges "what the vendor quoted")
  const visibleRow = sheet.addRow({
    id: '',
    label: 'Visible (vendor-quoted) subtotal',
    visibility: '',
    driver: '',
    year1Usd: { formula: `SUMIF(C2:C${rowNum - 1},"visible",E2:E${rowNum - 1})` },
    year2Usd: { formula: `SUMIF(C2:C${rowNum - 1},"visible",F2:F${rowNum - 1})` },
    year3Usd: { formula: `SUMIF(C2:C${rowNum - 1},"visible",G2:G${rowNum - 1})` },
    total: { formula: `SUMIF(C2:C${rowNum - 1},"visible",H2:H${rowNum - 1})` },
    confidence: '',
  });
  for (const col of ['year1Usd', 'year2Usd', 'year3Usd', 'total'] as const) {
    visibleRow.getCell(col).numFmt = '"$"#,##0';
  }
  // Iceberg multiplier — Total / Visible, names "the iceberg is N×"
  const multiplierRow = sheet.addRow({
    id: '',
    label: 'Iceberg multiplier (total ÷ visible)',
    visibility: '',
    driver: '',
    year1Usd: '',
    year2Usd: '',
    year3Usd: '',
    total: { formula: `IFERROR(H${rowNum} / H${rowNum + 1}, "—")` },
    confidence: '',
  });
  multiplierRow.font = { bold: true };
  multiplierRow.getCell('total').numFmt = '0.0"×"';
  return sheet;
}

function buildSensitivitySheet(
  workbook: ExcelJS.Workbook,
  layers: ReadonlyArray<IcebergLayer>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Sensitivity', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Layer', key: 'label', width: 32 },
    { header: 'Mid (Y1)', key: 'mid', width: 14 },
    { header: 'Low band', key: 'low', width: 14 },
    { header: 'High band', key: 'high', width: 14 },
    { header: 'Confidence', key: 'confidence', width: 12 },
  ];
  applyHeaderRow(sheet.getRow(1));
  if (layers.length === 0) {
    const r = sheet.addRow({ label: SEED_GAP_LINE, mid: '', low: '', high: '', confidence: '' });
    r.getCell('label').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    return sheet;
  }
  for (const l of layers) {
    const r = sheet.addRow({
      label: safeCell(l.label),
      mid: l.year1Usd,
      low: l.sensitivityLowUsd,
      high: l.sensitivityHighUsd,
      confidence: l.confidence,
    });
    for (const col of ['mid', 'low', 'high'] as const) {
      r.getCell(col).numFmt = '"$"#,##0';
    }
  }
  return sheet;
}

function buildDefinitionsSheet(
  workbook: ExcelJS.Workbook,
  defs: ReadonlyArray<IcebergDefinition>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Iceberg Definitions', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Layer', key: 'layer', width: 36 },
    { header: 'Rubric', key: 'rubric', width: 84 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const def of defs) {
    const r = sheet.addRow({
      layer: safeCell(def.layerLabel),
      rubric: safeCell(def.rubric),
    });
    applyLockedRow(r);
    r.getCell('rubric').alignment = { wrapText: true, vertical: 'top' };
    r.height = 42;
  }
  return sheet;
}
