#!/usr/bin/env node
/**
 * Behavioural test for the worktree retention control (item T-719).
 *
 * The defect this exists against is not a wrong classification; it is a rule
 * nothing could fail. "Remove your worktree when the item is merged" has been
 * in the task file since 18 Sep, two runs of that same task did not follow it,
 * and at 2026-09-23T03:57Z a run could not start at all — 580 MiB free of
 * 926 GiB, `git worktree add` dying ENOSPC mid-checkout.
 *
 * So the asymmetry below is the whole contract, and every case exists to hold
 * one side of it down:
 *
 *   a worktree wrongly called `keep` costs one item's disk.
 *   a worktree wrongly called `removable` costs someone's uncommitted work.
 *
 * `removable` therefore requires three independent proofs and `unknown` is the
 * default for everything else. The cases that matter most are the ones where a
 * plausible simplification would flip an unproven worktree to `removable`.
 *
 * Cases 1–14 run the exported classifier over fixtures. Cases 15–18 run the
 * real CLI as a child process over a REAL temporary git repository with real
 * worktrees, because a decision function nothing calls is the T-708 shape: an
 * available control and a wired one look identical from outside.
 *
 * Run:  node scripts/exec/worktree-retention.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  CLAIM_WINDOW_MS,
  KEEP,
  REMOVABLE,
  UNKNOWN,
  classifyWorktree,
  indexMergedBranches,
  parseClaimLines,
  parseWorktreePorcelain,
  summarise,
} from "./worktree-retention.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "worktree-retention.mjs");

let passes = 0;
let failures = 0;

function check(name, condition, detail) {
  if (condition) {
    passes += 1;
    console.log(`  PASS  ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${name}`);
  if (detail) console.log(`        ${String(detail).split("\n").join("\n        ")}`);
}

const NOW = Date.parse("2026-09-23T06:00:00Z");

/** A merged-and-clean worktree: the only shape that may ever be `removable`. */
function baseContext(overrides = {}) {
  return {
    mergedBranches: indexMergedBranches([
      { number: 8200, headRefName: "exec/merged-branch", mergedAt: "2026-09-22T10:00:00Z" },
    ]),
    dirtyPaths: new Map([["/tmp/wt-merged", []]]),
    claims: [],
    selfPath: "/tmp/self",
    primaryPath: "/repo",
    nowMs: NOW,
    claimWindowMs: CLAIM_WINDOW_MS,
    ...overrides,
  };
}

const MERGED_ENTRY = {
  path: "/tmp/wt-merged",
  head: "aaaaaaa",
  branch: "exec/merged-branch",
  bare: false,
  detached: false,
  locked: null,
  prunable: null,
};

// ---------------------------------------------------------------------------
// Case 0 — the control point. Everything below is a departure from this.
// ---------------------------------------------------------------------------
{
  const r = classifyWorktree(MERGED_ENTRY, baseContext());
  check(
    "merged branch, clean tree, no claim: removable, and the merge is quoted by PR and mergedAt",
    r.verdict === REMOVABLE && r.merge.number === 8200 && r.reasons.some((x) => x.includes("2026-09-22T10:00:00Z")),
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Case 1 — dirt beats every other proof.
//
// This is the case that costs work if it is wrong, so it is asserted against
// the STRONGEST possible removable evidence: merged, unclaimed, unlocked.
// ---------------------------------------------------------------------------
{
  const r = classifyWorktree(MERGED_ENTRY, baseContext({
    dirtyPaths: new Map([["/tmp/wt-merged", [" M src/app/page.tsx", "?? notes.md"]]]),
  }));
  check(
    "a merged branch with two uncommitted paths is keep, not removable",
    r.verdict === KEEP && r.reasons.some((x) => x.includes("2 uncommitted")),
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Case 2 — no merged PR is `unknown`, and `unknown` is never `removable`.
// ---------------------------------------------------------------------------
{
  const r = classifyWorktree(
    { ...MERGED_ENTRY, branch: "exec/never-merged" },
    baseContext({ dirtyPaths: new Map([["/tmp/wt-merged", []]]) }),
  );
  check(
    "a clean worktree on a branch with no merged PR is unknown, never removable",
    r.verdict === UNKNOWN && r.reasons.some((x) => x.includes("no merged PR for branch exec/never-merged")),
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Case 3 — an OPEN PR on the branch is not a merge.
//
// The filing is explicit that merge is proved by `mergedAt` and not by the
// existence of a pull request. An index keyed on the row rather than on
// `mergedAt` passes every other case in this file and fails here.
// ---------------------------------------------------------------------------
{
  const r = classifyWorktree(MERGED_ENTRY, baseContext({
    mergedBranches: indexMergedBranches([
      { number: 8321, headRefName: "exec/merged-branch", mergedAt: null },
    ]),
  }));
  check(
    "an open PR on the branch does not make it merged",
    r.verdict === UNKNOWN,
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Case 4 — a live claim naming the BRANCH holds the worktree.
//
// The register line is the real shape: the branch appears in prose and the
// `files:` list names source files, never the checkout. A reader that parsed
// only `files:` would free every checkout in flight.
// ---------------------------------------------------------------------------
{
  const register = [
    "2026-09-23T05:19:33Z | source-backlog-executor#20260923T0517Z | item C-503 claimed on branch `exec/merged-branch` — taking it. files: src/lib/answer/shared-response-shaper.ts",
  ].join("\n");
  const r = classifyWorktree(MERGED_ENTRY, baseContext({ claims: parseClaimLines(register) }));
  check(
    "a live claim naming the branch in prose holds the worktree although it is merged and clean",
    r.verdict === KEEP && r.heldBy === "2026-09-23T05:19:33Z",
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Case 5 — a claim older than the window does not hold.
//
// Without this the control degrades to "never remove anything", which is the
// state that filled the disk.
// ---------------------------------------------------------------------------
{
  const register = [
    "2026-09-23T02:00:00Z | source-backlog-executor#20260923T0155Z | item C-400 claimed on branch `exec/merged-branch` — done long ago. files: x.ts",
  ].join("\n");
  const r = classifyWorktree(MERGED_ENTRY, baseContext({ claims: parseClaimLines(register) }));
  check(
    "a claim four hours old does not hold the worktree",
    r.verdict === REMOVABLE && r.heldBy === null,
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Case 6 — a claim stamped in the FUTURE still holds.
//
// T-457 measured six register lines stamped ahead of the clock that read them.
// They are real claims with a wrong stamp. Treating "ahead of now" as "outside
// the window" would free exactly those live checkouts.
// ---------------------------------------------------------------------------
{
  const register = [
    "2026-09-23T09:00:00Z | source-backlog-executor#20260923T0855Z | item C-600 claimed on branch `exec/merged-branch` — stamp is ahead of the clock. files: x.ts",
  ].join("\n");
  const r = classifyWorktree(MERGED_ENTRY, baseContext({ claims: parseClaimLines(register) }));
  check(
    "a claim stamped three hours in the future still holds the worktree",
    r.verdict === KEEP && r.heldBy === "2026-09-23T09:00:00Z",
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Case 7 — a live claim naming only the PATH holds it too.
// ---------------------------------------------------------------------------
{
  const register = [
    "2026-09-23T05:40:00Z | other-agent#run-2 | item D-900 claimed — working in /tmp/wt-merged this run. files: x.ts",
  ].join("\n");
  const r = classifyWorktree(MERGED_ENTRY, baseContext({ claims: parseClaimLines(register) }));
  check(
    "a live claim naming only the worktree path holds it",
    r.verdict === KEEP,
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Case 8 — a detached HEAD has no branch whose merge could be proved.
//
// Asserted with the dirt and the claims both absent, so the ONLY thing
// standing between this worktree and `removable` is the missing branch.
// ---------------------------------------------------------------------------
{
  const r = classifyWorktree(
    { ...MERGED_ENTRY, branch: null, detached: true },
    baseContext(),
  );
  check(
    "a clean, unclaimed, detached worktree is unknown rather than removable",
    r.verdict === UNKNOWN && r.reasons.some((x) => x.includes("detached HEAD")),
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Cases 9–11 — the three structural keeps, each asserted against otherwise
// perfect removable evidence.
// ---------------------------------------------------------------------------
{
  const r = classifyWorktree({ ...MERGED_ENTRY, path: "/repo" }, baseContext({
    dirtyPaths: new Map([["/repo", []]]),
  }));
  check("the primary checkout is keep", r.verdict === KEEP && r.reasons.includes("primary checkout"), JSON.stringify(r));
}
{
  const r = classifyWorktree({ ...MERGED_ENTRY, path: "/tmp/self" }, baseContext({
    dirtyPaths: new Map([["/tmp/self", []]]),
  }));
  check("the worktree this run is working in is keep", r.verdict === KEEP, JSON.stringify(r));
}
{
  const r = classifyWorktree({ ...MERGED_ENTRY, locked: "held for a rebase" }, baseContext());
  check(
    "a locked worktree is keep and the lock reason is carried",
    r.verdict === KEEP && r.reasons.some((x) => x.includes("held for a rebase")),
    JSON.stringify(r),
  );
}

// ---------------------------------------------------------------------------
// Cases 12–13 — an unread or unreadable working tree is unknown.
//
// `null` is "git refused"; `undefined` is "never asked". Treating either as
// clean is the single-character mistake that turns this control into a
// hazard, and neither is distinguishable from clean by shape alone.
// ---------------------------------------------------------------------------
{
  const r = classifyWorktree(MERGED_ENTRY, baseContext({ dirtyPaths: new Map([["/tmp/wt-merged", null]]) }));
  check("an unreadable working tree is unknown, not removable", r.verdict === UNKNOWN, JSON.stringify(r));
}
{
  const r = classifyWorktree(MERGED_ENTRY, baseContext({ dirtyPaths: new Map() }));
  check("a working tree that was never read is unknown, not removable", r.verdict === UNKNOWN, JSON.stringify(r));
}

// ---------------------------------------------------------------------------
// Case 14 — the newest merge wins when a branch carries several PRs.
// ---------------------------------------------------------------------------
{
  const index = indexMergedBranches([
    { number: 100, headRefName: "exec/merged-branch", mergedAt: "2026-09-01T00:00:00Z" },
    { number: 900, headRefName: "exec/merged-branch", mergedAt: "2026-09-22T10:00:00Z" },
    { number: 500, headRefName: "exec/merged-branch", mergedAt: "2026-09-10T00:00:00Z" },
  ]);
  check(
    "a branch with three merged PRs quotes the newest merge",
    index.get("exec/merged-branch").number === 900,
    JSON.stringify([...index]),
  );
}

// ---------------------------------------------------------------------------
// Case 15 — the porcelain parser.
//
// The last record has no trailing blank line, which is what git actually
// emits, and a parser that flushes only on a blank line loses it.
// ---------------------------------------------------------------------------
{
  const entries = parseWorktreePorcelain(
    [
      "worktree /repo", "HEAD aaa", "branch refs/heads/main", "",
      "worktree /tmp/a", "HEAD bbb", "detached", "",
      "worktree /tmp/b", "HEAD ccc", "branch refs/heads/exec/x", "locked needs a rebase", "",
      "worktree /tmp/last", "HEAD ddd", "branch refs/heads/exec/last",
    ].join("\n"),
  );
  check(
    "four records parse, refs/heads/ is stripped, detached and locked are read, and the last record survives",
    entries.length === 4 &&
      entries[0].branch === "main" &&
      entries[1].detached === true && entries[1].branch === null &&
      entries[2].locked === "needs a rebase" &&
      entries[3].path === "/tmp/last" && entries[3].branch === "exec/last",
    JSON.stringify(entries),
  );
}

// ---------------------------------------------------------------------------
// Cases 16–18 — the CLI, over a REAL temporary git repository.
//
// T-708's lesson: proving the decision function again is the substitution that
// lets unwired wiring look wired. What is asserted here is that running the
// script end to end — porcelain, status, PR index, register, free space —
// reaches the exit code, on worktrees git itself created.
// ---------------------------------------------------------------------------
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-retention-"));
  const repo = path.join(dir, "repo");
  const git = (args, cwd = repo) => execFileSync("git", args, { cwd, encoding: "utf8" });

  fs.mkdirSync(repo);
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "test@example.invalid"]);
  git(["config", "user.name", "test"]);
  fs.writeFileSync(path.join(repo, "a.txt"), "one\n");
  git(["add", "."]);
  git(["commit", "-qm", "one"]);

  // Merged and clean -> removable. Dirty on the same merged branch -> keep.
  git(["worktree", "add", "-q", "-b", "exec/done", path.join(dir, "done")]);
  git(["worktree", "add", "-q", "-b", "exec/dirty", path.join(dir, "dirty")]);
  fs.writeFileSync(path.join(dir, "dirty", "scratch.txt"), "uncommitted\n");
  git(["worktree", "add", "-q", "-b", "exec/open", path.join(dir, "open")]);

  const prIndex = path.join(dir, "prs.json");
  fs.writeFileSync(prIndex, JSON.stringify([
    { number: 1, headRefName: "exec/done", mergedAt: "2026-09-22T10:00:00Z" },
    { number: 2, headRefName: "exec/dirty", mergedAt: "2026-09-22T11:00:00Z" },
    { number: 3, headRefName: "exec/open", mergedAt: null },
  ]));
  const claims = path.join(dir, "EXECUTION_CLAIMS.md");
  fs.writeFileSync(claims, "# Claims\n\n## Claim log — append only\n\n");

  const run = (extra) => {
    try {
      const stdout = execFileSync(process.execPath, [
        CLI, "--repo", repo, "--pr-index", prIndex, "--claims", claims,
        "--now", "2026-09-23T06:00:00Z", ...extra,
      ], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      return { status: 0, stdout, stderr: "" };
    } catch (error) {
      return { status: error.status ?? -1, stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? "") };
    }
  };

  const json = run(["--json"]);
  let report = null;
  try { report = JSON.parse(json.stdout); } catch { /* reported below */ }
  const byPath = new Map((report?.results ?? []).map((r) => [r.path, r]));
  const real = (name) => byPath.get(fs.realpathSync(path.join(dir, name)))?.verdict;

  check(
    "over real worktrees: merged+clean is removable, merged+dirty is keep, open-PR is unknown, and the repo itself is keep",
    json.status === 0 &&
      real("done") === REMOVABLE &&
      real("dirty") === KEEP &&
      real("open") === UNKNOWN &&
      byPath.get(fs.realpathSync(repo))?.verdict === KEEP,
    `status=${json.status} verdicts=${JSON.stringify([...byPath].map(([p, r]) => [p, r.verdict]))} stderr=${json.stderr}`,
  );

  // The floor is the whole control, so both of its branches are exercised, and
  // both are made deterministic by the floor rather than by the machine.
  const above = run(["--check", "--free-floor-gib", "0"]);
  check("--check exits 0 when free space is at or above the floor", above.status === 0, `status=${above.status} ${above.stderr}`);

  const below = run(["--check", "--free-floor-gib", "999999"]);
  check(
    "--check exits 1 below the floor and names the removable count and the unproven remainder",
    below.status === 1 && /BELOW the 999999 GiB floor/.test(below.stderr) && /1 of \d+ worktrees are provably removable/.test(below.stderr),
    `status=${below.status} stderr=${below.stderr}`,
  );

  const emitted = path.join(dir, "removals.sh");
  run(["--emit-removals", emitted]);
  const script = fs.readFileSync(emitted, "utf8");
  check(
    "--emit-removals writes the merged+clean worktree and NOTHING else, and removes nothing itself",
    script.includes(fs.realpathSync(path.join(dir, "done"))) &&
      !script.includes(fs.realpathSync(path.join(dir, "dirty"))) &&
      !script.includes(fs.realpathSync(path.join(dir, "open"))) &&
      fs.existsSync(path.join(dir, "done")),
    script,
  );

  check(
    "the summary counts every registered worktree exactly once",
    report && report.summary.total === report.results.length &&
      report.summary.removable + report.summary.unknown + report.summary.keep === report.summary.total,
    JSON.stringify(report?.summary),
  );

  execFileSync("git", ["worktree", "remove", path.join(dir, "done"), "--force"], { cwd: repo });
  execFileSync("git", ["worktree", "remove", path.join(dir, "dirty"), "--force"], { cwd: repo });
  execFileSync("git", ["worktree", "remove", path.join(dir, "open"), "--force"], { cwd: repo });
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Cases 20-23 — the per-worktree status bound (item T-721).
//
// The defect is not a wrong verdict. It is that the control DOES NOT RETURN:
// `readDirtyPaths` ran `git status` per worktree with no bound, so one checkout
// whose reads block makes the whole classification run forever, and a control
// that does not return is a control that does not run — the family this backlog
// exists against. Measured on the live population: 212 of 798 worktrees in
// ~31 minutes, then a single checkout under `~/Documents/Codex/2026-04-28/`
// advanced 119 tracked files in 120 seconds on 0.03 s of CPU. Its files carry
// the macOS `dataless` flag, so every read git makes is a network fault. Four
// registered worktrees sit under that root, and a second run died ENOSPC on
// 2026-09-24 because no classification had ever completed.
//
// THE SLOW PATH HERE IS REAL, NOT MOCKED, AND IT GENUINELY EXCEEDS THE BOUND.
// A `git` shim earlier on PATH passes every subcommand through to the real git
// except `status`, which sleeps 3 s against a 300 ms bound — ten times over,
// so nothing here turns on a race. The sleep is FINITE on purpose: with the
// bound deleted the shim returns clean output after 3 s and the merged+clean
// worktree goes back to `removable`, so the mutation FAILS these cases instead
// of hanging them, which is the difference between a mutation check and a
// stuck run.
// ---------------------------------------------------------------------------
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-retention-timeout-"));
  const repo = path.join(dir, "repo");
  const realGit = execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
  const git = (args, cwd = repo) => execFileSync("git", args, { cwd, encoding: "utf8" });

  fs.mkdirSync(repo);
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "test@example.invalid"]);
  git(["config", "user.name", "test"]);
  fs.writeFileSync(path.join(repo, "a.txt"), "one\n");
  git(["add", "."]);
  git(["commit", "-qm", "one"]);
  git(["worktree", "add", "-q", "-b", "exec/slow", path.join(dir, "slow")]);

  const prIndex = path.join(dir, "prs.json");
  fs.writeFileSync(prIndex, JSON.stringify([
    { number: 1, headRefName: "exec/slow", mergedAt: "2026-09-22T10:00:00Z" },
  ]));
  const claims = path.join(dir, "EXECUTION_CLAIMS.md");
  fs.writeFileSync(claims, "# Claims\n\n## Claim log — append only\n\n");

  // Pass-through for everything but `status`. `main` needs a real
  // `git worktree list --porcelain` from this same binary, so a shim that
  // swallowed every subcommand would prove nothing about the bound.
  const shimDir = path.join(dir, "bin");
  fs.mkdirSync(shimDir);
  const shim = path.join(shimDir, "git");
  fs.writeFileSync(shim, [
    "#!/bin/sh",
    "for arg in \"$@\"; do",
    "  if [ \"$arg\" = \"status\" ]; then",
    "    sleep 3",
    "    exit 0",
    "  fi",
    "done",
    `exec ${JSON.stringify(realGit)} "$@"`,
  ].join("\n") + "\n");
  fs.chmodSync(shim, 0o755);

  const runSlow = (extra) => {
    const started = Date.now();
    let status = 0;
    let stdout = "";
    let stderr = "";
    try {
      stdout = execFileSync(process.execPath, [
        CLI, "--repo", repo, "--pr-index", prIndex, "--claims", claims,
        "--now", "2026-09-23T06:00:00Z", ...extra,
      ], {
        cwd: repo,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, PATH: `${shimDir}${path.delimiter}${process.env.PATH}` },
        // A bound on the whole control, so a regression that reintroduces the
        // unbounded wait fails this suite rather than hanging the runner that
        // is checking for it.
        timeout: 90_000,
      });
    } catch (error) {
      status = error.status ?? -1;
      stdout = String(error.stdout ?? "");
      stderr = String(error.stderr ?? "");
    }
    return { status, stdout, stderr, elapsedMs: Date.now() - started };
  };

  const slowJson = runSlow(["--json", "--status-timeout-ms", "300"]);
  let slowReport = null;
  try { slowReport = JSON.parse(slowJson.stdout); } catch { /* reported below */ }
  const slowPath = fs.realpathSync(path.join(dir, "slow"));
  const slowResult = (slowReport?.results ?? []).find((r) => r.path === slowPath);

  // THE SAFETY PROPERTY. This worktree is merged and its tree is in fact clean,
  // so every other proof is present: only the unread status stands between it
  // and `removable`. A bound that let an unread tree through would delete
  // someone's uncommitted work, which is the one error this control must not
  // make.
  check(
    "T-721: a status read that exceeds the bound yields unknown, NEVER removable, on an otherwise-removable worktree",
    slowJson.status === 0 && slowResult?.verdict === UNKNOWN,
    `status=${slowJson.status} verdict=${slowResult?.verdict} reasons=${JSON.stringify(slowResult?.reasons)} stderr=${slowJson.stderr}`,
  );

  // "37 worktrees could not be read" is a finding about the machine; silence is
  // not. Unknown is a safe verdict and a useless one if nobody learns which.
  //
  // The shim slows `status` everywhere, so BOTH probed checkouts time out — the
  // fixture repo as well as the worktree under test — and both must be named.
  // A first draft of this case asserted a count of 1 and failed against correct
  // code: the repository itself is a registered worktree whose status is read
  // like any other, and its verdict is `keep` for an unrelated reason. Naming
  // only the ones whose verdict the timeout changed would hide exactly the
  // checkout an operator needs to hear about.
  const repoPath = fs.realpathSync(repo);
  check(
    "T-721: every worktree that exceeded the bound is reported BY NAME, not folded into a silent unknown",
    Array.isArray(slowReport?.timedOut) &&
      slowReport.timedOut.includes(slowPath) &&
      slowReport.timedOut.includes(repoPath) &&
      slowReport.summary.timedOut === slowReport.timedOut.length &&
      slowReport.summary.timedOut === 2,
    `timedOut=${JSON.stringify(slowReport?.timedOut)} summary=${JSON.stringify(slowReport?.summary)}`,
  );

  // The human-readable path carries the names too. `--json` is read by tooling;
  // the default output is what an operator actually runs, and the bound's whole
  // purpose is defeated if the unreadable checkouts are visible only in JSON.
  const slowText = runSlow(["--status-timeout-ms", "300"]);
  check(
    "T-721: the default (non-JSON) report names the timed-out paths and states they are never removable",
    slowText.status === 0 &&
      slowText.stdout.includes(slowPath) &&
      /exceeded the 300 ms status bound/.test(slowText.stdout) &&
      /never removable/.test(slowText.stdout),
    `status=${slowText.status} stdout=${slowText.stdout}`,
  );

  // The control has to RETURN. Two worktrees at 3 s each is 6 s unbounded;
  // under a 300 ms bound the whole run is well inside two seconds of work.
  check(
    "T-721: the control returns instead of waiting out the blocked reads",
    slowJson.elapsedMs < 10_000,
    `elapsedMs=${slowJson.elapsedMs}`,
  );

  // The guardrail against an over-broad repair: returning `null` for every
  // worktree would pass all three cases above and destroy the control.
  const fastJson = (() => {
    try {
      return JSON.parse(execFileSync(process.execPath, [
        CLI, "--repo", repo, "--pr-index", prIndex, "--claims", claims,
        "--now", "2026-09-23T06:00:00Z", "--json", "--status-timeout-ms", "300",
      ], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 90_000 }));
    } catch { return null; }
  })();
  const fastResult = (fastJson?.results ?? []).find((r) => r.path === slowPath);
  check(
    "T-721: without the slow shim the same bound reads the same worktree fine and it is removable again",
    fastResult?.verdict === REMOVABLE && fastJson?.summary.timedOut === 0 && fastJson?.timedOut.length === 0,
    `verdict=${fastResult?.verdict} summary=${JSON.stringify(fastJson?.summary)}`,
  );

  execFileSync("git", ["worktree", "remove", path.join(dir, "slow"), "--force"], { cwd: repo });
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 19 — summarise is a partition, not three independent filters.
// ---------------------------------------------------------------------------
{
  const s = summarise([{ verdict: KEEP }, { verdict: KEEP }, { verdict: UNKNOWN }, { verdict: REMOVABLE }]);
  check(
    "summarise partitions: 4 total = 2 keep + 1 unknown + 1 removable",
    s.total === 4 && s.keep === 2 && s.unknown === 1 && s.removable === 1,
    JSON.stringify(s),
  );
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
