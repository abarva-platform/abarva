#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");

function runBackfill(args = []) {
  const output = execFileSync("node", ["scripts/knowledge/backfill-exploration-evidence.mjs", ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return JSON.parse(output);
}

const combined = runBackfill(["--tenant", "skyharbor-air"]);
assert.equal(combined.status, "dry_run");
assert.equal(combined.database_mutated, false);
assert.equal(combined.counts.source_rows, 1489);
assert.equal(combined.counts.application_exploration, 503);
assert.equal(combined.counts.interview_exploration, 986);
assert.equal(combined.counts.source_exploration, combined.counts.source_rows);
assert.equal(combined.counts.source_chunks, combined.counts.source_rows);
assert.equal(combined.counts.dispositions, combined.counts.source_rows + combined.counts.source_fields);
assert.equal(combined.counts.non_empty_fields, 34912);
assert.equal(combined.counts.unexplained_variance, 0);

const applications = runBackfill(["--tenant", "skyharbor-air", "--domains", "applications"]);
assert.equal(applications.counts.source_rows, 503);
assert.equal(applications.counts.source_fields, 16599);
assert.equal(applications.counts.non_empty_fields, 16361);
assert.equal(applications.counts.application_exploration, 503);
assert.equal(applications.counts.interview_exploration, 0);

const interviews = runBackfill(["--tenant", "skyharbor-air", "--domains", "interviews"]);
assert.equal(interviews.counts.source_rows, 986);
assert.equal(interviews.counts.source_fields, 19718);
assert.equal(interviews.counts.non_empty_fields, 18551);
assert.equal(interviews.counts.application_exploration, 0);
assert.equal(interviews.counts.interview_exploration, 986);

console.log("All exploration-evidence backfill tests passed.");
