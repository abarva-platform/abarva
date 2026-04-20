import { Client } from 'pg';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

// One-command migration runner · reads all SQL files in supabase/migrations,
// tracks applied migrations in schema_migrations table, runs pending ones
// in numerical order inside transactions.
//
// Requires · DATABASE_URL in .env.local (Supabase → Project Settings →
// Database → Connection string → URI).
//
// Usage:
//   npx tsx src/scripts/run-migrations.ts          # apply pending
//   npx tsx src/scripts/run-migrations.ts --dry    # show pending only
//   npx tsx src/scripts/run-migrations.ts --force <name>  # re-apply one

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

async function ensureTrackingTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      sha256 TEXT
    );
  `);
}

async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
  return new Set(rows.map((r) => r.name));
}

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => !f.startsWith('RUN_THIS_')) // skip manual bundles
    .sort();
}

async function main() {
  const args = process.argv.slice(2);
  const isDry = args.includes('--dry');
  const markAllApplied = args.includes('--mark-all-applied');
  const forceIdx = args.indexOf('--force');
  const forceName = forceIdx >= 0 ? args[forceIdx + 1] : null;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('✗  DATABASE_URL required in .env.local');
    console.error('   Get it from · Supabase Dashboard → Project Settings → Database → Connection string → URI');
    console.error('   Make sure to use the "Session" mode pooler URL for migrations.');
    process.exit(1);
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log(`✓  Connected to Postgres`);

  try {
    await ensureTrackingTable(client);
    const applied = await getAppliedMigrations(client);
    const all = listMigrationFiles();

    // --mark-all-applied · sync tracking table without running any SQL.
    // For repos that have historically applied migrations via paste; tags
    // every current migration as applied. Safe (uses ON CONFLICT DO NOTHING).
    if (markAllApplied) {
      let inserted = 0;
      for (const f of all) {
        const res = await client.query(
          'INSERT INTO schema_migrations(name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [f],
        );
        if (res.rowCount && res.rowCount > 0) inserted += 1;
      }
      console.log(`✓  Marked ${all.length} migration${all.length === 1 ? '' : 's'} as applied (${inserted} new rows, ${all.length - inserted} already recorded).`);
      return;
    }

    const pending = forceName
      ? all.filter((f) => f.startsWith(forceName) || f === forceName)
      : all.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('✓  No pending migrations.');
      console.log(`   Applied: ${applied.size} / ${all.length}`);
      return;
    }

    console.log(`\nPending migrations (${pending.length}):`);
    for (const f of pending) console.log(`   - ${f}`);
    if (isDry) {
      console.log('\n(--dry mode, no changes)');
      return;
    }

    console.log(''); // blank line
    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename);
      const sql = readFileSync(filepath, 'utf-8');
      process.stdout.write(`→ ${filename} ... `);

      try {
        // Each migration is its own transaction. If the file has its own
        // BEGIN/COMMIT, we wrap anyway — Postgres collapses nested
        // transactions via savepoints.
        await client.query('BEGIN');
        await client.query(sql);

        if (forceName) {
          await client.query(
            'INSERT INTO schema_migrations(name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET applied_at = now()',
            [filename],
          );
        } else {
          await client.query(
            'INSERT INTO schema_migrations(name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
            [filename],
          );
        }
        await client.query('COMMIT');
        console.log('✓');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.log('✗');
        console.error(`\n  ${err instanceof Error ? err.message : String(err)}\n`);
        console.error(`  Fix the error above, then re-run. Applied migrations are tracked; only the failed one + later ones will retry.`);
        process.exit(1);
      }
    }

    console.log(`\n✓  ${pending.length} migration${pending.length === 1 ? '' : 's'} applied.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
