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

/* ---------------------------------------------------------------- parsing */

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
    const cells = line.slice(1, line.endsWith("|") ? -1 : undefined).split("|").map((c) => c.trim());
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

/** Every `| # | Item | Lane | Acceptance |` row in the backlog, with its section. */
function backlogTableItems(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let section = "(top)";
  let header = null;
  for (const line of lines) {
    const h = line.match(/^##+\s+(.*)$/);
    if (h) { section = h[1].trim(); header = null; continue; }
    if (!line.startsWith("|")) continue;
    const cells = line.slice(1, line.endsWith("|") ? -1 : undefined).split("|").map((c) => c.trim());
    if (/^-{2,}$/.test(cells[0]?.replace(/\s/g, "") ?? "")) continue;
    if (cells[0] === "#") { header = cells; continue; }
    if (!header) continue;
    if (header[0] !== "#") continue;
    // A `#` first column is not enough to make a table a backlog table. The
    // log carries exactly two item conventions — `# | Item | Lane | Acceptance`
    // for a definition and `# | Verdict | Proof` for an outcome — and anything
    // else numbered 1..n is prose. A mutation table headed
    // `# | Mutation | Failing cases` was read as four backlog items and
    // collided with #1-#4, four of the oldest and most-cited ids on the board;
    // that suppressed them as ambiguous and dropped three lifecycle stages
    // without any work being undone. Match the conventions, not the symbol.
    const kind = (header[1] ?? "").toLowerCase();
    if (kind !== "item" && kind !== "verdict") continue;
    const num = parseBacklogId(cells[0]);
    if (num === null) continue;
    out.push({
      num,
      section,
      title: cells[1] ?? "",
      lane: cells[2] ?? "",
      acceptance: cells[3] ?? "",
      raw: cells.join(" | "),
    });
  }
  return out;
}

/** Timestamped append-only entries from EXECUTION_CLAIMS.md. */
function executionClaimEntries(text) {
  const out = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const start = line.match(/^(?:[-*]\s+)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z)\s+\|\s+(.*)$/);
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

{
  const parsed = executionClaimEntries([
    "- 2026-09-19T16:10Z | agent | item T-020 · deployed",
    "2026-09-19T16:11Z | agent | item T-019 · claimed",
  ].join("\n"));
  if (parsed.length !== 2 || parsed[0].text.includes("T-019")) {
    throw new Error("Execution-claim parser merged adjacent timestamped claims");
  }
}

function latestClaim(entries) {
  return entries.reduce((latest, entry) => {
    if (!latest) return entry;
    return entry.timestamp >= latest.timestamp ? entry : latest;
  }, null);
}

/** Every `### Item NN [P?] — title` prose item in the backlog. */
function backlogProseItems(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^###\s+Item\s+(\d+|[DUCT]-\d{3})\s*(?:\[(P\d)\])?\s*[—-]\s*(.*)$/);
    if (!m) continue;
    const body = [];
    for (let j = i + 1; j < lines.length && !/^#{2,3}\s/.test(lines[j]); j += 1) body.push(lines[j]);
    out.push({
      num: parseBacklogId(m[1]),
      section: "prose",
      priority: m[2] ?? "",
      title: m[3].trim(),
      lane: "",
      acceptance: "",
      raw: body.join("\n"),
    });
  }
  return out;
}

/* ------------------------------------------------------- rung derivation */

/**
 * The proof ladder the team already uses. A rung is assigned only when a source
 * document states it in words; nothing is inferred from the existence of a PR
 * number or a deploy run on its own, and nothing is ever upgraded to rung 7 by
 * this script.
 */
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
    test: (t) =>
      /\blive-proven\b/i.test(t) ||
      /signed-in[^.]{0,60}\b(passed|proven|confirmed|resolved)\b/i.test(t),
    veto: (t) =>
      /\bnot\s+(?:live-proven|signed-in)\b/i.test(t) ||
      /signed-in[^.]{0,80}\b(pending|owed|not proven|not performed|not claimed|remains? (?:open|unproven))\b/i.test(t),
  },
  {
    rung: 6,
    key: "deployed",
    why: "source states deployed",
    test: (t) => /\bdeployed\b/i.test(t),
    veto: (t) =>
      /\bnot\b[^.;\n]{0,80}\bdeployed\b/i.test(t) ||
      /\bdeploy(?:ment)?\s+(?:is\s+)?(?:pending|owed|blocked|not performed|not claimed)\b/i.test(t),
  },
  {
    rung: 5,
    key: "merged",
    why: "source states merged",
    test: (t) => /\b(squash-)?merged\b/i.test(t),
    veto: (t) =>
      /\bnot\b[^.;\n]{0,80}\b(?:squash-)?merged\b/i.test(t) ||
      /\bmerge\s+(?:is\s+)?(?:pending|owed|blocked|not performed|not claimed)\b/i.test(t),
  },
  {
    rung: 4,
    key: "pr",
    why: "source names an open PR",
    test: (t) => /#\d{4}\b/.test(t),
  },
];

function deriveRung(text) {
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
    const quote = firstMatchingSentence(t, rule);
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

function firstMatchingSentence(text, rule) {
  for (const s of text.split(/(?<=[.;])\s+|\n+/)) {
    if (rule.test(s) && !rule.veto?.(s)) return s.trim().replace(/\s+/g, " ").slice(0, 200);
  }
  return "";
}

const BLOCKER_RULES = [
  { re: /\bnot\s+signed-in\b|signed-in[^.]{0,80}\b(pending|owed|not proven|not performed|not claimed|remains? (?:open|unproven))\b/i, say: "Signed-in acceptance owed" },
  { re: /\brequires? separate approval\b|\bApply requires\b/i, say: "Awaiting approval to apply" },
  { re: /decision needed|Decide first|decision required|Content decision/i, say: "Decision needed" },
  { re: /\bblocked\b/i, say: "Blocked (see source)" },
  { re: /\bunclaimed\b/i, say: "Unclaimed" },
];

function deriveBlocker(text) {
  const t = text ?? "";
  for (const r of BLOCKER_RULES) {
    const m = t.match(r.re);
    if (m) return { say: r.say, quote: sentenceAround(t, m.index ?? 0) };
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
const UPDATE_TITLE = /^(closed\b|confirmed\b|deploy verified\b|re-?verified\b|verified\b|misdescribed\b|resolved\b|superseded\b|[-\u2014\s]*closed\b)/i;
// Classified by what the entry SAYS, not where it sits: a "CLOSED — fixed
// by #7800" verdict row is an update whether it lands in prose or in a table.
const isUpdateNote = (d) =>
  /^Item\s+(?:\d+|[DUCT]-\d{3})\s+[—-]\s+(?:verdict|correction|closed|deploy verified|re-verified)\b/i.test(d.section ?? "") ||
  UPDATE_TITLE.test(stripMd(d.title || d.raw?.split("\n")[0] || ""));

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
function resolveItemRef(ref) {
  if (ref !== null && typeof ref === "object") {
    return { num: ref.num, definedIn: ref.definedIn ?? null };
  }
  return { num: ref, definedIn: null };
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
  const defs = pinned.length ? pinned : all;
  const substantive = defs.filter((d) => !isUpdateNote(d));
  const pinnedCleanly = Boolean(definedIn) && substantive.length === 1;

  const claims = claimTextForItem(num);
  const corpus = [...defs.map((d) => `${d.title} ${d.acceptance} ${d.raw}`), ...claims.map((c) => c.status)].join("\n");
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
    rung: deriveRung(corpus),
    blocker: deriveBlocker(corpus),
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
  const latestStageClaim = latestClaim(stageClaims);
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
  };
  fs.writeFileSync(path.join(OPERATOR_ROOT, "source-board-summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log("Wrote source-board-summary.json");
}

fs.writeFileSync(OUT, html);
console.log(`\nWrote ${path.relative(OPERATOR_ROOT, OUT)} (${(html.length / 1024).toFixed(1)} KB)`);
