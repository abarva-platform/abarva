import { createClerkClient } from '@clerk/backend';
import pg from 'pg';
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const { Client } = pg;

const baseUrl = process.env.LAKESHORE_TOWER_QA_BASE_URL
  ?? process.env.LAKESHORE_DEMO_QA_BASE_URL
  ?? 'https://app.abarva.ai';
const email = process.env.LAKESHORE_TOWER_QA_EMAIL
  ?? process.env.LAKESHORE_DEMO_QA_EMAIL
  ?? 'cfo@lakeshore-holdings.example.com';
const activeClient = process.env.LAKESHORE_TOWER_QA_CLIENT
  ?? process.env.LAKESHORE_DEMO_QA_CLIENT
  ?? 'lakeshore';
const tenantKey = process.env.LAKESHORE_TOWER_QA_TENANT_KEY ?? 'lakeshore-holdings';
const outputRoot = process.env.LAKESHORE_TOWER_QA_OUT
  ?? 'audit-artifacts/lakeshore-tower-atlas-federated-qa';
const runId = `lakeshore-tower-atlas-federated-qa-${new Date().toISOString().replace(/[:.]/g, '-')}-${gitSha()}`;
const outputDir = path.join(outputRoot, runId);
const apiFetchTimeoutMs = Number(process.env.LAKESHORE_TOWER_QA_API_TIMEOUT_MS ?? 45_000);

const routeChecks = [
  {
    id: 'tower-home',
    route: '/tower?client=lakeshore',
    expectedStatus: 200,
    required: ['Lakeshore Holdings', 'TOWER', 'Atlas'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'tower-portfolio-value',
    route: '/tower/portfolio',
    expectedStatus: 200,
    required: ['Lakeshore Holdings', 'Portfolio Value', 'Projected', 'Tracked', 'Verified'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
  },
  {
    id: 'tower-programs-redirect',
    route: '/tower/programs',
    expectedStatus: 200,
    required: ['Lakeshore Holdings', 'TOWER'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'blocker',
    allowRedirect: true,
  },
  {
    id: 'tenant-lakeshore-tower',
    route: '/tenant/lakeshore/tower',
    expectedStatus: 200,
    required: ['Lakeshore Holdings', 'Control Tower'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'watch',
    optionalWhenStatus: [404],
  },
  {
    id: 'tenant-lakeshore-holdings-tower',
    route: '/tenant/lakeshore-holdings/tower',
    expectedStatus: 200,
    required: ['Lakeshore Holdings', 'Control Tower'],
    forbidden: ['Apex Retail', 'Meridian Health'],
    severity: 'watch',
    optionalWhenStatus: [404],
  },
];

const atlasQuestions = [
  {
    id: 'atlas-value-separation',
    message: 'For Lakeshore, what is the Tower read on the Kyriba rollout right now? Separate projected or modeled value, tracked value, and verified realized value. Also say whether the Azure private data plane is fully cut over.',
    requiredAny: [
      ['My read', 'Why', 'What I would do next'],
      ['projected', 'tracked', 'verified'],
      ['Lakeshore'],
      ['Kyriba'],
    ],
    forbidden: [
      /Apex Retail/i,
      /Meridian Health/i,
      /fully cut over/i,
      /realized savings are complete/i,
      /verified realized savings are complete/i,
    ],
    allowedIfAlsoPresent: [
      { hit: /fully cut over/i, qualifier: /not|not yet|no|partial|cannot claim|do not claim/i },
    ],
  },
  {
    id: 'atlas-federated-l0-l1-boundary',
    message: 'As the Lakeshore L0 sponsor, what can I see across Lakeshore Holdings and sibling HoldCos in Tower, and what can I not see without an explicit grant?',
    requiredAny: [
      ['My read', 'Why', 'What I would do next'],
      ['consolidated'],
      ['sibling'],
      ['raw', 'grant'],
    ],
    forbidden: [/Apex Retail/i, /Meridian Health/i, /transaction-level sibling/i],
    allowedIfAlsoPresent: [
      { hit: /transaction-level sibling/i, qualifier: /not|without|cannot|unless|grant/i },
    ],
  },
  {
    id: 'atlas-kyriba-next-decision',
    message: 'What is the one Tower decision Lakeshore should make next for the Kyriba rollout, and what evidence gap could change that recommendation?',
    requiredAny: [
      ['My read', 'Why', 'Evidence gap'],
      ['Kyriba'],
      ['Lakeshore'],
      ['evidence gap'],
    ],
    forbidden: [/Apex Retail/i, /Meridian Health/i, /approve realized savings/i],
  },
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function databaseUrl() {
  const value = process.env.DATABASE_URL ?? process.env.ABARVA_AZURE_DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL or ABARVA_AZURE_DATABASE_URL is required');
  return value;
}

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

function includesAll(text, markers) {
  const lower = text.toLowerCase();
  return markers.every((marker) => lower.includes(marker.toLowerCase()));
}

function summarizeText(text, lines = 24) {
  return [...new Set(String(text).split('\n').map((line) => line.trim()).filter(Boolean))].slice(0, lines);
}

function extractResponseText(body) {
  const rendered = body?.renderedResponse ?? {};
  return String(rendered.response_text ?? rendered.markdown ?? rendered.text ?? body?.response ?? body?.answer ?? body?.message ?? '');
}

function stripAllowedForbidden(text, forbidden, allowedIfAlsoPresent = []) {
  const hits = [];
  for (const pattern of forbidden) {
    const hit = text.match(pattern);
    if (!hit) continue;
    const allowed = allowedIfAlsoPresent.some((allow) => allow.hit.test(text) && allow.qualifier.test(text));
    if (!allowed) hits.push(hit[0]);
  }
  return hits;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function queryLiveContext() {
  const client = new Client({ connectionString: databaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const clientRows = await client.query(
      `select id, name, tenant_key, slug, industry_code
         from clients
        where tenant_key = any($1::text[])
           or slug = any($1::text[])
           or lower(name) = any($2::text[])
        order by case when tenant_key = $3 then 0 else 1 end
        limit 5`,
      [
        ['lakeshore', 'lakeshore-holdings'],
        ['lakeshore holdings'],
        tenantKey,
      ],
    );
    const row = clientRows.rows[0];
    if (!row) throw new Error('Lakeshore client row not found');

    const counts = await client.query(
      `select
          (select count(*)::int from ai_initiatives where client_id = $1) as ai_initiatives,
          (select count(*)::int
             from ai_initiative_vendors v
             join ai_initiatives i on i.initiative_id = v.initiative_id
            where i.client_id = $1) as ai_vendors,
          (select count(*)::int from engagements where client_id = $1 and deleted_at is null and archived_at is null) as engagements,
          (select count(*)::int from source_events where client_key = 'lakeshore') as source_events,
          (select coalesce(sum(value_projected_high_usd), 0)::numeric from engagements where client_id = $1 and deleted_at is null and archived_at is null) as engagement_projected_high_usd,
          (select coalesce(sum(value_verified_usd), 0)::numeric from engagements where client_id = $1 and deleted_at is null and archived_at is null) as engagement_verified_usd`,
      [row.id],
    );

    return {
      client: row,
      counts: counts.rows[0],
    };
  } finally {
    await client.end();
  }
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

async function runRouteCheck(page, check) {
  const startedAt = Date.now();
  const response = await page.goto(`${baseUrl}${check.route}`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  const status = response?.status() ?? null;
  const text = await page.locator('body').innerText({ timeout: 20_000 }).catch(() => '');
  const optionalAbsent = check.optionalWhenStatus?.includes(status);
  const missing = optionalAbsent ? [] : check.required.filter((marker) => !text.includes(marker));
  const forbiddenPresent = check.forbidden.filter((marker) => text.includes(marker));
  const passed = optionalAbsent || (status === check.expectedStatus && missing.length === 0 && forbiddenPresent.length === 0);
  const result = passed ? (optionalAbsent ? 'watch' : 'pass') : check.severity === 'blocker' ? 'fail' : 'watch';

  return {
    ...check,
    url: page.url(),
    httpStatus: status,
    result,
    optionalAbsent,
    missing,
    forbiddenPresent,
    durationMs: Date.now() - startedAt,
    textSample: summarizeText(text),
  };
}

async function pageFetch(page, route, options = {}) {
  return page.evaluate(async ({ route: targetRoute, options: fetchOptions, timeoutMs }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(targetRoute, {
        credentials: 'include',
        redirect: 'manual',
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          accept: 'application/json,text/plain,*/*',
          ...(fetchOptions.headers ?? {}),
        },
      });
      const text = await res.text();
      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        text,
      };
    } catch (error) {
      return {
        status: 0,
        headers: {},
        text: `FETCH_ERROR:${error instanceof Error ? error.name : 'Error'}:${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }, { route, options, timeoutMs: apiFetchTimeoutMs });
}

async function runPortfolioApiCheck(page, liveContext) {
  const response = await pageFetch(page, '/api/tower/value-states');
  let json = null;
  try {
    json = JSON.parse(response.text);
  } catch {
    // captured below as invalid JSON
  }
  const portfolio = json?.data?.portfolio;
  const totals = portfolio?.totals ?? {};
  const issues = [];
  if (response.status !== 200) issues.push(`http_${response.status}`);
  if (!json?.ok) issues.push('ok_false');
  if (portfolio?.clientId !== liveContext.client.id) issues.push('client_id_mismatch');
  if (typeof totals.projectedUsd !== 'number' || totals.projectedUsd <= 0) issues.push('projected_value_missing');
  if (typeof totals.trackedUsd !== 'number') issues.push('tracked_value_missing');
  if (typeof totals.verifiedUsd !== 'number') issues.push('verified_value_missing');
  if (totals.verifiedUsd > totals.projectedUsd) issues.push('verified_exceeds_projected');
  return {
    id: 'api-tower-value-states',
    route: '/api/tower/value-states',
    httpStatus: response.status,
    result: issues.length === 0 ? 'pass' : 'fail',
    issues,
    responseBody: json ?? response.text.slice(0, 1000),
    totals,
    activeMoveCount: totals.activeMoveCount ?? null,
    activeSourceWorkflowCount: totals.activeSourceWorkflowCount ?? null,
    p10Source: portfolio?.p10Source ?? null,
  };
}

async function runLegacySynthesisCheck(page) {
  const response = await pageFetch(page, '/api/tower/synthesis', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  const text = response.text;
  const issues = [];
  if (![200, 403, 504].includes(response.status)) issues.push(`unexpected_http_${response.status}`);
  if (/Apex Retail|Meridian Health/i.test(text)) issues.push('foreign_tenant_token');
  if (/realized savings are complete|fully cut over/i.test(text)) issues.push('overclaim');
  const legacyEmpty = /No active programs or source events|nothing to synthesize|no active portfolio/i.test(text);
  return {
    id: 'api-tower-synthesis-legacy',
    route: '/api/tower/synthesis',
    httpStatus: response.status,
    result: issues.length === 0 ? (legacyEmpty ? 'watch' : 'pass') : 'fail',
    issues,
    legacyEmpty,
    note: legacyEmpty
      ? 'Legacy synthesis route is tenant-safe and honest but does not yet synthesize Lakeshore DB portfolio instances.'
      : 'Legacy synthesis route returned non-empty tenant-safe output.',
    textSample: summarizeText(text, 8),
  };
}

async function runAtlasQuestion(page, liveContext, question) {
  const startedAt = Date.now();
  const response = await pageFetch(page, '/api/v1/atlas/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: question.message,
      clientId: liveContext.client.id,
      surfaceContext: {
        activeTowerLens: 'value',
        tenantName: 'Lakeshore Holdings',
        qaHarness: 'lakeshore-tower-atlas-federated-qa',
      },
    }),
  });
  let body = null;
  try {
    body = JSON.parse(response.text);
  } catch {
    // captured in issues
  }
  const answer = extractResponseText(body);
  const missingGroups = question.requiredAny
    .filter((markers) => !includesAll(answer, markers))
    .map((markers) => markers.join(' + '));
  const forbiddenHits = stripAllowedForbidden(answer, question.forbidden, question.allowedIfAlsoPresent);
  const issues = [];
  if (response.status !== 200) issues.push(`http_${response.status}`);
  if (!body) issues.push('invalid_json');
  if (!answer.trim()) issues.push('empty_answer');
  if (missingGroups.length > 0) issues.push(`missing:${missingGroups.join(';')}`);
  if (forbiddenHits.length > 0) issues.push(`forbidden:${forbiddenHits.join(';')}`);
  if (body?.atlasMode === 'fallback') issues.push(`fallback:${body.fallbackReason ?? 'unknown'}`);

  return {
    id: question.id,
    route: '/api/v1/atlas/ask',
    httpStatus: response.status,
    atlasModeHeader: response.headers['x-atlas-mode'] ?? null,
    atlasMode: body?.atlasMode ?? null,
    routeType: body?.routeType ?? null,
    intent: body?.intent ?? null,
    result: issues.length === 0 ? 'pass' : 'fail',
    issues,
    missingGroups,
    forbiddenHits,
    latencyMs: Date.now() - startedAt,
    question: question.message,
    answer,
  };
}

function summarize(liveContext, routes, apis, atlas) {
  const all = [...routes, ...apis, ...atlas];
  const failed = all.filter((check) => check.result === 'fail');
  const watches = all.filter((check) => check.result === 'watch');
  const passed = all.filter((check) => check.result === 'pass');
  return {
    status: failed.length === 0 ? (watches.length > 0 ? 'ready_with_watch' : 'ready') : 'blocked',
    checkedAt: new Date().toISOString(),
    baseUrl,
    email,
    activeClient,
    tenantKey,
    gitSha: gitSha(),
    outputDir,
    liveContext,
    totals: {
      total: all.length,
      pass: passed.length,
      watch: watches.length,
      fail: failed.length,
    },
    blockers: failed.map((check) => ({ id: check.id, issues: check.issues ?? check.missing ?? [] })),
    watches: watches.map((check) => ({ id: check.id, note: check.note ?? (check.optionalAbsent ? 'Optional tenant route not present.' : 'Watch item.') })),
  };
}

function renderReport(summary, routes, apis, atlas) {
  const routeRows = routes.map((row) => `<tr class="${escapeHtml(row.result)}"><td>${escapeHtml(row.result)}</td><td>${escapeHtml(row.id)}</td><td><code>${escapeHtml(row.route)}</code></td><td>${escapeHtml(row.httpStatus)}</td><td>${escapeHtml(row.missing.join('; ') || '-')}</td><td>${escapeHtml(row.forbiddenPresent.join('; ') || '-')}</td></tr>`).join('\n');
  const apiRows = apis.map((row) => `<tr class="${escapeHtml(row.result)}"><td>${escapeHtml(row.result)}</td><td>${escapeHtml(row.id)}</td><td><code>${escapeHtml(row.route)}</code></td><td>${escapeHtml(row.httpStatus)}</td><td>${escapeHtml((row.issues ?? []).join('; ') || row.note || '-')}</td></tr>`).join('\n');
  const atlasRows = atlas.map((row) => `<tr class="${escapeHtml(row.result)}"><td>${escapeHtml(row.result)}</td><td>${escapeHtml(row.id)}</td><td>${escapeHtml(row.atlasMode ?? '-')}</td><td>${escapeHtml(row.routeType ?? '-')}</td><td>${escapeHtml(row.intent ?? '-')}</td><td>${escapeHtml(row.issues.join('; ') || '-')}</td></tr>`).join('\n');
  const atlasSamples = atlas.map((row) => `<details><summary>${escapeHtml(row.id)} answer</summary><pre>${escapeHtml(row.answer)}</pre></details>`).join('\n');
  const routeSamples = routes.map((row) => `<details><summary>${escapeHtml(row.result.toUpperCase())} ${escapeHtml(row.id)} ${escapeHtml(row.route)}</summary><ol>${row.textSample.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ol></details>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lakeshore Tower/Atlas Federated QA</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #18221f; background: #f7f4ed; }
    h1 { margin-bottom: 4px; }
    .meta, p { color: #52615b; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 12px; margin: 22px 0; }
    .card { background: #fff; border: 1px solid #d8ded8; border-radius: 8px; padding: 14px; }
    .metric { font-size: 28px; font-weight: 750; }
    table { border-collapse: collapse; width: 100%; background: #fff; border: 1px solid #d8ded8; margin: 14px 0 26px; }
    th, td { text-align: left; border-bottom: 1px solid #e6e9e4; padding: 8px 10px; vertical-align: top; font-size: 13px; }
    th { background: #edf1ec; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    tr.pass td:first-child { color: #116b3a; font-weight: 800; }
    tr.watch td:first-child { color: #926300; font-weight: 800; }
    tr.fail td:first-child { color: #a32727; font-weight: 800; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
    pre { white-space: pre-wrap; background: #fff; border: 1px solid #d8ded8; border-radius: 8px; padding: 12px; }
    details { margin: 10px 0; background: #fff; border: 1px solid #d8ded8; border-radius: 8px; padding: 10px 12px; }
  </style>
</head>
<body>
  <h1>Lakeshore Tower/Atlas Federated QA</h1>
  <div class="meta">Checked ${escapeHtml(summary.checkedAt)} - ${escapeHtml(summary.baseUrl)} - ${escapeHtml(summary.email)} - client cookie ${escapeHtml(summary.activeClient)} - git ${escapeHtml(summary.gitSha)}</div>
  <p>This packet verifies Tower route readiness, Tower value-state separation, legacy synthesis honesty, and Atlas CXO-digest answer quality for the Lakeshore/Kyriba federated command story. Corpus expansion is intentionally out of scope.</p>
  <div class="summary">
    <div class="card"><div>Status</div><div class="metric">${escapeHtml(summary.status)}</div></div>
    <div class="card"><div>Pass</div><div class="metric">${summary.totals.pass}</div></div>
    <div class="card"><div>Watch</div><div class="metric">${summary.totals.watch}</div></div>
    <div class="card"><div>Fail</div><div class="metric">${summary.totals.fail}</div></div>
  </div>
  <h2>Live Context</h2>
  <pre>${escapeHtml(JSON.stringify(summary.liveContext, null, 2))}</pre>
  <h2>Routes</h2>
  <table><thead><tr><th>Result</th><th>ID</th><th>Route</th><th>HTTP</th><th>Missing</th><th>Forbidden</th></tr></thead><tbody>${routeRows}</tbody></table>
  <h2>APIs</h2>
  <table><thead><tr><th>Result</th><th>ID</th><th>Route</th><th>HTTP</th><th>Issues / Note</th></tr></thead><tbody>${apiRows}</tbody></table>
  <h2>Atlas Answers</h2>
  <table><thead><tr><th>Result</th><th>ID</th><th>Mode</th><th>Route Type</th><th>Intent</th><th>Issues</th></tr></thead><tbody>${atlasRows}</tbody></table>
  <h2>Atlas Answer Samples</h2>
  ${atlasSamples}
  <h2>Route Text Samples</h2>
  ${routeSamples}
</body>
</html>`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const liveContext = await queryLiveContext();
  const browser = await chromium.launch({ headless: true });
  const routes = [];
  const apis = [];
  const atlas = [];

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(context, page);

    for (const check of routeChecks) {
      try {
        routes.push(await runRouteCheck(page, check));
      } catch (error) {
        routes.push({
          ...check,
          url: `${baseUrl}${check.route}`,
          httpStatus: null,
          result: check.severity === 'blocker' ? 'fail' : 'watch',
          optionalAbsent: false,
          missing: check.required,
          forbiddenPresent: [],
          error: error instanceof Error ? error.message : String(error),
          durationMs: 0,
          textSample: [],
        });
      }
    }

    apis.push(await runPortfolioApiCheck(page, liveContext));
    apis.push(await runLegacySynthesisCheck(page));

    for (const question of atlasQuestions) {
      atlas.push(await runAtlasQuestion(page, liveContext, question));
    }
  } finally {
    await browser.close();
  }

  const summary = summarize(liveContext, routes, apis, atlas);
  await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'routes.json'), `${JSON.stringify(routes, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'apis.json'), `${JSON.stringify(apis, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'atlas-answers.json'), `${JSON.stringify(atlas, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'report.html'), renderReport(summary, routes, apis, atlas));
  await writeFile(
    path.join(outputDir, 'README.md'),
    [
      '# Lakeshore Tower/Atlas Federated QA',
      '',
      `- Status: ${summary.status}`,
      `- Base URL: ${summary.baseUrl}`,
      `- Persona: ${summary.email}`,
      `- Active client cookie: ${summary.activeClient}`,
      `- Checks: ${summary.totals.total}`,
      `- Pass / watch / fail: ${summary.totals.pass} / ${summary.totals.watch} / ${summary.totals.fail}`,
      `- HTML report: report.html`,
      '',
    ].join('\n'),
  );

  console.log(JSON.stringify({
    status: summary.status,
    totals: summary.totals,
    blockers: summary.blockers,
    watches: summary.watches,
    outputDir,
  }, null, 2));
  if (summary.totals.fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
