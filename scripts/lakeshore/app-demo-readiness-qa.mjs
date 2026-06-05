import { createClerkClient } from '@clerk/backend';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execSync } from 'node:child_process';

const baseUrl = process.env.LAKESHORE_DEMO_QA_BASE_URL ?? 'https://app.abarva.ai';
const email = process.env.LAKESHORE_DEMO_QA_EMAIL ?? 'cfo@lakeshore-holdings.example.com';
const activeClient = process.env.LAKESHORE_DEMO_QA_CLIENT ?? 'lakeshore';
const outputRoot = process.env.LAKESHORE_DEMO_QA_OUT ?? 'audit-artifacts/lakeshore-app-demo-readiness';
const runId = `lakeshore-app-demo-readiness-${new Date().toISOString().replace(/[:.]/g, '-')}-${gitSha()}`;
const outputDir = path.join(outputRoot, runId);
const screenshotDir = path.join(outputDir, 'screenshots');

const kyribaMoveId = '1196dac0-715c-45ce-8eeb-5e70792d9aa4';
const dataSpineMoveId = '6a4c7fc4-0a2d-4479-b807-7350fb727527';
const kyribaEvent = 'LSH-KYRIBA-TREASURY-2026';
const amsEvent = 'LSH-AMS-MODERNIZATION-2026';

const checks = [
  {
    id: 'admin-data-trust',
    area: 'Admin',
    route: '/admin/data-trust',
    required: ['Lakeshore Holdings', '1,329', 'Data Trust'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'admin-setup',
    area: 'Admin',
    route: '/admin/setup',
    required: ['Lakeshore Holdings', 'Data Loads', 'Data Trust', '1,329'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'cxo-intel-index',
    area: 'Setup',
    route: '/admin/setup/cxo-intel',
    required: ['CXO Intel Loader', 'CIO bundle', 'CFO bundle', 'WAVE 1 ACTIVE'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'cxo-intel-cio',
    area: 'Setup',
    route: '/admin/setup/cxo-intel/cio',
    required: ['CIO bundle', 'Lakeshore Holdings', 'app_inventory.csv', 'vendor_contracts.csv'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'cxo-intel-cfo',
    area: 'Setup',
    route: '/admin/setup/cxo-intel/cfo',
    required: ['CFO bundle', 'Lakeshore Holdings', 'banking_relationships.csv', 'close_cycle_metrics.csv'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-portfolio',
    area: 'Source',
    route: '/source/events',
    required: ['Lakeshore Holdings', '2 sourcing events', kyribaEvent, amsEvent],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-compare-isolation',
    area: 'Source',
    route: '/source/compare',
    required: [kyribaEvent, amsEvent, 'Choose two source events'],
    forbidden: ['Apex Retail', 'Meridian Health', '19 events available'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-strategy',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=strategy`,
    required: ['Sourcing Strategy Memo', 'Value Target Brief', 'Archetype Decision Record'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-scope',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=scope`,
    required: ['Scope baseline', 'Sponsor commitment letter', 'APPLICATION'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-rfp',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=rfp`,
    required: ['RFP release package', 'CRITERION', 'Legal review of RFP terms'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-responses',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=responses`,
    required: ['COMPLETENESS MATRIX', 'Questions go to everyone'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-evaluation',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=evaluation`,
    required: ['WEIGHTED SCORECARD', 'Technical depth', 'Commercial fit'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-pricing',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=pricing`,
    required: ['STAGE 6', 'Normalize current pricing', 'P0 traps'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-bafo',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=bafo`,
    required: ['STAGE 7', 'Prepare the BAFO question pack', 'BAFO concessions accepted in writing'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-executive-decision',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=executive_decision`,
    required: ['Route decision brief', 'Atlas decision brief signed off', 'Steward sign-off recorded'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-selection',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=selection`,
    required: ['Selection Memo', 'Contract Record', 'Lakeshore should proceed with a treasury platform rollout anchored on Kyriba'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-transition',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=transition`,
    required: ['Transition Plan', 'Knowledge-Transfer Evidence', 'The transition plan is built around a controlled parallel run'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-kyriba-value',
    area: 'Source',
    route: `/source/events/${kyribaEvent}?stage=value`,
    required: ['Value Ledger', 'Governance Review Note', 'The Kyriba rollout value ledger is intentionally conservative'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'source-ams-evaluation-only',
    area: 'Source',
    route: `/source/events/${amsEvent}?stage=evaluation`,
    required: ['Lakeshore Holdings', 'Evaluation'],
    forbidden: ['Apex Retail', 'Meridian Health', 'BAFO concessions accepted in writing'],
    severity: 'watch',
  },
  {
    id: 'moves-list',
    area: 'Moves',
    route: '/strategic-moves',
    required: ['Lakeshore Holdings', '6', '$144M', 'Kyriba'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'moves-kyriba-detail',
    area: 'Moves',
    route: `/strategic-moves/${kyribaMoveId}`,
    required: ['DIVERSIFIED-KYRIBA-2026', 'Kyriba global treasury rollout'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'moves-kyriba-documents',
    area: 'Moves',
    route: `/strategic-moves/${kyribaMoveId}?tab=documents`,
    required: [
      'kyriba-rollout-gate-01-bank-connectivity-matrix.md',
      'kyriba-rollout-gate-02-erp-feed-quality-scorecard.md',
      'kyriba-rollout-gate-06-intercompany-reconciliation-control.md',
    ],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'moves-data-spine-detail',
    area: 'Moves',
    route: `/strategic-moves/${dataSpineMoveId}`,
    required: ['DIVERSIFIED-SHARED-2026', 'Shared data platform and evidence spine'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'tower-source-value',
    area: 'Tower',
    route: '/tower/source-portfolio-value',
    required: ['LAKESHORE HOLDINGS', 'Source Portfolio Value', 'CFO defensibility rule'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'intelligence-brief',
    area: 'Intelligence',
    route: '/intelligence',
    required: ["Lakeshore's Intelligence brief", 'Treasury/Kyriba', 'no Apex/Meridian fixture content'],
    forbidden: ['Apex Retail'],
    severity: 'blocker',
  },
  {
    id: 'intelligence-ask',
    area: 'Intelligence',
    route: '/intelligence/ask',
    required: ['Ask the corpus', 'TENANT', 'CROSS-CORPUS'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'watch',
  },
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

function deploymentIdFromText(text) {
  const match = text.match(/[?&]dpl=(dpl_[A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}

function summarizeText(text) {
  return [...new Set(text.split('\n').map((line) => line.trim()).filter(Boolean))].slice(0, 36);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
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

async function captureScreenshot(page, check, index) {
  const filename = `${String(index + 1).padStart(2, '0')}-${slugify(check.area)}-${slugify(check.id)}.png`;
  const absolutePath = path.join(screenshotDir, filename);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return {
    file: filename,
    path: `screenshots/${filename}`,
  };
}

async function runCheck(page, check, index) {
  const startedAt = Date.now();
  const response = await page.goto(`${baseUrl}${check.route}`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  const text = await page.locator('body').innerText({ timeout: 20_000 });
  const screenshot = await captureScreenshot(page, check, index);
  const missing = check.required.filter((marker) => !text.includes(marker));
  const forbiddenPresent = check.forbidden.filter((marker) => text.includes(marker));
  const status = response?.status() ?? null;
  const passed = status === 200 && missing.length === 0 && forbiddenPresent.length === 0;

  return {
    ...check,
    url: page.url(),
    httpStatus: status,
    passed,
    result: passed ? 'pass' : check.severity === 'blocker' ? 'fail' : 'watch',
    missing,
    forbiddenPresent,
    screenshot,
    durationMs: Date.now() - startedAt,
    deploymentId: deploymentIdFromText(await page.content()),
    textSample: summarizeText(text),
  };
}

function summarize(results) {
  const byResult = results.reduce((acc, result) => {
    acc[result.result] = (acc[result.result] ?? 0) + 1;
    return acc;
  }, {});
  const byArea = results.reduce((acc, result) => {
    const current = acc[result.area] ?? { total: 0, pass: 0, fail: 0, watch: 0 };
    current.total += 1;
    current[result.result] += 1;
    acc[result.area] = current;
    return acc;
  }, {});
  const blockers = results.filter((result) => result.result === 'fail');
  const watches = results.filter((result) => result.result === 'watch');
  return {
    status: blockers.length === 0 ? 'ready_with_warnings' : 'blocked',
    checkedAt: new Date().toISOString(),
    baseUrl,
    email,
    activeClient,
    gitSha: gitSha(),
    outputDir,
    total: results.length,
    passed: byResult.pass ?? 0,
    watch: byResult.watch ?? 0,
    failed: byResult.fail ?? 0,
    byArea,
    blockers: blockers.map(issueSummary),
    watches: watches.map(issueSummary),
  };
}

function issueSummary(result) {
  return {
    id: result.id,
    area: result.area,
    route: result.route,
    httpStatus: result.httpStatus,
    missing: result.missing,
    forbiddenPresent: result.forbiddenPresent,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderReport(summary, results) {
  const rows = results
    .map((result) => {
      const badge = result.result.toUpperCase();
      return `<tr class="${escapeHtml(result.result)}">
        <td>${escapeHtml(badge)}</td>
        <td>${escapeHtml(result.area)}</td>
        <td>${escapeHtml(result.id)}</td>
        <td><code>${escapeHtml(result.route)}</code></td>
        <td>${escapeHtml(result.httpStatus ?? 'n/a')}</td>
        <td>${result.screenshot ? `<a href="${escapeHtml(result.screenshot.path)}">${escapeHtml(result.screenshot.file)}</a>` : '-'}</td>
        <td>${escapeHtml(result.missing.join('; ') || '-')}</td>
        <td>${escapeHtml(result.forbiddenPresent.join('; ') || '-')}</td>
      </tr>`;
    })
    .join('\n');

  const samples = results
    .map(
      (result) => `<details>
        <summary>${escapeHtml(result.result.toUpperCase())} · ${escapeHtml(result.id)} · ${escapeHtml(result.route)}</summary>
        <ol>${result.textSample.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ol>
      </details>`,
    )
    .join('\n');

  const screenshots = results
    .filter((result) => result.screenshot)
    .map(
      (result) => `<figure>
        <a href="${escapeHtml(result.screenshot.path)}"><img src="${escapeHtml(result.screenshot.path)}" alt="${escapeHtml(result.id)} screenshot" loading="lazy" /></a>
        <figcaption>${escapeHtml(result.area)} · ${escapeHtml(result.id)} · <code>${escapeHtml(result.route)}</code></figcaption>
      </figure>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lakeshore App Demo Readiness QA</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #18221f; background: #f7f4ed; }
    h1 { margin-bottom: 4px; }
    .meta, .note { color: #52615b; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 12px; margin: 24px 0; }
    .card { background: #fff; border: 1px solid #d8ded8; border-radius: 8px; padding: 14px; }
    .metric { font-size: 28px; font-weight: 750; }
    table { border-collapse: collapse; width: 100%; background: #fff; border: 1px solid #d8ded8; }
    th, td { text-align: left; border-bottom: 1px solid #e6e9e4; padding: 9px 10px; vertical-align: top; font-size: 13px; }
    th { background: #eef3ee; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    tr.fail td:first-child { color: #a32727; font-weight: 800; }
    tr.watch td:first-child { color: #926300; font-weight: 800; }
    tr.pass td:first-child { color: #146c43; font-weight: 800; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
    details { margin: 10px 0; background: #fff; border: 1px solid #d8ded8; border-radius: 8px; padding: 10px 12px; }
    .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin: 20px 0; }
    figure { margin: 0; background: #fff; border: 1px solid #d8ded8; border-radius: 8px; padding: 10px; }
    img { width: 100%; max-height: 360px; object-fit: contain; background: #f3f3f0; border: 1px solid #e3e6e1; }
    figcaption { margin-top: 8px; color: #52615b; font-size: 12px; }
    li { margin: 3px 0; }
  </style>
</head>
<body>
  <h1>Lakeshore App Demo Readiness QA</h1>
  <div class="meta">Checked ${escapeHtml(summary.checkedAt)} · ${escapeHtml(summary.baseUrl)} · ${escapeHtml(summary.email)} · client cookie ${escapeHtml(summary.activeClient)} · git ${escapeHtml(summary.gitSha)}</div>
  <p class="note">Corpus expansion is out of scope for this run. This packet verifies live app/module readiness, loaded Source and Moves artifacts, tenant pinning, and route behavior.</p>
  <div class="summary">
    <div class="card"><div>Status</div><div class="metric">${escapeHtml(summary.status)}</div></div>
    <div class="card"><div>Pass</div><div class="metric">${summary.passed}</div></div>
    <div class="card"><div>Watch</div><div class="metric">${summary.watch}</div></div>
    <div class="card"><div>Fail</div><div class="metric">${summary.failed}</div></div>
  </div>
  <h2>Checks</h2>
  <table>
    <thead><tr><th>Result</th><th>Area</th><th>ID</th><th>Route</th><th>HTTP</th><th>Screenshot</th><th>Missing</th><th>Forbidden Present</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Demo Walkthrough Screenshots</h2>
  <div class="screenshots">${screenshots}</div>
  <h2>Text Evidence Samples</h2>
  ${samples}
</body>
</html>`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(context, page);

    for (const [index, check] of checks.entries()) {
      try {
        results.push(await runCheck(page, check, index));
      } catch (error) {
        results.push({
          ...check,
          url: `${baseUrl}${check.route}`,
          httpStatus: null,
          passed: false,
          result: check.severity === 'blocker' ? 'fail' : 'watch',
          missing: check.required,
          forbiddenPresent: [],
          screenshot: null,
          error: error instanceof Error ? error.message : String(error),
          durationMs: 0,
          deploymentId: null,
          textSample: [],
        });
      }
    }
  } finally {
    await browser.close();
  }

  const summary = summarize(results);
  await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'checks.json'), `${JSON.stringify(results, null, 2)}\n`);
  await writeFile(
    path.join(outputDir, 'screenshots.json'),
    `${JSON.stringify(results.filter((result) => result.screenshot).map((result) => ({
      id: result.id,
      area: result.area,
      route: result.route,
      url: result.url,
      result: result.result,
      screenshot: result.screenshot,
    })), null, 2)}\n`,
  );
  await writeFile(path.join(outputDir, 'report.html'), renderReport(summary, results));
  await writeFile(
    path.join(outputDir, 'README.md'),
    [
      '# Lakeshore App Demo Readiness QA',
      '',
      `- Status: ${summary.status}`,
      `- Base URL: ${baseUrl}`,
      `- Persona: ${email}`,
      `- Active client cookie: ${activeClient}`,
      `- Checks: ${summary.total}`,
      `- Pass / watch / fail: ${summary.passed} / ${summary.watch} / ${summary.failed}`,
      `- HTML report: report.html`,
      `- Screenshots: screenshots/`,
      `- Screenshot manifest: screenshots.json`,
      '',
    ].join('\n'),
  );

  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
