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

  const file = flag("--file");
  if (!file) {
    console.error("usage: --file <register.md> [--since ISO] [--now ISO] [--github|--authority f] [--json]");
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
