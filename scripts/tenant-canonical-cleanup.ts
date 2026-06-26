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
  duplicateRows: number;
};

type CleanupReport = {
  generatedAt: string;
  mode: 'dry-run' | 'apply';
  activeColumnsAudited: number;
  totalAliasRows: number;
  totalDuplicateAliasRows: number;
  rows: CleanupRow[];
};

type TenantColumn = {
  schema: string;
  table: string;
  column: string;
};

type UniqueKey = {
  indexName: string;
  columns: string[];
};

const ROOT = process.cwd();
const APPLY =
  process.argv.includes('--apply') ||
  process.env.TENANT_CLEANUP_APPLY === '1' ||
  process.env.TENANT_CLEANUP_APPLY === 'true';
const NOW = new Date().toISOString();
const STAMP = NOW.replace(/[:.]/g, '-');
const OUT_ROOT = process.env.TENANT_CLEANUP_OUT_DIR?.trim()
  ? path.resolve(process.env.TENANT_CLEANUP_OUT_DIR)
  : path.join(ROOT, 'verification/tenant-canonical-cleanup');
const OUT_DIR = path.join(OUT_ROOT, STAMP);

const uniqueKeyCache = new Map<string, UniqueKey[]>();

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-');
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function qualifiedTable(column: TenantColumn): string {
  return `${quoteIdentifier(column.schema)}.${quoteIdentifier(column.table)}`;
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
    '| Table | Column | Alias | Canonical | Rows | Duplicate rows |',
    '|---|---|---|---|---:|---:|',
    ...report.rows.map((row) =>
      `| ${row.schema}.${row.table} | ${row.column} | ${row.alias} | ${row.canonical} | ${row.count} | ${row.duplicateRows} |`,
    ),
    '',
  ].join('\n');
  await fs.writeFile(path.join(OUT_DIR, 'MANIFEST.md'), manifest);
}

async function discoverUniqueKeys(client: Client, column: TenantColumn): Promise<UniqueKey[]> {
  const cacheKey = `${column.schema}.${column.table}.${column.column}`;
  const cached = uniqueKeyCache.get(cacheKey);
  if (cached) return cached;

  const result = await client.query<{ indexName: string; columns: string }>(
    `SELECT index_class.relname AS "indexName",
            string_agg(attribute.attname, ',' ORDER BY index_key.ordinality) AS columns
       FROM pg_index index_def
       JOIN pg_class table_class ON table_class.oid = index_def.indrelid
       JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace
       JOIN pg_class index_class ON index_class.oid = index_def.indexrelid
       JOIN LATERAL unnest(index_def.indkey) WITH ORDINALITY AS index_key(attnum, ordinality) ON true
       JOIN pg_attribute attribute
         ON attribute.attrelid = table_class.oid
        AND attribute.attnum = index_key.attnum
      WHERE namespace.nspname = $1
        AND table_class.relname = $2
        AND index_def.indisunique = true
        AND index_def.indpred IS NULL
      GROUP BY index_class.relname
     HAVING bool_or(attribute.attname = $3)`,
    [column.schema, column.table, column.column],
  );

  const keys = result.rows
    .map((row) => ({
      indexName: row.indexName,
      columns: row.columns.split(',').filter(Boolean),
    }))
    .filter((key) => key.columns.length > 0);
  uniqueKeyCache.set(cacheKey, keys);
  return keys;
}

function duplicateWhereClause(column: TenantColumn, uniqueKeys: UniqueKey[]): string | null {
  const tenantColumn = quoteIdentifier(column.column);
  const tableName = qualifiedTable(column);
  const clauses = uniqueKeys.map((key) => {
    const otherColumns = key.columns.filter((uniqueColumn) => uniqueColumn !== column.column);
    const comparisons =
      otherColumns.length > 0
        ? otherColumns
            .map((uniqueColumn) => {
              const quoted = quoteIdentifier(uniqueColumn);
              return `canonical_row.${quoted} IS NOT DISTINCT FROM alias_row.${quoted}`;
            })
            .join(' AND ')
        : 'true';

    return `EXISTS (
      SELECT 1
        FROM ${tableName} canonical_row
       WHERE canonical_row.${tenantColumn} = $2
         AND ${comparisons}
    )`;
  });

  if (clauses.length === 0) return null;
  return `lower(replace(alias_row.${tenantColumn}::text, '_', '-')) = $1 AND (${clauses.join(' OR ')})`;
}

async function countDuplicateAliasRows(
  client: Client,
  column: TenantColumn,
  alias: string,
  canonical: string,
): Promise<number> {
  const uniqueKeys = await discoverUniqueKeys(client, column);
  const whereClause = duplicateWhereClause(column, uniqueKeys);
  if (!whereClause) return 0;

  const result = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM ${qualifiedTable(column)} alias_row
      WHERE ${whereClause}`,
    [alias, canonical],
  );
  return Number.parseInt(result.rows[0]?.count ?? '0', 10);
}

async function deleteDuplicateAliasRows(
  client: Client,
  column: TenantColumn,
  alias: string,
  canonical: string,
): Promise<number> {
  const uniqueKeys = await discoverUniqueKeys(client, column);
  const whereClause = duplicateWhereClause(column, uniqueKeys);
  if (!whereClause) return 0;

  const result = await client.query(
    `DELETE FROM ${qualifiedTable(column)} alias_row
      WHERE ${whereClause}`,
    [alias, canonical],
  );
  return result.rowCount ?? 0;
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
	        const duplicateRows = await countDuplicateAliasRows(client, column, alias, canonical);

	        rows.push({
	          ...column,
	          alias,
	          canonical,
	          count,
	          duplicateRows,
	        });

	        if (APPLY) {
	          await deleteDuplicateAliasRows(client, column, alias, canonical);
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
	    totalDuplicateAliasRows: rows.reduce((sum, row) => sum + row.duplicateRows, 0),
	    rows,
	  };

  const reportPath = path.join(OUT_DIR, 'tenant-canonical-cleanup-report.json');
  const digest = await writeJson(reportPath, report);
  await writeManifest(report, digest);

  console.log(`tenant-canonical-cleanup: mode=${report.mode}`);
	  console.log(`tenant-canonical-cleanup: active_columns=${report.activeColumnsAudited}`);
	  console.log(`tenant-canonical-cleanup: alias_rows=${report.totalAliasRows}`);
	  console.log(`tenant-canonical-cleanup: duplicate_alias_rows=${report.totalDuplicateAliasRows}`);
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
