#!/usr/bin/env node
// Repair the source-data defects found by the 2026-07-24 plausibility audit.
//
// These were all found by asking "is this number believable for this company?"
// rather than by asking "did the pipeline carry it through?". The pipeline was
// carrying every one of them through faithfully.
//
//   D1  SkyHarbor T08 vendor split is a 1:2:3:4 ramp.
//       SHA-INIT-001's four vendor lines are 0.9M x 1,2,3,4 and its actuals are
//       0.42M x 1,2,3,4 — an index multiplier, not a cost structure. True on
//       30/30 initiatives. The initiative TOTAL is left untouched (it is the
//       only figure any surface reads); the split across labor / vendor_license
//       / cloud_infra / si_services is redistributed to a real delivery mix.
//
//   D2  SkyHarbor T03 stamps all 144 rows `2026-05`.
//       The file is 12 tools x 12 months, but the period column never
//       incremented. `canonicalMergeKey` includes the period, so 12 monthly
//       facts collapsed to 1 and AI-tagged spend read $0.8M instead of $10.2M.
//       Periods are assigned in file order, 2025-07..2026-06.
//
//   D3  Four tenants have no `cost_usd` column in T03 at all, so AI-tagged
//       spend was $0 for them no matter what the pipeline did. Cost is derived
//       as licensed_users x a per-tool list price.
//
//   D4  Lakeshore's T03 and T11 are Meridian's, copied.
//       Identical once tenant ids are normalised out — which is how an
//       industrial holding company ended up licensing "Epic AI", a hospital
//       EHR assistant, for 1,200 seats. Lakeshore gets its own tool estate.
//
//   D5  SkyHarbor's per-seat rates are uniform (~$30-37) across every tool.
//       Claude Code and M365 Copilot do not cost the same per seat. The rate
//       table below is applied to SkyHarbor too, so one price list governs the
//       whole estate.
//
// Every written value lands in SYNTHETIC_MANIFEST.csv with its formula.
//
//   node scripts/tower/fix-tower-standardized-data-defects.mjs [--dry-run]

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry-run");

// ── per-seat monthly list prices, 2026 ───────────────────────────────────────
//
// Public list where one exists; a defensible mid-market figure where the
// product is consumption-priced (Bedrock, Azure OpenAI) or bundled into a
// platform (Epic, Now Assist, Einstein). The point is that they DIFFER — a
// coding agent is not priced like a BI assistant.
const SEAT_PRICE = {
  "M365 Copilot": 30,
  "GitHub Copilot": 39,
  "Claude Code": 150,
  Codex: 60,
  Cursor: 40,
  "AWS Bedrock": 45,
  "AWS Bedrock / Claude": 45,
  "Azure OpenAI": 45,
  "Databricks Assistant": 55,
  "Glean Enterprise Search": 40,
  "Salesforce Einstein": 50,
  "ServiceNow Now Assist": 35,
  "Tableau Pulse": 15,
  "SAP Joule": 35,
  "SAS Viya AI": 28,
  "Teradata Vantage AI": 28,
  "Adobe Sensei/Firefly": 35,
  "Adobe Sensei": 35,
  "Oracle AI": 40,
  "Epic AI": 25,
  "Kyriba AI": 30,
  "NICE Actimize Copilot": 65,
  "Coupa AI": 30,
  "Blue Yonder AI": 45,
  "Maximo Assist": 40,
};
const DEFAULT_SEAT_PRICE = 35;

// Delivery cost mix for a platform initiative. Sums to 1.0.
const SPEND_MIX = {
  labor: 0.4,
  si_services: 0.3,
  vendor_license: 0.2,
  cloud_infra: 0.1,
};

// Lakeshore Industries is a diversified industrial holdco: plants, field
// service, treasury across operating companies. No EHR.
const LAKESHORE_TOOLS = [
  ["M365 Copilot", "M365", "LKS-BF-001"],
  ["GitHub Copilot", "GitHub", "LKS-BF-002"],
  ["Claude Code", "Claude", "LKS-BF-002"],
  ["Cursor", "Cursor", "LKS-BF-002"],
  ["AWS Bedrock", "AWS", "LKS-BF-003"],
  ["Databricks Assistant", "Databricks", "LKS-BF-003"],
  ["ServiceNow Now Assist", "ServiceNow", "LKS-BF-004"],
  ["Maximo Assist", "IBM", "LKS-BF-005"],
  ["Blue Yonder AI", "Blue Yonder", "LKS-BF-006"],
  ["Coupa AI", "Coupa", "LKS-BF-007"],
];

// ── csv helpers ──────────────────────────────────────────────────────────────
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function readCsv(rel) {
  const text = fs.readFileSync(path.join(ROOT, rel), "utf8").trim();
  const [header, ...rows] = text.split("\n");
  const cols = splitCsvLine(header);
  return {
    cols,
    rows: rows.map((l) => {
      const c = splitCsvLine(l);
      return Object.fromEntries(cols.map((k, i) => [k, c[i] ?? ""]));
    }),
  };
}

function writeCsv(rel, cols, rows) {
  const body = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(",")),
  ].join("\n");
  if (DRY) {
    console.log(`  would write ${rel} — ${rows.length} rows, ${cols.length} cols`);
    return;
  }
  fs.writeFileSync(path.join(ROOT, rel), `${body}\n`);
  console.log(`  wrote ${rel} — ${rows.length} rows`);
}

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const manifest = [];
const record = (tenant, file, row, field, value, why, formula) =>
  manifest.push({
    tenant_key: tenant,
    source_file: file,
    source_row: String(row),
    field,
    value: String(value),
    why,
    reconciles_to: "2026-07-24 plausibility audit",
    envelope_value: "",
    formula,
    value_source: "synthetic",
  });

/** Deterministic 0..1 from a string — no Math.random, so reruns are stable. */
function jitter(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const monthsBack = (n) => {
  const out = [];
  let y = 2025;
  let m = 7;
  for (let i = 0; i < n; i += 1) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
};

// ── D1 · SkyHarbor T08 — redistribute the ramp ───────────────────────────────
function fixSkyharborSpend() {
  const rel = "tower-standardized-v1/skyharbor-air/ai-control-tower/T08_spend-contracts.csv";
  const { cols, rows } = readCsv(rel);
  const byInit = new Map();
  for (const r of rows) {
    const k = r.initiative_id;
    if (!byInit.has(k)) byInit.set(k, []);
    byInit.get(k).push(r);
  }
  let touched = 0;
  for (const [id, lines] of byInit) {
    const budgetTotal = lines.reduce((s, r) => s + num(r.budget_fy26_usd), 0);
    const actualTotal = lines.reduce((s, r) => s + num(r.actual_ytd_usd), 0);
    if (budgetTotal <= 0) continue;
    for (const r of lines) {
      // Weight by the line's own spend_category, so labor is the biggest line
      // and cloud the smallest — which is what a platform initiative looks like.
      const share = SPEND_MIX[r.spend_category] ?? 1 / lines.length;
      const b = Math.round(budgetTotal * share);
      const a = Math.round(actualTotal * share);
      r.budget_fy26_usd = b;
      r.actual_ytd_usd = a;
      if (num(r.contract_value_usd) > 0) r.contract_value_usd = b;
      touched += 1;
      record(
        "skyharbor-air",
        "ai-control-tower/T08_spend-contracts.csv",
        r.line_id || id,
        "budget_fy26_usd",
        b,
        `vendor split was an index ramp (0.9M x 1,2,3,4); redistributed by spend_category at the real delivery mix. Initiative total unchanged at $${budgetTotal}.`,
        `t08_mix_redistribution_v1:${r.spend_category}=${SPEND_MIX[r.spend_category] ?? "even"}`,
      );
    }
  }
  writeCsv(rel, cols, rows);
  console.log(`    D1 · ${byInit.size} initiatives, ${touched} vendor lines re-split (totals preserved)`);
}

// ── D2/D3/D5 · T03 periods + cost_usd for every tenant ───────────────────────
function fixToolUsage(tenantDir, tenantKey) {
  const rel = `tower-standardized-v1/${tenantDir}/ai-control-tower/T03_tool-usage-monthly.csv`;
  const { cols, rows } = readCsv(rel);
  if (!cols.includes("cost_usd")) cols.splice(cols.indexOf("policy_status"), 0, "cost_usd");

  // D2 — if every row shares one period, the file is N months with a frozen
  // column. Re-stamp per tool, in file order.
  const periods = new Set(rows.map((r) => r.period));
  const perTool = new Map();
  if (periods.size === 1) {
    const counts = new Map();
    for (const r of rows) counts.set(r.tool_name, (counts.get(r.tool_name) ?? 0) + 1);
    const span = Math.max(...counts.values());
    const months = monthsBack(span);
    for (const r of rows) {
      const i = perTool.get(r.tool_name) ?? 0;
      perTool.set(r.tool_name, i + 1);
      r.period = months[i] ?? r.period;
      record(
        tenantKey,
        "ai-control-tower/T03_tool-usage-monthly.csv",
        `${r.tool_name}/${i}`,
        "period",
        r.period,
        `all ${rows.length} rows were stamped with one period, collapsing ${span} months to 1 in the canonical merge.`,
        "t03_period_restamp_v1",
      );
    }
  }

  // D3/D5 — cost from licensed seats x a per-tool list price.
  for (const r of rows) {
    const price = SEAT_PRICE[r.tool_name] ?? DEFAULT_SEAT_PRICE;
    const seats = num(r.licensed_users);
    // +/-6%, deterministic per tool-month: true-ups, mid-month adds, overage.
    const wobble = 0.94 + jitter(`${tenantKey}${r.tool_name}${r.period}`) * 0.12;
    const cost = Math.round(seats * price * wobble);
    r.cost_usd = cost || "";
    if (cost) {
      record(
        tenantKey,
        "ai-control-tower/T03_tool-usage-monthly.csv",
        `${r.tool_name}/${r.period}`,
        "cost_usd",
        cost,
        `AI-tagged spend read $0 because T03 carried no cost; derived from ${seats} licensed seats at the $${price}/seat/mo list price.`,
        `t03_cost_from_seats_v1:${price}`,
      );
    }
  }
  writeCsv(rel, cols, rows);
  const total = rows.reduce((s, r) => s + num(r.cost_usd), 0);
  const mo = new Set(rows.map((r) => r.period)).size;
  console.log(
    `    ${tenantKey}: ${rows.length} rows, ${mo} distinct periods, $${(total / 1e6).toFixed(1)}M over the window`,
  );
}

// ── D4 · Lakeshore gets its own tool estate ──────────────────────────────────
function fixLakeshoreTools() {
  const rel = "tower-standardized-v1/lakeshore-industries/ai-control-tower/T03_tool-usage-monthly.csv";
  const { cols, rows } = readCsv(rel);
  const months = [...new Set(rows.map((r) => r.period))].sort();
  const template = rows[0];
  const out = [];
  for (const m of months) {
    LAKESHORE_TOOLS.forEach(([tool, vendor, bf], idx) => {
      const prev = rows.find((r) => r.period === m && r.tool_name === tool);
      // Seat counts scale with how broadly the tool deploys: M365 org-wide,
      // coding agents to engineering, plant tools to operations.
      const base = [4200, 900, 450, 380, 620, 540, 1600, 780, 320, 410][idx];
      const growth = 1 + months.indexOf(m) * 0.04;
      const licensed = prev ? num(prev.licensed_users) : Math.round(base * growth);
      const rate = 0.34 + jitter(`lks${tool}${m}`) * 0.34;
      const active = Math.round(licensed * rate);
      out.push({
        ...Object.fromEntries(cols.map((c) => [c, ""])),
        ...(template.tenant_key ? { tenant_key: "lakeshore-industries" } : {}),
        period: m,
        tool_name: tool,
        vendor,
        business_function: bf,
        licensed_users: licensed,
        active_users: active,
        active_rate_pct: Math.round((active / licensed) * 100),
        monthly_prompts_or_actions: Math.round(active * (12 + jitter(`p${tool}${m}`) * 30)),
        cost_usd: "",
        policy_status: "approved",
        notes: "",
        source_file: "ai-control-tower/T03_tool-usage-monthly.csv",
        source_row: String(out.length + 2),
        value_source: "synthetic",
      });
      record(
        "lakeshore-holdings",
        "ai-control-tower/T03_tool-usage-monthly.csv",
        `${tool}/${m}`,
        "tool_name",
        tool,
        "T03 was a byte-copy of Meridian's, which licensed the Epic EHR assistant to an industrial holding company; replaced with a plant/field-service/treasury estate.",
        "t03_lakeshore_own_estate_v1",
      );
    });
  }
  writeCsv(rel, cols, out);
  console.log(`    D4 · Lakeshore T03 rebuilt — ${LAKESHORE_TOOLS.length} tools x ${months.length} months`);
}

// ── run ──────────────────────────────────────────────────────────────────────
const TENANTS = [
  ["skyharbor-air", "skyharbor-air"],
  ["meridian-health", "meridian-health"],
  ["first-capital-financial", "first-capital"],
  ["lakeshore-industries", "lakeshore-holdings"],
  ["apex-retail", "apex-retail"],
];

console.log("D1 · SkyHarbor T08 index ramp");
fixSkyharborSpend();
console.log("\nD4 · Lakeshore T03 copied from Meridian");
fixLakeshoreTools();
console.log("\nD2/D3/D5 · T03 periods and cost_usd");
for (const [dir, key] of TENANTS) fixToolUsage(dir, key);

const manifestPath = "tower-standardized-v1/SYNTHETIC_MANIFEST.csv";
if (!DRY && manifest.length) {
  const existing = fs.readFileSync(path.join(ROOT, manifestPath), "utf8").trimEnd();
  const cols = splitCsvLine(existing.split("\n")[0]);
  fs.writeFileSync(
    path.join(ROOT, manifestPath),
    `${existing}\n${manifest.map((m) => cols.map((c) => csvCell(m[c] ?? "")).join(",")).join("\n")}\n`,
  );
}
console.log(`\n${manifest.length} values recorded in SYNTHETIC_MANIFEST.csv`);
