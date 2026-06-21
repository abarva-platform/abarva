#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync(
  "npx",
  ["tsx", "src/scripts/intelligence/scb-truth-gates.ts", "--static-only"],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
