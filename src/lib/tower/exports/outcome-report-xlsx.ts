// Tower · outcome / measurement report · XLSX renderer
//
// G8 — the measurement / metrics workbook companion to the DOCX
// narrative report. Where the DOCX reads as a report, the XLSX is the
// data: one sheet per substrate type so a CFO can pivot, filter, and
// cross-check the numbers.
//
// Sheets:
//   1. Cover            — tenant metadata + provenance note
//   2. Portfolio Metrics — the deterministic band-metric tiles
//   3. Initiatives      — tracked initiatives + realized vs forecast
//   4. Measurement Model — every recorded KPI quarter
//   5. Vendor Portfolio — vendor contracts + renewal dates
//   6. 90-Day Activity  — derived renewal / KPI events in the window
//
// Pure: payload → ExcelJS.Workbook. The route serializes to bytes.
//
// No-fabrication contract: empty sheets carry a single honest note row
// instead of placeholder data.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  buildCoverSheet,
  safeCell,
} from '@/lib/exports-shared/xlsx-base';
import type {
  OutcomeActivityRow,
  OutcomeInitiativeRow,
  OutcomeKpiRow,
  TowerOutcomeReportPayload,
} from './outcome-report-payload';

function realizedPostureCell(row: OutcomeInitiativeRow): string {
  switch (row.realizedPosture.kind) {
    case 'not_measured':
      return 'Not yet measured';
    case 'no_forecast':
      return 'Measured; no committed-spend forecast';
    case 'measured':
      return row.realizedPosture.deltaLabel;
  }
}

function kpiAttainmentCell(row: OutcomeKpiRow): string {
  return row.attainment.kind === 'no_target'
    ? 'No target on file'
    : row.attainment.label;
}

function activityWhenCell(row: OutcomeActivityRow): string {
  if (row.dayOffset === 0) return 'today';
  if (row.dayOffset < 0) return `${Math.abs(row.dayOffset)}d ago`;
  return `in ${row.dayOffset}d`;
}

/** Add a single italic "no data" note row to an otherwise-empty sheet. */
function addEmptyNoteRow(sheet: ExcelJS.Worksheet, note: string): void {
  const r = sheet.addRow([safeCell(note)]);
  r.getCell(1).font = { italic: true, color: { argb: SOURCE_XLSX.MUTED_TEXT } };
  r.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  r.height = 48;
}

export function buildTowerOutcomeReportWorkbook(
  payload: TowerOutcomeReportPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Atlas';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `AI Initiative Outcome Report · ${payload.tenantName}`;

  // ── Sheet 1 — Cover ─────────────────────────────────────────────────────
  buildCoverSheet(workbook, {
    title: `AI Initiative Outcome Report · ${payload.tenantName}`,
    eventCode: payload.tenantKey,
    eventName: 'Control Tower outcome & measurement report',
    tenantName: payload.tenantName,
    generatedAt: payload.generatedAt,
    instructions: [
      `Tower date: ${payload.towerToday}. The 90-Day Activity sheet is computed relative to this date.`,
      'Portfolio Metrics — deterministic Control Tower band tiles. Confidence NONE means the metric has no substrate.',
      'Initiatives — tracked AI initiatives with committed vs realized value and the realized-vs-forecast verdict.',
      'Measurement Model — every recorded KPI quarter. Attainment is computed against the loaded target only.',
      'Vendor Portfolio — vendor contracts tied to tracked initiatives, with renewal dates.',
      'Provenance: every figure is drawn from loaded substrate. Empty sheets state so explicitly; no value is estimated.',
    ],
  });

  // ── Sheet 2 — Portfolio Metrics ─────────────────────────────────────────
  const metricsSheet = workbook.addWorksheet('Portfolio Metrics', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  metricsSheet.columns = [
    { header: 'Metric', key: 'label', width: 32 },
    { header: 'Value', key: 'value', width: 14 },
    { header: 'Detail', key: 'subtext', width: 40 },
    { header: 'Confidence', key: 'confidence', width: 14 },
    { header: 'Basis', key: 'tooltip', width: 80 },
  ];
  applyHeaderRow(metricsSheet.getRow(1));
  if (payload.bandMetrics.length === 0) {
    addEmptyNoteRow(metricsSheet, 'No portfolio metrics available for this tenant.');
  } else {
    for (const m of payload.bandMetrics) {
      const r = metricsSheet.addRow({
        label: safeCell(m.label),
        value: safeCell(m.value),
        subtext: safeCell(m.subtext),
        confidence: safeCell(m.confidence),
        tooltip: safeCell(m.tooltip),
      });
      r.getCell('tooltip').alignment = { wrapText: true, vertical: 'top' };
      r.getCell('subtext').alignment = { wrapText: true, vertical: 'top' };
      r.height = 40;
    }
  }

  // ── Sheet 3 — Initiatives ───────────────────────────────────────────────
  const initSheet = workbook.addWorksheet('Initiatives', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  initSheet.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Initiative', key: 'name', width: 32 },
    { header: 'Stage', key: 'stage', width: 16 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Owner', key: 'owner', width: 24 },
    { header: 'Committed annual', key: 'committed', width: 18 },
    { header: 'Realized value', key: 'realized', width: 18 },
    { header: 'Realized vs forecast', key: 'verdict', width: 44 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Status summary', key: 'summary', width: 56 },
  ];
  applyHeaderRow(initSheet.getRow(1));
  if (payload.initiatives.length === 0) {
    addEmptyNoteRow(initSheet, payload.emptyNotes.initiatives ?? 'No tracked initiatives.');
  } else {
    for (const i of payload.initiatives) {
      const r = initSheet.addRow({
        id: safeCell(i.displayId),
        name: safeCell(i.name),
        stage: safeCell(i.stageLabel),
        status: safeCell(i.statusLabel),
        owner: safeCell(`${i.ownerName} · ${i.ownerTitle}`),
        committed: safeCell(i.committedAnnual),
        realized: safeCell(i.measuredValue),
        verdict: safeCell(realizedPostureCell(i)),
        confidence: safeCell(i.confidenceLevel),
        summary: safeCell(i.statusSummary),
      });
      r.getCell('summary').alignment = { wrapText: true, vertical: 'top' };
      r.getCell('verdict').alignment = { wrapText: true, vertical: 'top' };
      if (i.realizedPosture.kind === 'measured' && i.realizedPosture.ratio < 1) {
        r.getCell('verdict').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
        };
      }
      r.height = 32;
    }
  }

  // ── Sheet 4 — Measurement Model ─────────────────────────────────────────
  const kpiSheet = workbook.addWorksheet('Measurement Model', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  kpiSheet.columns = [
    { header: 'Initiative ID', key: 'id', width: 14 },
    { header: 'Initiative', key: 'name', width: 30 },
    { header: 'KPI', key: 'kpi', width: 30 },
    { header: 'Quarter', key: 'quarter', width: 14 },
    { header: 'Value', key: 'value', width: 16 },
    { header: 'Target', key: 'target', width: 16 },
    { header: 'Peer median', key: 'peer', width: 16 },
    { header: 'Attainment', key: 'attainment', width: 32 },
    { header: 'Confidence', key: 'confidence', width: 12 },
  ];
  applyHeaderRow(kpiSheet.getRow(1));
  if (payload.kpis.length === 0) {
    addEmptyNoteRow(kpiSheet, payload.emptyNotes.kpis ?? 'No KPI measurements recorded.');
  } else {
    for (const k of payload.kpis) {
      const r = kpiSheet.addRow({
        id: safeCell(k.initiativeDisplayId),
        name: safeCell(k.initiativeName),
        kpi: safeCell(k.kpiName),
        quarter: safeCell(k.quarter),
        value: safeCell(k.valueLabel),
        target: safeCell(k.targetLabel),
        peer: safeCell(k.peerMedianLabel),
        attainment: safeCell(kpiAttainmentCell(k)),
        confidence: safeCell(k.confidenceLevel),
      });
      r.getCell('attainment').alignment = { wrapText: true, vertical: 'top' };
      if (k.attainment.kind === 'measured' && k.attainment.pct < 100) {
        r.getCell('attainment').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
        };
      }
    }
  }

  // ── Sheet 5 — Vendor Portfolio ──────────────────────────────────────────
  const vendorSheet = workbook.addWorksheet('Vendor Portfolio', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  vendorSheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 28 },
    { header: 'Initiative ID', key: 'id', width: 14 },
    { header: 'Initiative', key: 'name', width: 30 },
    { header: 'Contract value', key: 'value', width: 18 },
    { header: 'Renewal date', key: 'renewal', width: 16 },
    { header: 'Days to renewal', key: 'days', width: 16 },
    { header: 'Financial health', key: 'health', width: 18 },
  ];
  applyHeaderRow(vendorSheet.getRow(1));
  if (payload.vendors.length === 0) {
    addEmptyNoteRow(vendorSheet, payload.emptyNotes.vendors ?? 'No vendor contracts recorded.');
  } else {
    for (const v of payload.vendors) {
      vendorSheet.addRow({
        vendor: safeCell(v.vendorName),
        id: safeCell(v.initiativeDisplayId),
        name: safeCell(v.initiativeName),
        value: safeCell(v.contractValue),
        renewal: safeCell(v.renewalDate),
        days: v.daysToRenewal === null ? '—' : v.daysToRenewal,
        health: safeCell(v.financialHealthLabel),
      });
    }
  }

  // ── Sheet 6 — 90-Day Activity ───────────────────────────────────────────
  const activitySheet = workbook.addWorksheet('90-Day Activity', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  activitySheet.columns = [
    { header: 'Date', key: 'date', width: 16 },
    { header: 'When', key: 'when', width: 14 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Summary', key: 'summary', width: 64 },
  ];
  applyHeaderRow(activitySheet.getRow(1));
  if (payload.activity90d.length === 0) {
    addEmptyNoteRow(activitySheet, payload.emptyNotes.activity ?? 'No activity in the 90-day window.');
  } else {
    for (const a of payload.activity90d) {
      const r = activitySheet.addRow({
        date: safeCell(a.date),
        when: safeCell(activityWhenCell(a)),
        category: a.category === 'renewal' ? 'Vendor renewal' : 'KPI measurement',
        summary: safeCell(a.summary),
      });
      r.getCell('summary').alignment = { wrapText: true, vertical: 'top' };
    }
  }

  return workbook;
}
