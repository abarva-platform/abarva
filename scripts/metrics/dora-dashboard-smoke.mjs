#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tmp = mkdtempSync(path.join(os.tmpdir(), 'abarva-dora-'));

try {
  const fixturePath = path.join(tmp, 'prs.json');
  const markdownPath = path.join(tmp, 'dora.md');
  const jsonPath = path.join(tmp, 'dora.json');
  writeFileSync(
    fixturePath,
    JSON.stringify(
      {
        pullRequests: [
          {
            number: 1,
            title: 'feat: add release gate',
            createdAt: '2026-06-01T00:00:00Z',
            mergedAt: '2026-06-01T06:00:00Z',
            url: 'https://example.test/pull/1',
            labels: [],
          },
          {
            number: 2,
            title: 'hotfix: restore production route',
            createdAt: '2026-06-02T00:00:00Z',
            mergedAt: '2026-06-02T02:00:00Z',
            url: 'https://example.test/pull/2',
            labels: [{ name: 'incident' }],
          },
        ],
      },
      null,
      2,
    ),
  );

  execFileSync(
    'node',
    [
      'scripts/metrics/dora-dashboard.mjs',
      '--fixture',
      fixturePath,
      '--since',
      '2026-05-30T00:00:00Z',
      '--days',
      '7',
      '--output',
      markdownPath,
      '--json-output',
      jsonPath,
    ],
    { encoding: 'utf8', stdio: 'pipe' },
  );

  const markdown = readFileSync(markdownPath, 'utf8');
  const summary = JSON.parse(readFileSync(jsonPath, 'utf8'));
  if (!markdown.includes('DORA Metrics Dashboard')) throw new Error('missing markdown title');
  if (summary.counts.mergedPullRequests !== 2) throw new Error('wrong merged PR count');
  if (summary.counts.failureProxyPullRequests !== 1) throw new Error('wrong failure-proxy count');
  if (summary.metrics.leadTimeMedianHours !== 2) throw new Error('wrong median lead time');

  console.log('DORA dashboard smoke passed.');
} finally {
  await rm(tmp, { recursive: true, force: true });
}
