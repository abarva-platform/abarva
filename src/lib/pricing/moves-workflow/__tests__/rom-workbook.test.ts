/**
 * ROM workbook — the formula cells evaluate to the engine's values.
 *
 * The workbook is written to xlsx bytes and read back, then EVERY formula
 * cell is recomputed by a small evaluator in this file (ROUND, SUM, CEILING,
 * IF, ABS, + - * /, comparisons, cross-sheet references), reading the
 * formulas themselves — never the cached results — and compared with the
 * cached result the builder wrote and with the engine output. A second test
 * edits an input cell and recomputes, proving the formulas are live: the
 * workbook's new total equals a fresh engine run on the edited structure.
 *
 * Synthetic counts, invented unit hours and synthetic reference rows only.
 */
import ExcelJS from "exceljs";
import {
  computeRom,
  type RomReferenceLoaders,
  type RomResult,
  type RomStructure,
} from "../rom-service";
import {
  buildRomWorkbook,
  hoursFormulaFromTerms,
  ROM_WORKBOOK_SHEETS,
  romWorkbookBuffer,
} from "../rom-workbook";

// ---------------------------------------------------------------------------
// Fixture (same synthetic case as rom-service.test.ts)
// ---------------------------------------------------------------------------

function band(code: string, role: string, level: string, loaded: number) {
  return {
    rate_band_code: code,
    role_code: role,
    level_code: level,
    currency: "USD",
    rate_basis: "onshore_si_t1_benchmark",
    loaded_rate: loaded,
    scarcity_adj_rate: loaded,
    indicative_bill_rate: loaded,
    confidence: "test",
    approval_status: "synthetic",
  };
}

const LOADERS: RomReferenceLoaders = {
  loadRateReference: () => ({
    rateBands: [
      band("ROL-T01-LVL-T1", "ROL-T01", "LVL-T1", 100),
      band("ROL-T02-LVL-T2", "ROL-T02", "LVL-T2", 70),
    ],
    locations: [
      {
        location_code: "LOC-TEST",
        shore_category: "onshore",
        salary_multiplier: 0.5,
        rate_multiplier: 1,
      },
    ],
    providerClasses: [{ provider_class_code: "SI-T1", tier_multiplier: 1.25 }],
  }),
  loadPodLibrary: () => ({ podTemplates: [], podTemplateRoles: [] }),
  loadRangePolicies: () => [
    {
      policy_code: "T-TIGHT",
      policy_name: "Tight",
      min_score: 0,
      max_score: 2,
      low_multiplier: 0.9,
      high_multiplier: 1.15,
    },
    {
      policy_code: "T-WIDE",
      policy_name: "Wide",
      min_score: 3,
      max_score: 10,
      low_multiplier: 0.6,
      high_multiplier: 1.6,
    },
  ],
};

const UNIT = (value: number) => ({
  value,
  source: "test: invented unit hours",
  confidence: "medium" as const,
});

function golden(): RomStructure {
  return {
    useCases: [
      {
        code: "UC-A",
        name: "=Use case A",
        counts: {
          data_source_count: 2,
          source_table_count: 10,
          standard_data_entity_count: 3,
          dashboard_view_count: 1,
          design_row_count: 40,
          validation_row_count: 20,
        },
      },
      {
        code: "UC-B",
        name: "Use case B",
        counts: {
          data_source_count: 1,
          source_table_count: 4,
          standard_data_entity_count: 2,
          dashboard_view_count: 5,
          design_row_count: 80,
          validation_row_count: 16,
        },
      },
    ],
    unitHours: {
      data_source_count: UNIT(16),
      source_table_count: UNIT(3),
      standard_data_entity_count: UNIT(12),
      dashboard_view_count: UNIT(20),
      design_row_count: UNIT(0.5),
      validation_row_count: UNIT(0.25),
    },
    releases: [
      {
        code: "R1",
        name: "=Release one",
        designStatus: "not_designed",
        useCaseCodes: ["UC-A"],
      },
      {
        code: "R2",
        name: "Release two",
        designStatus: "designed",
        useCaseCodes: ["UC-B"],
        rangeInputs: {
          scopeMaturity: "low",
          evidenceQuality: "low",
          deliveryNovelty: "low",
          quantityUncertainty: "low",
          rateCardCoveragePct: 95,
        },
      },
    ],
    foundation: {
      code: "F",
      name: "Shared foundation",
      designStatus: "not_designed",
      counts: {
        data_source_count: 3,
        source_table_count: 6,
        design_row_count: 10,
      },
    },
    pod: {
      members: [
        {
          roleCode: "ROL-T01",
          levelCode: "LVL-T1",
          fte: 1,
          proposedMapping: true,
        },
        { roleCode: "ROL-T02", levelCode: "LVL-T2", fte: 2 },
      ],
      locationCode: "LOC-TEST",
      rateBasis: "loaded_cost",
    },
    friction: { value: 1.1, source: "test: invented friction" },
    productiveShare: { value: 0.8, source: "test: invented share" },
    hoursPerFteWeek: { value: 40, source: "test: invented week" },
  };
}

function priced(structure: RomStructure): RomResult {
  const rom = computeRom(structure, LOADERS);
  if (!rom.ok) throw new Error(`${rom.code}: ${rom.message}`);
  return rom;
}

// ---------------------------------------------------------------------------
// A small formula evaluator over the read-back workbook
// ---------------------------------------------------------------------------

type Token =
  | { kind: "num"; value: number }
  | { kind: "ref"; sheet: string | null; cell: string }
  | { kind: "id"; value: string }
  | { kind: "op"; value: string };

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const cellRe = /^\$?([A-Z]{1,3})\$?(\d+)/;
  while (i < formula.length) {
    const rest = formula.slice(i);
    const ch = formula[i];
    if (ch === " ") {
      i += 1;
    } else if (ch === "'") {
      let j = i + 1;
      let name = "";
      while (j < formula.length) {
        if (formula[j] === "'" && formula[j + 1] === "'") {
          name += "'";
          j += 2;
        } else if (formula[j] === "'") break;
        else name += formula[j++];
      }
      const m = cellRe.exec(formula.slice(j + 2));
      if (formula[j + 1] !== "!" || !m)
        throw new Error(`bad sheet ref in ${formula}`);
      tokens.push({ kind: "ref", sheet: name, cell: `${m[1]}${m[2]}` });
      i = j + 2 + m[0].length;
    } else if (/^[A-Za-z]+!/.test(rest)) {
      const [, sheet] = /^([A-Za-z]+)!/.exec(rest)!;
      const m = cellRe.exec(rest.slice(sheet.length + 1))!;
      tokens.push({ kind: "ref", sheet, cell: `${m[1]}${m[2]}` });
      i += sheet.length + 1 + m[0].length;
    } else if (
      /^(\d+(\.\d+)?([eE][-+]?\d+)?)/.test(rest) &&
      !cellRe.test(rest)
    ) {
      const m = /^(\d+(\.\d+)?([eE][-+]?\d+)?)/.exec(rest)!;
      tokens.push({ kind: "num", value: Number(m[1]) });
      i += m[0].length;
    } else if (/^[A-Z]+\(/.test(rest)) {
      const m = /^([A-Z]+)\(/.exec(rest)!;
      tokens.push({ kind: "id", value: m[1] });
      i += m[1].length;
    } else if (cellRe.test(rest)) {
      const m = cellRe.exec(rest)!;
      tokens.push({ kind: "ref", sheet: null, cell: `${m[1]}${m[2]}` });
      i += m[0].length;
    } else if (/^(<=|>=|<>)/.test(rest)) {
      tokens.push({ kind: "op", value: rest.slice(0, 2) });
      i += 2;
    } else if ("+-*/(),:<>=".includes(ch)) {
      tokens.push({ kind: "op", value: ch });
      i += 1;
    } else {
      throw new Error(`cannot tokenize '${rest}' in ${formula}`);
    }
  }
  return tokens;
}

class Evaluator {
  private memo = new Map<string, number>();
  constructor(private readonly wb: ExcelJS.Workbook) {}

  cell(sheet: string, address: string): number {
    const key = `${sheet}!${address}`;
    const hit = this.memo.get(key);
    if (hit !== undefined) return hit;
    const ws = this.wb.getWorksheet(sheet);
    if (!ws) throw new Error(`no sheet ${sheet}`);
    const c = ws.getCell(address);
    let value: number;
    if (c.formula) {
      value = this.formula(c.formula, sheet);
    } else if (typeof c.value === "number") value = c.value;
    else if (c.value === null || c.value === undefined || c.value === "")
      value = 0;
    else throw new Error(`${key} is not numeric: ${JSON.stringify(c.value)}`);
    this.memo.set(key, value);
    return value;
  }

  formula(formula: string, sheet: string): number {
    const tokens = tokenize(formula);
    let pos = 0;
    const peek = () => tokens[pos];
    const isOp = (v: string) =>
      peek()?.kind === "op" && (peek() as { value: string }).value === v;
    const expect = (v: string) => {
      if (!isOp(v)) throw new Error(`expected ${v} in ${formula}`);
      pos += 1;
    };
    const rangeValues = (
      from: { sheet: string | null; cell: string },
      to: string,
    ): number[] => {
      const s = from.sheet ?? sheet;
      const [, c1, r1] = /([A-Z]+)(\d+)/.exec(from.cell)!;
      const [, c2, r2] = /([A-Z]+)(\d+)/.exec(to)!;
      if (c1 !== c2) throw new Error("only single-column ranges are used");
      const out: number[] = [];
      for (let r = Number(r1); r <= Number(r2); r += 1)
        out.push(this.cell(s, `${c1}${r}`));
      return out;
    };
    const args = (): (number | number[])[] => {
      expect("(");
      const list: (number | number[])[] = [];
      if (!isOp(")")) {
        for (;;) {
          const t = peek();
          if (
            t.kind === "ref" &&
            tokens[pos + 1]?.kind === "op" &&
            (tokens[pos + 1] as { value: string }).value === ":"
          ) {
            const to = tokens[pos + 2] as { kind: "ref"; cell: string };
            pos += 3;
            list.push(rangeValues(t, to.cell));
          } else list.push(comparison());
          if (isOp(",")) pos += 1;
          else break;
        }
      }
      expect(")");
      return list;
    };
    const excelRound = (x: number, digits: number) => {
      const f = 10 ** digits;
      return (Math.sign(x) * Math.round(Math.abs(x) * f)) / f;
    };
    const primary = (): number => {
      const t = peek();
      if (t.kind === "num") {
        pos += 1;
        return t.value;
      }
      if (t.kind === "ref") {
        pos += 1;
        return this.cell(t.sheet ?? sheet, t.cell);
      }
      if (t.kind === "id") {
        pos += 1;
        const a = args();
        const n = (v: number | number[]) =>
          Array.isArray(v) ? v.reduce((x, y) => x + y, 0) : v;
        switch (t.value) {
          case "ROUND":
            return excelRound(n(a[0]), n(a[1]));
          case "SUM":
            return a.reduce<number>((acc, v) => acc + n(v), 0);
          case "CEILING":
            return Math.ceil(n(a[0]) / n(a[1])) * n(a[1]);
          case "ABS":
            return Math.abs(n(a[0]));
          case "IF":
            return n(a[0]) ? n(a[1]) : n(a[2]);
          default:
            throw new Error(`unsupported function ${t.value}`);
        }
      }
      if (isOp("(")) {
        pos += 1;
        const v = comparison();
        expect(")");
        return v;
      }
      if (isOp("-")) {
        pos += 1;
        return -primary();
      }
      throw new Error(`unexpected token in ${formula}`);
    };
    const term = (): number => {
      let v = primary();
      while (isOp("*") || isOp("/")) {
        const op = (tokens[pos++] as { value: string }).value;
        const r = primary();
        v = op === "*" ? v * r : v / r;
      }
      return v;
    };
    const additive = (): number => {
      let v = term();
      while (isOp("+") || isOp("-")) {
        const op = (tokens[pos++] as { value: string }).value;
        const r = term();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    };
    const comparison = (): number => {
      const left = additive();
      for (const op of ["<=", ">=", "<>", "<", ">", "="]) {
        if (isOp(op)) {
          pos += 1;
          const right = additive();
          const result = {
            "<=": left <= right,
            ">=": left >= right,
            "<>": left !== right,
            "<": left < right,
            ">": left > right,
            "=": left === right,
          }[op];
          return result ? 1 : 0;
        }
      }
      return left;
    };
    const value = comparison();
    if (pos !== tokens.length) throw new Error(`trailing tokens in ${formula}`);
    return value;
  }
}

async function readBack(rom: RomResult): Promise<ExcelJS.Workbook> {
  const bytes = await romWorkbookBuffer(rom);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes as unknown as ArrayBuffer);
  return wb;
}

function formulaCells(
  wb: ExcelJS.Workbook,
): { sheet: string; address: string; formula: string; result: unknown }[] {
  const out: {
    sheet: string;
    address: string;
    formula: string;
    result: unknown;
  }[] = [];
  wb.eachSheet((ws) => {
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.formula)
          out.push({
            sheet: ws.name,
            address: cell.address,
            formula: cell.formula,
            result: cell.result,
          });
      });
    });
  });
  return out;
}

// ---------------------------------------------------------------------------

describe("ROM workbook", () => {
  const rom = priced(golden());
  const { layout } = buildRomWorkbook(rom);

  it("has the five tabs in order", async () => {
    const wb = await readBack(rom);
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      "Estimate",
      "Component Library",
      "Pod & Rates",
      "Releases",
      "Assumptions",
    ]);
  });

  it("every formula cell evaluates, from its formula, to its cached value", async () => {
    const wb = await readBack(rom);
    const cells = formulaCells(wb);
    expect(cells.length).toBeGreaterThan(80);
    const ev = new Evaluator(wb);
    const mismatches = cells
      .map((c) => ({ ...c, evaluated: ev.cell(c.sheet, c.address) }))
      .filter((c) => c.evaluated !== c.result);
    expect(mismatches).toEqual([]);
  });

  it("the key cells evaluate to the engine's values", async () => {
    const wb = await readBack(rom);
    const ev = new Evaluator(wb);
    const E = ROM_WORKBOOK_SHEETS.estimate;
    const R = ROM_WORKBOOK_SHEETS.releases;
    for (const r of rom.releases) {
      const cells = layout.releases[r.code];
      expect(ev.cell(E, cells.hours)).toBe(r.own.hours);
      expect(ev.cell(E, cells.weeks)).toBe(r.own.weeks);
      expect(ev.cell(E, cells.lowCents)).toBe(r.own.range.lowCents);
      expect(ev.cell(E, cells.planCents)).toBe(r.own.range.planCents);
      expect(ev.cell(E, cells.highCents)).toBe(r.own.range.highCents);
    }
    const f = layout.foundation!;
    expect([ev.cell(E, f.weeks), ev.cell(E, f.planCents)]).toEqual([1, 480000]);
    expect(ev.cell(R, layout.total.hours)).toBe(451);
    expect(ev.cell(R, layout.total.lowCents)).toBe(2376000);
    expect(ev.cell(R, layout.total.planCents)).toBe(2880000);
    expect(ev.cell(R, layout.total.highCents)).toBe(3816000);
    expect(ev.cell(R, layout.total.naiveSumCents!)).toBe(3360000);
    expect(rom.total).toMatchObject({
      hours: 451,
      lowCents: 2376000,
      planCents: 2880000,
      highCents: 3816000,
      naiveSumCents: 3360000,
    });
  });

  it("writes the formulas the plan names, built from the formula terms", async () => {
    const wb = await readBack(rom);
    const est = wb.getWorksheet(ROM_WORKBOOK_SHEETS.estimate)!;
    // First hours line: count × unit hours (Component Library) × friction (Assumptions).
    expect(est.getCell("H5").formula).toBe("ROUND(E5*F5*G5,4)");
    expect(est.getCell("F5").formula).toBe("'Component Library'!$C$2");
    expect(est.getCell("G5").formula).toBe("'Assumptions'!$B$2");
    const weeks = est.getCell(layout.releases.R2.weeks).formula;
    expect(weeks).toContain("CEILING(");
    const all = formulaCells(wb).map((c) => c.formula);
    // Paid hours needed = adjusted ÷ productive share.
    expect(all.some((f) => /^B\d+\/'Assumptions'!\$B\$3$/.test(f))).toBe(true);
    // Member cost = ROUND(ROUND(FTE × weeks × hours per FTE-week, 4) × rate, 0).
    expect(
      all.filter((f) => /^ROUND\(D\d+\*E\d+\*F\d+,4\)$/.test(f)),
    ).toHaveLength(6);
    expect(all.filter((f) => /^ROUND\(G\d+\*H\d+,0\)$/.test(f))).toHaveLength(
      6,
    );
    // Rates: base × location × provider, from the cost foundation.
    const pod = wb.getWorksheet(ROM_WORKBOOK_SHEETS.pod)!;
    expect(pod.getCell("M2").formula).toBe("ROUND(G2*I2*K2,0)");
    expect(pod.getCell("H2").value).toBe(
      "rate_band:ROL-T01-LVL-T1:loaded_rate",
    );
    // The total counts the foundation once.
    const rel = wb.getWorksheet(ROM_WORKBOOK_SHEETS.releases)!;
    expect(rel.getCell(layout.total.planCents).formula).toBe("SUM(H2:H3)+H4");
  });

  it("carries a rounding term into the formula when the terms carry one", () => {
    const formula = hoursFormulaFromTerms(
      [
        { label: "count", value: 3, source: "x", cellRole: "count" },
        { label: "unit", value: 2, source: "x", cellRole: "unit_hours" },
        {
          label: "rounding",
          value: 0.0001,
          source: "engine",
          cellRole: "rounding",
        },
        {
          label: "result",
          value: 6.0001,
          source: "engine",
          cellRole: "result",
        },
      ],
      (_t, i) => (i === 0 ? "E9" : null),
    );
    expect(formula).toBe("ROUND(E9*2+(0.0001),4)");
  });

  it("is live: editing an input recomputes to what the engine says", async () => {
    const wb = await readBack(rom);
    const est = wb.getWorksheet(ROM_WORKBOOK_SHEETS.estimate)!;
    // Row 5 is UC-A's first line (data sources, count 2). Make it 9.
    expect([
      est.getCell("B5").value,
      est.getCell("D5").value,
      est.getCell("E5").value,
    ]).toEqual(["UC-A", "data_source_count", 2]);
    est.getCell("E5").value = 9;
    const lib = wb.getWorksheet(ROM_WORKBOOK_SHEETS.library)!;
    lib.getCell("C3").value = 4; // source_table_count unit hours 3 → 4
    const edited = golden();
    edited.useCases[0].counts.data_source_count = 9;
    edited.unitHours.source_table_count = UNIT(4);
    const expected = priced(edited);
    const ev = new Evaluator(wb);
    const R = ROM_WORKBOOK_SHEETS.releases;
    expect(ev.cell(R, layout.total.planCents)).toBe(expected.total.planCents);
    expect(ev.cell(R, layout.total.lowCents)).toBe(expected.total.lowCents);
    expect(ev.cell(R, layout.total.highCents)).toBe(expected.total.highCents);
    expect(ev.cell(R, layout.total.hours)).toBe(expected.total.hours);
    expect(expected.total.planCents).not.toBe(rom.total.planCents);
  });

  it("lists every input with its source and confidence, and flags a proposed mapping", async () => {
    const wb = await readBack(rom);
    const lib = wb.getWorksheet(ROM_WORKBOOK_SHEETS.library)!;
    expect(lib.getRow(2).values).toEqual([
      undefined,
      "data_source_count",
      "Data sources",
      16,
      "test: invented unit hours",
      "medium",
    ]);
    expect(lib.rowCount).toBe(7);
    const asm = wb.getWorksheet(ROM_WORKBOOK_SHEETS.assumptions)!;
    const labels: string[] = [];
    asm.eachRow((row) => labels.push(String(row.getCell(1).value)));
    expect(labels).toEqual(
      expect.arrayContaining([
        "Friction factor",
        "Productive share",
        "Hours per FTE-week",
        "AI productivity credit",
        "Release R1 range low",
        "Release R2 range high",
        "Foundation F range low",
        "Unit hours: validation_row_count",
        "Count: UC-B dashboard_view_count",
        "Count: F design_row_count",
      ]),
    );
    expect(asm.getCell("D2").value).toBe("test: invented friction");
    const r2Low = labels.indexOf("Release R2 range low") + 1;
    expect(asm.getCell(`D${r2Low}`).value).toBe(
      "pricing_range_policies:T-TIGHT (score 0 of 10)",
    );
    const pod = wb.getWorksheet(ROM_WORKBOOK_SHEETS.pod)!;
    expect([pod.getCell("P2").value, pod.getCell("P3").value]).toEqual([
      "proposed mapping, unapproved",
      "caller-specified",
    ]);
    // Caller text is written as text, never as a formula.
    const rel = wb.getWorksheet(ROM_WORKBOOK_SHEETS.releases)!;
    expect(rel.getCell("B2").value).toBe("'=Release one");
    expect(rel.getCell("B2").formula).toBeUndefined();
  });

  it("writes the weeks so a ratio within float noise of N weeks stays N", async () => {
    const s = golden();
    s.useCases = [
      { code: "UC-N", name: "Noisy", counts: { data_source_count: 1 } },
    ];
    s.unitHours = { data_source_count: UNIT(226.8) };
    s.releases = [
      {
        code: "R1",
        name: "One",
        designStatus: "not_designed",
        useCaseCodes: ["UC-N"],
      },
    ];
    s.foundation = null;
    s.friction = { value: 1, source: "test: no friction" };
    s.productiveShare = { value: 0.7, source: "test" };
    s.hoursPerFteWeek = { value: 36, source: "test" };
    const noisy = priced(s);
    const built = buildRomWorkbook(noisy);
    const wb = await readBack(noisy);
    const ev = new Evaluator(wb);
    expect(noisy.releases[0].own.weeks).toBe(3);
    expect(
      ev.cell(ROM_WORKBOOK_SHEETS.estimate, built.layout.releases.R1.weeks),
    ).toBe(3);
    expect(
      formulaCells(wb).filter((c) => ev.cell(c.sheet, c.address) !== c.result),
    ).toEqual([]);
  });

  it("writes a total without a foundation row when the ROM has none", async () => {
    const s = golden();
    s.foundation = null;
    const noFoundation = priced(s);
    const built = buildRomWorkbook(noFoundation);
    expect(built.layout.foundation).toBeNull();
    expect(built.layout.total.naiveSumCents).toBeNull();
    const wb = await readBack(noFoundation);
    const ev = new Evaluator(wb);
    const rel = wb.getWorksheet(ROM_WORKBOOK_SHEETS.releases)!;
    expect(rel.getCell(built.layout.total.planCents).formula).toBe(
      "SUM(H2:H3)",
    );
    expect(
      ev.cell(ROM_WORKBOOK_SHEETS.releases, built.layout.total.planCents),
    ).toBe(noFoundation.total.planCents);
    const mismatches = formulaCells(wb).filter(
      (c) => ev.cell(c.sheet, c.address) !== c.result,
    );
    expect(mismatches).toEqual([]);
  });
});
