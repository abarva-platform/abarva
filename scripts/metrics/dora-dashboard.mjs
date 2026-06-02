#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const [rawKey, rawValue] = token.slice(2).split('=');
    const key = rawKey.trim();
    if (rawValue !== undefined) {
      args[key] = rawValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function hoursBetween(start, end) {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
}

function percentile(values, p) {
  const numbers = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (numbers.length === 0) return null;
  const index = Math.min(numbers.length - 1, Math.ceil((p / 100) * numbers.length) - 1);
  return numbers[index];
}

function rounded(value, digits = 1) {
  return value === null || value === undefined || Number.isNaN(value)
    ? null
    : Number(value.toFixed(digits));
}

function readFixture(filePath) {
  const payload = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!Array.isArray(payload.pullRequests)) {
    throw new Error(`${filePath} must contain { "pullRequests": [...] }`);
  }
  return payload.pullRequests;
}

function fetchMergedPullRequests(limit) {
  const output = execFileSync(
    'gh',
    [
      'pr',
      'list',
      '--state',
      'merged',
      '--limit',
      String(limit),
      '--json',
      'number,title,createdAt,mergedAt,url,author,labels',
    ],
    { encoding: 'utf8' },
  );
  return JSON.parse(output);
}

function labelNames(pr) {
  return Array.isArray(pr.labels)
    ? pr.labels.map((label) => String(label.name ?? label).toLowerCase())
    : [];
}

function isFailureProxy(pr) {
  const title = String(pr.title ?? '').toLowerCase();
  const labels = labelNames(pr).join(' ');
  const text = `${title} ${labels}`;
  return /\b(revert|rollback|rolled back|hotfix|incident|outage|sev[ -]?[0-2]|p0|p1|production fix|breakage)\b/.test(text);
}

function summarize(pullRequests, { sinceIso, windowDays }) {
  const merged = pullRequests
    .filter((pr) => pr.createdAt && pr.mergedAt)
    .filter((pr) => new Date(pr.mergedAt).getTime() >= new Date(sinceIso).getTime())
    .sort((a, b) => new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime());

  const leadHours = merged.map((pr) => hoursBetween(pr.createdAt, pr.mergedAt));
  const failurePrs = merged.filter(isFailureProxy);
  const failureLeadHours = failurePrs.map((pr) => hoursBetween(pr.createdAt, pr.mergedAt));
  const weeklyDeployFrequency = windowDays > 0 ? (merged.length / windowDays) * 7 : 0;

  return {
    generatedAt: new Date().toISOString(),
    window: {
      since: sinceIso,
      days: windowDays,
    },
    counts: {
      mergedPullRequests: merged.length,
      failureProxyPullRequests: failurePrs.length,
    },
    metrics: {
      deploymentFrequencyPerWeek: rounded(weeklyDeployFrequency, 2),
      leadTimeMedianHours: rounded(percentile(leadHours, 50), 1),
      leadTimeP75Hours: rounded(percentile(leadHours, 75), 1),
      changeFailRateProxyPercent: merged.length === 0 ? null : rounded((failurePrs.length / merged.length) * 100, 1),
      mttrProxyMedianHours: rounded(percentile(failureLeadHours, 50), 1),
    },
    samples: {
      mostRecentMerged: merged.slice(-10).reverse().map((pr) => ({
        number: pr.number,
        title: pr.title,
        mergedAt: pr.mergedAt,
        leadTimeHours: rounded(hoursBetween(pr.createdAt, pr.mergedAt), 1),
        url: pr.url,
      })),
      failureProxyPullRequests: failurePrs.slice(-10).reverse().map((pr) => ({
        number: pr.number,
        title: pr.title,
        mergedAt: pr.mergedAt,
        leadTimeHours: rounded(hoursBetween(pr.createdAt, pr.mergedAt), 1),
        url: pr.url,
      })),
    },
  };
}

function renderMarkdown(summary) {
  const metric = summary.metrics;
  const count = summary.counts;
  const lines = [
    '# DORA Metrics Dashboard',
    '',
    `Generated: ${summary.generatedAt}`,
    `Window: ${summary.window.days} days since ${summary.window.since}`,
    '',
    '## Scorecard',
    '',
    '| Metric | Value | Notes |',
    '| --- | ---: | --- |',
    `| Deployment frequency | ${metric.deploymentFrequencyPerWeek ?? 'n/a'} PR merges/week | Based on merged PRs to the repository. |`,
    `| Lead time for change | ${metric.leadTimeMedianHours ?? 'n/a'} median hours | Created-at to merged-at for merged PRs. P75: ${metric.leadTimeP75Hours ?? 'n/a'} hours. |`,
    `| Change-fail rate | ${metric.changeFailRateProxyPercent ?? 'n/a'}% proxy | Rollback, revert, hotfix, incident, outage, P0, or P1 style PRs divided by merged PRs. |`,
    `| MTTR | ${metric.mttrProxyMedianHours ?? 'n/a'} median hours proxy | Created-at to merged-at for failure-proxy PRs only. |`,
    '',
    '## Counts',
    '',
    `- Merged PRs in window: ${count.mergedPullRequests}`,
    `- Failure-proxy PRs in window: ${count.failureProxyPullRequests}`,
    '',
    '## Recent Merges',
    '',
    '| PR | Lead Time | Merged | Title |',
    '| --- | ---: | --- | --- |',
    ...summary.samples.mostRecentMerged.map(
      (pr) => `| [#${pr.number}](${pr.url}) | ${pr.leadTimeHours}h | ${pr.mergedAt} | ${pr.title} |`,
    ),
    '',
    '## Failure-Proxy PRs',
    '',
    '| PR | Lead Time | Merged | Title |',
    '| --- | ---: | --- | --- |',
    ...(summary.samples.failureProxyPullRequests.length > 0
      ? summary.samples.failureProxyPullRequests.map(
          (pr) => `| [#${pr.number}](${pr.url}) | ${pr.leadTimeHours}h | ${pr.mergedAt} | ${pr.title} |`,
        )
      : ['| n/a | n/a | n/a | No failure-proxy PRs found in this window. |']),
    '',
    '## Interpretation Limits',
    '',
    '- Deployment frequency is PR merge frequency, not a verified production-deployment count.',
    '- Change-fail rate and MTTR are labeled as proxies until incident and rollback records are connected to deployments.',
    '- Use the generated JSON if a future dashboard needs chart-ready data.',
  ];
  return `${lines.join('\n')}\n`;
}

function writeOutput(filePath, contents) {
  const absolute = path.resolve(filePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents, 'utf8');
  return absolute;
}

const args = parseArgs();
const windowDays = Number.parseInt(args.days ?? '30', 10);
const limit = Number.parseInt(args.limit ?? '200', 10);
const sinceIso = args.since ?? isoDateDaysAgo(windowDays);
const pullRequests = args.fixture
  ? readFixture(args.fixture)
  : fetchMergedPullRequests(limit);
const summary = summarize(pullRequests, { sinceIso, windowDays });
const markdown = renderMarkdown(summary);

if (args.output) {
  const outputPath = writeOutput(args.output, markdown);
  console.log(`Wrote ${outputPath}`);
} else {
  process.stdout.write(markdown);
}

if (args['json-output']) {
  const jsonPath = writeOutput(args['json-output'], `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Wrote ${jsonPath}`);
}

if (args.assert && (!existsSync(args.output ?? '') || (args['json-output'] && !existsSync(args['json-output'])))) {
  throw new Error('Expected output files were not written.');
}
