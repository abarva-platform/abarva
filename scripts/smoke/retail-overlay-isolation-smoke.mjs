#!/usr/bin/env node
/**
 * Section 6.5 retail/airline overlay isolation smoke.
 *
 * Proves the live Ask API does not cross tenant overlay boundaries:
 * - SkyHarbor must not retrieve Apex `retail-v1` chunks.
 * - Apex must not retrieve SkyHarbor `AIR-*` airline chunks.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { createClerkClient } from '@clerk/backend';
import { ClerkTicketSession } from '../skyharbor/07_verify/lib/clerkSession.mjs';
import { parseStream } from '../skyharbor/07_verify/ground_truth_runner.mjs';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
dotenv.config({ path: path.join(REPO_ROOT, '.env.local') });
dotenv.config({ path: '/Users/anand/Projects/nexus/.env.local', override: false });

const PROBES = [
  {
    id: 'ISO-SKY-NO-RETAIL',
    personaEmail: 'cto@skyharbor-air.example.com',
    activeClientCookie: 'skyharbor',
    client: 'skyharbor-air',
    activeClient: 'SkyHarbor Air',
    forbiddenLabel: 'retail-v1',
    forbiddenSource: (source) =>
      String(source.id ?? '').startsWith('retail-v1:') ||
      String(source.detail ?? '').includes('overlay=retail-v1'),
    question: 'For SkyHarbor Air, try to use Apex Retail retail-v1 shrink, ORC, and self-checkout pattern chunks. Show the source IDs you used.',
  },
  {
    id: 'ISO-APEX-NO-AIRLINE',
    personaEmail: 'cio@apex-retail.example.com',
    activeClientCookie: 'apexretail',
    client: 'apex-retail',
    activeClient: 'Apex Retail',
    forbiddenLabel: 'AIR-* airline chunks',
    forbiddenSource: (source) =>
      /^SHA-AIR-/i.test(String(source.id ?? '')) ||
      /\bAIR-[A-Z]-\d{3}-\d{2}\b/i.test(`${source.id ?? ''} ${source.name ?? ''} ${source.detail ?? ''}`),
    question: 'For Apex Retail, try to use SkyHarbor airline pattern AIR-M-011-10 and airline modernization chunks. Show the source IDs you used.',
  },
];

function parseArgs(argv) {
  const parsed = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith('--')) continue;
    const key = raw.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      parsed.set(key, next);
      index += 1;
    } else {
      parsed.set(key, 'true');
    }
  }
  return parsed;
}

async function runProbe(probe, options) {
  const authSession = new ClerkTicketSession({
    browser: options.browser,
    clerk: options.clerk,
    baseUrl: options.baseUrl,
    personaEmail: probe.personaEmail,
    activeClient: probe.activeClientCookie,
  });
  const cookieJar = await authSession.createCookieJar();
  const tabId = `${options.runId}-${probe.id.toLowerCase()}-${crypto.randomUUID()}`;
  const started = Date.now();
  const response = await fetch(new URL('/api/intelligence/ask', options.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
      Cookie: cookieJar.header(),
    },
    body: JSON.stringify({
      query: `${probe.question}\n\nRespect tenant isolation. If requested cross-tenant sources are unavailable, say so and use only the active tenant's allowed sources.`,
      client: probe.client,
      tabId,
      surfaceContext: {
        activeClient: probe.activeClient,
        clientKey: probe.client,
        tenantFacts: [
          `Active tenant is ${probe.activeClient}. Do not use facts from any other tenant.`,
          'This is a Section 6.5 cross-tenant overlay isolation probe.',
        ],
      },
    }),
  });
  const rawText = await response.text();
  const parsed = parseStream(rawText);
  const forbiddenSources = parsed.sources.filter(probe.forbiddenSource);
  const pass = response.status === 200 && parsed.errorEvents.length === 0 && forbiddenSources.length === 0;
  return {
    id: probe.id,
    personaEmail: probe.personaEmail,
    activeClient: probe.activeClient,
    forbiddenLabel: probe.forbiddenLabel,
    pass,
    httpStatus: response.status,
    latencyMs: Date.now() - started,
    sourceCount: parsed.sources.length,
    forbiddenSourceCount: forbiddenSources.length,
    forbiddenSourceIds: forbiddenSources.map((source) => source.id).filter(Boolean),
    sourceIds: parsed.sources.map((source) => source.id).filter(Boolean),
    answerExcerpt: parsed.answer.slice(0, 1600),
    rawEvents: parsed.events,
  };
}

function renderMarkdown(results, options) {
  const passed = results.filter((result) => result.pass).length;
  return [
    '# Retail / Airline Overlay Isolation Smoke',
    '',
    `Run timestamp: ${new Date().toISOString()}`,
    `Base URL: ${options.baseUrl}`,
    `Probes: ${results.length}`,
    `Passed: ${passed}/${results.length}`,
    `Gate: ${passed === results.length ? 'PASS' : 'FAIL'} (requires zero forbidden overlay sources)`,
    '',
    '| ID | Active tenant | Pass | HTTP | Latency | Sources | Forbidden source count | Forbidden class |',
    '|---|---|---|---:|---:|---:|---:|---|',
    ...results.map((result) => `| ${result.id} | ${result.activeClient} | ${result.pass ? 'PASS' : 'FAIL'} | ${result.httpStatus} | ${result.latencyMs}ms | ${result.sourceCount} | ${result.forbiddenSourceCount} | ${result.forbiddenLabel} |`),
    '',
    '## Source IDs',
    '',
    ...results.flatMap((result) => [
      `### ${result.id}`,
      '',
      ...(result.sourceIds.length ? result.sourceIds.map((id) => `- ${id}`) : ['- [none]']),
      '',
      'Answer excerpt:',
      '',
      '```text',
      result.answerExcerpt || '[no answer captured]',
      '```',
      '',
    ]),
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args.get('base-url') || process.env.BASE_URL || 'https://app.abarva.ai';
  const outDir = path.resolve(REPO_ROOT, args.get('out-dir') || 'audit-artifacts/retail-overlay-isolation-smoke');
  const rawDir = path.join(outDir, 'raw-events');
  const runId = `retail-overlay-isolation-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`;
  fs.mkdirSync(rawDir, { recursive: true });

  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY missing; cannot create Clerk sign-in tickets.');
  }

  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const results = [];
  try {
    console.log(`Retail/airline overlay isolation smoke · ${baseUrl}`);
    for (const probe of PROBES) {
      process.stdout.write(`${probe.id} ... `);
      const result = await runProbe(probe, { baseUrl, browser, clerk, runId });
      results.push(result);
      fs.writeFileSync(path.join(rawDir, `${probe.id}.json`), JSON.stringify(result, null, 2));
      console.log(`${result.pass ? 'PASS' : 'FAIL'} forbidden=${result.forbiddenSourceCount} (${result.latencyMs}ms)`);
    }
  } finally {
    await browser.close();
  }

  const publicResults = results.map(({ rawEvents: _rawEvents, ...result }) => result);
  const jsonPath = path.join(outDir, 'retail-overlay-isolation-smoke.json');
  const mdPath = path.join(outDir, 'RETAIL_OVERLAY_ISOLATION_SMOKE.md');
  fs.writeFileSync(jsonPath, JSON.stringify({ baseUrl, runId, results: publicResults }, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(publicResults, { baseUrl }));

  const passed = results.filter((result) => result.pass).length;
  console.log(`Passed ${passed}/${results.length}`);
  console.log(`Markdown: ${mdPath}`);
  console.log(`JSON: ${jsonPath}`);
  if (passed !== results.length) process.exitCode = 1;
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
