#!/usr/bin/env node
/**
 * Deployment-register time authority (item T-457).
 *
 * Every line of the deployment register is stamped by whichever lane wrote it,
 * from that lane's own idea of the time. Measured against GitHub on 21 Sep,
 * one lane ran +67 to +74 minutes AHEAD of the `mergedAt` it was reporting and
 * another ran behind it. Opposite signs and non-constant magnitude, so it is
 * not a fixed skew a single offset would repair. The damage is not the lines —
 * each line's content checked out — it is that closed items had already
 * derived elapsed figures ("six hours ago", "the 30th hour") from that order,
 * and a reader cannot tell which such figure is sound.
 *
 * The authority, and there are only two sources:
 *
 *   event line  — GitHub's own `mergedAt` for a pull request, or a workflow
 *                 run's `createdAt` / `updatedAt`. Never an estimate, never
 *                 carried forward from earlier in the same run.
 *   claim line  — a literal `date -u` read at the instant of writing.
 *
 * and one derived rule: any line quoting an elapsed duration must name the two
 * timestamps it subtracted.
 *
 * This file is the executable form of that rule. It does NOT restamp anything:
 * the register is audit history and the correction pattern is append-only.
 *
 *   node scripts/exec/register-time-authority.mjs --file <register> \
 *        [--since <ISO>] [--now <ISO>] [--github] [--authority <json>] [--json]
 *   node scripts/exec/register-time-authority.mjs --emit --pr <n> [--github]
 *   node scripts/exec/register-time-authority.mjs --preclaim --file <register> \
 *        --item <id> --identity <base-agent#run-id> [--files a,b,c] [--strict]
 *
 * `--preclaim` is item T-706: the ownership check an agent runs BEFORE
 * appending a claim, answering take / already-yours / held-by-a-sibling /
 * held-by-another and exiting non-zero on the last two.
 *
 * `--files` is item T-707. The protocol's collision unit is one-owner-per-
 * FILE, not per item: two runs may hold two DIFFERENT items whose file lists
 * overlap, and the item check says `take` to both. Given this run's intended
 * file list it refuses when any path is already held by a live claim, naming
 * the path and the holder. Omitting it leaves that check unrun, and the
 * output says so rather than reading as a clean result.
 *
 * Exit 1 when any in-window line violates the rule. `--github` resolves the
 * authority with `gh`; `--authority <json>` injects it from a file, which is
 * how the behavioural suite proves the control without a network.
 */

import fs from "node:fs";
import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Parsing. Exported so the suite can assert on structure, not on stdout prose.
// ---------------------------------------------------------------------------

/**
 * `2026-09-21T16:04Z` or `2026-09-21T16:04:31Z` at the head of a line,
 * followed by the agent token.
 *
 * That token may carry a run id (`base-agent#run-id`), and it must. A
 * scheduled task's name identifies a FAMILY of runs; T-594 exists because two
 * concurrent runs of one task each read a claim written under their shared
 * base name and each reasonably concluded it was their own.
 *
 * `resolveClaimOwnership` below has always drawn that distinction correctly,
 * and every assertion for it passed a string literal in by hand. Measured on
 * the real register before `#` was added here, parsing produced 81 distinct
 * agent tokens and **0 of them carried a run id** — so the resolver was only
 * ever exercised on inputs the real pipeline could not produce, and on the
 * register itself all 18 of one task's runs collapsed into a single identity.
 * The fixture could not reach the branch.
 */
const STAMP_HEAD = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)\s*\|?\s*([A-Za-z0-9_.#-]+)?/;

/** Any ISO instant anywhere in the body — the endpoints an elapsed claim cites. */
const ISO_ANY = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z/g;

/** `PR #8155`, `#8155` only when a merge verb is on the line. */
const PR_REF = /(?:PR\s*#|pull\/)(\d{2,6})/gi;

/** A token that reports a merge as having happened. */
const MERGE_TOKEN =
  /\b(?:MERGED|squash-merged|squash merged|merged as|merge `[0-9a-f]{7,40}`|mergedAt)\b/g;

/**
 * Register prose says "NOT MERGED YET, checks running" as often as it says
 * "MERGED". Measured on the real register, reading a negated use as an
 * announcement produced a false drift pair and a false violation against a
 * line that was opening a pull request, not closing one. A negator within a
 * short reach before the token disqualifies it.
 */
const MERGE_NEGATOR = /\b(?:not|never|un|pending|awaiting|before|until|if|yet to be)\b[^.]{0,24}$/i;

/** Every merge token on the line, with whether a negator disqualifies it. */
function mergeTokens(text) {
  MERGE_TOKEN.lastIndex = 0;
  return [...text.matchAll(MERGE_TOKEN)].map((match) => ({
    index: match.index,
    negated: MERGE_NEGATOR.test(text.slice(Math.max(0, match.index - 28), match.index)),
  }));
}

/** True only when at least one merge token on the line is NOT negated. */
export function announcesMerge(text) {
  return mergeTokens(text).some((token) => !token.negated);
}

/**
 * Whether the line announces THIS pull request as merged, judged by the merge
 * token NEAREST that reference rather than by any token anywhere on the line.
 * Register lines are long and discursive: one line can report opening PR #A
 * while narrating the merge of PR #B, or, as this item's own claim line did,
 * use the word `mergedAt` to describe the rule rather than to report an event.
 * Reading any token on the line as an announcement of every reference on it
 * produced exactly that false positive.
 */
export function announcesMergeOf(text, referenceIndex) {
  const tokens = mergeTokens(text);
  if (tokens.length === 0) return false;
  let nearest = tokens[0];
  for (const token of tokens) {
    if (Math.abs(token.index - referenceIndex) < Math.abs(nearest.index - referenceIndex)) {
      nearest = token;
    }
  }
  return !nearest.negated;
}

/**
 * An elapsed-duration CLAIM: a bare duration next to a word that makes it a
 * measurement rather than a budget. `timeout-minutes: 5` and "within 5 minutes
 * of the hour" are not claims about how long something took.
 */
const ELAPSED_CLAIM =
  /\b\d+(?:\.\d+)?\s*(?:h|hr|hrs|hours?|m|min|mins|minutes?|d|days?)\b[^.]{0,40}?\b(?:ago|elapsed|earlier|later|behind|ahead|apart|since)\b|\b(?:ago|elapsed|earlier|later|behind|ahead|apart|since)\b[^.]{0,40}?\b\d+(?:\.\d+)?\s*(?:h|hr|hrs|hours?|m|min|mins|minutes?|d|days?)\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:hours?|minutes?|days?)\s+(?:ago|earlier|later)\b/i;

/**
 * Split a register into stamped lines. Unstamped prose (the file's preamble,
 * tables, narrative paragraphs) is not a register line and is not judged.
 */
export function parseRegisterLines(text) {
  const out = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const head = raw.match(STAMP_HEAD) ?? raw.match(/^-\s*item\s.*?\|\s*([A-Za-z0-9_.#-]+)\s*\|\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)/);
    if (!head) continue;
    const stamp = raw.startsWith("-") ? head[2] : head[1];
    const agent = raw.startsWith("-") ? head[1] : (head[2] ?? "unknown");
    if (!stamp) continue;
    const body = raw.slice(stamp.length);
    const prMatches = [...raw.matchAll(PR_REF)];
    const prRefs = [...new Set(prMatches.map((m) => Number(m[1])))];
    const prAnnounced = [
      ...new Set(
        prMatches
          .filter((m) => announcesMergeOf(raw, m.index))
          .map((m) => Number(m[1])),
      ),
    ];
    const citedTimes = [...body.matchAll(ISO_ANY)].map((m) => m[0]);
    out.push({
      lineNumber: i + 1,
      stamp,
      stampMs: Date.parse(stamp),
      agent,
      text: raw,
      prRefs,
      prAnnounced,
      citedTimes,
      announcesMerge: announcesMerge(raw),
      claimsElapsed: ELAPSED_CLAIM.test(raw),
    });
  }
  return out;
}

/**
 * Resolve whether a claim belongs to the exact scheduled run asking to resume
 * it. The base agent name names a family of runs; it is never an ownership
 * identity by itself.
 *
 * Concurrent runs may take different unclaimed items. Only an exact
 * `base-agent#run-id` match may resume an existing claim.
 */
export function resolveClaimOwnership(claimAgent, currentRunIdentity) {
  const split = (value) => {
    const match = String(value ?? "").match(
      /^([A-Za-z0-9_.-]+)#([A-Za-z0-9_.:-]+)$/,
    );
    return match ? { base: match[1], runId: match[2] } : null;
  };

  const current = split(currentRunIdentity);
  if (!current) return "invalid_current";
  if (claimAgent === currentRunIdentity) return "own";

  const claim = split(claimAgent);
  if (!claim) return "legacy_other";
  if (claim.base === current.base) return "sibling";
  return "other";
}

// ---------------------------------------------------------------------------
// Pre-claim ownership (item T-706).
//
// `resolveClaimOwnership` above has been correct since T-594, and item 34's
// parser repair finally feeds it real identities — measured on the register,
// distinct identities 81 -> 99 and identities carrying a run id 0 -> 18. What
// was still missing is a caller AT THE MOMENT IT MATTERS. Ownership was
// decided by an agent reading the file and judging for itself, which is the
// 18 Sep failure verbatim; and `auditWorktreeOwnership` cannot substitute,
// because it audits a register that already records the collision.
//
// This is the gate that runs BEFORE a claim line is appended.
// ---------------------------------------------------------------------------

/** The claim protocol's liveness window: a claim older than this has expired. */
export const CLAIM_WINDOW_HOURS = 3;

/**
 * An item id in SUBJECT position — the one a claim verb governs.
 *
 * A register line is long and discursive: one routinely claims item A while
 * naming item B's pull request, branch or blocker in the same sentence. The
 * id that holds the item is the one the word `item` introduces, not every id
 * the line mentions. This is the same nearest-token discipline `RELEASE_SUBJECT`
 * uses in the queue generator (T-545), narrowed to the one cue the register
 * actually writes: `item T-800 claimed`, `TAKING item T-704`, `RELEASED item
 * T-701(a)`, and the legacy `- item 21 | agent | ...` form.
 */
const ITEM_SUBJECT = /\bitems?\s+(?:\*\*)?`?([A-Za-z]{1,2}-\d{1,4}|\d{1,4})(\([a-z]\))?/gi;

/** Normalise `t-706`, `**T-706**`, `T-706(a)` to a comparable pair. */
function splitItemId(value) {
  const match = String(value ?? "")
    .trim()
    .replace(/^\*\*|\*\*$/g, "")
    .match(/^([A-Za-z]{1,2}-\d{1,4}|\d{1,4})(\([a-z]\))?$/);
  if (!match) return null;
  return { base: match[1].toUpperCase(), part: (match[2] ?? "").toLowerCase() };
}

/**
 * The `item` cue spelled as a COMMAND-LINE FLAG rather than the English word
 * (item T-714).
 *
 * `ITEM_SUBJECT` above reads the English cue the register writes: `item T-800
 * claimed`, `TAKING item T-704`. The register also quotes its own commands,
 * constantly and correctly, because a run that says which checks it performed
 * is doing the thing this backlog asks for: `--preclaim --item T-709 --files
 * ...`. The flag `--item` satisfies `\bitem\b`, so narrating that you RAN the
 * gate on an id records you as HOLDING it.
 *
 * Found by execution on the live register, not by reading: it is what refused
 * T-709 to three consecutive runs. Line 1896 at 21:44:01Z mentions T-709 once,
 * inside a quoted invocation; line 1965 at 00:17:00Z mentions it twice, both
 * times inside one. Neither line ever asserted anything about T-709 — which is
 * what separates this from T-709 itself, where a sentence DENIES the state it
 * names. And it is self-reinforcing: the more carefully a run documents its
 * gate checks, the more ids it locks for the full window.
 *
 * The cue is a hyphen immediately in front of the word whose own left
 * neighbour is not a word character. That is exact rather than heuristic, and
 * it is deliberately narrow enough to leave an English compound alone:
 * `line-item T-806` has a word character in front of its hyphen and goes on
 * holding. The legacy register form `- item 21 | agent` has a SPACE between
 * the dash and the word and is likewise untouched.
 *
 * ONE hyphen, not `-{1,2}`, and that is a correction rather than a shortcut.
 * The first draft wrote `-{1,2}` to spell out "`-item` or `--item`", and a
 * mutation widening it to `-{1,3}` survived the suite. The reason is that the
 * class in front admits a hyphen, so a run of any length already matches on
 * its last character: the quantifier was redundant, and a redundant quantifier
 * is one no test can constrain. Recorded because a surviving mutation is
 * usually an unreached branch and here it was an unreachable one.
 *
 * Placed here, in the veto layer, exactly as T-710's attributive rule was:
 * `ITEM_SUBJECT` is not widened or narrowed in the same change, so any
 * movement on the real register is attributable to this rule alone.
 */
const ITEM_FLAG_CUE = /(?:^|[^A-Za-z0-9_])-$/;

/**
 * A sentence that DENIES an item is claimed (item T-709).
 *
 * The register hands items back in the same English the gate reads as taking
 * them. `ITEM_SUBJECT` sees `item <id>` and calls the id claimed; but the
 * register writes `that is items T-707 and T-708, both still unclaimed` and
 * `Items **T-713** filed and left unclaimed`, and those are the words for
 * FREE. So announcing an item is available locks it for the full window, and
 * the more conscientiously a run hands work on, the more it takes with it.
 *
 * Found by execution before any code was written for T-707, on the real
 * register: T-707 and T-708 were the only two claimable lane-T rows in the
 * queue, and the gate refused both. The run took T-707 anyway after checking
 * all four register mentions by hand — which is the manual judgement this
 * gate exists to remove. Same shape as T-703 and T-705 on two other rules.
 *
 * Three decisions worth stating, because each is the difference between a
 * repair and a hole:
 *
 * 1. PER OCCURRENCE, never per line. Register line 1887 genuinely claims
 *    T-707 at its head and quotes the negated sentence three hundred
 *    characters later. A veto reading whole lines would free an item somebody
 *    is actively working — a false PASS, two runs on one item, far worse than
 *    the false refusal being repaired.
 *
 * 2. A BOUNDED REACH, measured off the live forms rather than guessed. The
 *    negation is five tokens past the id in the first (`and T-708, both still
 *    unclaimed`) and four in the second (`filed and left unclaimed`); a rule
 *    demanding adjacency misses both. Six is the limit, and the suite pins it
 *    from BOTH sides — six vetoes, seven does not — because a bound asserted
 *    only on the side that fires is a bound no test constrains, which is how
 *    T-714's redundant quantifier survived mutation.
 *
 * 3. CLAUSE BREAKS STOP IT. `item T-801 claimed on branch `x` — the runtime
 *    digest is OWED and NOT claimed` is a real register shape, and its
 *    negation is about the digest, not the item. A comma does not stop the
 *    reach, because the live form conjoins a pair across one.
 *
 * The vocabulary is counted off the register rather than brainstormed:
 * `not claimed` 105 occurrences, `not yet claimed` 22, `unclaimed` in the
 * subject forms above, `never claimed` 1. A fourth candidate, `no longer
 * claimed`, occurs zero times and was dropped — it is an alternative no test
 * on this register can constrain, and a mutation deleting it survived the
 * suite, which is the tell.
 *
 * `ITEM_SUBJECT` itself is untouched, as in T-710 and T-714, so movement on
 * the real register is attributable to this veto alone.
 *
 * CASE, re-measured 2026-09-23 (item T-715). The flag is case-insensitive and
 * the register shouts these words, but the two have never met: over the
 * register as it stood at its `2026-09-23T03:45:37Z` line, 67 negator
 * occurrences carry an upper-case letter and NONE of them is governed by a
 * subject-position id — 14 govern a bare mention, 53 reach no id at all — so
 * dropping the flag would move no verdict on any line written to date. The
 * reason is structural rather than lucky: `ITEM_SUBJECT` keys on the literal
 * word `item`/`items`, and the shouted form is a terse hand-back tag that does
 * not write it. The flag stays, because `items T-703 ... remain UNCLAIMED` is
 * one word away from a line the register already writes; the suite carries
 * that one word as a named edit to real text, not as an invented line.
 */
const CLAIM_STATE_NEGATOR = /\b(?:unclaimed|not\s+(?:yet\s+)?claimed|never\s+claimed)\b/i;

/**
 * An id this line only NARRATES, rather than claims (item T-716).
 *
 * The three vetoes above read what sits AFTER the id, or the two characters in
 * front of it. Neither reads the case where the id is the OBJECT of somebody
 * else's action, or a cross-reference to where a topic is already filed. The
 * line asserts nothing whatever about its own ownership, and until T-713 these
 * were masked: a later foreign release freed the item anyway. Scoping releases
 * to their author made them surface as refusals, which is how they were found.
 *
 * Two shapes, both counted off the register rather than brainstormed.
 *
 * 1. A THIRD-PARTY SUBJECT in front of the verb. Register line 1751 at
 *    16:34:05Z genuinely claims T-400 at its head and then writes
 *    `Sibling run \`#20260922T155500Z\` merged item 34 at 16:18:28Z and is
 *    still proving its deploy; I am a different owner` — a sentence whose
 *    entire point is that the id belongs to someone else.
 *
 * 2. A COPULAR CROSS-REFERENCE. Register line 1718 writes `map placement is
 *    already item T-614`, line 1737 writes `that is item T-614`, and lines
 *    264, 421 and 629 write `This is item 34 class`, `Both are item 49's
 *    lesson` and `this is item 31's prediction`. Seven occurrences of the
 *    copular form in the register, narration in all seven, and not one genuine
 *    claim written that way — the claim forms are `item X claimed`,
 *    `TAKING item X`, `MERGED item X`, `RELEASED item X` and the legacy
 *    `- item 21 | agent`, none of them copular.
 *
 * THE VERB IS NOT THE CUE, and that is the item's own open question answered
 * by measurement rather than preference. `merged item <id>` occurs 5 times;
 * FOUR of them are a run announcing its OWN merge at the head of its message
 * (`MERGED item 86 through PR #7876`, register lines 278, 283, 292, 296). A
 * rule keying on the verb would free four genuine records while their authors
 * were still proving the deploy — a false PASS, and this whole family of
 * repairs exists because a false pass is the worse direction. So the cue is
 * the third party in front of the verb, exactly the shape T-710 gave paths.
 *
 * The copula is ADJACENT rather than a reach, because a reach would free an id
 * claimed later in the same line; the third-party subject needs a bounded one,
 * because the live positive puts a run id between the subject and its verb.
 * Both bounds are pinned from both sides in the suite.
 *
 * Deliberately NOT included: the explicit-agent form `held by \`agent\``, which
 * T-710 gives paths. For items the register writes it after the id, not in
 * front, so there is nothing in front for this layer to read — and an
 * alternative no test on this register can constrain is one a mutation
 * deletes and survives, which is what T-709's `no longer claimed` taught.
 *
 * `ITEM_SUBJECT` itself is untouched, as in T-709, T-710 and T-714, so any
 * movement on the real register is attributable to this veto alone.
 *
 * THE LIMIT, stated rather than left implicit: a run that writes its own claim
 * in the copular voice — `the work I am taking is item T-500` — now reads as
 * narration and does not hold it. No line in 872 has been written that way,
 * and the sanctioned helper composes `item <id> claimed`, so the remaining
 * path to it is an operator writing it out by hand in a voice the protocol
 * does not use.
 */
const ITEM_COPULA = /\b(?:is|are)\s+(?:already\s+)?$/i;

/**
 * At most two words may sit between the third-party subject and its verb —
 * the same token bound `PATH_ATTRIBUTIVE` uses, and for the same reason: a
 * bound measured in CHARACTERS is one no test constrains, because the length
 * of whoever's run id sits in the middle is not a property of the grammar.
 * The live positive puts exactly two there, `run` and a backticked run id.
 */
const ITEM_THIRD_PARTY = new RegExp(
  "\\b(?:siblings?|another|other|others|else)\\s+(?:\\w+\\s+){0,2}" +
    "(?:merged|claimed|holds?|held|closed)\\s+$",
  "i",
);

/**
 * The text in front of an id, with each backticked span reduced to ONE word so
 * that the bound above counts words rather than characters. `attributiveReach`
 * performs the same reduction for paths, and this is where it earns its place:
 * without it, `Sibling run \`#20260922T155500Z\` merged` has a span the word
 * class cannot cross, and the live positive on register line 1751 goes on
 * being read as a claim.
 */
function itemAttributiveReach(before) {
  return before.replace(/`[^`]*`/g, "ref");
}

/** Whether this occurrence of an id is narrated about rather than claimed. */
function narratesItem(before) {
  const reach = itemAttributiveReach(before);
  return ITEM_COPULA.test(reach) || ITEM_THIRD_PARTY.test(reach);
}


/** How far past the id the negation may sit and still govern it. */
const NEGATION_REACH_TOKENS = 6;

/** A clause boundary the negation may not reach back across. */
const CLAUSE_BREAK = /[.;:|!?]|—|--/;

/**
 * The text an id governs: up to `NEGATION_REACH_TOKENS` words after it,
 * truncated at the first clause break.
 */
function governedTail(tail) {
  const cleaned = tail.replace(/^(?:\*+|`+)/, "").trim();
  if (cleaned === "") return "";
  const words = [];
  for (const token of cleaned.split(/\s+/).slice(0, NEGATION_REACH_TOKENS)) {
    const cut = token.search(CLAUSE_BREAK);
    if (cut === 0) break;
    words.push(cut === -1 ? token : token.slice(0, cut));
    if (cut !== -1) break;
  }
  return words.join(" ");
}

/** Whether this occurrence of an id is denied rather than claimed. */
function deniesClaim(line, afterIndex) {
  return CLAIM_STATE_NEGATOR.test(governedTail(line.slice(afterIndex)));
}

/** Every item id this line puts in subject position. */
export function itemSubjects(text) {
  const line = String(text);
  ITEM_SUBJECT.lastIndex = 0;
  const out = [];
  for (const match of line.matchAll(ITEM_SUBJECT)) {
    const before = line.slice(0, match.index);
    if (ITEM_FLAG_CUE.test(before)) continue;
    if (narratesItem(before)) continue;
    if (deniesClaim(line, match.index + match[0].length)) continue;
    const id = splitItemId(`${match[1]}${match[2] ?? ""}`);
    if (id) out.push(id);
  }
  return out;
}

/**
 * Whether the line ABSTAINS from its subject rather than claiming it.
 *
 * The register writes a decision NOT to take an item as its own record, and
 * those records are long: at 19:15:17Z one reads `item T-706 NOT TAKEN -
 * already in open PR #8280 ... touching exactly the two files this item names
 * (`scripts/exec/register-time-authority.mjs` and its suite)`. The abstention
 * is at the head; the files it names are six hundred characters later, far
 * beyond any negator reach, and they are named to say who ELSE is on them.
 *
 * Found by running the file gate against the real register rather than a
 * fixture: it was the one false positive in the live window, and it landed on
 * this very file. So the rule is the announcement verb at the head of the
 * message field, which is where the register puts it and where
 * `announcesRelease` already reads it.
 */
/**
 * The generated prefix `append-claim.mjs` puts in front of every record it
 * writes: `item <id> claimed`, optionally `on branch \`x\``, then an em dash.
 *
 * Reading past it is a REPAIR, not a widening. T-707 chose head-of-message
 * deliberately, because nearly every claim line in this register promises "one
 * public-safe release record" and a loose search for the word would free every
 * item in flight. This recognises ONE machine-generated string, so an operator
 * sentence cannot be caught by it.
 *
 * It exists because the helper wrote that prefix onto releases too, up to and
 * including T-712's fix, and those lines are already in the register — which
 * is append-only, so they cannot be restamped. Without this, a release handed
 * back at 23:08:45Z still held its files at 23:29Z.
 *
 * The limit, stated rather than left implicit: a hand-written record that
 * genuinely claims one item while OPENING its message with a release of
 * another would now read as a release. The writer refuses to compose that
 * line (T-712), so the remaining path to it is an operator writing it out by
 * hand against the protocol.
 */
const GENERATED_CLAIM_PREFIX =
  /^item\s+[A-Za-z]{0,2}-?\d{1,4}(?:\([a-z]\))?\s+claimed(?:\s+on\s+branch\s+`[^`]*`)?\s*(?:—|--|-)\s*/i;

/** The message field of a register line, with that generated prefix removed. */
export function messageField(text) {
  const parts = String(text).split("|");
  const raw = (parts.length > 2 ? parts[2] : parts[parts.length - 1] ?? "").trim();
  return raw.replace(GENERATED_CLAIM_PREFIX, "").trim();
}

export function announcesAbstention(text) {
  const message = messageField(text);
  return /^(?:\*\*)?(?:items?\s+(?:\*\*)?`?[A-Za-z]{0,2}-?\d{1,4}(?:\([a-z]\))?`?(?:\*\*)?\s+)?(?:\*\*)?NOT\s+(?:TAKEN|CLAIMED|TAKING)\b/i.test(
    message,
  );
}

/**
 * Whether the line RELEASES its subject rather than claiming it.
 *
 * Not a bare search for the word: nearly every claim line in the register
 * promises "one public-safe release record", and reading that as a release
 * would free every item in flight. The announcement form is the verb at the
 * head of the message field, which is where the register puts it.
 */
export function announcesRelease(text) {
  const message = messageField(text);
  return (
    /^(?:\*\*)?(?:RELEASED|RELEASING)\b/.test(message) ||
    /^(?:\*\*)?releas(?:ed|ing)\s+items?\b/i.test(message)
  );
}

/**
 * Answer, for one item and one run identity, whether this run may claim it.
 *
 * @param {ReturnType<typeof parseRegisterLines>} lines
 * @param {{ itemId:string, identity:string, nowMs:number, windowHours?:number }} opts
 * @returns {{ verdict:string, reason:string, holder:(object|null), refuses:boolean }}
 */
export function resolveItemClaim(lines, { itemId, identity, nowMs, windowHours }) {
  const wanted = splitItemId(itemId);
  if (!wanted) {
    return {
      verdict: "invalid-item",
      reason: `not an item id: ${itemId}`,
      holder: null,
      refuses: true,
    };
  }
  // The identity check runs first and unconditionally. A base name with no run
  // id is not an identity — treating it as one is the defect, not a shortcut
  // past it.
  if (resolveClaimOwnership(`${identity}`, identity) === "invalid_current") {
    return {
      verdict: "invalid-identity",
      reason:
        `\`${identity}\` carries no run id. A scheduled task's name identifies a ` +
        "FAMILY of runs; stamp claims `<base-agent>#<run-id>`.",
      holder: null,
      refuses: true,
    };
  }

  const windowMs = (windowHours ?? CLAIM_WINDOW_HOURS) * 3600 * 1000;
  const live = lines.filter(
    (line) =>
      Number.isFinite(line.stampMs) &&
      line.stampMs > nowMs - windowMs &&
      line.stampMs <= nowMs &&
      // An abstention holds nothing — it records a decision NOT to take the
      // item. The FILE half has skipped these since T-707; this half never
      // did, so `item T-803 NOT TAKEN — already in open PR #8280` refused the
      // next run that came for it.
      //
      // It is SKIPPED rather than answered as a release, and the difference is
      // not cosmetic: newest-line-wins would otherwise let B's abstention sit
      // on top of A's live claim and report the item free to a third run. A
      // first attempt did exactly that and this suite caught it. Transparent,
      // so the newest line that actually asserts ownership still decides.
      !announcesAbstention(line.text) &&
      itemSubjects(line.text).some(
        (id) => id.base === wanted.base && (wanted.part === "" || id.part === wanted.part),
      ),
  );

  if (live.length === 0) {
    return {
      verdict: "take",
      reason: `no live line within ${windowHours ?? CLAIM_WINDOW_HOURS}h names item ${wanted.base}${wanted.part} in subject position`,
      holder: null,
      refuses: false,
    };
  }

  // A release is authoritative for its OWN author, and for nobody else
  // (T-713). This is the keying the FILE half has always used: `releasedAt` is
  // per agent, so a release frees the records of the identity that wrote it.
  // This half read the newest line instead and honoured any release on it, so
  // B writing `RELEASED item X` handed A's live claim to the next run.
  //
  // A foreign release is SKIPPED, not answered from — the same shape T-712
  // gave abstentions, and for the same reason: newest-line-wins would
  // otherwise let B's record sit on top of A's claim and report the item free.
  // Transparent, so the newest line that actually asserts ownership decides.
  const releasedAt = new Map();
  for (const line of live) {
    if (!announcesRelease(line.text)) continue;
    const prior = releasedAt.get(line.agent);
    if (prior === undefined || line.stampMs > prior) releasedAt.set(line.agent, line.stampMs);
  }

  // A release frees only the records its author wrote BEFORE it. A release
  // cannot hand back a claim that did not exist when it was written.
  const holding = live.filter((line) => {
    if (announcesRelease(line.text)) return false;
    const released = releasedAt.get(line.agent);
    return released === undefined || released < line.stampMs;
  });

  if (holding.length === 0) {
    const newestRelease = live.reduce((best, line) =>
      line.stampMs > best.stampMs ||
      (line.stampMs === best.stampMs && line.lineNumber > best.lineNumber)
        ? line
        : best,
    );
    return {
      verdict: "take",
      reason: `every live line naming the item was released by its own author; the newest is line ${newestRelease.lineNumber} (${newestRelease.stamp}, \`${newestRelease.agent}\`)`,
      holder: {
        lineNumber: newestRelease.lineNumber,
        stamp: newestRelease.stamp,
        agent: newestRelease.agent,
        excerpt: newestRelease.text.slice(0, 200),
      },
      refuses: false,
    };
  }

  // The newest line that still asserts ownership wins — that is the protocol.
  const newest = holding.reduce((best, line) =>
    line.stampMs > best.stampMs || (line.stampMs === best.stampMs && line.lineNumber > best.lineNumber)
      ? line
      : best,
  );
  const holder = {
    lineNumber: newest.lineNumber,
    stamp: newest.stamp,
    agent: newest.agent,
    excerpt: newest.text.slice(0, 200),
  };

  const ownership = resolveClaimOwnership(newest.agent, identity);
  if (ownership === "own") {
    return {
      verdict: "already-yours",
      reason: `this exact run identity wrote the live claim on line ${newest.lineNumber}`,
      holder,
      refuses: false,
    };
  }
  if (ownership === "sibling") {
    return {
      verdict: "held-by-a-sibling",
      reason:
        `line ${newest.lineNumber} is held by \`${newest.agent}\` — a DIFFERENT run of your own ` +
        "scheduled task. A shared base name is not shared ownership (T-594).",
      holder,
      refuses: true,
    };
  }
  if (ownership === "legacy_other") {
    // The reach limit item 34 measured: 81 of 99 identities on the real
    // register carry no run id, so ownership is undecidable for them. Failing
    // closed here would refuse nearly every historical item and the gate would
    // be turned off, which is worse than an advisory that is read.
    return {
      verdict: "unresolved-legacy",
      reason:
        `line ${newest.lineNumber} is held by \`${newest.agent}\`, which carries no run id, so ` +
        "ownership cannot be resolved. Judge it by the file list; re-run with --strict to refuse.",
      holder,
      refuses: false,
      advisory: true,
    };
  }
  return {
    verdict: "held-by-another",
    reason: `line ${newest.lineNumber} is held by \`${newest.agent}\``,
    holder,
    refuses: true,
  };
}


// ---------------------------------------------------------------------------
// Pre-claim FILE overlap (item T-707).
//
// T-706 answers whether a run may take an ITEM. The rule that has actually
// cost work is one-owner-per-FILE: two runs may hold two DIFFERENT items whose
// file lists overlap, and the item gate says `take` to both. T-706's own run
// had to pass over T-705 and T-703 by reading claim lines and comparing file
// lists by hand — the manual judgement the gate exists to remove, one level
// down.
//
// Two things about the register make this harder than a set intersection, and
// both are decided here rather than left to chance:
//
//   1. `files:` lists are PROSE, and the real known positive does not use one.
//      At 18:20:29Z `claude-code-cc-a#20260922T1830Z` took T-704 and named
//      `scripts/exec/build-source-board.mjs` in a backticked Scope sentence
//      with no `files:` label anywhere on the line. A `files:`-only parser
//      passes every fixture and misses the one case written down in the item.
//      So a path is read from anywhere on the line, and `files:` is not a
//      precondition.
//   2. Several claims name a DIRECTORY (`docs/releases/records/`) because the
//      file does not exist yet. A directory is NOT a collision: nearly every
//      claim in the register names that one, and two runs adding two different
//      records to it do not contend. Directories and globs are reported as
//      notes and never refuse, in either position.
// ---------------------------------------------------------------------------

/**
 * Extensions that make a slashed token a repo path rather than English.
 *
 * The discriminator is deliberate. "A token containing a slash" reads
 * `Product/Lab`, `and/or` and `24/7` as files — all three are in the register
 * — and a gate that refuses on those is a gate that gets switched off.
 */
const PATH_SUFFIX =
  /\.(?:mjs|cjs|jsx?|tsx?|json|jsonc|md|mdx|ya?ml|sql|css|scss|html|sh|toml|txt|csv|png|svg)$/i;

/** A candidate path token: at least one `/`, path characters only. */
const PATH_TOKEN = /(?:^|[\s(`'"|,;])((?:\.{0,2}\/)?[A-Za-z0-9_.@-]+(?:\/[A-Za-z0-9_.@*-]+)*\/?(?:\*\*?)?)/g;

/**
 * Normalise a path as the register writes it: backticked, comma-separated,
 * sentence-terminated, sometimes absolute. Returns null when the token is not
 * a repo path at all.
 */
export function normalisePath(raw) {
  let value = String(raw ?? "").trim();
  value = value.replace(/^[`'"(\[]+/, "").replace(/[`'")\].,;:]+$/, "");
  if (!value.includes("/")) return null;
  value = value.replace(/^\.\//, "");
  const isScope = value.endsWith("/") || /\/\*\*?$/.test(value);
  if (!isScope && !PATH_SUFFIX.test(value)) return null;
  return { path: value, kind: isScope ? "scope" : "file" };
}

/**
 * A negator close in front of a path mention disqualifies it, the same reach
 * discipline `MERGE_NEGATOR` uses above. The register routinely writes
 * "Avoid `SourceAnalyticsCanvas.tsx` while #8289 is open" and "this claim does
 * not touch `SourceAnalyticsCanvas.tsx`" — both NAME a file in order to say
 * they are staying off it, and reading either as a hold would refuse a run
 * that is entitled to the file.
 */
const PATH_NEGATOR =
  /\b(?:avoid|avoiding|avoids|excluded|excluding|excludes|not|never|no|outside|free|freed|released|releasing|without|rather\s+than|instead\s+of)\b[^.]{0,40}$/i;

/**
 * An ATTRIBUTIVE cue in front of a path mention disqualifies it (item T-710).
 *
 * `PATH_NEGATOR` above catches a line that says it is staying OFF a file. It
 * does not catch the other thing the register does constantly: one lane
 * surveying the others before choosing what to touch, and naming their files
 * in order to say whose they are. Live line 1887 at 21:28:22Z writes
 * `(\`claude-code-cc-a#...\`, which names \`scripts/exec/register-time-authority.mjs\`)`
 * and `(\`codex-source-new-response-intake\`, which lists \`docs/architecture/test-ci-coverage-census.json\`)`
 * and line 1911 writes `that sibling holds \`scripts/exec/register-time-authority.mjs\``.
 * Every one of those was read as a hold by the lane doing the surveying.
 *
 * The disclaimer on line 1887 — "so I am deliberately NOT touching the census
 * file" — sits four hundred characters downstream of the first path, so no
 * reach-based negator can reach it. The attributive verb four words IN FRONT
 * can, and it is the more reliable cue anyway: it is written precisely because
 * the path is being attributed to somebody else.
 *
 * The other repair the item offered — read only each line's own `files:` list
 * — was ruled out by measurement rather than by preference: re-measured on the
 * live register, 9 of 62 live lines carry a `files:` label. A `files:`-only
 * parser would stop reading the paths the other 53 name in prose, and that is
 * a false PASS. This is a false REFUSAL, which costs a reader one look.
 *
 * So the cue is deliberately not a bare verb. `this claim holds \`x\`` must go
 * on holding `x`. The veto fires only on a form that names a THIRD party: a
 * relative clause (`which names`), an explicit agent (`held by`), or a
 * third-party subject (`that sibling holds`).
 */
const PATH_ATTRIBUTIVE = new RegExp(
  "\\b(?:" +
    // a relative clause: `(\`agent\`, which names ...)`
    "(?:which|who|that)\\s+(?:also\\s+)?(?:names?|lists?|holds?|claims?|carries)" +
    "|" +
    // a third-party subject: `that sibling holds ...`, `the other lane lists ...`
    "(?:siblings?|another|other|others|else)\\s+(?:\\w+\\s+){0,2}(?:names?|lists?|holds?|claims?)" +
    "|" +
    // an explicit agent: `held by \`codex-...\`: ...`
    "(?:held|claimed|owned|taken)\\s+by" +
    ")\\b[^.]{0,40}$",
  "i",
);

/**
 * The text in front of a path, with backticked spans reduced so that reach is
 * measured in words rather than in the length of whoever's run id sits between
 * the verb and the file.
 *
 * A backticked span that is ITSELF a path becomes a full stop, not a blank:
 * it ends the cue's reach exactly as a sentence boundary would. Without that,
 * `which names \`a.mjs\` and my own \`b.mjs\`` would free `b.mjs` too, which is
 * this item's own defect reversed.
 */
function attributiveReach(before) {
  return before.replace(/`([^`]*)`/g, (_, inner) => (normalisePath(inner) ? "." : "``"));
}

/** Every repo path this line HOLDS, with the ones it merely mentions dropped. */
export function claimedPaths(text) {
  const line = String(text ?? "");
  const out = new Map();
  PATH_TOKEN.lastIndex = 0;
  for (const match of line.matchAll(PATH_TOKEN)) {
    const normalised = normalisePath(match[1]);
    if (!normalised) continue;
    const before = line.slice(0, match.index + (match[0].length - match[1].length));
    if (PATH_NEGATOR.test(before)) continue;
    if (PATH_ATTRIBUTIVE.test(attributiveReach(before))) continue;
    if (!out.has(normalised.path)) out.set(normalised.path, normalised);
  }
  return [...out.values()];
}

/**
 * Answer, for one run identity and the file list it intends to touch, whether
 * any live claim already holds one of those paths.
 *
 * @param {ReturnType<typeof parseRegisterLines>} lines
 * @param {{ files:string[], identity:string, nowMs:number, windowHours?:number }} opts
 */
export function resolveFileOverlap(lines, { files, identity, nowMs, windowHours }) {
  const requested = [];
  const unparsed = [];
  for (const raw of files ?? []) {
    const normalised = normalisePath(raw);
    if (normalised) requested.push(normalised);
    else if (String(raw).trim()) unparsed.push(String(raw).trim());
  }

  const windowMs = (windowHours ?? CLAIM_WINDOW_HOURS) * 3600 * 1000;
  const conflicts = [];
  const notes = [];

  const inWindow = lines.filter(
    (line) =>
      Number.isFinite(line.stampMs) &&
      line.stampMs > nowMs - windowMs &&
      line.stampMs <= nowMs,
  );

  // The newest line wins, exactly as it does for an item: a release hands the
  // files back and re-opens them for the next run. The register writes that
  // release as "RELEASED item T-704 - merged, all files free", so the unit it
  // frees is the AGENT's hold, not a re-listed path; not honouring it would
  // lock every released path for three hours after it was handed back.
  //
  // The limit, stated rather than left implicit: an agent holding two items at
  // once and releasing one is read as releasing both. The register's own
  // release grammar says "all files free", so that is what it means today.
  const releasedAt = new Map();
  for (const line of inWindow) {
    if (!announcesRelease(line.text)) continue;
    const prior = releasedAt.get(line.agent);
    if (prior === undefined || line.stampMs > prior) releasedAt.set(line.agent, line.stampMs);
  }

  for (const line of inWindow) {
    // An abstention holds nothing. It names files to say who else is on them.
    if (announcesRelease(line.text) || announcesAbstention(line.text)) continue;
    const released = releasedAt.get(line.agent);
    if (released !== undefined && released >= line.stampMs) continue;
    const ownership = resolveClaimOwnership(line.agent, identity);
    // Only this exact run may hold its own files. A SIBLING contends: that is
    // the distinction base-name keying loses, one level down from T-706.
    if (ownership === "own") continue;

    const held = new Map(claimedPaths(line.text).map((p) => [p.path, p]));
    for (const want of requested) {
      const match = held.get(want.path);
      if (!match) continue;
      const entry = {
        path: want.path,
        lineNumber: line.lineNumber,
        stamp: line.stamp,
        agent: line.agent,
        ownership,
        excerpt: line.text.slice(0, 200),
      };
      // A directory or glob is a SCOPE, not a lock — in either position.
      if (want.kind === "scope" || match.kind === "scope") notes.push(entry);
      else conflicts.push(entry);
    }
  }

  return {
    checked: true,
    requested: requested.map((p) => p.path),
    unparsed,
    conflicts,
    notes,
    refuses: conflicts.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Auditing.
// ---------------------------------------------------------------------------

/**
 * @param {ReturnType<typeof parseRegisterLines>} lines
 * @param {{ nowMs:number, sinceMs:number, authority:Record<string,{mergedAt?:string}>|null }} opts
 */
export function auditLines(lines, { nowMs, sinceMs, authority }) {
  const violations = [];
  const drift = [];
  let outOfWindow = 0;
  let inWindow = 0;
  let stampRegressions = 0;
  let highWater = -Infinity;

  for (const line of lines) {
    if (Number.isFinite(line.stampMs)) {
      if (line.stampMs < highWater) stampRegressions += 1;
      highWater = Math.max(highWater, line.stampMs);
    }

    if (!Number.isFinite(line.stampMs) || line.stampMs < sinceMs) {
      outOfWindow += 1;
      continue;
    }
    inWindow += 1;

    // (1) A stamp later than the moment the file is read is always wrong, and
    //     needs no network to prove. This is the failure actually observed.
    if (line.stampMs > nowMs) {
      violations.push({
        code: "future_stamp",
        stamp: line.stamp,
        agent: line.agent,
        lineNumber: line.lineNumber,
        detail:
          `stamped ${Math.round((line.stampMs - nowMs) / 1000)}s after the clock ` +
          `read at audit time (${new Date(nowMs).toISOString()})`,
      });
    }

    // (2) An elapsed duration with nothing behind it is the figure a reader
    //     cannot check. Naming both endpoints clears it.
    if (line.claimsElapsed && line.citedTimes.length < 2) {
      violations.push({
        code: "unsourced_elapsed",
        stamp: line.stamp,
        agent: line.agent,
        lineNumber: line.lineNumber,
        detail: `quotes an elapsed duration but names ${line.citedTimes.length} of the 2 timestamps it subtracted`,
      });
    }

    // (3) The authority check proper. Only run when an authority set was
    //     supplied, and then a missing entry is reported rather than skipped —
    //     a lookup that quietly finds nothing must not read as a pass.
    if (authority && line.announcesMerge) {
      for (const pr of line.prAnnounced) {
        const entry = authority[String(pr)];
        if (!entry?.mergedAt) {
          violations.push({
            code: "authority_missing",
            stamp: line.stamp,
            agent: line.agent,
            pr,
            lineNumber: line.lineNumber,
            detail: `announces a merge of PR #${pr} with no authoritative mergedAt available to check it against`,
          });
          continue;
        }
        const mergedMs = Date.parse(entry.mergedAt);
        const driftSeconds = Math.round((line.stampMs - mergedMs) / 1000);
        // A line that quotes the authoritative instant is self-proving however
        // late it was written: a deliberate back-reconciliation of a merge from
        // four hours ago is correct behaviour, not clock drift, and must not be
        // counted as the defect. What the rule actually forbids is a line far
        // from its event that leaves the reader nothing to check it against.
        const citesAuthority = line.text.includes(entry.mergedAt);
        drift.push({ pr, stamp: line.stamp, mergedAt: entry.mergedAt, driftSeconds, citesAuthority, agent: line.agent });
        if (driftSeconds > TOLERANCE_SECONDS && !citesAuthority) {
          violations.push({
            code: "drifted_without_authority",
            stamp: line.stamp,
            agent: line.agent,
            pr,
            lineNumber: line.lineNumber,
            driftSeconds,
            detail:
              `announces PR #${pr} ${driftSeconds}s after GitHub's mergedAt ${entry.mergedAt} ` +
              `without quoting it, so the stamp is the only time on offer and it is not the event's`,
          });
        }
        // A merge cannot be announced before it happened. One minute of slack
        // covers minute-precision stamps rounding down through the event.
        if (driftSeconds < -60) {
          violations.push({
            code: "announced_before_event",
            stamp: line.stamp,
            agent: line.agent,
            pr,
            lineNumber: line.lineNumber,
            driftSeconds,
            detail: `announces PR #${pr} as merged ${Math.abs(driftSeconds)}s before GitHub's mergedAt ${entry.mergedAt}`,
          });
        }
      }
    }
  }

  return { violations, drift, inWindow, outOfWindow, stampRegressions, total: lines.length };
}

/**
 * Item 34 — one worktree per session.
 *
 * On 18 Sep two sessions drove one shared checkout at the same time. Its
 * index, HEAD and working tree are shared state: one session's uncommitted
 * edit was discarded by the other's branch creation, and one session's commit
 * was pushed inside the other's pull request. The answer — each session gets
 * its own `git worktree` — was written into the operator protocol as prose,
 * and prose cannot fail. This is that rule as something that runs.
 *
 * A worktree path named by two different run identities inside the window is
 * the collision. The same identity naming its own worktree across a claim line
 * and a release line is the normal case and must stay silent.
 *
 * Three boundaries matter, and each was found by measurement rather than
 * reasoning:
 *
 *   - Attribution follows a STAMPED record start only. A wrapped continuation
 *     carries no stamp and belongs to the record above it; crediting it to
 *     whichever agent was last seen invents an owner. A throwaway version of
 *     this detector did exactly that against the real register and reported a
 *     shared path that was not shared — the same record-boundary defect T-702
 *     repaired in the board generator, reproduced independently here.
 *
 *   - Identity is the WHOLE token, never the base name. `lane-a` and
 *     `lane-a#run-2` are not one owner: comparing base names would read a
 *     genuine two-run collision as a single session's own traffic, which is
 *     the precise failure this control exists to catch.
 *
 *   - A path must be CLAIMED, not merely cited. See WORKTREE_CUE.
 */
export function auditWorktreeOwnership(lines, { sinceMs }) {
  const violations = [];
  const owners = new Map();

  for (const line of lines) {
    if (!Number.isFinite(line.stampMs) || line.stampMs < sinceMs) continue;
    for (const path of worktreePaths(line.text)) {
      if (!owners.has(path)) owners.set(path, new Map());
      const seen = owners.get(path);
      if (!seen.has(line.agent)) seen.set(line.agent, line.lineNumber);
    }
  }

  for (const [path, seen] of owners) {
    if (seen.size < 2) continue;
    const who = [...seen.entries()].sort((a, b) => a[1] - b[1]);
    violations.push({
      code: "worktree_shared",
      stamp: null,
      agent: who[0][0],
      lineNumber: who[0][1],
      detail:
        `worktree ${path} is named by ${seen.size} run identities — ` +
        who.map(([agent, at]) => `${agent} (line ${at})`).join(", ") +
        ". One checkout's index, HEAD and working tree are shared state: see item 34.",
    });
  }

  return violations;
}

/**
 * Worktree paths as the register actually writes them. Deliberately anchored
 * to the forms in use rather than to anything path-shaped: the register quotes
 * `src/...` and `scripts/...` constantly in file lists, and a detector that
 * read every path as a checkout would fire on those instead.
 */
const WORKTREE_PATH =
  /(?:\/private)?\/tmp\/[A-Za-z0-9._-]*(?:exec|worktree|wt)[A-Za-z0-9._-]*|\.claude\/worktrees\/[A-Za-z0-9._-]+|(?:\/Users\/[A-Za-z0-9._-]+)?\/\.codex\/worktrees\/[A-Za-z0-9._\/-]+/g;

/**
 * A cue that the path is where this run WORKS, not one it merely cites.
 *
 * This is not a refinement anyone reasoned their way to. The first version of
 * this control had no cue and was run against the real register, where it
 * reported one shared worktree — fired by a claim line that quoted another
 * run's path while narrating a false positive it had just diagnosed. The
 * register is discursive and lanes cite each other's paths constantly, so a
 * bare mention cannot mean occupancy.
 *
 * Short reach, immediately before the path, on the same idiom as
 * MERGE_NEGATOR above: `own worktree /tmp/...`, `in my own worktree`,
 * `worktree /tmp/... removed`, `checkout /tmp/...`.
 */
const WORKTREE_CUE = /\b(?:worktree|worktrees|checkout)\b[^.]{0,12}$/i;

function worktreePaths(text) {
  WORKTREE_PATH.lastIndex = 0;
  const found = [];
  for (const match of text.matchAll(WORKTREE_PATH)) {
    const before = text.slice(Math.max(0, match.index - 40), match.index);
    if (!WORKTREE_CUE.test(before)) continue;
    found.push(match[0].replace(/[.,;:`)\]]+$/, ""));
  }
  return [...new Set(found)];
}

/** Drift spread, which is the number that says whether a single offset would fix it. */
export function summariseDrift(drift) {
  if (drift.length === 0) return null;
  const values = drift.map((d) => d.driftSeconds).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return {
    samples: values.length,
    minSeconds: values[0],
    maxSeconds: values[values.length - 1],
    medianSeconds: values.length % 2 ? values[mid] : Math.round((values[mid - 1] + values[mid]) / 2),
    outsideToleranceSeconds: values.filter((v) => Math.abs(v) > TOLERANCE_SECONDS).length,
    outsideToleranceUncited: drift.filter(
      (d) => Math.abs(d.driftSeconds) > TOLERANCE_SECONDS && !d.citesAuthority,
    ).length,
  };
}

/**
 * The grace period before an unwritten merge counts as skipped rather than in
 * flight. A deploy takes roughly ten to sixteen minutes on this repo, and an
 * outcome line cannot honestly name a digest before its run has produced one,
 * so a merge from four minutes ago is not a gap.
 */
export const CLOSEOUT_GRACE_SECONDS = 900;

/**
 * Closeout coverage (item T-474) — the complement of `auditLines`.
 *
 * `auditLines` judges the content of lines that exist. The failure four
 * consecutive pulses filed is lines that do not exist: a merge nobody writes
 * down is invisible to a content audit, so the audit stayed green straight
 * through it. T-581, T-584 and T-586 each reconciled a batch by hand and each
 * was re-filed verbatim within the hour, because reconciling is not a step
 * anything runs. This is.
 *
 * A pull request counts as closed out when some register line announces THAT
 * pull request by number as merged — the `prAnnounced` attribution already
 * used above, which reads the merge token nearest the reference rather than
 * any token on the line. Two things that look like a record are therefore not
 * one, and both were measured on the real register:
 *
 *   - a claim line naming the commit it BRANCHED FROM contains that merge SHA
 *     and reports no outcome at all. Every pulse that filed this shape
 *     measured it by grepping for the SHA, which scores those lines present;
 *     on 2026-09-22 four merges were mentioned only that way.
 *   - a line announcing the pull request as OPENED, NOT MERGED is the line
 *     written before the event this is looking for.
 *
 * Severity, deliberately unlike the codes above: attribution is a heuristic,
 * and the codes that depend on it are advisory there because over-triggering
 * would raise false violations. Here the same heuristic fails the other way
 * round — a false attribution CREDITS a pull request and makes the gate pass,
 * while a missed one costs an agent a re-read and an appended line, which is
 * the behaviour wanted anyway. So `closeout_missing` is exact enough to fail a
 * run, and it is in HARD_CODES.
 *
 * @param {ReturnType<typeof parseRegisterLines>} lines
 * @param {{ merged:Record<string,{mergedAt?:string,sha?:string}>|null, nowMs:number, graceSeconds?:number }} opts
 */
export function auditCloseout(lines, { merged, nowMs, graceSeconds = CLOSEOUT_GRACE_SECONDS }) {
  const violations = [];
  const closeout = [];
  const prs = Object.keys(merged ?? {})
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  // The exemption branch, and the one that decides whether this is a gate at
  // all. An empty authority is what a broken lookup, an expired credential or
  // a window with no overlap all return, and the obvious implementation reads
  // every one of them as a closed-out day. It fails closed instead.
  if (prs.length === 0) {
    violations.push({
      code: "closeout_authority_empty",
      stamp: new Date(nowMs).toISOString(),
      agent: "unknown",
      lineNumber: null,
      detail:
        "resolved no merged pull requests to check, so nothing was verified; " +
        "an empty authority is a failed lookup or a wrong window, not a clean register",
    });
    return { violations, closeout };
  }

  /** First line that announces each pull request as merged. */
  const announced = new Map();
  for (const line of lines) {
    for (const pr of line.prAnnounced) {
      if (!announced.has(pr)) announced.set(pr, line);
    }
  }

  for (const pr of prs) {
    const entry = merged[String(pr)] ?? {};
    const mergedMs = Date.parse(entry.mergedAt ?? "");
    const line = announced.get(pr) ?? null;
    const recorded = line !== null;
    const ageSeconds = Number.isFinite(mergedMs) ? Math.round((nowMs - mergedMs) / 1000) : null;
    // An unparseable mergedAt is not evidence of youth: no age means no grace.
    const pending = !recorded && ageSeconds !== null && ageSeconds < graceSeconds;
    closeout.push({
      pr,
      mergedAt: entry.mergedAt ?? null,
      sha: entry.sha ?? null,
      recorded,
      recordedLine: line?.lineNumber ?? null,
      recordedStamp: line?.stamp ?? null,
      ageSeconds,
      pending,
    });
    if (recorded || pending) continue;
    violations.push({
      code: "closeout_missing",
      stamp: entry.mergedAt ?? "unknown",
      agent: "unwritten",
      pr,
      lineNumber: null,
      detail:
        `PR #${pr} merged ${entry.mergedAt ?? "at an unknown instant"}` +
        `${entry.sha ? ` as \`${entry.sha}\`` : ""}` +
        `${ageSeconds === null ? "" : ` (${ageSeconds}s ago, past the ${graceSeconds}s grace)`}` +
        " and no register line announces it — the merge happened, the record did not",
    });
  }

  return { violations, closeout };
}

/**
 * The stated tolerance. A line is written after the event it reports, so a
 * small positive drift is the writing delay and is expected; anything beyond
 * this, in either direction, is the lane's clock rather than its typing speed.
 */
export const TOLERANCE_SECONDS = 300;

/**
 * Codes that are exact, and therefore fail a run by default.
 *
 * `future_stamp` and `unsourced_elapsed` are decided from the line alone: a
 * stamp later than the clock that read it is wrong with no interpretation, and
 * a duration with fewer than two instants behind it names its own gap. The
 * other three depend on attributing a merge announcement to a pull request by
 * reading prose, which is a heuristic. Measured on the real register it gets
 * 72 of 76 references right and over-triggers on four narrative mentions, so
 * those three are reported and counted but do not fail a run unless --strict
 * is passed. A heuristic presented as a hard gate is how a control stops being
 * believed, and then stops being read.
 */
export const HARD_CODES = new Set([
  "future_stamp",
  "unsourced_elapsed",
  // See auditCloseout: this heuristic errs towards passing, not towards
  // noise, so it is exact enough to fail a run.
  "closeout_missing",
  "closeout_authority_empty",
  // Item 34. The failure it names already happened once and cost real work:
  // discarded edits, and a commit pushed inside another session's pull
  // request. An advisory line would have read exactly like the 18 Sep one.
  "worktree_shared",
]);

// ---------------------------------------------------------------------------
// Authority resolution.
// ---------------------------------------------------------------------------

function githubMergedAt(prNumbers, repo) {
  const authority = {};
  for (const pr of prNumbers) {
    try {
      const raw = execFileSync(
        "gh",
        ["pr", "view", String(pr), "--repo", repo, "--json", "mergedAt,mergeCommit"],
        { encoding: "utf8", env: { ...process.env, GH_TOKEN: "" }, stdio: ["ignore", "pipe", "pipe"] },
      );
      const parsed = JSON.parse(raw);
      if (parsed.mergedAt) {
        authority[String(pr)] = { mergedAt: parsed.mergedAt, sha: parsed.mergeCommit?.oid ?? null };
      }
    } catch {
      // Left absent on purpose: `authority_missing` reports it as a violation
      // rather than letting a failed lookup read as a clean line.
    }
  }
  return authority;
}

/**
 * The merged pull requests in a window, from GitHub — the only thing that
 * knows a merge happened. Deliberately NOT derived from the register: an
 * authority read out of the artifact it is auditing cannot report an omission,
 * which is the shape T-460 and T-467 were filed against.
 */
function githubMergedInWindow(repo, sinceMs, nowMs, limit = 60) {
  const raw = execFileSync(
    "gh",
    [
      "pr", "list", "--repo", repo, "--state", "merged",
      "--limit", String(limit), "--json", "number,mergedAt,mergeCommit",
    ],
    { encoding: "utf8", env: { ...process.env, GH_TOKEN: "" }, stdio: ["ignore", "pipe", "pipe"] },
  );
  const merged = {};
  for (const row of JSON.parse(raw)) {
    const ms = Date.parse(row.mergedAt ?? "");
    if (!Number.isFinite(ms) || ms < sinceMs || ms > nowMs) continue;
    merged[String(row.number)] = { mergedAt: row.mergedAt, sha: row.mergeCommit?.oid ?? null };
  }
  return merged;
}

// ---------------------------------------------------------------------------
// CLI.
// ---------------------------------------------------------------------------

function flag(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function has(name) {
  return process.argv.includes(name);
}

function isMain() {
  return process.argv[1] && process.argv[1].endsWith("register-time-authority.mjs");
}

if (isMain()) {
  const repo = flag("--repo") ?? "abarva-platform/abarva";
  const nowIso = flag("--now") ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(nowMs)) {
    console.error(`--now is not an ISO instant: ${nowIso}`);
    process.exit(2);
  }
  const minuteNow = new Date(nowMs).toISOString().replace(/:\d{2}\.\d+Z$/, "Z");

  if (has("--emit")) {
    const pr = Number(flag("--pr"));
    if (!Number.isFinite(pr)) {
      console.error("--emit needs --pr <number>");
      process.exit(2);
    }
    const authorityFile = flag("--authority");
    const authority = authorityFile
      ? JSON.parse(fs.readFileSync(authorityFile, "utf8"))
      : githubMergedAt([pr], repo);
    const entry = authority[String(pr)];
    if (!entry?.mergedAt) {
      console.error(`no authoritative mergedAt for PR #${pr} — do not estimate one`);
      process.exit(1);
    }
    // Both endpoints named, so the line carries its own proof.
    console.log(
      `${minuteNow} <agent> item <id> PR #${pr} merged \`${entry.sha ?? "<sha>"}\` — ` +
        `GitHub \`mergedAt\` **${entry.mergedAt}**, taken from GitHub's own mergedAt, not estimated; ` +
        `this line stamped from a literal \`date -u\` read at ${minuteNow}.`,
    );
    process.exit(0);
  }

  if (has("--preclaim")) {
    const file = flag("--file");
    const item = flag("--item");
    const identity = flag("--identity");
    if (!file || !item || !identity) {
      console.error(
        // Every flag this branch READS must appear here. `append-claim.mjs` probes
        // this text to decide whether a check it forwards would actually run, and
        // refuses the claim when a flag is unadvertised — correctly, because Node
        // ignores flags it does not recognise and the check would pass silently.
        // `--files` shipped in T-707 and was never added here, so from the moment
        // T-708 wired the helper up, the file half of this gate could not be run
        // through the sanctioned path at all. Found by execution, not by reading.
        "usage: --preclaim --file <register.md> --item <id> --identity <base-agent#run-id> [--files a,b,c] [--now ISO] [--window-hours 3] [--strict] [--json]",
      );
      process.exit(2);
    }
    const windowHours = Number(flag("--window-hours") ?? CLAIM_WINDOW_HOURS);
    const registerLines = parseRegisterLines(fs.readFileSync(file, "utf8"));
    const result = resolveItemClaim(registerLines, {
      itemId: item,
      identity,
      nowMs,
      windowHours,
    });
    const strict = has("--strict");

    // Item T-707. The file check is opt-in, and when it does not run it says
    // so: a gate that reports nothing is indistinguishable from a gate that
    // found nothing, which is the substitution this backlog exists against.
    const filesArg = flag("--files");
    let fileOverlap = { checked: false, requested: [], unparsed: [], conflicts: [], notes: [], refuses: false };
    if (filesArg !== undefined) {
      const raw = filesArg.startsWith("@")
        ? fs.readFileSync(filesArg.slice(1), "utf8").split(/[\n,]/)
        : filesArg.split(",");
      fileOverlap = resolveFileOverlap(registerLines, {
        files: raw.map((f) => f.trim()).filter(Boolean),
        identity,
        nowMs,
        windowHours,
      });
    }

    // `--files` given but nothing in it was read as a repo path. The check ran
    // over an empty set and would print "0 requested, 0 contended", which is
    // indistinguishable from a clean result — the same substitution the
    // NOT CHECKED line above exists to prevent, one step later. A caller whose
    // list came out empty by accident must be told, not waved through.
    if (fileOverlap.checked && fileOverlap.requested.length === 0) {
      console.error(
        "--files was given but no entry in it was read as a repo path, so the file gate " +
          "checked nothing. A path needs a `/` and either a source extension or a trailing " +
          `\`/\` for a directory.${fileOverlap.unparsed.length ? ` Not read: ${fileOverlap.unparsed.join(", ")}` : ""}`,
      );
      process.exit(2);
    }

    const refuses =
      result.refuses || fileOverlap.refuses || (strict && result.advisory === true);
    const payload = { ...result, item, identity, windowHours, strict, refuses, fileOverlap };
    if (has("--json")) {
      console.log(JSON.stringify(payload, null, 1));
    } else {
      console.log(`Pre-claim check — item ${item} as ${identity}`);
      const refusedBy = [
        result.refuses || (strict && result.advisory === true) ? "item" : null,
        fileOverlap.refuses ? "files" : null,
      ].filter(Boolean);
      console.log(
        `  verdict: ${result.verdict}${refuses ? ` (REFUSED by the ${refusedBy.join(" and ")} gate)` : ""}`,
      );
      console.log(`  reason:  ${result.reason}`);
      if (result.holder) {
        console.log(`  holder:  line ${result.holder.lineNumber} ${result.holder.stamp} ${result.holder.agent}`);
        console.log(`           ${result.holder.excerpt}`);
      }
      if (!fileOverlap.checked) {
        console.log("  files:   NOT CHECKED — pass --files <a,b,c> or --files @list to run the file gate");
      } else {
        console.log(
          `  files:   ${fileOverlap.requested.length} requested, ` +
            `${fileOverlap.conflicts.length} contended, ${fileOverlap.notes.length} shared-scope note(s)`,
        );
        for (const c of fileOverlap.conflicts) {
          console.log(`    CONTENDED ${c.path}`);
          console.log(`      held by line ${c.lineNumber} ${c.stamp} ${c.agent} (${c.ownership})`);
          console.log(`      ${c.excerpt}`);
        }
        for (const n of fileOverlap.notes) {
          console.log(`    [note] ${n.path} is a shared scope, not a lock — also named by ${n.agent} on line ${n.lineNumber}`);
        }
        for (const u of fileOverlap.unparsed) {
          console.log(`    [note] not read as a repo path, so NOT checked: ${u}`);
        }
      }
    }
    // An unusable identity or item id is a usage error, not a refusal.
    if (result.verdict === "invalid-identity" || result.verdict === "invalid-item") process.exit(2);
    process.exit(refuses ? 1 : 0);
  }

  const file = flag("--file");
  if (!file) {
    console.error(
      "usage: --file <register.md> [--since ISO] [--now ISO] [--github|--authority f] [--json]\n" +
        "       --preclaim --file <register.md> --item <id> --identity <base-agent#run-id>",
    );
    process.exit(2);
  }
  const sinceIso = flag("--since") ?? new Date(nowMs - 24 * 3600 * 1000).toISOString();
  const sinceMs = Date.parse(sinceIso);
  const lines = parseRegisterLines(fs.readFileSync(file, "utf8"));

  let authority = null;
  const authorityFile = flag("--authority");
  if (authorityFile) {
    authority = JSON.parse(fs.readFileSync(authorityFile, "utf8"));
  } else if (has("--github")) {
    const wanted = new Set();
    for (const line of lines) {
      if (line.stampMs >= sinceMs && line.announcesMerge) line.prRefs.forEach((p) => wanted.add(p));
    }
    authority = githubMergedAt([...wanted].sort((a, b) => a - b), repo);
  }

  const report = auditLines(lines, { nowMs, sinceMs, authority });

  // Item 34. Runs unconditionally: it needs no authority and no network,
  // only the register it was already handed.
  report.violations.push(...auditWorktreeOwnership(lines, { sinceMs }));

  // Closeout coverage. Off unless asked for, because it needs an authority
  // that says which merges happened and the content audit does not.
  if (has("--closeout")) {
    const mergedFile = flag("--merged");
    let merged = null;
    if (mergedFile) {
      merged = JSON.parse(fs.readFileSync(mergedFile, "utf8"));
    } else {
      try {
        merged = githubMergedInWindow(repo, sinceMs, nowMs);
      } catch (error) {
        // Left null on purpose: auditCloseout reports the empty authority as a
        // violation rather than letting a failed lookup read as a clean run.
        merged = null;
        report.closeoutLookupError = String(error?.message ?? error).split("\n")[0];
      }
    }
    const graceSeconds = Number(flag("--grace") ?? CLOSEOUT_GRACE_SECONDS);
    const result = auditCloseout(lines, { merged, nowMs, graceSeconds });
    report.violations.push(...result.violations);
    report.closeout = result.closeout;
    report.closeoutGraceSeconds = graceSeconds;
  }

  const strict = has("--strict");
  report.strict = strict;
  report.failing = report.violations.filter((v) => strict || HARD_CODES.has(v.code));
  report.advisory = report.violations.filter((v) => !strict && !HARD_CODES.has(v.code));
  report.driftSummary = summariseDrift(report.drift);
  report.toleranceSeconds = TOLERANCE_SECONDS;
  report.window = { since: sinceIso, now: nowIso };

  if (has("--json")) {
    console.log(JSON.stringify(report, null, 1));
  } else {
    console.log(`Register time authority — ${file}`);
    console.log(`  window:            ${sinceIso} .. ${nowIso}`);
    console.log(`  stamped lines:     ${report.total} (${report.inWindow} in window, ${report.outOfWindow} out)`);
    console.log(`  order regressions: ${report.stampRegressions} (append order disagrees with stamp order)`);
    if (report.driftSummary) {
      const d = report.driftSummary;
      console.log(
        `  drift vs mergedAt: n=${d.samples} min=${d.minSeconds}s median=${d.medianSeconds}s ` +
          `max=${d.maxSeconds}s; ${d.outsideToleranceSeconds} outside ±${TOLERANCE_SECONDS}s`,
      );
      for (const d2 of report.drift) {
        console.log(
          `    PR #${d2.pr} ${d2.agent}: line ${d2.stamp} vs mergedAt ${d2.mergedAt} = ` +
            `${d2.driftSeconds >= 0 ? "+" : ""}${d2.driftSeconds}s${d2.citesAuthority ? " (quotes the instant)" : ""}`,
        );
      }
    }
    if (report.closeout) {
      const missing = report.closeout.filter((c) => !c.recorded && !c.pending);
      const pending = report.closeout.filter((c) => c.pending);
      console.log(
        `  closeout:          ${report.closeout.length} merged in window, ` +
          `${report.closeout.filter((c) => c.recorded).length} recorded, ` +
          `${missing.length} missing, ${pending.length} inside the ${report.closeoutGraceSeconds}s grace`,
      );
      for (const c of report.closeout) {
        const state = c.recorded
          ? `recorded on line ${c.recordedLine} (${c.recordedStamp})`
          : c.pending
            ? "pending — inside grace"
            : "MISSING";
        console.log(`    PR #${c.pr} ${c.sha ?? "<sha>"} merged ${c.mergedAt}: ${state}`);
      }
    }
    console.log(
      `  violations:        ${report.violations.length} ` +
        `(${report.failing.length} failing, ${report.advisory.length} advisory` +
        `${strict ? ", --strict" : ""})`,
    );
    for (const v of report.violations) {
      const mark = report.failing.includes(v) ? "" : " [advisory]";
      console.log(`    [${v.code}]${mark} line ${v.lineNumber} ${v.stamp} ${v.agent}: ${v.detail}`);
    }
  }

  process.exit(report.failing.length > 0 ? 1 : 0);
}
