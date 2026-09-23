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
import {
  resolveClaimOwnership,
  parseRegisterLines,
  announcesRelease,
  announcesAbstention,
  claimedPaths,
  itemSubjects,
} from "./register-time-authority.mjs";

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
// T-594. A scheduled task name identifies a family of runs, not one owner.
// Resume authority belongs only to the exact run identity that wrote a claim.
// Parallel siblings may take other work, but neither may adopt the other's
// item merely because their base agent names match.
// ---------------------------------------------------------------------------
{
  const current = "source-backlog-executor#20260922T054050Z";
  check(
    "the exact run identity may resume its own claim",
    resolveClaimOwnership(current, current) === "own",
  );
  check(
    "a sibling run under the same base agent cannot adopt the claim",
    resolveClaimOwnership(
      "source-backlog-executor#20260922T045559Z",
      current,
    ) === "sibling",
  );
  check(
    "an unsuffixed base-agent claim is not treated as this run's claim",
    resolveClaimOwnership("source-backlog-executor", current) === "legacy_other",
  );
  check(
    "an invalid current run identity fails closed",
    resolveClaimOwnership(current, "source-backlog-executor") === "invalid_current",
  );
}

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

// ---------------------------------------------------------------------------
// Item 34. Two agent sessions sharing one checkout is the defect; "one
// worktree per session" was the answer, and until now it lived only as prose
// in the operator protocol. Prose cannot fail, which is the shape this whole
// backlog exists to repair.
//
// The control needs an identity before it can need anything else. T-594's
// resolver already distinguishes `base#run-id` correctly, and every existing
// assertion for it passes a string literal in by hand. Measured on the real
// register, `parseRegisterLines` yields 81 distinct agent tokens and **0 of
// them carry a run id**, because the agent charset excludes `#`. So the
// resolver is exercised only on inputs the real pipeline cannot produce: the
// fixture cannot reach the branch.
// ---------------------------------------------------------------------------
{
  const piped = parseRegisterLines(
    "2026-09-22T15:28:40Z | source-backlog-executor#20260922T152232Z | item T-702 claimed",
  );
  check(
    "a run id survives parsing of the piped claim grammar",
    piped[0]?.agent === "source-backlog-executor#20260922T152232Z",
    `agent=${piped[0]?.agent}`,
  );

  const pipeless = parseRegisterLines(
    "2026-09-22T13:06Z source-backlog-executor#20260922T130518Z item T-559 claude/exec-T559 — claimed",
  );
  check(
    "a run id survives parsing of the pipe-less canonical claim grammar",
    pipeless[0]?.agent === "source-backlog-executor#20260922T130518Z",
    `agent=${pipeless[0]?.agent}`,
  );

  // The connecting case. Both prior halves are already correct on their own;
  // what was never asserted is that the parser's output is an acceptable
  // input to the resolver. If it is not, the resolver answers "own" for a
  // sibling's claim and a second run adopts an item a first run is mid-edit
  // on — exactly the collision item 34 names, one level up.
  const two = parseRegisterLines(
    [
      "2026-09-22T14:58:59Z | source-backlog-executor#20260922T145723Z | item T-701 claimed",
      "2026-09-22T15:28:40Z | source-backlog-executor#20260922T152232Z | item T-702 claimed",
    ].join("\n"),
  );
  check(
    "a sibling run's parsed claim does not resolve as this run's own",
    resolveClaimOwnership(two[0]?.agent, two[1]?.agent) === "sibling",
    `resolved=${resolveClaimOwnership(two[0]?.agent, two[1]?.agent)} from agent=${two[0]?.agent}`,
  );
}

// ---------------------------------------------------------------------------
// Item 34, the control itself: two distinct run identities working in one
// worktree. This is the 18 Sep failure — one session's uncommitted edit
// discarded by the other's branch creation, one session's commit pushed
// inside the other's pull request.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T14:05Z | lane-a#run-1 | item T-100 claimed | branch lane-a/thing in worktree /tmp/exec-shared-20260921 | files: src/a.ts",
    "2026-09-21T14:20Z | lane-a#run-2 | item T-101 claimed | branch lane-a/other in worktree /tmp/exec-shared-20260921 | files: src/b.ts",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "two run identities naming one worktree is a failing violation",
    r.status === 1 &&
      report.failing?.some((v) => v.code === "worktree_shared"),
    `exit=${r.status}\n${r.stdout}${r.stderr}`,
  );
  check(
    "the shared-worktree violation names the path and both owners",
    report.violations?.some(
      (v) =>
        v.code === "worktree_shared" &&
        String(v.detail ?? "").includes("/tmp/exec-shared-20260921") &&
        String(v.detail ?? "").includes("lane-a#run-1") &&
        String(v.detail ?? "").includes("lane-a#run-2"),
    ),
    JSON.stringify(report.violations ?? []),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// The negative controls. A detector that fires on one session's own register
// traffic is worse than none: every run writes a claim line and a release
// line naming the same worktree, so the common case must stay silent.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-21T14:05Z | lane-a#run-1 | item T-100 claimed | worktree /tmp/exec-mine-20260921 | files: src/a.ts",
    "2026-09-21T15:30Z | lane-a#run-1 | RELEASED item T-100 — worktree /tmp/exec-mine-20260921 removed",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "one identity naming its own worktree twice is not a violation",
    !report.violations?.some((v) => v.code === "worktree_shared"),
    JSON.stringify(report.violations ?? []),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The false positive this control actually produced when first written by
  // hand: a wrapped continuation line carries no stamp, so it belongs to the
  // record above it. Attributing it to whichever agent was last seen invents
  // a second owner for a worktree that has one. Measured on the real
  // register, a naive parser reported exactly one shared path this way, and
  // it was not shared.
  // Non-vacuous by construction: the path already has ONE stamped owner
  // above, so a carry-forward attribution of the unstamped line to the
  // agent last seen would manufacture a second owner and fire. A fixture
  // where no stamped line names the path could not fail this way, and would
  // assert nothing.
  const { dir, file } = fixture([
    "2026-09-21T14:05Z | lane-a#run-1 | item T-100 claimed | own worktree /tmp/exec-mine-20260921",
    "2026-09-21T14:20Z | lane-b#run-9 | item T-200 claimed | files: src/a.ts",
    "  continued from the line above: we inspected worktree /tmp/exec-mine-20260921 read-only",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "an unstamped continuation does not invent a second owner for a worktree",
    !report.violations?.some((v) => v.code === "worktree_shared"),
    JSON.stringify(report.violations ?? []),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // A legacy line with no run id must not be fused with a suffixed one under
  // the same base name. `lane-a` is a family; `lane-a#run-1` is a run. If the
  // control compared base names it would read these as one owner and stay
  // silent on a genuine collision.
  const { dir, file } = fixture([
    "2026-09-21T14:05Z | lane-a | item T-100 claimed | worktree /tmp/exec-legacy-20260921",
    "2026-09-21T14:20Z | lane-a#run-2 | item T-101 claimed | worktree /tmp/exec-legacy-20260921",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "an unsuffixed lane and a suffixed run sharing a worktree still collide",
    report.violations?.some((v) => v.code === "worktree_shared"),
    JSON.stringify(report.violations ?? []),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // Out-of-window lines are history. The 18 Sep incident itself is quoted in
  // the register preamble and in this backlog; a control that re-reports it
  // on every run trains its reader to ignore it.
  const { dir, file } = fixture([
    "2026-09-18T14:05Z | lane-a#run-1 | item T-100 claimed | worktree /tmp/exec-old-20260918",
    "2026-09-18T14:20Z | lane-a#run-2 | item T-101 claimed | worktree /tmp/exec-old-20260918",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "a collision entirely outside the window is not re-reported",
    !report.violations?.some((v) => v.code === "worktree_shared"),
    JSON.stringify(report.violations ?? []),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // Found on the real register, not reasoned about: the first version of this
  // control fired on a line that QUOTED another run's worktree path while
  // narrating a false positive it had just diagnosed. The register is
  // discursive — lanes cite each other's paths constantly — so a bare mention
  // is not a claim to be working in a checkout. Only a working cue makes it
  // one. This case is that real line's shape, reduced.
  const { dir, file } = fixture([
    "2026-09-21T14:05Z | lane-a#run-1 | item T-100 claimed | own worktree /tmp/exec-quoted-20260921, branched from origin/main",
    "2026-09-21T15:40Z | lane-b#run-2 | item T-101 claimed | own worktree /tmp/exec-mine-20260921 | a naive parser reported one shared path (`/tmp/exec-quoted-20260921`) and it was a FALSE POSITIVE",
  ]);
  const r = run(["--file", file, "--now", NOW, "--since", SINCE, "--json"]);
  const report = JSON.parse(r.stdout || "{}");
  check(
    "quoting another run's worktree path in narrative is not working in it",
    !report.violations?.some((v) => v.code === "worktree_shared"),
    JSON.stringify(report.violations ?? []),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// T-706. The run-identity resolver is correct and, since item 34 repaired the
// parser, it finally receives real identities. But nothing calls it at the
// moment ownership is actually decided: an agent reads the register and judges
// for itself, which is precisely the 18 Sep failure T-594 describes. The
// `worktree_shared` control audits a register that ALREADY records the
// collision — after the fact, by construction.
//
// This is the pre-claim gate: given the register, this run's identity and an
// item id, it answers take / already-yours / held-by-a-sibling /
// held-by-another and refuses the last two with a non-zero exit.
//
// Every case below drives the real CLI as a child process and reads its exit
// status, not its prose.
// ---------------------------------------------------------------------------

const PRECLAIM_NOW = "2026-09-22T18:30:00Z";

function preclaim(file, item, identity, extra = []) {
  const r = run([
    "--preclaim",
    "--file",
    file,
    "--item",
    item,
    "--identity",
    identity,
    "--now",
    PRECLAIM_NOW,
    "--json",
    ...extra,
  ]);
  let report = {};
  try {
    report = JSON.parse(r.stdout || "{}");
  } catch {
    report = {};
  }
  return { ...r, report };
}

{
  // THE case the control exists for, and the one base-name keying gets wrong.
  // Two runs of ONE scheduled task. The sibling holds item T-800; this run
  // must be refused, and refused with a non-zero exit so a script cannot
  // proceed past it by ignoring the prose.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | source-backlog-executor#20260922T175543Z | item T-800 claimed | files: scripts/exec/a.mjs",
  ]);
  const r = preclaim(file, "T-800", "source-backlog-executor#20260922T182000Z");
  check(
    "a sibling run under the same base agent is refused the item",
    r.report.verdict === "held-by-a-sibling",
    `verdict=${r.report.verdict} stdout=${r.stdout} stderr=${r.stderr}`,
  );
  check(
    "refusing a sibling exits non-zero",
    r.status !== 0,
    `status=${r.status}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The negative control, and it must be independent of the case above: the
  // SAME run re-reading its own claim mid-flight is resuming, not colliding,
  // and a gate that refused it would make every multi-step run unworkable.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | source-backlog-executor#20260922T175543Z | item T-800 claimed | files: scripts/exec/a.mjs",
  ]);
  const r = preclaim(file, "T-800", "source-backlog-executor#20260922T175543Z");
  check(
    "the exact run that wrote the claim may continue on it",
    r.report.verdict === "already-yours",
    `verdict=${r.report.verdict} stdout=${r.stdout} stderr=${r.stderr}`,
  );
  check(
    "continuing your own claim exits zero",
    r.status === 0,
    `status=${r.status}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // A different lane entirely. Same refusal, different reason — the two must
  // not collapse, because a sibling collision is a bug in THIS task's
  // scheduling and a foreign claim is ordinary two-lane traffic.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | codex-some-item#20260922T175543Z | item T-800 claimed | files: scripts/exec/a.mjs",
  ]);
  const r = preclaim(file, "T-800", "source-backlog-executor#20260922T182000Z");
  check(
    "another lane's live claim is refused as held-by-another",
    r.report.verdict === "held-by-another",
    `verdict=${r.report.verdict} stdout=${r.stdout}`,
  );
  check("refusing a foreign claim exits non-zero", r.status !== 0, `status=${r.status}`);
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // An item nobody has named is free, and an item whose newest live line
  // RELEASES it is free again. The second half is not a nicety: items 34,
  // T-400, T-410 and T-421 were all claimed and released inside one 3-hour
  // window today, so a gate that read a release as a live claim would have
  // refused the next run its own work.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | source-backlog-executor#20260922T175543Z | item T-800 claimed | files: scripts/exec/a.mjs",
    "2026-09-22T18:12:00Z | source-backlog-executor#20260922T175543Z | RELEASED item T-800 — merged; all files free",
  ]);
  const free = preclaim(file, "T-800", "source-backlog-executor#20260922T182000Z");
  check(
    "a released item is free again for a sibling run",
    free.report.verdict === "take",
    `verdict=${free.report.verdict} stdout=${free.stdout}`,
  );
  check("taking a free item exits zero", free.status === 0, `status=${free.status}`);

  const never = preclaim(file, "T-801", "source-backlog-executor#20260922T182000Z");
  check(
    "an item no live line names is free",
    never.report.verdict === "take",
    `verdict=${never.report.verdict}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // Liveness. A claim older than the 3-hour window is expired by the protocol
  // and the gate must not resurrect it.
  const { dir, file } = fixture([
    "2026-09-22T14:00:00Z | codex-some-item#20260922T140000Z | item T-800 claimed | files: scripts/exec/a.mjs",
  ]);
  const r = preclaim(file, "T-800", "source-backlog-executor#20260922T182000Z");
  check(
    "a claim older than the liveness window does not hold the item",
    r.report.verdict === "take",
    `verdict=${r.report.verdict} stdout=${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The reach limit item 34 measured, stated as a test rather than as prose:
  // 81 of the register's 99 identities carry NO run id, so ownership cannot be
  // resolved for them at all. The gate governs the 18 suffixed identities and
  // must fail OPEN on the rest — a gate that refused every legacy line would
  // refuse work on nearly every historical item, and would be turned off.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | claude-code-executor | item T-800 claimed | files: scripts/exec/a.mjs",
  ]);
  const r = preclaim(file, "T-800", "source-backlog-executor#20260922T182000Z");
  check(
    "a legacy claim with no run id is reported, not resolved",
    r.report.verdict === "unresolved-legacy",
    `verdict=${r.report.verdict} stdout=${r.stdout}`,
  );
  check("an unresolvable legacy claim fails open", r.status === 0, `status=${r.status}`);
  const strict = preclaim(file, "T-800", "source-backlog-executor#20260922T182000Z", [
    "--strict",
  ]);
  check(
    "--strict turns the legacy advisory into a refusal",
    strict.status !== 0,
    `status=${strict.status}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The within-record leak, on this axis. A register line is discursive: this
  // one claims T-800 while naming T-801's blocker in the same sentence. Only
  // the id in SUBJECT position — the one the claim verb governs — is the item
  // being claimed. Attributing the line to every id it mentions would have the
  // gate refuse T-801 to a run that is entitled to it.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | codex-some-item#20260922T175543Z | item T-800 claimed — note T-801 is NOT taken, it is merely blocked behind PR #8255",
  ]);
  const subject = preclaim(file, "T-800", "source-backlog-executor#20260922T182000Z");
  check(
    "the id the claim verb governs holds the item",
    subject.report.verdict === "held-by-another",
    `verdict=${subject.report.verdict}`,
  );
  const mentioned = preclaim(file, "T-801", "source-backlog-executor#20260922T182000Z");
  check(
    "an id merely mentioned in the same line does not hold the item",
    mentioned.report.verdict === "take",
    `verdict=${mentioned.report.verdict} stdout=${mentioned.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // An identity with no run id cannot be a current identity at all. The gate
  // must say so rather than silently treating the base name as an identity —
  // that IS the defect.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | source-backlog-executor#20260922T175543Z | item T-800 claimed",
  ]);
  const r = preclaim(file, "T-800", "source-backlog-executor");
  check(
    "a current identity carrying no run id is rejected outright",
    r.status !== 0 && r.report.verdict === "invalid-identity",
    `status=${r.status} verdict=${r.report.verdict} stderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


// ---------------------------------------------------------------------------
// Item T-707. The pre-claim gate answers ITEM ownership; the protocol's actual
// collision unit is the FILE.
//
// T-706 shipped a gate that decides whether a run may take an item. But the
// rule that has cost real work is one-owner-per-FILE: two runs may hold two
// DIFFERENT items whose file lists overlap, and the item gate says `take` to
// both. T-706's own run had to pass over T-705 and T-703 by reading claim
// lines and comparing file lists by hand — precisely the manual judgement the
// gate exists to remove, one level down.
//
// Every case here drives the real CLI as a child process and reads its exit
// status. The register is a fixture except where a case says otherwise; the
// one case that reads the REAL register is marked, and it is there because a
// detector proven only on fixtures it was written beside has never met the
// shape it was filed against.
// ---------------------------------------------------------------------------

function preclaimFiles(file, item, identity, files, extra = []) {
  return preclaim(file, item, identity, ["--files", files, ...extra]);
}

{
  // The declared contract of the protocol: a claim line's `files:` list. A
  // second run asking for a path on that list is refused, and the refusal
  // names the path and the holder — an unattributed refusal cannot be acted
  // on.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs, scripts/exec/build-source-board.test.mjs",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs,scripts/exec/register-time-authority.mjs",
  );
  check(
    "a path on another live claim's files: list refuses the run",
    r.status === 1 && r.report.fileOverlap?.refuses === true,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  check(
    "the refusal names the contended path",
    (r.report.fileOverlap?.conflicts ?? []).some(
      (c) => c.path === "scripts/exec/build-source-board.mjs",
    ),
    JSON.stringify(r.report.fileOverlap?.conflicts),
  );
  check(
    "the refusal names the holder identity and its line",
    (r.report.fileOverlap?.conflicts ?? []).some(
      (c) => c.agent === "claude-code-cc-a#20260922T1830Z" && c.lineNumber > 0,
    ),
    JSON.stringify(r.report.fileOverlap?.conflicts),
  );
  check(
    "the uncontended path in the same request is not reported as a conflict",
    !(r.report.fileOverlap?.conflicts ?? []).some(
      (c) => c.path === "scripts/exec/register-time-authority.mjs",
    ),
    JSON.stringify(r.report.fileOverlap?.conflicts),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The item gate and the file gate are independent, and the file gate must be
  // able to refuse a run the item gate waves through. That composition IS the
  // defect: two different items, one shared file.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  const itemOnly = preclaim(file, "T-705", "source-backlog-executor#20260922T182000Z");
  check(
    "the item gate alone says take — a DIFFERENT item is free",
    itemOnly.status === 0 && itemOnly.report.verdict === "take",
    `status=${itemOnly.status} verdict=${itemOnly.report.verdict}`,
  );
  const withFiles = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "the same run is refused once its file list is declared",
    withFiles.status === 1 && withFiles.report.verdict === "take",
    `status=${withFiles.status} verdict=${withFiles.report.verdict}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // A fixture whose two claims share no path cannot fail this control, so it
  // is here only to hold the other direction shut: a disjoint list still runs.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/register-time-authority.mjs",
  );
  check(
    "a disjoint file list is not refused",
    r.status === 0 && r.report.fileOverlap?.refuses === false,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // THE PARSING LIMIT THE ITEM NAMES, DECIDED RATHER THAN LEFT TO CHANCE.
  // Several claim lines name a DIRECTORY — `docs/releases/records/` — because
  // the file inside it does not exist yet. A directory is not a collision:
  // nearly every claim in the register names that one, and two runs adding two
  // DIFFERENT records to it do not contend. So a directory never refuses, in
  // either position, and it is reported as a note instead of swallowed.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed | files: docs/releases/records/, scripts/exec/build-source-board.mjs",
  ]);
  const bothDirs = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "docs/releases/records/",
  );
  check(
    "a directory named by both claims is not a collision",
    bothDirs.status === 0 && bothDirs.report.fileOverlap?.refuses === false,
    `status=${bothDirs.status} overlap=${JSON.stringify(bothDirs.report.fileOverlap)}`,
  );
  check(
    "the shared directory is reported as a note rather than dropped",
    (bothDirs.report.fileOverlap?.notes ?? []).some(
      (n) => n.path === "docs/releases/records/",
    ),
    JSON.stringify(bothDirs.report.fileOverlap?.notes),
  );
  const fileInDir = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "docs/releases/records/2026-09-22-t707.md",
  );
  check(
    "a claimed directory does not lock the files beneath it",
    fileInDir.status === 0 && fileInDir.report.fileOverlap?.refuses === false,
    `status=${fileInDir.status} overlap=${JSON.stringify(fileInDir.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // A glob is a scope statement, not a file. `src/**` appears in the register
  // where a lane is describing its blast radius; refusing on it would refuse
  // every run that touches any source file.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | codex-lane | item T-704 claimed | files: src/**, .github/workflows/unit-suites.yml",
  ]);
  const glob = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "src/lib/source/thing.ts",
  );
  check(
    "a glob scope in another claim does not refuse a file under it",
    glob.status === 0 && glob.report.fileOverlap?.refuses === false,
    `status=${glob.status} overlap=${JSON.stringify(glob.report.fileOverlap)}`,
  );
  const exact = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    ".github/workflows/unit-suites.yml",
  );
  check(
    "a dotfile-rooted path on the same list still refuses",
    exact.status === 1,
    `status=${exact.status} overlap=${JSON.stringify(exact.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // This run's OWN earlier line does not block it. A run appends progress
  // lines to its own claim; reading those as contention would refuse every
  // run its second time through.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | source-backlog-executor#20260922T182000Z | item T-705 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "this run's own file list does not block this run",
    r.status === 0 && r.report.fileOverlap?.refuses === false,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // A SIBLING — same scheduled task, different run id — is a different owner,
  // and its file list contends exactly as a stranger's does. This is the
  // distinction base-name keying loses, one level down from T-706.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | source-backlog-executor#20260922T045559Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "a sibling run's file list contends",
    r.status === 1 && (r.report.fileOverlap?.conflicts ?? []).some((c) => c.ownership === "sibling"),
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // DELIBERATELY DIFFERENT FROM THE ITEM GATE, and the reason is worth the
  // line: T-706 fails OPEN on a legacy holder because 81 of 99 identities on
  // the real register carry no run id, so refusing them would refuse nearly
  // every item and the gate would be switched off. The file gate has no such
  // blast radius — it fires only when a path actually overlaps — and an
  // overlapping path held by anyone who is not this exact run is a collision
  // whether or not the holder can be named. So it fails CLOSED.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | codex-some-lane | item T-704 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "a legacy holder with no run id still contends on files",
    r.status === 1 && (r.report.fileOverlap?.conflicts ?? []).some((c) => c.ownership === "legacy_other"),
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // A release line frees its files — that is what the register's release
  // grammar means, and the item gate already honours it. Not honouring it
  // here would leave every released file locked for three hours.
  const { dir, file } = fixture([
    "2026-09-22T18:10:00Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs",
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | RELEASED item T-704 — merged, all files free | files: scripts/exec/build-source-board.mjs",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "a released claim's file list does not contend",
    r.status === 0 && r.report.fileOverlap?.refuses === false,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The 3h window governs files exactly as it governs items.
  const { dir, file } = fixture([
    "2026-09-22T14:00:00Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "an expired claim's file list does not contend",
    r.status === 0 && r.report.fileOverlap?.refuses === false,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // `files:` lists are prose. They arrive backticked, comma-separated,
  // sentence-terminated and pipe-terminated, and a parser that takes the raw
  // token refuses nothing because nothing ever matches.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed | files: `scripts/exec/build-source-board.mjs`, `scripts/exec/build-source-board.test.mjs`. | more prose",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.test.mjs",
  );
  check(
    "a backticked, sentence-terminated path is normalised before comparison",
    r.status === 1,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // A slash is not a path. The register is full of `Product/Lab`, `and/or`
  // and `24/7`, and a token-with-a-slash rule reads all three as files.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed — shared Product/Lab traffic, and/or the 24/7 lane | files: scripts/exec/build-source-board.mjs",
  ]);
  for (const notAPath of ["Product/Lab", "and/or", "24/7"]) {
    const r = preclaimFiles(
      file,
      "T-705",
      "source-backlog-executor#20260922T182000Z",
      `${notAPath},scripts/exec/register-time-authority.mjs`,
    );
    check(
      `a bare slashed word is not read as a path: ${notAPath}`,
      r.status === 0 &&
        (r.report.fileOverlap?.unparsed ?? []).includes(notAPath) &&
        (r.report.fileOverlap?.conflicts ?? []).length === 0,
      `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
    );
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // Usage: the file gate is opt-in, so a run that declares no file list gets
  // the item gate's answer unchanged and is told the file check did not run.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  const r = preclaim(file, "T-705", "source-backlog-executor#20260922T182000Z");
  check(
    "with no --files the file gate reports that it did not run",
    r.status === 0 && r.report.fileOverlap?.checked === false,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // THE REAL KNOWN POSITIVE, read from the register itself rather than from a
  // fixture written beside the detector. At 18:20:29Z `claude-code-cc-a#
  // 20260922T1830Z` took item T-704 and named `scripts/exec/build-source-
  // board.mjs` as its scope — in PROSE, in backticks, with no `files:` list on
  // the line at all. A `files:`-only parser passes every fixture above and
  // MISSES this, which is the shape T-467 was filed against.
  //
  // Skipped, loudly, when the operator register is not on this machine: CI has
  // no `~/Downloads`. It is not skipped silently, because a case that quietly
  // vanishes proves nothing.
  const register = path.join(
    process.env.SOURCE_EXECUTION_HOME ?? path.join(os.homedir(), "Downloads"),
    "EXECUTION_CLAIMS.md",
  );
  if (!fs.existsSync(register)) {
    console.log(`  SKIP  real known positive — no operator register at ${register}`);
  } else {
    const r = run([
      "--preclaim",
      "--file",
      register,
      "--item",
      "T-705",
      "--identity",
      "source-backlog-executor#20260922T182100Z",
      "--files",
      "scripts/exec/build-source-board.mjs",
      "--now",
      "2026-09-22T18:21:00Z",
      "--json",
    ]);
    let report = {};
    try {
      report = JSON.parse(r.stdout || "{}");
    } catch {
      report = {};
    }
    const conflicts = report.fileOverlap?.conflicts ?? [];
    check(
      "the real 18:20:29Z scope mention is caught on the real register",
      r.status === 1 &&
        conflicts.some(
          (c) =>
            c.path === "scripts/exec/build-source-board.mjs" &&
            c.agent === "claude-code-cc-a#20260922T1830Z",
        ),
      `status=${r.status} conflicts=${JSON.stringify(conflicts)}`,
    );

    // A SECOND REAL KNOWN POSITIVE, and the one that settles whether this
    // control earns its place: replay the register at 2026-09-22T20:33:00Z,
    // the instant a run took U-502 and the structure map with it. The ITEM
    // gate says `take` and is right — U-502 was genuinely unclaimed. The file
    // gate refuses, naming two live holders of
    // `scripts/exec/source-stage-map.json`. That collision then happened, and
    // was found by hand 34 minutes later at a cost of one flagged pull
    // request and a bucket re-measurement.
    const replay = run([
      "--preclaim",
      "--file",
      register,
      "--item",
      "U-502",
      "--identity",
      "a-run-that-did-not-check#20260922T203300Z",
      "--files",
      "scripts/exec/source-stage-map.json",
      "--now",
      "2026-09-22T20:33:00Z",
      "--json",
    ]);
    let replayed = {};
    try {
      replayed = JSON.parse(replay.stdout || "{}");
    } catch {
      replayed = {};
    }
    check(
      "the item gate alone waves the real 20:33Z map collision through",
      replayed.verdict === "take",
      `verdict=${replayed.verdict}`,
    );
    check(
      "the file gate refuses it, naming a live holder of the structure map",
      replay.status === 1 &&
        (replayed.fileOverlap?.conflicts ?? []).some(
          (c) =>
            c.path === "scripts/exec/source-stage-map.json" &&
            c.agent === "claude-code-cc-a#20260922T1830Z",
        ),
      `status=${replay.status} conflicts=${JSON.stringify(replayed.fileOverlap?.conflicts)}`,
    );
  }
}


{
  // REACHING THE NEGATOR VETO. Written because the mutation that deletes it
  // SURVIVED the cases above: every fixture there names a file in order to
  // hold it, so a rule that drops disclaimed mentions had nothing to drop and
  // asserted nothing. The forms below are both live in the register right now
  // — a claim names a file precisely to say it is staying off it, and reading
  // either as a hold refuses a run that is entitled to the file.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | codex-lane-a#20260922T1800Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs. Avoid `src/components/source/SourceAnalyticsCanvas.tsx` while PR #8291 is open.",
    "2026-09-22T18:20:30Z | codex-lane-b#20260922T1801Z | item T-709 claimed — this claim does not touch `src/lib/source/shell.ts`, and the work is outside `src/lib/source/canvas.ts`.",
  ]);
  for (const [label, wanted] of [
    ["Avoid `x` while …", "src/components/source/SourceAnalyticsCanvas.tsx"],
    ["does not touch `x`", "src/lib/source/shell.ts"],
    ["outside `x`", "src/lib/source/canvas.ts"],
  ]) {
    const r = preclaimFiles(
      file,
      "T-710",
      "source-backlog-executor#20260922T182000Z",
      wanted,
    );
    check(
      `a file named in order to DISCLAIM it is not held: ${label}`,
      r.status === 0 && r.report.fileOverlap?.refuses === false,
      `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
    );
  }
  // …and the veto must not swallow the holds on the same lines. A negator
  // rule wide enough to free everything is the same defect in the other
  // direction.
  const stillHeld = preclaimFiles(
    file,
    "T-710",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "the veto does not free the path the same line genuinely holds",
    stillHeld.status === 1,
    `status=${stillHeld.status} overlap=${JSON.stringify(stillHeld.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


{
  // AN ABSTENTION HOLDS NOTHING, and this case exists because the gate found
  // the false positive on the REAL register, not in a fixture: the one live
  // line it wrongly read as a hold was `item T-706 NOT TAKEN - already in open
  // PR #8280 ... touching exactly the two files this item names (...)`. The
  // negator is at the head of a six-hundred-character line and the paths are
  // at the end, so no reach-based veto can join them; the announcement verb at
  // the head of the message field can, which is where the register puts it.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 NOT TAKEN — already in open PR #8280, found before any code was written. Nothing built, nothing duplicated, no branch pushed. " +
      "A".repeat(400) +
      " touching exactly the two files this item names (`scripts/exec/register-time-authority.mjs` and `scripts/exec/register-time-authority.test.mjs`).",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/register-time-authority.mjs",
  );
  check(
    "a NOT TAKEN line holds none of the files it names",
    r.status === 0 && r.report.fileOverlap?.refuses === false,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The abstention verb is read at the HEAD of the message field, so a claim
  // that merely says elsewhere that something was not taken still holds its
  // own files. A rule wide enough to free those is the same defect reversed.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | claude-code-cc-a#20260922T1830Z | item T-704 claimed, files: scripts/exec/build-source-board.mjs — note in passing that T-705 was NOT TAKEN by anyone.",
  ]);
  const r = preclaimFiles(
    file,
    "T-705",
    "source-backlog-executor#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "an abstention mentioned mid-line does not free the line's own hold",
    r.status === 1,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The refusal must say WHICH gate refused. The item gate answering
  // `already-yours` while the file gate refuses is the live shape — a run
  // re-reading its own claim with a contended file list — and printing a bare
  // "(REFUSED)" beside `already-yours` reads as a contradiction.
  const { dir, file } = fixture([
    "2026-09-22T18:10:00Z | source-backlog-executor#20260922T182000Z | item T-705 claimed",
    "2026-09-22T18:20:29Z | codex-other#20260922T1830Z | item T-704 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  const r = run([
    "--preclaim",
    "--file",
    file,
    "--item",
    "T-705",
    "--identity",
    "source-backlog-executor#20260922T182000Z",
    "--files",
    "scripts/exec/build-source-board.mjs",
    "--now",
    PRECLAIM_NOW,
  ]);
  check(
    "the refusal names the gate that produced it",
    r.status === 1 &&
      /verdict: already-yours \(REFUSED by the files gate\)/.test(r.stdout),
    `status=${r.status} stdout=${r.stdout}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


{
  // THE PROSE SHAPE, AS A COMMITTED FIXTURE, because the two cases that read
  // the real register skip wherever it is absent — and CI is exactly where it
  // is absent. Without this, the mutation that reads paths only from an
  // explicit `files:` label passes every case a runner can execute.
  //
  // This is the real known positive's shape and nothing of its content: a
  // claim that names its file in a backticked Scope sentence, with no `files:`
  // label anywhere on the line.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | lane-a#20260922T1830Z | TAKING item T-800 — within-record rung attribution leak. Branch to be cut from exact `origin/main`. Scope: `scripts/exec/build-source-board.mjs` rung attribution only, plus its behavioral suite and one release record.",
  ]);
  const r = preclaimFiles(
    file,
    "T-801",
    "lane-b#20260922T182000Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "a path named in prose with no files: label still holds the file",
    r.status === 1 &&
      (r.report.fileOverlap?.conflicts ?? []).some(
        (c) => c.path === "scripts/exec/build-source-board.mjs" && c.agent === "lane-a#20260922T1830Z",
      ),
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // THE COLLISION SHAPE, AS A COMMITTED FIXTURE, for the same reason: two
  // identities holding one file across two DIFFERENT items, which the item
  // gate waves through and the file gate must not.
  const { dir, file } = fixture([
    "2026-09-22T17:51:19Z | lane-a#20260922T1830Z | TAKEN AND AT PR/CI — placement of the unmapped ids on `scripts/exec/source-stage-map.json`. PR #8282 OPENED, auto-merge armed, NOT merged.",
    "2026-09-22T17:59:26Z | lane-b#20260922T185540Z | TAKING new item T-802 | files: scripts/exec/source-stage-map.json",
  ]);
  const r = preclaimFiles(
    file,
    "T-803",
    "lane-c#20260922T203300Z",
    "scripts/exec/source-stage-map.json",
  );
  check(
    "one file held under two different items by two identities refuses a third",
    r.status === 1 && r.report.verdict === "take" && (r.report.fileOverlap?.conflicts ?? []).length === 2,
    `status=${r.status} verdict=${r.report.verdict} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


{
  // `--files` given, nothing in it readable as a path. The check then ran over
  // an EMPTY set and would print "0 requested, 0 contended" — indistinguishable
  // from a clean result, which is the substitution the NOT CHECKED line exists
  // to prevent, one step later. A list that came out empty by accident is a
  // usage error, not a pass.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | lane-a#20260922T1830Z | item T-800 claimed | files: scripts/exec/build-source-board.mjs",
  ]);
  for (const [label, arg] of [
    ["an empty --files value", ""],
    ["a value with no readable path", "not-a-path, Product/Lab"],
  ]) {
    const r = preclaimFiles(file, "T-801", "lane-b#20260922T182000Z", arg);
    check(
      `${label} is a usage error, not a clean run`,
      r.status === 2,
      `status=${r.status} stdout=${r.stdout} stderr=${r.stderr}`,
    );
  }
  // …and a list with one readable path among the noise still runs.
  const mixed = preclaimFiles(
    file,
    "T-801",
    "lane-b#20260922T182000Z",
    "not-a-path, scripts/exec/build-source-board.mjs",
  );
  check(
    "one readable path among unreadable entries still runs the check",
    mixed.status === 1 && (mixed.report.fileOverlap?.unparsed ?? []).includes("not-a-path"),
    `status=${mixed.status} overlap=${JSON.stringify(mixed.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


// ---------------------------------------------------------------------------
// Item T-710 — a line that ATTRIBUTES a path to another lane does not hold it.
//
// T-707 gave the file gate two vetoes: a short-reach negator in front of the
// path, and an abstention verb at the head of the message. Neither reaches the
// form the register actually writes when one lane surveys the others before
// choosing what to touch — an attributive relative clause, mid-paragraph, with
// no negator anywhere near the path:
//
//   ... the only two naming any file below are 19:15:17Z (`claude-code-cc-a#...`,
//   which names `scripts/exec/register-time-authority.mjs` ...) and 21:23:30Z
//   (`codex-source-new-response-intake`, which lists
//   `docs/architecture/test-ci-coverage-census.json`) — so I am deliberately
//   NOT touching the census file
//
// That line is live register line 1887 at 21:28:22Z, and the gate read it as a
// holder of both paths. The disclaimer is four hundred characters downstream
// of the first path, so no reach-based negator can join them; what CAN join
// them is the attributive verb four words in front, which is the cue the
// register uses precisely because it is attributing the path to someone else.
//
// THE OTHER OPTION IN THE ITEM WAS RULED OUT BY MEASUREMENT, not by taste.
// Narrowing held paths to each line's own `files:` list needs a majority of
// live claims to carry one; re-measured on the live register at 00:15Z,
// 9 of 62 live lines do. A `files:`-only parser would stop reading the paths
// that 53 of those lines name in prose, which is a false PASS — a collision
// rather than a look.
//
// The direction of error matters and decides how tight the rule is. A missed
// veto costs a reader one look at a printed holder; an over-wide veto frees a
// path someone is genuinely editing. So the cue is not a bare verb — "this
// claim holds `x`" must still hold `x` — it is the verb in a form that names a
// THIRD party: a relative clause (`which names`), an explicit agent (`held by`),
// or a third-party subject (`that sibling holds`).
// ---------------------------------------------------------------------------

{
  // The real known positive, verbatim in shape from live register line 1887,
  // including the distance between the paths and the disclaimer that follows
  // them. Both attributed paths must stop holding.
  const { dir, file } = fixture([
    "2026-09-22T18:20:29Z | source-backlog-executor#20260922T212500Z | item T-707 claimed — over the 53 register lines stamped inside the live 3h window, " +
      "the only two naming any file below are 19:15:17Z (`claude-code-cc-a#20260922T1830Z`, which names " +
      "`scripts/exec/register-time-authority.mjs` while saying `item T-706 NOT TAKEN`) and 21:23:30Z " +
      "(`codex-source-new-response-intake`, which lists `docs/architecture/test-ci-coverage-census.json`) — " +
      "B".repeat(400) +
      " so I am deliberately NOT touching the census file. files: scripts/exec/append-claim.mjs",
  ]);

  const named = preclaimFiles(
    file,
    "T-800",
    "codex-other-lane#20260922T182500Z",
    "scripts/exec/register-time-authority.mjs",
  );
  check(
    "`which names <path>` attributes the path to another lane and does not hold it",
    named.status === 0 && named.report.fileOverlap?.refuses === false,
    `status=${named.status} overlap=${JSON.stringify(named.report.fileOverlap)}`,
  );

  const listed = preclaimFiles(
    file,
    "T-800",
    "codex-other-lane#20260922T182500Z",
    "docs/architecture/test-ci-coverage-census.json",
  );
  check(
    "`which lists <path>` attributes the path to another lane and does not hold it",
    listed.status === 0 && listed.report.fileOverlap?.refuses === false,
    `status=${listed.status} overlap=${JSON.stringify(listed.report.fileOverlap)}`,
  );

  // The same line's OWN file list is four hundred characters past the
  // attributive clause and is not attributed to anyone. A veto that freed it
  // too would be the defect reversed, and this is the assertion that pins the
  // rule to the cue rather than to the line.
  const own = preclaimFiles(
    file,
    "T-800",
    "codex-other-lane#20260922T182500Z",
    "scripts/exec/append-claim.mjs",
  );
  check(
    "the attributive veto does not free the path the same line genuinely holds",
    own.status === 1,
    `status=${own.status} overlap=${JSON.stringify(own.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The second live form, from register line 1911 at 21:57:36Z: a third-party
  // SUBJECT rather than a relative pronoun. `that sibling holds <path>` is one
  // run reporting where another run already is.
  const { dir, file } = fixture([
    "2026-09-22T18:21:36Z | source-backlog-executor#20260922T215500Z | item T-711 claimed — one live line stamped since 18:55Z: " +
      "that sibling holds `scripts/exec/register-time-authority.mjs`, so I am reimplementing nothing. files: scripts/exec/build-execution-queue.mjs",
  ]);
  const r = preclaimFiles(
    file,
    "T-800",
    "codex-other-lane#20260922T182500Z",
    "scripts/exec/register-time-authority.mjs",
  );
  check(
    "`<third party> holds <path>` reports another run's hold and does not create one",
    r.status === 0 && r.report.fileOverlap?.refuses === false,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // The two attributive forms the item names that today's live window does not
  // exercise. They are proven by FIXTURE, and that is said rather than left to
  // be assumed observed. Both are written here in the position the rule
  // governs — the cue in FRONT of the path. A postfix attribution
  // (`` `a.mjs` is held by X ``) is NOT covered and is recorded as a known gap
  // rather than asserted away: the reach discipline this veto inherits from
  // `PATH_NEGATOR` looks backwards only.
  //
  // The agent id between the verb and the path is longer than the 40-character
  // reach, which is why `attributiveReach` collapses backticked spans; that is
  // the behaviour this case actually pins.
  const { dir, file } = fixture([
    "2026-09-22T18:22:00Z | codex-survey-lane#20260922T214000Z | item T-801 claimed — files held by `codex-cpo-source-new-smoke`: " +
      "`docs/architecture/test-ci-coverage-census.json`, and claimed by `source-backlog-executor#20260922T215500Z`: " +
      "`scripts/exec/append-claim.mjs`, so I am on neither. files: scripts/exec/build-source-board.mjs",
  ]);
  for (const [label, path] of [
    ["held by", "docs/architecture/test-ci-coverage-census.json"],
    ["claimed by", "scripts/exec/append-claim.mjs"],
  ]) {
    const r = preclaimFiles(file, "T-800", "codex-other-lane#20260922T182500Z", path);
    check(
      `\`${label} <agent>\` attributes the path away and does not hold it`,
      r.status === 0 && r.report.fileOverlap?.refuses === false,
      `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
    );
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // THE FALSE-PASS GUARD, and the reason the cue is not a bare verb. A line
  // that holds its files by writing the verb about ITSELF must keep holding
  // them. `this claim holds`, `I hold`, `this run names` are the self-referential
  // forms, and none of them attributes anything to a third party.
  const selfForms = [
    "this claim holds `scripts/exec/a.mjs`",
    "I hold `scripts/exec/a.mjs` for the duration",
    "the branch names `scripts/exec/a.mjs` as its only edit",
  ];
  for (const form of selfForms) {
    const { dir, file } = fixture([
      `2026-09-22T18:22:00Z | codex-survey-lane#20260922T214000Z | item T-801 claimed — ${form}.`,
    ]);
    const r = preclaimFiles(
      file,
      "T-800",
      "codex-other-lane#20260922T182500Z",
      "scripts/exec/a.mjs",
    );
    check(
      `a self-referential hold still holds: ${form.slice(0, 28)}...`,
      r.status === 1,
      `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
    );
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  // Reach. The attributive cue governs the path it introduces, not every path
  // later in the sentence, and a sentence boundary ends its reach — the same
  // discipline `PATH_NEGATOR` uses. Without this the first `which names` on a
  // discursive line would free everything after it.
  const { dir, file } = fixture([
    "2026-09-22T18:22:00Z | codex-survey-lane#20260922T214000Z | item T-801 claimed — the sibling names `scripts/exec/register-time-authority.mjs`. " +
      "My own edit is `scripts/exec/build-source-board.mjs`.",
  ]);
  const attributed = preclaimFiles(
    file,
    "T-800",
    "codex-other-lane#20260922T182500Z",
    "scripts/exec/register-time-authority.mjs",
  );
  check(
    "the attributed path in the first sentence does not hold",
    attributed.status === 0,
    `status=${attributed.status} overlap=${JSON.stringify(attributed.report.fileOverlap)}`,
  );
  const next = preclaimFiles(
    file,
    "T-800",
    "codex-other-lane#20260922T182500Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "a path in the NEXT sentence is out of the attributive cue's reach and still holds",
    next.status === 1,
    `status=${next.status} overlap=${JSON.stringify(next.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // `claimedPaths` is exported and is where the rule lives; assert it directly
  // as well as through the process, so a failure says which layer moved.
  const attributed = claimedPaths(
    "item T-801 claimed — (`codex-other`, which lists `scripts/exec/a.mjs`) and my own `scripts/exec/b.mjs`",
  ).map((p) => p.path);
  check(
    "claimedPaths drops the attributed path and keeps the line's own",
    !attributed.includes("scripts/exec/a.mjs") && attributed.includes("scripts/exec/b.mjs"),
    `paths=${JSON.stringify(attributed)}`,
  );
}

// ---------------------------------------------------------------------------
// Item T-712 — the announcement verb behind the helper's generated prefix.
//
// `append-claim.mjs` opened EVERY record it wrote with `item <id> claimed`,
// including releases. Measured on the live register at 23:29Z: the release
// written at 23:08:45Z ("RELEASED item T-708 — merged, DEPLOYED ... all files
// free") was still printed as the HOLDER of the three files it had handed
// back, and a run asking for those files got 6 contended. With the prefix read
// past, the same request on the same register gets 0.
//
// T-712 fixed the writer. These lines are already in an append-only register
// and cannot be restamped, so the reader has to recognise the one generated
// string — which is a repair of a known machine prefix, NOT a widening of the
// head-of-message rule T-707 chose on purpose.
// ---------------------------------------------------------------------------
{
  const LIVE_SHAPE =
    "2026-09-22T18:08:45Z | source-backlog-executor#20260922T215500Z | " +
    "item T-708 claimed on branch `exec/t-708-claim-append-gate` — RELEASED item T-708 — " +
    "merged, DEPLOYED, ACA runtime invariant PROVEN; all files free. " +
    "files: scripts/exec/append-claim.mjs";
  check(
    "a release behind the helper's generated prefix reads as a release",
    announcesRelease(LIVE_SHAPE) === true,
    LIVE_SHAPE,
  );
  check(
    "an abstention behind the same prefix reads as an abstention",
    announcesAbstention(
      "2026-09-22T18:08:45Z | a#b | item T-706 claimed — NOT TAKEN — already in open PR #8280",
    ) === true,
  );

  // The negative control T-707 chose the head-of-message rule for. Nearly
  // every claim line in the register promises a release record; if that read
  // as a release, every item in flight would be freed. Stripping a known
  // prefix must not reach it.
  check(
    "NEGATIVE CONTROL — an ordinary claim that merely promises a release record still HOLDS",
    announcesRelease(
      "2026-09-22T18:08:45Z | a#b | item T-708 claimed on branch `x` — taking it; " +
        "one public-safe release record per PR, released to CI when green",
    ) === false,
  );
  check(
    "NEGATIVE CONTROL — the prefix is not stripped off a line that does not carry it",
    announcesRelease("2026-09-22T18:08:45Z | a#b | item T-708 was claimed earlier — RELEASED now") === false,
  );

  // The mandatory `claimed` verb below was added because mutation testing said
  // so: deleting it left the suite green, so nothing constrained it, and a
  // bare `item <id> —` opening would then be stripped off hand-written lines.
  //
  // The `^` anchor is a different story, recorded rather than papered over.
  // Deleting it ALSO leaves this suite green, and no test can change that:
  // `String.replace` with a non-global regex removes one match in place, so a
  // mid-sentence strip leaves the text before it standing and the result still
  // does not OPEN with the announcement verb. The anchor is therefore correct
  // but unobservable here — kept as intent, not counted as proven.
  check(
    "a prefix appearing only mid-sentence does not produce a release either way",
    announcesRelease(
      // No generated prefix at the head — one appears only mid-sentence. An
      // unanchored rule strips THAT one and reads the tail as a release.
      "2026-09-22T18:08:45Z | a#b | taking it, superseding " +
        "item T-700 claimed — RELEASED item T-700 earlier today",
    ) === false,
  );
  check(
    "NEGATIVE CONTROL — `claimed` is required; a bare `item <id> —` opening is not a generated prefix",
    announcesRelease(
      "2026-09-22T18:08:45Z | a#b | item T-799 — RELEASED it yesterday, taking T-800 now",
    ) === false,
  );

  // End to end, through the file gate, on the exact shape measured live.
  const { dir, file } = fixture([
    // Same identity claims and releases, as the live pair did: a release frees
    // its OWN agent's hold, never another run's.
    "2026-09-22T18:00:00Z | source-backlog-executor#20260922T215500Z | item T-708 claimed — taking it | " +
      "files: scripts/exec/append-claim.mjs",
    LIVE_SHAPE,
  ]);
  const r = preclaimFiles(file, "T-712", "sibling#run-2", "scripts/exec/append-claim.mjs");
  check(
    "THE MOVEMENT — a helper-written release frees the files it held, same register, same request",
    r.status === 0 && r.report.fileOverlap?.conflicts?.length === 0,
    `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Item T-712 — an abstention is transparent to the item half, not authoritative.
//
// The file half has skipped abstentions since T-707; this half never did, so
// `item T-803 NOT TAKEN — already in open PR #8280` refused the next run that
// came for it. The repair SKIPS the line rather than answering `take` from it:
// newest-line-wins would otherwise let B's abstention sit on top of A's live
// claim and report the item free to a third run. A first attempt did exactly
// that, and it is asserted here so the distinction cannot be lost again.
// ---------------------------------------------------------------------------
{
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | a#run-1 | item T-810 NOT TAKEN — already in open PR #8280",
  ]);
  const free = preclaim(file, "T-810", "b#run-2");
  check(
    "an abstention alone does not hold the item it declined",
    free.status === 0 && free.report.verdict === "take",
    JSON.stringify(free.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | a#run-1 | item T-811 claimed — taking it",
    "2026-09-22T18:10:00Z | b#run-2 | item T-811 NOT TAKEN — a#run-1 has it",
  ]);
  const r = preclaim(file, "T-811", "c#run-3");
  check(
    "a LATER abstention does not free an earlier live claim — the real holder still holds",
    r.status === 1 && r.report.holder?.agent === "a#run-1",
    JSON.stringify(r.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Item T-714 — a quoted command-line flag is not a claim on the id it names.
//
// `ITEM_SUBJECT` matches the English cue `item <id>`, and the register quotes
// its own commands constantly: `--preclaim --item T-709 --files ...`. The flag
// spelling satisfies the same cue, so NARRATING that you ran the gate on an id
// records you as HOLDING it — and it is self-reinforcing, because the more
// carefully a run documents the checks it performed, the more ids it locks for
// the full three-hour window.
//
// Found by execution on the live register, not by reading: it is what refused
// T-709 to three consecutive runs. The two shapes asserted below are the real
// known positives, transcribed from register lines 1896 and 1965 — a fixture
// that invented an easier sentence could not have failed here (T-720's lesson
// about proving a detector on a real positive).
//
// The veto is deliberately exact rather than heuristic: the cue is the one or
// two hyphens immediately in front of the word, with a non-word character
// before them. That distinguishes a flag (`--item`, `-item`) from an English
// compound (`line-item`, `sub-item`) without reading any further context, and
// it leaves `ITEM_SUBJECT` itself untouched so the movement is attributable to
// the veto alone.
// ---------------------------------------------------------------------------
{
  // Register line 1896, 2026-09-22T21:44:01Z. Its ONLY mention of T-709.
  const LIVE_1896 =
    "I ran `--preclaim --item T-709 --files scripts/exec/source-stage-map.json` " +
    "against the live register and it exited 1, naming THREE live holds";
  check(
    "REAL POSITIVE — the quoted invocation on register line 1896 does not hold T-709",
    itemSubjects(LIVE_1896).some((id) => id.base === "T-709") === false,
    JSON.stringify(itemSubjects(LIVE_1896)),
  );

  // Register line 1965, 2026-09-23T00:17:00Z. Mentions T-709 twice, both
  // times inside a quoted invocation, while genuinely claiming T-710.
  const LIVE_1965 =
    "item T-710 claimed on branch `exec/t-709-item-subject-negation-veto` — " +
    "NOTE ON WHY THIS ITEM AND NOT T-709: T-709 is higher in the file but the " +
    "sanctioned gate refuses it to me — `--preclaim --item T-709` returns " +
    "held-by-a-sibling on line 1896, whose only mention of T-709 is the CLI " +
    "string `--item T-709` inside a narration saying the item is nobody else's";
  check(
    "REAL POSITIVE — register line 1965 does not hold T-709 through its two quoted flags",
    itemSubjects(LIVE_1965).some((id) => id.base === "T-709") === false,
    JSON.stringify(itemSubjects(LIVE_1965)),
  );
  check(
    "THE SAME LINE STILL HOLDS WHAT IT ACTUALLY CLAIMED — T-710",
    itemSubjects(LIVE_1965).some((id) => id.base === "T-710") === true,
    JSON.stringify(itemSubjects(LIVE_1965)),
  );

  // A single-dash flag is the same thing spelled shorter.
  check(
    "a single-dash `-item T-802` is a flag too",
    itemSubjects("ran `-item T-802` for the check").some((id) => id.base === "T-802") === false,
  );

  // NEGATIVE CONTROLS. Every genuine claim form the register writes must go on
  // holding. A veto that freed these would be a false PASS — two runs on one
  // item — which is far worse than the false refusal it repairs.
  check(
    "NEGATIVE CONTROL — the helper-generated prefix still holds its item",
    itemSubjects("item T-800 claimed on branch `exec/x` — taking it").some(
      (id) => id.base === "T-800",
    ) === true,
  );
  check(
    "NEGATIVE CONTROL — the legacy `- item 21 | agent` form still holds",
    itemSubjects("- item 21 | claude-code-executor | 2026-09-19T12:58Z | branch").some(
      (id) => id.base === "21",
    ) === true,
  );
  check(
    "NEGATIVE CONTROL — `TAKING item T-704` still holds",
    itemSubjects("TAKING item T-704 on branch `exec/y`").some((id) => id.base === "T-704") === true,
  );
  check(
    "NEGATIVE CONTROL — a hyphenated English compound is not a flag",
    itemSubjects("the line-item T-806 is claimed here").some((id) => id.base === "T-806") === true,
  );
  check(
    "NEGATIVE CONTROL — `RELEASED item T-701(a)` keeps its part suffix",
    itemSubjects("RELEASED item T-701(a) — files free").some(
      (id) => id.base === "T-701" && id.part === "(a)",
    ) === true,
  );

  // End to end through the real CLI, on the shape that refused T-709 live: the
  // only live line naming the item quotes a flag, and the item is free.
  const { dir, file } = fixture([
    "2026-09-22T18:00:00Z | other-lane#run-1 | item T-820 claimed — taking T-820; " +
      "I ran `--preclaim --item T-821` against the live register first and it passed",
  ]);
  const free = preclaim(file, "T-821", "source-backlog-executor#run-2");
  check(
    "THE MOVEMENT — the id named only by a quoted flag is claimable",
    free.status === 0 && free.report.verdict === "take",
    JSON.stringify(free.report),
  );
  const held = preclaim(file, "T-820", "source-backlog-executor#run-2");
  check(
    "THE GUARD — the id that line actually claimed is still refused, same register, same run",
    held.status === 1 && held.report.holder?.agent === "other-lane#run-1",
    JSON.stringify(held.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
