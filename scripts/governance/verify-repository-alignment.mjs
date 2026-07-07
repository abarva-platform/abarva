#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const CANONICAL_REPO = 'abarva-platform/abarva';
const CANONICAL_GIT_URL = `https://github.com/${CANONICAL_REPO}.git`;
const CANONICAL_API_REPO = `https://api.github.com/repos/${CANONICAL_REPO}`;

const ACTIVE_PATHS = [
  '.github',
  'package.json',
  'src',
  'scripts',
  'tests',
  'docs/security',
  'docs/architecture',
  'docs/runbooks',
  'docs/planning',
];

const STALE_PATTERNS = [
  /github\.com\/anandsundaram-hash\/abarva/g,
  /github\.com\/anthropic\/nexus/g,
  /api\.github\.com\/repos\/abarva\/nexus/g,
  /git@github\.com:anandsundaram-hash\/abarva/g,
  /\banandsundaram-hash\/abarva\b/g,
  /\banthropic\/nexus\b/g,
  /\babarva\/nexus\b/g,
];

function listFiles(path) {
  if (!existsSync(path)) return [];
  const result = spawnSync('git', ['ls-files', path], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ls-files failed for ${path}`);
  }
  return result.stdout.split('\n').filter(Boolean);
}

function scanFile(file) {
  const absolute = join(process.cwd(), file);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) return [];
  const text = readFileSync(absolute, 'utf8');
  const findings = [];
  for (const pattern of STALE_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split('\n').length;
      findings.push(`${file}:${line}: ${match[0]}`);
    }
  }
  return findings;
}

const remote = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
const remoteUrl = remote.stdout.trim();
const failures = [];

if (remote.status !== 0) {
  failures.push(`origin remote could not be read: ${remote.stderr.trim()}`);
} else if (remoteUrl !== CANONICAL_GIT_URL) {
  failures.push(`origin remote is ${remoteUrl}; expected ${CANONICAL_GIT_URL}`);
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
if (packageJson.repository?.url !== CANONICAL_GIT_URL) {
  failures.push(`package.json repository.url is ${packageJson.repository?.url}; expected ${CANONICAL_GIT_URL}`);
}
if (packageJson.bugs?.url !== `https://github.com/${CANONICAL_REPO}/issues`) {
  failures.push(`package.json bugs.url is ${packageJson.bugs?.url}; expected https://github.com/${CANONICAL_REPO}/issues`);
}

const files = [...new Set(ACTIVE_PATHS.flatMap(listFiles))];
for (const file of files) {
  failures.push(...scanFile(file));
}

if (failures.length) {
  console.error('Repository alignment check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Repository alignment OK: ${CANONICAL_REPO}`);
console.log(`Canonical Git URL: ${CANONICAL_GIT_URL}`);
console.log(`Canonical API repo: ${CANONICAL_API_REPO}`);
