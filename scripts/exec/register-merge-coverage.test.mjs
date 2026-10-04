#!/usr/bin/env node
/**
 * Behavioural test for the merge-coverage detector (item C-556).
 *
 * The defect: a change merges to `main`, ships, and alters a product surface
 * while no register line names it. It then has no `merged` state, no `deployed`
 * state and no signed-in question, and every downstream reader of the register
 * is keyed to a line -- so nothing reports it as unfinished. The absence of a
 * row and the absence of work look identical.
 *
 * The acceptance is not "does something list the merges". It is the
 * DISCRIMINATION, and three pairs carry it:
 *
 *   a line ABOUT this merge's pull request     -> `named`
 *   this merge's SHA in another item's prose   -> `mentioned-only`
 *   the SHA and the number appear nowhere      -> `unnamed`
 *
 *   an eight-character abbreviation            -> still a mention
 *   a ten-character fixed-width probe          -> finds neither
 *
 *   the API answered "no pull requests"        -> `no-pull-request`
 *   the API was never asked                    -> `pull-request-unresolved`
 *
 * Every one of those pairs is a way this detector could pass while measuring
 * nothing. Collapsing the first pair upward reports an unaccounted merge as
 * accounted for -- the defect, inverted, in the silent direction. Collapsing the
 * last pair reports "could not ask, therefore fine", which is the unfailable
 * gate this directory exists against.
 *
 * NO NETWORK AND NO `git` IS CALLED BY THIS SUITE. Pull request lookups are
 * passed in as data and the one case that exercises `mergesIn` injects its git
 * runner, because a CI runner has no credential and `actions/checkout` is
 * shallow -- a case reading real commits would pass locally and be unreachable
 * here, which is the same "green because it never ran" shape.
 *
 * ## The live-corpus cases assert only what an append-only register cannot undo
 *
 * The register is append-only, so a merge that is named STAYS named and a merge
 * that is mentioned STAYS at least mentioned. Those two directions are asserted.
 * A merge that is `unnamed` today can be named tomorrow by someone writing the
 * line it is missing -- so this suite does NOT assert that any merge is unnamed.
 * A case that did would go red exactly when the corpus improved, which is a gate
 * inverted against its own purpose. Today's census belongs in the release
 * record, and it is there.
 *
 * Fixture SHAs are drawn from the `f0f0f0f0...`/`a1a1a1a1...` space, which no
 * real commit occupies, so no line of this file reads as a claim about a real
 * merge. The four real SHAs in the live-corpus section are transcribed with
 * their pull request numbers, both of which are immutable.
 *
 * Run:  node scripts/exec/register-merge-coverage.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  MENTIONED_ONLY,
  MIN_SHA_PREFIX,
  NAMED,
  NO_PR,
  PR_CLOSED_UNMERGED,
  PR_MERGED,
  PR_UNRESOLVED,
  UNNAMED,
  UNRESOLVED,
  coverage,
  entryRole,
  formatReport,
  mentionsSha,
  mergesIn,
  nameMerge,
  provenanceOf,
  shaClause,
  shaTokens,
  unreportable,
} from "./register-merge-coverage.mjs";
import { registerEntries } from "./signed-in-proof-reconcile.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "register-merge-coverage.mjs");

let passes = 0;
let failures = 0;
let skipped = 0;

function check(name, condition, detail) {
  if (condition) {
    passes += 1;
    console.log(`  PASS  ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${name}`);
  if (detail) console.log(`        ${String(detail).split("\n").join("\n        ")}`);
}

function skip(name, why) {
  skipped += 1;
  console.log(`  SKIP  ${name} — ${why}`);
}

function runCli(args, options = {}) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 60_000,
      maxBuffer: 16 * 1024 * 1024,
      ...options,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error.message),
    };
  }
}

/** A register built from `stamp | identity | message` triples. */
function register(lines) {
  return [
    "# Claims",
    "",
    "## Claim log — append only",
    "",
    ...lines.map(([stamp, identity, message]) => `${stamp} | ${identity} | ${message}`),
    "",
  ].join("\n");
}

const SHA_A = "f0f0f0f01111222233334444555566667777888";
const SHA_A_FULL = `${SHA_A}9`;
const SHA_B = "a1a1a1a1bbbbccccddddeeeeffff000011112222";

/* -------------------------------------------------------------------------- */
console.log("\nReading a SHA out of register prose");
/* -------------------------------------------------------------------------- */

check(
  "an EIGHT-character abbreviation is a mention, which is the live case a ten-character probe misses",
  mentionsSha("PR #8520 merged as f0f0f0f0; checks green", SHA_A_FULL),
  `tokens: ${JSON.stringify(shaTokens("PR #8520 merged as f0f0f0f0; checks green"))}`,
);

check(
  "the full forty characters is a mention",
  mentionsSha(`squash \`${SHA_A_FULL}\``, SHA_A_FULL),
);

check(
  "a token that is NOT a prefix of the SHA is not a mention",
  !mentionsSha(`squash \`${SHA_B}\``, SHA_A_FULL),
);

check(
  `a token shorter than MIN_SHA_PREFIX (${MIN_SHA_PREFIX}) is not a mention`,
  !mentionsSha("off main f0f0f0 before the rebase", SHA_A_FULL),
);

check(
  "a SHA shorter than the floor can never be matched, however the prose reads",
  !mentionsSha("off main f0f0f0", "f0f0f0"),
);

check(
  "the clause is returned rather than the whole line, because a register line is a page of prose",
  shaClause(
    "RELEASED item T-901 on branch b. PR #9001 merged as f0f0f0f0. Deploy verified.",
    SHA_A_FULL,
  ) === "PR #9001 merged as f0f0f0f0.",
  shaClause("RELEASED item T-901 on branch b. PR #9001 merged as f0f0f0f0. Deploy verified.", SHA_A_FULL),
);

/* -------------------------------------------------------------------------- */
console.log("\nProvenance is three answered states plus one unasked one");
/* -------------------------------------------------------------------------- */

check(
  "a pull request with a merged_at is pull-request-merged, and names that number",
  (() => {
    const p = provenanceOf([{ number: 9001, merged_at: "2026-09-26T19:09:12Z" }]);
    return p.provenance === PR_MERGED && p.pullRequest === 9001;
  })(),
);

check(
  "a commit whose only pull request is closed with a null merged_at is its OWN state",
  (() => {
    const p = provenanceOf([{ number: 9002, merged_at: null, state: "closed" }]);
    return p.provenance === PR_CLOSED_UNMERGED && p.pullRequest === 9002;
  })(),
  "this must be neither pull-request-merged nor no-pull-request: the API does not " +
    "say how the commit reached main, and folding it either way sends a reader " +
    "after the wrong thing",
);

check(
  "the API answering with no pull requests is no-pull-request",
  provenanceOf([]).provenance === NO_PR,
);

check(
  "NOT ASKING is not the same answer as none: a null lookup is pull-request-unresolved",
  provenanceOf(null).provenance === PR_UNRESOLVED,
  "a lookup that failed must never render as 'this commit has no pull request'",
);

check(
  "one merged pull request among several closed-unmerged ones wins, and it is the merged number",
  (() => {
    const p = provenanceOf([
      { number: 9003, merged_at: null },
      { number: 9004, merged_at: "2026-09-26T01:00:00Z" },
    ]);
    return p.provenance === PR_MERGED && p.pullRequest === 9004;
  })(),
);

/* -------------------------------------------------------------------------- */
console.log("\nThe discrimination: named, mentioned-only, unnamed");
/* -------------------------------------------------------------------------- */

const MERGE_A = {
  sha: SHA_A_FULL,
  subject: "fix(source): a change (#9001)",
  committedAt: "2026-09-26T18:00:00Z",
  pulls: [{ number: 9001, merged_at: "2026-09-26T18:05:00Z" }],
};

function verdictFor(lines, merge = MERGE_A) {
  return nameMerge({ merge, entries: registerEntries(register(lines)) });
}

check(
  "a release line whose SUBJECT pull request is this merge's names it",
  verdictFor([
    ["2026-09-26T18:20:00Z", "agent#r1", `RELEASED item T-901 on branch b — PR #9001 merged as f0f0f0f0.`],
  ]).verdict === NAMED,
);

check(
  "a line naming it by PULL REQUEST ONLY, with no SHA anywhere, still names it",
  verdictFor([
    ["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-901 on branch b — PR #9001 merged, CI green."],
  ]).verdict === NAMED,
  "this is the half that needs the API: without the pull request number resolved " +
    "from GitHub there is no handle on this line at all",
);

check(
  "this merge's SHA quoted as somebody else's BASE is mentioned-only, not named",
  verdictFor([
    [
      "2026-09-26T18:20:00Z",
      "agent#r1",
      "item T-902 claimed on branch b — Taking T-902, re-verified on current origin/main f0f0f0f0 before claiming.",
    ],
  ]).verdict === MENTIONED_ONLY,
);

check(
  "and the mentioned-only row carries the CLAUSE, so a human can settle it",
  (() => {
    const row = verdictFor([
      [
        "2026-09-26T18:20:00Z",
        "agent#r1",
        "item T-902 claimed on branch b — Taking T-902. Re-verified on current origin/main f0f0f0f0 before claiming.",
      ],
    ]);
    return (
      row.mentions.length === 1 &&
      row.mentions[0].clause === "Re-verified on current origin/main f0f0f0f0 before claiming."
    );
  })(),
  JSON.stringify(
    verdictFor([
      [
        "2026-09-26T18:20:00Z",
        "agent#r1",
        "item T-902 claimed on branch b — Taking T-902. Re-verified on current origin/main f0f0f0f0 before claiming.",
      ],
    ]).mentions,
  ),
);

check(
  "this merge's SHA on a line ABOUT ANOTHER pull request is mentioned-only",
  verdictFor([
    [
      "2026-09-26T18:20:00Z",
      "agent#r1",
      "RELEASED item T-903 on branch b — PR #9009 squash-merged as a1a1a1a1, branched off exact origin/main f0f0f0f0.",
    ],
  ]).verdict === MENTIONED_ONLY,
);

check(
  "another item's merge NARRATED IN MERGE GRAMMAR is mentioned-only, which is why a merge-clause marker cannot decide this",
  verdictFor([
    [
      "2026-09-26T18:20:00Z",
      "agent#r1",
      "RELEASED item T-904 on branch b — PRECISION NOTE. PR 9001 then squash-merged to main as f0f0f0f0, which is AFTER both of those reads.",
    ],
  ]).verdict === MENTIONED_ONLY,
  "the clause says 'squash-merged to main as <sha>' and the line is about T-904; " +
    "a reader keyed to that phrasing credits it and reports an unaccounted merge as accounted for",
);

check(
  "a register that names neither the SHA nor the number is unnamed",
  verdictFor([
    ["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-905 on branch b — PR #9099 merged as a1a1a1a1."],
  ]).verdict === UNNAMED,
);

check(
  "unnamed and mentioned-only are DIFFERENT verdicts over the same merge",
  (() => {
    const silent = verdictFor([
      ["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-905 — PR #9099 merged as a1a1a1a1."],
    ]).verdict;
    const mentioned = verdictFor([
      ["2026-09-26T18:20:00Z", "agent#r1", "item T-905 claimed on branch b — off origin/main f0f0f0f0."],
    ]).verdict;
    return silent === UNNAMED && mentioned === MENTIONED_ONLY && silent !== mentioned;
  })(),
);

/* -------------------------------------------------------------------------- */
console.log("\nA lookup that never happened is withheld, not answered");
/* -------------------------------------------------------------------------- */

check(
  "a merge with no pull request lookup and no SHA mention is UNRESOLVED, never unnamed",
  nameMerge({
    merge: { ...MERGE_A, pulls: null },
    entries: registerEntries(
      register([["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-905 — PR #9099 merged as a1a1a1a1."]]),
    ),
  }).verdict === UNRESOLVED,
  "without the number resolved, a merge whose line names only its pull request is " +
    "indistinguishable from one nothing mentions",
);

check(
  "a merge with no lookup whose SHA IS mentioned is still mentioned-only, because that half needs no API",
  nameMerge({
    merge: { ...MERGE_A, pulls: null },
    entries: registerEntries(
      register([["2026-09-26T18:20:00Z", "agent#r1", "item T-902 claimed on branch b — off origin/main f0f0f0f0."]]),
    ),
  }).verdict === MENTIONED_ONLY,
);

/* -------------------------------------------------------------------------- */
console.log("\nThe SHA-alone path exists only where there is no other handle");
/* -------------------------------------------------------------------------- */

const MERGE_NO_PR = { ...MERGE_A, subject: "a commit with no pull request", pulls: [] };

check(
  "a merge with NO pull request is named by an outcome line quoting its SHA",
  nameMerge({
    merge: MERGE_NO_PR,
    entries: registerEntries(
      register([["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-906 on branch b — merged as f0f0f0f0, CI green."]]),
    ),
  }).verdict === NAMED,
);

check(
  "the same SHA on a CLAIM line does not fire that path: a claim accounts for no merge",
  nameMerge({
    merge: MERGE_NO_PR,
    entries: registerEntries(
      register([["2026-09-26T18:20:00Z", "agent#r1", "item T-906 claimed on branch b — off origin/main f0f0f0f0."]]),
    ),
  }).verdict === MENTIONED_ONLY,
);

check(
  "a merge that HAS a pull request never reaches that path, on the identical line",
  nameMerge({
    merge: MERGE_A,
    entries: registerEntries(
      register([["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-906 on branch b — merged as f0f0f0f0, CI green."]]),
    ),
  }).verdict === MENTIONED_ONLY,
  "its handle is #9001 and this line is about no pull request, so positive " +
    "attribution fails and the fallback is fenced to the no-pull-request population",
);

/* -------------------------------------------------------------------------- */
console.log("\nWhether the naming line reports the merge is reported, not decided");
/* -------------------------------------------------------------------------- */

check(
  "a mid-flight line whose subject IS this pull request still names it",
  verdictFor([
    [
      "2026-09-26T18:20:00Z",
      "agent#r1",
      "RELEASED item T-907 on branch b — PR #9001 MID-FLIGHT, PR OPEN, NOT MERGED, head abc1234.",
    ],
  ]).verdict === NAMED,
);

check(
  "and it is flagged namedWithoutMergeReport, so the weaker attribution is visible",
  verdictFor([
    [
      "2026-09-26T18:20:00Z",
      "agent#r1",
      "RELEASED item T-907 on branch b — PR #9001 MID-FLIGHT, PR OPEN, NOT MERGED, head abc1234.",
    ],
  ]).namedWithoutMergeReport === true,
  "requiring a merge assertion for the verdict was built, measured over the live " +
    "window, and removed: it moved 12 ordinary release lines out of named",
);

check(
  "a line that does report the merge is NOT flagged",
  verdictFor([
    ["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-901 on branch b — PR #9001 merged as f0f0f0f0."],
  ]).namedWithoutMergeReport === false,
);

check(
  "when a mid-flight line and a release line both name it, the printed line is the one reporting the merge",
  (() => {
    const row = verdictFor([
      [
        "2026-09-26T18:20:00Z",
        "agent#r1",
        "RELEASED item T-907 on branch b — PR #9001 MID-FLIGHT, PR OPEN, NOT MERGED, head abc1234.",
      ],
      ["2026-09-26T18:40:00Z", "agent#r1", "RELEASED item T-907 on branch b — PR #9001 merged as f0f0f0f0."],
    ]);
    return (
      row.namingLine.stamp === "2026-09-26T18:40:00Z" &&
      row.namingLine.reportsMerged === true &&
      row.namedWithoutMergeReport === false
    );
  })(),
  "the register is append-only, so the earlier line is still on file; printing it " +
    "would hand a reader the weakest account of a merge that has a full one",
);

check(
  "a line carrying NO SHA at all is still read for whether it reports the merge, from the pull request reference",
  (() => {
    const reported = verdictFor([
      ["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-901 on branch b — PR #9001 MERGED, 36 checks green."],
    ]);
    const notReported = verdictFor([
      ["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-901 on branch b — PR #9001 NOT MERGED YET, checks running."],
    ]);
    return (
      reported.verdict === NAMED &&
      reported.namedWithoutMergeReport === false &&
      notReported.verdict === NAMED &&
      notReported.namedWithoutMergeReport === true
    );
  })(),
  "without the pull request reference there is no position to read the nearest merge " +
    "token from, and every SHA-less line would report as unannounced",
);

check(
  "entryRole answers null when an entry says nothing about the merge at all",
  entryRole({
    entry: { stamp: "s", identity: "i", text: "RELEASED item T-905 — PR #9099.", prs: new Set([9099]) },
    sha: SHA_A_FULL,
    pullRequest: 9001,
    provenance: PR_MERGED,
  }) === null,
);

/* -------------------------------------------------------------------------- */
console.log("\nCounts, and whether a run proves anything");
/* -------------------------------------------------------------------------- */

const MIXED = coverage({
  merges: [
    MERGE_A,
    { ...MERGE_A, sha: SHA_B, pulls: [{ number: 9099, merged_at: "2026-09-26T01:00:00Z" }] },
    { ...MERGE_A, sha: `${SHA_A.slice(0, 39)}c`, pulls: null },
  ],
  register: register([
    ["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-901 on branch b — PR #9001 merged as f0f0f0f0."],
  ]),
});

check(
  "every merge lands in exactly one naming bucket",
  Object.values(MIXED.counts).reduce((a, b) => a + b, 0) === MIXED.rows.length,
  JSON.stringify(MIXED.counts),
);

check(
  "every merge lands in exactly one provenance bucket",
  Object.values(MIXED.provenanceCounts).reduce((a, b) => a + b, 0) === MIXED.rows.length,
  JSON.stringify(MIXED.provenanceCounts),
);

check(
  "a run carrying an unresolved lookup is NOT a proof of silence",
  unreportable(MIXED).some((r) => r.includes("no pull request lookup")),
  JSON.stringify(unreportable(MIXED)),
);

check(
  "a register that parsed to zero entries is NOT a proof of silence either",
  unreportable(coverage({ merges: [MERGE_A], register: "# Claims\n\nno stamped lines here\n" })).some(
    (r) => r.includes("zero entries"),
  ),
);

check(
  "a fully resolved run over a real register is reportable",
  unreportable(
    coverage({
      merges: [MERGE_A],
      register: register([
        ["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-901 on branch b — PR #9001 merged as f0f0f0f0."],
      ]),
    }),
  ).length === 0,
);

check(
  "the report SAYS that an unnamed merge is a reported state rather than an absence of work",
  formatReport(MIXED).includes("REPORTED STATE"),
);

/* -------------------------------------------------------------------------- */
console.log("\nmergesIn reads git without interpreting it");
/* -------------------------------------------------------------------------- */

check(
  "mergesIn asks for first-parent commits in the window and parses the three fields",
  (() => {
    let seen = null;
    const rows = mergesIn({
      since: "2026-09-26T00:00:00Z",
      git: (args) => {
        seen = args;
        return [
          `${SHA_A_FULL}subject one (#9001)2026-09-26T18:00:00Z`,
          `${SHA_B}subject two (#9099)2026-09-26T17:00:00Z`,
          "",
        ].join("\n");
      },
    });
    return (
      seen.includes("--first-parent") &&
      seen.includes("--since=2026-09-26T00:00:00Z") &&
      seen.at(-1) === "origin/main" &&
      rows.length === 2 &&
      rows[0].sha === SHA_A_FULL &&
      rows[0].subject === "subject one (#9001)" &&
      rows[0].pulls === null
    );
  })(),
  "pulls must start null, not [], so an un-run lookup cannot read as 'no pull request'",
);

check(
  "a --base window is passed as a range, not as --since",
  (() => {
    let seen = null;
    mergesIn({
      base: "origin/main~40",
      git: (args) => {
        seen = args;
        return "";
      },
    });
    return seen.at(-1) === "origin/main~40..origin/main" && !seen.some((a) => a.startsWith("--since"));
  })(),
);

/* -------------------------------------------------------------------------- */
console.log("\nThe CLI refuses rather than answering quietly");
/* -------------------------------------------------------------------------- */

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "c556-"));
const registerFile = path.join(tmp, "register.md");
fs.writeFileSync(
  registerFile,
  register([["2026-09-26T18:20:00Z", "agent#r1", "RELEASED item T-901 on branch b — PR #9001 merged as f0f0f0f0."]]),
);

check(
  "an unrecognised flag is refused at exit 2 rather than parsed as nothing",
  (() => {
    const r = runCli(["--register", registerFile, "--since", "2026-09-26", "--strickt"]);
    return r.status === 2 && /Unrecognised flag/.test(r.stderr);
  })(),
);

check(
  "no window is refused: a run over all of history would resolve every commit against GitHub",
  runCli(["--register", registerFile]).status === 2,
);

check(
  "a register path that does not exist is refused, not treated as an empty register",
  runCli(["--register", path.join(tmp, "absent.md"), "--since", "2026-09-26"]).status === 2,
);

check(
  "a git failure refuses at exit 2 rather than reporting zero merges as a clean window",
  (() => {
    const r = runCli(["--register", registerFile, "--base", "HEAD", "--no-github", "--json", "--cwd", tmp]);
    return r.status === 2 && /git log failed/.test(r.stderr);
  })(),
);

check(
  "importing the module does not run the CLI",
  (() => {
    const r = execFileSync(
      process.execPath,
      ["-e", `import(${JSON.stringify(CLI)}).then(() => console.log("imported"))`],
      { encoding: "utf8" },
    );
    return r.trim() === "imported";
  })(),
);

/* -------------------------------------------------------------------------- */
console.log("\nA repository this suite builds itself, end to end");
/* -------------------------------------------------------------------------- */

{
  const repo = path.join(tmp, "repo");
  fs.mkdirSync(repo);
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: repo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "t",
        GIT_AUTHOR_EMAIL: "t@example.com",
        GIT_COMMITTER_NAME: "t",
        GIT_COMMITTER_EMAIL: "t@example.com",
      },
    });
  git("init", "-q", "-b", "main");
  fs.writeFileSync(path.join(repo, "a.txt"), "one\n");
  git("add", "a.txt");
  git("commit", "-q", "-m", "base commit");
  const base = git("rev-parse", "HEAD").trim();
  fs.writeFileSync(path.join(repo, "a.txt"), "two\n");
  git("commit", "-q", "-am", "a change nobody recorded (#9500)");
  const unnamedSha = git("rev-parse", "HEAD").trim();
  fs.writeFileSync(path.join(repo, "a.txt"), "three\n");
  git("commit", "-q", "-am", "a change the register names (#9501)");
  const namedSha = git("rev-parse", "HEAD").trim();

  const liveRegister = register([
    [
      "2026-09-26T18:20:00Z",
      "agent#r1",
      `RELEASED item T-908 on branch b — PR #9501 merged as ${namedSha.slice(0, 9)}, CI green.`,
    ],
  ]);
  const merges = mergesIn({ ref: "main", base, cwd: repo }).map((m) => ({
    ...m,
    pulls:
      m.sha === namedSha
        ? [{ number: 9501, merged_at: "2026-09-26T18:10:00Z" }]
        : [{ number: 9500, merged_at: "2026-09-26T17:10:00Z" }],
  }));
  const result = coverage({ merges, register: liveRegister });
  const byShort = Object.fromEntries(result.rows.map((r) => [r.sha, r.verdict]));

  check(
    "over a real two-commit range, the recorded merge is named and the unrecorded one is not",
    merges.length === 2 && byShort[namedSha] === NAMED && byShort[unnamedSha] === UNNAMED,
    `${merges.length} merges: ${JSON.stringify(byShort)}`,
  );

  check(
    "and a NINE-character abbreviation in the register is what carried the named half",
    mentionsSha(`merged as ${namedSha.slice(0, 9)}`, namedSha) &&
      !mentionsSha(`merged as ${namedSha.slice(0, 9)}`, unnamedSha),
  );

  const liveRegisterFile = path.join(tmp, "live-register.md");
  fs.writeFileSync(liveRegisterFile, liveRegister);

  check(
    "the real CLI over that repository emits parseable JSON carrying every bucket",
    (() => {
      const r = runCli([
        "--register",
        liveRegisterFile,
        "--base",
        base,
        "--ref",
        "main",
        "--cwd",
        repo,
        "--no-github",
        "--json",
      ]);
      if (r.status !== 0) return false;
      const parsed = JSON.parse(r.stdout);
      return (
        parsed.rows.length === 2 &&
        parsed.counts[UNRESOLVED] + parsed.counts[MENTIONED_ONLY] + parsed.counts[NAMED] === 2 &&
        parsed.provenanceCounts[PR_UNRESOLVED] === 2
      );
    })(),
  );

  check(
    "--strict refuses that same run at exit 2, because --no-github proves no silence",
    runCli([
      "--register",
      liveRegisterFile,
      "--base",
      base,
      "--ref",
      "main",
      "--cwd",
      repo,
      "--no-github",
      "--strict",
    ]).status === 2,
    "exit 2 is a refusal and exit 1 is a finding; a run that asked nothing must not " +
      "be able to produce a finding",
  );
}

/* -------------------------------------------------------------------------- */
console.log("\nThe live register — only what an append-only file cannot undo");
/* -------------------------------------------------------------------------- */

/*
 * The item lists nine merges as named by neither their SHA nor their pull
 * request. Re-verified through the register's own grammar, one of them IS named
 * and four more are mentioned. Those are the two directions an append-only
 * register can never reverse, and they are the only live assertions here: a case
 * asserting any merge is still UNNAMED would go red the day somebody writes the
 * line it is missing.
 */
const LIVE_REGISTER = path.join(process.env.HOME || "", "Downloads", "EXECUTION_CLAIMS.md");

/** Merge SHA -> pull request number. Both immutable; transcribed from GitHub. */
const LIVE_NAMED = { sha: "7f0056d1e889687f1af6b8d14b636b9745c9541e", pr: 8520 };
const LIVE_MENTIONED = [
  { sha: "fb7487bc0c3490a396db8fd46be483e5eccf7156", pr: 8529 },
  { sha: "42e1fbd9f48c1922b7aa469294527618b5e8ebd8", pr: 8484 },
  { sha: "66361b1130b99db9c62a0f92428dbdc71feda04d", pr: 8480 },
  { sha: "d0a4dbc68003310ffb3260a6a8c1ddec6f98ddb1", pr: 8478 },
];

if (!fs.existsSync(LIVE_REGISTER)) {
  skip("the live register names the one merge of the nine that it does name", "no operator register on this host");
  skip("the live register mentions four more of the nine, so none of them is unnamed", "no operator register on this host");
  skip("a fixed ten-character probe disagrees with this reader on the named one", "no operator register on this host");
} else {
  const entries = registerEntries(fs.readFileSync(LIVE_REGISTER, "utf8"));
  const verdict = ({ sha, pr }) =>
    nameMerge({
      merge: { sha, subject: null, committedAt: null, pulls: [{ number: pr, merged_at: "2026-09-26T00:00:00Z" }] },
      entries,
    }).verdict;

  check(
    "the live register names the one merge of the nine that it does name",
    verdict(LIVE_NAMED) === NAMED,
    `got ${verdict(LIVE_NAMED)} for ${LIVE_NAMED.sha.slice(0, 10)} / #${LIVE_NAMED.pr}`,
  );

  const stillUnnamed = LIVE_MENTIONED.filter((m) => verdict(m) === UNNAMED);
  check(
    "the live register mentions four more of the nine, so none of them is unnamed",
    stillUnnamed.length === 0,
    `reported unnamed: ${stillUnnamed.map((m) => m.sha.slice(0, 10)).join(" ")}`,
  );

  /*
   * RESTATED 2026-10-04 (item C-585). The old case asserted that a fixed
   * ten-character probe finds NO handle on this merge while the grammar still
   * resolves it to NAMED — `!raw.includes(sha.slice(0, 10)) && verdict ===
   * NAMED`. It was true when written, and it recorded why the item had listed
   * this merge as unnamed in the first place: the original investigation
   * grepped a short prefix and found nothing.
   *
   * It is now permanently false, and the half that broke was measured rather
   * than guessed. The grammar half still holds exactly — the verdict is NAMED.
   * The substring half does not: `7f0056d1e8` is present, and every occurrence
   * of it is PROSE ABOUT THIS CALIBRATION rather than anybody naming the merge.
   * At the moment C-585 was taken the register held it once, in a line reading
   * "7f0056d1e8 IS named -- the register says RELEASED item C-605 ... PR #8520
   * merged"; appending the claim line that recorded this very verdict took it
   * to three. At twelve characters the register still holds none, so no line
   * has ever quoted this SHA as a handle.
   *
   * That makes the old assertion self-falsifying: its corpus is the register,
   * agents narrate findings INTO the register, and narrating this case writes
   * its own needle into its own haystack. No threshold repairs that, and
   * picking a longer prefix because today it happens to be absent is the
   * rubber stamp this directory exists against.
   *
   * So this asserts the mechanism instead, which is what the absence was only
   * ever a proxy for. Commentary lines now match as naming roles for this
   * merge — my own claim line does, with `reportsMerged: false` — and the
   * reader is nonetheless right because `nameMerge` PREFERS a naming line that
   * announces the merge. That preference used to be unexercised here; the
   * decoys the old case guaranteed could not exist are what now exercise it.
   * The case keeps its teeth: a reader that stopped preferring the announcement
   * would settle this merge on a line that announces nothing.
   */
  const raw = fs.readFileSync(LIVE_REGISTER, "utf8");

  /*
   * Provenance is derived through `provenanceOf`, from the same `pulls` shape
   * the verdict above is built from, rather than named by a constant here. A
   * literal would be this case asserting its own premise.
   */
  const livePulls = [{ number: LIVE_NAMED.pr, merged_at: "2026-09-26T00:00:00Z" }];
  const liveMerge = {
    sha: LIVE_NAMED.sha,
    subject: null,
    committedAt: null,
    pulls: livePulls,
  };
  const { provenance: liveProvenance } = provenanceOf(livePulls);

  const namingRoles = entries
    .map((entry) =>
      entryRole({
        entry,
        sha: LIVE_NAMED.sha,
        pullRequest: LIVE_NAMED.pr,
        provenance: liveProvenance,
      }),
    )
    .filter((role) => role && role.role === NAMED);
  const announcing = namingRoles.filter((r) => r.reportsMerged);
  const decoys = namingRoles.filter((r) => !r.reportsMerged);

  check(
    "later commentary now matches as a naming role for that merge without announcing it",
    decoys.length > 0,
    "the old ten-character absence guaranteed these could not exist; they do, " +
      "because narrating this calibration writes the SHA into the register — " +
      `naming roles: ${namingRoles.length}, of which ${decoys.length} announce no merge`,
  );

  check(
    "and the reader still settles it on the line that announces the merge, not on a decoy",
    verdict(LIVE_NAMED) === NAMED &&
      announcing.length > 0 &&
      nameMerge({ merge: liveMerge, entries }).namingLine?.reportsMerged === true,
    `verdict ${verdict(LIVE_NAMED)}; announcing lines ${announcing.length}; ` +
      "if the chosen line no longer reports the merge, the preference in " +
      "nameMerge has stopped doing the work this case exists to prove",
  );

  check(
    "no register line quotes that SHA as a full forty-character handle",
    !raw.includes(LIVE_NAMED.sha),
    "the NAMED verdict is earned through the pull-request channel; the day a " +
      "line quotes the full SHA it is earned differently and this case should " +
      "be re-read rather than widened",
  );
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n${passes} passed, ${failures} failed, ${skipped} skipped`);
process.exitCode = failures > 0 ? 1 : 0;
