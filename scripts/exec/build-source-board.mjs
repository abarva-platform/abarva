#!/usr/bin/env node
/**
 * Generate the nine-stage lifecycle page from the board, backlog and execution claims.
 *
 * The page is a VIEW. It holds no status of its own. Every rung, owner, blocker
 * and next action on it is a phrase lifted from one of the source documents,
 * and each is printed next to the rule that matched it so a reader can check
 * the derivation rather than trust it.
 *
 * What this deliberately does NOT do:
 *   - infer acceptance from a PR number or a deploy line. "Deployed" is
 *     reported only because a source document says deployed; it is never
 *     upgraded to proven.
 *   - carry a hand-maintained status cell. source-stage-map.json declares
 *     structure only, and this script refuses to run if a status-looking key
 *     appears in it.
 *   - hide drift. Unmapped items, duplicate item ids and stages with no
 *     mapped work are all reported, on the page and on stdout.
 *
 * Usage: node scripts/exec/build-source-board.mjs [--operator-root DIR]
 *        [--map FILE] [--out source-board.html] [--json]
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { isDirectInvocation } from "./cli-entry.mjs";

/**
 * Everything below is the CLI, and until item T-728 it ran on `import` (item
 * T-723 gave the shared guard to four modules in this directory and never
 * looked at the two generators). The unknown case answers "imported", which is
 * the inversion `cli-entry.mjs` documents: refusing to run costs one rerun,
 * whereas answering "run" on an unknown case makes every importer execute a
 * generator over whatever documents it happens to be pointed at.
 *
 * **The body keeps its module indentation on purpose.** Re-indenting roughly
 * 1,900 lines would have made this a whole-file rewrite, and this file's bytes
 * are read as data, not only as code: the summary this generator writes is
 * stamped with the sha256 of its OWN bytes (`SELF_PATH`, below), and
 * `assertSummaryProvenance` in `build-execution-queue.mjs` refuses any summary
 * whose stamp does not equal the hash of the `build-source-board.mjs` sitting
 * beside it. So editing this file invalidates every existing summary until the
 * board is re-run -- which is the control working, not a regression. Left at
 * column zero, the diff is the four lines of the guard, so a reviewer can see
 * the body is unchanged and the moved digest is fully attributable to them.
 */
function runCli() {

const SCRIPT_ROOT = path.dirname(fileURLToPath(import.meta.url));

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const OPERATOR_ROOT = path.resolve(
  valueAfter("--operator-root") ?? process.env.SOURCE_EXECUTION_HOME ?? process.cwd(),
);
const MAP_PATH = path.resolve(
  valueAfter("--map") ?? path.join(SCRIPT_ROOT, "source-stage-map.json"),
);

const outValue = valueAfter("--out") ?? "source-board.html";
const OUT = path.resolve(OPERATOR_ROOT, outValue);

/* ------------------------------------------------------------------ input */

function readOrDie(file) {
  const full = path.join(OPERATOR_ROOT, file);
  if (!fs.existsSync(full)) {
    console.error(`Source document missing: ${file}`);
    process.exit(1);
  }
  return fs.readFileSync(full, "utf8");
}

const mapText = fs.readFileSync(MAP_PATH, "utf8");
const map = JSON.parse(mapText);

// The map declares structure. A status word in it means someone started
// maintaining state in the view again, which is the thing this replaces.
const FORBIDDEN_MAP_KEYS = /^(status|rung|state|evidence|proof|deployed|merged|blocker|owner)$/i;
(function assertMapHoldsNoStatus(node, trail = "map") {
  if (Array.isArray(node)) return node.forEach((n, i) => assertMapHoldsNoStatus(n, `${trail}[${i}]`));
  if (!node || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    if (FORBIDDEN_MAP_KEYS.test(k)) {
      console.error(
        `source-stage-map.json holds a status key at ${trail}.${k}. The map declares structure only; status is read from the source documents.`,
      );
      process.exit(1);
    }
    assertMapHoldsNoStatus(v, `${trail}.${k}`);
  }
})(map);

const boardText = readOrDie(map.sources.board);
const backlogText = readOrDie(map.sources.backlog);
const claimsText = readOrDie(map.sources.claims);

/*
 * Provenance stamp for source-board-summary.json.
 *
 * The queue reads the summary and, before this, could not tell a current one
 * from one written before the backlog last changed. Regenerating the board
 * without --json leaves the old summary in place; the queue was then built
 * from it and printed a confident set of counts for a state that no longer
 * existed. A mechanism that is correct only when the operator remembers a
 * flag is not a mechanism.
 *
 * Hashed, not mtimed: a copy, a restore or a clock skew moves an mtime
 * without moving content, and the reverse costs a false refusal that the next
 * agent learns to ignore. The hash is over the exact bytes this run derived
 * the summary from.
 *
 * The claims file is deliberately NOT stamped. The queue re-reads it directly
 * on every run, and the claim protocol requires appending to it before any
 * work starts — so it changes between every board run and the next queue run,
 * by design. Stamping it would refuse within seconds of every claim, and a
 * guard that fires on correct behaviour gets removed by the first person it
 * blocks. map.sources.scope is likewise absent because nothing here parses it.
 */
const summaryInputs = [
  [path.relative(OPERATOR_ROOT, MAP_PATH) || path.basename(MAP_PATH), mapText],
  [map.sources.board, boardText],
  [map.sources.backlog, backlogText],
].map(([file, text]) => ({
  file,
  bytes: Buffer.byteLength(text, "utf8"),
  sha256: crypto.createHash("sha256").update(text, "utf8").digest("hex"),
}));

/*
 * Who derived the summary, not only what from (item T-711).
 *
 * `summaryInputs` above answers WHAT this run read. It cannot answer WHICH
 * generator read it, and that is the half that failed: superseded copies of
 * this file sit in the operator root, they still run, and they have drifted.
 * On 2026-09-22 the live EXECUTION_QUEUE.md that both lanes read to pick work
 * had been produced by one of them. Measured on identical inputs, the copy
 * offered 61 claimable items against this generator's 1, and seven of the rows
 * it offered are recorded CLOSED in the backlog it had just parsed. Nothing in
 * either artifact disagreed with the other, because neither said who wrote it.
 *
 * T-535 answered the same drift with a warning in the README. That is the
 * shape this audit exists to refuse: an instruction an operator has to
 * remember, with nothing that fails when they do not.
 *
 * Hashed over this file's own bytes, for the same reason the inputs are: a
 * copy or a restore moves an mtime without moving content. `ranFrom` is the
 * path this run executed from and is carried for the refusal message only --
 * the queue compares hashes, never paths, because the same file legitimately
 * runs from a worktree, a fixture directory and a CI checkout.
 */
const SELF_PATH = fileURLToPath(import.meta.url);
const summaryGenerator = {
  script: path.basename(SELF_PATH),
  ranFrom: SELF_PATH,
  sha256: crypto
    .createHash("sha256")
    .update(fs.readFileSync(SELF_PATH, "utf8"), "utf8")
    .digest("hex"),
};

/* ---------------------------------------------------------------- parsing */

/**
 * One markdown table row, split into cells the way GitHub splits it — item
 * T-738.
 *
 * The rule is GFM's, not this file's, and the distinction is the whole item.
 * A backslash-escaped pipe is CONTENT anywhere in a row, including inside a
 * code span; a BARE pipe is a cell delimiter, also including inside a code
 * span. Splitting on every pipe read the first as a delimiter, which ended
 * the cell it sat in and shifted every cell after it. Eleven live items
 * carried a `Lane` cell holding a regex fragment or a shell snippet for that
 * reason, and their acceptance — the field that decides claimable versus
 * blocked — was wrong in the same rows and silently so, because a regex in
 * the lane column is visible and a truncated sentence is not.
 *
 * T-738 was filed asking for "pipes that are NOT inside a backtick span", and
 * that is a DIFFERENT rule which this deliberately does not implement. Under
 * it, `C-009` and `T-545` — the two rows carrying a bare pipe inside
 * backticks — would parse here and nowhere else, because GitHub renders those
 * two rows shifted as well. A reader and a writer of one grammar have to
 * round-trip; those rows are malformed at source, the repair belongs in the
 * document, and what this file owes them is to say so by name.
 *
 * Backslashes are counted rather than pattern-replaced: `\\|` is an escaped
 * backslash followed by a REAL delimiter, which a blanket replace of `\|`
 * gets wrong.
 */
function splitTableRow(line) {
  const body = line.slice(1, line.endsWith("|") ? -1 : undefined);
  const cells = [];
  let cur = "";
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === "\\" && i + 1 < body.length && (body[i + 1] === "|" || body[i + 1] === "\\")) {
      // An escaped pipe renders as a pipe; an escaped backslash is kept
      // verbatim so the cell still reads as the markdown it was written as.
      cur += body[i + 1] === "|" ? "|" : "\\\\";
      i += 1;
      continue;
    }
    if (ch === "|") {
      cells.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

/**
 * Whether a row carries a bare pipe inside a balanced code span — the
 * malformed shape above. Escaped pipes are removed first so they cannot be
 * mistaken for the defect, and an UNBALANCED span answers `false`: there is
 * no span to be inside of, the row is malformed in a different way, and
 * guessing at where the author meant the span to end would be inventing
 * content. The live corpus contains no such row, so the branch is held by a
 * fixture rather than by data.
 */
function hasBarePipeInCodeSpan(line) {
  const withoutEscapes = line.split("\\|").join("\u0000").split("\\\\").join("\u0000");
  const ticks = (withoutEscapes.match(/`/g) ?? []).length;
  if (ticks % 2 === 1) return false;
  return (withoutEscapes.match(/`[^`]*`/g) ?? []).some((span) => span.includes("|"));
}

/** Rows of every GitHub-flavoured pipe table under a given `## heading`. */
function tablesUnderHeading(text, headingRe) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  let inSection = false;
  let header = null;
  for (const line of lines) {
    if (/^##\s/.test(line)) {
      inSection = headingRe.test(line);
      header = null;
      continue;
    }
    if (!inSection) continue;
    if (!line.startsWith("|")) {
      header = null;
      continue;
    }
    const cells = splitTableRow(line);
    if (/^-{2,}$/.test(cells[0]?.replace(/\s/g, "") ?? "")) continue;
    if (!header) {
      header = cells;
      continue;
    }
    const row = {};
    header.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    rows.push(row);
  }
  return rows;
}

/**
 * The declared lane of one backlog row, read from the column its own header
 * names — item T-737. Returns `""` when the table has no lane column at all,
 * which is the whole of the `# | Verdict | Proof` convention.
 */
function laneCell(header, cells) {
  const at = (header ?? []).findIndex((h) => (h ?? "").trim().toLowerCase() === "lane");
  if (at < 0) return "";
  return cells[at] ?? "";
}

/**
 * The lane a lane-prefixed id declares about itself. `T-458` says lane `T` by
 * the forward-only identifier rule; a historical bare number says nothing.
 */
function lanePrefixOf(num) {
  const m = String(num ?? "").match(/^([DUCT])-\d{3}$/);
  return m ? m[1] : "";
}

/**
 * The column names a backlog table uses for its ID column — item T-746.
 *
 * `#` was the only one recognised, and it was recognised as a LITERAL: both
 * "is this line a header?" and "which cell holds the id?" were the test
 * `cells[0] === "#"`. The register does not write only that way. Measured on
 * the live backlog at `aa0eecff9`, rows sit under `| Id | Finding | Lane |
 * What it needs |`, `| Id | Finding | Lane | Status |`, `| Item | What | Lane |
 * Acceptance |` and `| Id | What is wrong | Lane | Acceptance |`, and every one
 * of them was dropped before any census counted it — 27 ids whose only table
 * definition was in one of those shapes.
 *
 * This is item T-737 one column to the left: that item taught this reader to
 * take the LANE from the column its header names rather than from position 2,
 * and left the ID matched by a symbol.
 */
const ID_COLUMN_NAMES = new Set(["#", "id", "item"]);

/**
 * The item conventions this reader accepts, keyed by the header cell to the
 * RIGHT of the id column.
 *
 * A whitelist, deliberately, because that is the protection the old
 * `cells[0] === "#"` test was carrying by accident. `# | Mutation | Failing
 * cases` is numbered 1..n and is not a backlog table: read as items it
 * collided with #1-#4, four of the oldest and most-cited ids on the board,
 * suppressed them as ambiguous and dropped three lifecycle stages with no work
 * undone. The live backlog also carries `| id | stamp picks | append order
 * picks |` and `| id | first holder | second holder |`, which are report
 * tables about items rather than definitions of them.
 *
 * So widening the ID column must not widen the KINDS. A kind nobody listed
 * here is not silently dropped either — `unrecognisedItemTableKinds` names the
 * shape, so the next convention someone invents is visible to a human instead
 * of costing another 27 ids.
 */
const ITEM_TABLE_KINDS = new Set([
  "item",
  "verdict",
  "finding",
  "outcome",
  "status",
  "what",
  "what is wrong",
  "merge and run",
]);

/** The kind a header declares, normalised. `Finding, re-verified` is `finding`. */
function itemTableKind(header, at) {
  return stripMd(header?.[at + 1] ?? "").split(",")[0].trim().toLowerCase();
}

/** Which cell of a header row holds the id, or -1 when none does. */
function idColumnIndex(cells) {
  return (cells ?? []).findIndex((c) => ID_COLUMN_NAMES.has(stripMd(c).toLowerCase()));
}

/**
 * Whether this pipe line is a header row rather than a data row.
 *
 * Its first cell is the literal name of an id column, which no data row's
 * first cell can be: a data row opens with an id. The old code tested exactly
 * this for `#` alone, and that test is what let a table re-declare its header
 * mid-section — the live backlog does that, and `T-544` is one of the ids that
 * depends on it being recognised.
 */
function isItemTableHeader(cells) {
  return ID_COLUMN_NAMES.has(stripMd(cells[0] ?? "").toLowerCase());
}

/** Kinds seen under an id column that this reader does not accept as items. */
const unrecognisedItemTableKinds = new Map();

/** Every backlog item row, in any header shape this reader accepts. */
function backlogTableItems(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let section = "(top)";
  let header = null;
  for (const line of lines) {
    const h = line.match(/^##+\s+(.*)$/);
    if (h) { section = h[1].trim(); header = null; continue; }
    if (!line.startsWith("|")) continue;
    const cells = splitTableRow(line);
    if (/^-{2,}$/.test(cells[0]?.replace(/\s/g, "") ?? "")) continue;
    if (isItemTableHeader(cells)) { header = cells; continue; }
    if (!header) continue;
    const at = idColumnIndex(header);
    if (at < 0) continue;
    // A `#` first column is not enough to make a table a backlog table. The
    // log carries exactly two item conventions — `# | Item | Lane | Acceptance`
    // for a definition and `# | Verdict | Proof` for an outcome — and anything
    // else numbered 1..n is prose. A mutation table headed
    // `# | Mutation | Failing cases` was read as four backlog items and
    // collided with #1-#4, four of the oldest and most-cited ids on the board;
    // that suppressed them as ambiguous and dropped three lifecycle stages
    // without any work being undone. Match the conventions, not the symbol.
    const kind = itemTableKind(header, at);
    if (!ITEM_TABLE_KINDS.has(kind)) {
      // Named, not dropped. An id under an unknown kind is reported with the
      // header shape it was written in, because the failure this item repairs
      // is a population shrinking without anyone being told.
      if (parseBacklogId(cells[at]) !== null) {
        const shape = header.map((c) => stripMd(c)).join(" | ");
        if (!unrecognisedItemTableKinds.has(shape)) {
          unrecognisedItemTableKinds.set(shape, { kind, ids: [] });
        }
        unrecognisedItemTableKinds.get(shape).ids.push(displayItemId(parseBacklogId(cells[at])));
      }
      continue;
    }
    const num = parseBacklogId(cells[at]);
    if (num === null) continue;
    out.push({
      num,
      section,
      title: cells[at + 1] ?? "",
      // Item T-737. The lane comes from the column the HEADER names `Lane`,
      // never from position 2. The two conventions do not agree about what
      // sits there: `# | Item | Lane | Acceptance` puts the lane letter in it,
      // and `# | Verdict | Proof` puts the PROOF SENTENCE in it. Reading the
      // position gave 236 verdict rows a "lane" that was a merge SHA, a regex
      // fragment, `...` or a whole paragraph, and 35 of the 422 items on the
      // board carried one — every one of them an id whose only parsed
      // definition, or whose first, was a verdict row. `build-execution-queue`
      // partitions claimable work by this field and sends anything it does not
      // recognise to `Lane ? — unassigned lane`, which no lane's "take the
      // first unclaimed row in your lane" reaches.
      //
      // A verdict table has no lane column, so it contributes NO lane and the
      // next definition of that id supplies it. Absent beats wrong here: an
      // item with no lane is visibly unassigned, an item whose lane is a
      // sentence is invisibly unassignable.
      lane: laneCell(header, cells),
      // Relative to the id column, so a shape whose id is not in position 0
      // reads its own acceptance cell. For `# | Item | Lane | Acceptance` this
      // is `cells[3]`, exactly as before.
      acceptance: cells[at + 3] ?? "",
      raw: cells.join(" | "),
      // Item T-738. Recorded per definition so the report can name the id.
      // GitHub splits this row the same way, so it is a defect in the
      // document rather than in the reader, and it stays visible until the
      // row is repaired there.
      barePipeInCodeSpan: hasBarePipeInCodeSpan(line),
    });
  }
  return out;
}

/** Timestamped append-only entries from EXECUTION_CLAIMS.md. */
/**
 * Where one claim record ends and the next begins — item T-702.
 *
 * A line that is not a record start is appended to the record above it, which
 * is right for a wrapped continuation and catastrophic for a line this
 * function fails to recognise. The boundary used to demand
 * `^TIMESTAMP | ` at MINUTE precision, and the register does not write that
 * way. Measured over the live register at 2026-09-22T15:26Z: 1207 lines open
 * with a stamp, 633 were recognised, and **574 (47.6%) were swallowed** — 207
 * carrying seconds precision, 367 written in the pipe-less canonical form
 * `<stamp> <agent> item <id> <branch> — claimed` that this directory's README
 * documents. One entry therefore carried dozens of unrelated records, and
 * `claimTextForItem` handed that whole blob to `deriveRung` for any id named
 * anywhere inside it.
 *
 * That is not a reporting nuisance. `rung === 0` is the queue's claimable
 * filter and `rung === 7` is its `isFinished` test, so an item that absorbed a
 * neighbour's proof language disappeared from every bucket the queue renders.
 * Measured across the whole register: 105 items read a rung they had no
 * evidence for, `Signed-in proven` fell from 129 to 38 once the boundary was
 * repaired, and the queue went from offering 0 claimable items to 4.
 *
 * The grammar below is the one `build-execution-queue.mjs` already accepts in
 * `parseClaimRecord`; before this change the two repo-owned generators
 * disagreed about what a record is by 574 lines.
 */
const CLAIM_RECORD_START =
  /^(?:[-*]\s+)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)\s+(?:\|\s*)?(.*)$/;

function executionClaimEntries(text) {
  const out = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const start = line.match(CLAIM_RECORD_START);
    if (start) {
      if (current) out.push(current);
      current = { timestamp: start[1], text: start[2].trim() };
      continue;
    }
    if (current && line.trim() && !/^#{1,6}\s/.test(line)) {
      current.text += ` ${line.trim()}`;
    }
  }
  if (current) out.push(current);
  return out;
}

// Parser invariants for the boundary, kept beside it so a regex edit cannot
// quietly re-swallow half the register. Case 4 is the one that matters most:
// a continuation must still join, or the fix trades a leak for a truncation.
for (const [sample, expected] of [
  ["2026-09-22T13:39Z | agent | item T-901 claimed", true],
  ["2026-09-22T13:39:41Z | agent | item T-901 claimed", true],
  ["2026-09-22T13:39Z agent item T-901 branch — claimed", true],
  ["signed-in acceptance PASSED on the deployed SHA.", false],
  ["- 2026-09-22T13:39:41Z | agent | item T-901 claimed", true],
]) {
  if (CLAIM_RECORD_START.test(sample) !== expected) {
    throw new Error(`Claim record boundary invariant failed for ${JSON.stringify(sample)}`);
  }
}

{
  const parsed = executionClaimEntries([
    "- 2026-09-19T16:10Z | agent | item T-020 · deployed",
    "2026-09-19T16:11Z | agent | item T-019 · claimed",
  ].join("\n"));
  if (parsed.length !== 2 || parsed[0].text.includes("T-019")) {
    throw new Error("Execution-claim parser merged adjacent timestamped claims");
  }
}

/*
 * "The newest line for an item wins" — and the authority for *newest* is named
 * here rather than left to be inferred from the comparison (item T-530, whose
 * filer read this very function as resolving by file order).
 *
 *   PRIMARY:   the STAMP on the line.
 *   TIE-BREAK: APPEND POSITION, via `>=` — entries arrive in file order, and
 *              register stamps are minute-precision, so same-minute ties are
 *              ordinary rather than exotic.
 *
 * Both authorities are imperfect and they disagree on the live register: 14 of
 * 283 ids resolve to a different line, 5 of those to a different verdict. The
 * queue generator reports that disagreement; this function only promises which
 * authority it used. Do not "fix" a disagreement by restamping the register —
 * it is audit history and the correction pattern is append-only.
 */
/**
 * Compare two register stamps of possibly different precision — item T-702.
 *
 * Once seconds-precision lines are recognised as records, the two precisions
 * sit side by side, and a raw string compare gets them backwards: `":"` (0x3A)
 * sorts below `"Z"` (0x5A), so `2026-09-22T13:14:48Z` compares as EARLIER than
 * `2026-09-22T13:14Z`. Pad to seconds for the comparison only. The stamp the
 * register wrote is never rewritten — `entry.timestamp` still carries it
 * exactly as written, because the register is audit history.
 */
function stampSortKey(stamp) {
  return /T\d{2}:\d{2}Z$/.test(stamp ?? "") ? `${stamp.slice(0, -1)}:00Z` : (stamp ?? "");
}

function latestClaimByStampThenAppend(entries) {
  return entries.reduce((latest, entry) => {
    if (!latest) return entry;
    return stampSortKey(entry.timestamp) >= stampSortKey(latest.timestamp) ? entry : latest;
  }, null);
}

{
  // A fixture where the two orders AGREE cannot fail whichever authority the
  // function uses, so both cases below are built to disagree.
  const later = { timestamp: "2026-09-21T17:30Z", text: "appended first, stamped later" };
  const earlier = { timestamp: "2026-09-21T17:20Z", text: "appended second, stamped earlier" };
  if (latestClaimByStampThenAppend([later, earlier]) !== later) {
    throw new Error("Claim resolver must pick the later STAMP, not the later append position");
  }
  // Mixed precision, built to disagree: a raw string compare picks `coarse`.
  const fine = { timestamp: "2026-09-21T17:30:41Z", text: "stamped 41s into the minute" };
  const coarse = { timestamp: "2026-09-21T17:30Z", text: "stamped at the minute" };
  // A raw string compare answers `coarse` BOTH times, because ":" sorts below
  // "Z"; the correct answer is `fine` both times, whichever order they arrive.
  if (latestClaimByStampThenAppend([fine, coarse]) !== fine) {
    throw new Error("Claim resolver must read 17:30:41Z as LATER than 17:30Z appended after it");
  }
  if (latestClaimByStampThenAppend([coarse, fine]) !== fine) {
    throw new Error("Claim resolver must read 17:30:41Z as LATER than 17:30Z appended before it");
  }
  const tieFirst = { timestamp: "2026-09-21T17:30Z", text: "same stamp, appended first" };
  const tieSecond = { timestamp: "2026-09-21T17:30Z", text: "same stamp, appended second" };
  if (latestClaimByStampThenAppend([tieFirst, tieSecond]) !== tieSecond) {
    throw new Error("Claim resolver must break an equal stamp by append position");
  }
}

const UPDATE_TITLE = /^(closed\b|confirmed\b|deploy verified\b|deployed\b|shipped\b|(?:squash-)?merged\b|pr(?:\s*\/\s*ci)?\b|pr\s*#?\d+\b|live-proven\b|signed-in\b|re-?verified\b|verified\b|misdescribed\b|resolved\b|superseded\b|[-\u2014\s]*closed\b)/i;

/**
 * Every `Item <id> — title` prose item in the backlog, at any heading depth.
 *
 * ITEM T-750. This used to require `^### Item <id>`, and the document does not
 * write its verdicts that way. Measured with the grammar below: 298 depth-two
 * `Item <id> — title` headings against 106 at depth three or deeper, and 123
 * of the depth-two ones — over 119 ids — state a verdict (`CLOSED`,
 * `deploy verified`, `re-verified`). Where such a note happens to carry a table row for its own id
 * the verdict lands through the TABLE reader and the gap is invisible; where
 * the note is prose only, it reached no corpus at all and the item stayed at
 * rung 0 with a closure written above it.
 *
 * `unparsedItemIds` could not report that either. It is a set difference over
 * IDS, and each of these ids is produced by its own table row elsewhere, so
 * the residual was empty while the verdict was lost — item T-746’s arithmetic
 * passing over exactly the population it cannot see. Measured on the live
 * backlog at 2026-09-24T03:45Z: five of those 119 ids read `Open`, or were
 * absent from the board entirely — `5`, `C-502`, `T-458`, `T-742`, `T-743`.
 * `T-458` was the only non-data-plane row the claimable queue offered, and it
 * had been marked closed nine hours earlier.
 *
 * Two narrowings, because the widening is the dangerous half:
 *
 *   - At depth 3 or deeper, any title, exactly as before.
 *   - At depth 2, ONLY a verdict-shaped title (`UPDATE_TITLE`). Reading all
 *     298 depth-two headings as definitions would invent a second definition
 *     for the 175 that state no outcome and suppress them as ambiguous — the
 *     `# | Mutation | Failing cases` failure of item T-737 reached from the
 *     heading side. A note is never substantive: `isUpdateNote` classifies it
 *     by the same regex, which is why the two now live side by side.
 *
 * A trailing `(D)`/`(U)`/`(C)`/`(T)` on the id is the operator’s own
 * disambiguator for a number that holds two different items, and it is carried
 * out as `laneScope` rather than discarded. `buildItem` needs it: an update
 * note is admitted through EVERY `definedIn` pin, so an unscoped `T-458(D)`
 * verdict would also close the lane-U item of that number, which is open on a
 * held decision.
 */
function backlogProseItems(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(
      /^(#{3,6}|##)\s+Item\s+(\d+|[DUCT]-\d{3})(\([DUCT]\))?\s*(?:\[(P\d)\])?\s*(?:\([^)]*\)\s*)?[—-]\s*(.*)$/,
    );
    if (!m) continue;
    const [, hashes, id, laneSuffix, priority, rawTitle] = m;
    const title = rawTitle.trim();
    // The depth-2 narrowing. `stripMd` so a bolded verdict reads the same as a
    // bare one; the document writes both.
    if (hashes === "##" && !UPDATE_TITLE.test(stripMd(title))) continue;
    // A section ends at the next heading of the SAME depth or shallower, which
    // for `###` is `/^#{2,3}\s/` — byte-for-byte the old terminator, so no
    // existing item’s body changes size.
    const ends = new RegExp(`^#{2,${hashes.length}}\\s`);
    const body = [];
    for (let j = i + 1; j < lines.length && !ends.test(lines[j]); j += 1) body.push(lines[j]);
    out.push({
      num: parseBacklogId(id),
      section: hashes === "##" ? "verdict heading" : "prose",
      priority: priority ?? "",
      title,
      lane: "",
      acceptance: "",
      // The lane this verdict speaks for, or null when it speaks for the id
      // outright. Only a heading can carry one.
      laneScope: laneSuffix ? laneSuffix.slice(1, -1) : null,
      /*
       * For a depth-2 note the VERDICT IS THE HEADING, and the body is not
       * status. Measured over the live backlog with the body included:
       * `T-593` moved from `Closed` to `PR / CI`, because its closure note
       * cites the run and PR that closed it and `deriveRung` tests the
       * `#\d{4}` rule BEFORE the `CLOSED|MISDESCRIBED|closed-false` fallback
       * — so a closure narrating its own PR reads as an OPEN one. Three more
       * items rose from `Deployed` to `Signed-in proven` the same way, off
       * sentences in a narrative about neighbouring work.
       *
       * Restricting status to the heading is also the claim this item can
       * actually support: the heading is the operator’s verdict, written in
       * the vocabulary `UPDATE_TITLE` already recognises. The body still
       * reaches `bodyCorpus`, which is context and blockers, not rung.
       */
      statusScope: hashes === "##" ? "heading" : "all",
      raw: body.join("\n"),
    });
  }
  return out;
}

/**
 * Every id in ITEM POSITION in the backlog, found without asking the
 * extractor — item T-746.
 *
 * The defect that let 30 ids vanish is not that a shape was unsupported. It is
 * that an id the extractor never produces cannot appear in ANY of this
 * generator's reports: the `unmapped` drop list is computed from the ids it DID
 * produce, so `not placed on the map: 0` was vacuously true over exactly the
 * population that was not missing. The census opened at a number that had
 * already been reduced, and nothing said so.
 *
 * So the population is measured on its own, by the document's own conventions
 * for where an id sits:
 *
 *   - a `## Item <id>` / `### Items <id>, <id>` heading, at any depth, taking
 *     the LEADING id list only. Taking every number in the heading reads `00`
 *     and `01` out of a time range and `186` out of the phrase "186 audit
 *     scripts": measured, that over-counted by twelve.
 *   - the id column of a table whose header NAMES one, under a kind this
 *     reader accepts as an item convention.
 *
 * `unparsedItemIds` is the difference against what the extractor produced.
 * Today it is the `## Item <id>` heading-with-no-item-table shape, which is
 * item T-740's half of this defect and is deliberately NOT parsed here: the
 * point is that it is now VISIBLE — named on stdout, in the summary, and in
 * `EXECUTION_QUEUE.md` — rather than silently absent from every count.
 *
 * This is a narrower claim than "the two populations agree", and it is the one
 * that survives the next new shape: a heading form or table kind nobody
 * anticipated lands in the residual or in
 * `unrecognisedItemTableKinds`, not in silence.
 */
function headingItemIds(line) {
  const m = line.match(/^#{2,6}\s+Items?\s+(.*)$/);
  if (!m) return [];
  const out = [];
  let rest = m[1].trim();
  for (;;) {
    const token = rest.match(/^`?(\d+|[DUCT]-\d{3})`?/);
    if (!token) break;
    out.push(parseBacklogId(token[1]));
    rest = rest.slice(token[0].length).trim();
    const sep = rest.match(/^(?:,|and|&|–|—|-|to)\s*/i);
    if (!sep) break;
    // A dash followed by prose is the title separator, not a range: stop at
    // `## Item 5 — the route infers tenancy` rather than reading its title.
    const after = rest.slice(sep[0].length).trim();
    if (/^[—–-]/.test(sep[0]) && !/^`?(\d+|[DUCT]-\d{3})`?/.test(after)) break;
    rest = after;
  }
  return out;
}

function itemPositionIds(text) {
  const found = new Set();
  let header = null;
  for (const line of text.split(/\r?\n/)) {
    for (const id of headingItemIds(line)) found.add(id);
    if (/^#{2,6}\s/.test(line)) { header = null; continue; }
    if (!line.startsWith("|")) continue;
    const cells = splitTableRow(line);
    if (/^-{2,}$/.test(cells[0]?.replace(/\s/g, "") ?? "")) continue;
    if (isItemTableHeader(cells)) { header = cells; continue; }
    if (!header) continue;
    const at = idColumnIndex(header);
    if (at < 0) continue;
    if (!ITEM_TABLE_KINDS.has(itemTableKind(header, at))) continue;
    const num = parseBacklogId(cells[at]);
    if (num !== null) found.add(num);
  }
  return [...found];
}

/* ------------------------------------------------------- rung derivation */

/**
 * The proof ladder the team already uses. A rung is assigned only when a source
 * document states it in words; nothing is inferred from the existence of a PR
 * number or a deploy run on its own, and nothing is ever upgraded to rung 7 by
 * this script.
 */
/**
 * The unit `deriveRung` reasons in. Named once rather than written twice
 * because item T-704 drops sentences from the rung corpus before
 * `firstMatchingSentence` scans it: if the two split differently, the dropped
 * unit is not the scanned unit and the filter cuts in the wrong place.
 */
const SENTENCE_SPLIT = /(?<=[.;])\s+|\n+/;

const LADDER = [
  { rung: 0, key: "closed", label: "Closed" },
  { rung: 0, key: "open", label: "Open" },
  { rung: 4, key: "pr", label: "PR / CI" },
  { rung: 5, key: "merged", label: "Merged" },
  { rung: 6, key: "deployed", label: "Deployed" },
  { rung: 7, key: "proven", label: "Signed-in proven" },
];

const RULES = [
  {
    rung: 7,
    key: "proven",
    why: "source states signed-in proof passed",
    // The proof word itself, for attribution only (item T-704). It never
    // decides whether the rule fires — `test` does — only who it belongs to.
    token: /\blive-proven\b|\bsigned-in\b/gi,
    test: (t) =>
      /\blive-proven\b/i.test(t) ||
      /signed-in[^.]{0,60}\b(passed|proven|confirmed|resolved)\b/i.test(t),
    // Item T-705. The veto used to demand `not` and the term ADJACENT, and the
    // register does not write that way. Two live rows took rung 7 from
    // sentences that deny it: one reads "This line does not claim deployed or
    // live-proven." — `not` is followed by `claim`, three words before the
    // term — and another reads "NOT `live-proven`", where a single backtick
    // defeats `\s+`. Rung 7 is the queue's `isFinished` test, so both were
    // excluded from every bucket as finished work.
    //
    // The reach is MEASURED, not chosen. Sweeping 20/40/60/80 over the live
    // register: both known positives move off rung 7 at every value, NOTHING
    // enters rung 7 at any value, and 40, 60 and 80 are IDENTICAL — the band is
    // flat above 40. 80 is taken because it is already what the rung-5 and
    // rung-6 vetoes beside this one use, so the three now read the same and the
    // choice costs nothing the measurement can see.
    //
    // Only the veto moves. The rung-7 TEST is untouched, so the movement is
    // attributable to this change alone.
    veto: (t) =>
      /\bnot\b[^.;\n]{0,80}\b(?:live-proven|signed-in)\b/i.test(t) ||
      /signed-in[^.]{0,80}\b(pending|owed|not proven|not performed|not claimed|remains? (?:open|unproven))\b/i.test(t),
  },
  {
    rung: 6,
    key: "deployed",
    why: "source states deployed",
    token: /\bdeployed\b/gi,
    test: (t) => /\bdeployed\b/i.test(t),
    veto: (t) =>
      /\bnot\b[^.;\n]{0,80}\bdeployed\b/i.test(t) ||
      /\bdeploy(?:ment)?\s+(?:is\s+)?(?:pending|owed|blocked|not performed|not claimed)\b/i.test(t),
  },
  {
    rung: 5,
    key: "merged",
    why: "source states merged",
    token: /\b(?:squash-)?merged\b/gi,
    test: (t) => /\b(squash-)?merged\b/i.test(t),
    veto: (t) =>
      /\bnot\b[^.;\n]{0,80}\b(?:squash-)?merged\b/i.test(t) ||
      /\bmerge\s+(?:is\s+)?(?:pending|owed|blocked|not performed|not claimed)\b/i.test(t),
  },
  {
    rung: 4,
    key: "pr",
    why: "source names an open PR",
    token: /#\d{4}\b/g,
    test: (t) => /#\d{4}\b/.test(t),
  },
];

/**
 * `attributeTo`, when given, is the id this corpus is supposed to be about.
 * Sentences whose proof word belongs to a neighbouring id are then skipped —
 * item T-704. Callers that pass nothing behave exactly as before.
 */
function deriveRung(text, attributeTo) {
  const t = text ?? "";
  if (/\bANALYSIS CLOSED\b/i.test(t)) {
    return {
      rung: 0,
      key: "closed",
      why: "source explicitly closes a non-shipping analysis item",
      quote: firstMatchingSentence(t, { test: (x) => /\bANALYSIS CLOSED\b/i.test(x) }),
    };
  }
  for (const rule of RULES) {
    const quote = firstMatchingSentence(t, rule, attributeTo);
    if (!quote) continue;
    return { rung: rule.rung, key: rule.key, why: rule.why, quote };
  }
  if (/\b(CLOSED|MISDESCRIBED|closed-false)\b/.test(t)) {
    return {
      rung: 0,
      key: "closed",
      why: "a verdict closes it, and it states no shipping proof — closed as stale or misdescribed, which proves nothing about the product",
      quote: firstMatchingSentence(t, { test: (x) => /\b(CLOSED|MISDESCRIBED|closed-false)\b/.test(x) }),
    };
  }
  return { rung: 0, key: "open", why: "no proof language in the source", quote: "" };
}

// These are parser invariants, not product status. Keep them next to the rules
// so a wording change cannot silently promote a backlog item.
for (const [sample, expected] of [
  ["PR #7951 is open; status is PR/CI, not merged or deployed.", "pr"],
  ["Merge pending; deployment is not yet performed.", "open"],
  ["Squash-merged as abc123; deploy pending.", "merged"],
  ["Merged and deployed; signed-in acceptance owed.", "deployed"],
]) {
  const actual = deriveRung(sample).key;
  if (actual !== expected) {
    throw new Error(`Rung parser invariant failed: expected ${expected}, got ${actual} for ${JSON.stringify(sample)}`);
  }
}

/* ------------------------------------------------------------------------ *
 * ATTRIBUTING A RUNG WITHIN A RECORD — item T-704.
 *
 * T-702 fixed the boundary BETWEEN claim records. This is the other half. A
 * register record is long and discursive, and one routinely claims item A
 * while naming item B's branch, pull request or verdict as context.
 * `claimTextForItem` matches an id anywhere in a record and hands the WHOLE
 * record to `deriveRung`, which then takes the highest rung ANY sentence in it
 * states — including the sentences that are about somebody else.
 *
 * Measured on the register frozen at 2026-09-22T18:20Z, after T-702: `T-598`
 * reads rung 4 `PR / CI`, quoting
 *
 *     "T-578 is NOT taken - it is claimed with PR #8255 open."
 *
 * `#8255` is T-578's pull request and the sentence exists to say that T-578 is
 * somebody else's work. `T-598` is not named in it at all.
 *
 * THE RULE IS T-545's, and the first attempt at this proved why it has to be.
 * Dropping any sentence that names a foreign id looks right on `T-598` and is
 * wrong on `T-448`, whose own merge reads
 *
 *     "codex item T-448 PR #8139 merge 70e8ebe… — squash-merged after all 19
 *      required checks completed green on the combined T-451/T-453/T-448 state"
 *
 * — a genuine merge of T-448 with two sibling ids in the trailing clause. A
 * sentence-wide veto deletes it and the item falls to `PR / CI`. Measured, that
 * blunt rule dropped 8 own-leading sentences carrying real proof.
 *
 * So attribution is per TOKEN, exactly as `build-execution-queue.mjs` proved
 * for release verdicts: find the proof word the rule fired on, and read the
 * NEAREST id reference to it. If that id is this item, the rung is its own; if
 * it is a neighbour, the sentence is speaking about the neighbour. A sentence
 * naming no id at all belongs to the record's subject, which is the item whose
 * claim grammar matched the record in the first place, so it is kept.
 *
 * That rule gets both live cases right on the same measurement: `T-448`'s token
 * `squash-merged` is nearest to `item T-448`, so it survives; `T-405`'s token
 * `deployed` is nearest to `T-537` rather than to its own leading `item T-405`,
 * so the borrowed deploy goes. Neither is decided by which id came first.
 *
 * The reach is the sentence, not a character count — the sentence is the unit
 * `deriveRung` already reasons in, so the filter cuts exactly where the scan
 * looks. `SENTENCE_SPLIT` is named once for that reason.
 *
 * DIRECTION, which is the safety argument. Filtering can only remove matches,
 * never create one, so an item's rung can only fall. T-702's repair moved 105
 * items and every one moved down; this one has the same property by
 * construction, and the behavioural suite asserts it rather than trusting it.
 *
 * Attribution is OPT-IN: `deriveRung` filters only when given an id. The
 * outcome and narrative corpora pass none and are untouched, and `claimCorpus`
 * — which the blocker rules T-700 reworked read — is deliberately still the
 * whole record, so the rung movement here can be attributed to this change
 * alone.
 *
 * PR numbers are NOT ids. `#8255` is a pull request; `item #59` is a backlog
 * item. The grammar below is the one `claimTextForItem` already uses to decide
 * which records belong to a numeric id, so the two cannot disagree.
 * ------------------------------------------------------------------------ */

/** Any backlog id written in the register's grammar. Never a bare `#1234`. */
const CLAIM_ID_REFERENCE = /\b(?:[A-Z]-\d{3}|item\s*#?\d+)\b/gi;

/** Whether an id reference token names `num` itself rather than a neighbour. */
function isOwnIdReference(token, num) {
  if (typeof num === "number") {
    const digits = token.match(/^item\s*#?(\d+)$/i)?.[1];
    return digits === String(num);
  }
  return token.toUpperCase() === String(num).toUpperCase();
}

/**
 * Whether the proof word this rule fired on in `sentence` belongs to `num`.
 *
 * True when the sentence names no id, or when the id nearest to the proof word
 * is `num`. A rule with no `token` cannot be attributed and is left alone.
 */
function sentenceSpeaksFor(sentence, rule, num) {
  if (!rule.token) return true;
  rule.token.lastIndex = 0;
  const tokens = [...sentence.matchAll(rule.token)];
  if (tokens.length === 0) return true;
  CLAIM_ID_REFERENCE.lastIndex = 0;
  const ids = [...sentence.matchAll(CLAIM_ID_REFERENCE)];
  if (ids.length === 0) return true;

  // A sentence may state the same proof twice. It speaks for this item if ANY
  // occurrence does, which is the same "nearest, not any" test applied per
  // token rather than once for the sentence.
  return tokens.some((token) => {
    let nearest = ids[0];
    for (const id of ids) {
      if (Math.abs(id.index - token.index) < Math.abs(nearest.index - token.index)) nearest = id;
    }
    return isOwnIdReference(nearest[0], num);
  });
}

function firstMatchingSentence(text, rule, attributeTo) {
  for (const s of text.split(SENTENCE_SPLIT)) {
    if (!rule.test(s) || rule.veto?.(s)) continue;
    if (attributeTo !== undefined && !sentenceSpeaksFor(s, rule, attributeTo)) continue;
    return s.trim().replace(/\s+/g, " ").slice(0, 200);
  }
  return "";
}

// Parser invariants for the attribution, kept beside it. The first two are the
// live cases above and they pull in opposite directions; the third is the
// guardrail the acceptance names — a record that says nothing about anyone else
// must survive whole, or the filter has tightened itself into silence and only
// looks correct on the positive.
for (const [sample, num, expected] of [
  ["T-578 is NOT taken - it is claimed with PR #8255 open.", "T-598", false],
  ["codex item T-448 PR #8139 merge 70e8ebe — squash-merged green on the combined T-451/T-453/T-448 state.", "T-448", true],
  ["Squash-merged after every required check passed.", "T-448", true],
  ["cx-a item T-405 CLOSED — proves T-402 ab834dd59 and T-537 0b79765eb are contained by deployed carrier 0f166372f;", "T-405", false],
]) {
  const rule = RULES.find((r) => r.test(sample) && !r.veto?.(sample));
  if (!rule) throw new Error(`Attribution invariant is unreachable — no rule fires on ${JSON.stringify(sample)}`);
  if (sentenceSpeaksFor(sample, rule, num) !== expected) {
    throw new Error(`Claim attribution invariant failed for ${num} on rule ${rule.key}: ${JSON.stringify(sample)}`);
  }
}

const BLOCKER_RULES = [
  { re: /\bnot\s+signed-in\b|(?:^|[.!?]\s+)signed-in\s+check\b|signed-in[^.]{0,80}\b(pending|owed|not proven|not performed|not claimed|remains? (?:open|unproven))\b/i, say: "Signed-in acceptance owed", ownerGate: true },
  // The third form is item T-705's, and it sits here rather than in its own
  // change for one measured reason. Correcting the rung-7 veto below drops one
  // row to rung 0 — correctly; its own text reads "not merged, not deployed,
  // not applied" — and that row carries NO blocker, so a false "Signed-in
  // proven" was the only thing keeping owner-gated work out of the claimable
  // queue. Shipping the veto alone would have offered it as free work.
  // Measured, this term changes the blocker of EXACTLY ONE item, that one.
  { re: /\brequires? separate approval\b|\bApply requires\b|\buntil separately approved\b/i, say: "Awaiting approval to apply", ownerGate: true },
  // An acceptance is written in the imperative, so the decision gate in one
  // usually is too. Recognising only the noun forms and the single literal
  // "Decide first" left T-596 — which opens "Decide per job before pinning
  // anything" and closes "read-only until a human decides" — reading
  // `Unclaimed`, and the queue offered a Container Apps Jobs runtime change
  // as free agent work. Two imperative forms are added here, each with its
  // own case in the suite.
  //
  // A THIRD FORM, added with the U-502 placement and for the same measured
  // reason the approval term shipped with the rung-7 veto: placing that id
  // made it CLAIMABLE, and its acceptance opens "A decision, then the work
  // that follows from it: mount or retire." That is an owner gate stated as
  // plainly as any noun form here, and none of the patterns above match it —
  // it says "A decision", not "decision needed", and never uses the
  // imperative. Shipping the placement without this term would have offered
  // an owner decision to the next agent as free work.
  //
  // It is anchored exactly as `Decide` is, so the phrase must OPEN a sentence
  // or follow bold markup; "a decision was taken", "the decision belongs to
  // the owner" and any mid-sentence mention stay out. Measured on the live
  // register, it changes the blocker of EXACTLY ONE item, that one.
  //
  // This is a WIDENING, and the detector was narrowed once before for good
  // reason: re-scanning raw prose made every descriptive use of "signed-in"
  // an owner gate. So both forms are anchored. `Decide` must open a sentence
  // or follow bold markup, which keeps "the owner decided", "requires the
  // owner to decide anything" and "Deciding which suite to wire was settled"
  // out; and the deferral form names who does the deciding rather than
  // matching the verb anywhere it appears.
  { re: /decision needed|decision required|Content decision|\bproduct call\b|\bowner'?s call\b|blocked on owner policy|(?:^|[.!?;:]\s+|\n\s*|\*\*)Decide\b|\b(?:until|before)\s+(?:a human|an owner|a person|the owner|Anand|someone)\s+decides\b|(?:^|[.!?;:]\s+|\n\s*|\*\*)A decision\b/i, say: "Decision needed", decisionGate: true, ownerGate: true },
  // Item T-703. This was a bare `\bblocked\b` — no anchoring, no veto — while
  // the decision rule directly above has both, added after raw prose made
  // every descriptive use of a word into an owner gate. T-700 gave this rule
  // more reach by letting a row be labelled from its own body, which made the
  // gap load-bearing.
  //
  // Measured on the live register, the bare word was labelling, as owner
  // gates: a FILENAME (`blocked-loader-paths.json`), a contract status enum
  // whose values are "signed, pending signature, or blocked", an assertion
  // that a test "must show an infected file blocked", a description of a panel
  // that "goes blocked rather than available", and a paragraph explaining what
  // the blocker mechanism itself does. None of those is a gate on anybody.
  //
  // The distinction the register actually writes is PREDICATE versus
  // MODIFIER. A gate is stated — "blocked on", "blocked by", "blocked until",
  // "is/remains blocked", or the shouted `BLOCKED ON OWNER DECISION` heading.
  // A description uses the word as an adjective in front of a noun — a blocked
  // path, a blocked bucket, a blocked read. Anchoring on the predicate forms
  // keeps every genuine gate and drops the descriptions.
  //
  // The veto is separate and covers what anchoring cannot: a sentence that
  // says the blockage is over. Past-tense and negated forms are the ones the
  // item named, and they are the ones a future row will write.
  //
  // The PATTERN IS NOT WIDENED here. Nothing that failed to match before
  // matches now; this change only removes matches, so an item can only leave
  // the blocked bucket, never enter it.
  {
    re: /\bblocked\s+(?:on|by|until|pending)\b|\b(?:is|are|was|were|remains?|stays?|still|currently)\s+blocked\b|\bblocked-on-[a-z]/i,
    veto: /\b(?:not|never|no longer|isn'?t|aren'?t|wasn'?t)\s+blocked\b|\bwas\s+blocked\b[^.;\n]{0,60}\b(?:now|since|and is now|but is now)\b|\bno longer\b[^.;\n]{0,40}\bblocked\b/i,
    say: "Blocked (see source)",
    ownerGate: true,
  },
  // NOT an `ownerGate`. This is the fallback, and it asserts the ABSENCE of a
  // gate rather than one. It must never be promoted over a gate a claim line
  // records: T-418's body reads "the largest unclaimed critical row in the
  // census", which is prose about a census and not a status, and promoting it
  // would move a real signed-in gate out of the never-claim bucket.
  { re: /\bunclaimed\b/i, say: "Unclaimed" },
];

/**
 * Rungs at which the item's OWN source records shipping proof.
 *
 * `closed` is deliberately not here. A closed verdict states that the item was
 * stale or misdescribed and asserts nothing about shipping, so an agent's
 * stated intent to decide something is not obviously spent; leaving it alone
 * keeps this narrowing to the case it was measured on. No closed-rung item is
 * affected today either way — measured, not assumed.
 */
const RESOLVED_RUNGS = new Set(["merged", "deployed", "proven"]);

/**
 * Derive the blocker from two DIFFERENT kinds of evidence — item T-578.
 *
 * These used to arrive as one flat string. The item's body is a statement
 * about the item; a claim-log line is a run log, and it narrates intent. A
 * line reading "claimed | lane T; decide which vocabulary is authoritative"
 * therefore goes on asserting an open decision for as long as the line exists,
 * which is forever: the register is append-only and a line is never restamped.
 * Measured on the live backlog before this changed, 12 of 411 items read
 * `Decision needed` from a claim line their body does not support.
 *
 * What changes is the INPUT, not the patterns — the patterns were right. Once
 * the item's own source records shipping proof, the decision gate is read from
 * the body alone. Two things stay exactly as they were, and both are pinned by
 * a case in the behavioural suite: every OTHER rule still reads the claim log
 * at every rung, and an item with no shipping proof still reads its claim
 * lines for a decision gate — that is the direction that would hide live work,
 * and it is left alone.
 *
 * ---------------------------------------------------------------------------
 * Item T-700 — the opposite half, and the more expensive one.
 *
 * `BLOCKER_RULES` is ordered, and T-578 left that order deciding which of two
 * matches wins even when they come from different kinds of evidence. The
 * signed-in rule is first, so a claim line carrying signed-in language took
 * the label away from a gate the item declares in its OWN body. Measured on
 * the live register at `ef261ac74`, 22 items were in that state, and one of
 * them — `T-598` — had not shipped: its body says `decision needed` in bold,
 * and it read `Signed-in acceptance owed` because a NEIGHBOURING item's
 * release paperwork named it. An owner scanning for questions to answer could
 * not see it.
 *
 * So the body wins, regardless of rule order. That is one comparison, not a
 * re-ranking: each rule is still tried in order, but a rule that matches the
 * item's own body short-circuits, while a rule that matches only the claim log
 * is held and used solely if no body gate is found. When there is no claim log
 * at all the two corpora are identical and the behaviour is unchanged.
 *
 * The comparison is deliberately confined to `ownerGate` rules. `Unclaimed` is
 * the fallback and asserts the ABSENCE of a gate; promoting it over a real
 * claim-derived gate would move an item OUT of the never-claim bucket, which
 * is the one direction this file must never take. `T-418` is the live proof —
 * see the note on that rule.
 */
function deriveBlocker(body, claims = "", rung = null) {
  const bodyText = body ?? "";
  const claimText = claims ?? "";
  const combined = claimText ? `${bodyText}\n${claimText}` : bodyText;
  const resolved = RESOLVED_RUNGS.has(rung?.key ?? "");
  let fromClaims = null;
  for (const r of BLOCKER_RULES) {
    const t = r.decisionGate && resolved ? bodyText : combined;
    const m = firstUnvetoedMatch(t, r);
    if (!m) continue;
    if (r.ownerGate) {
      const bodyMatch = firstUnvetoedMatch(bodyText, r);
      if (bodyMatch) {
        return { say: r.say, quote: sentenceAround(bodyText, bodyMatch.index ?? 0) };
      }
    }
    fromClaims ??= { say: r.say, quote: sentenceAround(t, m.index ?? 0) };
  }
  return fromClaims;
}

/**
 * The first match of `rule.re` in `text` whose own sentence is not vetoed —
 * item T-703. A rule with no `veto` behaves exactly as before.
 *
 * It scans matches rather than taking only the first, because one row can both
 * describe a past blockage and state a live one; stopping at the first match
 * would let a vetoed sentence hide a real gate written after it. The veto is
 * evaluated on the SENTENCE around the match, not the whole corpus, or a
 * single "no longer blocked" anywhere in a long row would silence every gate
 * in it.
 */
function firstUnvetoedMatch(text, rule) {
  if (!rule.veto) return text.match(rule.re);
  const re = new RegExp(rule.re.source, rule.re.flags.includes("g") ? rule.re.flags : `${rule.re.flags}g`);
  for (const m of text.matchAll(re)) {
    if (!rule.veto.test(sentenceAround(text, m.index ?? 0))) return m;
  }
  return null;
}

function sentenceAround(text, index) {
  const start = Math.max(0, text.lastIndexOf(". ", index) + 1);
  const endRel = text.slice(index).search(/[.;]\s/);
  const end = endRel < 0 ? text.length : index + endRel + 1;
  return text.slice(start, end).trim().replace(/\s+/g, " ").slice(0, 220);
}

/* ------------------------------------------------ board IDs in narrative */

/**
 * Expand a Backlog IDs cell ("A1-A10, C1-C14, D1-D4") into the set of ids it
 * covers, then find every board line that names one of them.
 *
 * This is how a PR recorded only in the board narrative reaches a stage: the
 * board itself declares which ids belong to which outcome, so no guessing is
 * involved. It is attributed ONLY to a stage that solely owns its outcome —
 * four stages share the five-phase-journey outcome, and crediting a line about
 * one of them to all four is the overstatement this page exists to avoid.
 */
function expandIdCell(cell) {
  const ids = new Set();
  for (const m of (cell ?? "").matchAll(/\b([A-Z]+)(\d+)\s*[-\u2013]\s*[A-Z]*(\d+)\b/g)) {
    const [, prefix, from, to] = m;
    for (let i = Number(from); i <= Number(to); i += 1) ids.add(`${prefix}${i}`);
  }
  for (const m of (cell ?? "").matchAll(/\b([A-Z]+\d+)\b(?!\s*[-\u2013])/g)) ids.add(m[1]);
  return ids;
}

const BOARD_LINES = boardText
  .split(/\r?\n/)
  .filter((l) => /^[-*]\s|^\d+\.\s/.test(l.trim()) || l.trim().startsWith("**"))
  .map((l) => l.trim());

function boardLinesNaming(ids) {
  if (ids.size === 0) return [];
  const re = new RegExp(`\\b(${[...ids].join("|")})\\b`);
  return BOARD_LINES.filter((l) => re.test(l));
}

/* -------------------------------------------------------------- assembly */

const boardOutcomes = tablesUnderHeading(boardText, /Vision to acceptance/i);
const boardClaims = tablesUnderHeading(boardText, /item claims/i);
const executionClaims = executionClaimEntries(claimsText);
const items = [...backlogTableItems(backlogText), ...backlogProseItems(backlogText)];

/*
 * The residual — item T-746. Measured against `items` above, which is every
 * definition this reader produced, so it names precisely what the extractor
 * could not parse and nothing else.
 */
const itemPositionPopulation = itemPositionIds(backlogText);
const parsedIds = new Set(items.map((i) => String(i.num)));
const unparsedItemIds = itemPositionPopulation
  .filter((id) => !parsedIds.has(String(id)))
  .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

const byNum = new Map();
for (const it of items) {
  if (!byNum.has(it.num)) byNum.set(it.num, []);
  byNum.get(it.num).push(it);
}
/**
 * A number appearing twice is not automatically a collision.
 *
 * Most repeats are progress notes on the SAME item — "CLOSED", "deploy
 * verified 20:58Z", "re-verified on main" — appended as their own heading.
 * Those are the log working as intended. A collision is two different items
 * competing for one number, and only that is ambiguous to cite.
 *
 * Reporting the raw repeat count conflates them and overstates the problem,
 * which is the same counting error this page exists to stop.
 */
// Defined beside `backlogProseItems` (item T-750), which needs it: the reader
// that decides whether a HEADING is a verdict and the reader that decides
// whether a PARSED DEFINITION is one must agree, and two regexes drift.
// Classified by what the entry SAYS, not where it sits: a "CLOSED — fixed
// by #7800" verdict row is an update whether it lands in prose or in a table.
const isUpdateNote = (d) =>
  /^Item\s+(?:\d+|[DUCT]-\d{3})\s+[—-]\s+(?:verdict|correction|closed|pr(?:\s*\/\s*ci)?|merged|deployed|deploy verified|re-verified|signed-in|live-proven)\b/i.test(d.section ?? "") ||
  UPDATE_TITLE.test(stripMd(d.title || d.raw?.split("\n")[0] || ""));

function attributableStatusText(definition) {
  if (isUpdateNote(definition)) {
    // Item T-750: a depth-2 verdict note contributes its HEADING only. See
    // `statusScope` in `backlogProseItems` for what including the body cost.
    return definition.statusScope === "heading"
      ? `${definition.section} ${definition.title}`
      : `${definition.section} ${definition.title} ${definition.acceptance} ${definition.raw}`;
  }

  // Many older table rows were updated in place by putting the verdict at the
  // start of the Acceptance cell. Preserve that explicit convention without
  // treating a predecessor PR cited later in the problem statement as status.
  return [definition.title, definition.acceptance]
    .map((value) => stripMd(value ?? "").trim())
    .filter((value) => UPDATE_TITLE.test(value) || /(?:^|[.!?]\s+)CLOSED\b/i.test(value))
    .join("\n");
}

const repeatedNums = [...byNum.entries()].filter(([, v]) => v.length > 1).map(([n, v]) => {
  const defs = v.map((x) => ({
    section: x.section,
    title: stripMd(x.title || x.raw.split("\n")[0] || "").slice(0, 150),
    isUpdate: isUpdateNote(x),
  }));
  const substantive = defs.filter((d) => !d.isUpdate);
  return {
    num: n,
    count: v.length,
    sections: v.map((x) => x.section),
    defs,
    kind: substantive.length > 1 ? "collision" : "updates",
    substantiveCount: substantive.length,
  };
});
const collisions = repeatedNums.filter((r) => r.kind === "collision");
const updatedNums = repeatedNums.filter((r) => r.kind === "updates");
// Kept for the existing report/summary fields.
const duplicateNums = collisions;
const collisionNums = new Set(collisions.map((r) => r.num));

function claimTextForItem(num) {
  // The claim table keys on free text like "P1 #14, Tower context-pack aliases".
  const token = escapeRegExp(String(num));
  const hits = boardClaims.filter((r) =>
    (typeof num === "number"
      ? new RegExp(`#${token}\\b`)
      : new RegExp(`(?:^|\\s)${token}\\b`)
    ).test(r["Backlog item"] ?? ""),
  );
  const claimRe = typeof num === "number"
    ? new RegExp(`\\bitem\\s+#?${token}\\b`, "i")
    : new RegExp(
        `(?:\\bitem\\s+${token}\\b|(?:^|\\|\\s*)${token}(?=\\s*(?:\\||·|:|—|$)))`,
        "i",
      );
  return [
    ...hits.map((h) => ({ owner: h.Owner ?? "", status: h.Status ?? "", source: map.sources.board })),
    ...executionClaims.filter((entry) => claimRe.test(entry.text)).map((entry) => ({
      owner: "",
      status: entry.text,
      source: map.sources.claims,
      timestamp: entry.timestamp,
    })),
  ];
}

// A summary may reference many owner items. Those references are context, not
// claims on every referenced item. Only an explicit `item T-123` target or a
// pipe-delimited `T-123` claim heading may contribute status to that item.
for (const [sample, item, expected] of [
  ["agent | item T-019 · released; owner T-022 follows", "T-019", true],
  ["agent | item T-019 · released; owner T-022 follows", "T-022", false],
  ["agent | T-022 | claimed", "T-022", true],
]) {
  const token = escapeRegExp(item);
  const re = new RegExp(
    `(?:\\bitem\\s+${token}\\b|(?:^|\\|\\s*)${token}(?=\\s*(?:\\||·|:|—|$)))`,
    "i",
  );
  if (re.test(sample) !== expected) {
    throw new Error(`Claim parser invariant failed for ${item}: ${sample}`);
  }
}

/**
 * A mapped item is a bare id, or `{ num, definedIn }` where `definedIn` is a
 * substring of the section heading the map means.
 *
 * Thirty-three numbers collide, and a collision suppresses the item entirely —
 * it cannot promote a stage or cover a capability, because citing it is
 * genuinely ambiguous. Three of those collisions were hiding real deployed
 * work: in each case a lifecycle item and a platform item found later had
 * reused one number.
 *
 * Renumbering is the wrong fix; existing claims and verdicts cite these
 * numbers, and rewriting them would break every reference. Pinning the
 * definition resolves the ambiguity for this map without touching the log.
 * Pinning a section that matches more than one definition is still ambiguous
 * and is still refused.
 */
/**
 * Verdicts withheld because their lane suffix matched no definition — item
 * T-750. Reported, never silently dropped: a suffix that names a lane the id
 * does not have is either a typo in the note or a lane the board read wrongly,
 * and both are things a human has to see.
 */
const laneScopedVerdictsUnattributed = [];

function resolveItemRef(ref) {
  if (ref !== null && typeof ref === "object") {
    return { num: ref.num, definedIn: ref.definedIn ?? null };
  }
  return { num: ref, definedIn: null };
}

/**
 * Reject duplicate structural references before they become duplicate queue
 * rows. Capability lists may intentionally cite the same item as their parent
 * stage, so uniqueness is enforced inside each list rather than globally.
 */
function assertUniqueMappedRefs(refs, trail) {
  const firstIndexByKey = new Map();
  for (const [index, ref] of (refs ?? []).entries()) {
    const { num, definedIn } = resolveItemRef(ref);
    const key = JSON.stringify([num, definedIn]);
    if (firstIndexByKey.has(key)) {
      console.error(
        `source-stage-map.json repeats item ${String(num)} in ${trail} at indexes ${firstIndexByKey.get(key)} and ${index}. Each structural list must contain an item reference once.`,
      );
      process.exit(1);
    }
    firstIndexByKey.set(key, index);
  }
}

for (const [index, stage] of (map.stages ?? []).entries()) {
  assertUniqueMappedRefs(stage.items, `map.stages[${index}].items`);
  for (const [capabilityIndex, capability] of (stage.capabilities ?? []).entries()) {
    assertUniqueMappedRefs(
      capability.items,
      `map.stages[${index}].capabilities[${capabilityIndex}].items`,
    );
  }
}
assertUniqueMappedRefs(map.platformTrack?.items, "map.platformTrack.items");
assertUniqueMappedRefs(map.outsideLifecycle?.items, "map.outsideLifecycle.items");
for (const [index, capability] of (map.crossCutting?.capabilities ?? []).entries()) {
  assertUniqueMappedRefs(capability.items, `map.crossCutting.capabilities[${index}].items`);
}

function buildItem(ref) {
  const { num, definedIn } = resolveItemRef(ref);
  const all = byNum.get(num) ?? [];
  if (all.length === 0) return null;

  // Updates travel with whichever definition they annotate; keep them in the
  // corpus so a pinned item still reads its own verdicts.
  const pinned = definedIn
    ? all.filter((d) => (d.section ?? "").includes(definedIn) || isUpdateNote(d))
    : all;
  const withScopes = pinned.length ? pinned : all;
  const substantive = withScopes.filter((d) => !isUpdateNote(d));
  const pinnedCleanly = Boolean(definedIn) && substantive.length === 1;

  /*
   * ITEM T-750. A lane-scoped verdict speaks for ONE of the items sharing a
   * number, and the filter above cannot hold it: `isUpdateNote` admits every
   * update note through every `definedIn` pin, deliberately, so a pinned item
   * still reads its own verdicts. On the live board `T-458` is two items in two
   * lanes and the operator disambiguates by writing `T-458(D)`; attributing
   * that to both would close a lane-U item that is open on a held decision.
   *
   * The lane comes from the SUBSTANTIVE definitions only — a note carries no
   * lane of its own, so reading the merged list would let the note answer the
   * question it is being asked about.
   *
   * It fails CLOSED. A suffix naming a lane no definition answers to withholds
   * the verdict rather than attributing it on the theory that it was probably
   * meant. Fail-closed alone would be silence, which is the defect this item
   * repairs, so the withheld verdict is named in the summary and on stdout.
   */
  const itemLane = substantive.map((d) => d.lane).find(Boolean) ?? "";
  const defs = withScopes.filter((d) => {
    if (!d.laneScope) return true;
    if (itemLane && d.laneScope === itemLane) return true;
    laneScopedVerdictsUnattributed.push({
      num: displayItemId(num),
      laneScope: d.laneScope,
      itemLane: itemLane || null,
      definedIn: definedIn ?? null,
      title: stripMd(d.title ?? "").slice(0, 120),
    });
    return false;
  });

  const claims = claimTextForItem(num);
  // Status is attributable only when the item owns an explicit update/verdict
  // or an exact claim-log/board record. The substantive problem statement is
  // context: it routinely cites predecessor PRs, deploys, and proof gaps. Using
  // that prose as status promoted untouched follow-up work merely because it
  // named the earlier change that exposed the gap.
  const statusCorpus = [
    ...defs.map(attributableStatusText).filter(Boolean),
    ...claims.map((c) => c.status),
  ].join("\n");
  /*
   * ITEM T-750. A depth-two verdict note contributes its heading here too, not
   * only to the status corpus. `deriveBlocker` reads this text UN-attributed —
   * a decision sentence anywhere in it sets the blocker — and these notes are
   * long narratives that name neighbouring items by the paragraph. Measured
   * with their bodies included: **17 blockers moved**, `Decision needed` from
   * 70 to 76, with no per-item justification available for any of them. An
   * item whose blocker becomes `Decision needed` leaves the claimable queue
   * for the bucket no agent may take, so that is the direction that hides
   * work.
   *
   * Widening the blocker corpus may well be right, and it is not this change:
   * it would have to be attributed first, the way T-704 attributed the rung
   * corpus, and doing both at once makes neither movement attributable.
   */
  const bodyCorpus = defs
    .map((d) => (d.statusScope === "heading"
      ? `${d.title}`
      : `${d.title} ${d.acceptance} ${d.raw}`))
    .join("\n");
  const claimCorpus = claims.map((c) => c.status).join("\n");
  // Item T-704: the corpus is unchanged, and the id is passed so a sentence
  // whose proof word belongs to a NEIGHBOURING item cannot supply this item's
  // rung. `claimCorpus` above is deliberately left un-attributed — the blocker
  // rules T-700 reworked read that one, and narrowing both in one change would
  // make the rung movement unattributable.
  const rung = deriveRung(statusCorpus, num);
  return {
    num,
    definedIn,
    ambiguous: collisionNums.has(num) && !pinnedCleanly,
    sections: defs.map((d) => d.section),
    // Only the substantive definitions disambiguate. `sections` carries the
    // verdict notes too, and listing those in a queue row would name four
    // places for an id that is defined in two.
    substantiveSections: substantive.map((d) => d.section),
    // Prefer a substantive definition: when an item is pinned, defs[0] can be
    // one of its own verdict notes, and "CLOSED — shipped" is not a title.
    title: stripMd(
      (substantive[0] ?? defs[0]).title ||
        (substantive[0] ?? defs[0]).raw.split("\n")[0] ||
        `Item ${num}`,
    ),
    lane: defs.map((d) => d.lane).find(Boolean) ?? "",
    acceptance: stripMd(
      [...substantive, ...defs].map((d) => d.acceptance).find(Boolean) ?? "",
    ),
    owner: claims.map((c) => c.owner).find(Boolean) ?? "",
    rung,
    blocker: deriveBlocker(bodyCorpus, claimCorpus, rung),
  };
}

const stages = map.stages.map((s) => {
  const outcomeRows = boardOutcomes.filter((r) => {
    const cell = r[Object.keys(r)[0]] ?? "";
    const names = [s.boardOutcomeMatch, ...(s.alsoBoardOutcomes ?? [])];
    return names.some((n) => cell.toLowerCase().includes(n.toLowerCase()));
  });
  const stageItems = (s.items ?? []).map(buildItem).filter(Boolean);
  const stageClaimRe = new RegExp(`\\bStage\\s+0*${s.id}\\b`, "i");
  const explicitStageClaims = executionClaims.filter((entry) => stageClaimRe.test(entry.text));
  const stageOwnerTokens = s.name.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
  const ownerIdentifiesStage = (owner) => {
    const normalized = owner.toLowerCase();
    return new RegExp(`stage0*${s.id}\\b`).test(normalized) || stageOwnerTokens.some((token) => normalized.includes(token));
  };
  const stageClaimOwners = new Set(
    explicitStageClaims
      .map((entry) => entry.text.split("|")[0].trim())
      .filter(ownerIdentifiesStage),
  );
  const stageClaims = executionClaims.filter((entry) =>
    stageClaimRe.test(entry.text) || stageClaimOwners.has(entry.text.split("|")[0].trim()),
  );
  const latestStageClaim = latestClaimByStampThenAppend(stageClaims);
  const claimRung = stageClaims
    .map((entry) => deriveRung(entry.text))
    .reduce(
      (highest, rung) => (rung.rung > highest.rung ? rung : highest),
      { rung: 0, key: "open", why: "", quote: "" },
  );
  const outcomeCorpus = outcomeRows.map((r) => Object.values(r).join(" ")).join("\n");

  // A stage's rung comes from ITS OWN mapped items, never from a board outcome
  // it shares with other stages. Four stages share the five-phase-journey
  // outcome; attributing that outcome's deploy evidence to each of them would
  // report Request intake as deployed because a different stage shipped.
  const outcomeRung = deriveRung(outcomeCorpus);

  // Board lines naming an id this stage's outcome owns.
  const ownedIds = new Set();
  for (const r of outcomeRows) for (const id of expandIdCell(r["Backlog IDs"] ?? "")) ownedIds.add(id);
  const soleOwner =
    map.stages.filter((o) => o.boardOutcomeMatch === s.boardOutcomeMatch).length === 1;
  const narrativeLines = soleOwner ? boardLinesNaming(ownedIds) : [];
  const narrativeRung = narrativeLines.length
    ? deriveRung(narrativeLines.join("\n"))
    : { rung: 0, key: "open", why: "", quote: "" };

  // A claim line is an agent narrating its own work in an append-only log. It
  // is not a backlog verdict and not a board outcome, so it may never move a
  // stage up the ladder — otherwise a stage with nothing mapped to it reads
  // "Deployed" on the strength of prose about a branch. Claims stay visible
  // below as context; claimRung is reported, never counted.
  const candidates = [
    // A duplicated numeric id can refer to unrelated backlog definitions. It
    // stays visible in the resolver table, but it cannot promote a lifecycle
    // stage until the map names an unambiguous definition.
    ...stageItems.filter((i) => !i.ambiguous).map((i) => i.rung),
    ...(narrativeLines.length ? [narrativeRung] : []),
  ];
  const ambiguousItems = stageItems.filter((i) => i.ambiguous);
  const unambiguousItems = stageItems.filter((i) => !i.ambiguous);
  // A stage is only as proven as its weakest mapped item. Taking the highest
  // rung any one item reached made stage 6 read "Signed-in proven" while two
  // of its four items were still below proof — a stage label that says the
  // stage is done when it is not. The floor is the claim that survives
  // scrutiny; the best rung reached is reported beside it, not as the headline.
  const stageRung = candidates.length
    ? candidates.reduce((a, b) => (b.rung < a.rung ? b : a))
    : {
        rung: 0,
        key: "open",
        why: !stageItems.length
          ? "no backlog item is mapped to this stage — nothing here has been measured"
          : !unambiguousItems.length
            ? `every item mapped here carries an ambiguous id (${ambiguousItems
                .map((i) => `#${i.num}`)
                .join(", ")}) — the backlog defines that number more than once, so the evidence cannot be attributed`
            : "no item mapped to this stage carries proof language",
        quote: "",
      };

  // The blocker names what is holding THIS stage back, so it is read from the
  // items that are not yet proven. Read from the whole stage corpus it came
  // back identical on all nine stages — a column constant across every row
  // carries no information, and on a stage whose every item is proven it
  // actively contradicts the rung.
  const unproven = unambiguousItems.filter((i) => i.rung.rung < 7);
  // deriveBlocker returns { re, say } or null; the two structural cases below
  // are not text matches, so they are constructed in the same shape.
  const blocker = !stageItems.length
    ? { say: "No item mapped to this stage" }
    : !unambiguousItems.length
      ? {
          say: `Ambiguous id: ${ambiguousItems
            .map((i) => `#${i.num}`)
            .join(", ")} defined more than once in the backlog`,
        }
      : unproven.length
        ? (deriveBlocker(unproven.map((i) => `${i.title} ${i.acceptance}`).join("\n")) ?? {
            say: `${unproven.length} item(s) below signed-in proof, none stating a blocker`,
          })
        : null;

  return {
    ...s,
    outcomeRows,
    outcomeRung,
    narrativeLines,
    stageClaims,
    latestStageClaim,
    ownedIds: [...ownedIds],
    items: stageItems,
    rung: stageRung,
    bestRung: candidates.length
      ? candidates.reduce((a, b) => (b.rung > a.rung ? b : a))
      : stageRung,
    claimRung,
    blocker,
    unprovenCount: unproven.length,
    ids: outcomeRows.map((r) => r["Backlog IDs"] ?? "").filter(Boolean).join("; "),
    nextGate: outcomeRows.map((r) => stripMd(r["Next acceptance gate"] ?? "")).filter(Boolean),
    owners: [...new Set([
      ...outcomeRows.map((r) => r["Owner lane"] ?? "").filter(Boolean),
      ...stageItems.map((i) => i.owner).filter(Boolean),
    ])],
  };
});

/* -------------------------------------------- capability coverage

A stage's rung tells you how far its MAPPED items got. It cannot tell you
whether what is mapped is the stage at all. Stage 8 read "Signed-in proven" off
a single item covering terminal-state progress UX, while award decision, SOW
generation, e-signature and the canonical-contract handoff were not mapped and
so could not drag the floor down. Stages 5 and 7 had nothing mapped and still
carried a label.

So each stage now declares the capabilities the vision requires of it, in
source-stage-map.json. That file holds structure only — a capability names what
the stage must be able to do and lists the backlog items claimed against it. It
carries no rung and no verdict; everything below is derived.

A capability with no declared item is UNCOVERED. That is the default, and it is
deliberate: it fails toward understating progress, the same direction every
other rule here fails.
--------------------------------------------------------------- */

// Credit a capability earns, as a fraction of signed-in proof. Merged is worth
// something and is worth less than deployed; nothing below a merge counts as
// delivery of a capability.
const RUNG_CREDIT = { closed: 0, open: 0, pr: 0, merged: 5 / 7, deployed: 6 / 7, proven: 1 };

function buildCapabilities(declared) {
  return (declared ?? []).map((cap) => {
    const items = (cap.items ?? []).map(buildItem).filter(Boolean);
    const usable = items.filter((i) => !i.ambiguous);
    // A capability is only as delivered as its weakest declared item, for the
    // same reason a stage is only as proven as its weakest one.
    const rung = usable.length
      ? usable.reduce((a, b) => (b.rung.rung < a.rung.rung ? b : a)).rung
      : { rung: 0, key: "open", why: "no backlog item is declared against this capability", quote: "" };
    return {
      capability: cap.capability,
      items,
      declaredIds: cap.items ?? [],
      covered: usable.length > 0,
      rung,
      credit: usable.length ? (RUNG_CREDIT[rung.key] ?? 0) : 0,
    };
  });
}

function coverageOf(capabilities) {
  const total = capabilities.length;
  const covered = capabilities.filter((c) => c.covered).length;
  const credit = capabilities.reduce((sum, c) => sum + c.credit, 0);
  return {
    total,
    covered,
    uncovered: total - covered,
    // Proof-weighted: what fraction of this scope is actually delivered and
    // proven, not what fraction has a ticket.
    completion: total ? credit / total : 0,
  };
}

for (const stage of stages) {
  stage.capabilities = buildCapabilities(
    map.stages.find((s) => s.id === stage.id)?.capabilities,
  );
  stage.coverage = coverageOf(stage.capabilities);
}

const crossCutting = map.crossCutting
  ? {
      ...map.crossCutting,
      capabilities: buildCapabilities(map.crossCutting.capabilities),
    }
  : null;
if (crossCutting) crossCutting.coverage = coverageOf(crossCutting.capabilities);

const allCapabilities = [
  ...stages.flatMap((s) => s.capabilities),
  ...(crossCutting?.capabilities ?? []),
];
const visionCoverage = coverageOf(allCapabilities);

const crossCuttingItemRefs = [
  ...new Map(
    (map.crossCutting?.capabilities ?? [])
      .flatMap((cap) => cap.items ?? [])
      .map((ref) => [resolveItemRef(ref).num, ref]),
  ).values(),
];
const crossCuttingTrack = map.crossCutting
  ? {
      name: map.crossCutting.name,
      why: map.crossCutting.note,
      items: crossCuttingItemRefs,
    }
  : null;
const sideTracks = [map.platformTrack, map.outsideLifecycle, crossCuttingTrack].filter(Boolean);
// An item reference may be a bare id or { num, definedIn }; the unmapped
// report counts numbers, so normalise before comparing. Capability
// declarations count as mapping too — an id cited only by a capability is
// placed, not orphaned.
const mappedNums = new Set([
  ...map.stages.flatMap((s) => (s.items ?? []).map((r) => resolveItemRef(r).num)),
  ...map.stages.flatMap((s) =>
    (s.capabilities ?? []).flatMap((c) => (c.items ?? []).map((r) => resolveItemRef(r).num)),
  ),
  ...(map.crossCutting?.capabilities ?? []).flatMap((c) =>
    (c.items ?? []).map((r) => resolveItemRef(r).num),
  ),
  ...sideTracks.flatMap((t) => (t.items ?? []).map((r) => resolveItemRef(r).num)),
]);
const unmapped = [...byNum.keys()]
  .filter((n) => !mappedNums.has(n))
  .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
/**
 * Where an id's own lane prefix and its declared lane cell disagree — item
 * T-737.
 *
 * This REPORTS and does not resolve, deliberately. `T-458` is filed twice: one
 * filing is a Files-pane surface that declares lane `U`, where the id is the
 * wrong one; the other is deploy-register reconciliation that declares lane
 * `D`, where the cell is the wrong one. The two go opposite ways, so which
 * side is authoritative is a per-row filing call and not a rule this generator
 * gets to invent. Picking one silently is what produced the state being
 * reported: a `T-` id printing under `### Lane D` while the Claude lane's three
 * sections read empty.
 *
 * Reported over every id, mapped or not, so an id the queue cannot offer yet
 * still shows its contradiction.
 */
const laneOfNum = (defs) => (defs ?? []).map((d) => d.lane).find(Boolean) ?? "";
const KNOWN_LANES = new Set(["D", "U", "C", "T"]);
const laneContradictions = [...byNum.entries()]
  .map(([num, defs]) => ({ num, lane: laneOfNum(defs).trim(), prefix: lanePrefixOf(num) }))
  .filter((r) => r.prefix && KNOWN_LANES.has(r.lane) && r.lane !== r.prefix)
  .sort((a, b) => String(a.num).localeCompare(String(b.num), undefined, { numeric: true }));
const laneUnusable = [...byNum.entries()]
  .map(([num, defs]) => ({ num, lane: laneOfNum(defs).trim() }))
  .filter((r) => r.lane && !KNOWN_LANES.has(r.lane))
  .sort((a, b) => String(a.num).localeCompare(String(b.num), undefined, { numeric: true }));
/**
 * Rows carrying a BARE pipe inside a code span — item T-738. The escaped
 * pipes are handled by `splitTableRow` and never appear here; these are the
 * rows GitHub itself renders shifted, so the repair is to escape the pipe in
 * the backlog. Named rather than absorbed, because a parser quietly
 * disagreeing with the document its readers see is the failure mode this
 * generator exists against.
 */
const barePipeRows = [...byNum.entries()]
  .filter(([, defs]) => (defs ?? []).some((d) => d.barePipeInCodeSpan))
  .map(([num]) => num)
  .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

const tracks = sideTracks.map((t) => ({
  ...t,
  built: (t.items ?? []).map(buildItem).filter(Boolean),
}));

/* ------------------------------------------------------------ reconcile */

const report = {
  generatedAt: new Date().toISOString(),
  boardOutcomes: boardOutcomes.length,
  boardClaims: boardClaims.length,
  backlogItemNumbers: byNum.size,
  backlogDefinitions: items.length,
  duplicateNums,
  unmapped,
  // Item T-746. The population measured independently of the extractor, and
  // the ids it could not parse. Written as ARRAYS, never as counts alone: the
  // queue has to be able to name them, and `build-execution-queue.mjs`
  // renders "not recorded" rather than zero when a field is absent.
  itemPositionIds: itemPositionPopulation
    .map(displayItemId)
    .map((id) => id.replace(/^#/, ""))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  unparsedItemIds: unparsedItemIds.map((id) => String(id)),
  unrecognisedItemTableKinds: [...unrecognisedItemTableKinds.entries()].map(([shape, v]) => ({
    shape,
    kind: v.kind,
    ids: [...new Set(v.ids)],
  })),
  laneContradictions,
  laneUnusable,
  stagesWithNothingMapped: stages.filter((s) => s.items.length === 0 && s.outcomeRows.length === 0 && s.stageClaims.length === 0).map((s) => s.id),
  rungCounts: stages.reduce((acc, s) => { acc[s.rung.key] = (acc[s.rung.key] ?? 0) + 1; return acc; }, {}),
};

console.log(`Generated from ${map.sources.board}, ${map.sources.backlog} and ${map.sources.claims}`);
console.log(`  board outcomes parsed:    ${report.boardOutcomes}`);
console.log(`  board claim rows parsed:  ${report.boardClaims}`);
console.log(`  execution claims parsed:  ${executionClaims.length}`);
console.log(`  backlog item ids:         ${report.backlogItemNumbers} (${report.backlogDefinitions} definitions)`);
/**
 * Collision rate, as a first-class number with a trend.
 *
 * A bare count could not answer the question that matters — is this getting
 * worse? The falling completion figure was the only signal, and inferring a
 * cause from a number that moves for half a dozen reasons is how this went
 * unnoticed for so long. The history file makes the trend explicit.
 *
 * It reports; it does not gate. A generator that refuses to run because a
 * number rose is a generator someone stops running.
 */
const collisionRate = report.backlogItemNumbers
  ? (collisions.length / report.backlogItemNumbers) * 100
  : 0;
const HISTORY = path.join(OPERATOR_ROOT, "id-collision-history.json");
let collisionHistory = [];
try {
  collisionHistory = JSON.parse(fs.readFileSync(HISTORY, "utf8"));
  if (!Array.isArray(collisionHistory)) collisionHistory = [];
} catch {
  collisionHistory = [];
}
const previous = collisionHistory.length
  ? collisionHistory[collisionHistory.length - 1]
  : null;
const trend = previous
  ? (() => {
      const delta = collisions.length - previous.collisions;
      if (delta === 0) return "unchanged since last run";
      return `${delta > 0 ? "+" : ""}${delta} since last run (was ${previous.collisions} of ${previous.ids})`;
    })()
  : "no previous run recorded";

console.log(
  `  ids with a collision:     ${collisions.length} of ${report.backlogItemNumbers} ` +
    `(${collisionRate.toFixed(1)}%) — ${trend}`,
);
if (collisions.length) {
  console.log(`      ${collisions.map((d) => displayItemId(d.num)).join(", ")}`);
}
collisionHistory.push({
  at: new Date().toISOString(),
  ids: report.backlogItemNumbers,
  collisions: collisions.length,
  rate: Number(collisionRate.toFixed(2)),
});
// Keep the tail only. This is a trend line, not an archive.
fs.writeFileSync(
  HISTORY,
  JSON.stringify(collisionHistory.slice(-40), null, 2) + "\n",
);
console.log(`  numbers with status notes: ${updatedNums.length} (same item, appended updates \u2014 not ambiguous)`);
console.log(`  not placed on the map:    ${unmapped.length}${unmapped.length ? " -> " + unmapped.join(", ") : ""}`);
console.log(
  `  lane contradicts its id:  ${laneContradictions.length}` +
    (laneContradictions.length
      ? " -> " + laneContradictions.map((r) => `${displayItemId(r.num)} says lane ${r.lane}`).join(", ")
      : ""),
);
console.log(
  `  lane cell is not a lane:  ${laneUnusable.length}` +
    (laneUnusable.length ? " -> " + laneUnusable.map((r) => displayItemId(r.num)).join(", ") : ""),
);

/**
 * Item T-750. Deduped because a capability list may cite the same id as its
 * parent stage, so `buildItem` runs more than once for one reference and would
 * otherwise report one withheld verdict several times.
 */
const laneScopedVerdictsWithheld = [
  ...new Map(
    laneScopedVerdictsUnattributed.map((v) => [`${v.num}(${v.laneScope})|${v.definedIn ?? ""}`, v]),
  ).values(),
];
console.log(
  `  verdict lane suffix unmatched: ${laneScopedVerdictsWithheld.length}` +
    (laneScopedVerdictsWithheld.length
      ? " -> " + laneScopedVerdictsWithheld
        .map((v) => `${v.num}(${v.laneScope}) over an item in lane ${v.itemLane ?? "?"}`)
        .join(", ")
        + "  (verdict WITHHELD: it names a lane no definition of that id answers to)"
      : ""),
);
console.log(
  `  bare pipe in a code span: ${barePipeRows.length}` +
    (barePipeRows.length
      ? " -> " + barePipeRows.map((n) => displayItemId(n)).join(", ")
        + "  (malformed in the backlog, not here \u2014 GitHub shifts these rows too; escape the pipe)"
      : ""),
);

// An unmapped id is invisible to the queue: it is not offered to any agent,
// and the only sign was this line in a wall of output that nothing required
// anyone to read. Two ids reached that state in one afternoon, and the agent
// who filed one of them mapped it in the superseded copy of the structure
// map and never learned the edit did nothing.
//
// So it fails the run. The board is still written first, because a report
// that refuses to produce output teaches people to stop running it -- the
// file is there to read, and the status says it is incomplete.
//
// This starts clean: 0 unmapped at the time it was added. A gate that
// arrives already failing is the pattern this repository keeps removing.
if (unmapped.length > 0) {
  console.error(
    `\nunmapped: ${unmapped.length} backlog id(s) are not in the structure map, ` +
      `so the queue cannot offer them: ${unmapped.join(", ")}.\n` +
      "Add them to scripts/exec/source-stage-map.json -- the map is repo-owned, " +
      "so editing a copy in the operator root changes nothing.",
  );
  process.exitCode = 1;
}
/*
 * Item T-746. Printed next to the population it qualifies, because the line
 * above it — `backlog item ids` — is the number every later count is measured
 * against, and until now it was the only number on offer.
 */
console.log(
  `  in item position:         ${report.itemPositionIds.length} scanned independently of the reader`
    + `; ${report.unparsedItemIds.length} in a shape it cannot parse`
    + (report.unparsedItemIds.length
      ? " -> " + report.unparsedItemIds.map((id) => displayItemId(id)).join(", ")
      : ""),
);
if (report.unrecognisedItemTableKinds.length > 0) {
  for (const row of report.unrecognisedItemTableKinds) {
    console.log(
      `  unrecognised table kind:  \`${row.shape}\` -> not read as items`
        + ` (${row.ids.length} row${row.ids.length === 1 ? "" : "s"}: ${row.ids.join(", ")})`,
    );
  }
}
console.log(`  stage rungs:              ${JSON.stringify(report.rungCounts)}`);
/*
 * An ambiguous id the map cites is silently suppressed: it cannot promote a
 * stage or cover a capability, because citing it is genuinely ambiguous. That
 * silence is how proof-weighted completion fell from 26.0% to 23.4% with no
 * work undone, and finding the cause took a measurement. Report it as its own
 * number so the next drop announces its reason instead of being inferred from
 * a falling percentage.
 */
const suppressedCitations = [];
for (const stage of stages) {
  for (const item of stage.items) {
    if (item.ambiguous) suppressedCitations.push(`stage ${stage.id} item #${item.num}`);
  }
  for (const cap of stage.capabilities) {
    for (const item of cap.items) {
      if (item.ambiguous) {
        suppressedCitations.push(
          `stage ${stage.id} capability "${cap.capability.slice(0, 40)}" item #${item.num}`,
        );
      }
    }
  }
}
for (const cap of crossCutting?.capabilities ?? []) {
  for (const item of cap.items) {
    if (item.ambiguous) {
      suppressedCitations.push(
        `cross-cutting "${cap.capability.slice(0, 40)}" item #${item.num}`,
      );
    }
  }
}
if (suppressedCitations.length > 0) {
  console.log(
    `  SUPPRESSED CITATIONS:     ${suppressedCitations.length} — the map cites these ids and each is claimed by more than one definition, so none counts toward a stage or a capability. Pin the one you mean with { num, definedIn }.`,
  );
  for (const c of suppressedCitations) console.log(`      ${c}`);
}

console.log(
  `  vision capabilities:      ${visionCoverage.covered}/${visionCoverage.total} have any backlog item; ` +
    `${visionCoverage.uncovered} have none`,
);
console.log(
  `  vision completion:        ${(visionCoverage.completion * 100).toFixed(1)}% proof-weighted ` +
    `(NOT backlog completion — a capability nobody has ticketed counts as zero)`,
);

/* ----------------------------------------------------------------- html */

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function stripMd(s) {
  return String(s ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/~~/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function parseBacklogId(value) {
  const token = stripMd(value).replace(/^#/, "").trim();
  if (/^\d+$/.test(token)) return Number(token);
  if (/^[DUCT]-\d{3}$/.test(token)) return token;
  return null;
}

function displayItemId(id) {
  return typeof id === "number" ? `#${id}` : String(id);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const RUNG_CLASS = { open: "r-open", pr: "r-pr", merged: "r-merged", deployed: "r-deployed", proven: "r-proven" };
const RUNG_LABEL = Object.fromEntries(LADDER.map((l) => [l.key, l.label]));

function rungChip(r) {
  return `<span class="pill ${RUNG_CLASS[r.key]}" title="${esc(r.why)}">${esc(RUNG_LABEL[r.key])}${r.rung ? ` · rung ${r.rung}` : ""}</span>`;
}

function itemRow(i) {
  return `<tr>
    <td class="num">${i.ambiguous ? `<span class="dupe" title="This id is defined ${i.sections.length} times: ${esc(i.sections.join(" / "))}">${esc(displayItemId(i.num))} ⚠</span>` : esc(displayItemId(i.num))}</td>
    <td>${esc(i.title).slice(0, 230)}</td>
    <td>${i.lane ? `<span class="lane">${esc(i.lane)}</span>` : "—"}</td>
    <td>${rungChip(i.rung)}</td>
    <td>${i.blocker ? esc(i.blocker.say) : "—"}</td>
    <td>${esc(i.acceptance).slice(0, 220) || "—"}</td>
  </tr>`;
}

// Which other stages each stage shares a board outcome with.
const sharedWith = {};
for (const s of stages) {
  const others = stages.filter(
    (o) => o.id !== s.id && o.boardOutcomeMatch === s.boardOutcomeMatch,
  );
  sharedWith[s.id] = others.map((o) => String(o.id).padStart(2, "0"));
}

function stageBlock(s) {
  const nextActions = s.nextGate.length ? s.nextGate : s.items.map((i) => i.acceptance).filter(Boolean);
  return `<section class="stage" id="s${s.id}">
    <div class="idx">${String(s.id).padStart(2, "0")}</div>
    <div class="stage-body">
      <div class="stage-head"><h3>${esc(s.name)}</h3>${rungChip(s.rung)}${
        s.bestRung.rung > s.rung.rung
          ? `<span class="spread">floor of ${s.items.filter((i) => !i.ambiguous).length} mapped item${s.items.filter((i) => !i.ambiguous).length === 1 ? "" : "s"} · best reached ${esc(RUNG_LABEL[s.bestRung.key])} · ${s.unprovenCount} still below signed-in proof</span>`
          : ""
      }</div>
      <p class="vision">${esc(s.vision)}</p>
      <div class="facts">
        <div class="fact"><span class="lab">Mapped IDs</span>${s.ids ? `<span class="ids">${esc(s.ids)}</span>` : "<em>none on the board</em>"}${s.items.length ? `<span class="ids"> · items ${s.items.map((i) => displayItemId(i.num)).join(", ")}</span>` : ""}${sharedWith[s.id]?.length ? `<br><span class="shared">board outcome reads ${esc(RUNG_LABEL[s.outcomeRung.key])}, but it is shared with stage${sharedWith[s.id].length > 1 ? "s" : ""} ${sharedWith[s.id].join(", ")} — not attributed here</span>` : ""}</div>
        <div class="fact"><span class="lab">Owner</span>${s.owners.length ? esc(s.owners.join(" · ")) : "<em>unassigned in source</em>"}</div>
        <div class="fact"><span class="lab">Blocker</span>${s.blocker ? esc(s.blocker.say) : "<em>none stated</em>"}</div>
      </div>
      <div class="fact"><span class="lab">Next demonstrable action <em>(from the source's own acceptance gate)</em></span>
        ${nextActions.length ? `<ul>${nextActions.map((n) => `<li>${esc(n).slice(0, 400)}</li>`).join("")}</ul>` : "<p class='none'>No acceptance gate is written for this stage in the source documents. That is the finding, not an omission of this page.</p>"}
      </div>
      ${s.narrativeLines?.length ? `<div class="fact"><span class="lab">Board narrative naming this stage's ids <em>(${esc(s.ownedIds.slice(0, 12).join(", "))}${s.ownedIds.length > 12 ? "\u2026" : ""})</em></span><ul>${s.narrativeLines.slice(-6).map((l) => `<li>${esc(stripMd(l)).slice(0, 320)}</li>`).join("")}</ul></div>` : ""}
      ${s.stageClaims.length ? `<div class="fact"><span class="lab">Execution claim evidence <em>(${s.stageClaims.length}; highest evidenced rung used)</em></span><ul>${s.stageClaims.slice(-3).map((entry) => `<li><span class="ids">${esc(entry.timestamp)}</span> ${esc(stripMd(entry.text)).slice(0, 420)}</li>`).join("")}</ul></div>` : ""}
      ${s.rung.quote ? `<p class="derived"><span class="lab">Rung derived from</span> “${esc(s.rung.quote)}”</p>` : ""}
      ${s.items.length ? `<div class="scroll"><table><thead><tr><th>#</th><th>Item</th><th>Lane</th><th>Rung</th><th>Blocker</th><th>Acceptance</th></tr></thead><tbody>${s.items.map(itemRow).join("")}</tbody></table></div>` : ""}
    </div>
  </section>`;
}

const html = `<title>Source New Event Board</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap">
<style>
:root{
  --paper:#FDFCFA;--panel:#FFF;--ink:#16130F;--muted:#6B6156;--faint:#8C8278;
  --rule:#E3DDD3;--rule-soft:#EFEAE2;--navy:#1B2B5C;--navy-soft:#EEF1F8;
  --r-open:#9B2C2C;--r-open-bg:#FBECEC;
  --r-pr:#A8760B;--r-pr-bg:#FBF2DE;
  --r-merged:#6B6156;--r-merged-bg:#F2EEE8;
  --r-deployed:#2F6F8F;--r-deployed-bg:#E9F2F6;
  --r-proven:#1F6B4A;--r-proven-bg:#E9F4EE;
  --serif:"Fraunces","Century Schoolbook",Georgia,serif;
  --sans:"Inter",-apple-system,"Segoe UI",Arial,sans-serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:#14120F;--panel:#1B1815;--ink:#F2EDE6;--muted:#A89E93;--faint:#8C8278;
  --rule:#322D27;--rule-soft:#262220;--navy:#A9BCEA;--navy-soft:#1E2438;
  --r-open:#E08A8A;--r-open-bg:#2E1A1A;--r-pr:#E0B24A;--r-pr-bg:#2C2413;
  --r-merged:#A89E93;--r-merged-bg:#24211D;--r-deployed:#7FBAD6;--r-deployed-bg:#16262E;
  --r-proven:#6FC79B;--r-proven-bg:#18291F;}}
:root[data-theme="dark"]{
  --paper:#14120F;--panel:#1B1815;--ink:#F2EDE6;--muted:#A89E93;--faint:#8C8278;
  --rule:#322D27;--rule-soft:#262220;--navy:#A9BCEA;--navy-soft:#1E2438;
  --r-open:#E08A8A;--r-open-bg:#2E1A1A;--r-pr:#E0B24A;--r-pr-bg:#2C2413;
  --r-merged:#A89E93;--r-merged-bg:#24211D;--r-deployed:#7FBAD6;--r-deployed-bg:#16262E;
  --r-proven:#6FC79B;--r-proven-bg:#18291F;}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1080px;margin:0 auto;padding:44px 24px 96px}
header.masthead{border-bottom:2px solid var(--ink);padding-bottom:20px}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
h1{font-family:var(--serif);font-weight:600;font-size:clamp(30px,4.4vw,42px);line-height:1.08;margin:0 0 12px;text-wrap:balance;letter-spacing:-.015em}
.standfirst{font-size:16px;color:var(--muted);max-width:64ch;margin:0}
.meta-row{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:18px;font-size:12px;color:var(--faint)}
.meta-row b{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums}
h2{font-family:var(--serif);font-weight:600;font-size:25px;letter-spacing:-.01em;margin:56px 0 6px}
h2+.section-note{color:var(--muted);font-size:14px;margin:0 0 22px;max-width:72ch}
h3{font-size:15px;font-weight:600;margin:0}
.rail{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:4px;margin:4px 0 8px}
.gate{background:var(--panel);border:1px solid var(--rule);border-top:3px solid var(--tone,var(--rule));padding:10px 9px 12px;min-height:116px;display:flex;flex-direction:column;gap:6px;text-decoration:none;color:inherit}
.gate:hover{border-color:var(--muted)}
.gate:focus-visible{outline:2px solid var(--navy);outline-offset:2px}
.gate .n{font-family:var(--serif);font-size:12px;font-weight:700;color:var(--faint);font-variant-numeric:tabular-nums}
.gate .nm{font-size:12.5px;font-weight:600;line-height:1.25}
.gate .state{margin-top:auto;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--tone)}
.t-open{--tone:var(--r-open)}.t-pr{--tone:var(--r-pr)}.t-merged{--tone:var(--r-merged)}.t-deployed{--tone:var(--r-deployed)}.t-proven{--tone:var(--r-proven)}
.rail-legend{display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:var(--muted);padding-top:10px;border-top:1px solid var(--rule-soft)}
.swatch{display:inline-block;width:9px;height:9px;margin-right:6px}
.stage{background:var(--panel);border:1px solid var(--rule);padding:18px 20px;margin-bottom:10px;display:grid;grid-template-columns:30px 1fr;gap:0 16px}
.stage .idx{font-family:var(--serif);font-size:19px;font-weight:700;color:var(--faint);font-variant-numeric:tabular-nums;line-height:1.2}
.stage-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin-bottom:4px}
.stage-body{display:grid;gap:10px}
.vision{color:var(--muted);font-size:13.5px;max-width:78ch;margin:0}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px 20px}
.fact{font-size:13px}
.fact .lab{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--faint);display:block;margin-bottom:3px}
.fact .lab em{text-transform:none;letter-spacing:0;font-weight:500}
.fact ul{margin:0;padding-left:16px}.fact li{margin-bottom:3px}
.fact .none{margin:0;color:var(--r-open);font-size:13px}
.shared{font-size:11.5px;color:var(--r-pr);font-style:italic}
.spread{font-size:11.5px;color:var(--muted);font-style:italic;margin-left:8px}
.derived{font-size:12px;color:var(--faint);margin:0;font-style:italic}
.derived .lab{font-style:normal;display:inline;margin-right:5px}
.pill{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:2px 7px;border:1px solid currentColor;white-space:nowrap}
.r-open{color:var(--r-open);background:var(--r-open-bg)}
.r-pr{color:var(--r-pr);background:var(--r-pr-bg)}
.r-merged{color:var(--r-merged);background:var(--r-merged-bg)}
.r-deployed{color:var(--r-deployed);background:var(--r-deployed-bg)}
.r-proven{color:var(--r-proven);background:var(--r-proven-bg)}
.ids{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11.5px;color:var(--muted)}
.lane{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--muted)}
.dupe{color:var(--r-open);font-weight:600}
.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:13px;min-width:640px}
th,td{text-align:left;padding:8px 11px;border-bottom:1px solid var(--rule-soft);vertical-align:top}
th{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--faint);border-bottom:1px solid var(--rule)}
td.num{font-variant-numeric:tabular-nums;white-space:nowrap}
tbody tr:last-child td{border-bottom:1px solid var(--rule)}
.callout{border:1px solid var(--rule);border-left:3px solid var(--navy);background:var(--navy-soft);padding:16px 20px;margin:22px 0}
.callout.warn{border-left-color:var(--r-open);background:var(--r-open-bg)}
.callout h3{font-family:var(--serif);font-size:17px;font-weight:600;margin-bottom:6px}
.callout p{margin:0 0 8px;font-size:14px}.callout p:last-child{margin-bottom:0}
.ladder{display:grid;gap:2px;margin:0 0 14px}
.rung{display:grid;grid-template-columns:26px 1fr auto;align-items:center;gap:12px;padding:9px 14px;background:var(--panel);border:1px solid var(--rule);font-size:13.5px}
.rung .step{font-family:var(--serif);font-size:12px;font-weight:700;color:var(--faint);font-variant-numeric:tabular-nums}
.rung.reached{border-left:3px solid var(--r-deployed)}
.rung.owed{border-left:3px solid var(--r-open);background:var(--r-open-bg)}
.rung .mark{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.rung.reached .mark{color:var(--r-deployed)}.rung.owed .mark{color:var(--r-open)}
footer{margin-top:64px;padding-top:18px;border-top:1px solid var(--rule);font-size:12px;color:var(--faint);max-width:80ch}
footer p{margin:0 0 7px}
code{font-family:ui-monospace,Menlo,monospace;font-size:.92em}
a{color:var(--navy)}
@media (max-width:860px){.rail{grid-template-columns:repeat(3,minmax(0,1fr))}.stage{grid-template-columns:1fr;gap:8px}.stage .idx{font-size:14px}}
</style>

<div class="wrap">
<header class="masthead">
  <p class="eyebrow">Generated view · ${esc(report.generatedAt.slice(0, 16).replace("T", " "))} UTC</p>
  <h1>Source New Event: the nine-stage lifecycle, read from execution evidence</h1>
  <p class="standfirst">
    This page holds no status of its own. Every rung, owner, blocker and next action below is a
    phrase lifted from <code>${esc(map.sources.board)}</code>, <code>${esc(map.sources.backlog)}</code>
    or <code>${esc(map.sources.claims)}</code>,
    shown with the rule that matched it. Regenerate with <code>node scripts/exec/build-source-board.mjs --operator-root &lt;dir&gt;</code>.
  </p>
  <div class="meta-row">
    <span>Vision recorded <b>${esc(map.visionRecorded)}</b></span>
    <span>Board outcomes parsed <b>${report.boardOutcomes}</b></span>
    <span>Execution claims parsed <b>${executionClaims.length}</b></span>
    <span>Backlog item ids <b>${report.backlogItemNumbers}</b></span>
    <span>Duplicate ids <b>${duplicateNums.length}</b></span>
    <span>Not placed on the map <b>${unmapped.length}</b></span>
  </div>
</header>

<h2>How to read a rung</h2>
<p class="section-note">
  Rung is assigned only when a source document states it <em>in words</em>. A PR number or a deploy
  run alone never advances a rung, and nothing on this page is ever promoted to
  <strong>signed-in proven</strong> by the generator — that rung is only reported when a document
  says the signed-in check passed, and it is vetoed whenever the same text says the proof is
  pending or owed.
</p>
<div class="scroll"><table>
<thead><tr><th>Rung</th><th>Reported when the source says</th><th>Never</th></tr></thead>
<tbody>
<tr><td class="num">7 ${rungChip({ key: "proven", rung: 7, why: "" })}</td><td>“live-proven”, or a signed-in check that passed</td><td>Inferred. Vetoed if the same text says pending or owed</td></tr>
<tr><td class="num">6 ${rungChip({ key: "deployed", rung: 6, why: "" })}</td><td>“deployed”</td><td>Read as proven</td></tr>
<tr><td class="num">5 ${rungChip({ key: "merged", rung: 5, why: "" })}</td><td>“merged” / “squash-merged”</td><td>Read as deployed</td></tr>
<tr><td class="num">4 ${rungChip({ key: "pr", rung: 4, why: "" })}</td><td>a PR number, with no merge stated</td><td>Read as merged</td></tr>
<tr><td class="num">0 ${rungChip({ key: "open", rung: 0, why: "" })}</td><td>no proof language at all</td><td>Assumed started</td></tr>
</tbody></table></div>

<h2>The nine stages</h2>
<p class="section-note">
  Stage order and the ID mapping come from <code>source-stage-map.json</code>, which declares
  structure only — the generator refuses to run if a status key appears in it.
</p>

<nav class="rail" aria-label="Lifecycle stages">
${stages.map((s) => `<a class="gate t-${s.rung.key}" href="#s${s.id}"><span class="n">${String(s.id).padStart(2, "0")}</span><span class="nm">${esc(s.name)}</span><span class="state">${esc(RUNG_LABEL[s.rung.key])}</span></a>`).join("\n")}
</nav>
<p class="rail-legend">
${LADDER.slice().reverse().map((l) => `<span><span class="swatch" style="background:var(--r-${l.key})"></span>${esc(l.label)}</span>`).join("\n")}
</p>

${stages.map(stageBlock).join("\n")}

<h2>How far anything is proven</h2>
<p class="section-note">The ladder the team already uses. Highest rung any stage reaches: <strong>${esc(RUNG_LABEL[stages.reduce((a, s) => (s.rung.rung > a.rung.rung ? s : a)).rung.key])}</strong>.</p>
<div class="ladder">
  <div class="rung reached"><span class="step">1</span><span>Planned</span><span class="mark">reached</span></div>
  <div class="rung reached"><span class="step">2</span><span>Branch</span><span class="mark">reached</span></div>
  <div class="rung reached"><span class="step">3</span><span>Local tests, with a mutation proving each guard fails when broken</span><span class="mark">reached</span></div>
  <div class="rung reached"><span class="step">4</span><span>PR and CI green</span><span class="mark">reached</span></div>
  <div class="rung reached"><span class="step">5</span><span>Merged SHA</span><span class="mark">reached</span></div>
  <div class="rung reached"><span class="step">6</span><span>Deployed — ACA digest matches the 100%-traffic revision, health passing</span><span class="mark">reached</span></div>
  <div class="rung owed"><span class="step">7</span><span>Signed-in acceptance, and opposite-tenant refusal</span><span class="mark">owed</span></div>
</div>

${tracks.map((t) => `<h2>${esc(t.name)} — ${t.built.length} item${t.built.length === 1 ? "" : "s"}, no lifecycle stage</h2>
<p class="section-note">${esc(t.why)}</p>
<div class="scroll"><table>
<thead><tr><th>#</th><th>Item</th><th>Lane</th><th>Rung</th><th>Blocker</th><th>Acceptance</th></tr></thead>
<tbody>${t.built.map(itemRow).join("")}</tbody>
</table></div>`).join("\n")}

<h2>Resolving a duplicated item id</h2>
<p class="section-note">
  ${duplicateNums.length} item ids are defined more than once across the backlog's sections,
  because appended batches restarted numbering over an existing range. They are deliberately
  <strong>not renumbered</strong> — claims, PRs and decisions already cite them, and changing an
  identifier that other records point at trades one ambiguity for a worse one. Instead, here is
  what each number resolves to. Cite a number <em>with its section</em>.
</p>
<div class="scroll"><table>
<thead><tr><th>#</th><th>Defined in</th><th>Which item that is</th></tr></thead>
<tbody>
${duplicateNums.flatMap((d) => d.defs.map((def, i) => `<tr>
  <td class="num">${i === 0 ? `<span class="dupe">${esc(displayItemId(d.num))}</span> <span class="ids">×${d.count}</span>` : ""}</td>
  <td class="ids">${esc(def.section)}</td>
  <td>${esc(def.title) || "<em>(no title parsed)</em>"}</td>
</tr>`)).join("")}
</tbody></table></div>

<h2>Reconciliation</h2>
<p class="section-note">What the generator could not place. Shown rather than dropped, because a view that quietly discards its inputs is how the tracking broke in the first place.</p>
<div class="callout${duplicateNums.length || unmapped.length ? " warn" : ""}">
  <h3>${duplicateNums.length + unmapped.length} thing${duplicateNums.length + unmapped.length === 1 ? "" : "s"} need attention in the source documents</h3>
  <p><strong>Duplicate item ids (${duplicateNums.length}).</strong> ${duplicateNums.length ? duplicateNums.map((d) => `<code>${esc(displayItemId(d.num))}</code> defined ${d.count}× (${esc(d.sections.join(", "))})`).join("; ") : "None."} A reader citing one of these ids cannot be understood without also naming the section.</p>
  <p><strong>Not placed on any stage or the platform track (${unmapped.length}).</strong> ${unmapped.length ? unmapped.map((n) => `<code>#${n}</code>`).join(" ") : "None."} Either map them in <code>source-stage-map.json</code> or accept that they are cross-cutting.</p>
  <p><strong>Stages with nothing mapped (${report.stagesWithNothingMapped.length}).</strong> ${report.stagesWithNothingMapped.length ? report.stagesWithNothingMapped.map((n) => `<code>stage ${n}</code>`).join(" ") : "None."} A stage with no mapped work is not evidence that the stage is fine.</p>
</div>

<footer>
  <p><strong>What this page is.</strong> A generated join across ${esc(map.sources.board)}, ${esc(map.sources.backlog)} and ${esc(map.sources.claims)}, plus a declared structure map. It is not a source of truth and holds no status of its own. Change the source documents and regenerate; editing the HTML by hand defeats the point.</p>
  <p><strong>What the generator will not do.</strong> Infer acceptance from a PR number or a deploy line, promote anything to signed-in proven, or hide an input it could not place. Two further refusals, both added after they were caught reporting progress that had not happened: an agent's own claim-log line never moves a stage up the ladder — it is an agent narrating itself, and four stages read <em>Deployed</em> on that basis alone, two of them with no backlog item mapped at all. And a stage's rung is the <strong>floor</strong> of its mapped items, not the best any one of them reached; taken as the best, one stage read <em>Signed-in proven</em> while two of its four items were still below proof. The best rung reached is still shown, beside the floor, never as the headline.</p>
  <p><strong>On the adoption number.</strong> The ${esc(map.adoptionClaim.figure)} saving in the vision is a <em>${esc(map.adoptionClaim.qualifier)}</em>: ${esc(map.adoptionClaim.why)}. It should not be quoted to a client as achieved.</p>
  <p><strong>Known limit.</strong> Rung detection is keyword-based over prose. A document that describes a deploy in unusual wording will read lower than it is, and a stage whose evidence lives only in ${esc(map.sources.scope)} — last updated ${esc(map.visionRecorded)} and not parsed here — will read as open. Both fail toward understating progress, which is the safer direction.</p>
</footer>
</div>
`;

// --json: the same derivation the page uses, as data. Keeps any status read
// from drifting away from what the page shows.
if (process.argv.includes("--json")) {
  const summary = {
    generatedAt: report.generatedAt,
    sources: map.sources,
    // Consumed by build-execution-queue.mjs to refuse a stale summary.
    inputs: summaryInputs,
    // Consumed by build-execution-queue.mjs to refuse a summary written by a
    // superseded copy of this generator (item T-711).
    generator: summaryGenerator,
    vision: {
      ...visionCoverage,
      crossCutting: crossCutting
        ? {
            ...crossCutting.coverage,
            capabilities: crossCutting.capabilities.map((c) => ({
              capability: c.capability,
              covered: c.covered,
              rungLabel: RUNG_LABEL[c.rung.key],
              declaredIds: c.declaredIds,
            })),
          }
        : null,
      note:
        "Proof-weighted completion of the DECLARED vision scope, not of the " +
        "backlog. A capability with no declared backlog item counts as zero. " +
        "Credit per capability: merged 5/7, deployed 6/7, signed-in proven 1; " +
        "anything below a merge counts as nothing delivered.",
    },
    stages: stages.map((s) => ({
      id: s.id,
      name: s.name,
      rung: s.rung.rung,
      rungLabel: RUNG_LABEL[s.rung.key],
      rungWhy: s.rung.why,
      bestRung: s.bestRung.rung,
      bestRungLabel: RUNG_LABEL[s.bestRung.key],
      blocker: s.blocker?.say ?? null,
      itemCount: s.items.length,
      unprovenCount: s.unprovenCount,
      coverage: s.coverage,
      capabilities: s.capabilities.map((c) => ({
        capability: c.capability,
        covered: c.covered,
        rungLabel: RUNG_LABEL[c.rung.key],
        credit: Number(c.credit.toFixed(3)),
        declaredIds: c.declaredIds,
      })),
      claimCount: s.stageClaims.length,
      latestClaim: s.latestStageClaim ? {
        timestamp: s.latestStageClaim.timestamp,
        text: stripMd(s.latestStageClaim.text),
      } : null,
      items: s.items.map((i) => ({
        num: i.num, rung: i.rung.rung, rungLabel: RUNG_LABEL[i.rung.key],
        blocker: i.blocker?.say ?? null, lane: i.lane || null,
        title: i.title, acceptance: i.acceptance || null, ambiguous: i.ambiguous,
        substantiveSections: i.ambiguous ? i.substantiveSections : undefined,
      })),
    })),
    tracks: tracks.map((t) => ({
      name: t.name,
      itemCount: t.built.length,
      byRung: t.built.reduce((a, i) => { a[RUNG_LABEL[i.rung.key]] = (a[RUNG_LABEL[i.rung.key]] ?? 0) + 1; return a; }, {}),
      blockers: t.built.reduce((a, i) => { if (i.blocker) a[i.blocker.say] = (a[i.blocker.say] ?? 0) + 1; return a; }, {}),
      // Per-item detail, so a status question about one number can be answered
      // from the same derivation the page uses instead of by eye.
      items: t.built.map((i) => ({
        num: i.num,
        rung: i.rung.rung,
        rungLabel: RUNG_LABEL[i.rung.key],
        blocker: i.blocker?.say ?? null,
        quote: i.rung.quote || null,
        lane: i.lane || null,
        title: i.title,
        acceptance: i.acceptance || null,
        ambiguous: i.ambiguous,
        substantiveSections: i.ambiguous ? i.substantiveSections : undefined,
      })),
    })),
    allItemsByRung: [...stages.flatMap((s) => s.items), ...tracks.flatMap((t) => t.built)]
      .reduce((a, i) => { a[RUNG_LABEL[i.rung.key]] = (a[RUNG_LABEL[i.rung.key]] ?? 0) + 1; return a; }, {}),
    allBlockers: [...stages.flatMap((s) => s.items), ...tracks.flatMap((t) => t.built)]
      .reduce((a, i) => { if (i.blocker) a[i.blocker.say] = (a[i.blocker.say] ?? 0) + 1; return a; }, {}),
    duplicateNums,
    unmapped,
    // Item T-746. The queue renders these; a MISSING FIELD IS NOT A ZERO
    // there, so they are written on every run including at zero.
    itemPositionIds: report.itemPositionIds,
    unparsedItemIds: report.unparsedItemIds,
    unrecognisedItemTableKinds: report.unrecognisedItemTableKinds,
    laneContradictions,
    laneUnusable,
    // Item T-750. A MISSING FIELD IS NOT A ZERO, so this is written on every
    // run including at zero -- the same rule item T-746 set for the residual.
    laneScopedVerdictsUnattributed: laneScopedVerdictsWithheld,
  };
  fs.writeFileSync(path.join(OPERATOR_ROOT, "source-board-summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log("Wrote source-board-summary.json");
}

fs.writeFileSync(OUT, html);
console.log(`\nWrote ${path.relative(OPERATOR_ROOT, OUT)} (${(html.length / 1024).toFixed(1)} KB)`);
} // end runCli

if (isDirectInvocation(import.meta.url)) runCli();
