#!/usr/bin/env node
/**
 * Classify the outcome of a read-only migration dry run.
 *
 * `Migration drift · nightly prod check` submits `db:migrate:dry` into the
 * private operator job and then has to decide what the job's log means. Four
 * things can be true, and they have four different remedies:
 *
 *   CLEAN          every migration in the repository is recorded as applied
 *   DRIFT_PENDING  migrations are committed and not applied  -> apply them
 *   DRIFT_LEDGER   an ALREADY-APPLIED migration file was edited afterwards
 *                  -> do not apply anything; find out who edited it
 *   DRIFT_BLOCKED  a pending migration carries unaudited destructive SQL
 *                  -> a human audits it and adds the opt-in marker
 *   NOT_CHECKED    the run did not get far enough to say  -> fix the harness
 *
 * Item C-629. This replaces an inline classifier in the workflow that got
 * three of those five wrong, and the shape of each mistake is worth keeping
 * written down because each one is a way for a control to look like it is
 * working:
 *
 *   - CLEAN was inferred from the ABSENCE of the drift header rather than the
 *     PRESENCE of the runner's clean marker, so a truncated log read as "all
 *     migrations are recorded as applied". A monitor that cannot see is not a
 *     monitor that saw nothing.
 *   - DRIFT_LEDGER and DRIFT_BLOCKED both leave `run-migrations.ts` with exit
 *     code 1, and a non-zero exit was read as NOT_CHECKED. Both are findings,
 *     and the ledger one is the more serious of the two drift kinds; both were
 *     reported as a failure to connect, pointing the operator at Azure login.
 *   - The DRIFT_PENDING count was re-derived from a `[0-9]{14}_...` filename
 *     regex instead of the runner's own `Pending migrations (N):` header. 42
 *     of the 392 files in `supabase/migrations` carry a three-digit prefix, so
 *     a pending legacy migration was dropped from the list and from the count.
 *
 * The verdicts are kept apart in the EXIT CODE as well as the wording, because
 * the run list is where this control is read first:
 *
 *   0  CLEAN
 *   1  a finding  (DRIFT_PENDING | DRIFT_LEDGER | DRIFT_BLOCKED)
 *   2  NOT_CHECKED
 *
 * Usage:
 *   node scripts/ci/classify-migration-drift.mjs \
 *     --rc <exit code of the operator-job wrapper> \
 *     --log <path to the job's 04-logs.txt> \
 *     [--summary <file to append the markdown report to>]
 */

import { appendFileSync, readFileSync } from "node:fs";

/** The runner's own output markers. `src/scripts/run-migrations.ts` is their only producer. */
const MARKERS = {
  clean: "No pending migrations.",
  pendingHeader: /Pending migrations \((\d+)\)/,
  ledgerDrift: "Migration drift detected",
  destructive: "Destructive migration patterns detected",
  dryTerminator: "(--dry mode, no changes)",
};

/**
 * A migration filename as the runner lists it: `   - <name>`, possibly behind
 * an Azure container-log line prefix. Deliberately NOT a timestamp pattern —
 * the runner lists whatever `listMigrationFiles` sorted, which includes the
 * three-digit legacy names.
 */
const LISTED_NAME = /-\s+(\S+\.sql)\s*$/;

/** Any `.sql` filename at the end of a line, for the ledger-drift block. */
const TRAILING_NAME = /(\S+\.sql)\s*$/;

export function parseArgs(argv) {
  const out = { rc: null, log: null, summary: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--rc") out.rc = argv[i + 1] ?? null;
    if (argv[i] === "--log") out.log = argv[i + 1] ?? null;
    if (argv[i] === "--summary") out.summary = argv[i + 1] ?? null;
  }
  return out;
}

/**
 * Collect the migration names the runner listed under `Pending migrations (N):`.
 *
 * Stops at the dry-mode terminator and never takes more than the header's own
 * count, so a `.sql` name printed further down the log cannot inflate the list
 * the way an unbounded `grep -A200` window could.
 */
function collectListedNames(lines, headerIndex, expected) {
  const names = [];
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    if (lines[i].includes(MARKERS.dryTerminator)) break;
    const match = LISTED_NAME.exec(lines[i]);
    if (match) {
      names.push(match[1]);
      if (names.length >= expected) break;
    }
  }
  return names;
}

function collectLedgerNames(lines, markerIndex) {
  const names = [];
  for (let i = markerIndex + 1; i < lines.length; i += 1) {
    if (/recorded:|current:/.test(lines[i])) continue;
    const match = TRAILING_NAME.exec(lines[i]);
    if (match) names.push(match[1]);
  }
  return [...new Set(names)];
}

/**
 * Decide the verdict from the wrapper's exit code and the job's log text.
 *
 * FINDINGS ARE CHECKED BEFORE THE EXIT CODE, deliberately. Two of them leave
 * the runner with a non-zero exit by design, so reading the exit code first is
 * exactly how a real finding came to be reported as a failure to look.
 */
export function classify({ rc, log }) {
  const lines = (log ?? "").split("\n");
  const hasBody = (log ?? "").trim().length > 0;

  const ledgerIndex = lines.findIndex((l) => l.includes(MARKERS.ledgerDrift));
  if (ledgerIndex !== -1) {
    return {
      verdict: "DRIFT_LEDGER",
      exit: 1,
      names: collectLedgerNames(lines, ledgerIndex),
      count: null,
      rc,
    };
  }

  const destructiveIndex = lines.findIndex((l) =>
    l.includes(MARKERS.destructive),
  );
  if (destructiveIndex !== -1) {
    return {
      verdict: "DRIFT_BLOCKED",
      exit: 1,
      names: collectLedgerNames(lines, destructiveIndex),
      count: null,
      rc,
    };
  }

  const headerIndex = lines.findIndex((l) => MARKERS.pendingHeader.test(l));
  if (headerIndex !== -1) {
    // The header's number is authoritative. The name list is best effort, and
    // when it falls short the verdict stands and the shortfall is reported —
    // downgrading a real finding because the list is lossy is the defect this
    // script exists against.
    const count = Number(MARKERS.pendingHeader.exec(lines[headerIndex])[1]);
    return {
      verdict: "DRIFT_PENDING",
      exit: 1,
      names: collectListedNames(lines, headerIndex, count),
      count,
      rc,
    };
  }

  if (String(rc) !== "0" || !hasBody) {
    return {
      verdict: "NOT_CHECKED",
      exit: 2,
      names: [],
      count: null,
      rc,
      reason: !hasBody
        ? "the operator job produced no readable log"
        : `the operator job exited ${rc} and its log carries no verdict marker`,
    };
  }

  if (lines.some((l) => l.includes(MARKERS.clean))) {
    return { verdict: "CLEAN", exit: 0, names: [], count: null, rc };
  }

  // Exit code 0, a log with content, and no marker at all. The dry run did not
  // reach either of its two terminal statements, so drift state is unknown.
  return {
    verdict: "NOT_CHECKED",
    exit: 2,
    names: [],
    count: null,
    rc,
    reason:
      "the log carries neither the clean marker nor a drift marker — the dry run did not reach a terminal statement, so its output is incomplete",
  };
}

export function renderSummary(result) {
  const { verdict, names, count, rc } = result;
  const lines = [];

  if (verdict === "CLEAN") {
    lines.push("## Result — CLEAN, NO DRIFT");
    lines.push("");
    lines.push(
      "The dry run reported its clean marker: all migrations in the repository are recorded as applied.",
    );
    lines.push("");
    lines.push(
      "Note: this compares the migrations directory against the `schema_migrations` ledger. A migration recorded as applied whose objects are absent from the database is NOT detected here.",
    );
  } else if (verdict === "DRIFT_PENDING") {
    lines.push("## Result — DRIFT (pending)");
    lines.push("");
    lines.push(`**${count} migration(s) committed but not applied.**`);
    lines.push("");
    lines.push("```");
    lines.push(...(names.length > 0 ? names : ["(none extracted)"]));
    lines.push("```");
    if (names.length !== count) {
      lines.push("");
      lines.push(
        `> The runner's header is authoritative and says ${count}; only ${names.length} of ${count} name(s) could be read out of the log. The verdict stands — the list above is incomplete, so confirm it against the job log before applying.`,
      );
    }
    lines.push("");
    lines.push("Apply via the `Database migration — lab` workflow (mode=apply).");
  } else if (verdict === "DRIFT_LEDGER") {
    lines.push("## Result — DRIFT (ledger)");
    lines.push("");
    lines.push(
      "**An already-applied migration file was modified after it ran.** This database executed different SQL than what is on disk now, so `schema_migrations` is no longer a trustworthy record of what ran.",
    );
    if (names.length > 0) {
      lines.push("");
      lines.push("```");
      lines.push(...names);
      lines.push("```");
    }
    lines.push("");
    lines.push(
      "**Do not apply anything.** Find out how the file changed. Re-recording the hash with `--force` is only correct once the change is understood.",
    );
  } else if (verdict === "DRIFT_BLOCKED") {
    lines.push("## Result — DRIFT (blocked on a destructive pattern)");
    lines.push("");
    lines.push(
      "**A pending migration carries destructive SQL with no audit marker**, so the runner refused it before listing the pending set. There is drift AND it cannot be applied as it stands.",
    );
    if (names.length > 0) {
      lines.push("");
      lines.push("```");
      lines.push(...names);
      lines.push("```");
    }
    lines.push("");
    lines.push(
      "A human reviews the destructive change and adds `-- migration:destructive-allowed` to the file if it is intended. See CONTRIBUTING-MIGRATIONS.md.",
    );
  } else {
    lines.push("## Result — NOT CHECKED");
    lines.push("");
    lines.push(
      "The drift check did not run to completion, so **drift state is unknown**. This is not a clean result and must not be read as one.",
    );
    lines.push("");
    lines.push(`- reason: ${result.reason}`);
    lines.push(`- operator job exit code: \`${rc}\``);
    lines.push("");
    lines.push(
      "Check Azure login, the operator job, and the `azure-postgres-control-database-url` secret.",
    );
  }

  lines.push("");
  return lines.join("\n");
}

function headline(result) {
  switch (result.verdict) {
    case "CLEAN":
      return "CLEAN · all migrations are recorded as applied";
    case "DRIFT_PENDING":
      return `DRIFT_PENDING · ${result.count} migration(s) committed but not applied`;
    case "DRIFT_LEDGER":
      return "DRIFT_LEDGER · an already-applied migration file was modified after it ran";
    case "DRIFT_BLOCKED":
      return "DRIFT_BLOCKED · a pending migration carries unaudited destructive SQL";
    default:
      return `NOT_CHECKED · drift state unknown — ${result.reason}`;
  }
}

function main() {
  const { rc, log: logPath, summary } = parseArgs(process.argv.slice(2));

  let log = null;
  try {
    log = logPath ? readFileSync(logPath, "utf8") : null;
  } catch {
    log = null; // absent log — NOT_CHECKED, same as an empty one.
  }

  const result = classify({ rc, log });
  const report = renderSummary(result);

  if (summary) {
    try {
      appendFileSync(summary, report, "utf8");
    } catch (err) {
      console.error(
        `warning: could not append the report to ${summary}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const line = headline(result);
  if (result.exit === 0) {
    console.log(line);
  } else {
    // ::error:: so the verdict is the first thing in the run's annotation.
    console.error(`::error::${line}`);
  }
  console.log(result.verdict);

  process.exit(result.exit);
}

const invokedAsScript = process.argv[1]?.includes("classify-migration-drift");
if (invokedAsScript) main();
