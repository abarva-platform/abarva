import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '/Users/anand/Projects/nexus/.env.local', quiet: true });
loadEnv({ path: '/Users/anand/Projects/nexus/.env', quiet: true });

const ROOT = process.cwd();
const NOW = new Date().toISOString();
const STAMP = NOW.replace(/[:.]/g, '-');
const ARCHIVE_DIR = path.join(ROOT, 'verification/phase-0d/archives', `tenant-key-alias-cleanup-${STAMP}`);

const ALIASES = new Map([
  ['apexretail', 'apex-retail'],
  ['meridian', 'meridian-health'],
  ['arcturus', 'first-capital'],
  ['northstar-medtech', 'northstar-clinical'],
  ['northstar-clinical-tech', 'northstar-clinical'],
]);

const TABLES = [
  ['clients', 'tenant_key'],
  ['enterprise_context_chunks', 'tenant_key'],
  ['enterprise_context_chunk_queue', 'tenant_key'],
  ['enterprise_context_evidence', 'tenant_key'],
  ['enterprise_context_facts', 'tenant_key'],
  ['enterprise_context_quality_issues', 'tenant_key'],
  ['enterprise_context_records', 'tenant_key'],
  ['enterprise_context_relationships', 'tenant_key'],
  ['enterprise_context_snapshots', 'tenant_key'],
  ['enterprise_context_source_files', 'tenant_key'],
  ['enterprise_context_sources', 'tenant_key'],
  ['enterprise_context_stewardship_tasks', 'tenant_key'],
  ['enterprise_context_template_runs', 'tenant_key'],
  ['program_approval_requests', 'tenant_key'],
  ['program_attachments', 'tenant_key'],
  ['program_evidence_items', 'tenant_key'],
  ['source_artifacts', 'tenant_key'],
  ['source_event_artifact_states', 'tenant_key'],
  ['source_event_evidence_states', 'tenant_key'],
  ['source_event_gate_criterion_states', 'tenant_key'],
  ['source_event_participants', 'client_key'],
  ['source_events', 'client_key'],
  ['foundational_pattern_variants', 'tenant_key'],
];

function qident(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function writeFile(filePath, body) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body.endsWith('\n') ? body : `${body}\n`);
}

async function tableExists(client, table) {
  const result = await client.query('SELECT to_regclass($1) IS NOT NULL AS exists', [`public.${table}`]);
  return result.rows[0]?.exists === true;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const actions = [];
  try {
    await client.query('BEGIN');
    for (const [table, column] of TABLES) {
      if (!(await tableExists(client, table))) continue;
      const aliases = Array.from(ALIASES.keys());
      const before = await client.query(`
        SELECT *
        FROM public.${qident(table)}
        WHERE lower(${qident(column)}::text) = ANY($1::text[])
        ORDER BY ${qident(column)}::text
      `, [aliases]);
      if (before.rows.length === 0) continue;

      const body = `${JSON.stringify(before.rows, null, 2)}\n`;
      const archiveFile = path.join(ARCHIVE_DIR, `${table}.${column}.json`);
      await writeFile(archiveFile, body);
      const sha256 = crypto.createHash('sha256').update(body).digest('hex');

      let rows = 0;
      for (const [alias, canonical] of ALIASES.entries()) {
        const updated = await client.query(`
          UPDATE public.${qident(table)}
          SET ${qident(column)} = $2
          WHERE lower(${qident(column)}::text) = $1
        `, [alias, canonical]);
        rows += updated.rowCount ?? 0;
      }
      actions.push({
        table,
        column,
        rows,
        archive: path.relative(ROOT, archiveFile),
        sha256,
      });
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }

  const manifest = [
    '# Phase 0D Archive Manifest: Tenant-Key Alias Cleanup',
    '',
    `Generated: ${NOW}`,
    'Action: non-destructive alias rewrite to canonical tenant keys',
    '',
    '| Table | Column | Rows | Archive | SHA-256 |',
    '|---|---|---:|---|---|',
    ...actions.map((row) => `| ${row.table} | ${row.column} | ${row.rows} | ${row.archive} | \`${row.sha256}\` |`),
    '',
  ].join('\n');
  await writeFile(path.join(ARCHIVE_DIR, 'MANIFEST.md'), manifest);
  console.log(`phase0d-tenant-key-alias-cleanup: updated ${actions.reduce((sum, row) => sum + row.rows, 0)} rows`);
  console.log(`phase0d-tenant-key-alias-cleanup: archive ${path.relative(ROOT, path.join(ARCHIVE_DIR, 'MANIFEST.md'))}`);
}

main().catch((error) => {
  console.error('phase0d-tenant-key-alias-cleanup: failed');
  console.error(error);
  process.exit(1);
});
