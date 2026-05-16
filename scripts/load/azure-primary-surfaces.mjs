#!/usr/bin/env node
// L8 Azure primary-surface load smoke.
//
// Dependency-free by design: this runs with Node 24's built-in fetch and can be
// used locally or in GitHub Actions before we decide whether k6/Artillery is
// worth adding. It measures HTTP stability and p95 latency across the primary
// AbarVa surfaces. Authenticated cookies can be supplied through
// AZURE_L8_COOKIE / --cookie for true app-surface load; without a cookie it
// still catches public/runtime 5xx and redirect latency regressions.

import { performance } from 'node:perf_hooks';

const DEFAULT_PATHS = ['/', '/home', '/intelligence', '/strategic-moves', '/source', '/tower'];

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.AZURE_L8_BASE_URL ?? process.env.BASE_URL ?? '',
    cookie: process.env.AZURE_L8_COOKIE ?? '',
    authMode: process.env.AZURE_L8_AUTH_MODE ?? 'cookie',
    demoEmail: process.env.AZURE_L8_DEMO_EMAIL ?? 'cio@apex-retail.example.com',
    demoPassword: process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!',
    demoAccessCode: process.env.E2E_DEMO_ACCESS_CODE ?? '424242',
    cookieRefreshSeconds: 45,
    durationSeconds: 60,
    concurrency: 5,
    timeoutMs: 15_000,
    thinkTimeMs: 50,
    p95TargetMs: 8_000,
    maxErrorRate: 0,
    paths: DEFAULT_PATHS,
    require2xx: false,
    dryRun: false,
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
      case '--auth-mode':
        args.authMode = nextValue;
        if (consume) index += 1;
        break;
      case '--demo-email':
        args.demoEmail = nextValue;
        if (consume) index += 1;
        break;
      case '--demo-password':
        args.demoPassword = nextValue;
        if (consume) index += 1;
        break;
      case '--demo-access-code':
        args.demoAccessCode = nextValue;
        if (consume) index += 1;
        break;
      case '--cookie-refresh-seconds':
        args.cookieRefreshSeconds = Number(nextValue);
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
      case '--paths':
        args.paths = nextValue.split(',').map((path) => path.trim()).filter(Boolean);
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

function assertConfig(args) {
  if (!args.baseUrl) {
    throw new Error('Missing --base-url or AZURE_L8_BASE_URL.');
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
    ['cookieRefreshSeconds', args.cookieRefreshSeconds],
  ]) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid ${name}: ${value}`);
    }
  }

  if (args.concurrency < 1) {
    throw new Error('Concurrency must be at least 1.');
  }

  if (args.paths.length === 0) {
    throw new Error('At least one path is required.');
  }

  if (!['cookie', 'demo-sign-in'].includes(args.authMode)) {
    throw new Error(`Invalid auth mode: ${args.authMode}`);
  }
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

function summarize(args, samples, errors, startedAt, completedAt) {
  const latencies = samples.map((sample) => sample.latencyMs);
  const statusCounts = {};
  const byPath = {};

  for (const sample of samples) {
    statusCounts[sample.status] = (statusCounts[sample.status] ?? 0) + 1;
    byPath[sample.path] ??= { count: 0, statuses: {}, p95Ms: 0, avgMs: 0, latencies: [] };
    byPath[sample.path].count += 1;
    byPath[sample.path].statuses[sample.status] = (byPath[sample.path].statuses[sample.status] ?? 0) + 1;
    byPath[sample.path].latencies.push(sample.latencyMs);
  }

  for (const value of Object.values(byPath)) {
    const pathLatencies = value.latencies;
    value.avgMs = pathLatencies.length
      ? Number((pathLatencies.reduce((sum, latency) => sum + latency, 0) / pathLatencies.length).toFixed(1))
      : 0;
    value.p95Ms = Number(percentile(pathLatencies, 95).toFixed(1));
    delete value.latencies;
  }

  const fiveXx = samples.filter((sample) => sample.status >= 500).length;
  const non2xx = samples.filter((sample) => sample.status < 200 || sample.status >= 300).length;
  const totalFailures = errors.length + fiveXx + (args.require2xx ? non2xx : 0);
  const totalAttempts = samples.length + errors.length;
  const errorRate = totalAttempts ? totalFailures / totalAttempts : 1;
  const p95Ms = Number(percentile(latencies, 95).toFixed(1));
  const avgMs = latencies.length
    ? Number((latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length).toFixed(1))
    : 0;

  return {
    status: totalFailures === 0 && p95Ms <= args.p95TargetMs && errorRate <= args.maxErrorRate ? 'pass' : 'fail',
    target: {
      baseUrl: args.baseUrl,
      authenticated: Boolean(args.cookie),
      paths: args.paths,
      require2xx: args.require2xx,
    },
    run: {
      startedAt,
      completedAt,
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
      fiveXx,
      non2xx,
      errorRate: Number(errorRate.toFixed(4)),
      avgMs,
      p50Ms: Number(percentile(latencies, 50).toFixed(1)),
      p95Ms,
      maxMs: Number((latencies.length ? Math.max(...latencies) : 0).toFixed(1)),
      statusCounts,
    },
    byPath,
    errors: errors.slice(0, 20),
  };
}

async function requestOnce(args, path) {
  const started = performance.now();
  const response = await fetch(targetUrl(args.baseUrl, path), {
    redirect: 'manual',
    headers: args.cookie
      ? { cookie: args.cookie, 'user-agent': 'abarva-azure-l8-load-smoke/1.0' }
      : { 'user-agent': 'abarva-azure-l8-load-smoke/1.0' },
    signal: AbortSignal.timeout(args.timeoutMs),
  });
  const latencyMs = performance.now() - started;
  await response.arrayBuffer().catch(() => undefined);
  return {
    path,
    status: response.status,
    latencyMs: Number(latencyMs.toFixed(1)),
    location: response.headers.get('location') ?? undefined,
  };
}

async function typeCredential(page, placeholder, value) {
  const field = page.getByPlaceholder(placeholder);
  await field.fill('');
  await field.click();
  await page.keyboard.type(value, { delay: 4 });
  const actual = await field.inputValue();
  if (actual !== value) {
    throw new Error(`Credential field did not accept expected value for ${placeholder}`);
  }
}

async function mintDemoCookieHeader(args) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(targetUrl(args.baseUrl, '/sign-in'), { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder(/name@company.com/i).waitFor({ state: 'visible', timeout: 30_000 });
    await page.waitForFunction(
      () => Boolean(globalThis.Clerk?.loaded),
      null,
      { timeout: 30_000 },
    );
    await typeCredential(page, /name@company.com/i, args.demoEmail);
    await typeCredential(page, /Password from invite/i, args.demoPassword);
    await typeCredential(page, /6-digit code/i, args.demoAccessCode);
    await page.getByRole('button', { name: /sign in|continue/i }).click();
    await page.waitForURL(/\/home/, { timeout: 30_000 });
    await page.waitForFunction(
      () => document.cookie.includes('__session='),
      null,
      { timeout: 30_000 },
    );
    const cookies = await context.cookies(args.baseUrl);
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  } finally {
    await context.close();
    await browser.close();
  }
}

async function run(args) {
  assertConfig(args);

  if (args.dryRun) {
    return {
      status: 'pass',
      dryRun: true,
      target: {
        baseUrl: args.baseUrl,
        authenticated: Boolean(args.cookie) || args.authMode === 'demo-sign-in',
        paths: args.paths,
        require2xx: args.require2xx,
      },
      run: {
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
  const authEvents = [];
  let sequence = 0;
  let refreshPromise = null;

  async function refreshDemoCookie(reason) {
    const started = performance.now();
    args.cookie = await mintDemoCookieHeader(args);
    authEvents.push({
      reason,
      at: new Date().toISOString(),
      durationMs: Number((performance.now() - started).toFixed(1)),
    });
  }

  if (args.authMode === 'demo-sign-in') {
    await refreshDemoCookie('initial');
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function maybeRefreshCookie() {
    if (args.authMode !== 'demo-sign-in') return;
    if (args.cookieRefreshSeconds <= 0) return;
    const last = authEvents.at(-1);
    const lastAt = last ? Date.parse(last.at) : 0;
    const ageMs = Date.now() - lastAt;
    if (ageMs < args.cookieRefreshSeconds * 1000) return;
    if (!refreshPromise) {
      refreshPromise = refreshDemoCookie('periodic').finally(() => {
        refreshPromise = null;
      });
    }
    await refreshPromise;
  }

  async function worker() {
    while (performance.now() < deadline) {
      await maybeRefreshCookie();
      const path = args.paths[sequence % args.paths.length];
      sequence += 1;
      try {
        samples.push(await requestOnce(args, path));
      } catch (error) {
        errors.push({
          path,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      if (args.thinkTimeMs > 0) {
        await sleep(args.thinkTimeMs);
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));
  const report = summarize(args, samples, errors, startedAt, new Date().toISOString());
  report.auth = {
    mode: args.authMode,
    demoEmail: args.authMode === 'demo-sign-in' ? args.demoEmail : undefined,
    refreshSeconds: args.authMode === 'demo-sign-in' ? args.cookieRefreshSeconds : undefined,
    events: authEvents,
  };
  return report;
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
