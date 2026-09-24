#!/usr/bin/env node
/**
 * Behavioural test for the deploy-proof resolver (item T-476).
 *
 * The defect the resolver exists against is a ledger that says `pending` when
 * the proof already exists. `T-412`'s backlog line says "repo-owned ACA run
 * `35525045012` is in progress"; that run had already completed **success**
 * against `T-412`'s exact merge SHA before the line was written. Eighteen items
 * carry a line of that shape and none of them has a verdict either way.
 *
 * A false `pending` is the direction that hides finished work, so it is never
 * noticed by anyone waiting for something to go wrong. The only thing that
 * catches it is asking GitHub, per SHA, and the only reason nobody asked is
 * that asking correctly is fiddly in exactly one place:
 *
 *   **a run is keyed to a SHA by ancestry, never by ordering.**
 *
 * `aca-main-deploy` cancels an in-flight run when a later push supersedes it,
 * so a merge's own run is frequently `cancelled` and the deploy that actually
 * shipped that commit is a later run on a descendant SHA. Reaching for "the
 * next successful run" by timestamp is the shape that has already gone wrong
 * once on this repo — a watcher keyed to "the newest run" went silent for half
 * an hour while the run for its own SHA had already succeeded. Between two
 * concurrently-merging branches the newest run is routinely NOT a descendant of
 * your commit, and crediting it is a false `deployed`, which is the worse
 * direction of the same defect.
 *
 * So the cases that carry this suite are the ones where time and ancestry
 * disagree (cases 5, 6, 7), not the ones where they agree.
 *
 * Run:  node scripts/exec/deploy-proof-resolver.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  DEPLOYED,
  NOT_DEPLOYED,
  SUPERSEDED,
  UNRESOLVED,
  formatVerdict,
  gitAncestry,
  readRuntimeInvariant,
  resolveDeployProof,
} from "./deploy-proof-resolver.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "deploy-proof-resolver.mjs");

let passes = 0;
let failures = 0;

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

function run(script, args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error),
    };
  }
}

/** A completed run record in the shape `gh run list --json` returns. */
function runRecord(id, sha, conclusion, createdAt, status = "completed") {
  return { databaseId: id, headSha: sha, status, conclusion, createdAt, updatedAt: createdAt };
}

/**
 * An ancestry oracle built from an explicit parent map, so a test case states
 * the commit graph it means instead of inheriting one from a real repository.
 * `descendants[x]` lists the SHAs that have `x` as an ancestor.
 */
function ancestryFrom(descendants) {
  return (ancestor, descendant) =>
    ancestor === descendant || (descendants[ancestor] ?? []).includes(descendant);
}

const A = "a".repeat(40); // the merge under test
const B = "b".repeat(40); // a descendant of A
const C = "c".repeat(40); // a LATER commit that is NOT a descendant of A
const D = "d".repeat(40); // a descendant of A, later than B

/* ------------------------------------------------------------------------ */
/* 1-2. The agreeing cases: a run keyed to the exact SHA.                    */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [runRecord(1, A, "success", "2026-09-20T10:00:00Z")],
    isAncestor: ancestryFrom({}),
  });
  check("a success keyed to the exact merge SHA is `deployed`", result.verdict === DEPLOYED, result.verdict);
  check("the deployed verdict names the run that proves it", result.run?.databaseId === 1, JSON.stringify(result.run));
}

/* ------------------------------------------------------------------------ */
/* 3. A cancelled run is supersession, not failure — and must not be the     */
/*    verdict. This is the sentence the item spells out.                     */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [
      runRecord(1, A, "cancelled", "2026-09-20T10:00:00Z"),
      runRecord(2, B, "success", "2026-09-20T10:05:00Z"),
    ],
    isAncestor: ancestryFrom({ [A]: [B] }),
  });
  check("a cancelled run on the exact SHA resolves to the descendant that shipped it", result.verdict === SUPERSEDED, result.verdict);
  check("the superseded verdict names the descendant run", result.run?.databaseId === 2, JSON.stringify(result.run));
  check("a cancelled exact run is never reported as a failed deploy", result.verdict !== NOT_DEPLOYED, result.verdict);
}

/* ------------------------------------------------------------------------ */
/* 4. No run keyed to the SHA at all, but a descendant carried it.           */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [runRecord(2, B, "success", "2026-09-20T10:05:00Z")],
    isAncestor: ancestryFrom({ [A]: [B] }),
  });
  check("a SHA with no run of its own is carried by a descendant run", result.verdict === SUPERSEDED, result.verdict);
}

/* ------------------------------------------------------------------------ */
/* 5. THE CASE THIS SUITE EXISTS FOR — a later successful run that is NOT a  */
/*    descendant must not be credited. Ordering is not ancestry.             */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [
      runRecord(1, A, "cancelled", "2026-09-20T10:00:00Z"),
      runRecord(3, C, "success", "2026-09-20T10:05:00Z"),
    ],
    isAncestor: ancestryFrom({}), // C is NOT a descendant of A
  });
  check(
    "a later success on a SHA that is not a descendant is NOT credited",
    result.verdict === NOT_DEPLOYED,
    `${result.verdict} ${JSON.stringify(result.run)}`,
  );
  check(
    "and the non-descendant run is not named as the proof",
    result.run === null || result.run === undefined,
    JSON.stringify(result.run),
  );
}

/* ------------------------------------------------------------------------ */
/* 6. The ordering trap, the other way round: a non-descendant success sits  */
/*    EARLIER than the descendant one. Picking by time alone picks wrong.    */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [
      runRecord(1, A, "cancelled", "2026-09-20T10:00:00Z"),
      runRecord(3, C, "success", "2026-09-20T10:02:00Z"),
      runRecord(2, B, "success", "2026-09-20T10:09:00Z"),
    ],
    isAncestor: ancestryFrom({ [A]: [B] }),
  });
  check(
    "the earliest DESCENDANT is chosen, not the earliest run",
    result.run?.databaseId === 2,
    `${result.verdict} ${JSON.stringify(result.run)}`,
  );
}

/* ------------------------------------------------------------------------ */
/* 7. Among descendants, the earliest is the one that shipped it — a later   */
/*    descendant is a redeploy, not the proof.                               */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [
      runRecord(4, D, "success", "2026-09-20T11:00:00Z"),
      runRecord(2, B, "success", "2026-09-20T10:09:00Z"),
    ],
    isAncestor: ancestryFrom({ [A]: [B, D] }),
  });
  check("the earliest descendant success is the proof", result.run?.databaseId === 2, JSON.stringify(result.run));
}

/* ------------------------------------------------------------------------ */
/* 8. A genuine failure with nothing after it is a FINDING, not bookkeeping. */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [runRecord(1, A, "failure", "2026-09-20T10:00:00Z")],
    isAncestor: ancestryFrom({}),
  });
  check("a failed deploy with no descendant success is `not_deployed`", result.verdict === NOT_DEPLOYED, result.verdict);
  check("and it says why, rather than only what", /fail/i.test(result.reason ?? ""), result.reason);
}

/* ------------------------------------------------------------------------ */
/* 9. No runs at all.                                                        */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({ mergeSha: A, runs: [], isAncestor: ancestryFrom({}) });
  check("a SHA no run ever touched is `not_deployed`", result.verdict === NOT_DEPLOYED, result.verdict);
}

/* ------------------------------------------------------------------------ */
/* 10. AN IN-FLIGHT RUN IS NOT A VERDICT. It must not be folded into any of  */
/*     the three outcomes: `deployed` would be a false proof, `not_deployed` */
/*     a false finding. It fails closed and says come back.                  */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [runRecord(1, A, null, "2026-09-20T10:00:00Z", "in_progress")],
    isAncestor: ancestryFrom({}),
  });
  check("an in-flight run on the exact SHA is `unresolved`, not a verdict", result.verdict === UNRESOLVED, result.verdict);
  check("an in-flight run is never reported as deployed", result.verdict !== DEPLOYED, result.verdict);
}

/* ------------------------------------------------------------------------ */
/* 11. An in-flight run that a descendant has since overtaken IS resolvable. */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [
      runRecord(1, A, null, "2026-09-20T10:00:00Z", "in_progress"),
      runRecord(2, B, "success", "2026-09-20T10:09:00Z"),
    ],
    isAncestor: ancestryFrom({ [A]: [B] }),
  });
  check("a descendant success resolves an in-flight exact run", result.verdict === SUPERSEDED, result.verdict);
}

/* ------------------------------------------------------------------------ */
/* 12. A success on the exact SHA wins over everything — no ancestry needed. */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [
      runRecord(1, A, "cancelled", "2026-09-20T10:00:00Z"),
      runRecord(5, A, "success", "2026-09-20T10:01:00Z"),
      runRecord(2, B, "success", "2026-09-20T10:09:00Z"),
    ],
    isAncestor: ancestryFrom({ [A]: [B] }),
  });
  check("a later success on the exact SHA is preferred to a descendant", result.verdict === DEPLOYED, result.verdict);
  check("and it is the exact-SHA run that is named", result.run?.databaseId === 5, JSON.stringify(result.run));
}

/* ------------------------------------------------------------------------ */
/* 13. The ancestry oracle is asked in the direction that means "descendant".*/
/*     Inverting the two arguments is the silent way this whole control      */
/*     becomes a no-op, so the order is asserted rather than assumed.        */
/* ------------------------------------------------------------------------ */
{
  const seen = [];
  resolveDeployProof({
    mergeSha: A,
    runs: [runRecord(2, B, "success", "2026-09-20T10:09:00Z")],
    isAncestor: (ancestor, descendant) => {
      seen.push([ancestor, descendant]);
      return true;
    },
  });
  check(
    "the merge SHA is asked as the ANCESTOR and the run SHA as the descendant",
    seen.length > 0 && seen.every(([anc, desc]) => anc === A && desc === B),
    JSON.stringify(seen),
  );
}

/* ------------------------------------------------------------------------ */
/* 14. A run older than the merge is never its proof, descendant or not. A   */
/*     rerun of an old workflow can carry a SHA the merge descends from.     */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [runRecord(9, B, "success", "2026-09-19T10:00:00Z")],
    isAncestor: ancestryFrom({ [A]: [B] }),
    mergedAt: "2026-09-20T10:00:00Z",
  });
  check(
    "a run created before the merge is not accepted as its deploy",
    result.verdict === NOT_DEPLOYED,
    `${result.verdict} ${JSON.stringify(result.run)}`,
  );
}

/* ------------------------------------------------------------------------ */
/* 15. The real git oracle agrees with git, on a graph this test builds.     */
/*     Built rather than borrowed from this checkout: `actions/checkout` is   */
/*     shallow by default, so `HEAD~1` does not exist in CI and a test        */
/*     reading it would pass locally and be unreachable where it is gated.   */
/*     The branch case is the one that matters: a sibling branch commit is    */
/*     LATER in time and is not an ancestor, which is the whole distinction   */
/*     between this oracle and sorting by `createdAt`.                       */
/* ------------------------------------------------------------------------ */
{
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "t476-git-"));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: repo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "t476", GIT_AUTHOR_EMAIL: "t476@example.invalid",
        GIT_COMMITTER_NAME: "t476", GIT_COMMITTER_EMAIL: "t476@example.invalid",
      },
    }).trim();

  git("init", "-q", "-b", "main");
  fs.writeFileSync(path.join(repo, "a"), "1");
  git("add", "."); git("commit", "-qm", "one");
  const first = git("rev-parse", "HEAD");
  fs.writeFileSync(path.join(repo, "a"), "2");
  git("commit", "-qam", "two");
  const second = git("rev-parse", "HEAD");
  // A sibling branch off `first`: later in time, not a descendant of `second`.
  git("checkout", "-q", "-b", "side", first);
  fs.writeFileSync(path.join(repo, "b"), "3");
  git("add", "."); git("commit", "-qm", "side");
  const sibling = git("rev-parse", "HEAD");

  const ancestry = gitAncestry(repo);
  check("git ancestry: a parent is an ancestor of its child", ancestry(first, second) === true);
  check("git ancestry: a child is not an ancestor of its parent", ancestry(second, first) === false);
  check("git ancestry: a commit is an ancestor of itself", ancestry(second, second) === true);
  check(
    "git ancestry: a LATER commit on a sibling branch is not a descendant",
    ancestry(second, sibling) === false,
    `${second.slice(0, 9)} -> ${sibling.slice(0, 9)}`,
  );
  check(
    "git ancestry: an unknown SHA answers false rather than throwing",
    ancestry("0".repeat(40), second) === false,
  );

  // And the oracle composed into the resolver refuses the sibling as proof.
  const result = resolveDeployProof({
    mergeSha: second,
    runs: [runRecord(7, sibling, "success", "2026-09-20T12:00:00Z")],
    isAncestor: ancestry,
  });
  check(
    "the resolver, on real git, does not credit a sibling-branch deploy",
    result.verdict === NOT_DEPLOYED,
    `${result.verdict} ${JSON.stringify(result.run)}`,
  );

  fs.rmSync(repo, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 16-18. The CLI reports the verdict, exits non-zero on an unresolved or    */
/*     not-deployed finding, and refuses a flag it does not read.            */
/* ------------------------------------------------------------------------ */
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "t476-"));
  const runsFile = path.join(dir, "runs.json");
  fs.writeFileSync(
    runsFile,
    JSON.stringify([runRecord(1, A, "success", "2026-09-20T10:00:00Z")]),
  );
  const itemsFile = path.join(dir, "items.json");
  fs.writeFileSync(itemsFile, JSON.stringify([{ id: "T-000", mergeSha: A }]));

  const ok = run(CLI, ["--items", itemsFile, "--runs", runsFile, "--no-git", "--json"], dir);
  check("the CLI exits 0 when every item resolves to a proof", ok.status === 0, `exit ${ok.status}\n${ok.stderr}`);
  check("the CLI reports the verdict per item", /deployed/.test(ok.stdout), ok.stdout.slice(0, 400));

  const missingFile = path.join(dir, "missing.json");
  fs.writeFileSync(missingFile, JSON.stringify([{ id: "T-001", mergeSha: C }]));
  const finding = run(CLI, ["--items", missingFile, "--runs", runsFile, "--no-git", "--json"], dir);
  check(
    "the CLI exits non-zero when an item resolves to a finding",
    finding.status !== 0,
    `exit ${finding.status}\n${finding.stdout}`,
  );

  const bogus = run(CLI, ["--items", itemsFile, "--runs", runsFile, "--no-git", "--deployed"], dir);
  check(
    "the CLI refuses a flag it does not read rather than ignoring it",
    bogus.status !== 0 && /--deployed/.test(bogus.stdout + bogus.stderr),
    `exit ${bogus.status}\n${bogus.stdout}${bogus.stderr}`,
  );

  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 19. The formatted line names the evidence, because a verdict with no run  */
/*     id in it is the same unfalsifiable sentence the ledger already has.   */
/* ------------------------------------------------------------------------ */
{
  const result = resolveDeployProof({
    mergeSha: A,
    runs: [runRecord(1, A, "success", "2026-09-20T10:00:00Z")],
    isAncestor: ancestryFrom({}),
  });
  const line = formatVerdict("T-000", result);
  check("the formatted verdict carries the run id", line.includes("1"), line);
  check("the formatted verdict carries the merge SHA", line.includes(A.slice(0, 9)), line);
}

/* ------------------------------------------------------------------------ */
/* 20-27. The runtime invariant is RE-DERIVED from the bundle's fields, not  */
/*     read off its own `passed` flag. A bundle asserting it passed while its */
/*     template and active images differ is the same unfalsifiable sentence   */
/*     the ledger already had.                                               */
/* ------------------------------------------------------------------------ */
{
  const IMAGE = "acr.example/abarva/web@sha256:" + "f".repeat(64);
  const OTHER = "acr.example/abarva/web@sha256:" + "e".repeat(64);
  const bundle = (over = {}) => ({
    templateImage: IMAGE,
    activeImage: IMAGE,
    activeDigest: "sha256:" + "f".repeat(64),
    activeRevisionName: "ca--mabc",
    traffic: [{ revisionName: "ca--mabc", weight: 100 }],
    workerJobs: [{ name: "job-w", image: IMAGE, passed: true }],
    health: { ok: true },
    errors: [],
    passed: true,
    checkedAt: "2026-09-20T22:06:07Z",
    ...over,
  });

  check("a bundle on one digest with 100% traffic and healthy workers is proven", readRuntimeInvariant(bundle()).proven === true, readRuntimeInvariant(bundle()).reason);
  check("the proven invariant carries the digest", readRuntimeInvariant(bundle()).digest?.startsWith("sha256:") === true);

  const drifted = readRuntimeInvariant(bundle({ templateImage: OTHER }));
  check("a template image different from the active image is NOT proven", drifted.proven === false, drifted.reason);
  check("and the mismatch is named", /template image/.test(drifted.reason), drifted.reason);

  const split = readRuntimeInvariant(bundle({ traffic: [{ revisionName: "ca--mabc", weight: 60 }, { revisionName: "ca--mold", weight: 40 }] }));
  check("traffic split across revisions is NOT proven", split.proven === false, split.reason);

  const elsewhere = readRuntimeInvariant(bundle({ traffic: [{ revisionName: "ca--mold", weight: 100 }] }));
  check("100% traffic on a revision other than the active one is NOT proven", elsewhere.proven === false, elsewhere.reason);

  const strayWorker = readRuntimeInvariant(bundle({ workerJobs: [{ name: "job-w", image: OTHER, passed: true }] }));
  check("a worker job on a different digest is NOT proven", strayWorker.proven === false, strayWorker.reason);

  const sick = readRuntimeInvariant(bundle({ health: { ok: false } }));
  check("a failed health check is NOT proven", sick.proven === false, sick.reason);

  // THE CASE THIS FUNCTION EXISTS FOR: the bundle claims it passed and its own
  // fields contradict it. The re-derivation must win, and the claim must stay
  // visible rather than being quietly replaced.
  const lying = readRuntimeInvariant(bundle({ templateImage: OTHER, passed: true }));
  check("a bundle's own `passed: true` does not override its contradicting fields", lying.proven === false, lying.reason);
  check("and the bundle's claim is carried through so the two can disagree visibly", lying.claimedPassed === true, JSON.stringify(lying));

  check("an absent bundle is not proven", readRuntimeInvariant(null).proven === false);
  check("errors recorded in the bundle are not proven", readRuntimeInvariant(bundle({ errors: ["x"] })).proven === false);
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
