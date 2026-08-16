#!/usr/bin/env node

/**
 * Intake coverage gate — every source file must be claimed by a domain.
 *
 * The projection gate checks the far end of the pipeline: which canonical types reach a product.
 * This checks the near end, and it is the one whose absence hid a bigger problem. The canonical
 * build discovers source files by matching filenames against per-domain regex patterns. A file
 * that matches nothing is not an error — it is simply never read. No warning, no count, no gap
 * in any report. It just is not there.
 *
 * Two real defects this catches, both live today:
 *
 *   1. `18_operational_process_evidence.csv` has a domain AND a canonical object type, but its
 *      patterns are /operational[_-]evidence/ and /process[_-]intelligence/ — neither matches
 *      "operational_process_evidence", because the real filename has "process" in the middle.
 *      The build emits 18 object types, not the 19 it declares. 60 rows silently dropped.
 *
 *   2. Seven files have no domain at all: the AI benefits/usage/interview/KPI feeds, ITSM SLA
 *      performance, platform maturity, and the interview-to-object crosswalk. These are
 *      disproportionately Tower and Moves inputs, which is a plausible reason Tower built its
 *      own telemetry pipeline: the client-declared data it needed was never being read.
 *
 * A file that should not be ingested is fine — but it has to say so. Unclaimed-by-accident and
 * excluded-on-purpose look identical from the outside, and only one of them is a decision.
 *
 * Usage:
 *   node scripts/audit/validate-intake-coverage.mjs [--json] [--strict]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const AS_JSON = process.argv.includes("--json");
const STRICT = process.argv.includes("--strict");

const ACTIVE_ROOT = "datasets/tenant-inputs/active";
const BUILD_SRC = "src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts";

/**
 * Files deliberately not ingested by the canonical build. An entry here is a decision with a
 * reason attached; absence from both this list and the domain matchers is an accident.
 */
const DECLARED_NOT_INGESTED = Object.freeze({});

/** Parse the domain matchers out of the canonical build rather than duplicating them. */
function loadDomainMatchers() {
  const src = fs.readFileSync(path.join(ROOT, BUILD_SRC), "utf8");
  const block = /const DOMAIN_MATCHERS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(src);
  if (!block) throw new Error("could not locate DOMAIN_MATCHERS in the canonical build");
  // Strip line comments first. A `//` inside a comment is indistinguishable from a regex
  // delimiter to the extractor below, and a comment added beside a pattern would otherwise be
  // parsed as one — which is exactly how this parser broke the first time.
  const body = block[1].replace(/^\s*\/\/.*$/gm, "");
  // Slice on domain boundaries rather than trying to match a whole entry in one regex. A
  // pattern containing a character class or an alternation group makes a single "up to the
  // next ]," expression unreliable — service_scope_managed_services was dropped that way, which
  // would have silently under-reported the domain count.
  const marks = [...body.matchAll(/domain:\s*"([a-z_]+)"/g)];
  const matchers = [];
  marks.forEach((mark, i) => {
    const from = mark.index;
    const to = i + 1 < marks.length ? marks[i + 1].index : body.length;
    const slice = body.slice(from, to);
    const patterns = [...slice.matchAll(/\/((?:[^/\\\n]|\\.)+)\/([gimsuy]*)/g)].map(
      (p) => new RegExp(p[1], p[2] || ""),
    );
    matchers.push({ domain: mark[1], patterns });
  });
  return matchers;
}

const matchers = loadDomainMatchers();

const tenants = fs.existsSync(path.join(ROOT, ACTIVE_ROOT))
  ? fs.readdirSync(path.join(ROOT, ACTIVE_ROOT)).filter((d) =>
      fs.statSync(path.join(ROOT, ACTIVE_ROOT, d)).isDirectory(),
    )
  : [];

const results = [];
const unclaimed = [];
const emptyDomains = new Set(matchers.map((m) => m.domain));

for (const tenant of tenants) {
  const dir = path.join(ROOT, ACTIVE_ROOT, tenant, "current");
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".csv")).sort();
  const claimed = [];
  for (const file of files) {
    const hits = matchers.filter((m) => m.patterns.some((p) => p.test(file)));
    if (hits.length === 0) {
      if (DECLARED_NOT_INGESTED[file]) {
        claimed.push({ file, domain: null, declared: DECLARED_NOT_INGESTED[file] });
      } else {
        unclaimed.push({ tenant, file });
      }
      continue;
    }
    if (hits.length > 1) {
      unclaimed.push({
        tenant,
        file,
        ambiguous: hits.map((h) => h.domain),
      });
      continue;
    }
    hits.forEach((h) => emptyDomains.delete(h.domain));
    claimed.push({ file, domain: hits[0].domain });
  }
  results.push({ tenant, fileCount: files.length, claimed: claimed.length, unclaimed: files.length - claimed.length });
}

/** A domain that matches no file anywhere is either dead or its pattern is wrong. */
const deadDomains = [...emptyDomains];

if (AS_JSON) {
  console.log(JSON.stringify({ results, unclaimed, deadDomains }, null, 2));
} else {
  console.log("intake coverage");
  console.log(`  domains declared : ${matchers.length}`);
  for (const r of results) {
    const flag = r.unclaimed > 0 ? "  <-- files never read" : "";
    console.log(`  ${r.tenant.padEnd(20)} ${String(r.claimed).padStart(3)}/${String(r.fileCount).padEnd(3)} claimed${flag}`);
  }

  if (unclaimed.length) {
    console.log(`\nFILES NEVER READ (${unclaimed.length}):`);
    for (const u of unclaimed) {
      const why = u.ambiguous ? `matched ${u.ambiguous.length} domains: ${u.ambiguous.join(", ")}` : "matched no domain";
      console.log(`  - ${u.tenant}/${u.file}`);
      console.log(`      ${why}`);
    }
    console.log("\n  Each must either match a domain, or be added to DECLARED_NOT_INGESTED with a reason.");
  }

  if (deadDomains.length) {
    console.log(`\nDOMAINS MATCHING NO FILE (${deadDomains.length}):`);
    for (const d of deadDomains) {
      console.log(`  - ${d}  — the domain and its object type exist, but its patterns match nothing`);
    }
  }
}

const failed = deadDomains.length > 0 || (STRICT && unclaimed.length > 0);
if (!AS_JSON) {
  console.log(
    failed
      ? "\nFAIL"
      : unclaimed.length
        ? "\npass — no dead domains. Unread files above are reported, not enforced; run with --strict to enforce."
        : "\npass — every source file is claimed by exactly one domain, and every domain matches a file.",
  );
}
process.exit(failed ? 1 : 0);
