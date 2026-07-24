#!/usr/bin/env node
// Reconcile the synthetic pack against its own field guide.
//
// `build-template-field-guide.mjs` grades every one of the 791 fields on
// whether OUR pack demonstrates it. This fixes everything it grades below
// `good`, so we are not asking a client to fill a field better than we filled
// it ourselves.
//
// WHAT IT REPAIRS
//
//   filler_ramp   Values are an arithmetic sequence — `incidents_total` running
//                 40, 41, 42 ... 51 is a counter, not an operations record. The
//                 business envelope (min, max, mean) is preserved and the
//                 values are redistributed with deterministic variation, so the
//                 series stops being a generator artefact without inventing a
//                 different scale.
//
//   copy_paste    The same run of real values on two or more tenants. Dates are
//                 offset per tenant so two companies do not share a governance
//                 calendar.
//
//   missing       A column no tenant populates. Free-text columns get content
//                 derived from the row's own fields rather than a placeholder —
//                 a `notes` column full of "n/a" teaches a client nothing.
//
// Deterministic throughout: no Math.random, so reruns are stable and a rerun
// after a source change produces a reviewable diff rather than churn.
//
//   node scripts/tower/reconcile-synthetic-data.mjs [--dry-run]

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = "tower-standardized-v1";
const DRY = process.argv.includes("--dry-run");

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
const cell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Deterministic 0..1 from a seed string. */
function rnd(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const isNum = (v) => v !== "" && Number.isFinite(Number(String(v).replace(/[$,%\s]/g, "")));
const toNum = (v) => Number(String(v).replace(/[$,%\s]/g, ""));

const guide = (() => {
  const text = fs.readFileSync(path.join(ROOT, BASE, "TEMPLATE_FIELD_GUIDE.csv"), "utf8").trim();
  const [h, ...l] = text.split("\n");
  const cols = splitCsvLine(h);
  return l.map((x) => {
    const c = splitCsvLine(x);
    return Object.fromEntries(cols.map((k, i) => [k, c[i] ?? ""]));
  });
})();

const TARGETS = guide.filter((g) => ["filler_ramp", "copy_paste", "missing"].includes(g.exemplar_status));
const byFile = new Map();
for (const g of TARGETS) {
  const key = `${g.family}/${g.file}`;
  if (!byFile.has(key)) byFile.set(key, []);
  byFile.get(key).push(g);
}

const TENANTS = fs
  .readdirSync(path.join(ROOT, BASE))
  .filter((d) => fs.statSync(path.join(ROOT, BASE, d)).isDirectory());

const manifest = [];
let filesTouched = 0;
let valuesWritten = 0;

for (const [relFile, fields] of byFile) {
  for (const tenant of TENANTS) {
    const full = path.join(ROOT, BASE, tenant, relFile);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, "utf8").trim();
    if (!text) continue;
    const [header, ...lines] = text.split("\n");
    const cols = splitCsvLine(header);
    const rows = lines.filter(Boolean).map((l) => {
      const c = splitCsvLine(l);
      return Object.fromEntries(cols.map((k, i) => [k, c[i] ?? ""]));
    });
    if (!rows.length) continue;

    let touched = false;

    for (const f of fields) {
      const col = f.column;
      if (!cols.includes(col)) continue;
      const values = rows.map((r) => (r[col] ?? "").trim());
      const present = values.filter((v) => v !== "");

      // ── numeric ramp: keep the envelope, kill the sequence ────────────────
      if (f.exemplar_status === "filler_ramp" && present.length && present.every(isNum)) {
        const nums = present.map(toNum);
        const lo = Math.min(...nums);
        const hi = Math.max(...nums);
        const decimals = present.some((v) => v.includes(".")) ? 1 : 0;
        rows.forEach((r, i) => {
          if ((r[col] ?? "").trim() === "") return;
          // Triangular-ish: two draws averaged, so the mass sits mid-range the
          // way a real operational series does, rather than being flat.
          const a = rnd(`${tenant}${relFile}${col}${i}a`);
          const b = rnd(`${tenant}${relFile}${col}${i}b`);
          const v = lo + ((a + b) / 2) * (hi - lo);
          r[col] = decimals ? v.toFixed(decimals) : String(Math.round(v));
          valuesWritten += 1;
        });
        touched = true;
        manifest.push({
          tenant_key: tenant,
          source_file: relFile,
          source_row: "all",
          field: col,
          value: `${lo}..${hi}`,
          why: `values were an arithmetic sequence (a generator counter, not a business measure); redistributed across the same ${lo}-${hi} envelope.`,
          reconciles_to: "TEMPLATE_FIELD_GUIDE exemplar grade",
          envelope_value: `${lo}..${hi}`,
          formula: "reconcile_ramp_v1",
          value_source: "synthetic",
        });
        continue;
      }

      // ── copy-pasted dates: offset per tenant ──────────────────────────────
      if (f.exemplar_status === "copy_paste" && /_date$/.test(col)) {
        const shift = Math.floor(rnd(`${tenant}${col}`) * 90) - 45;
        rows.forEach((r, i) => {
          const v = (r[col] ?? "").trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
          const d = new Date(`${v}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + shift + Math.floor(rnd(`${tenant}${col}${i}`) * 21) - 10);
          r[col] = d.toISOString().slice(0, 10);
          valuesWritten += 1;
        });
        touched = true;
        manifest.push({
          tenant_key: tenant,
          source_file: relFile,
          source_row: "all",
          field: col,
          value: `shift ${shift}d`,
          why: "identical date run across tenants; offset per tenant so two companies do not share a governance calendar.",
          reconciles_to: "TEMPLATE_FIELD_GUIDE exemplar grade",
          envelope_value: "",
          formula: "reconcile_copypaste_date_v1",
          value_source: "synthetic",
        });
        continue;
      }

      // ── missing free text: derive from the row, never a placeholder ───────
      if (f.exemplar_status === "missing" && present.length === 0) {
        const donor = (r) =>
          r.initiative_name ||
          r.system_name ||
          r.application_name ||
          r.service_name ||
          r.data_product_name ||
          r.benefit_name ||
          r.model_name ||
          "";
        rows.forEach((r, i) => {
          const d = donor(r);
          if (col === "notes") {
            const stage = r.stage || r.status || "";
            const blocker = r.primary_blocker || r.blocker || "";
            r[col] = blocker
              ? `Blocked on ${blocker.toLowerCase()}; evidence review outstanding before the next gate.`
              : stage
                ? `At ${stage.replace(/_/g, " ")}; benefit claim to be re-evidenced at the next quarterly review.`
                : "";
          } else if (/source_system_name|related_system_name/.test(col)) {
            const pool = ["ERP core", "CRM platform", "Data lakehouse", "CMDB", "HRIS", "Billing engine", "Contract register"];
            r[col] = pool[Math.floor(rnd(`${tenant}${col}${i}`) * pool.length)];
          } else if (/^(field_name|field_group|required|description)$/.test(col)) {
            // T00 carries a dormant field-guidance schema. Point it at the
            // generated guide rather than leaving it blank.
            r[col] =
              col === "field_name"
                ? "see TEMPLATE_FIELD_GUIDE.csv"
                : col === "field_group"
                  ? "ai-control-tower"
                  : col === "required"
                    ? "required"
                    : "Per-field ownership, source system and extraction guidance is generated into TEMPLATE_FIELD_GUIDE.csv/.md.";
          } else if (d) {
            r[col] = d;
          }
          if ((r[col] ?? "") !== "") valuesWritten += 1;
        });
        touched = true;
        manifest.push({
          tenant_key: tenant,
          source_file: relFile,
          source_row: "all",
          field: col,
          value: "derived",
          why: "no tenant populated this column, so the pack could not show a client what a good value looks like; derived from each row's own fields.",
          reconciles_to: "TEMPLATE_FIELD_GUIDE exemplar grade",
          envelope_value: "",
          formula: "reconcile_missing_text_v1",
          value_source: "synthetic",
        });
      }
    }

    if (touched && !DRY) {
      const body = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
      fs.writeFileSync(full, `${body}\n`);
      filesTouched += 1;
    } else if (touched) filesTouched += 1;
  }
}

const mp = path.join(ROOT, BASE, "SYNTHETIC_MANIFEST.csv");
if (!DRY && manifest.length) {
  const existing = fs.readFileSync(mp, "utf8").trimEnd();
  const cols = splitCsvLine(existing.split("\n")[0]);
  fs.writeFileSync(
    mp,
    `${existing}\n${manifest.map((m) => cols.map((c) => cell(m[c] ?? "")).join(",")).join("\n")}\n`,
  );
}

console.log(
  `${TARGETS.length} defective fields across ${byFile.size} template files\n` +
    `${filesTouched} tenant files rewritten, ${valuesWritten} values reconciled\n` +
    `${manifest.length} manifest entries recorded`,
);
