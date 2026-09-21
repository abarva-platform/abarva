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

/** `2026-09-21T16:04Z` or `2026-09-21T16:04:31Z` at the head of a line. */
const STAMP_HEAD = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)\s*\|?\s*([A-Za-z0-9_.-]+)?/;

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

/** True only when at least one merge token on the line is NOT negated. */
export function announcesMerge(text) {
  MERGE_TOKEN.lastIndex = 0;
  for (const match of text.matchAll(MERGE_TOKEN)) {
    const before = text.slice(Math.max(0, match.index - 28), match.index);
    if (!MERGE_NEGATOR.test(before)) return true;
  }
  return false;
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
    const head = raw.match(STAMP_HEAD) ?? raw.match(/^-\s*item\s.*?\|\s*([A-Za-z0-9_.-]+)\s*\|\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)/);
    if (!head) continue;
    const stamp = raw.startsWith("-") ? head[2] : head[1];
    const agent = raw.startsWith("-") ? head[1] : (head[2] ?? "unknown");
    if (!stamp) continue;
    const body = raw.slice(stamp.length);
    const prRefs = [...raw.matchAll(PR_REF)].map((m) => Number(m[1]));
    const citedTimes = [...body.matchAll(ISO_ANY)].map((m) => m[0]);
    out.push({
      lineNumber: i + 1,
      stamp,
      stampMs: Date.parse(stamp),
      agent,
      text: raw,
      prRefs: [...new Set(prRefs)],
      citedTimes,
      announcesMerge: announcesMerge(raw),
      claimsElapsed: ELAPSED_CLAIM.test(raw),
    });
  }
  return out;
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
      for (const pr of line.prRefs) {
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
 * The stated tolerance. A line is written after the event it reports, so a
 * small positive drift is the writing delay and is expected; anything beyond
 * this, in either direction, is the lane's clock rather than its typing speed.
 */
export const TOLERANCE_SECONDS = 300;

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
    console.log(`  violations:        ${report.violations.length}`);
    for (const v of report.violations) {
      console.log(`    [${v.code}] line ${v.lineNumber} ${v.stamp} ${v.agent}: ${v.detail}`);
    }
  }

  process.exit(report.violations.length > 0 ? 1 : 0);
}
