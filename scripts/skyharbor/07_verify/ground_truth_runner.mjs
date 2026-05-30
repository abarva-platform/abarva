#!/usr/bin/env node
/**
 * SkyHarbor Tier-1 verifier.
 *
 * Browser use is limited to Clerk ticket bootstrap. The actual quality gate is
 * Node fetch against /api/intelligence/ask with fresh per-question tabIds,
 * harness-vs-product status taxonomy, latency budgets, and reviewable
 * per-question artifacts.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { createClerkClient } from '@clerk/backend';
import { ClerkTicketSession } from './lib/clerkSession.mjs';
import { classifyHarnessResponse, scoreProductAnswer } from './lib/scorer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

dotenv.config({ path: path.join(REPO_ROOT, '.env.local') });
dotenv.config({ path: '/Users/anand/Projects/nexus/.env.local', override: false });

export const QUESTIONS = [
  {
    id: 'CTO-Q01',
    question: "After 5 years of modernization, what's the defensible progress narrative?",
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
  {
    id: 'CTO-Q02',
    question: 'Of the 47 mainframe workloads at Day-0, how many remain on Z, and why?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT'],
  },
  {
    id: 'CTO-Q03',
    question: 'Which 5 workloads should we extract next, ranked by value-to-risk ratio?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'],
  },
  {
    id: 'CTO-Q04',
    question: 'Which workloads should we explicitly NOT touch in the next 18 months?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
  {
    id: 'CTO-Q05',
    question: "Where has extraction created duplicate complexity, and what's the unwinding plan?",
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT'],
  },
  {
    id: 'CTO-Q06',
    question: 'Which extractions reversed, and what did we learn?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'],
  },
  {
    id: 'CTO-Q07',
    question: 'What is IBM still essential for, and where are we over-dependent?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
  {
    id: 'CTO-Q08',
    question: 'What does the IBM contract restructure window look like in FY-2027?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT'],
  },
  {
    id: 'CTO-Q09',
    question: 'What productivity guarantees has IBM met, missed, or contested?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'],
  },
  {
    id: 'CTO-Q10',
    question: 'Where can AI-powered SDLC compress delivery in the next 90 days?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
  {
    id: 'CTO-Q11',
    question: 'Which AI SDLC tooling candidates are highest-leverage for our COBOL-heavy estate?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT'],
  },
  {
    id: 'CTO-Q12',
    question: 'What is the risk profile of AI-generated code in our safety-critical domains?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'],
  },
  {
    id: 'CTO-Q13',
    question: "How are we performing on DORA metrics by domain, and where's the modernization correlation?",
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
  {
    id: 'CTO-Q14',
    question: 'Why are we lagging peers on GCC scale at 1,000 vs peers at 3-5K?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT'],
  },
  {
    id: 'CTO-Q15',
    question: 'What is the 24-month target operating model across IBM / AWS / GCC / internal engineering?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'],
  },
  {
    id: 'CTO-Q16',
    question: 'What is the value ledger reality: promised vs realized vs disputed?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
  {
    id: 'CTO-Q17',
    question: 'Where is value stuck in projected and what would validate it?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT'],
  },
  {
    id: 'CTO-Q18',
    question: "Where does the CIO's challenge map to real gaps vs perception gaps?",
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'],
  },
  {
    id: 'CTO-Q19',
    question: 'What modernization moves should the CTO present to the board next quarter?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
  {
    id: 'CTO-Q20',
    question: 'What is the AWS EDP true-up exposure in FY-2026?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT'],
  },
  {
    id: 'CTO-Q21',
    question: 'Which Snowflake/Databricks consolidation move is defensible?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'],
  },
  {
    id: 'CTO-Q22',
    question: 'Where should the AI tooling stack consolidate?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
  {
    id: 'CTO-Q23',
    question: 'What is the cyber stack rationalization opportunity?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT'],
  },
  {
    id: 'CTO-Q24',
    question: 'What sourcing events in the next 12 months have the highest leverage?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'],
  },
  {
    id: 'CTO-Q25',
    question: 'What is the single best move the CTO can make in the next 90 days?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  },
];

export function parseArgs(argv) {
  const parsed = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith('--')) continue;
    const withoutPrefix = raw.slice(2);
    const equalsIndex = withoutPrefix.indexOf('=');
    if (equalsIndex >= 0) {
      parsed.set(withoutPrefix.slice(0, equalsIndex), withoutPrefix.slice(equalsIndex + 1) || 'true');
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      parsed.set(withoutPrefix, next);
      index += 1;
    } else {
      parsed.set(withoutPrefix, 'true');
    }
  }
  return parsed;
}

export function parseStream(text) {
  const events = [];
  const parseErrors = [];
  for (const line of text.split('\n').filter(Boolean)) {
    try {
      events.push(JSON.parse(line));
    } catch {
      parseErrors.push(line);
      events.push({ type: 'parse_error', raw: line });
    }
  }

  const answer = events.map((event) => {
    if (event.type === 'delta') return event.text ?? '';
    if (event.type === 'sentinel-stage' && event.stage) {
      const citations = Array.isArray(event.stage.citations)
        ? event.stage.citations.map((citation) => citation.id || citation.label).filter(Boolean)
        : [];
      const citationText = citations.length ? `\nCitations: ${citations.join(', ')}` : '';
      const dissentText = event.stage.dissent ? `\nDissent: ${event.stage.dissent}` : '';
      return `[${event.stage.name ?? event.stage.id ?? 'Sentinel stage'}]\n${event.stage.content ?? ''}${dissentText}${citationText}\n\n`;
    }
    if (event.type === 'error') return `[error] ${event.error ?? 'unknown error'}\n`;
    return '';
  }).join('').trim();

  const sourceEvent = events.find((event) => event.type === 'sources');
  const errorEvents = events.filter((event) => event.type === 'error');
  const sources = [
    ...(sourceEvent?.sources ?? []),
    ...events
      .filter((event) => event.type === 'sentinel-stage' && event.stage && Array.isArray(event.stage.citations))
      .flatMap((event) => event.stage.citations),
  ];

  return {
    events,
    answer,
    sources,
    coverageReport: sourceEvent?.coverageReport ?? null,
    errorEvents,
    parseErrors,
  };
}

export async function runQuestion(item, {
  baseUrl,
  clientKey = 'skyharbor',
  activeClient = 'SkyHarbor Air',
  authSession,
  fetchImpl = fetch,
  latencyBudgetMs = 60000,
  retries = 2,
  runId = crypto.randomUUID(),
}) {
  const started = Date.now();
  const tabId = `${runId}-${item.id.toLowerCase()}-${crypto.randomUUID()}`;
  let lastHarnessError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const cookieJar = await authSession.createCookieJar();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), latencyBudgetMs);
    try {
      const response = await fetchImpl(new URL('/api/intelligence/ask', baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-ndjson',
          Cookie: cookieJar.header(),
        },
        signal: controller.signal,
        body: JSON.stringify({
          query: `${item.question}\n\nCite the SkyHarbor source segments, records, or evidence you used. If you are using an airline industry pattern rather than a SkyHarbor tenant fact, label it as pattern-based.`,
          client: clientKey,
          tabId,
          surfaceContext: {
            activeClient,
            clientKey,
            tenantFacts: [
              'Active tenant is SkyHarbor Air. Do not use facts from any other tenant.',
              'This is a CTO verification run. Prefer SkyHarbor tenant facts and visible citations.',
            ],
          },
        }),
      });
      cookieJar.applySetCookie(response.headers);
      const text = await response.text();
      const elapsedMs = Date.now() - started;
      const harnessStatus = classifyHarnessResponse({
        status: response.status,
        contentType: response.headers.get('content-type') ?? '',
        text,
        elapsedMs,
        latencyBudgetMs,
      });
      if (harnessStatus) {
        lastHarnessError = harnessStatus.reason;
        if (attempt < retries) continue;
        return buildHarnessResult(item, {
          status: harnessStatus.status,
          reason: harnessStatus.reason,
          httpStatus: response.status,
          latencyMs: elapsedMs,
          rawText: text,
          tabId,
          attempt,
        });
      }

      const parsed = parseStream(text);
      if (parsed.parseErrors.length > 0 || parsed.events.length === 0) {
        lastHarnessError = 'invalid or empty NDJSON events';
        if (attempt < retries) continue;
        return buildHarnessResult(item, {
          status: 'fail-harness',
          reason: lastHarnessError,
          httpStatus: response.status,
          latencyMs: elapsedMs,
          rawText: text,
          rawEvents: parsed.events,
          tabId,
          attempt,
        });
      }

      if (parsed.errorEvents.length > 0) {
        const reason = parsed.errorEvents
          .map((event) => event.error ?? event.message ?? 'streamed error event')
          .join(' | ');
        return buildHarnessResult(item, {
          status: 'fail-harness',
          reason,
          httpStatus: response.status,
          latencyMs: elapsedMs,
          rawText: text,
          rawEvents: parsed.events,
          tabId,
          attempt,
        });
      }

      if (parsed.answer.length < 50) {
        return {
          ...baseResult(item, {
            status: 'refused',
            httpStatus: response.status,
            latencyMs: elapsedMs,
            tabId,
            attempt,
          }),
          score: 1,
          pass: false,
          flags: ['answer_below_50_chars'],
          answer: parsed.answer,
          sources: parsed.sources,
          coverageReport: parsed.coverageReport,
          rawText: text,
          rawEvents: parsed.events,
        };
      }

      const scored = scoreProductAnswer({
        answer: parsed.answer,
        sources: parsed.sources,
        required: item.required,
      });

      return {
        ...baseResult(item, {
          status: scored.status,
          httpStatus: response.status,
          latencyMs: elapsedMs,
          tabId,
          attempt,
        }),
        ...scored,
        answer: parsed.answer,
        sources: parsed.sources,
        coverageReport: parsed.coverageReport,
        rawText: text,
        rawEvents: parsed.events,
      };
    } catch (error) {
      const elapsedMs = Date.now() - started;
      lastHarnessError = error?.name === 'AbortError'
        ? `timeout after ${latencyBudgetMs}ms`
        : error instanceof Error ? error.message : String(error);
      if (attempt < retries) continue;
      return buildHarnessResult(item, {
        status: error?.name === 'AbortError' ? 'timeout' : 'fail-harness',
        reason: lastHarnessError,
        httpStatus: 0,
        latencyMs: elapsedMs,
        rawText: '',
        tabId,
        attempt,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return buildHarnessResult(item, {
    status: 'fail-harness',
    reason: lastHarnessError ?? 'fetch failed',
    httpStatus: 0,
    latencyMs: Date.now() - started,
    rawText: '',
    tabId,
    attempt: retries,
  });
}

function baseResult(item, { status, httpStatus, latencyMs, tabId, attempt }) {
  return {
    ...item,
    status,
    httpStatus,
    latencyMs,
    tabId,
    attempt,
  };
}

function buildHarnessResult(item, { status, reason, httpStatus, latencyMs, rawText, rawEvents = [], tabId, attempt }) {
  return {
    ...baseResult(item, { status, httpStatus, latencyMs, tabId, attempt }),
    score: 0,
    pass: false,
    flags: [reason],
    answer: '',
    sources: [],
    coverageReport: null,
    rawText,
    rawEvents,
    harnessReason: reason,
  };
}

export function renderMarkdown(results, { baseUrl, persona, personaEmail }) {
  const summary = summarizeResults(results);
  const lines = [
    '# SkyHarbor Packet 30 Phase 4 Ground Truth Replay',
    '',
    `Run timestamp: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    `Persona: ${persona} (${personaEmail})`,
    `Questions: ${results.length}`,
    'Status taxonomy: `pass`, `fail-product`, `fail-harness`, `timeout`, `refused`',
    `Passed: ${summary.passed}/${results.length}`,
    `Score 5/5: ${summary.perfect}/${results.length}`,
    `Average score: ${summary.averageScore.toFixed(2)}/5`,
    `Fail-harness rows: ${summary.failHarness}`,
    `Timeout rows: ${summary.timeout}`,
    `Unavailable admission rate: ${(summary.unavailableAdmissionRate * 100).toFixed(1)}%`,
    `Phase 4 harness gate: ${summary.phase4Gate ? 'PASS' : 'REVIEW REQUIRED'} (requires zero fail-harness rows and zero timeouts)`,
    `Product score target: ${summary.productGate ? 'PASS' : 'REVIEW REQUIRED'} (requires >=23 scored pass; Phase 5 owns score lift)`,
    '',
    '## Score Table',
    '',
    '| ID | Status | Score | Pass | Latency | Sources | Coverage | Flags | Question |',
    '|---|---|---:|---|---:|---:|---|---|---|',
  ];

  for (const result of results) {
    lines.push(
      `| ${result.id} | ${result.status} | ${result.score}/5 | ${result.pass ? 'PASS' : 'REVIEW'} | ${result.latencyMs}ms | ${result.sourceCount ?? result.sources?.length ?? 0} | ${result.coverageReport?.status ?? 'n/a'} | ${escapeMarkdown((result.flags ?? []).join(', ') || 'none')} | ${escapeMarkdown(result.question)} |`,
    );
  }

  lines.push('', '## Review Items', '');
  const reviewItems = results.filter((result) => result.status !== 'pass');
  if (reviewItems.length === 0) {
    lines.push('None. All Tier-1 CTO questions passed the product scoring gate.');
  } else {
    for (const result of reviewItems) {
      lines.push(`- ${result.id}: ${result.status}, ${result.score}/5 — ${(result.flags ?? []).join(', ') || 'no flags'} — ${result.question}`);
    }
  }

  lines.push('', '## Verbatim Answers', '');
  for (const result of results) {
    lines.push(`### ${result.id} — ${result.status} — ${result.score}/5`);
    lines.push('');
    lines.push(`Question: ${result.question}`);
    lines.push('');
    lines.push(`Flags: ${(result.flags ?? []).join(', ') || 'none'}`);
    lines.push('');
    lines.push('```text');
    lines.push(result.answer || '[no answer captured]');
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

export function renderHtml(results, { baseUrl, persona, personaEmail }) {
  const summary = summarizeResults(results);
  return `<!doctype html><html><head><meta charset="utf-8"/><title>SkyHarbor verifier · ${new Date().toISOString()}</title>
<style>
body{margin:0;background:#f8fafc;color:#111827;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:36px 40px 80px}
h1{font-size:30px;margin:0 0 8px}h2{font-size:20px;margin-top:28px;border-top:1px solid #d1d5db;padding-top:18px}
.banner{border-left:6px solid ${summary.phase4Gate ? '#047857' : '#b91c1c'};background:#fff;border-radius:8px;padding:16px 18px;margin:18px 0;box-shadow:0 1px 2px #0001}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.metric{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px}
.metric b{display:block;font-size:20px}table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb}th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top}th{font-size:12px;text-transform:uppercase;color:#6b7280;background:#f9fafb}.pass{color:#047857;font-weight:700}.fail{color:#b91c1c;font-weight:700}pre{white-space:pre-wrap;background:#111827;color:#f9fafb;padding:12px;border-radius:8px;max-height:320px;overflow:auto}
</style></head><body><main>
<h1>SkyHarbor Tier-1 Verifier</h1>
<p>Base: <code>${escapeHtml(baseUrl)}</code> · Persona: <code>${escapeHtml(persona)} (${escapeHtml(personaEmail)})</code></p>
<div class="banner"><b>${summary.phase4Gate ? 'Phase 4 harness gate passed' : 'Review required'}</b><br/>Node-fetch verifier with fresh per-question tabIds and harness/product taxonomy. Product target: ${summary.productGate ? 'passed' : 'review required'}.</div>
<section class="grid">
<div class="metric"><b>${summary.passed}/${results.length}</b>Passed</div>
<div class="metric"><b>${summary.failHarness}</b>Fail-harness</div>
<div class="metric"><b>${summary.timeout}</b>Timeout</div>
<div class="metric"><b>${summary.averageScore.toFixed(2)}/5</b>Average</div>
<div class="metric"><b>${(summary.unavailableAdmissionRate * 100).toFixed(1)}%</b>Unavailable admissions</div>
</section>
<h2>Score Table</h2>
<table><thead><tr><th>ID</th><th>Status</th><th>Score</th><th>Latency</th><th>Sources</th><th>Coverage</th><th>Flags</th><th>Question</th></tr></thead><tbody>
${results.map((result) => `<tr><td>${escapeHtml(result.id)}</td><td class="${result.status === 'pass' ? 'pass' : 'fail'}">${escapeHtml(result.status)}</td><td>${result.score}/5</td><td>${result.latencyMs}ms</td><td>${result.sourceCount ?? result.sources?.length ?? 0}</td><td>${escapeHtml(result.coverageReport?.status ?? 'n/a')}</td><td>${escapeHtml((result.flags ?? []).join(', ') || 'none')}</td><td>${escapeHtml(result.question)}</td></tr>`).join('')}
</tbody></table>
<h2>Answers</h2>
${results.map((result) => `<h3>${escapeHtml(result.id)} · ${escapeHtml(result.status)} · ${result.score}/5</h3><pre>${escapeHtml(result.answer || '[no answer captured]')}</pre>`).join('')}
</main></body></html>`;
}

export function summarizeResults(results) {
  const passed = results.filter((result) => result.pass).length;
  const perfect = results.filter((result) => result.score >= 5).length;
  const failHarness = results.filter((result) => result.status === 'fail-harness').length;
  const timeout = results.filter((result) => result.status === 'timeout').length;
  const unavailable = results.filter((result) => result.unavailableAdmission).length;
  const averageScore = results.reduce((sum, result) => sum + result.score, 0) / Math.max(results.length, 1);
  return {
    passed,
    perfect,
    failHarness,
    timeout,
    unavailableAdmissionRate: unavailable / Math.max(results.length, 1),
    averageScore,
    phase4Gate: failHarness === 0 && timeout === 0,
    productGate: passed >= 23,
  };
}

export async function runVerifier(options) {
  const browser = await chromium.launch({ headless: options.headless });
  const clerk = createClerkClient({ secretKey: options.clerkSecretKey });
  const authSession = new ClerkTicketSession({
    browser,
    clerk,
    baseUrl: options.baseUrl,
    personaEmail: options.personaEmail,
    activeClient: options.clientKey,
  });
  const results = [];

  try {
    for (const item of options.questions) {
      process.stdout.write(`${item.id} ... `);
      const result = await runQuestion(item, {
        baseUrl: options.baseUrl,
        clientKey: options.clientKey,
        activeClient: options.activeClient,
        authSession,
        latencyBudgetMs: options.latencyBudgetMs,
        retries: options.retries,
        runId: options.runId,
      });
      results.push(result);
      fs.writeFileSync(path.join(options.rawDir, `${item.id}.json`), JSON.stringify({
        request: {
          question: item.question,
          required: item.required,
          tabId: result.tabId,
          attempt: result.attempt,
        },
        status: result.status,
        score: result.score,
        flags: result.flags,
        coverageReport: result.coverageReport,
        rawEvents: result.rawEvents,
      }, null, 2));
      console.log(`${result.status} ${result.score}/5 (${result.latencyMs}ms)`);
    }
  } finally {
    await browser.close();
  }

  return results;
}

function escapeMarkdown(value) {
  return String(value).replaceAll('|', '\\|');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const persona = args.get('persona') || 'cto';
  const personaEmail = process.env.SKYHARBOR_PERSONA_EMAIL ||
    (persona === 'cto' ? 'cto@skyharbor-air.example.com' : 'cto@skyharbor-air.example.com');
  const baseUrl = process.env.BASE_URL || 'https://app.abarva.ai';
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  const headless = process.env.HEADLESS !== 'false';
  const latencyBudgetMs = Number(args.get('latency-budget-ms') ?? process.env.VERIFIER_LATENCY_BUDGET_MS ?? 60000);
  const retries = Number(args.get('retries') ?? process.env.VERIFIER_RETRIES ?? 2);
  const runStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const runId = `skyharbor-ground-truth-${runStamp}-${crypto.randomUUID()}`;
  const outDir = args.get('out-dir')
    ? path.resolve(REPO_ROOT, args.get('out-dir'))
    : path.join(REPO_ROOT, 'audit-artifacts', `skyharbor-ground-truth-${runStamp}`);
  const rawDir = path.join(outDir, 'raw-events');
  fs.mkdirSync(rawDir, { recursive: true });

  const explicitMdPath = args.get('output') ? path.resolve(REPO_ROOT, args.get('output')) : null;
  if (explicitMdPath) fs.mkdirSync(path.dirname(explicitMdPath), { recursive: true });

  if (!clerkSecretKey) throw new Error('CLERK_SECRET_KEY missing; cannot create Clerk sign-in tickets.');

  console.log(`SkyHarbor ground-truth replay · ${baseUrl} · ${personaEmail}`);
  console.log(`Output: ${outDir}`);

  const results = await runVerifier({
    baseUrl,
    clerkSecretKey,
    persona,
    personaEmail,
    clientKey: 'skyharbor',
    activeClient: 'SkyHarbor Air',
    questions: QUESTIONS,
    rawDir,
    headless,
    latencyBudgetMs,
    retries,
    runId,
  });

  const mdPath = explicitMdPath ?? path.join(outDir, 'GROUND_TRUTH_RESULTS.md');
  const htmlPath = path.join(outDir, 'GROUND_TRUTH_RESULTS.html');
  const jsonPath = explicitMdPath
    ? path.join(path.dirname(explicitMdPath), `${path.basename(explicitMdPath, path.extname(explicitMdPath))}.json`)
    : path.join(outDir, 'ground_truth_results.json');

  fs.writeFileSync(jsonPath, JSON.stringify({
    baseUrl,
    persona,
    personaEmail,
    runStamp,
    results: results.map(({ rawText: _rawText, rawEvents: _rawEvents, ...result }) => result),
  }, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(results, { baseUrl, persona, personaEmail }));
  fs.writeFileSync(htmlPath, renderHtml(results, { baseUrl, persona, personaEmail }));

  const summary = summarizeResults(results);
  console.log('');
  console.log(`Passed ${summary.passed}/${results.length}; fail-harness ${summary.failHarness}; timeout ${summary.timeout}; average ${summary.averageScore.toFixed(2)}/5`);
  console.log(`Markdown: ${mdPath}`);
  console.log(`HTML: ${htmlPath}`);
  console.log(`JSON: ${jsonPath}`);

  if (!summary.phase4Gate) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
