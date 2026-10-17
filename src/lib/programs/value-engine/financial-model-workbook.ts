/**
 * The P4 financial model: the Move's value case as a live-formula workbook.
 *
 * Every figure is a formula over the engine's own inputs, written the way the
 * engine computes it (`case-model.ts`, `timing.ts`, `economics.ts`):
 *
 *   lever annual (cents)   ROUND(PRODUCT(its input terms), 0)
 *   program annual         the same product with the attribution term as 1
 *   earned in month m      ROUND(annual × ramp(m) × phase(m) / 12, 0)
 *   cash in month m        earned in month m − payment lag (0 before month 1)
 *   NPV                    ROUND(−cost + Σ years of Σ cash_m ÷ (1+r)^(m/12), 0)
 *   payback month          the first month whose cumulative cash ≥ cost
 *   three-year bases       year sums of credited and program value, earned and paid
 *
 * A scenario switch (Low / Base / High) selects every input at once. A Check
 * sheet compares the workbook with the engine's figures for the chosen
 * scenario. Before writing, the builder recomputes the base curves itself and
 * refuses when they differ from the engine's, so a workbook is never built on
 * a model that changed between reads.
 *
 * Every formula cell carries a cached result for the Base scenario. Pure apart
 * from ExcelJS: no I/O, no clock. Recorded text is written as text.
 */
import ExcelJS from "exceljs";
import { npvWithTerms, paybackMonth as enginePayback } from "./economics";
import { productOfTerms, roundWhole } from "./formula-terms";
import { monthlyCashCents, monthlyEarnedCents } from "./timing";
import type {
  Cents,
  LeverResult,
  Scenario,
  ValueCase,
  ValueCaseResult,
  ValueFormulaTerm,
} from "./types";

export const FINANCIAL_MODEL_SHEETS = {
  readme: "README",
  inputs: "Inputs",
  levers: "Levers",
  schedule: "Monthly Schedule",
  economics: "Economics",
  sensitivity: "Sensitivity",
  check: "Check",
} as const;

export const FINANCIAL_MODEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** The model or the result could not be written as one consistent workbook. */
export class FinancialModelMismatch extends Error {
  constructor(detail: string) {
    super(`financial_model_mismatch: ${detail}`);
    this.name = "FinancialModelMismatch";
  }
}

export interface FinancialModelInputs {
  moveName: string;
  /** The saved structured value model: lever timing and the horizon. */
  model: ValueCase;
  /** The engine's evaluation of that model, figures visible. */
  result: ValueCaseResult;
  /** How the one-time cost was set, in words (e.g. "approved estimate ROM-1"). */
  costBasis: string;
}

export interface FinancialModelLayout {
  scenarioCell: string;
  /** Economics addresses, for a reader or a test. */
  economics: { annualCash: string; npv: string; payback: string; cost: string };
  check: { overall: string; rows: number };
  /** Base-scenario values the workbook computes, equal to the engine's. */
  base: { annualCashCents: Cents; npvCents: Cents; paybackMonth: number | null };
}

const TEAL = "FF087F75";
const INK = "FF1C2428";
const MUTED = "FF536267";
const RULE = "FFCCD6D4";
const BODY: Partial<ExcelJS.Font> = { name: "Arial", size: 10, color: { argb: INK } };
const BOLD: Partial<ExcelJS.Font> = { ...BODY, bold: true };
const INPUT: Partial<ExcelJS.Font> = { name: "Arial", size: 10, color: { argb: "FF0000FF" } };
const NOTE: Partial<ExcelJS.Font> = { name: "Arial", size: 9, italic: true, color: { argb: MUTED } };
const HEAD: Partial<ExcelJS.Font> = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
const BOX: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: RULE } }, bottom: { style: "thin", color: { argb: RULE } },
  left: { style: "thin", color: { argb: RULE } }, right: { style: "thin", color: { argb: RULE } },
};
const CENTS = '#,##0;(#,##0);"–"';
const SCENARIOS: Scenario[] = ["low", "base", "high"];
const NOT_WITHIN = "Not within horizon";

type Cached = string | number;

function title(ws: ExcelJS.Worksheet, text: string, sub: string) {
  ws.getCell("A1").value = text;
  ws.getCell("A1").font = { name: "Georgia", size: 16, color: { argb: INK } };
  ws.getCell("A2").value = sub;
  ws.getCell("A2").font = NOTE;
  ws.views = [{ showGridLines: false }];
}

function head(ws: ExcelJS.Worksheet, row: number, labels: string[], from = 1) {
  labels.forEach((label, i) => {
    const cell = ws.getCell(row, from + i);
    cell.value = label;
    cell.font = HEAD;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
    cell.border = BOX;
    cell.alignment = { wrapText: true, vertical: "middle" };
  });
}

function put(ws: ExcelJS.Worksheet, row: number, col: number, value: string | number | null, font = BODY) {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.font = font;
  cell.border = BOX;
  return cell;
}

function formula(ws: ExcelJS.Worksheet, row: number, col: number, f: string, result: Cached, font = BODY) {
  const cell = ws.getCell(row, col);
  cell.value = { formula: f, result } as ExcelJS.CellFormulaValue;
  cell.font = font;
  cell.border = BOX;
  return cell;
}

const col = (ws: ExcelJS.Worksheet, n: number) => ws.getColumn(n).letter;
const inputsOf = (terms: readonly ValueFormulaTerm[]) => terms.filter((term) => term.cellRole !== "result");

/** Program value keeps every term but the declared attribution share, exactly as the engine. */
function programAnnual(terms: readonly ValueFormulaTerm[]): Cents {
  return roundWhole(productOfTerms(inputsOf(terms).map((term) =>
    term.cellRole === "attribution" ? { ...term, value: 1 } : term)));
}

const sumYear = (monthly: readonly number[], year: number) =>
  monthly.slice(year * 12, (year + 1) * 12).reduce((sum, value) => sum + value, 0);

export function buildFinancialModelWorkbook(input: FinancialModelInputs): {
  workbook: ExcelJS.Workbook;
  layout: FinancialModelLayout;
} {
  const { model, result } = input;
  const economics = result.economics;
  if (result.status !== "evaluated" || !economics)
    throw new FinancialModelMismatch("the value case is blocked, so it has no figures to model");
  const months = result.horizonYears * 12;
  const leverModel = new Map(model.levers.map((lever) => [lever.id, lever]));
  if (model.horizonYears !== result.horizonYears || result.levers.some((lever) => !leverModel.has(lever.leverId)))
    throw new FinancialModelMismatch("the saved model and the evaluated case describe different levers");

  // Recompute the base curves the way the engine does, and refuse on any difference.
  const cashLevers = result.levers.filter((lever) => lever.inCash && lever.annualCents);
  const earnedOf = (lever: LeverResult, annual: Cents) => monthlyEarnedCents(annual, leverModel.get(lever.leverId)!.timing, months);
  const cashOf = (lever: LeverResult, annual: Cents) => monthlyCashCents(annual, leverModel.get(lever.leverId)!.timing, months);
  for (const lever of result.levers) {
    if (!lever.annualCents) continue;
    if (roundWhole(productOfTerms(inputsOf(lever.terms.base))) !== lever.annualCents.base)
      throw new FinancialModelMismatch(`${lever.leverId}'s terms do not reproduce its annual figure`);
    if (lever.inCash && cashOf(lever, lever.annualCents.base).some((value, i) => value !== lever.monthlyCashCents.base[i]))
      throw new FinancialModelMismatch(`${lever.leverId}'s saved timing does not reproduce its cash curve`);
  }
  const sumCurves = (curves: Cents[][]) => Array.from({ length: months }, (_, m) => curves.reduce((sum, curve) => sum + curve[m]!, 0));
  const baseCash = sumCurves(cashLevers.map((lever) => cashOf(lever, lever.annualCents!.base)));
  const baseEarned = sumCurves(cashLevers.map((lever) => earnedOf(lever, lever.annualCents!.base)));
  const baseProgramEarned = sumCurves(cashLevers.map((lever) => earnedOf(lever, programAnnual(lever.terms.base))));
  const baseProgramPaid = sumCurves(cashLevers.map((lever) => cashOf(lever, programAnnual(lever.terms.base))));
  const baseCost = economics.costCents.base;
  const baseNpv = npvWithTerms(baseCash, baseCost, economics.discountRate, result.horizonYears).figure;
  const basePayback = enginePayback(baseCash, baseCost);
  if (baseNpv !== economics.npvCents.base || basePayback !== economics.paybackMonth.base
    || baseCash.some((value, i) => value !== economics.monthlyCashCents.base[i]))
    throw new FinancialModelMismatch("the recomputed cash, NPV or payback differs from the engine's");

  const wb = new ExcelJS.Workbook();
  wb.creator = "AbarVa Moves";
  wb.calcProperties.fullCalcOnLoad = true;

  // ── README ────────────────────────────────────────────────────────────
  const readme = wb.addWorksheet(FINANCIAL_MODEL_SHEETS.readme);
  title(readme, `${input.moveName}: financial model`, "The Move's value case as live formulas. Computed by the value engine; checked on the Check sheet.");
  [
    ["How to read", "Inputs holds every lever input at low, base and high; the blue scenario cell chooses which set every formula uses. Levers multiplies each lever's inputs into its annual value. Monthly Schedule spreads that over the horizon with each lever's start, ramp, phase-down and payment lag. Economics totals the cash and computes NPV, payback and the three-year bases."],
    ["Units", "Money is in whole cents, as the engine keeps it. Divide by 100 for dollars."],
    ["Credited and program value", "Credited value is after the declared attribution share; program value is before it. Both keep the probability. Earned is when value is created; paid is when the cash arrives."],
    ["Checks", "Check compares every key figure with the value engine for the chosen scenario. It reads YES when the workbook and the engine agree."],
    ["Cost", `The one-time investment is incurred at month 0: ${input.costBasis}. A low-value scenario uses the high cost, and a high-value scenario the low cost.`],
    ["Not live", "Sensitivity is the engine's one-at-a-time result, shown as values. Change an input here and re-run the case in the product to refresh it."],
  ].forEach(([label, value], i) => {
    readme.getCell(4 + i, 1).value = label;
    readme.getCell(4 + i, 1).font = BOLD;
    const cell = readme.getCell(4 + i, 2);
    cell.value = value;
    cell.font = BODY;
    cell.alignment = { wrapText: true, vertical: "top" };
    readme.getRow(4 + i).height = 48;
  });
  readme.getColumn(1).width = 26;
  readme.getColumn(2).width = 110;

  // ── Inputs ────────────────────────────────────────────────────────────
  const inputs = wb.addWorksheet(FINANCIAL_MODEL_SHEETS.inputs);
  title(inputs, "Inputs", "Blue cells are inputs. Each lever's terms are listed in the order the engine multiplies them.");
  put(inputs, 4, 1, "Scenario", BOLD);
  const scenario = put(inputs, 4, 2, "Base", INPUT);
  scenario.dataValidation = { type: "list", allowBlank: false, formulae: ['"Low,Base,High"'] };
  put(inputs, 5, 1, "Scenario index", NOTE);
  formula(inputs, 5, 2, 'IF(B4="Low",1,IF(B4="High",3,2))', 2, NOTE);
  const IDX = "Inputs!$B$5";
  head(inputs, 7, ["Case input (as used in each scenario)", "Low", "Base", "High", "Selected", "Basis"]);
  put(inputs, 8, 1, "One-time investment (cents)");
  SCENARIOS.forEach((s, i) => { put(inputs, 8, 2 + i, economics.costCents[s], INPUT).numFmt = CENTS; });
  formula(inputs, 8, 5, "CHOOSE(" + IDX + ",B8,C8,D8)", baseCost, BOLD).numFmt = CENTS;
  put(inputs, 8, 6, input.costBasis, NOTE);
  put(inputs, 9, 1, "Discount rate (annual)");
  put(inputs, 9, 3, economics.discountRate, INPUT).numFmt = "0.00%";
  formula(inputs, 9, 5, "C9", economics.discountRate, BOLD).numFmt = "0.00%";
  put(inputs, 9, 6, "The engine discounts every scenario at the base rate", NOTE);
  put(inputs, 10, 1, "Horizon (years)");
  put(inputs, 10, 3, result.horizonYears);
  formula(inputs, 10, 5, "C10", result.horizonYears, BOLD);
  const COST = "Inputs!$E$8";
  const RATE = "Inputs!$E$9";

  const termTop = 13;
  head(inputs, termTop, ["Lever", "Term", "Role", "Source", "Low", "Base", "High", "Selected", "Program (no attribution)"]);
  let r = termTop + 1;
  const termRows = new Map<string, { first: number; last: number }>();
  for (const lever of result.levers) {
    const base = inputsOf(lever.terms.base);
    if (!lever.annualCents || !base.length) continue;
    const sides = Object.fromEntries(SCENARIOS.map((s) => [s, inputsOf(lever.terms[s])])) as Record<Scenario, ValueFormulaTerm[]>;
    if (SCENARIOS.some((s) => sides[s].length !== base.length || sides[s].some((term, i) => term.cellRole !== base[i]!.cellRole)))
      throw new FinancialModelMismatch(`${lever.leverId}'s scenarios list different terms`);
    const first = r;
    base.forEach((term, i) => {
      put(inputs, r, 1, lever.leverId, BOLD);
      put(inputs, r, 2, term.label);
      put(inputs, r, 3, term.cellRole);
      put(inputs, r, 4, term.source, NOTE);
      SCENARIOS.forEach((s, j) => { put(inputs, r, 5 + j, sides[s][i]!.value, INPUT); });
      formula(inputs, r, 8, `CHOOSE(${IDX},E${r},F${r},G${r})`, term.value, BOLD);
      formula(inputs, r, 9, term.cellRole === "attribution" ? "1" : `H${r}`, term.cellRole === "attribution" ? 1 : term.value);
      r += 1;
    });
    termRows.set(lever.leverId, { first, last: r - 1 });
  }
  const timingTop = r + 2;
  const maxPhase = Math.max(0, ...model.levers.map((lever) => lever.timing.phaseDown?.length ?? 0));
  head(inputs, timingTop, ["Lever", "Start month", "Ramp months", "Payment lag (months)",
    ...Array.from({ length: maxPhase }, (_, i) => [`Phase-down ${i + 1} from month`, `Phase-down ${i + 1} factor`]).flat()]);
  const timingRow = new Map<string, number>();
  cashLevers.forEach((lever, i) => {
    const row = timingTop + 1 + i;
    const timing = leverModel.get(lever.leverId)!.timing;
    timingRow.set(lever.leverId, row);
    put(inputs, row, 1, lever.leverId, BOLD);
    put(inputs, row, 2, timing.startMonth, INPUT);
    put(inputs, row, 3, timing.rampMonths, INPUT);
    put(inputs, row, 4, timing.paymentLagMonths, INPUT);
    (timing.phaseDown ?? []).forEach((entry, j) => {
      put(inputs, row, 5 + j * 2, entry.fromMonth, INPUT);
      put(inputs, row, 6 + j * 2, entry.factor, INPUT);
    });
  });
  [12, 44, 16, 26, 14, 14, 14, 14, 16].forEach((width, i) => { inputs.getColumn(i + 1).width = width; });

  // ── Levers ────────────────────────────────────────────────────────────
  const levers = wb.addWorksheet(FINANCIAL_MODEL_SHEETS.levers);
  title(levers, "Levers", "Each lever's annual value is the rounded product of its inputs. An overlap or release gate is one of those inputs.");
  head(levers, 4, ["Lever", "Name", "Conversion", "Status", "In cash", "Annual (cents)", "Program annual (cents)", "Counted instead by"]);
  const annualCell = new Map<string, string>();
  const programCell = new Map<string, string>();
  result.levers.forEach((lever, i) => {
    const row = 5 + i;
    put(levers, row, 1, lever.leverId, BOLD);
    put(levers, row, 2, lever.name);
    put(levers, row, 3, lever.conversion);
    put(levers, row, 4, lever.status);
    put(levers, row, 5, lever.inCash ? "Yes" : "No");
    const rows = termRows.get(lever.leverId);
    if (rows && lever.annualCents) {
      formula(levers, row, 6, `ROUND(PRODUCT(Inputs!$H$${rows.first}:$H$${rows.last}),0)`, lever.annualCents.base, BOLD).numFmt = CENTS;
      formula(levers, row, 7, `ROUND(PRODUCT(Inputs!$I$${rows.first}:$I$${rows.last}),0)`, programAnnual(lever.terms.base)).numFmt = CENTS;
      annualCell.set(lever.leverId, `Levers!$F$${row}`);
      programCell.set(lever.leverId, `Levers!$G$${row}`);
    } else {
      put(levers, row, 6, "Blocked: no figure", NOTE);
    }
    put(levers, row, 8, lever.countedInsteadBy);
  });
  [10, 34, 16, 26, 9, 16, 20, 18].forEach((width, i) => { levers.getColumn(i + 1).width = width; });

  // ── Monthly Schedule ──────────────────────────────────────────────────
  const schedule = wb.addWorksheet(FINANCIAL_MODEL_SHEETS.schedule);
  title(schedule, "Monthly schedule", "Per lever: the earned fraction, then credited and program value earned and paid, in cents. Totals at the bottom.");
  const M0 = 3; // month 1 sits in column C
  const monthCol = (m: number) => col(schedule, M0 + m - 1);
  const lastCol = monthCol(months);
  put(schedule, 4, 1, "Lever", BOLD);
  put(schedule, 4, 2, "Line", BOLD);
  for (let m = 1; m <= months; m += 1) {
    const cell = put(schedule, 4, M0 + m - 1, m, HEAD);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
    put(schedule, 3, M0 + m - 1, (m - 1) % 12 === 0 ? `Year ${Math.ceil(m / 12)}` : null, NOTE);
    schedule.getColumn(M0 + m - 1).width = 11;
  }
  let row = 5;
  const curveRows: Record<"earned" | "cash" | "program" | "programPaid", number[]> = { earned: [], cash: [], program: [], programPaid: [] };
  for (const lever of cashLevers) {
    const timing = leverModel.get(lever.leverId)!.timing;
    const tr = timingRow.get(lever.leverId)!;
    const start = `Inputs!$B$${tr}`;
    const ramp = `Inputs!$C$${tr}`;
    const lag = `Inputs!$D$${tr}`;
    const phase = (m: string) => {
      const entries = timing.phaseDown ?? [];
      // Latest step outermost: the factor of the last step whose month has come.
      return entries.reduce((rest, _, j) =>
        `IF(${m}>=Inputs!$${col(inputs, 5 + j * 2)}$${tr},Inputs!$${col(inputs, 6 + j * 2)}$${tr},${rest})`, "1");
    };
    const fractionRow = row;
    const earnedRow = row + 1;
    const cashRow = row + 2;
    const programRow = row + 3;
    const programPaidRow = row + 4;
    const annual = lever.annualCents!.base;
    const program = programAnnual(lever.terms.base);
    const earned = earnedOf(lever, annual);
    const cash = cashOf(lever, annual);
    const programEarned = earnedOf(lever, program);
    const programPaid = cashOf(lever, program);
    [["Earned fraction", fractionRow], ["Credited earned", earnedRow], ["Credited paid (cash)", cashRow],
      ["Program earned", programRow], ["Program paid", programPaidRow]].forEach(([label, at]) => {
      put(schedule, at as number, 1, lever.leverId, BOLD);
      put(schedule, at as number, 2, label as string);
    });
    for (let m = 1; m <= months; m += 1) {
      const c = M0 + m - 1;
      const header = `${monthCol(m)}$4`;
      const k = m - timing.startMonth + 1;
      const rampPart = m < timing.startMonth ? 0 : timing.rampMonths > 0 ? Math.min(1, k / timing.rampMonths) : 1;
      let phasePart = 1;
      for (const entry of timing.phaseDown ?? []) if (entry.fromMonth <= m) phasePart = entry.factor;
      formula(schedule, fractionRow, c,
        `IF(${header}<${start},0,IF(${ramp}>0,MIN(1,(${header}-${start}+1)/${ramp}),1))*${phase(header)}`,
        m < timing.startMonth ? 0 : rampPart * phasePart).numFmt = "0.0000";
      const frac = `${monthCol(m)}${fractionRow}`;
      formula(schedule, earnedRow, c, `ROUND(${annualCell.get(lever.leverId)}*${frac}/12,0)`, earned[m - 1]!).numFmt = CENTS;
      formula(schedule, cashRow, c, `IF(${header}-${lag}>=1,INDEX($${monthCol(1)}${earnedRow}:$${lastCol}${earnedRow},${header}-${lag}),0)`, cash[m - 1]!).numFmt = CENTS;
      formula(schedule, programRow, c, `ROUND(${programCell.get(lever.leverId)}*${frac}/12,0)`, programEarned[m - 1]!).numFmt = CENTS;
      formula(schedule, programPaidRow, c, `IF(${header}-${lag}>=1,INDEX($${monthCol(1)}${programRow}:$${lastCol}${programRow},${header}-${lag}),0)`, programPaid[m - 1]!).numFmt = CENTS;
    }
    curveRows.earned.push(earnedRow);
    curveRows.cash.push(cashRow);
    curveRows.program.push(programRow);
    curveRows.programPaid.push(programPaidRow);
    row += 6;
  }
  const totals = row + 1;
  const totalRow = { cash: totals, earned: totals + 1, program: totals + 2, programPaid: totals + 3, cumulative: totals + 4, discounted: totals + 5, reached: totals + 6 };
  const labels: [keyof typeof totalRow, string][] = [["cash", "Total cash (credited paid)"], ["earned", "Total credited earned"],
    ["program", "Total program earned"], ["programPaid", "Total program paid"], ["cumulative", "Cumulative cash"],
    ["discounted", "Discounted cash"], ["reached", "Month cash covers the investment"]];
  labels.forEach(([key, label]) => { put(schedule, totalRow[key], 1, "Total", BOLD); put(schedule, totalRow[key], 2, label, BOLD); });
  const curves = { cash: baseCash, earned: baseEarned, program: baseProgramEarned, programPaid: baseProgramPaid };
  let cumulative = 0;
  for (let m = 1; m <= months; m += 1) {
    const c = M0 + m - 1;
    const letter = monthCol(m);
    for (const key of ["cash", "earned", "program", "programPaid"] as const) {
      const refs = curveRows[key].map((at) => `${letter}${at}`);
      formula(schedule, totalRow[key], c, refs.length ? refs.join("+") : "0", curves[key][m - 1]!, BOLD).numFmt = CENTS;
    }
    cumulative += baseCash[m - 1]!;
    formula(schedule, totalRow.cumulative, c, m === 1 ? `${letter}${totalRow.cash}` : `${monthCol(m - 1)}${totalRow.cumulative}+${letter}${totalRow.cash}`, cumulative).numFmt = CENTS;
    formula(schedule, totalRow.discounted, c, `${letter}${totalRow.cash}/(1+${RATE})^(${letter}$4/12)`, baseCash[m - 1]! / (1 + economics.discountRate) ** (m / 12)).numFmt = "#,##0.00";
    formula(schedule, totalRow.reached, c, `IF(${letter}${totalRow.cumulative}>=${COST},${letter}$4,"")`, cumulative >= baseCost ? m : "");
  }
  schedule.getColumn(1).width = 8;
  schedule.getColumn(2).width = 30;
  schedule.views = [{ state: "frozen", xSplit: 2, ySplit: 4, showGridLines: false }];
  const range = (key: keyof typeof totalRow, fromMonth = 1, toMonth = months) =>
    `'${FINANCIAL_MODEL_SHEETS.schedule}'!$${monthCol(fromMonth)}$${totalRow[key]}:$${monthCol(toMonth)}$${totalRow[key]}`;

  // ── Economics ─────────────────────────────────────────────────────────
  const econ = wb.addWorksheet(FINANCIAL_MODEL_SHEETS.economics);
  title(econ, "Economics", "Totals for the chosen scenario, in cents.");
  head(econ, 4, ["Measure", "Value", "How"]);
  const inCashAnnual = cashLevers.map((lever) => annualCell.get(lever.leverId)!);
  put(econ, 5, 1, "Annual cash at full run rate", BOLD);
  formula(econ, 5, 2, inCashAnnual.length ? `ROUND(${inCashAnnual.join("+")},0)` : "0", economics.annualCashCents.base, BOLD).numFmt = CENTS;
  put(econ, 5, 3, "Σ in-cash levers' annual value", NOTE);
  put(econ, 6, 1, "One-time investment", BOLD);
  formula(econ, 6, 2, COST, baseCost, BOLD).numFmt = CENTS;
  put(econ, 6, 3, input.costBasis, NOTE);
  const yearRows: string[] = [];
  const yearSums = Array.from({ length: result.horizonYears }, (_, y) =>
    baseCash.slice(y * 12, (y + 1) * 12).reduce((sum, value, i) => sum + value / (1 + economics.discountRate) ** ((y * 12 + i + 1) / 12), 0));
  yearSums.forEach((sum, y) => {
    const at = 7 + y;
    put(econ, at, 1, `Year ${y + 1} cash, discounted`);
    formula(econ, at, 2, `SUM(${range("discounted", y * 12 + 1, (y + 1) * 12)})`, sum).numFmt = "#,##0.00";
    yearRows.push(`B${at}`);
  });
  const npvRow = 7 + result.horizonYears;
  put(econ, npvRow, 1, "Net present value", BOLD);
  formula(econ, npvRow, 2, `ROUND(-B6+${yearRows.join("+")},0)`, baseNpv, BOLD).numFmt = CENTS;
  put(econ, npvRow, 3, "Investment at month 0; month m discounted by (1 + rate)^(m / 12)", NOTE);
  const paybackRow = npvRow + 1;
  put(econ, paybackRow, 1, "Payback month", BOLD);
  formula(econ, paybackRow, 2, `IF(B6<=0,0,IF(COUNT(${range("reached")})=0,"${NOT_WITHIN}",MIN(${range("reached")})))`,
    basePayback === null ? NOT_WITHIN : basePayback, BOLD);
  put(econ, paybackRow, 3, "First month whose cumulative cash covers the investment", NOTE);
  const basesTop = paybackRow + 3;
  const bases: [keyof typeof curves, string][] = [["earned", "Credited · earned"], ["cash", "Credited · paid"], ["program", "Program · earned"], ["programPaid", "Program · paid"]];
  const threeYear = result.horizonYears >= 3;
  if (threeYear) {
    head(econ, basesTop, ["Three-year basis", "Year one", "Year two", "Year three", "Total", "ROI"]);
    bases.forEach(([key, label], i) => {
      const at = basesTop + 1 + i;
      put(econ, at, 1, label, BOLD);
      [0, 1, 2].forEach((y) => {
        formula(econ, at, 2 + y, `SUM(${range(key, y * 12 + 1, (y + 1) * 12)})`, sumYear(curves[key], y)).numFmt = CENTS;
      });
      const total = [0, 1, 2].reduce((sum, y) => sum + sumYear(curves[key], y), 0);
      formula(econ, at, 5, `B${at}+C${at}+D${at}`, total, BOLD).numFmt = CENTS;
      formula(econ, at, 6, `IF($B$6=0,"n/a",(E${at}-$B$6)/$B$6)`, baseCost === 0 ? "n/a" : (total - baseCost) / baseCost).numFmt = "0%";
    });
  }
  econ.getColumn(1).width = 34;
  econ.getColumn(2).width = 18;
  econ.getColumn(3).width = 60;
  for (let c = 4; c <= 6; c += 1) econ.getColumn(c).width = 16;

  // ── Sensitivity (engine values) ───────────────────────────────────────
  const sens = wb.addWorksheet(FINANCIAL_MODEL_SHEETS.sensitivity);
  title(sens, "Sensitivity", "The engine's one-at-a-time result for the base case, as values: each input moved to its low or high, all else at base.");
  head(sens, 4, ["Input", "Label", "Side", "Input value", "Annual cash (cents)", "NPV (cents)", "Payback month"]);
  result.sensitivity.forEach((entry, i) => {
    const at = 5 + i;
    [entry.key, entry.label, entry.side, entry.inputValue, entry.annualCashCents, entry.npvCents, entry.paybackMonth ?? NOT_WITHIN]
      .forEach((value, j) => { const cell = put(sens, at, 1 + j, value); if (j >= 4 && j <= 5) cell.numFmt = CENTS; });
  });
  [16, 44, 8, 14, 18, 18, 16].forEach((width, i) => { sens.getColumn(i + 1).width = width; });

  // ── Check ─────────────────────────────────────────────────────────────
  const check = wb.addWorksheet(FINANCIAL_MODEL_SHEETS.check);
  title(check, "Check", "The value engine's figures for each scenario beside the workbook's for the chosen one. YES means they agree.");
  head(check, 4, ["Figure", "Engine low", "Engine base", "Engine high", "Engine (chosen)", "Workbook", "Agrees"]);
  const payback = (s: Scenario) => economics.paybackMonth[s] ?? NOT_WITHIN;
  const checks: { label: string; engine: Record<Scenario, Cached>; workbook: string; value: Cached }[] = [
    { label: "Annual cash", engine: economics.annualCashCents, workbook: `'${FINANCIAL_MODEL_SHEETS.economics}'!B5`, value: economics.annualCashCents.base },
    { label: "Net present value", engine: economics.npvCents, workbook: `'${FINANCIAL_MODEL_SHEETS.economics}'!B${npvRow}`, value: baseNpv },
    { label: "Payback month", engine: { low: payback("low"), base: payback("base"), high: payback("high") }, workbook: `'${FINANCIAL_MODEL_SHEETS.economics}'!B${paybackRow}`, value: payback("base") },
    ...(threeYear && economics.threeYearBases ? (["creditedEarned", "creditedPaid", "programEarned", "programPaid"] as const).map((key, i) => ({
      label: `Three-year ${bases[i]![1].toLowerCase()} total`,
      engine: { low: economics.threeYearBases!.low[key].totalCents, base: economics.threeYearBases!.base[key].totalCents, high: economics.threeYearBases!.high[key].totalCents },
      workbook: `'${FINANCIAL_MODEL_SHEETS.economics}'!E${basesTop + 1 + i}`,
      value: economics.threeYearBases!.base[key].totalCents,
    })) : []),
    ...result.levers.filter((lever) => lever.annualCents && annualCell.has(lever.leverId)).map((lever) => ({
      label: `${lever.leverId} annual`, engine: lever.annualCents!, workbook: annualCell.get(lever.leverId)!, value: lever.annualCents!.base,
    })),
  ];
  checks.forEach((entry, i) => {
    const at = 5 + i;
    put(check, at, 1, entry.label, BOLD);
    SCENARIOS.forEach((s, j) => { put(check, at, 2 + j, entry.engine[s]); });
    formula(check, at, 5, `CHOOSE(${IDX},B${at},C${at},D${at})`, entry.engine.base);
    formula(check, at, 6, entry.workbook, entry.value);
    formula(check, at, 7, `IF(E${at}=F${at},"YES","NO")`, entry.engine.base === entry.value ? "YES" : "NO", BOLD);
  });
  const overallRow = 6 + checks.length;
  put(check, overallRow, 1, "Workbook agrees with the engine", BOLD);
  formula(check, overallRow, 7, `IF(COUNTIF(G5:G${4 + checks.length},"NO")=0,"YES","NO")`, "YES", BOLD);
  [36, 16, 16, 16, 16, 16, 10].forEach((width, i) => { check.getColumn(i + 1).width = width; });

  for (const ws of wb.worksheets) {
    ws.pageSetup.orientation = "landscape";
    ws.pageSetup.fitToPage = true;
    ws.pageSetup.fitToWidth = 1;
    ws.pageSetup.fitToHeight = 0;
  }
  return {
    workbook: wb,
    layout: {
      scenarioCell: "Inputs!B4",
      economics: { annualCash: "B5", npv: `B${npvRow}`, payback: `B${paybackRow}`, cost: "B6" },
      check: { overall: `G${overallRow}`, rows: checks.length },
      base: { annualCashCents: economics.annualCashCents.base, npvCents: baseNpv, paybackMonth: basePayback },
    },
  };
}

export async function financialModelBuffer(input: FinancialModelInputs): Promise<Buffer> {
  const { workbook } = buildFinancialModelWorkbook(input);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
