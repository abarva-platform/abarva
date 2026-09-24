#!/usr/bin/env node
/**
 * Did this merge actually deploy? (item T-476)
 *
 * Eighteen merged items in the execution backlog stop at `merged` and carry a
 * `deploy proof pending` line that has been stale for three to four days. The
 * first one checked was already wrong in the direction nobody looks for:
 * `T-412`'s line says "repo-owned ACA run `35525045012` is in progress", and
 * that run had completed **success** against `T-412`'s exact merge SHA
 * `08a5f5b5f` at 2026-09-20T17:11:01Z — before the line claiming it was in
 * flight was written.
 *
 * `T-435` had already found the same shape once, on `T-432` and `T-433`: two
 * merged items whose deploy proof existed and was simply unrecorded. A ledger
 * that says `pending` when the proof exists is the same defect as one that says
 * `deployed` when it does not. It is a false state either way, and it is the
 * direction that HIDES finished work rather than inflating it — so nothing
 * downstream ever trips over it. The board reads these lines, which makes every
 * false `pending` an item the queue can neither offer nor retire.
 *
 * ## The one place this is easy to get wrong
 *
 * **A run is keyed to a commit by ancestry, never by ordering.**
 *
 * `aca-main-deploy` runs under a concurrency group, so a merge's own run is
 * frequently `cancelled` by the next push and the deploy that actually shipped
 * that commit is a later run on a descendant SHA. Two traps follow, and they
 * pull in opposite directions:
 *
 *   - treating `cancelled` as failure records `genuinely not deployed` for a
 *     commit that is live — a false finding;
 *   - reaching for "the next successful run" by timestamp credits whichever
 *     branch merged next, which between two concurrently-merging branches is
 *     routinely NOT a descendant of your commit — a false `deployed`, and the
 *     worse direction.
 *
 * Both are resolved by asking git, in one direction only: is the merge SHA an
 * ancestor of the run's head SHA. `git merge-base --is-ancestor`, never the
 * order of the list.
 *
 * ## Four outcomes, not three
 *
 * The item asks for exactly three: `deployed`, `superseded`, `not_deployed`.
 * This adds `unresolved`, and it is not a fourth verdict — it is the refusal to
 * give one. A run still in flight is neither a proof nor a finding, and folding
 * it into either is how a false state gets written by a control built to remove
 * them. It fails closed: the CLI exits non-zero, and the caller comes back.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { isDirectInvocation, unknownFlags } from "./cli-entry.mjs";

export const DEPLOYED = "deployed";
export const SUPERSEDED = "superseded";
export const NOT_DEPLOYED = "not_deployed";
export const UNRESOLVED = "unresolved";

/** The repo-owned deploy workflow. Nothing else may shift shared web traffic. */
export const DEPLOY_WORKFLOW = "aca-main-deploy.yml";

/**
 * An ancestry oracle backed by git.
 *
 * `git merge-base --is-ancestor A B` exits 0 when A is an ancestor of B, and
 * treats a commit as an ancestor of itself. An unknown SHA — a run on a branch
 * that has since been deleted and garbage-collected — makes git exit non-zero
 * with a fatal error, which answers false. That is the correct answer here:
 * a commit this checkout cannot see is a commit whose ancestry it cannot
 * prove, and an unprovable ancestry must never be credited as a deploy.
 */
export function gitAncestry(cwd = process.cwd()) {
  return (ancestor, descendant) => {
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
        cwd,
        stdio: ["ignore", "ignore", "ignore"],
      });
      return true;
    } catch {
      return false;
    }
  };
}

const isCompleted = (run) => run.status === "completed";
const isSuccess = (run) => isCompleted(run) && run.conclusion === "success";
const isInFlight = (run) => !isCompleted(run);

function byCreatedAt(a, b) {
  return String(a.createdAt).localeCompare(String(b.createdAt));
}

/**
 * The deploy state of one merge SHA, read from run records.
 *
 * `runs` are records in the shape `gh run list --json
 * databaseId,headSha,status,conclusion,createdAt,updatedAt` returns, in any
 * order. `isAncestor(ancestor, descendant)` answers the ancestry question;
 * `mergedAt`, when given, discards runs created before the merge existed.
 */
export function resolveDeployProof({ mergeSha, runs = [], isAncestor, mergedAt = null }) {
  if (!mergeSha || !/^[0-9a-f]{7,40}$/.test(mergeSha)) {
    return { verdict: UNRESOLVED, run: null, reason: `not a commit SHA: ${mergeSha}`, candidates: [] };
  }
  if (typeof isAncestor !== "function") {
    throw new TypeError("resolveDeployProof needs an isAncestor oracle; ordering is not ancestry");
  }

  const exact = runs.filter((run) => run.headSha === mergeSha).sort(byCreatedAt);

  // 1. A success on the exact SHA is the proof, and outranks any descendant.
  const exactSuccess = exact.find(isSuccess);
  if (exactSuccess) {
    return {
      verdict: DEPLOYED,
      run: exactSuccess,
      reason: `run ${exactSuccess.databaseId} succeeded against the exact merge SHA`,
      candidates: exact,
    };
  }

  // 2. Otherwise a descendant may have carried it. Ancestry, then time — in
  //    that order, because the reverse is the false-`deployed` trap.
  const notBeforeTheMerge = (run) =>
    !mergedAt || String(run.createdAt).localeCompare(String(mergedAt)) >= 0;

  const descendants = runs
    .filter((run) => run.headSha !== mergeSha)
    .filter(isSuccess)
    .filter(notBeforeTheMerge)
    .filter((run) => isAncestor(mergeSha, run.headSha))
    .sort(byCreatedAt);

  if (descendants.length > 0) {
    const carrier = descendants[0];
    return {
      verdict: SUPERSEDED,
      run: carrier,
      reason:
        `no success on the exact SHA; run ${carrier.databaseId} on descendant ` +
        `${carrier.headSha.slice(0, 9)} carried it`,
      candidates: [...exact, ...descendants],
    };
  }

  // 3. Nothing carried it. An in-flight run means come back, not a verdict.
  const inFlight = exact.find(isInFlight);
  if (inFlight) {
    return {
      verdict: UNRESOLVED,
      run: inFlight,
      reason: `run ${inFlight.databaseId} is still ${inFlight.status}; no descendant has carried the SHA`,
      candidates: exact,
    };
  }

  const failed = exact.filter((run) => !isSuccess(run));
  return {
    verdict: NOT_DEPLOYED,
    run: null,
    reason:
      failed.length > 0
        ? `every run on the exact SHA failed or was cancelled (${failed
            .map((run) => `${run.databaseId}:${run.conclusion}`)
            .join(", ")}) and no descendant run succeeded`
        : "no run on the exact SHA and no descendant run succeeded",
    candidates: exact,
  };
}

/**
 * The runtime invariant, read from the deploy run's OWN artifact.
 *
 * The runbook's invariant is that the Container App template image, the image
 * of the sole 100%-traffic revision, and every required worker job image are
 * one digest, on a healthy revision. For a deploy three days old that cannot be
 * re-read from Azure: the runtime has moved on, and today's state is evidence
 * about today's SHA, not about that one. Reading present-day Azure and writing
 * it beside an old merge would be the same false state this item exists to
 * remove, arrived at from the opposite direction.
 *
 * `aca-main-deploy` uploads `runtime-invariant/runtime-invariant-proof.json`
 * as a run artifact, captured at deploy time. That is the immutable evidence,
 * and it is what `T-435` used to close the same shape on T-432 and T-433.
 *
 * This RE-DERIVES the verdict from the bundle's own fields rather than reading
 * its `passed` flag. A bundle that says `passed: true` while its template and
 * active images differ is exactly the unfalsifiable claim the ledger already
 * had; `passed` is carried through as `claimedPassed` so the two can disagree
 * visibly instead of one silently standing in for the other.
 */
export function readRuntimeInvariant(bundle) {
  if (!bundle || typeof bundle !== "object") {
    return { proven: false, reason: "no runtime-invariant bundle", digest: null };
  }
  const reasons = [];
  const digest = bundle.activeDigest ?? null;

  if (!bundle.templateImage || bundle.templateImage !== bundle.activeImage) {
    reasons.push(`template image ${bundle.templateImage ?? "absent"} != active image ${bundle.activeImage ?? "absent"}`);
  }
  const fullWeight = (bundle.traffic ?? []).filter((slice) => slice.weight === 100);
  if (fullWeight.length !== 1 || fullWeight[0].revisionName !== bundle.activeRevisionName) {
    reasons.push(`100% traffic is not on the active revision (${JSON.stringify(bundle.traffic ?? [])})`);
  }
  const strayWorkers = (bundle.workerJobs ?? []).filter(
    (job) => job.passed !== true || job.image !== bundle.activeImage,
  );
  if (strayWorkers.length > 0) {
    reasons.push(`worker jobs off the digest: ${strayWorkers.map((job) => job.name).join(", ")}`);
  }
  if (bundle.health?.ok !== true) reasons.push("health check did not pass");
  if ((bundle.errors ?? []).length > 0) reasons.push(`bundle reported ${bundle.errors.length} error(s)`);

  return {
    proven: reasons.length === 0,
    reason: reasons.length === 0 ? "template, 100%-traffic revision and worker jobs are one digest on a healthy revision" : reasons.join("; "),
    digest,
    revision: bundle.activeRevisionName ?? null,
    checkedAt: bundle.checkedAt ?? null,
    claimedPassed: bundle.passed === true,
  };
}

/** One reportable line per item, carrying the evidence rather than the claim. */
export function formatVerdict(id, result) {
  const sha = result.run?.headSha ?? "";
  const evidence = result.run
    ? `run ${result.run.databaseId} @ ${result.run.createdAt} head ${sha.slice(0, 9)}`
    : "no run";
  return `${id} ${result.verdict.toUpperCase()} — ${result.reason} [${evidence}]`;
}

/** The three outcomes the item asks to be recorded; `unresolved` is not one. */
export function isVerdict(verdict) {
  return verdict === DEPLOYED || verdict === SUPERSEDED || verdict === NOT_DEPLOYED;
}

function fetchRuns(repo, limit) {
  const stdout = execFileSync(
    "gh",
    [
      "run", "list",
      "--repo", repo,
      "--workflow", DEPLOY_WORKFLOW,
      "--limit", String(limit),
      "--json", "databaseId,headSha,status,conclusion,createdAt,updatedAt,event",
    ],
    { encoding: "utf8", env: { ...process.env, GH_TOKEN: "" } },
  );
  return JSON.parse(stdout);
}

/**
 * The proof bundle a deploy run uploaded, from a directory of `gh run download`
 * output laid out as `<dir>/<runId>/runtime-invariant/runtime-invariant-proof.json`.
 * An absent bundle is `null`, which `readRuntimeInvariant` refuses — never a
 * silent pass.
 */
export function loadProofBundle(proofsDir, runId) {
  const file = path.join(String(proofsDir), String(runId), "runtime-invariant", "runtime-invariant-proof.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const USAGE = `usage: --items <items.json> [--runs <runs.json> | --github]
       [--repo <owner/name>] [--limit 800] [--no-git] [--repo-dir <path>]
       [--proofs <dir of gh-run-download output>] [--json]
items.json is [{ "id": "T-000", "mergeSha": "<40 hex>", "mergedAt": "<ISO>" }]
exit 0 when every item resolves to deployed or superseded, 1 otherwise.`;

function main(argv) {
  const unknown = unknownFlags(argv, {
    value: ["--items", "--runs", "--repo", "--limit", "--repo-dir", "--proofs"],
    boolean: ["--github", "--json", "--no-git"],
  });
  if (unknown.length > 0) {
    console.log(
      `${unknown.join(" ")} ${unknown.length === 1 ? "is not a flag" : "are not flags"} this command reads. ` +
        "An unrecognised flag is parsed as nothing, so the check you asked for would not run. Nothing was resolved.",
    );
    console.log(USAGE);
    return 2;
  }

  const read = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? null : argv[i + 1];
  };
  const itemsPath = read("--items");
  if (!itemsPath) {
    console.log(USAGE);
    return 2;
  }

  const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
  const runsPath = read("--runs");
  const runs = runsPath
    ? JSON.parse(fs.readFileSync(runsPath, "utf8"))
    : fetchRuns(read("--repo") ?? "abarva-platform/abarva", Number(read("--limit") ?? 800));

  const isAncestor = argv.includes("--no-git")
    ? (ancestor, descendant) => ancestor === descendant
    : gitAncestry(read("--repo-dir") ?? process.cwd());

  const proofsDir = read("--proofs");
  const results = items.map((item) => {
    const resolved = resolveDeployProof({
      mergeSha: item.mergeSha,
      runs,
      isAncestor,
      mergedAt: item.mergedAt ?? null,
    });
    const invariant =
      proofsDir && resolved.run
        ? readRuntimeInvariant(loadProofBundle(proofsDir, resolved.run.databaseId))
        : null;
    return { id: item.id, mergeSha: item.mergeSha, pr: item.pr ?? null, ...resolved, invariant };
  });

  if (argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const result of results) {
      console.log(formatVerdict(result.id, result));
      if (result.invariant) {
        console.log(
          `        runtime invariant ${result.invariant.proven ? "PROVEN" : "NOT PROVEN"} — ` +
            `${result.invariant.digest ?? "no digest"} on ${result.invariant.revision ?? "no revision"} — ${result.invariant.reason}`,
        );
      }
    }
  }

  const unproven = results.filter(
    (result) =>
      result.verdict === NOT_DEPLOYED ||
      result.verdict === UNRESOLVED ||
      (result.invariant !== null && result.invariant.proven !== true),
  );
  if (unproven.length > 0) {
    console.log(
      `\n${unproven.length} of ${results.length} did not resolve to a deploy proof: ` +
        unproven.map((result) => `${result.id}(${result.verdict})`).join(" "),
    );
    return 1;
  }
  return 0;
}

if (isDirectInvocation(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
