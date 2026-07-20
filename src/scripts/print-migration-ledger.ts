import { Client } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from './postgres-client-options';
import { resolveMigrationDatabaseUrl } from './run-migrations';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

// Prints the schema_migrations ledger as JSON: the "database version" half
// of the migration audit chain (workflow run -> migration sha -> database
// version -> application revision -> ACA revision -> image digest). Read
// by the governed migration workflow after apply, not a mutating script.
async function main() {
  const url = resolveMigrationDatabaseUrl();
  if (!url) {
    console.error('x ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL required in environment');
    process.exit(1);
  }

  const client = new Client(postgresClientOptions(url, 'print-migration-ledger'));
  await client.connect();
  try {
    const { rows } = await client.query<{ name: string; sha256: string | null; applied_at: string }>(
      'SELECT name, sha256, applied_at FROM schema_migrations ORDER BY applied_at DESC, name DESC',
    );
    const payload = {
      totalApplied: rows.length,
      latest: rows[0] ?? null,
      entries: rows,
    };
    // Human-readable form first, then a single-line JSON block bounded by
    // markers. The audit-chain assembly step in the migration workflow
    // extracts the marker-bound line from the ACA job's log stream (which
    // prefixes every line with an Azure-added timestamp/stream tag) —
    // one line is far more robust to strip and parse than a pretty-printed
    // multi-line block would be.
    console.log(JSON.stringify(payload, null, 2));
    console.log('__DB_MIGRATION_LEDGER_BEGIN__');
    console.log(JSON.stringify(payload));
    console.log('__DB_MIGRATION_LEDGER_END__');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('x Failed to read the migration ledger.');
  console.error(error);
  process.exit(1);
});
