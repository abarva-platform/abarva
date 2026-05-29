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
const OUT_DIR = path.join(ROOT, 'verification/phase-0d');
const ARCHIVE_DIR = path.join(OUT_DIR, 'archives', `northstar-canonicalization-${STAMP}`);
const OLD_KEY = 'northstar-medtech';
const NEW_KEY = 'northstar-clinical';

async function writeFile(filePath, body) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body.endsWith('\n') ? body : `${body}\n`);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('BEGIN');
    const before = await client.query(`
      SELECT *
      FROM public.enterprise_context_chunks
      WHERE tenant_key = $1
      ORDER BY chunk_id
    `, [OLD_KEY]);

    const archiveJson = path.join(ARCHIVE_DIR, 'enterprise_context_chunks.northstar-medtech.json');
    const archiveBody = `${JSON.stringify(before.rows, null, 2)}\n`;
    await writeFile(archiveJson, archiveBody);
    const sha256 = crypto.createHash('sha256').update(archiveBody).digest('hex');

    const updated = await client.query(`
      UPDATE public.enterprise_context_chunks
      SET tenant_key = $2,
          updated_at = now()
      WHERE tenant_key = $1
    `, [OLD_KEY, NEW_KEY]);

    const remaining = await client.query('SELECT COUNT(*)::int AS count FROM public.enterprise_context_chunks WHERE tenant_key = $1', [OLD_KEY]);
    const current = await client.query('SELECT COUNT(*)::int AS count FROM public.enterprise_context_chunks WHERE tenant_key = $1', [NEW_KEY]);
    if ((remaining.rows[0]?.count ?? 0) !== 0) throw new Error(`${OLD_KEY} rows remain after update`);

    await client.query('COMMIT');

    const manifest = [
      '# Phase 0D Archive Manifest: Northstar Tenant-Key Canonicalization',
      '',
      `Generated: ${NOW}`,
      `Action: non-destructive tenant_key update from ${OLD_KEY} to ${NEW_KEY}`,
      '',
      '| File | Rows | SHA-256 |',
      '|---|---:|---|',
      `| ${path.relative(ROOT, archiveJson)} | ${before.rows.length} | \`${sha256}\` |`,
      '',
      '## Verification',
      '',
      `- Rows updated: ${updated.rowCount ?? 0}`,
      `- Remaining ${OLD_KEY} rows: 0`,
      `- Current ${NEW_KEY} enterprise_context_chunks rows: ${current.rows[0]?.count ?? 0}`,
      '',
    ].join('\n');
    await writeFile(path.join(ARCHIVE_DIR, 'MANIFEST.md'), manifest);

    console.log(`phase0d-northstar-canonicalize: updated ${updated.rowCount ?? 0} rows`);
    console.log(`phase0d-northstar-canonicalize: archive ${path.relative(ROOT, path.join(ARCHIVE_DIR, 'MANIFEST.md'))}`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('phase0d-northstar-canonicalize: failed');
  console.error(error);
  process.exit(1);
});
