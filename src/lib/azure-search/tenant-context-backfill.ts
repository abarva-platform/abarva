import type { SearchDocument } from './types';

export type EnterpriseContextChunkRow = {
  readonly tenant_key: string;
  readonly chunk_id: string;
  readonly source_segment_id: string | null;
  readonly source_record_id: string | null;
  readonly source_doc: string | null;
  readonly source_path: string | null;
  readonly chunk_index: number | null;
  readonly chunk_text: string;
  readonly embedded_at: string | null;
  readonly provenance: Record<string, unknown> | null;
  readonly chunk_metadata: Record<string, unknown> | null;
};

const TENANT_KEY_ALIASES: Record<string, string> = {
  apexretail: 'apex-retail',
  arcturus: 'first-capital',
  meridian: 'meridian-health',
};

function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function tenantContextSearchId(tenantKey: string, chunkId: string): string {
  return Buffer.from(`${tenantKey}:${chunkId}`, 'utf-8').toString('base64url');
}

export function canonicalTenantKey(tenantKey: string): string {
  return TENANT_KEY_ALIASES[tenantKey] ?? tenantKey;
}

export function toTenantContextDeleteDocument(tenantKey: string, chunkId: string): SearchDocument {
  return {
    '@search.action': 'delete',
    id: tenantContextSearchId(tenantKey, chunkId),
  };
}

export function toTenantContextSearchDocument(
  row: EnterpriseContextChunkRow,
  now = new Date(),
): SearchDocument {
  const tenantKey = canonicalTenantKey(row.tenant_key);
  const metadata = row.chunk_metadata ?? {};
  const provenance = row.provenance ?? {};
  const sourceSegment = safeString(row.source_segment_id, 'unknown');
  const sourceDoc = safeString(row.source_doc, sourceSegment);
  const sourcePath = safeString(row.source_path, sourceDoc);
  const sensitivity = safeString(
    metadata.classification ?? metadata.sensitivity ?? provenance.classification,
    'internal',
  );

  return {
    '@search.action': 'upload',
    id: tenantContextSearchId(tenantKey, row.chunk_id),
    tenant_key: tenantKey,
    source_segment: sourceSegment,
    record_id: safeString(row.source_record_id, row.chunk_id),
    chunk_id: row.chunk_id,
    title: sourceDoc,
    body: row.chunk_text,
    source_uri: sourcePath,
    confidence: safeNumber(metadata.confidence ?? provenance.confidence, 0.8),
    sensitivity,
    last_seen_at: row.embedded_at ?? now.toISOString(),
  };
}
