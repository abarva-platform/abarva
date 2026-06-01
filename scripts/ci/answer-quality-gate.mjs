#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['tsx', 'scripts/ci/answer-quality-gate.ts'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
