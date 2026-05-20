// Source · Stage-7 Renewal Decision xlsx renderer (dx7_renewal_decision).
//
// Methodology §3 Stage 7: SRM / renewals. The artifact is a Portable
// Renewal Cockpit content set: posture (renew / renegotiate / rebid /
// consolidate / exit), benchmark, incumbent leverage, alternatives,
// "what would change my mind." Grounded against vendor_contracts +
// operating_telemetry.
//
// Structure (4 sheets):
//   1. Cover                 — event metadata + how-to-use
//   2. Renewal Verdict       — main grid; one row per renewal candidate;
//                              posture + rationale + signals
//   3. Telemetry Signals     — operating_telemetry rows feeding the
//                              verdict; empty surfaces seed-gap line
//   4. Decision Triggers     — "what would change the verdict" — locked

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  safeCell,
} from '@/lib/exports-shared/xlsx-base';

export type RenewalPosture =
  | 'renew_as_is'
  | 'renegotiate'
  | 'rebid'
  | 'consolidate'
  | 'exit'
  | 'undetermined';

export interface RenewalCandidate {
  /** Stable id. */
  id: string;
  /** Vendor name. */
  vendor: string;
  /** Scope on file. */
  scope: string;
  /** Annual spend in USD; 0 when not recorded. */
  annualSpendUsd: number;
  /** Renewal date (ISO 8601 or human label). */
  renewalDate: string;
  /** Days-until-renewal (negative = past). 0 = unknown. */
  daysUntilRenewal: number;
  /** Recommended posture. */
  posture: RenewalPosture;
  /** Plain-language rationale. */
  rationale: string;
  /** Top alternative vendor candidate (or "—" / "none recorded"). */
  topAlternative: string;
  /** Buyer-fillable: final decision after panel review. */
  finalDecision: string;
}

export interface RenewalTelemetrySignal {
  metric: string;
  value: string;
  source: string;
  /** Posture-impact note — what this signal pushes toward. */
  impact: string;
}

export interface RenewalDecisionTrigger {
  trigger: string;
  ifTrue: string;
}

export interface RenewalDecisionPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  generatedAt: string;
  /** One row per vendor under renewal review. */
  candidates: ReadonlyArray<RenewalCandidate>;
  /** Operating telemetry signals from substrate. */
  signals: ReadonlyArray<RenewalTelemetrySignal>;
  /** Locked "what would change my mind" triggers. */
  triggers: ReadonlyArray<RenewalDecisionTrigger>;
}

const SEED_GAP_LINE = '— Not recorded — seed gap';

export function buildRenewalDecisionWorkbook(
  payload: RenewalDecisionPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Renewal Decision · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `Renewal Decision · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Sheet 2 (Renewal Verdict) — one row per renewal candidate, recommended posture and rationale. Buyer fills Final Decision after panel review.',
      'Sheet 3 (Telemetry Signals) — operating_telemetry rows that feed the verdict. Empty rows mean the substrate is not yet loaded for this tenant.',
      'Sheet 4 (Decision Triggers) is the locked "what would change my mind" rubric. Test the verdict against every trigger before sign-off.',
      'Auto-renewal trap (methodology §3 Stage 7): every contract approaching auto-renew within 90 days requires explicit posture, not silent renewal.',
    ],
  });

  buildVerdictSheet(workbook, payload.candidates);
  buildTelemetrySheet(workbook, payload.signals);
  buildTriggersSheet(workbook, payload.triggers);

  return workbook;
}

function buildVerdictSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<RenewalCandidate>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Renewal Verdict', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Candidate ID', key: 'id', width: 14 },
    { header: 'Vendor', key: 'vendor', width: 26 },
    { header: 'Scope', key: 'scope', width: 36 },
    { header: 'Annual spend USD', key: 'annualSpendUsd', width: 16 },
    { header: 'Renewal date', key: 'renewalDate', width: 14 },
    { header: 'Days until', key: 'daysUntilRenewal', width: 12 },
    { header: 'Posture', key: 'posture', width: 16 },
    { header: 'Rationale', key: 'rationale', width: 36 },
    { header: 'Top alternative', key: 'topAlternative', width: 22 },
    { header: 'Final decision (buyer)', key: 'finalDecision', width: 22 },
  ];
  applyHeaderRow(sheet.getRow(1));
  if (rows.length === 0) {
    const r = sheet.addRow({
      id: '',
      vendor: SEED_GAP_LINE,
      scope: 'No vendor_contracts records loaded for this tenant. Renewal verdict cannot be computed without contract data.',
      annualSpendUsd: '',
      renewalDate: '',
      daysUntilRenewal: '',
      posture: 'undetermined',
      rationale: '',
      topAlternative: '',
      finalDecision: '',
    });
    r.getCell('vendor').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    return sheet;
  }
  for (const c of rows) {
    const r = sheet.addRow({
      id: safeCell(c.id),
      vendor: safeCell(c.vendor),
      scope: safeCell(c.scope),
      annualSpendUsd: c.annualSpendUsd,
      renewalDate: safeCell(c.renewalDate),
      daysUntilRenewal: c.daysUntilRenewal,
      posture: c.posture,
      rationale: safeCell(c.rationale),
      topAlternative: safeCell(c.topAlternative),
      finalDecision: '',
    });
    r.getCell('annualSpendUsd').numFmt = '"$"#,##0';
    r.getCell('rationale').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
    if (c.posture === 'exit' || c.posture === 'rebid') {
      r.getCell('posture').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
      };
    } else if (c.posture === 'renegotiate' || c.posture === 'consolidate') {
      r.getCell('posture').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    // Highlight imminent renewals (< 90d).
    if (c.daysUntilRenewal > 0 && c.daysUntilRenewal < 90) {
      r.getCell('daysUntilRenewal').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
      };
    }
    r.getCell('finalDecision').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
  }
  return sheet;
}

function buildTelemetrySheet(
  workbook: ExcelJS.Workbook,
  signals: ReadonlyArray<RenewalTelemetrySignal>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Telemetry Signals', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 24 },
    { header: 'Value', key: 'value', width: 18 },
    { header: 'Source', key: 'source', width: 24 },
    { header: 'Posture impact', key: 'impact', width: 50 },
  ];
  applyHeaderRow(sheet.getRow(1));
  if (signals.length === 0) {
    const r = sheet.addRow({
      metric: SEED_GAP_LINE,
      value: '',
      source: '',
      impact: 'No operating_telemetry records loaded. Verdict relies on contract data only until telemetry is seeded.',
    });
    r.getCell('metric').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    return sheet;
  }
  for (const s of signals) {
    const r = sheet.addRow({
      metric: safeCell(s.metric),
      value: safeCell(s.value),
      source: safeCell(s.source),
      impact: safeCell(s.impact),
    });
    r.getCell('impact').alignment = { wrapText: true, vertical: 'top' };
    r.height = 32;
  }
  return sheet;
}

function buildTriggersSheet(
  workbook: ExcelJS.Workbook,
  triggers: ReadonlyArray<RenewalDecisionTrigger>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Decision Triggers', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Trigger', key: 'trigger', width: 42 },
    { header: 'If true …', key: 'ifTrue', width: 70 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const t of triggers) {
    const r = sheet.addRow({
      trigger: safeCell(t.trigger),
      ifTrue: safeCell(t.ifTrue),
    });
    applyLockedRow(r);
    r.getCell('ifTrue').alignment = { wrapText: true, vertical: 'top' };
    r.height = 32;
  }
  return sheet;
}
