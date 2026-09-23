#!/usr/bin/env node
/**
 * Behavioural test for the queue-provenance control (item T-720).
 *
 * The defect is not a wrong verdict. It is that between reading a queue row and
 * appending a claim for it, nothing asked which generator produced the row —
 * so the only defence was a reader noticing a prose line, and two runs in a row
 * did not. Measured on 2026-09-23: a queue written by the superseded
 * operator-root pair offered 61 claimable rows where the repo-owned pair offers
 * 1, reported no live claims while three were live, and printed a regenerate
 * block that names the generators by bare filename — which is what makes the
 * superseded copies run again.
 *
 * So the cases that matter are not the readers. They are:
 *
 *   - the writer and the reader of the stamp grammar round-trip (cases 2, 3),
 *     because a writer and a reader of one grammar that never meet is how a
 *     composition breaks while both suites stay green;
 *   - the REAL generator's output passes and a one-byte variant's does not
 *     (cases 10, 11), which is the only thing that proves the stamp is bound to
 *     the generator rather than to a string somebody typed;
 *   - the REAL claim helper refuses a claim taken from a stale queue and still
 *     records a release (cases 12-19), because an available-and-uninvoked
 *     control is worth nothing from the register's side — T-708 measured that.
 *
 * Run:  node scripts/exec/queue-provenance.test.mjs
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  ABSENT,
  GENERATOR_MISSING,
  QUEUE_FILENAME,
  REPO_OWNED,
  SUPERSEDED,
  UNSTAMPED,
  describeQueueProvenance,
  evaluateQueueProvenance,
  formatQueueProvenance,
  hashGenerator,
  isRepoOwned,
  queuePathBesideRegister,
  queueProvenanceStamp,
  readQueueProvenance,
  regenerateCommand,
} from "./queue-provenance.mjs";

import { copyToolchainInto } from "./toolchain-manifest.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GENERATOR = path.join(HERE, "build-execution-queue.mjs");
const BOARD = path.join(HERE, "build-source-board.mjs");
const HELPER = path.join(HERE, "append-claim.mjs");
const CLI = path.join(HERE, "queue-provenance.mjs");

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

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function run(script, args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error),
    };
  }
}

function digest(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/** An operator root holding a register and, optionally, a queue file. */
function operatorRoot({ queueBody } = {}) {
  const dir = tmpdir("t720-");
  const register = path.join(dir, "EXECUTION_CLAIMS.md");
  fs.writeFileSync(register, "# Claims\n\n## Claim log — append only\n\n");
  if (queueBody !== undefined) {
    fs.writeFileSync(path.join(dir, QUEUE_FILENAME), queueBody);
  }
  return { dir, register, queue: path.join(dir, QUEUE_FILENAME) };
}

/** A queue file that a repo-owned run would have written. */
function repoOwnedQueueBody() {
  return `# Execution queue — generated\n\n${formatQueueProvenance(queueProvenanceStamp(GENERATOR))}\n\n**1 items are claimable.**\n`;
}

/* ------------------------------------------------------------------------ */
/* 1. The stamp is bound to the generator's bytes, not to its name.         */
/* ------------------------------------------------------------------------ */
{
  const a = tmpdir("t720-hash-");
  const one = path.join(a, "build-execution-queue.mjs");
  const two = path.join(a, "other.mjs");
  fs.writeFileSync(one, "// generator A\n");
  fs.writeFileSync(two, "// generator B\n");

  check(
    "two generators with different bytes hash differently",
    hashGenerator(one) !== hashGenerator(two),
    `${hashGenerator(one)} vs ${hashGenerator(two)}`,
  );
  check(
    "the stamp records the hash of the file it was given",
    queueProvenanceStamp(one).sha256 === digest(one),
    `${queueProvenanceStamp(one).sha256} vs ${digest(one)}`,
  );
  fs.rmSync(a, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 2-3. Writer and reader of one grammar must meet.                        */
/* ------------------------------------------------------------------------ */
{
  const stamp = queueProvenanceStamp(GENERATOR);
  const line = formatQueueProvenance(stamp);
  const back = readQueueProvenance(`# Execution queue\n\n${line}\n\nbody\n`);

  check(
    "a formatted stamp reads back with the same hash",
    back !== null && back.sha256 === stamp.sha256,
    `wrote ${stamp.sha256}, read ${back && back.sha256}`,
  );
  check(
    "a formatted stamp reads back with the same script path",
    back !== null && back.script === stamp.script,
    `wrote ${stamp.script}, read ${back && back.script}`,
  );
  check(
    "a queue with no stamp reads as no stamp",
    readQueueProvenance("# Execution queue\n\nno provenance here\n") === null,
  );
}

/* ------------------------------------------------------------------------ */
/* 4. Prose about this control cannot satisfy its reader.                  */
/* ------------------------------------------------------------------------ */
{
  // The gate that proved a control existed by finding its name in a file is
  // the reason this directory exists. Every one of these mentions the control
  // by name, and none of them carries a hash.
  const prose = [
    "Generated by `scripts/exec/build-execution-queue.mjs` — repo-owned.",
    "<!-- queue-provenance -->",
    "<!-- queue-provenance v1 -->",
    "<!-- queue-provenance v1 sha256=not-a-hash script=/x -->",
    "<!-- queue-provenance v1 sha256=deadbeef script=/x -->",
    "queue-provenance v1 sha256=" + "a".repeat(64) + " script=/x",
  ];
  const satisfied = prose.filter((p) => readQueueProvenance(`# Q\n\n${p}\n`) !== null);
  check(
    "no prose mention of this control satisfies the stamp reader",
    satisfied.length === 0,
    `satisfied by: ${JSON.stringify(satisfied)}`,
  );
}

/* ------------------------------------------------------------------------ */
/* 5-9. Verdicts, and every unknown one failing closed.                    */
/* ------------------------------------------------------------------------ */
{
  const ok = operatorRoot({ queueBody: repoOwnedQueueBody() });
  check(
    "a queue stamped by the generator beside us is repo_owned",
    evaluateQueueProvenance({ queuePath: ok.queue, generatorPath: GENERATOR }).verdict === REPO_OWNED,
  );

  const foreign = tmpdir("t720-foreign-");
  const variant = path.join(foreign, "build-execution-queue.mjs");
  fs.writeFileSync(variant, `${fs.readFileSync(GENERATOR, "utf8")}\n// one byte of drift\n`);
  const stale = operatorRoot({
    queueBody: `# Q\n\n${formatQueueProvenance(queueProvenanceStamp(variant))}\n`,
  });
  const staleResult = evaluateQueueProvenance({ queuePath: stale.queue, generatorPath: GENERATOR });
  check(
    "a queue stamped by a different generator is superseded",
    staleResult.verdict === SUPERSEDED,
    `verdict ${staleResult.verdict}`,
  );
  check(
    "a superseded refusal quotes both hashes, so the copy that wrote it is named",
    describeQueueProvenance(staleResult).includes(staleResult.found.sha256.slice(0, 12)) &&
      describeQueueProvenance(staleResult).includes(staleResult.expected.slice(0, 12)),
    describeQueueProvenance(staleResult),
  );

  const unstamped = operatorRoot({ queueBody: "# Q\n\nno stamp\n" });
  check(
    "a queue with no stamp is unstamped, not repo_owned",
    evaluateQueueProvenance({ queuePath: unstamped.queue, generatorPath: GENERATOR }).verdict === UNSTAMPED,
  );

  const none = operatorRoot();
  check(
    "no queue file at all is absent, not repo_owned",
    evaluateQueueProvenance({ queuePath: none.queue, generatorPath: GENERATOR }).verdict === ABSENT,
  );

  check(
    "a generator we cannot find fails closed rather than passing",
    evaluateQueueProvenance({
      queuePath: ok.queue,
      generatorPath: path.join(foreign, "does-not-exist.mjs"),
    }).verdict === GENERATOR_MISSING,
  );

  // Every non-repo_owned verdict must be refused. Named as a set so a verdict
  // added later cannot default to permission by being forgotten here.
  const verdicts = [SUPERSEDED, UNSTAMPED, ABSENT, GENERATOR_MISSING];
  check(
    "isRepoOwned refuses every verdict that is not repo_owned",
    verdicts.every((verdict) => !isRepoOwned({ verdict })),
  );

  check(
    "every refusal carries the one-line regenerate command",
    [staleResult,
      evaluateQueueProvenance({ queuePath: unstamped.queue, generatorPath: GENERATOR }),
      evaluateQueueProvenance({ queuePath: none.queue, generatorPath: GENERATOR }),
    ].every((r) => describeQueueProvenance(r).includes("build-execution-queue.mjs")),
  );

  for (const d of [ok.dir, stale.dir, unstamped.dir, none.dir, foreign]) {
    fs.rmSync(d, { recursive: true, force: true });
  }
}

/* ------------------------------------------------------------------------ */
/* 10-11. The REAL generator's output passes; a drifted copy's does not.    */
/*                                                                          */
/* This is the case that makes the stamp evidence rather than decoration.    */
/* It runs the real board and the real queue over a synthetic operator root, */
/* exactly as the superseded pair was run against the live one.              */
/* ------------------------------------------------------------------------ */
{
  const fixtureDir = tmpdir("t720-e2e-");
  // A synthetic operator root, and a DRIFTED COPY of the queue generator living
  // in it — which is the live situation this item was filed against, not an
  // invented one. The real copy in the operator root differs from the repo-owned
  // generator by 651 diff lines; one line of drift is enough to make the point
  // that the stamp is bound to the generator's bytes.
  // The whole toolchain, declared once (item T-726) rather than listed here.
  // The board arrives byte-identical, so T-711's board-provenance guard is
  // satisfied and the only variable under test is the QUEUE generator's own
  // identity -- which the next statement overwrites on purpose.
  copyToolchainInto(fixtureDir);
  const supersededCopy = path.join(fixtureDir, "build-execution-queue.mjs");
  fs.writeFileSync(
    supersededCopy,
    `${fs.readFileSync(GENERATOR, "utf8")}\n// a superseded copy left in the operator root\n`,
  );
  fs.writeFileSync(
    path.join(fixtureDir, "SOURCE_EXECUTION_BOARD_20260917.md"),
    "# Board\n\n## Stage 01\n\nNothing claimed.\n",
  );
  fs.writeFileSync(
    path.join(fixtureDir, "EXECUTION_BACKLOG_20260918.md"),
    "# Execution backlog\n\n## P0\n\n| # | Item | Lane | Acceptance |\n|---|---|---|---|\n",
  );
  fs.writeFileSync(
    path.join(fixtureDir, "EXECUTION_CLAIMS.md"),
    "# Claims\n\n## Claim log — append only\n\n",
  );

  const board = run(BOARD, ["--operator-root", fixtureDir, "--map", path.join(fixtureDir, "source-stage-map.json"), "--json"], fixtureDir);
  const queue = run(GENERATOR, ["--operator-root", fixtureDir], fixtureDir);
  const producedQueue = path.join(fixtureDir, QUEUE_FILENAME);

  check(
    "the real generator pair runs over a synthetic operator root",
    board.status === 0 && queue.status === 0 && fs.existsSync(producedQueue),
    `board=${board.status} ${board.stderr.trim()}\nqueue=${queue.status} ${queue.stderr.trim()}`,
  );

  if (fs.existsSync(producedQueue)) {
    const result = evaluateQueueProvenance({ queuePath: producedQueue, generatorPath: GENERATOR });
    check(
      "a queue the real generator wrote is repo_owned",
      result.verdict === REPO_OWNED,
      `verdict ${result.verdict}; found ${JSON.stringify(result.found)}`,
    );

    // Now the live defect, reproduced end to end: run the SUPERSEDED COPY over
    // the same operator root and check the queue it writes against the
    // repo-owned generator. This is the case that had no detector.
    const stale = run(supersededCopy, ["--operator-root", fixtureDir], fixtureDir);
    const staleVerdict = evaluateQueueProvenance({ queuePath: producedQueue, generatorPath: GENERATOR });
    check(
      "a queue written by a superseded copy in the operator root is superseded",
      stale.status === 0 && staleVerdict.verdict === SUPERSEDED,
      `copy exit=${stale.status} ${stale.stderr.trim()}\nverdict ${staleVerdict.verdict}`,
    );
    check(
      "the superseded queue names the copy that wrote it, not only a mismatch",
      staleVerdict.found !== null &&
        fs.realpathSync(staleVerdict.found.script) === fs.realpathSync(supersededCopy),
      JSON.stringify(staleVerdict.found),
    );

    const cliBad = run(CLI, ["--queue", producedQueue, "--generator", GENERATOR], fixtureDir);
    // Put the repo-owned queue back, so the CLI's pass case is measured on the
    // same file rather than on a second fixture.
    run(GENERATOR, ["--operator-root", fixtureDir], fixtureDir);
    const cliOk = run(CLI, ["--queue", producedQueue, "--generator", GENERATOR], fixtureDir);
    check(
      "the CLI exits 1 on a superseded queue and 0 once it is regenerated",
      cliBad.status === 1 && cliOk.status === 0,
      `bad=${cliBad.status} ok=${cliOk.status}\n${cliBad.stderr}`,
    );
  }

  fs.rmSync(fixtureDir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 12-19. The wiring. An available control and a wired one look identical   */
/* from outside the register, which is the whole of T-708.                  */
/* ------------------------------------------------------------------------ */
function claimArgs(register, extra = []) {
  return [
    "--file", register,
    "--item", "T-999",
    "--identity", "suite#t720",
    "--branch", "exec/t-720-suite",
    "--message", "taking a row from the queue beside this register",
    "--now", "2026-09-23T06:30:00Z",
    ...extra,
  ];
}

{
  // 12. The red case: a claim taken from an unstamped queue.
  const stale = operatorRoot({ queueBody: "# Q\n\nno stamp\n" });
  const before = digest(stale.register);
  const refused = run(HELPER, claimArgs(stale.register), stale.dir);
  check(
    "a claim beside an UNSTAMPED queue is refused",
    refused.status === 1,
    `exit ${refused.status}\n${refused.stderr}`,
  );
  check(
    "the refused claim appended nothing",
    digest(stale.register) === before,
  );
  check(
    "the refusal names the regenerate command rather than only the problem",
    refused.stderr.includes("build-execution-queue.mjs"),
    refused.stderr,
  );

  // 13. A queue stamped by a drifted generator.
  const foreign = tmpdir("t720-drift-");
  const variant = path.join(foreign, "build-execution-queue.mjs");
  fs.writeFileSync(variant, `${fs.readFileSync(GENERATOR, "utf8")}\n// drift\n`);
  const superseded = operatorRoot({
    queueBody: `# Q\n\n${formatQueueProvenance(queueProvenanceStamp(variant))}\n`,
  });
  const supersededRun = run(HELPER, claimArgs(superseded.register), superseded.dir);
  check(
    "a claim beside a SUPERSEDED queue is refused",
    supersededRun.status === 1,
    `exit ${supersededRun.status}\n${supersededRun.stderr}`,
  );

  // 14. The green case, so the refusal is not simply "refuse everything".
  const current = operatorRoot({ queueBody: repoOwnedQueueBody() });
  const allowed = run(HELPER, claimArgs(current.register, ["--dry-run"]), current.dir);
  check(
    "a claim beside a REPO-OWNED queue is allowed",
    allowed.status === 0,
    `exit ${allowed.status}\n${allowed.stderr}`,
  );

  // 15. No queue at all.
  const none = operatorRoot();
  const noneRun = run(HELPER, claimArgs(none.register), none.dir);
  check(
    "a claim with no queue file beside the register is refused",
    noneRun.status === 1,
    `exit ${noneRun.status}\n${noneRun.stderr}`,
  );

  // 16-17. A release and an abstention TAKE nothing, and the moment a queue is
  // stale is exactly when a holder most needs to hand work back. Gating those
  // would strand a live claim behind a regeneration, so only `claim` is gated.
  const release = operatorRoot({ queueBody: "# Q\n\nno stamp\n" });
  const releaseRun = run(HELPER, [
    "--file", release.register,
    "--item", "T-999",
    "--identity", "suite#t720",
    "--action", "release",
    "--message", "RELEASED item T-999 — merged, all files free",
    "--now", "2026-09-23T06:30:00Z",
    "--dry-run",
  ], release.dir);
  check(
    "a RELEASE beside a stale queue is still recorded",
    releaseRun.status === 0,
    `exit ${releaseRun.status}\n${releaseRun.stderr}`,
  );

  const abstainRun = run(HELPER, [
    "--file", release.register,
    "--item", "T-999",
    "--identity", "suite#t720",
    "--action", "abstain",
    "--message", "NOT TAKEN — T-999 sits in an open PR",
    "--now", "2026-09-23T06:30:00Z",
    "--dry-run",
  ], release.dir);
  check(
    "an ABSTENTION beside a stale queue is still recorded",
    abstainRun.status === 0,
    `exit ${abstainRun.status}\n${abstainRun.stderr}`,
  );

  // 18. An explicit --queue overrides the path derived from the register, so a
  // run whose queue lives elsewhere is not forced to move it.
  const split = operatorRoot({ queueBody: "# Q\n\nno stamp\n" });
  const elsewhere = tmpdir("t720-elsewhere-");
  const goodQueue = path.join(elsewhere, QUEUE_FILENAME);
  fs.writeFileSync(goodQueue, repoOwnedQueueBody());
  const overridden = run(HELPER, claimArgs(split.register, ["--queue", goodQueue, "--dry-run"]), split.dir);
  check(
    "an explicit --queue is checked instead of the one beside the register",
    overridden.status === 0,
    `exit ${overridden.status}\n${overridden.stderr}`,
  );

  // 19. The derived path is the one an agent actually reads: the queue sitting
  // beside the register it appends to.
  check(
    "the derived queue path is the register's own directory",
    queuePathBesideRegister("/x/y/EXECUTION_CLAIMS.md") === path.join("/x/y", QUEUE_FILENAME),
    queuePathBesideRegister("/x/y/EXECUTION_CLAIMS.md"),
  );

  check(
    "the regenerate command names the operator root it applies to",
    regenerateCommand("/x/y").includes("/x/y"),
    regenerateCommand("/x/y"),
  );

  for (const d of [stale.dir, superseded.dir, current.dir, none.dir, release.dir, split.dir, foreign, elsewhere]) {
    fs.rmSync(d, { recursive: true, force: true });
  }
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
