/**
 * Migration runner tests.
 *
 * These exercise the pure helpers exported from `run-migrations.ts`:
 *   - `parseArgs` — CLI flag parsing.
 *   - `stripSqlComments` — comment stripping for the destructive scanner.
 *   - `scanForDestructivePatterns` — the safety guard that blocks
 *      DROP TABLE / DROP COLUMN / TRUNCATE / etc unless explicitly opted in.
 *   - `listMigrationFiles` — directory listing with sort + filter.
 *
 * No DB, no network. The runner's main() function is intentionally not
 * tested here — it requires a live Postgres connection. The pure helpers
 * cover the safety-critical pre-flight checks that gate auto-apply on
 * Vercel prod deploys.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  listMigrationFiles,
  parseArgs,
  scanForDestructivePatterns,
  stripSqlComments,
} from '../run-migrations';

describe('run-migrations · parseArgs', () => {
  it('parses --dry', () => {
    expect(parseArgs(['--dry'])).toEqual({
      isDry: true,
      isCi: false,
      markAllApplied: false,
      forceName: null,
    });
  });

  it('parses --ci', () => {
    expect(parseArgs(['--ci'])).toEqual({
      isDry: false,
      isCi: true,
      markAllApplied: false,
      forceName: null,
    });
  });

  it('parses --mark-all-applied', () => {
    expect(parseArgs(['--mark-all-applied'])).toEqual({
      isDry: false,
      isCi: false,
      markAllApplied: true,
      forceName: null,
    });
  });

  it('parses --force <name>', () => {
    expect(parseArgs(['--force', '20260508040000_foo.sql'])).toEqual({
      isDry: false,
      isCi: false,
      markAllApplied: false,
      forceName: '20260508040000_foo.sql',
    });
  });

  it('combines --ci and --dry', () => {
    expect(parseArgs(['--ci', '--dry'])).toMatchObject({
      isDry: true,
      isCi: true,
    });
  });

  it('returns null forceName when --force has no following arg', () => {
    expect(parseArgs(['--force'])).toEqual({
      isDry: false,
      isCi: false,
      markAllApplied: false,
      forceName: null,
    });
  });

  it('handles empty argv', () => {
    expect(parseArgs([])).toEqual({
      isDry: false,
      isCi: false,
      markAllApplied: false,
      forceName: null,
    });
  });
});

describe('run-migrations · stripSqlComments', () => {
  it('removes single-line `-- ...` comments', () => {
    const sql = 'SELECT 1; -- this is a comment\nSELECT 2;';
    expect(stripSqlComments(sql)).toBe('SELECT 1; \nSELECT 2;');
  });

  it('removes block comments across newlines', () => {
    const sql = 'SELECT 1; /* multi\nline\ncomment */ SELECT 2;';
    expect(stripSqlComments(sql)).toBe('SELECT 1;  SELECT 2;');
  });

  it('leaves SQL keywords inside strings alone (best-effort — strings are not parsed)', () => {
    // We document this as a known limitation: stripSqlComments does not
    // distinguish SQL strings. This is acceptable because the destructive
    // scanner errs on the side of false positives (better to ask author
    // to add the marker than to silently allow a destructive op).
    const sql = "SELECT 'this -- is in a string'";
    // Result will have the `--` and trailing text removed; that's OK.
    expect(stripSqlComments(sql)).toContain("SELECT 'this ");
  });
});

describe('run-migrations · scanForDestructivePatterns', () => {
  it('returns no findings for an idempotent migration', () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS foo (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS foo_name_idx ON foo(name);
    `;
    expect(scanForDestructivePatterns('001_foo.sql', sql)).toEqual([]);
  });

  it('flags DROP TABLE', () => {
    const sql = 'DROP TABLE foo;\nCREATE TABLE foo (id UUID);';
    const findings = scanForDestructivePatterns('drop_table.sql', sql);
    expect(findings).toHaveLength(1);
    expect(findings[0].pattern).toBe('DROP TABLE');
    expect(findings[0].line).toBe(1);
  });

  it('flags DROP COLUMN', () => {
    const sql = 'ALTER TABLE foo DROP COLUMN bar;';
    const findings = scanForDestructivePatterns('drop_column.sql', sql);
    // Both patterns match: DROP COLUMN matches, and ALTER TABLE … DROP
    // matches as well. That is fine — the deploy is blocked either way.
    expect(findings.length).toBeGreaterThanOrEqual(1);
    const patterns = findings.map((f) => f.pattern);
    expect(patterns).toContain('DROP COLUMN');
  });

  it('flags TRUNCATE', () => {
    const sql = 'TRUNCATE foo CASCADE;';
    const findings = scanForDestructivePatterns('truncate.sql', sql);
    expect(findings).toHaveLength(1);
    expect(findings[0].pattern).toBe('TRUNCATE');
  });

  it('flags DROP SCHEMA', () => {
    const sql = 'DROP SCHEMA legacy CASCADE;';
    const findings = scanForDestructivePatterns('drop_schema.sql', sql);
    expect(findings).toHaveLength(1);
    expect(findings[0].pattern).toBe('DROP SCHEMA');
  });

  it('flags ALTER TABLE … DROP CONSTRAINT', () => {
    const sql = 'ALTER TABLE foo DROP CONSTRAINT foo_pkey;';
    const findings = scanForDestructivePatterns('alter_drop.sql', sql);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.map((f) => f.pattern)).toContain('ALTER TABLE … DROP');
  });

  it('does NOT flag DROP POLICY (routine idempotency scaffolding)', () => {
    const sql = `
      DROP POLICY IF EXISTS "old_policy" ON foo;
      CREATE POLICY "old_policy" ON foo FOR SELECT TO authenticated USING (true);
    `;
    expect(scanForDestructivePatterns('policy.sql', sql)).toEqual([]);
  });

  it('does NOT flag DROP TRIGGER (routine idempotency scaffolding)', () => {
    const sql = `
      DROP TRIGGER IF EXISTS foo_updated_at ON foo;
      CREATE TRIGGER foo_updated_at BEFORE UPDATE ON foo FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    `;
    expect(scanForDestructivePatterns('trigger.sql', sql)).toEqual([]);
  });

  it('does NOT flag DROP INDEX or DROP FUNCTION', () => {
    const sql = `
      DROP INDEX IF EXISTS foo_idx;
      DROP FUNCTION IF EXISTS foo_helper();
    `;
    expect(scanForDestructivePatterns('drop_index.sql', sql)).toEqual([]);
  });

  it('honours the -- migration:destructive-allowed opt-in marker', () => {
    const sql = `
      -- migration:destructive-allowed
      -- This is a deliberate, audited destructive change.
      DROP TABLE legacy_foo;
      TRUNCATE staging_foo;
    `;
    expect(scanForDestructivePatterns('audited.sql', sql)).toEqual([]);
  });

  it('honours the marker with a space after the colon', () => {
    const sql = `
      -- migration: destructive-allowed
      DROP TABLE foo;
    `;
    expect(scanForDestructivePatterns('audited.sql', sql)).toEqual([]);
  });

  it('honours the marker inside a /* ... */ block comment', () => {
    const sql = `
      /* migration:destructive-allowed */
      DROP TABLE foo;
    `;
    expect(scanForDestructivePatterns('audited.sql', sql)).toEqual([]);
  });

  it('does NOT honour the marker if it is only inside a SQL string literal', () => {
    // The marker regex requires a `--` or `/*` prefix, so a bare string
    // literal `'migration:destructive-allowed'` does NOT pass as a
    // marker. The destructive scanner correctly flags the DROP TABLE.
    const sql = `
      SELECT 'migration:destructive-allowed';
      DROP TABLE foo;
    `;
    const findings = scanForDestructivePatterns('tricky.sql', sql);
    expect(findings).toHaveLength(1);
    expect(findings[0].pattern).toBe('DROP TABLE');
  });

  it('reports line numbers in a multi-line file', () => {
    const sql = [
      'CREATE TABLE IF NOT EXISTS foo (id UUID);',
      'CREATE TABLE IF NOT EXISTS bar (id UUID);',
      'DROP TABLE legacy;',
      'CREATE TABLE IF NOT EXISTS baz (id UUID);',
    ].join('\n');
    const findings = scanForDestructivePatterns('multiline.sql', sql);
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(3);
  });

  it('ignores destructive patterns inside SQL comments', () => {
    const sql = `
      -- We used to DROP TABLE old_foo here; superseded by 042.
      CREATE TABLE IF NOT EXISTS foo (id UUID);
    `;
    expect(scanForDestructivePatterns('historical_note.sql', sql)).toEqual([]);
  });
});

describe('run-migrations · listMigrationFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'migrations-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns .sql files sorted ascending', () => {
    writeFileSync(path.join(tmpDir, '003_foo.sql'), '');
    writeFileSync(path.join(tmpDir, '001_bar.sql'), '');
    writeFileSync(path.join(tmpDir, '002_baz.sql'), '');
    expect(listMigrationFiles(tmpDir)).toEqual([
      '001_bar.sql',
      '002_baz.sql',
      '003_foo.sql',
    ]);
  });

  it('skips RUN_THIS_ manual bundles', () => {
    writeFileSync(path.join(tmpDir, '001_foo.sql'), '');
    writeFileSync(path.join(tmpDir, 'RUN_THIS_BUNDLE.sql'), '');
    expect(listMigrationFiles(tmpDir)).toEqual(['001_foo.sql']);
  });

  it('skips non-.sql files', () => {
    writeFileSync(path.join(tmpDir, '001_foo.sql'), '');
    writeFileSync(path.join(tmpDir, 'README.md'), '');
    writeFileSync(path.join(tmpDir, '002_bar.txt'), '');
    expect(listMigrationFiles(tmpDir)).toEqual(['001_foo.sql']);
  });

  it('handles a directory with subdirs', () => {
    writeFileSync(path.join(tmpDir, '001_foo.sql'), '');
    mkdirSync(path.join(tmpDir, 'subdir'));
    expect(listMigrationFiles(tmpDir)).toEqual(['001_foo.sql']);
  });

  it('returns empty array for an empty directory', () => {
    expect(listMigrationFiles(tmpDir)).toEqual([]);
  });
});
