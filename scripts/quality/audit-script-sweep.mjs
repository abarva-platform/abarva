#!/usr/bin/env node
/**
 * What happens when you actually run the repository's unclassified audit scripts?
 *
 * `docs/architecture/ci-gate-registry.json` carries 185 scripts marked
 * `unclassified` — the backlog of `audit:` / `validate:` / `check:` entries whose
 * kind nobody has decided. Six of them have ever been executed against `main`;
 * four of those six failed. So the count of failing-and-invisible gates is known
 * to be at least four and unknown above that, and the classification work that
 * depends on it (which of these is a gate, which is a report, which is an
 * operator action) has been proceeding on the names alone.
 *
 * This runs them and records what happened. It is a measurement, not a gate: it
 * always exits 0 and it classifies nothing in the registry.
 *
 *   node scripts/quality/audit-script-sweep.mjs --list    # what would run, no execution
 *   node scripts/quality/audit-script-sweep.mjs           # run the sweep, print the summary
 *   node scripts/quality/audit-script-sweep.mjs --write   # run it and refresh the committed report
 *
 * WHY THE TREE IS CHECKED AFTER EVERY RUN, AND NOT THE SOURCE BEFORE IT. The
 * obvious way to keep a sweep safe is to read each entry file, skip anything
 * containing `writeFileSync`, and run the rest. That was tried first and it is
 * wrong in the dangerous direction. Of the first ten scripts it declared safe,
 * four wrote fifteen tracked files under `reports/` — they write through an
 * imported helper, so the entry file mentions no write call at all. A static
 * read of one file cannot answer what a program does.
 *
 * So the question is asked the only way it can be answered: run the script, then
 * ask git what changed. A script that dirties the working tree is a writer no
 * matter what its name or its source suggests, and this is the evidence item 45's
 * classification needs — an `audit:` prefix is not a promise, and 66 of these 185
 * entry points are named `build-*` or `promote-*`.
 *
 * Every run is followed by a restore, so the sweep leaves the tree as it found
 * it. The restore is scoped to the paths that changed.
 *
 * WHAT IT DELIBERATELY SEPARATES. A script that exits non-zero because
 * `DATABASE_URL` is unset has not found a defect; it has found an empty
 * environment, and counting it as a failure would inflate the number this exists
 * to establish. Those are recorded as `needs_environment` and excluded from the
 * failure count. The distinction runs off the process output, and it is
 * deliberately narrow: a failure whose text merely mentions a database is a
 * failure. A predicate tightened until nothing is a real failure would be as
 * useless as no predicate at all.
 *
 * WHAT IT CANNOT SEE. A write to a gitignored path, or to anywhere outside the
 * repository, is invisible to the tree check. Nothing in the swept set shells out
 * to `az`, `gh`, `docker`, `psql` or a browser driver — that is asserted before
 * anything runs, and a script that gains such a call is refused rather than run.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const REPORT_RELATIVE_PATH = "docs/architecture/audit-script-sweep.json";

/** Per-script wall-clock ceiling. The slowest observed run is under two seconds. */
export const DEFAULT_TIMEOUT_MS = 90_000;

/**
 * Commands that reach outside this checkout. None of the swept scripts contains
 * one today; if one appears, it is refused rather than executed, because a sweep
 * that deploys something is not a sweep.
 */
const EXTERNAL_COMMAND_RE =
  /(?:^|[\s;&|(])(?:az|aws|gcloud|docker|kubectl|vercel|gh|psql|pg_dump|playwright|terraform)(?:\s|$)/;

/**
 * Output that means the environment is empty, not that the subject is broken.
 * Each alternative names a credential, a connection, or a stated missing
 * variable. "Database" on its own is not here, and must not be: several of these
 * scripts audit database projections and say so while failing for real reasons.
 */
const ENVIRONMENT_SIGNAL_RE = new RegExp(
  [
    String.raw`\b(?:DATABASE_URL|POSTGRES_URL|ANTHROPIC_API_KEY|OPENAI_API_KEY|AZURE_[A-Z_]+|CLERK_[A-Z_]+|BLOB_[A-Z_]+|SERVICE_BUS_[A-Z_]+)\b[^\n]{0,80}?\b(?:not set|unset|missing|required|undefined|is empty)\b`,
    String.raw`\b(?:missing|no|unset|absent)\b[^\n]{0,40}?\b(?:DATABASE_URL|POSTGRES_URL|ANTHROPIC_API_KEY|OPENAI_API_KEY|AZURE_[A-Z_]+|CLERK_[A-Z_]+|connection string|credentials?)\b`,
    String.raw`\b(?:ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|getaddrinfo)\b`,
    String.raw`\bself[- ]signed certificate\b`,
    String.raw`\bpassword authentication failed\b`,
  ].join("|"),
  "i",
);

/** Outcome of one swept script. */
export const OUTCOMES = Object.freeze({
  PASSED: "passed",
  FAILED: "failed",
  TIMED_OUT: "timed_out",
  NEEDS_ENVIRONMENT: "needs_environment",
  NOT_RUNNABLE: "not_runnable",
});

/**
 * Which registry entries this sweep is for, and what each one runs.
 *
 * An entry with no `package.json` script is reported as `not_runnable` rather
 * than dropped — a registry naming a script that does not exist is itself a
 * finding, and a silent drop would hide it.
 */
export function selectSweepTargets(entries, packageScripts, options = {}) {
  const kinds = new Set(options.kinds ?? ["unclassified"]);
  const targets = [];
  for (const [script, entry] of Object.entries(entries ?? {})) {
    const kind = entry?.kind;
    if (!kinds.has(kind)) continue;
    const command = packageScripts?.[script];
    if (typeof command !== "string" || command.trim() === "") {
      targets.push({
        script,
        kind,
        command: null,
        runnable: false,
        refusal: "no package.json script of this name",
      });
      continue;
    }
    if (EXTERNAL_COMMAND_RE.test(command)) {
      targets.push({
        script,
        kind,
        command,
        runnable: false,
        refusal: "command reaches outside this checkout",
      });
      continue;
    }
    targets.push({ script, kind, command, runnable: true, refusal: null });
  }
  return targets.sort((a, b) => a.script.localeCompare(b.script));
}

/**
 * What one execution proved.
 *
 * `changedPaths` is what git reported after the run. It decides `writesRepoFiles`
 * on its own: a script that changed a tracked file is a writer even when it
 * exited 0, even when it is named `audit:`, and even when its entry file
 * contains no write call.
 */
export function classifyRunOutcome(run) {
  const {
    exitCode = null,
    timedOut = false,
    stdout = "",
    stderr = "",
    changedPaths = [],
    runnable = true,
    refusal = null,
  } = run ?? {};

  const writesRepoFiles = changedPaths.length > 0;

  if (!runnable) {
    return {
      outcome: OUTCOMES.NOT_RUNNABLE,
      reason: refusal ?? "not runnable",
      writesRepoFiles,
    };
  }
  if (timedOut) {
    return {
      outcome: OUTCOMES.TIMED_OUT,
      reason: "no exit within the per-script ceiling",
      writesRepoFiles,
    };
  }
  if (exitCode === 0) {
    return { outcome: OUTCOMES.PASSED, reason: null, writesRepoFiles };
  }

  const output = `${stdout}\n${stderr}`;
  const environmentSignal = output.match(ENVIRONMENT_SIGNAL_RE);
  if (environmentSignal) {
    return {
      outcome: OUTCOMES.NEEDS_ENVIRONMENT,
      reason: environmentSignal[0].trim().slice(0, 160),
      writesRepoFiles,
    };
  }
  return {
    outcome: OUTCOMES.FAILED,
    reason: firstMeaningfulLine(output) ?? `exit ${exitCode}`,
    writesRepoFiles,
  };
}

/** The first line of output that says something, for the report's failure column. */
export function firstMeaningfulLine(output) {
  const lines = String(output ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line !== "" &&
        !/^npm (?:ERR!|WARN|notice)/.test(line) &&
        !/^>/.test(line),
    );
  return lines.length > 0 ? lines[0].slice(0, 200) : null;
}

/** The counts the item asks for. */
export function summarizeSweep(results) {
  const summary = {
    total: results.length,
    passed: 0,
    failed: 0,
    timedOut: 0,
    needsEnvironment: 0,
    notRunnable: 0,
    writesRepoFiles: 0,
    passedButWrites: 0,
  };
  for (const result of results) {
    if (result.outcome === OUTCOMES.PASSED) summary.passed += 1;
    else if (result.outcome === OUTCOMES.FAILED) summary.failed += 1;
    else if (result.outcome === OUTCOMES.TIMED_OUT) summary.timedOut += 1;
    else if (result.outcome === OUTCOMES.NEEDS_ENVIRONMENT)
      summary.needsEnvironment += 1;
    else if (result.outcome === OUTCOMES.NOT_RUNNABLE) summary.notRunnable += 1;
    if (result.writesRepoFiles) {
      summary.writesRepoFiles += 1;
      if (result.outcome === OUTCOMES.PASSED) summary.passedButWrites += 1;
    }
  }
  return summary;
}

function git(args, cwd = REPO_ROOT) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

/** Paths git reports as changed, tracked and untracked alike. */
function changedPathsNow(cwd = REPO_ROOT) {
  const status = git(["status", "--porcelain"], cwd);
  return String(status.stdout ?? "")
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter((line) => line !== "");
}

/** Put back exactly what the last script touched. */
function restore(paths, cwd = REPO_ROOT) {
  if (paths.length === 0) return;
  git(["checkout", "--", ...paths], cwd);
  git(["clean", "-fdq", "--", ...paths], cwd);
}

function runOne(target, timeoutMs, cwd = REPO_ROOT) {
  if (!target.runnable) {
    return {
      ...target,
      durationMs: 0,
      exitCode: null,
      changedPaths: [],
      ...classifyRunOutcome(target),
    };
  }
  const startedAt = Date.now();
  const child = spawnSync("npm", ["run", "--silent", target.script], {
    cwd,
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 32 * 1024 * 1024,
  });
  const durationMs = Date.now() - startedAt;
  const timedOut = child.error?.code === "ETIMEDOUT" || child.signal !== null;
  const changedPaths = changedPathsNow(cwd);
  restore(changedPaths, cwd);

  const classified = classifyRunOutcome({
    exitCode: child.status,
    timedOut,
    stdout: child.stdout ?? "",
    stderr: child.stderr ?? "",
    changedPaths,
    runnable: true,
  });
  return {
    script: target.script,
    kind: target.kind,
    command: target.command,
    durationMs,
    exitCode: child.status,
    changedPaths: changedPaths.slice(0, 20),
    changedPathCount: changedPaths.length,
    ...classified,
  };
}

function loadInputs(cwd = REPO_ROOT) {
  const packageScripts = JSON.parse(
    readFileSync(path.join(cwd, "package.json"), "utf8"),
  ).scripts;
  const entries = JSON.parse(
    readFileSync(path.join(cwd, "docs/architecture/ci-gate-registry.json"), "utf8"),
  ).entries;
  return { packageScripts, entries };
}

function main(argv) {
  const listOnly = argv.includes("--list");
  const write = argv.includes("--write");
  const { packageScripts, entries } = loadInputs();
  const targets = selectSweepTargets(entries, packageScripts);

  if (listOnly) {
    for (const target of targets) {
      console.log(
        `${target.runnable ? "run   " : "refuse"} ${target.script}${target.refusal ? ` — ${target.refusal}` : ""}`,
      );
    }
    console.log(
      `\n${targets.length} entries; ${targets.filter((t) => t.runnable).length} would run.`,
    );
    return;
  }

  // The report the sweep itself writes is not somebody's uncommitted work.
  const dirtyBefore = changedPathsNow().filter(
    (changed) => changed !== REPORT_RELATIVE_PATH,
  );
  if (dirtyBefore.length > 0) {
    console.error(
      `Working tree is not clean (${dirtyBefore.length} paths). The sweep restores what each script writes and cannot tell your changes from theirs. Commit or stash first.`,
    );
    process.exitCode = 0;
    return;
  }

  const results = [];
  for (const target of targets) {
    const result = runOne(target, DEFAULT_TIMEOUT_MS);
    results.push(result);
    process.stderr.write(
      `${result.outcome.padEnd(18)} ${result.writesRepoFiles ? "W" : " "} ${result.script}\n`,
    );
  }

  const summary = summarizeSweep(results);
  const report = {
    generatedAt: new Date().toISOString(),
    measuredAgainst: git(["rev-parse", "HEAD"]).stdout.trim(),
    scope: "every ci-gate-registry entry whose kind is unclassified",
    summary,
    results: results.map(({ command, ...rest }) => ({ command, ...rest })),
  };

  if (write) {
    writeFileSync(
      path.join(REPO_ROOT, REPORT_RELATIVE_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(`wrote ${REPORT_RELATIVE_PATH}`);
  }

  console.log(
    [
      "",
      `Swept ${summary.total} unclassified scripts.`,
      `  passed            ${summary.passed}`,
      `  failed            ${summary.failed}`,
      `  needs environment ${summary.needsEnvironment}`,
      `  timed out         ${summary.timedOut}`,
      `  not runnable      ${summary.notRunnable}`,
      `  wrote repo files  ${summary.writesRepoFiles} (of which ${summary.passedButWrites} also exited 0)`,
    ].join("\n"),
  );
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}
