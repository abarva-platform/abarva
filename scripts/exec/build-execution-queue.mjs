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

/** Blockers only the user can clear. An agent must never pick these up. */
// Phrases that hand an item to the owner. Deliberately narrow.
//
// C-002 ends "This is a product call ... not a refactor" and was offered as
// claimable because none of the original phrases matched. The tempting fix was
// to add the bare word "decide" — measured, that would have moved 7 more items
// out of the queue, and every one of them is a technical fork an agent should
// settle: T-040 literally says "either is defensible". Starving the queue is
// the worse failure, because it idles agents on choices that were never the
// owner's. So this matches an explicit hand-off, not the presence of a choice.
const USER_BLOCKER = /signed-in|decision needed|approval to apply|blocked on .*policy|\bproduct call\b|\bowner'?s call\b/i;

function userBlockerText(item) {
  return [item.blocker, item.acceptance].filter(Boolean).join(" · ");
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

function readClaims() {
  if (!fs.existsSync(CLAIMS)) return { held: new Set(), expired: [], released: [] };
  const text = fs.readFileSync(CLAIMS, "utf8");
  const start = text.indexOf("## Claim log");
  if (start < 0) return { held: new Set(), expired: [], released: [] };

  // A claim line that names a branch or a PR is evidence the work exists
  // somewhere other than in the log. That is the signal the TTL cannot carry.
  const IN_FLIGHT = /\b(?:codex|claude)\/[\w./-]+|\bPR\s*#?\d{4}\b|#\d{4}\b/;

  const latest = new Map(); // item id -> { at, released, inFlight }
  for (const line of text.slice(start).split(/\r?\n/)) {
    if (!line.trim().startsWith("-")) continue;
    const at = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z)/)?.[1];
    const rawId = line.match(/\bitem\s*#?([A-Z]-\d{3}|\d+)\b/i)?.[1];
    if (!at || !rawId) continue;
    const when = Date.parse(at);
    const key = /^\d+$/.test(rawId) ? Number(rawId) : rawId.toUpperCase();
    const prev = latest.get(key);
    if (!prev || when >= prev.at) {
      latest.set(key, {
        at: when,
        released: /\bRELEASED\b/.test(line),
        inFlight: IN_FLIGHT.test(line),
      });
    }
  }

  const now = Date.now();
  const held = new Set();
  const expiredIdle = [];
  const expiredInFlight = [];
  const released = [];
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
  };
}

const { held: claimed, expired: expiredClaims, expiredInFlight, released: releasedClaims } = readClaims();
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
  .filter((i) => !USER_BLOCKER.test(userBlockerText(i)))
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
  (i) => !isFinished(i) && USER_BLOCKER.test(userBlockerText(i)),
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

1. Take the **first unclaimed row in your lane**. If your lane is empty, take the
   first unclaimed row in any lane.
2. Claim it by **appending one line** to \`EXECUTION_CLAIMS.md\` under
   \`## Claim log — append only\`:
   \`YYYY-MM-DDTHH:MMZ <agent> item <id> <branch> — claimed\`
   Never rewrite that file. Two agents have lost each other's edits doing so.
3. Work in **your own git worktree**. Never share a checkout.
4. When the item is merged and deployed, append a second line with the SHA and
   the deploy proof. The board reads the backlog, so also record the outcome in
   \`EXECUTION_BACKLOG_20260918.md\`.
5. Go to step 1. **Do not ask which item is next — this file answers that.**

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

### Writing an acceptance: the phrase carries meaning

Whether an item lands in *Blocked on Anand* is decided by **matching phrases**
in its blocker and acceptance text — \`signed-in\`, \`decision needed\`,
\`approval to apply\`, \`product call\`, \`owner's call\`. There is no separate
field for it. Two consequences, both measured rather than assumed:

- An acceptance whose *outcome* is that signed-in proof becomes owed reads the
  same as one that *awaits* it. Write the outcome some other way, or the item
  disappears from the queue.
- The match cannot read a negation. "No signed-in proof is required here" is
  currently counted as requiring it. Two items are affected; if that number
  grows, the fix is an explicit field, not a cleverer pattern — intent is not
  a pattern, and widening this one has already proved costly.

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
`;

fs.writeFileSync(OUT, out);
console.log(`Wrote ${path.basename(OUT)}: ${claimable.length} claimable, ${blockedOnUser.length} blocked on Anand, ${claimed.size} held, ${expiredClaims.length} expired-idle, ${expiredInFlight.length} expired-in-flight, ${releasedClaims.length} released.`);
for (const [l, v] of Object.entries(byLane)) console.log(`  lane ${l}: ${v.length}`);
