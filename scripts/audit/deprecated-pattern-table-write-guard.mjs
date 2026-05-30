#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';

const DEPRECATED_TABLES = [
  'canonical_industry_ai_patterns',
  'pattern_packs',
];

const SCANNED_EXTENSIONS = /\.(sql|ts|tsx|js|jsx|mjs|cjs)$/;
const SCANNED_PREFIXES = [
  '.github/',
  'scripts/',
  'src/',
  'supabase/',
];

function argValue(name) {
  const prefix = `${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : null;
}

function git(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

function refExists(ref) {
  try {
    git(['rev-parse', '--verify', `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function firstExistingRef(candidates) {
  for (const candidate of candidates) {
    if (candidate && refExists(candidate)) return candidate;
  }
  return null;
}

function resolveDiffArgs() {
  const explicitBase = argValue('--base');
  const explicitHead = argValue('--head') ?? 'HEAD';
  if (explicitHead === 'WORKTREE') {
    const base = explicitBase ?? firstExistingRef(['origin/main', 'main', 'HEAD']);
    if (!base) {
      throw new Error('Could not resolve a base ref for deprecated table write guard.');
    }
    return [base, explicitHead];
  }

  if (explicitBase) {
    return [explicitBase, explicitHead];
  }

  const envBase = process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}`
    : null;
  const base = firstExistingRef([
    envBase,
    'origin/main',
    'main',
    'HEAD^1',
  ]);

  if (!base) {
    throw new Error('Could not resolve a base ref for deprecated table write guard.');
  }

  return [base, explicitHead];
}

function isScannedFile(file) {
  return SCANNED_EXTENSIONS.test(file)
    && SCANNED_PREFIXES.some((prefix) => file.startsWith(prefix));
}

function normalizeAddedLine(line) {
  return line
    .replace(/^\+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sqlWriteRegex(table) {
  return new RegExp(`\\b(?:insert\\s+into|update)\\s+(?:public\\.)?${table}\\b`, 'i');
}

function helperWriteRegex(table) {
  return new RegExp(`\\b(?:upsertRows|insertRows|writeRows)\\s*\\([^\\n]*['"]${table}['"]`, 'i');
}

function fromTableRegex(table) {
  return new RegExp(`\\.from\\s*\\(\\s*['"]${table}['"]\\s*\\)`, 'i');
}

function writeMethodRegex() {
  return /\.(?:insert|upsert|update)\s*\(/i;
}

function scanAddedLines(file, added) {
  const violations = [];
  for (const table of DEPRECATED_TABLES) {
    const sqlRe = sqlWriteRegex(table);
    const helperRe = helperWriteRegex(table);
    const fromRe = fromTableRegex(table);
    const window = [];

    for (const item of added) {
      const text = normalizeAddedLine(item.line);
      window.push({ ...item, text });
      if (window.length > 8) window.shift();

      if (sqlRe.test(text) || helperRe.test(text)) {
        violations.push({
          file,
          line: item.newLine,
          table,
          reason: 'direct INSERT/UPDATE or write helper targets a deprecated pattern table',
          text,
        });
      }

      const hasDeprecatedFrom = window.some((entry) => fromRe.test(entry.text));
      const hasWriteMethod = window.some((entry) => writeMethodRegex().test(entry.text));
      if (hasDeprecatedFrom && hasWriteMethod) {
        violations.push({
          file,
          line: item.newLine,
          table,
          reason: 'query builder write targets a deprecated pattern table',
          text,
        });
      }
    }
  }
  return violations;
}

function parseDiff(diff) {
  const files = new Map();
  let currentFile = null;
  let newLine = 0;

  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ b/')) {
      currentFile = raw.slice('+++ b/'.length);
      if (!files.has(currentFile)) files.set(currentFile, []);
      continue;
    }
    if (raw.startsWith('@@')) {
      const match = raw.match(/\+(\d+)(?:,(\d+))?/);
      newLine = match ? Number(match[1]) : 0;
      continue;
    }
    if (!currentFile) continue;
    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      files.get(currentFile).push({ newLine, line: raw });
      newLine += 1;
      continue;
    }
    if (!raw.startsWith('-')) {
      newLine += 1;
    }
  }

  return files;
}

const [base, head] = resolveDiffArgs();
const diff = head === 'WORKTREE'
  ? git([
    'diff',
    '--unified=8',
    '--diff-filter=ACMR',
    base,
    '--',
    ...SCANNED_PREFIXES,
  ])
  : git([
    'diff',
    '--unified=8',
    '--diff-filter=ACMR',
    `${base}...${head}`,
    '--',
    ...SCANNED_PREFIXES,
  ]);

const addedByFile = parseDiff(diff);
if (head === 'WORKTREE') {
  const untracked = git(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)
    .filter(isScannedFile);
  for (const file of untracked) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    addedByFile.set(file, lines.map((line, index) => ({
      newLine: index + 1,
      line: `+${line}`,
    })));
  }
}

const violations = [];
for (const [file, added] of addedByFile.entries()) {
  if (!isScannedFile(file)) continue;
  violations.push(...scanAddedLines(file, added));
}

const summary = {
  checkedAt: new Date().toISOString(),
  base,
  head,
  deprecatedTables: DEPRECATED_TABLES,
  scannedPrefixes: SCANNED_PREFIXES,
  changedFilesWithAdditions: Array.from(addedByFile.keys()).filter(isScannedFile).length,
  violations,
};

console.log(JSON.stringify(summary, null, 2));

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(
      `[fail] ${violation.file}:${violation.line} ${violation.table} — ${violation.reason}`,
    );
  }
  process.exit(1);
}
