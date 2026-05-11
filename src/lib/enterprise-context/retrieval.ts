import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';

import {
  retrieveEnterpriseContextChunksFromRows,
  type EnterpriseContextChunkHit,
  type EnterpriseContextChunkRetrievalFilters,
  type EnterpriseContextChunkRow,
} from './chunking';

type DbChunkRow = {
  tenant_key: string;
  chunk_id: string;
  source_segment_id: string;
  source_record_id: string;
  source_doc: string;
  source_path: string;
  chunk_index: number;
  chunk_text: string;
  token_count: number | null;
  embedding_status: 'pending' | 'skipped' | 'embedded' | 'failed';
  provenance: Record<string, unknown> | null;
  chunk_metadata: Record<string, unknown> | null;
};

export async function retrieveEnterpriseContextChunks(args: {
  tenantKey: string;
  query: string;
  filters?: EnterpriseContextChunkRetrievalFilters;
}): Promise<EnterpriseContextChunkHit[]> {
  const { data, error } = await getServerSupabase()
    .from('enterprise_context_chunks')
    .select('tenant_key,chunk_id,source_segment_id,source_record_id,source_doc,source_path,chunk_index,chunk_text,token_count,embedding_status,provenance,chunk_metadata')
    .eq('tenant_key', args.tenantKey)
    .order('updated_at', { ascending: false })
    .limit(1200);

  if (error) {
    throw new Error(`enterprise_context_chunks retrieval failed: ${error.message}`);
  }

  return retrieveEnterpriseContextChunksFromRows(
    ((data ?? []) as DbChunkRow[]).map(toChunkRow),
    args.query,
    { ...args.filters, tenantKey: args.tenantKey },
  );
}

function toChunkRow(row: DbChunkRow): EnterpriseContextChunkRow {
  const provenance = row.provenance ?? {};
  const metadata = row.chunk_metadata ?? {};
  return {
    tenantKey: row.tenant_key,
    chunkId: row.chunk_id,
    sourceSegmentId: row.source_segment_id,
    sourceRecordId: row.source_record_id,
    sourceDoc: row.source_doc,
    sourcePath: row.source_path,
    chunkIndex: row.chunk_index,
    chunkText: row.chunk_text,
    tokenCount: row.token_count ?? 0,
    embeddingStatus: row.embedding_status,
    provenance: {
      tenant_key: String(provenance.tenant_key ?? row.tenant_key),
      source_system: String(provenance.source_system ?? ''),
      source_record_id: String(provenance.source_record_id ?? row.source_record_id),
      source_file: String(provenance.source_file ?? row.source_doc),
      source_sheet: String(provenance.source_sheet ?? ''),
      source_row_number: Number(provenance.source_row_number ?? 0),
      owner: String(provenance.owner ?? ''),
      last_validated_at: String(provenance.last_validated_at ?? ''),
      confidence: Number(provenance.confidence ?? 0),
      freshness_status: String(provenance.freshness_status ?? 'unknown'),
      evidence_pointer: String(provenance.evidence_pointer ?? ''),
      citation_label: String(provenance.citation_label ?? row.source_doc),
    },
    chunkMetadata: {
      chunk_schema: 'enterprise_context_record_v1',
      record_type: String(metadata.record_type ?? row.source_segment_id),
      title: String(metadata.title ?? row.source_record_id),
      lifecycle_state: String(metadata.lifecycle_state ?? 'active'),
      vector_status: metadata.vector_status === 'vector_embedded' || metadata.vector_status === 'vector_failed'
        ? metadata.vector_status
        : 'vector_pending',
      evidence_usable: Boolean(metadata.evidence_usable),
      payload_hash: String(metadata.payload_hash ?? ''),
      searchable_fields: Array.isArray(metadata.searchable_fields)
        ? metadata.searchable_fields.map(String)
        : [],
      source_file: String(metadata.source_file ?? row.source_doc),
      source_sheet: String(metadata.source_sheet ?? ''),
      source_row_number: Number(metadata.source_row_number ?? 0),
    },
  };
}
