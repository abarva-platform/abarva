#!/usr/bin/env node
const { Client } = require('pg');

const CLIENTS = [
  {
    key: 'apex-retail',
    name: 'Apex Retail',
    expectedClientId: '00000000-0000-4000-8000-000000000000',
    aliases: ['apex-retail', 'apexretail', 'apex'],
  },
  {
    key: 'first-capital',
    name: 'First Capital Financial',
    expectedClientId: '09d9a267-e89c-4fe1-831f-337a62787ec5',
    aliases: ['firstcapital', 'first-capital', 'first_capital', 'first-capital-financial', 'arcturus'],
  },
  {
    key: 'lakeshore-holdings',
    name: 'Lakeshore Holdings',
    expectedClientId: '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667',
    aliases: ['lakeshore-holdings', 'lakeshore', 'lakeshore-industries'],
  },
  {
    key: 'meridian-health',
    name: 'Meridian Health',
    expectedClientId: 'd2e9b6f4-8c25-43a9-b8e0-7d2f41f0a612',
    aliases: ['meridian-health', 'meridian', 'meridian-health-system', 'phs-meridian'],
  },
  {
    key: 'skyharbor-air',
    name: 'SkyHarbor Air',
    expectedClientId: '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301',
    aliases: ['skyharbor-air', 'skyharbor', 'skyharbor-airlines'],
  },
];

const TENANT_TABLES = [
  'enterprise_context_sources',
  'enterprise_context_source_files',
  'enterprise_context_records',
  'enterprise_context_facts',
  'enterprise_context_chunks',
  'enterprise_context_relationships',
];

const CLIENT_TABLES = [
  'client_private_patterns',
  'ai_control_refresh_runs',
  'ai_control_sources',
  'ai_control_initiatives',
  'ai_control_tool_usage_monthly',
  'ai_control_persona_productivity',
  'ai_control_dora_metrics',
  'ai_control_agent_outcomes',
  'ai_control_benefit_realization',
  'ai_control_spend_contracts',
  'ai_control_risk_governance',
  'ai_control_actions',
  'ai_control_evidence_items',
  'ai_control_context_facts',
  'ai_control_context_relationships',
  'ai_control_atlas_context_packs',
];

function quoteIdent(identifier) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) throw new Error(`unsafe_identifier:${identifier}`);
  return `"${identifier}"`;
}

async function maybeQuery(client, sql, params = []) {
  try {
    return await client.query(sql, params);
  } catch (error) {
    if (/does not exist|column .* does not exist/i.test(error.message)) return null;
    throw error;
  }
}

class Db {
  constructor(client) {
    this.client = client;
    this.columnCache = new Map();
  }

  async columns(table) {
    if (this.columnCache.has(table)) return this.columnCache.get(table);
    const result = await maybeQuery(
      this.client,
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = $1",
      [table],
    );
    const columns = new Set((result?.rows ?? []).map((row) => row.column_name));
    this.columnCache.set(table, columns);
    return columns;
  }

  async hasColumn(table, column) {
    return (await this.columns(table)).has(column);
  }

  async countByTenant(table, aliases) {
    if (!(await this.hasColumn(table, 'tenant_key'))) return null;
    const result = await maybeQuery(
      this.client,
      `select count(*)::int as count from ${quoteIdent(table)} where tenant_key = any($1::text[])`,
      [aliases],
    );
    return result?.rows[0]?.count ?? null;
  }

  async countByClient(table, clientId) {
    if (!(await this.hasColumn(table, 'client_id'))) return null;
    const result = await maybeQuery(
      this.client,
      `select count(*)::int as count from ${quoteIdent(table)} where client_id = $1`,
      [clientId],
    );
    return result?.rows[0]?.count ?? null;
  }

  async chunkEmbeddingStatus(aliases) {
    if (!(await this.hasColumn('enterprise_context_chunks', 'embedding_status'))) return {};
    const result = await maybeQuery(
      this.client,
      "select coalesce(embedding_status, 'null') as status, count(*)::int as count from enterprise_context_chunks where tenant_key = any($1::text[]) group by 1 order by 1",
      [aliases],
    );
    return Object.fromEntries((result?.rows ?? []).map((row) => [row.status, row.count]));
  }
}

async function resolveClient(db, candidate) {
  const columns = await db.columns('clients');
  const predicates = [];
  if (columns.has('tenant_key')) predicates.push({ sql: 'tenant_key = any($1::text[])', params: [candidate.aliases] });
  if (columns.has('client_key')) predicates.push({ sql: 'client_key = any($1::text[])', params: [candidate.aliases] });
  if (columns.has('slug')) predicates.push({ sql: 'slug = any($1::text[])', params: [candidate.aliases] });
  if (columns.has('id')) predicates.push({ sql: 'id = $1::uuid', params: [candidate.expectedClientId] });
  if (columns.has('name')) predicates.push({ sql: 'lower(name) = lower($1)', params: [candidate.name] });

  for (const predicate of predicates) {
    const result = await maybeQuery(
      db.client,
      `select id, tenant_key, slug, name from clients where ${predicate.sql} order by created_at nulls last limit 1`,
      predicate.params,
    );
    if (result?.rows[0]?.id) return result.rows[0];
  }
  return null;
}

async function main() {
  const connectionString = process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL or ABARVA_AZURE_DATABASE_URL required');

  const pg = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  const db = new Db(pg);

  try {
    const clients = [];
    for (const candidate of CLIENTS) {
      const client = await resolveClient(db, candidate);
      const clientId = client?.id ?? null;
      const tenantCounts = {};
      for (const table of TENANT_TABLES) tenantCounts[table] = await db.countByTenant(table, candidate.aliases);
      const clientCounts = {};
      for (const table of CLIENT_TABLES) clientCounts[table] = clientId ? await db.countByClient(table, clientId) : null;
      clients.push({
        key: candidate.key,
        name: candidate.name,
        aliases: candidate.aliases,
        expected_client_id: candidate.expectedClientId,
        client,
        tenant_counts: tenantCounts,
        client_counts: clientCounts,
        chunk_embedding_status: await db.chunkEmbeddingStatus(candidate.aliases),
      });
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          verified_at: new Date().toISOString(),
          clients,
        },
        null,
        2,
      ),
    );
  } finally {
    await pg.end();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
