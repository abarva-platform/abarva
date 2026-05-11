import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

import {
  buildMeridianEnterpriseContextIngestionPlan,
  parseMeridianEnterpriseContextDataset,
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
};

type DbRow = Record<string, unknown>;

const DEFAULT_SOURCE_ROOT = path.resolve(process.cwd(), 'docs/enterprise-context/synthetic/meridian');

function parseArgs(): Args {
  const sourceArg = process.argv.find((arg) => arg.startsWith('--source='));
  return {
    apply: process.argv.includes('--apply'),
    sourceRoot: sourceArg ? path.resolve(sourceArg.split('=')[1] ?? '') : DEFAULT_SOURCE_ROOT,
  };
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to apply enterprise context chunks.');
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureMeridianClientId(client: SupabaseClient): Promise<string> {
  const existing = await client
    .from('clients')
    .select('id')
    .or('name.eq.Meridian Health,name.eq.Meridian Health System,legal_name.eq.Meridian Health System')
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

async function applyChunks(chunks: EnterpriseContextChunkRow[]): Promise<Record<string, number>> {
  const client = getClient();
  const clientId = await ensureMeridianClientId(client);
  return {
    chunks: await upsertBatch(client, 'enterprise_context_chunks', chunkDbRows(chunks, clientId), 'tenant_key,chunk_id'),
  };
}

async function main() {
  const args = parseArgs();
  const parsed = parseMeridianEnterpriseContextDataset(args.sourceRoot);
  const plan = buildMeridianEnterpriseContextIngestionPlan(parsed);
  const chunks = buildEnterpriseContextChunksFromPlan(plan, args.sourceRoot);
  const summary = {
    mode: args.apply ? 'apply' : 'dry-run',
    tenantKey: plan.tenantKey,
    sourceRoot: args.sourceRoot,
    chunks: chunks.length,
    pendingEmbeddings: chunks.filter((chunk) => chunk.embeddingStatus === 'pending').length,
    recordTypes: [...new Set(chunks.map((chunk) => chunk.sourceSegmentId))].sort(),
  };

  if (!args.apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const applied = await applyChunks(chunks);
  console.log(JSON.stringify({ ...summary, applied }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
