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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HELPER = path.join(HERE, "append-claim.mjs");
const GATE = path.join(HERE, "register-time-authority.mjs");

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

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
