#!/usr/bin/env node
/**
 * A triage verdict that DEFERS must name an authority that resolves.
 *
 * `already_verdicted_elsewhere` is one of the verdict words
 * `test-ci-coverage-census.mjs` treats as "owned residual work": a file
 * carrying it is held out of the stale-suite draw and listed in
 * `triageVerdicts.heldTestPaths`. It is the only held verdict that does not
 * describe work at all. The other six say what is owed — wire it, repair it,
 * rewrite it. This one says *somebody else already said*, and the whole weight
 * of the hold rests on that claim being true.
 *
 * Nothing checked it. Measured 2026-10-05 at `12cc2e81e0`: 39 rows defer,
 * holding 36 of the census's 112 held files, and
 * `drawableUntriagedUnrunTestFiles` is 0 — so a scheduled run that reaches
 * fallback step 3 is told there is no stale-suite work, by a count these rows
 * are the second-largest contributor to. All 39 resolve today. The defect is
 * that this was luck: a referent could be renamed, re-verdicted, or point at
 * another deferral, and the file would stay held with no verdict anywhere and
 * nothing able to say so.
 *
 * Two authority shapes are in the records, and both are legitimate:
 *
 *   record-shaped  `alreadyVerdictedIn` + `verdictThere` (+ `owningItemThere`)
 *                  — 10 rows. Fully checkable here, and checked: the record
 *                  must exist, hold a row for the SAME path, agree with
 *                  `verdictThere`, and not itself be a deferral.
 *   item-shaped    `ownerItem` alone — 29 rows, 25 of them on `T-775`. The
 *                  referent is a backlog item, and the backlog is
 *                  operator-owned (see scripts/exec/README.md), so whether
 *                  that item is still open is NOT decidable from this
 *                  repository. The gate requires the field and reports
 *                  `authorityResolvedInRepo: false` rather than implying it
 *                  verified something it cannot reach.
 *
 * Scoped to stay disjoint from `triage-verdict-discharge-check.mjs` (item 26,
 * PR #8993), which owns the case where the row's own SUBJECT is gone. A row
 * whose subject is absent is skipped here entirely — by construction, not by
 * coincidence, so neither gate reports the other's rows as its own. The two
 * sets happen not to intersect today (0 of 39), which is exactly the kind of
 * accident this comment exists to stop someone relying on.
 *
 *   node scripts/quality/triage-deferral-authority-check.mjs
 *   node scripts/quality/triage-deferral-authority-check.mjs --json
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectInvocation } from "../exec/cli-entry.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "..", "..");
const TRIAGE_DIRECTORY = "docs/architecture";
const TRIAGE_RECORD_RE = /triage.*\.json$/;

/** The verdict word that defers instead of describing work. */
export const DEFERRAL_VERDICT = "already_verdicted_elsewhere";

const text = (value) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

/**
 * The authority a deferral row declares, or null when it declares none.
 *
 * The record shape wins when both are present, because it is the one that can
 * be resolved here; `ownerItem` then travels with it as context rather than as
 * the authority, which is how the existing rows are written.
 */
export function declaredAuthority(suite) {
  const item = text(suite?.ownerItem);
  const record = text(suite?.alreadyVerdictedIn);
  if (record) {
    return {
      kind: "record",
      item,
      record,
      claimedVerdict: text(suite?.verdictThere),
    };
  }
  if (item) return { kind: "item", item, record: null, claimedVerdict: null };
  return null;
}

/** Every triage record under docs/architecture, as path -> row. */
function readTriageRecords(root) {
  const directory = path.join(root, TRIAGE_DIRECTORY);
  const records = new Map();
  if (!existsSync(directory)) return records;
  for (const file of readdirSync(directory).sort()) {
    if (!TRIAGE_RECORD_RE.test(file)) continue;
    let payload;
    try {
      payload = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
    } catch {
      continue;
    }
    const rows = new Map();
    for (const suite of Array.isArray(payload?.suites) ? payload.suites : []) {
      if (typeof suite?.path !== "string") continue;
      rows.set(suite.path, suite);
    }
    records.set(`${TRIAGE_DIRECTORY}/${file}`, rows);
  }
  return records;
}

/**
 * Audit every deferral row whose subject is still in the tree, classifying how
 * its declared authority fails to resolve — or that it does.
 */
export function auditDeferralAuthority(root) {
  const records = readTriageRecords(root);
  const deferralRows = [];
  for (const [record, rows] of records) {
    for (const [testPath, suite] of rows) {
      if (suite.verdict !== DEFERRAL_VERDICT) continue;
      // The discharge gate owns an absent subject. See the header.
      if (!existsSync(path.join(root, testPath))) continue;
      const authority = declaredAuthority(suite);
      deferralRows.push({
        record,
        testPath,
        authorityKind: authority?.kind ?? null,
        authorityRecord: authority?.record ?? null,
        authorityItem: authority?.item ?? null,
        claimedVerdict: authority?.claimedVerdict ?? null,
      });
    }
  }
  deferralRows.sort(
    (a, b) =>
      a.testPath.localeCompare(b.testPath) || a.record.localeCompare(b.record),
  );

  const unauthorised = [];
  const unresolvedRecord = [];
  const missingTargetRow = [];
  const verdictMismatch = [];
  const chained = [];
  const resolved = [];

  for (const row of deferralRows) {
    if (row.authorityKind === null) {
      unauthorised.push(row);
      continue;
    }
    if (row.authorityKind === "item") {
      // Present and non-blank is all this repository can establish.
      resolved.push({ ...row, authorityResolvedInRepo: false });
      continue;
    }
    const target = records.get(row.authorityRecord);
    if (!target) {
      unresolvedRecord.push(row);
      continue;
    }
    const targetRow = target.get(row.testPath);
    if (!targetRow) {
      missingTargetRow.push(row);
      continue;
    }
    const actualVerdict = text(targetRow.verdict);
    if (row.claimedVerdict !== null && actualVerdict !== row.claimedVerdict) {
      verdictMismatch.push({ ...row, actualVerdict });
      continue;
    }
    if (targetRow.verdict === DEFERRAL_VERDICT) {
      chained.push({ ...row, actualVerdict });
      continue;
    }
    resolved.push({ ...row, actualVerdict, authorityResolvedInRepo: true });
  }

  return {
    deferralRows,
    unauthorised,
    unresolvedRecord,
    missingTargetRow,
    verdictMismatch,
    chained,
    resolved,
  };
}

function main() {
  const report = auditDeferralAuthority(REPO_ROOT);
  if (process.argv.slice(2).includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  }
  const problems = [];
  for (const row of report.unauthorised) {
    problems.push(
      `${row.record}: "${row.testPath}" is held by ${DEFERRAL_VERDICT} and names ` +
        `no authority — give it alreadyVerdictedIn (with verdictThere) or ownerItem, ` +
        `or give the file a verdict of its own`,
    );
  }
  for (const row of report.unresolvedRecord) {
    problems.push(
      `${row.record}: "${row.testPath}" defers to "${row.authorityRecord}", which is ` +
        `not a triage record in the tree`,
    );
  }
  for (const row of report.missingTargetRow) {
    problems.push(
      `${row.record}: "${row.testPath}" defers to "${row.authorityRecord}", which ` +
        `holds no row for that path — the verdict it points at does not exist`,
    );
  }
  for (const row of report.verdictMismatch) {
    problems.push(
      `${row.record}: "${row.testPath}" says verdictThere="${row.claimedVerdict}" ` +
        `but "${row.authorityRecord}" says "${row.actualVerdict}"`,
    );
  }
  for (const row of report.chained) {
    problems.push(
      `${row.record}: "${row.testPath}" defers to "${row.authorityRecord}", which ` +
        `defers in turn — a chain holds the file with no verdict at the end of it`,
    );
  }
  if (problems.length > 0) {
    console.error(
      `Triage deferral authority failed: ${problems.length} of ${report.deferralRows.length} ` +
        `deferral row(s) hold a file on an authority that does not resolve.`,
    );
    for (const problem of problems) console.error(`  ${problem}`);
    process.exitCode = 1;
    return;
  }
  const byRecord = report.resolved.filter((row) => row.authorityKind === "record").length;
  const byItem = report.resolved.length - byRecord;
  console.log(
    `Triage deferral authority passed: ${report.deferralRows.length} row(s) defer, ` +
      `${byRecord} to a record that carries the named verdict, ${byItem} to an owner ` +
      `item this repository cannot resolve (the backlog is operator-owned).`,
  );
}

if (isDirectInvocation(import.meta.url)) main();
