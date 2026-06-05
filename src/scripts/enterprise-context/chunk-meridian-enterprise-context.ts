import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { Pool } from 'pg';

import {
  buildMeridianEnterpriseContextIngestionPlan,
  parseMeridianEnterpriseContextDataset,
  retargetEnterpriseContextIngestionPlan,
} from '../../lib/enterprise-context/ingestion/meridian-loader';
import {
  buildEnterpriseContextChunksFromPlan,
  hashEnterpriseContextChunk,
  type EnterpriseContextChunkRow,
} from '../../lib/enterprise-context/chunking';
import { runtimePostgresPoolConfig } from '../../lib/data-plane/postgresCompat';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

type Args = {
  apply: boolean;
  sourceRoot: string;
  tenantKey: string;
  schema: string | null;
};

type DbRow = Record<string, unknown>;

const DEFAULT_SOURCE_ROOT = path.resolve(process.cwd(), 'docs/enterprise-context/synthetic/meridian');
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function parseArgs(): Args {
  const sourceArg = process.argv.find((arg) => arg.startsWith('--source='));
  const tenantArg = process.argv.find((arg) => arg.startsWith('--tenant='));
  const schemaArg = process.argv.find((arg) => arg.startsWith('--schema='));
  return {
    apply: process.argv.includes('--apply'),
    sourceRoot: sourceArg ? path.resolve(sourceArg.split('=')[1] ?? '') : DEFAULT_SOURCE_ROOT,
    tenantKey: tenantArg?.split('=')[1]?.trim() || 'meridian',
    schema: schemaArg?.split('=')[1]?.trim() || null,
  };
}

function getClient(schemaName: string | null): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to apply enterprise context chunks.');
  }
  const client = createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return schemaName ? client.schema(schemaName) as unknown as SupabaseClient : client;
}

async function ensureMeridianClientId(): Promise<string> {
  const client = getClient(null);
  const existing = await client
    .from('clients')
    .select('id')
    .or('tenant_key.eq.meridian-health,tenant_key.eq.meridian,name.eq.Meridian Health,name.eq.Meridian Health System,legal_name.eq.Meridian Health System')
    .limit(1)
    .maybeSingle();
  if (existing.error) throw new Error(`Meridian client lookup failed: ${existing.error.message}`);
  if (existing.data?.id) {
    const normalized = await client
      .from('clients')
      .update({
        name: 'Meridian Health System',
        legal_name: 'Meridian Health System',
        industry_code: 'healthcare_provider',
        slug: 'meridian-health',
        tenant_key: 'meridian-health',
      })
      .eq('id', existing.data.id as string);
    if (normalized.error) throw new Error(`Meridian client normalize failed: ${normalized.error.message}`);
    return existing.data.id as string;
  }

  const inserted = await client
    .from('clients')
    .insert({
      name: 'Meridian Health System',
      legal_name: 'Meridian Health System',
      industry_code: 'healthcare_provider',
      slug: 'meridian-health',
      tenant_key: 'meridian-health',
    })
    .select('id')
    .single();
  if (inserted.error) throw new Error(`Meridian client insert failed: ${inserted.error.message}`);
  return inserted.data.id as string;
}

async function upsertBatch(client: SupabaseClient, table: string, rows: DbRow[], onConflict: string): Promise<number> {
  const batchSize = 250;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  return rows.length;
}

function quoteIdent(identifier: string): string {
  if (!IDENTIFIER_RE.test(identifier)) throw new Error(`unsafe_identifier:${identifier}`);
  return `"${identifier}"`;
}

function getPostgresPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('DATABASE_URL is required for private schema chunk loads.');
  return new Pool(runtimePostgresPoolConfig(connectionString, 'meridian-enterprise-context-private-loader'));
}

async function insertRunPostgres(
  pool: Pool,
  schemaName: string,
  input: {
    clientId: string;
    tenantKey: string;
    sourceRoot: string;
    chunksPlanned: number;
  },
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `insert into ${quoteIdent(schemaName)}.data_ingestion_runs
      (client_id, tenant_key, source_label, source_root, status, summary)
     values ($1, $2, $3, $4, 'started', $5::jsonb)
     returning id`,
    [
      input.clientId,
      input.tenantKey,
      'Meridian Health enterprise context chunk load',
      input.sourceRoot,
      JSON.stringify({
        loader: 'enterprise-context-chunk-loader',
        target_schema: schemaName,
        chunks_planned: input.chunksPlanned,
        connection: 'private-postgres-schema',
      }),
    ],
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error('private_data_ingestion_run_missing_id');
  return id;
}

async function updateRunPostgres(
  pool: Pool,
  schemaName: string,
  runId: string,
  patch: {
    status: 'completed' | 'failed';
    chunksLoaded?: number;
    errorMessage?: string;
  },
): Promise<void> {
  await pool.query(
    `update ${quoteIdent(schemaName)}.data_ingestion_runs
       set status = $1,
           chunks_loaded = coalesce($2, chunks_loaded),
           summary = summary || $3::jsonb,
           completed_at = now(),
           error_message = $4
     where id = $5`,
    [
      patch.status,
      patch.chunksLoaded ?? null,
      JSON.stringify({
        chunks_loaded: patch.chunksLoaded ?? null,
        error_message: patch.errorMessage ?? null,
      }),
      patch.errorMessage ?? null,
      runId,
    ],
  );
}

async function upsertBatchPostgres(
  pool: Pool,
  schemaName: string,
  table: string,
  rows: DbRow[],
  conflictColumns: string[],
): Promise<number> {
  const batchSize = 250;
  const columns = Object.keys(rows[0] ?? {});
  if (columns.length === 0) return 0;
  const columnSql = columns.map(quoteIdent).join(', ');
  const conflictSql = conflictColumns.map(quoteIdent).join(', ');
  const updateSql = columns
    .filter((column) => !conflictColumns.includes(column))
    .map((column) => `${quoteIdent(column)} = excluded.${quoteIdent(column)}`)
    .join(', ');

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const values: unknown[] = [];
    const valueSql = batch.map((row) => {
      const placeholders = columns.map((column) => {
        values.push(row[column]);
        return `$${values.length}`;
      });
      return `(${placeholders.join(', ')})`;
    }).join(', ');
    await pool.query(
      `insert into ${quoteIdent(schemaName)}.${quoteIdent(table)} (${columnSql})
       values ${valueSql}
       on conflict (${conflictSql}) do update set ${updateSql}`,
      values,
    );
  }
  return rows.length;
}

function chunkDbRows(chunks: EnterpriseContextChunkRow[], clientId: string): DbRow[] {
  const now = new Date().toISOString();
  return chunks.map((chunk) => ({
    client_id: clientId,
    tenant_key: chunk.tenantKey,
    chunk_id: chunk.chunkId,
    source_segment_id: chunk.sourceSegmentId,
    source_record_id: chunk.sourceRecordId,
    source_doc: chunk.sourceDoc,
    source_path: chunk.sourcePath,
    chunk_index: chunk.chunkIndex,
    chunk_text: chunk.chunkText,
    token_count: chunk.tokenCount,
    embedding_status: chunk.embeddingStatus,
    embedding_model: null,
    embedded_at: null,
    embedding: null,
    embedding_dim: null,
    embedding_error: null,
    provenance: {
      ...chunk.provenance,
      chunk_hash: hashEnterpriseContextChunk(chunk),
    },
    chunk_metadata: chunk.chunkMetadata,
    updated_at: now,
  }));
}

async function applyChunks(
  chunks: EnterpriseContextChunkRow[],
  tenantKey: string,
  sourceRoot: string,
  schemaName: string | null,
): Promise<Record<string, number | string | null>> {
  if (schemaName) {
    const pool = getPostgresPool();
    const clientId = await ensureMeridianClientId();
    const runId = await insertRunPostgres(pool, schemaName, {
      clientId,
      tenantKey,
      sourceRoot,
      chunksPlanned: chunks.length,
    });
    try {
      const chunkCount = await upsertBatchPostgres(
        pool,
        schemaName,
        'enterprise_context_chunks',
        chunkDbRows(chunks, clientId),
        ['tenant_key', 'chunk_id'],
      );
      await updateRunPostgres(pool, schemaName, runId, {
        status: 'completed',
        chunksLoaded: chunkCount,
      });
      await pool.end();
      return { chunks: chunkCount, schema: schemaName };
    } catch (error) {
      await updateRunPostgres(pool, schemaName, runId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      await pool.end();
      throw error;
    }
  }

  const client = getClient(schemaName);
  const clientId = await ensureMeridianClientId();
  const runStart = await client
    .from('data_ingestion_runs')
    .insert({
      client_id: clientId,
      tenant_key: tenantKey,
      source_label: 'Meridian Health enterprise context chunk load',
      source_root: sourceRoot,
      status: 'started',
      summary: {
        loader: 'enterprise-context-chunk-loader',
        target_schema: schemaName ?? 'public',
        chunks_planned: chunks.length,
      },
    })
    .select('id')
    .single();
  if (runStart.error) throw new Error(`data_ingestion_runs insert failed: ${runStart.error.message}`);
  const runId = runStart.data.id as string;

  try {
    const chunkCount = await upsertBatch(
      client,
      'enterprise_context_chunks',
      chunkDbRows(chunks, clientId),
      'tenant_key,chunk_id',
    );
    const runComplete = await client
      .from('data_ingestion_runs')
      .update({
        status: 'completed',
        chunks_loaded: chunkCount,
        summary: {
          loader: 'enterprise-context-chunk-loader',
          target_schema: schemaName ?? 'public',
          chunks_loaded: chunkCount,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
    if (runComplete.error) throw new Error(`data_ingestion_runs update failed: ${runComplete.error.message}`);
    return { chunks: chunkCount, schema: schemaName ?? 'public' };
  } catch (error) {
    await client
      .from('data_ingestion_runs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
    throw error;
  }
}

async function main() {
  const args = parseArgs();
  const parsed = parseMeridianEnterpriseContextDataset(args.sourceRoot);
  const builtPlan = buildMeridianEnterpriseContextIngestionPlan(parsed);
  const plan = retargetEnterpriseContextIngestionPlan(builtPlan, args.tenantKey);
  const chunks = buildEnterpriseContextChunksFromPlan(plan, args.sourceRoot);
  const summary = {
    mode: args.apply ? 'apply' : 'dry-run',
    tenantKey: plan.tenantKey,
    sourceRoot: args.sourceRoot,
    targetSchema: args.schema ?? 'public',
    chunks: chunks.length,
    pendingEmbeddings: chunks.filter((chunk) => chunk.embeddingStatus === 'pending').length,
    recordTypes: [...new Set(chunks.map((chunk) => chunk.sourceSegmentId))].sort(),
  };

  if (!args.apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const applied = await applyChunks(chunks, plan.tenantKey, args.sourceRoot, args.schema);
  console.log(JSON.stringify({ ...summary, applied }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
