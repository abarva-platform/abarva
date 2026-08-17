#!/usr/bin/env node
/**
 * Fixture fitness gate — is the synthetic substrate credible enough to demonstrate the product?
 *
 * Every existing check asks whether the data loaded correctly. All of them pass. What none of them
 * ask is whether the data is *worth loading*: whether an $81B airline's largest vendor contract at
 * $62M would survive thirty seconds of a CIO's attention, whether a 137-contract register backed by
 * eight documents can demonstrate contract intelligence, whether four empty columns are the four
 * that Source needs to evidence a saving.
 *
 * They were, it cannot, and they were. None of it failed anything, because structural correctness
 * and fitness for purpose are different questions and only the first was being asked.
 *
 * This asks the second. It is a fixture gate, not a client gate: real client data is whatever the
 * client's business actually is, and none of these thresholds should ever be applied to it. Synthetic
 * data has no such excuse — it is authored, so if it is not credible that is a choice someone made.
 *
 * Usage:
 *   node scripts/audit/validate-fixture-fitness.mjs [--strict]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");

/**
 * The locked volumetric standard for synthetic tenants, plus the depth thresholds this audit added.
 *
 * The counts come from the standard. The ratios come from what an enterprise of that size actually
 * looks like: a vendor book roughly proportional to revenue, and a contract value distribution that
 * follows a power law rather than sitting under a flat ceiling. The flat ceiling is the tell — real
 * portfolios have a handful of contracts that dominate, and a fixture without them cannot
 * demonstrate concentration risk, renewal leverage, or a credible savings case.
 */
const STANDARD = {
  /**
   * Enterprise scale, not a blanket $50B. The original standard was a single number, and a $25B
   * integrated delivery network fails it while being an entirely credible enterprise client — the
   * rule was proxying for "not an SMB" and a flat threshold is the wrong instrument for that.
   */
  minRevenueUsd: 20e9,
  minApplications: 180,
  minPrograms: 35,
  minInfrastructure: 40,
  /** Vendor contracts per $10B of revenue. */
  minVendorsPer10B: 25,
  /** The largest contract should be at least this share of the vendor book. */
  minTopContractShare: 0.08,
  /** No column on the vendor register may be emptier than this. */
  minColumnFill: 0.5,
  /** Share of the contract register that should have generated document packets. */
  minDocumentCoverage: 0.25,
};

function parseCsv(text) {
  const rows = [];
  let field = "", row = [], quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const usd = (n) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(0)}M`);

const findings = [];
const report = [];

/** Documents generated per contract, so coverage is measured against contracts rather than files. */
function documentCoverage(tenantKey, contractCount) {
  const roots = [
    path.join(ROOT, "datasets/source/contract-intelligence"),
    path.join(ROOT, "datasets/source/contract-optimization"),
  ];
  const stem = tenantKey.split("-")[0];
  const covered = new Set();
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root)) {
      if (!dir.toLowerCase().includes(stem)) continue;
      const docs = path.join(root, dir, "documents");
      if (!fs.existsSync(docs)) continue;
      for (const file of fs.readdirSync(docs)) {
        // Documents are named <CONTRACT-ID>_<Vendor>_<DOCTYPE>_SYNTHETIC.*; the id is the key.
        const id = /^([A-Z]+-\d+)/.exec(file)?.[1];
        if (id) covered.add(id);
      }
    }
  }
  return { contractsWithDocuments: covered.size, contractCount };
}

const tenants = fs.existsSync(ACTIVE)
  ? fs.readdirSync(ACTIVE).filter((d) => fs.statSync(path.join(ACTIVE, d)).isDirectory())
  : [];

for (const tenantKey of tenants) {
  const dir = path.join(ACTIVE, tenantKey, "current");
  const read = (f) => {
    const p = path.join(dir, f);
    return fs.existsSync(p) ? parseCsv(fs.readFileSync(p, "utf8")) : [];
  };
  const profile = read("00_enterprise_profile.csv")[0];
  if (!profile) continue;

  const apps = read("04_applications_systems.csv");
  const infra = read("06_infrastructure_platforms.csv");
  const vendors = read("07_vendors_contracts.csv");
  const programs = read("09_programs_initiatives.csv");
  const revenue = num(profile.revenue_usd);

  const add = (kind, message) => findings.push({ tenantKey, kind, message });

  if (revenue > 0 && revenue < STANDARD.minRevenueUsd) {
    add("REVENUE", `Revenue ${usd(revenue)} is below the ${usd(STANDARD.minRevenueUsd)} synthetic standard. Every downstream figure inherits the wrong scale.`);
  }
  if (apps.length && apps.length < STANDARD.minApplications) {
    add("VOLUME", `${apps.length} applications, below the floor of ${STANDARD.minApplications}.`);
  }
  if (programs.length < STANDARD.minPrograms) {
    add("VOLUME", `${programs.length} programs, below the floor of ${STANDARD.minPrograms}. Moves and Tower cannot show a credible portfolio at this depth.`);
  }
  if (infra.length < STANDARD.minInfrastructure) {
    add("VOLUME", `${infra.length} infrastructure platforms — thin for an estate of ${apps.length} applications.`);
  }

  let topShare = null;
  let vendorTotal = 0;
  if (vendors.length) {
    const expected = Math.round((revenue / 10e9) * STANDARD.minVendorsPer10B);
    if (revenue > 0 && vendors.length < expected) {
      add("VENDOR_DEPTH", `${vendors.length} vendor contracts for ${usd(revenue)} of revenue; a credible book at this scale is nearer ${expected}.`);
    }
    const values = vendors.map((v) => num(v.annual_spend_usd)).sort((a, b) => b - a);
    vendorTotal = values.reduce((a, b) => a + b, 0);
    topShare = vendorTotal > 0 ? values[0] / vendorTotal : 0;
    if (vendorTotal > 0 && topShare < STANDARD.minTopContractShare) {
      add("DISTRIBUTION",
        `Largest contract is ${usd(values[0])}, only ${(topShare * 100).toFixed(1)}% of a ${usd(vendorTotal)} book. ` +
        `Real portfolios are dominated by a few contracts; a flat ceiling cannot demonstrate concentration risk or renewal leverage.`);
    }
    const columns = Object.keys(vendors[0]);
    const thin = columns.filter(
      (c) => vendors.filter((r) => (r[c] ?? "").trim()).length / vendors.length < STANDARD.minColumnFill,
    );
    if (thin.length) {
      add("COLUMN_FILL", `${thin.length} vendor columns under ${STANDARD.minColumnFill * 100}% filled: ${thin.join(", ")}. Source cannot evidence a saving from an empty column.`);
    }
  }

  const cov = documentCoverage(tenantKey, vendors.length);
  const covShare = cov.contractCount > 0 ? cov.contractsWithDocuments / cov.contractCount : 0;
  if (cov.contractCount > 0 && covShare < STANDARD.minDocumentCoverage) {
    add("DOC_COVERAGE",
      `${cov.contractsWithDocuments} of ${cov.contractCount} contracts have document packets (${(covShare * 100).toFixed(0)}%). ` +
      `Contract intelligence cannot be demonstrated against a register that is almost entirely undocumented.`);
  }

  report.push({
    tenantKey,
    industry: profile.industry ?? null,
    revenue,
    applications: apps.length,
    infrastructure: infra.length,
    vendorContracts: vendors.length,
    programs: programs.length,
    vendorBook: vendorTotal,
    topContractShare: topShare === null ? null : Number((topShare * 100).toFixed(1)),
    contractsWithDocuments: cov.contractsWithDocuments,
    documentCoveragePct: Number((covShare * 100).toFixed(0)),
  });
}

console.log(JSON.stringify({ standard: STANDARD, tenantsChecked: report.length, report, findings }, null, 2));

if (findings.length === 0) {
  console.log("\npass — every synthetic tenant is credible at its stated scale.");
  process.exit(0);
}

console.error(`\n${findings.length} fixture fitness finding(s):`);
for (const f of findings) console.error(`  [${f.kind}] ${f.tenantKey}: ${f.message}`);

// Same reasoning as the spend gate: report first, block once the fixtures are corrected. A gate that
// fails from the day it lands gets switched off rather than satisfied.
if (STRICT) {
  console.error("\nfail — fixtures are not credible at their stated scale.");
  process.exit(1);
}
console.error("\nwarn — not blocking. Run with --strict once the fixtures above are corrected.");
process.exit(0);
