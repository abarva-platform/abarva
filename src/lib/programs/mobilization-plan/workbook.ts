/**
 * The P5 mobilization and execution plan: a live-formula workbook the delivery
 * owner runs from after handoff.
 *
 * Every duration comes from a record: build weeks from the approved estimate,
 * milestone windows from the reviewed P4 roadmap. A window the plan cannot
 * read is left for the owner to schedule. Team cost by week is the approved
 * estimate's own block cost spread over that block's weeks, so it sums to the
 * approved estimate, and a check cell says so. Owners, decision rights,
 * readiness items and open assumptions are the Move's own records. Cost the
 * estimate does not cover is listed as open, never invented.
 *
 * Every formula cell carries a cached result equal to what the formula
 * computes, so a reader that does not recalculate sees the same numbers.
 * Pure apart from ExcelJS: no I/O, no clock. Recorded text is written as
 * text, never as a formula.
 */
import ExcelJS from "exceljs";
import type { RomPricedBlock, RomResult } from "@/lib/pricing/moves-workflow/rom-service";
import type { P4RoadmapMilestone } from "@/lib/programs/p4-roadmap-plan";
import { DECISION_RIGHTS, type OwnerRow } from "@/lib/programs/operating-adoption";
import { plannedWindowWeeks } from "./planned-window";

export const MOBILIZATION_PLAN_SHEETS = {
  readme: "README",
  inputs: "Inputs",
  plan: "Plan",
  gantt: "Gantt",
  team: "Team and Cost",
  owners: "Owners",
  checklist: "Readiness Checklist",
  risks: "Risks and Open Items",
  sources: "Sources",
} as const;

export const MOBILIZATION_PLAN_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type PlanRead<T> = { status: "ready"; value: T } | { status: "gap"; detail: string };

export interface MobilizationOpenAssumption {
  id: string;
  statement: string;
  ownerRole: string | null;
  source: string | null;
}

export interface MobilizationPlanInputs {
  moveName: string;
  /** The approved estimate, recomputed on its own pinned rates and matched to the approval. */
  estimate: { id: string; approvedAt: string; result: RomResult; rateCard: string };
  milestones: PlanRead<P4RoadmapMilestone[]>;
  owners: PlanRead<{ acceptedAt: string | null; rows: OwnerRow[] }>;
  openAssumptions: PlanRead<MobilizationOpenAssumption[]>;
  /** P5 capture answers, by key. */
  p5: PlanRead<Record<string, string>>;
}

/** What one Plan row says once the workbook calculates. */
export interface MobilizationPlanRow {
  id: string;
  row: number;
  kind: "build" | "milestone";
  startWeek: number | null;
  weeks: number | null;
  endWeek: number | null;
  dependency: string;
}

export interface MobilizationPlanLayout {
  plan: MobilizationPlanRow[];
  horizonWeeks: number;
  team: { totalCell: string; estimateCell: string; checkCell: string };
  /** Readiness items and open items, as written. */
  checklistItems: number;
  riskItems: number;
}

const TEAL = "FF087F75";
const SOFT = "FFBFD6D2";
const INK = "FF1C2428";
const MUTED = "FF536267";
const INPUT_BLUE = "FF0000FF";
const RULE = "FFCCD6D4";

const BODY: Partial<ExcelJS.Font> = { name: "Arial", size: 10, color: { argb: INK } };
const BOLD: Partial<ExcelJS.Font> = { ...BODY, bold: true };
const INPUT: Partial<ExcelJS.Font> = { name: "Arial", size: 10, color: { argb: INPUT_BLUE } };
const NOTE: Partial<ExcelJS.Font> = { name: "Arial", size: 9, italic: true, color: { argb: MUTED } };
const HEAD: Partial<ExcelJS.Font> = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
const BOX: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: RULE } }, bottom: { style: "thin", color: { argb: RULE } },
  left: { style: "thin", color: { argb: RULE } }, right: { style: "thin", color: { argb: RULE } },
};
const USD = '"$"#,##0;("$"#,##0);"–"';
const USD2 = '"$"#,##0.00';

const BUILD_WORKSTREAM = "Delivery build";
const STATUS = ["Not started", "In progress", "Done", "Blocked"] as const;
const ITEM_STATES = ["Open", "Closed"] as const;

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

function text(ws: ExcelJS.Worksheet, row: number, col: number, value: string | number | null, font = BODY, wrap = false) {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.font = font;
  cell.border = BOX;
  if (wrap) cell.alignment = { wrapText: true, vertical: "top" };
  return cell;
}

function formula(ws: ExcelJS.Worksheet, row: number, col: number, f: string, result: Cached, font = BODY) {
  const cell = ws.getCell(row, col);
  cell.value = { formula: f, result } as ExcelJS.CellFormulaValue;
  cell.font = font;
  cell.border = BOX;
  return cell;
}

/** A drop-down of the given options on rows first…last of one column. */
function list(ws: ExcelJS.Worksheet, column: number, first: number, last: number, options: readonly string[]) {
  for (let row = first; row <= last; row += 1)
    ws.getCell(row, column).dataValidation = { type: "list", allowBlank: false, formulae: [`"${options.join(",")}"`] };
}

/** An ID safe inside a formula string and unique on the Plan. */
function planId(raw: string, taken: Set<string>): string {
  const base = raw.replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 24) || "M";
  let id = base;
  for (let n = 2; taken.has(id.toUpperCase()); n += 1) id = `${base}-${n}`;
  taken.add(id.toUpperCase());
  return id;
}

/** Split a recorded answer into its items: one per line, bullet or semicolon. */
export function recordedItems(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parts = lines.length > 1 ? lines : value.split(/;\s*/);
  return parts
    .map((part) => part.replace(/^(?:[-*•–]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 40);
}

const monthOf = (week: number) => `M${Math.ceil((week * 12) / 52)}`;

export function buildMobilizationPlanWorkbook(input: MobilizationPlanInputs): {
  workbook: ExcelJS.Workbook;
  layout: MobilizationPlanLayout;
} {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AbarVa Moves";
  wb.calcProperties.fullCalcOnLoad = true;
  const rom = input.estimate.result;
  const blocks: RomPricedBlock[] = [
    ...(rom.foundation ? [rom.foundation.priced] : []),
    ...rom.releases.map((release) => release.own),
  ];
  const milestones = input.milestones.status === "ready" ? input.milestones.value : [];
  const p5 = input.p5.status === "ready" ? input.p5.value : {};

  // ── README ────────────────────────────────────────────────────────────
  const readme = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.readme);
  title(readme, `${input.moveName}: mobilization and execution plan`,
    "Built from the Move's approved records. No start date, owner commitment or execution status is recorded here.");
  [
    ["Purpose", "The working plan the delivery owner runs from after handoff: build blocks, milestones, owners, readiness, team cost by week and open items, in one live workbook."],
    ["How to read", "Plan holds every task. Gantt draws the plan from its start and duration cells; Team and Cost reads the build rows. Move a start or a duration and everything that depends on it moves. Blue cells are inputs; black cells are formulas."],
    ["Weeks", "Week 1 is the first week after the handoff is accepted. Enter a start date on Inputs to show calendar dates; leave it blank and the plan stays in relative weeks."],
    ["Where durations come from", "Build weeks come from the approved estimate on Inputs, one block after another, as the estimate prices them. Milestone windows come from the reviewed P4 roadmap. A window the plan cannot read is marked 'To schedule' for the owner; it is never guessed."],
    ["Checks", "Plan flags a task that starts before the task it depends on ends. Team and Cost checks that cost by week equals the approved estimate."],
    ["Not included", "Cost outside the delivery team the estimate prices: client staff time, run cost after go-live, and change management. Team and Cost lists them as open rows. An AI-assisted scenario, if one was approved beside the estimate, is a comparison and is not planned here."],
  ].forEach(([label, value], i) => {
    readme.getCell(4 + i, 1).value = label;
    readme.getCell(4 + i, 1).font = BOLD;
    const cell = readme.getCell(4 + i, 2);
    cell.value = value;
    cell.font = BODY;
    cell.alignment = { wrapText: true, vertical: "top" };
    readme.getRow(4 + i).height = 44;
  });
  readme.getColumn(1).width = 24;
  readme.getColumn(2).width = 110;

  // ── Inputs ────────────────────────────────────────────────────────────
  const inputs = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.inputs);
  title(inputs, "Inputs", `Blue cells are inputs. Build blocks are the approved estimate ${input.estimate.id}, approved ${input.estimate.approvedAt.slice(0, 10)}.`);
  text(inputs, 4, 1, "Start date (Monday of week 1)", BOLD);
  const start = inputs.getCell(4, 2);
  start.font = INPUT;
  start.border = BOX;
  start.numFmt = "dd mmm yyyy";
  text(inputs, 4, 3, "Leave blank until a start is approved", NOTE);
  const START = "Inputs!$B$4";
  head(inputs, 6, ["Build block", "Code", "Weeks", "Plan cost", "Cost per week", "Low", "High", "Basis"]);
  const blockRow = new Map<RomPricedBlock, number>();
  blocks.forEach((block, i) => {
    const r = 7 + i;
    blockRow.set(block, r);
    text(inputs, r, 1, block.kind === "foundation" ? `Shared foundation: ${block.name}` : block.name);
    text(inputs, r, 2, block.code);
    text(inputs, r, 3, block.weeks, INPUT);
    text(inputs, r, 4, block.range.planCents / 100).numFmt = USD;
    formula(inputs, r, 5, `D${r}/C${r}`, block.weeks > 0 ? block.range.planCents / 100 / block.weeks : 0).numFmt = USD2;
    text(inputs, r, 6, block.range.lowCents / 100).numFmt = USD;
    text(inputs, r, 7, block.range.highCents / 100).numFmt = USD;
    text(inputs, r, 8, "Approved estimate: weeks and cost at plan", NOTE);
  });
  const blockTotalRow = 7 + blocks.length;
  text(inputs, blockTotalRow, 1, "Approved estimate", BOLD);
  formula(inputs, blockTotalRow, 3, `SUM(C7:C${blockTotalRow - 1})`, blocks.reduce((sum, b) => sum + b.weeks, 0), BOLD);
  formula(inputs, blockTotalRow, 4, `SUM(D7:D${blockTotalRow - 1})`, rom.total.planCents / 100, BOLD).numFmt = USD;
  text(inputs, blockTotalRow + 1, 1, "Changing a block's weeks moves the plan and spreads the same block cost over the new weeks. It never changes the approved estimate.", NOTE);
  const ESTIMATE_PLAN = `Inputs!$D$${blockTotalRow}`;

  const teamTop = blockTotalRow + 4;
  text(inputs, teamTop - 1, 1, `Delivery team (rates: ${input.estimate.rateCard})`, BOLD);
  head(inputs, teamTop, ["Role", "Level", "Location", "Provider class", "FTE", "Hourly rate", "Basis"]);
  const lines = blocks[0]?.pod.memberLines ?? [];
  lines.forEach((line, i) => {
    const r = teamTop + 1 + i;
    text(inputs, r, 1, line.member.roleCode);
    text(inputs, r, 2, line.member.levelCode);
    text(inputs, r, 3, line.member.locationCode);
    text(inputs, r, 4, line.member.providerClassCode ?? "Rate source's own class");
    text(inputs, r, 5, line.member.fte);
    text(inputs, r, 6, line.rate.hourlyRateCents / 100).numFmt = USD2;
    text(inputs, r, 7, line.caveats.length ? line.caveats.join("; ") : "Approved estimate", NOTE);
  });
  const fteRow = teamTop + 1 + lines.length;
  text(inputs, fteRow, 1, "Team FTE", BOLD);
  formula(inputs, fteRow, 5, lines.length ? `SUM(E${teamTop + 1}:E${fteRow - 1})` : "0",
    lines.reduce((sum, line) => sum + line.member.fte, 0), BOLD);
  const TEAM_FTE = `Inputs!$E$${fteRow}`;
  [24, 10, 10, 14, 14, 12, 12, 40].forEach((width, i) => { inputs.getColumn(i + 1).width = width; });
  inputs.getColumn(1).width = 44;

  // ── Plan ──────────────────────────────────────────────────────────────
  const plan = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.plan);
  title(plan, "Plan", "One row per task. Start and duration are inputs; build durations link to the approved estimate. A task starting before what it depends on ends is flagged.");
  head(plan, 4, ["ID", "Workstream", "Task", "Owner role", "Depends on", "Start week", "Weeks", "End week", "Start month", "Dependency check",
    "Planned window as recorded", "Timing basis", "Reviewed in P4", "Status"]);
  const taken = new Set<string>();
  type Draft = {
    id: string; kind: "build" | "milestone"; workstream: string; task: string; owner: string;
    deps: string[]; unknownDeps: string[]; start: number | string | null; weeks: number | string | null;
    startValue: number | null; weeksValue: number | null; window: string; basis: string; reviewed: string;
  };
  const drafts: Draft[] = [];
  blocks.forEach((block, i) => {
    const r = blockRow.get(block)!;
    drafts.push({
      id: planId(`EST-${block.code}`, taken), kind: "build",
      workstream: BUILD_WORKSTREAM,
      task: block.kind === "foundation" ? `Build the shared foundation: ${block.name}` : `Build ${block.name}`,
      owner: "", deps: i === 0 ? [] : [drafts[i - 1]!.id], unknownDeps: [],
      start: null, weeks: `Inputs!$C$${r}`, startValue: null, weeksValue: block.weeks,
      window: "", basis: "Approved estimate: one block after another", reviewed: "",
    });
  });
  const milestoneIds = new Map<string, string>();
  for (const m of milestones) milestoneIds.set(m.id, planId(m.id, taken));
  for (const m of milestones) {
    const window = plannedWindowWeeks(m.plannedWindow);
    const deps = m.dependsOn.filter((dep) => milestoneIds.has(dep)).map((dep) => milestoneIds.get(dep)!);
    drafts.push({
      id: milestoneIds.get(m.id)!, kind: "milestone", workstream: m.workstream, task: m.name, owner: m.ownerRole,
      deps, unknownDeps: m.dependsOn.filter((dep) => !milestoneIds.has(dep)),
      start: window?.startWeek ?? null, weeks: window?.weeks ?? null,
      startValue: window?.startWeek ?? null, weeksValue: window?.weeks ?? null,
      window: m.plannedWindow, basis: m.timingBasis, reviewed: m.reviewed ? "Yes" : "No",
    });
  }
  const FIRST = 5;
  const LAST = FIRST + Math.max(drafts.length, 1) - 1;
  // Resolve each row's start and end in order (build rows chain; milestones are as read).
  const ends = new Map<string, number | null>();
  drafts.forEach((draft, i) => {
    if (draft.kind === "build") draft.startValue = i === 0 ? 1 : (ends.get(drafts[i - 1]!.id) ?? 0) + 1;
    const end = draft.startValue !== null && draft.weeksValue !== null ? draft.startValue + draft.weeksValue - 1 : null;
    ends.set(draft.id, end);
  });
  const ID_RANGE = `Plan!$A$${FIRST}:$A$${LAST}`;
  const END_RANGE = `Plan!$H$${FIRST}:$H$${LAST}`;
  const rows: MobilizationPlanRow[] = [];
  drafts.forEach((draft, i) => {
    const r = FIRST + i;
    text(plan, r, 1, draft.id, BOLD);
    text(plan, r, 2, draft.workstream, BODY, true);
    text(plan, r, 3, draft.task, BODY, true);
    text(plan, r, 4, draft.owner || null, draft.owner ? BODY : INPUT, true);
    text(plan, r, 5, [...draft.deps, ...draft.unknownDeps.map((dep) => `${dep} (not on this plan)`)].join(", ") || null);
    if (draft.kind === "build" && i > 0) formula(plan, r, 6, `H${r - 1}+1`, draft.startValue!);
    else text(plan, r, 6, draft.startValue, INPUT);
    if (draft.kind === "build") formula(plan, r, 7, draft.weeks as string, draft.weeksValue!);
    else text(plan, r, 7, draft.weeksValue, INPUT);
    const end = ends.get(draft.id) ?? null;
    formula(plan, r, 8, `IF(OR(F${r}="",G${r}=""),"",F${r}+G${r}-1)`, end ?? "");
    formula(plan, r, 9, `IF(F${r}="","","M"&ROUNDUP(F${r}*12/52,0))`, draft.startValue === null ? "" : monthOf(draft.startValue));
    // Dependency check: compare the start with the latest end among what it depends on.
    const depEnds = draft.deps.map((dep) => `INDEX(${END_RANGE},MATCH("${dep}",${ID_RANGE},0))`);
    const latest = depEnds.length === 1 ? depEnds[0]! : `MAX(${depEnds.join(",")})`;
    const known = draft.deps.map((dep) => ends.get(dep) ?? null);
    const dependency = draft.startValue === null ? "To schedule"
      : !draft.deps.length ? "—"
        : known.some((value) => value === null) ? "Waits on an unscheduled task"
          : draft.startValue > Math.max(...(known as number[])) ? "OK"
            : draft.startValue === Math.max(...(known as number[])) ? "Same week" : "Starts early";
    formula(plan, r, 10, !draft.deps.length
      ? `IF(F${r}="","To schedule","—")`
      : `IF(F${r}="","To schedule",IF(COUNT(${depEnds.join(",")})<${depEnds.length},"Waits on an unscheduled task",IF(F${r}>${latest},"OK",IF(F${r}=${latest},"Same week","Starts early"))))`,
    dependency);
    text(plan, r, 11, draft.window || null, BODY, true);
    text(plan, r, 12, draft.basis || null, NOTE, true);
    text(plan, r, 13, draft.reviewed || null);
    text(plan, r, 14, "Not started", INPUT);
    rows.push({ id: draft.id, row: r, kind: draft.kind, startWeek: draft.startValue, weeks: draft.weeksValue, endWeek: end, dependency });
  });
  if (drafts.length) {
    list(plan, 14, FIRST, LAST, STATUS);
    plan.addConditionalFormatting({ ref: `J${FIRST}:J${LAST}`, rules: [
      { type: "expression", priority: 1, formulae: [`J${FIRST}="Starts early"`], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFF4D6D6" } }, font: { bold: true, color: { argb: "FF9B2C2C" } } } },
      { type: "expression", priority: 2, formulae: [`OR(J${FIRST}="To schedule",J${FIRST}="Waits on an unscheduled task")`], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFF6EEDF" } } } },
    ] });
  }
  const summaryTop = LAST + 2;
  text(plan, summaryTop, 1, "Summary", BOLD);
  const count = (status: string) => rows.filter((row) => row.dependency === status).length;
  const scheduled = rows.filter((row) => row.endWeek !== null).map((row) => row.endWeek as number);
  ([
    ["Tasks", `COUNTA(A${FIRST}:A${LAST})`, rows.length],
    ["To schedule", `COUNTIF(J${FIRST}:J${LAST},"To schedule")`, count("To schedule")],
    ["Dependency flags", `COUNTIF(J${FIRST}:J${LAST},"Starts early")`, count("Starts early")],
    ["Plan ends (week)", `MAX(H${FIRST}:H${LAST})`, scheduled.length ? Math.max(...scheduled) : 0],
  ] as const).forEach(([label, f, result], i) => {
    text(plan, summaryTop + 1 + i, 1, label);
    formula(plan, summaryTop + 1 + i, 3, f, result, BOLD);
  });
  [10, 16, 40, 24, 16, 9, 7, 9, 9, 16, 22, 30, 10, 12].forEach((width, i) => { plan.getColumn(i + 1).width = width; });
  plan.views = [{ state: "frozen", xSplit: 3, ySplit: 4, showGridLines: false }];

  // ── Gantt ─────────────────────────────────────────────────────────────
  const horizon = Math.min(104, Math.max(12, (scheduled.length ? Math.max(...scheduled) : 0) + 4));
  const gantt = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.gantt);
  title(gantt, "Gantt", `Drawn from Plan: teal is a build block, grey-green a milestone. Weeks 1–${horizon}; change a start or a duration on Plan and the bars move.`);
  const W0 = 4;
  head(gantt, 4, ["ID", "Workstream", "Task"]);
  gantt.getCell(3, 3).value = "Month";
  gantt.getCell(3, 3).font = NOTE;
  for (let w = 1; w <= horizon; w += 1) {
    const col = W0 + w;
    const cell = gantt.getCell(4, col);
    cell.value = w;
    cell.font = HEAD;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
    cell.alignment = { horizontal: "center" };
    const firstOfMonth = Math.floor(((Math.ceil((w * 12) / 52) - 1) * 52) / 12) + 1 === w;
    gantt.getCell(3, col).value = firstOfMonth ? monthOf(w) : null;
    gantt.getCell(3, col).font = NOTE;
    const date = gantt.getCell(5 + drafts.length, col);
    date.value = { formula: `IF(${START}="","",${START}+7*(${w}-1))`, result: "" } as ExcelJS.CellFormulaValue;
    date.numFmt = "dd-mmm";
    date.font = NOTE;
    date.alignment = { textRotation: 90 };
    gantt.getColumn(col).width = 3.2;
  }
  gantt.getCell(5 + drafts.length, 3).value = "Week starting (when a start date is entered)";
  gantt.getCell(5 + drafts.length, 3).font = NOTE;
  rows.forEach((row, i) => {
    const r = 5 + i;
    const pr = row.row;
    formula(gantt, r, 1, `Plan!A${pr}`, row.id, BOLD);
    formula(gantt, r, 2, `Plan!B${pr}`, drafts[i]!.workstream, NOTE);
    formula(gantt, r, 3, `Plan!C${pr}`, drafts[i]!.task);
    for (let w = 1; w <= horizon; w += 1) {
      const on = row.startWeek !== null && row.endWeek !== null && w >= row.startWeek && w <= row.endWeek;
      const cell = gantt.getCell(r, W0 + w);
      cell.value = { formula: `IF(AND(ISNUMBER(Plan!$F${pr}),ISNUMBER(Plan!$H${pr}),${w}>=Plan!$F${pr},${w}<=Plan!$H${pr}),1,"")`, result: on ? 1 : "" } as ExcelJS.CellFormulaValue;
      cell.numFmt = ";;;";
    }
  });
  if (rows.length) {
    const firstCol = gantt.getColumn(W0 + 1).letter;
    const lastCol = gantt.getColumn(W0 + horizon).letter;
    gantt.addConditionalFormatting({ ref: `${firstCol}5:${lastCol}${4 + rows.length}`, rules: [
      { type: "expression", priority: 1, formulae: [`AND(${firstCol}5=1,$B5="${BUILD_WORKSTREAM}")`], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: TEAL } } } },
      { type: "expression", priority: 2, formulae: [`${firstCol}5=1`], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: SOFT } } } },
    ] });
  }
  gantt.getColumn(1).width = 10;
  gantt.getColumn(2).width = 16;
  gantt.getColumn(3).width = 40;
  gantt.getColumn(4).width = 2;
  gantt.views = [{ state: "frozen", xSplit: W0, ySplit: 4, showGridLines: false }];

  // ── Team and Cost ─────────────────────────────────────────────────────
  const team = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.team);
  title(team, "Team and cost by week", "A build block's cost at plan, spread evenly over its weeks while it runs on Plan. The total must equal the approved estimate.");
  const buildRows = rows.filter((row) => row.kind === "build");
  head(team, 4, ["Week", "Team FTE", ...blocks.map((block) => block.code), "Delivery cost", "Cumulative"]);
  const totalCol = 3 + blocks.length;
  let cumulative = 0;
  for (let w = 1; w <= horizon; w += 1) {
    const r = 4 + w;
    text(team, r, 1, w);
    let weekCost = 0;
    let active = false;
    blocks.forEach((block, b) => {
      const pr = buildRows[b]!.row;
      const on = buildRows[b]!.startWeek !== null && buildRows[b]!.endWeek !== null && w >= buildRows[b]!.startWeek! && w <= buildRows[b]!.endWeek!;
      const value = on && block.weeks > 0 ? block.range.planCents / 100 / block.weeks : 0;
      if (on) active = true;
      weekCost += value;
      formula(team, r, 3 + b, `IF(AND(ISNUMBER(Plan!$F$${pr}),ISNUMBER(Plan!$H$${pr}),$A${r}>=Plan!$F$${pr},$A${r}<=Plan!$H$${pr}),Inputs!$E$${blockRow.get(block)},0)`, value).numFmt = USD;
    });
    const blockRef = blocks.length ? `${team.getColumn(3).letter}${r}:${team.getColumn(2 + blocks.length).letter}${r}` : null;
    formula(team, r, 2, blockRef ? `IF(COUNTIF(${blockRef},">0")>0,${TEAM_FTE},0)` : "0", active ? lines.reduce((sum, line) => sum + line.member.fte, 0) : 0).numFmt = "0.0";
    cumulative += weekCost;
    formula(team, r, totalCol, blockRef ? `SUM(${blockRef})` : "0", weekCost).numFmt = USD;
    formula(team, r, totalCol + 1, `SUM($${team.getColumn(totalCol).letter}$5:${team.getColumn(totalCol).letter}${r})`, cumulative).numFmt = USD;
  }
  const endRow = 4 + horizon;
  const totalLetter = team.getColumn(totalCol).letter;
  const totalCell = `${totalLetter}${endRow + 1}`;
  const estimateCell = `${totalLetter}${endRow + 2}`;
  const checkCell = `${totalLetter}${endRow + 3}`;
  text(team, endRow + 1, 1, "Total", BOLD);
  formula(team, endRow + 1, totalCol, `SUM(${totalLetter}5:${totalLetter}${endRow})`, cumulative, BOLD).numFmt = USD;
  text(team, endRow + 2, 1, "Approved estimate at plan", BOLD);
  formula(team, endRow + 2, totalCol, ESTIMATE_PLAN, rom.total.planCents / 100, BOLD).numFmt = USD;
  text(team, endRow + 3, 1, "Matches the approved estimate", BOLD);
  const matches = Math.round((cumulative - rom.total.planCents / 100) * 100) === 0;
  formula(team, endRow + 3, totalCol, `IF(ROUND(${totalCell}-${estimateCell},2)=0,"YES","NO: a build block runs outside weeks 1–${horizon}")`,
    matches ? "YES" : `NO: a build block runs outside weeks 1–${horizon}`, BOLD);
  text(team, endRow + 5, 1, "Not in the approved estimate (open)", BOLD);
  ["Client staff time outside the delivery team", "Run cost after go-live", "Change management and training"].forEach((label, i) => {
    text(team, endRow + 6 + i, 1, label);
    const cell = text(team, endRow + 6 + i, totalCol, null, INPUT);
    cell.numFmt = USD;
    text(team, endRow + 6 + i, totalCol + 1, "Not estimated; the owner supplies it before mobilization", NOTE);
  });
  team.getColumn(1).width = 44;
  team.getColumn(2).width = 10;
  for (let b = 0; b < blocks.length; b += 1) team.getColumn(3 + b).width = 14;
  team.getColumn(totalCol).width = 16;
  team.getColumn(totalCol + 1).width = 44;

  // ── Owners ────────────────────────────────────────────────────────────
  const owners = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.owners);
  if (input.owners.status === "ready") {
    const accepted = input.owners.value.acceptedAt;
    title(owners, "Owners and decision rights", accepted
      ? `From the P3 operating model, accepted ${accepted.slice(0, 10)}. Change them in the product, not here.`
      : "From the P3 operating model. Not yet accepted in P3: read these as proposed.");
    head(owners, 4, ["Design element or team", "Owner", ...DECISION_RIGHTS.map((right) => right.label)]);
    input.owners.value.rows.forEach((row, i) => {
      const r = 5 + i;
      text(owners, r, 1, row.name, BODY, true);
      text(owners, r, 2, row.owner?.name ?? null, row.owner ? BODY : INPUT);
      DECISION_RIGHTS.forEach((right, j) => {
        const cell = text(owners, r, 3 + j, row.rights[right.id]?.value ? "✓" : "");
        cell.alignment = { horizontal: "center" };
      });
    });
    const last = 4 + input.owners.value.rows.length;
    text(owners, last + 2, 1, "Rows without an owner", BOLD);
    formula(owners, last + 2, 2, input.owners.value.rows.length ? `COUNTBLANK(B5:B${last})` : "0",
      input.owners.value.rows.filter((row) => !row.owner?.name).length, BOLD);
  } else {
    title(owners, "Owners and decision rights", `Not available: ${input.owners.detail}`);
  }
  owners.getColumn(1).width = 44;
  owners.getColumn(2).width = 30;
  for (let j = 0; j < DECISION_RIGHTS.length; j += 1) owners.getColumn(3 + j).width = 18;

  // ── Readiness checklist ───────────────────────────────────────────────
  const checklist = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.checklist);
  const items = [
    ...recordedItems(p5.launch_readiness).map((item) => ({ item, from: "P5 launch readiness" })),
    ...recordedItems(p5.mobilization_plan).map((item) => ({ item, from: "P5 mobilization plan" })),
  ];
  title(checklist, "Readiness checklist", input.p5.status === "ready"
    ? "Each item as recorded in P5. An item closes on its evidence, recorded in the product."
    : `Not available: ${input.p5.detail}`);
  head(checklist, 4, ["#", "Item as recorded", "Recorded in", "Owner role", "State"]);
  items.forEach(({ item, from }, i) => {
    const r = 5 + i;
    text(checklist, r, 1, i + 1);
    text(checklist, r, 2, item, BODY, true);
    text(checklist, r, 3, from, NOTE);
    text(checklist, r, 4, null, INPUT);
    text(checklist, r, 5, "Open", INPUT);
  });
  if (items.length) list(checklist, 5, 5, 4 + items.length, ITEM_STATES);
  text(checklist, 6 + items.length, 2, "Open items", BOLD);
  formula(checklist, 6 + items.length, 5, items.length ? `COUNTIF(E5:E${4 + items.length},"<>Closed")` : "0", items.length, BOLD);
  [5, 70, 22, 24, 10].forEach((width, i) => { checklist.getColumn(i + 1).width = width; });

  // ── Risks and open items ──────────────────────────────────────────────
  const risks = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.risks);
  const assumptionRows = input.openAssumptions.status === "ready" ? input.openAssumptions.value : [];
  const openItems = recordedItems(p5.risks_open_items);
  title(risks, "Risks and open items", [
    input.openAssumptions.status === "ready" ? "Open assumptions from the register could change the plan or the value; each closes when the register confirms it." : `Register not available: ${input.openAssumptions.detail}`,
    "No likelihood or impact score is recorded, so none is shown.",
  ].join(" "));
  head(risks, 4, ["Reference", "Risk or open item", "Owner role", "Source", "Task it may move", "Status"]);
  const riskRows = [
    ...assumptionRows.map((row) => [`[A:${row.id}]`, row.statement, row.ownerRole, row.source] as const),
    ...openItems.map((item, i) => [`P5-${i + 1}`, item, null, "P5 risks and open items"] as const),
  ];
  riskRows.forEach(([ref, statement, owner, source], i) => {
    const r = 5 + i;
    text(risks, r, 1, ref, BOLD);
    text(risks, r, 2, statement, BODY, true);
    text(risks, r, 3, owner, owner ? BODY : INPUT);
    text(risks, r, 4, source, NOTE, true);
    text(risks, r, 5, null, INPUT);
    text(risks, r, 6, "Open", INPUT);
  });
  if (riskRows.length) list(risks, 6, 5, 4 + riskRows.length, ITEM_STATES);
  text(risks, 6 + riskRows.length, 2, "Open", BOLD);
  formula(risks, 6 + riskRows.length, 6, riskRows.length ? `COUNTIF(F5:F${4 + riskRows.length},"<>Closed")` : "0", riskRows.length, BOLD);
  [12, 60, 24, 30, 16, 10].forEach((width, i) => { risks.getColumn(i + 1).width = width; });

  // ── Sources ───────────────────────────────────────────────────────────
  const sources = wb.addWorksheet(MOBILIZATION_PLAN_SHEETS.sources);
  title(sources, "Sources", "Where each part of this workbook comes from.");
  head(sources, 4, ["Part", "Source", "State"]);
  const reviewed = milestones.filter((m) => m.reviewed).length;
  [
    ["Build blocks, weeks, team and cost", `Approved estimate ${input.estimate.id}`, `Approved ${input.estimate.approvedAt.slice(0, 10)}; rates: ${input.estimate.rateCard}`],
    ["Milestones and windows", "P4 milestone plan", input.milestones.status === "ready" ? `${milestones.length} milestones, ${reviewed} reviewed` : `Not available: ${input.milestones.detail}`],
    ["Owners and decision rights", "P3 operating model", input.owners.status === "ready" ? (input.owners.value.acceptedAt ? `Accepted ${input.owners.value.acceptedAt.slice(0, 10)}` : "Not yet accepted") : `Not available: ${input.owners.detail}`],
    ["Open assumptions", "Assumptions register", input.openAssumptions.status === "ready" ? `${assumptionRows.length} open` : `Not available: ${input.openAssumptions.detail}`],
    ["Readiness items and open items", "P5 capture", input.p5.status === "ready" ? `${items.length} readiness items, ${openItems.length} open items` : `Not available: ${input.p5.detail}`],
  ].forEach((row, i) => row.forEach((value, j) => text(sources, 5 + i, 1 + j, value, j === 0 ? BOLD : BODY, true)));
  sources.getColumn(1).width = 36;
  sources.getColumn(2).width = 36;
  sources.getColumn(3).width = 60;

  for (const ws of wb.worksheets) {
    ws.pageSetup.orientation = "landscape";
    ws.pageSetup.fitToPage = true;
    ws.pageSetup.fitToWidth = 1;
    ws.pageSetup.fitToHeight = 0;
  }
  return {
    workbook: wb,
    layout: {
      plan: rows,
      horizonWeeks: horizon,
      team: { totalCell, estimateCell, checkCell },
      checklistItems: items.length,
      riskItems: riskRows.length,
    },
  };
}

export async function mobilizationPlanBuffer(input: MobilizationPlanInputs): Promise<Buffer> {
  const { workbook } = buildMobilizationPlanWorkbook(input);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
