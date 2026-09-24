#!/usr/bin/env node
/**
 * Generate the claimable work queue from the board summary.
 *
 * The loop stops when an agent has to ask which item is next. This removes
 * that question: the queue is ordered, partitioned by lane, and an agent takes
 * the first unclaimed item in its lane. Two agents in different lanes cannot
 * collide; two in the same lane are separated by the append-only claim log.
 *
 * Nothing here is hand-maintained. Regenerate after every board change:
 *   node scripts/exec/build-source-board.mjs --json &&
 *   node scripts/exec/build-execution-queue.mjs
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { formatQueueProvenance, queueProvenanceStamp } from "./queue-provenance.mjs";
import { isDirectInvocation } from "./cli-entry.mjs";
import { branchesInClaim } from "./fossil-claims.mjs";
import { announcesAbstention } from "./register-time-authority.mjs";

/**
 * Everything below is the CLI, and until item T-728 it ran on `import` (item
 * T-723 gave the shared guard to four modules in this directory and never
 * looked at the two generators). The unknown case answers "imported", which is
 * the inversion `cli-entry.mjs` documents: refusing to run costs one rerun,
 * whereas answering "run" on an unknown case makes every importer execute a
 * generator over whatever documents it happens to be pointed at.
 *
 * **The body keeps its module indentation on purpose.** Re-indenting roughly 800
 * lines would have made this a whole-file rewrite, and two things here are read
 * byte-for-byte: two suites assert this generator's output exactly, and the
 * T-720 queue-provenance stamp is the sha256 of `build-execution-queue.mjs`'s own bytes,
 * which every fixture and the live queue compare against. Left at column zero,
 * the diff is the four lines of the guard, so a reviewer can see the body is
 * unchanged and the moved digest is fully attributable to them.
 */
function runCli() {

const SCRIPT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SELF_PATH = fileURLToPath(import.meta.url);

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const OPERATOR_ROOT = path.resolve(
  valueAfter("--operator-root") ?? process.env.SOURCE_EXECUTION_HOME ?? process.cwd(),
);
const SUMMARY = path.join(OPERATOR_ROOT, "source-board-summary.json");
const CLAIMS = path.join(OPERATOR_ROOT, "EXECUTION_CLAIMS.md");
const OUT = path.join(OPERATOR_ROOT, "EXECUTION_QUEUE.md");

if (!fs.existsSync(SUMMARY)) {
  console.error(
    "Run: node scripts/exec/build-source-board.mjs --json " +
      "--operator-root <dir>   (source-board-summary.json missing)",
  );
  process.exit(1);
}
const s = JSON.parse(fs.readFileSync(SUMMARY, "utf8"));

/*
 * Refuse a summary that no longer describes the documents it was derived from.
 *
 * The failure this closes: the board errors loudly when the summary is missing
 * and said nothing at all when it was merely out of date. Running the board
 * without --json leaves the previous summary on disk, so the queue was rebuilt
 * from it — the board printed "not placed on the map: 0" for a newly-mapped
 * item while the queue omitted that item from every bucket, and neither
 * artifact showed any disagreement. The queue is the file an agent is told not
 * to look past for its next item, so a queue that is quietly wrong is worse
 * than one that is absent.
 *
 * This refuses rather than regenerating the board itself. Rebuilding here
 * would make the queue authoritative over its own input and there would no
 * longer be a single artifact to point at when the two disagree.
 *
 * An unstamped summary — every summary written before this existed — is
 * treated as stale, not as fresh. A guard whose unknown case passes is opt-in,
 * and the first file to reach it is by definition the one that predates it.
 */
function assertSummaryIsCurrent(summary) {
  const boardScript = path.join(SCRIPT_ROOT, "build-source-board.mjs");
  const queueScript = path.join(SCRIPT_ROOT, "build-execution-queue.mjs");
  const regen =
    `node ${boardScript} --json --operator-root ${OPERATOR_ROOT} && ` +
    `node ${queueScript} --operator-root ${OPERATOR_ROOT}`;

  if (!Array.isArray(summary.inputs) || summary.inputs.length === 0) {
    console.error(
      "Refusing to build the queue: source-board-summary.json carries no record of the documents it was derived from,\n" +
        "so it cannot be told apart from one written before the backlog last changed.\n" +
        `Regenerate it:  ${regen}`,
    );
    process.exit(1);
  }

  const drifted = [];
  for (const input of summary.inputs) {
    const full = path.resolve(OPERATOR_ROOT, input.file);
    if (!fs.existsSync(full)) {
      drifted.push(`${input.file} — named in the summary but missing from disk`);
      continue;
    }
    const text = fs.readFileSync(full, "utf8");
    const sha256 = crypto.createHash("sha256").update(text, "utf8").digest("hex");
    if (sha256 !== input.sha256) {
      const delta = Buffer.byteLength(text, "utf8") - (input.bytes ?? 0);
      const size = delta === 0 ? "same size, different content" : `${delta > 0 ? "+" : ""}${delta} bytes`;
      drifted.push(`${input.file} — changed since the summary was generated (${size})`);
    }
  }

  if (drifted.length) {
    console.error(
      `Refusing to build the queue: source-board-summary.json is stale (generated ${summary.generatedAt ?? "at an unrecorded time"}).\n` +
        drifted.map((d) => `  ${d}`).join("\n") +
        "\nThe queue it would print describes a backlog that no longer exists.\n" +
        `Regenerate it:  ${regen}`,
    );
    process.exit(1);
  }
}

assertSummaryIsCurrent(s);

/*
 * Refuse a summary this toolchain did not write (item T-711).
 *
 * `assertSummaryIsCurrent` above answers whether the summary still describes
 * the documents it was derived from. It says nothing about which generator
 * derived it, and before this there was no way to ask.
 *
 * The failure this closes, measured rather than imagined. The board and queue
 * generators moved into this directory under T-507; the superseded copies were
 * left in the operator root and they still run. They have since drifted. On
 * 2026-09-22 the live `EXECUTION_QUEUE.md` -- the file both lanes are told not
 * to look past for their next item -- had been produced by those copies. On
 * identical inputs they offered 61 claimable items where this pair offers 1,
 * and seven of the rows they offered (items 1, 15, 18, 27, 29, 33 and T-507)
 * are recorded CLOSED in the backlog they had just parsed. An agent taking
 * work in lane order re-verified six closed items before noticing. The only
 * tell was the wording of the regenerate block, which nobody reads as
 * provenance.
 *
 * Hash, not path. The same generator legitimately runs from a worktree, from
 * the fixture directory the behavioral suite copies it into, and from a CI
 * checkout; a path comparison would refuse all three. The recorded path is
 * quoted back in the message because it is the evidence that names the copy.
 *
 * The missing case fails closed, deliberately. Every summary written before
 * this existed carries no stamp, and a guard whose unknown case passes is
 * opt-in -- the first file to reach it is by definition the one that predates
 * it. The cost of failing closed is one board rerun; the cost of failing open
 * is the queue this item was filed against.
 */
function assertSummaryProvenance(summary) {
  const boardScript = path.join(SCRIPT_ROOT, "build-source-board.mjs");
  const queueScript = path.join(SCRIPT_ROOT, "build-execution-queue.mjs");
  const regen =
    `node ${boardScript} --json --operator-root ${OPERATOR_ROOT} && ` +
    `node ${queueScript} --operator-root ${OPERATOR_ROOT}`;
  const supersededNote =
    "The superseded copies of these generators left in the operator root still run and have drifted;\n" +
    "a queue built from one of them offers work this backlog no longer holds.";

  if (!fs.existsSync(boardScript)) {
    console.error(
      "Refusing to build the queue: build-source-board.mjs is not beside this script, so the summary's\n" +
        "provenance cannot be checked against the generator that should have written it.\n" +
        `  expected at  ${boardScript}`,
    );
    process.exit(1);
  }

  const expected = crypto
    .createHash("sha256")
    .update(fs.readFileSync(boardScript, "utf8"), "utf8")
    .digest("hex");
  const stamp = summary.generator;

  if (!stamp || typeof stamp.sha256 !== "string") {
    console.error(
      "Refusing to build the queue: source-board-summary.json carries no record of which generator wrote it.\n" +
        `It was generated ${summary.generatedAt ?? "at an unrecorded time"} by a board generator that does not stamp itself.\n` +
        supersededNote +
        `\nRegenerate it:  ${regen}`,
    );
    process.exit(1);
  }

  if (stamp.sha256 !== expected) {
    console.error(
      "Refusing to build the queue: source-board-summary.json was written by a DIFFERENT build-source-board.mjs\n" +
        `than the one beside this script, so the two artifacts do not describe the same derivation.\n` +
        `  summary written by  ${stamp.ranFrom ?? stamp.script ?? "an unrecorded path"}  (sha256 ${stamp.sha256.slice(0, 12)})\n` +
        `  checked against     ${boardScript}  (sha256 ${expected.slice(0, 12)})\n` +
        supersededNote +
        `\nRegenerate it:  ${regen}`,
    );
    process.exit(1);
  }

}

assertSummaryProvenance(s);

/*
 * Measure id-band capacity (item T-701a).
 *
 * The rule below — "take the lowest free number in your own band" — was
 * rendered as three rows of static prose. It told an agent where to look and
 * never checked that anything was there. Measured on `9f3f7cd39` across the
 * three documents the rule itself names, `T-500`–`T-599` was 100 of 100
 * spent, and no artifact said so. An agent following the rule correctly would
 * have collided, which is the exact failure disjoint bands exist to prevent.
 *
 * Two deliberate choices:
 *
 * 1. The register counts. Three ids in the live band — `T-574`, `T-575`,
 *    `T-576` — exist only in the claim log: named by an agent, no backlog row
 *    written yet. A reader that measures the backlog alone reports capacity
 *    that is already gone, and that is precisely the trap the 2026-09-22T11:07Z
 *    correction recorded. So every document the board declared it read, plus
 *    the claim log, is a source.
 *
 * 2. Over-inclusion is the safe direction. Counting an id that turns out to be
 *    free costs one wasted number; reporting a spent id as free costs a
 *    collision, which is the thing being prevented. A mention anywhere in
 *    these documents is treated as spent.
 */
const BAND_WIDTH = 100;
const BAND_LANES = ["D", "U", "C", "T"];
const BANDS = [
  { start: 500, who: "Claude Code" },
  { start: 600, who: "Codex" },
  { start: 400, who: "a human, or anything else" },
];
/** Free numbers at which the range decision is still cheap to make. */
const BAND_LOW_WATER = 10;
const BAND_ID = /\b([DUCT])-(\d{3})\b/g;

function spentIds() {
  const files = [...s.inputs.map((i) => path.resolve(OPERATOR_ROOT, i.file)), CLAIMS];
  const spent = new Set();
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    for (const m of fs.readFileSync(file, "utf8").matchAll(BAND_ID)) {
      spent.add(`${m[1]}-${m[2]}`);
    }
  }
  return spent;
}

function measureBands() {
  const spent = spentIds();
  return BANDS.map((band) => {
    const lanes = {};
    for (const lane of BAND_LANES) {
      let used = 0;
      for (let n = band.start; n < band.start + BAND_WIDTH; n += 1) {
        if (spent.has(`${lane}-${n}`)) used += 1;
      }
      lanes[lane] = { used, free: BAND_WIDTH - used };
    }
    return { ...band, lanes };
  });
}

const bands = measureBands();

function bandRange(lane, start) {
  return `\`${lane}-${start}\`–\`${lane}-${start + BAND_WIDTH - 1}\``;
}

const bandAlerts = [];
for (const band of bands) {
  for (const lane of BAND_LANES) {
    const { free } = band.lanes[lane];
    if (free > BAND_LOW_WATER) continue;
    bandAlerts.push({
      exhausted: free === 0,
      text: free === 0
        ? `BAND EXHAUSTED: ${bandRange(lane, band.start)} has 0 of ${BAND_WIDTH} free. ${band.who} cannot file a new ${lane}-lane item by the id-band rule — the next number taken from this band collides with one already spent. This needs a range decision, not a careful reading.`
        : `BAND LOW: ${bandRange(lane, band.start)} has ${free} of ${BAND_WIDTH} free for ${band.who}. Decide the next range while the decision is still cheap.`,
    });
  }
}

function renderBandTable() {
  const header = `| who files it | band, in every lane | ${BAND_LANES.map((l) => `${l} free`).join(" | ")} |\n|---|---|${BAND_LANES.map(() => "---").join("|")}|`;
  const rows = bands.map((band) => {
    const cells = BAND_LANES.map((lane) => {
      const { free } = band.lanes[lane];
      if (free === 0) return "**0 — EXHAUSTED**";
      if (free <= BAND_LOW_WATER) return `**${free}**`;
      return String(free);
    });
    return `| ${band.who} | \`X-${band.start}\` to \`X-${band.start + BAND_WIDTH - 1}\` | ${cells.join(" | ")} |`;
  });
  const alerts = bandAlerts.length
    ? `\n${bandAlerts.map((a) => `> **${a.text}**`).join("\n>\n")}\n`
    : "";
  return `${header}\n${rows.join("\n")}\n${alerts}`;
}

function userBlockerText(item) {
  // The board already derives a semantic blocker from the full item corpus.
  // Re-scanning raw acceptance prose here made any descriptive use of the
  // phrase "signed-in" an owner gate, even when the sentence explicitly said
  // to quarantine such a fixture rather than run a product session.
  const blocker = typeof item.blocker === "string" ? item.blocker : item.blocker?.say ?? "";
  return blocker === "Unclaimed" ? "" : blocker;
}

const all = [
  ...s.stages.flatMap((st) => st.items.map((i) => ({ ...i, track: `stage ${String(st.id).padStart(2, "0")} ${st.name}`, isLifecycle: true }))),
  ...s.tracks.flatMap((t) => t.items.map((i) => ({ ...i, track: t.name, isLifecycle: false }))),
];

/**
 * Read claims exactly as EXECUTION_CLAIMS.md says they work:
 *
 *   "The newest line for an item or control wins; a line older than 3 hours is
 *    expired. The sections above are a summary a human maintains — this log is
 *    the source of truth."
 *
 * A first cut scanned the whole file with a loose regex and reported 30 items
 * claimed, because the human summary above the log mentions item numbers in
 * prose. That hid 13 genuinely free items from the queue. A queue that hides
 * work is worse than no queue, so this parses the log and only the log.
 */
const CLAIM_TTL_MS = 3 * 60 * 60 * 1000;

/* ------------------------------------------------------------------------ *
 * WHICH ID A CLAIM LINE IS ABOUT — item T-510.
 *
 * Two grammars used to be recognised, `item <id>` and `CLAIM(ED) <id>`, and
 * the subject was whichever of them was written first. The register writes a
 * third form the parser could not see at all: the subject leads the sentence
 * beside the verdict, with no `item` prefix —
 *
 *     RELEASED T-005 | MERGED PR #8013 SHA 57331dc6c | ... item 126 ...
 *     T-503 MERGED+CLOSED b1a7db782 (PR #8049) | ...
 *
 * Measured on the live register at 2026-09-22T09:50Z, over the 1,188
 * timestamped lines in the claim log:
 *
 *   - 928 resolve to an id under the two established grammars;
 *   - 76 of the remaining 260 carry a RELEASED or MERGED token, and on 53 of
 *     those a subject id sits directly beside the verdict. Those 53 are 53
 *     DISTINCT ids whose release the register wrote and the queue cannot
 *     read — C-007, D-014, D-015, D-023, D-033, D-035, D-038, D-039, D-041,
 *     D-043, T-002, T-007, T-008, T-011, T-012, T-014, T-021, T-030, T-038,
 *     T-039, T-046, T-047, T-049, T-050, T-051, T-052, T-053, T-054, T-056,
 *     T-057, T-058, T-059, T-067, T-073, T-074, T-075, T-077, T-402, T-500,
 *     T-501, T-502, T-503, T-505, T-523, T-530, T-532, T-533, T-535, T-536,
 *     T-537, U-006, U-012 and U-014;
 *   - the other 23 name no subject at all (`RELEASED parallel wave · PR
 *     #7855 ...`, `RELEASED item 48a`, `RELEASED item D2/D5`). Those are not
 *     a grammar case and are deliberately left unresolved: inventing a
 *     subject for a line that names none is how a release gets attributed to
 *     an item nobody released.
 *
 * The item was filed as one line. That count came from the OTHER bucket —
 * lines that parse, where the verdict's nearest id is not the parsed one —
 * and T-545's reach plus intervening-id rule already resolves all 12 of those
 * correctly. The real population is the lines that parse to nothing.
 *
 * THE RULE IS THE ONE ALREADY IN FORCE, NOT A NEW PRECEDENCE. The subject is
 * still whichever grammar is written FIRST on the line; the release form is
 * simply now one of the candidates in that contest. Making it win outright
 * would be wrong: a claim line routinely narrates another lane's release in a
 * parenthetical — `item T-595 · CLAIMED | ... (free — the lane that held b.ts
 * RELEASED item T-411 at 17:18Z)` — and the claimed item, written first, is
 * the subject there.
 *
 * The new form is anchored to the verdict token and matches `[A-Z]-\d{3}`
 * only. It is deliberately NOT a scan for an id anywhere on the line: that is
 * the move that produced T-545, where every id mentioned in passing became a
 * candidate subject. Bare digits are excluded too — `MERGED PR #8013 SHA
 * 57331dc6c` is a line full of numbers and none of them is an item.
 *
 * Blast radius, measured against the same 1,188 lines: 1,134 unchanged, 53
 * newly resolved, 0 that stop resolving, and exactly 1 that resolves to a
 * different id — the `RELEASED T-005 | ... | item 126` line this item was
 * filed over, which now reads as T-005 rather than as 126.
 * ------------------------------------------------------------------------ */

/**
 * The subject-leading release grammar. Either the verdict leads and the id
 * follows it, or the id leads and the verdict follows. Both are anchored: the
 * id and the token must be adjacent, so an id further along the line is not a
 * candidate.
 */
const RELEASE_SUBJECT =
  /\b(?:RELEASED|MERGED)\s+(?:item\s*#?)?([A-Z]-\d{3})\b|\b([A-Z]-\d{3})\s+(?:MERGED|RELEASED)\b/;

/** The two established grammars, unchanged. */
const ITEM_SUBJECT = /\bitem\s*#?([A-Z]-\d{3}|\d+)\b/i;
const CLAIM_SUBJECT = /\bCLAIM(?:ED)?\s+#?([A-Z]-\d{3}|\d+)\b/i;

/**
 * Parse only timestamped claim-log records, while accepting the append-only
 * grammars already present in the operator log. The timestamp is the record
 * boundary: prose above the log and prose that merely mentions an item remain
 * non-authoritative.
 */
function parseClaimRecord(line) {
  const at = line.match(/(?:^|\s)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)(?:\s|$)/)?.[1];
  if (!at) return null;

  // First written wins, across all three grammars. See the block above.
  let idMatch = null;
  for (const pattern of [RELEASE_SUBJECT, ITEM_SUBJECT, CLAIM_SUBJECT]) {
    const candidate = line.match(pattern);
    if (!candidate) continue;
    if (!idMatch || candidate.index < idMatch.index) idMatch = candidate;
  }
  if (!idMatch) return null;
  // `RELEASE_SUBJECT` has two alternatives and therefore two capture groups;
  // exactly one of them is set on any match.
  const rawId = idMatch[1] ?? idMatch[2];

  // Where on the line the id is actually written, so a verdict can be
  // attributed to it rather than to the line as a whole (item T-545).
  const idIndex = idMatch.index + idMatch[0].indexOf(rawId);

  return { at, rawId, idIndex };
}

/* ------------------------------------------------------------------------ *
 * ATTRIBUTING A RELEASE — item T-545.
 *
 * The verdict used to be `/\bRELEASED\b/.test(line)` over the whole line,
 * with the id matched separately and never related to it. Register lines are
 * long and discursive: one line routinely claims item A while narrating that
 * item B's files were released, or closes by releasing a FILE claim while the
 * item itself is still at PR/CI. Every one of those read as a release of the
 * item the line claims, and the next queue regeneration offered actively-held
 * work under "Explicitly released" — an invitation straight into a collision.
 *
 * Measured on the live register at 2026-09-21T21:05Z, over the 107 lines that
 * parse as a release under the whole-line rule:
 *
 *   - 100 have the token within 40 characters of the id reference;
 *   - the furthest GENUINE release is 54 (`- item <id> | agent | <stamp> |
 *     RELEASED — merged, deployed`, where the agent and stamp sit between);
 *   - the five false ones are 251, 457, 631, 793 and 908 characters away.
 *
 * The band from 54 to 251 is empty, so RELEASE_REACH below is measured rather
 * than chosen. Two rules apply, and the second is the structural one:
 *
 *   1. NEAREST TOKEN, not any token — the shape `register-time-authority.mjs`
 *      already uses for merge attribution, and proven there.
 *   2. NO INTERVENING ID REFERENCE. A token separated from this id by another
 *      item id belongs to that other id, whatever the distance. This catches
 *      the case a reach alone cannot: `RELEASED T-005 | ... | item 126`.
 *
 * Both errors are deliberately on the `held` side. Reading a real release as
 * a hold hides finished work until the next line is appended; reading a
 * mention as a release sends a second agent into a file another lane owns,
 * which is the failure this register exists to prevent.
 * ------------------------------------------------------------------------ */

/**
 * A token that reports a claim as released. Deliberately the EXACT token the
 * register's established grammar writes — uppercase `RELEASED` — and nothing
 * more. This item is about attributing that verdict to the right id, not
 * about detecting more of them: widening the token set here would change what
 * counts as a release at the same time as changing who it belongs to, and
 * neither change could then be measured on its own. Measured at
 * 2026-09-21T21:05Z, matching case-insensitively and adding `RELEASING` moved
 * six further ids into `released` on the live register, all of them from
 * lower-case prose, none of them announcements.
 */
const RELEASE_TOKEN = /\bRELEASED\b/g;

/**
 * The register says "NOT RELEASED, still holding" as readily as it says
 * "RELEASED". A negator within a short reach before the token disqualifies
 * it — the same false positive T-457 measured for merge tokens.
 */
const RELEASE_NEGATOR = /\b(?:not|never|un|pending|awaiting|before|until|if|yet to be)\b[^.]{0,24}$/i;

/** Any other item id written on the line: `T-411`, `item 126`, `#97`. */
const ID_REFERENCE = /\b(?:[A-Z]-\d{3}|[Ii]tem\s*#?\d+)\b/g;

/**
 * The furthest a release token may sit from the id it releases. See the
 * measurement above: the furthest genuine release observed is 54 and the
 * nearest false one is 251, so this sits inside an empty band with better
 * than 2x margin on each side.
 */
const RELEASE_REACH = 120;

/** Whether the line releases the id written at `idIndex`, and only that id. */
function announcesReleaseOf(line, idIndex, idLength) {
  RELEASE_TOKEN.lastIndex = 0;
  const tokens = [...line.matchAll(RELEASE_TOKEN)];
  if (tokens.length === 0) return false;

  let nearest = tokens[0];
  for (const token of tokens) {
    if (Math.abs(token.index - idIndex) < Math.abs(nearest.index - idIndex)) nearest = token;
  }

  const negated = RELEASE_NEGATOR.test(line.slice(Math.max(0, nearest.index - 28), nearest.index));
  if (negated) return false;

  if (Math.abs(nearest.index - idIndex) > RELEASE_REACH) return false;

  // Anything between the id and the token that is itself an id reference
  // means the token is speaking about that one instead.
  const from = Math.min(idIndex + idLength, nearest.index);
  const to = Math.max(idIndex, nearest.index + nearest[0].length);
  ID_REFERENCE.lastIndex = 0;
  return [...line.slice(from, to).matchAll(ID_REFERENCE)].length === 0;
}

function readClaims() {
  if (!fs.existsSync(CLAIMS)) return { held: new Set(), expired: [], expiredInFlight: [], lapsed: [], released: [] };
  const text = fs.readFileSync(CLAIMS, "utf8");
  const start = text.indexOf("## Claim log");
  if (start < 0) return { held: new Set(), expired: [], expiredInFlight: [], lapsed: [], released: [] };

  // A claim line that names a branch or a PR is evidence the work exists
  // somewhere other than in the log. That is the signal the TTL cannot carry.
  //
  // WHAT COUNTS AS NAMING A BRANCH — item T-734. This was a PREFIX ALLOWLIST
  // spelled out here, `codex/…` or `claude/…`. The operator task file
  // instructs every run to cut its own worktree with
  // `git worktree add -b <your-branch>`, and the runs that follow it name
  // branches `exec/…`. None of those matched. Such a claim reached
  // `expired-in-flight` only if its prose happened to mention a four-digit PR
  // number, and `expired-idle` — printed as FREE TO TAKE — if it did not.
  // That is the dangerous direction: it offers live work to a second agent,
  // which is the collision this register exists to prevent. Measured on the
  // live register at 2026-09-23T13:29Z, 31 lines were missed this way,
  // including the claim line for this item, written thirty seconds earlier.
  //
  // The grammar is NOT re-spelled here. `fossil-claims.mjs` already owns it —
  // it prefers the claim's explicit `branch <name>` field, which
  // `append-claim.mjs --branch` writes and which is the claim's own answer;
  // it reads `branch none` as a declaration of absence rather than a name;
  // and only then does it fall back to a prefix token. That module's copy
  // already knew about `exec/` while this one did not, which is the drift
  // itself: two tools in this directory answering "does this line name a
  // branch?" must not be able to disagree, so there is one answer and both
  // call it. A mutation to the shared grammar now reddens both suites.
  //
  // A PR number is not a branch, so it stays here, unioned: the two signals
  // together can only move an item toward `do not take`, never toward
  // FREE TO TAKE.
  const PR_REFERENCE = /\bPR\s*#?\d{4}\b|#\d{4}\b/;
  const IN_FLIGHT = {
    test: (line) => branchesInClaim(line).length > 0 || PR_REFERENCE.test(line),
  };

  /*
   * WHICH LINE IS "THE NEWEST LINE FOR AN ITEM" — the authority is named here
   * because it is a choice between two real ones, and naming it is item T-530.
   *
   *   PRIMARY:   the STAMP the line carries.
   *   TIE-BREAK: APPEND POSITION, for lines sharing one stamp. Register
   *              stamps are minute-precision, so same-minute ties are common
   *              rather than exotic; `>=` below is what implements this.
   *
   * Neither authority is clean and the resolver cannot make them agree:
   *
   *   - An append position is the order the line was really written, because
   *     the register is append-only. But it says nothing about when the event
   *     it reports happened, and a line reconciling a four-hour-old merge is
   *     correct and normal.
   *   - A stamp is about the event, but it is self-reported. T-457 measured
   *     the live register: 26 merge announcements resolved to an authoritative
   *     `mergedAt`, 17 outside +/-300s, drift from -44s to +48,077s, and six
   *     lines stamped in the future of the clock that read them.
   *
   * So the two orders genuinely disagree, and on the live register they do:
   * 14 of 283 ids resolve to a different line, and on 5 of those the BUCKET
   * differs — three of them the difference between `released` and
   * `expired-in-flight`, which is the difference between work this queue
   * offers and work it hides.
   *
   * This does NOT switch authority, because which one is right for a
   * cross-lane pair is an owner call and not a resolver detail. What it stops
   * is the silence: every id where the two orders pick different lines is
   * collected and reported, so a bucket that contradicts the register's last
   * written word says so rather than being taken on trust.
   */
  /* ---------------------------------------------------------------------- *
   * AN ABSTENTION IS TRANSPARENT, AND IT VETOES ONE SIGNAL — item T-736.
   *
   * `append-claim.mjs --action abstain` writes `item <id> NOT TAKEN`. Until
   * this item, that string appeared nowhere in this file: the line parsed as
   * an ordinary claim, so the one verb that can say "this claim is dead"
   * HELD the item for the full three-hour TTL before releasing it. The verb
   * that could free an item hid it first.
   *
   * That mattered because `fossil-claims.mjs` resolves a suppressed candidate
   * to `abandoned` — branch gone from `origin`, no pull request ever opened —
   * and correctly refuses to emit a release line for it, since a release
   * would assert the work merged. Measured on the live documents at
   * 2026-09-23T14:58Z, that verdict held for eight ids claimed on 2026-09-19,
   * and those eight were the whole of the queue's `0 claimable`.
   *
   * THE RULE IS NARROWER THAN "AN ABSTENTION FREES THE ITEM", deliberately:
   *
   *   TRANSPARENT  An abstention takes nothing, so it is never a claim and
   *                never resolves an item. The item still resolves from the
   *                newest line that asserts ownership. This is the shape
   *                `resolveItemClaim` in register-time-authority.mjs already
   *                gives abstentions, and for the same reason — newest-line-
   *                wins would otherwise let one run's declining of work evict
   *                another run's LIVE claim, which is the collision this
   *                register exists to prevent.
   *
   *   VETO         What it does do is cancel the IN-FLIGHT suppression of the
   *                expired claim it supersedes. In flight is evidence the
   *                work exists outside the log; an abstention naming the same
   *                item after that claim expired is the register's answer
   *                that it does not.
   *
   * So a dead claim clears the instant the line lands — not after another
   * TTL — while a live holder is untouched. The veto applies only where a
   * suppression existed: an expired claim with no branch and no PR is
   * already free, and stays in the bucket it was in.
   *
   * IT DOES NOT PROMOTE THE ITEM. `abandoned` is a verdict about the CLAIM.
   * Whether the work shipped from some other branch is an open question, so
   * these ids render under their own heading saying the item is UNVERIFIED,
   * and the abstention is checked BEFORE the release attribution below —
   * which is proximity-based over the whole line and would otherwise read
   * the word RELEASED out of the abstention's own evidence.
   * ---------------------------------------------------------------------- */
  const latest = new Map(); // item id -> { at, released, inFlight }
  const byAppendOrder = new Map(); // item id -> the LAST line appended for it
  const abstentions = new Map(); // item id -> the NEWEST abstention for it
  let ordinal = 0;
  for (const line of text.slice(start).split(/\r?\n/)) {
    const record = parseClaimRecord(line);
    if (!record) continue;
    const { at, rawId } = record;
    const when = Date.parse(at);
    const key = /^\d+$/.test(rawId) ? Number(rawId) : rawId.toUpperCase();
    ordinal += 1;

    if (announcesAbstention(line)) {
      const prevAbstention = abstentions.get(key);
      if (!prevAbstention || when >= prevAbstention.at) {
        abstentions.set(key, { at: when, stamp: at, ordinal });
      }
      continue;
    }

    const resolved = {
      at: when,
      stamp: at,
      ordinal,
      released: announcesReleaseOf(line, record.idIndex, rawId.length),
      inFlight: IN_FLIGHT.test(line),
    };
    byAppendOrder.set(key, resolved);
    const prev = latest.get(key);
    if (!prev || when >= prev.at) latest.set(key, resolved);
  }

  /*
   * Whether an abstention supersedes this resolved line. Stamp first, append
   * position breaking an equal stamp — the same authority, and the same
   * tie-break, the block above documents for choosing a line at all. Register
   * stamps are minute-precision, so a same-stamp pair is ordinary rather than
   * exotic, and answering it by position is what keeps a claim appended after
   * an abstention in the same minute from being cleared by it.
   */
  const abstainedAfter = (key, v) => {
    const a = abstentions.get(key);
    if (!a) return false;
    return a.at > v.at || (a.at === v.at && a.ordinal > v.ordinal);
  };

  /*
   * An id disagrees when the stamp authority and the append authority select
   * different LINE OBJECTS. Identity is the test rather than a field
   * comparison: two lines can carry the same stamp and the same verdict and
   * still be different lines, and that case is agreement for every purpose
   * downstream.
   */
  const disagreements = [];
  for (const [key, stampWinner] of latest) {
    const appendWinner = byAppendOrder.get(key);
    if (appendWinner && appendWinner !== stampWinner) {
      disagreements.push({ num: key, stampWinner, appendWinner });
    }
  }

  const now = Date.now();
  const held = new Set();
  const expiredIdle = [];
  const expiredInFlight = [];
  const lapsed = [];
  const released = [];

  /** The bucket a single resolved line would put its item in. */
  const bucketOf = (v, key) => {
    if (v.released) return "released";
    if (now - v.at > CLAIM_TTL_MS) {
      if (!v.inFlight) return "expired-idle";
      // T-736: the in-flight signal is evidence, and an abstention appended
      // after this claim expired is the register contradicting it.
      return abstainedAfter(key, v) ? "lapsed" : "expired-in-flight";
    }
    return "held";
  };

  for (const [num, v] of latest) {
    if (bucketOf(v, num) === "lapsed") { lapsed.push(num); continue; }
    if (v.released) { released.push(num); continue; }
    if (now - v.at > CLAIM_TTL_MS) {
      // The TTL alone cannot tell an abandoned claim from a slow one. Measured
      // over 48 completed cycles the median hold is 21 minutes and the p90 is
      // 362 — bimodal, so no single duration separates them, and 5 of 48 real
      // cycles already outran the 3h window. Every lifecycle item the queue
      // offered as free on 2026-09-19 was in fact still being worked, with an
      // open PR to prove it. So an expired claim is only offered as free when
      // its line names no branch and no PR; otherwise it is reported as
      // in-flight and kept out of the claimable list.
      (v.inFlight ? expiredInFlight : expiredIdle).push(num);
      continue;
    }
    held.add(num);
  }
  return {
    held,
    expired: expiredIdle.sort(compareItemIds),
    expiredInFlight: expiredInFlight.sort(compareItemIds),
    lapsed: lapsed.sort(compareItemIds),
    released: released.sort(compareItemIds),
    orderDisagreements: disagreements
      .map((d) => ({
        num: d.num,
        stampAt: d.stampWinner.stamp,
        appendAt: d.appendWinner.stamp,
        stampBucket: bucketOf(d.stampWinner, d.num),
        appendBucket: bucketOf(d.appendWinner, d.num),
      }))
      .sort((a, b) => compareItemIds(a.num, b.num)),
  };
}

const {
  held: claimed,
  expired: expiredClaims,
  expiredInFlight,
  lapsed: lapsedClaims,
  released: releasedClaims,
  orderDisagreements,
} = readClaims();
const inFlightSet = new Set(expiredInFlight);

function normalizeItemId(value) {
  const raw = String(value);
  return /^\d+$/.test(raw) ? Number(raw) : raw.toUpperCase();
}

function compareItemIds(a, b) {
  const aNumeric = typeof a === "number";
  const bNumeric = typeof b === "number";
  if (aNumeric && bNumeric) return a - b;
  if (aNumeric) return -1;
  if (bNumeric) return 1;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

function formatItemId(id) {
  return typeof id === "number" ? `#${id}` : String(id);
}

/**
 * The claimable filter, as a list rather than a chain (item T-731).
 *
 * It was a `.filter().filter()` chain, which is the same arithmetic and tells
 * the reader nothing. Measured on the live documents at `3b8e0dc99` the chain
 * ran 424 -> 83 -> 62 -> 15 -> 14 -> 14 -> **0**: every one of the fourteen
 * survivors was removed by the last predicate, and the rendered file said only
 * "0 items are claimable". An agent cannot act on that, because an exhausted
 * backlog and a single filter eating the list look identical and imply
 * opposite next moves — stop, or go and check fourteen branches.
 *
 * The stages are declared once and both the filter and the report read THIS
 * list. A report re-deriving the rules a second time can disagree with the
 * filter it claims to describe, which is the failure this directory exists
 * against.
 */
const CLAIMABLE_STAGES = [
  { label: "already has proof (not at rung 0)", keep: (i) => i.rung === 0 },
  // Closed is rung 0 because it proves nothing, but it is not work.
  { label: "closed", keep: (i) => i.rungLabel !== "Closed" },
  { label: "blocked on Anand", keep: (i) => !userBlockerText(i) },
  // An entry with no acceptance criterion states no demonstrable outcome, so
  // there is nothing for an agent to finish or for anyone to check. Item 49 was
  // a rationale note — written to stop someone re-deriving a wrong answer — and
  // it sat in this queue as claimable work with acceptance "—". The backlog is
  // prose, and anything with an `### Item N` heading parses as an item, so the
  // queue has to be the thing that refuses to offer a note as work.
  { label: "states no acceptance, so it is a note rather than work", keep: (i) => (i.acceptance ?? "").trim().length > 0 },
  { label: "held by a live claim", keep: (i) => !claimed.has(normalizeItemId(i.num)) },
  // An expired claim whose line names a branch or a PR is work in flight, not
  // free work. Offering it invites the collision the claim log exists to stop.
  { label: "suppressed as work in flight", keep: (i) => !inFlightSet.has(normalizeItemId(i.num)) },
];

const claimableFunnel = [];
const claimable = CLAIMABLE_STAGES.reduce((survivors, stage) => {
  const kept = survivors.filter(stage.keep);
  claimableFunnel.push({
    label: stage.label,
    removed: survivors.filter((i) => !stage.keep(i)),
    remaining: kept.length,
  });
  return kept;
}, all);

/**
 * The ids the in-flight rule alone stands between and a claimable row.
 *
 * The in-flight line already named every suppressed id, and told the reader to
 * check each branch and PR before taking one. On the live documents that is
 * **132 ids of which 14 are candidates**, so the instruction costs 132 lookups
 * to recover 14 rows and is therefore never carried out. Four of the fourteen
 * were checked against GitHub by hand on 2026-09-23 and all four had merged
 * 37 hours earlier with their branches deleted.
 *
 * This does not decide whether a branch is alive — that needs a live GitHub
 * read the generator deliberately does not do — it only says which ids are
 * worth the lookup.
 */
const suppressedCandidates = claimableFunnel[claimableFunnel.length - 1].removed
  .map((i) => i.num)
  .sort(compareItemIds);

// Order: lifecycle work before platform work, then by item number so the
// ordering is stable across runs and two agents derive the same sequence.
claimable.sort((a, b) => (Number(b.isLifecycle) - Number(a.isLifecycle)) || compareItemIds(normalizeItemId(a.num), normalizeItemId(b.num)));

/**
 * Say why the claimable count is the number it is (item T-731).
 *
 * Rendered on every run rather than only when the count is zero: a block that
 * appears only in the failing case is exercised only in the failing case, and
 * this directory has already paid twice for branches nothing ever ran.
 */
/*
 * Ids the board could not place (item T-745).
 *
 * The pool above is `stages` + `tracks` — only ids the structure map places.
 * An id the board could not place is dropped BEFORE this pool exists, so the
 * census opened at a number that had already been reduced and no row in the
 * table said so. Measured on the live corpus at `748d34604`: a pool of 424,
 * 16 dropped ids, an intersection of zero, a true population of 440, and not
 * one of the 160 rendered lines mentioning any of it.
 *
 * The board reports them on stderr and exits 1. Neither reaches this file,
 * which is the one the claim protocol tells agents to read, and the exit code
 * carries no information on its own: the note under T-731 records that gate as
 * structurally red at all times, because every newly filed item is unmapped
 * the moment it is filed and mapping is a repo-owned pull request.
 *
 * Whether an unmapped id should FAIL the board is a decision that note
 * reserves to the operator; nothing here touches it. This only makes the
 * census describe its own pool honestly.
 *
 * A MISSING FIELD IS NOT A ZERO. `unmapped` is written by
 * `build-source-board.mjs`. If that generator stops emitting it, printing "0
 * could not be placed" would assert a completeness nobody measured, so the
 * absent case renders as `not recorded` and the opening sentence stops
 * claiming the population is known.
 */
const unplaceable = Array.isArray(s.unmapped) ? s.unmapped.map(String) : null;
const UNPLACEABLE_LABEL = "not on the structure map, so the board could not place it";

/**
 * Ids the board never parsed at all (item T-746).
 *
 * One stage further upstream than `unmapped`, and it survives the fix above.
 * `unmapped` is computed from the ids the board's reader PRODUCED, so an id in
 * a shape that reader cannot parse is absent from the pool, absent from the
 * drop row, and absent from the board's own `not placed on the map: 0` — which
 * was vacuously true over exactly the population that was not missing.
 * Measured on the live corpus at `aa0eecff9`: 474 ids sit in item position in
 * the backlog, the reader produced 444, and none of the 30 missing appeared in
 * any line of this file.
 *
 * The cost is not hypothetical. `T-743` and `T-744` were open, unclaimed,
 * lane-T work while three runs in a row read this file and recorded "my lane
 * has ZERO claimable rows".
 *
 * A MISSING FIELD IS NOT A ZERO, for the same reason it is not one for
 * `unmapped`: the field is written by a different generator, and printing "0
 * unparsed" would assert a completeness nobody measured.
 */
const unparsed = Array.isArray(s.unparsedItemIds) ? s.unparsedItemIds.map(String) : null;
const UNPARSED_LABEL = "in item position in the backlog but in a shape the board cannot parse";

/* ------------------------------------------------------------------------ *
 * PLACEMENT IS NOT IDENTITY — item T-753.
 *
 * `all` is `stages[].items` + `tracks[].items`, so an item mapped to two
 * stages, or to a stage and a track, is TWO ROWS. Both placements are
 * legitimate: `assertUniqueMappedRefs` enforces uniqueness inside each list
 * and deliberately not across them, because one item can serve two stages.
 *
 * The census opened at `all.length + unplaceable + unparsed`, which is a
 * count of PLACEMENTS pretending to be a count of ids, and the table whose
 * whole job is to say honestly what was dropped was therefore the thing that
 * was wrong. Measured on the live corpus at `d86f4c6cc`: 470 placements over
 * 468 distinct ids — `D-006` in stages 1 and 2, `T-458` in the Platform
 * integrity and Cross-cutting tracks — so the census printed 487 against the
 * board's independently scanned 485.
 *
 * It read correctly before T-752 only by coincidence: two duplicates and two
 * missing items cancelled exactly.
 *
 * THE CHOICE, STATED RATHER THAN IMPLIED: the census counts DISTINCT IDS,
 * because that is the population the board scans independently and the thing
 * an agent takes as one piece of work. The filter below it keeps counting
 * PLACEMENTS, because every other bucket in this file is built from `all` and
 * re-deriving them would change what the queue offers. The two meet at one
 * explicit add-back row that names the duplicated ids, rather than at a
 * silent jump.
 *
 * `all` is NOT deduped here. That would change `all` for every bucket agents
 * take work from, to repair a number in one table.
 */
const placementCounts = new Map();
for (const item of all) {
  const id = normalizeItemId(item.num);
  placementCounts.set(id, (placementCounts.get(id) ?? 0) + 1);
}
const distinctPlaced = placementCounts.size;
const duplicatedIds = [...placementCounts]
  .filter(([, n]) => n > 1)
  .map(([id]) => id)
  .sort(compareItemIds);
const extraPlacements = all.length - distinctPlaced;
const DUPLICATE_LABEL =
  "placed in more than one stage or track, so it reaches the filter below as more than one row";

/**
 * The board's own scan of ids in item position — the number this census is
 * reconciled AGAINST rather than derived from.
 *
 * A MISSING FIELD IS NOT A ZERO, and it is not an agreement either. If the
 * board stops emitting it, printing a reconciled census would assert
 * agreement with a number nobody supplied, so the absent case says the
 * census cannot be reconciled and the opening stops claiming a scanned
 * population.
 */
const scanned = Array.isArray(s.itemPositionIds) ? s.itemPositionIds.map(String) : null;

/** distinct ids + the two dropped buckets — what the census claims to cover. */
const derivedTotal = unplaceable === null || unparsed === null
  ? null
  : distinctPlaced + unplaceable.length + unparsed.length;

/**
 * Reconcile in BOTH directions, never by count alone.
 *
 * Two sets of the same size can still be different sets, and a census that
 * compares only totals would call that agreement. So the ids are diffed each
 * way and both sides are named.
 */
function reconcileCensus() {
  if (scanned === null || derivedTotal === null) {
    return {
      verdict: "unavailable",
      say: "**This census cannot be reconciled.** The board that wrote this summary recorded no independent scan of ids in item position, so the number above is derived from the three buckets below and has nothing to check itself against. Run the board and read its own output.",
    };
  }
  const derivedSet = new Map();
  for (const id of placementCounts.keys()) derivedSet.set(id, "placed on the structure map");
  for (const id of unplaceable) derivedSet.set(normalizeItemId(id), "dropped as not on the structure map");
  for (const id of unparsed) derivedSet.set(normalizeItemId(id), "dropped as unparsed");
  const scannedSet = new Set(scanned.map((id) => normalizeItemId(id)));
  const onlyDerived = [...derivedSet.keys()].filter((id) => !scannedSet.has(id)).sort(compareItemIds);
  const onlyScanned = [...scannedSet].filter((id) => !derivedSet.has(id)).sort(compareItemIds);
  if (onlyDerived.length === 0 && onlyScanned.length === 0 && derivedTotal === scanned.length) {
    return {
      verdict: "reconciled",
      say: `**Reconciled**: the ${derivedTotal} distinct ids this census accounts for — placed, unplaceable, or unparsed — are the same ${scanned.length} the board scanned independently in item position, id for id in both directions.`,
    };
  }
  const lines = [
    `**The census and the board's own scan DISAGREE: ${derivedTotal} accounted for against ${scanned.length} scanned in item position.** The table below is the census's own arithmetic and its rows will not close; this block is the difference rather than a repair of it.`,
  ];
  if (onlyDerived.length) {
    lines.push(`Accounted for here but NOT scanned in item position (${onlyDerived.length}): ${onlyDerived.map((id) => `\`${displayId(id)}\``).join(" ")} — ${onlyDerived.map((id) => derivedSet.get(id)).filter((v, i, a) => a.indexOf(v) === i).join("; ")}.`);
  }
  if (onlyScanned.length) {
    lines.push(`Scanned in item position but in NONE of the three buckets (${onlyScanned.length}): ${onlyScanned.map((id) => `\`${displayId(id)}\``).join(" ")} — these reach no line of this file at all.`);
  }
  if (!onlyDerived.length && !onlyScanned.length) {
    lines.push("The two id sets match, so the difference is in the counts alone — one of the buckets is carrying a repeat.");
  }
  return { verdict: "disagree", say: lines.join("\n\n") };
}

/** Render an id the way the backlog writes it. */
function displayId(id) {
  return String(id);
}

const censusReconciliation = reconcileCensus();

function renderClaimableFunnel() {
  const rows = claimableFunnel
    .map((f) => `| ${f.label} | ${f.removed.length} | ${f.remaining} |`)
    .join("\n");
  const decisive = [...claimableFunnel].reverse().find((f) => f.removed.length > 0);
  const verdict = claimable.length === 0 && decisive
    ? `**Zero is a filter's answer, not necessarily an empty backlog.** Every remaining candidate was removed by _${decisive.label}_ — ${decisive.removed.length} item${decisive.removed.length === 1 ? "" : "s"}. Read that row before concluding there is nothing to do.`
    : "";

  // Rendered on every run, including at zero. A row that appears only when the
  // count is non-zero is a branch exercised only in the failing case, and this
  // table's own comment was already written against that shape.
  // Every "left" cell below counts DISTINCT IDS until the add-back row, which
  // is where the census hands over to a filter that counts placements (item
  // T-753). `distinctPlaced`, not `all.length`, is therefore what the drop
  // rows close onto.
  const unplaceableRow = unplaceable === null
    ? `| ${UNPLACEABLE_LABEL} | not recorded | not recorded |`
    : `| ${UNPLACEABLE_LABEL} | ${unplaceable.length} | ${distinctPlaced} |`;

  // Rendered above the unplaceable row because it happens first: an id the
  // reader never produced cannot then be placed or not placed. At zero it
  // still renders, for the reason the comment above the unplaceable row gives.
  const afterUnparsed = unplaceable === null ? null : distinctPlaced + unplaceable.length;
  const unparsedRow = unparsed === null
    ? `| ${UNPARSED_LABEL} | not recorded | not recorded |`
    : `| ${UNPARSED_LABEL} | ${unparsed.length} | ${afterUnparsed === null ? "not recorded" : afterUnparsed} |`;

  /*
   * The one row where the census stops counting ids and the filter starts
   * counting placements. It ADDS rather than removes, so its cell is signed
   * and it is not a funnel stage; rendered on every run, including at zero,
   * because a row that appears only when the count is non-zero is a branch
   * exercised only in the failing case.
   */
  const duplicateRow = `| ${DUPLICATE_LABEL} | +${extraPlacements} | ${all.length} |`;
  const duplicateNote = extraPlacements === 0
    ? "Every id the board placed is placed exactly once, so the filter below counts the same population the census does."
    : `**The census counts distinct ids; the filter below counts placements.** ${duplicatedIds.length} id${duplicatedIds.length === 1 ? " is" : "s are"} placed in more than one stage or track — ${duplicatedIds.map((id) => `\`${displayId(id)}\``).join(" ")} — which is legitimate, because one item can serve two stages and uniqueness is enforced inside each list rather than across them. They reach the filter as ${extraPlacements} extra row${extraPlacements === 1 ? "" : "s"}, and the add-back row above is where that happens.`;

  const truePopulation = unplaceable === null || unparsed === null
    ? null
    : scanned === null ? derivedTotal : scanned.length;

  const opening = unplaceable === null
    ? `${all.length} items reach the filter. The board that wrote this summary recorded no count of ids it could not place, so the population this table starts from is **not recorded** and the census below cannot claim to be complete.`
    : truePopulation === null
      ? `${distinctPlaced + unplaceable.length} items reach the filter. The board recorded no count of ids it could not PARSE, so the population above that number is **not recorded** and this census cannot claim to be complete.`
      : scanned === null
        ? `${truePopulation} ids are accounted for by this census — placed, unplaceable, or unparsed — and each row says what the next rule removed. The population is derived here rather than scanned, for the reason directly below.`
        : `${truePopulation} ids sit in item position in the backlog; each row says what the next rule removed.`;

  const namedUnparsed = unparsed === null
    ? "**Whether any id was dropped before it could be parsed is not recorded** by the board that wrote this summary, so this file cannot say. Run the board and read its own output."
    : unparsed.length === 0
      ? "No id was dropped before the reader: every id in item position in the backlog parsed into an item."
      : `**${unparsed.length} id${unparsed.length === 1 ? " is" : "s are"} in item position in the backlog and were never parsed into an item at all:** ${unparsed.map((id) => `\`${id}\``).join(" ")}. They are in no bucket of this file, claimable or blocked, and mapping them changes nothing — the board's reader has to learn the shape they are written in first.`;

  const named = unplaceable === null
    ? "**Which ids those are is not recorded** by the board that wrote this summary, so this file cannot name them. Run the board and read its own output."
    : unplaceable.length === 0
      ? "No id was dropped before the table: every id in the backlog is placed on the structure map."
      : `**${unplaceable.length} id${unplaceable.length === 1 ? " was" : "s were"} dropped before the table and ${unplaceable.length === 1 ? "is" : "are"} offered to nobody:** ${unplaceable.map((id) => `\`${id}\``).join(" ")}. They are in the backlog and in no entry of \`scripts/exec/source-stage-map.json\`, which is repo-owned — mapping a copy in the operator root changes nothing. Until one is placed it cannot appear in any bucket of this file, claimable or blocked.`;

  return `## Why that number

${opening}

${censusReconciliation.say}

| removed because it is | removed | left |
|---|---|---|
| — | — | ${truePopulation ?? (unplaceable === null ? all.length : distinctPlaced + unplaceable.length)} |
${unparsedRow}
${unplaceableRow}
${duplicateRow}
${rows}

${duplicateNote}

${namedUnparsed}

${named}

${verdict}`;
}

const LANES = {
  D: "data-plane — loaders, migrations (authoring only), adapters, projections",
  C: "control/app — API routes, agent controls, validators, gates",
  U: "UI — components and surfaces",
  T: "test/tooling — CI gates, jest scope, triage",
};

const byLane = {};
for (const i of claimable) {
  const lane = LANES[i.lane] ? i.lane : "?";
  (byLane[lane] ??= []).push(i);
}

/**
 * A finished item is neither claimable nor waiting on anyone.
 *
 * The claimable filter has always refused both shapes — `rung === 0` keeps a
 * proven item out, `rungLabel !== "Closed"` keeps a closed one out — and the
 * blocked bucket had no such test. So an item whose acceptance recorded that
 * signed-in proof *happened* was counted as proof still owed. Measured before
 * changing: 11 of 113, ten at rung 7 and one closed.
 */
const isFinished = (i) => i.rung === 7 || i.rungLabel === "Closed";

const blockedOnUser = all.filter(
  (i) => !isFinished(i) && Boolean(userBlockerText(i)),
);
const blockedCounts = blockedOnUser.reduce((a, i) => {
  const label = i.acceptance?.match(/(Blocked on [^.]+|Awaiting approval to apply)/i)?.[1]
    ?? i.blocker
    ?? "User gate";
  a[label] = (a[label] ?? 0) + 1;
  return a;
}, {});

function row(i) {
  // An ambiguous row used to say only that the number was ambiguous, which
  // told an agent to be careful without telling it what to be careful about.
  // Two unrelated items shared T-050; the queue showed one row, and an agent
  // taking "the first item in its lane" read the wrong definition and closed
  // it. Naming the competing sections is what makes the row actionable.
  const sections = i.substantiveSections ?? [];
  const flag = i.ambiguous
    ? sections.length
      ? ` ⚠ AMBIGUOUS — ${sections.length} definitions share this number: ${sections
          .map((s) => `"${String(s).replace(/\|/g, "\\|").slice(0, 60)}"`)
          .join(" and ")}. Cite the section in your claim line and verify you are reading the one you claimed.`
      : " ⚠ number is ambiguous — cite it with its section"
    : "";
  return `| ${i.num} | ${i.track} | ${(i.title || "").replace(/\|/g, "\\|").slice(0, 150)} | ${(i.acceptance || "—").replace(/\|/g, "\\|").slice(0, 190)}${flag} |`;
}

const laneSection = (lane) => {
  const items = byLane[lane] ?? [];
  return `### Lane ${lane} — ${LANES[lane] ?? "unassigned lane"}

${items.length} claimable.

${items.length ? `| # | Track | Item | Acceptance |\n|---|---|---|---|\n${items.map(row).join("\n")}` : "_Nothing claimable. Take the next item from another lane rather than stopping._"}
`;
};

/*
 * Report every id where the register's two orders pick different lines.
 *
 * The resolver above chooses the stamp. That is defensible; choosing it
 * SILENTLY is not, because the bucket an id lands in can then contradict the
 * register's last written word with nothing downstream saying so — which is
 * exactly the defect item T-530 names.
 *
 * Nothing is printed when the orders agree on every id. A warning that always
 * appears is a string literal, not a signal, and this backlog exists because
 * one CI gate proved a control existed by finding its name in a file.
 */
function renderOrderDisagreements() {
  if (!orderDisagreements.length) return "";
  const n = orderDisagreements.length;
  const changesBucket = orderDisagreements.filter((d) => d.stampBucket !== d.appendBucket);
  return `
## Append order and stamp order disagree on ${n} id${n === 1 ? "" : "s"}

The register is append-only, so a line's **position** is the order it was
written; its **stamp** is self-reported, and T-457 measured that drift. This
queue resolves "the newest line for an item" by **stamp**, with append
position breaking an equal stamp. Where the two disagree, the bucket below is
the stamp's answer and may not be the register's last written word.

${changesBucket.length
  ? `**${changesBucket.length} of them land in a different bucket**, which is the part that changes what this queue offers:\n\n`
    + changesBucket
        .map((d) => `- **${formatItemId(d.num)}** — stamp picks \`${d.stampAt}\` → \`${d.stampBucket}\`; append order picks \`${d.appendAt}\` → \`${d.appendBucket}\``)
        .join("\n")
  : "None of them lands in a different bucket, so nothing this queue offers changes."}

${n > changesBucket.length
  ? `The remaining ${n - changesBucket.length} resolve to a different line with the same verdict: ${orderDisagreements.filter((d) => d.stampBucket === d.appendBucket).map((d) => formatItemId(d.num)).join(" ")}.`
  : ""}

Do not repair this by restamping the register — it is audit history, and the
correction pattern is append-only.
`;
}

const out = `# Execution queue — generated

Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC from \`source-board-summary.json\`.
Generated by \`scripts/exec/build-execution-queue.mjs\` from a summary written by
\`scripts/exec/build-source-board.mjs\` — both repo-owned, reviewed and tested. **A queue file
without this line was written by a superseded copy in the operator root and offers work this
backlog no longer holds** (item T-711).

${formatQueueProvenance(queueProvenanceStamp(SELF_PATH))}

The comment above is the machine-checkable half of that sentence, and it exists because the
sentence alone was missed twice (item T-720). It carries the sha256 of the generator that wrote
this file, read from that file at run time, so a superseded copy cannot produce it without being
byte-identical to the repo-owned one. \`scripts/exec/append-claim.mjs\` refuses to append a claim
when it does not match the generator beside it, and \`node scripts/exec/queue-provenance.mjs
--register <register>\` answers the same question on its own.
Do not edit by hand. Regenerate:

\`\`\`
SOURCE_EXECUTION_HOME=~/Downloads node scripts/exec/build-source-board.mjs --json && \\
SOURCE_EXECUTION_HOME=~/Downloads node scripts/exec/build-execution-queue.mjs
\`\`\`

**${claimable.length} items are claimable right now with no input from Anand.**
${Object.entries(byLane).map(([l, v]) => `${l}:${v.length}`).join("  ")}

${renderClaimableFunnel()}

## How to take work without asking

1. Create one identity for this run in the form \`<base-agent>#<run-id>\`. The
   run id must be a start stamp or scheduler id and must stay unchanged for the
   whole run. A sibling with the same base agent but a different run id is a
   different owner: never resume or adopt its claim. Concurrent runs may take
   different unclaimed items.
2. Take the **first unclaimed row in your lane**. If your lane is empty, take the
   first unclaimed row in any lane.
3. Claim it by **appending one line** to \`EXECUTION_CLAIMS.md\` under
   \`## Claim log — append only\`:
   \`YYYY-MM-DDTHH:MMZ <base-agent>#<run-id> item <id> <branch> — claimed\`
   Never rewrite that file. Two agents have lost each other's edits doing so.
4. Work in **your own git worktree**. Never share a checkout.
5. When the item is merged and deployed, append a second line with the SHA and
   the deploy proof. The board reads the backlog, so also record the outcome in
   \`EXECUTION_BACKLOG_20260918.md\`.
6. Go to step 2. **Do not ask which item is next — this file answers that.**

### Filing a new item: take an id from your own band

Ids do not collide because two agents chose badly. They collide because two
agents applied the **same correct rule** — "one past the highest" — at the same
time. No amount of care fixes that; only disjoint ranges do.

${renderBandTable()}
The free counts are measured every run over the documents the rule names — the
backlog, the append-only claim log, and the repo-owned structure map — not
asserted by this table. An id named in the register but not yet written into
the backlog is spent; three ids in the live Claude T band are exactly that.

So Claude's next data-plane item is \`D-500\`, not \`D-042\`. Take the lowest free
number **in your own band**, and you cannot collide with another agent no
matter what they are doing at that moment.

Existing ids stay exactly as they are. Nothing below \`X-400\` is renumbered —
claims, verdicts and release records cite those numbers, and rewriting them
would break every citation to save a cosmetic tidiness. The board reports the
collision rate each run so the trend in the legacy range stays visible; pin an
old id with \`definedIn\` when you touch it.

### Writing an acceptance: the blocker carries meaning

Whether an item lands in *Blocked on Anand* is decided from the board's
**derived blocker**, not by scanning its raw acceptance text a second time.
The board recognizes explicit owed/pending proof and decision language while
leaving descriptive or negated uses alone. This keeps a sentence about a
signed-in-shaped fixture from silently hiding executable test work.

An item that is finished is excluded from this bucket regardless of phrasing,
because proof that already happened is not proof that is owed.

${["D", "C", "U", "T", "?"].filter((l) => byLane[l]?.length).map(laneSection).join("\n")}

## Blocked on Anand — never claim these

${Object.entries(blockedCounts).map(([b, n]) => `- **${b}** — ${n} item${n === 1 ? "" : "s"}`).join("\n") || "- None"}

An agent must not attempt a signed-in acceptance, apply a migration, or make a
product decision. Surface it and take the next queue item instead.

## Already claimed or in flight

${claimed.size ? [...claimed].sort(compareItemIds).map(formatItemId).join(" ") : "_None held. Every claim in the log is released or expired._"}

${expiredInFlight.length ? `**Expired but WORK IN FLIGHT — do not take (${expiredInFlight.length}):** ${expiredInFlight.map(formatItemId).join(" ")} — the 3-hour rule lapsed, but each of these names a branch or an open PR, so its owner is still on it. Measured over 48 completed cycles the median hold is 21 minutes and the p90 is 362, so the TTL cannot tell a slow claim from an abandoned one. Take one only after checking its branch and PR are genuinely dead.`+"\n" : ""}${suppressedCandidates.length ? `\n**Suppressed CANDIDATES — the only ids between this queue and a claimable row (${suppressedCandidates.length} of ${expiredInFlight.length}):** ${suppressedCandidates.map(formatItemId).join(" ")} — every other id on the line above fails some other test as well, so freeing it changes nothing. These are the ones worth a lookup. Check the branch and the pull request the claim line names: if the branch is gone from \`git ls-remote --heads origin\` and the PR is merged or closed, the work is done and the claim is a fossil — append a release line for it rather than re-taking the item. If the branch is gone and NO pull request was ever opened, the claim is ABANDONED and produced nothing: append an ABSTENTION (\`--action abstain\`), which withdraws this suppression without asserting the work is finished. \`node scripts/exec/fossil-claims.mjs --operator-root ~/Downloads\` answers both and prints the exact command. This generator does not read GitHub, so it can say which ids are worth checking and not whether any of them is alive.`+"\n" : ""}${lapsedClaims.length ? `\n**Claim LAPSED — abstained, and the item is UNVERIFIED (${lapsedClaims.length}):** ${lapsedClaims.map(formatItemId).join(" ")} — the newest register line for each of these is an abstention (\`item <id> NOT TAKEN\`) appended after an expired claim that named a branch or a PR, so the register itself has withdrawn the work-in-flight signal and these are claimable now. An abstention takes nothing and proves nothing: it is a verdict about the CLAIM, not about the item. Whether the work shipped from some other branch is still open, so **re-verify the item on \`main\` before re-taking it** — and do not read this bucket as progress.` : ""}${expiredClaims.length ? `\n**Expired with no branch or PR, free to take (${expiredClaims.length}):** ${expiredClaims.map(formatItemId).join(" ")} — re-claim with a fresh line.` : ""}
${releasedClaims.length ? `\n**Explicitly released (${releasedClaims.length}):** ${releasedClaims.map(formatItemId).join(" ")}` : ""}
${renderOrderDisagreements()}`;

fs.writeFileSync(OUT, out);
console.log(`Wrote ${path.basename(OUT)}: ${claimable.length} claimable, ${blockedOnUser.length} blocked on Anand, ${claimed.size} held, ${expiredClaims.length} expired-idle, ${expiredInFlight.length} expired-in-flight, ${lapsedClaims.length} lapsed, ${releasedClaims.length} released.`);
for (const [l, v] of Object.entries(byLane)) console.log(`  lane ${l}: ${v.length}`);
for (const band of bands) {
  console.log(
    `  band X-${band.start}: ` +
      BAND_LANES.map((l) => `${l} ${band.lanes[l].free} free`).join("  "),
  );
}
// Loud on both streams: a generator run unattended has its stdout tailed and
// its stderr read. A warning only one of them carries is one nobody sees.
for (const alert of bandAlerts) {
  console.log(`  ${alert.text}`);
  if (alert.exhausted) console.error(alert.text);
}
} // end runCli

if (isDirectInvocation(import.meta.url)) runCli();
