#!/usr/bin/env node
/**
 * The ai-cost-daily digest's last step asked for a capability this repository
 * denies, and that single refusal failed all 73 of its scheduled runs (item
 * C-593).
 *
 * Measured on 2026-10-04 against the Actions API: `event=schedule` for
 * `ai-cost-daily.yml` returns `total_count` 73, every one a failure, oldest in
 * the same page at 2026-07-23 — so that is the COMPLETE scheduled history and
 * not a streak truncated by the read window. Every run got as far as emailing
 * the digest and pushing the snapshot branch; run 37131951342 then ended step
 * 7 with
 *
 *   pull request create failed: GraphQL: GitHub Actions is not permitted to
 *   create or approve pull requests (createPullRequest)
 *
 * and the repository reads `can_approve_pull_request_reviews: false`. The
 * visible residue is 73 orphan `automation/ai-cost-daily-snapshot-*` branches
 * on origin and zero snapshot pull requests ever opened.
 *
 * So the decidable question — the only one worth a module — is whether a
 * failed `gh pr create` is THAT refusal or a real error. Getting it wrong in
 * either direction is a defect with teeth: treat every failure as the refusal
 * and a genuine break goes green forever; treat the refusal as a failure and
 * the job stays red forever, which is where it has been since July.
 *
 * These cases pin each branch separately, and each one is reachable by the
 * CLI the workflow actually calls — a classifier asserted only as a function
 * would not prove the step can still fail.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { classifyPrCreateFailure, ACTIONS_PR_REFUSAL } from "./snapshot-pr.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(here, "snapshot-pr.mjs");

/** The verbatim line GitHub returned on run 37131951342, step 7. */
const REAL_REFUSAL =
  "pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)";

function runCli(args, { stderrText } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "snapshot-pr-"));
  const summary = path.join(dir, "summary.md");
  fs.writeFileSync(summary, "");
  let stderrFile;
  if (stderrText !== undefined) {
    stderrFile = path.join(dir, "stderr.txt");
    fs.writeFileSync(stderrFile, stderrText);
  }
  const result = spawnSync(
    process.execPath,
    [CLI, ...args, ...(stderrFile ? ["--stderr-file", stderrFile] : [])],
    { encoding: "utf8", env: { ...process.env, GITHUB_STEP_SUMMARY: summary } },
  );
  return {
    ...result,
    summary: fs.readFileSync(summary, "utf8"),
  };
}

test("a zero exit is `created` and says nothing about a refusal", () => {
  assert.deepEqual(classifyPrCreateFailure({ status: 0, stderr: "" }), {
    kind: "created",
  });
});

test("the refusal GitHub really returned is classified as the repository's", () => {
  assert.deepEqual(
    classifyPrCreateFailure({ status: 1, stderr: REAL_REFUSAL }),
    { kind: "forbidden-by-repo" },
  );
});

test("any other non-zero failure is an error, not the refusal", () => {
  // A real one from the same CLI: a head branch that was never pushed.
  const other =
    "pull request create failed: GraphQL: No commits between main and automation/ai-cost-daily-snapshot-2026-10-04";
  assert.deepEqual(classifyPrCreateFailure({ status: 1, stderr: other }), {
    kind: "error",
  });
});

test("a non-zero exit with empty stderr is an error, not a silent pass", () => {
  assert.deepEqual(classifyPrCreateFailure({ status: 1, stderr: "" }), {
    kind: "error",
  });
  assert.deepEqual(classifyPrCreateFailure({ status: 1 }), { kind: "error" });
});

test("the refusal is matched on its wording, not on the whole line", () => {
  // The same sentence inside a longer gh envelope still has to match, because
  // gh has changed the prefix before and the subject of the sentence is what
  // identifies the condition.
  assert.ok(
    ACTIONS_PR_REFUSAL.test(
      "HTTP 403: GitHub Actions is not permitted to create or approve pull requests (https://api.github.com/graphql)",
    ),
  );
  // And a sentence merely ABOUT the setting must not match, or a future
  // diagnostic that quotes the condition would be read as the condition.
  assert.ok(
    !ACTIONS_PR_REFUSAL.test(
      "note: enable Actions to create pull requests in repository settings",
    ),
  );
});

test("the CLI exits 0 on the refusal and leaves a loud, actionable summary", () => {
  const result = runCli(
    [
      "--status",
      "1",
      "--branch",
      "automation/ai-cost-daily-snapshot-2026-10-04",
      "--repo",
      "owner/repo",
    ],
    { stderrText: REAL_REFUSAL },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /::warning::/);
  // The branch is already pushed, so the summary has to say where the snapshot
  // IS and what would let the PR open — a warning with neither is noise.
  assert.match(
    result.summary,
    /automation\/ai-cost-daily-snapshot-2026-10-04/,
  );
  assert.match(
    result.summary,
    /compare\/main\.\.\.automation\/ai-cost-daily-snapshot-2026-10-04/,
  );
  assert.match(result.summary, /create and approve pull requests/);
});

test("the CLI still fails the step on any other gh failure", () => {
  const result = runCli(
    ["--status", "1", "--branch", "b", "--repo", "owner/repo"],
    { stderrText: "pull request create failed: GraphQL: Something else broke" },
  );
  assert.notEqual(result.status, 0);
  // The original error has to be re-emitted, or the diagnosis is lost.
  assert.match(result.stderr, /Something else broke/);
});

test("the CLI is silent on success", () => {
  const result = runCli(
    ["--status", "0", "--branch", "b", "--repo", "owner/repo"],
    { stderrText: "" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /::warning::/);
  assert.equal(result.summary, "");
});

test("an unreadable --stderr-file is an error, not a pass", () => {
  // Reading nothing must not be mistaken for reading no refusal: that would
  // turn a broken step into a green one.
  const result = runCli([
    "--status",
    "1",
    "--branch",
    "b",
    "--repo",
    "owner/repo",
    "--stderr-file",
    "/nonexistent/snapshot-pr-stderr.txt",
  ]);
  assert.notEqual(result.status, 0);
});
