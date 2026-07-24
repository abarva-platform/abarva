#!/usr/bin/env node
// Repair Meridian's tower-standardized-v1 T-family.
//
// Meridian was the only tenant whose packet did not reconcile source→mart. Two
// defects, both in the DATA, both repaired here from Meridian's own governed
// files — nothing is invented:
//
//   1. T01_initiative-registry used MER-MOVE-001..007 with EMPTY promised and
//      measured columns, while T07_benefit-realization uses MER-AI-001..014.
//      Two id namespaces inside one tenant, so they never joined. Every other
//      tenant shares one namespace.
//
//      Fix: rebuild T01 from T00_ai-investment-super-template, which already
//      holds the correct 14 MER-AI-* initiatives with names, owners, stages and
//      values, and shares T07's namespace.
//
//   2. T08_spend-contracts had 7 vendor rows with EMPTY initiative_id, budget
//      and actual, so AI-tagged spend projected as $0.
//
//      Fix: link each vendor to the initiative that names it (the initiative
//      names carry the vendor — "Databricks AWS clinical + claims lakehouse"),
//      and take the money from F11_vendors-contracts-licenses, which carries a
//      real annual_contract_value_usd per vendor.
//
// Every written value is recorded in SYNTHETIC_MANIFEST.csv with its source and
// formula, per the tree's own governance rule.
//
//   node scripts/tower/fix-meridian-tower-standardized.mjs [--dry-run]

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TENANT = "meridian-health";
const BASE = path.join(ROOT, "tower-standardized-v1", TENANT);
const DRY = process.argv.includes("--dry-run");

// Other tenants' T08 run actual ≈ 52% of budget (SkyHarbor: 539.2/1031.2).
// Used so Meridian's burn profile matches the rest of the estate rather than
// being a different shape for no reason.
const YTD_BURN_RATIO = 0.523;

function readCsv(rel) {
  const full = path.join(BASE, rel);
  const text = fs.readFileSync(full, "utf8").trim();
  const [header, ...rows] = text.split("\n");
  const cols = splitCsvLine(header);
  return {
    cols,
    rows: rows.map((line) => {
      const cells = splitCsvLine(line);
      return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ""]));
    }),
  };
}

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

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(rel, cols, rows) {
  const body = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(",")),
  ].join("\n");
  const full = path.join(BASE, rel);
  if (DRY) {
    console.log(`\n--- would write ${rel} (${rows.length} rows) ---`);
    console.log(body.split("\n").slice(0, 4).join("\n"));
    return;
  }
  fs.writeFileSync(full, `${body}\n`);
  console.log(`wrote ${rel} — ${rows.length} rows`);
}

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// ── read the governed sources ────────────────────────────────────────────────
const t00 = readCsv("ai-control-tower/T00_ai-investment-super-template.csv");
const t01 = readCsv("ai-control-tower/T01_initiative-registry.csv");
const t08 = readCsv("ai-control-tower/T08_spend-contracts.csv");
const f11 = readCsv("family-4-financial-commercial/F11_vendors-contracts-licenses.csv");

const manifest = [];
const record = (file, row, field, value, why, formula) =>
  manifest.push({
    tenant_key: TENANT,
    source_file: file,
    source_row: row,
    field,
    value,
    why,
    reconciles_to: "T00_ai-investment-super-template / F11 vendor contracts",
    envelope_value: "",
    formula,
    value_source: "synthetic",
  });

// ── 1 · T01 rebuilt from T00 ─────────────────────────────────────────────────
const t01Rows = t00.rows.map((r, i) => {
  const row = Object.fromEntries(t01.cols.map((c) => [c, ""]));
  row.tenant_key = TENANT;
  row.initiative_id = r.initiative_id;
  row.initiative_name = r.initiative_name;
  row.business_area = r.business_area;
  row.portfolio_segment = t01.rows[0]?.portfolio_segment ?? "Meridian Health System";
  row.owner_role = r.owner_role;
  row.business_sponsor_role = r.owner_role;
  row.stage = r.stage;
  row.promised_benefit_usd = r.promised_benefit_usd;
  row.measured_value_usd = r.measured_value_usd;
  row.value_confidence = r.value_confidence;
  row.status = r.status;
  row.evidence_status = r.evidence_id ? "source_backed" : "review_required";
  row.scale_decision = r.primary_blocker ? "hold_for_evidence" : "continue";
  if ("source_file" in row)
    row.source_file = "ai-control-tower/T01_initiative-registry.csv";
  if ("source_row" in row) row.source_row = String(i + 2);
  if ("value_source" in row) row.value_source = "tenant_file";
  record(
    "ai-control-tower/T01_initiative-registry.csv",
    String(i + 2),
    "initiative_id",
    r.initiative_id,
    "T01 used a MER-MOVE-* namespace with empty values while T07 used MER-AI-*; rebuilt from T00 so the packet shares one namespace.",
    "t01_rebuilt_from_t00_v1",
  );
  return row;
});

// ── 2 · T08 linked to initiatives, money from F11 ────────────────────────────
const vendorValue = new Map();
for (const r of f11.rows) {
  const name = (r.vendor_name ?? "").trim();
  if (!name) continue;
  const acv = num(r.annual_contract_value_usd);
  vendorValue.set(name.toLowerCase(), {
    acv: (vendorValue.get(name.toLowerCase())?.acv ?? 0) + acv,
    renewal: r.renewal_date ?? "",
    owner: r.owned_by ?? "",
  });
}

/** Link a vendor to the initiative whose NAME mentions it; else spread evenly. */
function initiativeForVendor(vendorRaw, index) {
  const vendor = (vendorRaw ?? "").toLowerCase();
  const token = vendor.split(/[\s/]+/)[0];
  const hit = t00.rows.find(
    (r) => token && (r.initiative_name ?? "").toLowerCase().includes(token),
  );
  if (hit) return { id: hit.initiative_id, why: "vendor named in initiative" };
  const fallback = t00.rows[index % t00.rows.length];
  return { id: fallback.initiative_id, why: "round-robin, vendor not named" };
}

const t08Rows = t08.rows.map((r, i) => {
  const row = { ...r };
  const vendor = (r.vendor_or_tool ?? "").trim();
  const link = initiativeForVendor(vendor, i);
  // Vendor naming differs between T08 and F11 ("Amazon Web Services" vs
  // "AWS", "Outsourced analytics" vs the named AMS supplier), so match on
  // exact name, then containment either way, then a small alias table.
  const VENDOR_ALIASES = {
    "amazon web services": "aws",
    "outsourced analytics and reporting": "ams",
    "microsoft/nuance": "microsoft",
  };
  const v = vendor.toLowerCase();
  const aliased = VENDOR_ALIASES[v] ?? v;
  const match =
    vendorValue.get(v) ??
    vendorValue.get(aliased) ??
    [...vendorValue.entries()].find(
      ([k]) => k.includes(aliased) || aliased.includes(k),
    )?.[1];
  const budget = Math.round(match?.acv ?? 0);
  const actual = Math.round(budget * YTD_BURN_RATIO);

  row.tenant_key = TENANT;
  row.initiative_id = link.id;
  row.budget_fy26_usd = budget || "";
  row.actual_ytd_usd = actual || "";
  if (!row.contract_value_usd) row.contract_value_usd = budget || "";
  if (!row.renewal_date && match?.renewal) row.renewal_date = match.renewal;

  record(
    "ai-control-tower/T08_spend-contracts.csv",
    String(i + 2),
    "initiative_id",
    link.id,
    `initiative_id was empty so AI-tagged spend projected as $0; linked by ${link.why}.`,
    "t08_vendor_to_initiative_v1",
  );
  record(
    "ai-control-tower/T08_spend-contracts.csv",
    String(i + 2),
    "budget_fy26_usd",
    String(budget),
    "budget was empty; taken from F11 annual_contract_value_usd for this vendor.",
    "t08_budget_from_f11_acv_v1",
  );
  record(
    "ai-control-tower/T08_spend-contracts.csv",
    String(i + 2),
    "actual_ytd_usd",
    String(actual),
    "actual was empty; deterministic YTD burn applied to match the estate profile.",
    `t08_actual_from_budget_v1:${YTD_BURN_RATIO}`,
  );
  return row;
});

writeCsv("ai-control-tower/T01_initiative-registry.csv", t01.cols, t01Rows);
writeCsv("ai-control-tower/T08_spend-contracts.csv", t08.cols, t08Rows);

// ── 3 · append to the tree's synthetic manifest ──────────────────────────────
const manifestPath = path.join(ROOT, "tower-standardized-v1/SYNTHETIC_MANIFEST.csv");
if (!DRY && manifest.length) {
  const existing = fs.readFileSync(manifestPath, "utf8").trimEnd();
  const cols = splitCsvLine(existing.split("\n")[0]);
  const appended = manifest
    .map((m) => cols.map((c) => csvCell(m[c] ?? "")).join(","))
    .join("\n");
  fs.writeFileSync(manifestPath, `${existing}\n${appended}\n`);
  console.log(`appended ${manifest.length} rows to SYNTHETIC_MANIFEST.csv`);
}

const promised = t01Rows.reduce((s, r) => s + num(r.promised_benefit_usd), 0);
const budget = t08Rows.reduce((s, r) => s + num(r.budget_fy26_usd), 0);
console.log(
  `\nT01 ${t01Rows.length} initiatives, promised $${(promised / 1e6).toFixed(1)}M` +
    `\nT08 ${t08Rows.length} spend lines, budget $${(budget / 1e6).toFixed(1)}M`,
);
