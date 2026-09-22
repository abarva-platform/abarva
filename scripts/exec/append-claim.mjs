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
 *        [--branch <name>] [--files a,b] [--strict] [--dry-run] \
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GATE = path.join(HERE, "register-time-authority.mjs");

const EXIT_OK = 0;
const EXIT_REFUSED = 1;
const EXIT_USAGE = 2;
const EXIT_GATE_UNUSABLE = 3;

const USAGE =
  "usage: --file <register.md> --item <id> --identity <base-agent#run-id> --message <text>\n" +
  "       [--branch <name>] [--files a,b] [--strict] [--dry-run] [--now ISO]\n" +
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
export function buildClaimLine({ stamp, identity, item, message, branch, files, verdict }) {
  const parts = [`item ${item} claimed`];
  if (branch) parts.push(`on branch \`${branch}\``);
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

  if (status === EXIT_REFUSED) {
    console.error(`Pre-claim REFUSED — item ${item} as ${identity}. Nothing was appended.`);
    console.error(describe());
    process.exit(EXIT_REFUSED);
  }
  if (status === EXIT_USAGE) {
    console.error(`The pre-claim gate rejected the request as unusable. Nothing was appended.`);
    console.error(describe());
    process.exit(EXIT_USAGE);
  }
  if (status !== EXIT_OK) {
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
