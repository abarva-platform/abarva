#!/usr/bin/env node
/**
 * Does a release record's own account of its signed-in proof match what the
 * register says happened? (item C-526)
 *
 * The filed instance: `docs/releases/records/2026-09-26-source-action-detail-guard.md`
 * declares a live signed-in replay required and, in QA/Validation, that it was
 * **not run**. The register's release line for the same pull request says the
 * opposite — the replay ran, was positive, and turned up a residual now carried
 * by its own item. So the durable artifact in the repository asserts a debt that
 * does not exist and hides a finding that does.
 *
 * **The direction of that error is why this module exists.** A false "not run"
 * costs more than a false "run": a later auditor either re-runs a proof already
 * obtained, or reports a release as owing a proof it does not owe — and the
 * finding the replay produced is recoverable only from an operator-root register
 * that CI cannot see and a reader of the repository never opens.
 *
 * The join is the PULL REQUEST, not the branch name, although the item is
 * written in terms of "the register's release line for the same branch". A
 * branch-name join was written first and thrown away: it works for the records
 * whose release id echoes their branch (`2026-09-26-source-action-detail-guard`
 * from `codex/source-action-detail-guard`) and fails for every record produced
 * by a run-stamped branch (`exec/run-20260926T132900Z`), whose release id shares
 * no token with it. A pull request IS a branch, it is stamped into the squash
 * commit subject that added the record, and the register names it — so the join
 * is exact for both spellings of branch instead of heuristic for one.
 *
 * The register spells a pull request BOTH ways — `pull/8503` in recent lines and
 * a bare `#8503` in older ones (measured on the live register: 33 ids in the URL
 * form, 564 in the bare form). A reader that knew only the newer spelling would
 * find a register line for 33 records and report `no-register-line` for the
 * rest, which reads exactly like agreement. Both spellings are read.
 *
 * Four verdicts, not two. When a register line carries both an obtained marker
 * and an owed marker for the same proof, this reports `ambiguous` and prints the
 * sentence rather than picking a side: folding those into `agree` would hide the
 * defect this module looks for, and folding them into `disagree` would send an
 * auditor after records that are fine. An ambiguous row is a row a human reads.
 *
 * An ambiguous row is READ PER PROOF, not per line (item C-529). 61 rows came
 * back ambiguous on the live corpus, and they were not 61 judgements: measured
 * with `--since 2026-09-19T00:00:00Z` over 213 records, two phrasings carried
 * 44 of them. `DEPLOY VERIFIED, SIGNED-IN ACCEPTANCE OWED` has an obtained
 * marker belonging to the deploy, and `Not live-proven — signed-in check owed`
 * has one inside a negation. So a marker is read from the clause that names the
 * proof, and a negation is read across the sentence, because the scope of a
 * negation is a span and the attachment of a marker is not. 29 rows resolved,
 * one became a real disagreement, and 32 stay ambiguous — those are genuinely
 * mixed lines and a human still reads them. No marker was loosened to get
 * there; loosening one converts a refusal into a wrong answer.
 *
 * The register has THREE proof states, not two (item C-534). `owed` asserts a
 * debt, `obtained` asserts it was paid, and `not-owed` asserts there was never
 * one — *"Signed-in acceptance NOT owed: the change alters one refusal branch in
 * a pure function"*. Without the third state that sentence came back `owed`,
 * and a record saying its proof RAN was reported as disagreeing with a register
 * that had said no proof was needed. `not-owed` is deliberately not folded into
 * `obtained`: a release that needs no proof has not obtained one. On the live
 * corpus it moved four rows, one of them out of `disagree`, and it resolved
 * none of the 32 residual `ambiguous` rows — the item predicted at least two and
 * the bucket cannot be reached this way, because an ambiguous row needs both
 * markers in one clause and this removes only the owed one.
 *
 * The direction matters here too. Before this, `Status `deployed`, NOT
 * signed-in proven` was read as OBTAINED — a false obtained, which lets a
 * record saying no run happened agree with a register the reader believes
 * confirms one. That is this module's own defect, inverted.
 *
 * Nothing here reads a signed-in session, opens a browser, or performs a proof.
 * It compares two documents' accounts of one.
 *
 * Run:
 *   node scripts/exec/signed-in-proof-reconcile.mjs --register ~/Downloads/EXECUTION_CLAIMS.md
 *   node scripts/exec/signed-in-proof-reconcile.mjs --register <r> --since 2026-09-19 --json
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { isDirectInvocation, unknownFlags } from "./cli-entry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------------- */
/* Vocabulary                                                                 */
/* ------------------------------------------------------------------------- */

/** Whether the record declares a live signed-in proof is required at all. */
export const REQUIRED = "required";
export const NOT_REQUIRED = "not-required";
export const UNDECLARED = "undeclared";

/** What the record itself says happened. */
export const RAN = "ran";
export const NOT_RUN = "not-run";
export const UNSTATED = "unstated";

/** What the register's release line says happened. */
export const OBTAINED = "obtained";
export const OWED = "owed";
/**
 * The register says no signed-in proof was required at all (item C-534).
 *
 * A third state, not a shade of the other two. `OWED` asserts a debt and
 * `OBTAINED` asserts it was paid; this asserts there was never a debt, which is
 * a claim neither of them can carry — and it may not be folded into `OBTAINED`,
 * because a release that needs no proof has not obtained one.
 */
export const NOT_OWED = "not-owed";
export const SILENT = "silent";
export const CONFLICTED = "conflicted";

/** The reconciliation. */
export const AGREE = "agree";
export const DISAGREE = "disagree";
export const AMBIGUOUS = "ambiguous";
export const NO_REGISTER_LINE = "no-register-line";

/* ------------------------------------------------------------------------- */
/* The record's own account                                                   */
/* ------------------------------------------------------------------------- */

/**
 * A record's bullet fields, with multi-line values joined.
 *
 * Release records wrap a long field value onto continuation lines, and the
 * dominant field in this corpus — `Live signed-in proof required` — is one of
 * the ones that wraps. A reader that took only the first line saw an empty
 * value on dozens of records in the seven-day window and would have classified
 * every one of them `undeclared`, which is outside the population this item
 * measures.
 */
export function recordBullets(text) {
  const lines = String(text ?? "").split("\n");
  const bullets = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^-\s+([^:\n]{1,90}):\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    const parts = [m[2]];
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (next.trim() === "") break;
      if (/^\s*[-*]\s/.test(next)) break;
      if (/^#/.test(next)) break;
      parts.push(next.trim());
    }
    bullets.push({ label: m[1].trim(), value: parts.join(" ").trim() });
  }
  return bullets;
}

const SIGNED_IN = /signed[\s-]?in/i;

function startsNegative(value) {
  return /^\s*(\*\*)?\s*(no|none)\b/i.test(value);
}

function startsAffirmative(value) {
  return /^\s*(\*\*)?\s*(yes|required|owed)\b/i.test(value);
}

/**
 * Does this record declare a live signed-in proof required?
 *
 * **The canonical field wins over any sibling, and that is the load-bearing
 * rule.** Three records in the corpus state their position in a NEGATED LABEL —
 * `- No signed-in acceptance was performed and none is owed:` — whose value
 * ("no product code changed") is the reason rather than the answer. A branch
 * reading the answer out of such a label was written for them and then deleted:
 * all three ALSO carry the canonical `Live signed-in proof required` field, which
 * is preferred here and opens negative on its own, so across the entire corpus
 * that branch decided the declaration of exactly ZERO records. It was
 * unreachable, no mutation could detect it, and a guard nothing reaches reads to
 * the next author as protection that is present. What replaced it is a case
 * asserting the preference that does decide.
 *
 * The trap that is real:
 *
 *   - **The value can be the proof's SCOPE instead of a yes or no.** The record
 *     this item was filed about answers the field with *"Reopen a missing-detail
 *     action and a valid detail-backed action"* — a description of the replay,
 *     which is only written because the replay is required. A reader that
 *     demanded an affirmative word classified that record `undeclared` and put
 *     the one instance the item names OUTSIDE the population it measures. So a
 *     record that gives any account of its signed-in run-state has declared one
 *     required, by having something to say about it; the negative forms above
 *     are still checked first, so a record saying none is owed stays out.
 */
export function parseSignedInRequirement(text) {
  const runState = parseStatedRunState(text);
  const bullets = recordBullets(text).filter((b) => SIGNED_IN.test(b.label));
  if (bullets.length === 0) {
    if (runState.state !== UNSTATED) {
      return {
        declaration: REQUIRED,
        label: null,
        value: runState.evidence,
        reason: "no signed-in field, but the record accounts for a signed-in run",
      };
    }
    return { declaration: UNDECLARED, label: null, value: null, reason: "no signed-in field" };
  }
  // Prefer the canonical field when it is present; it is the spelling most of
  // this corpus uses, and a record can carry both it and a looser sibling.
  const canonical = bullets.find((b) => /^live signed[\s-]?in proof required$/i.test(b.label));
  const bullet = canonical ?? bullets[0];
  const { label, value } = bullet;

  if (startsNegative(value)) {
    return { declaration: NOT_REQUIRED, label, value, reason: "value opens negative" };
  }
  if (startsAffirmative(value)) {
    return { declaration: REQUIRED, label, value, reason: "value opens affirmative" };
  }
  if (/\b(required|owed|before (calling|claiming|describing)|after deploy)/i.test(value)) {
    return { declaration: REQUIRED, label, value, reason: "value states a requirement" };
  }
  if (runState.state !== UNSTATED) {
    return {
      declaration: REQUIRED,
      label,
      value,
      reason: "value states neither, but the record accounts for a signed-in run",
    };
  }
  return { declaration: UNDECLARED, label, value, reason: "value states neither" };
}

/**
 * A completed signed-in run, in the declarative.
 *
 * Bare `proven` was in this pattern first and had to come out: it matches
 * `live-proven`, which appears almost exclusively in the sentence *"required
 * before calling this live-proven"* — a statement that the proof is OWED. Three
 * records were classified `ran` by that one substring, and two of them turned
 * into false disagreements against a register line that correctly said owed.
 */
const RAN_SENTENCE = new RegExp(
  [
    String.raw`\b(was|were) (run|performed|replayed|obtained|carried out)\b`,
    String.raw`\bhas (been )?(run|performed|replayed)\b`,
    String.raw`\b(ran|replayed)\b`,
    String.raw`\b(acceptance|proof|replay|readback|smoke|walkthrough)\b[^.;\n]{0,40}\b(passed|positive|confirmed|verified|succeeded)\b`,
    String.raw`signed[\s-]?in[^.;\n]{0,80}\b(passed|positive|confirmed|verified|succeeded)\b`,
  ].join("|"),
  "i",
);

const NOT_RUN_MARKER =
  /\b(not run|not performed|not claimed|not attempted|not yet|owed|pending|remains separate|nothing here claims it|before (calling|claiming|describing)|after (the )?deploy|required (before|after))/i;

/**
 * The negated forms, which are the ones that cost.
 *
 * `\bno\s+(run|performed)` was the whole of this pattern first, and it misses
 * the form the corpus actually uses: *"**No signed-in run was performed and none
 * is claimed**"*. The negation and the verb are four words apart, so the
 * completed-run pattern matched `was performed`, the record was classified
 * `ran`, and it became a false disagreement against a register line saying the
 * same thing the record said. The scope of a negation is a span, not an
 * adjacency.
 */
const RAN_NEGATED = new RegExp(
  [
    String.raw`\b(not|never|no)\s+(yet\s+)?(been\s+)?(run|performed|replayed|proven|attempted|claimed)\b`,
    String.raw`\b(no|not)\b[^.;\n]{0,40}\b(was|were|is|are)\s+(run|performed|replayed|claimed|obtained)\b`,
    // The perfect, which the copula alternative above cannot reach. Measured
    // on `c522-answer-mode-fallback-disclosure.md` (item C-529): *"no signed-in
    // check against a deployed build **has been run**"* was classified `ran`,
    // because the completed-run pattern matches `has been run` and no negated
    // form covered the auxiliary. That record is one of the rows repairing the
    // register grammar moves out of `ambiguous`, so left here it would have
    // surfaced as a DISAGREE that is an artifact of this reader.
    String.raw`\b(no|not)\b[^.;\n]{0,60}\b(has|have|had)\s+(been\s+)?(run|performed|replayed|claimed|obtained)\b`,
    String.raw`\bnone\s+(is|was|were|will be)\s+(claimed|performed|run|owed|obtained)\b`,
  ].join("|"),
  "i",
);

/**
 * Headings under which a record gives an account of what it ran.
 *
 * Prose elsewhere in a record discusses signed-in proofs in general —
 * `2026-09-22-t705-rung7-veto-negation-forms` explains what a rung means by
 * saying *"the top rung means a signed-in check passed"*, which is a definition,
 * not a claim about its own release. A reader that scanned the whole body read
 * that as a completed run.
 */
const ACCOUNT_HEADING =
  /^#{1,4}\s*.*\b(qa|validation|deploy|audit|evidence|post.?deployment|signed.?in|proof|acceptance|replay)\b/i;

/**
 * What the record itself says about whether the signed-in proof happened.
 *
 * `ran` is checked BEFORE `not-run`, and that order is the repair pattern: a
 * record is corrected by APPENDING a post-deployment section, never by
 * rewriting the original assertion, so a repaired record carries both the
 * original "Not run" bullet and the later account of the run. If `not-run` won,
 * every correctly repaired record would still read as owing its proof — the
 * exact error this item is about, reintroduced by the reader.
 *
 * Three narrowings, each of which removed a real false positive from the live
 * corpus rather than a hypothetical one:
 *
 *   - a line carrying a requirement or owed marker is never `ran`, because
 *     *"Required before claiming the panel is live-proven"* is a debt;
 *   - `ran` is read only under a heading where a record accounts for its own
 *     validation, so general prose about proofs is not mistaken for one.
 *
 * A third narrowing was written and then DELETED: a rule excluding the
 * declaration bullet itself from the `ran` scan, on the reasoning that a field
 * saying whether a proof is needed is not an account of whether it happened.
 * Removing that rule changed the verdict, the stated run-state and the evidence
 * line of exactly ZERO records across the whole real corpus — the owed-marker
 * check above already fires on every declaration bullet that reaches it. It was
 * deleted rather than kept, because a guard that cannot be shown to do anything
 * reads to the next author as protection that is present.
 *
 * `not-run` is deliberately read from the whole body, including the declaration
 * bullet: a record that says its proof is owed has said so wherever it says it,
 * and the asymmetry is in the safe direction — it can leave a row `not-run` that
 * a human then reads, and it cannot invent a run.
 */
export function parseStatedRunState(text) {
  const lines = String(text ?? "").split("\n");
  const mentions = (line) => SIGNED_IN.test(line) || /\breplay\b/i.test(line);

  let underAccount = false;
  for (const raw of lines) {
    if (/^#{1,4}\s/.test(raw)) {
      underAccount = ACCOUNT_HEADING.test(raw);
      continue;
    }
    const line = raw.trim();
    if (!underAccount || !mentions(line)) continue;
    if (RAN_NEGATED.test(line) || NOT_RUN_MARKER.test(line)) continue;
    if (RAN_SENTENCE.test(line)) return { state: RAN, evidence: line };
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!mentions(line)) continue;
    if (NOT_RUN_MARKER.test(line) || RAN_NEGATED.test(line)) {
      return { state: NOT_RUN, evidence: line };
    }
  }
  return { state: UNSTATED, evidence: null };
}

/** A record's full account of itself. */
export function parseRecord({ file, text }) {
  const requirement = parseSignedInRequirement(text);
  const runState = parseStatedRunState(text);
  const idBlock = (/##\s*Release ID\s*\n+([^\n]+)/i.exec(String(text ?? "")) ?? [])[1]?.trim() ?? "";
  const releaseId = (/^`?([A-Za-z0-9._-]+)`?$/.exec(idBlock) ?? [])[1] ?? null;
  return {
    file: file ?? null,
    releaseId,
    declaration: requirement.declaration,
    declarationLabel: requirement.label,
    declarationValue: requirement.value,
    declarationReason: requirement.reason,
    recordSays: runState.state,
    recordEvidence: runState.evidence,
  };
}

/* ------------------------------------------------------------------------- */
/* The register's account                                                     */
/* ------------------------------------------------------------------------- */

/**
 * Pull request ids named in a line, in both spellings the register uses.
 *
 * A bare `#NNNN` is required to be four or more digits: the register is full of
 * item ids, counts and percentages, and a two-digit `#22` is a backlog item.
 */
export function pullRequestIds(text) {
  const ids = new Set();
  for (const m of String(text ?? "").matchAll(/pull\/(\d+)/g)) ids.add(Number(m[1]));
  for (const m of String(text ?? "").matchAll(/#(\d{4,})\b/g)) ids.add(Number(m[1]));
  return ids;
}

const STAMP = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)\s*\|\s*([^|]+?)\s*\|\s*(.*)$/;

/**
 * Register records, one per stamped line, with continuation lines attached.
 *
 * The record boundary is the stamp at the start of a line, which is the same
 * boundary T-702 repaired in the board generator: a line written with seconds is
 * a record start too, and a reader that demanded minute precision appended it to
 * the record above.
 */
export function registerEntries(text) {
  const lines = String(text ?? "").split("\n");
  const entries = [];
  let current = null;
  for (const line of lines) {
    const m = STAMP.exec(line);
    if (m) {
      if (current) entries.push(current);
      current = { stamp: m[1], identity: m[2].trim(), text: m[3] };
      continue;
    }
    if (current) current.text += `\n${line}`;
  }
  if (current) entries.push(current);
  return entries.map((e) => ({ ...e, prs: pullRequestIds(e.text) }));
}

const REGISTER_OBTAINED =
  /\b(proven|positive|confirmed|verified|was run|were run|ran|replayed|no longer|rendered|passed|succeeded)\b/i;
// `unproven` earns its place: the register line *"Signed-in positive supplier
// panel remains unproven"* was read as obtained, because `positive` is an
// obtained marker and nothing recognised the word that negates it.
const REGISTER_OWED =
  /\b(owed|pending|required|must|will be|not run|not performed|not attempted|not claimed|never|none may|none will|not yet|no signed[\s-]?in|no exact|unproven|unverified|unconfirmed)\b/i;

/**
 * A negated obtained marker, read across the WHOLE sentence (item C-529).
 *
 * The register side had no negation at all, while the record side has had one
 * since case 9 — and the register is where it costs more, because a negation
 * missed here produces a FALSE OBTAINED: a register line the reader thinks
 * confirms a run, agreeing with a record that says no run happened, which is
 * precisely the defect this module exists to catch, inverted.
 *
 * Two spellings dominate the live corpus and neither is adjacent to its verb:
 * *"**Not** live-proven — signed-in check owed."* (21 rows, where the marker
 * is inside a hyphenated compound) and *"Status `deployed`, **NOT** signed-in
 * proven;"* (read as `obtained`, not merely as ambiguous). So the span is
 * wide and the marker may carry a compound prefix.
 *
 * It is read from the sentence rather than from the clause scope below,
 * deliberately: the scope of a negation is a span, not a clause, and
 * `"not merged, deployed, or signed-in proven at this stamp"` puts the
 * negator in the first clause and its target in the third. Scoping the
 * negation to the clause turned that line into a false obtained while this
 * change was being measured.
 */
const REGISTER_OBTAINED_NEGATED = new RegExp(
  String.raw`\b(not|never|no|none)\b[^.;\n]{0,40}?\b(?:[a-z]+[-\s])?` +
    String.raw`(proven|positive|confirmed|verified|run|replayed|rendered|passed|succeeded)\b`,
  "i",
);

/**
 * A negated owed marker — the register saying a proof was never owed (C-534).
 *
 * The owed vocabulary had no negation at all, so *"Signed-in acceptance **NOT
 * owed**"* (live register, PR #8234) and *"signed-in acceptance OWED"* (PR
 * #8208) both came back `owed`, and the register reported a debt against a
 * release that never had one.
 *
 * Read ADJACENTLY, unlike `REGISTER_OBTAINED_NEGATED` above, which is read
 * across the whole sentence — and the reason is a measurement rather than a
 * symmetry argument. **On the live register the two scopes disagree about
 * exactly one distinct sentence**, `"**NOT signed-in accepted and none owed**"`,
 * which adjacency should also accept; that is why `none` is a negator here. So
 * on today's corpus a span-wide owed negation would behave identically, and the
 * choice is about the phrasings not yet written.
 *
 * Adjacency is kept because the two rules fail in opposite directions on the
 * first natural sentence that separates them — *"signed-in replay was not
 * attempted and remains owed"*, where a span rule strips `not attempted and
 * remains owed` and reports a release with an open debt as owing nothing. A
 * missed not-owed costs a second look at a record that is fine; a missed debt
 * is a signed-in proof nobody ever comes back for. The corresponding case is
 * constructed and labelled as such in the suite, because no live line has this
 * shape yet — the measurement above is how that was established rather than
 * assumed.
 *
 * What does NOT hold, and was believed while this was being written: that the
 * register's most common owed phrasing, *"Not live-proven — signed-in check
 * owed."* (21 rows at C-529), needs adjacency to survive. It does not. The
 * clause scoping below already leaves the negator outside the scope, so a
 * span-wide rule never sees it, and widening this regex leaves that case green.
 * The claim was written here first, then falsified by mutating the regex.
 *
 * `[\s*_]{0,4}` crosses the emphasis the register writes this in — `**NOT
 * owed**`, `is not owed`, `NOT OWED`, `none owed` — and nothing else.
 */
const REGISTER_OWED_NEGATED = /\b(not|never|no longer|none)\b[\s*_]{0,4}(owed|required|needed)\b/gi;

/**
 * The owed markers that assert a DEBT, as against ones that merely report a
 * proof did not happen (item C-534).
 *
 * `not claimed`, `not run`, `not performed` and `not attempted` all say no
 * proof took place; only in the presence of a requirement do they say one is
 * owed. So *"Signed-in acceptance **NOT owed and not claimed**"* — the live
 * sentence at 2026-09-22T09:36:27Z, which is the corroborating half of one
 * assertion — must not be read as a debt because of its second clause.
 *
 * A debt word left un-negated anywhere in the scope still wins, so the failure
 * mode of the not-owed rule is a MISSED not-owed and never a missed debt. That
 * direction is chosen: a false "not owed" hides a real signed-in debt, which is
 * the one error in this module nobody would ever go looking for.
 */
const REGISTER_DEBT = /\b(owed|pending|required|must|will be)\b/i;

/**
 * The part of a sentence that speaks about the signed-in proof (item C-529).
 *
 * A sentence reaches this reader because it mentions a signed-in proof
 * somewhere; that does not make every marker in it a statement ABOUT that
 * proof. The live register's *"DEPLOY VERIFIED, SIGNED-IN ACCEPTANCE OWED"*
 * carries an obtained marker belonging to the deploy and an owed marker
 * belonging to the signed-in acceptance, and reading the line as a whole
 * reported it as a conflict between them.
 *
 * So markers are read from the clauses that name the proof. The scoping is
 * SYMMETRIC — an owed marker in a clause about something else is as wrong as
 * an obtained one, and measuring the asymmetric version found the mirror case:
 * *"prove a parsed artifact on another event can **never** reconcile, ... and
 * signed-in replay after repo-owned deploy"*, where `never` is about an
 * artifact and produced a false disagreement.
 *
 * When no clause names the proof — the mention is the sentence — the whole
 * sentence is the scope, so this can only narrow, never widen.
 */
export function signedInScope(sentence) {
  const clauses = String(sentence ?? "")
    .split(/[,:—–]|\s--\s/)
    .filter((c) => SIGNED_IN.test(c));
  return clauses.length > 0 ? clauses.join(" ; ") : String(sentence ?? "");
}

/**
 * What a register line says about a signed-in proof, and the sentence it says
 * it in.
 *
 * `conflicted` is returned when one line carries both markers for the proof —
 * reported, never resolved. Picking a side here is how a prose classifier
 * becomes unfalsifiable, and the sentence is printed so the verdict can be
 * checked against the words that produced it.
 */
export function registerSignedInVerdict(text) {
  const sentences = String(text ?? "")
    .split(/(?<=[.;])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => SIGNED_IN.test(s));
  if (sentences.length === 0) return { verdict: SILENT, sentence: null };

  const read = sentences.map((s) => {
    const scope = signedInScope(s);
    // The scope with every adjacent-negated owed marker removed. What is left
    // is what the sentence asserts about the proof independently of the writer
    // saying it was never owed, so a real debt beside a not-owed assertion
    // still reaches `isOwed`.
    const withoutNegatedOwed = scope.replace(REGISTER_OWED_NEGATED, " ");
    const notOwed = withoutNegatedOwed !== scope && !REGISTER_DEBT.test(withoutNegatedOwed);
    return {
      sentence: s,
      isObtained: REGISTER_OBTAINED.test(scope) && !REGISTER_OBTAINED_NEGATED.test(s),
      isOwed: REGISTER_OWED.test(scope) && !notOwed,
      isNotOwed: notOwed,
    };
  });
  const obtained = read.filter((r) => r.isObtained && !r.isOwed).map((r) => r.sentence);
  const owed = read.filter((r) => r.isOwed && !r.isObtained).map((r) => r.sentence);
  const both = read.filter((r) => r.isObtained && r.isOwed).map((r) => r.sentence);
  const notOwed = read.filter((r) => r.isNotOwed && !r.isOwed).map((r) => r.sentence);

  if (obtained.length > 0 && owed.length === 0 && both.length === 0) {
    return { verdict: OBTAINED, sentence: obtained[0] };
  }
  if (owed.length > 0 && obtained.length === 0 && both.length === 0) {
    return { verdict: OWED, sentence: owed[0] };
  }
  if (obtained.length > 0 || owed.length > 0 || both.length > 0) {
    return { verdict: CONFLICTED, sentence: both[0] ?? obtained[0] ?? owed[0] };
  }
  // Read after the two proof states and before silence: a line that says no
  // proof was owed has spoken about the proof, so calling it silent would drop
  // a clear answer into a bucket whose name says the register gave none.
  if (notOwed.length > 0) return { verdict: NOT_OWED, sentence: notOwed[0] };
  return { verdict: SILENT, sentence: sentences[0] };
}

/* ------------------------------------------------------------------------- */
/* The reconciliation                                                         */
/* ------------------------------------------------------------------------- */

/**
 * One record against the register.
 *
 * `entries` are every register record; the ones naming this record's pull
 * request are selected here. Two rules pick between them, in this order:
 *
 *   1. **Fewest other pull requests first.** Register lines cite each other's
 *      work constantly — one line in this register names nine pull requests
 *      while being about none of them — so a line naming only this pull request
 *      is about this pull request, and a line naming ten is citing it. Without
 *      this rule the newest citing line wins and the row reports a verdict drawn
 *      from a sentence about somebody else's release.
 *   2. **Newest wins**, because a release line is appended after the claim line
 *      for the same work and a later line supersedes an earlier account of the
 *      same run.
 */
export function reconcileRecord({ record, pr, entries }) {
  const matched = pr == null ? [] : entries.filter((e) => e.prs.has(pr));
  const verdicts = matched
    .map((e) => ({ entry: e, ...registerSignedInVerdict(e.text) }))
    .filter((v) => v.verdict !== SILENT);
  const fewest = verdicts.reduce(
    (min, v) => (v.entry.prs.size < min ? v.entry.prs.size : min),
    Number.POSITIVE_INFINITY,
  );
  const closest = verdicts.filter((v) => v.entry.prs.size === fewest);
  const chosen = closest.length > 0 ? closest[closest.length - 1] : null;

  const registerSays = chosen ? chosen.verdict : matched.length > 0 ? SILENT : null;
  const row = {
    ...record,
    pr: pr ?? null,
    registerLines: matched.length,
    registerLinePullRequests: chosen ? chosen.entry.prs.size : null,
    registerSays,
    registerStamp: chosen?.entry.stamp ?? null,
    registerIdentity: chosen?.entry.identity ?? null,
    registerEvidence: chosen?.sentence ?? null,
  };

  if (matched.length === 0) return { ...row, verdict: NO_REGISTER_LINE };
  if (registerSays === CONFLICTED) return { ...row, verdict: AMBIGUOUS };
  if (record.recordSays === NOT_RUN && registerSays === OBTAINED) {
    return { ...row, verdict: DISAGREE };
  }
  if (record.recordSays === RAN && registerSays === OWED) {
    return { ...row, verdict: DISAGREE };
  }
  if (record.recordSays === UNSTATED && registerSays === OBTAINED) {
    return { ...row, verdict: AMBIGUOUS };
  }
  return { ...row, verdict: AGREE };
}

/**
 * Every record that declares a signed-in proof required, reconciled.
 *
 * `records` are `{ file, text, pr }`. Records that declare no requirement are
 * returned in `outsidePopulation` rather than dropped, so the census adds up:
 * the item asks for a per-record answer, and a count that cannot be reconciled
 * to the corpus it came from is the shape this backlog exists to repair.
 */
export function reconcile({ records = [], register = "" } = {}) {
  const entries = registerEntries(register);
  const parsed = records.map((r) => ({ raw: r, record: parseRecord(r) }));
  const inPopulation = parsed.filter((p) => p.record.declaration === REQUIRED);
  const outsidePopulation = parsed
    .filter((p) => p.record.declaration !== REQUIRED)
    .map((p) => ({ ...p.record, pr: p.raw.pr ?? null }));

  const rows = inPopulation.map((p) =>
    reconcileRecord({ record: p.record, pr: p.raw.pr, entries }),
  );

  const counts = { [AGREE]: 0, [DISAGREE]: 0, [AMBIGUOUS]: 0, [NO_REGISTER_LINE]: 0 };
  for (const row of rows) counts[row.verdict] += 1;

  return {
    scanned: records.length,
    population: rows.length,
    outsidePopulation,
    registerEntries: entries.length,
    counts,
    rows,
  };
}

/** Per record, never a count on its own. */
export function formatReport(result) {
  const lines = [];
  const order = [DISAGREE, AMBIGUOUS, NO_REGISTER_LINE, AGREE];
  for (const verdict of order) {
    const rows = result.rows.filter((r) => r.verdict === verdict);
    if (rows.length === 0) continue;
    lines.push(`\n## ${verdict} — ${rows.length}`);
    for (const row of rows) {
      lines.push(
        `  ${row.releaseId ?? row.file}` +
          `\n    pr:       ${row.pr ?? "unresolved"}` +
          `\n    record:   ${row.recordSays}${row.recordEvidence ? ` — ${row.recordEvidence.slice(0, 160)}` : ""}` +
          `\n    register: ${row.registerSays ?? "no line"}${row.registerEvidence ? ` — ${row.registerEvidence.slice(0, 160)}` : ""}`,
      );
    }
  }
  lines.push(
    `\nscanned ${result.scanned} record(s); ${result.population} declare a live signed-in proof required; ` +
      `${result.outsidePopulation.length} do not and are named individually by --json.`,
  );
  lines.push(
    `agree ${result.counts[AGREE]}  disagree ${result.counts[DISAGREE]}  ` +
      `ambiguous ${result.counts[AMBIGUOUS]}  no-register-line ${result.counts[NO_REGISTER_LINE]}`,
  );
  /*
   * The not-owed rows are printed as their own number even though they are not
   * their own verdict (item C-534). `agree` means the two documents do not
   * disagree about a debt, and a register line saying no proof was ever owed
   * does not disagree with a record about one — but it is not the same sentence
   * the record wrote either, and a row whose record DECLARES a proof required
   * while the register says none was owed is a declaration mismatch this module
   * does not adjudicate. Folding it into a total would be the count that hides
   * it; this names it so the next reader can select on `registerSays`.
   */
  const notOwedRows = result.rows.filter((r) => r.registerSays === NOT_OWED);
  if (notOwedRows.length > 0) {
    const declaredRequired = notOwedRows.filter((r) => r.recordSays === RAN).length;
    lines.push(
      `of those, ${notOwedRows.length} row(s) have a register line saying no signed-in proof was ` +
        `owed at all; ${declaredRequired} of them ${declaredRequired === 1 ? "sits" : "sit"} ` +
        "against a record that says its proof ran, " +
        `which is a declaration mismatch this reader reports and does not adjudicate.`,
    );
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------------- */
/* Corpus reading                                                             */
/* ------------------------------------------------------------------------- */

const COMMIT_MARK = "COMMIT\t";

/**
 * The records added under `dir` since `since`, each with the pull request of the
 * squash commit that added it.
 *
 * A record's pull request is read from the squash subject `(#NNNN)` rather than
 * from the record's own text, because the record is written before the pull
 * request exists and almost never names it.
 */
export function readRecordCorpus({ repo, dir = "docs/releases/records", since, git = runGit } = {}) {
  const out = git(
    [
      "log",
      `--since=${since}`,
      "--diff-filter=A",
      "--name-only",
      `--pretty=format:${COMMIT_MARK}%H\t%s`,
      "--",
      dir,
    ],
    repo,
  );
  const records = [];
  let pr = null;
  for (const raw of out.split("\n")) {
    const line = raw.trim();
    if (raw.startsWith(COMMIT_MARK)) {
      const subject = raw.slice(COMMIT_MARK.length).split("\t").slice(1).join("\t");
      pr = Number((/\(#(\d+)\)\s*$/.exec(subject.trim()) ?? [])[1]) || null;
      continue;
    }
    if (!line.startsWith(dir)) continue;
    const abs = path.join(repo, line);
    if (!fs.existsSync(abs)) continue;
    records.push({ file: line, pr, text: fs.readFileSync(abs, "utf8") });
  }
  const seen = new Set();
  return records.filter((r) => (seen.has(r.file) ? false : seen.add(r.file)));
}

function runGit(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

/* ------------------------------------------------------------------------- */
/* CLI                                                                        */
/* ------------------------------------------------------------------------- */

const USAGE =
  "usage: signed-in-proof-reconcile.mjs --register <EXECUTION_CLAIMS.md>\n" +
  "       [--repo <dir>] [--records <dir>] [--since <date>] [--json] [--strict]\n" +
  "reports, per release record that declares a live signed-in proof required,\n" +
  "what the record says and what the register says.";

const FLAG_SPEC = {
  value: ["--register", "--repo", "--records", "--since"],
  boolean: ["--json", "--strict", "--help"],
};

function cli(argv) {
  const unknown = unknownFlags(argv, FLAG_SPEC);
  if (unknown.length > 0) {
    console.error(
      `${unknown.join(", ")} ${unknown.length === 1 ? "is not a flag" : "are not flags"} this command reads. ` +
        "An unrecognised flag is parsed as nothing, so the check you asked for would not run. " +
        "Nothing was reported.",
    );
    console.error(USAGE);
    process.exit(2);
  }
  if (argv.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  const at = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const register = at("--register");
  if (!register) {
    console.error("--register is required: nothing to compare the records against.");
    process.exit(2);
  }
  if (!fs.existsSync(register)) {
    console.error(
      `--register ${register}: no such file. Refusing rather than reporting an absent register as agreement.`,
    );
    process.exit(2);
  }

  const repo = path.resolve(at("--repo") ?? path.join(HERE, "..", ".."));
  const dir = at("--records") ?? "docs/releases/records";
  const since = at("--since") ?? "7 days ago";

  const records = readRecordCorpus({ repo, dir, since });
  const result = reconcile({ records, register: fs.readFileSync(register, "utf8") });

  if (argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatReport(result));
  }

  const strict = argv.includes("--strict");
  process.exit(strict && (result.counts[DISAGREE] > 0 || result.counts[AMBIGUOUS] > 0) ? 1 : 0);
}

if (isDirectInvocation(import.meta.url)) {
  cli(process.argv.slice(2));
}
