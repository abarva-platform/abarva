#!/usr/bin/env node
/**
 * Northstar demo capture — Playwright dry-run.
 *
 * Walks through the exact demo flow (Packet 22 § Part 9) as Priya Mehta
 * (Northstar CIO), capturing a screenshot at every step. Produces an HTML
 * report at audit-artifacts/northstar-demo-dryrun-<timestamp>/ showing
 * what the CXO will actually see.
 *
 * Run:
 *   node scripts/demo/northstar-demo-capture.mjs
 *
 * After the dry-run completes, open the HTML report and verify:
 *   - No 5xx errors anywhere
 *   - Sign-in lands on /home with Northstar branding visible
 *   - Sentinel Q1/Q2/Q3 produce substantive answers (not canned errors)
 *   - /admin/context-layer shows real numbers (≥ 720 chunks)
 *   - Source / Tower pages render with Northstar data
 *
 * Mirrors the production stress-test runner's sign-in approach so it works
 * with the existing Clerk demo flow.
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { createClerkClient } from '@clerk/backend';

const REPO_ROOT = '/Users/anand/Projects/nexus';
dotenv.config({ path: path.join(REPO_ROOT, '.env.local') });

const BASE_URL = process.env.BASE_URL || 'https://app.abarva.ai';
const BASE_HOST = new URL(BASE_URL).hostname;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const PERSONA_EMAIL = 'cio@northstar-clinical.example.com';
const ACTIVE_CLIENT = 'northstar';
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
const OUT_DIR = path.join(REPO_ROOT, 'audit-artifacts', `northstar-demo-dryrun-${RUN_STAMP}`);
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const steps = [];

async function captureStep(page, slug, title, opts = {}) {
  const start = Date.now();
  const ts = new Date().toISOString();
  const png = path.join(SHOTS_DIR, `${slug}.png`);
  let bodyText = '';
  let title404 = false;
  let consoleErrors = 0;

  const errs = [];
  const onConsole = (m) => { if (m.type() === 'error') { errs.push(m.text()); consoleErrors++; } };
  page.on('console', onConsole);

  try {
    if (opts.url) {
      const resp = await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const status = resp?.status() ?? 0;
      if (status >= 400) title404 = true;
    }
    if (opts.wait) await page.waitForTimeout(opts.wait);
    if (opts.click) await page.locator(opts.click).first().click({ timeout: 10000 }).catch(() => {});
    if (opts.fill) {
      for (const [sel, val] of Object.entries(opts.fill)) {
        await page.locator(sel).first().fill(val, { timeout: 10000 }).catch(() => {});
      }
    }
    if (opts.askQuery) {
      // Submit a Sentinel question and wait for streaming to settle
      const before = Date.now();
      const resp = await page.evaluate(async ({ query }) => {
        const r = await fetch('/api/intelligence/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            client: 'northstar',
            surfaceContext: { activeClient: 'Northstar Clinical Technologies', clientKey: 'northstar', tenantFacts: ['Active tenant is Northstar Clinical Technologies. Do not use facts from any other tenant.'] },
          }),
        });
        return { status: r.status, text: await r.text() };
      }, { query: opts.askQuery });
      const events = resp.text.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return { type: 'parse_error' }; } });
      const answer = events.map((e) => e.type === 'delta' ? (e.text || '') : '').join('').trim();
      opts.askResult = {
        status: resp.status,
        chars: answer.length,
        latencyMs: Date.now() - before,
        sample: answer.slice(0, 600),
        eventCount: events.length,
      };
    }

    await page.waitForTimeout(1000);
    bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    await page.screenshot({ path: png, fullPage: true }).catch(() => {});
  } catch (err) {
    title404 = true;
  } finally {
    page.off('console', onConsole);
  }

  const elapsed = Date.now() - start;
  steps.push({
    slug,
    title,
    timestamp: ts,
    elapsedMs: elapsed,
    url: page.url(),
    screenshotRel: path.relative(OUT_DIR, png),
    bodySample: bodyText.slice(0, 800),
    consoleErrors,
    consoleErrorSamples: errs.slice(0, 3),
    title404,
    askResult: opts.askResult,
  });
  process.stdout.write(`✓ ${slug.padEnd(40)} ${elapsed}ms\n`);
}

async function signIn(page) {
  if (!CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY missing');
  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
  const users = await clerk.users.getUserList({ emailAddress: [PERSONA_EMAIL], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user for ${PERSONA_EMAIL}`);
  const token = await clerk.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 300 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30000 });
  await page.evaluate(async (ticket) => {
    const r = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket });
    if (r.status !== 'complete' || !r.createdSessionId) throw new Error(`Ticket sign-in: ${r.status}`);
    await window.Clerk.setActive({ session: r.createdSessionId });
  }, token.token);
  await page.context().addCookies([{
    name: 'abarva_active_client', value: ACTIVE_CLIENT, domain: BASE_HOST,
    path: '/', sameSite: 'Lax', secure: BASE_URL.startsWith('https://'),
  }]);
}

function renderHtml() {
  const overallOk = steps.every((s) => !s.title404 && s.consoleErrors < 5);
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Northstar demo dry-run · ${RUN_STAMP}</title>
<style>
:root{--bg:#F8F7F4;--ink:#111318;--muted:#6b6f78;--line:#d7d2c6;--paper:#fff;--accent:#0b4a91;--red:#b1322a;--green:#1d6f4b}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 DM Sans,-apple-system,sans-serif}
h1,h2,h3{font-family:Georgia,serif;font-weight:400}h1{font-size:34px;margin:0 0 6px}h2{font-size:22px;margin:30px 0 10px;border-top:1px solid var(--line);padding-top:24px}
main{max-width:1180px;margin:0 auto;padding:40px 48px 120px}
.banner{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:18px 22px;margin:18px 0 30px;font-size:15px}
.banner.ok{border-left:6px solid var(--green)}.banner.fail{border-left:6px solid var(--red)}
.step{background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:18px;margin:12px 0;display:grid;grid-template-columns:340px 1fr;gap:18px}
.step img{max-width:340px;border:1px solid var(--line);border-radius:6px}
.step h3{margin:0 0 6px;font-size:18px}
.step .meta{color:var(--muted);font-size:12px;font-family:ui-monospace,Menlo,monospace}
.step .body{white-space:pre-wrap;background:#fbfaf7;border-left:3px solid var(--accent);padding:10px 12px;border-radius:4px;font-size:12px;margin-top:8px;max-height:180px;overflow:auto}
.ask{margin-top:10px;font-size:13px}.ask b{color:var(--accent)}
.err{color:var(--red);font-weight:600}.ok{color:var(--green);font-weight:600}
</style></head><body><main>
<div class="banner ${overallOk?'ok':'fail'}"><b>Northstar demo dry-run · ${RUN_STAMP}</b><br/>
Base: <code>${BASE_URL}</code> · Persona: <code>${PERSONA_EMAIL}</code> · Steps: ${steps.length} · ${overallOk?'<span class="ok">all green</span>':'<span class="err">issues detected — review</span>'}</div>
<h1>Demo capture report</h1>
<p>Walks the Packet 22 § Part 9 demo flow as the Northstar CIO (Priya Mehta). Each step captures a screenshot and verifies the page rendered cleanly. Use this as the pre-demo confidence check.</p>
${steps.map((s, i) => `
<div class="step">
  <a href="${s.screenshotRel}"><img src="${s.screenshotRel}" alt="${s.slug}"/></a>
  <div>
    <h3>${i + 1}. ${s.title}</h3>
    <div class="meta">URL <code>${s.url}</code><br/>${s.elapsedMs}ms · console errors: ${s.consoleErrors}${s.title404 ? ' · <span class="err">404/5xx</span>' : ''}</div>
    ${s.askResult ? `<div class="ask"><b>Sentinel Q:</b> ${s.askResult.eventCount} events · ${s.askResult.chars} chars · ${s.askResult.latencyMs}ms · status ${s.askResult.status}<br/><i>${(s.askResult.sample || '').replace(/</g, '&lt;').slice(0, 400)}…</i></div>` : ''}
    <div class="body">${(s.bodySample || '').replace(/</g, '&lt;').slice(0, 600)}</div>
  </div>
</div>`).join('')}
</main></body></html>`;
}

async function main() {
  console.log(`Northstar demo dry-run · ${BASE_URL} · ${PERSONA_EMAIL}`);
  console.log(`Output: ${OUT_DIR}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await signIn(page);
    console.log('✓ signed in');

    // Scene 1 — sign in landing
    await captureStep(page, '01-home-landing', 'Home — signed in as Northstar CIO', { url: new URL('/home', BASE_URL).toString(), wait: 2000 });

    // Scene 2 — intelligence/ask + three questions
    await captureStep(page, '02-intelligence-ask-landing', 'Intelligence · Ask landing', { url: new URL('/intelligence/ask', BASE_URL).toString(), wait: 2000 });
    await captureStep(page, '03-sentinel-q1-cio-priorities', 'Sentinel Q1 — CIO priorities given tariff exposure', {
      askQuery: 'As CIO, what AI investments should I prioritize for the next two quarters given our tariff exposure and the prior-parent separation?',
      wait: 3000,
    });
    await captureStep(page, '04-sentinel-q2-kill-list', 'Sentinel Q2 — kill list to fund tariff response', {
      askQuery: 'Which of our active initiatives would you kill or pause to fund the tariff response?',
      wait: 3000,
    });
    await captureStep(page, '05-sentinel-q3-displacement', 'Sentinel Q3 — McKinsey displacement frame', {
      askQuery: 'If we hired McKinsey for an AI strategy engagement instead of this pilot, what would they produce that you do not?',
      wait: 3000,
    });

    // Scene 3 — admin / context layer
    await captureStep(page, '06-context-layer-landing', 'Admin · Context Layer — stages from live Supabase', { url: new URL('/admin/context-layer', BASE_URL).toString(), wait: 3000 });
    await captureStep(page, '07-context-layer-uploads', 'Admin · Context Layer · Uploads — real source files', { url: new URL('/admin/context-layer/uploads', BASE_URL).toString(), wait: 3000 });
    await captureStep(page, '08-context-layer-syncs', 'Admin · Context Layer · Syncs — embedding history (ai_egress_audit)', { url: new URL('/admin/context-layer/syncs', BASE_URL).toString(), wait: 3000 });
    await captureStep(page, '09-context-layer-evidence-map', 'Admin · Context Layer · Evidence map', { url: new URL('/admin/context-layer/evidence-map?source_doc=NST-SRC-001', BASE_URL).toString(), wait: 3000 });

    // Scene 4 — Source
    await captureStep(page, '10-source-landing', 'Source — RFP/vendor/contract workflow', { url: new URL('/source', BASE_URL).toString(), wait: 3000 });
    await captureStep(page, '11-source-portfolio', 'Source · Portfolio — 240 Northstar applications', { url: new URL('/source/portfolio', BASE_URL).toString(), wait: 3000 });

    // Scene 5 — Tower
    await captureStep(page, '12-tower-landing', 'Tower — portfolio value + dependency arrows', { url: new URL('/tower', BASE_URL).toString(), wait: 3000 });
    await captureStep(page, '13-tower-portfolio', 'Tower · Portfolio Value', { url: new URL('/tower/portfolio', BASE_URL).toString(), wait: 3000 });
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(OUT_DIR, 'demo-dryrun-results.json'), JSON.stringify({ baseUrl: BASE_URL, persona: PERSONA_EMAIL, runStamp: RUN_STAMP, steps }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'DEMO_DRYRUN.html'), renderHtml());
  console.log(`\n✓ Wrote ${steps.length} steps`);
  console.log(`Open: ${path.join(OUT_DIR, 'DEMO_DRYRUN.html')}`);

  const anyAskFailed = steps.some((s) => s.askResult && (s.askResult.chars < 300 || s.askResult.status !== 200));
  const anyConsoleErrors = steps.some((s) => s.consoleErrors >= 5);
  const any404 = steps.some((s) => s.title404);
  if (anyAskFailed || anyConsoleErrors || any404) {
    console.log('\n⚠️  Issues detected — review the HTML report before demo.');
    process.exit(1);
  }
  console.log('\n✓ All checks green. Demo flow is ready.');
}

main().catch((err) => { console.error(err); process.exit(1); });
