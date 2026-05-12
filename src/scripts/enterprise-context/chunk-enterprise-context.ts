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
  tenantKey: string;
};

type DbRow = Record<string, unknown>;

type ClientProfile = {
  tenantKey: string;
  sourceRoot: string;
  name: string;
  legalName: string;
  industryCode: string;
  slugs: string[];
  aliases: string[];
};

const CLIENT_PROFILES: Record<string, ClientProfile> = {
  meridian: {
    tenantKey: 'meridian',
    sourceRoot: 'docs/enterprise-context/synthetic/meridian',
    name: 'Meridian Health',
    legalName: 'Meridian Health System',
    industryCode: 'healthcare',
    slugs: ['meridian'],
    aliases: ['Meridian Health', 'Meridian Health System'],
  },
  apexretail: {
    tenantKey: 'apexretail',
    sourceRoot: 'docs/enterprise-context/synthetic/apexretail',
    name: 'Apex Retail',
    legalName: 'Apex Retail Group',
    industryCode: 'retail',
    slugs: ['apex-retail', 'apexretail'],
    aliases: ['Apex Retail', 'Apex Retail Group'],
  },
  arcturus: {
    tenantKey: 'arcturus',
    sourceRoot: 'docs/enterprise-context/synthetic/arcturus',
    name: 'First Capital',
    legalName: 'First Capital Financial Group',
    industryCode: 'financial_services',
    slugs: ['first-capital', 'first-capital-financial', 'arcturus'],
    aliases: ['First Capital', 'First Capital Financial', 'First Capital Financial Group', 'Brindlemark Financial'],
  },
};

function profileForTenant(tenantKey: string): ClientProfile {
  const profile = CLIENT_PROFILES[tenantKey];
  if (!profile) throw new Error(`Unsupported tenant ${tenantKey}. Expected one of: ${Object.keys(CLIENT_PROFILES).join(', ')}`);
  return profile;
}

function parseArgs(): Args {
  const sourceArg = process.argv.find((arg) => arg.startsWith('--source='));
  const tenantKey = process.argv.find((arg) => arg.startsWith('--tenant='))?.split('=')[1] ?? 'meridian';
  return {
    apply: process.argv.includes('--apply'),
    sourceRoot: sourceArg ? path.resolve(sourceArg.split('=')[1] ?? '') : path.resolve(process.cwd(), profileForTenant(tenantKey).sourceRoot),
    tenantKey,
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

async function findClientIdByColumn(client: SupabaseClient, column: string, values: string[]): Promise<string | null> {
  for (const value of values) {
    const existing = await client
      .from('clients')
      .select('id')
      .eq(column, value)
      .limit(1)
      .maybeSingle();
    if (existing.error) throw new Error(`Client lookup by ${column} failed: ${existing.error.message}`);
    if (existing.data?.id) return existing.data.id as string;
  }
  return null;
}

async function ensureClientId(client: SupabaseClient, tenantKey: string): Promise<string> {
  const profile = profileForTenant(tenantKey);
  const byTenant = await findClientIdByColumn(client, 'tenant_key', [profile.tenantKey]);
  if (byTenant) return byTenant;

  const bySlug = await findClientIdByColumn(client, 'slug', profile.slugs);
  if (bySlug) return bySlug;

  const byName = await findClientIdByColumn(client, 'name', profile.aliases);
  if (byName) return byName;

  const byLegalName = await findClientIdByColumn(client, 'legal_name', profile.aliases);
  if (byLegalName) return byLegalName;

  const inserted = await client
    .from('clients')
    .insert({
      name: profile.name,
      legal_name: profile.legalName,
      industry_code: profile.industryCode,
      slug: profile.slugs[0],
      tenant_key: profile.tenantKey,
    })
    .select('id')
    .single();
  if (inserted.error) throw new Error(`Client insert failed for ${tenantKey}: ${inserted.error.message}`);
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

async function applyChunks(chunks: EnterpriseContextChunkRow[], tenantKey: string): Promise<Record<string, number>> {
  const client = getClient();
  const clientId = await ensureClientId(client, tenantKey);
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

  const applied = await applyChunks(chunks, plan.tenantKey);
  console.log(JSON.stringify({ ...summary, applied }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
