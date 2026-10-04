#!/usr/bin/env node
/**
 * Find assertions that an ordinary act of writing can falsify (item C-588).
 *
 * `C-587` found two cases in this directory whose subject was the ABSENCE of a
 * literal from an operator document that agents append to. Both are repaired.
 * Nothing stops the third being written tomorrow, and the reason a durable
 * enumerator was withheld from that change is on the record: the textual
 * approach over-reports badly — 223 assertion sites in the five corpus-reading
 * suites match `!x.includes(...)`, `=== 0`, `not.toMatch` and
 * `toHaveLength(0)`, 329 across all fifteen, and nearly all of them sit over
 * controlled fixtures where absence is a legitimate property. A hand-curated
 * literal list is the thing under repair, and a declaration marker in a
 * comment is explicitly not a control that runs.
 *
 * So this does not parse. It PERTURBS.
 *
 *   1. Copy the operator documents to two sandbox roots, `baseline` and
 *      `perturbed`. Both are copies, so the sandbox path itself cannot be the
 *      difference between the two runs.
 *   2. Append, to the `perturbed` copy only, one line per document in that
 *      document's own grammar, narrating the assertion under test the way an
 *      agent reporting a finding actually would.
 *   3. Run every suite twice, once against each root, with `HOME`,
 *      `SOURCE_EXECUTION_HOME` and `EXEC_OPERATOR_ROOT` pointed at it.
 *   4. Report every case whose verdict FLIPS.
 *
 * A case that flips on an append is self-falsifying by definition. No
 * heuristic is needed to say so, and no literal list is maintained anywhere.
 *
 * What it cannot see, stated because a probe's blind spot is the only thing
 * that makes its silence worth anything: a suite that prints nothing on a pass
 * (`worktree-sweep-hazard.test.mjs`) offers no per-case verdict for its passing
 * cases, so a pass->fail flip there is visible only as a new FAIL line and a
 * moved total. `reportedDialect` names that for every suite in the output.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { isDirectInvocation, unknownFlags } from "./cli-entry.mjs";

/**
 * The operator documents a sandbox root must carry.
 *
 * Hand-curating this list would repeat the defect under repair, so
 * `self-falsifying-assertion-probe.test.mjs` asserts it covers every operator
 * filename named anywhere in `scripts/exec/*.mjs`. Add a document to the
 * scripts and the test fails until it is named here.
 */
export const OPERATOR_DOCUMENTS = [
  "EXECUTION_CLAIMS.md",
  "EXECUTION_BACKLOG_20260918.md",
  "EXECUTION_QUEUE.md",
  "EXECUTION_PULSE_20260918.md",
  "SOURCE_EXECUTION_BOARD_20260917.md",
  "SOURCE_BACKLOG_MASTER.md",
  "source-board-summary.json",
];

/**
 * The documents a perturbation is appended to, each with its own grammar.
 *
 * `backlog-filing` is NOT in the default set, and the reason is the sharpest
 * thing this probe measured. The backlog's filing channel is item position —
 * `## Item <id> — …` or an item-table row — so a dated prose NOTE about an id,
 * however long, gives that id no second filing and flips nothing. Measured:
 * with the `backlog` note vehicle the `C-587` backlog positive stays green at
 * 71/0, and `T-720`'s occurrence count is 3 on both sides of the probe.
 *
 * Reaching it needs a heading in item position, which is a second FILING of
 * that id — and that is the reader's own true positive, not prose. So this
 * vehicle cannot distinguish "the assertion is self-falsifying" from "the
 * reader correctly reported a duplicate filing somebody really made". It is
 * offered because it is the only thing that rediscovers the second known
 * positive, and withheld from the default because on any wider source it files
 * every id a suite mentions.
 */
export const PERTURBATION_VEHICLES = ["register", "backlog", "pulse", "backlog-filing"];

/** The vehicles a run uses when `--vehicle` is not given. */
export const DEFAULT_VEHICLES = ["register", "backlog", "pulse"];

/**
 * Where the perturbation text comes from. The four are NESTED — each contains
 * the one above it — which is what makes the noise floor interpretable: noise
 * can only rise along the chain, so the question a measurement answers is
 * where it stops buying signal.
 *
 *   none            no literals at all; prose only. This is the noise floor.
 *   case-names      the suite's own case labels.
 *   source-literals every distinct string literal in the suite source.
 *   whole-source    the suite source, verbatim. The maximal perturbation.
 *
 * `case-names` is offered because it is the obvious choice and it is
 * insufficient: neither literal `C-587` repaired ever appeared in a case name.
 */
export const PERTURBATION_SOURCES = [
  "none",
  "case-names",
  "source-literals",
  "whole-source",
];

// ---------------------------------------------------------------------------
// Reading a suite's verdicts
// ---------------------------------------------------------------------------

/**
 * The three output dialects in this directory, discovered by reading all
 * fifteen suites rather than assumed from one.
 *
 *   pass-fail-skip  `  PASS  <name>` / `  FAIL  <name>` / `  SKIP  <name> — why`
 *   ok-fail         `  ok   <name>` / `  FAIL <name>`
 *   fail-only       nothing on a pass; `FAIL <name>` on stderr
 *
 * `fail-only` is why this returns `visiblePasses: false` rather than an empty
 * case list that would read as "no cases".
 */
const DIALECTS = {
  "pass-fail-skip": { visiblePasses: true },
  "ok-fail": { visiblePasses: true },
  "fail-only": { visiblePasses: false },
};

const TOTALS = /^\s*(\d+)\s+passed,\s+(\d+)\s+failed(?:,\s+(\d+)\s+skipped)?\s*$/m;

/**
 * Per-case verdicts and totals from one suite run.
 *
 * Case names are the key, so a suite that prints the same label twice collapses
 * them; `duplicateNames` reports that rather than hiding it, because a collapsed
 * pair could mask a flip.
 */
export function parseSuiteOutput({ stdout = "", stderr = "", status = 0 } = {}) {
  const cases = new Map();
  const duplicateNames = [];
  const record = (name, verdict) => {
    const key = name.trim();
    if (!key) return;
    if (cases.has(key) && cases.get(key) !== verdict) duplicateNames.push(key);
    else if (cases.has(key)) duplicateNames.push(key);
    cases.set(key, verdict);
  };

  let sawPassFailSkip = false;
  let sawOkFail = false;

  for (const line of `${stdout}\n${stderr}`.split("\n")) {
    let m = line.match(/^ {2}PASS {2}(.+)$/);
    if (m) {
      sawPassFailSkip = true;
      record(m[1], "pass");
      continue;
    }
    m = line.match(/^ {2}SKIP {2}(.+?)(?: — .*)?$/);
    if (m) {
      sawPassFailSkip = true;
      record(m[1], "skip");
      continue;
    }
    m = line.match(/^ {2}FAIL {2}(.+)$/);
    if (m) {
      sawPassFailSkip = true;
      record(m[1], "fail");
      continue;
    }
    m = line.match(/^ {2}ok {3}(.+)$/);
    if (m) {
      sawOkFail = true;
      record(m[1], "pass");
      continue;
    }
    m = line.match(/^ {2}FAIL (.+)$/);
    if (m) {
      sawOkFail = true;
      record(m[1], "fail");
      continue;
    }
    m = line.match(/^FAIL (.+)$/);
    if (m) {
      record(m[1], "fail");
      continue;
    }
  }

  const dialect = sawPassFailSkip
    ? "pass-fail-skip"
    : sawOkFail
      ? "ok-fail"
      : "fail-only";

  const totalsMatch = `${stdout}\n${stderr}`.match(TOTALS);
  const totals = totalsMatch
    ? {
        passed: Number(totalsMatch[1]),
        failed: Number(totalsMatch[2]),
        skipped: totalsMatch[3] === undefined ? null : Number(totalsMatch[3]),
      }
    : null;

  return {
    dialect,
    visiblePasses: DIALECTS[dialect].visiblePasses,
    cases,
    duplicateNames,
    totals,
    status,
  };
}

/**
 * What moved between two runs of one suite.
 *
 * A flip is reported three ways because one suite dialect cannot supply the
 * first: `flips` names cases whose verdict changed, `totalsDelta` catches a
 * move no per-case line could show, and `statusChanged` catches a suite that
 * died rather than reported.
 *
 * `appeared` and `vanished` are kept separate from `flips`: a case the
 * perturbed run runs and the baseline did not is a different finding from one
 * that changed its mind, and conflating them would report a skip boundary as a
 * falsification.
 */
export function diffSuiteRuns(baseline, perturbed) {
  const flips = [];
  const appeared = [];
  const vanished = [];

  for (const [name, verdict] of perturbed.cases) {
    if (!baseline.cases.has(name)) {
      appeared.push({ name, verdict });
      continue;
    }
    const was = baseline.cases.get(name);
    if (was !== verdict) flips.push({ name, from: was, to: verdict });
  }
  for (const [name, verdict] of baseline.cases) {
    if (!perturbed.cases.has(name)) vanished.push({ name, verdict });
  }

  const delta = (a, b) => (a === null || b === null ? null : b - a);
  const totalsDelta =
    baseline.totals && perturbed.totals
      ? {
          passed: delta(baseline.totals.passed, perturbed.totals.passed),
          failed: delta(baseline.totals.failed, perturbed.totals.failed),
          skipped: delta(baseline.totals.skipped, perturbed.totals.skipped),
        }
      : null;

  const totalsChanged = Boolean(
    totalsDelta &&
      (totalsDelta.passed !== 0 ||
        totalsDelta.failed !== 0 ||
        (totalsDelta.skipped !== null && totalsDelta.skipped !== 0)),
  );

  return {
    flips,
    appeared,
    vanished,
    totalsDelta,
    totalsChanged,
    statusChanged: baseline.status !== perturbed.status,
    moved:
      flips.length > 0 ||
      appeared.length > 0 ||
      vanished.length > 0 ||
      totalsChanged ||
      baseline.status !== perturbed.status,
  };
}

// ---------------------------------------------------------------------------
// Where the perturbation text comes from
// ---------------------------------------------------------------------------

const STRING_LITERAL =
  /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\$]|\\.|\$(?!\{))*)`/g;

/**
 * Every distinct string literal in a suite's source, in order of first
 * appearance.
 *
 * This is a scan of a test file, not a parser: a literal inside a comment is
 * returned too. That direction is deliberate. A missed literal makes the probe
 * silent about a real case, which is the failure that matters; an extra one
 * only widens the perturbation, and the noise that costs is measured rather
 * than guessed.
 */
export function stringLiterals(source) {
  const out = [];
  const seen = new Set();
  for (const match of String(source).matchAll(STRING_LITERAL)) {
    const raw = match[1] ?? match[2] ?? match[3] ?? "";
    const value = raw.replace(/\\n/g, " ").replace(/\\(.)/g, "$1").trim();
    if (!value || value.length < 3) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/**
 * The first argument of every `check` / `eq` / `skip` call: the case labels.
 *
 * Offered as its own source so the measurement can show what it misses, which
 * is the point the item makes about it.
 */
export function caseNames(source) {
  const out = [];
  const seen = new Set();
  const call = /\b(?:check|eq|skip|assert|ok)\s*\(\s*(?:"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\$]|\\.|\$(?!\{))*)`)/g;
  for (const match of String(source).matchAll(call)) {
    const raw = match[1] ?? match[2] ?? match[3] ?? "";
    const value = raw.replace(/\\n/g, " ").replace(/\\(.)/g, "$1").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/** The literals one source mode contributes for one suite's source. */
export function perturbationLiterals(source, mode) {
  switch (mode) {
    case "none":
      return [];
    case "case-names":
      return caseNames(source);
    case "source-literals":
      return stringLiterals(source);
    case "whole-source":
      return [String(source)];
    default:
      throw new Error(
        `unknown perturbation source \`${mode}\` — one of ${PERTURBATION_SOURCES.join(", ")}`,
      );
  }
}

// ---------------------------------------------------------------------------
// The three grammars
// ---------------------------------------------------------------------------

/**
 * Collapse to one physical line.
 *
 * A register line IS a line: the register's own parser splits on newlines and
 * reads a stamp at the head, so a perturbation spanning two lines would be two
 * register lines, one of them unstamped prose. The pipe is the field separator
 * in that grammar and is neutralised for the same reason.
 */
function oneLine(text) {
  return String(text).replace(/[\r\n]+/g, " ").replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

function quoteLiterals(literals, limit) {
  const used = limit === undefined ? literals : literals.slice(0, limit);
  return used.map((value) => `\`${oneLine(value)}\``).join(", ");
}

/**
 * One register line, in the register's own grammar, narrating the assertion
 * under test the way an agent reporting a finding would.
 *
 * It announces no merge and names nothing as a handle — it quotes. That is the
 * exact shape `C-587` falsified its own case with, and it is also the shape of
 * every real line that caused the drift: prose about a calibration rather than
 * anybody reporting an event.
 */
export function renderRegisterPerturbation({ now, identity, item, literals = [] }) {
  /*
   * The two pipes after the stamp and the identity are the GRAMMAR and must
   * survive; every pipe in the body is neutralised. Those are opposite
   * treatments of the same character, so the head is assembled after the body
   * has been flattened rather than with it. Running the whole line through
   * `oneLine` turned this line's own `stamp | identity |` into slashes, and the
   * register's parser then read its agent as `unknown` — caught by the case
   * asserting the parser recovers the identity it was given.
   */
  const body = `item ${item} perturbation probe — PROBE LINE, NOT A CLAIM AND NOT A RELEASE. Appended to a sandbox copy by scripts/exec/self-falsifying-assertion-probe.mjs to establish whether any assertion in this directory can be falsified by an ordinary act of writing. It announces no merge, claims no item and names no pull request as a handle; it quotes, which is what the lines that caused the measured drift did.${
    literals.length
      ? ` The assertion subjects under test, quoted rather than named: ${quoteLiterals(literals)}.`
      : " No literal is quoted on this line; this is the noise floor."
  }`;
  return `${now} | ${identity} | ${oneLine(body)}`;
}

/** Every lane id a set of literals mentions, in order of first appearance. */
export function mentionedItemIds(literals) {
  return [
    ...new Set(
      literals.flatMap((value) => String(value).match(/\b[CDUT]-\d{3}\b/g) ?? []),
    ),
  ];
}

/**
 * One dated backlog note section, in the backlog's own shape: a heading that is
 * NOT in item position, and a prose body quoting the subjects.
 *
 * This is what an agent writing down a finding actually appends, and it is why
 * it flips nothing in the backlog's filing channel — see `PERTURBATION_VEHICLES`.
 */
export function renderBacklogPerturbation({ now, identity, item, literals = [] }) {
  const mentioned = mentionedItemIds(literals);
  const body = literals.length
    ? `The subjects under test, quoted rather than named: ${quoteLiterals(literals)}.`
    : "No literal is quoted in this note; this is the noise floor.";
  return [
    "",
    `## Added ${now} by \`${identity}\` — perturbation probe for item ${item}`,
    "",
    "PROBE NOTE, NOT A FILING. Appended to a sandbox copy by",
    "`scripts/exec/self-falsifying-assertion-probe.mjs`. Nothing here is claimed, taken or decided.",
    "",
    mentioned.length
      ? `Ids this note discusses, named in prose and deliberately not in item position: ${mentioned.join(" ")}.`
      : "This note discusses no lane id.",
    "",
    body,
    "",
  ].join("\n");
}

/**
 * One backlog heading per id, in ITEM POSITION — a second filing of each.
 *
 * Read `PERTURBATION_VEHICLES` before using this. It is the only vehicle that
 * reaches the backlog's filing channel, and it reaches it by doing the thing
 * the reader is built to report.
 */
export function renderBacklogFilingPerturbation({ now, identity, item, literals = [] }) {
  const mentioned = mentionedItemIds(literals);
  if (mentioned.length === 0) {
    return [
      "",
      `## Added ${now} by \`${identity}\` — perturbation probe for item ${item}`,
      "",
      "No lane id appears in this suite's literals, so this vehicle files nothing.",
      "",
    ].join("\n");
  }
  const out = [""];
  for (const id of mentioned) {
    out.push(
      `## Item ${id} — PROBE FILING, appended to a sandbox copy by \`scripts/exec/self-falsifying-assertion-probe.mjs\` for item ${item}; this is a second filing of this id on purpose, by \`${identity}\` at ${now}`,
      "",
    );
  }
  return out.join("\n");
}

/** One dated pulse entry, in the pulse file's own shape. */
export function renderPulsePerturbation({ now, identity, item, literals = [] }) {
  const body = literals.length
    ? `Subjects under test, quoted: ${quoteLiterals(literals)}.`
    : "No literal quoted; noise floor.";
  return [
    "",
    `### ${now} — \`${identity}\` — perturbation probe for item ${item}`,
    "",
    "PROBE ENTRY, appended to a sandbox copy. No work was done and nothing shipped.",
    "",
    body,
    "",
  ].join("\n");
}

const VEHICLE_RENDER = {
  register: { file: "EXECUTION_CLAIMS.md", render: renderRegisterPerturbation },
  backlog: { file: "EXECUTION_BACKLOG_20260918.md", render: renderBacklogPerturbation },
  pulse: { file: "EXECUTION_PULSE_20260918.md", render: renderPulsePerturbation },
  "backlog-filing": {
    file: "EXECUTION_BACKLOG_20260918.md",
    render: renderBacklogFilingPerturbation,
  },
};

/** What each vehicle appends, keyed by the document it appends to. */
export function perturbationPlan({ now, identity, item, literals = [], vehicles = DEFAULT_VEHICLES }) {
  const plan = [];
  for (const vehicle of vehicles) {
    const spec = VEHICLE_RENDER[vehicle];
    if (!spec) {
      throw new Error(
        `unknown perturbation vehicle \`${vehicle}\` — one of ${PERTURBATION_VEHICLES.join(", ")}`,
      );
    }
    plan.push({
      vehicle,
      file: spec.file,
      append: `\n${spec.render({ now, identity, item, literals })}\n`,
    });
  }
  return plan;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function runCli() {
  const VALUE_FLAGS = [
    "--repo",
    "--operator-root",
    "--suite-dir",
    "--sandbox",
    "--source",
    "--suite",
    "--vehicle",
    "--item",
    "--identity",
    "--now",
    "--timeout-ms",
  ];
  const BOOL_FLAGS = ["--json", "--keep-sandbox", "--quiet"];

  const argv = process.argv.slice(2);
  const unknown = unknownFlags(argv, { value: VALUE_FLAGS, boolean: BOOL_FLAGS });
  if (unknown.length) {
    console.error(
      `${unknown.join(", ")} ${unknown.length === 1 ? "is not a flag" : "are not flags"} this command reads. An unrecognised flag is parsed as nothing, so the probe would have run a different measurement than the one you asked for. Nothing was run.`,
    );
    console.error(`usage: [--repo <dir>] [--operator-root <dir>] [--suite-dir <dir>]
       [--source ${PERTURBATION_SOURCES.join("|")}] [--suite <name>]...
       [--vehicle ${PERTURBATION_VEHICLES.join("|")}]... [--sandbox <dir>]
       [--item <id>] [--identity <base#run>] [--now <ISO>] [--timeout-ms <n>]
       [--json] [--keep-sandbox] [--quiet]`);
    process.exit(2);
  }

  const one = (flag, fallback) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  const many = (flag) =>
    argv.reduce((out, token, i) => (token === flag && argv[i + 1] ? [...out, argv[i + 1]] : out), []);
  const has = (flag) => argv.includes(flag);

  const repo = path.resolve(one("--repo", process.cwd()));
  const operatorRoot = path.resolve(
    one("--operator-root", process.env.SOURCE_EXECUTION_HOME ?? path.join(os.homedir(), "Downloads")),
  );
  const suiteDir = path.resolve(one("--suite-dir", path.join(repo, "scripts", "exec")));
  const source = one("--source", "source-literals");
  const vehicles = many("--vehicle").length ? many("--vehicle") : DEFAULT_VEHICLES;
  const item = one("--item", "C-588");
  const identity = one("--identity", "self-falsifying-assertion-probe#local");
  const now = one("--now", new Date().toISOString().replace(/\.\d{3}Z$/, "Z"));
  const timeout = Number(one("--timeout-ms", "600000"));
  const json = has("--json");
  const quiet = has("--quiet");

  if (!PERTURBATION_SOURCES.includes(source)) {
    console.error(`--source \`${source}\` is not one of ${PERTURBATION_SOURCES.join(", ")}. Nothing was run.`);
    process.exit(2);
  }
  for (const vehicle of vehicles) {
    if (!PERTURBATION_VEHICLES.includes(vehicle)) {
      console.error(`--vehicle \`${vehicle}\` is not one of ${PERTURBATION_VEHICLES.join(", ")}. Nothing was run.`);
      process.exit(2);
    }
  }

  const only = new Set(many("--suite").map((name) => (name.endsWith(".test.mjs") ? name : `${name}.test.mjs`)));
  const suites = fs
    .readdirSync(suiteDir)
    .filter((name) => name.endsWith(".test.mjs"))
    .filter((name) => only.size === 0 || only.has(name))
    .sort();

  if (suites.length === 0) {
    console.error(`no suites selected under ${suiteDir}. Nothing was run.`);
    process.exit(2);
  }

  const missing = OPERATOR_DOCUMENTS.filter((name) => !fs.existsSync(path.join(operatorRoot, name)));
  if (missing.length === OPERATOR_DOCUMENTS.length) {
    console.error(
      `no operator document is present under ${operatorRoot}, so there is nothing to perturb and a silent run would read as a clean one. Nothing was run.`,
    );
    process.exit(2);
  }

  const sandboxRoot = one("--sandbox") ? path.resolve(one("--sandbox")) : fs.mkdtempSync(path.join(os.tmpdir(), "c588-probe-"));
  const roots = {
    baseline: path.join(sandboxRoot, "baseline"),
    perturbed: path.join(sandboxRoot, "perturbed"),
  };

  // Both sides are copies, so the sandbox path cannot be the difference.
  for (const root of Object.values(roots)) {
    fs.mkdirSync(path.join(root, "Downloads"), { recursive: true });
    for (const name of OPERATOR_DOCUMENTS) {
      const from = path.join(operatorRoot, name);
      if (fs.existsSync(from)) fs.copyFileSync(from, path.join(root, "Downloads", name));
    }
  }

  const log = (line) => {
    if (!quiet && !json) console.log(line);
  };

  log(`probe: ${suites.length} suite(s) under ${suiteDir}`);
  log(`       operator root ${operatorRoot} -> sandbox ${sandboxRoot}`);
  log(`       source \`${source}\`, vehicles ${vehicles.join("+")}, ${missing.length} document(s) absent and skipped`);
  log("");

  /*
   * `HOME` is the only lever, and the two obvious companions are DELETED
   * rather than set. Measured, not assumed: this probe's first form also set
   * `SOURCE_EXECUTION_HOME` and `EXEC_OPERATOR_ROOT`, and that took
   * `id-collision.test.mjs` from 71 passed / 0 failed to 70 / 1 in the
   * BASELINE run, before any perturbation. The case it broke is the one
   * asserting the tool says NOT READ when no register is present: those two
   * variables are how a suite points its own fixture at a controlled corpus,
   * so setting them globally overrode the absence that case constructs.
   *
   * The baseline control contained it — the case was already red, so it could
   * not be reported as a flip — but a red baseline case can no longer flip
   * pass -> fail, so the probe was blind on it. Deleting the variables leaves
   * `os.homedir()`, which honours `HOME`, as the single substitution, and every
   * suite that reads `SOURCE_EXECUTION_HOME` falls back to it.
   */
  const runSuite = (suiteFile, root) => {
    const env = { ...process.env, HOME: root };
    delete env.SOURCE_EXECUTION_HOME;
    delete env.EXEC_OPERATOR_ROOT;
    try {
      const stdout = execFileSync(process.execPath, [path.join(suiteDir, suiteFile)], {
        cwd: repo,
        env,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout,
        maxBuffer: 256 * 1024 * 1024,
      });
      return parseSuiteOutput({ stdout, stderr: "", status: 0 });
    } catch (error) {
      return parseSuiteOutput({
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? String(error.message ?? ""),
        status: error.status ?? 1,
      });
    }
  };

  const results = [];
  for (const suiteFile of suites) {
    const source_ = fs.readFileSync(path.join(suiteDir, suiteFile), "utf8");
    const literals = perturbationLiterals(source_, source);

    // The perturbation is rewritten per suite, because the literals are the
    // suite's own. Re-copy the perturbed documents each time so one suite's
    // append never lands on top of another's.
    for (const name of OPERATOR_DOCUMENTS) {
      const from = path.join(operatorRoot, name);
      if (fs.existsSync(from)) fs.copyFileSync(from, path.join(roots.perturbed, "Downloads", name));
    }
    const plan = perturbationPlan({ now, identity, item, literals, vehicles });
    let appendedBytes = 0;
    for (const step of plan) {
      const target = path.join(roots.perturbed, "Downloads", step.file);
      if (!fs.existsSync(target)) continue;
      fs.appendFileSync(target, step.append);
      appendedBytes += Buffer.byteLength(step.append);
    }

    const baseline = runSuite(suiteFile, roots.baseline);
    const perturbed = runSuite(suiteFile, roots.perturbed);
    const diff = diffSuiteRuns(baseline, perturbed);

    results.push({
      suite: suiteFile,
      reportedDialect: baseline.dialect,
      visiblePasses: baseline.visiblePasses,
      literalCount: literals.length,
      appendedBytes,
      baseline: { totals: baseline.totals, status: baseline.status, cases: baseline.cases.size },
      perturbed: { totals: perturbed.totals, status: perturbed.status, cases: perturbed.cases.size },
      ...diff,
    });

    const mark = diff.moved ? "MOVED" : "steady";
    log(
      `  ${mark.padEnd(7)} ${suiteFile.padEnd(38)} ${literals.length} literal(s), +${appendedBytes}B  ` +
        `${baseline.totals ? `${baseline.totals.passed}/${baseline.totals.failed}` : "?"} -> ` +
        `${perturbed.totals ? `${perturbed.totals.passed}/${perturbed.totals.failed}` : "?"}` +
        `${baseline.visiblePasses ? "" : "  [no per-case pass lines]"}`,
    );
    for (const flip of diff.flips) log(`          FLIP ${flip.from} -> ${flip.to}: ${flip.name}`);
    for (const row of diff.appeared) log(`          APPEARED (${row.verdict}): ${row.name}`);
    for (const row of diff.vanished) log(`          VANISHED (was ${row.verdict}): ${row.name}`);
    if (diff.statusChanged) log(`          EXIT ${baseline.status} -> ${perturbed.status}`);
  }

  const falsifiable = results.flatMap((row) =>
    row.flips.filter((flip) => flip.from === "pass" && flip.to === "fail").map((flip) => ({ suite: row.suite, ...flip })),
  );
  const moved = results.filter((row) => row.moved);

  const report = {
    item,
    now,
    source,
    vehicles,
    repo,
    operatorRoot,
    suiteDir,
    sandboxRoot,
    documentsAbsent: missing,
    suiteCount: suites.length,
    movedCount: moved.length,
    falsifiable,
    blindSuites: results.filter((row) => !row.visiblePasses).map((row) => row.suite),
    results: results.map((row) => ({ ...row, flips: row.flips, appeared: row.appeared, vanished: row.vanished })),
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("");
    if (falsifiable.length === 0 && moved.length === 0) {
      console.log(
        `No case moved: ${suites.length} suite(s), source \`${source}\`, vehicles ${vehicles.join("+")}. ` +
          `No assertion in this set was falsified by the appended text.`,
      );
    } else {
      console.log(
        `${falsifiable.length} case(s) went pass -> fail on an append; ${moved.length} suite(s) moved in any way.`,
      );
      for (const row of falsifiable) console.log(`  SELF-FALSIFYING  ${row.suite}  ${row.name}`);
    }
    if (report.blindSuites.length) {
      console.log(
        `\n${report.blindSuites.length} suite(s) print nothing on a pass, so a pass -> fail there is visible only as a FAIL line and a moved total: ${report.blindSuites.join(", ")}`,
      );
    }
    console.log(`\nsandbox ${sandboxRoot}${has("--keep-sandbox") ? " (kept)" : " (removed)"}`);
  }

  if (!has("--keep-sandbox")) fs.rmSync(sandboxRoot, { recursive: true, force: true });

  // Exit 1 when something was falsified: a probe that always exits 0 is a probe
  // whose silence nobody can use.
  process.exit(falsifiable.length > 0 ? 1 : 0);
}

if (isDirectInvocation(import.meta.url)) runCli();
