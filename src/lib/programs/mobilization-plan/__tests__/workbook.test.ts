/**
 * The P5 mobilization plan workbook: build blocks from the approved estimate,
 * milestone windows from P4, cost by week that sums to the estimate, and the
 * Move's own owners, readiness items and open assumptions, never invented.
 */
import ExcelJS from "exceljs";
import type { P4RoadmapMilestone } from "@/lib/programs/p4-roadmap-plan";
import { MAX_PLAN_WEEK, monthWeeks, plannedWindowWeeks } from "../planned-window";
import {
  buildMobilizationPlanWorkbook,
  MOBILIZATION_PLAN_SHEETS,
  mobilizationPlanBuffer,
  recordedItems,
  type MobilizationPlanInputs,
} from "../workbook";

import { golden, priced } from "@/testing/fixtures/synthetic-rom-estimate";

const milestone = (id: string, plannedWindow: string, dependsOn: string[] = [], extra: Partial<P4RoadmapMilestone> = {}): P4RoadmapMilestone => ({
  id, name: `Milestone ${id}`, workstream: "Adoption", ownerRole: "Operations lead", plannedWindow,
  timingBasis: "[A:V1] working assumption", dependsOn, dependencyNotes: "", dependenciesReviewed: true, reviewed: true, ...extra,
});

function inputs(overrides: Partial<MobilizationPlanInputs> = {}): MobilizationPlanInputs {
  return {
    moveName: "Synthetic claims review",
    estimate: { id: "synthetic-approved-estimate", approvedAt: "2026-10-10T10:00:00Z", result: priced(golden()), rateCard: "Reference rates" },
    milestones: { status: "ready", value: [] },
    owners: { status: "ready", value: { acceptedAt: "2026-10-09T10:00:00Z", rows: [] } },
    openAssumptions: { status: "ready", value: [] },
    p5: { status: "ready", value: {} },
    ...overrides,
  };
}

async function readBack(input: MobilizationPlanInputs) {
  const workbook = new ExcelJS.Workbook();
  // ExcelJS declares a legacy Buffer shape; its runtime accepts Node buffers.
  await workbook.xlsx.load((await mobilizationPlanBuffer(input)) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook;
}
const cached = (cell: ExcelJS.Cell): unknown =>
  typeof cell.value === "object" && cell.value !== null && "formula" in cell.value ? cell.result : cell.value;
const formulaOf = (cell: ExcelJS.Cell): string | null =>
  typeof cell.value === "object" && cell.value !== null && "formula" in cell.value ? (cell.value as ExcelJS.CellFormulaValue).formula : null;

describe("plannedWindowWeeks", () => {
  it.each([
    ["Weeks 3–6", { startWeek: 3, weeks: 4 }],
    ["W3-W6", { startWeek: 3, weeks: 4 }],
    ["week 5", { startWeek: 5, weeks: 1 }],
    ["Month 2", { startWeek: 5, weeks: 4 }],
    ["M2–M4", { startWeek: 5, weeks: 13 }],
    ["months 1 to 3", { startWeek: 1, weeks: 13 }],
    ["Q1", { startWeek: 1, weeks: 13 }],
    ["Q2-Q3", { startWeek: 14, weeks: 26 }],
  ])("reads %s", (window, expected) => {
    expect(plannedWindowWeeks(window)).toEqual(expected);
  });

  it.each(["After go-live", "Weeks 6–3", "Week 0", "", "Spring", `Weeks 1–${MAX_PLAN_WEEK + 1}`, "M2 or M3"])("leaves %p to schedule", (window) => {
    expect(plannedWindowWeeks(window)).toBeNull();
  });

  it("splits a year into twelve months with no gap or overlap", () => {
    const weeks = Array.from({ length: 12 }, (_, i) => monthWeeks(i + 1));
    expect(weeks[0]).toEqual({ first: 1, last: 4 });
    expect(weeks[11]!.last).toBe(52);
    weeks.slice(1).forEach((month, i) => expect(month.first).toBe(weeks[i]!.last + 1));
  });
});

describe("buildMobilizationPlanWorkbook", () => {
  it("plans the approved estimate's blocks one after another, on the estimate's own weeks", () => {
    const input = inputs();
    const rom = input.estimate.result;
    const { layout } = buildMobilizationPlanWorkbook(input);
    const build = layout.plan.filter((row) => row.kind === "build");
    const blockWeeks = [rom.foundation!.priced.weeks, ...rom.releases.map((release) => release.own.weeks)];
    expect(build.map((row) => row.id)).toEqual(["EST-F", "EST-R1", "EST-R2"]);
    expect(build.map((row) => row.weeks)).toEqual(blockWeeks);
    expect(build.map((row) => row.startWeek)).toEqual([1, blockWeeks[0]! + 1, blockWeeks[0]! + blockWeeks[1]! + 1]);
    expect(build.at(-1)!.endWeek).toBe(rom.total.weeks);
    expect(build.map((row) => row.dependency)).toEqual(["—", "OK", "OK"]);
  });

  it("spreads each block's cost over its weeks, so cost by week equals the approved estimate", async () => {
    const input = inputs();
    const { layout } = buildMobilizationPlanWorkbook(input);
    const workbook = await readBack(input);
    const team = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.team)!;
    expect(cached(team.getCell(layout.team.totalCell))).toBeCloseTo(input.estimate.result.total.planCents / 100, 6);
    expect(cached(team.getCell(layout.team.estimateCell))).toBe(input.estimate.result.total.planCents / 100);
    expect(cached(team.getCell(layout.team.checkCell))).toBe("YES");
    expect(formulaOf(team.getCell(layout.team.checkCell))).toBe(
      `IF(ROUND(${layout.team.totalCell}-${layout.team.estimateCell},2)=0,"YES","NO: a build block runs outside weeks 1–${layout.horizonWeeks}")`);
    // Weeks after the last block carry no delivery cost (read in memory: a cached zero is not written to the file).
    const memory = buildMobilizationPlanWorkbook(input).workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.team)!;
    const after = input.estimate.result.total.weeks + 1;
    const totalColumn = memory.getCell(layout.team.totalCell).col;
    expect(cached(memory.getCell(4 + after - 1, totalColumn))).toBeGreaterThan(0);
    expect(cached(memory.getCell(4 + after, totalColumn))).toBe(0);
  });

  it("reads the milestone windows it recognises and leaves the rest to schedule", () => {
    const { layout } = buildMobilizationPlanWorkbook(inputs({ milestones: { status: "ready", value: [
      milestone("MS-1", "Weeks 2–5"),
      milestone("MS-2", "Month 3", ["MS-1"]),
      milestone("MS-3", "After go-live", ["MS-2"]),
      milestone("MS-4", "Week 4", ["MS-1"]),
      milestone("MS-5", "Q2", ["MS-3", "MS-gone"]),
    ] } }));
    const by = Object.fromEntries(layout.plan.map((row) => [row.id, row]));
    expect(by["MS-1"]).toMatchObject({ startWeek: 2, weeks: 4, endWeek: 5, dependency: "—" });
    expect(by["MS-2"]).toMatchObject({ startWeek: 9, weeks: 5, endWeek: 13, dependency: "OK" });
    expect(by["MS-3"]).toMatchObject({ startWeek: null, endWeek: null, dependency: "To schedule" });
    expect(by["MS-4"]).toMatchObject({ startWeek: 4, dependency: "Starts early" });
    expect(by["MS-5"]).toMatchObject({ startWeek: 14, dependency: "Waits on an unscheduled task" });
  });

  it("names a dependency that is not on the plan, and draws each scheduled row on the Gantt", () => {
    const { workbook, layout } = buildMobilizationPlanWorkbook(inputs({ milestones: { status: "ready", value: [
      milestone("MS-1", "Weeks 2–3", ["MS-gone"]),
    ] } }));
    const plan = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.plan)!;
    const row = layout.plan.find((entry) => entry.id === "MS-1")!;
    expect(plan.getCell(row.row, 5).value).toBe("MS-gone (not on this plan)");
    expect(row.dependency).toBe("—");
    const gantt = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.gantt)!;
    const ganttRow = 5 + layout.plan.indexOf(row);
    const bar = [1, 2, 3, 4].map((week) => cached(gantt.getCell(ganttRow, 4 + week)));
    expect(bar).toEqual(["", 1, 1, ""]);
    expect(formulaOf(gantt.getCell(ganttRow, 6))).toBe(`IF(AND(ISNUMBER(Plan!$F${row.row}),ISNUMBER(Plan!$H${row.row}),2>=Plan!$F${row.row},2<=Plan!$H${row.row}),1,"")`);
  });

  it("writes the dependency check as a live formula over every dependency", async () => {
    // MS-3 starts the week MS-1 ends, after MS-2 ends: only the LATEST dependency decides.
    const input = inputs({ milestones: { status: "ready", value: [milestone("MS-1", "Weeks 2–5"), milestone("MS-2", "Weeks 3–4"), milestone("MS-3", "Week 5", ["MS-1", "MS-2"])] } });
    const { layout } = buildMobilizationPlanWorkbook(input);
    const plan = (await readBack(input)).getWorksheet(MOBILIZATION_PLAN_SHEETS.plan)!;
    const row = layout.plan.find((entry) => entry.id === "MS-3")!.row;
    expect(formulaOf(plan.getCell(row, 10))).toContain('MAX(INDEX(');
    expect(formulaOf(plan.getCell(row, 10))).toContain('MATCH("MS-1"');
    expect(formulaOf(plan.getCell(row, 10))).toContain('MATCH("MS-2"');
    expect(cached(plan.getCell(row, 10))).toBe("Same week");
    expect(plan.getCell(row, 5).value).toBe("MS-1, MS-2");
    expect(formulaOf(plan.getCell(row, 8))).toBe(`IF(OR(F${row}="",G${row}=""),"",F${row}+G${row}-1)`);
    expect(formulaOf(plan.getCell(row, 9))).toBe(`IF(F${row}="","","M"&ROUNDUP(F${row}*12/52,0))`);
  });

  it("writes recorded text as text, never as a formula", async () => {
    const input = inputs({ milestones: { status: "ready", value: [milestone("MS-1", "Week 2", [], { name: "=HYPERLINK(\"x\")" })] } });
    const workbook = await readBack(input);
    const plan = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.plan)!;
    const inputsSheet = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.inputs)!;
    const texts = [...Array(30).keys()].flatMap((i) => [plan.getCell(5 + i, 3), inputsSheet.getCell(7 + i, 1)]);
    expect(texts.map((cell) => cell.value)).toEqual(expect.arrayContaining(["=HYPERLINK(\"x\")", "=Release one"]));
    for (const cell of texts) if (typeof cell.value === "string" && cell.value.startsWith("=")) expect(formulaOf(cell)).toBeNull();
  });

  it("lists owners, readiness items and open assumptions as recorded, with no score or figure added", async () => {
    const input = inputs({
      owners: { status: "ready", value: { acceptedAt: null, rows: [
        { rowId: "RC-1", source: "step1", name: "Claims intake checks", owner: { name: "Intake lead", writtenBy: "you" }, rights: { certifies: { value: true, writtenBy: "you" } } },
        { rowId: "T-1", source: "team", name: "Data team", rights: {} },
      ] } },
      openAssumptions: { status: "ready", value: [{ id: "V2", statement: "Rework rate holds", ownerRole: "Finance partner", source: "Synthetic notes" }] },
      p5: { status: "ready", value: { launch_readiness: "- Access approved\n- Owners named", mobilization_plan: "Kick-off held; Team confirmed", risks_open_items: "Extract delay" } },
    });
    const { layout } = buildMobilizationPlanWorkbook(input);
    expect(layout.checklistItems).toBe(4);
    expect(layout.riskItems).toBe(2);
    const workbook = await readBack(input);
    const owners = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.owners)!;
    expect(owners.getCell("A2").value).toBe("From the P3 operating model. Not yet accepted in P3: read these as proposed.");
    expect([owners.getCell("A5").value, owners.getCell("B5").value, owners.getCell("C5").value]).toEqual(["Claims intake checks", "Intake lead", "✓"]);
    expect(owners.getCell("B6").value).toBeNull();
    expect(cached(owners.getCell("B8"))).toBe(1);
    const checklist = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.checklist)!;
    expect([2, 3, 4, 5].map((i) => checklist.getCell(4 + i - 1, 2).value)).toEqual(["Access approved", "Owners named", "Kick-off held", "Team confirmed"]);
    const risks = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.risks)!;
    expect([risks.getCell("A5").value, risks.getCell("B5").value, risks.getCell("A6").value]).toEqual(["[A:V2]", "Rework rate holds", "P5-1"]);
    expect(risks.getCell(4, 1).value).toBe("Reference");
    expect(risks.getCell("F5").dataValidation).toMatchObject({ type: "list", formulae: ['"Open,Closed"'] });
    expect(checklist.getCell("E5").dataValidation).toMatchObject({ type: "list", formulae: ['"Open,Closed"'] });
    expect(String(risks.getCell("A2").value)).toContain("No likelihood or impact score is recorded");
  });

  it("says which part is unavailable instead of filling it", async () => {
    const input = inputs({
      milestones: { status: "gap", detail: "P4 milestone plan could not be read." },
      owners: { status: "gap", detail: "P3 capture could not be read." },
    });
    const { layout } = buildMobilizationPlanWorkbook(input);
    expect(layout.plan.every((row) => row.kind === "build")).toBe(true);
    const workbook = await readBack(input);
    expect(workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.owners)!.getCell("A2").value).toBe("Not available: P3 capture could not be read.");
    expect(workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.sources)!.getCell("C6").value).toBe("Not available: P4 milestone plan could not be read.");
  });

  it("lists the cost the estimate does not cover as open, with no amount", async () => {
    const input = inputs();
    const { layout } = buildMobilizationPlanWorkbook(input);
    const team = (await readBack(input)).getWorksheet(MOBILIZATION_PLAN_SHEETS.team)!;
    const check = team.getCell(layout.team.checkCell);
    const open = [3, 4, 5].map((offset) => team.getCell(check.row + offset, check.col));
    expect(open.map((cell) => cell.value)).toEqual([null, null, null]);
    expect([3, 4, 5].map((offset) => team.getCell(check.row + offset, 1).value)).toEqual([
      "Client staff time outside the delivery team", "Run cost after go-live", "Change management and training"]);
    expect(team.getCell(check.row + 3, check.col + 1).value).toBe("Not estimated; the owner supplies it before mobilization");
  });
});

describe("recordedItems", () => {
  it("splits on lines, then semicolons, and strips list markers", () => {
    expect(recordedItems("1. One\n2) Two\n• Three")).toEqual(["One", "Two", "Three"]);
    expect(recordedItems("One; two;three")).toEqual(["One", "two", "three"]);
    expect(recordedItems("   ")).toEqual([]);
    expect(recordedItems(undefined)).toEqual([]);
  });
});

if (process.env.MOBILIZATION_PLAN_OUTPUT) {
  it("writes a sample for recalculation", async () => {
    const input = inputs({
      milestones: { status: "ready", value: [milestone("MS-1", "Weeks 2–5"), milestone("MS-2", "Month 3", ["MS-1"]), milestone("MS-3", "After go-live", ["MS-2"]),
        milestone("MS-4", "Week 4", ["MS-1"]), milestone("MS-5", "Q2", ["MS-2", "MS-4"])] },
      owners: { status: "ready", value: { acceptedAt: "2026-10-09T10:00:00Z", rows: [
        { rowId: "RC-1", source: "step1", name: "Claims intake checks", owner: { name: "Intake lead", writtenBy: "you" }, rights: { certifies: { value: true, writtenBy: "you" }, releases: { value: true, writtenBy: "you" } } }] } },
      openAssumptions: { status: "ready", value: [{ id: "V2", statement: "Rework rate holds", ownerRole: "Finance partner", source: "Synthetic notes" }] },
      p5: { status: "ready", value: { launch_readiness: "- Access approved\n- Owners named", risks_open_items: "Extract delay" } },
    });
    const { workbook, layout } = buildMobilizationPlanWorkbook(input);
    const fs = await import("node:fs");
    fs.writeFileSync(`${process.env.MOBILIZATION_PLAN_OUTPUT}/plan.xlsx`, Buffer.from(await workbook.xlsx.writeBuffer()));
    const expected: Record<string, unknown> = {};
    for (const ws of workbook.worksheets) ws.eachRow((row) => row.eachCell((cell) => {
      if (typeof cell.value === "object" && cell.value !== null && "formula" in cell.value) {
        expected[`${ws.name}!${cell.address}`] = cell.result ?? 0;
        cell.value = { formula: (cell.value as ExcelJS.CellFormulaValue).formula } as ExcelJS.CellFormulaValue;
      }
    }));
    fs.writeFileSync(`${process.env.MOBILIZATION_PLAN_OUTPUT}/stripped.xlsx`, Buffer.from(await workbook.xlsx.writeBuffer()));
    fs.writeFileSync(`${process.env.MOBILIZATION_PLAN_OUTPUT}/expected.json`, JSON.stringify({ expected, layout }));
  });
}
