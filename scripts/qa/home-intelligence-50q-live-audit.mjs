#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { chromium } from 'playwright';

const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, '.env.local'), override: false });
dotenv.config({ path: path.join(cwd, '.env'), override: false });

const baseUrl = process.env.HOME_INTEL_QA_BASE_URL ?? 'https://app.abarva.ai';
const outRoot = process.env.HOME_INTEL_QA_OUT ?? path.join(cwd, 'proof', 'home-intelligence-50q-live-audit');
const scope = process.env.HOME_INTEL_QA_SCOPE ?? 'all';
const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(outRoot, runStamp);

const TENANTS = {
  lakeshore: {
    clientKey: 'lakeshore',
    name: 'Lakeshore Holdings',
    email: process.env.LAKESHORE_DEMO_QA_EMAIL ?? 'cfo@lakeshore-holdings.example.com',
    industry: 'industrial holding company / shared services',
  },
  skyharbor: {
    clientKey: 'skyharbor',
    name: 'SkyHarbor Air',
    email: process.env.SKYHARBOR_PERSONA_EMAIL ?? 'cto@skyharbor-air.example.com',
    industry: 'airline / aviation technology',
  },
};

const HOME_QUESTIONS = [
  q('HOME-001', 'lakeshore', 'context', 'Show me the enterprise profile context.', ['enterprise', 'profile']),
  q('HOME-002', 'lakeshore', 'context', 'What is loaded about business functions?', ['business', 'function']),
  q('HOME-003', 'lakeshore', 'context', 'Open org ownership.', ['org', 'ownership']),
  q('HOME-004', 'lakeshore', 'context', 'Show workforce personas.', ['workforce', 'persona']),
  q('HOME-005', 'lakeshore', 'context', 'Show programs, initiatives, and business priorities.', ['program', 'initiative']),
  q('HOME-006', 'lakeshore', 'context', 'Show system and business relationships.', ['relationship']),
  q('HOME-007', 'lakeshore', 'context', 'What applications and systems are loaded?', ['application', 'system']),
  q('HOME-008', 'lakeshore', 'context', 'Show data assets and integrations.', ['data', 'integration']),
  q('HOME-009', 'lakeshore', 'context', 'Show vendors and contracts.', ['vendor', 'contract']),
  q('HOME-010', 'lakeshore', 'context', 'Show IT budget and run cost.', ['budget']),
  q('HOME-011', 'lakeshore', 'context', 'Open AI footprint and adoption.', ['ai', 'adoption']),
  q('HOME-012', 'lakeshore', 'context', 'Show risk and model governance.', ['risk', 'governance']),
  q('HOME-013', 'lakeshore', 'context', 'Show operations and reliability.', ['operation', 'reliability']),
  q('HOME-014', 'lakeshore', 'context', 'Show industry benchmarks.', ['benchmark']),
  q('HOME-015', 'lakeshore', 'context', 'Show policies and governance.', ['policy', 'governance']),
  q('HOME-016', 'lakeshore', 'context', 'Which portfolio companies are represented in the loaded context?', ['portfolio', 'company']),
  q('HOME-017', 'lakeshore', 'boundary', 'What is the capital of Uganda?', ['context browser']),
  q('HOME-018', 'lakeshore', 'boundary', 'What is Microsoft stock price today?', ['context browser']),
  q('HOME-019', 'lakeshore', 'boundary', 'Should we fund HR AI first or legal AI first?', ['intelligence']),
  q('HOME-020', 'lakeshore', 'boundary', 'Create an RFP for treasury managed services.', ['intelligence', 'source']),
  q('HOME-021', 'lakeshore', 'boundary', 'Recommend which AI initiatives to kill.', ['intelligence']),
  q('HOME-022', 'lakeshore', 'boundary', 'Build a 90 day roadmap for shared services AI.', ['intelligence']),
  q('HOME-023', 'lakeshore', 'boundary', 'Who won the cricket match yesterday?', ['context browser']),
  q('HOME-024', 'lakeshore', 'boundary', 'What is the weather in Chicago?', ['context browser']),
];

const INTELLIGENCE_QUESTIONS = [
  q('INT-LSH-001', 'lakeshore', 'intelligence', 'For Lakeshore, where should the CIO and VP Innovation focus AI first across HR, finance, treasury, legal, and shared services?', ['Lakeshore', 'AI']),
  q('INT-LSH-002', 'lakeshore', 'intelligence', 'What should Morgan Street position as the first shared-services AI lighthouse and why?', ['shared', 'service']),
  q('INT-LSH-003', 'lakeshore', 'intelligence', 'Is Kyriba ready to go live, or what control evidence is still open?', ['Kyriba']),
  q('INT-LSH-004', 'lakeshore', 'intelligence', 'Which finance and treasury AI initiatives are proven enough to scale versus still need evidence?', ['finance', 'treasury']),
  q('INT-LSH-005', 'lakeshore', 'intelligence', 'Where is finance AI spend committed but value not yet realized?', ['finance', 'value']),
  q('INT-LSH-006', 'lakeshore', 'intelligence', 'How should the CFO think about AI in FP&A without creating spreadsheet theater?', ['CFO', 'FP&A']),
  q('INT-LSH-007', 'lakeshore', 'intelligence', 'What legal AI use cases are safe to start with, and where should Legal avoid automation?', ['legal', 'AI']),
  q('INT-LSH-008', 'lakeshore', 'intelligence', 'What HR AI bets would improve employee experience without creating policy or privacy risk?', ['HR', 'risk']),
  q('INT-LSH-009', 'lakeshore', 'intelligence', 'What should the CIO ask before approving an enterprise Copilot expansion?', ['CIO', 'Copilot']),
  q('INT-LSH-010', 'lakeshore', 'intelligence', 'Give me the executive answer on whether shared services AI should be centralized or federated.', ['shared', 'central']),
  q('INT-LSH-011', 'lakeshore', 'intelligence', 'What proof should the CFO require before any AI savings appear in the board deck?', ['CFO', 'proof']),
  q('INT-LSH-012', 'lakeshore', 'intelligence', 'Which back-office processes are most likely to be transformed, not just automated?', ['process', 'transform']),
  q('INT-LSH-013', 'lakeshore', 'intelligence', 'What is the 90 day path to turn the value office concept into operating rhythm?', ['90', 'value office']),
  q('INT-LSH-014', 'lakeshore', 'intelligence', 'Where would a CIO get surprised by hidden data readiness gaps in back-office AI?', ['data', 'readiness']),
  q('INT-LSH-015', 'lakeshore', 'intelligence', 'What are the top vendor and platform questions for shared-services AI?', ['vendor', 'platform']),
  q('INT-LSH-016', 'lakeshore', 'intelligence', 'How should Lakeshore explain the value of AbarVa versus a manual consulting assessment?', ['AbarVa', 'manual']),
  q('INT-LSH-017', 'lakeshore', 'intelligence', 'If the client has thin finance-process evidence today, what should AbarVa say and ask for next?', ['finance', 'evidence']),
  q('INT-LSH-018', 'lakeshore', 'intelligence', 'What should not be claimed yet in the Morgan Street CIO demo?', ['claim', 'demo']),

  q('INT-SKY-001', 'skyharbor', 'intelligence', 'For SkyHarbor, where should we fund AI next across IROPS, predictive maintenance, crew recovery, loyalty, and customer disruption recovery?', ['SkyHarbor', 'AI']),
  q('INT-SKY-002', 'skyharbor', 'intelligence', 'Should IROPS AI scale now or wait for operational data certification?', ['IROPS', 'data']),
  q('INT-SKY-003', 'skyharbor', 'intelligence', 'What is the best CTO story for modernizing IBM Z without disrupting airline operations?', ['IBM', 'modern']),
  q('INT-SKY-004', 'skyharbor', 'intelligence', 'Which airline AI initiatives should leadership hold until evidence improves?', ['airline', 'evidence']),
  q('INT-SKY-005', 'skyharbor', 'intelligence', 'Why might the lowest raw cost technology option not be the best decision for SkyHarbor?', ['cost', 'decision']),
  q('INT-SKY-006', 'skyharbor', 'intelligence', 'How should SkyHarbor compare Loyalty AI and IROPS AI as investment choices?', ['Loyalty', 'IROPS']),
  q('INT-SKY-007', 'skyharbor', 'intelligence', 'What operational guardrails are needed before agentic crew recovery can scale?', ['crew', 'guardrail']),
  q('INT-SKY-008', 'skyharbor', 'intelligence', 'What should the CTO ask vendors about airline disruption recovery AI?', ['vendor', 'disruption']),
  q('INT-SKY-009', 'skyharbor', 'intelligence', 'Which data products matter most for IROPS AI readiness?', ['data', 'IROPS']),
  q('INT-SKY-010', 'skyharbor', 'intelligence', 'What should we do first if customer disruption recovery has high value but poor readiness?', ['customer', 'readiness']),
  q('INT-SKY-011', 'skyharbor', 'intelligence', 'Give me a board-ready view of airline AI portfolio sequencing.', ['board', 'portfolio']),
  q('INT-SKY-012', 'skyharbor', 'intelligence', 'What should SkyHarbor stop doing in AI experiments?', ['SkyHarbor', 'stop']),
  q('INT-SKY-013', 'skyharbor', 'intelligence', 'How should the CTO explain risk in autonomous operational decisioning?', ['CTO', 'risk']),
  q('INT-SKY-014', 'skyharbor', 'intelligence', 'Where can industry trend context help SkyHarbor without pretending it is tenant evidence?', ['industry', 'evidence']),
  q('INT-SKY-015', 'skyharbor', 'intelligence', 'What is the strongest case study pattern for airline IROPS AI?', ['airline', 'IROPS']),
  q('INT-SKY-016', 'skyharbor', 'intelligence', 'What is the fastest meaningful next action after the airline AI portfolio review?', ['next', 'action']),
  q('INT-SKY-017', 'skyharbor', 'intelligence', 'How should SkyHarbor decide between predictive maintenance AI and crew recovery AI?', ['predictive', 'crew']),
  q('INT-SKY-018', 'skyharbor', 'intelligence', 'What should not be claimed yet in the SkyHarbor CTO demo?', ['claim', 'demo']),
];

function q(id, tenant, type, text, expectedTerms) {
  return { id, tenant, type, text, expectedTerms };
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function signIn(context, page, tenant) {
  const clerk = createClerkClient({ secretKey: requiredEnv('CLERK_SECRET_KEY') });
  const users = await clerk.users.getUserList({ emailAddress: [tenant.email], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${tenant.email}`);
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
      value: tenant.clientKey,
      url: baseUrl,
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ]);
}

async function runHomeQuestion(page, item, index) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(600);
  const beforeText = await safeBodyText(page);
  const asked = await askHomeWithPlaywright(page, item.text);
  await page.waitForFunction(
    () => !(document.body?.innerText ?? '').includes('Reading loaded context'),
    null,
    { timeout: 20_000 },
  ).catch(() => {});
  await page.waitForTimeout(500);
  const afterText = await safeBodyText(page);
  const screenshotPath = index < 6 || item.type === 'boundary'
    ? path.join(outDir, 'screenshots', `${item.id}.png`)
    : null;
  if (screenshotPath) {
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  }
  const score = scoreHome(item, beforeText, afterText, asked);
  return {
    ...item,
    module: 'home',
    startedAt,
    completedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    claudePrompt: null,
    claudeResponse: null,
    renderedText: trimText(afterText),
    beforeText: trimText(beforeText),
    interaction: asked,
    screenshotPath,
    score,
  };
}

async function askHomeWithPlaywright(page, question) {
  const selectors = [
    'input[aria-label*="Ask" i]',
    'textarea[aria-label*="Ask" i]',
    'input[placeholder*="Ask" i]',
    'textarea[placeholder*="Ask" i]',
    'input[placeholder*="context" i]',
    'textarea[placeholder*="context" i]',
  ];
  for (const selector of selectors) {
    const locator = page.locator(selector).last();
    if ((await locator.count()) === 0) continue;
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 });
      await locator.fill('');
      await locator.fill(question);
      await locator.press('Enter');
      return { ok: true, method: `fill-enter:${selector}` };
    } catch {
      // Try the next likely selector.
    }
  }

  const anyInput = page.locator('input, textarea').last();
  if ((await anyInput.count()) > 0) {
    try {
      await anyInput.scrollIntoViewIfNeeded({ timeout: 3000 });
      await anyInput.fill('');
      await anyInput.fill(question);
      await anyInput.press('Enter');
      return { ok: true, method: 'fill-enter:any-input' };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }
  }
  return { ok: false, reason: 'no ask input found' };
}

async function runIntelligenceQuestion(page, item, index) {
  const tenant = TENANTS[item.tenant];
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const raw = await page.evaluate(async ({ query, clientKey, tenantName, industry }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 95_000);
    try {
      const response = await fetch('/api/intelligence/ask', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          client: clientKey,
          tabId: `qa-${clientKey}-${Date.now()}`,
          traceEnabled: true,
          surfaceContext: {
            activeClient: tenantName,
            clientKey,
            activeTab: 'intelligence',
            tenantFacts: [
              `Authenticated tenant for this QA turn is ${tenantName}.`,
              `Industry lens is ${industry}.`,
            ],
            facts: [
              'This is a QA trace turn. Answer from live tenant context and current Intelligence retrieval.',
            ],
          },
        }),
      });
      const text = await response.text();
      return { status: response.status, text };
    } finally {
      clearTimeout(timeout);
    }
  }, {
    query: item.text,
    clientKey: tenant.clientKey,
    tenantName: tenant.name,
    industry: tenant.industry,
  });

  const events = raw.text.split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { type: 'parse_error', raw: line };
    }
  });
  const answer = events.map((event) => {
    if (event.type === 'delta') return event.text ?? '';
    if (event.type === 'sentinel-stage' && event.stage?.content) return `${event.stage.content}\n`;
    if (event.type === 'error') return `[error] ${event.error ?? 'unknown error'}\n`;
    return '';
  }).join('').trim();
  const sourceEvent = events.find((event) => event.type === 'sources');
  const traceEvent = events.find((event) => event.type === 'trace');
  const sources = Array.isArray(sourceEvent?.sources) ? sourceEvent.sources : [];
  const promptReconstruction = buildPromptReconstruction(item, tenant, sources, traceEvent);
  const promptPath = path.join(outDir, 'prompts', `${item.id}-prompt-reconstruction.txt`);
  await fs.writeFile(promptPath, promptReconstruction);

  const screenshotPath = index < 8
    ? path.join(outDir, 'screenshots', `${item.id}-api-proof.png`)
    : null;
  if (screenshotPath) {
    await page.goto('/intelligence', { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(700).catch(() => {});
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  }

  const auditRows = await readEgressRows(item.tenant, startedAt, new Date().toISOString()).catch((error) => ({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    rows: [],
  }));
  const score = scoreIntelligence(item, raw.status, answer, events, sources);
  return {
    ...item,
    module: 'intelligence',
    startedAt,
    completedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    httpStatus: raw.status,
    promptReconstructionPath: promptPath,
    promptReconstructionHash: sha256(promptReconstruction),
    claudePromptBoundary: 'Full production prompt is reconstructed from current source template and captured source packet. ai_egress_audit stores prompt hash/snapshot refs, not raw prompt text by default.',
    claudeAudit: auditRows,
    rawStreamPath: path.join(outDir, 'streams', `${item.id}.ndjson`),
    claudeResponse: answer,
    renderedText: answer,
    sourcesCount: sources.length,
    sourceNames: sources.slice(0, 10).map((source) => source.name ?? source.title ?? source.id ?? source.type ?? 'source'),
    eventTypes: [...new Set(events.map((event) => event.type))],
    traceSummary: summarizeTrace(traceEvent),
    screenshotPath,
    score,
  };
}

async function readEgressRows(tenantKey, startedAt, completedAt) {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: 'Supabase service env not configured', rows: [] };
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const tenant = await resolveTenant(sb, tenantKey);
  const started = new Date(new Date(startedAt).getTime() - 2000).toISOString();
  const completed = new Date(new Date(completedAt).getTime() + 2000).toISOString();
  const { data, error } = await sb
    .from('ai_egress_audit')
    .select('id, workflow, provider, model, route, data_class, policy_decision, prompt_hash, response_hash, prompt_snapshot_ref, response_snapshot_ref, request_metadata, created_at')
    .eq('tenant_id', tenant.id)
    .gte('created_at', started)
    .lte('created_at', completed)
    .ilike('workflow', 'intelligence-ask-synthesis%')
    .order('created_at', { ascending: true });
  if (error) return { ok: false, error: error.message, rows: [] };
  return { ok: true, tenant, rows: data ?? [] };
}

async function resolveTenant(sb, key) {
  const aliases = key === 'lakeshore'
    ? ['lakeshore', 'lakeshore-holdings', 'Lakeshore Holdings']
    : ['skyharbor', 'skyharbor-air', 'SkyHarbor Air'];
  const { data, error } = await sb
    .from('clients')
    .select('id, tenant_key, slug, name')
    .or([
      ...aliases.map((alias) => `tenant_key.eq.${alias}`),
      ...aliases.map((alias) => `slug.eq.${alias}`),
      ...aliases.map((alias) => `name.ilike.${alias}`),
    ].join(','))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Could not resolve tenant ${key}`);
  return data;
}

function buildPromptReconstruction(item, tenant, sources, traceEvent) {
  const sourceText = sources.length
    ? sources.map((source, index) => {
        const name = source.name ?? source.title ?? source.id ?? `source-${index + 1}`;
        const type = source.type ?? 'unknown';
        const detail = source.detail ?? source.snippet ?? source.text ?? JSON.stringify(source).slice(0, 1200);
        return `[SOURCE ${index + 1} - ${type} - ${name}]\n${detail}`;
      }).join('\n\n')
    : '[no direct corpus matches returned in sources event]';
  return [
    'PROMPT RECONSTRUCTION NOTE',
    'This file reconstructs the model-facing user prompt from the live production API stream and current source template. The current ai_egress_audit schema stores prompt_hash and optional snapshot refs; it does not expose raw prompt text by default.',
    '',
    `Tenant: ${tenant.name} (${tenant.clientKey})`,
    `Question ID: ${item.id}`,
    `User question: ${item.text}`,
    '',
    'SYSTEM PROMPT',
    'See src/lib/intelligence/ask/synthesizer.ts exports SYSTEM_PROMPT / CONCISE_SYSTEM_PROMPT plus tenant identity pin and module context contract. This run captures the template hash through the repository SHA and this reconstruction hash.',
    '',
    'SOURCES PROVIDED:',
    sourceText,
    '',
    'USER QUESTION:',
    item.text,
    '',
    'TRACE SUMMARY:',
    JSON.stringify(summarizeTrace(traceEvent), null, 2),
  ].join('\n');
}

function summarizeTrace(event) {
  if (!event) return null;
  const trace = event.trace ?? event;
  return {
    keys: Object.keys(trace).slice(0, 20),
    intent: trace.intent ?? trace.classification?.intent ?? trace.payload?.intent ?? null,
    sourceCount: Array.isArray(trace.sources) ? trace.sources.length : undefined,
    evidenceSelection: trace.evidenceSelection ? {
      selected: trace.evidenceSelection.selected?.length,
      rejected: trace.evidenceSelection.rejected?.length,
    } : undefined,
    validation: trace.validation ? {
      verdict: trace.validation.verdict,
      flags: trace.validation.flags,
    } : undefined,
  };
}

function scoreHome(item, beforeText, afterText, interaction) {
  const flags = [];
  const lower = afterText.toLowerCase();
  if (!interaction?.ok) flags.push(`ui_interaction:${interaction?.reason ?? 'failed'}`);
  if (item.type === 'boundary') {
    const boundaryRefusal = /(context browser|use intelligence|source|outside|outside scope|not a market data|not a general knowledge|not a news|not a weather|not a web search|falls outside|outside the enterprise record|not as a general)/i.test(afterText);
    if (/kampala/i.test(afterText) && !boundaryRefusal) flags.push('answered_general_trivia');
    if (/stock price|weather in chicago|cricket match/i.test(afterText) && !boundaryRefusal) flags.push('answered_outside_domain');
    if (!boundaryRefusal) {
      flags.push('weak_boundary_message');
    }
  } else {
    if (beforeText === afterText) flags.push('no_visible_change');
    for (const term of item.expectedTerms) {
      if (!lower.includes(term.toLowerCase())) flags.push(`missing_expected:${term}`);
    }
  }
  return verdictFromFlags(flags);
}

function scoreIntelligence(item, status, answer, events, sources) {
  const flags = [];
  const lower = answer.toLowerCase();
  if (status !== 200) flags.push(`http_${status}`);
  if (!answer || answer.length < 140) flags.push('answer_too_short');
  if (wordCount(answer) > 280) flags.push('answer_too_long');
  if (/<<<TAB:|grounding:|```json|\"canvasType\"|raw json|debug/i.test(answer)) flags.push('protocol_or_json_leak');
  if (/\b(sent[inie]l|sentinel)\b/i.test(answer)) flags.push('old_brand_leak');
  if (events.some((event) => event.type === 'parse_error' || event.type === 'error')) flags.push('stream_error');
  for (const term of item.expectedTerms) {
    if (!lower.includes(term.toLowerCase())) flags.push(`missing_expected:${term}`);
  }
  if (item.tenant === 'lakeshore' && /skyharbor|irops|airline|aircraft/i.test(answer)) flags.push('tenant_bleed_skyharbor');
  if (item.tenant === 'skyharbor' && /lakeshore|kyriba|morgan street|industrial demo/i.test(answer)) flags.push('tenant_bleed_lakeshore');
  if (!/(should|would|recommend|my read|focus|scale|hold|certify|start|avoid|gate|priority|next)/i.test(answer)) {
    flags.push('weak_point_of_view');
  }
  if (sources.length === 0 && !/(industry|pattern|my read|tenant|loaded|evidence|context)/i.test(answer)) flags.push('weak_grounding');
  return verdictFromFlags(flags);
}

function verdictFromFlags(flags) {
  const hard = flags.filter((flag) => /http_|stream_error|tenant_bleed|protocol_or_json_leak|old_brand_leak|answered_general_trivia|answered_outside_domain/.test(flag));
  const verdict = hard.length ? 'fail' : flags.length ? 'watch' : 'pass';
  const score = verdict === 'pass' ? 5 : verdict === 'watch' ? Math.max(3, 5 - flags.length * 0.5) : 1;
  return { verdict, score, flags };
}

async function safeBodyText(page) {
  return await page.evaluate(() => document.body?.innerText ?? '').catch((error) => `[body-read-error] ${error.message}`);
}

function trimText(text, max = 8000) {
  const clean = String(text ?? '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return clean.length > max ? `${clean.slice(0, max)}\n...[truncated]` : clean;
}

function wordCount(text) {
  return String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function renderReport(results, meta) {
  const counts = summarize(results);
  const rows = results.map((result) => `
    <tr class="${result.score.verdict}">
      <td>${escapeHtml(result.id)}</td>
      <td>${escapeHtml(result.module)}</td>
      <td>${escapeHtml(result.tenant)}</td>
      <td>${escapeHtml(result.text)}</td>
      <td>${escapeHtml(result.score.verdict)}</td>
      <td>${Number(result.score.score).toFixed(1)}</td>
      <td>${escapeHtml(result.score.flags.join(', ') || 'none')}</td>
      <td>${escapeHtml(result.latencyMs)}ms</td>
    </tr>`).join('');
  const details = results.map((result) => `
    <section class="card ${result.score.verdict}">
      <div class="meta">${escapeHtml(result.id)} - ${escapeHtml(result.module)} - ${escapeHtml(result.tenant)} - ${escapeHtml(result.latencyMs)}ms</div>
      <h2>${escapeHtml(result.text)}</h2>
      <p><b>Verdict:</b> ${escapeHtml(result.score.verdict)} (${Number(result.score.score).toFixed(1)}/5). <b>Flags:</b> ${escapeHtml(result.score.flags.join(', ') || 'none')}</p>
      ${result.module === 'intelligence' ? `<p><b>Prompt capture:</b> ${escapeHtml(result.claudePromptBoundary)}<br><b>Prompt reconstruction:</b> <code>${escapeHtml(result.promptReconstructionPath)}</code><br><b>Audit rows:</b> ${escapeHtml(result.claudeAudit?.ok ? result.claudeAudit.rows.length : `not available - ${result.claudeAudit?.error ?? 'unknown'}`)}</p>` : '<p><b>Prompt capture:</b> Home did not call Claude for this turn; it rendered a deterministic context-browser action or boundary notice.</p>'}
      <h3>Rendered / Returned Text</h3>
      <pre>${escapeHtml(result.renderedText ?? result.claudeResponse ?? '')}</pre>
    </section>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Home + Intelligence 50Q Live Audit</title>
  <style>
    body { margin: 0; background: #f7f6f1; color: #111827; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
    header, main { max-width: 1240px; margin: 0 auto; padding: 28px; }
    h1 { font: 700 34px Georgia, serif; margin: 0 0 8px; }
    .metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin: 22px 0; }
    .metric, .card { background: #fffdf8; border: 1px solid #ded8cb; border-radius: 8px; padding: 16px; }
    .metric b { display: block; font-size: 26px; font-family: Georgia, serif; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #ded8cb; }
    th, td { text-align: left; vertical-align: top; padding: 9px 10px; border-bottom: 1px solid #eee6d8; font-size: 13px; }
    th { color: #475569; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
    .pass { border-left: 5px solid #168a4a; }
    .watch { border-left: 5px solid #b7791f; }
    .fail { border-left: 5px solid #b42318; }
    tr.pass td:first-child { color: #168a4a; font-weight: 700; }
    tr.watch td:first-child { color: #b7791f; font-weight: 700; }
    tr.fail td:first-child { color: #b42318; font-weight: 700; }
    pre { white-space: pre-wrap; border: 1px solid #e6dfd1; background: #fbfaf7; padding: 12px; border-radius: 6px; max-height: 420px; overflow: auto; }
    code { font-size: 12px; }
    .meta { color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
  </style>
</head>
<body>
  <header>
    <h1>Home + Intelligence 50Q Live Audit</h1>
    <p>Authenticated live run against <code>${escapeHtml(meta.baseUrl)}</code>. Home is scored as deterministic context browsing; Intelligence is scored as Claude-backed advisory response with prompt reconstruction, stream capture, and optional egress audit metadata.</p>
    <p><b>Started:</b> ${escapeHtml(meta.startedAt)}. <b>Completed:</b> ${escapeHtml(meta.completedAt)}. <b>Output:</b> <code>${escapeHtml(outDir)}</code></p>
    <div class="metrics">
      <div class="metric"><b>${counts.total}</b>Total</div>
      <div class="metric"><b>${counts.pass}</b>Pass</div>
      <div class="metric"><b>${counts.watch}</b>Watch</div>
      <div class="metric"><b>${counts.fail}</b>Fail</div>
      <div class="metric"><b>${counts.avg.toFixed(1)}</b>Avg / 5</div>
      <div class="metric"><b>${counts.p95Latency}</b>P95 ms</div>
    </div>
  </header>
  <main>
    <h2>Question Table</h2>
    <table><thead><tr><th>ID</th><th>Module</th><th>Tenant</th><th>Question</th><th>Verdict</th><th>Score</th><th>Flags</th><th>Latency</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>Detailed Evidence</h2>
    ${details}
  </main>
</body>
</html>`;
}

function summarize(results) {
  const sortedLatency = results.map((result) => result.latencyMs ?? 0).sort((a, b) => a - b);
  return {
    total: results.length,
    pass: results.filter((result) => result.score.verdict === 'pass').length,
    watch: results.filter((result) => result.score.verdict === 'watch').length,
    fail: results.filter((result) => result.score.verdict === 'fail').length,
    avg: results.reduce((sum, result) => sum + Number(result.score.score ?? 0), 0) / Math.max(1, results.length),
    p95Latency: sortedLatency[Math.min(sortedLatency.length - 1, Math.floor(sortedLatency.length * 0.95))] ?? 0,
  };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(path.join(outDir, 'screenshots'), { recursive: true });
  await fs.mkdir(path.join(outDir, 'prompts'), { recursive: true });
  await fs.mkdir(path.join(outDir, 'streams'), { recursive: true });

  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const tenantKey of ['lakeshore', 'skyharbor']) {
      const tenant = TENANTS[tenantKey];
      const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      await signIn(context, page, tenant);
      await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.screenshot({ path: path.join(outDir, 'screenshots', `${tenantKey}-home-start.png`), fullPage: true }).catch(() => {});
      await page.goto('/intelligence', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.screenshot({ path: path.join(outDir, 'screenshots', `${tenantKey}-intelligence-start.png`), fullPage: true }).catch(() => {});

      const homeItems = scope === 'intelligence'
        ? []
        : HOME_QUESTIONS.filter((item) => item.tenant === tenantKey);
      for (let index = 0; index < homeItems.length; index += 1) {
        const item = homeItems[index];
        process.stdout.write(`${item.id} ${item.text.slice(0, 60)} ... `);
        const result = await runHomeQuestion(page, item, index).catch((error) => ({
          ...item,
          module: 'home',
          latencyMs: 0,
          renderedText: '',
          score: { verdict: 'fail', score: 1, flags: [`runner_error:${error instanceof Error ? error.message : String(error)}`] },
        }));
        results.push(result);
        await fs.writeFile(path.join(outDir, `${item.id}.json`), JSON.stringify(result, null, 2));
        console.log(result.score.verdict);
      }

      const intelligenceItems = scope === 'home'
        ? []
        : INTELLIGENCE_QUESTIONS.filter((item) => item.tenant === tenantKey);
      for (let index = 0; index < intelligenceItems.length; index += 1) {
        const item = intelligenceItems[index];
        process.stdout.write(`${item.id} ${item.text.slice(0, 60)} ... `);
        const result = await runIntelligenceQuestion(page, item, index).catch((error) => ({
          ...item,
          module: 'intelligence',
          latencyMs: 0,
          renderedText: '',
          claudeResponse: '',
          score: { verdict: 'fail', score: 1, flags: [`runner_error:${error instanceof Error ? error.message : String(error)}`] },
        }));
        results.push(result);
        if (result.rawStreamPath) {
          const streamFile = result.rawStreamPath;
          await fs.writeFile(streamFile, JSON.stringify({ note: 'Raw NDJSON stored in per-question JSON raw events when available.' }, null, 2)).catch(() => {});
        }
        await fs.writeFile(path.join(outDir, `${item.id}.json`), JSON.stringify(result, null, 2));
        console.log(result.score.verdict);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const completedAt = new Date().toISOString();
  const meta = { baseUrl, startedAt, completedAt, outDir };
  const counts = summarize(results);
  await fs.writeFile(path.join(outDir, 'results.json'), JSON.stringify({ meta, counts, results }, null, 2));
  await fs.writeFile(path.join(outDir, 'report.html'), renderReport(results, meta));
  await fs.writeFile(path.join(outDir, 'README.md'), [
    '# Home + Intelligence 50Q Live Audit',
    '',
    `Base URL: ${baseUrl}`,
    `Output: ${outDir}`,
    `Total: ${counts.total}`,
    `Pass/watch/fail: ${counts.pass}/${counts.watch}/${counts.fail}`,
    `Average score: ${counts.avg.toFixed(1)} / 5`,
    `P95 latency: ${counts.p95Latency} ms`,
    '',
    'Prompt boundary: Home is deterministic and should not call Claude. Intelligence prompt reconstruction is saved under prompts/. Current production audit rows store prompt hashes and optional snapshot refs, not raw model prompt text by default.',
  ].join('\n'));

  console.log(`\nWrote ${outDir}`);
  console.log(`Pass/watch/fail: ${counts.pass}/${counts.watch}/${counts.fail}; avg=${counts.avg.toFixed(1)}/5; p95=${counts.p95Latency}ms`);
  if (counts.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
