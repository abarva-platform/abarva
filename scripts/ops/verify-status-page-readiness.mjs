#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_FILES = [
  'src/app/(public)/status/page.tsx',
  'docs/runbooks/status-page.md',
  'docs/build/STATUS_PAGE_READINESS_2026-06-03.md',
  'docs/releases/records/2026-06-03-status-page-readiness.md',
];

const REQUIRED_SNIPPETS = [
  ['src/proxy.ts', '"/status(.*)"'],
  ['src/lib/public-site/canonical-urls.ts', "status: 'https://abarva.ai/status/'"],
  ['src/app/(public)/status/page.tsx', 'No active public incident'],
  ['src/app/(public)/status/page.tsx', 'monitor-backed uptime and incident history will be connected'],
  ['src/app/(public)/status/page.tsx', 'Incident communication model'],
  ['docs/runbooks/status-page.md', 'Do not claim monitor-backed uptime until the external provider is connected.'],
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function checkFile(relativePath) {
  return {
    name: `file.${relativePath}`,
    status: fs.existsSync(path.join(ROOT, relativePath)) ? 'pass' : 'fail',
  };
}

function checkSnippet([relativePath, snippet]) {
  return {
    name: `snippet.${relativePath}.${snippet}`,
    status: read(relativePath).includes(snippet) ? 'pass' : 'fail',
  };
}

const checks = [
  ...REQUIRED_FILES.map(checkFile),
  ...REQUIRED_SNIPPETS.map(checkSnippet),
];

const summary = checks.reduce((acc, check) => {
  acc[check.status] = (acc[check.status] ?? 0) + 1;
  return acc;
}, {});
const status = checks.some((check) => check.status === 'fail') ? 'fail' : 'pass';

console.log(JSON.stringify({
  audit: 'status-page-readiness',
  status,
  summary,
  checks,
}, null, 2));

if (status !== 'pass') process.exit(1);
