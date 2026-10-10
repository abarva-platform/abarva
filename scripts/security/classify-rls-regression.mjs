#!/usr/bin/env node
/**
 * What did the L4 RLS regression run actually establish? (item C-627)
 *
 * `RLS regression (L4 SQL tenant isolation)` run 37112823001 on 26a2ed5c68 was
 * red, it is the only run of that workflow in the last 200, and nothing said
 * why. Read: the harness, not a finding. The job's container log ends
 *
 *   rls-regression: NOT CHECKED - Canonical tenant(s) meridian-health,
 *   skyharbor-air missing from clients table.
 *
 * raised by tests/security/rls-regression.sql before the probe loop, so no
 * tenant x table probe ran and isolation state is genuinely unknown. The
 * workflow said so correctly. That half of the item was already on `main`.
 *
 * WHAT WAS NOT ON MAIN
 *
 * Any test over the classifier, and the step is where the three outcomes are
 * kept apart. It was eighty-five lines of inline bash deciding a
 * tenant-isolation gate by first match over four independent greps, and a gate
 * nothing can fail is the shape this repository has already paid for once.
 *
 * Two inversions it permitted, both now pinned by a case:
 *
 *   A. GREEN was asserted from a grep alone. The step captures the submitter's
 *      exit code and uses it in exactly one summary line; it was never a
 *      condition. scripts/ops/submit-aca-operator-job.mjs ends `if (failed)
 *      throw failed`, and `failed` is set by the submitter's OWN post-run work
 *      -- proof extraction, migration seal, restore-to-idle -- independently of
 *      the container's exit status. "The suite printed GREEN and the job then
 *      failed" is therefore reachable by construction, and it was reported as a
 *      pass: a release on an isolation boundary nobody proved.
 *
 *   B. The precondition branch was evaluated ahead of the leak branch, so a log
 *      carrying both markers reported "could not tell". Both are plain
 *      substrings of free-form Postgres error text that the suite's authors
 *      extend on every new RAISE, and NOT CHECKED is the only state this
 *      workflow has ever reported -- so a leak arriving beside any precondition
 *      noise would read as more of the same.
 *
 * THE ASYMMETRY THE PRECEDENCE IS BUILT ON
 *
 * The three outcomes do not cost the same, so they are not ordered by how
 * specific their markers are:
 *
 *   LEAK        a finding. Never downgraded by anything, because hiding it is
 *               the only outcome that lets a real cross-tenant read ship.
 *   NOT CHECKED asserts nothing about isolation. Reaching it over a genuinely
 *               green run only over-alarms, and that is the cheap direction.
 *   GREEN       asserts the boundary was exercised and held. It is the one
 *               verdict that must never be reached by inference, so it needs
 *               the suite's own marker AND a submitter that succeeded.
 *
 * Every verdict that means "could not tell" exits non-zero, including the ones
 * reached because an input was unreadable.
 *
 * This module decides; it does not probe. It never connects to a database and
 * never reads the operator's machine, so its suite runs on any runner.
 */

import fs from "node:fs";
import { isDirectInvocation, unknownFlags } from "../exec/cli-entry.mjs";

export const GREEN = "green";
export const LEAK = "leak";
export const NOT_CHECKED = "not_checked";

/** The suite's own markers, as scripts/run-rls-regression.ts writes them. */
const MARKER_GREEN = /rls-regression: GREEN/;
const MARKER_FAILED = /rls-regression: FAILED/;
const MARKER_NOT_CHECKED = /rls-regression: NOT CHECKED/;
const MARKER_PRECONDITION = /Canonical tenant\(s\).*missing from clients table/;

/**
 * A submitter exit code counts as clean only when it is unambiguously zero.
 * Absent, empty, non-numeric and NaN all mean "could not tell", and a GREEN
 * verdict may not be reached from any of them.
 */
function submitterSucceeded(rc) {
  if (rc === 0) return true;
  if (typeof rc === "string" && rc.trim() !== "" && Number(rc) === 0) return true;
  return false;
}

function firstMatch(text, patterns) {
  for (const line of text.split("\n")) {
    if (patterns.some((p) => p.test(line))) return line.trim();
  }
  return null;
}

export function classifyRlsRegression({ logText = "", submitterRc, label = "" } = {}) {
  const text = typeof logText === "string" ? logText : "";
  const base = { label, submitterRc };

  if (text.trim() === "") {
    return {
      ...base,
      verdict: NOT_CHECKED,
      reason: "no job output",
      detail:
        "The operator job produced no readable output, so tenant-isolation " +
        "state is unknown. This is not a pass and must not be read as one.",
      exitCode: 1,
      evidence: null,
    };
  }

  // A finding outranks everything. See the asymmetry note above.
  if (MARKER_FAILED.test(text)) {
    return {
      ...base,
      verdict: LEAK,
      reason: "the isolation suite ran and did not pass",
      detail:
        "The suite ran and did not pass. Treat as a potential cross-tenant " +
        "leak until proven otherwise.",
      exitCode: 1,
      evidence: firstMatch(text, [MARKER_FAILED]),
    };
  }

  if (MARKER_NOT_CHECKED.test(text) || MARKER_PRECONDITION.test(text)) {
    return {
      ...base,
      verdict: NOT_CHECKED,
      reason: "precondition failed",
      detail:
        "The suite reached the database, but a required precondition was not " +
        "met. Tenant-isolation state is unknown, not clean and not a " +
        "confirmed cross-tenant leak.",
      exitCode: 1,
      evidence: firstMatch(text, [MARKER_NOT_CHECKED, MARKER_PRECONDITION]),
    };
  }

  if (MARKER_GREEN.test(text)) {
    if (submitterSucceeded(submitterRc)) {
      return {
        ...base,
        verdict: GREEN,
        reason: "every probe passed",
        detail: "Every tenant x table probe passed. No cross-tenant rows visible.",
        exitCode: 0,
        evidence: firstMatch(text, [MARKER_GREEN]),
      };
    }
    return {
      ...base,
      verdict: NOT_CHECKED,
      reason: "green marker under a submitter that did not succeed",
      detail:
        "The suite printed a pass, but the operator job did not succeed, so " +
        "what the run established is unknown. The submitter fails on its own " +
        "post-run work independently of the container's exit status, so this " +
        "is not evidence that the isolation boundary was exercised and held.",
      exitCode: 1,
      evidence: firstMatch(text, [MARKER_GREEN]),
    };
  }

  return {
    ...base,
    verdict: NOT_CHECKED,
    reason: "suite reached no verdict",
    detail:
      "The suite did not reach a verdict, so tenant-isolation state is " +
      "unknown. Common causes: the database was unreachable, or " +
      "tests/security/rls-regression.sql is missing from the deployed image.",
    exitCode: 1,
    evidence: null,
  };
}

const HEADINGS = {
  [GREEN]: "GREEN",
  [LEAK]: "TENANT ISOLATION FAILURE",
  [NOT_CHECKED]: "NOT CHECKED",
};

/** The GitHub step-summary markdown for a verdict. */
export function renderSummary(result, { logTail = null } = {}) {
  const lines = [
    `## Result — ${HEADINGS[result.verdict]}`,
    "",
    `**Target:** ${result.label}`,
    "",
    result.detail,
    "",
    `- verdict: \`${result.verdict}\` (${result.reason})`,
    `- submitter exit code: \`${result.submitterRc ?? ""}\``,
  ];
  const quoted = result.evidence ?? logTail;
  if (quoted) lines.push("", "```", quoted, "```");
  return `${lines.join("\n")}\n`;
}

/** The one-line annotation GitHub renders against the run. */
export function renderAnnotation(result) {
  if (result.verdict === GREEN) return null;
  const prefix =
    result.verdict === LEAK
      ? "RLS FAILURE · the isolation suite ran and did not pass"
      : `NOT CHECKED · isolation state unknown — ${result.reason}`;
  return `::error::${prefix}`;
}

function readFlag(argv, flag) {
  const i = argv.indexOf(flag);
  return i === -1 ? undefined : argv[i + 1];
}

function main(argv) {
  const unknown = unknownFlags(argv, {
    value: ["--logs", "--rc", "--label", "--summary"],
    boolean: [],
  });
  if (unknown.length > 0) {
    process.stderr.write(
      `unrecognised flag(s): ${unknown.join(" ")}\n` +
        "An unrecognised flag is parsed as nothing, so the check you asked for " +
        "would not run. Refused rather than passed silently.\n",
    );
    process.exit(2);
  }

  const logsPath = readFlag(argv, "--logs");
  const rc = readFlag(argv, "--rc");
  const label = readFlag(argv, "--label") ?? "";
  const summaryPath = readFlag(argv, "--summary") ?? process.env.GITHUB_STEP_SUMMARY;

  let logText = "";
  let logTail = null;
  if (logsPath) {
    try {
      logText = fs.readFileSync(logsPath, "utf8");
      logTail = logText.split("\n").slice(-20).join("\n").trim() || null;
    } catch {
      logText = "";
    }
  }

  const result = classifyRlsRegression({ logText, submitterRc: rc, label });
  const summary = renderSummary(result, {
    logTail: result.evidence ? null : logTail,
  });

  if (summaryPath) {
    try {
      fs.appendFileSync(summaryPath, summary);
    } catch (err) {
      process.stderr.write(`could not write the step summary: ${String(err)}\n`);
    }
  } else {
    process.stdout.write(summary);
  }

  const annotation = renderAnnotation(result);
  if (annotation) process.stdout.write(`${annotation}\n`);
  process.stdout.write(`rls-regression verdict: ${result.verdict} (${result.reason})\n`);
  process.exit(result.exitCode);
}

if (isDirectInvocation(import.meta.url)) main(process.argv.slice(2));
