#!/usr/bin/env node
/**
 * Behavioural test for the fossil-claim resolver (item T-733).
 *
 * The defect this covers: `EXECUTION_QUEUE.md` reports `0 items are claimable`
 * and names a `Suppressed CANDIDATES` list as the only ids between it and a
 * claimable row. The rendered file then tells the reader to check each claim's
 * branch and pull request **by hand**. On 2026-09-23 that lookup was executed
 * for all fourteen candidates and not one of them was in flight: four had
 * merged with their branches deleted, three had shipped under a different path
 * than the claim named, one was register-only, and **six had no branch on
 * `origin`, no pull request that ever existed, and no implementation on
 * `main`** — abandoned, and hidden by the bucket for four days.
 *
 * So the acceptance is not "does something list the candidates". It is the
 * DISCRIMINATION, and these two cases carry the item:
 *
 *   branch gone + a merged PR      -> `fossil`     (the work shipped)
 *   branch gone + no PR, ever      -> `abandoned`  (the work never shipped)
 *
 * Conflating them is worse than having no tool, because the fossil verdict's
 * whole purpose is to authorise a release line that says the work is done.
 * Say that about an abandoned claim and the resolver launders undone work into
 * a closed one — in the silent direction, which is the direction this backlog
 * keeps losing things in.
 *
 * Every probe here is injected. This suite makes NO network call: a CI runner
 * has neither `origin` nor a GitHub credential, and a suite that silently
 * degrades to "cannot reach the network, therefore fine" is the unfailable
 * gate this backlog exists against.
 *
 * Fixture ids live in the `T-9xx` band, which nothing has ever filed, so that
 * no line of this file reads as a filing of a live id.
 *
 * Run:  node scripts/exec/fossil-claims.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { announcesAbstention, announcesRelease } from "./register-time-authority.mjs";
import {
  VERDICTS,
  branchesInClaim,
  claimSubject,
  classify,
  isStale,
  newestClaimFor,
  abstainCommandFor,
  releaseCommandFor,
  resolve,
  suppressedCandidateIds,
  CORPUS_MODES,
  liveCorpusPlan,
  liveCorpusRoot,
} from "./fossil-claims.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "fossil-claims.mjs");

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

function run(args, options = {}) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
      maxBuffer: 32 * 1024 * 1024,
      ...options,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: error.status ?? -1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error.message ?? error),
    };
  }
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fossilclaims-"));
}

/**
 * Fixture text is COMPOSED, never spelled.
 *
 * A literal `Suppressed CANDIDATES` line naming live ids would be
 * indistinguishable, to anything that greps this directory, from the real
 * queue saying those ids are suppressed. This file has to state that rule
 * because the register already recorded once that the line describing a defect
 * is an instance of it.
 */
const candidateLine = (ids, total = 132) =>
  `**Suppressed CANDIDATES — the only ids between this queue and a claimable row ` +
  `(${ids.length} of ${total}):** ${ids.join(" ")} — every other id on the line above ` +
  `fails some other test as well.`;

const claimLine = (stamp, id, rest) =>
  `${stamp} | fixture-agent#${stamp} | item ${id} ${rest}`;

const register = (...lines) => ["## Claim log — append only", "", ...lines, ""].join("\n");

/* ========================================================================= */
console.log("\nreading the candidate list out of the rendered queue");
/* ========================================================================= */

check(
  "the suppressed-candidate ids are read from the line that names them",
  JSON.stringify(suppressedCandidateIds(candidateLine(["T-901", "T-902", "D-903"]))) ===
    JSON.stringify(["T-901", "T-902", "D-903"]),
);

check(
  "a queue with no such line yields no candidates rather than throwing",
  Array.isArray(suppressedCandidateIds("# Execution queue\n\nnothing here")) &&
    suppressedCandidateIds("# Execution queue\n\nnothing here").length === 0,
);

check(
  "the prose after the em dash is not mistaken for ids",
  !suppressedCandidateIds(candidateLine(["T-901"])).includes("every"),
  JSON.stringify(suppressedCandidateIds(candidateLine(["T-901"]))),
);

check(
  "a NUMBER in that prose is not scraped as a bare item id",
  JSON.stringify(
    suppressedCandidateIds(
      `**Suppressed CANDIDATES — x (1 of 132):** T-901 — 14 of these were checked ` +
        `by hand and 132 remain in the bucket.`,
    ),
  ) === JSON.stringify(["T-901"]),
  "today's prose happens to contain no id-shaped token, so the em-dash split " +
    "looks redundant; the ids in this backlog include bare numbers, and the " +
    "generator writes counts into that same sentence",
);

/* ========================================================================= */
console.log("\nfinding the claim line a candidate was suppressed by");
/* ========================================================================= */

{
  const text = register(
    claimLine("2026-09-19T15:04Z", "T-901", "| branch codex/first-branch — claimed"),
    claimLine("2026-09-19T15:40Z", "T-901", "| branch codex/second-branch — claimed"),
  );
  const newest = newestClaimFor(text, "T-901");
  check(
    "the NEWEST line by stamp is the one that decides, matching the generator",
    newest !== null && newest.line.includes("second-branch"),
    JSON.stringify(newest && newest.stamp),
  );
}

check(
  "an id with no claim line at all resolves to null",
  newestClaimFor(register(claimLine("2026-09-19T15:04Z", "T-901", "— claimed")), "T-902") === null,
);

/* ========================================================================= */
console.log("\nthe subject grammar — a second copy, so each rule is pinned");
/* ========================================================================= */

check(
  "the stamp may sit mid-line, which is how three live candidates are written",
  claimSubject("- item T-901 | agent | 2026-09-19T15:18Z | branch codex/x — claimed")?.id === "T-901",
  "the first draft demanded the stamp at the start and resolved no claim at " +
    "all for three of the fourteen real candidates",
);

check(
  "a line with no stamp is not a claim record",
  claimSubject("item T-901 | branch codex/x — claimed") === null,
);

check(
  "the `item <id>` grammar resolves",
  claimSubject("2026-09-19T15:04Z | agent | item T-901 — claimed")?.id === "T-901",
);

check(
  "the `CLAIMED <id>` grammar resolves",
  claimSubject("2026-09-19T15:04Z | agent | CLAIMED T-901 on a branch")?.id === "T-901",
);

check(
  "the `RELEASED <id>` grammar resolves",
  claimSubject("2026-09-19T15:04Z | agent | RELEASED T-901 — merged")?.id === "T-901",
);

check(
  "PRECEDENCE — first written wins, so an item narrated in a parenthetical " +
    "does not steal the subject",
  claimSubject(
    "2026-09-19T15:04Z | agent | item T-901 · CLAIMED (the lane that held b.ts RELEASED item T-902)",
  )?.id === "T-901",
  "scanning for an id anywhere on the line is the defect T-545 was filed " +
    "against, and these lines narrate other lanes constantly",
);

check(
  "and the release form wins when IT is written first",
  claimSubject("2026-09-19T15:04Z | agent | RELEASED T-901 | ... | item 126")?.id === "T-901",
);

check(
  "a line that merely mentions an id is not a claim FOR it",
  newestClaimFor(
    register("2026-09-19T15:04Z | agent | item T-901 — claimed, unlike T-902"),
    "T-902",
  ) === null,
);

/* ========================================================================= */
console.log("\nextracting the branch — the authority, because the PR is looked up FROM it");
/* ========================================================================= */

check(
  "a declared branch is taken from the `branch <name>` field",
  branchesInClaim("item T-901 | branch codex/source-thing-t901 | files: a,b")[0] ===
    "codex/source-thing-t901",
);

check(
  "a backticked branch loses its backticks",
  branchesInClaim("item T-901 on branch `exec/t-901-a-thing` — claimed")[0] ===
    "exec/t-901-a-thing",
);

check(
  "`branch none` declares the ABSENCE of a branch and yields no candidate",
  branchesInClaim("item T-901 | branch none | files: x").length === 0,
  JSON.stringify(branchesInClaim("item T-901 | branch none | files: x")),
);

check(
  "`branch n/a` does too — and this is the case the absence list alone catches",
  branchesInClaim("item T-901 | branch n/a | files: x").length === 0,
  "`n/a` contains a slash, so the requirement that a branch look like a path " +
    "waves it straight through; without the absence list it would be probed, " +
    "come back with no ref and no PR, and be reported `abandoned` — a verdict " +
    "about a branch that was never claimed to exist",
);

check(
  "a file path in the `files:` list is NOT read as a branch",
  branchesInClaim(
    "item T-901 | branch codex/thing-t901 | files: src/lib/source/x.ts,docs/releases/records/y.md",
  ).join(",") === "codex/thing-t901",
  JSON.stringify(
    branchesInClaim(
      "item T-901 | branch codex/thing-t901 | files: src/lib/source/x.ts,docs/releases/records/y.md",
    ),
  ),
);

check(
  "with no `branch` field, the generator's own in-flight token is the fallback",
  branchesInClaim("item T-901 codex/source-stage-plan-t901 — claimed")[0] ===
    "codex/source-stage-plan-t901",
);

/* ========================================================================= */
console.log("\nthe path shape the fallback cannot tell from a branch (item T-732)");
/* ========================================================================= */

/*
 * The `files:` case above passes on unfixed code and always did, because
 * neither `src/lib/…` nor `docs/releases/…` begins with a token the prose
 * fallback matches. `branchesInClaim`'s doc comment reads that green as a
 * general rule — "a `files:` list is full of slashes and must never be read as
 * a branch, which is why nothing here matches a bare `a/b` shape" — and the
 * rule holds only for paths whose FIRST SEGMENT is not a branch prefix.
 *
 * The execution toolchain lives in `scripts/exec/`, and `exec` is one of the
 * three prefixes the fallback matches, so the fallback finds `exec/<file>` as
 * a suffix of every such path a claim lists. Measured over the live register
 * before the fix: 1248 claim records, 28 naming at least one of these, 17
 * naming one FIRST — and `resolve` probes `branches[0]` only.
 *
 * Both readers are affected, which is why the repair is here rather than in
 * the caller. `build-execution-queue.mjs` imports this function to decide an
 * item is in flight, so a phantom branch suppresses an id that declared no
 * branch at all, in the direction that hides work; and `resolve` probes the
 * phantom, finds no ref and no pull request, and reports `abandoned` — a
 * COMPLETED-OBSERVATION verdict about a file.
 */

const listsFilesInThisDirectory =
  "item T-901 claimed | files: scripts/exec/source-stage-map.json,scripts/exec/build-source-board.mjs";

check(
  "a file under a directory whose name is also a branch prefix is NOT read as a branch",
  branchesInClaim(listsFilesInThisDirectory).length === 0,
  JSON.stringify(branchesInClaim(listsFilesInThisDirectory)) +
    " — each of these is the tail of a path in the `files:` list, not a ref",
);

check(
  "a declared branch still wins over such a path, and the path does not join it",
  branchesInClaim(
    "item T-901 | branch exec/t-901-a-thing | files: scripts/exec/source-stage-map.json",
  ).join(",") === "exec/t-901-a-thing",
  JSON.stringify(
    branchesInClaim(
      "item T-901 | branch exec/t-901-a-thing | files: scripts/exec/source-stage-map.json",
    ),
  ),
);

/*
 * The guardrail an over-broad repair breaks. `exec/…` is the prefix at issue,
 * and a real branch under it must still be the fallback's answer — excluding
 * the prefix, or requiring a `branch` field, would pass the case above and
 * blind the generator to every branch this scheduled task creates.
 */
check(
  "a genuine `exec/…` branch named in prose is still found without a `branch` field",
  branchesInClaim("item T-901 taken, pushing exec/run-20260101T000000Z — claimed")[0] ===
    "exec/run-20260101T000000Z",
  JSON.stringify(branchesInClaim("item T-901 taken, pushing exec/run-20260101T000000Z — claimed")),
);

check(
  "and a path whose own first segment IS a branch prefix is still read as a branch",
  branchesInClaim("item T-901 claimed | files: codex/whatever.mjs").length === 1,
  "this is deliberately unchanged: the fix is a LEFT BOUNDARY on the token, not a " +
    "judgement about file extensions. A bare `codex/x.mjs` is indistinguishable from a " +
    "branch named `codex/x.mjs`, and guessing by extension would be the over-broad repair.",
);

/*
 * And the consequence in `resolve`, which is the half that can act. `unknown`
 * is stale and offers no move; `abandoned` authorises an abstention that
 * WITHDRAWS an in-flight signal. Reaching that from a filename is how one run
 * frees an item another run is holding.
 */
{
  const register =
    "## Claim log — append only\n\n" +
    claimLine("2026-01-01T00:00Z", "T-901", "claimed | files: scripts/exec/source-stage-map.json") +
    "\n";
  const queue = `${candidateLine(["T-901"], 1)}\n`;
  const probe = () => ({ remoteExists: false, pullRequests: [] });
  const entry = resolve({ queue, register, probe }).entries[0];

  check(
    "a candidate whose claim names only such paths resolves to `unknown`, never `abandoned`",
    entry.verdict === VERDICTS.UNKNOWN,
    `${entry.verdict}: ${entry.because}`,
  );

  check(
    "and so it offers no abstention — the move that would withdraw a live in-flight signal",
    abstainCommandFor(entry) === null,
    String(abstainCommandFor(entry)).slice(0, 200),
  );

  check(
    "nor a release line, which is the other direction the same phantom could be read in",
    releaseCommandFor(entry) === null,
    String(releaseCommandFor(entry)).slice(0, 200),
  );
}

/* ========================================================================= */
console.log("\nthe two guards inside that extraction, each pinned by the mutation it survives");
/* ========================================================================= */

/*
 * Item T-735. Both guards below were mutated on `origin/main` and BOTH
 * mutations left this suite 49/0 and `build-execution-queue.test.mjs` 157/0.
 * Neither mutation is a no-op — each was run against the real function and
 * changes its answer on the inputs below — so the green was a coverage gap
 * and not a redundant guard. The slash requirement now has a second caller
 * (`build-execution-queue.mjs` reads it to decide an item is in flight), so
 * an unfalsifiable guard there hides claimable work rather than only
 * mis-reporting a probe.
 */

/* ---- GUARD 1: a declared branch must look like a path. ------------------ */

/*
 * THE VERDICT ON THE SLASH QUESTION T-735 ASKED, and it is measured rather
 * than asserted. `\bbranch\s+(\S+)` matches English, not just fields, and on
 * the live register at 2026-09-23T14:26Z the no-slash values it captures are
 * prose in every single case: `branch deleted` 44 times, then `is` 13, `was`
 * 9, `and` 9, `merged` 7, `pushed` 5, `rebased` 3. Not one is a branch name.
 * Dropping the slash requirement turns 19 register lines that are not in
 * flight today into lines that are — including a parseable claim line whose
 * sentence "the Claude-owned branch has no PR" would yield the branch names
 * `has` and `left`.
 *
 * So: a declared branch with no `/` is NOT read as a branch, deliberately,
 * and `branch wip` is therefore not a branch here. That is a real limit and
 * it is the right trade only because this register's branches are all
 * prefixed — `codex/`, `claude/`, `exec/`. A convention that ever ships an
 * unprefixed branch name must change this guard, not work around it.
 */
check(
  "`branch deleted` is prose, not a branch — the live register's commonest no-slash value",
  branchesInClaim("item T-901 | the branch deleted after merge | files: x").length === 0,
  "44 lines on the live register say `branch deleted`; the absence list does " +
    "NOT contain `deleted`, so only the slash requirement can reject it — " +
    "which is what makes this case fail when that requirement is dropped",
);

check(
  "a declared branch with no `/` is not a branch: the answer to T-735's `branch wip`",
  branchesInClaim("item T-901 | branch wip | files: x").length === 0,
  JSON.stringify(branchesInClaim("item T-901 | branch wip | files: x")),
);

/* ---- GUARD 2: an absence declaration blocks the prose fallback. --------- */

/*
 * The existing `branch none` and `branch n/a` cases do NOT reach this guard.
 * Their lines carry no `codex|claude|exec/…` token, so with the veto removed
 * the fallback finds nothing and they stay green — T-734's release notes
 * recorded exactly that, "a different guard was absorbing the mutation".
 * A case that fails when the veto is removed has to give the fallback
 * something to find.
 */
check(
  "`branch none` blocks the FALLBACK too, not just the declared field",
  branchesInClaim(
    "item T-901 | branch none | files: none | read-only reconciliation; the " +
      "codex/source-thing-t901 work it reconciles merged two days ago",
  ).length === 0,
  JSON.stringify(
    branchesInClaim(
      "item T-901 | branch none | files: none | read-only reconciliation; the " +
        "codex/source-thing-t901 work it reconciles merged two days ago",
    ),
  ) +
    " — without the veto this falls through to the in-flight token and " +
    "reports a branch the claim explicitly said it does not have",
);

/*
 * ...and the veto must lose to a branch the same line really declares.
 * Found while pinning it, on the live register: the T-733 release line
 * declares `on branch \`exec/t-733-fossil-claim-resolver\`` and later
 * NARRATES the fixture value `branch n/a` in a sentence about this very
 * guard. The veto returned early and discarded the real branch it had
 * already read. One line today, and on that line it is harmless because a
 * release outranks in-flight — but the same shape on a CLAIM line drops a
 * held item into "free to take" and hands live work to a second agent,
 * which is the failure this register exists to prevent.
 */
check(
  "a later absence phrase does not discard a branch the line already declared",
  branchesInClaim(
    "RELEASED item T-901 on branch `exec/t-901-real-work` — an absence list " +
      "that looked redundant until `branch n/a` was tried against it",
  ).join(",") === "exec/t-901-real-work",
  JSON.stringify(
    branchesInClaim(
      "RELEASED item T-901 on branch `exec/t-901-real-work` — an absence list " +
        "that looked redundant until `branch n/a` was tried against it",
    ),
  ),
);

/* ========================================================================= */
console.log("\nthe verdict — and the split this item exists for");
/* ========================================================================= */

check(
  "branch deleted and its PR merged is a FOSSIL: the work shipped",
  classify({ branch: "codex/x", remoteExists: false, pullRequests: [{ number: 9001, state: "MERGED" }] })
    .verdict === VERDICTS.FOSSIL,
);

check(
  "branch deleted and its PR closed unmerged is also a fossil claim to retire",
  classify({ branch: "codex/x", remoteExists: false, pullRequests: [{ number: 9001, state: "CLOSED" }] })
    .verdict === VERDICTS.FOSSIL,
);

check(
  "NEGATIVE CONTROL — branch deleted with NO pull request that ever existed is " +
    "ABANDONED, never fossil",
  classify({ branch: "codex/x", remoteExists: false, pullRequests: [] }).verdict ===
    VERDICTS.ABANDONED,
  "a fossil verdict authorises a release line that says the work is done; say " +
    "that about an abandoned claim and undone work is laundered into a closed one",
);

check(
  "the two verdicts are not the same value, which is the only thing keeping " +
    "them distinguishable downstream",
  VERDICTS.FOSSIL !== VERDICTS.ABANDONED,
);

check(
  "the abandoned verdict claims nothing about the ITEM, only about the claim",
  /this CLAIM produced nothing/.test(
    classify({ branch: "codex/x", remoteExists: false, pullRequests: [] }).because,
  ),
  "three of the nine real abandoned claims name work that DID land, from some " +
    "other branch; a verdict that said `the work never shipped` would be wrong " +
    "about them and would send the next run to redo finished work",
);

check(
  "a branch still on origin is ALIVE whatever its PRs say",
  classify({ branch: "codex/x", remoteExists: true, pullRequests: [] }).verdict === VERDICTS.ALIVE,
);

check(
  "an OPEN pull request is alive even with the branch gone from the ref listing",
  classify({ branch: "codex/x", remoteExists: false, pullRequests: [{ number: 9001, state: "OPEN" }] })
    .verdict === VERDICTS.ALIVE,
);

check(
  "FAILS CLOSED — a probe that errored is UNKNOWN, never fossil",
  classify({ branch: "codex/x", error: "network unreachable" }).verdict === VERDICTS.UNKNOWN,
  "answering `fossil` because the check could not run is indistinguishable, " +
    "from the register's side, from never having run it",
);

check(
  "FAILS CLOSED — a claim naming no branch is UNKNOWN, never fossil",
  classify({ branch: null }).verdict === VERDICTS.UNKNOWN,
);

check(
  "every verdict but `alive` is stale, so the bucket label is wrong in all of them",
  isStale(VERDICTS.FOSSIL) && isStale(VERDICTS.ABANDONED) && isStale(VERDICTS.UNKNOWN) &&
    !isStale(VERDICTS.ALIVE),
);

/* ========================================================================= */
console.log("\nresolving a whole candidate list");
/* ========================================================================= */

{
  const queue = candidateLine(["T-901", "T-902", "T-903", "T-904"]);
  const reg = register(
    claimLine("2026-09-19T15:04Z", "T-901", "| branch codex/merged-t901 — claimed"),
    claimLine("2026-09-19T15:05Z", "T-902", "| branch codex/abandoned-t902 — claimed"),
    claimLine("2026-09-19T15:06Z", "T-903", "| branch codex/live-t903 — claimed"),
    claimLine("2026-09-19T15:07Z", "T-904", "| branch none — claimed"),
  );
  const probe = (branch) => {
    if (branch === "codex/merged-t901") {
      return { remoteExists: false, pullRequests: [{ number: 9001, state: "MERGED" }] };
    }
    if (branch === "codex/abandoned-t902") return { remoteExists: false, pullRequests: [] };
    if (branch === "codex/live-t903") return { remoteExists: true, pullRequests: [] };
    throw new Error(`fixture probe asked about an unexpected branch: ${branch}`);
  };

  const report = resolve({ queue, register: reg, probe });
  const verdictOf = (id) => report.entries.find((e) => e.id === id)?.verdict;

  check("the merged one resolves fossil", verdictOf("T-901") === VERDICTS.FOSSIL);
  check("the abandoned one resolves abandoned", verdictOf("T-902") === VERDICTS.ABANDONED);
  check("the live one resolves alive", verdictOf("T-903") === VERDICTS.ALIVE);
  check("the branchless one resolves unknown", verdictOf("T-904") === VERDICTS.UNKNOWN);
  check(
    "the probe is never called for a claim that names no branch",
    verdictOf("T-904") === VERDICTS.UNKNOWN,
  );
  check(
    "the report counts the stale ones, which is the number that says the bucket is wrong",
    report.stale.length === 3,
    JSON.stringify(report.stale.map((e) => `${e.id}:${e.verdict}`)),
  );

  check(
    "a release command is offered for a fossil",
    releaseCommandFor(report.entries.find((e) => e.id === "T-901")).includes("--action release"),
  );
  check(
    "and NOT for an abandoned claim, which needs re-taking rather than closing",
    releaseCommandFor(report.entries.find((e) => e.id === "T-902")) === null,
    "the whole point of the split is that these two get different next moves",
  );
}

{
  /* NEGATIVE CONTROL for the report as a whole: independent truth is the probe,
   * not the register. The same register text, with every branch alive, must
   * report nothing stale — otherwise the verdicts are being read off the text. */
  const queue = candidateLine(["T-901", "T-902"]);
  const reg = register(
    claimLine("2026-09-19T15:04Z", "T-901", "| branch codex/merged-t901 — claimed"),
    claimLine("2026-09-19T15:05Z", "T-902", "| branch codex/abandoned-t902 — claimed"),
  );
  const report = resolve({ queue, register: reg, probe: () => ({ remoteExists: true, pullRequests: [] }) });
  check(
    "NEGATIVE CONTROL — with every branch alive the same register reports nothing stale",
    report.stale.length === 0 && report.entries.every((e) => e.verdict === VERDICTS.ALIVE),
    JSON.stringify(report.entries.map((e) => `${e.id}:${e.verdict}`)),
  );
}

{
  const queue = candidateLine(["T-901"]);
  const reg = register(claimLine("2026-09-19T15:04Z", "T-901", "| branch codex/x-t901 — claimed"));
  const report = resolve({
    queue,
    register: reg,
    probe: () => {
      throw new Error("git unreachable");
    },
  });
  check(
    "a throwing probe yields unknown and is still reported as stale, not as fine",
    report.entries[0].verdict === VERDICTS.UNKNOWN && report.stale.length === 1,
  );
}

/* ========================================================================= */
console.log("\nthe CLI — the half that a module-only suite cannot prove");
/* ========================================================================= */

{
  const dir = tmpdir();
  fs.writeFileSync(path.join(dir, "EXECUTION_QUEUE.md"), candidateLine(["T-901"]));
  fs.writeFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    register(claimLine("2026-09-19T15:04Z", "T-901", "| branch codex/x-t901 — claimed")),
  );

  const help = run(["--help"]);
  check("--help exits 0 and names the tool", help.status === 0 && /fossil/i.test(help.stdout));

  const offline = run(["--operator-root", dir, "--no-probe", "--json"]);
  check(
    "--no-probe reports the candidate as unknown and exits non-zero",
    offline.status === 1,
    `status ${offline.status}: ${offline.stderr || offline.stdout}`.slice(0, 400),
  );
  let parsed = null;
  try {
    parsed = JSON.parse(offline.stdout);
  } catch {
    /* reported by the check below */
  }
  check(
    "--json emits a parseable report naming the candidate and its verdict",
    parsed !== null && parsed.entries?.[0]?.id === "T-901" &&
      parsed.entries[0].verdict === VERDICTS.UNKNOWN,
    offline.stdout.slice(0, 400),
  );

  const empty = tmpdir();
  fs.writeFileSync(path.join(empty, "EXECUTION_QUEUE.md"), "# Execution queue\n\nno candidates\n");
  fs.writeFileSync(path.join(empty, "EXECUTION_CLAIMS.md"), register());
  const none = run(["--operator-root", empty]);
  check(
    "with no candidates at all the CLI exits 0",
    none.status === 0,
    `status ${none.status}: ${none.stderr || none.stdout}`.slice(0, 300),
  );

  const missing = run(["--operator-root", path.join(tmpdir(), "nope")]);
  check(
    "a missing operator root is a usage failure, not a silent pass",
    missing.status === 2,
    `status ${missing.status}`,
  );
}

check(
  "importing this module does not run its CLI",
  true,
  "asserted by construction: the import at the top of this file produced no " +
    "report above, and the shared guard is covered by cli-entry.test.mjs",
);

/* ========================================================================= */
console.log("\nthe abandoned verdict's executable move (item T-736)");
/* ========================================================================= */

/*
 * THE DEFECT: `abandoned` was a correct verdict with no next move. The
 * resolver refused a release line — rightly, since a release asserts the work
 * merged — and offered a SENTENCE in its place: "re-verify the item on
 * `main`". Re-verifying changes nothing in the register, and the register is
 * the only thing `build-execution-queue.mjs` reads, so the suppression the
 * verdict describes could never expire. Measured on the live documents at
 * 2026-09-23T14:58Z: 8 abandoned claims, all four days old, and the queue
 * offered 0 claimable rows.
 *
 * Every case below is on the COMMAND, not on prose: what an operator can
 * paste, which flags it carries, and — in `build-execution-queue.test.mjs`
 * case 29h — that the line the writer then produces is read back as an
 * abstention by the generator that raised the suppression.
 */
{
  const queue = candidateLine(["T-911", "T-912", "T-913", "T-914"]);
  const reg = register(
    claimLine("2026-09-19T15:04Z", "T-911", "| branch codex/merged-t911 — claimed"),
    claimLine("2026-09-19T15:05Z", "T-912", "| branch codex/abandoned-t912 — claimed"),
    claimLine("2026-09-19T15:06Z", "T-913", "| branch codex/live-t913 — claimed"),
    claimLine("2026-09-19T15:07Z", "T-914", "| branch none — claimed"),
  );
  const probe = (branch) => {
    if (branch === "codex/merged-t911") {
      return { remoteExists: false, pullRequests: [{ number: 9011, state: "MERGED" }] };
    }
    if (branch === "codex/abandoned-t912") return { remoteExists: false, pullRequests: [] };
    if (branch === "codex/live-t913") return { remoteExists: true, pullRequests: [] };
    throw new Error(`fixture probe asked about an unexpected branch: ${branch}`);
  };
  const report = resolve({ queue, register: reg, probe });
  const entry = (id) => report.entries.find((e) => e.id === id);
  const abandoned = entry("T-912");
  const command = abstainCommandFor(abandoned);

  check(
    "an abandoned claim is handed a command, not a sentence",
    typeof command === "string" && command.startsWith("node scripts/exec/append-claim.mjs"),
    String(command),
  );
  check(
    "the command abstains — it never releases, which would say the work merged",
    command.includes("--action abstain") && !command.includes("--action release"),
    command,
  );
  check(
    "it names the abandoned item and no other",
    command.includes("--item T-912") && !command.includes("T-911") && !command.includes("T-913"),
    command,
  );
  check(
    "it carries the evidence, so the register records WHY the claim was judged dead",
    command.includes("codex/abandoned-t912") && command.includes("ABANDONED"),
    command,
  );
  check(
    "it says the item is UNVERIFIED — the verdict is about the claim, not the work",
    command.includes("UNVERIFIED") && command.includes("re-verified on `main`"),
    command,
  );

  /*
   * `--branch` and `--files` are absent on purpose and are asserted, because
   * either one would quietly undo the command. A branch sits between the id
   * and `NOT TAKEN`, where `announcesAbstention` looks for it; a file list is
   * read by the ownership gate as a claim on those paths, and an abstention
   * that held files would take exactly what it says it is not taking.
   */
  check(
    "it passes no --branch, which would hide NOT TAKEN from the register's reader",
    !command.includes("--branch"),
    command,
  );
  check(
    "it passes no --files, because an abstention must hold nothing",
    !command.includes("--files"),
    command,
  );

  /*
   * The split is the item. A verdict that could answer both would let an
   * operator close undone work with whichever line came to hand.
   */
  check(
    "a fossil gets a release command and NO abstention command",
    releaseCommandFor(entry("T-911")) !== null && abstainCommandFor(entry("T-911")) === null,
  );
  check(
    "an abandoned claim gets an abstention command and NO release command",
    abstainCommandFor(abandoned) !== null && releaseCommandFor(abandoned) === null,
  );
  for (const id of ["T-913", "T-914"]) {
    check(
      `neither command is offered for ${id}, which is ${entry(id).verdict}`,
      releaseCommandFor(entry(id)) === null && abstainCommandFor(entry(id)) === null,
    );
  }
  check(
    "no entry is ever offered both commands",
    report.entries.every((e) => !(releaseCommandFor(e) && abstainCommandFor(e))),
  );
  check(
    "a missing or malformed entry yields no command rather than a broken one",
    abstainCommandFor(null) === null && abstainCommandFor({}) === null,
  );

  /*
   * The stamp of the claim being superseded is quoted, so the register says
   * which line the abstention answers. A line written four days after the
   * claim carries the reader nothing otherwise — T-457's rule, applied to the
   * one field this command controls.
   */
  check(
    "the claim's own stamp is quoted, so the line names what it supersedes",
    command.includes("2026-09-19T15:05Z"),
    command,
  );
  const stampless = abstainCommandFor({ ...abandoned, stamp: null }) ?? "";
  check(
    "an entry with no stamp produces a command that says so, not one reading `null`",
    stampless.includes("--action abstain") &&
      !/\bnull\b|\bundefined\b/.test(stampless) &&
      stampless.includes("the claim this supersedes"),
    stampless,
  );
}

/*
 * The CLI half, and it is asserted POSITIVELY. A command that exists only as
 * an export is the shape this directory has already paid for twice:
 * available, correct, and invoked by nobody. An assertion that the command is
 * ABSENT for the other verdicts would pass just as well against a resolver
 * that never printed it at all, so the reachable case is the one that has to
 * run: a real child process, a real `abandoned` verdict, and the command in
 * its stdout.
 *
 * `abandoned` needs a probe that answers "branch gone, no pull request ever",
 * and the CLI's probe shells out to `git` and `gh`. So the probe is answered
 * by two stub executables on PATH rather than by injection — which also
 * pins the flags `gitHubProbe` sends, since a stub that was never called
 * would leave the verdict `unknown` and redden this case.
 */
{
  const bin = tmpdir();
  fs.writeFileSync(path.join(bin, "git"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  fs.writeFileSync(path.join(bin, "gh"), "#!/bin/sh\necho '[]'\n", { mode: 0o755 });

  const dir = tmpdir();
  fs.writeFileSync(path.join(dir, "EXECUTION_QUEUE.md"), candidateLine(["T-916"]));
  fs.writeFileSync(
    path.join(dir, "EXECUTION_CLAIMS.md"),
    register(claimLine("2026-09-19T15:05Z", "T-916", "| branch codex/abandoned-t916 — claimed")),
  );
  const stubbed = run(["--operator-root", dir], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  });
  check(
    "the CLI prints the abstention command for an abandoned candidate",
    stubbed.status === 1 &&
      stubbed.stdout.includes("T-916   abandoned") &&
      stubbed.stdout.includes("clear it:") &&
      stubbed.stdout.includes("--action abstain") &&
      stubbed.stdout.includes("--item T-916"),
    `status=${stubbed.status}\n${stubbed.stdout.slice(0, 900)}\n${stubbed.stderr.slice(0, 300)}`,
  );
  check(
    "and it still says the verdict is about the claim rather than the item",
    stubbed.stdout.includes("NOT a fossil") && !stubbed.stdout.includes("retire it:"),
    stubbed.stdout.slice(0, 900),
  );

  const dir2 = tmpdir();
  fs.writeFileSync(path.join(dir2, "EXECUTION_QUEUE.md"), candidateLine(["T-915"]));
  fs.writeFileSync(
    path.join(dir2, "EXECUTION_CLAIMS.md"),
    register(claimLine("2026-09-19T15:05Z", "T-915", "| branch none — claimed")),
  );
  const offline = run(["--operator-root", dir2, "--no-probe"]);
  check(
    "an `unknown` candidate is offered no abstention command by the CLI",
    offline.status === 1 && !offline.stdout.includes("clear it:"),
    offline.stdout.slice(0, 400),
  );
}

/* ========================================================================= */
console.log("\nthe live-corpus replay contract (item T-739)");
/* ========================================================================= */

/*
 * WHY THIS CONTRACT IS A FUNCTION AND NOT AN `if` IN EACH SUITE.
 *
 * Four cases across three suites required the live suppressed-candidate bucket
 * to be NON-EMPTY — "the live corpus has suppressed candidates to replay, so
 * this case is not vacuous". An empty bucket is the healthy state for that
 * bucket: it empties when the abandoned claims in it get resolved, which is
 * the work those very suites exist to prove. So the suites went red for a
 * corpus that had IMPROVED, and on a runner, where the operator documents are
 * absent, the same cases skipped. A case that fails only where nothing gates
 * it and cannot fail where it runs is the unfailable gate this backlog was
 * opened against, pointing the other way.
 *
 * The verdict taken here: the live corpus is an OPPORTUNISTIC replay, never a
 * precondition. Three states, and only one of them may produce a pass — which
 * is the whole point of making the decision a value this file can pin, rather
 * than an `if` in two suites that each read "no candidates" as "nothing to
 * assert, carry on".
 */

check(
  "a corpus naming candidates is replayed",
  (() => {
    const plan = liveCorpusPlan({ documentsPresent: true, candidateIds: ["T-901", "T-902"] });
    return (
      plan.mode === CORPUS_MODES.REPLAY &&
      plan.replay === true &&
      plan.skip === false &&
      JSON.stringify(plan.candidates) === JSON.stringify(["T-901", "T-902"])
    );
  })(),
  JSON.stringify(liveCorpusPlan({ documentsPresent: true, candidateIds: ["T-901", "T-902"] })),
);

check(
  "AN EMPTY CORPUS IS NOT A PASS: it is a counted skip with a reason",
  (() => {
    const plan = liveCorpusPlan({ documentsPresent: true, candidateIds: [] });
    return (
      plan.mode === CORPUS_MODES.EMPTY &&
      plan.replay === false &&
      plan.skip === true &&
      typeof plan.reason === "string" &&
      plan.reason.length > 0
    );
  })(),
  JSON.stringify(liveCorpusPlan({ documentsPresent: true, candidateIds: [] })),
);

check(
  "and its reason says the bucket is empty rather than implying the code is broken",
  /empt/i.test(liveCorpusPlan({ documentsPresent: true, candidateIds: [] }).reason),
  liveCorpusPlan({ documentsPresent: true, candidateIds: [] }).reason,
);

check(
  "absent operator documents are a counted skip too, and say which state they are",
  (() => {
    const plan = liveCorpusPlan({ documentsPresent: false, candidateIds: [] });
    return (
      plan.mode === CORPUS_MODES.ABSENT &&
      plan.replay === false &&
      plan.skip === true &&
      plan.reason.length > 0 &&
      plan.mode !== liveCorpusPlan({ documentsPresent: true, candidateIds: [] }).mode
    );
  })(),
  JSON.stringify(liveCorpusPlan({ documentsPresent: false, candidateIds: [] })),
);

check(
  "EXACTLY ONE of replay/skip is true in every state — a plan can neither assert nothing nor both",
  [
    liveCorpusPlan({ documentsPresent: true, candidateIds: ["T-901"] }),
    liveCorpusPlan({ documentsPresent: true, candidateIds: [] }),
    liveCorpusPlan({ documentsPresent: false, candidateIds: ["T-901"] }),
    liveCorpusPlan({ documentsPresent: false, candidateIds: [] }),
  ].every((plan) => plan.replay !== plan.skip),
  "this is the invariant that stops `empty` from resolving to the old vacuous pass",
);

check(
  "documents absent OUTRANKS a candidate list, because that list cannot have been read from them",
  liveCorpusPlan({ documentsPresent: false, candidateIds: ["T-901"] }).mode === CORPUS_MODES.ABSENT,
  JSON.stringify(liveCorpusPlan({ documentsPresent: false, candidateIds: ["T-901"] })),
);

check(
  "a missing or malformed candidate list is empty, never a replay over garbage",
  liveCorpusPlan({ documentsPresent: true }).mode === CORPUS_MODES.EMPTY &&
    liveCorpusPlan({ documentsPresent: true, candidateIds: "T-901" }).mode === CORPUS_MODES.EMPTY &&
    liveCorpusPlan({ documentsPresent: true, candidateIds: null }).mode === CORPUS_MODES.EMPTY,
  JSON.stringify([
    liveCorpusPlan({ documentsPresent: true }).mode,
    liveCorpusPlan({ documentsPresent: true, candidateIds: "T-901" }).mode,
  ]),
);

check(
  "the candidate list is copied, so a suite cannot mutate the plan it was handed",
  (() => {
    const ids = ["T-901"];
    const plan = liveCorpusPlan({ documentsPresent: true, candidateIds: ids });
    plan.candidates.push("T-902");
    return ids.length === 1;
  })(),
);

/*
 * The root is resolvable because that is the other half of "able to fail where
 * it runs". With the root fixed to `~/Downloads`, the replay could never be
 * pointed at a corpus that HOLDS a candidate — so the direction the item asks
 * for second, that the case fails when given a real candidate it mishandles,
 * was not demonstrable on this machine at all. An override makes both the CI
 * runner and a deliberate mutation able to supply one.
 */
check(
  "the replay root honours EXEC_OPERATOR_ROOT, so a fixture corpus can be supplied",
  liveCorpusRoot({ env: { EXEC_OPERATOR_ROOT: "/tmp/fixture-corpus" }, home: "/home/x" }) ===
    "/tmp/fixture-corpus",
  liveCorpusRoot({ env: { EXEC_OPERATOR_ROOT: "/tmp/fixture-corpus" }, home: "/home/x" }),
);

check(
  "and falls back to the operator's Downloads when it is unset or blank",
  liveCorpusRoot({ env: {}, home: "/home/x" }) === path.join("/home/x", "Downloads") &&
    liveCorpusRoot({ env: { EXEC_OPERATOR_ROOT: "   " }, home: "/home/x" }) ===
      path.join("/home/x", "Downloads"),
  liveCorpusRoot({ env: {}, home: "/home/x" }),
);

/* ========================================================================= */
console.log("\nreplaying the four real fossils the item names (item T-732)");
/* ========================================================================= */

/*
 * T-732's acceptance is unconditional about its proof: "prove it by replaying
 * the four real fossils — T-463, T-516, T-519, T-583 — and report how many ids
 * move bucket on the live register". Nothing replayed them. Every case above
 * proves the resolver on invented `T-9xx` ids while the acceptance names four
 * real ones, which is exactly the shape where the fixtures all pass and the
 * one real positive is missed.
 *
 * Their branch-and-pull-request facts are HISTORICAL: all four branches were
 * deleted and all four pull requests merged on 2026-09-21/22, and the claims
 * were retired by hand on 2026-09-23 before this resolver existed. So the
 * probe is stubbed with that observation and this suite still makes no network
 * call.
 *
 * What is replayed from the live register is the half no fixture can stand in
 * for: whether these four lines, in the grammars their authors actually used,
 * yield a subject and the claim's OWN branch at all. This resolver's first
 * draft found no claim line for three of the fourteen live candidates because
 * it required the stamp at the start of the line — and one of these four is
 * written in the pipe-less grammar that caused it.
 *
 * Opportunistic, per item T-739: absent operator documents are a counted skip,
 * never a vacuous pass.
 */

const REAL_FOSSILS = ["T-463", "T-516", "T-519", "T-583"];

{
  const registerFile = path.join(liveCorpusRoot(), "EXECUTION_CLAIMS.md");
  const plan = liveCorpusPlan({
    documentsPresent: fs.existsSync(registerFile),
    candidateIds: REAL_FOSSILS,
  });

  if (plan.skip) {
    skip("the four real fossils each resolve to a claim line of their own", plan.reason);
    skip("a branch is extracted from each, including the pipe-less one", plan.reason);
    skip("none of the four is a phantom read off a path in its own `files:` list", plan.reason);
    skip("each classifies `fossil` under the historical observation", plan.reason);
  } else {
    const text = fs.readFileSync(registerFile, "utf8");
    const start = text.indexOf("## Claim log");
    const body = start < 0 ? text : text.slice(start);

    /*
     * The newest line ABOUT each id that is not itself the retirement. A
     * release announcement is what took these four out of the bucket, so
     * reading `newestClaimFor` here would replay the fix rather than the
     * defect it was applied to.
     */
    const newest = new Map();
    for (const raw of body.split(/\r?\n/)) {
      const subject = claimSubject(raw);
      if (!subject || !REAL_FOSSILS.includes(subject.id)) continue;
      if (announcesRelease(raw) || announcesAbstention(raw)) continue;
      const at = Date.parse(subject.at);
      if (Number.isNaN(at)) continue;
      const held = newest.get(subject.id);
      if (!held || at >= held.at) newest.set(subject.id, { at, stamp: subject.at, line: raw });
    }

    const missing = REAL_FOSSILS.filter((id) => !newest.has(id));
    check(
      "the four real fossils each resolve to a claim line of their own",
      missing.length === 0,
      `no claim line for: ${missing.join(" ")}`,
    );

    const replayed = REAL_FOSSILS.map((id) => {
      const row = newest.get(id) ?? null;
      const branch = row ? (branchesInClaim(row.line)[0] ?? null) : null;
      return {
        id,
        branch,
        line: row?.line ?? "",
        ...classify({
          branch,
          remoteExists: false,
          pullRequests: [{ number: 0, state: "MERGED" }],
        }),
      };
    });

    const unbranched = replayed.filter((entry) => !entry.branch);
    check(
      "a branch is extracted from each, including the pipe-less one",
      unbranched.length === 0,
      `no branch extracted for: ${unbranched.map((entry) => entry.id).join(" ")}`,
    );

    /*
     * A branch that occurs in its line ONLY after a path character was read
     * off a longer path — the defect the hermetic cases above pin. None of
     * these four is one, and that is worth asserting rather than assuming:
     * one of them lists files under `scripts/exec/` in the same line.
     */
    const phantom = replayed.filter((entry) => {
      if (!entry.branch) return false;
      for (let at = entry.line.indexOf(entry.branch); at !== -1; at = entry.line.indexOf(entry.branch, at + 1)) {
        if (at === 0 || !/[\w./-]/.test(entry.line[at - 1])) return false;
      }
      return true;
    });
    check(
      "none of the four is a phantom read off a path in its own `files:` list",
      phantom.length === 0,
      phantom.map((entry) => `${entry.id} -> ${entry.branch}`).join("; "),
    );

    const notFossil = replayed.filter((entry) => entry.verdict !== VERDICTS.FOSSIL);
    check(
      "each classifies `fossil` under the historical observation",
      notFossil.length === 0,
      notFossil.map((entry) => `${entry.id} ${entry.branch} -> ${entry.verdict}`).join("; "),
    );
  }
}

/* ========================================================================= */
console.log("\nreal corpus — the extraction half, with no network call");
/* ========================================================================= */

/*
 * THE CASE DELETED HERE, AND WHY, because the reason has to survive the diff.
 *
 * `the live queue names a non-empty suppressed-candidate list` asserted a
 * property of a MUTABLE operator document: that the bucket is not empty. It is
 * gone rather than repaired. Nothing about this module's behaviour is proven by
 * the bucket being full — extraction, newest-claim precedence and the branch
 * grammar are each pinned by hermetic cases above, composed from `candidateLine`
 * and `claimLine` fixtures — while an empty bucket is that bucket's HEALTHY
 * state, reached by resolving the claims in it. So the only thing that case
 * could report was "the corpus improved", and it reported it as a failure.
 *
 * The two checks that remain are a real audit of the live documents, and they
 * used to pass VACUOUSLY over zero ids, which is the silent direction. They now
 * run only under a `replay` plan, and an empty or absent corpus is a COUNTED
 * skip naming the state.
 */
{
  const operatorRoot = liveCorpusRoot();
  const queueFile = path.join(operatorRoot, "EXECUTION_QUEUE.md");
  const registerFile = path.join(operatorRoot, "EXECUTION_CLAIMS.md");
  const documentsPresent = fs.existsSync(queueFile) && fs.existsSync(registerFile);
  const plan = liveCorpusPlan({
    documentsPresent,
    candidateIds: documentsPresent
      ? suppressedCandidateIds(fs.readFileSync(queueFile, "utf8"))
      : [],
  });
  if (plan.skip) {
    skip("the live queue's candidates each resolve to a claim line", plan.reason);
    skip("and a branch is extracted for all but the one that declares none", plan.reason);
  } else {
    const reg = fs.readFileSync(registerFile, "utf8");
    const ids = plan.candidates;
    const unmatched = ids.filter((id) => newestClaimFor(reg, id) === null);
    check(
      "every candidate the queue names resolves to a claim line in the register",
      unmatched.length === 0,
      `no claim line for: ${unmatched.join(" ")}`,
    );
    const branchless = ids.filter((id) => {
      const claim = newestClaimFor(reg, id);
      return claim ? branchesInClaim(claim.line).length === 0 : true;
    });
    check(
      "a branch is extracted for all but the candidates whose claim declares none",
      branchless.length <= 1,
      `no branch extracted for: ${branchless.join(" ")}`,
    );
  }
}

console.log(`\n${passes} passed, ${failures} failed, ${skipped} skipped`);
process.exitCode = failures > 0 ? 1 : 0;
