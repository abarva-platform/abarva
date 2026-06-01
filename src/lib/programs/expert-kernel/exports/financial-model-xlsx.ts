// Moves Expert Kernel exports — XLSX financial-model renderer.
//
// Renders the Design & Plan financial model as an Excel workbook:
//   Cover         — Move metadata, the honesty note
//   Baseline      — current-state metrics with source, quality, seed gaps
//   Effort        — workstream × role-mix effort, base / conservative / upside
//   Value forecast— gross value, the six-factor haircut, net value per year
//   Sensitivity   — base / conservative / upside economics + top movers
//   Roadmap       — per-phase costed roadmap with value milestones
//
// HARD RULE (spec §10.2): no fabrication. A null / seed-gap value renders the
// SEED_GAP_MARKER string, never a blank or invented cell. A `kill` verdict
// and a null payback are stated plainly.
//
// Pure module: deterministic, no I/O. The route serializes the workbook.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  buildCoverSheet,
  safeCell,
} from '@/lib/exports-shared/xlsx-base';

import type { ExpertReviewCaseEntry } from '../expert-review-cases';
import { buildArtifactVisualExhibits } from '../artifact-visual-exhibits';
import type { ValueForecast } from '../value-forecast';
import {
  HONESTY_FOOTER,
  SEED_GAP_MARKER,
  paybackText,
  recommendationLabel,
} from './format-helpers';
import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
} from '@/lib/ai-liability/human-decision-controls';

/** Input to the XLSX renderer. */
export interface KernelXlsxInput {
  caseEntry: ExpertReviewCaseEntry;
  /** ISO date the workbook was generated. */
  generatedOn: string;
}

/** A workbook cell value — number for figures, string for honest seed gaps. */
type Cell = number | string;

/** A figure cell, honest about null. */
function fig(n: number | null | undefined): Cell {
  if (n === null || n === undefined || !Number.isFinite(n)) {
    return SEED_GAP_MARKER;
  }
  return n;
}

function titleRow(sheet: ExcelJS.Worksheet, text: string): void {
  const r = sheet.addRow([text]);
  r.font = { size: 13, bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
  sheet.addRow([]);
}

function applyUsdFormat(cell: ExcelJS.Cell): void {
  if (typeof cell.value === 'number') cell.numFmt = '$#,##0';
}

/**
 * Build the financial-model workbook for a tenant case. Deterministic.
 */
export function buildKernelFinancialModelXlsx(
  input: KernelXlsxInput,
): ExcelJS.Workbook {
  const { caseEntry, generatedOn } = input;
  const { skeleton } = caseEntry.buildCase();
  const { fullCase } = caseEntry.buildFullCase();
  const value = caseEntry.buildValueForecast();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Moves';
  workbook.created = new Date(generatedOn);
  workbook.title = `Moves financial model · ${caseEntry.moveLabel}`;

  // ── Cover ────────────────────────────────────────────────────────────────
  buildCoverSheet(workbook, {
    title: `Moves financial model · ${caseEntry.moveLabel}`,
    eventCode: caseEntry.moveRef,
    eventName: caseEntry.moveLabel,
    tenantName: caseEntry.tenantLabel,
    issuedBy: 'AbarVa · Moves Expert Kernel',
    generatedAt: generatedOn,
    instructions: [
      'Every figure is produced by the Moves Expert Kernel from the tenant’s audited substrate.',
      `"${SEED_GAP_MARKER}" marks an input that is not recorded — it is declared, never invented.`,
      `Recommendation: ${recommendationLabel(skeleton.recommendation)}. ${skeleton.recommendationRationale}`,
      `Payback: ${paybackText(skeleton)}.`,
      'Effort rests on a researched planning rate card — a market range, not a quote.',
      AI_DECISION_SUPPORT_WATERMARK,
      HUMAN_DECISION_ATTESTATION_TEXT,
      HONESTY_FOOTER,
    ],
  });

  buildBaselineSheet(workbook, skeleton);
  buildEffortSheet(workbook, skeleton);
  buildValueForecastSheet(workbook, value);
  buildSensitivitySheet(workbook, skeleton, fullCase);
  buildRoadmapSheet(workbook, fullCase);
  buildExecutiveVisualsSheet(workbook, caseEntry);

  return workbook;
}

// ── Baseline sheet ─────────────────────────────────────────────────────────

function buildBaselineSheet(
  workbook: ExcelJS.Workbook,
  skeleton: ReturnType<ExpertReviewCaseEntry['buildCase']>['skeleton'],
): void {
  const sheet = workbook.addWorksheet('Baseline', {
    views: [{ showGridLines: true }],
  });
  titleRow(sheet, 'Current-state baseline');
  sheet.columns = [
    { key: 'metric', width: 32 },
    { key: 'value', width: 16 },
    { key: 'unit', width: 22 },
    { key: 'source', width: 44 },
    { key: 'quality', width: 14 },
    { key: 'confidence', width: 14 },
    { key: 'asOf', width: 14 },
  ];
  const header = sheet.addRow([
    'Metric',
    'Value',
    'Unit',
    'Source',
    'Source quality',
    'Confidence',
    'As of',
  ]);
  applyHeaderRow(header);
  for (const m of skeleton.baseline.metrics) {
    const r = sheet.addRow([
      safeCell(m.label),
      m.recorded ? fig(m.value) : SEED_GAP_MARKER,
      safeCell(m.unit),
      safeCell(m.source),
      safeCell(m.sourceQuality),
      safeCell(m.confidence),
      safeCell(m.asOf),
    ]);
    if (!m.recorded) {
      r.eachCell((c) => {
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
        };
      });
    }
  }
  sheet.addRow([]);
  const cov = sheet.addRow([
    'Coverage',
    skeleton.baseline.coverage,
    'fraction recorded',
  ]);
  cov.getCell(1).font = { bold: true };
  cov.getCell(2).numFmt = '0%';
}

function buildExecutiveVisualsSheet(
  workbook: ExcelJS.Workbook,
  caseEntry: ExpertReviewCaseEntry,
): void {
  const sheet = workbook.addWorksheet('Executive visuals', {
    views: [{ showGridLines: false }],
  });
  titleRow(sheet, 'Board-grade visual exhibit spine');
  sheet.columns = [
    { key: 'artifact', width: 22 },
    { key: 'exhibit', width: 34 },
    { key: 'status', width: 12 },
    { key: 'cSuiteUse', width: 56 },
    { key: 'data', width: 64 },
    { key: 'notes', width: 64 },
  ];
  const header = sheet.addRow([
    'Artifact',
    'Exhibit',
    'Status',
    'C-suite use',
    'Figure / data',
    'Notes',
  ]);
  applyHeaderRow(header);

  const exhibits = buildArtifactVisualExhibits(
    caseEntry.id as Parameters<typeof buildArtifactVisualExhibits>[0],
  ).filter((exhibit) =>
    exhibit.artifactIds.some((artifactId) =>
      ['business_case_pack', 'financial_model', 'cfo_pack'].includes(artifactId),
    ),
  );

  for (const exhibit of exhibits) {
    const row = sheet.addRow([
      exhibit.artifactIds.join(', '),
      safeCell(exhibit.title),
      exhibit.status,
      safeCell(exhibit.cSuiteUse),
      safeCell(
        exhibit.data
          .slice(0, 5)
          .map((datum) => `${datum.label}: ${datum.value}${datum.unit ? ` ${datum.unit}` : ''}`)
          .join('; '),
      ),
      safeCell(exhibit.notes.slice(0, 3).join(' ')),
    ]);
    row.getCell(4).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(5).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(6).alignment = { wrapText: true, vertical: 'top' };
    if (exhibit.status === 'gap') {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
        };
      });
    }
  }
}

// ── Effort sheet ───────────────────────────────────────────────────────────

function buildEffortSheet(
  workbook: ExcelJS.Workbook,
  skeleton: ReturnType<ExpertReviewCaseEntry['buildCase']>['skeleton'],
): void {
  const sheet = workbook.addWorksheet('Effort', {
    views: [{ showGridLines: true }],
  });
  titleRow(sheet, 'Effort estimate — workstream × role-mix');
  sheet.columns = [
    { key: 'ws', width: 26 },
    { key: 'months', width: 12 },
    { key: 'headcount', width: 14 },
    { key: 'upside', width: 16 },
    { key: 'base', width: 16 },
    { key: 'conservative', width: 16 },
    { key: 'human', width: 16 },
    { key: 'agent', width: 16 },
  ];
  const header = sheet.addRow([
    'Workstream',
    'Months',
    'Headcount',
    'Upside cost',
    'Base cost',
    'Conservative cost',
    'Human cost',
    'Agent cost',
  ]);
  applyHeaderRow(header);
  for (const w of skeleton.effort.workstreams) {
    const r = sheet.addRow([
      safeCell(w.label),
      w.durationMonths,
      w.totalHeadcount,
      fig(w.cost.low),
      fig(w.baseCost),
      fig(w.cost.high),
      fig(w.humanCost),
      fig(w.agentCost),
    ]);
    for (let c = 4; c <= 8; c++) applyUsdFormat(r.getCell(c));
  }
  sheet.addRow([]);
  const total = sheet.addRow([
    'TOTAL',
    '',
    '',
    fig(skeleton.effort.totalCost.low),
    fig(skeleton.effort.totalCost.point),
    fig(skeleton.effort.totalCost.high),
    fig(skeleton.effort.totalHumanCost),
    fig(skeleton.effort.totalAgentCost),
  ]);
  total.font = { bold: true };
  for (let c = 4; c <= 8; c++) {
    applyUsdFormat(total.getCell(c));
    total.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
    };
  }
  sheet.addRow([]);
  const splitHeader = sheet.addRow(['AI-build vs. business-change split']);
  splitHeader.font = { bold: true };
  const bvc = skeleton.effort.buildVsChange;
  const aiRow = sheet.addRow(['AI-build effort', '', '', '', fig(bvc.aiBuildCost)]);
  applyUsdFormat(aiRow.getCell(5));
  const chRow = sheet.addRow([
    'Business-change effort',
    '',
    '',
    '',
    fig(bvc.businessChangeCost),
  ]);
  applyUsdFormat(chRow.getCell(5));
  const frRow = sheet.addRow([
    'Business-change share',
    '',
    '',
    '',
    bvc.businessChangeFraction,
  ]);
  frRow.getCell(5).numFmt = '0%';
  const note = sheet.addRow(['Read', safeCell(bvc.note)]);
  note.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  note.height = 48;
  const rateRow = sheet.addRow([
    'Rate card',
    safeCell(skeleton.effort.rateCard.label),
  ]);
  rateRow.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  rateRow.height = 48;
}

// ── Value-forecast sheet ───────────────────────────────────────────────────

function buildValueForecastSheet(
  workbook: ExcelJS.Workbook,
  value: ValueForecast,
): void {
  const sheet = workbook.addWorksheet('Value forecast', {
    views: [{ showGridLines: true }],
  });
  titleRow(sheet, 'Value forecast — gross value, haircut, net value');

  // Haircut factors.
  const factorHeader = sheet.addRow([
    'Haircut dimension',
    'Score (0..1)',
    'Weight',
    'Discount contribution',
  ]);
  applyHeaderRow(factorHeader);
  for (const f of value.factors) {
    const r = sheet.addRow([
      safeCell(f.dimension),
      f.score,
      f.weight,
      f.discountContribution,
    ]);
    r.getCell(2).numFmt = '0.00';
    r.getCell(3).numFmt = '0.00';
    r.getCell(4).numFmt = '0.0000';
  }
  const haircutRow = sheet.addRow([
    'Total haircut',
    value.totalHaircut,
    'Retained',
    value.retainedFraction,
  ]);
  haircutRow.font = { bold: true };
  haircutRow.getCell(2).numFmt = '0%';
  haircutRow.getCell(4).numFmt = '0%';
  sheet.addRow([]);

  // Per-year curve.
  const curveHeader = sheet.addRow([
    'Year',
    'Adoption fraction',
    'Gross value (base)',
    'Net value low',
    'Net value (base)',
    'Net value high',
  ]);
  applyHeaderRow(curveHeader);
  for (const y of value.curve) {
    const r = sheet.addRow([
      y.year,
      y.adoptionFraction,
      fig(y.grossValue.point),
      fig(y.netValue.low),
      fig(y.netValue.point),
      fig(y.netValue.high),
    ]);
    r.getCell(2).numFmt = '0%';
    for (let c = 3; c <= 6; c++) applyUsdFormat(r.getCell(c));
  }
  const totalRow = sheet.addRow([
    'TOTAL',
    '',
    fig(value.totalGrossValue.point),
    fig(value.totalNetValue.low),
    fig(value.totalNetValue.point),
    fig(value.totalNetValue.high),
  ]);
  totalRow.font = { bold: true };
  for (let c = 3; c <= 6; c++) {
    applyUsdFormat(totalRow.getCell(c));
    totalRow.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
    };
  }
  sheet.addRow([]);
  if (value.monetisationBlocked) {
    const warn = sheet.addRow([
      'Monetisation blocked — the gross value rests on a seed-gap proxy. ' +
        'The net value above is an illustrative ceiling, NOT a claimed return.',
    ]);
    warn.getCell(1).font = { bold: true, color: { argb: 'FF8B1F0F' } };
    warn.getCell(1).alignment = { wrapText: true };
    warn.height = 40;
  }
  sheet.getColumn(1).width = 26;
  for (let c = 2; c <= 6; c++) sheet.getColumn(c).width = 18;
}

// ── Sensitivity sheet ──────────────────────────────────────────────────────

function buildSensitivitySheet(
  workbook: ExcelJS.Workbook,
  skeleton: ReturnType<ExpertReviewCaseEntry['buildCase']>['skeleton'],
  fullCase: ReturnType<ExpertReviewCaseEntry['buildFullCase']>['fullCase'],
): void {
  const sheet = workbook.addWorksheet('Sensitivity', {
    views: [{ showGridLines: true }],
  });
  titleRow(sheet, 'Three-scenario sensitivity');
  const header = sheet.addRow([
    'Scenario',
    'Investment',
    'Net value',
    'Net return',
    'ROI',
    'Payback (months)',
  ]);
  applyHeaderRow(header);
  const scenarios: Array<[string, typeof fullCase.sensitivity.base]> = [
    ['Base', fullCase.sensitivity.base],
    ['Conservative', fullCase.sensitivity.conservative],
    ['Upside', fullCase.sensitivity.upside],
  ];
  for (const [label, s] of scenarios) {
    const r = sheet.addRow([
      label,
      fig(s.investment),
      fig(s.netValue),
      fig(s.netReturn),
      s.roi === null ? SEED_GAP_MARKER : s.roi,
      s.paybackMonths === null ? SEED_GAP_MARKER : s.paybackMonths,
    ]);
    for (let c = 2; c <= 4; c++) applyUsdFormat(r.getCell(c));
    if (typeof r.getCell(5).value === 'number') r.getCell(5).numFmt = '0.00"×"';
  }
  sheet.addRow([]);
  const wbRow = sheet.addRow([
    'What breaks the case',
    safeCell(fullCase.sensitivity.whatBreaksTheCase),
  ]);
  wbRow.getCell(1).font = { bold: true };
  wbRow.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  wbRow.height = 56;
  const drRow = sheet.addRow([
    'Downside read',
    safeCell(fullCase.sensitivity.downsideRead),
  ]);
  drRow.getCell(1).font = { bold: true };
  drRow.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  drRow.height = 56;
  sheet.addRow([]);

  const moverHeader = sheet.addRow([
    'Top mover',
    'Statement',
    'Owner',
    'Confidence',
    'Seed-gap proxy',
  ]);
  applyHeaderRow(moverHeader);
  for (const m of skeleton.assumptions.topMovers) {
    const r = sheet.addRow([
      safeCell(m.key),
      safeCell(m.statement),
      safeCell(m.owner),
      safeCell(m.confidence),
      m.isSeedGapProxy ? 'yes' : 'no',
    ]);
    r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    r.height = 48;
  }
  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 60;
  for (let c = 3; c <= 6; c++) sheet.getColumn(c).width = 16;
}

// ── Roadmap sheet ──────────────────────────────────────────────────────────

function buildRoadmapSheet(
  workbook: ExcelJS.Workbook,
  fullCase: ReturnType<ExpertReviewCaseEntry['buildFullCase']>['fullCase'],
): void {
  const sheet = workbook.addWorksheet('Roadmap', {
    views: [{ showGridLines: true }],
  });
  titleRow(sheet, 'Costed roadmap — per-phase investment & value');
  const header = sheet.addRow([
    'Phase',
    'Investment',
    'Cumulative investment',
    'Annual value unlocked',
    'Foundational',
    'Value milestone',
  ]);
  applyHeaderRow(header);
  for (const p of fullCase.phaseProfile) {
    const r = sheet.addRow([
      safeCell(p.phaseLabel),
      fig(p.investment),
      fig(p.cumulativeInvestment),
      fig(p.annualValueUnlocked),
      p.isFoundational ? 'yes — enablement only' : 'no',
      safeCell(p.valueMilestone),
    ]);
    applyUsdFormat(r.getCell(2));
    applyUsdFormat(r.getCell(3));
    applyUsdFormat(r.getCell(4));
    r.getCell(6).alignment = { wrapText: true, vertical: 'top' };
    r.height = 48;
  }
  sheet.getColumn(1).width = 32;
  for (let c = 2; c <= 4; c++) sheet.getColumn(c).width = 20;
  sheet.getColumn(5).width = 20;
  sheet.getColumn(6).width = 60;
}

/** Re-export the content type for the route. */
export { XLSX_CONTENT_TYPE } from '@/lib/exports-shared/xlsx-base';
