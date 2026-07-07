#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const { Pool } = pg;
const databaseUrl =
  process.env.ABARVA_AZURE_DATABASE_URL ||
  process.env.AZURE_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(JSON.stringify({ ok: false, reason: 'missing_database_url' }));
  process.exit(1);
}

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260611193000_access_requests.sql');
const sql = readFileSync(migrationPath, 'utf8');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 10_000,
  application_name: 'apply-access-requests-migration',
});

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      `INSERT INTO schema_migrations(name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING`,
      ['20260611193000_access_requests.sql'],
    );
    await client.query('COMMIT');

    const result = await client.query(
      `SELECT
         current_database() AS database_name,
         to_regclass('public.access_requests') AS access_requests_table`,
    );
    console.log(
      JSON.stringify({
        ok: true,
        database: result.rows[0]?.database_name,
        table: result.rows[0]?.access_requests_table,
      }),
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(
    JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      code: error && typeof error === 'object' && 'code' in error ? error.code : null,
    }),
  );
  process.exit(1);
} finally {
  await pool.end().catch(() => undefined);
}
