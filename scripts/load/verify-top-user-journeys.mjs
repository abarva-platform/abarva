#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

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
const runnerPath = 'scripts/load/top-user-journeys.mjs';
const workflowPath = '.github/workflows/top-user-journey-load.yml';
const runbookPath = 'docs/runbooks/top-user-journey-load-tests.md';
const releasePath = 'docs/releases/records/2026-06-03-top-user-journey-load-tests.md';

const pkg = read(packagePath);
const runner = read(runnerPath);
const workflow = read(workflowPath);
const runbook = read(runbookPath);
const release = read(releasePath);

[
  '"load:top-journeys"',
  '"load:top-journeys:check"',
].forEach((snippet) => requireSnippet(packagePath, pkg, snippet));

[
  'home-insight-command-center',
  'intelligence-grounded-query',
  'moves-approval-audit',
  'source-event-room',
  'tower-value-portfolio',
  'destructive: false',
].forEach((snippet) => requireSnippet(runnerPath, runner, snippet));

[
  'name: Top User Journey Load',
  'workflow_dispatch:',
  'npm run load:top-journeys',
  'top-user-journey-load.json',
].forEach((snippet) => requireSnippet(workflowPath, workflow, snippet));

[
  'Backlog row: T150',
  'top 5 user journeys',
  'non-destructive by default',
  'T150 Completion Rule',
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  '2026-06-03-top-user-journey-load-tests',
  'internal-admin',
  'T150',
  'Pass: `npm run load:top-journeys:check`',
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const dryRun = spawnSync(
  process.execPath,
  [
    runnerPath,
    '--base-url',
    'https://example.com',
    '--duration-seconds',
    '1',
    '--concurrency',
    '1',
    '--think-time-ms',
    '0',
    '--dry-run',
  ],
  { cwd: root, encoding: 'utf8' },
);

let dryRunJson;
try {
  dryRunJson = JSON.parse(dryRun.stdout);
} catch {
  dryRunJson = null;
}

checks.push({
  name: 'dry-run.exit-zero',
  status: dryRun.status === 0 ? 'pass' : 'fail',
});
checks.push({
  name: 'dry-run.status-pass',
  status: dryRunJson?.status === 'pass' ? 'pass' : 'fail',
});
checks.push({
  name: 'dry-run.five-journeys',
  status: dryRunJson?.workload?.journeys?.length === 5 ? 'pass' : 'fail',
});
checks.push({
  name: 'dry-run.non-destructive',
  status: dryRunJson?.workload?.destructive === false ? 'pass' : 'fail',
});

const failed = checks.filter((check) => check.status === 'fail');
console.log(
  JSON.stringify(
    {
      audit: 'top-user-journey-load-tests',
      status: failed.length === 0 ? 'pass' : 'fail',
      summary: {
        pass: checks.length - failed.length,
        fail: failed.length,
      },
      checks,
      dryRun: dryRunJson,
      stderr: dryRun.stderr,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}
