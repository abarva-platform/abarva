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
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  resolveClaimOwnership,
  parseRegisterLines,
  announcesRelease,
  announcesAbstention,
  claimedPaths,
  itemSubjects,
  recomputeCueSurface,
  cueSurfaceDivergences,
} from "./register-time-authority.mjs";
import * as control from "./register-time-authority.mjs";

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

// ---------------------------------------------------------------------------
// Item T-709 — a sentence that DENIES an item is claimed does not claim it.
//
// `ITEM_SUBJECT` reads the English cue `item <id>`. The register uses that
// same cue to hand items BACK: `that is items T-707 and T-708, both still
// unclaimed`, `Items **T-713** filed and left unclaimed`. The id sits in
// subject position either way, so the words announcing an item is free are
// read as taking it, and it locks for the full three-hour window.
//
// Same shape as T-703 and T-705 on two other rules — a sentence that denies a
// state read as asserting it — and not latent: T-707 and T-708 were the only
// two claimable lane-T rows in the queue when it fired, and the run that took
// T-707 did so by checking all four register mentions BY HAND, which is the
// manual judgement this gate exists to remove.
//
// The strings below are transcribed from the live register, not invented. A
// fixture writing `item T-800 is not claimed` with the words adjacent would
// pass a rule far too narrow for the real form, where the negation is four or
// five tokens past the id and applies to a conjoined pair (T-720's lesson
// about proving a detector on a real positive).
//
// `ITEM_SUBJECT` itself is untouched, as in T-710 and T-714, so movement on
// the real register is attributable to this veto alone.
// ---------------------------------------------------------------------------
{
  // Register line 1881, 2026-09-22T21:07:07Z. Its only words about T-707.
  const LIVE_1881 =
    "COLLISION FOUND AND FLAGGED, no branch touched — the pre-claim gate that " +
    "would catch it automatically merged only hours ago and nothing calls it " +
    "at claim time — that is items T-707 and T-708, both still unclaimed. " +
    "THE DIFFERENCE IS NOT COSMETIC";
  check(
    "REAL POSITIVE — register line 1881 declares T-707 unclaimed, so it does not hold it",
    itemSubjects(LIVE_1881).some((id) => id.base === "T-707") === false,
    JSON.stringify(itemSubjects(LIVE_1881)),
  );

  // Register line 1963, 2026-09-23T00:10:46Z. Its only mention of T-713.
  const LIVE_1963 =
    "**Not claimed:** any product behaviour change, any tenant write, any " +
    "data-plane effect. Items **T-713** filed and left unclaimed; **T-709** " +
    "and **T-710** remain open, and T-709 notably cannot be taken";
  check(
    "REAL POSITIVE — register line 1963 declares T-713 unclaimed, so it does not hold it",
    itemSubjects(LIVE_1963).some((id) => id.base === "T-713") === false,
    JSON.stringify(itemSubjects(LIVE_1963)),
  );

  // Register line 1887, 2026-09-22T21:28:22Z. Genuinely claims T-707 at its
  // head AND quotes the negated sentence later. The veto is per OCCURRENCE,
  // so the head claim must survive its own line. This is the guard that
  // separates a repair from a hole: a veto reading whole lines would free an
  // item somebody is actively working.
  const LIVE_1887 =
    "item T-707 claimed — the pre-claim gate resolves ITEM ownership; the " +
    "protocol's actual collision unit is the FILE and nothing checks it. The " +
    "refusal I hit reads `that is items T-707 and T-708, both still unclaimed` " +
    "and is filed as T-709";
  check(
    "THE GUARD — a line that claims T-707 at its head keeps it despite quoting the negated form",
    itemSubjects(LIVE_1887).some((id) => id.base === "T-707") === true,
    JSON.stringify(itemSubjects(LIVE_1887)),
  );

  // NEGATIVE CONTROLS. Every genuine claim form must go on holding; freeing
  // one would be two runs on one item, far worse than the false refusal.
  check(
    "NEGATIVE CONTROL — the helper-generated prefix still holds its item",
    itemSubjects("item T-800 claimed on branch `exec/x` — taking it").some(
      (id) => id.base === "T-800",
    ) === true,
  );
  check(
    "NEGATIVE CONTROL — `TAKING item T-704` still holds",
    itemSubjects("TAKING item T-704 on branch `exec/y`").some((id) => id.base === "T-704") === true,
  );
  check(
    "NEGATIVE CONTROL — a claim whose NEGATION is about something else still holds",
    itemSubjects(
      "item T-801 claimed on branch `exec/z` — the runtime digest is OWED and NOT claimed",
    ).some((id) => id.base === "T-801") === true,
  );
  // This one must carry a REAL negator on the far side of the break, close
  // enough to be inside the reach. A control whose far side has nothing to
  // find would pass with the truncation deleted — it did, and a mutation
  // removing the clause break survived the first draft of this suite.
  // This one must carry a COMPLETE negator on the far side of the break and
  // inside the reach, or the reach alone would account for the pass. A
  // control that fell short on both counts survived a mutation deleting the
  // truncation outright, twice, before this form was measured rather than
  // assumed.
  const BREAK_SHAPE = "item T-802 claimed; item T-803 is still unclaimed";
  check(
    "NEGATIVE CONTROL — a negator inside the reach but past a clause break does not free the item",
    itemSubjects(BREAK_SHAPE).some((id) => id.base === "T-802") === true,
    JSON.stringify(itemSubjects(BREAK_SHAPE)),
  );
  check(
    "THE SAME LINE — the id the negator actually governs is still freed",
    itemSubjects(BREAK_SHAPE).some((id) => id.base === "T-803") === false,
    JSON.stringify(itemSubjects(BREAK_SHAPE)),
  );

  // THE REACH, pinned from both sides. The live forms need five tokens
  // (`and T-708, both still unclaimed`) and four (`filed and left
  // unclaimed`); a rule that stopped at three would miss both, and one that
  // ran to the end of the line would free items named in passing paragraphs
  // later. Asserting only the vetoing side would leave the bound itself
  // unconstrained, which is how T-714's redundant quantifier survived.
  check(
    "THE REACH — a negator six words past the id still vetoes",
    itemSubjects("item T-803 one two three four five unclaimed").some(
      (id) => id.base === "T-803",
    ) === false,
  );
  check(
    "THE REACH — a negator seven words past the id is out of range and the item holds",
    itemSubjects("item T-804 one two three four five six unclaimed").some(
      (id) => id.base === "T-804",
    ) === true,
  );

  // THE NEGATOR VOCABULARY. Every alternative needs a positive of its own or
  // it is an unreached branch that survives mutation. Counted on the live
  // register: `not claimed` 105, `not yet claimed` 22, `never claimed` 1.
  // A fourth candidate, `no longer claimed`, occurs zero times and is
  // deliberately NOT in the rule.
  const LIVE_439 = "Signed-in acceptance for item 59 is OWED and not claimed.";
  check(
    "REAL POSITIVE — `not claimed` on register line 439 does not hold item 59",
    itemSubjects(LIVE_439).some((id) => id.base === "59") === false,
    JSON.stringify(itemSubjects(LIVE_439)),
  );
  check(
    "`item T-812 is not yet claimed` does not hold it",
    itemSubjects("item T-812 is not yet claimed by anyone").some(
      (id) => id.base === "T-812",
    ) === false,
  );
  check(
    "`item T-813 was never claimed` does not hold it",
    itemSubjects("item T-813 was never claimed in this window").some(
      (id) => id.base === "T-813",
    ) === false,
  );

  // CASE, re-measured on the live register (item T-715).
  //
  // T-709 shipped the case-insensitive flag with ONE invented line, `item
  // T-814 remains UNCLAIMED`, and a comment beside it saying no real positive
  // existed. That is the shape T-715 was filed against: the suite asserted a
  // fact about the register in a comment, where nothing checks it and nothing
  // notices when it stops being true.
  //
  // Re-measured over the register as it stood at its `2026-09-23T03:45:37Z`
  // line — 1563 non-empty lines, 1263 subject-position occurrences — by
  // diffing `itemSubjects` against a copy of the control whose ONLY difference
  // is the dropped `i` flag. Counted per negator occurrence:
  //
  //   upper-case-bearing negators                     67
  //     governed by a subject-position id              0   <- the flag's reach
  //     governed by a bare id mention                 14   (20 (id, negator)
  //                                                         pairs; one shout
  //                                                         often governs
  //                                                         two or three ids)
  //     no id within reach                            53
  //   lower-case negators                            156
  //     governed by a subject-position id              8   <- register lines
  //                                                         152, 153, 171,
  //                                                         439, 1881, 1887,
  //                                                         1961, 1963
  //   lines where the flag changes a verdict           0
  //
  // The detector was proved on a known positive before the zero was believed:
  // three lines appended to a copy of the register — `item T-991 remains
  // UNCLAIMED`, the same in lower case, and a genuine claim — and it reported
  // exactly the first. So the zero is the register's, not the measurement's.
  //
  // There is still no untouched real positive, so the finding stands; what
  // changes is that it is now a CHECK. Two real transcriptions carry it, and
  // the invented line is gone: the flag's positive is real register text with
  // ONE word inserted, and the insertion is named.
  const LIVE_1792 =
    "Files: scripts/exec/build-source-board.mjs, one release record. " +
    "T-703, T-705 and T-706 remain UNCLAIMED; T-701(b) remains an open owner decision.";
  const LIVE_1205 =
    "RELEASED item T-460 — all thirteen files free. Nothing held. " +
    "T-462, T-463 and T-464 are filed and UNCLAIMED.";

  // WHY the count is zero, pinned rather than asserted. Every shout on this
  // register governs a BARE mention, and `ITEM_SUBJECT` keys on the literal
  // word `item`/`items`, which a terse hand-back tag does not write. These ids
  // are free for want of a subject cue; the veto never runs on them, so its
  // case cannot be what freed them.
  check(
    "REAL — register line 1792 shouts UNCLAIMED at three ids and holds none of them",
    ["T-703", "T-705", "T-706"].every(
      (id) => itemSubjects(LIVE_1792).some((x) => x.base === id) === false,
    ),
  );
  check(
    "REAL — register line 1205 shouts UNCLAIMED at three bare ids while still holding its own subject",
    itemSubjects(LIVE_1205).some((x) => x.base === "T-460") === true &&
      ["T-462", "T-463", "T-464"].every(
        (id) => itemSubjects(LIVE_1205).some((x) => x.base === id) === false,
      ),
  );
  // THE DIFFERENTIAL, which is what makes the two above a measurement rather
  // than a tautology: delete the shout from each line and no verdict moves. A
  // check that only asserted "not held" would pass for either reason and could
  // not tell the two apart.
  check(
    "THE REASON — deleting UNCLAIMED from either line moves no verdict, so the veto is not what freed those ids",
    itemSubjects(LIVE_1792.replace(" remain UNCLAIMED", " remain")).some((x) =>
      ["T-703", "T-705", "T-706"].includes(x.base),
    ) === false &&
      itemSubjects(LIVE_1205.replace(" and UNCLAIMED", "")).some((x) =>
        ["T-462", "T-463", "T-464"].includes(x.base),
      ) === false,
  );
  // THE FLAG'S POSITIVE — real register text, ONE word inserted, and the word
  // is named. `items` is the subject cue the shout omits; with it the clause is
  // a line the register could write tomorrow, and the shout then sits at
  // exactly six tokens, the reach bound's firing edge. This is the check that
  // dropping the `i` flag fails.
  const LIVE_1792_AS_SUBJECT = LIVE_1792.replace("T-703, T-705", "items T-703, T-705");
  check(
    "CASE — an upper-case UNCLAIMED frees the item as the lower-case form does (register line 1792, `items` inserted)",
    itemSubjects(LIVE_1792_AS_SUBJECT).some((id) => id.base === "T-703") === false,
  );
  check(
    "CASE — the same clause with the shout removed DOES hold it, so the shout is what freed it",
    itemSubjects(LIVE_1792_AS_SUBJECT.replace(" remain UNCLAIMED", " remain")).some(
      (id) => id.base === "T-703",
    ) === true,
  );

  // The reach counts WORDS, so the markdown the register wraps its ids in
  // does not eat a slot. Without this the live form `Items **T-713** filed
  // and left unclaimed` spends one of its six on `**`.
  check(
    "THE REACH — trailing markdown on the id does not consume a word of the reach",
    itemSubjects("item T-805** one two three four five unclaimed").some(
      (id) => id.base === "T-805",
    ) === false,
  );

  // The veto skips the OCCURRENCE and keeps reading. A denied id early in a
  // line must not stop the line holding what it claims afterwards.
  check(
    "THE GUARD — a denial early in a line does not hide a genuine claim later in it",
    itemSubjects(
      "items T-806 and T-807, both still unclaimed. I have taken item T-808 instead",
    ).some((id) => id.base === "T-808") === true,
  );

  // End to end through the real CLI. Both ids are named on one fixture line;
  // one is claimed and one is declared free, and the gate must split them.
  const { dir, file } = fixture([
    "2026-09-22T18:00:00Z | other-lane#run-1 | item T-830 claimed — taking T-830. " +
      "That is items T-831 and T-832, both still unclaimed",
  ]);
  const free = preclaim(file, "T-831", "source-backlog-executor#run-2");
  check(
    "THE MOVEMENT — the id the line declares unclaimed is claimable",
    free.status === 0 && free.report.verdict === "take",
    JSON.stringify(free.report),
  );
  const held = preclaim(file, "T-830", "source-backlog-executor#run-2");
  check(
    "THE GUARD — the id that line actually claimed is still refused, same register, same run",
    held.status === 1 && held.report.holder?.agent === "other-lane#run-1",
    JSON.stringify(held.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// T-713. A release is authoritative for its OWN author, and for nobody else.
//
// The two halves of this gate disagreed. `resolveFileOverlap` keys its
// `releasedAt` map by agent, so a release frees only the records of the
// identity that wrote it. `resolveItemClaim` took the newest live line naming
// the item and honoured `announcesRelease` on it regardless of author, so B
// writing `RELEASED item X` handed A's live claim away to the next run that
// came for X.
//
// The repair is the one T-712 used for abstentions: SKIP the foreign record
// rather than answer from it, so the newest line by the actual holder still
// decides. Skipping is not the same as refusing — a third run must not be
// blocked by a record that holds nothing either way.
// ---------------------------------------------------------------------------
{
  // THE DEFECT. A holds X; B announces a release of X; C asks for X.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | lane-a#run-1 | item T-840 claimed | files: scripts/exec/a.mjs",
    "2026-09-22T18:12:00Z | lane-b#run-2 | RELEASED item T-840 — all files free",
  ]);
  const r = preclaim(file, "T-840", "lane-c#run-3");
  check(
    "THE DEFECT — a release written by someone other than the holder does not free the item",
    r.report.verdict === "held-by-another",
    JSON.stringify(r.report),
  );
  check(
    "the refused run is pointed at the ACTUAL holder, not at the releasing lane",
    r.report.holder?.agent === "lane-a#run-1",
    JSON.stringify(r.report.holder),
  );
  check("a foreign release does not open the item, and exits non-zero", r.status !== 0, `status=${r.status}`);
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // THE NEGATIVE CONTROL, independent of the case above: the holder's OWN
  // release must still free the item, or every released item locks for three
  // hours. Same shape as the defect fixture, one field different — the agent
  // on the release line.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | lane-a#run-1 | item T-840 claimed | files: scripts/exec/a.mjs",
    "2026-09-22T18:12:00Z | lane-a#run-1 | RELEASED item T-840 — all files free",
  ]);
  const r = preclaim(file, "T-840", "lane-c#run-3");
  check(
    "THE CONTROL — the holder's own release still frees the item for the next run",
    r.status === 0 && r.report.verdict === "take",
    JSON.stringify(r.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // TRANSPARENT, NOT AUTHORITATIVE. B's foreign release sits NEWEST on an item
  // A has already released. Answering from the newest line would be right here
  // by luck; skipping it is right because A's own release is what decides.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | lane-a#run-1 | item T-841 claimed | files: scripts/exec/a.mjs",
    "2026-09-22T18:12:00Z | lane-a#run-1 | RELEASED item T-841 — all files free",
    "2026-09-22T18:20:00Z | lane-b#run-2 | RELEASED item T-841 — noting the lane is clear",
  ]);
  const r = preclaim(file, "T-841", "lane-c#run-3");
  check(
    "a foreign release stacked on the holder's own release leaves the item free",
    r.status === 0 && r.report.verdict === "take",
    JSON.stringify(r.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // ORDER. The foreign release lands BEFORE the holder's claim, which is the
  // case a released-at-any-time map would get wrong: a release cannot free a
  // claim that did not exist when it was written.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | lane-b#run-2 | RELEASED item T-842 — handing it back",
    "2026-09-22T18:12:00Z | lane-a#run-1 | item T-842 claimed | files: scripts/exec/a.mjs",
  ]);
  const r = preclaim(file, "T-842", "lane-c#run-3");
  check(
    "ORDER — a release older than the claim it precedes does not free it",
    r.status !== 0 && r.report.holder?.agent === "lane-a#run-1",
    JSON.stringify(r.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // RE-CLAIM AFTER RELEASE, one agent. This is the branch the ORDER case above
  // cannot reach, because there the release and the claim have different
  // authors and the per-agent map never sees them together. A run that
  // released an item and then took it back again HOLDS it: keying the release
  // by agent is not enough on its own, the release must also be older than the
  // record it frees.
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | lane-a#run-1 | item T-845 claimed | files: scripts/exec/a.mjs",
    "2026-09-22T18:12:00Z | lane-a#run-1 | RELEASED item T-845 — handing it back",
    "2026-09-22T18:20:00Z | lane-a#run-1 | item T-845 claimed | files: scripts/exec/a.mjs",
  ]);
  const other = preclaim(file, "T-845", "lane-c#run-3");
  check(
    "RE-CLAIM — an agent's own earlier release does not free the claim it wrote afterwards",
    other.status !== 0 && other.report.holder?.stamp === "2026-09-22T18:20:00Z",
    JSON.stringify(other.report),
  );
  const self = preclaim(file, "T-845", "lane-a#run-1");
  check(
    "RE-CLAIM — and the run that wrote it may still continue on it",
    self.status === 0 && self.report.verdict === "already-yours",
    JSON.stringify(self.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // A SIBLING IS NOT THE AUTHOR. Two runs of one scheduled task: the sibling's
  // release must not free this run's claim, for the same reason a sibling may
  // not adopt it (T-594).
  const { dir, file } = fixture([
    "2026-09-22T18:05:00Z | source-backlog-executor#20260922T175543Z | item T-843 claimed | files: scripts/exec/a.mjs",
    "2026-09-22T18:12:00Z | source-backlog-executor#20260922T182000Z | RELEASED item T-843 — all files free",
  ]);
  const r = preclaim(file, "T-843", "codex-other#run-9");
  check(
    "a SIBLING run's release does not free the holder's claim either",
    r.status !== 0 && r.report.holder?.agent === "source-backlog-executor#20260922T175543Z",
    JSON.stringify(r.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // NOTHING TO SKIP. A foreign release on an item nobody holds leaves it free —
  // a skipped record must not become a refusal by absence.
  const { dir, file } = fixture([
    "2026-09-22T18:12:00Z | lane-b#run-2 | RELEASED item T-844 — nobody was on it",
  ]);
  const r = preclaim(file, "T-844", "lane-c#run-3");
  check(
    "a lone foreign release holds nothing and leaves the item claimable",
    r.status === 0 && r.report.verdict === "take",
    JSON.stringify(r.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


// ---------------------------------------------------------------------------
// T-716. An id a line only NARRATES is not an id that line holds.
//
// `ITEM_SUBJECT` reads the cue `item <id>` and, since T-709/T-710/T-714, three
// vetoes sit in front of it. None of them reads the case where the id is the
// OBJECT of somebody else's action, or a cross-reference to where a topic is
// already filed. The line asserts nothing about its own ownership of that id,
// and under T-713 — which stopped a foreign release from freeing an item —
// these stopped being masked and became live refusals.
//
// BOTH real positives the item names had aged out of the 3h window by the time
// this was taken, so they are reached here with the stamps they actually carry
// and asserted on `itemSubjects`, which is clock-free. The CLI cases at the end
// of this block prove the same shapes end to end.
//
// WHY A VERB VOCABULARY WAS REJECTED, measured rather than reasoned: the bare
// past-tense announcement verb `merged item <id>` occurs 5 times in the
// register and 4 of them are a run announcing ITS OWN merge at the head of its
// message (`MERGED item 86 through PR #7876`). A rule keying on the verb would
// free four genuine records — a false PASS, which is the worse direction. So
// the cue is a THIRD-PARTY SUBJECT in front of the verb, exactly the shape
// T-710 gave paths, or a COPULAR cross-reference, which the register writes 7
// times and which is narration in all 7 of them.
//
// `ITEM_SUBJECT` itself is untouched, as in T-709, T-710 and T-714.
// ---------------------------------------------------------------------------
{
  // Register line 1751, 2026-09-22T16:34:05Z. Genuinely claims T-400 at its
  // head; the numeric id it names belongs to a sibling and the sentence says
  // so twice over.
  const LIVE_1751 =
    "item T-400 claimed — the first claimable row in the queue generated 16:31Z. " +
    "If the evidence turns out to require a repo change I will append a superseding " +
    "claim naming those paths before touching them. Sibling run `#20260922T155500Z` " +
    "merged item 34 at 16:18:28Z and is still proving its deploy; I am a different " +
    "owner and take a different item.";
  check(
    "REAL POSITIVE — register line 1751 narrates a sibling's merge, so it does not hold item 34",
    itemSubjects(LIVE_1751).some((id) => id.base === "34") === false,
    JSON.stringify(itemSubjects(LIVE_1751)),
  );
  check(
    "THE GUARD — that same line still holds T-400, which it actually claimed",
    itemSubjects(LIVE_1751).some((id) => id.base === "T-400") === true,
    JSON.stringify(itemSubjects(LIVE_1751)),
  );

  // Register line 1718, 2026-09-22T14:22:29Z. Reports its own item's PR at the
  // head and cross-references where a piece of work is already filed.
  const LIVE_1718 =
    "item T-700 PR #8258 head `849476f3576639c74c078531a82ab3a1c98c8997` OPENED, " +
    "NOT MERGED, checks running | mapping them would move the claimable count, " +
    "which is the one number this item asks me to pin, and map placement is " +
    "already item T-614.";
  check(
    "REAL POSITIVE — register line 1718 cross-references T-614, so it does not hold it",
    itemSubjects(LIVE_1718).some((id) => id.base === "T-614") === false,
    JSON.stringify(itemSubjects(LIVE_1718)),
  );
  check(
    "THE GUARD — that same line still holds T-700, which it actually reports on",
    itemSubjects(LIVE_1718).some((id) => id.base === "T-700") === true,
    JSON.stringify(itemSubjects(LIVE_1718)),
  );

  // Register line 1737, 2026-09-22T15:32:10Z. The SAME cross-reference written
  // by the same run an hour later, with the copula spelled `that is`.
  const LIVE_1737 =
    "RELEASED item T-701(a) — merged, DEPLOYED, ACA runtime invariant proven. " +
    "The board still exits non-zero on four unplaced ids — that is item T-614 " +
    "and mapping moves the claimable count; (3) I filed no new backlog rows.";
  check(
    "REAL POSITIVE — register line 1737 cross-references T-614 the same way",
    itemSubjects(LIVE_1737).some((id) => id.base === "T-614") === false,
    JSON.stringify(itemSubjects(LIVE_1737)),
  );
  check(
    "THE GUARD — line 1737 still names T-701(a) as its own subject",
    itemSubjects(LIVE_1737).some((id) => id.base === "T-701" && id.part === "(a)") === true,
    JSON.stringify(itemSubjects(LIVE_1737)),
  );

  // Register line 264, 2026-09-19T03:33Z. A comparison: this situation is of
  // the same class as a numbered item, not a claim on it.
  const LIVE_264 =
    "item 63 · NOTE: another agent amended and FORCE-PUSHED my claimed branch. " +
    "Record repaired in `ee0f1377d`. This is item 34 class and worse than the " +
    "shared-worktree case it names";
  check(
    "REAL POSITIVE — register line 264 compares itself to item 34 and does not hold it",
    itemSubjects(LIVE_264).some((id) => id.base === "34") === false,
    JSON.stringify(itemSubjects(LIVE_264)),
  );
  check(
    "THE GUARD — line 264 still holds item 63, its own subject",
    itemSubjects(LIVE_264).some((id) => id.base === "63") === true,
    JSON.stringify(itemSubjects(LIVE_264)),
  );

  // Register line 421, 2026-09-19T12:47Z. The plural copula, and a possessive
  // after the id — both are narration about a lesson, not a claim.
  const LIVE_421 =
    "RELEASED item T-003 · **CLOSED and DEPLOY VERIFIED**, all files released. " +
    "So a name-only match is a guess. Both are item 49's lesson in a new costume.";
  check(
    "REAL POSITIVE — register line 421 cites item 49's lesson and does not hold it",
    itemSubjects(LIVE_421).some((id) => id.base === "49") === false,
    JSON.stringify(itemSubjects(LIVE_421)),
  );
  check(
    "THE GUARD — line 421 still names T-003, the item it released",
    itemSubjects(LIVE_421).some((id) => id.base === "T-003") === true,
    JSON.stringify(itemSubjects(LIVE_421)),
  );

  // Register line 629, 2026-09-20T00:02Z. Same shape again, a year of practice
  // apart from the others: the register writes this constantly.
  const LIVE_629 =
    "**RELEASED item T-063 (partly closed) · CLOSED-AND-DEPLOY-VERIFIED for the " +
    "three rows. Against a 6-entry method library; this is item 31's prediction " +
    "and T-064 is right that the test is its acceptance criterion";
  check(
    "REAL POSITIVE — register line 629 cites item 31's prediction and does not hold it",
    itemSubjects(LIVE_629).some((id) => id.base === "31") === false,
    JSON.stringify(itemSubjects(LIVE_629)),
  );
  check(
    "THE GUARD — line 629 still names T-063, the item it released",
    itemSubjects(LIVE_629).some((id) => id.base === "T-063") === true,
    JSON.stringify(itemSubjects(LIVE_629)),
  );

  // THE CONTROL THAT DECIDED THE DESIGN. Four register lines announce the
  // run's OWN merge with the same verb the sibling case uses. If the verb were
  // the cue, all four would be freed while their author was still proving the
  // deploy. Register lines 278, 283, 292 and 296, one shape.
  const LIVE_278 =
    "MERGED item 86 through PR #7876 as exact squash SHA `eb077d313a3714b8a`";
  check(
    "NEGATIVE CONTROL — a run announcing its OWN merge still holds the item (register line 278)",
    itemSubjects(LIVE_278).some((id) => id.base === "86") === true,
    JSON.stringify(itemSubjects(LIVE_278)),
  );
  check(
    "NEGATIVE CONTROL — and the same verb with a qualifier after it (register line 296)",
    itemSubjects("MERGED item 68 CI enforcement through PR #7881").some(
      (id) => id.base === "68",
    ) === true,
  );

  // NEGATIVE CONTROLS on every genuine claim form the register writes. Freeing
  // one of these would be two runs on one item.
  check(
    "NEGATIVE CONTROL — the helper-generated prefix still holds its item",
    itemSubjects("item T-800 claimed on branch `exec/x` — taking it").some(
      (id) => id.base === "T-800",
    ) === true,
  );
  check(
    "NEGATIVE CONTROL — `TAKING item T-704` still holds",
    itemSubjects("TAKING item T-704 on branch `exec/y`").some((id) => id.base === "T-704") === true,
  );
  check(
    "NEGATIVE CONTROL — `RELEASED item T-701(a)` still names its subject",
    itemSubjects("RELEASED item T-701(a) — files free").some(
      (id) => id.base === "T-701" && id.part === "(a)",
    ) === true,
  );
  check(
    "NEGATIVE CONTROL — the legacy `- item 21 | agent` form still holds",
    itemSubjects("- item 21 | claude-code-executor | 2026-09-19T12:58Z | branch").some(
      (id) => id.base === "21",
    ) === true,
  );
  check(
    "NEGATIVE CONTROL — a first-person verb with no third party still holds",
    itemSubjects("I merged item T-810 at 04:05Z and am proving the deploy").some(
      (id) => id.base === "T-810",
    ) === true,
  );
  check(
    "NEGATIVE CONTROL — `this claim holds item T-811` is about ITSELF and goes on holding",
    itemSubjects("this claim holds item T-811 for the window").some(
      (id) => id.base === "T-811",
    ) === true,
  );

  // THE COPULA IS ADJACENT, not a reach. A copula anywhere earlier in the
  // sentence must not free an id the line claims afterwards — pinned from both
  // sides, because a bound asserted only where it fires is a bound no test
  // constrains (the lesson T-714's redundant quantifier taught).
  check(
    "BOUND — the copula frees the id it introduces",
    itemSubjects("the placement is already item T-820").some((id) => id.base === "T-820") === false,
  );
  check(
    "BOUND — a copula one clause earlier does NOT free the id claimed after it",
    itemSubjects("the branch is ready; I have claimed item T-821 on it").some(
      (id) => id.base === "T-821",
    ) === true,
  );

  // THE THIRD-PARTY REACH, pinned from both sides on the same principle. The
  // live positive puts a run id between the subject and its verb, so the reach
  // must span it; it must not span a sentence boundary.
  check(
    "REACH — a third-party subject reaches its verb across an intervening run id",
    itemSubjects("Sibling run `#20260922T155500Z` merged item T-822 at 16:18Z").some(
      (id) => id.base === "T-822",
    ) === false,
  );
  check(
    "REACH — it does not cross a full stop into the next sentence",
    itemSubjects("Another lane is proving its deploy. I claimed item T-823 at 02:00Z").some(
      (id) => id.base === "T-823",
    ) === true,
  );

  // THE TOKEN BOUND, pinned from BOTH sides. Two words between the third-party
  // subject and its verb is the live shape (`run` and a backticked run id);
  // three is somebody else's sentence and must not reach. A bound asserted
  // only on the side that fires is a bound no test constrains.
  check(
    "BOUND — two words between the third-party subject and its verb still vetoes",
    itemSubjects("another lane run merged item T-827 this morning").some(
      (id) => id.base === "T-827",
    ) === false,
  );
  // THE ANCHOR. The third-party verb must be the one immediately introducing
  // the id, not merely present somewhere in front of it. Without that, a line
  // that mentions a sibling's merge and then takes an item of its own would be
  // read as narrating the item it actually took — a false PASS.
  check(
    "ANCHOR — a third-party verb earlier in the sentence does not reach an id THIS run took",
    itemSubjects("another run merged PR #1 before I took item T-829 myself").some(
      (id) => id.base === "T-829",
    ) === true,
  );
  check(
    "BOUND — three words does NOT reach, so the id goes on being held",
    itemSubjects("another lane run today merged item T-828 this morning").some(
      (id) => id.base === "T-828",
    ) === true,
  );

  // SYNTHETIC, AND LABELLED AS SUCH. Only `merged` has a real positive on this
  // register today; these three alternatives are written from the shapes the
  // protocol asks runs to write about each other, and each is pinned by a case
  // so that deleting it from the rule fails this suite rather than surviving.
  for (const [verb, id] of [
    ["claimed", "T-824"],
    ["holds", "T-825"],
    ["closed", "T-826"],
  ]) {
    check(
      `SYNTHETIC — a third-party subject with \`${verb}\` does not claim the id it names`,
      itemSubjects(`another run ${verb} item ${id} earlier today`).some(
        (subject) => subject.base === id,
      ) === false,
    );
  }

  // END TO END through the real CLI. One fixture line claims one id and
  // narrates another; the gate must split them.
  const { dir, file } = fixture([
    "2026-09-22T18:00:00Z | other-lane#run-1 | item T-850 claimed — taking T-850. " +
      "Sibling run `#20260922T155500Z` merged item T-851 at 16:18:28Z and is still " +
      "proving its deploy; I am a different owner",
  ]);
  const narrated = preclaim(file, "T-851", "source-backlog-executor#run-2");
  check(
    "THE MOVEMENT — the id that line only narrates is claimable by the next run",
    narrated.status === 0 && narrated.report.verdict === "take",
    JSON.stringify(narrated.report),
  );
  const own = preclaim(file, "T-850", "source-backlog-executor#run-2");
  check(
    "THE GUARD — the id that line actually claimed is still refused, same register, same run",
    own.status === 1 && own.report.holder?.agent === "other-lane#run-1",
    JSON.stringify(own.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// A DISCLAIMER IS NOT A CLAIM — a negation that governs the id FROM THE LEFT
// (item T-722).
//
// The three vetoes above read what sits AFTER the id, the two characters in
// front of it, or a third-party subject. `deniesClaim` is the only one that
// reads negation, and it reads `governedTail(line.slice(afterIndex))` — only
// what sits AFTER the id. So a negation placed in FRONT of it is structurally
// unreachable, whatever the vocabulary: widening `CLAIM_STATE_NEGATOR` alone
// moves none of the six cases below and that is asserted here, not assumed.
//
// Found by execution, and the reproduction was live at the moment it was
// written: `--preclaim --item 26` refused item 26's GENUINE owner (claim
// 2026-09-23T04:04:23Z, PR #8318, merged `a292fc656`) because a sibling run's
// line says in passing that it touches none of item 26's files. A run that
// went out of its way to declare non-overlap was recorded as having taken the
// item, and the item's real owner could not write its own release line — which
// recreates the merged-with-no-register-line gap that T-446, T-452, T-458 and
// T-470 each closed, arriving this time through a control rather than through
// forgetfulness.
//
// THE REACH IS 3 WORDS AND THE BOUND IS MEASURED, not chosen. Over the real
// register, the left veto frees 1 occurrence at reach 1, 9 at reach 2, 10 at
// reach 3 and 14 at reach 4 — and reach 4 is where it first frees an id a line
// GENUINELY claims: register line 455 disambiguates `NOT the closed
// shared-shaper item 41` while claiming the other item 41 in the same
// sentence. A false PASS is the worse direction, so the bound stops at 3 and
// is pinned from both sides below.
//
// THE VOCABULARY IS `not` AND `none`, COUNTED off the register rather than
// brainstormed. Adding `no` frees an eleventh occurrence and it is the wrong
// one: register line 220 reads `run by no npm script and no workflow (item
// 26's fifth instance)`, where the negation is about the workflow and not
// about the item. `never`, `neither` and `nor` move nothing at all, and an
// alternative no test on this register can constrain is one a mutation deletes
// and survives — T-709's `no longer claimed` lesson.
//
// `ITEM_SUBJECT` is untouched, as in T-709, T-710, T-714 and T-716, so the
// movement on the real register is attributable to this veto alone.
// ---------------------------------------------------------------------------
{
  // REAL POSITIVES, transcribed from the register. The first is the line that
  // refused item 26's owner; the rest are every other occurrence the measured
  // rule frees, each one a genuine hand-back.
  const LIVE_2022 =
    "item C-502 claimed on branch `exec/c-502-prose-compaction-loss` — a control whose " +
    "truth is the declared list rather than my change should do. I still touch NONE of " +
    "item 26s files. Stamp is a literal clock read at the instant of writing";
  check(
    "REAL POSITIVE — the line that refused item 26's owner does not hold item 26",
    itemSubjects(LIVE_2022).some((id) => id.base === "26") === false,
    JSON.stringify(itemSubjects(LIVE_2022)),
  );
  check(
    "THE SAME LINE STILL HOLDS WHAT IT ACTUALLY CLAIMED — C-502",
    itemSubjects(LIVE_2022).some((id) => id.base === "C-502") === true,
    JSON.stringify(itemSubjects(LIVE_2022)),
  );

  // Register line 131. A standing instruction, not a claim.
  check(
    "REAL POSITIVE — `do not reopen item 40` does not hold item 40",
    itemSubjects(
      "no code files claimed unless a reproducible load-bearing mechanism is proven; " +
        "do not reopen item 40",
    ).some((id) => id.base === "40") === false,
  );

  // Register line 160, and register line 181 in the same shape.
  const LIVE_160 =
    "docs/releases/records/2026-09-18-release-record-layer-impact-lane-gate.md — " +
    "NOT taking item 50 (release-record template `## Known Gaps`): re-verified on `main`";
  check(
    "REAL POSITIVE — `NOT taking item 50` does not hold item 50",
    itemSubjects(LIVE_160).some((id) => id.base === "50") === false,
    JSON.stringify(itemSubjects(LIVE_160)),
  );

  // Register line 421. The id is the object of a sweep's reach.
  check(
    "REAL POSITIVE — `it would not catch item 126` does not hold item 126",
    itemSubjects(
      "the sweep cannot see a vocabulary held in a TS const — so it would not catch " +
        "item 126 in its repaired form",
    ).some((id) => id.base === "126") === false,
  );

  // Register line 1332. Two disclaimers in one sentence, one of them adjacent.
  const LIVE_1332 =
    "a literal `date -u` read at the instant of writing per T-457, nothing carried " +
    "forward. NOT item 25 and NOT blocked behind items 38/39: I am not writing a " +
    "rendering test for either unreachable surface";
  check(
    "REAL POSITIVE — an adjacent `NOT item 25` does not hold item 25",
    itemSubjects(LIVE_1332).some((id) => id.base === "25") === false,
    JSON.stringify(itemSubjects(LIVE_1332)),
  );
  check(
    "REAL POSITIVE — `NOT blocked behind items 38` does not hold item 38",
    itemSubjects(LIVE_1332).some((id) => id.base === "38") === false,
    JSON.stringify(itemSubjects(LIVE_1332)),
  );

  // THE BOUND, PINNED FROM BOTH SIDES. Three words reach; four do not. The
  // second case is register line 455's real shape, which is why the bound
  // stops here: it disambiguates one item 41 while claiming the other.
  check(
    "BOUND — a negator three words in front of the id reaches it",
    itemSubjects("I will not be taking item T-860 this run").some(
      (id) => id.base === "T-860",
    ) === false,
  );
  check(
    "BOUND — four words does NOT reach, so the id goes on being held",
    itemSubjects("this is not the closed shared-shaper item T-861").some(
      (id) => id.base === "T-861",
    ) === true,
  );

  // A CLAUSE BREAK STOPS IT, exactly as it stops `governedTail`. Every case
  // here carries a negator the vocabulary DOES know, because the first pair
  // written for this rule used `no` — which the vocabulary deliberately
  // excludes — so neither could reach the branch it was named for, and both
  // survived every mutation of it. A fixture whose negator is out of
  // vocabulary cannot fail a clause-break rule.
  check(
    "CLAUSE BREAK — a negation across a colon does not reach the id",
    itemSubjects("NOT a decision: item 16's re-verification records the drop").some(
      (id) => id.base === "16",
    ) === true,
  );
  check(
    "CLAUSE BREAK — a negation across a full stop does not reach the id",
    itemSubjects("the surface is not reachable. Item T-867 closed on `main`").some(
      (id) => id.base === "T-867",
    ) === true,
  );
  check(
    "CLAUSE BREAK — a negation across an em dash does not reach the id",
    itemSubjects("this is not the same defect — item T-868 merged at 16:18Z").some(
      (id) => id.base === "T-868",
    ) === true,
  );
  check(
    "CLAUSE BREAK — a negation across a semicolon does not reach the id",
    itemSubjects("the route is not reachable; item T-872 stays open").some(
      (id) => id.base === "T-872",
    ) === true,
  );

  // A BACKTICKED SPAN COSTS ONE SLOT, not its own length. Register line 160 is
  // the shape: a quoted release-record path sits between the negator and the
  // id, and the path carries a full stop of its own. Without the reduction
  // that path reads as a clause break and the disclaimer never reaches the id.
  check(
    "a quoted path between the negator and the id costs one word, not three",
    itemSubjects(
      "NOT taking `docs/releases/records/2026-09-18-release-record.md` item T-869 this run",
    ).some((id) => id.base === "T-869") === false,
  );

  // THE VOCABULARY IS EXACTLY `not` AND `none`. Register line 220 is the
  // measured reason `no` is excluded: its negation is about the workflow.
  check(
    "VOCABULARY — `no` is not a disclaimer, so register line 220 goes on holding item 26",
    itemSubjects("a suite run by no npm script and no workflow (item 26's fifth instance)").some(
      (id) => id.base === "26",
    ) === true,
  );

  // NEGATIVE CONTROLS. Every genuine claim form must go on holding.
  check(
    "NEGATIVE CONTROL — the helper-generated prefix still holds its item",
    itemSubjects("item T-862 claimed on branch `exec/x` — taking it").some(
      (id) => id.base === "T-862",
    ) === true,
  );
  check(
    "NEGATIVE CONTROL — `TAKING item T-863` still holds",
    itemSubjects("TAKING item T-863 on branch `exec/y`").some((id) => id.base === "T-863") === true,
  );
  check(
    "NEGATIVE CONTROL — the legacy `- item 21 | agent` form still holds",
    itemSubjects("- item 21 | claude-code-executor | 2026-09-19T12:58Z | branch").some(
      (id) => id.base === "21",
    ) === true,
  );

  // THE OTHER HALF, PROVEN SEPARATELY (item T-722, vocabulary). `not taken`
  // and `not mine` are hand-backs the register writes AFTER the id, and
  // `CLAIM_STATE_NEGATOR` reached neither: it knows only negated forms of the
  // verb `claim`. Seven occurrences of `not taken` govern a subject-position
  // id on the real register; the left veto above moves none of them, which is
  // why the two halves are asserted apart.
  const LIVE_457 =
    "1130 → 1140 passing. Typecheck exit 0; eslint exit 0. **Item 24 was NOT taken — " +
    "re-verified already closed on `main`** (see the 14:55Z claim)";
  check(
    "REAL POSITIVE — `Item 24 was NOT taken` does not hold item 24",
    itemSubjects(LIVE_457).some((id) => id.base === "24") === false,
    JSON.stringify(itemSubjects(LIVE_457)),
  );
  check(
    "REAL POSITIVE — `item C-003 recorded, not taken` does not hold C-003",
    itemSubjects("**Second new item C-003 recorded, not taken:** `compactConsultantChatText`").some(
      (id) => id.base === "C-003",
    ) === false,
  );
  check(
    "REAL POSITIVE — `item T-461 EVIDENCE ONLY, decision NOT taken` does not hold T-461",
    itemSubjects("2026-09-21T17:42Z cc-a item T-461 EVIDENCE ONLY, decision NOT taken and").some(
      (id) => id.base === "T-461",
    ) === false,
  );
  check(
    "VOCABULARY — `item 26 is not mine` does not hold item 26",
    itemSubjects("item 26 is not mine").some((id) => id.base === "26") === false,
  );
  check(
    "NEGATIVE CONTROL — `taken` without a negator still holds its item",
    itemSubjects("item T-864 taken on branch `exec/z`").some((id) => id.base === "T-864") === true,
  );

  // THE TWO HALVES ARE INDEPENDENT, asserted rather than claimed in prose: the
  // left veto cannot reach a tail-side hand-back, and the tail vocabulary
  // cannot reach a left-side disclaimer. Each case below fails if the other
  // half is the only one implemented.
  check(
    "INDEPENDENCE — a tail-only hand-back has no negator in front of the id",
    itemSubjects("item T-865 was NOT taken").some((id) => id.base === "T-865") === false,
  );
  check(
    "INDEPENDENCE — a head-only disclaimer has no negator behind the id",
    itemSubjects("I do not touch item T-866 at all").some((id) => id.base === "T-866") === false,
  );

  // END TO END through the real CLI, on the live shape: one line claims one id
  // and disclaims another, and the gate must split them.
  const { dir, file } = fixture([
    "2026-09-22T18:00:00Z | other-lane#run-1 | item C-870 claimed — taking C-870. " +
      "I still touch NONE of item 871s files",
  ]);
  const disclaimed = preclaim(file, "871", "source-backlog-executor#run-2");
  check(
    "THE MOVEMENT — the id that line disclaims is claimable by the next run",
    disclaimed.status === 0 && disclaimed.report.verdict === "take",
    JSON.stringify(disclaimed.report),
  );
  const held = preclaim(file, "C-870", "source-backlog-executor#run-2");
  check(
    "THE GUARD — the id that line actually claimed is still refused, same register, same run",
    held.status === 1 && held.report.holder?.agent === "other-lane#run-1",
    JSON.stringify(held.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


// ---------------------------------------------------------------------------
// item T-724 — an id a line NARRATES is not an id a line CLAIMS.
//
// T-716 catches a narration with a third-party SUBJECT in front of the verb
// (`Sibling run `#…` merged item 34`) and the copular cross-reference (`that
// is item T-614`). T-722 catches a NEGATION in front of the id. The register
// also writes narration with neither, in two voices measured on it:
//
//   `Item 26 MERGED mid-flight - PR #8318 squashed to a292fc656`   (line 2027)
//   `refused item 26's genuine owner`                              (line 2075)
//
// Both sit inside a line that has ALREADY declared a different subject at its
// head — `item C-502 claimed on branch …` and `item T-722 claimed on branch …`
// — and both refused item 26 to a run that came for it. The second refusal
// happened to THIS suite's own author while claiming T-724.
//
// THE CUE IS POSITION, NOT THE VERB, and T-716 measured why the verb cannot be
// it: `merged item <id>` occurs five times and FOUR are a run announcing its
// own merge at the head of its message, so a verb rule frees four genuine
// records — a false PASS, the worse direction.
//
// EVERY FIXTURE BELOW DECLARES A HEAD SUBJECT THAT DIFFERS FROM THE ID IT
// NARRATES. That is not decoration: a fixture whose narration and claim agree
// passes with the rule absent and asserts nothing, which the item says in as
// many words.
{
  console.log("\n-- T-724: a narrated id is not a claimed id --");

  // The two known positives, at the shape the register writes them.
  const LIVE_2027 =
    "2026-09-23T04:48:01Z | source-backlog-executor#20260923T0422Z | " +
    "item C-502 claimed on branch `exec/c-502-prose-compaction-loss` — SECOND AMENDMENT. " +
    "At 04:24Z I said I would touch none of item 26s files and I meant it. " +
    "Item 26 MERGED mid-flight - PR #8318 squashed to a292fc656, which is origin/main now.";
  const LIVE_2075 =
    "2026-09-23T07:38:33Z | source-backlog-executor#20260923T0649Z | " +
    "item T-722 claimed on branch `exec/t-722-disclaimer-read-as-claim` — " +
    "my 07:12:11Z line writes `refused item 26's genuine owner`, where the id is the OBJECT.";

  check(
    "KNOWN POSITIVE 1 — `Item 26 MERGED mid-flight` does not hold item 26",
    itemSubjects(LIVE_2027).some((id) => id.base === "26") === false,
    JSON.stringify(itemSubjects(LIVE_2027)),
  );
  check(
    "KNOWN POSITIVE 2 — `refused item 26's genuine owner` does not hold item 26",
    itemSubjects(LIVE_2075).some((id) => id.base === "26") === false,
    JSON.stringify(itemSubjects(LIVE_2075)),
  );

  // THE OTHER DIRECTION, on the same two lines. A veto that freed the head
  // subject too would read as a fix and hand two live claims away.
  check(
    "NEGATIVE CONTROL — the same line still holds the subject it declared (C-502)",
    itemSubjects(LIVE_2027).some((id) => id.base === "C-502") === true,
    JSON.stringify(itemSubjects(LIVE_2027)),
  );
  check(
    "NEGATIVE CONTROL — the same line still holds the subject it declared (T-722)",
    itemSubjects(LIVE_2075).some((id) => id.base === "T-722") === true,
    JSON.stringify(itemSubjects(LIVE_2075)),
  );

  // THE VERB IS NOT THE CUE. These four are the genuine `MERGED item <id>`
  // announcements T-716 counted; each declares that id as its OWN subject, so
  // each must go on holding. A rule keyed to the verb fails every one.
  const OWN_MERGE =
    "2026-09-19T03:12Z | claude-code-executor | " +
    "MERGED item 86 through PR #7876, squash `615b5ec9b`, 25 checks passed.";
  check(
    "THE VERB IS NOT THE CUE — a run announcing its OWN merge still holds item 86",
    itemSubjects(OWN_MERGE).some((id) => id.base === "86") === true,
    JSON.stringify(itemSubjects(OWN_MERGE)),
  );
  check(
    "THE VERB IS NOT THE CUE — `RELEASED item T-701(a)` still holds it",
    itemSubjects(
      "2026-09-22T18:00:00Z | agent#run-1 | RELEASED item T-701(a) — files free",
    ).some((id) => id.base === "T-701") === true,
  );

  // THE ONE GENUINE SECOND CLAIM ON THE REGISTER. Line 455 declares item 41 at
  // its head and then TAKES a second id in the same line. Counted rather than
  // imagined: `also item <id>` occurs ONCE in 2,079 lines and this is it,
  // while `and item <id>` occurs four times and is narration in all four. So
  // `also` is the exemption, measured, and it is not a verb.
  const LIVE_455 =
    "- 2026-09-19T14:55Z | claude-code-executor | item 41 [P2] (the `no behavioral test` " +
    "item, NOT the closed shared-shaper item 41) · also item 25 · CLAIMED.";
  check(
    "NEGATIVE CONTROL — a genuine second claim (`also item 25 · CLAIMED`) still holds",
    itemSubjects(LIVE_455).some((id) => id.base === "25") === true,
    JSON.stringify(itemSubjects(LIVE_455)),
  );
  check(
    "VOCABULARY — `and item 24 activity reader` is narration and does NOT hold 24",
    itemSubjects(
      "2026-09-18T19:19Z | codex-c1 | item 23 claimed — excludes src/lib/source/** " +
        "and item 24 activity reader.",
    ).some((id) => id.base === "24") === false,
  );

  // A PLURAL HEAD DECLARES NOTHING, so it subordinates nothing. The register
  // writes `items 60, 85, and 91 · DEPLOY VERIFIED` and ten more of that
  // shape; reading the first id as the only subject would free the rest.
  //
  // THE ASSERTION BELOW PINS WHAT THE CONTROL ACTUALLY DOES, and a first draft
  // of it asserted what the shape SUGGESTS instead — that all three are
  // subjects — and was red on unfixed `main` for a reason that has nothing to
  // do with T-724. `ITEM_SUBJECT` keys on the literal word `item`, which sits
  // in front of `60` and nowhere else on that line, so `85` and `91` have
  // never been subjects of it. That is a real gap and it is NOT this item's:
  // closing it would ADD held ids, which is the false-PASS direction, and it
  // needs its own measurement. Recorded, not fixed here.
  //
  // THE FIXTURE IS REGISTER LINE 317 AND THE TAIL IS NOT DECORATION. A first
  // draft stopped at the head, and a mutation accepting `items?` SURVIVED it:
  // with no later `item <id>` on the line there is nothing for the rule to
  // subordinate, so the case asserted nothing. That line does carry one — it
  // names `item 85` again 1.5kB later — and under the widened pattern the
  // head declares 60 and 85 is freed, which is a false PASS on an id the line
  // genuinely holds. The mutation is caught by the real text, not by a shape.
  const PLURAL =
    "- 2026-09-19T05:56Z | source-backlog-parallel-executor | " +
    "items 60, 85, and 91 · DEPLOY VERIFIED on exact current-main SHA `8ed2cb60d`. " +
    "Revision `ca-abarva-web-lab-eastus--m8ed2cb60` is Healthy at 100% traffic; " +
    "commit `6fdd43404` and item 85 merge `a7eba6d11` are included.";
  check(
    "NEGATIVE CONTROL — a plural head declares nothing and subordinates nothing",
    itemSubjects(PLURAL).some((id) => id.base === "85") === true &&
      itemSubjects(PLURAL).some((id) => id.base === "60") === true,
    JSON.stringify(itemSubjects(PLURAL)),
  );

  // THE ANNOUNCEMENT VERBS THAT OPEN A DECLARATION, each pinned by a real
  // register line rather than carried on assumption. Measured contribution to
  // the 115: `RELEASED` 46, `TAKING` 1, the `**` emphasis 2. `RELEASING`
  // contributes ZERO and is deliberately absent — a mutation deleting it
  // survived, the tell T-709's `no longer claimed` gave.
  check(
    "HEAD FORM — a `RELEASED item <id>` declaration subordinates what it narrates",
    itemSubjects(
      "2026-09-18T22:17Z | claude-code-executor | RELEASED item 36 · the Moves " +
        "evidence-packet builder — merged as #7841. Overlaps item 38, untouched.",
    ).some((id) => id.base === "38") === false,
  );
  check(
    "HEAD FORM — and still holds the id it released",
    itemSubjects(
      "2026-09-18T22:17Z | claude-code-executor | RELEASED item 36 · the Moves " +
        "evidence-packet builder — merged as #7841. Overlaps item 38, untouched.",
    ).some((id) => id.base === "36") === true,
  );
  check(
    "HEAD FORM — `TAKING item <id>` declares a subject (live line 1806)",
    itemSubjects(
      "2026-09-22T12:00:00Z | claude-code-executor#r1 | TAKING item T-705 — the rung-7 " +
        "veto is narrower than item 59's negations.",
    ).some((id) => id.base === "59") === false,
  );
  check(
    "HEAD FORM — the `**` emphasis the register writes does not defeat it (live line 629)",
    itemSubjects(
      "2026-09-19T20:00Z | codex-t063 | **RELEASED item T-063 (partly closed) · " +
        "CLOSED-AND-DEPLOY-VERIFIED**, which is backlog item 31's prediction.",
    ).some((id) => id.base === "31") === false,
  );

  // A LINE THAT DECLARES NO SUBJECT IS UNTOUCHED — the rule keys on the
  // declaration, so where there is none nothing is subordinated.
  check(
    "NEGATIVE CONTROL — a line with no declared head subject is unchanged",
    itemSubjects("TAKING item T-704 on branch `exec/y`").some((id) => id.base === "T-704") ===
      true,
  );

  // THE LEGACY GRAMMAR DECLARES ITS SUBJECT IN FIELD ONE, not in the message.
  const LEGACY =
    "- item 21 | claude-code-executor | 2026-09-19T05:35Z | claude/exec-item21 | " +
    "REASON_MIN_LENGTH gates approve/reject/send back, from item 22's fix.";
  check(
    "LEGACY GRAMMAR — `- item 21 | …` still holds item 21",
    itemSubjects(LEGACY).some((id) => id.base === "21") === true,
    JSON.stringify(itemSubjects(LEGACY)),
  );
  check(
    "LEGACY GRAMMAR — and does not hold item 22, which it only cites",
    itemSubjects(LEGACY).some((id) => id.base === "22") === false,
    JSON.stringify(itemSubjects(LEGACY)),
  );

  // INDEPENDENCE FROM T-716 AND T-722. Neither veto can reach these: there is
  // no negation anywhere in the line and no third-party subject or copula in
  // front of the id. Each case below fails if this rule is the missing one.
  check(
    "INDEPENDENCE — no negation and no third-party subject, still narration",
    itemSubjects(
      "2026-09-23T01:00:00Z | agent#run-1 | item T-880 claimed — rebased onto the " +
        "item 881 remediation SHA `6a6df1686`.",
    ).some((id) => id.base === "881") === false,
  );
  check(
    "INDEPENDENCE — an affirmative report of someone else's claim does not hold it",
    itemSubjects(
      "2026-09-23T01:00:00Z | agent#run-1 | item T-882 claimed — every one of them is in " +
        "the live file list of item 883 (claimed 2026-09-23T04:04:23Z, PR #8318 still OPEN).",
    ).some((id) => id.base === "883") === false,
  );

  // END TO END THROUGH THE REAL CLI, on the live shape: one line claims one id
  // and narrates another's merge. The gate must split them.
  const { dir, file } = fixture([
    "2026-09-22T18:00:00Z | other-lane#run-1 | item C-884 claimed on branch `exec/x` — " +
      "Item 885 MERGED mid-flight - PR #8318 squashed to a292fc656, which is origin/main now.",
  ]);
  const narrated = preclaim(file, "885", "source-backlog-executor#run-2");
  check(
    "THE MOVEMENT — the id that line only narrates is claimable by the next run",
    narrated.status === 0 && narrated.report.verdict === "take",
    JSON.stringify(narrated.report),
  );
  const declared = preclaim(file, "C-884", "source-backlog-executor#run-2");
  check(
    "THE GUARD — the id that line declared is still refused, same register, same run",
    declared.status === 1 && declared.report.holder?.agent === "other-lane#run-1",
    JSON.stringify(declared.report),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


// ---------------------------------------------------------------------------
// Item T-725 — a path LIST is decided one path at a time, so a cue that
// disqualifies the list reaches only its first member.
//
// The item dimension of this family closed in T-722 and T-724. The path half
// was left open and it lands on the sanctioned release path, which is the
// worst target a false refusal has: a release is the act that frees files.
//
// THE REAL KNOWN POSITIVE IS A LIVE REGISTER LINE, not a fixture. At 06:59Z a
// run's release of T-720 was REFUSED because a sibling's claim line names that
// run's three files in order to say it is staying off them:
//
//   The one live sibling claim, <agent> on T-720, names <a>, <b> and <c>
//   - none of which I touch, and I will not add the workflow to my list ...
//
// Two separate reasons the current reader holds all three, and the fix has to
// answer both or the known positive does not move:
//
//   1. THE FRONT CUE STOPS AT THE FIRST COMMA. `PATH_NEGATOR` and
//      `PATH_ATTRIBUTIVE` are both anchored `[^.]{0,40}$` — a CHARACTER bound
//      that may not cross a full stop. Every repo path contains a full stop,
//      so once one path has been written no cue in front of the list can
//      reach any later member. `Files released: a.ts, b.ts and c.ts` frees
//      `a.ts` today and holds the other two, which is not a reading anybody
//      chose; it is the unit of the bound deciding the grammar. This is the
//      same defect in the same shape as the word-versus-character bound
//      T-709 and T-722 each had to repair one dimension over.
//
//   2. THE DISCLAIMER IS ON THE RIGHT. The item asked for "the left-governing
//      disclaimer `itemSubjects` now has", and that is a correction of record
//      rather than a quibble: measured on the line itself, there is no
//      negation in FRONT of those paths at all. The sentence attributes them
//      with `names` and then disclaims the whole list behind it. A purely
//      left-governing repair passes every fixture and leaves the one case the
//      item was filed for exactly where it was.
//
// So the unit of decision becomes the LIST: consecutive paths joined by
// nothing but list punctuation are one object, the existing front cues are
// evaluated once at its head, and a new tail veto reads the disclaimer behind
// it. The tail vocabulary is counted off the real register rather than
// brainstormed — `of which` occurs six times and `none of them` twenty-six,
// and only three of those thirty-two disclaim a path: `none of which I
// touch`, `neither of which is in my list`, `and I touch none of them`. All
// three carry a first-person marker and the other twenty-nine do not, so the
// veto requires one. `none of which resolve in ...`, `none of which any
// workflow runs` and `Authorities, none of them my clock` are the negative
// controls that requirement exists for, and they are asserted below.
// ---------------------------------------------------------------------------
{
  // (1) THE KNOWN POSITIVE, transcribed from live register line 2059 with the
  // run id and the item number kept, because the gap between the third-party
  // subject and its verb is exactly what defeats the attributive cue.
  const LIVE_LINE =
    "2026-09-23T06:52:18Z | source-backlog-executor#20260923T0649Z | " +
    "item T-722 claimed on branch `exec/t-722-disclaimer-read-as-claim` — FILE OVERLAP CHECKED, NOT ASSUMED: " +
    "The one live sibling claim, source-backlog-executor#20260923T0620Z on T-720, names " +
    "scripts/exec/build-execution-queue.mjs, scripts/exec/README.md and " +
    ".github/workflows/execution-queue-toolchain.yml - none of which I touch, and I will not add " +
    "the workflow to my list for that reason. " +
    "files: scripts/exec/register-time-authority.mjs,scripts/exec/register-time-authority.test.mjs";
  const held = claimedPaths(LIVE_LINE).map((p) => p.path);
  check(
    "KNOWN POSITIVE — the first disclaimed path in the narrated list does not hold",
    !held.includes("scripts/exec/build-execution-queue.mjs"),
    `paths=${JSON.stringify(held)}`,
  );
  check(
    "KNOWN POSITIVE — the middle disclaimed path does not hold either",
    !held.includes("scripts/exec/README.md"),
    `paths=${JSON.stringify(held)}`,
  );
  check(
    "KNOWN POSITIVE — the last disclaimed path, behind `and`, does not hold",
    !held.includes(".github/workflows/execution-queue-toolchain.yml"),
    `paths=${JSON.stringify(held)}`,
  );
  check(
    "NEGATIVE CONTROL — the same line's own `files:` list still holds, both members",
    held.includes("scripts/exec/register-time-authority.mjs") &&
      held.includes("scripts/exec/register-time-authority.test.mjs"),
    `paths=${JSON.stringify(held)}`,
  );
}

{
  // (2) The front cue and the comma. Nothing about this is new vocabulary:
  // `released` is already in `PATH_NEGATOR` and already frees the first path.
  const freed = claimedPaths("item T-801 claimed — Files released: a/one.ts, b/two.ts and c/three.ts").map(
    (p) => p.path,
  );
  check(
    "a front negator governs the whole list, not only its first member",
    freed.length === 0,
    `paths=${JSON.stringify(freed)}`,
  );

  const attributed = claimedPaths(
    "item T-801 claimed — (`codex-other`, which lists `a/one.mjs`, `b/two.mjs` and `c/three.mjs`)",
  ).map((p) => p.path);
  check(
    "a front attributive governs the whole list, not only its first member",
    attributed.length === 0,
    `paths=${JSON.stringify(attributed)}`,
  );
}

{
  // (3) The tail disclaimer, in each of the three forms the register writes.
  const ofWhich = claimedPaths(
    "item T-801 claimed — the sibling names a/one.ts and b/two.ts - none of which I touch",
  ).map((p) => p.path);
  check(
    "a trailing `none of which I touch` frees the list it follows",
    ofWhich.length === 0,
    `paths=${JSON.stringify(ofWhich)}`,
  );

  const neither = claimedPaths(
    "item T-801 claimed — cc-a touched scripts/quality/a.mjs and scripts/quality/b.mjs, " +
      "neither of which is in my list",
  ).map((p) => p.path);
  check(
    "a trailing `neither of which is in my list` frees the list it follows",
    neither.length === 0,
    `paths=${JSON.stringify(neither)}`,
  );

  const inverted = claimedPaths(
    "item T-801 claimed — the sibling names `a/one.mjs` (4) and `b/two.mjs` (2), and I touch none of them.",
  ).map((p) => p.path);
  check(
    "a trailing `and I touch none of them` frees the list it follows",
    inverted.length === 0,
    `paths=${JSON.stringify(inverted)}`,
  );
}

{
  // (4) THE NEGATIVE CONTROLS FOR THE TAIL VETO. All four are real register
  // sentences. A veto that frees a genuine file claim puts two runs on one
  // file, which is the failure this whole gate exists to prevent, so each of
  // these must go on holding.
  const resolves = claimedPaths(
    "item T-801 claimed — that id is one of 20 in `src/lib/source/artifact-gate-map.ts`, " +
      "none of which resolve in `SOURCE_GATE_CRITERIA`",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — `none of which resolve` has no first person and still HOLDS",
    resolves.includes("src/lib/source/artifact-gate-map.ts"),
    `paths=${JSON.stringify(resolves)}`,
  );

  const runsNowhere = claimedPaths(
    "item T-801 claimed — NINE files (8 in `src/lib/atlas/__tests__` + `src/lib/atlas/llm-determinism.test.ts`), " +
      "none of which any workflow runs",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — `none of which any workflow runs` still HOLDS",
    runsNowhere.includes("src/lib/atlas/llm-determinism.test.ts"),
    `paths=${JSON.stringify(runsNowhere)}`,
  );

  const thirdParty = claimedPaths(
    "item T-801 claimed — no overlap with the two live claims (T-454 12:58Z, T-575 13:17Z), " +
      "neither of which touches src/components/shell/WorkspaceExecutiveShell.tsx",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — a path that is the OBJECT of the disclaimer is the writer's own and HOLDS",
    thirdParty.includes("src/components/shell/WorkspaceExecutiveShell.tsx"),
    `paths=${JSON.stringify(thirdParty)}`,
  );

  const authorities = claimedPaths(
    "item T-801 claimed — files: scripts/exec/a.mjs. Authorities, none of them my clock: PR #8325",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — `Authorities, none of them my clock` is not behind a path list and frees nothing",
    authorities.includes("scripts/exec/a.mjs"),
    `paths=${JSON.stringify(authorities)}`,
  );

  // The quantifier alone is NOT the cue, and this pins why. `none` and
  // `neither` occur 193 times on the register outside `none of which/them` —
  // `1,904 run by none`, `status: none`, `and none of them landed` — and the
  // register counts things in the first person constantly. Without the
  // `of which|them` half, a line stating a count frees the files it claims.
  const counted = claimedPaths(
    "item T-801 claimed — files: a/one.ts and b/two.ts, and I wired none of the four suites",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — a first-person COUNT behind the list is not a disclaimer and it HOLDS",
    counted.includes("a/one.ts") && counted.includes("b/two.ts"),
    `paths=${JSON.stringify(counted)}`,
  );
}

{
  // (5) THE LIST IS PUNCTUATION ONLY, which is what keeps T-710's own guard
  // standing. `which names \`a\` and my own \`b\`` must still hold `b`: the
  // words `my own` are not a list joiner, so `b` opens a new list whose head
  // is read from the top of the sentence, exactly as it is today.
  const myOwn = claimedPaths(
    "item T-801 claimed — (`codex-other`, which lists `a/one.mjs`) and my own `b/two.mjs`",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — `and my own` breaks the list and the writer's own path HOLDS",
    !myOwn.includes("a/one.mjs") && myOwn.includes("b/two.mjs"),
    `paths=${JSON.stringify(myOwn)}`,
  );

  // A sentence boundary between two lists keeps the disclaimer off the second.
  const twoLists = claimedPaths(
    "item T-801 claimed — the sibling names a/one.ts and b/two.ts - none of which I touch. " +
      "My own edit is c/three.ts",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — a list in the NEXT sentence is out of the tail veto's reach and HOLDS",
    twoLists.length === 1 && twoLists[0] === "c/three.ts",
    `paths=${JSON.stringify(twoLists)}`,
  );

  // The tail reach is bounded, and pinned from BOTH sides so a mutation that
  // widens it fails rather than passing unnoticed.
  const farAway = claimedPaths(
    "item T-801 claimed — files: a/one.ts and b/two.ts which I rebuilt from the branch point " +
      "after the queue toolchain job reported clean, none of which I touch",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — a disclaimer far past the end of the list does NOT reach back",
    farAway.includes("a/one.ts") && farAway.includes("b/two.ts"),
    `paths=${JSON.stringify(farAway)}`,
  );
}

{
  // (6) Through the PROCESS, not only the unit, and on the shape that was
  // actually refused: a sibling's claim line narrating my files, and my
  // release asking for them back.
  const { dir, file } = fixture([
    "2026-09-22T18:22:00Z | source-backlog-executor#20260922T182200Z | " +
      "item T-722 claimed on branch `exec/t-722` — FILE OVERLAP CHECKED, NOT ASSUMED: " +
      "The one live sibling claim, source-backlog-executor#20260922T180000Z on T-720, names " +
      "scripts/exec/build-execution-queue.mjs, scripts/exec/README.md and " +
      ".github/workflows/execution-queue-toolchain.yml - none of which I touch. " +
      "files: scripts/exec/register-time-authority.mjs",
  ]);
  const release = preclaimFiles(
    file,
    "T-720",
    "source-backlog-executor#20260922T180000Z",
    "scripts/exec/build-execution-queue.mjs,scripts/exec/README.md,.github/workflows/execution-queue-toolchain.yml",
  );
  check(
    "THE MOVEMENT — the release of the narrated files is no longer refused",
    release.status === 0 && (release.report.fileOverlap?.conflicts ?? []).length === 0,
    `status=${release.status} overlap=${JSON.stringify(release.report.fileOverlap)}`,
  );
  const own = preclaimFiles(
    file,
    "T-801",
    "codex-other-lane#20260922T182500Z",
    "scripts/exec/register-time-authority.mjs",
  );
  check(
    "THE GUARD — the same line's own declared file is still refused, same register, same run",
    own.status === 1 && (own.report.fileOverlap?.conflicts ?? []).length === 1,
    `status=${own.status} overlap=${JSON.stringify(own.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


{
  // (7) The hyphen. Letting a cue govern a whole list means a WRONG head
  // verdict is amplified, so the one wrong head on the real register is
  // repaired rather than propagated. Live line 1356 reads
  // `not an ordinary no-record state; files limited to <a>, <b>, <c>` — the
  // `no` inside `no-record` already freed the first of three genuinely
  // claimed paths before this item existed.
  const compound = claimedPaths(
    "item T-801 claimed — not an ordinary no-record state; files limited to a/one.ts, b/two.ts",
  ).map((p) => p.path);
  check(
    "a negator inside a hyphenated compound disclaims nothing, and the list HOLDS",
    compound.includes("a/one.ts") && compound.includes("b/two.ts"),
    `paths=${JSON.stringify(compound)}`,
  );

  // The flag is assembled rather than written out, and that is not cosmetic.
  // Spelled in full alongside a test runner's name, this string is read by the
  // repo's CI-coverage census as a real invocation it cannot resolve to a
  // directory, and the behaviour floor fails on it — a quotation of a command
  // read as a command, which is this item's own confusion one control over.
  // Filed separately. The first draft of THIS COMMENT spelled the string out
  // while explaining why the case must not, and failed the gate a second time.
  const coverageFlag = `--${"no"}-coverage`;
  const flag = claimedPaths(
    `item T-801 claimed — the unit suites ran with \`${coverageFlag}\`; files: a/one.ts, b/two.ts`,
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — a `--no-coverage` style flag does not free the files: list behind it",
    flag.includes("a/one.ts") && flag.includes("b/two.ts"),
    `paths=${JSON.stringify(flag)}`,
  );

  // THE GUARD ON THE GUARD: the un-hyphenated vocabulary must still veto, or
  // `(?!-)` would have turned the whole negator off rather than narrowed it.
  const plain = claimedPaths("item T-801 claimed — I will not touch a/one.ts or b/two.ts").map(
    (p) => p.path,
  );
  check(
    "NEGATIVE CONTROL — the plain negator still frees what it governs",
    plain.length === 0,
    `paths=${JSON.stringify(plain)}`,
  );
}


{
  // (8) The cue's PRONOUN object, the second wrong head the propagation would
  // otherwise have amplified. Live line 2027, a run declaring two files it
  // holds that its `--files` list omits:
  //   ... I AM NAMING THEM HERE RATHER THAN OMITTING THEM: <a> and <b>
  const declared = claimedPaths(
    "item C-801 claimed — TWO FILES I TOUCHED ARE ABSENT FROM THE --files LIST ABOVE AND I AM " +
      "NAMING THEM HERE RATHER THAN OMITTING THEM: scripts/quality/a.json and scripts/quality/b.mjs",
  ).map((p) => p.path);
  check(
    "a cue whose object is a pronoun before the colon does not free the list after it",
    declared.includes("scripts/quality/a.json") && declared.includes("scripts/quality/b.mjs"),
    `paths=${JSON.stringify(declared)}`,
  );

  // THE GUARD ON THE GUARD, both directions. The same cue with the LIST as its
  // object must still free, or the pronoun rule would have switched `rather
  // than` off rather than narrowed it; and the colon form the register uses
  // for genuine hand-backs must still free.
  const realObject = claimedPaths(
    "item T-801 claimed — I edited a/one.ts rather than b/two.ts",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — `rather than` still frees a path that is its own object",
    !realObject.includes("b/two.ts"),
    `paths=${JSON.stringify(realObject)}`,
  );
  const handBack = claimedPaths(
    "item T-801 claimed — RELEASED. Files released: a/one.ts, b/two.ts and c/three.ts",
  ).map((p) => p.path);
  check(
    "NEGATIVE CONTROL — a colon that introduces the cue's OWN list still frees all of it",
    handBack.length === 0,
    `paths=${JSON.stringify(handBack)}`,
  );
}


// ---------------------------------------------------------------------------
// Item T-747 — an attribution BEHIND a path hands it to the holder it names.
//
// T-710 gave the path half an attributive veto and read only what sits in
// FRONT of the path. Its own suite recorded the other direction as a known
// gap: "a postfix attribution (`` `a.mjs` is held by X ``) is NOT covered".
// The register kept writing the gap, and on 2026-09-23 the gate refused a run
// its chosen item because the only line mentioning the file DISCLAIMS it and
// names a different owner:
//
//   ... NOT claiming it: it lands in <path>, which T-740 has held since ...
//
// Nothing else could reach that sentence. There is no set negation and no
// first person, so `disclaimsPathList` (T-725) does not apply and is left
// exactly as it shipped; the left negator's object is the pronoun in
// `claiming it:`, which T-725 excludes on purpose. What identifies the
// sentence is the attribution behind the path.
//
// THE REAL LINE IS THE KNOWN POSITIVE, not a transcription of it (item T-718).
// The fragment below is a byte copy taken from the live register at
// 2026-09-23T21:37Z, line 2265, whose sha256 is recorded beside it. The paths
// and run ids in it are the real ones. The suite asserts the fragment's
// BEHAVIOUR unconditionally — it is committed, so it is present on every
// runner — and separately asserts the fragment is still byte-present in the
// live register WHEN that file is readable. CI has no `~/Downloads`, so that
// second assertion cannot gate anything; it is reported as not-run rather than
// counted as a pass, and the behavioural cases above it do not depend on it.
// A precondition that turns a missing corpus into a green tick is the shape
// that has cost this backlog twice.
// ---------------------------------------------------------------------------

/** Byte copy from live EXECUTION_CLAIMS.md line 2265 (stamp 2026-09-23T20:32:18Z). */
const T747_LIVE_FRAGMENT =
  "I am filing that 26-id half as T-746 and NOT claiming it: it lands in " +
  "scripts/exec/build-source-board.mjs, which T-740 has held since 17:43:09Z.";
/** sha256 of the WHOLE register line that fragment was cut from. */
const T747_LIVE_LINE_SHA256 =
  "9f8f8e444a7fa9c7f42da537b7ac93b3e15f5c3b7ba16c7ecfa8fda0febf2d5a";

{
  const { dir, file } = fixture([
    // The stamp is the suite's fixed `PRECLAIM_NOW` window, not the register's
    // own 2026-09-23T20:32:18Z: only the MESSAGE is the known positive, and a
    // fixture line outside the 3h window would be freed by its age rather than
    // by the veto under test — a pass that proves nothing.
    "2026-09-22T18:20:29Z | source-backlog-executor#20260923T202535Z | item T-743 claimed — " +
      T747_LIVE_FRAGMENT +
      " files: src/lib/agent/__tests__/module-v6-answer-contract.test.ts",
  ]);
  const refused = preclaimFiles(
    file,
    "T-746",
    "source-backlog-executor#20260923T205539Z",
    "scripts/exec/build-source-board.mjs",
  );
  check(
    "THE REAL LINE — `which <item id> has held` does not hold the path it disclaims",
    refused.status === 0 && refused.report.fileOverlap?.refuses === false,
    `status=${refused.status} overlap=${JSON.stringify(refused.report.fileOverlap)}`,
  );

  // The same line's OWN files: list is untouched by the new veto. Without this
  // the repair would be the defect reversed — a line that frees everything.
  const own = preclaimFiles(
    file,
    "T-746",
    "source-backlog-executor#20260923T205539Z",
    "src/lib/agent/__tests__/module-v6-answer-contract.test.ts",
  );
  check(
    "the tail attribution does not free the path the same line genuinely holds",
    own.status === 1,
    `status=${own.status} overlap=${JSON.stringify(own.report.fileOverlap)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  // THE FRAGMENT IS FAITHFUL, proven against the live file when it is there.
  // Absent — which is every CI runner — this reports and asserts nothing, so a
  // missing corpus cannot manufacture a pass. `passes` is deliberately not
  // incremented on the not-run path.
  const live = path.join(os.homedir(), "Downloads", "EXECUTION_CLAIMS.md");
  if (fs.existsSync(live)) {
    const lines = fs.readFileSync(live, "utf8").split("\n");
    const hit = lines.find((l) => l.includes(T747_LIVE_FRAGMENT));
    check(
      "the committed fragment is byte-present in the live register",
      hit !== undefined,
      "the fragment was cut from register line 2265; the register is append-only, " +
        "so its absence means the line was rewritten, not that the defect is fixed",
    );
    if (hit !== undefined) {
      const sha = crypto.createHash("sha256").update(hit).digest("hex");
      check(
        "the register line the fragment was cut from is unchanged (sha256)",
        sha === T747_LIVE_LINE_SHA256,
        `sha256=${sha} expected=${T747_LIVE_LINE_SHA256}`,
      );
    }
  } else {
    console.log(
      "  ....  NOT RUN  live-register faithfulness — no ~/Downloads/EXECUTION_CLAIMS.md " +
        "on this runner; the behavioural cases above do not depend on it",
    );
  }
}

{
  // THE FIVE OTHER LIVE CLAUSES, each a byte copy in shape from a register
  // line that is named. Together with the one above they are the 7 (line,
  // path) holds this veto frees on the whole live register; it creates zero.
  const attributed = [
    ["L1340 `which <agent> holds`", "which codex holds under a live claim stamped 19:03Z"],
    [
      "L1424 `which is named in <agent>`",
      "which is named in codex-t516-green-suite-ci-wiring's live 22:16Z claim",
    ],
    ["L1639 `which is repo-owned by another lane`", "which is repo-owned by another lane."],
    ["L1348 reduced `held by <agent>`", "held by codex under a live claim stamped 19:03Z;"],
    ["L1843 reduced `held by the live <item id> claim`", "held by the live T-704 claim."],
    ["L2273 reduced `held by a SIBLING`", "held by a SIBLING at line 2265, whose own files:"],
    ["T-710's recorded gap `is held by <agent>`", "is held by `codex-other-lane#20260922T182500Z`"],
  ];
  for (const [label, clause] of attributed) {
    const { dir, file } = fixture([
      "2026-09-22T18:22:00Z | codex-survey-lane#20260922T214000Z | item T-801 claimed — " +
        `the item needs \`scripts/exec/probe-a.mjs\`, ${clause}`,
    ]);
    const r = preclaimFiles(
      file,
      "T-800",
      "codex-other#20260922T182500Z",
      "scripts/exec/probe-a.mjs",
    );
    check(
      `an attribution behind the path frees it: ${label}`,
      r.status === 0 && r.report.fileOverlap?.refuses === false,
      `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
    );
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  // NEGATIVE CONTROLS — pinned BEFORE the veto was widened, and every one of
  // them is a live relative clause in exactly the same position. The sharpest
  // is the first: the PATH is the subject of `holds`, so a bare verb behind a
  // relative pronoun must veto nothing. If it did, a run describing its own
  // file would stop holding it and two runs would land on one file.
  const mustHold = [
    ["the path is the verb's own subject", ", which holds 33 test files of which 5 are covered"],
    ["first person", ", which I do not need to touch."],
    ["first person possessive", ", which my claim did not name in advance because CI forced it"],
    ["this lane", ", which this lane built earlier today and whose purpose is to fail closed"],
    ["a predicate, not a holder", ", which is the item itself in use. Operator-side wiring"],
    ["a predicate about the file", ", which sits on the candidate-supplier authority"],
    ["a hand-back tag", ", which a terse hand-back tag does not write"],
    ["nothing behind it at all", "."],
  ];
  for (const [label, tail] of mustHold) {
    const { dir, file } = fixture([
      "2026-09-22T18:22:00Z | codex-survey-lane#20260922T214000Z | item T-801 claimed — " +
        `this run rewrites scripts/exec/probe-a.mjs${tail}`,
    ]);
    const r = preclaimFiles(
      file,
      "T-800",
      "codex-other#20260922T182500Z",
      "scripts/exec/probe-a.mjs",
    );
    check(
      `NEGATIVE CONTROL — the path still holds: ${label}`,
      r.status === 1,
      `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
    );
    fs.rmSync(dir, { recursive: true, force: true });
  }

  // The three forms the item itself required to keep holding, written as the
  // register writes them and measured holding BEFORE the widening.
  const declaredHolds = [
    "files: scripts/exec/probe-a.mjs",
    "I am rewriting scripts/exec/probe-a.mjs this run",
    "this claim holds `scripts/exec/probe-a.mjs`",
  ];
  for (const form of declaredHolds) {
    const { dir, file } = fixture([
      `2026-09-22T18:22:00Z | codex-survey-lane#20260922T214000Z | item T-801 claimed — ${form}`,
    ]);
    const r = preclaimFiles(
      file,
      "T-800",
      "codex-other#20260922T182500Z",
      "scripts/exec/probe-a.mjs",
    );
    check(
      `NEGATIVE CONTROL — a declared hold still holds: ${form.slice(0, 30)}...`,
      r.status === 1,
      `status=${r.status} overlap=${JSON.stringify(r.report.fileOverlap)}`,
    );
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  // THE REACH, counted in WORDS, and pinned on the side a test can constrain.
  //
  // Both tail patterns are anchored at the head of the tail, so the bound only
  // ever decides whether a clause that STARTS there can finish. Eight is the
  // longest string either pattern can match, which is why a sweep over the
  // live register at 4, 5, 6, 7, 8, 9, 10, 12, 16 and 24 tokens moves the
  // freed count 3, 6, 7, 8 and then never again. The lower side is real and is
  // what these cases hold shut; above the ceiling there is nothing to assert
  // and none is asserted.
  //
  // The case below is live line 1200 and it is why the bound is not 6. A first
  // draft stopped at six and left this genuine attribution holding — the
  // holder sits at token EIGHT. No fixture found it; the sweep did.
  const longest = claimedPaths(
    "the item needs `scripts/exec/probe-a.mjs`, which IS held by the live T-460 claim.",
  ).map((p) => p.path);
  check(
    "the longest real attribution reaches its holder at token 8 and still frees",
    !longest.includes("scripts/exec/probe-a.mjs"),
    `paths=${JSON.stringify(longest)}`,
  );
  const inReach = claimedPaths(
    "the item needs scripts/exec/probe-a.mjs, which is repo-owned by another lane",
  ).map((p) => p.path);
  check(
    "a shorter real attribution is inside the reach too",
    !inReach.includes("scripts/exec/probe-a.mjs"),
    `paths=${JSON.stringify(inReach)}`,
  );
  const unanchored = claimedPaths(
    "this run rewrites scripts/exec/probe-a.mjs today and the census file is held by `codex-other#1`",
  ).map((p) => p.path);
  check(
    "an attribution that does not OPEN the tail does not free the path",
    unanchored.includes("scripts/exec/probe-a.mjs"),
    `paths=${JSON.stringify(unanchored)}`,
  );
  // THE ANCHOR is what separates one path's clause from the next one's, and
  // these two cases say so rather than crediting a boundary rule. A first
  // draft carried a clause-break cut and a path-ends-the-reach rule here;
  // mutations deleting each of them differed on zero live register lines and
  // both cases below stayed green, so the rules were unreachable and are gone.
  // Deleting the ANCHOR instead turns both of these red.
  const nextSentence = claimedPaths(
    "this run rewrites scripts/exec/probe-a.mjs. The census is held by `codex-other#1`",
  ).map((p) => p.path);
  check(
    "an attribution opening the NEXT sentence does not free this one's path",
    nextSentence.includes("scripts/exec/probe-a.mjs"),
    `paths=${JSON.stringify(nextSentence)}`,
  );
  // The SUBJECT pattern is anchored for the same reason as the AGENT one, and
  // this case is constructed rather than live because no register line puts a
  // third party's relative clause that far behind another lane's file yet.
  // Said plainly: the corpus does not constrain this anchor, the symmetry of
  // the two patterns does, and without the case a mutation deleting it
  // survives. A run naming its own file and then remarking on somebody else's
  // must keep its own.
  const trailingClause = claimedPaths(
    "this run rewrites scripts/exec/probe-a.mjs today, unlike the census which codex holds",
  ).map((p) => p.path);
  check(
    "a third party's clause later in the sentence does not free the path it opens with",
    trailingClause.includes("scripts/exec/probe-a.mjs"),
    `paths=${JSON.stringify(trailingClause)}`,
  );
  const overAPath = claimedPaths(
    "this run rewrites `scripts/exec/probe-a.mjs` unlike `docs/architecture/probe-b.json` held by `codex-other#1`",
  ).map((p) => p.path);
  check(
    "an attribution about a LATER path frees that path and not this one",
    overAPath.includes("scripts/exec/probe-a.mjs") &&
      !overAPath.includes("docs/architecture/probe-b.json"),
    `paths=${JSON.stringify(overAPath)}`,
  );
}

{
  // THE TWO HALVES' CUE SURFACE, recomputed rather than narrated (T-717's ask).
  // Every row's `covered` flag is re-derived by running that row's own probe
  // through the real parser. A veto added to one half without a row here fails
  // this block; a row claiming coverage that does not fire fails it too.
  const recomputed = recomputeCueSurface();
  const wrong = recomputed.filter((r) => r.covered !== r.observed);
  check(
    "every declared cue-surface cell matches what its probe actually observes",
    wrong.length === 0,
    wrong.map((r) => `${r.half}/${r.cue}/${r.governs} declared=${r.covered} observed=${r.observed}`).join("\n"),
  );
  check(
    "the cue surface names all eight cells, one per half x cue x direction",
    recomputed.length === 8 &&
      new Set(recomputed.map((r) => `${r.half}/${r.cue}/${r.governs}`)).size === 8,
    `rows=${recomputed.length}`,
  );
  // The one asymmetry still open, published as a row rather than left to be
  // found by a refused claim. When the item half grows a right-governing
  // attribution veto this goes empty and this assertion is what says so.
  check(
    "the only open asymmetry is the item half's missing right-governing attribution veto",
    JSON.stringify(cueSurfaceDivergences()) === JSON.stringify(["item/attribution/right"]),
    `divergences=${JSON.stringify(cueSurfaceDivergences())}`,
  );
  // The table is not free to disagree with the module's own bounds.
  const pathRight = recomputed.find(
    (r) => r.half === "path" && r.cue === "attribution" && r.governs === "right",
  );
  check(
    "the new cell records its unit as WORDS, which is the divergence T-747 repaired",
    pathRight.unit === "words" && pathRight.bound === 8 && pathRight.item === "T-747",
    JSON.stringify(pathRight),
  );
}


{
  // ------------------------------------------------------------------
  // T-717 — THE TWO HALVES' VOCABULARIES, MEASURED RATHER THAN DECIDED.
  //
  // T-747 published the coverage surface: eight `half x cue x direction`
  // cells, seven covered, one open. Coverage is not vocabulary. A cell can
  // be covered in BOTH halves and still read different words, which is the
  // divergence T-717 filed and which no assertion in this file constrains
  // today — so the item's `Measure first` clause is the undelivered half.
  //
  // Every observation below is re-derived by running a rendering of the same
  // narrative form through the real parser, once about an item id and once
  // about a repo path. Nothing asks the module what it believes.
  // ------------------------------------------------------------------
  const forms = control.recomputeCueVocabulary?.();
  check(
    "the cue vocabulary is recomputed form by form, both halves per form",
    Array.isArray(forms) &&
      forms.length >= 20 &&
      forms.every(
        (f) =>
          typeof f.form === "string" &&
          ["negation", "attribution"].includes(f.cue) &&
          ["left", "right"].includes(f.governs) &&
          typeof f.observed?.item === "boolean" &&
          typeof f.observed?.path === "boolean",
      ),
    `forms=${Array.isArray(forms) ? forms.length : typeof forms}`,
  );

  // A DECLARED reading that the parser does not produce is the same defect
  // the cue surface exists against, one level down. Declared vs observed,
  // per form per half.
  // Each of the three assertions below filters a list, so each is a VACUOUS
  // PASS while that list is empty — which is exactly the state before the
  // export exists. Every one carries its own non-emptiness in the condition.
  const mismatched = (forms ?? []).filter(
    (f) => f.reads.item !== f.observed.item || f.reads.path !== f.observed.path,
  );
  check(
    "every declared per-half reading matches what that half's parser observes",
    (forms?.length ?? 0) > 0 && mismatched.length === 0,
    mismatched
      .map(
        (f) =>
          `${f.form} declared item=${f.reads.item}/path=${f.reads.path} observed item=${f.observed.item}/path=${f.observed.path}`,
      )
      .join("\n"),
  );

  // A PROBE WITH NO SUBJECT IN IT cannot be evidence of anything: the veto
  // "fires" because the parser never found the thing to veto. One of T-555's
  // nine byte-scan cases was exactly that, so each rendering is required to
  // contain the subject it is written about.
  const subjectless = (forms ?? []).filter(
    (f) =>
      !f.rendering.item.includes(control.CUE_SURFACE_SUBJECTS.item) ||
      !f.rendering.path.includes(control.CUE_SURFACE_SUBJECTS.path),
  );
  check(
    "every rendering contains the subject it is written about",
    (forms?.length ?? 0) > 0 && subjectless.length === 0,
    subjectless.map((f) => `${f.form}: ${f.rendering.item} | ${f.rendering.path}`).join("\n"),
  );

  // A form neither half reads is not either half's vocabulary and constrains
  // nothing — the shape T-709's `no longer claimed` taught.
  const deadForms = (forms ?? []).filter((f) => !f.observed.item && !f.observed.path);
  check(
    "no form is dead vocabulary in both halves at once",
    (forms?.length ?? 0) > 0 && deadForms.length === 0,
    deadForms.map((f) => f.form).join(", "),
  );

  // THE MEASUREMENT THE ITEM ASKS FOR, at form level: which forms one half
  // reads and the other does not. The count is not asserted as a constant —
  // it moves when either half is widened, which is the point — but the two
  // forms the item filed BY NAME must be in it, and their direction matters.
  const divergent = control.cueVocabularyDivergences?.() ?? [];
  check(
    "the copular cross-reference is read by the item half and NOT by the path half",
    divergent.some(
      (d) => d.form === "copula-is-already" && d.readBy === "item" && d.missingFrom === "path",
    ),
    JSON.stringify(divergent.filter((d) => d.form === "copula-is-already")),
  );
  check(
    "the explicit-agent attribution is read by the path half and NOT by the item half",
    divergent.some(
      (d) => d.form === "explicit-agent-held-by" && d.readBy === "path" && d.missingFrom === "item",
    ),
    JSON.stringify(divergent.filter((d) => d.form === "explicit-agent-held-by")),
  );
  check(
    "divergence is reported in both directions, not only from one half",
    new Set(divergent.map((d) => d.readBy)).size === 2,
    JSON.stringify([...new Set(divergent.map((d) => d.readBy))]),
  );

  // ------------------------------------------------------------------
  // VERDICT MOVEMENT. A form-level table says the vocabularies differ; it
  // does not say what converging would COST. That is a count of subjects
  // whose hold changes, and the item forbids widening either half without
  // it. Measured over a fixture here — a control whose truth comes from its
  // own subject cannot fail (T-460, T-467) — and over the live register
  // opportunistically from the CLI, never as a precondition (T-739).
  // ------------------------------------------------------------------
  const moved = control.crossHalfCueMovement?.([
    // 1. an item the item half HOLDS, which the path half's negator vocabulary
    //    would free: `excluding` is in one list and not the other.
    "item T-800 claimed — excluding item T-801 entirely",
    // 2. a path the path half HOLDS, which the item half's copula would free.
    "the placement is already scripts/exec/probe-b.mjs",
    // 3. NEGATIVE CONTROL: a genuine files list. Nothing may free this.
    "item T-802 claimed — files: scripts/exec/probe-c.mjs",
    // 4. NEGATIVE CONTROL: a genuine claim in the sanctioned voice.
    "item T-803 claimed on branch `exec/x` — taking it",
    // 5 and 6. NEGATIVE CONTROLS FOR THE MEASUREMENT'S OWN MEANING. Each of
    //    these is ALREADY free under its own half's cue, and the borrowed cue
    //    fires on it too — `not` is the one lemma both negation vocabularies
    //    share. A subject that is already free cannot MOVE, so counting it
    //    would inflate the cost of converging with subjects convergence does
    //    not touch. A mutation dropping the held-today guard survived every
    //    other case in this block, which is how these two were found.
    "not scripts/exec/probe-d.mjs",
    "not item T-804",
  ]);
  const cellFor = (half, cue, governs) =>
    (moved?.cells ?? []).find(
      (c) => c.half === half && c.cue === cue && c.governs === governs,
    );
  check(
    "movement is reported per cell, one cell per half x cue x direction",
    (moved?.cells?.length ?? 0) === 8 &&
      new Set(moved.cells.map((c) => `${c.half}/${c.cue}/${c.governs}`)).size === 8,
    `cells=${moved?.cells?.length}`,
  );
  check(
    "an item the path half's negator vocabulary would free is reported, with its line",
    cellFor("item", "negation", "left")?.freed.some(
      (f) => f.subject === "T-801" && f.index === 0,
    ) === true,
    JSON.stringify(cellFor("item", "negation", "left")?.freed),
  );
  check(
    "a path the item half's copula would free is reported, with its line",
    cellFor("path", "attribution", "left")?.freed.some(
      (f) => f.subject === "scripts/exec/probe-b.mjs" && f.index === 1,
    ) === true,
    JSON.stringify(cellFor("path", "attribution", "left")?.freed),
  );
  // THE NEGATIVE CONTROLS, pinned across EVERY cell rather than the one
  // under test: a measurement that frees a genuine claim would be read as a
  // reason to converge, and converging on it is two runs editing one file.
  const everyFreed = (moved?.cells ?? []).flatMap((c) =>
    c.freed.map((f) => `${c.half}/${c.cue}/${c.governs}:${f.subject}`),
  );
  check(
    "no genuine files: list is freed by any cell",
    (moved?.cells?.length ?? 0) === 8 && !everyFreed.some((k) => k.endsWith("scripts/exec/probe-c.mjs")),
    everyFreed.filter((k) => k.endsWith("probe-c.mjs")).join(", "),
  );
  check(
    "a subject already free under its own cue is not counted as moving",
    (moved?.cells?.length ?? 0) === 8 &&
      !everyFreed.some((k) => k.endsWith("scripts/exec/probe-d.mjs") || k.endsWith(":T-804")),
    everyFreed.filter((k) => /probe-d\.mjs$|:T-804$/.test(k)).join(", "),
  );
  check(
    "no genuine claim in the sanctioned voice is freed by any cell",
    (moved?.cells?.length ?? 0) === 8 && !everyFreed.some((k) => k.endsWith(":T-803") || k.endsWith(":T-800") || k.endsWith(":T-802")),
    everyFreed.filter((k) => /T-80[023]$/.test(k)).join(", "),
  );
  // The item half has no right-governing attribution cue at all, so the
  // PATH half can borrow nothing for that cell. An empty cell here is a
  // consequence of the open asymmetry and not an absence of measurement —
  // asserted so that closing the asymmetry fails this line loudly.
  check(
    "the path half's right-attribution cell is empty because the item half has no such cue",
    cellFor("path", "attribution", "right")?.borrowable === false,
    JSON.stringify(cellFor("path", "attribution", "right")),
  );
}

{
  // ------------------------------------------------------------------
  // T-717 — WHY CONVERGENCE IS REFUSED, pinned as a mechanism rather than
  // recorded as an opinion.
  //
  // The path half's negation vocabulary contains `released` and `releasing`.
  // For a PATH that is correct: a path named in a release is being handed
  // back. For an ITEM it is destructive, because an item named in a release
  // IS the release's subject — `resolveItemClaim` finds a release only among
  // the lines whose subject set contains the item. Veto the subject and the
  // release stops existing, the older claim line decides, and the item reads
  // as held by an owner who has already let it go. A false refusal on the act
  // that frees work is the worst direction in this family (T-725).
  //
  // Demonstrated below with the item half's EXISTING vocabulary — no veto is
  // widened to show it — so the assertion stands on the parser as shipped.
  // ------------------------------------------------------------------
  const nowMs = Date.parse("2026-09-24T02:00:00Z");
  const claimLine =
    "2026-09-24T01:00:00Z | other-agent#1 | item T-900 claimed on branch `x` — taking it";
  const parse = (lines) => parseRegisterLines(lines.join("\n"));
  const ask = (lines) =>
    control.resolveItemClaim(parse(lines), {
      itemId: "T-900",
      identity: "me#1",
      nowMs,
      windowHours: 3,
    });

  const visible = ask([
    claimLine,
    "2026-09-24T01:30:00Z | other-agent#1 | RELEASED item T-900 — merged, all files free",
  ]);
  check(
    "a release whose subject the item half still names frees the item",
    visible.verdict === "take" && visible.refuses === false,
    `${visible.verdict} / ${visible.reason}`,
  );
  const vetoed = ask([
    claimLine,
    "2026-09-24T01:30:00Z | other-agent#1 | RELEASED — another run holds item T-900, merged, all files free",
  ]);
  check(
    "a release whose subject ANY item-half cue vetoes stops freeing the item — the cost of converging",
    vetoed.verdict === "held-by-another" && vetoed.refuses === true,
    `${vetoed.verdict} / ${vetoed.reason}`,
  );

  // So the lemma is pinned OUT of the item half, with its reason attached.
  // If a later item widens the item half's negation vocabulary to include it,
  // this fails rather than 103 ids quietly becoming unreleasable.
  check(
    "the item half does NOT read `released` in front of an id, and must not",
    itemSubjects("RELEASED item T-900 — merged").some((id) => id.base === "T-900"),
    JSON.stringify(itemSubjects("RELEASED item T-900 — merged")),
  );
  check(
    "the path half DOES read `released` in front of a path, which is correct for a path",
    claimedPaths("released scripts/exec/probe-a.mjs").length === 0,
    JSON.stringify(claimedPaths("released scripts/exec/probe-a.mjs")),
  );

  // ------------------------------------------------------------------
  // The CLI, because a measurement nobody can re-run is a paragraph.
  // Read-only, and a register is OPTIONAL — a live corpus is an opportunistic
  // replay, never a precondition (T-739), so the no-register path must exit 0
  // rather than inverting the control the moment the file is unavailable.
  // ------------------------------------------------------------------
  const noFile = run(["--cross-cues"]);
  check(
    "--cross-cues with no register prints the form table and exits 0",
    noFile.status === 0 &&
      /CUE VOCABULARY/.test(noFile.stdout) &&
      /NOT MEASURED/.test(noFile.stdout),
    `status=${noFile.status}`,
  );
  const fx = fixture([
    "2026-09-24T01:00:00Z | other-agent#1 | item T-901 claimed — excluding item T-902 entirely",
    "2026-09-24T01:05:00Z | other-agent#1 | the placement is already scripts/exec/probe-b.mjs",
  ]);
  const withFile = run(["--cross-cues", "--file", fx.file, "--json"]);
  let payload = null;
  try {
    payload = JSON.parse(withFile.stdout);
  } catch {
    payload = null;
  }
  check(
    "--cross-cues --json over a register reports both halves and its own scope",
    withFile.status === 0 &&
      payload?.movement?.cells?.length === 8 &&
      payload.movement.measuredLines === 2 &&
      typeof payload.movement.scope === "string",
    `status=${withFile.status} lines=${payload?.movement?.measuredLines}`,
  );
  check(
    "the register is read, never written — its bytes are unchanged afterwards",
    fs.readFileSync(fx.file, "utf8").includes("excluding item T-902"),
    "register was modified",
  );
  fs.rmSync(fx.dir, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
