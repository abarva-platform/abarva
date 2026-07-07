#!/usr/bin/env node
/**
 * Vercel production-runtime guard.
 *
 * AbarVa production runtime is Azure Container Apps. This scanner prevents new
 * Vercel production deploy/rollback paths from entering active automation while
 * preserving a baseline for known legacy migration-session residue.
 *
 * Usage:
 *   node scripts/audit/vercel-production-runtime-guard.mjs
 *   node scripts/audit/vercel-production-runtime-guard.mjs --check
 *   node scripts/audit/vercel-production-runtime-guard.mjs --baseline
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASELINE_PATH = path.join(REPO_ROOT, 'scripts/audit/vercel-production-runtime-baseline.json');

const args = process.argv.slice(2);
const isBaseline = args.includes('--baseline');
const isCheck = args.includes('--check');
const isJson = args.includes('--json');

const SCAN_ROOTS = [
  '.github/workflows',
  'scripts',
  'package.json',
  'vercel.json',
  'vercel.ts',
];

const FILE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.yml', '.yaml', '.sh']);

const PATTERNS = [
  {
    id: 'vercel_prod_deploy',
    regex: /\bvercel\b[^\n\r]*(--prod|--target\s+production|deploy\s+--prod)/i,
  },
  {
    id: 'vercel_prod_rollback',
    regex: /\bvercel\b[^\n\r]*(rollback|promote)/i,
  },
  {
    id: 'vercel_prod_env',
    regex: /\bVERCEL_(ORG_ID|PROJECT_ID|TOKEN)\b/i,
  },
];

const PATH_ALLOWLIST = new Set([
  // The guard must be allowed to describe its own forbidden patterns.
  'scripts/audit/architecture-rules.mjs',
  'scripts/audit/vercel-production-runtime-guard.mjs',
  'scripts/audit/vercel-production-runtime-baseline.json',
]);

function pathExists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function* walk(relRoot) {
  const absRoot = path.join(REPO_ROOT, relRoot);
  if (!fs.existsSync(absRoot)) return;
  const stat = fs.statSync(absRoot);
  if (stat.isFile()) {
    yield absRoot;
    return;
  }
  const stack = [absRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (FILE_EXTENSIONS.has(ext)) yield abs;
      }
    }
  }
}

function scan() {
  const hits = [];
  for (const root of SCAN_ROOTS) {
    if (!pathExists(root)) continue;
    for (const abs of walk(root)) {
      const rel = path.relative(REPO_ROOT, abs);
      if (PATH_ALLOWLIST.has(rel)) continue;
      const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        for (const pattern of PATTERNS) {
          if (pattern.regex.test(line)) {
            hits.push({
              file: rel,
              line: index + 1,
              pattern: pattern.id,
              text: line.trim().slice(0, 220),
            });
          }
        }
      });
    }
  }
  return { generatedAt: new Date().toISOString(), total: hits.length, hits };
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function writeBaseline(snapshot) {
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(
      {
        generatedAt: snapshot.generatedAt,
        notes:
          'Baseline of known Vercel production-runtime residue. In --check mode, ' +
          'the guard fails if total hits increase. Reducing this baseline is the cleanup goal.',
        total: snapshot.total,
        hits: snapshot.hits,
      },
      null,
      2,
    )}\n`,
  );
}

function report(snapshot, baseline) {
  console.log('Vercel production-runtime guard');
  console.log(`Total hits: ${snapshot.total}${baseline ? ` (baseline ${baseline.total})` : ''}`);
  for (const hit of snapshot.hits) {
    console.log(`- ${hit.file}:${hit.line} [${hit.pattern}] ${hit.text}`);
  }
}

const snapshot = scan();
const baseline = loadBaseline();

if (isJson) {
  console.log(JSON.stringify({ snapshot, baseline }, null, 2));
  process.exit(0);
}

if (isBaseline) {
  writeBaseline(snapshot);
  report(snapshot, snapshot);
  process.exit(0);
}

report(snapshot, baseline);

if (isCheck) {
  if (!baseline) {
    console.error('No Vercel production-runtime baseline found. Run with --baseline first.');
    process.exit(2);
  }
  if (snapshot.total > baseline.total) {
    console.error(`Vercel production-runtime guard failed: current=${snapshot.total}, baseline=${baseline.total}.`);
    console.error('Remove the new Vercel production path or explicitly regenerate the baseline with justification.');
    process.exit(1);
  }
  console.log('✓ Vercel production-runtime guard passed. No new Vercel production runtime automation detected.');
}
