import { Client } from 'pg';
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from './postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

// One-command migration runner · reads all SQL files in supabase/migrations,
// tracks applied migrations in schema_migrations table, runs pending ones
// in numerical order inside transactions.
//
// Requires · ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.
// Production deploys should use an Azure/Postgres direct connection string,
// never a Supabase session-mode pooler.
//
// Usage:
//   npx tsx src/scripts/run-migrations.ts          # apply pending
//   npx tsx src/scripts/run-migrations.ts --dry    # show pending only
//   npx tsx src/scripts/run-migrations.ts --ci     # non-interactive, machine-readable summary
//   npx tsx src/scripts/run-migrations.ts --force <name>  # re-apply one
//   npx tsx src/scripts/run-migrations.ts --ci --allow-destructive
//       # controlled empty-database bootstrap only (e.g. Azure parallel-run)

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
  allowDestructive: boolean;
  forceName: string | null;
};

export function parseArgs(argv: string[]): CliFlags {
  const isDry = argv.includes('--dry');
  const isCi = argv.includes('--ci');
  const markAllApplied = argv.includes('--mark-all-applied');
  const allowDestructive = argv.includes('--allow-destructive');
  const forceIdx = argv.indexOf('--force');
  const forceName = forceIdx >= 0 ? argv[forceIdx + 1] ?? null : null;
  return { isDry, isCi, markAllApplied, allowDestructive, forceName };
}

export function resolveMigrationDatabaseUrl(
  env: Partial<Record<string, string | undefined>> = process.env,
): string | null {
  return env.ABARVA_AZURE_DATABASE_URL ?? env.AZURE_DATABASE_URL ?? env.DATABASE_URL ?? null;
}

/** SHA-256 of a migration file's exact on-disk content, hex-encoded. */
export function computeFileSha256(sql: string): string {
  return createHash('sha256').update(sql, 'utf8').digest('hex');
}

export interface AppliedMigrationRecord {
  name: string;
  sha256: string | null;
}

export interface MigrationDriftFinding {
  filename: string;
  /** The hash recorded when this migration was applied. */
  recordedSha256: string;
  /** The hash of the file's current on-disk content. */
  currentSha256: string;
}

/**
 * Compare every already-applied migration's recorded hash against its
 * current on-disk content. A mismatch means the file was edited after it
 * was applied to this database — a governed migration history must never
 * silently tolerate that, since it breaks the "what's in schema_migrations
 * is what actually ran" guarantee every later reader (including this same
 * script's own idempotency check) depends on.
 *
 * A row with `sha256: null` (applied before this column was populated, or
 * via `--mark-all-applied`) is not flagged — there is nothing to compare
 * against. A migration file that no longer exists on disk is not flagged
 * either; that is a separate, already-tolerated situation (e.g. a very old
 * migration pruned from the repo), not drift.
 */
export function findMigrationDrift(
  appliedRecords: readonly AppliedMigrationRecord[],
  readCurrentSha256: (filename: string) => string | null,
): MigrationDriftFinding[] {
  const findings: MigrationDriftFinding[] = [];
  for (const record of appliedRecords) {
    if (!record.sha256) continue;
    const currentSha256 = readCurrentSha256(record.name);
    if (currentSha256 === null) continue;
    if (currentSha256 !== record.sha256) {
      findings.push({
        filename: record.name,
        recordedSha256: record.sha256,
        currentSha256,
      });
    }
  }
  return findings;
}

// Fixed, arbitrary key for pg_advisory_lock (passed as a numeric string —
// Postgres coerces it to bigint from query-parameter context). Scopes the
// lock to "a migration apply is in progress against this database" — any
// second concurrent `run-migrations.ts --ci` (or a human running it locally
// at the same time as CI) fails fast with a clear message instead of racing.
// Value has no meaning beyond being a stable constant unique to this script,
// and fits within int64 (max ~9.22e18).
const MIGRATION_ADVISORY_LOCK_KEY = '881200441733199010';

async function ensureTrackingTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      sha256 TEXT
    );
  `);
}

async function getAppliedMigrationRecords(client: Client): Promise<AppliedMigrationRecord[]> {
  const { rows } = await client.query<AppliedMigrationRecord>(
    'SELECT name, sha256 FROM schema_migrations',
  );
  return rows;
}

async function main() {
  const { isDry, isCi, markAllApplied, allowDestructive, forceName } = parseArgs(process.argv.slice(2));

  const url = resolveMigrationDatabaseUrl();
  if (!url) {
    console.error('✗  ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL required in environment');
    console.error('   Use the Azure/Postgres direct migration connection string for production deploys.');
    process.exit(1);
  }

  const client = new Client(postgresClientOptions(url, 'run-migrations'));
  await client.connect();
  console.log(`✓  Connected to Postgres`);

  try {
    await ensureTrackingTable(client);
    const appliedRecords = await getAppliedMigrationRecords(client);
    const applied = new Set(appliedRecords.map((r) => r.name));
    const all = listMigrationFiles();

    // Drift guard. Runs in every mode, including --dry, so CI status/preflight
    // catches a tampered already-applied migration before anyone gets to
    // --ci apply. A hash mismatch means the file changed after this exact
    // database ran it — the schema_migrations ledger is no longer a
    // trustworthy record of what SQL actually executed.
    const driftFindings = findMigrationDrift(appliedRecords, (filename) => {
      const filepath = path.join(MIGRATIONS_DIR, filename);
      try {
        return computeFileSha256(readFileSync(filepath, 'utf-8'));
      } catch {
        return null; // file no longer exists on disk — not drift, see findMigrationDrift's doc comment.
      }
    });
    if (driftFindings.length > 0) {
      console.error('\n✗  Migration drift detected — an already-applied migration file was modified.\n');
      for (const f of driftFindings) {
        console.error(`   ${f.filename}`);
        console.error(`     recorded: ${f.recordedSha256}`);
        console.error(`     current:  ${f.currentSha256}`);
      }
      console.error('\n   This database ran a different version of this file than what is on disk now.');
      console.error('   Do not edit an already-applied migration — add a new migration instead.');
      console.error('   If this drift is intentional and understood, re-record the hash with:');
      console.error('     npx tsx src/scripts/run-migrations.ts --force <name>\n');
      process.exit(1);
    }

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
    if (allFindings.length > 0 && !allowDestructive) {
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
    if (allFindings.length > 0 && allowDestructive) {
      console.warn('\n⚠  Destructive migration patterns detected but explicitly allowed for this run.');
      console.warn('   Use this only for controlled empty-database bootstrap / parallel-run migrations.\n');
      for (const f of allFindings) {
        console.warn(`   ${f.filename}:${f.line} — ${f.pattern}`);
      }
      console.warn('');
    }

    console.log(`\nPending migrations (${pending.length}):`);
    for (const f of pending) console.log(`   - ${f}`);
    if (isDry) {
      console.log('\n(--dry mode, no changes)');
      return;
    }

    // Advisory lock — only around the actual mutating apply. A second
    // concurrent apply attempt (another CI run, a human running this
    // locally at the same moment) fails fast with a clear message instead
    // of racing on the same migrations. Non-blocking (pg_try_advisory_lock):
    // we want an immediate, actionable failure, not a hung process.
    const lockResult = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [MIGRATION_ADVISORY_LOCK_KEY],
    );
    if (!lockResult.rows[0]?.locked) {
      console.error('\n✗  Another migration run holds the advisory lock on this database.');
      console.error('   Wait for it to finish, or investigate a stuck/crashed prior run.\n');
      process.exit(1);
    }

    try {
      console.log(''); // blank line
      const appliedNames: string[] = [];
      for (const filename of pending) {
        const filepath = path.join(MIGRATIONS_DIR, filename);
        const sql = readFileSync(filepath, 'utf-8');
        const sha256 = computeFileSha256(sql);
        process.stdout.write(`→ ${filename} ... `);

        try {
          // Each migration is its own transaction. If the file has its own
          // BEGIN/COMMIT, we wrap anyway — Postgres collapses nested
          // transactions via savepoints.
          await client.query('BEGIN');
          await client.query(sql);

          if (forceName) {
            await client.query(
              'INSERT INTO schema_migrations(name, sha256) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET applied_at = now(), sha256 = $2',
              [filename, sha256],
            );
          } else {
            await client.query(
              'INSERT INTO schema_migrations(name, sha256) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
              [filename, sha256],
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
      // aggregators can grep for it. (Moved inside the lock block only for
      // proximity to appliedNames — the lock is released either way below.)
      if (isCi) {
        console.log(`\n✓ Applied ${appliedNames.length} pending migration${appliedNames.length === 1 ? '' : 's'}: ${appliedNames.join(', ')}`);
      }
    } finally {
      await client
        .query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_KEY])
        .catch(() => {});
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
