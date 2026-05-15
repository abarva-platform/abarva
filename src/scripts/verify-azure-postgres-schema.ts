import { Client } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const TABLES_TO_VERIFY = [
  'clients',
  'engagements',
  'enterprise_context_chunks',
  'enterprise_graph_nodes',
  'enterprise_graph_edges',
  'source_events',
  'gate_criteria',
  'ai_initiatives_registry',
];

async function scalar<T = unknown>(client: Client, sql: string): Promise<T> {
  const result = await client.query(sql);
  return Object.values(result.rows[0] ?? {})[0] as T;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('x DATABASE_URL is required for Azure Postgres schema verification.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const summary: Record<string, unknown> = {
      migrations: await scalar<number>(client, 'select count(*)::int from schema_migrations'),
      publicTables: await scalar<number>(
        client,
        "select count(*)::int from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'",
      ),
      storageBuckets: await scalar<number>(client, 'select count(*)::int from storage.buckets'),
    };

    for (const table of TABLES_TO_VERIFY) {
      const exists = await scalar<boolean>(client, `select to_regclass('public.${table}') is not null`);
      summary[table] = exists ? await scalar<number>(client, `select count(*)::int from ${table}`) : null;
    }

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('x Azure Postgres schema verification failed.');
  console.error(error);
  process.exit(1);
});
