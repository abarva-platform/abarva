#!/usr/bin/env node
/**
 * Which merges on `main` does the deployment register account for at all?
 * (item C-556)
 *
 * Every other control in this directory asks whether a register line decides a
 * row *correctly*. `C-540` asks whether a line naming several pull requests may
 * decide one of them, `C-545` whether a line silent about a signed-in proof
 * should read as agreement, `C-548` whether a proof marker resolves to
 * anything, `C-551` whether a line that names a pull request in passing is that
 * record's deciding line. All four presuppose a line.
 *
 * This asks the question one level up: **is there a line?** A change can merge
 * to `main`, ship through the repo-owned deploy, and alter a product surface
 * while no register line names it by merge SHA or by pull request. It then
 * acquires no `merged` state, no `deployed` state and no signed-in question,
 * and -- because every downstream reader of the register is keyed to a line --
 * nothing anywhere reports it as unfinished. Absence of a row is not absence of
 * work, and until this existed it was indistinguishable from it.
 *
 * ## What "names it" has to mean, and why substring is not it
 *
 * The item was filed on a measurement that grepped the register for
 * ten-character SHA abbreviations. Re-running it through the register's own
 * grammar moved five of the nine merges it listed, in both directions, and both
 * directions are instructive:
 *
 *   - `7f0056d1e8` is NAMED. The register says *"RELEASED item C-605 ... PR
 *     #8520 merged as 7f0056d1"* -- by pull request, and by an **eight**
 *     character abbreviation. A ten-character probe finds neither. So a SHA is
 *     matched by PREFIX RELATION, never by fixed-width substring; git
 *     abbreviates to whatever length is unambiguous and the register quotes
 *     whatever git printed.
 *   - `fb7487bc0c`, `42e1fbd9f4`, `66361b1130` and `d0a4dbc680` all DO appear,
 *     at nine characters, and not one of them is named: they are somebody
 *     else's base (*"FALSE on current origin/main fb7487bc0"*, *"off exact
 *     origin/main fb7487bc0"*), another item's merge narrated in passing (*"PR
 *     8484 then squash-merged to main ... as 42e1fbd9f"*), or the SHA of the
 *     deploy run a different item was queued behind (*"pending behind an
 *     in-progress run for 66361b113"*). A substring reader calls all four
 *     accounted-for. That is `C-551`'s distinction, asked about SHAs.
 *
 * So the join is the **subject pull request**, read with `subjectPullRequest`
 * from `signed-in-proof-reconcile.mjs` rather than re-implemented here. A line
 * names a merge when the line is ABOUT that merge's pull request.
 *
 * ## Three naming states, because two would hide the interesting one
 *
 * `MENTIONED_ONLY` is not a shade of `UNNAMED` and it is not a near-miss for
 * `NAMED`. It is the state of the four merges above: the register has the SHA on
 * file and says nothing about the merge. A reader settling one needs the clause,
 * so the clause is printed. Folding it into `NAMED` hides an unaccounted merge --
 * the defect this module exists to find -- and folding it into `UNNAMED` sends an
 * auditor looking for a thread that is in fact there.
 *
 * ## The direction this is allowed to be wrong in
 *
 * A false `UNNAMED` or `MENTIONED_ONLY` costs one lookup, and the report hands
 * the reader the clause to do it with. A false `NAMED` costs the whole item: a
 * merge nothing accounts for, reported as accounted for, silently. So a merge is
 * `NAMED` only on POSITIVE attribution -- some line's subject pull request IS
 * this merge's pull request. A SHA mention on a line whose subject cannot be
 * identified is `MENTIONED_ONLY`, never `NAMED`, even though some of those lines
 * genuinely are about their own merge.
 *
 * The single exception is a merge with **no pull request at all**, where there
 * is no other handle: there, an outcome line that quotes the SHA and is about no
 * other pull request names it. That fallback is reachable only for the `NO_PR`
 * population, so the shapes above -- every one of which belongs to a pull
 * request -- never reach it.
 *
 * ## Provenance is three states too, and the third is not a defect
 *
 * A commit on `main` whose only associated pull request is **closed without
 * being merged** is reported as `PR_CLOSED_UNMERGED` rather than folded into
 * "has a pull request" or "has none": the API does not say how such a commit
 * reached `main`, and that is a fact about the commit, not a missing lookup.
 * The item names `7f0056d1e8` as its live instance of this and **that is no
 * longer true** -- GitHub returns `merged_at 2026-09-26T19:09:12Z` for #8520,
 * so the commit merged normally. The state is implemented because the item
 * specifies it and the API plainly permits it; it is proved on a fixture, and
 * this comment records that the filed instance did not hold on re-verification
 * rather than leaving a later reader to rediscover that.
 *
 * Pull requests are resolved from the GitHub API and never from the commit
 * subject, because `7f0056d1e8`'s subject carries no number at all. With
 * `--no-github` every provenance is `PR_UNRESOLVED`, the verdict for any merge
 * with no SHA mention is withheld as `UNRESOLVED`, and `--strict` refuses the
 * run: a reader that degraded to "could not ask, therefore fine" would be the
 * unfailable gate this directory exists against.
 *
 * Nothing here writes a register line. Back-filling the missing lines by hand is
 * explicitly not the deliverable -- nine hand-written lines leave the tenth
 * merge unguarded, and the detector is what closes the class.
 *
 * Run:
 *   node scripts/exec/register-merge-coverage.mjs --since 2026-09-26T00:00:00Z
 *   node scripts/exec/register-merge-coverage.mjs --base origin/main~40 --json
 *   node scripts/exec/register-merge-coverage.mjs --since 2026-09-26 --strict
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { isDirectInvocation, unknownFlags } from "./cli-entry.mjs";
import { registerEntries, subjectPullRequest } from "./signed-in-proof-reconcile.mjs";
import { announcesMergeOf } from "./register-time-authority.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_REGISTER = path.join(
  process.env.HOME || "",
  "Downloads",
  "EXECUTION_CLAIMS.md",
);
export const DEFAULT_REPO = "abarva-platform/abarva";
export const DEFAULT_REF = "origin/main";

/* -------------------------------------------------------------------------- */
/* Naming verdicts                                                            */
/* -------------------------------------------------------------------------- */

/** Some register line's SUBJECT pull request is this merge's. */
export const NAMED = "named";
/**
 * The register has this merge's SHA or pull request on file and no line is
 * about it.
 *
 * Its own state, for the reason the module docstring gives: the four live
 * merges that sit here are each quoted as somebody else's base or somebody
 * else's run, so the register holds the string and accounts for nothing.
 */
export const MENTIONED_ONLY = "mentioned-only";
/** No register line contains this merge's SHA or its pull request number. */
export const UNNAMED = "unnamed";
/**
 * Pull requests were not resolved, so a SHA-silent merge cannot be judged.
 *
 * Withheld rather than answered. Without the API a merge whose register line
 * names only its pull request is indistinguishable from one nothing mentions,
 * and answering `UNNAMED` there would report accounted-for merges as silent.
 */
export const UNRESOLVED = "unresolved";

export const NAMING_VERDICTS = [NAMED, MENTIONED_ONLY, UNNAMED, UNRESOLVED];

/* -------------------------------------------------------------------------- */
/* Provenance states                                                          */
/* -------------------------------------------------------------------------- */

/** An associated pull request carries a non-null `merged_at`. */
export const PR_MERGED = "pull-request-merged";
/**
 * Every associated pull request is closed with a null `merged_at` (item C-556's
 * third state).
 *
 * Not folded into either neighbour. The API does not say how the commit reached
 * `main`, and a reader told "no pull request" would look for a direct push,
 * while one told "pull request merged" would look for a merge that did not
 * happen.
 */
export const PR_CLOSED_UNMERGED = "pull-request-closed-unmerged";
/** The API associates no pull request with this commit. */
export const NO_PR = "no-pull-request";
/** `--no-github`: nothing was asked, and this does not mean "none". */
export const PR_UNRESOLVED = "pull-request-unresolved";

export const PROVENANCE_STATES = [PR_MERGED, PR_CLOSED_UNMERGED, NO_PR, PR_UNRESOLVED];

/* -------------------------------------------------------------------------- */
/* Reading a SHA out of register prose                                        */
/* -------------------------------------------------------------------------- */

/**
 * The shortest abbreviation this will accept as naming a commit.
 *
 * git's own floor is 7 and the register quotes 8, 9, 10 and 40 characters in
 * different lines. Below 7 a token is short enough to be a table column or a
 * fragment of a run id.
 */
export const MIN_SHA_PREFIX = 7;

const SHA_TOKEN = /\b[0-9a-f]{7,40}\b/g;

/** Every hexadecimal token in `text` that could be an abbreviated commit id. */
export function shaTokens(text) {
  return [...String(text ?? "").matchAll(SHA_TOKEN)].map((m) => m[0]);
}

/**
 * Whether `text` quotes `sha`, at any abbreviation length.
 *
 * The comparison is a PREFIX RELATION and not equality, in the only direction
 * that is sound: a token the full SHA starts with is an abbreviation of it. The
 * item's own measurement compared fixed ten-character strings and missed the
 * one merge in its list that the register does name, at eight.
 *
 * A false positive would need a hexadecimal token in prose that happens to
 * prefix a real merge SHA -- a decimal run id qualifies as hexadecimal, so this
 * is possible rather than impossible. It is also harmless here: a mention alone
 * never produces `NAMED`.
 */
export function mentionsSha(text, sha) {
  const full = String(sha ?? "").toLowerCase();
  if (full.length < MIN_SHA_PREFIX) return false;
  return shaTokens(String(text ?? "").toLowerCase()).some((token) => full.startsWith(token));
}

/**
 * The clause in which `text` quotes `sha`, so a human can settle the row.
 *
 * Split on the same boundaries `mentionClause` uses in
 * `signed-in-proof-reconcile.mjs` -- sentence end, newline, or the register's
 * field pipe -- because a whole register line is frequently a page of prose and
 * the words that matter are one clause of it.
 */
export function shaClause(text, sha) {
  const pieces = String(text ?? "").split(/(?<=[.;])\s+|\n+|\s*\|\s*/);
  const hit = pieces.find((piece) => mentionsSha(piece, sha));
  return hit ? hit.trim() : null;
}

/* -------------------------------------------------------------------------- */
/* Provenance                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The provenance of a commit from the pull requests the API associates with it.
 *
 * `null` means the question was never asked and is reported as such. An empty
 * array means the API answered "none", which is a different fact.
 */
export function provenanceOf(pulls) {
  if (pulls == null) return { provenance: PR_UNRESOLVED, pullRequest: null, pullRequests: [] };
  const list = pulls.map((p) => ({
    number: Number(p.number),
    mergedAt: p.merged_at ?? p.mergedAt ?? null,
  }));
  if (list.length === 0) {
    return { provenance: NO_PR, pullRequest: null, pullRequests: [] };
  }
  const merged = list.find((p) => p.mergedAt != null);
  if (merged) {
    return { provenance: PR_MERGED, pullRequest: merged.number, pullRequests: list };
  }
  return {
    provenance: PR_CLOSED_UNMERGED,
    pullRequest: list[0].number,
    pullRequests: list,
  };
}

/* -------------------------------------------------------------------------- */
/* The naming judgement                                                       */
/* -------------------------------------------------------------------------- */

/**
 * An outcome line's lead, for the `NO_PR` fallback only.
 *
 * Deliberately narrower than `signed-in-proof-reconcile.mjs`'s `OUTCOME_LEAD`:
 * this is the one place a SHA mention can produce `NAMED` on its own, so it
 * accepts only the three verbs that assert a merge or a deploy happened.
 */
const MERGE_OUTCOME_LEAD = /^(?:RELEASED|MERGED|DEPLOYED)\b/i;

const PR_REFERENCE = (pr) => new RegExp(`(?:pull/${pr}|#${pr})\\b`);

/**
 * Where in `text` the merge is referenced, for `announcesMergeOf` to read the
 * nearest merge token from. `-1` when it is referenced nowhere.
 */
function referenceIndex(text, { sha, pullRequest }) {
  if (pullRequest != null) {
    const at = text.search(PR_REFERENCE(pullRequest));
    if (at >= 0) return at;
  }
  const full = String(sha ?? "").toLowerCase();
  for (const token of shaTokens(text.toLowerCase())) {
    if (full.startsWith(token)) return text.toLowerCase().indexOf(token);
  }
  return -1;
}

/**
 * How one register entry relates to one merge.
 *
 * Returns `null` when the entry says nothing about it at all -- which is the
 * common case, and the reason this is separate from `nameMerge`.
 *
 * `reportsMerged` is REPORTED AND NOT DECIDED ON, and that is a measurement
 * rather than a preference. The obvious second condition for `NAMED` is that
 * the line also asserts the merge happened -- it closes a real false-`NAMED`
 * shape, the live *"U-544 MID-FLIGHT, PR OPEN, NOT MERGED: .../pull/8539"*,
 * whose subject IS 8539. It was built that way and then measured over the
 * 2026-09-26 window: requiring it moved **12 merges out of `named`**, every one
 * of them wrongly. `register-time-authority.mjs`'s `MERGE_TOKEN` is tuned for
 * the question that module asks -- it matches `MERGED`, `squash-merged`,
 * `merged as`, `mergedAt` and a backticked `merge \`sha\`` -- so a perfectly
 * ordinary release line reading *"PR #8534 36 applicable CI successes, squash
 * merge abf5bb5e39..."* carries no token at all and came back unannounced.
 * Twelve false `unnamed`-side verdicts to close one false `named` is the wrong
 * trade, and widening the token to fit would be `C-529`'s defect exactly.
 *
 * So the flag rides along on the row instead, `namedWithoutMergeReport` is
 * counted in the report, and the verdict is decided by subject equality alone.
 * A reader who wants the stronger question can ask it of the printed count.
 */
export function entryRole({ entry, sha, pullRequest, provenance }) {
  const text = String(entry?.text ?? "");
  const prs = entry?.prs instanceof Set ? entry.prs : new Set();
  const shaHit = mentionsSha(text, sha);
  const prHit = pullRequest != null && prs.has(pullRequest);
  if (!shaHit && !prHit) return null;

  const subject = subjectPullRequest(text);
  const at = referenceIndex(text, { sha, pullRequest });
  const reportsMerged = at >= 0 && announcesMergeOf(text, at);
  const base = {
    stamp: entry.stamp ?? null,
    identity: entry.identity ?? null,
    subject,
    shaHit,
    prHit,
    reportsMerged,
    clause: shaHit ? shaClause(text, sha) : null,
  };
  if (pullRequest != null && subject === pullRequest) {
    return { ...base, role: NAMED };
  }
  if (provenance === NO_PR && shaHit && subject == null && MERGE_OUTCOME_LEAD.test(text.trim())) {
    return { ...base, role: NAMED };
  }
  return { ...base, role: MENTIONED_ONLY };
}

/**
 * One merge's row: its provenance, its verdict, and the lines behind both.
 *
 * `merge` is `{ sha, subject, committedAt, pulls }`, where `pulls` is the API's
 * answer or `null` for "never asked".
 */
export function nameMerge({ merge, entries = [] }) {
  const { provenance, pullRequest, pullRequests } = provenanceOf(merge.pulls);
  const roles = [];
  for (const entry of entries) {
    const role = entryRole({ entry, sha: merge.sha, pullRequest, provenance });
    if (role) roles.push(role);
  }
  const namingLines = roles.filter((r) => r.role === NAMED);
  const naming = namingLines.find((r) => r.reportsMerged) ?? namingLines[0];
  let verdict;
  if (naming) verdict = NAMED;
  else if (roles.length > 0) verdict = MENTIONED_ONLY;
  else if (provenance === PR_UNRESOLVED) verdict = UNRESOLVED;
  else verdict = UNNAMED;

  return {
    sha: merge.sha,
    shortSha: String(merge.sha).slice(0, 10),
    subject: merge.subject ?? null,
    committedAt: merge.committedAt ?? null,
    provenance,
    pullRequest,
    pullRequests,
    verdict,
    namingLine: naming
      ? {
          stamp: naming.stamp,
          identity: naming.identity,
          clause: naming.clause,
          reportsMerged: naming.reportsMerged,
        }
      : null,
    /**
     * `true` when the register names this merge and NO line naming it asserts
     * the merge happened. Reported, never decisive -- see `entryRole`.
     */
    namedWithoutMergeReport: namingLines.length > 0 && !namingLines.some((r) => r.reportsMerged),
    mentions: roles
      .filter((r) => r.role === MENTIONED_ONLY)
      .map((r) => ({ stamp: r.stamp, identity: r.identity, subject: r.subject, clause: r.clause })),
  };
}

/** Every merge in the window, with its verdict, plus the counts. */
export function coverage({ merges = [], register = "" } = {}) {
  const entries = registerEntries(register);
  const rows = merges.map((merge) => nameMerge({ merge, entries }));
  const counts = Object.fromEntries(NAMING_VERDICTS.map((v) => [v, 0]));
  const provenanceCounts = Object.fromEntries(PROVENANCE_STATES.map((p) => [p, 0]));
  let namedWithoutMergeReport = 0;
  for (const row of rows) {
    counts[row.verdict] += 1;
    provenanceCounts[row.provenance] += 1;
    if (row.namedWithoutMergeReport) namedWithoutMergeReport += 1;
  }
  return {
    rows,
    counts,
    provenanceCounts,
    namedWithoutMergeReport,
    registerEntries: entries.length,
  };
}

/**
 * Whether a result is a proof of anything.
 *
 * A run that asked GitHub nothing, or that read an empty register, has not
 * measured silence -- it has produced silence. `--strict` refuses both.
 */
export function unreportable(result) {
  const reasons = [];
  if (result.registerEntries === 0) reasons.push("the register parsed to zero entries");
  if (result.provenanceCounts[PR_UNRESOLVED] > 0) {
    reasons.push(
      `${result.provenanceCounts[PR_UNRESOLVED]} merge(s) had no pull request lookup, ` +
        "so their verdicts are withheld rather than answered",
    );
  }
  return reasons;
}

/* -------------------------------------------------------------------------- */
/* Reading the world                                                          */
/* -------------------------------------------------------------------------- */

const UNIT = String.fromCharCode(31);

export function runGit(args, { cwd = process.cwd() } = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

/**
 * The merges on `ref` in the window, newest first.
 *
 * `main` is squash-merge only, so one commit on it is one merge and
 * `--first-parent` is what makes that identity exact rather than incidental.
 */
export function mergesIn({ ref = DEFAULT_REF, since, base, cwd, git = runGit } = {}) {
  const args = ["log", "--first-parent", `--format=%H${UNIT}%s${UNIT}%cI`];
  if (since) args.push(`--since=${since}`);
  args.push(base ? `${base}..${ref}` : ref);
  const out = git(args, { cwd });
  return out
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [sha, subject, committedAt] = line.split(UNIT);
      return { sha, subject, committedAt, pulls: null };
    });
}

export function runGh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: "" },
    maxBuffer: 16 * 1024 * 1024,
  });
}

/**
 * The pull requests GitHub associates with a commit, or `null` when the lookup
 * failed.
 *
 * `null` and `[]` are different answers and are kept apart all the way to the
 * report: a failed lookup must never render as "this commit has no pull
 * request".
 */
export function resolvePulls(sha, { repo = DEFAULT_REPO, gh = runGh } = {}) {
  try {
    const out = gh([
      "api",
      `repos/${repo}/commits/${sha}/pulls`,
      "--jq",
      ".[] | {number, merged_at, state}",
    ]);
    return out
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line));
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Report                                                                     */
/* -------------------------------------------------------------------------- */

const LABEL = {
  [NAMED]: "NAMED",
  [MENTIONED_ONLY]: "MENTIONED ONLY",
  [UNNAMED]: "UNNAMED",
  [UNRESOLVED]: "UNRESOLVED",
};

export function formatReport(result) {
  const out = [];
  out.push(
    `${result.rows.length} merge(s) read against ${result.registerEntries} register entries.`,
  );
  out.push(
    `  named ${result.counts[NAMED]}` +
      `  mentioned-only ${result.counts[MENTIONED_ONLY]}` +
      `  unnamed ${result.counts[UNNAMED]}` +
      `  unresolved ${result.counts[UNRESOLVED]}`,
  );
  out.push(
    `  provenance: merged ${result.provenanceCounts[PR_MERGED]}` +
      `  closed-unmerged ${result.provenanceCounts[PR_CLOSED_UNMERGED]}` +
      `  no-pull-request ${result.provenanceCounts[NO_PR]}` +
      `  unresolved ${result.provenanceCounts[PR_UNRESOLVED]}`,
  );
  out.push(
    `  of the named, ${result.namedWithoutMergeReport} are named only by line(s) that do not ` +
      "themselves report the merge (reported, not a verdict)",
  );
  out.push("");
  out.push("An unnamed merge is a REPORTED STATE, not an absence of work: nothing in the");
  out.push("register gives it a merged, deployed or signed-in question, so no downstream");
  out.push("reader can report it as unfinished.");
  for (const bucket of [UNNAMED, MENTIONED_ONLY, PR_CLOSED_UNMERGED]) {
    const rows =
      bucket === PR_CLOSED_UNMERGED
        ? result.rows.filter((r) => r.provenance === PR_CLOSED_UNMERGED)
        : result.rows.filter((r) => r.verdict === bucket);
    if (rows.length === 0) continue;
    out.push("");
    out.push(
      bucket === PR_CLOSED_UNMERGED
        ? `## On main, and its only pull request never merged (${rows.length})`
        : `## ${LABEL[bucket]} (${rows.length})`,
    );
    for (const row of rows) {
      const pr = row.pullRequest == null ? "no pull request" : `#${row.pullRequest}`;
      out.push(`  ${row.shortSha}  ${pr}  ${row.committedAt ?? ""}  ${row.subject ?? ""}`);
      for (const mention of row.mentions) {
        out.push(
          `      mentioned by ${mention.stamp} (about ` +
            `${mention.subject == null ? "no pull request" : `#${mention.subject}`}): ` +
            `${mention.clause ?? "pull request number only"}`,
        );
      }
    }
  }
  const reasons = unreportable(result);
  if (reasons.length > 0) {
    out.push("");
    out.push("NOT A PROOF OF SILENCE:");
    for (const reason of reasons) out.push(`  - ${reason}`);
  }
  return out.join("\n");
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

const FLAG_SPEC = {
  value: ["--register", "--since", "--base", "--ref", "--repo", "--cwd", "--limit"],
  boolean: ["--json", "--strict", "--no-github"],
};

function valueAfter(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

export function main(argv = process.argv.slice(2)) {
  const unknown = unknownFlags(argv, FLAG_SPEC);
  if (unknown.length > 0) {
    console.error(
      `Unrecognised flag(s): ${unknown.join(" ")}\n` +
        "An unrecognised flag is parsed as nothing, so the check you asked for would " +
        "not run. Refusing rather than passing silently.",
    );
    return 2;
  }
  const registerPath = valueAfter(argv, "--register") ?? DEFAULT_REGISTER;
  if (!fs.existsSync(registerPath)) {
    console.error(`No register at ${registerPath} -- pass --register <path>.`);
    return 2;
  }
  const since = valueAfter(argv, "--since");
  const base = valueAfter(argv, "--base");
  if (!since && !base) {
    console.error(
      "Give a window: --since <ISO> or --base <ref>. " +
        "A run over all of history would resolve every commit against GitHub.",
    );
    return 2;
  }
  const register = fs.readFileSync(registerPath, "utf8");
  const cwd = valueAfter(argv, "--cwd") ?? path.resolve(HERE, "..", "..");
  let merges;
  try {
    merges = mergesIn({ ref: valueAfter(argv, "--ref") ?? DEFAULT_REF, since, base, cwd });
  } catch (error) {
    console.error(`git log failed: ${error.message}`);
    return 2;
  }
  const limit = Number(valueAfter(argv, "--limit") ?? 0);
  if (limit > 0) merges = merges.slice(0, limit);

  if (!argv.includes("--no-github")) {
    const repo = valueAfter(argv, "--repo") ?? DEFAULT_REPO;
    for (const merge of merges) merge.pulls = resolvePulls(merge.sha, { repo });
  }
  const result = coverage({ merges, register });
  if (argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatReport(result));
  }
  if (argv.includes("--strict")) {
    if (unreportable(result).length > 0) return 2;
    if (result.counts[UNNAMED] > 0 || result.counts[MENTIONED_ONLY] > 0) return 1;
  }
  return 0;
}

if (isDirectInvocation(import.meta.url)) {
  process.exitCode = main();
}
