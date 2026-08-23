import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const SCRIPT_PATH = "scripts/source/vendor-proposal-parse-proof-job.ts";
const PACKAGE_PATH = "package.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

test("vendor proposal proof job is exposed as an npm script with server-only preload", () => {
  const pkg = JSON.parse(read(PACKAGE_PATH));
  const command = pkg.scripts["source:vendor-proposal-parse:proof-job"];
  assert.equal(typeof command, "string");
  assert.match(command, /_mock-server-only-preload\.cjs/);
  assert.match(command, /vendor-proposal-parse-proof-job\.ts/);
});

test("vendor proposal proof job uses the governed proposal fact repository", () => {
  const source = read(SCRIPT_PATH);
  assert.match(source, /insertVendorProposalFacts/);
  assert.match(source, /listVendorProposalFacts/);
  assert.match(source, /rlsSessionUsed:\s*true/);
});

test("vendor proposal proof job has explicit mutation acknowledgement", () => {
  const source = read(SCRIPT_PATH);
  assert.match(source, /APPLY_SOURCE_VENDOR_PROPOSAL_PARSE_PROOF/);
  assert.match(source, /Refusing production mutation/);
});

test("vendor proposal proof job populates required source artifact version", () => {
  const source = read(SCRIPT_PATH);
  assert.match(source, /includeColumn\(args\.columns, row, "version", 1\)/);
});

test("vendor proposal proof job populates source artifact timestamps when present", () => {
  const source = read(SCRIPT_PATH);
  assert.match(source, /const now = new Date\(\)\.toISOString\(\)/);
  assert.match(source, /includeColumn\(args\.columns, row, "created_at", now\)/);
  assert.match(source, /includeColumn\(args\.columns, row, "updated_at", now\)/);
});

test("vendor proposal proof job carries rich proposal dimensions", () => {
  const source = read(SCRIPT_PATH);
  for (const label of [
    "Solution architecture",
    "Integration architecture",
    "AI architecture",
    "Automation",
    "Accelerator",
    "SLA",
    "Price",
    "Rate",
    "Discount",
    "Governance",
    "Evidence",
  ]) {
    assert.match(source, new RegExp(label));
  }
});

test("npm launch compiles without server-only failure", () => {
  const result = spawnSync(
    "npm",
    [
      "run",
      "source:vendor-proposal-parse:proof-job",
      "--",
      "--dry-run",
      "--out-dir",
      "/tmp/source-vendor-proof-test",
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:1/postgres",
        NODE_PATH: "/Users/anand/Projects/nexus/node_modules",
      },
      encoding: "utf8",
      timeout: 20_000,
    },
  );

  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /server-only/i);
  assert.match(result.stderr, /ECONNREFUSED|connection/i);
});
