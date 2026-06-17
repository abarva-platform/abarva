#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
function requireWorkspacePackage(name) {
  const candidates = [
    path.join(ROOT, 'package.json'),
    '/Users/anand/Projects/nexus/package.json',
  ];
  let lastError;
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      return createRequire(candidate)(name);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error(`Cannot resolve ${name}`);
}
const { Client } = requireWorkspacePackage('pg');
const OUT_DIR = process.env.LIVE_TENANT_POPULATION_AUDIT_OUT_DIR
  ? path.resolve(process.env.LIVE_TENANT_POPULATION_AUDIT_OUT_DIR)
  : path.join(ROOT, 'docs/build/data-quality');
const OUT_JSON = path.join(OUT_DIR, 'live-tenant-population-audit.json');
const OUT_MD = path.join(OUT_DIR, 'live-tenant-population-audit.md');

const ENV_PATHS = [
  path.join(ROOT, '.env.local'),
  '/Users/anand/Projects/nexus/.env.local',
];

const TENANTS = [
  {
    key: 'first-capital',
    label: 'First Capital Financial',
    tenantKeys: ['first-capital', 'firstcapital', 'arcturus'],
    clientIds: ['a75687bf-71b9-4524-ab4e-68ae3f28d200'],
  },
  {
    key: 'meridian-health',
    label: 'Meridian Health',
    tenantKeys: ['meridian-health', 'meridian'],
    clientIds: ['a20ecef5-f0ea-4890-b9d5-7375fab223ff'],
  },
  {
    key: 'lakeshore',
    label: 'Lakeshore',
    tenantKeys: ['lakeshore', 'lakeshore-holdings'],
    clientIds: [],
  },
  {
    key: 'apex-retail',
    label: 'Apex Retail',
    tenantKeys: ['apex-retail', 'apexretail', 'apex'],
    clientIds: ['bb8ed961-a049-4d0c-a38f-f8912138fceb'],
  },
  {
    key: 'northstar-clinical',
    label: 'Northstar Clinical Tech',
    tenantKeys: ['northstar-clinical', 'northstar'],
    clientIds: ['2702b525-4c6a-4fbe-973d-99a8480d8318'],
  },
  {
    key: 'skyharbor-air',
    label: 'SkyHarbor Air',
    tenantKeys: ['skyharbor-air', 'skyharbor'],
    clientIds: ['6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301'],
  },
];

const CONTEXT_TABLES = [
  'enterprise_context_sources',
  'enterprise_context_source_files',
  'enterprise_context_records',
  'enterprise_context_facts',
  'enterprise_context_evidence',
  'enterprise_context_relationships',
  'enterprise_context_quality_issues',
  'enterprise_context_stewardship_tasks',
  'enterprise_context_template_runs',
  'enterprise_context_chunk_queue',
  'enterprise_context_chunks',
  'context_refresh_events',
  'context_insights',
  'context_explorer_answer_audit',
];

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key]) continue;
    let value = raw.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

for (const file of ENV_PATHS) loadEnvFile(file);

function dbUrl() {
  return process.env.ABARVA_AZURE_DATABASE_URL
    ?? process.env.AZURE_DATABASE_URL
    ?? process.env.AZURE_LAB_DATABASE_URL
    ?? process.env.DATABASE_URL
    ?? '';
}

async function tableExists(client, table) {
  const result = await client.query(
    `select exists (
       select 1 from information_schema.tables
       where table_schema = 'public' and table_name = $1
     ) as exists`,
    [table],
  );
  return Boolean(result.rows[0]?.exists);
}

async function tableColumns(client, table) {
  const result = await client.query(
    `select column_name
       from information_schema.columns
      where table_schema = 'public' and table_name = $1`,
    [table],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function safeCount(client, table, where, params) {
  const result = await client.query(`select count(*)::int as n from public.${table} ${where}`, params);
  return result.rows[0]?.n ?? 0;
}

async function groupCount(client, table, groupColumn, where, params) {
  const result = await client.query(
    `select coalesce(${groupColumn}::text, '<null>') as key, count(*)::int as n
       from public.${table}
      ${where}
      group by 1
      order by n desc, key asc`,
    params,
  );
  return Object.fromEntries(result.rows.map((row) => [row.key, row.n]));
}

async function countContextTable(client, table, columns, tenant) {
  if (!columns.has('tenant_key')) return { supported: false, reason: 'missing_tenant_key_column', count: null };
  const count = await safeCount(client, table, 'where tenant_key = any($1::text[])', [tenant.tenantKeys]);
  const extras = {};
  if (columns.has('embedding_status')) {
    extras.embeddingStatus = await groupCount(client, table, 'embedding_status', 'where tenant_key = any($1::text[])', [tenant.tenantKeys]);
  }
  if (columns.has('record_type')) {
    extras.recordType = await groupCount(client, table, 'record_type', 'where tenant_key = any($1::text[])', [tenant.tenantKeys]);
  }
  if (columns.has('fact_type')) {
    extras.factType = await groupCount(client, table, 'fact_type', 'where tenant_key = any($1::text[])', [tenant.tenantKeys]);
  }
  if (columns.has('status')) {
    extras.status = await groupCount(client, table, 'status', 'where tenant_key = any($1::text[])', [tenant.tenantKeys]);
  }
  return { supported: true, count, ...extras };
}

async function discoverClientIds(client, tenant, clientsColumns) {
  const ids = new Set(tenant.clientIds);
  if (!clientsColumns?.size) return [...ids];
  const keyColumns = ['key', 'client_key', 'tenant_key', 'slug'].filter((column) => clientsColumns.has(column));
  const nameColumns = ['name', 'display_name', 'legal_name'].filter((column) => clientsColumns.has(column));
  const clauses = [];
  const params = [];
  if (keyColumns.length) {
    params.push(tenant.tenantKeys);
    clauses.push(`(${keyColumns.map((column) => `${column} = any($${params.length}::text[])`).join(' or ')})`);
  }
  if (nameColumns.length) {
    params.push(`%${tenant.key.split('-')[0]}%`);
    clauses.push(`(${nameColumns.map((column) => `${column} ilike $${params.length}`).join(' or ')})`);
  }
  if (!clauses.length || !clientsColumns.has('id')) return [...ids];
  const result = await client.query(`select id::text from public.clients where ${clauses.join(' or ')}`, params);
  for (const row of result.rows) ids.add(row.id);
  return [...ids];
}

async function sourceEventAudit(client, tenant) {
  if (!(await tableExists(client, 'source_events'))) return { exists: false };
  const columns = await tableColumns(client, 'source_events');
  if (!columns.has('client_key')) return { exists: true, supported: false, reason: 'missing_client_key_column' };
  const count = await safeCount(client, 'source_events', 'where client_key = any($1::text[])', [tenant.tenantKeys]);
  const byLifecycle = columns.has('lifecycle_state')
    ? await groupCount(client, 'source_events', 'lifecycle_state', 'where client_key = any($1::text[])', [tenant.tenantKeys])
    : {};
  const duplicateCodes = columns.has('event_code')
    ? (await client.query(
      `select event_code, count(*)::int as n
         from public.source_events
        where client_key = any($1::text[])
        group by event_code
       having count(*) > 1
        order by n desc, event_code asc
        limit 25`,
      [tenant.tenantKeys],
    )).rows
    : [];
  const badTextClauses = [];
  for (const column of ['event_name', 'trigger_description', 'scope_description']) {
    if (columns.has(column)) badTextClauses.push(`${column} ~* '(demo fixture|seed data|placeholder|sample only|generated from Source agent)'`);
  }
  const archiveCandidates = badTextClauses.length
    ? (await client.query(
      `select id::text, client_key, event_code, event_name, lifecycle_state
         from public.source_events
        where client_key = any($1::text[])
          and lifecycle_state <> 'archived'
          and (${badTextClauses.join(' or ')})
        order by updated_at desc nulls last
        limit 50`,
      [tenant.tenantKeys],
    )).rows
    : [];
  return { exists: true, supported: true, count, byLifecycle, duplicateCodes, archiveCandidates };
}

async function movesAudit(client, tenant, clientIds) {
  if (!(await tableExists(client, 'engagements'))) return { exists: false };
  const columns = await tableColumns(client, 'engagements');
  if (!columns.has('client_id') || clientIds.length === 0) return { exists: true, supported: false, reason: 'missing_client_id_or_client' };
  const count = await safeCount(client, 'engagements', 'where client_id::text = any($1::text[])', [clientIds]);
  const byLifecycle = columns.has('lifecycle_state')
    ? await groupCount(client, 'engagements', 'lifecycle_state', 'where client_id::text = any($1::text[])', [clientIds])
    : {};
  const activeConditions = ['client_id::text = any($1::text[])'];
  if (columns.has('lifecycle_state')) activeConditions.push("coalesce(lifecycle_state, 'active') <> 'archived'");
  if (columns.has('deleted_at')) activeConditions.push('deleted_at is null');
  const active = await safeCount(client, 'engagements', `where ${activeConditions.join(' and ')}`, [clientIds]).catch(() => null);
  const badTextClauses = [];
  for (const column of ['name', 'description', 'status']) {
    if (columns.has(column)) badTextClauses.push(`${column} ~* '(demo fixture|seed data|placeholder|sample only)'`);
  }
  const selectColumns = [
    'id::text as id',
    columns.has('name') ? 'name' : "null::text as name",
    columns.has('lifecycle_state') ? 'lifecycle_state' : "null::text as lifecycle_state",
    columns.has('archived_at') ? 'archived_at' : "null::timestamptz as archived_at",
    columns.has('archive_reason') ? 'archive_reason' : "null::text as archive_reason",
  ];
  const archiveCandidates = badTextClauses.length && columns.has('id')
    ? (await client.query(
      `select ${selectColumns.join(', ')}
         from public.engagements
        where client_id::text = any($1::text[])
          ${columns.has('lifecycle_state') ? "and coalesce(lifecycle_state, '') <> 'archived'" : ''}
          and (${badTextClauses.join(' or ')})
        order by updated_at desc nulls last
        limit 50`,
      [clientIds],
    )).rows
    : [];
  return { exists: true, supported: true, count, active, byLifecycle, archiveCandidates };
}

async function artifactCounts(client, tenant, clientIds) {
  const tables = {};
  for (const table of ['source_artifacts', 'source_event_artifact_states', 'source_event_evidence_states', 'source_artifact_generation_jobs', 'deliverables_v2']) {
    if (!(await tableExists(client, table))) {
      tables[table] = { exists: false };
      continue;
    }
    const columns = await tableColumns(client, table);
    if (columns.has('tenant_key')) {
      tables[table] = { exists: true, count: await safeCount(client, table, 'where tenant_key = any($1::text[])', [tenant.tenantKeys]) };
    } else if (columns.has('client_key')) {
      tables[table] = { exists: true, count: await safeCount(client, table, 'where client_key = any($1::text[])', [tenant.tenantKeys]) };
    } else if (columns.has('client_id') && clientIds.length) {
      tables[table] = { exists: true, count: await safeCount(client, table, 'where client_id::text = any($1::text[])', [clientIds]) };
    } else if (columns.has('engagement_id') && clientIds.length && await tableExists(client, 'engagements')) {
      tables[table] = {
        exists: true,
        count: await safeCount(
          client,
          table,
          'where engagement_id in (select id from public.engagements where client_id::text = any($1::text[]))',
          [clientIds],
        ),
      };
    } else {
      tables[table] = { exists: true, supported: false, reason: 'no_tenant_or_client_column' };
    }
  }
  return tables;
}

function renderMarkdown(result) {
  const lines = [];
  lines.push('# Live Tenant Population Audit');
  lines.push('');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push(`Database configured: ${result.databaseConfigured ? 'yes' : 'no'}`);
  lines.push('');
  if (!result.databaseConfigured) {
    lines.push('DATABASE_URL was not available, so no live read-only checks were run.');
    return `${lines.join('\n')}\n`;
  }
  if (result.connectionError) {
    lines.push(`Connection error: ${result.connectionError.code ?? result.connectionError.name ?? 'error'} - ${result.connectionError.message}`);
    lines.push('');
    lines.push('No live read-only counts were run. This usually means the current shell is outside the private DNS/VNet/VPN path for the configured Azure Postgres host.');
    return `${lines.join('\n')}\n`;
  }
  lines.push('This report is read-only. It does not load, update, delete, or archive rows.');
  lines.push('');
  lines.push('| Tenant | Client ids | Context chunks | Facts | Insights | Source events | Moves | Archive candidates | Judgment |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const tenant of result.tenants) {
    const chunks = tenant.context.enterprise_context_chunks?.count ?? 'n/a';
    const facts = tenant.context.enterprise_context_facts?.count ?? 'n/a';
    const insights = tenant.context.context_insights?.count ?? 'n/a';
    const sourceEvents = tenant.sourceEvents?.count ?? 'n/a';
    const moves = tenant.moves?.count ?? 'n/a';
    const archiveN = (tenant.sourceEvents?.archiveCandidates?.length ?? 0) + (tenant.moves?.archiveCandidates?.length ?? 0);
    lines.push(`| ${tenant.label} | ${tenant.clientIds.join(', ') || 'not discovered'} | ${chunks} | ${facts} | ${insights} | ${sourceEvents} | ${moves} | ${archiveN} | ${tenant.judgment} |`);
  }
  lines.push('');
  lines.push('## Tenant Details');
  lines.push('');
  for (const tenant of result.tenants) {
    lines.push(`### ${tenant.label}`);
    lines.push('');
    lines.push(`Tenant keys checked: ${tenant.tenantKeys.join(', ')}`);
    lines.push(`Client ids: ${tenant.clientIds.join(', ') || 'not discovered'}`);
    lines.push(`Judgment: ${tenant.judgment}`);
    lines.push('');
    lines.push('Context counts:');
    lines.push('');
    for (const table of CONTEXT_TABLES) {
      const row = tenant.context[table];
      if (!row) continue;
      lines.push(`- ${table}: ${row.count ?? row.reason ?? 'unsupported'}`);
    }
    lines.push('');
    lines.push(`Source event lifecycle: ${JSON.stringify(tenant.sourceEvents?.byLifecycle ?? {})}`);
    lines.push(`Move lifecycle: ${JSON.stringify(tenant.moves?.byLifecycle ?? {})}`);
    const sourceCandidates = tenant.sourceEvents?.archiveCandidates ?? [];
    const moveCandidates = tenant.moves?.archiveCandidates ?? [];
    if (sourceCandidates.length || moveCandidates.length) {
      lines.push('');
      lines.push('Archive candidates detected by read-only heuristics:');
      for (const candidate of sourceCandidates) lines.push(`- Source event ${candidate.event_code ?? candidate.id}: ${candidate.event_name ?? ''}`);
      for (const candidate of moveCandidates) lines.push(`- Move ${candidate.id}: ${candidate.name ?? ''}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function judgmentFor(tenant) {
  const chunks = tenant.context.enterprise_context_chunks?.count ?? 0;
  const facts = tenant.context.enterprise_context_facts?.count ?? 0;
  const insights = tenant.context.context_insights?.count ?? 0;
  const sourceEvents = tenant.sourceEvents?.count ?? 0;
  const moves = tenant.moves?.count ?? 0;
  if (chunks >= 250 && facts >= 250 && insights > 0) return 'populated_with_insights';
  if (chunks >= 250 && facts >= 250) return 'populated_missing_or_unproven_insights';
  if (chunks > 0 || facts > 0 || sourceEvents > 0 || moves > 0) return 'partially_populated_needs_gap_fill';
  return 'not_populated_in_live_context';
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const databaseUrl = dbUrl();
  const result = {
    generatedAt: new Date().toISOString(),
    databaseConfigured: Boolean(databaseUrl),
    connectionError: null,
    tenants: [],
  };
  if (!databaseUrl) {
    fs.writeFileSync(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(OUT_MD, renderMarkdown(result));
    console.log(`Wrote ${path.relative(ROOT, OUT_JSON)} without live DB; DATABASE_URL missing`);
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
  });
  try {
    await client.connect();
  } catch (error) {
    result.connectionError = error instanceof Error
      ? { name: error.name, code: error.code, message: error.message }
      : { message: String(error) };
    fs.writeFileSync(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(OUT_MD, renderMarkdown(result));
    console.log(`Wrote ${path.relative(ROOT, OUT_JSON)} with connection error`);
    console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
    return;
  }
  try {
    const clientsColumns = await tableExists(client, 'clients') ? await tableColumns(client, 'clients') : new Set();
    const tableColumnCache = new Map();
    for (const table of CONTEXT_TABLES) {
      if (await tableExists(client, table)) tableColumnCache.set(table, await tableColumns(client, table));
    }
    for (const tenant of TENANTS) {
      const clientIds = await discoverClientIds(client, tenant, clientsColumns);
      const context = {};
      for (const table of CONTEXT_TABLES) {
        if (!tableColumnCache.has(table)) {
          context[table] = { exists: false };
        } else {
          context[table] = await countContextTable(client, table, tableColumnCache.get(table), tenant);
        }
      }
      const tenantReport = {
        ...tenant,
        clientIds,
        context,
        sourceEvents: await sourceEventAudit(client, tenant),
        moves: await movesAudit(client, tenant, clientIds),
        artifacts: await artifactCounts(client, tenant, clientIds),
      };
      tenantReport.judgment = judgmentFor(tenantReport);
      result.tenants.push(tenantReport);
    }
  } finally {
    await client.end();
  }
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(OUT_MD, renderMarkdown(result));
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
