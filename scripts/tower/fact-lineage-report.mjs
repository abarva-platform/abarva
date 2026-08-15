#!/usr/bin/env node
// Cross-source fact lineage: who asserts each headline number, and do they agree?
//
// WHY THIS EXISTS
//
// Every wrong figure reported on this pack had the same shape: one file was
// read and its content stated as the fact.
//
//   "Meridian has no IT budget"   -- checked tower-standardized-v1 F12 only.
//                                    $650.0M sits in the V3 tree, asserted
//                                    twice, in 08_it_budget_spend_value.csv
//                                    and SA02_IT_Finance_Budget_Spend_Extract.
//   "Lakeshore has no source data" -- checked one of the two trees.
//   "T08 is AI spend"              -- inferred from the folder name.
//
// The data was never hidden. What is missing is any object that says, for a
// given metric and tenant, WHICH FILES ASSERT IT and whether they agree. Two
// source trees, no index, no source-of-record declaration, and a `not_loaded`
// in one file reads as "the tenant does not have this".
//
// This report is that object. For each headline metric it walks BOTH trees,
// records every file that asserts a value, and flags:
//
//   AGREE      one value, or several within tolerance
//   CONFLICT   two sources assert materially different values -- pick one and
//              say why, in the source-of-record column below
//   ONE_SOURCE only one file asserts it; nothing corroborates it
//   ABSENT     no file asserts it -- the only case where "we do not have this"
//              is a safe thing to say
//
// Run it before quoting any number from this pack.
//
//   node scripts/tower/fact-lineage-report.mjs [--metric <key>]

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(
  ROOT,
  "datasets/tenant-inputs/tenant-input-registry.json",
);

function readJson(full) {
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function activeTenantsFromRegistry() {
  const registry = readJson(REGISTRY_PATH);
  return (registry.activeTenants ?? [])
    .map((tenant) => ({
      key: tenant.tenantKey,
      displayName: tenant.displayName ?? tenant.tenantKey,
      activeRoot: path.join(ROOT, tenant.canonicalInputRoot ?? ""),
      stdRoot: path.join(ROOT, "tower-standardized-v1", tenant.tenantKey),
    }))
    .filter((tenant) => tenant.key && tenant.activeRoot)
    .sort((a, b) => a.key.localeCompare(b.key));
}

// Each metric lists every place it may be asserted, across both trees.
// `sum` adds the column over all rows; `distinct` takes the single agreed value.
const METRICS = [
  {
    key: "it_budget_usd",
    label: "IT budget (FY26)",
    sources: [
      ["std", "family-4-financial-commercial/F12_it-budget-financials.csv", "budget_fy26_usd", "sum"],
      ["active", "08_it_budget_spend_value.csv", "budget_amount_usd", "sum"],
      ["active", "08_it_budget_spend_value.csv", "approved_budget_usd", "sum"],
      ["active", "08_spend_value.csv", "budget_amount_usd", "sum"],
      ["active", "08_spend_value.csv", "approved_budget_usd", "sum"],
      ["active", "SA02_IT_Finance_Budget_Spend_Extract.csv", "budget_amount_usd", "sum"],
    ],
  },
  {
    key: "ai_tagged_budget_usd",
    label: "AI-tagged budget",
    sources: [
      ["std", "family-4-financial-commercial/F12_it-budget-financials.csv", "ai_data_budget_fy26_usd", "sum"],
      ["active", "08_it_budget_spend_value.csv", "ai_tagged_budget_usd", "sum"],
      ["active", "08_spend_value.csv", "ai_tagged_budget_usd", "sum"],
    ],
  },
  {
    key: "ai_initiative_funding_usd",
    label: "AI initiative funding",
    sources: [
      ["std", "ai-control-tower/T08_spend-contracts.csv", "budget_fy26_usd", "sum"],
      ["active", "SA04_Program_Portfolio_Extract.csv", "approved_funding_usd", "sum"],
      ["active", "09_programs_initiatives.csv", "approved_funding_usd", "sum"],
    ],
  },
  {
    key: "promised_value_usd",
    label: "Promised benefit",
    sources: [
      ["std", "ai-control-tower/T07_benefit-realization.csv", "promised_benefit_usd", "sum"],
      ["std", "ai-control-tower/T00_ai-investment-super-template.csv", "promised_benefit_usd", "sum"],
      ["active", "SA08_AI_Benefits_Realization_Usage_Ledger.csv", "promised_value_usd", "sum"],
    ],
  },
  {
    key: "ai_tool_cost_usd",
    label: "AI tool cost",
    sources: [
      ["std", "ai-control-tower/T03_tool-usage-monthly.csv", "cost_usd", "sum"],
      ["active", "SA09_AI_Tool_Usage_Feed.csv", "monthly_cost_usd", "sum"],
    ],
  },
  {
    key: "vendor_run_rate_usd",
    label: "Vendor run rate",
    sources: [
      ["std", "family-4-financial-commercial/F11_vendors-contracts-licenses.csv", "annual_run_rate_usd", "sum"],
      ["std", "family-4-financial-commercial/F11_vendors-contracts-licenses.csv", "annual_contract_value_usd", "sum"],
      ["active", "07_vendors_contracts.csv", "annual_contract_value_usd", "sum"],
    ],
  },
];

// Material disagreement. Below this, two sources are the same number rounded
// differently; above it, somebody has to decide which is right.
const TOLERANCE = 0.02;

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
const num = (v) => {
  const s = String(v ?? "").replace(/[$,\s]/g, "");
  if (!s || s === "not_loaded" || s === "not_provided") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

function readRows(full) {
  if (!fs.existsSync(full)) return null;
  const text = fs.readFileSync(full, "utf8").trim();
  if (!text) return [];
  const [h, ...l] = text.split("\n");
  const cols = splitCsvLine(h);
  return l.filter(Boolean).map((x) => {
    const c = splitCsvLine(x);
    return Object.fromEntries(cols.map((k, i) => [k, c[i] ?? ""]));
  });
}

function resolve(tree, tenant, rel) {
  if (tree === "std") return path.join(tenant.stdRoot, rel);
  return path.join(tenant.activeRoot, rel);
}

const only = (() => {
  const i = process.argv.indexOf("--metric");
  return i >= 0 ? process.argv[i + 1] : null;
})();

const results = [];
const TENANTS = activeTenantsFromRegistry();
for (const metric of METRICS.filter((m) => !only || m.key === only)) {
  for (const t of TENANTS) {
    const claims = [];
    for (const [tree, rel, col] of metric.sources) {
      const full = resolve(tree, t, rel);
      const rows = readRows(full);
      if (rows === null) continue; // file absent for this tenant
      if (!rows.length || !(col in (rows[0] ?? {}))) continue;
      const vals = rows.map((r) => num(r[col])).filter((v) => v !== null);
      if (!vals.length) {
        claims.push({ tree, rel, col, value: null, note: "column present, no values" });
        continue;
      }
      claims.push({ tree, rel, col, value: vals.reduce((a, b) => a + b, 0) });
    }

    const asserted = claims.filter((c) => c.value !== null && c.value !== 0);
    let status;
    if (!asserted.length) status = "ABSENT";
    else if (asserted.length === 1) status = "ONE_SOURCE";
    else {
      const hi = Math.max(...asserted.map((c) => c.value));
      const lo = Math.min(...asserted.map((c) => c.value));
      status = (hi - lo) / hi <= TOLERANCE ? "AGREE" : "CONFLICT";
    }
    results.push({ metric: metric.key, label: metric.label, tenant: t.key, status, claims, asserted });
  }
}

// ── output ───────────────────────────────────────────────────────────────────
const money = (n) => (n === null ? "—" : `$${(n / 1e6).toFixed(1)}M`);
const md = ["# Tower fact lineage", ""];
md.push(
  "For each headline metric and tenant: every file across BOTH source trees that asserts a value, and whether they agree. Run before quoting any number from this pack.",
);
md.push("");
md.push("| Status | Meaning |");
md.push("| --- | --- |");
md.push("| `AGREE` | Several sources, all within 2% |");
md.push("| `CONFLICT` | Sources materially disagree — someone must pick and say why |");
md.push("| `ONE_SOURCE` | Only one file asserts it; nothing corroborates it |");
md.push("| `ABSENT` | No file asserts it — the only safe case for \"we don't have this\" |");
md.push("");

const counts = {};
for (const r of results) counts[r.status] = (counts[r.status] ?? 0) + 1;

let lastMetric = "";
for (const r of results) {
  if (r.metric !== lastMetric) {
    md.push(`## ${r.label} \`${r.metric}\``);
    md.push("");
    md.push("| Tenant | Status | Asserted by | Value |");
    md.push("| --- | --- | --- | ---: |");
    lastMetric = r.metric;
  }
  if (!r.asserted.length) {
    md.push(`| ${r.tenant} | \`ABSENT\` | — | — |`);
  } else {
    r.asserted.forEach((c, i) => {
      md.push(
        `| ${i === 0 ? r.tenant : ""} | ${i === 0 ? `\`${r.status}\`` : ""} | \`${c.tree}\` ${c.rel.split("/").pop()} · \`${c.col}\` | ${money(c.value)} |`,
      );
    });
  }
  if (results[results.indexOf(r) + 1]?.metric !== r.metric) md.push("");
}

const outDir = path.join(ROOT, "reports/tower-fact-lineage");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "lineage.md"), `${md.join("\n")}\n`);
fs.writeFileSync(path.join(outDir, "lineage.json"), JSON.stringify(results, null, 2));

console.log(
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join("   "),
);
console.log("");
for (const r of results.filter((x) => x.status === "CONFLICT")) {
  console.log(`CONFLICT  ${r.tenant.padEnd(20)} ${r.metric}`);
  for (const c of r.asserted) console.log(`            ${money(c.value).padStart(10)}  ${c.tree}/${c.rel.split("/").pop()} · ${c.col}`);
}
const oneSource = results.filter((x) => x.status === "ONE_SOURCE");
if (oneSource.length) {
  console.log(`\nONE_SOURCE (uncorroborated — do not state as fact without saying so):`);
  for (const r of oneSource)
    console.log(`  ${r.tenant.padEnd(20)} ${r.metric.padEnd(28)} ${money(r.asserted[0].value)}  ${r.asserted[0].rel.split("/").pop()}`);
}
console.log(`\nWritten to reports/tower-fact-lineage/lineage.md`);
