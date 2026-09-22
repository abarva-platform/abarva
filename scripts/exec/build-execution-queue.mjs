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

const SCRIPT_ROOT = path.dirname(fileURLToPath(import.meta.url));

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
  if (!fs.existsSync(CLAIMS)) return { held: new Set(), expired: [], released: [] };
  const text = fs.readFileSync(CLAIMS, "utf8");
  const start = text.indexOf("## Claim log");
  if (start < 0) return { held: new Set(), expired: [], released: [] };

  // A claim line that names a branch or a PR is evidence the work exists
  // somewhere other than in the log. That is the signal the TTL cannot carry.
  const IN_FLIGHT = /\b(?:codex|claude)\/[\w./-]+|\bPR\s*#?\d{4}\b|#\d{4}\b/;

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
  const latest = new Map(); // item id -> { at, released, inFlight }
  const byAppendOrder = new Map(); // item id -> the LAST line appended for it
  for (const line of text.slice(start).split(/\r?\n/)) {
    const record = parseClaimRecord(line);
    if (!record) continue;
    const { at, rawId } = record;
    const when = Date.parse(at);
    const key = /^\d+$/.test(rawId) ? Number(rawId) : rawId.toUpperCase();
    const resolved = {
      at: when,
      stamp: at,
      released: announcesReleaseOf(line, record.idIndex, rawId.length),
      inFlight: IN_FLIGHT.test(line),
    };
    byAppendOrder.set(key, resolved);
    const prev = latest.get(key);
    if (!prev || when >= prev.at) latest.set(key, resolved);
  }

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
  const released = [];

  /** The bucket a single resolved line would put its item in. */
  const bucketOf = (v) => {
    if (v.released) return "released";
    if (now - v.at > CLAIM_TTL_MS) return v.inFlight ? "expired-in-flight" : "expired-idle";
    return "held";
  };

  for (const [num, v] of latest) {
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
    released: released.sort(compareItemIds),
    orderDisagreements: disagreements
      .map((d) => ({
        num: d.num,
        stampAt: d.stampWinner.stamp,
        appendAt: d.appendWinner.stamp,
        stampBucket: bucketOf(d.stampWinner),
        appendBucket: bucketOf(d.appendWinner),
      }))
      .sort((a, b) => compareItemIds(a.num, b.num)),
  };
}

const {
  held: claimed,
  expired: expiredClaims,
  expiredInFlight,
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

const claimable = all
  .filter((i) => i.rung === 0)
  // Closed is rung 0 because it proves nothing, but it is not work.
  .filter((i) => i.rungLabel !== "Closed")
  .filter((i) => !userBlockerText(i))
  // An entry with no acceptance criterion states no demonstrable outcome, so
  // there is nothing for an agent to finish or for anyone to check. Item 49 was
  // a rationale note — written to stop someone re-deriving a wrong answer — and
  // it sat in this queue as claimable work with acceptance "—". The backlog is
  // prose, and anything with an `### Item N` heading parses as an item, so the
  // queue has to be the thing that refuses to offer a note as work.
  .filter((i) => (i.acceptance ?? "").trim().length > 0)
  .filter((i) => !claimed.has(normalizeItemId(i.num)))
  // An expired claim whose line names a branch or a PR is work in flight, not
  // free work. Offering it invites the collision the claim log exists to stop.
  .filter((i) => !inFlightSet.has(normalizeItemId(i.num)));

// Order: lifecycle work before platform work, then by item number so the
// ordering is stable across runs and two agents derive the same sequence.
claimable.sort((a, b) => (Number(b.isLifecycle) - Number(a.isLifecycle)) || compareItemIds(normalizeItemId(a.num), normalizeItemId(b.num)));

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
Do not edit by hand. Regenerate:

\`\`\`
SOURCE_EXECUTION_HOME=~/Downloads node scripts/exec/build-source-board.mjs --json && \\
SOURCE_EXECUTION_HOME=~/Downloads node scripts/exec/build-execution-queue.mjs
\`\`\`

**${claimable.length} items are claimable right now with no input from Anand.**
${Object.entries(byLane).map(([l, v]) => `${l}:${v.length}`).join("  ")}

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

| who files it | band, in every lane |
|---|---|
| Claude Code | \`X-500\` to \`X-599\` |
| Codex | \`X-600\` to \`X-699\` |
| a human, or anything else | \`X-400\` to \`X-499\` |

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

${expiredInFlight.length ? `**Expired but WORK IN FLIGHT — do not take (${expiredInFlight.length}):** ${expiredInFlight.map(formatItemId).join(" ")} — the 3-hour rule lapsed, but each of these names a branch or an open PR, so its owner is still on it. Measured over 48 completed cycles the median hold is 21 minutes and the p90 is 362, so the TTL cannot tell a slow claim from an abandoned one. Take one only after checking its branch and PR are genuinely dead.`+"\n" : ""}${expiredClaims.length ? `\n**Expired with no branch or PR, free to take (${expiredClaims.length}):** ${expiredClaims.map(formatItemId).join(" ")} — re-claim with a fresh line.` : ""}
${releasedClaims.length ? `\n**Explicitly released (${releasedClaims.length}):** ${releasedClaims.map(formatItemId).join(" ")}` : ""}
${renderOrderDisagreements()}`;

fs.writeFileSync(OUT, out);
console.log(`Wrote ${path.basename(OUT)}: ${claimable.length} claimable, ${blockedOnUser.length} blocked on Anand, ${claimed.size} held, ${expiredClaims.length} expired-idle, ${expiredInFlight.length} expired-in-flight, ${releasedClaims.length} released.`);
for (const [l, v] of Object.entries(byLane)) console.log(`  lane ${l}: ${v.length}`);
