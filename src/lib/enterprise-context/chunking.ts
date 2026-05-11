import { createHash } from 'node:crypto';

import type {
  EnterpriseContextIngestionPlan,
  PlannedEnterpriseContextRecord,
} from './ingestion/meridian-loader';

export type EnterpriseContextChunkEmbeddingStatus = 'pending' | 'skipped' | 'embedded' | 'failed';

export interface EnterpriseContextChunkRow {
  tenantKey: string;
  chunkId: string;
  sourceSegmentId: string;
  sourceRecordId: string;
  sourceDoc: string;
  sourcePath: string;
  chunkIndex: number;
  chunkText: string;
  tokenCount: number;
  embeddingStatus: EnterpriseContextChunkEmbeddingStatus;
  provenance: {
    tenant_key: string;
    source_system: string;
    source_record_id: string;
    source_file: string;
    source_sheet: string;
    source_row_number: number;
    owner: string;
    last_validated_at: string;
    confidence: number;
    freshness_status: string;
    evidence_pointer: string;
    citation_label: string;
  };
  chunkMetadata: {
    chunk_schema: 'enterprise_context_record_v1';
    record_type: string;
    title: string;
    lifecycle_state: string;
    vector_status: 'vector_pending' | 'vector_embedded' | 'vector_failed';
    evidence_usable: boolean;
    payload_hash: string;
    searchable_fields: string[];
    source_file: string;
    source_sheet: string;
    source_row_number: number;
  };
}

export interface EnterpriseContextChunkRetrievalFilters {
  tenantKey?: string;
  recordTypes?: string[];
  sourceSystems?: string[];
  freshnessStatuses?: string[];
  minConfidence?: number;
  includeInactive?: boolean;
  limit?: number;
}

export interface EnterpriseContextChunkHit {
  chunk: EnterpriseContextChunkRow;
  score: number;
  vectorPending: boolean;
}

const MAX_FIELD_COUNT = 18;

export function buildEnterpriseContextChunksFromPlan(
  plan: EnterpriseContextIngestionPlan,
  sourceRoot: string,
): EnterpriseContextChunkRow[] {
  return plan.records.map((record) => buildChunk(record, sourceRoot));
}

export function retrieveEnterpriseContextChunksFromRows(
  chunks: EnterpriseContextChunkRow[],
  query: string,
  filters: EnterpriseContextChunkRetrievalFilters = {},
): EnterpriseContextChunkHit[] {
  const terms = queryTerms(query);
  return chunks
    .filter((chunk) => matchesFilters(chunk, filters))
    .map((chunk) => ({
      chunk,
      score: lexicalScore(chunk.chunkText, terms) + metadataBoost(chunk, terms),
      vectorPending: chunk.embeddingStatus !== 'embedded',
    }))
    .filter((hit) => hit.score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score || a.chunk.chunkId.localeCompare(b.chunk.chunkId))
    .slice(0, filters.limit ?? 12);
}

function buildChunk(record: PlannedEnterpriseContextRecord, sourceRoot: string): EnterpriseContextChunkRow {
  const searchable = searchableEntries(record).slice(0, MAX_FIELD_COUNT);
  const citationLabel = `${record.recordType} ${record.sourceRecordId} (${record.sourceFile} row ${record.sourceRowNumber})`;
  const chunkText = [
    `${record.title}.`,
    `Record type: ${record.recordType}.`,
    `Source: ${record.sourceSystem}; source record ${record.sourceRecordId}.`,
    `Owner: ${record.owner}.`,
    `Freshness: ${record.freshnessStatus}; confidence ${record.confidence.toFixed(2)}; last validated ${record.lastValidatedAt}.`,
    `Citation: ${citationLabel}.`,
    searchable.length ? `Known fields: ${searchable.map(([key, value]) => `${humanize(key)} = ${value}`).join('; ')}.` : '',
  ].filter(Boolean).join(' ');

  return {
    tenantKey: record.tenantKey,
    chunkId: `${record.canonicalRecordId}:summary:v1`,
    sourceSegmentId: record.recordType,
    sourceRecordId: record.sourceRecordId,
    sourceDoc: record.sourceFile,
    sourcePath: `${sourceRoot}/${record.sourceFile}`,
    chunkIndex: 0,
    chunkText,
    tokenCount: estimateTokens(chunkText),
    embeddingStatus: 'pending',
    provenance: {
      tenant_key: record.tenantKey,
      source_system: record.sourceSystem,
      source_record_id: record.sourceRecordId,
      source_file: record.sourceFile,
      source_sheet: record.sourceSheet,
      source_row_number: record.sourceRowNumber,
      owner: record.owner,
      last_validated_at: record.lastValidatedAt,
      confidence: record.confidence,
      freshness_status: record.freshnessStatus,
      evidence_pointer: record.evidencePointer,
      citation_label: citationLabel,
    },
    chunkMetadata: {
      chunk_schema: 'enterprise_context_record_v1',
      record_type: record.recordType,
      title: record.title,
      lifecycle_state: record.lifecycleState,
      vector_status: 'vector_pending',
      evidence_usable: record.payload.evidence_usable === 'true',
      payload_hash: record.payloadHash,
      searchable_fields: searchable.map(([key]) => key),
      source_file: record.sourceFile,
      source_sheet: record.sourceSheet,
      source_row_number: record.sourceRowNumber,
    },
  };
}

function searchableEntries(record: PlannedEnterpriseContextRecord): Array<[string, string]> {
  return Object.entries(record.payload)
    .filter(([key, value]) => (
      value !== undefined
      && value !== ''
      && !['source_system', 'source_record_id', 'source_owner', 'last_validated_date', 'confidence', 'evidence_usable'].includes(key)
    ))
    .map(([key, value]) => [key, String(value)] as [string, string]);
}

function matchesFilters(chunk: EnterpriseContextChunkRow, filters: EnterpriseContextChunkRetrievalFilters): boolean {
  if (filters.tenantKey && chunk.tenantKey !== filters.tenantKey) return false;
  if (!filters.includeInactive && chunk.chunkMetadata.lifecycle_state !== 'active') return false;
  if (filters.recordTypes?.length && !filters.recordTypes.includes(chunk.chunkMetadata.record_type)) return false;
  if (filters.sourceSystems?.length && !filters.sourceSystems.includes(chunk.provenance.source_system)) return false;
  if (filters.freshnessStatuses?.length && !filters.freshnessStatuses.includes(chunk.provenance.freshness_status)) return false;
  if (filters.minConfidence !== undefined && chunk.provenance.confidence < filters.minConfidence) return false;
  return true;
}

function queryTerms(query: string): string[] {
  return [...new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2))];
}

function lexicalScore(text: string, terms: string[]): number {
  if (!terms.length) return 0.1;
  const haystack = text.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0) / terms.length;
}

function metadataBoost(chunk: EnterpriseContextChunkRow, terms: string[]): number {
  const metadata = [
    chunk.chunkMetadata.record_type,
    chunk.chunkMetadata.title,
    chunk.provenance.owner,
    chunk.provenance.source_system,
  ].join(' ').toLowerCase();
  const hits = terms.filter((term) => metadata.includes(term)).length;
  return hits ? Math.min(0.35, hits * 0.08) : 0;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.25));
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ');
}

export function hashEnterpriseContextChunk(chunk: EnterpriseContextChunkRow): string {
  return createHash('sha256').update(JSON.stringify({
    chunkId: chunk.chunkId,
    text: chunk.chunkText,
    provenance: chunk.provenance,
    metadata: chunk.chunkMetadata,
  })).digest('hex');
}
