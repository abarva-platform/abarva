#!/usr/bin/env node
/**
 * Tests for the perturbation probe (item C-588).
 *
 * This suite is written under the rule the probe exists to enforce, which is
 * the only honest way to write it: **no case here asserts that a literal is
 * ABSENT from an operator document.** Where a live document is read, the
 * assertion is on the mechanism — that appending the probe's own perturbation
 * makes a match appear — never on what the corpus does or does not contain
 * today. A case asserting the "before" state would be the exact defect the
 * probe detects, and `C-587` already discarded one draft repair for it.
 *
 * The probe's RED proof is not in this file and cannot be: it is the
 * rediscovery of the two `C-587` positives, which needs the pre-`C-587` suites
 * out of git. That measurement is in the release record, reproducible in one
 * command, and it is what makes the probe's silence worth anything.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_VEHICLES,
  OPERATOR_DOCUMENTS,
  PERTURBATION_SOURCES,
  PERTURBATION_VEHICLES,
  caseNames,
  diffSuiteRuns,
  mentionedItemIds,
  parseSuiteOutput,
  perturbationLiterals,
  perturbationPlan,
  renderBacklogFilingPerturbation,
  renderBacklogPerturbation,
  renderPulsePerturbation,
  renderRegisterPerturbation,
  stringLiterals,
} from "./self-falsifying-assertion-probe.mjs";
import { parseRegisterLines, announcesMerge } from "./register-time-authority.mjs";
import { HEADING_RE, backlogOccurrences } from "./id-collision.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "self-falsifying-assertion-probe.mjs");

let passes = 0;
let failures = 0;
let skipped = 0;

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

function skip(name, why) {
  skipped += 1;
  console.log(`  SKIP  ${name} — ${why}`);
}

const NOW = "2026-10-04T16:00:00Z";
const IDENTITY = "probe-test#fixture";
const ITEM = "C-588";

// ---------------------------------------------------------------------------
console.log("the document list is derived, not curated");

/*
 * The whole point of C-587 is that a hand-curated literal list rots. So this
 * asserts the sandbox's document list covers every operator filename the
 * scripts beside it name. Add a document to a script and this goes red.
 */
const scriptNames = new Set();
for (const entry of fs.readdirSync(HERE)) {
  if (!entry.endsWith(".mjs") || entry.endsWith(".test.mjs")) continue;
  const source = fs.readFileSync(path.join(HERE, entry), "utf8");
  for (const match of source.matchAll(
    /"(EXECUTION_[A-Z_0-9]*\.md|SOURCE_[A-Z_0-9]*\.md|source-board-summary\.json)"/g,
  )) {
    scriptNames.add(match[1]);
  }
}
const uncovered = [...scriptNames].filter((name) => !OPERATOR_DOCUMENTS.includes(name));
check(
  "every operator document named by a script in this directory is in OPERATOR_DOCUMENTS",
  uncovered.length === 0,
  `named by scripts but absent from the list: ${uncovered.join(", ")}`,
);
check(
  "and the scan found documents at all, so an empty scan cannot pass this vacuously",
  scriptNames.size >= 4,
  `found ${scriptNames.size}`,
);

// ---------------------------------------------------------------------------
console.log("\nreading a suite's verdicts — three dialects, discovered by reading all fifteen");

const passFailSkip = parseSuiteOutput({
  stdout: [
    "a heading",
    "  PASS  alpha",
    "  FAIL  beta",
    "        detail line that is not a case",
    "  SKIP  gamma — no corpus on this host",
    "",
    "1 passed, 1 failed, 1 skipped",
  ].join("\n"),
});
check("pass-fail-skip dialect is recognised", passFailSkip.dialect === "pass-fail-skip", passFailSkip.dialect);
check("  a PASS line is a pass", passFailSkip.cases.get("alpha") === "pass");
check("  a FAIL line is a fail", passFailSkip.cases.get("beta") === "fail");
check("  a SKIP line is a skip, with its reason stripped", passFailSkip.cases.get("gamma") === "skip");
check("  an indented detail line is not a case", passFailSkip.cases.size === 3, [...passFailSkip.cases.keys()].join(" | "));
check(
  "  totals are read, including skipped",
  passFailSkip.totals?.passed === 1 && passFailSkip.totals?.failed === 1 && passFailSkip.totals?.skipped === 1,
  JSON.stringify(passFailSkip.totals),
);

const okFail = parseSuiteOutput({ stdout: ["  ok   alpha", "  FAIL beta", "", "1 passed, 1 failed"].join("\n") });
check("ok-fail dialect is recognised", okFail.dialect === "ok-fail", okFail.dialect);
check("  `  ok   name` is a pass", okFail.cases.get("alpha") === "pass");
check("  `  FAIL name` with one space is a fail", okFail.cases.get("beta") === "fail");
check("  a totals line with no skipped field reports skipped as null", okFail.totals?.skipped === null, JSON.stringify(okFail.totals));

const failOnly = parseSuiteOutput({ stdout: "\n3 passed, 1 failed\n", stderr: "FAIL beta\n", status: 1 });
check("fail-only dialect is recognised", failOnly.dialect === "fail-only", failOnly.dialect);
check("  its FAIL line on stderr is read", failOnly.cases.get("beta") === "fail");
check(
  "  and it is reported as having NO visible pass lines, rather than as having no cases",
  failOnly.visiblePasses === false && passFailSkip.visiblePasses === true && okFail.visiblePasses === true,
  `fail-only ${failOnly.visiblePasses}, pass-fail-skip ${passFailSkip.visiblePasses}, ok-fail ${okFail.visiblePasses}`,
);
check("  a suite that died non-zero carries its status", failOnly.status === 1);
check(
  "a run with no recognisable totals line reports totals as null rather than zero",
  parseSuiteOutput({ stdout: "nothing here" }).totals === null,
);

/*
 * A repeated label collapses to one verdict, which is a blind spot in the
 * per-case channel. It must be REPORTED, not merely survived: 32 labels in this
 * directory are printed more than once.
 */
const collapsed = parseSuiteOutput({
  stdout: ["  PASS  same label", "  FAIL  same label", "  PASS  unique", "", "2 passed, 1 failed"].join("\n"),
});
check(
  "a label printed twice collapses to the last verdict",
  collapsed.cases.get("same label") === "fail" && collapsed.cases.size === 2,
  JSON.stringify([...collapsed.cases]),
);
check(
  "and the collapse is reported once, by name, rather than silently survived",
  collapsed.duplicateNames.join(",") === "same label",
  JSON.stringify(collapsed.duplicateNames),
);
check(
  "a label printed twice with the SAME verdict is still reported — the collapse is what matters, not the disagreement",
  parseSuiteOutput({ stdout: ["  PASS  twice", "  PASS  twice"].join("\n") }).duplicateNames.join(",") === "twice",
);
check(
  "no collapse is reported when every label is distinct",
  parseSuiteOutput({ stdout: ["  PASS  a", "  PASS  b"].join("\n") }).duplicateNames.length === 0,
);

// ---------------------------------------------------------------------------
console.log("\nwhat moved between two runs");

const before = parseSuiteOutput({
  stdout: ["  PASS  steady", "  PASS  flipper", "  FAIL  already red", "  PASS  vanisher", "", "3 passed, 1 failed"].join("\n"),
});
const after = parseSuiteOutput({
  stdout: ["  PASS  steady", "  FAIL  flipper", "  FAIL  already red", "  PASS  newcomer", "", "2 passed, 2 failed"].join("\n"),
  status: 1,
});
const moved = diffSuiteRuns(before, after);
check(
  "a case that changed its verdict is a flip, and only that case",
  moved.flips.length === 1 && moved.flips[0].name === "flipper" && moved.flips[0].from === "pass" && moved.flips[0].to === "fail",
  JSON.stringify(moved.flips),
);
check(
  "a case that was already red and stayed red is NOT a flip — the probe cannot see through it",
  !moved.flips.some((f) => f.name === "already red"),
);
check(
  "a case only the perturbed run ran is `appeared`, kept out of flips",
  moved.appeared.length === 1 && moved.appeared[0].name === "newcomer" && !moved.flips.some((f) => f.name === "newcomer"),
  JSON.stringify(moved.appeared),
);
check(
  "a case only the baseline ran is `vanished`, kept out of flips",
  moved.vanished.length === 1 && moved.vanished[0].name === "vanisher" && !moved.flips.some((f) => f.name === "vanisher"),
  JSON.stringify(moved.vanished),
);
check(
  "the totals delta is reported signed, not as a boolean",
  moved.totalsDelta?.passed === -1 && moved.totalsDelta?.failed === 1,
  JSON.stringify(moved.totalsDelta),
);
check("a changed exit code is reported on its own", moved.statusChanged === true);
check("and the run is `moved`", moved.moved === true);

const still = diffSuiteRuns(before, before);
check(
  "two identical runs move in no channel at all",
  !still.moved && still.flips.length === 0 && still.appeared.length === 0 && still.vanished.length === 0 && still.totalsChanged === false && still.statusChanged === false,
  JSON.stringify(still),
);

/*
 * The totals channel exists because one dialect has no per-case pass line. A
 * suite whose only signal is its totals must still read as moved.
 */
const blindBefore = parseSuiteOutput({ stdout: "\n38 passed, 0 failed\n" });
const blindAfter = parseSuiteOutput({ stdout: "\n37 passed, 1 failed\n", stderr: "FAIL something\n", status: 1 });
const blindDiff = diffSuiteRuns(blindBefore, blindAfter);
check(
  "a suite with no per-case pass lines still reads as moved, from its totals and its new FAIL line",
  blindDiff.moved && blindDiff.totalsChanged && blindDiff.appeared.some((r) => r.name === "something"),
  JSON.stringify({ moved: blindDiff.moved, totals: blindDiff.totalsDelta, appeared: blindDiff.appeared }),
);

// ---------------------------------------------------------------------------
console.log("\nwhere the perturbation text comes from — four nested sources");

const FIXTURE_SUITE = [
  'const SHA = "7f0056d1e889687f1af6b8d14b636b9745c9541e";',
  'check("the reader names it", verdict(SHA) === NAMED, "detail");',
  'check(',
  '  "the live backlog does NOT report T-720",',
  '  !byId.has("T-720"),',
  ');',
  'skip("absent on a runner", "no corpus");',
  'const template = `a template literal`;',
  'const tiny = "ab";',
  'const dup = "the reader names it";',
].join("\n");

const names = caseNames(FIXTURE_SUITE);
check(
  "case names are the first argument of check/eq/skip, and nothing else",
  names.includes("the reader names it") && names.includes("the live backlog does NOT report T-720") && names.includes("absent on a runner"),
  names.join(" | "),
);
check(
  "a case name is not repeated when two calls share it",
  names.filter((n) => n === "the reader names it").length === 1,
  names.join(" | "),
);
check(
  "and case names do NOT contain either literal C-587 repaired — which is the whole reason this source is insufficient",
  !names.some((n) => n.includes("7f0056d1e889687f1af6b8d14b636b9745c9541e")) && !names.some((n) => n === "T-720"),
  names.join(" | "),
);

const literals = stringLiterals(FIXTURE_SUITE);
check(
  "source literals DO contain both literals C-587 repaired",
  literals.includes("7f0056d1e889687f1af6b8d14b636b9745c9541e") && literals.includes("T-720"),
  literals.join(" | "),
);
check("a template literal's static text is a literal", literals.includes("a template literal"), literals.join(" | "));
check("a literal under three characters is dropped", !literals.includes("ab"), literals.join(" | "));
check("a repeated literal appears once", literals.filter((l) => l === "the reader names it").length === 1);
check(
  "the four sources are NESTED, so the noise floor can only rise along the chain",
  names.every((n) => literals.includes(n)) &&
    perturbationLiterals(FIXTURE_SUITE, "none").length === 0 &&
    perturbationLiterals(FIXTURE_SUITE, "whole-source")[0] === FIXTURE_SUITE,
  `${names.length} names, ${literals.length} literals`,
);
let threw = null;
try {
  perturbationLiterals(FIXTURE_SUITE, "guess");
} catch (error) {
  threw = error.message;
}
check("an unknown source is refused rather than treated as `none`", Boolean(threw) && threw.includes("guess"), String(threw));
check("and the four names are the declared set", PERTURBATION_SOURCES.join(",") === "none,case-names,source-literals,whole-source", PERTURBATION_SOURCES.join(","));

// ---------------------------------------------------------------------------
console.log("\nthe register perturbation is in the register's own grammar");

const registerLine = renderRegisterPerturbation({ now: NOW, identity: IDENTITY, item: ITEM, literals });
check("it is exactly one physical line", !registerLine.includes("\n") && !registerLine.includes("\r"), JSON.stringify(registerLine.slice(0, 80)));
const parsed = parseRegisterLines(`${registerLine}\n`);
check("the register's own parser reads it as one register line", parsed.length === 1, `parsed ${parsed.length}`);
check("  with the stamp it was given", parsed[0]?.stamp === NOW, parsed[0]?.stamp);
check("  and the identity it was given", parsed[0]?.agent === IDENTITY, parsed[0]?.agent);
check(
  "it announces no merge, so it cannot be mistaken for an event line",
  announcesMerge(registerLine) === false && parsed[0]?.announcesMerge === false,
);
check(
  "it names no pull request as a handle",
  (parsed[0]?.prRefs.length ?? 0) === 0 && (parsed[0]?.prAnnounced.length ?? 0) === 0,
  JSON.stringify(parsed[0]?.prRefs),
);
check(
  "it quotes the subjects under test, which is how it can falsify an absence assertion at all",
  registerLine.includes("7f0056d1e889687f1af6b8d14b636b9745c9541e"),
);
check(
  "a pipe inside a quoted literal is neutralised, because the pipe is that grammar's field separator",
  !renderRegisterPerturbation({ now: NOW, identity: IDENTITY, item: ITEM, literals: ["a|b"] }).includes("a|b"),
);
check(
  "with no literals it says so, rather than looking like a perturbation that failed to quote anything",
  renderRegisterPerturbation({ now: NOW, identity: IDENTITY, item: ITEM, literals: [] }).includes("noise floor"),
);

// ---------------------------------------------------------------------------
console.log("\nthe backlog note is NOT a filing, and the filing vehicle is");

const note = renderBacklogPerturbation({ now: NOW, identity: IDENTITY, item: ITEM, literals });
const noteHeadings = note.split("\n").filter((line) => line.startsWith("#"));
check("the note carries a heading", noteHeadings.length === 1, JSON.stringify(noteHeadings));
check(
  "but NOT one in item position — which is the measured reason a prose note flips nothing in the backlog's filing channel",
  noteHeadings.every((line) => !HEADING_RE.test(line)),
  JSON.stringify(noteHeadings),
);
check("the note still names the ids it discusses, in prose", note.includes("T-720"), note.slice(0, 200));

const filing = renderBacklogFilingPerturbation({ now: NOW, identity: IDENTITY, item: ITEM, literals });
const filingHeadings = filing.split("\n").filter((line) => line.startsWith("#"));
check(
  "the filing vehicle writes headings that ARE in item position",
  filingHeadings.length > 0 && filingHeadings.every((line) => HEADING_RE.test(line)),
  JSON.stringify(filingHeadings),
);
check(
  "one per lane id the literals mention, and no more",
  filingHeadings.length === mentionedItemIds(literals).length && mentionedItemIds(literals).includes("T-720"),
  `${filingHeadings.length} headings, ${mentionedItemIds(literals).length} ids`,
);
check(
  "and the backlog reader counts each as a filing of that id",
  backlogOccurrences(filing).filter((o) => o.id === "T-720" && o.kind === "filing").length === 1,
  JSON.stringify(backlogOccurrences(filing).filter((o) => o.id === "T-720")),
);
check(
  "with no lane id in the literals the filing vehicle files nothing",
  renderBacklogFilingPerturbation({ now: NOW, identity: IDENTITY, item: ITEM, literals: ["plain words"] })
    .split("\n")
    .filter((line) => HEADING_RE.test(line)).length === 0,
);
/*
 * The fixture carries a THREE-DIGIT bare number on purpose. An earlier version
 * used `42` and `8520`, and a mutation widening the pattern to `\b\d{3}\b`
 * survived it: two digits and four digits both fall outside that pattern, so
 * the case could not tell the two readers apart. A lane id's number is three
 * digits, so three digits is the only width that discriminates.
 */
const ID_FIXTURE = ["T-720 and 142 and 8520 and 42"];
check(
  "a lane id is read from a literal; a bare THREE-DIGIT number is not, because every assertion count would become one",
  mentionedItemIds(ID_FIXTURE).join(",") === "T-720",
  mentionedItemIds(ID_FIXTURE).join(","),
);

const pulse = renderPulsePerturbation({ now: NOW, identity: IDENTITY, item: ITEM, literals });
check("the pulse entry carries its stamp and its identity", pulse.includes(NOW) && pulse.includes(IDENTITY));
check(
  "and no pulse heading is in item position either",
  pulse.split("\n").filter((line) => line.startsWith("#")).every((line) => !HEADING_RE.test(line)),
);

// ---------------------------------------------------------------------------
console.log("\nthe plan, and which vehicles a default run uses");

const plan = perturbationPlan({ now: NOW, identity: IDENTITY, item: ITEM, literals });
check(
  "a default plan appends to the register, the backlog and the pulse",
  plan.map((s) => s.vehicle).join(",") === "register,backlog,pulse",
  plan.map((s) => s.vehicle).join(","),
);
check(
  "each step names the document it appends to",
  plan.find((s) => s.vehicle === "register")?.file === "EXECUTION_CLAIMS.md" &&
    plan.find((s) => s.vehicle === "backlog")?.file === "EXECUTION_BACKLOG_20260918.md" &&
    plan.find((s) => s.vehicle === "pulse")?.file === "EXECUTION_PULSE_20260918.md",
  JSON.stringify(plan.map((s) => [s.vehicle, s.file])),
);
check(
  "`backlog-filing` is a declared vehicle but NOT a default one, because it files every id a suite mentions",
  PERTURBATION_VEHICLES.includes("backlog-filing") && !DEFAULT_VEHICLES.includes("backlog-filing"),
  `${PERTURBATION_VEHICLES.join(",")} / ${DEFAULT_VEHICLES.join(",")}`,
);
check(
  "asking for it puts it in the plan, against the backlog",
  perturbationPlan({ now: NOW, identity: IDENTITY, item: ITEM, literals, vehicles: ["backlog-filing"] })[0].file ===
    "EXECUTION_BACKLOG_20260918.md",
);
let vehicleThrew = null;
try {
  perturbationPlan({ now: NOW, identity: IDENTITY, item: ITEM, literals, vehicles: ["sidecar"] });
} catch (error) {
  vehicleThrew = error.message;
}
check("an unknown vehicle is refused rather than silently skipped", Boolean(vehicleThrew) && vehicleThrew.includes("sidecar"), String(vehicleThrew));
check(
  "every step appends and nothing rewrites — each payload is bracketed by newlines",
  plan.every((s) => s.append.startsWith("\n") && s.append.endsWith("\n")),
);

// ---------------------------------------------------------------------------
console.log("\nthe CLI refuses rather than measuring something else");

function cli(args, options = {}) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
      maxBuffer: 64 * 1024 * 1024,
      ...options,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return { status: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

const badFlag = cli(["--sorce", "none"]);
check("an unrecognised flag exits 2 and runs nothing", badFlag.status === 2, `exit ${badFlag.status}`);
check(
  "  and says the measurement would have been a different one",
  /is not a flag this command reads/.test(badFlag.stderr) && /Nothing was run/.test(badFlag.stderr),
  badFlag.stderr.slice(0, 200),
);
const badSource = cli(["--source", "guess"]);
check("an unknown --source exits 2 rather than defaulting", badSource.status === 2 && /is not one of/.test(badSource.stderr), `exit ${badSource.status}: ${badSource.stderr.slice(0, 120)}`);
const badVehicle = cli(["--vehicle", "sidecar"]);
check("an unknown --vehicle exits 2 rather than being dropped", badVehicle.status === 2 && /is not one of/.test(badVehicle.stderr), `exit ${badVehicle.status}`);
const emptyRoot = cli(["--operator-root", path.join(os.tmpdir(), "c588-absent-root"), "--source", "none"]);
check(
  "with no operator document present it exits 2 instead of reporting a clean run",
  emptyRoot.status === 2 && /nothing to perturb/.test(emptyRoot.stderr),
  `exit ${emptyRoot.status}: ${emptyRoot.stderr.slice(0, 160)}`,
);

// ---------------------------------------------------------------------------
console.log("\nend to end, over a sandbox corpus the test controls");

/*
 * A two-suite fixture directory: one suite holds an absence assertion over the
 * register, the other asserts the same subject as a mechanism. The probe must
 * name the first and leave the second alone.
 */
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "c588-e2e-"));
const fixtureSuites = path.join(fixtureRoot, "suites");
const fixtureCorpus = path.join(fixtureRoot, "corpus");
fs.mkdirSync(fixtureSuites, { recursive: true });
fs.mkdirSync(fixtureCorpus, { recursive: true });
for (const name of OPERATOR_DOCUMENTS) {
  fs.writeFileSync(path.join(fixtureCorpus, name), name.endsWith(".json") ? "{}\n" : "# fixture\n");
}

const SUBJECT = "deadbeefcafe0000111122223333444455556666";
fs.writeFileSync(
  path.join(fixtureSuites, "absence.test.mjs"),
  [
    'import fs from "node:fs";',
    'import os from "node:os";',
    'import path from "node:path";',
    `const SUBJECT = "${SUBJECT}";`,
    'const reg = path.join(os.homedir(), "Downloads", "EXECUTION_CLAIMS.md");',
    'const raw = fs.existsSync(reg) ? fs.readFileSync(reg, "utf8") : "";',
    'let p = 0, f = 0;',
    'function check(n, c) { if (c) { p += 1; console.log(`  PASS  ${n}`); } else { f += 1; console.log(`  FAIL  ${n}`); } }',
    'check("no register line quotes the subject", !raw.includes(SUBJECT));',
    'check("the register was read at all", raw.length > 0);',
    'console.log(`\\n${p} passed, ${f} failed`);',
    'process.exitCode = f > 0 ? 1 : 0;',
  ].join("\n"),
);
fs.writeFileSync(
  path.join(fixtureSuites, "mechanism.test.mjs"),
  [
    'import fs from "node:fs";',
    'import os from "node:os";',
    'import path from "node:path";',
    `const SUBJECT = "${SUBJECT}";`,
    'const reg = path.join(os.homedir(), "Downloads", "EXECUTION_CLAIMS.md");',
    'const raw = fs.existsSync(reg) ? fs.readFileSync(reg, "utf8") : "";',
    'let p = 0, f = 0;',
    'function check(n, c) { if (c) { p += 1; console.log(`  PASS  ${n}`); } else { f += 1; console.log(`  FAIL  ${n}`); } }',
    'check("the subject is forty hex characters", /^[0-9a-f]{40}$/.test(SUBJECT));',
    'check("a quoted subject is found when it is there", raw.includes(SUBJECT) === raw.includes(SUBJECT));',
    'console.log(`\\n${p} passed, ${f} failed`);',
    'process.exitCode = f > 0 ? 1 : 0;',
  ].join("\n"),
);

/*
 * A third fixture suite guards the env contract, which is the defect this probe
 * shipped in its own first form: it set `SOURCE_EXECUTION_HOME` and
 * `EXEC_OPERATOR_ROOT` as well as `HOME`, and those two are how a suite points
 * its OWN fixture at a controlled corpus. That took `id-collision` from 71/0 to
 * 70/1 in the baseline run, before any perturbation. `HOME` must be the only
 * substitution, and the other two must be DELETED rather than left alone — so
 * the probe is invoked below with both already set to a decoy path.
 */
fs.writeFileSync(
  path.join(fixtureSuites, "env.test.mjs"),
  [
    'let p = 0, f = 0;',
    'function check(n, c) { if (c) { p += 1; console.log(`  PASS  ${n}`); } else { f += 1; console.log(`  FAIL  ${n}`); } }',
    'check("the probe left EXEC_OPERATOR_ROOT unset, so a suite can still point its own fixture", process.env.EXEC_OPERATOR_ROOT === undefined);',
    'check("the probe left SOURCE_EXECUTION_HOME unset for the same reason", process.env.SOURCE_EXECUTION_HOME === undefined);',
    'check("and HOME was substituted, so the sandbox is what gets read", (process.env.HOME || "").includes("baseline") || (process.env.HOME || "").includes("perturbed"));',
    'console.log(`\\n${p} passed, ${f} failed`);',
    'process.exitCode = f > 0 ? 1 : 0;',
  ].join("\n"),
);

/*
 * A fourth prints one label twice, so the collapsed-label report has a subject.
 * Without it a mutation that returns an empty collapsed list survives, which it
 * did: the only case standing there was a type check, and `0` is a number.
 */
fs.writeFileSync(
  path.join(fixtureSuites, "collapse.test.mjs"),
  [
    'console.log("  PASS  a label printed twice");',
    'console.log("  PASS  a label printed twice");',
    'console.log("  PASS  a label printed once");',
    'console.log("\\n3 passed, 0 failed");',
  ].join("\n"),
);

const DECOY_ROOT = path.join(os.tmpdir(), "c588-decoy-operator-root");
const e2e = cli(
  ["--suite-dir", fixtureSuites, "--operator-root", fixtureCorpus, "--source", "source-literals", "--json"],
  { env: { ...process.env, EXEC_OPERATOR_ROOT: DECOY_ROOT, SOURCE_EXECUTION_HOME: DECOY_ROOT } },
);
let report = null;
try {
  report = JSON.parse(e2e.stdout);
} catch {
  report = null;
}
if (!report) {
  check("the probe returned a JSON report", false, `exit ${e2e.status}; stderr ${e2e.stderr.slice(0, 400)}`);
} else {
  check(
    "the probe names the absence assertion as self-falsifying",
    report.falsifiable.some((row) => row.suite === "absence.test.mjs" && row.name === "no register line quotes the subject"),
    JSON.stringify(report.falsifiable),
  );
  check(
    "and leaves the mechanism suite alone",
    !report.falsifiable.some((row) => row.suite === "mechanism.test.mjs"),
    JSON.stringify(report.falsifiable),
  );
  check(
    "the case that merely proves the corpus was read is not reported — the probe appends, it does not empty",
    !report.falsifiable.some((row) => row.name === "the register was read at all"),
    JSON.stringify(report.falsifiable.map((r) => r.name)),
  );
  check("it exits 1 when it falsified something, so its silence is usable", e2e.status === 1, `exit ${e2e.status}`);
  check(
    "the report names its own blind spot: which suites print nothing on a pass",
    Array.isArray(report.blindSuites),
    JSON.stringify(report.blindSuites),
  );
  check(
    "the sandbox it used is named in the report",
    typeof report.sandboxRoot === "string" && report.sandboxRoot.length > 0,
    report.sandboxRoot,
  );
  /*
   * The env contract, asserted where it bit: the probe was invoked with both
   * variables already set to a decoy, so a green baseline here means they were
   * DELETED, not merely left unset. A broken probe makes these cases red in
   * BOTH runs, which is a baseline failure rather than a flip — so the
   * assertion is on the baseline, which is the only channel that can see it.
   */
  const envRow = report.results.find((row) => row.suite === "env.test.mjs");
  check(
    "HOME is the probe's only substitution: a suite still sees EXEC_OPERATOR_ROOT and SOURCE_EXECUTION_HOME unset, even when the caller had them set",
    envRow?.baseline.totals?.failed === 0 && envRow?.baseline.totals?.passed === 3,
    JSON.stringify(envRow?.baseline.totals),
  );
  check(
    "  and that holds in the perturbed run too, not just the baseline",
    envRow?.perturbed.totals?.failed === 0,
    JSON.stringify(envRow?.perturbed.totals),
  );

  const collapseRow = report.results.find((row) => row.suite === "collapse.test.mjs");
  check(
    "a collapsed label reaches the report BY NAME, rather than being computed and dropped",
    collapseRow?.collapsedLabels.join(",") === "a label printed twice",
    JSON.stringify(collapseRow?.collapsedLabels),
  );
  check(
    "and the report's collapsed-label count is that blind spot as a number, not zero",
    report.collapsedLabelCount >= 1,
    String(report.collapsedLabelCount),
  );
  check(
    "  while a suite with no repeated label contributes none",
    report.results.find((row) => row.suite === "mechanism.test.mjs")?.collapsedLabels.length === 0,
    JSON.stringify(report.results.find((row) => row.suite === "mechanism.test.mjs")?.collapsedLabels),
  );
}

/*
 * EVERY VEHICLE MUST LAND. A clean result is worthless if a vehicle silently
 * wrote nothing — a negative needs independent truth. Calibration (a) proves
 * the register vehicle lands, because it flips a real case; the backlog NOTE
 * and the pulse entry flip nothing by design, so nothing else would catch them
 * going quiet. This reads the sandbox instead.
 */
const landRoot = fs.mkdtempSync(path.join(os.tmpdir(), "c588-land-"));
fs.rmSync(landRoot, { recursive: true, force: true });
const landed = cli([
  "--suite-dir",
  fixtureSuites,
  "--operator-root",
  fixtureCorpus,
  "--source",
  "source-literals",
  "--sandbox",
  landRoot,
  "--keep-sandbox",
  "--json",
]);
const VEHICLE_FILES = {
  register: "EXECUTION_CLAIMS.md",
  backlog: "EXECUTION_BACKLOG_20260918.md",
  pulse: "EXECUTION_PULSE_20260918.md",
};
if (!fs.existsSync(path.join(landRoot, "perturbed", "Downloads"))) {
  check("the probe kept the sandbox it was given", false, `exit ${landed.status}; stderr ${landed.stderr.slice(0, 300)}`);
} else {
  for (const [vehicle, file] of Object.entries(VEHICLE_FILES)) {
    const base = fs.readFileSync(path.join(landRoot, "baseline", "Downloads", file), "utf8");
    const pert = fs.readFileSync(path.join(landRoot, "perturbed", "Downloads", file), "utf8");
    check(
      `the ${vehicle} vehicle lands: its document grows and the baseline copy is untouched`,
      pert.length > base.length && base === fs.readFileSync(path.join(fixtureCorpus, file), "utf8"),
      `baseline ${base.length}B, perturbed ${pert.length}B`,
    );
    check(
      `  and the ${vehicle} document carries exactly one probe line, with zero in the baseline`,
      (pert.match(/self-falsifying-assertion-probe#local/g) ?? []).length === 1 &&
        (base.match(/self-falsifying-assertion-probe#local/g) ?? []).length === 0,
      `perturbed ${(pert.match(/self-falsifying-assertion-probe#local/g) ?? []).length}`,
    );
  }
}
fs.rmSync(landRoot, { recursive: true, force: true });

/*
 * The noise floor, asserted as a property rather than as a number: with no
 * literals quoted, the same absence assertion must NOT be reported. If it were,
 * the probe would be reporting its own prose and every verdict it gives would
 * be unreadable.
 */
const floor = cli([
  "--suite-dir",
  fixtureSuites,
  "--operator-root",
  fixtureCorpus,
  "--source",
  "none",
  "--json",
]);
let floorReport = null;
try {
  floorReport = JSON.parse(floor.stdout);
} catch {
  floorReport = null;
}
if (!floorReport) {
  check("the noise-floor run returned a JSON report", false, `exit ${floor.status}; stderr ${floor.stderr.slice(0, 400)}`);
} else {
  check(
    "at source `none` nothing is reported, so the probe is not reporting its own prose",
    floorReport.falsifiable.length === 0,
    JSON.stringify(floorReport.falsifiable),
  );
  check("and that run exits 0", floor.status === 0, `exit ${floor.status}`);
}

fs.rmSync(fixtureRoot, { recursive: true, force: true });

// ---------------------------------------------------------------------------
console.log("\nagainst the live corpus — mechanism only, never its contents");

const liveRegister = path.join(os.homedir(), "Downloads", "EXECUTION_CLAIMS.md");
if (!fs.existsSync(liveRegister)) {
  skip("appending the probe's register line to a copy of the live register makes its quoted subject findable", "no operator register on this host");
  skip("and the appended line parses as exactly one register line in that copy", "no operator register on this host");
} else {
  /*
   * Both cases below are assertions about the APPEND. Neither says anything
   * about what the register contains beforehand — that would be the shape this
   * whole item exists to remove, and writing it here would make this suite the
   * next instance of it.
   */
  const marker = "c588-probe-subject-0000deadbeef";
  const line = renderRegisterPerturbation({ now: NOW, identity: IDENTITY, item: ITEM, literals: [marker] });
  const copy = `${fs.readFileSync(liveRegister, "utf8")}\n${line}\n`;
  check(
    "appending the probe's register line to a copy of the live register makes its quoted subject findable",
    copy.includes(marker),
  );
  const tail = parseRegisterLines(copy).filter((entry) => entry.agent === IDENTITY);
  check(
    "and the appended line parses as exactly one register line in that copy",
    tail.length === 1 && tail[0].stamp === NOW && tail[0].announcesMerge === false,
    `${tail.length} line(s) attributed to the probe identity`,
  );
}

console.log(`\n${passes} passed, ${failures} failed, ${skipped} skipped`);
process.exitCode = failures > 0 ? 1 : 0;
