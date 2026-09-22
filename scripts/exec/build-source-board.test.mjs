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
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const TOOLCHAIN_FILES = ["build-source-board.mjs", "source-stage-map.json"];

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
  for (const f of TOOLCHAIN_FILES) {
    fs.copyFileSync(path.join(HERE, f), path.join(dir, f));
  }
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

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
