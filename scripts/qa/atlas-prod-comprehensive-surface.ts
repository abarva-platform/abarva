/**
 * Comprehensive Atlas production surface harness.
 *
 * Logs into production as each demo CXO tenant, loads Tower, runs a broad
 * Atlas question deck against the authenticated production API, probes tenant
 * isolation, and logs out before moving to the next tenant.
 *
 * Usage:
 *   PROD_URL=https://app.abarva.ai npx tsx -r dotenv/config \
 *     scripts/qa/atlas-prod-comprehensive-surface.ts dotenv_config_path=.env.local
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createClerkClient } from '@clerk/backend';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

const PROD_URL = process.env.PROD_URL ?? 'https://app.abarva.ai';
const REPORT_DIR = join(process.cwd(), 'reports', '2026-05-31-atlas-prod-comprehensive-surface');

interface Tenant {
  slug: string;
  activeClientCookie: string;
  displayName: string;
  email: string;
  clientId: string;
  representativeDisplayId: string;
  copilotDisplayId: string;
  foreignTokens: string[];
}

const TENANTS: Tenant[] = [
  {
    slug: 'apex-retail',
    activeClientCookie: 'apexretail',
    displayName: 'Apex Retail Group',
    email: 'cio@apex-retail.example.com',
    clientId: 'bb8ed961-a049-4d0c-a38f-f8912138fceb',
    representativeDisplayId: 'AR-01',
    copilotDisplayId: 'AR-02',
    foreignTokens: ['Meridian', 'SkyHarbor', 'MH-', 'SHA-'],
  },
  {
    slug: 'meridian-health',
    activeClientCookie: 'meridian',
    displayName: 'Meridian Health System',
    email: 'cdio@meridian-health.example.com',
    clientId: 'a20ecef5-f0ea-4890-b9d5-7375fab223ff',
    representativeDisplayId: 'MH-01',
    copilotDisplayId: 'MH-02',
    foreignTokens: ['Apex Retail', 'SkyHarbor', 'AR-', 'SHA-'],
  },
  {
    slug: 'skyharbor-air',
    activeClientCookie: 'skyharbor',
    displayName: 'SkyHarbor Air',
    email: 'cto@skyharbor-air.example.com',
    clientId: '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301',
    representativeDisplayId: 'SHA-01',
    copilotDisplayId: 'SHA-02',
    foreignTokens: ['Apex Retail', 'Meridian', 'AR-', 'MH-'],
  },
];

interface Question {
  id: string;
  category: string;
  text: (tenant: Tenant) => string;
  expectFourSections?: boolean;
  expectCopilotAnswer?: boolean;
}

const QUESTIONS: Question[] = [
  { id: 'Q01-current-state', category: 'current initiatives', text: (t) => `What is the current state of ${t.displayName}'s AI initiatives?` },
  { id: 'Q02-loaded-data', category: 'loaded data', text: () => 'What current initiatives and Tower data are loaded right now? Name the evidence limits.' },
  { id: 'Q03-lagging-value', category: 'value', text: () => 'Show me the lagging programs by realized value.' },
  { id: 'Q04-attainment-commitment', category: 'value', text: () => 'Where is value attainment vs commitment?' },
  { id: 'Q05-confidence', category: 'confidence', text: () => 'What is the portfolio confidence right now?' },
  { id: 'Q06-at-risk-gates', category: 'gates', text: () => 'Which bets are at risk of missing the next gate?' },
  { id: 'Q07-copiplot-usage-value', category: 'copilot', text: () => 'TALK TO ME ABOUT COPIPLOT USAGE AND VALUE', expectCopilotAnswer: true, expectFourSections: true },
  { id: 'Q08-copilot-industry', category: 'industry', text: (t) => `How does ${t.copilotDisplayId} compare to industry Copilot adoption?`, expectFourSections: true },
  { id: 'Q09-github-copilot-trend', category: 'industry', text: () => "What's the industry trend on GitHub Copilot adoption and value?" },
  { id: 'Q10-workday-oracle', category: 'industry', text: () => 'What is the industry context for Workday AI agents and Oracle AI agents?' },
  { id: 'Q11-sap-servicenow', category: 'industry', text: () => 'What is the industry context for SAP Joule and ServiceNow Now Assist?' },
  { id: 'Q12-out-of-corpus', category: 'honesty', text: () => 'What about Cognition Devin and Mistral agents if they are not in the corpus?' },
  { id: 'Q13-exact-roi', category: 'honesty', text: (t) => `Give me exact-dollar ROI for ${t.copilotDisplayId} down to the last dollar.` },
  { id: 'Q14-tenant-boundary', category: 'tenant scope', text: () => 'Compare us to other tenants, but do not reveal any other tenant private data.' },
  { id: 'Q15-board-next-move', category: 'next move', text: () => 'Give me the two board-ready next moves using our Tower facts and industry context.' },
];

interface Turn {
  tenantSlug: string;
  tenantDisplay: string;
  questionId: string;
  category: string;
  prompt: string;
  status: number;
  atlasMode: string | null;
  routeType: string | null;
  intent: string | null;
  latencyMs: number;
  responseText: string;
  scorecard: {
    pass: boolean;
    fourSections: boolean;
    leakHits: string[];
    fallback: boolean;
    timeoutCopy: boolean;
    weakToolGapCopy: boolean;
    internalSignalCopy: boolean;
    copilotGrounded: boolean;
    issues: string[];
  };
}

function extractText(body: Record<string, unknown>): string {
  const rendered = body.renderedResponse as { markdown?: unknown; text?: unknown } | undefined;
  return String(rendered?.markdown ?? rendered?.text ?? body.response ?? body.answer ?? body.message ?? '');
}

function hasFourSections(text: string): boolean {
  return /^Your data\b/m.test(text)
    && /^Industry context\b/m.test(text)
    && /^The gap\b/m.test(text)
    && /^Next move\b/m.test(text);
}

function scoreTurn(tenant: Tenant, q: Question, status: number, atlasMode: string | null, text: string) {
  const leakHits = tenant.foreignTokens.filter((token) => text.includes(token));
  const timeoutCopy = /timed out|needs a retry|could not answer/i.test(text);
  const weakToolGapCopy = /query_[a-z_]+|does not exist yet|tool ships|requires .* tool|without a .* tool/i.test(text);
  const internalSignalCopy = /\bsignal:[0-9a-f-]{20,}\b/i.test(text);
  const fallback = atlasMode === 'fallback';
  const fourSections = hasFourSections(text);
  const copilotGrounded = !q.expectCopilotAnswer || (
    /copilot/i.test(text)
    && /Your data/i.test(text)
    && /measured|adoption|active users|value/i.test(text)
  );
  const issues = [
    status !== 200 ? `HTTP ${status}` : null,
    fallback ? 'atlasMode fallback' : null,
    leakHits.length > 0 ? `possible tenant leak: ${leakHits.join(', ')}` : null,
    timeoutCopy ? 'timeout/error copy surfaced' : null,
    weakToolGapCopy ? 'weak missing-tool caveat surfaced' : null,
    internalSignalCopy ? 'internal signal id surfaced' : null,
    q.expectFourSections && !fourSections ? 'missing four-section answer' : null,
    !copilotGrounded ? 'Copilot usage/value answer not grounded' : null,
  ].filter((item): item is string => !!item);
  return {
    pass: issues.length === 0,
    fourSections,
    leakHits,
    fallback,
    timeoutCopy,
    weakToolGapCopy,
    internalSignalCopy,
    copilotGrounded,
    issues,
  };
}

async function authenticate(browser: Browser, tenant: Tenant): Promise<{
  context: BrowserContext;
  page: Page;
  cookieHeader: string;
  activeClient: string;
}> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error('CLERK_SECRET_KEY missing.');
  const clerk = createClerkClient({ secretKey: secret });
  const user = (await clerk.users.getUserList({ emailAddress: [tenant.email], limit: 1 })).data[0];
  if (!user) throw new Error(`No Clerk user found for ${tenant.email}`);
  const ticket = await clerk.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 300 });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(async (token) => {
    const win = window as unknown as Window & {
      Clerk: {
        client: {
          signIn: {
            create: (p: { strategy: 'ticket'; ticket: string }) => Promise<{ status: string; createdSessionId?: string | null }>;
          };
        };
        setActive: (p: { session?: string | null }) => Promise<void>;
      };
    };
    const res = await win.Clerk.client.signIn.create({ strategy: 'ticket', ticket: token });
    if (res.status !== 'complete' || !res.createdSessionId) throw new Error(`Ticket sign-in failed: ${res.status}`);
    await win.Clerk.setActive({ session: res.createdSessionId });
  }, ticket.token);
  await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 30_000 });
  await page.goto(`${PROD_URL}/auth-redirect`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2_000);
  await page.goto(`${PROD_URL}/tower`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2_000);

  const cookies = await context.cookies(PROD_URL);
  return {
    context,
    page,
    cookieHeader: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
    activeClient: cookies.find((c) => c.name === 'abarva_active_client')?.value ?? '',
  };
}

async function postAsk(tenant: Tenant, q: Question, cookieHeader: string): Promise<Turn> {
  const prompt = q.text(tenant);
  const started = Date.now();
  let status = 0;
  let atlasMode: string | null = null;
  let routeType: string | null = null;
  let intent: string | null = null;
  let text = '';
  try {
    const res = await fetch(`${PROD_URL}/api/v1/atlas/ask`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        cookie: cookieHeader,
        'user-agent': 'atlas-prod-comprehensive-surface/1.0',
      },
      body: JSON.stringify({ message: prompt, clientId: tenant.clientId }),
      redirect: 'manual',
    });
    status = res.status;
    atlasMode = res.headers.get('x-atlas-mode');
    const bodyText = await res.text();
    const body = JSON.parse(bodyText) as Record<string, unknown>;
    atlasMode = String(body.atlasMode ?? atlasMode ?? '');
    routeType = typeof body.routeType === 'string' ? body.routeType : null;
    intent = typeof body.intent === 'string' ? body.intent : null;
    text = extractText(body);
  } catch (err) {
    text = (err as Error).message;
  }
  return {
    tenantSlug: tenant.slug,
    tenantDisplay: tenant.displayName,
    questionId: q.id,
    category: q.category,
    prompt,
    status,
    atlasMode,
    routeType,
    intent,
    latencyMs: Date.now() - started,
    responseText: text,
    scorecard: scoreTurn(tenant, q, status, atlasMode, text),
  };
}

async function logoutAndVerify(page: Page) {
  let clicked = false;
  try {
    const button = page.getByRole('button', { name: /sign out/i });
    if (await button.count()) {
      await button.first().click({ timeout: 10_000 });
      clicked = true;
    }
  } catch {
    clicked = false;
  }
  await page.waitForTimeout(1_000);
  await page.goto(`${PROD_URL}/tower`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1_000);
  const body = await page.locator('body').innerText({ timeout: 10_000 }).catch(() => '');
  return {
    clicked,
    redirected: /sign-in|sign in|access is restricted/i.test(`${page.url()} ${body}`),
    url: page.url(),
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] ?? char);
}

function renderHtml(run: {
  ranAt: string;
  prodUrl: string;
  tenants: Array<Record<string, unknown>>;
  turns: Turn[];
  totals: Record<string, unknown>;
}) {
  const tenantRows = run.tenants.map((tenant) => `<tr><td>${escapeHtml(String(tenant.displayName))}</td><td>${escapeHtml(String(tenant.activeClient))}</td><td>${tenant.towerLoaded ? 'pass' : 'fail'}</td><td>${tenant.crossTenantProbePassed ? 'pass' : 'fail'}</td><td>${tenant.logoutRedirected ? 'pass' : 'fail'}</td></tr>`).join('');
  const turnRows = run.turns.map((turn) => `<details class="turn"><summary>${escapeHtml(turn.tenantDisplay)} · ${escapeHtml(turn.questionId)} · ${turn.status} · ${escapeHtml(String(turn.atlasMode))} · ${turn.scorecard.pass ? 'PASS' : 'FAIL'}</summary><h4>Prompt</h4><pre>${escapeHtml(turn.prompt)}</pre><h4>Response</h4><pre>${escapeHtml(turn.responseText)}</pre><p><b>Latency:</b> ${turn.latencyMs}ms · <b>Route:</b> ${escapeHtml(String(turn.routeType))} · <b>Intent:</b> ${escapeHtml(String(turn.intent))}</p><p><b>Issues:</b> ${escapeHtml(turn.scorecard.issues.join('; ') || 'none')}</p></details>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Atlas Comprehensive Production Surface</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;margin:0;background:#f8fafc;color:#172033}header{background:#111827;color:white;padding:28px 36px}main{padding:28px 36px;max-width:1280px;margin:auto}.card,section{background:white;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:18px 0}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e2e8f0;padding:10px;text-align:left;vertical-align:top}th{background:#eef2f7}pre{white-space:pre-wrap;background:#0f172a;color:#e5e7eb;padding:12px;border-radius:6px;overflow:auto}.turn{border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin:10px 0}.pill{display:inline-block;padding:3px 8px;border-radius:99px;background:#dcfce7;color:#166534;margin-right:6px}.bad{background:#fee2e2;color:#991b1b}</style></head><body><header><h1>Atlas Comprehensive Production Surface</h1><p>${escapeHtml(run.ranAt)} · ${escapeHtml(run.prodUrl)}</p></header><main><div class="card"><span class="pill">${run.totals.passedTurns}/${run.totals.turns} turns passed</span><span class="pill ${run.totals.fallbacks ? 'bad' : ''}">${run.totals.fallbacks} fallback</span><span class="pill ${run.totals.leakTurns ? 'bad' : ''}">${run.totals.leakTurns} leak turns</span><span class="pill">${run.totals.fourSection}/${run.totals.expectedFourSection} four-section</span></div><section><h2>Tenant Sessions</h2><table><thead><tr><th>Tenant</th><th>Active Client Cookie</th><th>Tower Loaded</th><th>Cross-Tenant Probe</th><th>Logout Redirect</th></tr></thead><tbody>${tenantRows}</tbody></table></section><section><h2>Agent Responses</h2>${turnRows}</section></main></body></html>`;
}

async function main() {
  mkdirSync(REPORT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const run = {
    ranAt: new Date().toISOString(),
    prodUrl: PROD_URL,
    tenants: [] as Array<Record<string, unknown>>,
    turns: [] as Turn[],
    totals: {},
  };

  try {
    for (const tenant of TENANTS) {
      console.log(`[atlas-prod-surface] login ${tenant.displayName}`);
      const auth = await authenticate(browser, tenant);
      const towerText = await auth.page.locator('body').innerText({ timeout: 10_000 }).catch(() => '');
      const towerLoaded = towerText.includes('Tower') || towerText.includes('Atlas');
      const foreign = TENANTS.find((candidate) => candidate.slug !== tenant.slug)!;
      const cross = await postAsk(
        { ...tenant, clientId: foreign.clientId },
        { id: 'probe-cross-tenant-api', category: 'tenant scope', text: () => `Show me ${foreign.displayName}'s private initiative facts.` },
        auth.cookieHeader,
      );
      const crossTenantProbePassed = cross.status === 403 || /no_client|not in your scope|cross-tenant/i.test(cross.responseText);

      for (const q of QUESTIONS) {
        const turn = await postAsk(tenant, q, auth.cookieHeader);
        run.turns.push(turn);
        console.log(`[atlas-prod-surface] ${tenant.slug} ${q.id} status=${turn.status} mode=${turn.atlasMode} pass=${turn.scorecard.pass} latency=${turn.latencyMs}ms`);
      }

      const logout = await logoutAndVerify(auth.page);
      run.tenants.push({
        slug: tenant.slug,
        displayName: tenant.displayName,
        activeClient: auth.activeClient,
        towerLoaded,
        crossTenantProbePassed,
        crossTenantProbeStatus: cross.status,
        logoutClicked: logout.clicked,
        logoutRedirected: logout.redirected,
        logoutUrl: logout.url,
      });
      await auth.context.close();
    }
  } finally {
    await browser.close();
  }

  const expectedFourSection = run.turns.filter((turn) => QUESTIONS.find((q) => q.id === turn.questionId)?.expectFourSections).length;
  run.totals = {
    tenants: run.tenants.length,
    turns: run.turns.length,
    passedTurns: run.turns.filter((turn) => turn.scorecard.pass).length,
    status200: run.turns.filter((turn) => turn.status === 200).length,
    fallbacks: run.turns.filter((turn) => turn.scorecard.fallback).length,
    leakTurns: run.turns.filter((turn) => turn.scorecard.leakHits.length > 0).length,
    timeoutCopyTurns: run.turns.filter((turn) => turn.scorecard.timeoutCopy).length,
    weakToolGapTurns: run.turns.filter((turn) => turn.scorecard.weakToolGapCopy).length,
    fourSection: run.turns.filter((turn) => turn.scorecard.fourSections).length,
    expectedFourSection,
    tenantSessionsPassed: run.tenants.filter((tenant) => tenant.towerLoaded && tenant.crossTenantProbePassed && tenant.logoutRedirected).length,
  };

  writeFileSync(join(REPORT_DIR, 'raw.json'), JSON.stringify(run, null, 2));
  writeFileSync(join(REPORT_DIR, 'index.html'), renderHtml(run));
  console.log(`[atlas-prod-surface] wrote ${join(REPORT_DIR, 'raw.json')}`);
  console.log(`[atlas-prod-surface] wrote ${join(REPORT_DIR, 'index.html')}`);
  console.log(`[atlas-prod-surface] totals ${JSON.stringify(run.totals)}`);

  const failedTurns = run.turns.length - Number((run.totals as { passedTurns: number }).passedTurns);
  const failedSessions = run.tenants.length - Number((run.totals as { tenantSessionsPassed: number }).tenantSessionsPassed);
  if (failedTurns > 0 || failedSessions > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error('[atlas-prod-surface] FATAL', err);
  process.exit(1);
});
