// Source · Stage-7 Renewal Decision xlsx renderer (dx7_renewal_decision).
//
// Methodology §3 Stage 7: SRM / renewals. The artifact is a Portable
// Renewal Cockpit content set: posture (renew / renegotiate / rebid /
// consolidate / exit), benchmark, incumbent leverage, alternatives,
// "what would change my mind." Grounded against vendor_contracts +
// operating_telemetry.
//
// Structure (11 sheets):
//   1. Cover                 — event metadata + how-to-use
//   2. Executive Answer      — one-page VP answer
//   3. Renewal Verdict       — main grid; one row per renewal candidate;
//                              posture + rationale + signals
//   4. Timing & Leverage     — renewal date, notice-window risk, leverage
//   5. Usage & Value         — utilization / shelfware / value leakage
//   6. Spend & Uplift        — benchmark, overspend and uplift bridge
//   7. Overlap & Risk        — rationalization + dependency risks
//   8. Negotiation Posture   — levers, give/gets, BATNA
//   9. SRM Tower Handoff     — actions to track after decision
//   10. Telemetry Signals    — operating_telemetry rows feeding the
//                              verdict; empty surfaces seed-gap line
//   11. Decision Triggers    — "what would change the verdict" — locked

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
  /** Whether the contract auto-renews; null when not recorded. */
  autoRenew?: boolean | null;
  /** Notice period required to prevent auto-renewal; null when not recorded. */
  noticePeriodDays?: number | null;
  /** Days until notice deadline, not contract end; null when not recorded. */
  daysToNoticeDeadline?: number | null;
  /** Utilization rate from license or telemetry data; null when not recorded. */
  utilizationRate?: number | null;
  /** Estimated shelfware / avoidable spend in USD; null when not recorded. */
  estimatedShelfwareUsd?: number | null;
  /** Should-cost benchmark in USD; null when not recorded. */
  benchmarkUsd?: number | null;
  /** Overspend versus benchmark in USD; null when not recorded. */
  overspendVsBenchmarkUsd?: number | null;
  /** Overlap / rationalization read. */
  overlapRead?: string;
  /** Operational, legal, transition or dependency risk read. */
  riskRead?: string;
  /** Sourcing team negotiation posture. */
  negotiationPosture?: string;
  /** Accountable owner for the next sourcing action. */
  owner?: string;
  /** SRM / Tower action to track after decision. */
  srmAction?: string;
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
      'Sheet 2 (Executive Answer) — board-grade answer: what to do, what is at stake, and what blocks sign-off.',
      'Sheets 3-9 — renewal timing, usage/value, spend/uplift, overlap/risk, negotiation posture, and SRM/Tower handoff. Seed gaps are explicit; blanks are not allowed.',
      'Sheet 10 (Telemetry Signals) — operating_telemetry rows that feed the verdict. Empty rows mean the substrate is not yet loaded for this tenant.',
      'Sheet 11 (Decision Triggers) is the locked "what would change my mind" rubric. Test the verdict against every trigger before sign-off.',
      'Auto-renewal trap (methodology §3 Stage 7): every contract approaching auto-renew within 90 days requires explicit posture, not silent renewal.',
    ],
  });

  buildExecutiveAnswerSheet(workbook, payload);
  buildVerdictSheet(workbook, payload.candidates);
  buildTimingSheet(workbook, payload.candidates);
  buildUsageSheet(workbook, payload.candidates);
  buildSpendSheet(workbook, payload.candidates);
  buildRiskSheet(workbook, payload.candidates);
  buildNegotiationSheet(workbook, payload.candidates);
  buildSrmSheet(workbook, payload.candidates);
  buildTelemetrySheet(workbook, payload.signals);
  buildTriggersSheet(workbook, payload.triggers);

  return workbook;
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null) return SEED_GAP_LINE;
  if (n === 0) return '$0';
  return `$${n.toLocaleString()}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return SEED_GAP_LINE;
  return `${Math.round(n * 100)}%`;
}

function fmtBool(v: boolean | null | undefined): string {
  if (v == null) return SEED_GAP_LINE;
  return v ? 'Yes' : 'No';
}

function fmtNumber(v: number | null | undefined): string {
  if (v == null) return SEED_GAP_LINE;
  return String(v);
}

function candidateOrGap(rows: ReadonlyArray<RenewalCandidate>): ReadonlyArray<RenewalCandidate> {
  if (rows.length > 0) return rows;
  return [
    {
      id: '',
      vendor: SEED_GAP_LINE,
      scope: 'No vendor_contracts records loaded for this tenant.',
      annualSpendUsd: 0,
      renewalDate: SEED_GAP_LINE,
      daysUntilRenewal: 0,
      posture: 'undetermined',
      rationale: 'Renewal decision cannot be computed without contract substrate.',
      topAlternative: SEED_GAP_LINE,
      finalDecision: '',
      overlapRead: SEED_GAP_LINE,
      riskRead: SEED_GAP_LINE,
      negotiationPosture: SEED_GAP_LINE,
      owner: SEED_GAP_LINE,
      srmAction: SEED_GAP_LINE,
    },
  ];
}

function buildExecutiveAnswerSheet(
  workbook: ExcelJS.Workbook,
  payload: RenewalDecisionPayload,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Executive Answer', {
    views: [{ showGridLines: false }],
  });
  sheet.columns = [
    { header: 'Question', key: 'question', width: 32 },
    { header: 'Answer', key: 'answer', width: 90 },
  ];
  applyHeaderRow(sheet.getRow(1));
  const totals = computeTotals(payload.candidates);
  const priority = payload.candidates.find((c) => c.posture !== 'renew_as_is') ?? payload.candidates[0];
  const answer = priority
    ? `${priority.vendor}: ${priority.posture}. ${priority.rationale}`
    : 'No renewal candidates recorded; load vendor_contracts before presenting an executive answer.';
  const rows = [
    ['Recommended decision', answer],
    ['Value at stake', `${fmtUsd(totals.spend)} combined annual spend across ${payload.candidates.length} candidate(s).`],
    ['Urgency', `${totals.imminent} renewal(s) inside 90 days; ${totals.noticeAtRisk} notice window(s) at risk or not recorded.`],
    ['Hard blocker', totals.seedGaps > 0 ? `${totals.seedGaps} required field(s) are not recorded.` : 'No hard blocker in the artifact payload.'],
    ['Next executive action', priority?.srmAction ?? 'Assign sourcing owner and generate SRM/Tower watch item.'],
  ];
  for (const [question, answerText] of rows) {
    const row = sheet.addRow({ question, answer: answerText });
    row.getCell('answer').alignment = { wrapText: true, vertical: 'top' };
    row.height = 34;
  }
  return sheet;
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

function buildTimingSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<RenewalCandidate>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Timing & Leverage', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 26 },
    { header: 'Renewal date', key: 'renewalDate', width: 16 },
    { header: 'Days to renewal', key: 'daysUntilRenewal', width: 16 },
    { header: 'Auto-renews?', key: 'autoRenew', width: 16 },
    { header: 'Notice period days', key: 'noticePeriodDays', width: 18 },
    { header: 'Days to notice deadline', key: 'daysToNoticeDeadline', width: 22 },
    { header: 'Leverage / timing read', key: 'timingRead', width: 60 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const c of candidateOrGap(rows)) {
    const r = sheet.addRow({
      vendor: safeCell(c.vendor),
      renewalDate: safeCell(c.renewalDate),
      daysUntilRenewal: c.daysUntilRenewal || SEED_GAP_LINE,
      autoRenew: fmtBool(c.autoRenew),
      noticePeriodDays: fmtNumber(c.noticePeriodDays),
      daysToNoticeDeadline: fmtNumber(c.daysToNoticeDeadline),
      timingRead: safeCell(buildTimingRead(c)),
    });
    r.getCell('timingRead').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
  }
  return sheet;
}

function buildUsageSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<RenewalCandidate>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Usage & Value', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 26 },
    { header: 'Scope', key: 'scope', width: 34 },
    { header: 'Utilization', key: 'utilization', width: 16 },
    { header: 'Shelfware USD', key: 'shelfware', width: 18 },
    { header: 'Usage / value read', key: 'usageRead', width: 70 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const c of candidateOrGap(rows)) {
    const r = sheet.addRow({
      vendor: safeCell(c.vendor),
      scope: safeCell(c.scope),
      utilization: fmtPct(c.utilizationRate),
      shelfware: fmtUsd(c.estimatedShelfwareUsd),
      usageRead: safeCell(buildUsageRead(c)),
    });
    r.getCell('usageRead').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
  }
  return sheet;
}

function buildSpendSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<RenewalCandidate>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Spend & Uplift', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 26 },
    { header: 'Annual spend USD', key: 'annualSpendUsd', width: 18 },
    { header: 'Benchmark USD', key: 'benchmarkUsd', width: 18 },
    { header: 'Overspend / uplift USD', key: 'overspendVsBenchmarkUsd', width: 22 },
    { header: 'Spend read', key: 'spendRead', width: 70 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const c of candidateOrGap(rows)) {
    const r = sheet.addRow({
      vendor: safeCell(c.vendor),
      annualSpendUsd: c.annualSpendUsd || SEED_GAP_LINE,
      benchmarkUsd: fmtUsd(c.benchmarkUsd),
      overspendVsBenchmarkUsd: fmtUsd(c.overspendVsBenchmarkUsd),
      spendRead: safeCell(buildSpendRead(c)),
    });
    for (const key of ['annualSpendUsd', 'benchmarkUsd', 'overspendVsBenchmarkUsd']) {
      const cell = r.getCell(key);
      if (typeof cell.value === 'number') cell.numFmt = '"$"#,##0';
    }
    r.getCell('spendRead').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
  }
  return sheet;
}

function buildRiskSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<RenewalCandidate>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Overlap & Risk', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 26 },
    { header: 'Overlap / rationalization', key: 'overlapRead', width: 48 },
    { header: 'Dependency / transition risk', key: 'riskRead', width: 58 },
    { header: 'Required executive challenge', key: 'challenge', width: 60 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const c of candidateOrGap(rows)) {
    const r = sheet.addRow({
      vendor: safeCell(c.vendor),
      overlapRead: safeCell(c.overlapRead ?? SEED_GAP_LINE),
      riskRead: safeCell(c.riskRead ?? SEED_GAP_LINE),
      challenge: safeCell(buildExecutiveChallenge(c)),
    });
    r.eachCell((cell) => {
      cell.alignment = { wrapText: true, vertical: 'top' };
    });
    r.height = 42;
  }
  return sheet;
}

function buildNegotiationSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<RenewalCandidate>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Negotiation Posture', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 26 },
    { header: 'Recommended posture', key: 'posture', width: 20 },
    { header: 'Negotiation stance', key: 'negotiationPosture', width: 58 },
    { header: 'BATNA / alternative', key: 'topAlternative', width: 34 },
    { header: 'Give / get logic', key: 'giveGet', width: 58 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const c of candidateOrGap(rows)) {
    const r = sheet.addRow({
      vendor: safeCell(c.vendor),
      posture: c.posture,
      negotiationPosture: safeCell(c.negotiationPosture ?? SEED_GAP_LINE),
      topAlternative: safeCell(c.topAlternative),
      giveGet: safeCell(buildGiveGet(c)),
    });
    r.eachCell((cell) => {
      cell.alignment = { wrapText: true, vertical: 'top' };
    });
    r.height = 42;
  }
  return sheet;
}

function buildSrmSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<RenewalCandidate>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('SRM Tower Handoff', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Vendor', key: 'vendor', width: 26 },
    { header: 'Owner', key: 'owner', width: 28 },
    { header: 'SRM / Tower action', key: 'srmAction', width: 66 },
    { header: 'Decision record required', key: 'decisionRecord', width: 58 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const c of candidateOrGap(rows)) {
    const r = sheet.addRow({
      vendor: safeCell(c.vendor),
      owner: safeCell(c.owner ?? SEED_GAP_LINE),
      srmAction: safeCell(c.srmAction ?? SEED_GAP_LINE),
      decisionRecord: safeCell(buildDecisionRecord(c)),
    });
    r.eachCell((cell) => {
      cell.alignment = { wrapText: true, vertical: 'top' };
    });
    r.height = 42;
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

function buildTimingRead(c: RenewalCandidate): string {
  if (c.renewalDate === SEED_GAP_LINE) return SEED_GAP_LINE;
  const notice = c.daysToNoticeDeadline == null ? 'notice deadline not recorded' : `${c.daysToNoticeDeadline} days to notice deadline`;
  const auto = c.autoRenew == null ? 'auto-renewal term not recorded' : c.autoRenew ? 'auto-renewal applies' : 'no auto-renewal recorded';
  return `${c.daysUntilRenewal || 'Unknown'} days to renewal; ${auto}; ${notice}.`;
}

function buildUsageRead(c: RenewalCandidate): string {
  if (c.utilizationRate == null && c.estimatedShelfwareUsd == null) {
    return 'Usage telemetry not recorded. Cannot quantify shelfware or adoption leakage.';
  }
  return `Utilization ${fmtPct(c.utilizationRate)}; estimated avoidable spend ${fmtUsd(c.estimatedShelfwareUsd)}.`;
}

function buildSpendRead(c: RenewalCandidate): string {
  if (c.benchmarkUsd == null && c.overspendVsBenchmarkUsd == null) {
    return 'Benchmark not recorded. Use Source should-cost or client rate card before approving renewal economics.';
  }
  return `Annual spend ${fmtUsd(c.annualSpendUsd)} versus benchmark ${fmtUsd(c.benchmarkUsd)}; uplift / overspend ${fmtUsd(c.overspendVsBenchmarkUsd)}.`;
}

function buildExecutiveChallenge(c: RenewalCandidate): string {
  if (c.posture === 'renew_as_is') return 'Challenge: why renew without competitive tension or usage evidence?';
  if (c.posture === 'rebid') return 'Challenge: can the business absorb transition risk before term end?';
  if (c.posture === 'exit') return 'Challenge: is there a funded transition path before service dependency breaks?';
  if (c.posture === 'consolidate') return 'Challenge: will consolidation create unacceptable vendor concentration?';
  if (c.posture === 'undetermined') return 'Do not decide until renewal date, spend, usage and owner are recorded.';
  return 'Challenge: what concession, benchmark or contract term must change before renewal is acceptable?';
}

function buildGiveGet(c: RenewalCandidate): string {
  if (c.posture === 'renegotiate') {
    return 'Give: term length or referenceability only after price/terms improve. Get: price protection, usage true-up, exit rights, AI/data clauses.';
  }
  if (c.posture === 'rebid') return 'Use incumbent as baseline only; require challenger proof, transition plan, and commercial walk-away.';
  if (c.posture === 'renew_as_is') return 'Limit give to administrative renewal; keep benchmark and usage review in SRM.';
  if (c.posture === 'consolidate') return 'Trade volume commitment for SKU rationalization, governance, and measurable savings.';
  if (c.posture === 'exit') return 'No concession unless exit risk exceeds commercial value; preserve service continuity.';
  return SEED_GAP_LINE;
}

function buildDecisionRecord(c: RenewalCandidate): string {
  return `Record final posture, owner, commercial concession target, critical terms, and Tower follow-up metric for ${c.vendor}.`;
}

function computeTotals(candidates: ReadonlyArray<RenewalCandidate>) {
  let spend = 0;
  let imminent = 0;
  let noticeAtRisk = 0;
  let seedGaps = 0;
  for (const c of candidates) {
    spend += c.annualSpendUsd;
    if (c.daysUntilRenewal > 0 && c.daysUntilRenewal < 90) imminent += 1;
    if (c.daysToNoticeDeadline == null || c.daysToNoticeDeadline < 30) noticeAtRisk += 1;
    if (c.utilizationRate == null) seedGaps += 1;
    if (c.benchmarkUsd == null) seedGaps += 1;
    if (!c.owner) seedGaps += 1;
  }
  return { spend, imminent, noticeAtRisk, seedGaps };
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
