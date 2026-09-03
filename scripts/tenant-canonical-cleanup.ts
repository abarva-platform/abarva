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
  relationKind: string;
  alias: string;
  canonical: string;
  storedAliasValues: string[];
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

type ProofUploadResult =
  | {
      uploaded: true;
      account: string;
      container: string;
      reportBlob: string;
      manifestBlob: string;
    }
  | {
      uploaded: false;
      reason: string;
    };

type EvidenceWriteResult = {
  reportPath: string;
  manifestPath: string;
  reportSha256: string;
  proofUpload: ProofUploadResult;
};

type TenantColumn = {
  schema: string;
  table: string;
  column: string;
  relationKind: string;
};

type UniqueKey = {
  indexName: string;
  columns: string[];
};

type TriggerOverride = {
  updateTrigger: string;
  deleteTrigger: string;
};

type RuntimeTrigger = {
  schema: string;
  table: string;
  trigger: string;
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
const STATEMENT_TIMEOUT_MS = Number.parseInt(process.env.TENANT_CLEANUP_STATEMENT_TIMEOUT_MS ?? '60000', 10);
const PROOF_BLOB_ACCOUNT =
  envValue('TENANT_CLEANUP_PROOF_BLOB_ACCOUNT') ??
  envValue('DATA_PLANE_OBJECT_STORE_ACCOUNT') ??
  envValue('AZURE_OBJECT_STORAGE_ACCOUNT_NAME') ??
  envValue('AZURE_STORAGE_ACCOUNT_NAME');
const PROOF_BLOB_CONTAINER =
  envValue('TENANT_CLEANUP_PROOF_BLOB_CONTAINER') ??
  envValue('DATA_PLANE_OBJECT_STORE_CONTAINER') ??
  envValue('AZURE_OBJECT_STORAGE_CONTAINER');
const PROOF_BLOB_PREFIX = normalizeBlobPrefix(
  envValue('TENANT_CLEANUP_PROOF_BLOB_PREFIX') ?? 'operator-proof/tenant-canonical-cleanup',
);
const PROOF_MANAGED_IDENTITY_CLIENT_ID =
  envValue('TENANT_CLEANUP_PROOF_AZURE_CLIENT_ID') ??
  envValue('AZURE_STORAGE_AAD_CLIENT_ID') ??
  envValue('AZURE_CLIENT_ID');

const uniqueKeyCache = new Map<string, UniqueKey[]>();
const MAINTENANCE_TRIGGER_OVERRIDES = new Map<string, TriggerOverride>([
  [
    'public.responsible_ai_acknowledgments',
    {
      updateTrigger: 'responsible_ai_acknowledgments_no_update',
      deleteTrigger: 'responsible_ai_acknowledgments_no_delete',
    },
  ],
  [
    'public.responsible_ai_training_completions',
    {
      updateTrigger: 'responsible_ai_training_completions_no_update',
      deleteTrigger: 'responsible_ai_training_completions_no_delete',
    },
  ],
  [
    'public.responsible_ai_system_role_acknowledgments',
    {
      updateTrigger: 'system_role_acknowledgments_no_update',
      deleteTrigger: 'system_role_acknowledgments_no_delete',
    },
  ],
]);

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-');
}

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function normalizeBlobPrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '');
  if (!normalized || normalized.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe TENANT_CLEANUP_PROOF_BLOB_PREFIX: ${value}`);
  }
  return normalized;
}

function requireDurableProofConfig(): void {
  if (!APPLY) return;
  if (!PROOF_BLOB_ACCOUNT || !PROOF_BLOB_CONTAINER) {
    throw new Error(
      'Apply mode requires durable proof storage. Set TENANT_CLEANUP_PROOF_BLOB_ACCOUNT and TENANT_CLEANUP_PROOF_BLOB_CONTAINER, or the DATA_PLANE_OBJECT_STORE equivalents.',
    );
  }
  if (!PROOF_MANAGED_IDENTITY_CLIENT_ID && !process.env.AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error(
      'Apply mode requires a proof storage credential. Set TENANT_CLEANUP_PROOF_AZURE_CLIENT_ID/AZURE_CLIENT_ID or AZURE_STORAGE_CONNECTION_STRING.',
    );
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function qualifiedTable(column: TenantColumn): string {
  return `${quoteIdentifier(column.schema)}.${quoteIdentifier(column.table)}`;
}

function relationMutationOrder(column: TenantColumn): number {
  if (column.relationKind === 'r' || column.relationKind === 'p' || column.relationKind === 'f') return 0;
  if (column.relationKind === 'm') return 1;
  return 2;
}

function isOrdinaryView(column: TenantColumn): boolean {
  return column.relationKind === 'v';
}

function isMaterializedView(column: TenantColumn): boolean {
  return column.relationKind === 'm';
}

function materializedViewKey(column: TenantColumn): string {
  return `${column.schema}.${column.table}`;
}

function triggerOverrideFor(column: TenantColumn): TriggerOverride | undefined {
  return MAINTENANCE_TRIGGER_OVERRIDES.get(`${column.schema}.${column.table}`);
}

async function setMaintenanceTriggers(
  client: Client,
  column: TenantColumn,
  enabled: boolean,
): Promise<void> {
  const override = triggerOverrideFor(column);
  if (!override) return;
  const action = enabled ? 'ENABLE' : 'DISABLE';
  console.log(
    `tenant-canonical-cleanup: ${action.toLowerCase()}_maintenance_triggers=${column.schema}.${column.table}`,
  );
  await client.query(
    `ALTER TABLE ${qualifiedTable(column)}
       ${action} TRIGGER ${quoteIdentifier(override.updateTrigger)}`,
  );
  await client.query(
    `ALTER TABLE ${qualifiedTable(column)}
       ${action} TRIGGER ${quoteIdentifier(override.deleteTrigger)}`,
  );
}

async function discoverSemantic2InvalidationTriggers(client: Client): Promise<RuntimeTrigger[]> {
  const result = await client.query<RuntimeTrigger>(
    `SELECT namespace.nspname AS schema,
            relation.relname AS table,
            trigger_def.tgname AS trigger
       FROM pg_trigger trigger_def
       JOIN pg_proc procedure_def
         ON procedure_def.oid = trigger_def.tgfoid
       JOIN pg_class relation
         ON relation.oid = trigger_def.tgrelid
       JOIN pg_namespace namespace
         ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = 'public'
        AND procedure_def.proname = 'semantic2_mark_dossiers_invalidated'
        AND NOT trigger_def.tgisinternal
      ORDER BY namespace.nspname, relation.relname, trigger_def.tgname`,
  );
  return result.rows;
}

async function setRuntimeTriggers(
  client: Client,
  triggers: readonly RuntimeTrigger[],
  enabled: boolean,
): Promise<void> {
  const action = enabled ? 'ENABLE' : 'DISABLE';
  for (const trigger of triggers) {
    console.log(
      `tenant-canonical-cleanup: ${action.toLowerCase()}_runtime_trigger=${trigger.schema}.${trigger.table}.${trigger.trigger}`,
    );
    await client.query(
      `ALTER TABLE ${quoteIdentifier(trigger.schema)}.${quoteIdentifier(trigger.table)}
         ${action} TRIGGER ${quoteIdentifier(trigger.trigger)}`,
    );
  }
}

async function writeJson(filePath: string, value: unknown): Promise<string> {
  const body = jsonBody(value);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body);
  return crypto.createHash('sha256').update(body).digest('hex');
}

function jsonBody(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildManifest(report: CleanupReport, digest: string): string {
  return [
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
}

async function writeManifest(report: CleanupReport, digest: string): Promise<string> {
  const manifestPath = path.join(OUT_DIR, 'MANIFEST.md');
  await fs.writeFile(manifestPath, buildManifest(report, digest));
  return manifestPath;
}

async function uploadProofBundle(report: CleanupReport, digest: string): Promise<ProofUploadResult> {
  if (!PROOF_BLOB_ACCOUNT || !PROOF_BLOB_CONTAINER) {
    return { uploaded: false, reason: 'proof blob storage is not configured' };
  }

  try {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const service = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim()
      ? BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
      : new BlobServiceClient(
          `https://${PROOF_BLOB_ACCOUNT}.blob.core.windows.net`,
          new DefaultAzureCredential(
            PROOF_MANAGED_IDENTITY_CLIENT_ID
              ? { managedIdentityClientId: PROOF_MANAGED_IDENTITY_CLIENT_ID }
              : undefined,
          ),
        );

    const container = service.getContainerClient(PROOF_BLOB_CONTAINER);
    const blobRoot = `${PROOF_BLOB_PREFIX}/${report.mode}/${STAMP}`;
    const reportBlob = `${blobRoot}/tenant-canonical-cleanup-report.json`;
    const manifestBlob = `${blobRoot}/MANIFEST.md`;
    const metadata = {
      mode: report.mode,
      report_sha256: digest,
      active_columns: String(report.activeColumnsAudited),
      alias_rows: String(report.totalAliasRows),
      duplicate_alias_rows: String(report.totalDuplicateAliasRows),
    };

    await container.getBlockBlobClient(reportBlob).uploadData(Buffer.from(jsonBody(report)), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
      metadata,
    });
    await container.getBlockBlobClient(manifestBlob).uploadData(Buffer.from(buildManifest(report, digest)), {
      blobHTTPHeaders: { blobContentType: 'text/markdown; charset=utf-8' },
      metadata,
    });

    return {
      uploaded: true,
      account: PROOF_BLOB_ACCOUNT,
      container: PROOF_BLOB_CONTAINER,
      reportBlob,
      manifestBlob,
    };
  } catch (error) {
    return {
      uploaded: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function writeCleanupEvidence(report: CleanupReport): Promise<EvidenceWriteResult> {
  const reportPath = path.join(OUT_DIR, 'tenant-canonical-cleanup-report.json');
  const reportSha256 = await writeJson(reportPath, report);
  const manifestPath = await writeManifest(report, reportSha256);
  const proofUpload = await uploadProofBundle(report, reportSha256);
  if (APPLY && !proofUpload.uploaded) {
    throw new Error(`Apply mode requires durable proof upload before commit: ${proofUpload.reason}`);
  }

  console.log(
    JSON.stringify({
      structured_event: 'tenant_canonical_cleanup_evidence',
      mode: report.mode,
      report_sha256: reportSha256,
      local_report: reportPath,
      blob: proofUpload,
      totals: {
        active_columns: report.activeColumnsAudited,
        alias_rows: report.totalAliasRows,
        duplicate_alias_rows: report.totalDuplicateAliasRows,
      },
    }),
  );

  return {
    reportPath,
    manifestPath,
    reportSha256,
    proofUpload,
  };
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

function aliasValuesWhereClause(column: TenantColumn): string {
  return `alias_row.${quoteIdentifier(column.column)} = ANY($1::text[])`;
}

function duplicateVictimSelects(column: TenantColumn, uniqueKeys: UniqueKey[]): string[] {
  const tenantColumn = quoteIdentifier(column.column);
  const tableName = qualifiedTable(column);

  return uniqueKeys.flatMap((key) => {
    const otherColumns = key.columns.filter((uniqueColumn) => uniqueColumn !== column.column);
    const partitionBy =
      otherColumns.length > 0
        ? otherColumns.map((uniqueColumn) => `alias_row.${quoteIdentifier(uniqueColumn)}`).join(', ')
        : '1';
    const nonNullFilter =
      otherColumns.length > 0
        ? ` AND ${otherColumns
            .map((uniqueColumn) => `alias_row.${quoteIdentifier(uniqueColumn)} IS NOT NULL`)
            .join(' AND ')}`
        : '';
    const comparisons =
      otherColumns.length > 0
        ? otherColumns
            .map((uniqueColumn) => {
              const quoted = quoteIdentifier(uniqueColumn);
              return `canonical_row.${quoted} = alias_row.${quoted}`;
            })
            .join(' AND ')
        : 'true';

    return [
      `SELECT alias_row.ctid
         FROM ${tableName} alias_row
        WHERE ${aliasValuesWhereClause(column)}
          ${nonNullFilter}
          AND EXISTS (
            SELECT 1
              FROM ${tableName} canonical_row
             WHERE canonical_row.${tenantColumn} = $2
               AND ${comparisons}
          )`,
      `SELECT ranked_alias_rows.ctid
         FROM (
           SELECT alias_row.ctid,
                  row_number() OVER (PARTITION BY ${partitionBy} ORDER BY alias_row.ctid) AS alias_rank
             FROM ${tableName} alias_row
            WHERE ${aliasValuesWhereClause(column)}
              ${nonNullFilter}
         ) ranked_alias_rows
        WHERE ranked_alias_rows.alias_rank > 1`,
    ];
  });
}

function duplicateVictimCte(column: TenantColumn, uniqueKeys: UniqueKey[]): string | null {
  const victimSelects = duplicateVictimSelects(column, uniqueKeys);
  if (victimSelects.length === 0) return null;
  return `WITH victim_rows AS (
    ${victimSelects.join('\nUNION ALL\n')}
  )`;
}

function isRelationshipTenantColumn(column: TenantColumn): boolean {
  return (
    column.schema === 'public' &&
    column.table === 'enterprise_context_relationships' &&
    column.column === 'tenant_key'
  );
}

async function countRelationshipAliasCollisionRows(
  client: Client,
  alias: string,
  canonical: string,
): Promise<number> {
  const result = await client.query<{ count: string }>(
    `WITH alias_groups AS (
       SELECT alias_row."relationship_key",
              COUNT(*)::integer AS alias_count
         FROM public.enterprise_context_relationships alias_row
        WHERE lower(replace(alias_row."tenant_key"::text, '_', '-')) = $1
        GROUP BY alias_row."relationship_key"
     ),
     canonical_keys AS (
       SELECT DISTINCT canonical_row."relationship_key",
              true AS canonical_exists
         FROM public.enterprise_context_relationships canonical_row
        WHERE canonical_row."tenant_key" = $2
     ),
     collision_groups AS (
       SELECT alias_groups.alias_count,
              COALESCE(canonical_keys.canonical_exists, false) AS canonical_exists
         FROM alias_groups
         LEFT JOIN canonical_keys
           ON canonical_keys."relationship_key" IS NOT DISTINCT FROM alias_groups."relationship_key"
     )
     SELECT COALESCE(
              SUM(
                CASE
                  WHEN canonical_exists THEN alias_count
                  WHEN alias_count > 1 THEN alias_count - 1
                  ELSE 0
                END
              ),
              0
            )::text AS count
       FROM collision_groups`,
    [alias, canonical],
  );
  return Number.parseInt(result.rows[0]?.count ?? '0', 10);
}

async function deleteRelationshipAliasCollisionRows(
  client: Client,
  alias: string,
  canonical: string,
): Promise<number> {
  const result = await client.query(
    `WITH alias_groups AS (
       SELECT alias_row."relationship_key",
              COUNT(*)::integer AS alias_count
         FROM public.enterprise_context_relationships alias_row
        WHERE lower(replace(alias_row."tenant_key"::text, '_', '-')) = $1
        GROUP BY alias_row."relationship_key"
     ),
     canonical_keys AS (
       SELECT DISTINCT canonical_row."relationship_key",
              true AS canonical_exists
         FROM public.enterprise_context_relationships canonical_row
        WHERE canonical_row."tenant_key" = $2
     ),
     collision_groups AS (
       SELECT alias_groups."relationship_key",
              alias_groups.alias_count,
              COALESCE(canonical_keys.canonical_exists, false) AS canonical_exists
         FROM alias_groups
         LEFT JOIN canonical_keys
           ON canonical_keys."relationship_key" IS NOT DISTINCT FROM alias_groups."relationship_key"
     ),
     ranked_alias_rows AS (
       SELECT alias_row.ctid,
              alias_row."relationship_key",
              row_number() OVER (PARTITION BY alias_row."relationship_key" ORDER BY alias_row.ctid) AS alias_rank
         FROM public.enterprise_context_relationships alias_row
        WHERE lower(replace(alias_row."tenant_key"::text, '_', '-')) = $1
     ),
     victim_rows AS (
       SELECT ranked_alias_rows.ctid
         FROM ranked_alias_rows
         JOIN collision_groups
           ON collision_groups."relationship_key" IS NOT DISTINCT FROM ranked_alias_rows."relationship_key"
        WHERE collision_groups.canonical_exists OR ranked_alias_rows.alias_rank > 1
     )
     DELETE FROM public.enterprise_context_relationships target
      USING victim_rows
      WHERE target.ctid = victim_rows.ctid`,
    [alias, canonical],
  );
  return result.rowCount ?? 0;
}

async function countDuplicateAliasRows(
  client: Client,
  column: TenantColumn,
  alias: string,
  canonical: string,
  storedAliasValues: readonly string[],
): Promise<number> {
  if (isRelationshipTenantColumn(column)) {
    return countRelationshipAliasCollisionRows(client, alias, canonical);
  }

  const uniqueKeys = await discoverUniqueKeys(client, column);
  const victimCte = duplicateVictimCte(column, uniqueKeys);
  if (!victimCte) return 0;

  const result = await client.query<{ count: string }>(
    `${victimCte}
     SELECT COUNT(DISTINCT ctid)::text AS count
       FROM victim_rows`,
    [storedAliasValues, canonical],
  );
  return Number.parseInt(result.rows[0]?.count ?? '0', 10);
}

async function deleteDuplicateAliasRows(
  client: Client,
  column: TenantColumn,
  alias: string,
  canonical: string,
  storedAliasValues: readonly string[],
): Promise<number> {
  if (isRelationshipTenantColumn(column)) {
    return deleteRelationshipAliasCollisionRows(client, alias, canonical);
  }

  const uniqueKeys = await discoverUniqueKeys(client, column);
  const victimCte = duplicateVictimCte(column, uniqueKeys);
  if (!victimCte) return 0;

  const result = await client.query(
    `${victimCte}
     DELETE FROM ${qualifiedTable(column)} target
      USING victim_rows
      WHERE target.ctid = victim_rows.ctid`,
    [storedAliasValues, canonical],
  );
  return result.rowCount ?? 0;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  requireDurableProofConfig();

  const aliasEntries: Array<readonly [string, string]> = Object.entries(TENANT_KEY_ALIASES)
    .map(([alias, canonical]) => [normalizeAlias(alias), String(canonical)] as const)
    .filter(([alias, canonical]) => alias !== normalizeAlias(canonical));

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  if (Number.isFinite(STATEMENT_TIMEOUT_MS) && STATEMENT_TIMEOUT_MS > 0) {
    await client.query(`SET statement_timeout = ${Math.trunc(STATEMENT_TIMEOUT_MS)}`);
  }

  const rows: CleanupRow[] = [];
  const materializedViewsToRefresh = new Map<string, TenantColumn>();
  const affectedCanonicalTenants = new Set<string>();
  const columns = (await discoverTenantColumns(client)).sort((left, right) => {
    const orderDelta = relationMutationOrder(left) - relationMutationOrder(right);
    if (orderDelta !== 0) return orderDelta;
    return `${left.schema}.${left.table}.${left.column}`.localeCompare(`${right.schema}.${right.table}.${right.column}`);
  });
  let report: CleanupReport | null = null;
  let evidence: EvidenceWriteResult | null = null;

  try {
    await client.query('BEGIN');
    const semantic2InvalidationTriggers = APPLY ? await discoverSemantic2InvalidationTriggers(client) : [];
    if (semantic2InvalidationTriggers.length > 0) {
      console.log(`tenant-canonical-cleanup: semantic2_invalidation_triggers=${semantic2InvalidationTriggers.length}`);
      await setRuntimeTriggers(client, semantic2InvalidationTriggers, false);
    }

    for (const [columnIndex, column] of columns.entries()) {
      console.log(
        `tenant-canonical-cleanup: scan_column=${columnIndex + 1}/${columns.length} ${column.schema}.${column.table}.${column.column}`,
      );
      for (const [alias, canonical] of aliasEntries) {
        const countResult = await client.query<{ value: string | null; count: string }>(
          `SELECT "${column.column}"::text AS value,
                  COUNT(*)::text AS count
             FROM "${column.schema}"."${column.table}"
            WHERE lower(replace("${column.column}"::text, '_', '-')) = $1
            GROUP BY "${column.column}"::text`,
          [alias],
        );
	        const count = countResult.rows.reduce((sum, row) => sum + Number.parseInt(row.count ?? '0', 10), 0);
	        if (count === 0) continue;
	        const storedAliasValues = countResult.rows
	          .map((row) => row.value)
	          .filter((value): value is string => Boolean(value));
	        console.log(
	          `tenant-canonical-cleanup: alias_rows ${column.schema}.${column.table}.${column.column} alias=${alias} canonical=${canonical} count=${count}`,
	        );
	        const shouldMutateColumn = !isOrdinaryView(column) && !isMaterializedView(column);
	        const duplicateRows = shouldMutateColumn
	          ? await countDuplicateAliasRows(client, column, alias, canonical, storedAliasValues)
	          : 0;
	        if (duplicateRows > 0) {
	          console.log(
	            `tenant-canonical-cleanup: duplicate_alias_rows ${column.schema}.${column.table}.${column.column} alias=${alias} canonical=${canonical} count=${duplicateRows}`,
	          );
	        }

	        rows.push({
	          ...column,
	          alias,
	          canonical,
	          storedAliasValues,
	          count,
	          duplicateRows,
	        });

	        if (APPLY && shouldMutateColumn) {
	          affectedCanonicalTenants.add(canonical);
	          await setMaintenanceTriggers(client, column, false);
	          try {
	            await deleteDuplicateAliasRows(client, column, alias, canonical, storedAliasValues);
	            await client.query(
	              `UPDATE "${column.schema}"."${column.table}"
	                  SET "${column.column}" = $2
                WHERE lower(replace("${column.column}"::text, '_', '-')) = $1`,
              [alias, canonical],
            );
	          } finally {
	            await setMaintenanceTriggers(client, column, true);
	          }
        } else if (APPLY && isMaterializedView(column)) {
          materializedViewsToRefresh.set(materializedViewKey(column), column);
        }
      }
    }

    report = {
      generatedAt: NOW,
      mode: APPLY ? 'apply' : 'dry-run',
      activeColumnsAudited: columns.length,
      totalAliasRows: rows.reduce((sum, row) => sum + row.count, 0),
      totalDuplicateAliasRows: rows.reduce((sum, row) => sum + row.duplicateRows, 0),
      rows,
    };
    evidence = await writeCleanupEvidence(report);

    if (APPLY) {
      for (const materializedView of materializedViewsToRefresh.values()) {
        console.log(`tenant-canonical-cleanup: refresh_materialized_view=${materializedView.schema}.${materializedView.table}`);
        await client.query(`REFRESH MATERIALIZED VIEW ${qualifiedTable(materializedView)}`);
      }
      if (affectedCanonicalTenants.size > 0) {
        const affectedTenants = Array.from(affectedCanonicalTenants).sort();
        console.log(`tenant-canonical-cleanup: invalidate_semantic2_dossiers=${affectedTenants.join(',')}`);
        await client.query(
          `UPDATE public.semantic2_dossiers
              SET invalidated_at = now(),
                  updated_at = now()
            WHERE tenant_key = ANY($1::text[])`,
          [affectedTenants],
        );
      }
      if (semantic2InvalidationTriggers.length > 0) {
        await setRuntimeTriggers(client, semantic2InvalidationTriggers, true);
      }
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

  if (!report || !evidence) {
    throw new Error('tenant cleanup completed without a report');
  }

  console.log(`tenant-canonical-cleanup: mode=${report.mode}`);
  console.log(`tenant-canonical-cleanup: active_columns=${report.activeColumnsAudited}`);
  console.log(`tenant-canonical-cleanup: alias_rows=${report.totalAliasRows}`);
  console.log(`tenant-canonical-cleanup: duplicate_alias_rows=${report.totalDuplicateAliasRows}`);
  console.log(`tenant-canonical-cleanup: report=${evidence.reportPath}`);
  console.log(`tenant-canonical-cleanup: report_sha256=${evidence.reportSha256}`);
  if (evidence.proofUpload.uploaded) {
    console.log(
      `tenant-canonical-cleanup: proof_blob=azblob://${evidence.proofUpload.account}/${evidence.proofUpload.container}/${evidence.proofUpload.reportBlob}`,
    );
  } else {
    console.log(`tenant-canonical-cleanup: proof_blob=not_uploaded reason=${evidence.proofUpload.reason}`);
  }
  if (!APPLY && report.totalAliasRows > 0) {
    console.log('tenant-canonical-cleanup: dry-run only. Re-run with --apply to rewrite active aliases.');
  }
}

main().catch((error) => {
  console.error('tenant-canonical-cleanup: failed');
  console.error(error);
  process.exit(1);
});
