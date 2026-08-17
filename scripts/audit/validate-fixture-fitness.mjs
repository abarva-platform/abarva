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
  /**
   * Document depth, not breadth.
   *
   * The first version of this gate asked what share of the register had document packets and
   * reported 3%. Both halves of that were wrong. The counter only matched PDFs in a `documents/`
   * directory, so it missed the markdown contract files entirely — there are 41 documents, not 8.
   * And the threshold encoded a premise that does not survive contact with an engagement: no client
   * hands over executed agreements for every contract they hold. They hand over the ones in scope —
   * the largest, the ones renewing, the one being renegotiated.
   *
   * Chasing breadth would have manufactured fifty document sets no client would ever produce, making
   * the fixture less credible rather than more. So the question is depth: do the contracts that *are*
   * documented carry a full file, and are they the contracts that would actually be in scope?
   */
  minDocumentedContracts: 2,
  minDocumentsPerContract: 6,
  /** A document below this is a stub: clause headings with a summary line, no operative language. */
  minWordsPerDocument: 300,
  /** A documented contract should be in the top slice of the register by value. */
  documentedContractTopPercentile: 0.35,
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

/**
 * Every synthetic contract document under the source roots, grouped by contract id.
 *
 * Walks the tree rather than looking in one directory: documents live under `documents/`,
 * `synthetic/`, and `layer_1_client_intake/documents/` depending on which lane produced them, and a
 * counter that knows about only one of those undercounts by a factor of five.
 */
function documentsByContract(tenantKey) {
  const roots = [
    path.join(ROOT, "datasets/source/contract-intelligence"),
    path.join(ROOT, "datasets/source/contract-optimization"),
  ];
  const stem = tenantKey.split("-")[0];
  const byContract = new Map();

  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      // Everything under these roots is synthetic; requiring the word in the filename skipped a
      // whole generated packet set that simply names its files by contract and document type.
      if (!/\.(md|pdf|txt)$/i.test(entry.name)) continue;
      // Ids appear as CTR-090 or CF-001, with or without a DOC- prefix.
      // Contract ids appear as CTR-090, CF-001, and CTR-MH-004 — an optional tenant infix.
      const id = /((?:CTR|CF|CT)-(?:[A-Z]{2,3}-)?\d+)/i.exec(entry.name)?.[1]?.toUpperCase();
      if (!id) continue;
      if (!byContract.has(id)) byContract.set(id, new Set());
      // Word count, not just the filename. Counting documents was the same mistake as counting
      // records without names: sixteen files of thirty-four lines each is a directory listing that
      // looks like a contract file. A stub passes every count and contains no obligation, no rate,
      // no notice period — nothing a reviewer could actually extract or dispute.
      let words = 0;
      let citationFixture = false;
      try {
        const text = fs.readFileSync(full, "utf8");
        words = text.split(/\s+/).filter(Boolean).length;
        // Some documents are deliberately short: they carry `<!-- page:N span:X-Y -->` markers and
        // exist to test citation-span extraction, not to be read as contracts. Judging them by word
        // count is judging them against a purpose they never had.
        citationFixture = /<!--\s*page:\d+\s+span:/.test(text);
      } catch { /* unreadable file counts as empty */ }
      byContract.get(id).add({ file: entry.name, words, citationFixture });
    }
  };

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root)) {
      if (!dir.toLowerCase().includes(stem)) continue;
      walk(path.join(root, dir));
    }
  }
  return byContract;
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

  const docs = documentsByContract(tenantKey);
  const documented = [...docs.entries()].map(([id, files]) => {
    const list = [...files];
    return {
      id,
      documents: list.length,
      medianWords: list.map((f) => f.words).sort((a, b) => a - b)[Math.floor(list.length / 2)] ?? 0,
      stubs: list.filter((f) => !f.citationFixture && f.words < STANDARD.minWordsPerDocument).length,
      citationFixtures: list.filter((f) => f.citationFixture).length,
    };
  });
  const totalDocuments = documented.reduce((n, d) => n + d.documents, 0);

  if (documented.length < STANDARD.minDocumentedContracts) {
    add("DOC_DEPTH",
      `${documented.length} contracts have document files. An engagement needs at least ` +
      `${STANDARD.minDocumentedContracts} fully documented contracts to demonstrate contract intelligence.`);
  }
  const stubby = documented.filter((d) => d.stubs > 0);
  if (stubby.length) {
    add("DOC_SUBSTANCE",
      `${stubby.length} documented contract(s) contain stub documents under ${STANDARD.minWordsPerDocument} words ` +
      `(${stubby.map((d) => `${d.id}:${d.stubs}/${d.documents} stubs, median ${d.medianWords}w`).join("; ")}). ` +
      `A clause heading with a summary line contains no obligation, rate or notice period — nothing a reviewer can extract or dispute.`);
  }
  const shallow = documented.filter(
    (d) => d.documents - d.citationFixtures > 0 && d.documents < STANDARD.minDocumentsPerContract,
  );
  if (shallow.length) {
    add("DOC_DEPTH",
      `${shallow.length} documented contract(s) carry fewer than ${STANDARD.minDocumentsPerContract} documents ` +
      `(${shallow.map((d) => `${d.id}:${d.documents}`).join(", ")}). A contract file with only an agreement and a ` +
      `pricing schedule cannot show amendment drift, renewal leverage, or exit terms.`);
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
    documentedContracts: documented.length,
    totalDocuments,
    documentsPerContract: documented.map((d) => `${d.id}:${d.documents}@${d.medianWords}w`),
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
