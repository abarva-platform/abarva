/**
 * The P4 financial model workbook: every figure a formula over the engine's
 * own inputs, cached at the engine's base values, with a Check sheet that
 * agrees with the engine. SYNTHETIC case (the value engine's golden case).
 */
import ExcelJS from "exceljs";
import { evaluateValueCase } from "@/lib/programs/value-engine";
import {
  buildFinancialModelWorkbook,
  FINANCIAL_MODEL_SHEETS,
  FinancialModelMismatch,
  financialModelBuffer,
  type FinancialModelInputs,
} from "@/lib/programs/value-engine/financial-model-workbook";
import type { ValueCase } from "@/lib/programs/value-engine/types";
import { goldenCase } from "@/testing/fixtures/synthetic-value-case";

function inputs(model: ValueCase = goldenCase()): FinancialModelInputs {
  return { moveName: "Synthetic hospital flow", model, result: evaluateValueCase(model), costBasis: "estimate model, synthetic" };
}
/** The golden case with a phase-down on its first lever. */
function phasedCase(): ValueCase {
  const model = goldenCase();
  model.levers[0]!.timing = { ...model.levers[0]!.timing, phaseDown: [{ fromMonth: 13, factor: 0.5 }, { fromMonth: 25, factor: 0.25 }] };
  return model;
}
const cached = (cell: ExcelJS.Cell): unknown =>
  typeof cell.value === "object" && cell.value !== null && "formula" in cell.value ? cell.result : cell.value;
const formulaOf = (cell: ExcelJS.Cell): string | null =>
  typeof cell.value === "object" && cell.value !== null && "formula" in cell.value ? (cell.value as ExcelJS.CellFormulaValue).formula : null;

describe("buildFinancialModelWorkbook", () => {
  it("carries the engine's base figures and agrees with the engine on every check", () => {
    const input = inputs();
    const economics = input.result.economics!;
    const { workbook, layout } = buildFinancialModelWorkbook(input);
    const econ = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.economics)!;
    expect(cached(econ.getCell(layout.economics.annualCash))).toBe(economics.annualCashCents.base);
    expect(cached(econ.getCell(layout.economics.npv))).toBe(economics.npvCents.base);
    expect(cached(econ.getCell(layout.economics.payback))).toBe(economics.paybackMonth.base);
    const check = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.check)!;
    expect(cached(check.getCell(layout.check.overall))).toBe("YES");
    const rows = [...Array(layout.check.rows).keys()].map((i) => check.getCell(5 + i, 7));
    expect(rows.map(cached)).toEqual(rows.map(() => "YES"));
    expect(rows.length).toBe(3 + 4 + input.result.levers.filter((lever) => lever.annualCents).length);
  });

  it("writes each lever's annual value as the rounded product of its selected inputs", () => {
    const input = inputs();
    const { workbook } = buildFinancialModelWorkbook(input);
    const levers = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.levers)!;
    const inputsSheet = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.inputs)!;
    expect(formulaOf(levers.getCell("F5"))).toMatch(/^ROUND\(PRODUCT\(Inputs!\$H\$\d+:\$H\$\d+\),0\)$/);
    expect(cached(levers.getCell("F5"))).toBe(input.result.levers[0]!.annualCents!.base);
    const [, first, last] = /\$H\$(\d+):\$H\$(\d+)/.exec(formulaOf(levers.getCell("F5"))!)!;
    const selected = [...Array(Number(last) - Number(first) + 1).keys()].map((i) => inputsSheet.getCell(Number(first) + i, 8));
    expect(selected.map(formulaOf)).toEqual(selected.map((cell) => `CHOOSE(Inputs!$B$5,E${cell.row},F${cell.row},G${cell.row})`));
    // Program value replaces only the attribution term with 1.
    const program = selected.map((cell) => inputsSheet.getCell(cell.row, 9));
    const roles = selected.map((cell) => inputsSheet.getCell(cell.row, 3).value);
    expect(program.map(formulaOf)).toEqual(roles.map((role, i) => role === "attribution" ? "1" : `H${selected[i]!.row}`));
  });

  it("schedules each month the way the engine does: ramp, phase-down, then the payment lag", () => {
    const { workbook } = buildFinancialModelWorkbook(inputs(phasedCase()));
    const schedule = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.schedule)!;
    // Lever L1's fraction row is row 5; month 1 is column C.
    const fraction = formulaOf(schedule.getCell("C5"))!;
    expect(fraction).toContain("IF(C$4>=Inputs!$G$");
    // Latest phase-down step is outermost, so it wins once its month has come.
    expect(fraction.indexOf("Inputs!$G$")).toBeLessThan(fraction.indexOf("Inputs!$E$"));
    expect(cached(schedule.getCell(5, 2 + 12))).toBe(1);
    expect(cached(schedule.getCell(5, 2 + 13))).toBe(0.5);
    expect(cached(schedule.getCell(5, 2 + 25))).toBe(0.25);
    // Cash in month m is the credited value earned `lag` months earlier.
    expect(formulaOf(schedule.getCell("C7"))).toMatch(/^IF\(C\$4-Inputs!\$D\$(\d+)>=1,INDEX\(\$C6:\$AL6,C\$4-Inputs!\$D\$\1\),0\)$/);
  });

  it("pins the formulas the cached values cannot show: scenario, cost, earned and discounting", () => {
    const { workbook } = buildFinancialModelWorkbook(inputs());
    const inputsSheet = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.inputs)!;
    expect(formulaOf(inputsSheet.getCell("B5"))).toBe('IF(B4="Low",1,IF(B4="High",3,2))');
    expect(formulaOf(inputsSheet.getCell("E8"))).toBe("CHOOSE(Inputs!$B$5,B8,C8,D8)");
    const schedule = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.schedule)!;
    expect(formulaOf(schedule.getCell("D6"))).toBe("ROUND(Levers!$F$5*D5/12,0)");
    expect(formulaOf(schedule.getCell("D8"))).toBe("ROUND(Levers!$G$5*D5/12,0)");
    const discounted = [...Array(80).keys()].map((i) => schedule.getCell(5 + i, 2)).find((cell) => cell.value === "Discounted cash")!;
    const at = Number(discounted.row);
    // Discounted cash is the total cash row (five rows above) ÷ (1 + rate)^(month / 12).
    expect(formulaOf(schedule.getCell(at, 4))).toBe(`D${at - 5}/(1+Inputs!$E$9)^(D$4/12)`);
  });

  it("agrees with the engine for a phased case too", () => {
    const input = inputs(phasedCase());
    const { workbook, layout } = buildFinancialModelWorkbook(input);
    expect(cached(workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.check)!.getCell(layout.check.overall))).toBe("YES");
    expect(layout.base.npvCents).toBe(input.result.economics!.npvCents.base);
  });

  it("writes NPV and payback as the engine defines them", () => {
    const { workbook, layout } = buildFinancialModelWorkbook(inputs());
    const econ = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.economics)!;
    expect(formulaOf(econ.getCell(layout.economics.npv))).toBe("ROUND(-B6+B7+B8+B9,0)");
    // Year one sums the discounted cash of months 1–12 (columns C–N) on one row.
    expect(formulaOf(econ.getCell("B7"))).toMatch(/^SUM\('Monthly Schedule'!\$C\$(\d+):\$N\$\1\)$/);
    expect(formulaOf(econ.getCell(layout.economics.payback))).toMatch(/^IF\(B6<=0,0,IF\(COUNT\(.+\)=0,"Not within horizon",MIN\(.+\)\)\)$/);
  });

  describe("the AI-assisted scenario", () => {
    /** The same value at a lower build cost, as the value case evaluates a scenario. */
    const scenarioEconomics = (baseCents = 180_000_000) => {
      const model = goldenCase();
      model.cost = { kind: "estimate", baseCents };
      return evaluateValueCase(model).economics!;
    };

    it("models its NPV and payback on the same value at its own investment, and checks both", () => {
      const input = { ...inputs(), aiScenario: { label: "Synthetic coding agents", economics: scenarioEconomics() } };
      const { workbook, layout } = buildFinancialModelWorkbook(input);
      const econ = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.economics)!;
      const ai = layout.aiScenario!;
      expect(cached(econ.getCell(ai.cost))).toBe(180_000_000);
      expect(cached(econ.getCell(ai.npv))).toBe(input.aiScenario.economics.npvCents.base);
      expect(cached(econ.getCell(ai.payback))).toBe(input.aiScenario.economics.paybackMonth.base ?? "Not within horizon");
      // Lower investment, same value: the scenario's NPV is higher by exactly the saving.
      expect((cached(econ.getCell(ai.npv)) as number) - (cached(econ.getCell(layout.economics.npv)) as number)).toBe(240_000_000 - 180_000_000);
      expect(formulaOf(econ.getCell(ai.npv))).toBe("ROUND(-B" + ai.cost.slice(1) + "+B7+B8+B9,0)");
      // The scenario's payback reads its own investment, not the funded one.
      const schedule = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.schedule)!;
      const reachedAi = [...Array(80).keys()].map((i) => schedule.getCell(5 + i, 2)).find((cell) => cell.value === "Month cash covers the AI-assisted scenario's investment")!;
      expect(formulaOf(schedule.getCell(Number(reachedAi.row), 3))).toMatch(/>=Inputs!\$E\$11,C\$4,""\)$/);
      const check = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.check)!;
      expect(cached(check.getCell(layout.check.overall))).toBe("YES");
      expect(layout.check.rows).toBe(3 + 4 + 2 + input.result.levers.filter((lever) => lever.annualCents).length);
      const inputsSheet = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.inputs)!;
      expect(inputsSheet.getCell("F11").value).toBe("Synthetic coding agents: a comparison, not the funding basis");
      expect(formulaOf(inputsSheet.getCell("E11"))).toBe("CHOOSE(Inputs!$B$5,B11,C11,D11)");
    });

    it("is left out when its value schedule is not the funded case's", () => {
      const moved = goldenCase();
      moved.levers[0]!.timing = { ...moved.levers[0]!.timing, startMonth: moved.levers[0]!.timing.startMonth + 2 };
      const { layout } = buildFinancialModelWorkbook({ ...inputs(), aiScenario: { label: "Other", economics: evaluateValueCase(moved).economics! } });
      expect(layout.aiScenario).toBeNull();
    });

    it("is absent when no scenario was approved", () => {
      expect(buildFinancialModelWorkbook(inputs()).layout.aiScenario).toBeNull();
    });
  });

  it("refuses a saved model whose timing no longer reproduces the evaluated case", () => {
    const input = inputs();
    input.model.levers[0]!.timing = { ...input.model.levers[0]!.timing, startMonth: input.model.levers[0]!.timing.startMonth + 1 };
    expect(() => buildFinancialModelWorkbook(input)).toThrow(FinancialModelMismatch);
    // Checked lever by lever, so drifts that cancel in the total are still caught, and named.
    expect(() => buildFinancialModelWorkbook(input)).toThrow(/L1's saved timing does not reproduce its cash curve/);
  });

  it("refuses a blocked case and a model that names other levers", () => {
    const blocked = goldenCase();
    blocked.levers[0]!.attribution = { kind: "register", registerId: "V99" };
    expect(() => buildFinancialModelWorkbook(inputs(blocked))).toThrow(/blocked/);
    const input = inputs();
    input.model = { ...input.model, levers: input.model.levers.slice(1) };
    expect(() => buildFinancialModelWorkbook(input)).toThrow(/different levers/);
  });

  it("writes recorded labels as text and reads back from the file", async () => {
    const model = goldenCase();
    model.levers[0]!.name = "=SUM(1,2)";
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load((await financialModelBuffer(inputs(model))) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const levers = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.levers)!;
    expect(levers.getCell("B5").value).toBe("=SUM(1,2)");
    expect(formulaOf(levers.getCell("B5"))).toBeNull();
    expect(workbook.worksheets.map((ws) => ws.name)).toEqual(Object.values(FINANCIAL_MODEL_SHEETS));
  });
});

if (process.env.FINANCIAL_MODEL_OUTPUT) {
  it("writes samples for recalculation", async () => {
    const fs = await import("node:fs");
    for (const [name, model] of [["golden", goldenCase()], ["phased", phasedCase()], ["scenario", goldenCase()]] as const) {
      const scenarioModel = goldenCase();
      scenarioModel.cost = { kind: "estimate", baseCents: 180_000_000 };
      const input = name === "scenario"
        ? { ...inputs(model), aiScenario: { label: "Synthetic coding agents", economics: evaluateValueCase(scenarioModel).economics! } }
        : inputs(model);
      const { workbook } = buildFinancialModelWorkbook(input);
      for (const ws of workbook.worksheets) ws.eachRow((row) => row.eachCell((cell) => {
        if (typeof cell.value === "object" && cell.value !== null && "formula" in cell.value)
          cell.value = { formula: (cell.value as ExcelJS.CellFormulaValue).formula } as ExcelJS.CellFormulaValue;
      }));
      for (const scenario of ["Low", "Base", "High"]) {
        workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.inputs)!.getCell("B4").value = scenario;
        fs.writeFileSync(`${process.env.FINANCIAL_MODEL_OUTPUT}/${name}-${scenario}.xlsx`, Buffer.from(await workbook.xlsx.writeBuffer()));
      }
      fs.writeFileSync(`${process.env.FINANCIAL_MODEL_OUTPUT}/${name}-engine.json`, JSON.stringify(input.result.economics));
    }
  });
}
