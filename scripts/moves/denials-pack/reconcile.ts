/** Offline byte readers and pure reconciliation; no upload, approval or data-plane path. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";
import { buildScenario, NOTICE, PACK_FILES } from "./scenario";

type Cell = string | number | null;
export interface PackSnapshot {
  text: Record<string, string>;
  sheets: Record<string, Record<string, Cell[][]>>;
  formulas: Record<string, number>;
  hashes: Record<string, string>;
}
const normalize = (s: string) =>
  s.normalize("NFKC").replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
export async function readPack(directory: string): Promise<PackSnapshot> {
  const snapshot: PackSnapshot = {
    text: {},
    sheets: {},
    formulas: {},
    hashes: {},
  };
  for (const file of PACK_FILES) {
    const bytes = await fs.readFile(path.join(directory, file));
    snapshot.hashes[file] = crypto
      .createHash("sha256")
      .update(bytes)
      .digest("hex");
    if (file.endsWith(".xlsx")) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(bytes).buffer);
      const sheets: Record<string, Cell[][]> = {};
      let formulas = 0;
      workbook.eachSheet((sheet) => {
        const rows: Cell[][] = [];
        for (let r = 1; r <= sheet.rowCount; r++) {
          const cells: Cell[] = [];
          for (let c = 1; c <= sheet.columnCount; c++) {
            const cell = sheet.getCell(r, c);
            if (cell.formula) formulas++;
            const value = cell.formula ? cell.result : cell.value;
            if (value && typeof value === "object") {
              if ("error" in value)
                throw new Error(
                  `workbook_error:${file}:${sheet.name}:${cell.address}`,
                );
              cells.push(cell.text);
            } else
              cells.push(
                typeof value === "string" || typeof value === "number"
                  ? value
                  : null,
              );
          }
          rows.push(cells);
        }
        sheets[sheet.name] = rows;
      });
      snapshot.sheets[file] = sheets;
      snapshot.formulas[file] = formulas;
      snapshot.text[file] = Object.values(sheets)
        .flat()
        .flat()
        .filter((x) => x !== null)
        .join(" ");
    } else if (file.endsWith(".docx")) {
      const zip = await JSZip.loadAsync(bytes);
      const xml = await Promise.all(
        Object.keys(zip.files)
          .filter((name) =>
            /^word\/(document|header\d+|footer\d+)\.xml$/.test(name),
          )
          .map(async (name) => zip.file(name)!.async("string")),
      );
      snapshot.text[file] = xml
        .join(" ")
        .replace(/<\/w:p>/g, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    } else if (file.endsWith(".pdf")) {
      const parser = new PDFParse({ data: new Uint8Array(bytes) });
      try {
        snapshot.text[file] = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else snapshot.text[file] = bytes.toString("utf8");
  }
  return snapshot;
}

/** Checks extracted values against each other AND the declared deterministic scenario. */
export function reconcilePack(p: PackSnapshot) {
  const s = buildScenario();
  const errors: string[] = [];
  const check = (ok: boolean, reason: string) => {
    if (!ok) errors.push(reason);
  };
  const eq = (actual: Cell | undefined, expected: Cell, reason: string) =>
    check(
      typeof expected === "number"
        ? typeof actual === "number" && Math.abs(actual - expected) < 0.005
        : actual === expected,
      reason,
    );
  const has = (file: string, words: string) =>
    normalize(p.text[file] ?? "").includes(normalize(words));
  for (const file of PACK_FILES)
    check(has(file, NOTICE), `synthetic_notice:${file}`);
  const sheet = (file: string, name: string) => p.sheets[file]?.[name] ?? [];
  const claims = sheet(PACK_FILES[1], "Claim cohorts")
    .slice(5)
    .filter((r) => r[0]);
  const denials = sheet(PACK_FILES[1], "Denial cohorts")
    .slice(5)
    .filter((r) => r[0]);
  check(claims.length === 384 && denials.length === 1536, "cohort_row_counts");
  check(
    new Set(claims.map((r) => r[0])).size === claims.length,
    "duplicate_submission",
  );
  check(
    new Set(denials.map((r) => r[0])).size === denials.length,
    "duplicate_denial",
  );
  claims.forEach((r, i) => {
    const c = s.claims[i];
    if (!c) return;
    [
      c.id,
      c.quarter,
      c.facility,
      c.payer,
      c.service,
      c.claims,
      c.grossCharges,
      c.allowedAmount,
    ].forEach((v, j) => eq(r[j], v, `submission:${i}:${j}`));
  });
  const submission = new Map(claims.map((r) => [r[0], r]));
  const sums = (rows: Cell[][], col: number) =>
    rows.reduce((a, r) => a + (typeof r[col] === "number" ? r[col] : NaN), 0);
  denials.forEach((r, i) => {
    const d = s.denials[i];
    if (!d) return;
    [
      d.id,
      d.cohortId,
      d.quarter,
      d.facility,
      d.payer,
      d.service,
      d.reason,
      d.denials,
      d.deniedAllowed,
      d.recoveries,
      d.writeOffs,
      d.adjustments,
      d.reworkHours,
      d.preventableDenials,
    ].forEach((v, j) => eq(r[j], v, `denial:${i}:${j}`));
    check(submission.has(r[1]), `denial_parent:${i}`);
    eq(
      sums([r], 9) + sums([r], 10) + sums([r], 11),
      r[8],
      `disposition_partition:${i}`,
    );
    eq(
      sums([r], 7) * s.assumptions.reworkHoursPerDenial,
      r[12],
      `rework_basis:${i}`,
    );
  });
  for (const c of claims) {
    check(
      sums(
        denials.filter((d) => d[1] === c[0]),
        7,
      ) <= Number(c[5]),
      `denials_exceed_original_claims:${c[0]}`,
    );
  }
  const summary = sheet(PACK_FILES[1], "Summary");
  s.quarterly.forEach((q, i) => {
    const cs = claims.filter((c) => c[1] === q.quarter),
      ds = denials.filter((d) => d[2] === q.quarter);
    const n = sums(cs, 5),
      d = sums(ds, 7);
    const expected: Cell[] = [
      q.quarter,
      n,
      d,
      d / n,
      sums(cs, 6),
      sums(cs, 7),
      ...[8, 9, 10, 11, 12, 13].map((c) => sums(ds, c)),
    ];
    expected.forEach((v, col) =>
      eq(summary[i + 5]?.[col], v, `quarter_summary:${q.quarter}:${col}`),
    );
  });
  const t = s.trailingYear;
  [
    "Trailing year",
    t.claims,
    t.denials,
    t.denialRate,
    t.grossCharges,
    t.allowedAmount,
    t.deniedAllowed,
    t.recoveries,
    t.writeOffs,
    t.adjustments,
    t.reworkHours,
    t.preventableDenials,
  ].forEach((v, col) => eq(summary[14]?.[col], v, `trailing_year:${col}`));
  check(p.formulas[PACK_FILES[1]] >= 99, "baseline_live_formulas");
  const tax = sheet(PACK_FILES[2], "Taxonomy");
  s.reasons.forEach((r, i) => {
    [r.id, r.group, r.definition, r.owner, r.preventable, r.policy].forEach(
      (v, j) => eq(tax[i + 5]?.[j], v, `taxonomy:${r.id}:${j}`),
    );
    for (const value of [r.id, r.policy, r.owner, `${r.preventable * 100}%`])
      check(has(PACK_FILES[7], value), `policy_taxonomy:${r.id}:${value}`);
  });
  const inv = sheet(PACK_FILES[3], "Inventory");
  s.sources.forEach((r, i) =>
    [
      r.id,
      r.name,
      r.owner,
      r.refresh,
      r.access,
      r.issue,
      r.tables,
      r.policy,
    ].forEach((v, j) => eq(inv[i + 5]?.[j], v, `inventory:${r.id}:${j}`)),
  );
  eq(sums(inv.slice(5, 11), 6), 28, "foundation_tables_count_once");
  const benches = sheet(PACK_FILES[3], "Planning benchmarks");
  [36, 8, 28, 24, 3, 2, 1.18, 0.68, 40].forEach((v, i) =>
    eq(benches[i + 5]?.[1], v, `delivery_proposal:${i}`),
  );
  const finance = sheet(PACK_FILES[5], "Finance"),
    quarters = sheet(PACK_FILES[5], "Quarter finance");
  const a = s.assumptions;
  const values = [
    t.claims,
    t.denials,
    t.writeOffs,
    t.recoveries,
    t.reworkHours,
    a.loadedAdminHourlyCost,
    t.reworkHours * a.loadedAdminHourlyCost,
    a.vendorAnnualSpend,
    a.annualDiscountRate,
    a.currentDaysAR,
    a.targetDaysAR,
    a.reworkHoursPerDenial,
    a.preventionShare,
    a.attribution,
    a.probability,
    a.reworkReductionShare,
    a.benefitStartMonth,
    a.rampMonths,
    a.currentPaymentLagMonths,
    a.budgetCeiling,
    0,
    a.reworkHoursPerDenial * (1 - a.reworkReductionShare),
    1,
    0,
    a.writeOffShare,
    a.recoveryShare,
    a.adjustmentShare,
  ];
  values.forEach((v, i) => eq(finance[i + 5]?.[1], v, `finance:${i + 6}`));
  s.quarterly.forEach((q, i) =>
    [
      q.quarter,
      q.writeOffs,
      q.recoveries,
      q.reworkHours,
      q.reworkHours * a.loadedAdminHourlyCost,
      a.vendorAnnualSpend / 4,
      -q.writeOffs,
    ].forEach((v, j) =>
      eq(quarters[i + 5]?.[j], v, `finance_quarter:${i}:${j}`),
    ),
  );
  check(p.formulas[PACK_FILES[5]] >= 21, "finance_live_formulas");
  // Text consumers carry reproducible denominators, never a different rounded basis.
  for (const file of [PACK_FILES[0], PACK_FILES[4], PACK_FILES[6]]) {
    for (const n of [t.claims, t.denials])
      check(
        has(file, n.toLocaleString("en-US")),
        `narrative_denominator:${file}:${n}`,
      );
  }
  for (const file of [PACK_FILES[0], PACK_FILES[4]]) {
    for (const n of [t.writeOffs, t.recoveries, t.grossCharges])
      check(
        has(
          file,
          `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        ),
        `narrative_money:${file}:${n}`,
      );
  }
  for (const f of s.facilities)
    check(
      has(PACK_FILES[0], f.id) && has(PACK_FILES[0], f.name),
      `facility_identity:${f.id}`,
    );
  for (const payer of s.payers)
    check(
      has(PACK_FILES[0], payer.id) &&
        has(PACK_FILES[0], payer.name) &&
        has(PACK_FILES[0], `${payer.share * 100}%`),
      `payer_identity:${payer.id}`,
    );
  for (const words of [
    "6 sources",
    "28 source tables",
    "UC-1",
    "UC-2",
    "pricing-engine-v1",
  ])
    check(has(PACK_FILES[0], words), `delivery_words:${words}`);
  check(
    has(PACK_FILES[6], "23 days") && has(PACK_FILES[6], "58"),
    "workflow_timing",
  );
  check(
    has(PACK_FILES[5], "NOT a ROM delivery rate") &&
      has(PACK_FILES[5], "No NPV, ROI"),
    "cost_boundary",
  );
  check(
    (p.text[PACK_FILES[4]].match(/## Interview \d /g) ?? []).length === 5,
    "five_role_interviews",
  );
  return {
    ok: errors.length === 0,
    errors,
    files: PACK_FILES.length,
    claimRows: claims.length,
    denialRows: denials.length,
    quarterly: s.quarterly,
    trailingYear: t,
    hashes: p.hashes,
  };
}
