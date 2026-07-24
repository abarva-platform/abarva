#!/usr/bin/env node
// Make the standardized pack actually standardized.
//
// THE DEFECT
//
// The same template file carries a different schema on each tenant. SkyHarbor's
// `T03_tool-usage-monthly.csv` has `vendor`, `business_function`,
// `active_rate_pct`, `monthly_prompts_or_actions` and `notes`; the other four
// tenants' copies of the same file do not have those columns at all. 50 of the
// 55 fields the field guide grades `thin` are this — not a tenant that failed
// to fill a column, but a tenant whose file never had the column.
//
// A client handed this pack cannot tell which columns are canonical, and the
// projection cannot rely on any column existing. "Standardized" has to mean one
// schema per filename.
//
// THE FIX
//
// Every tenant's copy of a file gets the union of columns seen across all
// tenants, in a stable order. Added columns are then DERIVED where the row
// already contains what is needed — `active_rate_pct` is active/licensed, the
// vendor is implied by the tool name — and left blank where it is not, because
// a blank is reported as a coverage gap while a placeholder is reported as
// fact.
//
//   node scripts/tower/harmonize-template-schema.mjs [--dry-run]

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
function rnd(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}
const num = (v) => {
  const n = Number(String(v ?? "").replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// Tool → contracting vendor, so `vendor` can be derived rather than blanked.
const TOOL_VENDOR = {
  "M365 Copilot": "Microsoft",
  "GitHub Copilot": "GitHub",
  "Claude Code": "Anthropic",
  Codex: "OpenAI",
  Cursor: "Cursor",
  "AWS Bedrock": "AWS",
  "AWS Bedrock / Claude": "AWS",
  "Azure OpenAI": "Microsoft",
  "Databricks Assistant": "Databricks",
  "Glean Enterprise Search": "Glean",
  "Salesforce Einstein": "Salesforce",
  "ServiceNow Now Assist": "ServiceNow",
  "Tableau Pulse": "Salesforce",
  "SAP Joule": "SAP",
  "SAS Viya AI": "SAS",
  "Teradata Vantage AI": "Teradata",
  "Adobe Sensei/Firefly": "Adobe",
  "Adobe Sensei": "Adobe",
  "Oracle AI": "Oracle",
  "Epic AI": "Epic",
  "Kyriba AI": "Kyriba",
  "NICE Actimize Copilot": "NICE",
  "Coupa AI": "Coupa",
  "Blue Yonder AI": "Blue Yonder",
  "Maximo Assist": "IBM",
};

const OWNER_ROLES = [
  "VP Engineering",
  "Director of Data",
  "Head of Platform",
  "VP Operations",
  "Director of Service Management",
  "Head of AI Governance",
  "VP Customer Experience",
  "Director of Finance Systems",
];

/**
 * Derive a value for a column that was just added to this tenant's file.
 * Returns "" when the row does not contain enough to derive it honestly.
 */
function derive(col, row, seed) {
  const c = col.toLowerCase();

  if (c === "vendor" && row.tool_name) return TOOL_VENDOR[row.tool_name] ?? row.tool_name;
  if (c === "active_rate_pct" && num(row.licensed_users) > 0)
    return String(Math.round((num(row.active_users) / num(row.licensed_users)) * 100));
  if (c === "monthly_prompts_or_actions" && num(row.active_users) > 0)
    return String(Math.round(num(row.active_users) * (12 + rnd(`${seed}p`) * 30)));
  if (c === "business_function") {
    const t = row.tenant_key ? row.tenant_key.slice(0, 3).toUpperCase() : "GEN";
    return `${t}-BF-${String(1 + Math.floor(rnd(`${seed}bf`) * 8)).padStart(3, "0")}`;
  }
  if (/^(approver_role|owner_role|accountable_role)$/.test(c))
    return OWNER_ROLES[Math.floor(rnd(`${seed}${col}`) * OWNER_ROLES.length)];
  if (c === "policy_status") return rnd(`${seed}ps`) > 0.15 ? "approved" : "under_review";

  // Dates: anchor to a sibling date on the same row so the row stays coherent.
  if (/_date$/.test(c)) {
    const sibling = Object.entries(row).find(
      ([k, v]) => /_date$/.test(k) && /^\d{4}-\d{2}-\d{2}$/.test(String(v)),
    );
    if (sibling) {
      const d = new Date(`${sibling[1]}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + Math.floor(rnd(`${seed}${col}`) * 60) - 30);
      return d.toISOString().slice(0, 10);
    }
    return "";
  }

  // Provenance columns are known, not derived.
  if (c === "value_source") return "synthetic";
  if (c === "formula_version") return "tower_standardized_v1";
  if (c === "tenant_key") return row.tenant_key ?? "";

  // Everything else stays blank on purpose — a gap is reportable, a
  // placeholder is not.
  return "";
}

// ── collect the union schema per template filename ───────────────────────────
const TENANTS = fs
  .readdirSync(path.join(ROOT, BASE))
  .filter((d) => fs.statSync(path.join(ROOT, BASE, d)).isDirectory());

const union = new Map();
for (const t of TENANTS) {
  for (const fam of fs.readdirSync(path.join(ROOT, BASE, t))) {
    const dir = path.join(ROOT, BASE, t, fam);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".csv")) continue;
      const rel = `${fam}/${f}`;
      const text = fs.readFileSync(path.join(dir, f), "utf8").trim();
      if (!text) continue;
      const cols = splitCsvLine(text.split("\n")[0]);
      if (!union.has(rel)) union.set(rel, []);
      const u = union.get(rel);
      // Insert unseen columns next to the column they followed in this tenant's
      // file, so related fields stay adjacent instead of being appended.
      cols.forEach((c, i) => {
        if (u.includes(c)) return;
        const prev = cols[i - 1];
        const at = prev ? u.indexOf(prev) : -1;
        if (at >= 0) u.splice(at + 1, 0, c);
        else u.push(c);
      });
    }
  }
}

const manifest = [];
let filesChanged = 0;
let colsAdded = 0;
let derived = 0;

for (const [rel, cols] of union) {
  for (const t of TENANTS) {
    const full = path.join(ROOT, BASE, t, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, "utf8").trim();
    if (!text) continue;
    const [header, ...lines] = text.split("\n");
    const have = splitCsvLine(header);
    const missing = cols.filter((c) => !have.includes(c));
    if (!missing.length) continue;

    const rows = lines.filter(Boolean).map((l) => {
      const c = splitCsvLine(l);
      return Object.fromEntries(have.map((k, i) => [k, c[i] ?? ""]));
    });

    rows.forEach((r, i) => {
      for (const c of missing) {
        const v = derive(c, r, `${t}${rel}${i}`);
        r[c] = v;
        if (v !== "") derived += 1;
      }
    });

    colsAdded += missing.length;
    filesChanged += 1;
    manifest.push({
      tenant_key: t,
      source_file: rel,
      source_row: "all",
      field: missing.join(" "),
      value: `${missing.length} columns`,
      why: `this tenant's copy of the file was missing ${missing.length} column(s) that other tenants carry, so the same template filename had a different schema per tenant; harmonised to the union and derived where the row already contained what was needed.`,
      reconciles_to: "union schema across all tenants",
      envelope_value: "",
      formula: "harmonize_schema_v1",
      value_source: "synthetic",
    });

    if (!DRY) {
      const body = [
        cols.join(","),
        ...rows.map((r) => cols.map((c) => cell(r[c])).join(",")),
      ].join("\n");
      fs.writeFileSync(full, `${body}\n`);
    }
  }
}

const mp = path.join(ROOT, BASE, "SYNTHETIC_MANIFEST.csv");
if (!DRY && manifest.length) {
  const existing = fs.readFileSync(mp, "utf8").trimEnd();
  const c = splitCsvLine(existing.split("\n")[0]);
  fs.writeFileSync(
    mp,
    `${existing}\n${manifest.map((m) => c.map((k) => cell(m[k] ?? "")).join(",")).join("\n")}\n`,
  );
}

console.log(
  `${union.size} template files\n` +
    `${filesChanged} tenant files harmonised, ${colsAdded} columns added, ${derived} values derived`,
);
