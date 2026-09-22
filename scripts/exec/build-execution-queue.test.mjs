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
const NOW = new Date().toISOString().replace(/:\d{2}\.\d{3}Z$/, "Z");

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
  const rowCount = (rendered.match(new RegExp(`\\| ${id} \\|`, "g")) ?? []).length;
  check(
    "definedIn lets two real definitions of one id stay distinct",
    q.status === 0 &&
      rowCount === 2 &&
      !/not placed on the map:\s*[1-9]/.test(q.stdout + q.stderr) &&
      !rendered.includes("AMBIGUOUS"),
    `exit=${q.status}\nstdout=${q.stdout.trim()}\nstderr=${q.stderr.trim()}\nqueue=${rendered}`,
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

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
