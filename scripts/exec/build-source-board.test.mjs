#!/usr/bin/env node
/**
 * Behavioural test for the board's claim-record boundary (item T-702).
 *
 * The defect this exists to hold shut: `executionClaimEntries` starts a new
 * claim entry only on `^TIMESTAMP | ` at MINUTE precision. Every register line
 * that does not match that shape is appended to the preceding entry's text. A
 * seconds-precision stamp does not match, and neither does the pipe-less
 * canonical form `<stamp> <agent> item <id> <branch> — claimed` that
 * `scripts/exec/README.md` documents. One "entry" therefore carries an
 * arbitrary number of unrelated register lines, and `claimTextForItem` hands
 * that whole blob to `deriveRung` for any id named anywhere inside it.
 *
 * Measured on the live register at 2026-09-22T15:26Z: 1207 lines begin with a
 * stamp, 633 parsed as entry starts, 574 (47.6%) were swallowed — 207 for
 * seconds precision and 367 for the pipe-less form. The consequence is not
 * cosmetic. `rung === 0` is the claimable filter and `rung === 7` is
 * `isFinished`, so an item reading a foreign line's proof language vanishes
 * from every bucket the queue renders. `build-execution-queue.mjs` already
 * accepts both forms in `parseClaimRecord`, so the two repo-owned generators
 * disagreed about what a record is.
 *
 * Every assertion here is on a real child process and on the rung the board
 * writes into `source-board-summary.json` for a FIXTURE id. Nothing asks the
 * code under test whether it thinks it parsed correctly.
 *
 * Run:  node scripts/exec/build-source-board.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { copyToolchainInto } from "./toolchain-manifest.mjs";

const FIXTURE_DOCUMENTS = {
  "SOURCE_EXECUTION_BOARD_20260917.md": `# Synthetic execution board

## Outcome tracker

| Outcome | Owner | Status |
|---|---|---|
| Toolchain is reviewed | test | open |
`,
  "EXECUTION_BACKLOG_20260918.md": `# Synthetic execution backlog

## Toolchain

| # | Item | Lane | Acceptance |
|---|---|---|---|
| T-507 | **Keep the board executable.** | T | The behavioral suite runs. |
`,
  "EXECUTION_CLAIMS.md": `# Synthetic claims

## Claim log — append only
`,
  "SOURCE_BACKLOG_MASTER.md": "# Synthetic scope\n",
};

/**
 * A register line that states signed-in proof for an id the cases never
 * declare. Nothing in this line refers to the fixture item; if a fixture item
 * reads rung 7, it read it from here.
 */
const FOREIGN_PROOF =
  "2026-09-22T02:01Z | codex-other-lane | RELEASED item T-909 — merged, deployed, "
  + "and signed-in acceptance PASSED on the deployed SHA.";

let failures = 0;
let passes = 0;

function check(name, ok, detail) {
  if (ok) {
    passes += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    if (detail) console.log(`        ${String(detail).split("\n").join("\n        ")}`);
  }
}

function freshFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "t702-"));
  // Declared once (item T-726) rather than listed here, so a module added to
  // the toolchain reaches this fixture without anyone remembering to add it.
  copyToolchainInto(dir);
  for (const [file, content] of Object.entries(FIXTURE_DOCUMENTS)) {
    fs.writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

function run(dir, script, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      status: err.status ?? 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? String(err.message ?? err),
    };
  }
}

function mapFixtureId(dir, id) {
  const file = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  map.platformTrack.items.push(id);
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
}

function addBacklogItem(dir, id, body, acceptance) {
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| ${id} | ${body} | T | ${acceptance} |\n`,
  );
  mapFixtureId(dir, id);
}

/**
 * A `# | Verdict | Proof` row, header and all — item T-737. The backlog's other
 * item convention, and the one that has no lane column: 236 of the 691 rows the
 * board parses are this shape, and reading their third cell as a lane is the
 * defect the cases below hold shut.
 */
function addVerdictRow(dir, id, verdict, proof, { map = true } = {}) {
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| # | Verdict | Proof |\n|---|---|---|\n| ${id} | ${verdict} | ${proof} |\n`,
  );
  if (map) mapFixtureId(dir, id);
}

/** An item row that declares a lane of the caller's choosing, header and all. */
function addBacklogItemInLane(dir, id, body, lane, acceptance) {
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n| # | Item | Lane | Acceptance |\n|---|---|---|---|\n| ${id} | ${body} | ${lane} | ${acceptance} |\n`,
  );
  mapFixtureId(dir, id);
}

function appendClaims(dir, lines) {
  fs.appendFileSync(path.join(dir, "EXECUTION_CLAIMS.md"), `\n${lines.join("\n")}\n`);
}

/** Every item the board wrote, keyed by id, from the summary it emits. */
function summaryItems(dir) {
  const summary = JSON.parse(
    fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"),
  );
  const out = new Map();
  const walk = (items) => {
    for (const it of items ?? []) out.set(String(it.num), it);
  };
  for (const s of summary.stages ?? []) {
    walk(s.items);
    for (const c of s.capabilities ?? []) walk(c.items);
  }
  for (const t of summary.tracks ?? []) walk(t.items);
  return { summary, out };
}

function buildBoard(dir) {
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  if (r.status !== 0) throw new Error(`fixture board build failed:\n${r.stderr}`);
  return r;
}

/** `execution claims parsed: N` from the board's own report line. */
function claimsParsed(stdout) {
  return Number(stdout.match(/execution claims parsed:\s+(\d+)/)?.[1] ?? -1);
}

console.log("build-source-board — claim-record boundary (T-702)\n");

/* ------------------------------------------------------------------------ *
 * 1. THE DEFECT, on the shape the live register actually uses.
 *    A seconds-precision line claiming the fixture item follows a foreign
 *    line that states signed-in proof. The fixture item declares no proof of
 *    its own, so rung 7 can only have come from the foreign line.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-901",
    "**An open question that has shipped nothing.**",
    "Convert the suite; no proof of any kind exists yet.",
  );
  appendClaims(dir, [
    FOREIGN_PROOF,
    "2026-09-22T13:39:41Z | fixture-agent | item T-901 claimed; nothing is built yet.",
  ]);
  const r = buildBoard(dir);
  const { out } = summaryItems(dir);
  const item = out.get("T-901");
  check(
    "a seconds-stamped claim line does not inherit the preceding line's signed-in proof",
    item?.rung === 0,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}\n`
      + `claims parsed=${claimsParsed(r.stdout)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 2. THE SAME DEFECT on the pipe-less canonical form the README documents:
 *    `YYYY-MM-DDTHH:MMZ <agent> item <id> <branch> — claimed`.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-902",
    "**A second open question that has shipped nothing.**",
    "Nothing is built yet.",
  );
  appendClaims(dir, [
    FOREIGN_PROOF,
    "2026-09-22T13:40Z fixture-agent item T-902 fixture/branch — claimed",
  ]);
  const r = buildBoard(dir);
  const { out } = summaryItems(dir);
  const item = out.get("T-902");
  check(
    "the pipe-less canonical claim form does not inherit the preceding line's proof",
    item?.rung === 0,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}\n`
      + `claims parsed=${claimsParsed(r.stdout)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 3. NEGATIVE CONTROL. An item whose OWN claim line states signed-in proof
 *    must still read rung 7. Without this, deleting claim evidence entirely
 *    — or refusing to parse the register at all — would pass cases 1 and 2.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-903",
    "**A finished item.**",
    "Proof already happened.",
  );
  appendClaims(dir, [
    "2026-09-22T13:41:02Z | fixture-agent | RELEASED item T-903 — merged, deployed, "
      + "and signed-in acceptance PASSED on the deployed SHA.",
  ]);
  buildBoard(dir);
  const { out } = summaryItems(dir);
  const item = out.get("T-903");
  check(
    "an item whose own seconds-stamped line states signed-in proof still reads rung 7",
    item?.rung === 7,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 4. GUARDRAIL against the opposite error. A genuine continuation — a wrapped
 *    line with no leading stamp — must still join the record above it. A fix
 *    that makes every line its own entry would pass 1, 2 and 3 and silently
 *    drop the tail of every multi-line record in the register.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-904", "**A finished item, recorded over two lines.**", "Proof already happened.");
  appendClaims(dir, [
    "2026-09-22T13:42:07Z | fixture-agent | RELEASED item T-904 — merged and deployed;",
    "signed-in acceptance PASSED on the deployed SHA.",
  ]);
  buildBoard(dir);
  const { out } = summaryItems(dir);
  const item = out.get("T-904");
  check(
    "a wrapped continuation line still joins the record above it",
    item?.rung === 7,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 5. The boundary is counted, not inferred. Three records written in the
 *    three grammars the register uses must parse as three, not one.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  const before = claimsParsed(buildBoard(dir).stdout);
  appendClaims(dir, [
    "2026-09-22T13:43Z | fixture-agent | item T-507 minute-precision with a pipe.",
    "2026-09-22T13:44:11Z | fixture-agent | item T-507 seconds precision with a pipe.",
    "2026-09-22T13:45Z fixture-agent item T-507 fixture/branch — claimed",
  ]);
  const after = claimsParsed(buildBoard(dir).stdout);
  check(
    "all three register grammars parse as separate records",
    before === 0 && after === 3,
    `before=${before} after=${after}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("\nbuild-source-board — within-record rung attribution (T-704)\n");

/* ------------------------------------------------------------------------ *
 * 6. THE DEFECT, on the live shape. One record, correctly bounded by T-702,
 *    claims the fixture item and names ANOTHER item's pull request as context
 *    in a sentence that exists to say the other item is somebody else's.
 *    The fixture item has no PR of its own, so rung 4 can only have come from
 *    the neighbour. This is `T-598` reduced to a fixture.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-911", "**Filed, nothing built.**", "Decide the approach first.");
  appendClaims(dir, [
    "2026-09-22T13:27:11Z | fixture-agent | item T-911 claimed. T-912 is NOT taken - it is claimed with PR #8255 open.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-911");
  check(
    "a neighbour's pull request named inside this item's record does not give it a rung",
    item?.rung === 0,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 7. THE GUARDRAIL, and the reason attribution is per TOKEN rather than per
 *    sentence. This is `T-448`'s real merge line: the item's own squash-merge,
 *    with two sibling ids in the trailing clause. A rule that drops any
 *    sentence naming a foreign id passes case 6 and deletes this — measured on
 *    the live register, that blunt rule dropped 8 own-leading sentences
 *    carrying real proof. The merge word is nearest to this item's own id, so
 *    it is this item's merge.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  // The row states no proof of any kind: `attributableStatusText` admits a
  // title or acceptance that OPENS with a verdict word, so "Merged and
  // recorded." in this cell would supply rung 5 by itself and the case would
  // pass whatever the attribution does.
  addBacklogItem(dir, "T-913", "**A change that lands.**", "The register carries its own line.");
  appendClaims(dir, [
    "2026-09-22T13:28:00Z | fixture-agent | item T-913 PR #8139 merge 70e8ebe2 — squash-merged after all 19 required checks completed green on the combined T-914/T-915/T-913 state.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-913");
  check(
    "an item's own merge survives sibling ids written later in the same sentence",
    item?.rung === 5,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 8. NEAREST, NOT FIRST. The same sentence leads with this item's own id and
 *    still hands the proof to a neighbour — `T-405`, whose line opens
 *    "item T-405 CLOSED" and then proves that two OTHER ids sit on a deployed
 *    carrier. A rule that keeps any sentence whose first id is this item's
 *    passes case 7 and fails here, so the two cases pull in opposite
 *    directions on purpose.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-916", "**A bookkeeping verdict.**", "Assert ancestry for others.");
  appendClaims(dir, [
    "2026-09-22T13:29:00Z | fixture-agent | item T-916 CLOSED — ancestry proves T-917 ab834dd5 and T-918 0b79765e are both contained by deployed carrier 0f166372.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-916");
  check(
    "leading with its own id does not let an item keep a deploy it attributes to others",
    item?.rung !== 6,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 9. A PULL REQUEST IS NOT AN ID. `#8255` is a PR and `item #59` is a backlog
 *    item. If the attribution grammar counted bare `#NNNN` as an id, the PR
 *    number in an item's own merge line would sit nearer the merge word than
 *    the item does and would steal every merge in the register.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-919", "**A change that lands.**", "The register carries its own line.");
  appendClaims(dir, [
    // The PR number sits NEARER the merge word than the item id does. A
    // grammar that counted `#8255` as an id would hand this merge to the pull
    // request and the item would lose it; with the id written adjacent to the
    // verb instead, the case passes whatever the grammar says.
    "2026-09-22T13:30:00Z | fixture-agent | item T-919 was taken on Monday and, after two rounds of review, PR #8255 squash-merged it.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-919");
  check(
    "a pull request number is not read as a competing item id",
    item?.rung === 5,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 10. THE DIRECTION, asserted rather than trusted. Attribution removes
 *     matches; it can never create one. Two items share one record — one owns
 *     the merge, the other is only named in it — and the one that is merely
 *     named must not end up ABOVE the one that owns it. A change that moves
 *     any item up needs its own argument, and this case is where that would
 *     first show.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-920", "**The owner of the record.**", "The register carries its own line.");
  addBacklogItem(dir, "T-921", "**Only mentioned.**", "Nothing shipped.");
  appendClaims(dir, [
    "2026-09-22T13:31:00Z | fixture-agent | item T-920 — squash-merged as abc1234.",
    "2026-09-22T13:31:30Z | fixture-agent | item T-921 claimed; it depends on item T-920 — squash-merged as abc1234.",
  ]);
  buildBoard(dir);
  const { out } = summaryItems(dir);
  const owner = out.get("T-920");
  const mentioned = out.get("T-921");
  check(
    "the item merely named in a merge does not outrank the item that owns it",
    owner?.rung === 5 && (mentioned?.rung ?? 0) < 5,
    `owner=${owner?.rung} (${owner?.rungLabel}) mentioned=${mentioned?.rung} (${mentioned?.rungLabel})`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("\nbuild-source-board — the rung-7 veto and what it exposes (T-705)\n");

/* ------------------------------------------------------------------------ *
 * 11. MARKUP BETWEEN `not` AND THE TERM. The register's habitual form, found
 *     on four live rows: "Status `deployed`, NOT `live-proven`." A single
 *     backtick defeats `\s+`, so the sentence that DENIES proof was read as
 *     asserting it. The row must read Deployed, which is what it says.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-930", "**Shipped to the cluster.**", "The register carries its own line.");
  appendClaims(dir, [
    "2026-09-22T14:01:00Z | fixture-agent | RELEASED item T-930 — merged and deployed. Status `deployed`, NOT `live-proven`.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-930");
  check(
    "markup between `not` and the term does not defeat the rung-7 veto",
    item?.rung === 6,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 12. AN INTERVENING WORD. The other live form: "This line does not claim
 *     deployed or live-proven." — `not` is followed by `claim`, three words
 *     before the term, so the adjacent-only veto missed it entirely.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-931", "**Shipped to the cluster.**", "The register carries its own line.");
  appendClaims(dir, [
    "2026-09-22T14:02:00Z | fixture-agent | item T-931 merged and deployed. This line does not claim deployed or live-proven.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-931");
  check(
    "words between `not` and the term do not defeat the rung-7 veto",
    item?.rung === 6,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 13. THE GUARDRAIL AGAINST TIGHTENING INTO SILENCE. A genuine signed-in
 *     proof must still reach rung 7. A veto widened until nothing can claim
 *     proof passes every negation case above and is worthless; this is the
 *     case that fails when that happens. It passes on unfixed code BY DESIGN.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-932", "**Shipped and accepted.**", "The register carries its own line.");
  appendClaims(dir, [
    "2026-09-22T14:03:00Z | fixture-agent | RELEASED item T-932 — merged, deployed, and signed-in acceptance PASSED on the deployed SHA.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-932");
  check(
    "a genuine signed-in proof still reaches rung 7",
    item?.rung === 7,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 13b. THE GUARDRAIL THAT ACTUALLY BITES. Case 13's proof sentence contains
 *      no `not` at all, so a veto widened to fire on ANY `not` passes it —
 *      measured, that mutation survived case 13 untouched. Real proof lines
 *      do carry a negative: the proof ladder's own rung 7 is "signed-in
 *      acceptance, and opposite-tenant refusal", which is written with one.
 *      Here the denial word sits AFTER the proof term, so the veto must not
 *      fire, and a veto keyed on the bare word does.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-935", "**Shipped and accepted.**", "The register carries its own line.");
  appendClaims(dir, [
    "2026-09-22T14:05:00Z | fixture-agent | RELEASED item T-935 — merged, deployed, signed-in acceptance PASSED and the opposite tenant could not read it.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-935");
  check(
    "a denial AFTER the proof term does not veto a genuine rung 7",
    item?.rung === 7,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 14. EVALUATION IS PER SENTENCE. A denial in ONE sentence must not veto a
 *     proof stated in the NEXT one.
 *
 *     Stated precisely, because the first version of this comment was wrong
 *     and a mutation caught it: what protects this is the SPLIT in
 *     `firstMatchingSentence`, not the veto's own `[^.;\n]` span. The veto
 *     never sees two sentences at once, so widening its span to cross a full
 *     stop changes nothing — measured, that mutation passes every case here.
 *     The `[^.;\n]` is belt-and-braces against a future caller that stops
 *     splitting; the mutation below removes the split itself, which is what
 *     this case actually holds shut.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(dir, "T-933", "**Shipped and accepted.**", "The register carries its own line.");
  appendClaims(dir, [
    "2026-09-22T14:04:00Z | fixture-agent | item T-933 is not a rollback. Signed-in acceptance PASSED on the deployed SHA.",
  ]);
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-933");
  check(
    "a denial in one sentence does not veto proof stated in the next",
    item?.rung === 7,
    `rung=${item?.rung} (${item?.rungLabel}) quote=${JSON.stringify(item?.quote ?? "")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 15. WHAT THE VETO EXPOSED, and the reason the blocker term ships with it.
 *
 *     Correcting the veto drops a live row to rung 0 — correctly; its own
 *     text says "not merged, not deployed, not applied". That row carries NO
 *     blocker, so a FALSE rung 7 was the only thing keeping owner-gated work
 *     out of the claimable bucket. A row that says its work remains out of
 *     scope until separately approved must carry an owner gate at rung 0, or
 *     the queue offers it as free work the moment the rung is corrected.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-934",
    "**Implemented locally; not merged, not deployed, not applied.**",
    "Migration apply, merge and deploy all remain out of scope until separately approved.",
  );
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-934");
  check(
    "a row gated until separately approved carries an owner gate at rung 0",
    item?.rung === 0 && item?.blocker === "Awaiting approval to apply",
    `rung=${item?.rung} (${item?.rungLabel}) blocker=${JSON.stringify(item?.blocker ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("\nbuild-source-board — the blocked rule is anchored and vetoed (T-703)\n");

/** The blocker the board wrote for a fixture id. */
function blockerOf(dir, id) {
  return summaryItems(dir).out.get(id)?.blocker ?? null;
}

/* ------------------------------------------------------------------------ *
 * 16. A FILENAME IS NOT A GATE. The live case: a row naming
 *     `blocked-loader-paths.json` among its outputs was filed as blocked on
 *     the owner. The bare word match could not tell a path from a status.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-940",
    "**A generator writes two report files.**",
    "Both reports/legacy/summary.json and reports/legacy/blocked-loader-paths.json get a fresh stamp and nothing else.",
  );
  buildBoard(dir);
  check(
    "a filename containing the word is not read as an owner gate",
    blockerOf(dir, "T-940") !== "Blocked (see source)",
    `blocker=${JSON.stringify(blockerOf(dir, "T-940"))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 17. A DESCRIBED STATE IS NOT A GATE. Also live: a row asking for proof that
 *     a panel "goes blocked rather than available" is describing the
 *     behaviour it wants built, not reporting that anybody is stuck.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-941",
    "**The panel must fail closed when its read fails.**",
    "Prove it by making the reader fail and confirming the panel goes blocked rather than available.",
  );
  buildBoard(dir);
  check(
    "a described UI state is not read as an owner gate",
    blockerOf(dir, "T-941") !== "Blocked (see source)",
    `blocker=${JSON.stringify(blockerOf(dir, "T-941"))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 18. THE REGRESSION SET, and the case that fails when the rule is tightened
 *     into silence. Both forms are live: one row opens `BLOCKED ON OWNER
 *     DECISION` in bold, another states its wiring is "blocked on the
 *     unapplied migration". Both pass on unfixed code BY DESIGN — a change
 *     that drops them is worse than the defect it replaces, because it takes
 *     an item OUT of the never-claim bucket.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  // The acceptance must NOT use the decision rule's vocabulary: that rule sits
  // above this one, so "Decide whether ..." here would make the case pass or
  // fail on a rule this item does not touch. Measured — the first version of
  // this fixture read `Decision needed` on unfixed code and proved nothing.
  addBacklogItem(dir, "T-942", "**BLOCKED ON OWNER DECISION** — a retired dependency is still live.", "Restore it or retire it, then record which.");
  addBacklogItem(dir, "T-943", "**The caller exists but cannot be wired.**", "Wiring is blocked on the unapplied migration; the orphan entry is kept rather than deleted.");
  buildBoard(dir);
  check(
    "a genuine gate keeps its label in both the shouted and the stated form",
    blockerOf(dir, "T-942") === "Blocked (see source)"
      && blockerOf(dir, "T-943") === "Blocked (see source)",
    `T-942=${JSON.stringify(blockerOf(dir, "T-942"))} T-943=${JSON.stringify(blockerOf(dir, "T-943"))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 19. THE VETO. A row saying the blockage is over must not be filed as one.
 *     Anchoring alone cannot do this: "is no longer blocked" is a predicate
 *     form and matches the anchored pattern exactly.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  // The negated form must be one the ANCHOR matches, or the case passes with
  // the veto deleted and proves nothing. Measured: "is no longer blocked" is
  // already rejected by the anchoring, so that mutation survived. "not blocked
  // on X" matches `blocked\s+on` exactly, so only the veto can reject it.
  addBacklogItem(dir, "T-944", "**The dependency landed.**", "This work is not blocked on the migration any more.");
  buildBoard(dir);
  check(
    "a row stating the blockage is over is not filed as blocked",
    blockerOf(dir, "T-944") !== "Blocked (see source)",
    `blocker=${JSON.stringify(blockerOf(dir, "T-944"))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 20. A VETOED SENTENCE MUST NOT HIDE A REAL GATE WRITTEN AFTER IT. One row
 *     can close an old blockage and open a new one, and a veto applied to the
 *     first match only — or to the whole row at once — loses the live gate.
 *     This is why the scan continues past a vetoed match and why the veto is
 *     evaluated per sentence.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-945",
    "**The first dependency landed; a second one has not.**",
    // The FIRST anchored match must be the vetoed one, or the scan never has to
    // continue and the case passes with a stop-at-first-match implementation.
    // Measured: with "is no longer blocked" first, the anchor skipped it
    // anyway and that mutation survived.
    "The loader is not blocked on the migration any more. The projector is blocked on a decision only the owner can make.",
  );
  buildBoard(dir);
  check(
    "a resolved blockage earlier in the row does not hide a live gate after it",
    blockerOf(dir, "T-945") === "Blocked (see source)",
    `blocker=${JSON.stringify(blockerOf(dir, "T-945"))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("\nbuild-source-board — an owner decision stated as a noun phrase (U-502)\n");

/* ------------------------------------------------------------------------ *
 * 21. A DECISION THAT NEVER SAYS "decision needed". The live row that forced
 *     this: its acceptance opens "A decision, then the work that follows from
 *     it: mount or retire." Placing that id on the map made it rung 0 with NO
 *     blocker, which is CLAIMABLE — the queue would have offered an owner
 *     decision to the next agent as free work.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-950",
    // The title must end with a PLAIN full stop, as the live row does. The
    // anchor accepts `**` only when it sits immediately before the phrase, so
    // a title ending `.**` puts bold between the stop and the words and the
    // case then fails for a reason that has nothing to do with the rule. That
    // is a real limit of the anchor, shared with the `Decide` form beside it,
    // and it is recorded as a known gap rather than papered over here.
    "Nine modules are reached by no product entry point.",
    "A decision, then the work that follows from it: mount them or retire them.",
  );
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-950");
  check(
    "an owner decision written as a noun phrase is not offered as free work",
    item?.blocker === "Decision needed",
    `rung=${item?.rung} (${item?.rungLabel}) blocker=${JSON.stringify(item?.blocker ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 22. THE ANCHOR, which is what keeps this from swallowing ordinary prose.
 *     The phrase must OPEN a sentence or follow bold markup. A row that
 *     merely mentions a decision in passing is not a gate, and a rule that
 *     read it as one would move finished work into the never-claim bucket.
 *     Passes on unfixed code BY DESIGN — it is the guardrail, not the defect.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItem(
    dir,
    "T-951",
    "**The work is done.**",
    "The owner already took a decision here and the change follows it; nothing is outstanding.",
  );
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-951");
  check(
    "a decision mentioned mid-sentence is not read as an owner gate",
    item?.blocker !== "Decision needed",
    `blocker=${JSON.stringify(item?.blocker ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("\nbuild-source-board — the lane comes from the named column (T-737)\n");

/* ------------------------------------------------------------------------ *
 * 23. THE DEFECT, on the live shape. An id whose only parsed definition is a
 *     `# | Verdict | Proof` row takes the PROOF cell as its lane, because the
 *     lane was read from position 2 and that convention has no lane column.
 *     `T-025` on the live board reads lane `PR #7957` by exactly this path,
 *     and it is one of 35 items in that state. `build-execution-queue.mjs`
 *     partitions claimable work by this field and sends anything it does not
 *     recognise to `Lane ? — unassigned lane`.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addVerdictRow(dir, "T-960", "**Merged**", "PR #7957, merge SHA `58f572683`.");
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-960");
  check(
    "a verdict row's Proof cell is not read as the item's lane",
    item !== undefined && !String(item?.lane ?? "").includes("#7957"),
    `lane=${JSON.stringify(item?.lane ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 24. THE SAME DEFECT where it decides ROUTING. The id carries a real item row
 *     declaring lane `U`, and a verdict row that happens to sit ABOVE it. The
 *     lane is resolved as the first non-empty across an id's definitions in
 *     document order, so the proof sentence wins and the declared lane is
 *     never reached. An item with a real acceptance and an unreadable lane is
 *     the one that reaches the queue and is offered to nobody.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addVerdictRow(dir, "T-961", "**Deployed**", "Merge `793e515a2`; revision healthy.", { map: false });
  addBacklogItemInLane(
    dir,
    "T-961",
    "**A surface nobody can reach.**",
    "U",
    "Mount it or retire it once the owner decides.",
  );
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-961");
  check(
    "a declared lane is not shadowed by a verdict row that precedes it",
    item?.lane === "U",
    `lane=${JSON.stringify(item?.lane ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 25. THE GUARDRAIL. Reading the named column must not stop reading the lane
 *     that is actually there. 454 of the 691 rows are the four-column item
 *     convention and every one of them must keep its letter. Passes on
 *     unfixed code BY DESIGN — it is what stops the fix from zeroing the field.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItemInLane(
    dir,
    "T-962",
    "**An ordinary item row.**",
    "C",
    "The agent control gets a behavioral test.",
  );
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-962");
  check(
    "a four-column item row still yields its declared lane",
    item?.lane === "C",
    `lane=${JSON.stringify(item?.lane ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 26. THE CONTRADICTION IS REPORTED, and only the contradicting id is named.
 *     A `T-` id declaring lane `D` and a `C-` id declaring lane `C` sit in one
 *     fixture. The live instance is `T-458`, which prints under `### Lane D` as
 *     one of the queue's claimable rows. This asserts the report exists, counts
 *     one, names the contradiction and does NOT name the agreeing id — an
 *     over-broad report would be as useless as none.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItemInLane(dir, "T-963", "**Register reconciliation.**", "D", "One line per item.");
  addBacklogItemInLane(dir, "C-963", "**An agent control.**", "C", "A behavioral test exists.");
  const r = buildBoard(dir);
  const line = r.stdout.split("\n").find((l) => l.includes("lane contradicts its id")) ?? "";
  check(
    "an id whose declared lane contradicts its own prefix is reported by name",
    /\b1\b/.test(line) && line.includes("T-963") && !line.includes("C-963"),
    `line=${JSON.stringify(line)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 27. AN UNUSABLE LANE IS ITS OWN VERDICT, not a contradiction. Reading the
 *     named column leaves 14 live items whose Lane cell genuinely holds
 *     something that is not a lane — a regex fragment, `...`, a sentence —
 *     because an unescaped `|` inside a code span shifts the row's cells. That
 *     is a separate defect and it is now reported rather than routed on. This
 *     case exists because without it the `KNOWN_LANES` guard in the
 *     contradiction filter is unfalsifiable: removing it moves all 14 into the
 *     contradiction list and every other case here stays green.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItemInLane(
    dir,
    "T-964",
    "**A row whose lane cell is not a lane.**",
    "`grep -q \"error TS\"` with no heap option",
    "The suite runs under the heap option.",
  );
  const r = buildBoard(dir);
  const lines = r.stdout.split("\n");
  const unusable = lines.find((l) => l.includes("lane cell is not a lane")) ?? "";
  const contradicts = lines.find((l) => l.includes("lane contradicts its id")) ?? "";
  check(
    "a lane cell that is not a lane is reported as unusable and not as a contradiction",
    unusable.includes("T-964") && !contradicts.includes("T-964"),
    `unusable=${JSON.stringify(unusable)}\ncontradicts=${JSON.stringify(contradicts)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
