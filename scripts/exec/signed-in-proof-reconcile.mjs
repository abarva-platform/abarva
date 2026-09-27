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
/**
 * A row whose deciding register line named more than this record's pull
 * request (item C-540). It is a verdict about the EVIDENCE, not about the two
 * documents, and it is deliberately not one of the four above: those four are
 * answers to "do the record and the register agree", and this one says that
 * question was never put to a line about this record.
 */
export const INEXACT_ATTRIBUTION = "inexact-attribution";
/**
 * A row whose deciding register line named this pull request and said nothing
 * about the signed-in proof (item C-545).
 *
 * `registerSays: SILENT` used to fall through every case of `compareAccounts` —
 * it is not `null`, not `CONFLICTED`, not `OBTAINED`, not `OWED` — and came back
 * `AGREE`. So *the register mentioned this release and said nothing about its
 * proof* was reported with the same word as *the register independently confirms
 * what the record says*. On the live corpus that was 34 of the 67 `agree` rows:
 * a false clean, which is the direction of error this module was built to avoid,
 * and a false clean is invisible.
 *
 * It is deliberately NOT folded into `NO_REGISTER_LINE`. The register did speak
 * about this pull request, which is a different fact from never having mentioned
 * it, and the row says which by carrying the deciding line's stamp and identity.
 */
export const REGISTER_SILENT = "register-silent";

/**
 * Which silence it is (item C-545). Two kinds, and they are different defects.
 *
 * `UNREAD` — the deciding line HAS a sentence about a signed-in proof and no
 * marker read a verdict from it. 22 of the 34 on the live corpus, and the
 * expensive ones: one line says the signed-in answer now carries the refreshed
 * date, which reads like a run, against a record that says the replay did not
 * run. That row is a candidate disagreement that was reported as agreement.
 *
 * `UNMENTIONED` — no sentence in the deciding line mentions a signed-in proof at
 * all. 12 of the 34. Some are deploy lines that legitimately had no proof to
 * report; others owe a proof in words this reader does not recognise as
 * signed-in, such as a "positive live canvas readback owed".
 *
 * Neither kind is repaired by loosening a marker — C-529 records that loosening
 * converts a refusal into a wrong answer. Both are reported per row, with the
 * sentence where there is one, and a human settles them.
 */
export const UNREAD = "unread";
export const UNMENTIONED = "unmentioned";

/**
 * A row every one of whose matched register lines names its pull request while
 * being about other work (item C-551).
 *
 * `C-545` split *the register mentioned this release and said nothing* from
 * *the register never mentioned it*. Underneath both sits a third state, and
 * until this it was reported as the first: **the register named the number
 * while talking about something else**. Measured on the live register over the
 * 25 `unread` rows `C-548` settled one at a time, five are this — the deciding
 * line names the pull request as a stack base, a file-collision explanation, a
 * rebase reference, an explicit exclusion of that pull request's files, or an
 * announcement of follow-up work.
 *
 * It is deliberately NOT folded into `REGISTER_SILENT`, whose whole claim is
 * that the register *did* speak about this pull request. Here it did not speak
 * about this release at all, so the row is closer in substance to
 * `NO_REGISTER_LINE` — and it is not that either, because a number the register
 * names is a thread an auditor can pull and an absent one is not. The row
 * carries `registerPassingClauses` so the words can be read rather than trusted.
 *
 * The count is the point as much as the verdict: `registerLines > 0` was
 * overstating how much the register says about the corpus, and
 * `registerSubjectLines` is what it says.
 */
export const PASSING_MENTION = "passing-mention";

/**
 * What one register line's mention of one pull request is (item C-551).
 *
 * Read from the register's own subject grammar, never from phrasing. "stacked
 * after", "rebasing onto", "Explicit exclusions:", "behind open" and
 * "follow-up for" are five spellings of one structure, and `C-529` records what
 * happens when a marker is widened to cover a fifth phrasing: a refusal becomes
 * a wrong answer. `fossil-claims.mjs` already applies a first-written-wins
 * subject contest to *item ids*, for this exact defect — "register lines
 * routinely narrate another lane's item in passing" — and this is that rule
 * asked about *pull requests*.
 */
export const SUBJECT = "subject";
export const PASSING = "passing";

/** The register's field separator. `fields[0]` is the line's own assertion. */
function messageFields(text) {
  return String(text ?? "")
    .split("|")
    .map((field) => field.trim());
}

/*
 * A claim's lead. A claim declares work that has not happened, so every pull
 * request it names belongs to somebody else's — a claim has no pull request of
 * its own at the moment it is written.
 */
const CLAIM_LEAD = /^(?:RE-)?CLAIM(?:ING|ED|S)?\b/i;
/*
 * An outcome's lead, and the PRECEDENCE that makes this rule safe in the other
 * direction. `RELEASED item U-599 through PR #8203 | squash … | branch … |
 * files: …` is a genuine deciding line that carries a file list of its own, so
 * the scope-field rule below would call it a claim and refuse the one row it
 * decides. Its lead asserts an outcome, and that wins.
 */
const OUTCOME_LEAD =
  /^(?:RELEASED|RELEASING|MERGED|MERGING|DEPLOYED|ABSTENTION|ABSTAIN(?:ED|ING)?|PR\s*#?\d{4,}|pull\/\d+)\b/i;
/*
 * A scope field: the claim shape for a line whose lead is prose. Two of the
 * five live cases are these — one leads "Governed ServiceNow request
 * review-to-event handoff claimed, stacked after PR #8260", the other "Source
 * New signed-in acceptance follow-up for #8200" — and neither opens with a
 * claim verb. What they do carry is the register's declaration of what the work
 * will touch, which only unstarted work has.
 */
const SCOPE_FIELD = /^(?:files\s*:|branch\s+\S)/i;

/** The first pull request written in `text`, by position, or `null`. */
function firstPullRequestIn(text) {
  const match = String(text ?? "").match(/pull\/(\d+)|#(\d{4,})\b/);
  return match ? Number(match[1] ?? match[2]) : null;
}

/**
 * Which pull request a register line is ABOUT, or `null` when it is about none
 * (item C-551).
 *
 * Three rules, in this order, and the order is the whole of the safety:
 *
 *   1. A lead that asserts an OUTCOME makes this an outcome line, whatever
 *      fields follow it.
 *   2. Otherwise a claim lead, or a scope field, makes it a claim — which has
 *      no subject pull request at all.
 *   3. Otherwise the subject is the first pull request written in the lead
 *      field, falling back to the first written anywhere when the lead names
 *      none.
 *
 * Rule 3 is `fewest pull requests first` asked a sharper way. `reconcileRecord`
 * has always preferred the line naming fewest, on the reasoning that a line
 * naming ten is citing them; this says WHICH of the ten it is about, so the
 * other nine stop being candidates for a verdict.
 */
export function subjectPullRequest(text) {
  const fields = messageFields(text);
  const lead = fields[0] ?? "";
  if (!OUTCOME_LEAD.test(lead)) {
    if (CLAIM_LEAD.test(lead)) return null;
    if (fields.slice(1).some((field) => SCOPE_FIELD.test(field))) return null;
  }
  return firstPullRequestIn(lead) ?? firstPullRequestIn(text);
}

/** Whether this line is about this pull request, or merely names it. */
export function mentionRole(text, pr) {
  const subject = subjectPullRequest(text);
  return subject != null && subject === pr ? SUBJECT : PASSING;
}

/**
 * The clause in which a line names a pull request.
 *
 * The item is explicit that the rows are printed individually **with the clause
 * that names the pull request**, because the five live cases differ in kind and
 * a human settling them needs the words. A count of passing mentions would
 * report the defect and leave it unsettleable.
 */
export function mentionClause(text, pr) {
  if (pr == null) return null;
  const names = new RegExp(`(?:pull/${pr}|#${pr})\\b`);
  const pieces = String(text ?? "").split(/(?<=[.;])\s+|\n+|\s*\|\s*/);
  const hit = pieces.find((piece) => names.test(piece));
  return hit ? hit.trim() : null;
}

/** The kind of silence, from the sentence the deciding line offered. */
export function silenceOf(sentence) {
  return sentence == null ? UNMENTIONED : UNREAD;
}

/**
 * How well the deciding register line is attributed to this record (C-540).
 *
 * `reconcileRecord` has always preferred the line naming the fewest pull
 * requests, and its docstring gives the reason: a line naming only this pull
 * request is about this pull request, and a line naming ten is citing it. What
 * was missing is the case where the winner of that preference still names more
 * than one — the count was computed into `registerLinePullRequests` and then
 * discarded, so a verdict drawn from a bulk citation was indistinguishable from
 * one drawn from that release's own line.
 *
 * `UNATTRIBUTED` covers two situations that stay distinguishable by
 * `registerLines`: no line named this pull request at all (`registerLines === 0`),
 * and lines named it but none said anything about a signed-in proof
 * (`registerLines > 0`). On the live corpus those are 84 rows and 33 rows, and
 * collapsing the second into the first would hide it.
 */
export const EXACT = "exact";
export const INEXACT = "inexact";
export const UNATTRIBUTED = "none";

/** The attribution of a chosen line, from the number of pull requests it names. */
export function attributionOf(pullRequestsNamed) {
  if (pullRequestsNamed == null) return UNATTRIBUTED;
  return pullRequestsNamed > 1 ? INEXACT : EXACT;
}

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
  /*
   * The lines that are ABOUT this pull request, separated from the ones that
   * merely name it (item C-551). Only the first kind may decide the row: a
   * verdict read from a line about somebody else's work is read from the wrong
   * sentence, and before this separation four of the five live cases had one —
   * the passing mention won the selection below, because a claim naming one
   * pull request beats a release line naming two on `fewest first`.
   */
  const roles = matched.map((e) => ({ entry: e, role: mentionRole(e.text, pr) }));
  const subjectEntries = roles.filter((r) => r.role === SUBJECT).map((r) => r.entry);
  const passingEntries = roles.filter((r) => r.role === PASSING).map((r) => r.entry);
  const read = subjectEntries.map((e) => ({ entry: e, ...registerSignedInVerdict(e.text) }));
  /**
   * The two rules above, applied to whichever lines are on offer.
   *
   * Factored out rather than written twice because the silent lines need the
   * same preference (item C-545): a silent row used to carry no deciding line at
   * all, so it reported no stamp, no identity and no sentence, and the 34 rows
   * of the live corpus were unfindable from the report that named them. Picking
   * the last silent line instead would usually pick a bulk citation — the
   * newest line naming a pull request is routinely a sweep naming a dozen — and
   * the row would name a line that is not about it.
   */
  const decide = (candidates) => {
    const fewest = candidates.reduce(
      (min, v) => (v.entry.prs.size < min ? v.entry.prs.size : min),
      Number.POSITIVE_INFINITY,
    );
    const closest = candidates.filter((v) => v.entry.prs.size === fewest);
    return closest.length > 0 ? closest[closest.length - 1] : null;
  };
  const chosen = decide(read.filter((v) => v.verdict !== SILENT));
  /*
   * Only consulted when no line resolved a verdict. A line that says something
   * about the proof still decides the row, however many pull requests it names —
   * that is C-540's question and `attribution` answers it — and silence must not
   * outrank speech.
   */
  const silentChosen = chosen ? null : decide(read.filter((v) => v.verdict === SILENT));
  const deciding = chosen ?? silentChosen;

  /*
   * `subjectEntries`, not `matched` (item C-551). A row whose only lines name
   * the pull request in passing has no register account of its release, so
   * calling it `SILENT` would assert the register spoke about it and said
   * nothing — which is the false clean C-545 was filed against, one level up.
   */
  const registerSays = chosen ? chosen.verdict : subjectEntries.length > 0 ? SILENT : null;
  /* Every matched line is a passing mention, so nothing here decides the row. */
  const passingOnly = matched.length > 0 && subjectEntries.length === 0;
  /*
   * The pull-request count and the attribution stay drawn from `chosen` alone,
   * so a silent row keeps `attribution: none`. This is load-bearing rather than
   * incidental: `verdict` below is overridden to `INEXACT_ATTRIBUTION` whenever
   * attribution is inexact, so attributing a silent deciding line would report a
   * silence as a batch-citation problem and hide it a second time. C-540's own
   * distinction — `none` with matched lines versus `none` with none — rests on
   * the same thing.
   */
  const registerLinePullRequests = chosen ? chosen.entry.prs.size : null;
  const attribution = attributionOf(registerLinePullRequests);
  const row = {
    ...record,
    pr: pr ?? null,
    registerLines: matched.length,
    /*
     * What `registerLines` was overstating. The item's finding is as much about
     * the count as the verdict: `registerLines > 0` reads as "the register has
     * something to say about this release", and for these rows it does not.
     */
    registerSubjectLines: subjectEntries.length,
    registerPassingLines: passingEntries.length,
    registerPassingClauses: passingEntries.map((e) => ({
      stamp: e.stamp,
      identity: e.identity,
      clause: mentionClause(e.text, pr),
    })),
    registerLinePullRequests,
    attribution,
    registerSays,
    registerSilence: registerSays === SILENT ? silenceOf(silentChosen?.sentence ?? null) : null,
    registerStamp: deciding?.entry.stamp ?? null,
    registerIdentity: deciding?.entry.identity ?? null,
    registerEvidence: deciding?.sentence ?? null,
  };

  /*
   * The comparison is kept whatever the attribution says, because the item is
   * explicit that the row must not be dropped: "a line naming two may well be
   * about both". A reader who establishes that the line IS about this record
   * recovers the verdict from `comparedVerdict` without re-running anything,
   * and a DISAGREE is where losing it would cost most — a disagreement is the
   * thing this module exists to find.
   */
  const comparedVerdict = compareAccounts({ recordSays: record.recordSays, registerSays });

  return {
    ...row,
    comparedVerdict,
    /*
     * `passingOnly` is read FIRST. `comparedVerdict` would be
     * `NO_REGISTER_LINE` here — true of this release and false of the number,
     * which the register does name — and `INEXACT_ATTRIBUTION` cannot apply,
     * because no line was chosen to be inexactly attributed.
     */
    verdict: passingOnly
      ? PASSING_MENTION
      : attribution === INEXACT
        ? INEXACT_ATTRIBUTION
        : comparedVerdict,
  };
}

/**
 * The one rule that decides whether a record and the register agree (C-528).
 *
 * Extracted from `reconcileRecord` rather than restated, because C-528 needs
 * the same question answered at a second moment — when a register line is
 * being WRITTEN, before any pull request exists to match it by — and two
 * copies of this comparison would drift the day one of them grew a case. The
 * suite pins the two callers to this function instead.
 *
 * `registerSays === null` means no line was found at all, which is not
 * agreement and is not a disagreement either.
 */
export function compareAccounts({ recordSays, registerSays }) {
  if (registerSays == null) return NO_REGISTER_LINE;
  /*
   * Read BEFORE the four comparisons, because there is nothing to compare: a
   * line that said nothing about the proof corroborates neither account. It
   * used to reach `return AGREE` at the bottom by being none of the cases above
   * it, which is the false clean item C-545 was filed against.
   */
  if (registerSays === SILENT) return REGISTER_SILENT;
  if (registerSays === CONFLICTED) return AMBIGUOUS;
  if (recordSays === NOT_RUN && registerSays === OBTAINED) return DISAGREE;
  if (recordSays === RAN && registerSays === OWED) return DISAGREE;
  if (recordSays === UNSTATED && registerSays === OBTAINED) return AMBIGUOUS;
  return AGREE;
}

/**
 * The release step's own question, asked of a line that is about to be written
 * (item C-528).
 *
 * `reconcile` answers "which records on `main` disagree with the register", and
 * that is a detector: it can only report an accumulation that already happened.
 * Nine records accumulated because the record is written BEFORE the merge and
 * the register line is written AFTER the deploy, so nothing ever revisits the
 * record. This function is the same comparison asked one moment earlier — of
 * the line itself, against the records the release being recorded actually adds
 * — so the writer is told while it is still doing release bookkeeping.
 *
 * There is no pull request matching here, deliberately. At the moment the line
 * is written its pull request is merged but the record's squash commit is not
 * necessarily in the local repository, and the caller already knows which
 * records this release is about: the ones its own branch adds. Matching by a
 * pull request id that may be absent would report `no-register-line` and miss
 * exactly the case this exists for.
 */
export function reviewReleaseLine({ line, records = [] } = {}) {
  const { verdict: registerSays, sentence } = registerSignedInVerdict(line);
  const rows = records
    .map((r) => parseRecord(r))
    .filter((record) => record.declaration === REQUIRED)
    .map((record) => ({
      ...record,
      registerSays,
      registerEvidence: sentence,
      verdict: compareAccounts({ recordSays: record.recordSays, registerSays }),
    }));
  return {
    registerSays,
    sentence,
    scanned: records.length,
    population: rows.length,
    rows,
    contradicted: rows.filter((r) => r.verdict === DISAGREE),
  };
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

  const counts = {
    [AGREE]: 0,
    [DISAGREE]: 0,
    [AMBIGUOUS]: 0,
    [NO_REGISTER_LINE]: 0,
    [INEXACT_ATTRIBUTION]: 0,
    [REGISTER_SILENT]: 0,
    [PASSING_MENTION]: 0,
  };
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
  /*
   * `inexact-attribution` is printed SECOND, ahead of ambiguous, because a row
   * in it is a row nobody has read against the right evidence — the deciding
   * line was about a batch. Burying it under `agree` was the original defect in
   * report form (item C-540).
   */
  /*
   * `register-silent` is printed ahead of `no-register-line` (item C-545). A row
   * in it has a line an auditor can go and read, and 22 of the 34 on the live
   * corpus carry a sentence about the proof that this reader could not resolve —
   * so it is nearer to unfinished business than the rows nobody ever wrote about.
   */
  /*
   * `passing-mention` is printed after `register-silent` and ahead of
   * `no-register-line` (item C-551). A row in it is unfinished business like a
   * silent one — the register names a number an auditor can go and read — but
   * strictly less is known about the release than in a silent row, where a line
   * about the release exists and merely resolved to nothing.
   */
  const order = [
    DISAGREE,
    INEXACT_ATTRIBUTION,
    AMBIGUOUS,
    REGISTER_SILENT,
    PASSING_MENTION,
    NO_REGISTER_LINE,
    AGREE,
  ];
  for (const verdict of order) {
    const rows = result.rows.filter((r) => r.verdict === verdict);
    if (rows.length === 0) continue;
    lines.push(`\n## ${verdict} — ${rows.length}`);
    for (const row of rows) {
      /*
       * The pull-request count and the comparison are printed PER ROW, not as a
       * total. 2 and 190 are the same state and are not remotely the same
       * evidence, and the item asks for the population per row for exactly that
       * reason. Saying what the comparison "would have read" keeps the row
       * recoverable without asking the reader to re-run anything.
       */
      const attributionNote =
        row.verdict === INEXACT_ATTRIBUTION
          ? `\n    evidence: the deciding line named ${row.registerLinePullRequests} pull requests, ` +
            `so it may be about any of them; the comparison alone would have read ${row.comparedVerdict}`
          : "";
      /*
       * Per row, and the KIND per row, because the two silences are different
       * defects and a reader who is shown only a total cannot tell which one
       * they have. The stamp and identity are printed for both kinds: an
       * `unmentioned` row has no sentence to quote, so the line's coordinates in
       * the register are the only thing that makes the claim checkable.
       */
      const silenceNote =
        row.verdict === REGISTER_SILENT
          ? `\n    silence:  ${row.registerSilence} — the deciding line at ` +
            `${row.registerStamp ?? "an unparsed stamp"} by ${row.registerIdentity ?? "an unnamed identity"} ` +
            (row.registerSilence === UNREAD
              ? "has a sentence about the proof that no marker resolved; read it and settle the row"
              : "mentions no signed-in proof at all; it may have had none to report") +
            `\n    would have read: ${AGREE} before item C-545`
          : "";
      /*
       * Every passing clause, one per line, with the register coordinates that
       * make it checkable (item C-551). NOT the count and not the first: the
       * five live cases differ in kind — a stack base, a rebase note, an
       * exclusion, a collision explanation, a follow-up announcement — and the
       * settlement of each is in its own words. A row whose three lines all name
       * the number in passing needs all three shown, or the reader settles it
       * from whichever one this printer happened to pick.
       */
      const passingNote =
        row.verdict === PASSING_MENTION
          ? `\n    passing:  ${row.registerPassingLines} line(s) name #${row.pr} without being ` +
            `about it, and no line is; \`registerLines: ${row.registerLines}\` was overstating this row` +
            row.registerPassingClauses
              .map(
                (c) =>
                  `\n      - ${c.stamp} by ${c.identity}: ${(c.clause ?? "(no clause found)").slice(0, 200)}`,
              )
              .join("") +
            `\n    would have read: ${row.comparedVerdict} before item C-551`
          : "";
      lines.push(
        `  ${row.releaseId ?? row.file}` +
          `\n    pr:       ${row.pr ?? "unresolved"}` +
          `\n    record:   ${row.recordSays}${row.recordEvidence ? ` — ${row.recordEvidence.slice(0, 160)}` : ""}` +
          `\n    register: ${row.registerSays ?? "no line"}${row.registerEvidence ? ` — ${row.registerEvidence.slice(0, 160)}` : ""}` +
          attributionNote +
          silenceNote +
          passingNote,
      );
    }
  }
  lines.push(
    `\nscanned ${result.scanned} record(s); ${result.population} declare a live signed-in proof required; ` +
      `${result.outsidePopulation.length} do not and are named individually by --json.`,
  );
  lines.push(
    `agree ${result.counts[AGREE]}  disagree ${result.counts[DISAGREE]}  ` +
      `ambiguous ${result.counts[AMBIGUOUS]}  no-register-line ${result.counts[NO_REGISTER_LINE]}  ` +
      `inexact-attribution ${result.counts[INEXACT_ATTRIBUTION]}  ` +
      `register-silent ${result.counts[REGISTER_SILENT]}  ` +
      `passing-mention ${result.counts[PASSING_MENTION]}`,
  );
  /*
   * The split named as two numbers, not one (item C-545). Every one of these
   * rows read `agree` before this change, and they are two defects: an `unread`
   * row has a proof sentence this module could not resolve and is where a
   * disagreement may be hiding; an `unmentioned` row may simply be a deploy line
   * with nothing to report. Totalling them would put the second's harmlessness
   * over the first.
   */
  const silentRows = result.rows.filter((r) => r.verdict === REGISTER_SILENT);
  if (silentRows.length > 0) {
    const unread = silentRows.filter((r) => r.registerSilence === UNREAD).length;
    lines.push(
      `of the ${silentRows.length} register-silent row(s), ${unread} have a sentence about the ` +
        `proof that no marker resolved and ${silentRows.length - unread} mention no signed-in ` +
        "proof at all. Every one of them read `agree` before item C-545, and none of them is " +
        "fixed by loosening a marker — read the sentence printed against each row and settle it.",
    );
  }
  /*
   * Corpus-wide, the thing the item is actually about (C-551): how much of
   * `registerLines` is the register talking about these releases. A row can
   * have subject lines AND passing mentions, so this is counted over every row
   * rather than over the `passing-mention` bucket — the four live cases where a
   * passing mention won the deciding line are not in that bucket at all.
   */
  const passingLineTotal = result.rows.reduce((n, r) => n + (r.registerPassingLines ?? 0), 0);
  if (passingLineTotal > 0) {
    const matchedTotal = result.rows.reduce((n, r) => n + (r.registerLines ?? 0), 0);
    const affected = result.rows.filter((r) => (r.registerPassingLines ?? 0) > 0).length;
    lines.push(
      `${passingLineTotal} of the ${matchedTotal} register line(s) matched by pull request name ` +
        `the number while being about other work, across ${affected} row(s). They no longer ` +
        "compete for a deciding line, so a verdict here is read from a sentence about this " +
        "release or from none at all.",
    );
  }
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
