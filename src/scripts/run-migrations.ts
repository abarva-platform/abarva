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
//   npx tsx src/scripts/run-migrations.ts --ci     # non-interactive, machine-readable summary
//   npx tsx src/scripts/run-migrations.ts --force <name>  # re-apply one

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

// ---------------------------------------------------------------------------
// Destructive-migration safety guard.
//
// Auto-apply on Vercel prod deploys means a single bad migration can drop
// production data. We refuse to run any migration that contains destructive
// SQL unless the file explicitly opts in via a marker comment.
//
// Patterns scanned (case-insensitive, per line, with comment stripped):
//   - DROP TABLE
//   - DROP COLUMN
//   - DROP SCHEMA
//   - ALTER TABLE ... DROP
//   - TRUNCATE
//
// Patterns deliberately NOT flagged:
//   - DROP POLICY IF EXISTS / DROP TRIGGER IF EXISTS / DROP FUNCTION /
//     DROP INDEX / DROP CONSTRAINT — these are routine idempotency
//     scaffolding (see CONTRIBUTING-MIGRATIONS.md) and don't risk data loss.
//
// Opt-in marker: any of the following comments anywhere in the file will
// mark it as audited and allow it to run:
//   -- migration:destructive-allowed
//   -- migration: destructive-allowed
//   /* migration:destructive-allowed */
// ---------------------------------------------------------------------------

const DESTRUCTIVE_MARKER_REGEX =
  /(--|\/\*)\s*migration:\s*destructive-allowed/i;

const DESTRUCTIVE_PATTERNS: { name: string; regex: RegExp }[] = [
  // DROP TABLE — we deliberately do NOT match DROP TABLE inside a
  // CREATE OR REPLACE FUNCTION body, since those are common in
  // setup/teardown helpers. The line-by-line scanner below handles
  // top-level statements; embedded DROP TABLE in function bodies is an
  // accepted risk and should still carry the opt-in marker for clarity.
  { name: 'DROP TABLE', regex: /\bdrop\s+table\b/i },
  { name: 'DROP COLUMN', regex: /\bdrop\s+column\b/i },
  { name: 'DROP SCHEMA', regex: /\bdrop\s+schema\b/i },
  // ALTER TABLE ... DROP (anything: column, constraint, default, etc).
  // The shape `ALTER TABLE foo DROP` on a single line is a strong signal.
  { name: 'ALTER TABLE … DROP', regex: /\balter\s+table\b[^;]*\bdrop\b/i },
  { name: 'TRUNCATE', regex: /\btruncate\b/i },
];

type DestructiveFinding = {
  filename: string;
  pattern: string;
  line: number;
  snippet: string;
};

/**
 * Strip both `-- ...` line comments and `/* ... *\/` block comments from a
 * SQL string. Used so that destructive-pattern scanning ignores comments
 * (e.g. a comment that says "we used to DROP TABLE foo here").
 */
export function stripSqlComments(sql: string): string {
  // Block comments first (greedy across newlines).
  const noBlock = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Then line comments. Only `--` to end of line.
  return noBlock.replace(/--[^\n]*/g, '');
}

/**
 * Scan a single migration's SQL body for destructive patterns. Returns
 * findings; an empty array means the migration is safe to auto-apply.
 *
 * If the file carries the `-- migration:destructive-allowed` marker
 * comment, returns [] regardless of contents — the author has explicitly
 * audited it.
 */
export function scanForDestructivePatterns(
  filename: string,
  sql: string,
): DestructiveFinding[] {
  if (DESTRUCTIVE_MARKER_REGEX.test(sql)) return [];

  const stripped = stripSqlComments(sql);
  const findings: DestructiveFinding[] = [];
  const lines = stripped.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of DESTRUCTIVE_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push({
          filename,
          pattern: pattern.name,
          line: i + 1,
          snippet: line.trim().slice(0, 200),
        });
      }
    }
  }
  return findings;
}

export function listMigrationFiles(dir: string = MIGRATIONS_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => !f.startsWith('RUN_THIS_')) // skip manual bundles
    .sort();
}

export type CliFlags = {
  isDry: boolean;
  isCi: boolean;
  markAllApplied: boolean;
  forceName: string | null;
};

export function parseArgs(argv: string[]): CliFlags {
  const isDry = argv.includes('--dry');
  const isCi = argv.includes('--ci');
  const markAllApplied = argv.includes('--mark-all-applied');
  const forceIdx = argv.indexOf('--force');
  const forceName = forceIdx >= 0 ? argv[forceIdx + 1] ?? null : null;
  return { isDry, isCi, markAllApplied, forceName };
}

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

async function main() {
  const { isDry, isCi, markAllApplied, forceName } = parseArgs(process.argv.slice(2));

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

    // Destructive-migration safety guard. Runs in every mode (dry, ci,
    // interactive) so author gets feedback as early as possible.
    const allFindings: DestructiveFinding[] = [];
    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename);
      const sql = readFileSync(filepath, 'utf-8');
      allFindings.push(...scanForDestructivePatterns(filename, sql));
    }
    if (allFindings.length > 0) {
      console.error('\n✗  Destructive migration patterns detected (auto-apply blocked).\n');
      for (const f of allFindings) {
        console.error(`   ${f.filename}:${f.line} — ${f.pattern}`);
        console.error(`     ${f.snippet}`);
      }
      console.error('\n   Auto-apply on Vercel prod deploys refuses to run destructive');
      console.error('   migrations to prevent accidental data loss.');
      console.error('');
      console.error('   If this is intentional, add the opt-in marker as the FIRST');
      console.error('   comment line in the migration file:');
      console.error('');
      console.error('     -- migration:destructive-allowed');
      console.error('');
      console.error('   Then re-run. The marker is a deliberate audit signal — only');
      console.error('   add it after a human review of the destructive change.');
      process.exit(1);
    }

    console.log(`\nPending migrations (${pending.length}):`);
    for (const f of pending) console.log(`   - ${f}`);
    if (isDry) {
      console.log('\n(--dry mode, no changes)');
      return;
    }

    console.log(''); // blank line
    const appliedNames: string[] = [];
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
        appliedNames.push(filename);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.log('✗');
        console.error(`\n  ${err instanceof Error ? err.message : String(err)}\n`);
        console.error(`  Fix the error above, then re-run. Applied migrations are tracked; only the failed one + later ones will retry.`);
        process.exit(1);
      }
    }

    console.log(`\n✓  ${pending.length} migration${pending.length === 1 ? '' : 's'} applied.`);

    // CI mode emits a final structured summary line so build logs / CI
    // aggregators can grep for it.
    if (isCi) {
      console.log(`\n✓ Applied ${appliedNames.length} pending migration${appliedNames.length === 1 ? '' : 's'}: ${appliedNames.join(', ')}`);
    }
  } finally {
    await client.end();
  }
}

// Only auto-run when invoked as a script. Importing this module from a
// test file should NOT trigger the network/DB connection.
const invokedAsScript = (() => {
  if (!process.argv[1]) return false;
  try {
    return path.resolve(process.argv[1]).includes('run-migrations');
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}
