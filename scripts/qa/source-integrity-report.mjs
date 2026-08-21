#!/usr/bin/env node
/**
 * Source integrity checks across every ACTIVE tenant.
 *
 * Tenancy comes from tenant-input-registry.json, never from a directory listing. An earlier
 * version of this script enumerated `datasets/tenant-inputs/active/` and reported four retired
 * tenants as active, because their directories are still on disk pending purge tranches 3 and 4.
 * Inferring identity from a folder name is the specific mistake the data operating model forbids,
 * and it produced findings that read as urgent defects in live tenants.
 *
 * Directories present but not registered are reported separately, as what they are: leftovers.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REGISTRY = path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json");
const ACTIVE_DIR = path.join(ROOT, "datasets/tenant-inputs/active");

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && q && n === '"') { cell += '"'; i += 1; continue; }
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { row.push(cell); cell = ""; continue; }
    if ((c === "\n" || c === "\r") && !q) {
      if (c === "\r" && n === "\n") i += 1;
      row.push(cell); rows.push(row); row = []; cell = ""; continue;
    }
    cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() ?? []).map((h) => h.trim());
  return rows.filter((r) => r.some((v) => v.trim())).map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])),
  );
}

const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
const active = registry.activeTenants ?? [];
const retiredKeys = new Set((registry.retiredTenants ?? []).map((t) => t.tenantKey));

const read = (root, file) => {
  const p = path.join(ROOT, root, file);
  return fs.existsSync(p) ? parseCsv(fs.readFileSync(p, "utf8")) : null;
};
const values = (rows, col) => rows.map((r) => (r[col] ?? "").trim()).filter(Boolean);

const findings = [];
const byTenantFive = {};

for (const tenant of active) {
  const key = tenant.tenantKey;
  const root = tenant.canonicalInputRoot;
  const four = read(root, "04_applications_systems.csv");
  const five = read(root, "05_data_assets_integrations.csv");
  if (!four) {
    findings.push({ code: "registered_tenant_missing_source", severity: "error", tenant: key,
      message: `Registered active tenant has no 04_applications_systems.csv at ${root}.` });
    continue;
  }
  if (five) byTenantFive[key] = five;

  if (five && five.length >= 10) {
    for (const col of ["source_system", "target_system", "integration_type"]) {
      const all = five.map((r) => (r[col] ?? "").trim());
      const populated = all.filter(Boolean);
      if (!populated.length) {
        findings.push({ code: "empty_relationship_column", severity: "error", tenant: key,
          message: `05.${col} is blank on all ${all.length} rows. The file looks populated because data_asset_name is real and distinct, but it carries no relationship data at all.` });
        continue;
      }
      const distinct = new Set(populated);
      if (distinct.size === 1) {
        const [only] = [...distinct];
        const meta = /standard_|_v\d|packet|template/i.test(only);
        findings.push({ code: "constant_reference_column", severity: "error", tenant: key,
          message: meta
            ? `05.${col} holds "${only}" on every row — a template identifier, not a system. File metadata was written into a relationship column, and nothing downstream can tell because the value is a valid string.`
            : `05.${col} holds the single value "${only}" across all ${populated.length} rows. A reference column with one distinct value is a constant, not a reference.` });
      }
    }
  }

  if (five) {
    const refs = new Set([...values(five, "source_system"), ...values(five, "target_system")]);
    if (refs.size > 1) {
      const identity = new Set(values(four, "system_name"));
      const unresolved = [...refs].filter((r) => !identity.has(r));
      if (unresolved.length) {
        let via = null;
        for (const prov of ["original_row_id", "system_id", "source_fingerprint"]) {
          const alt = new Set(values(four, prov));
          if (unresolved.every((r) => alt.has(r))) { via = prov; break; }
        }
        findings.push({
          code: via ? "reference_key_is_provenance" : "unresolvable_reference",
          severity: "error", tenant: key,
          message: via
            ? `05 references resolve against 04.${via} (a provenance field) and none against the declared identity system_name. ${refs.size} references, ${unresolved.length} unresolved by the documented key.`
            : `${unresolved.length} of ${refs.size} references in 05 name a system 04 does not contain. e.g. ${unresolved.slice(0, 4).join(", ")}`,
          detail: { unresolved },
        });
      }
    }
  }

  const nums = values(four, "annual_cost_usd").map((v) => Number(v.replace(/[,$]/g, ""))).filter(Number.isFinite);
  if (nums.length >= 30) {
    const distinct = new Set(nums).size;
    const perHundred = (distinct / nums.length) * 100;
    if (perHundred < 5) {
      const counts = new Map();
      for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
      findings.push({ code: "degenerate_numeric_distribution", severity: "error", tenant: key,
        message: `04.annual_cost_usd: ${distinct} distinct values across ${nums.length} rows (${perHundred.toFixed(1)} per 100). ${top.map(([v, c]) => `${c} rows at $${v.toLocaleString()}`).join("; ")}. A figure repeating across hundreds of rows is a tier label, not a per-row measurement.` });
    }
  }
}

for (const col of ["integration_type", "refresh_frequency", "quality_status"]) {
  const spaces = Object.entries(byTenantFive).map(([t, rows]) => [t, new Set(values(rows, col))]);
  if (spaces.length < 2) continue;
  for (const [tenant, space] of spaces) {
    if (space.size === 0) continue;
    const others = spaces.filter(([k]) => k !== tenant);
    if ([...space].some((v) => others.some(([, s]) => s.has(v)))) continue;
    findings.push({ code: "vocabulary_drift_across_tenants", severity: "warning", tenant,
      message: `05.${col} shares no value with any other tenant (${space.size} distinct: ${[...space].slice(0, 5).join(", ")}...). Classify into a declared vocabulary rather than matching these strings.` });
  }
}

// Directories on disk that the registry does not declare active.
const onDisk = fs.existsSync(ACTIVE_DIR) ? fs.readdirSync(ACTIVE_DIR).filter((d) =>
  fs.statSync(path.join(ACTIVE_DIR, d)).isDirectory()) : [];
const activeKeys = new Set(active.map((t) => t.tenantKey));
const strays = onDisk.filter((d) => !activeKeys.has(d));

console.log(`Source integrity — ${active.length} ACTIVE tenants from tenant-input-registry.json`);
console.log(`  ${active.map((t) => t.tenantKey).join(", ")}\n`);

if (strays.length) {
  console.log(`Directories present under active/ that the registry does not declare active:`);
  for (const s of strays) {
    console.log(`  ${s}${retiredKeys.has(s) ? "  (RETIRED in registry — leftover pending purge)" : "  (UNKNOWN to registry)"}`);
  }
  console.log(`  These are not refreshed. Identity is declared, never inferred from a directory name.\n`);
}

if (!findings.length) { console.log("No findings for active tenants."); }
else {
  for (const f of findings) console.log(`[${f.severity}] ${f.code} · ${f.tenant}\n  ${f.message}\n`);
  const errors = findings.filter((f) => f.severity === "error");
  console.log(`${findings.length} findings, ${errors.length} errors.`);
  if (process.argv.includes("--strict") && errors.length) process.exit(1);
}
