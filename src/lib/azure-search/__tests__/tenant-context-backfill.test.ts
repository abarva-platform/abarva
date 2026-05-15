import { describe, expect, it } from '@jest/globals';
import {
  canonicalTenantKey,
  tenantContextSearchId,
  toTenantContextDeleteDocument,
  toTenantContextSearchDocument,
} from '../tenant-context-backfill';

describe('tenant context search backfill mapping', () => {
  it('maps enterprise_context_chunks rows into tenant-context-v1 documents', () => {
    const doc = toTenantContextSearchDocument({
      tenant_key: 'apex-retail',
      chunk_id: 'chunk-1',
      source_segment_id: 'enterprise_profile',
      source_record_id: 'rec-1',
      source_doc: 'enterprise_profile.csv',
      source_path: 'setup/enterprise_profile.csv',
      chunk_index: 0,
      chunk_text: 'Apex Retail synthetic context.',
      embedded_at: null,
      provenance: { confidence: 0.91 },
      chunk_metadata: { sensitivity: 'confidential' },
    }, new Date('2026-05-15T00:00:00.000Z'));

    expect(doc).toMatchObject({
      '@search.action': 'upload',
      id: tenantContextSearchId('apex-retail', 'chunk-1'),
      tenant_key: 'apex-retail',
      source_segment: 'enterprise_profile',
      record_id: 'rec-1',
      chunk_id: 'chunk-1',
      title: 'enterprise_profile.csv',
      body: 'Apex Retail synthetic context.',
      source_uri: 'setup/enterprise_profile.csv',
      confidence: 0.91,
      sensitivity: 'confidential',
      last_seen_at: '2026-05-15T00:00:00.000Z',
    });
  });

  it('uses a URL-safe stable key', () => {
    expect(tenantContextSearchId('first-capital', 'chunk/with:chars')).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('normalizes known legacy tenant aliases and can delete stale alias documents', () => {
    expect(canonicalTenantKey('arcturus')).toBe('first-capital');
    expect(canonicalTenantKey('meridian')).toBe('meridian-health');
    expect(canonicalTenantKey('apexretail')).toBe('apex-retail');
    expect(toTenantContextSearchDocument({
      tenant_key: 'arcturus',
      chunk_id: 'chunk-1',
      source_segment_id: 'it_financials',
      source_record_id: null,
      source_doc: null,
      source_path: null,
      chunk_index: 0,
      chunk_text: 'Legacy key row.',
      embedded_at: null,
      provenance: null,
      chunk_metadata: null,
    }).tenant_key).toBe('first-capital');
    expect(toTenantContextDeleteDocument('arcturus', 'chunk-1')).toEqual({
      '@search.action': 'delete',
      id: tenantContextSearchId('arcturus', 'chunk-1'),
    });
  });
});
