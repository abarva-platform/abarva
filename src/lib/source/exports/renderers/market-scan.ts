// Source · Stage-2 Market Scan xlsx renderer (dx2_market_scan).
//
// Map the supplier landscape; assess vendor reality (real platform vs
// thin wrapper); flag M&A / viability; bring pricing benchmarks. The
// pricing benchmark is a 3-D rate card (archetype × delivery location
// × work specialization) — methodology §3 Stage 2 + the SI rate card
// playbook.
//
// Structure (5 sheets):
//   1. Cover                        — event metadata + instructions
//   2. Vendor Longlist              — vendor / archetype / hq / scale /
//                                     platform_reality / M&A flag
//   3. Capability Matrix            — vendor × capability matrix
//   4. Pricing Benchmarks (3-D)     — archetype × delivery location ×
//                                     specialization rate ranges
//   5. Industry Signals             — substrate citations (industry_context)
//                                     — empty rows render the seed-gap line
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

export type VendorPlatformReality = 'real_platform' | 'thin_wrapper' | 'unknown';
export type VendorMAFlag = 'none' | 'rumored' | 'active' | 'completed';

export interface MarketScanVendor {
  id: string;
  name: string;
  /** Archetype / segment (e.g. "AMS · onshore", "Cloud · hyperscaler-aligned"). */
  archetype: string;
  /** Headquarters city / country. */
  hq: string;
  /** Scale signal — annual revenue band or named employee count. */
  scale: string;
  /** Reality call — real platform or thin wrapper around someone else's. */
  platformReality: VendorPlatformReality;
  /** M&A signal flag. */
  maFlag: VendorMAFlag;
  /** Free-text note — viability concern, pricing posture, recent disclosure. */
  notes: string;
}

export interface MarketScanCapability {
  /** Capability label (e.g. "Multi-region deployment", "MLOps platform"). */
  capability: string;
  /** Whether this is mandatory ("M"), important ("I"), or optional ("O"). */
  importance: 'M' | 'I' | 'O';
  /** Map vendor id → 'full' | 'partial' | 'gap' | 'unknown'. */
  byVendor: Record<string, 'full' | 'partial' | 'gap' | 'unknown'>;
}

export interface MarketScanRateRange {
  /** Vendor archetype (Big-4 SI / boutique / nearshore / offshore / etc.). */
  archetype: string;
  /** Delivery location (onshore / nearshore / offshore). */
  delivery: 'onshore' | 'nearshore' | 'offshore' | 'hybrid';
  /** Work specialization (architect / lead engineer / engineer / SRE / data scientist / pm). */
  specialization: string;
  /** USD/hr low end. */
  rateUsdHrLow: number;
  /** USD/hr high end. */
  rateUsdHrHigh: number;
  /** Source citation (e.g. "AbarVa rate-card playbook 2026", "industry_context.row_id"). */
  source: string;
}

export interface MarketScanIndustrySignal {
  topic: string;
  observation: string;
  source: string;
}

export interface MarketScanPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  generatedAt: string;
  /** Vendor longlist. Empty → seed-gap row. */
  vendors: ReadonlyArray<MarketScanVendor>;
  /** Capability matrix rows. Empty → seed-gap row. */
  capabilities: ReadonlyArray<MarketScanCapability>;
  /** 3-D rate ranges (archetype × delivery × spec). */
  rates: ReadonlyArray<MarketScanRateRange>;
  /** Industry-context signals from substrate. */
  industrySignals: ReadonlyArray<MarketScanIndustrySignal>;
}

const SEED_GAP_LINE = '— Not recorded — seed gap';

export function buildMarketScanWorkbook(
  payload: MarketScanPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Market Scan · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `Market Scan · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Sheet 2 (Vendor Longlist) — the procurement-vetted vendor universe for this category. Reality column flags thin wrappers around other vendors\' platforms.',
      'Sheet 3 (Capability Matrix) — vendor × capability fit. Mandatory (M) gaps disqualify; Important (I) gaps go to BAFO.',
      'Sheet 4 (Pricing Benchmarks 3-D) — archetype × delivery × specialization rate ranges. Use as the d19 pricing-workbook reasonableness check.',
      'Sheet 5 (Industry Signals) — substrate citations from industry_context. Rows reading "Not recorded — seed gap" indicate the corpus has not been loaded.',
    ],
  });

  buildVendorLonglistSheet(workbook, payload.vendors);
  buildCapabilityMatrixSheet(workbook, payload.vendors, payload.capabilities);
  buildPricingBenchmarkSheet(workbook, payload.rates);
  buildIndustrySignalsSheet(workbook, payload.industrySignals);

  return workbook;
}

function buildVendorLonglistSheet(
  workbook: ExcelJS.Workbook,
  vendors: ReadonlyArray<MarketScanVendor>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Vendor Longlist', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor ID', key: 'id', width: 14 },
    { header: 'Vendor', key: 'name', width: 30 },
    { header: 'Archetype / segment', key: 'archetype', width: 28 },
    { header: 'HQ', key: 'hq', width: 18 },
    { header: 'Scale', key: 'scale', width: 22 },
    { header: 'Platform reality', key: 'platformReality', width: 18 },
    { header: 'M&A flag', key: 'maFlag', width: 12 },
    { header: 'Notes', key: 'notes', width: 48 },
  ];
  applyHeaderRow(sheet.getRow(1));
  if (vendors.length === 0) {
    const r = sheet.addRow({
      id: '',
      name: SEED_GAP_LINE,
      archetype: '',
      hq: '',
      scale: '',
      platformReality: '',
      maFlag: '',
      notes: 'No vendor longlist supplied. Load market intelligence before scoring.',
    });
    r.getCell('name').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    return sheet;
  }
  for (const v of vendors) {
    const r = sheet.addRow({
      id: safeCell(v.id),
      name: safeCell(v.name),
      archetype: safeCell(v.archetype),
      hq: safeCell(v.hq),
      scale: safeCell(v.scale),
      platformReality: safeCell(v.platformReality),
      maFlag: safeCell(v.maFlag),
      notes: safeCell(v.notes),
    });
    r.getCell('notes').alignment = { wrapText: true, vertical: 'top' };
    if (v.platformReality === 'thin_wrapper') {
      r.getCell('platformReality').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    if (v.maFlag === 'active' || v.maFlag === 'completed') {
      r.getCell('maFlag').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
      };
    }
  }
  return sheet;
}

function buildCapabilityMatrixSheet(
  workbook: ExcelJS.Workbook,
  vendors: ReadonlyArray<MarketScanVendor>,
  capabilities: ReadonlyArray<MarketScanCapability>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Capability Matrix', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 2, ySplit: 1 }],
  });
  const columns: Array<Partial<ExcelJS.Column>> = [
    { header: 'Capability', key: 'capability', width: 38 },
    { header: 'M/I/O', key: 'importance', width: 8 },
  ];
  for (const v of vendors) {
    columns.push({ header: v.name, key: v.id, width: 16 });
  }
  sheet.columns = columns;
  applyHeaderRow(sheet.getRow(1));
  if (capabilities.length === 0) {
    const r = sheet.addRow({ capability: SEED_GAP_LINE, importance: '' });
    r.getCell('capability').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    return sheet;
  }
  for (const cap of capabilities) {
    const row: Record<string, ExcelJS.CellValue> = {
      capability: safeCell(cap.capability),
      importance: cap.importance,
    };
    for (const v of vendors) {
      row[v.id] = safeCell(cap.byVendor[v.id] ?? 'unknown');
    }
    const r = sheet.addRow(row);
    for (const v of vendors) {
      const cell = r.getCell(v.id);
      const val = cap.byVendor[v.id];
      if (val === 'gap' && cap.importance === 'M') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
        };
      } else if (val === 'gap') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
        };
      }
    }
  }
  return sheet;
}

function buildPricingBenchmarkSheet(
  workbook: ExcelJS.Workbook,
  rates: ReadonlyArray<MarketScanRateRange>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Pricing Benchmarks', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor archetype', key: 'archetype', width: 24 },
    { header: 'Delivery location', key: 'delivery', width: 16 },
    { header: 'Work specialization', key: 'specialization', width: 28 },
    { header: 'USD/hr low', key: 'low', width: 12 },
    { header: 'USD/hr high', key: 'high', width: 12 },
    { header: 'Source', key: 'source', width: 36 },
  ];
  applyHeaderRow(sheet.getRow(1));
  if (rates.length === 0) {
    const r = sheet.addRow({
      archetype: SEED_GAP_LINE,
      delivery: '',
      specialization: '',
      low: '',
      high: '',
      source: 'No rate benchmarks supplied. Reference the AbarVa SI rate-card playbook before issuing.',
    });
    applyLockedRow(r);
    return sheet;
  }
  for (const rate of rates) {
    const r = sheet.addRow({
      archetype: safeCell(rate.archetype),
      delivery: safeCell(rate.delivery),
      specialization: safeCell(rate.specialization),
      low: rate.rateUsdHrLow,
      high: rate.rateUsdHrHigh,
      source: safeCell(rate.source),
    });
    r.getCell('low').numFmt = '"$"#,##0';
    r.getCell('high').numFmt = '"$"#,##0';
  }
  return sheet;
}

function buildIndustrySignalsSheet(
  workbook: ExcelJS.Workbook,
  signals: ReadonlyArray<MarketScanIndustrySignal>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Industry Signals', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Topic', key: 'topic', width: 26 },
    { header: 'Observation', key: 'observation', width: 70 },
    { header: 'Source', key: 'source', width: 32 },
  ];
  applyHeaderRow(sheet.getRow(1));
  if (signals.length === 0) {
    const r = sheet.addRow({
      topic: SEED_GAP_LINE,
      observation:
        'No industry_context records loaded for this tenant. Substrate gap — corpus signals would otherwise appear here.',
      source: '',
    });
    r.getCell('topic').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    return sheet;
  }
  for (const s of signals) {
    const r = sheet.addRow({
      topic: safeCell(s.topic),
      observation: safeCell(s.observation),
      source: safeCell(s.source),
    });
    r.getCell('observation').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
  }
  return sheet;
}
