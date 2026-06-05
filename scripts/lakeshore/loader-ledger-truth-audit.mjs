import pg from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const { Client } = pg;

const clientId = process.env.LAKESHORE_CLIENT_ID ?? 'f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61';
const tenantKeys = (process.env.LAKESHORE_TENANT_KEYS ?? 'lakeshore,lakeshore-holdings')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const outputRoot = process.env.LAKESHORE_LEDGER_AUDIT_OUT ?? 'audit-artifacts/lakeshore-loader-ledger-truth';
const runId = `lakeshore-loader-ledger-truth-${new Date().toISOString().replace(/[:.]/g, '-')}-${gitSha()}`;
const outputDir = path.join(outputRoot, runId);

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

function databaseUrl() {
  const url = process.env.DATABASE_URL ?? process.env.ABARVA_AZURE_DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL or ABARVA_AZURE_DATABASE_URL is required');
  return url;
}

async function scalar(client, sql, params = []) {
  const result = await client.query(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function tableExists(client, tableName) {
  const result = await client.query('select to_regclass($1) as exists', [`public.${tableName}`]);
  return Boolean(result.rows[0]?.exists);
}

async function maybeCount(client, tableName, whereSql, params) {
  if (!(await tableExists(client, tableName))) return { table: tableName, exists: false, count: null };
  const count = await scalar(client, `select count(*)::int as count from ${tableName} where ${whereSql}`, params);
  return { table: tableName, exists: true, count };
}

async function collect() {
  const client = new Client({ connectionString: databaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const tenantParams = [tenantKeys];
    const clientParams = [clientId];
    const ledgerTables = [
      'pilot_ingestion_upload_runs',
      'pilot_ingestion_file_manifests',
      'pilot_ingestion_quarantine_cases',
      'pilot_ingestion_clarification_requests',
      'pilot_ingestion_approval_decisions',
      'pilot_ingestion_load_commits',
      'pilot_ingestion_load_commit_items',
      'pilot_ingestion_rollback_requests',
      'pilot_ingestion_audit_exports',
    ];

    const loaderCounts = {
      data_ingestion_runs: await maybeCount(
        client,
        'data_ingestion_runs',
        'tenant_key = any($1::text[])',
        tenantParams,
      ),
      data_inventory_records: await maybeCount(
        client,
        'data_inventory_records',
        'tenant_key = any($1::text[])',
        tenantParams,
      ),
      data_inventory_segments: await maybeCount(
        client,
        'data_inventory_segments',
        'client_id = $1',
        clientParams,
      ),
      enterprise_context_chunks: await maybeCount(
        client,
        'enterprise_context_chunks',
        'tenant_key = any($1::text[])',
        tenantParams,
      ),
    };

    const pilotLedgerCounts = [];
    for (const table of ledgerTables) {
      pilotLedgerCounts.push(await maybeCount(client, table, 'tenant_key = any($1::text[])', tenantParams));
    }

    const ingestionRuns = await client.query(
      `select source_root,
              status,
              count(*)::int as runs,
              coalesce(sum(records_loaded), 0)::int as records_loaded,
              coalesce(sum(chunks_loaded), 0)::int as chunks_loaded
         from data_ingestion_runs
        where tenant_key = any($1::text[])
        group by source_root, status
        order by source_root, status`,
      tenantParams,
    );

    const segments = await client.query(
      `select segment_id,
              coalesce(max(segment_name), segment_id) as segment_name,
              coalesce(sum(record_count), 0)::int as segment_record_count,
              max(health_state) as health_state
         from data_inventory_segments
        where client_id = $1
        group by segment_id
        order by segment_id`,
      clientParams,
    );

    const recordsBySegment = await client.query(
      `select segment_id, count(*)::int as records
         from data_inventory_records
        where tenant_key = any($1::text[])
        group by segment_id
        order by segment_id`,
      tenantParams,
    );

    const chunksBySourceDoc = await client.query(
      `select source_doc,
              count(*)::int as chunks,
              count(*) filter (where embedding_status = 'embedded')::int as embedded,
              count(*) filter (where embedding_status is null or embedding_status <> 'embedded')::int as not_embedded
         from enterprise_context_chunks
        where tenant_key = any($1::text[])
        group by source_doc
        order by source_doc`,
      tenantParams,
    );

    const pilotLedgerTotal = pilotLedgerCounts.reduce((sum, item) => sum + (item.count ?? 0), 0);
    const status =
      loaderCounts.data_ingestion_runs.count > 0 &&
      loaderCounts.data_inventory_records.count > 0 &&
      loaderCounts.enterprise_context_chunks.count > 0 &&
      pilotLedgerTotal === 0
        ? 'loader_backed_not_approval_ledger_proven'
        : pilotLedgerTotal > 0
          ? 'approval_ledger_partially_populated'
          : 'not_loaded';

    return {
      status,
      checkedAt: new Date().toISOString(),
      gitSha: gitSha(),
      clientId,
      tenantKeys,
      loaderCounts,
      pilotLedgerCounts,
      pilotLedgerTotal,
      ingestionRuns: ingestionRuns.rows,
      segments: segments.rows,
      recordsBySegment: recordsBySegment.rows,
      chunksBySourceDoc: chunksBySourceDoc.rows,
      demoTruth: {
        safeWording: 'Lakeshore context data is CSV/context-loader backed with committed records and chunks.',
        unsafeWording: 'Lakeshore data was proven through the full setup/admin approval-ledger workflow.',
        setupAdminLedgerProof: pilotLedgerTotal > 0 ? 'partial_or_present' : 'not_present',
        recommendation:
          pilotLedgerTotal === 0
            ? 'Do not backfill synthetic approval decisions as if they occurred. Either demo the CSV/context-loader proof honestly or run a fresh governed setup/admin load when that workflow is required.'
            : 'Review pilot ledger rows before claiming full setup/admin approval proof.',
      },
      outputDir,
    };
  } finally {
    await client.end();
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderTable(rows, columns) {
  return `<table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key] ?? '-')}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function renderReport(summary) {
  const loaderRows = Object.values(summary.loaderCounts).map((item) => ({
    table: item.table,
    exists: item.exists,
    count: item.count ?? 'missing',
  }));
  const ledgerRows = summary.pilotLedgerCounts.map((item) => ({
    table: item.table,
    exists: item.exists,
    count: item.count ?? 'missing',
  }));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lakeshore Loader Ledger Truth Audit</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #18221f; background: #f7f4ed; }
    h1 { margin-bottom: 4px; }
    .meta, .note { color: #52615b; }
    .status { display: inline-block; margin: 18px 0; padding: 8px 12px; border-radius: 6px; background: #fff3cd; border: 1px solid #e6cf7a; font-weight: 750; }
    table { border-collapse: collapse; width: 100%; background: #fff; border: 1px solid #d8ded8; margin: 14px 0 26px; }
    th, td { text-align: left; border-bottom: 1px solid #e6e9e4; padding: 8px 10px; vertical-align: top; font-size: 13px; }
    th { background: #eef3ee; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Lakeshore Loader Ledger Truth Audit</h1>
  <div class="meta">Checked ${escapeHtml(summary.checkedAt)} · git ${escapeHtml(summary.gitSha)} · client ${escapeHtml(summary.clientId)} · tenants ${escapeHtml(summary.tenantKeys.join(', '))}</div>
  <div class="status">${escapeHtml(summary.status)}</div>
  <p class="note">${escapeHtml(summary.demoTruth.safeWording)}</p>
  <p class="note"><strong>Unsafe wording:</strong> ${escapeHtml(summary.demoTruth.unsafeWording)}</p>
  <p class="note"><strong>Recommendation:</strong> ${escapeHtml(summary.demoTruth.recommendation)}</p>
  <h2>Loader-Backed Counts</h2>
  ${renderTable(loaderRows, [
    { key: 'table', label: 'Table' },
    { key: 'exists', label: 'Exists' },
    { key: 'count', label: 'Lakeshore Count' },
  ])}
  <h2>Pilot Approval Ledger Counts</h2>
  ${renderTable(ledgerRows, [
    { key: 'table', label: 'Table' },
    { key: 'exists', label: 'Exists' },
    { key: 'count', label: 'Lakeshore Count' },
  ])}
  <h2>Ingestion Runs</h2>
  ${renderTable(summary.ingestionRuns, [
    { key: 'source_root', label: 'Source Root' },
    { key: 'status', label: 'Status' },
    { key: 'runs', label: 'Runs' },
    { key: 'records_loaded', label: 'Records' },
    { key: 'chunks_loaded', label: 'Chunks' },
  ])}
  <h2>Inventory Segments</h2>
  ${renderTable(summary.segments, [
    { key: 'segment_id', label: 'Segment' },
    { key: 'segment_name', label: 'Name' },
    { key: 'segment_record_count', label: 'Records' },
    { key: 'health_state', label: 'Health' },
  ])}
  <h2>Chunk Provenance By Source Document</h2>
  ${renderTable(summary.chunksBySourceDoc, [
    { key: 'source_doc', label: 'Source Doc' },
    { key: 'chunks', label: 'Chunks' },
    { key: 'embedded', label: 'Embedded' },
    { key: 'not_embedded', label: 'Not Embedded' },
  ])}
</body>
</html>`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const summary = await collect();
  await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'report.html'), renderReport(summary));
  await writeFile(
    path.join(outputDir, 'README.md'),
    [
      '# Lakeshore Loader Ledger Truth Audit',
      '',
      `- Status: ${summary.status}`,
      `- Loader runs: ${summary.loaderCounts.data_ingestion_runs.count}`,
      `- Data inventory records: ${summary.loaderCounts.data_inventory_records.count}`,
      `- Enterprise context chunks: ${summary.loaderCounts.enterprise_context_chunks.count}`,
      `- Pilot approval-ledger rows: ${summary.pilotLedgerTotal}`,
      '- HTML report: report.html',
      '',
      summary.demoTruth.safeWording,
      '',
    ].join('\n'),
  );

  console.log(JSON.stringify(summary, null, 2));
  if (summary.status === 'not_loaded') process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
