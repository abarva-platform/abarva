#!/usr/bin/env node
/**
 * Behavioural contract for the scheduled-workflow failure-streak control
 * (item C-578a).
 *
 * The condition this control exists against: a scheduled workflow that fails
 * identically for months raises nothing. One of them was red 142 consecutive
 * times with no successes and no alert, and the condition was found by a human
 * reading a run list. A run-list reader is not a control, and the same shape
 * was available to every scheduled workflow in `.github/workflows`.
 *
 * Measured on this repository on 2026-10-04, over `event=schedule` runs read
 * from the Actions API, SIX of the thirteen scheduled workflows were in that
 * state at once — streaks of 5, 31, 73, and three at or beyond the 100-run
 * read window. So the control is not built for a hypothetical.
 *
 * The cases below are written against the ways this check could LOOK right and
 * report clean over a workflow that is dead. Each of these is pinned by a named
 * case, and each was proved necessary by breaking the implementation and
 * watching that case — and no other — go red:
 *
 *   counting past the most recent success          -> "streak stops at the most recent success"
 *   treating `cancelled` as a failure              -> "a cancelled run is neutral"
 *   treating an unknown conclusion as benign       -> "an unrecognised conclusion is a failure"
 *   counting an in-progress run                    -> "an in-progress run is not a failure"
 *   `>=` where the ceiling means `>`               -> "a streak equal to the ceiling is not a breach"
 *   honouring an exception past its expiry         -> "an expired exception does not suppress"
 *   matching an exception by prefix                -> "an exception matches by exact filename"
 *   leaving a recovered workflow's exception       -> "an exception on a healthy workflow is stale"
 *   reporting a truncated streak as exact          -> "a full window with no success is a lower bound"
 *   skipping a workflow whose `on:` cannot be read -> "an unreadable trigger block is an anomaly"
 *
 * Two of those deserve a note, because both are cases where the obvious
 * simplification is wrong in the direction of silence.
 *
 * `cancelled` is NEITHER a failure nor a success here. A `timeout-minutes` kill
 * reports `cancelled`, and so does a concurrency supersession; counting it as a
 * failure would red the gate on supersession noise, and counting it as a
 * success would let a workflow killed every night read clean. It is skipped —
 * and because skipping it alone would make an all-cancelled workflow report a
 * zero streak with no success, the summary carries a SECOND number,
 * `nonSuccessStreak`, which counts what the first one skips. The gate reads the
 * first; a reader can see the second.
 *
 * The window is a lower bound, not a measurement. The Actions API is read one
 * page deep, so a workflow whose whole page is failures has a streak of "at
 * least 100", and the three real ones above are exactly that. Reporting 100 as
 * though it were the count would be a true-looking number that is wrong, so
 * `windowExhausted` is carried beside it. The distinction is not cosmetic: a
 * workflow with five runs, all of them failures, has an EXACT streak of five —
 * that is `l10-soc2-evidence-pack` on this repository, and an earlier draft of
 * the measurement reported it as truncated because it compared the streak to
 * the run count rather than to the window size.
 *
 * Run:  node --test scripts/ci/scheduled-workflow-streak.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_WINDOW,
  classifyRun,
  evaluate,
  readPolicy,
  scheduledWorkflowFiles,
  summarizeRuns,
  validatePolicy,
} from "./scheduled-workflow-streak.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");
const CLI = path.join(HERE, "scheduled-workflow-streak.mjs");

const NOW = new Date("2026-10-04T06:00:00Z");

/** A completed run, newest-first in the arrays below, as the API returns them. */
function run(conclusion, createdAt, status = "completed") {
  return { status, conclusion, created_at: createdAt, html_url: `https://example.invalid/${createdAt}` };
}

function summarize(runs, windowSize = DEFAULT_WINDOW) {
  return summarizeRuns(runs, windowSize);
}

/** A policy with one ceiling and whatever exceptions a case needs. */
function policy(ceiling, exceptions = []) {
  return { defaultCeiling: ceiling, exceptions };
}

function workflow(file, runs) {
  return { file, state: "active", runs };
}

// ---------------------------------------------------------------- classify --

test("a successful completed run classifies as success", () => {
  assert.equal(classifyRun(run("success", "2026-10-01T00:00:00Z")), "success");
});

test("an unrecognised conclusion is a failure", () => {
  // Fail closed. This control exists because something that had stopped
  // working read as fine; a conclusion value GitHub adds tomorrow must be
  // reported, not absorbed.
  assert.equal(classifyRun(run("something_new", "2026-10-01T00:00:00Z")), "failure");
});

test("timed_out and startup_failure are failures", () => {
  assert.equal(classifyRun(run("timed_out", "2026-10-01T00:00:00Z")), "failure");
  assert.equal(classifyRun(run("startup_failure", "2026-10-01T00:00:00Z")), "failure");
});

test("a cancelled run is neutral", () => {
  assert.equal(classifyRun(run("cancelled", "2026-10-01T00:00:00Z")), "neutral");
});

test("a skipped run is neutral", () => {
  assert.equal(classifyRun(run("skipped", "2026-10-01T00:00:00Z")), "neutral");
});

test("an in-progress run is not a failure", () => {
  assert.equal(classifyRun(run(null, "2026-10-01T00:00:00Z", "in_progress")), "pending");
  assert.equal(classifyRun(run(null, "2026-10-01T00:00:00Z", "queued")), "pending");
});

// --------------------------------------------------------------- summarize --

test("a workflow whose newest run succeeded has a zero streak", () => {
  const s = summarize([run("success", "2026-10-03T00:00:00Z"), run("failure", "2026-10-02T00:00:00Z")]);
  assert.equal(s.failureStreak, 0);
  assert.equal(s.lastSuccessAt, "2026-10-03T00:00:00Z");
});

test("streak stops at the most recent success", () => {
  const s = summarize([
    run("failure", "2026-10-03T00:00:00Z"),
    run("failure", "2026-10-02T00:00:00Z"),
    run("success", "2026-10-01T00:00:00Z"),
    run("failure", "2026-09-30T00:00:00Z"),
    run("failure", "2026-09-29T00:00:00Z"),
    run("failure", "2026-09-28T00:00:00Z"),
  ]);
  assert.equal(s.failureStreak, 2);
  assert.equal(s.lastSuccessAt, "2026-10-01T00:00:00Z");
});

test("lastSuccessAt is the newest success, not the oldest", () => {
  const s = summarize([
    run("success", "2026-10-03T00:00:00Z"),
    run("success", "2026-09-01T00:00:00Z"),
  ]);
  assert.equal(s.lastSuccessAt, "2026-10-03T00:00:00Z");
});

test("a cancelled run neither extends nor breaks the failure streak", () => {
  const s = summarize([
    run("failure", "2026-10-03T00:00:00Z"),
    run("cancelled", "2026-10-02T00:00:00Z"),
    run("failure", "2026-10-01T00:00:00Z"),
    run("success", "2026-09-30T00:00:00Z"),
  ]);
  assert.equal(s.failureStreak, 2);
  assert.equal(s.nonSuccessStreak, 3);
});

test("an all-cancelled workflow has a zero failure streak and a visible non-success streak", () => {
  // The case that makes the second number worth carrying: skipping
  // cancellations alone would report this workflow as perfectly healthy.
  const s = summarize([
    run("cancelled", "2026-10-03T00:00:00Z"),
    run("cancelled", "2026-10-02T00:00:00Z"),
    run("cancelled", "2026-10-01T00:00:00Z"),
  ]);
  assert.equal(s.failureStreak, 0);
  assert.equal(s.nonSuccessStreak, 3);
  assert.equal(s.lastSuccessAt, null);
});

test("an in-progress newest run does not hide the streak beneath it", () => {
  const s = summarize([
    run(null, "2026-10-04T00:00:00Z", "in_progress"),
    run("failure", "2026-10-03T00:00:00Z"),
    run("failure", "2026-10-02T00:00:00Z"),
  ]);
  assert.equal(s.failureStreak, 2);
  assert.equal(s.pendingRuns, 1);
});

test("a full window with no success is a lower bound", () => {
  const runs = Array.from({ length: 10 }, (_, i) => run("failure", `2026-09-${String(20 - i).padStart(2, "0")}T00:00:00Z`));
  const s = summarize(runs, 10);
  assert.equal(s.failureStreak, 10);
  assert.equal(s.windowExhausted, true);
});

test("a window that is not full reports an exact streak even with no success", () => {
  // `l10-soc2-evidence-pack`: five runs in its whole history, all failures.
  // Five is the measurement, not a truncation.
  const runs = Array.from({ length: 5 }, (_, i) => run("failure", `2026-09-${String(20 - i).padStart(2, "0")}T00:00:00Z`));
  const s = summarize(runs, 10);
  assert.equal(s.failureStreak, 5);
  assert.equal(s.windowExhausted, false);
});

test("a window with a success in it is never a lower bound", () => {
  const runs = [run("failure", "2026-09-20T00:00:00Z"), run("success", "2026-09-19T00:00:00Z")];
  const s = summarize(runs, 2);
  assert.equal(s.windowExhausted, false);
});

test("the streak carries the timestamp of its oldest failure", () => {
  const s = summarize([
    run("failure", "2026-10-03T00:00:00Z"),
    run("failure", "2026-10-02T00:00:00Z"),
    run("success", "2026-10-01T00:00:00Z"),
  ]);
  assert.equal(s.streakStartedAt, "2026-10-02T00:00:00Z");
});

test("a workflow with no runs at all reports a zero streak and no success", () => {
  const s = summarize([]);
  assert.equal(s.failureStreak, 0);
  assert.equal(s.lastSuccessAt, null);
  assert.equal(s.runsRead, 0);
});

// ----------------------------------------------------------------- scanner --

function withWorkflowDir(files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "swf-"));
  try {
    for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("a workflow with a schedule block is scanned", () => {
  const out = withWorkflowDir(
    { "nightly.yml": "name: Nightly\non:\n  schedule:\n    - cron: '0 3 * * *'\njobs: {}\n" },
    (dir) => scheduledWorkflowFiles(dir),
  );
  assert.deepEqual(out.scheduled, ["nightly.yml"]);
  assert.deepEqual(out.anomalies, []);
});

test("a workflow without a schedule is not scanned", () => {
  const out = withWorkflowDir(
    { "pr.yml": "name: PR\non:\n  pull_request:\n    branches: [main]\njobs: {}\n" },
    (dir) => scheduledWorkflowFiles(dir),
  );
  assert.deepEqual(out.scheduled, []);
});

test("a schedule declared in the list form of on: is scanned", () => {
  const out = withWorkflowDir(
    { "both.yml": "name: Both\non: [push, schedule]\njobs: {}\n" },
    (dir) => scheduledWorkflowFiles(dir),
  );
  assert.deepEqual(out.scheduled, ["both.yml"]);
});

test("the word schedule in a comment does not make a workflow scheduled", () => {
  const out = withWorkflowDir(
    { "c.yml": "# this used to run on a schedule: nightly\nname: C\non:\n  push:\njobs: {}\n" },
    (dir) => scheduledWorkflowFiles(dir),
  );
  assert.deepEqual(out.scheduled, []);
});

test("an unreadable trigger block is an anomaly", () => {
  // A workflow with no readable `on:` is NOT silently treated as unscheduled.
  // Under-coverage that nobody can see is the defect this whole control is
  // about, one level up.
  const out = withWorkflowDir(
    { "weird.yml": "name: Weird\njobs: {}\n" },
    (dir) => scheduledWorkflowFiles(dir),
  );
  assert.deepEqual(out.scheduled, []);
  assert.equal(out.anomalies.length, 1);
  assert.equal(out.anomalies[0].file, "weird.yml");
});

test("a file that is not valid YAML is an anomaly rather than a skip", () => {
  const out = withWorkflowDir(
    { "bad.yml": "name: Bad\non: [\n  unterminated\n" },
    (dir) => scheduledWorkflowFiles(dir),
  );
  assert.equal(out.anomalies.length, 1);
  assert.match(out.anomalies[0].reason, /yaml|parse/i);
});

test("the real workflows directory contains the scheduled workflows this repository has", () => {
  const out = scheduledWorkflowFiles(path.join(REPO_ROOT, ".github", "workflows"));
  assert.deepEqual(out.anomalies, [], "every workflow file must be readable");
  assert.ok(out.scheduled.includes("sec-p0-post-deploy.yml"));
  assert.ok(out.scheduled.length >= 10);
});

// ---------------------------------------------------------------- evaluate --

const failing = (n) => Array.from({ length: n }, (_, i) => run("failure", `2026-10-0${(i % 3) + 1}T0${i % 9}:00:00Z`));

test("a streak equal to the ceiling is not a breach", () => {
  const r = evaluate({
    workflows: [workflow("a.yml", failing(5))],
    policy: policy(5),
    now: NOW,
  });
  assert.deepEqual(r.breaches, []);
  assert.equal(r.ok, true);
});

test("a streak above the ceiling is a breach", () => {
  const r = evaluate({
    workflows: [workflow("a.yml", failing(6))],
    policy: policy(5),
    now: NOW,
  });
  assert.equal(r.breaches.length, 1);
  assert.equal(r.breaches[0].file, "a.yml");
  assert.equal(r.ok, false);
});

test("a live declared exception suppresses a breach", () => {
  const r = evaluate({
    workflows: [workflow("a.yml", failing(50))],
    policy: policy(5, [
      {
        workflow: "a.yml",
        reason: "blocked on an operator-provisioned credential",
        owner: "operator",
        remediation: "internal item C-577",
        expires: "2026-11-04",
        observedAt: "2026-10-01",
      },
    ]),
    now: NOW,
  });
  assert.deepEqual(r.breaches, []);
  assert.equal(r.excepted.length, 1);
  assert.equal(r.ok, true);
});

test("an expired exception does not suppress", () => {
  const r = evaluate({
    workflows: [workflow("a.yml", failing(50))],
    policy: policy(5, [
      {
        workflow: "a.yml",
        reason: "r",
        owner: "o",
        remediation: "m",
        expires: "2026-09-01",
        observedAt: "2026-08-01",
      },
    ]),
    now: NOW,
  });
  assert.equal(r.breaches.length, 1, "the breach is reported again once the exception lapses");
  assert.equal(r.expiredExceptions.length, 1);
  assert.equal(r.ok, false);
});

test("an exception matches by exact filename", () => {
  // `a.yml` must not cover `a-nightly.yml`, and the longer name must not cover
  // the shorter one either.
  const r = evaluate({
    workflows: [workflow("a-nightly.yml", failing(50))],
    policy: policy(5, [
      { workflow: "a.yml", reason: "r", owner: "o", remediation: "m", expires: "2026-11-04", observedAt: "2026-10-01" },
    ]),
    now: NOW,
  });
  assert.equal(r.breaches.length, 1);
  assert.equal(r.breaches[0].file, "a-nightly.yml");
});

test("an exception is stale once the workflow succeeds after it was filed", () => {
  const r = evaluate({
    workflows: [workflow("a.yml", [run("success", "2026-10-03T00:00:00Z")])],
    policy: policy(5, [
      { workflow: "a.yml", reason: "r", owner: "o", remediation: "m", expires: "2026-11-04", observedAt: "2026-10-01" },
    ]),
    now: NOW,
  });
  assert.equal(r.staleExceptions.length, 1);
  assert.equal(r.ok, false, "an exception that no longer describes reality is a finding");
});

test("an exception on a workflow that has never succeeded is not stale, even at the ceiling", () => {
  // `l10-soc2-evidence-pack` on 2026-10-04: five runs in its whole history,
  // all failures, streak exactly at the ceiling. The first draft of the
  // staleness predicate called this stale because the streak was not ABOVE the
  // ceiling, which would have had the entry deleted and re-added every few
  // days. A workflow one run from breaching has not recovered.
  const r = evaluate({
    workflows: [workflow("a.yml", failing(5))],
    policy: policy(5, [
      { workflow: "a.yml", reason: "r", owner: "o", remediation: "m", expires: "2026-11-04", observedAt: "2026-10-04" },
    ]),
    now: NOW,
  });
  assert.deepEqual(r.staleExceptions, []);
  assert.equal(r.ok, true);
});

test("an exception is not stale when the only success predates it", () => {
  const r = evaluate({
    workflows: [
      workflow("a.yml", [...failing(9), run("success", "2026-08-01T00:00:00Z")]),
    ],
    policy: policy(5, [
      { workflow: "a.yml", reason: "r", owner: "o", remediation: "m", expires: "2026-11-04", observedAt: "2026-10-01" },
    ]),
    now: NOW,
  });
  assert.deepEqual(r.staleExceptions, []);
  assert.equal(r.ok, true);
});

test("an anomaly alone makes the run not ok", () => {
  const r = evaluate({
    workflows: [workflow("a.yml", [run("success", "2026-10-03T00:00:00Z")])],
    policy: policy(5),
    anomalies: [{ file: "weird.yml", reason: "no readable on: block" }],
    now: NOW,
  });
  assert.equal(r.ok, false);
});

test("every scanned workflow appears in the report, healthy or not", () => {
  const r = evaluate({
    workflows: [
      workflow("a.yml", failing(9)),
      workflow("b.yml", [run("success", "2026-10-03T00:00:00Z")]),
    ],
    policy: policy(5),
    now: NOW,
  });
  assert.deepEqual(
    r.report.map((row) => row.file).sort(),
    ["a.yml", "b.yml"],
  );
  assert.equal(r.report.find((row) => row.file === "b.yml").failureStreak, 0);
});

// ------------------------------------------------------------------ policy --

const goodException = {
  workflow: "sec-p0-post-deploy.yml",
  reason: "r",
  owner: "o",
  remediation: "m",
  expires: "2099-01-01",
  observedStreak: 100,
  observedAt: "2026-10-04",
};

test("validatePolicy accepts a complete exception naming a real scheduled workflow", () => {
  const errors = validatePolicy(policy(5, [goodException]), {
    scheduledFiles: ["sec-p0-post-deploy.yml"],
    now: NOW,
  });
  assert.deepEqual(errors, []);
});

test("validatePolicy refuses an exception naming a workflow that is not scheduled", () => {
  const errors = validatePolicy(policy(5, [goodException]), { scheduledFiles: ["other.yml"], now: NOW });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /sec-p0-post-deploy\.yml/);
});

for (const field of ["reason", "owner", "remediation", "expires"]) {
  test(`validatePolicy refuses an exception with no ${field}`, () => {
    const broken = { ...goodException };
    delete broken[field];
    const errors = validatePolicy(policy(5, [broken]), {
      scheduledFiles: ["sec-p0-post-deploy.yml"],
      now: NOW,
    });
    assert.equal(errors.length, 1, `missing ${field} must be refused`);
    assert.match(errors[0], new RegExp(field));
  });
}

test("validatePolicy refuses an exception whose observedAt is not a date", () => {
  const errors = validatePolicy(policy(5, [{ ...goodException, observedAt: "last Tuesday" }]), {
    scheduledFiles: ["sec-p0-post-deploy.yml"],
    now: NOW,
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /observedAt/);
});

test("validatePolicy refuses an expired exception", () => {
  const errors = validatePolicy(policy(5, [{ ...goodException, expires: "2026-09-30" }]), {
    scheduledFiles: ["sec-p0-post-deploy.yml"],
    now: NOW,
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /expir/i);
});

test("validatePolicy refuses a ceiling that is not a positive integer", () => {
  for (const bad of [0, -1, 2.5, "5", null]) {
    const errors = validatePolicy({ defaultCeiling: bad, exceptions: [] }, { scheduledFiles: [], now: NOW });
    assert.ok(errors.length >= 1, `ceiling ${JSON.stringify(bad)} must be refused`);
  }
});

test("validatePolicy refuses two exceptions for one workflow", () => {
  const errors = validatePolicy(policy(5, [goodException, { ...goodException, owner: "second" }]), {
    scheduledFiles: ["sec-p0-post-deploy.yml"],
    now: NOW,
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate/i);
});

test("the policy file on disk is valid against the real workflows directory today", () => {
  // The offline half of this control, and the one a pull request runs: the
  // declared ceiling and every declared exception must be well formed, must
  // name a workflow that is really scheduled, and must not have expired.
  const loaded = readPolicy();
  const { scheduled } = scheduledWorkflowFiles(path.join(REPO_ROOT, ".github", "workflows"));
  const errors = validatePolicy(loaded, { scheduledFiles: scheduled, now: new Date() });
  assert.deepEqual(errors, []);
});

// --------------------------------------------------------------------- CLI --
//
// The exported functions above decide; these cases prove the CLI actually
// CALLS them and exits on what they decide. A control that is available and a
// control that is wired look identical from outside, and this repository has
// shipped the first while believing it had the second.

function cli(args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("the CLI refuses an unrecognised flag rather than ignoring it", () => {
  const r = cli(["--policy-check", "--ceiling", "9"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Unrecognised flag/);
});

test("the CLI refuses to run with no mode", () => {
  const r = cli([]);
  assert.equal(r.status, 2);
});

test("the CLI exits 0 on the real policy file in --policy-check", () => {
  const r = cli(["--policy-check"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /policy passed/);
});

test("the CLI exits 1 on a recorded payload that breaches, and names the workflow", () => {
  // The gate's failing direction, proved rather than assumed. The payload is a
  // FIXTURE: proving the gate can fail by waiting for a live workflow to break
  // would make the case depend on the repository's own ill health.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "swf-cli-"));
  const file = path.join(dir, "payload.json");
  try {
    fs.writeFileSync(
      file,
      JSON.stringify({
        workflows: [
          {
            file: "migration-drift-nightly.yml",
            state: "active",
            runs: Array.from({ length: 9 }, (_, i) => ({
              status: "completed",
              conclusion: "failure",
              created_at: `2026-10-0${(i % 3) + 1}T0${i}:00:00Z`,
            })),
          },
        ],
      }),
    );
    const r = cli(["--from-file", file]);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /BREACH/);
    assert.match(r.stdout, /migration-drift-nightly\.yml/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the CLI exits 0 on a recorded payload that is healthy", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "swf-cli-"));
  const file = path.join(dir, "payload.json");
  try {
    fs.writeFileSync(
      file,
      JSON.stringify({
        workflows: [
          {
            file: "migration-drift-nightly.yml",
            state: "active",
            runs: [{ status: "completed", conclusion: "success", created_at: "2026-10-03T00:00:00Z" }],
          },
        ],
      }),
    );
    const r = cli(["--from-file", file]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
