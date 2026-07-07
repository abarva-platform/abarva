#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];

function read(path) {
  const body = readFileSync(join(root, path), 'utf8');
  checks.push({ name: `file.${path}`, status: 'pass' });
  return body;
}

function requireSnippet(path, body, snippet) {
  checks.push({
    name: `snippet.${path}.${snippet}`,
    status: body.includes(snippet) ? 'pass' : 'fail',
  });
}

const packagePath = 'package.json';
const runbookPath = 'docs/runbooks/azure-blob-upload-pattern.md';
const releasePath = 'docs/releases/records/2026-06-03-azure-blob-upload-pattern.md';

const pkg = read(packagePath);
const runbook = read(runbookPath);
const release = read(releasePath);

[
  '"azure:blob-upload-pattern:verify"',
  'scripts/azure/verify-blob-upload-pattern.mjs',
].forEach((snippet) => requireSnippet(packagePath, pkg, snippet));

[
  'Backlog row: T036',
  'one client and one client only',
  'No shared keys',
  'Direct-to-Blob',
  'Scan before parse',
  'abarva_client_key',
  'abarva_segment_key',
  'src/lib/ingestion/azure-landing-zone-types.ts',
  'docs/runbooks/defender-storage-malware.md',
  'T036 Completion Boundary',
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  '2026-06-03-azure-blob-upload-pattern',
  'T036',
  'internal-admin',
  'Pass: `npm run azure:blob-upload-pattern:verify`',
  'does not provision live Azure resources',
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === 'fail');
console.log(
  JSON.stringify(
    {
      audit: 'azure-blob-upload-pattern',
      status: failed.length === 0 ? 'pass' : 'fail',
      summary: {
        pass: checks.length - failed.length,
        fail: failed.length,
      },
      checks,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}
