import { getServerSupabase } from '@/lib/supabase-server';

export type IngestionStageName =
  | 'Upload Received'
  | 'Classified'
  | 'Parsed'
  | 'Mapped'
  | 'Validated'
  | 'Awaiting Approval'
  | 'Committed'
  | 'Available to Agents';

export interface TenantContextSummary {
  tenantKey: string;
  displayName: string;
  ingestionFilesCount: number;
  chunksCount: number;
  chunksEmbedded: number;
  chunksPending: number;
  chunksFailed: number;
  lastEmbeddedAt: string | null;
  embeddingProviders: string[];
  embeddingModels: string[];
  totalEmbeddingCalls: number;
}

export interface IngestionStageRow {
  stage: IngestionStageName;
  files: number;
  facts: number;
  issues: number;
  approved: number;
}

export interface TenantSourceFileRow {
  source_doc: string;
  chunk_count: number;
  first_loaded_at: string;
  sample_chunk_id: string;
}

export interface TenantEmbeddingHistoryRow {
  id: string;
  chunk_id: string;
  provider: string;
  model: string;
  policy_decision: string;
  created_at: string;
}

export interface TenantEvidenceMapRow {
  chunk_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding_status: string;
  embedded_at: string | null;
}

export interface TenantPendingChunkRow {
  chunk_id: string;
  source_doc: string;
  chunk_index: number;
  embedding_status: string;
  last_attempt_at: string | null;
  error_message: string | null;
}

type ClientRow = {
  id?: string | null;
  tenant_key?: string | null;
  slug?: string | null;
  name?: string | null;
};

type ContextChunkRow = {
  chunk_id?: string | null;
  source_doc?: string | null;
  chunk_index?: number | string | null;
  chunk_text?: string | null;
  embedding_status?: string | null;
  embedding_model?: string | null;
  embedded_at?: string | null;
  embedding_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  provenance?: Record<string, unknown> | null;
  chunk_metadata?: Record<string, unknown> | null;
};

type AuditRow = {
  id?: string | null;
  artifact_id?: string | null;
  provider?: string | null;
  model?: string | null;
  policy_decision?: string | null;
  created_at?: string | null;
  request_metadata?: Record<string, unknown> | null;
};

const CHUNK_SELECT = [
  'chunk_id',
  'source_doc',
  'chunk_index',
  'chunk_text',
  'embedding_status',
  'embedding_model',
  'embedded_at',
  'embedding_error',
  'created_at',
  'updated_at',
  'provenance',
  'chunk_metadata',
].join(',');

const AUDIT_SELECT = [
  'id',
  'artifact_id',
  'provider',
  'model',
  'policy_decision',
  'created_at',
  'request_metadata',
].join(',');

const STAGE_NAMES: IngestionStageName[] = [
  'Upload Received',
  'Classified',
  'Parsed',
  'Mapped',
  'Validated',
  'Awaiting Approval',
  'Committed',
  'Available to Agents',
];

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((a, b) => a.localeCompare(b));
}

function readMetadataString(
  row: Pick<ContextChunkRow, 'provenance' | 'chunk_metadata'>,
  keys: string[],
): string | null {
  for (const source of [row.provenance, row.chunk_metadata]) {
    if (!source) continue;
    for (const key of keys) {
      const value = asString(source[key]);
      if (value) return value;
    }
  }
  return null;
}

function loadedAt(row: ContextChunkRow): string {
  return (
    asString(row.created_at)
    ?? asString(row.embedded_at)
    ?? readMetadataString(row, ['loaded_at', 'imported_at', 'created_at', 'source_loaded_at'])
    ?? ''
  );
}

function statusOf(row: ContextChunkRow): string {
  return asString(row.embedding_status) ?? 'pending';
}

function latestIso(values: Array<string | null | undefined>): string | null {
  const sorted = values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a));
  return sorted[0] ?? null;
}

async function fetchClientRow(clientId: string): Promise<ClientRow | null> {
  const { data, error } = await getServerSupabase()
    .from('clients')
    .select('id,tenant_key,slug,name')
    .eq('id', clientId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as ClientRow;
}

async function fetchContextChunks(clientId: string): Promise<ContextChunkRow[]> {
  const { data, error } = await getServerSupabase()
    .from('enterprise_context_chunks')
    .select(CHUNK_SELECT)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as ContextChunkRow[];
}

async function fetchEmbeddingAudits(
  clientId: string,
  limit = 100,
): Promise<AuditRow[]> {
  const { data, error } = await getServerSupabase()
    .from('ai_egress_audit')
    .select(AUDIT_SELECT)
    .eq('tenant_id', clientId)
    .eq('workflow', 'substrate-loader-embed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AuditRow[];
}

export async function getTenantContextSummary(clientId: string): Promise<TenantContextSummary> {
  const [client, chunks, audits] = await Promise.all([
    fetchClientRow(clientId),
    fetchContextChunks(clientId),
    fetchEmbeddingAudits(clientId, 1000),
  ]);

  const embedded = chunks.filter((row) => statusOf(row) === 'embedded');
  const pending = chunks.filter((row) => statusOf(row) === 'pending');
  const failed = chunks.filter((row) => statusOf(row) === 'failed');
  const sourceDocs = uniqueSorted(chunks.map((row) => asString(row.source_doc)));

  return {
    tenantKey: asString(client?.tenant_key) ?? asString(client?.slug) ?? 'unknown',
    displayName: asString(client?.name) ?? 'Active client',
    ingestionFilesCount: sourceDocs.length,
    chunksCount: chunks.length,
    chunksEmbedded: embedded.length,
    chunksPending: pending.length,
    chunksFailed: failed.length,
    lastEmbeddedAt: latestIso(embedded.map((row) => row.embedded_at)),
    embeddingProviders: uniqueSorted(audits.map((row) => asString(row.provider))),
    embeddingModels: uniqueSorted([
      ...chunks.map((row) => asString(row.embedding_model)),
      ...audits.map((row) => asString(row.model)),
    ]),
    totalEmbeddingCalls: audits.length,
  };
}

export async function getTenantIngestionStages(clientId: string): Promise<IngestionStageRow[]> {
  const chunks = await fetchContextChunks(clientId);
  const files = uniqueSorted(chunks.map((row) => asString(row.source_doc))).length;
  const facts = chunks.length;
  const issues = chunks.filter((row) => statusOf(row) === 'failed').length;
  const approved = chunks.filter((row) => statusOf(row) === 'embedded').length;

  return STAGE_NAMES.map((stage) => ({
    stage,
    files,
    facts,
    issues,
    approved: stage === 'Upload Received' || stage === 'Classified' || stage === 'Parsed' || stage === 'Mapped' || stage === 'Validated'
      ? 0
      : approved,
  }));
}

export async function getTenantSourceFiles(
  clientId: string,
  opts: { limit?: number } = {},
): Promise<TenantSourceFileRow[]> {
  const chunks = await fetchContextChunks(clientId);
  const grouped = new Map<string, TenantSourceFileRow>();

  for (const row of chunks) {
    const sourceDoc = asString(row.source_doc) ?? 'unknown-source';
    const existing = grouped.get(sourceDoc);
    const rowLoadedAt = loadedAt(row);
    if (!existing) {
      grouped.set(sourceDoc, {
        source_doc: sourceDoc,
        chunk_count: 1,
        first_loaded_at: rowLoadedAt,
        sample_chunk_id: asString(row.chunk_id) ?? '',
      });
      continue;
    }
    existing.chunk_count += 1;
    if (!existing.first_loaded_at || (rowLoadedAt && Date.parse(rowLoadedAt) < Date.parse(existing.first_loaded_at))) {
      existing.first_loaded_at = rowLoadedAt;
    }
  }

  return [...grouped.values()]
    .sort((a, b) => b.chunk_count - a.chunk_count || a.source_doc.localeCompare(b.source_doc))
    .slice(0, opts.limit ?? 50);
}

export async function getTenantEmbeddingHistory(
  clientId: string,
  opts: { limit?: number } = {},
): Promise<TenantEmbeddingHistoryRow[]> {
  const audits = await fetchEmbeddingAudits(clientId, opts.limit ?? 100);
  return audits.map((row) => ({
    id: asString(row.id) ?? '',
    chunk_id: asString(row.request_metadata?.chunk_id) ?? asString(row.artifact_id) ?? '',
    provider: asString(row.provider) ?? 'unknown',
    model: asString(row.model) ?? 'unknown',
    policy_decision: asString(row.policy_decision) ?? 'unknown',
    created_at: asString(row.created_at) ?? '',
  }));
}

export async function getTenantEvidenceMapForFile(
  clientId: string,
  sourceDoc: string,
): Promise<TenantEvidenceMapRow[]> {
  const { data, error } = await getServerSupabase()
    .from('enterprise_context_chunks')
    .select('chunk_id,chunk_index,chunk_text,embedding_status,embedded_at')
    .eq('client_id', clientId)
    .eq('source_doc', sourceDoc)
    .order('chunk_index', { ascending: true });

  if (error || !data) return [];
  return (data as ContextChunkRow[]).map((row) => ({
    chunk_id: asString(row.chunk_id) ?? '',
    chunk_index: asNumber(row.chunk_index),
    chunk_text: asString(row.chunk_text) ?? '',
    embedding_status: statusOf(row),
    embedded_at: asString(row.embedded_at),
  }));
}

export async function getTenantPendingChunks(
  clientId: string,
  opts: { limit?: number } = {},
): Promise<TenantPendingChunkRow[]> {
  const { data, error } = await getServerSupabase()
    .from('enterprise_context_chunks')
    .select('chunk_id,source_doc,chunk_index,embedding_status,embedded_at,updated_at,embedding_error')
    .eq('client_id', clientId)
    .in('embedding_status', ['pending', 'failed'])
    .order('updated_at', { ascending: false })
    .limit(opts.limit ?? 100);

  if (error || !data) return [];
  return (data as ContextChunkRow[]).map((row) => ({
    chunk_id: asString(row.chunk_id) ?? '',
    source_doc: asString(row.source_doc) ?? 'unknown-source',
    chunk_index: asNumber(row.chunk_index),
    embedding_status: statusOf(row),
    last_attempt_at: asString(row.updated_at) ?? asString(row.embedded_at),
    error_message: asString(row.embedding_error),
  }));
}
