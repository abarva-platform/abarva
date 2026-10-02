#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { RELEASE_GATES } from './release-control/release-gates.mjs';
import { runReleaseGates } from './release-control/run-release-gates.mjs';

// Gates are listed in `release-control/release-gates.mjs` and each runs as its
// own process. None is imported here: a gate that calls `process.exit(0)` when
// it passes would end this process, and the gates after it would never run.
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

process.exitCode = runReleaseGates({
  gates: RELEASE_GATES,
  args: process.argv.slice(2),
  rootDir,
}).exitCode;
