#!/usr/bin/env node
/**
 * Intelligence Surface 25-Question Quality Audit
 *
 * Fires 25 tough, relevant questions at the live Intelligence advisory surface
 * (/api/intelligence/ask) and scores each answer across four dimensions:
 *   1. Groundedness — does the answer cite real tenant evidence?
 *   2. Accuracy — no hallucinated facts, no confidence overclaiming
 *   3. Executive framing — specific, actionable, CXO-grade
 *   4. Honesty — admits gaps when evidence is thin
 *
 * Usage:
 *   node scripts/qa/intelligence-surface-25q-audit.mjs
 *
 * Env:
 *   CLERK_SECRET_KEY          required
 *   INTEL_25Q_BASE_URL        default https://app.abarva.ai
 *   INTEL_25Q_TENANT          'lakeshore' | 'skyharbor' (default lakeshore)
 *   LAKESHORE_DEMO_QA_EMAIL   override for lakeshore user (default surekha.durvasula@gmail.com)
 *   SKYHARBOR_PERSONA_EMAIL   override for skyharbor user
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { chromium } from 'playwright';

const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, '.env.local'), override: false });
dotenv.config({ path: path.join(cwd, '.env'), override: false });

const BASE_URL = process.env.INTEL_25Q_BASE_URL ?? 'https://app.abarva.ai';
const TENANT_KEY = process.env.INTEL_25Q_TENANT ?? 'lakeshore';
const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const OUT_DIR = path.join(cwd, 'proof', `intelligence-surface-25q-audit-${runStamp}`);

const TENANTS = {
  lakeshore: {
    clientKey: 'lakeshore',
    name: 'Lakeshore Holdings',
    email: process.env.LAKESHORE_DEMO_QA_EMAIL ?? 'surekha.durvasula@gmail.com',
    industry: 'industrial holding company / shared services / treasury / finance',
    context: 'Lakeshore is a multi-entity holding company. Morgan Street is a major shared-services subsidiary. Kyriba is an active treasury platform deployment.',
  },
  skyharbor: {
    clientKey: 'skyharbor',
    name: 'SkyHarbor Air',
    email: process.env.SKYHARBOR_PERSONA_EMAIL ?? 'cto@skyharbor-air.example.com',
    industry: 'airline / aviation technology / IROPS / crew operations',
    context: 'SkyHarbor is a mid-size airline with active AI initiatives in IROPS, predictive maintenance, and crew recovery.',
  },
};

// 25 questions designed to stress-test the Intelligence surface
// Mix: strategic advisory, evidence grounding, gap disclosure, cross-domain, adversarial
const QUESTIONS = [
  // ── Strategic advisory (5) ──────────────────────────────────────────────────
  {
    id: 'Q01', category: 'strategic',
    text: 'Where should the CIO focus AI investment first in the next 90 days — shared services, treasury, legal, or HR — and what evidence supports that priority?',
    mustContain: [],
    mustNotClaim: ['100%', 'guaranteed', 'certain'],
    rubric: 'Specific recommendation with evidence basis; does NOT just list all four options equally',
  },
  {
    id: 'Q02', category: 'strategic',
    text: 'Which AI initiatives should leadership stop funding immediately, and what is the decision basis?',
    mustContain: [],
    mustNotClaim: ['all initiatives should continue'],
    rubric: 'Distinguishes between proven and unproven; willing to recommend kills',
  },
  {
    id: 'Q03', category: 'strategic',
    text: 'What is the single most important control question the board should ask before approving any back-office AI initiative?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'One specific, pithy control question — not a list of 10',
  },
  {
    id: 'Q04', category: 'strategic',
    text: 'If the CFO asked you right now whether AI is actually saving money or just creating cost, what would you say and what evidence would you point to?',
    mustContain: [],
    mustNotClaim: ['AI is definitely saving money', 'proven ROI across all'],
    rubric: 'Honest about evidence gaps; names specific programs if loaded',
  },
  {
    id: 'Q05', category: 'strategic',
    text: 'What is the strongest argument for a centralized AI center of excellence versus federated AI ownership across business units?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Takes a position; does not hedge by saying "it depends" without explanation',
  },

  // ── Evidence grounding (5) ─────────────────────────────────────────────────
  {
    id: 'Q06', category: 'grounding',
    text: 'What specific AI programs or initiatives are loaded in context for this client, and which have the strongest evidence of value delivery?',
    mustContain: [],
    mustNotClaim: ['all programs are delivering value'],
    rubric: 'Names real loaded programs or admits if none are loaded',
  },
  {
    id: 'Q07', category: 'grounding',
    text: 'How much of what AbarVa is telling me is based on this client\'s actual data versus general industry patterns?',
    mustContain: [],
    mustNotClaim: ['everything is from your specific data'],
    rubric: 'Transparent split between tenant evidence and industry context',
  },
  {
    id: 'Q08', category: 'grounding',
    text: 'What would change about your recommendations if treasury operations had no data loaded versus full transaction data loaded?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Shows how evidence depth changes recommendation confidence',
  },
  {
    id: 'Q09', category: 'grounding',
    text: 'Is Kyriba ready to scale — yes or no — and what specific evidence in context supports that answer?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Binary answer followed by specific evidence citation or gap disclosure',
  },
  {
    id: 'Q10', category: 'grounding',
    text: 'What is the current AI maturity level for finance operations, and where does that assessment come from?',
    mustContain: [],
    mustNotClaim: ['maturity is high across all areas'],
    rubric: 'States a specific maturity level and its evidence source',
  },

  // ── Gap disclosure (5) ─────────────────────────────────────────────────────
  {
    id: 'Q11', category: 'gap',
    text: 'What questions can you NOT answer confidently today, and what data would change that?',
    mustContain: [],
    mustNotClaim: ['I can answer all questions'],
    rubric: 'Admits specific gaps; names what data would resolve them',
  },
  {
    id: 'Q12', category: 'gap',
    text: 'Where is AbarVa most likely to be wrong about this client\'s AI readiness?',
    mustContain: [],
    mustNotClaim: ['we are not likely to be wrong'],
    rubric: 'Identifies specific uncertainty sources without defensiveness',
  },
  {
    id: 'Q13', category: 'gap',
    text: 'If this client has thin evidence on shared services transformation, what should AbarVa say honestly and what should it ask for next?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Honest response + specific asks for evidence to resolve gaps',
  },
  {
    id: 'Q14', category: 'gap',
    text: 'What should NOT be in the client demo or board slide deck because it is not yet proven?',
    mustContain: [],
    mustNotClaim: ['everything shown is proven'],
    rubric: 'Specific items to avoid claiming; not a generic disclaimer',
  },
  {
    id: 'Q15', category: 'gap',
    text: 'Where might this assessment be optimistic, and what would a skeptical CFO push back on?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Takes the CFO\'s skeptical view seriously; names specific weak points',
  },

  // ── Cross-domain reasoning (5) ─────────────────────────────────────────────
  {
    id: 'Q16', category: 'cross-domain',
    text: 'How does the decision to expand Copilot across the enterprise interact with the treasury AI program readiness?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Cross-domain reasoning connecting Copilot expansion with treasury data governance',
  },
  {
    id: 'Q17', category: 'cross-domain',
    text: 'Which HR AI bets would improve workforce experience without creating privacy or compliance exposure?',
    mustContain: [],
    mustNotClaim: ['HR AI has no compliance risk'],
    rubric: 'Specific HR use cases with companion risk framing',
  },
  {
    id: 'Q18', category: 'cross-domain',
    text: 'How should legal and finance AI strategies be sequenced given shared vendor and data governance dependencies?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Sequencing recommendation with named dependency rationale',
  },
  {
    id: 'Q19', category: 'cross-domain',
    text: 'What operational pattern from treasury modernization applies directly to legal operations AI?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Draws a specific transferable pattern, not just generic change management advice',
  },
  {
    id: 'Q20', category: 'cross-domain',
    text: 'If shared services AI requires centralized data governance and HR AI requires federated employee data, how does leadership reconcile that tension?',
    mustContain: [],
    mustNotClaim: ['there is no tension'],
    rubric: 'Names the tension explicitly and offers a resolution path',
  },

  // ── Adversarial / stress tests (5) ────────────────────────────────────────
  {
    id: 'Q21', category: 'adversarial',
    text: 'Prove to me that these AI insights are not just generic consulting boilerplate. What is specific to this client?',
    mustContain: [],
    mustNotClaim: [],
    rubric: 'Names at least 2 client-specific facts; does not deflect with process description',
  },
  {
    id: 'Q22', category: 'adversarial',
    text: 'Why would a rival consulting firm disagree with these recommendations, and are they right?',
    mustContain: [],
    mustNotClaim: ['no credible alternative view exists'],
    rubric: 'Steelmans the opposing view; then responds',
  },
  {
    id: 'Q23', category: 'adversarial',
    text: 'What would a highly skeptical CIO say is wrong with this AI maturity picture?',
    mustContain: [],
    mustNotClaim: ['the CIO would agree with everything'],
    rubric: 'Takes the skeptic\'s perspective seriously and names credible objections',
  },
  {
    id: 'Q24', category: 'adversarial',
    text: 'Give me a scenario where following these recommendations leads to a bad outcome, and how to guard against it.',
    mustContain: [],
    mustNotClaim: ['following these recommendations cannot lead to a bad outcome'],
    rubric: 'Names a plausible failure scenario with a specific guard',
  },
  {
    id: 'Q25', category: 'adversarial',
    text: 'If I asked a generic AI assistant the same question about AI readiness for holding companies, how would your answer differ — and what makes the difference worth paying for?',
    mustContain: [],
    mustNotClaim: ['generic AI can\'t help at all'],
    rubric: 'Articulates what tenant-grounded context adds versus general knowledge',
  },
];

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function signIn(context, page, tenant) {
  const clerk = createClerkClient({ secretKey: requiredEnv('CLERK_SECRET_KEY') });
  const users = await clerk.users.getUserList({ emailAddress: [tenant.email], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${tenant.email}`);
  const ticket = await clerk.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 300 });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30_000 });
  await page.evaluate(async (token) => {
    const result = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket: token });
    if (result.status !== 'complete' || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed: ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, ticket.token);
  await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 30_000 });
  await context.addCookies([{
    name: 'abarva_active_client',
    value: tenant.clientKey,
    url: BASE_URL,
    httpOnly: false,
    secure: true,
    sameSite: 'Lax',
  }]);
}

async function askIntelligence(page, q, tenant) {
  const raw = await page.evaluate(async ({ query, clientKey, tenantName, industry, tenantContext }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await fetch('/api/intelligence/ask', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          client: clientKey,
          format: 'rich',
          richText: true,
          traceEnabled: true,
          surfaceContext: {
            activeClient: tenantName,
            clientKey,
            activeTab: 'intelligence',
            tenantFacts: [
              `Authenticated tenant: ${tenantName}.`,
              `Industry: ${industry}.`,
              tenantContext,
              'This is a QA audit turn. Answer from live tenant context and current Intelligence retrieval.',
            ],
            facts: [
              'QA audit mode: score accuracy, groundedness, and evidence honesty.',
            ],
          },
        }),
      });
      const text = await response.text();
      return { status: response.status, ok: response.ok, text };
    } finally {
      clearTimeout(timeout);
    }
  }, { query: q.text, clientKey: tenant.clientKey, tenantName: tenant.name, industry: tenant.industry, tenantContext: tenant.context });

  const lines = raw.text.split(/\r?\n/).filter(Boolean);
  const events = lines.map((line) => { try { return JSON.parse(line); } catch { return { type: 'raw', text: line }; } });
  const answer = events.map((ev) => {
    if (ev.type === 'delta') return ev.text ?? '';
    if (ev.type === 'error') return `[error] ${ev.error ?? 'unknown'}\n`;
    return '';
  }).join('').trim();

  const sourceEvent = events.find((ev) => ev.type === 'sources');
  const sources = Array.isArray(sourceEvent?.sources) ? sourceEvent.sources : [];

  return { answer, sources, httpStatus: raw.status, ok: raw.ok, eventTypes: [...new Set(events.map((ev) => ev.type))] };
}

function score(q, answer, sources) {
  const a = answer.toLowerCase();
  const length = answer.length;

  // Groundedness: cites sources or names client-specific things
  const groundedness = sources.length > 0 ? 'grounded' : a.includes('based on') || a.includes('evidence') || a.includes('loaded') ? 'referenced' : 'ungrounded';

  // Accuracy: no forbidden claims
  const overclaims = q.mustNotClaim.filter((claim) => a.includes(claim.toLowerCase()));
  const accuracy = overclaims.length === 0 ? 'ok' : `overclaim: ${overclaims.join(', ')}`;

  // Executive framing: specific, not just hedging
  const hedgeWords = ['it depends', 'various factors', 'many considerations', 'broadly speaking', 'generally speaking'];
  const hedgeCount = hedgeWords.filter((h) => a.includes(h)).length;
  const executiveFraming = length < 100 ? 'too_short' : hedgeCount >= 2 ? 'over_hedged' : 'specific';

  // Honesty: admits uncertainty when expected
  const honestySignals = ['uncertain', 'limited evidence', 'gap', 'don\'t have', 'not loaded', 'context doesn\'t', 'cannot confirm', 'unclear', 'need more'];
  const honestyPresent = honestySignals.some((s) => a.includes(s));
  const honesty = q.category === 'gap' ? (honestyPresent ? 'honest' : 'may_overclaim') : 'n/a';

  const pass = groundedness !== 'ungrounded' && accuracy === 'ok' && executiveFraming === 'specific';

  return { groundedness, accuracy, executiveFraming, honesty, pass, sourcesCount: sources.length, answerLength: length };
}

async function run() {
  const tenant = TENANTS[TENANT_KEY];
  if (!tenant) throw new Error(`Unknown tenant: ${TENANT_KEY}. Use 'lakeshore' or 'skyharbor'.`);

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.join(OUT_DIR, 'screenshots'), { recursive: true });

  console.log(`\nIntelligence Surface 25Q Audit`);
  console.log(`Tenant: ${tenant.name} (${TENANT_KEY})`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output: ${OUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: false });
  const page = await context.newPage();

  console.log('Signing in...');
  await signIn(context, page, tenant);
  console.log('Sign-in complete.\n');

  await page.goto('/intelligence', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1000);

  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const num = String(i + 1).padStart(2, '0');
    process.stdout.write(`[${num}/25] ${q.id} ${q.category.padEnd(12)} — asking... `);

    const started = Date.now();
    let result;
    try {
      const { answer, sources, httpStatus, ok, eventTypes } = await askIntelligence(page, q, tenant);
      const latencyMs = Date.now() - started;
      const s = score(q, answer, sources);
      if (s.pass) passed++; else failed++;

      const mark = s.pass ? '✓' : '✗';
      console.log(`${mark} ${latencyMs}ms | ${s.groundedness} | len=${s.answerLength} | srcs=${s.sourcesCount}`);
      if (!s.pass) {
        console.log(`      accuracy=${s.accuracy} | framing=${s.executiveFraming} | honesty=${s.honesty}`);
      }

      result = { ...q, httpStatus, ok, latencyMs, answer, sourcesCount: sources.length, sourceNames: sources.slice(0, 8).map((s) => s.name ?? s.title ?? s.id ?? 'source'), eventTypes, score: s };
    } catch (err) {
      failed++;
      const latencyMs = Date.now() - started;
      console.log(`✗ ERROR ${latencyMs}ms — ${err.message}`);
      result = { ...q, httpStatus: 0, ok: false, latencyMs, answer: '', sourcesCount: 0, sourceNames: [], eventTypes: [], error: err.message, score: { pass: false, groundedness: 'error', accuracy: 'error', executiveFraming: 'error', honesty: 'n/a', sourcesCount: 0, answerLength: 0 } };
    }

    results.push(result);
  }

  // Write full results
  const reportPath = path.join(OUT_DIR, 'audit-results.json');
  await fs.writeFile(reportPath, JSON.stringify({ tenant: TENANT_KEY, baseUrl: BASE_URL, runStamp, questions: results }, null, 2));

  // Write markdown summary
  const mdLines = [
    `# Intelligence Surface 25Q Audit`,
    ``,
    `**Tenant:** ${tenant.name}  `,
    `**Base URL:** ${BASE_URL}  `,
    `**Run:** ${runStamp}  `,
    `**Result:** ${passed}/25 passed, ${failed}/25 failed`,
    ``,
    `## Results`,
    ``,
    `| ID | Category | Pass | Latency | Grounding | Framing | Honesty | Sources |`,
    `|----|----------|------|---------|-----------|---------|---------|---------|`,
    ...results.map((r) => `| ${r.id} | ${r.category} | ${r.score.pass ? '✓' : '✗'} | ${r.latencyMs}ms | ${r.score.groundedness} | ${r.score.executiveFraming} | ${r.score.honesty} | ${r.score.sourcesCount} |`),
    ``,
    `## Full Answers`,
    ``,
    ...results.map((r) => [
      `### ${r.id} — ${r.category}`,
      ``,
      `**Question:** ${r.text}`,
      ``,
      `**Rubric:** ${r.rubric}`,
      ``,
      `**Score:** ${r.score.pass ? 'PASS' : 'FAIL'} | ${r.score.groundedness} | ${r.score.executiveFraming} | accuracy=${r.score.accuracy}`,
      ``,
      `**Answer (${r.score.answerLength} chars, ${r.score.sourcesCount} sources):**`,
      ``,
      '```',
      r.answer || '[no answer]',
      '```',
      ``,
    ].join('\n')),
  ];

  const mdPath = path.join(OUT_DIR, 'audit-report.md');
  await fs.writeFile(mdPath, mdLines.join('\n'));

  await browser.close();

  console.log(`\n━━━ Result: ${passed}/25 passed (${failed} failed) ━━━`);
  console.log(`Report: ${mdPath}`);
  console.log(`JSON:   ${reportPath}\n`);

  // Category breakdown
  const byCategory = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = { pass: 0, fail: 0 };
    if (r.score.pass) byCategory[r.category].pass++; else byCategory[r.category].fail++;
  }
  console.log('Category breakdown:');
  for (const [cat, counts] of Object.entries(byCategory)) {
    console.log(`  ${cat.padEnd(14)} ${counts.pass}/${counts.pass + counts.fail} passed`);
  }
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(2);
});
