#!/usr/bin/env node
/**
 * SkyHarbor Tier-1 ground-truth runner.
 *
 * Authenticates to the live app as a SkyHarbor persona, replays the 25 CTO
 * scrutiny questions from Packet 28/29 against /api/intelligence/ask, scores
 * each answer on a 5-point readiness rubric, and writes audit artifacts.
 *
 * Usage:
 *   node scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs --persona=cto
 *   node scripts/skyharbor/07_verify/ground_truth_runner.mjs --persona=cto --output verification/TIER_1_GROUND_TRUTH_RESULTS.md
 *
 * Optional env:
 *   BASE_URL=https://app.abarva.ai
 *   SKYHARBOR_PERSONA_EMAIL=cto@skyharbor-air.example.com
 *   HEADLESS=false
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { createClerkClient } from '@clerk/backend';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../..');
dotenv.config({ path: path.join(REPO_ROOT, '.env.local') });
dotenv.config({ path: '/Users/anand/Projects/nexus/.env.local', override: false });

function parseArgs(argv) {
  const parsed = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith('--')) continue;

    const withoutPrefix = raw.slice(2);
    const equalsIndex = withoutPrefix.indexOf('=');

    if (equalsIndex >= 0) {
      const key = withoutPrefix.slice(0, equalsIndex);
      const value = withoutPrefix.slice(equalsIndex + 1) || 'true';
      parsed.set(key, value);
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

const args = parseArgs(process.argv.slice(2));

const PERSONA = args.get('persona') || 'cto';
const PERSONA_EMAIL =
  process.env.SKYHARBOR_PERSONA_EMAIL ||
  (PERSONA === 'cto' ? 'cto@skyharbor-air.example.com' : 'cto@skyharbor-air.example.com');
const BASE_URL = process.env.BASE_URL || 'https://app.abarva.ai';
const BASE_HOST = new URL(BASE_URL).hostname;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const HEADLESS = process.env.HEADLESS !== 'false';
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
const OUT_DIR = path.join(REPO_ROOT, 'audit-artifacts', `skyharbor-ground-truth-${RUN_STAMP}`);
const RAW_DIR = path.join(OUT_DIR, 'raw-events');
const EXPLICIT_MD_PATH = args.get('output')
  ? path.resolve(REPO_ROOT, args.get('output'))
  : null;
fs.mkdirSync(RAW_DIR, { recursive: true });
if (EXPLICIT_MD_PATH) fs.mkdirSync(path.dirname(EXPLICIT_MD_PATH), { recursive: true });

const WRONG_TENANT_TERMS = [
  'Apex Retail',
  'Meridian Health',
  'Northstar Clinical',
  'First Capital',
  'Wipro AMS',
  'Commerce Cloud',
  'Epic EHR',
  'Meditech',
];

const TENANT_MARKERS = [
  'SkyHarbor',
  'IBM',
  'AWS',
  'mainframe',
  'Z',
  'GCC',
  'airline',
  'crew',
  'IROPs',
  'loyalty',
  'airport',
  'baggage',
  'cargo',
  'revenue accounting',
  'modernization',
  'MIPS',
  'TSA',
];

const CITATION_MARKERS = [
  /\bS\d{2}_[A-Z0-9_]+\b/,
  /\bSHA-[A-Z0-9-]+\b/,
  /\bsource\b/i,
  /\bevidence\b/i,
  /\bcitation\b/i,
  /\bmodernization ledger\b/i,
  /\bmainframe inventory\b/i,
  /\bvalue ledger\b/i,
  /\bIBM engagement\b/i,
  /\bvendor portfolio\b/i,
  /\bpattern overlay\b/i,
];

const QUESTIONS = [
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

async function signIn(page) {
  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY missing; cannot create Clerk sign-in ticket.');
  }

  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
  const users = await clerk.users.getUserList({ emailAddress: [PERSONA_EMAIL], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${PERSONA_EMAIL}`);
  const token = await clerk.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 300 });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30000 });
  await page.evaluate(async (ticket) => {
    const result = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket });
    if (result.status !== 'complete' || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed: ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, token.token);
  await page.context().addCookies([{
    name: 'abarva_active_client',
    value: 'skyharbor',
    domain: BASE_HOST,
    path: '/',
    sameSite: 'Lax',
    secure: BASE_URL.startsWith('https://'),
  }]);
}

function parseStream(text) {
  const events = [];
  for (const line of text.split('\n').filter(Boolean)) {
    try {
      events.push(JSON.parse(line));
    } catch {
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

  const sources = [
    ...(events.find((event) => event.type === 'sources')?.sources ?? []),
    ...events
      .filter((event) => event.type === 'sentinel-stage' && event.stage && Array.isArray(event.stage.citations))
      .flatMap((event) => event.stage.citations),
  ];

  return { events, answer, sources };
}

function scoreAnswer({ status, answer, sources, required }) {
  const flags = [];
  let score = 0;
  const dataUnavailable = /\b(i don't have|hasn't been ingested|haven't been ingested|not available|not ingested|can't give you a factual|cannot give you a factual|need .* ingested|needs to be pulled|no record|no .* ledger|no .* inventory)\b/i.test(answer);

  if (status === 200 && answer.length >= 250 && !answer.includes('[error]')) {
    score += 1;
  } else {
    flags.push('weak_or_failed_response');
  }

  const wrongTerms = WRONG_TENANT_TERMS.filter((term) => answer.toLowerCase().includes(term.toLowerCase()));
  if (wrongTerms.length === 0) {
    score += 1;
  } else {
    flags.push(`wrong_tenant_or_hallucinated_terms:${wrongTerms.join('|')}`);
  }

  const tenantHits = TENANT_MARKERS.filter((term) => answer.toLowerCase().includes(term.toLowerCase()));
  if (tenantHits.length >= 3) {
    score += 1;
  } else {
    flags.push(`thin_skyharbor_grounding:${tenantHits.join('|') || 'none'}`);
  }

  const citationHits = CITATION_MARKERS.filter((pattern) => pattern.test(answer)).length;
  const requiredHits = required.filter((segment) => answer.includes(segment)).length;
  if (sources.length > 0 || citationHits >= 2 || requiredHits > 0) {
    score += 1;
  } else {
    flags.push('missing_visible_citations');
  }

  if (
    /\d/.test(answer) &&
    /(recommend|rank|because|risk|value|next|should|do not|leave alone|counter|validate|board|90 days)/i.test(answer)
  ) {
    score += 1;
  } else {
    flags.push('low_decision_specificity');
  }

  if (dataUnavailable) {
    flags.push('data_unavailable_admission');
    score = Math.min(score, 3);
  }

  return {
    score,
    pass: score >= 4,
    flags,
    sourceCount: sources.length,
    answerChars: answer.length,
    tenantHits,
    requiredHits,
    citationHits,
  };
}

async function ask(page, item) {
  const started = Date.now();
  const raw = await fetchAskWithRetry(page, item.question);

  const parsed = parseStream(raw.text);
  const scored = scoreAnswer({ status: raw.status, answer: parsed.answer, sources: parsed.sources, required: item.required });
  return {
    ...item,
    status: raw.status,
    latencyMs: Date.now() - started,
    answer: parsed.answer,
    rawText: raw.text,
    rawEvents: parsed.events,
    sources: parsed.sources,
    fetchError: raw.error ?? null,
    ...scored,
  };
}

async function fetchAskWithRetry(page, question) {
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await page.evaluate(async ({ question: prompt }) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        try {
          const response = await fetch('/api/intelligence/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              query: `${prompt}\n\nCite the SkyHarbor source segments, records, or evidence you used. If you are using an airline industry pattern rather than a SkyHarbor tenant fact, label it as pattern-based.`,
              client: 'skyharbor',
              surfaceContext: {
                activeClient: 'SkyHarbor Air',
                clientKey: 'skyharbor',
                tenantFacts: [
                  'Active tenant is SkyHarbor Air. Do not use facts from any other tenant.',
                  'This is a CTO verification run. Prefer SkyHarbor tenant facts and visible citations.',
                ],
              },
            }),
          });
          return { status: response.status, text: await response.text() };
        } finally {
          clearTimeout(timeout);
        }
      }, { question });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt === 1) {
        await page.waitForTimeout(2500);
        continue;
      }
    }
  }

  return {
    status: 0,
    text: JSON.stringify({ type: 'error', error: lastError ?? 'fetch failed' }) + '\n',
    error: lastError ?? 'fetch failed',
  };
}

function escapeMarkdown(value) {
  return String(value).replaceAll('|', '\\|');
}

function renderMarkdown(results) {
  const passed = results.filter((result) => result.pass).length;
  const perfect = results.filter((result) => result.score >= 5).length;
  const avg = results.reduce((sum, result) => sum + result.score, 0) / Math.max(results.length, 1);
  const failures = results.filter((result) => !result.pass);
  const meetsPacket29Gate = passed >= 23 && perfect >= 18;
  const lines = [
    '# SkyHarbor Packet 29 Section 8 Ground Truth Replay',
    '',
    `Run timestamp: ${new Date().toISOString()}`,
    `Base URL: ${BASE_URL}`,
    `Persona: ${PERSONA} (${PERSONA_EMAIL})`,
    `Questions: ${results.length}`,
    `Pass threshold: score >= 4/5 with visible grounding/citation signal`,
    `Passed: ${passed}/${results.length}`,
    `Score 5/5: ${perfect}/${results.length}`,
    `Average score: ${avg.toFixed(2)}/5`,
    `Packet 29 Section 8 gate: ${meetsPacket29Gate ? 'PASS' : 'REVIEW REQUIRED'} (requires >=23 scored >=4 and >=18 scored 5)`,
    '',
    '## Score Table',
    '',
    '| ID | Score | Pass | Latency | Sources | Flags | Question |',
    '|---|---:|---|---:|---:|---|---|',
  ];

  for (const result of results) {
    lines.push(
      `| ${result.id} | ${result.score}/5 | ${result.pass ? 'PASS' : 'REVIEW'} | ${result.latencyMs}ms | ${result.sourceCount} | ${escapeMarkdown(result.flags.join(', ') || 'none')} | ${escapeMarkdown(result.question)} |`,
    );
  }

  lines.push('', '## Review Items', '');
  if (failures.length === 0) {
    lines.push('None. All 25 Tier-1 CTO questions met the >=4/5 threshold.');
  } else {
    for (const result of failures) {
      lines.push(`- ${result.id}: ${result.score}/5 — ${result.flags.join(', ') || 'no flags'} — ${result.question}`);
    }
  }

  lines.push('', '## Verbatim Answers', '');
  for (const result of results) {
    lines.push(`### ${result.id} — ${result.score}/5 — ${result.pass ? 'PASS' : 'REVIEW'}`);
    lines.push('');
    lines.push(`Question: ${result.question}`);
    lines.push('');
    lines.push(`Flags: ${result.flags.join(', ') || 'none'}`);
    lines.push('');
    lines.push('```text');
    lines.push(result.answer || '[no answer captured]');
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  console.log(`SkyHarbor ground-truth replay · ${BASE_URL} · ${PERSONA_EMAIL}`);
  console.log(`Output: ${OUT_DIR}`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const results = [];

  try {
    await signIn(page);
    await page.goto(new URL('/intelligence/ask', BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    for (const item of QUESTIONS) {
      process.stdout.write(`${item.id} ... `);
      const result = await ask(page, item);
      results.push(result);
      fs.writeFileSync(path.join(RAW_DIR, `${item.id}.json`), JSON.stringify(result.rawEvents, null, 2));
      console.log(`${result.score}/5 ${result.pass ? 'PASS' : 'REVIEW'} (${result.latencyMs}ms)`);
    }
  } finally {
    await browser.close();
  }

  const mdPath = EXPLICIT_MD_PATH ?? path.join(OUT_DIR, 'GROUND_TRUTH_RESULTS.md');
  const jsonPath = EXPLICIT_MD_PATH
    ? path.join(path.dirname(EXPLICIT_MD_PATH), `${path.basename(EXPLICIT_MD_PATH, path.extname(EXPLICIT_MD_PATH))}.json`)
    : path.join(OUT_DIR, 'ground_truth_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    baseUrl: BASE_URL,
    persona: PERSONA,
    personaEmail: PERSONA_EMAIL,
    runStamp: RUN_STAMP,
    results: results.map(({ rawText: _rawText, rawEvents: _rawEvents, ...result }) => result),
  }, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(results));

  const passed = results.filter((result) => result.pass).length;
  const perfect = results.filter((result) => result.score >= 5).length;
  const avg = results.reduce((sum, result) => sum + result.score, 0) / Math.max(results.length, 1);
  console.log('');
  console.log(`Passed ${passed}/${results.length}; score 5/5 ${perfect}/${results.length}; average ${avg.toFixed(2)}/5`);
  console.log(`Markdown: ${mdPath}`);
  console.log(`JSON: ${jsonPath}`);

  if (passed < 23 || perfect < 18) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
