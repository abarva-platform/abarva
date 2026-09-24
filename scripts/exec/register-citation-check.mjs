#!/usr/bin/env node
/**
 * Do this toolchain's `LIVE_<n>` fixtures still quote the register line they
 * name? (item T-718)
 *
 * `register-time-authority.test.mjs` proves its rules against **transcriptions**
 * of the live operator register: a comment naming a line number, and a string
 * literal beside it copied out of that line by hand. That is the right design —
 * the suite must not read the live register, because a control taking its truth
 * from its own subject cannot fail, and CI has no operator root anyway. But it
 * leaves the transcriptions themselves unchecked. The register is append-only,
 * so the *text* is stable; the *line numbers* are stable only for as long as
 * nobody writes above the body, and nothing noticed when somebody did.
 *
 * So this is deliberately **not** a CI gate. It is a local verifier an agent
 * runs the way `append-claim.mjs --preclaim` is run, against the operator
 * register on the machine that has one, and it *reports* drift:
 *
 *   node scripts/exec/register-citation-check.mjs
 *   node scripts/exec/register-citation-check.mjs --json
 *   node scripts/exec/register-citation-check.mjs --strict   # exit 1 on drift
 *
 * **The measurement that justified building it, taken 2026-09-24 against the
 * live register at 2322 lines:** 22 citations, **none of them resolving at the
 * line it cites**, 18 resolving uniquely four lines below it and the other four
 * unlocatable or ambiguous. A uniform `+4` is not rot; it is one write above the
 * body, and the register's head shows it — lines 3-7 are claim lines sitting
 * above the header prose that the file's own `Format:` section places first.
 * T-718 was filed as preventative on a hand measurement of seven citations that
 * all still resolved. Between that measurement and this one, every one of them
 * moved.
 *
 * ## Why the identifier is the citation and the comment is not
 *
 * Every fixture in the suite is written `const LIVE_<n> = "..."`, and the number
 * in the identifier is the line it claims. The prose comment above it says the
 * same number, in six different sentence shapes. Reading the identifier is one
 * rule that cannot go stale against a seventh shape; reading the prose is the
 * cue-table problem this directory already has two open items about.
 *
 * ## Why segments are scored individually
 *
 * A fixture is usually a concatenation, and the concatenation is frequently
 * **elided** — `"...opening clause" + "much later clause"` joins two spans that
 * are not adjacent in the register. Matching the joined string finds nothing and
 * would report a perfectly good citation as missing. So each literal segment is
 * probed separately and each register line scored by how many it contains.
 * Segments shorter than `MIN_SEGMENT_LENGTH` are dropped: `"T-709"` and `" — "`
 * match half the file and would make every score a tie.
 *
 * ## Why `unlocatable` is its own verdict
 *
 * Because the alternative is the only way this verifier could report green over
 * a drifted corpus. A probe that finds nothing has not verified anything, and
 * folding that into "resolves" would turn every heavily-elided fixture into a
 * silent pass. It is reported separately, counted separately, and refused by
 * `--strict`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isDirectInvocation, unknownFlags } from "./cli-entry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const RESOLVES = "resolves";
export const DRIFTED = "drifted";
export const AMBIGUOUS = "ambiguous";
export const UNLOCATABLE = "unlocatable";

/**
 * The shortest literal segment allowed to act as a probe.
 *
 * Below this an id (`T-709`), a separator (` — `) or a stock phrase matches
 * dozens of lines, every candidate ties, and every citation reads `ambiguous`.
 */
export const MIN_SEGMENT_LENGTH = 16;

export const DEFAULT_SUITE = path.join(HERE, "register-time-authority.test.mjs");
export const DEFAULT_REGISTER = path.join(process.env.HOME || "", "Downloads", "EXECUTION_CLAIMS.md");

const CITATION = /(?:const|let)\s+LIVE_(\d+)\s*=\s*([\s\S]*?);\n/g;
const LITERAL = /"((?:[^"\\]|\\.)*)"/g;

/**
 * Every `LIVE_<n>` fixture in `source`, with the line it cites and the literal
 * segments it quotes.
 *
 * A fixture built from anything other than string literals — a `.replace()` of
 * another fixture, a template — contributes no segments and is skipped rather
 * than guessed at: `LIVE_1792_AS_SUBJECT` is a derived form, not a second
 * transcription, and verifying it twice would double-count one citation.
 */
export function parseCitations(source) {
  const citations = [];
  CITATION.lastIndex = 0;
  let match;
  while ((match = CITATION.exec(source)) !== null) {
    const segments = [...match[2].matchAll(LITERAL)]
      .map((literal) => {
        try {
          return JSON.parse(`"${literal[1]}"`).trim();
        } catch {
          return "";
        }
      })
      .filter((segment) => segment.length >= MIN_SEGMENT_LENGTH);
    if (segments.length === 0) continue;
    citations.push({
      identifier: `LIVE_${match[1]}`,
      citedLine: Number(match[1]),
      suiteLine: source.slice(0, match.index).split("\n").length,
      segments,
    });
  }
  return citations;
}

/**
 * Where `citation`'s text actually sits in `registerLines`.
 *
 * The cited line wins any tie it is part of. Without that, a fixture quoting a
 * phrase the register repeats — and this register repeats a great many of them,
 * being written to a template — would be reported as drift while being exactly
 * right, which is the false positive that gets a verifier switched off.
 */
export function resolveCitation(citation, registerLines) {
  const scores = new Map();
  for (const segment of citation.segments) {
    for (let index = 0; index < registerLines.length; index += 1) {
      if (registerLines[index].includes(segment)) {
        const line = index + 1;
        scores.set(line, (scores.get(line) || 0) + 1);
      }
    }
  }

  const base = {
    identifier: citation.identifier,
    citedLine: citation.citedLine,
    suiteLine: citation.suiteLine,
    of: citation.segments.length,
  };

  if (scores.size === 0) {
    return { ...base, verdict: UNLOCATABLE, at: null, delta: null, matched: 0, candidates: [] };
  }

  const best = Math.max(...scores.values());
  const candidates = [...scores.entries()]
    .filter(([, count]) => count === best)
    .map(([line]) => line)
    .sort((a, b) => a - b);

  if (candidates.includes(citation.citedLine)) {
    return { ...base, verdict: RESOLVES, at: citation.citedLine, delta: 0, matched: best, candidates };
  }
  if (candidates.length === 1) {
    return { ...base, verdict: DRIFTED, at: candidates[0], delta: candidates[0] - citation.citedLine, matched: best, candidates };
  }
  return { ...base, verdict: AMBIGUOUS, at: null, delta: null, matched: best, candidates };
}

/**
 * The aggregate, whose most useful field is `uniformDelta`.
 *
 * One shared offset across every drifted citation says one write happened above
 * the body and the fix is arithmetic. Scattered offsets say the transcriptions
 * have been edited independently and each one needs reading. They are different
 * findings and the report should not make the reader derive which.
 */
export function summarise(results) {
  const counts = { [RESOLVES]: 0, [DRIFTED]: 0, [AMBIGUOUS]: 0, [UNLOCATABLE]: 0 };
  const deltaCounts = new Map();
  for (const result of results) {
    counts[result.verdict] = (counts[result.verdict] || 0) + 1;
    if (result.verdict === DRIFTED) deltaCounts.set(result.delta, (deltaCounts.get(result.delta) || 0) + 1);
  }
  const deltas = [...deltaCounts.entries()]
    .map(([delta, count]) => ({ delta, count }))
    .sort((a, b) => b.count - a.count || a.delta - b.delta);
  return {
    total: results.length,
    resolves: counts[RESOLVES],
    drifted: counts[DRIFTED],
    ambiguous: counts[AMBIGUOUS],
    unlocatable: counts[UNLOCATABLE],
    deltas,
    uniformDelta: deltas.length === 1 ? deltas[0].delta : null,
    // A verifier with nothing to read prints `0 drifted`, which reads exactly
    // like a clean corpus. It has to say which of the two it means.
    nothingToVerify: results.length === 0,
  };
}

export function formatReport(results, summary, { suite, register }) {
  const lines = [
    `register-citation-check: ${suite}`,
    `                  against ${register}`,
    "",
  ];
  if (summary.nothingToVerify) {
    lines.push("NOTHING TO VERIFY — no `LIVE_<n>` citation was parsed from the suite.");
    lines.push("This is not a clean result. Either the path is wrong or the fixture convention changed.");
    return lines.join("\n");
  }
  for (const result of results) {
    if (result.verdict === RESOLVES) {
      // A tie the cited line won is a weaker result than an outright match, and
      // printing it as a bare `ok` hides the strongest evidence against it. The
      // live corpus has exactly one of these: a 1-of-3 match whose other
      // candidate sits at the same uniform offset as every drifted citation.
      const rivals = result.candidates.filter((line) => line !== result.at);
      const tie = rivals.length > 0 ? ` — TIE-BREAK, matched equally at ${rivals.join(", ")}` : "";
      lines.push(`ok         ${result.identifier} resolves at register line ${result.at} (${result.matched}/${result.of} segments)${tie}`);
    } else if (result.verdict === DRIFTED) {
      const sign = result.delta >= 0 ? "+" : "";
      lines.push(`DRIFTED    ${result.identifier} quotes register line ${result.at}, not ${result.citedLine} (${sign}${result.delta}, ${result.matched}/${result.of} segments)`);
    } else if (result.verdict === AMBIGUOUS) {
      lines.push(`AMBIGUOUS  ${result.identifier} matches ${result.matched}/${result.of} segments equally at lines ${result.candidates.join(", ")}`);
    } else {
      lines.push(`UNLOCATABLE ${result.identifier} — none of its ${result.of} segments appears in the register (verified nothing)`);
    }
  }
  lines.push("");
  lines.push(
    `${summary.total} citations: ${summary.resolves} resolve, ${summary.drifted} drifted, ` +
    `${summary.ambiguous} ambiguous, ${summary.unlocatable} unlocatable`,
  );
  if (summary.uniformDelta !== null) {
    lines.push(
      `Every drifted citation is off by the same ${summary.uniformDelta >= 0 ? "+" : ""}${summary.uniformDelta}. ` +
      "One write above the register's body moves them all; look at the head of the file, not at the fixtures.",
    );
  } else if (summary.deltas.length > 1) {
    lines.push(`Deltas differ (${summary.deltas.map((d) => `${d.delta}×${d.count}`).join(", ")}) — read each citation, they did not move together.`);
  }
  return lines.join("\n");
}

function readArg(argv, flag, fallback) {
  const index = argv.indexOf(flag);
  return index >= 0 && index + 1 < argv.length ? argv[index + 1] : fallback;
}

export function main(argv) {
  const unknown = unknownFlags(argv, {
    value: ["--suite", "--register"],
    boolean: ["--json", "--strict"],
  });
  if (unknown.length > 0) {
    process.stdout.write(
      `register-citation-check: unrecognised flag ${unknown.join(", ")}. ` +
      "An unrecognised flag is parsed as nothing and the check you asked for would not run, " +
      "so this is refused rather than passed silently.\n",
    );
    return 2;
  }

  const suite = readArg(argv, "--suite", DEFAULT_SUITE);
  const register = readArg(argv, "--register", DEFAULT_REGISTER);

  if (!fs.existsSync(register)) {
    process.stderr.write(
      `register-citation-check: no register at ${register}. This verifier reads the operator register ` +
      "on a machine that has one; it is not a CI check and has nothing to say without it.\n",
    );
    return 2;
  }

  const source = fs.readFileSync(suite, "utf8");
  const registerLines = fs.readFileSync(register, "utf8").split("\n");
  const citations = parseCitations(source);
  const results = citations.map((citation) => resolveCitation(citation, registerLines));
  const summary = summarise(results);

  if (argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify({ suite, register, registerLines: registerLines.length, summary, results }, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatReport(results, summary, { suite, register })}\n`);
  }

  if (argv.includes("--strict")) {
    return summary.resolves === summary.total && summary.total > 0 ? 0 : 1;
  }
  return 0;
}

if (isDirectInvocation(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
