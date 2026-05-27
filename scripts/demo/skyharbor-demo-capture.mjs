#!/usr/bin/env node
/**
 * SkyHarbor demo capture — Playwright dry-run.
 *
 * Captures the demo-spine routes for the SkyHarbor synthetic airline tenant:
 * Home, context-layer method, Intelligence, Moves, Source, Tower, and the
 * local proof-of-method artifacts. Produces an HTML report with screenshots,
 * console/network issues, and optional direct Sentinel API samples.
 *
 * Run:
 *   node scripts/demo/skyharbor-demo-capture.mjs
 *
 * Optional:
 *   BASE_URL=https://app.abarva.ai node scripts/demo/skyharbor-demo-capture.mjs
 *   HEADLESS=false node scripts/demo/skyharbor-demo-capture.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { createClerkClient } from '@clerk/backend';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
dotenv.config({ path: path.join(REPO_ROOT, '.env.local') });

const BASE_URL = process.env.BASE_URL || 'https://app.abarva.ai';
const BASE_HOST = new URL(BASE_URL).hostname;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const PERSONA_EMAIL = process.env.SKYHARBOR_PERSONA_EMAIL || 'cto@skyharbor-air.example.com';
const ACTIVE_CLIENT = 'skyharbor';
const HEADLESS = process.env.HEADLESS !== 'false';
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
const OUT_DIR = path.join(REPO_ROOT, 'audit-artifacts', `skyharbor-demo-capture-${RUN_STAMP}`);
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const steps = [];

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
    value: ACTIVE_CLIENT,
    domain: BASE_HOST,
    path: '/',
    sameSite: 'Lax',
    secure: BASE_URL.startsWith('https://'),
  }]);
}

async function captureStep(page, slug, title, opts = {}) {
  const start = Date.now();
  const png = path.join(SHOTS_DIR, `${slug}.png`);
  const consoleErrors = [];
  const networkErrors = [];
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onResponse = (response) => {
    const status = response.status();
    if (status >= 400) networkErrors.push({ url: response.url(), status });
  };
  page.on('console', onConsole);
  page.on('response', onResponse);

  let bodyText = '';
  let askResult = null;
  try {
    if (opts.url) {
      await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    if (opts.wait) await page.waitForTimeout(opts.wait);
    if (opts.askQuery) {
      const before = Date.now();
      const response = await page.evaluate(async ({ query }) => {
        const r = await fetch('/api/intelligence/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            client: 'skyharbor',
            surfaceContext: {
              activeClient: 'SkyHarbor Air',
              clientKey: 'skyharbor',
              tenantFacts: ['Active tenant is SkyHarbor Air. Do not use facts from any other tenant.'],
            },
          }),
        });
        return { status: r.status, text: await r.text() };
      }, { query: opts.askQuery });
      const answer = response.text
        .split('\n')
        .map((line) => {
          try {
            const parsed = JSON.parse(line);
            return parsed.type === 'delta' ? parsed.text || '' : '';
          } catch {
            return '';
          }
        })
        .join('')
        .trim();
      askResult = {
        status: response.status,
        chars: answer.length,
        latencyMs: Date.now() - before,
        sample: answer.slice(0, 700),
      };
    }
    await page.waitForTimeout(1000);
    bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    await page.screenshot({ path: png, fullPage: true }).catch(() => {});
  } finally {
    page.off('console', onConsole);
    page.off('response', onResponse);
  }

  const step = {
    slug,
    title,
    url: page.url(),
    elapsedMs: Date.now() - start,
    screenshotRel: path.relative(OUT_DIR, png),
    bodySample: bodyText.slice(0, 1000),
    consoleErrors: consoleErrors.slice(0, 10),
    networkErrors: networkErrors.slice(0, 20),
    askResult,
  };
  steps.push(step);
  console.log(`✓ ${slug.padEnd(34)} ${step.elapsedMs}ms · console=${consoleErrors.length} network=${networkErrors.length}`);
}

function renderHtml() {
  const p0s = steps.filter((step) => step.consoleErrors.length > 0 || step.networkErrors.some((e) => e.status >= 500));
  return `<!doctype html><html><head><meta charset="utf-8"/><title>SkyHarbor demo capture · ${RUN_STAMP}</title>
<style>
body{margin:0;background:#F8F7F4;color:#111827;font:14px/1.5 -apple-system,BlinkMacSystemFont,"DM Sans",sans-serif}
main{max-width:1180px;margin:0 auto;padding:38px 44px 90px}
h1,h2,h3{font-family:Georgia,serif;font-weight:400}h1{font-size:36px;margin:0}h2{font-size:23px;border-top:1px solid #d7d2c6;padding-top:22px;margin-top:30px}
.banner{background:#fff;border:1px solid #d7d2c6;border-left:6px solid ${p0s.length ? '#b91c1c' : '#047857'};border-radius:8px;padding:16px 18px;margin:18px 0 26px}
.step{display:grid;grid-template-columns:360px 1fr;gap:18px;background:#fff;border:1px solid #d7d2c6;border-radius:8px;padding:16px;margin:12px 0}
.step img{max-width:360px;border:1px solid #d7d2c6;border-radius:6px}.meta{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#6b7280}.body{white-space:pre-wrap;background:#fbfaf7;border-left:3px solid #0f4c81;padding:10px 12px;max-height:180px;overflow:auto;border-radius:4px;font-size:12px}.err{color:#b91c1c;font-weight:700}.ok{color:#047857;font-weight:700}
</style></head><body><main>
<h1>SkyHarbor Demo Capture</h1>
<div class="banner"><b>${p0s.length ? 'Review required' : 'Clean capture'}</b><br/>Base: <code>${BASE_URL}</code> · Persona: <code>${PERSONA_EMAIL}</code> · Steps: ${steps.length} · Console/network issue steps: ${p0s.length}</div>
<p>This report captures the demo spine for the synthetic SkyHarbor airline tenant and the proof-of-method artifacts behind the context layer.</p>
${steps.map((step, index) => `<section class="step">
<a href="${step.screenshotRel}"><img src="${step.screenshotRel}" alt="${step.slug}"/></a>
<div><h3>${index + 1}. ${step.title}</h3><div class="meta"><code>${step.url}</code><br/>${step.elapsedMs}ms · console ${step.consoleErrors.length} · network ${step.networkErrors.length}</div>
${step.askResult ? `<p><b>Sentinel API:</b> status ${step.askResult.status}, ${step.askResult.chars} chars, ${step.askResult.latencyMs}ms<br/><em>${escapeHtml(step.askResult.sample)}</em></p>` : ''}
${step.consoleErrors.length ? `<p class="err">Console: ${escapeHtml(step.consoleErrors.join(' | '))}</p>` : '<p class="ok">No console errors captured.</p>'}
${step.networkErrors.length ? `<p class="err">Network: ${escapeHtml(JSON.stringify(step.networkErrors.slice(0, 5)))}</p>` : ''}
<div class="body">${escapeHtml(step.bodySample)}</div></div></section>`).join('')}
</main></body></html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function main() {
  console.log(`SkyHarbor demo capture · ${BASE_URL} · ${PERSONA_EMAIL}`);
  console.log(`Output: ${OUT_DIR}`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await signIn(page);
    await captureStep(page, '01-home', 'Home / Tenant briefing', { url: new URL('/home', BASE_URL).toString(), wait: 2000 });
    await captureStep(page, '02-context-layer', 'Admin / Context layer', { url: new URL('/admin/context-layer', BASE_URL).toString(), wait: 2500 });
    await captureStep(page, '03-intelligence-ask', 'Intelligence / Ask', { url: new URL('/intelligence/ask', BASE_URL).toString(), wait: 2000 });
    await captureStep(page, '04-sentinel-progress', 'Sentinel question — defensible progress narrative', {
      askQuery: "After five years of modernization, what's our defensible progress narrative?",
      wait: 2000,
    });
    await captureStep(page, '05-sentinel-workloads', 'Sentinel question — next workloads', {
      askQuery: 'Which five workloads should we extract next, and which should explicitly not touch in the next 18 months?',
      wait: 2000,
    });
    await captureStep(page, '06-moves-new', 'Moves / New', { url: new URL('/programs/new', BASE_URL).toString(), wait: 2500 });
    await captureStep(page, '07-source', 'Source', { url: new URL('/source', BASE_URL).toString(), wait: 2500 });
    await captureStep(page, '08-source-value', 'Source / Value', { url: new URL('/source/value', BASE_URL).toString(), wait: 2500 });
    await captureStep(page, '09-tower', 'Tower', { url: new URL('/tower', BASE_URL).toString(), wait: 2500 });
    await captureStep(page, '10-tower-portfolio', 'Tower / Portfolio', { url: new URL('/tower/portfolio', BASE_URL).toString(), wait: 2500 });
  } finally {
    await browser.close();
  }

  const payload = { baseUrl: BASE_URL, persona: PERSONA_EMAIL, runStamp: RUN_STAMP, steps };
  fs.writeFileSync(path.join(OUT_DIR, 'skyharbor-demo-capture.json'), JSON.stringify(payload, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'SKYHARBOR_DEMO_CAPTURE_REPORT.html'), renderHtml());
  console.log(`Open: ${path.join(OUT_DIR, 'SKYHARBOR_DEMO_CAPTURE_REPORT.html')}`);

  const hardFailures = steps.filter((step) => step.consoleErrors.length > 0 || step.networkErrors.some((e) => e.status >= 500));
  if (hardFailures.length) {
    console.error(`Demo capture found ${hardFailures.length} hard-failure step(s).`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
