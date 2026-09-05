#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["tsx", "scripts/audit/source-vocabulary-consistency.ts"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
