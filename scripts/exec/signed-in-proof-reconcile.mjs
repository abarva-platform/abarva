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

  const obtained = sentences.filter((s) => REGISTER_OBTAINED.test(s) && !REGISTER_OWED.test(s));
  const owed = sentences.filter((s) => REGISTER_OWED.test(s) && !REGISTER_OBTAINED.test(s));
  const both = sentences.filter((s) => REGISTER_OBTAINED.test(s) && REGISTER_OWED.test(s));

  if (obtained.length > 0 && owed.length === 0 && both.length === 0) {
    return { verdict: OBTAINED, sentence: obtained[0] };
  }
  if (owed.length > 0 && obtained.length === 0 && both.length === 0) {
    return { verdict: OWED, sentence: owed[0] };
  }
  if (obtained.length > 0 || owed.length > 0 || both.length > 0) {
    return { verdict: CONFLICTED, sentence: both[0] ?? obtained[0] ?? owed[0] };
  }
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
