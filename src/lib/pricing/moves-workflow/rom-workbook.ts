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
    text(rom.pod.locationCode),
    "",
    "cost foundation: pricing_delivery_locations",
    "",
  ]);
  asm.addRow([
    "Provider class",
    text(rom.pod.providerClassCode ?? "(rate band benchmark)"),
    "",
    "cost foundation: pricing_provider_classes",
    "",
  ]);
  asm.addRow(["Pod", text(rom.pod.podCode), "", text(rom.pod.source), ""]);
  asm.addRow([
    "AI productivity credit",
    "none applied",
    "",
    "ROM policy: no credit unless explicitly requested",
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
      text(rate.notes.join("; ")),
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

  for (const ws of [est, lib, podWs, rel, asm]) {
    ws.columns.forEach((col) => {
      col.width = 18;
    });
  }

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
    },
  };
}

/** The workbook as xlsx bytes. */
export async function romWorkbookBuffer(rom: RomResult): Promise<Buffer> {
  const { workbook } = buildRomWorkbook(rom);
  const bytes = await workbook.xlsx.writeBuffer();
  return Buffer.from(bytes as ArrayBuffer);
}
