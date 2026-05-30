#!/usr/bin/env node
/**
 * Section 6.3 retail-overlay retrieval smoke.
 *
 * Runs 25 Apex Retail CXO questions through the production Ask API as the
 * Apex CIO persona, then verifies the streamed source payload includes
 * live `retail-v1` overlay chunks. This is intentionally API-level: the gate
 * proves the UI-facing route can reach the loaded enterprise_context_chunks
 * overlay, not just that the database has rows.
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

export const RETAIL_QUESTIONS = [
  ['RET-Q01', 'How should Apex Retail refresh its value proposition for omnichannel customers over the next 18 months?'],
  ['RET-Q02', 'Where should we place the next tranche of capital across stores, digital, loyalty, and fulfillment?'],
  ['RET-Q03', 'How should the board evaluate format economics across grocery, mass, and specialty banners?'],
  ['RET-Q04', 'What operating model changes would make localization and cluster strategy actually work?'],
  ['RET-Q05', 'Which e-commerce and marketplace moves should we accelerate, hold, or kill?'],
  ['RET-Q06', 'What is the modern omnichannel OMS vendor landscape and what traps should Apex avoid?'],
  ['RET-Q07', 'How should we use retail media without damaging the customer promise or vendor trust?'],
  ['RET-Q08', 'What should we do about inventory accuracy, shelf availability, and phantom stock?'],
  ['RET-Q09', 'How should Apex think about shrink, organized retail crime, and self-checkout risk?'],
  ['RET-Q10', 'Which supply chain resilience investments deserve funding before the next seasonal peak?'],
  ['RET-Q11', 'How do we pressure-test demand forecasting and replenishment AI before scaling it?'],
  ['RET-Q12', 'Where are returns, reverse logistics, and fraud creating hidden margin leakage?'],
  ['RET-Q13', 'How should we modernize loyalty economics without over-discounting profitable customers?'],
  ['RET-Q14', 'What should the CMO know about personalization risk, consent, and CDP quality?'],
  ['RET-Q15', 'How should merchandising use AI for assortment planning without losing local relevance?'],
  ['RET-Q16', 'What vendor renewal and sourcing events have the highest leverage for retail transformation?'],
  ['RET-Q17', 'How should Apex prioritize store labor, tasking, and workforce planning automation?'],
  ['RET-Q18', 'What data platform and analytics architecture is defensible for retail decision velocity?'],
  ['RET-Q19', 'How should we govern AI models used in pricing, promotions, and customer targeting?'],
  ['RET-Q20', 'Which cybersecurity and fraud-control investments matter most for a retail estate?'],
  ['RET-Q21', 'How should finance measure value realization across retail transformation programs?'],
  ['RET-Q22', 'What KPI baseline would prove whether the retail transformation is working?'],
  ['RET-Q23', 'Where do cross-program dependencies threaten the retail roadmap?'],
  ['RET-Q24', 'How should we explain retail transformation progress to the board in plain English?'],
  ['RET-Q25', 'What is the single best retail move Apex can make in the next 90 days?'],
].map(([id, question]) => ({ id, question }));

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

function countOverlaySources(sources) {
  return sources.filter((source) =>
    String(source.id ?? '').startsWith('retail-v1:') ||
    String(source.detail ?? '').includes('overlay=retail-v1'));
}

function countPatternCitations(sources) {
  return sources.filter((source) =>
    source.type === 'PATTERN' &&
    (
      /^retail-v1:/i.test(String(source.id ?? '')) ||
      /\bpattern_id=[A-Z]{1,2}\.\d+\.\d{2}\b/i.test(String(source.detail ?? '')) ||
      /\b[A-Z]{1,2}\.\d+\.\d{2}\b/.test(`${source.name ?? ''} ${source.detail ?? ''}`)
    ));
}

async function runQuestion(question, options) {
  const cookieJar = await options.authSession.createCookieJar();
  const tabId = `${options.runId}-${question.id.toLowerCase()}-${crypto.randomUUID()}`;
  const started = Date.now();
  const response = await fetch(new URL('/api/intelligence/ask', options.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
      Cookie: cookieJar.header(),
    },
    body: JSON.stringify({
      query: `${question.question}\n\nCite the retail-v1 pattern chunks and pattern IDs you used.`,
      client: 'apex-retail',
      tabId,
      surfaceContext: {
        activeClient: 'Apex Retail',
        clientKey: 'apex-retail',
        tenantFacts: [
          'Active tenant is Apex Retail. Do not use facts from any other tenant.',
          'This is a Section 6.3 retail overlay retrieval smoke. Prefer retail-v1 overlay chunks and visible pattern IDs.',
        ],
      },
    }),
  });
  const rawText = await response.text();
  const parsed = parseStream(rawText);
  const overlaySources = countOverlaySources(parsed.sources);
  const patternCitations = countPatternCitations(parsed.sources);
  const pass =
    response.status === 200 &&
    parsed.errorEvents.length === 0 &&
    overlaySources.length >= 3 &&
    patternCitations.length >= 2;

  return {
    id: question.id,
    question: question.question,
    pass,
    httpStatus: response.status,
    latencyMs: Date.now() - started,
    sourceCount: parsed.sources.length,
    overlayChunkCount: overlaySources.length,
    patternCitationCount: patternCitations.length,
    coverageStatus: parsed.coverageReport?.status ?? null,
    sourceIds: parsed.sources.map((source) => source.id).filter(Boolean),
    answerChars: parsed.answer.length,
    flags: [
      response.status === 200 ? null : `http_${response.status}`,
      parsed.errorEvents.length === 0 ? null : 'stream_error',
      overlaySources.length >= 3 ? null : 'overlay_chunks_below_3',
      patternCitations.length >= 2 ? null : 'pattern_citations_below_2',
    ].filter(Boolean),
    rawEvents: parsed.events,
  };
}

function renderMarkdown(results, options) {
  const passed = results.filter((result) => result.pass).length;
  const gate = passed >= 22;
  return [
    '# Retail Overlay Retrieval Smoke',
    '',
    `Run timestamp: ${new Date().toISOString()}`,
    `Base URL: ${options.baseUrl}`,
    `Persona: ${options.personaEmail}`,
    `Questions: ${results.length}`,
    `Passed: ${passed}/${results.length}`,
    `Gate: ${gate ? 'PASS' : 'FAIL'} (requires >=22/25 with >=3 retail-v1 chunks and >=2 pattern citations)`,
    '',
    '| ID | Pass | HTTP | Latency | Sources | retail-v1 chunks | Pattern citations | Coverage | Flags | Question |',
    '|---|---|---:|---:|---:|---:|---:|---|---|---|',
    ...results.map((result) => [
      result.id,
      result.pass ? 'PASS' : 'FAIL',
      result.httpStatus,
      `${result.latencyMs}ms`,
      result.sourceCount,
      result.overlayChunkCount,
      result.patternCitationCount,
      result.coverageStatus ?? 'n/a',
      result.flags.join(', ') || 'none',
      result.question.replaceAll('|', '\\|'),
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Source IDs',
    '',
    ...results.flatMap((result) => [
      `### ${result.id}`,
      '',
      result.sourceIds.length ? result.sourceIds.map((id) => `- ${id}`).join('\n') : '- [none]',
      '',
    ]),
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args.get('base-url') || process.env.BASE_URL || 'https://app.abarva.ai';
  const personaEmail = args.get('persona-email') || process.env.APEX_PERSONA_EMAIL || 'cio@apex-retail.example.com';
  const outDir = path.resolve(REPO_ROOT, args.get('out-dir') || 'audit-artifacts/retail-overlay-retrieval-smoke');
  const rawDir = path.join(outDir, 'raw-events');
  const runId = `retail-overlay-smoke-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`;
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
    console.log(`Retail overlay retrieval smoke · ${baseUrl} · ${personaEmail}`);
    for (const question of RETAIL_QUESTIONS) {
      process.stdout.write(`${question.id} ... `);
      const result = await runQuestion(question, { baseUrl, authSession, runId });
      results.push(result);
      fs.writeFileSync(path.join(rawDir, `${question.id}.json`), JSON.stringify(result, null, 2));
      console.log(`${result.pass ? 'PASS' : 'FAIL'} overlay=${result.overlayChunkCount} citations=${result.patternCitationCount} (${result.latencyMs}ms)`);
    }
  } finally {
    await browser.close();
  }

  const publicResults = results.map(({ rawEvents: _rawEvents, ...result }) => result);
  const jsonPath = path.join(outDir, 'retail-overlay-retrieval-smoke.json');
  const mdPath = path.join(outDir, 'RETAIL_OVERLAY_RETRIEVAL_SMOKE.md');
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
  if (passed < 22) process.exitCode = 1;
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
