#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["scripts/knowledge/validate-home-architecture-diagram-pack.mjs"],
  {
    cwd: process.cwd(),
    encoding: "utf8",
  },
);

process.stdout.write(result.stdout);
process.stderr.write(result.stderr);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const report = JSON.parse(result.stdout);
if (report.status !== "pass") {
  console.error(`Expected pass report, got ${report.status}`);
  process.exit(1);
}

if (!report.warnings.some((warning) => warning.includes("not Claude-generated yet"))) {
  console.error("Expected the seed pack to warn that Claude generation is pending.");
  process.exit(1);
}

console.log("Home architecture diagram pack validator test passed.");
