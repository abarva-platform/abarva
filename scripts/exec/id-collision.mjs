#!/usr/bin/env node
/**
 * Two findings, one item id — a detector, not an allocator (item T-729).
 *
 * Three times in one day two overlapping runs of the same scheduled task each
 * reached for "the next free number" and each got it. Every time it was found
 * by a human reading the file, or by an unrelated gate refusing an unrelated
 * append. This file makes that a command.
 *
 * The split is the point. Allocating ids safely across runs that overlap is a
 * coordination problem; noticing that one id introduces two different findings
 * is a file read, and the file is already on disk when it happens.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE ITEM GOT WRONG, MEASURED BEFORE A LINE OF THIS WAS WRITTEN
 * ---------------------------------------------------------------------------
 *
 * T-729 was filed as "nothing detects a duplicate item id". That is false, and
 * the true version is worse. `build-source-board.mjs` has had a collision
 * detector for longer than this item has existed. It is not quiet, either — it
 * prints a count, a percentage and a trend line on every run, and on the live
 * backlog it reports 59 collisions among 434 ids.
 *
 * It names none of the three collisions that actually happened.
 *
 * Probed against its own parser: `byNum` holds ZERO definitions for `T-721`
 * and ZERO for `T-727`. They are invisible to it, not misclassified. The
 * mechanism is entirely structural:
 *
 *   - `backlogTableItems` accepts a table only when its first header cell is
 *     literally `#`. Twenty-two headers on disk are written `| id | finding |
 *     lane | status |`, which is the convention every filing since T-700 uses,
 *     and every one of their rows is skipped.
 *   - `backlogProseItems` requires `^### Item <id>`. Both `T-721` filings and
 *     the first `T-727` filing are written under `##`.
 *
 * A control that reports 59 positives and misses every real one is this
 * directory's founding shape reached from a new direction: not a gate that
 * cannot fail, but a report loud enough that nobody notices what it cannot
 * see. So this ships as its own control, reading the file its own way, rather
 * than as a patch to a parser whose other consumers depend on its behaviour.
 *
 * ---------------------------------------------------------------------------
 * AND ONE MORE THING THE ITEM DOES NOT SAY
 * ---------------------------------------------------------------------------
 *
 * The backlog contains a table headed `| id | first holder | second holder |`
 * whose two rows are the two colliding ids. That is the human REPORT of the
 * collision, and it is shaped exactly like a FILING of one. A detector that
 * counts rows reports each of those ids three times and is wrong in the same
 * direction as the report it is reading. The filing-table shapes below are
 * therefore declared from a census of the real corpus, not inferred from the
 * `|` symbol — the same correction `build-source-board.mjs` already had to
 * make when a `# | Mutation | Failing cases` table was read as four items.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT DOES
 * ---------------------------------------------------------------------------
 *
 * `duplicate-filing`  one id introduced by two or more different sections of
 *                     the backlog, with every line number and every subject.
 * `claimed-ambiguous` one id a LIVE register claim holds while the backlog
 *                     introduces it more than once — the cross-document half,
 *                     in the only form that is decidable without a text
 *                     similarity threshold. `detect` records what the other
 *                     form would have cost, and why it is not here.
 *
 * It reports; it does not gate CI. The backlog is an operator document that
 * lives outside this repository, and a control whose subject is not in the
 * repository cannot be a required check without taking its truth from a file
 * the pull request never saw. Its refusal is advisory, and it is invoked the
 * way `--preclaim` is: by the agent, before it writes.
 *
 *   node scripts/exec/id-collision.mjs [--operator-root DIR]
 *        [--backlog FILE] [--register FILE] [--id <item id>]
 *        [--now ISO] [--window-hours 3] [--json] [--quiet]
 *
 * Exit 1 when anything is reported, 0 when nothing is.
 */

import fs from "node:fs";
import path from "node:path";

import { isDirectInvocation } from "./cli-entry.mjs";

export const DEFAULT_BACKLOG = "EXECUTION_BACKLOG_20260918.md";
export const DEFAULT_REGISTER = "EXECUTION_CLAIMS.md";

/* ------------------------------------------------------------------ ids */

export function stripMarkdown(value) {
  return String(value ?? "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .trim();
}

/**
 * The id grammar, kept deliberately identical to `parseBacklogId` in
 * `build-source-board.mjs`.
 *
 * A writer and a reader of one grammar that do not round-trip is a defect this
 * directory has already paid for, so this does not "improve" on the sibling
 * reader: `48a` is not an id there and it is not an id here. Diverging would
 * make the two readers disagree about what the backlog contains, which is the
 * disagreement T-702 spent a day unpicking.
 */
export function parseItemId(value) {
  const token = stripMarkdown(value).replace(/^#/, "").trim();
  if (/^\d+$/.test(token)) return Number(token);
  if (/^[DUCT]-\d{3}$/.test(token)) return token;
  return null;
}

export function displayItemId(id) {
  return typeof id === "number" ? `#${id}` : String(id);
}

/* -------------------------------------------------------------- tables */

/**
 * What a table's SECOND column heading says the table is for.
 *
 * Censused over the live backlog rather than chosen: 192 `# | Item`, 185
 * `# | Verdict`, 16 `id | finding`, 4 `# | Status`, 4 `# | Finding`, 3
 * `id | what is wrong`, 3 `# | Mutation`, 2 `# | Outcome`, and one each of
 * `id | what`, `id | verdict`, `id | stamp picks`, `id | first holder`.
 *
 * `filing` introduces an item. `update` reports on one already introduced.
 * Everything else is a table that happens to be numbered, and the two that
 * matter most are in that bucket: `mutation`, already known to have collided
 * with four of the oldest ids on the board, and `first holder`, which is the
 * collision report whose rows name the colliding ids.
 */
export const TABLE_ROLE_BY_SECOND_COLUMN = new Map([
  ["item", "filing"],
  ["finding", "filing"],
  ["what", "filing"],
  ["what is wrong", "filing"],
  ["verdict", "update"],
  ["status", "update"],
  ["outcome", "update"],
]);

export function tableRole(headerCells) {
  const first = (headerCells[0] ?? "").trim().toLowerCase();
  if (first !== "#" && first !== "id") return null;
  const second = (headerCells[1] ?? "")
    .trim()
    .toLowerCase()
    .replace(/,.*$/, "")
    .trim();
  return TABLE_ROLE_BY_SECOND_COLUMN.get(second) ?? null;
}

function splitRow(line) {
  return line
    .slice(1, line.endsWith("|") ? -1 : undefined)
    .split("|")
    .map((cell) => cell.trim());
}

/* ------------------------------------------------------------ headings */

/**
 * `## Item T-721 — …`, at any heading depth.
 *
 * Depth is deliberately not part of the grammar. Requiring `###` is exactly
 * what made both `T-721` filings invisible to the sibling reader, and the
 * depth an agent picks for a filing has never been part of the protocol.
 *
 * The id must sit in the ID POSITION — immediately after `Item`, before the
 * dash. A heading that files one item while naming another in its title
 * ("… T-720's own CLI did not run") must not be read as a filing of the one
 * it names. Position, not text.
 */
export const HEADING_RE =
  /^(#{2,6})\s+Item\s+(\d+|[DUCT]-\d{3})\s*(?:\[(P\d)\])?\s*[—–-]\s*(.*)$/;

/**
 * Status vocabulary that makes a heading a report on an item rather than an
 * introduction of one, tested at the START of the title.
 *
 * Every term below was taken from a census of the real corpus, not chosen:
 * the 388 item headings on disk were classified, and every title that is not
 * a filing opens with one of these. The single largest is `verdict` at 69.
 * The filings, by contrast, open with `filed` (45), `filed and` (4), or they
 * simply state the finding — `the Tower pressure brief is not on the Tower
 * route`, `398 of 898 component files are unreachable`, `nothing detects a
 * duplicate item id`.
 *
 * Anchoring at the start is what keeps this safe. A filing whose FINDING is
 * about a closed gate, a merged branch or a blocked review is extremely
 * likely in this corpus, and an anywhere-test would silently reclassify it —
 * and a filing read as an update is a collision nobody is told about.
 */
export const UPDATE_TITLE_PREFIX_RE = new RegExp(
  "^(?:" +
    [
      "verdict",
      "outcome",
      "status",
      "update",
      "addendum",
      "note",
      "correction",
      "closed",
      "(?:squash-)?merged",
      "deployed",
      "deployment verified",
      "deploy (?:verified|addendum)",
      "shipped",
      "live-proven",
      "signed-in",
      "confirmed",
      "verified",
      "re-?verified",
      "re-?read",
      "re-?opened",
      "resolved",
      "superseded",
      "misdescribed",
      "withdrawn",
      "measured",
      "triaged",
      "executed",
      "done",
      "decision (?:prepared|needed|recorded)",
      "review blocked",
      "blocked",
      "in progress",
      "still",
      "p0 remediation",
      "remediation",
      "root fix",
      "lifecycle reconciliation",
      "queue claim",
      "main quarantine",
      "current main",
      "pr",
    ].join("|") +
    ")\\b",
  "i",
);

/**
 * A status term written as a SUFFIX, behind a semicolon or a middle dot.
 *
 * This is the one place an anywhere-test is safe, and it is safe because it is
 * positional rather than lexical: the term must sit behind the punctuation
 * that separates a subject from a note about it. Swept over the whole corpus
 * it fires on exactly TWO of 388 headings, and both are genuine updates —
 * `… deployed; signed-in acceptance owed` and `… reads a command by POSITION;
 * PR open`. The second is the difference between reporting one live id twice
 * and reporting it three times.
 */
export const UPDATE_STATUS_SUFFIX_RE =
  /[;·]\s*(?:PR\b|CLOSED\b|MERGED\b|DEPLOYED\b|deploy verified\b|live-proven\b|signed-in\b|RELEASED\b)/i;

/**
 * A status term immediately followed by a date is a status statement, wherever
 * in the title it sits.
 *
 * `bounded slice closed 2026-09-19`, `deployment reconciliation closed
 * 2026-09-20T18:22Z`, `premise CORRECTED 2026-09-22`. Each opens with a word
 * no vocabulary would guess, and each is unmistakably a report. The date is
 * what makes this positional rather than lexical: a finding that merely
 * DISCUSSES closure does not stamp it.
 *
 * Swept over the corpus it reclassifies nine headings, and six of those nine
 * open with `filed` — `filed and closed 2026-09-20` is a filing and a closure
 * in one line, and it is a FILING, because the item enters the backlog there.
 * Reading it as an update would hide the very collision this detector exists
 * for. Hence the carve-out below, which wins over every other rule.
 */
export const UPDATE_DATED_STATUS_RE =
  /\b(?:closed|merged|deployed|deploy verified|verified|corrected|resolved|shipped|done|blocked|proven|released|re-?opened|withdrawn|superseded)\b[^,;]{0,12}\s+20\d\d-\d\d-\d\d/i;

/** A heading that says it files something is a filing, whatever else it says. */
export const FILING_TITLE_PREFIX_RE = /^filed\b/i;

export function isUpdateTitle(title) {
  if (FILING_TITLE_PREFIX_RE.test(title)) return false;
  return (
    UPDATE_TITLE_PREFIX_RE.test(title) ||
    UPDATE_STATUS_SUFFIX_RE.test(title) ||
    UPDATE_DATED_STATUS_RE.test(title)
  );
}

/**
 * The older convention: a table row updated IN PLACE by putting the verdict at
 * the start of its subject cell — `CLOSED — re-verified on current main`,
 * `CLOSED — SIGNED-IN PROVEN. PR #7874 …`, `MERGED; deploy proof pending.`
 *
 * Two things are deliberately narrower here than for a heading.
 *
 * The suffix and dated-status rules do NOT apply. A row's subject cell is a
 * paragraph, not a title; over that much prose either would eventually fire on
 * a finding that merely narrates a closure, and a filing read as an update is
 * a collision nobody is told about.
 *
 * And the status term must be followed by a SEPARATOR or a date, not by more
 * sentence. That clause is not caution, it is a measured repair: the bare
 * prefix rule read `Verdict headings that omit the word Item are parsed as
 * second definitions` as a verdict and dropped a real collision. A finding
 * ABOUT verdicts opens with the word; a verdict opens with the word and then
 * stops.
 */
const UPDATE_ROW_PREFIX_RE = new RegExp(
  `${UPDATE_TITLE_PREFIX_RE.source}\\s*(?:[\\u2014\\u2013:;,.\\-]|\\s+20\\d\\d-\\d\\d-\\d\\d|$)`,
  "i",
);

export function isUpdateRowSubject(subject) {
  if (FILING_TITLE_PREFIX_RE.test(subject)) return false;
  return UPDATE_ROW_PREFIX_RE.test(subject);
}

/* ---------------------------------------------------------- occurrences */

/**
 * Every place the backlog puts an id in an id position, with the section it
 * sits in.
 *
 * A section is a heading and everything under it until the next heading of
 * ANY depth. That unit is what stops an item colliding with itself: a filing
 * is routinely written as a heading AND a table row directly beneath it, and
 * counting both would make every well-formed filing a duplicate. Two genuine
 * filings of one id are always two sections, because each was written by a
 * different run appending to the end of the file.
 *
 * THE HEADING GOVERNS ITS SECTION, and that rule is not decoration. A closure
 * note is routinely written as `## Item T-716 — CLOSED …` followed by a table
 * that RESTATES the finding in filing shape, because a reader arriving at the
 * closure should not have to scroll up to learn what was closed. Read row by
 * row, every such restatement is a second filing, and the detector reports a
 * collision between an item and its own obituary. So an update heading that
 * names an id makes every row for that id inside its section an update too:
 * the classification is read once, at the head of the section, exactly as
 * T-725 had to read a disclaimer once at the head of a list.
 */
export function backlogOccurrences(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let sectionIndex = 0;
  let sectionTitle = "(top)";
  let header = null;
  let role = null;
  /** Ids this section's own heading already reported on. */
  let updatedHere = new Set();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNumber = i + 1;

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      sectionIndex += 1;
      sectionTitle = heading[2].trim();
      header = null;
      role = null;
      updatedHere = new Set();

      const item = line.match(HEADING_RE);
      if (item) {
        const id = parseItemId(item[2]);
        if (id !== null) {
          const title = stripMarkdown(item[4]);
          const kind = isUpdateTitle(title) ? "update" : "filing";
          if (kind === "update") updatedHere.add(id);
          out.push({
            id,
            lineNumber,
            sectionIndex,
            sectionTitle,
            via: "heading",
            kind,
            subject: title,
          });
        }
      }
      continue;
    }

    if (!line.startsWith("|")) {
      // A blank line ends a table. Without this, a paragraph between two
      // tables in one section lets the first table's header govern the second.
      if (!line.trim()) {
        header = null;
        role = null;
      }
      continue;
    }

    // No separate filter for a table's `|---|---|` rule row. One was written
    // and removed: a mutation deleting it changed nothing, on the corpus or in
    // the suite, because `---` is not an id and not a header cell either, so
    // the two checks below already reject it. A guard that cannot fail is the
    // shape this directory removes rather than keeps for comfort.
    const cells = splitRow(line);
    const firstCell = (cells[0] ?? "").trim().toLowerCase();
    if (firstCell === "#" || firstCell === "id") {
      header = cells;
      role = tableRole(cells);
      continue;
    }

    if (!header || !role) continue;
    const id = parseItemId(cells[0]);
    if (id === null) continue;

    const subject = stripMarkdown(cells[1] ?? "");
    const governedByHeading = updatedHere.has(id);
    out.push({
      id,
      lineNumber,
      sectionIndex,
      sectionTitle,
      via: "table",
      governedByHeading,
      kind:
        governedByHeading || (role === "filing" && isUpdateRowSubject(subject))
          ? "update"
          : role,
      subject,
    });
  }

  return out;
}

/**
 * Collapse occurrences into filings: one per (id, section).
 *
 * The subject preferred is the table row's, because a filing table states the
 * finding in one cell while the heading around it usually states the filing
 * event rather than the finding. A reader asking which two things are
 * competing for a number wants the findings.
 */
export function backlogFilings(text) {
  const byIdSection = new Map();
  for (const occurrence of backlogOccurrences(text)) {
    if (occurrence.kind !== "filing") continue;
    const key = `${occurrence.id}::${occurrence.sectionIndex}`;
    const existing = byIdSection.get(key);
    if (!existing) {
      byIdSection.set(key, {
        id: occurrence.id,
        sectionIndex: occurrence.sectionIndex,
        sectionTitle: occurrence.sectionTitle,
        lineNumber: occurrence.lineNumber,
        lines: [occurrence.lineNumber],
        via: occurrence.via,
        subject: occurrence.subject,
      });
      continue;
    }
    existing.lines.push(occurrence.lineNumber);
    if (existing.via !== "table" && occurrence.via === "table") {
      existing.via = "table";
      existing.subject = occurrence.subject;
    }
  }
  return [...byIdSection.values()].sort((a, b) => a.lineNumber - b.lineNumber);
}

/* -------------------------------------------------------------- register */

/**
 * Where one register record starts.
 *
 * Copied verbatim from `build-source-board.mjs`, which took it from
 * `build-execution-queue.mjs`, because readers of one grammar that disagree is
 * how 574 lines — 47.6% of the register — were silently swallowed once
 * already. If this expression ever needs to change it changes in all three,
 * and the reason is recorded here so the next reader knows there are three.
 */
export const CLAIM_RECORD_START =
  /^(?:[-*]\s+)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)\s+(?:\|\s*)?(.*)$/;

/** `item T-729` / `item #38` in the id position of a register record. */
const REGISTER_ITEM_RE = /\bitem\s+#?(\d+|[DUCT]-\d{3})\b/i;

export function registerClaims(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  let current = null;

  const flush = () => {
    if (!current) return;
    const match = current.text.match(REGISTER_ITEM_RE);
    const id = match ? parseItemId(match[1]) : null;
    if (id !== null) {
      out.push({
        id,
        lineNumber: current.lineNumber,
        timestamp: current.timestamp,
        released: /\bRELEASED\b/.test(current.text.slice(0, 200)),
        text: current.text,
      });
    }
    current = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const start = lines[i].match(CLAIM_RECORD_START);
    if (start) {
      flush();
      current = { timestamp: start[1], text: start[2].trim(), lineNumber: i + 1 };
      continue;
    }
    if (current && lines[i].trim() && !/^#{1,6}\s/.test(lines[i])) {
      current.text += ` ${lines[i].trim()}`;
    }
  }
  flush();
  return out;
}

/* --------------------------------------------------------------- detect */

/**
 * The whole control.
 *
 * `register` is optional and its absence is REPORTED rather than treated as a
 * clean cross-document result, because a check that did not run and a check
 * that passed must never print the same thing.
 *
 * `claimed-ambiguous` is scoped to claims that are LIVE — inside the same
 * three-hour window the claim protocol itself uses — and that scoping is the
 * whole difference between a finding and a wall. Unscoped, it reported 26 ids
 * on the live pair of documents, every one of them an item closed days ago
 * whose collision is already resolved. Scoped, it answers the question an
 * agent is actually asking as it reaches for the file: is somebody working
 * this number right now, on something other than what I am about to file?
 *
 * WHAT IS DELIBERATELY NOT HERE. The item also asked for "every id appearing
 * in the backlog under one subject and in the register under another". Built
 * and then removed after measurement: 48 ids are claimed in the register with
 * no filing in the backlog at all, and essentially none of them is a defect —
 * the register spans the Source board and the scope document as well, so an
 * id filed elsewhere reads as unfiled here. A channel that reports 48
 * non-findings buries the two that matter. Deciding it properly needs the
 * other two documents, which is a larger change than this item; deciding it
 * by comparing free-text subjects needs a similarity threshold whose error
 * rate cannot be measured against anything. Named here rather than shipped
 * half-working.
 */
export function detect({ backlog, register = null, now = null, windowHours = 3 }) {
  const filings = backlogFilings(backlog);

  const byId = new Map();
  for (const filing of filings) {
    if (!byId.has(filing.id)) byId.set(filing.id, []);
    byId.get(filing.id).push(filing);
  }

  const duplicates = [...byId.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([id, group]) => ({
      id,
      count: group.length,
      filings: group.map((f) => ({
        lineNumber: f.lineNumber,
        lines: f.lines,
        via: f.via,
        section: f.sectionTitle,
        subject: f.subject,
      })),
    }))
    .sort((a, b) => a.filings[0].lineNumber - b.filings[0].lineNumber);

  const report = {
    backlogFilings: filings.length,
    backlogIds: byId.size,
    duplicates,
    registerRead: register !== null,
    registerClaims: null,
    windowHours: null,
    now: null,
    claimedAmbiguous: [],
  };

  if (register === null) return report;

  const claims = registerClaims(register);
  const nowMs = now === null ? Date.now() : Date.parse(now);
  report.registerClaims = claims.length;
  report.windowHours = windowHours;
  report.now = new Date(nowMs).toISOString().replace(/\.\d{3}Z$/, "Z");

  const liveFromMs = nowMs - windowHours * 3600 * 1000;
  const duplicateIds = new Set(duplicates.map((d) => d.id));

  // In append order, and a RELEASE CLEARS THE HOLD rather than being skipped.
  // Skipping it leaves the last claim line standing as if the item were still
  // held — which is how a closed item reads as live, and the first cut of this
  // reported exactly that on an id released eleven minutes earlier.
  const liveById = new Map();
  for (const claim of claims) {
    if (!duplicateIds.has(claim.id)) continue;
    const at = Date.parse(claim.timestamp);
    if (!Number.isFinite(at) || at > nowMs) continue;
    if (claim.released) {
      liveById.delete(claim.id);
      continue;
    }
    if (at < liveFromMs) continue;
    liveById.set(claim.id, claim);
  }

  for (const [id, claim] of liveById) {
    report.claimedAmbiguous.push({
      id,
      claimLine: claim.lineNumber,
      claimedAt: claim.timestamp,
      filings: byId
        .get(id)
        .map((f) => ({ lineNumber: f.lineNumber, subject: f.subject })),
    });
  }

  report.claimedAmbiguous.sort((a, b) => a.claimLine - b.claimLine);
  return report;
}

export function findingCount(report) {
  return report.duplicates.length + report.claimedAmbiguous.length;
}

/* ------------------------------------------------------------------- CLI */

const USAGE =
  "usage: id-collision.mjs [--operator-root DIR] [--backlog FILE] [--register FILE]\n" +
  "                       [--id <item id>] [--now ISO] [--window-hours 3]\n" +
  "                       [--json] [--quiet]\n" +
  "reports one item id introduced by two different findings. Advisory: exit 1\n" +
  "when anything is reported, 0 when nothing is. Nothing in CI runs this.";

function valueAfter(argv, flag) {
  const at = argv.indexOf(flag);
  return at >= 0 ? argv[at + 1] : undefined;
}

function cli(argv) {
  if (argv.includes("--help")) {
    console.log(USAGE);
    return 0;
  }

  const operatorRoot = path.resolve(
    valueAfter(argv, "--operator-root") ??
      process.env.SOURCE_EXECUTION_HOME ??
      process.cwd(),
  );
  const backlogPath = path.resolve(
    valueAfter(argv, "--backlog") ?? path.join(operatorRoot, DEFAULT_BACKLOG),
  );
  const registerFlag = valueAfter(argv, "--register");
  const registerPath = path.resolve(
    registerFlag ?? path.join(operatorRoot, DEFAULT_REGISTER),
  );

  if (!fs.existsSync(backlogPath)) {
    console.error(`Backlog not found: ${backlogPath}`);
    console.error("Pass --backlog, or --operator-root / SOURCE_EXECUTION_HOME.");
    return 2;
  }

  let register = null;
  if (fs.existsSync(registerPath)) {
    register = fs.readFileSync(registerPath, "utf8");
  } else if (registerFlag) {
    console.error(`Register not found: ${registerPath}`);
    return 2;
  }

  const windowFlag = valueAfter(argv, "--window-hours");
  const report = detect({
    backlog: fs.readFileSync(backlogPath, "utf8"),
    register,
    now: valueAfter(argv, "--now") ?? null,
    windowHours: windowFlag === undefined ? 3 : Number(windowFlag),
  });

  const only = valueAfter(argv, "--id");
  if (only !== undefined) {
    const id = parseItemId(only);
    report.duplicates = report.duplicates.filter((d) => d.id === id);
    report.claimedAmbiguous = report.claimedAmbiguous.filter((d) => d.id === id);
    report.filteredTo = displayItemId(id);
  }

  if (argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 1));
    return findingCount(report) > 0 ? 1 : 0;
  }

  if (!argv.includes("--quiet")) {
    console.log(`Item id collisions — ${backlogPath}`);
    console.log(
      `  filings read:      ${report.backlogFilings} across ${report.backlogIds} ids`,
    );
    console.log(
      report.registerRead
        ? `  register read:     ${registerPath} (${report.registerClaims} records naming an item)`
        : "  register:          NOT READ \u2014 the live-claim check below did not run",
    );
    console.log(`  duplicate filings: ${report.duplicates.length}`);
    for (const dup of report.duplicates) {
      console.log(`    ${displayItemId(dup.id)} introduced ${dup.count} times:`);
      for (const f of dup.filings) {
        console.log(`      line ${f.lineNumber} (${f.via}, ${f.section.slice(0, 60)})`);
        console.log(`        ${f.subject.slice(0, 150)}`);
      }
    }
    if (report.registerRead) {
      console.log(
        `  held right now on an ambiguous id: ${report.claimedAmbiguous.length} ` +
          `(live = claimed within ${report.windowHours}h of ${report.now})`,
      );
      for (const c of report.claimedAmbiguous) {
        console.log(
          `    ${displayItemId(c.id)} held from register line ${c.claimLine} ` +
            `(${c.claimedAt}) while the backlog introduces it ${c.filings.length} times`,
        );
        for (const f of c.filings) {
          console.log(`        backlog line ${f.lineNumber}: ${f.subject.slice(0, 120)}`);
        }
      }
    }
    if (findingCount(report) === 0) {
      console.log("  nothing to report.");
    } else {
      console.log(
        "\nThis is advisory. An id carrying two findings is resolved the way the register\n" +
          "already resolved it once: the earlier filing keeps the id and the later one moves,\n" +
          "renumbered by whoever claims it.",
      );
    }
  }

  return findingCount(report) > 0 ? 1 : 0;
}

// Resolved through the shared guard (item T-723), never a filename suffix.
if (isDirectInvocation(import.meta.url)) {
  // `process.exitCode`, never `process.exit()`. The JSON report is tens of
  // kilobytes and stdout to a PIPE is asynchronous: `process.exit()` tears the
  // process down mid-write and the reader receives truncated JSON. Measured
  // here first time of asking, on the live backlog, through `| node -e`.
  process.exitCode = cli(process.argv.slice(2));
}
