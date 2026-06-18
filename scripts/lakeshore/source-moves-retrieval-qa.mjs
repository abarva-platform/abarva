import { createClerkClient } from '@clerk/backend';
import pg from 'pg';
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const { Client } = pg;

const baseUrl = process.env.LAKESHORE_DEMO_QA_BASE_URL ?? 'https://app.abarva.ai';
const email = process.env.LAKESHORE_DEMO_QA_EMAIL ?? 'cfo@lakeshore-holdings.example.com';
const activeClient = process.env.LAKESHORE_DEMO_QA_CLIENT ?? 'lakeshore';
const tenantKey = process.env.LAKESHORE_TENANT_KEY ?? 'lakeshore';
const brokerTenantKey = process.env.LAKESHORE_BROKER_TENANT_KEY ?? 'lakeshore-holdings';
const outputRoot = process.env.LAKESHORE_RETRIEVAL_QA_OUT ?? 'audit-artifacts/lakeshore-source-moves-retrieval-qa';
const runId = `lakeshore-source-moves-retrieval-qa-${new Date().toISOString().replace(/[:.]/g, '-')}-${gitSha()}`;
const outputDir = path.join(outputRoot, runId);

const sourceChecks = [
  {
    id: 'source-kyriba-strategy-body',
    eventCode: 'LSH-KYRIBA-TREASURY-2026',
    artifactCode: 'd01_strategy_memo',
    bodyMarkers: ['Kyriba', 'treasury', 'Lakeshore'],
    renderHtml: true,
  },
  {
    id: 'source-kyriba-scope-body',
    eventCode: 'LSH-KYRIBA-TREASURY-2026',
    artifactCode: 'd05_scope_memo',
    bodyMarkers: ['scope', 'bank', 'opco'],
    renderHtml: true,
  },
  {
    id: 'source-kyriba-rfp-body',
    eventCode: 'LSH-KYRIBA-TREASURY-2026',
    artifactCode: 'd09_rfp_pack',
    bodyMarkers: ['RFP', 'Kyriba', 'bank'],
    renderHtml: true,
  },
  {
    id: 'source-kyriba-decision-body',
    eventCode: 'LSH-KYRIBA-TREASURY-2026',
    artifactCode: 'd24_decision_brief',
    bodyMarkers: ['decision', 'Kyriba', 'Lakeshore'],
    renderHtml: true,
  },
  {
    id: 'source-kyriba-selection-html',
    eventCode: 'LSH-KYRIBA-TREASURY-2026',
    artifactCode: 'd27_selection_memo',
    bodyMarkers: ['selection', 'Kyriba', 'Lakeshore'],
    skipBody: true,
    renderHtml: true,
  },
  {
    id: 'source-ams-evaluation-body',
    eventCode: 'LSH-AMS-MODERNIZATION-2026',
    artifactCode: 'd16_scorecard',
    bodyMarkers: ['evaluation', 'scorecard', 'Lakeshore'],
    renderHtml: false,
  },
];

const moveExpectations = [
  {
    id: 'moves-kyriba-attachments',
    name: 'Kyriba global treasury rollout',
    minimumAttachments: 12,
    filenameMarkers: ['kyriba-rollout-gate-01-bank-connectivity-matrix.md', 'kyriba-rollout-gate-06-intercompany-reconciliation-control.md'],
  },
  {
    id: 'moves-data-spine-attachments',
    name: 'Shared data platform and evidence spine',
    minimumAttachments: 6,
    filenameMarkers: ['shared-data-platform', 'evidence'],
  },
];

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

function databaseUrl() {
  const value = process.env.DATABASE_URL ?? process.env.ABARVA_AZURE_DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL or ABARVA_AZURE_DATABASE_URL is required');
  return value;
}

async function query(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function loadLiveMap() {
  const client = new Client({ connectionString: databaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const events = await query(
      client,
      `select id, event_code, event_name
         from source_events
        where client_key = $1
          and event_code = any($2::text[])`,
      [tenantKey, [...new Set(sourceChecks.map((check) => check.eventCode))]],
    );

    const moves = await query(
      client,
      `select e.id, e.name
         from clients c
         join engagements e on e.client_id = c.id
        where (c.tenant_key = $1 or c.slug = $1)
          and e.name = any($2::text[])
          and e.archived_at is null
          and e.deleted_at is null`,
      [brokerTenantKey, moveExpectations.map((move) => move.name)],
    );

    const sourceArtifacts = await query(
      client,
      `select se.event_code,
              s.artifact_code,
              length(coalesce(s.body, ''))::int as body_chars,
              s.body_format,
              s.status,
              s.stage_key
         from source_event_artifact_states s
         join source_events se on se.id = s.source_event_id
        where se.client_key = $1
          and se.event_code = any($2::text[])
          and s.artifact_code = any($3::text[])`,
      [
        tenantKey,
        [...new Set(sourceChecks.map((check) => check.eventCode))],
        [...new Set(sourceChecks.map((check) => check.artifactCode))],
      ],
    );

    return {
      eventsByCode: Object.fromEntries(events.map((row) => [row.event_code, row])),
      movesByName: Object.fromEntries(moves.map((row) => [row.name, row])),
      sourceArtifacts,
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

function summarizeBody(body) {
  return String(body ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function redactSignedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}?<signed-query-redacted>`;
  } catch {
    return '<unparseable-signed-url-redacted>';
  }
}

async function pageFetch(page, route) {
  const response = await page.evaluate(async (targetRoute) => {
    const res = await fetch(targetRoute, { credentials: 'include' });
    const text = await res.text();
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      text,
    };
  }, route);
  const text = response.text;
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Keep a short text sample for non-JSON failures.
  }
  return { ...response, json };
}

async function checkSource(page, liveMap, check) {
  const route = `/api/v1/source/${encodeURIComponent(check.eventCode)}/artifacts/${encodeURIComponent(check.artifactCode)}/body`;
  const bodyResponse = check.skipBody ? { status: null, json: { body: '' } } : await pageFetch(page, route);
  const body = bodyResponse.json?.body ?? '';
  const lower = body.toLowerCase();
  const missingMarkers = check.skipBody
    ? []
    : check.bodyMarkers.filter((marker) => !lower.includes(marker.toLowerCase()));
  const dbArtifact = liveMap.sourceArtifacts.find(
    (row) => row.event_code === check.eventCode && row.artifact_code === check.artifactCode,
  );
  const issues = [];
  if (!liveMap.eventsByCode[check.eventCode]) issues.push('source_event_missing_in_db');
  if (!dbArtifact) issues.push('artifact_state_missing_in_db');
  if (!check.skipBody && bodyResponse.status !== 200) issues.push(`body_route_http_${bodyResponse.status}`);
  if (!check.skipBody && (!body || body.length < 200)) issues.push(`body_too_short_${body.length}`);
  if (missingMarkers.length > 0) issues.push(`missing_markers:${missingMarkers.join(',')}`);

  let html = null;
  if (check.renderHtml) {
    const htmlRoute = `/api/v1/source/${encodeURIComponent(check.eventCode)}/artifacts/${encodeURIComponent(check.artifactCode)}/render-html`;
    const htmlResponse = await pageFetch(page, htmlRoute);
    const htmlText = htmlResponse.text;
    const htmlIssues = [];
    if (htmlResponse.status !== 200) htmlIssues.push(`render_html_http_${htmlResponse.status}`);
    if (!htmlText.includes(check.artifactCode)) htmlIssues.push('render_html_missing_artifact_code');
    if (!htmlText.includes(check.eventCode)) htmlIssues.push('render_html_missing_event_code');
    for (const marker of check.bodyMarkers) {
      if (!htmlText.toLowerCase().includes(marker.toLowerCase())) {
        htmlIssues.push(`render_html_missing_marker:${marker}`);
      }
    }
    html = {
      route: htmlRoute,
      httpStatus: htmlResponse.status,
      contentType: htmlResponse.headers['content-type'] ?? null,
      contentLength: htmlText.length,
      issues: htmlIssues,
    };
    issues.push(...htmlIssues);
  }

  return {
    ...check,
    route,
    status: issues.length === 0 ? 'pass' : 'fail',
    httpStatus: bodyResponse.status,
    dbBodyChars: dbArtifact?.body_chars ?? null,
    dbStatus: dbArtifact?.status ?? null,
    dbStage: dbArtifact?.stage_key ?? null,
    bodyChars: body.length,
    missingMarkers,
    bodySample: summarizeBody(body),
    renderHtml: html,
    issues,
  };
}

async function checkMove(page, liveMap, expectation) {
  const move = liveMap.movesByName[expectation.name];
  const issues = [];
  if (!move) {
    return { ...expectation, status: 'fail', issues: ['move_missing_in_db'], attachments: [] };
  }

  await page.goto(`${baseUrl}/strategic-moves/${encodeURIComponent(move.id)}?tab=documents`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  const listRoute = `/api/programs/${encodeURIComponent(move.id)}/attachments`;
  const list = await pageFetch(page, listRoute);
  if (list.status !== 200) issues.push(`attachment_list_http_${list.status}`);
  const attachments = Array.isArray(list.json?.attachments) ? list.json.attachments : [];
  if (attachments.length < expectation.minimumAttachments) {
    issues.push(`attachment_count_${attachments.length}_lt_${expectation.minimumAttachments}`);
  }
  const filenames = attachments.map((attachment) => String(attachment.originalName ?? attachment.filename ?? ''));
  for (const marker of expectation.filenameMarkers) {
    if (!filenames.some((name) => name.toLowerCase().includes(marker.toLowerCase()))) {
      issues.push(`missing_filename_marker:${marker}`);
    }
  }

  const downloadSamples = [];
  for (const attachment of attachments.slice(0, 3)) {
    const attachmentId = attachment.id;
    const route = `/api/programs/${encodeURIComponent(move.id)}/attachments/${encodeURIComponent(attachmentId)}`;
    const sampleIssues = [];
    const downloadPage = await page.context().newPage();
    try {
      const downloadPromise = downloadPage.waitForEvent('download', { timeout: 45_000 });
      await downloadPage.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch((error) => {
        if (!/Download is starting/i.test(String(error))) throw error;
      });
      const download = await downloadPromise;
      const filePath = await download.path();
      const fileStat = filePath ? await stat(filePath) : null;
      if (!fileStat || fileStat.size === 0) sampleIssues.push('download_empty');
      downloadSamples.push({
        attachmentId,
        originalName: attachment.originalName,
        route,
        redirectStatus: 'browser_download',
        signedLocation: redactSignedUrl(download.url()),
        blobStatus: 'downloaded',
        bytesFetched: fileStat?.size ?? 0,
        contentType: attachment.mimeType ?? null,
        suggestedFilename: download.suggestedFilename(),
        issues: sampleIssues,
      });
    } catch (error) {
      sampleIssues.push(`download_failed:${error instanceof Error ? error.message : String(error)}`);
      downloadSamples.push({
        attachmentId,
        originalName: attachment.originalName,
        route,
        redirectStatus: null,
        signedLocation: null,
        blobStatus: null,
        bytesFetched: 0,
        contentType: attachment.mimeType ?? null,
        issues: sampleIssues,
      });
    } finally {
      await downloadPage.close().catch(() => {});
    }
    issues.push(...sampleIssues);
  }

  return {
    ...expectation,
    moveId: move.id,
    listRoute,
    status: issues.length === 0 ? 'pass' : 'fail',
    listHttpStatus: list.status,
    attachmentCount: attachments.length,
    filenames,
    downloadSamples,
    issues,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderReport(summary) {
  const sourceRows = summary.source
    .map(
      (row) => `<tr class="${escapeHtml(row.status)}"><td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.id)}</td><td><code>${escapeHtml(row.route)}</code></td><td>${row.httpStatus}</td><td>${row.bodyChars}</td><td>${escapeHtml(row.issues.join('; ') || 'None')}</td></tr>`,
    )
    .join('\n');
  const moveRows = summary.moves
    .map(
      (row) => `<tr class="${escapeHtml(row.status)}"><td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.id)}</td><td><code>${escapeHtml(row.listRoute ?? '-')}</code></td><td>${escapeHtml(row.attachmentCount ?? 0)}</td><td>${escapeHtml(row.downloadSamples?.length ?? 0)}</td><td>${escapeHtml(row.issues.join('; ') || 'None')}</td></tr>`,
    )
    .join('\n');
  const downloads = summary.moves
    .flatMap((move) => move.downloadSamples ?? [])
    .map(
      (sample) => `<tr class="${sample.issues.length === 0 ? 'pass' : 'fail'}"><td>${escapeHtml(sample.originalName)}</td><td>${sample.redirectStatus}</td><td>${sample.blobStatus}</td><td>${sample.bytesFetched}</td><td><code>${escapeHtml(sample.signedLocation)}</code></td><td>${escapeHtml(sample.issues.join('; ') || 'None')}</td></tr>`,
    )
    .join('\n');
  const samples = summary.source
    .map(
      (row) => `<details><summary>${escapeHtml(row.id)} body sample</summary><ol>${row.bodySample
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join('')}</ol></details>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lakeshore Source/Moves Retrieval QA</title>
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
    tr.fail td:first-child { color: #a32727; font-weight: 800; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
    details { margin: 10px 0; background: #fff; border: 1px solid #d8ded8; border-radius: 8px; padding: 10px 12px; }
  </style>
</head>
<body>
  <h1>Lakeshore Source/Moves Retrieval QA</h1>
  <div class="meta">Checked ${escapeHtml(summary.checkedAt)} · ${escapeHtml(summary.baseUrl)} · ${escapeHtml(summary.email)} · client cookie ${escapeHtml(summary.activeClient)} · git ${escapeHtml(summary.gitSha)}</div>
  <p>This packet proves that representative Lakeshore Source artifacts and Moves attachments are retrievable through the authenticated app routes. Signed Blob URLs are redacted after host and path.</p>
  <div class="summary">
    <div class="card"><div>Status</div><div class="metric">${escapeHtml(summary.status)}</div></div>
    <div class="card"><div>Pass</div><div class="metric">${summary.totals.pass}</div></div>
    <div class="card"><div>Fail</div><div class="metric">${summary.totals.fail}</div></div>
    <div class="card"><div>Checks</div><div class="metric">${summary.totals.total}</div></div>
  </div>
  <h2>Source Artifacts</h2>
  <table><thead><tr><th>Result</th><th>ID</th><th>Route</th><th>HTTP</th><th>Body Chars</th><th>Issues</th></tr></thead><tbody>${sourceRows}</tbody></table>
  <h2>Moves Attachments</h2>
  <table><thead><tr><th>Result</th><th>ID</th><th>List Route</th><th>Attachments</th><th>Download Samples</th><th>Issues</th></tr></thead><tbody>${moveRows}</tbody></table>
  <h2>Download Samples</h2>
  <table><thead><tr><th>Name</th><th>Redirect HTTP</th><th>Blob HTTP</th><th>Bytes</th><th>Signed Location</th><th>Issues</th></tr></thead><tbody>${downloads}</tbody></table>
  <h2>Source Body Samples</h2>
  ${samples}
</body>
</html>`;
}

function summarize(source, moves) {
  const all = [...source, ...moves];
  const fail = all.filter((row) => row.status !== 'pass');
  return {
    status: fail.length === 0 ? 'retrieval_green' : 'retrieval_blocked',
    checkedAt: new Date().toISOString(),
    baseUrl,
    email,
    activeClient,
    tenantKey,
    brokerTenantKey,
    gitSha: gitSha(),
    outputDir,
    source,
    moves,
    totals: {
      total: all.length,
      pass: all.length - fail.length,
      fail: fail.length,
    },
    blockers: fail.map((row) => ({ id: row.id, issues: row.issues })),
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const liveMap = await loadLiveMap();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(context, page);
    await page.goto(`${baseUrl}/strategic-moves/1196dac0-715c-45ce-8eeb-5e70792d9aa4?tab=documents`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    const source = [];
    for (const check of sourceChecks) {
      source.push(await checkSource(page, liveMap, check));
    }

    const moves = [];
    for (const expectation of moveExpectations) {
      moves.push(await checkMove(page, liveMap, expectation));
    }

    const summary = summarize(source, moves);
    await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    await writeFile(path.join(outputDir, 'report.html'), renderReport(summary));
    await writeFile(
      path.join(outputDir, 'README.md'),
      [
        '# Lakeshore Source/Moves Retrieval QA',
        '',
        `- Status: ${summary.status}`,
        `- Base URL: ${summary.baseUrl}`,
        `- Persona: ${summary.email}`,
        `- Active client cookie: ${summary.activeClient}`,
        `- Checks: ${summary.totals.total}`,
        `- Pass / fail: ${summary.totals.pass} / ${summary.totals.fail}`,
        `- HTML report: report.html`,
        '',
      ].join('\n'),
    );
    console.log(JSON.stringify({ status: summary.status, totals: summary.totals, outputDir }, null, 2));
    if (summary.totals.fail > 0) process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
