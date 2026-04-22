import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

let _sb: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  }
  _sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _sb;
}

export type KnowledgeLicenseClass =
  | 'public_domain'
  | 'attribution'
  | 'registration'
  | 'fair_use_excerpt'
  | 'licensed';

export type KnowledgeContentType =
  | 'regulation'
  | 'framework'
  | 'benchmark'
  | 'research_report'
  | 'vendor_doc'
  | 'vendor_posture'
  | 'news_article'
  | 'case_study'
  | 'enforcement_action';

export interface SourceInput {
  source_key: string;
  title: string;
  publisher: string;
  publisher_url?: string;
  source_url: string;
  content_type: KnowledgeContentType;
  license_class: KnowledgeLicenseClass;
  license_notes?: string;
  industry_tags?: string[];
  topic_tags?: string[];
  published_at?: string;
  half_life_days?: number;
  pinecone_namespace: string;
}

export async function upsertSource(input: SourceInput): Promise<{ id: string; created: boolean }> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from('knowledge_sources')
    .select('id')
    .eq('source_key', input.source_key)
    .maybeSingle();

  if (existing?.id) {
    await sb
      .from('knowledge_sources')
      .update({
        title: input.title,
        publisher: input.publisher,
        publisher_url: input.publisher_url ?? null,
        source_url: input.source_url,
        content_type: input.content_type,
        license_class: input.license_class,
        license_notes: input.license_notes ?? null,
        industry_tags: input.industry_tags ?? [],
        topic_tags: input.topic_tags ?? [],
        published_at: input.published_at ?? null,
        half_life_days: input.half_life_days ?? 365,
        pinecone_namespace: input.pinecone_namespace,
      })
      .eq('id', existing.id);
    return { id: existing.id, created: false };
  }

  const id = randomUUID();
  const { error } = await sb.from('knowledge_sources').insert({
    id,
    source_key: input.source_key,
    title: input.title,
    publisher: input.publisher,
    publisher_url: input.publisher_url ?? null,
    source_url: input.source_url,
    content_type: input.content_type,
    license_class: input.license_class,
    license_notes: input.license_notes ?? null,
    industry_tags: input.industry_tags ?? [],
    topic_tags: input.topic_tags ?? [],
    published_at: input.published_at ?? null,
    half_life_days: input.half_life_days ?? 365,
    pinecone_namespace: input.pinecone_namespace,
    status: 'pending',
  });
  if (error) throw new Error(`upsertSource failed: ${error.message}`);
  return { id, created: true };
}

export async function markSourceStatus(
  sourceId: string,
  status: 'pending' | 'ingesting' | 'active' | 'stale' | 'failed' | 'licensed_hold',
  notes?: Record<string, unknown>,
): Promise<void> {
  const sb = getSupabase();
  const patch: Record<string, unknown> = { status };
  if (status === 'active') patch.last_ingested_at = new Date().toISOString();
  if (notes) patch.ingestion_notes = notes;
  await sb.from('knowledge_sources').update(patch).eq('id', sourceId);
}

export async function setChunkCount(sourceId: string, count: number, contentHash: string): Promise<void> {
  const sb = getSupabase();
  await sb
    .from('knowledge_sources')
    .update({ chunk_count: count, content_hash: contentHash })
    .eq('id', sourceId);
}

export interface ChunkRecord {
  source_id: string;
  pinecone_id: string;
  chunk_text: string;
  section?: string | null;
  page_number?: number | null;
  token_count?: number | null;
  chunk_metadata?: Record<string, unknown>;
}

export async function insertChunks(chunks: ChunkRecord[]): Promise<void> {
  if (chunks.length === 0) return;
  const sb = getSupabase();
  const rows = chunks.map((c) => ({
    source_id: c.source_id,
    pinecone_id: c.pinecone_id,
    chunk_text: c.chunk_text,
    section: c.section ?? null,
    page_number: c.page_number ?? null,
    token_count: c.token_count ?? null,
    chunk_metadata: c.chunk_metadata ?? {},
  }));
  const { error } = await sb.from('knowledge_chunks').insert(rows);
  if (error) throw new Error(`insertChunks failed: ${error.message}`);
}

export async function deleteChunksForSource(sourceId: string): Promise<void> {
  const sb = getSupabase();
  await sb.from('knowledge_chunks').delete().eq('source_id', sourceId);
}
