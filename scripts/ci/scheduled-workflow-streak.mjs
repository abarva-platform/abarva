#!/usr/bin/env node
/**
 * For every scheduled workflow: how many times in a row has it failed, and
 * when did it last succeed? (item C-578a)
 *
 * WHY THIS EXISTS. A scheduled workflow that fails identically for months
 * raises nothing. One control in this repository was red 142 consecutive times
 * with no successes and no alert; the condition was found by a human reading a
 * run list, and a run-list reader is not a control. Nothing in the repository
 * measured the shape, and the shape was available to every scheduled workflow.
 *
 * IT IS NOT ONE WORKFLOW. Measured here on 2026-10-04 over `event=schedule`
 * runs read from the Actions API, SIX of thirteen scheduled workflows were in
 * that state simultaneously:
 *
 *   atlas-prod-comprehensive-surface  >=100 consecutive, no success since at
 *                                     least 2026-06-26
 *   rls-regression                    >=100 consecutive, same
 *   sec-p0-post-deploy                >=100 consecutive, same
 *   ai-cost-daily                      >=73 consecutive since 2026-07-23
 *   canonical-tenant-drift               31 consecutive, last success 2026-09-02
 *   l10-soc2-evidence-pack                5 consecutive — its entire history
 *
 * WHERE THE CEILING COMES FROM. It is measured, not picked. Over the same read
 * window, every failure burst that a scheduled workflow RECOVERED from was 4
 * runs or shorter (`aca-runtime-drift-monitor` tops out at 2; the longest
 * anywhere is 4, on `migration-drift-nightly`). The one longer "burst" in the
 * data is 70 runs, also on `migration-drift-nightly`, and that was not flake:
 * it was a multi-week outage that someone eventually repaired — exactly what
 * this control is meant to report rather than tolerate. So a ceiling of 5 sits
 * strictly above every observed transient and far below every dead condition.
 * The number lives in the policy file, with that basis written beside it.
 *
 * TWO JUDGEMENTS WORTH READING BEFORE CHANGING ANYTHING.
 *
 * 1. `cancelled` is neither a failure nor a success. A `timeout-minutes` kill
 *    reports `cancelled`, and so does a concurrency supersession. Counting it
 *    as failure reds the gate on supersession noise; counting it as success
 *    lets a workflow killed every night read clean. It is skipped — and
 *    because skipping it ALONE would make an all-cancelled workflow report a
 *    perfect zero, every row carries a second number, `nonSuccessStreak`,
 *    which counts what the first one skips. The gate reads the first; a reader
 *    sees the second. Changing which one gates is a decision, not a tidy-up.
 *
 * 2. An unknown conclusion counts as a failure. Everything else in this file
 *    fails closed for the same reason the item exists: a thing that had stopped
 *    working read as fine, and a conclusion value GitHub adds next year must be
 *    reported rather than absorbed.
 *
 * THE STREAK IS A LOWER BOUND WHEN THE WINDOW IS FULL. Runs are read one page
 * deep. A workflow whose entire page is failures has failed "at least 100"
 * times, and `windowExhausted` says so rather than letting 100 be read as a
 * count. A workflow with five runs in its whole history, all failures, has an
 * exact streak of five; the test for truncation is against the WINDOW SIZE,
 * never against the number of runs returned.
 *
 * WHAT IT DOES NOT DO, stated rather than left to be discovered. It does not
 * gate on a workflow that has been DISABLED (GitHub disables schedules after
 * 60 days of repository inactivity, and a disabled workflow produces no runs,
 * so it reads as a zero streak). `state` and `lastRunAt` are reported for that
 * reason, and whether to gate on them is a separate decision with its own
 * item. It also cannot report its own permanent failure: it is a scheduled
 * workflow watching scheduled workflows, including itself, so a run of it that
 * fails and recovers appears in the next run's own row, while one that never
 * runs again reports nothing at all. That residual needs a second, independent
 * actor and is not closed here.
 *
 * MODES
 *   --check                 read the live Actions API, evaluate, exit 1 on a finding
 *   --policy-check          offline: validate the policy file only (PR-safe)
 *   --from-file <json>      offline: evaluate a recorded `{workflows:[...]}` payload
 *   --window <n>            runs to read per workflow (default 100, the API page)
 *   --repo <owner/name>     default $GITHUB_REPOSITORY, else the hard default below
 *   --json                  machine-readable output only
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

import { isDirectInvocation, unknownFlags } from "../exec/cli-entry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");
const WORKFLOWS_DIR = path.join(REPO_ROOT, ".github", "workflows");
const POLICY_PATH = path.join(REPO_ROOT, "docs", "ci", "scheduled-workflow-streak-policy.json");
const DEFAULT_REPO = "abarva-platform/abarva";

/** The Actions API's own page maximum. Reading deeper is pagination, not a knob. */
export const DEFAULT_WINDOW = 100;

const SUCCESS = new Set(["success"]);
/** Neutral: real outcomes that say nothing about the workflow's health. */
const NEUTRAL = new Set(["cancelled", "skipped", "neutral", "action_required", "stale"]);

/**
 * `success`, `failure`, `neutral` or `pending` for one run.
 *
 * Anything not completed is `pending` — it has no conclusion yet and must not
 * be read as either outcome. Anything completed that is not a known success or
 * a known neutral is a failure, including a conclusion this file has never
 * seen.
 */
export function classifyRun(run) {
  if (run?.status !== "completed") return "pending";
  const conclusion = run.conclusion ?? "";
  if (SUCCESS.has(conclusion)) return "success";
  if (NEUTRAL.has(conclusion)) return "neutral";
  return "failure";
}

/**
 * Collapse a newest-first run list into the two streaks, the last success and
 * the bound on the streak.
 */
export function summarizeRuns(runs, windowSize = DEFAULT_WINDOW) {
  const read = Array.isArray(runs) ? runs : [];
  let failureStreak = 0;
  let nonSuccessStreak = 0;
  let streakStartedAt = null;
  let lastSuccessAt = null;
  let sawSuccess = false;
  let pendingRuns = 0;
  const counts = {};

  for (const run of read) {
    const kind = classifyRun(run);
    const key = kind === "pending" ? `status:${run?.status ?? "unknown"}` : (run?.conclusion ?? kind);
    counts[key] = (counts[key] ?? 0) + 1;

    if (kind === "pending") {
      pendingRuns += 1;
      continue;
    }
    if (kind === "success") {
      if (!sawSuccess) {
        sawSuccess = true;
        lastSuccessAt = run.created_at ?? null;
      }
      continue;
    }
    if (sawSuccess) continue; // older than the last success: not part of the streak
    nonSuccessStreak += 1;
    if (kind === "failure") {
      failureStreak += 1;
      streakStartedAt = run.created_at ?? streakStartedAt;
    }
  }

  return {
    runsRead: read.length,
    failureStreak,
    nonSuccessStreak,
    lastSuccessAt,
    streakStartedAt,
    // A full window with no success anywhere in it: the streak continues past
    // what was read. Compared against the WINDOW, not against `runsRead`, so a
    // workflow with fewer runs than the window reports an exact count.
    windowExhausted: !sawSuccess && read.length >= windowSize,
    pendingRuns,
    lastRunAt: read[0]?.created_at ?? null,
    counts,
  };
}

/**
 * Which workflow files declare a `schedule:` trigger.
 *
 * Parsed, never grepped: `schedule:` appears in comments and in job bodies.
 * A file whose trigger block cannot be read is an ANOMALY, not a skip —
 * silently omitting a workflow from the scan is the same defect as the one
 * this control exists for, one level up.
 */
export function scheduledWorkflowFiles(dir = WORKFLOWS_DIR) {
  const scheduled = [];
  const anomalies = [];
  const files = fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort();

  for (const file of files) {
    let doc;
    try {
      doc = yaml.load(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (error) {
      anomalies.push({ file, reason: `yaml parse failed: ${error.message}` });
      continue;
    }
    // A YAML 1.1 reader coerces the bare key `on` to boolean true. js-yaml v4
    // does not, but a reader swap must not silently reclassify every workflow
    // as unscheduled, so both spellings are read and neither being present is
    // reported rather than assumed benign.
    const triggers = doc && typeof doc === "object" ? (doc.on ?? doc[true] ?? doc["true"]) : undefined;
    if (triggers === undefined || triggers === null) {
      anomalies.push({ file, reason: "no readable on: block" });
      continue;
    }
    const keys = Array.isArray(triggers)
      ? triggers
      : typeof triggers === "string"
        ? [triggers]
        : Object.keys(triggers);
    if (keys.includes("schedule")) scheduled.push(file);
  }

  return { scheduled, anomalies };
}

export function readPolicy(file = POLICY_PATH) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const REQUIRED_EXCEPTION_FIELDS = ["workflow", "reason", "owner", "remediation", "expires", "observedAt"];

/**
 * Everything wrong with the policy file that can be seen WITHOUT the network:
 * a malformed ceiling, an exception missing a field, an exception naming a
 * workflow that is not scheduled, a duplicate, an expiry that has passed.
 *
 * This is the half a pull request runs. CI failing on expiry is the point:
 * an exception is a dated debt, not a permanent waiver.
 */
export function validatePolicy(policy, { scheduledFiles = [], now = new Date() } = {}) {
  const errors = [];
  const ceiling = policy?.defaultCeiling;
  if (!Number.isInteger(ceiling) || ceiling < 1) {
    errors.push(`defaultCeiling must be a positive integer, got ${JSON.stringify(ceiling)}`);
  }

  const exceptions = policy?.exceptions ?? [];
  if (!Array.isArray(exceptions)) {
    errors.push("exceptions must be an array");
    return errors;
  }

  const seen = new Set();
  for (const exception of exceptions) {
    const name = exception?.workflow ?? "<unnamed>";
    const missing = REQUIRED_EXCEPTION_FIELDS.filter((field) => {
      const value = exception?.[field];
      return typeof value !== "string" || value.trim() === "";
    });
    if (missing.length > 0) {
      errors.push(`exception ${name}: missing ${missing.join(", ")}`);
      continue;
    }
    if (seen.has(exception.workflow)) {
      errors.push(`exception ${name}: duplicate entry for one workflow`);
      continue;
    }
    seen.add(exception.workflow);
    if (!scheduledFiles.includes(exception.workflow)) {
      errors.push(`exception ${name}: names no scheduled workflow in .github/workflows`);
      continue;
    }
    const expiry = Date.parse(exception.expires);
    if (Number.isNaN(expiry)) {
      errors.push(`exception ${name}: expires is not a date (${exception.expires})`);
      continue;
    }
    if (Number.isNaN(Date.parse(exception.observedAt))) {
      errors.push(`exception ${name}: observedAt is not a date (${exception.observedAt})`);
      continue;
    }
    if (expiry < now.getTime()) {
      errors.push(`exception ${name}: expired on ${exception.expires}`);
    }
  }
  return errors;
}

/**
 * Has the workflow succeeded since its exception was filed?
 *
 * This is what makes an exception stale, and the first draft had it wrong in a
 * way only running the control showed. That draft called an exception stale
 * whenever the streak was at or below the ceiling -- and the live run promptly
 * reported `l10-soc2-evidence-pack` as stale, a workflow that has NEVER
 * succeeded in its entire five-run history and sat at exactly the ceiling that
 * day. A workflow one run away from breaching is not a workflow that recovered,
 * and a predicate that flaps at the boundary would have had the entry deleted
 * and re-added every few days. An exception stops describing reality when the
 * thing it excuses starts working again, so that is what is measured.
 */
function hasRecoveredSince(summary, exception) {
  if (!summary.lastSuccessAt) return false;
  const filed = Date.parse(exception.observedAt);
  if (Number.isNaN(filed)) return false;
  return Date.parse(summary.lastSuccessAt) > filed;
}

function liveException(policy, file, now) {
  const found = (policy?.exceptions ?? []).find((e) => e?.workflow === file);
  if (!found) return { exception: null, expired: false };
  const expiry = Date.parse(found.expires);
  const expired = Number.isNaN(expiry) || expiry < now.getTime();
  return { exception: found, expired };
}

/**
 * The verdict. `workflows` are `{ file, state, runs }`, runs newest-first.
 *
 * Not ok when: a streak exceeds the ceiling with no live exception; an
 * exception has expired; an exception covers a workflow that is now healthy
 * (a waiver that no longer describes reality is the stale-mirror failure this
 * repository keeps paying for); or a workflow file could not be classified.
 */
export function evaluate({ workflows = [], policy, anomalies = [], now = new Date(), windowSize = DEFAULT_WINDOW } = {}) {
  const ceiling = policy?.defaultCeiling;
  const report = [];
  const breaches = [];
  const excepted = [];
  const expiredExceptions = [];
  const staleExceptions = [];

  for (const workflow of workflows) {
    const summary = summarizeRuns(workflow.runs, windowSize);
    const { exception, expired } = liveException(policy, workflow.file, now);
    const overCeiling = summary.failureStreak > ceiling;
    const row = {
      file: workflow.file,
      state: workflow.state ?? "unknown",
      ...summary,
      ceiling,
      overCeiling,
      excepted: Boolean(exception) && !expired && overCeiling,
    };
    report.push(row);

    if (exception && expired) expiredExceptions.push({ file: workflow.file, expires: exception.expires });
    if (exception && hasRecoveredSince(summary, exception)) {
      staleExceptions.push({
        file: workflow.file,
        lastSuccessAt: summary.lastSuccessAt,
        observedAt: exception.observedAt,
        detail: "the workflow has succeeded since this exception was filed; delete it",
      });
    }
    if (!overCeiling) continue;
    if (exception && !expired) {
      excepted.push({ file: workflow.file, expires: exception.expires, remediation: exception.remediation });
      continue;
    }
    breaches.push({
      file: workflow.file,
      failureStreak: summary.failureStreak,
      windowExhausted: summary.windowExhausted,
      lastSuccessAt: summary.lastSuccessAt,
      streakStartedAt: summary.streakStartedAt,
      ceiling,
    });
  }

  report.sort((a, b) => b.failureStreak - a.failureStreak || a.file.localeCompare(b.file));

  return {
    ok:
      breaches.length === 0 &&
      expiredExceptions.length === 0 &&
      staleExceptions.length === 0 &&
      anomalies.length === 0,
    report,
    breaches,
    excepted,
    expiredExceptions,
    staleExceptions,
    anomalies,
  };
}

/** One page of `event=schedule` runs for one workflow file. */
async function fetchRuns(repo, file, windowSize, token) {
  const url = `https://api.github.com/repos/${repo}/actions/workflows/${file}/runs?event=schedule&per_page=${windowSize}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} -> ${response.status} ${response.statusText}`);
  }
  const body = await response.json();
  return (body.workflow_runs ?? []).map((run) => ({
    status: run.status,
    conclusion: run.conclusion,
    created_at: run.created_at,
    html_url: run.html_url,
  }));
}

async function fetchState(repo, file, token) {
  const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${file}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) return "unknown";
  return (await response.json()).state ?? "unknown";
}

function renderHuman(result) {
  const lines = [];
  lines.push(`ceiling ${result.report[0]?.ceiling ?? "?"} consecutive failures per scheduled workflow`);
  for (const row of result.report) {
    const streak = row.windowExhausted ? `>=${row.failureStreak}` : `${row.failureStreak}`;
    const flag = row.overCeiling ? (row.excepted ? "EXCEPTED" : "BREACH  ") : "ok      ";
    lines.push(
      `  ${flag} ${row.file.padEnd(40)} streak=${streak.padEnd(6)} lastSuccess=${row.lastSuccessAt ?? "none in window"}`,
    );
  }
  for (const a of result.anomalies) lines.push(`  ANOMALY  ${a.file}: ${a.reason}`);
  for (const e of result.expiredExceptions) lines.push(`  EXPIRED  ${e.file}: exception lapsed ${e.expires}`);
  for (const s of result.staleExceptions) lines.push(`  STALE    ${s.file}: ${s.detail}`);
  lines.push(result.ok ? "scheduled-workflow streak check passed" : "scheduled-workflow streak check FAILED");
  return lines.join("\n");
}

async function main(argv) {
  const unknown = unknownFlags(argv, {
    boolean: ["--check", "--policy-check", "--json"],
    value: ["--from-file", "--window", "--repo"],
  });
  if (unknown.length > 0) {
    console.error(
      `Unrecognised flag(s): ${unknown.join(", ")}. An unrecognised flag is parsed as nothing and the check you asked for would not run, so this is refused rather than passed silently.`,
    );
    return 2;
  }

  const read = (flag, fallback) => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  const windowSize = Number(read("--window", String(DEFAULT_WINDOW)));
  if (!Number.isInteger(windowSize) || windowSize < 1 || windowSize > 100) {
    console.error(`--window must be an integer in 1..100, got ${read("--window", "")}`);
    return 2;
  }
  const asJson = argv.includes("--json");
  const policy = readPolicy();
  const { scheduled, anomalies } = scheduledWorkflowFiles();
  const now = new Date();

  const policyErrors = validatePolicy(policy, { scheduledFiles: scheduled, now });
  if (argv.includes("--policy-check")) {
    const ok = policyErrors.length === 0 && anomalies.length === 0;
    const payload = { mode: "policy-check", ok, policyErrors, anomalies, scheduled };
    console.log(asJson ? JSON.stringify(payload, null, 2) : [
      `${scheduled.length} scheduled workflow(s); ceiling ${policy.defaultCeiling}; ${(policy.exceptions ?? []).length} declared exception(s)`,
      ...policyErrors.map((e) => `  POLICY  ${e}`),
      ...anomalies.map((a) => `  ANOMALY ${a.file}: ${a.reason}`),
      ok ? "scheduled-workflow streak policy passed" : "scheduled-workflow streak policy FAILED",
    ].join("\n"));
    return ok ? 0 : 1;
  }

  if (policyErrors.length > 0) {
    // The live check cannot be trusted over a policy file that does not
    // validate, so it refuses instead of reporting a verdict derived from it.
    console.error(["Policy file is invalid; refusing to report a live verdict:", ...policyErrors.map((e) => `  ${e}`)].join("\n"));
    return 2;
  }

  let workflows;
  const fromFile = read("--from-file", null);
  if (fromFile) {
    workflows = JSON.parse(fs.readFileSync(fromFile, "utf8")).workflows ?? [];
  } else if (argv.includes("--check")) {
    const repo = read("--repo", process.env.GITHUB_REPOSITORY || DEFAULT_REPO);
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
    workflows = [];
    for (const file of scheduled) {
      workflows.push({
        file,
        state: await fetchState(repo, file, token),
        runs: await fetchRuns(repo, file, windowSize, token),
      });
    }
  } else {
    console.error("Pass one of --check (live), --policy-check (offline) or --from-file <json>.");
    return 2;
  }

  const result = evaluate({ workflows, policy, anomalies, now, windowSize });
  console.log(asJson ? JSON.stringify(result, null, 2) : renderHuman(result));
  return result.ok ? 0 : 1;
}

if (isDirectInvocation(import.meta.url)) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(error.stack ?? String(error));
      process.exit(2);
    });
}
