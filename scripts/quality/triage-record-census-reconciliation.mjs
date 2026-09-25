#!/usr/bin/env node
/**
 * Which files the CI coverage census calls `untriaged` although somebody has
 * already written a verdict for them.
 *
 * T-763 opened with this question and it took a hand-written cross-reference to
 * answer, which is the cost the item is about: the census reads two declared
 * shapes and `docs/architecture/*triage*.json` is neither, so a verdicted file
 * reads as untriaged and the next person to draw the governed-risk ranking
 * re-derives the analysis. This makes the cross-reference a command instead.
 *
 * It is a measurement, not a gate. It always exits 0 and decides nothing.
 * The gate is `check-source-workspace-quarantine.mjs`, which is scoped to the
 * verdicts that declare a HOLD; the rows this prints under any other verdict
 * are work that is owed, and crediting those as triaged would subtract queued
 * work from the ranking that decides what gets wired next.
 *
 *   node scripts/quality/triage-record-census-reconciliation.mjs
 *   node scripts/quality/triage-record-census-reconciliation.mjs --json
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectInvocation } from "../exec/cli-entry.mjs";
import { buildCensus } from "./test-ci-coverage-census.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "..", "..");
const TRIAGE_DIRECTORY = "docs/architecture";
const TRIAGE_RECORD_RE = /triage.*\.json$/;

/** Every `{ path -> [{ record, verdict, ownerItem }] }` the triage records hold. */
export function verdictsByPath(root) {
  const directory = path.join(root, TRIAGE_DIRECTORY);
  const byPath = new Map();
  if (!existsSync(directory)) return byPath;
  for (const file of readdirSync(directory).sort()) {
    if (!TRIAGE_RECORD_RE.test(file)) continue;
    let payload;
    try {
      payload = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
    } catch {
      continue;
    }
    for (const suite of Array.isArray(payload?.suites) ? payload.suites : []) {
      if (typeof suite?.path !== "string") continue;
      const list = byPath.get(suite.path) ?? [];
      list.push({
        record: `${TRIAGE_DIRECTORY}/${file}`,
        verdict: suite.verdict ?? null,
        ownerItem: suite.ownerItem ?? suite.wiredBy ?? null,
      });
      byPath.set(suite.path, list);
    }
  }
  return byPath;
}

export function reconcile(root) {
  const census = buildCensus(root, { includeFileStatuses: true });
  const byPath = verdictsByPath(root);
  const walked = new Set(census.fileStatuses.map((file) => file.testPath));
  const untriagedWithVerdict = census.fileStatuses
    .filter((file) => file.untriaged && byPath.has(file.testPath))
    .map((file) => ({ testPath: file.testPath, verdicts: byPath.get(file.testPath) }))
    .sort((a, b) => a.testPath.localeCompare(b.testPath));
  // A verdict naming a file that is no longer in the tree is the other half of
  // the same defect: it cannot expire, because nothing re-reads it.
  const verdictsNamingNoFile = [...byPath.entries()]
    .filter(([testPath]) => !walked.has(testPath))
    .map(([testPath, verdicts]) => ({ testPath, verdicts }))
    .sort((a, b) => a.testPath.localeCompare(b.testPath));
  const credited = census.fileStatuses.filter(
    (file) => file.declaredQuarantine && byPath.has(file.testPath),
  );
  return {
    untriagedUnrunTestFiles: census.counts.untriagedUnrunTestFiles,
    pathsCarryingAVerdict: byPath.size,
    untriagedWithVerdict,
    untriagedWithoutVerdict:
      census.counts.untriagedUnrunTestFiles - untriagedWithVerdict.length,
    creditedAndVerdicted: credited.map((file) => file.testPath).sort(),
    verdictsNamingNoFile,
  };
}

function main() {
  const report = reconcile(REPO_ROOT);
  if (process.argv.slice(2).includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(
    `triage-record reconciliation: ${report.untriagedWithVerdict.length} of ` +
      `${report.untriagedUnrunTestFiles} untriaged unrun test files already ` +
      `carry a verdict; ${report.untriagedWithoutVerdict} carry none.`,
  );
  for (const row of report.untriagedWithVerdict) {
    console.log(`\n  ${row.testPath}`);
    for (const verdict of row.verdicts) {
      console.log(
        `      ${verdict.record}  verdict=${verdict.verdict}  owner=${verdict.ownerItem}`,
      );
    }
  }
  console.log(
    `\n  ${report.creditedAndVerdicted.length} verdicted file(s) are credited ` +
      `as declared quarantine, so their verdict and the census agree.`,
  );
  if (report.verdictsNamingNoFile.length > 0) {
    console.log(
      `\n  ${report.verdictsNamingNoFile.length} verdict path(s) name a file ` +
        `the census does not walk — a verdict nothing can expire:`,
    );
    for (const row of report.verdictsNamingNoFile) {
      console.log(
        `      ${row.testPath}  (${row.verdicts.map((v) => v.record).join(", ")})`,
      );
    }
  }
}

if (isDirectInvocation(import.meta.url)) main();
