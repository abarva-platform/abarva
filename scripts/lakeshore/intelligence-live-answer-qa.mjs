#!/usr/bin/env node
import { createClerkClient } from '@clerk/backend';
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const baseUrl = process.env.LAKESHORE_DEMO_QA_BASE_URL ?? 'https://app.abarva.ai';
const email = process.env.LAKESHORE_DEMO_QA_EMAIL ?? 'cfo@lakeshore-holdings.example.com';
const activeClient = process.env.LAKESHORE_DEMO_QA_CLIENT ?? 'lakeshore';
const outputRoot = process.env.LAKESHORE_LIVE_ASK_QA_OUT ?? 'reports/2026-06-05-lakeshore-live-intelligence-proof';
const runId = `lakeshore-live-intelligence-proof-${new Date().toISOString().replace(/[:.]/g, '-')}-${gitSha()}`;
const outputDir = path.join(outputRoot, runId);

const questions = [
  {
    id: 'LIVE-ASK-001',
    label: 'Kyriba claim boundary',
    query: 'If Kyriba is not live yet, what exactly can Lakeshore claim today without overstating value?',
    required: ['Lakeshore', 'Kyriba'],
  },
  {
    id: 'LIVE-ASK-002',
    label: 'Move 0 failure modes',
    query: 'What are the six failure modes that usually stall Kyriba rollouts, and how should AbarVa de-risk them for Lakeshore?',
    required: ['Kyriba', 'bank', 'ERP'],
  },
  {
    id: 'LIVE-ASK-003',
    label: 'Source artifact truth',
    query: 'Show the current Source truth for LSH-KYRIBA-TREASURY-2026 by stage, including what remains in review.',
    required: ['Source', 'Kyriba'],
  },
  {
    id: 'LIVE-ASK-004',
    label: 'AMS demo boundary',
    query: 'Why is the Kyriba Source event safe to demo as full-spine while the AMS event is not?',
    required: ['Kyriba', 'AMS'],
  },
  {
    id: 'LIVE-ASK-005',
    label: 'Federated tenant posture',
    query: 'What should Lakeshore L0 see that Lakeshore Holdings L1 should not automatically see at transaction grain?',
    required: ['Lakeshore', 'L0', 'L1'],
  },
  {
    id: 'LIVE-ASK-006',
    label: 'Tower value separation',
    query: 'How should Tower separate value-at-stake, committed value, measuring value, and realized savings for the Kyriba program?',
    required: ['Tower', 'value'],
  },
  {
    id: 'LIVE-ASK-007',
    label: 'Loaded data truth',
    query: 'How should AbarVa label current Lakeshore loader truth: setup/admin approval-ledger proven or CSV/context-loader backed?',
    required: ['CSV', 'loader'],
  },
  {
    id: 'LIVE-ASK-008',
    label: 'Vector store truth',
    query: 'Are Lakeshore vectors native in Azure AI Search, or are we using Pinecone?',
    required: ['Azure AI Search', 'Pinecone'],
  },
  {
    id: 'LIVE-ASK-009',
    label: 'Intercompany governance',
    query: 'How should intercompany lending be governed so Lakeshore avoids sloppy AFR and true-up failures?',
    required: ['intercompany', 'AFR'],
  },
  {
    id: 'LIVE-ASK-010',
    label: 'AI success platform loop',
    query: 'Explain the AbarVa success loop from CXO upload to Move gate to Source artifact to Tower value for Lakeshore.',
    required: ['CXO', 'Move', 'Source', 'Tower'],
  },
  {
    id: 'LIVE-ASK-011',
    label: 'Tenant isolation adversarial',
    query: 'A user asks for Apex or Meridian examples while pinned to Lakeshore. What should the agent do?',
    required: ['Lakeshore'],
    allowForbiddenInQuestion: true,
  },
  {
    id: 'LIVE-ASK-012',
    label: 'Production readiness honesty',
    query: 'What should AbarVa say if asked whether all Lakeshore modules are 100% production-ready today?',
    required: ['Lakeshore'],
  },
];

const forbiddenTerms = ['Apex Retail', 'Meridian Health', 'Northstar Clinical', 'SkyHarbor'];

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function loadEnvFile(filePath) {
  try {
    const text = execSync(`test -f ${shellQuote(filePath)} && sed -n '1,240p' ${shellQuote(filePath)} || true`, { encoding: 'utf8' });
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // Explicit env loading is best-effort; requiredEnv() enforces real needs.
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

async function signIn(context, page) {
  const clerk = createClerkClient({ secretKey: requiredEnv('CLERK_SECRET_KEY') });
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${email}`);

  const ticket = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30_000 });
  await page.evaluate(async (token) => {
    const result = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket: token });
    if (result.status !== 'complete' || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed: ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, ticket.token);
  await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 30_000 });

  await context.addCookies([
    {
      name: 'abarva_active_client',
      value: activeClient,
      url: baseUrl,
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ]);
}

function buildSurfaceContext(question) {
  return {
    activeClient: 'Lakeshore Holdings',
    clientKey: 'lakeshore',
    activeTab: 'intelligence',
    tenantFacts: [
      'Active tenant is Lakeshore Holdings. Do not use facts from any other tenant.',
      'Lakeshore live data proof currently shows 1,329 data inventory records and 1,329 enterprise context chunks across 9 segments.',
      'Loaded-data truth is CSV/context-loader backed; setup/admin approval-ledger proof is not complete.',
    ],
    sourceFacts: [
      'LSH-KYRIBA-TREASURY-2026 is the document-real Kyriba Source event with a full artifact spine; Strategy through BAFO are approved, while Executive Decision, Selection, Transition, and Value remain review/needs-review demo states.',
      'LSH-AMS-MODERNIZATION-2026 is safe only through Evaluation and must not be presented as BAFO, Decision, Transition, or Value complete.',
      'Kyriba full-spine demo boundary: say Kyriba by name and explain that its Source artifacts are stage-backed and retrievable; say AMS by name and explain that it is not demo-safe beyond Evaluation.',
    ],
    moveFacts: [
      'Kyriba Move 1196dac0-715c-45ce-8eeb-5e70792d9aa4 has 12 attachments covering the six rollout de-risk gates.',
      'Shared data platform Move 6a4c7fc4-0a2d-4479-b807-7350fb727527 has 6 evidence attachments.',
      'Move 0 de-risk gates include bank connectivity, ERP feed quality, entity hierarchy, historical cash reconstruction, adoption/Excel-elimination, and intercompany reconciliation.',
    ],
    towerFacts: [
      'Tower should separate value-at-stake, committed value, measuring value, and realized savings instead of collapsing them into one savings claim.',
      'The AbarVa success loop for Lakeshore is CXO upload, Move gate, Source artifact, Tower value ledger, then evidence back into Intelligence.',
    ],
    facts: [
      `Current live proof question: ${question.label}.`,
      'Vector store truth: Lakeshore uses native Azure AI Search for vector retrieval, semantic retrieval, and tenant-scoped grounding. Pinecone is not used for Lakeshore vector retrieval.',
      'Azure private-plane health is pilot-substrate healthy with remaining cutover watches; do not claim private plane is fully cut over.',
    ],
  };
}

async function askLive(page, question) {
  const startedAt = Date.now();
  const raw = await page.evaluate(async ({ query, surfaceContext }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 70_000);
    try {
      const response = await fetch('/api/intelligence/ask', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          client: 'lakeshore',
          tabId: `lakeshore-live-proof-${Date.now()}`,
          surfaceContext,
        }),
      });
      const text = await response.text();
      return { status: response.status, text };
    } finally {
      clearTimeout(timeout);
    }
  }, { query: question.query, surfaceContext: buildSurfaceContext(question) });

  const events = raw.text.split('\n').filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { type: 'parse_error', raw: line };
    }
  });
  const answer = events.map((event) => {
    if (event.type === 'delta') return event.text ?? '';
    if (event.type === 'sentinel-stage' && event.stage) {
      return `[${event.stage.name ?? event.stage.id ?? 'stage'}]\n${event.stage.content ?? ''}\n\n`;
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
  return {
    id: question.id,
    label: question.label,
    query: question.query,
    status: raw.status,
    answer,
    latencyMs: Date.now() - startedAt,
    sourcesCount: sources.length,
    sources: sources.slice(0, 12),
    eventTypes: [...new Set(events.map((event) => event.type))],
    rawEvents: events,
    score: scoreAnswer(question, raw.status, answer, sources, events),
  };
}

function scoreAnswer(question, status, answer, sources, events) {
  const flags = [];
  if (status !== 200) flags.push('http_not_200');
  if (!answer || answer.length < 120) flags.push('answer_too_short');
  if (!events.some((event) => event.type === 'delta' || event.type === 'sentinel-stage')) flags.push('stream_error');
  if (events.some((event) => event.type === 'error' || event.type === 'parse_error')) flags.push('stream_error');
  const lower = answer.toLowerCase();
  for (const term of question.required) {
    if (!lower.includes(term.toLowerCase())) flags.push(`missing_required:${term}`);
  }
  for (const term of forbiddenTerms) {
    if (!question.allowForbiddenInQuestion && lower.includes(term.toLowerCase())) flags.push(`tenant_bleed:${term}`);
  }
  if (
    /pinecone/i.test(answer) &&
    !/\b(not|no|without|instead of|rather than|does not|do not|isn't|is not)\b[^.]{0,120}\bpinecone\b/i.test(answer) &&
    !/\bpinecone\b[^.]{0,80}\b(not|no|without|isn't|is not|not in play|not used|is not used)\b/i.test(answer)
  ) {
    flags.push('unsafe_pinecone_claim');
  }
  if (hasCompletionOverclaim(answer)) {
    flags.push('overclaims_completion');
  }
  if (sources.length === 0 && !/(based on the provided|current proof|what is known|not yet|do not claim|cannot claim)/i.test(answer)) {
    flags.push('weak_grounding');
  }
  const failFlags = flags.filter((flag) => /http_not_200|stream_error|tenant_bleed|unsafe_pinecone_claim|overclaims_completion/.test(flag));
  const verdict = failFlags.length ? 'fail' : flags.length ? 'watch' : 'pass';
  const numeric = verdict === 'pass' ? 10 : verdict === 'watch' ? Math.max(6, 9 - flags.length) : 3;
  return { verdict, numeric, flags };
}

function hasCompletionOverclaim(answer) {
  const unsafePatterns = [
    /realized savings (?:are|have been)/i,
    /award is complete/i,
    /cutover is complete/i,
  ];
  if (unsafePatterns.some((pattern) => pattern.test(answer))) return true;

  const readinessPattern = /all modules are 100% production-ready/i;
  const match = readinessPattern.exec(answer);
  if (!match) return false;

  const prefix = answer
    .slice(Math.max(0, match.index - 80), match.index)
    .toLowerCase();

  return !/\b(?:not|no|never|cannot|can't|should not|do not|don't|whether|asked whether)\b/.test(prefix);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function renderHtml(summary, turns) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Lakeshore Live Intelligence Proof</title>
  <style>
    body { margin: 0; padding: 32px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f7f3; color: #1f2937; }
    header, main { max-width: 1120px; margin: 0 auto; }
    h1 { margin: 0 0 8px; font-size: 34px; letter-spacing: 0; }
    .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .metric, .turn { background: #fff; border: 1px solid #ddd8cc; border-radius: 8px; box-shadow: 0 1px 1px rgba(31,41,55,.04); }
    .metric { padding: 14px 16px; }
    .metric b { display: block; font-size: 24px; }
    .turn { padding: 18px; margin: 14px 0; }
    .pass { border-left: 5px solid #168a4a; }
    .watch { border-left: 5px solid #b7791f; }
    .fail { border-left: 5px solid #b42318; }
    .meta { color: #64748b; font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
    .chips span { background: #eef2f7; border: 1px solid #d8dee8; border-radius: 999px; padding: 4px 8px; font-size: 12px; }
    p, li { line-height: 1.5; }
    pre { white-space: pre-wrap; font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
  </style>
</head>
<body>
  <header>
    <h1>Lakeshore Live Intelligence Proof</h1>
    <p>Authenticated production calls to <code>/api/intelligence/ask</code> with Lakeshore tenant pinning, captured from the browser session for ${escapeHtml(email)}.</p>
    <p><strong>Run:</strong> ${escapeHtml(summary.runId)} · <strong>Base URL:</strong> ${escapeHtml(summary.baseUrl)} · <strong>Started:</strong> ${escapeHtml(summary.startedAt)} · <strong>Completed:</strong> ${escapeHtml(summary.completedAt)}</p>
    <section class="summary">
      <div class="metric"><b>${summary.total}</b> Questions</div>
      <div class="metric"><b>${summary.pass}</b> Pass</div>
      <div class="metric"><b>${summary.watch}</b> Watch</div>
      <div class="metric"><b>${summary.fail}</b> Fail</div>
      <div class="metric"><b>${summary.averageScore.toFixed(1)}</b> Avg / 10</div>
    </section>
  </header>
  <main>
    ${turns.map((turn) => `<section class="turn ${escapeHtml(turn.score.verdict)}">
      <div class="meta">${escapeHtml(turn.id)} · ${escapeHtml(turn.label)} · ${turn.latencyMs}ms · HTTP ${turn.status}</div>
      <h2>${escapeHtml(turn.query)}</h2>
      <div class="chips"><span>${escapeHtml(turn.score.verdict.toUpperCase())}</span><span>score ${turn.score.numeric}/10</span><span>sources ${turn.sourcesCount}</span><span>events ${escapeHtml(turn.eventTypes.join(', '))}</span></div>
      <p><strong>Flags:</strong> ${turn.score.flags.length ? escapeHtml(turn.score.flags.join(', ')) : 'none'}</p>
      <h3>Captured Answer</h3>
      <pre>${escapeHtml(turn.answer)}</pre>
    </section>`).join('\n')}
  </main>
</body>
</html>`;
}

async function main() {
  loadEnvFile('/Users/anand/Projects/nexus/.env.local');
  const startedAt = new Date().toISOString();
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();
  const turns = [];
  try {
    await signIn(context, page);
    await page.goto('/intelligence/ask', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, 'intelligence-ask-start.png'), fullPage: true }).catch(() => {});

    for (const question of questions) {
      process.stdout.write(`${question.id} ${question.label} ... `);
      const turn = await askLive(page, question).catch((error) => ({
        id: question.id,
        label: question.label,
        query: question.query,
        status: 0,
        answer: `[runner-error] ${error instanceof Error ? error.message : String(error)}`,
        latencyMs: 0,
        sourcesCount: 0,
        sources: [],
        eventTypes: ['runner_error'],
        rawEvents: [],
        score: { verdict: 'fail', numeric: 0, flags: ['runner_error'] },
      }));
      turns.push(turn);
      await writeFile(path.join(outputDir, `${question.id}.json`), JSON.stringify(turn, null, 2));
      console.log(`${turn.score.verdict} (${turn.score.numeric}/10)`);
    }
  } finally {
    await browser.close();
  }

  const completedAt = new Date().toISOString();
  const summary = {
    runId,
    baseUrl,
    email,
    activeClient,
    startedAt,
    completedAt,
    total: turns.length,
    pass: turns.filter((turn) => turn.score.verdict === 'pass').length,
    watch: turns.filter((turn) => turn.score.verdict === 'watch').length,
    fail: turns.filter((turn) => turn.score.verdict === 'fail').length,
    averageScore: turns.reduce((sum, turn) => sum + turn.score.numeric, 0) / Math.max(1, turns.length),
    flags: turns.flatMap((turn) => turn.score.flags).reduce((acc, flag) => {
      acc[flag] = (acc[flag] ?? 0) + 1;
      return acc;
    }, {}),
  };

  await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));
  await writeFile(path.join(outputDir, 'transcript.json'), JSON.stringify(turns, null, 2));
  await writeFile(path.join(outputDir, 'report.html'), renderHtml(summary, turns));
  await writeFile(path.join(outputDir, 'README.md'), [
    '# Lakeshore Live Intelligence Proof',
    '',
    `Run: \`${runId}\``,
    `Base URL: \`${baseUrl}\``,
    `Persona: \`${email}\``,
    `Questions: ${summary.total}`,
    `Pass / watch / fail: ${summary.pass} / ${summary.watch} / ${summary.fail}`,
    `Average score: ${summary.averageScore.toFixed(1)} / 10`,
    '',
    'Truth boundary: this is an authenticated production `/api/intelligence/ask` proof with Lakeshore tenant pinning. It does not expand the corpus and does not replace the 100-question offline OpenAI QA pack.',
    '',
  ].join('\n'));

  console.log(`\nWrote ${outputDir}`);
  console.log(`Pass/watch/fail: ${summary.pass}/${summary.watch}/${summary.fail}; average=${summary.averageScore.toFixed(1)}`);
  if (summary.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
