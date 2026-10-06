#!/usr/bin/env node
/**
 * A triage verdict whose subject file is gone must say where the subject went.
 *
 * `triage-record-census-reconciliation.mjs` already counts these rows, under
 * the name `verdictsNamingNoFile`, and calls them "a verdict nothing can
 * expire". It reports and exits 0, and the CI gate registry classifies it
 * `report` deliberately: the rows it prints under an open verdict are work that
 * is OWED, and failing on owed work turns a queue into a red build.
 *
 * That reasoning is correct and this gate does not touch it. It covers the one
 * sub-case the reasoning does not reach: a row whose subject is no longer in
 * the tree is not owed work, because there is nothing left for an executor to
 * do to it. Its `verdict` and `currentAction` still address a future reader
 * about a path that cannot be opened, and no amount of executing closes it.
 * The only repair is to record where the subject went — which four rows across
 * three records already do, through `movedTo` or `replacedBy`, so the
 * convention is established rather than invented here.
 *
 * Measured when this gate was written: five rows of
 * `docs/architecture/t509-stale-suite-triage.json` read
 * `currentAction: "Leave untouched for T-513 to …"` for five files that T-513
 * itself deleted, in the same change that replaced each with a rendering suite
 * (`0d7327deb1`, PR #8167, 2026-09-21). The instruction outlived its subject by
 * two weeks with nothing able to say so.
 *
 * A discharge must also RESOLVE: `movedTo.path` / `replacedBy` has to name a
 * file that exists. Otherwise a dead row is dischargeable by pointing it at
 * another dead row, which is the same defect with an extra hop.
 *
 *   node scripts/quality/triage-verdict-discharge-check.mjs
 *   node scripts/quality/triage-verdict-discharge-check.mjs --json
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectInvocation } from "../exec/cli-entry.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "..", "..");
const TRIAGE_DIRECTORY = "docs/architecture";
const TRIAGE_RECORD_RE = /triage.*\.json$/;

/** The successor a row declares, by either spelling, or null. */
export function declaredSuccessor(suite) {
  const moved = suite?.movedTo;
  if (typeof moved === "string" && moved.trim() !== "") {
    return { path: moved, field: "movedTo" };
  }
  if (moved && typeof moved === "object" && typeof moved.path === "string" && moved.path.trim() !== "") {
    return { path: moved.path, field: "movedTo.path" };
  }
  const replaced = suite?.replacedBy;
  if (typeof replaced === "string" && replaced.trim() !== "") {
    return { path: replaced, field: "replacedBy" };
  }
  if (replaced && typeof replaced === "object" && typeof replaced.path === "string" && replaced.path.trim() !== "") {
    return { path: replaced.path, field: "replacedBy.path" };
  }
  return null;
}

/**
 * Every triage row whose own subject is absent from the tree, each marked with
 * whether it declares a successor and whether that successor resolves.
 */
export function auditDischarges(root) {
  const directory = path.join(root, TRIAGE_DIRECTORY);
  const rows = [];
  if (existsSync(directory)) {
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
        if (existsSync(path.join(root, suite.path))) continue;
        const successor = declaredSuccessor(suite);
        rows.push({
          record: `${TRIAGE_DIRECTORY}/${file}`,
          testPath: suite.path,
          verdict: suite.verdict ?? null,
          ownerItem: suite.ownerItem ?? null,
          successor: successor?.path ?? null,
          successorField: successor?.field ?? null,
          successorResolves: successor ? existsSync(path.join(root, successor.path)) : false,
        });
      }
    }
  }
  rows.sort((a, b) =>
    a.testPath.localeCompare(b.testPath) || a.record.localeCompare(b.record),
  );
  const undeclared = rows.filter((row) => row.successor === null);
  const unresolved = rows.filter((row) => row.successor !== null && !row.successorResolves);
  return {
    absentSubjectRows: rows,
    undeclared,
    unresolved,
    discharged: rows.filter((row) => row.successor !== null && row.successorResolves),
  };
}

function main() {
  const report = auditDischarges(REPO_ROOT);
  if (process.argv.slice(2).includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  }
  const problems = [];
  for (const row of report.undeclared) {
    problems.push(
      `${row.record}: "${row.testPath}" is not in the tree and the row declares no ` +
        `successor — record where the subject went with movedTo or replacedBy ` +
        `(verdict=${row.verdict}, owner=${row.ownerItem})`,
    );
  }
  for (const row of report.unresolved) {
    problems.push(
      `${row.record}: "${row.testPath}" declares ${row.successorField}=` +
        `"${row.successor}", which is not in the tree either — a discharge has to resolve`,
    );
  }
  if (problems.length > 0) {
    console.error(
      `Triage verdict discharge failed: ${problems.length} row(s) address a path ` +
        `that no longer exists.`,
    );
    for (const problem of problems) console.error(`  ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Triage verdict discharge passed: ${report.absentSubjectRows.length} row(s) ` +
      `name an absent subject, all ${report.discharged.length} declaring a successor that resolves.`,
  );
}

if (isDirectInvocation(import.meta.url)) main();
