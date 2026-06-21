#!/usr/bin/env node
/**
 * Section 6.4 retail expert-consultant gauntlet.
 *
 * Runs the five Packet 35 expert-depth tests through the live Ask API as the
 * Apex CIO persona. The grader is intentionally transparent and conservative:
 * each row must show retail-v1 source grounding plus the domain-specific
 * signals required by the backlog.
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

const TESTS = [
  {
    id: 'EXPERT-T1',
    name: 'Vocabulary fluency',
    question: 'Explain how Apex should reason about shrink, ORC, and self-checkout risk. Use retail language, not generic AI risk language.',
    checks: [
      ['mentions shrink', (answer) => /\bshrink\b/i.test(answer)],
      ['mentions ORC / organized retail crime', (answer) => /\bORC\b|organized retail crime/i.test(answer)],
      ['mentions self-checkout', (answer) => /self[-\s]?checkout/i.test(answer)],
    ],
  },
  {
    id: 'EXPERT-T2',
    name: 'Vendor landscape depth',
    question: 'Compare Manhattan, Oracle, IBM Sterling, Salesforce, and Commerce Cloud for Apex omnichannel order management and commerce modernization.',
    checks: [
      ['mentions Manhattan', (answer) => /Manhattan/i.test(answer)],
      ['mentions Oracle', (answer) => /Oracle/i.test(answer)],
      ['mentions IBM Sterling', (answer) => /IBM Sterling|Sterling OMS/i.test(answer)],
      ['mentions Salesforce', (answer) => /Salesforce/i.test(answer)],
      ['mentions Commerce Cloud', (answer) => /Commerce Cloud|SCC\b/i.test(answer)],
    ],
  },
  {
    id: 'EXPERT-T3',
    name: 'Time-horizon awareness',
    question: 'How should Apex sequence Q3 vs Q1 decisions for seasonal inventory, labor planning, promotions, and FY budget windows?',
    checks: [
      ['mentions Q1', (answer) => /\bQ1\b/i.test(answer)],
      ['mentions Q3', (answer) => /\bQ3\b/i.test(answer)],
      ['mentions seasonal cycle', (answer) => /seasonal|season/i.test(answer)],
      ['mentions budget window', (answer) => /budget|FY|fiscal/i.test(answer)],
    ],
  },
  {
    id: 'EXPERT-T4',
    name: 'Peer benchmarking specificity',
    question: 'Give anonymized peer benchmarking for Apex retail transformation, including dollar ranges, basis-point ranges, and timeframes where defensible.',
    checks: [
      ['mentions peer/anonymized benchmark', (answer) => /peer|anonymized|benchmark/i.test(answer)],
      ['includes dollar range', (answer) => /\$[0-9][0-9.,]*\s*(?:M|B|million|billion)?(?:\s*[-–]\s*\$?[0-9])?/i.test(answer)],
      ['includes basis-point range', (answer) => /basis[-\s]?point|bps|\b[0-9]{2,4}\s*[-–]\s*[0-9]{2,4}\s*(?:bp|basis)/i.test(answer)],
      ['includes timeframe', (answer) => /\b(?:Q[1-4]|month|months|year|years|FY20[0-9]{2}|18-month|24-month)\b/i.test(answer)],
    ],
  },
  {
    id: 'EXPERT-T5',
    name: 'Counter-intuitive reasoning',
    question: 'Give at least three substantive counter-arguments for why scaling retail media or personalization might be the wrong move for Apex right now.',
    checks: [
      ['frames counter-arguments', (answer) => /counter|wrong move|push back|argument/i.test(answer)],
      ['has at least three distinct arguments', (answer) => countArgumentMarkers(answer) >= 3],
      ['mentions retail media', (answer) => /retail media/i.test(answer)],
      ['mentions personalization', (answer) => /personalization/i.test(answer)],
    ],
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

function countArgumentMarkers(answer) {
  const numbered = (answer.match(/\([1-9]\)|(?:^|\s)[1-9]\./g) ?? []).length;
  const ordinal = (answer.match(/\b(first|second|third|fourth|fifth)\b/gi) ?? []).length;
  return Math.max(numbered, ordinal);
}

function overlaySources(sources) {
  return sources.filter((source) =>
    String(source.id ?? '').startsWith('retail-v1:') ||
    String(source.detail ?? '').includes('overlay=retail-v1'));
}

function patternCitations(sources) {
  return sources.filter((source) =>
    source.type === 'PATTERN' &&
    (
      /^retail-v1:/i.test(String(source.id ?? '')) ||
      /\bpattern_id=[A-Z]{1,2}\.\d+\.\d{2}\b/i.test(String(source.detail ?? '')) ||
      /\b[A-Z]{1,2}\.\d+\.\d{2}\b/.test(`${source.name ?? ''} ${source.detail ?? ''}`)
    ));
}

function grade(test, parsed, httpStatus, latencyMs) {
  const overlay = overlaySources(parsed.sources);
  const citations = patternCitations(parsed.sources);
  const checkResults = test.checks.map(([label, fn]) => ({
    label,
    pass: Boolean(fn(parsed.answer)),
  }));
  const groundingChecks = [
    { label: 'has >=3 retail-v1 chunks', pass: overlay.length >= 3 },
    { label: 'has >=2 pattern citations', pass: citations.length >= 2 },
    { label: 'http 200', pass: httpStatus === 200 },
    { label: 'no streamed errors', pass: parsed.errorEvents.length === 0 },
  ];
  const allChecks = [...groundingChecks, ...checkResults];
  return {
    pass: allChecks.every((item) => item.pass),
    overlayChunkCount: overlay.length,
    patternCitationCount: citations.length,
    sourceCount: parsed.sources.length,
    latencyMs,
    answerChars: parsed.answer.length,
    checks: allChecks,
    sourceIds: parsed.sources.map((source) => source.id).filter(Boolean),
    answer: parsed.answer,
  };
}

async function runTest(test, options) {
  const cookieJar = await options.authSession.createCookieJar();
  const tabId = `${options.runId}-${test.id.toLowerCase()}-${crypto.randomUUID()}`;
  const started = Date.now();
  const response = await fetch(new URL('/api/intelligence/ask', options.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
      Cookie: cookieJar.header(),
    },
    body: JSON.stringify({
      query: `${test.question}\n\nCite retail-v1 pattern chunks and pattern IDs.`,
      client: 'apex-retail',
      tabId,
      surfaceContext: {
        activeClient: 'Apex Retail',
        clientKey: 'apex-retail',
        tenantFacts: [
          'Active tenant is Apex Retail. Do not use facts from any other tenant.',
          'This is a Section 6.4 retail expert-consultant gauntlet. Prefer retail-v1 overlay chunks and visible pattern IDs.',
        ],
      },
    }),
  });
  const rawText = await response.text();
  const parsed = parseStream(rawText);
  return {
    id: test.id,
    name: test.name,
    question: test.question,
    httpStatus: response.status,
    ...grade(test, parsed, response.status, Date.now() - started),
    rawEvents: parsed.events,
  };
}

function renderMarkdown(results, options) {
  const passed = results.filter((result) => result.pass).length;
  return [
    '# Retail Overlay Expert-Consultant Gauntlet',
    '',
    `Run timestamp: ${new Date().toISOString()}`,
    `Base URL: ${options.baseUrl}`,
    `Persona: ${options.personaEmail}`,
    `Tests: ${results.length}`,
    `Passed: ${passed}/${results.length}`,
    `Gate: ${passed >= 4 ? 'PASS' : 'FAIL'} (requires >=4/5)`,
    '',
    '| ID | Test | Pass | HTTP | Latency | retail-v1 chunks | Pattern citations | Checks |',
    '|---|---|---|---:|---:|---:|---:|---|',
    ...results.map((result) => `| ${result.id} | ${result.name} | ${result.pass ? 'PASS' : 'FAIL'} | ${result.httpStatus} | ${result.latencyMs}ms | ${result.overlayChunkCount} | ${result.patternCitationCount} | ${result.checks.filter((check) => check.pass).length}/${result.checks.length} |`),
    '',
    '## Details',
    '',
    ...results.flatMap((result) => [
      `### ${result.id} — ${result.name} — ${result.pass ? 'PASS' : 'FAIL'}`,
      '',
      `Question: ${result.question}`,
      '',
      'Checks:',
      ...result.checks.map((check) => `- ${check.pass ? 'PASS' : 'FAIL'}: ${check.label}`),
      '',
      'Source IDs:',
      ...(result.sourceIds.length ? result.sourceIds.map((id) => `- ${id}`) : ['- [none]']),
      '',
      'Answer excerpt:',
      '',
      '```text',
      result.answer.slice(0, 2400) || '[no answer captured]',
      '```',
      '',
    ]),
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args.get('base-url') || process.env.BASE_URL || 'https://app.abarva.ai';
  const personaEmail = args.get('persona-email') || process.env.APEX_PERSONA_EMAIL || 'apexretail-agent@abarva.example.com';
  const outDir = path.resolve(REPO_ROOT, args.get('out-dir') || 'audit-artifacts/retail-overlay-expert-gauntlet');
  const rawDir = path.join(outDir, 'raw-events');
  const runId = `retail-overlay-expert-gauntlet-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`;
  fs.mkdirSync(rawDir, { recursive: true });

  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY missing; cannot create Clerk sign-in tickets.');
  }

  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const authSession = new ClerkTicketSession({
    browser,
    clerk,
    baseUrl,
    personaEmail,
    activeClient: 'apexretail',
  });
  const results = [];
  try {
    console.log(`Retail expert-consultant gauntlet · ${baseUrl} · ${personaEmail}`);
    for (const test of TESTS) {
      process.stdout.write(`${test.id} ... `);
      const result = await runTest(test, { baseUrl, authSession, runId });
      results.push(result);
      fs.writeFileSync(path.join(rawDir, `${test.id}.json`), JSON.stringify(result, null, 2));
      console.log(`${result.pass ? 'PASS' : 'FAIL'} checks=${result.checks.filter((check) => check.pass).length}/${result.checks.length} overlay=${result.overlayChunkCount} citations=${result.patternCitationCount} (${result.latencyMs}ms)`);
    }
  } finally {
    await browser.close();
  }

  const publicResults = results.map(({ rawEvents: _rawEvents, ...result }) => result);
  const jsonPath = path.join(outDir, 'retail-overlay-expert-gauntlet.json');
  const mdPath = path.join(outDir, 'RETAIL_OVERLAY_EXPERT_GAUNTLET.md');
  fs.writeFileSync(jsonPath, JSON.stringify({
    baseUrl,
    personaEmail,
    runId,
    results: publicResults,
  }, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(publicResults, { baseUrl, personaEmail }));

  const passed = results.filter((result) => result.pass).length;
  console.log(`Passed ${passed}/${results.length}`);
  console.log(`Markdown: ${mdPath}`);
  console.log(`JSON: ${jsonPath}`);
  if (passed < 4) process.exitCode = 1;
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
