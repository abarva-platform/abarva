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

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
