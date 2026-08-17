#!/usr/bin/env node

/**
 * Fact basis gate.
 *
 * Every canonical fact must say how it came to be known. The reason is a real case: a client
 * workbook declares annual spend of $44M while metered cloud cost reports $51M. Neither is
 * wrong — one is a budget, the other is consumption — but with no way to distinguish them the
 * only available moves were to overwrite one, keep them in separate stores, or mark the metric
 * CONFLICT and refuse to quote it. All three throw away the 16% gap, which is the most useful
 * thing either number can tell you.
 *
 * With a basis, the same metric holds both and the difference becomes a derived fact:
 *
 *   spend_value_fact  basis=declared  $44M   client intake workbook
 *   spend_value_fact  basis=observed  $51M   metered cloud cost
 *   spend_value_fact  basis=derived   +16%   variance
 *
 * Checked here:
 *
 *   1. Every canonical record carries a basis. An unset basis means nobody decided, and the
 *      default would silently label a measurement as a client assertion.
 *
 *   2. Where the same metric exists on more than one basis, that pairing is reported. This is
 *      not a failure — it is the finding — but it must be visible, because a surface quoting
 *      one basis without saying which is how "we spend $51M" gets read as "the client told us
 *      they spend $51M".
 *
 * Usage:
 *   node scripts/audit/validate-fact-basis.mjs [--json] [--strict]
 *
 * --strict additionally fails when a metric carries two bases and no derived variance exists.
 */

import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const AS_JSON = process.argv.includes("--json");
const STRICT = process.argv.includes("--strict");
const VALID = new Set(["declared", "observed", "derived"]);

function loadRecords() {
  // Wrapped in an async IIFE: `tsx -e` compiles as CommonJS here, so top-level await throws.
  const script = `
    (async () => {
      const { buildCanonicalTenantDataReport } = await import(${JSON.stringify(
        path.join(ROOT, "src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts"),
      )});
      const r = await buildCanonicalTenantDataReport({
        repoRoot: ${JSON.stringify(ROOT)},
        tenantKeys: ["meridian-health", "skyharbor-air"],
      });
      process.stdout.write(JSON.stringify(r.canonicalRecords.map((x) => ({
        tenantKey: x.tenantKey,
        objectType: x.objectType,
        key: x.canonicalObjectKey,
        basis: x.sourceAuthority?.basis ?? null,
        sourceSystem: x.sourceAuthority?.sourceSystem ?? null,
      }))));
    })();
  `;
  const out = execFileSync("npx", ["tsx", "-e", script], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1 << 28,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out.slice(out.indexOf("[")));
}

const records = loadRecords();
const failures = [];

// 1. every record declares a basis
const missing = records.filter((r) => !r.basis);
const invalid = records.filter((r) => r.basis && !VALID.has(r.basis));
if (missing.length) {
  const types = [...new Set(missing.map((r) => r.objectType))].slice(0, 8);
  failures.push(
    `${missing.length} canonical record(s) have no basis — nobody has said whether these are declared by the client or observed by the platform. Types: ${types.join(", ")}`,
  );
}
for (const r of invalid.slice(0, 5)) {
  failures.push(`record ${r.key} has basis "${r.basis}", which is not declared|observed|derived`);
}

// 2. metrics carried on more than one basis — the finding, not a fault
const byMetric = new Map();
for (const r of records) {
  const id = `${r.tenantKey}:${r.objectType}`;
  if (!byMetric.has(id)) byMetric.set(id, new Set());
  byMetric.get(id).add(r.basis);
}
const multiBasis = [...byMetric.entries()]
  .filter(([, bases]) => bases.size > 1 && (bases.has("declared") || bases.has("observed")))
  .map(([id, bases]) => ({ id, bases: [...bases].sort() }));

const strictFailures = [];
for (const m of multiBasis) {
  if (!m.bases.includes("derived")) {
    strictFailures.push(
      `${m.id} carries ${m.bases.join(" and ")} but no derived variance — the gap between them is unquantified`,
    );
  }
}

const counts = {};
for (const r of records) counts[r.basis ?? "(unset)"] = (counts[r.basis ?? "(unset)"] ?? 0) + 1;

if (AS_JSON) {
  console.log(JSON.stringify({ counts, multiBasis, failures, strictFailures }, null, 2));
} else {
  console.log("fact basis");
  console.log(`  canonical records : ${records.length}`);
  for (const [basis, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(basis).padEnd(18)}${String(n).padStart(6)}`);
  }
  if (multiBasis.length) {
    console.log(`\n  metrics carried on more than one basis (${multiBasis.length}):`);
    for (const m of multiBasis.slice(0, 12)) {
      console.log(`    - ${m.id}  [${m.bases.join(", ")}]`);
    }
    console.log("\n  This is the finding, not a fault. A surface quoting one of these must say which.");
  } else {
    console.log("\n  No metric yet carries two bases — expected until telemetry collectors land in canonical.");
  }
  if (failures.length) {
    console.log(`\nFAILURES (${failures.length}):`);
    for (const f of failures) console.log(`  - ${f}`);
  }
  if (STRICT && strictFailures.length) {
    console.log(`\nSTRICT FAILURES (${strictFailures.length}):`);
    for (const f of strictFailures) console.log(`  - ${f}`);
  }
}

const failed = failures.length > 0 || (STRICT && strictFailures.length > 0);
if (!AS_JSON) console.log(failed ? "\nFAIL" : "\npass — every canonical fact declares how it came to be known.");
process.exit(failed ? 1 : 0);
