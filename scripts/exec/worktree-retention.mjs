#!/usr/bin/env node
/**
 * Worktree retention — a rule with a control, not a cleanup run.
 *
 * On 2026-09-23T03:57Z a scheduled run could not start: the disk held 580 MiB
 * free of 926 GiB and `git worktree add` failed mid-checkout with ENOSPC. The
 * task file's first instruction is "create a worktree", so the failure was the
 * run, not the build. The standing instruction "remove it when the item is
 * merged" is a line in a task file, and two runs of that same task had not
 * followed it — the familiar shape of a rule nothing can fail.
 *
 * This reports, per registered worktree, whether it is PROVABLY safe to remove.
 * It never removes anything. Removing another agent's checkout is the
 * destructive version of the collision the claim protocol exists to prevent, so
 * the burden here is on proof, and everything unproven is `unknown`, never
 * `removable`.
 *
 * Three independent conditions must all hold for `removable`:
 *   1. the branch is merged by PR `mergedAt` — NOT by ancestry, because a
 *      squash merge is not an ancestor of the branch it closed;
 *   2. `git status --porcelain` is empty, so no uncommitted work is lost;
 *   3. no live claim in the operator register names the branch or the path.
 *
 * Usage:
 *   node scripts/exec/worktree-retention.mjs --json
 *   node scripts/exec/worktree-retention.mjs --claims ~/Downloads/EXECUTION_CLAIMS.md
 *   node scripts/exec/worktree-retention.mjs --check --free-floor-gib 10
 *   node scripts/exec/worktree-retention.mjs --emit-removals removals.sh
 *   node scripts/exec/worktree-retention.mjs --status-timeout-ms 15000
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { isDirectInvocation } from "./cli-entry.mjs";

export const CLAIM_WINDOW_MS = 3 * 60 * 60 * 1000;

/**
 * Per-worktree bound on the `git status` probe (item T-721).
 *
 * Chosen against measurement, not taste. A checkout on ordinary local storage
 * answers in about a second, and the live population classified at roughly nine
 * worktrees a minute, so 60 s is far above any legitimate read and cannot
 * manufacture an `unknown` out of a merely large repository. It is far below
 * the pathological case it exists for: a checkout whose files are evicted
 * cloud placeholders costs about a second PER FILE, which put one 4,014-file
 * worktree at roughly 67 minutes and the four under one root at over four
 * hours — long enough that no run ever saw a classification at all.
 */
export const STATUS_TIMEOUT_MS = 60_000;

/** Verdicts, ordered from most to least conservative. */
export const KEEP = "keep";
export const UNKNOWN = "unknown";
export const REMOVABLE = "removable";

/**
 * Parse `git worktree list --porcelain`.
 *
 * Records are separated by a blank line. The first line of each record is
 * `worktree <path>`; `bare`, `detached`, `locked` and `prunable` are valueless
 * or reason-carrying flags, and `branch` carries a full ref.
 */
export function parseWorktreePorcelain(text) {
  const entries = [];
  let current = null;
  for (const rawLine of String(text).split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line === "") {
      if (current) entries.push(current);
      current = null;
      continue;
    }
    const spaceAt = line.indexOf(" ");
    const key = spaceAt === -1 ? line : line.slice(0, spaceAt);
    const value = spaceAt === -1 ? "" : line.slice(spaceAt + 1);
    if (key === "worktree") {
      if (current) entries.push(current);
      current = { path: value, head: null, branch: null, bare: false, detached: false, locked: null, prunable: null };
      continue;
    }
    if (!current) continue;
    if (key === "HEAD") current.head = value;
    else if (key === "branch") current.branch = value.replace(/^refs\/heads\//, "");
    else if (key === "bare") current.bare = true;
    else if (key === "detached") current.detached = true;
    else if (key === "locked") current.locked = value || "locked";
    else if (key === "prunable") current.prunable = value || "prunable";
  }
  if (current) entries.push(current);
  return entries;
}

/**
 * Index merged pull requests by head branch name.
 *
 * A branch can carry several PRs over its life; the newest `mergedAt` wins, so
 * the proof quoted for a branch is the merge that actually closed it last.
 */
export function indexMergedBranches(prRows) {
  const index = new Map();
  for (const row of prRows || []) {
    if (!row || !row.headRefName || !row.mergedAt) continue;
    const prior = index.get(row.headRefName);
    if (!prior || String(row.mergedAt) > String(prior.mergedAt)) {
      index.set(row.headRefName, { number: row.number, mergedAt: row.mergedAt });
    }
  }
  return index;
}

/**
 * Parse claim lines out of the append-only operator register.
 *
 * Only the stamp and the raw line are needed here: whether a claim holds a
 * worktree is decided by whether the line mentions the branch or the path, and
 * that is a substring question over the whole line rather than over the
 * `files:` list, because a claim names its branch in prose.
 */
export function parseClaimLines(text) {
  const lines = [];
  for (const rawLine of String(text).split("\n")) {
    const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s*\|/.exec(rawLine);
    if (!match) continue;
    const stampMs = Date.parse(match[1]);
    if (Number.isNaN(stampMs)) continue;
    lines.push({ stamp: match[1], stampMs, text: rawLine });
  }
  return lines;
}

/**
 * Does a live claim hold this worktree?
 *
 * Deliberately a substring test rather than a parse of the `files:` list: a
 * claim states its branch in prose ("on branch `exec/x`") and never lists the
 * worktree among its files, so a files-only reader would free every checkout in
 * flight. A false hold costs one item; a false release costs someone's work.
 */
export function claimHolding(entry, claims, nowMs, windowMs = CLAIM_WINDOW_MS) {
  const needles = [];
  if (entry.branch) needles.push(entry.branch);
  if (entry.path) needles.push(entry.path);
  if (needles.length === 0) return null;
  let held = null;
  for (const claim of claims || []) {
    if (nowMs - claim.stampMs >= windowMs) continue;
    // A stamp in the future of the clock that reads it is NOT skipped. T-457
    // measured six such lines in one day's window; they are real claims with a
    // wrong stamp, and the arithmetic above already holds them, because
    // `now - future` is negative. Skipping them would free a live checkout,
    // which is the one error this control must not make.
    if (!needles.some((needle) => claim.text.includes(needle))) continue;
    if (!held || claim.stampMs > held.stampMs) held = claim;
  }
  return held;
}

/**
 * Classify one worktree. Reasons accumulate; the verdict is the most
 * conservative reason that applies, and `removable` is reached only when every
 * proof is present.
 */
export function classifyWorktree(entry, context) {
  const { mergedBranches, dirtyPaths, claims, selfPath, primaryPath, nowMs, claimWindowMs } = context;
  const reasons = [];
  let verdict = REMOVABLE;
  const demote = (next, reason) => {
    reasons.push(reason);
    if (next === KEEP) verdict = KEEP;
    else if (next === UNKNOWN && verdict !== KEEP) verdict = UNKNOWN;
  };

  if (entry.bare) demote(KEEP, "bare repository, not a disposable checkout");
  if (primaryPath && entry.path === primaryPath) demote(KEEP, "primary checkout");
  if (selfPath && entry.path === selfPath) demote(KEEP, "this run is working here");
  if (entry.locked) demote(KEEP, `locked: ${entry.locked}`);

  const held = claimHolding(entry, claims, nowMs, claimWindowMs);
  if (held) demote(KEEP, `live claim at ${held.stamp} names it`);

  const dirty = dirtyPaths instanceof Map ? dirtyPaths.get(entry.path) : undefined;
  if (dirty === undefined) demote(UNKNOWN, "working tree state not read");
  else if (dirty === null) demote(UNKNOWN, "working tree state unreadable");
  else if (dirty.length > 0) demote(KEEP, `${dirty.length} uncommitted or untracked path(s)`);

  let merge = null;
  if (entry.detached || !entry.branch) {
    demote(UNKNOWN, "detached HEAD: no branch whose merge could be proved");
  } else {
    merge = mergedBranches.get(entry.branch) || null;
    if (!merge) demote(UNKNOWN, `no merged PR for branch ${entry.branch}`);
    else reasons.push(`branch merged by PR #${merge.number} at ${merge.mergedAt}`);
  }

  if (verdict === REMOVABLE) reasons.push("clean, merged, unclaimed");
  return { path: entry.path, branch: entry.branch, head: entry.head, verdict, reasons, merge, heldBy: held ? held.stamp : null };
}

export function classifyWorktrees(entries, context) {
  return entries.map((entry) => classifyWorktree(entry, context));
}

export function summarise(results) {
  const counts = { [REMOVABLE]: 0, [UNKNOWN]: 0, [KEEP]: 0 };
  for (const result of results) counts[result.verdict] += 1;
  return { total: results.length, ...counts };
}

/* ------------------------------ CLI ------------------------------ */

function readArg(argv, name, fallback = null) {
  const at = argv.indexOf(name);
  return at === -1 || at === argv.length - 1 ? fallback : argv[at + 1];
}

function git(args, cwd, options = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
}

/**
 * Did this error come from the bound rather than from git?
 *
 * Node reports a `spawnSync` timeout as `code === "ETIMEDOUT"`; the signal is
 * checked as well so the answer does not depend on one runtime's spelling. Both
 * are read, neither is assumed.
 */
function isTimeout(error, killSignal) {
  return Boolean(error) && (error.code === "ETIMEDOUT" || error.signal === killSignal);
}

/**
 * Read each worktree's uncommitted state, under a bound (item T-721).
 *
 * A timeout resolves to `null`, which is the SAME value an unreadable checkout
 * already produced and which `classifyWorktree` already demotes to `unknown`.
 * That is deliberate: the safe branch exists and is covered, so what changed
 * here is which inputs reach it, not what it decides. An unread tree must never
 * be `removable` — every other proof can be present and the uncommitted work is
 * still there.
 *
 * The timed-out paths are returned separately because `unknown` is a safe
 * verdict and a useless one if nobody learns which worktrees produced it:
 * "37 worktrees could not be read" is a finding about the machine, and silence
 * is not. Nothing here treats a slow path as special by name — the cause is a
 * property of the storage, and a hard-coded directory list would go stale the
 * moment a checkout moved.
 *
 * `SIGKILL` rather than the default `SIGTERM`: this control's contract is to
 * return, and a child blocked in a filesystem fault is exactly the case that
 * can decline to notice a catchable signal. Nothing is at risk in killing it —
 * `git status --no-optional-locks` takes no lock and writes nothing.
 */
function readDirtyPaths(entries, timeoutMs = STATUS_TIMEOUT_MS) {
  const killSignal = "SIGKILL";
  const dirty = new Map();
  const timedOut = [];
  for (const entry of entries) {
    if (entry.bare) continue;
    try {
      if (!fs.existsSync(entry.path)) { dirty.set(entry.path, null); continue; }
      // `--no-optional-locks` so reading another run's checkout never takes its
      // index lock: this control must not contend with the work it is measuring.
      const out = git(["--no-optional-locks", "status", "--porcelain"], entry.path, {
        timeout: timeoutMs,
        killSignal,
      });
      dirty.set(entry.path, out.split("\n").filter((line) => line.trim() !== ""));
    } catch (error) {
      dirty.set(entry.path, null);
      if (isTimeout(error, killSignal)) timedOut.push(entry.path);
    }
  }
  return { dirty, timedOut };
}

function freeBytes(target) {
  try {
    const out = execFileSync("df", ["-k", target], { encoding: "utf8" });
    const row = out.trim().split("\n").pop().trim().split(/\s+/);
    return Number(row[3]) * 1024;
  } catch {
    return null;
  }
}

function main(argv) {
  const repoRoot = readArg(argv, "--repo", process.cwd());
  const claimsPath = readArg(argv, "--claims", path.join(process.env.HOME || "", "Downloads", "EXECUTION_CLAIMS.md"));
  const prIndexPath = readArg(argv, "--pr-index", null);
  const nowMs = readArg(argv, "--now", null) ? Date.parse(readArg(argv, "--now")) : Date.now();

  const entries = parseWorktreePorcelain(git(["worktree", "list", "--porcelain"], repoRoot));
  const primaryPath = entries.length > 0 ? entries[0].path : null;

  let prRows = [];
  if (prIndexPath) {
    prRows = JSON.parse(fs.readFileSync(prIndexPath, "utf8"));
  } else {
    prRows = JSON.parse(execFileSync("gh", ["pr", "list", "--state", "merged", "--limit", "9000", "--json", "number,headRefName,mergedAt"], {
      cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, GH_TOKEN: "" },
    }));
  }

  const claims = fs.existsSync(claimsPath) ? parseClaimLines(fs.readFileSync(claimsPath, "utf8")) : [];
  const statusTimeoutMs = Number(readArg(argv, "--status-timeout-ms", String(STATUS_TIMEOUT_MS)));
  const { dirty: dirtyPaths, timedOut } = readDirtyPaths(entries, statusTimeoutMs);
  const results = classifyWorktrees(entries, {
    mergedBranches: indexMergedBranches(prRows),
    dirtyPaths,
    claims,
    selfPath: process.cwd(),
    primaryPath,
    nowMs,
    claimWindowMs: CLAIM_WINDOW_MS,
  });

  const summary = { ...summarise(results), timedOut: timedOut.length };
  const emitPath = readArg(argv, "--emit-removals", null);
  if (emitPath) {
    const body = ["#!/bin/sh", "# Generated by scripts/exec/worktree-retention.mjs. Review before running.", "set -e", ""];
    for (const result of results.filter((r) => r.verdict === REMOVABLE)) {
      body.push(`# ${result.reasons.join("; ")}`);
      body.push(`git worktree remove ${JSON.stringify(result.path)} --force`);
    }
    fs.writeFileSync(emitPath, body.join("\n") + "\n");
  }

  if (argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ summary, timedOut, results }, null, 2) + "\n");
  } else {
    for (const result of results) {
      if (result.verdict === KEEP && !argv.includes("--all")) continue;
      process.stdout.write(`${result.verdict.padEnd(9)} ${result.path}\n    ${result.reasons.join("; ")}\n`);
    }
    process.stdout.write(`\n${summary.total} worktrees: ${summary.removable} removable, ${summary.unknown} unknown, ${summary.keep} keep\n`);
    // Named, not counted. The operator cannot act on "some worktrees were
    // unreadable", and the whole reason this bound exists is that these are
    // the checkouts nobody could see.
    if (timedOut.length > 0) {
      process.stdout.write(
        `\n${timedOut.length} worktree(s) exceeded the ${statusTimeoutMs} ms status bound and are unknown, never removable:\n`,
      );
      for (const timedOutPath of timedOut) process.stdout.write(`    ${timedOutPath}\n`);
    }
  }

  if (argv.includes("--check")) {
    const floorGib = Number(readArg(argv, "--free-floor-gib", "10"));
    const free = freeBytes(repoRoot);
    if (free === null) {
      process.stderr.write("worktree-retention: free space unreadable; failing closed\n");
      return 2;
    }
    const freeGib = free / 1024 ** 3;
    if (freeGib >= floorGib) {
      process.stdout.write(`worktree-retention: ${freeGib.toFixed(1)} GiB free, at or above the ${floorGib} GiB floor\n`);
      return 0;
    }
    // The floor alone decides this, not the reclaim available. A disk that
    // cannot hold the next checkout is the hazard; whether anything is
    // provably removable is the remedy, and `removable: 0` below the floor is
    // the case that needs a human rather than the case that needs silence.
    process.stderr.write(
      `worktree-retention: ${freeGib.toFixed(1)} GiB free, BELOW the ${floorGib} GiB floor. ` +
      `A run that starts here may fail ENOSPC mid-checkout, as one did at 2026-09-23T03:57Z. ` +
      `${summary.removable} of ${summary.total} worktrees are provably removable ` +
      `(branch merged by PR mergedAt, tree clean, no live claim); ` +
      `${summary.unknown} are unproven and must not be removed on this evidence. ` +
      `Run with --emit-removals <file> and review before running it.\n`,
    );
    return 1;
  }
  return 0;
}

// Resolved through `fs.realpathSync` on both sides (item T-723). The composed
// `file://${process.argv[1]}` string lost two cases: `import.meta.url` is the
// realpath, so a symlinked directory such as macOS `/tmp` never matched, and it
// percent-encodes a space where the composed form does not. Through a `/tmp`
// path this control — whose whole contract is to exit 1 below the free-space
// floor — printed nothing and exited 0.
if (isDirectInvocation(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
