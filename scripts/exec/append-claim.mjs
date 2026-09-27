#!/usr/bin/env node
/**
 * Claim-append gate wiring (item T-708).
 *
 * T-706 shipped `--preclaim` on `register-time-authority.mjs`: the ownership
 * check an agent runs BEFORE appending a claim. It is correct, it was proven
 * on the real register, and it exits non-zero on the two verdicts that should
 * stop a claim. What it never had was a caller. The claim step stayed "an
 * agent chooses to run a control", which is the same shape as the gate that
 * proved a control existed by finding its name in a file — the defect this
 * backlog exists against — with the difference that this one was one piece of
 * wiring away.
 *
 * This file is that wiring. It is the only sanctioned way to append a claim to
 * the register, and its whole contract is one sentence:
 *
 *   the gate decides, and a refusal means nothing is written.
 *
 * Two properties are deliberate, because both are ways an "available" control
 * quietly stops being a wired one:
 *
 *   It FAILS CLOSED. A gate that cannot be found, cannot be spawned, or exits
 *   in a way this caller does not understand refuses the claim. Appending
 *   because the check errored is indistinguishable, from the register's side,
 *   from never having run it.
 *
 *   It REFUSES A CHECK IT CANNOT PROVE RAN. Node's flag parsing ignores what
 *   it does not recognise, so asking an older gate for a check it does not
 *   implement yields a silent pass. Any gate argument this helper forwards
 *   must appear in the installed gate's own usage text, or the claim stops.
 *
 * It does not re-implement or second-guess the gate: the verdict comes from
 * the gate's exit status, so a rule added there governs here the day it lands.
 *
 *   node scripts/exec/append-claim.mjs --file <register.md> \
 *        --item <id> --identity <base-agent#run-id> --message <text> \
 *        [--action claim|release|abstain] [--branch <name>] [--files a,b] \
 *        [--strict] [--dry-run] \
 *        [--now ISO] [--window-hours 3] [--gate <path>] [--gate-arg <flag>]...
 *
 * Exit 0 appended (or shown, under --dry-run); 1 the gate refused; 2 usage,
 * including a gate argument the installed gate does not advertise; 3 the gate
 * could not be run at all.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { announcesRelease, announcesAbstention } from "./register-time-authority.mjs";
import { SILENT, reviewReleaseLine } from "./signed-in-proof-reconcile.mjs";
import { unknownFlags } from "./cli-entry.mjs";
import {
  describeQueueProvenance,
  evaluateQueueProvenance,
  isRepoOwned,
  queuePathBesideRegister,
} from "./queue-provenance.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GATE = path.join(HERE, "register-time-authority.mjs");
const DEFAULT_QUEUE_GENERATOR = path.join(HERE, "build-execution-queue.mjs");

const EXIT_OK = 0;
const EXIT_REFUSED = 1;
const EXIT_USAGE = 2;
const EXIT_GATE_UNUSABLE = 3;

export const USAGE =
  "usage: --file <register.md> --item <id> --identity <base-agent#run-id> --message <text>\n" +
  "       [--action claim|release|abstain] [--branch <name>] [--files a,b]\n" +
  "       [--strict] [--dry-run] [--now ISO] [--queue <EXECUTION_QUEUE.md>]\n" +
  "       [--repo <dir>] [--records <dir>] [--base <ref>]\n" +
  "       [--window-hours 3] [--gate <path>] [--gate-arg <flag>]...";

/**
 * This CLI's own vocabulary (item T-748).
 *
 * `value` flags take the NEXT argv token — which is therefore never read as a
 * flag itself, so `--gate-arg --github` and a `--message` quoting a flag both
 * behave. `boolean` flags stand alone. Anything else in flag position is
 * refused below rather than ignored.
 *
 * Declared, not derived from USAGE: the usage text cannot say which flags take
 * a value, and deriving the answer from its punctuation would make a
 * documentation typo into a parsing change. The two lists are pinned to each
 * other by the suite instead.
 */
export const FLAG_SPEC = {
  value: [
    "--file", "--item", "--identity", "--message", "--files", "--action",
    "--branch", "--now", "--window-hours", "--gate", "--gate-arg", "--queue",
    "--repo", "--records", "--base",
  ],
  boolean: ["--strict", "--dry-run"],
};

/**
 * The flags the installed gate names in its own usage text.
 *
 * Read from the gate rather than hard-coded, so this helper does not have to
 * be edited every time the gate grows a rule — and, more to the point, so a
 * forwarded flag that would be silently ignored is caught instead.
 */
export function advertisedFlags(usageText) {
  return new Set(String(usageText).match(/--[a-z][a-z0-9-]*/g) ?? []);
}

/**
 * The claim record. One line, in the pipe grammar the register's own reader
 * attributes — `<stamp> | <identity> | item <id> ...` — because a line that
 * reads as prose holds nothing, however carefully it is worded.
 */
export const ACTIONS = new Set(["claim", "release", "abstain"]);

/**
 * The head of the message field, in the grammar the register's OWN reader
 * parses — `announcesRelease` and `announcesAbstention`, imported above rather
 * than restated here so the writer and the reader cannot drift apart.
 *
 * Until T-712 this was the literal `item <id> claimed`, whatever the record
 * actually said. A run that handed item T-708 back at 23:08:45Z with the words
 * `RELEASED item T-708 — merged, DEPLOYED ... all files free` got
 * `item T-708 claimed on branch \`...\` — RELEASED item T-708 — ...`, and
 * fourteen minutes later the file gate printed that line as the HOLDER of the
 * files it had just released. Ownership in this register turns on one word,
 * and the tool was hard-coding it.
 */
export function announcementHead(action, item, branch) {
  if (action === "release") {
    const parts = [`RELEASED item ${item}`];
    if (branch) parts.push(`on branch \`${branch}\``);
    return parts.join(" ");
  }
  // An abstention carries no branch: `announcesAbstention` reads NOT TAKEN in
  // the slot directly after the id, and anything between them hides it.
  if (action === "abstain") return `item ${item} NOT TAKEN`;
  const parts = [`item ${item} claimed`];
  if (branch) parts.push(`on branch \`${branch}\``);
  return parts.join(" ");
}

const DEFAULT_RECORD_DIR = "docs/releases/records";
const DEFAULT_BASE = "origin/main";

/**
 * The release records this branch adds or changes (item C-528).
 *
 * The record a release is about is the one its own branch introduces, which is
 * a question git answers without a pull request id — and at the moment a
 * release line is written there may be no local commit carrying one, because
 * the squash lands on `main` and the agent is standing on its feature branch.
 *
 * Returns `{ records, undetermined }`. A repository this cannot read makes the
 * answer UNDETERMINED and says so; it does not return an empty list, because
 * "no record contradicts this line" and "I could not look" are different
 * statements and collapsing them is how a check stops being one.
 */
export function releaseRecordsInBranch({
  repo,
  dir = DEFAULT_RECORD_DIR,
  base = DEFAULT_BASE,
  git = runGit,
} = {}) {
  let out;
  try {
    out = git(["diff", "--name-only", "--diff-filter=AM", `${base}...HEAD`, "--", dir], repo);
  } catch (error) {
    const detail = String(error?.stderr ?? error?.message ?? error).trim().split("\n")[0];
    return { records: [], undetermined: `git could not compare ${base}...HEAD in ${repo}: ${detail}` };
  }
  const records = [];
  for (const rel of out.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const abs = path.join(repo, rel);
    if (!fs.existsSync(abs)) continue;
    records.push({ file: rel, text: fs.readFileSync(abs, "utf8") });
  }
  return { records, undetermined: null };
}

function runGit(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/**
 * What this line would leave behind in the record it releases (item C-528).
 *
 * Nine release records on `main` assert a signed-in debt the register says was
 * already paid. None of them is a wrong verdict; every one is a writing order.
 * The record is authored before the merge, so it can only ever say the proof
 * has not run; the register line is appended after the deploy, when the proof
 * HAS run; and nothing between the two ever reopens the record. The debt is
 * then recoverable only from an operator-root register that CI cannot see.
 *
 * So the check runs here, on the one sanctioned writer of a register line, at
 * the one moment both accounts are in hand. It cannot repair the record — that
 * file is already merged — and it does not pretend to: it names the record, the
 * two accounts, and the append-only repair that is owed.
 *
 * A line that says nothing about a signed-in proof cannot contradict anything,
 * and short-circuits before git is touched.
 */
export function describeRecordContradiction(review) {
  const lines = [];
  for (const row of review.contradicted) {
    lines.push(
      `  record:   ${row.file}`,
      `    says:     ${row.recordSays} — ${String(row.recordEvidence ?? "").trim()}`,
      `    register: ${row.registerSays} — ${String(row.registerEvidence ?? "").trim()}`,
    );
  }
  lines.push(
    "  This record is already merged, so this line cannot repair it. What is owed is an",
    "  APPEND-ONLY section on the record — that the replay ran, when, what it found, and the",
    "  id carrying any residual — never a rewrite of the original assertion (item C-528).",
  );
  return lines.join("\n");
}

export function buildClaimLine({ stamp, identity, item, message, branch, files, verdict, action = "claim" }) {
  const parts = [announcementHead(action, item, branch)];
  let line = `${stamp} | ${identity} | ${parts.join(" ")} — ${message.trim()}`;
  line += ` Stamp is a literal clock read at the instant of writing, per T-457; nothing carried forward.`;
  line += ` Appended through the T-708 gate wiring; pre-claim verdict \`${verdict}\`.`;
  if (files) line += ` files: ${files}`;
  return line;
}

function fail(code, message) {
  console.error(message);
  process.exit(code);
}

function main(argv) {
  /*
   * T-748. Before anything else, because the cost of getting this wrong is
   * measured in what was WRITTEN, not in what was read.
   *
   * Node ignores an argument it does not recognise, so `--release` — which is
   * not a flag; the spelling is `--action release` — passed every gate below
   * and produced a normal `item <id> claimed` line at exit 0. The run believed
   * it had handed its work back and left a LIVE CLAIM on its files, and every
   * sibling for the next three hours was refused those files by a holder that
   * was finished. That is the false-`pending` shape, reached from the one path
   * the protocol sanctions precisely so the line cannot be got wrong by hand.
   *
   * This helper already refused a `--gate-arg` the installed gate does not
   * advertise, for exactly this reason and in almost these words. It simply
   * never asked the question of its own argv.
   *
   * Fail closed, same as every other control here: name the flag, exit
   * non-zero, append nothing.
   */
  const unrecognised = unknownFlags(argv, FLAG_SPEC);
  if (unrecognised.length) {
    fail(
      EXIT_USAGE,
      `${unrecognised.join(", ")} ${unrecognised.length > 1 ? "are not flags" : "is not a flag"} ` +
        "this command reads. An unrecognised flag is parsed as nothing, so the thing you asked " +
        "for would not happen and the default action would be recorded instead — a claim, if you " +
        "meant `--action release`. Nothing was appended.\n" +
        USAGE,
    );
  }

  const has = (name) => argv.includes(name);
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const allFlagValues = (name) => {
    const out = [];
    for (let i = 0; i < argv.length; i += 1) if (argv[i] === name && argv[i + 1]) out.push(argv[i + 1]);
    return out;
  };

  const file = flag("--file");
  const item = flag("--item");
  const identity = flag("--identity");
  const message = flag("--message");
  if (!file || !item || !identity) fail(EXIT_USAGE, USAGE);

  // An argument that arrived empty by accident is a usage error, not an empty
  // claim. The same substitution one level down cost T-707 a finding: an empty
  // file list printed "0 contended" and exited 0.
  if (message === undefined || !message.trim()) {
    fail(EXIT_USAGE, `a claim needs a message saying what is being taken and why.\n${USAGE}`);
  }
  const files = flag("--files");
  if (files !== undefined && !files.trim()) {
    fail(EXIT_USAGE, `--files was given but is empty; omit it or name the paths.\n${USAGE}`);
  }

  // T-712. What this record ANNOUNCES is not decoration: the register's
  // ownership reader takes the verb at the head of the message field and
  // nothing else. A typo here would silently write a claim, so an unknown
  // action stops rather than falling back to the default.
  const action = flag("--action") ?? "claim";
  if (!ACTIONS.has(action)) {
    fail(
      EXIT_USAGE,
      `--action ${action} is not one of ${[...ACTIONS].join(", ")}. The head verb of this record ` +
        "is what the register's ownership reader parses, so an unrecognised action is refused " +
        `rather than written as a claim.\n${USAGE}`,
    );
  }

  // A message that announces one thing under an action that announces another
  // is precisely the record that caused this item: the head says `claimed` and
  // the body says `RELEASED ... all files free`, and the head wins. Refuse,
  // and name the flag, rather than writing a line that contradicts itself.
  const asMessage = `x | y | ${message.trim()}`;
  if (action === "claim" && announcesRelease(asMessage)) {
    fail(
      EXIT_USAGE,
      "this message announces a RELEASE but --action is `claim`, so the record would open " +
        "`item ... claimed` and the register would keep reading it as a hold. " +
        "Pass --action release.",
    );
  }
  if (action === "claim" && announcesAbstention(asMessage)) {
    fail(
      EXIT_USAGE,
      "this message announces an ABSTENTION but --action is `claim`, so the record would open " +
        "`item ... claimed` and the register would read it as a hold on every file it names. " +
        "Pass --action abstain.",
    );
  }
  if (!fs.existsSync(file)) fail(EXIT_USAGE, `no register at ${file}`);

  /*
   * Which generator wrote the queue this item came from (item T-720).
   *
   * A claim asserts that its item is the first unclaimed row of a lane in the
   * generated queue. That assertion is only worth anything if the queue was
   * written by the generator this repository reviews. The superseded copies in
   * the operator root still run and have drifted: on 2026-09-23 one of them had
   * written the live queue, which offered 61 claimable rows where the repo-owned
   * pair offers 1 and reported no live claims while three were live. The only
   * defence was a prose line in the artifact, and two consecutive runs missed
   * it. So the check runs here, on the sanctioned path, rather than remaining an
   * instruction — T-708 measured what an available-and-uninvoked control is
   * worth from the register's side, and the answer was nothing.
   *
   * ONLY a claim is gated, and the asymmetry is the point. A release and an
   * abstention TAKE nothing; the moment a queue is stale is exactly the moment a
   * holder most needs to hand work back, and refusing that would strand a live
   * claim behind a regeneration and push the correction into a hand-written
   * line. This is the same reasoning that lets an abstention past a refused
   * gate below.
   *
   * Before the gate, so a stale queue costs no register read.
   */
  if (action === "claim") {
    const provenance = evaluateQueueProvenance({
      queuePath: path.resolve(flag("--queue") ?? queuePathBesideRegister(file)),
      generatorPath: DEFAULT_QUEUE_GENERATOR,
    });
    if (!isRepoOwned(provenance)) {
      fail(
        EXIT_REFUSED,
        `the generated queue this claim would be taken from is \`${provenance.verdict}\`, so the row it ` +
          "names may not be work this backlog still holds. Nothing was appended.\n" +
          `${describeQueueProvenance(provenance)}\n` +
          "A release or an abstention is not gated on this; only a claim is.",
      );
    }
  }

  const gate = flag("--gate") ?? DEFAULT_GATE;
  if (!fs.existsSync(gate)) {
    fail(EXIT_GATE_UNUSABLE, `the pre-claim gate is not at ${gate}; refusing to append unchecked.`);
  }

  // Ask the gate what it understands, by running it with too few arguments so
  // it prints its own usage. No register is read by this probe.
  let usageText = "";
  try {
    execFileSync(process.execPath, [gate, "--preclaim"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    usageText = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
  }
  const advertised = advertisedFlags(usageText);
  if (!advertised.has("--preclaim")) {
    fail(
      EXIT_GATE_UNUSABLE,
      `${gate} does not advertise --preclaim, so its verdict cannot be trusted; refusing to append.`,
    );
  }

  const forwarded = allFlagValues("--gate-arg");
  const unknown = [...forwarded, ...(files !== undefined ? ["--files"] : [])].filter(
    (f) => f.startsWith("--") && !advertised.has(f),
  );
  if (unknown.length) {
    fail(
      EXIT_USAGE,
      `the installed gate at ${gate} does not advertise ${unknown.join(", ")}. ` +
        "An unrecognised flag is parsed as nothing and the check you asked for would not run, " +
        "so this is refused rather than passed silently.",
    );
  }

  const gateArgs = [gate, "--preclaim", "--file", file, "--item", item, "--identity", identity, "--json"];
  if (flag("--now")) gateArgs.push("--now", flag("--now"));
  if (flag("--window-hours")) gateArgs.push("--window-hours", flag("--window-hours"));
  if (has("--strict")) gateArgs.push("--strict");
  if (files !== undefined) gateArgs.push("--files", files);
  for (const extra of forwarded) gateArgs.push(extra);

  let status = 0;
  let stdout = "";
  let stderr = "";
  try {
    stdout = execFileSync(process.execPath, gateArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    if (error.status === undefined || error.status === null) {
      fail(EXIT_GATE_UNUSABLE, `the pre-claim gate could not be run: ${error.message}`);
    }
    status = error.status;
    stdout = error.stdout ?? "";
    stderr = error.stderr ?? "";
  }

  let report = null;
  try {
    report = JSON.parse(stdout);
  } catch {
    report = null;
  }

  /**
   * Render the gate's report for the run that has to act on it.
   *
   * T-707's acceptance was "refuse when any path appears in another live
   * claim's `files:` list, NAMING THE PATH AND THE HOLDER". The refusing
   * shipped; the naming did not, because this function read `report.contended`
   * and the gate reports the overlap under `fileOverlap.conflicts`. Every
   * field the acceptance asks for — path, holding line, stamp, agent — was
   * computed and then discarded, so a file-overlap refusal printed the banner,
   * the ITEM half's `verdict: take`, and an item-half reason about a live claim
   * that does not exist. A refusal whose text reads as permission.
   *
   * Two consequences, and the second is the expensive one: a run cannot tell
   * WHICH of the files it asked for is held, so it re-invokes the helper one
   * path at a time to find out; and `verdict: take` under a REFUSED banner
   * invites the reading that the control is broken. So the verdict line now
   * says which half it belongs to, and the half that actually refused is named.
   *
   * It reads ONLY `fileOverlap.conflicts`, checked against the gate's history
   * rather than assumed: no commit of `register-time-authority.mjs` has ever
   * emitted a top-level `contended` key — the file-overlap half emitted
   * `fileOverlap.conflicts` from its first commit (`5e8a42e284`). So the old
   * read was wrong the day it was written, and keeping it "for compatibility"
   * would ship an unreachable branch under a comment implying some gate
   * produces that shape. What actually guards a future key rename is the case
   * below driving the REAL gate, which fails if the shape moves.
   */
  const describe = () => {
    if (!report) return stdout.trim() || stderr.trim() || "(the gate produced no report)";
    const overlap = report.fileOverlap ?? null;
    const overlapRefuses = Boolean(overlap?.refuses);
    const itemLabel = overlapRefuses ? "item verdict:" : "verdict:";
    const lines = [`${itemLabel} ${report.verdict}`, `reason:  ${report.reason}`];
    if (report.holder) {
      lines.push(`holder:  line ${report.holder.lineNumber} ${report.holder.stamp} ${report.holder.agent}`);
    }

    const conflicts = Array.isArray(overlap?.conflicts) ? overlap.conflicts : [];
    if (conflicts.length) {
      lines.push(
        `REFUSED BY THE FILE HALF — ${conflicts.length} of ` +
          `${overlap?.requested?.length ?? conflicts.length} requested path(s) ` +
          `already held by another live claim:`,
      );
      for (const c of conflicts) {
        const where = c.lineNumber === undefined ? "" : ` at line ${c.lineNumber}`;
        const when = c.stamp === undefined ? "" : ` (${c.stamp})`;
        lines.push(`file:    ${c.path ?? c} held by ${c.agent ?? "another claim"}${where}${when}`);
      }
      lines.push("         Take a different item, or a file list that does not overlap.");
    }
    return lines.join("\n");
  };

  // An abstention past a refusal is the ONE case that continues, so it is
  // named once and consulted by both guards below. The trailing "any exit this
  // caller does not interpret as permission" guard is a separate statement, not
  // an else-branch, and a refusal that skipped the first guard still reached it
  // — which turned the abstention into exit 3 instead of a record.
  const abstainPastRefusal = status === EXIT_REFUSED && action === "abstain";
  if (abstainPastRefusal) {
    // An abstention TAKES nothing, and the moment you most need to record one
    // is the moment the gate refuses — "not taking T-706, it is in open PR
    // #8280" is a refused verdict written down. Blocking it would push the
    // decision back to a hand-written line, which is the path this helper
    // exists to replace. The refused verdict is carried into the record, so
    // the register shows why; and the line asserts NOT TAKEN, so nothing is
    // gained by reaching for this flag to get past the gate.
    console.error(`Pre-claim refused item ${item}, which is what an abstention records. Continuing.`);
    console.error(describe());
  } else if (status === EXIT_REFUSED) {
    console.error(`Pre-claim REFUSED — item ${item} as ${identity}. Nothing was appended.`);
    console.error(describe());
    process.exit(EXIT_REFUSED);
  } else
  if (status === EXIT_USAGE) {
    console.error(`The pre-claim gate rejected the request as unusable. Nothing was appended.`);
    console.error(describe());
    process.exit(EXIT_USAGE);
  }
  if (status !== EXIT_OK && !abstainPastRefusal) {
    // An exit this caller does not understand is not a pass. Failing open here
    // is exactly the unwired-control shape T-708 was filed against.
    fail(
      EXIT_GATE_UNUSABLE,
      `the pre-claim gate exited ${status}, which this wiring does not interpret as permission. ` +
        `Nothing was appended.\n${describe()}`,
    );
  }

  const verdict = report?.verdict ?? "take";
  console.log(`Pre-claim passed — item ${item} as ${identity}: ${verdict}`);
  if (report?.advisory) {
    console.log(
      `  ADVISORY (${verdict}): ${report.reason}\n` +
        "  The gate failed open here by design; re-run with --strict to refuse instead.",
    );
  }

  // T-457. Read the clock here, after the gate has run and immediately before
  // the write — never earlier in the run, where it becomes an estimate.
  const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const line = buildClaimLine({
    stamp,
    identity,
    item,
    message,
    branch: flag("--branch"),
    files,
    verdict,
    action,
  });

  /*
   * C-528. The record this line releases, against the line itself.
   *
   * Placed after the line is built and BEFORE anything is written, so --strict
   * can refuse without leaving a register the refusal contradicts. The default
   * is advisory on purpose and it is not timidity: the register is audit
   * history, a release hands work back, and refusing to record an outcome
   * because a document disagrees with it would strand the claim and push the
   * correction into a hand-written line — the T-708 shape, reached from the
   * sanctioned path.
   */
  const silentOnProof = reviewReleaseLine({ line, records: [] }).registerSays === SILENT;
  if (!silentOnProof) {
    const repo = path.resolve(flag("--repo") ?? path.join(HERE, "..", ".."));
    const { records, undetermined } = releaseRecordsInBranch({
      repo,
      dir: flag("--records") ?? DEFAULT_RECORD_DIR,
      base: flag("--base") ?? DEFAULT_BASE,
    });
    if (undetermined) {
      // Named, never silent. An unreadable repository is not a clean bill of
      // health, and reporting it as one is the failure this whole item is about.
      // Advisory, so stdout — the same channel this file's other advisory uses.
      // A refusal is the only thing that speaks on stderr here.
      console.log(
        "This line speaks about a signed-in proof, and whether it contradicts the record it " +
          `releases is UNDETERMINED: ${undetermined}\n` +
          "  Pass --repo/--base to point at the checkout that holds the record.",
      );
    } else {
      const review = reviewReleaseLine({ line, records });
      if (review.contradicted.length > 0) {
        const headline =
          `This line says the signed-in proof is \`${review.registerSays}\`, and ` +
          `${review.contradicted.length} release record(s) this branch writes say otherwise.`;
        if (has("--strict")) {
          fail(
            EXIT_REFUSED,
            `${headline} Nothing was appended.\n${describeRecordContradiction(review)}`,
          );
        }
        console.log(`${headline}\n${describeRecordContradiction(review)}`);
      }
    }
  }

  if (has("--dry-run")) {
    console.log(`--dry-run; this record was NOT appended:\n${line}`);
    process.exit(EXIT_OK);
  }

  // Append only. The register is audit history: nothing above this line is
  // read back, rewritten, or restamped.
  const current = fs.readFileSync(file, "utf8");
  fs.appendFileSync(file, `${current.endsWith("\n") ? "" : "\n"}\n${line}\n`);
  console.log(`Appended to ${file}:\n${line}`);
  process.exit(EXIT_OK);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
