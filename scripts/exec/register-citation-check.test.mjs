#!/usr/bin/env node
/**
 * Behavioural test for the register-citation verifier (item T-718).
 *
 * The control this suite covers reports whether a suite's `LIVE_<n>` fixtures
 * still quote the register line they name. Three things about its shape decide
 * what is worth a case here:
 *
 *   - **Nothing in this suite may read the live register.** T-718's own
 *     acceptance says so, and for the reason this whole directory exists: a
 *     control taking its truth from its own subject cannot fail. Every case
 *     below builds a synthetic register in a temp directory. The live reading
 *     is the verifier's *output*, recorded by the agent who runs it, and is
 *     never an assertion here.
 *   - **`unlocatable` is not a pass.** The transcriptions in the real suite are
 *     frequently elided — segments joined across a cut — so a probe can fail to
 *     find text that is genuinely there. Counting that as "resolves" is the one
 *     way this verifier could report green over a drifted corpus, so it has its
 *     own verdict and its own case (case 4), and `--strict` refuses it.
 *   - **Zero citations must be loud.** A verifier pointed at a file with no
 *     `LIVE_<n>` in it has nothing to say, and "0 drifted" reads exactly like a
 *     clean corpus. Case 14 pins the vacuous-pass guard.
 *
 * Run:  node scripts/exec/register-citation-check.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  AMBIGUOUS,
  DRIFTED,
  RESOLVES,
  UNLOCATABLE,
  MIN_SEGMENT_LENGTH,
  parseCitations,
  resolveCitation,
  summarise,
  formatReport,
} from "./register-citation-check.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "register-citation-check.mjs");

let passes = 0;
let failures = 0;

function check(name, ok, detail) {
  if (ok) {
    passes += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}`);
    if (detail !== undefined) console.log(`       ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
}

/** A register whose body starts at line 3, as the real one does. */
function registerLines(bodyLines, { prepend = 0 } = {}) {
  const head = ["# Claims", ""];
  const filler = Array.from({ length: prepend }, (_, i) => `2026-09-01T00:0${i}:00Z | filler#${i} | prepended`);
  return [...head, ...filler, ...bodyLines];
}

// ---------------------------------------------------------------------------
// 1-3. Parsing: the identifier is the citation, because it is machine-readable.
// ---------------------------------------------------------------------------

const SOURCE_ONE = [
  "function t() {",
  "  // Register line 42, 2026-09-20T00:00:00Z. Its only mention of T-1.",
  "  const LIVE_42 =",
  '    "RELEASED item T-1 through PR #100 as squash SHA " +',
  '    "`abcdef0123456789` and nothing else";',
  "  check(\"x\", true);",
  "}",
  "",
].join("\n");

{
  const cites = parseCitations(SOURCE_ONE);
  check("1. one `LIVE_<n>` fixture parses to one citation", cites.length === 1, cites);
  check(
    "2. the cited line comes from the identifier, not from the comment prose",
    cites[0]?.citedLine === 42,
    cites[0],
  );
  check(
    "3. concatenated literals are kept as separate segments, because the join may cross a cut",
    cites[0]?.segments.length === 2,
    cites[0]?.segments,
  );
}

// ---------------------------------------------------------------------------
// 4-7. The four verdicts.
// ---------------------------------------------------------------------------

{
  const cite = parseCitations(SOURCE_ONE)[0];

  const atLine = registerLines([]);
  while (atLine.length < 41) atLine.push("unrelated line");
  atLine.push("RELEASED item T-1 through PR #100 as squash SHA `abcdef0123456789` and nothing else");
  const ok = resolveCitation(cite, atLine);
  check("4. text sitting at the cited line resolves with delta 0", ok.verdict === RESOLVES && ok.delta === 0, ok);

  const moved = [...atLine];
  moved.splice(2, 0, "inserted A", "inserted B", "inserted C", "inserted D");
  const drift = resolveCitation(cite, moved);
  check(
    "5. text four lines below its citation is DRIFTED, and the delta says how far",
    drift.verdict === DRIFTED && drift.at === 46 && drift.delta === 4,
    drift,
  );

  const gone = registerLines(["nothing here resembles the fixture"]);
  const miss = resolveCitation(cite, gone);
  check(
    "6. text found nowhere is UNLOCATABLE — NOT a pass, and NOT drift",
    miss.verdict === UNLOCATABLE && miss.at === null,
    miss,
  );

  // Both copies sit away from line 42, so the tie-break in case 8 cannot
  // decide this one and the verifier has to say it does not know.
  const twice = registerLines([]);
  while (twice.length < 9) twice.push("filler");
  twice.push("RELEASED item T-1 through PR #100 as squash SHA `abcdef0123456789` and nothing else");
  while (twice.length < 19) twice.push("filler");
  twice.push("RELEASED item T-1 through PR #100 as squash SHA `abcdef0123456789` and nothing else");
  const ambiguous = resolveCitation(cite, twice);
  check(
    "7. equal best scores at two lines, NEITHER of them the cited line, is AMBIGUOUS and names both",
    ambiguous.verdict === AMBIGUOUS && ambiguous.candidates.length === 2 && ambiguous.candidates.join() === "10,20",
    ambiguous,
  );
}

// ---------------------------------------------------------------------------
// 8. The tie-break that decides whether a CORRECT citation reads as drifted.
// ---------------------------------------------------------------------------

{
  const cite = parseCitations(SOURCE_ONE)[0];
  const body = registerLines([]);
  while (body.length < 41) body.push("unrelated line");
  body.push("RELEASED item T-1 through PR #100 as squash SHA `abcdef0123456789` and nothing else");
  body.push("RELEASED item T-1 through PR #100 as squash SHA `abcdef0123456789` and nothing else");
  const r = resolveCitation(cite, body);
  check(
    "8. when the cited line is among the equal-best candidates it WINS — a correct citation must not read as drift",
    r.verdict === RESOLVES && r.delta === 0,
    r,
  );
}

// ---------------------------------------------------------------------------
// 9. Short segments are not probes. An id or a dash matches every line.
// ---------------------------------------------------------------------------

{
  const shortSource = [
    "  const LIVE_9 =",
    '    "T-709" +',
    '    " — " +',
    '    "a segment long enough to identify one line";',
    "",
  ].join("\n");
  const cite = parseCitations(shortSource)[0];
  check(
    `9. segments under ${MIN_SEGMENT_LENGTH} characters are dropped, so a bare id cannot be a probe`,
    cite.segments.length === 1 && cite.segments[0] === "a segment long enough to identify one line",
    cite.segments,
  );
}

// ---------------------------------------------------------------------------
// 10-11. An elided transcription: the segments are real but the JOIN is not.
// ---------------------------------------------------------------------------

{
  const elided = [
    "  const LIVE_20 =",
    '    "the opening clause of a claim line" +',
    '    "a much later clause from the same line";',
    "",
  ].join("\n");
  const cite = parseCitations(elided)[0];
  const body = registerLines([]);
  while (body.length < 19) body.push("filler");
  body.push("the opening clause of a claim line ... elided middle ... a much later clause from the same line");
  const r = resolveCitation(cite, body);
  check(
    "10. an elided fixture still resolves, because segments are scored individually",
    r.verdict === RESOLVES && r.matched === 2 && r.of === 2,
    r,
  );

  const partial = registerLines([]);
  while (partial.length < 19) partial.push("filler");
  partial.push("the opening clause of a claim line ... and the rest was rewritten");
  const r2 = resolveCitation(cite, partial);
  check(
    "11. a partial match still resolves but reports how much of the fixture it could confirm",
    r2.verdict === RESOLVES && r2.matched === 1 && r2.of === 2,
    r2,
  );
}

// ---------------------------------------------------------------------------
// 11b. A tie the cited line won is reported AS a tie-break. The live corpus has
//      exactly one, at 1 of 3 segments, and a bare `ok` beside eighteen drifted
//      rows would be read as the one citation that is fine.
// ---------------------------------------------------------------------------

{
  const cite = parseCitations(SOURCE_ONE)[0];
  const body = registerLines([]);
  while (body.length < 41) body.push("unrelated line");
  body.push("RELEASED item T-1 through PR #100 as squash SHA `abcdef0123456789` and nothing else");
  body.push("RELEASED item T-1 through PR #100 as squash SHA `abcdef0123456789` and nothing else");
  const r = resolveCitation(cite, body);
  const text = formatReport([r], summarise([r]), { suite: "s", register: "r" });
  check(
    "11b. a resolve won on a tie names the rival line it beat",
    /TIE-BREAK, matched equally at 43/.test(text),
    text,
  );
  const clean = resolveCitation(cite, body.slice(0, 42));
  check(
    "11c. an outright resolve carries no tie-break note",
    /TIE-BREAK/.test(formatReport([clean], summarise([clean]), { suite: "s", register: "r" })) === false,
    formatReport([clean], summarise([clean]), { suite: "s", register: "r" }),
  );
}

// ---------------------------------------------------------------------------
// 12-13. The summary: a UNIFORM delta is the finding, not the individual rows.
// ---------------------------------------------------------------------------

{
  const results = [
    { identifier: "LIVE_1", citedLine: 1, verdict: DRIFTED, at: 5, delta: 4 },
    { identifier: "LIVE_2", citedLine: 2, verdict: DRIFTED, at: 6, delta: 4 },
    { identifier: "LIVE_3", citedLine: 3, verdict: DRIFTED, at: 7, delta: 4 },
    { identifier: "LIVE_4", citedLine: 4, verdict: UNLOCATABLE, at: null, delta: null },
  ];
  const s = summarise(results);
  check(
    "12. a single shared delta across every drifted citation is reported as uniform",
    s.uniformDelta === 4 && s.drifted === 3 && s.unlocatable === 1 && s.resolves === 0,
    s,
  );

  const mixed = summarise([
    { identifier: "LIVE_1", citedLine: 1, verdict: DRIFTED, at: 5, delta: 4 },
    { identifier: "LIVE_2", citedLine: 2, verdict: DRIFTED, at: 9, delta: 7 },
  ]);
  check(
    "13. two different deltas is NOT uniform — one insertion and scattered rot are different findings",
    mixed.uniformDelta === null && mixed.deltas.length === 2,
    mixed,
  );
}

// ---------------------------------------------------------------------------
// 14. Zero citations is loud. "0 drifted" over an empty parse is the vacuous
//     pass this directory exists against.
// ---------------------------------------------------------------------------

{
  const s = summarise([]);
  check("14. an empty parse is not clean — it reports nothing to verify", s.total === 0 && s.nothingToVerify === true, s);
  check(
    "15. the report says so in words rather than printing a green zero",
    /nothing to verify|no .*citation/i.test(formatReport([], s, { suite: "x", register: "y" })),
    formatReport([], s, { suite: "x", register: "y" }),
  );
}

// ---------------------------------------------------------------------------
// 16-20. The REAL CLI, over a fixture register. An uninvoked control is worth
//        nothing from the register's side (T-708), so the executable runs here.
// ---------------------------------------------------------------------------

function runCli(args, { expectFail = false } = {}) {
  try {
    const stdout = execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, stdout };
  } catch (error) {
    if (!expectFail) throw error;
    return { code: error.status, stdout: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "t718-"));
  const suite = path.join(dir, "fixture.test.mjs");
  const register = path.join(dir, "REGISTER.md");
  fs.writeFileSync(suite, SOURCE_ONE);

  const clean = registerLines([]);
  while (clean.length < 41) clean.push("unrelated line");
  clean.push("RELEASED item T-1 through PR #100 as squash SHA `abcdef0123456789` and nothing else");
  fs.writeFileSync(register, clean.join("\n"));

  const green = runCli(["--suite", suite, "--register", register, "--strict"]);
  check("16. the real CLI exits 0 under --strict when every citation resolves", green.code === 0, green.stdout);

  const drifted = [...clean];
  drifted.splice(2, 0, "inserted A", "inserted B", "inserted C", "inserted D");
  fs.writeFileSync(register, drifted.join("\n"));

  const report = runCli(["--suite", suite, "--register", register]);
  check(
    "17. report mode exits 0 and prints the drift — it reports, it does not fail a build",
    report.code === 0 && report.stdout.includes("LIVE_42") && /\+4/.test(report.stdout),
    report.stdout,
  );

  const strict = runCli(["--suite", suite, "--register", register, "--strict"], { expectFail: true });
  check("18. --strict exits 1 on the same drift", strict.code === 1, strict.stdout);

  const json = runCli(["--suite", suite, "--register", register, "--json"]);
  const parsed = JSON.parse(json.stdout);
  check(
    "19. --json carries the verdict, the resolved line and the delta",
    parsed.results[0].verdict === DRIFTED && parsed.results[0].at === 46 && parsed.summary.uniformDelta === 4,
    parsed.summary,
  );

  const bogus = runCli(["--suite", suite, "--register", register, "--repor"], { expectFail: true });
  check(
    "20. an unrecognised flag is refused rather than parsed as nothing (T-748)",
    bogus.code === 2 && /--repor/.test(bogus.stdout),
    bogus.stdout,
  );

  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
