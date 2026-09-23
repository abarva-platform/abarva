#!/usr/bin/env node
/**
 * Behavioural test for the claim-append gate wiring (item T-708).
 *
 * T-706 shipped `--preclaim`: an ownership check that answers take /
 * already-yours / held-by-a-sibling / held-by-another and exits non-zero on
 * the last two. It was proven on the real register and it is correct. Nothing
 * runs it. The claim step stayed an agent choosing to invoke a control, which
 * is the same shape as the gate this whole backlog exists against — the one
 * that proved a control existed by finding its name in a file.
 *
 * So the acceptance for T-708 is deliberately NOT "the gate returns the right
 * verdict". T-706 already proved that, and re-proving it is exactly the
 * substitution that lets an unwired control look wired. The only assertion
 * that counts is the one below:
 *
 *   a claim the gate refuses is NOT APPENDED — the register is byte-identical
 *   afterwards, compared by digest and not by reading the tail.
 *
 * Every case runs the helper as a real child process over a FIXTURE register
 * in a temp directory. No case reads an operator file: a control whose truth
 * comes from its own subject cannot fail (T-460, T-467).
 *
 * Run:  node scripts/exec/append-claim.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  QUEUE_FILENAME,
  formatQueueProvenance,
  queueProvenanceStamp,
} from "./queue-provenance.mjs";
import { FLAG_SPEC, USAGE, advertisedFlags } from "./append-claim.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HELPER = path.join(HERE, "append-claim.mjs");
const GATE = path.join(HERE, "register-time-authority.mjs");
const QUEUE_GENERATOR = path.join(HERE, "build-execution-queue.mjs");

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

function fixture(lines) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "append-claim-"));
  const file = path.join(dir, "EXECUTION_CLAIMS.md");
  fs.writeFileSync(file, `# Claims\n\n## Claim log — append only\n\n${lines.join("\n")}\n`);
  // A claim asserts its item is a row of the generated queue, so since item
  // T-720 the helper refuses one unless the queue beside the register was
  // written by the repo-owned generator. An operator root without a current
  // queue is a real refusal, covered by queue-provenance.test.mjs; every case
  // in THIS file is about the register, so each fixture carries a current one.
  fs.writeFileSync(
    path.join(dir, QUEUE_FILENAME),
    `# Execution queue — generated\n\n${formatQueueProvenance(queueProvenanceStamp(QUEUE_GENERATOR))}\n`,
  );
  return { dir, file };
}

/** Digest, not a tail read. A byte appended anywhere changes this. */
function digest(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function run(args) {
  try {
    const stdout = execFileSync(process.execPath, [HELPER, ...args], {
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

/** Ask the gate directly — used only to prove a written line reads back. */
function preclaim(file, item, identity, now) {
  try {
    const stdout = execFileSync(
      process.execPath,
      [GATE, "--preclaim", "--file", file, "--item", item, "--identity", identity, "--now", now, "--json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { status: 0, report: JSON.parse(stdout) };
  } catch (error) {
    let report = {};
    try {
      report = JSON.parse(error.stdout ?? "{}");
    } catch {
      /* a crash has no report; the status below carries the verdict */
    }
    return { status: error.status ?? 1, report };
  }
}

/** The file half of the same gate — used to prove a release frees its files. */
function preclaimFiles(file, item, identity, now, files) {
  try {
    const stdout = execFileSync(
      process.execPath,
      [GATE, "--preclaim", "--file", file, "--item", item, "--identity", identity,
        "--now", now, "--files", files, "--json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { status: 0, report: JSON.parse(stdout) };
  } catch (error) {
    let report = {};
    try {
      report = JSON.parse(error.stdout ?? "{}");
    } catch {
      /* a crash has no report; the status below carries the verdict */
    }
    return { status: error.status ?? 1, report };
  }
}

const NOW = "2026-09-22T18:00:00Z";
const ME = "source-backlog-executor#20260922T175543Z";
const SIBLING = "source-backlog-executor#20260922T045559Z";
const OTHER = "claude-code-cc-a#20260922T1830Z";
const MSG = "taking it to prove the wiring, not the verdict";

const base = (args = []) => ["--file", args.file, "--item", args.item, "--identity", args.identity,
  "--message", args.message ?? MSG, ...(args.extra ?? [])];

// ---------------------------------------------------------------------------
// Case 1 — THE ACCEPTANCE. A refused claim must not reach the file.
//
// This is the case the item names, and it is the only one that distinguishes a
// wired control from an available one. The gate already refuses; what was
// never true until now is that the refusal STOPS the write.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    `2026-09-22T17:40:00Z | ${OTHER} | item T-800 claimed — branch \`x\``,
  ]);
  const before = digest(file);
  const r = run([...base({ file, item: "T-800", identity: ME }), "--now", NOW]);
  check(
    "a claim the gate refuses exits non-zero",
    r.status === 1,
    `status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
  );
  check(
    "a claim the gate refuses is NOT APPENDED — register byte-identical",
    digest(file) === before,
    `before=${before} after=${digest(file)}\ntail=${fs.readFileSync(file, "utf8").slice(-300)}`,
  );
  check(
    "the refusal names the holder so the operator can act on it",
    /held-by-another/.test(r.stdout + r.stderr) && new RegExp(OTHER.replace(/[#]/g, "#")).test(r.stdout + r.stderr),
    `stdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 2 — a sibling run of the same scheduled task is a different owner
// (T-594). The gate refuses it; the write must stop for the same reason.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    `2026-09-22T17:40:00Z | ${SIBLING} | item T-800 claimed — branch \`x\``,
  ]);
  const before = digest(file);
  const r = run([...base({ file, item: "T-800", identity: ME }), "--now", NOW]);
  check(
    "a sibling's live claim refuses the append",
    r.status === 1 && digest(file) === before,
    `status=${r.status} changed=${digest(file) !== before}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 3 — the permitted path still works, and appends exactly one record.
// A gate that refuses everything is not a gate either.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    `2026-09-22T17:40:00Z | ${OTHER} | item T-801 claimed — branch \`x\``,
  ]);
  const beforeText = fs.readFileSync(file, "utf8");
  const r = run([...base({ file, item: "T-800", identity: ME, extra: ["--branch", "exec/t-800"] })]);
  const afterText = fs.readFileSync(file, "utf8");
  check("an unheld item is appended and exits 0", r.status === 0, `status=${r.status} stderr=${r.stderr}`);
  check(
    "the existing register is preserved byte-for-byte — append only, never rewrite",
    afterText.startsWith(beforeText.replace(/\n+$/, "")),
    "the helper altered text above its own line",
  );
  const added = afterText.slice(beforeText.length).split("\n").filter((l) => l.trim());
  check("exactly one record is added", added.length === 1, `added ${added.length}: ${JSON.stringify(added)}`);
  check(
    "the record names the item, the identity and the branch",
    added[0]?.includes("item T-800") && added[0]?.includes(ME) && added[0]?.includes("exec/t-800"),
    added[0],
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 4 — round trip. The line the helper writes must be a line the register's
// own reader attributes back, or the helper has written prose that looks like a
// claim and holds nothing. Proven by asking the gate, not by matching a regex
// the helper and the test both agree on.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  run([...base({ file, item: "T-800", identity: ME, extra: ["--branch", "exec/t-800"] })]);
  const later = new Date(Date.now() + 60_000).toISOString().replace(/\.\d+Z$/, "Z");
  const mine = preclaim(file, "T-800", ME, later);
  check(
    "the written line reads back to its own author as already-yours",
    mine.report.verdict === "already-yours",
    `verdict=${mine.report.verdict}`,
  );
  const sib = preclaim(file, "T-800", SIBLING, later);
  check(
    "the written line holds the item against a sibling run",
    sib.status !== 0 && sib.report.verdict === "held-by-a-sibling",
    `status=${sib.status} verdict=${sib.report.verdict}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 5 — FAIL CLOSED when the gate cannot run at all. A helper that appends
// because its check errored is an unwired control that reports itself wired,
// which is the precise failure T-708 is open against.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  const before = digest(file);
  const absent = path.join(dir, "no-such-gate.mjs");
  const r = run([...base({ file, item: "T-800", identity: ME }), "--gate", absent]);
  check(
    "a gate that cannot be executed refuses the claim rather than waving it through",
    r.status !== 0 && digest(file) === before,
    `status=${r.status} changed=${digest(file) !== before} stderr=${r.stderr}`,
  );
  // A gate that is ABSENT and a gate that is PRESENT BUT WRONG are different
  // operator problems, and both refuse. Asserting only that "something
  // refused" cannot tell them apart -- a mutation deleting the path check
  // survived this case until the two were separated, because the second guard
  // caught it and reported a version problem for what was a path problem.
  check(
    "the refusal names the path it looked for, so a missing gate is not read as a stale one",
    r.stderr.includes(absent) && !/advertise --preclaim/.test(r.stderr),
    `stderr=${r.stderr}`,
  );
  const impostor = path.join(dir, "not-the-gate.mjs");
  fs.writeFileSync(impostor, "process.exit(2);\n");
  const wrong = run([...base({ file, item: "T-800", identity: ME }), "--gate", impostor]);
  check(
    "a gate that exists but advertises no --preclaim is refused as untrustworthy",
    wrong.status !== 0 && digest(file) === before && /advertise --preclaim/.test(wrong.stderr),
    `status=${wrong.status} changed=${digest(file) !== before} stderr=${wrong.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 6 — a usage error in the gate (an identity carrying no run id) is not a
// permission to write. Exit 2 is the gate's "I could not decide"; deciding for
// it is how the base-name-is-an-identity defect returns.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  const before = digest(file);
  const r = run([...base({ file, item: "T-800", identity: "source-backlog-executor" })]);
  check(
    "an identity with no run id is refused and nothing is written",
    r.status === 2 && digest(file) === before,
    `status=${r.status} changed=${digest(file) !== before} stderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 7 — an accidentally empty argument must be a usage error, not a clean
// result. T-707 found the same substitution one level down: `--files ""`
// printed "0 requested, 0 contended" and exited 0.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  const before = digest(file);
  const empty = run(["--file", file, "--item", "T-800", "--identity", ME, "--message", "   "]);
  check(
    "an empty message is a usage error, not an empty claim line",
    empty.status === 2 && digest(file) === before,
    `status=${empty.status} changed=${digest(file) !== before}`,
  );
  const missing = run(["--file", file, "--item", "T-800", "--identity", ME]);
  check(
    "a missing message is a usage error",
    missing.status === 2 && digest(file) === before,
    `status=${missing.status}`,
  );
  // The same rule for the other list-shaped argument, and it is not symmetry
  // for its own sake: an empty --files is a request for a file check that
  // checks nothing, which reads back as "no contention" in the record.
  //
  // The gate this stub stands in for is one that ADVERTISES --files. Run
  // against the installed gate instead, this case passes without ever
  // reaching the emptiness check -- the flag is refused as unadvertised and
  // the assertion is satisfied by the wrong branch. That version survived the
  // mutation that deleted the check it was written for.
  const filesGate = path.join(dir, "gate-advertising-files.mjs");
  fs.writeFileSync(
    filesGate,
    "if (!process.argv.includes('--file')) { console.error('usage: --preclaim --file <f> --item <i> --identity <x> [--files a,b] [--json]'); process.exit(2); }\n" +
      "console.log(JSON.stringify({ verdict: 'take', reason: 'stub' }));\nprocess.exit(0);\n",
  );
  const emptyFiles = run([
    ...base({ file, item: "T-800", identity: ME }),
    "--files",
    "  ",
    "--gate",
    filesGate,
  ]);
  check(
    "an empty --files is a usage error rather than a file check over nothing",
    emptyFiles.status === 2 && digest(file) === before,
    `status=${emptyFiles.status} changed=${digest(file) !== before} stderr=${emptyFiles.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 8 — --dry-run shows the line and writes nothing, so an operator can see
// what would land without the file being the way they find out.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  const before = digest(file);
  const r = run([...base({ file, item: "T-800", identity: ME }), "--dry-run"]);
  check(
    "--dry-run prints the record and appends nothing",
    r.status === 0 && /item T-800/.test(r.stdout) && digest(file) === before,
    `status=${r.status} changed=${digest(file) !== before} stdout=${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 9 — T-457. The stamp is read at the instant of writing. A value read
// earlier in the run is an estimate by the time it lands, and a constant is
// not a time at all.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  const lower = Date.now() - 1000;
  run([...base({ file, item: "T-800", identity: ME })]);
  const upper = Date.now() + 1000;
  const line = fs.readFileSync(file, "utf8").trim().split("\n").pop();
  const stamp = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/.exec(line ?? "")?.[1];
  const ms = stamp ? Date.parse(stamp) : NaN;
  check(
    "the stamp is a real read taken at the instant of writing, not a constant",
    Number.isFinite(ms) && ms >= lower && ms <= upper,
    `stamp=${stamp} window=${new Date(lower).toISOString()}..${new Date(upper).toISOString()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 10 — a flag the installed gate does not understand must stop the claim.
// `--files` is T-707's file-overlap half; on a gate that predates it the flag
// parses to nothing and is silently ignored, so a caller who asked for a file
// check and got none would read a clean exit as a clean answer. Whichever gate
// is installed, asking for a check that will not run is refused here.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  const before = digest(file);
  const r = run([...base({ file, item: "T-800", identity: ME }), "--gate-arg", "--not-a-real-flag"]);
  check(
    "a gate argument the installed gate does not advertise refuses the claim",
    r.status === 2 && digest(file) === before,
    `status=${r.status} changed=${digest(file) !== before} stderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 11 — the advisory verdict. 81 of the real register's 99 identities carry
// no run id, so `unresolved-legacy` fails open by design (T-706). The helper
// must inherit that decision from the gate's exit code rather than re-deciding
// it, and must say out loud that it did.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-22T17:40:00Z | codex-cpo-source-new-smoke | item T-800 claimed — branch `x`",
  ]);
  const r = run([...base({ file, item: "T-800", identity: ME }), "--now", NOW]);
  check(
    "an unresolvable legacy holder appends with the advisory surfaced, matching the gate",
    r.status === 0 && /unresolved-legacy/.test(r.stdout),
    `status=${r.status} stdout=${r.stdout}`,
  );
  const { dir: d2, file: f2 } = fixture([
    "2026-09-22T17:40:00Z | codex-cpo-source-new-smoke | item T-800 claimed — branch `x`",
  ]);
  const before2 = digest(f2);
  const strict = run([...base({ file: f2, item: "T-800", identity: ME }), "--now", NOW, "--strict"]);
  check(
    "--strict turns that advisory into a refusal and the claim is not written",
    strict.status === 1 && digest(f2) === before2,
    `status=${strict.status} changed=${digest(f2) !== before2}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(d2, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 12 — an exit status this wiring does not interpret is not permission.
// The gate is under active development in two lanes; a code it grows tomorrow
// that this caller has never seen must stop the claim, not sail past the two
// codes that are handled. Proven with a stub that advertises --preclaim and
// then exits 7, because only a real unknown code exercises the branch.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  const before = digest(file);
  const stub = path.join(dir, "future-gate.mjs");
  fs.writeFileSync(
    stub,
    "if (!process.argv.includes('--file')) { console.error('usage: --preclaim --file <f> --item <i> --identity <x> [--json]'); process.exit(2); }\nprocess.exit(7);\n",
  );
  const r = run([...base({ file, item: "T-800", identity: ME }), "--gate", stub]);
  check(
    "a gate exit this wiring does not understand refuses the claim",
    r.status !== 0 && r.status !== 7 && digest(file) === before,
    `status=${r.status} changed=${digest(file) !== before} stderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 13 — --files is T-707's file-overlap half, and on a gate that predates
// it the flag parses to nothing. A caller who asked for a file check, got none
// and read exit 0 as "no contention" is the substitution this item is about,
// one level down. Asking for a check that will not run is refused.
//
// This case has to keep working in BOTH directions: once a gate advertising
// --files is installed, the same request must be forwarded and honoured
// instead. Both are asserted, so the case does not quietly become vacuous the
// day the other half lands.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([`2026-09-22T17:00:00Z | ${OTHER} | item T-900 claimed`]);
  const before = digest(file);
  const without = path.join(dir, "gate-without-files.mjs");
  fs.writeFileSync(
    without,
    "if (!process.argv.includes('--file')) { console.error('usage: --preclaim --file <f> --item <i> --identity <x> [--json]'); process.exit(2); }\n" +
      "console.log(JSON.stringify({ verdict: 'take', reason: 'stub' }));\nprocess.exit(0);\n",
  );
  const r = run([...base({ file, item: "T-800", identity: ME }), "--files", "scripts/exec/a.mjs", "--gate", without]);
  check(
    "--files against a gate that cannot check files refuses rather than passing silently",
    r.status === 2 && digest(file) === before && /--files/.test(r.stderr),
    `status=${r.status} changed=${digest(file) !== before} stderr=${r.stderr}`,
  );

  const withFiles = path.join(dir, "gate-with-files.mjs");
  fs.writeFileSync(
    withFiles,
    "if (!process.argv.includes('--file')) { console.error('usage: --preclaim --file <f> --item <i> --identity <x> [--files a,b] [--json]'); process.exit(2); }\n" +
      "const i = process.argv.indexOf('--files');\n" +
      "if (i < 0) { console.error('the caller dropped --files'); process.exit(9); }\n" +
      "console.log(JSON.stringify({ verdict: 'take', reason: `files checked: ${process.argv[i + 1]}` }));\n" +
      "process.exit(0);\n",
  );
  const ok = run([...base({ file, item: "T-801", identity: ME }), "--files", "scripts/exec/a.mjs", "--gate", withFiles]);
  check(
    "--files IS forwarded to a gate that advertises it, and the claim lands",
    ok.status === 0 && digest(file) !== before,
    `status=${ok.status} stdout=${ok.stdout} stderr=${ok.stderr}`,
  );
  check(
    "the appended record carries the file list it was checked against",
    /files: scripts\/exec\/a\.mjs/.test(fs.readFileSync(file, "utf8")),
    fs.readFileSync(file, "utf8").slice(-300),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


// ---------------------------------------------------------------------------
// Case 10 (item T-712) — THE HELPER MUST NOT ASSERT A VERB THE MESSAGE DENIES.
//
// Found by execution on the live register, not by reading this file. At
// 23:08:45Z a run handed back item T-708 with the words `RELEASED item T-708 —
// merged, DEPLOYED ... all files free`, and fourteen minutes later the file
// gate still printed that very line as the holder of the files it had just
// released. The reason is in `buildClaimLine`: every record this helper writes
// opens `item <id> claimed`, whatever the operator's message says, and the
// register's release grammar is read from the ANNOUNCEMENT VERB AT THE HEAD OF
// THE MESSAGE FIELD — `announcesRelease` and `announcesAbstention` both.
//
// So the sanctioned claim path emits lines its own reader cannot release, and
// the more the helper is adopted the more files stay locked for three hours
// after they were handed back. That is not a wording problem: the tool is
// hard-coding the one word the ownership grammar turns on, which is the
// "satisfy a control with a string literal" shape this backlog exists against.
//
// The assertion is deliberately end-to-end over a fixture register: claim,
// release, then ask the REAL gate whether the next run may take it. Asserting
// on the emitted string alone would pass a helper that writes a verb no reader
// accepts.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([]);
  const HELD = "scripts/exec/append-claim.mjs";
  // Reads are pinned to a clock taken AFTER each write, never to a fixed past
  // instant: the helper stamps from the real clock at the moment it appends
  // (T-457), and a `--now` before that stamp drops the line from the window,
  // which turns every assertion below into a vacuous pass.

  const claimed = run([
    ...base({ file, item: "T-801", identity: ME, message: "taking it" }),
    "--branch", "exec/t-801", "--files", HELD,
  ]);
  const T1 = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  check(
    "setup: the claim is appended",
    claimed.status === 0,
    `status=${claimed.status} stderr=${claimed.stderr}`,
  );

  // A claim, before any release, must hold. Without this the release case
  // below could pass against a gate that never holds anything.
  const heldNow = preclaim(file, "T-801", OTHER, T1);
  check(
    "negative control — an ordinary claim still HOLDS the item against another run",
    heldNow.status === 1 && heldNow.report.verdict === "held-by-another",
    `status=${heldNow.status} report=${JSON.stringify(heldNow.report)}`,
  );
  const heldFiles = preclaimFiles(file, "T-802", OTHER, T1, HELD);
  check(
    "negative control — an ordinary claim still HOLDS its files against another run",
    heldFiles.report.fileOverlap?.conflicts?.length === 1,
    JSON.stringify(heldFiles.report),
  );

  const released = run([
    ...base({ file, item: "T-801", identity: ME, message: "merged and deployed; all files free" }),
    "--action", "release", "--branch", "exec/t-801",
  ]);
  const T2 = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  check(
    "a release is appended through the same gate",
    released.status === 0,
    `status=${released.status} stdout=${released.stdout} stderr=${released.stderr}`,
  );
  check(
    "the released record opens with the announcement verb the register's reader parses",
    /\|\s*RELEASED item T-801\b/.test(fs.readFileSync(file, "utf8")),
    fs.readFileSync(file, "utf8").slice(-400),
  );

  const after = preclaim(file, "T-801", OTHER, T2);
  check(
    "THE ACCEPTANCE — after a release written by this helper, the next run may TAKE the item",
    after.status === 0 && after.report.verdict === "take",
    `status=${after.status} report=${JSON.stringify(after.report)}`,
  );
  const afterFiles = preclaimFiles(file, "T-802", OTHER, T2, HELD);
  check(
    "THE ACCEPTANCE — after that release the files it held are FREE, not held for three more hours",
    afterFiles.report.fileOverlap?.conflicts?.length === 0,
    JSON.stringify(afterFiles.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 11 (item T-712) — an abstention written by the helper holds nothing.
//
// Same defect, the other verb. `announcesAbstention` was added by T-707 for
// exactly the register line shape `item T-706 NOT TAKEN — already in open PR
// #8280 ... (files named six hundred characters later to say who ELSE is on
// them)`. A run that records that decision through this helper instead gets
// `item T-706 claimed — item T-706 NOT TAKEN ...`, and the files it named to
// disclaim them are read as held.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([]);
  const OTHERS_FILE = "scripts/exec/register-time-authority.mjs";

  const abstained = run([
    ...base({
      file, item: "T-803", identity: ME,
      message: `already in open PR #8280, which touches ${OTHERS_FILE}; leaving it`,
    }),
    "--action", "abstain",
  ]);
  const T0 = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  check(
    "an abstention is appended through the same gate",
    abstained.status === 0,
    `status=${abstained.status} stdout=${abstained.stdout} stderr=${abstained.stderr}`,
  );
  check(
    "the abstention record opens with the announcement form the register's reader parses",
    /\|\s*item T-803 NOT TAKEN\b/.test(fs.readFileSync(file, "utf8")),
    fs.readFileSync(file, "utf8").slice(-400),
  );
  const itemFree = preclaim(file, "T-803", OTHER, T0);
  check(
    "an abstention does not hold the item it declined",
    itemFree.status === 0 && itemFree.report.verdict === "take",
    `status=${itemFree.status} report=${JSON.stringify(itemFree.report)}`,
  );
  const filesFree = preclaimFiles(file, "T-804", OTHER, T0, OTHERS_FILE);
  check(
    "an abstention does not hold the files it named to say who else is on them",
    filesFree.report.fileOverlap?.conflicts?.length === 0,
    JSON.stringify(filesFree.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 12 (item T-712) — the guard, so the defect cannot be re-entered by hand.
//
// An operator who writes a release into `--message` and forgets `--action`
// would reproduce line 1948 exactly. The helper refuses rather than writing a
// record whose head word contradicts its own body, and says which flag to use.
// A refusal writes nothing: asserted by digest, as case 1 does.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([]);
  const before = digest(file);
  const r = run([
    ...base({
      file, item: "T-805", identity: ME,
      message: "RELEASED item T-805 — merged, DEPLOYED, all files free",
    }),
    "--now", "2026-09-22T17:30:00Z",
  ]);
  check(
    "a release message written as a claim is REFUSED as a usage error",
    r.status === 2,
    `status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
  );
  check(
    "the refusal names the flag that fixes it",
    /--action\s+release/.test(`${r.stdout}${r.stderr}`),
    `${r.stdout}${r.stderr}`,
  );
  check(
    "and nothing was appended — register byte-identical",
    digest(file) === before,
    fs.readFileSync(file, "utf8").slice(-300),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 12b (item T-712) — the same guard, for the other verb.
//
// Added because mutation testing said so: deleting the abstention half of the
// mismatch guard left the suite at 47/0, so the guard was asserted by nothing.
// The release half was covered and the abstention half was not, which is the
// shape where a control quietly stops being one.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([]);
  const before = digest(file);
  const r = run([
    ...base({
      file, item: "T-809", identity: ME,
      message: "item T-809 NOT TAKEN — already in open PR #8280, which touches scripts/exec/a.mjs",
    }),
    "--now", "2026-09-22T17:30:00Z",
  ]);
  check(
    "an abstention message written as a claim is REFUSED as a usage error",
    r.status === 2,
    `status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
  );
  check(
    "the refusal names the flag that fixes it",
    /--action\s+abstain/.test(`${r.stdout}${r.stderr}`),
    `${r.stdout}${r.stderr}`,
  );
  check(
    "and nothing was appended — register byte-identical",
    digest(file) === before,
    fs.readFileSync(file, "utf8").slice(-300),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 13 (item T-712) — a release is still an ownership question.
//
// `--action release` must not become a way to hand back an item someone else
// is holding. The gate already answers this; what is asserted here is that the
// release path still ASKS it.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    `2026-09-22T17:40:00Z | ${OTHER} | item T-806 claimed — branch \`x\``,
  ]);
  const before = digest(file);
  const r = run([
    ...base({ file, item: "T-806", identity: ME, message: "handing it back" }),
    "--action", "release", "--now", NOW,
  ]);
  check(
    "releasing another run's claim is refused by the gate",
    r.status === 1,
    `status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
  );
  check(
    "and nothing was appended",
    digest(file) === before,
    fs.readFileSync(file, "utf8").slice(-300),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 13b (item T-712) — the moment you most need to record an abstention is
// the moment the gate refuses.
//
// "Not taking T-706, it is in open PR #8280" IS a refused verdict written
// down. If a refusal stopped it being recorded, the decision would go back to
// a hand-written line — the path this helper exists to replace. Nothing is
// gained by reaching for the flag to get past the gate: the record asserts NOT
// TAKEN, so it holds neither the item nor the files it names, which the two
// assertions below check rather than assume.
// ---------------------------------------------------------------------------
{
  const OTHERS_FILE = "scripts/exec/build-source-board.mjs";
  const { dir, file } = fixture([]);
  const held = run([
    ...base({ file, item: "T-808", identity: OTHER, message: "taking it" }),
    "--files", OTHERS_FILE,
  ]);
  check("setup: another run holds T-808", held.status === 0, held.stderr);

  const abstained = run([
    ...base({
      file, item: "T-808", identity: ME,
      message: `held by another run, which lists ${OTHERS_FILE}; staying off it`,
    }),
    "--action", "abstain",
  ]);
  const T = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  check(
    "an abstention is recorded even though the gate refuses the item",
    abstained.status === 0 && /\| item T-808 NOT TAKEN\b/.test(fs.readFileSync(file, "utf8")),
    `status=${abstained.status} stdout=${abstained.stdout} stderr=${abstained.stderr}`,
  );
  check(
    "the record carries the refused verdict, so the register shows why",
    /pre-claim verdict `held-by-another`/.test(fs.readFileSync(file, "utf8")),
    fs.readFileSync(file, "utf8").slice(-400),
  );
  check(
    "and the abstention adds no hold of its own — the original holder is still the holder",
    preclaim(file, "T-808", "third-party#run-1", T).report.holder?.agent === OTHER,
    JSON.stringify(preclaim(file, "T-808", "third-party#run-1", T).report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Case 14 (item T-712) — an unknown --action is a usage error, not a claim.
//
// Failing open here would restore the defect under a typo.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([]);
  const before = digest(file);
  const r = run([
    ...base({ file, item: "T-807", identity: ME, message: "handing it back" }),
    "--action", "relase", "--now", "2026-09-22T17:30:00Z",
  ]);
  check(
    "a misspelled --action is refused rather than silently treated as a claim",
    r.status === 2 && digest(file) === before,
    `status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Cases 15-21 (item T-748) — an unrecognised flag is refused, not ignored.
//
// Node's argv parsing ignores what it does not recognise, and until this item
// so did every reader in this directory. Measured by execution on `main`
// `7e74fe7a0`: `--release`, `--totally-made-up-flag` and `--wrong-flag-two=x`
// each passed every gate here and produced a normal `item <id> claimed` line at
// exit 0. `--release` is not a flag — the sanctioned spelling is
// `--action release` — so a run that believed it had handed work back left a
// LIVE CLAIM on its files, and every sibling for the next three hours was
// refused those files by a holder that was finished. One instance is in the
// register at 22:10:50Z, corrected by an appended line sixteen seconds later.
//
// The helper already refused a `--gate-arg` the installed gate does not
// advertise, in these words: "An unrecognised flag is parsed as nothing and the
// check you asked for would not run, so this is refused rather than passed
// silently." It never applied that sentence to its own argv.
//
// Every case runs the REAL CLI over a fixture register and compares the file by
// DIGEST, because the assertion that matters is not the exit code — it is that
// nothing was written. A refusal that still appends is the defect, restated.
//
// The three invocations are the three real ones, verbatim. The negative
// controls are the two sanctioned actions, so the repair cannot be a blanket
// rejection of anything unfamiliar.
// ---------------------------------------------------------------------------
for (const bad of ["--release", "--totally-made-up-flag", "--wrong-flag-two=x"]) {
  const { dir, file } = fixture([]);
  const before = digest(file);
  const r = run([
    ...base({ file, item: "T-748", identity: ME, message: "handing it back" }),
    "--branch", "exec/t-748", "--now", "2026-09-22T17:30:00Z", bad,
  ]);
  check(
    `\`${bad}\` is refused and NOTHING is appended`,
    r.status !== 0 && digest(file) === before,
    `status=${r.status} (expected non-zero)\n` +
      `register changed: ${digest(file) !== before}\n` +
      `stdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  check(
    `\`${bad}\` is NAMED in the refusal`,
    `${r.stdout}${r.stderr}`.includes(bad),
    "a refusal that does not say which flag leaves the run guessing\n" +
      `stdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// NEGATIVE CONTROL — the sanctioned release still writes its line.
{
  const { dir, file } = fixture([]);
  const before = digest(file);
  const r = run([
    ...base({ file, item: "T-748", identity: ME, message: "handing it back, all files free" }),
    "--action", "release", "--branch", "exec/t-748", "--now", "2026-09-22T17:30:00Z",
  ]);
  check(
    "NEGATIVE CONTROL: `--action release` still appends",
    r.status === 0 && digest(file) !== before &&
      fs.readFileSync(file, "utf8").includes("RELEASED item T-748"),
    `status=${r.status} appended=${digest(file) !== before}\nstdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// NEGATIVE CONTROL — the sanctioned abstention still writes its line.
{
  const { dir, file } = fixture([]);
  const before = digest(file);
  const r = run([
    ...base({ file, item: "T-748", identity: ME, message: "NOT TAKEN this run; recording why" }),
    "--action", "abstain", "--now", "2026-09-22T17:30:00Z",
  ]);
  check(
    "NEGATIVE CONTROL: `--action abstain` still appends",
    r.status === 0 && digest(file) !== before &&
      fs.readFileSync(file, "utf8").includes("item T-748 NOT TAKEN"),
    `status=${r.status} appended=${digest(file) !== before}\nstdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// NEGATIVE CONTROL — a forwarded gate flag is a VALUE, not an unknown flag.
// `--gate-arg --github` is the one place this CLI is handed a token that looks
// exactly like a flag and must not be read as one.
{
  const { dir, file } = fixture([]);
  const r = run([
    ...base({ file, item: "T-748", identity: ME }),
    "--branch", "exec/t-748", "--now", "2026-09-22T17:30:00Z", "--gate-arg", "--github",
  ]);
  check(
    "NEGATIVE CONTROL: `--gate-arg --github` is not reported as an unknown flag",
    !`${r.stdout}${r.stderr}`.includes("not a flag"),
    `stdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// NEGATIVE CONTROL — a message quoting a flag is free text.
{
  const { dir, file } = fixture([]);
  const before = digest(file);
  const r = run([
    ...base({ file, item: "T-748", identity: ME, message: "--action release was already recorded above" }),
    "--branch", "exec/t-748", "--now", "2026-09-22T17:30:00Z",
  ]);
  check(
    "NEGATIVE CONTROL: a message beginning `--action` is text, and the claim is written",
    r.status === 0 && digest(file) !== before,
    `status=${r.status} appended=${digest(file) !== before}\nstdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// The declared vocabulary and the printed one are the same list.
//
// The item is explicit that the usage string was already correct and was
// already there when the flag was accepted, so a usage string is not the
// repair. It is still worth pinning the two together: a flag added to the spec
// and not to USAGE is undocumented, and one added to USAGE and not to the spec
// is refused at runtime while being advertised.
{
  const declared = [...FLAG_SPEC.value, ...FLAG_SPEC.boolean].sort();
  const printed = [...advertisedFlags(USAGE)].sort();
  check(
    "the declared flag spec equals the flags USAGE names",
    declared.join() === printed.join(),
    `declared: ${declared.join(" ")}\nprinted:  ${printed.join(" ")}`,
  );
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
