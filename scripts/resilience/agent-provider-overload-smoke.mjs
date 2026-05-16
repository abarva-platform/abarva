#!/usr/bin/env node
// L9 provider-overload smoke.
//
// Authenticates as a demo user, calls /api/chat/agent with the guarded
// provider-overload drill header, and asserts the response is a graceful
// capacity-limited fallback rather than a raw stream error.

import { performance } from 'node:perf_hooks';

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.AZURE_L9_BASE_URL ?? process.env.BASE_URL ?? '',
    drillToken: process.env.AZURE_L9_PROVIDER_DRILL_TOKEN ?? process.env.L9_PROVIDER_OVERLOAD_DRILL_TOKEN ?? '',
    demoEmail: process.env.AZURE_L9_DEMO_EMAIL ?? 'cio@apex-retail.example.com',
    demoPassword: process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!',
    demoAccessCode: process.env.E2E_DEMO_ACCESS_CODE ?? '424242',
    agentName: 'Sentinel',
    surface: '/intelligence',
    message: 'L9 provider overload drill: tell me the top AI decision for Apex.',
    timeoutMs: 30_000,
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
      case '--drill-token':
        args.drillToken = nextValue;
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
      case '--agent-name':
        args.agentName = nextValue;
        if (consume) index += 1;
        break;
      case '--surface':
        args.surface = nextValue;
        if (consume) index += 1;
        break;
      case '--message':
        args.message = nextValue;
        if (consume) index += 1;
        break;
      case '--timeout-ms':
        args.timeoutMs = Number(nextValue);
        if (consume) index += 1;
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
  if (!args.baseUrl) throw new Error('Missing --base-url or AZURE_L9_BASE_URL.');
  try {
    new URL(args.baseUrl);
  } catch {
    throw new Error(`Invalid base URL: ${args.baseUrl}`);
  }
  if (!args.dryRun && !args.drillToken) {
    throw new Error('Missing --drill-token or AZURE_L9_PROVIDER_DRILL_TOKEN.');
  }
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 1) {
    throw new Error(`Invalid --timeout-ms: ${args.timeoutMs}`);
  }
}

function targetUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
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
        agentName: args.agentName,
        surface: args.surface,
      },
    };
  }

  const started = performance.now();
  const cookie = await mintDemoCookieHeader(args);
  const response = await fetch(targetUrl(args.baseUrl, '/api/chat/agent'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
      'x-abarva-l9-provider-drill-token': args.drillToken,
      'user-agent': 'abarva-l9-provider-overload-smoke/1.0',
    },
    body: JSON.stringify({
      message: args.message,
      agentName: args.agentName,
      surface: args.surface,
      tenantName: 'Apex Retail Group',
      surfaceContext: {},
      conversationHistory: [],
    }),
    signal: AbortSignal.timeout(args.timeoutMs),
  });

  const body = await response.text();
  const latencyMs = Number((performance.now() - started).toFixed(1));
  const hasFallback = /temporarily capacity-limited/i.test(body)
    && /not changed tenant data/i.test(body)
    && /retry in a moment/i.test(body);
  const leakedRawError = /\[stream error:|Simulated model provider overload|529/i.test(body);

  return {
    status: response.ok && hasFallback && !leakedRawError ? 'pass' : 'fail',
    target: {
      baseUrl: args.baseUrl,
      agentName: args.agentName,
      surface: args.surface,
      demoEmail: args.demoEmail,
    },
    response: {
      status: response.status,
      latencyMs,
      hasFallback,
      leakedRawError,
      excerpt: body.replace(/\s+/g, ' ').slice(0, 600),
    },
  };
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
