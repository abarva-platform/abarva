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

import { copyToolchainInto } from "./toolchain-manifest.mjs";
import {
  suppressedCandidateIds,
  liveCorpusPlan,
  liveCorpusRoot,
} from "./fossil-claims.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

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
const NOW = new Date().toISOString().replace(/:\d{2}\.\d{3}Z$/, "Z");

let failures = 0;
let passes = 0;
let skipped = 0;

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

/**
 * A skip that is COUNTED and says why (item T-739).
 *
 * The live-corpus block used to emit one bare `console.log` and increment the
 * counter for the whole block, so three named checks became one unnamed skip.
 * Each check that did not run says so under its own name now.
 */
function skipLive(name, why) {
  skipped += 1;
  console.log(`  SKIP  ${name} — ${why}`);
}

function freshFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "t076-"));
  // The toolchain is declared once (item T-726), not listed here. This list was
  // hand-maintained and went stale twice in one session -- when the generator
  // began importing queue-provenance.mjs, and again when that began importing
  // cli-entry.mjs. Both times the suite found out by crashing.
  copyToolchainInto(dir);
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

/**
 * Add an id to the fixture's structure map.
 *
 * The map is repo-owned, so the fixture carries its own copy; a case that
 * injects a backlog id has to place it or the board refuses the run.
 */
function mapFixtureId(dir, id) {
  const file = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  const stages = map.stages ?? map;
  const firstList = Object.values(stages).find((v) => Array.isArray(v))
    ?? Object.values(stages).flatMap((v) => Object.values(v ?? {})).find((v) => Array.isArray(v));
  if (!firstList) throw new Error("fixture map has no id list to extend");
  firstList.push(id);
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
}

function mapFixtureRef(dir, ref, track = "platformTrack") {
  const file = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = track === "outsideLifecycle"
    ? map.outsideLifecycle.items
    : map.platformTrack.items;
  if (!Array.isArray(list)) throw new Error(`fixture map has no ${track}.items list`);
  list.push(ref);
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
}

function removeExactStringRef(value, id) {
  let removed = 0;
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      if (value[i] === id) {
        value.splice(i, 1);
        removed += 1;
      } else {
        removed += removeExactStringRef(value[i], id);
      }
    }
    return removed;
  }
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) removed += removeExactStringRef(child, id);
  }
  return removed;
}

function buildBoardAndQueue(dir) {
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  if (board.status !== 0) throw new Error(`fixture board build failed:\n${board.stderr}`);
  return run(dir, "build-execution-queue.mjs");
}

function addBacklogItem(dir, id) {
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| ${id} | **Synthetic claim grammar fixture.** | T | Stay out of the claimable table while held. |\n`,
  );
}

function claimGrammarCase(name, id, line) {
  const dir = freshFixture();
  addBacklogItem(dir, id);
  fs.appendFileSync(path.join(dir, "EXECUTION_CLAIMS.md"), `\n${line}\n`);
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    name,
    q.status === 0 && !rendered.includes(`| ${id} |`) && rendered.includes(id),
    `exit=${q.status}\nstdout=${q.stdout.trim()}\nqueue=${rendered}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
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
  // Map the injected id. An unmapped id now fails the board on its own, and
  // this case is measuring the staleness trap -- leaving T-997 unmapped would
  // make the board fail first and the case would stop testing its subject.
  mapFixtureId(dir, "T-997");
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

/* ------------------------------------------------------------------------ */
/* An unmapped backlog id is invisible to the queue. It used to print a line */
/* and exit 0, so the item silently never reached anyone -- two ids reached  */
/* that state in one afternoon. It now fails the run, and the board is still */
/* written so the output is there to read.                                   */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n| T-996 | **Injected unmapped, on purpose.** | T | Be refused |\n",
  );
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  check(
    "an unmapped backlog id fails the board run",
    board.status !== 0,
    `board exit=${board.status}; an unmapped id must not pass silently`,
  );
  check(
    "the failure names the id and the file to edit",
    board.stderr.includes("T-996") && board.stderr.includes("source-stage-map.json"),
    `stderr=${board.stderr.trim()}`,
  );
  check(
    "the board is still written, so the run reports rather than refusing",
    fs.existsSync(path.join(dir, "source-board-summary.json")),
    "no summary was written; a gate that produces nothing stops being run",
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* The other direction: mapping the same id must clear it. Without this the  */
/* case above is satisfied by a board that always fails.                     */
{
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n| T-996 | **Injected and mapped.** | T | Be offered |\n",
  );
  mapFixtureId(dir, "T-996");
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  check(
    "mapping the id clears the failure",
    board.status === 0,
    `board exit=${board.status}\nstderr=${board.stderr.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* Structural placement must not smuggle execution state into the map.       */
{
  const dir = freshFixture();
  const mapPath = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  map.platformTrack.status = "merged";
  fs.writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  check(
    "a mapped item cannot encode status in the structure map",
    board.status !== 0 && /status key/i.test(board.stderr),
    `board exit=${board.status}\nstderr=${board.stderr.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* A duplicate structural reference used to render the same claimable item  */
/* twice. That defeats the queue's collision-prevention contract even though */
/* the backlog itself contains only one definition.                          */
{
  const dir = freshFixture();
  const mapPath = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  map.platformTrack.items.push(map.platformTrack.items[0]);
  fs.writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  check(
    "a structural item list cannot repeat the same item reference",
    board.status !== 0 && /repeats item/i.test(board.stderr) && /platformTrack\.items/.test(board.stderr),
    `board exit=${board.status}\nstderr=${board.stderr.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* A capability is a second view over stage work, not a second structural    */
/* placement. The guard must not reject the intended stage/capability reuse. */
{
  const dir = freshFixture();
  const mapPath = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const stage = map.stages.find((candidate) =>
    Array.isArray(candidate.items) && candidate.items.length > 0 && Array.isArray(candidate.capabilities),
  );
  if (!stage) throw new Error("fixture map has no stage with items and capabilities");
  stage.capabilities.push({ capability: "Intentional reuse fixture", items: [stage.items[0]] });
  fs.writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  check(
    "the same item may support both a stage and one of its capabilities",
    board.status === 0,
    `board exit=${board.status}\nstderr=${board.stderr.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 9. Newly filed execution-control items are mapped without status.        */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n| T-468 | **Tenant scoping input decision fixture.** | C | Decision needed before product code. |\n" +
      "| T-469 | **Data-plane safety artifact fixture.** | T | Produce the per-client answer as tooling evidence. |\n" +
      "| T-508 | **Dataset-write guard fixture.** | T | Add the dataset-diff failure; do not weaken the write-safety requirement. |\n" +
      "| T-470 | **Deployment-register reconciliation fixture.** | T | Record exact immutable deploy proof. |\n" +
      "| T-471 | **Stale-suite triage fixture.** | T | Measure each named suite before wiring it. |\n" +
      "| T-509 | **Measured stale-suite follow-on fixture.** | T | Record a per-file verdict before wiring. |\n" +
      "| T-513 | **Behavioral rewrite follow-on fixture.** | T | Replace source-text scanners with behavior. |\n" +
      "| T-514 | **Generated-count authority decision fixture.** | T | Decide the authoritative count before changing it. |\n" +
      "| T-515 | **Uncovered-control validator fixture.** | T | Reconcile declared coverage with known suites. |\n" +
      "| C-500 | **Source advisor answer-quality fixture.** | C | Keep the answer-shaping decision visible under the aVa quality capability. |\n" +
      "| T-516 | **Green-suite CI wiring fixture.** | T | Wire already-green suites without repairing them. |\n" +
      "| T-517 | **Synthesis header fixture refresh.** | T | Refresh measured route expectations without inventing headers. |\n" +
      "| T-518 | **Strategic Moves render expectation fixture.** | T | Update measured expectations without loosening render proof. |\n" +
      "| T-519 | **NDA signature-evidence fixture.** | T | Assert the new signature evidence exhaustively. |\n" +
      "| T-584 | **Register outcome integrity fixture.** | T | Append exact deploy outcome lines without batch proof. |\n" +
      "| T-585 | **Contract 360 field-fidelity fixture.** | C | Keep the C7 vendor concession spelling defect under Contract 360 truth. |\n" +
      "| T-586 | **Per-PR outcome registration fixture.** | T | Keep merge and carrier-deploy evidence attributable per release. |\n" +
      "| T-587 | **Coverage-census drift fixture.** | T | Keep generated coverage evidence synchronized with its generator. |\n" +
      "| T-474 | **Release-closeout control fixture.** | T | Keep release closeout mechanics outside lifecycle progress. |\n" +
      "| T-551 | **Coverage-census execution-status fixture.** | T | Keep coverage evidence honest without advancing product stages. |\n" +
      "| T-552 | **Coverage-census workflow fixture.** | T | Keep CI wiring work outside lifecycle progress. |\n" +
      "| T-553 | **Source scanner behavior fixture.** | T | Replace brittle scanners without advancing a lifecycle stage. |\n" +
      "| T-554 | **Browser red-case fixture.** | T | Preserve browser control proof outside lifecycle progress. |\n" +
      "| T-588 | **Contract-purpose gate fixture.** | T | Keep review-gate proof outside lifecycle progress. |\n" +
      "| T-589 | **Reachability input fixture.** | T | Keep route-audit inputs outside lifecycle progress. |\n" +
      "| T-590 | **Export reachability fixture.** | T | Keep export-grain auditing outside lifecycle progress. |\n" +
      "| T-591 | **Scope-summary reachability fixture.** | T | Keep guard reachability analysis outside lifecycle progress. |\n" +
      "| T-592 | **Orphan export fixture.** | T | Keep orphan cleanup outside lifecycle progress. |\n" +
      "| T-593 | **Behavior-suite wiring fixture.** | T | Keep CI coverage investigation outside lifecycle progress. |\n" +
      "| T-594 | **Claim-protocol concurrency fixture.** | T | Keep execution coordination outside lifecycle progress. |\n" +
      "| T-595 | **Required-workflow duplication fixture.** | T | Keep workflow-governance investigation outside lifecycle progress. |\n",
  );
  const map = JSON.parse(fs.readFileSync(path.join(dir, "source-stage-map.json"), "utf8"));
  const stage9 = map.stages.find((stage) => stage.id === 9);
  const stage9Text = JSON.stringify(stage9);
  check(
    "T-468 is mapped outside the Source lifecycle",
    map.outsideLifecycle.items.includes("T-468") &&
      !map.platformTrack.items.includes("T-468") &&
      !JSON.stringify(map.stages).includes('"T-468"'),
    JSON.stringify(map.outsideLifecycle.items),
  );
  check(
    "T-469 is mapped to platform integrity",
    map.platformTrack.items.includes("T-469") &&
      !map.outsideLifecycle.items.includes("T-469") &&
      !JSON.stringify(map.stages).includes('"T-469"'),
    JSON.stringify(map.platformTrack.items.slice(-24)),
  );
  check(
    "T-508 is mapped to platform integrity",
    map.platformTrack.items.includes("T-508") &&
      !map.outsideLifecycle.items.includes("T-508") &&
      !JSON.stringify(map.stages).includes('"T-508"'),
    JSON.stringify(map.platformTrack.items.slice(-24)),
  );
  for (const id of ["T-470", "T-471", "T-509", "T-513", "T-514", "T-515"]) {
    check(
      `${id} is mapped to platform integrity`,
      map.platformTrack.items.includes(id) &&
        !map.outsideLifecycle.items.includes(id) &&
        !JSON.stringify(map.stages).includes(`"${id}"`),
      JSON.stringify(map.platformTrack.items.slice(-24)),
    );
  }
  for (const id of [
    "T-474",
    "T-516",
    "T-517",
    "T-518",
    "T-519",
    "T-551",
    "T-552",
    "T-553",
    "T-554",
    "T-584",
    "T-586",
    "T-587",
    "T-588",
    "T-589",
    "T-590",
    "T-591",
    "T-592",
    "T-593",
    "T-594",
    "T-595",
  ]) {
    check(
      `${id} is mapped to platform/test-execution integrity without advancing a lifecycle stage`,
      map.platformTrack.items.includes(id) &&
        !map.outsideLifecycle.items.includes(id) &&
        !JSON.stringify(map.stages).includes(`"${id}"`),
      JSON.stringify(map.platformTrack.items.slice(-32)),
    );
  }
  check(
    "C-500 is mapped to the existing Source/aVa answer-quality capability",
    stage9?.items.includes("C-500") &&
      stage9.capabilities.some((capability) =>
        capability.capability === "aVa complete signed-in acceptance set" &&
        capability.items.includes("C-500"),
      ) &&
      !map.platformTrack.items.includes("C-500") &&
      !map.outsideLifecycle.items.includes("C-500"),
    stage9Text,
  );
  check(
    "T-585 is mapped to the existing Contract 360 truth and field-fidelity capability",
    stage9?.items.includes("T-585") &&
      stage9.capabilities.some((capability) =>
        capability.capability === "Contract workspace display authority and freshness controls" &&
        capability.items.includes("T-585"),
      ) &&
      !map.platformTrack.items.includes("T-585") &&
      !map.outsideLifecycle.items.includes("T-585"),
    stage9Text,
  );
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  const q = board.status === 0 ? run(dir, "build-execution-queue.mjs") : { status: 1, stdout: "", stderr: "" };
  check(
    "new execution-control items regenerate with zero unmapped ids",
    board.status === 0 &&
      q.status === 0 &&
      /not placed on the map:\s*0/.test(board.stdout + board.stderr),
    `board exit=${board.status}\nstdout=${board.stdout.trim()}\nstderr=${board.stderr.trim()}\nqueue=${q.stdout.trim()} ${q.stderr.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

for (const [id, expectedRemoved] of [
  ["T-468", 1],
  ["T-469", 1],
  ["T-508", 1],
  ["T-470", 1],
  ["T-471", 1],
  ["T-509", 1],
  ["T-513", 1],
  ["T-514", 1],
  ["T-515", 1],
  ["C-500", 2],
  ["T-516", 1],
  ["T-517", 1],
  ["T-518", 1],
  ["T-519", 1],
  ["T-584", 1],
  ["T-585", 2],
  ["T-586", 1],
  ["T-587", 1],
  ["T-474", 1],
  ["T-551", 1],
  ["T-552", 1],
  ["T-553", 1],
  ["T-554", 1],
  ["T-588", 1],
  ["T-589", 1],
  ["T-590", 1],
  ["T-591", 1],
  ["T-592", 1],
  ["T-593", 1],
  ["T-594", 1],
  ["T-595", 1],
]) {
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| ${id} | **Injected exact mapping removal fixture.** | T | Be refused when unmapped. |\n`,
  );
  const mapPath = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const removed = removeExactStringRef(map, id);
  fs.writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  check(
    `removing the ${id} map reference fails closed`,
    removed === expectedRemoved && board.status !== 0 && board.stderr.includes(id) && board.stderr.includes("source-stage-map.json"),
    `removed=${removed}\nboard exit=${board.status}\nstderr=${board.stderr.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 10. Every established append-only claim grammar holds the item. T-600.  */
/* ------------------------------------------------------------------------ */
claimGrammarCase(
  "canonical non-bulleted item claim is honoured",
  "T-530",
  `${NOW} cx-a item T-530 codex/test-branch — claimed`,
);
claimGrammarCase(
  "pipe-delimited item claim is honoured",
  "T-531",
  `- ${NOW} | test-agent | item T-531 · CLAIMED | branch codex/test-branch`,
);
claimGrammarCase(
  "pipe-delimited CLAIM record is honoured",
  "T-532",
  `- ${NOW} | test-agent | CLAIM T-532 | measuring current behavior`,
);
claimGrammarCase(
  "pipe-delimited CLAIMED record is honoured",
  "T-533",
  `- ${NOW} | test-agent | CLAIMED T-533 | measuring current behavior`,
);

/* ------------------------------------------------------------------------ */
/* 11. A later explicit release wins for the same item.                    */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-530");
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    `\n- ${NOW} | test-agent | CLAIM T-530 | measuring\n` +
      `- ${NOW} | test-agent | RELEASED item T-530 | no branch remains\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    "a later RELEASED item record makes the row claimable again",
    q.status === 0 && rendered.includes("| T-530 |") && /Explicitly released[\s\S]*T-530/.test(rendered),
    `exit=${q.status}\nqueue=${rendered}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 12. Claim-like prose before the append-only log is never authoritative. */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-530");
  const claimsPath = path.join(dir, "EXECUTION_CLAIMS.md");
  const claims = fs.readFileSync(claimsPath, "utf8");
  fs.writeFileSync(
    claimsPath,
    `- ${NOW} | summary prose | CLAIM T-530 | this is above the log\n\n${claims}`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    "claim-like prose above the claim log does not hold an item",
    q.status === 0 && rendered.includes("| T-530 |"),
    `exit=${q.status}\nqueue=${rendered}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 13. Context about another PR is not status for the current item. T-608. */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  const id = "T-608";
  mapFixtureId(dir, id);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| ${id} | **Re-check the gap left by PR #8084.** The cited PR belongs to a predecessor item. | T | Measure the current tree and record the result. |\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    "a predecessor PR reference does not promote an open item to PR/CI",
    q.status === 0 && rendered.includes(`| ${id} |`),
    `exit=${q.status}\nqueue=${rendered}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 14. Describing a fixture is not a request for owner acceptance. T-608.  */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  const id = "T-609";
  mapFixtureId(dir, id);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| ${id} | **Triage an unowned test directory.** | T | If a suite only resembles a signed-in browser fixture, quarantine it with a reason; do not perform product-session proof. |\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    "descriptive signed-in prose does not hide executable work",
    q.status === 0 && rendered.includes(`| ${id} |`),
    `exit=${q.status}\nqueue=${rendered}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* A genuine owner gate must remain blocked after the false positives move. */
{
  const dir = freshFixture();
  const id = "T-610";
  mapFixtureId(dir, id);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| ${id} | **Verify the deployed surface.** | U | Signed-in acceptance owed. |\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    "an explicit signed-in acceptance remains blocked on the owner",
    q.status === 0 && !rendered.includes(`| ${id} |`) && /Signed-in acceptance owed/.test(rendered),
    `exit=${q.status}\nqueue=${rendered}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 15. A genuine duplicate id is placed by definition, not force-fit.       */
/* ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  const id = "T-888";
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `
## Platform duplicate fixture

| # | Item | Lane | Acceptance |
|---|---|---|---|
| ${id} | **Record deployment bookkeeping.** | T | Append the proof line. |

## Outside duplicate fixture

| # | Item | Lane | Acceptance |
|---|---|---|---|
| ${id} | **Decide the non-Source product scope.** | C | Decide before coding. |
`,
  );
  mapFixtureRef(dir, { num: id, definedIn: "Platform duplicate fixture" });
  mapFixtureRef(dir, { num: id, definedIn: "Outside duplicate fixture" }, "outsideLifecycle");

  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  // This case is about PLACEMENT — that two real definitions of one id stay
  // distinct instead of being force-fit onto one row. It used to prove that by
  // counting the id's rows in the rendered CLAIMABLE table, which only worked
  // while both definitions happened to be claimable. Under item T-597 the
  // second definition — "Decide the non-Source product scope", acceptance
  // "Decide before coding" — is correctly read as a decision gate and leaves
  // the claimable table, so the proxy dropped to 1 while placement was still
  // right. The assertion is not loosened here: it is moved onto the surface
  // that actually owns placement, where it is stronger than the row count was,
  // because it also pins the two definitions to their two different lanes.
  const summary = JSON.parse(
    fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"),
  );
  const definitions = [];
  (function collect(node) {
    if (Array.isArray(node)) return node.forEach(collect);
    if (node && typeof node === "object") {
      if (node.num === id && typeof node.lane === "string") {
        definitions.push({ lane: node.lane, blocker: node.blocker ?? null });
      }
      Object.values(node).forEach(collect);
    }
  })(summary);
  const lanes = [...new Set(definitions.map((d) => d.lane))].sort();
  check(
    "definedIn lets two real definitions of one id stay distinct",
    q.status === 0 &&
      definitions.length === 2 &&
      lanes.join(",") === "C,T" &&
      !/not placed on the map:\s*[1-9]/.test(q.stdout + q.stderr) &&
      !rendered.includes("AMBIGUOUS"),
    `exit=${q.status}\nstdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}\n` +
      `definitions=${JSON.stringify(definitions)}\nqueue=${rendered}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 16-19. WHICH LINE IS "THE NEWEST LINE FOR AN ITEM" (item T-530, the      */
/*        2026-09-21 filing).                                              */
/*                                                                          */
/* The register is append-only, so a line's POSITION is the order it was    */
/* actually written. Its STAMP is self-reported, and T-457 measured that    */
/* drift on the live file: 26 merge announcements resolved to an            */
/* authoritative `mergedAt`, 17 of them outside +/-300s, and six lines      */
/* stamped in the future of the clock that read them. So the two orders are */
/* genuinely different authorities and the resolver has to pick one.        */
/*                                                                          */
/* Every fixture below is built so the two orders DISAGREE — the later      */
/* -appended line carries the earlier stamp. A fixture where they agree     */
/* cannot fail whichever authority the resolver uses, which is the T-460    */
/* shape this suite exists to avoid.                                        */
/* ------------------------------------------------------------------------ */

/** A stamp `minutesAgo` before now, in the minute-precision register form. */
function registerStamp(minutesAgo) {
  return new Date(Date.now() - minutesAgo * 60_000)
    .toISOString()
    .replace(/:\d{2}\.\d{3}Z$/, "Z");
}

/** The ids the queue renders under "Already claimed or in flight". */
function heldSection(rendered) {
  return rendered.match(/## Already claimed or in flight\n\n(.*)\n/)?.[1] ?? "";
}

/** The ids the queue renders on the "Expired but WORK IN FLIGHT" line. */
function inFlightSection(rendered) {
  return rendered.match(/\*\*Expired but WORK IN FLIGHT — do not take \(\d+\):\*\*(.*)/)?.[1] ?? "";
}

/** The ids the queue renders on the "Explicitly released" line. */
function releasedSection(rendered) {
  return rendered.match(/\*\*Explicitly released \(\d+\):\*\*(.*)/)?.[1] ?? "";
}

/**
 * Two claim lines for one id, appended in the order given, and the rendered
 * queue they produce.
 */
function twoLineClaimFixture(id, firstLine, secondLine) {
  const dir = freshFixture();
  addBacklogItem(dir, id);
  mapFixtureId(dir, id);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    `\n${firstLine}\n${secondLine}\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  return { q, rendered };
}

/* 16. THE PRIMARY AUTHORITY IS THE STAMP.                                  */
{
  const id = "T-591";
  // Appended FIRST but stamped LATER — the stamp authority must pick this one.
  const first = `${registerStamp(0)} | lane-a | item ${id} · PR/CI opened | branch codex/${id}-fixture`;
  // Appended SECOND but stamped TEN MINUTES EARLIER.
  const second = `${registerStamp(10)} | lane-b | RELEASED item ${id} — nothing held`;
  const { q, rendered } = twoLineClaimFixture(id, first, second);
  check(
    "the newest line for an item is chosen by STAMP, not by append position",
    q.status === 0 &&
      heldSection(rendered).includes(id) &&
      !releasedSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 17. APPEND ORDER BREAKS AN EQUAL STAMP.                                  */
{
  const id = "T-592";
  const stamp = registerStamp(0);
  const first = `${stamp} | lane-a | item ${id} · PR/CI opened | branch codex/${id}-fixture`;
  const second = `${stamp} | lane-b | RELEASED item ${id} — nothing held`;
  const { q, rendered } = twoLineClaimFixture(id, first, second);
  check(
    "two lines sharing one minute-precision stamp resolve to the later-APPENDED line",
    q.status === 0 &&
      releasedSection(rendered).includes(id) &&
      !heldSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 18. THE DISAGREEMENT IS REPORTED — this is the defect T-530 names.       */
/*     The resolver picking the stamp is defensible; picking it SILENTLY    */
/*     is not, because the bucket then contradicts the register's last      */
/*     written word with nothing downstream saying so.                      */
{
  const id = "T-593";
  const first = `${registerStamp(0)} | lane-a | item ${id} · PR/CI opened | branch codex/${id}-fixture`;
  const second = `${registerStamp(10)} | lane-b | RELEASED item ${id} — nothing held`;
  const { q, rendered } = twoLineClaimFixture(id, first, second);
  check(
    "an id whose append order and stamp order disagree is named in the queue",
    q.status === 0 &&
      /Append order and stamp order disagree/.test(rendered) &&
      new RegExp(`disagree[^]*\\b${id}\\b`).test(rendered) &&
      /disagree on 1 id/.test(rendered),
    `exit=${q.status}\nqueue=${rendered}`,
  );
}

/* 19. AND IT IS NOT REPORTED WHEN THE TWO ORDERS AGREE.                    */
/*     Without this, case 18 passes for a queue that prints the warning     */
/*     unconditionally, which is the string-literal gate this backlog       */
/*     exists to stop.                                                      */
{
  const id = "T-594";
  // Appended in stamp order: the two authorities pick the same line.
  const first = `${registerStamp(10)} | lane-a | item ${id} · PR/CI opened | branch codex/${id}-fixture`;
  const second = `${registerStamp(0)} | lane-b | RELEASED item ${id} — nothing held`;
  const { q, rendered } = twoLineClaimFixture(id, first, second);
  check(
    "no disagreement is reported when append order and stamp order agree",
    q.status === 0 &&
      !/Append order and stamp order disagree/.test(rendered) &&
      releasedSection(rendered).includes(id),
    `exit=${q.status}\nqueue=${rendered}`,
  );
}


/* ------------------------------------------------------------------------ */
/* 20. THE RELEASE VERDICT BELONGS TO THE ID IT SITS NEXT TO — item T-545.  */
/*                                                                          */
/*     The defect: the verdict was `/\bRELEASED\b/.test(line)` over the     */
/*     WHOLE line, and the id was matched separately, so the two were never */
/*     related to each other. A line claiming item A while narrating that   */
/*     item B's files were released read as a release of A, and the queue   */
/*     then offered actively-held work as free — an invitation straight     */
/*     into a collision.                                                    */
/*                                                                          */
/*     Measured on the live register at 2026-09-21T21:05Z: 107 lines parse  */
/*     as a release under the whole-line rule. On 100 of them the token is  */
/*     within 40 characters of the id reference and the furthest genuine    */
/*     one is 54; the five false ones sit 251, 457, 631, 793 and 908        */
/*     characters away. The band between 54 and 251 is empty, so the reach  */
/*     below is measured rather than guessed, and it errs toward `held`,    */
/*     which hides work, rather than toward `released`, which collides.     */
/* ------------------------------------------------------------------------ */

/** One claim line for one id, and the rendered queue it produces. */
function oneLineClaimFixture(id, line) {
  const dir = freshFixture();
  addBacklogItem(dir, id);
  mapFixtureId(dir, id);
  fs.appendFileSync(path.join(dir, "EXECUTION_CLAIMS.md"), `\n${line}\n`);
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  return { q, rendered };
}

/* 20a. THE DEFECT, in the exact shape found live: one line, two items.     */
/*      The claimed item is held; the release belongs to the OTHER id.      */
{
  const id = "T-595";
  const line =
    `${registerStamp(0)} | lane-a | item ${id} · CLAIMED | branch codex/${id}-fixture | ` +
    `files: a.ts, b.ts (free — the lane that held b.ts RELEASED item T-411 at 17:18Z, ` +
    `so nothing of theirs is outstanding on it) | no product runtime change`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a claim that MENTIONS another item's release does not release the item it claims",
    q.status === 0 &&
      heldSection(rendered).includes(id) &&
      !releasedSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 20b. No other id intervenes, but the token is far from the reference.    */
/*      This is the `#25` shape: a long claim line whose closing sentence   */
/*      releases a FILE claim, not the item.                                */
{
  const id = "T-596";
  // NOTHING between the id and the token may be another id reference, or the
  // intervening-id rule catches this case and the reach bound is never
  // exercised. An earlier draft wrote the branch as `codex/${id}-fixture` and
  // did exactly that: the case passed while the reach could be deleted.
  const filler = "Deploy readback is owed; the suite was confirmed executing in CI before merge. ".repeat(4);
  const line =
    `${registerStamp(0)} | lane-a | item ${id} · MERGED | branch codex/queue-fixture | ` +
    `${filler}Claim on the two catalog entries and the release record is RELEASED.`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a release token beyond the measured reach of the id reference does not release it",
    q.status === 0 &&
      heldSection(rendered).includes(id) &&
      !releasedSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 20c. ANTI-TAUTOLOGY. Without this a fix that never releases anything     */
/*      passes 20a and 20b, and the queue would then hide every finished    */
/*      item forever.                                                       */
{
  const id = "T-597";
  const line = `${registerStamp(0)} | lane-a | RELEASED item ${id} — merged, deployed, all files free`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a well-formed release still releases the item it names",
    q.status === 0 &&
      releasedSection(rendered).includes(id) &&
      !heldSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 20d. The reach is pinned ABOVE the furthest GENUINE release measured on  */
/*      the live register (54 characters, the `- item <id> | agent | <stamp> */
/*      | RELEASED` form). A reach tightened below this silently converts   */
/*      real releases into permanent holds, and no other case here would    */
/*      notice.                                                             */
{
  const id = "T-598";
  const line =
    `- item ${id} | source-backlog-executor | ${registerStamp(0)} | ` +
    `RELEASED — merged, deployed, runtime invariant proven, all files free`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "the id-first release form used live, with the agent and stamp in between, still releases",
    q.status === 0 &&
      releasedSection(rendered).includes(id) &&
      !heldSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 20e. A NEGATED release is not a release. The register says "NOT RELEASED, */
/*      still holding" as readily as it says "RELEASED", and reading the     */
/*      negated use as an announcement is the same false positive T-457     */
/*      measured for merge tokens.                                          */
{
  const id = "T-599";
  // Again no id reference between the two, so the NEGATOR is the only rule
  // that can reject this line, and deleting it fails this case.
  const line = `${registerStamp(0)} | lane-a | item ${id} · CLAIMED | branch codex/queue-fixture | NOT RELEASED, still holding every file`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a negated release token does not release the item",
    q.status === 0 &&
      heldSection(rendered).includes(id) &&
      !releasedSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 20f. THE NEAREST TOKEN, NOT THE FIRST ONE.                               */
/*      Added after a deliberate mutation escaped: replacing the "nearest"  */
/*      selection with "whichever token appears first" changed nothing,     */
/*      because no case above put two release tokens on one line, and the   */
/*      loop was an unreached branch. A surviving mutation over an          */
/*      unreached branch is not a score to accept.                          */
/*                                                                          */
/*      Here the first token is 200-odd characters away and speaks about    */
/*      another lane's shared fixture; the nearest sits beside the id. The  */
/*      first-token reading puts this item beyond the reach and holds it    */
/*      forever.                                                            */
{
  const id = "T-590";
  const filler = "The shared fixture was handed back before this claim was written, and nothing of theirs is outstanding on any file this lane touches. ".repeat(2);
  const line =
    `${registerStamp(0)} | lane-a | The lane that RELEASED the shared fixture is gone. ${filler}` +
    `— item ${id} · RELEASED, all files free`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "the release verdict follows the NEAREST token, not the first one on the line",
    q.status === 0 &&
      releasedSection(rendered).includes(id) &&
      !heldSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* ------------------------------------------------------------------------ */
/* 21. THE SUBJECT MAY LEAD THE SENTENCE — item T-510.                      */
/*                                                                          */
/*     The register writes releases in a form the parser could not see:     */
/*     the id leads, beside the verdict, with no `item` prefix.             */
/*                                                                          */
/*         RELEASED T-005 | MERGED PR #8013 | ... item 126 ...             */
/*                                                                          */
/*     Measured on the live register at 2026-09-22T09:50Z: 53 distinct ids  */
/*     carry a release or merge the queue could not read, against 23        */
/*     further verdict lines that genuinely name no subject and are left    */
/*     unresolved on purpose. The subject is still whichever grammar is     */
/*     written FIRST — the release form is a new candidate in that          */
/*     contest, not a new precedence over it, which is what case 21c pins.  */
/* ------------------------------------------------------------------------ */

/**
 * Two ids, one claim line each plus one release line that names the first as
 * its subject and the second only in passing. Returns the rendered queue.
 *
 * Two ids are the point: the acceptance for T-510 says a fixture with one id
 * on the line cannot fail, because a parser that simply took the last id
 * would satisfy it.
 */
function subjectLeadingFixture(subjectId, mentionedId, releaseLine) {
  const dir = freshFixture();
  for (const id of [subjectId, mentionedId]) {
    addBacklogItem(dir, id);
    mapFixtureId(dir, id);
  }
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    `\n${registerStamp(20)} | lane-a | item ${subjectId} · CLAIMED | branch codex/${subjectId}-fixture\n` +
      `${registerStamp(15)} | lane-b | item ${mentionedId} · CLAIMED | branch codex/${mentionedId}-fixture\n` +
      `${releaseLine}\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  return { q, rendered };
}

/* 21a. THE DEFECT, in the exact shape found live: the subject leads and a   */
/*      DIFFERENT id is mentioned later under the `item` grammar. Before     */
/*      the fix the line resolved to the mention and the subject's release   */
/*      was silently unrecorded. Both halves are asserted, because the       */
/*      mention staying held is what separates this from a parser that just  */
/*      grabs any id near a verdict.                                         */
{
  const subject = "T-596";
  const mentioned = "T-597";
  const line =
    `${registerStamp(0)} | lane-a | RELEASED ${subject} | MERGED PR #8013 SHA 57331dc6c | ` +
    `enum sweep reads annotated constants; mapping is never inferred from the name. ` +
    `Filed while closing item ${mentioned}, which another lane still holds.`;
  const { q, rendered } = subjectLeadingFixture(subject, mentioned, line);
  check(
    "a release whose subject LEADS the sentence releases that id, not the id mentioned later",
    q.status === 0 &&
      releasedSection(rendered).includes(subject) &&
      !heldSection(rendered).includes(subject) &&
      heldSection(rendered).includes(mentioned) &&
      !releasedSection(rendered).includes(mentioned),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 21b. The other half of the same grammar: the id LEADS and the verdict     */
/*      follows — `T-503 MERGED+CLOSED b1a7db782 (PR #8049)`. All 17 live    */
/*      lines in this form carry MERGED and none carries RELEASED, so what   */
/*      the alternative fixes is not the release bucket but WHICH LINE IS    */
/*      NEWEST for the id: an item whose claim has aged past the TTL and     */
/*      whose merge line the parser could not attribute reads as expired     */
/*      work in flight, when the register's last word on it was written a    */
/*      minute ago. Without this case the id-leading alternative can be      */
/*      deleted and 21a still passes.                                        */
{
  const subject = "T-598";
  const mentioned = "T-599";
  const dir = freshFixture();
  for (const id of [subject, mentioned]) {
    addBacklogItem(dir, id);
    mapFixtureId(dir, id);
  }
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    // Aged past the 3-hour TTL, and naming a branch, so the claim alone reads
    // as expired-but-in-flight.
    `\n${registerStamp(260)} | lane-a | item ${subject} · CLAIMED | branch codex/${subject}-fixture\n` +
      `${registerStamp(20)} | lane-b | item ${mentioned} · CLAIMED | branch codex/${mentioned}-fixture\n` +
      `${registerStamp(0)} | lane-a | ${subject} MERGED+CLOSED b1a7db782 (PR #8049) | ` +
      `measured independently before any string was edited; supersedes nothing in item ${mentioned}.\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  check(
    "a merge whose id LEADS the verdict is the newest line for THAT id, not for the id mentioned later",
    q.status === 0 &&
      heldSection(rendered).includes(subject) &&
      !inFlightSection(rendered).includes(subject) &&
      heldSection(rendered).includes(mentioned),
    `exit=${q.status}\nheld=${heldSection(rendered)}\ninFlight=${inFlightSection(rendered)}`,
  );
}

/* 21c. FIRST WRITTEN STILL WINS. This is the case that stops the new        */
/*      grammar being given precedence, and it is the one that would let a   */
/*      claim line release an item it merely narrates. The claimed item is   */
/*      written first; the release of ANOTHER lane's item sits later in a    */
/*      parenthetical. The claim must hold and the narrated id must not      */
/*      move — case 20a asserts the first half on one id, this asserts both  */
/*      halves on two.                                                       */
{
  const claimed = "T-600";
  const narrated = "T-601";
  const dir = freshFixture();
  for (const id of [claimed, narrated]) {
    addBacklogItem(dir, id);
    mapFixtureId(dir, id);
  }
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    `\n${registerStamp(20)} | lane-b | item ${narrated} · CLAIMED | branch codex/${narrated}-fixture\n` +
      `${registerStamp(0)} | lane-a | item ${claimed} · CLAIMED | branch codex/${claimed}-fixture | ` +
      `files: a.ts, b.ts (free — the lane that held b.ts RELEASED item ${narrated} at 17:18Z)\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  check(
    "a claim written before a narrated release keeps the line, and the narrated id is not released",
    q.status === 0 &&
      heldSection(rendered).includes(claimed) &&
      !releasedSection(rendered).includes(claimed) &&
      heldSection(rendered).includes(narrated) &&
      !releasedSection(rendered).includes(narrated),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 21d. A VERDICT LINE THAT NAMES NO SUBJECT STAYS UNRESOLVED. 23 of the 76 */
/*      live verdict lines are wave announcements carrying PR numbers and    */
/*      SHAs and no item id. A grammar loose enough to find a subject in     */
/*      one of those would attribute a release to whatever number it landed  */
/*      on, which is the T-545 failure in a new costume.                     */
{
  const id = "T-602";
  const dir = freshFixture();
  addBacklogItem(dir, id);
  mapFixtureId(dir, id);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    `\n${registerStamp(20)} | lane-a | item ${id} · CLAIMED | branch codex/${id}-fixture\n` +
      `${registerStamp(0)} | lane-b | RELEASED parallel wave · PR #7855 verdict kernel (\`f7fbc83bb\`), ` +
      `#7856 grounding dead export (\`3873b2ce6\`), #7857 stage 04 readiness (\`b6ddc5f11\`)\n`,
  );
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  check(
    "a release line naming no item id releases nothing",
    q.status === 0 &&
      heldSection(rendered).includes(id) &&
      !releasedSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nreleased=${releasedSection(rendered)}`,
  );
}

/* 22. A DECISION PHRASED AS AN IMPERATIVE IS STILL A DECISION — item T-597.  */
/*                                                                           */
/*     The derived blocker recognised "decision needed" and "Decide first"   */
/*     but not the ordinary imperative an acceptance actually gets written   */
/*     in. T-596's acceptance opens "Decide per job before pinning           */
/*     anything" and closes "this item is read-only until a human decides",  */
/*     and the board still read it `Unclaimed`, so the queue offered a job-  */
/*     runtime change that mutates tenant data as free work for an agent.    */
/*                                                                           */
/*     The sentences below are T-596's OWN prose, copied verbatim. A         */
/*     fixture invented to match the new pattern would pass while the real   */
/*     item stayed claimable, which is the shape of proof this repository    */
/*     has already been burned by once.                                      */
/*                                                                           */
/*     The detector was narrowed once before, when re-scanning raw prose     */
/*     made any descriptive use of "signed-in" an owner gate. This is a      */
/*     widening, so every case below that must NOT become a blocker is as    */
/*     much the subject of the test as the two that must.                    */

/** Put one item in the fixture backlog with a chosen acceptance, then build. */
function blockerCase(name, id, acceptance, expectClaimable) {
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| ${id} | **Synthetic blocker-derivation fixture.** | T | ${acceptance} |\n`,
  );
  mapFixtureId(dir, id);
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  const offered = claimableRegion(rendered).includes(id);
  check(
    name,
    q.status === 0 && offered === expectClaimable,
    `exit=${q.status}\nexpected claimable=${expectClaimable}, offered=${offered}\n` +
      `claimable region=${claimableRegion(rendered).replace(/\n/g, " ").slice(0, 400)}`,
  );
}

/** Everything the queue renders as takeable: the lane tables, and only those. */
function claimableRegion(rendered) {
  const start = rendered.indexOf("### Lane ");
  const end = rendered.indexOf("## Blocked on Anand");
  if (start < 0 || end < 0 || end < start) return "";
  return rendered.slice(start, end);
}

/* --- the two real forms, verbatim from T-596, must gate the item --------- */

blockerCase(
  "an imperative opening a sentence — T-596's own words — is a decision, not free work",
  "T-880",
  "**Decide per job before pinning anything: is it still wanted?** Five of the six carry a " +
    "one-off cutover tag from a dated migration and a sixth a stale `main-` tag, so `retire` " +
    "is a live answer for some of them.",
  false,
);

blockerCase(
  "an item held read-only until a human decides is a decision, not free work",
  "T-881",
  "For each job that stays, resolve its current tag to a digest and pin it. Do not run any " +
    "of these jobs to find out — several are ingest/backfill jobs that mutate tenant data, " +
    "and this item is read-only until a human decides.",
  false,
);

/* --- the narrowing has to survive: descriptive and negated uses are not --- */

blockerCase(
  "a past-tense report that a decision was already taken is not a blocker",
  "T-882",
  "The owner decided the taxonomy on 18 Sep and the decision is recorded in the release " +
    "record; carry it into the loader without re-deriving it.",
  true,
);

blockerCase(
  "a negated decision sentence is not a blocker",
  "T-883",
  "No decision is needed here. Nothing in this item requires the owner to decide anything, " +
    "so implement it against the value the record already names.",
  true,
);

blockerCase(
  "the word deciding inside a description of finished work is not a blocker",
  "T-884",
  "Deciding which suite to wire was settled by the T-556 triage, so wire the four files it " +
    "named and measure the coverage floor either side.",
  true,
);

blockerCase(
  "the earlier signed-in narrowing still holds — describing a signed-in fixture is not a gate",
  "T-885",
  "Build a signed-in-shaped fixture so the route's tenant fence is exercised under a real " +
    "session shape, and assert the fence rejects the second tenant.",
  true,
);


/* ------------------------------------------------------------------------ */
/* 23. AN ITEM'S OWN BODY AND A CLAIM LINE ARE DIFFERENT KINDS OF EVIDENCE   */
/*     — item T-578.                                                        */
/*                                                                          */
/*     `deriveBlocker` was handed one flat string: the item's title,         */
/*     acceptance and raw section concatenated with every claim-log line     */
/*     that names it. A claim line narrates INTENT — "claimed | lane T;      */
/*     decide which vocabulary is authoritative" — so it goes on reading as  */
/*     an open decision for as long as the line exists, which is forever;    */
/*     the register is append-only and a line is never restamped.            */
/*                                                                          */
/*     Measured on the live backlog at `a1a6b82c8` before this was written:  */
/*     12 of 411 items read `Decision needed` from a claim line their own    */
/*     body does not support. All 12 sit at rung merged, deployed or         */
/*     proven, so the effect today is confined to display buckets — but the  */
/*     same corpus decides a rung-0 item's fate, and there the same stale    */
/*     line would hide live work instead of mislabelling finished work.      */
/*                                                                          */
/*     So the narrowing is scoped twice over, and both scopes are a case     */
/*     below that must NOT change: it applies only to the decision rule      */
/*     (case 23d keeps a claim-derived `Blocked`), and only once the item's  */
/*     own source records shipping proof (case 23c keeps the gate on an      */
/*     open item). A fix that simply dropped claim lines from the corpus     */
/*     passes 23a and fails both of those.                                   */
/* ------------------------------------------------------------------------ */

/** The generated summary's node for one id: its derived rung and blocker. */
function summaryNodeFor(dir, id) {
  const summary = JSON.parse(
    fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"),
  );
  let found = null;
  (function collect(node) {
    if (found) return;
    if (Array.isArray(node)) return node.forEach(collect);
    if (node && typeof node === "object") {
      if (node.num === id && "blocker" in node) {
        found = node;
        return;
      }
      Object.values(node).forEach(collect);
    }
  })(summary);
  return found;
}

/**
 * One backlog row, its claim-log lines, and an assertion on BOTH the derived
 * rung and the derived blocker.
 *
 * The rung is asserted too because every case here turns on it. A fixture
 * whose merge line failed to parse would sit at `Open` and then pass case 23a
 * for the wrong reason, which is the shape of proof this file exists to stop.
 */
function blockerCorpusCase(name, id, acceptance, claimLines, expectRung, expectBlocker) {
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| ${id} | **Synthetic blocker-corpus fixture.** | T | ${acceptance} |\n`,
  );
  mapFixtureId(dir, id);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    `\n${claimLines.join("\n")}\n`,
  );
  const q = buildBoardAndQueue(dir);
  const node = summaryNodeFor(dir, id);
  fs.rmSync(dir, { recursive: true, force: true });
  check(
    name,
    q.status === 0 &&
      node !== null &&
      node.rungLabel === expectRung &&
      (node.blocker ?? null) === expectBlocker,
    `exit=${q.status}\nexpected rung=${expectRung} blocker=${expectBlocker}\n` +
      `actual=${JSON.stringify(node)}`,
  );
}

/** An agent's stated intent, in the grammar the live register actually uses. */
const INTENT_TO_DECIDE =
  "claimed | lane T; decide which tenant-name vocabulary is authoritative " +
  "before writing any code";

/* --- 23a. THE DEFECT: a merged item still gated by its own claim line ---- */

blockerCorpusCase(
  "a claim line's stated intent to decide is not an open gate once the item merged",
  "T-886",
  "Reconcile the two display-name vocabularies so one derives from the other.",
  [
    `${registerStamp(90)} | lane-a | item T-886 — ${INTENT_TO_DECIDE}`,
    `${registerStamp(30)} | lane-a | item T-886 MERGED via PR #900, squash \`abc1234\``,
  ],
  "Merged",
  null,
);

/* --- 23b. The item's OWN body still gates it, merged or not -------------- */

blockerCorpusCase(
  "a gate the item's own body declares survives the item being merged",
  "T-887",
  "**Decide per job before pinning anything: is it still wanted?** Five of the six " +
    "carry a one-off cutover tag from a dated migration.",
  [`${registerStamp(30)} | lane-a | item T-887 MERGED via PR #901, squash \`abc1235\``],
  "Merged",
  "Decision needed",
);

/* --- 23c. An OPEN item keeps the gate its claim line records ------------- */
/*          This is the direction that hides live work, so it is pinned      */
/*          with the same fixture text as 23a and only the merge line        */
/*          removed — the two cases differ by exactly the thing under test.  */

blockerCorpusCase(
  "an item with no shipping proof still reads the gate its claim line records",
  "T-888",
  "Reconcile the two display-name vocabularies so one derives from the other.",
  [`${registerStamp(90)} | lane-a | item T-888 — ${INTENT_TO_DECIDE}`],
  "Open",
  "Decision needed",
);

/* --- 23d. Only the DECISION rule is narrowed, and only for the claims ---- */
/*          The same claim line carries both a decision narration and a      */
/*          blocker. Before T-578 the decision rule matched first and the    */
/*          blocker was never reached; after it, the decision match is       */
/*          skipped and the REMAINING rules still read the claim corpus.     */
/*          A corpus-wide fix returns null here.                             */

blockerCorpusCase(
  "narrowing the decision rule does not stop other rules reading the claim log",
  "T-889",
  "Reconcile the two display-name vocabularies so one derives from the other.",
  [
    `${registerStamp(90)} | lane-a | item T-889 — ${INTENT_TO_DECIDE}; ` +
      "blocked on the vendor export until it lands",
    `${registerStamp(30)} | lane-a | item T-889 MERGED via PR #902, squash \`abc1236\``,
  ],
  "Merged",
  "Blocked (see source)",
);

/* ------------------------------------------------------------------------ */
/* 24. A GATE THE ITEM'S OWN BODY DECLARES OUTRANKS ONE A CLAIM LINE         */
/*     CARRIES — item T-700, the opposite half of T-578.                     */
/*                                                                          */
/*     `BLOCKER_RULES` is ordered and the signed-in rule is first, so when   */
/*     a claim line carried signed-in language it took the label away from   */
/*     a gate the item states in its own body. T-578 narrowed the corpus     */
/*     for the decision rule; it did not touch the order, and the order is   */
/*     what decides between two matches from different evidence.             */
/*                                                                          */
/*     This is the direction that HIDES an owner gate rather than inventing  */
/*     one. Measured on the live register at `ef261ac74`, 22 items read a    */
/*     claim-derived `Signed-in acceptance owed` over a gate their own body  */
/*     declares, and `T-598` — which has not shipped — was one of them: it   */
/*     was moved into the wrong bucket by a NEIGHBOURING item's release      */
/*     paperwork naming it.                                                  */
/*                                                                          */
/*     A fixture whose body and claim line AGREE cannot fail any of this,    */
/*     so every case below is built with the two in genuine disagreement.    */
/*     24c and 24d are controls that pass on unfixed code by design: they    */
/*     are the two things an over-broad fix breaks.                          */
/* ------------------------------------------------------------------------ */

/** A claim line that records a signed-in gate — rule 1, the one that was winning. */
const CLAIMS_SIGNED_IN = "signed-in acceptance owed";

/* --- 24a. THE DEFECT, at a shipped rung --------------------------------- */

blockerCorpusCase(
  "a decision the item's own body declares outranks a claim line's signed-in gate",
  "T-890",
  "**Decide** which tenant-name vocabulary is authoritative, then make the map express it.",
  [
    `${registerStamp(90)} | lane-a | item T-890 claimed`,
    `${registerStamp(30)} | lane-a | item T-890 MERGED via PR #903, squash \`abc1237\`; ${CLAIMS_SIGNED_IN}`,
  ],
  "Merged",
  "Decision needed",
);

/* --- 24b. THE DEFECT at rung 0, which is what it actually costs ---------- */
/*          Same body, same claim language, no shipping proof. This is the   */
/*          `T-598` shape: an open item with a question nobody can see,      */
/*          because the register names it in someone else's paperwork.       */

blockerCorpusCase(
  "an OPEN item's own decision gate is not hidden by a claim line about something else",
  "T-891",
  "**Decide** which tenant-name vocabulary is authoritative, then make the map express it.",
  [
    `${registerStamp(60)} | lane-a | item T-891 named in passing; ${CLAIMS_SIGNED_IN} for the neighbouring change`,
  ],
  "Open",
  "Decision needed",
);

/* --- 24c. CONTROL: `Unclaimed` is the fallback, never a body gate -------- */
/*          The live known positive is T-418, whose body reads "the largest  */
/*          unclaimed critical row in the census" — prose about a census,    */
/*          not a status. A fix that promotes ANY body match returns         */
/*          `Unclaimed` here and moves a real gate OUT of the never-claim    */
/*          bucket, which is the one direction this file must never take.    */

blockerCorpusCase(
  "descriptive prose using the word unclaimed does not outrank a real claim-log gate",
  "T-892",
  "Wire the largest unclaimed critical tree in the census; 9 of its 69 files already run.",
  [
    `${registerStamp(30)} | lane-a | item T-892 MERGED via PR #904, squash \`abc1238\`; ${CLAIMS_SIGNED_IN}`,
  ],
  "Merged",
  "Signed-in acceptance owed",
);

/* --- 24d. CONTROL: a body that declares nothing still reads the claims --- */
/*          The obvious wrong fix is to stop reading the claim log. It       */
/*          passes 24a, 24b and 24e, and silently blanks every item whose    */
/*          only gate was ever recorded by an agent rather than by the row.  */

blockerCorpusCase(
  "an item whose body declares no gate still reads the one its claim line records",
  "T-893",
  "Reconcile the two display-name vocabularies so one derives from the other.",
  [`${registerStamp(60)} | lane-a | item T-893 claimed; ${CLAIMS_SIGNED_IN}`],
  "Open",
  "Signed-in acceptance owed",
);

/* --- 24e. The precedence is by EVIDENCE, not by rule rank ---------------- */
/*          `Blocked` is rule 4 and signed-in is rule 1. The body carries    */
/*          the lower-ranked rule and still wins, which is the whole claim:  */
/*          one comparison, not a re-ranking. A fix that merely moved the    */
/*          decision rule above the signed-in rule passes 24a and 24b and    */
/*          fails here.                                                      */

blockerCorpusCase(
  "a lower-ranked rule matching the body outranks a higher-ranked one matching the claims",
  "T-894",
  "The vendor export is blocked on the schema freeze upstream.",
  [
    `${registerStamp(30)} | lane-a | item T-894 MERGED via PR #905, squash \`abc1239\`; ${CLAIMS_SIGNED_IN}`,
  ],
  "Merged",
  "Blocked (see source)",
);

/* ======================================================================== */
/* 25. Band capacity is MEASURED, not asserted by a static table (T-701a).  */
/*                                                                          */
/*     The defect: the queue hands out the id-band rule — "take the lowest  */
/*     free number in your own band" — as a three-row table of prose. It    */
/*     never measures whether a band has a free number left. Measured on    */
/*     `9f3f7cd39` across the three files the rule itself names — backlog,  */
/*     claim log, and the repo-owned structure map — `T-500`–`T-599` is     */
/*     100 of 100 spent, and nothing anywhere reports it. So the next agent */
/*     to file a T-lane item collides by applying the rule CORRECTLY, which */
/*     is the exact failure disjoint bands exist to prevent.                */
/*                                                                          */
/*     Every assertion below is on the child process's own stdout and on    */
/*     the rendered file. Nothing asks the generator whether it thinks a    */
/*     band is full.                                                        */
/*                                                                          */
/*     Assertions are DELTAS against a measured baseline, never absolutes.  */
/*     The fixture copies the real repo-owned structure map, so it already  */
/*     carries live ids; an absolute expectation here would encode today's  */
/*     map and fail the next time anyone files an item. A delta states the  */
/*     claim that actually matters — this id, in this document, moved this  */
/*     band by exactly one.                                                 */
/* ======================================================================== */

/** Parse `  band X-500: D 98 free  U 94 free ...` out of the queue's stdout. */
function bandFree(stdout, band, lane) {
  const line = stdout.split("\n").find((l) => l.trim().startsWith(`band X-${band}:`));
  if (!line) return null;
  const m = new RegExp(`\\b${lane} (\\d+) free\\b`).exec(line);
  return m ? Number(m[1]) : null;
}

/**
 * Build a fixture that spends specific ids in specific documents.
 *
 * The three sources are kept separate on purpose: an id spent ONLY in the
 * claim log is the trap the item names, and a fixture that writes every id to
 * every file cannot tell a reader that reads all three from one that reads
 * the backlog alone.
 */
function bandFixture({ backlog = [], claimsOnly = [], mapOnly = [] } = {}) {
  const dir = freshFixture();
  for (const id of backlog) {
    addBacklogItem(dir, id);
    mapFixtureId(dir, id);
  }
  for (const id of mapOnly) mapFixtureId(dir, id);
  for (const id of claimsOnly) {
    fs.appendFileSync(
      path.join(dir, "EXECUTION_CLAIMS.md"),
      `\n${registerStamp(30)} | lane-a | item ${id} filed out of an adjacent change; no backlog row written yet\n`,
    );
  }
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  return { q, rendered };
}

/**
 * Ids in a band that the untouched fixture does not already spend.
 *
 * This reads the fixture's own documents rather than asking the generator,
 * so it selects inputs; it never sources an expectation from the subject.
 */
function freeIdsInBand(lane, band, count) {
  const dir = freshFixture();
  const seen = new Set();
  for (const f of fs.readdirSync(dir)) {
    for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(/\b([DUCT])-(\d{3})\b/g)) {
      seen.add(`${m[1]}-${m[2]}`);
    }
  }
  fs.rmSync(dir, { recursive: true, force: true });
  const out = [];
  for (let n = band; n < band + 100 && out.length < count; n += 1) {
    const id = `${lane}-${n}`;
    if (!seen.has(id)) out.push(id);
  }
  if (out.length < count) throw new Error(`fixture has fewer than ${count} free ids in ${lane}-${band}`);
  return out;
}

/** Every id in one lane's band, e.g. T-500 … T-599. */
function wholeBand(lane, band) {
  return Array.from({ length: 100 }, (_, n) => `${lane}-${band + n}`);
}

const BASELINE = bandFixture({});

/* --- 25a. The number moves with the documents --------------------------- */
/*          A static table cannot do this: spend one more id and the count   */
/*          must fall by exactly one.                                        */
{
  const before = bandFree(BASELINE.q.stdout, 500, "T");
  const { q } = bandFixture({ backlog: freeIdsInBand("T", 500, 1) });
  check(
    "the band table reports a measured free count, not a static rule",
    BASELINE.q.status === 0 && before !== null && before < 100
      && bandFree(q.stdout, 500, "T") === before - 1,
    `baseline T-500 free=${before}, after one more id=${bandFree(q.stdout, 500, "T")}\nstdout=${q.stdout.trim()}`,
  );
  const section = BASELINE.rendered.split("### Filing a new item")[1] ?? "";
  check(
    "the rendered queue carries the measured capacity, not only the process output",
    /X-500` to `X-599/.test(section) && new RegExp(`\\b${before}\\b`).test(section),
    `expected the free count ${before} in the rendered band table\n${section.slice(0, 900)}`,
  );
}

/* --- 25b. THE DEFECT, on a fixture of the live band's exact shape -------- */
/*          T-500…T-599 all spent. The queue must say so loudly, in the      */
/*          rendered file an agent reads AND on the output an operator       */
/*          watches. A reporter that only writes the file is one an          */
/*          unattended run never sees.                                       */
{
  const { q, rendered } = bandFixture({ backlog: wholeBand("T", 500) });
  check(
    "an exhausted band measures zero free",
    q.status === 0 && bandFree(q.stdout, 500, "T") === 0,
    `exit=${q.status}\nT-500 free=${bandFree(q.stdout, 500, "T")}\nstdout=${q.stdout.trim()}`,
  );
  check(
    "an exhausted band is announced loudly on the process output",
    /BAND EXHAUSTED: `?T-500`?–`?T-599/.test(q.stdout + q.stderr),
    `stdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}`,
  );
  check(
    "an exhausted band is announced in the file the agent reads before filing",
    /EXHAUSTED/.test(rendered) && rendered.includes("T-500"),
    rendered.split("### Filing a new item")[1]?.slice(0, 1200),
  );
}

/* --- 25c. An id spent ONLY in the claim log is spent --------------------- */
/*          The live known positives are T-574, T-575 and T-576: named in    */
/*          the register, absent from the backlog and from the map. The      */
/*          2026-09-22T11:07Z correction recorded this exact trap — an id    */
/*          absent from the backlog is not thereby free — so a reader that   */
/*          measures the backlog alone reports capacity that does not exist. */
{
  const before = bandFree(BASELINE.q.stdout, 500, "T");
  const { q } = bandFixture({ claimsOnly: freeIdsInBand("T", 500, 3) });
  check(
    "ids spent only in the claim log are counted against the band",
    bandFree(q.stdout, 500, "T") === before - 3,
    `baseline=${before}, after three register-only ids=${bandFree(q.stdout, 500, "T")}\nstdout=${q.stdout.trim()}`,
  );
}

/* --- 25d. An id spent only in the structure map is spent ----------------- */
{
  const before = bandFree(BASELINE.q.stdout, 500, "C");
  const { q } = bandFixture({ mapOnly: freeIdsInBand("C", 500, 2) });
  check(
    "ids spent only in the structure map are counted against the band",
    bandFree(q.stdout, 500, "C") === before - 2,
    `baseline C-500=${before}, after two map-only ids=${bandFree(q.stdout, 500, "C")}\nstdout=${q.stdout.trim()}`,
  );
}

/* --- 25e. GUARDRAIL: the count is per lane ------------------------------- */
/*          The cheap wrong fix counts any `-5xx` id and reports one shared  */
/*          band. It passes 25a, 25b and 25c and tells a C-lane agent its    */
/*          band is full because the T lane filled up.                       */
{
  const { q } = bandFixture({ backlog: wholeBand("T", 500) });
  check(
    "one lane's exhausted band does not consume another lane's",
    // A guardrail against an over-broad fix, so it must not be satisfiable by
    // the absence of one: two unmeasured lanes are equal to each other.
    bandFree(q.stdout, 500, "C") !== null
      && bandFree(q.stdout, 500, "C") === bandFree(BASELINE.q.stdout, 500, "C")
      && bandFree(q.stdout, 500, "U") === bandFree(BASELINE.q.stdout, 500, "U"),
    `C=${bandFree(q.stdout, 500, "C")} (baseline ${bandFree(BASELINE.q.stdout, 500, "C")}) `
      + `U=${bandFree(q.stdout, 500, "U")} (baseline ${bandFree(BASELINE.q.stdout, 500, "U")})\nstdout=${q.stdout.trim()}`,
  );
}

/* --- 25f. GUARDRAIL: the count is per band ------------------------------- */
/*          Ids adjacent to a band must not be drawn into it. One free id    */
/*          is taken from each neighbouring band and each must move only     */
/*          its own.                                                         */
{
  const [low] = freeIdsInBand("T", 400, 1);
  const [high] = freeIdsInBand("T", 600, 1);
  const base500 = bandFree(BASELINE.q.stdout, 500, "T");
  const base400 = bandFree(BASELINE.q.stdout, 400, "T");
  const base600 = bandFree(BASELINE.q.stdout, 600, "T");
  const { q } = bandFixture({ claimsOnly: [low, high] });
  check(
    "ids in a neighbouring band are not counted against this one",
    bandFree(q.stdout, 500, "T") === base500
      && bandFree(q.stdout, 400, "T") === base400 - 1
      && bandFree(q.stdout, 600, "T") === base600 - 1,
    `spent ${low} and ${high}: T-400=${bandFree(q.stdout, 400, "T")} (baseline ${base400}), `
      + `T-500=${bandFree(q.stdout, 500, "T")} (baseline ${base500}), `
      + `T-600=${bandFree(q.stdout, 600, "T")} (baseline ${base600})\nstdout=${q.stdout.trim()}`,
  );
}

/* --- 25g. GUARDRAIL: a healthy band is not announced --------------------- */
/*          A warning printed unconditionally is a warning nobody reads.     */
{
  check(
    "a band with capacity left raises no exhaustion warning",
    !/BAND EXHAUSTED/.test(BASELINE.q.stdout + BASELINE.q.stderr)
      && !/EXHAUSTED/.test(BASELINE.rendered),
    `stdout=${BASELINE.q.stdout.trim()}\nstderr=${BASELINE.q.stderr.trim()}`,
  );
}

/* --- 25h. A band close to the edge is reported before it is too late ----- */
/*          Exhaustion is the failure; a band with a handful of numbers left */
/*          is the last moment at which the range decision is still cheap.   */
{
  const before = bandFree(BASELINE.q.stdout, 600, "U");
  const { q } = bandFixture({ backlog: freeIdsInBand("U", 600, before - 5) });
  check(
    "a nearly-spent band is announced before it is spent",
    bandFree(q.stdout, 600, "U") === 5 && /BAND LOW: `?U-600`?–`?U-699/.test(q.stdout + q.stderr),
    `U-600 free=${bandFree(q.stdout, 600, "U")} (baseline ${before})\nstdout=${q.stdout.trim()}`,
  );
}


/* --- 26. PROVENANCE: the queue refuses a summary it did not produce ------
 *
 * T-711. Before this, the queue validated WHAT the summary was derived from
 * and never WHO derived it. A superseded copy of the board generator left in
 * the operator root writes a summary the queue accepted without comment — and
 * on 2026-09-22 that is what happened to the live queue both lanes read to
 * pick work: 61 claimable against the repo-owned pair's 1, and seven rows it
 * offered were recorded CLOSED in the backlog itself.
 *
 * The board now stamps itself into the summary and the queue compares that
 * stamp against its own sibling. Three cases, and the third is load-bearing:
 * a guard whose unknown case passes is opt-in, and every summary written
 * before this existed is exactly that unknown case.
 */

/**
 * A stated refusal, not merely a non-zero exit.
 *
 * Measured while mutation-testing this guard: disabling the missing-stamp
 * branch did NOT make the queue render -- the next branch dereferenced the
 * absent stamp and the process died with a TypeError. Exit code 1 and no
 * output file, which satisfies every refusal check written in terms of those
 * two. A crash is not a control, so the cases below require the sentence and
 * forbid the stack.
 */
function isStatedRefusal(result) {
  return (
    result.status !== 0
    && /^Refusing to build the queue:/m.test(result.stderr)
    && !/\n\s+at .+:\d+:\d+/.test(result.stderr)
  );
}

/** Rewrite the fixture's summary, as a differently-versioned board would. */
function rewriteSummary(dir, mutate) {
  const file = path.join(dir, "source-board-summary.json");
  const summary = JSON.parse(fs.readFileSync(file, "utf8"));
  mutate(summary);
  fs.writeFileSync(file, `${JSON.stringify(summary, null, 2)}\n`);
}

/* --- 26a. A summary carrying no generator stamp is refused --------------- */
/*          This is the shape every pre-T-711 copy writes, including the one */
/*          that produced the live queue.                                    */
{
  const dir = freshFixture();
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  rewriteSummary(dir, (s) => {
    delete s.generator;
  });
  const q = run(dir, "build-execution-queue.mjs");
  check(
    "an unstamped summary is refused rather than rendered",
    board.status === 0 && isStatedRefusal(q) && !COUNTS_LINE.test(q.stdout),
    `board=${board.status} queue=${q.status}\nstdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}`,
  );
  check(
    "the refusal names the superseded copy as the cause",
    /superseded|operator root/i.test(q.stderr),
    `stderr=${q.stderr.trim()}`,
  );
  check(
    "the refusal writes no queue over the previous one",
    !fs.existsSync(path.join(dir, "EXECUTION_QUEUE.md")),
    "EXECUTION_QUEUE.md was written by a refusing run",
  );
}

/* --- 26b. A summary stamped by a DIFFERENT board generator is refused ---- */
/*          A drifted copy that does stamp itself is the harder case: the    */
/*          field is present and wrong, which reads as fine to a presence    */
/*          check.                                                           */
{
  const dir = freshFixture();
  run(dir, "build-source-board.mjs", ["--json"]);
  rewriteSummary(dir, (s) => {
    // Spread rather than assign, so this case reports a FAIL against an
    // unstamped summary instead of throwing and taking the rest with it.
    s.generator = {
      ...(s.generator ?? {}),
      sha256: "0".repeat(64),
      ranFrom: "/Users/someone/Downloads/build-source-board.mjs",
    };
  });
  const q = run(dir, "build-execution-queue.mjs");
  check(
    "a summary stamped by a different board generator is refused",
    isStatedRefusal(q) && !COUNTS_LINE.test(q.stdout),
    `queue=${q.status}\nstdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}`,
  );
  check(
    "the refusal names the path the summary says wrote it",
    q.stderr.includes("/Users/someone/Downloads/build-source-board.mjs"),
    `stderr=${q.stderr.trim()}`,
  );
}

/* --- 26c. GUARDRAIL: the matching pair still renders --------------------- */
/*          A refusal that fires on the correct path is removed by the first */
/*          agent it blocks, so the passing case is asserted too -- and the  */
/*          rendered queue says which generator wrote it, because the only   */
/*          tell before this was the wording of a regenerate block.          */
{
  const dir = freshFixture();
  const q = buildBoardAndQueue(dir);
  const rendered = fs.existsSync(path.join(dir, "EXECUTION_QUEUE.md"))
    ? fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8")
    : "";
  check(
    "the repo-owned pair renders with no provenance complaint",
    q.status === 0 && COUNTS_LINE.test(q.stdout),
    `queue=${q.status}\nstdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}`,
  );
  check(
    "the rendered queue names the generators that produced it",
    rendered.includes("scripts/exec/build-execution-queue.mjs")
      && rendered.includes("scripts/exec/build-source-board.mjs")
      && /Generated by/.test(rendered),
    rendered.split("\n").slice(0, 14).join("\n"),
  );
}


/* ------------------------------------------------------------------------ */
/* 27. WHY THE QUEUE IS EMPTY (item T-731).                                  */
/*                                                                           */
/*     Measured on the live documents at origin/main `3b8e0dc99`, the         */
/*     claimable funnel is 424 -> 83 -> 62 -> 15 -> 14 -> 14 -> 0: fourteen   */
/*     of fourteen surviving candidates are removed by the in-flight rule     */
/*     alone. The rendered file said "0 items are claimable" and nothing      */
/*     else, so an agent could not tell an exhausted backlog from one         */
/*     filter having eaten the list, and the difference decides whether it    */
/*     stops or goes looking.                                                 */
/*                                                                           */
/*     These cases assert on the RENDERED FILE, never on the generator's      */
/*     own opinion of its counts.                                             */
/* ------------------------------------------------------------------------ */

/** The ids the queue names as candidates the in-flight rule alone suppresses. */
function suppressedCandidateSection(rendered) {
  return rendered.match(
    /\*\*Suppressed CANDIDATES — the only ids between this queue and a claimable row \((\d+) of (\d+)\):\*\*(.*)/,
  ) ?? null;
}

/** The rendered funnel rows, as `label -> remaining` pairs. */
function funnelRows(rendered) {
  // Bound the block by the NEXT heading, not by the first blank line: the
  // block has a blank line after its own heading, so a lazy `\n\n` bound
  // reads an empty table and every count assertion below it passes vacuously
  // on zero rows.
  const block = rendered.match(/## Why that number\n[\s\S]*?(?=\n## )/)?.[0] ?? "";
  return [...block.matchAll(/^\| (.+?) \| (\d+) \| (\d+) \|$/gm)].map((m) => ({
    label: m[1],
    removed: Number(m[2]),
    remaining: Number(m[3]),
  }));
}

/**
 * A fixture with three expired in-flight claims of which exactly ONE is a
 * claimable candidate.
 *
 * The other two are the dilution this item is about: on the live documents
 * 132 ids sit on the in-flight line and only 14 of them would become
 * claimable if freed, so "check its branch and PR" costs 132 lookups to
 * recover 14 rows and is therefore never performed.
 */
function suppressedFixture({ alsoSuppressBase = false } = {}) {
  const dir = freshFixture();
  // The candidate: ordinary open item, states an acceptance, nobody's gate.
  addBacklogItem(dir, "T-901");
  mapFixtureId(dir, "T-901");
  // Not a candidate: its acceptance is a decision, so it is blocked on Anand.
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| T-902 | **Synthetic owner-gated fixture.** | T | Decision needed: which taxonomy applies. |\n`,
  );
  mapFixtureId(dir, "T-902");
  // Not a candidate: no acceptance at all, so there is nothing to finish.
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    // An empty acceptance cell, not an em dash: the filter tests the trimmed
    // string, and "—" is a character like any other. A fixture writing the
    // dash asserts nothing about the rule it is aimed at.
    `\n| T-903 | **Synthetic note, not work.** | T |  |\n`,
  );
  mapFixtureId(dir, "T-903");
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    [
      "",
      `${registerStamp(2600)} | lane-a | item T-901 · CLAIMED | branch codex/t901-fixture`,
      `${registerStamp(2600)} | lane-a | item T-902 · CLAIMED | branch codex/t902-fixture`,
      `${registerStamp(2600)} | lane-a | item T-903 · CLAIMED | branch codex/t903-fixture`,
      // The base fixture ships one ordinary claimable item, T-507. Suppressing
      // it too is what reproduces the live shape: a queue whose claimable list
      // is empty ONLY because every survivor sits behind the in-flight rule.
      ...(alsoSuppressBase
        ? [`${registerStamp(2600)} | lane-a | item T-507 · CLAIMED | branch codex/t507-fixture`]
        : []),
      "",
    ].join("\n"),
  );
  return dir;
}

/* --- 27a. The suppressed CANDIDATES are named apart from the rest -------- */
/*          Without this the file names all three ids and the reader has no  */
/*          way to know which one is worth a GitHub lookup.                  */
{
  const dir = suppressedFixture();
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  const m = suppressedCandidateSection(rendered);
  check(
    "the in-flight ids that would be claimable are named apart from those that would not",
    q.status === 0 && m !== null
      && m[1] === "1" && m[2] === "3"
      && m[3].includes("T-901")
      && !m[3].includes("T-902")
      && !m[3].includes("T-903"),
    `exit=${q.status}\nmatched=${m ? m[0] : "(no suppressed-candidate line)"}\ninFlight=${inFlightSection(rendered)}`,
  );
}

/* --- 27b. The full in-flight list is NOT replaced by the subset ---------- */
/*          The collision warning the subset came from still has to reach    */
/*          the reader: an id whose claim is live work must stay named even  */
/*          when it could never be claimable.                                */
{
  const dir = suppressedFixture();
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  const full = inFlightSection(rendered);
  check(
    "narrowing the list to candidates does not stop the other in-flight ids being reported",
    q.status === 0 && full.includes("T-901") && full.includes("T-902") && full.includes("T-903"),
    `exit=${q.status}\ninFlight=${full}`,
  );
}

/* --- 27c. NEGATIVE CONTROL: nothing suppressed, no section -------------- */
/*          A section rendered unconditionally would pass 27a on its header  */
/*          alone. `Array.every` of nothing is true and `0 of 0` compares    */
/*          two empty lists, so the absent case is asserted explicitly.      */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-904");
  mapFixtureId(dir, "T-904");
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  check(
    "NEGATIVE CONTROL — with nothing suppressed the candidate line is absent, not empty",
    q.status === 0
      && suppressedCandidateSection(rendered) === null
      && !rendered.includes("Suppressed CANDIDATES")
      && rendered.includes("| T-904 |"),
    `exit=${q.status}\nrendered tail=${rendered.slice(-600)}`,
  );
}

/* --- 27d. The funnel explains the number, and it is computed ------------ */
/*          from the same predicates the filter uses. A report derived a     */
/*          second time from a parallel copy of the rules can disagree with  */
/*          the filter it describes, which is the defect family this whole   */
/*          directory exists against.                                        */
{
  const dir = suppressedFixture();
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  const rows = funnelRows(rendered);
  const inFlightRow = rows.find((r) => /in flight/i.test(r.label));
  const blockedRow = rows.find((r) => /Anand|owner/i.test(r.label));
  const acceptanceRow = rows.find((r) => /acceptance/i.test(r.label));
  check(
    "the rendered funnel accounts for every item the claimable filter removed",
    q.status === 0
      && rows.length >= 6
      && inFlightRow?.removed === 1
      && inFlightRow?.remaining === 1
      && blockedRow?.removed === 1
      && acceptanceRow?.removed === 1,
    `exit=${q.status}\nrows=${JSON.stringify(rows, null, 2)}`,
  );
}

/* --- 27e. Zero claimable says so in words, and the count agrees --------- */
/*          The summary sentence and the funnel are two renderings of one    */
/*          number; if they can disagree the reader learns nothing from      */
/*          either.                                                          */
{
  const dir = suppressedFixture({ alsoSuppressBase: true });
  const q = buildBoardAndQueue(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  const rows = funnelRows(rendered);
  const last = rows[rows.length - 1];
  check(
    "an empty queue states which filter emptied it and agrees with its own count",
    q.status === 0
      && rendered.includes("**0 items are claimable right now")
      && /every remaining candidate was removed by/i.test(rendered)
      && last?.remaining === 0,
    `exit=${q.status}\nrows=${JSON.stringify(rows)}\nhead=${rendered.slice(0, 1400)}`,
  );
}


/* ------------------------------------------------------------------------ */
/* 28. THE IN-FLIGHT TEST READS THE CLAIM'S OWN BRANCH FIELD — item T-734.  */
/*                                                                          */
/*     The defect: in-flight was decided by a PREFIX ALLOWLIST over the     */
/*     whole line — `codex/…` or `claude/…`, plus a four-digit PR number.   */
/*     The operator task file instructs every run to cut its own worktree   */
/*     with `git worktree add -b <your-branch>`, and the runs that follow   */
/*     it name branches `exec/…`. None of those matched.                    */
/*                                                                          */
/*     A prefix list is a guess about naming that goes stale the moment a    */
/*     convention changes; the `on branch \`x\`` field is the claim's own    */
/*     answer, and `append-claim.mjs --branch` already writes it. So the    */
/*     field is read directly and the allowlist is kept BESIDE it for the   */
/*     legacy pipe-delimited lines that predate the helper. The two signals */
/*     union, which is the safe direction: a claim can only move from       */
/*     `expired-idle` (printed as FREE TO TAKE) toward `expired-in-flight`  */
/*     (do not take), never the reverse.                                    */
/*                                                                          */
/*     Measured on the live register at 2026-09-23T13:29Z: 721 lines parse  */
/*     as claims, 561 matched the allowlist, and 31 carried an explicit      */
/*     `on branch \`exec/…\`` field that it missed — including the claim     */
/*     line for this very item, written thirty seconds earlier.             */
/* ------------------------------------------------------------------------ */

/** The ids the queue renders on the "free to take" line. */
function idleSection(rendered) {
  return rendered.match(/\*\*Expired with no branch or PR, free to take \(\d+\):\*\*(.*)/)?.[1] ?? "";
}

/* 28a. THE DEFECT, in the exact shape the helper writes it.                */
/*      An EXPIRED claim naming an `exec/…` branch and no PR number. It     */
/*      must not be offered as free to take.                                */
{
  const id = "T-596";
  const line =
    `${registerStamp(400)} | source-backlog-executor#20260923T0000Z | ` +
    `item ${id} claimed on branch \`exec/${id.toLowerCase()}-worktree-convention\` — ` +
    `taken from the queue; no pull request opened yet. ` +
    `files: scripts/exec/build-execution-queue.mjs`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "an expired claim naming an `exec/…` branch is in flight, not free to take",
    q.status === 0 &&
      inFlightSection(rendered).includes(id) &&
      !idleSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28b. ANY branch name, not a second allowlist.                            */
/*      Adding `exec` to the prefix list would pass 28a and leave the next  */
/*      convention change to be found the same way. The field is read, so   */
/*      a name belonging to no known prefix is still a branch.              */
{
  const id = "T-597";
  const line =
    `${registerStamp(400)} | some-other-agent#run | ` +
    `item ${id} claimed on branch \`wip/${id.toLowerCase()}-unfamiliar-prefix\` — held.`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a branch field with an unfamiliar prefix is still a branch",
    q.status === 0 &&
      inFlightSection(rendered).includes(id) &&
      !idleSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28c. THE NEGATIVE CONTROL, and it is the one that makes 28a mean         */
/*      anything. `branch none` is written by real lines in this register   */
/*      for read-only reconciliation work that cut no branch at all. If     */
/*      the field were read as "present therefore in flight", every one of  */
/*      those would be hidden from the queue forever.                       */
{
  const id = "T-598";
  const line =
    `${registerStamp(400)} | some-agent#run | item ${id} reconciliation | branch none | ` +
    `files: none | read-only, nothing cut.`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "`branch none` is not a branch, so the item stays free to take",
    q.status === 0 &&
      idleSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28b2. THE PULL-REQUEST SIGNAL IS THE OTHER HALF OF THE UNION.            */
/*       Found by mutation: deleting it left every case green, because      */
/*       every fixture that leaned on it also named a branch. A claim can   */
/*       carry a PR number and no branch at all — an agent reporting a      */
/*       merge from a branch it has already deleted — and that is still     */
/*       evidence the work exists outside the log.                          */
{
  const id = "T-605";
  const line =
    `${registerStamp(400)} | some-agent#run | item ${id} · PR #8311 opened, ` +
    "awaiting checks. No branch named here; it was deleted on merge.";
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a claim naming a PR and no branch is in flight",
    q.status === 0 &&
      inFlightSection(rendered).includes(id) &&
      !idleSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28c2. THE SAME VETO, IN THE FORM THE HELPER WRITES.                      */
/*       28c above uses the pipe-delimited `| branch none |` shape, which    */
/*       is a real register line but which the FIELD regex never matches —   */
/*       so it passes whether the veto exists or not. A mutation caught      */
/*       that: deleting the veto outright left 28c green. This case is the   */
/*       one the veto is actually load-bearing for, because                  */
/*       `append-claim.mjs --branch none` renders exactly this.              */
{
  const id = "T-602";
  const line =
    `${registerStamp(400)} | some-agent#run | item ${id} reconciliation ` +
    "on branch `none` — read-only, nothing cut.";
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a backticked `none` branch field is not a branch",
    q.status === 0 &&
      idleSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28c3. AND THE VETO SURVIVES HAND-WRITTEN PADDING.                        */
/*       Claim lines are still written by hand as well as by the helper, so  */
/*       the field's value is trimmed before it is judged. Without this the  */
/*       trim is a guard no case can fail, which is the shape this backlog   */
/*       exists against.                                                     */
{
  const id = "T-603";
  const line =
    `${registerStamp(400)} | some-agent#run | item ${id} reconciliation ` +
    "on branch ` none ` — read-only, nothing cut.";
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a padded `none` branch field is still not a branch",
    q.status === 0 &&
      idleSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28c4. AND IT IS NOT CASE-SENSITIVE.                                      */
/*       Found by mutation: dropping the `i` flag left every case above      */
/*       green, so the flag was a guard nothing could fail. Hand-written     */
/*       lines capitalise freely, and `NONE` read as a branch name would     */
/*       hide a free item from the queue for good.                           */
{
  const id = "T-604";
  const line =
    `${registerStamp(400)} | some-agent#run | item ${id} reconciliation ` +
    "on branch `NONE` — read-only, nothing cut.";
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "an upper-case `NONE` branch field is not a branch either",
    q.status === 0 &&
      idleSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28c5. THE VETO, PROVEN WHERE IT IS THE ONLY THING DECIDING.              */
/*       Mutation found that 28c2-28c4 above do NOT prove the absence veto.  */
/*       `none` carries no slash, and the shared grammar drops a name with   */
/*       no slash anyway, so deleting the veto outright left all three       */
/*       green. `n/a` is the case the veto alone decides: it has a slash, so */
/*       without the veto it reads as a branch name and the item is hidden   */
/*       from the queue for good. The three cases above stay as regression   */
/*       guards on the rendered outcome; this one is the guard on the guard. */
{
  const id = "T-606";
  const line =
    `${registerStamp(400)} | some-agent#run | item ${id} reconciliation ` +
    "on branch `n/a` — read-only, nothing cut.";
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a slash-bearing absence marker is vetoed rather than read as a branch",
    q.status === 0 &&
      idleSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28c6. AND CASE-INSENSITIVELY, for the same reason.                       */
{
  const id = "T-607";
  const line =
    `${registerStamp(400)} | some-agent#run | item ${id} reconciliation ` +
    "on branch `N/A` — read-only, nothing cut.";
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "the absence veto is case-insensitive where it is the only thing deciding",
    q.status === 0 &&
      idleSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28c7. THE FALLBACK TOKEN, AND `exec/` INSIDE IT.                         */
/*       Not every line puts the word `branch` in front of the name. On the */
/*       live register 161 lines mention an `exec/…` name and 87 of them do */
/*       so without that keyword, so the prose fallback still carries real  */
/*       weight — and `exec` was already in the shared grammar's fallback   */
/*       while the queue's own copy had never heard of it. Mutation found   */
/*       this unpinned: removing `exec` from the fallback left every other  */
/*       case green, because they all reach the declared field first.       */
{
  const id = "T-608";
  const line =
    `${registerStamp(400)} | some-agent#run | item ${id} — work is on ` +
    "exec/t-608-prose-only in my own worktree; no field, no PR yet.";
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "an `exec/…` name in prose, with no branch field, is still in flight",
    q.status === 0 &&
      inFlightSection(rendered).includes(id) &&
      !idleSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28d. THE LEGACY LINES STILL RESOLVE.                                     */
/*      The pipe-delimited form predates `append-claim.mjs` and carries no  */
/*      `on branch \`x\`` field. Replacing the allowlist rather than adding  */
/*      to it would move hundreds of historical claims into `free to take`  */
/*      — the dangerous direction, and the reason this is a union.          */
{
  const id = "T-599";
  const line =
    `- item ${id} | claude-code-executor | ${registerStamp(400)} | ` +
    `claude/${id}-legacy-shape | files: src/lib/example.ts`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a legacy pipe-delimited claim naming a `claude/…` branch is still in flight",
    q.status === 0 &&
      inFlightSection(rendered).includes(id) &&
      !idleSection(rendered).includes(id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nidle=${idleSection(rendered)}`,
  );
}

/* 28e. A RELEASE STILL RELEASES.                                           */
/*      In-flight is only consulted for an EXPIRED claim. A released line   */
/*      naming a branch must not be dragged back into the in-flight bucket  */
/*      by the wider signal — otherwise every finished item this tooling    */
/*      has ever produced would be hidden.                                  */
{
  const id = "T-601";
  const line =
    `${registerStamp(400)} | source-backlog-executor#run | ` +
    `RELEASED item ${id} on branch \`exec/${id.toLowerCase()}-done\` — merged and deployed.`;
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "a released claim naming a branch is released, not in flight",
    q.status === 0 &&
      releasedSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id),
    `exit=${q.status}\nreleased=${releasedSection(rendered)}\ninFlight=${inFlightSection(rendered)}`,
  );
}


/* ------------------------------------------------------------------------ */
/* 29.  AN ABSTENTION IS A REGISTER VERB THIS GENERATOR COULD NOT READ       */
/*      — item T-736.                                                       */
/*                                                                          */
/*      `fossil-claims.mjs` resolves a suppressed candidate to `abandoned`   */
/*      when the branch is gone from `origin` and NO pull request was ever   */
/*      opened: the claim produced nothing. It deliberately offers no        */
/*      release line for that verdict, because a release would say the work  */
/*      merged. So the verdict was correct and had no move, and the          */
/*      suppression it describes never expired.                             */
/*                                                                          */
/*      Measured on the live documents at 2026-09-23T14:58Z: the queue       */
/*      offered 0 claimable rows and named 9 suppressed candidates, of       */
/*      which the resolver answered 8 `abandoned` — every one claimed on     */
/*      2026-09-19 and suppressed for four days — and 1 `unknown`. The whole */
/*      of that zero was eight claims a repo-owned control had already       */
/*      judged dead.                                                        */
/*                                                                          */
/*      `append-claim.mjs --action abstain` writes `item <id> NOT TAKEN`,    */
/*      and this generator had ZERO matches for that string. It read the     */
/*      line as an ordinary claim, so the one verb that could free an item   */
/*      HELD it for the full three-hour TTL first.                          */
/*                                                                          */
/*      THE RULE, and it is narrower than "an abstention frees the item":    */
/*      an abstention TAKES nothing, so it is TRANSPARENT — the item still   */
/*      resolves from the newest line that actually asserts ownership. What  */
/*      it does is VETO the in-flight suppression of the expired claim it    */
/*      supersedes. A live holder is therefore untouched by a sibling's      */
/*      abstention (29d), which is the direction this register exists to     */
/*      protect, and a dead claim is cleared the instant the line lands      */
/*      (29a) rather than three hours later.                                */
/* ------------------------------------------------------------------------ */

/** The ids the queue renders on the "Claim LAPSED" line. */
function lapsedSection(rendered) {
  return rendered.match(/\*\*Claim LAPSED[^*]*\(\d+\):\*\*(.*)/)?.[1] ?? "";
}

/** Whether the queue offers this id as a claimable row. */
function isClaimable(rendered, id) {
  return rendered.includes(`| ${id} |`);
}

/* 29a. THE DEFECT. An expired in-flight claim, then an abstention. The     */
/*      item must be claimable IMMEDIATELY — the abstention is stamped NOW, */
/*      so asserting this at zero elapsed time is what distinguishes the    */
/*      repair from one that only takes effect after the TTL.               */
{
  const id = "D-508";
  const dead =
    `${registerStamp(5760)} | codex-executor#20260919T0000Z | ` +
    `item ${id} claimed on branch \`codex/source-${id.toLowerCase()}-plan\` — taken.`;
  const abstain =
    `${registerStamp(0)} | source-backlog-executor#run | item ${id} NOT TAKEN — ` +
    "the claim above is ABANDONED: its branch is gone from origin and no pull " +
    "request was ever opened. NOT taking it here; the item is UNVERIFIED.";
  const { q, rendered } = twoLineClaimFixture(id, dead, abstain);
  check(
    "an abstention over an expired in-flight claim makes the item claimable at once",
    q.status === 0 &&
      isClaimable(rendered, id) &&
      lapsedSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id) &&
      !heldSection(rendered).includes(id),
    `exit=${q.status}\nclaimable=${isClaimable(rendered, id)}\nlapsed=${lapsedSection(rendered)}\n` +
      `inFlight=${inFlightSection(rendered)}\nheld=${heldSection(rendered)}`,
  );
}

/* 29b. THE PRECEDENCE GUARD, and it is not hypothetical: the command       */
/*      `fossil-claims.mjs` emits QUOTES the dead branch name inside the    */
/*      abstention's own message, because that is the evidence for the      */
/*      verdict. Read as an ordinary claim, that line re-suppresses the     */
/*      very item it was written to free.                                   */
{
  const id = "D-509";
  const dead =
    `${registerStamp(5760)} | codex-executor#20260919T0000Z | ` +
    `item ${id} claimed on branch \`codex/source-${id.toLowerCase()}-plan\` — taken.`;
  const abstain =
    `${registerStamp(0)} | source-backlog-executor#run | item ${id} NOT TAKEN — ` +
    `the claim of ${registerStamp(5760)} is ABANDONED: ` +
    `codex/source-${id.toLowerCase()}-plan is gone from origin and NO pull request ` +
    "was ever opened from it.";
  const { q, rendered } = twoLineClaimFixture(id, dead, abstain);
  check(
    "an abstention that QUOTES the dead branch still clears the suppression",
    q.status === 0 &&
      isClaimable(rendered, id) &&
      lapsedSection(rendered).includes(id) &&
      !inFlightSection(rendered).includes(id),
    `exit=${q.status}\nclaimable=${isClaimable(rendered, id)}\nlapsed=${lapsedSection(rendered)}\n` +
      `inFlight=${inFlightSection(rendered)}`,
  );
}

/* 29c. AN ABSTENTION MUST NOT PROMOTE THE ITEM. `abandoned` is a verdict   */
/*      about the CLAIM; whether the work shipped from some other branch is */
/*      still open. This generator attributes a release by PROXIMITY to the */
/*      id, not by the head of the message field, so an abstention whose    */
/*      evidence narrates the word RELEASED near the id would land in       */
/*      "Explicitly released" — laundering undone work into a closed item,  */
/*      which is the direction this backlog keeps losing things in.         */
{
  const id = "D-510";
  const dead =
    `${registerStamp(5760)} | codex-executor#20260919T0000Z | ` +
    `item ${id} claimed on branch \`codex/source-${id.toLowerCase()}-plan\` — taken.`;
  const abstain =
    `${registerStamp(0)} | source-backlog-executor#run | item ${id} NOT TAKEN — ` +
    "nothing was RELEASED for this claim and nothing merged from it; it is ABANDONED.";
  const { q, rendered } = twoLineClaimFixture(id, dead, abstain);
  check(
    "an abstention is not a release, however its evidence is worded",
    q.status === 0 &&
      !releasedSection(rendered).includes(id) &&
      lapsedSection(rendered).includes(id),
    `exit=${q.status}\nreleased=${releasedSection(rendered)}\nlapsed=${lapsedSection(rendered)}`,
  );
}

/* 29d. THE NEGATIVE CONTROL, and the one that makes the rest safe. A LIVE  */
/*      claim by one run, then an abstention by a DIFFERENT one. If the     */
/*      abstention freed it, any sibling could evict a live holder by       */
/*      declining work it never had — the collision this register exists to */
/*      prevent, reached through the repair for the opposite defect.        */
{
  const id = "D-511";
  const live =
    `${registerStamp(4)} | codex-executor#20260923T1400Z | ` +
    `item ${id} claimed on branch \`codex/source-${id.toLowerCase()}-plan\` — working it now.`;
  const abstain =
    `${registerStamp(0)} | source-backlog-executor#run | item ${id} NOT TAKEN — ` +
    "held by another run; not taking it.";
  const { q, rendered } = twoLineClaimFixture(id, live, abstain);
  check(
    "a sibling's abstention does not evict a LIVE holder",
    q.status === 0 &&
      heldSection(rendered).includes(id) &&
      !isClaimable(rendered, id) &&
      !lapsedSection(rendered).includes(id),
    `exit=${q.status}\nheld=${heldSection(rendered)}\nclaimable=${isClaimable(rendered, id)}\n` +
      `lapsed=${lapsedSection(rendered)}`,
  );
}

/* 29e. ORDER. An abstention that PRECEDES the claim it is read against      */
/*      says nothing about it. Without this, "an abstention exists for this  */
/*      id" would free every item any run has ever declined, whatever was    */
/*      claimed afterwards.                                                  */
{
  const id = "D-512";
  const abstain =
    `${registerStamp(5800)} | source-backlog-executor#old | item ${id} NOT TAKEN — ` +
    "declined on 19 Sep; someone else may want it.";
  const dead =
    `${registerStamp(5760)} | codex-executor#20260919T0000Z | ` +
    `item ${id} claimed on branch \`codex/source-${id.toLowerCase()}-plan\` — taken afterwards.`;
  const { q, rendered } = twoLineClaimFixture(id, abstain, dead);
  check(
    "an abstention OLDER than the claim does not clear it",
    q.status === 0 &&
      inFlightSection(rendered).includes(id) &&
      !lapsedSection(rendered).includes(id) &&
      !isClaimable(rendered, id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nlapsed=${lapsedSection(rendered)}\n` +
      `claimable=${isClaimable(rendered, id)}`,
  );
}

/* 29f. AN ABSTENTION ALONE TAKES NOTHING. No prior claim at all: the item   */
/*      is simply free, and the abstaining run must not appear to hold it.   */
/*      This is the three-hour hold the item was filed against, in its       */
/*      simplest shape.                                                      */
{
  const id = "D-513";
  const line =
    `${registerStamp(0)} | source-backlog-executor#run | item ${id} NOT TAKEN — ` +
    "out of my lane; recording the decision rather than leaving it silent.";
  const { q, rendered } = oneLineClaimFixture(id, line);
  check(
    "an abstention with no prior claim holds nothing and the item stays claimable",
    q.status === 0 &&
      isClaimable(rendered, id) &&
      !heldSection(rendered).includes(id),
    `exit=${q.status}\nclaimable=${isClaimable(rendered, id)}\nheld=${heldSection(rendered)}`,
  );
}

/* 29g. THE OTHER NEGATIVE CONTROL. An expired claim naming NO branch and    */
/*      no PR is already free to take. An abstention over it must not move   */
/*      it into the lapsed bucket, because there was no suppression to       */
/*      veto — the new rule is a veto on one signal, not a relabelling of    */
/*      every line it follows.                                               */
{
  const id = "D-514";
  const dead =
    `${registerStamp(5760)} | codex-executor#20260919T0000Z | ` +
    `item ${id} reconciliation | branch none | files: none | read-only, nothing cut.`;
  const abstain =
    `${registerStamp(0)} | source-backlog-executor#run | item ${id} NOT TAKEN — ` +
    "not mine to finish.";
  const { q, rendered } = twoLineClaimFixture(id, dead, abstain);
  check(
    "an abstention over an idle expired claim leaves it idle, not lapsed",
    q.status === 0 &&
      idleSection(rendered).includes(id) &&
      !lapsedSection(rendered).includes(id) &&
      isClaimable(rendered, id),
    `exit=${q.status}\nidle=${idleSection(rendered)}\nlapsed=${lapsedSection(rendered)}\n` +
      `claimable=${isClaimable(rendered, id)}`,
  );
}

/* 29i. THE SAME-STAMP CASE, which is ordinary rather than exotic: register   */
/*      stamps are minute-precision, so two lines sharing one is common. The  */
/*      abstention is written FIRST and the claim SECOND, both at the same    */
/*      stamp. Resolving that by stamp alone would let the earlier abstention */
/*      clear a claim appended after it — so append position breaks the tie,  */
/*      the same authority this file already documents for choosing a line.   */
{
  const id = "D-516";
  const stamp = registerStamp(5760);
  const abstain =
    `${stamp} | source-backlog-executor#old | item ${id} NOT TAKEN — passing on it.`;
  const dead =
    `${stamp} | codex-executor#20260919T0000Z | ` +
    `item ${id} claimed on branch \`codex/source-${id.toLowerCase()}-plan\` — ` +
    "taken in the same minute, after that line.";
  const { q, rendered } = twoLineClaimFixture(id, abstain, dead);
  check(
    "an abstention sharing a stamp with a LATER claim does not clear it",
    q.status === 0 &&
      inFlightSection(rendered).includes(id) &&
      !lapsedSection(rendered).includes(id) &&
      !isClaimable(rendered, id),
    `exit=${q.status}\ninFlight=${inFlightSection(rendered)}\nlapsed=${lapsedSection(rendered)}\n` +
      `claimable=${isClaimable(rendered, id)}`,
  );
}

/* 29h. THE ROUND TRIP, through the REAL writer.                            */
/*                                                                          */
/*      Every case above hand-writes the abstention line. A hand-written    */
/*      fixture proves this reader against a grammar I chose; it cannot     */
/*      prove it against the grammar `append-claim.mjs` actually emits, and */
/*      a writer and a reader of one grammar that never round-trip can both */
/*      be green while the composition is broken from the first day. So the */
/*      line under test here is produced by running the sanctioned writer,  */
/*      with the flags `fossil-claims.mjs --action abstain` names, and the  */
/*      queue is regenerated over its output.                              */
{
  const id = "D-515";
  const dir = freshFixture();
  addBacklogItem(dir, id);
  mapFixtureId(dir, id);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    `\n${registerStamp(5760)} | codex-executor#20260919T0000Z | ` +
      `item ${id} claimed on branch \`codex/source-${id.toLowerCase()}-plan\` — taken.\n`,
  );
  const before = buildBoardAndQueue(dir);
  const renderedBefore = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");

  const wrote = run(dir, "append-claim.mjs", [
    "--file",
    path.join(dir, "EXECUTION_CLAIMS.md"),
    "--item",
    id,
    "--identity",
    "source-backlog-executor#roundtrip",
    "--action",
    "abstain",
    "--message",
    `the claim of ${registerStamp(5760)} is ABANDONED: codex/source-${id.toLowerCase()}-plan ` +
      "is gone from origin and NO pull request was ever opened from it. NOT TAKING it here; " +
      "the item is UNVERIFIED and must be re-verified on `main` before it is re-taken.",
  ]);
  const after = buildBoardAndQueue(dir);
  const renderedAfter = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  fs.rmSync(dir, { recursive: true, force: true });

  check(
    "the line `append-claim.mjs --action abstain` writes is read as an abstention",
    before.status === 0 &&
      wrote.status === 0 &&
      after.status === 0 &&
      !isClaimable(renderedBefore, id) &&
      inFlightSection(renderedBefore).includes(id) &&
      isClaimable(renderedAfter, id) &&
      lapsedSection(renderedAfter).includes(id),
    `before=${before.status} write=${wrote.status} after=${after.status}\n` +
      `writeErr=${wrote.stderr.trim()}\n` +
      `claimableBefore=${isClaimable(renderedBefore, id)} inFlightBefore=${inFlightSection(renderedBefore)}\n` +
      `claimableAfter=${isClaimable(renderedAfter, id)} lapsedAfter=${lapsedSection(renderedAfter)}`,
  );
}

/* ------------------------------------------------------------------------ */
/* 30.  THE REAL IDS, not a fixture — item T-736.                           */
/*                                                                          */
/*      Every case above builds its own register, which means every case    */
/*      above proves this reader against lines I wrote. The eight ids that  */
/*      caused this item are on disk in the operator root, they are four    */
/*      days old, and they are the entire reason the live queue offers      */
/*      nothing. A repair that cannot move THEM is the unfailable-gate      */
/*      shape this directory exists against, however green the fixtures.    */
/*                                                                          */
/*      No network and no verdict is asserted here: whether a given claim   */
/*      is genuinely abandoned is `fossil-claims.mjs`'s answer and needs    */
/*      git and GitHub. What is asserted is the MECHANISM, on the real      */
/*      corpus — for every id the live queue currently suppresses, an       */
/*      abstention written by the real writer removes it from the in-flight */
/*      bucket and from the candidate list, at zero elapsed time.           */
/*                                                                          */
/*      Skipped where the operator documents are absent, which is every CI  */
/*      runner. A case that silently passes when its corpus is missing is   */
/*      worse than one that says it did not run.                            */
/*                                                                          */
/*      ITEM T-739 AMENDED THE OTHER HALF OF THAT SENTENCE. Two checks here */
/*      required the bucket to be NON-EMPTY — "so this case is not          */
/*      vacuous" — and the bucket is empty once the claims in it are         */
/*      resolved, which is this case's own outcome. So it went red because  */
/*      the corpus IMPROVED, while on a runner it skipped: red where         */
/*      nothing gates it, unable to fail where it runs. The non-empty       */
/*      precondition is deleted; the mechanism is pinned by the hermetic    */
/*      abstention cases above and does not need the corpus at all. What    */
/*      remains is an opportunistic audit, and `liveCorpusPlan` decides its */
/*      three states so that `empty` cannot resolve to the vacuous pass the */
/*      middle check used to give over zero ids.                            */
/* ------------------------------------------------------------------------ */
{
  const operatorRoot = liveCorpusRoot();
  const documents = [
    "SOURCE_EXECUTION_BOARD_20260917.md",
    "EXECUTION_BACKLOG_20260918.md",
    "EXECUTION_CLAIMS.md",
    "SOURCE_BACKLOG_MASTER.md",
  ];
  const present = documents.every((f) => fs.existsSync(path.join(operatorRoot, f)));
  const absentPlan = present ? null : liveCorpusPlan({ documentsPresent: false });
  if (absentPlan) {
    skipLive("every id the live queue suppresses is freed by an abstention", absentPlan.reason);
    skipLive("and the queue offers more work than it did", absentPlan.reason);
  } else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "t736-live-"));
    copyToolchainInto(dir);
    for (const f of documents) fs.copyFileSync(path.join(operatorRoot, f), path.join(dir, f));

    /*
     * The board is run directly rather than through `buildBoardAndQueue`,
     * which throws on a non-zero board exit. The live backlog carries ids
     * that are not yet in the repo-owned structure map — 13 of them as this
     * was written, including this item — and `--json` reports that as a
     * failure AFTER writing the summary. That is a pre-existing condition of
     * the corpus, not of this repair, and it must not stop the replay. The
     * queue's own staleness guard is what keeps this honest: if the summary
     * had NOT been written, the queue below would refuse to render and these
     * assertions would fail rather than pass on stale counts.
     */
    const liveBoardAndQueue = () => {
      run(dir, "build-source-board.mjs", ["--json"]);
      return run(dir, "build-execution-queue.mjs");
    };

    const before = liveBoardAndQueue();
    const renderedBefore = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
    const plan = liveCorpusPlan({
      documentsPresent: true,
      candidateIds: before.status === 0 ? suppressedCandidateIds(renderedBefore) : [],
    });
    const candidates = plan.candidates;
    const claimableBefore = Number(
      renderedBefore.match(/\*\*(\d+) items are claimable right now/)?.[1] ?? "-1",
    );

    if (plan.skip) {
      fs.rmSync(dir, { recursive: true, force: true });
      const why =
        before.status === 0
          ? plan.reason
          : `${plan.reason} (the board/queue pair exited ${before.status} over the live copy)`;
      skipLive("every id the live queue suppresses is freed by an abstention", why);
      skipLive("and the queue offers more work than it did", why);
    } else {
    for (const id of candidates) {
      run(dir, "append-claim.mjs", [
        "--file",
        path.join(dir, "EXECUTION_CLAIMS.md"),
        "--item",
        id,
        "--identity",
        "suite#t736-real-corpus",
        "--action",
        "abstain",
        "--message",
        "replayed by the T-736 suite against a COPY of the operator register: this asserts only " +
          "that an abstention clears the suppression, never that the claim is abandoned — that " +
          "verdict is `fossil-claims.mjs`'s and needs a network this suite does not use.",
      ]);
    }

    const after = liveBoardAndQueue();
    const renderedAfter = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
    const stillSuppressed = candidates.filter((id) =>
      inFlightSection(renderedAfter).includes(id),
    );
    /*
     * LEAVING THE IN-FLIGHT BUCKET IS NOT ENOUGH, and finding that out is why
     * this case is mutation-checked rather than merely written. With the
     * abstention branch disabled — the behaviour on `main` — every id here
     * still left the in-flight bucket, because the abstention was read as a
     * FRESH CLAIM and the ids moved to `held` instead. The assertion passed
     * against the exact defect it exists to catch. So the destination is
     * asserted too: an abstention takes nothing, and an id that is held by
     * the run that declined it is the three-hour hold this item was filed
     * against.
     */
    const nowHeld = candidates.filter((id) => heldSection(renderedAfter).includes(id));
    const stillCandidates = suppressedCandidateIds(renderedAfter);
    const claimableAfter = Number(
      renderedAfter.match(/\*\*(\d+) items are claimable right now/)?.[1] ?? "-1",
    );
    fs.rmSync(dir, { recursive: true, force: true });

    check(
      "every id the live queue suppresses is freed — not in flight, and not newly held",
      after.status === 0 &&
        stillSuppressed.length === 0 &&
        stillCandidates.length === 0 &&
        nowHeld.length === 0,
      `exit=${after.status}\nstill in flight: ${stillSuppressed.join(" ")}\n` +
        `now held by the abstaining run: ${nowHeld.join(" ")}\n` +
        `still candidates: ${stillCandidates.join(" ")}`,
    );
    check(
      "and the queue offers more work than it did, which is the outcome the item asked for",
      claimableBefore >= 0 && claimableAfter > claimableBefore,
      `claimable ${claimableBefore} -> ${claimableAfter} over ${candidates.length} candidates`,
    );
    }
  }
}


/* ------------------------------------------------------------------------ *
 * Ids the board could not place are removed BEFORE the census opens         *
 * (item T-745).                                                             *
 *                                                                           *
 * The funnel T-731 built promises "N items enter the filter; each row says  *
 * what the next rule removed". It opened at the pool the queue assembles    *
 * from `stages` + `tracks`, and the board drops every id it cannot place on *
 * the structure map before that pool exists. On the live corpus at          *
 * `748d34604` that was 16 ids against a pool of 424: a true population of   *
 * 440, an intersection of zero, and not one of the 160 rendered lines       *
 * mentioning any of it.                                                     *
 *                                                                           *
 * The board does say so — on stderr, and by exiting 1. Neither reaches the  *
 * file the claim protocol tells agents to read, and the exit code carries   *
 * no information anyway: the note under T-731 records that gate as          *
 * structurally red at all times, because every newly filed item is unmapped *
 * the moment it is filed.                                                   *
 *                                                                           *
 * The truth these cases measure against is the BOARD's own summary — a      *
 * different program's output — never the queue's opinion of its own pool.   *
 * ------------------------------------------------------------------------ */

/**
 * Build the board and the queue while TOLERATING the unmapped-id gate.
 *
 * `buildBoardAndQueue` throws on a non-zero board, which is right for every
 * other case here. This one needs the state that gate describes: the board
 * exits 1 and writes the summary first, deliberately, so the queue is built
 * from a summary whose pool is already short. Refusing to reproduce that
 * would leave the defect untestable in the one corpus where it lives.
 */
function buildQueueOverUnplaceableIds(dir) {
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  if (!fs.existsSync(path.join(dir, "source-board-summary.json"))) {
    throw new Error(`fixture board wrote no summary (exit ${board.status}):\n${board.stderr}`);
  }
  return { board, queue: run(dir, "build-execution-queue.mjs") };
}

/** What the BOARD recorded: the ids it dropped, and the pool it handed on. */
function boardTruth(dir) {
  const s = JSON.parse(fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"));
  const pool = [
    ...s.stages.flatMap((st) => st.items),
    ...s.tracks.flatMap((t) => t.items),
  ].length;
  return { unmapped: s.unmapped ?? [], pool };
}

/**
 * The population the rendered funnel claims to have started from.
 *
 * Two sentence forms, because item T-746 added a stage ABOVE this one: the
 * census now opens at the ids in item position in the backlog, of which the
 * ones the board parsed are a subset. Both forms are matched here rather than
 * only the newer one, so a regression to the older sentence is a FAILURE of
 * the arithmetic assertions below rather than a -1 that every one of them
 * fails identically and uninformatively.
 */
function funnelOpeningTotal(rendered) {
  const n = rendered.match(/^(\d+) (?:items enter the filter|ids sit in item position)/m)?.[1];
  return n === undefined ? -1 : Number(n);
}

/** What the board recorded about ids it could not PARSE — item T-746. */
function boardUnparsed(dir) {
  const s = JSON.parse(fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"));
  return s.unparsedItemIds ?? [];
}

const UNPARSED_ROW = /cannot parse/i;

/** The funnel row carrying a given label, located by LABEL and never by index. */
function funnelRow(rendered, label) {
  return funnelRows(rendered).find((r) => label.test(r.label));
}

/*
 * The row is identified by its LABEL, not by its position.
 *
 * Asserting only `rows[0].removed === 0` made the clean case pass before the
 * generator rendered any such row at all: the pre-existing first row
 * ("already has proof") removes nothing in a one-item fixture, so 0 === 0 and
 * `remaining` already equalled the pool. A case that green on the exact
 * defect it exists to catch proves nothing about it, so the label is part of
 * every assertion below.
 */
const UNPLACED_ROW = /could not place/i;

{
  const dir = freshFixture();
  // Two ids the fixture map does not place. The backlog carries them, so the
  // board sees them and drops them.
  addBacklogItem(dir, "T-901");
  addBacklogItem(dir, "T-902");
  const { board, queue } = buildQueueOverUnplaceableIds(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const truth = boardTruth(dir);
  const rows = funnelRows(rendered);
  const opening = funnelOpeningTotal(rendered);

  check(
    "the queue NAMES the ids the board could not place",
    queue.status === 0 && truth.unmapped.length === 2
      && truth.unmapped.every((id) => rendered.includes(id)),
    `board exit=${board.status}\nqueue exit=${queue.status}\n` +
      `board dropped ${JSON.stringify(truth.unmapped)}\n` +
      `named in the queue: ${truth.unmapped.filter((id) => rendered.includes(id)).join(" ") || "none"}`,
  );
  /*
   * Updated for item T-746, not weakened: the unparsed row now sits ABOVE this
   * one, because an id the board never parsed cannot then be placed or not
   * placed. The expected numbers are unchanged — this drop still removes
   * exactly `unmapped` and still closes onto the pool — and the row is located
   * BY LABEL, which is what this block's own comment demanded while the
   * assertion read `rows[0]`. That index is why the update was needed at all.
   */
  const unparsed = boardUnparsed(dir);
  const unplacedRow = funnelRow(rendered, UNPLACED_ROW);
  /*
   * UPDATED for item C-515, and the reason matters because the shape of the
   * edit is the shape a weakening also has.
   *
   * Both assertions read `truth.unmapped.length` as the number of ids REMOVED
   * from the pool. That was true while the board dropped every unmapped id.
   * It now builds them onto an unplaced track, so `truth.pool` already carries
   * them and the same ids were being added twice — the opening over-counted by
   * exactly `offered`, and the drop row claimed a removal that had not
   * happened.
   *
   * What replaces it is not a looser number. `truth.unmapped.length` is a
   * constant the board hands over; `split.dropped` is an intersection with the
   * pool the board actually wrote, so these cases now distinguish an id that
   * was dropped from one that was offered, which the old form could not do at
   * all. They fail if the queue counts an offered id as removed, and they fail
   * if it stops counting a genuinely dropped one — the direction the original
   * case was written to hold, asserted below over `split.dropped` and proven
   * still reachable by the compatibility case in the C-515 block.
   */
  const split = unplacedSplit(dir);
  check(
    "the funnel OPENS at the full population the board saw, not at the pool it handed on",
    opening === truth.pool + split.dropped.length + unparsed.length
      && truth.unmapped.length > 0,
    `rendered opening=${opening}; board pool=${truth.pool} + dropped=${split.dropped.length}` +
      ` + unparsed=${unparsed.length} = ${truth.pool + split.dropped.length + unparsed.length}` +
      `\nunmapped=${JSON.stringify(truth.unmapped)} offered=${JSON.stringify(split.offered)}`,
  );
  check(
    "and the drop row, BY LABEL, removes exactly those ids and closes onto the pool",
    unplacedRow?.removed === split.dropped.length && unplacedRow?.remaining === truth.pool,
    `drop row=${JSON.stringify(unplacedRow)}; expected removed=${split.dropped.length}` +
      ` remaining=${truth.pool}\nall rows=${JSON.stringify(rows)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The clean state renders the row too. A block that appears only when the
  // count is non-zero is a branch exercised only in the failing case, which is
  // the shape the funnel's own comment was already written against.
  const dir = freshFixture();
  const { board, queue } = buildQueueOverUnplaceableIds(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const truth = boardTruth(dir);
  const zeroRow = funnelRow(rendered, UNPLACED_ROW);
  const zeroUnparsedRow = funnelRow(rendered, UNPARSED_ROW);
  check(
    "a corpus the board placed in full still renders the row, by label, at zero",
    board.status === 0 && queue.status === 0 && truth.unmapped.length === 0
      && zeroRow?.removed === 0 && zeroRow?.remaining === truth.pool
      && funnelOpeningTotal(rendered) === truth.pool,
    `board exit=${board.status}; board dropped ${truth.unmapped.length}; ` +
      `drop row=${JSON.stringify(zeroRow)}`,
  );
  check(
    "and so does the unparsed row — item T-746, a row that appears only when non-zero is a branch only the failure exercises",
    zeroUnparsedRow?.removed === 0 && zeroUnparsedRow?.remaining === truth.pool
      && boardUnparsed(dir).length === 0,
    `unparsed row=${JSON.stringify(zeroUnparsedRow)}; board unparsed=${JSON.stringify(boardUnparsed(dir))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * A MISSING FIELD IS NOT A ZERO.
   *
   * `unmapped` is written by `build-source-board.mjs`, which this item does
   * not own and another lane is editing. If that generator ever stops
   * emitting the field, rendering "0 could not be placed" would be a false
   * clean: the queue would assert a completeness nobody measured. It has to
   * say it does not know.
   */
  const dir = freshFixture();
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  if (board.status !== 0) throw new Error(`fixture board build failed:\n${board.stderr}`);
  const summaryFile = path.join(dir, "source-board-summary.json");
  const summary = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
  delete summary.unmapped;
  fs.writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`);
  const queue = run(dir, "build-execution-queue.mjs");
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const rows = funnelRows(rendered);
  check(
    "a summary carrying no `unmapped` field renders as NOT RECORDED, never as zero",
    queue.status === 0
      // The claim is on one line: the row that would have carried a count says
      // instead that nothing recorded one. A "not recorded" sentence elsewhere
      // in the file would satisfy a two-part test while the row still read 0.
      && /^\|.*could not place.*not recorded.*\|$/im.test(rendered)
      && !rows.some((r) => UNPLACED_ROW.test(r.label)),
    `queue exit=${queue.status}\n` +
      `row saying both: ${/^\|.*could not place.*not recorded.*\|$/im.test(rendered)}\n` +
      `numeric unplaced row present: ${rows.some((r) => UNPLACED_ROW.test(r.label))}\n` +
      `all rows=${JSON.stringify(rows)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * THE STAGE ABOVE THE DROP — item T-746.                                    *
 *                                                                           *
 * `unmapped` is computed from the ids the board's reader produced, so an id  *
 * in a shape that reader cannot parse is missing from the pool, from the     *
 * drop row, and from the board's own `not placed on the map: 0`. Measured on *
 * the live corpus at `aa0eecff9`: 474 ids in item position, 444 parsed, and  *
 * not one of the 30 missing named anywhere in this file — while `T-743` and  *
 * `T-744` sat open and unclaimed and three runs in a row read this file and  *
 * recorded that their lane had nothing.                                      *
 *                                                                           *
 * The truth measured against is the BOARD's summary, a different program's   *
 * output, never the queue's opinion of its own pool.                         *
 * ------------------------------------------------------------------------ */

{
  const dir = freshFixture();
  // A heading-only item. The board discovers the id in item position and
  // cannot parse it, which is exactly the residual state.
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n## Item T-903 — a heading shape the board's reader does not parse\n\nProse only.\n",
  );
  const { board, queue } = buildQueueOverUnplaceableIds(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const unparsed = boardUnparsed(dir).map(String);
  const truth = boardTruth(dir);
  const row = funnelRow(rendered, UNPARSED_ROW);
  check(
    "the queue NAMES the ids the board could not parse at all",
    queue.status === 0 && unparsed.includes("T-903")
      && unparsed.every((id) => rendered.includes(id)),
    `board exit=${board.status}; queue exit=${queue.status}\n` +
      `board could not parse ${JSON.stringify(unparsed)}\n` +
      `named in the queue: ${unparsed.filter((id) => rendered.includes(id)).join(" ") || "none"}`,
  );
  check(
    "and the funnel OPENS above them, so its arithmetic closes onto the parsed pool",
    funnelOpeningTotal(rendered) === truth.pool + truth.unmapped.length + unparsed.length
      && row?.removed === unparsed.length
      && row?.remaining === truth.pool + truth.unmapped.length,
    `opening=${funnelOpeningTotal(rendered)}; pool=${truth.pool}; ` +
      `unmapped=${truth.unmapped.length}; unparsed=${unparsed.length}\n` +
      `row=${JSON.stringify(row)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * A MISSING FIELD IS NOT A ZERO, for the newer field too.
   *
   * `unparsedItemIds` is written by `build-source-board.mjs`. If that
   * generator stops emitting it, rendering "0 unparsed" would be a false
   * clean of the exact kind this item exists to remove: a completeness claim
   * over a population nobody measured.
   */
  const dir = freshFixture();
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  if (board.status !== 0) throw new Error(`fixture board build failed:\n${board.stderr}`);
  const summaryFile = path.join(dir, "source-board-summary.json");
  const summary = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
  delete summary.unparsedItemIds;
  fs.writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`);
  const queue = run(dir, "build-execution-queue.mjs");
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    "a summary carrying no `unparsedItemIds` field renders as NOT RECORDED, never as zero",
    queue.status === 0
      && /^\|.*cannot parse.*not recorded.*\|$/im.test(rendered)
      && !funnelRows(rendered).some((r) => UNPARSED_ROW.test(r.label))
      // The opening sentence must stop claiming a known population too. A row
      // reading "not recorded" above a total that still counts as complete is
      // the same false clean one line up.
      && /population above that number is \*\*not recorded\*\*/.test(rendered),
    `queue exit=${queue.status}\n` +
      `row saying both: ${/^\|.*cannot parse.*not recorded.*\|$/im.test(rendered)}\n` +
      `numeric unparsed row present: ${funnelRows(rendered).some((r) => UNPARSED_ROW.test(r.label))}\n` +
      `opening hedged: ${/population above that number is \*\*not recorded\*\*/.test(rendered)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * The census reconciles against the board's own scan — item T-753.
 *
 * The opening number used to be DERIVED as `all.length + unplaceable +
 * unparsed`, and `all` is `stages[].items` + `tracks[].items`, so it counts a
 * PLACEMENT and not an id. `assertUniqueMappedRefs` enforces uniqueness
 * inside each list and deliberately not across them, because one item can
 * legitimately serve two stages — so a twice-placed id inflated the
 * population of a table whose entire job is to say honestly what was dropped.
 *
 * Measured on the live corpus at `d86f4c6cc`: 470 placements over 468
 * distinct ids (`D-006` in stages 1 and 2, `T-458` in the Platform integrity
 * and Cross-cutting tracks), so the census opened at 470 + 15 + 2 = 487
 * against the board's independently scanned 485.
 *
 * EVERY CASE BELOW THAT MATTERS RUNS OVER A CORPUS THAT CONTAINS A DOUBLE
 * PLACEMENT. A fixture where the derived sum and the scan agree is exactly
 * the corpus that hid this defect for as long as it hid, and a case written
 * only against one proves nothing about the number it is checking.
 */

/** Placement versus identity in the summary: rows, distinct ids, and duplicates. */
function boardPlacement(dir) {
  const s = JSON.parse(fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"));
  const rows = [
    ...s.stages.flatMap((st) => st.items),
    ...s.tracks.flatMap((t) => t.items),
  ].map((i) => String(i.num));
  const counts = new Map();
  for (const id of rows) counts.set(id, (counts.get(id) ?? 0) + 1);
  return {
    rows: rows.length,
    distinct: counts.size,
    duplicated: [...counts].filter(([, n]) => n > 1).map(([id]) => id),
    scanned: Array.isArray(s.itemPositionIds) ? s.itemPositionIds.map(String) : null,
  };
}

/*
 * The add-back row is read with its OWN matcher rather than through
 * `funnelRows`, whose `removed` column is `(\d+)` and cannot hold a signed
 * cell. That is deliberate: the row adds placements rather than removing
 * ids, so it is not a funnel stage and must not be counted as one.
 */
function duplicatePlacementRow(rendered) {
  const block = rendered.match(/## Why that number\n[\s\S]*?(?=\n## )/)?.[0] ?? "";
  const m = block.match(/^\| (.*placed in more than one.*?) \| \+(\d+) \| (\d+) \|$/im);
  return m ? { label: m[1], added: Number(m[2]), remaining: Number(m[3]) } : null;
}

const RECONCILED = /\*\*Reconciled\*\*/;
const DISAGREE = /\*\*The census and the board's own scan DISAGREE/;

{
  /*
   * The negative control. One id placed in two lists, so the derived sum and
   * the scan disagree by exactly one — the live corpus in miniature.
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-904");
  mapFixtureId(dir, "T-904");
  mapFixtureRef(dir, "T-904");
  const { board, queue } = buildQueueOverUnplaceableIds(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const p = boardPlacement(dir);
  const truth = boardTruth(dir);
  const unparsed = boardUnparsed(dir);
  const opening = funnelOpeningTotal(rendered);
  const derivedFromRows = truth.pool + truth.unmapped.length + unparsed.length;

  check(
    "T-753 — the fixture really does place one id in two lists, so the two numbers genuinely disagree",
    p.duplicated.includes("T-904") && p.rows === p.distinct + 1
      && p.scanned !== null && derivedFromRows === p.scanned.length + 1,
    `board exit=${board.status}; queue exit=${queue.status}\n` +
      `rows=${p.rows} distinct=${p.distinct} duplicated=${JSON.stringify(p.duplicated)}\n` +
      `derived-from-rows=${derivedFromRows} scanned=${p.scanned?.length}`,
  );
  check(
    "T-753 — the census OPENS at the ids the board scanned, NOT at a sum that counts a twice-placed id twice",
    queue.status === 0 && opening === p.scanned.length && opening !== derivedFromRows,
    `opening=${opening}; scanned=${p.scanned?.length}; derived-from-rows=${derivedFromRows}`,
  );
  check(
    "T-753 — and the drop rows close onto the DISTINCT placed ids, not onto the placement count",
    funnelRow(rendered, UNPARSED_ROW)?.remaining === p.scanned.length - unparsed.length
      && funnelRow(rendered, UNPLACED_ROW)?.remaining === p.distinct,
    `unparsed row=${JSON.stringify(funnelRow(rendered, UNPARSED_ROW))}\n` +
      `unplaced row=${JSON.stringify(funnelRow(rendered, UNPLACED_ROW))}\n` +
      `expected remaining: ${p.scanned.length - unparsed.length} then ${p.distinct}`,
  );
  check(
    "T-753 — the row-versus-id choice is STATED on the file's own face, with the twice-placed id named",
    duplicatePlacementRow(rendered)?.added === p.rows - p.distinct
      && duplicatePlacementRow(rendered)?.remaining === p.rows
      && rendered.includes("T-904"),
    `add-back row=${JSON.stringify(duplicatePlacementRow(rendered))}; ` +
      `expected added=${p.rows - p.distinct} remaining=${p.rows}; ` +
      `T-904 named: ${rendered.includes("T-904")}`,
  );
  check(
    "T-753 — and the census says it reconciled, because after the correction it does",
    RECONCILED.test(rendered) && !DISAGREE.test(rendered),
    `reconciled=${RECONCILED.test(rendered)} disagree=${DISAGREE.test(rendered)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * The clean direction, which the mutation record calls M2: an id that
   * STOPS being double-counted must move the number. Same fixture, one
   * placement, and every quantity above shifts by exactly one.
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-904");
  mapFixtureId(dir, "T-904");
  const { queue } = buildQueueOverUnplaceableIds(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const p = boardPlacement(dir);
  check(
    "T-753 — placed ONCE, the same id leaves no duplicate, and the add-back row still renders at zero",
    queue.status === 0 && p.duplicated.length === 0 && p.rows === p.distinct
      && duplicatePlacementRow(rendered)?.added === 0
      && duplicatePlacementRow(rendered)?.remaining === p.rows
      && funnelOpeningTotal(rendered) === p.scanned.length
      && RECONCILED.test(rendered),
    `rows=${p.rows} distinct=${p.distinct} duplicated=${JSON.stringify(p.duplicated)}\n` +
      `add-back row=${JSON.stringify(duplicatePlacementRow(rendered))}\n` +
      `opening=${funnelOpeningTotal(rendered)} scanned=${p.scanned?.length}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * The disagreement has to be visible ON THE FILE, not merely absent.
   *
   * A reconciliation that can only ever agree is the unfailable gate this
   * directory keeps paying for, so a summary whose scan genuinely omits a
   * placed id must produce the block and NAME the id on each side.
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-905");
  mapFixtureId(dir, "T-905");
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  rewriteSummary(dir, (s) => {
    s.itemPositionIds = s.itemPositionIds.filter((id) => String(id) !== "T-905");
  });
  const queue = run(dir, "build-execution-queue.mjs");
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  check(
    "T-753 — a scan that omits a placed id produces the DISAGREEMENT block and names the id",
    board.status === 0 && queue.status === 0
      && DISAGREE.test(rendered) && !RECONCILED.test(rendered)
      && /T-905/.test(rendered.match(/\*\*The census and the board's own scan DISAGREE[\s\S]*?(?=\n\| removed because)/)?.[0] ?? ""),
    `board=${board.status} queue=${queue.status}\n` +
      `disagree=${DISAGREE.test(rendered)} reconciled=${RECONCILED.test(rendered)}\n` +
      `block=${rendered.match(/\*\*The census and the board's own scan DISAGREE[\s\S]*?(?=\n\| removed because)/)?.[0] ?? "(none)"}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * TWO SETS OF THE SAME SIZE ARE NOT THE SAME SET.
   *
   * A reconciliation that compares totals alone calls this agreement, which
   * is the exact shape of unfailable gate this directory keeps paying for.
   * The scan here SWAPS one id for another it never saw, so the counts match
   * to the unit and the populations do not.
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-907");
  mapFixtureId(dir, "T-907");
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  let before = 0;
  rewriteSummary(dir, (s) => {
    before = s.itemPositionIds.length;
    s.itemPositionIds = s.itemPositionIds.map((id) => (String(id) === "T-907" ? "T-908" : id));
  });
  const queue = run(dir, "build-execution-queue.mjs");
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const block = rendered.match(/\*\*The census and the board's own scan DISAGREE[\s\S]*?(?=\n\| removed because)/)?.[0] ?? "";
  const p = boardPlacement(dir);
  check(
    "T-753 — a scan of the SAME SIZE but a different set is a disagreement, and both sides are named",
    board.status === 0 && queue.status === 0
      && p.scanned.length === before
      && DISAGREE.test(rendered) && !RECONCILED.test(rendered)
      && /T-907/.test(block) && /T-908/.test(block),
    `queue=${queue.status}; scanned=${p.scanned?.length} before=${before}\n` +
      `disagree=${DISAGREE.test(rendered)} reconciled=${RECONCILED.test(rendered)}\n` +
      `block=${block || "(none)"}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * A MISSING FIELD IS NOT A ZERO, and it is not an agreement either.
   *
   * `itemPositionIds` is written by the other generator. If it stops being
   * emitted, printing a reconciled census would assert an agreement with a
   * number nobody supplied.
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-906");
  mapFixtureId(dir, "T-906");
  mapFixtureRef(dir, "T-906");
  const board = run(dir, "build-source-board.mjs", ["--json"]);
  rewriteSummary(dir, (s) => {
    delete s.itemPositionIds;
  });
  const queue = run(dir, "build-execution-queue.mjs");
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const p = boardPlacement(dir);
  check(
    "T-753 — a summary carrying no `itemPositionIds` says it CANNOT be reconciled, and claims no agreement",
    board.status === 0 && queue.status === 0
      && /cannot be reconciled/i.test(rendered)
      && !RECONCILED.test(rendered) && !DISAGREE.test(rendered)
      // It still refuses to count the twice-placed id twice: the correction
      // does not depend on the scan, only the reconciliation does.
      && duplicatePlacementRow(rendered)?.added === p.rows - p.distinct,
    `queue=${queue.status}\n` +
      `cannot-be-reconciled=${/cannot be reconciled/i.test(rendered)} ` +
      `reconciled=${RECONCILED.test(rendered)} disagree=${DISAGREE.test(rendered)}\n` +
      `add-back row=${JSON.stringify(duplicatePlacementRow(rendered))}; expected added=${p.rows - p.distinct}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


/* ------------------------------------------------------------------------ *
 * An unplaceable id the board OFFERS is not a removal (item C-515).         *
 *                                                                           *
 * `unmapped` answers "is this id on the structure map", and the census      *
 * spent it as "was this id removed from the pool". Those were the same      *
 * question only for as long as the board dropped every unmapped id. Now it  *
 * builds them onto an unplaced track, so the same id is counted once inside *
 * `distinctPlaced` and once again in the drop row: on the live corpus the   *
 * census opened at 525 against 513 scanned, and its own reconciliation      *
 * called the disagreement rather than closing.                              *
 *                                                                           *
 * The repair is a set intersection with the pool the summary actually       *
 * carries, never an assumption about which board wrote it. That is what     *
 * makes these cases hold for BOTH generators: a summary from a board that   *
 * still drops unmapped ids has an empty intersection, and every number      *
 * below returns to what T-745 asserted.                                     *
 * ------------------------------------------------------------------------ */

/** The ids the summary reports unmapped, split by whether its pool carries them. */
function unplacedSplit(dir) {
  const s = JSON.parse(fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"));
  const pool = new Set(
    [...s.stages.flatMap((st) => st.items), ...s.tracks.flatMap((t) => t.items)]
      .map((i) => String(i.num)),
  );
  const unmapped = (s.unmapped ?? []).map(String);
  return {
    offered: unmapped.filter((id) => pool.has(id)),
    dropped: unmapped.filter((id) => !pool.has(id)),
    distinctPool: pool.size,
    unmapped,
  };
}

{
  const dir = freshFixture();
  addBacklogItem(dir, "T-903");
  addBacklogItem(dir, "T-904");
  const { board, queue } = buildQueueOverUnplaceableIds(dir);
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const split = unplacedSplit(dir);
  const row = funnelRow(rendered, UNPLACED_ROW);

  check(
    "the fixture reproduces the state under test: the board reports the ids unmapped AND carries them in its pool",
    board.status === 1 && queue.status === 0
      && split.unmapped.length === 2 && split.offered.length === 2,
    `board exit=${board.status}; queue exit=${queue.status}\nsplit=${JSON.stringify(split)}`,
  );
  check(
    "the drop row removes only the unplaceable ids the pool does NOT carry",
    row?.removed === split.dropped.length,
    `drop row=${JSON.stringify(row)}; board dropped=${JSON.stringify(split.dropped)}`
      + ` offered=${JSON.stringify(split.offered)}`,
  );
  check(
    "so the census reconciles against the board's own scan instead of double-counting them",
    RECONCILED.test(rendered) && !DISAGREE.test(rendered),
    `reconciled=${RECONCILED.test(rendered)} disagree=${DISAGREE.test(rendered)}\n`
      + `opening=${funnelOpeningTotal(rendered)} pool=${split.distinctPool}`,
  );
  check(
    "the file still NAMES them and still says the map entry is owed — offering is not absolution",
    split.offered.every((id) => rendered.includes(id))
      && /source-stage-map\.json/.test(rendered)
      && /offered|unplaced/i.test(rendered),
    `named=${split.offered.filter((id) => rendered.includes(id)).join(" ") || "none"}`,
  );
  check(
    "and it no longer tells the reader they are offered to nobody, which is now false",
    !/offered to nobody/i.test(rendered),
    `matched=${JSON.stringify(rendered.match(/.{0,120}offered to nobody.{0,120}/i)?.[0] ?? null)}`,
  );
  check(
    "an offered unplaced id is reachable in a bucket, which is the whole point of the item",
    new RegExp(`\\|\\s*T-903\\s*\\|`).test(rendered),
    `T-903 rows=${JSON.stringify(rendered.split("\n").filter((l) => l.includes("T-903")).slice(0, 4))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * The compatibility direction, and the reason the queue reads the pool
   * rather than trusting the board's version: a summary whose pool does NOT
   * carry the unmapped ids must still render exactly what T-745 asserted.
   * Built by hand from a real summary so the case does not depend on an old
   * generator being available to run.
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-905");
  buildQueueOverUnplaceableIds(dir);
  const file = path.join(dir, "source-board-summary.json");
  const s = JSON.parse(fs.readFileSync(file, "utf8"));
  s.tracks = (s.tracks ?? []).filter((t) => !(t.items ?? []).some((i) => String(i.num) === "T-905"));
  fs.writeFileSync(file, `${JSON.stringify(s, null, 2)}\n`);
  const queue = run(dir, "build-execution-queue.mjs");
  const rendered = fs.readFileSync(path.join(dir, "EXECUTION_QUEUE.md"), "utf8");
  const split = unplacedSplit(dir);
  const row = funnelRow(rendered, UNPLACED_ROW);

  check(
    "a summary that really did drop the id still reports it as a removal, and closes onto the pool",
    queue.status === 0 && split.dropped.length === 1 && split.offered.length === 0
      && row?.removed === 1 && row?.remaining === split.distinctPool,
    `queue=${queue.status}\nsplit=${JSON.stringify(split)}\nrow=${JSON.stringify(row)}`,
  );
  check(
    "and it is the dropped case that says they are offered to nobody",
    /offered to nobody/i.test(rendered) && rendered.includes("T-905"),
    `matched=${JSON.stringify(rendered.match(/.{0,80}offered to nobody.{0,80}/i)?.[0] ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed${skipped ? `, ${skipped} skipped` : ""}`);
process.exit(failures ? 1 : 0);
