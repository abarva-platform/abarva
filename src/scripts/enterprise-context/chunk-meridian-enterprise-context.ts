import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

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
  if (existing.data?.id) return existing.data.id as string;

  const inserted = await client
    .from('clients')
    .insert({ name: 'Meridian Health', legal_name: 'Meridian Health System', industry_code: 'healthcare' })
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
