#!/usr/bin/env node
/**
 * Behavioural test for the register time-authority control (item T-457).
 *
 * The defect this exists to hold shut: every line of the deployment register
 * is stamped by whichever lane wrote it, from that lane's own idea of the
 * time. Measured on the real register, one lane ran up to +74 minutes ahead of
 * GitHub's own `mergedAt` and another ran behind it, so the file's order is
 * not chronology — and two closed items had already computed elapsed figures
 * from that order.
 *
 * Every assertion here runs the control over a FIXTURE register and reads its
 * verdicts and its process exit status. Nothing is asserted by asking the
 * control whether it believes itself correct, and no assertion reads the real
 * operator files: a control whose truth comes from its own subject cannot
 * fail, which is the exact shape T-460 and T-467 were filed against.
 *
 * Run:  node scripts/exec/register-time-authority.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTROL = path.join(HERE, "register-time-authority.mjs");

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "register-authority-"));
  const file = path.join(dir, "EXECUTION_CLAIMS.md");
  fs.writeFileSync(file, `# Claims\n\n## Claim log — append only\n\n${lines.join("\n")}\n`);
  return { dir, file };
}

/** Run the control as a real child process; never import its CLI path. */
function run(args) {
  try {
    const stdout = execFileSync(process.execPath, [CONTROL, ...args], {
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

const NOW = "2026-09-21T17:00:00Z";
const SINCE = "2026-09-21T00:00:00Z";

// ---------------------------------------------------------------------------
// 1. A stamp in the future of the moment the file is read is always wrong, and
//    needs no network to prove. This is the failure actually observed.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T16:04Z lane-a item T-100 MERGED `aaaaaaa` (PR #1) — fine.",
    "2026-09-21T17:15Z lane-b item T-101 MERGED `bbbbbbb` (PR #2) — stamped ahead.",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  let report = {};
  try {
    report = JSON.parse(r.stdout);
  } catch {
    /* reported below */
  }
  const future = (report.violations ?? []).filter((v) => v.code === "future_stamp");
  check(
    "a line stamped after the read moment is a violation, and the run fails",
    r.status === 1 && future.length === 1 && future[0].stamp === "2026-09-21T17:15Z",
    `exit=${r.status}\nstdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  check(
    "the line stamped before the read moment is not reported",
    // Non-vacuous on purpose: the other line MUST have been reported, so an
    // empty violation set cannot satisfy this the way `every` alone would.
    future.length === 1 && future.every((v) => v.stamp !== "2026-09-21T16:04Z"),
    JSON.stringify(future),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 2. A clean register exits 0. A control that fails on everything is as
//    useless as one that fails on nothing.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T16:04Z lane-a item T-100 MERGED `aaaaaaa` (PR #1) — fine.",
    "2026-09-21T16:30Z lane-b item T-101 MERGED `bbbbbbb` (PR #2) — also fine.",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  check(
    "a register with no violation exits 0",
    r.status === 0,
    `exit=${r.status}\nstdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 3. An elapsed duration with no timestamps behind it is the defect that made
//    T-446 and T-452 unreadable. Naming both endpoints clears it.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T16:04Z lane-a item T-100 — the gap T-099 closed six hours ago is still open.",
    "2026-09-21T16:05Z lane-a item T-102 — 38 minutes elapsed, from 2026-09-21T15:00:00Z to 2026-09-21T15:38:00Z.",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  const unsourced = (report.violations ?? []).filter((v) => v.code === "unsourced_elapsed");
  check(
    "an elapsed claim naming no timestamps is a violation",
    r.status === 1 && unsourced.length === 1 && unsourced[0].stamp === "2026-09-21T16:04Z",
    `exit=${r.status}\nstdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  check(
    "an elapsed claim naming both endpoints is accepted",
    // Non-vacuous: the unsourced line above must still be in the set.
    unsourced.length === 1 && unsourced.every((v) => v.stamp !== "2026-09-21T16:05Z"),
    JSON.stringify(unsourced),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 4. The authority check proper: a line announcing a merge cannot be stamped
//    before GitHub says the merge happened. The authority is injected as a
//    file so the test never reaches the network, and so the control cannot
//    quietly pass by failing to look anything up.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T13:31Z lane-a item T-100 MERGED `aaaaaaa` (PR #8141) — stamped before its own merge.",
    "2026-09-21T14:00Z lane-b item T-101 MERGED `bbbbbbb` (PR #8142) — stamped after its own merge.",
  ]);
  const authority = path.join(dir, "authority.json");
  fs.writeFileSync(
    authority,
    JSON.stringify({
      8141: { mergedAt: "2026-09-21T13:38:07Z" },
      8142: { mergedAt: "2026-09-21T13:58:07Z" },
    }),
  );
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--authority", authority, "--strict", "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  const before = (report.violations ?? []).filter((v) => v.code === "announced_before_event");
  check(
    "a merge announcement stamped before GitHub's mergedAt is a violation",
    r.status === 1 && before.length === 1 && before[0].pr === 8141,
    `exit=${r.status}\nstdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  check(
    "the drift of every checked announcement is reported in seconds",
    typeof report.drift?.[0]?.driftSeconds === "number" &&
      report.drift.length === 2 &&
      report.drift.find((d) => d.pr === 8141)?.driftSeconds === -427,
    JSON.stringify(report.drift),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 5. Silence is not a pass. If a line announces a merge and the authority set
//    has no entry for it, the control must say so rather than skip it — the
//    T-460 failure mode where a matcher that matches nothing reads as green.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T14:00Z lane-a item T-100 MERGED `aaaaaaa` (PR #77) — no authority entry exists.",
  ]);
  const authority = path.join(dir, "authority.json");
  fs.writeFileSync(authority, JSON.stringify({}));
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--authority", authority, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "an announcement with no authority entry is reported, not silently skipped",
    (report.violations ?? []).some((v) => v.code === "authority_missing" && v.pr === 77),
    `exit=${r.status}\nstdout=${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 6. The register is audit history and must not be restamped, so the window is
//    explicit: lines older than --since are counted but never failed on.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-19T23:59Z lane-a item T-001 — six hours ago, unsourced, and out of window.",
    "2026-09-21T16:04Z lane-b item T-100 — in window and clean.",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "a line older than the window is not failed on",
    r.status === 0 && (report.violations ?? []).length === 0,
    `exit=${r.status}\nstdout=${r.stdout}`,
  );
  check(
    "but it is still counted, so the window cannot hide the backlog of them",
    report.outOfWindow === 1,
    JSON.stringify(report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 7. Make the right thing the easy thing: --emit builds the stamp from the
//    authority rather than from the agent's guess.
// ---------------------------------------------------------------------------
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "register-emit-"));
  const authority = path.join(dir, "authority.json");
  fs.writeFileSync(authority, JSON.stringify({ 8155: { mergedAt: "2026-09-21T16:53:29Z" } }));
  const r = run(["--emit", "--pr", "8155", "--authority", authority, "--now", NOW]);
  check(
    "--emit prints the authoritative mergedAt and the read clock, and names both",
    r.status === 0 &&
      r.stdout.includes("2026-09-21T16:53:29Z") &&
      r.stdout.includes("2026-09-21T17:00Z") &&
      /mergedAt/.test(r.stdout),
    `exit=${r.status}\nstdout=${r.stdout}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 8. The PR reference floor is a stated contract, not an accident: register
//    prose is full of `#1`-shaped tokens (item ids, footnotes, counts) and a
//    matcher that swallowed them would invent authority lookups for things
//    that are not pull requests. Real pull request numbers are four digits.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T14:00Z lane-a item T-100 MERGED `aaaaaaa` (PR #8141) — a real reference.",
    "2026-09-21T14:01Z lane-a item T-101 MERGED `bbbbbbb` — closes #1 and #7, which are not pull requests here.",
  ]);
  const authority = path.join(dir, "authority.json");
  fs.writeFileSync(authority, JSON.stringify({ 8141: { mergedAt: "2026-09-21T13:58:07Z" } }));
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--authority", authority, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "only the four-digit pull request reference is looked up",
    r.status === 0 &&
      report.drift?.length === 1 &&
      report.drift[0].pr === 8141 &&
      (report.violations ?? []).length === 0,
    `exit=${r.status}\nstdout=${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 9. A negated merge is not a merge. Found on the real register: a line
//    reading "NOT MERGED YET, checks running" was classified as an
//    announcement and produced a false drift pair and a false violation
//    against a line that was opening a pull request, not closing one.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T15:58Z lane-a item T-100 PR #8152 commit abc1234 — opened. Carries drift from PR #8143. NOT MERGED YET, checks running.",
    "2026-09-21T16:20Z lane-a item T-100 PR #8152 MERGED `ddddddd` — done.",
  ]);
  const authority = path.join(dir, "authority.json");
  fs.writeFileSync(
    authority,
    JSON.stringify({
      8152: { mergedAt: "2026-09-21T16:18:06Z" },
      8143: { mergedAt: "2026-09-21T14:56:51Z" },
    }),
  );
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--authority", authority, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "a negated merge produces no drift pair and no violation",
    r.status === 0 &&
      report.drift?.length === 1 &&
      report.drift[0].stamp === "2026-09-21T16:20Z" &&
      (report.violations ?? []).length === 0,
    `exit=${r.status}\nstdout=${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 10. A late line that QUOTES the authoritative instant is correct behaviour —
//     a deliberate back-reconciliation, not clock drift. A late line that does
//     not quote it leaves the reader nothing to check, and is the defect.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T16:29Z lane-a item T-100 — PR #8137 GitHub `mergedAt` 2026-09-21T12:46:44Z, reconciled late on purpose.",
    "2026-09-21T14:45Z lane-b item T-101 MERGED `eeeeeee` (PR #8141) — no instant quoted.",
  ]);
  const authority = path.join(dir, "authority.json");
  fs.writeFileSync(
    authority,
    JSON.stringify({
      8137: { mergedAt: "2026-09-21T12:46:44Z" },
      8141: { mergedAt: "2026-09-21T13:31:06Z" },
    }),
  );
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--authority", authority, "--strict", "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  const drifted = (report.violations ?? []).filter((v) => v.code === "drifted_without_authority");
  check(
    "a late line quoting the instant is accepted; a late line without one is not",
    r.status === 1 &&
      drifted.length === 1 &&
      drifted[0].pr === 8141 &&
      report.drift.find((d) => d.pr === 8137)?.citesAuthority === true,
    `exit=${r.status}\nstdout=${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 11. The severity split. Attributing a merge announcement to a pull request
//     means reading prose, and prose parsing is a heuristic. A heuristic
//     presented as a hard gate is how a control stops being believed. The two
//     verdicts decided from the line alone fail a run; the three that depend
//     on attribution are reported and counted, and fail only under --strict.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T14:45Z lane-a item T-100 MERGED `eeeeeee` (PR #8141) — no instant quoted.",
  ]);
  const authority = path.join(dir, "authority.json");
  fs.writeFileSync(authority, JSON.stringify({ 8141: { mergedAt: "2026-09-21T13:31:06Z" } }));
  const lax = run(["--file", file, "--now", NOW, "--since", SINCE, "--authority", authority, "--json"]);
  const strict = run(["--file", file, "--now", NOW, "--since", SINCE, "--authority", authority, "--strict", "--json"]);
  const laxReport = JSON.parse(lax.stdout || "{}");
  check(
    "a heuristic verdict is reported but advisory by default, and fails under --strict",
    lax.status === 0 &&
      laxReport.advisory?.length === 1 &&
      laxReport.failing?.length === 0 &&
      laxReport.violations?.length === 1 &&
      strict.status === 1,
    `lax=${lax.status} strict=${strict.status}\n${lax.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 12. A future stamp still fails without --strict. The severity split must not
//     have quietly disarmed the one verdict that needs no interpretation.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T17:15Z lane-b item T-101 MERGED `bbbbbbb` (PR #8142) — stamped ahead.",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "the exact verdicts still fail a run with no --strict",
    r.status === 1 && report.failing?.some((v) => v.code === "future_stamp"),
    `exit=${r.status}\n${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 13. The false positive this control produced against its OWN claim line: a
//     line that opens a pull request while using the word `mergedAt` to
//     describe the rule was read as announcing that pull request merged. The
//     nearest merge token to the reference is the negated one, so it is not.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T16:18Z lane-a item T-457 PR #8158 commit `ee0b20fec` — opened, NOT MERGED YET, " +
      "checks running. THE MEASUREMENT: 26 merge announcements resolved to an authoritative " +
      "`mergedAt`, 17 outside tolerance, from 2026-09-21T12:00:00Z to 2026-09-21T17:14:02Z.",
  ]);
  const authority = path.join(dir, "authority.json");
  fs.writeFileSync(authority, JSON.stringify({ 8158: { mergedAt: "2026-09-21T17:28:21Z" } }));
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--authority", authority, "--strict", "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "a line opening a pull request while discussing mergedAt announces nothing",
    r.status === 0 &&
      (report.violations ?? []).length === 0 &&
      (report.drift ?? []).length === 0,
    `exit=${r.status}\n${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Closeout coverage (item T-474). The five cases below are the complement of
// everything above: cases 1-13 judge the CONTENT of lines that exist, and the
// gap four consecutive pulses filed is lines that do not exist at all. A merge
// that nobody writes down is invisible to a content audit, which is why the
// audit stayed green through it.
// ---------------------------------------------------------------------------

// 14. The defect itself: a merge older than the grace period with nothing in
//     the register naming it must fail the run and name the pull request.
{
  const { dir, file } = fixture([
    "2026-09-21T14:05Z lane-a item T-100 claimed | branch lane-a/thing | files: src/a.ts",
  ]);
  const merged = path.join(dir, "merged.json");
  fs.writeFileSync(
    merged,
    JSON.stringify({ 8191: { mergedAt: "2026-09-21T13:14:59Z", sha: "7df034637" } }),
  );
  const r = run(["--closeout", "--file", file, "--now", NOW, "--since", SINCE, "--merged", merged, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "a merged pull request with no register line at all fails the run",
    r.status === 1 &&
      report.failing?.some((v) => v.code === "closeout_missing" && v.pr === 8191),
    `exit=${r.status}\n${r.stdout}${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// 15. The cleared case. One line announcing that pull request by number is the
//     whole requirement; the control must not also demand a shape.
{
  const { dir, file } = fixture([
    "2026-09-21T13:20Z lane-a item T-100 PR #8191 squash-merged as `7df034637` — GitHub " +
      "`mergedAt` **2026-09-21T13:14:59Z**, carried by run 35667064982, digest sha256:67b12ebe.",
  ]);
  const merged = path.join(dir, "merged.json");
  fs.writeFileSync(
    merged,
    JSON.stringify({ 8191: { mergedAt: "2026-09-21T13:14:59Z", sha: "7df034637" } }),
  );
  const r = run(["--closeout", "--file", file, "--now", NOW, "--since", SINCE, "--merged", merged, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "one line announcing the pull request by number clears it",
    r.status === 0 &&
      report.closeout?.find((c) => c.pr === 8191)?.recorded === true &&
      !report.violations?.some((v) => v.code === "closeout_missing"),
    `exit=${r.status}\n${r.stdout}${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// 16. The measurement defect that made the gap look smaller than it is. Every
//     pulse that filed this shape measured it by grepping the register for the
//     merge SHA. A claim line saying which commit it BRANCHED FROM contains
//     that SHA and reports no outcome whatever, so the grep scores it present.
//     Measured on the real register on 2026-09-22, four merges were mentioned
//     only this way. Naming the base commit must not close a merge out.
{
  const { dir, file } = fixture([
    "2026-09-21T13:40Z lane-b item T-101 claimed | branch lane-b/next from origin/main " +
      "`7df034637` | files: src/b.ts",
  ]);
  const merged = path.join(dir, "merged.json");
  fs.writeFileSync(
    merged,
    JSON.stringify({ 8191: { mergedAt: "2026-09-21T13:14:59Z", sha: "7df034637" } }),
  );
  const r = run(["--closeout", "--file", file, "--now", NOW, "--since", SINCE, "--merged", merged, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "naming a commit as the branch point does not close its merge out",
    r.status === 1 &&
      report.failing?.some((v) => v.code === "closeout_missing" && v.pr === 8191),
    `exit=${r.status}\n${r.stdout}${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// 17. The other way a line can mention a pull request without closing it out:
//     announcing that it is open. The register says "OPENED, NOT MERGED" as
//     often as it says "merged", and that line is the one written BEFORE the
//     event this control is looking for.
{
  const { dir, file } = fixture([
    "2026-09-21T13:05Z lane-a item T-100 PR #8191 commit `abcdef123` OPENED, NOT MERGED, checks running.",
  ]);
  const merged = path.join(dir, "merged.json");
  fs.writeFileSync(
    merged,
    JSON.stringify({ 8191: { mergedAt: "2026-09-21T13:14:59Z", sha: "7df034637" } }),
  );
  const r = run(["--closeout", "--file", file, "--now", NOW, "--since", SINCE, "--merged", merged, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "a line announcing the pull request as open does not close its merge out",
    r.status === 1 &&
      report.failing?.some((v) => v.code === "closeout_missing" && v.pr === 8191),
    `exit=${r.status}\n${r.stdout}${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// 18. The grace period. A merge from ninety seconds ago has not been skipped,
//     it is in flight — its deploy has not finished and the outcome line
//     cannot honestly be written yet. Reported as pending, never as recorded,
//     so the distinction stays visible rather than being rounded into a pass.
{
  const { dir, file } = fixture([
    "2026-09-21T14:05Z lane-a item T-100 claimed | branch lane-a/thing | files: src/a.ts",
  ]);
  const merged = path.join(dir, "merged.json");
  fs.writeFileSync(
    merged,
    JSON.stringify({ 8191: { mergedAt: "2026-09-21T16:58:30Z", sha: "7df034637" } }),
  );
  const r = run(["--closeout", "--file", file, "--now", NOW, "--since", SINCE, "--merged", merged, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  const entry = report.closeout?.find((c) => c.pr === 8191);
  check(
    "a merge inside the grace period is pending, not recorded, and does not fail",
    r.status === 0 &&
      entry?.recorded === false &&
      entry?.pending === true &&
      !report.violations?.some((v) => v.code === "closeout_missing"),
    `exit=${r.status}\n${r.stdout}${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// 19. The exemption branch, which is the one that decides whether this is a
//     gate at all. If the authority resolves no merged pull requests, there is
//     nothing to check and the obvious implementation returns clean — so a
//     broken lookup, an expired credential or a wrong window would read
//     exactly like a closed-out day. It must fail closed instead.
{
  const { dir, file } = fixture([
    "2026-09-21T14:05Z lane-a item T-100 claimed | branch lane-a/thing | files: src/a.ts",
  ]);
  const merged = path.join(dir, "merged.json");
  fs.writeFileSync(merged, JSON.stringify({}));
  const r = run(["--closeout", "--file", file, "--now", NOW, "--since", SINCE, "--merged", merged, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "an authority that resolves no merges fails closed rather than reading as clean",
    r.status === 1 &&
      report.failing?.some((v) => v.code === "closeout_authority_empty"),
    `exit=${r.status}\n${r.stdout}${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
