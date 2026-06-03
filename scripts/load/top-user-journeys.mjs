#!/usr/bin/env node
// T150 top-journey load harness.
//
// Dependency-free by design: Node 24 fetch is enough for CI contract checks and
// authenticated pre-prod/FakeClient runs. The default workload is read-heavy and
// non-destructive; write/upload stress belongs in separate approved drills.

import { performance } from 'node:perf_hooks';

const DEFAULT_JOURNEYS = [
  {
    id: 'home-insight-command-center',
    owner: 'all-users',
    description: 'Home command center, queue, and notification polling.',
    steps: [
      { name: 'home', method: 'GET', path: '/home' },
      { name: 'home-queue', method: 'GET', path: '/home/queue' },
      { name: 'notifications', method: 'GET', path: '/api/notifications' },
    ],
  },
  {
    id: 'intelligence-grounded-query',
    owner: 'operator',
    description: 'Sentinel/Intelligence page load plus tenant-corpus query.',
    steps: [
      { name: 'intelligence-ask', method: 'GET', path: '/intelligence/ask' },
      {
        name: 'genome-query',
        method: 'POST',
        path: '/api/intelligence/query',
        body: {
          query: 'Summarize the highest-priority operational risks grounded in this tenant corpus.',
        },
      },
    ],
  },
  {
    id: 'moves-approval-audit',
    owner: 'client-admin',
    description: 'Moves program surface, admin approval queue, and client audit export.',
    steps: [
      { name: 'programs', method: 'GET', path: '/programs' },
      { name: 'admin-approvals-page', method: 'GET', path: '/platform/admin/approvals' },
      { name: 'approval-queue-api', method: 'GET', path: '/api/admin/programs/approvals' },
      {
        name: 'approval-export-json',
        method: 'GET',
        path: '/api/admin/programs/approvals/export?format=json&limit=25',
      },
    ],
  },
  {
    id: 'source-event-room',
    owner: 'sourcing-lead',
    description: 'Source event workbench and deliverable workspace navigation.',
    steps: [
      { name: 'source-home', method: 'GET', path: '/source' },
      { name: 'source-home-alias', method: 'GET', path: '/home/source' },
      { name: 'source-work-items', method: 'GET', path: '/api/v1/source/work-items' },
    ],
  },
  {
    id: 'tower-value-portfolio',
    owner: 'executive',
    description: 'Tower portfolio surface and value-state API.',
    steps: [
      { name: 'tower', method: 'GET', path: '/tower' },
      { name: 'tower-portfolio', method: 'GET', path: '/tower/portfolio' },
      { name: 'tower-value-states', method: 'GET', path: '/api/tower/value-states' },
    ],
  },
];

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.TOP_JOURNEY_BASE_URL ?? process.env.BASE_URL ?? '',
    cookie: process.env.TOP_JOURNEY_COOKIE ?? '',
    durationSeconds: 60,
    concurrency: 5,
    timeoutMs: 20_000,
    thinkTimeMs: 150,
    p95TargetMs: 8_000,
    maxErrorRate: 0,
    require2xx: false,
    dryRun: false,
    journeyIds: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const [key, inlineValue] = raw.split('=', 2);
    const nextValue = inlineValue ?? argv[index + 1];
    const consume = inlineValue === undefined;

    switch (key) {
      case '--base-url':
        args.baseUrl = nextValue;
        if (consume) index += 1;
        break;
      case '--cookie':
        args.cookie = nextValue;
        if (consume) index += 1;
        break;
      case '--duration-seconds':
        args.durationSeconds = Number(nextValue);
        if (consume) index += 1;
        break;
      case '--concurrency':
        args.concurrency = Number(nextValue);
        if (consume) index += 1;
        break;
      case '--timeout-ms':
        args.timeoutMs = Number(nextValue);
        if (consume) index += 1;
        break;
      case '--think-time-ms':
        args.thinkTimeMs = Number(nextValue);
        if (consume) index += 1;
        break;
      case '--p95-target-ms':
        args.p95TargetMs = Number(nextValue);
        if (consume) index += 1;
        break;
      case '--max-error-rate':
        args.maxErrorRate = Number(nextValue);
        if (consume) index += 1;
        break;
      case '--journeys':
        args.journeyIds = nextValue.split(',').map((value) => value.trim()).filter(Boolean);
        if (consume) index += 1;
        break;
      case '--require-2xx':
        args.require2xx = true;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      default:
        throw new Error(`Unknown argument: ${raw}`);
    }
  }

  return args;
}

function assertConfig(args, journeys) {
  if (!args.baseUrl) {
    throw new Error('Missing --base-url or TOP_JOURNEY_BASE_URL.');
  }

  try {
    new URL(args.baseUrl);
  } catch {
    throw new Error(`Invalid base URL: ${args.baseUrl}`);
  }

  for (const [name, value] of [
    ['durationSeconds', args.durationSeconds],
    ['concurrency', args.concurrency],
    ['timeoutMs', args.timeoutMs],
    ['thinkTimeMs', args.thinkTimeMs],
    ['p95TargetMs', args.p95TargetMs],
    ['maxErrorRate', args.maxErrorRate],
  ]) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid ${name}: ${value}`);
    }
  }

  if (args.concurrency < 1) {
    throw new Error('Concurrency must be at least 1.');
  }

  if (journeys.length === 0) {
    throw new Error('At least one journey is required.');
  }
}

function selectJourneys(args) {
  if (args.journeyIds.length === 0) return DEFAULT_JOURNEYS;
  const selected = new Set(args.journeyIds);
  const journeys = DEFAULT_JOURNEYS.filter((journey) => selected.has(journey.id));
  const found = new Set(journeys.map((journey) => journey.id));
  const missing = args.journeyIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error(`Unknown journey id(s): ${missing.join(', ')}`);
  }
  return journeys;
}

function targetUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function statusFailure(sample, require2xx) {
  if (require2xx) return sample.status < 200 || sample.status >= 300;
  return sample.status >= 500;
}

async function requestStep(args, journey, step) {
  const started = performance.now();
  const headers = {
    'user-agent': 'abarva-top-journey-load/1.0',
    accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
  };
  let body;

  if (args.cookie) {
    headers.cookie = args.cookie;
  }

  if (step.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(step.body);
  }

  const response = await fetch(targetUrl(args.baseUrl, step.path), {
    method: step.method,
    redirect: 'manual',
    headers,
    body,
    signal: AbortSignal.timeout(args.timeoutMs),
  });

  const latencyMs = performance.now() - started;
  await response.arrayBuffer().catch(() => undefined);

  return {
    journeyId: journey.id,
    step: step.name,
    method: step.method,
    path: step.path,
    status: response.status,
    latencyMs: Number(latencyMs.toFixed(1)),
    location: response.headers.get('location') ?? undefined,
  };
}

function summarize(args, journeys, samples, errors, startedAt, completedAt) {
  const latencies = samples.map((sample) => sample.latencyMs);
  const failedStatuses = samples.filter((sample) => statusFailure(sample, args.require2xx));
  const totalAttempts = samples.length + errors.length;
  const totalFailures = failedStatuses.length + errors.length;
  const errorRate = totalAttempts ? totalFailures / totalAttempts : 1;
  const p95Ms = Number(percentile(latencies, 95).toFixed(1));

  const byJourney = {};
  const byStep = {};
  for (const sample of samples) {
    byJourney[sample.journeyId] ??= { count: 0, failedStatuses: 0, latencies: [], statuses: {} };
    byJourney[sample.journeyId].count += 1;
    byJourney[sample.journeyId].statuses[sample.status] =
      (byJourney[sample.journeyId].statuses[sample.status] ?? 0) + 1;
    byJourney[sample.journeyId].failedStatuses += statusFailure(sample, args.require2xx) ? 1 : 0;
    byJourney[sample.journeyId].latencies.push(sample.latencyMs);

    const stepKey = `${sample.journeyId}.${sample.step}`;
    byStep[stepKey] ??= { count: 0, failedStatuses: 0, latencies: [], statuses: {} };
    byStep[stepKey].count += 1;
    byStep[stepKey].statuses[sample.status] = (byStep[stepKey].statuses[sample.status] ?? 0) + 1;
    byStep[stepKey].failedStatuses += statusFailure(sample, args.require2xx) ? 1 : 0;
    byStep[stepKey].latencies.push(sample.latencyMs);
  }

  for (const collection of [byJourney, byStep]) {
    for (const value of Object.values(collection)) {
      const stepLatencies = value.latencies;
      value.avgMs = stepLatencies.length
        ? Number((stepLatencies.reduce((sum, latency) => sum + latency, 0) / stepLatencies.length).toFixed(1))
        : 0;
      value.p95Ms = Number(percentile(stepLatencies, 95).toFixed(1));
      delete value.latencies;
    }
  }

  return {
    status: totalFailures === 0 && p95Ms <= args.p95TargetMs && errorRate <= args.maxErrorRate ? 'pass' : 'fail',
    workload: {
      name: 'top-user-journeys',
      backlog: 'T150',
      destructive: false,
      authenticated: Boolean(args.cookie),
      require2xx: args.require2xx,
      journeys: journeys.map(({ id, owner, description, steps }) => ({
        id,
        owner,
        description,
        steps: steps.map((step) => `${step.method} ${step.path}`),
      })),
    },
    run: {
      startedAt,
      completedAt,
      baseUrl: args.baseUrl,
      durationSeconds: args.durationSeconds,
      concurrency: args.concurrency,
      timeoutMs: args.timeoutMs,
      thinkTimeMs: args.thinkTimeMs,
      p95TargetMs: args.p95TargetMs,
      maxErrorRate: args.maxErrorRate,
    },
    summary: {
      totalAttempts,
      samples: samples.length,
      requestErrors: errors.length,
      failedStatuses: failedStatuses.length,
      errorRate: Number(errorRate.toFixed(4)),
      avgMs: latencies.length
        ? Number((latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length).toFixed(1))
        : 0,
      p50Ms: Number(percentile(latencies, 50).toFixed(1)),
      p95Ms,
      maxMs: Number((latencies.length ? Math.max(...latencies) : 0).toFixed(1)),
    },
    byJourney,
    byStep,
    errors: errors.slice(0, 20),
  };
}

async function run(args) {
  const journeys = selectJourneys(args);
  assertConfig(args, journeys);

  if (args.dryRun) {
    return {
      status: 'pass',
      dryRun: true,
      workload: {
        name: 'top-user-journeys',
        backlog: 'T150',
        destructive: false,
        authenticated: Boolean(args.cookie),
        require2xx: args.require2xx,
        journeys: journeys.map(({ id, owner, description, steps }) => ({
          id,
          owner,
          description,
          steps: steps.map((step) => `${step.method} ${step.path}`),
        })),
      },
      run: {
        baseUrl: args.baseUrl,
        durationSeconds: args.durationSeconds,
        concurrency: args.concurrency,
        timeoutMs: args.timeoutMs,
        thinkTimeMs: args.thinkTimeMs,
        p95TargetMs: args.p95TargetMs,
        maxErrorRate: args.maxErrorRate,
      },
    };
  }

  const startedAt = new Date().toISOString();
  const deadline = performance.now() + args.durationSeconds * 1000;
  const samples = [];
  const errors = [];
  let sequence = 0;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function worker() {
    while (performance.now() < deadline) {
      const journey = journeys[sequence % journeys.length];
      sequence += 1;
      for (const step of journey.steps) {
        try {
          samples.push(await requestStep(args, journey, step));
        } catch (error) {
          errors.push({
            journeyId: journey.id,
            step: step.name,
            path: step.path,
            message: error instanceof Error ? error.message : String(error),
          });
        }
        if (args.thinkTimeMs > 0) {
          await sleep(args.thinkTimeMs);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));
  return summarize(args, journeys, samples, errors, startedAt, new Date().toISOString());
}

try {
  const report = await run(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === 'pass' ? 0 : 1);
} catch (error) {
  console.error(JSON.stringify({
    status: 'fail',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(2);
}
