#!/usr/bin/env node
/**
 * Behavioural contract for the L4 RLS regression result classifier (item C-627).
 *
 * The subject is the verdict, not the prose. Three outcomes have to stay apart
 * and they are not symmetric, so the cases are written around the asymmetry:
 *
 *   GREEN   asserts the tenant-isolation boundary was exercised and held. A
 *           false GREEN releases on a boundary nobody proved, so GREEN is the
 *           one verdict that must never be reached by inference.
 *   LEAK    asserts the suite ran and saw another tenant's rows. Downgrading a
 *           leak to NOT CHECKED hides a finding inside this workflow's only
 *           observed state -- every run of it on record is NOT CHECKED -- so a
 *           leak marker outranks every precondition marker.
 *   NOT CHECKED asserts nothing about isolation. Reporting it over a green run
 *           only over-alarms, and that is the cheap direction.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import {
  classifyRlsRegression,
  renderAnnotation,
  renderSummary,
  GREEN,
  LEAK,
  NOT_CHECKED,
} from "./classify-rls-regression.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "classify-rls-regression.mjs");

/**
 * The real container log of run 37112823001 on 26a2ed5c68, trimmed to the
 * lines that carry meaning, from artifact `rls-regression-37112823001`
 * (`run/04-logs.txt`). This is the known positive the item was filed on: the
 * suite reached the database and raised at tests/security/rls-regression.sql
 * before the probe loop, so no tenant x table probe ran at all.
 */
const REAL_PRECONDITION_LOG = [
  "2026-10-03T09:25:23.95792  Connecting to the container 'db-migrate'...",
  "2026-10-03T09:24:33.9121755Z stdout F > abarva@0.1.0 test:rls-regression",
  "2026-10-03T09:24:33.9122061Z stdout F > npx tsx scripts/run-rls-regression.ts",
  "2026-10-03T09:24:34.6548099Z stdout F rls-regression: running against postgresql://abarvaadmin:***@pg-abarva-context-lab-001.postgres.database.azure.com:5432/abarva_control?sslmode=require",
  "2026-10-03T09:24:34.7224669Z stderr F rls-regression: NOT CHECKED - Canonical tenant(s) meridian-health, skyharbor-air missing from clients table. Run db:migrate + canonicalization migration before this suite.",
].join("\n");

/** A passing run, as scripts/run-rls-regression.ts writes it. */
const GREEN_LOG = [
  "stdout F rls-regression: running against postgresql://user:***@host:5432/abarva_control?sslmode=require",
  "stdout F rls-regression: pass=84 leak=0 error=0 empty=12 service_role_only=3",
  "stdout F rls-regression: ALL GREEN — tenant isolation holding across 10431 rows in 96 tenant-readable findings; 3 findings are service-role-only",
  "stdout F rls-regression: GREEN in 41.2s",
].join("\n");

/** A leaking run: the SQL summary block raises and the runner reports FAILED. */
const LEAK_LOG = [
  "stdout F rls-regression: running against postgresql://user:***@host:5432/abarva_control?sslmode=require",
  "stdout F meridian-health   source_contracts   tenant_key   visible=     412  foreign=      37  cross=    37  [leak]",
  "stdout F rls-regression: pass=83 leak=1 error=0 empty=12 service_role_only=3",
  "stderr F rls-regression: FAILED — RLS regression failed: 1 leak(s), 0 error(s). Inspect the findings table above. Do NOT release until green.",
].join("\n");

// ── The three outcomes, over logs each one really produces ──────────────────

test("1. a passing suite with a clean submitter is GREEN and exits 0", () => {
  const r = classifyRlsRegression({ logText: GREEN_LOG, submitterRc: 0 });
  assert.equal(r.verdict, GREEN);
  assert.equal(r.exitCode, 0);
});

test("2. the real run-37112823001 log is NOT CHECKED, never a leak", () => {
  const r = classifyRlsRegression({ logText: REAL_PRECONDITION_LOG, submitterRc: 1 });
  assert.equal(r.verdict, NOT_CHECKED);
  assert.equal(r.exitCode, 1);
  assert.match(r.evidence ?? "", /missing from clients table/);
});

test("3. a leaking suite is LEAK and names the finding", () => {
  const r = classifyRlsRegression({ logText: LEAK_LOG, submitterRc: 1 });
  assert.equal(r.verdict, LEAK);
  assert.equal(r.exitCode, 1);
  assert.match(r.evidence ?? "", /1 leak\(s\)/);
});

test("4. an empty log is NOT CHECKED for the reason that it is empty", () => {
  const r = classifyRlsRegression({ logText: "", submitterRc: 1 });
  assert.equal(r.verdict, NOT_CHECKED);
  assert.equal(r.exitCode, 1);
  // The verdict alone does not pin this: with the empty-log guard removed an
  // empty log falls through to "reached no verdict" and is still NOT CHECKED
  // at exit 1, so mutation M4 survived a case asserting only those two. The
  // two reasons send an operator to different places -- "the job produced no
  // output" is the submitter and the Container App, "the suite reached no
  // verdict" is the database and the deployed image -- so the branch that
  // fired is the contract, not just its severity.
  assert.equal(r.reason, "no job output");
  assert.match(r.detail, /produced no readable output/);
  assert.doesNotMatch(r.detail, /missing from the deployed image/);
});

test("5. a log with no marker at all is NOT CHECKED, not a pass", () => {
  const r = classifyRlsRegression({
    logText: "stderr F Error: getaddrinfo ENOTFOUND pg-abarva-context-lab-001",
    submitterRc: 1,
  });
  assert.equal(r.verdict, NOT_CHECKED);
  assert.equal(r.exitCode, 1);
});

// ── Hole A: GREEN asserted from a grep, with the submitter ignored ──────────
//
// rls-regression.yml captures the submitter's exit code at step `run` and uses
// it in exactly one summary line. It is never a condition. Meanwhile
// scripts/ops/submit-aca-operator-job.mjs ends `if (failed) throw failed`, and
// `failed` is set by the submitter's OWN post-run work -- proof extraction,
// migration seal, restore-to-idle -- independently of the container's exit
// status. So "the suite printed GREEN and the job then failed" is reachable by
// construction, and today it is reported as a pass.

test("6. GREEN requires a clean submitter: a failed job over a green log is NOT CHECKED", () => {
  const r = classifyRlsRegression({ logText: GREEN_LOG, submitterRc: 1 });
  assert.notEqual(
    r.verdict,
    GREEN,
    "a green marker under a non-zero submitter exit code must not be reported as a pass",
  );
  assert.equal(r.verdict, NOT_CHECKED);
  assert.equal(r.exitCode, 1);
});

test("7. an unreadable submitter exit code fails closed, never GREEN", () => {
  for (const rc of [undefined, null, NaN, "", "not-a-number"]) {
    const r = classifyRlsRegression({ logText: GREEN_LOG, submitterRc: rc });
    assert.notEqual(r.verdict, GREEN, `rc=${String(rc)} must not reach GREEN`);
  }
});

// ── Hole B: a leak downgraded to "could not tell" ──────────────────────────
//
// The step decides by first match over independent greps on one text, with the
// precondition branch ahead of the leak branch. Both markers are plain
// substrings of free-form Postgres error text that this suite's own authors
// extend every time they add a RAISE, and NOT CHECKED is the only state this
// workflow has ever reported -- so a leak arriving next to any precondition
// noise reads as three more days of the same.

test("8. a leak marker outranks a precondition marker in the same log", () => {
  const both = `${REAL_PRECONDITION_LOG}\n${LEAK_LOG}`;
  const r = classifyRlsRegression({ logText: both, submitterRc: 1 });
  assert.equal(
    r.verdict,
    LEAK,
    "a log that carries a leak finding must report the leak, not the precondition",
  );
  assert.match(r.evidence ?? "", /leak\(s\)/);
});

test("9. a leak marker outranks a green marker in the same log", () => {
  const both = `${GREEN_LOG}\n${LEAK_LOG}`;
  const r = classifyRlsRegression({ logText: both, submitterRc: 0 });
  assert.equal(r.verdict, LEAK, "a leak finding must never be masked by a green marker");
});

// ── The CLI the workflow actually invokes ──────────────────────────────────

test("10. the CLI exits 0 only on GREEN and 1 on every other verdict", (t) => {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR ?? "/tmp", "rls-classify-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const cases = [
    { name: "green.log", text: GREEN_LOG, rc: "0", expect: 0 },
    { name: "green-failed-job.log", text: GREEN_LOG, rc: "1", expect: 1 },
    { name: "leak.log", text: LEAK_LOG, rc: "1", expect: 1 },
    { name: "precondition.log", text: REAL_PRECONDITION_LOG, rc: "1", expect: 1 },
  ];

  for (const c of cases) {
    const p = path.join(dir, c.name);
    fs.writeFileSync(p, c.text);
    let status = 0;
    try {
      execFileSync(process.execPath, [CLI, "--logs", p, "--rc", c.rc, "--label", "azure/abarva_control"], {
        stdio: "pipe",
      });
    } catch (err) {
      status = err.status ?? -1;
    }
    assert.equal(status, c.expect, `${c.name} (rc=${c.rc}) should exit ${c.expect}`);
  }
});

test("11. the CLI refuses a flag it does not read rather than ignoring it", () => {
  let status = 0;
  let stderr = "";
  try {
    execFileSync(process.execPath, [CLI, "--log", "/nonexistent"], { stdio: "pipe" });
  } catch (err) {
    status = err.status ?? -1;
    stderr = String(err.stderr ?? "");
  }
  assert.equal(status, 2);
  assert.match(stderr, /--log/);
});

test("12. importing this module does not run its CLI", () => {
  // Reaching this line at all proves it: the import above would have called
  // process.exit() on a missing --logs path if the entry guard were inverted.
  assert.equal(typeof classifyRlsRegression, "function");
});

// ── The workflow must call the control, not re-implement it ────────────────

test("13. the Classify result step invokes the classifier script", () => {
  const wf = fs.readFileSync(
    path.join(HERE, "..", "..", ".github", "workflows", "rls-regression.yml"),
    "utf8",
  );
  assert.match(
    wf,
    /scripts\/security\/classify-rls-regression\.mjs/,
    "the workflow still classifies inline; the control has to be the thing that runs",
  );
  assert.doesNotMatch(
    wf,
    /grep -q "rls-regression: GREEN"/,
    "the inline grep ladder is still present alongside the script",
  );
});

// ── What the run actually says out loud ────────────────────────────────────
//
// The verdict only reaches a human through the annotation and the step
// summary, so both are part of the contract. A red that does not name what it
// found is the state this item was filed against: this workflow's entire
// observed history is one red run nobody could read.

test("14. every non-green verdict annotates, and a leak annotates as a leak", () => {
  const leak = renderAnnotation(classifyRlsRegression({ logText: LEAK_LOG, submitterRc: 1 }));
  assert.match(leak ?? "", /^::error::RLS FAILURE/);

  const pre = renderAnnotation(
    classifyRlsRegression({ logText: REAL_PRECONDITION_LOG, submitterRc: 1 }),
  );
  assert.match(pre ?? "", /^::error::NOT CHECKED/);
  assert.match(pre ?? "", /precondition failed/);

  const falseGreen = renderAnnotation(
    classifyRlsRegression({ logText: GREEN_LOG, submitterRc: 1 }),
  );
  assert.match(falseGreen ?? "", /^::error::NOT CHECKED/);
  assert.match(falseGreen ?? "", /submitter that did not succeed/);

  assert.equal(
    renderAnnotation(classifyRlsRegression({ logText: GREEN_LOG, submitterRc: 0 })),
    null,
    "a green run must not annotate an error",
  );
});

test("15. the red names what it found: the summary quotes the suite's own line", () => {
  const pre = renderSummary(classifyRlsRegression({ logText: REAL_PRECONDITION_LOG, submitterRc: 1 }));
  assert.match(pre, /## Result — NOT CHECKED/);
  assert.match(pre, /missing from clients table/);

  const leak = renderSummary(classifyRlsRegression({ logText: LEAK_LOG, submitterRc: 1 }));
  assert.match(leak, /## Result — TENANT ISOLATION FAILURE/);
  assert.match(leak, /1 leak\(s\)/);

  // A verdict reached with no marker to quote still has to carry the log tail,
  // or the reader is told "unknown" and given nothing to act on.
  const silent = renderSummary(
    classifyRlsRegression({ logText: "stderr F ENOTFOUND pg-abarva-context-lab-001", submitterRc: 1 }),
    { logTail: "stderr F ENOTFOUND pg-abarva-context-lab-001" },
  );
  assert.match(silent, /ENOTFOUND/);
});

test("16. --summary sends the markdown to the file and the annotation to stdout", (t) => {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR ?? "/tmp", "rls-classify-sum-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const logs = path.join(dir, "04-logs.txt");
  const summary = path.join(dir, "summary.md");
  fs.writeFileSync(logs, REAL_PRECONDITION_LOG);

  let stdout = "";
  let status = 0;
  try {
    stdout = String(
      execFileSync(
        process.execPath,
        [CLI, "--logs", logs, "--rc", "1", "--label", "azure/abarva_control", "--summary", summary],
        { stdio: "pipe" },
      ),
    );
  } catch (err) {
    status = err.status ?? -1;
    stdout = String(err.stdout ?? "");
  }

  assert.equal(status, 1);
  assert.match(stdout, /^::error::NOT CHECKED/m);
  const written = fs.readFileSync(summary, "utf8");
  assert.match(written, /## Result — NOT CHECKED/);
  assert.match(written, /missing from clients table/);
  assert.match(written, /azure\/abarva_control/);
});

test("17. the live-database job never runs from a pull request", () => {
  const wf = fs.readFileSync(
    path.join(HERE, "..", "..", ".github", "workflows", "rls-regression.yml"),
    "utf8",
  );
  // The `pull_request` trigger was added so the classifier contract runs in
  // review. The other job in this workflow submits to the private operator
  // Container App and reads a live database, so the same trigger must not
  // reach it: a review of the control must not touch the subject it decides
  // about. Nothing else in this repository would notice if the guard went.
  const doc = parseWorkflow(wf);
  assert.ok(doc.on.pull_request, "the contract needs the pull_request trigger");
  const guard = doc.jobs["rls-regression"].if ?? "";
  assert.match(guard, /github\.event_name != 'pull_request'/);
  assert.match(guard, /github\.event_name != 'merge_group'/);
  assert.equal(
    doc.jobs["classifier-contract"].if,
    undefined,
    "the contract job is the one that should run in review",
  );
});

/**
 * A deliberately small reader rather than a YAML dependency: this suite must
 * run on a bare runner with nothing installed beyond the repository.
 */
function parseWorkflow(text) {
  const doc = { on: {}, jobs: {} };
  const lines = text.split("\n");
  let section = null;
  let job = null;
  for (const line of lines) {
    if (/^on:\s*$/.test(line)) { section = "on"; job = null; continue; }
    if (/^jobs:\s*$/.test(line)) { section = "jobs"; job = null; continue; }
    if (/^[a-z]/.test(line)) { section = null; job = null; continue; }
    if (section === "on") {
      const m = /^ {2}([a-z_]+):/.exec(line);
      if (m) doc.on[m[1]] = true;
    } else if (section === "jobs") {
      const m = /^ {2}([a-z0-9-]+):\s*$/.exec(line);
      if (m) { job = m[1]; doc.jobs[job] = {}; continue; }
      if (job) {
        const f = /^ {4}if:\s*(.+)$/.exec(line);
        if (f) doc.jobs[job].if = f[1].trim();
      }
    }
  }
  return doc;
}
