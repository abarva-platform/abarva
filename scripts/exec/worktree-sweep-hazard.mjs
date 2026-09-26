#!/usr/bin/env node
/**
 * Is the directory I am about to create a worktree in swept by something else?
 * (item T-489)
 *
 * At 2026-09-26T00:19Z a full checkout at `/tmp/exec-run-20260925T235807`,
 * created per the operator task file's own first instruction, vanished
 * mid-session between two commands about 90 seconds apart, taking uncommitted
 * work with it; the next command died `uv_cwd ENOENT`. A second, independent
 * run of the same task lost a worktree in the same window. Nothing in the
 * register, the pulse file or the task instructions said who sweeps that
 * directory, on what trigger, or with what age bound. The claim protocol was
 * telling every agent to work somewhere another process may delete, and no
 * control could say so.
 *
 * `worktree-retention.mjs` is the other half of this and is not a candidate: it
 * never removes anything, and it calls a worktree `removable` only on three
 * independent proofs. The checkout that vanished had an unmerged branch, no PR,
 * uncommitted changes and a claim stamped 13 minutes earlier, so a faithful run
 * of that control would have excluded it on four grounds.
 *
 * WHAT THIS ASSERTS, AND WHAT IT DOES NOT
 *
 * It reads the host's OWN declarations — launchd job definitions, and the
 * scripts they run — and reports which of them delete under a candidate root,
 * and after how long. It does not hardcode a verdict about `/tmp`. A gate that
 * said "/tmp is unsafe" in prose would be the shape this directory exists
 * against: it could not notice the rule changing, it could not be wrong in a
 * way anyone sees, and it would say nothing at all about a root nobody had
 * thought of.
 *
 * On a macOS host today that reading finds `com.apple.tmp_cleaner`
 * (`/System/Library/LaunchDaemons/com.apple.tmp_cleaner.plist`,
 * `StartCalendarInterval` Hour 0 local) running `/usr/libexec/tmp_cleaner`,
 * which declares `daily_clean_tmps_dirs="/tmp"` and
 * `daily_clean_tmps_days="3"` and deletes files there on atime, mtime AND
 * ctime past that bound. It consults no branch, no index and no claim.
 *
 * THREE INVERSIONS THIS REFUSES TO MAKE
 *
 * 1. `NOT_SWEPT` means "no DECLARED sweeper reaches this root", never "safe".
 *    A daemon whose program this cannot read, or which removes things in a form
 *    this does not parse, is invisible to it — so the count of such daemons is
 *    reported alongside every verdict rather than rounded to zero.
 * 2. An unreadable host is `UNKNOWN`, never `NOT_SWEPT`. Refusing costs one
 *    rerun; a false `NOT_SWEPT` costs the work.
 * 3. The age bound is WHEN, never WHETHER. Every worktree is younger than the
 *    bound at the moment it is created, and an item that runs long carries it
 *    past the bound with no second warning, so a verdict that consulted the
 *    candidate's current age would report safe at exactly the moment an agent
 *    asks.
 *
 * Usage:
 *   node scripts/exec/worktree-sweep-hazard.mjs --check-root /tmp/exec-x
 *   node scripts/exec/worktree-sweep-hazard.mjs --check-root "$PWD" --json
 *   node scripts/exec/worktree-sweep-hazard.mjs --check-root /x --launch-daemons <dir>
 *
 * Exit: 0 no declared sweeper reaches it, 1 swept, 2 unknown or misused.
 */

import fs from "node:fs";
import path from "node:path";

import { isDirectInvocation, unknownFlags } from "./cli-entry.mjs";

/** Where launchd job definitions live on a macOS host. */
export const DEFAULT_LAUNCH_DAEMONS_DIR = "/System/Library/LaunchDaemons";

/**
 * Only a script can carry a declaration this control understands, so only a
 * program beginning `#!` is read, and only up to this many bytes.
 *
 * Without the bound this would read every Mach-O binary that several hundred
 * system daemons point at, to look for a shell variable assignment that cannot
 * be in one. The shebang test is the precise version of that bound rather than
 * a size heuristic, and a program it skips is counted in `undeclared`, never
 * silently dropped.
 */
export const PROGRAM_READ_CAP_BYTES = 256 * 1024;

export const SWEPT = "swept";
export const NOT_SWEPT = "not_swept";
export const UNKNOWN = "unknown";

/**
 * The swept roots and age bound a cleaner script declares about itself.
 *
 * Returns `{ roots: [], days: null }` for a script that declares nothing. That
 * is "this script told me nothing", not "this script removes nothing", and the
 * caller keeps the difference by counting such programs rather than dropping
 * them.
 */
export function parseCleanerScript(text) {
  const dirs = /^\s*daily_clean_tmps_dirs\s*=\s*"([^"]*)"/m.exec(text);
  const days = /^\s*daily_clean_tmps_days\s*=\s*"?(\d+)"?/m.exec(text);
  return {
    roots: dirs ? dirs[1].split(/\s+/).filter((entry) => entry.startsWith("/")) : [],
    days: days ? Number(days[1]) : null,
  };
}

/** The first `<string>` inside the named `<array>`, or null. */
function firstArrayString(xml, key) {
  const block = new RegExp(`<key>${key}</key>\\s*<array>([\\s\\S]*?)</array>`).exec(xml);
  if (!block) return null;
  const first = /<string>([\s\S]*?)<\/string>/.exec(block[1]);
  return first ? first[1].trim() : null;
}

/** The named `<string>` value, or null. */
function plistString(xml, key) {
  const match = new RegExp(`<key>${key}</key>\\s*<string>([\\s\\S]*?)</string>`).exec(xml);
  return match ? match[1].trim() : null;
}

/**
 * Label, program and schedule from a launchd job definition.
 *
 * Deliberately a reader of the canonical Apple plist shape rather than a
 * general XML parser: this is an observation tool, and every field it cannot
 * read comes back `null` — which makes the job contribute nothing and be
 * counted as undeclared, rather than produce a confident wrong answer.
 */
export function parseLaunchdPlist(xml) {
  const label = plistString(xml, "Label");
  const program = plistString(xml, "Program") ?? firstArrayString(xml, "ProgramArguments");

  let schedule = null;
  const calendar = /<key>StartCalendarInterval<\/key>\s*<dict>([\s\S]*?)<\/dict>/.exec(xml);
  if (calendar) {
    const parts = [];
    const pair = /<key>([A-Za-z]+)<\/key>\s*<integer>(-?\d+)<\/integer>/g;
    let found;
    while ((found = pair.exec(calendar[1])) !== null) parts.push(`${found[1]} ${found[2]}`);
    schedule = `StartCalendarInterval${parts.length > 0 ? ` ${parts.join(" ")}` : ""}`;
  } else {
    const interval = /<key>StartInterval<\/key>\s*<integer>(\d+)<\/integer>/.exec(xml);
    if (interval) schedule = `StartInterval ${interval[1]}s`;
  }

  return { label, program, schedule };
}

/** True when `program` is a readable script — the only thing that can declare. */
function readShebangScript(program) {
  let handle = null;
  try {
    const stat = fs.statSync(program);
    if (!stat.isFile()) return null;
    handle = fs.openSync(program, "r");
    const head = Buffer.alloc(2);
    if (fs.readSync(handle, head, 0, 2, 0) < 2 || head.toString("latin1") !== "#!") return null;
    const size = Math.min(stat.size, PROGRAM_READ_CAP_BYTES);
    const body = Buffer.alloc(size);
    fs.readSync(handle, body, 0, size, 0);
    return body.toString("utf8");
  } catch {
    return null;
  } finally {
    if (handle !== null) {
      try {
        fs.closeSync(handle);
      } catch {
        /* closing a handle we already read is not worth failing over */
      }
    }
  }
}

/**
 * Every declared sweeper on this host, plus whether the host could be read.
 *
 * `readable: false` is the fail-closed case and is never collapsed into "no
 * sweepers": a Linux runner and a macOS host with a cleaner are both "zero
 * sweepers found" to a caller that only counts the array.
 */
export function readHostSweepers({ launchDaemonsDir = DEFAULT_LAUNCH_DAEMONS_DIR } = {}) {
  let names = [];
  try {
    names = fs.readdirSync(launchDaemonsDir).filter((name) => name.endsWith(".plist"));
  } catch {
    return { readable: false, launchDaemonsDir, sweepers: [], undeclared: 0 };
  }

  const sweepers = [];
  let undeclared = 0;
  for (const name of names.sort()) {
    const full = path.join(launchDaemonsDir, name);
    let job;
    try {
      job = parseLaunchdPlist(fs.readFileSync(full, "utf8"));
    } catch {
      undeclared += 1;
      continue;
    }
    if (!job.program) {
      undeclared += 1;
      continue;
    }
    const script = readShebangScript(job.program);
    if (script === null) {
      undeclared += 1;
      continue;
    }
    const declared = parseCleanerScript(script);
    if (declared.roots.length === 0) {
      undeclared += 1;
      continue;
    }
    sweepers.push({
      label: job.label ?? name.replace(/\.plist$/, ""),
      plist: full,
      program: job.program,
      schedule: job.schedule,
      roots: declared.roots,
      days: declared.days,
    });
  }
  return { readable: true, launchDaemonsDir, sweepers, undeclared };
}

/**
 * Resolve as much of `candidate` as exists through `fs.realpathSync`, keeping
 * the rest verbatim.
 *
 * An agent asks about a root BEFORE `git worktree add` creates it, so a plain
 * `realpathSync` would throw on the very call that matters. `path.resolve`
 * normalises a path and does NOT follow symlinks, and that exact substitution
 * already broke two controls in this directory (T-723): on macOS `/tmp` is a
 * symlink to `/private/tmp`, so a sweeper declaring one and a candidate typed
 * as the other are the same directory and must compare equal.
 */
export function resolveDeep(candidate) {
  const absolute = path.resolve(candidate);
  let head = absolute;
  const tail = [];
  for (;;) {
    try {
      return path.join(fs.realpathSync(head), ...tail);
    } catch {
      const parent = path.dirname(head);
      if (parent === head) return absolute;
      tail.unshift(path.basename(head));
      head = parent;
    }
  }
}

/**
 * Is `child` the directory `parent`, or inside it?
 *
 * Compared segment-wise, not by `startsWith`: `"/tmpfoo".startsWith("/tmp")` is
 * true and `/tmpfoo` is a different directory.
 */
export function containsPath(parent, child) {
  if (parent === child) return true;
  const withSep = parent.endsWith(path.sep) ? parent : parent + path.sep;
  return child.startsWith(withSep);
}

/**
 * Which declared sweepers reach `candidate`.
 *
 * The verdict never consults the candidate's age or contents. See inversion 3
 * in the header: the bound is when, not whether.
 */
export function classifyRoot(candidate, host) {
  const resolved = resolveDeep(candidate);
  if (!host || host.readable !== true) {
    return {
      verdict: UNKNOWN,
      candidate,
      resolved,
      sweptBy: null,
      matches: [],
      undeclared: host?.undeclared ?? 0,
      note: `cannot read ${host?.launchDaemonsDir ?? "the host's job definitions"}, so no root can be cleared here`,
    };
  }

  const matches = [];
  for (const sweeper of host.sweepers) {
    for (const root of sweeper.roots) {
      if (containsPath(resolveDeep(root), resolved)) {
        matches.push({ ...sweeper, matchedRoot: root });
        break;
      }
    }
  }
  // Soonest bound first, so the reported sweeper is the one that reaches it
  // first. An undeclared bound sorts first: unknown timing is not later timing.
  matches.sort((a, b) => (a.days ?? -1) - (b.days ?? -1));

  return {
    verdict: matches.length > 0 ? SWEPT : NOT_SWEPT,
    candidate,
    resolved,
    sweptBy: matches[0] ?? null,
    matches,
    undeclared: host.undeclared,
    note:
      matches.length > 0
        ? "a declared sweeper deletes under this root on a schedule, regardless of unpushed commits, a dirty tree or a live claim"
        : `no DECLARED sweeper reaches this root; ${host.undeclared} job(s) on this host declare nothing this can read, so this is not a proof of safety`,
  };
}

function readArg(argv, flag, fallback) {
  const at = argv.indexOf(flag);
  return at >= 0 && at + 1 < argv.length ? argv[at + 1] : fallback;
}

const USAGE =
  "usage: worktree-sweep-hazard.mjs --check-root <path> [--launch-daemons <dir>] [--json]\n" +
  "exit 0 no declared sweeper reaches it, 1 swept, 2 unknown or misused.\n";

function main(argv) {
  // An unrecognised flag parses to nothing, so the check asked for would not
  // run and would report success (T-748). Refused, and named.
  const stray = unknownFlags(argv, { value: ["--check-root", "--launch-daemons"], boolean: ["--json"] });
  if (stray.length > 0) {
    process.stderr.write(`worktree-sweep-hazard: unrecognised flag(s) ${stray.join(" ")}; refusing rather than ignoring\n${USAGE}`);
    return 2;
  }

  const candidate = readArg(argv, "--check-root", null);
  if (!candidate) {
    process.stderr.write(USAGE);
    return 2;
  }

  const host = readHostSweepers({ launchDaemonsDir: readArg(argv, "--launch-daemons", DEFAULT_LAUNCH_DAEMONS_DIR) });
  const result = classifyRoot(candidate, host);

  if (argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ ...result, declaredSweepers: host.sweepers }, null, 2) + "\n");
  }

  if (result.verdict === SWEPT) {
    const by = result.sweptBy;
    if (!argv.includes("--json")) {
      process.stdout.write(`SWEPT ${result.resolved}\n`);
    }
    process.stderr.write(
      `worktree-sweep-hazard: ${result.resolved} is SWEPT by ${by.label} ` +
        `(${by.plist}, ${by.schedule ?? "schedule undeclared"}) running ${by.program}, ` +
        `which declares ${by.matchedRoot} and an age bound of ${by.days === null ? "an undeclared number of" : by.days} day(s). ` +
        `It consults no branch, no index and no claim, so a worktree here can be deleted with unpushed commits in it — ` +
        `as one was at 2026-09-26T00:19Z. Put the worktree under a root nobody sweeps.\n`,
    );
    return 1;
  }

  if (result.verdict === UNKNOWN) {
    process.stderr.write(`worktree-sweep-hazard: UNKNOWN — ${result.note}; failing closed\n`);
    return 2;
  }

  if (!argv.includes("--json")) {
    process.stdout.write(`NOT_SWEPT ${result.resolved}\n    ${result.note}\n`);
  }
  return 0;
}

// Resolved through `fs.realpathSync` on both sides (T-723): through a `/tmp`
// path the composed-string guard answers "imported" and a control exits 0
// having done nothing — and `/tmp` is precisely where this one gets invoked.
if (isDirectInvocation(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
