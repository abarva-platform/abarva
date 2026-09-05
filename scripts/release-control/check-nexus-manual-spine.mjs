#!/usr/bin/env node

import { execFileSync } from "node:child_process";

execFileSync(
  "npx",
  ["tsx", "scripts/docs/build-nexus-manual.ts", "--check"],
  { stdio: "inherit" },
);
