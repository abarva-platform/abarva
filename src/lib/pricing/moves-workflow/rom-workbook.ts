/**
 * Moves ROM service — live-formula workbook (ROM increment 3).
 *
 * Writes a computed ROM (`rom-service.ts#computeRom`) as an Excel workbook
 * whose numbers are real formulas, built from each line's `FormulaTerm`s, so
 * a reviewer can change a count, a unit-hours value, the friction or a rate
 * and watch every dependent cell move:
 *
 *   Estimate           hours  = ROUND(count × unit hours × friction, 4)
 *                      weeks  = CEILING(adjusted hours ÷ ROUND(FTE × hours per
 *                               FTE-week × productive share, 4)) — a ratio
 *                               within 1E-9 of a whole number is that number,
 *                               exactly as the pod pricer treats it
 *                      cost   = ROUND(ROUND(FTE × weeks × hours per FTE-week, 4)
 *                               × rate, 0) cents per member
 *   Component Library  driver, unit hours, source, confidence
 *   Pod & Rates        role × level × location × provider class, the rate as
 *                      ROUND(base × location × provider, 0) with provenance
 *   Releases           per-release ranges, and the total with the foundation
 *                      counted once
 *   Assumptions        every input with its source and confidence
 *
 * Every formula cell also carries a cached result equal to the engine's own
 * value, so a reader that does not recalculate sees the same numbers the
 * JSON preview returns. Money is kept in integer cents (with a dollars
 * column beside it) so the workbook rounds exactly where the engine does.
 *
 * Pure apart from ExcelJS: no I/O, no clock. Caller strings are written as
 * text, never as formulas.
 */
import ExcelJS from "exceljs";
import type { FormulaTerm } from "../effort-engine/types";
import {
  ROM_DRIVER_LABELS,
  ROM_DRIVERS,
  type RomHoursBlock,
  type RomMemberMappingStatus,
  type RomPricedBlock,
  type RomResult,
} from "./rom-service";

export const ROM_WORKBOOK_SHEETS = {
  estimate: "Estimate",
  library: "Component Library",
  pod: "Pod & Rates",
  releases: "Releases",
  assumptions: "Assumptions",
  /** Added only when the ROM carries an AI-assisted scenario. */
  aiAssisted: "AI-Assisted Scenario",
  /** The engine's figures beside the workbook's formulas; every difference is 0. */
  check: "Check",
} as const;

export const ROM_WORKBOOK_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MAPPING_LABEL: Readonly<Record<RomMemberMappingStatus, string>> = {
  confirmed: "confirmed",
  caller_specified: "caller-specified",
  proposed_unapproved: "proposed mapping, unapproved",
};

/** Where the key results landed, for a reader (or a test) that wants to find them without scanning. */
export interface RomWorkbookBlockCells {
  hours: string;
  weeks: string;
  lowCents: string;
  planCents: string;
  highCents: string;
}

export interface RomWorkbookLayout {
  /** Keyed by release code; addresses on the Estimate sheet. */
  releases: Record<string, RomWorkbookBlockCells>;
  foundation: RomWorkbookBlockCells | null;
  /** Addresses on the Releases sheet. */
  total: {
    hours: string;
    lowCents: string;
    planCents: string;
    highCents: string;
    naiveSumCents: string | null;
  };
  /** On the Check sheet: the cell that sums every absolute difference, and how many figures it checks. */
  check: { totalAbsoluteDifference: string; rows: number };
  /** Addresses on the AI-Assisted Scenario sheet, when the ROM carries one. */
  aiAssisted: {
    hours: string;
    weeks: string;
    toolCostCents: string;
    lowCents: string;
    planCents: string;
    highCents: string;
    versusEstimatePlanCents: string;
  } | null;
}

/** Excel treats =, +, -, @ as formula prefixes in typed input; keep caller text literal. */
function text(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function sheetRef(sheet: string, address: string): string {
  return `'${sheet.replace(/'/g, "''")}'!${address}`;
}

function setFormula(
  ws: ExcelJS.Worksheet,
  address: string,
  formula: string,
  result: number,
): void {
  ws.getCell(address).value = { formula, result } as ExcelJS.CellFormulaValue;
}

const MULTIPLIED = new Set([
  "count",
  "unit_hours",
  "base_hours",
  "percentage",
  "factor",
  "allocation",
]);

/**
 * `ROUND(ref × ref × …  + rounding, 4)` from an hours term list: each
 * multiplied term becomes the cell `refFor` names (or its literal value), and
 * a carried rounding term is added as a literal — the same arithmetic as
 * `evaluateFormulaTerms`.
 */
export function hoursFormulaFromTerms(
  terms: readonly FormulaTerm[],
  refFor: (term: FormulaTerm, index: number) => string | null,
): string {
  const factors: string[] = [];
  const roundings: string[] = [];
  terms.forEach((term, i) => {
    if (MULTIPLIED.has(term.cellRole))
      factors.push(refFor(term, i) ?? String(term.value));
    else if (term.cellRole === "rounding") roundings.push(`(${term.value})`);
  });
  const product = factors.length > 0 ? factors.join("*") : "1";
  return `ROUND(${[product, ...roundings].join("+")},4)`;
}

/** `ROUND(base × factor × …, 0)` from a rate term list — the same arithmetic as `evaluateRateTerms`. */
export function rateFormulaFromTerms(
  terms: readonly FormulaTerm[],
  refFor: (term: FormulaTerm, index: number) => string | null,
): string {
  const factors: string[] = [];
  terms.forEach((term, i) => {
    if (term.cellRole === "rate" || term.cellRole === "factor")
      factors.push(refFor(term, i) ?? String(term.value));
  });
  return `ROUND(${factors.join("*")},0)`;
}

function styleHeader(row: ExcelJS.Row): void {
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E5DC" },
    };
  });
}

function blockLabel(block: RomPricedBlock): string {
  return `${block.kind === "release" ? "Release" : "Foundation"} ${block.code}`;
}

/** Build the workbook and the addresses of its key results. */
export function buildRomWorkbook(rom: RomResult): {
  workbook: ExcelJS.Workbook;
  layout: RomWorkbookLayout;
} {
  const { structure } = rom;
  const wb = new ExcelJS.Workbook();
  wb.creator = "AbarVa ROM service";
  wb.created = new Date(0);
  wb.modified = new Date(0);
  wb.calcProperties.fullCalcOnLoad = true;

  const est = wb.addWorksheet(ROM_WORKBOOK_SHEETS.estimate);
  const lib = wb.addWorksheet(ROM_WORKBOOK_SHEETS.library);
  const podWs = wb.addWorksheet(ROM_WORKBOOK_SHEETS.pod);
  const rel = wb.addWorksheet(ROM_WORKBOOK_SHEETS.releases);
  const asm = wb.addWorksheet(ROM_WORKBOOK_SHEETS.assumptions);
  const A = (address: string) =>
    sheetRef(ROM_WORKBOOK_SHEETS.assumptions, address);

  // ---- Assumptions: program factors and range bands (rows fixed) ----------
  styleHeader(asm.addRow(["Input", "Value", "Unit", "Source", "Confidence"]));
  asm.addRow([
    "Friction factor",
    structure.friction.value,
    "multiplier",
    text(structure.friction.source),
    "",
  ]); // B2
  asm.addRow([
    "Productive share",
    structure.productiveShare.value,
    "share of paid hours",
    text(structure.productiveShare.source),
    "",
  ]); // B3
  asm.addRow([
    "Hours per FTE-week",
    structure.hoursPerFteWeek.value,
    "paid hours",
    text(structure.hoursPerFteWeek.source),
    "",
  ]); // B4
  const FRICTION = "$B$2";
  const SHARE = "$B$3";
  const HPW = "$B$4";
  asm.addRow([
    "Rate basis",
    rom.pod.rateBasis,
    "",
    "ROM structure (caller)",
    "",
  ]);
  asm.addRow([
    "Delivery location",
    text(new Set(rom.pod.members.map((member) => member.locationCode)).size > 1
      ? "Mixed by member — see Pod & Rates"
      : rom.pod.locationCode),
    "",
    "cost foundation: pricing_delivery_locations",
    "",
  ]);
  asm.addRow([
    "Provider class",
    text(new Set(rom.pod.members.map((member) => member.providerClassCode ?? "")).size > 1
      ? "Mixed by member — see Pod & Rates"
      : rom.pod.providerClassCode ?? "(rate band benchmark)"),
    "",
    "cost foundation: pricing_provider_classes",
    "",
  ]);
  asm.addRow(["Pod", text(rom.pod.podCode), "", text(rom.pod.source), ""]);
  asm.addRow([
    "AI productivity credit",
    rom.aiAssisted ? "none in the estimate; see the AI-Assisted Scenario sheet" : "none applied",
    "",
    "ROM policy: no credit in the estimate; a sourced scenario is priced beside it",
    "",
  ]);
  asm.addRow([
    "Rate approval status",
    (rom.foundation?.priced.pod.memberLines ?? rom.releases[0]?.own.pod.memberLines ?? [])
      .some((line) => line.rate.notes.some((note) => note.includes("global_starter_unapproved")))
      ? "planning rates, not approved" : "See each rate source and approval status",
    "",
    "Review every role band and delivery mapping before estimate approval",
    "",
  ]);

  const pricedBlocks: {
    block: RomPricedBlock;
    hoursBlocks: readonly RomHoursBlock[];
  }[] = [
    ...rom.releases.map((r) => ({ block: r.own, hoursBlocks: r.useCases })),
    ...(rom.foundation
      ? [{ block: rom.foundation.priced, hoursBlocks: [rom.foundation.hours] }]
      : []),
  ];
  const rangeCells = new Map<string, { low: string; high: string }>();
  for (const { block } of pricedBlocks) {
    const r = block.range;
    const source =
      r.basis === "named"
        ? `ROM policy ${r.policyCode}: not-designed band`
        : `pricing_range_policies:${r.policyCode} (score ${r.score} of 10)`;
    asm.addRow([
      `${blockLabel(block)} design status`,
      block.designStatus,
      "",
      "ROM structure (caller)",
      "",
    ]);
    const low = asm.addRow([
      `${blockLabel(block)} range low`,
      r.lowMultiplier,
      "multiplier",
      source,
      "",
    ]).number;
    const high = asm.addRow([
      `${blockLabel(block)} range high`,
      r.highMultiplier,
      "multiplier",
      source,
      "",
    ]).number;
    rangeCells.set(`${block.kind}:${block.code}`, {
      low: `$B$${low}`,
      high: `$B$${high}`,
    });
  }

  // ---- Component Library ---------------------------------------------------
  styleHeader(
    lib.addRow(["Driver", "Label", "Unit hours", "Source", "Confidence"]),
  );
  const libraryCell = new Map<string, string>();
  for (const driver of ROM_DRIVERS) {
    const uh = structure.unitHours[driver];
    if (!uh) continue;
    const row = lib.addRow([
      driver,
      ROM_DRIVER_LABELS[driver],
      uh.value,
      text(uh.source),
      uh.confidence,
    ]).number;
    libraryCell.set(driver, `$C$${row}`);
    asm.addRow([
      `Unit hours: ${driver}`,
      null,
      "hours per unit",
      text(uh.source),
      uh.confidence,
    ]);
    setFormula(
      asm,
      `B${asm.rowCount}`,
      sheetRef(ROM_WORKBOOK_SHEETS.library, `$C$${row}`),
      uh.value,
    );
  }

  // ---- Pod & Rates ---------------------------------------------------------
  styleHeader(
    podWs.addRow([
      "#",
      "Role",
      "Level",
      "Location",
      "Provider class",
      "FTE",
      "Base rate (cents)",
      "Base rate source",
      "Location multiplier",
      "Location source",
      "Provider multiplier",
      "Provider source",
      "Hourly rate (cents)",
      "Hourly rate ($)",
      "Rate basis",
      "Role mapping",
      "Rate provenance",
      "Notes",
    ]),
  );
  const firstPriced = pricedBlocks[0].block.pod;
  const podRows: { fte: string; rate: string }[] = [];
  firstPriced.memberLines.forEach((line, i) => {
    const rate = line.rate;
    const row = podWs.addRow([
      i + 1,
      text(line.member.roleCode),
      text(line.member.levelCode),
      text(line.member.locationCode),
      text(line.member.providerClassCode ?? ""),
      line.member.fte,
      rate.baseRateCents,
      text(rate.baseSource),
      rate.location.value,
      text(
        rate.location.notAppliedReason
          ? `${rate.location.source} (not applied: ${rate.location.notAppliedReason})`
          : rate.location.source,
      ),
      rate.provider.value,
      text(
        rate.provider.notAppliedReason
          ? `${rate.provider.source} (not applied: ${rate.provider.notAppliedReason})`
          : rate.provider.source,
      ),
      null,
      null,
      rate.basis,
      MAPPING_LABEL[rom.pod.memberMappingStatus[i]],
      text(rate.trace),
      text([...rate.notes, ...(rate.notes.some((note) => note.includes("global_starter_unapproved"))
        ? ["planning rates, not approved"] : [])].join("; ")),
    ]).number;
    // rate terms: base (rate), location (factor), provider (factor), result.
    const refs = [`G${row}`, `I${row}`, `K${row}`];
    let next = 0;
    setFormula(
      podWs,
      `M${row}`,
      rateFormulaFromTerms(rate.rateTerms, () => refs[next++] ?? null),
      rate.hourlyRateCents,
    );
    setFormula(podWs, `N${row}`, `M${row}/100`, rate.hourlyRateCents / 100);
    podRows.push({
      fte: sheetRef(ROM_WORKBOOK_SHEETS.pod, `$F$${row}`),
      rate: sheetRef(ROM_WORKBOOK_SHEETS.pod, `$M$${row}`),
    });
  });
  const fteTotalRow = podWs.addRow(["Total FTE", "", "", "", "", null]).number;
  setFormula(
    podWs,
    `F${fteTotalRow}`,
    `ROUND(SUM(F2:F${fteTotalRow - 1}),4)`,
    firstPriced.totalFte,
  );
  const TOTAL_FTE = sheetRef(ROM_WORKBOOK_SHEETS.pod, `$F$${fteTotalRow}`);

  // ---- Estimate: hours lines -----------------------------------------------
  est.addRow(["ROM estimate — live formulas"]).font = { bold: true, size: 14 };
  est.addRow([
    "Hours = count × unit hours × friction. Weeks = CEILING(hours ÷ (FTE × hours per FTE-week × productive share)). " +
      "Cost = FTE × weeks × hours per FTE-week × rate. Cached values equal the engine output; money is in cents.",
  ]);
  est.addRow([]);
  styleHeader(
    est.addRow([
      "Block",
      "Code",
      "Release",
      "Driver",
      "Count",
      "Unit hours",
      "Friction",
      "Hours",
      "Unit-hours source",
      "Confidence",
    ]),
  );

  const blockHoursCell = new Map<string, string>();
  const allHoursBlocks: RomHoursBlock[] = [
    ...rom.releases.flatMap((r) => r.useCases),
    ...(rom.foundation ? [rom.foundation.hours] : []),
  ];
  const lineRange = new Map<string, { first: number; last: number }>();
  const countCell = new Map<string, string>();
  for (const block of allHoursBlocks) {
    let first = 0;
    for (const line of block.lines) {
      const row = est.addRow([
        block.kind === "use_case" ? "Use case" : "Foundation",
        text(block.code),
        text(block.releaseCode ?? "shared"),
        line.driver,
        line.count,
        null,
        null,
        null,
        text(line.unitHours.source),
        line.unitHours.confidence,
      ]).number;
      if (first === 0) first = row;
      countCell.set(`${block.kind}:${block.code}:${line.driver}`, sheetRef(ROM_WORKBOOK_SHEETS.estimate, `$E$${row}`));
      const libRef = sheetRef(
        ROM_WORKBOOK_SHEETS.library,
        libraryCell.get(line.driver) as string,
      );
      setFormula(est, `F${row}`, libRef, line.unitHours.value);
      setFormula(est, `G${row}`, A(FRICTION), line.friction);
      const formula = hoursFormulaFromTerms(line.formulaTerms, (term) =>
        term.cellRole === "count"
          ? `E${row}`
          : term.cellRole === "unit_hours"
            ? `F${row}`
            : term.cellRole === "factor"
              ? `G${row}`
              : null,
      );
      setFormula(est, `H${row}`, formula, line.hours);
      asm.addRow([
        `Count: ${block.code} ${line.driver}`,
        null,
        "units",
        "ROM structure (caller)",
        "",
      ]);
      setFormula(
        asm,
        `B${asm.rowCount}`,
        sheetRef(ROM_WORKBOOK_SHEETS.estimate, `$E$${row}`),
        line.count,
      );
    }
    lineRange.set(`${block.kind}:${block.code}`, { first, last: est.rowCount });
  }

  est.addRow([]);
  styleHeader(
    est.addRow(["Block hours", "Code", "Release", "", "", "", "", "Hours"]),
  );
  for (const block of allHoursBlocks) {
    const range = lineRange.get(`${block.kind}:${block.code}`) as {
      first: number;
      last: number;
    };
    const row = est.addRow([
      block.kind === "use_case" ? "Use case" : "Foundation",
      text(block.code),
      text(block.releaseCode ?? "shared"),
    ]).number;
    setFormula(
      est,
      `H${row}`,
      `ROUND(SUM(H${range.first}:H${range.last}),4)`,
      block.hours,
    );
    blockHoursCell.set(`${block.kind}:${block.code}`, `H${row}`);
  }

  // ---- Estimate: pod pricing per block -------------------------------------
  const layoutCells = new Map<string, RomWorkbookBlockCells>();
  for (const { block, hoursBlocks } of pricedBlocks) {
    const priced = block.pod;
    est.addRow([]);
    styleHeader(
      est.addRow([
        `Pod pricing — ${blockLabel(block)}`,
        text(block.name),
        block.designStatus,
      ]),
    );
    const hoursRow = est.addRow(["Adjusted hours"]).number;
    setFormula(
      est,
      `B${hoursRow}`,
      `ROUND(${hoursBlocks.map((h) => blockHoursCell.get(`${h.kind}:${h.code}`)).join("+")},4)`,
      block.hours,
    );
    const paidNeededRow = est.addRow([
      "Paid hours needed (adjusted ÷ productive share)",
    ]).number;
    setFormula(
      est,
      `B${paidNeededRow}`,
      `B${hoursRow}/${A(SHARE)}`,
      block.hours / structure.productiveShare.value,
    );
    const fteRow = est.addRow(["Total FTE"]).number;
    setFormula(est, `B${fteRow}`, TOTAL_FTE, priced.totalFte);
    const phwRow = est.addRow(["Productive hours per pod-week"]).number;
    setFormula(
      est,
      `B${phwRow}`,
      `ROUND(B${fteRow}*${A(HPW)}*${A(SHARE)},4)`,
      priced.productiveHoursPerWeek,
    );
    const weeksRow = est.addRow(["Weeks (whole pod-weeks)"]).number;
    const ratio = `B${hoursRow}/B${phwRow}`;
    setFormula(
      est,
      `B${weeksRow}`,
      `IF(ABS(${ratio}-ROUND(${ratio},0))<=1E-9,ROUND(${ratio},0),CEILING(${ratio},1))`,
      priced.weeks,
    );
    styleHeader(
      est.addRow([
        "Member",
        "Role",
        "Level",
        "FTE",
        "Weeks",
        "Hours per FTE-week",
        "Paid hours",
        "Rate (cents)",
        "Cost (cents)",
        "Role mapping",
      ]),
    );
    let firstMember = 0;
    priced.memberLines.forEach((line, i) => {
      const row = est.addRow([
        i + 1,
        text(line.member.roleCode),
        text(line.member.levelCode),
        null,
        null,
        null,
        null,
        null,
        null,
        MAPPING_LABEL[rom.pod.memberMappingStatus[i]],
      ]).number;
      if (firstMember === 0) firstMember = row;
      setFormula(est, `D${row}`, podRows[i].fte, line.member.fte);
      setFormula(est, `E${row}`, `$B$${weeksRow}`, priced.weeks);
      setFormula(est, `F${row}`, A(HPW), priced.hoursPerFteWeek);
      // member terms: FTE (count), weeks (count), hours per FTE-week (unit_hours), paid hours, rate, cost.
      const refs = [`D${row}`, `E${row}`, `F${row}`];
      setFormula(
        est,
        `G${row}`,
        hoursFormulaFromTerms(
          line.formulaTerms,
          (_t, idx) => refs[idx] ?? null,
        ),
        line.paidHours,
      );
      setFormula(est, `H${row}`, podRows[i].rate, line.rate.hourlyRateCents);
      setFormula(est, `I${row}`, `ROUND(G${row}*H${row},0)`, line.costCents);
    });
    const lastMember = est.rowCount;
    const planRow = est.addRow(["Plan cost (cents)"]).number;
    setFormula(
      est,
      `B${planRow}`,
      `SUM(I${firstMember}:I${lastMember})`,
      priced.totalCostCents,
    );
    const bands = rangeCells.get(`${block.kind}:${block.code}`) as {
      low: string;
      high: string;
    };
    const lowMultRow = est.addRow(["Range low multiplier"]).number;
    setFormula(est, `B${lowMultRow}`, A(bands.low), block.range.lowMultiplier);
    const highMultRow = est.addRow(["Range high multiplier"]).number;
    setFormula(
      est,
      `B${highMultRow}`,
      A(bands.high),
      block.range.highMultiplier,
    );
    const lowRow = est.addRow(["Low (cents)"]).number;
    setFormula(
      est,
      `B${lowRow}`,
      `ROUND(B${planRow}*B${lowMultRow},0)`,
      block.range.lowCents,
    );
    const highRow = est.addRow(["High (cents)"]).number;
    setFormula(
      est,
      `B${highRow}`,
      `ROUND(B${planRow}*B${highMultRow},0)`,
      block.range.highCents,
    );
    layoutCells.set(`${block.kind}:${block.code}`, {
      hours: `B${hoursRow}`,
      weeks: `B${weeksRow}`,
      lowCents: `B${lowRow}`,
      planCents: `B${planRow}`,
      highCents: `B${highRow}`,
    });
  }
  const E = (address: string) =>
    sheetRef(ROM_WORKBOOK_SHEETS.estimate, address);

  // ---- Releases ------------------------------------------------------------
  styleHeader(
    rel.addRow([
      "Release",
      "Name",
      "Design status",
      "Use cases",
      "Hours",
      "Weeks",
      "Low (cents)",
      "Plan (cents)",
      "High (cents)",
      "Shares foundation",
      "Standalone plan (cents)",
      "Low ($)",
      "Plan ($)",
      "High ($)",
    ]),
  );
  const writeDollars = (
    row: number,
    low: number,
    plan: number,
    high: number,
  ) => {
    setFormula(rel, `L${row}`, `G${row}/100`, low / 100);
    setFormula(rel, `M${row}`, `H${row}/100`, plan / 100);
    setFormula(rel, `N${row}`, `I${row}/100`, high / 100);
  };
  const foundationRowNumber = rom.foundation ? 2 + rom.releases.length : null;
  const releaseRows: number[] = [];
  const layoutReleases: Record<string, RomWorkbookBlockCells> = {};
  for (const r of rom.releases) {
    const cells = layoutCells.get(`release:${r.code}`) as RomWorkbookBlockCells;
    layoutReleases[r.code] = cells;
    const row = rel.addRow([
      text(r.code),
      text(r.name),
      r.designStatus,
      text(r.useCases.map((u) => u.code).join(", ")),
      null,
      null,
      null,
      null,
      null,
      r.sharesFoundation ? "yes" : "no",
    ]).number;
    releaseRows.push(row);
    setFormula(rel, `E${row}`, E(cells.hours), r.own.hours);
    setFormula(rel, `F${row}`, E(cells.weeks), r.own.weeks);
    setFormula(rel, `G${row}`, E(cells.lowCents), r.own.range.lowCents);
    setFormula(rel, `H${row}`, E(cells.planCents), r.own.range.planCents);
    setFormula(rel, `I${row}`, E(cells.highCents), r.own.range.highCents);
    setFormula(
      rel,
      `K${row}`,
      r.sharesFoundation && foundationRowNumber
        ? `H${row}+H${foundationRowNumber}`
        : `H${row}`,
      r.standalone.planCents,
    );
    writeDollars(
      row,
      r.own.range.lowCents,
      r.own.range.planCents,
      r.own.range.highCents,
    );
  }
  let foundationCells: RomWorkbookBlockCells | null = null;
  if (rom.foundation && foundationRowNumber) {
    const f = rom.foundation.priced;
    foundationCells = layoutCells.get(
      `foundation:${f.code}`,
    ) as RomWorkbookBlockCells;
    const row = rel.addRow([
      text(f.code),
      text(f.name),
      `foundation (${f.designStatus})`,
      text(`shared by ${rom.foundation.sharedByReleaseCodes.join(", ")}`),
      null,
      null,
      null,
      null,
      null,
      "counted once",
    ]).number;
    setFormula(rel, `E${row}`, E(foundationCells.hours), f.hours);
    setFormula(rel, `F${row}`, E(foundationCells.weeks), f.weeks);
    setFormula(rel, `G${row}`, E(foundationCells.lowCents), f.range.lowCents);
    setFormula(rel, `H${row}`, E(foundationCells.planCents), f.range.planCents);
    setFormula(rel, `I${row}`, E(foundationCells.highCents), f.range.highCents);
    writeDollars(row, f.range.lowCents, f.range.planCents, f.range.highCents);
  }
  const firstRel = releaseRows[0];
  const lastRel = releaseRows[releaseRows.length - 1];
  const plusFoundation = (col: string) =>
    foundationRowNumber ? `+${col}${foundationRowNumber}` : "";
  const totalRow = rel.addRow(["Total", "releases + foundation once"]).number;
  rel.getRow(totalRow).font = { bold: true };
  setFormula(
    rel,
    `E${totalRow}`,
    `ROUND(SUM(E${firstRel}:E${lastRel})${plusFoundation("E")},4)`,
    rom.total.hours,
  );
  setFormula(
    rel,
    `G${totalRow}`,
    `SUM(G${firstRel}:G${lastRel})${plusFoundation("G")}`,
    rom.total.lowCents,
  );
  setFormula(
    rel,
    `H${totalRow}`,
    `SUM(H${firstRel}:H${lastRel})${plusFoundation("H")}`,
    rom.total.planCents,
  );
  setFormula(
    rel,
    `I${totalRow}`,
    `SUM(I${firstRel}:I${lastRel})${plusFoundation("I")}`,
    rom.total.highCents,
  );
  writeDollars(
    totalRow,
    rom.total.lowCents,
    rom.total.planCents,
    rom.total.highCents,
  );

  let naiveCell: string | null = null;
  if (rom.foundation) {
    const naiveRow = rel.addRow([
      "Sum of standalone plans",
      "foundation counted in every release that shares it",
    ]).number;
    setFormula(
      rel,
      `K${naiveRow}`,
      `SUM(K${firstRel}:K${lastRel})`,
      rom.total.naiveSumCents,
    );
    const savedRow = rel.addRow([
      "Double count avoided",
      "standalone sum − total",
    ]).number;
    setFormula(
      rel,
      `K${savedRow}`,
      `K${naiveRow}-H${totalRow}`,
      rom.total.naiveSumCents - rom.total.planCents,
    );
    naiveCell = `K${naiveRow}`;
  }

  const aiLayout = rom.aiAssisted
    ? writeAiAssistedSheet(wb, rom, {
        libraryCell,
        countCell,
        podRows,
        totalFte: TOTAL_FTE,
        friction: A(FRICTION),
        share: A(SHARE),
        hpw: A(HPW),
        rangeCells: new Map([...rangeCells].map(([k, v]) => [k, { low: A(v.low), high: A(v.high) }])),
        estimatePlan: sheetRef(ROM_WORKBOOK_SHEETS.releases, `$H$${totalRow}`),
      })
    : null;

  // ── Check: the engine's own figures beside the formulas above. A reader
  // who changes an input sees the difference move off 0 here.
  const check = wb.addWorksheet(ROM_WORKBOOK_SHEETS.check);
  styleHeader(check.addRow(["Figure", "Engine", "Workbook", "Difference", "Absolute difference"]));
  const checks: { label: string; engine: number; sheet: string; address: string }[] = [];
  const blockChecks = (name: string, block: RomPricedBlock, cells: RomWorkbookBlockCells) => {
    checks.push(
      { label: `${name}: hours`, engine: block.hours, sheet: ROM_WORKBOOK_SHEETS.estimate, address: cells.hours },
      { label: `${name}: weeks`, engine: block.weeks, sheet: ROM_WORKBOOK_SHEETS.estimate, address: cells.weeks },
      { label: `${name}: low (cents)`, engine: block.range.lowCents, sheet: ROM_WORKBOOK_SHEETS.estimate, address: cells.lowCents },
      { label: `${name}: plan (cents)`, engine: block.range.planCents, sheet: ROM_WORKBOOK_SHEETS.estimate, address: cells.planCents },
      { label: `${name}: high (cents)`, engine: block.range.highCents, sheet: ROM_WORKBOOK_SHEETS.estimate, address: cells.highCents },
    );
  };
  for (const release of rom.releases) blockChecks(text(release.name), release.own, layoutReleases[release.code]!);
  if (rom.foundation && foundationCells) blockChecks(text(rom.foundation.priced.name), rom.foundation.priced, foundationCells);
  checks.push(
    { label: "Total: hours", engine: rom.total.hours, sheet: ROM_WORKBOOK_SHEETS.releases, address: `E${totalRow}` },
    { label: "Total: low (cents)", engine: rom.total.lowCents, sheet: ROM_WORKBOOK_SHEETS.releases, address: `G${totalRow}` },
    { label: "Total: plan (cents)", engine: rom.total.planCents, sheet: ROM_WORKBOOK_SHEETS.releases, address: `H${totalRow}` },
    { label: "Total: high (cents)", engine: rom.total.highCents, sheet: ROM_WORKBOOK_SHEETS.releases, address: `I${totalRow}` },
  );
  if (rom.aiAssisted && aiLayout) {
    const ai = rom.aiAssisted;
    checks.push(
      { label: "AI-assisted scenario: hours", engine: ai.total.hours, sheet: ROM_WORKBOOK_SHEETS.aiAssisted, address: aiLayout.hours },
      { label: "AI-assisted scenario: weeks", engine: ai.total.weeks, sheet: ROM_WORKBOOK_SHEETS.aiAssisted, address: aiLayout.weeks },
      { label: "AI-assisted scenario: tool cost (cents)", engine: ai.toolCostCents, sheet: ROM_WORKBOOK_SHEETS.aiAssisted, address: aiLayout.toolCostCents },
      { label: "AI-assisted scenario: plan (cents)", engine: ai.total.planCents, sheet: ROM_WORKBOOK_SHEETS.aiAssisted, address: aiLayout.planCents },
    );
  }
  checks.forEach((entry, i) => {
    const r = 2 + i;
    check.getCell(`A${r}`).value = entry.label;
    check.getCell(`B${r}`).value = entry.engine;
    setFormula(check, `C${r}`, sheetRef(entry.sheet, entry.address), entry.engine);
    setFormula(check, `D${r}`, `C${r}-B${r}`, 0);
    setFormula(check, `E${r}`, `ABS(D${r})`, 0);
  });
  const checkTotalRow = 2 + checks.length + 1;
  check.getCell(`A${checkTotalRow}`).value = "Total absolute difference (0 when the workbook matches the engine)";
  check.getCell(`A${checkTotalRow}`).font = { bold: true };
  setFormula(check, `E${checkTotalRow}`, `SUM(E2:E${checkTotalRow - 2})`, 0);
  check.getCell(`E${checkTotalRow}`).font = { bold: true };

  for (const ws of [est, lib, podWs, rel, asm, check]) {
    ws.columns.forEach((col) => {
      col.width = 18;
    });
  }
  check.getColumn(1).width = 52;
  for (const [column, width] of [
    [1, 6], [2, 17], [3, 12], [4, 23], [5, 17], [6, 8],
    [8, 52], [10, 44], [12, 44], [16, 27], [17, 62], [18, 58],
  ] as const) podWs.getColumn(column).width = width;
  for (const row of podWs.getRows(1, podWs.rowCount) ?? []) {
    row.height = row.number === 1 ? 32 : 96;
    for (const column of [8, 10, 12, 16, 17, 18]) {
      row.getCell(column).alignment = { vertical: "top", wrapText: true };
    }
  }
  asm.getColumn(1).width = 46;
  asm.getColumn(2).width = 40;
  asm.getColumn(4).width = 68;

  return {
    workbook: wb,
    layout: {
      releases: layoutReleases,
      foundation: foundationCells,
      total: {
        hours: `E${totalRow}`,
        lowCents: `G${totalRow}`,
        planCents: `H${totalRow}`,
        highCents: `I${totalRow}`,
        naiveSumCents: naiveCell,
      },
      aiAssisted: aiLayout,
      check: { totalAbsoluteDifference: `E${checkTotalRow}`, rows: checks.length },
    },
  };
}

/** Whole periods with the engine's float tolerance (`wholePeriods`): IF(ratio is within 1E-9 of N, N, CEILING). */
function wholePeriodsFormula(ratio: string): string {
  return `IF(ABS(${ratio}-ROUND(${ratio},0))<=1E-9,ROUND(${ratio},0),CEILING(${ratio},1))`;
}

/**
 * The AI-assisted scenario as live formulas: each driver's unit hours reduced
 * by its sourced factor, the same counts, friction, pod and rates as the
 * estimate, and each tool charged per seat per whole month of every block.
 * Every cell references the estimate's own inputs, so editing a count, a unit
 * hour, a reduction or a seat recomputes the scenario — never the estimate.
 */
function writeAiAssistedSheet(
  wb: ExcelJS.Workbook,
  rom: RomResult,
  refs: {
    libraryCell: Map<string, string>;
    countCell: Map<string, string>;
    podRows: { fte: string; rate: string }[];
    totalFte: string;
    friction: string;
    share: string;
    hpw: string;
    rangeCells: Map<string, { low: string; high: string }>;
    estimatePlan: string;
  },
): NonNullable<RomWorkbookLayout["aiAssisted"]> {
  const ai = rom.aiAssisted as NonNullable<RomResult["aiAssisted"]>;
  const ws = wb.addWorksheet(ROM_WORKBOOK_SHEETS.aiAssisted);
  ws.addRow([`AI-assisted scenario — ${text(ai.label)}`]).font = { bold: true, size: 14 };
  ws.addRow([
    "Scenario only: the Estimate, Releases and Assumptions sheets are the estimate and are unchanged. " +
      "Scenario unit hours = estimate unit hours × (1 − hours reduction). Tools are charged per seat per whole month of each block. Money in cents.",
  ]);
  ws.addRow([]);

  // Factors: one row per driver the estimate has unit hours for.
  styleHeader(ws.addRow(["Driver", "Label", "Estimate unit hours", "Hours reduction", "Scenario unit hours", "Reduction source", "Confidence"]));
  const scenarioUnit = new Map<string, string>();
  for (const driver of ROM_DRIVERS) {
    const libRef = refs.libraryCell.get(driver);
    if (!libRef) continue;
    const factor = ai.factors.find((f) => f.driver === driver);
    const base = rom.structure.unitHours[driver]?.value ?? 0;
    const reduction = factor?.hoursReduction ?? 0;
    const row = ws.addRow([
      driver,
      ROM_DRIVER_LABELS[driver],
      null,
      reduction,
      null,
      text(factor ? factor.source : "No reduction assumed"),
      factor ? factor.confidence : "",
    ]).number;
    setFormula(ws, `C${row}`, sheetRef(ROM_WORKBOOK_SHEETS.library, libRef), base);
    setFormula(ws, `E${row}`, `ROUND(C${row}*(1-D${row}),4)`, ai.structure.unitHours[driver]?.value ?? base);
    scenarioUnit.set(driver, `$E$${row}`);
  }

  ws.addRow([]);
  styleHeader(ws.addRow(["Tool", "Seats", "Monthly cost per seat (cents)", "Source"]));
  const toolRows: { seats: string; cost: string }[] = [];
  for (const tool of ai.structure.aiAssist?.tools ?? []) {
    const row = ws.addRow([text(tool.label), tool.seats, tool.monthlyCostCents, text(tool.source)]).number;
    toolRows.push({ seats: `$B$${row}`, cost: `$C$${row}` });
  }
  if (toolRows.length === 0) ws.addRow(["No tools assumed"]);

  // Blocks: hours from the reduced unit hours, then the estimate's pod and rates.
  const blocks = [
    ...ai.releases.map((r) => ({ block: r.own, hoursBlocks: r.useCases })),
    ...(ai.foundation ? [{ block: ai.foundation.priced, hoursBlocks: [ai.foundation.hours] }] : []),
  ];
  const blockTotals: { hours: string; weeks: string; tools: string; low: string; plan: string; high: string }[] = [];
  for (const { block, hoursBlocks } of blocks) {
    ws.addRow([]);
    styleHeader(ws.addRow([`Scenario — ${blockLabel(block)}`, text(block.name), block.designStatus]));
    const hoursCells: string[] = [];
    for (const hb of hoursBlocks) {
      const lineCells: string[] = [];
      for (const line of hb.lines) {
        const row = ws.addRow([`${text(hb.code)} ${line.driver}`, null, null, null, null]).number;
        setFormula(ws, `B${row}`, refs.countCell.get(`${hb.kind}:${hb.code}:${line.driver}`) as string, line.count);
        setFormula(ws, `C${row}`, scenarioUnit.get(line.driver) as string, line.unitHours.value);
        setFormula(ws, `D${row}`, refs.friction, line.friction);
        setFormula(
          ws,
          `E${row}`,
          hoursFormulaFromTerms(line.formulaTerms, (term) =>
            term.cellRole === "count" ? `B${row}` : term.cellRole === "unit_hours" ? `C${row}` : term.cellRole === "factor" ? `D${row}` : null,
          ),
          line.hours,
        );
        lineCells.push(`E${row}`);
      }
      const row = ws.addRow([`${text(hb.code)} hours`]).number;
      setFormula(ws, `E${row}`, `ROUND(${lineCells.length ? lineCells.join("+") : "0"},4)`, hb.hours);
      hoursCells.push(`E${row}`);
    }
    const hoursRow = ws.addRow(["Adjusted hours"]).number;
    setFormula(ws, `B${hoursRow}`, `ROUND(${hoursCells.join("+")},4)`, block.hours);
    const phwRow = ws.addRow(["Productive hours per pod-week"]).number;
    setFormula(ws, `B${phwRow}`, `ROUND(${refs.totalFte}*${refs.hpw}*${refs.share},4)`, block.pod.productiveHoursPerWeek);
    const weeksRow = ws.addRow(["Weeks (whole pod-weeks)"]).number;
    setFormula(ws, `B${weeksRow}`, wholePeriodsFormula(`B${hoursRow}/B${phwRow}`), block.weeks);
    const memberCells: string[] = [];
    block.pod.memberLines.forEach((line, i) => {
      const row = ws.addRow([`Member ${i + 1} ${text(line.member.roleCode)}`, null, null, null, null, null]).number;
      setFormula(ws, `B${row}`, refs.podRows[i].fte, line.member.fte);
      setFormula(ws, `C${row}`, `$B$${weeksRow}`, block.weeks);
      setFormula(ws, `D${row}`, refs.hpw, block.pod.hoursPerFteWeek);
      const memberRefs = [`B${row}`, `C${row}`, `D${row}`];
      setFormula(ws, `E${row}`, hoursFormulaFromTerms(line.formulaTerms, (_t, idx) => memberRefs[idx] ?? null), line.paidHours);
      setFormula(ws, `F${row}`, `ROUND(E${row}*${refs.podRows[i].rate},0)`, line.costCents);
      memberCells.push(`F${row}`);
    });
    const toolCells: string[] = [];
    block.pod.toolLicenceLines.forEach((line, i) => {
      const tr = toolRows[i];
      const row = ws.addRow([`Tool ${text(line.licence.label)}`, null, null, null, null, null]).number;
      setFormula(ws, `B${row}`, wholePeriodsFormula(`$B$${weeksRow}/(52/12)`), line.periods);
      setFormula(ws, `C${row}`, `ROUND(B${row}*${tr.seats},4)`, Math.round(line.periods * line.licence.quantity * 10000) / 10000);
      setFormula(ws, `F${row}`, `ROUND(C${row}*${tr.cost},0)`, line.costCents);
      toolCells.push(`F${row}`);
    });
    const toolRow = ws.addRow(["Tool cost (cents)"]).number;
    setFormula(ws, `B${toolRow}`, toolCells.length ? toolCells.join("+") : "0", block.pod.toolLicenceCostCents);
    const planRow = ws.addRow(["Plan cost (cents)"]).number;
    setFormula(ws, `B${planRow}`, `${memberCells.join("+")}+B${toolRow}`, block.pod.totalCostCents);
    const bands = refs.rangeCells.get(`${block.kind}:${block.code}`) as { low: string; high: string };
    const lowRow = ws.addRow(["Low (cents)"]).number;
    setFormula(ws, `B${lowRow}`, `ROUND(B${planRow}*${bands.low},0)`, block.range.lowCents);
    const highRow = ws.addRow(["High (cents)"]).number;
    setFormula(ws, `B${highRow}`, `ROUND(B${planRow}*${bands.high},0)`, block.range.highCents);
    blockTotals.push({ hours: `B${hoursRow}`, weeks: `B${weeksRow}`, tools: `B${toolRow}`, low: `B${lowRow}`, plan: `B${planRow}`, high: `B${highRow}` });
  }

  ws.addRow([]);
  styleHeader(ws.addRow(["Scenario total", "", "releases + foundation once"]));
  const sum = (key: keyof (typeof blockTotals)[number]) => blockTotals.map((b) => b[key]).join("+");
  const totalHours = ws.addRow(["Hours"]).number;
  setFormula(ws, `B${totalHours}`, `ROUND(${sum("hours")},4)`, ai.total.hours);
  const totalWeeks = ws.addRow(["Weeks"]).number;
  setFormula(ws, `B${totalWeeks}`, sum("weeks"), ai.total.weeks);
  const totalTools = ws.addRow(["Tool cost (cents)"]).number;
  setFormula(ws, `B${totalTools}`, sum("tools"), ai.toolCostCents);
  const totalLow = ws.addRow(["Low (cents)"]).number;
  setFormula(ws, `B${totalLow}`, sum("low"), ai.total.lowCents);
  const totalPlan = ws.addRow(["Plan (cents)"]).number;
  setFormula(ws, `B${totalPlan}`, sum("plan"), ai.total.planCents);
  const totalHigh = ws.addRow(["High (cents)"]).number;
  setFormula(ws, `B${totalHigh}`, sum("high"), ai.total.highCents);
  const versus = ws.addRow(["Plan versus the estimate (cents)", "", "scenario − estimate (Releases sheet total)"]).number;
  setFormula(ws, `B${versus}`, `B${totalPlan}-${refs.estimatePlan}`, ai.versusEstimate.planCents);
  ws.getColumn(1).width = 42;
  for (const c of [2, 3, 4, 5]) ws.getColumn(c).width = 18;
  ws.getColumn(6).width = 60;

  return {
    hours: `B${totalHours}`,
    weeks: `B${totalWeeks}`,
    toolCostCents: `B${totalTools}`,
    lowCents: `B${totalLow}`,
    planCents: `B${totalPlan}`,
    highCents: `B${totalHigh}`,
    versusEstimatePlanCents: `B${versus}`,
  };
}

/** The workbook as xlsx bytes. */
export async function romWorkbookBuffer(rom: RomResult): Promise<Buffer> {
  const { workbook } = buildRomWorkbook(rom);
  const bytes = await workbook.xlsx.writeBuffer();
  return Buffer.from(bytes as ArrayBuffer);
}
