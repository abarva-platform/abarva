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
  // The real structure map already places most live ids, and it rejects a
  // repeat outright. Cases that replay REAL rows by id (T-738) would
  // otherwise crash the build rather than assert anything.
  const placed = JSON.stringify(map).includes(`"${id}"`);
  if (placed) return;
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

/**
 * The lane the board resolved for one id, from every place the summary
 * records one — item T-738.
 *
 * `summaryItems` walks stage, capability and track `items`, and an id the
 * structure map places on a CAPABILITY appears there as a `declaredIds`
 * entry with no `items` row of its own, so that walk alone cannot see its
 * lane. `T-429` is exactly that id, and reading it through the walk alone
 * reported `null` for a lane the board had resolved correctly. An unusable
 * or contradicting lane is still a lane for this purpose: both lists carry
 * the letter the parser produced, which is what these cases are about.
 */
function resolvedLane(dir, id) {
  const { summary, out } = summaryItems(dir);
  if (out.has(id)) return out.get(id).lane;
  const seen = [...(summary.laneContradictions ?? []), ...(summary.laneUnusable ?? [])]
    .find((r) => String(r.num) === id);
  return seen ? seen.lane : undefined;
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


/* ------------------------------------------------------------------------ *
 * 28. THE DEFECT (item T-738). A row splits on EVERY pipe, so an ESCAPED
 *     pipe — `\|`, which GFM defines as literal content anywhere in a row,
 *     including inside a code span — ends the cell it sits in and shifts
 *     every cell after it. The lane is the visible symptom because it is the
 *     routing field: 11 live items carry a Lane cell holding a regex
 *     fragment or a shell snippet for exactly this reason.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItemInLane(
    dir,
    "T-970",
    "**A row whose title quotes a regex.** The pattern is `/\\bfrom\\s*\\|\\bimport\\b/g` and it is content.",
    "T",
    "The suite reads the lane, not the second half of the regex.",
  );
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-970");
  check(
    "an escaped pipe inside a code span does not end the cell it sits in",
    item?.lane === "T",
    `lane=${JSON.stringify(item?.lane ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 29. THE ELEVEN REAL ROWS, BY ID. The acceptance asks for proof on the real
 *     rows rather than on a fixture alone, so these are the live backlog
 *     rows copied VERBATIM — whole, including the trailing delimiter, since
 *     that is what the property is about.
 *
 *     They are FROZEN into a repo-owned fixture rather than read from the
 *     operator backlog at test time, and that is item T-739's finding, not a
 *     convenience: four sibling suites assert a property of that MUTABLE
 *     document, so they go red locally the day it improves and SKIP on the
 *     runner, where nothing gates them. A case that cannot fail where it runs
 *     is the shape this whole directory exists against.
 * ------------------------------------------------------------------------ */
const KNOWN_LANE_LETTERS = new Set(["D", "U", "C", "T"]);

// Beside this module rather than under `__fixtures__/`, and that is not a
// style choice. `copyToolchainInto` takes every non-suite FILE in this
// directory and no subdirectory, so a suite run from a copied toolchain —
// which `toolchain-manifest.test.mjs` does to four suites — would find no
// such directory and crash. Measured: 16/1 to 15/2 on that suite.
const REAL_ROWS = fs
  .readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "t738-real-rows.md"), "utf8")
  .split(/\r?\n/);

/** The frozen rows, as `{ id, expect, line }` read from the fixture's own comments. */
function frozenRows() {
  const out = [];
  for (let i = 0; i < REAL_ROWS.length; i += 1) {
    const m = REAL_ROWS[i].match(/^<!--\s+(\S+)\s+\|\s+source line (\d+)\s+\|\s+expect lane (\S+)\s+-->$/);
    if (!m) continue;
    out.push({ id: m[1], sourceLine: Number(m[2]), expect: m[3], line: REAL_ROWS[i + 1] });
  }
  return out;
}

{
  const rows = frozenRows();
  const recoverable = rows.filter((r) => r.expect !== "MALFORMED");
  const dir = freshFixture();
  for (const r of recoverable) {
    fs.appendFileSync(
      path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
      `\n| # | Item | Lane | Acceptance |\n|---|---|---|---|\n${r.line}\n`,
    );
    mapFixtureId(dir, r.id);
  }
  buildBoard(dir);
  const wrong = recoverable
    .map((r) => ({ ...r, got: resolvedLane(dir, r.id) }))
    .filter((r) => r.got !== r.expect);
  check(
    `all ${recoverable.length} real escaped-pipe rows recover their declared lane`,
    recoverable.length === 11 && wrong.length === 0,
    `count=${recoverable.length}\n` +
      wrong.map((r) => `${r.id} (backlog line ${r.sourceLine}) want ${r.expect} got ${JSON.stringify(r.got ?? null)}`).join("\n"),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 30. THE ACCEPTANCE SHIFTS IN THE SAME ROWS, and it is the half that
 *     decides whether an item is claimable or `blocked on Anand`. A splitter
 *     repaired only far enough to recover cell 2 would leave this wrong and
 *     case 28 would still pass, so this asserts the LAST cell rather than the
 *     lane.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addBacklogItemInLane(
    dir,
    "T-971",
    "**Two escaped pipes, so the acceptance lands two cells early.** See `a \\| b \\| c`.",
    "T",
    "Write the behavioral test and record the mutation count.",
  );
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-971");
  check(
    "the acceptance cell survives an escaped pipe earlier in the row",
    (item?.acceptance ?? "").startsWith("Write the behavioral test"),
    `acceptance=${JSON.stringify((item?.acceptance ?? "").slice(0, 90))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 31. A BARE PIPE INSIDE A CODE SPAN IS STILL A DELIMITER, and the row is
 *     REPORTED rather than recovered.
 *
 *     This is the case that makes the T-738 verdict falsifiable. GFM says an
 *     escaped pipe is content anywhere and a BARE pipe delimits even inside a
 *     code span — so GitHub renders these two rows shifted as well. Teaching
 *     the parser to skip code spans, which is what T-738 was filed asking
 *     for, would make this board disagree with the document a human reads.
 *     The rows are malformed at SOURCE; the fix belongs in the backlog, and
 *     what the generator owes is to NAME them.
 * ------------------------------------------------------------------------ */
{
  const malformed = frozenRows().filter((r) => r.expect === "MALFORMED");
  const dir = freshFixture();
  for (const r of malformed) {
    fs.appendFileSync(
      path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
      `\n| # | Item | Lane | Acceptance |\n|---|---|---|---|\n${r.line}\n`,
    );
    mapFixtureId(dir, r.id);
  }
  const r = buildBoard(dir);
  const reported = r.stdout.split("\n").find((l) => l.includes("bare pipe in a code span")) ?? "";
  check(
    "a bare pipe inside a code span still delimits, and the row is reported by name",
    malformed.length === 2 &&
      malformed.every((m) => reported.includes(m.id)) &&
      malformed.every((m) => !KNOWN_LANE_LETTERS.has(resolvedLane(dir, m.id))),
    `reported=${JSON.stringify(reported)}\n` +
      malformed.map((m) => `${m.id} lane=${JSON.stringify(resolvedLane(dir, m.id) ?? null)}`).join("\n"),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 32. THE GUARDRAIL ON THE FIX ITSELF. A backslash that is itself escaped
 *     does not escape the pipe after it: `\\|` is a literal backslash and
 *     then a REAL delimiter. A splitter written as a blanket
 *     `replace(/\\\|/g, …)` gets this wrong and nothing else here would say
 *     so. Passes on unfixed code by design — it exists to stop the repair
 *     from over-reaching, exactly as case 25 does.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n| # | Item | Lane | Acceptance |\n|---|---|---|---|\n"
      + "| T-972 | **A row ending in an escaped backslash.** The path is `C:` and then \\\\| T | The delimiter after it is a delimiter. |\n",
  );
  mapFixtureId(dir, "T-972");
  buildBoard(dir);
  const item = summaryItems(dir).out.get("T-972");
  check(
    "an escaped backslash does not escape the delimiter that follows it",
    item?.lane === "T",
    `lane=${JSON.stringify(item?.lane ?? null)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


/* ------------------------------------------------------------------------ *
 * 33. THE UNBALANCED-BACKTICK VERDICT, which T-738's acceptance asks to be
 *     decided explicitly rather than left to fall out.
 *
 *     VERDICT: an odd number of backticks means there is no code span to be
 *     inside of, so the row is split by the ordinary rule — escapes are
 *     content, bare pipes delimit — and it is NOT named as a
 *     bare-pipe-in-a-code-span row. Guessing where the author meant the span
 *     to close would be inventing content.
 *
 *     The live backlog contains ZERO unbalanced rows, measured over every
 *     id-bearing row, so this branch has no data to hold it and a fixture is
 *     the only thing that can. Without this case the `ticks % 2` guard is
 *     unfalsifiable: deleting it leaves every other case here green.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n| # | Item | Lane | Acceptance |\n|---|---|---|---|\n"
      + "| T-973 | **A row with three backticks.** `a|b` and then a stray ` opens a span that never closes. | T | Not named as a shifted row. |\n",
  );
  mapFixtureId(dir, "T-973");
  const r = buildBoard(dir);
  const reported = r.stdout.split("\n").find((l) => l.includes("bare pipe in a code span")) ?? "";
  check(
    "an unbalanced backtick span splits by the ordinary rule and is not named as a shifted row",
    !reported.includes("T-973") && (resolvedLane(dir, "T-973") ?? "").startsWith("b`"),
    `lane=${JSON.stringify(resolvedLane(dir, "T-973") ?? null)}\nreported=${JSON.stringify(reported)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


/* ------------------------------------------------------------------------ *
 * 34. THE SECOND CALL SITE. `splitTableRow` has two users — the backlog's
 *     item tables and `tablesUnderHeading`, which reads the BOARD's
 *     `Vision to acceptance` table. Cases 28-33 exercise only the first: a
 *     mutation that reverted just this one to split-on-every-pipe left the
 *     whole suite green, so the call site was being changed on faith.
 *
 *     Here an escaped pipe sits in the `Current evidence` cell and the
 *     assertion is on `Next acceptance gate`, which follows it — the cell a
 *     stage publishes as its next gate. The live board carries no escaped
 *     pipe today, so this is a guard on a reachable path rather than a
 *     repair of live data, and it is written as a fixture for that reason.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  fs.writeFileSync(
    path.join(dir, "SOURCE_EXECUTION_BOARD_20260917.md"),
    "# Synthetic execution board\n\n## Vision to acceptance\n\n"
      + "| Outcome the user should experience | Backlog IDs | Current evidence | Next acceptance gate | Owner lane |\n"
      + "|---|---|---|---|---|\n"
      + "| Source New is a simple five-phase journey | E1 | Matched with `a \\| b` and nothing else. | Persist the accepted motion before labels. | Claude Code |\n",
  );
  const rr = buildBoard(dir);
  // `nextGate` is rendered, not serialised into the summary, so the assertion
  // is on the board the generator actually writes.
  const html = fs.readFileSync(path.join(dir, "source-board.html"), "utf8");
  // Assert the DESTINATION, not merely that the text is somewhere on the page.
  // Split on every pipe and this same sentence still appears — one field to
  // the left, rendered as the stage's Owner — so "the board contains it" is
  // satisfied by the defect. The tail of the shifted cell is checked with its
  // backticks removed, because `stripMd` has already taken them off by the
  // time it reaches the page.
  const gateRendered = html.includes("<ul><li>Persist the accepted motion before labels.</li></ul>");
  const shiftedTail = html.includes("b and nothing else.");
  check(
    "an escaped pipe in a board outcome row does not shift the next-gate cell",
    rr.stdout.includes("board outcomes parsed:    1") && gateRendered && !shiftedTail,
    `gate rendered as the next action=${gateRendered}; shifted tail present=${shiftedTail}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


/* ------------------------------------------------------------------------ *
 * 35-39. THE ID COLUMN IS A HEADER NAME, NOT A LITERAL SYMBOL — item T-746.
 *
 *     `backlogTableItems` required `cells[0] === "#"` to recognise a table's
 *     header. The register's item tables are not all headed that way: the
 *     live backlog also uses `| Id | Finding | Lane | What it needs |`,
 *     `| Id | Finding | Lane | Status |`, `| Item | What | Lane | Acceptance |`
 *     and `| Id | What is wrong | Lane | Acceptance |`, and every row under
 *     one of those was dropped before any census counted it. This is item
 *     T-737's lesson one column to the left: that item taught the reader to
 *     take the LANE from the column its header names, and the ID column was
 *     still matched by a symbol.
 *
 *     Measured on `origin/main` `aa0eecff9` against the live operator
 *     documents: an independent scan of ids in item position finds 474 and the
 *     reader produced 444, a strict subset with zero extras, so 30 were dropped
 *     with no report of any kind. 26 of those have a table row in one of the
 *     shapes above; the other 4 are a heading shape, which is a separate item.
 *     (441, quoted in an earlier draft, was the board's PLACED population —
 *     parsed minus the 3 it could not place, and those 3 were already named.)
 *
 *     A dropped id is not merely missing from a report. It is absent from the
 *     board's population, absent from the queue's pool, and absent from the
 *     drop row T-745 added, so no bucket of `EXECUTION_QUEUE.md` can offer it
 *     to anyone: `T-743` and `T-744` were open, unclaimed, lane-T work while
 *     three runs in a row recorded "my lane has ZERO claimable rows".
 *
 *     Cases 35-37 are the shapes. Case 38 is the protection that the old
 *     `cells[0] === "#"` test was carrying and must not lose. Case 39 is the
 *     residual: a shape this reader STILL cannot parse has to be named rather
 *     than silently dropped, which is the whole defect one level up.
 * ------------------------------------------------------------------------ */

/**
 * A table in an arbitrary header shape, under its own section heading.
 *
 * The heading is load-bearing, not decoration. The board's header persists
 * across interrupting prose and resets only at a heading, so a shaped table
 * appended directly after the fixture's own `# | Item | Lane | Acceptance`
 * table inherits THAT header: the row parses, carrying cells read against the
 * wrong columns, and a case asserting only "the id is on the board" passes
 * before anything is fixed. Under its own heading the header is genuinely
 * unrecognised, which is the state this item is about.
 *
 * No cell may carry a pipe inside a code span either — item T-738 splits such
 * a row at that pipe and shifts every cell right, so the fixture would be
 * testing that defect instead of this one. The first draft of these cases did
 * exactly that and reported a lane of "Finding` row.**".
 */
function addShapedRow(dir, header, cells, { map = true } = {}) {
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n## Synthetic shape section for ${cells[0]}\n\n`
      + `| ${header.join(" | ")} |\n|${header.map(() => "---").join("|")}|\n| ${cells.join(" | ")} |\n`,
  );
  if (map) mapFixtureId(dir, cells[0]);
}

for (const [header, cells, lane, label] of [
  [
    ["Id", "Finding", "Lane", "What it needs"],
    ["T-941", "**An Id-and-Finding row.**", "T", "Parsed as an item, in lane T."],
    "T",
    "`| Id | Finding | Lane | What it needs |`",
  ],
  [
    ["Item", "What", "Lane", "Acceptance"],
    ["T-942", "**An Item-and-What row.**", "U", "Parsed as an item, in lane U."],
    "U",
    "`| Item | What | Lane | Acceptance |`",
  ],
  [
    ["Id", "What is wrong", "Lane", "Acceptance"],
    ["T-943", "**An Id-and-What-is-wrong row.**", "C", "Parsed as an item, in lane C."],
    "C",
    "`| Id | What is wrong | Lane | Acceptance |`",
  ],
]) {
  const dir = freshFixture();
  addShapedRow(dir, header, cells);
  const r = buildBoard(dir);
  const { out } = summaryItems(dir);
  // The assertion is on the DESTINATION: the id has to reach the board's
  // population carrying the lane its own header column declares. "The id
  // appears somewhere" would be satisfied by the unmapped-drop list.
  check(
    `a row headed ${label} reaches the board as an item, with the lane its header names`,
    r.status === 0 && out.has(cells[0]) && resolvedLane(dir, cells[0]) === lane,
    `exit=${r.status}; on the board=${out.has(cells[0])}; ` +
      `lane=${JSON.stringify(resolvedLane(dir, cells[0]) ?? null)} expected ${lane}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 38. THE PROTECTION THE OLD GUARD WAS CARRYING.
 *
 *     `# | Mutation | Failing cases` is numbered 1..n and is not a backlog
 *     table. Read as items it collided with #1-#4, four of the oldest and
 *     most-cited ids on the board, suppressed them as ambiguous and dropped
 *     three lifecycle stages with no work undone. Widening the ID column must
 *     not widen the KINDS: the guard becomes a whitelist of conventions, and
 *     this case is what tells the two apart.
 *
 *     Asserted through the unmapped gate rather than through the summary
 *     alone. An id that leaks in here is not in the fixture's structure map,
 *     so the board exits 1 and names it — a second, independent signal that
 *     does not depend on this suite reading the summary the same way the
 *     generator wrote it.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n| # | Mutation | Failing cases |\n|---|---|---|\n"
      + "| 1 | `>=` to `>` in the reach bound | 2 |\n"
      + "| 2 | drop the veto entirely | 4 |\n"
      + "| 3 | return the first match, not the last | 1 |\n",
  );
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { out } = summaryItems(dir);
  const leaked = ["1", "2", "3"].filter((n) => out.has(n));
  check(
    "a `# | Mutation | Failing cases` table is still not read as items 1, 2 and 3",
    r.status === 0 && leaked.length === 0 && !r.stderr.includes("unmapped"),
    `exit=${r.status}; leaked=${JSON.stringify(leaked)}\nstderr=${r.stderr.trim()}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 39. THE RESIDUAL. A SHAPE IT CANNOT PARSE MUST BE NAMED.
 *
 *     Fixing the shapes we already know about is the smaller half. The defect
 *     that let 33 ids vanish is that an id the extractor never produces
 *     cannot appear in ANY of the board's own reports — not in its
 *     population, and not in the `unmapped` drop list either, because that
 *     list is computed from the ids it did produce. `not placed on the map: 0`
 *     was vacuously true over exactly the ids that were not missing.
 *
 *     So the board scans for ids in item position INDEPENDENTLY of the
 *     extractor and reports the difference. `## Item T-981 — …` with no table
 *     under it is such a shape today: it is item T-740's half of this defect,
 *     deliberately not fixed here, and this case pins that it is at least
 *     VISIBLE. When someone parses that shape, this case fails loudly and its
 *     replacement is a fixture in whatever shape is then unreadable.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n## Item T-981 — filed by a heading with no table under it\n\n"
      + "| Lane | Priority | Status | PR |\n|---|---|---|---|\n| T | P1 | open | none |\n",
  );
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { summary, out } = summaryItems(dir);
  const residual = summary.unparsedItemIds;
  check(
    "an id in item position that no shape parses is NAMED as a residual, not silently dropped",
    Array.isArray(residual) && residual.map(String).includes("T-981") && !out.has("T-981"),
    `residual=${JSON.stringify(residual ?? null)}; parsed as an item=${out.has("T-981")}\n` +
      `exit=${r.status}`,
  );
  check(
    "and the board says so on its own stdout, where the operator reads it",
    /in item position/i.test(r.stdout) && r.stdout.includes("T-981"),
    `stdout tail=${r.stdout.split("\n").slice(-12).join("\n")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 40. THE TWO POPULATIONS AGREE — the assertion T-746 asks for by name.
 *
 *     "Prove it by scanning the backlog independently of the extractor and
 *     asserting the two populations agree, not by adding fixtures in the
 *     shapes you already thought of." A fixture carrying one row of every
 *     shape the live backlog uses, plus one shape nothing parses, and the
 *     claim is arithmetic rather than a list: EVERY id discovered in item
 *     position is either on the board or named in the residual. Nothing may
 *     fall between the two.
 *
 *     The non-item tables are in the same fixture on purpose. If the census
 *     counted them, the residual would name ids that are not items and this
 *     case would pass while the generator was wrong in the other direction.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addShapedRow(dir, ["Id", "Finding", "Lane", "Status"], ["T-951", "**Shape A.**", "T", "open"]);
  addShapedRow(dir, ["Item", "What", "Lane", "Outcome"], ["T-952", "**Shape B.**", "T", "open"]);
  addShapedRow(dir, ["#", "Verdict", "Proof"], ["T-953", "closed", "PR #1 merged"]);
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    "\n| # | Mutation | Failing cases |\n|---|---|---|\n| 1 | a mutation, not an item | 2 |\n"
      + "\n| id | stamp picks | append order picks |\n|---|---|---|\n| T-951 | a report row | a report row |\n"
      + "\n## Item T-982 — a heading shape nothing parses\n\nProse only.\n",
  );
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { summary, out } = summaryItems(dir);
  const discovered = (summary.itemPositionIds ?? []).map(String);
  const residual = (summary.unparsedItemIds ?? []).map(String);
  const unaccounted = discovered.filter((id) => !out.has(id) && !residual.includes(id));
  check(
    "every id discovered in item position is either on the board or named in the residual",
    discovered.length > 0 && unaccounted.length === 0
      && ["T-951", "T-952", "T-953"].every((id) => discovered.includes(id) && out.has(id))
      && residual.includes("T-982") && !discovered.includes("1"),
    `exit=${r.status}\ndiscovered=${JSON.stringify(discovered)}\n` +
      `residual=${JSON.stringify(residual)}\nunaccounted=${JSON.stringify(unaccounted)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}


/* ------------------------------------------------------------------------ *
 * HELPERS for item T-750 — a verdict written under `##`.
 * ------------------------------------------------------------------------ */

/** A `## <heading>` section carrying one `# | Item | Lane | Acceptance` row. */
function addSectionedItem(dir, heading, id, body, lane, acceptance) {
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n## ${heading}\n\n| # | Item | Lane | Acceptance |\n|---|---|---|---|\n`
      + `| ${id} | ${body} | ${lane} | ${acceptance} |\n`,
  );
}

/** A verdict note written as a heading of the caller's chosen depth. */
function addVerdictHeading(dir, depth, headingText, prose) {
  fs.appendFileSync(
    path.join(dir, "EXECUTION_BACKLOG_20260918.md"),
    `\n${"#".repeat(depth)} ${headingText}\n\n${prose}\n`,
  );
}

/** Place one id on the map pinned to a section, without disturbing the rest. */
function mapPinnedFixtureId(dir, id, definedIn, where) {
  const file = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = where === "outsideLifecycle" ? map.outsideLifecycle : map.platformTrack;
  list.items.push({ num: id, definedIn });
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
}

/**
 * EVERY summary entry for one id, not the last one written.
 *
 * `summaryItems` keys by id, so two pinned definitions of one number collapse
 * to whichever the walk reached second — which is precisely the pair these
 * cases are about.
 */
function allSummaryEntriesFor(dir, id) {
  const summary = JSON.parse(
    fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"),
  );
  const hits = [];
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== "object") return;
    if (String(o.num) === id && o.rung !== undefined) hits.push(o);
    for (const k of Object.keys(o)) walk(o[k]);
  };
  walk(summary);
  return hits;
}

/* ------------------------------------------------------------------------ *
 * 23. THE DEFECT (item T-750). A verdict note under `##` reaches nothing.
 *
 *     `backlogProseItems` requires `^### Item <id>`, and this backlog writes
 *     its verdicts under `##` — 62 of them on the live document. Most also
 *     carry a table row for their own id inside the note, so the verdict
 *     lands anyway and the gap is invisible; where the note is prose only,
 *     the verdict reaches no corpus and the item stays at rung 0.
 *
 *     `unparsedItemIds` cannot report it either: that list is a set
 *     difference over IDS, and this id is produced by its own table row, so
 *     the residual is empty while the verdict is lost. Case 22's arithmetic
 *     passes over exactly this case — which is the same shape as the gate
 *     that proved a control existed by finding its name in the file.
 *
 *     Measured on the live backlog at 2026-09-24T03:45Z: five ids carry a
 *     `##` verdict heading and read rung 0, `T-458` among them — the ONLY
 *     non-data-plane row the claimable queue offered, already marked closed
 *     by a run at 07:14Z the same day.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addSectionedItem(
    dir,
    "T-750 fixture — the item as originally filed",
    "T-960",
    "**A control that does not run.**",
    "T",
    "A behavioral test drives the real handler.",
  );
  mapFixtureId(dir, "T-960");
  addVerdictHeading(
    dir,
    2,
    "Item T-960 — CLOSED 2026-09-24 (fixture). The item was right and the fix shipped.",
    "Prose only: no table row, no `###` subsection. This is the shape the live backlog uses.",
  );
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { out } = summaryItems(dir);
  const item = out.get("T-960");
  check(
    "a verdict written under `## Item <id>` closes the item it names",
    item !== undefined && item.rungLabel === "Closed",
    `exit=${r.status}\nrungLabel=${JSON.stringify(item?.rungLabel)} rung=${JSON.stringify(item?.rung)}\n`
      + "Closed and Open are BOTH rung 0 — the label is the only field that tells them apart, "
      + "and `build-execution-queue.mjs` filters on exactly that (`rungLabel !== \"Closed\"`).",
  );
  const summary = JSON.parse(
    fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"),
  );
  check(
    "and the board reports it as Closed rather than merely off rung 0",
    (summary.allItemsByRung ?? {}).Closed >= 1,
    `allItemsByRung=${JSON.stringify(summary.allItemsByRung)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 24. The lane suffix is the only thing that tells two items apart.
 *
 *     `buildItem` lets an update note through EVERY `definedIn` pin
 *     (`... || isUpdateNote(d)`), which is right for a number with one item
 *     and wrong for a collision: on the live board `T-458` is two different
 *     items in two lanes, and the operator disambiguates by writing
 *     `T-458(D)`. Attributing that verdict to both would close a lane-U item
 *     that is explicitly still open on a held decision.
 *
 *     So the suffix must SCOPE the verdict, not merely survive parsing.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addSectionedItem(
    dir,
    "T-750 fixture D-lane origin",
    "T-961",
    "**The data-plane half.**",
    "D",
    "Write the register line.",
  );
  addSectionedItem(
    dir,
    "T-750 fixture U-lane origin",
    "T-961",
    "**The surface half, on a held decision.**",
    "U",
    "Decide first, do not code first.",
  );
  mapPinnedFixtureId(dir, "T-961", "T-750 fixture D-lane origin", "platformTrack");
  mapPinnedFixtureId(dir, "T-961", "T-750 fixture U-lane origin", "outsideLifecycle");
  addVerdictHeading(
    dir,
    2,
    "Item T-961(D) — CLOSED 2026-09-24 (fixture). The register lines were written two days ago.",
    "Prose only. This verdict speaks for the D-lane half and for nothing else.",
  );
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const entries = allSummaryEntriesFor(dir, "T-961");
  const dLane = entries.find((e) => e.lane === "D");
  const uLane = entries.find((e) => e.lane === "U");
  const shown = JSON.stringify(entries.map((e) => ({ lane: e.lane, rungLabel: e.rungLabel })));
  check(
    "a `(D)`-suffixed verdict closes the D-lane definition",
    dLane !== undefined && dLane.rungLabel === "Closed",
    `exit=${r.status}\nentries=${shown}`,
  );
  check(
    "and leaves the U-lane definition of the same number open",
    uLane !== undefined && uLane.rungLabel === "Open",
    `entries=${shown}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 25. A lane suffix no definition answers to fails CLOSED, and is NAMED.
 *
 *     The fail-open reading — "the lane does not match, so attribute it
 *     anyway" — would close an item on a verdict written about a different
 *     one. The fail-closed reading alone is not enough either: it is silence,
 *     which is the defect in case 23. So the verdict is withheld AND the
 *     board says whose it could not be.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addSectionedItem(
    dir,
    "T-750 fixture — a lane-U item only",
    "T-962",
    "**One definition, lane U.**",
    "U",
    "Decide first.",
  );
  mapFixtureId(dir, "T-962");
  addVerdictHeading(
    dir,
    2,
    "Item T-962(D) — CLOSED 2026-09-24 (fixture). A suffix naming a lane this id does not have.",
    "Prose only.",
  );
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { summary, out } = summaryItems(dir);
  check(
    "a verdict whose lane suffix matches no definition does NOT close the item",
    out.get("T-962")?.rungLabel === "Open",
    `exit=${r.status}\nrungLabel=${JSON.stringify(out.get("T-962")?.rungLabel)}`,
  );
  const unattributed = (summary.laneScopedVerdictsUnattributed ?? []).map((v) => `${v.num}(${v.laneScope})`);
  check(
    "and the board names the withheld verdict instead of dropping it in silence",
    unattributed.includes("T-962(D)"),
    `laneScopedVerdictsUnattributed=${JSON.stringify(summary.laneScopedVerdictsUnattributed)}`,
  );
  check(
    "and says so on its own stdout, where the operator reads it",
    /T-962\(D\)/.test(r.stdout),
    `stdout tail:\n${r.stdout.split("\n").slice(-25).join("\n")}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ *
 * 26. THE GUARD. Widening the heading depth must not widen what counts as a
 *     DEFINITION.
 *
 *     The live backlog carries 348 `## Item` headings against 128 `###`.
 *     Reading every one as a substantive definition would invent a second
 *     definition for hundreds of ids, suppress them all as ambiguous, and
 *     take the lifecycle stages down with them — the `# | Mutation` failure
 *     of case 21 reached from the heading side. Only a verdict-shaped title
 *     may be read, and a note is never substantive.
 * ------------------------------------------------------------------------ */
{
  const dir = freshFixture();
  addSectionedItem(
    dir,
    "T-750 fixture — the guard",
    "T-963",
    "**One definition only.**",
    "T",
    "Stay unambiguous.",
  );
  mapFixtureId(dir, "T-963");
  // A heading about the item that states no verdict: commentary, not status.
  addVerdictHeading(
    dir,
    2,
    "Item T-963 — notes on the approach, and why the obvious fix is wrong",
    "Prose only. Nothing here is a verdict.",
  );
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { summary, out } = summaryItems(dir);
  check(
    "a `##` heading that states no verdict does not become a second definition",
    !(summary.duplicateNums ?? []).some((d) => String(d.num) === "T-963")
      && out.get("T-963")?.ambiguous === false,
    `exit=${r.status}\nduplicateNums=${JSON.stringify((summary.duplicateNums ?? []).map((d) => d.num))}\n`
      + `ambiguous=${JSON.stringify(out.get("T-963")?.ambiguous)}`,
  );
  check(
    "and it leaves the item at the rung its own text earns",
    out.get("T-963")?.rungLabel === "Open",
    `rungLabel=${JSON.stringify(out.get("T-963")?.rungLabel)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* --------------------------------------------------------------- item T-752
 *  An id a STAGE CAPABILITY is the only place that cites it reaches no item,
 *  and the `unmapped` report is the reason nobody could see that.
 *
 *  Two walks of the same map disagreed. `mappedNums` counts a capability
 *  citation as placement — "an id cited only by a capability is placed, not
 *  orphaned" — so such an id is deliberately kept OUT of `unmapped`. But
 *  `stageItems` is built from `map.stages[].items` alone, so the id is built
 *  into no item either. It is in no bucket of `EXECUTION_QUEUE.md`, claimable
 *  or blocked, and in no residual this generator prints. Cross-cutting
 *  capabilities escaped it only because `crossCuttingTrack` is built FROM the
 *  capability lists.
 *
 *  Measured on the live map and backlog at 2026-09-24T06:10Z: of 63 ids under
 *  a stage capability, exactly two are declared nowhere else — `T-429`
 *  (lane C) and `T-445` (lane U), both substantive filings with full
 *  acceptances, in the two lanes the queue reported as having ZERO claimable
 *  rows that same run. `T-429`'s absence was WRITTEN DOWN on 21 Sep — "265
 *  item rows and T-429 is not one of them ... survives only as a capability
 *  reference under /stages[5]/capabilities[3]" — and stayed because the
 *  observation was prose. These cases are the executable form of it.
 *
 *  The live corpus is deliberately NOT asserted here. A case that reads the
 *  operator's documents is red whenever they improve and skipped wherever CI
 *  has no copy of them; the generator carries the standing check instead, over
 *  whatever documents it is given, and reports `placedButUnbuilt` on every run
 *  including at zero.
 * ------------------------------------------------------------------------ */

/** Cite an id from a stage capability, and from nowhere else in the map. */
function citeFromStageCapabilityOnly(dir, id, capability = "Synthetic capability") {
  const file = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  if (JSON.stringify(map).includes(`"${id}"`)) {
    throw new Error(`fixture id ${id} is already placed somewhere in the map`);
  }
  const stage = map.stages[0];
  (stage.capabilities ??= []).push({ capability, items: [id] });
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
}

{
  const dir = freshFixture();
  addBacklogItem(dir, "T-951", "**Cited by a capability and nowhere else.**", "Be reachable.");
  // `addBacklogItem` placed it on the platform track. Undo that: the whole
  // point is an id whose ONLY placement is a stage capability.
  {
    const file = path.join(dir, "source-stage-map.json");
    const map = JSON.parse(fs.readFileSync(file, "utf8"));
    map.platformTrack.items = map.platformTrack.items.filter((r) => r !== "T-951");
    fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
  }
  citeFromStageCapabilityOnly(dir, "T-951");
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { summary, out } = summaryItems(dir);
  check(
    "an id cited only by a stage capability is built into an item",
    out.has("T-951"),
    `exit=${r.status}\nstderr=${r.stderr}\nitem ids=${JSON.stringify([...out.keys()].slice(0, 40))}`,
  );
  check(
    "and it is not reported as unmapped, because the map does place it",
    !(summary.unmapped ?? []).map(String).includes("T-951"),
    `unmapped=${JSON.stringify(summary.unmapped)}`,
  );
  check(
    "and it carries the acceptance its own filing states, not an empty row",
    (out.get("T-951")?.acceptance ?? "").includes("Be reachable"),
    `acceptance=${JSON.stringify(out.get("T-951")?.acceptance)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * The guardrail against the naive fix. A capability normally cites an id its
   * own stage already lists — 61 of the 63 live ones do — and concatenating
   * the two lists without dedup would file that id twice on one stage, which
   * the queue would render as two rows for one piece of work. This case is
   * GREEN before the change and must stay green after it; a fix that turns it
   * red has traded one defect for a louder one.
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-952", "**Cited by its own stage and by its capability.**", "Appear once.");
  const file = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  map.platformTrack.items = map.platformTrack.items.filter((r) => r !== "T-952");
  map.stages[0].items = [...(map.stages[0].items ?? []), "T-952"];
  (map.stages[0].capabilities ??= []).push({ capability: "Also cites it", items: ["T-952"] });
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const summary = JSON.parse(fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"));
  const occurrences = (summary.stages ?? [])
    .flatMap((s) => s.items ?? [])
    .filter((i) => String(i.num) === "T-952").length;
  check(
    "an id its stage lists AND its capability cites is filed once, not twice",
    r.status === 0 && occurrences === 1,
    `exit=${r.status}\noccurrences=${occurrences}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * The exclusion, and it has to be stated or the standing check is unusable:
   * a map may place an id the backlog does not define yet. That builds no item
   * and is NOT this defect — `buildItem` returning null for a missing
   * definition is the documented behaviour. Only a PLACED AND DEFINED id that
   * reaches no item is a fault.
   */
  const dir = freshFixture();
  citeFromStageCapabilityOnly(dir, "T-953", "Cites an id nothing defines");
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { summary, out } = summaryItems(dir);
  check(
    "a placed id the backlog does not define builds nothing and does not fail the run",
    r.status === 0 && !out.has("T-953"),
    `exit=${r.status}\nstderr=${r.stderr}`,
  );
  check(
    "and it is not reported as placed-but-unbuilt, which is about DEFINED items",
    Array.isArray(summary.placedButUnbuilt) && !summary.placedButUnbuilt.map(String).includes("T-953"),
    `placedButUnbuilt=${JSON.stringify(summary.placedButUnbuilt)}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * The standing check itself, written at zero. A missing field is not a zero
   * — the rule item T-746 set for the residual — so the generator writes
   * `placedButUnbuilt` on every run, and a reader can tell "none" from "this
   * generator does not look".
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-954", "**Ordinary mapped item.**", "Be built.");
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const summary = JSON.parse(fs.readFileSync(path.join(dir, "source-board-summary.json"), "utf8"));
  check(
    "`placedButUnbuilt` is written on every run, including when it is empty",
    r.status === 0
      && Object.prototype.hasOwnProperty.call(summary, "placedButUnbuilt")
      && Array.isArray(summary.placedButUnbuilt)
      && summary.placedButUnbuilt.length === 0,
    `exit=${r.status}\nplacedButUnbuilt=${JSON.stringify(summary.placedButUnbuilt)}`,
  );
  check(
    "and stdout says so in words, so a run that is read rather than parsed still reports it",
    /placed but built into no item:\s+0\b/.test(r.stdout),
    `stdout tail=${JSON.stringify(r.stdout.split("\n").slice(-12).join("\n"))}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

{
  /*
   * The cross-cutting half, which already worked and must keep working. It is
   * here because it is the negative control for the whole item: if this case
   * had ever been red, the defect would have been noticed years of runs ago.
   */
  const dir = freshFixture();
  addBacklogItem(dir, "T-955", "**Cited by a cross-cutting capability.**", "Still reachable.");
  const file = path.join(dir, "source-stage-map.json");
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  map.platformTrack.items = map.platformTrack.items.filter((r) => r !== "T-955");
  (map.crossCutting.capabilities ??= []).push({ capability: "Cross-cutting", items: ["T-955"] });
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
  const r = run(dir, "build-source-board.mjs", ["--json"]);
  const { out } = summaryItems(dir);
  check(
    "a cross-cutting capability citation still builds an item",
    out.has("T-955"),
    `exit=${r.status}\nstderr=${r.stderr}`,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
