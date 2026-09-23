#!/usr/bin/env node
/**
 * Resolve the queue's suppressed candidates against git and GitHub (item T-733).
 *
 * WHY THIS EXISTS
 *
 * `build-execution-queue.mjs` calls a claim "work in flight" when its newest
 * line names a branch or a pull request. That is the right default — the TTL
 * alone cannot tell a slow claim from an abandoned one, and item 24 measured
 * the hold distribution as bimodal, so no multiple of the TTL separates them.
 *
 * But the signal never expires. The rendered queue therefore tells the reader
 * to finish the job by hand: check the branch and the pull request each claim
 * names, and if the branch is gone and the PR is merged, append a release line.
 * T-732 filed the gap and named that remedy the cheap one, "a protocol
 * sentence rather than an implementation".
 *
 * A protocol sentence invoked by nobody is precisely the shape this backlog
 * exists against — the gate that proved a control existed by finding its name
 * in a file, and the pre-claim check that for a whole day was available,
 * correct, and called by no one. On 2026-09-23 the by-hand lookup was executed
 * for all fourteen live candidates and none of them was in flight; four had
 * merged 37 hours earlier and six had been abandoned for four days. Nothing
 * would ever have said so.
 *
 * WHAT THIS IS NOT
 *
 * It is not a change to the generator. T-732's shape (b) — let the board read
 * the repository — would make the queue require a network and a credential to
 * render, and the generator deliberately reads nothing but the operator
 * documents. This is a separate CLI an agent runs, in the shape of
 * `register-time-authority.mjs --preclaim`: the board stays hermetic and the
 * lookup becomes executable.
 *
 * THE VERDICT SPLIT IS THE ITEM
 *
 * The rendered queue describes one outcome: branch gone and PR merged means
 * the work is done. Six of the fourteen real candidates are not that case.
 * They have no branch on `origin` and **no pull request that ever existed** —
 * the claim was taken and dropped before anything was pushed. Both look
 * identical to the generator, and they need opposite next moves:
 *
 *   fossil     this claim's work merged   -> append a release line, do not re-take
 *   abandoned  this claim produced nothing -> no release line; re-verify the item
 *                                            on `main`, then re-take it if undone
 *
 * So `releaseCommandFor` offers a release line for a fossil and refuses one for
 * an abandoned claim. A resolver that collapsed the two would launder undone
 * work into a closed item, silently, which is the direction this backlog keeps
 * losing things in.
 *
 * FAILS CLOSED
 *
 * Any probe that cannot be completed — no branch named, git unreachable, no
 * GitHub credential — answers `unknown`, never `fossil`, and `unknown` counts
 * as stale. Answering "finished" because the check could not run is
 * indistinguishable, from the register's side, from never having run it.
 *
 * Run:
 *   node scripts/exec/fossil-claims.mjs --operator-root ~/Downloads
 *   node scripts/exec/fossil-claims.mjs --operator-root ~/Downloads --json
 *   node scripts/exec/fossil-claims.mjs --no-probe        (extraction only)
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { isDirectInvocation } from "./cli-entry.mjs";

export const VERDICTS = Object.freeze({
  FOSSIL: "fossil",
  ABANDONED: "abandoned",
  ALIVE: "alive",
  UNKNOWN: "unknown",
});

/** Every verdict but `alive` means the suppression bucket's label is wrong. */
export function isStale(verdict) {
  return verdict !== VERDICTS.ALIVE;
}

/* ------------------------------------------------------------------------- */
/* Reading the rendered queue                                                 */
/* ------------------------------------------------------------------------- */

/**
 * The id grammar, kept deliberately identical to the sibling readers: a lane
 * letter and three digits, or a bare/hashed number. A grammar that disagreed
 * with `build-source-board.mjs` would make the two disagree about what the
 * backlog contains, which is the defect `id-collision.mjs` was filed against.
 */
const ID_TOKEN = /^(?:#?\d{1,3}|[A-Z]-\d{3})$/;

const CANDIDATE_HEADING = "Suppressed CANDIDATES";

/**
 * The ids the queue names as its suppressed candidates.
 *
 * The rendered line is `**Suppressed CANDIDATES — … (N of M):** <ids> — <prose>`.
 * Only the run between the `:**` and the following em dash is ids; the prose
 * after it is a sentence and must not be scraped.
 */
export function suppressedCandidateIds(queueText) {
  if (typeof queueText !== "string") return [];
  for (const line of queueText.split(/\r?\n/)) {
    if (!line.includes(CANDIDATE_HEADING)) continue;
    const afterColon = line.slice(line.indexOf(":**") + 3);
    if (!afterColon) continue;
    const idRun = afterColon.split(" — ")[0];
    const ids = idRun
      .split(/\s+/)
      .map((token) => token.replace(/^\*+|\*+$/g, "").trim())
      .filter((token) => ID_TOKEN.test(token));
    if (ids.length) return ids;
  }
  return [];
}

/* ------------------------------------------------------------------------- */
/* Reading the register                                                       */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------ *
 * THE SUBJECT GRAMMAR IS A SECOND COPY, AND THAT IS A DELIBERATE COST.
 *
 * `build-execution-queue.mjs` decides which item a register line is ABOUT with
 * three grammars and a first-written-wins contest between them, and that
 * decision is what put a candidate in the suppression bucket. A reader here
 * that disagreed would report on a different line from the one that caused the
 * bucket — and the first draft of this file did exactly that, resolving no
 * claim at all for three of the fourteen live candidates because it demanded
 * the stamp at the start of the line.
 *
 * The right repair is one shared parser. It is not taken TODAY because the
 * generator's own bytes are the queue-provenance stamp: editing it moves the
 * sha256, every concurrently-running agent's queue stops matching the
 * generator beside it, and `append-claim.mjs` then refuses their claims. That
 * is item T-730, filed hours ago, and paying it to tidy this would deadlock a
 * live sibling. So the copy is made honest instead: each grammar below is
 * pinned by a case in the suite, including the precedence case the generator's
 * own comment names, and the live register is replayed so drift is loud.
 * ------------------------------------------------------------------------ */

/** Anywhere on the line, not only at its start: the register uses both. */
const STAMP = /(?:^|\s)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)(?:\s|$)/;

const RELEASE_SUBJECT =
  /\b(?:RELEASED|MERGED)\s+(?:item\s*#?)?([A-Z]-\d{3})\b|\b([A-Z]-\d{3})\s+(?:MERGED|RELEASED)\b/;
const ITEM_SUBJECT = /\bitem\s*#?([A-Z]-\d{3}|\d+)\b/i;
const CLAIM_SUBJECT = /\bCLAIM(?:ED)?\s+#?([A-Z]-\d{3}|\d+)\b/i;

/**
 * Which item a register line is about, or `null` if it is not a claim record.
 *
 * First written wins across the three grammars — never "an id anywhere on the
 * line". Register lines routinely narrate another lane's item in passing, and
 * scanning for any id is the defect T-545 was filed against.
 */
export function claimSubject(line) {
  if (typeof line !== "string") return null;
  const at = STAMP.exec(line)?.[1];
  if (!at) return null;

  let best = null;
  for (const pattern of [RELEASE_SUBJECT, ITEM_SUBJECT, CLAIM_SUBJECT]) {
    const candidate = pattern.exec(line);
    if (!candidate) continue;
    if (!best || candidate.index < best.index) best = candidate;
  }
  if (!best) return null;
  return { at, id: (best[1] ?? best[2]).toUpperCase() };
}

/**
 * The newest claim line whose SUBJECT is this id, resolved by stamp with
 * append position breaking a tie — the authority
 * `build-execution-queue.mjs` documents at length.
 */
export function newestClaimFor(registerText, id) {
  if (typeof registerText !== "string") return null;
  const start = registerText.indexOf("## Claim log");
  const body = start < 0 ? registerText : registerText.slice(start);
  const wanted = String(id).toUpperCase().replace(/^#/, "");

  let best = null;
  for (const raw of body.split(/\r?\n/)) {
    const subject = claimSubject(raw);
    if (!subject || subject.id.replace(/^#/, "") !== wanted) continue;
    const at = Date.parse(subject.at);
    if (Number.isNaN(at)) continue;
    if (!best || at >= best.at) best = { at, stamp: subject.at, line: raw };
  }
  return best;
}

/**
 * The branch names a claim line declares.
 *
 * Order matters. An explicit `branch <name>` field is the claim's own answer
 * and is preferred; only when there is none does this fall back to the token
 * `build-execution-queue.mjs` itself matched to call the claim in flight, so
 * this tool looks at the same evidence that produced the bucket.
 *
 * `branch none` is a DECLARATION OF ABSENCE and yields nothing: a claim that
 * says it has no branch is not a claim whose branch we failed to find.
 *
 * A `files:` list is full of slashes and must never be read as a branch, which
 * is why nothing here matches a bare `a/b` shape.
 */
export function branchesInClaim(line) {
  if (typeof line !== "string") return [];
  const found = [];

  const declared = /\bbranch\s+`?([^\s`|,]+)`?/gi;
  for (const match of line.matchAll(declared)) {
    const name = match[1].replace(/[.,;)]+$/, "");
    if (/^(?:none|n\/a|unset|tbd)$/i.test(name)) return [];
    if (name.includes("/")) found.push(name);
  }
  if (found.length) return dedupe(found);

  const inFlightToken = /\b(?:codex|claude|exec)\/[\w./-]+/g;
  for (const match of line.matchAll(inFlightToken)) {
    found.push(match[0].replace(/[.,;)`]+$/, ""));
  }
  return dedupe(found);
}

function dedupe(values) {
  return [...new Set(values)];
}

/* ------------------------------------------------------------------------- */
/* The verdict                                                                */
/* ------------------------------------------------------------------------- */

const SETTLED_PR_STATES = new Set(["MERGED", "CLOSED"]);

/**
 * One candidate's verdict from one probe result.
 *
 * Every path that is not a completed observation lands on `unknown`.
 */
export function classify({ branch, remoteExists, pullRequests, error } = {}) {
  if (!branch) {
    return { verdict: VERDICTS.UNKNOWN, because: "the claim names no branch, so this tool cannot answer" };
  }
  if (error) {
    return { verdict: VERDICTS.UNKNOWN, because: `the probe did not complete: ${error}` };
  }
  if (remoteExists !== true && remoteExists !== false) {
    return { verdict: VERDICTS.UNKNOWN, because: "the ref listing returned no answer about this branch" };
  }
  if (remoteExists) {
    return { verdict: VERDICTS.ALIVE, because: `${branch} is still on origin` };
  }

  const prs = Array.isArray(pullRequests) ? pullRequests : null;
  if (prs === null) {
    return { verdict: VERDICTS.UNKNOWN, because: "the pull-request lookup returned no answer" };
  }
  const open = prs.filter((pr) => !SETTLED_PR_STATES.has(String(pr?.state).toUpperCase()));
  if (open.length) {
    return {
      verdict: VERDICTS.ALIVE,
      because: `${branch} is gone from origin but PR #${open[0].number} is ${open[0].state}`,
    };
  }
  if (prs.length) {
    const settled = prs.map((pr) => `#${pr.number} ${String(pr.state).toUpperCase()}`).join(", ");
    return {
      verdict: VERDICTS.FOSSIL,
      because: `${branch} is gone from origin and its pull requests are settled (${settled})`,
    };
  }
  return {
    verdict: VERDICTS.ABANDONED,
    because:
      `${branch} is gone from origin and NO pull request was ever opened from it — ` +
      "this CLAIM produced nothing, so it is not evidence that the item is finished",
  };
}

/* ------------------------------------------------------------------------- */
/* Resolving a list                                                           */
/* ------------------------------------------------------------------------- */

/**
 * Resolve every suppressed candidate the queue names.
 *
 * `probe` is injected so that this is testable without a network, and so that
 * a CI runner — which has neither `origin` nor a credential — cannot silently
 * turn "could not check" into "checked, and fine".
 */
export function resolve({ queue, register: registerText, probe }) {
  const ids = suppressedCandidateIds(queue);
  const entries = ids.map((id) => {
    const claim = newestClaimFor(registerText, id);
    const branches = claim ? branchesInClaim(claim.line) : [];
    const branch = branches[0] ?? null;
    const base = { id, stamp: claim?.stamp ?? null, branch };

    if (!branch) return { ...base, ...classify({ branch: null }) };
    if (typeof probe !== "function") {
      return { ...base, ...classify({ branch, error: "no probe was supplied" }) };
    }
    try {
      const observed = probe(branch) ?? {};
      return { ...base, ...observed, ...classify({ branch, ...observed }) };
    } catch (error) {
      return { ...base, ...classify({ branch, error: String(error?.message ?? error) }) };
    }
  });

  return {
    entries,
    stale: entries.filter((entry) => isStale(entry.verdict)),
    counts: Object.values(VERDICTS).reduce((acc, verdict) => {
      acc[verdict] = entries.filter((entry) => entry.verdict === verdict).length;
      return acc;
    }, {}),
  };
}

/**
 * The append-claim invocation that retires a fossil — and `null` for anything
 * else, which is the half that matters. An abandoned claim must not be closed
 * with a line saying the work is done; it needs re-taking.
 */
export function releaseCommandFor(entry) {
  if (!entry || entry.verdict !== VERDICTS.FOSSIL) return null;
  return (
    "node scripts/exec/append-claim.mjs --file <register> " +
    `--item ${entry.id} --identity '<base-agent>#<run-id>' --action release ` +
    `--branch ${entry.branch} --message '<why this claim is a fossil, quoting ${entry.because}>'`
  );
}

/* ------------------------------------------------------------------------- */
/* The real probe                                                             */
/* ------------------------------------------------------------------------- */

/**
 * Ask git and GitHub about one branch.
 *
 * `git ls-remote` is the authority on whether the ref exists; `gh pr list
 * --head` is the authority on what was ever opened from it. Neither answer is
 * inferred from the other, and a failure of either raises rather than
 * returning a cheerful default.
 */
export function gitHubProbe(branch, { cwd = process.cwd(), env = process.env } = {}) {
  const run = (file, args) =>
    execFileSync(file, args, {
      cwd,
      env: { ...env, GH_TOKEN: env.GH_TOKEN ?? "" },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 60_000,
      maxBuffer: 16 * 1024 * 1024,
    });

  const refs = run("git", ["ls-remote", "--heads", "origin", branch]);
  const remoteExists = refs.trim().length > 0;

  const raw = run("gh", [
    "pr",
    "list",
    "--head",
    branch,
    "--state",
    "all",
    "--json",
    "number,state,mergedAt",
    "--limit",
    "20",
  ]);
  const pullRequests = JSON.parse(raw || "[]");
  return { remoteExists, pullRequests };
}

/* ------------------------------------------------------------------------- */
/* CLI                                                                        */
/* ------------------------------------------------------------------------- */

const USAGE =
  "usage: fossil-claims.mjs [--operator-root DIR] [--queue FILE] [--register FILE]\n" +
  "                        [--repo-root DIR] [--no-probe] [--json] [--quiet]\n" +
  "resolves the queue's suppressed fossil candidates against git and GitHub.\n" +
  "Exit 1 when any candidate is not `alive` — fossil, abandoned or unknown —\n" +
  "because each of those means the suppression bucket's label is wrong.";

const EXIT_CLEAN = 0;
const EXIT_STALE = 1;
const EXIT_USAGE = 2;

function cli(argv) {
  if (argv.includes("--help")) {
    console.log(USAGE);
    process.exit(EXIT_CLEAN);
  }

  const valueAfter = (flag) => {
    const at = argv.indexOf(flag);
    return at >= 0 ? argv[at + 1] : undefined;
  };

  const operatorRoot = path.resolve(
    valueAfter("--operator-root") ?? process.env.SOURCE_EXECUTION_HOME ?? process.cwd(),
  );
  const queueFile = path.resolve(valueAfter("--queue") ?? path.join(operatorRoot, "EXECUTION_QUEUE.md"));
  const registerFile = path.resolve(
    valueAfter("--register") ?? path.join(operatorRoot, "EXECUTION_CLAIMS.md"),
  );

  for (const [label, file] of [["queue", queueFile], ["register", registerFile]]) {
    if (!fs.existsSync(file)) {
      console.error(`fossil-claims: no ${label} at ${file}`);
      console.error(USAGE);
      process.exit(EXIT_USAGE);
    }
  }

  const repoRoot = path.resolve(valueAfter("--repo-root") ?? process.cwd());
  const probe = argv.includes("--no-probe")
    ? undefined
    : (branch) => gitHubProbe(branch, { cwd: repoRoot });

  const report = resolve({
    queue: fs.readFileSync(queueFile, "utf8"),
    register: fs.readFileSync(registerFile, "utf8"),
    probe,
  });

  if (argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else if (!argv.includes("--quiet")) {
    print(report);
  }

  process.exit(report.stale.length > 0 ? EXIT_STALE : EXIT_CLEAN);
}

function print(report) {
  if (report.entries.length === 0) {
    console.log("No suppressed candidates in the queue — nothing to resolve.");
    return;
  }
  console.log(`Suppressed candidates resolved: ${report.entries.length}`);
  for (const verdict of Object.values(VERDICTS)) {
    console.log(`  ${verdict.padEnd(10)} ${report.counts[verdict]}`);
  }
  console.log("");
  for (const entry of report.entries) {
    console.log(`${entry.id.padEnd(7)} ${entry.verdict.padEnd(10)} ${entry.because}`);
    const command = releaseCommandFor(entry);
    if (command) console.log(`        retire it:  ${command}`);
    if (entry.verdict === VERDICTS.ABANDONED) {
      console.log(
        "        NOT a fossil — no release line. The verdict is about the CLAIM, not the item: " +
          "the work may still have shipped from some other branch, so re-verify the item on " +
          "`main` before re-taking it.",
      );
    }
  }
}

// Resolved through the shared guard (item T-723), not a filename suffix.
if (isDirectInvocation(import.meta.url)) {
  cli(process.argv.slice(2));
}
