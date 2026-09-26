#!/usr/bin/env node
/**
 * Behavioural test for the worktree sweep-hazard control (item T-489).
 *
 * At 2026-09-26T00:19Z a full checkout at `/tmp/exec-run-20260925T235807`,
 * created per the operator task file's own first instruction, vanished
 * mid-session between two commands about 90 seconds apart, taking uncommitted
 * work with it; the next command died `uv_cwd ENOENT`. A second, independent
 * run of the same task lost a worktree in the same window. Nothing in the
 * register, the pulse file or the task instructions said who sweeps `/tmp`, on
 * what trigger, or with what age bound — so every agent was being told to work
 * in a directory another process may delete, and no control could say so.
 *
 * This control answers the "who sweeps" half by READING the host's own
 * declarations rather than asserting a verdict about `/tmp` in prose. A gate
 * that hardcodes "/tmp is unsafe" is the shape this directory exists against:
 * it cannot notice the rule changing, it cannot be wrong in a way anyone sees,
 * and it says nothing at all about a root nobody thought of. So the parsers
 * below are the contract, and the cases that matter most are the ones where a
 * plausible simplification would report SAFE for a root that is swept.
 *
 * Four of those simplifications each have a case pinning them down:
 *
 *   `path.resolve` instead of `fs.realpathSync`   -> cases 7, 8
 *   `startsWith` instead of path containment      -> case 9
 *   "too young to be eligible, so safe"           -> case 11
 *   "no declaration readable, so nothing sweeps"  -> cases 5, 12, 16
 *
 * The third is the one this item turns on. `tmp_cleaner`'s age bound is three
 * days; every worktree is younger than that when it is created and none is
 * when an item runs long. A verdict that consulted the worktree's current age
 * would report SAFE at exactly the moment an agent asks, and the bound is
 * therefore reported as WHEN, never as WHETHER.
 *
 * Cases 1–13 run the exported functions over fixtures. Cases 14–18 run the real
 * CLI as a child process, because a decision function nothing calls is the
 * T-708 shape: an available control and a wired one look identical from
 * outside. Case 19 reads the real host and is the only case that can skip,
 * because a GitHub runner has no launchd and a gate asserting on a subject it
 * cannot see is the unfailable kind.
 *
 * Run:  node scripts/exec/worktree-sweep-hazard.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  NOT_SWEPT,
  SWEPT,
  UNKNOWN,
  classifyRoot,
  parseCleanerScript,
  parseLaunchdPlist,
  readHostSweepers,
} from "./worktree-sweep-hazard.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "worktree-sweep-hazard.mjs");

let failures = 0;
let passes = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passes += 1;
    return;
  }
  failures += 1;
  process.stderr.write(`FAIL ${name}${detail ? `\n     ${detail}` : ""}\n`);
}

function eq(name, actual, expected) {
  check(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/**
 * A fixture in the declaration syntax the real cleaner uses, NOT a copy of
 * Apple's file. The real file is read by case 19 on a host that has it; a
 * verbatim copy here would only prove this suite can read itself.
 */
const CLEANER_FIXTURE = [
  "#!/bin/sh",
  "# Perform temporary directory cleaning so that long-lived systems",
  "# don't end up with excessively old files there.",
  "# Configurations",
  'daily_clean_tmps_dirs="/tmp"',
  "# Delete under here",
  'daily_clean_tmps_days="3"',
  "# If not accessed for",
  'daily_clean_tmps_ignore=".X*-lock .X11-unix"',
  'args="-atime +$daily_clean_tmps_days -mtime +$daily_clean_tmps_days"',
  "    find -dx . -fstype local -type f $args -delete -print",
  "exit 0",
].join("\n");

const PLIST_FIXTURE = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<plist version="1.0">',
  "<dict>",
  "\t<key>Label</key>",
  "\t<string>com.example.tmp_cleaner</string>",
  "\t<key>ProgramArguments</key>",
  "\t<array>",
  "\t\t<string>__PROGRAM__</string>",
  "\t</array>",
  "\t<key>StartCalendarInterval</key>",
  "\t<dict>",
  "\t\t<key>Hour</key>",
  "\t\t<integer>0</integer>",
  "\t</dict>",
  "</dict>",
  "</plist>",
].join("\n");

/** A daemons directory holding one cleaner that declares `dirs` and `days`. */
function makeFixtureHost({ dirs = "/tmp", days = "3", extraPlist = null } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "t489-host-"));
  const daemons = path.join(root, "LaunchDaemons");
  fs.mkdirSync(daemons);
  const program = path.join(root, "tmp_cleaner");
  fs.writeFileSync(
    program,
    CLEANER_FIXTURE.replace('daily_clean_tmps_dirs="/tmp"', `daily_clean_tmps_dirs="${dirs}"`)
      .replace('daily_clean_tmps_days="3"', `daily_clean_tmps_days="${days}"`),
  );
  fs.writeFileSync(path.join(daemons, "com.example.tmp_cleaner.plist"), PLIST_FIXTURE.replace("__PROGRAM__", program));
  // A second daemon with no sweep declaration at all, so every case below is
  // read against a directory that also holds a daemon this control ignores.
  fs.writeFileSync(
    path.join(daemons, "com.example.unrelated.plist"),
    PLIST_FIXTURE.replace("__PROGRAM__", "/usr/bin/true").replace("com.example.tmp_cleaner", "com.example.unrelated"),
  );
  if (extraPlist) fs.writeFileSync(path.join(daemons, "com.example.extra.plist"), extraPlist);
  return { root, daemons, program };
}

// --------------------------------------------------------------------------
// 1–2. The cleaner script's own declaration.
// --------------------------------------------------------------------------
const parsed = parseCleanerScript(CLEANER_FIXTURE);
check("1 cleaner script declares its swept roots", JSON.stringify(parsed.roots) === '["/tmp"]', JSON.stringify(parsed));
eq("1b cleaner script declares its age bound in days", parsed.days, 3);

const noDecl = parseCleanerScript("#!/bin/sh\nrm -rf /tmp/something\nexit 0\n");
check("2 a script with no declaration declares no roots", noDecl.roots.length === 0, JSON.stringify(noDecl));
eq("2b and no age bound", noDecl.days, null);

// --------------------------------------------------------------------------
// 3. The launchd plist.
// --------------------------------------------------------------------------
const plist = parseLaunchdPlist(PLIST_FIXTURE.replace("__PROGRAM__", "/usr/libexec/tmp_cleaner"));
eq("3 plist label", plist.label, "com.example.tmp_cleaner");
eq("3b plist program", plist.program, "/usr/libexec/tmp_cleaner");
eq("3c plist schedule is reported", plist.schedule, "StartCalendarInterval Hour 0");

// --------------------------------------------------------------------------
// 4–5. Reading a host.
// --------------------------------------------------------------------------
const host = makeFixtureHost();
const sweepers = readHostSweepers({ launchDaemonsDir: host.daemons });
eq("4 one declaring daemon is found among two", sweepers.sweepers.length, 1);
eq("4b it is named by its launchd label", sweepers.sweepers[0].label, "com.example.tmp_cleaner");
eq("4c readable host is reported readable", sweepers.readable, true);

const missing = readHostSweepers({ launchDaemonsDir: path.join(host.root, "does-not-exist") });
eq("5 an unreadable daemons dir is NOT reported readable", missing.readable, false);
eq("5b and yields no sweepers", missing.sweepers.length, 0);

// --------------------------------------------------------------------------
// 6–11. Classifying a candidate worktree root.
// --------------------------------------------------------------------------
const swept = classifyRoot("/tmp/exec-item-20260926", sweepers);
eq("6 a root under a declared swept dir is SWEPT", swept.verdict, SWEPT);
eq("6b and names the sweeper", swept.sweptBy?.label, "com.example.tmp_cleaner");
eq("6c and reports the age bound as days", swept.sweptBy?.days, 3);

// `/tmp` is a symlink to `/private/tmp` on macOS, and that exact difference
// already broke two controls in this directory (T-723): `path.resolve`
// normalises a path, it does not follow symlinks. Both directions, because a
// fix for one that reverses the comparison order passes only the other.
const realTmp = fs.realpathSync("/tmp");
const viaLink = classifyRoot("/tmp/exec-x", readHostSweepers({ launchDaemonsDir: makeFixtureHost({ dirs: realTmp }).daemons }));
eq("7 a root typed through the /tmp symlink matches a sweeper declaring the realpath", viaLink.verdict, SWEPT);

const viaReal = classifyRoot(path.join(realTmp, "exec-x"), sweepers);
eq("8 a root typed as the realpath matches a sweeper declaring /tmp", viaReal.verdict, SWEPT);

// The prefix-impersonation bug: `"/tmpfoo".startsWith("/tmp")` is true and
// `/tmpfoo` is a different directory.
//
// The first version of this case used `/tmpfoo/exec-x` against the `/tmp`
// sweeper and passed with the boundary check REMOVED — mutation M2 survived it.
// It never reached the boundary: the sweeper's root resolves through the macOS
// symlink to `/private/tmp`, `/tmpfoo` does not exist so it resolves to
// itself, and no prefix relationship holds in either form. A negative control
// that cannot fail is the shape this directory exists against, so the fixture
// below is built so the textual prefix genuinely holds after resolution — both
// directories exist, and the assertion on `startsWith` proves it before the
// verdict is read.
const prefixHost = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "t489-prefix-"));
const sweptDir = path.join(prefixHost, "swept");
const siblingDir = path.join(prefixHost, "sweptfoo");
fs.mkdirSync(sweptDir);
fs.mkdirSync(path.join(siblingDir, "exec-x"), { recursive: true });
const prefixSweepers = readHostSweepers({ launchDaemonsDir: makeFixtureHost({ dirs: sweptDir }).daemons });
eq("9 the swept dir itself is SWEPT, so the fixture reaches the comparison", classifyRoot(sweptDir, prefixSweepers).verdict, SWEPT);
const sibling = classifyRoot(path.join(siblingDir, "exec-x"), prefixSweepers);
check(
  "9b the sibling really does start with the swept dir as a string",
  sibling.resolved.startsWith(sweptDir),
  `${sibling.resolved} does not textually start with ${sweptDir}, so this case cannot exercise the boundary`,
);
eq("9c a sibling whose name merely starts with the swept dir is NOT swept", sibling.verdict, NOT_SWEPT);

eq("10 the swept dir itself is SWEPT", classifyRoot("/tmp", sweepers).verdict, SWEPT);

// The case this item turns on. A worktree is always younger than the age bound
// at the moment it is created, and an item that runs long makes it older with
// no second warning. The bound is WHEN, not WHETHER.
const freshDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "t489-fresh-"));
const fresh = classifyRoot(freshDir, readHostSweepers({ launchDaemonsDir: makeFixtureHost({ dirs: fs.realpathSync(os.tmpdir()) }).daemons }));
eq("11 a root created seconds ago is still SWEPT, not safe-because-young", fresh.verdict, SWEPT);
check("11b the age bound is reported as eligibility, not as the verdict", fresh.sweptBy?.days === 3, JSON.stringify(fresh));

// --------------------------------------------------------------------------
// 12–13. Fails closed, and can still say NOT_SWEPT when it really can see.
// --------------------------------------------------------------------------
eq("12 an unreadable host is UNKNOWN for a root under /tmp, never NOT_SWEPT", classifyRoot("/tmp/exec-x", missing).verdict, UNKNOWN);
eq("12b and UNKNOWN for any other root too", classifyRoot(path.join(os.homedir(), "wt"), missing).verdict, UNKNOWN);
eq("13 a readable host with no matching sweeper is NOT_SWEPT", classifyRoot(path.join(os.homedir(), "Projects", "wt"), sweepers).verdict, NOT_SWEPT);

// --------------------------------------------------------------------------
// 14–18. The CLI, as a child process.
// --------------------------------------------------------------------------
function runCli(args) {
  try {
    const stdout = execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return { status: error.status, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

const cliSwept = runCli(["--check-root", "/tmp/exec-item", "--launch-daemons", host.daemons]);
eq("14 CLI exits 1 on a swept root", cliSwept.status, 1);
check("14b and names the sweeper on stderr", cliSwept.stderr.includes("com.example.tmp_cleaner"), JSON.stringify(cliSwept));

const cliSafe = runCli(["--check-root", path.join(os.homedir(), "Projects", "wt"), "--launch-daemons", host.daemons]);
eq("15 CLI exits 0 on a root no declared sweeper reaches", cliSafe.status, 0);

const cliUnknown = runCli(["--check-root", "/tmp/exec-item", "--launch-daemons", path.join(host.root, "nope")]);
eq("16 CLI exits 2 when it cannot read the host, failing closed", cliUnknown.status, 2);

const cliBadFlag = runCli(["--check-root", "/tmp/x", "--launch-daemons", host.daemons, "--forse"]);
eq("17 CLI refuses an unrecognised flag rather than parsing it as nothing", cliBadFlag.status, 2);
check("17b and names it", cliBadFlag.stderr.includes("--forse"), JSON.stringify(cliBadFlag));

const cliJson = runCli(["--check-root", "/tmp/exec-item", "--launch-daemons", host.daemons, "--json"]);
let jsonBody = null;
try {
  jsonBody = JSON.parse(cliJson.stdout);
} catch {
  /* reported by the assertion below */
}
eq("18 --json emits the verdict", jsonBody?.verdict, SWEPT);
eq("18b --json names the sweeper's label", jsonBody?.sweptBy?.label, "com.example.tmp_cleaner");

// --------------------------------------------------------------------------
// 20. The shebang bound is a real bound, not decoration.
//
//     Dropping it changed no verdict in the first mutation round (M8 survived),
//     because a Mach-O binary contains no shell variable assignment and the
//     only thing the bound buys is not reading several hundred of them. That
//     made it a guard with nothing asserting it, so here is the behaviour it
//     actually has: a program that is NOT a script does not declare anything,
//     even when its bytes happen to contain the declaration text. Shell syntax
//     inside a binary is not a declaration, and this is what stops the control
//     pattern-matching its way across the whole of /usr/libexec.
// --------------------------------------------------------------------------
const binHost = fs.mkdtempSync(path.join(os.tmpdir(), "t489-bin-"));
const binDaemons = path.join(binHost, "LaunchDaemons");
fs.mkdirSync(binDaemons);
const fakeBinary = path.join(binHost, "not-a-script");
fs.writeFileSync(fakeBinary, Buffer.concat([
  Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]),
  Buffer.from('\ndaily_clean_tmps_dirs="/tmp"\ndaily_clean_tmps_days="3"\n', "utf8"),
]));
fs.writeFileSync(path.join(binDaemons, "com.example.binary.plist"), PLIST_FIXTURE.replace("__PROGRAM__", fakeBinary));
const binRead = readHostSweepers({ launchDaemonsDir: binDaemons });
eq("20 a non-script program declares nothing, even carrying the declaration bytes", binRead.sweepers.length, 0);
eq("20b and is counted as undeclared rather than dropped", binRead.undeclared, 1);
eq("20c so a root under the text it contains is NOT_SWEPT, not SWEPT", classifyRoot("/tmp/exec-x", binRead).verdict, NOT_SWEPT);

// --------------------------------------------------------------------------
// 21. The real host. Skips where launchd does not exist, because CI cannot see
//     the operator's machine and must not assert on it.
// --------------------------------------------------------------------------
const REAL_DAEMONS = "/System/Library/LaunchDaemons";
if (fs.existsSync(REAL_DAEMONS)) {
  const real = readHostSweepers({ launchDaemonsDir: REAL_DAEMONS });
  const realVerdict = classifyRoot("/tmp/exec-item-20260926", real);
  check(
    "21 on a host with launchd, /tmp classifies SWEPT and the sweeper is named",
    realVerdict.verdict === SWEPT && typeof realVerdict.sweptBy?.label === "string",
    `readable=${real.readable} sweepers=${JSON.stringify(real.sweepers.map((s) => s.label))} verdict=${JSON.stringify(realVerdict)}`,
  );
} else {
  process.stdout.write("21 SKIPPED: no /System/Library/LaunchDaemons on this host (expected on a Linux runner)\n");
}

process.stdout.write(`\n${passes} passed, ${failures} failed\n`);
process.exit(failures === 0 ? 0 : 1);
