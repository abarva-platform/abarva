#!/usr/bin/env node
// Gate 2.1 Phase D, increment 1 (zero-write against active/current). Fixes a
// real, confirmed corruption found while investigating the blocker ledger's
// cross-domain referential-integrity findings: `data_assets_integrations.
// source_system` and `metrics_outcomes.data_source` are the literal string
// "standard_2026_07_v3" (the v3 TEMPLATE SET ID, not a system reference) for
// 100% of rows across apex-retail, first-capital-financial, and
// lakeshore-holdings. skyharbor-air's `metrics_outcomes.data_source` carries
// an analogous but different bogus literal
// ("skyharbor-air-v6-v7-upgrade-candidate-20260710" -- a residual packet/
// file identifier). Confirmed via direct sampling: the value predates the
// only commit touching these active files, so it was never real content to
// begin with -- not something a prior process destroyed.
//
// WHY THIS DOESN'T GUESS A REPLACEMENT: an earlier hypothesis for this fix
// was to keyword-match each row against the tenant's own real 04_
// applications_systems.csv values and backfill a specific system name. That
// was rejected: there is no per-row signal left in the corrupted data
// linking a specific row to a specific real system (the corruption replaced
// whatever real value existed, and it isn't recoverable), so fabricating a
// per-row match would be exactly the "silently infer unsupported identity"
// this whole workstream has been built to avoid. Blanking the corrupted
// literal converts a confidently-WRONG value into an honestly-blank one --
// a real improvement (Gate 2's semantic-quality audit now correctly reports
// `not_applicable` for the affected cross-domain check instead of a
// misleading 0%-resolution "blocker" that looked like real, if broken,
// data), even though it does not achieve full referential resolution.
// Real backfill is separate, later work requiring either more source-data
// archaeology or an explicit governed-content decision.
//
// A SIBLING FIX CONSIDERED AND REJECTED: evidence_sources.source_owner shows
// 0% coverage for several tenants. Investigation found the underlying V3
// active-file rows genuinely DO carry real owner values (e.g. "VP Store
// Operations", "CDAO") -- but multiple rows sharing the same evidence_location
// (the source-grouping key) carry DIFFERENT owner values, meaning this is
// the same per-citation-stakeholder-vs-shared-source-owner field-role hazard
// Gate 1.2 already fixed elsewhere. Passing these values through would
// reintroduce that exact bug (false source-metadata conflicts), not fix a
// gap. NOT touched here; left for governed real-content backfill.
//
// HARD GUARANTEES: zero writes to active/current, tenant-input-registry.json,
// Postgres, or any runtime path. Output lands only under
// datasets/tenant-inputs/candidates/<tenant>/gate-2-1-phase-d-v1/ and
// reports/tenant-semantic-remediation/.
//
// Run: node scripts/data-build/tenant-scenario-model/fix-placeholder-corrupted-references.mjs
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/tenant-semantic-remediation");
const CANDIDATE_VERSION = "gate-2-1-phase-d-v1";

// tenant -> [{ file, column, corruptedValues }]. Confirmed via direct sampling
// against the real active files, not assumed from the column name alone.
const TARGETS = {
  "apex-retail": [
    { file: "05_data_assets_integrations.csv", column: "source_system", corruptedValues: ["standard_2026_07_v3"] },
    { file: "14_metrics_outcomes.csv", column: "data_source", corruptedValues: ["standard_2026_07_v3"] },
  ],
  "first-capital-financial": [
    { file: "05_data_assets_integrations.csv", column: "source_system", corruptedValues: ["standard_2026_07_v3"] },
    { file: "14_metrics_outcomes.csv", column: "data_source", corruptedValues: ["standard_2026_07_v3"] },
  ],
  "lakeshore-holdings": [
    { file: "05_data_assets_integrations.csv", column: "source_system", corruptedValues: ["standard_2026_07_v3"] },
    { file: "14_metrics_outcomes.csv", column: "data_source", corruptedValues: ["standard_2026_07_v3"] },
  ],
  "skyharbor-air": [
    { file: "14_metrics_outcomes.csv", column: "data_source", corruptedValues: ["skyharbor-air-v6-v7-upgrade-candidate-20260710"] },
  ],
};

function activeFilePath(tenantKey, fileName) {
  return path.join(repoRoot, "datasets/tenant-inputs/active", tenantKey, "current", fileName);
}

function candidateFilePath(tenantKey, fileName) {
  return path.join(repoRoot, "datasets/tenant-inputs/candidates", tenantKey, CANDIDATE_VERSION, fileName);
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(filePath, rows, columns) {
  const lines = [columns.join(","), ...rows.map((r) => columns.map((c) => csvEscape(r[c])).join(","))];
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, lines.join("\n") + "\n");
}

function fixTenant(tenantKey, targets) {
  const results = [];
  for (const { file, column, corruptedValues } of targets) {
    const inputPath = activeFilePath(tenantKey, file);
    const text = fs.readFileSync(inputPath, "utf8");
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const columns = Object.keys(parsed.data[0] || {});
    let correctedCount = 0;
    const rows = parsed.data.map((row) => {
      if (corruptedValues.includes(row[column])) {
        correctedCount += 1;
        return { ...row, [column]: "" };
      }
      return row;
    });
    const candidatePath = candidateFilePath(tenantKey, file);
    writeCsv(candidatePath, rows, columns);
    results.push({
      tenant: tenantKey,
      domain: file.replace(/^\d{2}_/, "").replace(/\.csv$/, ""),
      column,
      total_rows: rows.length,
      rows_corrected_from_placeholder_to_honest_blank: correctedCount,
      corrupted_values_removed: corruptedValues,
      candidate_output: path.relative(repoRoot, candidatePath),
    });
  }
  return results;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const allResults = [];
  for (const [tenantKey, targets] of Object.entries(TARGETS)) {
    allResults.push(...fixTenant(tenantKey, targets));
  }
  const report = {
    generated_by: "scripts/data-build/tenant-scenario-model/fix-placeholder-corrupted-references.mjs",
    candidate_version: CANDIDATE_VERSION,
    what_this_does: "Replaces confirmed placeholder/packet-identifier literal values with an honest blank -- does NOT fabricate a per-row replacement value, since no real per-row signal survives the corruption to ground one.",
    what_this_does_not_do: "Does not resolve the underlying cross-domain referential-integrity check to 'pass' -- converts it from a misleading 'blocker' (confidently wrong data) to an honest 'not_applicable' (openly blank, needing real backfill later).",
    results: allResults,
  };
  fs.writeFileSync(path.join(outDir, "placeholder-corruption-fix-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  return report;
}

export { TARGETS, fixTenant, CANDIDATE_VERSION };

const isDirectlyExecuted = import.meta.url === `file://${process.argv[1]}`;
if (isDirectlyExecuted) {
  main();
}
