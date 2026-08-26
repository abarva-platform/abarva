#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const ref = process.env.ECL_RECONCILE_REF || "HEAD";
const MAP_PATH = "reports/ecl-legacy-table-retirement-map-2026-08-22/legacy_table_retirement_map.csv";
const SUMMARY_PATH = "reports/ecl-legacy-table-retirement-map-2026-08-22/legacy_table_retirement_summary.json";

const TERMINAL_STATUSES = new Set([
  "RETIRED_ARCHIVE_ONLY",
  "RETIRED_REPLACED_BY_ECL_PROJECTION",
  "RETIRED_REPLACED_BY_ECL_CONTEXT",
  "DROPPED_AFTER_APPROVED_CHECKPOINT",
  "RETAINED_ECL_TARGET",
  "RETAINED_TRANSACTIONAL_NON_ECL",
  "RETAINED_COMPATIBILITY_BRIDGE",
]);

const PENDING_STATUSES = new Set([
  "HOLD_UNTIL_LIVE_READBACK",
  "HOLD_UNTIL_ECL_CONTEXT_PARITY",
  "REPLACE_WITH_ECL_PROJECTION",
  "REPLACE_OR_BRIDGE",
  "REVIEW_FOR_MOVES_OR_CONTEXT_BRIDGE",
  "NEW_ECL_TARGET",
]);

function gitShow(file) {
  return execFileSync("git", ["show", `${ref}:${file}`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

const summary = JSON.parse(gitShow(SUMMARY_PATH));
const rows = parseCsv(gitShow(MAP_PATH));
const statusCounts = rows.reduce((counts, row) => {
  counts[row.sunset_status] = (counts[row.sunset_status] ?? 0) + 1;
  return counts;
}, {});
const denominator = rows.length - (statusCounts.HOLD_PLATFORM_CONTROL ?? 0);
const terminalResolved = rows.filter((row) => TERMINAL_STATUSES.has(row.sunset_status)).length;
const pendingResolved = rows.filter((row) => PENDING_STATUSES.has(row.sunset_status)).length;

assert.equal(rows.length, 897, "retirement map must remain the repo-visible CREATE TABLE statement inventory");
assert.equal(statusCounts.HOLD_PLATFORM_CONTROL, 46, "platform/control-plane holds must remain outside L-CLEANUP");
assert.equal(denominator, 851, "L-CLEANUP denominator must exclude only HOLD_PLATFORM_CONTROL rows");
assert.equal(statusCounts.RETIRED_ARCHIVE_ONLY, 25, "archive-only rows must be explicitly terminal");
assert.equal(statusCounts.ARCHIVE_ONLY ?? 0, 0, "ARCHIVE_ONLY must not remain as a pending/ambiguous status");
assert.equal(terminalResolved, 25, "first cleanup slice resolves exactly the 25 archive-only rows");
assert.equal(pendingResolved, 826, "all unresolved non-control rows must remain pending");
assert.equal(summary.create_table_statements, 897);
assert.equal(summary.status_counts.HOLD_PLATFORM_CONTROL, 46);
assert.equal(summary.status_counts.RETIRED_ARCHIVE_ONLY, 25);
assert.equal(summary.status_counts.ARCHIVE_ONLY ?? 0, 0);

console.log(
  JSON.stringify(
    {
      accepted: true,
      ref,
      denominator,
      terminal_resolved: terminalResolved,
      platform_control_hold: statusCounts.HOLD_PLATFORM_CONTROL,
      pending: pendingResolved,
    },
    null,
    2,
  ),
);
