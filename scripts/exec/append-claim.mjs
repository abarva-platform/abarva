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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GATE = path.join(HERE, "register-time-authority.mjs");

const EXIT_OK = 0;
const EXIT_REFUSED = 1;
const EXIT_USAGE = 2;
const EXIT_GATE_UNUSABLE = 3;

const USAGE =
  "usage: --file <register.md> --item <id> --identity <base-agent#run-id> --message <text>\n" +
  "       [--action claim|release|abstain] [--branch <name>] [--files a,b]\n" +
  "       [--strict] [--dry-run] [--now ISO]\n" +
  "       [--window-hours 3] [--gate <path>] [--gate-arg <flag>]...";

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

  const describe = () => {
    if (!report) return stdout.trim() || stderr.trim() || "(the gate produced no report)";
    const lines = [`verdict: ${report.verdict}`, `reason:  ${report.reason}`];
    if (report.holder) {
      lines.push(`holder:  line ${report.holder.lineNumber} ${report.holder.stamp} ${report.holder.agent}`);
    }
    if (Array.isArray(report.contended) && report.contended.length) {
      for (const c of report.contended) lines.push(`file:    ${c.path ?? c} held by ${c.agent ?? "another claim"}`);
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
