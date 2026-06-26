/**
 * Archive-first canonical tenant-key cleanup.
 *
 * Dry-run by default:
 *   npx tsx scripts/tenant-canonical-cleanup.ts
 *
 * Apply:
 *   npx tsx scripts/tenant-canonical-cleanup.ts --apply
 *
 * The script updates active runtime tenant columns from documented aliases to
 * canonical keys. It deliberately skips audit/history/log tables; those are
 * evidence, not active routing state.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

import { TENANT_KEY_ALIASES } from '../src/lib/tenant-keys';
import { discoverTenantColumns } from './verify-tenant-key-canonical';

loadEnv({ path: '/Users/anand/Projects/nexus/.env.local', quiet: true });
loadEnv({ path: '/Users/anand/Projects/nexus/.env', quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env'), quiet: true });

type CleanupRow = {
  schema: string;
  table: string;
  column: string;
  alias: string;
  canonical: string;
  count: number;
};

type CleanupReport = {
  generatedAt: string;
  mode: 'dry-run' | 'apply';
  activeColumnsAudited: number;
  totalAliasRows: number;
  rows: CleanupRow[];
};

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');
const NOW = new Date().toISOString();
const STAMP = NOW.replace(/[:.]/g, '-');
const OUT_ROOT = process.env.TENANT_CLEANUP_OUT_DIR?.trim()
  ? path.resolve(process.env.TENANT_CLEANUP_OUT_DIR)
  : path.join(ROOT, 'verification/tenant-canonical-cleanup');
const OUT_DIR = path.join(OUT_ROOT, STAMP);

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-');
}

async function writeJson(filePath: string, value: unknown): Promise<string> {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body);
  return crypto.createHash('sha256').update(body).digest('hex');
}

async function writeManifest(report: CleanupReport, digest: string): Promise<void> {
  const manifest = [
    '# Tenant Canonical Cleanup Manifest',
    '',
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Active columns audited: ${report.activeColumnsAudited}`,
    `Alias rows found: ${report.totalAliasRows}`,
    `Report SHA-256: \`${digest}\``,
    '',
    '| Table | Column | Alias | Canonical | Rows |',
    '|---|---|---|---|---:|',
    ...report.rows.map((row) =>
      `| ${row.schema}.${row.table} | ${row.column} | ${row.alias} | ${row.canonical} | ${row.count} |`,
    ),
    '',
  ].join('\n');
  await fs.writeFile(path.join(OUT_DIR, 'MANIFEST.md'), manifest);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  const aliasEntries: Array<readonly [string, string]> = Object.entries(TENANT_KEY_ALIASES)
    .map(([alias, canonical]) => [normalizeAlias(alias), String(canonical)] as const)
    .filter(([alias, canonical]) => alias !== normalizeAlias(canonical));

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const rows: CleanupRow[] = [];
  const columns = await discoverTenantColumns(client);

  try {
    await client.query('BEGIN');

    for (const column of columns) {
      for (const [alias, canonical] of aliasEntries) {
        const countResult = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
             FROM "${column.schema}"."${column.table}"
            WHERE lower(replace("${column.column}"::text, '_', '-')) = $1`,
          [alias],
        );
        const count = Number.parseInt(countResult.rows[0]?.count ?? '0', 10);
        if (count === 0) continue;

        rows.push({
          ...column,
          alias,
          canonical,
          count,
        });

        if (APPLY) {
          await client.query(
            `UPDATE "${column.schema}"."${column.table}"
                SET "${column.column}" = $2
              WHERE lower(replace("${column.column}"::text, '_', '-')) = $1`,
            [alias, canonical],
          );
        }
      }
    }

    if (APPLY) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }

  const report: CleanupReport = {
    generatedAt: NOW,
    mode: APPLY ? 'apply' : 'dry-run',
    activeColumnsAudited: columns.length,
    totalAliasRows: rows.reduce((sum, row) => sum + row.count, 0),
    rows,
  };

  const reportPath = path.join(OUT_DIR, 'tenant-canonical-cleanup-report.json');
  const digest = await writeJson(reportPath, report);
  await writeManifest(report, digest);

  console.log(`tenant-canonical-cleanup: mode=${report.mode}`);
  console.log(`tenant-canonical-cleanup: active_columns=${report.activeColumnsAudited}`);
  console.log(`tenant-canonical-cleanup: alias_rows=${report.totalAliasRows}`);
  console.log(`tenant-canonical-cleanup: report=${reportPath}`);
  if (!APPLY && report.totalAliasRows > 0) {
    console.log('tenant-canonical-cleanup: dry-run only. Re-run with --apply to rewrite active aliases.');
  }
}

main().catch((error) => {
  console.error('tenant-canonical-cleanup: failed');
  console.error(error);
  process.exit(1);
});
