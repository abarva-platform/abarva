#!/usr/bin/env node
/**
 * Behavioural test for the item-id collision detector (item T-729).
 *
 * The defect: two overlapping runs of one scheduled task each reach for "the
 * next free number" and each get it. It happened three times in one day and
 * was found every time by a human reading the file.
 *
 * The item was filed as "nothing detects a duplicate item id", and that is
 * false in a way that makes the cases below sharper rather than softer. A
 * detector has existed in `build-source-board.mjs` for longer than the item
 * has; it reports 59 collisions among 434 ids on the live backlog, and it
 * names NONE of the three that actually happened. So the acceptance here is
 * not "does something report duplicates" — two of the cases run the reader
 * over the REAL operator documents and require the two collisions that are
 * genuinely on disk, by id, by line number and by subject.
 *
 * Those real-corpus cases are skipped on a runner, where `~/Downloads` does
 * not exist, and they are COUNTED SEPARATELY so a skipped case can never be
 * mistaken for a passing one.
 *
 * Every synthetic fixture uses ids in the `T-9xx` band, which nothing has ever
 * filed. A fixture that spelled a real live id would be indistinguishable from
 * a filing of it to anything that reads this directory, and this file has
 * already recorded once that the line describing a defect is an instance of it.
 *
 * Run:  node scripts/exec/id-collision.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  backlogFilings,
  backlogOccurrences,
  detect,
  findingCount,
  isUpdateRowSubject,
  isUpdateTitle,
  parseItemId,
  registerClaims,
  tableRole,
} from "./id-collision.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "id-collision.mjs");

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

function run(args, options = {}) {
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
    return {
      status: error.status ?? -1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error.message ?? error),
    };
  }
}

function tmpfile(name, body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "idcollision-"));
  const file = path.join(dir, name);
  fs.writeFileSync(file, body);
  return file;
}

/**
 * A fixture line is composed, never spelled.
 *
 * `row("T-901", "…")` builds the pipe-delimited row at run time so that no
 * line of this file is itself a backlog filing. The same reason
 * `toolchain-manifest.test.mjs` composes its module names.
 */
const row = (...cells) => `| ${cells.join(" | ")} |`;
const rule = (n) => `|${"---|".repeat(n)}`;
const table = (header, ...rows) => [row(...header), rule(header.length), ...rows].join("\n");

/* ========================================================================= */
console.log("\nid grammar — round-trips with the sibling reader");
/* ========================================================================= */

check("a bare number is an id", parseItemId("38") === 38);
check("a hash-prefixed number is an id", parseItemId("#38") === 38);
check("a lane id is an id", parseItemId("T-729") === "T-729");
check("a bolded lane id is an id", parseItemId("**T-729**") === "T-729");
check(
  "`48a` is NOT an id, exactly as build-source-board.mjs decides it",
  parseItemId("48a") === null,
  "a grammar that disagrees with the sibling reader makes the two disagree " +
    "about what the backlog contains",
);
check("a four-digit lane id is not an id", parseItemId("T-7290") === null);

/* ========================================================================= */
console.log("\ntable role — declared by the header, never by the pipe");
/* ========================================================================= */

check("`# | Item` is a filing table", tableRole(["#", "Item", "Lane", "Acceptance"]) === "filing");
check("`id | finding` is a filing table", tableRole(["id", "finding", "lane", "status"]) === "filing");
check(
  "`id | what is wrong` is a filing table",
  tableRole(["id", "what is wrong", "lane", "acceptance"]) === "filing",
);
check("`# | Verdict` is an update table", tableRole(["#", "Verdict", "Proof"]) === "update");
check("`# | Status` is an update table", tableRole(["#", "Status", "Proof"]) === "update");
check(
  "`# | Mutation` is NOT an item table",
  tableRole(["#", "Mutation", "Failing cases"]) === null,
  "reading it as one collided with four of the oldest ids on the board",
);
check(
  "`id | first holder | second holder` is NOT an item table",
  tableRole(["id", "first holder", "second holder"]) === null,
  "that table is the human REPORT of a collision; counting its rows reports " +
    "each colliding id a third time, in the same direction as the bug",
);
check("a table not keyed on an id column is ignored", tableRole(["when", "what"]) === null);

/* ========================================================================= */
console.log("\nfiling vs update");
/* ========================================================================= */

check("a heading opening `verdict` is an update", isUpdateTitle("verdict 2026-09-19 (claude-code)"));
check("a heading opening `deploy addendum` is an update", isUpdateTitle("deploy addendum (agent)"));
check("a heading opening `still OPEN` is an update", isUpdateTitle("still OPEN and unclaimed"));
check("a heading opening `filed` is a filing", !isUpdateTitle("filed 2026-09-23 (agent), NOT CLAIMED"));
check(
  "`filed and closed <date>` is a FILING, and the carve-out is why",
  !isUpdateTitle("filed and closed 2026-09-20 (agent)"),
  "the item enters the backlog on that line; reading it as an update hides " +
    "the collision this detector exists for",
);
check(
  "a status term behind a semicolon is an update",
  isUpdateTitle("the census reads a command by POSITION; PR open 2026-09-23"),
  "the whole difference between reporting a live id twice and three times",
);
check(
  "a status term followed by a date is an update wherever it sits",
  isUpdateTitle("bounded slice closed 2026-09-19 (agent)"),
);
check(
  "a finding that merely states a subject is a filing",
  !isUpdateTitle("the Tower pressure brief is not on the Tower route"),
);
check(
  "a row subject opening `CLOSED —` is an update",
  isUpdateRowSubject("CLOSED — re-verified on current origin/main 2026-09-22."),
);
check(
  "a row subject opening `Verdict headings that omit …` is a FILING",
  !isUpdateRowSubject("Verdict headings that omit the word Item are parsed as second definitions."),
  "the bare prefix rule read this as a verdict and dropped a real collision; " +
    "a finding ABOUT verdicts opens with the word, a verdict opens with it and stops",
);

/* ========================================================================= */
console.log("\none filing is not a collision with itself");
/* ========================================================================= */

{
  const doc = [
    `## Item T-901 — filed 2026-09-23 (agent), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-901", "**a thing is wrong**", "T", "open")),
    "",
  ].join("\n");
  const filings = backlogFilings(doc);
  check(
    "a heading AND its own table row are ONE filing",
    filings.length === 1 && filings[0]?.lines.length === 2,
    JSON.stringify(filings),
  );
  check(
    "and the subject reported is the row's finding, not the filing event",
    Boolean(filings[0]) && filings[0].subject.startsWith("a thing is wrong"),
    JSON.stringify(filings),
  );
  check("so nothing is reported", detect({ backlog: doc }).duplicates.length === 0);
}

/* ========================================================================= */
console.log("\nthe two shapes the existing detector cannot see");
/* ========================================================================= */

{
  // Both filings written the way every filing since T-700 is written: a
  // level-two heading over an `id | finding` table. The sibling reader
  // requires `###` and a literal `#` header cell, and sees neither.
  const doc = [
    `## Item T-902 — filed 2026-09-23 (agent one), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-902", "**the first finding**", "T", "open")),
    "",
    `## Item T-902 — FILED 2026-09-23 (agent two), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-902", "**an unrelated second finding**", "T", "open")),
    "",
  ].join("\n");
  const report = detect({ backlog: doc });
  check(
    "a `##` heading over an `id | finding` table is a filing, twice over",
    report.duplicates.length === 1 && report.duplicates[0]?.count === 2,
    JSON.stringify(report.duplicates),
  );
  check(
    "and BOTH line numbers and BOTH subjects are reported",
    Boolean(report.duplicates[0]) &&
      report.duplicates[0].filings[0].lineNumber === 1 &&
      report.duplicates[0].filings[0].lines.join() === "1,5" &&
      report.duplicates[0].filings[1].lineNumber === 7 &&
      report.duplicates[0].filings[1].lines.join() === "7,11" &&
      report.duplicates[0].filings[0].subject.startsWith("the first finding") &&
      report.duplicates[0].filings[1].subject.startsWith("an unrelated second"),
    JSON.stringify(report.duplicates[0]?.filings ?? report.duplicates),
  );
}

{
  const doc = [
    `### Item T-903 [P1] — the old prose convention`,
    "",
    "Some narrative.",
    "",
    `## Added later`,
    "",
    table(["#", "Item", "Lane", "Acceptance"], row("T-903", "**a different finding entirely**", "T", "do it")),
    "",
  ].join("\n");
  check(
    "the OLD conventions still collide: a prose heading against a `# | Item` row",
    detect({ backlog: doc }).duplicates.length === 1,
  );
}

/* ========================================================================= */
console.log("\nthings that must NOT be read as filings");
/* ========================================================================= */

{
  const doc = [
    `## Item T-904 — filed 2026-09-23 (agent), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-904", "**the finding**", "T", "open")),
    "",
    `## Two ids are each held by two findings`,
    "",
    table(["id", "first holder", "second holder"], row("T-904", "the first thing", "the second thing")),
    "",
  ].join("\n");
  check(
    "a collision REPORT naming an id does not file it again",
    detect({ backlog: doc }).duplicates.length === 0,
    JSON.stringify(detect({ backlog: doc }).duplicates),
  );
}

{
  const doc = [
    `## Item T-905 — filed 2026-09-23 (agent), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-905", "**the finding**", "T", "open")),
    "",
    `### Mutation testing`,
    "",
    table(["#", "Mutation", "Failing cases"], row("T-905", "invert a guard", "4")),
    "",
  ].join("\n");
  check(
    "a mutation table naming a number does not file it",
    detect({ backlog: doc }).duplicates.length === 0,
  );
}

{
  const doc = [
    `## Item T-906 — filed 2026-09-23 (agent), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-906", "**the finding**", "T", "open")),
    "",
    `## Item T-907 — FILED 2026-09-23 (agent). T-906's own control did not run`,
    "",
    table(["id", "finding", "lane", "status"], row("T-907", "**a different finding**", "T", "open")),
    "",
  ].join("\n");
  const report = detect({ backlog: doc });
  check(
    "an id named in another item's TITLE is not a filing of it — position, not text",
    report.duplicates.length === 0 && report.backlogIds === 2,
    JSON.stringify(report.duplicates),
  );
}

{
  const doc = [
    `## Item T-908 — filed 2026-09-23 (agent), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-908", "**the finding**", "T", "open")),
    "",
    `## Item T-908 — CLOSED 2026-09-23 (agent)`,
    "",
    "It was closed. For the reader arriving here, the finding was:",
    "",
    table(["id", "finding", "lane", "status"], row("T-908", "**the finding**", "T", "closed")),
    "",
  ].join("\n");
  const report = detect({ backlog: doc });
  check(
    "a closure that RESTATES the finding in filing shape is not a second filing",
    report.duplicates.length === 0,
    "the heading governs its section; read row by row this reports a " +
      "collision between an item and its own obituary",
  );
}

{
  const doc = [
    `## Item T-909 — verdict 2026-09-23 (agent)`,
    "",
    "Closing T-909. While closing it, a new thing was found:",
    "",
    table(["id", "finding", "lane", "status"], row("T-910", "**something else entirely**", "T", "open")),
    "",
    `## Item T-910 — filed 2026-09-23 (other agent), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-910", "**a wholly different thing**", "T", "open")),
    "",
  ].join("\n");
  const report = detect({ backlog: doc });
  check(
    "an update heading governs only ITS OWN id — a new id filed inside it still counts",
    report.duplicates.length === 1 && report.duplicates[0]?.id === "T-910",
    JSON.stringify(report.duplicates.map((d) => d.id)),
  );
}

{
  const doc = [
    `## Item T-920 — filed 2026-09-23 (agent one), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-920", "**the first finding**", "T", "open")),
    "",
    `## Item T-920 — CLOSED 2026-09-23 (agent one)`,
    "",
    "It was closed.",
    "",
    `## Item T-920 — FILED 2026-09-23 (agent two), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-920", "**a wholly unrelated finding**", "T", "open")),
    "",
  ].join("\n");
  check(
    "an update heading governs its own section and NOT the ones after it",
    detect({ backlog: doc }).duplicates.length === 1,
  );
}

{
  // The shape that actually distinguishes it: the later filing has NO heading
  // of its own, so the row is the only signal. If the section state survives
  // the heading, that row is read as part of the closure above it. Measured on
  // the live backlog, leaving the state set loses five real collisions.
  const doc = [
    `## Item T-921 — filed 2026-09-23 (agent one), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-921", "**the first finding**", "T", "open")),
    "",
    `## Item T-921 — CLOSED 2026-09-23 (agent one)`,
    "",
    "It was closed.",
    "",
    `## New — found while closing something unrelated`,
    "",
    table(["id", "finding", "lane", "status"], row("T-921", "**a wholly unrelated finding**", "T", "open")),
    "",
  ].join("\n");
  check(
    "a row-only filing after a closure is still a filing — the state resets at every heading",
    detect({ backlog: doc }).duplicates.length === 1,
    JSON.stringify(backlogFilings(doc).map((f) => [f.lineNumber, f.subject.slice(0, 40)])),
  );
}

{
  // A date in a heading is the thing a text scan turns into an id. Reading the
  // id by POSITION rejects the heading entirely; reading it by text invents 27
  // filings across the live backlog and three collisions, one of them on the
  // number `2026`.
  const doc = [
    `## Item filed on 2026-09-23 by an agent — a note about several items`,
    "",
    table(["id", "finding", "lane", "status"], row("T-922", "**a finding**", "T", "open")),
    "",
  ].join("\n");
  const filings = backlogFilings(doc);
  check(
    "a date in a heading is never read as an item id",
    !filings.some((f) => f.id === 2026),
    JSON.stringify(filings.map((f) => f.id)),
  );
}

{
  // Two pipe blocks in one section, the second with no header of its own. The
  // first table's header must not reach across the blank line and lend its
  // role to rows it never described.
  const doc = [
    `## Item T-923 — filed 2026-09-23 (agent), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-923", "**the finding**", "T", "open")),
    "",
    row("T-923", "an unheaded row that describes something else"),
    "",
  ].join("\n");
  // Asserted on OCCURRENCES, not on filings. Both rows sit in one section, so
  // the filing grouping collapses them either way and the mutation hides
  // behind it — a second guard absorbing the first is how a survivor reads as
  // coverage.
  check(
    "a blank line ends a table, so a later unheaded row inherits nothing",
    backlogOccurrences(doc).filter((o) => o.via === "table").length === 1,
    JSON.stringify(backlogOccurrences(doc).map((o) => [o.lineNumber, o.via])),
  );
}

{
  const doc = [
    table(["#", "Item", "Lane", "Acceptance"], row("T-911", "**the finding**", "T", "do it")),
    "",
    "Text between the tables.",
    "",
    table(["#", "Item", "Lane", "Acceptance"], row("T-911", "CLOSED — done, see PR.", "T", "done")),
    "",
  ].join("\n");
  check(
    "a row updated IN PLACE, verdict-first in its subject cell, is not a filing",
    detect({ backlog: doc }).duplicates.length === 0,
  );
}

/* ========================================================================= */
console.log("\ncross-document — a LIVE claim on an ambiguous id");
/* ========================================================================= */

{
  const backlog = [
    `## Item T-912 — filed 2026-09-23 (agent one), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-912", "**the first finding**", "T", "open")),
    "",
    `## Item T-912 — FILED 2026-09-23 (agent two), NOT CLAIMED`,
    "",
    table(["id", "finding", "lane", "status"], row("T-912", "**the second finding**", "T", "open")),
    "",
  ].join("\n");
  const claim =
    "2026-09-23T09:00:00Z | agent-three#run | item T-912 claimed on branch `x` — taking it.";
  const release =
    "2026-09-23T09:30:00Z | agent-three#run | RELEASED item T-912 on branch `x` — merged.";

  const held = detect({
    backlog,
    register: claim,
    now: "2026-09-23T09:10:00Z",
  });
  check(
    "an id held right now while the backlog introduces it twice is reported",
    held.claimedAmbiguous.length === 1 && held.claimedAmbiguous[0]?.id === "T-912",
    JSON.stringify(held.claimedAmbiguous),
  );
  check(
    "and the report carries both competing subjects, not just the id",
    Boolean(held.claimedAmbiguous[0]) &&
      held.claimedAmbiguous[0].filings.length === 2 &&
      held.claimedAmbiguous[0].filings[0].subject !==
        held.claimedAmbiguous[0].filings[1].subject,
  );

  const released = detect({
    backlog,
    register: `${claim}\n${release}`,
    now: "2026-09-23T09:40:00Z",
  });
  check(
    "a RELEASE clears the hold — it is not merely skipped",
    released.claimedAmbiguous.length === 0,
    "skipping it leaves the last claim line standing and a closed item reads as live",
  );
  check(
    "but the duplicate filing itself is still reported after the release",
    released.duplicates.length === 1,
  );

  const stale = detect({
    backlog,
    register: claim,
    now: "2026-09-23T13:00:00Z",
  });
  check(
    "a claim older than the window is not live",
    stale.claimedAmbiguous.length === 0,
    `${stale.claimedAmbiguous.length} live at +4h with a 3h window`,
  );

  const noRegister = detect({ backlog });
  check(
    "no register means the cross-document check DID NOT RUN, not that it passed",
    noRegister.registerRead === false && noRegister.claimedAmbiguous.length === 0,
  );
}

check(
  "a register record is split on the same grammar the sibling generators use",
  registerClaims(
    "2026-09-23T09:00Z agent item T-913 claimed\ncontinuation line\n2026-09-23T09:05:00Z | agent | item T-914 claimed",
  ).length === 2,
  "minute AND second precision, with and without the pipe; a boundary that " +
    "misses one swallowed 47.6% of the register once already",
);

/* ========================================================================= */
console.log("\nthe CLI");
/* ========================================================================= */

{
  const clean = tmpfile(
    "EXECUTION_BACKLOG_20260918.md",
    [
      `## Item T-915 — filed 2026-09-23 (agent), NOT CLAIMED`,
      "",
      table(["id", "finding", "lane", "status"], row("T-915", "**one finding**", "T", "open")),
      "",
    ].join("\n"),
  );
  const ok = run(["--backlog", clean]);
  check("a clean backlog exits 0", ok.status === 0, `${ok.status} ${ok.stderr}`);
  check("and says so", /nothing to report/.test(ok.stdout), ok.stdout);
  check(
    "and says the register was NOT READ rather than printing a clean cross-document line",
    /NOT READ/.test(ok.stdout),
    ok.stdout,
  );

  const dirty = tmpfile(
    "EXECUTION_BACKLOG_20260918.md",
    [
      `## Item T-916 — filed 2026-09-23 (agent one), NOT CLAIMED`,
      "",
      table(["id", "finding", "lane", "status"], row("T-916", "**first**", "T", "open")),
      "",
      `## Item T-916 — FILED 2026-09-23 (agent two), NOT CLAIMED`,
      "",
      table(["id", "finding", "lane", "status"], row("T-916", "**second**", "T", "open")),
      "",
    ].join("\n"),
  );
  const bad = run(["--backlog", dirty]);
  check("a duplicate exits 1", bad.status === 1, `${bad.status} ${bad.stderr}`);
  check(
    "and the refusal names the resolution rather than sending anyone looking it up",
    /earlier filing keeps the id/.test(bad.stdout),
    bad.stdout,
  );

  const filtered = run(["--backlog", dirty, "--id", "T-917", "--json"]);
  check("--id narrows to one id", filtered.status === 0, filtered.stdout.slice(0, 200));

  const missing = run(["--backlog", path.join(os.tmpdir(), "does-not-exist-idc.md")]);
  check(
    "a missing backlog exits 2, distinct from both a clean run and a finding",
    missing.status === 2,
    `${missing.status} ${missing.stderr}`,
  );

  const help = run(["--help"]);
  check("--help exits 0", help.status === 0);
  check(
    "and states that nothing in CI runs this",
    /Nothing in CI runs this/.test(help.stdout),
    "an advisory control that reads as a gate gets wired as one",
  );
}

/* ========================================================================= */
console.log("\nthe two defects this directory keeps re-finding");
/* ========================================================================= */

{
  const child = run(["--help"], { env: { ...process.env } });
  check("the CLI runs when it is run", child.status === 0);

  const probe = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "idcimport-")), "probe.mjs");
  fs.writeFileSync(
    probe,
    `import ${JSON.stringify(CLI)};\nconsole.log("IMPORTED_CLEANLY");\n`,
  );
  const imported = run([], { env: process.env, ...{} });
  void imported;
  let importResult;
  try {
    importResult = {
      status: 0,
      stdout: execFileSync(process.execPath, [probe], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 60_000,
      }),
    };
  } catch (error) {
    importResult = { status: error.status ?? -1, stdout: error.stdout ?? "" };
  }
  check(
    "importing the module does not run its CLI (item T-723)",
    importResult.status === 0 && /IMPORTED_CLEANLY/.test(importResult.stdout),
    `status=${importResult.status} stdout=${importResult.stdout.slice(0, 300)}`,
  );
}

{
  // `process.exit()` after a large `console.log` to a PIPE truncates the write.
  // This is not hypothetical: the first measurement of this module through
  // `| node -e` returned JSON that ended mid-string at 65 kB.
  const big = [];
  for (let i = 0; i < 100; i += 1) {
    const id = `T-9${String(i).padStart(2, "0")}`;
    big.push(`## Item ${id} — filed 2026-09-23 (agent one), NOT CLAIMED`);
    big.push("");
    big.push(table(["id", "finding", "lane", "status"], row(id, `**${"first ".repeat(60)}**`, "T", "open")));
    big.push("");
    big.push(`## Item ${id} — FILED 2026-09-23 (agent two), NOT CLAIMED`);
    big.push("");
    big.push(table(["id", "finding", "lane", "status"], row(id, `**${"second ".repeat(60)}**`, "T", "open")));
    big.push("");
  }
  const file = tmpfile("EXECUTION_BACKLOG_20260918.md", big.join("\n"));
  const piped = execFileSync(
    "/bin/sh",
    ["-c", `${JSON.stringify(process.execPath)} ${JSON.stringify(CLI)} --backlog ${JSON.stringify(file)} --json | cat`],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  let parsed = null;
  try {
    parsed = JSON.parse(piped);
  } catch (error) {
    parsed = null;
    check("a large JSON report survives a pipe", false, `${error.message} (${piped.length} bytes)`);
  }
  if (parsed) {
    check(
      "a large JSON report survives a pipe intact",
      parsed.duplicates.length === 100 && piped.length > 100_000,
      `${parsed.duplicates.length} duplicates in ${piped.length} bytes`,
    );
  }
}

/* ========================================================================= */
console.log("\nthe real corpus — the only proof this item accepts");
/* ========================================================================= */

/**
 * The item says: prove it on the real collisions, not on fixtures. It names
 * three. Only TWO are on disk, and that correction is asserted here rather
 * than written in a comment — the second `T-720` filing was renumbered before
 * the file ever recorded it, so a detector that reported `T-720` would be
 * reporting history it cannot see.
 */
const operatorRoot = path.join(os.homedir(), "Downloads");
const realBacklog = path.join(operatorRoot, "EXECUTION_BACKLOG_20260918.md");
const realRegister = path.join(operatorRoot, "EXECUTION_CLAIMS.md");

if (!fs.existsSync(realBacklog)) {
  skip("the live backlog reports both collisions", `${realBacklog} is not on this machine`);
  skip("the live backlog does not report the renumbered one", "same");
  skip("a live hold on an ambiguous id replays from the register", "same");
} else {
  const backlog = fs.readFileSync(realBacklog, "utf8");
  const report = detect({ backlog });
  const byId = new Map(report.duplicates.map((d) => [String(d.id), d]));

  for (const id of ["T-721", "T-727"]) {
    const found = byId.get(id);
    check(
      `the live backlog reports ${id}, which the existing detector cannot see`,
      Boolean(found) && found.count === 2,
      found ? JSON.stringify(found.filings.map((f) => f.lineNumber)) : "not reported",
    );
    if (found) {
      check(
        `and ${id}'s two filings carry DIFFERENT subjects, not one restated`,
        found.filings[0].subject.slice(0, 60) !== found.filings[1].subject.slice(0, 60),
        (found.filings ?? []).map((f) => `${f.lineNumber}: ${f.subject.slice(0, 70)}`).join("\n"),
      );
    }
  }

  check(
    "the live backlog does NOT report the id whose second filing was renumbered away",
    !byId.has("T-720"),
    "the item names three collisions; two are on disk. Reporting the third " +
      "would mean reporting a renumber note as a live duplicate",
  );

  check(
    "a third collision the existing detector also misses is found",
    byId.has("T-060"),
    "two filing rows, two different findings, in two sections — reported by " +
      "this reader and by neither of the sibling reader's two parsers",
  );

  const occurrences = backlogOccurrences(backlog);
  check(
    "the reader classifies far more of the corpus as updates than as filings",
    occurrences.filter((o) => o.kind === "update").length >
      occurrences.filter((o) => o.kind === "filing").length,
    "a log this size is mostly progress notes; a reader that thought otherwise " +
      "would be counting them as findings",
  );

  if (!fs.existsSync(realRegister)) {
    skip("a live hold on an ambiguous id replays from the register", "register absent");
  } else {
    const register = fs.readFileSync(realRegister, "utf8");
    const atTheTime = detect({ backlog, register, now: "2026-09-23T10:10:00Z" });
    check(
      "pinned to the instant it was held, the register shows a live hold on an ambiguous id",
      atTheTime.claimedAmbiguous.some((c) => String(c.id) === "T-727"),
      JSON.stringify(atTheTime.claimedAmbiguous.map((c) => String(c.id))),
    );
    const nowReport = detect({ backlog, register, now: "2026-09-23T10:10:00Z", windowHours: 0.001 });
    check(
      "and with the window closed to nothing, no hold is live — the window is doing the work",
      nowReport.claimedAmbiguous.length === 0,
      JSON.stringify(nowReport.claimedAmbiguous.map((c) => String(c.id))),
    );
    check(
      "findingCount counts both channels",
      findingCount(atTheTime) ===
        atTheTime.duplicates.length + atTheTime.claimedAmbiguous.length,
    );
  }
}

console.log(`\n${passes} passed, ${failures} failed, ${skipped} skipped`);
process.exitCode = failures > 0 ? 1 : 0;
