#!/usr/bin/env node
/**
 * Behavioural test for the queue's staleness guard (item T-076).
 *
 * The defect this exists to hold shut: `build-execution-queue.mjs` reads
 * `source-board-summary.json` and cannot tell a current summary from one
 * generated before the backlog last changed. Regenerating the board without
 * `--json` leaves the old summary in place, so the queue is rebuilt from it
 * and prints a full, confident set of counts describing a backlog that no
 * longer exists.
 *
 * Every assertion here is on process exit status and stdout/stderr of a real
 * child process, and on whether an item the FIXTURE declares appears in the
 * rendered queue. Nothing is asserted by asking the code under test whether it
 * thinks it is fresh — a control that sources its truth from its own subject
 * cannot fail.
 *
 * Run:  node scripts/exec/build-execution-queue.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Repo-owned executable inputs copied into an isolated operator fixture. */
const TOOLCHAIN_FILES = [
  "build-source-board.mjs",
  "build-execution-queue.mjs",
  "source-stage-map.json",
];

/** Synthetic operator documents. CI never reads the real Downloads backlog. */
const FIXTURE_DOCUMENTS = {
  "SOURCE_EXECUTION_BOARD_20260917.md": `# Synthetic execution board

## Outcome tracker

| Outcome | Owner | Status |
|---|---|---|
| Toolchain is reviewed | test | open |
`,
  "EXECUTION_BACKLOG_20260918.md": `# Synthetic execution backlog

## Toolchain

| # | Item | Lane | Acceptance |
|---|---|---|---|
| T-507 | **Keep the queue executable.** | T | The behavioral suite runs. |
`,
  "EXECUTION_CLAIMS.md": `# Synthetic claims

## Claim log — append only
`,
  "SOURCE_BACKLOG_MASTER.md": "# Synthetic scope\n",
};

/** The line the queue prints when it accepted the summary and rendered. */
const COUNTS_LINE = /Wrote EXECUTION_QUEUE\.md: \d+ claimable/;

let failures = 0;
let passes = 0;

function check(name, ok, detail) {
  if (ok) {
    passes += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    if (detail) console.log(`        ${String(detail).split("\n").join("\n        ")}`);
  }
}

function freshFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "t076-"));
  for (const f of TOOLCHAIN_FILES) {
    fs.copyFileSync(path.join(HERE, f), path.join(dir, f));
  }
  for (const [file, content] of Object.entries(FIXTURE_DOCUMENTS)) {
    fs.writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

/** Run a generator in `dir`. Never throws; returns status, stdout and stderr. */
function run(dir, script, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      status: err.status ?? 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? String(err.message ?? err),
    };
  }
}

function buildBoardAndQueue(dir) {
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  if (board.status !== 0) throw new Error(`fixture board build failed:\n${board.stderr}`);
  return run(dir, "build-execution-queue.mjs");
}

console.log("build-execution-queue — staleness guard (T-076)\n");

/* ------------------------------------------------------------------------ */
/* 1. A summary generated from the current inputs is accepted.              */
/*    Without this the whole guard could be satisfied by refusing always.   */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  const q = buildBoardAndQueue(dir);
  check(
    "fresh summary is accepted and the queue renders",
    q.status === 0 && COUNTS_LINE.test(q.stdout),
    `exit=${q.status}\nstdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 2. THE DEFECT. The backlog gains an item after the summary was written.  */
/*    The queue must refuse rather than print counts for a vanished state.  */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  const first = buildBoardAndQueue(dir);
  if (first.status !== 0) throw new Error("fixture did not build cleanly");

  const backlog = path.join(dir, "EXECUTION_BACKLOG_20260918.md");
  fs.appendFileSync(
    backlog,
    "\n| T-999 | **Injected by the T-076 test.** Declared in the backlog after the summary was generated | T | Appear in the queue, or make the queue refuse |\n",
  );

  const q = run(dir, "build-execution-queue.mjs");
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");

  check(
    "backlog edited after summary -> queue exits non-zero",
    q.status !== 0,
    `exit=${q.status}\nstdout=${q.stdout.trim()}`,
  );
  check(
    "backlog edited after summary -> queue does not print counts",
    !COUNTS_LINE.test(q.stdout),
    `stdout=${q.stdout.trim()}`,
  );
  check(
    "backlog edited after summary -> the refusal names the stale input",
    /EXECUTION_BACKLOG_20260918\.md/.test(q.stdout + q.stderr) &&
      /stale|out of date|changed since/i.test(q.stdout + q.stderr),
    `stdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}`,
  );
  check(
    "backlog edited after summary -> the refusal names the regenerate command",
    /build-source-board\.mjs --json/.test(q.stdout + q.stderr),
    `stdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}`,
  );
  // Independent truth: the fixture declares T-999. Either the queue lists it
  // (it was regenerated) or the queue refused. A queue that silently omits an
  // item the backlog declares is exactly the reported defect.
  check(
    "a backlog item missing from the queue is never reported as a complete queue",
    rendered.includes("T-999") || q.status !== 0,
    "queue rendered without T-999 and still exited 0",
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 3. The declared structure map is an input too.                           */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  buildBoardAndQueue(dir);
  const mapPath = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  map.visionRecorded = "9999-01-01";
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + "\n");

  const q = run(dir, "build-execution-queue.mjs");
  check(
    "stage map edited after summary -> queue refuses",
    q.status !== 0 && !COUNTS_LINE.test(q.stdout),
    `exit=${q.status}\nstdout=${q.stdout.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 4. NEGATIVE CONTROL — the guard must not be "anything moved, refuse".    */
/*                                                                          */
/*    Claiming an item appends to EXECUTION_CLAIMS.md. That happens between */
/*    every board run and the next queue run, by design: the claim protocol */
/*    says to append before writing any code. The queue re-reads the claims */
/*    file directly and freshly, so a changed claims file does not make the */
/*    summary stale. A guard that refused here would brick the queue within */
/*    seconds of every claim and would be reverted by the first agent it    */
/*    blocked.                                                              */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  buildBoardAndQueue(dir);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    "\n- item T-998 | test-agent | 2026-09-20T06:30Z | test/branch-name | files: nothing.mjs\n",
  );

  const q = run(dir, "build-execution-queue.mjs");
  check(
    "claims appended after summary -> queue still renders (claims are read fresh)",
    q.status === 0 && COUNTS_LINE.test(q.stdout),
    `exit=${q.status}\nstdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}`,
  );
  // And the fresh read is real: the claim just appended must be honoured.
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    "claims appended after summary -> the new claim is honoured in the render",
    rendered.includes("T-998"),
    "the queue did not reflect a claim appended after the summary was written",
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 5. The reported operator trap, exactly: board regenerated WITHOUT --json */
/*    after a backlog edit. The summary is left behind and must be caught.  */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  buildBoardAndQueue(dir);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n| T-997 | **Injected by the T-076 test, second form.** | T | Be visible |\n",
  );
  const board = run(dir, "build-source-board.mjs"); // note: no --json
  const q = run(dir, "build-execution-queue.mjs");
  check(
    "board rerun without --json after a backlog edit -> queue refuses",
    board.status === 0 && q.status !== 0 && !COUNTS_LINE.test(q.stdout),
    `board exit=${board.status}, queue exit=${q.status}\nstdout=${q.stdout.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 6. A summary with no provenance stamp at all — every summary written     */
/*    before this guard existed. "I cannot tell" must read as stale, not    */
/*    as fresh, or the guard is opt-in and the first stale file skips it.   */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  buildBoardAndQueue(dir);
  const summaryPath = path.join(dir, "source-board-summary.json");
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  delete summary.inputs;
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");

  const q = run(dir, "build-execution-queue.mjs");
  check(
    "summary with no provenance stamp -> queue refuses rather than assuming fresh",
    q.status !== 0 && !COUNTS_LINE.test(q.stdout),
    `exit=${q.status}\nstdout=${q.stdout.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 7. The guard must not be satisfiable by regenerating the board from      */
/*    inside the queue. That would hide which artifact is authoritative.    */
/* ------------------------------------------------------------------------ */
{
  const queueSource = fs.readFileSync(path.join(HERE, "build-execution-queue.mjs"), "utf8");
  const spawnsBoard = /(execFileSync|execSync|spawnSync|spawn|exec)\s*\([^)]*build-source-board/.test(queueSource);
  check(
    "the queue does not regenerate the board itself",
    !spawnsBoard,
    "build-execution-queue.mjs appears to invoke build-source-board.mjs",
  );
}

/* ------------------------------------------------------------------------ */
/* 8. Repo-owned code and private operator documents stay physically split. */
/* ------------------------------------------------------------------------ */
{
  const operatorRoot = freshFixture();
  const boardScript = path.join(HERE, "build-source-board.mjs");
  const queueScript = path.join(HERE, "build-execution-queue.mjs");
  const mapPath = path.join(operatorRoot, "source-stage-map.json");

  const board = run(process.cwd(), boardScript, [
    "--operator-root",
    operatorRoot,
    "--map",
    mapPath,
    "--json",
  ]);
  const queue = run(process.cwd(), queueScript, [
    "--operator-root",
    operatorRoot,
  ]);

  check(
    "repo scripts accept a separate operator root and keep generated files there",
    board.status === 0 &&
      queue.status === 0 &&
      fs.existsSync(path.join(operatorRoot, "source-board.html")) &&
      fs.existsSync(path.join(operatorRoot, "source-board-summary.json")) &&
      fs.existsSync(path.join(operatorRoot, "EXECUTION_QUEUE.md")) &&
      !fs.existsSync(path.join(HERE, "source-board-summary.json")) &&
      !fs.existsSync(path.join(HERE, "EXECUTION_QUEUE.md")),
    `board=${board.status}, queue=${queue.status}\n` +
      `board stderr=${board.stderr.trim()}\nqueue stderr=${queue.stderr.trim()}`,
  );
  fs.rmSync(operatorRoot, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
