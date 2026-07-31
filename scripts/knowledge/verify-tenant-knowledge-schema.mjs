#!/usr/bin/env node
import { Client } from 'pg';

// Tenant-agnostic readback for the real Foundation V2 knowledge-pipeline schema
// (supabase/migrations/20260729015000_knowledge_publication_consumption_phase3c2e.sql),
// not the isolated golden-slice fixture schema under scripts/foundation-v2/.
// Reads whatever DATABASE_URL points at — one dedicated tenant Postgres server,
// or the shared control-plane database — and reports real catalog state.
// Never trusts a migration runner's own exit code; this is the independent check.

const EXPECTED_SCHEMAS = [
  'source_registry',
  'evidence',
  'working',
  'knowledge',
  'metrics',
  'governance',
  'publication',
  'consumption',
  'audit',
  'operations',
];

const REPRESENTATIVE_TABLES = [
  'source_registry.source',
  'source_registry.source_version',
  'evidence.evidence_item',
  'working.entity_candidate',
  'working.fact_candidate',
  'working.relationship_candidate',
  'working.quarantine_item',
  'knowledge.entity',
  'knowledge.fact_assertion',
  'knowledge.relationship_assertion',
  'governance.review_decision',
  'governance.review_policy',
  'governance.review_batch',
  'publication.domain_publication',
  'publication.knowledge_baseline',
  'publication.projection_version',
  'audit.lineage_event',
  'metrics.metric_definition',
  'operations.run',
];

function shouldDisablePostgresSsl(connectionString) {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

async function scalar(client, sql, params = []) {
  const result = await client.query(sql, params);
  return Object.values(result.rows[0] ?? {})[0];
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('x DATABASE_URL is required.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    application_name: 'verify-tenant-knowledge-schema',
    ssl: shouldDisablePostgresSsl(url) ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const report = {
      tool: 'verify-tenant-knowledge-schema',
      checkedAt: new Date().toISOString(),
      schemas: {},
      tables: {},
      rlsEnabledTables: [],
      migrationLedgerCount: null,
      migrationLedgerNames: [],
    };

    for (const schema of EXPECTED_SCHEMAS) {
      report.schemas[schema] = await scalar(
        client,
        'select exists(select 1 from information_schema.schemata where schema_name = $1)',
        [schema],
      );
    }

    for (const qualified of REPRESENTATIVE_TABLES) {
      const [schema, table] = qualified.split('.');
      report.tables[qualified] = await scalar(
        client,
        'select exists(select 1 from information_schema.tables where table_schema = $1 and table_name = $2)',
        [schema, table],
      );
    }

    const rlsRows = await client.query(
      `select n.nspname as schema, c.relname as table
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where c.relrowsecurity = true and n.nspname = any($1)
       order by 1, 2`,
      [EXPECTED_SCHEMAS],
    );
    report.rlsEnabledTables = rlsRows.rows.map((r) => `${r.schema}.${r.table}`);

    const hasLedger = await scalar(
      client,
      "select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'schema_migrations')",
    );
    if (hasLedger) {
      report.migrationLedgerCount = await scalar(client, 'select count(*)::int from schema_migrations');
      const names = await client.query('select name from schema_migrations order by name');
      report.migrationLedgerNames = names.rows.map((r) => r.name);
    }

    report.allExpectedSchemasPresent = EXPECTED_SCHEMAS.every((s) => report.schemas[s] === true);
    report.allRepresentativeTablesPresent = REPRESENTATIVE_TABLES.every((t) => report.tables[t] === true);

    console.log(JSON.stringify(report, null, 2));
    if (!report.allExpectedSchemasPresent || !report.allRepresentativeTablesPresent) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('x verify-tenant-knowledge-schema failed.');
  console.error(error);
  process.exit(1);
});
