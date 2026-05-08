// Source · d16 Evaluation Scorecard template
//
// Vendor × criteria evaluation matrix. Locked criteria + weights drive
// formula-computed weighted scores per vendor; Decision Notes capture
// dissents and tiebreakers; Score Guidance defines the 1-5 rubric so
// every evaluator scores the same way.
//
// Structure (5 sheets):
//   1. Cover                 — event metadata, evaluator slot, round
//                              indicator
//   2. Criteria & Weights    — locked: criterion / weight / description.
//                              Bottom row asserts weights sum to 100.
//   3. Vendor Scoring        — main grid; one row per criterion, two
//                              columns per vendor (raw 1-5 + weighted).
//                              Bottom row computes total weighted score
//                              per vendor.
//   4. Score Guidance        — locked: 1-5 rubric definitions
//   5. Decision Notes        — narrative for tiebreakers, dissent log,
//                              cross-checks against d20 trap log
//
// Pure: payload → ExcelJS.Workbook. Vendor list is variable-length so
// the column layout is computed dynamically.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  safeCell,
} from './xlsx-base';

/** One criterion. Weight is the integer percentage (0-100). */
export interface ScorecardCriterion {
  id: string;
  /** Short label (e.g. "Functional fit"). */
  label: string;
  /** Weight as percent (sum across all rows must equal 100). */
  weightPercent: number;
  /** Plain-language description; appears in the Criteria sheet. */
  description: string;
}

/** Score-guidance rubric row (locked). */
export interface ScoreGuidanceRow {
  score: 1 | 2 | 3 | 4 | 5;
  label: string;
  rubric: string;
}

export interface ScorecardPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  /** ISO 8601 of generation. */
  generatedAt: string;
  /** Round indicator (e.g. "Initial · pre-BAFO" or "BAFO round 2"). */
  roundLabel?: string;
  /** Locked criteria + weights — typically pulled from d17 weight log. */
  criteria: ReadonlyArray<ScorecardCriterion>;
  /** Vendor names — typically pulled from d12 shortlist. */
  vendors: ReadonlyArray<string>;
  /** Score guidance rubric. */
  scoreGuidance: ReadonlyArray<ScoreGuidanceRow>;
}

/** Build the workbook. */
export function buildScorecardWorkbook(
  payload: ScorecardPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Evaluation Scorecard · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `Evaluation Scorecard · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Sheet 2 (Criteria & Weights) is locked. Weights must sum to 100; the bottom row of Sheet 2 verifies this.',
      'Sheet 3 (Vendor Scoring) — score each criterion on a 1-5 scale per vendor. Weighted columns are formula-driven.',
      'Sheet 4 (Score Guidance) is the locked rubric. Apply the same definition consistently across every vendor.',
      'Sheet 5 (Decision Notes) — record tiebreaker rationale, dissents, and cross-checks against the d20 trap log.',
      'Final weighted scores compute automatically; do not edit the totals row.',
    ],
  });
  // Evaluator + round slots on the Cover sheet.
  const cover = workbook.getWorksheet('Cover');
  if (cover) {
    cover.addRow([]);
    const evaluatorRow = cover.addRow(['Evaluator name', '']);
    evaluatorRow.getCell(1).font = {
      bold: true,
      color: { argb: SOURCE_XLSX.HEADER_FILL },
    };
    evaluatorRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    if (payload.roundLabel) {
      const roundRow = cover.addRow(['Evaluation round', safeCell(payload.roundLabel)]);
      roundRow.getCell(1).font = {
        bold: true,
        color: { argb: SOURCE_XLSX.HEADER_FILL },
      };
    }
  }

  buildCriteriaSheet(workbook, payload.criteria);
  buildScoringSheet(workbook, payload.criteria, payload.vendors);
  buildScoreGuidanceSheet(workbook, payload.scoreGuidance);
  buildDecisionNotesSheet(workbook);

  return workbook;
}

function buildCriteriaSheet(
  workbook: ExcelJS.Workbook,
  criteria: ReadonlyArray<ScorecardCriterion>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Criteria & Weights', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Criterion ID', key: 'id', width: 18 },
    { header: 'Criterion', key: 'label', width: 28 },
    { header: 'Weight (%)', key: 'weight', width: 14 },
    { header: 'Description', key: 'description', width: 70 },
  ];
  applyHeaderRow(sheet.getRow(1));

  let rowNum = 2;
  for (const c of criteria) {
    const r = sheet.addRow({
      id: safeCell(c.id),
      label: safeCell(c.label),
      weight: c.weightPercent,
      description: safeCell(c.description),
    });
    applyLockedRow(r);
    r.getCell('weight').numFmt = '0';
    r.getCell('description').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
    rowNum += 1;
  }
  // Sum row at the bottom — formula-asserts the weights add to 100.
  const sumRow = sheet.addRow({
    id: 'TOTAL',
    label: '',
    weight: { formula: `SUM(C2:C${rowNum - 1})` },
    description: 'Must equal 100; if not, re-derive weights via d17 weight log.',
  });
  sumRow.font = { bold: true };
  sumRow.getCell('weight').numFmt = '0';
  sumRow.getCell('weight').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
  };
  // Stash the criterion count so the scoring sheet can reference it.
  sheet.getCell(`A${rowNum}`).name = 'Scorecard_TotalsRow';

  return sheet;
}

function buildScoringSheet(
  workbook: ExcelJS.Workbook,
  criteria: ReadonlyArray<ScorecardCriterion>,
  vendors: ReadonlyArray<string>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Vendor Scoring', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 3, ySplit: 2 }],
  });

  // Build header rows. Row 1 = vendor labels (merged across raw + weighted),
  // row 2 = sub-headers (Criterion / Weight / Raw / Weighted ...).
  const headerRow1: ExcelJS.CellValue[] = ['', '', ''];
  const headerRow2: ExcelJS.CellValue[] = ['Criterion', 'Weight (%)', 'Description'];
  for (const v of vendors) {
    headerRow1.push(v, '');
    headerRow2.push('Raw (1-5)', 'Weighted');
  }
  const r1 = sheet.addRow(headerRow1);
  const r2 = sheet.addRow(headerRow2);
  applyHeaderRow(r1);
  applyHeaderRow(r2);
  // Merge each vendor's two-cell header in row 1.
  for (let i = 0; i < vendors.length; i++) {
    const startCol = 4 + i * 2;
    const endCol = startCol + 1;
    const startAddr = sheet.getCell(1, startCol).address;
    const endAddr = sheet.getCell(1, endCol).address;
    sheet.mergeCells(`${startAddr}:${endAddr}`);
  }

  // Set column widths now that we know the column count.
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 60;
  for (let i = 0; i < vendors.length; i++) {
    sheet.getColumn(4 + i * 2).width = 14;
    sheet.getColumn(5 + i * 2).width = 14;
  }

  // One row per criterion. Locked Criterion / Weight / Description; raw +
  // weighted columns for each vendor. Weighted = raw × weight (where weight
  // is the integer 0-100; weighted = raw × weight, max = 5 × 100 = 500).
  let rowNum = 3;
  for (const c of criteria) {
    const baseCells: ExcelJS.CellValue[] = [
      safeCell(c.label),
      c.weightPercent,
      safeCell(c.description),
    ];
    for (let v = 0; v < vendors.length; v++) {
      const rawColLetter = colLetter(4 + v * 2);
      const weightedColLetter = colLetter(5 + v * 2);
      baseCells.push(''); // raw — vendor evaluator fills
      baseCells.push({ formula: `IFERROR(${rawColLetter}${rowNum}*B${rowNum},"")` });
      // We push the placeholder above; we'll fix up the formula reference.
      void weightedColLetter; // referenced via IFERROR formula above
    }
    const r = sheet.addRow(baseCells);
    // Lock Criterion / Weight / Description.
    r.getCell(1).protection = { locked: true };
    r.getCell(2).protection = { locked: true };
    r.getCell(3).protection = { locked: true };
    r.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    r.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    r.getCell(2).numFmt = '0';
    r.getCell(3).alignment = { wrapText: true, vertical: 'top' };
    // Highlight raw-score cells; data validation 1-5.
    for (let v = 0; v < vendors.length; v++) {
      const rawColIndex = 4 + v * 2;
      const weightedColIndex = 5 + v * 2;
      r.getCell(rawColIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
      r.getCell(rawColIndex).dataValidation = {
        type: 'whole',
        operator: 'between',
        allowBlank: true,
        formulae: [1, 5],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Score range',
        error: 'Use 1-5 (refer to Score Guidance sheet).',
      };
      r.getCell(weightedColIndex).numFmt = '0';
      r.getCell(weightedColIndex).protection = { locked: true };
    }
    r.height = 32;
    rowNum += 1;
  }

  // Totals row.
  const totalRowIndex = rowNum;
  const totalsCells: ExcelJS.CellValue[] = ['TOTAL (weighted)', '', ''];
  for (let v = 0; v < vendors.length; v++) {
    const weightedColLetter = colLetter(5 + v * 2);
    totalsCells.push(''); // raw column — leave blank
    totalsCells.push({ formula: `SUM(${weightedColLetter}3:${weightedColLetter}${totalRowIndex - 1})` });
  }
  const totalsRow = sheet.addRow(totalsCells);
  totalsRow.font = { bold: true };
  for (let v = 0; v < vendors.length; v++) {
    const weightedColIndex = 5 + v * 2;
    totalsRow.getCell(weightedColIndex).numFmt = '0';
    totalsRow.getCell(weightedColIndex).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
    };
  }

  return sheet;
}

function buildScoreGuidanceSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<ScoreGuidanceRow>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Score Guidance', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Score', key: 'score', width: 10 },
    { header: 'Label', key: 'label', width: 22 },
    { header: 'Rubric', key: 'rubric', width: 80 },
  ];
  applyHeaderRow(sheet.getRow(1));

  for (const row of rows) {
    const r = sheet.addRow({
      score: row.score,
      label: safeCell(row.label),
      rubric: safeCell(row.rubric),
    });
    applyLockedRow(r);
    r.getCell('rubric').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
  }
  return sheet;
}

function buildDecisionNotesSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Decision Notes', {
    properties: { defaultColWidth: 30 },
  });
  sheet.columns = [
    { header: 'Topic', key: 'topic', width: 40 },
    { header: 'Narrative', key: 'narrative', width: 80 },
  ];
  applyHeaderRow(sheet.getRow(1));

  const seedTopics = [
    'Top-ranked vendor — primary rationale (cite criterion IDs)',
    'Second-place vendor — gap vs. top (cite criterion IDs)',
    'Tiebreaker rules applied (if any totals were within 2%)',
    'Dissents — name + criterion + summary of disagreement',
    'Cross-check against d20 trap log — any priced trap that materially shifts ranking?',
    'Cross-check against d18 disqualification log — vendors removed from scoring + reason',
    'Recommendation to sponsor (advance to BAFO with which vendors and why)',
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

/** Convert 1-based column index to Excel letter (A, B, ..., Z, AA, ...). */
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
